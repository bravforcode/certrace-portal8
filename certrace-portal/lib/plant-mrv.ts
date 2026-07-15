import { z } from "zod";

import {
  allocateChpEmissions,
  allocateWasteGasEmissions,
  calculateAluminiumPfcOvervoltageEmissions,
  calculateAluminiumPfcSlopeEmissions,
  calculateCemsEmissions,
  calculateElectricityEmissions,
  calculateMassBalanceEmissions,
  calculateMeasurableHeatEmissions,
  calculateProductionAllocation,
  calculateStandardSourceStreamEmissions,
} from "./mrv/calculations";
import {
  decimal,
  decimalStringSchema,
  decimalToString,
  MrvValidationError,
  requirePositive,
} from "./mrv/decimal";
import { measuredValue, MEASUREMENT_SPECS, REGULATORY_DATA_VERSION } from "./mrv/measurements";
import type {
  CalculationTrace,
  EmissionSource,
  EnergyFlow,
  MeasuredValue,
  SourceStream,
  TracedCalculation,
  UnitCode,
} from "./mrv/types";

export const PLANT_MRV_SCHEMA_VERSION = "plant-mrv-2026.1" as const;

export const PLANT_MRV_DIRECT_METHODS = ["STANDARD_CALCULATION", "MASS_BALANCE", "CEMS"] as const;
export type PlantMrvDirectMethod = (typeof PLANT_MRV_DIRECT_METHODS)[number];

const idSchema = z.string().trim().min(1).max(200);
const nameSchema = z.string().trim().min(1).max(500);
const evidenceReferencesSchema = z.array(z.string().trim().min(1).max(500)).max(100);
const draftDecimalStringSchema = z.union([z.literal(""), decimalStringSchema]);

const fractionInputSchema = z
  .object({ value: draftDecimalStringSchema, unit: z.enum(["FRACTION", "PERCENT"]) })
  .strict();
const massInputSchema = z.object({ value: draftDecimalStringSchema, unit: z.enum(["TNE", "KGM"]) }).strict();
const emissionsInputSchema = z
  .object({ value: draftDecimalStringSchema, unit: z.enum(["TCO2E", "KGCO2E"]) })
  .strict();
const standardActivityInputSchema = z
  .object({ value: draftDecimalStringSchema, unit: z.enum(["TNE", "KGM", "GJ", "MJ", "TJ", "NM3"]) })
  .strict();
const standardEmissionFactorInputSchema = z
  .object({
    value: draftDecimalStringSchema,
    unit: z.enum([
      "TCO2E_PER_TNE",
      "KGCO2E_PER_TNE",
      "TCO2E_PER_GJ",
      "KGCO2E_PER_GJ",
      "TCO2E_PER_TJ",
      "TCO2E_PER_NM3",
      "KGCO2E_PER_NM3",
    ]),
  })
  .strict();
const normalVolumeInputSchema = z.object({ value: draftDecimalStringSchema, unit: z.literal("NM3") }).strict();
const volumeFactorInputSchema = z
  .object({ value: draftDecimalStringSchema, unit: z.enum(["TCO2E_PER_NM3", "KGCO2E_PER_NM3"]) })
  .strict();
const electricityInputSchema = z
  .object({ value: draftDecimalStringSchema, unit: z.enum(["MWH", "KWH"]) })
  .strict();
const electricityFactorInputSchema = z
  .object({ value: draftDecimalStringSchema, unit: z.enum(["TCO2E_PER_MWH", "KGCO2E_PER_KWH"]) })
  .strict();
const heatInputSchema = z
  .object({ value: draftDecimalStringSchema, unit: z.enum(["GJ", "MJ", "TJ"]) })
  .strict();
const heatFactorInputSchema = z
  .object({ value: draftDecimalStringSchema, unit: z.enum(["TCO2E_PER_GJ", "KGCO2E_PER_GJ", "TCO2E_PER_TJ"]) })
  .strict();

const commonRowSchema = {
  id: idSchema,
  name: nameSchema,
  evidenceReferences: evidenceReferencesSchema,
};

export const standardCalculationSourceStreamSchema = z
  .object({
    ...commonRowSchema,
    materialOrFuel: z.string().trim().min(1).max(500),
    activityData: standardActivityInputSchema,
    emissionFactor: standardEmissionFactorInputSchema,
    oxidationFactor: fractionInputSchema.optional(),
    conversionFactor: fractionInputSchema.optional(),
  })
  .strict();
export type StandardCalculationSourceStreamRow = z.infer<typeof standardCalculationSourceStreamSchema>;

export const massBalanceEntrySchema = z
  .object({
    id: idSchema,
    name: nameSchema,
    direction: z.enum(["INPUT", "OUTPUT"]),
    quantity: massInputSchema,
    carbonContent: fractionInputSchema,
    evidenceReference: z.string().trim().min(1).max(500).optional(),
  })
  .strict();
export type PlantMassBalanceEntryRow = z.infer<typeof massBalanceEntrySchema>;

export const massBalanceSchema = z
  .object({
    ...commonRowSchema,
    entries: z.array(massBalanceEntrySchema).max(500),
  })
  .strict();
export type PlantMassBalanceRow = z.infer<typeof massBalanceSchema>;

export const cemsSourceSchema = z
  .object({
    ...commonRowSchema,
    measurementPoint: z.string().trim().min(1).max(500),
    uncertaintyPercent: draftDecimalStringSchema.optional(),
    averageConcentration: volumeFactorInputSchema,
    monitoredStackGasVolume: normalVolumeInputSchema,
  })
  .strict();
export type PlantCemsSourceRow = z.infer<typeof cemsSourceSchema>;

export const plantElectricityInputSchema = z
  .object({
    ...commonRowSchema,
    quantity: electricityInputSchema,
    emissionFactor: electricityFactorInputSchema,
  })
  .strict();
export type PlantElectricityInputRow = z.infer<typeof plantElectricityInputSchema>;

export const measurableHeatInputSchema = z
  .object({
    ...commonRowSchema,
    netMeasurableHeat: heatInputSchema,
    emissionFactor: heatFactorInputSchema,
  })
  .strict();
export type PlantMeasurableHeatInputRow = z.infer<typeof measurableHeatInputSchema>;

export const chpInputSchema = z
  .object({
    ...commonRowSchema,
    totalChpEmissions: emissionsInputSchema,
    usefulHeat: heatInputSchema,
    electricityOutput: electricityInputSchema,
    referenceHeatEfficiency: fractionInputSchema,
    referenceElectricEfficiency: fractionInputSchema,
    allocationTarget: z.enum(["BOTH", "HEAT_ONLY", "ELECTRICITY_ONLY"]),
  })
  .strict();
export type PlantChpInputRow = z.infer<typeof chpInputSchema>;

export const wasteGasAllocationSchema = z
  .object({
    ...commonRowSchema,
    attributableWasteGasEmissions: emissionsInputSchema,
    targetUsefulEnergy: heatInputSchema,
    totalUsefulEnergy: heatInputSchema,
    sourceInstallationId: idSchema.optional(),
    destinationInstallationId: idSchema.optional(),
  })
  .strict();
export type PlantWasteGasAllocationRow = z.infer<typeof wasteGasAllocationSchema>;

const primaryAluminiumProductionSchema = massInputSchema;
const pfcMassRatioSchema = z
  .object({ value: draftDecimalStringSchema, unit: z.literal("TNE_C2F6_PER_TNE_CF4") })
  .strict();
const anodeEffectActivitySchema = z
  .object({ value: draftDecimalStringSchema, unit: z.literal("AEM_MIN_PER_CELL_DAY") })
  .strict();
const pfcSlopeFactorSchema = z
  .object({ value: draftDecimalStringSchema, unit: z.literal("KGM_CF4_PER_TNE_AL_PER_AEM") })
  .strict();
const overvoltageSchema = z
  .object({ value: draftDecimalStringSchema, unit: z.literal("MILLIVOLT") })
  .strict();
const pfcOvervoltageFactorSchema = z
  .object({ value: draftDecimalStringSchema, unit: z.literal("KGM_CF4_PER_TNE_AL_PER_MILLIVOLT") })
  .strict();

export const aluminiumPfcSlopeInputSchema = z
  .object({
    ...commonRowSchema,
    measurementPoint: z.string().trim().min(1).max(500),
    primaryAluminiumProduction: primaryAluminiumProductionSchema,
    anodeEffectMinutesPerCellDay: anodeEffectActivitySchema,
    cf4SlopeEmissionFactor: pfcSlopeFactorSchema,
    c2f6ToCf4WeightFraction: pfcMassRatioSchema,
    collectionEfficiency: fractionInputSchema,
  })
  .strict();
export type PlantAluminiumPfcSlopeInputRow = z.infer<typeof aluminiumPfcSlopeInputSchema>;

export const aluminiumPfcOvervoltageInputSchema = z
  .object({
    ...commonRowSchema,
    measurementPoint: z.string().trim().min(1).max(500),
    primaryAluminiumProduction: primaryAluminiumProductionSchema,
    anodeEffectOvervoltage: overvoltageSchema,
    currentEfficiency: fractionInputSchema,
    cf4OvervoltageCoefficient: pfcOvervoltageFactorSchema,
    c2f6ToCf4WeightFraction: pfcMassRatioSchema,
    collectionEfficiency: fractionInputSchema,
  })
  .strict();
export type PlantAluminiumPfcOvervoltageInputRow = z.infer<typeof aluminiumPfcOvervoltageInputSchema>;

export const plantMrvPayloadSchema = z
  .object({
    schemaVersion: z.literal(PLANT_MRV_SCHEMA_VERSION),
    regulatoryDataVersion: z.literal(REGULATORY_DATA_VERSION),
    directMethod: z.enum(PLANT_MRV_DIRECT_METHODS),
    standardCalculationSourceStreams: z.array(standardCalculationSourceStreamSchema).max(500),
    massBalances: z.array(massBalanceSchema).max(500),
    cemsSources: z.array(cemsSourceSchema).max(500),
    electricityInputs: z.array(plantElectricityInputSchema).max(500),
    measurableHeatInputs: z.array(measurableHeatInputSchema).max(500),
    chpInputs: z.array(chpInputSchema).max(500),
    wasteGasAllocations: z.array(wasteGasAllocationSchema).max(500),
    aluminiumPfcSlopeInputs: z.array(aluminiumPfcSlopeInputSchema).max(500).optional(),
    aluminiumPfcOvervoltageInputs: z.array(aluminiumPfcOvervoltageInputSchema).max(500).optional(),
  })
  .strict();
export type PlantMrvPayload = z.infer<typeof plantMrvPayloadSchema>;

export interface PlantMrvContext {
  productId: string;
  installationId: string;
  processId: string;
}

export interface PlantMrvCalculationError {
  code: string;
  path: string;
  message: string;
}

export interface PlantMrvSpecificEmissions {
  value: string;
  unit: "TCO2E_PER_TNE";
}

export interface PlantMrvCalculationSuccess {
  ok: true;
  productId: string;
  installationId: string;
  processId: string;
  directSpecificEmissions: PlantMrvSpecificEmissions;
  indirectSpecificEmissions: PlantMrvSpecificEmissions;
  traces: CalculationTrace[];
  sourceStreams: SourceStream[];
  emissionSources: EmissionSource[];
  energyFlows: EnergyFlow[];
  errors: [];
}

export interface PlantMrvCalculationFailure {
  ok: false;
  productId: string;
  installationId: string;
  processId: string;
  directSpecificEmissions: null;
  indirectSpecificEmissions: null;
  traces: [];
  sourceStreams: [];
  emissionSources: [];
  energyFlows: [];
  errors: PlantMrvCalculationError[];
}

export type PlantMrvCalculationResult = PlantMrvCalculationSuccess | PlantMrvCalculationFailure;

const contextSchema = z
  .object({ productId: idSchema, installationId: idSchema, processId: idSchema })
  .strict();

const defaultStandardRow = (): StandardCalculationSourceStreamRow => ({
  id: "standard-calculation-1",
  name: "Source stream 1",
  materialOrFuel: "Material or fuel",
  activityData: { value: "", unit: "TNE" },
  emissionFactor: { value: "", unit: "TCO2E_PER_TNE" },
  evidenceReferences: [],
});

const defaultMassBalanceRow = (): PlantMassBalanceRow => ({
  id: "mass-balance-1",
  name: "Mass balance 1",
  entries: [
    {
      id: "mass-balance-entry-1",
      name: "Carbon input 1",
      direction: "INPUT",
      quantity: { value: "", unit: "TNE" },
      carbonContent: { value: "", unit: "FRACTION" },
    },
  ],
  evidenceReferences: [],
});

const defaultCemsRow = (): PlantCemsSourceRow => ({
  id: "cems-source-1",
  name: "CEMS source 1",
  measurementPoint: "Measurement point 1",
  averageConcentration: { value: "", unit: "TCO2E_PER_NM3" },
  monitoredStackGasVolume: { value: "", unit: "NM3" },
  evidenceReferences: [],
});

export function createEmptyPlantMrvPayload(
  directMethod: PlantMrvDirectMethod = "STANDARD_CALCULATION",
): PlantMrvPayload {
  return {
    schemaVersion: PLANT_MRV_SCHEMA_VERSION,
    regulatoryDataVersion: REGULATORY_DATA_VERSION,
    directMethod,
    standardCalculationSourceStreams: [],
    massBalances: [],
    cemsSources: [],
    electricityInputs: [],
    measurableHeatInputs: [],
    chpInputs: [],
    wasteGasAllocations: [],
    aluminiumPfcSlopeInputs: [],
    aluminiumPfcOvervoltageInputs: [],
  };
}

export function createDefaultPlantMrvPayload(
  directMethod: PlantMrvDirectMethod = "STANDARD_CALCULATION",
): PlantMrvPayload {
  return changePlantMrvMethod(createEmptyPlantMrvPayload(directMethod), directMethod);
}

export function parsePlantMrvPayload(input: unknown): PlantMrvPayload {
  let candidate = input;
  if (typeof input === "string") {
    if (input.length > 5_000_000) {
      throw new MrvValidationError("PLANT_MRV_PAYLOAD_TOO_LARGE", "Plant MRV JSON exceeds the 5 MB input limit");
    }
    try {
      candidate = JSON.parse(input) as unknown;
    } catch {
      throw new MrvValidationError("INVALID_PLANT_MRV_JSON", "Plant MRV payload is not valid JSON");
    }
  }
  const parsed = plantMrvPayloadSchema.safeParse(candidate);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.length ? issue.path.map(String).join(".") : "payload";
    throw new MrvValidationError(
      "INVALID_PLANT_MRV_PAYLOAD",
      `${path}: ${issue?.message ?? "Plant MRV payload is invalid"}`,
    );
  }
  return parsed.data;
}

export function serializePlantMrvPayload(payload: PlantMrvPayload): string {
  return JSON.stringify(parsePlantMrvPayload(payload));
}

export function changePlantMrvMethod(
  payload: PlantMrvPayload,
  directMethod: PlantMrvDirectMethod,
): PlantMrvPayload {
  const parsed = parsePlantMrvPayload(payload);
  const changed: PlantMrvPayload = { ...parsed, directMethod };
  if (directMethod === "STANDARD_CALCULATION" && changed.standardCalculationSourceStreams.length === 0) {
    changed.standardCalculationSourceStreams = [defaultStandardRow()];
  } else if (directMethod === "MASS_BALANCE" && changed.massBalances.length === 0) {
    changed.massBalances = [defaultMassBalanceRow()];
  } else if (directMethod === "CEMS" && changed.cemsSources.length === 0) {
    changed.cemsSources = [defaultCemsRow()];
  }
  return changed;
}

function activityValue(input: StandardCalculationSourceStreamRow["activityData"]): MeasuredValue {
  if (input.unit === "TNE" || input.unit === "KGM") {
    return measuredValue(MEASUREMENT_SPECS.goodsMass, input.value, input.unit);
  }
  if (input.unit === "GJ" || input.unit === "MJ" || input.unit === "TJ") {
    return measuredValue(MEASUREMENT_SPECS.heatEnergy, input.value, input.unit);
  }
  return measuredValue(MEASUREMENT_SPECS.normalVolume, input.value, input.unit);
}

function standardFactorValue(input: StandardCalculationSourceStreamRow["emissionFactor"]): MeasuredValue {
  if (input.unit === "TCO2E_PER_TNE" || input.unit === "KGCO2E_PER_TNE") {
    return measuredValue(MEASUREMENT_SPECS.specificEmissions, input.value, input.unit);
  }
  if (input.unit === "TCO2E_PER_GJ" || input.unit === "KGCO2E_PER_GJ" || input.unit === "TCO2E_PER_TJ") {
    return measuredValue(MEASUREMENT_SPECS.heatEmissionFactor, input.value, input.unit);
  }
  return measuredValue(MEASUREMENT_SPECS.volumeEmissionFactor, input.value, input.unit);
}

function mv<T extends { value: string; unit: UnitCode }>(
  spec: (typeof MEASUREMENT_SPECS)[keyof typeof MEASUREMENT_SPECS],
  input: T,
): MeasuredValue {
  return measuredValue(spec, input.value, input.unit);
}

function errorFromUnknown(error: unknown, path: string): PlantMrvCalculationError {
  if (error instanceof MrvValidationError) {
    return { code: error.code, path, message: error.message };
  }
  return {
    code: "PLANT_MRV_CALCULATION_FAILED",
    path,
    message: error instanceof Error ? error.message : "Unknown plant MRV calculation error",
  };
}

function parseErrors(error: unknown): PlantMrvCalculationError[] {
  if (error instanceof MrvValidationError) {
    return [{ code: error.code, path: "payload", message: error.message }];
  }
  return [errorFromUnknown(error, "payload")];
}

function failure(context: Partial<PlantMrvContext>, errors: PlantMrvCalculationError[]): PlantMrvCalculationFailure {
  return {
    ok: false,
    productId: context.productId ?? "",
    installationId: context.installationId ?? "",
    processId: context.processId ?? "",
    directSpecificEmissions: null,
    indirectSpecificEmissions: null,
    traces: [],
    sourceStreams: [],
    emissionSources: [],
    energyFlows: [],
    errors,
  };
}

function findBlankMeasurementValues(
  value: unknown,
  path: string,
  errors: PlantMrvCalculationError[],
): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => findBlankMeasurementValues(entry, `${path}.${index}`, errors));
    return;
  }
  if (!value || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  if (record.value === "" && typeof record.unit === "string") {
    errors.push({
      code: "INCOMPLETE_MEASUREMENT",
      path: `${path}.value`,
      message: "A decimal value is required before this MRV input can be calculated",
    });
    return;
  }
  Object.entries(record).forEach(([key, entry]) =>
    findBlankMeasurementValues(entry, path ? `${path}.${key}` : key, errors),
  );
}

/**
 * Calculates a plant MRV draft from structured JSON-safe inputs.
 *
 * Only the array selected by `directMethod` contributes primary direct-source
 * emissions. Inactive direct arrays remain in the payload for method switching
 * but are never double-counted. Heat, CHP, waste-gas and PFC inputs supplement
 * direct emissions; electricity and the electricity share of CHP supplement
 * indirect emissions. Any invalid input fails the entire result closed.
 */
export function calculatePlantMrv(
  payloadInput: unknown,
  productionActivityTne: string,
  contextInput: PlantMrvContext,
): PlantMrvCalculationResult {
  let payload: PlantMrvPayload;
  let context: PlantMrvContext;
  try {
    payload = parsePlantMrvPayload(payloadInput);
    context = contextSchema.parse(contextInput);
    const production = measuredValue(MEASUREMENT_SPECS.goodsMass, productionActivityTne, "TNE");
    requirePositive(decimal(production.canonicalValue), "productionActivityTne");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure(contextInput, error.issues.map((issue) => ({
        code: "INVALID_PLANT_MRV_CONTEXT",
        path: issue.path.map(String).join("."),
        message: issue.message,
      })));
    }
    return failure(contextInput, parseErrors(error));
  }

  const errors: PlantMrvCalculationError[] = [];
  const traces: CalculationTrace[] = [];
  const sourceStreams: SourceStream[] = [];
  const emissionSources: EmissionSource[] = [];
  const energyFlows: EnergyFlow[] = [];
  let directTotal = decimal("0");
  let indirectTotal = decimal("0");

  const selectedDirectRows =
    payload.directMethod === "STANDARD_CALCULATION"
      ? payload.standardCalculationSourceStreams
      : payload.directMethod === "MASS_BALANCE"
        ? payload.massBalances
        : payload.cemsSources;
  findBlankMeasurementValues(selectedDirectRows, payload.directMethod === "STANDARD_CALCULATION"
    ? "standardCalculationSourceStreams"
    : payload.directMethod === "MASS_BALANCE"
      ? "massBalances"
      : "cemsSources", errors);
  findBlankMeasurementValues(payload.electricityInputs, "electricityInputs", errors);
  findBlankMeasurementValues(payload.measurableHeatInputs, "measurableHeatInputs", errors);
  findBlankMeasurementValues(payload.chpInputs, "chpInputs", errors);
  findBlankMeasurementValues(payload.wasteGasAllocations, "wasteGasAllocations", errors);
  findBlankMeasurementValues(payload.aluminiumPfcSlopeInputs ?? [], "aluminiumPfcSlopeInputs", errors);
  findBlankMeasurementValues(payload.aluminiumPfcOvervoltageInputs ?? [], "aluminiumPfcOvervoltageInputs", errors);
  if (errors.length > 0) return failure(context, errors);

  const add = (calculation: TracedCalculation, treatment: "DIRECT" | "INDIRECT") => {
    traces.push(calculation.trace);
    if (treatment === "DIRECT") directTotal = directTotal.plus(calculation.value);
    else indirectTotal = indirectTotal.plus(calculation.value);
  };
  const attempt = (path: string, calculate: () => void) => {
    try {
      calculate();
    } catch (error) {
      errors.push(errorFromUnknown(error, path));
    }
  };

  const tracePrefix = `plant:${context.productId}:${context.installationId}:${context.processId}`;
  if (payload.directMethod === "STANDARD_CALCULATION") {
    if (payload.standardCalculationSourceStreams.length === 0) {
      errors.push({
        code: "DIRECT_METHOD_INPUT_REQUIRED",
        path: "standardCalculationSourceStreams",
        message: "At least one standard-calculation source stream is required for the selected direct method",
      });
    }
    payload.standardCalculationSourceStreams.forEach((row, index) =>
      attempt(`standardCalculationSourceStreams.${index}`, () => {
        const activityData = activityValue(row.activityData);
        const calculation = calculateStandardSourceStreamEmissions({
          traceId: `${tracePrefix}:standard:${row.id}`,
          activityData,
          emissionFactor: standardFactorValue(row.emissionFactor),
          oxidationFactor: row.oxidationFactor ? mv(MEASUREMENT_SPECS.fraction, row.oxidationFactor) : undefined,
          conversionFactor: row.conversionFactor ? mv(MEASUREMENT_SPECS.fraction, row.conversionFactor) : undefined,
          evidenceReferences: row.evidenceReferences,
        });
        add(calculation, "DIRECT");
        sourceStreams.push({
          id: row.id,
          installationId: context.installationId,
          processId: context.processId,
          name: row.name,
          materialOrFuel: row.materialOrFuel,
          methodology: "STANDARD_CALCULATION",
          activityData,
          calculationFactorReferences: row.evidenceReferences,
          evidenceReferences: row.evidenceReferences,
          regulatoryDataVersion: payload.regulatoryDataVersion,
        });
      }),
    );
  } else if (payload.directMethod === "MASS_BALANCE") {
    if (payload.massBalances.length === 0) {
      errors.push({
        code: "DIRECT_METHOD_INPUT_REQUIRED",
        path: "massBalances",
        message: "At least one mass balance is required for the selected direct method",
      });
    }
    payload.massBalances.forEach((row, index) =>
      attempt(`massBalances.${index}`, () => {
        if (row.entries.length === 0) {
          throw new MrvValidationError("MASS_BALANCE_EMPTY", "A mass balance requires at least one entry");
        }
        const entries = row.entries.map((entry) => ({
          id: entry.id,
          direction: entry.direction,
          quantity: mv(MEASUREMENT_SPECS.goodsMass, entry.quantity),
          carbonContent: mv(MEASUREMENT_SPECS.fraction, entry.carbonContent),
          evidenceReference: entry.evidenceReference,
        }));
        const massBalanceCalculation = calculateMassBalanceEmissions(`${tracePrefix}:mass-balance:${row.id}`, entries);
        massBalanceCalculation.trace = {
          ...massBalanceCalculation.trace,
          evidenceReferences: [
            ...new Set([...massBalanceCalculation.trace.evidenceReferences, ...row.evidenceReferences]),
          ],
        };
        add(massBalanceCalculation, "DIRECT");
        entries.forEach((entry, entryIndex) => {
          const source = row.entries[entryIndex]!;
          sourceStreams.push({
            id: `${row.id}:${entry.id}`,
            installationId: context.installationId,
            processId: context.processId,
            name: `${row.name} — ${source.name}`,
            materialOrFuel: source.name,
            methodology: "MASS_BALANCE",
            activityData: entry.quantity,
            calculationFactorReferences: source.evidenceReference ? [source.evidenceReference] : [],
            evidenceReferences: [...row.evidenceReferences, ...(source.evidenceReference ? [source.evidenceReference] : [])],
            regulatoryDataVersion: payload.regulatoryDataVersion,
          });
        });
      }),
    );
  } else {
    if (payload.cemsSources.length === 0) {
      errors.push({
        code: "DIRECT_METHOD_INPUT_REQUIRED",
        path: "cemsSources",
        message: "At least one CEMS source is required for the selected direct method",
      });
    }
    payload.cemsSources.forEach((row, index) =>
      attempt(`cemsSources.${index}`, () => {
        if (row.uncertaintyPercent && row.uncertaintyPercent !== "") {
          measuredValue(MEASUREMENT_SPECS.fraction, row.uncertaintyPercent, "PERCENT");
        }
        add(
          calculateCemsEmissions({
            traceId: `${tracePrefix}:cems:${row.id}`,
            averageConcentration: mv(MEASUREMENT_SPECS.volumeEmissionFactor, row.averageConcentration),
            monitoredStackGasVolume: mv(MEASUREMENT_SPECS.normalVolume, row.monitoredStackGasVolume),
            evidenceReferences: row.evidenceReferences,
          }),
          "DIRECT",
        );
        emissionSources.push({
          id: row.id,
          installationId: context.installationId,
          processId: context.processId,
          name: row.name,
          methodology: "CEMS",
          greenhouseGases: ["CO2"],
          measurementPoint: row.measurementPoint,
          uncertaintyPercent: row.uncertaintyPercent,
          evidenceReferences: row.evidenceReferences,
          regulatoryDataVersion: payload.regulatoryDataVersion,
        });
      }),
    );
  }

  payload.electricityInputs.forEach((row, index) =>
    attempt(`electricityInputs.${index}`, () => {
      const quantity = mv(MEASUREMENT_SPECS.electricity, row.quantity);
      add(
        calculateElectricityEmissions({
          traceId: `${tracePrefix}:electricity:${row.id}`,
          electricity: quantity,
          emissionFactor: mv(MEASUREMENT_SPECS.electricityEmissionFactor, row.emissionFactor),
          evidenceReferences: row.evidenceReferences,
        }),
        "INDIRECT",
      );
      energyFlows.push({
        id: row.id,
        installationId: context.installationId,
        processId: context.processId,
        kind: "ELECTRICITY_IMPORTED",
        quantity,
        evidenceReferences: row.evidenceReferences,
        regulatoryDataVersion: payload.regulatoryDataVersion,
      });
    }),
  );

  payload.measurableHeatInputs.forEach((row, index) =>
    attempt(`measurableHeatInputs.${index}`, () => {
      const quantity = mv(MEASUREMENT_SPECS.heatEnergy, row.netMeasurableHeat);
      add(
        calculateMeasurableHeatEmissions({
          traceId: `${tracePrefix}:heat:${row.id}`,
          netMeasurableHeat: quantity,
          emissionFactor: mv(MEASUREMENT_SPECS.heatEmissionFactor, row.emissionFactor),
          evidenceReferences: row.evidenceReferences,
        }),
        "DIRECT",
      );
      energyFlows.push({
        id: row.id,
        installationId: context.installationId,
        processId: context.processId,
        kind: "MEASURABLE_HEAT_IMPORTED",
        quantity,
        evidenceReferences: row.evidenceReferences,
        regulatoryDataVersion: payload.regulatoryDataVersion,
      });
    }),
  );

  payload.chpInputs.forEach((row, index) =>
    attempt(`chpInputs.${index}`, () => {
      const usefulHeat = mv(MEASUREMENT_SPECS.heatEnergy, row.usefulHeat);
      const electricityOutput = mv(MEASUREMENT_SPECS.electricity, row.electricityOutput);
      const allocated = allocateChpEmissions({
        traceId: `${tracePrefix}:chp:${row.id}`,
        totalChpEmissions: mv(MEASUREMENT_SPECS.emissions, row.totalChpEmissions),
        usefulHeat,
        electricityOutput,
        referenceHeatEfficiency: mv(MEASUREMENT_SPECS.fraction, row.referenceHeatEfficiency),
        referenceElectricEfficiency: mv(MEASUREMENT_SPECS.fraction, row.referenceElectricEfficiency),
        evidenceReferences: row.evidenceReferences,
      });
      if (row.allocationTarget !== "ELECTRICITY_ONLY") {
        add(allocated.heat, "DIRECT");
        energyFlows.push({
          id: `${row.id}:heat`,
          installationId: context.installationId,
          processId: context.processId,
          kind: "CHP_HEAT",
          quantity: usefulHeat,
          evidenceReferences: row.evidenceReferences,
          regulatoryDataVersion: payload.regulatoryDataVersion,
        });
      }
      if (row.allocationTarget !== "HEAT_ONLY") {
        add(allocated.electricity, "INDIRECT");
        energyFlows.push({
          id: `${row.id}:electricity`,
          installationId: context.installationId,
          processId: context.processId,
          kind: "CHP_ELECTRICITY",
          quantity: electricityOutput,
          evidenceReferences: row.evidenceReferences,
          regulatoryDataVersion: payload.regulatoryDataVersion,
        });
      }
    }),
  );

  payload.wasteGasAllocations.forEach((row, index) =>
    attempt(`wasteGasAllocations.${index}`, () => {
      const targetUsefulEnergy = mv(MEASUREMENT_SPECS.heatEnergy, row.targetUsefulEnergy);
      add(
        allocateWasteGasEmissions({
          traceId: `${tracePrefix}:waste-gas:${row.id}`,
          attributableWasteGasEmissions: mv(MEASUREMENT_SPECS.emissions, row.attributableWasteGasEmissions),
          targetUsefulEnergy,
          totalUsefulEnergy: mv(MEASUREMENT_SPECS.heatEnergy, row.totalUsefulEnergy),
          evidenceReferences: row.evidenceReferences,
        }),
        "DIRECT",
      );
      energyFlows.push({
        id: row.id,
        installationId: context.installationId,
        processId: context.processId,
        kind: "WASTE_GAS_TRANSFER",
        quantity: targetUsefulEnergy,
        sourceInstallationId: row.sourceInstallationId,
        destinationInstallationId: row.destinationInstallationId,
        evidenceReferences: row.evidenceReferences,
        regulatoryDataVersion: payload.regulatoryDataVersion,
      });
    }),
  );

  (payload.aluminiumPfcSlopeInputs ?? []).forEach((row, index) =>
    attempt(`aluminiumPfcSlopeInputs.${index}`, () => {
      add(
        calculateAluminiumPfcSlopeEmissions({
          traceId: `${tracePrefix}:pfc-slope:${row.id}`,
          primaryAluminiumProduction: mv(MEASUREMENT_SPECS.goodsMass, row.primaryAluminiumProduction),
          anodeEffectMinutesPerCellDay: mv(MEASUREMENT_SPECS.anodeEffectActivity, row.anodeEffectMinutesPerCellDay),
          cf4SlopeEmissionFactor: mv(MEASUREMENT_SPECS.pfcSlopeFactor, row.cf4SlopeEmissionFactor),
          c2f6ToCf4WeightFraction: mv(MEASUREMENT_SPECS.pfcMassRatio, row.c2f6ToCf4WeightFraction),
          collectionEfficiency: mv(MEASUREMENT_SPECS.fraction, row.collectionEfficiency),
          evidenceReferences: row.evidenceReferences,
        }).co2e,
        "DIRECT",
      );
      emissionSources.push({
        id: row.id,
        installationId: context.installationId,
        processId: context.processId,
        name: row.name,
        methodology: "PFC_SLOPE",
        greenhouseGases: ["CF4", "C2F6"],
        measurementPoint: row.measurementPoint,
        evidenceReferences: row.evidenceReferences,
        regulatoryDataVersion: payload.regulatoryDataVersion,
      });
    }),
  );

  (payload.aluminiumPfcOvervoltageInputs ?? []).forEach((row, index) =>
    attempt(`aluminiumPfcOvervoltageInputs.${index}`, () => {
      add(
        calculateAluminiumPfcOvervoltageEmissions({
          traceId: `${tracePrefix}:pfc-overvoltage:${row.id}`,
          primaryAluminiumProduction: mv(MEASUREMENT_SPECS.goodsMass, row.primaryAluminiumProduction),
          anodeEffectOvervoltage: mv(MEASUREMENT_SPECS.overvoltage, row.anodeEffectOvervoltage),
          currentEfficiency: mv(MEASUREMENT_SPECS.fraction, row.currentEfficiency),
          cf4OvervoltageCoefficient: mv(MEASUREMENT_SPECS.pfcOvervoltageFactor, row.cf4OvervoltageCoefficient),
          c2f6ToCf4WeightFraction: mv(MEASUREMENT_SPECS.pfcMassRatio, row.c2f6ToCf4WeightFraction),
          collectionEfficiency: mv(MEASUREMENT_SPECS.fraction, row.collectionEfficiency),
          evidenceReferences: row.evidenceReferences,
        }).co2e,
        "DIRECT",
      );
      emissionSources.push({
        id: row.id,
        installationId: context.installationId,
        processId: context.processId,
        name: row.name,
        methodology: "PFC_OVERVOLTAGE",
        greenhouseGases: ["CF4", "C2F6"],
        measurementPoint: row.measurementPoint,
        evidenceReferences: row.evidenceReferences,
        regulatoryDataVersion: payload.regulatoryDataVersion,
      });
    }),
  );

  if (errors.length > 0) return failure(context, errors);

  try {
    const production = measuredValue(MEASUREMENT_SPECS.goodsMass, productionActivityTne, "TNE");
    const directSpecific = calculateProductionAllocation({
      traceId: `${tracePrefix}:direct-specific`,
      allocatableEmissions: measuredValue(MEASUREMENT_SPECS.emissions, decimalToString(directTotal), "TCO2E"),
      allocationFactor: measuredValue(MEASUREMENT_SPECS.fraction, "1", "FRACTION"),
      productionActivityLevel: production,
    });
    const indirectSpecific = calculateProductionAllocation({
      traceId: `${tracePrefix}:indirect-specific`,
      allocatableEmissions: measuredValue(MEASUREMENT_SPECS.emissions, decimalToString(indirectTotal), "TCO2E"),
      allocationFactor: measuredValue(MEASUREMENT_SPECS.fraction, "1", "FRACTION"),
      productionActivityLevel: production,
    });
    traces.push(directSpecific.trace, indirectSpecific.trace);
    return {
      ok: true,
      ...context,
      directSpecificEmissions: { value: directSpecific.value, unit: "TCO2E_PER_TNE" },
      indirectSpecificEmissions: { value: indirectSpecific.value, unit: "TCO2E_PER_TNE" },
      traces,
      sourceStreams,
      emissionSources,
      energyFlows,
      errors: [],
    };
  } catch (error) {
    return failure(context, [errorFromUnknown(error, "productionActivityTne")]);
  }
}
