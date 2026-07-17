/**
 * Definitive-period CBAM MRV contracts.
 *
 * Decimal quantities cross module and persistence boundaries as strings. This
 * is deliberate: JavaScript numbers are not an acceptable interchange format
 * for regulatory calculations where exact inputs and reproducibility matter.
 */

export type DecimalString = string;
export type IsoDateString = string;
export type EvidenceReferenceId = string;

export type Sector = "IRON_STEEL" | "ALUMINIUM";
export type GreenhouseGas = "CO2" | "CF4" | "C2F6";

export type UnitCode =
  | "TNE"
  | "KGM"
  | "TCO2E"
  | "KGCO2E"
  | "TCO2E_PER_TNE"
  | "KGCO2E_PER_TNE"
  | "MWH"
  | "KWH"
  | "GJ"
  | "MJ"
  | "TJ"
  | "NM3"
  | "HUR"
  | "TCO2E_PER_MWH"
  | "KGCO2E_PER_KWH"
  | "TCO2E_PER_GJ"
  | "KGCO2E_PER_GJ"
  | "TCO2E_PER_TJ"
  | "TCO2E_PER_NM3"
  | "KGCO2E_PER_NM3"
  | "TNE_PER_TNE"
  | "KGM_PER_TNE"
  | "FRACTION"
  | "PERCENT"
  | "TNE_CF4"
  | "KGM_CF4"
  | "TNE_C2F6"
  | "KGM_C2F6"
  | "KGM_CF4_PER_TNE_AL_PER_AEM"
  | "KGM_CF4_PER_TNE_AL_PER_MILLIVOLT"
  | "TNE_C2F6_PER_TNE_CF4"
  | "AEM_MIN_PER_CELL_DAY"
  | "MILLIVOLT"
  | "EUR_PER_TCO2E";

export type MeasurementDimension =
  | "GOODS_MASS"
  | "EMISSIONS_MASS"
  | "SPECIFIC_EMISSIONS"
  | "ELECTRICITY"
  | "HEAT_ENERGY"
  | "NORMAL_VOLUME"
  | "TIME"
  | "ELECTRICITY_EMISSION_FACTOR"
  | "HEAT_EMISSION_FACTOR"
  | "VOLUME_EMISSION_FACTOR"
  | "PRECURSOR_RATIO"
  | "DIMENSIONLESS"
  | "PFC_CF4_MASS"
  | "PFC_C2F6_MASS"
  | "PFC_SLOPE_FACTOR"
  | "PFC_OVERVOLTAGE_FACTOR"
  | "PFC_MASS_RATIO"
  | "ANODE_EFFECT_ACTIVITY"
  | "OVERVOLTAGE"
  | "CARBON_PRICE";

export interface MeasurementSpec {
  id: string;
  label: string;
  dimension: MeasurementDimension;
  canonicalUnit: UnitCode;
  allowedInputUnits: readonly UnitCode[];
  minimumCanonicalValue?: DecimalString;
  maximumCanonicalValue?: DecimalString;
  maximumEnteredDecimalPlaces?: number;
  regulatoryDataVersion: string;
}

export interface MeasuredValue {
  enteredValue: DecimalString;
  enteredUnit: UnitCode;
  canonicalValue: DecimalString;
  canonicalUnit: UnitCode;
  conversionRule: string;
  precision: {
    enteredDecimalPlaces: number;
    canonicalDecimalPlaces: number;
    rounding: "NONE_EXACT";
  };
  measurementSpecId: string;
  regulatoryDataVersion: string;
}

export interface RegulatorySourceReference {
  id: string;
  title: string;
  celex: string;
  url: string;
  provisions: readonly string[];
  effectiveFrom: IsoDateString;
}

export type AggregatedGoodsCategory =
  | "SINTERED_ORE"
  | "PIG_IRON"
  | "PIG_IRON_OR_IRON_STEEL_PRODUCTS"
  | "FERROMANGANESE"
  | "FERROCHROMIUM"
  | "FERRONICKEL"
  | "DRI"
  | "CRUDE_STEEL"
  | "IRON_STEEL_PRODUCTS"
  | "UNWROUGHT_ALUMINIUM"
  | "ALUMINIUM_PRODUCTS";

export type ProductionRouteCode =
  | "SINTERING"
  | "PELLETISING"
  | "BLAST_FURNACE"
  | "SMELTING_REDUCTION"
  | "SUBMERGED_ARC_FURNACE"
  | "ROTARY_KILN_ELECTRIC_FURNACE"
  | "GAS_BASED_DRI"
  | "COAL_BASED_DRI"
  | "HYDROGEN_BASED_DRI"
  | "BF_BOF"
  | "SCRAP_EAF"
  | "DRI_EAF"
  | "IRON_STEEL_DOWNSTREAM"
  | "PRIMARY_HALL_HEROULT"
  | "SECONDARY_ALUMINIUM_REMELT"
  | "ALUMINIUM_DOWNSTREAM";

export interface RegulatoryProduct {
  classificationId: string;
  cnCode: string;
  sector: Sector;
  aggregatedGoodsCategory: AggregatedGoodsCategory;
  description: string;
  productionRoutes: readonly ProductionRouteCode[];
  qualifyingParameters: readonly string[];
  greenhouseGases: readonly GreenhouseGas[];
  directEmissionsTreatment: "INCLUDED";
  indirectEmissionsTreatment:
    | "INCLUDED"
    | "EXCLUDED_FROM_EMBEDDED_EMISSIONS_ANNEX_II";
  requiresProductionContext: boolean;
  effectiveFrom: IsoDateString;
  effectiveTo?: IsoDateString;
  regulatoryDataVersion: string;
  sourceReferences: readonly RegulatorySourceReference[];
}

export interface InstallationBoundary {
  installationId: string;
  installationName: string;
  countryCode: string;
  address: string;
  geographicCoordinates?: {
    latitude: DecimalString;
    longitude: DecimalString;
  };
  includedProcessIds: readonly string[];
  excludedActivities: readonly string[];
  boundaryEvidenceReferences: readonly EvidenceReferenceId[];
}

export interface MonitoringPlan {
  id: string;
  version: string;
  status: "DRAFT" | "OPERATOR_APPROVED" | "SUPERSEDED";
  reportingPeriod: {
    start: IsoDateString;
    end: IsoDateString;
    calendarYear: number;
  };
  installationBoundary: InstallationBoundary;
  processIds: readonly string[];
  sourceStreamIds: readonly string[];
  emissionSourceIds: readonly string[];
  energyFlowIds: readonly string[];
  dataGapMethodology: string;
  controlActivities: readonly string[];
  evidenceReferences: readonly EvidenceReferenceId[];
  regulatoryDataVersion: string;
}

export interface ProductionProcess {
  id: string;
  installationId: string;
  name: string;
  route: ProductionRouteCode;
  aggregatedGoodsCategory: AggregatedGoodsCategory;
  cnCodes: readonly string[];
  systemBoundaryDescription: string;
  activityLevel: MeasuredValue;
  /** Whether this process uses installation-specific actual embedded-emissions data or Commission defaults. */
  determinationMethod: "ACTUAL" | "DEFAULT";
  /** Accredited-verifier reports asserted to cover this process; required for ACTUAL. */
  verificationReferenceIds: readonly string[];
  outputProductIds: readonly string[];
  sourceStreamIds: readonly string[];
  emissionSourceIds: readonly string[];
  energyFlowIds: readonly string[];
  precursorInputIds: readonly string[];
  evidenceReferences: readonly EvidenceReferenceId[];
  regulatoryDataVersion: string;
}

export interface SourceStream {
  id: string;
  installationId: string;
  processId: string;
  name: string;
  materialOrFuel: string;
  methodology: "STANDARD_CALCULATION" | "MASS_BALANCE";
  activityData: MeasuredValue;
  calculationFactorReferences: readonly EvidenceReferenceId[];
  evidenceReferences: readonly EvidenceReferenceId[];
  regulatoryDataVersion: string;
}

export interface EmissionSource {
  id: string;
  installationId: string;
  processId: string;
  name: string;
  methodology: "CEMS" | "CALCULATION_BASED" | "PFC_SLOPE" | "PFC_OVERVOLTAGE";
  greenhouseGases: readonly GreenhouseGas[];
  measurementPoint: string;
  uncertaintyPercent?: DecimalString;
  evidenceReferences: readonly EvidenceReferenceId[];
  regulatoryDataVersion: string;
}

export interface EnergyFlow {
  id: string;
  installationId: string;
  processId: string;
  kind:
    | "ELECTRICITY_IMPORTED"
    | "ELECTRICITY_EXPORTED"
    | "MEASURABLE_HEAT_IMPORTED"
    | "MEASURABLE_HEAT_EXPORTED"
    | "CHP_HEAT"
    | "CHP_ELECTRICITY"
    | "WASTE_GAS_TRANSFER";
  quantity: MeasuredValue;
  sourceInstallationId?: string;
  destinationInstallationId?: string;
  evidenceReferences: readonly EvidenceReferenceId[];
  regulatoryDataVersion: string;
}

export interface VerificationReference {
  id: string;
  verifierLegalName: string;
  accreditationBody: string;
  accreditationIdentifier: string;
  accreditationValidFrom: IsoDateString;
  accreditationValidTo: IsoDateString;
  sectorScopes: readonly AggregatedGoodsCategory[];
  verificationReportReference: string;
  verificationReportIssuedAt: IsoDateString;
  reportingPeriodStart: IsoDateString;
  reportingPeriodEnd: IsoDateString;
  opinion: "SATISFACTORY" | "NOT_SATISFACTORY" | "WITHHELD";
  evidenceReferences: readonly EvidenceReferenceId[];
}

export interface PrecursorInput {
  id: string;
  processId: string;
  precursorCnCode: string;
  precursorCategory: AggregatedGoodsCategory;
  quantityConsumed: MeasuredValue;
  determinationMethod: "ACTUAL" | "DEFAULT";
  actualSpecificEmbeddedEmissions?: MeasuredValue;
  unmarkedDefaultSpecificEmbeddedEmissions?: MeasuredValue;
  publishedMarkedDefaultSpecificEmbeddedEmissions?: MeasuredValue;
  verificationReference?: VerificationReference;
  evidenceReferences: readonly EvidenceReferenceId[];
  regulatoryDataVersion: string;
}

export interface CalculationTraceInput {
  name: string;
  value: DecimalString;
  unit: UnitCode;
  sourceReference?: EvidenceReferenceId;
}

export interface CalculationWarning {
  code: string;
  severity: "INFO" | "WARNING" | "BLOCKER";
  message: string;
}

export interface CalculationTrace {
  id: string;
  method:
    | "STANDARD_CALCULATION"
    | "MASS_BALANCE"
    | "CEMS"
    | "ELECTRICITY"
    | "MEASURABLE_HEAT"
    | "CHP_ALLOCATION"
    | "WASTE_GAS_ALLOCATION"
    | "PRECURSOR_MIX"
    | "PRODUCTION_ALLOCATION"
    | "ALUMINIUM_PFC_SLOPE"
    | "ALUMINIUM_PFC_OVERVOLTAGE"
    | "COMPLEX_GOODS"
    | "FREE_ALLOCATION_ADJUSTMENT"
    | "DIRECT_INDIRECT_TREATMENT";
  formula: string;
  exactInputs: readonly CalculationTraceInput[];
  output: {
    value: DecimalString;
    unit: UnitCode;
  };
  evidenceReferences: readonly EvidenceReferenceId[];
  regulatoryDataVersion: string;
  decimalContext: {
    significantDigits: 80;
    rounding: "ROUND_HALF_EVEN";
  };
  authoritative: true;
  warnings: readonly CalculationWarning[];
}

export interface MrvReportDraft {
  id: string;
  status: "DRAFT_CALCULATION_PREVIEW";
  reportingPeriod: MonitoringPlan["reportingPeriod"];
  /** One versioned plan per installation boundary in this draft. */
  monitoringPlans: readonly MonitoringPlan[];
  productionProcesses: readonly ProductionProcess[];
  sourceStreams: readonly SourceStream[];
  emissionSources: readonly EmissionSource[];
  energyFlows: readonly EnergyFlow[];
  precursorInputs: readonly PrecursorInput[];
  calculations: readonly CalculationTrace[];
  verificationReferences: readonly VerificationReference[];
  verificationState: "NOT_SUBMITTED" | "BLOCKED" | "VERIFIED";
  blockers: readonly string[];
  evidenceReferences: readonly EvidenceReferenceId[];
  regulatoryDataVersion: string;
  fixtureReviewStatus?: "PENDING_ESG_SPECIALIST_REVIEW";
}

export interface TracedCalculation {
  value: DecimalString;
  unit: UnitCode;
  trace: CalculationTrace;
}
