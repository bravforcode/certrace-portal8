/* ════════════════════════════════════════════════════════════
   THE WRITER'S WORKBOOK READS BACK THE SAME

   A file the portal writes is only useful if the portal's own reader, and
   so a verifier's Excel, sees the same sheets and cells. Text is XML-escaped,
   a value that starts like a formula is text, and sheet names meet Excel's
   rules before they reach the file.
   ════════════════════════════════════════════════════════════ */

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildXlsx, safeSheetName } from "../xlsx-write";
import { readXlsx, readZip } from "../workbook/xlsx";

const toBuffer = (bytes: Uint8Array) =>
  bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;

/* Reads one stored part of the package, so a test can look at the XML itself. */
async function partOf(bytes: Uint8Array, name: string): Promise<string> {
  const files = await readZip(toBuffer(bytes), { want: (n) => n === name });
  const found = files.get(name);
  assert.ok(found, `missing ${name}`);
  return new TextDecoder().decode(found);
}

test("sheet names and cells round-trip through the portal's xlsx reader", async () => {
  const bytes = buildXlsx([
    {
      name: "Summary",
      rows: [
        ["Installation", "Plant A"],
        ["Year", 2026],
      ],
    },
    {
      name: "Goods",
      rows: [
        ["CN code", "Product", "Tonnes"],
        ["7208", "Hot-rolled coil", 1500.5],
      ],
    },
  ]);
  const sheets = await readXlsx(toBuffer(bytes));
  assert.deepEqual(
    sheets.map((s) => s.name),
    ["Summary", "Goods"],
  );
  assert.deepEqual(sheets[0]!.rows, [
    ["Installation", "Plant A"],
    ["Year", "2026"],
  ]);
  assert.deepEqual(sheets[1]!.rows, [
    ["CN code", "Product", "Tonnes"],
    ["7208", "Hot-rolled coil", "1500.5"],
  ]);
});

test("every XML-special character is escaped and read back unchanged", async () => {
  const tricky = `A <b> & "quoted" 'single' ค่า`;
  const bytes = buildXlsx([{ name: "Escape", rows: [[tricky, "x&amp;y"]] }]);
  const xml = await partOf(bytes, "xl/worksheets/sheet1.xml");
  assert.equal(xml.includes("<b>"), false, "a raw tag must not reach the XML");
  const [sheet] = await readXlsx(toBuffer(bytes));
  assert.equal(sheet!.rows[0]![0], tricky);
  assert.equal(sheet!.rows[0]![1], "x&amp;y");
});

test("a value that looks like a formula is written as text, never as a formula", async () => {
  const bytes = buildXlsx([
    { name: "Inject", rows: [["=1+1", "+SUM(A1)", "-2", "@cmd"]] },
  ]);
  const xml = await partOf(bytes, "xl/worksheets/sheet1.xml");
  assert.equal(xml.includes("<f"), false, "no formula element may be written");
  const [sheet] = await readXlsx(toBuffer(bytes));
  assert.deepEqual(sheet!.rows[0], ["=1+1", "+SUM(A1)", "-2", "@cmd"]);
});

test("a sheet name is cut to 31 characters without forbidden characters", () => {
  assert.equal(safeSheetName("Net: [draft]/1?*\\ name"), "Net draft 1 name");
  assert.equal(safeSheetName("x".repeat(40)).length, 31);
  assert.equal(safeSheetName("   "), "Sheet");
});

test("a writer with no sheets is refused", () => {
  assert.throws(() => buildXlsx([]));
});
