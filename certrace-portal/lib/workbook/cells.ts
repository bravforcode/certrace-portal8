import {
  buildSheets,
  BLANK_ROWS,
  type RowStatus,
  type Sheet,
  type WorkspaceFile,
} from "../workspace-sheets";
import { checkRow, confirmValue, type RowContext } from "./validate";

export const cellKey = (sheetId: string, row: number, col: string) =>
  `${sheetId}:${row}:${col}`;

export function rowsUsed(cells: Record<string, string>, sheetId: string) {
  let max = -1;
  for (const key of Object.keys(cells)) {
    const [s, r] = key.split(":");
    if (s === sheetId) max = Math.max(max, Number(r));
  }
  return max + 1;
}

/* A row's status comes from its data, never from being filled:
   - "missing" when a required cell is empty (or a person marked it missing),
   - "review" when a value fails the row check (validate.ts) or nobody confirmed it yet,
   - "confirmed" only when a person confirmed this exact data; the stored status holds
     a signature of the row, so editing any cell afterwards puts the row back to review. */
function rowStatus(
  own: Record<string, string>,
  flags: Record<string, string>,
): RowStatus {
  const stored = own.status ?? "";
  if (stored === "missing" || Object.values(flags).includes("missing"))
    return "missing";
  if (Object.values(flags).includes("warn")) return "review";
  return stored === confirmValue(own) ? "confirmed" : "review";
}

function contextFor(
  sheet: Sheet,
  cells: Record<string, string>,
  files: WorkspaceFile[],
): RowContext {
  const steps = new Set<string>();
  for (const [k, v] of Object.entries(cells))
    if (k.startsWith("steps:") && k.endsWith(":step") && v.trim())
      steps.add(v.trim().toLowerCase());
  const keys = (kind: string) =>
    new Set(sheet.cols.filter((c) => c.kind === kind).map((c) => c.key));
  return {
    steps,
    files: new Set(files.map((f) => f.name.toLowerCase())),
    numberCols: keys("number"),
    unitCols: keys("unit"),
    methodCols: keys("method"),
    fileCols: keys("file"),
  };
}

/** Server cells are the only data source. Five spare rows below the last used
    row leave room to type without an "add row" button. */
export function sheetsFromCells(
  cells: Record<string, string>,
  files: WorkspaceFile[],
): Sheet[] {
  return buildSheets(files).map((sheet) => {
    if (sheet.id === "documents") return sheet;
    const used = rowsUsed(cells, sheet.id);
    const ctx = contextFor(sheet, cells, files);
    const count = Math.max(BLANK_ROWS, used ? used + 5 : 0);
    const rows = Array.from({ length: count }, (_, i) => {
      const own: Record<string, string> = {};
      for (const col of sheet.cols) {
        const v = cells[cellKey(sheet.id, i, col.key)];
        if (v !== undefined) own[col.key] = v;
      }
      const hasData = Object.entries(own).some(
        ([k, v]) => k !== "status" && v.trim() !== "",
      );
      if (!hasData) return { cells: own, status: "empty" as RowStatus };
      const { flags, notes } = checkRow(sheet.id, own, ctx);
      return { cells: own, status: rowStatus(own, flags), flags, notes };
    });
    return { ...sheet, rows };
  });
}
