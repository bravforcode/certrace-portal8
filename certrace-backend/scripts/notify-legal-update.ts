import { db } from "../src/lib/db";
import { notify } from "../src/lib/notify";

// Run after publishing new rows in the legal versions table. Users are asked to
// accept on next sign-in by needsLegalConsent(); this only tells them why.
// Legal notices are sent without the `once` guard: email_deliveries is unique on
// (user_id, kind), so `once` would block every later legal update.
export async function sendLegalUpdateNotices({ dry = false } = {}) {
  const users = await db.users.findMany({ where: { status: "ACTIVE" } });
  let failed = 0;
  for (const u of users) {
    if (!dry) {
      try {
        await notify(u, "legal_updated", {}, false);
      } catch (e) {
        failed++;
        console.error(u.id, e);
      }
      // Resend allows 2 requests/second; stay under it for large lists.
      if (users.length > 1000) await Bun.sleep(600);
    }
  }
  return { recipients: users.length, failed };
}

if (import.meta.main) {
  const dry = process.argv.includes("--dry-run");
  const { recipients, failed } = await sendLegalUpdateNotices({ dry });
  console.log(
    dry
      ? `Would send ${recipients} legal update emails`
      : `Sent ${recipients - failed} legal update emails, ${failed} failed`,
  );
  await db.$disconnect();
  if (failed > 0) process.exitCode = 1;
}
