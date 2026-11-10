import { db } from "../src/lib/db";
import { listReports } from "../src/modules/reporting/service";
import { reportSpecs } from "../src/modules/reporting/catalogue";
const users = await db.account_records.findMany({
  where: {
    OR: [
      { key: { in: [...Object.keys(reportSpecs), "certrace:profile"] } },
      { key: { startsWith: "certrace:report-snapshots:" } },
    ],
  },
  select: { user_id: true },
  distinct: ["user_id"],
});
let records = 0;
try {
  for (const { user_id } of users)
    records += (await listReports(user_id)).length;
  console.log(
    `Verified and migrated ${records} report stores across ${users.length} accounts.`,
  );
} finally {
  await db.$disconnect();
}
