import { z } from "zod";

import {
  decimal,
  decimalPlaces,
  decimalStringSchema,
  decimalToString,
  MrvValidationError,
} from "./decimal";
import type { MeasuredValue, MeasurementSpec, UnitCode } from "./types";

export const REGULATORY_DATA_VERSION = "EU-CBAM-2026.1";

const unitCodeSchema = z.enum([
  "TNE",
  "KGM",
  "TCO2E",
  "KGCO2E",
  "TCO2E_PER_TNE",
  "KGCO2E_PER_TNE",
  "MWH",
  "KWH",
  "GJ",
  "MJ",
  "TJ",
  "NM3",
  "HUR",
  "TCO2E_PER_MWH",
  "KGCO2E_PER_KWH",
  "TCO2E_PER_GJ",
  "KGCO2E_PER_GJ",
  "TCO2E_PER_TJ",
  "TCO2E_PER_NM3",
  "KGCO2E_PER_NM3",
  "TNE_PER_TNE",
  "KGM_PER_TNE",
  "FRACTION",
  "PERCENT",
  "TNE_CF4",
  "KGM_CF4",
  "TNE_C2F6",
  "KGM_C2F6",
  "KGM_CF4_PER_TNE_AL_PER_AEM",
  "KGM_CF4_PER_TNE_AL_PER_MILLIVOLT",
  "TNE_C2F6_PER_TNE_CF4",
  "AEM_MIN_PER_CELL_DAY",
  "MILLIVOLT",
  "EUR_PER_TCO2E",
]);

const measuredInputSchema = z.object({
  value: decimalStringSchema,
  unit: unitCodeSchema,
});

type Conversion = { factor: string; rule: string };

const CONVERSIONS: Readonly<Record<string, Conversion>> = {
  "TNE:TNE": { factor: "1", rule: "TNE × 1 = TNE" },
  "KGM:TNE": { factor: "0.001", rule: "KGM × 0.001 = TNE" },
  "TCO2E:TCO2E": { factor: "1", rule: "TCO2E × 1 = TCO2E" },
  "KGCO2E:TCO2E": { factor: "0.001", rule: "KGCO2E × 0.001 = TCO2E" },
  "TCO2E_PER_TNE:TCO2E_PER_TNE": {
    factor: "1",
    rule: "TCO2E_PER_TNE × 1 = TCO2E_PER_TNE",
  },
  "KGCO2E_PER_TNE:TCO2E_PER_TNE": {
    factor: "0.001",
    rule: "KGCO2E_PER_TNE × 0.001 = TCO2E_PER_TNE",
  },
  "MWH:MWH": { factor: "1", rule: "MWH × 1 = MWH" },
  "KWH:MWH": { factor: "0.001", rule: "KWH × 0.001 = MWH" },
  "GJ:GJ": { factor: "1", rule: "GJ × 1 = GJ" },
  "MJ:GJ": { factor: "0.001", rule: "MJ × 0.001 = GJ" },
  "TJ:GJ": { factor: "1000", rule: "TJ × 1000 = GJ" },
  "NM3:NM3": { factor: "1", rule: "NM3 × 1 = NM3" },
  "HUR:HUR": { factor: "1", rule: "HUR × 1 = HUR" },
  "TCO2E_PER_MWH:TCO2E_PER_MWH": {
    factor: "1",
    rule: "TCO2E_PER_MWH × 1 = TCO2E_PER_MWH",
  },
  "KGCO2E_PER_KWH:TCO2E_PER_MWH": {
    factor: "1",
    rule: "KGCO2E_PER_KWH × 1 = TCO2E_PER_MWH",
  },
  "TCO2E_PER_GJ:TCO2E_PER_GJ": {
    factor: "1",
    rule: "TCO2E_PER_GJ × 1 = TCO2E_PER_GJ",
  },
  "KGCO2E_PER_GJ:TCO2E_PER_GJ": {
    factor: "0.001",
    rule: "KGCO2E_PER_GJ × 0.001 = TCO2E_PER_GJ",
  },
  "TCO2E_PER_TJ:TCO2E_PER_GJ": {
    factor: "0.001",
    rule: "TCO2E_PER_TJ × 0.001 = TCO2E_PER_GJ",
  },
  "TCO2E_PER_NM3:TCO2E_PER_NM3": {
    factor: "1",
    rule: "TCO2E_PER_NM3 × 1 = TCO2E_PER_NM3",
  },
  "KGCO2E_PER_NM3:TCO2E_PER_NM3": {
    factor: "0.001",
    rule: "KGCO2E_PER_NM3 × 0.001 = TCO2E_PER_NM3",
  },
  "TNE_PER_TNE:TNE_PER_TNE": {
    factor: "1",
    rule: "TNE_PER_TNE × 1 = TNE_PER_TNE",
  },
  "KGM_PER_TNE:TNE_PER_TNE": {
    factor: "0.001",
    rule: "KGM_PER_TNE × 0.001 = TNE_PER_TNE",
  },
  "FRACTION:FRACTION": { factor: "1", rule: "FRACTION × 1 = FRACTION" },
  "PERCENT:FRACTION": { factor: "0.01", rule: "PERCENT × 0.01 = FRACTION" },
  "TNE_CF4:TNE_CF4": { factor: "1", rule: "TNE_CF4 × 1 = TNE_CF4" },
  "KGM_CF4:TNE_CF4": { factor: "0.001", rule: "KGM_CF4 × 0.001 = TNE_CF4" },
  "TNE_C2F6:TNE_C2F6": { factor: "1", rule: "TNE_C2F6 × 1 = TNE_C2F6" },
  "KGM_C2F6:TNE_C2F6": { factor: "0.001", rule: "KGM_C2F6 × 0.001 = TNE_C2F6" },
  "KGM_CF4_PER_TNE_AL_PER_AEM:KGM_CF4_PER_TNE_AL_PER_AEM": {
    factor: "1",
    rule: "KGM_CF4_PER_TNE_AL_PER_AEM × 1 = KGM_CF4_PER_TNE_AL_PER_AEM",
  },
  "KGM_CF4_PER_TNE_AL_PER_MILLIVOLT:KGM_CF4_PER_TNE_AL_PER_MILLIVOLT": {
    factor: "1",
    rule: "KGM_CF4_PER_TNE_AL_PER_MILLIVOLT × 1 = KGM_CF4_PER_TNE_AL_PER_MILLIVOLT",
  },
  "TNE_C2F6_PER_TNE_CF4:TNE_C2F6_PER_TNE_CF4": {
    factor: "1",
    rule: "TNE_C2F6_PER_TNE_CF4 × 1 = TNE_C2F6_PER_TNE_CF4",
  },
  "AEM_MIN_PER_CELL_DAY:AEM_MIN_PER_CELL_DAY": {
    factor: "1",
    rule: "AEM_MIN_PER_CELL_DAY × 1 = AEM_MIN_PER_CELL_DAY",
  },
  "MILLIVOLT:MILLIVOLT": { factor: "1", rule: "MILLIVOLT × 1 = MILLIVOLT" },
  "EUR_PER_TCO2E:EUR_PER_TCO2E": {
    factor: "1",
    rule: "EUR_PER_TCO2E × 1 = EUR_PER_TCO2E",
  },
};

function spec(
  id: string,
  label: string,
  dimension: MeasurementSpec["dimension"],
  canonicalUnit: UnitCode,
  allowedInputUnits: readonly UnitCode[],
  maximumEnteredDecimalPlaces?: number,
): MeasurementSpec {
  return {
    id,
    label,
    dimension,
    canonicalUnit,
    allowedInputUnits,
    minimumCanonicalValue: "0",
    maximumEnteredDecimalPlaces,
    regulatoryDataVersion: REGULATORY_DATA_VERSION,
  };
}

export const MEASUREMENT_SPECS = {
  goodsMass: spec("goods-mass", "Goods or production mass", "GOODS_MASS", "TNE", ["TNE", "KGM"]),
  emissions: spec("emissions", "Greenhouse gas emissions", "EMISSIONS_MASS", "TCO2E", ["TCO2E", "KGCO2E"]),
  specificEmissions: spec(
    "specific-emissions",
    "Specific embedded emissions",
    "SPECIFIC_EMISSIONS",
    "TCO2E_PER_TNE",
    ["TCO2E_PER_TNE", "KGCO2E_PER_TNE"],
  ),
  freeAllocationBenchmark: spec(
    "free-allocation-benchmark",
    "Specific free-allocation benchmark result before the effective CBAM factor",
    "SPECIFIC_EMISSIONS",
    "TCO2E_PER_TNE",
    ["TCO2E_PER_TNE", "KGCO2E_PER_TNE"],
  ),
  electricity: spec("electricity", "Electricity", "ELECTRICITY", "MWH", ["MWH", "KWH"]),
  heatEnergy: spec("heat-energy", "Heat or energy", "HEAT_ENERGY", "GJ", ["GJ", "MJ", "TJ"]),
  normalVolume: spec("normal-volume", "Normal volume", "NORMAL_VOLUME", "NM3", ["NM3"]),
  time: spec("operating-hours", "Operating hours", "TIME", "HUR", ["HUR"]),
  electricityEmissionFactor: spec(
    "electricity-emission-factor",
    "Electricity emission factor",
    "ELECTRICITY_EMISSION_FACTOR",
    "TCO2E_PER_MWH",
    ["TCO2E_PER_MWH", "KGCO2E_PER_KWH"],
  ),
  heatEmissionFactor: spec(
    "heat-emission-factor",
    "Heat emission factor",
    "HEAT_EMISSION_FACTOR",
    "TCO2E_PER_GJ",
    ["TCO2E_PER_GJ", "KGCO2E_PER_GJ", "TCO2E_PER_TJ"],
  ),
  volumeEmissionFactor: spec(
    "volume-emission-factor",
    "Normal-volume emission factor",
    "VOLUME_EMISSION_FACTOR",
    "TCO2E_PER_NM3",
    ["TCO2E_PER_NM3", "KGCO2E_PER_NM3"],
  ),
  precursorRatio: spec(
    "precursor-ratio",
    "Precursor input ratio",
    "PRECURSOR_RATIO",
    "TNE_PER_TNE",
    ["TNE_PER_TNE", "KGM_PER_TNE"],
  ),
  fraction: {
    ...spec("fraction", "Dimensionless fraction", "DIMENSIONLESS", "FRACTION", ["FRACTION", "PERCENT"]),
    maximumCanonicalValue: "1",
  },
  cf4Mass: spec("cf4-mass", "CF4 mass", "PFC_CF4_MASS", "TNE_CF4", ["TNE_CF4", "KGM_CF4"]),
  c2f6Mass: spec("c2f6-mass", "C2F6 mass", "PFC_C2F6_MASS", "TNE_C2F6", ["TNE_C2F6", "KGM_C2F6"]),
  pfcSlopeFactor: spec(
    "pfc-slope-factor",
    "CF4 slope emission factor",
    "PFC_SLOPE_FACTOR",
    "KGM_CF4_PER_TNE_AL_PER_AEM",
    ["KGM_CF4_PER_TNE_AL_PER_AEM"],
  ),
  pfcOvervoltageFactor: spec(
    "pfc-overvoltage-factor",
    "CF4 overvoltage emission factor",
    "PFC_OVERVOLTAGE_FACTOR",
    "KGM_CF4_PER_TNE_AL_PER_MILLIVOLT",
    ["KGM_CF4_PER_TNE_AL_PER_MILLIVOLT"],
  ),
  pfcMassRatio: {
    ...spec(
      "pfc-mass-ratio",
      "C2F6 to CF4 weight fraction",
      "PFC_MASS_RATIO",
      "TNE_C2F6_PER_TNE_CF4",
      ["TNE_C2F6_PER_TNE_CF4"],
    ),
    maximumCanonicalValue: "1",
  },
  anodeEffectActivity: spec(
    "anode-effect-activity",
    "Anode effect minutes per cell-day",
    "ANODE_EFFECT_ACTIVITY",
    "AEM_MIN_PER_CELL_DAY",
    ["AEM_MIN_PER_CELL_DAY"],
  ),
  overvoltage: spec("overvoltage", "Anode effect overvoltage", "OVERVOLTAGE", "MILLIVOLT", ["MILLIVOLT"]),
  carbonPrice: spec(
    "carbon-price",
    "CBAM certificate price",
    "CARBON_PRICE",
    "EUR_PER_TCO2E",
    ["EUR_PER_TCO2E"],
  ),
} as const satisfies Record<string, MeasurementSpec>;

export function measuredValue(
  measurementSpec: MeasurementSpec,
  enteredValue: string,
  enteredUnit: UnitCode,
): MeasuredValue {
  const input = measuredInputSchema.safeParse({ value: enteredValue, unit: enteredUnit });
  if (!input.success) {
    throw new MrvValidationError(
      "INVALID_MEASUREMENT",
      input.error.issues[0]?.message ?? "Measurement is invalid",
    );
  }
  if (!measurementSpec.allowedInputUnits.includes(enteredUnit)) {
    throw new MrvValidationError(
      "UNIT_NOT_ALLOWED",
      `${enteredUnit} is not allowed for ${measurementSpec.id}`,
    );
  }

  const enteredScale = decimalPlaces(enteredValue);
  if (
    measurementSpec.maximumEnteredDecimalPlaces !== undefined &&
    enteredScale > measurementSpec.maximumEnteredDecimalPlaces
  ) {
    throw new MrvValidationError(
      "PRECISION_EXCEEDED",
      `${measurementSpec.id} accepts at most ${measurementSpec.maximumEnteredDecimalPlaces} decimal places`,
    );
  }

  const conversion = CONVERSIONS[`${enteredUnit}:${measurementSpec.canonicalUnit}`];
  if (!conversion) {
    throw new MrvValidationError(
      "CONVERSION_NOT_CONFIGURED",
      `No conversion is configured from ${enteredUnit} to ${measurementSpec.canonicalUnit}`,
    );
  }
  const canonical = decimal(enteredValue).times(conversion.factor);
  const canonicalValue = decimalToString(canonical);

  if (
    measurementSpec.minimumCanonicalValue !== undefined &&
    canonical.lessThan(decimal(measurementSpec.minimumCanonicalValue))
  ) {
    throw new MrvValidationError("BELOW_MINIMUM", `${measurementSpec.id} is below its minimum`);
  }
  if (
    measurementSpec.maximumCanonicalValue !== undefined &&
    canonical.greaterThan(decimal(measurementSpec.maximumCanonicalValue))
  ) {
    throw new MrvValidationError("ABOVE_MAXIMUM", `${measurementSpec.id} exceeds its maximum`);
  }

  return {
    enteredValue,
    enteredUnit,
    canonicalValue,
    canonicalUnit: measurementSpec.canonicalUnit,
    conversionRule: conversion.rule,
    precision: {
      enteredDecimalPlaces: enteredScale,
      canonicalDecimalPlaces: decimalPlaces(canonicalValue),
      rounding: "NONE_EXACT",
    },
    measurementSpecId: measurementSpec.id,
    regulatoryDataVersion: measurementSpec.regulatoryDataVersion,
  };
}

export function assertCanonicalUnit(value: MeasuredValue, expected: UnitCode, field: string): void {
  if (value.canonicalUnit !== expected) {
    throw new MrvValidationError(
      "UNIT_MISMATCH",
      `${field} must use canonical unit ${expected}; received ${value.canonicalUnit}`,
    );
  }
}
