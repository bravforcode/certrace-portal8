import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { CBAM_FIELDS, cbamCellKey } from "../lib/cbam/template-fields";
import { getStandard } from "../lib/convert-standards";

// The backend answers Smart Links from this copy of the portal catalogue, so a public
// link can only ever write the cells the Fill in form writes.
// To refresh: `npx tsx scripts/write-item-fields.ts` from `certrace-portal`.
const destination = fileURLToPath(
  new URL("../../certrace-backend/src/modules/links/cbam-item-fields.json", import.meta.url),
);
const items = Object.fromEntries(
  (getStandard("eu-cbam")?.requirements ?? []).map((r) => [r.id, r.title]),
);
const fields = CBAM_FIELDS.map((f) => ({
  item: f.item,
  key: f.id,
  label: f.label,
  section: f.section,
  cell: cbamCellKey(f),
  kind: f.kind,
  ...(f.unit ? { unit: f.unit } : {}),
  ...(f.options ? { options: [...f.options] } : {}),
  ...(f.optionLabels ? { optionLabels: { ...f.optionLabels } } : {}),
  ...(f.optional ? { optional: true } : {}),
}));
writeFileSync(destination, `${JSON.stringify({ items, fields }, null, 1)}\n`);
console.log(`${fields.length} fields, ${Object.keys(items).length} items -> ${destination}`);
