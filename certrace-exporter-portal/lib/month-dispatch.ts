/* ════════════════════════════════════════════════════════════
   THE MONTHLY DISPATCH RECORD — sent, chased, and when

   A workspace asks for the same thing twelve times, and the exporter's real
   question about any one of them is not "what is the data" but "have I asked,
   and when did I last chase". This is where that lives: one small record per
   workspace × month.

   WHY IT IS NOT lib/monthly-requests.ts. That store keys on
   `declId + supplierId` and mints declaration-scheme tokens, which was correct
   when a declaration was the spine. A workspace is the spine now, its supplier
   link is `/w/<token>` (see lib/workspace-link.ts), and there is exactly one
   installation per workspace — so a supplier axis in the key is a dimension
   that is always 1, and a declaration axis is a join to a concept the
   workspace does not have.

   WHY THE LINK ONLY APPEARS AFTER SENDING. The month's link is derivable at
   any time — it is a function of the workspace id and the month — but offering
   "copy link" for a month nobody has sent invites the exporter to paste a link
   into a chat and believe the month has been requested, with nothing in the
   product recording that it was. Sending is the act that creates the record;
   copying is how you get the link again afterwards.

   NOTHING IS TRANSMITTED. Same as everywhere else in this build: `markSent`
   records intent and copies the link to the clipboard for the exporter to
   paste. When a mail service exists this is the function it hangs off.
   ════════════════════════════════════════════════════════════ */

import { writeBlocked } from "./plan";

/** What a blocked send returns when the month has never gone out: the shape a
    caller expects, with empty timestamps so every "has this been sent?" test
    in the product still answers no. Nothing is written. */
const NEVER_SENT = (workspaceId: string, month: string, dueDay?: number): MonthDispatch => ({
  workspaceId,
  month,
  sentAt: "",
  lastActionAt: "",
  resendCount: 0,
  reminderCount: 0,
  dueDay,
});

export type MonthDispatch = {
  workspaceId: string;
  /** 'YYYY-MM' */
  month: string;
  /** ISO timestamp of the first send */
  sentAt: string;
  /** ISO timestamp of the most recent send or reminder */
  lastActionAt: string;
  /** re-sends after the first, so a chased month is visible as chased */
  resendCount: number;
  /** reminders, counted separately — "sent once, chased three times" is a
      different conversation from "sent four times" */
  reminderCount: number;
  lastReminderAt?: string;
  /* ── The deadline this month was sent under ───────────────────
     Snapshotted at the moment of sending, and never rewritten afterwards.

     THE DEADLINE AN EXPORTER CHANGES IS A PROMISE ABOUT FUTURE MONTHS, not a
     retroactive one. Without this field, moving the workspace deadline from
     the 20th to the 10th would make every month already out there instantly
     late — including ones whose supplier was told the 20th and is answering on
     the 15th, in good faith, on time. The supplier's screen would say one
     date, the exporter's another, and the exporter would chase somebody who
     was not late.

     So a month that has gone out keeps the deadline it went out with, and a
     month that has not moves with the setting. Optional because dispatches
     written before this existed have no snapshot — those fall back to the
     workspace's current setting, which is the old behaviour. */
  dueDay?: number;
};

const KEY = "certrace:month-dispatch";

type Store = Record<string, Record<string, MonthDispatch>>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Store;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function write(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore quota */
  }
}

export const dispatchesFor = (workspaceId: string): Record<string, MonthDispatch> => read()[workspaceId] ?? {};

export const dispatchFor = (workspaceId: string, month: string): MonthDispatch | null => dispatchesFor(workspaceId)[month] ?? null;

/** Record that this month's link has gone out. Idempotent in the sense that
    re-sending never loses the first `sentAt` — "asked on the 5th, chased on
    the 19th" is the sentence an exporter needs a month later. */
export function markMonthSent(workspaceId: string, month: string, dueDay?: number): MonthDispatch {
  /* THE CHASING STOPS WHEN THE ACCOUNT DOES. A frozen account must not keep
     asking a supplier for a month nobody can accept — the UI already refuses,
     and this is the layer that makes it true even if some path gets past it.
     The existing record is returned unchanged so callers that read the result
     still get a coherent object. */
  if (writeBlocked()) return dispatchFor(workspaceId, month) ?? NEVER_SENT(workspaceId, month, dueDay);
  const store = read();
  const forWorkspace = store[workspaceId] ?? {};
  const now = new Date().toISOString();
  const prev = forWorkspace[month];

  const next: MonthDispatch = prev
    ? // A RE-SEND DOES NOT MOVE THE DEADLINE. Chasing somebody with the same
      // link is not a new agreement, and silently extending the deadline every
      // time you chase is how a month stays "not late" until December.
      { ...prev, lastActionAt: now, resendCount: prev.resendCount + 1 }
    : { workspaceId, month, sentAt: now, lastActionAt: now, resendCount: 0, reminderCount: 0, dueDay };

  store[workspaceId] = { ...forWorkspace, [month]: next };
  write(store);
  return next;
}

/** The deadline day actually in force for a month: the one it was sent under
    if it has been sent, otherwise whatever the workspace currently says. Every
    screen that draws a due date or a countdown goes through here, so the month
    card, the Inbox and the dashboard cannot disagree about when it is late. */
export const effectiveDueDay = (dispatch: MonthDispatch | null | undefined, scheduleDueDay: number): number =>
  dispatch?.dueDay ?? scheduleDueDay;

/** A reminder is only meaningful for a month that has been sent — there is
    nothing to remind somebody of otherwise, and a reminder count on an
    unsent month would read as chasing somebody who was never asked. */
export function markMonthReminded(workspaceId: string, month: string): MonthDispatch | null {
  if (writeBlocked()) return dispatchFor(workspaceId, month);
  const store = read();
  const forWorkspace = store[workspaceId] ?? {};
  const prev = forWorkspace[month];
  if (!prev) return null;

  const now = new Date().toISOString();
  const next: MonthDispatch = { ...prev, lastActionAt: now, lastReminderAt: now, reminderCount: prev.reminderCount + 1 };
  store[workspaceId] = { ...forWorkspace, [month]: next };
  write(store);
  return next;
}

/* ── When a reminder is allowed ─────────────────────────────────
   Three conditions, and each one exists because chasing without it is worse
   than not chasing:

     1 · IT HAS BEEN SENT. You cannot remind somebody of a request they never
         received — that reads to them as a first contact that blames them for
         being late.
     2 · THE MONTH IS NOT IN. A reminder for data already submitted is the
         fastest way to teach somebody that these mails are noise.
     3 · THE DEADLINE HAS PASSED. Before then they are not late, and a chase
         inside an agreed window is what makes a supplier stop reading them.

   Then a floor of SIX HOURS between reminders. It is deliberately hours rather
   than days: a month that is a week late is a real problem an exporter may
   need to escalate the same day, and a 24-hour lock would make the product the
   obstacle. Six hours is short enough to chase twice in a working day and long
   enough that nobody wakes up to four of them. */
export const REMINDER_INTERVAL_HOURS = 6;
const REMINDER_INTERVAL_MS = REMINDER_INTERVAL_HOURS * 3_600_000;

export type ReminderState =
  | { allowed: true }
  /** why not, in the words the button's tooltip should use */
  | { allowed: false; reason: "not_sent" | "submitted" | "not_due" | "cooling_down"; nextAt?: Date; label: string };

export function reminderState(opts: {
  dispatch: MonthDispatch | null;
  submitted: boolean;
  due: Date;
  now?: Date;
}): ReminderState {
  const now = opts.now ?? new Date();
  if (!opts.dispatch) return { allowed: false, reason: "not_sent", label: "Send this month first" };
  if (opts.submitted) return { allowed: false, reason: "submitted", label: "This month is already in" };
  if (now <= opts.due) return { allowed: false, reason: "not_due", label: `Not late yet — due ${formatDate(opts.due)}` };

  const last = opts.dispatch.lastReminderAt ? new Date(opts.dispatch.lastReminderAt).getTime() : null;
  if (last !== null && now.getTime() - last < REMINDER_INTERVAL_MS) {
    const nextAt = new Date(last + REMINDER_INTERVAL_MS);
    return { allowed: false, reason: "cooling_down", nextAt, label: `Already chased — you can chase again ${formatClock(nextAt)}` };
  }
  return { allowed: true };
}

/** '14:30 today' / '02:00 tomorrow' — a reminder cooldown is measured in hours,
    so a bare date would tell the reader nothing about when it lifts. */
export function formatClock(d: Date): string {
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  const days = Math.floor((d.getTime() - midnight.getTime()) / 86_400_000);
  if (days <= 0) return `at ${time}`;
  if (days === 1) return `at ${time} tomorrow`;
  return `on ${formatDate(d)}`;
}

export function removeDispatchesForWorkspace(workspaceId: string): void {
  const store = read();
  delete store[workspaceId];
  write(store);
}

/* ── Request and deadline dates ─────────────────────────────────
   Both derived here so the month cards, the tables, the Inbox and the
   dashboard cannot compute them differently.

   THE REQUEST GOES OUT WHEN THE MONTH ENDS. Not on a chosen day of the
   following month — see the note on WorkspaceSchedule in lib/workspace.ts.
   January's request is dated 31 January, February's 28 or 29 February.

   THE DEADLINE IS A DAY OF THE FOLLOWING MONTH. `dueDay: 15` means January's
   data is due by 15 February. That is the date every "late" in the product
   measures against, and the only one an exporter chooses. */

/** The last day of the month being reported — the moment it becomes askable. */
export function requestDateFor(month: string): Date {
  const [y, m] = month.split("-").map(Number);
  // Day 0 of the NEXT month is the last day of this one, which is how February
  // gets 28 or 29 without a leap-year branch.
  return new Date(y, m, 0);
}

/** The deadline: `dueDay` of the month after the one being reported. */
export function dueDateFor(month: string, dueDay: number): Date {
  const [y, m] = month.split("-").map(Number);
  // `m` is 1-based, so passing it as the 0-based month index IS the next month.
  return new Date(y, m, Math.min(Math.max(1, dueDay), 28));
}

export const formatDate = (d: Date): string => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** Where a month stands against its own deadline. `pending` means the month
    has not ended yet, so nothing can be late. */
export type DueState = "pending" | "open" | "due_soon" | "overdue" | "done";

export function dueStateFor(month: string, opts: { dueDay: number; submitted: boolean; now?: Date }): DueState {
  if (opts.submitted) return "done";
  const now = opts.now ?? new Date();
  if (now < requestDateFor(month)) return "pending";
  const due = dueDateFor(month, opts.dueDay);
  const daysLeft = Math.ceil((due.getTime() - now.getTime()) / 86_400_000);
  if (daysLeft < 0) return "overdue";
  if (daysLeft <= 3) return "due_soon";
  return "open";
}

/* ── The countdown ──────────────────────────────────────────────
   What a month card shows once it has been sent: how long the other end has
   left, or how far past the deadline they are. Days rather than a ticking
   clock — a CBAM deadline is measured in days, and a second-by-second timer on
   twelve cards is twelve re-renders a second for a number nobody reads that
   precisely.

   Under a day it switches to hours, because "0 days left" on the last
   afternoon reads as "already over". */
export type Countdown = {
  /** negative once the deadline has passed */
  msLeft: number;
  overdue: boolean;
  /** '9 days left' · '4 hours left' · '3 days late' */
  label: string;
  due: Date;
};

export function countdownFor(month: string, dueDay: number, now: Date = new Date()): Countdown {
  const due = dueDateFor(month, dueDay);
  // End of the due day, not its midnight: a deadline of "15 February" that
  // expires at 00:00 on the 15th takes a whole day away from the person
  // answering, and is the sort of off-by-one that gets argued about.
  due.setHours(23, 59, 59, 999);

  const msLeft = due.getTime() - now.getTime();
  const overdue = msLeft < 0;
  const abs = Math.abs(msLeft);
  const days = Math.floor(abs / 86_400_000);
  const hours = Math.floor(abs / 3_600_000);

  const amount = days >= 1 ? `${days} day${days === 1 ? "" : "s"}` : `${Math.max(1, hours)} hour${hours === 1 ? "" : "s"}`;
  return { msLeft, overdue, due, label: overdue ? `${amount} late` : `${amount} left` };
}

export const DUE_STATE_LABEL: Record<DueState, string> = {
  pending: "Not yet asked",
  open: "Open",
  due_soon: "Due soon",
  overdue: "Overdue",
  done: "In",
};
