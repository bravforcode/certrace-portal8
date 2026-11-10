import { db } from "../src/lib/db";
import { notify } from "../src/lib/notify";
import { Prisma } from "../src/generated/prisma/client";

// Run after publishing new rows in the legal versions table. Users are asked to
// accept on next sign-in by needsLegalConsent(); this only tells them why.
// Each published terms+privacy pair gets its own key, so every active user gets
// the notice at most once per version and re-running the script is safe.
// The key row is written before the send (email_deliveries is unique on
// user_id+kind), which also makes concurrent runs safe.

const errorCode = (e: unknown) => (e as { code?: string } | undefined)?.code ?? "UNKNOWN";

export async function currentLegalNoticeKey() {
  const docs = await db.legal_document_versions.findMany({
    where: { is_current: true },
    select: { id: true, kind: true },
  });
  const terms = docs.find((d) => d.kind === "terms");
  const privacy = docs.find((d) => d.kind === "privacy");
  if (docs.length !== 2 || !terms || !privacy)
    throw new Error("Expected one current terms and one current privacy version");
  return `legal_updated:${terms.id}/${privacy.id}`;
}

export async function sendLegalUpdateNotices({
  dry = false,
  key,
}: { dry?: boolean; key?: string } = {}) {
  const noticeKey = key ?? (await currentLegalNoticeKey());
  const users = await db.users.findMany({ where: { status: "ACTIVE" } });
  const notified = new Set(
    (
      await db.email_deliveries.findMany({
        where: { kind: noticeKey },
        select: { user_id: true },
      })
    ).map((r) => r.user_id),
  );
  const pending = users.filter((u) => !notified.has(u.id));
  if (dry) return { key: noticeKey, recipients: pending.length, sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  for (const u of pending) {
    try {
      await db.email_deliveries.create({ data: { user_id: u.id, kind: noticeKey } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
      failed++;
      console.error(u.id, errorCode(e));
      continue;
    }
    try {
      await notify(u, "legal_updated", {}, false);
      sent++;
    } catch (e) {
      failed++;
      console.error(u.id, errorCode(e));
      // Release the claim so a re-run can retry this user.
      await db.email_deliveries
        .deleteMany({ where: { user_id: u.id, kind: noticeKey } })
        .catch((cleanup) => console.error(u.id, errorCode(cleanup)));
    }
    // Resend allows 2 requests/second; stay under it for large lists.
    if (pending.length > 1000) await Bun.sleep(600);
  }
  return { key: noticeKey, recipients: pending.length, sent, failed };
}

if (import.meta.main) {
  const dry = process.argv.includes("--dry-run");
  const { recipients, sent, failed } = await sendLegalUpdateNotices({ dry });
  console.log(
    dry
      ? `Would send ${recipients} legal update emails`
      : `Sent ${sent} legal update emails, ${failed} failed`,
  );
  await db.$disconnect();
  if (failed > 0) process.exitCode = 1;
}
