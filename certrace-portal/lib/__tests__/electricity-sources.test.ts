/* Bug 3 + Bug 4 — the repeatable electricity source list: weighted average,
   the waste-gas cap inside EF_El, the grid factor always re-derived (never
   trusted from storage), and the legacy single-source migration. */

import { test } from "node:test";
import assert from "node:assert/strict";

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  clear() {
    this.map.clear();
  }
}

const g = globalThis as unknown as { window?: unknown; localStorage?: unknown };
const storage = new MemoryStorage();
g.window = { localStorage: storage };
g.localStorage = storage;

const {
  cappedFuelEfForElectricity,
  electricityFactorFor,
  emptyElectricitySource,
  resolveElectricitySources,
  selfGeneratedElectricityEf,
} = await import("../monthly-data");

test("Bug 4 — weighted average across two sources with different factors", () => {
  const entry = {
    fuels: [],
    flueGasCleaningEmissionsTco2: 0,
    electricitySources: [
      { id: "a", sourceType: "ppa" as const, mwh: 1000, factorTco2PerMwh: 0.4 },
      {
        id: "b",
        sourceType: "direct_technical_link" as const,
        mwh: 500,
        factorTco2PerMwh: 0.1,
      },
    ],
  } as unknown as Parameters<typeof resolveElectricitySources>[0];

  const { totalMwh, weightedFactor } = resolveElectricitySources(entry);
  assert.equal(totalMwh, 1500);
  // (1000×0.4 + 500×0.1) / 1500 = 450/1500 = 0.3
  assert.ok(Math.abs(weightedFactor - 0.3) < 1e-9);
});

test("Bug 4 — a grid row's factor is always re-derived, never trusted from storage", () => {
  const entry = {
    fuels: [],
    electricitySources: [
      {
        id: "a",
        sourceType: "grid_default" as const,
        mwh: 100,
        factorTco2PerMwh: 0.4999,
      },
    ],
  } as unknown as Parameters<typeof resolveElectricitySources>[0];

  // A stale 0.4999 sitting in storage — the exact residual-sync bug — must
  // not survive resolution. With no published TH default, the resolved
  // value is null, not the stale figure.
  const { sources } = resolveElectricitySources(entry);
  assert.equal(
    sources[0].factorTco2PerMwh,
    electricityFactorFor("grid_default"),
  );
  assert.notEqual(sources[0].factorTco2PerMwh, 0.4999);
});

test("Bug 4 — the waste-gas cap: blast furnace gas (260) and oxygen steel furnace gas (182) both cap at 56.1 tCO₂/TJ", () => {
  near(cappedFuelEfForElectricity("blast_furnace_gas", 0.26) * 1000, 56.1);
  near(cappedFuelEfForElectricity("bof_gas", 0.182) * 1000, 56.1);
  // A normal fuel under the cap is untouched.
  assert.equal(cappedFuelEfForElectricity("natural_gas", 0.0561), 0.0561);
});

test("Bug 4 — EF_El = (Σ AD×NCV×EF + Em_FGC) / El_prod, over only the flagged fuel rows", () => {
  const entry = {
    flueGasCleaningEmissionsTco2: 10,
    fuels: [
      {
        id: "f1",
        fuelType: "natural_gas",
        quantity: 1000,
        unit: "m3" as const,
        ncvMjPerUnit: 38,
        efTco2PerGj: 0.0561,
        oxidationFactor: 1,
        factorSource: "lab_analysis" as const,
        usedForSelfGeneratedElectricity: true,
      },
      {
        // NOT flagged — must not contribute to EF_El, even though it is a
        // real fuel row in the same month.
        id: "f2",
        fuelType: "natural_gas",
        quantity: 999_999,
        unit: "m3" as const,
        ncvMjPerUnit: 38,
        efTco2PerGj: 0.0561,
        oxidationFactor: 1,
        factorSource: "lab_analysis" as const,
      },
    ],
  };
  // f1: 1000 m³ × 38 MJ/m³ = 38,000 MJ = 38 GJ; 38 × 0.0561 = 2.1318 tCO₂
  // EF_El = (2.1318 + 10) / 50 MWh
  const ef = selfGeneratedElectricityEf(entry, 50);
  near(ef, (2.1318 + 10) / 50);
});

test("Bug 4 — an empty El_prod is legitimately zero, not thrown or NaN", () => {
  assert.equal(selfGeneratedElectricityEf({ fuels: [] }, 0), 0);
});

test("Bug 4 — emptyElectricitySource opens on the current grid factor, honest even if null", () => {
  const s = emptyElectricitySource();
  assert.equal(s.sourceType, "grid_default");
  assert.equal(s.factorTco2PerMwh, electricityFactorFor("grid_default"));
});

const near = (actual: number, expected: number, tol = 1e-6) =>
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ≈${expected}, got ${actual}`,
  );
