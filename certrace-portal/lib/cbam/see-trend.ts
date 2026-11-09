/* ════════════════════════════════════════════════════════════
   WIDGET F (SEE TREND) AND WIDGET I (COUNTRY DEFAULT BENCHMARK)

   Both read the same two things — the workspace's own month-by-month SEE
   and its category default — so they live together rather than each
   re-deriving the monthly series independently.
   ════════════════════════════════════════════════════════════ */

import { defaultSeeForWorkspace } from "./cost-exposure";
import { monthNameLong, type VerificationWorkspace } from "../workspace";
import type { WorkspaceSEE } from "../workspace-see";

export type SeeTrendPoint = {
  month: string;
  monthLabel: string;
  seeDirect: number;
  seeIndirect: number;
  seeTotal: number;
};

/** One point per month that has a real, computable SEE — a month with zero
    production is omitted rather than plotted as a false zero, which would
    read as "this month's installation was carbon-free" instead of what it
    actually is: nothing entered yet. */
export function seeTrendFor(see: WorkspaceSEE): SeeTrendPoint[] {
  /* The total is what counts for the good: steel, aluminium and hydrogen are direct-only (Annex II to Regulation (EU) 2023/956), so the electricity
     they draw stays in its own series and is not added to the line that is read against the EU default. */
  const indirect = see.indirectCounted ? 1 : 0;
  return see.months
    .filter((m) => m.counted && m.productionTonnes > 0)
    .map((m) => ({
      month: m.month,
      monthLabel: monthNameLong(m.month),
      seeDirect: m.directTCO2 / m.productionTonnes,
      seeIndirect: m.indirectTCO2 / m.productionTonnes,
      seeTotal: (m.directTCO2 + indirect * m.indirectTCO2) / m.productionTonnes,
    }));
}

export type SeeQuarterPoint = {
  quarter: string; // "2026-Q1"
  quarterLabel: string; // "Q1 2026"
  seeDirect: number;
  seeIndirect: number;
  seeTotal: number;
  /** how many of the quarter's three months actually had production — shown
      alongside the point so a quarter built from one month does not read
      the same as one built from three. */
  monthsCounted: number;
};

/** One point per quarter that has at least one counted month, production-
    weighted rather than averaged month-to-month: raw tCO2 and raw tonnes are
    summed across the quarter BEFORE dividing, so a quarter with one light
    month and one heavy month is not weighted as if they were equal. */
export function seeTrendByQuarter(see: WorkspaceSEE): SeeQuarterPoint[] {
  const indirect = see.indirectCounted ? 1 : 0;
  const groups = new Map<string, { directTCO2: number; indirectTCO2: number; productionTonnes: number; monthsCounted: number }>();
  for (const m of see.months) {
    if (!m.counted || m.productionTonnes <= 0) continue;
    const [year, month] = m.month.split("-");
    const key = `${year}-Q${Math.ceil(Number(month) / 3)}`;
    const g = groups.get(key) ?? { directTCO2: 0, indirectTCO2: 0, productionTonnes: 0, monthsCounted: 0 };
    g.directTCO2 += m.directTCO2;
    g.indirectTCO2 += m.indirectTCO2;
    g.productionTonnes += m.productionTonnes;
    g.monthsCounted += 1;
    groups.set(key, g);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([quarter, g]) => ({
      quarter,
      quarterLabel: `Q${quarter.split("-Q")[1]} ${quarter.slice(0, 4)}`,
      seeDirect: g.directTCO2 / g.productionTonnes,
      seeIndirect: g.indirectTCO2 / g.productionTonnes,
      seeTotal: (g.directTCO2 + indirect * g.indirectTCO2) / g.productionTonnes,
      monthsCounted: g.monthsCounted,
    }));
}

export type BenchmarkOutperformance = {
  workspace: VerificationWorkspace;
  category: string;
  seeActual: number;
  seeDefault: number;
  outperformancePercent: number;
};

/** ((default − actual) / default) × 100 — positive means better than the
    default, exactly as the prompt pack's formula states. Null when there is
    nothing to compare yet (no default on file, or SEE not computable). */
export function benchmarkOutperformance(workspace: VerificationWorkspace, see: WorkspaceSEE): BenchmarkOutperformance | null {
  if (!see.computable) return null;
  const def = defaultSeeForWorkspace(workspace);
  if (!def) return null;
  const seeDefault = def.defaultSeeDirect + def.defaultSeeIndirect;
  if (!(seeDefault > 0)) return null;
  // What the EU default is a default FOR: the direct figure and what comes in with the precursors, plus indirect only where it counts.
  const seeActual = see.seeDirect + see.seePrecursor + (see.indirectCounted ? see.seeIndirect : 0);
  const outperformancePercent = ((seeDefault - seeActual) / seeDefault) * 100;
  return { workspace, category: def.aggregatedGoodsCategory, seeActual, seeDefault, outperformancePercent };
}
