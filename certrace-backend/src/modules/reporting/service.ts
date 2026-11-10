import { db } from "../../lib/db";
import { config } from "../../lib/config";
import { fail } from "../../lib/errors";
import { canonical, array, object, type Json } from "../../lib/json";
import { hash } from "../../lib/security";
import {
  registrationQuestionsComplete,
  syncRegistrationSheet,
} from "../../lib/registration-sheet";
import type { ProfileValues } from "../master-data/profile-contract";
import { reportSpecs } from "./catalogue";
import {
  insertDocument,
  readDocuments,
  storeSpec,
  validateStore,
  type Tx,
} from "./storage";
import { validateRelations } from "./validation";
import {
  consolidate,
  masterWriteOrder,
  prepareMasters,
} from "../master-data/consolidation";
export type StoredReport = { key: string; value: Json; revision: number };
type Head = { id: string; key: string; revision: number; is_null: boolean };
export const isReportKey = (key: string) =>
  key.startsWith("certrace:") && !!storeSpec(key);
export async function assumeOwner(tx: Tx, userId: string) {
  await tx.$queryRaw`SELECT set_config('certrace.user_id', ${userId}, true)`;
  await tx.$executeRawUnsafe("SET LOCAL ROLE certrace_reporting");
}
export async function lockOwner(tx: Tx, userId: string) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 18276))::text`;
}
export async function currentRows(
  tx: Tx,
  userId: string,
): Promise<StoredReport[]> {
  const heads = await tx.$queryRaw<
    Head[]
  >`SELECT r.id,r.key,r.revision,r.is_null FROM reporting.records r JOIN reporting.record_heads h USING(user_id,key,revision) WHERE r.user_id=${userId}::uuid ORDER BY r.key`;
  const out: StoredReport[] = [];
  for (const h of heads) {
    if (h.key.startsWith("supplier:")) continue;
    const spec = storeSpec(h.key);
    if (!spec) continue;
    const stored = h.is_null
      ? null
      : ((await readDocuments(tx, [h.id])).get(h.id) ?? null);
    out.push({
      key: h.key,
      revision: h.revision,
      value:
        h.key === "certrace:profile" ? normalizeLegacy(h.key, stored) : stored,
    });
  }
  return out;
}
export async function writeRevision(
  tx: Tx,
  userId: string,
  key: string,
  value: Json,
  revision: number,
): Promise<StoredReport> {
  validateStore(key, value);
  const previous = await tx.$queryRaw<
    { revision: number }[]
  >`SELECT revision FROM reporting.record_heads WHERE user_id=${userId}::uuid AND key=${key} FOR UPDATE`;
  if ((previous[0]?.revision ?? 0) !== revision)
    fail(
      409,
      "REVISION_CONFLICT",
      "These report inputs changed in another tab. Reload before saving again.",
    );
  // A restored/selected head may be older than another retained historical revision.
  const versions = await tx.$queryRaw<
    { revision: number }[]
  >`SELECT coalesce(max(revision),0)+1 AS revision FROM reporting.records WHERE user_id=${userId}::uuid AND key=${key}`;
  const next = versions[0]!.revision;
  const records = await tx.$queryRaw<
    { id: string }[]
  >`INSERT INTO reporting.records(user_id,key,revision,is_null) VALUES(${userId}::uuid,${key},${next},${value === null}) RETURNING id`;
  const id = records[0]!.id;
  if (value !== null)
    await insertDocument(tx, storeSpec(key)!, id, value, {
      key,
      publish: !key.startsWith("supplier:") && !key.includes("versions"),
    });
  await tx.$executeRaw`UPDATE reporting.records SET sealed=true WHERE id=${id}::uuid`;
  await tx.$executeRaw`INSERT INTO reporting.record_heads(user_id,key,revision) VALUES(${userId}::uuid,${key},${next}) ON CONFLICT(user_id,key) DO UPDATE SET revision=EXCLUDED.revision`;
  return { key, value, revision: next };
}
/** Backfill preserves the complete source revision and verifies its round trip before deleting it.
 * A malformed legacy record aborts the transaction; it is never silently discarded.
 */
export async function migrateInTransaction(tx: Tx, userId: string) {
  const legacy = await tx.account_records.findMany({
    where: {
      user_id: userId,
      OR: [
        { key: { in: [...Object.keys(reportSpecs), "certrace:profile"] } },
        { key: { startsWith: "certrace:report-snapshots:" } },
      ],
    },
  });
  await assumeOwner(tx, userId);
  if (!legacy.length) return;
  for (const row of legacy.sort(
    (a, b) => masterWriteOrder(a.key) - masterWriteOrder(b.key),
  )) {
    const existing = await tx.$queryRaw<
      { revision: number }[]
    >`SELECT revision FROM reporting.record_heads WHERE user_id=${userId}::uuid AND key=${row.key}`;
    if (existing.length)
      fail(
        409,
        "REPORT_MIGRATION_CONFLICT",
        `Both legacy and relational records exist for ${row.key}; reconcile them before continuing.`,
      );
    const value = normalizeLegacy(row.key, row.value);
    validateStore(row.key, value);
    const ids = await tx.$queryRaw<
      { id: string }[]
    >`INSERT INTO reporting.records(user_id,key,revision,is_null) VALUES(${userId}::uuid,${row.key},${row.revision},${value === null}) RETURNING id`;
    const id = ids[0]!.id;
    if (value !== null)
      await insertDocument(tx, storeSpec(row.key)!, id, value, {
        key: row.key,
        publish: !row.key.includes("versions"),
      });
    const restored =
      value === null ? null : (await readDocuments(tx, [id])).get(id);
    if (restored === undefined || canonical(restored) !== canonical(value))
      fail(
        500,
        "REPORT_MIGRATION_MISMATCH",
        `Round-trip verification failed for ${row.key}. Source retained.`,
      );
    await tx.$executeRaw`UPDATE reporting.records SET sealed=true WHERE id=${id}::uuid`;
    await tx.$executeRaw`INSERT INTO reporting.record_heads(user_id,key,revision) VALUES(${userId}::uuid,${row.key},${row.revision})`;
    await tx.$executeRaw`INSERT INTO reporting.migration_receipts(user_id,key,source_revision,source_sha256) VALUES(${userId}::uuid,${row.key},${row.revision},${hash(canonical(row.value))})`;
  }
  await tx.$executeRawUnsafe("RESET ROLE");
  await tx.account_records.deleteMany({
    where: { user_id: userId, key: { in: legacy.map((r) => r.key) } },
  });
  await assumeOwner(tx, userId);
}
function normalizeLegacy(key: string, value: Json): Json {
  if (
    key === "certrace:profile" &&
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    // These are session projections, not editable profile facts. Authentication remains authoritative.
    const copy = { ...value };
    for (const k of ["id", "email", "googleLinked", "planId", "trialStartedAt"])
      delete copy[k];
    return copy;
  }
  if (
    key !== "certrace:report-inputs:v1" ||
    !value ||
    Array.isArray(value) ||
    typeof value !== "object"
  )
    return value;
  const copy = structuredClone(value);
  for (const scope of Object.values(copy)) {
    if (!scope || typeof scope !== "object" || Array.isArray(scope)) continue;
    const answer = scope["2.4.30"];
    if (
      !answer ||
      typeof answer !== "object" ||
      Array.isArray(answer) ||
      !Array.isArray(answer.rows)
    )
      continue;
    for (const row of answer.rows) {
      if (!row || typeof row !== "object" || Array.isArray(row)) continue;
      const v = row.values;
      if (!v || typeof v !== "object" || Array.isArray(v)) continue;
      if (
        typeof v.basis === "string" &&
        !["", "default_period", "actual_production"].includes(v.basis) &&
        v.explanation === undefined
      ) {
        v.explanation = v.basis;
        v.basis = "";
      }
    }
  }
  return copy;
}
export async function listReports(userId: string) {
  return db.$transaction(
    async (tx) => {
      await lockOwner(tx, userId);
      await migrateInTransaction(tx, userId);
      return currentRows(tx, userId);
    },
    { timeout: 120000 },
  );
}
export async function saveReport(
  userId: string,
  key: string,
  value: Json,
  revision: number,
  actorId = userId,
) {
  const result = await saveReportBatch(
    userId,
    [{ key, value, revision }],
    undefined,
    actorId,
  );
  return {
    ...result.records.find((r) => r.key === key)!,
    records: result.records,
  };
}

export async function importReports(
  userId: string,
  rows: { key: string; value: Json }[],
) {
  return db.$transaction(
    async (tx) => {
      await lockOwner(tx, userId);
      await migrateInTransaction(tx, userId);
      const current = await currentRows(tx, userId);
      const known = new Set(current.map((r) => r.key));
      const values = new Map(current.map((r) => [r.key, r.value]));
      for (const r of rows) if (!known.has(r.key)) values.set(r.key, r.value);
      const coherent = consolidate(
        new Map(current.map((r) => [r.key, r.value])),
        values,
      );
      await prepareMasters(tx, coherent);
      let imported = 0;
      for (const [key, value] of [...coherent].sort(
        ([a], [b]) => masterWriteOrder(a) - masterWriteOrder(b),
      )) {
        const old = current.find((r) => r.key === key);
        if (old && canonical(old.value) === canonical(value)) continue;
        validateStore(key, value);
        validateRelations(key, value, coherent);
        await writeRevision(tx, userId, key, value, old?.revision ?? 0);
        if (!old) imported++;
      }
      return imported;
    },
    { timeout: 120000 },
  );
}

export async function readRecord(
  tx: Tx,
  userId: string,
  key: string,
): Promise<StoredReport | undefined> {
  const rows = await tx.$queryRaw<
    Head[]
  >`SELECT r.id,r.key,r.revision,r.is_null FROM reporting.records r JOIN reporting.record_heads h USING(user_id,key,revision) WHERE r.user_id=${userId}::uuid AND r.key=${key}`;
  const h = rows[0];
  if (!h) return undefined;
  const s = storeSpec(key);
  if (!s) return undefined;
  const stored = h.is_null
    ? null
    : ((await readDocuments(tx, [h.id])).get(h.id) ?? null);
  return {
    key,
    revision: h.revision,
    value: key === "certrace:profile" ? normalizeLegacy(key, stored) : stored,
  };
}

export async function saveReportBatch(
  userId: string,
  changes: { key: string; value: Json; revision: number }[],
  afterSave?: (tx: Tx) => Promise<void>,
  actorId = userId,
) {
  const keys = new Set<string>();
  for (const c of changes) {
    if (!isReportKey(c.key) || keys.has(c.key))
      fail(
        422,
        "INVALID_REPORT_BATCH",
        "Report keys must be supported and unique.",
      );
    keys.add(c.key);
    validateStore(c.key, c.value);
  }
  const result = await db.$transaction(
    async (tx) => {
      await lockOwner(tx, userId);
      await migrateInTransaction(tx, userId);
      const current = await currentRows(tx, userId);
      const previous = new Map(current.map((r) => [r.key, r.value]));
      if (actorId !== userId) {
        for (const c of changes) {
          if (c.key === "certrace:profile")
            fail(
              403,
              "OWNER_REQUIRED",
              "Only the owner can change the company profile.",
            );
          if (c.key === "certrace:workspaces") {
            const ids = new Set(array(c.value).map((row) => object(row).id));
            if (
              array(previous.get(c.key)).some((row) => !ids.has(object(row).id))
            )
              fail(
                403,
                "OWNER_REQUIRED",
                "Only the owner can delete a product report.",
              );
          }
        }
        await tx.$queryRaw`SELECT set_config('certrace.actor_id', ${actorId}, true)`;
      }
      const candidate = new Map(previous);
      for (const c of changes) candidate.set(c.key, c.value);
      const all = consolidate(previous, candidate);
      if (
        actorId !== userId &&
        canonical(previous.get("certrace:profile") ?? null) !==
          canonical(all.get("certrace:profile") ?? null)
      )
        fail(
          403,
          "OWNER_REQUIRED",
          "Only the owner can change the company profile.",
        );
      for (const c of changes) {
        if (
          (current.find((r) => r.key === c.key)?.revision ?? 0) !== c.revision
        )
          fail(
            409,
            "REVISION_CONFLICT",
            "Report inputs changed in another tab. Reload before saving again.",
          );
        const context = new Map(all);
        if (previous.has(c.key)) context.set(c.key, previous.get(c.key)!);
        else context.delete(c.key);
        validateRelations(c.key, all.get(c.key)!, context);
      }
      const records: StoredReport[] = [];
      const requested = new Set(changes.map((c) => c.key));
      const updates = [...all].filter(
        ([key, value]) =>
          requested.has(key) ||
          canonical(previous.get(key) ?? null) !== canonical(value),
      );
      for (const [key, value] of updates) {
        validateStore(key, value);
        validateRelations(key, value, all);
      }
      await prepareMasters(tx, all);
      for (const [key, value] of updates.sort(
        ([a], [b]) => masterWriteOrder(a) - masterWriteOrder(b),
      ))
        records.push(
          await writeRevision(
            tx,
            userId,
            key,
            value,
            current.find((r) => r.key === key)?.revision ?? 0,
          ),
        );
      if (afterSave) await afterSave(tx);
      return {
        records,
        questionsWereComplete: registrationQuestionsComplete(
          previous.get("certrace:profile") as ProfileValues | null,
        ),
      };
    },
    { timeout: 120000 },
  );
  const profile = result.records.find(
    (record) => record.key === "certrace:profile",
  );
  if (
    config.registrationSheetWebhookUrl &&
    !result.questionsWereComplete &&
    profile?.value &&
    typeof profile.value === "object" &&
    !Array.isArray(profile.value) &&
    registrationQuestionsComplete(profile.value as ProfileValues)
  ) {
    try {
      const user = await db.users.findUnique({ where: { id: userId } });
      if (user)
        void syncRegistrationSheet(user, profile.value as ProfileValues);
    } catch (error) {
      console.error("Google Sheets registration lookup failed", userId, error);
    }
  }
  return { records: result.records };
}
