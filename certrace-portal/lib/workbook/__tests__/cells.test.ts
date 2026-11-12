import test from "node:test";
import assert from "node:assert/strict";
import { cellKey, rowsUsed, sheetsFromCells } from "../cells";
import { BLANK_ROWS } from "../../workspace-sheets";

test("cellKey matches the server pattern", () => {
  assert.equal(cellKey("materials", 3, "qty"), "materials:3:qty");
});
// Customers must never see invented sample rows mixed with their own data.
test("sheets come only from cells, padded to BLANK_ROWS", () => {
  const sheets = sheetsFromCells(
    { "materials:2:item": "Wire rod", "materials:2:qty": "10" },
    [],
  );
  const m = sheets.find((s) => s.id === "materials")!;
  assert.equal(m.rows.length, BLANK_ROWS);
  assert.deepEqual(m.rows[2]!.cells, { item: "Wire rod", qty: "10" });
  assert.equal(m.rows[2]!.status, "confirmed");
  assert.equal(m.rows[0]!.status, "empty");
  for (const s of sheets)
    if (s.id !== "documents" && s.id !== "materials")
      assert.ok(
        s.rows.every((r) => Object.keys(r.cells).length === 0),
        s.id,
      );
});
test("rows grow past BLANK_ROWS when data needs it", () => {
  assert.equal(rowsUsed({ "steps:45:step": "x" }, "steps"), 46);
  const s = sheetsFromCells({ "steps:45:step": "x" }, []).find(
    (x) => x.id === "steps",
  )!;
  assert.equal(s.rows.length, 51);
});
test("a status cell sets the row status", () => {
  const s = sheetsFromCells(
    { "energy:0:item": "LPG", "energy:0:status": "review" },
    [],
  ).find((x) => x.id === "energy")!;
  assert.equal(s.rows[0]!.status, "review");
});
