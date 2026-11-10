import test from "node:test";
import assert from "node:assert/strict";
import { missingCells, sheetStatus, SHEET_ORDER, statusTooltip } from "../status";
import type { Sheet } from "../../workspace-sheets";

const sheet = (rows: Sheet["rows"]): Sheet => ({
  id: "materials",
  code: "03",
  name: "Raw materials",
  cols: [],
  rows,
});
const req = ["item", "qty", "unit"];

// The tab colour is the customer's to-do list: red must mean "something is
// missing here", never just "you have not looked yet".
test("no values is untouched", () => {
  assert.equal(sheetStatus(sheet([{ cells: {}, status: "empty" }]), req), "untouched");
});
test("a started row without a required column is missing", () => {
  assert.equal(
    sheetStatus(sheet([{ cells: { item: "Wire rod", qty: "10" }, status: "confirmed" }]), req),
    "missing",
  );
});
test("a missing flag is missing even when columns are filled", () => {
  const row = {
    cells: { item: "a", qty: "1", unit: "t" },
    status: "confirmed" as const,
    flags: { qty: "missing" as const },
  };
  assert.equal(sheetStatus(sheet([row]), req), "missing");
});
test("review rows or warn flags give review", () => {
  assert.equal(
    sheetStatus(sheet([{ cells: { item: "a", qty: "1", unit: "t" }, status: "review" }]), req),
    "review",
  );
  const warn = {
    cells: { item: "a", qty: "1", unit: "t" },
    status: "confirmed" as const,
    flags: { qty: "warn" as const },
  };
  assert.equal(sheetStatus(sheet([warn]), req), "review");
});
test("all started rows complete is complete; blank rows are ignored", () => {
  const rows: Sheet["rows"] = [
    { cells: { item: "a", qty: "1", unit: "t" }, status: "confirmed" },
    { cells: {}, status: "empty" },
  ];
  assert.equal(sheetStatus(sheet(rows), req), "complete");
});
test("a status cell alone does not start a row", () => {
  assert.equal(sheetStatus(sheet([{ cells: { status: "review" }, status: "empty" }]), req), "untouched");
});

const labelled = (rows: Sheet["rows"]): Sheet => ({
  ...sheet(rows),
  cols: [
    { key: "item", label: "Item", kind: "text", width: "1fr" },
    { key: "qty", label: "Qty", kind: "number", width: "80px" },
    { key: "unit", label: "Unit", kind: "unit", width: "80px" },
  ],
});

test("missingCells lists required and flagged gaps per started row", () => {
  const s = labelled([
    { cells: {}, status: "empty" },
    { cells: { item: "Wire rod" }, status: "confirmed" },
    { cells: { item: "a", qty: "1", unit: "t" }, status: "confirmed", flags: { qty: "missing" } },
  ]);
  assert.deepEqual(missingCells(s, req), [
    { row: 1, cols: ["qty", "unit"] },
    { row: 2, cols: ["qty"] },
  ]);
});
test("statusTooltip names rows (1-based) and column labels", () => {
  const s = labelled([{ cells: { item: "Wire rod" }, status: "confirmed" }]);
  assert.equal(statusTooltip(s, req), "Missing data — row 1: Qty, Unit");
});
test("statusTooltip caps the list at 5 rows", () => {
  const rows = Array.from({ length: 7 }, () => ({ cells: { item: "x" }, status: "confirmed" as const }));
  assert.match(statusTooltip(labelled(rows), req), /row 5: Qty, Unit; \+2 more$/);
});
test("statusTooltip for other states is the plain label", () => {
  assert.equal(statusTooltip(labelled([{ cells: {}, status: "empty" }]), req), "Not started");
});
test("statusTooltip for a missing-flagged row with no gap columns still says why", () => {
  const s = labelled([{ cells: { item: "a", qty: "1", unit: "t" }, status: "missing" }]);
  assert.equal(sheetStatus(s, req), "missing");
  assert.equal(statusTooltip(s, req), "Missing data — marked missing");
});
test("SHEET_ORDER follows the material flow", () => {
  assert.deepEqual(SHEET_ORDER.slice(0, 4), ["installation", "products", "steps", "materials"]);
  assert.equal(SHEET_ORDER.at(-1), "documents");
});
