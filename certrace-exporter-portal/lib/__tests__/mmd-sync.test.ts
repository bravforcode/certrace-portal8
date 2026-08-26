/* The methodology and the month, kept in step.

   The rules that matter are the ones about NOT destroying data: a supplier's
   readings must survive an edit to the methodology, and a lossy mapping must
   report rather than guess. Those get the most tests here. */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  factorSourceForSupply,
  fuelIdsInMonth,
  fuelRowHasData,
  reconcileFuelRows,
  supplyForFactorSource,
  syncFromMmd,
  syncFromMonth,
} from "../mmd-sync";
import { emptyFuel, emptyMonth, type FuelEntry, type MonthlyEntry } from "../monthly-data";
import { emptyMmd, type WorkspaceMmdContent } from "../workspace-mmd";

const label = (id: string) => id;

const fuel = (fuelType: string, over: Partial<FuelEntry> = {}): FuelEntry => ({ ...emptyFuel(), fuelType, ...over });
const mmdWith = (over: Partial<WorkspaceMmdContent> = {}): WorkspaceMmdContent => ({ ...emptyMmd("2026-01-01", "2026-12-31"), ...over });
const monthWith = (over: Partial<MonthlyEntry> = {}): MonthlyEntry => ({ ...emptyMonth("ws", "2026-03"), ...over });

/* ── Methodology → month ───────────────────────────────────── */

test("declaring a fuel puts a row for it on the month", () => {
  const r = reconcileFuelRows(["natural_gas", "diesel"], []);
  assert.deepEqual(r.fuels.map((f) => f.fuelType), ["natural_gas", "diesel"]);
  assert.deepEqual(r.added, ["natural_gas", "diesel"]);
});

test("rows follow the order the methodology lists them in", () => {
  const r = reconcileFuelRows(["diesel", "natural_gas"], [fuel("natural_gas"), fuel("diesel")]);
  assert.deepEqual(r.fuels.map((f) => f.fuelType), ["diesel", "natural_gas"]);
  assert.deepEqual(r.added, [], "both already existed");
});

test("undeclaring a fuel removes its row only while the row is empty", () => {
  const r = reconcileFuelRows(["natural_gas"], [fuel("natural_gas"), fuel("diesel")]);
  assert.deepEqual(r.fuels.map((f) => f.fuelType), ["natural_gas"]);
  assert.deepEqual(r.removed, ["diesel"]);
  assert.deepEqual(r.keptWithData, []);
});

/* The one that matters. A supplier spends an hour entering March's diesel; an
   exporter tidies the methodology; the readings must not vanish. */
test("a row with readings survives being undeclared, and is reported", () => {
  const r = reconcileFuelRows(["natural_gas"], [fuel("natural_gas"), fuel("diesel", { quantity: 4200, efTco2PerGj: 0.0741 })]);
  assert.equal(r.fuels.length, 2, "the diesel row is kept");
  assert.deepEqual(r.keptWithData, ["diesel"]);
  assert.deepEqual(r.removed, [], "nothing was deleted");
});

test("a blank row the supplier is part-way through is never touched", () => {
  const r = reconcileFuelRows(["natural_gas"], [fuel(""), fuel("natural_gas")]);
  assert.equal(r.fuels.filter((f) => f.fuelType === "").length, 1);
});

test("fuelRowHasData counts any of quantity, factor, NCV or a typed name", () => {
  assert.equal(fuelRowHasData(fuel("diesel")), false);
  assert.equal(fuelRowHasData(fuel("diesel", { quantity: 1 })), true);
  assert.equal(fuelRowHasData(fuel("diesel", { efTco2PerGj: 0.07 })), true);
  assert.equal(fuelRowHasData(fuel("diesel", { ncvMjPerUnit: 43 })), true);
  assert.equal(fuelRowHasData(fuel("other", { fuelTypeOther: "rice husk" })), true);
});

/* ── Month → methodology ───────────────────────────────────── */

test("deleting the last row for a fuel takes it out of the methodology", () => {
  const mmd = mmdWith({ fuelTypeIds: ["natural_gas", "diesel"] });
  const entry = monthWith({ fuels: [fuel("natural_gas")] });
  const r = syncFromMonth(mmd, entry, label);
  assert.deepEqual(r.mmd.fuelTypeIds, ["natural_gas"]);
  assert.match(r.notes.join(" "), /diesel/);
});

test("fuelIdsInMonth ignores blank rows and de-duplicates", () => {
  assert.deepEqual(fuelIdsInMonth([fuel("natural_gas"), fuel(""), fuel("natural_gas")]), ["natural_gas"]);
});

/* ── Electricity ───────────────────────────────────────────── */

test("the methodology's category decides the month's factor class", () => {
  assert.equal(factorSourceForSupply("grid_pea"), "grid_default");
  assert.equal(factorSourceForSupply("grid_mea"), "grid_default");
  assert.equal(factorSourceForSupply("ppa_renewable"), "ppa");
  assert.equal(factorSourceForSupply("direct_line"), "ppa", "a dedicated line uses the generator's factor, not the grid average");
  assert.equal(factorSourceForSupply("own_solar"), "self_generated");
  assert.equal(factorSourceForSupply(""), null, "unset leaves the month alone");
  assert.equal(factorSourceForSupply("other"), null);
});

/* The lossy direction. "Grid default factor" maps back to four options, so it
   must not overwrite a methodology that already sits in that category. */
test("re-picking the month's factor does not wipe a matching methodology answer", () => {
  const r = supplyForFactorSource("grid_default", "grid_pea");
  assert.equal(r.changed, false);
  assert.equal(r.supply, "grid_pea", "PEA survives");
});

test("a genuine category change clears the option instead of guessing", () => {
  const r = supplyForFactorSource("self_generated", "grid_pea");
  assert.equal(r.changed, true);
  assert.equal(r.supply, "", "not guessed — the exporter re-picks");
  assert.equal(r.category, "Own generation");
});

test("syncFromMonth asks for a re-pick rather than inventing a supplier", () => {
  const mmd = mmdWith({ fuelTypeIds: [], electricitySupply: "grid_pea" });
  const entry = monthWith({ fuels: [], electricityFactorSource: "self_generated" });
  const r = syncFromMonth(mmd, entry, label);
  assert.equal(r.mmd.electricitySupply, "");
  assert.match(r.notes.join(" "), /Re-pick it/);
});

/* ── Both directions together ──────────────────────────────── */

test("syncFromMmd applies fuels and electricity in one pass", () => {
  const mmd = mmdWith({ fuelTypeIds: ["natural_gas"], electricitySupply: "own_solar" });
  const entry = monthWith({ fuels: [], electricityFactorSource: "grid_default" });
  const r = syncFromMmd(mmd, entry, label);
  assert.deepEqual(r.entry.fuels.map((f) => f.fuelType), ["natural_gas"]);
  assert.equal(r.entry.electricityFactorSource, "self_generated");
  assert.equal(r.notes.length, 2, "one note for the fuel, one for the factor");
});

test("a no-op sync says nothing", () => {
  const mmd = mmdWith({ fuelTypeIds: ["natural_gas"], electricitySupply: "grid_pea" });
  const entry = monthWith({ fuels: [fuel("natural_gas")], electricityFactorSource: "grid_default" });
  assert.deepEqual(syncFromMmd(mmd, entry, label).notes, []);
  assert.deepEqual(syncFromMonth(mmd, entry, label).notes, []);
});

/* ── Deleting the "Other fuel" row takes its NAME with it ─────
   The methodology stores an unlisted fuel as the id "other" plus a free-text
   description. Dropping the id and keeping the text leaves a methodology that
   describes rice husk against a year with no rice husk in it — two documents a
   verifier reads side by side, disagreeing, because a deletion only went half
   way. */

test("removing the Other row clears the methodology's description of it too", () => {
  const mmd = mmdWith({ fuelTypeIds: ["natural_gas", "other"], fuelTypesOther: "Rice husk pellets, 14.2 MJ/kg, from Surin" });
  const entry = monthWith({ fuels: [fuel("natural_gas")] }); // the Other row has been deleted

  const r = syncFromMonth(mmd, entry, label);
  assert.deepEqual(r.mmd.fuelTypeIds, ["natural_gas"]);
  assert.equal(r.mmd.fuelTypesOther, "", "the name goes with the row");
});

test("an Other row that is still there keeps its description", () => {
  const mmd = mmdWith({ fuelTypeIds: ["other"], fuelTypesOther: "Rice husk pellets" });
  const entry = monthWith({ fuels: [fuel("other", { fuelTypeOther: "Rice husk pellets" })] });

  const r = syncFromMonth(mmd, entry, label);
  assert.deepEqual(r.mmd.fuelTypeIds, ["other"]);
  assert.equal(r.mmd.fuelTypesOther, "Rice husk pellets");
});

/* ── A row born from the methodology is USABLE ────────────────
   It arrives with its unit and, on a Type I row, its Point G values. Without
   them the row would open with its calorific value and emission factor LOCKED
   AND EMPTY — unfillable from the screen at all. */

test("a row the methodology creates carries the fuel's unit and standard values", () => {
  const r = reconcileFuelRows(["natural_gas"], []);
  const row = r.fuels[0];
  assert.equal(row.unit, "m3", "natural gas is invoiced in m³");
  assert.ok(Math.abs(row.efTco2PerGj - 0.0561) < 1e-9, "Point G emission factor");
  assert.ok(Math.abs((row.ncvMjPerUnit ?? 0) - 34.3488) < 1e-3, "NCV through the density table");
});

test("a fuel with no EU standard value still gets its row, just unfilled", () => {
  const r = reconcileFuelRows(["other"], []);
  assert.equal(r.fuels.length, 1);
  assert.equal(r.fuels[0].efTco2PerGj, 0, "nothing to fill from — the reader supplies it");
});
