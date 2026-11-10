import { Elysia, t } from "elysia";
import { db } from "../../lib/db";
import { fail, missing } from "../../lib/errors";
import { authenticated } from "../auth/plugin";
import { notify } from "../../lib/notify";
import { Prisma, type users } from "../../generated/prisma/client";

const userSelect = {
  id: true,
  email: true,
  first_name: true,
  last_name: true,
  company_name: true,
  ready: true,
  onboarded: true,
  status: true,
  plan_id: true,
  created_at: true,
} satisfies Prisma.usersSelect;
type AdminUser = Prisma.usersGetPayload<{ select: typeof userSelect }>;

const view = (user: AdminUser) => ({
  id: user.id,
  email: user.email,
  firstName: user.first_name,
  lastName: user.last_name,
  companyName: user.company_name,
  ready: user.ready,
  onboarded: user.onboarded,
  status: user.status,
  planId: user.plan_id,
  registeredAt: user.created_at.toISOString(),
});

function requireAdmin(account: users) {
  if (!account.is_admin)
    fail(403, "ADMIN_REQUIRED", "Admin access is required.");
}

export const admin = new Elysia({ prefix: "/api/admin" })
  .use(authenticated)
  .get(
    "/users",
    async ({ account, query }) => {
      requireAdmin(account);
      const search = query.search?.trim();
      const where: Prisma.usersWhereInput | undefined = search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { first_name: { contains: search, mode: "insensitive" } },
              { last_name: { contains: search, mode: "insensitive" } },
              { company_name: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined;
      const users = await db.users.findMany({
        where,
        select: userSelect,
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
        take: 51,
        ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      });
      return {
        users: users.slice(0, 50).map(view),
        nextCursor: users.length > 50 ? users[49]!.id : null,
      };
    },
    {
      query: t.Object({
        search: t.Optional(t.String({ maxLength: 200 })),
        cursor: t.Optional(t.String({ format: "uuid" })),
      }),
      detail: { hide: true },
    },
  )
  .put(
    "/users/:id/ready",
    async ({ account, params, body }) => {
      requireAdmin(account);
      const result = await db.$transaction(async (tx) => {
        const previous = await tx.users.findUnique({
          where: { id: params.id },
        });
        if (!previous) return missing();
        if (previous.ready === body.ready)
          return { user: previous, approving: false };
        // The trial clock starts at the first approval only; a revoke and
        // re-approve keeps the original start.
        const approving = body.ready && !previous.approved_at;
        const updated = await tx.users.update({
          where: { id: params.id },
          data: {
            ready: body.ready,
            updated_at: new Date(),
            ...(approving
              ? { approved_at: new Date(), trial_started_at: new Date() }
              : {}),
          },
        });
        await tx.account_audit_events.create({
          data: {
            user_id: params.id,
            event: "ADMIN_READY_CHANGED",
            actor: "ADMIN",
            details: {
              adminUserId: account.id,
              from: previous.ready,
              to: body.ready,
            },
          },
        });
        return { user: updated, approving };
      });
      // Outside the transaction: a mail failure must not undo the approval.
      if (result.approving)
        await notify(result.user, "account_approved", {}, true).catch(
          (e: { code?: string }) =>
            console.error("approval email failed", e.code),
        );
      return { user: view(result.user) };
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      body: t.Object({ ready: t.Boolean() }),
      detail: { hide: true },
    },
  );
