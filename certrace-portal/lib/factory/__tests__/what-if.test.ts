import test from "node:test";
import assert from "node:assert/strict";
import { compareWhatIf, goodsCategoryOfCn, scenarioOpportunity, whatIf, type WhatIfInput } from "../what-if";
import { defaultFor } from "../../cbam/precursor-basis";
import { toCurrency } from "../../cbam/carbon-cost-model";
import type { EmissionEstimate } from "../../workbook/estimate";

const near = (a: number | null, b: number) => assert.ok(a !== null && Math.abs(a - b) < 1e-9, `${a} != ${b}`);

const e: EmissionEstimate = {
  productionT: 1000, directT: 200, indirectT: 300, indirectExcludedT: 0, precursorT: 1800, totalT: 2300, perTonne: 2.3,
  byStep: {}, unmatched: [], notes: [], biomass: false,
  precursors: [{ key: "materials:0", item: "Wire rod", cn: "72139110", tonnes: 1000, defaultSee: 1.8, step: "Drawing" }],
};
const base: WhatIfInput = {
  productionT: 1000, exportedT: 500, priceEur: 80, category: "Iron & Steel", productCn: "72172000", year: 2026, precursorActual: {},
};

test("steel ignores indirect emissions and prices exported tonnes", () => {
  const r = whatIf(e, base);
  near(r.chargeablePerTonne, 0.2 + 1.8);
  near(r.certificatesT, 1000);
  near(r.costEur, 80_000);
});
test("cement counts indirect emissions (INDIRECT_CHARGEABLE.Cement = true)", () => {
  near(whatIf(e, { ...base, category: "Cement" }).chargeablePerTonne, 0.2 + 0.3 + 1.8);
});
test("an unknown category (no CN yet) counts indirect emissions, as the estimate does", () => {
  near(whatIf(e, { ...base, category: null }).chargeablePerTonne, 0.2 + 0.3 + 1.8);
});
test("a supplier's actual precursor value replaces the default", () => {
  const { deltaEur, deltaT, next } = compareWhatIf(e, base, { ...base, precursorActual: { "materials:0": 0.9 } });
  near(next.chargeablePerTonne, 0.2 + 0.9);
  near(deltaEur, -36_000);
  near(deltaT, (0.2 + 0.9 - (0.2 + 1.8)) * 500);
});
test("default comparison uses the CN default total once", () => {
  const d = defaultFor("72172000", undefined, 2026)!;
  const r = whatIf(e, base);
  near(r.defaultCostEur, d.total * 500 * 80);
  near(r.savingVsDefaultEur, d.total * 500 * 80 - r.costEur);
});
test("no default for the CN leaves the default comparison null", () => {
  const r = whatIf(e, { ...base, productCn: "" });
  assert.equal(r.defaultPerTonne, null);
  assert.equal(r.defaultCostEur, null);
  assert.equal(r.savingVsDefaultEur, null);
});
test("no production means no intensity: every value is zero", () => {
  const r = whatIf({ ...e, productionT: 0 }, base);
  assert.equal(r.costEur, 0);
  assert.equal(r.certificatesT, 0);
  assert.equal(r.perTonne, 0);
});
test("no price gives zero cost, not NaN", () => {
  const r = whatIf(e, { ...base, priceEur: Number.NaN });
  assert.equal(r.costEur, 0);
  assert.ok(Number.isFinite(r.savingVsDefaultEur ?? 0));
});
test("exported tonnes are clamped to production", () => {
  near(whatIf(e, { ...base, exportedT: 5000 }).certificatesT, (0.2 + 1.8) * 1000);
});
test("a precursor override applies to the scenario only, never to the base", () => {
  const { base: a } = compareWhatIf(e, base, { ...base, precursorActual: { "materials:0": 0.9 } });
  near(a.chargeablePerTonne, 0.2 + 1.8);
});
test("EUR results convert to the chosen currency with the cost page rates", () => {
  const rates = { THB: 38, EUR: 1, CNY: 7.8, INR: 95 };
  near(toCurrency(80_000, "THB", { rates }), 80_000 * 38);
  near(toCurrency(80_000, "EUR", { rates }), 80_000);
});
test("CN to goods category: steel, cement, and unknown CNs", () => {
  assert.equal(goodsCategoryOfCn("7206"), "Iron & Steel");
  assert.equal(goodsCategoryOfCn("252310"), "Cement");
  assert.equal(goodsCategoryOfCn("8471"), null);
  assert.equal(goodsCategoryOfCn(""), null);
});
test("the saved card is keyed by installation, year and scenario, and saves the change against today", () => {
  const next = { ...base, precursorActual: { "materials:0": 0.9 } };
  const { deltaEur, deltaT } = compareWhatIf(e, base, next);
  const a = scenarioOpportunity({ installationId: "i1", year: 2026, input: next, savingEur: -deltaEur, savingT: -deltaT });
  const b = scenarioOpportunity({ installationId: "i1", year: 2026, input: next, savingEur: -deltaEur, savingT: -deltaT });
  assert.equal(a.key, b.key);
  assert.ok(a.key.startsWith("what-if:i1:2026:"));
  assert.equal(a.source, "what-if");
  assert.equal(a.href, "/dashboard");
  near(a.impactEur, 36_000);
  assert.equal(a.text?.key, "Scenario saves €{eur} a year");
  const c = scenarioOpportunity({ installationId: "i1", year: 2026, input: { ...next, exportedT: 400 }, savingEur: 1, savingT: 1 });
  assert.notEqual(a.key, c.key);
});
