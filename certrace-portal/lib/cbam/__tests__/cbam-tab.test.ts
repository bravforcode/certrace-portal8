/* ════════════════════════════════════════════════════════════
   THE CBAM TAB'S SUMMARY — what the workbook's CBAM tab counts

     1. only required fields make up the total; an empty optional field is
        "optional", never "missing", because the template does not require it
        and it must not block the report
     2. a whitespace-only answer is an empty answer
     3. sections and items keep the catalogue's order, not the answers' order

   The fields are a small fake list so these rules do not move when the real
   CBAM catalogue (lib/cbam/template-fields.ts) grows.
   ════════════════════════════════════════════════════════════ */

import { test } from "node:test";
import assert from "node:assert/strict";
import { cbamCellKey, type CbamField } from "../template-fields";
import { summariseCbam } from "../cbam-tab";

const FIELDS: CbamField[] = [
  { id: "a-i20", sheet: "A_InstData", cell: "I20", label: "Name", section: "Installation", item: "installation", kind: "text" },
  { id: "b-b5", sheet: "B_EmInst", cell: "B5", label: "Address", section: "Installation", item: "installation", kind: "text" },
  {
    id: "a-i30",
    sheet: "A_InstData",
    cell: "I30",
    label: "P.O. Box",
    section: "Installation",
    item: "installation",
    kind: "text",
    optional: true,
  },
  { id: "d-l65", sheet: "D_Processes", cell: "L65", label: "Output", section: "Production process 1", item: "goods", unit: "t", kind: "number" },
];

const cellsWith = (values: Record<string, string>) =>
  Object.fromEntries(Object.entries(values).map(([id, v]) => [cbamCellKey({ id }), v]));

test("counts required fields only: filled and missing", () => {
  const s = summariseCbam(cellsWith({ "a-i20": "Acme", "d-l65": "12" }), FIELDS);
  assert.equal(s.total, 3);
  assert.equal(s.filled, 2);
  assert.equal(s.missing, 1);
});

test("an empty optional field is optional, not missing, and outside the total", () => {
  const s = summariseCbam(cellsWith({}), FIELDS);
  assert.equal(s.total, 3);
  assert.equal(s.missing, 3);
  const row = s.sections[0].rows.find((r) => r.field.id === "a-i30");
  assert.equal(row?.state, "optional");
});

test("a whitespace-only answer counts as missing", () => {
  const s = summariseCbam(cellsWith({ "a-i20": "   ", "b-b5": "\t" }), FIELDS);
  assert.equal(s.filled, 0);
  assert.equal(s.missing, 3);
  assert.equal(s.sections[0].rows[0].state, "missing");
});

test("a filled optional field shows as filled and does not change the counts", () => {
  const s = summariseCbam(cellsWith({ "a-i30": "PO 1" }), FIELDS);
  assert.equal(s.total, 3);
  assert.equal(s.filled, 0);
  assert.equal(s.sections[0].rows.find((r) => r.field.id === "a-i30")?.state, "filled");
});

test("sections and items follow the catalogue order", () => {
  const s = summariseCbam(cellsWith({}), FIELDS);
  assert.deepEqual(
    s.sections.map((sec) => sec.section),
    ["Installation", "Production process 1"],
  );
  assert.deepEqual(
    s.sections[0].rows.map((r) => r.field.id),
    ["a-i20", "b-b5", "a-i30"],
  );
  assert.deepEqual(s.byItem, [
    { item: "installation", filled: 0, total: 2 },
    { item: "goods", filled: 0, total: 1 },
  ]);
});

test("the row value is the trimmed answer; a missing row has an empty value", () => {
  const s = summariseCbam(cellsWith({ "a-i20": "  Acme  " }), FIELDS);
  assert.equal(s.sections[0].rows[0].value, "Acme");
  assert.equal(s.sections[0].rows[1].value, "");
});

test("no fields gives an empty summary", () => {
  const s = summariseCbam({}, []);
  assert.deepEqual(
    { total: s.total, filled: s.filled, missing: s.missing, byItem: s.byItem, sections: s.sections },
    { total: 0, filled: 0, missing: 0, byItem: [], sections: [] },
  );
});
