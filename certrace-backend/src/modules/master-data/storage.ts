import type { Prisma } from "../../generated/prisma/client";
import type { Shape } from "../reporting/shape";
import type { Json } from "../../lib/json";
import { bindings, versionColumn, type Binding } from "./definition";
type Tx = Prisma.TransactionClient;
export type MasterContext = { scope?: string; key?: string; publish?: boolean };
export async function bindMasters(
  tx: Tx,
  s: Shape,
  value: Json,
  ctx: MasterContext,
): Promise<Record<string, string>> {
  if (!bindings(s).length || value === null) return {};
  const rows = await tx.$queryRaw<
    { refs: Record<string, string> }[]
  >`SELECT masterdata.bind_row(${s.table!},${JSON.stringify(value)}::jsonb,${JSON.stringify(ctx)}::jsonb) AS refs`;
  return rows[0]!.refs;
}
export function nextMasterContext(
  s: Shape,
  slot: string,
  ctx: MasterContext,
): MasterContext {
  return s.scopeKey || s.table === "report_inputs_v1_rows"
    ? { ...ctx, scope: slot }
    : ctx;
}
export async function readMasterVersions(
  tx: Tx,
  s: Shape,
  rows: Record<string, unknown>[],
) {
  const out = new Map<string, Record<string, Json>>();
  for (const b of bindings(s)) {
    const ids = [
      ...new Set(
        rows
          .map((r) => r[b.via ? "_installation_version_id" : versionColumn(b)])
          .filter(Boolean),
      ),
    ] as string[];
    if (!ids.length) continue;
    if (b.via) {
      const data = await tx.$queryRawUnsafe<Record<string, any>[]>(
        `SELECT iv.id AS bridge,v.*,e.external_reference FROM masterdata.installation_versions iv JOIN masterdata.organization_versions v ON v.id=iv.operator_version_id JOIN masterdata.organizations e ON e.id=v.organization_id WHERE iv.id=ANY($1::uuid[])`,
        ids,
      );
      for (const version of data)
        out.set(b.role + ":" + version.bridge, version);
      continue;
    }
    const data = await tx.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT v.*, e.external_reference${b.kind === "installation" ? ", o.external_reference AS operator_reference" : ""} FROM masterdata.${b.kind}_versions v JOIN masterdata.${b.kind}s e ON e.id=v.${b.kind}_id ${b.kind === "installation" ? "LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations o ON o.id=ov.organization_id" : ""} WHERE v.id=ANY($1::uuid[])`,
      ids,
    );
    for (const version of data) out.set(b.role + ":" + version.id, version);
  }
  if (s.table === "workspace_profiles") {
    const ids = rows
      .map((r) => r._workspace_identity_id)
      .filter(Boolean) as string[];
    if (ids.length)
      for (const row of await tx.$queryRaw<
        { id: string; year: number }[]
      >`SELECT w.id,a.reporting_year AS year FROM masterdata.workspace_identities w JOIN masterdata.annual_reports a ON a.id=w.annual_report_id WHERE w.id=ANY(${ids}::uuid[])`)
        out.set("workspace:" + row.id, { year: row.year });
  }
  return out;
}
export function masterValue(
  b: Binding,
  target: string,
  version: Record<string, Json>,
): Json {
  const ref = String(version.external_reference ?? "");
  const operator =
    b.kind === "installation" ? String(version.operator_reference ?? "") : ref;
  if (target === "@reference") return ref;
  if (target === "@catalog") return ref.replace(/^catalog:/, "");
  if (target === "@supplier")
    return operator.startsWith("supplier:") ? operator.slice(9) : "";
  if (target === "@self") return operator === "self";
  return version[target] ?? null;
}
