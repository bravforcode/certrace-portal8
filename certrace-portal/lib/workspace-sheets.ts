/* ════════════════════════════════════════════════════════════
   WORKSPACE SHEETS — the sheet definitions of a reporting year

   The tabs along the bottom of the workspace: the installation, the documents
   the exporter uploaded, then 01–08. The production flow is a view of these
   sheets (Table | Flow in the workspace), not a sheet of its own. Each sheet is
   columns and rows; a row carries a status (to review, confirmed, missing
   data) and may flag single cells. The rows come from the shared server
   workbook (lib/workbook/cells.ts), never from sample data: a new year is
   empty until the exporter types into it or uploads a file.

   Column labels are English and translated at render (the Thai lives in
   lib/i18n-th-workspace.ts).
   ════════════════════════════════════════════════════════════ */

/** One uploaded file, as the year's meta records it. */
export type WorkspaceFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  description: string;
};

/** "empty" is a row of a workspace started from the beginning: nothing in it yet, nothing to check. */
export type RowStatus = "review" | "confirmed" | "missing" | "empty";
export type CellFlag = "warn" | "missing";
export type ColKind = "text" | "number" | "unit" | "method" | "file" | "status";

export type SheetCol = { key: string; label: string; kind: ColKind; width: string };
export type SheetRow = {
  cells: Record<string, string>;
  status: RowStatus;
  /* Reserved: nothing sets flags yet (sheetsFromCells never produces them), so the
     warn/missing highlight in the spreadsheet is inert until a checker fills this in. */
  flags?: Record<string, CellFlag>;
};
export type Sheet = { id: string; code: string; name: string; cols: SheetCol[]; rows: SheetRow[] };

/** Words in a cell that are translated (the rest — numbers, file names, CN codes — are not). */
export const NO_FILE = "No file";

const W = {
  step: "minmax(104px,1.1fr)",
  item: "minmax(150px,1.9fr)",
  qty: "minmax(72px,0.75fr)",
  unit: "minmax(76px,0.7fr)",
  method: "minmax(88px,0.85fr)",
  file: "minmax(136px,1.45fr)",
  status: "minmax(112px,1.1fr)",
};

const col = (key: string, label: string, kind: ColKind, width: string): SheetCol => ({ key, label, kind, width });
const status = col("status", "Status", "status", W.status);
const source = col("source", "Source", "file", W.file);
const method = col("method", "Method", "method", W.method);
const qty = col("qty", "Quantity", "number", W.qty);
const unit = col("unit", "Unit", "unit", W.unit);

export const INSTALLATION_SHEET_ID = "installation";

/** Rows a sheet starts with; cells.ts pads every sheet to at least this many. */
export const BLANK_ROWS = 20;

const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** The sheet structure of a year. Only the documents sheet has rows of its own (its uploaded files);
    every other sheet's rows are filled in by cells.ts from the server workbook. */
export function buildSheets(files: WorkspaceFile[]): Sheet[] {
  return [
    // The first tab: the site the sheets are about, before its products and steps (MEASUR order).
    { id: INSTALLATION_SHEET_ID, code: "00A", name: "Installation", cols: [], rows: [] },
    {
      id: "documents",
      code: "00",
      name: "Documents",
      cols: [
        col("file", "File", "file", "minmax(160px,1.8fr)"),
        col("description", "Description", "text", "minmax(200px,2.6fr)"),
        col("type", "Type", "text", "minmax(72px,0.7fr)"),
        col("size", "Size", "number", "minmax(72px,0.7fr)"),
        status,
      ],
      rows: files.map((f) => ({
        cells: {
          file: f.name,
          description: f.description,
          type: (f.name.split(".").pop() ?? "").toUpperCase(),
          size: kb(f.size),
        },
        status: "confirmed" as const,
      })),
    },
    {
      id: "products",
      code: "01",
      name: "Products",
      cols: [col("cn", "CN code", "text", W.step), col("item", "Product", "text", W.item), qty, unit, method, source, status],
      rows: [],
    },
    {
      id: "steps",
      code: "02",
      name: "Process steps",
      cols: [
        col("step", "Step", "text", W.step),
        col("what", "What happens", "text", W.item),
        col("input", "Main input", "text", "minmax(104px,1.2fr)"),
        col("output", "Output", "text", "minmax(104px,1.2fr)"),
        source,
        status,
      ],
      rows: [],
    },
    {
      id: "materials",
      code: "03",
      name: "Raw materials",
      cols: [col("step", "Step", "text", W.step), col("item", "Item", "text", W.item), qty, unit, method, source, status],
      rows: [],
    },
    {
      id: "flow",
      code: "04",
      name: "Material flow",
      cols: [
        col("from", "From", "text", W.step),
        col("to", "To", "text", W.step),
        col("item", "Material", "text", "minmax(120px,1.4fr)"),
        qty,
        unit,
        method,
        status,
      ],
      rows: [],
    },
    {
      id: "energy",
      code: "05",
      name: "Energy",
      cols: [col("step", "Step", "text", W.step), col("item", "Energy source", "text", W.item), qty, unit, method, source, status],
      rows: [],
    },
    {
      id: "output",
      code: "06",
      name: "Output & waste",
      cols: [col("step", "Step", "text", W.step), col("item", "Item", "text", W.item), qty, unit, method, source, status],
      rows: [],
    },
    {
      id: "transport",
      code: "07",
      name: "Transport",
      cols: [
        col("route", "Route", "text", "minmax(160px,2fr)"),
        col("mode", "Mode", "text", W.unit),
        col("qty", "Distance", "number", W.qty),
        unit,
        method,
        source,
        status,
      ],
      rows: [],
    },
    {
      id: "evidence",
      code: "08",
      name: "Evidence",
      cols: [
        col("item", "Evidence", "text", "minmax(176px,2.2fr)"),
        col("covers", "Covers", "text", "minmax(130px,1.1fr)"),
        col("issuer", "Issued by", "text", "minmax(112px,1.2fr)"),
        col("valid", "Valid until", "number", W.qty),
        source,
        status,
      ],
      rows: [],
    },
  ];
}

export const issuesOf = (s: Sheet) => s.rows.filter((r) => r.status === "review" || r.status === "missing").length;

/** A-1-style column letters. */
export const letter = (i: number) => String.fromCharCode(65 + i);
