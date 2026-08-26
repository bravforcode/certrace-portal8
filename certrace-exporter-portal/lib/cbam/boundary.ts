/* ════════════════════════════════════════════════════════════
   BOUNDARY & REPORTING PERIOD — the first thing a verifier tests

   Completeness is verifier assertion #1 (spec §2): are all emission sources
   inside the boundary actually included? That question cannot be answered by
   a paragraph of prose, so the boundary is a CHECKLIST — every production
   step is explicitly included or explicitly excluded, and a step left in
   neither list is an unanswered question rather than a silent omission.

   The boundary is the PRODUCTION PROCESS, not the physical site. A mill that
   also runs a fabrication shop for the domestic market draws the CBAM
   boundary around the steel-making route, not around the fence line. Getting
   this wrong is the most common reason a first-time dossier is sent back.

   Dates: ISO 'YYYY-MM-DD' in storage, ALWAYS 'YYYY/MM/DD' on screen. One
   helper, used everywhere, so the two never drift apart.
   ════════════════════════════════════════════════════════════ */

/* The 11 steps a CBAM iron/steel or aluminium installation is built from.
   Deliberately a closed list: a free-text boundary cannot be diffed against
   last year's, and consistency year over year is its own verifier test. */
export type ProcessStep =
  | "raw_material_handling"
  | "melting_eaf"
  | "melting_bf_bof"
  | "melting_dri_eaf"
  | "casting"
  | "hot_rolling"
  | "cold_rolling"
  | "pickling"
  | "coating_galvanizing"
  | "finishing_cutting"
  | "onsite_utilities";

export const PROCESS_STEPS: ProcessStep[] = [
  "raw_material_handling",
  "melting_eaf",
  "melting_bf_bof",
  "melting_dri_eaf",
  "casting",
  "hot_rolling",
  "cold_rolling",
  "pickling",
  "coating_galvanizing",
  "finishing_cutting",
  "onsite_utilities",
];

export const PROCESS_STEP_LABEL: Record<ProcessStep, string> = {
  raw_material_handling: "Raw material handling",
  melting_eaf: "Melting — electric arc furnace (EAF)",
  melting_bf_bof: "Melting — blast furnace / basic oxygen (BF-BOF)",
  melting_dri_eaf: "Melting — direct reduced iron into EAF (DRI-EAF)",
  casting: "Casting",
  hot_rolling: "Hot rolling",
  cold_rolling: "Cold rolling",
  pickling: "Pickling",
  coating_galvanizing: "Coating / galvanizing",
  finishing_cutting: "Finishing & cutting",
  onsite_utilities: "On-site utilities",
};

/** One line of context per step — what a verifier expects to see accounted
    for if the step is inside the boundary. */
export const PROCESS_STEP_HINT: Record<ProcessStep, string> = {
  raw_material_handling: "Scrap yards, ore handling, on-site transport and pre-heating.",
  melting_eaf: "Electric arc furnace melting — electrode consumption sits here.",
  melting_bf_bof: "Blast furnace and basic oxygen route, including coke and sinter use.",
  melting_dri_eaf: "Direct-reduction shaft plus EAF melting — reductant gas belongs here.",
  casting: "Continuous casting or ingot casting, tundish and ladle heating.",
  hot_rolling: "Reheat furnaces and the hot mill.",
  cold_rolling: "Cold reduction mill, annealing and temper rolling.",
  pickling: "Acid pickling lines and acid regeneration.",
  coating_galvanizing: "Zinc, tin or paint lines including the coating pot.",
  finishing_cutting: "Slitting, cutting to length, packing.",
  onsite_utilities: "Compressed air, on-site power generation, steam, lighting.",
};

export type Boundary = {
  declarationId: string;
  /** the production-process boundary in the exporter's own words — NOT a
      description of the physical site */
  description: string;
  included: ProcessStep[];
  excluded: ProcessStep[];
  /** process flow diagram, held in the evidence store (lib/cbam/evidence.ts) */
  diagramFileId?: string;
  updatedAt?: number;
  updatedBy?: string;
};

export const emptyBoundary = (declarationId: string): Boundary => ({
  declarationId,
  description: "",
  included: [],
  excluded: [],
});

/** Steps the exporter has answered neither way. Completeness is only claimable
    once this is empty — an unanswered step is an unclosed boundary. */
export function undecidedSteps(b: Pick<Boundary, "included" | "excluded">): ProcessStep[] {
  const decided = new Set<ProcessStep>([...b.included, ...b.excluded]);
  return PROCESS_STEPS.filter((s) => !decided.has(s));
}

export const boundaryComplete = (b: Pick<Boundary, "included" | "excluded" | "description">): boolean =>
  undecidedSteps(b).length === 0 && b.description.trim().length > 0;

/* ── Reporting period ──────────────────────────────────────────── */
export type ReportingPeriod = {
  /** ISO 'YYYY-MM-DD' — stored ISO, displayed YYYY/MM/DD */
  start: string;
  end: string;
  type: "calendar_year" | "fiscal_year";
};

export const PERIOD_TYPE_LABEL: Record<ReportingPeriod["type"], string> = {
  calendar_year: "Calendar year",
  fiscal_year: "Fiscal year",
};

export const calendarYear = (year: number): ReportingPeriod => ({
  start: `${year}-01-01`,
  end: `${year}-12-31`,
  type: "calendar_year",
});

/* ── Dates ──────────────────────────────────────────────────────
   Hard rule from the build spec: ISO in storage, YYYY/MM/DD on screen. Every
   date the exporter reads goes through here, so a locale change can never
   turn 2026-03-04 into 04/03/2026 in one place and 03/04/2026 in another. */
export function displayDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  return m ? `${m[1]}/${m[2]}/${m[3]}` : iso;
}

export const displayPeriod = (p: Pick<ReportingPeriod, "start" | "end">): string =>
  `${displayDate(p.start)} — ${displayDate(p.end)}`;

/** The calendar months a period covers, as 'YYYY-MM'. Drives V11 (a reporting
    period needs a reading for every month, or a data-gap entry saying why not). */
export function monthsInPeriod(p: Pick<ReportingPeriod, "start" | "end">): string[] {
  const s = /^(\d{4})-(\d{2})/.exec(p.start ?? "");
  const e = /^(\d{4})-(\d{2})/.exec(p.end ?? "");
  if (!s || !e) return [];
  let y = Number(s[1]);
  let m = Number(s[2]);
  const ey = Number(e[1]);
  const em = Number(e[2]);
  const out: string[] = [];
  // 10-year ceiling: a mistyped end date must not spin here.
  while ((y < ey || (y === ey && m <= em)) && out.length < 120) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

export const monthLabel = (ym: string): string => {
  const m = /^(\d{4})-(\d{2})$/.exec(ym);
  return m ? `${m[1]}/${m[2]}` : ym;
};

/** Is an ISO date inside the period (inclusive)? String compare is safe and
    timezone-proof for 'YYYY-MM-DD'. */
export const withinPeriod = (iso: string, p: Pick<ReportingPeriod, "start" | "end">): boolean =>
  Boolean(iso) && iso >= p.start && iso <= p.end;
