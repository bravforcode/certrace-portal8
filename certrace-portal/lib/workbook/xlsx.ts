/* Reads .xlsx workbooks in the browser with DecompressionStream (no dependency).
   Only what the import needs: sheet names, and each cell's text or value. Every size and count is
   checked before anything is inflated, so a crafted file cannot exhaust memory. */

import { ImportError, PARSE_LIMITS } from "./import-limits";

const NOT_XLSX = "This file is not a valid .xlsx workbook.";
const UNSUPPORTED = "This workbook uses a compression the portal cannot read.";
const ZIP64 = "This workbook uses ZIP64, which the portal cannot read. Save it as .csv instead.";
const TOO_MANY = "This workbook has too many parts to read.";
const TOO_BIG = "This workbook expands past 50 MB when read.";
const PART_BIG = "This sheet is too large to read.";

/** The parts the import reads. Everything else in the package (styles, drawings, themes) is skipped. */
const PARTS = new Set(["xl/workbook.xml", "xl/_rels/workbook.xml.rels", "xl/sharedStrings.xml"]);
const SHEET_PART = /^xl\/worksheets\/[^/]+\.xml$/;

export type ZipOptions = {
  /** total bytes that may be inflated across all parts */
  maxBytes?: number;
  /** largest single part, by its declared size */
  maxPart?: number;
  /** which entries to read; the rest are not inflated */
  want?: (name: string) => boolean;
};

const u16 = (b: Uint8Array, o: number) => b[o]! | (b[o + 1]! << 8);
const u32 = (b: Uint8Array, o: number) => (u16(b, o) | (u16(b, o + 2) << 16)) >>> 0;

/* Inflates one entry, failing as soon as its output would pass `limit` bytes. */
async function inflate(data: Uint8Array, limit: number) {
  const reader = new Blob([data as Uint8Array<ArrayBuffer>])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"))
    .getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      throw new ImportError(TOO_BIG);
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.byteLength;
  }
  return out;
}

export async function readZip(buf: ArrayBuffer, opts: ZipOptions = {}): Promise<Map<string, Uint8Array>> {
  const maxBytes = opts.maxBytes ?? PARSE_LIMITS.zipBytes;
  const maxPart = opts.maxPart ?? PARSE_LIMITS.partBytes;
  const want = opts.want ?? (() => true);
  const b = new Uint8Array(buf);
  let end = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--)
    if (u32(b, i) === 0x06054b50) {
      end = i;
      break;
    }
  if (end < 0) throw new ImportError(NOT_XLSX);
  const count = u16(b, end + 10);
  const cdAt = u32(b, end + 16);
  const zip64 =
    count === 0xffff ||
    cdAt === 0xffffffff ||
    (end >= 20 && u32(b, end - 20) === 0x07064b50) ||
    (end >= 56 && u32(b, end - 56) === 0x06064b50);
  if (zip64) throw new ImportError(ZIP64);
  if (count > PARSE_LIMITS.zipEntries) throw new ImportError(TOO_MANY);

  const out = new Map<string, Uint8Array>();
  let used = 0;
  let p = cdAt;
  for (let n = 0; n < count; n++) {
    if (p + 46 > b.length || u32(b, p) !== 0x02014b50) throw new ImportError(NOT_XLSX);
    const method = u16(b, p + 10),
      size = u32(b, p + 20),
      declared = u32(b, p + 24);
    const nameLen = u16(b, p + 28),
      extra = u16(b, p + 30),
      comment = u16(b, p + 32),
      local = u32(b, p + 42);
    const next = p + 46 + nameLen + extra + comment;
    if (next > b.length) throw new ImportError(NOT_XLSX);
    const name = new TextDecoder().decode(b.subarray(p + 46, p + 46 + nameLen));
    p = next;
    if (!want(name)) continue;
    if (declared > maxPart) throw new ImportError(PART_BIG);
    if (declared > maxBytes - used) throw new ImportError(TOO_BIG);
    if (local + 30 > b.length || u32(b, local) !== 0x04034b50) throw new ImportError(NOT_XLSX);
    const start = local + 30 + u16(b, local + 26) + u16(b, local + 28);
    if (start + size > b.length) throw new ImportError(NOT_XLSX);
    const data = b.subarray(start, start + size);
    let bytes: Uint8Array;
    if (method === 0) bytes = data;
    else if (method === 8) bytes = await inflate(data, maxBytes - used);
    else throw new ImportError(UNSUPPORTED);
    used += bytes.byteLength;
    out.set(name, bytes);
  }
  return out;
}

const ENTITY: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
/* A numeric reference outside Unicode is left as written rather than thrown on. */
const decodeEntities = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e: string) => {
    if (e[0] !== "#") return ENTITY[e] ?? m;
    const hex = e[1] === "x" || e[1] === "X";
    const cp = parseInt(e.slice(hex ? 2 : 1), hex ? 16 : 10);
    return cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : m;
  });

/* Every <tag ...>...</tag> or <tag .../> in xml. A forward scan, so the cost grows with the input, not its square. */
function elements(xml: string, tag: string) {
  const open = `<${tag}`;
  const close = `</${tag}>`;
  const out: { attrs: string; body: string }[] = [];
  let pos = 0;
  for (;;) {
    const s = xml.indexOf(open, pos);
    if (s < 0) break;
    const after = xml.charAt(s + open.length);
    if (after !== " " && after !== ">" && after !== "/") {
      pos = s + open.length;
      continue;
    }
    const gt = xml.indexOf(">", s);
    if (gt < 0) break;
    const attrs = xml.slice(s + open.length, gt);
    if (attrs.endsWith("/")) {
      out.push({ attrs: attrs.slice(0, -1), body: "" });
      pos = gt + 1;
      continue;
    }
    const e = xml.indexOf(close, gt + 1);
    if (e < 0) break;
    out.push({ attrs, body: xml.slice(gt + 1, e) });
    pos = e + close.length;
  }
  return out;
}

/* An attribute's value, whatever order the attributes come in. */
function attr(attrs: string, name: string) {
  const key = `${name}="`;
  for (let i = attrs.indexOf(key); i >= 0; i = attrs.indexOf(key, i + 1)) {
    if (i === 0 || /\s/.test(attrs[i - 1]!)) {
      const end = attrs.indexOf('"', i + key.length);
      return end < 0 ? undefined : attrs.slice(i + key.length, end);
    }
  }
  return undefined;
}

const RPH = /<rPh\b[\s\S]*?<\/rPh>/g; // phonetic guide text is not part of the cell's value
const texts = (xml: string) =>
  elements(xml.replace(RPH, ""), "t")
    .map((t) => decodeEntities(t.body))
    .join("");
const colIndex = (ref: string) =>
  [...ref.replace(/\d+$/, "")].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;

export async function readXlsx(buf: ArrayBuffer) {
  const files = await readZip(buf, { want: (n) => PARTS.has(n) || SHEET_PART.test(n) });
  const text = (path: string) => {
    const f = files.get(path);
    return f ? new TextDecoder().decode(f) : "";
  };
  const shared = elements(text("xl/sharedStrings.xml"), "si").map((si) => texts(si.body));
  const rels = new Map(
    elements(text("xl/_rels/workbook.xml.rels"), "Relationship").map((r) => [attr(r.attrs, "Id") ?? "", attr(r.attrs, "Target") ?? ""]),
  );
  return elements(text("xl/workbook.xml"), "sheet").map((s) => {
    const target = rels.get(attr(s.attrs, "r:id") ?? "") ?? "";
    const xml = text(target.startsWith("/") ? target.slice(1) : `xl/${target}`);
    const rows: string[][] = [];
    for (const row of elements(xml, "row")) {
      const at = Number(attr(row.attrs, "r") ?? rows.length + 1) - 1;
      if (!Number.isInteger(at) || at < 0 || at >= PARSE_LIMITS.rows) continue;
      const line: string[] = [];
      for (const c of elements(row.body, "c")) {
        const ref = attr(c.attrs, "r");
        const col = ref ? colIndex(ref) : -1;
        if (col < 0 || col >= PARSE_LIMITS.cols) continue;
        const type = attr(c.attrs, "t");
        const v = decodeEntities(/<v>([\s\S]*?)<\/v>/.exec(c.body)?.[1] ?? "");
        line[col] = type === "s" ? (shared[Number(v)] ?? "") : type === "inlineStr" ? texts(c.body) : v;
      }
      rows[at] = Array.from(line, (x) => x ?? "");
    }
    let width = 0;
    for (const r of rows) if (r && r.length > width) width = r.length;
    return {
      name: decodeEntities(attr(s.attrs, "name") ?? ""),
      rows: Array.from(rows, (x) => Array.from({ length: width }, (_, i) => x?.[i] ?? "")),
    };
  });
}
