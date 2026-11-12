import { db } from "../../lib/db";
import { notify } from "../../lib/notify";
import { Prisma } from "../../generated/prisma/client";
import type { EmailKind } from "../../lib/email-templates";
import { POST_END_DAYS, TRIAL_DAYS, trialEndsAt } from "../auth/trial";

const DAY = 86_400_000;

const errorCode = (e: unknown) =>
  (e as { code?: string } | undefined)?.code ?? "UNKNOWN";

/** Reminders are keyed on the trial end date, not only the kind. An admin
    extension moves trial_started_at, which moves the end date, so the new
    end gets its own reminders while a re-run on the same day sends nothing new. */
const claimKey = (kind: EmailKind, endsAt: Date) =>
  `${kind}:${endsAt.toISOString().slice(0, 10)}`;

/** Sends at most one trial reminder per (user, kind, trial end date).
    The claim row is written before the send, the same pattern as
    scripts/notify-legal-update.ts. A crash between claim and send means that
    reminder is never sent: at most once, not at least once. That trade is
    deliberate, since a repeated mail is worse than a missed one.
    Without delivery (dry run, or CERTRACE_EMAIL_DELIVERY off) nothing is
    claimed and `sent` counts the reminders that would go out. */
export async function runTrialEmails(now = new Date(), dryRun = false) {
  const live =
    !dryRun && (process.env.CERTRACE_EMAIL_DELIVERY ?? "off") !== "off";
  // Only trials ending within POST_END_DAYS either way, so the first run after
  // deploy does not mail every expired account.
  const users = await db.users.findMany({
    where: {
      plan_id: "trial",
      ready: true,
      status: "ACTIVE",
      approved_at: { not: null },
      trial_started_at: {
        gte: new Date(now.getTime() - (TRIAL_DAYS + POST_END_DAYS) * DAY),
        lte: new Date(now.getTime() - (TRIAL_DAYS - POST_END_DAYS) * DAY),
      },
    },
    select: {
      id: true,
      email: true,
      locale: true,
      first_name: true,
      trial_started_at: true,
    },
  });
  let sent = 0,
    failed = 0,
    skipped = 0;
  for (const u of users) {
    const endsAt = trialEndsAt(u);
    const left = (endsAt.getTime() - now.getTime()) / DAY;
    const kind: EmailKind | null =
      left <= 0
        ? "trial_ended"
        : left <= 1
          ? "trial_ending_1"
          : left <= 7
            ? "trial_ending_7"
            : null;
    if (!kind) continue;
    if (!live) {
      sent++;
      continue;
    }
    const key = claimKey(kind, endsAt);
    try {
      await db.email_deliveries.create({ data: { user_id: u.id, kind: key } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        skipped++;
        continue;
      }
      throw e;
    }
    try {
      await notify(
        u,
        kind,
        { days: String(Math.max(1, Math.ceil(left))) },
        false,
      );
      sent++;
    } catch (e) {
      failed++;
      console.error(u.id, errorCode(e));
      // Release the claim so the next run can retry this reminder.
      await db.email_deliveries
        .deleteMany({ where: { user_id: u.id, kind: key } })
        .catch((cleanup) => console.error(u.id, errorCode(cleanup)));
    }
  }
  return { sent, failed, skipped, dryRun: !live };
}
