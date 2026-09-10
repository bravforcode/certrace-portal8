/* ════════════════════════════════════════════════════════════
   TELLING THE SERVER WHAT MAY BE CHASED (R4)

   `app/jobs/send_reminders.py` was wired to a source that finds nothing, and
   that was the honest answer: everything it needed to write an email lived in
   this browser. Three separate stores, in fact —

     lib/workspace.ts          the month and the deadline
     lib/supplier-companies.ts the address to write to
     lib/month-dispatch.ts     whether anyone has asked yet

   — and a job with none of them can only run green and send nothing.

   Rather than migrate that estate (that is D2, still open and still a
   decision), this registers the ONE record the job needs, at the moment the
   exporter sends: who to chase, about what, by when, and where the link goes.

   ── Why the label is a label ──────────────────────────────────
   `periodLabel` goes up as "March 2026", already written for a reader, because
   the job would otherwise have to know the recipient's language to format a
   date — and it does not. Same reason `linkUrl` is absolute: a job composing
   an email has no origin to resolve a path against.

   ── What happens when this fails ──────────────────────────────
   Nothing that the exporter can see, deliberately. The month IS sent — they
   copied the link and pasted it — and a failed registration must not make the
   product claim otherwise. What it costs is that the month will not be chased
   automatically, and the next chase re-registers it, because the endpoint is
   an upsert keyed on the same subject id.
   ════════════════════════════════════════════════════════════ */

import { apiConfigured } from "./api/config";
import { markReminderSent, registerReminderSubject, answerReminderSubject } from "./api/reminders";
import { getWorkspace, monthNameLong, scheduleFor } from "./workspace";
import { effectiveDueDay, dispatchFor } from "./month-dispatch";
import { makeWorkspaceToken } from "./workspace-link";
import { getSupplierCompany } from "./supplier-companies";
import { writeBlocked } from "./plan";

/** The portal's own id for one ask, and the delivery log's key on the server.

    Stable across re-sends by construction: a new id every night would make
    every rung of the ladder look unsent and re-send the whole thing. */
export const reminderSubjectKey = (workspaceId: string, month: string): string => `w:${workspaceId}:${month}`;

/** The deadline a month is actually due on: `dueDay` of the month AFTER the
    one being reported, using the day it was sent under where one exists.
    Mirrors `monthDue` in lib/smart-links.ts — same rule, same answer. */
function dueDateFor(workspaceId: string, month: string, scheduleDueDay: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const day = effectiveDueDay(dispatchFor(workspaceId, month), scheduleDueDay);
  // `monthNumber` is 1-based, so this Date lands in the FOLLOWING month.
  const due = new Date(year, monthNumber, day);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}`;
}

function absoluteLink(path: string): string {
  return typeof window === "undefined" ? path : `${window.location.origin}${path}`;
}

/** Everything the server needs, or null when this ask cannot be chased.

    Two reasons it cannot, and both are ordinary rather than errors: the
    workspace is the exporter's own site, so there is nobody to write to; or
    no email has been recorded for the supplier, which is a gap in the
    supplier record and shows up as one on the suppliers screen. */
export function reminderSubjectFor(
  workspaceId: string,
  month: string,
  locale?: string,
): { key: string; body: Record<string, unknown> } | null {
  const workspace = getWorkspace(workspaceId);
  if (!workspace || workspace.selfSupplied) return null;

  const supplier = workspace.supplierId ? getSupplierCompany(workspace.supplierId) : null;
  const recipient = supplier?.contactEmail?.trim();
  if (!recipient) return null;

  return {
    key: reminderSubjectKey(workspaceId, month),
    body: {
      recipient,
      supplierName: workspace.supplierName || supplier?.name || "Supplier",
      periodLabel: monthNameLong(month),
      dueDate: dueDateFor(workspaceId, month, scheduleFor(workspace).dueDay),
      linkUrl: absoluteLink(`/w/${makeWorkspaceToken(workspaceId, month)}`),
      locale,
      // The ladder still has something to say to a supplier whose customer is
      // frozen; what it must not do is walk them to a form that cannot accept
      // their answer. The server is told the fact and decides.
      accountLocked: writeBlocked(),
    },
  };
}

/** Register the ask and record that it went out. Safe to call every send. */
export async function registerMonthSent(workspaceId: string, month: string, locale?: string): Promise<void> {
  if (!apiConfigured()) return;
  const subject = reminderSubjectFor(workspaceId, month, locale);
  if (!subject) return;
  try {
    await registerReminderSubject(subject.key, subject.body);
    await markReminderSent(subject.key);
  } catch (cause) {
    /* See the header: the month is sent whatever happens here. Logged rather
       than swallowed silently, because "why was this never chased" is a real
       question someone will ask a fortnight later. */
    console.warn(`[reminders] ${subject.key} was not registered:`, cause);
  }
}

/** Stop chasing a month that has been answered. */
export async function registerMonthAnswered(workspaceId: string, month: string): Promise<void> {
  if (!apiConfigured()) return;
  try {
    await answerReminderSubject(reminderSubjectKey(workspaceId, month));
  } catch (cause) {
    /* Worse than a failed registration — this one leaves a supplier being
       chased for a month they have already sent. The nightly run stops at the
       end of the ladder, so it is bounded, but it is still an email nobody
       should receive, and it is worth being able to find in a log. */
    console.warn(`[reminders] ${reminderSubjectKey(workspaceId, month)} was not closed:`, cause);
  }
}
