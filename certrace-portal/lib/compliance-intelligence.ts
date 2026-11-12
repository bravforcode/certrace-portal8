/* ════════════════════════════════════════════════════════════
   STAGE 2 — COMPLIANCE INTELLIGENCE (AI, advisory only)

   Never re-validates supplier data (that's the supplier-side lib/ai-check.ts)
   and never produces a number that could appear in a filed output (that's
   Stage 1, lib/compliance-engine.ts). This layer produces judgment: trust,
   narrative, business-impact framing, and what a reviewer should look at —
   always explainable, always overridable by a human.

   Deterministic rules over the submitted rollup, no model call and no canned
   results — same seam as lib/ai-check.ts, where a model call would slot in. See docs/EXPORTER-PORTAL-REDESIGN.md §4.
   ════════════════════════════════════════════════════════════ */

import type { ReviewRollup } from "./exporter-review";
import type { ComplianceFacts } from "./compliance-engine";
import { EU_ETS_PROXY_EUR_PER_TCO2E } from "./compliance-engine";

export type TrustFactor = { label: string; impact: number; detail: string }; // impact: signed points vs a 100 baseline

export type WeakEvidenceItem = { supplier: string; detail: string };
export type AssumptionItem = { supplier: string; detail: string };
export type RoutingSuggestion = {
  supplier: string;
  role: "esg" | "compliance" | "legal" | "verifier";
  reason: string;
};

export type IntelligenceReport = {
  trustScore: number;
  trustFactors: TrustFactor[];
  changeNarrative: string[];
  businessImpact: { low: number; high: number; note: string };
  weakEvidence: WeakEvidenceItem[];
  assumptions: AssumptionItem[];
  routing: RoutingSuggestion[];
  approvalRecommendation: {
    recommend: boolean;
    confidence: "low" | "medium" | "high";
    rationale: string;
  };
};

function trustScoreFor(
  roll: ReviewRollup,
  facts: ComplianceFacts,
): { score: number; factors: TrustFactor[] } {
  const factors: TrustFactor[] = [];
  let score = 100;

  const avgQuality = roll.avgScore ?? 100;
  const qualityDelta = Math.round((avgQuality - 100) * 0.5);
  if (qualityDelta !== 0) {
    factors.push({
      label: "Supplier data-quality average",
      impact: qualityDelta,
      detail: `Average AI quality score across submissions is ${avgQuality}/100.`,
    });
    score += qualityDelta;
  }

  if (facts.anyCapViolations) {
    const n = Object.values(facts.perSupplier).reduce(
      (a, s) => a + s.capViolations.length,
      0,
    );
    factors.push({
      label: "Complex goods on default values",
      impact: -5,
      detail: `${n} complex-good product${n === 1 ? "" : "s"} report on default values with no actual data. That is allowed (Annex II A.1(2)), but defaults carry a mark-up and usually give a higher figure.`,
    });
    score -= 5;
  }

  if (facts.anyUnverifiedActual) {
    const n = Object.values(facts.perSupplier).reduce(
      (a, s) => a + s.unverifiedActual.length,
      0,
    );
    factors.push({
      label: "Unverified actual-value claims",
      impact: -12,
      detail: `${n} product${n === 1 ? "" : "s"} claim actual-value methodology with no accredited verification statement on file.`,
    });
    score -= 12;
  }

  const evidenceGapCount = Object.values(facts.perSupplier).reduce(
    (a, s) => a + s.evidenceGaps.filter((g) => g.required).length,
    0,
  );
  if (evidenceGapCount > 0) {
    factors.push({
      label: "Required evidence missing",
      impact: -8,
      detail: `${evidenceGapCount} required document${evidenceGapCount === 1 ? "" : "s"} not yet attached across submitted suppliers.`,
    });
    score -= 8;
  }

  if (roll.anomalies > 0) {
    factors.push({
      label: "Unresolved anomalies",
      impact: -6,
      detail: `${roll.anomalies} anomaly flag${roll.anomalies === 1 ? "" : "s"} from the supplier-side AI check remain open.`,
    });
    score -= 6;
  }

  if (roll.awaitingCount === 0 && roll.total > 0) {
    factors.push({
      label: "Full supplier coverage",
      impact: 5,
      detail:
        "Every invited supplier has submitted — nothing is missing from the dataset.",
    });
    score += 5;
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), factors };
}

function changeNarrativeFor(roll: ReviewRollup): string[] {
  const lines: string[] = [];
  const submitted = roll.submissions.filter((s) => s.submitted);
  const withHistory = submitted.filter((s) => s.versions.length > 1);

  for (const s of withHistory) {
    const prev = s.versions[s.versions.length - 2];
    const cur = s.versions[s.versions.length - 1];
    if (prev.score !== cur.score) {
      const delta = cur.score - prev.score;
      lines.push(
        `${s.supplier.name}: data-quality score ${delta > 0 ? "improved" : "dropped"} from ${prev.score} to ${cur.score} between v${prev.n} and v${cur.n}.`,
      );
    }
  }

  const defaultUsers = submitted.filter((s) =>
    s.check?.findings.some(
      (f) => f.fieldId === "method" && f.severity === "warning",
    ),
  );
  if (defaultUsers.length > 0) {
    lines.push(
      `${defaultUsers.length} supplier${defaultUsers.length === 1 ? "" : "s"} report on default emission factors rather than actual installation data this period.`,
    );
  }

  const newCritical = submitted.filter(
    (s) => s.supplier.critical && s.lifecycle !== "approved",
  );
  if (newCritical.length > 0) {
    lines.push(
      `${newCritical.length} CBAM-critical supplier${newCritical.length === 1 ? "" : "s"} — ${newCritical.map((s) => s.supplier.name).join(", ")} — still need${newCritical.length === 1 ? "s" : ""} a decision before this declaration can be filed.`,
    );
  }

  if (lines.length === 0)
    lines.push(
      "No material change versus the prior review — figures and methodology are consistent with what's been approved before.",
    );
  return lines;
}

function businessImpactFor(facts: ComplianceFacts): {
  low: number;
  high: number;
  note: string;
} {
  const mid = facts.totalNetExposureEUR;
  return {
    low: Math.round(mid * 0.85),
    high: Math.round(mid * 1.15),
    note: `Illustrative CBAM certificate exposure at ≈€${EU_ETS_PROXY_EUR_PER_TCO2E}/tCO₂e (EU ETS proxy), net of the Scope 2 liability rule, default-value markup and carbon price already paid. Not a filed figure — the range reflects price and verification uncertainty.`,
  };
}

function weakEvidenceFor(
  facts: ComplianceFacts,
  roll: ReviewRollup,
): WeakEvidenceItem[] {
  const byId = new Map(roll.submissions.map((s) => [s.supplier.id, s]));
  const items: WeakEvidenceItem[] = [];
  for (const [supplierId, sf] of Object.entries(facts.perSupplier)) {
    const name = byId.get(supplierId)?.supplier.name ?? supplierId;
    for (const p of sf.unverifiedActual) {
      items.push({
        supplier: name,
        detail: `${p.productName} is reported as "actual" methodology but carries no verification statement — the strongest claim with the weakest backing.`,
      });
    }
    for (const g of sf.evidenceGaps.filter((x) => x.required)) {
      items.push({
        supplier: name,
        detail: `${g.docLabel} was requested but never attached.`,
      });
    }
  }
  return items;
}

function assumptionsFor(
  facts: ComplianceFacts,
  roll: ReviewRollup,
): AssumptionItem[] {
  const byId = new Map(roll.submissions.map((s) => [s.supplier.id, s]));
  const items: AssumptionItem[] = [];
  for (const [supplierId, sf] of Object.entries(facts.perSupplier)) {
    const name = byId.get(supplierId)?.supplier.name ?? supplierId;
    for (const p of sf.defaultMethodProducts) {
      items.push({
        supplier: name,
        detail: `${p}: default emission factors used, marked up per the current-year schedule rather than measured at the installation.`,
      });
    }
  }
  return items;
}

function routingFor(
  facts: ComplianceFacts,
  roll: ReviewRollup,
): RoutingSuggestion[] {
  const byId = new Map(roll.submissions.map((s) => [s.supplier.id, s]));
  const suggestions: RoutingSuggestion[] = [];
  for (const [supplierId, sf] of Object.entries(facts.perSupplier)) {
    const name = byId.get(supplierId)?.supplier.name ?? supplierId;
    if (sf.capViolations.length > 0)
      suggestions.push({
        supplier: name,
        role: "compliance",
        reason:
          "Default-value cap breach on a complex good — methodology needs a documented decision before filing.",
      });
    if (sf.unverifiedActual.length > 0)
      suggestions.push({
        supplier: name,
        role: "verifier",
        reason:
          "Actual-value claim has no accredited verification on file yet.",
      });
    if (
      byId.get(supplierId)?.supplier.critical &&
      byId.get(supplierId)?.lifecycle !== "approved"
    )
      suggestions.push({
        supplier: name,
        role: "esg",
        reason: "CBAM-critical supplier, not yet approved this cycle.",
      });
  }
  return suggestions;
}

/** Stage 2 entry point. Reads Stage 1's facts + the submission rollup and
    returns judgment only — nothing here is authoritative. */
export function buildIntelligence(
  roll: ReviewRollup,
  facts: ComplianceFacts,
): IntelligenceReport {
  const { score, factors } = trustScoreFor(roll, facts);
  const weakEvidence = weakEvidenceFor(facts, roll);
  const assumptions = assumptionsFor(facts, roll);

  const recommend =
    score >= 80 && weakEvidence.length === 0 && roll.awaitingCount === 0;
  const confidence: "low" | "medium" | "high" =
    score >= 90 ? "high" : score >= 70 ? "medium" : "low";

  return {
    trustScore: score,
    trustFactors: factors,
    changeNarrative: changeNarrativeFor(roll),
    businessImpact: businessImpactFor(facts),
    weakEvidence,
    assumptions,
    routing: routingFor(facts, roll),
    approvalRecommendation: {
      recommend,
      confidence,
      rationale: recommend
        ? "Every submission is in, evidence is complete, and no methodology rule is breached — this declaration is ready for internal sign-off."
        : "At least one gap (methodology, evidence, or an outstanding supplier) should be resolved or explicitly accepted before recommending sign-off.",
    },
  };
}
