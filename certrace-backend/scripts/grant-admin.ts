import { db } from "../src/lib/db";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: bun scripts/grant-admin.ts <email>");
  process.exit(1);
}

const granted = await db.$transaction(async (tx) => {
  const user = await tx.users.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, status: "ACTIVE" },
  });
  if (!user) return false;
  const now = new Date();
  await tx.users.update({
    where: { id: user.id },
    data: { is_admin: true, updated_at: now },
  });
  // Same guard as the admin approval: the trial clock starts once, at the first approval.
  if (user.approved_at === null)
    await tx.users.updateMany({
      where: { id: user.id, approved_at: null },
      data: { ready: true, approved_at: now, trial_started_at: now, updated_at: now },
    });
  return true;
});

console.log(granted ? `Granted admin to ${email}` : `No active user ${email}`);
await db.$disconnect();
process.exit(granted ? 0 : 1);
