/* The pick list a workspace cell drops down, so a value can be chosen instead of typed.

   Fixed lists cover the columns with a known vocabulary (units the sheet parsers read, methods,
   transport modes). Columns that name things of this year (steps, CN codes, source files) offer
   what the year already holds. Every list also carries the values already typed in that column,
   so a custom value is one click away the next time. Free typing still works: this only suggests. */

import { TGO_EF_OPTIONS } from "../cfp/tgo-ef";
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

/* TGO CFP form vocabularies (TGO/CFP-V02-2014): Fr-01 scope, the Fr-04.1 life-cycle stages and
   EF source categories (row 9: 1st Self collect/Supplier, 2nd PCR Gen./TGO EF/Int. DB, Others). */
export const CFP_SCOPES = ["B2C", "B2B"];
export const CFP_STAGES = [
  "Raw material acquisition",
  "Production",
  "Distribution",
  "Use",
  "End-of-life",
  "Land use change",
];
export const CFP_EF_SOURCES = [
  "Self collect",
  "Supplier",
  "PCR Gen.",
  "TGO EF",
  "Int. DB",
  "Others",
];
// Fr-06.1: the reduction measure types the form lists (its note says the list is not exhaustive).
export const CFP_MEASURES = [
  "Change raw material",
  "Change raw material source",
  "Change packaging",
  "Increase recycled content",
  "Improve production efficiency",
  "Change energy source",
  "Change production process",
  "Improve energy system efficiency",
  "Change production waste management",
  "Capture and store GHG",
  "Improve transport efficiency",
  "Reduce use-stage emissions",
  "Change end-of-life management",
];
const YES_NO = ["Yes", "No"];
const CFP_LISTS: Record<string, string[]> = {
  scope: CFP_SCOPES,
  stage: CFP_STAGES,
  ef_source: CFP_EF_SOURCES,
  cutoff: YES_NO,
  io: ["Input", "Output"],
  measure: CFP_MEASURES,
};
/* EU CBAM 2025/2546: site visit (Art 2 physical; Arts 3-4 virtual or waived), the Art 5(1) materiality
   level, and the Annex 2.6(a) conclusion. */
export const SITE_VISITS = ["Physical", "Virtual", "Waived"];
export const STATEMENTS = [
  "Reasonable assurance",
  "Not reasonable assurance",
];
const VERIFICATION_LISTS: Record<string, string[]> = {
  site_visit: SITE_VISITS,
  materiality: ["5%"],
  zero_rated: YES_NO,
  co2_capture: YES_NO,
  statement: STATEMENTS,
};
// The items a CFP row can be about: the ones 03, 04, 06 and 07 already name.
const CFP_ITEM_SHEETS: [string, string][] = [
  ["materials", "item"],
  ["energy", "item"],
  ["output", "item"],
  ["transport", "route"],
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
  // The whole TGO EF list (over a thousand rows) is offered past the cap: typing narrows it.
  if (col.key === "ef_ref") {
    const own = unique(typed);
    const seen = new Set(own.map((v) => v.toLowerCase()));
    return [...own, ...TGO_EF_OPTIONS.filter((o) => !seen.has(o.toLowerCase()))];
  }
  const steps = columnValues(byId("steps"), "step");
  let fixed: string[] = [];
  if (col.kind === "unit") fixed = UNITS[sheet.id] ?? DEFAULT_UNITS;
  else if (col.kind === "method") fixed = METHODS;
  else if (col.kind === "file")
    fixed = [...columnValues(byId("documents"), "file"), NO_FILE];
  else if (sheet.id === "transport" && col.key === "mode")
    fixed = TRANSPORT_MODES;
  else if (sheet.id.startsWith("cfp") && CFP_LISTS[col.key])
    fixed = CFP_LISTS[col.key];
  else if (sheet.id === "cbam-verification" && VERIFICATION_LISTS[col.key])
    fixed = VERIFICATION_LISTS[col.key];
  else if (sheet.id.startsWith("cfp") && col.key === "item")
    fixed = CFP_ITEM_SHEETS.flatMap(([id, key]) =>
      columnValues(byId(id), key),
    );
  else if (sheet.id.startsWith("cfp") && col.key === "product")
    fixed = columnValues(byId("products"), "cn");
  else if (["step", "from", "to"].includes(col.key) && sheet.id !== "steps")
    fixed = steps;
  else if (col.key === "cn" && sheet.id !== "products")
    fixed = columnValues(byId("products"), "cn");
  return unique([...fixed, ...typed]);
}
