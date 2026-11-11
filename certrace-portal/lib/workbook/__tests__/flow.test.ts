import test from "node:test";
import assert from "node:assert/strict";
import { buildFlow, UNASSIGNED_ID } from "../flow";
import type { Sheet } from "../../workspace-sheets";
import { TH_WORKSPACE } from "../../i18n-th-workspace";

const s = (id: string, rows: Record<string, string>[]): Sheet => ({
  id,
  code: "",
  name: id,
  cols: [],
  rows: rows.map((cells) => ({ cells, status: "confirmed" as const })),
});
const sheets = [
  s("steps", [{ step: "Drawing" }, { step: "Annealing" }]),
  s("materials", [{ step: "Drawing", item: "Wire rod", qty: "1000", unit: "t" }]),
  s("energy", [{ step: "Annealing", item: "Natural gas", qty: "50", unit: "GJ" }, { step: "Plating", item: "Electricity" }]),
  s("output", [{ step: "Annealing", item: "Steel wire" }]),
  s("products", [{ cn: "7217", item: "Steel wire" }]),
  s("flow", []),
];
const withFlow = (rows: Record<string, string>[]) => sheets.map((x) => (x.id === "flow" ? s("flow", rows) : x));
const byLabel = (f: ReturnType<typeof buildFlow>, l: string) => f.nodes.find((n) => n.label === l)!;

// The diagram replaces reading the sheets, so every entered row must appear.
test("every row becomes a node and steps chain left to right", () => {
  const f = buildFlow(sheets);
  for (const l of ["Drawing", "Annealing", "Wire rod", "Natural gas", "Electricity", "Steel wire"])
    assert.ok(f.nodes.some((n) => n.label === l), l);
  assert.ok(f.nodes.some((n) => n.id === UNASSIGNED_ID && n.fallback === "unassigned"), "unknown step gets the Unassigned node");
  const drawing = byLabel(f, "Drawing");
  const annealing = byLabel(f, "Annealing");
  assert.ok(drawing.x < annealing.x);
  assert.ok(f.edges.some((e) => e.from === drawing.id && e.to === annealing.id));
  const rod = byLabel(f, "Wire rod");
  assert.ok(rod.y < drawing.y, "materials above");
  const gas = byLabel(f, "Natural gas");
  assert.ok(gas.y > annealing.y, "energy below");
  assert.equal(rod.detail, "1000 t");
});

test("explicit Flow rows replace the default chain", () => {
  const f = buildFlow(withFlow([{ from: "Annealing", to: "Drawing", item: "Scrap" }]));
  const id = (l: string) => byLabel(f, l).id;
  assert.ok(f.edges.some((e) => e.from === id("Annealing") && e.to === id("Drawing") && e.label === "Scrap"));
  assert.ok(!f.edges.some((e) => e.from === id("Drawing") && e.to === id("Annealing")));
});

test("names are trimmed before matching", () => {
  const f = buildFlow([
    s("steps", [{ step: " Drawing " }]),
    s("materials", [{ step: "Drawing ", item: " Wire rod ", qty: " 1 ", unit: "t" }]),
  ]);
  const rod = byLabel(f, "Wire rod");
  assert.equal(rod.detail, "1 t");
  assert.ok(f.edges.some((e) => e.from === rod.id && e.to === byLabel(f, "Drawing").id), "material attached to its step");
  assert.ok(!f.nodes.some((n) => n.id === UNASSIGNED_ID), "nothing fell through to Unassigned");
});

test("Flow rows naming unknown steps attach to Unassigned", () => {
  const f = buildFlow(withFlow([{ from: "Drawing", to: "Nope", item: "Scrap" }]));
  assert.ok(f.edges.some((e) => e.from === byLabel(f, "Drawing").id && e.to === UNASSIGNED_ID && e.label === "Scrap"));
});

test("blank Flow rows fall back to the default step chain", () => {
  const f = buildFlow(withFlow([{ from: " ", to: "", item: "x" }]));
  assert.ok(f.edges.some((e) => e.from === byLabel(f, "Drawing").id && e.to === byLabel(f, "Annealing").id));
});

test("a real step named like the fallback does not collide with Unassigned", () => {
  const f = buildFlow([
    s("steps", [{ step: "Unassigned step" }]),
    s("energy", [{ step: "Plating", item: "Electricity" }]),
  ]);
  const real = f.nodes.find((n) => n.kind === "step" && n.label === "Unassigned step")!;
  assert.notEqual(real.id, UNASSIGNED_ID);
  assert.ok(f.nodes.some((n) => n.id === UNASSIGNED_ID && n.kind === "step"));
  assert.equal(new Set(f.nodes.map((n) => n.id)).size, f.nodes.length, "ids unique");
});

test("duplicate item names get unique ids", () => {
  const f = buildFlow([
    s("steps", [{ step: "Drawing" }]),
    s("materials", [
      { step: "Drawing", item: "Wire rod", qty: "1", unit: "t" },
      { step: "Drawing", item: "Wire rod", qty: "2", unit: "t" },
    ]),
  ]);
  const ids = f.nodes.map((n) => n.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(f.nodes.filter((n) => n.label === "Wire rod").length, 2);
});

test("each output links to its step, unknown-step outputs to the last step, and products to every matching output", () => {
  const f = buildFlow([
    s("steps", [{ step: "Drawing" }, { step: "Annealing" }]),
    s("output", [
      { step: "Annealing", item: "Steel wire" },
      { step: "Drawing", item: "Steel wire" },
      { step: "Nowhere", item: "Slag" },
    ]),
    s("products", [{ cn: "7217", item: "Steel wire" }]),
  ]);
  const annealing = byLabel(f, "Annealing").id;
  const drawing = byLabel(f, "Drawing").id;
  const product = f.nodes.find((n) => n.kind === "product")!.id;
  const slag = byLabel(f, "Slag").id;
  const wire = f.nodes.filter((n) => n.kind === "output" && n.label === "Steel wire").map((n) => n.id);
  assert.ok(f.edges.some((e) => e.from === annealing && e.to === wire[0]));
  assert.ok(f.edges.some((e) => e.from === drawing && e.to === wire[1]));
  assert.ok(f.edges.some((e) => e.from === annealing && e.to === slag), "unknown step falls back to the last step");
  assert.ok(f.edges.some((e) => e.from === wire[0] && e.to === product));
  assert.ok(f.edges.some((e) => e.from === wire[1] && e.to === product));
});

test("an output with no steps at all hangs off Unassigned", () => {
  const f = buildFlow([s("output", [{ item: "Scrap" }])]);
  assert.ok(f.edges.some((e) => e.from === UNASSIGNED_ID && e.to === byLabel(f, "Scrap").id));
});

test("empty sheets give an empty diagram", () => {
  const f = buildFlow([s("steps", []), s("materials", []), s("flow", [])]);
  assert.equal(f.nodes.length, 0);
  assert.equal(f.width, 0);
  assert.equal(f.height, 0);
  assert.equal(buildFlow([]).nodes.length, 0);
});

test("every coordinate is non-negative", () => {
  const f = buildFlow([
    ...sheets.filter((x) => x.id !== "flow"),
    s("materials", [{ step: "Nowhere", item: "Coke", qty: "3", unit: "t" }]),
  ]);
  for (const n of f.nodes) {
    assert.ok(n.x >= 0 && n.y >= 0, `${n.id} at ${n.x},${n.y}`);
  }
});

test("500 rows finish and stay bounded in height", () => {
  const rows = Array.from({ length: 500 }, (_, i) => ({ step: "Drawing", item: `Rod ${i}`, qty: "1", unit: "t" }));
  const f = buildFlow([s("steps", [{ step: "Drawing" }]), s("materials", rows)]);
  assert.equal(f.nodes.length, 501);
  assert.ok(f.height <= 900, `height ${f.height}`);
  assert.ok(f.nodes.every((n) => n.x >= 0 && n.y >= 0));
});

test("every label the diagram shows has a Thai row", () => {
  for (const key of [
    "Unassigned step",
    "Material",
    "Energy",
    "Output",
    "Product",
    "Process step",
    "Raw material",
    "Energy source",
    "Table",
    "Flow",
    "View",
    "Legend",
    "Production flow diagram",
    "Open process steps",
    "Add steps in sheet 02 to see your production flow.",
  ])
    assert.ok(TH_WORKSPACE[key], key);
});
