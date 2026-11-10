import { Elysia } from "elysia";
import { authenticatedUser } from "../auth/plugin";
import { db } from "../../lib/db";
import { fail } from "../../lib/errors";

export function requireOwner(actorId: string, companyId: string) {
  if (actorId !== companyId)
    fail(403, "OWNER_REQUIRED", "Only the company owner can do that.");
}

// Storage is partitioned by the original owner's ID. Only company routes
// resolve that partition. Auth, consent, and platform admin always use the actor.
export const companySession = new Elysia({ name: "team.company" }).resolve(
  { as: "scoped" },
  async ({ request }) => {
    const account = await authenticatedUser(request);
    const id = request.headers.get("x-certrace-company");
    if (!id || id === account.id) return { account, company: account };
    if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id))
      fail(403, "COMPANY_ACCESS", "You do not have access to this company.");
    const membership = await db.account_members.findUnique({
      where: { account_id_user_id: { account_id: id, user_id: account.id } },
      include: { accounts: { include: { users: true } } },
    });
    const owner = membership?.accounts.users;
    if (
      !owner?.ready ||
      owner.status !== "ACTIVE" ||
      membership?.role !== "editor"
    )
      fail(403, "COMPANY_ACCESS", "You no longer have access to this company.");
    return { account, company: owner };
  },
);
