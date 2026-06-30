/*
  Scalability backbone.

  Regulations, jurisdictions and sectors are DATA, not screens. The product
  expands from CBAM → EUDR/CSRD/Scope 3 and from steel → aluminium/cement, and
  from Thailand → SE Asia, by flipping `available` here — no new UI is required.

  MVP launch posture (June 2026): CBAM is the only LIVE regulation, and within
  CBAM only Steel & iron is open. Everything else renders as "coming soon" with
  a real waitlist path — nothing is a dead end.
*/

export type Status = "live" | "soon" | "rollout" | "planned";

export type Regulation = {
  id: string;
  short: string; // display-font name
  full: string;
  authority: string; // who receives the submission
  status: Status;
  available: boolean; // can an exporter start a real declaration today?
  /** The activity fields a supplier must report — drives the guided form + calc. */
  dataPoints: string[];
  /** What "done" requires — drives the compliance gap engine. */
  requirements: string[];
  cadence: string;
  /** One-line "why it's coming" note for soon items. */
  soonNote?: string;
};

export type Jurisdiction = {
  code: string; // ISO-ish origin
  name: string;
  flag: string; // text glyph only — no images (DS: no stock imagery)
  status: Status;
  available: boolean;
  currency: string;
  locale: string;
  /** Localised emission-factor library reference — the per-country variable. */
  factorSet: string;
  note: string;
};

export type DestinationMarket = {
  code: string;
  name: string;
  regulations: string[]; // regulation ids enforced by this market
};

export type ProductSector = {
  id: string;
  name: string;
  cnHint: string;
  regs: string[];
  available: boolean;
  soonNote?: string;
};

export const REGULATIONS: Regulation[] = [
  {
    id: "cbam",
    short: "CBAM",
    full: "Carbon Border Adjustment Mechanism",
    authority: "EU CBAM Registry · via importer / declarant",
    status: "live",
    available: true,
    cadence: "Quarterly data · annual declaration",
    dataPoints: [
      "Production route & process",
      "Direct (Scope 1) emissions",
      "Indirect (electricity) emissions",
      "Precursor / input materials",
      "Carbon price paid in country of origin",
    ],
    requirements: [
      "Installation identification",
      "Embedded emissions per tonne (tCO₂e/t)",
      "Verified emission factors or actual data",
      "Carbon price evidence",
      "Accredited verifier report",
    ],
  },
  {
    id: "eudr",
    short: "EUDR",
    full: "EU Deforestation Regulation",
    authority: "EU TRACES · Due Diligence Statement",
    status: "soon",
    available: false,
    cadence: "Per shipment",
    soonNote: "Geolocation & due-diligence engine in build — live Q4 2026.",
    dataPoints: ["Geolocation of plots", "Production date / period", "Volume & species", "Legality documents"],
    requirements: ["Geo-coordinates", "Deforestation-free proof", "Legality of production", "Due diligence statement"],
  },
  {
    id: "csrd",
    short: "CSRD",
    full: "Corporate Sustainability Reporting Directive",
    authority: "Statutory ESG report (ESRS)",
    status: "soon",
    available: false,
    cadence: "Annual",
    soonNote: "ESRS datapoint mapping in design — live 2027.",
    dataPoints: ["Scope 1 & 2 emissions", "Scope 3 categories", "Energy mix", "ESRS datapoints"],
    requirements: ["ESRS-aligned disclosures", "Double materiality", "Assured data"],
  },
  {
    id: "scope3",
    short: "Scope 3",
    full: "GHG Protocol · Supply-chain (Scope 3)",
    authority: "Buyer-driven request",
    status: "soon",
    available: false,
    cadence: "Ongoing",
    soonNote: "Buyer-request workflow on the roadmap.",
    dataPoints: ["Purchased goods emissions", "Activity data", "Allocation method"],
    requirements: ["Category coverage", "Primary vs secondary data", "Methodology disclosure"],
  },
  {
    id: "uk-cbam",
    short: "UK CBAM",
    full: "United Kingdom Carbon Border Adjustment",
    authority: "HMRC (from 2027)",
    status: "soon",
    available: false,
    cadence: "Quarterly",
    soonNote: "Tracking HMRC guidance — opens ahead of the 2027 start.",
    dataPoints: ["Embedded emissions", "Production data"],
    requirements: ["Embedded emissions per tonne", "Verification"],
  },
];

export const JURISDICTIONS: Jurisdiction[] = [
  {
    code: "TH",
    name: "Thailand",
    flag: "TH",
    status: "live",
    available: true,
    currency: "THB",
    locale: "th-TH",
    factorSet: "TGO / อบก. emission factors",
    note: "Beachhead market — steel & iron exporters to the EU.",
  },
  {
    code: "VN",
    name: "Vietnam",
    flag: "VN",
    status: "soon",
    available: false,
    currency: "VND",
    locale: "vi-VN",
    factorSet: "MONRE national factors",
    note: "Coming soon · electronics, steel, textiles.",
  },
  {
    code: "ID",
    name: "Indonesia",
    flag: "ID",
    status: "soon",
    available: false,
    currency: "IDR",
    locale: "id-ID",
    factorSet: "KLHK / SISPEK factors",
    note: "Coming soon · aluminium, palm oil (EUDR).",
  },
  {
    code: "MY",
    name: "Malaysia",
    flag: "MY",
    status: "planned",
    available: false,
    currency: "MYR",
    locale: "ms-MY",
    factorSet: "MGTC factors",
    note: "Planned · rubber, palm oil, electronics.",
  },
];

export const DESTINATION_MARKETS: DestinationMarket[] = [
  { code: "EU", name: "European Union", regulations: ["cbam", "eudr", "csrd", "scope3"] },
  { code: "UK", name: "United Kingdom", regulations: ["uk-cbam", "scope3"] },
  { code: "US", name: "United States", regulations: ["scope3"] },
];

// CBAM goods, by Annex I aggregated category. Steel & iron is open at launch;
// the rest are gated until their factor libraries + calc routes are verified.
export const PRODUCT_SECTORS: ProductSector[] = [
  { id: "steel", name: "Steel & iron", cnHint: "CN 72, 73", regs: ["cbam"], available: true },
  { id: "aluminium", name: "Aluminium", cnHint: "CN 76", regs: ["cbam"], available: false, soonNote: "Smelter routes in verification — opens next." },
  { id: "cement", name: "Cement", cnHint: "CN 2523", regs: ["cbam"], available: false, soonNote: "Clinker factors in build." },
  { id: "fertiliser", name: "Fertilisers", cnHint: "CN 31", regs: ["cbam"], available: false, soonNote: "On the roadmap." },
  { id: "hydrogen", name: "Hydrogen", cnHint: "CN 2804", regs: ["cbam"], available: false, soonNote: "On the roadmap." },
  { id: "electricity", name: "Electricity", cnHint: "CN 2716", regs: ["cbam"], available: false, soonNote: "On the roadmap." },
];

export const STATUS_META: Record<Status, { label: string; tone: "ok" | "info" | "warn" | "muted" }> = {
  live: { label: "live", tone: "ok" },
  soon: { label: "coming soon", tone: "muted" },
  rollout: { label: "rollout", tone: "info" },
  planned: { label: "planned", tone: "muted" },
};

/* ── Pricing ────────────────────────────────────────────────
   Real, launch-ready plans. Suppliers are always free and never
   take a seat — that's the wedge. Priced in EUR (CBAM is an EU regime;
   exporters budget the obligation in EUR). Annual billing ≈ 2 months free. */

export type Plan = {
  id: "starter" | "growth" | "scale";
  name: string;
  tagline: string;
  monthly: number; // EUR / month, billed monthly
  annual: number; // EUR / month, billed annually
  highlight?: boolean;
  ctaKind: "downgrade" | "current" | "upgrade" | "contact";
  limits: { seats: string; declarations: string; origins: string };
  features: string[];
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "One exporter, one regime. Get a clean CBAM filing out the door.",
    monthly: 290,
    annual: 240,
    ctaKind: "downgrade",
    limits: { seats: "3 seats", declarations: "4 declarations / year", origins: "1 origin country" },
    features: [
      "CBAM steel & iron workflow",
      "Unlimited free supplier forms",
      "Embedded-emissions calculator (TGO factors)",
      "Audit-ready PDF package",
      "Email support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "For exporters filing every quarter with legal + verifier in the loop.",
    monthly: 790,
    annual: 660,
    highlight: true,
    ctaKind: "current",
    limits: { seats: "8 seats", declarations: "Unlimited declarations", origins: "1 origin country" },
    features: [
      "Everything in Starter",
      "Legal & verifier sign-off seats",
      "Auditor portal (scoped source-data access)",
      "Compliance gap engine + carbon-price deductions",
      "Submission receipts to buyer + authority",
      "Priority support",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    tagline: "Multi-entity groups and trading houses. Custom factors, SSO, API.",
    monthly: 0,
    annual: 0,
    ctaKind: "contact",
    limits: { seats: "Unlimited seats", declarations: "Unlimited declarations", origins: "Multi-origin & multi-entity" },
    features: [
      "Everything in Growth",
      "Multiple legal entities & origins",
      "SSO / SAML + audit logging",
      "API access & ERP connectors",
      "Custom & primary emission factors",
      "Dedicated onboarding + SLA",
    ],
  },
];

export const getRegulation = (id: string) => REGULATIONS.find((r) => r.id === id);
export const getJurisdiction = (code: string) => JURISDICTIONS.find((j) => j.code === code);
export const getSector = (id: string) => PRODUCT_SECTORS.find((p) => p.id === id);
export const getPlan = (id: string) => PLANS.find((p) => p.id === id);
