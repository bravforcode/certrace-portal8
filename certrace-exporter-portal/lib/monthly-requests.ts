/* ════════════════════════════════════════════════════════════
   MONTHLY SUPPLIER REQUEST SERIES (§A3)

   The existing Smart-Link system (lib/supplier.ts, lib/supplier-store.ts,
   lib/exporter-review.ts) asks a supplier once per declaration. This turns
   that into a SERIES: one request per month, each with its own token.

   Why per-month tokens rather than one link the supplier revisits:

     · A supplier can fill March without reopening January, so a late month
       never risks overwriting a month already reviewed and closed.
     · Each month's submission is a separate artefact with its own timestamp,
       which is what makes "show me March" answerable a year later.
     · The exporter sees a supplier × month grid where a gap is visibly a gap,
       instead of one status that averages twelve months into a single word.

   WHAT THIS DELIBERATELY DOES NOT DO: build a second reviewer. Submissions
   flow into the existing review flow in lib/exporter-review.ts, and the
   supplier fills the existing guided form. A parallel review path would mean
   two definitions of "reviewed", and the readiness rules would have to pick
   one — which is how a green tab stops meaning anything.
   ════════════════════════════════════════════════════════════ */

import { getSubmissionStatus } from "./supplier-store";
import { makeToken } from "./supplier";
import { monthName } from "./workspace";
import { writeBlocked } from "./plan";

/** Mirrors the supplier-side lifecycle, plus the two states that only exist
    from the exporter's side of the link. */
export type MonthRequestStatus = "not_sent" | "sent" | "opened" | "submitted" | "reviewed";

export const MONTH_REQUEST_STATUS_LABEL: Record<MonthRequestStatus, string> = {
  not_sent: "Not sent",
  sent: "Sent",
  opened: "Opened",
  submitted: "Submitted",
  reviewed: "Reviewed",
};

export type MonthlyRequest = {
  workspaceId: string;
  /** the declaration the Smart Link resolves against */
  declId: string;
  supplierId: string;
  supplierName: string;
  /** 'YYYY-MM' */
  month: string;
  /** the per-month Smart Link token */
  token: string;
  sentAt?: string;
  /** re-sends, so a chased month is visible as chased */
  resendCount?: number;
  createdAt: string;
};

const KEY = "certrace:monthly-requests";

type Store = Record<string, MonthlyRequest[]>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
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

export const listRequests = (workspaceId: string): MonthlyRequest[] => read()[workspaceId] ?? [];

export const requestFor = (workspaceId: string, supplierId: string, month: string): MonthlyRequest | null =>
  listRequests(workspaceId).find((r) => r.supplierId === supplierId && r.month === month) ?? null;

/** Every supplier that has a series in this workspace. */
export function suppliersWithSeries(workspaceId: string): { supplierId: string; supplierName: string; declId: string }[] {
  const seen = new Map<string, { supplierId: string; supplierName: string; declId: string }>();
  for (const r of listRequests(workspaceId)) {
    if (!seen.has(r.supplierId)) seen.set(r.supplierId, { supplierId: r.supplierId, supplierName: r.supplierName, declId: r.declId });
  }
  return [...seen.values()].sort((a, b) => a.supplierName.localeCompare(b.supplierName));
}

/* ── createMonthlySeries ────────────────────────────────────────
   One request per month, each with its own token.

   Idempotent: re-running for a supplier who already has some months keeps the
   existing tokens and adds only the missing ones. Regenerating a token that
   has already been sent would silently break the link in the supplier's inbox
   — and they would have no way to know why it stopped working. */
export function createMonthlySeries(
  workspaceId: string,
  input: { declId: string; supplierId: string; supplierName: string },
  months: string[],
): MonthlyRequest[] {
  const store = read();
  const existing = store[workspaceId] ?? [];
  const now = new Date().toISOString();

  const added: MonthlyRequest[] = [];
  for (const month of months) {
    const already = existing.find((r) => r.supplierId === input.supplierId && r.month === month);
    if (already) continue;
    added.push({
      workspaceId,
      declId: input.declId,
      supplierId: input.supplierId,
      supplierName: input.supplierName,
      month,
      token: makeToken(input.declId, input.supplierId, month),
      createdAt: now,
    });
  }

  store[workspaceId] = [...existing, ...added];
  write(store);
  return store[workspaceId].filter((r) => r.supplierId === input.supplierId).sort((a, b) => a.month.localeCompare(b.month));
}

/** Mark a month's link as sent (or re-sent). The count is kept because
    "chased three times and still nothing" is a different conversation from
    "sent once last week". */
export function markSent(workspaceId: string, supplierId: string, month: string): MonthlyRequest | null {
  // See markMonthSent in lib/month-dispatch.ts — chasing stops with the account.
  if (writeBlocked()) return requestFor(workspaceId, supplierId, month);
  const store = read();
  const rows = store[workspaceId] ?? [];
  const idx = rows.findIndex((r) => r.supplierId === supplierId && r.month === month);
  if (idx < 0) return null;
  const prev = rows[idx];
  rows[idx] = { ...prev, sentAt: new Date().toISOString(), resendCount: prev.sentAt ? (prev.resendCount ?? 0) + 1 : 0 };
  store[workspaceId] = rows;
  write(store);
  return rows[idx];
}

export function removeSeries(workspaceId: string, supplierId: string): void {
  const store = read();
  store[workspaceId] = (store[workspaceId] ?? []).filter((r) => r.supplierId !== supplierId);
  write(store);
}

export function removeRequestsForWorkspace(workspaceId: string): void {
  const store = read();
  delete store[workspaceId];
  write(store);
}

/* ── seriesStatus ───────────────────────────────────────────────
   Per-month status for one supplier, resolved live from the existing
   supplier store rather than duplicated here — one definition of "submitted",
   shared with the review screens. */
export type MonthStatusCell = {
  month: string;
  label: string;
  status: MonthRequestStatus;
  token: string | null;
  sentAt?: string;
  resendCount: number;
  /** the supplier's own AI quality-check score, when they have run it */
  score: number | null;
  version: number;
};

export function seriesStatus(workspaceId: string, supplierId: string, months: string[]): MonthStatusCell[] {
  const rows = listRequests(workspaceId).filter((r) => r.supplierId === supplierId);
  return months.map((month) => {
    const req = rows.find((r) => r.month === month);
    if (!req) {
      return { month, label: monthName(month), status: "not_sent" as const, token: null, resendCount: 0, score: null, version: 0 };
    }

    const submission = getSubmissionStatus(req.token);
    const status: MonthRequestStatus =
      submission.status === "submitted"
        ? "submitted"
        : submission.status === "in_check" || submission.status === "draft"
          ? "opened"
          : submission.status === "revision_requested"
            ? "sent"
            : req.sentAt
              ? "sent"
              : "not_sent";

    return {
      month,
      label: monthName(month),
      // A reviewed month is one the exporter has accepted — the supplier
      // store records that as a version beyond the first submission.
      status: submission.status === "submitted" && submission.version > 1 ? "reviewed" : status,
      token: req.token,
      sentAt: req.sentAt,
      resendCount: req.resendCount ?? 0,
      score: submission.score,
      version: submission.version,
    };
  });
}

/** The whole grid: one row per supplier, one cell per month. */
export type SeriesGrid = {
  supplierId: string;
  supplierName: string;
  declId: string;
  cells: MonthStatusCell[];
  submitted: number;
};

export function gridFor(workspaceId: string, months: string[]): SeriesGrid[] {
  return suppliersWithSeries(workspaceId).map((s) => {
    const cells = seriesStatus(workspaceId, s.supplierId, months);
    return {
      ...s,
      cells,
      submitted: cells.filter((c) => c.status === "submitted" || c.status === "reviewed").length,
    };
  });
}

/** The Smart Link for one month — the URL the supplier actually receives. */
export const linkFor = (token: string): string =>
  typeof window === "undefined" ? `/s/${token}` : `${window.location.origin}/s/${token}`;
