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
// TGO CFP columns shared by the C sheets: which product (a CN code of 01), the life-cycle stage, the EF reference.
const product = col("product", "Product (CN)", "text", W.step);
const stage = col("stage", "Life-cycle stage", "text", W.step);
const efRef = col("ef_ref", "EF reference", "text", W.file);

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
       Fr-01 and Fr-06.2 per product (C1), the Fr-04.1 factor columns per life-cycle item (C2), and the
       Fr-04.2 to Fr-06.1 sheets below (C3-C7). Quantities,
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
        // Fr-06.2: the product group benchmark the result is compared with.
        col("benchmark", "Benchmark (kgCO2e)", "number", W.qty),
        col("benchmark_source", "Benchmark source", "text", W.item),
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
        product,
        stage,
        col("item", "Item", "text", W.item),
        col("qty", "Quantity per FU", "number", W.qty),
        unit,
        col("ef", "EF (kgCO2e/unit)", "number", W.qty),
        col("ef_source", "EF source", "text", W.method),
        efRef,
        col("allocation", "Allocation %", "number", W.qty),
        col("cutoff", "Cut-off", "text", W.unit),
        source,
        status,
      ],
      rows: [],
    },
    // Fr-04.2 method b (distance and load). Method a (fuel used) is not mapped: no source workbook uses it.
    {
      id: "cfp-transport",
      code: "C3",
      name: "TGO CFP transport",
      cols: [
        product,
        stage,
        col("item", "Item carried", "text", W.item),
        col("qty", "Quantity per FU", "number", W.qty),
        unit,
        col("distance", "Distance (km)", "number", W.qty),
        col("vehicle", "Vehicle", "text", W.item),
        col("out_load", "% loaded out", "number", W.qty),
        col("back_load", "% loaded back", "number", W.qty),
        col("ef_tkm", "EF out (kgCO2e/tkm)", "number", W.qty),
        col("ef_km", "EF back (kgCO2e/km)", "number", W.qty),
        efRef,
        source,
        status,
      ],
      rows: [],
    },
    // Fr-04.3: each support unit (cooling water, boiler, wastewater) with its own inputs and outputs.
    {
      id: "cfp-support",
      code: "C4",
      name: "TGO CFP support units",
      cols: [
        product,
        col("unit_name", "Support unit", "text", W.item),
        col("io", "Input/Output", "text", W.unit),
        col("item", "Item", "text", W.item),
        qty,
        unit,
        col("per_fu", "Quantity per FU", "number", W.qty),
        col("ef", "EF (kgCO2e/unit)", "number", W.qty),
        col("ef_source", "EF source", "text", W.method),
        efRef,
        source,
        status,
      ],
      rows: [],
    },
    // Fr-04.4: land use change of an agricultural raw material.
    {
      id: "cfp-luc",
      code: "C5",
      name: "TGO CFP land use change",
      cols: [
        product,
        col("item", "Raw material", "text", W.item),
        unit,
        col("qty", "Quantity per unit", "number", W.qty),
        col("yield", "Yield (per rai/year)", "number", W.qty),
        col("tenure", "Tenure", "text", W.unit),
        col("district", "District", "text", W.unit),
        col("province", "Province", "text", W.unit),
        col("lat", "Latitude", "number", W.qty),
        col("lng", "Longitude", "number", W.qty),
        col("before_year", "Year before", "number", W.qty),
        col("before_use", "Use before", "text", W.unit),
        col("after_year", "Year after", "number", W.qty),
        col("after_use", "Use after", "text", W.unit),
        col("ef", "EF (kgCO2e/rai/year)", "number", W.qty),
        efRef,
        source,
        status,
      ],
      rows: [],
    },
    // Fr-06.1 table 1: the result per life-cycle stage in the base year and this year.
    {
      id: "cfp-baseyear",
      code: "C6",
      name: "TGO CFP base year",
      cols: [
        product,
        stage,
        col("base_year", "Base year", "number", W.qty),
        col("base", "Base year (kgCO2e)", "number", W.qty),
        col("current_year", "Current year", "number", W.qty),
        col("current", "Current year (kgCO2e)", "number", W.qty),
        source,
        status,
      ],
      rows: [],
    },
    // Fr-06.1 table 2: the reduction measures behind the change.
    {
      id: "cfp-reduction",
      code: "C7",
      name: "TGO CFP reduction measures",
      cols: [
        product,
        col("measure", "Measure type", "text", W.item),
        col("detail", "Detail", "text", W.item),
        col("result", "Result", "text", W.item),
        source,
        status,
      ],
      rows: [],
    },
    /* EU CBAM verification report (Implementing Regulation 2025/2546, Annex), one row per report. Only
       the items 00-09 and the CBAM tab do not hold: operator, installation, verifier name, accreditation
       state, body and number, goods data and precursors are there already. */
    {
      id: "cbam-verification",
      code: "V1",
      name: "EU CBAM verification report",
      cols: [
        col("report_id", "Report identifier", "text", W.step), // 1.2(a)
        col("period", "Reporting period", "text", W.step), // 1.2(b)
        col("verifier_address", "Verifier address", "text", W.item), // 1.3(b)
        col("offices", "Outsourced offices", "text", W.item), // 1.3(c)
        col("accreditation_expiry", "Accreditation expires", "text", W.unit), // 1.3(g)
        col("accreditation_scope", "Accreditation scope", "text", W.item), // 1.3(h), 2.3(c)
        col("leader", "Team leader", "text", W.item), // 2.1(a)
        col("team", "Lead auditor, auditors, experts", "text", W.item), // 2.1(b)
        col("visit_team", "Site visit team", "text", W.item), // 2.1(c)
        col("site_visit", "Site visit", "text", W.unit), // Arts 2-4
        col("visit_dates", "Site visit dates", "text", W.unit), // 2.2(a)
        col("days_on_site", "Days on site", "number", W.qty), // 2.2(a)
        col("last_physical", "Last physical visit", "text", W.unit), // 2.2(b)
        col("visit_reason", "Reason for virtual visit or waiver", "text", W.item), // 2.2(c), (d)
        col("other_visits", "Other visits", "text", W.item), // 2.2(e)
        col("objectives", "Objectives and scope", "text", W.item), // 2.3(a), (b)
        col("mp_version", "Monitoring plan version", "text", W.unit), // 2.3(d)
        col("mp_date", "Monitoring plan date", "text", W.unit), // 2.3(d)
        col("criteria", "Verification criteria", "text", W.item), // 2.3(e)
        col("materiality", "Materiality level", "text", W.unit), // 2.3(f), Art 5
        col("zero_rated", "Zero-rated fuels", "text", W.unit), // 2.4(a)(3)
        col("co2_capture", "CO2 capture", "text", W.unit), // 2.4(a)(6)
        col("statement", "Verification statement", "text", W.item), // 2.6(a)
        col("corrected", "Material misstatements corrected", "text", W.item), // 2.6(b)
        col("nc_corrected", "Material non-conformities corrected", "text", W.item), // 2.6(c)
        col("remaining", "Remaining misstatements", "text", W.item), // 2.6(d)
        col("nc_remaining", "Remaining non-conformities", "text", W.item), // 2.6(e)
        col("non_compliance", "Remaining non-compliance", "text", W.item), // 2.6(f)
        col("recommendations", "Recommendations", "text", W.item), // 2.6(g)
        col("signed_by", "Signed by", "text", W.item), // 2.6(h)
        col("signed_date", "Signed on", "text", W.unit), // 2.6(h)
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
