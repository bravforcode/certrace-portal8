import { cellKey, rowsUsed } from "./cells";
import type { CellPatch } from "./flow-edit";
import { ImportError, PARSE_LIMITS } from "./import-limits";

export const IMPORT_LIMITS = {
  bytes: 5_000_000,
  rows: 5000,
  keysPerPatch: 2000,
};

/** The message for a file that cannot be imported at all, or null when it can. */
export function fileProblem(name: string, size: number): string | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".xls")) return "Save the file as .xlsx or .csv first.";
  if (size > IMPORT_LIMITS.bytes) return "The file is larger than 5 MB.";
  if (!lower.endsWith(".csv") && !lower.endsWith(".xlsx"))
    return "Choose a .csv or .xlsx file.";
  return null;
}

/** CSV text from the file's bytes: UTF-8 when the bytes are valid UTF-8, otherwise Thai Windows code page 874. */
export function decodeCsv(bytes: ArrayBuffer): string {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    text = new TextDecoder("windows-874").decode(bytes);
  }
  return text.replace(/^﻿/, "");
}

export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const first = src.split(/\r?\n/, 1)[0] ?? "";
  const count = (d: string) =>
    first.replace(/"[^"]*"/g, "").split(d).length - 1;
  const delim = [",", ";", "\t"].reduce(
    (a, d) => (count(d) > count(a) ? d : a),
    ",",
  );
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  const endCell = () => {
    if (row.length < PARSE_LIMITS.cols) row.push(cell);
    cell = "";
  };
  const endRow = () => {
    endCell();
    if (rows.length < PARSE_LIMITS.rows) rows.push(row);
    row = [];
  };
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === "")
      quoted = true; // a quote opens a field only at its start; elsewhere it is literal
    else if (ch === delim) endCell();
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      endRow();
    } else cell += ch;
  }
  // An unclosed quote would have swallowed every later line into one cell.
  if (quoted)
    throw new ImportError(
      "The CSV has a quoted field that is never closed. Check the quotes and try again.",
    );
  if (cell !== "" || row.length) endRow();
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
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\p{M}]/gu, "");

export function suggestMapping(
  header: string[],
  cols: { key: string; label: string }[],
) {
  const used = new Set<string>();
  return header.map((h) => {
    const n = norm(h);
    const hit = cols.find(
      (c) =>
        !used.has(c.key) &&
        n &&
        [c.key, c.label, ...(SYNONYMS[c.key] ?? [])].some((x) => norm(x) === n),
    );
    if (!hit) return null;
    used.add(hit.key);
    return hit.key;
  });
}

/** True when one sheet column is picked for two file columns. */
export function hasDuplicateMapping(mapping: (string | null)[]) {
  return mapping.some((k, i) => k !== null && mapping.indexOf(k) !== i);
}

const cleanQty = (v: string) =>
  /^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(v) ? v.replace(/,/g, "") : v;

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
  for (const source of rows.slice(
    headerRow + 1,
    headerRow + 1 + IMPORT_LIMITS.rows,
  )) {
    const values: CellPatch = {};
    mapping.forEach((key, i) => {
      const v = (source[i] ?? "").trim();
      if (key && v)
        values[cellKey(sheetId, next, key)] = key === "qty" ? cleanQty(v) : v;
    });
    if (!Object.keys(values).length) {
      skipped++;
      continue;
    }
    values[cellKey(sheetId, next, "status")] = "review";
    if (
      Object.keys(current).length + Object.keys(values).length >
      IMPORT_LIMITS.keysPerPatch
    ) {
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

/** Rows one patch holds: one status cell per imported row. */
const rowsIn = (patch: CellPatch) =>
  Object.keys(patch).filter((k) => k.endsWith(":status")).length;

/**
 * Sends the patches in order from index `from`. Stops at the first patch that is not saved and says where to
 * resume, so a retry never sends a patch twice.
 */
export async function saveInOrder(
  patches: CellPatch[],
  save: (patch: CellPatch) => Promise<string>,
  from = 0,
  onSaved?: (rows: number) => void,
) {
  let rows = 0;
  let i = from;
  for (; i < patches.length; i++) {
    const patch = patches[i]!;
    if ((await save(patch)) !== "saved") return { next: i, rows, failed: true };
    rows += rowsIn(patch);
    onSaved?.(rows);
  }
  return { next: i, rows, failed: false };
}
