/* The CN catalogue, what a code leads to, and the routes it offers.

   The numbers pinned here are read off the regulations themselves — the
   Thai rows of Implementing Regulation (EU) 2025/2621, Annex I, and the
   benchmark table of 2025/2620 — and the worked example is the one in the
   Federation of Thai Industries' 26 Feb 2026 deck (CN 7318 12 90: default
   2.649 tCO₂e/t in 2026, benchmark 0.066, free allocation 0.06435). */

import { test } from "node:test";
import assert from "node:assert/strict";

const { FULL_CATALOGUE, LEGACY_ONLY, CN_ROWS } = await import("../cn-catalogue");
const { getCatalogProduct, PRODUCT_CATALOG, aggregatedGoodsCategory } = await import("../../config");
const { rateSheet, lookupDefault, lookupUnknownOrigin, cbamFactor, defaultMarkup, benchmarkFor, rowForAnyCn } = await import("../eu-rates");
const { routeOptionsFor, routeIsValidFor } = await import("../routes");
const { CN_TO_GOOD } = await import("../template-reference");

const digits = (cn: string) => cn.replace(/\D/g, "");

test("the catalogue is the full set in CBAM scope: 570 goods, each code once", () => {
  assert.equal(FULL_CATALOGUE.length, 570);
  assert.equal(PRODUCT_CATALOG.length, 570);
  assert.equal(new Set(FULL_CATALOGUE.map((p) => p.cnCode)).size, 570);
  assert.equal(new Set(FULL_CATALOGUE.map((p) => p.id)).size, 570, "ids are unique");
  const bySector = Object.fromEntries(
    ["Iron & Steel", "Aluminium", "Fertilisers", "Cement", "Hydrogen"].map((s) => [s, FULL_CATALOGUE.filter((p) => p.category === s).length]),
  );
  assert.deepEqual(bySector, { "Iron & Steel": 478, Aluminium: 58, Fertilisers: 27, Cement: 6, Hydrogen: 1 });
});

test("it agrees with the Commission's communication template — the only differences are electricity and the 2025 urea split", () => {
  const ours = new Set(FULL_CATALOGUE.map((p) => digits(p.cnCode)));
  const theirs = new Set(Object.keys(CN_TO_GOOD));
  const missing = [...theirs].filter((c) => !ours.has(c)).sort();
  const extra = [...ours].filter((c) => !theirs.has(c)).sort();
  // 2716 00 00 electricity is measured in MWh and earns no free allocation, so it is not in the benchmark table.
  // 3102 10 10 was split into 3102 10 12 / 15 / 19 when the CN was revised for 2025.
  assert.deepEqual(missing, ["27160000", "31021010"]);
  assert.deepEqual(extra, ["31021012", "31021015", "31021019"]);
});

test("every saved workspace's product id still resolves — including the nine old codes that were never 8-digit CN codes", () => {
  for (const id of ["ironore", "hrc", "rebar", "section", "ss-flat", "fasteners", "al-plate", "al-foil", "al-unwrought", "galv"]) {
    assert.ok(getCatalogProduct(id), `${id} must still resolve`);
  }
  assert.equal(LEGACY_ONLY.length, 9);
  assert.equal(getCatalogProduct("hrc")!.cnCode, "7208 39 00", "a legacy id that IS a real code keeps its code and name");
  assert.equal(getCatalogProduct("hrc")!.name, "Hot-rolled coil");
});

test("every CN code resolves to a default value — Thailand's own row, or the 'Other countries' row Annex I sends it to", () => {
  for (const p of FULL_CATALOGUE) {
    const variant = p.cnCode === "2523 10 00" || p.cnCode === "2523 90 00" ? "A" : undefined;
    const hit = lookupDefault(p.cnCode, "TH", variant);
    assert.ok(hit, `${p.cnCode} has no default value`);
    assert.ok(hit!.rates.y2026 > 0);
  }
});

test("CN 7318 12 90 for Thailand reproduces the FTI deck's worked example", () => {
  const s = rateSheet({ cn: "7318 12 90", country: "TH", year: 2026, price: 90 })!;
  assert.equal(s.baseValue, 2.408);
  assert.equal(s.defaultValue, 2.649, "2.408 × 1.10");
  assert.equal(s.euRoute, "E", "Thailand's default is built on the scrap-EAF route");
  assert.equal(s.benchmark.default, 0.066);
  assert.equal(s.cbamFactor, 0.975);
  assert.ok(Math.abs((s.freeAllocation ?? 0) - 0.06435) < 1e-9);
  assert.ok(Math.abs((s.chargeable ?? 0) - 2.58465) < 1e-9);
  assert.ok(Math.abs((s.costPerTonne ?? 0) - 232.6185) < 1e-3, "€232.62 per tonne — the deck's headline Thai figure");
});

test("the mark-up follows the reporting year, and is 1 % for fertilisers", () => {
  assert.equal(defaultMarkup("Iron & Steel", 2026), 0.1);
  assert.equal(defaultMarkup("Iron & Steel", 2027), 0.2);
  assert.equal(defaultMarkup("Aluminium", 2028), 0.3);
  assert.equal(defaultMarkup("Aluminium", 2031), 0.3);
  assert.equal(defaultMarkup("Fertilisers", 2026), 0.01);
  assert.equal(defaultMarkup("Fertilisers", 2029), 0.01);
  const rates = lookupDefault("7318 12 90", "TH")!.rates;
  assert.deepEqual([rates.y2026, rates.y2027, rates.y2028], [2.649, 2.89, 3.13]);
});

test("the phase-in runs 97.5 % in 2026 to nothing in 2034", () => {
  assert.equal(cbamFactor(2025), null);
  assert.equal(cbamFactor(2026), 0.975);
  assert.equal(cbamFactor(2030), 0.515);
  assert.equal(cbamFactor(2034), 0);
  assert.equal(cbamFactor(2040), 0);
});

test("Thailand's other headline rows", () => {
  assert.equal(lookupDefault("7208 10 00", "TH")!.rates.y2026, 2.111);
  assert.equal(lookupDefault("7606 12 50", "TH")!.rates.y2026, 1.903);
  assert.equal(lookupDefault("7601 10 10", "TH")!.rates.y2026, 0.396);
  assert.equal(lookupDefault("7606 12 50", "TH")!.rates.route, "L");
});

test("a country Annex I does not list falls back to 'Other countries and territories'", () => {
  const thai = lookupDefault("7201 10 11", "TH")!;
  assert.equal(thai.usedOther, true, "Thailand has no pig-iron row, so Other applies");
  assert.equal(thai.usedCountry, "ZZ");
});

test("a precursor whose country cannot be identified takes the highest default (Annex IV)", () => {
  const u = lookupUnknownOrigin("7208 10 00")!;
  assert.equal(u.highest, 8.23);
  assert.equal(u.y2026, 9.053);
  assert.equal(u.route, "C");
});

test("benchmarks: stainless screws carry a period flag, route-bound goods a letter", () => {
  const stainless = rowForAnyCn("7318 12 10")!;
  assert.equal(benchmarkFor(stainless, undefined, 2026).default, 1.154);
  assert.equal(benchmarkFor(stainless, undefined, 2029).default, 1.116);
  const hrc = rowForAnyCn("7208 10 00")!;
  assert.equal(benchmarkFor(hrc, "C", 2026).default, 1.37);
  assert.equal(benchmarkFor(hrc, "D", 2026).default, 0.481);
  assert.equal(benchmarkFor(hrc, "E", 2026).default, 0.072);
  assert.equal(benchmarkFor(hrc, "E", 2026).process, 0.044);
});

test("every CN code offers at least one route, and the options follow the code", () => {
  for (const p of FULL_CATALOGUE) {
    const opts = routeOptionsFor(p);
    assert.ok(opts.length > 0, `${p.cnCode} offers no route`);
    assert.equal(new Set(opts.map((o) => o.id)).size, opts.length, `${p.cnCode} lists a route twice`);
  }
  const ids = (cn: string) => routeOptionsFor(FULL_CATALOGUE.find((p) => p.cnCode === cn)!).map((o) => o.id);
  assert.deepEqual(ids("7208 10 00"), ["bf_bof", "dri_eaf", "scrap_eaf"], "hot-rolled flat: carbon steel on three routes");
  assert.deepEqual(ids("7205 21 00"), ["lowalloy_bf_bof", "lowalloy_dri_eaf", "lowalloy_scrap_eaf", "highalloy_eaf", "route_other", "route_unknown"]);
  assert.deepEqual(ids("7601 10 10"), ["hall_heroult", "soderberg", "remelt", "route_other", "route_unknown"]);
  assert.deepEqual(ids("7606 12 50"), ["al_primary", "al_secondary"]);
  assert.deepEqual(ids("7201 10 11"), ["blast_furnace", "smelting_reduction", "route_other", "route_unknown"]);
  assert.deepEqual(ids("2523 10 00"), ["clinker_grey", "clinker_white"]);
  assert.deepEqual(ids("2814 10 00"), ["haber_bosch_smr", "haber_bosch_gasification", "route_other", "route_unknown"]);
  assert.deepEqual(ids("2804 10 00"), ["steam_reforming", "electrolysis_water", "chlor_alkali", "route_other", "route_unknown"]);
  assert.deepEqual(ids("3102 10 90"), ["urea_synthesis"]);
  assert.deepEqual(ids("7219 11 00"), ["steel_all_routes"], "stainless flat: the EU gives one value whatever the route");
  assert.deepEqual(ids("7218 10 00"), ["bf_bof", "dri_eaf", "scrap_eaf", "highalloy_eaf", "route_other", "route_unknown"]);
});

test("an older stored route still counts as valid for its category; a wrong one does not", () => {
  const rolled = FULL_CATALOGUE.find((p) => p.cnCode === "7208 10 00")!;
  assert.equal(routeIsValidFor("scrap_eaf", rolled), true);
  assert.equal(routeIsValidFor("rolling_only", rolled), true, "legacy route kept readable");
  assert.equal(routeIsValidFor("hall_heroult", rolled), false);
  assert.equal(aggregatedGoodsCategory(rolled), "Iron or steel products");
});

test("every route letter the tables use maps to a route", () => {
  const letters = new Set<string>();
  for (const r of CN_ROWS) for (const [, l] of [...r.bmDefault, ...r.bmProcess]) if (l) letters.add(l);
  assert.deepEqual([...letters].sort(), ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L"]);
});
