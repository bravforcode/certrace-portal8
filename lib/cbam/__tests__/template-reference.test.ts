/* The EU template's own reference tables, pinned.

   These are transcriptions, so the tests are not checking arithmetic — they
   are checking that the transcription has not drifted. Each expectation names
   the workbook cell it came from, so a failure says where to look. */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AGGREGATED_GOODS,
  CN_TO_GOOD,
  COMMUNICATION_COLUMNS,
  GWP,
  categoryForCn,
  goodById,
  indirectApplies,
  specialParametersFor,
} from "../template-reference";

test("there are exactly the 18 aggregated goods categories, in workbook order", () => {
  assert.equal(AGGREGATED_GOODS.length, 18, "Parameters_Constants!A89:A106");
  assert.equal(AGGREGATED_GOODS[0].label, "Cement");
  assert.equal(AGGREGATED_GOODS[17].label, "Electricity (export to EU)");
  assert.equal(AGGREGATED_GOODS[17].unit, "MWh", "only electricity is not per tonne");
  assert.ok(
    AGGREGATED_GOODS.filter((g) => g.unit === "t").length === 17,
    "every other category is per tonne",
  );
});

/* Chapter 72 splits across five categories. This is the single most valuable
   thing the CN map does, and the reason a prefix match would be wrong. */
test("chapter 72 resolves to five different categories, not one", () => {
  assert.equal(categoryForCn("72011090")?.id, "pig_iron", "7201 — Pig iron");
  assert.equal(categoryForCn("72021180")?.id, "alloys", "7202 — Alloys");
  assert.equal(categoryForCn("72031000")?.id, "direct_reduced_iron", "7203 — DRI");
  assert.equal(categoryForCn("72071190")?.id, "crude_steel", "7207 — Crude steel");
  assert.equal(categoryForCn("72081000")?.id, "iron_or_steel_products", "7208 — Iron or steel products");
});

test("CN lookup tolerates the separators a customs declaration uses", () => {
  assert.equal(categoryForCn("7207 11 90")?.id, "crude_steel");
  assert.equal(categoryForCn("7207.11.90")?.id, "crude_steel");
  assert.equal(categoryForCn("72071190")?.id, "crude_steel");
});

test("a 6-digit heading does not determine the category, and is refused", () => {
  // 7207 alone spans crude steel; 720711 vs 720719 do not differ here, but a
  // 6-digit code in general cannot be resolved, so nothing is guessed.
  assert.equal(categoryForCn("720711"), undefined);
  assert.equal(categoryForCn(""), undefined);
  assert.equal(categoryForCn(null), undefined);
  assert.equal(categoryForCn("99999999"), undefined, "not a CBAM good");
});

test("every CN code maps to a category that exists", () => {
  const ids = new Set(AGGREGATED_GOODS.map((g) => g.id));
  const codes = Object.keys(CN_TO_GOOD);
  assert.ok(codes.length > 500, `expected the full schedule, got ${codes.length}`);
  for (const cn of codes) {
    assert.ok(/^\d{8}$/.test(cn), `${cn} is not an 8-digit code`);
    assert.ok(ids.has(CN_TO_GOOD[cn]), `${cn} points at unknown category ${CN_TO_GOOD[cn]}`);
  }
});

/* Parameters_Constants!C89:C106. Steel, aluminium and hydrogen are excluded
   from indirect reporting in the definitive regime — the rule that makes a
   steel report showing zero indirect correct rather than incomplete. */
test("indirect emissions are excluded for steel, aluminium and hydrogen", () => {
  for (const id of ["crude_steel", "iron_or_steel_products", "pig_iron", "direct_reduced_iron", "hydrogen", "unwrought_aluminium", "aluminium_products"]) {
    assert.equal(indirectApplies(id), false, `${id} should not report indirect emissions`);
  }
  for (const id of ["cement", "nitric_acid", "urea", "mixed_fertilisers", "sintered_ore"]) {
    assert.equal(indirectApplies(id), true, `${id} should report indirect emissions`);
  }
});

test("only multi-route categories carry more than one route", () => {
  assert.deepEqual(goodById("crude_steel")?.routes, [
    "Basic oxygen steelmaking",
    "Electric arc furnace",
    "Other production routes",
    "Unknown production routes",
  ]);
  assert.deepEqual(goodById("cement")?.routes, ["All production routes"]);
  for (const g of AGGREGATED_GOODS) {
    assert.equal(g.routes.length > 1, g.routeRelevant, `${g.id}: routeRelevant must match the route count`);
  }
});

/* Parameters_Constants!B110:I127 — which parameters appear is decided by the
   category, and a missing one is a gap a verifier raises. */
test("sector parameters follow the category", () => {
  assert.deepEqual(specialParametersFor("crude_steel"), [
    "The main reducing agent of the precursor, if known",
    "% Mn",
    "% Cr",
    "% Ni",
    "% other alloys",
    "t scrap per t steel",
    "% pre-consumer scrap",
  ]);
  assert.deepEqual(specialParametersFor("cement"), ["Clinker factor"]);
  assert.deepEqual(specialParametersFor("cement_clinker"), [], "clinker itself has none");
  assert.deepEqual(specialParametersFor("unknown"), [], "an unknown category asks for nothing");
});

test("the communication row is the workbook's twelve columns, D through O", () => {
  assert.equal(COMMUNICATION_COLUMNS.length, 12);
  assert.deepEqual(
    COMMUNICATION_COLUMNS.map((c) => c.column),
    ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"],
  );
  assert.equal(COMMUNICATION_COLUMNS.find((c) => c.key === "seeTotal")?.column, "K");
  // Every column explains itself — the report prints these under the table.
  for (const c of COMMUNICATION_COLUMNS) assert.ok(c.purpose.length > 20, `${c.key} has no purpose text`);
});

test("global warming potentials are the template's, not whichever table was handy", () => {
  assert.equal(GWP.N2O, 265, "Parameters_Constants!B76");
  assert.equal(GWP.CF4, 6630, "B77");
  assert.equal(GWP.C2F6, 11100, "B78");
});
