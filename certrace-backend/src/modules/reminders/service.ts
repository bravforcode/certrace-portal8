import { db } from "../../lib/db";
import { config } from "../../lib/config";
import { fail, missing } from "../../lib/errors";
import { sendEmail } from "../../lib/email";
import type { reminder_subjects } from "../../generated/prisma/client";
import type { ReminderInput } from "./model";
export const view = (r: reminder_subjects) => ({
  id: r.id,
  subjectKey: r.subject_key,
  recipient: r.recipient,
  supplierName: r.supplier_name,
  periodLabel: r.period_label,
  dueDate: r.due_date.toISOString().slice(0, 10),
  linkUrl: r.link_url,
  locale: r.locale,
  accountLocked: r.account_locked,
  sentAt: r.sent_at ? +r.sent_at : null,
  resendCount: r.resend_count,
  answeredAt: r.answered_at ? +r.answered_at : null,
  cancelledAt: r.cancelled_at ? +r.cancelled_at : null,
});
export async function register(
  userId: string,
  key: string,
  input: ReminderInput,
) {
  const url = new URL(input.linkUrl),
    origin = new URL(config.appUrl).origin;
  if (
    url.origin !== origin ||
    !/^\/(s|w|p)\/[^/]+$/.test(url.pathname) ||
    url.username ||
    url.password
  )
    fail(422, "INVALID_LINK_URL", "Use a supplier link issued by this portal.");
  const token = url.pathname.split("/")[2]!;
  if (
    !(await db.smart_links.findFirst({
      where: {
        token,
        user_id: userId,
        revoked_at: null,
        expires_at: { gt: new Date() },
      },
    }))
  )
    fail(
      422,
      "INVALID_LINK_URL",
      "That link does not belong to this account or is no longer active.",
    );
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM users WHERE id=${userId}::uuid FOR UPDATE`;
    const exists = await tx.reminder_subjects.findUnique({
      where: { user_id_subject_key: { user_id: userId, subject_key: key } },
    });
    if (
      !exists &&
      (await tx.reminder_subjects.count({
        where: {
          user_id: userId,
          created_at: { gte: new Date(Date.now() - 86400000) },
        },
      })) >= Number(process.env.CERTRACE_REMINDER_SUBJECTS_PER_DAY ?? 100)
    )
      fail(
        429,
        "REMINDER_QUOTA_EXCEEDED",
        "The daily reminder subject limit was reached.",
      );
    const data = {
      recipient: input.recipient,
      supplier_name: input.supplierName,
      period_label: input.periodLabel,
      due_date: new Date(input.dueDate),
      link_url: input.linkUrl,
      locale: input.locale,
      account_locked: input.accountLocked ?? false,
      updated_at: new Date(),
    };
    return view(
      await tx.reminder_subjects.upsert({
        where: { user_id_subject_key: { user_id: userId, subject_key: key } },
        create: { user_id: userId, subject_key: key, ...data },
        update: data,
      }),
    );
  });
}
export async function mark(
  userId: string,
  key: string,
  kind: "sent" | "answered" | "cancelled",
) {
  return db.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM reminder_subjects WHERE user_id=${userId}::uuid AND subject_key=${key} FOR UPDATE`;
      const row = await tx.reminder_subjects.findUnique({
        where: { user_id_subject_key: { user_id: userId, subject_key: key } },
      });
      if (!row) return missing();
      if (
        kind === "sent" &&
        !row.sent_at &&
        config.supplierEmails &&
        !row.account_locked
      ) {
        await sendEmail(
          row.recipient,
          "Certrace: supplier data request",
          `${row.supplier_name}, please provide ${row.period_label} by ${row.due_date.toISOString().slice(0, 10)}.\n${row.link_url}`,
          `request:${row.id}`,
        );
      }
      return view(
        await tx.reminder_subjects.update({
          where: { id: row.id },
          data:
            kind === "sent"
              ? {
                  sent_at: row.sent_at ?? new Date(),
                  resend_count: row.sent_at ? { increment: 1 } : 0,
                }
              : kind === "answered"
                ? { answered_at: row.answered_at ?? new Date() }
                : { cancelled_at: row.cancelled_at ?? new Date() },
        }),
      );
    },
    { timeout: 20000 },
  );
}
export function dueStep(due: Date, today: Date) {
  const days = Math.floor(
    (Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) -
      Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate())) /
      86400000,
  );
  const offset = [-7, -2, 1, 5, 12].filter((n) => n <= days).at(-1);
  return offset === undefined
    ? null
    : {
        offset,
        days,
        occasion: `supplier_submission_${offset < 0 ? "reminder" : "overdue"}@${offset > 0 ? "+" : ""}${offset}`,
      };
}
export async function run(dryRun: boolean) {
  dryRun =
    dryRun ||
    !config.supplierEmails ||
    (process.env.CERTRACE_EMAIL_DELIVERY ?? "off") === "off";
  const subjects = await db.reminder_subjects.findMany({
    where: {
      sent_at: { not: null },
      answered_at: null,
      cancelled_at: null,
      users: { status: "ACTIVE" },
    },
  });
  let sent = 0,
    failed = 0,
    skippedLocked = 0;
  for (const row of subjects) {
    if (row.account_locked) {
      skippedLocked++;
      continue;
    }
    const step = dueStep(row.due_date, new Date());
    if (!step) continue;
    try {
      const delivered = await db.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT id FROM reminder_subjects WHERE id=${row.id}::uuid FOR UPDATE`;
          const fresh = await tx.reminder_subjects.findUnique({
            where: { id: row.id },
            include: { users: true },
          });
          if (
            !fresh ||
            fresh.answered_at ||
            fresh.cancelled_at ||
            fresh.account_locked ||
            fresh.users.status !== "ACTIVE"
          )
            return false;
          const subject = `reminder_subject:${row.id}`;
          // Respect deliveries recorded by the previous Python service.
          if (
            await tx.notification_deliveries.findUnique({
              where: {
                subject_id_occasion: {
                  subject_id: row.subject_key,
                  occasion: step.occasion,
                },
              },
            })
          )
            return false;
          if (
            await tx.notification_deliveries.findUnique({
              where: {
                subject_id_occasion: {
                  subject_id: subject,
                  occasion: step.occasion,
                },
              },
            })
          )
            return false;
          if (dryRun) return true;
          await sendEmail(
            row.recipient,
            "Certrace: supplier data reminder",
            `${row.supplier_name}: ${row.period_label} is ${step.days < 0 ? `due in ${-step.days} days` : `${step.days} days overdue`}.\n${row.link_url}`,
            `${subject}:${step.occasion}`,
          );
          await tx.notification_deliveries.create({
            data: {
              subject_id: subject,
              occasion: step.occasion,
              notification_key:
                step.offset < 0
                  ? "supplier_submission_reminder"
                  : "supplier_submission_overdue",
              recipient: row.recipient,
            },
          });
          return true;
        },
        { timeout: 20000 },
      );
      if (delivered) sent++;
    } catch {
      failed++;
    }
  }
  return { dryRun, considered: subjects.length, sent, failed, skippedLocked };
}
