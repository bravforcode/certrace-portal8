/* Reads .xlsx workbooks in the browser with DecompressionStream (no dependency).
   Only what the import needs: sheet names, and each cell's text or value. */

const u16 = (b: Uint8Array, o: number) => b[o]! | (b[o + 1]! << 8);
const u32 = (b: Uint8Array, o: number) => (u16(b, o) | (u16(b, o + 2) << 16)) >>> 0;

async function inflate(data: Uint8Array) {
  const stream = new Blob([data as Uint8Array<ArrayBuffer>]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function readZip(buf: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const b = new Uint8Array(buf);
  let end = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--)
    if (u32(b, i) === 0x06054b50) {
      end = i;
      break;
    }
  if (end < 0) throw new Error("This file is not a valid .xlsx workbook.");
  const count = u16(b, end + 10);
  let p = u32(b, end + 16);
  const out = new Map<string, Uint8Array>();
  for (let n = 0; n < count; n++) {
    if (u32(b, p) !== 0x02014b50) throw new Error("This file is not a valid .xlsx workbook.");
    const method = u16(b, p + 10),
      size = u32(b, p + 20);
    const nameLen = u16(b, p + 28),
      extra = u16(b, p + 30),
      comment = u16(b, p + 32);
    const local = u32(b, p + 42);
    const name = new TextDecoder().decode(b.subarray(p + 46, p + 46 + nameLen));
    const start = local + 30 + u16(b, local + 26) + u16(b, local + 28);
    const data = b.subarray(start, start + size);
    if (method === 0) out.set(name, data);
    else if (method === 8) out.set(name, await inflate(data));
    else throw new Error("This workbook uses a compression the portal cannot read.");
    p += 46 + nameLen + extra + comment;
  }
  return out;
}

const ENTITY: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const decode = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e: string) =>
    e[0] === "#" ? String.fromCodePoint(parseInt(e.slice(e[1] === "x" ? 2 : 1), e[1] === "x" ? 16 : 10)) : (ENTITY[e] ?? m),
  );
const texts = (xml: string) =>
  [...xml.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => decode(m[1]!)).join("");
const colIndex = (ref: string) =>
  [...ref.replace(/\d+$/, "")].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;

export async function readXlsx(buf: ArrayBuffer) {
  const files = await readZip(buf);
  const text = (path: string) => (files.has(path) ? new TextDecoder().decode(files.get(path)) : "");
  const shared = [...text("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => texts(m[1]!));
  const rels = new Map(
    [...text("xl/_rels/workbook.xml.rels").matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)].map((m) => [
      m[1]!,
      m[2]!,
    ]),
  );
  return [...text("xl/workbook.xml").matchAll(/<sheet [^>]*name="([^"]*)"[^>]*r:id="([^"]+)"/g)].map((m) => {
    const target = rels.get(m[2]!) ?? "";
    const xml = text(target.startsWith("/") ? target.slice(1) : `xl/${target}`);
    const rows: string[][] = [];
    for (const r of xml.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
      const line: string[] = [];
      for (const c of r[2]!.matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const ref = /r="([A-Z]+\d+)"/.exec(c[1]!)?.[1];
        if (!ref) continue;
        const type = /t="(\w+)"/.exec(c[1]!)?.[1];
        const body = c[2] ?? "";
        const v = decode(/<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? "");
        line[colIndex(ref)] = type === "s" ? (shared[Number(v)] ?? "") : type === "inlineStr" ? texts(body) : v;
      }
      rows[Number(r[1]) - 1] = Array.from(line, (x) => x ?? "");
    }
    const width = Math.max(0, ...rows.map((x) => x?.length ?? 0));
    return {
      name: decode(m[1]!),
      rows: Array.from(rows, (x) => Array.from({ length: width }, (_, i) => x?.[i] ?? "")),
    };
  });
}
