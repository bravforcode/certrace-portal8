/* The row check behind the status pill. A row is only "Confirmed" when a person confirmed it
   and this check finds nothing wrong, so a filled row is never confirmed just for being filled.

   Required gaps (status.ts REQUIRED) flag "missing"; values that are present but wrong flag "warn".
   Rules follow the standards the sheets map to (docs/standard-data-map.md): CBAM goods by CN code
   in tonnes and electricity in MWh (Reg. 2023/956 Annex I, 2025/2547 D_Processes), steps that exist
   in 02 (TGO Fr-03 process map), evidence that names a file in 09 (2025/2546 Art 7). */

import { cnProductByCode, cnRowFor } from "../cbam/cn-catalogue";
import type { CellFlag } from "../workspace-sheets";
import { NO_FILE } from "../workspace-sheets";
import { parseQuantity } from "./balance";
import { DEFAULT_UNITS, METHODS, SHEET_LISTS, UNITS } from "./cell-options";
import { REQUIRED } from "./status";

export type RowContext = {
  /** 02 Process steps names, trimmed and lower-cased. */
  steps: Set<string>;
  /** 09 Documents file names, lower-cased. */
  files: Set<string>;
  /** Columns of the sheet that hold numbers. */
  numberCols: Set<string>;
  /** Columns of the sheet that hold a unit, a method or a source file. */
  unitCols: Set<string>;
  methodCols: Set<string>;
  fileCols: Set<string>;
};

export type RowCheck = {
  flags: Record<string, CellFlag>;
  notes: Record<string, string>;
};

const ELECTRICITY_CN = "27160000";
const DATE = /^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/;
const lower = (v: string | undefined) => (v ?? "").trim().toLowerCase();
const filled = (v: string | undefined) => (v ?? "").trim() !== "";
const inList = (v: string, list: string[]) =>
  list.some((x) => x.toLowerCase() === lower(v));
const isCn = (v: string) => !!(cnProductByCode(v) ?? cnRowFor(v));
const digits = (v: string | undefined) => (v ?? "").replace(/\D/g, "");

export function checkRow(
  sheetId: string,
  cells: Record<string, string>,
  ctx: RowContext,
): RowCheck {
  const flags: Record<string, CellFlag> = {};
  const notes: Record<string, string> = {};
  const warn = (k: string, note: string) => {
    if (flags[k]) return;
    flags[k] = "warn";
    notes[k] = note;
  };

  for (const k of REQUIRED[sheetId] ?? [])
    if (!filled(cells[k])) {
      flags[k] = "missing";
      notes[k] = "Required";
    }

  for (const [k, raw] of Object.entries(cells)) {
    if (!filled(raw) || flags[k]) continue;
    const v = raw.trim();
    if (ctx.numberCols.has(k)) {
      const n = parseQuantity(v);
      if (n === null) warn(k, "Not a number");
      else if (n < 0) warn(k, "Must not be negative");
      else if (n === 0 && k === "qty") warn(k, "Quantity is 0");
    } else if (ctx.unitCols.has(k)) {
      const units = UNITS[sheetId] ?? DEFAULT_UNITS;
      if (!inList(v, units)) warn(k, "Unit not recognised for this sheet");
    } else if (ctx.methodCols.has(k)) {
      if (!inList(v, METHODS)) warn(k, "Choose a value from the list");
    } else if (ctx.fileCols.has(k)) {
      if (lower(v) !== lower(NO_FILE) && !ctx.files.has(lower(v)))
        warn(k, "File is not in 09 Documents");
    }
    const list = SHEET_LISTS[sheetId]?.[k];
    if (list && !inList(v, list)) warn(k, "Choose a value from the list");
  }

  // Steps named in 03-06 must exist in 02, once 02 has any (TGO Fr-03 process map).
  if (ctx.steps.size) {
    const stepCols =
      sheetId === "flow"
        ? ["from", "to"]
        : ["materials", "energy", "output"].includes(sheetId)
          ? ["step"]
          : [];
    for (const k of stepCols)
      if (filled(cells[k]) && !ctx.steps.has(lower(cells[k])))
        warn(k, "Step is not listed in 02 Process steps");
  }
  if (
    sheetId === "flow" &&
    filled(cells.from) &&
    lower(cells.from) === lower(cells.to)
  )
    warn("to", "From and To are the same step");

  if (sheetId === "products" && filled(cells.cn)) {
    if (!isCn(cells.cn)) warn("cn", "Not a CBAM CN code");
    else if (filled(cells.unit)) {
      const unit = lower(cells.unit);
      if (digits(cells.cn) === ELECTRICITY_CN) {
        if (unit !== "mwh")
          warn("unit", "Electricity (CN 2716 00 00) is reported in MWh");
      } else if (unit !== "t" && unit !== "kg")
        warn("unit", "CBAM goods are reported in tonnes");
    }
    const qty = parseQuantity(cells.qty);
    const exported = parseQuantity(cells.exported);
    if (qty !== null && exported !== null && exported > qty)
      warn("exported", "Exported to EU is more than Quantity");
  }
  if (sheetId === "materials" && filled(cells.cn) && !isCn(cells.cn))
    warn("cn", "Not a CBAM CN code");

  if (
    sheetId === "energy" &&
    /electric|ไฟฟ้า/i.test(cells.item ?? "") &&
    filled(cells.unit) &&
    !["kwh", "mwh", "gj"].includes(lower(cells.unit))
  )
    warn("unit", "Electricity is measured in kWh, MWh or GJ");

  if (sheetId === "evidence") {
    for (const k of ["issued", "valid"])
      if (filled(cells[k]) && !DATE.test(cells[k].trim()))
        warn(k, "Enter a date as YYYY-MM-DD or a year");
    if (
      !flags.issued &&
      !flags.valid &&
      filled(cells.issued) &&
      filled(cells.valid) &&
      cells.valid.trim() < cells.issued.trim()
    )
      warn("valid", "Valid until is before Issued on");
  }

  return { flags, notes };
}

/** A short hash of a row's data cells; a confirmation stores it, so any later edit undoes it. */
export function rowSignature(cells: Record<string, string>): string {
  const text = Object.keys(cells)
    .filter((k) => k !== "status" && filled(cells[k]))
    .sort()
    .map((k) => `${k}=${cells[k].trim()}`)
    .join("\u0001");
  let h = 5381;
  for (let i = 0; i < text.length; i++)
    h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export const CONFIRMED_PREFIX = "confirmed:";
export const confirmValue = (cells: Record<string, string>) =>
  `${CONFIRMED_PREFIX}${rowSignature(cells)}`;
