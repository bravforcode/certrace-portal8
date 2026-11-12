import test from "node:test";
import assert from "node:assert/strict";
import { massBalance, parseQuantity, toTonnes } from "../balance";
import type { Sheet } from "../../workspace-sheets";

const s = (id: string, rows: Record<string, string>[]): Sheet => ({
  id,
  code: "",
  name: id,
  cols: [],
  rows: rows.map((cells) => ({ cells, status: "confirmed" as const })),
});

test("toTonnes converts mass units and rejects others", () => {
  assert.equal(toTonnes("1,500", "kg"), 1.5);
  assert.equal(toTonnes("2", "Tonnes"), 2);
  assert.equal(toTonnes("10", "MWh"), null);
  assert.equal(toTonnes("abc", "t"), null);
});

test("parseQuantity: commas are thousands separators only", () => {
  assert.equal(parseQuantity("1,500"), 1500);
  assert.equal(parseQuantity("1,500.25"), 1500.25);
  assert.equal(parseQuantity("1,5"), null);
  assert.equal(parseQuantity("12,34"), null);
  assert.equal(parseQuantity(" 42 "), 42);
  assert.equal(parseQuantity(""), null);
});

test("toTonnes rejects negative quantities and keeps zero as a valid zero", () => {
  assert.equal(toTonnes("-5", "t"), null);
  assert.equal(toTonnes("0", "t"), 0);
});

test("a step balances within tolerance and flags beyond it", () => {
  const sheets = [
    s("steps", [{ step: "Drawing" }, { step: "Annealing" }]),
    s("materials", [
      { step: "Drawing", item: "Wire rod", qty: "100", unit: "t" },
      { step: "Annealing", item: "Wire", qty: "100", unit: "t" },
      { step: "Annealing", item: "Gas", qty: "50", unit: "MWh" },
    ]),
    s("output", [
      { step: "Drawing", item: "Wire", qty: "97", unit: "t" },
      { step: "Annealing", item: "Wire", qty: "80", unit: "t" },
    ]),
  ];
  const [drawing, annealing] = massBalance(sheets);
  assert.deepEqual(drawing, {
    step: "Drawing",
    inT: 100,
    outT: 97,
    diffPct: 0.03,
    ok: true,
    ignored: 0,
  });
  assert.equal(annealing!.ok, false);
  assert.equal(annealing!.ignored, 1);
});

test("the tolerance boundary is inclusive: exactly 5 % passes, 5.01 % fails", () => {
  const at = (outQty: string) =>
    massBalance(
      [
        s("materials", [{ step: "Draw", qty: "100", unit: "t" }]),
        s("output", [{ step: "Draw", qty: outQty, unit: "t" }]),
      ],
      0.05,
    )[0]!;
  assert.equal(at("95").diffPct, 0.05);
  assert.equal(at("95").ok, true);
  assert.equal(at("94.99").ok, false);
  assert.equal(at("105").ok, true, "output above input is also within 5 %");
  assert.equal(at("105.01").ok, false);
});

test("a step with outputs but no inputs is not ok, and shows no ratio", () => {
  const [b] = massBalance([
    s("output", [{ step: "Pickling", qty: "5", unit: "t" }]),
  ]);
  assert.equal(b!.inT, 0);
  assert.equal(b!.diffPct, null);
  assert.equal(b!.ok, false);
});

test("a step with neither inputs nor outputs is ok (nothing to balance)", () => {
  const [b] = massBalance([s("steps", [{ step: "Planned" }])]);
  assert.equal(b!.diffPct, null);
  assert.equal(b!.ok, true);
});

test("step names that differ only in case and spacing merge into one step", () => {
  const out = massBalance([
    s("materials", [{ step: "Drawing ", qty: "100", unit: "t" }]),
    s("output", [{ step: "  drawing", qty: "98", unit: "t" }]),
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0]!.step, "Drawing");
  assert.equal(out[0]!.inT, 100);
  assert.equal(out[0]!.outT, 98);
});

test("rows with bad, negative or non-mass quantities are ignored and counted", () => {
  const [b] = massBalance([
    s("materials", [
      { step: "Draw", qty: "1,5", unit: "t" },
      { step: "Draw", qty: "-3", unit: "t" },
      { step: "Draw", qty: "10", unit: "MWh" },
      { step: "Draw", qty: "1,500", unit: "kg" },
    ]),
  ]);
  assert.equal(b!.inT, 1.5);
  assert.equal(b!.ignored, 3);
});
