import type { Sheet, SheetRow } from "../workspace-sheets";
import { coordinateError, missingFields, type Installation } from "../installations";

export type SheetStatus = "untouched" | "missing" | "review" | "complete";

// Required column keys per sheet id; keys come from buildSheets() in workspace-sheets.ts.
export const REQUIRED: Record<string, string[]> = {
  products: ["cn", "item", "qty", "unit"],
  steps: ["step", "what"],
  materials: ["step", "item", "qty", "unit"],
  flow: ["from", "to", "item"],
  energy: ["step", "item", "qty", "unit"],
  output: ["step", "item", "qty", "unit"],
  transport: ["route", "mode", "qty"],
  evidence: ["item", "covers"],
};

// Columns that describe a row rather than hold data; filling only these does not start a row.
const META_COLS = new Set(["status", "source", "method"]);
const filled = (v: string | undefined) => v !== undefined && v.trim() !== "";

export const startedRow = (r: SheetRow) =>
  Object.entries(r.cells).some(([k, v]) => !META_COLS.has(k) && filled(v));

export function sheetStatus(sheet: Sheet, required = REQUIRED[sheet.id] ?? []): SheetStatus {
  const started = sheet.rows.filter(startedRow);
  if (!started.length) return "untouched";
  const flags = started.flatMap((r) => Object.values(r.flags ?? {}));
  if (
    flags.includes("missing") ||
    started.some((r) => r.status === "missing" || required.some((k) => !filled(r.cells[k])))
  )
    return "missing";
  if (flags.includes("warn") || started.some((r) => r.status === "review")) return "review";
  return "complete";
}

export const STATUS_TONE: Record<SheetStatus, string> = {
  untouched: "#c7c5be",
  missing: "#dc2626",
  review: "#b45309",
  complete: "#16a34a",
};
export const STATUS_LABEL: Record<SheetStatus, string> = {
  untouched: "Not started",
  missing: "Missing data",
  review: "Needs review",
  complete: "Complete",
};

export function missingCells(sheet: Sheet, required = REQUIRED[sheet.id] ?? []) {
  const out: { row: number; cols: string[] }[] = [];
  sheet.rows.forEach((r, row) => {
    if (!startedRow(r)) return;
    const flagged = Object.entries(r.flags ?? {}).filter(([, f]) => f === "missing").map(([k]) => k);
    const cols = [...new Set([...required.filter((k) => !filled(r.cells[k])), ...flagged])];
    if (cols.length) out.push({ row, cols });
  });
  return out;
}

export function statusTooltip(sheet: Sheet, required = REQUIRED[sheet.id] ?? []) {
  const status = sheetStatus(sheet, required);
  if (status !== "missing") return STATUS_LABEL[status];
  const label = (k: string) => sheet.cols.find((c) => c.key === k)?.label ?? k;
  const gaps = missingCells(sheet, required);
  if (!gaps.length) return `${STATUS_LABEL.missing} — marked missing`;
  const shown = gaps.slice(0, 5).map((g) => `row ${g.row + 1}: ${g.cols.map(label).join(", ")}`);
  const more = gaps.length > 5 ? `; +${gaps.length - 5} more` : "";
  return `${STATUS_LABEL.missing} — ${shown.join("; ")}${more}`;
}

// Fields a blank record already carries (the record key, links, the seeded country and creation time);
// filling only these does not start the site.
const NOT_TEMPLATE = new Set(["id", "self", "supplierId", "role", "country", "createdAt"]);

export function installationSheetStatus(inst: Installation | null): SheetStatus {
  if (!inst) return "untouched";
  const started = Object.entries(inst).some(
    ([k, v]) => !NOT_TEMPLATE.has(k) && typeof v === "string" && v.trim() !== "",
  );
  if (!started) return "untouched";
  // A half-entered or out-of-range coordinate pair is missing, the same as the tab's inline error.
  if (missingFields(inst).length || coordinateError(inst.lat, inst.lng)) return "missing";
  return "complete";
}

export const installationTabTone = (inst: Installation | null): string =>
  STATUS_TONE[installationSheetStatus(inst)];

// Tab order follows the material flow, like MEASUR's numbered baseline steps.
export const SHEET_ORDER = [
  "installation", "products", "steps", "materials", "energy",
  "flow", "output", "transport", "evidence", "documents",
];
