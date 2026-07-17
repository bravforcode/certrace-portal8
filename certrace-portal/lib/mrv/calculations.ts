import {
  decimal,
  decimalToString,
  MrvValidationError,
  requireFraction,
  requireNonNegative,
  requirePositive,
} from "./decimal";
import { defaultMarkupForDate, evaluateActualValueVerification } from "./compliance";
import { assertCanonicalUnit, REGULATORY_DATA_VERSION } from "./measurements";
import { REGULATORY_SOURCES } from "./regulatory-data";
import type {
  CalculationTrace,
  CalculationTraceInput,
  CalculationWarning,
  MeasuredValue,
  PrecursorInput,
  RegulatoryProduct,
  TracedCalculation,
  UnitCode,
} from "./types";

const MWH_TO_GJ = decimal("3.6");
const KG_TO_TONNE = decimal("0.001");
const GWP_CF4 = decimal("6630");
const GWP_C2F6 = decimal("11100");

const unique = (values: readonly string[]): string[] => [...new Set(values.filter(Boolean))];

function evidenceFromInputs(inputs: readonly CalculationTraceInput[]): string[] {
  return unique(inputs.flatMap((input) => (input.sourceReference ? [input.sourceReference] : [])));
}

function result(
  id: string,
  method: CalculationTrace["method"],
  formula: string,
  exactInputs: readonly CalculationTraceInput[],
  value: string,
  unit: UnitCode,
  options?: {
    evidenceReferences?: readonly string[];
    warnings?: readonly CalculationWarning[];
  },
): TracedCalculation {
  const normalized = decimalToString(decimal(value));
  return {
    value: normalized,
    unit,
    trace: {
      id,
      method,
      formula,
      exactInputs,
      output: { value: normalized, unit },
      evidenceReferences: unique([
        ...evidenceFromInputs(exactInputs),
        ...(options?.evidenceReferences ?? []),
      ]),
      regulatoryDataVersion: REGULATORY_DATA_VERSION,
      decimalContext: {
        significantDigits: 80,
        rounding: "ROUND_HALF_EVEN",
      },
      authoritative: true,
      warnings: options?.warnings ?? [],
    },
  };
}

function measuredInput(name: string, value: MeasuredValue, sourceReference?: string): CalculationTraceInput {
  return {
    name,
    value: value.canonicalValue,
    unit: value.canonicalUnit,
    sourceReference,
  };
}

function fraction(value: MeasuredValue, field: string): ReturnType<typeof decimal> {
  assertCanonicalUnit(value, "FRACTION", field);
  const parsed = decimal(value.canonicalValue);
  requireFraction(parsed, field);
  return parsed;
}

function pfcMassRatio(value: MeasuredValue, field: string): ReturnType<typeof decimal> {
  assertCanonicalUnit(value, "TNE_C2F6_PER_TNE_CF4", field);
  const parsed = decimal(value.canonicalValue);
  requireFraction(parsed, field);
  return parsed;
}

export interface StandardCalculationInput {
  traceId: string;
  activityData: MeasuredValue;
  emissionFactor: MeasuredValue;
  oxidationFactor?: MeasuredValue;
  conversionFactor?: MeasuredValue;
  evidenceReferences?: readonly string[];
}

const STANDARD_UNIT_PAIRS: Readonly<Partial<Record<UnitCode, UnitCode>>> = {
  TNE: "TCO2E_PER_TNE",
  GJ: "TCO2E_PER_GJ",
  NM3: "TCO2E_PER_NM3",
} as const;

export function calculateStandardSourceStreamEmissions(input: StandardCalculationInput): TracedCalculation {
  const expectedFactorUnit = STANDARD_UNIT_PAIRS[input.activityData.canonicalUnit];
  if (!expectedFactorUnit || input.emissionFactor.canonicalUnit !== expectedFactorUnit) {
    throw new MrvValidationError(
      "INCOMPATIBLE_EMISSION_FACTOR",
      `No standard-calculation pairing exists for ${input.activityData.canonicalUnit} and ${input.emissionFactor.canonicalUnit}`,
    );
  }
  const activity = decimal(input.activityData.canonicalValue);
  const emissionFactor = decimal(input.emissionFactor.canonicalValue);
  requireNonNegative(activity, "activityData");
  requireNonNegative(emissionFactor, "emissionFactor");
  const oxidation = input.oxidationFactor ? fraction(input.oxidationFactor, "oxidationFactor") : decimal("1");
  const conversion = input.conversionFactor ? fraction(input.conversionFactor, "conversionFactor") : decimal("1");
  const value = activity.times(emissionFactor).times(oxidation).times(conversion);
  const exactInputs = [
    measuredInput("activityData", input.activityData),
    measuredInput("emissionFactor", input.emissionFactor),
    {
      name: "oxidationFactor",
      value: decimalToString(oxidation),
      unit: "FRACTION" as const,
    },
    {
      name: "conversionFactor",
      value: decimalToString(conversion),
      unit: "FRACTION" as const,
    },
  ];
  return result(
    input.traceId,
    "STANDARD_CALCULATION",
    "E = activityData × emissionFactor × oxidationFactor × conversionFactor",
    exactInputs,
    decimalToString(value),
    "TCO2E",
    {
      evidenceReferences: input.evidenceReferences,
    },
  );
}

export interface MassBalanceEntry {
  id: string;
  direction: "INPUT" | "OUTPUT";
  quantity: MeasuredValue;
  carbonContent: MeasuredValue;
  evidenceReference?: string;
}

export function calculateMassBalanceEmissions(
  traceId: string,
  entries: readonly MassBalanceEntry[],
): TracedCalculation {
  if (entries.length === 0) {
    throw new MrvValidationError("MASS_BALANCE_EMPTY", "A mass balance requires at least one input or output");
  }
  let carbonInputs = decimal("0");
  let carbonOutputs = decimal("0");
  const exactInputs: CalculationTraceInput[] = [];
  for (const entry of entries) {
    assertCanonicalUnit(entry.quantity, "TNE", `${entry.id}.quantity`);
    const quantity = decimal(entry.quantity.canonicalValue);
    const carbonContent = fraction(entry.carbonContent, `${entry.id}.carbonContent`);
    requireNonNegative(quantity, `${entry.id}.quantity`);
    const carbonMass = quantity.times(carbonContent);
    if (entry.direction === "INPUT") carbonInputs = carbonInputs.plus(carbonMass);
    else carbonOutputs = carbonOutputs.plus(carbonMass);
    exactInputs.push(
      measuredInput(`${entry.id}.quantity.${entry.direction.toLowerCase()}`, entry.quantity, entry.evidenceReference),
      measuredInput(`${entry.id}.carbonContent`, entry.carbonContent, entry.evidenceReference),
    );
  }
  const carbonDifference = carbonInputs.minus(carbonOutputs);
  if (carbonDifference.isNegative()) {
    throw new MrvValidationError(
      "NEGATIVE_MASS_BALANCE",
      "Mass-balance outputs contain more carbon than inputs; review the installation boundary and data",
    );
  }
  // Multiply before division so exact multiples of the carbon molar mass do
  // not inherit a rounded recurring representation of 44/12.
  const emissions = carbonDifference.times("44").dividedBy("12");
  return result(
    traceId,
    "MASS_BALANCE",
    "E_CO2 = (Σ inputMass × inputCarbonContent − Σ outputMass × outputCarbonContent) × 44 / 12",
    exactInputs,
    decimalToString(emissions),
    "TCO2E",
    { evidenceReferences: [REGULATORY_SOURCES.monitoring.id] },
  );
}

export function calculateCemsEmissions(input: {
  traceId: string;
  averageConcentration: MeasuredValue;
  monitoredStackGasVolume: MeasuredValue;
  evidenceReferences?: readonly string[];
}): TracedCalculation {
  assertCanonicalUnit(input.averageConcentration, "TCO2E_PER_NM3", "averageConcentration");
  assertCanonicalUnit(input.monitoredStackGasVolume, "NM3", "monitoredStackGasVolume");
  const concentration = decimal(input.averageConcentration.canonicalValue);
  const volume = decimal(input.monitoredStackGasVolume.canonicalValue);
  requireNonNegative(concentration, "averageConcentration");
  requireNonNegative(volume, "monitoredStackGasVolume");
  return result(
    input.traceId,
    "CEMS",
    "E = time-weighted average GHG concentration × integrated dry stack-gas volume at normal conditions",
    [
      measuredInput("averageConcentration", input.averageConcentration),
      measuredInput("monitoredStackGasVolume", input.monitoredStackGasVolume),
    ],
    decimalToString(concentration.times(volume)),
    "TCO2E",
    { evidenceReferences: input.evidenceReferences },
  );
}

export function calculateElectricityEmissions(input: {
  traceId: string;
  electricity: MeasuredValue;
  emissionFactor: MeasuredValue;
  evidenceReferences?: readonly string[];
}): TracedCalculation {
  assertCanonicalUnit(input.electricity, "MWH", "electricity");
  assertCanonicalUnit(input.emissionFactor, "TCO2E_PER_MWH", "emissionFactor");
  const electricity = decimal(input.electricity.canonicalValue);
  const factorValue = decimal(input.emissionFactor.canonicalValue);
  requireNonNegative(electricity, "electricity");
  requireNonNegative(factorValue, "emissionFactor");
  return result(
    input.traceId,
    "ELECTRICITY",
    "E_indirect = electricityConsumed × applicableElectricityEmissionFactor",
    [measuredInput("electricityConsumed", input.electricity), measuredInput("emissionFactor", input.emissionFactor)],
    decimalToString(electricity.times(factorValue)),
    "TCO2E",
    { evidenceReferences: input.evidenceReferences },
  );
}

export function calculateMeasurableHeatEmissions(input: {
  traceId: string;
  netMeasurableHeat: MeasuredValue;
  emissionFactor: MeasuredValue;
  evidenceReferences?: readonly string[];
}): TracedCalculation {
  assertCanonicalUnit(input.netMeasurableHeat, "GJ", "netMeasurableHeat");
  assertCanonicalUnit(input.emissionFactor, "TCO2E_PER_GJ", "emissionFactor");
  const heat = decimal(input.netMeasurableHeat.canonicalValue);
  const factorValue = decimal(input.emissionFactor.canonicalValue);
  requireNonNegative(heat, "netMeasurableHeat");
  requireNonNegative(factorValue, "emissionFactor");
  return result(
    input.traceId,
    "MEASURABLE_HEAT",
    "E_heat = netMeasurableHeat × heatEmissionFactor",
    [measuredInput("netMeasurableHeat", input.netMeasurableHeat), measuredInput("heatEmissionFactor", input.emissionFactor)],
    decimalToString(heat.times(factorValue)),
    "TCO2E",
    { evidenceReferences: input.evidenceReferences },
  );
}

export function allocateChpEmissions(input: {
  traceId: string;
  totalChpEmissions: MeasuredValue;
  usefulHeat: MeasuredValue;
  electricityOutput: MeasuredValue;
  referenceHeatEfficiency: MeasuredValue;
  referenceElectricEfficiency: MeasuredValue;
  evidenceReferences?: readonly string[];
}): { heat: TracedCalculation; electricity: TracedCalculation } {
  assertCanonicalUnit(input.totalChpEmissions, "TCO2E", "totalChpEmissions");
  assertCanonicalUnit(input.usefulHeat, "GJ", "usefulHeat");
  assertCanonicalUnit(input.electricityOutput, "MWH", "electricityOutput");
  const total = decimal(input.totalChpEmissions.canonicalValue);
  const heat = decimal(input.usefulHeat.canonicalValue);
  const electricityGJ = decimal(input.electricityOutput.canonicalValue).times(MWH_TO_GJ);
  const heatEfficiency = fraction(input.referenceHeatEfficiency, "referenceHeatEfficiency");
  const electricEfficiency = fraction(input.referenceElectricEfficiency, "referenceElectricEfficiency");
  requireNonNegative(total, "totalChpEmissions");
  requireNonNegative(heat, "usefulHeat");
  requireNonNegative(electricityGJ, "electricityOutput");
  requirePositive(heatEfficiency, "referenceHeatEfficiency");
  requirePositive(electricEfficiency, "referenceElectricEfficiency");

  const heatWeight = heat.dividedBy(heatEfficiency);
  const electricityWeight = electricityGJ.dividedBy(electricEfficiency);
  const denominator = heatWeight.plus(electricityWeight);
  requirePositive(denominator, "CHP allocation denominator");
  const heatEmissions = total.times(heatWeight).dividedBy(denominator);
  const electricityEmissions = total.minus(heatEmissions);
  const exactInputs = [
    measuredInput("totalChpEmissions", input.totalChpEmissions),
    measuredInput("usefulHeat", input.usefulHeat),
    measuredInput("electricityOutput", input.electricityOutput),
    measuredInput("referenceHeatEfficiency", input.referenceHeatEfficiency),
    measuredInput("referenceElectricEfficiency", input.referenceElectricEfficiency),
  ];
  const formula =
    "allocationWeight_i = energyOutput_i / referenceEfficiency_i; E_i = E_CHP × allocationWeight_i / Σ allocationWeights (electricity converted using 1 MWH = 3.6 GJ)";
  return {
    heat: result(`${input.traceId}:heat`, "CHP_ALLOCATION", formula, exactInputs, decimalToString(heatEmissions), "TCO2E", {
      evidenceReferences: input.evidenceReferences,
    }),
    electricity: result(
      `${input.traceId}:electricity`,
      "CHP_ALLOCATION",
      formula,
      exactInputs,
      decimalToString(electricityEmissions),
      "TCO2E",
      { evidenceReferences: input.evidenceReferences },
    ),
  };
}

export function allocateWasteGasEmissions(input: {
  traceId: string;
  attributableWasteGasEmissions: MeasuredValue;
  targetUsefulEnergy: MeasuredValue;
  totalUsefulEnergy: MeasuredValue;
  evidenceReferences?: readonly string[];
}): TracedCalculation {
  assertCanonicalUnit(input.attributableWasteGasEmissions, "TCO2E", "attributableWasteGasEmissions");
  assertCanonicalUnit(input.targetUsefulEnergy, "GJ", "targetUsefulEnergy");
  assertCanonicalUnit(input.totalUsefulEnergy, "GJ", "totalUsefulEnergy");
  const emissions = decimal(input.attributableWasteGasEmissions.canonicalValue);
  const target = decimal(input.targetUsefulEnergy.canonicalValue);
  const total = decimal(input.totalUsefulEnergy.canonicalValue);
  requireNonNegative(emissions, "attributableWasteGasEmissions");
  requireNonNegative(target, "targetUsefulEnergy");
  requirePositive(total, "totalUsefulEnergy");
  if (target.greaterThan(total)) {
    throw new MrvValidationError("INVALID_ENERGY_SHARE", "Target useful energy cannot exceed total useful energy");
  }
  return result(
    input.traceId,
    "WASTE_GAS_ALLOCATION",
    "E_target = attributableWasteGasEmissions × targetUsefulEnergy / totalUsefulEnergy",
    [
      measuredInput("attributableWasteGasEmissions", input.attributableWasteGasEmissions),
      measuredInput("targetUsefulEnergy", input.targetUsefulEnergy),
      measuredInput("totalUsefulEnergy", input.totalUsefulEnergy),
    ],
    decimalToString(emissions.times(target).dividedBy(total)),
    "TCO2E",
    {
      evidenceReferences: input.evidenceReferences,
      warnings: [
        {
          code: "WASTE_GAS_ALLOCATION_JUSTIFICATION_REQUIRED",
          severity: "INFO",
          message: "The monitoring plan must document why the useful-energy allocation reflects the waste-gas transfer boundary",
        },
      ],
    },
  );
}

export function calculateProductionAllocation(input: {
  traceId: string;
  allocatableEmissions: MeasuredValue;
  allocationFactor: MeasuredValue;
  productionActivityLevel: MeasuredValue;
  evidenceReferences?: readonly string[];
}): TracedCalculation {
  assertCanonicalUnit(input.allocatableEmissions, "TCO2E", "allocatableEmissions");
  assertCanonicalUnit(input.productionActivityLevel, "TNE", "productionActivityLevel");
  const emissions = decimal(input.allocatableEmissions.canonicalValue);
  const allocation = fraction(input.allocationFactor, "allocationFactor");
  const activity = decimal(input.productionActivityLevel.canonicalValue);
  requireNonNegative(emissions, "allocatableEmissions");
  requirePositive(activity, "productionActivityLevel");
  return result(
    input.traceId,
    "PRODUCTION_ALLOCATION",
    "specificEmissions = allocatableEmissions × allocationFactor / productionActivityLevel",
    [
      measuredInput("allocatableEmissions", input.allocatableEmissions),
      measuredInput("allocationFactor", input.allocationFactor),
      measuredInput("productionActivityLevel", input.productionActivityLevel),
    ],
    decimalToString(emissions.times(allocation).dividedBy(activity)),
    "TCO2E_PER_TNE",
    { evidenceReferences: input.evidenceReferences },
  );
}

export function calculatePrecursorContribution(input: {
  traceId: string;
  reportingDate: string;
  reportingPeriod: { start: string; end: string };
  goodsProduction: MeasuredValue;
  precursors: readonly PrecursorInput[];
}): TracedCalculation {
  assertCanonicalUnit(input.goodsProduction, "TNE", "goodsProduction");
  const production = decimal(input.goodsProduction.canonicalValue);
  requirePositive(production, "goodsProduction");
  let embeddedEmissions = decimal("0");
  const exactInputs: CalculationTraceInput[] = [measuredInput("goodsProduction", input.goodsProduction)];
  const warnings: CalculationWarning[] = [];
  const evidenceReferences: string[] = [
    REGULATORY_SOURCES.monitoring.id,
    REGULATORY_SOURCES.defaults.id,
    REGULATORY_SOURCES.verification.id,
    REGULATORY_SOURCES.accreditation.id,
  ];

  for (const precursor of input.precursors) {
    assertCanonicalUnit(precursor.quantityConsumed, "TNE", `${precursor.id}.quantityConsumed`);
    const quantity = decimal(precursor.quantityConsumed.canonicalValue);
    requireNonNegative(quantity, `${precursor.id}.quantityConsumed`);
    let specificValue;
    if (precursor.determinationMethod === "ACTUAL") {
      if (!precursor.actualSpecificEmbeddedEmissions) {
        throw new MrvValidationError(
          "ACTUAL_PRECURSOR_VALUE_MISSING",
          `${precursor.id} is marked actual but has no actual specific embedded emissions`,
        );
      }
      assertCanonicalUnit(
        precursor.actualSpecificEmbeddedEmissions,
        "TCO2E_PER_TNE",
        `${precursor.id}.actualSpecificEmbeddedEmissions`,
      );
      specificValue = decimal(precursor.actualSpecificEmbeddedEmissions.canonicalValue);
      const verification = evaluateActualValueVerification(
        precursor.verificationReference,
        precursor.precursorCategory,
        input.reportingPeriod,
      );
      if (!verification.verified) {
        warnings.push({
          code: `ACTUAL_VALUE_NOT_VERIFIED:${precursor.id}`,
          severity: "BLOCKER",
          message: verification.blockers.join("; "),
        });
      } else if (precursor.verificationReference) {
        evidenceReferences.push(...precursor.verificationReference.evidenceReferences);
      }
      exactInputs.push(
        measuredInput(`${precursor.id}.actualSpecificEmbeddedEmissions`, precursor.actualSpecificEmbeddedEmissions),
      );
    } else {
      const unmarked = precursor.unmarkedDefaultSpecificEmbeddedEmissions;
      const publishedMarked = precursor.publishedMarkedDefaultSpecificEmbeddedEmissions;
      if ((!unmarked && !publishedMarked) || (unmarked && publishedMarked)) {
        throw new MrvValidationError(
          "DEFAULT_PRECURSOR_VALUE_AMBIGUOUS",
          `${precursor.id} must provide exactly one of an unmarked default base or an already-marked published default value`,
        );
      }
      if (unmarked) {
        assertCanonicalUnit(unmarked, "TCO2E_PER_TNE", `${precursor.id}.unmarkedDefaultSpecificEmbeddedEmissions`);
        const markup = defaultMarkupForDate(input.reportingDate);
        specificValue = decimal(unmarked.canonicalValue).times(decimal("1").plus(markup.markupFraction));
        exactInputs.push(
          measuredInput(`${precursor.id}.unmarkedDefaultSpecificEmbeddedEmissions`, unmarked),
          {
            name: `${precursor.id}.defaultMarkup`,
            value: markup.markupFraction,
            unit: "FRACTION",
            sourceReference: REGULATORY_SOURCES.defaults.id,
          },
        );
      } else {
        assertCanonicalUnit(
          publishedMarked!,
          "TCO2E_PER_TNE",
          `${precursor.id}.publishedMarkedDefaultSpecificEmbeddedEmissions`,
        );
        specificValue = decimal(publishedMarked!.canonicalValue);
        exactInputs.push(
          measuredInput(`${precursor.id}.publishedMarkedDefaultSpecificEmbeddedEmissions`, publishedMarked!),
          {
            name: `${precursor.id}.defaultMarkupAlreadyIncluded`,
            value: "1",
            unit: "FRACTION",
            sourceReference: REGULATORY_SOURCES.defaults.id,
          },
        );
      }
    }
    requireNonNegative(specificValue, `${precursor.id}.specificEmbeddedEmissions`);
    embeddedEmissions = embeddedEmissions.plus(quantity.times(specificValue));
    exactInputs.push(measuredInput(`${precursor.id}.quantityConsumed`, precursor.quantityConsumed));
    evidenceReferences.push(...precursor.evidenceReferences);
  }

  return result(
    input.traceId,
    "PRECURSOR_MIX",
    "precursorSEE = Σ(quantityConsumed_i × (actualSEE_i OR unmarkedDefaultSEE_i × (1 + effectiveMarkup) OR publishedMarkedDefaultSEE_i)) / goodsProduction; actual and default methods may be mixed by precursor and published marked values are never marked up again",
    exactInputs,
    decimalToString(embeddedEmissions.dividedBy(production)),
    "TCO2E_PER_TNE",
    { evidenceReferences, warnings },
  );
}

interface PfcCommonInput {
  traceId: string;
  primaryAluminiumProduction: MeasuredValue;
  c2f6ToCf4WeightFraction: MeasuredValue;
  collectionEfficiency: MeasuredValue;
  evidenceReferences?: readonly string[];
}

function pfcResult(
  input: PfcCommonInput,
  method: "ALUMINIUM_PFC_SLOPE" | "ALUMINIUM_PFC_OVERVOLTAGE",
  formula: string,
  methodInputs: readonly CalculationTraceInput[],
  ductCf4Tonnes: ReturnType<typeof decimal>,
): { cf4Tonnes: string; c2f6Tonnes: string; co2e: TracedCalculation } {
  const c2f6Ratio = pfcMassRatio(input.c2f6ToCf4WeightFraction, "c2f6ToCf4WeightFraction");
  const collectionEfficiency = fraction(input.collectionEfficiency, "collectionEfficiency");
  requirePositive(collectionEfficiency, "collectionEfficiency");
  const totalCf4 = ductCf4Tonnes.dividedBy(collectionEfficiency);
  const totalC2f6 = ductCf4Tonnes.times(c2f6Ratio).dividedBy(collectionEfficiency);
  const co2e = totalCf4.times(GWP_CF4).plus(totalC2f6.times(GWP_C2F6));
  const exactInputs = [
    ...methodInputs,
    measuredInput("c2f6ToCf4WeightFraction", input.c2f6ToCf4WeightFraction),
    measuredInput("collectionEfficiency", input.collectionEfficiency),
    { name: "GWP_CF4", value: "6630", unit: "FRACTION" as const, sourceReference: REGULATORY_SOURCES.monitoring.id },
    { name: "GWP_C2F6", value: "11100", unit: "FRACTION" as const, sourceReference: REGULATORY_SOURCES.monitoring.id },
  ];
  return {
    cf4Tonnes: decimalToString(totalCf4),
    c2f6Tonnes: decimalToString(totalC2f6),
    co2e: result(
      input.traceId,
      method,
      `${formula}; total gas = duct gas / collectionEfficiency; PFC_CO2e = CF4_t × 6630 + C2F6_t × 11100`,
      exactInputs,
      decimalToString(co2e),
      "TCO2E",
      { evidenceReferences: [REGULATORY_SOURCES.monitoring.id, ...(input.evidenceReferences ?? [])] },
    ),
  };
}

export function calculateAluminiumPfcSlopeEmissions(
  input: PfcCommonInput & {
    anodeEffectMinutesPerCellDay: MeasuredValue;
    cf4SlopeEmissionFactor: MeasuredValue;
  },
): { cf4Tonnes: string; c2f6Tonnes: string; co2e: TracedCalculation } {
  assertCanonicalUnit(input.primaryAluminiumProduction, "TNE", "primaryAluminiumProduction");
  assertCanonicalUnit(input.anodeEffectMinutesPerCellDay, "AEM_MIN_PER_CELL_DAY", "anodeEffectMinutesPerCellDay");
  assertCanonicalUnit(
    input.cf4SlopeEmissionFactor,
    "KGM_CF4_PER_TNE_AL_PER_AEM",
    "cf4SlopeEmissionFactor",
  );
  const production = decimal(input.primaryAluminiumProduction.canonicalValue);
  const aem = decimal(input.anodeEffectMinutesPerCellDay.canonicalValue);
  const slope = decimal(input.cf4SlopeEmissionFactor.canonicalValue);
  requireNonNegative(production, "primaryAluminiumProduction");
  requireNonNegative(aem, "anodeEffectMinutesPerCellDay");
  requireNonNegative(slope, "cf4SlopeEmissionFactor");
  const ductCf4 = aem.times(slope).times(production).times(KG_TO_TONNE);
  return pfcResult(
    input,
    "ALUMINIUM_PFC_SLOPE",
    "CF4_duct[t] = AEM × SEF_CF4[kg/t Al/AEM] × primaryAluminiumProduction[t] / 1000; C2F6_duct[t] = CF4_duct × weightFraction",
    [
      measuredInput("primaryAluminiumProduction", input.primaryAluminiumProduction),
      measuredInput("anodeEffectMinutesPerCellDay", input.anodeEffectMinutesPerCellDay),
      measuredInput("cf4SlopeEmissionFactor", input.cf4SlopeEmissionFactor),
    ],
    ductCf4,
  );
}

export function calculateAluminiumPfcOvervoltageEmissions(
  input: PfcCommonInput & {
    anodeEffectOvervoltage: MeasuredValue;
    currentEfficiency: MeasuredValue;
    cf4OvervoltageCoefficient: MeasuredValue;
  },
): { cf4Tonnes: string; c2f6Tonnes: string; co2e: TracedCalculation } {
  assertCanonicalUnit(input.primaryAluminiumProduction, "TNE", "primaryAluminiumProduction");
  assertCanonicalUnit(input.anodeEffectOvervoltage, "MILLIVOLT", "anodeEffectOvervoltage");
  assertCanonicalUnit(
    input.cf4OvervoltageCoefficient,
    "KGM_CF4_PER_TNE_AL_PER_MILLIVOLT",
    "cf4OvervoltageCoefficient",
  );
  const production = decimal(input.primaryAluminiumProduction.canonicalValue);
  const overvoltage = decimal(input.anodeEffectOvervoltage.canonicalValue);
  const efficiency = fraction(input.currentEfficiency, "currentEfficiency");
  const coefficient = decimal(input.cf4OvervoltageCoefficient.canonicalValue);
  requireNonNegative(production, "primaryAluminiumProduction");
  requireNonNegative(overvoltage, "anodeEffectOvervoltage");
  requirePositive(efficiency, "currentEfficiency");
  requireNonNegative(coefficient, "cf4OvervoltageCoefficient");
  const ductCf4 = coefficient.times(overvoltage.dividedBy(efficiency)).times(production).times(KG_TO_TONNE);
  return pfcResult(
    input,
    "ALUMINIUM_PFC_OVERVOLTAGE",
    "CF4_duct[t] = OVC[kg/t Al/mV] × (anodeEffectOvervoltage[mV] / currentEfficiencyFraction) × primaryAluminiumProduction[t] × 0.001; C2F6_duct[t] = CF4_duct × weightFraction",
    [
      measuredInput("primaryAluminiumProduction", input.primaryAluminiumProduction),
      measuredInput("anodeEffectOvervoltage", input.anodeEffectOvervoltage),
      measuredInput("currentEfficiency", input.currentEfficiency),
      measuredInput("cf4OvervoltageCoefficient", input.cf4OvervoltageCoefficient),
    ],
    ductCf4,
  );
}

export function applyDirectIndirectTreatment(input: {
  traceId: string;
  product: RegulatoryProduct;
  directEmissions: MeasuredValue;
  indirectEmissions: MeasuredValue;
  evidenceReferences?: readonly string[];
}): TracedCalculation {
  if (input.directEmissions.canonicalUnit !== input.indirectEmissions.canonicalUnit) {
    throw new MrvValidationError("UNIT_MISMATCH", "Direct and indirect emissions must use the same canonical unit");
  }
  if (input.directEmissions.canonicalUnit !== "TCO2E" && input.directEmissions.canonicalUnit !== "TCO2E_PER_TNE") {
    throw new MrvValidationError("UNIT_MISMATCH", "Emissions treatment requires TCO2E or TCO2E_PER_TNE");
  }
  const direct = decimal(input.directEmissions.canonicalValue);
  const indirect = decimal(input.indirectEmissions.canonicalValue);
  requireNonNegative(direct, "directEmissions");
  requireNonNegative(indirect, "indirectEmissions");
  const excluded = input.product.indirectEmissionsTreatment === "EXCLUDED_FROM_EMBEDDED_EMISSIONS_ANNEX_II";
  const treated = excluded ? direct : direct.plus(indirect);
  return result(
    input.traceId,
    "DIRECT_INDIRECT_TREATMENT",
    excluded
      ? "embeddedEmissions = directEmissions (indirect emissions excluded under Annex II)"
      : "embeddedEmissions = directEmissions + indirectEmissions",
    [
      measuredInput("directEmissions", input.directEmissions),
      measuredInput("indirectEmissions", input.indirectEmissions),
    ],
    decimalToString(treated),
    input.directEmissions.canonicalUnit,
    {
      evidenceReferences: [REGULATORY_SOURCES.cbam.id, ...(input.evidenceReferences ?? [])],
      warnings: excluded
        ? [
            {
              code: "INDIRECT_EMISSIONS_EXCLUDED_ANNEX_II",
              severity: "INFO",
              message: "Indirect emissions are retained in the trace but excluded from this product's embedded-emissions result",
            },
          ]
        : [],
    },
  );
}

export function combineComplexGoodsSpecificEmissions(input: {
  traceId: string;
  ownProcessSpecificEmissions: MeasuredValue;
  precursorSpecificEmissions: MeasuredValue;
  evidenceReferences?: readonly string[];
}): TracedCalculation {
  assertCanonicalUnit(input.ownProcessSpecificEmissions, "TCO2E_PER_TNE", "ownProcessSpecificEmissions");
  assertCanonicalUnit(input.precursorSpecificEmissions, "TCO2E_PER_TNE", "precursorSpecificEmissions");
  const own = decimal(input.ownProcessSpecificEmissions.canonicalValue);
  const precursor = decimal(input.precursorSpecificEmissions.canonicalValue);
  requireNonNegative(own, "ownProcessSpecificEmissions");
  requireNonNegative(precursor, "precursorSpecificEmissions");
  return result(
    input.traceId,
    "COMPLEX_GOODS",
    "specificEmbeddedEmissions_complexGood = ownProcessSpecificEmissions + precursorSpecificEmissions",
    [
      measuredInput("ownProcessSpecificEmissions", input.ownProcessSpecificEmissions),
      measuredInput("precursorSpecificEmissions", input.precursorSpecificEmissions),
    ],
    decimalToString(own.plus(precursor)),
    "TCO2E_PER_TNE",
    { evidenceReferences: [REGULATORY_SOURCES.monitoring.id, ...(input.evidenceReferences ?? [])] },
  );
}

export interface FreeAllocationAdjustmentCalculation {
  freeAllocationAdjustment: {
    value: string;
    unit: "TCO2E_PER_TNE";
  };
  adjustedChargeableEmissions: {
    value: string;
    unit: "TCO2E_PER_TNE";
  };
  trace: CalculationTrace;
}

/**
 * Applies Regulation (EU) 2025/2620 to a caller-supplied product/route result.
 *
 * This primitive intentionally contains no benchmark or annual-factor fallback.
 * `specificFreeAllocationBeforeCbamFactor` must be the applicable product and
 * production-route result before the effective CBAM factor (including any
 * correction already required to form that input). Complete benchmark and
 * factor provenance remain the caller's responsibility.
 */
export function calculateFreeAllocationAdjustment(input: {
  traceId: string;
  specificEmbeddedEmissions: MeasuredValue;
  specificFreeAllocationBeforeCbamFactor: MeasuredValue;
  effectiveCbamFactor: MeasuredValue;
  benchmarkEvidenceReference: string;
  factorEvidenceReference: string;
  evidenceReferences?: readonly string[];
}): FreeAllocationAdjustmentCalculation {
  if (!input.specificEmbeddedEmissions || !input.specificFreeAllocationBeforeCbamFactor || !input.effectiveCbamFactor) {
    throw new MrvValidationError(
      "FREE_ALLOCATION_INPUT_MISSING",
      "Embedded emissions, the product/route benchmark result, and the effective CBAM factor are all required",
    );
  }
  if (!input.benchmarkEvidenceReference?.trim() || !input.factorEvidenceReference?.trim()) {
    throw new MrvValidationError(
      "FREE_ALLOCATION_PROVENANCE_MISSING",
      "Benchmark and effective-factor evidence references are required; fallback data is prohibited",
    );
  }
  assertCanonicalUnit(input.specificEmbeddedEmissions, "TCO2E_PER_TNE", "specificEmbeddedEmissions");
  assertCanonicalUnit(
    input.specificFreeAllocationBeforeCbamFactor,
    "TCO2E_PER_TNE",
    "specificFreeAllocationBeforeCbamFactor",
  );
  const embedded = decimal(input.specificEmbeddedEmissions.canonicalValue);
  const benchmarkResult = decimal(input.specificFreeAllocationBeforeCbamFactor.canonicalValue);
  const effectiveFactor = fraction(input.effectiveCbamFactor, "effectiveCbamFactor");
  requireNonNegative(embedded, "specificEmbeddedEmissions");
  requireNonNegative(benchmarkResult, "specificFreeAllocationBeforeCbamFactor");

  const adjustment = benchmarkResult.times(effectiveFactor);
  const chargeable = embedded.minus(adjustment);
  if (chargeable.isNegative()) {
    throw new MrvValidationError(
      "FREE_ALLOCATION_EXCEEDS_EMBEDDED_EMISSIONS",
      "The supplied free-allocation adjustment exceeds embedded emissions; review the product/route benchmark and factor",
    );
  }

  const traced = result(
    input.traceId,
    "FREE_ALLOCATION_ADJUSTMENT",
    "specificFreeAllocationAdjustment = specificFreeAllocationBeforeCbamFactor × effectiveCbamFactor; adjustedChargeableSpecificEmissions = specificEmbeddedEmissions − specificFreeAllocationAdjustment",
    [
      measuredInput("specificEmbeddedEmissions", input.specificEmbeddedEmissions),
      measuredInput(
        "specificFreeAllocationBeforeCbamFactor",
        input.specificFreeAllocationBeforeCbamFactor,
        input.benchmarkEvidenceReference,
      ),
      measuredInput("effectiveCbamFactor", input.effectiveCbamFactor, input.factorEvidenceReference),
    ],
    decimalToString(chargeable),
    "TCO2E_PER_TNE",
    {
      evidenceReferences: [REGULATORY_SOURCES.freeAllocation.id, ...(input.evidenceReferences ?? [])],
      warnings: [
        {
          code: "PRODUCT_ROUTE_BENCHMARK_PROVENANCE_REQUIRED",
          severity: "INFO",
          message:
            "This result is valid only for the cited complete product/production-route benchmark and effective annual factor; no fallback benchmark or factor was applied",
        },
      ],
    },
  );

  return {
    freeAllocationAdjustment: {
      value: decimalToString(adjustment),
      unit: "TCO2E_PER_TNE",
    },
    adjustedChargeableEmissions: {
      value: traced.value,
      unit: "TCO2E_PER_TNE",
    },
    trace: traced.trace,
  };
}
