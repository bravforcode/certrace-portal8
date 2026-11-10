import { Prisma } from "../../generated/prisma/client";
import { fail } from "../../lib/errors";
import { canonical, type Json } from "../../lib/json";
import { reportSpecs } from "./catalogue";
import { profileSpec } from "../master-data/profile-contract";
import type { Shape } from "./shape";
import {
  bindMasters,
  nextMasterContext,
  type MasterContext,
} from "../master-data/storage";
export type Tx = Prisma.TransactionClient;
const containers = new Set(["object", "array", "map"]);
function bad(path: string, why: string): never {
  return fail(422, "INVALID_REPORT_INPUT", `${path}: ${why}`);
}
const dangerous = new Set(["__proto__", "prototype", "constructor"]);
const patterns = new Map<string, RegExp>();
function compiledPattern(source: string): RegExp {
  let re = patterns.get(source);
  if (!re) {
    re = new RegExp(source);
    patterns.set(source, re);
  }
  return re;
}
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
    if (s.maxItems !== undefined && value.length > s.maxItems)
      bad(path, `must have at most ${s.maxItems} items`);
    if (s.unique && new Set(value).size !== value.length)
      bad(path, "items must be unique");
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
    if (
      s.enum &&
      (value !== "" || s.arrayElement) &&
      !s.enum.includes(value as string | number | boolean)
    )
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
      typeof value === "string" &&
      s.maxLength !== undefined &&
      value.length > s.maxLength
    )
      bad(path, `must be at most ${s.maxLength} characters`);
    if (
      typeof value === "string" &&
      s.pattern &&
      (value !== "" || s.arrayElement) &&
      !compiledPattern(s.pattern).test(value)
    )
      bad(path, "invalid format");
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
/** Shared facts keep their existing account-scoped identities; payloads stay whole. */
async function bindDocumentMasters(
  tx: Tx,
  s: Shape,
  value: Json,
  slot: string,
  context: MasterContext,
) {
  context = nextMasterContext(s, slot, context);
  await bindMasters(tx, s, value, context);
  for (const [key, child, val] of children(s, value))
    await bindDocumentMasters(tx, child, val, key, context);
}
export async function insertDocument(
  tx: Tx,
  s: Shape,
  id: string,
  value: Json,
  context: MasterContext = {},
) {
  await bindDocumentMasters(tx, s, value, "root", context);
  await tx.$executeRaw`UPDATE reporting.records SET value=${JSON.stringify(value)}::jsonb WHERE id=${id}::uuid`;
}
export async function readDocuments(
  tx: Tx,
  ids: string[],
): Promise<Map<string, Json>> {
  if (!ids.length) return new Map();
  const rows = await tx.$queryRaw<
    { id: string; value: Json }[]
  >`SELECT id,value FROM reporting.records WHERE id=ANY(${ids}::uuid[])`;
  return new Map(rows.map((r) => [r.id, r.value]));
}
export const sameValue = (a: Json, b: Json) => canonical(a) === canonical(b);
