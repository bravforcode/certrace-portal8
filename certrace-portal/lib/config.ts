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
// Official CBAM is annual; quarterly is offered because many exporters collect
// supplier data each quarter even though the filing is yearly.
export const CBAM_PERIODS: PeriodOption[] = [
  { id: "annual", label: "Annual", hint: "Official CBAM cadence — recommended. Suppliers can report at year-end.", picker: "year" },
  { id: "quarterly", label: "Quarterly", hint: "Collect supplier data each quarter (one quarter at a time).", picker: "quarter" },
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

/* ── Product catalogue (real CBAM master data) ────────────────
   CN codes are real Combined-Nomenclature codes that fall inside the CBAM
   scope of Annex I to Regulation (EU) 2023/956 (iron & steel — ch. 72/73 +
   precursor 2601 12; aluminium — ch. 76). The exporter searches; Certrace
   fills in category, sub-group, CN/HS and the CBAM template automatically.
   None of this is editable — master data is read-only by design.

   ⚠️ Master data is REAL. Only transactional values (quantities, suppliers,
   emissions) elsewhere in the app are mock. */
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

/* ── CBAM data fields (real reporting requirements) ───────────
   The data points an installation reports per good under the CBAM definitive
   regime (Reg. (EU) 2023/956, Annex IV + Implementing Reg. (EU) 2023/1773).

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
export type FieldScope = "all" | "complex" | "aluminium";
export type CbamField = {
  id: string;
  label: string;
  group: string;
  hint: string;
  scope: FieldScope;
  mandatory: boolean | "complex" | "aluminium";
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
  { id: "process-route", label: "Production process / route", group: "Goods", scope: "all", mandatory: true, buyerRecommended: true, hint: "e.g. BF-BOF, EAF, DRI-EAF for steel" },
  { id: "quantity", label: "Quantity produced (net mass, t)", group: "Goods", scope: "all", mandatory: true, buyerRecommended: true, hint: "Net mass in tonnes for the period" },
  // Embedded emissions — the heart of CBAM
  { id: "direct-emissions", label: "Direct specific emissions (tCO₂e/t)", group: "Embedded emissions", scope: "all", mandatory: true, buyerRecommended: true, hint: "Specific direct embedded emissions" },
  { id: "indirect-emissions", label: "Indirect specific emissions (tCO₂e/t)", group: "Embedded emissions", scope: "all", mandatory: true, buyerRecommended: true, hint: "Specific indirect (electricity) embedded emissions" },
  { id: "total-emissions", label: "Total embedded emissions (tCO₂e/t)", group: "Embedded emissions", scope: "all", mandatory: true, buyerRecommended: true, hint: "Direct + indirect specific embedded emissions" },
  { id: "method", label: "Determination method (actual / default)", group: "Embedded emissions", scope: "all", mandatory: true, buyerRecommended: true, hint: "Whether actual data or default values were used" },
  // Electricity — required where indirect emissions dominate (aluminium electrolysis)
  { id: "elec-consumed", label: "Electricity consumed (MWh/t)", group: "Electricity", scope: "all", mandatory: "aluminium", hint: "Electricity used per tonne of output — drives indirect emissions" },
  { id: "elec-factor", label: "Electricity emission factor & source", group: "Electricity", scope: "all", mandatory: "aluminium", hint: "Grid / PPA factor and its documented source" },
  { id: "al-process", label: "Electrolysis technology (prebake / Søderberg)", group: "Electricity", scope: "aluminium", mandatory: "aluminium", hint: "Smelting route — only relevant for aluminium goods" },
  // Precursors — only complex (downstream) goods embed upstream emissions
  { id: "precursors", label: "Relevant precursors & their embedded emissions", group: "Precursors", scope: "complex", mandatory: "complex", hint: "Embedded emissions of input materials carried into the finished good" },
  { id: "precursor-route", label: "Precursor production routes", group: "Precursors", scope: "complex", mandatory: false, hint: "How each precursor was produced, where known" },
  // Carbon price — offsets the CBAM liability
  { id: "carbon-price", label: "Carbon price due in country of origin", group: "Carbon price", scope: "all", mandatory: true, buyerRecommended: true, hint: "Carbon price actually paid, if any" },
  { id: "carbon-price-form", label: "Form of carbon price (ETS / tax / levy)", group: "Carbon price", scope: "all", mandatory: false, hint: "Instrument under which the price was paid" },
  // Verification — accredited assurance of the figures
  { id: "verification", label: "Verification & verifier details", group: "Verification", scope: "all", mandatory: true, buyerRecommended: true, hint: "Accredited verifier and verification outcome" },
];

/* Goods made from precursors ("complex goods") must carry their precursors'
   embedded emissions; primary inputs and unwrought metal do not. */
export const PRIMARY_GROUPS = new Set(["Primary inputs", "Unwrought"]);
export const isComplexGood = (p: CatalogProduct) => !PRIMARY_GROUPS.has(p.group);

export type ResolvedCbamField = CbamField & { required: boolean };
/** The real, applicable CBAM checklist for a given product selection. */
export function resolveCbamFields(selected: CatalogProduct[]): ResolvedCbamField[] {
  const hasComplex = selected.some(isComplexGood);
  const hasAluminium = selected.some((p) => p.category === "Aluminium");
  const inScope = (s: FieldScope) =>
    s === "all" || (s === "complex" && hasComplex) || (s === "aluminium" && hasAluminium);
  return CBAM_FIELDS.filter((f) => inScope(f.scope)).map((f) => ({
    ...f,
    required:
      f.mandatory === true ||
      (f.mandatory === "complex" && hasComplex) ||
      (f.mandatory === "aluminium" && hasAluminium),
  }));
}

/* ── Scope 2 (indirect) liability rule ────────────────────────
   CBAM definitive-period reality: indirect (Scope 2 / electricity) emissions
   are *reported* for every good, but they only count toward the financial
   obligation for some sectors. During the initial definitive period iron & steel
   exclude indirect emissions from the bill (the electricity is priced elsewhere),
   whereas aluminium — whose footprint is dominated by smelter electricity —
   carries them in. Certrace applies this automatically from the CN code so an
   exporter never over- or under-states their liability. */
export const SCOPE2_IN_LIABILITY: Record<ProductCategory, boolean> = {
  "Iron & Steel": false,
  Aluminium: true,
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
   CBAM embedded emissions are reported per **tonne of net mass**, so tonnes is
   the canonical unit and the default. The rest cover how exporters actually
   invoice steel/iron/aluminium goods (sheet by m², long products by metre,
   fasteners by piece) — converted to net mass for the calculation. */
export const PRODUCT_UNITS = ["tonnes (t)", "kg", "pieces", "metres (m)", "m²", "m³", "litres (L)"] as const;
export type ProductUnit = (typeof PRODUCT_UNITS)[number];
/* No default unit — the exporter must pick the unit their goods were invoiced
   in, so a quantity is never silently mis-typed as tonnes. */
export const DEFAULT_UNIT = "";

export const getCatalogProduct = (id: string) => PRODUCT_CATALOG.find((p) => p.id === id);
export const productTemplate = (p: CatalogProduct) => `CBAM · ${p.category} · ${p.group}`;
export const PRODUCT_CATEGORIES: ProductCategory[] = ["Iron & Steel", "Aluminium"];
