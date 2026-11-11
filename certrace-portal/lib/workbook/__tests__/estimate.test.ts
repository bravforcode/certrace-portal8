import test from "node:test";
import assert from "node:assert/strict";
import { estimateEmissions, matchFuel } from "../estimate";
import { euStandardFor } from "../../cbam/fuel-defaults";
import { defaultFor } from "../../cbam/precursor-basis";
import type { Sheet } from "../../workspace-sheets";

const s = (id: string, rows: Record<string, string>[]): Sheet => ({
  id, code: "", name: id, cols: [],
  rows: rows.map((cells) => ({ cells, status: "confirmed" as const })),
});

test("matchFuel reads English and Thai labels", () => {
  assert.equal(matchFuel("ก๊าซธรรมชาติ (NG)", "m3"), "natural_gas");
  assert.equal(matchFuel("Grid power", "kWh"), "electricity");
  assert.equal(matchFuel("Steam from neighbour", "t"), null);
});

// The estimate must equal the portal's own factor tables, not a second copy of them.
test("estimate uses the CBAM factor tables and splits by step", () => {
  const sheets = [
    s("steps", [{ step: "Annealing" }]),
    s("products", [{ cn: "72172000", item: "Wire", qty: "1000", unit: "t" }]),
    s("energy", [
      { step: "Annealing", item: "Natural gas", qty: "1000", unit: "GJ" },
      { step: "Annealing", item: "Mystery fuel", qty: "5", unit: "t" },
    ]),
    s("materials", [{ step: "Annealing", item: "Wire rod", cn: "72139110", qty: "1020", unit: "t" }]),
  ];
  const e = estimateEmissions(sheets, { country: "TH", year: 2026 });
  const gas = euStandardFor("natural_gas", "GJ")!;
  const rod = defaultFor("72139110", undefined, 2026)!;
  assert.ok(Math.abs(e.directT - 1000 * gas.efTco2PerGj) < 1e-9);
  assert.ok(Math.abs(e.precursorT - 1020 * rod.total) < 1e-9);
  assert.equal(e.productionT, 1000);
  assert.ok(Math.abs(e.perTonne! - e.totalT / 1000) < 1e-12);
  assert.deepEqual(e.unmatched, ["Mystery fuel (5 t)"]);
  assert.equal(e.byStep.Annealing!.precursorT, e.precursorT);
  assert.equal(e.precursors[0]!.defaultSee, rod.total);
});
