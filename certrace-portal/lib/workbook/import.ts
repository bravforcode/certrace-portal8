import { cellKey, rowsUsed } from "./cells";
import type { CellPatch } from "./flow-edit";

export const IMPORT_LIMITS = { bytes: 5_000_000, rows: 5000, keysPerPatch: 2000 };

export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const first = src.split(/\r?\n/, 1)[0] ?? "";
  const count = (d: string) => first.replace(/"[^"]*"/g, "").split(d).length - 1;
  const delim = [",", ";", "\t"].reduce((a, d) => (count(d) > count(a) ? d : a), ",");
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

const isNumber = (s: string) => /^-?[\d,]*\.?\d+$/.test(s.trim());
export function detectHeaderRow(rows: string[][]) {
  for (let i = 0; i < Math.min(20, rows.length); i++) {
    const cells = rows[i]!.filter((c) => c.trim());
    const numeric = cells.filter(isNumber).length;
    if (cells.length >= 2 && cells.length - numeric > numeric) return i;
  }
  return 0;
}

const SYNONYMS: Record<string, string[]> = {
  qty: ["quantity", "amount", "volume", "ปริมาณ", "จำนวน"],
  unit: ["uom", "units", "หน่วย"],
  item: ["material", "name", "description", "product", "รายการ", "วัตถุดิบ"],
  step: ["process", "stage", "ขั้นตอน", "กระบวนการ"],
  cn: ["cn code", "hs", "hs code", "พิกัด"],
  source: ["file", "document", "เอกสาร"],
};
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

export function suggestMapping(header: string[], cols: { key: string; label: string }[]) {
  const used = new Set<string>();
  return header.map((h) => {
    const n = norm(h);
    const hit = cols.find(
      (c) => !used.has(c.key) && n && [c.key, c.label, ...(SYNONYMS[c.key] ?? [])].some((x) => norm(x) === n),
    );
    if (!hit) return null;
    used.add(hit.key);
    return hit.key;
  });
}

const cleanQty = (v: string) => (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(v) ? v.replace(/,/g, "") : v);

export function buildImport(
  rows: string[][],
  headerRow: number,
  mapping: (string | null)[],
  sheetId: string,
  cells: Record<string, string>,
) {
  const patches: CellPatch[] = [];
  let current: CellPatch = {};
  let next = rowsUsed(cells, sheetId),
    added = 0,
    skipped = 0;
  for (const source of rows.slice(headerRow + 1, headerRow + 1 + IMPORT_LIMITS.rows)) {
    const values: CellPatch = {};
    mapping.forEach((key, i) => {
      const v = (source[i] ?? "").trim();
      if (key && v) values[cellKey(sheetId, next, key)] = key === "qty" ? cleanQty(v) : v;
    });
    if (!Object.keys(values).length) {
      skipped++;
      continue;
    }
    values[cellKey(sheetId, next, "status")] = "review";
    if (Object.keys(current).length + Object.keys(values).length > IMPORT_LIMITS.keysPerPatch) {
      patches.push(current);
      current = {};
    }
    Object.assign(current, values);
    next++;
    added++;
  }
  if (Object.keys(current).length) patches.push(current);
  return { patches, added, skipped };
}
