import { db } from "../../lib/db";
import { Prisma } from "../../generated/prisma/client";
import { fail } from "../../lib/errors";
import type { Json } from "../../lib/json";
import { isReportKey, saveReport } from "../reporting/service";
const reserved = new Set([
  "certrace:company-team",
  "certrace:auth",
  "certrace:anthropic-key",
  "certrace:demo-plan",
  "certrace:lang",
  "certrace:account-suspended",
]);
export function validateRecord(key: string, value: Json) {
  if (!key.startsWith("certrace:") || reserved.has(key))
    fail(
      422,
      "INVALID_RECORD_KEY",
      "That setting cannot be stored as account data.",
    );
  if (Buffer.byteLength(JSON.stringify(value)) > 5 * 1024 * 1024)
    fail(413, "RECORD_TOO_LARGE", "Store document bytes as files.");
}
const conflict = () =>
  fail(
    409,
    "REVISION_CONFLICT",
    "This record changed in another tab. Reload the latest data before saving again.",
  );
export async function save(
  userId: string,
  key: string,
  value: Json,
  revision: number,
  actorId = userId,
  prefix = "",
) {
  validateRecord(key, value);
  if (isReportKey(key))
    return saveReport(userId, key, value, revision, actorId);
  key = prefix + key;
  if (!revision) {
    try {
      return await db.account_records.create({
        data: {
          user_id: userId,
          key,
          value: value === null ? Prisma.JsonNull : value,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      )
        return conflict();
      throw e;
    }
  }
  return db.$transaction(async (tx) => {
    const updated = await tx.account_records.updateMany({
      where: { user_id: userId, key, revision },
      data: {
        value: value === null ? Prisma.JsonNull : value,
        revision: { increment: 1 },
        updated_at: new Date(),
      },
    });
    if (!updated.count) return conflict();
    return await tx.account_records.findUniqueOrThrow({
      where: { user_id_key: { user_id: userId, key } },
    });
  });
}
