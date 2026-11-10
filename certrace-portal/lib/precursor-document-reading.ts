import type { DocumentPage } from "./document-reading";

export type PrecursorSuggestion = {
  field:
    | "cnCode"
    | "specificEmbeddedDirectTco2PerT"
    | "specificEmbeddedIndirectTco2PerT"
    | "seeTco2ePerT"
    | "reportingPeriodStart"
    | "reportingPeriodEnd";
  value: string;
  page: number;
  excerpt: string;
};

/** Only accept explicitly labelled values with a matching unit. A verifier
    report may contain many unrelated emissions numbers and dates; ambiguous
    matches are deliberately left for manual entry. */
export function readPrecursorReportPages(
  pages: DocumentPage[],
): PrecursorSuggestion[] {
  const candidates: PrecursorSuggestion[] = [];
  const add = (
    field: PrecursorSuggestion["field"],
    value: string,
    page: number,
    excerpt: string,
  ) =>
    candidates.push({
      field,
      value,
      page,
      excerpt: excerpt.trim().slice(0, 180),
    });

  for (const page of pages) {
    const normalized = page.text
      .replaceAll("₂", "2")
      .replaceAll("ₑ", "e")
      .replaceAll("⁄", "/");
    for (const line of normalized.split(/\n/)) {
      const cn = /\bCN\s*(?:code)?\s*[:#-]?\s*((?:\d\s*){8})(?!\d)/i.exec(line);
      if (cn) add("cnCode", cn[1].replace(/\s/g, ""), page.page, line);
      for (const [field, kind] of [
        ["specificEmbeddedDirectTco2PerT", "direct"],
        ["specificEmbeddedIndirectTco2PerT", "indirect"],
      ] as const) {
        const match = new RegExp(
          `(?:specific\\s+(?:embedded\\s+)?)?\\b${kind}\\s+(?:embedded\\s+)?emissions?\\s*[:=]?\\s*([0-9]+(?:\\.[0-9]+)?)\\s*t\\s*CO2(?:e|eq)?\\s*\\/\\s*t(?:onne)?\\b`,
          "i",
        ).exec(line);
        if (match) add(field, match[1], page.page, line);
      }
      const total =
        /\b(?:total\s+specific\s+embedded\s+emissions?|specific\s+embedded\s+(?:total\s+emissions?|emissions?\s+total))\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)\s*t\s*CO2(?:e|eq)?\s*\/\s*t(?:onne)?\b/i.exec(
          line,
        );
      if (total) add("seeTco2ePerT", total[1], page.page, line);
      const period =
        /\b(?:precursor\s+)?reporting\s+period\s*[:=-]?\s*(20\d{2}-\d{2}-\d{2})\s*(?:to|through|–|—|-)\s*(20\d{2}-\d{2}-\d{2})/i.exec(
          line,
        );
      if (period) {
        add("reportingPeriodStart", period[1], page.page, line);
        add("reportingPeriodEnd", period[2], page.page, line);
      }
    }
  }

  const fields = [...new Set(candidates.map((candidate) => candidate.field))];
  // The stored total is derived from a direct/indirect split. Do not offer
  // a second total button that could disagree with that split.
  const offered = fields.some(
    (field) =>
      field === "specificEmbeddedDirectTco2PerT" ||
      field === "specificEmbeddedIndirectTco2PerT",
  )
    ? fields.filter((field) => field !== "seeTco2ePerT")
    : fields;
  return offered.flatMap((field) => {
    const matches = candidates.filter((candidate) => candidate.field === field);
    return new Set(matches.map((candidate) => candidate.value)).size === 1
      ? [matches[0]]
      : [];
  });
}
