import test from "node:test";
import assert from "node:assert/strict";
import { buildFlow } from "../flow";
import type { Sheet } from "../../workspace-sheets";

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

// The diagram replaces reading the sheets, so every entered row must appear.
test("every row becomes a node and steps chain left to right", () => {
  const f = buildFlow(sheets);
  const labels = f.nodes.map((n) => n.label);
  for (const l of ["Drawing", "Annealing", "Wire rod", "Natural gas", "Electricity", "Steel wire", "Unassigned step"])
    assert.ok(labels.includes(l), l);
  const drawing = f.nodes.find((n) => n.label === "Drawing")!;
  const annealing = f.nodes.find((n) => n.label === "Annealing")!;
  assert.ok(drawing.x < annealing.x);
  assert.ok(f.edges.some((e) => e.from === drawing.id && e.to === annealing.id));
  const rod = f.nodes.find((n) => n.label === "Wire rod")!;
  assert.ok(rod.y < drawing.y, "materials above");
  const gas = f.nodes.find((n) => n.label === "Natural gas")!;
  assert.ok(gas.y > annealing.y, "energy below");
  assert.equal(rod.detail, "1000 t");
});
test("explicit Flow rows replace the default chain", () => {
  const withFlow = sheets.map((x) => (x.id === "flow" ? s("flow", [{ from: "Annealing", to: "Drawing", item: "Scrap" }]) : x));
  const f = buildFlow(withFlow);
  const id = (l: string) => f.nodes.find((n) => n.label === l)!.id;
  assert.ok(f.edges.some((e) => e.from === id("Annealing") && e.to === id("Drawing") && e.label === "Scrap"));
  assert.ok(!f.edges.some((e) => e.from === id("Drawing") && e.to === id("Annealing")));
});
test("empty workbook gives an empty diagram", () => {
  assert.equal(buildFlow([]).nodes.length, 0);
});
