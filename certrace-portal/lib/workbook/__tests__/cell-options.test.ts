import test from "node:test";
import assert from "node:assert/strict";
import { cellOptions } from "../cell-options";
import { toTonnes } from "../balance";
import { NO_FILE, buildSheets, type Sheet } from "../../workspace-sheets";

const withRows = (
  sheets: Sheet[],
  id: string,
  rows: Record<string, string>[],
): Sheet[] =>
  sheets.map((s) =>
    s.id === id
      ? {
          ...s,
          rows: rows.map((cells) => ({ cells, status: "review" as const })),
        }
      : s,
  );

const colOf = (sheets: Sheet[], id: string, key: string) => {
  const sheet = sheets.find((s) => s.id === id)!;
  return { sheet, col: sheet.cols.find((c) => c.key === key)! };
};

test("a unit picked from the list is one the mass balance can read", () => {
  // The list exists so nobody types "tonne" in one row and "tns" in the next; a picked mass unit must convert.
  const sheets = buildSheets([]);
  const { sheet, col } = colOf(sheets, "materials", "unit");
  const units = cellOptions(sheet, col, sheets);
  assert.ok(units.includes("t") && units.includes("kg"));
  assert.equal(toTonnes("1000", "kg"), 1);
  for (const u of ["t", "kg"]) assert.notEqual(toTonnes("1", u), null);
});

test("step cells offer the steps named on the Process steps sheet", () => {
  let sheets = buildSheets([]);
  sheets = withRows(sheets, "steps", [
    { step: "Melting" },
    { step: "Casting" },
    { step: "" },
  ]);
  const { sheet, col } = colOf(sheets, "materials", "step");
  assert.deepEqual(cellOptions(sheet, col, sheets), ["Melting", "Casting"]);
});

test("a value already typed in the column comes back once, whatever its case", () => {
  let sheets = buildSheets([]);
  sheets = withRows(sheets, "materials", [
    { unit: "bags" },
    { unit: "Bags" },
    { unit: "t" },
  ]);
  const { sheet, col } = colOf(sheets, "materials", "unit");
  const units = cellOptions(sheet, col, sheets);
  assert.equal(units.filter((u) => u.toLowerCase() === "bags").length, 1);
  assert.equal(units.filter((u) => u === "t").length, 1);
});

test("source cells offer the year's uploaded files and No file", () => {
  const sheets = buildSheets([
    {
      id: "a",
      name: "gas.pdf",
      size: 10,
      type: "application/pdf",
      description: "",
    },
  ]);
  const { sheet, col } = colOf(sheets, "energy", "source");
  assert.deepEqual(cellOptions(sheet, col, sheets), ["gas.pdf", NO_FILE]);
});

test("numbers and the status column drop no list", () => {
  const sheets = buildSheets([]);
  for (const key of ["qty", "status"]) {
    const { sheet, col } = colOf(sheets, "materials", key);
    assert.deepEqual(cellOptions(sheet, col, sheets), []);
  }
});
