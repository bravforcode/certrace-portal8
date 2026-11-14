import test from "node:test";
import assert from "node:assert/strict";
import {
  buildImport,
  detectHeaderRow,
  parseCsv,
  suggestMapping,
} from "../import";
import { ImportError } from "../import-limits";

test("parseCsv handles quotes, CRLF, BOM and semicolons", () => {
  assert.deepEqual(parseCsv('﻿a;"b;c"\r\n1;"say ""hi"""\r\n'), [
    ["a", "b;c"],
    ["1", 'say "hi"'],
  ]);
});
test("parseCsv keeps empty trailing cells", () => {
  assert.deepEqual(parseCsv("a,b,\n1,,\n"), [
    ["a", "b", ""],
    ["1", "", ""],
  ]);
});
test("detectHeaderRow skips a title row", () => {
  const rows = [
    ["Plant energy 2026"],
    ["Process", "Material", "Quantity", "Unit"],
    ["Drawing", "Wire rod", "1200", "t"],
  ];
  assert.equal(detectHeaderRow(rows), 1);
});
test("suggestMapping uses keys, labels and Thai synonyms once each", () => {
  const cols = [
    { key: "step", label: "Step" },
    { key: "item", label: "Item" },
    { key: "qty", label: "Quantity" },
    { key: "unit", label: "Unit" },
  ];
  assert.deepEqual(
    suggestMapping(
      ["ขั้นตอน", "Material", "Amount", "หน่วย", "Notes", "Name"],
      cols,
    ),
    ["step", "item", "qty", "unit", null, null],
  );
});
test("buildImport appends review rows, skips blanks and cleans quantities", () => {
  const rows = [
    ["Process", "Material", "Qty"],
    ["Drawing", "Wire rod", "1,234.5"],
    ["", "", ""],
    ["Annealing", "Gas", "abc"],
  ];
  const out = buildImport(rows, 0, ["step", "item", "qty"], "materials", {
    "materials:0:item": "Existing",
  });
  assert.equal(out.added, 2);
  assert.equal(out.skipped, 1);
  assert.deepEqual(out.patches, [
    {
      "materials:1:step": "Drawing",
      "materials:1:item": "Wire rod",
      "materials:1:qty": "1234.5",
      "materials:1:status": "review",
      "materials:2:step": "Annealing",
      "materials:2:item": "Gas",
      "materials:2:qty": "abc",
      "materials:2:status": "review",
    },
  ]);
});
test("buildImport splits patches on row boundaries", () => {
  const rows = [["Item"], ...Array.from({ length: 1500 }, (_, i) => [`m${i}`])];
  const { patches } = buildImport(rows, 0, ["item"], "materials", {});
  assert.ok(patches.length >= 2);
  for (const p of patches) assert.ok(Object.keys(p).length <= 2000);
  assert.equal(
    patches.reduce((n, p) => n + Object.keys(p).length, 0),
    3000,
  );
});

/* An unclosed quote swallows every later line into one cell, so the preview would show one huge cell
   and the import would write the rest of the file into it. Reject the file instead. */
test("parseCsv rejects a quoted field that is never closed", () => {
  assert.throws(
    () => parseCsv('item,qty\n"steel,5\nsand,3\n'),
    (e: unknown) =>
      e instanceof ImportError &&
      /quoted field that is never closed/.test(e.message),
  );
});
