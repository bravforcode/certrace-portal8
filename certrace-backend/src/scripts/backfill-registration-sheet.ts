import { db } from "../lib/db";
import { config } from "../lib/config";
import {
  postRegistrationSheet,
  registrationQuestionsComplete,
} from "../lib/registration-sheet";
import type { ProfileValues } from "../modules/master-data/profile-contract";
import { listReports } from "../modules/reporting/service";

const email = process.argv[2]?.trim();
if (!email || !config.registrationSheetWebhookUrl) {
  console.error(
    "Usage: bun src/scripts/backfill-registration-sheet.ts <registered-email> (CERTRACE_SHEET_WEBHOOK_URL must be set)",
  );
  process.exit(1);
}

try {
  const user = await db.users.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      status: { not: "ANONYMISED" },
    },
  });
  if (!user) throw new Error("Account not found");
  const record = (await listReports(user.id)).find(
    (row) => row.key === "certrace:profile",
  );
  const profile =
    record?.value &&
    typeof record.value === "object" &&
    !Array.isArray(record.value)
      ? (record.value as ProfileValues)
      : null;
  await postRegistrationSheet(
    config.registrationSheetWebhookUrl,
    user,
    profile,
  );
  console.log(
    `Registration Sheet synced: ${user.email} (${registrationQuestionsComplete(profile) ? "Completed" : "Pending"})`,
  );
} finally {
  await db.$disconnect();
}
