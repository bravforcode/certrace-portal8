import test from "node:test";
import assert from "node:assert/strict";
import { FILL_ITEMS, fillFieldCell, getFillItem } from "../fill-items";
import { CBAM_SHEET_ID, cbamFieldId, cbamFieldsFor } from "../../cbam/template-fields";
import { buildSheets } from "../../workspace-sheets";
import { STANDARDS } from "../../convert-standards";

test("an unknown requirement id returns null, including Object prototype names", () => {
  assert.equal(fillFieldCell("no-such-item", "qty"), null);
  assert.equal(fillFieldCell("constructor", "qty"), null);
  assert.equal(getFillItem("toString"), null);
});

// A CBAM answer must land on the CBAM tab, in the column named after its template cell.
test("a known field resolves to the CBAM tab and its template column; an unknown field returns null", () => {
  const id = cbamFieldId("A_InstData", "E62");
  assert.deepEqual(fillFieldCell("goods", id), { sheet: CBAM_SHEET_ID, cell: id });
  assert.equal(fillFieldCell("goods", "no-such-field"), null);
});

// Two fields with one key would overwrite each other in the form state.
test("field keys are unique within each item", () => {
  for (const [id, item] of Object.entries(FILL_ITEMS)) {
    const keys = item.fields.map((f) => f.key);
    assert.equal(new Set(keys).size, keys.length, id);
  }
});

// The old product fields (CN code, quantity) must be gone: every answer goes to the template.
test("every item's fields are the CBAM template fields, with no other sheet", () => {
  for (const [id, item] of Object.entries(FILL_ITEMS)) {
    assert.equal(item.sheet, CBAM_SHEET_ID, id);
    const expected = cbamFieldsFor(id).map((f) => f.id);
    assert.deepEqual(item.fields.map((f) => f.key), expected, id);
  }
});

// A field pointing at a column that does not exist would save a cell no sheet shows.
// The CBAM tab is not in buildSheets, so its columns are checked against the template list above.
test("every non-CBAM field's column exists on its sheet", () => {
  const sheets = buildSheets([]);
  for (const item of Object.values(FILL_ITEMS)) {
    if (item.sheet === CBAM_SHEET_ID) continue;
    const sheet = sheets.find((s) => s.id === item.sheet);
    assert.ok(sheet, item.sheet);
    for (const f of item.fields) assert.ok(sheet.cols.some((c) => c.key === f.cell), `${item.sheet}:${f.cell}`);
  }
});

// The fill route must resolve every requirement the Convert page lists.
test("every catalogue requirement has a fill entry", () => {
  for (const s of STANDARDS) for (const r of s.requirements) assert.ok(getFillItem(r.id), r.id);
});
