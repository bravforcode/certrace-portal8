/* ════════════════════════════════════════════════════════════
   MONTHLY → ANNUAL — formulas M1 to M10

   These extend Part 1's F1–F11 to a monthly grain. The whole discipline is
   one sentence:

     AGGREGATE NUMERATOR AND DENOMINATOR SEPARATELY, THEN DIVIDE ONCE.

   Σ(emissions) / Σ(production) ≠ mean(monthly SEE) whenever monthly output
   varies, which it always does. Averaging twelve monthly SEEs weights a
   quiet August the same as a full March, and the answer is wrong in a
   direction nobody can predict. So nothing in this file divides inside a
   loop, and `indicativeMonthlySEE` in lib/monthly-data.ts is labelled as a
   trend indicator everywhere it renders.

     M1  production_annual = Σ_m production_m                           [t]
     M2  fuel_CO2_m        = Σ_f (qty × NCV / 1000) × EF × OF        [tCO₂]
     M3  direct_CO2_annual = Σ_m (fuel_CO2_m + process_CO2_m)        [tCO₂]
     M4  SEE_direct        = direct_CO2_annual / production_annual
     M5  elec_CO2_annual   = Σ_m (MWh_m × EF_elec_m)                 [tCO₂]
     M6  SEE_indirect      = elec_CO2_annual / production_annual
     M7  m_i               = Σ_m qty_i,m / production_annual           [t/t]
     M8  SEE_prec          = Σ_i ( m_i × SEE_eff(i) )
     M9  SEE_total         = SEE_direct + SEE_indirect + SEE_prec
     M10 SEE_charge        = (SEE_dir + SEE_prec + ind_p × SEE_ind) × (1 + µ)

   WHAT IS REUSED, NOT REBUILT. The NCV→GJ conversion and its refusal to guess
   a missing value stay in lib/cbam/units.ts. The Annex II sector rule stays
   in INDIRECT_CHARGEABLE in lib/cbam/engine.ts — `ind_p` below reads it, and
   there is still no `if (steel)` anywhere. The precursor recursion, the scrap
   short-circuit and the cycle guard stay in lib/precursor-suppliers.ts. This
   file only composes them at a monthly grain, and a test asserts it lands on
   the same figures the Part-1 engine produces from the same inputs.

   FULL PRECISION THROUGHOUT. Nothing here rounds. Rounding is a display
   decision and it belongs at the edge — round in the middle and the verifier's
   recomputation drifts in the fourth decimal, which is exactly the kind of
   discrepancy that turns a half-day review into a week.
   ════════════════════════════════════════════════════════════ */

import { indirectIsChargeable } from "./cbam/engine";
import {
  annualProductionFor,
  monthResult,
  monthsForWorkspace,
  type AnnualProduction,
  type MonthResult,
} from "./monthly-data";
import {
  precursorContribution,
  type PrecursorResult,
} from "./precursor-suppliers";
import { listInternal } from "./internal-precursors";
import {
  getWorkspace,
  goodsCategory,
  type VerificationWorkspace,
} from "./workspace";

/* ── µ_year ─────────────────────────────────────────────────────
   The default-value markup applies to figures built on published defaults,
   not to actual data. A workspace assembled from monthly meter readings
   carries µ = 0, which is why the worked example's M10 multiplies by 1.0.
   The year's markups live in lib/compliance-engine.ts (2026: 0.1, 2027: 0.2,
   2028: 0.3) and are applied there, against default-value exposure. */
export const NO_MARKUP = 0;

export type SeeWorkings = {
  /** 'M4' */
  id: string;
  label: string;
  /** the formula in symbols */
  formula: string;
  /** the formula with this workspace's numbers in it */
  substitution: string;
  /** the answer, formatted with its unit */
  result: string;
  /** the raw value, for callers that need to compute rather than print */
  value: number;
};

export type WorkspaceSEE = {
  production: AnnualProduction;
  months: MonthResult[];
  /** M3 — tCO₂ */
  directTCO2: number;
  fuelTCO2: number;
  processTCO2: number;
  /** item 16(b), counted in `directTCO2` */
  measuredTCO2: number;
  /** item 16(d), taken off `directTCO2` */
  transferredOutTCO2: number;
  /** M5 — tCO₂ */
  indirectTCO2: number;
  /** M4 */
  seeDirect: number;
  /** M6 */
  seeIndirect: number;
  /** M8 */
  seePrecursor: number;
  /** M9 */
  seeTotal: number;
  /** M10 */
  seeChargeable: number;
  /** did indirect enter the chargeable figure? Annex II says no for iron &
      steel, aluminium and hydrogen. */
  indirectCounted: boolean;
  precursors: PrecursorResult;
  /** false when production is zero or missing — every per-tonne figure above
      is then 0 and must not be shown as a result */
  computable: boolean;
  /** unit failures collected across the year, e.g. a fuel row with no NCV */
  errors: string[];
  workings: SeeWorkings[];
};

/* ── Products made at the same site (Annex IV items 18, 19, 27) ─────────
   Each row is a link to another product report of the installation (lib/internal-
   precursors.ts). The embedded emissions it carries are THAT report's own chargeable
   figure — read here, every time, so nothing is typed twice and nothing goes stale. */
export type InternalRow = {
  id: string;
  sourceWorkspaceId: string;
  /** null when the report it pointed at no longer exists */
  source: VerificationWorkspace | null;
  quantityUsedT: number | null;
  /** t of the precursor per t of this good */
  ratio: number | null;
  /** the source's specific embedded emissions that travel with it, tCO₂e/t */
  see: number;
  /** ratio × see — what it adds to this good's SEE */
  contribution: number;
  /** why it cannot be counted yet, in words; null when it can */
  issue: string | null;
};

// Reports being worked out right now. A loop (A uses B, B uses A) stops here instead of running forever; the form refuses to make one.
const working = new Set<string>();

export function internalContribution(
  workspace: Pick<VerificationWorkspace, "id" | "year">,
): { rows: InternalRow[]; perTonne: number } {
  const links = listInternal(workspace.id);
  if (links.length === 0 || working.has(workspace.id))
    return { rows: [], perTonne: 0 };
  const annual = annualProductionFor(workspace).tonnes;
  working.add(workspace.id);
  try {
    const rows = links.map((l): InternalRow => {
      const source = getWorkspace(l.sourceWorkspaceId);
      const quantityUsedT =
        l.quantityUsedT != null && l.quantityUsedT > 0 ? l.quantityUsedT : null;
      const ratio =
        quantityUsedT != null && annual > 0 ? quantityUsedT / annual : null;
      const base = {
        id: l.id,
        sourceWorkspaceId: l.sourceWorkspaceId,
        source: source ?? null,
        quantityUsedT,
        ratio,
      };
      if (!source || source.archivedAt)
        return {
          ...base,
          see: 0,
          contribution: 0,
          issue: "The product report it came from no longer exists.",
        };
      const made = workspaceSEE(source);
      if (!made.computable)
        return {
          ...base,
          see: 0,
          contribution: 0,
          issue: `${source.productName} has no production counted yet, so it has no embedded emissions to carry.`,
        };
      const see = made.seeChargeable;
      if (quantityUsedT == null)
        return {
          ...base,
          see,
          contribution: 0,
          issue: "Enter how many tonnes of it this good used.",
        };
      if (ratio == null)
        return {
          ...base,
          see,
          contribution: 0,
          issue:
            "This good has no production counted yet, so the quantity cannot be put per tonne.",
        };
      return { ...base, see, contribution: ratio * see, issue: null };
    });
    return { rows, perTonne: rows.reduce((a, r) => a + r.contribution, 0) };
  } finally {
    working.delete(workspace.id);
  }
}

const n = (v: number, dp = 4): string =>
  Number.isFinite(v)
    ? v.toLocaleString("en-GB", {
        minimumFractionDigits: 0,
        maximumFractionDigits: dp,
      })
    : "—";

/* Fixed decimals, for the substitution lines a verifier re-keys into their
   own sheet. "45" and "45.0" are the same number but not the same evidence:
   the second says the figure was carried to one decimal, which is what lets
   them reproduce the arithmetic and land on the same answer rather than
   wondering whether something was rounded on the way past. */
const fix = (v: number, dp: number): string =>
  Number.isFinite(v)
    ? v.toLocaleString("en-GB", {
        minimumFractionDigits: dp,
        maximumFractionDigits: dp,
      })
    : "—";

export function workspaceSEE(workspace: VerificationWorkspace): WorkspaceSEE {
  const entries = monthsForWorkspace(workspace);
  const production = annualProductionFor(workspace);

  /* Only months that count toward the annual figure contribute emissions.
     A draft month's gas reading against a denominator that excludes its
     production would inflate SEE — numerator and denominator must always be
     drawn from the same set of months. */
  const months = entries.map(monthResult).filter((m) => m.counted);

  const fuelTCO2 = months.reduce((a, m) => a + m.fuelTCO2, 0);
  const processTCO2 = months.reduce((a, m) => a + m.processTCO2, 0);
  const measuredTCO2 = months.reduce((a, m) => a + m.measuredTCO2, 0);
  const transferredOutTCO2 = months.reduce(
    (a, m) => a + m.transferredOutTCO2,
    0,
  );
  // Each month's own total, floored at zero: CO₂ sent on cannot take a month
  // below nothing, and a negative month must not subtract from a positive one.
  const directTCO2 = months.reduce((a, m) => a + m.directTCO2, 0); // M3
  const indirectTCO2 = months.reduce((a, m) => a + m.indirectTCO2, 0); // M5

  const q = production.tonnes;
  const computable = q > 0;

  const seeDirect = computable ? directTCO2 / q : 0; // M4
  const seeIndirect = computable ? indirectTCO2 / q : 0; // M6

  const precursors = precursorContribution(workspace); // M7 + M8
  const internal = internalContribution(workspace);
  const seePrecursor = precursors.perTonne + internal.perTonne;

  const seeTotal = seeDirect + seeIndirect + seePrecursor; // M9

  const indirectCounted = indirectIsChargeable(goodsCategory(workspace));
  const seeChargeable =
    (seeDirect + seePrecursor + (indirectCounted ? seeIndirect : 0)) *
    (1 + NO_MARKUP); // M10

  const errors = months.flatMap((m) => m.errors);

  const workings: SeeWorkings[] = [
    {
      id: "M1",
      label: "Annual production",
      formula: "production_annual = Σ_m production_m",
      substitution: `${months.map((m) => n(m.productionTonnes, 3)).join(" + ")} t`,
      result: `${n(q, 3)} t`,
      value: q,
    },
    {
      id: "M3",
      label: "Direct emissions",
      formula: "direct_CO₂_annual = Σ_m (fuel_CO₂_m + process_CO₂_m)",
      substitution:
        `${n(fuelTCO2, 2)} tCO₂ (fuel) + ${n(processTCO2, 2)} tCO₂ (process)` +
        (measuredTCO2 > 0 ? ` + ${n(measuredTCO2, 2)} tCO₂e (measured)` : "") +
        (transferredOutTCO2 > 0
          ? ` − ${n(transferredOutTCO2, 2)} tCO₂ (sent on, not emitted)`
          : ""),
      result: `${n(directTCO2, 2)} tCO₂`,
      value: directTCO2,
    },
    {
      id: "M4",
      label: "Direct SEE",
      formula: "SEE_direct = direct_CO₂_annual / production_annual",
      substitution: `(${fix(fuelTCO2, 1)} + ${fix(processTCO2, 1)}${measuredTCO2 > 0 ? ` + ${fix(measuredTCO2, 1)}` : ""}${transferredOutTCO2 > 0 ? ` − ${fix(transferredOutTCO2, 1)}` : ""}) tCO₂ / ${n(q, 0)} t`,
      result: `${fix(seeDirect, 4)} tCO₂e/t`,
      value: seeDirect,
    },
    {
      id: "M5",
      label: "Electricity emissions",
      formula: "elec_CO₂_annual = Σ_m (MWh_m × EF_elec_m)",
      substitution: `${n(
        months.reduce((a, m) => a + m.indirectTCO2, 0),
        2,
      )} tCO₂ across ${months.length} months`,
      result: `${n(indirectTCO2, 2)} tCO₂`,
      value: indirectTCO2,
    },
    {
      id: "M6",
      label: "Indirect SEE",
      formula: "SEE_indirect = elec_CO₂_annual / production_annual",
      substitution: `${fix(indirectTCO2, 1)} tCO₂ / ${n(q, 0)} t`,
      result: `${fix(seeIndirect, 4)} tCO₂e/t`,
      value: seeIndirect,
    },
    {
      id: "M8",
      label: "Precursor SEE",
      formula: "SEE_prec = Σ_i ( m_i × SEE_eff(i) )",
      substitution:
        [
          ...precursors.byNode
            .filter((p) => p.depth === 1)
            .map(
              (p) =>
                `${n(p.ratioFromGood ?? 0, 3)} t/t × ${p.isScrap ? "0 (scrap)" : n(p.see, 4)}`,
            ),
          ...internal.rows.map(
            (r) =>
              `${n(r.ratio ?? 0, 3)} t/t × ${n(r.see, 4)} (${r.source?.productName ?? "made here"})`,
          ),
        ].join(" + ") || "no precursors recorded",
      result: `${fix(seePrecursor, 4)} tCO₂e/t`,
      value: seePrecursor,
    },
    {
      id: "M9",
      label: "Total SEE (reported)",
      formula: "SEE_total = SEE_direct + SEE_indirect + SEE_prec",
      substitution: `${fix(seeDirect, 4)} + ${fix(seeIndirect, 4)} + ${fix(seePrecursor, 4)}`,
      result: `${fix(seeTotal, 4)} tCO₂e/t`,
      value: seeTotal,
    },
    {
      id: "M10",
      label: "Chargeable SEE",
      formula:
        "SEE_charge = (SEE_direct + SEE_prec + ind_p × SEE_indirect) × (1 + µ_year)",
      substitution:
        `(${fix(seeDirect, 4)} + ${fix(seePrecursor, 4)} + ${indirectCounted ? "1" : "0"} × ${fix(seeIndirect, 4)}) × ${fix(1 + NO_MARKUP, 1)}` +
        (indirectCounted
          ? ""
          : `  —  ind_p = 0: ${goodsCategory(workspace)} is an Annex II sector, so indirect emissions are reported but not charged`),
      result: `${fix(seeChargeable, 4)} tCO₂e/t`,
      value: seeChargeable,
    },
  ];

  return {
    production,
    months,
    directTCO2,
    fuelTCO2,
    processTCO2,
    measuredTCO2,
    transferredOutTCO2,
    indirectTCO2,
    seeDirect,
    seeIndirect,
    seePrecursor,
    seeTotal,
    seeChargeable,
    indirectCounted,
    precursors,
    computable,
    errors,
    workings,
  };
}
