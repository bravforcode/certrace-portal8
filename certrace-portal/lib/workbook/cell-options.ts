/* The pick list a workspace cell drops down, so a value can be chosen instead of typed.

   Fixed lists cover the columns with a known vocabulary (units the sheet parsers read, methods,
   transport modes). Columns that name things of this year (steps, CN codes, source files) offer
   what the year already holds. Every list also carries the values already typed in that column,
   so a custom value is one click away the next time. Free typing still works: this only suggests. */

import { NO_FILE, type Sheet, type SheetCol } from "../workspace-sheets";

/** Units the balance and estimate parsers read (lib/workbook/balance.ts, estimate.ts). */
const UNITS: Record<string, string[]> = {
  energy: ["kWh", "MWh", "GJ", "m3", "l", "kg", "t"],
  transport: ["km", "tkm", "t"],
};
const DEFAULT_UNITS = ["t", "kg", "m3", "l", "GJ", "kWh", "MWh", "pcs"];

// The words the sheets already use (and translate) for how a value was got.
export const METHODS = ["Measured", "Calculated", "Estimated", "Not stated"];
export const TRANSPORT_MODES = [
  "Road",
  "Rail",
  "Sea",
  "Air",
  "Inland waterway",
  "Pipeline",
];

/** At most this many, so a long sheet never drops a list longer than anyone reads. */
const MAX = 50;

const columnValues = (sheet: Sheet | undefined, key: string) =>
  (sheet?.rows ?? []).map((r) => r.cells[key]?.trim() ?? "");

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const k = v.toLowerCase();
    if (!v || seen.has(k)) continue;
    seen.add(k);
    out.push(v);
    if (out.length === MAX) break;
  }
  return out;
}

export function cellOptions(
  sheet: Sheet,
  col: SheetCol,
  sheets: Sheet[],
): string[] {
  // A number is typed, and the status is set by the sheet, not by hand.
  if (col.kind === "number" || col.kind === "status") return [];
  const byId = (id: string) => sheets.find((s) => s.id === id);
  const typed = columnValues(sheet, col.key);
  const steps = columnValues(byId("steps"), "step");
  let fixed: string[] = [];
  if (col.kind === "unit") fixed = UNITS[sheet.id] ?? DEFAULT_UNITS;
  else if (col.kind === "method") fixed = METHODS;
  else if (col.kind === "file")
    fixed = [...columnValues(byId("documents"), "file"), NO_FILE];
  else if (sheet.id === "transport" && col.key === "mode")
    fixed = TRANSPORT_MODES;
  else if (["step", "from", "to"].includes(col.key) && sheet.id !== "steps")
    fixed = steps;
  else if (col.key === "cn" && sheet.id !== "products")
    fixed = columnValues(byId("products"), "cn");
  return unique([...fixed, ...typed]);
}
