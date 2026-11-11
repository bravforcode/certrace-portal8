import test from "node:test";
import assert from "node:assert/strict";
import { buildFactoryMap } from "../map";
import { massBalance } from "../../workbook/balance";
import type { EmissionEstimate } from "../../workbook/estimate";
import type { Sheet, SheetRow } from "../../workspace-sheets";

const row = (cells: Record<string, string>, status: SheetRow["status"] = "confirmed"): SheetRow => ({ cells, status });
const sheet = (id: string, rows: SheetRow[]): Sheet => ({ id, code: "", name: id, cols: [], rows });
const full = (step: string, item: string, qty: string) => ({ step, item, qty, unit: "t" });
const estimateOf = (byStep: EmissionEstimate["byStep"]): EmissionEstimate => ({
  productionT: 0, directT: 0, indirectT: 0, indirectExcludedT: 0, precursorT: 0, totalT: 0, perTonne: null,
  byStep, precursors: [], unmatched: [], notes: [], biomass: false,
});
const find = (map: ReturnType<typeof buildFactoryMap>, kind: string, label: string) => {
  const n = map.nodes.find((x) => x.kind === kind && x.label === label);
  assert.ok(n, `${kind} node ${label}`);
  return n;
};

// The estimate buckets by the normalised step key (stepKey), not the display label.
test("a step takes its status from its rows, its tCO2e from the estimate, and a tone token", () => {
  const sheets = [
    sheet("steps", [row({ step: "Drawing" }), row({ step: "Annealing" })]),
    sheet("materials", [row(full("Drawing", "Wire rod", "100")), row(full("Annealing", "Wire", "100"))]),
    sheet("output", [row(full("Drawing", "Wire", "99")), row(full("Annealing", "Wire", "70"))]),
  ];
  const map = buildFactoryMap(sheets, estimateOf({ annealing: { directT: 10, indirectT: 1, precursorT: 1.34 } }), massBalance(sheets));
  const drawing = find(map, "step", "Drawing");
  const annealing = find(map, "step", "Annealing");
  assert.equal(drawing.status, "ok");
  assert.equal(drawing.tCO2e, null);
  assert.equal(map.badge[drawing.id], undefined);
  assert.equal(annealing.status, "warn");
  assert.equal(annealing.tCO2e, 12.34);
  assert.equal(map.badge[annealing.id], "12.3 t CO₂e");
  assert.equal(map.tone[annealing.id], "var(--color-warn-text)");
  assert.deepEqual(annealing.gaps.map((g) => g.key), ["Inputs and outputs differ by {pct} %"]);
  assert.equal(annealing.gaps[0]!.params?.pct, "30");
});

test("a step that only the steps sheet names is muted until a row gives it data", () => {
  const map = buildFactoryMap([sheet("steps", [row({ step: "Packing" })])], estimateOf({}), []);
  assert.equal(find(map, "step", "Packing").status, "muted");
  assert.equal(map.tone[find(map, "step", "Packing").id], "var(--flow-edge)");
});

test("a missing required cell turns its step and row red and names the row", () => {
  const sheets = [
    sheet("steps", [row({ step: "Drawing" })]),
    sheet("materials", [row({ step: "Drawing", item: "Wire rod", qty: "100" })]),
  ];
  const map = buildFactoryMap(sheets, estimateOf({}), massBalance(sheets));
  const drawing = find(map, "step", "Drawing");
  assert.equal(drawing.status, "err");
  assert.equal(map.tone[drawing.id], "var(--color-err-text)");
  assert.deepEqual(drawing.gaps[0], { key: "{sheet} row {row}: {cols} missing", params: { sheet: "materials", row: "1", cols: "unit" } });
  assert.equal(find(map, "material", "Wire rod").status, "err");
});

test("a row marked for review turns its node amber without adding a gap", () => {
  const sheets = [
    sheet("steps", [row({ step: "Drawing" })]),
    sheet("materials", [row(full("Drawing", "Wire rod", "100"), "review")]),
    sheet("output", [row(full("Drawing", "Wire", "100"))]),
  ];
  const map = buildFactoryMap(sheets, estimateOf({}), massBalance(sheets));
  assert.equal(find(map, "material", "Wire rod").status, "warn");
  assert.equal(find(map, "step", "Drawing").status, "warn");
  assert.deepEqual(find(map, "step", "Drawing").gaps, []);
});

test("a product takes the status of its own row", () => {
  const sheets = [sheet("products", [row({ cn: "7217", item: "Steel wire" })])];
  const map = buildFactoryMap(sheets, estimateOf({}), []);
  assert.equal(find(map, "product", "Steel wire").status, "err");
});
