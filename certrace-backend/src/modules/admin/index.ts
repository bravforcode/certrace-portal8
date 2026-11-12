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
  approved_at: true,
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
  approvedAt: user.approved_at?.toISOString() ?? null,
});

export function requireAdmin(account: users) {
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
      const user = await db.$transaction(async (tx) => {
        const previous = await tx.users.findUnique({
          where: { id: params.id },
        });
        if (!previous) return missing();
        // A suspended account stays out until its record is restored; approving
        // it would start a trial and send the approval mail.
        if (body.ready && previous.status !== "ACTIVE")
          fail(
            409,
            "ACCOUNT_SUSPENDED",
            "This account is suspended and cannot be approved.",
          );
        if (previous.ready === body.ready) return previous;
        // The trial clock starts at the first approval only. The approved_at
        // guard in the WHERE clause keeps a concurrent second approval from
        // overwriting the start, and a revoke and re-approve keeps the original.
        if (body.ready)
          await tx.users.updateMany({
            where: { id: params.id, approved_at: null },
            data: { approved_at: new Date(), trial_started_at: new Date() },
          });
        const updated = await tx.users.update({
          where: { id: params.id },
          data: { ready: body.ready, updated_at: new Date() },
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
        return updated;
      });
      // Outside the transaction: a mail failure must not undo the approval.
      // Sent on every approve, and the once guard dedupes: a failed send
      // leaves no delivery row, so approving again retries it.
      if (body.ready)
        await notify(user, "account_approved", {}, true).catch((e: unknown) =>
          console.error(
            "approval email failed",
            (e as { code?: string } | undefined)?.code,
          ),
        );
      return { user: view(user) };
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      body: t.Object({ ready: t.Boolean() }),
      detail: { hide: true },
    },
  )
  .post(
    "/users/:id/reject",
    async ({ account, params, body }) => {
      requireAdmin(account);
      if (params.id === account.id)
        fail(409, "SELF_REJECT", "You cannot reject your own account.");
      // Trimmed here, not in the schema: "   ab  " passes a raw length check.
      const reason = body.reason.trim();
      if (reason.length < 3)
        fail(
          422,
          "REASON_TOO_SHORT",
          "The reason must be at least 3 characters.",
        );
      const user = await db.$transaction(async (tx) => {
        const previous = await tx.users.findUnique({
          where: { id: params.id },
        });
        if (!previous) return missing();
        if (previous.is_admin)
          fail(409, "ADMIN_TARGET", "Admin accounts cannot be rejected.");
        // The status guard makes the claim atomic: a concurrent second reject
        // updates zero rows, so it writes no audit row and sends no email.
        const claimed = await tx.users.updateMany({
          where: { id: params.id, status: "ACTIVE" },
          data: {
            ready: false,
            status: "SUSPENDED",
            suspended_at: new Date(),
            suspension_reason: reason,
            updated_at: new Date(),
          },
        });
        if (claimed.count === 0) {
          if (previous.status === "SUSPENDED")
            fail(
              409,
              "ALREADY_SUSPENDED",
              "This account is already suspended.",
            );
          fail(409, "NOT_ACTIVE", "Only active accounts can be rejected.");
        }
        const u = await tx.users.findUniqueOrThrow({
          where: { id: params.id },
        });
        await tx.account_audit_events.create({
          data: {
            user_id: params.id,
            event: "ADMIN_REJECTED",
            actor: "ADMIN",
            details: { adminUserId: account.id, reason },
          },
        });
        return u;
      });
      // Outside the transaction: a mail failure must not undo the rejection.
      await notify(user, "account_rejected", { reason }).catch((e: unknown) =>
        console.error(
          "rejection email failed",
          (e as { code?: string } | undefined)?.code,
        ),
      );
      return { user: view(user) };
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      body: t.Object({ reason: t.String({ maxLength: 500 }) }),
      detail: { hide: true },
    },
  )
  .post(
    "/users/:id/extend-trial",
    async ({ account, params, body }) => {
      requireAdmin(account);
      const user = await db.$transaction(async (tx) => {
        // One guarded UPDATE: the row lock serialises concurrent extensions and
        // the WHERE clause is the state check, so no stale read is written back.
        const moved = await tx.$executeRaw`
          UPDATE users
          SET trial_started_at = trial_started_at + make_interval(days => ${body.days}::int),
              updated_at = now()
          WHERE id = ${params.id}::uuid AND plan_id = 'trial' AND approved_at IS NOT NULL`;
        if (moved === 0) {
          const current = await tx.users.findUnique({
            where: { id: params.id },
          });
          if (!current) return missing();
          if (current.approved_at === null)
            fail(
              409,
              "NOT_APPROVED",
              "Approve the account before extending its trial.",
            );
          fail(
            409,
            "NOT_TRIAL",
            "Only accounts on the trial plan can be extended.",
          );
        }
        const u = await tx.users.findUniqueOrThrow({
          where: { id: params.id },
        });
        await tx.account_audit_events.create({
          data: {
            user_id: params.id,
            event: "ADMIN_TRIAL_EXTENDED",
            actor: "ADMIN",
            details: { adminUserId: account.id, days: body.days },
          },
        });
        return u;
      });
      return { user: view(user) };
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      body: t.Object({ days: t.Integer({ minimum: 1, maximum: 90 }) }),
      detail: { hide: true },
    },
  );
