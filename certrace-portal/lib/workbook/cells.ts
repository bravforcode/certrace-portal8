import { buildSheets, BLANK_ROWS, type RowStatus, type Sheet, type WorkspaceFile } from "../workspace-sheets";

export const cellKey = (sheetId: string, row: number, col: string) => `${sheetId}:${row}:${col}`;

export function rowsUsed(cells: Record<string, string>, sheetId: string) {
  let max = -1;
  for (const key of Object.keys(cells)) {
    const [s, r] = key.split(":");
    if (s === sheetId) max = Math.max(max, Number(r));
  }
  return max + 1;
}

const ROW_STATUS = new Set<string>(["review", "confirmed", "missing"]);

/** Server cells are the only data source. Five spare rows below the last used
    row leave room to type without an "add row" button. */
export function sheetsFromCells(cells: Record<string, string>, files: WorkspaceFile[]): Sheet[] {
  return buildSheets(files).map((sheet) => {
    if (sheet.id === "documents") return sheet;
    const used = rowsUsed(cells, sheet.id);
    const count = Math.max(BLANK_ROWS, used ? used + 5 : 0);
    const rows = Array.from({ length: count }, (_, i) => {
      const own: Record<string, string> = {};
      for (const col of sheet.cols) {
        const v = cells[cellKey(sheet.id, i, col.key)];
        if (v !== undefined) own[col.key] = v;
      }
      const hasData = Object.keys(own).some((k) => k !== "status");
      const status: RowStatus = ROW_STATUS.has(own.status ?? "")
        ? (own.status as RowStatus)
        : hasData
          ? "confirmed"
          : "empty";
      return { cells: own, status };
    });
    return { ...sheet, rows };
  });
}
