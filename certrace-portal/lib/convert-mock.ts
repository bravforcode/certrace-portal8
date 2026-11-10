/* ════════════════════════════════════════════════════════════
   CONVERT — MOCK DATA

   Everything on the Convert screens is placeholder data for now: the six
   standards a workspace's data can be converted into, the readiness of each
   requirement, and the reports already produced. Only EU CBAM is live; the
   other five are listed as coming soon (the same set and order as the public
   site's lib/nav-menu.ts REGULATIONS).
   ════════════════════════════════════════════════════════════ */

export type StandardStatus = "in-progress" | "ready" | "soon";

export type RequirementState = "complete" | "in-progress" | "missing";

export type Requirement = {
  id: string;
  title: string;
  state: RequirementState;
  /** e.g. "8 of 12 months" — shown beside the state. */
  progress?: string;
  detail: string;
  /** What fixes it: a supplier gap is chased through a Smart Link, an own gap is filled in. */
  fix?: "smart-link" | "fill-in";
};

export type Standard = {
  id: string;
  name: string;
  region: string;
  description: string;
  status: StandardStatus;
  logo: "eu" | "uk" | "iso" | "leaf";
  requirements: Requirement[];
};

const EU_CBAM_REQUIREMENTS: Requirement[] = [
  {
    id: "installation",
    title: "Installation details",
    state: "complete",
    detail:
      "Name, address, coordinates of the main emission source and the authorised representative — section 2 of the CBAM communication template.",
  },
  {
    id: "goods",
    title: "Goods, CN codes and production routes",
    state: "complete",
    detail:
      "Each good is matched to its CN code and the production route the EU names for it.",
  },
  {
    id: "direct",
    title: "Direct emissions — fuels and materials",
    state: "in-progress",
    progress: "8 of 12 months",
    detail:
      "Monthly fuel and process-material quantities with their emission factors. Four months are still open.",
    fix: "fill-in",
  },
  {
    id: "indirect",
    title: "Indirect emissions — electricity",
    state: "complete",
    detail: "Electricity consumed per month and the grid emission factor used.",
  },
  {
    id: "precursors",
    title: "Precursors — embedded emissions",
    state: "missing",
    progress: "2 suppliers to chase",
    detail:
      "Embedded emissions of the precursors bought in. Two suppliers have not sent their verified figures yet.",
    fix: "smart-link",
  },
  {
    id: "carbon-price",
    title: "Carbon price paid",
    state: "missing",
    detail:
      "Any carbon price effectively paid in the country of production, with evidence. Leave empty if none applies.",
    fix: "fill-in",
  },
  {
    id: "monitoring",
    title: "Monitoring methodology document",
    state: "in-progress",
    progress: "3 of 5 sections",
    detail:
      "How the installation's emissions are monitored — Annex IV of Implementing Regulation (EU) 2025/2547.",
    fix: "fill-in",
  },
  {
    id: "communication",
    title: "Supplier communication sheets",
    state: "in-progress",
    progress: "3 of 5 received",
    detail:
      "The communication template each supplier returns for the goods they deliver.",
    fix: "smart-link",
  },
  {
    id: "verification",
    title: "Verification statement",
    state: "missing",
    detail:
      "The accredited verifier's statement on the emissions report. Needed for actual values from 2026.",
    fix: "fill-in",
  },
];

export const STANDARDS: Standard[] = [
  {
    id: "eu-cbam",
    name: "EU CBAM",
    region: "European Union",
    description:
      "The EU Carbon Border Adjustment Mechanism. Turn your workspace data into the emissions report and communication template your EU buyers, verifiers and the CBAM Registry ask for — embedded emissions per good, precursors and electricity included.",
    status: "in-progress",
    logo: "eu",
    requirements: EU_CBAM_REQUIREMENTS,
  },
  {
    id: "uk-cbam",
    name: "UK CBAM",
    region: "United Kingdom",
    description: "The UK's carbon border adjustment, starting 2027.",
    status: "soon",
    logo: "uk",
    requirements: [],
  },
  {
    id: "iso-14064-1",
    name: "ISO 14064-1",
    region: "Organisational greenhouse gas inventory",
    description: "Quantification and reporting of an organisation's GHG emissions.",
    status: "soon",
    logo: "iso",
    requirements: [],
  },
  {
    id: "iso-14067",
    name: "ISO 14067",
    region: "Product carbon footprint",
    description: "Quantification of the carbon footprint of a product.",
    status: "soon",
    logo: "iso",
    requirements: [],
  },
  {
    id: "cfp",
    name: "CFP",
    region: "Product carbon footprint",
    description: "Carbon Footprint of Products.",
    status: "soon",
    logo: "leaf",
    requirements: [],
  },
  {
    id: "cfo",
    name: "CFO",
    region: "Organisational carbon footprint",
    description: "Carbon Footprint for Organisations.",
    status: "soon",
    logo: "leaf",
    requirements: [],
  },
];

export const getStandard = (id: string) =>
  STANDARDS.find((s) => s.id === id) ?? null;

/** Share of requirements complete, 0–100. */
export const readiness = (s: Standard) =>
  s.requirements.length === 0
    ? 0
    : Math.round(
        (s.requirements.filter((r) => r.state === "complete").length /
          s.requirements.length) *
          100,
      );

export type ConvertedReport = {
  id: string;
  standardId: string;
  title: string;
  /** Reporting year — the EU CBAM page shows the history one year at a time. */
  year: number;
  period: string;
  createdAt: string;
  format: string;
};

/* The reporting years themselves come from lib/year-range.ts (the shared year bar). */

export const REPORTS: ConvertedReport[] = [
  {
    id: "r-2026-q2",
    standardId: "eu-cbam",
    title: "EU CBAM report package — Hot-rolled coil",
    year: 2026,
    period: "Q2 2026",
    createdAt: "2026-07-14",
    format: "ZIP",
  },
  {
    id: "r-2026-q1",
    standardId: "eu-cbam",
    title: "EU CBAM communication template — Hot-rolled coil",
    year: 2026,
    period: "Q1 2026",
    createdAt: "2026-04-11",
    format: "XLSX",
  },
];
