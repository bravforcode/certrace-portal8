import test from "node:test";
import assert from "node:assert/strict";
import { changedInputs, compareWhatIf, scenarioKey, scenarioOpportunity, whatIf, type WhatIfInput } from "../what-if";
import { defaultFor } from "../../cbam/precursor-basis";
import { toCurrency } from "../../cbam/carbon-cost-model";
import type { EmissionEstimate } from "../../workbook/estimate";

const near = (a: number | null, b: number) => assert.ok(a !== null && Math.abs(a - b) < 1e-9, `${a} != ${b}`);

/* Estimate with indirect counted (as for cement, or sintered ore) */
const e: EmissionEstimate = {
  productionT: 1000, directT: 200, indirectT: 300, indirectExcludedT: 0, precursorT: 1800, totalT: 2300, perTonne: 2.3,
  byStep: {}, unmatched: [], notes: [], biomass: false,
  precursors: [{ key: "materials:0", item: "Wire rod", cn: "72139110", tonnes: 1000, defaultSee: 1.8, step: "Drawing" }],
};
/* Estimate for a direct-only good: the estimate itself already gives indirectT 0 */
const direct: EmissionEstimate = { ...e, indirectT: 0, indirectExcludedT: 300, totalT: 2000, perTonne: 2 };

const base: WhatIfInput = { exportedT: 500, priceEur: 80, productCn: "72172000", year: 2026, precursorActual: {} };

test("direct-only goods: the estimate carries no indirect, so chargeable is direct plus precursor", () => {
  const r = whatIf(direct, base);
  near(r.chargeablePerTonne, 0.2 + 1.8);
  near(r.certificatesT, 1000);
  near(r.costEur, 80_000);
});
test("indirect comes from the estimate as it stands", () => {
  near(whatIf(e, base).chargeablePerTonne, 0.2 + 0.3 + 1.8);
});
test("sintered ore (CN 2601 12 00): indirect counts, and an unchanged scenario equals today", () => {
  const sinter = { ...base, productCn: "26011200" };
  const { base: today, next, deltaEur, deltaT } = compareWhatIf(e, sinter, sinter);
  near(today.chargeablePerTonne, 0.2 + 0.3 + 1.8);
  near(today.costEur, 2.3 * 500 * 80);
  assert.equal(deltaEur, 0);
  assert.equal(deltaT, 0);
  assert.equal(next.costEur, today.costEur);
});
test("a supplier's actual precursor value replaces the default", () => {
  const { deltaEur, deltaT, next } = compareWhatIf(e, base, { ...base, precursorActual: { "materials:0": 0.9 } });
  near(next.chargeablePerTonne, 0.2 + 0.3 + 0.9);
  near(deltaT, (0.9 - 1.8) * 500);
  near(deltaEur, (0.9 - 1.8) * 500 * 80);
});
test("default comparison uses the CN default total once", () => {
  const d = defaultFor("72172000", undefined, 2026)!;
  const r = whatIf(direct, base);
  near(r.defaultCostEur, d.total * 500 * 80);
  near(r.savingVsDefaultEur, d.total * 500 * 80 - (r.costEur ?? NaN));
});
test("no default for the CN leaves the default comparison null", () => {
  const r = whatIf(direct, { ...base, productCn: "" });
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
test("a cleared price gives null cost and null comparisons, never zero", () => {
  const r = whatIf(e, { ...base, priceEur: null });
  assert.equal(r.costEur, null);
  assert.equal(r.savingVsDefaultEur, null);
  assert.equal(r.defaultCostEur, null);
  near(r.certificatesT, 2.3 * 500);
  assert.equal(compareWhatIf(e, base, { ...base, priceEur: null }).deltaEur, null);
});
test("a cleared or NaN export gives null tonnes and cost", () => {
  for (const exportedT of [null, Number.NaN]) {
    const r = whatIf(e, { ...base, exportedT });
    assert.equal(r.certificatesT, null);
    assert.equal(r.costEur, null);
  }
});
test("negative price and negative supplier values clamp to zero", () => {
  assert.equal(whatIf(e, { ...base, priceEur: -5 }).costEur, 0);
  near(whatIf(e, { ...base, precursorActual: { "materials:0": -1 } }).chargeablePerTonne, 0.2 + 0.3);
});
test("exported tonnes are clamped to production", () => {
  near(whatIf(direct, { ...base, exportedT: 5000 }).certificatesT, 2 * 1000);
});
test("a precursor override applies to the scenario only, never to the base", () => {
  const { base: a } = compareWhatIf(e, base, { ...base, precursorActual: { "materials:0": 0.9 } });
  near(a.chargeablePerTonne, 0.2 + 0.3 + 1.8);
});
test("EUR results convert to the chosen currency with the cost page rates", () => {
  const rates = { THB: 38, EUR: 1, CNY: 7.8, INR: 95 };
  near(toCurrency(80_000, "THB", { rates }), 80_000 * 38);
  near(toCurrency(80_000, "EUR", { rates }), 80_000);
});
test("the card key is per installation and year, not per scenario", () => {
  assert.equal(scenarioKey("i1", 2026), "what-if:i1:2026");
  const next = { ...base, precursorActual: { "materials:0": 0.9 } };
  const { deltaEur, deltaT } = compareWhatIf(e, base, next);
  const a = scenarioOpportunity({ installationId: "i1", year: 2026, e, base, next, savingEur: -(deltaEur ?? 0), savingT: -(deltaT ?? 0) });
  const b = scenarioOpportunity({ installationId: "i1", year: 2026, e, base, next: { ...next, exportedT: 400 }, savingEur: 1, savingT: 1 });
  assert.equal(a.key, "what-if:i1:2026");
  assert.equal(b.key, a.key);
  assert.equal(a.source, "what-if");
  assert.equal(a.href, "/dashboard");
  near(a.impactEur, 36_000);
  assert.equal(a.text?.key, "Scenario saves €{eur} a year");
});
test("the card detail lists the inputs that changed from today", () => {
  const next = { ...base, exportedT: 400, precursorActual: { "materials:0": 0.9 } };
  const detail = changedInputs(e, base, next);
  assert.match(detail, /exported 500 → 400 t/);
  assert.match(detail, /Wire rod actual 0.9/);
  assert.equal(changedInputs(e, base, base), "No inputs changed");
});
