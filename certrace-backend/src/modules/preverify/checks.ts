import catalogue from "../links/cbam-item-fields.json";

export type Finding = { severity: "error" | "warn"; field?: string; message: string };
export type CatalogueField = { key: string; label: string; section: string; cell: string; kind: string };
export type Status = "ai_flagged" | "team_review";

export const FIELDS = catalogue.fields as CatalogueField[];

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SHARE = /share|percent|%/i;
const PROCESS_SECTION = /^Production process \d+$/;

const named = (f: CatalogueField) => `${f.section} · ${f.label}`;
const isDate = (v: string) => DATE.test(v) && Number.isFinite(Date.parse(v));

/** Deterministic checks on the catalogue fields. Pure: the caller passes the workbook cells. */
export function runChecks(cells: Record<string, string>, fields: CatalogueField[] = FIELDS): Finding[] {
  const findings: Finding[] = [];
  const value = (f: CatalogueField) => (cells[f.cell] ?? "").trim();
  const find = (section: string, label: string) =>
    fields.find((f) => f.section === section && f.label === label);

  for (const f of fields) {
    const v = value(f);
    if (!v) continue;
    if (f.kind === "date") {
      if (!isDate(v))
        findings.push({ severity: "error", field: f.key, message: `${named(f)} must be a date (YYYY-MM-DD).` });
      continue;
    }
    if (f.kind !== "number") continue;
    const n = Number(v);
    if (!Number.isFinite(n)) {
      findings.push({ severity: "error", field: f.key, message: `${named(f)} must be a number.` });
    } else if (n < 0) {
      findings.push({ severity: "error", field: f.key, message: `${named(f)} must be 0 or more.` });
    } else if (SHARE.test(f.label) && n > 100) {
      findings.push({ severity: "error", field: f.key, message: `${named(f)} must be between 0 and 100.` });
    }
  }

  // A reporting period that starts on or after its end is a data entry error, so it is flagged.
  const start = find("Reporting period", "Reporting period start");
  const end = find("Reporting period", "Reporting period end");
  if (start && end) {
    const s = value(start);
    const e = value(end);
    if (isDate(s) && isDate(e) && Date.parse(s) >= Date.parse(e))
      findings.push({
        severity: "error",
        field: end.key,
        message: `${named(start)} must be before ${named(end)}.`,
      });
  }

  // A process with other answers but no name is likely a half-finished block.
  const processes = new Map<string, CatalogueField[]>();
  for (const f of fields)
    if (PROCESS_SECTION.test(f.section)) processes.set(f.section, [...(processes.get(f.section) ?? []), f]);
  for (const [section, list] of processes) {
    const name = list.find((f) => f.label === "Name");
    if (!name || value(name)) continue;
    if (list.some((f) => f !== name && value(f)))
      findings.push({
        severity: "warn",
        field: name.key,
        message: `${named(name)} is empty but other fields in ${section} are filled.`,
      });
  }

  return findings;
}

/** Any error from either the deterministic checks or the AI review blocks the team review. */
export function decideStatus(findings: Finding[]): Status {
  return findings.some((f) => f.severity === "error") ? "ai_flagged" : "team_review";
}
