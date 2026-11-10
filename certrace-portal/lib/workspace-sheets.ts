/* ════════════════════════════════════════════════════════════
   WORKSPACE SHEETS — what the uploaded files become

   The tabs along the bottom of the workspace: a production diagram (empty
   for now — it comes later), then 00–08. Each sheet is columns and rows;
   a row carries a status (to review, confirmed, missing data) and may flag
   single cells — "warn" for a value that needs a look, "missing" for one
   that is not there. The issue count on each tab is its rows that are not
   confirmed.

   MOCK DATA, written in English and translated at render (the Thai lives in
   lib/i18n-th-workspace.ts) — a galvanised-fastener plant, so the sheets
   read like a real CBAM workspace. Sheet 00 is built from the files the
   exporter actually uploaded.
   ════════════════════════════════════════════════════════════ */

import type { WorkspaceFile } from "./workspace-store";

/** "empty" is a row of a workspace started from the beginning: nothing in it yet, nothing to check. */
export type RowStatus = "review" | "confirmed" | "missing" | "empty";
export type CellFlag = "warn" | "missing";
export type ColKind = "text" | "number" | "unit" | "method" | "file" | "status";

export type SheetCol = { key: string; label: string; kind: ColKind; width: string };
export type SheetRow = {
  cells: Record<string, string>;
  status: RowStatus;
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

const r = (cells: Record<string, string>, st: RowStatus, flags?: Record<string, CellFlag>): SheetRow => ({
  cells,
  status: st,
  flags,
});

export const PRODUCTION_DIAGRAM_ID = "diagram";
export const INSTALLATION_SHEET_ID = "installation";

/** Rows a workspace started from the beginning opens with, per sheet. */
export const BLANK_ROWS = 20;

/** The sheets of a year: built from its files, or — when the year was started
    from the beginning — the same sheets with empty rows to fill in. */
export function buildSheets(files: WorkspaceFile[], blank = false): Sheet[] {
  const sheets = sampleSheets(files);
  if (!blank) return sheets;
  return sheets.map((s) => ({
    ...s,
    rows: Array.from({ length: BLANK_ROWS }, () => ({ cells: {}, status: "empty" as const })),
  }));
}

function sampleSheets(files: WorkspaceFile[]): Sheet[] {
  const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
  return [
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
      rows: files.map((f) =>
        r(
          {
            file: f.name,
            description: f.description,
            type: (f.name.split(".").pop() ?? "").toUpperCase(),
            size: kb(f.size),
          },
          "confirmed",
        ),
      ),
    },
    {
      id: INSTALLATION_SHEET_ID,
      code: "00A",
      name: "Installation",
      cols: [],
      rows: [],
    },
    {
      id: "products",
      code: "01",
      name: "Products",
      cols: [col("cn", "CN code", "text", W.step), col("item", "Product", "text", W.item), qty, unit, method, source, status],
      rows: [
        r({ cn: "7318 15 88", item: "Hexagon bolts, galvanised", qty: "3,850", unit: "t", method: "Measured", source: "production_2026.xlsx" }, "confirmed"),
        r({ cn: "7318 16 92", item: "Hexagon nuts, galvanised", qty: "1,240", unit: "t", method: "Measured", source: "production_2026.xlsx" }, "confirmed"),
        r({ cn: "7318 22 00", item: "Washers", qty: "410", unit: "t", method: "Measured", source: "production_2026.xlsx" }, "confirmed"),
      ],
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
      rows: [
        r({ step: "Pickling", what: "Remove scale with acid", input: "Wire rod", output: "Clean rod", source: "process_map.pdf" }, "confirmed"),
        r({ step: "Wire drawing", what: "Draw to diameter", input: "Clean rod", output: "Wire", source: "process_map.pdf" }, "confirmed"),
        r({ step: "Cold forging", what: "Form heads and threads", input: "Wire", output: "Blanks", source: "process_map.pdf" }, "confirmed"),
        r({ step: "Heat treatment", what: "Quench and temper", input: "Blanks", output: "Hardened parts", source: "process_map.pdf" }, "confirmed"),
        r({ step: "Galvanizing", what: "Hot-dip zinc coating", input: "Hardened parts", output: "Galvanised parts", source: "process_map.pdf" }, "confirmed"),
        r({ step: "Packing", what: "Box and palletise", input: "Galvanised parts", output: "Finished goods", source: "process_map.pdf" }, "confirmed"),
      ],
    },
    {
      id: "materials",
      code: "03",
      name: "Raw materials",
      cols: [col("step", "Step", "text", W.step), col("item", "Item", "text", W.item), qty, unit, method, source, status],
      rows: [
        r({ step: "Galvanizing", item: "Zinc (Zn)", qty: "18.4", unit: "Not stated", method: "Calculated", source: "PO-221.pdf" }, "review", { qty: "warn", unit: "warn" }),
        r({ step: "Packing", item: "Steel strapping", qty: "1.8", unit: "t", method: "Estimated", source: NO_FILE }, "review", { method: "warn" }),
        r({ step: "Pickling", item: "Hydrochloric acid 32%", qty: "4.2", unit: "t", method: "Measured", source: "invoice_03.pdf" }, "confirmed"),
        r({ step: "Wire drawing", item: "Carbon steel wire rod", qty: "520", unit: "t", method: "Measured", source: "stock_card.xlsx" }, "confirmed"),
        r({ step: "Galvanizing", item: "Recycled zinc", qty: "", unit: "t", method: "Estimated", source: NO_FILE }, "missing", { qty: "missing" }),
        r({ step: "Galvanizing", item: "Flux ZnCl₂ / NH₄Cl", qty: "1.1", unit: "t", method: "Measured", source: "invoice_07.pdf" }, "confirmed"),
        r({ step: "Packing", item: "Wooden pallets", qty: "3,200", unit: "pcs", method: "Measured", source: "packing_list.xlsx" }, "confirmed"),
        r({ step: "Packing", item: "Plastic film", qty: "0.6", unit: "t", method: "Measured", source: "invoice_11.pdf" }, "confirmed"),
      ],
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
      rows: [
        r({ from: "Wire drawing", to: "Cold forging", item: "Wire", qty: "512", unit: "t", method: "Measured" }, "confirmed"),
        r({ from: "Cold forging", to: "Heat treatment", item: "Blanks", qty: "498", unit: "t", method: "Measured" }, "confirmed"),
        r({ from: "Heat treatment", to: "Galvanizing", item: "Hardened parts", qty: "495", unit: "t", method: "Calculated" }, "confirmed"),
        r({ from: "Galvanizing", to: "Packing", item: "Galvanised parts", qty: "", unit: "t", method: "Estimated" }, "missing", { qty: "missing" }),
      ],
    },
    {
      id: "energy",
      code: "05",
      name: "Energy",
      cols: [col("step", "Step", "text", W.step), col("item", "Energy source", "text", W.item), qty, unit, method, source, status],
      rows: [
        r({ step: "Whole plant", item: "Grid electricity", qty: "2,140", unit: "MWh", method: "Measured", source: "pea_bills_2026.pdf" }, "confirmed"),
        r({ step: "Heat treatment", item: "Natural gas", qty: "18,600", unit: "GJ", method: "Measured", source: "gas_invoice.pdf" }, "confirmed"),
        r({ step: "Galvanizing", item: "LPG", qty: "312", unit: "GJ", method: "Estimated", source: NO_FILE }, "review", { method: "warn" }),
        r({ step: "Forklifts", item: "Diesel", qty: "41,000", unit: "L", method: "Calculated", source: "fuel_log.xlsx" }, "review", { qty: "warn" }),
      ],
    },
    {
      id: "output",
      code: "06",
      name: "Output & waste",
      cols: [col("step", "Step", "text", W.step), col("item", "Item", "text", W.item), qty, unit, method, source, status],
      rows: [
        r({ step: "Packing", item: "Finished fasteners", qty: "5,500", unit: "t", method: "Measured", source: "production_2026.xlsx" }, "confirmed"),
        r({ step: "Cold forging", item: "Steel scrap, sold", qty: "22", unit: "t", method: "Measured", source: "scrap_sales.pdf" }, "confirmed"),
        r({ step: "Galvanizing", item: "Zinc dross", qty: "2.9", unit: "t", method: "Estimated", source: NO_FILE }, "review", { method: "warn" }),
        r({ step: "Pickling", item: "Spent acid", qty: "", unit: "t", method: "Estimated", source: NO_FILE }, "missing", { qty: "missing" }),
      ],
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
      rows: [
        r({ route: "Plant → Laem Chabang", mode: "Truck", qty: "64", unit: "km", method: "Measured", source: "delivery_note.pdf" }, "confirmed"),
        r({ route: "Laem Chabang → Rotterdam", mode: "Sea", qty: "17,900", unit: "km", method: "Calculated", source: "bl_0418.pdf" }, "confirmed"),
      ],
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
      rows: [
        r({ item: "Gas meter calibration certificate", covers: "05 Energy", issuer: "Metrology lab", valid: "2027-03", source: "calib_gas.pdf" }, "confirmed"),
        r({ item: "Electricity bills, Jan–Dec", covers: "05 Energy", issuer: "PEA", valid: "—", source: "pea_bills_2026.pdf" }, "confirmed"),
        r({ item: "Supplier emissions statement", covers: "03 Raw materials", issuer: "Wire rod mill", valid: "2027-04", source: "mill_statement.pdf" }, "confirmed"),
      ],
    },
  ];
}

export const issuesOf = (s: Sheet) => s.rows.filter((r) => r.status === "review" || r.status === "missing").length;

/** A-1-style column letters. */
export const letter = (i: number) => String.fromCharCode(65 + i);
