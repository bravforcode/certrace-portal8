import { PROCESS_STEPS, type ProcessStep } from "../cbam/boundary";

export type ProcessRow = { id: string; name: string; step: ProcessStep | "other"; route: string; inBoundary: boolean; note: string };
export type SourceKind = "combustion" | "process" | "electricity" | "other";
export type SourceRow = { id: string; name: string; kind: SourceKind; processId: string; fuel: string; tag: string };
export type MeterFrequency = "continuous" | "daily" | "weekly" | "monthly" | "per-delivery" | "annual";
export type MeterRow = { id: string; name: string; measures: string; sourceId: string; owner: string; frequency: MeterFrequency; evidence: string; calibratedUntil: string };
export type ProductionRow = { month: string; product: string; tonnes: number };
export type FactoryProfile = { version: 1; processes: ProcessRow[]; sources: SourceRow[]; meters: MeterRow[]; production: ProductionRow[]; updatedAt: string };
export type FactoryGap = { key: string; group: "processes" | "sources" | "meters" | "production"; message: string; refId?: string };

export const PROFILE_LIMITS = { processes: 50, sources: 200, meters: 200, production: 600, text: 120 };
const KINDS: SourceKind[] = ["combustion", "process", "electricity", "other"];
const FREQUENCIES: MeterFrequency[] = ["continuous", "daily", "weekly", "monthly", "per-delivery", "annual"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const emptyProfile = (): FactoryProfile => ({ version: 1, processes: [], sources: [], meters: [], production: [], updatedAt: "" });
export const factoryKey = (installationId: string) => `certrace:factory:${installationId}`;
const norm = (s: string) => s.trim().toLowerCase();
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

export function validateProfile(data: unknown): { ok: true; data: FactoryProfile } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const d = data as Partial<FactoryProfile> | null;
  if (!isObject(d) || d.version !== 1) return { ok: false, errors: ["version: unsupported factory profile"] };
  const list = (name: keyof typeof PROFILE_LIMITS, v: unknown): Record<string, unknown>[] => {
    if (!Array.isArray(v)) { errors.push(`${name}: must be a list`); return []; }
    if (v.length > PROFILE_LIMITS[name]) errors.push(`${name}: at most ${PROFILE_LIMITS[name]} rows`);
    return v.slice(0, PROFILE_LIMITS[name]).map((row, i) => {
      if (!isObject(row)) { errors.push(`${name}.${i}: must be an object`); return {}; }
      return row;
    });
  };
  const text = (path: string, v: unknown, required = false) => {
    if (typeof v !== "string") return errors.push(`${path}: must be text`);
    if (required && !v.trim()) return errors.push(`${path}: required`);
    if (v.length > PROFILE_LIMITS.text) errors.push(`${path}: at most ${PROFILE_LIMITS.text} characters`);
  };
  const id = (path: string, v: unknown) => {
    if (typeof v !== "string" || !v) errors.push(`${path}.id: missing id`);
  };
  const processes = list("processes", d.processes);
  const sources = list("sources", d.sources);
  const meters = list("meters", d.meters);
  const production = list("production", d.production);
  const processIds = new Set(processes.map((p) => p.id));
  const sourceIds = new Set(sources.map((s) => s.id));
  processes.forEach((p, i) => {
    id(`processes.${i}`, p.id);
    text(`processes.${i}.name`, p.name, true);
    if (p.step !== "other" && !PROCESS_STEPS.includes(p.step as ProcessStep)) errors.push(`processes.${i}.step: unknown process step`);
    text(`processes.${i}.route`, p.route);
    text(`processes.${i}.note`, p.note);
    if (typeof p.inBoundary !== "boolean") errors.push(`processes.${i}.inBoundary: must be yes or no`);
  });
  sources.forEach((s, i) => {
    id(`sources.${i}`, s.id);
    text(`sources.${i}.name`, s.name, true);
    if (!KINDS.includes(s.kind as SourceKind)) errors.push(`sources.${i}.kind: unknown source type`);
    if (typeof s.processId !== "string" || !processIds.has(s.processId)) errors.push(`sources.${i}.processId: pick the process this source belongs to`);
    text(`sources.${i}.fuel`, s.fuel);
    text(`sources.${i}.tag`, s.tag);
  });
  meters.forEach((m, i) => {
    id(`meters.${i}`, m.id);
    text(`meters.${i}.name`, m.name, true);
    text(`meters.${i}.measures`, m.measures);
    if (typeof m.sourceId !== "string" || !sourceIds.has(m.sourceId)) errors.push(`meters.${i}.sourceId: pick the source this meter measures`);
    text(`meters.${i}.owner`, m.owner);
    if (!FREQUENCIES.includes(m.frequency as MeterFrequency)) errors.push(`meters.${i}.frequency: unknown frequency`);
    text(`meters.${i}.evidence`, m.evidence);
    if (m.calibratedUntil !== "" && (typeof m.calibratedUntil !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(m.calibratedUntil)))
      errors.push(`meters.${i}.calibratedUntil: use a date`);
  });
  production.forEach((r, i) => {
    if (typeof r.month !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(r.month)) errors.push(`production.${i}.month: use YYYY-MM`);
    text(`production.${i}.product`, r.product, true);
    if (typeof r.tonnes !== "number" || !Number.isFinite(r.tonnes) || r.tonnes < 0)
      errors.push(`production.${i}.tonnes: must be 0 or more`);
  });
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      version: 1,
      processes: processes as unknown as ProcessRow[],
      sources: sources as unknown as SourceRow[],
      meters: meters as unknown as MeterRow[],
      production: production as unknown as ProductionRow[],
      updatedAt: String(d.updatedAt ?? ""),
    },
  };
}

const missingMonths = (p: FactoryProfile, year: number) =>
  MONTH_NAMES.filter((_, i) => !p.production.some((r) => r.month === `${year}-${String(i + 1).padStart(2, "0")}`));

export function factoryGaps(p: FactoryProfile, year: number, today = new Date().toISOString().slice(0, 10)): FactoryGap[] {
  const gaps: FactoryGap[] = [];
  if (!p.processes.length) gaps.push({ key: "processes:none", group: "processes", message: "Add the processes inside the installation boundary." });
  for (const proc of p.processes.filter((x) => x.inBoundary))
    if (!p.sources.some((s) => s.processId === proc.id))
      gaps.push({ key: `processes:${proc.id}:no-source`, group: "processes", message: `${proc.name} has no emission source.`, refId: proc.id });
  for (const s of p.sources)
    if (!p.meters.some((m) => m.sourceId === s.id))
      gaps.push({ key: `sources:${s.id}:no-meter`, group: "sources", message: `${s.name} has no meter or data source.`, refId: s.id });
  for (const m of p.meters) {
    if (!m.owner.trim()) gaps.push({ key: `meters:${m.id}:owner`, group: "meters", message: `Who reads ${m.name}?`, refId: m.id });
    if (m.calibratedUntil && m.calibratedUntil < today)
      gaps.push({ key: `meters:${m.id}:calibration`, group: "meters", message: `${m.name} calibration expired on ${m.calibratedUntil}.`, refId: m.id });
  }
  const missing = missingMonths(p, year);
  if (missing.length) gaps.push({ key: `production:${year}`, group: "production", message: `Production missing for: ${missing.join(", ")}` });
  return gaps;
}

export function factoryProgress(p: FactoryProfile, year: number) {
  const total = 1 + p.processes.filter((x) => x.inBoundary).length + p.sources.length + 2 * p.meters.length + 12;
  const gaps = factoryGaps(p, year);
  const missed = gaps.filter((g) => g.group !== "production").length + missingMonths(p, year).length;
  const done = total - missed;
  return { done, total, pct: Math.round((done / total) * 100) };
}

export function productionMismatch(p: FactoryProfile, year: number, workbookTonnes: number) {
  const profileT = p.production.filter((r) => r.month.startsWith(`${year}-`)).reduce((a, r) => a + r.tonnes, 0);
  if (!profileT || !workbookTonnes) return null;
  return Math.round((Math.abs(profileT - workbookTonnes) / workbookTonnes) * 1e9) / 1e9;
}

export function processesFromSteps(p: FactoryProfile, names: string[]): FactoryProfile {
  const known = new Set(p.processes.map((x) => norm(x.name)));
  const added: ProcessRow[] = [];
  for (const name of names)
    if (name.trim() && !known.has(norm(name))) {
      known.add(norm(name));
      added.push({ id: crypto.randomUUID(), name: name.trim(), step: "other", route: "", inBoundary: true, note: "" });
    }
  return added.length ? { ...p, processes: [...p.processes, ...added] } : p;
}
