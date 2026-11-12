import { accountStorage } from "../account-storage";
/* ════════════════════════════════════════════════════════════
   DATA-GAP REGISTER — the conservativeness test (gap G6)

   Every monitoring year has holes: a meter that failed in August, an invoice
   nobody can find, a sub-meter that was only installed in Q3. A verifier does
   not expect perfection. What they test is whether the holes were declared,
   how they were filled, and — the part exporters get wrong — whether the
   estimate was biased in the exporter's favour. That last question is
   "conservativeness", and it is one of the seven assertions in spec §2.

   So a gap is not an absence. It is an ENTRY: which parameter, which months,
   why, how it was estimated, why that estimate is conservative, and how many
   tonnes it accounts for. A month with neither a reading nor a gap entry is
   the only real failure state (validation V11).

   ── And the reframing ──────────────────────────────────────────
   The other half of this module is a correction to how the product talks. A
   published default value is not a saving an exporter earns by not measuring;
   it is a PENALTY for not having the data, and in the definitive period it
   carries a markup that rises every year (0.1 in 2026 → 0.3 in 2028). The
   comparison is "here is what the missing data costs you", never "here is
   what defaults save you". And when the installation is genuinely dirtier
   than the default, the number is an ADDED COST — never a negative saving,
   which is a phrase that has no meaning to anybody reading it.
   ════════════════════════════════════════════════════════════ */

import { monthsInPeriod, type ReportingPeriod } from "./boundary";
import type { Provenance } from "./activity";
import { DATA_GAP_ESCALATION_SHARE } from "./reference";
import {
  defaultExposure,
  indirectIsChargeable,
  type ExposureResult,
  type GoodsCategory,
} from "./engine";
import { lookupDefault, rateForYear } from "./eu-rates";
import { SELF_SUPPLIER_ID } from "../data";

/* ── Estimation methods ─────────────────────────────────────────
   A closed list, because "estimated" on its own is not a method. These are
   the approaches EU MRR Article 66 recognises for filling a data gap, in
   descending order of how comfortable a verifier will be with them. */
export type EstimationMethod =
  | "substitute_meter"
  | "prior_period_average"
  | "production_scaled"
  | "supplier_invoice_reconstruction"
  | "conservative_default"
  | "engineering_estimate";

export const ESTIMATION_METHODS: EstimationMethod[] = [
  "substitute_meter",
  "prior_period_average",
  "production_scaled",
  "supplier_invoice_reconstruction",
  "conservative_default",
  "engineering_estimate",
];

export const ESTIMATION_METHOD_LABEL: Record<EstimationMethod, string> = {
  substitute_meter: "Substitute meter or parallel reading",
  prior_period_average: "Prior-period average",
  production_scaled: "Scaled from production volume",
  supplier_invoice_reconstruction: "Reconstructed from supplier invoices",
  conservative_default: "Conservative default value",
  engineering_estimate: "Engineering estimate",
};

export const ESTIMATION_METHOD_HINT: Record<EstimationMethod, string> = {
  substitute_meter:
    "Strongest option — another measurement of the same flow. Say which meter and how it was reconciled.",
  prior_period_average:
    "Accepted where the process was unchanged. A verifier will ask what proves it was unchanged.",
  production_scaled:
    "Defensible when consumption tracks output closely. Show the ratio you used and the period it came from.",
  supplier_invoice_reconstruction:
    "Good evidence, but invoices cover delivery dates rather than consumption — explain the timing adjustment.",
  conservative_default:
    "Deliberately unflattering by design, which is why it is safe. Expect no challenge, but it costs you.",
  engineering_estimate:
    "Weakest option. Only defensible with the calculation written out and a stated conservative bias.",
};

export type GapEntry = {
  id: string;
  declarationId: string;
  /** ISO — the gap's own window inside the reporting period */
  periodStart: string;
  periodEnd: string;
  /** which input is missing, e.g. "natural gas consumption" */
  affectedParameter: string;
  /** why there is no primary data */
  reason: string;
  estimationMethod: EstimationMethod;
  /** why the estimate cannot flatter the exporter — the conservativeness test */
  conservativeJustification: string;
  /** tCO₂e this gap accounts for, so its share of the total can be judged */
  estimatedTCO2e: number;
  provenance: Provenance;
  createdAt: number;
};

const KEY = "certrace:data-gaps";

type Store = Record<string, GapEntry[]>;

function load(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = accountStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function persist(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    accountStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore quota */
  }
}

export const listGaps = (declarationId: string): GapEntry[] =>
  (load()[declarationId] ?? []).sort((a, b) =>
    a.periodStart.localeCompare(b.periodStart),
  );

export function saveGap(entry: GapEntry): GapEntry[] {
  const store = load();
  const list = store[entry.declarationId] ?? [];
  const i = list.findIndex((g) => g.id === entry.id);
  store[entry.declarationId] =
    i >= 0
      ? list.map((g) => (g.id === entry.id ? entry : g))
      : [...list, entry];
  persist(store);
  return store[entry.declarationId];
}

export function removeGap(declarationId: string, id: string): GapEntry[] {
  const store = load();
  store[declarationId] = (store[declarationId] ?? []).filter(
    (g) => g.id !== id,
  );
  persist(store);
  return store[declarationId];
}

/* ── Month coverage (validation V11) ────────────────────────────
   A reporting period needs a reading for every month, or an entry saying why
   not. Anything else is a hole nobody has looked at — and "we didn't notice"
   is the one answer a verifier cannot work with. */
export type MonthCoverage = {
  month: string; // 'YYYY-MM'
  covered: boolean;
  /** the gap entry that explains this month, when there is one */
  gapId: string | null;
};

/** Does a gap entry's window contain this month? */
const gapCoversMonth = (g: GapEntry, month: string): boolean => {
  const start = g.periodStart.slice(0, 7);
  const end = g.periodEnd.slice(0, 7);
  return month >= start && month <= end;
};

export function monthCoverage(
  period: ReportingPeriod,
  monthsWithData: string[],
  gaps: GapEntry[],
): MonthCoverage[] {
  const withData = new Set(monthsWithData);
  return monthsInPeriod(period).map((month) => {
    if (withData.has(month)) return { month, covered: true, gapId: null };
    const gap = gaps.find((g) => gapCoversMonth(g, month));
    return { month, covered: Boolean(gap), gapId: gap?.id ?? null };
  });
}

/** Months with neither a reading nor an explanation. Empty = V11 passes. */
export const unexplainedMonths = (
  period: ReportingPeriod,
  monthsWithData: string[],
  gaps: GapEntry[],
): string[] =>
  monthCoverage(period, monthsWithData, gaps)
    .filter((m) => !m.covered)
    .map((m) => m.month);

/* ── Share of the total (validation V12) ────────────────────────
   A gap register with three small entries is housekeeping. One covering a
   fifth of the emissions is the finding — at that point the dossier's
   headline number is mostly an estimate, and saying so up front is the
   difference between a qualified opinion and a rejected one. */
export type GapShare = {
  estimatedTCO2e: number;
  totalTCO2e: number;
  share: number; // 0..1
  escalate: boolean;
  threshold: number;
  message: string | null;
};

export function gapShare(gaps: GapEntry[], totalTCO2e: number): GapShare {
  const estimated = gaps.reduce((a, g) => a + (g.estimatedTCO2e || 0), 0);
  const share = totalTCO2e > 0 ? estimated / totalTCO2e : 0;
  const threshold = DATA_GAP_ESCALATION_SHARE.value;
  const escalate = share > threshold;
  return {
    estimatedTCO2e: estimated,
    totalTCO2e,
    share,
    escalate,
    threshold,
    message: escalate
      ? `${Math.round(share * 100)}% of these emissions are estimated rather than measured. Past ${Math.round(threshold * 100)}% the estimate IS the number, and a verifier will treat the whole dossier accordingly — either close the largest gaps with primary data before engaging one, or brief them on it in advance rather than letting them find it.`
      : null,
  };
}

/* ── Data Gap Risk / Penalty ────────────────────────────────────
   Formerly framed as "savings vs default values". Same arithmetic, honest
   name: this is what the missing data costs, at the year's markup. */
/** The published default for one CN code in one country, for the reporting
    year, tCO₂e/t. Annex I's 2026–2028 columns already include the markup, so
    the caller must not apply it again. null when Annex I has no row for the
    code at all. */
export function publishedDefaultFor(
  cn: string,
  country: string,
  year: number,
): number | null {
  const hit = lookupDefault(cn, country);
  return hit ? rateForYear(hit.rates, year) : null;
}

/** The CN codes of the exporter's own goods: the products requested from its
    self-supplied row. Other suppliers' goods are inputs, not the good priced. */
export function ownGoodsCnCodes(
  requests:
    | { supplierId: string; products: { productId: string }[] }[]
    | undefined,
  cnOf: (productId: string) => string | undefined,
): string[] {
  const codes = new Set<string>();
  for (const r of requests ?? []) {
    if (r.supplierId !== SELF_SUPPLIER_ID) continue;
    for (const p of r.products) {
      const cn = cnOf(p.productId);
      if (cn) codes.add(cn);
    }
  }
  return [...codes];
}

/** Direct, plus indirect where the sector makes indirect chargeable
    (engine.ts INDIRECT_CHARGEABLE). */
export function chargeablePerTonne(
  sector: GoodsCategory,
  direct: number,
  indirect: number,
): number {
  return indirectIsChargeable(sector) ? direct + indirect : direct;
}

export type PenaltyInput = {
  /** the published default for this CN code, country and year — markup already included */
  defaultValue: number;
  /** the installation's own chargeable SEE, tCO₂e/t */
  chargeableSEE: number;
  quantityTonnes: number;
  /** injected — lib/carbon-economics.ts owns where the price comes from */
  certificatePrice: number;
  /** the year's markup, for display only: it is already inside defaultValue */
  markup: number;
};

export type PenaltyResult = ExposureResult & {
  /** what the exporter is actually being told, in one sentence */
  headline: string;
  /** the markup the published value contains, so the year's schedule is visible not implied */
  markup: number;
};

export function dataGapPenalty(p: PenaltyInput): PenaltyResult {
  const x = defaultExposure({ ...p, markup: 0 });
  const money = `€${Math.round(Math.abs(x.currency)).toLocaleString("en-US")}`;
  const headline = x.worseThanDefault
    ? `Reporting actual data costs ${money} more than falling back to the default value — this installation is above the published benchmark. That is a real cost, not a reason to stop measuring: a default-value filing also carries the ${Math.round(p.markup * 100)}% markup and invites scrutiny you would rather not attract.`
    : `Not having this data would cost ${money}. Falling back to the published default means declaring ${x.delta.toFixed(4)} tCO₂e/t more than you actually emit, across ${p.quantityTonnes.toLocaleString("en-US")} t, with the ${Math.round(p.markup * 100)}% markup already inside that default.`;
  return { ...x, headline, markup: p.markup };
}

/** Copy the UI uses, kept here so the reframing cannot drift back. */
export const PENALTY_TITLE = "Data Gap Risk";
export const PENALTY_SUBTITLE =
  "What missing data costs, at this year's default-value markup";
export const PENALTY_NEVER_SAY = "savings"; // documented so a future grep finds this note
