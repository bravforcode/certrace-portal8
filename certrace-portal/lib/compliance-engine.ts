/* ════════════════════════════════════════════════════════════
   STAGE 1 — DETERMINISTIC COMPLIANCE PREVIEW

   Decimal strings are retained across this boundary. This compatibility view
   supports the browser-local workflow; regulator-facing calculation traces
   remain the versioned contracts in lib/mrv.
   ════════════════════════════════════════════════════════════ */

import { valueKey } from "./supplier";
import { isComplexGood, type CatalogProduct } from "./config";
import { parsePrecursors, precursorContributionExact } from "./precursors";
import type { ReviewSubmission, ReviewRollup } from "./exporter-review";
import { decimal, decimalToString, lookupCertificatePrice } from "./mrv";
import {
  addExact,
  embeddedEmissionsPerTonne,
  multiplyExact,
  reportedEmissionsPerTonne,
} from "./workflow-measurements";

/** Reporting-period year. Regulatory schedules follow the period, not the wall clock. */
export function yearFromPeriod(periodStart?: string, periodLabel?: string): number {
  if (periodStart) {
    const year = Number(periodStart.slice(0, 4));
    if (Number.isInteger(year) && year > 2000) return year;
  }
  const match = /(20\d\d)/.exec(periodLabel ?? "");
  return match ? Number(match[1]) : new Date().getFullYear();
}

/* Assessed per EU importer and calendar year across all eligible imports. */
export const MASS_THRESHOLD_TONNES_PER_YEAR = "50";

export type UnverifiedActual = { productId: string; productName: string };
export type EvidenceGap = { docLabel: string; required: boolean };

export type SupplierFacts = {
  supplierId: string;
  /** Inventory view retaining reported indirect emissions. */
  grossTCO2e: string;
  /** Definitive embedded result for Annex-II treatment. */
  chargeableTCO2e: string;
  defaultMethodProducts: string[];
  unverifiedActual: UnverifiedActual[];
  evidenceGaps: EvidenceGap[];
  carbonPricePaidEUR: string | null;
  netExposureEUR: string | null;
};

export type ComplianceFacts = {
  year: number;
  declarable: null;
  thresholdAssessment: "not_assessed_requires_importer_annual_totals";
  totalTonnes: string;
  perSupplier: Record<string, SupplierFacts>;
  totalGrossTCO2e: string;
  totalChargeableTCO2e: string;
  totalNetExposureEUR: string | null;
  certificatePriceEURPerTCO2e: string | null;
  certificatePriceAsOf: string;
  certificatePriceWarning: string | null;
  anyUnverifiedActual: boolean;
};

function productFacts(submission: ReviewSubmission, product: CatalogProduct, year: number): {
  gross: string;
  chargeable: string;
  defaultUsed: boolean;
  unverifiedActual: boolean;
} {
  const method = submission.values[valueKey("method", product.id)] || "";
  const direct = submission.values[valueKey("direct-emissions", product.id)] || "0";
  const indirect = submission.values[valueKey("indirect-emissions", product.id)] || "0";
  const precursors = isComplexGood(product)
    ? submission.values[valueKey("precursors", product.id)]
    : undefined;
  const requestProduct = submission.request.products.find((candidate) => candidate.product.id === product.id);
  const tonnes = requestProduct?.commercialQuantityTonnes ?? "0";

  const grossPerTonne = reportedEmissionsPerTonne({
    direct,
    indirect,
    precursors,
    reportingPeriod: String(year),
  }) ?? "0";
  const chargeablePerTonne = embeddedEmissionsPerTonne({
    product,
    direct,
    indirect,
    precursors,
    reportingPeriod: String(year),
  }) ?? "0";

  /* Product-level defaults are treated as published final values. The only
     unmarked-base markup in this adapter is the explicit per-precursor basis
     handled by precursorContributionExact; applying a blanket markup here
     would double-mark Regulation 2025/2621 published year columns. */
  if (precursors) precursorContributionExact(precursors, String(year));

  return {
    gross: multiplyExact(grossPerTonne, tonnes),
    chargeable: multiplyExact(chargeablePerTonne, tonnes),
    defaultUsed: method === "default",
    // Browser metadata cannot satisfy the accredited-verifier gate.
    unverifiedActual: method === "actual" || (parsePrecursors(precursors)?.some((row) => row.method === "actual") ?? false),
  };
}

function supplierFacts(
  submission: ReviewSubmission,
  year: number,
  certificatePriceEUR: string | null,
): SupplierFacts {
  const gross: string[] = [];
  const chargeable: string[] = [];
  const defaultMethodProducts: string[] = [];
  const unverifiedActual: UnverifiedActual[] = [];

  for (const requestProduct of submission.request.products) {
    const facts = productFacts(submission, requestProduct.product, year);
    gross.push(facts.gross);
    chargeable.push(facts.chargeable);
    if (facts.defaultUsed) defaultMethodProducts.push(requestProduct.product.name);
    if (facts.unverifiedActual) {
      unverifiedActual.push({
        productId: requestProduct.product.id,
        productName: requestProduct.product.name,
      });
    }
  }

  const totalChargeable = addExact(chargeable);
  // Filename metadata is never regulatory evidence.
  const evidenceGaps: EvidenceGap[] = submission.request.documents.map((document) => ({
    docLabel: document.label,
    required: document.required,
  }));

  const carbonPriceRaw = submission.values[valueKey("carbon-price")]?.trim() || "0";
  const currency = submission.values[valueKey("carbon-price-currency")] || "THB";
  const carbonPrice = decimal(carbonPriceRaw);
  const carbonPricePaidEUR = carbonPrice.isZero()
    ? "0"
    : currency === "EUR"
      ? multiplyExact(decimalToString(carbonPrice), totalChargeable)
      : null;
  const rawExposure = certificatePriceEUR === null || carbonPricePaidEUR === null
    ? null
    : decimal(multiplyExact(totalChargeable, certificatePriceEUR)).minus(decimal(carbonPricePaidEUR));
  const netExposureEUR = rawExposure === null
    ? null
    : decimalToString(rawExposure.isNegative() ? decimal("0") : rawExposure);

  return {
    supplierId: submission.supplier.id,
    grossTCO2e: addExact(gross),
    chargeableTCO2e: totalChargeable,
    defaultMethodProducts,
    unverifiedActual,
    evidenceGaps,
    carbonPricePaidEUR,
    netExposureEUR,
  };
}

/** Re-running against the same submitted dataset produces identical strings. */
export function computeComplianceFacts(
  rollup: ReviewRollup,
  year = new Date().getFullYear(),
  certificatePriceAsOf = `${year}-12-31`,
): ComplianceFacts {
  const submitted = rollup.submissions.filter((submission) => submission.submitted);
  const perSupplier: Record<string, SupplierFacts> = {};
  const tonnes: string[] = [];
  const gross: string[] = [];
  const chargeable: string[] = [];
  const exposures: string[] = [];
  const certificatePriceRecord = lookupCertificatePrice(certificatePriceAsOf);
  const certificatePriceEUR = certificatePriceRecord?.price.canonicalValue ?? null;
  let exposureAvailable = certificatePriceEUR !== null;
  let anyUnverifiedActual = false;

  for (const submission of submitted) {
    const facts = supplierFacts(submission, year, certificatePriceEUR);
    perSupplier[submission.supplier.id] = facts;
    tonnes.push(...submission.request.products.map((product) => product.commercialQuantityTonnes));
    gross.push(facts.grossTCO2e);
    chargeable.push(facts.chargeableTCO2e);
    if (facts.netExposureEUR === null) exposureAvailable = false;
    else exposures.push(facts.netExposureEUR);
    if (facts.unverifiedActual.length > 0) anyUnverifiedActual = true;
  }

  return {
    year,
    declarable: null,
    thresholdAssessment: "not_assessed_requires_importer_annual_totals",
    totalTonnes: addExact(tonnes),
    perSupplier,
    totalGrossTCO2e: addExact(gross),
    totalChargeableTCO2e: addExact(chargeable),
    totalNetExposureEUR: exposureAvailable ? addExact(exposures) : null,
    certificatePriceEURPerTCO2e: certificatePriceEUR,
    certificatePriceAsOf,
    certificatePriceWarning: certificatePriceEUR === null
      ? `No officially published certificate price is configured for ${certificatePriceAsOf}; no proxy was substituted.`
      : null,
    anyUnverifiedActual,
  };
}
