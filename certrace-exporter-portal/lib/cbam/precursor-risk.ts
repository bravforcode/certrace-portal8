/* ════════════════════════════════════════════════════════════
   WIDGET G — PRECURSOR CHAIN RISK SCORE

   A simple weighted 0–100 score per workspace (higher = riskier), built
   entirely from precursor_nodes data that already exists. Weights are
   configuration — WEIGHTS below — not magic numbers scattered through the
   UI, exactly as the prompt pack asks; it flags them as a starting
   proposal to confirm with product, not a final number, and that flag is
   repeated here rather than treated as settled.
   ════════════════════════════════════════════════════════════ */

import { linkStatus, listSuppliers, valueType, type PrecursorSupplier } from "../precursor-suppliers";
import { PRECURSOR_STALE_DAYS } from "./action-queue";
import type { VerificationWorkspace } from "../workspace";

/** PROVISIONAL — confirm with product before treating these as final. See
    the prompt pack's own caveat: "implement the structure so weights are
    configuration, not hardcoded magic numbers scattered in the UI." */
export const PRECURSOR_RISK_WEIGHTS = {
  defaultValue: 15,
  staleInvite: 10,
  accreditationExpiringSoon: 20,
  failedValidation: 25,
};

/** How close to the reporting period's end an accreditation expiry counts
    as "expiring soon". */
export const ACCREDITATION_EXPIRY_WINDOW_DAYS = 60;

export type NodeRiskContribution = { node: PrecursorSupplier; points: number; reason: string };

function riskPointsFor(node: PrecursorSupplier, periodEnd: string, now: Date): NodeRiskContribution[] {
  const contributions: NodeRiskContribution[] = [];
  if (node.isScrap) return contributions;

  if (valueType(node) === "default") {
    contributions.push({ node, points: PRECURSOR_RISK_WEIGHTS.defaultValue, reason: "on a default value, not yet verified" });
  }

  const status = linkStatus(node);
  if (status === "invited_not_opened" && node.smartLinkSentAt) {
    const daysSinceSent = Math.round((now.getTime() - new Date(node.smartLinkSentAt).getTime()) / 86_400_000);
    if (daysSinceSent > PRECURSOR_STALE_DAYS) {
      contributions.push({ node, points: PRECURSOR_RISK_WEIGHTS.staleInvite, reason: `invited ${daysSinceSent} days ago, still not opened` });
    }
  }

  if (node.verifierAccreditationExpiryDate) {
    const daysToExpiry = Math.round((new Date(node.verifierAccreditationExpiryDate).getTime() - new Date(periodEnd).getTime()) / 86_400_000);
    if (daysToExpiry >= 0 && daysToExpiry <= ACCREDITATION_EXPIRY_WINDOW_DAYS) {
      contributions.push({ node, points: PRECURSOR_RISK_WEIGHTS.accreditationExpiringSoon, reason: `verifier accreditation expires within ${ACCREDITATION_EXPIRY_WINDOW_DAYS} days of period end` });
    }
  }

  // Read directly off verificationChecks rather than through linkStatus():
  // the moment a verified claim fails its checks, saveSupplier's own
  // mandatory fallback (lib/precursor-suppliers.ts) drops dataOrigin to
  // "default_value" in the SAME write — so linkStatus(), which gates on
  // dataOrigin === "supplier_verified", can never actually observe
  // "submitted_failed_validation" after that fallback has run. The
  // structured metadata a failed attempt LEFT BEHIND is still there, and is
  // what this checks instead — a node genuinely is riskier for having tried
  // and failed than for never having been asked at all, which is exactly
  // the distinction defaultValue's own 15 points cannot make on its own.
  if (node.smartLinkSubmittedAt && node.verificationChecks) {
    const c = node.verificationChecks;
    const allPassed = c.accreditationValid && c.sectoralScopeMatch && c.periodCovered && c.fileIntact;
    if (!allPassed) {
      contributions.push({ node, points: PRECURSOR_RISK_WEIGHTS.failedValidation, reason: "submitted, but failed the four-check validation" });
    }
  }

  return contributions;
}

export type PrecursorRiskResult = {
  score: number;
  topFactor: NodeRiskContribution | null;
};

export function precursorRiskFor(workspace: Pick<VerificationWorkspace, "id" | "periodEnd">, now: Date = new Date()): PrecursorRiskResult {
  const nodes = listSuppliers(workspace.id);
  const all = nodes.flatMap((n) => riskPointsFor(n, workspace.periodEnd, now));
  const total = all.reduce((a, c) => a + c.points, 0);
  const topFactor = all.length > 0 ? all.reduce((best, c) => (c.points > best.points ? c : best)) : null;
  return { score: Math.min(100, total), topFactor };
}
