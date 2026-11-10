import { Prisma } from "../../src/generated/prisma/client";
import { fail } from "../../src/lib/errors";
import { canonical, type Json } from "../../src/lib/json";
import { reportSpecs } from "../../src/modules/reporting/catalogue";
import { profileSpec } from "../../src/modules/master-data/profile-contract";
import type { Shape } from "../../src/modules/reporting/shape";
import {
  bindings,
  masterFields,
  versionColumn,
} from "../../src/modules/master-data/definition";
import {
  bindMasters,
  nextMasterContext,
  readMasterVersions,
  masterValue,
  type MasterContext,
} from "../../src/modules/master-data/storage";
export type Tx = Prisma.TransactionClient;
const containers = new Set(["object", "array", "map"]);
const quote = (name: string) => '"' + name.replaceAll('"', '""') + '"';
const table = (s: Shape) => `reporting.${quote(s.table!)}`;
function bad(path: string, why: string): never {
  return fail(422, "INVALID_REPORT_INPUT", `${path}: ${why}`);
}
const dangerous = new Set(["__proto__", "prototype", "constructor"]);
export function validateShape(
  s: Shape,
  value: unknown,
  path: string,
  scope?: string,
): void {
  if (value === undefined) {
    if (s.optional) return;
    bad(path, "missing field");
  }
  if (value === null) {
    if (s.nullable) return;
    bad(path, "cannot be null");
  }
  if (s.derived && value !== scope)
    bad(path, "must match the enclosing workspace");
  if (s.kind === "artifact") {
    JSON.stringify(value);
    return;
  }
  if (s.kind === "array") {
    if (!Array.isArray(value)) bad(path, "expected an array");
    if (value.length > 10000) bad(path, "too many rows");
    if (s.item?.fields?.id) {
      const ids = value.map((v) =>
        v && typeof v === "object"
          ? (v as Record<string, unknown>).id
          : undefined,
      );
      if (
        ids.some((id) => typeof id !== "string" || !id.trim()) ||
        new Set(ids).size !== ids.length
      )
        bad(path, "row IDs must be nonempty and unique");
    }
    for (const [i, item] of value.entries())
      validateShape(s.item!, item, `${path}[${i}]`, scope);
  } else if (s.kind === "object" || s.kind === "map") {
    if (!value || typeof value !== "object" || Array.isArray(value))
      bad(path, "expected an object");
    const obj = value as Record<string, unknown>;
    for (const k of Object.keys(obj)) {
      if (dangerous.has(k)) bad(path, "invalid key");
      const child = s.kind === "map" ? s.item : s.fields?.[k];
      if (!child) bad(`${path}.${k}`, "unrecognized field");
      validateShape(child, obj[k], `${path}.${k}`, child.scopeKey ? k : scope);
    }
    if (s.kind === "object")
      for (const [k, v] of Object.entries(s.fields!))
        if (!(k in obj)) validateShape(v, undefined, `${path}.${k}`, scope);
  } else {
    if (typeof value !== (s.kind === "decimalText" ? "string" : s.kind))
      bad(
        path,
        `expected ${s.kind === "decimalText" ? "a numeric string" : s.kind}`,
      );
    if (s.kind === "number" && !Number.isFinite(value))
      bad(path, "must be finite");
    if (
      s.kind === "decimalText" &&
      value !== "" &&
      (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value as string) ||
        !Number.isFinite(Number(value)))
    )
      bad(path, "invalid number");
    if (s.enum && !s.enum.includes(value as string | number | boolean))
      bad(path, "invalid option");
    if ((s.kind === "number" || s.kind === "decimalText") && value !== "") {
      if (s.min !== undefined && Number(value) < s.min)
        bad(path, `must be at least ${s.min}`);
      if (s.max !== undefined && Number(value) > s.max)
        bad(path, `must be at most ${s.max}`);
    }
    if (typeof value === "string" && value.length > 1000000)
      bad(path, "text is too long");
    if (
      s.format === "date" &&
      value !== "" &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(value as string) ||
        !Number.isFinite(Date.parse(value as string)) ||
        new Date(value as string).toISOString().slice(0, 10) !== value)
    )
      bad(path, "invalid calendar date");
    if (
      s.format === "month" &&
      value !== "" &&
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(value as string)
    )
      bad(path, "invalid month");
  }
}
export function storeSpec(key: string): Shape | undefined {
  const canonicalKey = key.replace(/^supplier:[A-Za-z0-9_-]+:/, "");
  return (
    (canonicalKey === "certrace:profile"
      ? profileSpec
      : reportSpecs[canonicalKey]) ??
    (canonicalKey.startsWith("certrace:report-snapshots:")
      ? reportSpecs["certrace:report-snapshots:*"]
      : undefined)
  );
}
export function validateStore(key: string, value: Json) {
  const spec = storeSpec(key);
  if (!spec) bad(key, "unsupported report store");
  if (value !== null) validateShape(spec, value, key);
  return spec;
}
type Row = Record<string, unknown> & {
  _id: string;
  _parent_id: string;
  _slot: string;
  _null: boolean;
};
function scalars(s: Shape): [string, Shape][] {
  return s.kind === "object"
    ? Object.entries(s.fields!).filter(([, v]) => !containers.has(v.kind))
    : !s.item
      ? [["_value", s]]
      : [];
}
function children(s: Shape, value: Json): [string, Shape, Json][] {
  if (value === null) return [];
  if (s.kind === "object")
    return Object.entries(s.fields!)
      .filter(
        ([k, v]) => containers.has(v.kind) && Object.hasOwn(value as object, k),
      )
      .map(([k, v]) => [k, v, (value as Record<string, Json>)[k]!]);
  if (s.kind === "array")
    return (value as Json[]).map((v, i) => [String(i), s.item!, v]);
  if (s.kind === "map")
    return Object.entries(value as Record<string, Json>).map(([k, v]) => [
      k,
      s.item!,
      v,
    ]);
  return [];
}
/** All identifiers come from the generated catalogue; all input values are bound parameters. */
export async function insertTree(
  tx: Tx,
  s: Shape,
  parent: string,
  value: Json,
  slot = "root",
  position = 0,
  context: MasterContext = {},
): Promise<void> {
  context = nextMasterContext(s, slot, context);
  const bound = masterFields(s);
  const refs = await bindMasters(tx, s, value, context);
  const cols = ["_parent_id", "_slot", "_null"];
  const vals: unknown[] = [parent, slot, value === null];
  for (const [col, id] of Object.entries(refs)) {
    cols.push(col);
    vals.push(id);
  }
  for (const [k, f] of scalars(s)) {
    const obj =
      s.kind === "object"
        ? (value as Record<string, Json> | null)
        : { _value: value };
    const present = obj !== null && Object.hasOwn(obj, k);
    let v: unknown = present ? obj![k] : null;
    if (bound.has(k) || (s.table === "workspace_profiles" && k === "year")) {
      cols.push("p_" + k);
      vals.push(present);
      continue;
    }
    if (f.derived) {
      if (f.optional) {
        cols.push("p_" + k);
        vals.push(present);
      }
      continue;
    }
    if (f.kind === "decimalText" && v === "") v = null;
    if (f.kind === "artifact" && v !== null) v = Buffer.from(JSON.stringify(v));
    cols.push("f_" + k, "p_" + k);
    vals.push(v ?? null, present);
  }
  const rows = await tx.$queryRawUnsafe<{ _id: string }[]>(
    `INSERT INTO ${table(s)} (${cols.map(quote).join(",")}) VALUES (${vals.map((_, i) => "$" + (i + 1)).join(",")}) RETURNING _id`,
    ...vals,
  );
  const id = rows[0]!._id;
  for (const [i, [key, child, val]] of children(s, value).entries())
    await insertTree(tx, child, id, val, key, i, context);
}
/** One query per populated table, batching all parents at a given level. */
export async function readTrees(
  tx: Tx,
  s: Shape,
  parents: string[],
  scopes = new Map<string, string>(),
): Promise<Map<string, { slot: string; position: number; value: Json }[]>> {
  const out = new Map<
    string,
    { slot: string; position: number; value: Json }[]
  >();
  if (!parents.length) return out;
  const rows = await tx.$queryRawUnsafe<Row[]>(
    `SELECT * FROM ${table(s)} WHERE _parent_id IN (${parents.map((_, i) => "$" + (i + 1) + "::uuid").join(",")}) ORDER BY ${s.arrayElement ? "_slot::integer" : "_slot"}`,
    ...parents,
  );
  if (!rows.length) return out;
  const masters = await readMasterVersions(tx, s, rows);
  const bound = masterFields(s);
  const ownScopes = new Map(
    rows.map((r) => [
      r._id,
      s.scopeKey ? r._slot : (scopes.get(r._parent_id) ?? ""),
    ]),
  );
  const nested = new Map<
    string,
    Map<string, { slot: string; position: number; value: Json }[]>
  >();
  if (s.kind === "object")
    for (const [k, v] of Object.entries(s.fields!))
      if (containers.has(v.kind))
        nested.set(
          k,
          await readTrees(
            tx,
            v,
            rows.filter((r) => !r._null).map((r) => r._id),
            ownScopes,
          ),
        );

  if (s.item)
    nested.set(
      "_items",
      await readTrees(
        tx,
        s.item,
        rows.filter((r) => !r._null).map((r) => r._id),
        ownScopes,
      ),
    );
  for (const row of rows) {
    let value: Json = null;
    if (!row._null) {
      if (s.kind === "object") {
        const obj: Record<string, Json> = {};
        for (const [k, f] of scalars(s))
          if (row["p_" + k] || (f.derived && !f.optional)) {
            if (f.derived) {
              obj[k] = ownScopes.get(row._id)!;
              continue;
            }
            if (s.table === "workspace_profiles" && k === "year") {
              obj[k] =
                masters.get("workspace:" + row._workspace_identity_id)?.year ??
                null;
              continue;
            }
            if (bound.has(k)) {
              for (const b of bindings(s)) {
                const version = masters.get(
                  b.role +
                    ":" +
                    row[b.via ? "_installation_version_id" : versionColumn(b)],
                );
                if (version && b.fields[k]) {
                  const v = masterValue(b, b.fields[k], version);
                  obj[k] = f.kind === "number" && v !== null ? Number(v) : v;
                }
              }
              continue;
            }
            const v = row["f_" + k];
            obj[k] =
              f.kind === "artifact" && v !== null
                ? JSON.parse(Buffer.from(v as Uint8Array).toString("utf8"))
                : f.kind === "number" && v !== null
                  ? Number(v)
                  : f.kind === "decimalText"
                    ? v === null
                      ? ""
                      : String(v)
                    : (v as Json);
          }
        for (const [k, items] of nested) {
          const child = items.get(row._id)?.[0];
          if (child) obj[k] = child.value;
        }
        value = obj;
      } else if (s.item) {
        const items = nested.get("_items")?.get(row._id) ?? [];
        value =
          s.kind === "array"
            ? items.map((x) => x.value)
            : Object.fromEntries(items.map((x) => [x.slot, x.value]));
      } else {
        const v = row.f__value;
        value =
          s.kind === "number" && v !== null
            ? Number(v)
            : s.kind === "decimalText"
              ? v === null
                ? ""
                : String(v)
              : (v as Json);
      }
    }
    const group = out.get(row._parent_id) ?? [];
    group.push({ slot: row._slot, position: Number(row._slot) || 0, value });
    out.set(row._parent_id, group);
  }
  return out;
}
export const sameValue = (a: Json, b: Json) => canonical(a) === canonical(b);
