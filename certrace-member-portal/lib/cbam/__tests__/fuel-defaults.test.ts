/* ════════════════════════════════════════════════════════════
   THE EU STANDARD VALUES, PINNED

   Two classes of failure this file exists to catch, both silent:

     1 · THE TWO-STEP CONVERSION COLLAPSING INTO ONE. Point G is mass-based for
         every fuel; the form asks in m³ and litres. If somebody ever
         pre-multiplies the table, natural gas goes in at 48 MJ/m³ instead of
         34.3 — 40% high, entirely plausible-looking, and wrong in every month
         of every workspace.

     2 · THE LOCK BECOMING DECORATIVE. `matchesEuStandard` is what makes a
         disabled input mean something, because nothing stops a stored row from
         claiming a Type I value while carrying a typed one.
   ════════════════════════════════════════════════════════════ */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  FUEL_TYPE_TO_POINT_G,
  POINT_G_TABLE,
  euStandardFor,
  hasEuStandard,
  isWasteGas,
  kgPerUnit,
  matchesEuStandard,
  pointGRow,
} from "../fuel-defaults";

const near = (actual: number, expected: number, tol: number, what: string) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${what}: expected ≈${expected}, got ${actual}`);

/* ── The table itself ───────────────────────────────────────── */

/* 40 + 11, not the 39 + 11 the brief quoted: the supplied dataset carries 40
   fossil rows, and every one of them was checked against it row by row rather
   than counted from the summary. */
test("Point G carries all 51 rows — 40 fossil and 11 biomass", () => {
  assert.equal(POINT_G_TABLE.length, 51);
  assert.equal(POINT_G_TABLE.filter((r) => r.category === "fossil").length, 40);
  assert.equal(POINT_G_TABLE.filter((r) => r.category === "biomass").length, 11);
  assert.equal(new Set(POINT_G_TABLE.map((r) => r.fuel)).size, 51, "no fuel appears twice");
});

test("every mapped portal fuel points at a row that exists", () => {
  for (const [id, mapping] of Object.entries(FUEL_TYPE_TO_POINT_G)) {
    assert.ok(pointGRow(mapping.pointG), `${id} → "${mapping.pointG}" is not a Point G row`);
  }
});

/* ── The emission factor ────────────────────────────────────── */

test("EF converts from tCO₂/TJ to tCO₂/GJ — a thousandth, not a thousand", () => {
  // The number the form's own placeholder has always shown for natural gas.
  near(euStandardFor("natural_gas", "m3")!.efTco2PerGj, 0.0561, 1e-9, "natural gas EF");
  near(euStandardFor("diesel", "l")!.efTco2PerGj, 0.0741, 1e-9, "diesel EF");
  near(euStandardFor("coking_coal", "t")!.efTco2PerGj, 0.0946, 1e-9, "coking coal EF");
});

/* ── Step 1 × step 2 ────────────────────────────────────────── */

test("a solid fuel takes Point G's GJ/t straight, as MJ/t", () => {
  // 28.2 GJ/t = 28,200 MJ/t. No density involved: a tonne is a tonne.
  near(euStandardFor("coking_coal", "t")!.ncvMjPerUnit!, 28_200, 1e-6, "coking coal NCV");
});

test("a fuel invoiced in kg needs no density either — GJ/t IS MJ/kg", () => {
  near(euStandardFor("lpg", "kg")!.ncvMjPerUnit!, 47.3, 1e-9, "LPG NCV");
});

test("a gas in m³ goes through the density table and lands in the plausible band", () => {
  const gas = euStandardFor("natural_gas", "m3")!;
  // 48.0 MJ/kg × 0.7156 kg/m³ = 34.3488 MJ/m³.
  near(gas.ncvMjPerUnit!, 34.3488, 1e-4, "natural gas NCV in m³");
  // The band the fuel list itself quotes as a sanity check for this fuel.
  assert.ok(gas.ncvMjPerUnit! > 33 && gas.ncvMjPerUnit! < 39, "inside the 33–39 MJ/m³ band the form advertises");
  assert.match(gas.citation, /0\.7156 kg\/m³/, "the density is named, because it is an assumption");
});

test("a liquid in litres does the same, and lands in ITS band", () => {
  const diesel = euStandardFor("diesel", "l")!;
  near(diesel.ncvMjPerUnit!, 35.7975, 1e-4, "diesel NCV in litres");
  assert.ok(diesel.ncvMjPerUnit! > 35 && diesel.ncvMjPerUnit! < 37, "inside the 35–37 MJ/litre band");

  const hfo = euStandardFor("fuel_oil_heavy", "l")!;
  near(hfo.ncvMjPerUnit!, 39.592, 1e-3, "heavy fuel oil NCV in litres");
  assert.ok(hfo.ncvMjPerUnit! > 38 && hfo.ncvMjPerUnit! < 41, "inside the 38–41 MJ/litre band");
});

test("the mass-based figure is NEVER what a volume unit gets", () => {
  // The bug a collapsed one-step table would produce.
  const gas = euStandardFor("natural_gas", "m3")!;
  assert.notEqual(gas.ncvMjPerUnit, 48.0);
  assert.notEqual(gas.ncvMjPerUnit, 48_000);
});

test("a unit with no density on file returns no NCV rather than assuming 1 kg per unit", () => {
  // Natural gas is not invoiced in litres, and inventing 1 kg/litre for it
  // would overstate the row roughly forty-fold.
  assert.equal(kgPerUnit("natural_gas", "l"), null);
  assert.equal(euStandardFor("natural_gas", "l")!.ncvMjPerUnit, null);
});

test("GJ needs no calorific value at all", () => {
  assert.equal(kgPerUnit("coking_coal", "GJ"), null);
  assert.equal(euStandardFor("coking_coal", "GJ")!.ncvMjPerUnit, null);
});

/* ── What has no standard value ─────────────────────────────── */

test("an unlisted fuel has no EU standard value — Point G names categories", () => {
  assert.equal(hasEuStandard("other"), false);
  assert.equal(euStandardFor("other", "kg"), null);
});

test("the merged coal row says which of the two categories it used", () => {
  const coal = euStandardFor("anthracite_bituminous", "t")!;
  near(coal.efTco2PerGj, 0.0983, 1e-9, "the higher of the two per tonne");
  assert.match(coal.caveat!, /Anthracite/);
});

test("biomass is flagged, because its Point G factor is preliminary", () => {
  assert.equal(euStandardFor("biomass", "t")!.biomass, true);
  assert.equal(euStandardFor("diesel", "l")!.biomass, false);
});

/* ── The lock ───────────────────────────────────────────────── */

test("matchesEuStandard accepts the table's own values and refuses a typed one", () => {
  const d = euStandardFor("natural_gas", "m3")!;
  assert.equal(matchesEuStandard("natural_gas", "m3", d.ncvMjPerUnit!, d.efTco2PerGj), true);
  // A plausible measured NCV — right band, wrong claim.
  assert.equal(matchesEuStandard("natural_gas", "m3", 38, d.efTco2PerGj), false);
  // The classic per-volume emission factor.
  assert.equal(matchesEuStandard("natural_gas", "m3", d.ncvMjPerUnit!, 1.9), false);
});

test("in GJ only the factor is checked — there is no NCV to disagree about", () => {
  const d = euStandardFor("coking_coal", "GJ")!;
  assert.equal(matchesEuStandard("coking_coal", "GJ", undefined, d.efTco2PerGj), true);
  assert.equal(matchesEuStandard("coking_coal", "GJ", undefined, 0.05), false);
});

/* ── Waste gases ────────────────────────────────────────────── */

test("the steel waste gases are marked, and their factors really are off the scale", () => {
  assert.equal(isWasteGas("blast_furnace_gas"), true);
  assert.equal(isWasteGas("coke_oven_gas"), true);
  assert.equal(isWasteGas("natural_gas"), false);

  // 0.26 tCO₂/GJ — outside the 0.02–0.15 band every ordinary fossil fuel sits
  // in, because the NCV underneath it is a tenth of everything else's. Any
  // range check that does not know this reports every integrated steel plant
  // in Thailand as out of band.
  near(euStandardFor("blast_furnace_gas", "m3")!.efTco2PerGj, 0.26, 1e-9, "BFG EF");
  assert.match(pointGRow("Blast furnace gas")!.note!, /Equations 53–54/);
});
