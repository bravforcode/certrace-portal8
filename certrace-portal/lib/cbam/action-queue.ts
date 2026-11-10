/* ════════════════════════════════════════════════════════════
   ACTION QUEUE — every overdue or due-soon thing, across every workspace

   Widget A's data source. Four kinds of item, each already tracked
   somewhere in the product — this file only WALKS every workspace and
   collects the ones that are late or about to be, so the dashboard has one
   list instead of four screens to check. Nothing here computes a NEW notion
   of "late"; each kind defers to the same logic the screen that owns it
   already uses (dueStateFor for months, linkStatus for precursor invites,
   isBound/awaitingBinding for documents), so the dashboard and the detail
   screen can never disagree about whether something is actually overdue.
   ════════════════════════════════════════════════════════════ */

import { getCarbonPrice } from "../carbon-price";
import {
  annualCoverage,
  annualScopeFor,
  coverageForMonth,
} from "../workspace-evidence";
import { monthCounts, monthsForWorkspace } from "../monthly-data";
import {
  calendarDaysUntil,
  dispatchesFor,
  dueDateFor,
  dueStateFor,
  effectiveDueDay,
} from "../month-dispatch";
import { linkStatus, listSuppliers } from "../precursor-suppliers";
import { finalVersionCovering, loadDraft } from "../workspace-mmd";
import {
  monthNameLong,
  scheduleFor,
  type VerificationWorkspace,
} from "../workspace";
import { precursorSeeDeadlineFor } from "./precursor-deadlines";
import { currentLang, dateLocaleFor } from "../i18n";

export type ActionItemType =
  | "monthly_data"
  | "precursor_invite"
  | "mmd_draft"
  | "document_unbound"
  | "precursor_deadline";

export type ActionItem = {
  type: ActionItemType;
  /** negative = overdue by this many days, positive = due in this many days */
  daysUntilDue: number;
  label: string;
  /** the label as a template and its parts, so a screen can say it in its own language — `label` is the same sentence, in English */
  say?: { key: string; vars: Record<string, string | number> };
  workspaceId: string;
  workspaceLabel: string;
  deepLink: string;
};

const DAY_MS = 86_400_000;
const daysBetween = (a: Date, b: Date) =>
  Math.round((a.getTime() - b.getTime()) / DAY_MS);

/** Stale threshold for a precursor invite nobody has opened or finished —
    configurable, not a magic number scattered through the UI. */
export const PRECURSOR_STALE_DAYS = 10;

function monthlyDataItems(ws: VerificationWorkspace, now: Date): ActionItem[] {
  const items: ActionItem[] = [];
  const schedule = scheduleFor(ws);
  const dispatches = dispatchesFor(ws.id);

  for (const entry of monthsForWorkspace(ws)) {
    if (monthCounts(entry)) continue; // already in
    const dispatch = dispatches[entry.month];
    // Only months actually asked for can be overdue — see month-dispatch.ts.
    if (!dispatch) continue;
    const dueDay = effectiveDueDay(dispatch, schedule.dueDay);
    const state = dueStateFor(entry.month, { dueDay, submitted: false, now });
    if (state !== "overdue" && state !== "due_soon") continue;

    const due = dueDateFor(entry.month, dueDay);

    items.push({
      type: "monthly_data",
      daysUntilDue: calendarDaysUntil(due, now),
      label: `${monthNameLong(entry.month)} data`,
      say: { key: "{month} data", vars: { month: monthNameLong(entry.month) } },
      workspaceId: ws.id,
      workspaceLabel: ws.productName,
      deepLink: `/workspaces/${ws.id}/monthly/${entry.month}`,
    });
  }
  return items;
}

function precursorInviteItems(
  ws: VerificationWorkspace,
  now: Date,
): ActionItem[] {
  const items: ActionItem[] = [];
  for (const s of listSuppliers(ws.id)) {
    if (s.isScrap || !s.smartLinkSentAt) continue;
    const status = linkStatus(s);
    if (status !== "invited_not_opened" && status !== "opened_in_progress")
      continue;
    const sentAt = new Date(s.smartLinkSentAt);
    const daysSinceSent = daysBetween(now, sentAt);
    if (daysSinceSent < PRECURSOR_STALE_DAYS) continue;

    items.push({
      type: "precursor_invite",
      daysUntilDue: -(daysSinceSent - PRECURSOR_STALE_DAYS),
      label: `${s.name || s.precursorName || "Precursor supplier"} — no response`,
      say: {
        key: "{name} — no response",
        vars: { name: s.name || s.precursorName || "Precursor supplier" },
      },
      workspaceId: ws.id,
      workspaceLabel: ws.productName,
      deepLink: `/workspaces/${ws.id}/precursors`,
    });
  }
  return items;
}

/** §3 — the precursor SEE & verification deadline (1 August by default,
    derived backward from the exporter's own 30 September filing date, see
    lib/cbam/precursor-deadlines.ts). One item per workspace, not per
    precursor node — the deadline is the same for the whole chain, and a
    row per node would repeat the same date once per supplier. Silent once
    every precursor in the chain is already verified, or once there are no
    precursors at all. */
function precursorDeadlineItems(
  ws: VerificationWorkspace,
  now: Date,
): ActionItem[] {
  const nodes = listSuppliers(ws.id).filter((s) => !s.isScrap);
  if (nodes.length === 0) return [];
  const allVerified = nodes.every(
    (s) => linkStatus(s) === "submitted_verified",
  );
  if (allVerified) return [];

  const deadline = precursorSeeDeadlineFor(ws, undefined, now);
  if (deadline.status === "on_track") return [];

  const unverifiedCount = nodes.filter(
    (s) => linkStatus(s) !== "submitted_verified",
  ).length;
  return [
    {
      type: "precursor_deadline",
      daysUntilDue: deadline.daysUntilDue,
      label:
        unverifiedCount === 1
          ? `1 precursor not yet verified — SEE & verification due ${deadline.due.toLocaleDateString(dateLocaleFor(currentLang()), { day: "numeric", month: "short", year: "numeric" })}`
          : `${unverifiedCount} precursors not yet verified — SEE & verification due ${deadline.due.toLocaleDateString(dateLocaleFor(currentLang()), { day: "numeric", month: "short", year: "numeric" })}`,
      workspaceId: ws.id,
      workspaceLabel: ws.productName,
      deepLink: `/workspaces/${ws.id}/precursors`,
    },
  ];
}

function mmdDraftItems(ws: VerificationWorkspace): ActionItem[] {
  // No `change_reason` field exists on an MMD version yet (see the prompt
  // pack's own illustrative model), so "a change is in progress" is read the
  // closest honest way the data already supports: real content has been
  // typed into the draft, but no finalised version covers the current
  // period yet. A workspace that has never been touched at all is not
  // "a change in progress" — it is simply not started, and belongs to the
  // MMD tab's own readiness state, not this queue.
  const draft = loadDraft(ws.id, ws.periodStart, ws.periodEnd);
  const started = Boolean(
    draft.boundaryDescription.trim() ||
      draft.fuelTypeIds.length > 0 ||
      draft.fuelInstruments.length > 0,
  );
  if (!started) return [];
  const final = finalVersionCovering(ws.id, ws.periodStart, ws.periodEnd);
  if (final) return [];
  return [
    {
      type: "mmd_draft",
      daysUntilDue: 0,
      label: "Monitoring plan — draft not finalised",
      workspaceId: ws.id,
      workspaceLabel: ws.productName,
      deepLink: `/workspaces/${ws.id}/mmd`,
    },
  ];
}

function unboundDocumentItems(ws: VerificationWorkspace): ActionItem[] {
  const items: ActionItem[] = [];
  const price = getCarbonPrice(ws.id);
  const scope = annualScopeFor(
    ws.id,
    ws.periodStart,
    ws.periodEnd,
    price.amountPerTonne > 0,
  );

  for (const row of annualCoverage(ws.id, scope)) {
    if (row.awaitingBinding > 0) {
      items.push({
        type: "document_unbound",
        daysUntilDue: 0,
        label: `${row.label} — uploaded, needs binding`,
        say: {
          key: "{label} — uploaded, needs binding",
          vars: { label: row.label },
        },
        workspaceId: ws.id,
        workspaceLabel: ws.productName,
        deepLink: `/workspaces/${ws.id}/mmd`,
      });
    }
  }
  for (const entry of monthsForWorkspace(ws)) {
    for (const row of coverageForMonth(
      ws.id,
      entry,
      scope.requiresIndirectEmissions ?? false,
    ).rows) {
      if (row.awaitingBinding > 0) {
        items.push({
          type: "document_unbound",
          daysUntilDue: 0,
          label: `${monthNameLong(entry.month)} — ${row.label} — needs binding`,
          say: {
            key: "{month} — {label} — needs binding",
            vars: { month: monthNameLong(entry.month), label: row.label },
          },
          workspaceId: ws.id,
          workspaceLabel: ws.productName,
          deepLink: `/workspaces/${ws.id}/monthly/${entry.month}`,
        });
      }
    }
  }
  return items;
}

/** Every overdue-or-due-soon item across the given workspaces, worst first —
    overdue items sorted by how overdue (most overdue first), then due-soon
    items sorted by nearest deadline. Items with no real deadline (an unbound
    document, a stalled MMD draft) carry daysUntilDue 0, which places them
    between "overdue" and "due soon" — needs attention now, but not getting
    later every day the way a missed month does. */
export function actionQueueFor(
  workspaces: VerificationWorkspace[],
  now: Date = new Date(),
): ActionItem[] {
  const items: ActionItem[] = [];
  for (const ws of workspaces) {
    items.push(
      ...monthlyDataItems(ws, now),
      ...precursorInviteItems(ws, now),
      ...mmdDraftItems(ws),
      ...unboundDocumentItems(ws),
      ...precursorDeadlineItems(ws, now),
    );
  }
  return items.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}
