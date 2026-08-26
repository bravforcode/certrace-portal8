/* The golden fixture, asserted end to end (spec §5.6 + §8 definition of done).

   Tolerance is 1e-6 on ratios and 0.01 on currency, as specified. Anything
   that moves a number here has changed what the portal would file. */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  directSEE,
  indirectSEE,
  totalSEE,
  perBuyerTotals,
  defaultExposure,
  runEngine,
  indirectIsChargeable,
  EngineError,
  ENGINE_VERSION,
} from "../engine";
import { precursorSEE, massBalanceYield } from "../precursor-tree";
import { UnitError } from "../units";
import { FUEL_EF_BAND } from "../reference";
import { goldenDataset, goldenPrecursorTree, GOLDEN_SHIPMENTS, GOLDEN_EXPECTED as E, GOLDEN_INPUTS } from "../__fixtures__/golden";

const RATIO_TOL = 1e-6;
const MONEY_TOL = 0.01;

const closeTo = (actual: number, expected: number, tol: number, what: string) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${what}: expected ${expected}, got ${actual} (Δ ${Math.abs(actual - expected)})`);

test("F1 — direct emissions and SEE_dir", () => {
  const d = directSEE(goldenDataset());

  // 148,800 m³ × 0.0383 GJ/m³ = 5,699.04 GJ → × 0.0561 tCO₂/GJ = 319.7161 tCO₂
  closeTo(d.fuelTCO2, E.E_gas_tCO2, 1e-4, "fuel combustion tCO₂");
  // 22.05 t × 1.00 × 44/12 = 80.7912 tCO₂
  closeTo(d.processTCO2, E.E_process_tCO2, 1e-4, "process tCO₂");
  closeTo(d.total, E.E_direct_tCO2, 1e-4, "total direct tCO₂");
  closeTo(d.perTonne, E.SEE_dir, RATIO_TOL, "SEE_dir");
});

test("F2 — indirect emissions and SEE_ind", () => {
  const i = indirectSEE(goldenDataset());
  closeTo(i.total, E.E_indirect_tCO2, 1e-4, "total indirect tCO₂");
  closeTo(i.perTonne, E.SEE_ind, RATIO_TOL, "SEE_ind");
  closeTo(i.mwhPerTonne, E.electricityIntensityMWhPerT, RATIO_TOL, "electricity intensity");
});

test("F3 — precursor contribution, scrap zero-rated", () => {
  const p = precursorSEE(goldenPrecursorTree());
  closeTo(p.perTonne, E.SEE_prec, RATIO_TOL, "SEE_prec");
  assert.equal(p.byNode.find((n) => n.id === "scrap")!.contribution, 0);
  closeTo(massBalanceYield(goldenPrecursorTree())! * 100, E.massBalanceYieldPct, 0.01, "mass-balance yield %");
});

test("F4 — reported vs chargeable, steel excludes indirect", () => {
  const t = totalSEE(goldenDataset(), goldenPrecursorTree(), "Iron & Steel");
  closeTo(t.reported, E.SEE_total_reported, RATIO_TOL, "SEE_total_reported");
  closeTo(t.chargeable, E.SEE_total_chargeable, RATIO_TOL, "SEE_total_chargeable");
  assert.equal(t.indirectCounted, false);

  // The sector rule is one map, and it genuinely differs by category.
  assert.equal(indirectIsChargeable("Iron & Steel"), false);
  assert.equal(indirectIsChargeable("Aluminium"), false);
  assert.equal(indirectIsChargeable("Cement"), true);

  const cement = totalSEE(goldenDataset(), goldenPrecursorTree(), "Cement");
  closeTo(cement.chargeable, E.SEE_total_reported, RATIO_TOL, "cement charges indirect too");
});

test("F5 — Buyer A's 136.0 t comes to 18.1075 tCO₂e", () => {
  const chargeable = totalSEE(goldenDataset(), goldenPrecursorTree(), "Iron & Steel").chargeable;
  const rows = perBuyerTotals(GOLDEN_SHIPMENTS, () => chargeable);

  assert.equal(rows.length, 1);
  closeTo(rows[0].tonnes, E.T_buyerA_tonnes, 1e-9, "Buyer A tonnes");
  closeTo(rows[0].embeddedTCO2e, E.T_buyerA_tCO2e, 1e-3, "Buyer A embedded tCO₂e");
  assert.equal(rows[0].unpricedTonnes, 0);
});

test("F5 — a shipment with no figure for its date is unpriced, never zero", () => {
  const rows = perBuyerTotals(GOLDEN_SHIPMENTS, (_declId, date) => (date < "2026-02-01" ? 0.1331436 : null));
  closeTo(rows[0].unpricedTonnes, 38.7 + 52.1, 1e-9, "unpriced tonnes");
  closeTo(rows[0].embeddedTCO2e, 45.2 * 0.1331436, 1e-6, "only the priced shipment counts");
});

test("F5 — pending shipments never reach a buyer total", () => {
  const rows = perBuyerTotals([{ buyer: "Buyer A", date: "2026-01-18", declarationId: null, quantityTonnes: 99 }], () => 1);
  assert.equal(rows.length, 0);
});

test("F6 — default-value exposure is a penalty, and negative delta is a cost", () => {
  const chargeable = totalSEE(goldenDataset(), goldenPrecursorTree(), "Iron & Steel").chargeable;
  const x = defaultExposure({
    defaultValue: E.D_default_UNVERIFIED,
    chargeableSEE: chargeable,
    quantityTonnes: E.T_buyerA_tonnes,
    certificatePrice: E.P_cert_UNDECIDED,
    markup: E.markup2026,
  });

  closeTo(x.delta, E.exposure_delta, RATIO_TOL, "delta");
  closeTo(x.tCO2e, E.exposure_tCO2e, 1e-3, "exposure tCO₂e");
  closeTo(x.currency, E.exposure_EUR, MONEY_TOL, "exposure EUR");
  assert.equal(x.worseThanDefault, false);

  // An installation dirtier than the default: the sign flips and it is a cost.
  const worse = defaultExposure({ defaultValue: 1.0, chargeableSEE: 1.5, quantityTonnes: 100, certificatePrice: 75, markup: 0.1 });
  assert.equal(worse.worseThanDefault, true);
  assert.ok(worse.currency < 0, "a worse-than-default installation shows an added cost, not a negative saving");
});

test("wrong-unit regression guard — EF as tCO₂/m³ is out of band by ~25×", () => {
  /* The trap: 0.0561 is the genuine natural-gas factor per GJ. Read as a
     factor per m³ it is not a rounding error, it is a different order of
     magnitude — and the arithmetic alone will not notice. */
  const band = FUEL_EF_BAND.natural_gas;
  const correct = GOLDEN_INPUTS.EF_gas;
  assert.ok(correct >= band.low && correct <= band.high, "the real factor sits inside the band");

  // Treating the quantity as if the factor were per m³: 148,800 × 0.0561.
  const wrongTotal = GOLDEN_INPUTS.Q_gas * correct;
  const ratio = wrongTotal / E.E_gas_tCO2;
  assert.ok(ratio > 20 && ratio < 30, `expected ≈25× overstatement, got ${ratio.toFixed(1)}×`);

  /* And the shape that WOULD reach the engine — an EF big enough to stand in
     for a per-m³ reading — falls outside the plausibility band, which is what
     validation V2 keys off. */
  const efAsPerM3 = correct / GOLDEN_INPUTS.NCV_gas; // ≈1.465 tCO₂/GJ-equivalent
  assert.ok(efAsPerM3 > band.high, "a per-m³ factor is far above the per-GJ band");
});

test("a fuel row in m³ with no NCV refuses to compute", () => {
  const d = goldenDataset();
  d.fuels[0].ncv = undefined;
  assert.throws(() => directSEE(d), UnitError);
});

test("a missing production denominator throws rather than dividing by zero", () => {
  const d = goldenDataset();
  d.annualProductionTonnes = 0;
  assert.throws(() => directSEE(d), (err: unknown) => err instanceof EngineError && err.code === "NO_DENOMINATOR");
  assert.throws(() => indirectSEE(d), EngineError);
});

test("runEngine composes the same numbers as the individual formulas", () => {
  const r = runEngine(goldenDataset(), goldenPrecursorTree(), "Iron & Steel");
  closeTo(r.direct.perTonne, E.SEE_dir, RATIO_TOL, "SEE_dir");
  closeTo(r.indirect.perTonne, E.SEE_ind, RATIO_TOL, "SEE_ind");
  closeTo(r.precursor.perTonne, E.SEE_prec, RATIO_TOL, "SEE_prec");
  closeTo(r.totals.chargeable, E.SEE_total_chargeable, RATIO_TOL, "chargeable");
  assert.equal(r.productionTonnes, GOLDEN_INPUTS.Q_prod);
  assert.match(ENGINE_VERSION, /^cbam-engine\/\d+\.\d+\.\d+$/);
});

test("nothing rounds in the middle — full float precision survives the chain", () => {
  const r = runEngine(goldenDataset(), goldenPrecursorTree(), "Iron & Steel");
  // If any step rounded to 2dp the reported total would land exactly on 0.36.
  assert.notEqual(r.totals.reported, 0.36);
  assert.ok(String(r.totals.reported).length > 6, "carries more than display precision");
});
