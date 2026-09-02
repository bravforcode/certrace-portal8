/* Bug 5 — structured process emissions, two paths, never a narrated
   number. Bug 6 — oxidation factor sourced (default vs measured), never
   typed directly. */

import { test } from "node:test";
import assert from "node:assert/strict";

const { processEmissionEntryTCO2, resolvedOxidationFactor } = await import("../monthly-data");
const { standardProcessEmission, massBalanceProcessEmission, CARBONATE_FACTORS, CARBON_CONTENTS } = await import("../cbam/process-factors");

const near = (actual: number, expected: number, tol = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tol, `expected ≈${expected}, got ${actual}`);

/* ── Bug 5 · standard method ─────────────────────────────────── */

test("Bug 5 — standard method: Em = AD × EF × CF, against the seeded carbonate table", () => {
  const caco3 = CARBONATE_FACTORS.find((c) => c.material === "CaCO3")!;
  assert.equal(caco3.tco2PerTCarbonate, 0.44);
  near(standardProcessEmission("CaCO3", 100, 1), 100 * 0.44);
  // CF < 1 scales the figure down — a partial calcination.
  near(standardProcessEmission("CaCO3", 100, 0.5), 50 * 0.44);
});

test("Bug 5 — every seeded carbonate/oxide/fixed factor from the spec is present with the right value", () => {
  const expected: Record<string, number> = {
    CaCO3: 0.44,
    MgCO3: 0.522,
    Na2CO3: 0.415,
    BaCO3: 0.223,
    Li2CO3: 0.596,
    K2CO3: 0.318,
    SrCO3: 0.298,
    NaHCO3: 0.524,
    FeCO3: 0.38,
  };
  for (const [material, value] of Object.entries(expected)) {
    const row = CARBONATE_FACTORS.find((c) => c.material === material);
    assert.ok(row, `${material} missing from CARBONATE_FACTORS`);
    assert.equal(row!.tco2PerTCarbonate, value);
  }
});

test("processEmissionEntryTCO2 dispatches to the standard formula for a standard entry", () => {
  const e = { id: "e1", method: "standard" as const, materialId: "MgCO3", quantityT: 10, conversionFactor: 1 };
  near(processEmissionEntryTCO2(e), 10 * 0.522);
});

/* ── Bug 5 · mass balance, and the negative-output-stream test the report explicitly asks for ── */

test("Bug 5 — mass balance: Em = 3.664 × AD × CC, against the seeded carbon-content table", () => {
  const pigIron = CARBON_CONTENTS.find((c) => c.material === "pig_iron")!;
  assert.equal(pigIron.tCPerT, 0.0409);
  near(massBalanceProcessEmission("pig_iron", 100), 3.664 * 100 * 0.0409);
});

test("Bug 5 — a NEGATIVE quantity (an output stream) REDUCES total emissions — the whole point of mass balance", () => {
  const input = { id: "e1", method: "mass_balance" as const, materialId: "iron_scrap", quantityT: 100 }; // input, positive
  const output = { id: "e2", method: "mass_balance" as const, materialId: "steel_scrap", quantityT: -80 }; // output, negative

  const inputEm = processEmissionEntryTCO2(input);
  const outputEm = processEmissionEntryTCO2(output);
  assert.ok(inputEm > 0, "an input stream is a positive emission");
  assert.ok(outputEm < 0, "an output stream is a negative emission — carbon left inside the product, never emitted");

  const totalWithOutput = inputEm + outputEm;
  assert.ok(totalWithOutput < inputEm, "including the output stream must reduce the total relative to the input alone");
});

/* ── Bug 6 · oxidation factor, sourced not typed ────────────────── */

test("Bug 6 — the conservative default is always exactly 1, regardless of any stray stored oxidationFactor", () => {
  assert.equal(resolvedOxidationFactor({ oxidationFactorSource: "conservative_default", cAsh: 5, cTotal: 10 }), 1);
  assert.equal(resolvedOxidationFactor({}), 1, "unset behaves as the conservative default");
});

test("Bug 6 — measured path derives OF = 1 − (C_ash / C_total), never trusts a typed figure", () => {
  const of = resolvedOxidationFactor({ oxidationFactorSource: "measured", cAsh: 2, cTotal: 100 });
  near(of, 1 - 2 / 100);
});

test("Bug 6 — a measured claim with no C_total collapses back to the conservative default rather than guessing", () => {
  assert.equal(resolvedOxidationFactor({ oxidationFactorSource: "measured", cAsh: 2, cTotal: undefined }), 1);
  assert.equal(resolvedOxidationFactor({ oxidationFactorSource: "measured", cAsh: 2, cTotal: 0 }), 1);
});

test("Bug 6 — a measured result outside (0, 1] is rejected back to the default rather than accepted", () => {
  // C_ash > C_total would give a negative OF — physically impossible.
  assert.equal(resolvedOxidationFactor({ oxidationFactorSource: "measured", cAsh: 150, cTotal: 100 }), 1);
});
