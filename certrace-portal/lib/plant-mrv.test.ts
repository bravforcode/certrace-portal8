import { describe, expect, it } from "vitest";

import { MrvValidationError } from "./mrv/decimal";
import {
  calculatePlantMrv,
  changePlantMrvMethod,
  createDefaultPlantMrvPayload,
  createEmptyPlantMrvPayload,
  parsePlantMrvPayload,
  PLANT_MRV_SCHEMA_VERSION,
  serializePlantMrvPayload,
  type PlantMrvContext,
  type PlantMrvPayload,
} from "./plant-mrv";

const context: PlantMrvContext = {
  productId: "product-1",
  installationId: "installation-1",
  processId: "process-1",
};

function standardPayload(activity = "10", factor = "2"): PlantMrvPayload {
  const payload = createEmptyPlantMrvPayload("STANDARD_CALCULATION");
  payload.standardCalculationSourceStreams = [
    {
      id: "fuel-1",
      name: "Fuel source stream",
      materialOrFuel: "Coke",
      activityData: { value: activity, unit: "TNE" },
      emissionFactor: { value: factor, unit: "TCO2E_PER_TNE" },
      oxidationFactor: { value: "1", unit: "FRACTION" },
      conversionFactor: { value: "1", unit: "FRACTION" },
      evidenceReferences: ["evidence:fuel-meter", "evidence:factor"],
    },
  ];
  return payload;
}

function massBalancePayload(): PlantMrvPayload {
  const payload = createEmptyPlantMrvPayload("MASS_BALANCE");
  payload.massBalances = [
    {
      id: "balance-1",
      name: "Carbon balance",
      entries: [
        {
          id: "carbon-input",
          name: "Carbon input",
          direction: "INPUT",
          quantity: { value: "12", unit: "TNE" },
          carbonContent: { value: "1", unit: "FRACTION" },
          evidenceReference: "evidence:carbon-input",
        },
      ],
      evidenceReferences: ["evidence:mass-balance"],
    },
  ];
  return payload;
}

describe("Plant MRV draft payload helpers", () => {
  it("creates versioned JSON-safe empty and default payloads", () => {
    const empty = createEmptyPlantMrvPayload("CEMS");
    const draft = createDefaultPlantMrvPayload("STANDARD_CALCULATION");

    expect(empty).toMatchObject({
      schemaVersion: PLANT_MRV_SCHEMA_VERSION,
      regulatoryDataVersion: "EU-CBAM-2026.1",
      directMethod: "CEMS",
      cemsSources: [],
    });
    expect(draft.standardCalculationSourceStreams).toHaveLength(1);
    expect(draft.standardCalculationSourceStreams[0]?.activityData.value).toBe("");
  });

  it("serializes and parses incomplete decimal fields without losing draft state", () => {
    const draft = createDefaultPlantMrvPayload("MASS_BALANCE");
    const serialized = serializePlantMrvPayload(draft);
    expect(parsePlantMrvPayload(serialized)).toEqual(draft);
  });

  it("throws MrvValidationError for malformed JSON, exponent notation, and unknown fields", () => {
    expect(() => parsePlantMrvPayload("{not-json")).toThrowError(MrvValidationError);

    const exponent = standardPayload();
    exponent.standardCalculationSourceStreams[0]!.activityData.value = "1e3";
    expect(() => serializePlantMrvPayload(exponent)).toThrow(/plain base-10/);

    const oversizedDecimal = standardPayload();
    oversizedDecimal.standardCalculationSourceStreams[0]!.activityData.value = "1".repeat(201);
    expect(() => serializePlantMrvPayload(oversizedDecimal)).toThrow(/too long/);

    expect(() => parsePlantMrvPayload({ ...createEmptyPlantMrvPayload(), unknown: true })).toThrow(
      /Unrecognized key/,
    );
  });

  it("changes the selected direct method, initializes its first row, and preserves inactive rows", () => {
    const standard = standardPayload();
    const mass = changePlantMrvMethod(standard, "MASS_BALANCE");
    const restored = changePlantMrvMethod(mass, "STANDARD_CALCULATION");

    expect(mass.directMethod).toBe("MASS_BALANCE");
    expect(mass.massBalances).toHaveLength(1);
    expect(mass.standardCalculationSourceStreams).toEqual(standard.standardCalculationSourceStreams);
    expect(restored.standardCalculationSourceStreams[0]?.activityData.value).toBe("10");
  });
});

describe("selected direct-emissions methods", () => {
  it("calculates STANDARD_CALCULATION and returns a typed source stream", () => {
    const result = calculatePlantMrv(standardPayload(), "10", context);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.directSpecificEmissions).toEqual({ value: "2", unit: "TCO2E_PER_TNE" });
    expect(result.indirectSpecificEmissions.value).toBe("0");
    expect(result.sourceStreams).toHaveLength(1);
    expect(result.sourceStreams[0]).toMatchObject({
      methodology: "STANDARD_CALCULATION",
      installationId: "installation-1",
      processId: "process-1",
    });
    expect(result.traces.map((trace) => trace.method)).toEqual([
      "STANDARD_CALCULATION",
      "PRODUCTION_ALLOCATION",
      "PRODUCTION_ALLOCATION",
    ]);
  });

  it("calculates MASS_BALANCE and exposes every entry as a source stream", () => {
    const result = calculatePlantMrv(massBalancePayload(), "10", context);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.directSpecificEmissions.value).toBe("4.4");
    expect(result.sourceStreams[0]).toMatchObject({ methodology: "MASS_BALANCE", id: "balance-1:carbon-input" });
    expect(result.traces[0]?.method).toBe("MASS_BALANCE");
  });

  it("calculates CEMS and returns an emission source", () => {
    const payload = createEmptyPlantMrvPayload("CEMS");
    payload.cemsSources = [
      {
        id: "stack-1",
        name: "Main stack",
        measurementPoint: "Stack analyser A",
        uncertaintyPercent: "2.5",
        averageConcentration: { value: "0.001", unit: "TCO2E_PER_NM3" },
        monitoredStackGasVolume: { value: "10000", unit: "NM3" },
        evidenceReferences: ["evidence:cems"],
      },
    ];
    const result = calculatePlantMrv(payload, "10", context);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.directSpecificEmissions.value).toBe("1");
    expect(result.emissionSources[0]).toMatchObject({ methodology: "CEMS", measurementPoint: "Stack analyser A" });
  });

  it("preserves but never double-counts inactive direct arrays", () => {
    const payload = standardPayload();
    payload.massBalances = massBalancePayload().massBalances;

    const standard = calculatePlantMrv(payload, "10", context);
    expect(standard.ok && standard.directSpecificEmissions.value).toBe("2");

    payload.directMethod = "MASS_BALANCE";
    const mass = calculatePlantMrv(payload, "10", context);
    expect(mass.ok && mass.directSpecificEmissions.value).toBe("4.4");
  });
});

describe("supplemental energy and allocation branches", () => {
  it("combines electricity, heat, CHP, and waste gas into exact direct/indirect intensities", () => {
    const payload = standardPayload();
    payload.electricityInputs = [
      {
        id: "electricity-1",
        name: "Grid electricity",
        quantity: { value: "100", unit: "MWH" },
        emissionFactor: { value: "0.5", unit: "TCO2E_PER_MWH" },
        evidenceReferences: ["evidence:electricity"],
      },
    ];
    payload.measurableHeatInputs = [
      {
        id: "heat-1",
        name: "Imported steam",
        netMeasurableHeat: { value: "100", unit: "GJ" },
        emissionFactor: { value: "0.1", unit: "TCO2E_PER_GJ" },
        evidenceReferences: ["evidence:steam"],
      },
    ];
    payload.chpInputs = [
      {
        id: "chp-1",
        name: "CHP unit",
        totalChpEmissions: { value: "90", unit: "TCO2E" },
        usefulHeat: { value: "18", unit: "GJ" },
        electricityOutput: { value: "10", unit: "MWH" },
        referenceHeatEfficiency: { value: "0.5", unit: "FRACTION" },
        referenceElectricEfficiency: { value: "0.5", unit: "FRACTION" },
        allocationTarget: "BOTH",
        evidenceReferences: ["evidence:chp"],
      },
    ];
    payload.wasteGasAllocations = [
      {
        id: "waste-gas-1",
        name: "Blast-furnace gas transfer",
        attributableWasteGasEmissions: { value: "100", unit: "TCO2E" },
        targetUsefulEnergy: { value: "20", unit: "GJ" },
        totalUsefulEnergy: { value: "80", unit: "GJ" },
        sourceInstallationId: "installation-upstream",
        destinationInstallationId: "installation-1",
        evidenceReferences: ["evidence:waste-gas"],
      },
    ];

    const result = calculatePlantMrv(payload, "10", context);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.directSpecificEmissions.value).toBe("8.5");
    expect(result.indirectSpecificEmissions.value).toBe("11");
    expect(result.energyFlows.map((flow) => flow.kind)).toEqual([
      "ELECTRICITY_IMPORTED",
      "MEASURABLE_HEAT_IMPORTED",
      "CHP_HEAT",
      "CHP_ELECTRICITY",
      "WASTE_GAS_TRANSFER",
    ]);
  });

  it.each([
    ["HEAT_ONLY", "3", "0", ["CHP_HEAT"]],
    ["ELECTRICITY_ONLY", "0", "6", ["CHP_ELECTRICITY"]],
  ] as const)("respects CHP allocation target %s", (allocationTarget, direct, indirect, kinds) => {
    const payload = standardPayload("0", "0");
    payload.chpInputs = [
      {
        id: "chp-target",
        name: "CHP target",
        totalChpEmissions: { value: "90", unit: "TCO2E" },
        usefulHeat: { value: "18", unit: "GJ" },
        electricityOutput: { value: "10", unit: "MWH" },
        referenceHeatEfficiency: { value: "0.5", unit: "FRACTION" },
        referenceElectricEfficiency: { value: "0.5", unit: "FRACTION" },
        allocationTarget,
        evidenceReferences: [],
      },
    ];
    const result = calculatePlantMrv(payload, "10", context);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.directSpecificEmissions.value).toBe(direct);
    expect(result.indirectSpecificEmissions.value).toBe(indirect);
    expect(result.energyFlows.map((flow) => flow.kind)).toEqual(kinds);
  });
});

describe("aluminium PFC branches", () => {
  it("calculates slope-method PFC emissions as direct emissions", () => {
    const payload = standardPayload("0", "0");
    payload.aluminiumPfcSlopeInputs = [
      {
        id: "pfc-slope-1",
        name: "Potline slope method",
        measurementPoint: "Potline 1",
        primaryAluminiumProduction: { value: "1000", unit: "TNE" },
        anodeEffectMinutesPerCellDay: { value: "0.1", unit: "AEM_MIN_PER_CELL_DAY" },
        cf4SlopeEmissionFactor: { value: "0.104", unit: "KGM_CF4_PER_TNE_AL_PER_AEM" },
        c2f6ToCf4WeightFraction: { value: "0.057", unit: "TNE_C2F6_PER_TNE_CF4" },
        collectionEfficiency: { value: "1", unit: "FRACTION" },
        evidenceReferences: ["evidence:pfc-slope"],
      },
    ];
    const result = calculatePlantMrv(payload, "1000", context);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.directSpecificEmissions.value).toBe("0.07553208");
    expect(result.emissionSources[0]).toMatchObject({ methodology: "PFC_SLOPE", greenhouseGases: ["CF4", "C2F6"] });
  });

  it("calculates overvoltage-method PFC emissions as direct emissions", () => {
    const payload = standardPayload("0", "0");
    payload.aluminiumPfcOvervoltageInputs = [
      {
        id: "pfc-overvoltage-1",
        name: "Potline overvoltage method",
        measurementPoint: "Potline 2",
        primaryAluminiumProduction: { value: "100", unit: "TNE" },
        anodeEffectOvervoltage: { value: "0.5", unit: "MILLIVOLT" },
        currentEfficiency: { value: "1", unit: "FRACTION" },
        cf4OvervoltageCoefficient: { value: "1.16", unit: "KGM_CF4_PER_TNE_AL_PER_MILLIVOLT" },
        c2f6ToCf4WeightFraction: { value: "0.121", unit: "TNE_C2F6_PER_TNE_CF4" },
        collectionEfficiency: { value: "1", unit: "FRACTION" },
        evidenceReferences: ["evidence:pfc-overvoltage"],
      },
    ];
    const result = calculatePlantMrv(payload, "100", context);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.directSpecificEmissions.value).toBe("4.624398");
    expect(result.emissionSources[0]?.methodology).toBe("PFC_OVERVOLTAGE");
  });
});

describe("fail-closed calculation errors", () => {
  it("persists blank drafts but returns exact field errors and no partial results", () => {
    const draft = createDefaultPlantMrvPayload("STANDARD_CALCULATION");
    expect(() => serializePlantMrvPayload(draft)).not.toThrow();

    const result = calculatePlantMrv(draft, "10", context);
    expect(result).toMatchObject({
      ok: false,
      directSpecificEmissions: null,
      indirectSpecificEmissions: null,
      traces: [],
      sourceStreams: [],
    });
    expect(result.errors.map((error) => error.path)).toEqual(
      expect.arrayContaining([
        "standardCalculationSourceStreams.0.activityData.value",
        "standardCalculationSourceStreams.0.emissionFactor.value",
      ]),
    );
  });

  it("requires at least one row for the selected direct method", () => {
    const result = calculatePlantMrv(createEmptyPlantMrvPayload("CEMS"), "10", context);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContainEqual(expect.objectContaining({ code: "DIRECT_METHOD_INPUT_REQUIRED", path: "cemsSources" }));
  });

  it("ignores an incomplete inactive method while calculating the selected method", () => {
    const payload = massBalancePayload();
    payload.standardCalculationSourceStreams = createDefaultPlantMrvPayload("STANDARD_CALCULATION").standardCalculationSourceStreams;
    const result = calculatePlantMrv(payload, "10", context);
    expect(result.ok).toBe(true);
  });

  it("fails closed on incompatible units, invalid mass balance, and zero production", () => {
    const incompatible = standardPayload();
    incompatible.standardCalculationSourceStreams[0]!.emissionFactor = {
      value: "1",
      unit: "TCO2E_PER_GJ",
    };
    const incompatibleResult = calculatePlantMrv(incompatible, "10", context);
    expect(incompatibleResult.ok).toBe(false);
    expect(incompatibleResult.errors[0]?.code).toBe("INCOMPATIBLE_EMISSION_FACTOR");
    expect(incompatibleResult.traces).toEqual([]);

    const negativeBalance = massBalancePayload();
    negativeBalance.massBalances[0]!.entries[0]!.direction = "OUTPUT";
    const balanceResult = calculatePlantMrv(negativeBalance, "10", context);
    expect(balanceResult.ok).toBe(false);
    expect(balanceResult.errors[0]?.code).toBe("NEGATIVE_MASS_BALANCE");

    const productionResult = calculatePlantMrv(standardPayload(), "0", context);
    expect(productionResult.ok).toBe(false);
    expect(productionResult.errors[0]?.message).toContain("greater than zero");
  });

  it("maps malformed payloads and invalid context to failures rather than throwing", () => {
    const malformed = calculatePlantMrv("{bad-json", "10", context);
    expect(malformed.ok).toBe(false);
    expect(malformed.errors[0]?.code).toBe("INVALID_PLANT_MRV_JSON");

    const invalidContext = calculatePlantMrv(standardPayload(), "10", { ...context, installationId: "" });
    expect(invalidContext.ok).toBe(false);
    expect(invalidContext.errors[0]?.code).toBe("INVALID_PLANT_MRV_CONTEXT");
  });

  it("rejects a zero PFC collection efficiency without returning partial source data", () => {
    const payload = standardPayload("0", "0");
    payload.aluminiumPfcSlopeInputs = [
      {
        id: "pfc-invalid",
        name: "Invalid PFC row",
        measurementPoint: "Potline",
        primaryAluminiumProduction: { value: "1", unit: "TNE" },
        anodeEffectMinutesPerCellDay: { value: "1", unit: "AEM_MIN_PER_CELL_DAY" },
        cf4SlopeEmissionFactor: { value: "1", unit: "KGM_CF4_PER_TNE_AL_PER_AEM" },
        c2f6ToCf4WeightFraction: { value: "0", unit: "TNE_C2F6_PER_TNE_CF4" },
        collectionEfficiency: { value: "0", unit: "FRACTION" },
        evidenceReferences: [],
      },
    ];
    const result = calculatePlantMrv(payload, "1", context);
    expect(result.ok).toBe(false);
    expect(result.emissionSources).toEqual([]);
    expect(result.errors[0]?.code).toBe("NON_POSITIVE_VALUE");
  });
});
