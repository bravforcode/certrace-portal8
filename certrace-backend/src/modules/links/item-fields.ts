import catalogue from "./cbam-item-fields.json";

/** `cell` is the installation workbook cell key (matches CELL_KEY in workbooks/model.ts). */
export type ItemField = {
  key: string;
  label: string;
  section: string;
  cell: string;
  kind: "text" | "number" | "date" | "select";
  unit?: string;
  options?: string[];
  /** Display text for coded option values (TrueFalse stores "1"/"0"). */
  optionLabels?: Record<string, string>;
  optional?: boolean;
};

type CatalogueField = ItemField & { item: string };

// Generated from the portal's CBAM template catalogue (certrace-portal/scripts/write-item-fields.ts),
// so a Smart Link writes exactly the cells the Fill in form writes.
const FIELDS = catalogue.fields as CatalogueField[];
const ITEMS = catalogue.items as Record<string, string>;

export function getItemFields(itemKey: string): ItemField[] {
  return FIELDS.filter((f) => f.item === itemKey).map(({ item: _item, ...f }) => f);
}

export function getItemLabel(itemKey: string): string {
  return ITEMS[itemKey] ?? itemKey;
}

/** A link can only be made for an item that has fields to fill. */
export const isKnownItem = (itemKey: string) => FIELDS.some((f) => f.item === itemKey);
