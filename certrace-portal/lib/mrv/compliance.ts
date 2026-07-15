import {
  assertIsoDate,
  decimal,
  decimalToString,
  isIsoDate,
  MrvValidationError,
  requireNonNegative,
} from "./decimal";
import { assertCanonicalUnit, measuredValue, MEASUREMENT_SPECS, REGULATORY_DATA_VERSION } from "./measurements";
import { REGULATORY_SOURCES } from "./regulatory-data";
import type {
  AggregatedGoodsCategory,
  DecimalString,
  MeasuredValue,
  VerificationReference,
} from "./types";

export interface DefaultMarkupPeriod {
  effectiveFrom: string;
  effectiveTo?: string;
  markupFraction: DecimalString;
  regulatoryDataVersion: string;
}

/**
 * Mark-ups used only when the input is an explicitly unmarked default base.
 * Regulation 2025/2621's published reporting-year columns already contain the
 * applicable mark-up and must not be passed through this schedule again.
 */
export const MARKUPS_FOR_UNMARKED_DEFAULT_BASES: readonly DefaultMarkupPeriod[] = [
  {
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    markupFraction: "0.10",
    regulatoryDataVersion: REGULATORY_DATA_VERSION,
  },
  {
    effectiveFrom: "2027-01-01",
    effectiveTo: "2027-12-31",
    markupFraction: "0.20",
    regulatoryDataVersion: REGULATORY_DATA_VERSION,
  },
  {
    effectiveFrom: "2028-01-01",
    markupFraction: "0.30",
    regulatoryDataVersion: REGULATORY_DATA_VERSION,
  },
];

export function defaultMarkupForDate(asOf: string): DefaultMarkupPeriod {
  assertIsoDate(asOf, "Default-value date");
  const period = MARKUPS_FOR_UNMARKED_DEFAULT_BASES.find(
    (candidate) =>
      asOf >= candidate.effectiveFrom &&
      (candidate.effectiveTo === undefined || asOf <= candidate.effectiveTo),
  );
  if (!period) {
    throw new MrvValidationError(
      "NO_DEFAULT_MARKUP",
      `No definitive-period default-value markup is configured for ${asOf}`,
    );
  }
  return period;
}

export interface AnnualImportMass {
  importerId: string;
  calendarYear: number;
  sector: "IRON_STEEL" | "ALUMINIUM" | "CEMENT" | "FERTILISER" | "ELECTRICITY" | "HYDROGEN";
  netMass: MeasuredValue;
  customsDeclarationReference?: string;
}

export interface AnnualThresholdAssessment {
  importerId: string;
  calendarYear: number;
  eligibleNetMass: DecimalString;
  unit: "TNE";
  threshold: "50";
  exempt: boolean;
  obligationsApplyToAllEligibleImports: boolean;
  excludedEntryCount: number;
  sourceReference: string;
}

/**
 * Assesses the single mass-based threshold per EU importer and calendar year.
 * It is not a shipment-, request-, supplier-, or declaration-level test.
 */
export function assessAnnualImporterThreshold(
  importerId: string,
  calendarYear: number,
  imports: readonly AnnualImportMass[],
): AnnualThresholdAssessment {
  if (!importerId.trim()) {
    throw new MrvValidationError("IMPORTER_REQUIRED", "Importer identity is required for threshold assessment");
  }
  if (!Number.isInteger(calendarYear) || calendarYear < 2026) {
    throw new MrvValidationError("INVALID_CALENDAR_YEAR", "Threshold calendar year must be 2026 or later");
  }

  let total = decimal("0");
  let excludedEntryCount = 0;
  for (const entry of imports) {
    if (entry.importerId !== importerId || entry.calendarYear !== calendarYear) {
      throw new MrvValidationError(
        "THRESHOLD_SCOPE_MISMATCH",
        "Every entry must belong to the assessed importer and calendar year",
      );
    }
    assertCanonicalUnit(entry.netMass, "TNE", "netMass");
    const mass = decimal(entry.netMass.canonicalValue);
    requireNonNegative(mass, "netMass");
    if (entry.sector === "ELECTRICITY" || entry.sector === "HYDROGEN") {
      excludedEntryCount += 1;
    } else {
      total = total.plus(mass);
    }
  }

  const exceeds = total.greaterThan(50);
  return {
    importerId,
    calendarYear,
    eligibleNetMass: decimalToString(total),
    unit: "TNE",
    threshold: "50",
    exempt: !exceeds,
    obligationsApplyToAllEligibleImports: exceeds,
    excludedEntryCount,
    sourceReference: REGULATORY_SOURCES.simplification.id,
  };
}

export function cbamDeclarationDueDate(reportingCalendarYear: number): string {
  if (!Number.isInteger(reportingCalendarYear) || reportingCalendarYear < 2026) {
    throw new MrvValidationError("INVALID_REPORTING_YEAR", "The definitive reporting year must be 2026 or later");
  }
  return `${reportingCalendarYear + 1}-09-30`;
}

export interface CertificatePricePeriod {
  id: string;
  effectiveFrom: string;
  effectiveTo: string;
  publishedAt: string;
  price: MeasuredValue;
  publicationReference: string;
  sourceReference: string;
  regulatoryDataVersion: string;
}

/**
 * Published 2026 quarterly prices known in this regulatory-data snapshot.
 * Later periods are intentionally absent until an official publication is
 * ingested. Callers must never substitute a proxy or historic value.
 */
export const CERTIFICATE_PRICES_2026: readonly CertificatePricePeriod[] = [
  {
    id: "CBAM-PRICE-2026-Q1",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-03-31",
    publishedAt: "2026-04-07",
    price: measuredValue(MEASUREMENT_SPECS.carbonPrice, "75.36", "EUR_PER_TCO2E"),
    publicationReference: "European Commission CBAM certificate price — 2026 Q1",
    sourceReference: REGULATORY_SOURCES.certificatePrices.id,
    regulatoryDataVersion: REGULATORY_DATA_VERSION,
  },
  {
    id: "CBAM-PRICE-2026-Q2",
    effectiveFrom: "2026-04-01",
    effectiveTo: "2026-06-30",
    publishedAt: "2026-07-06",
    price: measuredValue(MEASUREMENT_SPECS.carbonPrice, "75.28", "EUR_PER_TCO2E"),
    publicationReference: "European Commission CBAM certificate price — 2026 Q2",
    sourceReference: REGULATORY_SOURCES.certificatePrices.id,
    regulatoryDataVersion: REGULATORY_DATA_VERSION,
  },
];

export function lookupCertificatePrice(
  asOf: string,
  prices: readonly CertificatePricePeriod[] = CERTIFICATE_PRICES_2026,
): CertificatePricePeriod | undefined {
  assertIsoDate(asOf, "Certificate price date");
  return prices.find((period) => asOf >= period.effectiveFrom && asOf <= period.effectiveTo);
}

export function requireCertificatePrice(
  asOf: string,
  prices: readonly CertificatePricePeriod[] = CERTIFICATE_PRICES_2026,
): CertificatePricePeriod {
  const price = lookupCertificatePrice(asOf, prices);
  if (!price) {
    throw new MrvValidationError(
      "CERTIFICATE_PRICE_UNAVAILABLE",
      `No officially published certificate price is available for ${asOf}; proxy fallback is prohibited`,
    );
  }
  return price;
}

export interface VerificationGateResult {
  verified: boolean;
  blockers: readonly string[];
}

export function evaluateActualValueVerification(
  verification: VerificationReference | undefined,
  category: AggregatedGoodsCategory,
  reportingPeriod: { start: string; end: string },
): VerificationGateResult {
  const blockers: string[] = [];
  if (!verification) {
    return { verified: false, blockers: ["An accredited verifier report is required for actual values"] };
  }
  const dateFields = [
    ["accreditationValidFrom", verification.accreditationValidFrom],
    ["accreditationValidTo", verification.accreditationValidTo],
    ["verificationReportIssuedAt", verification.verificationReportIssuedAt],
    ["verification.reportingPeriodStart", verification.reportingPeriodStart],
    ["verification.reportingPeriodEnd", verification.reportingPeriodEnd],
    ["requested.reportingPeriodStart", reportingPeriod.start],
    ["requested.reportingPeriodEnd", reportingPeriod.end],
  ] as const;
  const invalidDates = dateFields.filter(([, value]) => !isIsoDate(value));
  if (invalidDates.length > 0) {
    blockers.push(`Invalid verification date fields: ${invalidDates.map(([field]) => field).join(", ")}`);
  }
  if (verification.opinion !== "SATISFACTORY") {
    blockers.push("The verifier opinion is not satisfactory");
  }
  if (!verification.sectorScopes.includes(category)) {
    blockers.push("The verifier accreditation scope does not cover the aggregated goods category");
  }
  if (invalidDates.length === 0 && (
    verification.verificationReportIssuedAt < verification.accreditationValidFrom ||
    verification.verificationReportIssuedAt > verification.accreditationValidTo
  )) {
    blockers.push("The verifier accreditation was not valid when the report was issued");
  }
  if (invalidDates.length === 0 && (
    verification.reportingPeriodStart > reportingPeriod.start ||
    verification.reportingPeriodEnd < reportingPeriod.end
  )) {
    blockers.push("The verification report does not cover the complete reporting period");
  }
  if (!verification.accreditationIdentifier.trim()) {
    blockers.push("The verifier accreditation identifier is missing");
  }
  if (!verification.verifierLegalName.trim() || !verification.accreditationBody.trim()) {
    blockers.push("The verifier legal name and accreditation body are required");
  }
  if (!verification.verificationReportReference.trim()) {
    blockers.push("The verification report reference is missing");
  }
  if (verification.evidenceReferences.length === 0) {
    blockers.push("The verification report evidence reference is missing");
  }
  if (invalidDates.length === 0 && verification.verificationReportIssuedAt < reportingPeriod.end) {
    blockers.push("The verification report was issued before the reporting period ended");
  }
  return { verified: blockers.length === 0, blockers };
}
