/* ════════════════════════════════════════════════════════════
   EU FALLBACK DEFAULT VALUES — the baseline a supplier is measured against

   Every CBAM good has a default value the declarant may fall back on when no
   actual installation data exists. That default is deliberately unflattering:
   it sits at the emissions-intensive end of the range, and from 2026 it carries
   a markup that rises year on year (DEFAULT_VALUE_MARKUP in
   lib/compliance-engine.ts). Reporting actual data is how an efficient
   installation stops paying for someone else's blast furnace.

   Which makes the default the single most useful number to put NEXT TO a
   supplier's reported figure. On its own "1.84 tCO₂e/t" means nothing to an
   exporter; against a 2.20 default it means "this mill is 16% better than the
   fallback, and that gap is worth real money at the certificate price".

   ⚠️ REFERENCE DATA, NOT FILED DATA. These are indicative figures at the CBAM
   aggregated-goods-category level, rounded, and they are NOT what a declarant
   files. The Commission sets the operative defaults per CN code and revises
   them; a real deployment replaces this table with the published schedule (and
   that's why it's a plain data map with a `source` on every row — swapping it
   is an edit, not a refactor). Nothing here reaches the Registry XML or the
   PDF package: the benchmark is a comparison surface only.
   ════════════════════════════════════════════════════════════ */

import { getCatalogProduct, type CatalogProduct } from "./config";

export type DefaultValue = {
  /** total specific embedded emissions, tCO₂e per tonne of good */
  seeTotal: number;
  /** the direct share — what actually enters the certificate bill for Annex II
      goods (iron & steel, aluminium), where indirect emissions are excluded */
  seeDirect: number;
  source: string;
};

/* Keyed by CBAM aggregated goods category — the level the defaults are set at.
   Individual products map onto these via their catalogue group. */
const BY_GROUP: Record<string, DefaultValue> = {
  // ── Iron & steel ──
  "Primary inputs": {
    seeTotal: 1.9,
    seeDirect: 1.75,
    source: "Sintered ore / pig iron / DRI & ferro-alloy category defaults",
  },
  "Semi-finished": {
    seeTotal: 2.1,
    seeDirect: 1.95,
    source: "Crude steel (ingots, billets, slabs) category default",
  },
  "Flat products": {
    seeTotal: 2.2,
    seeDirect: 2.0,
    source: "Hot/cold-rolled and coated flat-product category default",
  },
  "Long products": {
    seeTotal: 1.95,
    seeDirect: 1.8,
    source: "Bars, rods, sections category default",
  },
  "Stainless & alloy": {
    seeTotal: 2.6,
    seeDirect: 2.35,
    source: "Stainless & other alloy steel category default",
  },
  "Tubes & pipes": {
    seeTotal: 2.5,
    seeDirect: 2.25,
    source: "Seamless & welded tube category default",
  },
  Articles: {
    seeTotal: 2.4,
    seeDirect: 2.15,
    source: "Downstream articles of iron or steel category default",
  },
  // ── Aluminium ──
  Unwrought: {
    seeTotal: 8.6,
    seeDirect: 1.9,
    source: "Primary (electrolysis-route) unwrought aluminium category default",
  },
  "Wrought products": {
    seeTotal: 9.4,
    seeDirect: 2.2,
    source: "Wrought aluminium (bars, sheet, foil, tube) category default",
  },
};

/* Where a specific good is materially different from its group — a galvanised
   sheet carries the coating line's emissions on top of the substrate; scrap-fed
   EAF routes sit well below the flat-product average. */
const BY_PRODUCT: Record<string, DefaultValue> = {
  ironore: {
    seeTotal: 0.2,
    seeDirect: 0.18,
    source: "Sintered / pelletised iron ore category default",
  },
  pigiron: {
    seeTotal: 1.9,
    seeDirect: 1.8,
    source: "Pig iron, non-alloy category default",
  },
  dri: {
    seeTotal: 1.45,
    seeDirect: 1.3,
    source: "Direct reduced iron (DRI / HBI) category default",
  },
  femn: {
    seeTotal: 2.4,
    seeDirect: 2.1,
    source: "Ferro-manganese category default",
  },
  fecr: {
    seeTotal: 3.1,
    seeDirect: 2.7,
    source: "Ferro-chromium category default",
  },
  feni: {
    seeTotal: 3.8,
    seeDirect: 3.3,
    source: "Ferro-nickel category default",
  },
  galv: {
    seeTotal: 2.4,
    seeDirect: 2.15,
    source: "Hot-dip galvanised sheet category default",
  },
  prepaint: {
    seeTotal: 2.5,
    seeDirect: 2.2,
    source: "Pre-painted / colour-coated sheet category default",
  },
  tinplate: {
    seeTotal: 2.45,
    seeDirect: 2.15,
    source: "Tinplate category default",
  },
  "al-unwrought": {
    seeTotal: 8.6,
    seeDirect: 1.9,
    source: "Unwrought aluminium, not alloyed — category default",
  },
  "al-foil": {
    seeTotal: 10.2,
    seeDirect: 2.4,
    source: "Aluminium foil category default",
  },
};

/** The EU fallback default for one good, or null when we hold no reference. */
export function defaultValueFor(product: CatalogProduct): DefaultValue | null {
  return BY_PRODUCT[product.id] ?? BY_GROUP[product.group] ?? null;
}

export const defaultValueForId = (productId: string): DefaultValue | null => {
  const p = getCatalogProduct(productId);
  return p ? defaultValueFor(p) : null;
};

export type BenchmarkVerdict = "better" | "worse" | "level" | "unknown";

export type Benchmark = {
  verdict: BenchmarkVerdict;
  /** reported total SEE, tCO₂e/t */
  reported: number;
  /** EU fallback default for the same good */
  fallback: number;
  /** signed difference, reported − default (negative = better than baseline) */
  delta: number;
  /** signed percentage against the default (−16 = 16% below the baseline) */
  deltaPct: number;
  source: string;
};

/** Compare one reported figure against the fallback for that good.
    `basis` picks which half of the comparison matters: "total" is the honest
    environmental read; "direct" is the one that moves the certificate bill for
    Annex II goods. */
export function benchmark(
  product: CatalogProduct,
  reported: number,
  basis: "total" | "direct" = "total",
): Benchmark | null {
  const dv = defaultValueFor(product);
  if (!dv) return null;
  const fallback = basis === "direct" ? dv.seeDirect : dv.seeTotal;
  if (!(fallback > 0) || !Number.isFinite(reported)) return null;
  const delta = reported - fallback;
  const deltaPct = (delta / fallback) * 100;
  // Inside ±2% of the fallback there is nothing to claim either way — measurement
  // noise, not performance.
  const verdict: BenchmarkVerdict =
    Math.abs(deltaPct) < 2 ? "level" : delta < 0 ? "better" : "worse";
  return { verdict, reported, fallback, delta, deltaPct, source: dv.source };
}

export const BENCHMARK_META: Record<
  BenchmarkVerdict,
  { label: string; tone: "ok" | "warn" | "err" | "muted" }
> = {
  better: { label: "below the EU default", tone: "ok" },
  level: { label: "at the EU default", tone: "muted" },
  worse: { label: "above the EU default", tone: "warn" },
  unknown: { label: "no default on file", tone: "muted" },
};
