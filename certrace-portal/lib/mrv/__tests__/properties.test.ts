import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { calculateElectricityEmissions, calculateMassBalanceEmissions } from "../calculations";
import { decimal, decimalToString } from "../decimal";
import { measuredValue, MEASUREMENT_SPECS } from "../measurements";

describe("MRV arithmetic properties", () => {
  it("normalizes any non-negative integer kilograms to exactly one thousandth tonnes", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000_000 }), (kilograms) => {
        const normalized = measuredValue(MEASUREMENT_SPECS.goodsMass, String(kilograms), "KGM");
        const expected = decimalToString(decimal(String(kilograms)).dividedBy("1000"));
        expect(normalized.canonicalValue).toBe(expected);
      }),
    );
  });

  it("scales electricity emissions linearly for exact integer inputs", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 0, max: 10_000 }),
        (mwh, factor) => {
          const calculated = calculateElectricityEmissions({
            traceId: "property:electricity",
            electricity: measuredValue(MEASUREMENT_SPECS.electricity, String(mwh), "MWH"),
            emissionFactor: measuredValue(
              MEASUREMENT_SPECS.electricityEmissionFactor,
              String(factor),
              "TCO2E_PER_MWH",
            ),
          });
          expect(calculated.value).toBe((BigInt(mwh) * BigInt(factor)).toString());
        },
      ),
    );
  });

  it("converts twelve tonnes of retained carbon into forty-four tonnes CO2 at every scale", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000 }), (scale) => {
        const calculated = calculateMassBalanceEmissions("property:mass-balance", [
          {
            id: "carbon",
            direction: "INPUT",
            quantity: measuredValue(MEASUREMENT_SPECS.goodsMass, String(12 * scale), "TNE"),
            carbonContent: measuredValue(MEASUREMENT_SPECS.fraction, "1", "FRACTION"),
          },
        ]);
        expect(calculated.value).toBe((44n * BigInt(scale)).toString());
      }),
    );
  });
});
