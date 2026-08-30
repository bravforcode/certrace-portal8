/* ════════════════════════════════════════════════════════════
   THE MMD, ON ONE PAGE (§A5)

   Part 1 generates a full Monitoring Methodology Document from the activity
   data (lib/cbam/mmd.ts) — ten sections, derived, at declaration scope. That
   is the right artefact at the end. It is the wrong thing to hand somebody in
   January, because it presents as a form they have to complete before they
   have collected anything.

   So the workspace gets a different surface over the same idea: ONE SCROLLING
   PAGE, seven cards, every field with a "Show example" toggle that reveals
   filled sample text inline, greyed and non-destructive. An exporter never
   faces a blank multi-screen wizard, and never has to guess what "boundary
   description" is supposed to contain — the example shows them, and clicking
   it never overwrites what they typed.

   WHAT IS SHARED WITH PART 1, deliberately: the quality-assurance vocabulary.
   `QualityAssurance` and its four options are imported from lib/cbam/mmd.ts
   rather than re-declared, because two lists that drift produce two different
   answers to the one question a verifier asks about internal control.

   FINALISING. A final version is read-only and stamped. Editing forks v+1,
   so the document handed to a verifier in March still says in December what
   it said in March. Until a version is final the workspace's MMD tab is
   BLOCKED, not incomplete — a draft methodology does not satisfy the gate,
   and rounding that up to green would make the whole dashboard a lie.
   ════════════════════════════════════════════════════════════ */

import { QUALITY_ASSURANCE_LABEL, QUALITY_ASSURANCE_OPTIONS, type QualityAssurance } from "./cbam/mmd";

export { QUALITY_ASSURANCE_LABEL, QUALITY_ASSURANCE_OPTIONS };
export type { QualityAssurance };

/* ── Process options (§A5) ──────────────────────────────────────
   Steel + aluminium, exactly the list in the spec. A closed list because
   "melting" typed freehand in January and "Melting (EAF)" in July is a
   boundary that cannot be compared across months.

   Closed, but NOT sealed: the picker appends an "Other" row that takes a typed
   name. The list used to end in "On-site utilities", which was doing the job of
   an escape hatch badly — it is not a production process, so anyone whose real
   line was missing filed it under a heading that told a verifier nothing, and
   anyone whose boiler house genuinely belonged in the boundary got a label that
   did not say which utility. Naming it yourself answers both. */
export const PROCESS_OPTIONS = [
  "Raw material handling",
  "Melting (EAF)",
  "Melting (BF-BOF)",
  "Melting (DRI-EAF)",
  "Smelting (Hall-Heroult)",
  "Remelting",
  "Casting",
  "Hot rolling",
  "Cold rolling",
  "Extrusion",
  "Pickling",
  "Coating/Galvanizing",
  "Surface treatment",
  "Finishing/Cutting",
] as const;

export type ProcessOption = (typeof PROCESS_OPTIONS)[number];

/* ── Exclusions ─────────────────────────────────────────────────
   An excluded process is NOT a process you deleted from the list. It is a
   process that physically happens at the installation and that you are
   declaring to be OUTSIDE the production-process boundary — and under the
   monitoring methodology every such declaration needs a ground.

   This is the distinction the old two-multi-select design lost. "Processes
   excluded" beside "Processes included" reads as a bin: drag it out and it is
   gone. But a verifier's first completeness question is "what happens on this
   site that is not in these numbers, and why is that correct?", and an
   unjustified exclusion is the single most common finding on a first
   engagement. So an exclusion carries a reason from the standard's own
   grounds, and a free note where the ground needs specifics. */
export type ExclusionGround =
  | "not_production_process"
  | "separately_metered"
  | "outsourced"
  | "non_cbam_good"
  | "de_minimis"
  | "other";

export const EXCLUSION_GROUNDS: ExclusionGround[] = [
  "not_production_process",
  "separately_metered",
  "outsourced",
  "non_cbam_good",
  "de_minimis",
  "other",
];

export const EXCLUSION_GROUND_LABEL: Record<ExclusionGround, string> = {
  not_production_process: "Not part of the production process",
  separately_metered: "Separately metered and attributed elsewhere",
  outsourced: "Carried out by a third party off site",
  non_cbam_good: "Serves a different, non-CBAM good",
  de_minimis: "Below the de minimis threshold",
  other: "Other ground — describe it",
};

/** How an exclusion's ground reads to somebody outside the form — the written
    ground when it is "other", the standard wording otherwise. Anything that
    prints an exclusion goes through this, so a verifier never receives the
    literal words "Other ground — describe it". */
export const exclusionGroundLabel = (x: ProcessExclusion): string =>
  x.ground === "other" && x.groundOther.trim() ? x.groundOther.trim() : EXCLUSION_GROUND_LABEL[x.ground];

export const EXCLUSION_GROUND_HINT: Record<ExclusionGround, string> = {
  not_production_process:
    "Offices, canteen, site lighting, the vehicle fleet. Energy the site uses that no tonne of the good passes through.",
  separately_metered:
    "The process happens here but its energy is metered on its own circuit and reported against another good or another installation.",
  outsourced:
    "A subcontractor performs it elsewhere. If the output re-enters as material, it belongs in Precursors rather than here.",
  non_cbam_good: "A shared line that also makes something outside CBAM scope, where the split is attributed rather than excluded wholesale.",
  de_minimis: "Below the threshold at which the methodology allows a source stream to be left out. Say which threshold and give the figure.",
  other: "Anything else. Describe the ground in full — an exclusion without a stated ground is the most common first-engagement finding.",
};

export type ProcessExclusion = {
  id: string;
  /** a PROCESS_OPTIONS value, or free text for something not on the list */
  process: string;
  ground: ExclusionGround;
  /** The ground itself, when it is "other".

      "Other ground — describe it" asked a question the form had nowhere to
      answer. The `note` underneath is a different question — WHICH meter,
      WHICH subcontractor, WHICH threshold — so an exclusion on an unlisted
      ground arrived at the verifier as the word "other" and a detail line
      about a meter, with the ground itself never stated. Two questions, two
      fields. */
  groundOther: string;
  /** required detail — which meter, which subcontractor, which threshold */
  note: string;
};

/* ── Monitoring method (Annex II B.2 of IR (EU) 2025/2547) ───────
   THE METHOD IS A PROPERTY OF WHAT IS BEING MONITORED, NOT OF THE BOUNDARY.

   Annex II B.2 ("Choice of monitoring methodology") is explicit: "The applied
   monitoring methodology may be a combination of methodologies such that
   different parts of the installation's emissions are monitored by either of
   the applicable methodologies." Equation 4 then sums the two — calculation
   over SOURCE STREAMS, measurement over EMISSION SOURCES — which is why the
   choice cannot be one value for the document.

   The two are different units and the regulation keeps them apart: a source
   stream is a fuel or material (Article 2), an emission source is a
   separately identifiable part of the plant that emits. Annex II A.5(11)
   asks for "a list of emission sources for which a measurement-based
   methodology is used" — a list, per row, which is what this field builds.

   That is not an edge case: a plant with a CEMS on the main furnace and a
   standby diesel generator invoiced by delivery note has both,
   simultaneously, and every month of the year.

   This used to be one value on the whole document, so choosing "measurement"
   for the furnace demanded a QAL2 certificate for the diesel genset as well —
   a gate no honest exporter could pass — and choosing "calculation" hid the
   CEMS fields on the one row that needed them. The value now lives on the
   ROW. The card-level field survives only as the seed for new rows and as the
   migration source; see `WorkspaceMmdContent.directMethod`. */
export type DirectMethod = "calculation" | "measurement";

export const DIRECT_METHOD_LABEL: Record<DirectMethod, string> = {
  calculation: "Calculation-based",
  measurement: "Measurement-based",
};

export const DIRECT_METHOD_HINT: Record<DirectMethod, string> = {
  calculation: "Emissions derived from activity data × emission factor. The route almost every CBAM installation uses.",
  measurement: "Emissions read directly from a continuous emissions monitoring system. Requires the CEMS' own calibration record.",
};

export type FactorSourceOption = "eu_standard" | "lab_analysis" | "national_inventory" | "supplier_declared";

export const FACTOR_SOURCE_LABEL: Record<FactorSourceOption, string> = {
  eu_standard: "EU standard value",
  lab_analysis: "Laboratory analysis",
  national_inventory: "National inventory",
  supplier_declared: "Supplier-declared",
};

export const FACTOR_SOURCE_HINT: Record<FactorSourceOption, string> = {
  eu_standard: "The default factor published by the Commission for this fuel or material. Always acceptable, never the most favourable.",
  lab_analysis: "A factor measured from your own samples. The strongest evidence, and it needs the certificate and the sampling frequency behind it.",
  national_inventory: "Thailand's national GHG inventory value (TGO). Acceptable where it is the more representative figure — say why it is.",
  supplier_declared: "A figure your supplier gave you. It is only as good as their own monitoring, so a verifier will ask what sits behind it.",
};

/* ── Reading frequency (§A5, measurement methods) ───────────────
   How often the instrument is actually read. It was free text, which produced
   "monthly", "Monthly", "1/month" and "every month" across four rows of the
   same document — four spellings a verifier has to reconcile by hand before
   they can even ask the real question, which is whether the frequency matches
   the frequency the methodology claims. */
export const READING_FREQUENCY_OPTIONS = [
  { id: "continuous", label: "Continuous", hint: "Logged automatically without an operator present — a CEMS or a SCADA-connected meter." },
  { id: "hourly", label: "Hourly", hint: "Recorded every hour, usually by a data logger." },
  { id: "per_shift", label: "Every shift", hint: "Read at each shift handover. Say how many shifts a day in the note if it is not three." },
  { id: "daily", label: "Daily", hint: "One reading per production day." },
  { id: "weekly", label: "Weekly", hint: "One reading per week." },
  { id: "monthly", label: "Monthly", hint: "One reading per month — most commonly the utility meter read against the invoice." },
  { id: "per_batch", label: "Per batch / per heat", hint: "Tied to production events rather than the clock. The right answer for furnace charges." },
  { id: "per_delivery", label: "Per delivery", hint: "Read when fuel is delivered — the usual answer for tanked diesel and fuel oil." },
  { id: "quarterly", label: "Quarterly", hint: "One reading per quarter. Expect a question about how the monthly figures are derived from it." },
  { id: "annually", label: "Annually", hint: "One reading a year. Rarely sufficient on its own for monthly reporting." },
];

export const readingFrequencyLabel = (id: string, otherText?: string): string => {
  if (id === "other") return otherText?.trim() ? otherText.trim() : "Other frequency";
  return READING_FREQUENCY_OPTIONS.find((o) => o.id === id)?.label ?? id;
};

/* ── Electricity supply (§A5, parameters monitored) ─────────────
   Was a free-text box. The EU communication template asks for the SOURCE of
   electricity as a category — grid, direct technical link, power purchase
   agreement, or own generation — because the category is what decides which
   emission factor is admissible. Free text cannot be checked against that
   rule, and "PEA" typed into a box is not an answer a verifier can act on
   without asking a follow-up question.

   So the list is the EU's four categories, expressed in the names a Thai
   exporter actually uses for them, and it ends in Other. Own generation is
   split by technology because the technology IS the factor: a gas cogeneration
   set and a rooftop PV array are not the same claim. */
export type ElectricitySupplyOption = {
  id: string;
  label: string;
  /** the EU template's category this maps onto */
  category: "Grid" | "Direct technical link" | "Power purchase agreement" | "Own generation";
  hint: string;
};

export const ELECTRICITY_SUPPLY_OPTIONS: ElectricitySupplyOption[] = [
  {
    id: "grid_mea",
    label: "Grid — Metropolitan Electricity Authority (MEA)",
    category: "Grid",
    hint: "Public supply in Bangkok, Nonthaburi and Samut Prakan. The factor is the national grid factor.",
  },
  {
    id: "grid_pea",
    label: "Grid — Provincial Electricity Authority (PEA)",
    category: "Grid",
    hint: "Public supply everywhere outside the MEA area. The factor is the national grid factor.",
  },
  {
    id: "grid_egat",
    label: "Grid — EGAT direct customer",
    category: "Grid",
    hint: "Supplied directly by EGAT rather than through MEA or PEA. Still the national grid factor.",
  },
  {
    id: "grid_industrial_estate",
    label: "Grid — industrial estate / private distribution",
    category: "Grid",
    hint: "Bought from the estate operator (IEAT or a private developer) who buys from the grid. Name the operator in the note.",
  },
  {
    id: "direct_line",
    label: "Direct technical link to a generator",
    category: "Direct technical link",
    hint: "A physical dedicated line from one generating unit, with no grid in between. The generator's own factor applies — and needs evidence.",
  },
  {
    id: "ppa_renewable",
    label: "Power purchase agreement — renewable",
    category: "Power purchase agreement",
    hint: "Contracted renewable supply. Admissible only with the contract and the attribute certificates behind it.",
  },
  {
    id: "ppa_other",
    label: "Power purchase agreement — other generator",
    category: "Power purchase agreement",
    hint: "A PPA with a non-renewable generator (SPP/IPP). The generator's factor applies, evidenced by the contract.",
  },
  {
    id: "own_gas_chp",
    label: "Own generation — gas cogeneration (CHP)",
    category: "Own generation",
    hint: "On-site gas turbine or engine. The fuel is already in your fuel rows — do not count the electricity a second time.",
  },
  {
    id: "own_diesel",
    label: "Own generation — diesel or gas genset",
    category: "Own generation",
    hint: "Standby or peaking generation. Its fuel belongs in the fuel rows.",
  },
  {
    id: "own_solar",
    label: "Own generation — solar PV",
    category: "Own generation",
    hint: "Rooftop or ground-mount PV consumed on site. Zero-rated, and the metered volume is what evidences it.",
  },
  {
    id: "own_waste_heat",
    label: "Own generation — waste-heat recovery",
    category: "Own generation",
    hint: "Power recovered from process heat. Zero fuel of its own; the heat source is already accounted for.",
  },
  {
    id: "own_biomass",
    label: "Own generation — biomass boiler",
    category: "Own generation",
    hint: "On-site biomass generation. Its fuel belongs in the fuel rows, where the sustainability question is asked.",
  },
];

export const electricitySupplyLabel = (id: string, otherText?: string): string => {
  if (id === "other") return otherText?.trim() ? otherText.trim() : "Other source";
  return ELECTRICITY_SUPPLY_OPTIONS.find((o) => o.id === id)?.label ?? id;
};

export const ELECTRICITY_SUPPLY_CATEGORIES = ["Grid", "Direct technical link", "Power purchase agreement", "Own generation"] as const;

/* ── Installation diagram (§A5.7) ───────────────────────────────
   IT IS NOT AN AID. IT IS A REQUIRED ELEMENT OF THE MONITORING PLAN.

   Annex II A.5(13) of IR (EU) 2025/2547 asks for "a suitable diagram and
   process description of the installation including the system boundaries of
   the installations and different production processes, providing evidence
   that there is neither double counting nor data gaps in the emissions of the
   installation".

   Read that clause and the checklist below stops being Certrace's opinion
   about a good drawing: the boundary line, the process order and the metering
   points are the things the diagram has to carry for it to be the EVIDENCE
   the Annex says it is. A site plan showing where the buildings are cannot
   demonstrate the absence of double counting, which is why "upload a diagram"
   on its own reliably produces the wrong file. */
export const DIAGRAM_REQUIREMENTS = [
  "Every process step inside the boundary, in the order material moves through them.",
  "A drawn boundary line, with the excluded processes visibly outside it.",
  "Where each fuel and each electricity feed enters, and which meter records it.",
  "Where precursors enter and where the finished good leaves.",
  "The meter or instrument reference beside each point where something is measured, matching the parameter names used above.",
] as const;

export const DIAGRAM_NOTE =
  "A process flow diagram, not a site plan. Annex II A.5(13) of IR (EU) 2025/2547 makes it a required element of the monitoring plan, and it asks the drawing to do one specific job: show the system boundaries of the installation and its production processes, and evidence that there is neither double counting nor a data gap. A drawing of where the buildings sit cannot answer that.";

/* ── Repeatable rows ────────────────────────────────────────────
   Measurement methods carry the four things a verifier asks about any
   monitored parameter, in the order they ask them. */
export type MeasurementMethodRow = {
  id: string;
  parameter: string;
  instrument: string;
  /** a READING_FREQUENCY_OPTIONS id, or "other" */
  readingFrequency: string;
  /** free text when `readingFrequency` is "other" */
  readingFrequencyOther?: string;
  /** ISO 'YYYY-MM-DD' */
  lastCalibration: string;
  factorSource: FactorSourceOption;
  /** How THIS row's direct emissions are determined — the source stream when
      it is calculation-based, the emission source when it is
      measurement-based. Per row, not per boundary: Annex II B.2 of IR (EU)
      2025/2547 allows the two to be combined within one installation. Fuels
      only — an electricity meter has no CEMS, so the field is carried but
      never asked for on the electricity card. */
  directMethod: DirectMethod;
  /* ── Measurement-based only ────────────────────────────────────
     Asked only when THIS ROW's `directMethod` is "measurement", because a CEMS
     is what makes them meaningful — a rotary gas meter has no QAL2 record and
     no "measurement point" in the regulation's sense.

     MEASUREMENT POINT IS A DEFINED TERM. Annex I item 25 of IR (EU) 2025/2547
     defines it for continuous emission measurement, and it is the ONLY place
     the phrase may be used. The electricity field is an "electricity metering
     point" for exactly this reason: calling that a measurement point tells a
     verifier a CEMS is installed on the incoming feeder. */
  /** QAL2 / calibration certificate reference for the analyser */
  cemsCalibrationRef?: string;
  /** where in the duct or stack the sample is taken */
  measurementPointLocation?: string;
};

/* A data gap is a period, a reason and an estimation method. The estimate's
   tCO₂e is carried because §4's materiality self-check divides it by the
   year's total — a gap register without a magnitude cannot answer "is this
   material?", which is the only question that matters about it. */
export type DataGapRow = {
  id: string;
  periodStart: string;
  periodEnd: string;
  reason: string;
  estimationMethod: string;
  estimatedTCO2e: number;
  /* WHO CHECKED THIS ONE, per gap rather than per document.

     It used to be a single "who checks these figures" at the foot of the
     section, which answers a question nobody asked: a verifier sampling the
     March gap wants the name of the person who signed off THAT estimate, and
     in a real plant that is the shift manager for March, not whoever the
     document names once for the year. A gap from the gas meter and a gap from
     the weighbridge are checked by two different people, and one field
     cannot say so.

     Labelled "Reviewer of record" on screen — the register Annex II Point
     A.5(22)(d)–(e) is written in, and the same term the whole-document
     reviewer field now uses too, so a verifier reading both never has to
     work out whether they mean the same role. */
  reviewerName: string;
  /* THE DATE THE REVIEW HAPPENED — distinct from periodStart/periodEnd
     above, which is the REPORTING PERIOD the gap covers (the March the
     meter was down), not when somebody checked the estimate. Point
     A.5(22)(e)'s "internal reviews and validation of data" is a dated act,
     and a reviewer name with no date attached is a name, not evidence a
     review took place. Recorded as the date reviewed — the date a reviewer
     puts their name to the estimate — rather than a "date identified",
     because that is the fact `reviewerName` is already claiming happened;
     tying the two together is what makes the pair checkable. */
  gapDate: string;
};

/* ── Sector-specific parameters (§3, iron/steel goods only) ───────────
   The EU communication template asks a handful of iron/steel categories for
   the good's own alloy composition and scrap use — not a calculation input,
   just context that lets an importer sanity-check the reported SEE against
   the declared metal composition. Which fields actually apply depends on the
   aggregated goods category (see lib/cbam/template-reference.ts's
   `specialParameters`); this type is the union of every field any of those
   categories asks for, and the UI/report only show the ones that category's
   `specialParameters` list names. */
export const REDUCING_AGENTS = ["coke", "natural_gas", "hydrogen", "coal", "none", "other"] as const;
export type ReducingAgent = (typeof REDUCING_AGENTS)[number];

export const REDUCING_AGENT_LABEL: Record<ReducingAgent, string> = {
  coke: "Coke",
  natural_gas: "Natural gas",
  hydrogen: "Hydrogen",
  coal: "Coal",
  none: "None (scrap-only route)",
  other: "Other",
};

export type SectorParameters = {
  reducingAgent: ReducingAgent | "";
  reducingAgentOther: string;
  mnPct?: number;
  crPct?: number;
  niPct?: number;
  otherAlloyingPct?: number;
  /** iron_or_steel_products only */
  otherMaterialsPct?: number;
  /** iron_or_steel_products only */
  steelMillId: string;
  /** alloys only */
  carbonPct?: number;
  /** crude_steel only */
  scrapTonnesPerTonneSteel?: number;
  /** crude_steel only */
  preConsumerScrapPct?: number;
};

export const emptySectorParameters = (): SectorParameters => ({
  reducingAgent: "",
  reducingAgentOther: "",
  steelMillId: "",
});

export type WorkspaceMmdContent = {
  /** 1 · Boundary */
  boundaryDescription: string;
  /** ORDERED — the sequence material moves through the boundary, not a set */
  processesIncluded: string[];
  /** declared exclusions, each with a ground. Never "the ones you deleted". */
  exclusions: ProcessExclusion[];
  /** 2 · Reporting period — always the workspace's calendar year.
      There is no `periodType`: §6 of the spec flags fiscal-year reporters as a
      known limitation, so offering the choice was offering a setting that
      changed nothing downstream. */
  periodStart: string;
  periodEnd: string;
  /** 3 · Parameters monitored */
  /** THE SEED FOR NEW ROWS, and nothing else.
      It used to be the value `mmdIssues` validated for every fuel row at once.
      Annex II B.2 of IR (EU) 2025/2547 allows the methods to be mixed per
      source stream, so the validated value moved onto `MeasurementMethodRow`.
      This survives so an installation that really is calculation-based
      throughout does not re-answer the question on every row, and so an old
      record has somewhere to migrate FROM. Nothing reads it as an assertion
      about the boundary. */
  directMethod: DirectMethod;
  /** monthly-data FUEL_TYPES ids — the same codes the monthly rows use, so the
      methodology and the readings cannot name different fuels */
  fuelTypeIds: string[];
  fuelTypesOther: string;
  /** an ELECTRICITY_SUPPLY_OPTIONS id, or "other" */
  electricitySupply: string;
  electricitySupplyOther: string;
  /** which meter, which feeder — the detail the category cannot carry */
  electricityMeteringPoint: string;
  /* ── Own generation (card 3) ────────────────────────────────────
     Shown only when the supply is an "Own generation — *" option, and it asks
     one thing: confirm the fuel burned to make that power is ALREADY in the
     fuel list above.

     It is a gate rather than a note because the error it prevents is silent
     and doubles a number. On-site generation shows up twice in a naive
     return — once as the gas the turbine burned, once as the MWh it produced
     — and the second is the same carbon counted again. There is no way for a
     verifier to spot it from the totals alone. */
  ownGenerationFuelDeclared: boolean;
  /* ── Instruments, split by what they measure ────────────────────
     One combined list could not express "at least one instrument per fuel",
     because a single electricity meter satisfied the count for a plant
     burning three fuels. Two lists make each card answerable on its own, and
     make the electricity card able to seed its own row the moment a supply is
     chosen. `measurements` survives only as the migration source. */
  fuelInstruments: MeasurementMethodRow[];
  electricityInstruments: MeasurementMethodRow[];
  /** 5 · Data gaps */
  dataGaps: DataGapRow[];
  /** 6 · Quality assurance */
  qualityAssurance: QualityAssurance;
  reviewerName: string;
  reviewFrequency: string;
  /** 7 · Installation diagram */
  diagramFileName: string | null;
  diagramDataUrl?: string;
  /** which of DIAGRAM_REQUIREMENTS the uploaded drawing actually shows */
  diagramCovers: number[];
  /** 8 · Sector-specific parameters — iron/steel goods only, see above */
  sectorParameters: SectorParameters;
};

export type WorkspaceMmdVersion = {
  id: string;
  workspaceId: string;
  /** 1-based, increments on each finalise */
  n: number;
  finalisedAt: string;
  author: string;
  content: WorkspaceMmdContent;
  /** the period this version covers, frozen at finalise */
  periodStart: string;
  periodEnd: string;
};

export const emptyMmd = (periodStart: string, periodEnd: string): WorkspaceMmdContent => ({
  boundaryDescription: "",
  processesIncluded: [],
  exclusions: [],
  periodStart,
  periodEnd,
  directMethod: "calculation",
  fuelTypeIds: [],
  fuelTypesOther: "",
  electricitySupply: "",
  electricitySupplyOther: "",
  electricityMeteringPoint: "",
  ownGenerationFuelDeclared: false,
  fuelInstruments: [],
  electricityInstruments: [],
  dataGaps: [],
  qualityAssurance: "four_eyes",
  reviewerName: "",
  reviewFrequency: "",
  diagramFileName: null,
  diagramCovers: [],
  sectorParameters: emptySectorParameters(),
});

export const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? `mmd-${crypto.randomUUID().slice(0, 8)}` : `mmd-${Date.now().toString(36)}`;

export const emptyMeasurement = (parameter = "", directMethod: DirectMethod = "calculation"): MeasurementMethodRow => ({
  id: uid(),
  parameter,
  instrument: "",
  readingFrequency: "",
  lastCalibration: "",
  factorSource: "eu_standard",
  directMethod,
});

/** The method a NEW fuel row should open with: whatever the last row uses,
    falling back to the document's seed. A plant that is calculation-based
    throughout answers the question once; a plant with a CEMS on the furnace
    and an invoiced genset changes it on the one row that differs. */
export const nextRowMethod = (rows: MeasurementMethodRow[], seed: DirectMethod = "calculation"): DirectMethod =>
  rows.length > 0 ? rows[rows.length - 1].directMethod ?? seed : seed;

/** The row the electricity card seeds itself with. Named, because the whole
    point is that the exporter does not have to know that "Electricity
    consumption" is the parameter a verifier expects to see.

    Always calculation-based: metered MWh × emission factor is the only route
    there is for electricity, and a CEMS is not fitted to an incoming feeder. */
export const electricityInstrument = (): MeasurementMethodRow => emptyMeasurement("Electricity consumption", "calculation");

/** How the boundary's monitoring method reads to somebody outside the form.

    Anything that PRINTS the method — the verifier pack, the communication
    report — goes through this rather than reading a single field, because
    with the method held per source stream there may not be a single answer.
    "Calculation-based" printed over a boundary that has a CEMS on one stack is
    the kind of statement a verifier opens a finding against. */
export function directMethodSummary(c: WorkspaceMmdContent): string {
  const rows = c.fuelInstruments;
  if (rows.length === 0) return DIRECT_METHOD_LABEL[c.directMethod];
  const measurement = rows.filter((r) => r.directMethod === "measurement").length;
  if (measurement === 0) return DIRECT_METHOD_LABEL.calculation;
  if (measurement === rows.length) return DIRECT_METHOD_LABEL.measurement;
  const calc = rows.length - measurement;
  // The regulation's own units: calculation is applied to source streams,
  // measurement to emission sources (Annex II B.2, Equation 4).
  return `Combined — ${calc} calculation-based source stream${calc === 1 ? "" : "s"} and ${measurement} measurement-based emission source${measurement === 1 ? "" : "s"} (Annex II B.2, IR (EU) 2025/2547)`;
}

/** Is this supply one of the own-generation options? Card 3's condition. */
export const isOwnGeneration = (supplyId: string): boolean =>
  ELECTRICITY_SUPPLY_OPTIONS.find((o) => o.id === supplyId)?.category === "Own generation";

export const emptyExclusion = (): ProcessExclusion => ({
  id: uid(),
  process: "",
  ground: "not_production_process",
  groundOther: "",
  note: "",
});

/* ── Migration ──────────────────────────────────────────────────
   Drafts written before the boundary section became ordered-plus-justified,
   and before fuels and electricity became structured, are still in people's
   browsers. Reading one has to produce a valid current document rather than a
   crash or, worse, a silently half-empty form: an exporter who typed
   "Natural gas (reheat furnace), diesel" into the old free-text box should
   see that text preserved as an Other description, not deleted because the
   shape changed underneath them. */
type LegacyMmd = Partial<WorkspaceMmdContent> & {
  /** the pre-split single instrument list */
  measurements?: MeasurementMethodRow[];
  processesExcluded?: string[];
  fuelTypes?: string;
  electricitySource?: string;
  periodType?: string;
};

export function migrateMmd(raw: LegacyMmd, periodStart: string, periodEnd: string): WorkspaceMmdContent {
  const base = emptyMmd(raw.periodStart ?? periodStart, raw.periodEnd ?? periodEnd);
  /* THE METHOD CAME DOWN FROM THE CARD ONTO THE ROWS.

     A record written while `directMethod` was a single card-level value has
     rows with no method of their own. Reading one has to put the value it was
     actually validated against onto every row, or a finalised measurement-
     based MMD would reload as calculation-based — its CEMS fields still
     populated, no longer required, and no longer shown. Rows that already
     carry a method keep it, so re-migrating is a no-op. */
  const cardMethod: DirectMethod = raw.directMethod ?? base.directMethod;
  const withMethod = (rows: MeasurementMethodRow[], fallback: DirectMethod): MeasurementMethodRow[] =>
    rows.map((r) => ({ ...r, directMethod: r.directMethod ?? fallback }));
  const exclusions = (
    raw.exclusions ??
    (raw.processesExcluded ?? []).map((p) => ({
      id: uid(),
      process: p,
      ground: "not_production_process" as ExclusionGround,
      // Named as needing an answer rather than invented — an auto-written
      // justification is exactly the thing this field exists to prevent.
      note: "",
    }))
    // `groundOther` post-dates the first drafts, and a row loaded without it
    // would render an uncontrolled input the moment its ground was set to
    // "other". Defaulted here rather than at every call site.
  ).map((x) => ({ ...x, groundOther: (x as ProcessExclusion).groundOther ?? "" }));

  return {
    ...base,
    ...raw,
    exclusions,
    processesIncluded: raw.processesIncluded ?? [],
    fuelTypeIds: raw.fuelTypeIds ?? [],
    fuelTypesOther: raw.fuelTypesOther ?? raw.fuelTypes ?? "",
    electricitySupply: raw.electricitySupply ?? (raw.electricitySource?.trim() ? "other" : ""),
    electricitySupplyOther: raw.electricitySupplyOther ?? raw.electricitySource ?? "",
    electricityMeteringPoint: raw.electricityMeteringPoint ?? "",
    /* Instruments used to be one list. A draft written before the split has
       them under `measurements`, and every one of them was in practice a fuel
       or production instrument — the electricity card did not exist to put
       one in. So they migrate wholesale into `fuelInstruments`, and the
       electricity list starts empty and seeds itself when a supply is picked.

       `measurements` is kept on the object so an old draft round-trips
       unchanged if it is read by anything that has not been updated yet. */
    fuelInstruments: withMethod(raw.fuelInstruments ?? raw.measurements ?? [], cardMethod),
    // Electricity is calculation-based by construction — see
    // `electricityInstrument`. An old row is normalised to that rather than to
    // the card's value, so a measurement-based boundary does not migrate into
    // demanding a QAL2 certificate for a revenue meter.
    electricityInstruments: withMethod(raw.electricityInstruments ?? [], "calculation"),
    ownGenerationFuelDeclared: raw.ownGenerationFuelDeclared ?? false,
    /* A gap written before the reviewer moved onto the row has no name of its
       own. It inherits the document-level one rather than arriving blank —
       that IS who checked it, as far as the record ever said — and a gap added
       afterwards asks for its own. */
    dataGaps: (raw.dataGaps ?? []).map((g) => ({ ...g, reviewerName: g.reviewerName ?? raw.reviewerName ?? "", gapDate: g.gapDate ?? "" })),
    diagramCovers: raw.diagramCovers ?? [],
  };
}

export const emptyGap = (): DataGapRow => ({
  id: uid(),
  periodStart: "",
  periodEnd: "",
  reason: "",
  estimationMethod: "",
  estimatedTCO2e: 0,
  reviewerName: "",
  gapDate: "",
});

/* ════════════════════════════════════════════════════════════
   THE WORKED EXAMPLE — Siam Steel

   Every field carries a "Show example" toggle that reveals this text inline,
   greyed and NON-DESTRUCTIVE: it is displayed beside the input, never written
   into it. An exporter can read what good looks like and then write their
   own, which is the difference between a template and a prompt.

   The content is a real answer, not lorem ipsum. The boundary names what is
   EXCLUDED as well as included, because a verifier's first completeness
   question is what was left out; the data gap says how the estimate was
   normalised, because "we estimated it" is a finding and "we estimated it
   from the mean of February and April normalised to production volume" is an
   answer.
   ════════════════════════════════════════════════════════════ */
export const MMD_EXAMPLE = {
  boundaryDescription:
    "Production process boundary for CN 7207 11 90 (steel billet) at Rayong Works Line 2. Scrap is received, weighed on WB-01 and charged to a 60-tonne electric arc furnace (EAF-1); liquid steel is refined in ladle furnace LF-1 and continuously cast into 130 mm billets on CCM-1. The boundary starts at the scrap weighbridge and ends at the billet cooling bed. It excludes the site offices and canteen, the internal vehicle fleet, and the rolling mill on Line 3, which draws from a separate substation and is reported under its own CN code.",
  processesIncluded: ["Raw material handling", "Melting (EAF)", "Casting"],
  exclusionExample:
    'Rolling mill Line 3 — ground: "Separately metered and attributed elsewhere" — note: "Fed from substation SS-02, meter E-221. Reported in the workspace for CN 7213 91 10." An exclusion with a meter number beside it is answered; the same exclusion with an empty note is a finding.',
  /* Just the answer. The rule that used to be tacked on the end of it — what
     to do when a process changes mid-year — is a rule, not an example, and it
     now lives behind the section's help tip where a reader can choose to open
     it. An "example" that is three sentences of policy is not an example. */
  period: "1 January 2026 to 31 December 2026",
  /* The example is now a MIXED boundary, because that is the case the single
     card-level setting could not express and the one an exporter is most
     likely to get wrong. Annex II B.2 permits it; the screen has to show that
     it does, or a plant with a CEMS on one stack files the whole document as
     measurement-based and owes a QAL2 certificate for its diesel genset. */
  directMethod:
    "Set per instrument, not once for the plant. The EAF stack analyser is measurement-based and carries its own QAL2 certificate; the ladle-preheater gas meter and the standby generator's diesel are calculation-based — activity data × emission factor × oxidation factor. Annex II B.2 allows the two to be combined, one choice per source stream.",
  fuelTypes:
    "Natural gas (pipeline) for the ladle preheaters, and diesel for the standby generator and yard handling equipment. Both appear as fuel rows every month; the methodology lists them so a month with an unexpected third fuel is visible as an exception.",
  electricitySupply: "Grid — Provincial Electricity Authority (PEA)",
  electricityMeteringPoint:
    "Single 115 kV incoming feeder into substation SS-01, revenue meter PEA-88214, read monthly against the PEA invoice. Furnace load is sub-metered at E-101 but the reported figure is the incoming feeder, because that is the figure the invoice evidences.",
  instrument: "Endress+Hauser Promag 400 electromagnetic flow meter, tag FT-2201, DN80, ±0.5% of reading",
  readingFrequency: "Monthly",
  lastCalibration: "2026-03-15",
  factorSource: "EU standard value",
  dataGap:
    "1–15 March 2026. Gas meter FT-2201 failed on 1 March and was replaced on 15 March. Consumption for the gap was estimated as the mean of February and April consumption per tonne of billet, multiplied by March's actual billet output — 41,300 m³, giving 2.32 tCO₂. \"Estimated\" on its own is a finding; the sentence above is an answer, because a verifier can recompute it.",
  qualityAssurance: "Four eyes principle",
  reviewerName: "N. Sae-Ngow, Energy Manager",
  reviewFrequency: "Monthly, against the PEA invoice and the gas supplier's delivery note, before the month is submitted",
} as const;

/* ── Section explanations ───────────────────────────────────────
   What each card is FOR, in one sentence, from the point of view of the person
   who will read the finished document. Every heading on the MMD screen carries
   one, because the field names alone assume the reader already knows what a
   monitoring methodology is — and the exporter filling it in for the first
   time is precisely the person who does not. */
export const MMD_SECTION_HELP = {
  boundary:
    "Draw the line around what you are reporting. A verifier's first question is always what happens on this site that is NOT in these numbers, and why that is correct.",
  period:
    "The window every figure in this workspace belongs to. It is the calendar year, and it does not stretch to cover a change in how you produce.",
  parameters: "What you measure and how you turn it into a CO₂ figure. Naming the fuels here makes an unexpected fuel next March visible as an exception.",
  measurement:
    "For each thing you measure: the instrument, how often it is read, when it was last calibrated, and where its factor comes from. An uncalibrated instrument is the fastest route to a qualified opinion.",
  gaps: "Where primary data was missing and how you filled it. A gap you declared and quantified is manageable; one a verifier finds is not.",
  quality: "What stops an error reaching the filing. Somebody's name, and how often they look.",
  diagram:
    "One drawing that lets a verifier check the boundary you described against the plant that exists. A required element of the monitoring plan — Annex II A.5(13) of IR (EU) 2025/2547 — not an optional extra.",
} as const;

/* ── Store ──────────────────────────────────────────────────────
   Draft and finalised versions live side by side. The draft is what the
   editor writes to on every keystroke; a version is an immutable snapshot. */
const DRAFT_KEY = "certrace:workspace-mmd-draft";
const VERSIONS_KEY = "certrace:workspace-mmd-versions";

function readJson<T>(key: string): Record<string, T> {
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

function writeJson<T>(key: string, value: Record<string, T>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function loadDraft(workspaceId: string, periodStart: string, periodEnd: string): WorkspaceMmdContent {
  const stored = readJson<LegacyMmd>(DRAFT_KEY)[workspaceId];
  if (stored) return migrateMmd(stored, periodStart, periodEnd);
  // A new draft starts from the latest final version, so editing an MMD is
  // amending it rather than retyping a year of methodology from scratch.
  const latest = latestVersion(workspaceId);
  return latest ? migrateMmd(latest.content, periodStart, periodEnd) : emptyMmd(periodStart, periodEnd);
}

export function saveDraft(workspaceId: string, content: WorkspaceMmdContent): WorkspaceMmdContent {
  const store = readJson<WorkspaceMmdContent>(DRAFT_KEY);
  store[workspaceId] = content;
  writeJson(DRAFT_KEY, store);
  return content;
}

/* A FINALISED VERSION IS MIGRATED ON READ TOO, not only the draft.

   A stamped version is immutable in what it SAYS; it is not immutable in the
   shape it is stored in. Reading v1 back without migrating it returned rows
   with no monitoring method at all, so a measurement-based MMD finalised in
   March reopened in August as calculation-based — CEMS fields populated, no
   longer required, no longer displayed. Every read goes through the same
   migration as the draft, so the document a verifier was handed still reads
   the way it was signed. */
export const listVersions = (workspaceId: string): WorkspaceMmdVersion[] =>
  (readJson<WorkspaceMmdVersion[]>(VERSIONS_KEY)[workspaceId] ?? [])
    .map((v) => ({ ...v, content: migrateMmd(v.content, v.periodStart, v.periodEnd) }))
    .sort((a, b) => a.n - b.n);

export function latestVersion(workspaceId: string): WorkspaceMmdVersion | null {
  const all = listVersions(workspaceId);
  return all.length > 0 ? all[all.length - 1] : null;
}

/** The final version covering a given period, or null.

    "Covering" means its own period CONTAINS the workspace's year. A methodology
    finalised for H1 does not describe how December was monitored, and treating
    it as though it did is exactly the gap a verifier finds by reading dates. */
export function finalVersionCovering(workspaceId: string, periodStart: string, periodEnd: string): WorkspaceMmdVersion | null {
  return listVersions(workspaceId).find((v) => v.periodStart <= periodStart && v.periodEnd >= periodEnd) ?? null;
}

export function finaliseVersion(workspaceId: string, content: WorkspaceMmdContent, author: string): WorkspaceMmdVersion {
  const store = readJson<WorkspaceMmdVersion[]>(VERSIONS_KEY);
  const existing = store[workspaceId] ?? [];
  const version: WorkspaceMmdVersion = {
    id: uid(),
    workspaceId,
    n: existing.length + 1,
    finalisedAt: new Date().toISOString(),
    author,
    content: { ...content },
    periodStart: content.periodStart,
    periodEnd: content.periodEnd,
  };
  store[workspaceId] = [...existing, version];
  writeJson(VERSIONS_KEY, store);
  return version;
}

export function removeMmdForWorkspace(workspaceId: string): void {
  const drafts = readJson<WorkspaceMmdContent>(DRAFT_KEY);
  delete drafts[workspaceId];
  writeJson(DRAFT_KEY, drafts);
  const versions = readJson<WorkspaceMmdVersion[]>(VERSIONS_KEY);
  delete versions[workspaceId];
  writeJson(VERSIONS_KEY, versions);
}

/* ── Completeness ───────────────────────────────────────────────
   What has to be filled before finalising is meaningful. Not a hard block on
   the button — an exporter with a genuinely empty data-gap register should be
   able to finalise — but every gap is named so nothing is finalised by
   accident. */
export type MmdIssue = { field: string; message: string };

export function mmdIssues(c: WorkspaceMmdContent): MmdIssue[] {
  const issues: MmdIssue[] = [];

  if (!c.boundaryDescription.trim()) {
    issues.push({
      field: "boundaryDescription",
      message: "Boundary description is empty. Describe the PRODUCTION PROCESS boundary — not the site fence — and say what is excluded.",
    });
  }
  if (c.processesIncluded.length === 0) {
    issues.push({ field: "processesIncluded", message: "No processes are marked as included. A boundary with nothing inside it cannot be verified." });
  }
  if (!c.periodStart || !c.periodEnd) {
    issues.push({ field: "period", message: "Reporting period is incomplete." });
  } else if (c.periodStart >= c.periodEnd) {
    issues.push({ field: "period", message: "Reporting period ends before it starts." });
  }
  /* AT LEAST ONE FUEL HAS TO BE PICKED FROM THE LIST. A description typed into
     the "Other" box used to satisfy this on its own, which let a plant burning
     natural gas file the whole boundary as one line of free text — unsummable
     across twelve months, and unmatched against the monthly rows, which hold
     ids rather than prose. */
  if (c.fuelTypeIds.length === 0) {
    issues.push({ field: "fuelTypes", message: "No fuel is listed. Choose every fuel burned inside the boundary across the year — at least one, and anything unlisted goes in under Other fuel." });
  }
  if (c.fuelTypeIds.includes("other") && !c.fuelTypesOther.trim()) {
    issues.push({ field: "fuelTypesOther", message: '"Other fuel" is selected but not described. Name it in the terms your invoices use.' });
  }
  if (!c.electricitySupply) {
    issues.push({ field: "electricitySupply", message: "Electricity source is not set. The category decides which emission factor is admissible, so it cannot be left open." });
  }
  if (c.electricitySupply === "other" && !c.electricitySupplyOther.trim()) {
    issues.push({ field: "electricitySupplyOther", message: "Electricity source is set to Other with no description." });
  }
  if (!c.electricityMeteringPoint.trim()) {
    issues.push({ field: "electricityMeteringPoint", message: "No electricity metering point named. A verifier reconciles the reported MWh against one specific meter." });
  }
  // Every declared exclusion needs its ground substantiated. This is the check
  // that makes the exclusions list mean something — without it the section is
  // a bin with extra steps.
  c.exclusions.forEach((x, i) => {
    if (!x.process.trim()) {
      issues.push({ field: `exclusion:${x.id}`, message: `Exclusion ${i + 1} does not name a process.` });
    }
    // "Other" without the ground written out is the ground left unstated. The
    // detail line below it answers a different question, so it cannot stand in.
    if (x.ground === "other" && !x.groundOther.trim()) {
      issues.push({
        field: `exclusion:${x.id}:groundOther`,
        message: `"${x.process || `Exclusion ${i + 1}`}" is excluded on an "other" ground that is not written out. Say what the ground is — "other" on its own is not one.`,
      });
    }
    if (!x.note.trim()) {
      issues.push({
        field: `exclusion:${x.id}:note`,
        message: `"${x.process || `Exclusion ${i + 1}`}" is excluded on the ground "${EXCLUSION_GROUND_LABEL[x.ground]}" with no detail. Name the meter, the subcontractor or the threshold — an unjustified exclusion is the most common first-engagement finding.`,
      });
    }
  });
  /* Fuel instruments are required ONCE A FUEL IS DECLARED, not always — a
     plant that burns nothing has nothing to meter, and demanding a row from
     it is a gate it cannot pass. */
  if (c.fuelTypeIds.length > 0 && c.fuelInstruments.length === 0) {
    issues.push({
      field: "fuelInstruments",
      message: "Fuels are declared but no instrument measures them. Add one row per fuel — what is measured, on what, how often, and when it was last calibrated.",
    });
  }
  if (c.electricitySupply && c.electricityInstruments.length === 0) {
    issues.push({
      field: "electricityInstruments",
      message: "An electricity supply is set but no meter is recorded. Add the meter the reported MWh is read from.",
    });
  }
  /* Card 3. The checkbox is the only thing standing between an on-site
     turbine and its fuel being counted twice. */
  if (isOwnGeneration(c.electricitySupply) && !c.ownGenerationFuelDeclared) {
    issues.push({
      field: "ownGenerationFuelDeclared",
      message: "You generate electricity on site. Confirm the fuel that generation burns is already in the fuel list above — otherwise it is either missing or counted twice.",
    });
  }
  [...c.fuelInstruments, ...c.electricityInstruments].forEach((m, i) => {
    /* PARAMETER AND INSTRUMENT ARE TWO QUESTIONS, so they are two findings.
       One message covering both sent the reader to a row without saying which
       of the two boxes to fill, and on a row where both were empty they filled
       one and hit the same message again. */
    if (!m.parameter.trim()) {
      issues.push({ field: `measurement:${m.id}:parameter`, message: `Instrument row ${i + 1} does not say what it measures.` });
    }
    if (!m.instrument.trim()) {
      issues.push({
        field: `measurement:${m.id}:instrument`,
        message: `${m.parameter || `Instrument row ${i + 1}`} has no instrument named. Give the make, model and tag — enough for a verifier to find it on the plant.`,
      });
    }
    if (!m.readingFrequency) {
      issues.push({ field: `measurement:${m.id}:frequency`, message: `${m.parameter || `Measurement row ${i + 1}`} has no reading frequency.` });
    }
    if (m.readingFrequency === "other" && !m.readingFrequencyOther?.trim()) {
      issues.push({ field: `measurement:${m.id}:frequency`, message: `${m.parameter || `Measurement row ${i + 1}`} has an "Other" reading frequency that is not described.` });
    }
    if (!m.lastCalibration) {
      issues.push({
        field: `measurement:${m.id}:calibration`,
        message: `${m.parameter || `Measurement row ${i + 1}`} has no calibration date. An uncalibrated instrument is the fastest route to a qualified opinion.`,
      });
    }
    /* Measurement-based means a CEMS, and a CEMS without its QAL2 reference
       and its sampling location is a claim a verifier cannot test.

       Asked PER ROW. The boundary as a whole no longer has a method — Annex II
       B.2 of IR (EU) 2025/2547 lets the two be combined per source stream — so
       the row that says "measurement" is the row that owes the QAL2 record,
       and the invoiced diesel genset beside it owes nothing. */
    if (m.directMethod === "measurement" && c.fuelInstruments.some((f) => f.id === m.id)) {
      if (!m.cemsCalibrationRef?.trim()) {
        issues.push({
          field: `measurement:${m.id}:cems`,
          message: `${m.parameter || `Measurement row ${i + 1}`} is measurement-based with no CEMS calibration reference. Give the QAL2 certificate number.`,
        });
      }
      if (!m.measurementPointLocation?.trim()) {
        issues.push({
          field: `measurement:${m.id}:point`,
          message: `${m.parameter || `Measurement row ${i + 1}`} has no measurement point. Say where in the duct or stack the sample is taken.`,
        });
      }
    }
  });
  /* ── Declared gaps ────────────────────────────────────────────
     DECLARING ONE IS OPTIONAL. FINISHING ONE IS NOT. A year where every figure
     came off a working instrument has no gaps, and the register is rightly
     empty. But a half-filled gap row is worse than no row: it tells a verifier
     something was estimated and refuses to say when, why, how, or who checked
     it — which is four follow-up questions instead of none. */
  c.dataGaps.forEach((g, i) => {
    const named = `Data gap ${i + 1}`;
    if (!g.periodStart || !g.periodEnd) {
      issues.push({ field: `gap:${g.id}:period`, message: `${named} does not say which dates it covers. A gap without a period cannot be checked against the month it falls in.` });
    } else if (g.periodStart > g.periodEnd) {
      issues.push({ field: `gap:${g.id}:period`, message: `${named} ends before it starts.` });
    }
    if (!g.reason.trim()) {
      issues.push({ field: `gap:${g.id}:reason`, message: `${named} does not say what happened. Name the instrument and what went wrong with it.` });
    }
    if (!g.estimationMethod.trim()) {
      issues.push({ field: `gap:${g.id}:estimationMethod`, message: `${named} has no estimation method. "Estimated" on its own is a finding; how it was estimated is an answer.` });
    }
    if (!g.reviewerName.trim()) {
      issues.push({
        field: `gap:${g.id}:reviewerName`,
        message: `${named} does not name a reviewer of record. A verifier asks for a person, not a department — and they ask it about this gap, not about the year.`,
      });
    }
    if (!g.gapDate) {
      issues.push({
        field: `gap:${g.id}:gapDate`,
        message: `${named} has a reviewer named but no date they reviewed it. A name with no date is not evidence a review took place.`,
      });
    }
  });
  if (c.qualityAssurance !== "none" && !c.reviewerName.trim()) {
    issues.push({ field: "reviewerName", message: "A quality-assurance method is claimed with no reviewer named. A verifier will ask who." });
  }
  /* The diagram is a REQUIRED ELEMENT of the monitoring plan — Annex II
     A.5(13) — not an optional attachment, so a methodology finalised without
     one is finalised incomplete. It was not checked here at all while the
     diagram was believed to be a Certrace convenience. */
  if (!c.diagramFileName) {
    issues.push({
      field: "diagram",
      message:
        "No installation diagram attached. Annex II A.5(13) makes it a required element of the monitoring plan: it has to show the system boundaries and evidence that nothing is double counted or missing.",
    });
  }

  return issues;
}

export const mmdComplete = (c: WorkspaceMmdContent): boolean => mmdIssues(c).length === 0;

/* ── What the SUPPLIER's methodology step is answerable for ─────
   `mmdIssues` covers the whole document, and three of its rules belong to
   parts of it the supplier is never shown: the reporting period (set by the
   workspace), the quality-assurance method, and the installation diagram —
   which is the exporter's to draw and upload. Gating the supplier's Continue
   on the full list would put a wall in front of them that nothing on their
   screen can take down.

   So the step gate reads THIS. Same rules, same messages, same field keys —
   filtered to the fields the supplier's form actually renders. One list, one
   filter, so the two can never disagree about what is required. */
const SUPPLIER_MMD_EXCLUDED = ["period", "diagram", "reviewerName"];

export const supplierMmdIssues = (c: WorkspaceMmdContent): MmdIssue[] =>
  mmdIssues(c).filter((i) => !SUPPLIER_MMD_EXCLUDED.includes(i.field));

/** field key → message, for the red state on the box itself. The first message
    wins where a field has more than one, because a box can only be red once
    and the reader fixes them in order anyway. */
export function mmdFieldErrors(issues: MmdIssue[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const i of issues) if (!map[i.field]) map[i.field] = i.message;
  return map;
}

/** Total tCO₂e attributed to data gaps — the numerator of the materiality
    self-check in lib/readiness.ts. */
export const estimatedGapTCO2e = (c: WorkspaceMmdContent): number =>
  c.dataGaps.reduce((a, g) => a + (Number(g.estimatedTCO2e) || 0), 0);

export const DRAFT_BANNER =
  "This MMD is a DRAFT. It does not satisfy the readiness gate, and a verifier engaged against a draft methodology will ask for the final one before starting. Finalise it when the methodology is settled — editing afterwards forks a new version rather than changing this one.";
