/* ════════════════════════════════════════════════════════════
   SMART LINKS — every ask this account has issued, in one list

   A workspace does not ask for one thing. It asks for TWELVE months of
   readings from whoever runs the installation, and a verified emissions
   figure from every precursor supplier underneath it — and until this list
   existed, all of that could only be seen one workspace at a time, one tab at
   a time. An exporter running six workspaces had roughly a hundred live asks
   and no screen that could count them, let alone say which were late.

   So this module derives the whole set. It is a VIEW, never a store: there is
   no `certrace:smart-links` key, nothing here writes, and every field is read
   off the records that already govern it. That is deliberate and it is the
   whole design — a stored copy of "which links exist" would have to be kept
   in step with workspace creation, month submission, precursor edits and
   sends, and the first time it fell behind it would be an exporter chasing a
   supplier who had already answered.

   ── WHERE THE LINKS COME FROM ──────────────────────────────────
   Three sources, and they are the three places a link is minted:

     1 · MONTHLY DATA, from a workspace the exporter opened themselves. One
         link per month of the reporting year (lib/workspace-link.ts's
         `/w/<token>`), which is why a brand-new workspace immediately puts
         twelve rows here. They are not twelve jobs for today — see the
         `not_due` state below — they are the year, laid out.

     2 · MONTHLY DATA, from a workspace opened by pressing "Track report" on a
         precursor. There is no second code path for these: Track report
         creates a REAL VerificationWorkspace, so its months arrive here
         through source 1. `viaPrecursor` marks them, because "this is my own
         plant's January" and "this is my supplier's January, which I am
         tracking on their behalf" are different conversations with different
         people.

     3 · ENTER VERIFIED DATA, one per precursor row in every chain
         (lib/precursor-link.ts's `/p/<token>`). The ask is not a month, it is
         the whole reporting period's figure plus the verification report
         behind it, so it has no month and its deadline is the year's.

   ── THE FIVE STATES, AND WHY THEY ARE EXCLUSIVE ────────────────
   Evaluated in this order, first match wins, so a row is in exactly one
   bucket and the five counts add up to the total. That last property is the
   reason the order is what it is: a filter whose counts do not sum is a
   filter the reader has to audit.

     done        The answer is in. A month that is submitted or reviewed; a
                 precursor whose link has been submitted through.
     send_now    The thing being asked about can be answered, and nothing has
                 gone out. This is the actionable bucket and the reason the
                 page exists.
     late        SENT, unanswered, and past the deadline.
     in_process  Sent, unanswered, still inside the deadline.
     not_due     Nothing has gone out and nothing can be answered yet.

   SEND_NOW IS TESTED BEFORE LATE, and that is a decision worth defending.
   A month that ended in February, was never sent, and is now six months past
   its deadline satisfies both. It is filed under "Send now", because the two
   buckets are not two severities of the same thing — they are two DIFFERENT
   JOBS. "Send now" is work the exporter owes: nobody has been asked, and the
   only person who can move it is the one reading the screen. "Late" is work
   somebody else owes: they were asked, the date has gone, and the move is to
   chase them. Sorting a never-sent month under "Late" puts it in a list whose
   every other row is answered by picking up the phone, and the one thing that
   will never fix it is picking up the phone.

   The urgency is not lost by doing this: the row still prints its deadline in
   red with "184 days late" against it, in the same column and the same colour
   as every other overdue row. What changes is only which pile it is in.

   ── DEADLINES ARE NOT RECOMPUTED HERE ──────────────────────────
   A month that has gone out keeps the deadline it went out with
   (lib/month-dispatch.ts's `dueDay` snapshot, read through
   `effectiveDueDay`), and only a month that has not gone out moves with the
   workspace setting. This module calls that helper rather than reading
   `schedule.dueDay` directly, so the Smart Links table, the month card and
   the dashboard can never disagree about when something is late.
   ════════════════════════════════════════════════════════════ */

import { dateLocaleNow, type TFunction } from "./i18n";
import { calendarDaysUntil, dispatchesFor, effectiveDueDay, type MonthDispatch } from "./month-dispatch";
import { monthsForWorkspace, type MonthStatus } from "./monthly-data";
import { precursorCompleteness, listSuppliers, trackedWorkspaceIndex, type PrecursorSupplier } from "./precursor-suppliers";
import { makePrecursorLinkToken } from "./precursor-link";
import { makeWorkspaceToken } from "./workspace-link";
import { cachedWorkspaceToken } from "./workspace-link-sync";
import { listWorkspaces, monthNameLong, scheduleFor, type VerificationWorkspace } from "./workspace";

/* ── The two kinds ─────────────────────────────────────────── */

export type SmartLinkKind = "monthly" | "verified_data";

export const SMART_LINK_KIND_LABEL: Record<SmartLinkKind, string> = {
  monthly: "Monthly data",
  verified_data: "Precursor data",
};

/** What each kind is actually asking for, in one sentence, for the filter's
    own tooltip and the detail dialog's lead. Written for somebody who has not
    read the regulation. */
export const SMART_LINK_KIND_BLURB: Record<SmartLinkKind, string> = {
  monthly: "One month of production, fuel and electricity.",
  verified_data: "A precursor supplier's verified emissions for the whole year.",
};

/* ── The five states ───────────────────────────────────────── */

export type SmartLinkState = "send_now" | "in_process" | "late" | "done" | "not_due";

export const SMART_LINK_STATE_LABEL: Record<SmartLinkState, string> = {
  send_now: "Send now",
  in_process: "In process",
  late: "Late",
  done: "Done",
  not_due: "Not due yet",
};

/** One line each, shown under the filter so the words are defined where they
    are used rather than in a help page nobody opens. */
export const SMART_LINK_STATE_BLURB: Record<SmartLinkState, string> = {
  send_now: "Not asked yet. Send it now.",
  in_process: "Sent and waiting. Nothing to do yet.",
  late: "Past the deadline, still unanswered. Chase it.",
  done: "Answered. Nothing outstanding.",
  not_due: "The month is still running.",
};

/** Design-system tones, so the chips on this page read the same as every
    other status chip in the portal. */
export const SMART_LINK_STATE_TONE: Record<SmartLinkState, "ok" | "info" | "warn" | "err" | "muted"> = {
  send_now: "warn",
  in_process: "info",
  late: "err",
  done: "ok",
  not_due: "muted",
};

/** The order the filter draws them, AND the order the table sorts by — one
    array, so the chips and the rows can never imply different priorities.

    Send now leads, because it is the only bucket nobody else can clear. Late
    follows: it is more overdue, but it is somebody else's move and the
    exporter's part in it is a phone call. Done sorts last whatever its dates,
    because a finished row has nothing at risk. */
export const SMART_LINK_STATES: SmartLinkState[] = ["send_now", "late", "in_process", "not_due", "done"];

const STATE_RANK: Record<SmartLinkState, number> = Object.fromEntries(SMART_LINK_STATES.map((s, i) => [s, i])) as Record<SmartLinkState, number>;

/* ── One row ───────────────────────────────────────────────── */

export type SmartLink = {
  /** stable across reloads — it is derived from the ids, not generated */
  id: string;
  kind: SmartLinkKind;
  state: SmartLinkState;

  workspace: VerificationWorkspace;
  /** true when this workspace exists because somebody pressed "Track report"
      on a precursor, rather than being one the exporter opened directly */
  viaPrecursor: boolean;

  /** 'YYYY-MM' on a monthly link; null on a verified-data link, which covers
      the whole reporting period rather than a month of it */
  month: string | null;
  /** the precursor row a verified-data link belongs to */
  precursor: PrecursorSupplier | null;

  /** what is being asked for — "January 2026", or the precursor's name */
  subject: string;
  /** who it goes to, in as many words as are known */
  recipient: string;
  /** true when the answer lands on the exporter themselves rather than going
      out to somebody else — the case the old Inbox page existed for */
  toSelf: boolean;

  /** the address to hand over. Origin-relative, so it is right on localhost
      and in production without configuration. */
  path: string;

  /** the deadline in force, and how it stands against today */
  due: Date;
  msLeft: number;
  overdue: boolean;

  /** ISO timestamps, absent until each has happened */
  sentAt: string | null;
  lastSentAt: string | null;
  openedAt: string | null;
  answeredAt: string | null;
  /** re-sends after the first, so a chased ask is visible as chased */
  resendCount: number;

  /** 0–100. Months are all-or-nothing (a month is submitted or it is not);
      a precursor form reports how much of it has been filled in. */
  percentComplete: number;
  /** the underlying month status, for the one column that shows it */
  monthStatus: MonthStatus | null;
};

/** Whether the answer is possible YET — the test behind `send_now` versus
    `not_due`. A month cannot be reported before it has ended: readings for a
    month still running do not exist, and a link asking for them is a link
    that wastes somebody's afternoon.

    A PRECURSOR'S ASK IS NEVER "NOT DUE". It is not asking about a period that
    has to finish first — it is asking for the supplier's own already-verified
    emissions figure and the report behind it, both of which exist on the day
    the row is created and neither of which gets truer by waiting until
    December. Holding these back until the reporting period closed would time
    the ask for the precise moment there is no year left to fix a bad answer
    in, which is the opposite of what the chain is for. */
function askableNow(month: string | null, now: Date): boolean {
  if (!month) return true;
  const [y, m] = month.split("-").map(Number);
  // The first instant of the following month — `m` is already 1-based.
  return now >= new Date(y, m, 1);
}

/** The one place a state is decided. Order matters — see the header for why
    `send_now` is tested ahead of `late`. */
function stateOf(args: { answered: boolean; sent: boolean; overdue: boolean; askable: boolean }): SmartLinkState {
  if (args.answered) return "done";
  if (!args.sent) return args.askable ? "send_now" : "not_due";
  return args.overdue ? "late" : "in_process";
}

/** The deadline for a month: `dueDay` of the month AFTER the one reported,
    using the day the month actually went out under where one exists. */
function monthDue(month: string, dispatch: MonthDispatch | null, scheduleDueDay: number): Date {
  const [y, m] = month.split("-").map(Number);
  const day = effectiveDueDay(dispatch, scheduleDueDay);
  // `m` is already 1-based, so `new Date(y, m, day)` is the FOLLOWING month.
  return new Date(y, m, day, 23, 59, 59, 999);
}

/* ── Building the list ─────────────────────────────────────── */

export function buildSmartLinks(now: Date = new Date()): SmartLink[] {
  const workspaces = listWorkspaces();

  /* Which workspaces exist because a precursor was tracked — one pass over
     every chain, shared with the Reports page so the two lists cannot
     disagree about which reports are somebody else's. */
  const trackedFrom = trackedWorkspaceIndex(workspaces);

  const rows: SmartLink[] = [];

  for (const w of workspaces) {
    const viaPrecursor = trackedFrom.has(w.id);
    const dueDay = scheduleFor(w).dueDay;
    const dispatches = dispatchesFor(w.id);

    /* ── Source 1 + 2 · one link per month of the year ──────── */
    for (const entry of monthsForWorkspace(w)) {
      const dispatch = dispatches[entry.month] ?? null;
      const answered = entry.status === "submitted" || entry.status === "reviewed";
      const due = monthDue(entry.month, dispatch, dueDay);
      const msLeft = due.getTime() - now.getTime();
      const overdue = !answered && msLeft < 0;

      rows.push({
        id: `m:${w.id}:${entry.month}`,
        kind: "monthly",
        state: stateOf({ answered, sent: Boolean(dispatch), overdue, askable: askableNow(entry.month, now) }),
        workspace: w,
        viaPrecursor,
        month: entry.month,
        precursor: null,
        subject: monthNameLong(entry.month),
        recipient: w.selfSupplied ? "Your own site" : w.supplierName || w.installationName,
        toSelf: Boolean(w.selfSupplied),
        // The server-issued link once one has been minted (lib/workspace-link-sync.ts).
        path: `/w/${cachedWorkspaceToken(w.id, entry.month) ?? makeWorkspaceToken(w.id, entry.month)}`,
        due,
        msLeft,
        overdue,
        sentAt: dispatch?.sentAt ?? null,
        lastSentAt: dispatch?.lastActionAt ?? null,
        openedAt: null,
        answeredAt: answered ? entry.submittedAt ?? null : null,
        resendCount: dispatch?.resendCount ?? 0,
        percentComplete: answered ? 100 : 0,
        monthStatus: entry.status,
      });
    }

    /* ── Source 3 · one link per precursor in the chain ─────── */
    for (const s of listSuppliers(w.id)) {
      const answered = Boolean(s.smartLinkSubmittedAt);
      /* A precursor's ask has no month of its own, so it inherits the
         workspace's own deadline: the year is what is being asked for. */
      const due = new Date(`${w.periodEnd}T23:59:59`);
      const msLeft = due.getTime() - now.getTime();
      const overdue = !answered && msLeft < 0;

      rows.push({
        id: `p:${w.id}:${s.id}`,
        kind: "verified_data",
        state: stateOf({ answered, sent: Boolean(s.smartLinkSentAt), overdue, askable: true }),
        workspace: w,
        viaPrecursor,
        month: null,
        precursor: s,
        subject: s.precursorName || s.name || "Unnamed precursor",
        recipient: s.contactEmail || s.name || s.installationName || "No contact on file",
        toSelf: false,
        path: `/p/${s.smartLinkToken ?? makePrecursorLinkToken(w.id, s.id)}`,
        due,
        msLeft,
        overdue,
        sentAt: s.smartLinkSentAt ?? null,
        lastSentAt: s.smartLinkLastSentAt ?? s.smartLinkSentAt ?? null,
        openedAt: s.smartLinkOpenedAt ?? null,
        answeredAt: s.smartLinkSubmittedAt ?? null,
        resendCount: 0,
        percentComplete: precursorCompleteness(s).percent,
        monthStatus: null,
      });
    }
  }

  /* Most urgent first: by state, then by deadline inside a state. A "done"
     row has nothing at risk, so it sorts to the bottom whatever its date. */
  return rows.sort((a, b) => STATE_RANK[a.state] - STATE_RANK[b.state] || a.due.getTime() - b.due.getTime());
}

/** How many rows sit in each state — for the filter chips' own counts, which
    are what make the filter worth pressing rather than a guess. */
export function countByState(links: SmartLink[]): Record<SmartLinkState, number> {
  const out: Record<SmartLinkState, number> = { send_now: 0, in_process: 0, late: 0, done: 0, not_due: 0 };
  for (const l of links) out[l.state] += 1;
  return out;
}

export function countByKind(links: SmartLink[]): Record<SmartLinkKind, number> {
  const out: Record<SmartLinkKind, number> = { monthly: 0, verified_data: 0 };
  for (const l of links) out[l.kind] += 1;
  return out;
}

/** "in 6 days" / "3 days late" / "due today" — the same sentence the month
    card uses, kept here so the table and the dialog cannot word it
    differently. Deliberately never "0 days": a deadline that lands today is
    the one an exporter most needs to read as today. */
export function countdown(msLeft: number, t: TFunction = (k, v) => k.replace(/\{(\w+)\}/g, (_, n) => String(v?.[n] ?? "")), due?: Date): string {
  // With the deadline in hand the days are counted on the calendar, the same way the month card and the bell count them;
  // without it, from the milliseconds as before.
  const days = due ? Math.abs(calendarDaysUntil(due, new Date(due.getTime() - msLeft))) : Math.round(Math.abs(msLeft) / 864e5);
  // A deadline that rounds to today is "due today" on either side of it. "0
  // days late" is technically true and reads as a glitch, and it is the one
  // deadline an exporter most needs to read as today's problem.
  if (days === 0) return t("Due today");
  if (msLeft < 0) return t(days === 1 ? "{n} day late" : "{n} days late", { n: days });
  return t(days === 1 ? "In {n} day" : "In {n} days", { n: days });
}

export const formatDay = (d: Date): string => d.toLocaleDateString(dateLocaleNow(), { day: "numeric", month: "short", year: "numeric" });
