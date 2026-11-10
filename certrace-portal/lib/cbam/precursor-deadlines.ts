/* ════════════════════════════════════════════════════════════
   DEADLINE TRACKING — every report type, one status vocabulary

   Three kinds of deadline, each derived rather than separately configured
   per workspace, so a deadline never drifts from the rule that defines it:

     MONTHLY DATA        — lib/month-dispatch.ts already owns this; reused,
                            not reimplemented, here.
     PRECURSOR SEE +      — derived BACKWARD from the exporter's own CBAM
     VERIFICATION           filing deadline (30 September of the year after
                            the reporting period) minus a configurable
                            buffer, default 60 days → 1 August.
     MMD FINALISATION     — before the next period's data entry opens, i.e.
                            before the reporting year itself ends and next
                            January's month becomes askable.
   ════════════════════════════════════════════════════════════ */

import { finalVersionCovering } from "../workspace-mmd";
import type { VerificationWorkspace } from "../workspace";

export type DeadlineStatus = "on_track" | "due_soon" | "overdue";

export type Deadline = {
  label: string;
  due: Date;
  status: DeadlineStatus;
  daysUntilDue: number;
};

/** ≤30 days out reads as "due soon" — these are annual-cadence deadlines,
    not monthly ones, so the window is wider than month-dispatch.ts's own
    3-day "due soon" threshold for a monthly ask. */
const DUE_SOON_WINDOW_DAYS = 30;

function statusFor(daysUntilDue: number): DeadlineStatus {
  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue <= DUE_SOON_WINDOW_DAYS) return "due_soon";
  return "on_track";
}

const daysBetween = (a: Date, b: Date) =>
  Math.ceil((a.getTime() - b.getTime()) / 86_400_000);

/** The exporter's own CBAM declaration deadline for a reporting year: 30
    September of the following year. Hardcoded per the CBAM regulation's own
    filing rule — see lib/cbam/dashboard-aggregates.ts's
    nextDeclarationDeadline for the portfolio-wide countdown this mirrors
    at the single-workspace level. */
export function filingDeadlineFor(reportingYear: number): Date {
  return new Date(reportingYear + 1, 8, 30, 23, 59, 59, 999);
}

/** Default buffer between when a precursor supplier's SEE and verification
    evidence is due and the exporter's own filing deadline — 60 days,
    landing on 1 August for a calendar-year reporting period. Configurable
    per workspace via `bufferDays`, not hardcoded into the calculation
    itself. */
export const DEFAULT_PRECURSOR_DEADLINE_BUFFER_DAYS = 60;

export function precursorSeeDeadlineFor(
  workspace: Pick<VerificationWorkspace, "year">,
  bufferDays = DEFAULT_PRECURSOR_DEADLINE_BUFFER_DAYS,
  now: Date = new Date(),
): Deadline {
  const filing = filingDeadlineFor(workspace.year);
  const due = new Date(filing.getTime() - bufferDays * 86_400_000);
  const daysUntilDue = daysBetween(due, now);
  return {
    label: "Precursor SEE & verification due",
    due,
    status: statusFor(daysUntilDue),
    daysUntilDue,
  };
}

/** "Before the next period's data entry opens" — the reporting year's own
    last day, since January of the following year is when the first month
    of the NEXT period becomes askable (see requestDateFor in
    lib/month-dispatch.ts). A monitoring plan not finalised by then is
    finalised after next year's data has already started arriving against
    it. */
export function mmdFinalizationDeadlineFor(
  workspace: Pick<VerificationWorkspace, "year">,
  now: Date = new Date(),
): Deadline {
  const due = new Date(workspace.year, 11, 31, 23, 59, 59, 999);
  const daysUntilDue = daysBetween(due, now);
  return {
    label: "Monitoring plan finalisation due",
    due,
    status: statusFor(daysUntilDue),
    daysUntilDue,
  };
}

/** Whether the MMD deadline has already been met — a final version exists
    covering the whole period — in which case it is not "due" at all. */
export function mmdAlreadyFinal(
  workspace: Pick<VerificationWorkspace, "id" | "periodStart" | "periodEnd">,
): boolean {
  return (
    finalVersionCovering(
      workspace.id,
      workspace.periodStart,
      workspace.periodEnd,
    ) != null
  );
}
