import type { Installation } from "../installations";
import { cbamCellKey } from "./template-fields";

type InstallationText = Exclude<
  {
    [K in keyof Installation]-?: Installation[K] extends string | undefined
      ? K
      : never;
  }[keyof Installation],
  undefined
>;

/** A_InstData answers the site wizard already collected, by CBAM field id. */
const FROM_RECORD: ReadonlyArray<readonly [string, InstallationText]> = [
  ["a-i19", "nameLocal"],
  ["a-i20", "name"],
  ["a-i21", "street"],
  ["a-i22", "economicActivity"],
  ["a-i23", "postcode"],
  ["a-i24", "poBox"],
  ["a-i25", "city"],
  ["a-i26", "country"],
  ["a-i27", "unlocode"],
  ["a-i28", "lat"],
  ["a-i29", "lng"],
  ["a-i30", "contactName"],
  ["a-i31", "contactEmail"],
  ["a-i32", "contactPhone"],
  ["a-i37", "operatorName"],
  ["a-i38", "operatorStreet"],
  ["a-i39", "operatorCity"],
  ["a-i40", "operatorPostcode"],
  ["a-i41", "operatorCountry"],
];

/** CBAM cells derived from the installation record and the reporting year; empty values are left out. */
export function installationCbamCells(
  inst: Installation,
  year?: number,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [id, key] of FROM_RECORD) {
    const v = String(inst[key] ?? "").trim();
    if (v) out[cbamCellKey({ id })] = v;
  }
  if (year) {
    out[cbamCellKey({ id: "a-i9" })] = `${year}-01-01`;
    out[cbamCellKey({ id: "a-l9" })] = `${year}-12-31`;
  }
  return out;
}

/** Stored answers with the record's values filling only the cells nobody has answered. */
export function withInstallationDefaults(
  cells: Record<string, string>,
  inst: Installation | null | undefined,
  year?: number,
): Record<string, string> {
  if (!inst) return cells;
  const out = { ...cells };
  for (const [k, v] of Object.entries(installationCbamCells(inst, year))) {
    if ((out[k] ?? "").trim() === "") out[k] = v;
  }
  return out;
}
