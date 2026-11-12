import test from "node:test";
import assert from "node:assert/strict";
import { estimateEmissions, matchFuel } from "../estimate";
import { euStandardFor } from "../../cbam/fuel-defaults";
import { gridFactorFor } from "../../cbam/electricity-grid-factors";
import { defaultFor } from "../../cbam/precursor-basis";
import type { Sheet } from "../../workspace-sheets";

const s = (id: string, rows: Record<string, string>[]): Sheet => ({
  id,
  code: "",
  name: id,
  cols: [],
  rows: rows.map((cells) => ({ cells, status: "confirmed" as const })),
});
const TH = { country: "TH", year: 2026 };
const grid = gridFactorFor("TH")!.value!;

test("matchFuel reads English and Thai labels", () => {
  assert.equal(matchFuel("ก๊าซธรรมชาติ (NG)", "m3"), "natural_gas");
  assert.equal(matchFuel("Grid power", "kWh"), "electricity");
  assert.equal(matchFuel("Steam from neighbour", "t"), null);
});

test("matchFuel uses word boundaries: charcoal is not coal, coke oven gas is not coke", () => {
  assert.equal(matchFuel("Charcoal", "t"), null);
  assert.equal(matchFuel("Coke oven gas", "m3"), null);
  assert.equal(matchFuel("Coal", "t"), "anthracite_bituminous");
  assert.equal(matchFuel("Unknown fluid", "t"), null);
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
    s("materials", [
      {
        step: "Annealing",
        item: "Wire rod",
        cn: "72139110",
        qty: "1020",
        unit: "t",
      },
    ]),
  ];
  const e = estimateEmissions(sheets, TH);
  const gas = euStandardFor("natural_gas", "GJ")!;
  const rod = defaultFor("72139110", undefined, 2026)!;
  assert.ok(Math.abs(e.directT - 1000 * gas.efTco2PerGj) < 1e-9);
  assert.ok(Math.abs(e.precursorT - 1020 * rod.total) < 1e-9);
  assert.equal(e.productionT, 1000);
  assert.ok(Math.abs(e.perTonne! - e.totalT / 1000) < 1e-12);
  assert.deepEqual(e.unmatched, [
    { key: "{item} ({qty})", params: { item: "Mystery fuel", qty: "5 t" } },
  ]);
  assert.equal(e.byStep["annealing"]!.precursorT, e.precursorT);
  assert.equal(e.precursors[0]!.defaultSee, rod.total);
});

test("electricity accepts kWh and MWh only, and GJ is unmatched", () => {
  const withEnergy = (rows: Record<string, string>[]) =>
    estimateEmissions([s("energy", rows)], TH);
  const kwh = withEnergy([{ item: "Grid power", qty: "2000", unit: "kWh" }]);
  const mwh = withEnergy([{ item: "Grid power", qty: "2", unit: "MWh" }]);
  assert.ok(Math.abs(kwh.indirectT - 2 * grid) < 1e-9);
  assert.ok(Math.abs(mwh.indirectT - 2 * grid) < 1e-9);
  const gj = withEnergy([{ item: "Grid power", qty: "2", unit: "GJ" }]);
  assert.equal(gj.indirectT, 0);
  assert.deepEqual(gj.unmatched, [
    { key: "{item} ({qty})", params: { item: "Grid power", qty: "2 GJ" } },
  ]);
  const blank = withEnergy([{ item: "Grid power", qty: "2", unit: "" }]);
  assert.equal(blank.unmatched.length, 1);
});

test("an empty installation country gives its own message, not a grid-default message", () => {
  const e = estimateEmissions(
    [s("energy", [{ item: "Grid power", qty: "1000", unit: "kWh" }])],
    { country: "", year: 2026 },
  );
  assert.deepEqual(e.unmatched, [
    { key: "Set the installation country to estimate electricity" },
  ]);
});

test("an unknown CN is unmatched, not priced", () => {
  const e = estimateEmissions(
    [s("materials", [{ item: "Odd", cn: "99999999", qty: "10", unit: "t" }])],
    TH,
  );
  assert.equal(e.precursorT, 0);
  assert.deepEqual(e.unmatched, [
    { key: "{item} (CN {cn})", params: { item: "Odd", cn: "99999999" } },
  ]);
});

test("negative and blank quantities are rejected; zero is a valid zero", () => {
  const e = estimateEmissions(
    [
      s("energy", [
        { item: "Natural gas", qty: "-5", unit: "GJ" },
        { item: "Natural gas", qty: "0", unit: "GJ" },
      ]),
    ],
    TH,
  );
  assert.equal(e.directT, 0);
  assert.equal(e.unmatched.length, 1);
  assert.equal(e.unmatched[0]!.params!.qty, "-5 GJ");
  // blank quantity on a CN row is skipped, not reported
  const m = estimateEmissions(
    [s("materials", [{ cn: "72139110", item: "Rod", qty: "", unit: "t" }])],
    TH,
  );
  assert.deepEqual(m.unmatched, []);
});

test("a product with a non-mass unit or bad number is unmatched and left out of production", () => {
  const e = estimateEmissions(
    [
      s("products", [
        { cn: "72172000", item: "Wire", qty: "10", unit: "MWh" },
        { cn: "72172000", item: "Coil", qty: "1,5", unit: "t" },
        { cn: "72172000", item: "Bar", qty: "1,500", unit: "kg" },
      ]),
    ],
    TH,
  );
  assert.equal(e.productionT, 1.5);
  assert.equal(e.unmatched.length, 2);
  assert.equal(e.unmatched[0]!.params!.item, "Wire");
  assert.equal(e.unmatched[1]!.params!.item, "Coil");
});

test("indirect emissions are excluded when every product is direct-only (steel)", () => {
  const e = estimateEmissions(
    [
      s("products", [
        { cn: "72061000", item: "Crude steel", qty: "1000", unit: "t" },
      ]),
      s("energy", [{ item: "Grid power", qty: "1000", unit: "kWh" }]),
    ],
    TH,
  );
  assert.equal(e.indirectT, 0);
  assert.ok(Math.abs(e.indirectExcludedT - grid) < 1e-9);
  assert.equal(e.totalT, e.directT + e.precursorT);
  assert.ok(
    e.notes.some(
      (n) =>
        n.key === "Indirect emissions excluded: products are direct-only goods",
    ),
  );
});

test("a steel CN not in the goods table is unknown: indirect counted with a note, not guessed", () => {
  const e = estimateEmissions(
    [
      s("products", [{ cn: "72172000", item: "Wire", qty: "1000", unit: "t" }]),
      s("energy", [{ item: "Grid power", qty: "1000", unit: "kWh" }]),
    ],
    TH,
  );
  assert.ok(Math.abs(e.indirectT - grid) < 1e-9);
  assert.ok(
    e.notes.some(
      (n) =>
        n.key ===
        "Products without a recognised CN code count indirect emissions",
    ),
  );
});

test("indirect emissions count for a cement product", () => {
  const e = estimateEmissions(
    [
      s("products", [
        { cn: "25231000", item: "Clinker", qty: "1000", unit: "t" },
      ]),
      s("energy", [{ item: "Grid power", qty: "1000", unit: "kWh" }]),
    ],
    TH,
  );
  assert.ok(Math.abs(e.indirectT - grid) < 1e-9);
  assert.equal(e.indirectExcludedT, 0);
});

test("a product with no CN, or a CN off the goods list, counts indirect and says so", () => {
  for (const cn of ["", "39011000"]) {
    const e = estimateEmissions(
      [
        s("products", [{ cn, item: "Thing", qty: "1000", unit: "t" }]),
        s("energy", [{ item: "Grid power", qty: "1000", unit: "kWh" }]),
      ],
      TH,
    );
    assert.ok(Math.abs(e.indirectT - grid) < 1e-9, `cn="${cn}"`);
    assert.ok(
      e.notes.some(
        (n) =>
          n.key ===
          "Products without a recognised CN code count indirect emissions",
      ),
      `cn="${cn}"`,
    );
  }
});

test("no products entered: indirect is counted and a note says so", () => {
  const e = estimateEmissions(
    [s("energy", [{ item: "Grid power", qty: "1000", unit: "kWh" }])],
    TH,
  );
  assert.ok(Math.abs(e.indirectT - grid) < 1e-9);
  assert.ok(
    e.notes.some(
      (n) => n.key === "No products entered; indirect emissions included",
    ),
  );
});

test("biomass sets the preliminary-factor flag and a footnote", () => {
  const std = euStandardFor("biomass", "t");
  assert.ok(std, "biomass must have a standard row for the test");
  const e = estimateEmissions(
    [s("energy", [{ item: "Biomass pellets", qty: "10", unit: "t" }])],
    TH,
  );
  assert.equal(e.biomass, true);
  assert.ok(
    e.notes.some(
      (n) => n.key === "Biomass emission factor is preliminary (Table 2)",
    ),
  );
  const plain = estimateEmissions(
    [s("energy", [{ item: "Natural gas", qty: "10", unit: "GJ" }])],
    TH,
  );
  assert.equal(plain.biomass, false);
});

test("byStep merges step names that differ in case and whitespace", () => {
  const e = estimateEmissions(
    [
      s("energy", [
        { step: "Annealing ", item: "Natural gas", qty: "10", unit: "GJ" },
      ]),
      s("materials", [
        {
          step: "  annealing",
          item: "Rod",
          cn: "72139110",
          qty: "10",
          unit: "t",
        },
      ]),
    ],
    TH,
  );
  assert.equal(Object.keys(e.byStep).length, 1);
  assert.ok(
    e.byStep["annealing"]!.directT > 0 && e.byStep["annealing"]!.precursorT > 0,
  );
});
