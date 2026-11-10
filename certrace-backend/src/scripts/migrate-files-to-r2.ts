import { db } from "../lib/db";
import { migrateFilesToR2 } from "../modules/files/migrate";

const flags = Bun.argv.slice(2);
if (flags.some((flag) => flag !== "--clear-db-bytes"))
  throw new Error(
    "Usage: bun src/scripts/migrate-files-to-r2.ts [--clear-db-bytes]",
  );
try {
  console.log(await migrateFilesToR2(flags.includes("--clear-db-bytes")));
} finally {
  await db.$disconnect();
}
