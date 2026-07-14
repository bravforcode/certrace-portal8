/* ════════════════════════════════════════════════════════════
   STAGE 1 — COMPLIANCE ENGINE (deterministic)

   Everything here is a pure function of already-computed submission data
   (lib/exporter-review.ts) plus real CBAM master data (lib/config.ts). Same
   inputs always produce the same outputs — nothing here is a model call, and
   nothing here is advisory. Anything that could appear as a number in a filed
   output is computed here, not in lib/compliance-intelligence.ts (Stage 2).

   See docs/EXPORTER-PORTAL-REDESIGN.md §3 for the architecture this implements.
   ════════════════════════════════════════════════════════════ */

import { valueKey } from "./supplier";
import { isComplexGood, SCOPE2_IN_LIABILITY, type CatalogProduct } from "./config";
import { precursorContribution } from "./precursors";
import type { ReviewSubmission, ReviewRollup } from "./exporter-review";

/* Default-value markup schedule (Implementing Regulation) — pushes declarants
   toward actual, verified data year over year. */
export const DEFAULT_VALUE_MARKUP: Record<number, number> = { 2026: 0.1, 2027: 0.2, 2028: 0.3 };
const markupForYear = (year: number) => DEFAULT_VALUE_MARKUP[Math.min(year, 2028)] ?? DEFAULT_VALUE_MARKUP[2028];

/* Complex goods may only rely on default values for up to 20% of embedded
   emissions — the remaining 80%+ must be actual, verified data. This mock's
   data model carries one method flag per product rather than a per-source
   split, so "uses default" on a complex good is treated as a full breach of
   the cap (0% actual, not ≤80%), which is the real-world failure mode this
   check exists to catch. */
export const COMPLEX_GOOD_DEFAULT_CAP = 0.2;

/* Illustrative EU ETS proxy price used to translate tCO₂e into a €-cost
   estimate. Real declarants use the quarterly (2026) / weekly (2027+) EU ETS
   auction average published by the Commission — this is a stand-in for that
   figure, not a filed number. */
export const EU_ETS_PROXY_EUR_PER_TCO2E = 82;

/* Indicative THB→EUR conversion for the carbon-price deduction estimate.
   The supplier states the currency explicitly (carbon-price-currency field);
   the deduction itself is an ESTIMATE — the declarant applies the official
   exchange rate at filing. */
export const THB_PER_EUR = 39;

/** Reporting-period year for the default-value markup schedule. The markup
    follows the PERIOD being reported, never the wall clock — a 2026 dataset
    reviewed in 2027 still carries the 2026 markup. */
export function yearFromPeriod(periodStart?: string, periodLabel?: string): number {
  if (periodStart) {
    const y = Number(periodStart.slice(0, 4));
    if (y > 2000) return y;
  }
  const m = /(20\d\d)/.exec(periodLabel ?? "");
  return m ? Number(m[1]) : new Date().getFullYear();
}

/* 50-tonne/year mass threshold below which an EU importer does not need
   authorised-CBAM-declarant status. Evaluated here per declaration as an
   indicative signal — the real threshold is assessed against the importer's
   cumulative annual CBAM imports across every supplier, not one declaration. */
export const MASS_THRESHOLD_TONNES_PER_YEAR = 50;

export type CapViolation = { productId: string; productName: string };
export type UnverifiedActual = { productId: string; productName: string };
export type EvidenceGap = { docLabel: string; required: boolean };

export type SupplierFacts = {
  supplierId: string;
  grossTCO2e: number; // reported embedded emissions, no adjustment
  chargeableTCO2e: number; // after Scope 2 liability rule + default markup
  defaultMethodProducts: string[]; // product names reported on default values
  capViolations: CapViolation[]; // complex goods breaching the 20% default cap
  unverifiedActual: UnverifiedActual[]; // "actual" claimed with no verification on file
  evidenceGaps: EvidenceGap[]; // requested documents not attached
  carbonPricePaidEUR: number;
  netExposureEUR: number; // chargeable tCO2e × proxy price − carbon price paid
};

export type ComplianceFacts = {
  year: number;
  declarable: boolean; // total tonnes across submitted suppliers clears the mass threshold
  totalTonnes: number;
  perSupplier: Record<string, SupplierFacts>;
  totalGrossTCO2e: number;
  totalChargeableTCO2e: number;
  totalNetExposureEUR: number;
  anyCapViolations: boolean;
  anyUnverifiedActual: boolean;
};

function productFacts(sub: ReviewSubmission, product: CatalogProduct, year: number): {
  gross: number;
  chargeable: number;
  defaultUsed: boolean;
  capViolation: boolean;
  unverifiedActual: boolean;
} {
  const method = sub.values[valueKey("method", product.id)] || "";
  const direct = Number(sub.values[valueKey("direct-emissions", product.id)]) || 0;
  const indirect = Number(sub.values[valueKey("indirect-emissions", product.id)]) || 0;
  // Precursor embedded emissions carried into a complex good count toward the
  // chargeable base alongside the good's own direct emissions (Annex IV: the
  // precursors' embedded emissions are part of the good's embedded emissions).
  const precursor = isComplexGood(product) ? precursorContribution(sub.values[valueKey("precursors", product.id)]) : 0;
  const rp = sub.request.products.find((p) => p.product.id === product.id);
  const tonnes = rp?.totalTonnes ?? 0;

  const includeIndirect = SCOPE2_IN_LIABILITY[product.category];
  const grossPerTonne = direct + indirect + precursor;
  const chargeablePerTonne = direct + precursor + (includeIndirect ? indirect : 0);

  const defaultUsed = method === "default";
  const markup = defaultUsed ? markupForYear(year) : 0;

  const verification = (sub.values[valueKey("verification")] || "").trim();
  const unverifiedActual = method === "actual" && verification.length === 0;

  return {
    gross: grossPerTonne * tonnes,
    chargeable: chargeablePerTonne * (1 + markup) * tonnes,
    defaultUsed,
    capViolation: defaultUsed && isComplexGood(product),
    unverifiedActual,
  };
}

function supplierFacts(sub: ReviewSubmission, year: number): SupplierFacts {
  let gross = 0;
  let chargeable = 0;
  const defaultMethodProducts: string[] = [];
  const capViolations: CapViolation[] = [];
  const unverifiedActual: UnverifiedActual[] = [];

  for (const rp of sub.request.products) {
    const f = productFacts(sub, rp.product, year);
    gross += f.gross;
    chargeable += f.chargeable;
    if (f.defaultUsed) defaultMethodProducts.push(rp.product.name);
    if (f.capViolation) capViolations.push({ productId: rp.product.id, productName: rp.product.name });
    if (f.unverifiedActual) unverifiedActual.push({ productId: rp.product.id, productName: rp.product.name });
  }

  const evidenceGaps: EvidenceGap[] = sub.request.documents
    .filter((d) => sub.docs[d.id]?.status !== "uploaded")
    .map((d) => ({ docLabel: d.label, required: d.required }));

  /* Carbon-price deduction — the supplier reports a price PER tCO₂e in a
     stated currency; the estimated deduction is that per-tonne price (in EUR)
     applied across the chargeable emissions, capped so it can never flip the
     exposure negative. Pre-fix this subtracted the raw number as absolute EUR. */
  const cpPerTonne = Number(sub.values[valueKey("carbon-price")]) || 0;
  const cpCurrency = sub.values[valueKey("carbon-price-currency")] || "THB";
  const cpPerTonneEUR = cpCurrency === "EUR" ? cpPerTonne : cpPerTonne / THB_PER_EUR;
  const carbonPricePaidEUR = Math.max(0, cpPerTonneEUR) * chargeable;
  const netExposureEUR = Math.max(0, chargeable * EU_ETS_PROXY_EUR_PER_TCO2E - carbonPricePaidEUR);

  return {
    supplierId: sub.supplier.id,
    grossTCO2e: Math.round(gross),
    chargeableTCO2e: Math.round(chargeable),
    defaultMethodProducts,
    capViolations,
    unverifiedActual,
    evidenceGaps,
    carbonPricePaidEUR,
    netExposureEUR: Math.round(netExposureEUR),
  };
}

/** Stage 1 entry point — derives the compliance dataset from already-submitted
    data. Re-running this against the same inputs always yields the same facts. */
export function computeComplianceFacts(roll: ReviewRollup, year = new Date().getFullYear()): ComplianceFacts {
  const submitted = roll.submissions.filter((s) => s.submitted);
  const perSupplier: Record<string, SupplierFacts> = {};
  let totalTonnes = 0;
  let totalGross = 0;
  let totalChargeable = 0;
  let totalExposure = 0;
  let anyCapViolations = false;
  let anyUnverifiedActual = false;

  for (const sub of submitted) {
    const facts = supplierFacts(sub, year);
    perSupplier[sub.supplier.id] = facts;
    totalTonnes += sub.request.products.reduce((a, rp) => a + rp.totalTonnes, 0);
    totalGross += facts.grossTCO2e;
    totalChargeable += facts.chargeableTCO2e;
    totalExposure += facts.netExposureEUR;
    if (facts.capViolations.length > 0) anyCapViolations = true;
    if (facts.unverifiedActual.length > 0) anyUnverifiedActual = true;
  }

  return {
    year,
    declarable: totalTonnes >= MASS_THRESHOLD_TONNES_PER_YEAR,
    totalTonnes: Math.round(totalTonnes),
    perSupplier,
    totalGrossTCO2e: Math.round(totalGross),
    totalChargeableTCO2e: Math.round(totalChargeable),
    totalNetExposureEUR: Math.round(totalExposure),
    anyCapViolations,
    anyUnverifiedActual,
  };
}
