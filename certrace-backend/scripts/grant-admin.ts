import { db } from "../src/lib/db";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: bun scripts/grant-admin.ts <email>");
  process.exit(1);
}
const updated = await db.users.updateMany({
  where: { email: { equals: email, mode: "insensitive" }, status: "ACTIVE" },
  data: { is_admin: true, ready: true },
});
console.log(updated.count ? `Granted admin to ${email}` : `No active user ${email}`);
await db.$disconnect();
process.exit(updated.count ? 0 : 1);
