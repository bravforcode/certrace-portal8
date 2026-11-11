import { db } from "../../lib/db";
import { notify } from "../../lib/notify";
import { Prisma } from "../../generated/prisma/client";
import type { EmailKind } from "../../lib/email-templates";
import { trialEndsAt } from "../auth/trial";

const DAY = 86_400_000;

const errorCode = (e: unknown) => (e as { code?: string } | undefined)?.code ?? "UNKNOWN";

/** Reminders are keyed on the trial end date, not only the kind. An admin
    extension moves trial_started_at, which moves the end date, so the new
    end gets its own reminders while a re-run on the same day sends nothing new. */
const claimKey = (kind: EmailKind, endsAt: Date) =>
  `${kind}:${endsAt.toISOString().slice(0, 10)}`;

/** Sends at most one trial reminder per (user, kind, trial end date).
    The claim row is written before the send, the same pattern as
    scripts/notify-legal-update.ts, so overlapping runs cannot both send. */
export async function runTrialEmails(now = new Date(), dryRun = false) {
  const users = await db.users.findMany({
    where: { plan_id: "trial", ready: true, status: "ACTIVE", approved_at: { not: null } },
  });
  const sent: { userId: string; kind: string }[] = [];
  for (const u of users) {
    const endsAt = trialEndsAt(u);
    const left = (endsAt.getTime() - now.getTime()) / DAY;
    const kind: EmailKind | null =
      left <= 0 ? "trial_ended" : left <= 1 ? "trial_ending_1" : left <= 7 ? "trial_ending_7" : null;
    if (!kind) continue;
    if (dryRun) {
      sent.push({ userId: u.id, kind });
      continue;
    }
    const key = claimKey(kind, endsAt);
    try {
      await db.email_deliveries.create({ data: { user_id: u.id, kind: key } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
      throw e;
    }
    try {
      await notify(u, kind, { days: String(Math.max(1, Math.ceil(left))) }, false);
      sent.push({ userId: u.id, kind });
    } catch (e) {
      console.error(u.id, errorCode(e));
      // Release the claim so the next run can retry this reminder.
      await db.email_deliveries
        .deleteMany({ where: { user_id: u.id, kind: key } })
        .catch((cleanup) => console.error(u.id, errorCode(cleanup)));
    }
  }
  return { sent };
}
