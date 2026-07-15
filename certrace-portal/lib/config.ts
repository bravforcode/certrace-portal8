/*
  Scalability backbone.

  Regulations, jurisdictions and sectors are DATA, not screens. The product
  expands from CBAM → EUDR/CSRD/Scope 3 and from steel → aluminium/cement, and
  from Thailand → SE Asia, by flipping `available` here — no new UI is required.

  Readiness posture (July 2026): CBAM is the only live regulation. Steel and
  aluminium are enabled; other sectors remain explicitly unavailable.
*/

import { classifyCnCode } from "./mrv";

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
  flag: string; // text glyph only — no images (DS: no stock imagery)
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
    cadence: "Annual operator data · annual declaration",
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
      "Accredited verification for actual values",
      "Carbon price evidence",
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
  { code: "EU", name: "European Union", flag: "EU", regulations: ["cbam", "eudr", "csrd", "scope3"] },
  { code: "UK", name: "United Kingdom", flag: "UK", regulations: ["uk-cbam", "scope3"] },
  { code: "US", name: "United States", flag: "US", regulations: ["scope3"] },
];

export const getDestination = (code: string) => DESTINATION_MARKETS.find((d) => d.code === code);
/** Destination markets that enforce a given regulation today. */
export const destinationsForRegulation = (regId: string) => DESTINATION_MARKETS.filter((d) => d.regulations.includes(regId));

// CBAM goods, by Annex I aggregated category. Steel & iron is open at launch;
// the rest are gated until their factor libraries + calc routes are verified.
export const PRODUCT_SECTORS: ProductSector[] = [
  { id: "steel", name: "Steel & iron", cnHint: "CN 72, 73", regs: ["cbam"], available: true },
  { id: "aluminium", name: "Aluminium", cnHint: "CN 76", regs: ["cbam"], available: true },
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
   Three tiers, annual only, supplier-scaled. Suppliers themselves never
   pay and never take a seat — that's the wedge — but the number of
   suppliers an org can actively collect data from is what the plan caps,
   and what an upgrade buys more of. Priced in THB (exporters budget this
   as a Thai cost centre). */

export type Plan = {
  id: "starter" | "standard" | "enterprise";
  name: string;
  tagline: string;
  annual: number; // THB / year, billed annually — the only cadence
  highlight?: boolean;
  ctaKind: "downgrade" | "current" | "upgrade" | "contact";
  supplierCap: number | null; // max suppliers included; null = talk to sales above ~150
  limits: { suppliers: string };
  features: string[];
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "One exporter, one regime. Prepare a clean CBAM data handoff.",
    annual: 180_000,
    ctaKind: "downgrade",
    supplierCap: 20,
    limits: { suppliers: "Up to 20 suppliers" },
    features: ["Guided request builder", "Local readiness dashboard", "Draft calculation preview"],
  },
  {
    id: "standard",
    name: "Standard",
    tagline: "Most fit — for exporters with a real supplier base and a buyer or verifier watching.",
    annual: 360_000,
    highlight: true,
    ctaKind: "current",
    supplierCap: 50,
    limits: { suppliers: "Up to 50 suppliers" },
    features: ["Everything in Starter", "Local reviewer workflow", "Steel & aluminium readiness templates"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Trading houses and multi-entity groups running supplier bases past 50.",
    annual: 720_000,
    ctaKind: "contact",
    supplierCap: null,
    limits: { suppliers: "50+ suppliers · custom above ~150" },
    features: ["Everything in Standard", "Priority implementation support", "Planned verifier integration support"],
  },
];

export const getRegulation = (id: string) => REGULATIONS.find((r) => r.id === id);
export const getJurisdiction = (code: string) => JURISDICTIONS.find((j) => j.code === code);
export const getSector = (id: string) => PRODUCT_SECTORS.find((p) => p.id === id);
export const getPlan = (id: string) => PLANS.find((p) => p.id === id);

/* ════════════════════════════════════════════════════════════
   CREATE-DECLARATION REFERENCE DATA

   Everything the new-declaration wizard needs lives here as DATA, so the
   flow scales the same way the rest of the product does: add a CN code, a
   unit, or a requestable document and the UI picks it up with no new screens.

   Posture: CBAM steel & iron is the live, fully-classified path. The exporter
   never hand-configures CBAM fields — Certrace derives them from the CN code.
   ════════════════════════════════════════════════════════════ */

/* ── Why are we collecting? ───────────────────────────────── */
export type Purpose = "cbam" | "buyer";
export type PurposeMeta = {
  id: Purpose;
  title: string;
  description: string;
  /** placeholder shown in the "Request name" field for this purpose */
  namePlaceholder: string;
};
export const PURPOSES: PurposeMeta[] = [
  {
    id: "cbam",
    title: "CBAM Compliance",
    description: "Automatically prepares supplier data collection based on CBAM requirements. Fields, CN codes and templates are generated for you.",
    namePlaceholder: "e.g. CBAM 2026 Annual",
  },
  {
    id: "buyer",
    title: "Buyer Request",
    description: "Create a custom supplier request for buyer-specific information — documents, certificates and questionnaires on top of the carbon data.",
    namePlaceholder: "e.g. ABC Buyer Carbon Data Request",
  },
];

/* ── Reporting period ─────────────────────────────────────── */
export type PeriodOption = {
  id: string;
  label: string;
  hint: string;
  /** which sub-picker the period needs */
  picker: "year" | "quarter" | "half" | "month" | "none" | "range";
};
// Definitive-period CBAM operator reporting and the declaration are annual.
// Commercial teams may collect working data more often, but a partial period
// must not be represented as the regulatory reporting period.
export const CBAM_PERIODS: PeriodOption[] = [
  { id: "annual", label: "Annual", hint: "Definitive-period CBAM reporting period (calendar year).", picker: "year" },
];
// Buyer requests are flexible — the buyer decides the rhythm.
export const BUYER_PERIODS: PeriodOption[] = [
  { id: "annual", label: "Annual", hint: "Once per calendar year.", picker: "year" },
  { id: "semiannual", label: "Semi-annual", hint: "One half-year at a time.", picker: "half" },
  { id: "quarterly", label: "Quarterly", hint: "One quarter at a time.", picker: "quarter" },
  { id: "monthly", label: "Monthly", hint: "One month at a time.", picker: "month" },
  { id: "onetime", label: "One-time", hint: "A single, ad-hoc collection.", picker: "none" },
  { id: "custom", label: "Custom range", hint: "Choose your own start and end dates.", picker: "range" },
];

/* ── Product search shortcuts ──────────────────────────────────
   These common commercial descriptions are a UI convenience, not the legal
   master-data boundary. Every exact CN8 code must also match the effective,
   versioned rules in lib/mrv/regulatory-data.ts. An unmatched code stays
   unclassified; callers must never substitute hot-rolled coil or another
   catalogue row. */
export type ProductCategory = "Iron & Steel" | "Aluminium";
export type CatalogProduct = {
  id: string;
  name: string;
  category: ProductCategory;
  group: string; // CBAM sub-group, drives the template label
  cnCode: string; // real CN code (CBAM Annex I scope)
  hsCode: string; // 4-digit HS heading
  keywords: string[];
};

export const PRODUCT_CATALOG: CatalogProduct[] = [
  // ── Iron & Steel · primary & precursors ──
  { id: "ironore", name: "Iron ore, agglomerated (sinter / pellets)", category: "Iron & Steel", group: "Primary inputs", cnCode: "2601 12 00", hsCode: "2601", keywords: ["ore", "sinter", "pellet", "precursor"] },
  { id: "pigiron", name: "Pig iron, non-alloy", category: "Iron & Steel", group: "Primary inputs", cnCode: "7201 10 90", hsCode: "7201", keywords: ["pig", "iron", "primary"] },
  { id: "pigiron-alloy", name: "Pig iron, alloy / spiegeleisen", category: "Iron & Steel", group: "Primary inputs", cnCode: "7201 50 90", hsCode: "7201", keywords: ["pig", "spiegeleisen", "alloy"] },
  { id: "femn", name: "Ferro-manganese", category: "Iron & Steel", group: "Primary inputs", cnCode: "7202 11 80", hsCode: "7202", keywords: ["ferro", "manganese", "alloy"] },
  { id: "fecr", name: "Ferro-chromium", category: "Iron & Steel", group: "Primary inputs", cnCode: "7202 41 10", hsCode: "7202", keywords: ["ferro", "chromium", "alloy"] },
  { id: "feni", name: "Ferro-nickel", category: "Iron & Steel", group: "Primary inputs", cnCode: "7202 60 00", hsCode: "7202", keywords: ["ferro", "nickel", "alloy"] },
  { id: "dri", name: "Direct reduced iron (DRI / HBI)", category: "Iron & Steel", group: "Primary inputs", cnCode: "7203 10 00", hsCode: "7203", keywords: ["dri", "hbi", "sponge", "reduced"] },
  { id: "granules", name: "Iron granules & powders", category: "Iron & Steel", group: "Primary inputs", cnCode: "7205 10 00", hsCode: "7205", keywords: ["granule", "powder"] },
  // ── Iron & Steel · semi-finished ──
  { id: "ingot", name: "Ingots, non-alloy steel", category: "Iron & Steel", group: "Semi-finished", cnCode: "7206 10 00", hsCode: "7206", keywords: ["ingot", "semi"] },
  { id: "billet", name: "Billets (semi-finished)", category: "Iron & Steel", group: "Semi-finished", cnCode: "7207 11 90", hsCode: "7207", keywords: ["billet", "semi"] },
  { id: "slab", name: "Slabs (semi-finished)", category: "Iron & Steel", group: "Semi-finished", cnCode: "7207 12 10", hsCode: "7207", keywords: ["slab", "semi"] },
  // ── Iron & Steel · flat products ──
  { id: "hrc", name: "Hot-rolled coil", category: "Iron & Steel", group: "Flat products", cnCode: "7208 39 00", hsCode: "7208", keywords: ["hrc", "coil", "flat", "hot rolled"] },
  { id: "hrplate", name: "Hot-rolled plate (heavy)", category: "Iron & Steel", group: "Flat products", cnCode: "7208 51 20", hsCode: "7208", keywords: ["plate", "flat", "heavy"] },
  { id: "crc", name: "Cold-rolled coil", category: "Iron & Steel", group: "Flat products", cnCode: "7209 18 99", hsCode: "7209", keywords: ["crc", "coil", "flat", "cold rolled"] },
  { id: "galv", name: "Hot-dip galvanised sheet", category: "Iron & Steel", group: "Flat products", cnCode: "7210 49 00", hsCode: "7210", keywords: ["galvanised", "galvanized", "zinc", "coated", "sheet"] },
  { id: "prepaint", name: "Pre-painted / colour-coated sheet", category: "Iron & Steel", group: "Flat products", cnCode: "7210 70 80", hsCode: "7210", keywords: ["painted", "coated", "colour", "color"] },
  { id: "tinplate", name: "Tinplate (tin-coated sheet)", category: "Iron & Steel", group: "Flat products", cnCode: "7210 12 20", hsCode: "7210", keywords: ["tinplate", "tin", "coated"] },
  { id: "narrowstrip", name: "Narrow strip (< 600 mm)", category: "Iron & Steel", group: "Flat products", cnCode: "7211 23 30", hsCode: "7211", keywords: ["strip", "narrow"] },
  { id: "narrowstrip-coated", name: "Narrow strip, coated / plated (< 600 mm)", category: "Iron & Steel", group: "Flat products", cnCode: "7212 30 00", hsCode: "7212", keywords: ["strip", "narrow", "coated", "plated", "zinc"] },
  // ── Iron & Steel · long products ──
  { id: "wirerod", name: "Wire rod (in coils)", category: "Iron & Steel", group: "Long products", cnCode: "7213 91 10", hsCode: "7213", keywords: ["wire", "rod", "long"] },
  { id: "rebar", name: "Reinforcing bar (rebar)", category: "Iron & Steel", group: "Long products", cnCode: "7214 20 00", hsCode: "7214", keywords: ["rebar", "bar", "reinforcing"] },
  { id: "merchantbar", name: "Merchant bar", category: "Iron & Steel", group: "Long products", cnCode: "7215 50 19", hsCode: "7215", keywords: ["merchant", "bar"] },
  { id: "section", name: "Sections (H / I-beams)", category: "Iron & Steel", group: "Long products", cnCode: "7216 33 00", hsCode: "7216", keywords: ["beam", "section", "structural", "h-beam", "i-beam"] },
  { id: "angle", name: "Angles (L-sections)", category: "Iron & Steel", group: "Long products", cnCode: "7216 21 00", hsCode: "7216", keywords: ["angle", "l-section"] },
  { id: "wire", name: "Steel wire", category: "Iron & Steel", group: "Long products", cnCode: "7217 10 90", hsCode: "7217", keywords: ["wire", "drawn"] },
  // ── Iron & Steel · stainless & alloy ──
  { id: "ss-semi", name: "Stainless steel, ingots & semi-finished", category: "Iron & Steel", group: "Stainless & alloy", cnCode: "7218 10 00", hsCode: "7218", keywords: ["stainless", "ingot", "semi", "inox"] },
  { id: "ss-flat", name: "Stainless flat-rolled (≥ 600 mm)", category: "Iron & Steel", group: "Stainless & alloy", cnCode: "7219 34 00", hsCode: "7219", keywords: ["stainless", "flat", "inox"] },
  { id: "ss-flat-narrow", name: "Stainless flat-rolled (< 600 mm)", category: "Iron & Steel", group: "Stainless & alloy", cnCode: "7220 20 00", hsCode: "7220", keywords: ["stainless", "flat", "narrow", "inox"] },
  { id: "ss-wirerod", name: "Stainless wire rod", category: "Iron & Steel", group: "Stainless & alloy", cnCode: "7221 00 10", hsCode: "7221", keywords: ["stainless", "wire", "rod", "inox"] },
  { id: "ss-bar", name: "Stainless bars & rods", category: "Iron & Steel", group: "Stainless & alloy", cnCode: "7222 20 00", hsCode: "7222", keywords: ["stainless", "bar"] },
  { id: "ss-wire", name: "Stainless wire", category: "Iron & Steel", group: "Stainless & alloy", cnCode: "7223 00 19", hsCode: "7223", keywords: ["stainless", "wire", "inox"] },
  { id: "alloy-semi", name: "Other alloy steel, ingots & semi-finished", category: "Iron & Steel", group: "Stainless & alloy", cnCode: "7224 10 90", hsCode: "7224", keywords: ["alloy", "ingot", "semi"] },
  { id: "alloy-flat", name: "Other alloy steel, flat-rolled", category: "Iron & Steel", group: "Stainless & alloy", cnCode: "7225 40 00", hsCode: "7225", keywords: ["alloy", "flat"] },
  { id: "alloy-flat-narrow", name: "Other alloy steel, flat-rolled (< 600 mm)", category: "Iron & Steel", group: "Stainless & alloy", cnCode: "7226 92 00", hsCode: "7226", keywords: ["alloy", "flat", "narrow"] },
  { id: "alloy-wirerod", name: "Other alloy steel, wire rod", category: "Iron & Steel", group: "Stainless & alloy", cnCode: "7227 90 95", hsCode: "7227", keywords: ["alloy", "wire", "rod"] },
  { id: "alloy-bar", name: "Other alloy steel, bars", category: "Iron & Steel", group: "Stainless & alloy", cnCode: "7228 30 00", hsCode: "7228", keywords: ["alloy", "bar"] },
  { id: "alloy-wire", name: "Other alloy steel, wire", category: "Iron & Steel", group: "Stainless & alloy", cnCode: "7229 90 90", hsCode: "7229", keywords: ["alloy", "wire"] },
  // ── Iron & Steel · tubes & pipes ──
  { id: "castironpipe", name: "Cast-iron tubes & pipes", category: "Iron & Steel", group: "Tubes & pipes", cnCode: "7303 00 90", hsCode: "7303", keywords: ["pipe", "tube", "cast iron"] },
  { id: "seamless", name: "Seamless tubes & pipes", category: "Iron & Steel", group: "Tubes & pipes", cnCode: "7304 39 88", hsCode: "7304", keywords: ["pipe", "tube", "seamless"] },
  { id: "linepipe", name: "Welded large-diameter line pipe", category: "Iron & Steel", group: "Tubes & pipes", cnCode: "7305 11 00", hsCode: "7305", keywords: ["line", "pipe", "welded", "large"] },
  { id: "weldtube", name: "Welded tubes & pipes", category: "Iron & Steel", group: "Tubes & pipes", cnCode: "7306 30 80", hsCode: "7306", keywords: ["welded", "tube", "pipe"] },
  { id: "fittings", name: "Tube & pipe fittings", category: "Iron & Steel", group: "Tubes & pipes", cnCode: "7307 19 10", hsCode: "7307", keywords: ["fitting", "flange", "elbow"] },
  // ── Iron & Steel · downstream articles ──
  { id: "sheetpiling", name: "Sheet piling", category: "Iron & Steel", group: "Articles", cnCode: "7301 10 00", hsCode: "7301", keywords: ["sheet", "piling"] },
  { id: "rails", name: "Railway rails", category: "Iron & Steel", group: "Articles", cnCode: "7302 10 22", hsCode: "7302", keywords: ["rail", "railway", "track"] },
  { id: "structures", name: "Structures (towers, bridges, frames)", category: "Iron & Steel", group: "Articles", cnCode: "7308 90 98", hsCode: "7308", keywords: ["structure", "tower", "bridge", "frame"] },
  { id: "scaffolding", name: "Scaffolding & props", category: "Iron & Steel", group: "Articles", cnCode: "7308 40 00", hsCode: "7308", keywords: ["scaffolding", "prop"] },
  { id: "tanks", name: "Reservoirs & tanks (> 300 L)", category: "Iron & Steel", group: "Articles", cnCode: "7309 00 90", hsCode: "7309", keywords: ["tank", "reservoir"] },
  { id: "drums", name: "Casks, drums & cans (≤ 300 L)", category: "Iron & Steel", group: "Articles", cnCode: "7310 10 00", hsCode: "7310", keywords: ["drum", "cask", "can"] },
  { id: "gascylinders", name: "Gas containers (cylinders)", category: "Iron & Steel", group: "Articles", cnCode: "7311 00 99", hsCode: "7311", keywords: ["gas", "cylinder", "container"] },
  { id: "fasteners", name: "Screws, bolts & nuts", category: "Iron & Steel", group: "Articles", cnCode: "7318 15 90", hsCode: "7318", keywords: ["bolt", "screw", "nut", "fastener"] },
  { id: "articles", name: "Other articles of iron or steel", category: "Iron & Steel", group: "Articles", cnCode: "7326 90 98", hsCode: "7326", keywords: ["article", "other"] },
  // ── Aluminium · unwrought ──
  { id: "al-unwrought", name: "Unwrought aluminium, not alloyed", category: "Aluminium", group: "Unwrought", cnCode: "7601 10 90", hsCode: "7601", keywords: ["unwrought", "ingot", "primary"] },
  { id: "al-unwrought-alloy", name: "Unwrought aluminium alloys", category: "Aluminium", group: "Unwrought", cnCode: "7601 20 80", hsCode: "7601", keywords: ["unwrought", "alloy", "ingot"] },
  { id: "al-powder", name: "Aluminium powders & flakes", category: "Aluminium", group: "Unwrought", cnCode: "7603 10 00", hsCode: "7603", keywords: ["powder", "flake"] },
  // ── Aluminium · wrought products ──
  { id: "al-bar", name: "Aluminium bars & rods", category: "Aluminium", group: "Wrought products", cnCode: "7604 29 10", hsCode: "7604", keywords: ["bar", "rod"] },
  { id: "al-profile", name: "Aluminium profiles (hollow)", category: "Aluminium", group: "Wrought products", cnCode: "7604 21 00", hsCode: "7604", keywords: ["profile", "extrusion", "hollow"] },
  { id: "al-wire", name: "Aluminium wire", category: "Aluminium", group: "Wrought products", cnCode: "7605 11 00", hsCode: "7605", keywords: ["wire"] },
  { id: "al-plate", name: "Aluminium plate / sheet / strip", category: "Aluminium", group: "Wrought products", cnCode: "7606 11 00", hsCode: "7606", keywords: ["plate", "sheet", "strip"] },
  { id: "al-foil", name: "Aluminium foil", category: "Aluminium", group: "Wrought products", cnCode: "7607 11 00", hsCode: "7607", keywords: ["foil"] },
  { id: "al-tube", name: "Aluminium tubes & pipes", category: "Aluminium", group: "Wrought products", cnCode: "7608 10 00", hsCode: "7608", keywords: ["tube", "pipe"] },
  // ── Aluminium · articles ──
  { id: "al-fittings", name: "Aluminium tube / pipe fittings", category: "Aluminium", group: "Articles", cnCode: "7609 00 00", hsCode: "7609", keywords: ["fitting"] },
  { id: "al-structures", name: "Aluminium structures (frames, doors)", category: "Aluminium", group: "Articles", cnCode: "7610 90 90", hsCode: "7610", keywords: ["structure", "frame", "door", "window"] },
  { id: "al-reservoir", name: "Aluminium reservoirs (> 300 L)", category: "Aluminium", group: "Articles", cnCode: "7611 00 00", hsCode: "7611", keywords: ["reservoir", "tank"] },
  { id: "al-casks", name: "Aluminium casks & drums (≤ 300 L)", category: "Aluminium", group: "Articles", cnCode: "7612 90 20", hsCode: "7612", keywords: ["cask", "drum"] },
  { id: "al-gas", name: "Aluminium gas containers", category: "Aluminium", group: "Articles", cnCode: "7613 00 00", hsCode: "7613", keywords: ["gas", "container"] },
  { id: "al-cable", name: "Aluminium stranded wire & cables", category: "Aluminium", group: "Articles", cnCode: "7614 10 00", hsCode: "7614", keywords: ["cable", "stranded", "wire"] },
  { id: "al-articles", name: "Other articles of aluminium", category: "Aluminium", group: "Articles", cnCode: "7616 99 90", hsCode: "7616", keywords: ["article", "other"] },
];

/* ── CBAM data fields ─────────────────────────────────────────
   The data points an installation reports per good under the CBAM definitive
   regime (Reg. (EU) 2023/956 and Implementing Reg. (EU) 2025/2547).

   Not every good carries the same obligation, so each field declares:
   • `scope`     — which selected goods bring it into play
                   ("all", "complex" = goods made from precursors,
                    "aluminium" = electrolysis-route goods).
   • `mandatory` — when it is legally required: `true` = always; "complex" /
                   "aluminium" = only required once such a good is in scope.
   • `buyerRecommended` — pre-selected with a "Recommended" badge on a Buyer
                   Request, because buyers commonly ask for it.

   `resolveCbamFields()` turns a product selection into the real applicable
   checklist — a single global list whose contents reflect the goods chosen. */
export type FieldScope = "all" | "complex" | "aluminium" | "electrolysis";
export type CbamField = {
  id: string;
  label: string;
  group: string;
  hint: string;
  scope: FieldScope;
  mandatory: boolean | "complex" | "aluminium" | "electrolysis";
  buyerRecommended?: boolean;
};

export const CBAM_FIELDS: CbamField[] = [
  // Installation — identifies who produced the goods
  { id: "inst-name", label: "Installation name", group: "Installation", scope: "all", mandatory: true, buyerRecommended: true, hint: "Legal name of the producing installation" },
  { id: "inst-country", label: "Installation country", group: "Installation", scope: "all", mandatory: true, buyerRecommended: true, hint: "Country of production" },
  { id: "inst-address", label: "Site address", group: "Installation", scope: "all", mandatory: true, hint: "Full street address of the production site" },
  { id: "inst-unlocode", label: "UN/LOCODE", group: "Installation", scope: "all", mandatory: false, hint: "UN location code of the site, e.g. THRYG" },
  { id: "inst-coords", label: "Geographic coordinates", group: "Installation", scope: "all", mandatory: true, hint: "Latitude / longitude of the main emission source" },
  // Goods — what was produced
  { id: "goods-category", label: "Aggregated goods category", group: "Goods", scope: "all", mandatory: true, buyerRecommended: true, hint: "CBAM aggregated category for the CN code" },
  { id: "cn-code", label: "CN code", group: "Goods", scope: "all", mandatory: true, buyerRecommended: true, hint: "8-digit Combined Nomenclature code" },
  { id: "process-route", label: "Production process / route", group: "Goods", scope: "all", mandatory: true, buyerRecommended: true, hint: "Steel: e.g. BF-BOF, EAF, DRI-EAF · Aluminium: e.g. electrolysis (Hall-Héroult), remelt, extrusion" },
  { id: "installation-reference", label: "Producing installation", group: "Goods", scope: "all", mandatory: true, buyerRecommended: true, hint: "Installation profile assigned to this product and process" },
  { id: "monitoring-plan-id", label: "Monitoring plan reference", group: "Goods", scope: "all", mandatory: true, hint: "Operator-controlled monitoring plan identifier for this installation and reporting period" },
  { id: "monitoring-plan-version", label: "Monitoring plan version", group: "Goods", scope: "all", mandatory: true, hint: "Version that governed this installation/process data" },
  { id: "system-boundary", label: "Process and installation boundary", group: "Goods", scope: "all", mandatory: true, hint: "Included process units, emission sources and transfers for this production process" },
  { id: "excluded-activities", label: "Excluded activities", group: "Goods", scope: "all", mandatory: true, hint: "Activities outside this boundary, or explicitly state none" },
  { id: "data-gap-methodology", label: "Data-gap methodology", group: "Goods", scope: "all", mandatory: true, hint: "Method used for missing periods/readings, or explicitly state that no data gaps occurred" },
  { id: "control-activities", label: "Monitoring control activities", group: "Goods", scope: "all", mandatory: true, hint: "Meter reconciliation, calibration, review and other controls, one per line" },
  { id: "production-activity", label: "Process production activity (TNE)", group: "Goods", scope: "all", mandatory: true, buyerRecommended: true, hint: "Exact installation/process output for the reporting period — not the commercial shipment quantity" },
  { id: "quantity", label: "Commercial quantity covered (net mass, TNE)", group: "Goods", scope: "all", mandatory: true, buyerRecommended: true, hint: "Canonical net mass the exporter bought from you in the period — separate from installation production activity" },
  // Embedded emissions — the heart of CBAM. Direct/indirect cover the good's
  // OWN production process; precursor embedded emissions are entered as
  // structured rows below and the total is DERIVED (own + precursors).
  { id: "direct-emissions", label: "Direct specific emissions — own process (tCO₂e/t)", group: "Embedded emissions", scope: "all", mandatory: true, buyerRecommended: true, hint: "Direct emissions of YOUR production step only — precursors are added separately below" },
  { id: "indirect-emissions", label: "Indirect specific emissions — own process (tCO₂e/t)", group: "Embedded emissions", scope: "all", mandatory: true, buyerRecommended: true, hint: "Electricity-related emissions of YOUR production step only" },
  { id: "total-emissions", label: "Definitive embedded emissions (TCO2E_PER_TNE)", group: "Embedded emissions", scope: "all", mandatory: true, buyerRecommended: true, hint: "Derived exactly from direct emissions and precursors; indirect emissions are retained separately but excluded for Annex-II steel/aluminium" },
  { id: "method", label: "Determination method (actual / default)", group: "Embedded emissions", scope: "all", mandatory: true, buyerRecommended: true, hint: "Whether actual data or default values were used" },
  { id: "emissions-method", label: "MRV method", group: "Embedded emissions", scope: "all", mandatory: true, buyerRecommended: true, hint: "Calculation-based, mass balance or CEMS method used for the production process" },
  { id: "plant-mrv", label: "Plant MRV calculation inputs", group: "Embedded emissions", scope: "all", mandatory: false, buyerRecommended: true, hint: "Required for actual values: source streams, mass balance or CEMS plus energy, allocation and aluminium PFC inputs, with evidence references" },
  { id: "default-value-reference", label: "Commission default-value reference", group: "Embedded emissions", scope: "all", mandatory: false, buyerRecommended: true, hint: "Required when default is selected: effective dataset/version and exact default-value row used" },
  // Electricity — required where indirect emissions dominate (aluminium electrolysis)
  { id: "elec-consumed", label: "Electricity consumed (MWh/t)", group: "Electricity", scope: "all", mandatory: "aluminium", hint: "Electricity used per tonne of output — drives indirect emissions" },
  { id: "elec-factor", label: "Electricity emission factor (TCO2E_PER_MWH)", group: "Electricity", scope: "all", mandatory: "aluminium", hint: "Exact grid, PPA or supplier-specific emission factor" },
  { id: "elec-factor-source", label: "Electricity factor source", group: "Electricity", scope: "all", mandatory: "aluminium", hint: "Documented factor publication, PPA or calculation reference" },
  { id: "al-process", label: "Electrolysis technology (prebake / Søderberg)", group: "Electricity", scope: "electrolysis", mandatory: "electrolysis", hint: "Smelting route — only for primary (unwrought) aluminium from electrolysis" },
  // Precursors — only complex (downstream) goods embed upstream emissions
  { id: "precursors", label: "Relevant precursors & their embedded emissions", group: "Precursors", scope: "complex", mandatory: "complex", hint: "One row per input material: quantity consumed per tonne of this good × its embedded emissions" },
  { id: "precursor-route", label: "Precursor production routes", group: "Precursors", scope: "complex", mandatory: false, hint: "How each precursor was produced, where known" },
  // Carbon price — offsets the CBAM liability
  { id: "carbon-price", label: "Carbon price due in country of origin", group: "Carbon price", scope: "all", mandatory: true, buyerRecommended: true, hint: "Carbon price actually paid per tonne of CO₂e, if any" },
  { id: "carbon-price-currency", label: "Carbon price currency", group: "Carbon price", scope: "all", mandatory: false, hint: "Currency the carbon price was paid in (THB or EUR)" },
  { id: "carbon-price-form", label: "Form of carbon price (ETS / tax / levy)", group: "Carbon price", scope: "all", mandatory: false, hint: "Instrument under which the price was paid" },
  // Verification — accredited assurance of the figures
  { id: "verification", label: "Verification & verifier details", group: "Verification", scope: "all", mandatory: true, buyerRecommended: true, hint: "Accredited verifier and verification outcome" },
];

/* Goods made from precursors ("complex goods") must carry their precursors'
   embedded emissions; primary inputs and unwrought metal do not. */
export const PRIMARY_GROUPS = new Set(["Primary inputs", "Unwrought"]);
export const isComplexGood = (p: CatalogProduct) => !PRIMARY_GROUPS.has(p.group);
/* Electrolysis goods = primary (unwrought) aluminium — the only goods where a
   smelting-technology question makes sense. A downstream extruder must never
   be forced to answer prebake/Søderberg. */
export const isElectrolysisGood = (p: CatalogProduct) => p.category === "Aluminium" && p.group === "Unwrought";
/** Always shown because the supplier's actual/default choice is made after the request is created. */
export const METHOD_CONDITIONAL_FIELD_IDS = new Set(["plant-mrv", "default-value-reference"]);

export type ResolvedCbamField = CbamField & { required: boolean };

/* Per-product resolution — the union list above says what the DECLARATION
   collects; these two say what applies to ONE good. A raw iron-ore line never
   answers precursor questions just because a rebar SKU shares the declaration,
   and electricity detail is only mandatory on the aluminium goods themselves. */
export const fieldAppliesTo = (f: CbamField, p: CatalogProduct): boolean =>
  f.scope === "all" ||
  (f.scope === "complex" && isComplexGood(p)) ||
  (f.scope === "aluminium" && p.category === "Aluminium") ||
  (f.scope === "electrolysis" && isElectrolysisGood(p));
export const fieldRequiredFor = (f: CbamField, p: CatalogProduct): boolean =>
  f.mandatory === true ||
  (f.mandatory === "complex" && isComplexGood(p)) ||
  (f.mandatory === "aluminium" && p.category === "Aluminium") ||
  (f.mandatory === "electrolysis" && isElectrolysisGood(p));

/** The real, applicable CBAM checklist for a given product selection. */
export function resolveCbamFields(selected: CatalogProduct[]): ResolvedCbamField[] {
  const hasComplex = selected.some(isComplexGood);
  const hasAluminium = selected.some((p) => p.category === "Aluminium");
  const hasElectrolysis = selected.some(isElectrolysisGood);
  const inScope = (s: FieldScope) =>
    s === "all" || (s === "complex" && hasComplex) || (s === "aluminium" && hasAluminium) || (s === "electrolysis" && hasElectrolysis);
  return CBAM_FIELDS.filter((f) => inScope(f.scope)).map((f) => ({
    ...f,
    required:
      f.mandatory === true ||
      (f.mandatory === "complex" && hasComplex) ||
      (f.mandatory === "aluminium" && hasAluminium) ||
      (f.mandatory === "electrolysis" && hasElectrolysis),
  }));
}

/** Sector label derived from the goods actually selected — a declaration's
    sector must never be stamped from the org profile (an aluminium filing was
    labeled "Steel & iron" before this). */
export function sectorLabelFor(selected: CatalogProduct[]): string {
  const cats = new Set(selected.map((p) => p.category));
  if (cats.size === 1) return [...cats][0];
  if (cats.size > 1) return "Steel & aluminium";
  return "—";
}

/* ── Scope 2 (indirect) liability rule ────────────────────────
   CBAM definitive-period rule, Annex II of Regulation (EU) 2023/956: for the
   goods listed there — iron & steel, aluminium and hydrogen — ONLY direct
   emissions count toward the financial obligation (these sectors receive
   indirect-cost compensation under the EU ETS State-aid framework). Indirect
   (electricity) emissions are still REPORTED for every good, they just don't
   enter the certificate bill. Certrace applies this automatically from the
   CN code so an exporter never over- or under-states their liability. */
export const SCOPE2_IN_LIABILITY: Record<ProductCategory, boolean> = {
  "Iron & Steel": false,
  Aluminium: false, // Annex II good — direct-only in the definitive period
};
export type Scope2Treatment = { category: ProductCategory; included: boolean };
/** Per-category Scope 2 treatment for the goods currently selected. */
export function scope2Treatment(selected: CatalogProduct[]): Scope2Treatment[] {
  return PRODUCT_CATEGORIES.filter((c) => selected.some((p) => p.category === c)).map((category) => ({
    category,
    included: SCOPE2_IN_LIABILITY[category],
  }));
}

/* ── Export quantity units ────────────────────────────────────
   CBAM embedded emissions are reported per **tonne of net mass** — every
   quantity in a declaration must resolve to net mass. Only mass units are
   accepted: an invoice line in pieces / metres / m² cannot be converted
   without per-product conversion data, and a silent zero would understate
   emissions (exactly the failure the 2026-07-13 test demonstrated). Exporters
   invoicing in other units convert to net mass before entering the lot. */
export const PRODUCT_UNITS = ["TNE", "KGM"] as const;
export type ProductUnit = (typeof PRODUCT_UNITS)[number];
export const PRODUCT_UNIT_LABELS: Record<ProductUnit, string> = {
  TNE: "TNE — tonnes",
  KGM: "KGM — kilograms",
};
/* No default unit — the exporter must pick the unit their goods were invoiced
   in, so a quantity is never silently mis-typed as tonnes. */
export const DEFAULT_UNIT = "";

export const getCatalogProduct = (id: string) => {
  const product = PRODUCT_CATALOG.find((candidate) => candidate.id === id);
  if (!product) return undefined;
  const regulatoryProduct = classifyCnCode(product.cnCode);
  if (!regulatoryProduct) return undefined;
  const expectedSector = product.category === "Iron & Steel" ? "IRON_STEEL" : "ALUMINIUM";
  return regulatoryProduct.sector === expectedSector ? product : undefined;
};
export const productTemplate = (p: CatalogProduct) => `CBAM · ${p.category} · ${p.group}`;
export const PRODUCT_CATEGORIES: ProductCategory[] = ["Iron & Steel", "Aluminium"];
