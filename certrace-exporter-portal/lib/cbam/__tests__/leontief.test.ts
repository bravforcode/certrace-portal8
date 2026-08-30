/* The precursor solve, pinned to the EU workbook's own arithmetic.

   Every expectation below is hand-computed from
   SEE(i) = SE(i) + Σ_j a(i,j)·SEE(j), which is what InputOutput!AK71
   (`MMULT(MINVERSE(I−A), SE)`) evaluates to. Where a case is one the old
   depth-first tree walk answers differently, the test says so — those are the
   filed numbers that change. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { solveEmbedded, type Consumption, type SolveNode } from "../leontief";

const TOL = 1e-9;

const closeTo = (actual: number, expected: number, what: string, tol = TOL) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${what}: expected ${expected}, got ${actual} (Δ ${Math.abs(actual - expected)})`);

/** A node with everything zeroed — each test sets only what it is about. */
const node = (id: string, over: Partial<SolveNode> = {}): SolveNode => ({
  id,
  name: id,
  kind: "process",
  totalProduction: 1,
  ownDirectTCO2e: 0,
  ownIndirectTCO2e: 0,
  ownElectricityMWh: 0,
  ownCarbonPricePaid: 0,
  ownCarbonPriceRebate: 0,
  ...over,
});

test("no precursors — SEE is just SE", () => {
  const r = solveEmbedded([node("billet", { totalProduction: 100, ownDirectTCO2e: 45, ownIndirectTCO2e: 20 })], []);
  assert.equal(r.error, null);
  closeTo(r.see.billet.embeddedDirect, 0.45, "SEE direct");
  closeTo(r.see.billet.embeddedIndirect, 0.2, "SEE indirect");
  closeTo(r.see.billet.embeddedTotal, 0.65, "SEE total");
});

/* THE CASE THE TREE WALK GETS WRONG.

   rebar consumes 1.05 t of billet per tonne and has its own rolling emissions.
   Workbook: SEE(rebar) = SE(rebar) + 1.05 × SEE(billet) = 0.30 + 1.05×0.60 = 0.93
   Tree walk: Σ children only = 1.05 × 0.60 = 0.63 — the mill's own 0.30 is lost. */
test("an intermediate tier keeps its own emissions", () => {
  const nodes = [
    node("billet", { totalProduction: 1000, ownDirectTCO2e: 600 }),
    node("rebar", { totalProduction: 1000, ownDirectTCO2e: 300 }),
  ];
  const consumption: Consumption[] = [{ consumerId: "rebar", precursorId: "billet", quantity: 1050 }];
  const r = solveEmbedded(nodes, consumption);
  assert.equal(r.error, null);
  closeTo(r.see.billet.embeddedDirect, 0.6, "billet SEE");
  closeTo(r.see.rebar.embeddedDirect, 0.93, "rebar SEE — own 0.30 plus 1.05 × 0.60 carried in");
  assert.notEqual(Number(r.see.rebar.embeddedDirect.toFixed(6)), 0.63, "must not drop the rolling mill's own emissions");
});

/* Four tiers, the depth a real iron & steel chain reaches.
   ore(0.10) → pigIron(own 1.20, 1.6 t ore) → billet(own 0.25, 1.1 t pig)
             → rebar(own 0.08, 1.05 t billet)
   SEE(ore)     = 0.10
   SEE(pigIron) = 1.20 + 1.6×0.10            = 1.36
   SEE(billet)  = 0.25 + 1.1×1.36            = 1.746
   SEE(rebar)   = 0.08 + 1.05×1.746          = 1.9133 */
test("four-tier chain accumulates every tier", () => {
  const nodes = [
    node("ore", { kind: "precursor", totalProduction: 1000, ownDirectTCO2e: 100 }),
    node("pigIron", { totalProduction: 1000, ownDirectTCO2e: 1200 }),
    node("billet", { totalProduction: 1000, ownDirectTCO2e: 250 }),
    node("rebar", { totalProduction: 1000, ownDirectTCO2e: 80 }),
  ];
  const consumption: Consumption[] = [
    { consumerId: "pigIron", precursorId: "ore", quantity: 1600 },
    { consumerId: "billet", precursorId: "pigIron", quantity: 1100 },
    { consumerId: "rebar", precursorId: "billet", quantity: 1050 },
  ];
  const r = solveEmbedded(nodes, consumption);
  assert.equal(r.error, null);
  closeTo(r.see.ore.embeddedDirect, 0.1, "ore");
  closeTo(r.see.pigIron.embeddedDirect, 1.36, "pig iron");
  closeTo(r.see.billet.embeddedDirect, 1.746, "billet");
  closeTo(r.see.rebar.embeddedDirect, 1.9133, "rebar", 1e-9);
});

/* A mill returning its own crop ends to the furnace. The tree walk throws
   CYCLE; the workbook converges.
   SEE = SE / (1 − a) = 0.50 / (1 − 0.10) = 0.5555… */
test("self-consumption converges instead of erroring", () => {
  const nodes = [node("billet", { totalProduction: 1000, ownDirectTCO2e: 500 })];
  const r = solveEmbedded(nodes, [{ consumerId: "billet", precursorId: "billet", quantity: 100 }]);
  assert.equal(r.error, null);
  closeTo(r.see.billet.embeddedDirect, 0.5 / 0.9, "self-consuming billet");
});

/* Two processes feeding each other — a → b → a. Solvable while the loop loses
   mass. a=0.5 into b, b=0.4 into a, SE both 1.0:
   x_a = 1 + 0.5·x_b ; x_b = 1 + 0.4·x_a  →  x_a = 1.5/0.8 = 1.875, x_b = 1.75 */
test("mutual consumption converges", () => {
  const nodes = [
    node("a", { totalProduction: 100, ownDirectTCO2e: 100 }),
    node("b", { totalProduction: 100, ownDirectTCO2e: 100 }),
  ];
  const r = solveEmbedded(nodes, [
    { consumerId: "a", precursorId: "b", quantity: 50 },
    { consumerId: "b", precursorId: "a", quantity: 40 },
  ]);
  assert.equal(r.error, null);
  closeTo(r.see.a.embeddedDirect, 1.875, "a");
  closeTo(r.see.b.embeddedDirect, 1.75, "b");
});

test("a loop that creates its own mass is reported, not silently wrong", () => {
  const nodes = [node("billet", { totalProduction: 1000, ownDirectTCO2e: 500 })];
  const r = solveEmbedded(nodes, [{ consumerId: "billet", precursorId: "billet", quantity: 1000 }]);
  assert.equal(r.error?.code, "SINGULAR");
  assert.match(r.error?.message ?? "", /loop that produces itself/i);
});

test("a node with no output is named rather than divided by", () => {
  const r = solveEmbedded([node("idle", { name: "Line 3", totalProduction: 0 })], []);
  assert.equal(r.error?.code, "NO_OUTPUT");
  assert.equal(r.error?.nodeId, "idle");
  assert.match(r.error?.message ?? "", /Line 3/);
});

/* Two deliveries of the same precursor accumulate — SUMIF, not lookup.
   0.6 + 0.5 = 1.1 t/t → SEE = 0.2 + 1.1×1.0 = 1.3 */
test("repeat consumption rows accumulate", () => {
  const nodes = [
    node("pig", { totalProduction: 1000, ownDirectTCO2e: 1000 }),
    node("billet", { totalProduction: 1000, ownDirectTCO2e: 200 }),
  ];
  const r = solveEmbedded(nodes, [
    { consumerId: "billet", precursorId: "pig", quantity: 600 },
    { consumerId: "billet", precursorId: "pig", quantity: 500 },
  ]);
  closeTo(r.see.billet.embeddedDirect, 1.3, "accumulated coefficient");
});

/* The same operator carries electricity and money. Embedded electricity is
   MWh/t including the chain (InputOutput!AO71); carbon price is F_Tools V/W. */
test("electricity and carbon price ride the same inverse", () => {
  const nodes = [
    node("billet", { totalProduction: 1000, ownElectricityMWh: 500, ownCarbonPricePaid: 20000 }),
    node("rebar", { totalProduction: 1000, ownElectricityMWh: 100, ownCarbonPricePaid: 5000 }),
  ];
  const r = solveEmbedded(nodes, [{ consumerId: "rebar", precursorId: "billet", quantity: 1050 }]);
  closeTo(r.see.billet.embeddedElectricity, 0.5, "billet MWh/t");
  closeTo(r.see.rebar.embeddedElectricity, 0.1 + 1.05 * 0.5, "rebar MWh/t incl. chain");
  closeTo(r.see.rebar.carbonPricePaid, 5 + 1.05 * 20, "rebar carbon price carried in");
});

test("rebate is netted off and floored at zero", () => {
  const over = solveEmbedded([node("x", { totalProduction: 100, ownCarbonPricePaid: 100, ownCarbonPriceRebate: 400 })], []);
  closeTo(over.see.x.effectiveCarbonPrice, 0, "a rebate larger than the price is not a refund");

  const normal = solveEmbedded([node("y", { totalProduction: 100, ownCarbonPricePaid: 400, ownCarbonPriceRebate: 100 })], []);
  closeTo(normal.see.y.effectiveCarbonPrice, 3, "4 − 1 per tonne");
});

test("total is the sum of the two embedded components", () => {
  const nodes = [
    node("pig", { totalProduction: 100, ownDirectTCO2e: 150, ownIndirectTCO2e: 30 }),
    node("billet", { totalProduction: 100, ownDirectTCO2e: 40, ownIndirectTCO2e: 60 }),
  ];
  const r = solveEmbedded(nodes, [{ consumerId: "billet", precursorId: "pig", quantity: 110 }]);
  const b = r.see.billet;
  closeTo(b.embeddedDirect, 0.4 + 1.1 * 1.5, "direct");
  closeTo(b.embeddedIndirect, 0.6 + 1.1 * 0.3, "indirect");
  closeTo(b.embeddedTotal, b.embeddedDirect + b.embeddedIndirect, "total");
});

test("coefficients are exposed per unit so the report can show the workings", () => {
  const nodes = [node("pig", { totalProduction: 1000 }), node("billet", { totalProduction: 2000 })];
  const r = solveEmbedded(nodes, [{ consumerId: "billet", precursorId: "pig", quantity: 2200 }]);
  assert.deepEqual(r.coefficients, [{ consumerId: "billet", precursorId: "pig", perUnit: 1.1 }]);
});
