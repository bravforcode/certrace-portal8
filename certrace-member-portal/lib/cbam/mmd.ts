/* ════════════════════════════════════════════════════════════
   MONITORING METHODOLOGY DOCUMENTATION (gap G5)

   The MMD is the document a verifier asks for FIRST — before they look at a
   single number. It answers "how do you know?": what the installation is,
   where the boundary runs, which parameters are monitored, with what
   instruments, at what frequency, from which sources, and what you did about
   the months where the meter was broken.

   Without one there is nothing to verify against, and most first-time
   engagements stall exactly here. Which is why nothing in this module asks
   the exporter to write an MMD: every section is GENERATED from data the
   portal already holds — the installation profile, the boundary checklist,
   the activity dataset's own provenance records, the gap register — and the
   exporter's job is to read it, correct it, and confirm.

   Versioning is not filing hygiene. "Consistency — same method year over
   year" is one of the seven verifier assertions (spec §2), and the way you
   demonstrate it is a diff against last year's version. So every finalised
   MMD keeps its id, timestamp, author and full content, and `diffVersions`
   produces the change list a verifier reads instead of re-reading the whole
   document.
   ════════════════════════════════════════════════════════════ */

import { PROCESS_STEP_LABEL, displayDate, displayPeriod, type Boundary, type ReportingPeriod } from "./boundary";
import { PROVENANCE_LABEL, isAssumption, provenanceRefs, type ActivityDataset } from "./activity";
import { FUEL_LABEL, ELECTRICITY_FACTOR_LABEL } from "./activity";
import { ESTIMATION_METHOD_LABEL, type GapEntry } from "./data-gaps";
import { FUEL_UNIT_LABEL, needsNcv, ncvUnitLabel } from "./units";

/* ── Quality assurance ──────────────────────────────────────────
   EXACTLY these four options. A free-text QA field invites "we are careful",
   which tells a verifier nothing; a closed list forces a claim that can be
   tested. "Internal audits" is the one place in this product where the word
   audit is correct — it is the name of a specific QA practice, not our
   framing of the verification process. */
export type QualityAssurance = "third_party_verification" | "internal_audits" | "four_eyes" | "none";

export const QUALITY_ASSURANCE_OPTIONS: QualityAssurance[] = ["third_party_verification", "internal_audits", "four_eyes", "none"];

export const QUALITY_ASSURANCE_LABEL: Record<QualityAssurance, string> = {
  third_party_verification: "Third-party verification",
  internal_audits: "Internal audits",
  four_eyes: "Four eyes principle",
  none: "None",
};

/* ── Measurement methods ────────────────────────────────────────
   One row per monitored parameter. Generated from the activity dataset, then
   completed by the exporter — the portal knows WHAT is monitored and where
   the figure came from, but not which instrument or when it was last
   calibrated, and inventing either would be worse than leaving it blank. */
export type MeasurementRow = {
  /** stable key, matches the ProvenanceRef it was generated from */
  key: string;
  parameter: string;
  /** what the figure came from, from the entry's provenance */
  source: string;
  instrument: string;
  frequency: string;
  /** ISO date of last calibration */
  calibrationDate: string;
};

export type MmdSection =
  | "identity"
  | "boundary"
  | "period"
  | "parameters"
  | "measurement"
  | "factors"
  | "gaps"
  | "qa"
  | "assumptions"
  | "diagram";

export const MMD_SECTIONS: MmdSection[] = [
  "identity",
  "boundary",
  "period",
  "parameters",
  "measurement",
  "factors",
  "gaps",
  "qa",
  "assumptions",
  "diagram",
];

export const MMD_SECTION_TITLE: Record<MmdSection, string> = {
  identity: "1 · Installation identity",
  boundary: "2 · Boundary — production process",
  period: "3 · Reporting period",
  parameters: "4 · Parameters monitored",
  measurement: "5 · Measurement methods per parameter",
  factors: "6 · Calculation factors and their sources",
  gaps: "7 · Data gaps and estimation methods",
  qa: "8 · Information on quality assurance",
  assumptions: "9 · Assumptions register",
  diagram: "10 · Installation diagram",
};

export const MMD_SECTION_BLURB: Record<MmdSection, string> = {
  identity: "Who produced the goods, and where. Pulled from the installation profile.",
  boundary: "Which production steps are inside the boundary and which are explicitly outside. The boundary is the process, not the site.",
  period: "The window every figure in the dossier belongs to.",
  parameters: "Everything monitored, derived from what you entered as activity data.",
  measurement: "How each parameter is measured — the instrument, how often, and when it was last calibrated.",
  factors: "Every emission factor and calorific value, with the source behind it.",
  gaps: "Where primary data was missing, how it was estimated, and why the estimate cannot flatter you.",
  qa: "What stops an error reaching the filing.",
  assumptions: "Every input declared as an assumption. A verifier reads this list first and tests it hardest.",
  diagram: "A process flow showing the boundary. Almost always the fastest way to answer the completeness question.",
};

/* ── The document ───────────────────────────────────────────────
   Generated content and exporter edits are held separately: `generated` is
   always re-derivable from the portal's data, `overrides` is what a human
   changed. That split is what makes "regenerate without losing my edits"
   possible, and it keeps the provenance of the document itself honest. */
export type MmdContent = {
  identity: { installationName: string; operator: string; country: string; address: string; unlocode: string; coordinates: string };
  boundary: { description: string; included: string[]; excluded: string[]; undecided: string[] };
  period: { start: string; end: string; type: ReportingPeriod["type"]; display: string };
  parameters: { name: string; unit: string; source: string }[];
  measurement: MeasurementRow[];
  factors: { parameter: string; value: string; unit: string; source: string; isAssumption: boolean }[];
  gaps: { parameter: string; window: string; reason: string; method: string; justification: string; estimatedTCO2e: number }[];
  qa: { method: QualityAssurance; note: string };
  assumptions: { input: string; reference: string; enteredBy: string }[];
  diagram: { fileId: string | null; fileName: string | null };
};

export type MmdVersion = {
  id: string;
  declarationId: string;
  /** 1-based, increments on each finalise */
  n: number;
  finalisedAt: number;
  author: string;
  content: MmdContent;
};

export type MmdDraft = {
  declarationId: string;
  /** exporter edits, applied over the generated content */
  overrides: Partial<MmdContent>;
  qa: { method: QualityAssurance; note: string };
  measurement: Record<string, Pick<MeasurementRow, "instrument" | "frequency" | "calibrationDate">>;
  /** sections the exporter has read and confirmed this cycle */
  confirmed: MmdSection[];
  updatedAt: number;
};

/* ── Generation ─────────────────────────────────────────────────
   Pure: same inputs, same document. No storage access inside here. */

export type MmdInputs = {
  declarationId: string;
  installation: MmdContent["identity"];
  boundary: Boundary;
  period: ReportingPeriod;
  dataset: ActivityDataset;
  gaps: GapEntry[];
  draft: Pick<MmdDraft, "qa" | "measurement" | "overrides">;
};

export function generateMmd(input: MmdInputs): MmdContent {
  const { dataset, boundary, period, gaps, draft } = input;

  const decided = new Set([...boundary.included, ...boundary.excluded]);
  const undecided = (Object.keys(PROCESS_STEP_LABEL) as (keyof typeof PROCESS_STEP_LABEL)[]).filter((s) => !decided.has(s));

  /* Parameters: exactly what was entered, named the way the exporter will
     recognise it on their own meter list. */
  const parameters: MmdContent["parameters"] = [
    { name: "Annual production quantity", unit: "t", source: PROVENANCE_LABEL[dataset.annualProductionProvenance.source] },
    ...dataset.fuels.map((f) => ({
      name: `${FUEL_LABEL[f.fuel]} consumption`,
      unit: FUEL_UNIT_LABEL[f.unit],
      source: PROVENANCE_LABEL[f.provenance.source],
    })),
    ...dataset.electricity.map(() => ({ name: "Electricity consumption", unit: "MWh (period total)", source: "Utility metering" })),
    ...dataset.processEmissions.map((p) => ({
      name: `${p.material || "Process material"} consumption`,
      unit: "t",
      source: PROVENANCE_LABEL[p.provenance.source],
    })),
  ];

  /* Measurement rows are generated as a skeleton and completed by the
     exporter — the instrument and calibration date are facts only they hold. */
  const measurement: MeasurementRow[] = provenanceRefs(dataset).map((ref) => {
    const saved = draft.measurement[ref.key];
    return {
      key: ref.key,
      parameter: ref.label,
      source: PROVENANCE_LABEL[ref.provenance.source] + (ref.provenance.reference ? ` — ${ref.provenance.reference}` : ""),
      instrument: saved?.instrument ?? "",
      frequency: saved?.frequency ?? "",
      calibrationDate: saved?.calibrationDate ?? "",
    };
  });

  /* Every factor with its source. This is the section a verifier marks up
     most heavily, because a factor with no citation is an assumption wearing
     a number's clothes. */
  const factors: MmdContent["factors"] = [];
  for (const f of dataset.fuels) {
    factors.push({
      parameter: `${FUEL_LABEL[f.fuel]} — emission factor`,
      value: String(f.emissionFactor),
      unit: "tCO₂/GJ",
      source: PROVENANCE_LABEL[f.efProvenance.source] + (f.efProvenance.reference ? ` — ${f.efProvenance.reference}` : ""),
      isAssumption: isAssumption(f.efProvenance),
    });
    if (needsNcv(f.unit)) {
      factors.push({
        parameter: `${FUEL_LABEL[f.fuel]} — net calorific value`,
        value: String(f.ncv ?? ""),
        unit: ncvUnitLabel(f.unit),
        source: f.ncvProvenance
          ? PROVENANCE_LABEL[f.ncvProvenance.source] + (f.ncvProvenance.reference ? ` — ${f.ncvProvenance.reference}` : "")
          : "Not stated",
        isAssumption: isAssumption(f.ncvProvenance),
      });
    }
    if (f.oxidationFactor != null && f.oxidationFactor !== 1) {
      factors.push({ parameter: `${FUEL_LABEL[f.fuel]} — oxidation factor`, value: String(f.oxidationFactor), unit: "—", source: "Operator", isAssumption: false });
    }
  }
  for (const e of dataset.electricity) {
    factors.push({
      parameter: "Electricity — emission factor",
      value: String(e.emissionFactor),
      unit: "tCO₂/MWh",
      source: `${ELECTRICITY_FACTOR_LABEL[e.factorSource]}${e.provenance.reference ? ` — ${e.provenance.reference}` : ""}`,
      isAssumption: isAssumption(e.provenance),
    });
  }
  for (const p of dataset.processEmissions) {
    factors.push({
      parameter: `${p.material || "Process material"} — carbon content`,
      value: String(p.carbonContent),
      unit: "mass fraction",
      source: PROVENANCE_LABEL[p.provenance.source] + (p.provenance.reference ? ` — ${p.provenance.reference}` : ""),
      isAssumption: isAssumption(p.provenance),
    });
  }

  const generated: MmdContent = {
    identity: input.installation,
    boundary: {
      description: boundary.description,
      included: boundary.included.map((s) => PROCESS_STEP_LABEL[s]),
      excluded: boundary.excluded.map((s) => PROCESS_STEP_LABEL[s]),
      undecided: undecided.map((s) => PROCESS_STEP_LABEL[s]),
    },
    period: { start: period.start, end: period.end, type: period.type, display: displayPeriod(period) },
    parameters,
    measurement,
    factors,
    gaps: gaps.map((g) => ({
      parameter: g.affectedParameter,
      window: `${displayDate(g.periodStart)} — ${displayDate(g.periodEnd)}`,
      reason: g.reason,
      method: ESTIMATION_METHOD_LABEL[g.estimationMethod],
      justification: g.conservativeJustification,
      estimatedTCO2e: g.estimatedTCO2e,
    })),
    qa: draft.qa,
    assumptions: provenanceRefs(dataset)
      .filter((r) => isAssumption(r.provenance))
      .map((r) => ({ input: r.label, reference: r.provenance.reference ?? "", enteredBy: r.provenance.enteredBy })),
    diagram: { fileId: boundary.diagramFileId ?? null, fileName: null },
  };

  return { ...generated, ...draft.overrides };
}

/* ── Completeness ───────────────────────────────────────────────
   What is still missing, section by section. Not a score — a to-do list, so
   the exporter knows what a verifier would send back. */
export type MmdIssue = { section: MmdSection; message: string };

export function mmdIssues(c: MmdContent): MmdIssue[] {
  const out: MmdIssue[] = [];
  if (!c.identity.installationName.trim()) out.push({ section: "identity", message: "Installation name is missing." });
  if (!c.identity.coordinates.trim()) out.push({ section: "identity", message: "Geographic coordinates are missing — CBAM identifies the installation by them." });
  if (!c.boundary.description.trim()) out.push({ section: "boundary", message: "The boundary has no description." });
  if (c.boundary.undecided.length > 0) {
    out.push({ section: "boundary", message: `${c.boundary.undecided.length} production step${c.boundary.undecided.length === 1 ? " is" : "s are"} neither included nor excluded — an open boundary fails the completeness test.` });
  }
  if (c.parameters.length === 0) out.push({ section: "parameters", message: "No parameters are monitored — enter activity data first." });
  const noInstrument = c.measurement.filter((m) => !m.instrument.trim()).length;
  if (noInstrument > 0) out.push({ section: "measurement", message: `${noInstrument} parameter${noInstrument === 1 ? " has" : "s have"} no instrument recorded.` });
  const noCalibration = c.measurement.filter((m) => m.instrument.trim() && !m.calibrationDate).length;
  if (noCalibration > 0) out.push({ section: "measurement", message: `${noCalibration} instrument${noCalibration === 1 ? " has" : "s have"} no calibration date.` });
  const unsourced = c.factors.filter((f) => !f.source.trim() || f.source === "Not stated").length;
  if (unsourced > 0) out.push({ section: "factors", message: `${unsourced} calculation factor${unsourced === 1 ? " has" : "s have"} no source. A factor without a citation is an assumption.` });
  for (const g of c.gaps) {
    if (!g.justification.trim()) out.push({ section: "gaps", message: `"${g.parameter || "A gap"}" has no conservativeness justification.` });
  }
  if (c.qa.method === "none") out.push({ section: "qa", message: "No quality assurance is claimed. A verifier will ask what stops an error reaching the filing." });
  if (!c.diagram.fileId) out.push({ section: "diagram", message: "No installation diagram attached." });
  return out;
}

/* ── Versioning & diff ──────────────────────────────────────────
   The consistency test, made answerable. */
export type MmdChange = { section: MmdSection; field: string; before: string; after: string };

/* A row in a generated table — a monitored parameter, a factor, a gap —
   described the way the person reading the change list would say it out loud.
   Dumping JSON here is technically a diff and practically unreadable, which
   defeats the point: the change list exists to be READ, by a verifier, as the
   evidence that the method is or is not the same as last year. */
function describeItem(v: unknown): string {
  if (v == null) return "";
  if (typeof v !== "object") return String(v);
  const o = v as Record<string, unknown>;
  const label = o.name ?? o.parameter ?? o.input ?? o.material ?? o.affectedParameter ?? "";
  const detail = o.value ?? o.instrument ?? o.method ?? o.source ?? o.unit ?? "";
  const text = [label, detail].filter((x) => x !== "" && x != null).join(" — ");
  return text || JSON.stringify(v);
}

const asText = (v: unknown): string => {
  if (v == null) return "";
  if (Array.isArray(v)) return v.map(describeItem).join("; ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

export function diffVersions(before: MmdContent, after: MmdContent): MmdChange[] {
  const changes: MmdChange[] = [];
  for (const section of MMD_SECTIONS) {
    const a = before[section] as unknown;
    const b = after[section] as unknown;

    /* Array sections (parameters, factors, gaps, assumptions) diff as
       ADDED and REMOVED entries rather than as two long strings. "We started
       monitoring coke consumption" is the change; a before/after blob of
       every row is a wall nobody reads. */
    if (Array.isArray(a) || Array.isArray(b)) {
      const beforeItems = (Array.isArray(a) ? a : []).map(describeItem);
      const afterItems = (Array.isArray(b) ? b : []).map(describeItem);
      const beforeSet = new Set(beforeItems);
      const afterSet = new Set(afterItems);
      for (const item of afterItems) {
        if (!beforeSet.has(item)) changes.push({ section, field: "added", before: "—", after: item });
      }
      for (const item of beforeItems) {
        if (!afterSet.has(item)) changes.push({ section, field: "removed", before: item, after: "—" });
      }
      continue;
    }

    if (a && b && typeof a === "object" && typeof b === "object") {
      const keys = new Set([...Object.keys(a as object), ...Object.keys(b as object)]);
      for (const k of keys) {
        const av = asText((a as Record<string, unknown>)[k]);
        const bv = asText((b as Record<string, unknown>)[k]);
        if (av !== bv) changes.push({ section, field: k, before: av, after: bv });
      }
      continue;
    }

    const av = asText(a);
    const bv = asText(b);
    if (av !== bv) changes.push({ section, field: "—", before: av, after: bv });
  }
  return changes;
}

/* ── Storage ────────────────────────────────────────────────────
   Draft (mutable) and versions (append-only). A finalised version is never
   edited — that is the whole point of finalising one. */
const DRAFT_KEY = "certrace:mmd-draft";
const VERSION_KEY = "certrace:mmd-versions";

function read<T>(key: string): Record<string, T> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, T>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function write<T>(key: string, value: Record<string, T>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export const emptyDraft = (declarationId: string): MmdDraft => ({
  declarationId,
  overrides: {},
  qa: { method: "four_eyes", note: "" },
  measurement: {},
  confirmed: [],
  updatedAt: Date.now(),
});

export const loadDraft = (declarationId: string): MmdDraft => read<MmdDraft>(DRAFT_KEY)[declarationId] ?? emptyDraft(declarationId);

export function saveDraft(draft: MmdDraft): MmdDraft {
  const all = read<MmdDraft>(DRAFT_KEY);
  const next = { ...draft, updatedAt: Date.now() };
  all[draft.declarationId] = next;
  write(DRAFT_KEY, all);
  return next;
}

export const listVersions = (declarationId: string): MmdVersion[] =>
  (read<MmdVersion[]>(VERSION_KEY)[declarationId] ?? []).sort((a, b) => a.n - b.n);

export const latestVersion = (declarationId: string): MmdVersion | null => {
  const list = listVersions(declarationId);
  return list.length ? list[list.length - 1] : null;
};

export function finaliseVersion(declarationId: string, content: MmdContent, author: string): MmdVersion {
  const all = read<MmdVersion[]>(VERSION_KEY);
  const list = all[declarationId] ?? [];
  const version: MmdVersion = {
    id: `mmd-${declarationId}-${list.length + 1}`,
    declarationId,
    n: list.length + 1,
    finalisedAt: Date.now(),
    author,
    content,
  };
  all[declarationId] = [...list, version];
  write(VERSION_KEY, all);
  return version;
}
