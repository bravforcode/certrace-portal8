import { isComplexGood, type CatalogProduct } from "./config";
import {
  applyDirectIndirectTreatment,
  calculatePrecursorContribution,
  classifyCnCode,
  combineComplexGoodsSpecificEmissions,
  decimal,
  decimalToString,
  measuredValue,
  MEASUREMENT_SPECS,
  MrvValidationError,
  REGULATORY_DATA_VERSION,
  type CalculationTrace,
  type MeasuredValue,
  type PrecursorInput,
} from "./mrv";
import { parsePrecursors, precursorContributionExact, rowComplete } from "./precursors";

export type GoodsMassUnit = "TNE" | "KGM";

/** Build the persisted, audit-traceable mass value at the workflow boundary. */
export function goodsMass(value: string, unit: GoodsMassUnit): MeasuredValue {
  return measuredValue(MEASUREMENT_SPECS.goodsMass, value, unit);
}

export function isPositiveMass(value: string, unit: string): unit is GoodsMassUnit {
  if (unit !== "TNE" && unit !== "KGM") return false;
  try {
    return decimal(value).isPositive();
  } catch {
    return false;
  }
}

export function sumCanonicalTonnes(values: readonly MeasuredValue[]): string {
  const total = values.reduce((sum, value) => {
    if (value.canonicalUnit !== "TNE") {
      throw new MrvValidationError("UNIT_MISMATCH", "Commercial goods mass must resolve to TNE");
    }
    return sum.plus(decimal(value.canonicalValue));
  }, decimal("0"));
  return decimalToString(total);
}

function specificEmissions(raw: string | undefined): MeasuredValue {
  return measuredValue(MEASUREMENT_SPECS.specificEmissions, raw?.trim() || "0", "TCO2E_PER_TNE");
}

function regulatoryProduct(product: CatalogProduct) {
  const classified = classifyCnCode(product.cnCode);
  if (!classified) {
    throw new MrvValidationError(
      "CN_CLASSIFICATION_REQUIRED",
      `CN ${product.cnCode} is not classified by the effective regulatory master data`,
    );
  }
  return classified;
}

/**
 * Definitive embedded emissions for steel/aluminium. Indirect emissions remain
 * an exact trace input but Annex-II treatment excludes them from the result.
 */
export function embeddedEmissionsPerTonne(input: {
  product: CatalogProduct;
  direct?: string;
  indirect?: string;
  precursors?: string;
  reportingPeriod?: string;
}): string | null {
  return embeddedEmissionsCalculation(input)?.value ?? null;
}

function reportingBounds(period: string | undefined): { start: string; end: string } {
  const year = /(20\d\d)/.exec(period ?? "")?.[1];
  if (!year) {
    throw new MrvValidationError("REPORTING_YEAR_REQUIRED", "A reporting year is required for the calculation trace");
  }
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

/** Exact result plus the authoritative formulas, inputs, sources and warnings. */
export function embeddedEmissionsCalculation(input: {
  product: CatalogProduct;
  direct?: string;
  indirect?: string;
  precursors?: string;
  reportingPeriod?: string;
}): { value: string; traces: readonly CalculationTrace[] } | null {
  const hasInput = Boolean(input.direct?.trim() || input.indirect?.trim() || input.precursors?.trim());
  if (!hasInput) return null;

  const treated = applyDirectIndirectTreatment({
    traceId: `workflow:${input.product.id}:direct-indirect`,
    product: regulatoryProduct(input.product),
    directEmissions: specificEmissions(input.direct),
    indirectEmissions: specificEmissions(input.indirect),
  });
  if (!isComplexGood(input.product)) {
    return { value: treated.value, traces: [treated.trace] };
  }

  const rows = parsePrecursors(input.precursors);
  if (!rows && input.precursors?.trim()) {
    throw new MrvValidationError("STRUCTURED_PRECURSORS_REQUIRED", "Structured precursor rows are required");
  }
  const reportingPeriod = reportingBounds(input.reportingPeriod);
  const precursorInputs: PrecursorInput[] = (rows ?? []).filter(rowComplete).map((row, index) => {
    const classified = classifyCnCode(row.cn);
    if (!classified) {
      throw new MrvValidationError("PRECURSOR_CN_CLASSIFICATION_REQUIRED", `Precursor CN ${row.cn} is not classified`);
    }
    const quantityUnit = row.qtyUnit === "KGM_PER_TNE" ? "KGM" : "TNE";
    const specific = measuredValue(MEASUREMENT_SPECS.specificEmissions, row.see, "TCO2E_PER_TNE");
    return {
      id: `workflow:${input.product.id}:precursor:${index + 1}`,
      processId: `workflow:${input.product.id}:process`,
      precursorCnCode: classified.cnCode,
      precursorCategory: classified.aggregatedGoodsCategory,
      quantityConsumed: measuredValue(MEASUREMENT_SPECS.goodsMass, row.qty, quantityUnit),
      determinationMethod: row.method === "actual" ? "ACTUAL" : "DEFAULT",
      actualSpecificEmbeddedEmissions: row.method === "actual" ? specific : undefined,
      unmarkedDefaultSpecificEmbeddedEmissions:
        row.method === "default" && row.defaultValueBasis === "unmarked_base" ? specific : undefined,
      publishedMarkedDefaultSpecificEmbeddedEmissions:
        row.method === "default" && row.defaultValueBasis === "published_includes_markup" ? specific : undefined,
      // A browser text reference is deliberately not promoted to VerificationReference.
      verificationReference: undefined,
      evidenceReferences: [],
      regulatoryDataVersion: row.regulatoryDataVersion || REGULATORY_DATA_VERSION,
    };
  });
  const precursor = calculatePrecursorContribution({
    traceId: `workflow:${input.product.id}:precursors`,
    reportingDate: reportingPeriod.end,
    reportingPeriod,
    goodsProduction: goodsMass("1", "TNE"),
    precursors: precursorInputs,
  });
  const combined = combineComplexGoodsSpecificEmissions({
    traceId: `workflow:${input.product.id}:complex-good`,
    ownProcessSpecificEmissions: measuredValue(MEASUREMENT_SPECS.specificEmissions, treated.value, "TCO2E_PER_TNE"),
    precursorSpecificEmissions: measuredValue(MEASUREMENT_SPECS.specificEmissions, precursor.value, "TCO2E_PER_TNE"),
  });
  return { value: combined.value, traces: [treated.trace, precursor.trace, combined.trace] };
}

/** Reported inventory view; unlike the regulated embedded result it retains indirect emissions. */
export function reportedEmissionsPerTonne(input: {
  direct?: string;
  indirect?: string;
  precursors?: string;
  reportingPeriod?: string;
}): string | null {
  const hasInput = Boolean(input.direct?.trim() || input.indirect?.trim() || input.precursors?.trim());
  if (!hasInput) return null;
  return decimalToString(
    decimal(input.direct?.trim() || "0")
      .plus(decimal(input.indirect?.trim() || "0"))
      .plus(precursorContributionExact(input.precursors, input.reportingPeriod)),
  );
}

export function multiplyExact(left: string, right: string): string {
  return decimalToString(decimal(left).times(decimal(right)));
}

export function addExact(values: readonly string[]): string {
  return decimalToString(values.reduce((sum, value) => sum.plus(decimal(value)), decimal("0")));
}

/** Locale-independent grouping without converting the regulatory decimal to Number. */
export function formatDecimal(value: string): string {
  const normalized = decimalToString(decimal(value));
  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [integer, fraction] = unsigned.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}${grouped}${fraction ? `.${fraction}` : ""}`;
}
