import { describe, expect, it } from "vitest";

import { measuredValue, MEASUREMENT_SPECS, REGULATORY_DATA_VERSION } from "../measurements";

describe("exact measurement normalization", () => {
  it("preserves the entered mass and normalizes kilograms to tonnes exactly", () => {
    const value = measuredValue(MEASUREMENT_SPECS.goodsMass, "1234.500", "KGM");

    expect(value).toMatchObject({
      enteredValue: "1234.500",
      enteredUnit: "KGM",
      canonicalValue: "1.2345",
      canonicalUnit: "TNE",
      conversionRule: "KGM × 0.001 = TNE",
      precision: {
        enteredDecimalPlaces: 3,
        canonicalDecimalPlaces: 4,
        rounding: "NONE_EXACT",
      },
      regulatoryDataVersion: REGULATORY_DATA_VERSION,
    });
  });

  it.each([
    ["electricity", "1250", "KWH", "1.25", "MWH"],
    ["heatEnergy", "1.25", "TJ", "1250", "GJ"],
    ["specificEmissions", "750", "KGCO2E_PER_TNE", "0.75", "TCO2E_PER_TNE"],
    ["electricityEmissionFactor", "0.42", "KGCO2E_PER_KWH", "0.42", "TCO2E_PER_MWH"],
    ["fraction", "95.5", "PERCENT", "0.955", "FRACTION"],
    ["precursorRatio", "250", "KGM_PER_TNE", "0.25", "TNE_PER_TNE"],
    ["cf4Mass", "12.5", "KGM_CF4", "0.0125", "TNE_CF4"],
    ["emissions", "1250", "KGCO2E", "1.25", "TCO2E"],
    ["heatEnergy", "1250", "MJ", "1.25", "GJ"],
    ["heatEmissionFactor", "80", "KGCO2E_PER_GJ", "0.08", "TCO2E_PER_GJ"],
    ["heatEmissionFactor", "80", "TCO2E_PER_TJ", "0.08", "TCO2E_PER_GJ"],
    ["volumeEmissionFactor", "2.5", "KGCO2E_PER_NM3", "0.0025", "TCO2E_PER_NM3"],
    ["c2f6Mass", "7.5", "KGM_C2F6", "0.0075", "TNE_C2F6"],
  ] as const)("normalizes %s without binary floating-point rounding", (specName, input, unit, output, outputUnit) => {
    const spec = MEASUREMENT_SPECS[specName];
    const value = measuredValue(spec, input, unit);
    expect(value.canonicalValue).toBe(output);
    expect(value.canonicalUnit).toBe(outputUnit);
  });

  it("rejects exponent notation, separators, invalid units and negative regulatory values", () => {
    expect(() => measuredValue(MEASUREMENT_SPECS.goodsMass, "1e3", "KGM")).toThrow(/plain base-10/);
    expect(() => measuredValue(MEASUREMENT_SPECS.goodsMass, "1,000", "KGM")).toThrow(/plain base-10/);
    expect(() => measuredValue(MEASUREMENT_SPECS.goodsMass, "10", "MWH")).toThrow(/not allowed/);
    expect(() => measuredValue(MEASUREMENT_SPECS.goodsMass, "-0.1", "TNE")).toThrow(/below its minimum/);
  });
});
