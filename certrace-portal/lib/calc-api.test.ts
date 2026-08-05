import { describe, expect, it } from "vitest";

import { buildCalculationRequest, emissionsMatch } from "./calc-api";
import { createEmptyPlantMrvPayload, serializePlantMrvPayload, type PlantMrvPayload } from "./plant-mrv";
import { emptyPrecursorRow } from "./precursors";
import { valueKey, type SupplierRequest } from "./supplier";

/* Only the fields the mapper reads; the full SupplierRequest is irrelevant here. */
const REQ = {
  period: "2026 annual",
  products: [{ product: { id: "p1", name: "Steel billet", cnCode: "72061000" } }],
} as unknown as SupplierRequest;

function payloadWith(overrides: Partial<PlantMrvPayload>): string {
  return serializePlantMrvPayload({ ...createEmptyPlantMrvPayload(), ...overrides });
}

function baseValues(): Record<string, string> {
  return {
    [valueKey("method", "p1")]: "actual",
    [valueKey("process-route", "p1")]: "SCRAP_EAF",
    [valueKey("production-activity", "p1")]: "100",
    [valueKey("plant-mrv", "p1")]: payloadWith({
      standardCalculationSourceStreams: [
        {
          id: "stream-1",
          name: "Coke",
          materialOrFuel: "Coke",
          activityData: { value: "10", unit: "TNE" },
          emissionFactor: { value: "2", unit: "TCO2E_PER_TNE" },
          oxidationFactor: { value: "90", unit: "PERCENT" },
          evidenceReferences: ["DOC-1"],
        },
      ],
      electricityInputs: [
        {
          id: "elec-1",
          name: "Grid power",
          quantity: { value: "5000", unit: "KWH" },
          emissionFactor: { value: "0.4", unit: "TCO2E_PER_MWH" },
          evidenceReferences: [],
        },
      ],
    }),
    [valueKey("precursors", "p1")]: JSON.stringify([
      { ...emptyPrecursorRow(), name: "Pig iron", cn: "72011011", qty: "0.5", see: "1.2", method: "actual" },
    ]),
  };
}

describe("buildCalculationRequest", () => {
  it("maps a standard-calculation payload to the engine request exactly", () => {
    const plan = buildCalculationRequest(REQ, baseValues(), "p1");
    expect(plan).toEqual({
      ok: true,
      request: {
        trace_id: "p1",
        reporting_year: 2026,
        sector: "IRON_STEEL",
        route: "EAF",
        production: { value: "100", unit: "TNE" },
        source_streams: [
          {
            id: "stream-1",
            activity: { value: "10", unit: "TNE" },
            emission_factor: { value: "2", unit: "TCO2E_PER_TNE" },
            oxidation_factor: { value: "0.9", unit: "FRACTION" },
            evidence_reference: "DOC-1",
          },
        ],
        electricity: {
          electricity: { value: "5", unit: "MWH" },
          emission_factor: { value: "0.4", unit: "TCO2E_PER_MWH" },
        },
        precursors: [
          {
            id: "Pig iron",
            method: "ACTUAL",
            quantity: { value: "50", unit: "TNE" },
            cn_code: "72011011",
            actual_specific_embedded_emissions: { value: "1.2", unit: "TCO2E_PER_TNE" },
          },
        ],
      },
    });
  });

  it("refuses default-factor products", () => {
    const values = baseValues();
    values[valueKey("method", "p1")] = "default";
    const plan = buildCalculationRequest(REQ, values, "p1");
    expect(plan).toEqual({ ok: false, reason: expect.stringContaining("actual-data") });
  });

  it("refuses mass-balance and CEMS methods", () => {
    const values = baseValues();
    values[valueKey("plant-mrv", "p1")] = payloadWith({ directMethod: "MASS_BALANCE" });
    const plan = buildCalculationRequest(REQ, values, "p1");
    expect(plan).toEqual({ ok: false, reason: expect.stringContaining("standard") });
  });

  it("refuses units the engine cannot take", () => {
    const values = baseValues();
    values[valueKey("plant-mrv", "p1")] = payloadWith({
      standardCalculationSourceStreams: [
        {
          id: "stream-1",
          name: "Gas",
          materialOrFuel: "Gas",
          activityData: { value: "10", unit: "GJ" },
          emissionFactor: { value: "0.05", unit: "TCO2E_PER_GJ" },
          evidenceReferences: [],
        },
      ],
    });
    const plan = buildCalculationRequest(REQ, values, "p1");
    expect(plan).toEqual({ ok: false, reason: expect.stringContaining("GJ") });
  });

  it("refuses routes without a server-side equivalent", () => {
    const values = baseValues();
    values[valueKey("process-route", "p1")] = "IRON_STEEL_DOWNSTREAM";
    const plan = buildCalculationRequest(REQ, values, "p1");
    expect(plan).toEqual({ ok: false, reason: expect.stringContaining("route") });
  });
});

describe("emissionsMatch", () => {
  it("tolerates rounding drift only", () => {
    expect(emissionsMatch("1.2345", "1.2349")).toBe(true);
    expect(emissionsMatch("1.2345", "1.24")).toBe(false);
    expect(emissionsMatch("garbage", "1")).toBe(false);
  });
});
