/* The fill-in form for a Convert requirement: which workbook cells each answer goes to.

   Every CBAM answer goes to the CBAM tab of the installation workbook, row 0, column = the
   template field id (lib/cbam/template-fields.ts). `cell` is that column key; the page
   picks the row when it saves. A requirement with no template input (carbon price) has no fields. */

import {
  CBAM_SHEET_ID,
  cbamFieldsFor,
  type CbamBlockGroup,
  type CbamItemId,
} from "../cbam/template-fields";

export type FillField = {
  key: string;
  label: string;
  /** Column key of the sheet's rows (see buildSheets in lib/workspace-sheets.ts). */
  cell: string;
  kind: "text" | "number" | "date" | "select";
  unit?: string;
  /** Heading the field is grouped under in the form. */
  section?: string;
  options?: readonly string[];
  optionLabels?: Readonly<Record<string, string>>;
  optional?: true;
  /** Repeated process or precursor block (see visibleBlocks). */
  block?: number;
  group?: CbamBlockGroup;
  declares?: true;
};

export type FillItem = { title: string; sheet: string; fields: FillField[] };

export type FillTarget = { sheet: string; cell: string };

type FillItemId = CbamItemId;

const cbamItem = (title: string, item: CbamItemId): FillItem => ({
  title,
  sheet: CBAM_SHEET_ID,
  fields: cbamFieldsFor(item).map((f) => ({
    key: f.id,
    label: f.label,
    cell: f.id,
    kind: f.kind,
    unit: f.unit,
    section: f.section,
    options: f.options,
    optionLabels: f.optionLabels,
    optional: f.optional,
    block: f.block,
    group: f.group,
    declares: f.declares,
  })),
});

export const FILL_ITEMS: Record<FillItemId, FillItem> = {
  installation: cbamItem("Installation details", "installation"),
  goods: cbamItem("Goods and production routes", "goods"),
  direct: cbamItem("Direct emissions — fuels and materials", "direct"),
  indirect: cbamItem("Indirect emissions — electricity", "indirect"),
  precursors: cbamItem("Precursors — embedded emissions", "precursors"),
  "carbon-price": cbamItem("Carbon price paid", "carbon-price"),
  monitoring: cbamItem("Monitoring methodology document", "monitoring"),
  communication: cbamItem("Supplier communication sheets", "communication"),
  verification: cbamItem("Verification statement", "verification"),
};

/** The fill entry for a requirement id, or null for an unknown id (prototype names included). */
export function getFillItem(id: string): FillItem | null {
  return Object.prototype.hasOwnProperty.call(FILL_ITEMS, id)
    ? FILL_ITEMS[id as FillItemId]
    : null;
}

/** The sheet and column a field's answer is saved to; null when the item or the field is unknown. */
export function fillFieldCell(id: string, fieldKey: string): FillTarget | null {
  const item = getFillItem(id);
  const field = item?.fields.find((f) => f.key === fieldKey);
  return item && field ? { sheet: item.sheet, cell: field.cell } : null;
}
