import { object, array, string, canonical, type Json } from "../../lib/json";
import { fail } from "../../lib/errors";
import { storeSpec } from "../reporting/storage";
import { bindings, type Binding } from "./definition";
import type { Shape } from "../reporting/shape";
type Store = Map<string, Json>;
type Location = {
  operator?: string;
  entity: string;
  field: string;
  row: Record<string, Json>;
  source: string;
  path: string;
};
const company = (v: Record<string, Json>, installation = false) =>
  (installation ? v.self : v.selfSupplied)
    ? "self"
    : string(v.supplierId)
      ? "supplier:" + v.supplierId
      : "unassigned:" + (installation ? v.id : v.installationId);
function locations(stores: Store): Location[] {
  const out: Location[] = [];
  const ws = new Map(
    array(stores.get("certrace:workspaces")).map((v) => [
      string(object(v).id),
      object(v),
    ]),
  );
  const frozen = new Set(
    [...ws.values()]
      .filter((w) => w.internalSignoff || w.verifierSignoff)
      .map((w) => string(w.id)),
  );
  for (const [key, value] of stores) {
    if (
      key.includes("versions") ||
      key.includes("snapshot") ||
      key.startsWith("supplier:")
    )
      continue;
    const spec = storeSpec(key);
    if (!spec || value === null) continue;
    function visit(s: Shape, v: Json, scope: string, path: string) {
      if (v === null) return;
      if (scope && frozen.has(scope) && key !== "certrace:workspaces") return;
      const row = object(v),
        t = s.table;
      const workspace = t === "workspace_profiles" ? row : ws.get(scope);
      if (t === "workspace_profiles" && frozen.has(string(row.id))) return;
      let org = scope.startsWith("company:")
        ? scope === "company:self"
          ? "self"
          : "supplier:" + scope.slice(8)
        : workspace
          ? company(workspace)
          : "workspace:" + scope;
      let inst = workspace
        ? string(workspace.installationId)
        : "workspace:" + scope;
      let product = workspace ? "catalog:" + workspace.productId : "";
      if (t === "account_profile") org = "self";
      if (t === "installation_profiles") {
        org = company(row, true);
        inst = string(row.id);
      }
      if (t === "supplier_company_profiles") org = "supplier:" + row.id;
      if (t === "precursor_sources") {
        org = row.supplierCompanyId
          ? "supplier:" + row.supplierCompanyId
          : "precursor:" + scope + ":" + row.id;
        inst = string(row.installationUniqueId) || org + ":plant";
        product = row.catalogProductId
          ? "catalog:" + row.catalogProductId
          : "precursor:" + scope + ":" + row.id;
      }
      if (
        s.fields?.benchmark &&
        s.fields?.cnCode &&
        row.id !== scope + ":product:0"
      )
        product = "good:" + scope + ":" + row.id;
      for (const b of bindings(s))
        for (const [source, field] of Object.entries(b.fields)) {
          if (field.startsWith("@") || !Object.hasOwn(row, source)) continue;
          const ref =
            b.role === "exporter"
              ? "self"
              : b.kind === "organization"
                ? org
                : b.kind === "installation"
                  ? inst
                  : product;
          if (ref)
            out.push({
              operator: b.kind === "installation" ? org : undefined,
              entity: b.kind + ":" + ref,
              field,
              row,
              source,
              path: path + "." + source,
            });
        }
      if (s.fields)
        for (const [k, child] of Object.entries(s.fields))
          if (child.table && Object.hasOwn(row, k))
            visit(child, row[k]!, scope, path + "." + k);
      if (s.item)
        for (const [k, item] of Object.entries(v as object))
          visit(
            s.item,
            item as Json,
            s.item.scopeKey || s.item.table === "report_inputs_v1_rows"
              ? k
              : scope,
            path +
              "." +
              (Array.isArray(v) && object(item as Json).id
                ? object(item as Json).id
                : k),
          );
    }
    visit(spec, value, "", key);
  }
  return out;
}
/** Consolidate by stable identity, never by spelling. Only intentional changed fields become shared edits. */
export function consolidate(before: Store, input: Store): Store {
  const result = new Map([...input].map(([k, v]) => [k, structuredClone(v)]));
  const old = locations(before),
    next = locations(result),
    oldByPath = new Map(old.map((l) => [l.path, l]));
  const facts = new Map<string, Json>(),
    patches = new Map<string, Json>();
  // Existing coherent values form the baseline. Incomplete blanks don't override known facts.
  for (const l of old) {
    const k = l.entity + "|" + l.field,
      v = l.row[l.source]!;
    if (v !== "" && v !== null) {
      if (facts.has(k) && canonical(facts.get(k)!) !== canonical(v))
        fail(
          409,
          "MASTER_DATA_CONFLICT",
          `Conflicting existing ${l.entity} ${l.field}. Reconcile the shared identity before editing it.`,
        );
      facts.set(k, v);
    } else if (!facts.has(k)) facts.set(k, v);
  }
  for (const l of next) {
    const k = l.entity + "|" + l.field,
      v = l.row[l.source]!,
      previous = oldByPath.get(l.path);
    if (
      previous &&
      previous.entity === l.entity &&
      canonical(previous.row[previous.source]!) === canonical(v)
    )
      continue;
    if (!previous && (v === "" || v === null) && facts.has(k)) continue;
    if (patches.has(k) && canonical(patches.get(k)!) !== canonical(v))
      fail(
        409,
        "MASTER_DATA_CONFLICT",
        `The same ${l.entity} ${l.field} was given two different values in this save.`,
      );
    patches.set(k, v);
  }
  for (const [k, v] of patches) facts.set(k, v);
  for (const l of next)
    if (facts.has(l.entity + "|" + l.field))
      l.row[l.source] = facts.get(l.entity + "|" + l.field)!;
  return result;
}
export const masterWriteOrder = (key: string) =>
  key === "certrace:profile"
    ? 0
    : key === "certrace:supplier-companies"
      ? 1
      : key === "certrace:installations"
        ? 2
        : key === "certrace:workspaces"
          ? 3
          : 4;

export async function prepareMasters(
  tx: import("../reporting/storage").Tx,
  stores: Store,
) {
  const grouped = new Map<string, Record<string, Json>>(),
    operators = new Map<string, string>();
  for (const l of locations(stores)) {
    const fields = grouped.get(l.entity) ?? {};
    fields[l.field] = l.row[l.source]!;
    grouped.set(l.entity, fields);
    if (l.operator) {
      const previous = operators.get(l.entity);
      if (previous && previous !== l.operator)
        fail(
          409,
          "MASTER_DATA_CONFLICT",
          "An installation cannot have two current operators.",
        );
      operators.set(l.entity, l.operator);
    }
  }
  const organizationVersions = new Map<string, string>();
  async function resolve(
    kind: string,
    ref: string,
    fields: Record<string, Json>,
  ) {
    const rows = await tx.$queryRaw<
      { id: string }[]
    >`SELECT masterdata.resolve_version(${kind},${ref},${JSON.stringify(fields)}::jsonb,true) AS id`;
    return rows[0]!.id;
  }
  for (const [entity, fields] of grouped)
    if (entity.startsWith("organization:"))
      organizationVersions.set(
        entity.slice(13),
        await resolve("organization", entity.slice(13), fields),
      );
  for (const [entity, fields] of grouped) {
    if (entity.startsWith("organization:")) continue;
    const split = entity.indexOf(":"),
      kind = entity.slice(0, split),
      ref = entity.slice(split + 1);
    if (kind === "installation") {
      const operator = operators.get(entity)!;
      let version = organizationVersions.get(operator);
      if (!version) {
        version = await resolve("organization", operator, {});
        organizationVersions.set(operator, version);
      }
      fields.operator_version_id = version;
    }
    await resolve(kind, ref, fields);
  }
}
export function patchMaster(
  stores: Store,
  kind: string,
  reference: string,
  fields: Record<string, Json>,
): Store {
  const candidate = new Map(
    [...stores].map(([k, v]) => [k, structuredClone(v)]),
  );
  for (const l of locations(candidate))
    if (l.entity === kind + ":" + reference && Object.hasOwn(fields, l.field))
      l.row[l.source] = fields[l.field]!;
  return candidate;
}
