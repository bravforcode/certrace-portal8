/* ════════════════════════════════════════════════════════════
   THE ACCEPTANCE TEST — Bug 9's own worked example, pinned

   500,000 m³ natural gas (density 0.717 kg/Nm³), 1,200 t coking coal,
   800 t purchased pig iron at SEE 1.85 tCO₂e/t with a valid verification
   report, 2,000 t crude steel produced.

     Natural gas: 500,000 × 0.717 = 358,500 kg = 358.5 t
                  358.5 × 0.048 TJ/t = 17.208 TJ
                  17.208 × 56.1 = 965.37 tCO₂
     Coking coal: 1,200 × 0.0282 TJ/t = 33.84 TJ
                  33.84 × 94.6 = 3,201.26 tCO₂
     Attributed:  4,166.63 tCO₂
     ae_g:        4,166.63 / 2,000 = 2.08332
     m_pig iron:  800 / 2,000 = 0.4
     SEE_g:       2.08332 + (0.4 × 1.85) = 2.82332 tCO₂e/t

   Expected: 4,167 tCO₂e total, SEE 2.82332 tCO₂e/t. Omitting the precursor
   yields 2.08332 — 26% low, which is the cost of Bug 9 shipping unfixed.

   THE INPUT CHOICE: the report's own 500,000 m³ × 0.717 kg/Nm³ pre-converts
   to 358.5 t, entered here directly in tonnes. That sidesteps needing this
   fixture's density to match the seeded FUEL_DENSITY table's own natural-gas
   figure (0.7156, not 0.717 — a different but equally defensible reference
   value) — kgPerUnit("t") is always 1000 regardless of fuel, so a mass-basis
   entry tests the EF/NCV conversion chain without the density table being
   part of what this specific test is pinning down. The natural gas and
   coking coal figures given ARE Point G's own Natural gas / Coking coal
   rows exactly (56.1 tCO₂/TJ · 48.0 GJ/t and 94.6 tCO₂/TJ · 28.2 GJ/t) — so
   this fixture uses `factorSource: "eu_standard"` and `applyEuStandard`,
   exercising Bug 1's fix, Bug 2's conversion, and Bug 9's precursor formula
   together through real production code, not a parallel re-implementation. */

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

const { applyEuStandard, emptyMonth, saveMonth } = await import("../monthly-data");
const { emptySupplier, saveSupplier } = await import("../precursor-suppliers");
const { workspaceSEE } = await import("../workspace-see");
const { createWorkspace } = await import("../workspace");

function seedAcceptanceWorkspace() {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-STEEL-1", installationName: "Rayong Steelworks", productId: "billet", productionRoute: "bf_bof", year: 2026 });

  const naturalGas = applyEuStandard({
    id: "f-ng",
    fuelType: "natural_gas",
    quantity: 358.5,
    unit: "t",
    efTco2PerGj: 0,
    factorSource: "eu_standard",
    oxidationFactor: 1,
  });
  const cokingCoal = applyEuStandard({
    id: "f-coal",
    fuelType: "coking_coal",
    quantity: 1200,
    unit: "t",
    efTco2PerGj: 0,
    factorSource: "eu_standard",
    oxidationFactor: 1,
  });

  saveMonth({
    ...emptyMonth(ws.id, "2026-01"),
    month: "2026-01",
    productionTonnes: 2000,
    fuels: [naturalGas, cokingCoal],
    status: "submitted",
    submittedAt: "2026-02-01T00:00:00.000Z",
    submittedBy: "Test",
  });

  return ws;
}

function addVerifiedPigIron(workspaceId: string) {
  saveSupplier({
    ...emptySupplier(workspaceId, null),
    name: "Chonburi Foundry",
    installationName: "Chonburi Works",
    country: "TH",
    origin: "purchased",
    precursorName: "Pig iron",
    dataOrigin: "supplier_verified",
    seeTco2ePerT: 1.85,
    verificationReportFileId: "ev-pig-iron-2026",
    reportingPeriodStart: "2026-01-01",
    reportingPeriodEnd: "2026-12-31",
    monthlyQuantities: [{ month: "2026-01", tonnes: 800 }],
  });
}

test("Bug 1/2 — the acceptance fixture's fuel rows lock to Point G's own natural gas / coking coal figures", () => {
  const ws = seedAcceptanceWorkspace();
  const see = workspaceSEE(ws);
  assert.ok(see.computable, "2,000 t of production makes every per-tonne figure computable");
  // 965.37 + 3,201.26 tCO₂, full precision — the spec's own rounding is
  // display-only, so this checks the unrounded sum before the ceremony below
  // rounds it to whole tonnes.
  assert.ok(Math.abs(see.fuelTCO2 - 4166.6328) < 0.01, `fuel tCO₂ should be ≈4166.63, got ${see.fuelTCO2}`);
});

test("Bug 9 — acceptance test: 4,167 tCO₂e total, SEE_g 2.82332 tCO₂e/t, with the purchased precursor counted", () => {
  const ws = seedAcceptanceWorkspace();
  addVerifiedPigIron(ws.id);

  const see = workspaceSEE(ws);

  // Total emissions per reporting period, rounded to whole tonnes — the
  // cross-cutting rounding rule, applied only at the display edge.
  const totalTCO2Whole = Math.round(see.directTCO2 + see.indirectTCO2);
  assert.equal(totalTCO2Whole, 4167, "the attributed total, rounded to whole tonnes");

  // SEE — never rounded past 5 decimal places.
  const seeG = Number(see.seeTotal.toFixed(5));
  assert.equal(seeG, 2.82332, "SEE_g = ae_g + Σ(m_i × SEE_i)");
  assert.equal(Number(see.seeChargeable.toFixed(5)), 2.82332, "chargeable equals total here — indirect is zero, so nothing to exclude");
});

test("Bug 9 — omitting the precursor understates SEE by ~26%, which is the cost of the bug", () => {
  const ws = seedAcceptanceWorkspace();
  // No addVerifiedPigIron call — the precursor is never recorded.

  const withoutPrecursor = workspaceSEE(ws);
  const aeG = Number(withoutPrecursor.seeTotal.toFixed(5));
  assert.equal(aeG, 2.08332, "ae_g alone, with no precursor contribution");

  const wsWith = seedAcceptanceWorkspace();
  addVerifiedPigIron(wsWith.id);
  const withPrecursor = workspaceSEE(wsWith);
  const seeG = withPrecursor.seeTotal;

  const relativeGap = (seeG - withoutPrecursor.seeTotal) / seeG;
  assert.ok(Math.abs(relativeGap - 0.2621) < 0.001, `expected the omitted precursor to understate SEE by ~26.2%, got ${(relativeGap * 100).toFixed(1)}%`);
});
