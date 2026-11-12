import test from "node:test";
import assert from "node:assert/strict";
import {
  buildImport,
  decodeCsv,
  detectHeaderRow,
  fileProblem,
  hasDuplicateMapping,
  parseCsv,
  saveInOrder,
  suggestMapping,
} from "../import";
import { readXlsx, readZip, type ZipOptions } from "../xlsx";

async function deflate(bytes: Uint8Array) {
  const stream = new Blob([bytes as Uint8Array<ArrayBuffer>])
    .stream()
    .pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
// Minimal zip writer (same shape as xlsx.test.ts). CRC is left 0; readZip does not check it.
async function zip(files: Record<string, string>, compress = false) {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const raw = enc.encode(text);
    const data = compress ? await deflate(raw) : raw;
    const n = enc.encode(name);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(8, compress ? 8 : 0, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, raw.length, true);
    local.setUint16(26, n.length, true);
    parts.push(new Uint8Array(local.buffer), n, data);
    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(10, compress ? 8 : 0, true);
    cd.setUint32(20, data.length, true);
    cd.setUint32(24, raw.length, true);
    cd.setUint16(28, n.length, true);
    cd.setUint32(42, offset, true);
    central.push(new Uint8Array(cd.buffer), n);
    offset += 30 + n.length + data.length;
  }
  const cdSize = central.reduce((a, b) => a + b.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, Object.keys(files).length, true);
  end.setUint16(10, Object.keys(files).length, true);
  end.setUint32(12, cdSize, true);
  end.setUint32(16, offset, true);
  return new Blob([
    ...parts,
    ...central,
    new Uint8Array(end.buffer),
  ] as Uint8Array<ArrayBuffer>[]).arrayBuffer();
}
/* Copies a zip and edits its end-of-central-directory record (no comment, so it is 22 bytes from the end). */
function patchEnd(
  buf: ArrayBuffer,
  edit: (v: DataView, end: number) => void,
): ArrayBuffer {
  const copy = buf.slice(0);
  edit(new DataView(copy), copy.byteLength - 22);
  return copy;
}
const centralOffset = (buf: ArrayBuffer) =>
  new DataView(buf).getUint32(buf.byteLength - 22 + 16, true);

const SHEET =
  '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c></row></sheetData></worksheet>';
const WORKBOOK =
  '<workbook><sheets><sheet name="Sheet" sheetId="1" r:id="rId1"/></sheets></workbook>';
const RELS =
  '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>';
const withShared = (si: string, sheet = SHEET) => ({
  "xl/workbook.xml": WORKBOOK,
  "xl/_rels/workbook.xml.rels": RELS,
  "xl/sharedStrings.xml": `<sst>${si}</sst>`,
  "xl/worksheets/sheet1.xml": sheet,
});

// ── CSV ─────────────────────────────────────────────────────────
test("parseCsv treats a quote as literal in the middle of a field", () => {
  assert.deepEqual(parseCsv('a"b,c\n'), [['a"b', "c"]]);
});
test("parseCsv still reads a quoted field that holds the delimiter", () => {
  assert.deepEqual(parseCsv('"x,y",z\n'), [["x,y", "z"]]);
});
test("parseCsv picks the tab delimiter", () => {
  assert.deepEqual(parseCsv("a\tb\n1\t2"), [
    ["a", "b"],
    ["1", "2"],
  ]);
});
test("parseCsv reads CRLF-only line endings", () => {
  assert.deepEqual(parseCsv("a,b\r\nc,d\r\n"), [
    ["a", "b"],
    ["c", "d"],
  ]);
});
test("parseCsv caps rows at 20000 and columns at 256", () => {
  assert.equal(parseCsv("a\n".repeat(20_005)).length, 20_000);
  assert.equal(parseCsv("a,".repeat(300) + "\n")[0]!.length, 256);
});
test("decodeCsv turns a BOM-only file into no rows", () => {
  const bytes = Uint8Array.from([0xef, 0xbb, 0xbf]).buffer;
  assert.equal(decodeCsv(bytes), "");
  assert.deepEqual(parseCsv(decodeCsv(bytes)), []);
});
test("decodeCsv reads UTF-8 and falls back to windows-874 for Thai bytes", () => {
  assert.equal(decodeCsv(new TextEncoder().encode("ก,ข").buffer), "ก,ข");
  assert.equal(decodeCsv(Uint8Array.from([0xa1, 0x2c, 0xa2]).buffer), "ก,ข");
});
test("detectHeaderRow falls back to the first row when none looks like a header", () => {
  assert.equal(
    detectHeaderRow([
      ["1", "2"],
      ["3", "4"],
    ]),
    0,
  );
  assert.equal(detectHeaderRow([]), 0);
});
test("buildImport stops at the 5000-row cap", () => {
  const rows = [["Item"], ...Array.from({ length: 5001 }, (_, i) => [`m${i}`])];
  assert.equal(buildImport(rows, 0, ["item"], "materials", {}).added, 5000);
});
test("fileProblem gives the .xls, 5 MB and type messages", () => {
  assert.equal(
    fileProblem("old.xls", 10),
    "Save the file as .xlsx or .csv first.",
  );
  assert.equal(
    fileProblem("big.csv", 5_000_001),
    "The file is larger than 5 MB.",
  );
  assert.equal(fileProblem("notes.txt", 10), "Choose a .csv or .xlsx file.");
  assert.equal(fileProblem("ok.csv", 5_000_000), null);
});
test("hasDuplicateMapping flags a sheet column used twice", () => {
  assert.equal(hasDuplicateMapping(["qty", null, "qty"]), true);
  assert.equal(hasDuplicateMapping(["qty", null, "unit"]), false);
});
test("suggestMapping keeps combining marks in header names", () => {
  assert.deepEqual(suggestMapping(["ก่อน"], [{ key: "a", label: "กอน" }]), [
    null,
  ]);
});
test("saveInOrder resumes after a failed patch without resending saved rows", async () => {
  const rows = [["Item"], ...Array.from({ length: 1500 }, (_, i) => [`r${i}`])];
  const { patches } = buildImport(rows, 0, ["item"], "materials", {});
  assert.equal(patches.length, 2);
  const saved = new Map<string, number>();
  let calls = 0;
  const flaky = async (p: object) => {
    calls++;
    if (calls === 2) return "failed";
    for (const k of Object.keys(p)) saved.set(k, (saved.get(k) ?? 0) + 1);
    return "saved";
  };
  const first = await saveInOrder(patches, flaky);
  assert.deepEqual(first, { next: 1, rows: 1000, failed: true });
  const retry = async (p: object) => {
    for (const k of Object.keys(p)) saved.set(k, (saved.get(k) ?? 0) + 1);
    return "saved";
  };
  const second = await saveInOrder(patches, retry, first.next);
  assert.deepEqual(second, { next: 2, rows: 500, failed: false });
  assert.equal(saved.size, 3000);
  assert.ok([...saved.values()].every((n) => n === 1));
});

// ── ZIP and XML ─────────────────────────────────────────────────
test("readZip refuses ZIP64 markers and more than 500 parts", async () => {
  const base = await zip({ "a.txt": "hi" });
  await assert.rejects(
    readZip(patchEnd(base, (v, e) => v.setUint16(e + 10, 0xffff, true))),
    /ZIP64/,
  );
  await assert.rejects(
    readZip(patchEnd(base, (v, e) => v.setUint32(e + 16, 0xffffffff, true))),
    /ZIP64/,
  );
  await assert.rejects(
    readZip(patchEnd(base, (v, e) => v.setUint16(e + 10, 501, true))),
    /too many parts/,
  );
});
test("readZip refuses a data range that runs past the buffer", async () => {
  const base = await zip({ "a.txt": "hi" }, false);
  const bad = patchEnd(base, (v) =>
    v.setUint32(centralOffset(base) + 20, 1e9, true),
  );
  await assert.rejects(readZip(bad), /not a valid/);
});
test("readZip refuses a declared size over the cap before inflating", async () => {
  const buf = await zip({ "xl/workbook.xml": "x".repeat(2000) }, true);
  await assert.rejects(
    readZip(buf, { maxBytes: 1000 } satisfies ZipOptions),
    /expands past/,
  );
});
test("readZip stops when the real inflated size passes the cap", async () => {
  const base = await zip({ "xl/workbook.xml": "x".repeat(2000) }, true);
  const lied = patchEnd(base, (v) =>
    v.setUint32(centralOffset(base) + 24, 10, true),
  );
  await assert.rejects(readZip(lied, { maxBytes: 1000 }), /expands past/);
});
test("readZip refuses a part over the size bound", async () => {
  const buf = await zip({ "xl/worksheets/sheet1.xml": "x".repeat(2000) });
  await assert.rejects(readZip(buf, { maxPart: 1000 }), /too large/);
});
test("readXlsx decodes entities and leaves out-of-range code points as written", async () => {
  const buf = await zip(
    withShared("<si><t>&#65;&#x42;&#1114112;&amp;</t></si>"),
    true,
  );
  const [s] = await readXlsx(buf);
  assert.deepEqual(s!.rows, [["AB&#1114112;&"]]);
});
test("readXlsx drops phonetic runs (rPh) from shared strings", async () => {
  const buf = await zip(
    withShared('<si><t>Item</t><rPh sb="0" eb="1"><t>ไอเทม</t></rPh></si>'),
    true,
  );
  const [s] = await readXlsx(buf);
  assert.deepEqual(s!.rows, [["Item"]]);
});
test("readXlsx reads cell and sheet attributes in any order", async () => {
  const sheet =
    '<worksheet><sheetData><row r="1"><c t="inlineStr" r="A1"><is><t>Qty</t></is></c></row></sheetData></worksheet>';
  const wb =
    '<workbook><sheets><sheet r:id="rId1" sheetId="1" name="Plain"/></sheets></workbook>';
  const buf = await zip(
    {
      ...withShared(""),
      "xl/workbook.xml": wb,
      "xl/worksheets/sheet1.xml": sheet,
    },
    true,
  );
  const [s] = await readXlsx(buf);
  assert.equal(s!.name, "Plain");
  assert.deepEqual(s!.rows, [["Qty"]]);
});
