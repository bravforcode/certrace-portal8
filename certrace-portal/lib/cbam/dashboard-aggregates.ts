/* ════════════════════════════════════════════════════════════
   DASHBOARD PHASE 2 AGGREGATES — Widgets B, C, K

   Portfolio-level reads, each deferring to logic that already lives
   somewhere else in the product (workspaceReadiness, isBuyerReady,
   valueType, linkStatus) so the dashboard cannot drift from the screen
   that owns the underlying rule.
   ════════════════════════════════════════════════════════════ */

import {
  linkStatus,
  listSuppliers,
  valueType,
  type PrecursorSupplier,
} from "../precursor-suppliers";
import { isBuyerReady, notBuyerReadyReason } from "./buyer-ready";
import { PRECURSOR_STALE_DAYS } from "./action-queue";
import type { WorkspaceReadiness } from "../readiness";
import type { VerificationWorkspace } from "../workspace";

/* ── Widget B — Risk & Deadline Overview ────────────────────────── */

/** Sept 30 — the CBAM declaration deadline, hardcoded per the prompt pack's
    own rule. Whichever Sept 30 has not passed yet is "next": if this year's
    has already gone by, it is next year's. */
export function nextDeclarationDeadline(now: Date = new Date()): Date {
  const thisYear = new Date(now.getFullYear(), 8, 30, 23, 59, 59, 999);
  return now <= thisYear
    ? thisYear
    : new Date(now.getFullYear() + 1, 8, 30, 23, 59, 59, 999);
}

export function daysToNextDeclarationDeadline(now: Date = new Date()): number {
  return Math.ceil(
    (nextDeclarationDeadline(now).getTime() - now.getTime()) / 86_400_000,
  );
}

export type RiskDeadlineStats = {
  workspacesBlocked: number;
  daysToDeclarationDeadline: number;
  percentPrecursorDefault: number;
  workspacesWithOverdueCount: number;
};

export function riskDeadlineStats(
  rows: { workspace: VerificationWorkspace; readiness: WorkspaceReadiness }[],
  overdueWorkspaceIds: Set<string>,
  now: Date = new Date(),
): RiskDeadlineStats {
  const workspacesBlocked = rows.filter(
    (r) => r.readiness.overall === "blocked",
  ).length;

  const allNodes = rows.flatMap((r) => listSuppliers(r.workspace.id));
  const percentPrecursorDefault =
    allNodes.length === 0
      ? 0
      : (allNodes.filter((n) => valueType(n) === "default").length /
          allNodes.length) *
        100;

  return {
    workspacesBlocked,
    daysToDeclarationDeadline: daysToNextDeclarationDeadline(now),
    percentPrecursorDefault,
    workspacesWithOverdueCount: overdueWorkspaceIds.size,
  };
}

/* ── Widget C — Buyer-Ready Status ──────────────────────────────── */

export type BuyerReadyRow = {
  workspace: VerificationWorkspace;
  ready: boolean;
  reason: string | null;
};

export function buyerReadyRows(
  rows: { workspace: VerificationWorkspace; readiness: WorkspaceReadiness }[],
): BuyerReadyRow[] {
  return rows.map((r) => ({
    workspace: r.workspace,
    ready: isBuyerReady(r.readiness),
    reason: notBuyerReadyReason(r.readiness),
  }));
}

/* ── Widget K — Supplier & Precursor Chain Health ───────────────── */

export type SupplierFunnel = {
  invited: number;
  responded: number;
  verified: number;
  totalPrecursorSuppliers: number;
  staleCount: number;
};

function isResponded(s: PrecursorSupplier): boolean {
  const status = linkStatus(s);
  return status !== "not_invited" && status !== "invited_not_opened";
}

export function supplierFunnel(
  workspaces: VerificationWorkspace[],
  now: Date = new Date(),
): SupplierFunnel {
  const all = workspaces
    .flatMap((w) => listSuppliers(w.id))
    .filter((s) => !s.isScrap);
  const invited = all.filter((s) => Boolean(s.smartLinkSentAt));
  const responded = invited.filter(isResponded);
  const verified = all.filter((s) => linkStatus(s) === "submitted_verified");

  const staleCount = invited.filter((s) => {
    const status = linkStatus(s);
    if (status !== "invited_not_opened" && status !== "opened_in_progress")
      return false;
    const daysSinceSent = Math.round(
      (now.getTime() - new Date(s.smartLinkSentAt!).getTime()) / 86_400_000,
    );
    return daysSinceSent >= PRECURSOR_STALE_DAYS;
  }).length;

  return {
    invited: invited.length,
    responded: responded.length,
    verified: verified.length,
    totalPrecursorSuppliers: all.length,
    staleCount,
  };
}
