/* Bug 7 — production routes must belong to the AGGREGATED goods category
   they actually produce, not the coarse Iron & Steel / Aluminium split.
   BF-BOF makes crude steel, not "Iron or steel products" — the live bug
   this file pins the fix for. */

import { test } from "node:test";
import assert from "node:assert/strict";

const { PRODUCTION_ROUTES, routesForCategory, routeMatchesCategory } =
  await import("../workspace");

test("Bug 7 — Crude steel offers BF-BOF, Scrap-EAF and DRI-EAF, and nothing downstream", () => {
  const routes = routesForCategory("Crude steel").map((r) => r.id);
  assert.ok(
    routes.includes("bf_bof"),
    "BF-BOF makes crude steel — the bug report's own example",
  );
  assert.ok(routes.includes("scrap_eaf"));
  assert.ok(routes.includes("dri_eaf"));
  assert.ok(
    !routes.includes("rolling_only"),
    "rolling/finishing is downstream of crude steel, not a way to make it",
  );
});

test("Bug 7 — Iron or steel products offers only downstream forming/finishing routes", () => {
  const routes = routesForCategory("Iron or steel products").map((r) => r.id);
  assert.deepEqual(routes, ["rolling_only"]);
});

test("Bug 7 — Pig iron offers Blast furnace and Smelting reduction, per the spec's route table", () => {
  const routes = routesForCategory("Pig iron")
    .map((r) => r.id)
    .sort();
  assert.deepEqual(routes, ["blast_furnace", "smelting_reduction"]);
});

test("Bug 7 — Sintered ore, Direct reduced iron and Ferro-alloys each get exactly one route", () => {
  assert.equal(routesForCategory("Sintered ore").length, 1);
  assert.equal(routesForCategory("Direct reduced iron").length, 1);
  assert.equal(routesForCategory("Ferro-alloys").length, 1);
});

test("Bug 7 — Unwrought aluminium offers pre-baked, Søderberg and secondary; Aluminium products offers only downstream forming", () => {
  const unwrought = routesForCategory("Unwrought aluminium")
    .map((r) => r.id)
    .sort();
  assert.deepEqual(unwrought, ["hall_heroult", "remelt", "soderberg"]);
  const products = routesForCategory("Aluminium products")
    .map((r) => r.id)
    .sort();
  assert.deepEqual(products, ["extrusion", "rolling_al"]);
});

test("Bug 7 — routeMatchesCategory catches the exact live bug: BF-BOF stored against Iron or steel products", () => {
  assert.equal(
    routeMatchesCategory("bf_bof", "Iron or steel products"),
    false,
    "this was the live, wrong combination",
  );
  assert.equal(
    routeMatchesCategory("bf_bof", "Crude steel"),
    true,
    "the correct category for the same route",
  );
});

test("Bug 7 — every route belongs to at least one aggregated category, and every id is unique", () => {
  const ids = new Set<string>();
  for (const r of PRODUCTION_ROUTES) {
    assert.ok(
      r.aggregatedCategories.length > 0,
      `${r.id} has no aggregated category`,
    );
    assert.ok(!ids.has(r.id), `duplicate route id ${r.id}`);
    ids.add(r.id);
  }
});
