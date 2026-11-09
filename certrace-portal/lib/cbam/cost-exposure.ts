/* ════════════════════════════════════════════════════════════
   COST EXPOSURE — the Cost Avoidance Calculator's reference data and formula

   Everything Widget E (and its forward-looking sibling, Widget H, once it
   ships) reads: published certificate prices, the CBAM phase-in schedule,
   country/category default SEE values, and the EUR→THB rate used to render
   the headline figure in Baht. All four are externally published numbers
   Certrace does not control, so all four are DATA — editable through
   Settings → CBAM reference data — never constants buried in a formula.

   ── THE ONE RULE THAT MATTERS ──────────────────────────────────
   costAvoidance() returns "insufficient_data" rather than a number whenever
   an input is missing, and the caller is required to render THAT state
   rather than a fabricated €0 or a silently-substituted default. A
   compliance dashboard that shows a confident number built on a guess is
   worse than one that visibly says "enter export volume to see savings".
   ════════════════════════════════════════════════════════════ */

import { aggregatedGoodsCategory, getCatalogProduct, type AggregatedGoodsCategory } from "../config";
import { totalExportVolume } from "./export-volumes";
import type { VerificationWorkspace } from "../workspace";
import type { WorkspaceSEE } from "../workspace-see";

/* ── Certificate prices ──────────────────────────────────────────
   cbam_certificate_prices. Quarterly through 2026; the Commission moves to
   weekly publication from 2027 — periodLabel carries either shape
   ("2026-Q2" or an ISO week like "2027-W03") and the store does not care
   which, it always resolves to "the most recent row for this reporting
   year". */
export type CertificatePriceRow = {
  id: string;
  periodLabel: string;
  priceEurPerTco2e: number;
  /** ISO date the price was published, where known */
  publishedDate: string;
  sourceUrl?: string;
};

const PRICES_KEY = "certrace:cbam-certificate-prices";
const RATE_KEY = "certrace:eur-thb-rate";

type PriceStore = CertificatePriceRow[];

/** The Commission's quarterly CBAM certificate prices for 2026 imports, each published in the first week after its quarter
    closes (EU ETS auction data). The newest is the one every cost figure in the portal is read at, so this table has to keep
    moving: Q3 2026 (EUR 82.32, 5 October 2026) was missing here for three weeks and every figure was still being read at Q2.
    From 2027 the price is weekly ("2027-W03"); add rows through the Settings admin form, or here, as the Commission publishes them.
    Nothing later than the last published price is invented. */
const NEWS_PAGE = "https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-communication-and-news_en";
const SEEDED_PRICES: PriceStore = [
  { id: "2026-q1", periodLabel: "2026-Q1", priceEurPerTco2e: 75.36, publishedDate: "2026-04-07", sourceUrl: NEWS_PAGE },
  { id: "2026-q2", periodLabel: "2026-Q2", priceEurPerTco2e: 75.28, publishedDate: "2026-07-06", sourceUrl: NEWS_PAGE },
  { id: "2026-q3", periodLabel: "2026-Q3", priceEurPerTco2e: 82.32, publishedDate: "2026-10-05", sourceUrl: NEWS_PAGE },
];

/** What is stored wins row by row — an edit made in Settings is the reader's — but a published price the stored list has never
    heard of is added. Without this, anyone whose browser had saved the table once would be stuck on the prices of that day. */
function withSeeded(stored: PriceStore): PriceStore {
  const have = new Set(stored.map((r) => r.id));
  return [...stored, ...SEEDED_PRICES.filter((r) => !have.has(r.id))];
}

function readPrices(): PriceStore {
  if (typeof window === "undefined") return SEEDED_PRICES;
  try {
    const raw = window.localStorage.getItem(PRICES_KEY);
    if (!raw) return SEEDED_PRICES;
    const parsed = JSON.parse(raw) as PriceStore;
    return Array.isArray(parsed) && parsed.length > 0 ? withSeeded(parsed) : SEEDED_PRICES;
  } catch {
    return SEEDED_PRICES;
  }
}

function writePrices(rows: PriceStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PRICES_KEY, JSON.stringify(rows));
  } catch {
    /* ignore quota */
  }
}

export function listCertificatePrices(): CertificatePriceRow[] {
  return [...readPrices()].sort((a, b) => a.publishedDate.localeCompare(b.publishedDate));
}

export function saveCertificatePrice(row: CertificatePriceRow): void {
  const rows = readPrices();
  const idx = rows.findIndex((r) => r.id === row.id);
  if (idx >= 0) rows[idx] = row;
  else rows.push(row);
  writePrices(rows);
}

export function removeCertificatePrice(id: string): void {
  writePrices(readPrices().filter((r) => r.id !== id));
}

/** The most recently published price on or before the given year — "most
    recent" rather than "matching the exact quarter", because a 2026-Q3
    lookup before Q3 has published still has to resolve to Q2, not to
    nothing. Returns null only when no price has ever been published. */
export function latestCertificatePriceFor(year: number): CertificatePriceRow | null {
  const rows = listCertificatePrices().filter((r) => Number(r.periodLabel.slice(0, 4)) <= year);
  return rows.length > 0 ? rows[rows.length - 1] : null;
}

/* ── EUR → THB exchange rate ────────────────────────────────────
   Stored, not hardcoded — a dashboard that quietly used a stale rate for a
   year would misstate the headline number the CEO reads first. */
export type ExchangeRate = { eurToThb: number; asOf: string };

/** The ECB euro reference rate of 23 October 2026 — not a live feed, and the screens say so with its date. Update via Settings. */
const SEEDED_RATE: ExchangeRate = { eurToThb: 37.771, asOf: "2026-10-23" };

export function getExchangeRate(): ExchangeRate {
  if (typeof window === "undefined") return SEEDED_RATE;
  try {
    const raw = window.localStorage.getItem(RATE_KEY);
    if (!raw) return SEEDED_RATE;
    const parsed = JSON.parse(raw) as ExchangeRate;
    return parsed && typeof parsed.eurToThb === "number" ? parsed : SEEDED_RATE;
  } catch {
    return SEEDED_RATE;
  }
}

export function saveExchangeRate(rate: ExchangeRate): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RATE_KEY, JSON.stringify(rate));
  } catch {
    /* ignore quota */
  }
}

/* ── EUR → CNY and EUR → INR ────────────────────────────────────
   The Carbon & Cost and Dashboard pages can show every figure in yuan and rupees as well as baht and euros. The certificate price is
   in euros (it is the EU's), so each other currency is one rate away. Placeholders, like the baht rate above and for the same reason:
   a stale rate for a year would misstate the headline number the reader sees first. Edit them on the Carbon & Cost tab. */
export type ExtraRates = { eurToCny: number; eurToInr: number; asOf: string };
const EXTRA_KEY = "certrace:eur-cny-inr-rates";
const SEEDED_EXTRA: ExtraRates = { eurToCny: 7.466, eurToInr: 106.272, asOf: "2026-10-23" };

export function getExtraRates(): ExtraRates {
  if (typeof window === "undefined") return SEEDED_EXTRA;
  try {
    const raw = window.localStorage.getItem(EXTRA_KEY);
    if (!raw) return SEEDED_EXTRA;
    const p = JSON.parse(raw) as Partial<ExtraRates>;
    return { eurToCny: Number(p.eurToCny) > 0 ? Number(p.eurToCny) : SEEDED_EXTRA.eurToCny, eurToInr: Number(p.eurToInr) > 0 ? Number(p.eurToInr) : SEEDED_EXTRA.eurToInr, asOf: p.asOf ?? SEEDED_EXTRA.asOf };
  } catch {
    return SEEDED_EXTRA;
  }
}

export function saveExtraRates(rates: ExtraRates): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(EXTRA_KEY, JSON.stringify(rates));
  } catch {
    /* ignore quota */
  }
}

/* ── Phase-in schedule ──────────────────────────────────────────
   cbam_phase_in_factors. ONLY 2026 is confirmed (2.5%, Regulation (EU)
   2023/956 as amended by the Omnibus Regulation (EU) 2025/2083). Every
   other year is deliberately absent rather than guessed — payableShareFor()
   returns null for them, and every caller in this file is required to
   surface that as "phase-in rate not yet confirmed for {year}" rather than
   quietly defaulting to 100% or to 2026's rate. Do not add a row here
   without checking it against the official text first. */
export type PhaseInFactor = { year: number; payableSharePercent: number };

export const PHASE_IN_FACTORS: PhaseInFactor[] = [{ year: 2026, payableSharePercent: 2.5 }];

export function payableShareFor(year: number): number | null {
  return PHASE_IN_FACTORS.find((f) => f.year === year)?.payableSharePercent ?? null;
}

/* ── Country/category default SEE values ────────────────────────
   country_default_emissions, keyed by country + aggregated goods category +
   production route in the illustrative model — but Certrace holds no
   verified PER-COUNTRY split from IR (EU) 2025/2621's default tables yet
   (that is a separate sourcing task from the fuel NCV/EF table already
   seeded in lib/cbam/fuel-defaults.ts). Rather than block the widgets that
   need a default figure entirely, this reuses the SAME category-level
   indicative reference values lib/default-values.ts already discloses
   elsewhere in the product as "not filed data" — keyed here by country
   code "*" (any country) until real per-country rows are sourced. Swapping
   in a real country-specific table is a data edit to COUNTRY_DEFAULTS
   below, not a refactor of anything that reads it. */
export type CountryDefaultEmissions = {
  countryCode: string; // "*" = no country-specific split on file yet
  aggregatedGoodsCategory: AggregatedGoodsCategory;
  defaultSeeDirect: number;
  defaultSeeIndirect: number;
  sourceRegulation: string;
  effectiveFrom: string;
};

const COUNTRY_DEFAULTS: CountryDefaultEmissions[] = [
  { countryCode: "*", aggregatedGoodsCategory: "Sintered ore", defaultSeeDirect: 0.18, defaultSeeIndirect: 0.02, sourceRegulation: "Indicative — see note below", effectiveFrom: "2026-01-01" },
  { countryCode: "*", aggregatedGoodsCategory: "Pig iron", defaultSeeDirect: 1.8, defaultSeeIndirect: 0.1, sourceRegulation: "Indicative — see note below", effectiveFrom: "2026-01-01" },
  { countryCode: "*", aggregatedGoodsCategory: "Ferro-alloys", defaultSeeDirect: 2.5, defaultSeeIndirect: 0.3, sourceRegulation: "Indicative — see note below", effectiveFrom: "2026-01-01" },
  { countryCode: "*", aggregatedGoodsCategory: "Direct reduced iron", defaultSeeDirect: 1.3, defaultSeeIndirect: 0.15, sourceRegulation: "Indicative — see note below", effectiveFrom: "2026-01-01" },
  { countryCode: "*", aggregatedGoodsCategory: "Crude steel", defaultSeeDirect: 1.95, defaultSeeIndirect: 0.15, sourceRegulation: "Indicative — see note below", effectiveFrom: "2026-01-01" },
  { countryCode: "*", aggregatedGoodsCategory: "Iron or steel products", defaultSeeDirect: 2.05, defaultSeeIndirect: 0.25, sourceRegulation: "Indicative — see note below", effectiveFrom: "2026-01-01" },
  { countryCode: "*", aggregatedGoodsCategory: "Unwrought aluminium", defaultSeeDirect: 1.9, defaultSeeIndirect: 6.7, sourceRegulation: "Indicative — see note below", effectiveFrom: "2026-01-01" },
  { countryCode: "*", aggregatedGoodsCategory: "Aluminium products", defaultSeeDirect: 2.2, defaultSeeIndirect: 7.2, sourceRegulation: "Indicative — see note below", effectiveFrom: "2026-01-01" },
];
/* NOTE: these eight rows are lib/default-values.ts's own category figures
   (seeTotal/seeDirect, already labelled "reference data, not filed data"
   throughout the product), reshaped into this table's direct/indirect
   split (indirect = seeTotal − seeDirect) and generalised across every
   country pending a real IR (EU) 2025/2621 country table. */

export function countryDefaultFor(countryCode: string, category: AggregatedGoodsCategory): CountryDefaultEmissions | null {
  return COUNTRY_DEFAULTS.find((d) => d.countryCode === countryCode && d.aggregatedGoodsCategory === category) ?? COUNTRY_DEFAULTS.find((d) => d.countryCode === "*" && d.aggregatedGoodsCategory === category) ?? null;
}

/** The default SEE (direct + indirect) for a workspace's own product
    category — country-general until a real per-country table exists. */
export function defaultSeeForWorkspace(workspace: Pick<VerificationWorkspace, "productId" | "cnCode" | "productName">): CountryDefaultEmissions | null {
  const product = getCatalogProduct(workspace.productId);
  if (!product) return null;
  const category = aggregatedGoodsCategory(product);
  return countryDefaultFor("*", category);
}

/* ── The calculation ────────────────────────────────────────────
   Steps 1–5, exactly as specified — see the worked example pinned in
   lib/__tests__/cost-exposure.test.ts, which this function is built to
   reproduce exactly:

     SEE_default = 2.60, SEE_actual = 2.10 → SEE_gap = 0.50 tCO2e/t
     export_volume = 2,000 t · price = €75.28 (2026-Q2) · payable = 2.5%
     savings_2026 = 0.50 × 2,000 × 75.28 × 0.025 = €1,882
     savings_at_full_phase_in = 0.50 × 2,000 × 75.28 × 1.00 = €75,280
   ════════════════════════════════════════════════════════════ */

export type CostAvoidanceResult =
  | { status: "ok"; steps: CostAvoidanceSteps; savingsEur: number; savingsAtFullPhaseInEur: number; savingsThb: number; savingsAtFullPhaseInThb: number }
  | { status: "no_default"; reason: string }
  | { status: "not_computable"; reason: string }
  | { status: "no_export_volume"; reason: string }
  | { status: "no_price"; reason: string }
  | { status: "no_phase_in"; reason: string };

export type CostAvoidanceSteps = {
  seeDefault: number;
  seeActual: number;
  seeGap: number;
  exportVolumeTonnes: number;
  certificatePriceEurPerTco2e: number;
  certificatePricePeriodLabel: string;
  payableSharePercent: number;
};

export function costAvoidanceFor(workspace: VerificationWorkspace, see: WorkspaceSEE, year: number): CostAvoidanceResult {
  // Uncomputable SEE reads as every per-tonne figure being 0 (see
  // WorkspaceSEE's own doc comment) — reading that 0 as "the actual figure"
  // would inflate the gap to the FULL default value and report a savings
  // number built on data that was never entered. This must stop here, not
  // pass a fabricated near-100% saving downstream.
  if (!see.computable) return { status: "not_computable", reason: "No production data has been entered for this product report yet." };

  const def = defaultSeeForWorkspace(workspace);
  if (!def) return { status: "no_default", reason: "No default emissions figure is on file for this product's category yet." };

  const seeDefault = def.defaultSeeDirect + def.defaultSeeIndirect;
  const seeActual = see.seeDirect + see.seeIndirect;
  // Floored at zero per workspace — an actual figure that is WORSE than the
  // default is a real problem, but it is not a negative saving, and letting
  // it drag an aggregate total negative would read as a calculation error
  // rather than what it is.
  const seeGap = Math.max(0, seeDefault - seeActual);

  const exportVolumeTonnes = totalExportVolume(workspace.id, year);
  if (exportVolumeTonnes == null) return { status: "no_export_volume", reason: "Enter export volume to see savings." };

  const price = latestCertificatePriceFor(year);
  if (!price) return { status: "no_price", reason: "No certificate price is on file for this period yet." };

  const payableSharePercent = payableShareFor(year);
  if (payableSharePercent == null) return { status: "no_phase_in", reason: `The CBAM phase-in rate for ${year} is not yet confirmed.` };

  const steps: CostAvoidanceSteps = {
    seeDefault,
    seeActual,
    seeGap,
    exportVolumeTonnes,
    certificatePriceEurPerTco2e: price.priceEurPerTco2e,
    certificatePricePeriodLabel: price.periodLabel,
    payableSharePercent,
  };

  const savingsEur = seeGap * exportVolumeTonnes * price.priceEurPerTco2e * (payableSharePercent / 100);
  const savingsAtFullPhaseInEur = seeGap * exportVolumeTonnes * price.priceEurPerTco2e * 1;

  const rate = getExchangeRate().eurToThb;

  return {
    status: "ok",
    steps,
    savingsEur,
    savingsAtFullPhaseInEur,
    savingsThb: savingsEur * rate,
    savingsAtFullPhaseInThb: savingsAtFullPhaseInEur * rate,
  };
}

/** Sums costAvoidanceFor() across every workspace supplied, skipping (never
    zeroing) the ones that cannot be computed yet — a portfolio total should
    reflect what IS computable, with the gaps surfaced separately by the
    caller, not silently averaged away.

    Each workspace is evaluated against ITS OWN reporting year — a 2025
    workspace is not priced against 2026 certificates just because most of
    the portfolio has moved on, which is why this takes no shared `year`
    parameter the way a single costAvoidanceFor() call does. */
export function portfolioCostAvoidance(rows: { workspace: VerificationWorkspace; see: WorkspaceSEE }[]): { total: CostAvoidanceResult; perWorkspace: { workspaceId: string; result: CostAvoidanceResult }[] } {
  const perWorkspace = rows.map((r) => ({ workspaceId: r.workspace.id, result: costAvoidanceFor(r.workspace, r.see, r.workspace.year) }));
  const ok = perWorkspace.filter((r): r is { workspaceId: string; result: Extract<CostAvoidanceResult, { status: "ok" }> } => r.result.status === "ok");

  if (ok.length === 0) {
    // Surface the first blocking reason found, in the order the single-
    // workspace calculation would hit it, so the aggregate view explains
    // itself the same way the per-workspace view does.
    const first = perWorkspace.find((r) => r.result.status !== "ok");
    return { total: first?.result ?? { status: "no_export_volume", reason: "Enter export volume to see savings." }, perWorkspace };
  }

  const total: CostAvoidanceResult = {
    status: "ok",
    steps: ok[0].result.steps,
    savingsEur: ok.reduce((a, r) => a + r.result.savingsEur, 0),
    savingsAtFullPhaseInEur: ok.reduce((a, r) => a + r.result.savingsAtFullPhaseInEur, 0),
    savingsThb: ok.reduce((a, r) => a + r.result.savingsThb, 0),
    savingsAtFullPhaseInThb: ok.reduce((a, r) => a + r.result.savingsAtFullPhaseInThb, 0),
  };
  return { total, perWorkspace };
}
