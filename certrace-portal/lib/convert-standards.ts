/* ════════════════════════════════════════════════════════════
   CONVERT — STANDARDS CATALOGUE

   The six standards a workspace's data can be converted into and the
   requirements each one asks for. Readiness is not stored here: it is worked
   out from the installation and workbook data (lib/convert/requirements.ts).
   Only EU CBAM is live; the other five are listed as coming soon (the same
   set and order as the public site's lib/nav-menu.ts REGULATIONS).
   ════════════════════════════════════════════════════════════ */

export type StandardStatus = "in-progress" | "ready" | "soon";

export type RequirementState = "complete" | "in-progress" | "missing";

export type Requirement = {
  id: string;
  title: string;
  detail: string;
  /** Catalogue default fix: a supplier gap is chased through a Smart Link, an own gap is filled in. */
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
    detail:
      "Name, address, coordinates of the main emission source and the authorised representative — section 2 of the CBAM communication template.",
  },
  {
    id: "goods",
    title: "Goods, CN codes and production routes",
    detail:
      "Each good is matched to its CN code and the production route the EU names for it.",
  },
  {
    id: "direct",
    title: "Direct emissions — fuels and materials",
    detail:
      "Monthly fuel and process-material quantities with their emission factors.",
    fix: "fill-in",
  },
  {
    id: "indirect",
    title: "Indirect emissions — electricity",
    detail: "Electricity consumed per month and the grid emission factor used.",
  },
  {
    id: "precursors",
    title: "Precursors — embedded emissions",
    detail:
      "Embedded emissions of the precursors bought in. Each supplier's verified figures are needed.",
    fix: "smart-link",
  },
  {
    id: "carbon-price",
    title: "Carbon price paid",
    detail:
      "Any carbon price effectively paid in the country of production, with evidence. Leave empty if none applies.",
    fix: "fill-in",
  },
  {
    id: "monitoring",
    title: "Monitoring methodology document",
    detail:
      "How the installation's emissions are monitored — Annex IV of Implementing Regulation (EU) 2025/2547.",
    fix: "fill-in",
  },
  {
    id: "communication",
    title: "Supplier communication sheets",
    detail:
      "The communication template each supplier returns for the goods they deliver.",
    fix: "smart-link",
  },
  {
    id: "verification",
    title: "Verification statement",
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
    description:
      "Quantification and reporting of an organisation's GHG emissions.",
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
