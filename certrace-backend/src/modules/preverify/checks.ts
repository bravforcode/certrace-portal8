import catalogue from "../links/cbam-item-fields.json";

export type Finding = {
  severity: "error" | "warn";
  field?: string;
  message: string;
};
export type CatalogueField = {
  key: string;
  label: string;
  section: string;
  cell: string;
  kind: string;
};
export type Status = "ai_flagged" | "team_review";

export const FIELDS = catalogue.fields as CatalogueField[];
const CELLS = new Set(FIELDS.map((f) => f.cell));

const PROCESS_SECTION = /^Production process \d+$/;

const named = (f: CatalogueField) => `${f.section} · ${f.label}`;
// Round-trip so impossible dates such as 2026-02-30 fail; Date rolls them over silently.
const isDate = (v: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  !Number.isNaN(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v;

/** Keeps only real catalogue cells with text values. Stale or foreign keys never reach the checks, the AI or the empty test. */
export function catalogueCells(raw: unknown): Record<string, string> {
  return Object.fromEntries(
    Object.entries((raw ?? {}) as Record<string, unknown>).filter(
      (entry): entry is [string, string] =>
        CELLS.has(entry[0]) && typeof entry[1] === "string",
    ),
  );
}

/** Deterministic checks on the catalogue fields. Pure: the caller passes catalogue cells. */
export function runChecks(cells: Record<string, string>): Finding[] {
  const findings: Finding[] = [];
  const value = (f: CatalogueField) => (cells[f.cell] ?? "").trim();
  const find = (section: string, label: string) =>
    FIELDS.find((f) => f.section === section && f.label === label);

  for (const f of FIELDS) {
    const v = value(f);
    if (!v) continue;
    if (f.kind === "date") {
      if (!isDate(v))
        findings.push({
          severity: "error",
          field: f.key,
          message: `${named(f)} must be a date (YYYY-MM-DD).`,
        });
      continue;
    }
    if (f.kind !== "number") continue;
    const n = Number(v);
    if (!Number.isFinite(n)) {
      findings.push({
        severity: "error",
        field: f.key,
        message: `${named(f)} must be a number.`,
      });
    } else if (n < 0) {
      findings.push({
        severity: "error",
        field: f.key,
        message: `${named(f)} must be 0 or more.`,
      });
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
  for (const f of FIELDS)
    if (PROCESS_SECTION.test(f.section))
      processes.set(f.section, [...(processes.get(f.section) ?? []), f]);
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
  return findings.some((f) => f.severity === "error")
    ? "ai_flagged"
    : "team_review";
}

/** Pre-verifications a company gets before it has to top up on the billing page. */
export const PREVERIFY_QUOTA = 3;

/** Uses spent: every submission that reached the Certrace team. One the AI sent back costs nothing.
    A superseded row no longer says where it went, so its stored findings decide it as submit() did. */
export function quotaUsed(
  rows: { status: string; ai_findings: unknown }[],
): number {
  return rows.filter((r) =>
    r.status === "superseded"
      ? decideStatus((r.ai_findings ?? []) as Finding[]) === "team_review"
      : r.status !== "ai_flagged",
  ).length;
}
