/* The TGO emission factor lists as an EF reference pick list. A picked reference reads
   "TGO EF 2569 #12 Name [unit]", so the cell keeps which list, which row and the unit it is per,
   and the factor itself can be filled from the list instead of typed. */

import { TGO_EF_2565, TGO_EF_2569, type TgoEfRow } from "./tgo-ef-data";

const LISTS: [version: string, rows: readonly TgoEfRow[]][] = [
  ["2569", TGO_EF_2569],
  ["2565", TGO_EF_2565],
];

const label = (version: string, [no, name, unit]: TgoEfRow) =>
  `TGO EF ${version} #${no} ${name} [${unit}]`;

/** Every row of both lists, the list in force (2569) first. */
export const TGO_EF_OPTIONS: string[] = LISTS.flatMap(([v, rows]) =>
  rows.map((r) => label(v, r)),
);

export type TgoEf = {
  version: string;
  no: number;
  name: string;
  unit: string;
  ef: number;
};

/** The list row a reference names, or null when it is not a TGO EF reference. */
export function tgoEf(ref: string): TgoEf | null {
  const m = /^TGO EF (\d{4}) #(\d+) /.exec(ref.trim());
  if (!m) return null;
  const rows = LISTS.find(([v]) => v === m[1])?.[1];
  const row = rows?.[Number(m[2]) - 1];
  if (!row || row[0] !== Number(m[2]) || label(m[1]!, row) !== ref.trim())
    return null;
  const [no, name, unit, ef] = row;
  return { version: m[1]!, no, name, unit, ef };
}

/** The cells a picked reference fills on a CFP row: the factor, into the factor column whose unit it is
    per (a generic "/unit" column takes any), and the EF source where the sheet has one. Nothing is
    filled when no factor column matches, so a factor never lands under another dimension.
    Only cells still empty are filled by the caller. */
export function efFill(
  cols: { key: string; label: string }[],
  ref: string,
): Record<string, string> {
  const e = tgoEf(ref);
  if (!e) return {};
  const per = (label: string) => /kgCO2e\/([^)]*)\)/.exec(label)?.[1];
  const target = ["ef_tkm", "ef_km", "ef"]
    .map((k) => cols.find((c) => c.key === k))
    .find((c) => c && (per(c.label) === e.unit || per(c.label) === "unit"));
  if (!target) return {};
  const out: Record<string, string> = { [target.key]: String(e.ef) };
  if (cols.some((c) => c.key === "ef_source")) out.ef_source = "TGO EF";
  return out;
}
