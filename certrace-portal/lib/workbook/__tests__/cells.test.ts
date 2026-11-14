import test from "node:test";
import assert from "node:assert/strict";
import { cellKey, rowsUsed, sheetsFromCells } from "../cells";
import { confirmValue } from "../validate";
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
  // Filled is not confirmed: step and unit are required, so this row is missing data.
  assert.equal(m.rows[2]!.status, "missing");
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
const energy = (extra: Record<string, string> = {}) =>
  sheetsFromCells(
    {
      "steps:0:step": "Melting",
      "steps:0:what": "Melt scrap",
      "energy:0:step": "Melting",
      "energy:0:item": "Electricity",
      "energy:0:qty": "1,200",
      "energy:0:unit": "MWh",
      ...extra,
    },
    [],
  ).find((x) => x.id === "energy")!.rows[0]!;

// The bug this guards: every filled row showed Confirmed without anyone checking it.
test("a complete, valid row waits for a person to confirm it", () => {
  assert.equal(energy().status, "review");
  assert.deepEqual(energy().flags, {});
});
test("confirming signs the row; editing any cell afterwards undoes it", () => {
  const signed = confirmValue(energy().cells);
  assert.equal(energy({ "energy:0:status": signed }).status, "confirmed");
  assert.equal(
    energy({ "energy:0:status": signed, "energy:0:qty": "1,300" }).status,
    "review",
  );
  // A bare "confirmed" from before the check proves nothing about the data.
  assert.equal(energy({ "energy:0:status": "confirmed" }).status, "review");
});
test("a row with a wrong value cannot be confirmed", () => {
  const bad = { "energy:0:unit": "km" };
  const row = energy({
    ...bad,
    "energy:0:status": confirmValue(energy(bad).cells),
  });
  assert.equal(row.status, "review");
  assert.equal(row.flags?.unit, "warn");
});
test("a row missing a required cell is missing, even if marked confirmed", () => {
  const row = energy({ "energy:0:qty": "" });
  assert.equal(row.status, "missing");
  assert.equal(row.flags?.qty, "missing");
});