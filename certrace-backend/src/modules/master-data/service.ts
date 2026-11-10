import { db } from "../../lib/db";
import { fail } from "../../lib/errors";
import { canonical, type Json } from "../../lib/json";
import {
  assumeOwner,
  lockOwner,
  migrateInTransaction,
  currentRows,
  writeRevision,
} from "../reporting/service";
import { validateRelations } from "../reporting/validation";
import { validateStore } from "../reporting/storage";
import {
  consolidate,
  patchMaster,
  prepareMasters,
  masterWriteOrder,
} from "./consolidation";
import { entities, type EntityKind } from "./definition";
export type MasterRecord = {
  id: string;
  reference: string;
  version: number;
  fields: Record<string, string | null>;
};
async function rows(
  tx: import("../reporting/storage").Tx,
  kind: EntityKind,
): Promise<MasterRecord[]> {
  const result = await tx.$queryRawUnsafe<Record<string, any>[]>(
    `SELECT e.id,e.external_reference,v.* FROM masterdata.${kind}s e JOIN masterdata.${kind}_heads h ON h.${kind}_id=e.id JOIN masterdata.${kind}_versions v ON v.id=h.version_id ORDER BY e.external_reference`,
  );
  return result.map((r) => ({
    id: r[kind + "_id"],
    reference: r.external_reference,
    version: r.version_no,
    fields: Object.fromEntries(
      Object.keys(entities[kind]).map((k) => [k, r[k] ?? null]),
    ),
  }));
}
export async function listMasters(userId: string) {
  return db.$transaction(
    async (tx) => {
      await lockOwner(tx, userId);
      await migrateInTransaction(tx, userId);
      return {
        organizations: await rows(tx, "organization"),
        installations: await rows(tx, "installation"),
        products: await rows(tx, "product"),
        reports: await tx.$queryRaw<
          { id: string; installationId: string; year: number }[]
        >`SELECT id,installation_id AS "installationId",reporting_year AS year FROM masterdata.annual_reports ORDER BY reporting_year`,
      };
    },
    { timeout: 120000 },
  );
}
export async function updateMaster(
  userId: string,
  kind: EntityKind,
  id: string,
  revision: number,
  fields: Record<string, Json>,
  actorId = userId,
) {
  if (
    !Object.keys(fields).length ||
    Object.keys(fields).some((k) => !(k in entities[kind]))
  )
    fail(422, "INVALID_MASTER_FIELD", "Choose supported master fields.");
  return db.$transaction(
    async (tx) => {
      await lockOwner(tx, userId);
      await migrateInTransaction(tx, userId);
      const master = (await rows(tx, kind)).find((r) => r.id === id);
      if (!master)
        fail(
          404,
          "MASTER_NOT_FOUND",
          "That master record is not in this account.",
        );
      if (master.version !== revision)
        fail(
          409,
          "REVISION_CONFLICT",
          "This master record changed. Reload before saving.",
        );
      const current = await currentRows(tx, userId),
        before = new Map(current.map((r) => [r.key, r.value]));
      const all = consolidate(
        before,
        patchMaster(before, kind, master.reference, fields),
      );
      const changed = [...all].filter(
        ([key, value]) =>
          canonical(before.get(key) ?? null) !== canonical(value),
      );
      if (actorId !== userId) {
        if (changed.some(([key]) => key === "certrace:profile"))
          fail(
            403,
            "OWNER_REQUIRED",
            "Only the owner can change the company profile.",
          );
        await tx.$queryRaw`SELECT set_config('certrace.actor_id', ${actorId}, true)`;
      }
      for (const [key, value] of changed) {
        validateStore(key, value);
        validateRelations(key, value, all);
      }
      await prepareMasters(tx, all);
      const records = [];
      for (const [key, value] of changed.sort(
        ([a], [b]) => masterWriteOrder(a) - masterWriteOrder(b),
      ))
        records.push(
          await writeRevision(
            tx,
            userId,
            key,
            value,
            current.find((r) => r.key === key)!.revision,
          ),
        );
      await tx.$queryRaw`SELECT masterdata.resolve_version(${kind},${master.reference},${JSON.stringify(fields)}::jsonb,true)`;
      return {
        master: (await rows(tx, kind)).find((r) => r.id === id)!,
        records,
      };
    },
    { timeout: 120000 },
  );
}
