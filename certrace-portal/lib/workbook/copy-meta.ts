import type { WorkbookMeta } from "../api/workbooks";
import type { WorkspaceFile } from "../workspace-sheets";

/**
 * The meta a copy writes first. The year is "syncing" with the copy's own timestamp, so the
 * set-up timer can finish it if the copy is interrupted before it reaches "ready".
 */
export function copyingMeta(from: number, source: WorkbookMeta, confirmedAt: string): WorkbookMeta {
  const files: WorkspaceFile[] = source.files ?? [];
  return { status: "syncing", files, blank: source.blank, confirmedAt, copiedFrom: from };
}
