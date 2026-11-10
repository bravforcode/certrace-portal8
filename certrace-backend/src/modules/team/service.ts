import { db } from "../../lib/db";
import { fail } from "../../lib/errors";
import { object } from "../../lib/json";
import { hash, token, rateLimit } from "../../lib/security";
import { sendEmail } from "../../lib/email";
import { config } from "../../lib/config";
import type { users, Prisma } from "../../generated/prisma/client";
import { lockOwner } from "../reporting/service";
import { teamSeatLimits } from "../../../../certrace-portal/lib/team-seat-limits";
import { requireOwner } from "./workspace";

const valid = () => ({ expires_at: { gt: new Date() } });
const unusable = () =>
  fail(
    410,
    "INVITE_CLOSED",
    "This invitation expired or was closed. Ask the owner for a new invitation.",
  );
const person = (u: users) => ({
  id: u.id,
  email: u.email,
  name: [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email,
});
async function companyName(owner: users) {
  const profile = await db.record_heads.findUnique({
    where: { user_id_key: { user_id: owner.id, key: "certrace:profile" } },
    include: { records: true },
  });
  return String(
    object(profile?.records.value).companyName ||
      owner.company_name ||
      owner.email,
  );
}
export async function directory(actor: users, company: users) {
  const [members, pending, joined, name] = await Promise.all([
    db.account_members.findMany({
      where: { account_id: company.id, role: "editor" },
      include: { users: true },
      orderBy: { user_id: "asc" },
    }),
    db.team_invitations.findMany({
      where: { account_id: company.id, ...valid() },
      orderBy: { email: "asc" },
      select: { id: true, email: true, delivered: true, expires_at: true },
    }),
    db.account_members.findMany({
      where: { user_id: actor.id, role: "editor" },
      include: { accounts: { include: { users: true } } },
    }),
    companyName(company),
  ]);
  return {
    id: company.id,
    name,
    isOwner: actor.id === company.id,
    planId: company.plan_id,
    trialStartedAt: company.trial_started_at.toISOString(),
    members: [
      { ...person(company), role: "Owner" },
      ...members.map((m) => ({ ...person(m.users), role: "Member" })),
    ],
    invitations: pending.map((p) => ({
      ...p,
      expires_at: p.expires_at.toISOString(),
    })),
    companies: await Promise.all(
      [
        actor,
        ...joined
          .map((m) => m.accounts.users)
          .filter((u) => u.ready && u.status === "ACTIVE"),
      ].map(async (u) => ({
        id: u.id,
        name: u.id === company.id ? name : await companyName(u),
      })),
    ),
  };
}

async function audit(
  tx: Prisma.TransactionClient,
  company: string,
  actor: string,
  event: string,
  email: string,
) {
  await tx.account_audit_events.create({
    data: { user_id: company, actor, event, details: { email } },
  });
}

export async function invite(
  actor: users,
  company: users,
  address: string,
  resendId?: string,
) {
  requireOwner(actor.id, company.id);
  if (
    company.plan_id === "trial" &&
    Date.now() >= company.trial_started_at.getTime() + 30 * 86400_000
  )
    fail(
      403,
      "TRIAL_ENDED",
      "The company’s trial has ended. Update the plan to invite a teammate.",
    );
  const email = address.trim().toLowerCase();
  if (email === actor.email.toLowerCase())
    fail(409, "ALREADY_MEMBER", "The owner already has a seat.");
  await rateLimit("team-invites:" + company.id, 40, 3600);
  const secret = token();
  const row = await db.$transaction(async (tx) => {
    await lockOwner(tx, company.id);
    await tx.accounts.upsert({
      where: { id: company.id },
      create: { id: company.id },
      update: {},
    });
    await tx.account_members.upsert({
      where: {
        account_id_user_id: { account_id: company.id, user_id: company.id },
      },
      create: { account_id: company.id, user_id: company.id, role: "owner" },
      update: {},
    });
    const member = await tx.account_members.findFirst({
      where: {
        account_id: company.id,
        users: { email: { equals: email, mode: "insensitive" } },
      },
    });
    if (member) fail(409, "ALREADY_MEMBER", "This person is already a member.");
    const existing = await tx.team_invitations.findUnique({
      where: { account_id_email: { account_id: company.id, email } },
    });
    if (
      resendId &&
      (existing?.id !== resendId || existing.expires_at <= new Date())
    )
      return unusable();
    if (existing && existing.expires_at > new Date() && !resendId)
      return { id: existing.id, send: false, delivered: existing.delivered };
    if (!existing || existing.expires_at <= new Date()) {
      const cap = (teamSeatLimits as Record<string, number | null | undefined>)[
        company.plan_id
      ];
      if (cap === undefined)
        fail(
          409,
          "PLAN_UNKNOWN",
          "This company’s seat allowance is unavailable.",
        );
      const used =
        1 +
        (await tx.account_members.count({
          where: { account_id: company.id, role: "editor" },
        })) +
        (await tx.team_invitations.count({
          where: { account_id: company.id, ...valid() },
        }));
      if (cap !== null && used >= cap)
        fail(409, "SEAT_CAP", "All seats on this company’s plan are taken.");
    }
    const data = {
      token_hash: hash(secret),
      expires_at: new Date(Date.now() + 7 * 86400_000),
      delivered: false,
    };
    const invitation = await tx.team_invitations.upsert({
      where: { account_id_email: { account_id: company.id, email } },
      create: { account_id: company.id, email, ...data },
      update: data,
    });
    await audit(
      tx,
      company.id,
      actor.id,
      resendId ? "team.invite.resent" : "team.invite.created",
      email,
    );
    return { id: invitation.id, send: true, delivered: false };
  });
  if (!row.send) return { id: row.id, delivered: row.delivered };
  const mode = process.env.CERTRACE_EMAIL_DELIVERY ?? "off";
  if (mode === "off")
    fail(
      503,
      "EMAIL_UNAVAILABLE",
      "Invitation saved. Email delivery is off. Enable it and retry from Team.",
    );
  const name = await companyName(company);
  const link = new URL("/join", config.appUrl);
  link.hash = secret;
  await sendEmail(
    email,
    "Join " + name + " on Certrace",
    person(actor).name +
      " invited you to join " +
      name +
      " as a member. Sign in with " +
      email +
      " and accept within seven days.\n\n" +
      link.href,
    hash(secret),
    { label: "Join " + name, url: link.href },
  );
  const delivered = mode !== "console";
  await db.team_invitations.updateMany({
    where: { id: row.id, token_hash: hash(secret) },
    data: { delivered },
  });
  return { id: row.id, delivered };
}
export async function invitationPreview(secret: string) {
  const row = await db.team_invitations.findFirst({
    where: { token_hash: hash(secret), ...valid() },
    include: { accounts: { include: { users: true } } },
  });
  if (!row) return unusable();
  return { company: await companyName(row.accounts.users), email: row.email };
}
export async function acceptInvitation(actor: users, secret: string) {
  const digest = hash(secret);
  const found = await db.team_invitations.findUnique({
    where: { token_hash: digest },
  });
  if (!found) return unusable();
  return db.$transaction(async (tx) => {
    await lockOwner(tx, found.account_id);
    const row = await tx.team_invitations.findFirst({
      where: { token_hash: digest, ...valid() },
      include: { accounts: { include: { users: true } } },
    });
    if (
      !row ||
      !row.accounts.users.ready ||
      row.accounts.users.status !== "ACTIVE"
    )
      return unusable();
    if (row.email !== actor.email.trim().toLowerCase())
      fail(403, "INVITE_EMAIL", "Sign in with the invited email address.");
    await tx.account_members.create({
      data: { account_id: row.account_id, user_id: actor.id, role: "editor" },
    });
    // Reviewer assignments outlive access. Keep an existing contact's ID,
    // or create a durable contact for new assignments before releasing the seat.
    const key = "certrace:team-members";
    const roster = await tx.account_records.findUnique({
      where: { user_id_key: { user_id: row.account_id, key } },
    });
    const contacts = Array.isArray(roster?.value) ? roster.value : [];
    if (
      !contacts.some((c) => String(object(c).email).toLowerCase() === row.email)
    ) {
      const value = [
        ...contacts,
        {
          ...person(actor),
          role: "Member",
          dept: "Operations",
          kind: "internal",
        },
      ] as Prisma.InputJsonValue;
      if (roster) {
        const changed = await tx.account_records.updateMany({
          where: { user_id: row.account_id, key, revision: roster.revision },
          data: { value, revision: { increment: 1 }, updated_at: new Date() },
        });
        if (!changed.count)
          fail(
            409,
            "REVISION_CONFLICT",
            "The reviewer list changed. Accept again.",
          );
      } else
        await tx.account_records.create({
          data: { user_id: row.account_id, key, value },
        });
    }
    await tx.team_invitations.delete({ where: { id: row.id } });
    await audit(
      tx,
      row.account_id,
      actor.id,
      "team.invite.accepted",
      row.email,
    );
    return { companyId: row.account_id };
  });
}
export async function remove(
  actor: users,
  company: users,
  id: string,
  kind: "member" | "invitation",
) {
  requireOwner(actor.id, company.id);
  if (id === company.id)
    fail(409, "OWNER_REQUIRED", "The owner's seat cannot be removed.");
  await db.$transaction(async (tx) => {
    await lockOwner(tx, company.id);
    if (kind === "member") {
      const member = await tx.account_members.findFirst({
        where: { account_id: company.id, user_id: id, role: "editor" },
        include: { users: true },
      });
      if (member) {
        await tx.account_members.delete({
          where: {
            account_id_user_id: { account_id: company.id, user_id: id },
          },
        });
        await audit(
          tx,
          company.id,
          actor.id,
          "team.member.removed",
          member.users.email,
        );
      }
    } else {
      const invite = await tx.team_invitations.findFirst({
        where: { id, account_id: company.id },
      });
      if (invite) {
        await tx.team_invitations.delete({ where: { id } });
        await audit(
          tx,
          company.id,
          actor.id,
          "team.invite.cancelled",
          invite.email,
        );
      }
    }
  });
  return { ok: true };
}
