import schedule from "./data/eu-precursor-defaults-2026.json";
import { getCountry, isEuOrExempt } from "./config";

type Values = [number | null, number | null, number];
type Table = Record<string, Values>;
const data = schedule as unknown as {
  edition: string;
  source: string;
  legal: string;
  correction: string;
  countries: Record<string, Table>;
  unknownOrigin: Table;
};

const SHEET_ALIASES: Record<string, string> = {
  BN: "Brunei",
  CD: "Congo, Democratic Republic of",
  CI: "Ivory Coast",
  IR: "Iran, Islamic Republic of",
  KR: "Korea, Republic of (South Korea",
  LA: "Laos",
  MD: "Moldova, Republic of",
  KP: "North Korea (Democratic People’",
  TZ: "Tanzania, United Republic of",
  NC: "New Caledonia and dependencies",
};

export type EuPrecursorDefault = {
  id: string;
  cnCode: string;
  country: string;
  year: number;
  sheet: string;
  codeRow: string;
  direct: number | null;
  indirect: number | null;
  total: number;
  reference: string;
  legalUrl: string;
  workbookUrl: string;
  edition: string;
  usedOtherCountries: boolean;
};

function sheetForCountry(country: string): string | null {
  if (country === "ZZ") return null;
  const name = SHEET_ALIASES[country] ?? getCountry(country)?.name;
  if (!name) return null;
  if (data.countries[name]) return name;
  const truncated = Object.keys(data.countries).find(
    (sheet) => sheet.startsWith(name.slice(0, 31)) || name.startsWith(sheet),
  );
  return truncated ?? null;
}

function matchRow(table: Table, code: string): [string, Values] | null {
  if (table[code]) return [code, table[code]];
  // A CN8 can resolve a TARIC10 group only if every subcode has the same
  // published value. Otherwise the user needs a more specific code.
  if (code.length === 8) {
    const subcodes = Object.entries(table).filter(
      ([key]) => key.length === 10 && key.startsWith(code),
    );
    if (
      subcodes.length &&
      new Set(subcodes.map(([, values]) => JSON.stringify(values))).size === 1
    )
      return subcodes[0];
  }
  for (const length of [6, 4]) {
    const prefix = code.slice(0, length);
    if (table[prefix]) return [prefix, table[prefix]];
  }
  return null;
}

/** Annex I total-emissions value for a precursor, with Annex IV for unknown
    origin. Returns null rather than guessing when the code is ambiguous. */
export function resolveEuPrecursorDefault(
  cnCode: string,
  country: string,
  year: number,
): EuPrecursorDefault | null {
  const code = cnCode.replace(/\s/g, "");
  // This pinned schedule is reviewed for the 2026 input flow. A later
  // reporting year must wait for a refreshed legal schedule.
  if (
    !/^\d{8}$/.test(code) ||
    !country ||
    year !== 2026 ||
    isEuOrExempt(country)
  )
    return null;

  const sheet = sheetForCountry(country);
  const fromUnknown = country === "ZZ";
  if (!fromUnknown && !getCountry(country)) return null;
  let origin = fromUnknown ? "Annex IV" : (sheet ?? "OTHER");
  let row = matchRow(
    fromUnknown
      ? data.unknownOrigin
      : (data.countries[origin] ?? data.countries.OTHER),
    code,
  );
  if (!row && !fromUnknown) {
    origin = "OTHER";
    row = matchRow(data.countries.OTHER, code);
  }
  if (!row) return null;

  const [codeRow, [direct, indirect, total]] = row;
  const reference = `EU 2025/2621 ${fromUnknown ? "Annex IV" : "Annex I"}, corrected by EU 2026/1740 · ${origin} · ${codeRow} · ${data.edition}`;
  return {
    id: `${data.edition}|${country}|${code}|${origin}|${codeRow}`,
    cnCode: code,
    country,
    year,
    sheet: origin,
    codeRow,
    direct,
    indirect,
    total,
    reference,
    legalUrl: data.legal,
    workbookUrl: data.source,
    edition: data.edition,
    usedOtherCountries: origin === "OTHER",
  };
}
