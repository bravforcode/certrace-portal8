/* ════════════════════════════════════════════════════════════
   THE PARITY FIXTURE, READ FROM OUTSIDE THIS PACKAGE

   docs/fixtures/golden-eaf-2026.json is not the portal's file. It sits at the
   repo root because certrace-backend/tests/test_parity_golden.py reads the
   same bytes, and the whole point is that neither engine owns the answers.

   This suite asserts two different things, and they are not the same thing:

     1. THE ENGINE REPRODUCES THE SHARED EXPECTATIONS. lib/cbam/__tests__/
        engine.test.ts already asserts the golden numbers — but against the
        TypeScript fixture next to it, which is the portal's own copy. If the
        two copies ever disagree, engine.test.ts stays green while the backend
        is being held to different numbers. So the expectations are re-asserted
        here from the shared file.

     2. THE TYPED FIXTURE HAS NOT DRIFTED FROM THE SHARED FILE. golden.ts is
        what five other test files import, and it is far more convenient to
        write against than raw JSON, so it stays. What it may not do is
        quietly diverge: every input it carries is compared field by field
        against the JSON below.

   Which makes the JSON the source of truth for what the number IS, and
   golden.ts a typed view of it that cannot drift without this failing.
   ════════════════════════════════════════════════════════════ */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { runEngine, totalSEE, perBuyerTotals, defaultExposure, indirectIsChargeable, type GoodsCategory } from "../engine";
import { precursorSEE, massBalanceYield } from "../precursor-tree";
import { CO2_PER_C } from "../units";
import { goldenDataset, goldenPrecursorTree, GOLDEN_SHIPMENTS, GOLDEN_INPUTS, GOLDEN_EXPECTED } from "../__fixtures__/golden";

/* The path is relative to this file, not to the working directory, so the
   suite behaves the same whether it is run from the package root or by an
   editor's test runner. */
const FIXTURE_PATH = new URL("../../../../docs/fixtures/golden-eaf-2026.json", import.meta.url);

type Fixture = {
  sector: string;
  route: string;
  goodsCategory: GoodsCategory;
  reportingYear: number;
  inputs: {
    production: { value: number };
    fuels: { id: string; quantity: number; unit: string; ncv: number; emissionFactor: number; oxidationFactor: number }[];
    processEmissions: { id: string; massTonnes: number; carbonContent: number; conversionFactor: number }[];
    electricity: { id: string; mwhAbsolute: number; emissionFactor: number }[];
    precursors: { id: string; qtyPerTonneOutput: number; isScrap: boolean; seeDeclared: number }[];
    shipments: { buyer: string; date: string; quantityTonnes: number }[];
    exposure: { defaultValue: number; certificatePrice: number; markup: number };
  };
  expected: Record<string, number | boolean>;
  tolerance: { ratio: number; mass: number; currency: number };
  backend: { unsupported: { line: string; reason: string }[] };
};

const fixture = JSON.parse(readFileSync(FIXTURE_PATH, "utf8")) as Fixture;
const E = fixture.expected as Record<string, number>;
const TOL = fixture.tolerance;

const closeTo = (actual: number, expected: number, tol: number, what: string) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${what}: shared fixture says ${expected}, engine says ${actual} (Δ ${Math.abs(actual - expected)})`);

/* ── 1 · The engine against the shared expectations ────────────── */

test("shared fixture — direct emissions", () => {
  const r = runEngine(goldenDataset(), goldenPrecursorTree(), fixture.goodsCategory);
  closeTo(r.direct.fuelTCO2, E.fuelTCO2, TOL.mass, "fuel tCO₂");
  closeTo(r.direct.processTCO2, E.processTCO2, TOL.mass, "process tCO₂");
  closeTo(r.direct.total, E.directTCO2, TOL.mass, "direct tCO₂");
  closeTo(r.direct.perTonne, E.directSpecific, TOL.ratio, "SEE direct");
});

test("shared fixture — indirect emissions", () => {
  const r = runEngine(goldenDataset(), goldenPrecursorTree(), fixture.goodsCategory);
  closeTo(r.indirect.total, E.indirectTCO2, TOL.mass, "indirect tCO₂");
  closeTo(r.indirect.perTonne, E.indirectSpecific, TOL.ratio, "SEE indirect");
  closeTo(r.indirect.mwhPerTonne, E.electricityIntensityMWhPerTonne, TOL.ratio, "MWh per tonne");
});

test("shared fixture — precursors, scrap at zero", () => {
  const p = precursorSEE(goldenPrecursorTree());
  closeTo(p.perTonne, E.precursorSpecific, TOL.ratio, "SEE precursor");
  assert.equal(p.byNode.find((n) => n.id === "scrap")!.contribution, 0, "scrap carries no embedded carbon");
  closeTo(massBalanceYield(goldenPrecursorTree())! * 100, E.massBalanceYieldPct, 0.01, "mass-balance yield %");
});

test("shared fixture — reported and chargeable are two numbers", () => {
  const t = totalSEE(goldenDataset(), goldenPrecursorTree(), fixture.goodsCategory);
  closeTo(t.reported, E.reportedSpecific, TOL.ratio, "SEE reported");
  closeTo(t.chargeable, E.chargeableSpecific, TOL.ratio, "SEE chargeable");

  /* The Annex II rule, asserted from the shared file rather than from either
     engine's own map — this is the exact line the backend had inconsistent
     between two aluminium routes. */
  assert.equal(t.indirectCounted, fixture.expected.indirectChargeable);
  assert.equal(indirectIsChargeable(fixture.goodsCategory), fixture.expected.indirectChargeable);
  assert.notEqual(E.reportedSpecific, E.chargeableSpecific, "a fixture where the two coincide would not test the rule at all");
});

test("shared fixture — buyer totals and default-value exposure", () => {
  const chargeable = totalSEE(goldenDataset(), goldenPrecursorTree(), fixture.goodsCategory).chargeable;

  const rows = perBuyerTotals(
    fixture.inputs.shipments.map((s) => ({ ...s, declarationId: "golden-eaf-2026" })),
    () => chargeable,
  );
  assert.equal(rows.length, 1);
  closeTo(rows[0].tonnes, E.buyerATonnes, 1e-9, "Buyer A tonnes");
  closeTo(rows[0].embeddedTCO2e, E.buyerATCO2e, 1e-3, "Buyer A embedded tCO₂e");

  const x = defaultExposure({
    defaultValue: fixture.inputs.exposure.defaultValue,
    chargeableSEE: chargeable,
    quantityTonnes: E.buyerATonnes,
    certificatePrice: fixture.inputs.exposure.certificatePrice,
    markup: fixture.inputs.exposure.markup,
  });
  closeTo(x.delta, E.exposureDelta, TOL.ratio, "exposure delta");
  closeTo(x.tCO2e, E.exposureTCO2e, 1e-3, "exposure tCO₂e");
  closeTo(x.currency, E.exposureCurrency, TOL.currency, "exposure currency");
});

/* ── 2 · The typed fixture has not drifted ─────────────────────── */

test("golden.ts inputs match the shared fixture field by field", () => {
  const dataset = goldenDataset();
  const tree = goldenPrecursorTree();
  const f = fixture.inputs;

  assert.equal(dataset.annualProductionTonnes, f.production.value, "production");

  assert.equal(dataset.fuels.length, f.fuels.length, "fuel row count");
  for (const [i, row] of f.fuels.entries()) {
    const fuel = dataset.fuels[i];
    assert.equal(fuel.quantity, row.quantity, `fuel[${i}] quantity`);
    assert.equal(fuel.unit, row.unit, `fuel[${i}] unit`);
    assert.equal(fuel.ncv, row.ncv, `fuel[${i}] NCV`);
    assert.equal(fuel.emissionFactor, row.emissionFactor, `fuel[${i}] emission factor`);
    assert.equal(fuel.oxidationFactor, row.oxidationFactor, `fuel[${i}] oxidation factor`);
  }

  assert.equal(dataset.processEmissions.length, f.processEmissions.length, "process row count");
  for (const [i, row] of f.processEmissions.entries()) {
    assert.equal(dataset.processEmissions[i].massTonnes, row.massTonnes, `process[${i}] mass`);
    assert.equal(dataset.processEmissions[i].carbonContent, row.carbonContent, `process[${i}] carbon content`);
    /* The conversion factor is not a field on the row — it is the engine's
       constant, and the fixture states it so both engines can be held to the
       same 3.664 rather than one of them quietly using 44/12 = 3.6667. */
    assert.equal(CO2_PER_C.value, row.conversionFactor, `process[${i}] tCO₂/tC constant`);
  }

  assert.equal(dataset.electricity.length, f.electricity.length, "electricity row count");
  for (const [i, row] of f.electricity.entries()) {
    assert.equal(dataset.electricity[i].mwhAbsolute, row.mwhAbsolute, `electricity[${i}] MWh`);
    assert.equal(dataset.electricity[i].emissionFactor, row.emissionFactor, `electricity[${i}] factor`);
  }

  assert.equal(tree.length, f.precursors.length, "precursor row count");
  for (const [i, row] of f.precursors.entries()) {
    assert.equal(tree[i].id, row.id, `precursor[${i}] id`);
    assert.equal(tree[i].qtyPerTonneOutput, row.qtyPerTonneOutput, `precursor[${i}] qty per tonne`);
    assert.equal(tree[i].isScrap, row.isScrap, `precursor[${i}] scrap flag`);
    assert.equal(tree[i].seeDeclared, row.seeDeclared, `precursor[${i}] declared SEE`);
  }

  assert.deepEqual(
    GOLDEN_SHIPMENTS.map((s) => ({ buyer: s.buyer, date: s.date, quantityTonnes: s.quantityTonnes })),
    f.shipments,
    "shipments",
  );

  assert.equal(GOLDEN_EXPECTED.D_default_UNVERIFIED, f.exposure.defaultValue, "exposure default value");
  assert.equal(GOLDEN_EXPECTED.P_cert_UNDECIDED, f.exposure.certificatePrice, "exposure certificate price");
  assert.equal(GOLDEN_EXPECTED.markup2026, f.exposure.markup, "exposure markup");
  assert.equal(GOLDEN_INPUTS.Q_prod, f.production.value, "GOLDEN_INPUTS production");
});

test("golden.ts expectations match the shared fixture", () => {
  const G = GOLDEN_EXPECTED;
  assert.equal(G.E_gas_GJ, E.fuelEnergyGJ, "fuel energy GJ");
  assert.equal(G.E_gas_tCO2, E.fuelTCO2, "fuel tCO₂");
  assert.equal(G.E_process_tCO2, E.processTCO2, "process tCO₂");
  assert.equal(G.E_direct_tCO2, E.directTCO2, "direct tCO₂");
  assert.equal(G.SEE_dir, E.directSpecific, "SEE direct");
  assert.equal(G.E_indirect_tCO2, E.indirectTCO2, "indirect tCO₂");
  assert.equal(G.SEE_ind, E.indirectSpecific, "SEE indirect");
  assert.equal(G.SEE_prec, E.precursorSpecific, "SEE precursor");
  assert.equal(G.SEE_total_reported, E.reportedSpecific, "SEE reported");
  assert.equal(G.SEE_total_chargeable, E.chargeableSpecific, "SEE chargeable");
  assert.equal(G.T_buyerA_tonnes, E.buyerATonnes, "Buyer A tonnes");
  assert.equal(G.T_buyerA_tCO2e, E.buyerATCO2e, "Buyer A tCO₂e");
  assert.equal(G.massBalanceYieldPct, E.massBalanceYieldPct, "mass-balance yield %");
  assert.equal(G.electricityIntensityMWhPerT, E.electricityIntensityMWhPerTonne, "MWh per tonne");
  assert.equal(G.exposure_delta, E.exposureDelta, "exposure delta");
  assert.equal(G.exposure_tCO2e, E.exposureTCO2e, "exposure tCO₂e");
  assert.equal(G.exposure_EUR, E.exposureCurrency, "exposure currency");
});

/* ── 3 · The gap register is not decoration ───────────────────── */

test("the backend gap register still names the lines the portal alone can produce", () => {
  const lines = fixture.backend.unsupported.map((u) => u.line);

  /* If someone empties this list without moving the arithmetic, the two
     engines are being declared equivalent on paper only — and the backend
     parity test is the one that proves otherwise. Keep them pointing at each
     other. */
  assert.ok(lines.includes("fuelTCO2"), "fuel combustion is still portal-only");
  assert.ok(lines.includes("processTCO2"), "process emissions are still portal-only");
  for (const entry of fixture.backend.unsupported) {
    assert.ok(entry.reason.length > 40, `gap "${entry.line}" needs a reason a reader can act on, not a label`);
  }
});
