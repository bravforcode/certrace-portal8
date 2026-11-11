import test from "node:test";
import assert from "node:assert/strict";
import { readXlsx, readZip } from "../xlsx";

async function deflate(bytes: Uint8Array) {
  const stream = new Blob([bytes as Uint8Array<ArrayBuffer>]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
// Minimal zip writer: local headers + central directory + end record. CRC is left 0;
// readZip does not check it (the browser already verified the download).
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
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)] as Uint8Array<ArrayBuffer>[]).arrayBuffer();
}

const book = {
  "xl/workbook.xml": '<workbook><sheets><sheet name="Energy &amp; fuel" sheetId="1" r:id="rId1"/></sheets></workbook>',
  "xl/_rels/workbook.xml.rels": '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
  "xl/sharedStrings.xml": "<sst><si><t>Item</t></si><si><r><t>Natural </t></r><r><t>gas</t></r></si></sst>",
  "xl/worksheets/sheet1.xml":
    '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1" t="inlineStr"><is><t>Qty</t></is></c></row>' +
    '<row r="2"><c r="A2" t="s"><v>1</v></c><c r="C2"><f>B2*2</f><v>420</v></c></row></sheetData></worksheet>',
};

test("readZip reads stored and deflated entries", async () => {
  for (const compress of [false, true]) {
    const files = await readZip(await zip({ "a.txt": "hello" }, compress));
    assert.equal(new TextDecoder().decode(files.get("a.txt")), "hello");
  }
});
test("readXlsx returns named sheets with shared, inline and formula values", async () => {
  const [sheet] = await readXlsx(await zip(book, true));
  assert.equal(sheet!.name, "Energy & fuel");
  assert.deepEqual(sheet!.rows, [
    ["Item", "", "Qty"],
    ["Natural gas", "", "420"],
  ]);
});
