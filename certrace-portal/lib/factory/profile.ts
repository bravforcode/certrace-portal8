import { PROCESS_STEPS, type ProcessStep } from "../cbam/boundary";

export type ProcessRow = {
  id: string;
  name: string;
  step: ProcessStep | "other";
  route: string;
  inBoundary: boolean;
  note: string;
};
export type SourceKind = "combustion" | "process" | "electricity" | "other";
export type SourceRow = {
  id: string;
  name: string;
  kind: SourceKind;
  processId: string;
  fuel: string;
  tag: string;
};
export type MeterFrequency =
  | "continuous"
  | "daily"
  | "weekly"
  | "monthly"
  | "per-delivery"
  | "annual";
export type MeterRow = {
  id: string;
  name: string;
  measures: string;
  sourceId: string;
  owner: string;
  frequency: MeterFrequency;
  evidence: string;
  calibratedUntil: string;
};
export type ProductionRow = {
  id: string;
  month: string;
  product: string;
  tonnes: number;
};
export type FactoryProfile = {
  version: 1;
  processes: ProcessRow[];
  sources: SourceRow[];
  meters: MeterRow[];
  production: ProductionRow[];
  updatedAt: string;
};
export type FactoryGap = {
  key: string;
  group: "processes" | "sources" | "meters" | "production";
  message: string;
  refId?: string;
};

export const PROFILE_LIMITS = {
  processes: 50,
  sources: 200,
  meters: 200,
  production: 600,
  text: 120,
};
const ID_MAX = 64;
const KINDS: SourceKind[] = ["combustion", "process", "electricity", "other"];
const FREQUENCIES: MeterFrequency[] = [
  "continuous",
  "daily",
  "weekly",
  "monthly",
  "per-delivery",
  "annual",
];
// Month abbreviations stay English on purpose: they are the short form a verifier reads, and the
// gap message carries them as a plain list.
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const emptyProfile = (): FactoryProfile => ({
  version: 1,
  processes: [],
  sources: [],
  meters: [],
  production: [],
  updatedAt: "",
});
export const factoryKey = (installationId: string) =>
  `certrace:factory:${installationId}`;
const norm = (s: string) => s.trim().toLowerCase();
const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** A fresh row id. Falls back when crypto.randomUUID is missing (older browsers, some test runners). */
export function newId(
  uuid: (() => string) | null = globalThis.crypto?.randomUUID?.bind(
    globalThis.crypto,
  ) ?? null,
): string {
  if (uuid) {
    try {
      const v = uuid();
      if (v) return v;
    } catch {
      // fall through to the time-and-random id below
    }
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
}

/** Calendar date in the user's local timezone as YYYY-MM-DD. Not toISOString, which is UTC and
    puts a Bangkok morning on the previous day. */
export const localDate = (d: Date = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** True only for a date that exists: 2026-02-31 is rejected by round-tripping through UTC. */
function isRealDate(s: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === mo - 1 &&
    dt.getUTCDate() === d
  );
}

export function validateProfile(
  data: unknown,
): { ok: true; data: FactoryProfile } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const d = data as Partial<FactoryProfile> | null;
  if (!isObject(d) || d.version !== 1)
    return { ok: false, errors: ["version: unsupported factory profile"] };
  const list = (
    name: keyof typeof PROFILE_LIMITS,
    v: unknown,
  ): Record<string, unknown>[] => {
    if (!Array.isArray(v)) {
      errors.push(`${name}: must be a list`);
      return [];
    }
    if (v.length > PROFILE_LIMITS[name])
      errors.push(`${name}: at most ${PROFILE_LIMITS[name]} rows`);
    return v.slice(0, PROFILE_LIMITS[name]).map((row, i) => {
      if (!isObject(row)) {
        errors.push(`${name}.${i}: must be an object`);
        return {};
      }
      return row;
    });
  };
  const text = (path: string, v: unknown, required = false) => {
    if (typeof v !== "string") return errors.push(`${path}: must be text`);
    if (required && !v.trim()) return errors.push(`${path}: required`);
    if (v.length > PROFILE_LIMITS.text)
      errors.push(`${path}: at most ${PROFILE_LIMITS.text} characters`);
  };
  // Ids name rows in the save payload and in gap keys, so they must be short and unique per list.
  const ids = (name: string, rows: Record<string, unknown>[]) => {
    const seen = new Set<string>();
    rows.forEach((r, i) => {
      const v = r.id;
      if (typeof v !== "string" || !v)
        errors.push(`${name}.${i}.id: missing id`);
      else if (v.length > ID_MAX)
        errors.push(`${name}.${i}.id: at most ${ID_MAX} characters`);
      else if (seen.has(v)) errors.push(`${name}.${i}.id: duplicate id`);
      else seen.add(v);
    });
  };
  const processes = list("processes", d.processes);
  const sources = list("sources", d.sources);
  const meters = list("meters", d.meters);
  const production = list("production", d.production);
  ids("processes", processes);
  ids("sources", sources);
  ids("meters", meters);
  ids("production", production);
  const processIds = new Set(processes.map((p) => p.id));
  const sourceIds = new Set(sources.map((s) => s.id));
  processes.forEach((p, i) => {
    text(`processes.${i}.name`, p.name, true);
    if (p.step !== "other" && !PROCESS_STEPS.includes(p.step as ProcessStep))
      errors.push(`processes.${i}.step: unknown process step`);
    text(`processes.${i}.route`, p.route);
    text(`processes.${i}.note`, p.note);
    if (typeof p.inBoundary !== "boolean")
      errors.push(`processes.${i}.inBoundary: must be yes or no`);
  });
  sources.forEach((s, i) => {
    text(`sources.${i}.name`, s.name, true);
    if (!KINDS.includes(s.kind as SourceKind))
      errors.push(`sources.${i}.kind: unknown source type`);
    if (typeof s.processId !== "string" || !processIds.has(s.processId))
      errors.push(
        `sources.${i}.processId: pick the process this source belongs to`,
      );
    text(`sources.${i}.fuel`, s.fuel);
    text(`sources.${i}.tag`, s.tag);
  });
  meters.forEach((m, i) => {
    text(`meters.${i}.name`, m.name, true);
    text(`meters.${i}.measures`, m.measures);
    if (typeof m.sourceId !== "string" || !sourceIds.has(m.sourceId))
      errors.push(`meters.${i}.sourceId: pick the source this meter measures`);
    text(`meters.${i}.owner`, m.owner);
    if (!FREQUENCIES.includes(m.frequency as MeterFrequency))
      errors.push(`meters.${i}.frequency: unknown frequency`);
    text(`meters.${i}.evidence`, m.evidence);
    if (m.calibratedUntil !== "") {
      if (
        typeof m.calibratedUntil !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(m.calibratedUntil)
      )
        errors.push(`meters.${i}.calibratedUntil: use a date`);
      else if (!isRealDate(m.calibratedUntil))
        errors.push(`meters.${i}.calibratedUntil: use a real date`);
    }
  });
  const months = new Set<string>();
  production.forEach((r, i) => {
    if (typeof r.month !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(r.month))
      errors.push(`production.${i}.month: use YYYY-MM`);
    else if (months.has(r.month))
      errors.push(`production.${i}.month: this month is already listed`);
    else months.add(r.month);
    text(`production.${i}.product`, r.product, true);
    if (
      typeof r.tonnes !== "number" ||
      !Number.isFinite(r.tonnes) ||
      r.tonnes < 0
    )
      errors.push(`production.${i}.tonnes: must be 0 or more`);
  });
  if (errors.length) return { ok: false, errors };
  // Rebuild every row from the fields it is allowed to have, so unknown keys never reach storage.
  return {
    ok: true,
    data: {
      version: 1,
      processes: processes.map((p) => ({
        id: p.id as string,
        name: p.name as string,
        step: p.step as ProcessRow["step"],
        route: p.route as string,
        inBoundary: p.inBoundary as boolean,
        note: p.note as string,
      })),
      sources: sources.map((s) => ({
        id: s.id as string,
        name: s.name as string,
        kind: s.kind as SourceKind,
        processId: s.processId as string,
        fuel: s.fuel as string,
        tag: s.tag as string,
      })),
      meters: meters.map((m) => ({
        id: m.id as string,
        name: m.name as string,
        measures: m.measures as string,
        sourceId: m.sourceId as string,
        owner: m.owner as string,
        frequency: m.frequency as MeterFrequency,
        evidence: m.evidence as string,
        calibratedUntil: m.calibratedUntil as string,
      })),
      production: production.map((r) => ({
        id: r.id as string,
        month: r.month as string,
        product: r.product as string,
        tonnes: r.tonnes as number,
      })),
      updatedAt: String(d.updatedAt ?? ""),
    },
  };
}

const missingMonths = (p: FactoryProfile, year: number) =>
  MONTH_NAMES.filter(
    (_, i) =>
      !p.production.some(
        (r) => r.month === `${year}-${String(i + 1).padStart(2, "0")}`,
      ),
  );

/** The first month of `year` that has no production row yet, as YYYY-MM, or null when all twelve exist. */
/** Blank production rows for each month of the year not yet listed. The product is left for the user. */
export function monthRowsToAdd(
  p: FactoryProfile,
  year: number,
): ProductionRow[] {
  const have = new Set(p.production.map((r) => r.month));
  return Array.from(
    { length: 12 },
    (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`,
  )
    .filter((m) => !have.has(m))
    .map((month) => ({ id: newId(), month, product: "", tonnes: 0 }));
}

/** Drops the errors for one field, so a corrected field stops showing its old message. */
export function clearFieldError(errors: string[], path: string): string[] {
  return errors.filter((e) => !e.startsWith(`${path}:`));
}

export function nextMissingMonth(
  p: FactoryProfile,
  year: number,
): string | null {
  for (let i = 0; i < 12; i++) {
    const m = `${year}-${String(i + 1).padStart(2, "0")}`;
    if (!p.production.some((r) => r.month === m)) return m;
  }
  return null;
}

export function factoryGaps(
  p: FactoryProfile,
  year: number,
  today = localDate(),
): FactoryGap[] {
  const gaps: FactoryGap[] = [];
  if (!p.processes.length)
    gaps.push({
      key: "processes:none",
      group: "processes",
      message: "Add the processes inside the installation boundary.",
    });
  for (const proc of p.processes.filter((x) => x.inBoundary))
    if (!p.sources.some((s) => s.processId === proc.id))
      gaps.push({
        key: `processes:${proc.id}:no-source`,
        group: "processes",
        message: `${proc.name} has no emission source.`,
        refId: proc.id,
      });
  for (const s of p.sources)
    if (!p.meters.some((m) => m.sourceId === s.id))
      gaps.push({
        key: `sources:${s.id}:no-meter`,
        group: "sources",
        message: `${s.name} has no meter or data source.`,
        refId: s.id,
      });
  for (const m of p.meters) {
    if (!m.owner.trim())
      gaps.push({
        key: `meters:${m.id}:owner`,
        group: "meters",
        message: `Who reads ${m.name}?`,
        refId: m.id,
      });
    if (m.calibratedUntil && m.calibratedUntil < today)
      gaps.push({
        key: `meters:${m.id}:calibration`,
        group: "meters",
        message: `${m.name} calibration expired on ${m.calibratedUntil}.`,
        refId: m.id,
      });
  }
  const missing = missingMonths(p, year);
  if (missing.length)
    gaps.push({
      key: `production:${year}`,
      group: "production",
      message: `Production missing for: ${missing.join(", ")}`,
    });
  return gaps;
}

export function factoryProgress(p: FactoryProfile, year: number) {
  const total =
    1 +
    p.processes.filter((x) => x.inBoundary).length +
    p.sources.length +
    2 * p.meters.length +
    12;
  const gaps = factoryGaps(p, year);
  const missed =
    gaps.filter((g) => g.group !== "production").length +
    missingMonths(p, year).length;
  const done = total - missed;
  return { done, total, pct: Math.round((done / total) * 100) };
}

export function productionMismatch(
  p: FactoryProfile,
  year: number,
  workbookTonnes: number,
) {
  const profileT = p.production
    .filter((r) => r.month.startsWith(`${year}-`))
    .reduce((a, r) => a + r.tonnes, 0);
  if (!profileT || !workbookTonnes) return null;
  return (
    Math.round((Math.abs(profileT - workbookTonnes) / workbookTonnes) * 1e9) /
    1e9
  );
}

/** Adds one process per new workbook step name. Stops at the process limit and reports how many
    names it could not add, so the caller can say so. */
export function processesFromSteps(
  p: FactoryProfile,
  names: string[],
): { profile: FactoryProfile; added: number; skipped: number } {
  const known = new Set(p.processes.map((x) => norm(x.name)));
  const room = Math.max(0, PROFILE_LIMITS.processes - p.processes.length);
  const added: ProcessRow[] = [];
  let skipped = 0;
  for (const raw of names) {
    const name = raw.trim().slice(0, PROFILE_LIMITS.text);
    if (!name || known.has(norm(name))) continue;
    known.add(norm(name));
    if (added.length >= room) {
      skipped++;
      continue;
    }
    added.push({
      id: newId(),
      name,
      step: "other",
      route: "",
      inBoundary: true,
      note: "",
    });
  }
  return {
    profile: added.length ? { ...p, processes: [...p.processes, ...added] } : p,
    added: added.length,
    skipped,
  };
}
