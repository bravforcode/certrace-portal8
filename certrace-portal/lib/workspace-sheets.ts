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
  /** When Certrace finished reviewing the file. Absent while the review is pending. */
  reviewedAt?: string;
};

/** The account-file id that holds a workspace file's bytes (PUT /api/v1/account/files/:id). */
export const workspaceFileId = (id: string) => `workspace-${id}`;

/* The server accepts a file by its content type. Browsers send an empty or vendor type for some
   files (a CSV from Excel arrives as application/vnd.ms-excel), so the extension decides then. */
const BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  csv: "text/csv",
  txt: "text/plain",
  tsv: "text/tab-separated-values",
  md: "text/markdown",
  json: "application/json",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};
const ACCEPTED = new Set(Object.values(BY_EXTENSION));

/** The file with a content type the server accepts, or null when neither its type nor its extension is one. */
export function uploadable(file: File): File | null {
  if (ACCEPTED.has(file.type)) return file;
  const type = BY_EXTENSION[(file.name.split(".").pop() ?? "").toLowerCase()];
  return type ? new File([file], file.name, { type }) : null;
}

/** "empty" is a row of a workspace started from the beginning: nothing in it yet, nothing to check. */
export type RowStatus = "review" | "confirmed" | "missing" | "empty";
export type CellFlag = "warn" | "missing";
export type ColKind = "text" | "number" | "unit" | "method" | "file" | "status";

export type SheetCol = {
  key: string;
  label: string;
  kind: ColKind;
  width: string;
};
export type SheetRow = {
  cells: Record<string, string>;
  status: RowStatus;
  /* Reserved: nothing sets flags yet (sheetsFromCells never produces them), so the
     warn/missing highlight in the spreadsheet is inert until a checker fills this in. */
  flags?: Record<string, CellFlag>;
};
export type Sheet = {
  id: string;
  code: string;
  name: string;
  cols: SheetCol[];
  rows: SheetRow[];
};

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

const col = (
  key: string,
  label: string,
  kind: ColKind,
  width: string,
): SheetCol => ({ key, label, kind, width });
const status = col("status", "Status", "status", W.status);
const source = col("source", "Source", "file", W.file);
const method = col("method", "Method", "method", W.method);
const qty = col("qty", "Quantity", "number", W.qty);
const unit = col("unit", "Unit", "unit", W.unit);

export const INSTALLATION_SHEET_ID = "installation";

/** Rows a sheet starts with; cells.ts pads every sheet to at least this many. */
export const BLANK_ROWS = 20;

const kb = (n: number) =>
  n >= 1024 * 1024
    ? `${(n / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(n / 1024))} KB`;

/** The sheet structure of a year. Only the documents sheet has rows of its own (its uploaded files);
    every other sheet's rows are filled in by cells.ts from the server workbook. */
export function buildSheets(files: WorkspaceFile[]): Sheet[] {
  return [
    // The first tab: the site the sheets are about, before its products and steps (MEASUR order).
    {
      id: INSTALLATION_SHEET_ID,
      code: "00",
      name: "Installation",
      cols: [],
      rows: [],
    },
    {
      id: "documents",
      code: "09",
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
      cols: [
        col("cn", "CN code", "text", W.step),
        col("item", "Product", "text", W.item),
        qty,
        unit,
        method,
        source,
        status,
      ],
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
      cols: [
        col("step", "Step", "text", W.step),
        col("item", "Item", "text", W.item),
        col("cn", "CN code (precursor)", "text", W.step),
        qty,
        unit,
        method,
        source,
        status,
      ],
      rows: [],
    },
    {
      id: "flow",
      code: "05",
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
      code: "04",
      name: "Energy",
      cols: [
        col("step", "Step", "text", W.step),
        col("item", "Energy source", "text", W.item),
        qty,
        unit,
        method,
        source,
        status,
      ],
      rows: [],
    },
    {
      id: "output",
      code: "06",
      name: "Output & waste",
      cols: [
        col("step", "Step", "text", W.step),
        col("item", "Item", "text", W.item),
        qty,
        unit,
        method,
        source,
        status,
      ],
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
    /* Regulation maps: what one standard asks for that 00-09 do not hold. The EU CBAM map is the
       CBAM tab (lib/cbam/template-fields.ts). The two below are the TGO CFP forms (TGO/CFP-V02-2014):
       Fr-01 per product, and the Fr-04.1-04.3 factor columns per life-cycle item. Quantities,
       materials, energy and transport stay in 01-07; a CFP row names the item and adds its factor. */
    {
      id: "cfp-product",
      code: "C1",
      name: "TGO CFP product",
      cols: [
        col("cn", "CN code", "text", W.step),
        col("fu", "Functional unit", "text", W.item),
        col("scope", "Scope", "text", W.unit),
        col("pcr", "PCR", "text", W.item),
        col("sales", "Sales volume", "number", W.qty),
        unit,
        source,
        status,
      ],
      rows: [],
    },
    {
      id: "cfp",
      code: "C2",
      name: "TGO CFP factors",
      cols: [
        col("stage", "Life-cycle stage", "text", W.step),
        col("item", "Item", "text", W.item),
        col("qty", "Quantity per FU", "number", W.qty),
        unit,
        col("ef", "EF (kgCO2e/unit)", "number", W.qty),
        col("efSource", "EF source", "text", W.method),
        col("efRef", "EF reference", "text", W.file),
        col("allocation", "Allocation %", "number", W.qty),
        col("cutoff", "Cut-off", "text", W.unit),
        source,
        status,
      ],
      rows: [],
    },
  ];
}

export const issuesOf = (s: Sheet) =>
  s.rows.filter((r) => r.status === "review" || r.status === "missing").length;

/** A-1-style column letters. */
export const letter = (i: number) => String.fromCharCode(65 + i);
