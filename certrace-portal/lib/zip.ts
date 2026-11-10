/* A ZIP writer, and nothing else.

   The report package is three or four PDFs in one download. A PDF is already
   compressed, so the entries are STORED (method 0) rather than deflated: the
   archive is a few bytes larger and there is no compression library to ship to
   the browser for it. Names are flagged UTF-8, so an installation reference or
   a Thai company name survives the trip.

   Not a general-purpose archiver — no directories, no ZIP64 (an entry or the
   archive over 4 GiB throws rather than writing a corrupt file), no reading. */

export type ZipEntry = { name: string; data: Uint8Array };

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++)
    c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** MS-DOS date and time, which is what a ZIP header stores (2-second resolution, 1980 on). */
function dosStamp(d: Date): { time: number; date: number } {
  const year = Math.max(1980, d.getFullYear());
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

export function buildZip(
  entries: ZipEntry[],
  when: Date = new Date(),
): Uint8Array {
  const enc = new TextEncoder();
  const { time, date } = dosStamp(when);
  const UTF8 = 0x0800;

  const prepared = entries.map((e) => ({
    name: enc.encode(e.name),
    data: e.data,
    crc: crc32(e.data),
  }));
  const localSize = prepared.reduce(
    (n, e) => n + 30 + e.name.length + e.data.length,
    0,
  );
  const centralSize = prepared.reduce((n, e) => n + 46 + e.name.length, 0);
  const total = localSize + centralSize + 22;
  if (total >= 0xffffffff || prepared.length >= 0xffff)
    throw new Error("The package is too large to zip.");

  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  let p = 0;
  const offsets: number[] = [];

  for (const e of prepared) {
    offsets.push(p);
    view.setUint32(p, 0x04034b50, true);
    view.setUint16(p + 4, 20, true); // version needed
    view.setUint16(p + 6, UTF8, true);
    view.setUint16(p + 8, 0, true); // stored
    view.setUint16(p + 10, time, true);
    view.setUint16(p + 12, date, true);
    view.setUint32(p + 14, e.crc, true);
    view.setUint32(p + 18, e.data.length, true);
    view.setUint32(p + 22, e.data.length, true);
    view.setUint16(p + 26, e.name.length, true);
    view.setUint16(p + 28, 0, true); // extra
    out.set(e.name, p + 30);
    out.set(e.data, p + 30 + e.name.length);
    p += 30 + e.name.length + e.data.length;
  }

  const centralStart = p;
  prepared.forEach((e, i) => {
    view.setUint32(p, 0x02014b50, true);
    view.setUint16(p + 4, 20, true); // version made by
    view.setUint16(p + 6, 20, true); // version needed
    view.setUint16(p + 8, UTF8, true);
    view.setUint16(p + 10, 0, true);
    view.setUint16(p + 12, time, true);
    view.setUint16(p + 14, date, true);
    view.setUint32(p + 16, e.crc, true);
    view.setUint32(p + 20, e.data.length, true);
    view.setUint32(p + 24, e.data.length, true);
    view.setUint16(p + 28, e.name.length, true);
    // extra, comment, disk, internal and external attributes: all zero
    view.setUint32(p + 42, offsets[i], true);
    out.set(e.name, p + 46);
    p += 46 + e.name.length;
  });

  view.setUint32(p, 0x06054b50, true);
  view.setUint16(p + 8, prepared.length, true);
  view.setUint16(p + 10, prepared.length, true);
  view.setUint32(p + 12, p - centralStart, true);
  view.setUint32(p + 16, centralStart, true);
  return out;
}
