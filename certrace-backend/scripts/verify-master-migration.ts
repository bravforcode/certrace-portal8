import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readTrees as beforeRead } from "../test/fixtures/legacy-report-storage-v005";
import { readTrees as afterRead } from "../test/fixtures/legacy-report-storage-v006";
import { reportSpecs } from "../src/modules/reporting/catalogue";
import { canonical } from "../src/lib/json";
const before = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.SOURCE_DATABASE_URL! }),
});
const after = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.TARGET_DATABASE_URL! }),
});
try {
  const records = await before.$queryRaw<
    { id: string; key: string; user_id: string; is_null: boolean }[]
  >`SELECT id,key,user_id,is_null FROM reporting.records ORDER BY user_id,key,revision`;
  let checked = 0;
  for (const r of records) {
    const spec =
      reportSpecs[r.key] ?? reportSpecs["certrace:report-snapshots:*"];
    const a = r.is_null
      ? null
      : (await beforeRead(before as any, spec!, [r.id])).get(r.id)?.[0]?.value;
    const b = r.is_null
      ? null
      : (await afterRead(after as any, spec!, [r.id])).get(r.id)?.[0]?.value;
    if (canonical(a!) !== canonical(b!))
      throw Error("Migration changed a historical input: " + r.key);
    checked++;
  }
  console.log(
    "All " +
      checked +
      " historical report revisions match their pre-migration values exactly.",
  );
} finally {
  await before.$disconnect();
  await after.$disconnect();
}
