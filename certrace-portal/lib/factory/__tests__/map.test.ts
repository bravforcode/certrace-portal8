import test from "node:test";
import assert from "node:assert/strict";
import { buildFactoryMap } from "../map";
import { massBalance, stepKey } from "../../workbook/balance";
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
const unassigned = (map: ReturnType<typeof buildFactoryMap>) => {
  const n = map.nodes.find((x) => x.fallback === "unassigned");
  assert.ok(n, "Unassigned node");
  return n;
};

// The estimate buckets by the normalised step key (stepKey), not the display label.
test("a step takes its status from its rows, its tCO2e from the estimate, and a tone token", () => {
  const sheets = [
    sheet("steps", [row({ step: "Drawing" }), row({ step: "Annealing" })]),
    sheet("materials", [row(full("Drawing", "Wire rod", "100")), row(full("Annealing", "Wire", "100"))]),
    sheet("output", [row(full("Drawing", "Wire", "99")), row(full("Annealing", "Wire", "70"))]),
  ];
  const map = buildFactoryMap(sheets, estimateOf({ annealing: { directT: 10, indirectT: 1, precursorT: 1 } }), massBalance(sheets));
  const drawing = find(map, "step", "Drawing");
  const annealing = find(map, "step", "Annealing");
  assert.equal(drawing.status, "ok");
  assert.equal(drawing.tCO2e, null);
  assert.equal(map.badge[drawing.id], undefined);
  assert.equal(annealing.status, "warn");
  assert.equal(annealing.tCO2e, 12);
  assert.deepEqual(map.badge[annealing.id], { key: "{n} gaps · {t} t CO₂e", params: { n: "1", t: "12.0" } });
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

test("step keys ignore case and spacing, so an estimate bucket reaches its step", () => {
  assert.equal(stepKey("  ANNEALING "), stepKey("Annealing"));
  const sheets = [sheet("steps", [row({ step: "Annealing" })])];
  const map = buildFactoryMap(sheets, estimateOf({ [stepKey(" ANNEALING ")]: { directT: 5, indirectT: 0, precursorT: 0 } }), []);
  assert.equal(find(map, "step", "Annealing").tCO2e, 5);
});

test("a row whose step the Steps sheet does not name lands on the Unassigned node", () => {
  const sheets = [
    sheet("steps", [row({ step: "Drawing" })]),
    sheet("materials", [row({ step: "Nowhere", item: "Wire", qty: "100" })]),
  ];
  const map = buildFactoryMap(sheets, estimateOf({}), massBalance(sheets));
  assert.equal(unassigned(map).status, "err");
  assert.equal(find(map, "step", "Drawing").status, "muted");
});

test("an err row beats a review row on the same step", () => {
  const sheets = [
    sheet("steps", [row({ step: "Drawing" })]),
    sheet("materials", [row(full("Drawing", "Wire rod", "100"), "review"), row({ step: "Drawing", item: "Oil", qty: "5" })]),
  ];
  const map = buildFactoryMap(sheets, estimateOf({}), massBalance(sheets));
  assert.equal(find(map, "step", "Drawing").status, "err");
});

test("a step whose balance fails and whose rows are complete is amber with only the balance gap", () => {
  const sheets = [
    sheet("steps", [row({ step: "Drawing" })]),
    sheet("materials", [row(full("Drawing", "Wire rod", "100"))]),
    sheet("output", [row(full("Drawing", "Wire", "50"))]),
  ];
  const map = buildFactoryMap(sheets, estimateOf({}), massBalance(sheets));
  const drawing = find(map, "step", "Drawing");
  assert.equal(drawing.status, "warn");
  assert.deepEqual(drawing.gaps.map((g) => g.key), ["Inputs and outputs differ by {pct} %"]);
});

test("energy and output nodes take the status of their own row", () => {
  const sheets = [
    sheet("steps", [row({ step: "Drawing" })]),
    sheet("energy", [row({ step: "Drawing", item: "Natural gas", qty: "5" })]),
    sheet("output", [row({ step: "Drawing", item: "Wire", qty: "5", unit: "t" }, "review")]),
  ];
  const map = buildFactoryMap(sheets, estimateOf({}), []);
  assert.equal(find(map, "energy", "Natural gas").status, "err");
  assert.equal(find(map, "output", "Wire").status, "warn");
});

test("the same item name in two steps colours only its own step", () => {
  const sheets = [
    sheet("steps", [row({ step: "Drawing" }), row({ step: "Annealing" })]),
    sheet("materials", [row({ step: "Drawing", item: "Wire", qty: "100" }), row(full("Annealing", "Wire", "100"))]),
  ];
  const map = buildFactoryMap(sheets, estimateOf({}), massBalance(sheets));
  const wires = map.nodes.filter((n) => n.kind === "material" && n.label === "Wire");
  assert.equal(wires.find((n) => n.step === "Drawing")!.status, "err");
  assert.equal(wires.find((n) => n.step === "Annealing")!.status, "ok");
});

test("a row that has not started counts for nothing, even when marked missing", () => {
  const sheets = [
    sheet("steps", [row({ step: "Drawing" })]),
    sheet("materials", [row(full("Drawing", "Wire rod", "100")), row({}, "missing")]),
    sheet("output", [row(full("Drawing", "Wire", "100"))]),
  ];
  const map = buildFactoryMap(sheets, estimateOf({}), massBalance(sheets));
  assert.equal(find(map, "step", "Drawing").status, "ok");
  assert.deepEqual(find(map, "step", "Drawing").gaps, []);
});

test("tCO2e and its badge are absent without an estimate; gaps still show in the badge", () => {
  const sheets = [
    sheet("steps", [row({ step: "Drawing" })]),
    sheet("materials", [row({ step: "Drawing", item: "Wire rod", qty: "100" })]),
  ];
  const map = buildFactoryMap(sheets, estimateOf({}), massBalance(sheets));
  const drawing = find(map, "step", "Drawing");
  assert.equal(drawing.tCO2e, null);
  assert.deepEqual(map.badge[drawing.id], { key: "{n} gaps", params: { n: "1" } });
});
