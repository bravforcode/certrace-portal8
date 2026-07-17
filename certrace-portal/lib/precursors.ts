import {
  REGULATORY_DATA_VERSION,
  decimal,
  decimalToString,
  defaultMarkupForDate,
  MrvValidationError,
} from "./mrv";

export type PrecursorRow = {
  name: string;
  cn: string;
  /** Entered precursor quantity per tonne of output. */
  qty: string;
  qtyUnit: "TNE_PER_TNE" | "KGM_PER_TNE";
  /** Entered specific embedded emissions of the precursor. */
  see: string;
  seeUnit: "TCO2E_PER_TNE";
  route: string;
  method: "actual" | "default";
  /** Published 2025/2621 year columns already include their markup. */
  defaultValueBasis: "published_includes_markup" | "unmarked_base";
  verificationReference: string;
  regulatoryDataVersion: string;
};

export const emptyPrecursorRow = (): PrecursorRow => ({
  name: "",
  cn: "",
  qty: "",
  qtyUnit: "TNE_PER_TNE",
  see: "",
  seeUnit: "TCO2E_PER_TNE",
  route: "",
  method: "actual",
  defaultValueBasis: "published_includes_markup",
  verificationReference: "",
  regulatoryDataVersion: REGULATORY_DATA_VERSION,
});

function precursorUnit(value: unknown): PrecursorRow["qtyUnit"] {
  return value === "KGM_PER_TNE" ? "KGM_PER_TNE" : "TNE_PER_TNE";
}

/** Parse structured rows. Free text and malformed JSON remain uncalculable. */
export function parsePrecursors(raw: string | undefined | null): PrecursorRow[] | null {
  if (!raw || !raw.trim().startsWith("[")) return null;
  try {
    const rows: unknown = JSON.parse(raw);
    if (!Array.isArray(rows)) return null;
    return rows.map((candidate) => {
      const row = candidate as Record<string, unknown>;
      return {
        name: String(row.name ?? ""),
        cn: String(row.cn ?? ""),
        qty: String(row.qty ?? ""),
        qtyUnit: precursorUnit(row.qtyUnit),
        see: String(row.see ?? ""),
        seeUnit: "TCO2E_PER_TNE" as const,
        route: String(row.route ?? ""),
        method: row.method === "default" ? "default" as const : "actual" as const,
        defaultValueBasis: row.defaultValueBasis === "unmarked_base"
          ? "unmarked_base" as const
          : "published_includes_markup" as const,
        verificationReference: String(row.verificationReference ?? ""),
        regulatoryDataVersion: String(row.regulatoryDataVersion ?? REGULATORY_DATA_VERSION),
      };
    });
  } catch {
    return null;
  }
}

export const serializePrecursors = (rows: PrecursorRow[]): string => JSON.stringify(rows);

export function rowComplete(row: PrecursorRow): boolean {
  if (!row.name.trim() || !/^\d{8}$/.test(row.cn.replace(/\s/g, ""))) return false;
  try {
    return decimal(row.qty).isPositive() && decimal(row.see).isPositive();
  } catch {
    return false;
  }
}

function reportingDate(period: string | undefined): string {
  const year = /(20\d\d)/.exec(period ?? "")?.[1];
  if (!year) {
    throw new MrvValidationError(
      "REPORTING_YEAR_REQUIRED",
      "A reporting year is required before applying an unmarked default-value markup",
    );
  }
  return `${year}-12-31`;
}

/** Exact mixed actual/default precursor contribution in TCO2E_PER_TNE. */
export function precursorContributionExact(
  raw: string | undefined | null,
  reportingPeriod?: string,
): string {
  const rows = parsePrecursors(raw);
  if (!rows) {
    if (raw?.trim()) {
      throw new MrvValidationError(
        "STRUCTURED_PRECURSORS_REQUIRED",
        "Precursor data must use the versioned structured-row format before it can be calculated",
      );
    }
    return "0";
  }

  let total = decimal("0");
  for (const row of rows.filter(rowComplete)) {
    const ratio = row.qtyUnit === "KGM_PER_TNE"
      ? decimal(row.qty).times("0.001")
      : decimal(row.qty);
    let specificEmissions = decimal(row.see);

    if (row.method === "default" && row.defaultValueBasis === "unmarked_base") {
      const markup = defaultMarkupForDate(reportingDate(reportingPeriod));
      specificEmissions = specificEmissions.times(decimal("1").plus(markup.markupFraction));
    }
    total = total.plus(ratio.times(specificEmissions));
  }
  return decimalToString(total);
}

export function formatPrecursors(raw: string | undefined | null): string {
  const rows = parsePrecursors(raw);
  if (!rows) return raw ?? "";
  return rows
    .filter((row) => row.name.trim())
    .map((row) => {
      const quantityUnit = row.qtyUnit === "KGM_PER_TNE" ? "kg/t" : "t/t";
      const method = row.method === "default"
        ? `default (${row.defaultValueBasis === "unmarked_base" ? "effective markup applied" : "published value includes markup"})`
        : "actual (requires accredited verification)";
      return `${row.name}${row.cn.trim() ? ` (CN ${row.cn})` : ""} — ${row.qty || "?"} ${quantityUnit} × ${row.see || "?"} tCO₂e/t · ${method}${row.route.trim() ? ` · ${row.route}` : ""}`;
    })
    .join("\n");
}
