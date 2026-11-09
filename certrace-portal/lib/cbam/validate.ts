/* ════════════════════════════════════════════════════════════
   THE VERIFIER PRE-CHECK — V1…V16 (spec §6)

   Sixteen pure predicates. Together they answer the only question an exporter
   actually wants answered before spending money on a verification: am I ready
   to call one?

   Two severities, and the difference is not cosmetic:

     error — blocks freeze and submit. These are not opinions. An emission
             factor 25× out of band, a scrap precursor declared at a non-zero
             figure, a preparer approving their own numbers: each of them
             produces a filing that is wrong, and letting it through would
             make the portal complicit rather than merely unhelpful.

     warn  — surfaced, overridable, and the override is RECORDED with a
             justification. A 0.9 MWh/t electricity intensity is unusual, not
             impossible, and an exporter with a genuine reason should be able
             to proceed — as long as the reason travels with the dossier
             instead of evaporating.

   Every rule returns the field it applies to, so the readiness score can link
   each failure to the screen that fixes it. A finding with no route to a fix
   is a complaint, not a check.
   ════════════════════════════════════════════════════════════ */

import { monthsInPeriod } from "./boundary";
import { isAssumption, provenanceRefs, type ActivityDataset } from "./activity";
import { needsNcv } from "./units";
import { flattenTree, seeForNode, massBalanceYield, PrecursorTreeError, type PrecursorNode } from "./precursor-tree";
import { FUEL_EF_BAND, ELECTRICITY_INTENSITY_BAND, MASS_BALANCE_BAND } from "./reference";
import { unexplainedMonths, gapShare, type GapEntry } from "./data-gaps";
import { SHIPPED_OVER_PRODUCED_TOLERANCE } from "../annual-production";

export type Severity = "error" | "warn";

export type RuleId =
  | "V1" | "V2" | "V3" | "V4" | "V5" | "V6" | "V7" | "V8"
  | "V9" | "V10" | "V11" | "V12" | "V13" | "V14" | "V15" | "V16";

export type Finding = {
  id: RuleId;
  severity: Severity;
  message: string;
  /** the input this is about, matching a ProvenanceRef key where there is one */
  field?: string;
};

/** Which screen fixes a given rule. The readiness score is only useful if
    every failure is one click from being addressed. */
export const RULE_SCREEN: Record<RuleId, { label: string; path: (declId: string) => string }> = {
  V1: { label: "Activity data", path: (d) => `/declarations/${d}/activity` },
  V2: { label: "Activity data", path: (d) => `/declarations/${d}/activity` },
  V3: { label: "Activity data", path: (d) => `/declarations/${d}/activity` },
  V4: { label: "Linked shipments", path: (d) => `/declarations/${d}` },
  V5: { label: "Activity data", path: (d) => `/declarations/${d}/activity` },
  V6: { label: "Precursors", path: (d) => `/declarations/${d}` },
  V7: { label: "Precursors", path: (d) => `/declarations/${d}` },
  V8: { label: "Precursors", path: (d) => `/declarations/${d}` },
  V9: { label: "Supplier data", path: (d) => `/declarations/${d}` },
  V10: { label: "Evidence pack", path: (d) => `/declarations/${d}/evidence` },
  V11: { label: "Month coverage", path: (d) => `/declarations/${d}/activity` },
  V12: { label: "Data gaps", path: (d) => `/declarations/${d}/activity` },
  V13: { label: "Internal sign-off", path: (d) => `/declarations/${d}` },
  V14: { label: "Supplier data", path: (d) => `/declarations/${d}` },
  V15: { label: "Monitoring methodology", path: (d) => `/declarations/${d}/mmd` },
  V16: { label: "Supplier data", path: (d) => `/declarations/${d}` },
};

export const RULE_TITLE: Record<RuleId, string> = {
  V1: "Fuel entries carry a calorific value",
  V2: "Emission factors are plausible",
  V3: "Production denominator is present",
  V4: "Shipped does not exceed produced",
  V5: "Electricity intensity is plausible",
  V6: "Mass balance holds",
  V7: "Scrap is zero-rated",
  V8: "Precursor chain is acyclic",
  V9: "Complex-good default values reviewed",
  V10: "Every filed input has evidence",
  V11: "Every month is accounted for",
  V12: "Estimated share is under control",
  V13: "Preparer is not the approver",
  V14: "Supplier data is current",
  V15: "Assumptions are disclosed",
  V16: "Actual-method claims are verified",
};

/* Weights for the readiness score. Not all failures are equal: a missing
   denominator means nothing computes at all, while a stale supplier record is
   a conversation. Weighted so the score moves most when the exporter fixes
   the thing that actually blocks them. */
export const RULE_WEIGHT: Record<RuleId, number> = {
  V1: 3, V2: 3, V3: 3, V4: 1, V5: 1, V6: 1, V7: 3, V8: 3,
  V9: 2, V10: 3, V11: 2, V12: 1, V13: 3, V14: 1, V15: 2, V16: 2,
};

export type ValidationInput = {
  declarationId: string;
  dataset: ActivityDataset | null;
  precursorTree: PrecursorNode[];
  gaps: GapEntry[];
  /** tonnes attributed to this declaration */
  shippedTonnes: number;
  /** EAF steel vs aluminium smelting changes the plausible power draw entirely */
  electricityBand: keyof typeof ELECTRICITY_INTENSITY_BAND;
  /** evidenceFileIds that still resolve to a file that exists */
  liveEvidenceIds: Set<string>;
  /** complex goods whose emissions are wholly on default values */
  defaultOnlyComplexGoods: string[];
  /** goods claiming actual data with no verification statement on file */
  unverifiedActualGoods: string[];
  /** supplier records older than AGING_DAYS at period end, by company */
  staleSupplierRecords: string[];
  /** who prepared and who approved, when a freeze has been attempted */
  preparerId?: string;
  approverId?: string;
  /** inputs the MMD's assumptions register actually lists */
  disclosedAssumptions: Set<string>;
  totalTCO2e: number;
};

/** The complex-good default cap, restated here so the rule and the constant
    cannot drift apart. Matches COMPLEX_GOOD_DEFAULT_CAP in
    lib/compliance-engine.ts. */
export const COMPLEX_GOOD_DEFAULT_CAP = 0.2;

export function validate(input: ValidationInput): Finding[] {
  const f: Finding[] = [];
  const d = input.dataset;

  /* V1 — a quantity that is not already energy needs an NCV. Without it the
     row cannot be converted at all, and a fallback would be an invisible
     assumption inside a filed number. */
  if (d) {
    for (const fuel of d.fuels) {
      if (needsNcv(fuel.unit) && !(fuel.ncv && fuel.ncv > 0)) {
        f.push({
          id: "V1",
          severity: "error",
          message: `${fuel.fuel} is measured in ${fuel.unit} but has no net calorific value, so it cannot be converted to energy.`,
          field: `fuel:${fuel.id}:ncv`,
        });
      }
    }
  }

  /* V2 — the unit trap. 0.0561 is the real natural-gas factor per GJ; read as
     a factor per m³ it is ~25× too high and otherwise invisible. */
  if (d) {
    for (const fuel of d.fuels) {
      const band = FUEL_EF_BAND[fuel.fuel];
      if (fuel.emissionFactor > 0 && (fuel.emissionFactor < band.low || fuel.emissionFactor > band.high)) {
        f.push({
          id: "V2",
          severity: "error",
          message: `${fuel.fuel} emission factor ${fuel.emissionFactor} tCO₂/GJ is outside the plausible range ${band.low}–${band.high}. A factor stated per m³ instead of per GJ lands about 25× high.`,
          field: `fuel:${fuel.id}:ef`,
        });
      }
    }
  }

  /* V3 — no denominator, no per-tonne figure. */
  if (!d || !(d.annualProductionTonnes > 0)) {
    f.push({
      id: "V3",
      severity: "error",
      message: "Annual production quantity is missing. Every per-tonne figure divides by it.",
      field: "production:annual:value",
    });
  }

  /* V4 — shipped ≤ produced × 1.05. Opening stock explains a few percent. */
  if (d && d.annualProductionTonnes > 0 && input.shippedTonnes > d.annualProductionTonnes * SHIPPED_OVER_PRODUCED_TOLERANCE.value) {
    f.push({
      id: "V4",
      severity: "warn",
      message: `${input.shippedTonnes.toLocaleString("en-US")} t shipped against ${d.annualProductionTonnes.toLocaleString("en-US")} t produced. Either the production quantity is understated or a shipment belongs to another period.`,
      field: "production:annual:value",
    });
  }

  /* V5 — a scrap EAF's power draw is one of the most reliable sanity checks
     in the sector, and aluminium electrolysis is an order of magnitude apart.
     One shared band would accept both a typo and the truth. */
  if (d && d.annualProductionTonnes > 0 && d.electricity.length > 0) {
    const band = ELECTRICITY_INTENSITY_BAND[input.electricityBand];
    const mwhPerTonne = d.electricity.reduce((a, e) => a + e.mwhAbsolute, 0) / d.annualProductionTonnes;
    if (mwhPerTonne < band.low || mwhPerTonne > band.high) {
      f.push({
        id: "V5",
        severity: "warn",
        message: `Electricity intensity is ${mwhPerTonne.toFixed(3)} MWh/t, outside the ${band.low}–${band.high} range for this route. Check the figure is the period total rather than a per-tonne value.`,
        field: "electricity",
      });
    }
  }

  /* V6 — 1 / Σ(input per tonne). Below 70% the bill of materials consumes
     more than any real process needs; above 100% it claims to create mass. */
  const yieldValue = massBalanceYield(input.precursorTree);
  if (yieldValue != null && (yieldValue < MASS_BALANCE_BAND.low || yieldValue > MASS_BALANCE_BAND.high)) {
    f.push({
      id: "V6",
      severity: "warn",
      message: `Mass-balance yield is ${(yieldValue * 100).toFixed(1)}%, outside the plausible ${MASS_BALANCE_BAND.low * 100}–${MASS_BALANCE_BAND.high * 100}% range. Check the quantity per tonne on each precursor.`,
      field: "precursors",
    });
  }

  /* V7 — scrap carries no embedded emissions under CBAM. A figure on a scrap
     row overstates the exporter's own emissions and fails on inspection. */
  for (const { node } of flattenTree(input.precursorTree)) {
    if (node.isScrap) {
      let effective = 0;
      try {
        effective = seeForNode(node);
      } catch {
        effective = 0; // V8 reports the structural problem
      }
      if (effective !== 0) {
        f.push({ id: "V7", severity: "error", message: `"${node.name}" is marked as scrap but resolves to ${effective} tCO₂e/t. Scrap is zero-rated.`, field: "precursors" });
      }
    }
  }

  /* V8 — a loop or an over-deep chain is a data-entry error that used to hang
     the browser. It blocks, because nothing downstream can be computed. */
  try {
    for (const node of input.precursorTree) seeForNode(node);
  } catch (err) {
    f.push({
      id: "V8",
      severity: "error",
      message: err instanceof PrecursorTreeError ? err.message : "The precursor chain cannot be resolved.",
      field: "precursors",
    });
  }

  /* V9 — a complex good reported entirely on default values. A WARNING, not an
     error: Annex II A.1(2) to Implementing Regulation (EU) 2025/2547 lets an
     operator use default values for one, several or all precursors (Article
     15), and neither Regulation 2023/956 nor its 2025 amendment caps the share.
     The 20 % ceiling was a transitional-period rule. What is true, and worth
     saying, is that defaults carry a mark-up and tend to cost more than a
     verified actual value. */
  for (const good of input.defaultOnlyComplexGoods) {
    f.push({
      id: "V9",
      severity: "warn",
      message: `${good} is a complex good reported entirely on default values. That is allowed, but defaults carry a mark-up and usually give a higher figure than a verified actual value would.`,
      field: "supplier-data",
    });
  }

  /* V10 — traceability. Every input a filed figure depends on needs a
     document a verifier can be handed. */
  if (d) {
    for (const ref of provenanceRefs(d)) {
      if (!ref.critical) continue;
      const id = ref.provenance.evidenceFileId;
      if (!id || !input.liveEvidenceIds.has(id)) {
        f.push({ id: "V10", severity: "error", message: `${ref.label} has no evidence attached.`, field: ref.key });
      }
    }
  }

  /* V11 — a month with neither a reading nor an explanation is the only real
     completeness failure. */
  if (d) {
    const missing = unexplainedMonths(d.period, d.monthsCovered ?? [], input.gaps);
    if (missing.length > 0) {
      f.push({
        id: "V11",
        severity: "error",
        message: `${missing.length} of ${monthsInPeriod(d.period).length} months have no reading and no data-gap entry: ${missing.join(", ")}.`,
        field: "month-coverage",
      });
    }
  }

  /* V12 — past a fifth of the total, the estimate IS the number. */
  const share = gapShare(input.gaps, input.totalTCO2e);
  if (share.escalate) {
    f.push({ id: "V12", severity: "warn", message: share.message ?? "Estimated emissions exceed the escalation threshold.", field: "data-gaps" });
  }

  /* V13 — segregation of duties. Also enforced at the store layer in
     lib/cbam/freeze.ts; this is the version that shows in the score. */
  if (input.preparerId && input.approverId && input.preparerId.trim().toLowerCase() === input.approverId.trim().toLowerCase()) {
    f.push({ id: "V13", severity: "error", message: "The preparer and the approver are the same person. Sign-off needs two.", field: "signoff" });
  }

  /* V14 — precursor data reused from a record that was already stale when the
     period closed. */
  for (const company of input.staleSupplierRecords) {
    f.push({
      id: "V14",
      severity: "warn",
      message: `${company}'s data was already over a year old when this reporting period closed. Re-confirm it before filing.`,
      field: "supplier-data",
    });
  }

  /* V15 — an assumption is allowed; an undeclared one is not. Every input
     marked ASSUMPTION has to appear in the MMD's register. */
  if (d) {
    for (const ref of provenanceRefs(d)) {
      if (isAssumption(ref.provenance) && !input.disclosedAssumptions.has(ref.key)) {
        f.push({ id: "V15", severity: "error", message: `${ref.label} is an assumption but does not appear in the MMD's assumptions register.`, field: ref.key });
      }
    }
  }

  /* V16 — claiming actual data without a verification statement. */
  for (const good of input.unverifiedActualGoods) {
    f.push({ id: "V16", severity: "error", message: `${good} claims actual data with no accredited verification statement on file.`, field: "supplier-data" });
  }

  return f;
}

/* ── Readiness score ────────────────────────────────────────────
   A single 0–100 figure: the weighted pass rate across V1…V16. A rule that
   produced no finding passed; a rule that produced any error failed
   outright; a rule that produced only warnings scores half, because a warning
   is a real reservation and pretending otherwise would make the number
   flattering rather than useful.

   This is the exporter's answer to "am I ready to call the verifier?", and
   it is the highest-leverage screen in the product precisely because it is
   the only place the whole picture is one number. */
export type RuleResult = {
  id: RuleId;
  title: string;
  status: "pass" | "warn" | "fail";
  findings: Finding[];
  weight: number;
  screen: { label: string; path: string };
};

export type Readiness = {
  score: number; // 0–100
  rules: RuleResult[];
  failing: RuleResult[];
  errors: number;
  warnings: number;
  /** errors block freeze and submit */
  blocked: boolean;
  verdict: "not ready" | "nearly" | "ready";
};

const ALL_RULES: RuleId[] = ["V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10", "V11", "V12", "V13", "V14", "V15", "V16"];

export function readiness(findings: Finding[], declarationId: string): Readiness {
  const byRule = new Map<RuleId, Finding[]>();
  for (const f of findings) byRule.set(f.id, [...(byRule.get(f.id) ?? []), f]);

  const rules: RuleResult[] = ALL_RULES.map((id) => {
    const list = byRule.get(id) ?? [];
    const status: RuleResult["status"] = list.some((x) => x.severity === "error") ? "fail" : list.length > 0 ? "warn" : "pass";
    return {
      id,
      title: RULE_TITLE[id],
      status,
      findings: list,
      weight: RULE_WEIGHT[id],
      screen: { label: RULE_SCREEN[id].label, path: RULE_SCREEN[id].path(declarationId) },
    };
  });

  const totalWeight = rules.reduce((a, r) => a + r.weight, 0);
  const earned = rules.reduce((a, r) => a + (r.status === "pass" ? r.weight : r.status === "warn" ? r.weight * 0.5 : 0), 0);
  const score = Math.round((earned / totalWeight) * 100);
  const errors = findings.filter((x) => x.severity === "error").length;
  const warnings = findings.filter((x) => x.severity === "warn").length;

  return {
    score,
    rules,
    failing: rules.filter((r) => r.status !== "pass"),
    errors,
    warnings,
    blocked: errors > 0,
    verdict: errors > 0 ? "not ready" : warnings > 0 ? "nearly" : "ready",
  };
}

/* ── Overrides ──────────────────────────────────────────────────
   A warning can be accepted, but never silently. The justification is stored
   and travels into the dossier, because "we knew and here is why" is a
   defensible position and "nobody looked" is not. */
export type Override = { ruleId: RuleId; field?: string; justification: string; by: string; at: number };

const KEY = "certrace:validation-overrides";

export function listOverrides(declarationId: string): Override[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return ((JSON.parse(raw) as Record<string, Override[]>)[declarationId] ?? []);
  } catch {
    return [];
  }
}

export function saveOverride(declarationId: string, override: Override): Override[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, Override[]>) : {};
    const list = (all[declarationId] ?? []).filter((o) => !(o.ruleId === override.ruleId && o.field === override.field));
    all[declarationId] = [...list, override];
    window.localStorage.setItem(KEY, JSON.stringify(all));
    return all[declarationId];
  } catch {
    return [];
  }
}

/** An error can never be overridden — only warnings. */
export const canOverride = (severity: Severity): boolean => severity === "warn";
