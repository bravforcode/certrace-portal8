import type { SheetStatus } from "../workbook/status";

/** Installations whose factory checks are all done; an installation with no checks is not complete. */
export const countComplete = (progresses: { done: number; total: number }[]) =>
  progresses.filter((p) => p.total > 0 && p.done >= p.total).length;

const SEVERITY: SheetStatus[] = ["untouched", "complete", "review", "missing"];

/** A year's status is its worst sheet: missing over review over complete over untouched. */
export function worstOf(statuses: SheetStatus[]): SheetStatus {
  return statuses.reduce<SheetStatus>((a, b) => (SEVERITY.indexOf(b) > SEVERITY.indexOf(a) ? b : a), "untouched");
}
