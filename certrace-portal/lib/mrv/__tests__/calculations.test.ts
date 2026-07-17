import { describe, expect, it } from "vitest";

import {
  allocateChpEmissions,
  allocateWasteGasEmissions,
  applyDirectIndirectTreatment,
  calculateAluminiumPfcOvervoltageEmissions,
  calculateAluminiumPfcSlopeEmissions,
  calculateCemsEmissions,
  calculateElectricityEmissions,
  calculateFreeAllocationAdjustment,
  calculateMassBalanceEmissions,
  calculateMeasurableHeatEmissions,
  calculatePrecursorContribution,
  calculateProductionAllocation,
  calculateStandardSourceStreamEmissions,
  combineComplexGoodsSpecificEmissions,
} from "../calculations";
import { CALCULATION_FIXTURE_REVIEW } from "../fixtures";
import { measuredValue, MEASUREMENT_SPECS } from "../measurements";
import { classifyCnCode } from "../regulatory-data";
import type { PrecursorInput, VerificationReference } from "../types";

const m = (spec: keyof typeof MEASUREMENT_SPECS, value: string, unit: Parameters<typeof measuredValue>[2]) =>
  measuredValue(MEASUREMENT_SPECS[spec], value, unit);

const verifiedSteel: VerificationReference = {
  id: "vr-steel-2026",
  verifierLegalName: "Accredited Verifier Ltd",
  accreditationBody: "National Accreditation Body",
  accreditationIdentifier: "ACC-CBAM-001",
  accreditationValidFrom: "2026-01-01",
  accreditationValidTo: "2027-12-31",
  sectorScopes: ["CRUDE_STEEL"],
  verificationReportReference: "VR-2026-001",
  verificationReportIssuedAt: "2027-03-01",
  reportingPeriodStart: "2026-01-01",
  reportingPeriodEnd: "2026-12-31",
  opinion: "SATISFACTORY",
  evidenceReferences: ["evidence:verified-steel"],
};

describe("calculation-based, mass-balance, CEMS, and energy primitives", () => {
  it("calculates a BF-BOF source stream with exact factors and a reproducible trace", () => {
    const calculated = calculateStandardSourceStreamEmissions({
      traceId: "fixture:bf-bof:fuel",
      activityData: m("goodsMass", "1000", "TNE"),
      emissionFactor: m("specificEmissions", "2", "TCO2E_PER_TNE"),
      oxidationFactor: m("fraction", "90", "PERCENT"),
      conversionFactor: m("fraction", "0.5", "FRACTION"),
      evidenceReferences: ["fixture:bf-bof:source"],
    });
    expect(calculated.value).toBe("900");
    expect(calculated.trace).toMatchObject({
      method: "STANDARD_CALCULATION",
      authoritative: true,
      output: { value: "900", unit: "TCO2E" },
    });
    expect(calculated.trace.formula).toContain("activityData × emissionFactor");
  });

  it("calculates an alloy-steel mass balance using the exact 44/12 carbon conversion", () => {
    const calculated = calculateMassBalanceEmissions("fixture:eaf-alloy:mass-balance", [
      {
        id: "carbon-input",
        direction: "INPUT",
        quantity: m("goodsMass", "20", "TNE"),
        carbonContent: m("fraction", "80", "PERCENT"),
      },
      {
        id: "carbon-output",
        direction: "OUTPUT",
        quantity: m("goodsMass", "10", "TNE"),
        carbonContent: m("fraction", "40", "PERCENT"),
      },
    ]);
    expect(calculated.value).toBe("44");
    expect(calculated.trace.method).toBe("MASS_BALANCE");
  });

  it("integrates CEMS concentration and normal volume", () => {
    const calculated = calculateCemsEmissions({
      traceId: "fixture:cems",
      averageConcentration: m("volumeEmissionFactor", "0.001", "TCO2E_PER_NM3"),
      monitoredStackGasVolume: m("normalVolume", "100000", "NM3"),
    });
    expect(calculated.value).toBe("100");
  });

  it("calculates EAF electricity and measurable heat without proxy factors", () => {
    expect(
      calculateElectricityEmissions({
        traceId: "fixture:eaf:electricity",
        electricity: m("electricity", "1000", "MWH"),
        emissionFactor: m("electricityEmissionFactor", "0.5", "TCO2E_PER_MWH"),
      }).value,
    ).toBe("500");
    expect(
      calculateMeasurableHeatEmissions({
        traceId: "fixture:heat",
        netMeasurableHeat: m("heatEnergy", "500", "GJ"),
        emissionFactor: m("heatEmissionFactor", "0.08", "TCO2E_PER_GJ"),
      }).value,
    ).toBe("40");
  });

  it("allocates CHP and waste-gas emissions with exact energy shares", () => {
    const chp = allocateChpEmissions({
      traceId: "fixture:chp",
      totalChpEmissions: m("emissions", "90", "TCO2E"),
      usefulHeat: m("heatEnergy", "18", "GJ"),
      electricityOutput: m("electricity", "10", "MWH"),
      referenceHeatEfficiency: m("fraction", "50", "PERCENT"),
      referenceElectricEfficiency: m("fraction", "50", "PERCENT"),
    });
    expect(chp.heat.value).toBe("30");
    expect(chp.electricity.value).toBe("60");
    expect(
      allocateWasteGasEmissions({
        traceId: "fixture:waste-gas",
        attributableWasteGasEmissions: m("emissions", "100", "TCO2E"),
        targetUsefulEnergy: m("heatEnergy", "20", "GJ"),
        totalUsefulEnergy: m("heatEnergy", "80", "GJ"),
      }).value,
    ).toBe("25");
  });
});

describe("production, precursor, and treatment calculations", () => {
  const actual: PrecursorInput = {
    id: "actual-steel",
    processId: "downstream-steel",
    precursorCnCode: "72071190",
    precursorCategory: "CRUDE_STEEL",
    quantityConsumed: m("goodsMass", "50", "TNE"),
    determinationMethod: "ACTUAL",
    actualSpecificEmbeddedEmissions: m("specificEmissions", "2", "TCO2E_PER_TNE"),
    verificationReference: verifiedSteel,
    evidenceReferences: ["evidence:actual-precursor"],
    regulatoryDataVersion: "EU-CBAM-2026.1",
  };
  const defaulted: PrecursorInput = {
    id: "default-steel",
    processId: "downstream-steel",
    precursorCnCode: "72071190",
    precursorCategory: "CRUDE_STEEL",
    quantityConsumed: m("goodsMass", "20", "TNE"),
    determinationMethod: "DEFAULT",
    unmarkedDefaultSpecificEmbeddedEmissions: m("specificEmissions", "1", "TCO2E_PER_TNE"),
    evidenceReferences: ["evidence:default-source"],
    regulatoryDataVersion: "EU-CBAM-2026.1",
  };

  it("supports mixed actual/default precursors and applies the 2026 markup exactly once", () => {
    const calculated = calculatePrecursorContribution({
      traceId: "fixture:downstream-steel:precursors",
      reportingDate: "2026-12-31",
      reportingPeriod: { start: "2026-01-01", end: "2026-12-31" },
      goodsProduction: m("goodsMass", "100", "TNE"),
      precursors: [actual, defaulted],
    });
    expect(calculated.value).toBe("1.22");
    expect(calculated.trace.warnings).toEqual([]);
    expect(calculated.trace.exactInputs).toContainEqual(
      expect.objectContaining({ name: "default-steel.defaultMarkup", value: "0.10" }),
    );
  });

  it.each([
    ["2027-06-30", "1.2"],
    ["2028-06-30", "1.3"],
  ])("uses the effective default markup for %s", (reportingDate, expected) => {
    const calculated = calculatePrecursorContribution({
      traceId: `fixture:default:${reportingDate}`,
      reportingDate,
      reportingPeriod: { start: reportingDate.slice(0, 4) + "-01-01", end: reportingDate.slice(0, 4) + "-12-31" },
      goodsProduction: m("goodsMass", "1", "TNE"),
      precursors: [{ ...defaulted, quantityConsumed: m("goodsMass", "1", "TNE") }],
    });
    expect(calculated.value).toBe(expected);
  });

  it("keeps an unverified actual calculation as a blocked draft trace", () => {
    const calculated = calculatePrecursorContribution({
      traceId: "fixture:unverified-actual",
      reportingDate: "2026-12-31",
      reportingPeriod: { start: "2026-01-01", end: "2026-12-31" },
      goodsProduction: m("goodsMass", "100", "TNE"),
      precursors: [{ ...actual, verificationReference: undefined }],
    });
    expect(calculated.trace.warnings).toContainEqual(expect.objectContaining({ severity: "BLOCKER" }));
  });

  it("does not apply the markup twice to a published marked default-value column", () => {
    const publishedMarked: PrecursorInput = {
      ...defaulted,
      id: "published-marked-steel",
      unmarkedDefaultSpecificEmbeddedEmissions: undefined,
      publishedMarkedDefaultSpecificEmbeddedEmissions: m("specificEmissions", "1.1", "TCO2E_PER_TNE"),
      quantityConsumed: m("goodsMass", "1", "TNE"),
    };
    const calculated = calculatePrecursorContribution({
      traceId: "fixture:published-marked-default",
      reportingDate: "2026-12-31",
      reportingPeriod: { start: "2026-01-01", end: "2026-12-31" },
      goodsProduction: m("goodsMass", "1", "TNE"),
      precursors: [publishedMarked],
    });
    expect(calculated.value).toBe("1.1");
    expect(calculated.trace.exactInputs).toContainEqual(
      expect.objectContaining({ name: "published-marked-steel.defaultMarkupAlreadyIncluded" }),
    );
  });

  it("calculates production allocation and a complex downstream steel fixture", () => {
    const own = calculateProductionAllocation({
      traceId: "fixture:downstream-steel:own",
      allocatableEmissions: m("emissions", "20", "TCO2E"),
      allocationFactor: m("fraction", "1", "FRACTION"),
      productionActivityLevel: m("goodsMass", "100", "TNE"),
    });
    const precursor = calculatePrecursorContribution({
      traceId: "fixture:downstream-steel:precursor",
      reportingDate: "2026-12-31",
      reportingPeriod: { start: "2026-01-01", end: "2026-12-31" },
      goodsProduction: m("goodsMass", "100", "TNE"),
      precursors: [actual, defaulted],
    });
    const combined = combineComplexGoodsSpecificEmissions({
      traceId: "fixture:downstream-steel:combined",
      ownProcessSpecificEmissions: m("specificEmissions", own.value, "TCO2E_PER_TNE"),
      precursorSpecificEmissions: m("specificEmissions", precursor.value, "TCO2E_PER_TNE"),
    });
    expect(combined.value).toBe("1.42");
  });

  it("excludes indirect emissions for Annex-II steel and aluminium without discarding their trace", () => {
    const product = classifyCnCode("72083900");
    expect(product).toBeDefined();
    const treated = applyDirectIndirectTreatment({
      traceId: "fixture:steel:annex-ii",
      product: product!,
      directEmissions: m("emissions", "2", "TCO2E"),
      indirectEmissions: m("emissions", "1", "TCO2E"),
    });
    expect(treated.value).toBe("2");
    expect(treated.trace.exactInputs).toContainEqual(expect.objectContaining({ name: "indirectEmissions", value: "1" }));
    expect(treated.trace.warnings[0]?.code).toBe("INDIRECT_EMISSIONS_EXCLUDED_ANNEX_II");
  });
});

describe("primary and downstream aluminium fixtures", () => {
  it("calculates primary aluminium PFC emissions using the definitive slope method and GWPs", () => {
    const calculated = calculateAluminiumPfcSlopeEmissions({
      traceId: "fixture:primary-aluminium:pfc-slope",
      primaryAluminiumProduction: m("goodsMass", "1000", "TNE"),
      anodeEffectMinutesPerCellDay: m("anodeEffectActivity", "0.1", "AEM_MIN_PER_CELL_DAY"),
      cf4SlopeEmissionFactor: m("pfcSlopeFactor", "0.104", "KGM_CF4_PER_TNE_AL_PER_AEM"),
      c2f6ToCf4WeightFraction: m("pfcMassRatio", "0.057", "TNE_C2F6_PER_TNE_CF4"),
      collectionEfficiency: m("fraction", "1", "FRACTION"),
    });
    expect(calculated.cf4Tonnes).toBe("0.0104");
    expect(calculated.c2f6Tonnes).toBe("0.0005928");
    expect(calculated.co2e.value).toBe("75.53208");
    expect(calculated.co2e.trace.formula).toContain("6630");
  });

  it("supports the alternative PFC overvoltage method", () => {
    const calculated = calculateAluminiumPfcOvervoltageEmissions({
      traceId: "fixture:primary-aluminium:pfc-overvoltage",
      primaryAluminiumProduction: m("goodsMass", "100", "TNE"),
      anodeEffectOvervoltage: m("overvoltage", "0.5", "MILLIVOLT"),
      currentEfficiency: m("fraction", "100", "PERCENT"),
      cf4OvervoltageCoefficient: m(
        "pfcOvervoltageFactor",
        "1.16",
        "KGM_CF4_PER_TNE_AL_PER_MILLIVOLT",
      ),
      c2f6ToCf4WeightFraction: m("pfcMassRatio", "0.121", "TNE_C2F6_PER_TNE_CF4"),
      collectionEfficiency: m("fraction", "1", "FRACTION"),
    });
    expect(calculated.cf4Tonnes).toBe("0.058");
    expect(calculated.c2f6Tonnes).toBe("0.007018");
    expect(calculated.co2e.value).toBe("462.4398");
  });

  it("calculates a downstream aluminium precursor fixture without treating it as verified", () => {
    const precursor: PrecursorInput = {
      id: "unwrought-aluminium-default",
      processId: "aluminium-extrusion",
      precursorCnCode: "76011090",
      precursorCategory: "UNWROUGHT_ALUMINIUM",
      quantityConsumed: m("goodsMass", "90", "TNE"),
      determinationMethod: "DEFAULT",
      unmarkedDefaultSpecificEmbeddedEmissions: m("specificEmissions", "8", "TCO2E_PER_TNE"),
      evidenceReferences: ["fixture:default-aluminium"],
      regulatoryDataVersion: "EU-CBAM-2026.1",
    };
    const contribution = calculatePrecursorContribution({
      traceId: "fixture:downstream-aluminium",
      reportingDate: "2026-12-31",
      reportingPeriod: { start: "2026-01-01", end: "2026-12-31" },
      goodsProduction: m("goodsMass", "100", "TNE"),
      precursors: [precursor],
    });
    expect(contribution.value).toBe("7.92");
    expect(CALCULATION_FIXTURE_REVIEW).toMatchObject({
      status: "PENDING_ESG_SPECIALIST_REVIEW",
      mayBeLabelledVerified: false,
    });
  });
});

describe("Regulation 2025/2620 free-allocation adjustment", () => {
  it("applies only caller-supplied product/route and annual-factor data", () => {
    const calculated = calculateFreeAllocationAdjustment({
      traceId: "fixture:free-allocation:bf-bof",
      specificEmbeddedEmissions: m("specificEmissions", "2", "TCO2E_PER_TNE"),
      specificFreeAllocationBeforeCbamFactor: m(
        "freeAllocationBenchmark",
        "1",
        "TCO2E_PER_TNE",
      ),
      effectiveCbamFactor: m("fraction", "97.5", "PERCENT"),
      benchmarkEvidenceReference: "evidence:2620:bf-bof-benchmark-result",
      factorEvidenceReference: "evidence:2026:effective-cbam-factor",
    });
    expect(calculated.freeAllocationAdjustment).toEqual({ value: "0.975", unit: "TCO2E_PER_TNE" });
    expect(calculated.adjustedChargeableEmissions).toEqual({ value: "1.025", unit: "TCO2E_PER_TNE" });
    expect(calculated.trace).toMatchObject({
      method: "FREE_ALLOCATION_ADJUSTMENT",
      authoritative: true,
      output: { value: "1.025", unit: "TCO2E_PER_TNE" },
    });
    expect(calculated.trace.evidenceReferences).toEqual(
      expect.arrayContaining([
        "EU-2025-2620",
        "evidence:2620:bf-bof-benchmark-result",
        "evidence:2026:effective-cbam-factor",
      ]),
    );
    expect(calculated.trace.warnings).toContainEqual(
      expect.objectContaining({ code: "PRODUCT_ROUTE_BENCHMARK_PROVENANCE_REQUIRED" }),
    );
  });

  it("allows the exact zero boundary but rejects a negative adjusted result", () => {
    const zero = calculateFreeAllocationAdjustment({
      traceId: "fixture:free-allocation:zero",
      specificEmbeddedEmissions: m("specificEmissions", "1", "TCO2E_PER_TNE"),
      specificFreeAllocationBeforeCbamFactor: m("freeAllocationBenchmark", "1", "TCO2E_PER_TNE"),
      effectiveCbamFactor: m("fraction", "1", "FRACTION"),
      benchmarkEvidenceReference: "evidence:benchmark",
      factorEvidenceReference: "evidence:factor",
    });
    expect(zero.adjustedChargeableEmissions.value).toBe("0");

    expect(() =>
      calculateFreeAllocationAdjustment({
        traceId: "fixture:free-allocation:invalid-negative",
        specificEmbeddedEmissions: m("specificEmissions", "0.9", "TCO2E_PER_TNE"),
        specificFreeAllocationBeforeCbamFactor: m("freeAllocationBenchmark", "1", "TCO2E_PER_TNE"),
        effectiveCbamFactor: m("fraction", "1", "FRACTION"),
        benchmarkEvidenceReference: "evidence:benchmark",
        factorEvidenceReference: "evidence:factor",
      }),
    ).toThrow(/exceeds embedded emissions/);
  });

  it("fails closed when benchmark or factor provenance is absent", () => {
    expect(() =>
      calculateFreeAllocationAdjustment({
        traceId: "fixture:free-allocation:no-provenance",
        specificEmbeddedEmissions: m("specificEmissions", "2", "TCO2E_PER_TNE"),
        specificFreeAllocationBeforeCbamFactor: m("freeAllocationBenchmark", "1", "TCO2E_PER_TNE"),
        effectiveCbamFactor: m("fraction", "0.975", "FRACTION"),
        benchmarkEvidenceReference: "",
        factorEvidenceReference: "",
      }),
    ).toThrow(/evidence references are required/);
  });
});
