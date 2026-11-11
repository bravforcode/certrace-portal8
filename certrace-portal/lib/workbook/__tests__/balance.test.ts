import test from "node:test";
import assert from "node:assert/strict";
import { massBalance, toTonnes } from "../balance";
import type { Sheet } from "../../workspace-sheets";

const s = (id: string, rows: Record<string, string>[]): Sheet => ({
  id, code: "", name: id, cols: [],
  rows: rows.map((cells) => ({ cells, status: "confirmed" as const })),
});

test("toTonnes converts mass units and rejects others", () => {
  assert.equal(toTonnes("1,500", "kg"), 1.5);
  assert.equal(toTonnes("2", "Tonnes"), 2);
  assert.equal(toTonnes("10", "MWh"), null);
  assert.equal(toTonnes("abc", "t"), null);
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
  assert.deepEqual(drawing, { step: "Drawing", inT: 100, outT: 97, diffPct: 0.03, ok: true, ignored: 0 });
  assert.equal(annealing!.ok, false);
  assert.equal(annealing!.ignored, 1);
});
