/* ════════════════════════════════════════════════════════════
   THE CBAM TAB — what the workbook's CBAM tab counts

   The tab reads the answers the Convert fill-in form and Smart Link write under
   `cbam:0:<field id>` (template-fields.ts) and says which template fields are
   filled. Only required fields make up the total: an empty optional field is
   "optional" and does not block the report. A whitespace-only answer is empty.
   ════════════════════════════════════════════════════════════ */

import { CBAM_FIELDS, cbamCellKey, declaredBlocks, visibleBlocks, type CbamField } from "./template-fields";

/** The workbook tab's id, used as `?sheet=cbam`. Not a sheet of buildSheets, so it feeds no sheet status. */
export const CBAM_TAB_ID = "cbam";

export type CbamRowState = "filled" | "missing" | "optional";
export type CbamRow = { field: CbamField; value: string; state: CbamRowState };
export type CbamSection = { section: string; rows: CbamRow[] };
export type CbamItemCount = { item: string; filled: number; total: number };
export type CbamSummary = {
  /** Required fields. */
  total: number;
  /** Required fields with an answer. */
  filled: number;
  missing: number;
  byItem: CbamItemCount[];
  sections: CbamSection[];
};

/** Counts and checklist of `fields` against the workbook `cells`, both in catalogue order. */
export function summariseCbam(cells: Record<string, string>, fields: readonly CbamField[] = CBAM_FIELDS): CbamSummary {
  const sections = new Map<string, CbamSection>();
  const items = new Map<string, CbamItemCount>();
  let total = 0;
  let filled = 0;
  // Empty repeated processes and precursors stay off the checklist; they are optional, so counts are unchanged.
  const listed = new Set(visibleBlocks(fields, (f) => (cells[cbamCellKey(f)] ?? "").trim() !== "", declaredBlocks(cells)));

  for (const field of fields) {
    const value = (cells[cbamCellKey(field)] ?? "").trim();
    const answered = value !== "";
    const state: CbamRowState = answered ? "filled" : field.optional ? "optional" : "missing";

    const item = items.get(field.item) ?? { item: field.item, filled: 0, total: 0 };
    items.set(field.item, item);
    if (!field.optional) {
      total++;
      item.total++;
      if (answered) {
        filled++;
        item.filled++;
      }
    }

    if (!listed.has(field)) continue;
    const section = sections.get(field.section) ?? { section: field.section, rows: [] };
    sections.set(field.section, section);
    section.rows.push({ field, value, state });
  }

  return { total, filled, missing: total - filled, byItem: [...items.values()], sections: [...sections.values()] };
}
