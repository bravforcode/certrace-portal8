import { teamSeatLimits } from "./team-seat-limits";
import { currentLang, localeFor } from "./i18n";
import {
  FULL_CATALOGUE,
  GROUPS_BY_SECTOR,
  LEGACY_ONLY,
  PRIMARY_GROUPS_ALL,
} from "./cbam/cn-catalogue";
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
    dataPoints: [
      "Geolocation of plots",
      "Production date / period",
      "Volume & species",
      "Legality documents",
    ],
    requirements: [
      "Geo-coordinates",
      "Deforestation-free proof",
      "Legality of production",
      "Due diligence statement",
    ],
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
    dataPoints: [
      "Scope 1 & 2 emissions",
      "Scope 3 categories",
      "Energy mix",
      "ESRS datapoints",
    ],
    requirements: [
      "ESRS-aligned disclosures",
      "Double materiality",
      "Assured data",
    ],
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
    dataPoints: [
      "Purchased goods emissions",
      "Activity data",
      "Allocation method",
    ],
    requirements: [
      "Category coverage",
      "Primary vs secondary data",
      "Methodology disclosure",
    ],
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
  {
    code: "EU",
    name: "European Union",
    flag: "EU",
    regulations: ["cbam", "eudr", "csrd", "scope3"],
  },
  {
    code: "UK",
    name: "United Kingdom",
    flag: "UK",
    regulations: ["uk-cbam", "scope3"],
  },
  { code: "US", name: "United States", flag: "US", regulations: ["scope3"] },
];

export const getDestination = (code: string) =>
  DESTINATION_MARKETS.find((d) => d.code === code);
/** Destination markets that enforce a given regulation today. */
export const destinationsForRegulation = (regId: string) =>
  DESTINATION_MARKETS.filter((d) => d.regulations.includes(regId));

// CBAM goods, by Annex I aggregated category. Steel & iron is open at launch;
// the rest are gated until their factor libraries + calc routes are verified.
export const PRODUCT_SECTORS: ProductSector[] = [
  {
    id: "steel",
    name: "Steel & iron",
    cnHint: "CN 72, 73",
    regs: ["cbam"],
    available: true,
  },
  {
    id: "aluminium",
    name: "Aluminium",
    cnHint: "CN 76",
    regs: ["cbam"],
    available: true,
  },
  {
    id: "cement",
    name: "Cement",
    cnHint: "CN 2523",
    regs: ["cbam"],
    available: false,
    soonNote: "Clinker factors in build.",
  },
  {
    id: "fertiliser",
    name: "Fertilisers",
    cnHint: "CN 31",
    regs: ["cbam"],
    available: false,
    soonNote: "On the roadmap.",
  },
  {
    id: "hydrogen",
    name: "Hydrogen",
    cnHint: "CN 2804",
    regs: ["cbam"],
    available: false,
    soonNote: "On the roadmap.",
  },
  {
    id: "electricity",
    name: "Electricity",
    cnHint: "CN 2716",
    regs: ["cbam"],
    available: false,
    soonNote: "On the roadmap.",
  },
];

export const STATUS_META: Record<
  Status,
  { label: string; tone: "ok" | "info" | "warn" | "muted" }
> = {
  live: { label: "live", tone: "ok" },
  soon: { label: "soon", tone: "muted" },
  rollout: { label: "rollout", tone: "info" },
  planned: { label: "planned", tone: "muted" },
};

/* ── Countries (ISO 3166-1 alpha-2) ────────────────────────────
   Master data, so it's the real list — a supplier can sit anywhere in the
   world, unlike JURISDICTIONS above which is only the origins Certrace has a
   verified emission-factor library for. Stored as the alpha-2 code because
   that's what every downstream artefact wants: the Annex IV communication
   template, the Registry XML, and the 2-letter badge on a supplier row. */
export type Country = { code: string; name: string };
export const COUNTRIES: Country[] = [
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AD", name: "Andorra" },
  { code: "AO", name: "Angola" },
  { code: "AG", name: "Antigua and Barbuda" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BS", name: "Bahamas" },
  { code: "BH", name: "Bahrain" },
  { code: "BD", name: "Bangladesh" },
  { code: "BB", name: "Barbados" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BZ", name: "Belize" },
  { code: "BJ", name: "Benin" },
  { code: "BT", name: "Bhutan" },
  { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "BW", name: "Botswana" },
  { code: "BR", name: "Brazil" },
  { code: "BN", name: "Brunei Darussalam" },
  { code: "BG", name: "Bulgaria" },
  { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" },
  { code: "CV", name: "Cabo Verde" },
  { code: "KH", name: "Cambodia" },
  { code: "CM", name: "Cameroon" },
  { code: "CA", name: "Canada" },
  { code: "CF", name: "Central African Republic" },
  { code: "TD", name: "Chad" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "KM", name: "Comoros" },
  { code: "CG", name: "Congo" },
  { code: "CD", name: "Congo (Democratic Republic)" },
  { code: "CR", name: "Costa Rica" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "HR", name: "Croatia" },
  { code: "CU", name: "Cuba" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czechia" },
  { code: "DK", name: "Denmark" },
  { code: "DJ", name: "Djibouti" },
  { code: "DM", name: "Dominica" },
  { code: "DO", name: "Dominican Republic" },
  { code: "EC", name: "Ecuador" },
  { code: "EG", name: "Egypt" },
  { code: "SV", name: "El Salvador" },
  { code: "GQ", name: "Equatorial Guinea" },
  { code: "ER", name: "Eritrea" },
  { code: "EE", name: "Estonia" },
  { code: "SZ", name: "Eswatini" },
  { code: "ET", name: "Ethiopia" },
  { code: "FJ", name: "Fiji" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "GA", name: "Gabon" },
  { code: "GM", name: "Gambia" },
  { code: "GE", name: "Georgia" },
  { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" },
  { code: "GR", name: "Greece" },
  { code: "GD", name: "Grenada" },
  { code: "GT", name: "Guatemala" },
  { code: "GN", name: "Guinea" },
  { code: "GW", name: "Guinea-Bissau" },
  { code: "GY", name: "Guyana" },
  { code: "HT", name: "Haiti" },
  { code: "HN", name: "Honduras" },
  { code: "HK", name: "Hong Kong" },
  { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JM", name: "Jamaica" },
  { code: "JP", name: "Japan" },
  { code: "JO", name: "Jordan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KE", name: "Kenya" },
  { code: "KI", name: "Kiribati" },
  { code: "KW", name: "Kuwait" },
  { code: "KG", name: "Kyrgyzstan" },
  { code: "LA", name: "Laos" },
  { code: "LV", name: "Latvia" },
  { code: "LB", name: "Lebanon" },
  { code: "LS", name: "Lesotho" },
  { code: "LR", name: "Liberia" },
  { code: "LY", name: "Libya" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MO", name: "Macao" },
  { code: "MG", name: "Madagascar" },
  { code: "MW", name: "Malawi" },
  { code: "MY", name: "Malaysia" },
  { code: "MV", name: "Maldives" },
  { code: "ML", name: "Mali" },
  { code: "MT", name: "Malta" },
  { code: "MH", name: "Marshall Islands" },
  { code: "MR", name: "Mauritania" },
  { code: "MU", name: "Mauritius" },
  { code: "MX", name: "Mexico" },
  { code: "FM", name: "Micronesia" },
  { code: "MD", name: "Moldova" },
  { code: "MC", name: "Monaco" },
  { code: "MN", name: "Mongolia" },
  { code: "ME", name: "Montenegro" },
  { code: "MA", name: "Morocco" },
  { code: "MZ", name: "Mozambique" },
  { code: "MM", name: "Myanmar" },
  { code: "NA", name: "Namibia" },
  { code: "NR", name: "Nauru" },
  { code: "NP", name: "Nepal" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NI", name: "Nicaragua" },
  { code: "NE", name: "Niger" },
  { code: "NG", name: "Nigeria" },
  { code: "KP", name: "North Korea" },
  { code: "MK", name: "North Macedonia" },
  { code: "NO", name: "Norway" },
  { code: "OM", name: "Oman" },
  { code: "PK", name: "Pakistan" },
  { code: "PW", name: "Palau" },
  { code: "PS", name: "Palestine" },
  { code: "PA", name: "Panama" },
  { code: "PG", name: "Papua New Guinea" },
  { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "QA", name: "Qatar" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russian Federation" },
  { code: "RW", name: "Rwanda" },
  { code: "KN", name: "Saint Kitts and Nevis" },
  { code: "LC", name: "Saint Lucia" },
  { code: "VC", name: "Saint Vincent and the Grenadines" },
  { code: "WS", name: "Samoa" },
  { code: "SM", name: "San Marino" },
  { code: "ST", name: "Sao Tome and Principe" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SN", name: "Senegal" },
  { code: "RS", name: "Serbia" },
  { code: "SC", name: "Seychelles" },
  { code: "SL", name: "Sierra Leone" },
  { code: "SG", name: "Singapore" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "SB", name: "Solomon Islands" },
  { code: "SO", name: "Somalia" },
  { code: "ZA", name: "South Africa" },
  { code: "KR", name: "South Korea" },
  { code: "SS", name: "South Sudan" },
  { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },
  { code: "SD", name: "Sudan" },
  { code: "SR", name: "Suriname" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "SY", name: "Syria" },
  { code: "TW", name: "Taiwan" },
  { code: "TJ", name: "Tajikistan" },
  { code: "TZ", name: "Tanzania" },
  { code: "TH", name: "Thailand" },
  { code: "TL", name: "Timor-Leste" },
  { code: "TG", name: "Togo" },
  { code: "TO", name: "Tonga" },
  { code: "TT", name: "Trinidad and Tobago" },
  { code: "TN", name: "Tunisia" },
  { code: "TR", name: "Türkiye" },
  { code: "TM", name: "Turkmenistan" },
  { code: "TV", name: "Tuvalu" },
  { code: "UG", name: "Uganda" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "UY", name: "Uruguay" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "VU", name: "Vanuatu" },
  { code: "VA", name: "Vatican City" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Viet Nam" },
  { code: "YE", name: "Yemen" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
];

export const getCountry = (code: string) =>
  COUNTRIES.find((c) => c.code === code.trim().toUpperCase());
/** Display a stored country value — code if we know it, raw string otherwise. */
export const countryName = (code: string) => getCountry(code)?.name ?? code;

/** The same, in the language on screen — Thailand · ไทย. `countryName` stays English for what is written down (a report is not translated by the screen it was printed from). */
export const countryNameShown = (code: string): string => {
  const lang = currentLang();
  if (lang === "en" || !code) return countryName(code);
  try {
    return (
      new Intl.DisplayNames([localeFor(lang)], { type: "region" }).of(
        code.toUpperCase(),
      ) ?? countryName(code)
    );
  } catch {
    return countryName(code);
  }
};

/** The 27 EU member states plus the CBAM-exempted EEA/EFTA territories
    (Iceland, Liechtenstein, Norway) and Switzerland (linked ETS, treated as
    exempt under CBAM Art. 2). A precursor produced inside this set carries no
    CBAM liability, so its specific embedded emissions are 0 by construction —
    not "unknown", not "default" — and no verification report is required to
    say so. */
export const EU_AND_EXEMPT_COUNTRY_CODES: string[] = [
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  "IS",
  "LI",
  "NO",
  "CH",
];

export const isEuOrExempt = (countryCode: string): boolean =>
  EU_AND_EXEMPT_COUNTRY_CODES.includes(countryCode.trim().toUpperCase());

/* ── Pricing ────────────────────────────────────────────────
   WHAT A PLAN SIZES IS THE FILING, NOT THE SUPPLY CHAIN. A Thai steel chain is two to four tiers deep whether the exporter
   sells one CN code or six, so nothing here caps the people at the other end of a smart link: suppliers and precursor
   suppliers enter and fill in through it without limit, on every plan, at any depth. What a plan counts is the exporter's
   own side — companies, installations (each with its report package), CN codes, precursors, the one reporting year open,
   the team seats — and the two things that cost something to run: the AI and the reading of uploaded files.

   NEVER CORRECTNESS. Every plan gets the whole engine, the full six-tier precursor depth, the methodology document and the
   verifier pack, because a limited plan that produced a WRONG number would not be a cheaper product but a liability.

   NO FIGURES LIVE HERE FOR PRICE. All three are quoted, not listed — every card and every call to action goes to sales.

   THE TWO ALLOWANCES ARE STATED, NOT YET METERED. CN codes, installations, reporting years and seats are enforced across
   the product (lib/plan.ts). Companies, precursors, AI questions and smart-upload pages are the plan's terms and are shown as
   such; the page does not draw a usage bar for a number nothing measures. */

/* CONTACT SALES IS A LINE CONVERSATION, NOT A WEB FORM. It used to open
   certrace.co and leave the reader to find a contact route on it. The price
   is quoted, so every CTA on this page is asking for a person — and in
   Thailand that person is reached on LINE, which is also where the CBAM
   specialists already answer support. One tap from the button to a chat
   window, on the phone the exporter is holding. */
export const CONTACT_SALES_URL =
  "https://line.me/R/ti/p/@104lkswh?ts=07300003&oat_content=url";

/** How deep the precursor chain may run. The same on every tier, on purpose —
    see the note above. Mirrors MAX_SUPPLIER_DEPTH in lib/precursor-suppliers.ts. */
export const MAX_CHAIN_TIERS = 6;

/* `trial` is a REAL plan id but NOT a sellable tier — see TRIAL_PLAN below.
   Keeping it in the union is what lets every `planAllows` / cap read in the
   product answer for a trial account without a second code path. */
export type PlanId = "starter" | "standard" | "enterprise" | "trial";

/** null means "not capped" — only the free trial is. */
export type PlanCaps = {
  /** CN codes covered by the plan. */
  cnCodes: number | null;
  /** Installations the exporter may register — each carries one report package per reporting year. */
  sites: number | null;
  /** Reporting years that may be open at the same time. */
  years: number | null;
  /** Team seats. Suppliers never take one, on any tier. */
  seats: number | null;
  /** Chain depth. Same everywhere; carried per-plan so the table can print it. */
  chainTiers: number;
};

/** The plan's other terms: counted, and shown, but not metered by the product yet. */
export type PlanAllowance = {
  /** Companies (legal entities) on the account. */
  companies: number | null;
  /** Precursors the plan covers. */
  precursors: number | null;
  /** AI tokens, and the number of questions they come to (ten to a question). Only the questions are shown; the tokens are the unit a meter would count in. */
  aiTokens: number | null;
  aiQuestions: number | null;
  /** Pages Smart upload reads: an Excel file counts as 1 page, and each image inside it counts as one more. */
  uploadPages: number | null;
};

/** Everything a tier switches on rather than counts. */
export type PlanFeatures = {
  /** AI reads an uploaded document and proposes values a human then accepts. */
  aiExtraction: boolean;
  /** The Monitoring Methodology Documentation download on a workspace's
      Readiness tab — the file a verifier reads first. Every PAID tier has it;
      the free trial does not, which is the one thing the trial holds back.
      See TRIAL_PLAN for why that is the right thing to hold back. */
  methodologyDoc: boolean;
};

export type Plan = {
  id: PlanId;
  name: string;
  /** the pill in the top-right corner of the card */
  tag: string;
  /** the one-line promise under the name */
  line: string;
  /** the headline in the price block — a sentence, never a figure */
  amount: string;
  /** the small line under the headline */
  unit: string;
  /** what the comparison column prints where a price would go */
  columnPrice: string;
  highlight?: boolean;
  caps: PlanCaps;
  allowance: PlanAllowance;
  features: PlanFeatures;
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tag: "One company",
    line: "One company, one installation, one CN code.",
    amount: "Price on request",
    unit: "Annual term",
    columnPrice: "Price on request",
    caps: {
      cnCodes: 1,
      sites: 1,
      years: 1,
      seats: teamSeatLimits.starter,
      chainTiers: MAX_CHAIN_TIERS,
    },
    allowance: {
      companies: 1,
      precursors: 1,
      aiTokens: 500,
      aiQuestions: 50,
      uploadPages: 100,
    },
    features: { aiExtraction: true, methodologyDoc: true },
  },
  {
    id: "standard",
    name: "Standard",
    tag: "Most chosen",
    line: "Two installations and three CN codes, with a chain behind them.",
    amount: "Price on request",
    unit: "Annual term",
    columnPrice: "Price on request",
    highlight: true,
    caps: {
      cnCodes: 3,
      sites: 2,
      years: 1,
      seats: teamSeatLimits.standard,
      chainTiers: MAX_CHAIN_TIERS,
    },
    allowance: {
      companies: 2,
      precursors: 4,
      aiTokens: 1500,
      aiQuestions: 150,
      uploadPages: 300,
    },
    features: { aiExtraction: true, methodologyDoc: true },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tag: "Widest",
    line: "Three installations and six CN codes, with the most room to work.",
    amount: "Price on request",
    unit: "Annual term",
    columnPrice: "Price on request",
    caps: {
      cnCodes: 6,
      sites: 3,
      years: 1,
      seats: teamSeatLimits.enterprise,
      chainTiers: MAX_CHAIN_TIERS,
    },
    allowance: {
      companies: 2,
      precursors: 8,
      aiTokens: 3000,
      aiQuestions: 300,
      uploadPages: 600,
    },
    features: { aiExtraction: true, methodologyDoc: true },
  },
];

/* ── The free trial ─────────────────────────────────────────
   ONE MONTH, UNCAPPED, AND IT ENDS.

   IT IS NOT A FOURTH COLUMN. The trial is a state an account passes through,
   not a tier anyone chooses between — putting it in PLANS would add a fourth
   column to a comparison table to sell something nobody buys. It lives on the
   billing page as the account's own status strip, above the tiers that are
   for sale.

   NOTHING IS CAPPED. A trial that caps CN codes at one teaches the exporter
   that Certrace is small; a trial that runs their whole estate for a month
   teaches them what the year feels like, and that is the only thing a trial is
   for. Nothing is metered.

   ONE THING IS HELD BACK: the Monitoring Methodology Documentation download.
   It is the correct thing to hold back precisely because everything else is
   open — the trial computes the real figures, shows the real readiness and
   collects from real suppliers, and then the FILE a verifier reads first is
   the thing that needs a plan. Nothing is watered down; the work is real and
   it is still there when they buy. Holding back the calculation instead would
   mean a month spent on a number nobody can trust.

   AND THEN IT STOPS. At the end of the month the account goes read-only —
   every screen still opens, every figure is still there, and nothing can be
   changed. See lib/plan.ts (accountLocked) and components/account-lock.tsx.
   The work is preserved, not deleted: what the exporter built is the thing
   they are buying back. */

/** How long a free trial runs, in days. */
export const TRIAL_DAYS = 30;

export const TRIAL_PLAN: Plan = {
  id: "trial",
  name: "Free trial",
  tag: "1 month",
  line: "The whole product, for one reporting month.",
  amount: "Free for 30 days",
  unit: "no limits · no card",
  columnPrice: "Free · 30 days",
  caps: {
    cnCodes: null,
    sites: null,
    years: null,
    seats: teamSeatLimits.trial,
    chainTiers: MAX_CHAIN_TIERS,
  },
  allowance: {
    companies: null,
    precursors: null,
    aiTokens: null,
    aiQuestions: null,
    uploadPages: null,
  },
  features: { aiExtraction: true, methodologyDoc: false },
};

/* ── The comparison ─────────────────────────────────────────
   DATA, not markup, so the table renders once and the same rows can be read
   by anything else that needs to know what a tier includes. It is short on
   purpose: the plan's own terms and nothing else.

   A cell is a mark, a plain string, or a number with a unit — written as a
   template and its parts, so each language says "100 pages" its own way
   instead of finding a number glued to an English noun. */

export type CompareValue = {
  /** a dictionary key; `{n}` is replaced by `n` */
  text: string;
  n?: number;
  /** a second, quieter line under it */
  sub?: { text: string; n?: number };
};

export type CompareCell = boolean | string | CompareValue;

export type CompareRow = {
  label: string;
  /** [starter, standard, enterprise] */
  cells: [CompareCell, CompareCell, CompareCell];
};

export type CompareGroup = {
  title: string;
  /* A LIMIT and a SENTENCE are set in different type, and which is which is
     declared rather than guessed from the string. A limit ("3") reads in the
     pixel face, uppercased, so a column of them scans as a column of numbers;
     prose ("Provided + 1 meeting session") stays in the body face, because
     uppercased prose is unreadable at 12px. */
  prose?: boolean;
  rows: CompareRow[];
};

const per = <T>(pick: (p: Plan) => T): [T, T, T] => [
  pick(PLANS[0]),
  pick(PLANS[1]),
  pick(PLANS[2]),
];
const num = (n: number | null): string => (n == null ? "Unlimited" : String(n));
const same = <T>(v: T): [T, T, T] => [v, v, v];

export const PLAN_COMPARISON: CompareGroup[] = [
  {
    title: "What the plan covers",
    rows: [
      { label: "Company", cells: per((p) => num(p.allowance.companies)) },
      {
        label: "Installation & report package",
        cells: per((p) => num(p.caps.sites)),
      },
      { label: "CN code", cells: per((p) => num(p.caps.cnCodes)) },
      { label: "Precursor", cells: per((p) => num(p.allowance.precursors)) },
      { label: "Reporting year", cells: per((p) => num(p.caps.years)) },
    ],
  },
  {
    title: "What you can use",
    rows: [
      {
        label: "AI",
        cells: per(
          (p): CompareValue => ({
            text: "{n} questions",
            n: p.allowance.aiQuestions ?? 0,
          }),
        ),
      },
      {
        label: "Smart upload",
        cells: per(
          (p): CompareValue => ({
            text: "{n} pages",
            n: p.allowance.uploadPages ?? 0,
          }),
        ),
      },
      { label: "Smart link", cells: same("Unlimited") },
      { label: "Team seats", cells: per((p) => num(p.caps.seats)) },
    ],
  },
  {
    title: "Onboarding & support",
    prose: true,
    rows: [
      { label: "Onboarding", cells: same("Provided + 1 meeting session") },
      { label: "Support", cells: same("1 business day") },
    ],
  },
];

/** The three facts printed under the table. */
export const PLAN_COLOPHON = [
  "Certrace · EU CBAM compliance for exporters",
  "Prices exclude VAT",
  "Annual term",
];

export const getRegulation = (id: string) =>
  REGULATIONS.find((r) => r.id === id);
export const getJurisdiction = (code: string) =>
  JURISDICTIONS.find((j) => j.code === code);
export const getSector = (id: string) =>
  PRODUCT_SECTORS.find((p) => p.id === id);

/* Total variants for render paths that must show SOMETHING. The find-helpers
   above return undefined off-catalog; today the pickers only offer cbam/TH so
   the workflow's `getRegulation(...)!` never fired — but an imported or
   future-added regulation/jurisdiction id would turn that `!` into a crash.
   These fall back to CBAM (the only regulation this product implements) and the
   first known jurisdiction instead of asserting. */
export const regulationOf = (id: string) =>
  getRegulation(id) ?? getRegulation("cbam")!;
export const jurisdictionOf = (code: string) =>
  getJurisdiction(code) ?? JURISDICTIONS[0];
/** Any plan an account can be ON, including the trial — which is why this
    does not just search PLANS. PLANS is what is for SALE. */
export const getPlan = (id: string) =>
  id === TRIAL_PLAN.id ? TRIAL_PLAN : PLANS.find((p) => p.id === id);

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
    description:
      "Automatically prepares supplier data collection based on CBAM requirements. Fields, CN codes and templates are generated for you.",
    namePlaceholder: "e.g. CBAM 2026 Annual",
  },
  {
    id: "buyer",
    title: "Buyer Request",
    description:
      "Create a custom supplier request for buyer-specific information — documents, certificates and questionnaires on top of the carbon data.",
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
  {
    id: "annual",
    label: "Annual",
    hint: "Official CBAM cadence — recommended. Suppliers can report at year-end.",
    picker: "year",
  },
  {
    id: "quarterly",
    label: "Quarterly",
    hint: "Collect supplier data each quarter (one quarter at a time).",
    picker: "quarter",
  },
];
// Buyer requests are flexible — the buyer decides the rhythm.
export const BUYER_PERIODS: PeriodOption[] = [
  {
    id: "annual",
    label: "Annual",
    hint: "Once per calendar year.",
    picker: "year",
  },
  {
    id: "semiannual",
    label: "Semi-annual",
    hint: "One half-year at a time.",
    picker: "half",
  },
  {
    id: "quarterly",
    label: "Quarterly",
    hint: "One quarter at a time.",
    picker: "quarter",
  },
  {
    id: "monthly",
    label: "Monthly",
    hint: "One month at a time.",
    picker: "month",
  },
  {
    id: "onetime",
    label: "One-time",
    hint: "A single, ad-hoc collection.",
    picker: "none",
  },
  {
    id: "custom",
    label: "Custom range",
    hint: "Choose your own start and end dates.",
    picker: "range",
  },
];

/* ── Product catalogue (real CBAM master data) ────────────────
   CN codes are real Combined-Nomenclature codes that fall inside the CBAM
   scope of Annex I to Regulation (EU) 2023/956 (iron & steel — ch. 72/73 +
   precursor 2601 12; aluminium — ch. 76). The exporter searches; Certrace
   fills in category, sub-group, CN/HS and the CBAM template automatically.
   None of this is editable — master data is read-only by design.

   ⚠️ Master data is REAL. Only transactional values (quantities, suppliers,
   emissions) elsewhere in the app are mock. */
export type ProductCategory =
  | "Iron & Steel"
  | "Aluminium"
  | "Cement"
  | "Fertilisers"
  | "Hydrogen"
  | "Electricity";
export type CatalogProduct = {
  id: string;
  name: string;
  category: ProductCategory;
  group: string; // CBAM sub-group, drives the template label
  cnCode: string; // real CN code (CBAM Annex I scope)
  hsCode: string; // 4-digit HS heading
  keywords: string[];
  unit?: "MWh";
};

/* The catalogue is no longer typed here. It holds the 570 benchmark CN codes
   and electricity, which has no free-allocation benchmark, and the
   whole story of where it comes from is in lib/cbam/cn-catalogue.ts. */
export const PRODUCT_CATALOG: CatalogProduct[] = FULL_CATALOGUE;

/* ── CBAM data fields (real reporting requirements) ───────────
   The data points an installation reports per good under the CBAM definitive
   regime (Reg. (EU) 2023/956, Annex IV + Implementing Reg. (EU) 2025/2547,
   which replaced the transitional 2023/1773 from 1 January 2026).

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
  /* A SPECIMEN ANSWER, for the placeholder — never a restatement of the hint.

     The supplier questionnaire used to pass `hint` straight into the
     placeholder as well as printing it under the box, so every field said the
     same sentence twice: "Legal name of the producing installation" greyed
     inside the input and again immediately below it. Two identical lines read
     as two different instructions, and the reader stops to work out what the
     difference is — on a form where the whole point is to be answerable
     without a phone call.

     They also do different jobs. The hint EXPLAINS and has to survive typing;
     the placeholder SHOWS WHAT THE ANSWER LOOKS LIKE and disappears the moment
     a key is pressed, so it can never be the only copy of anything that
     matters. `example` is what belongs in a placeholder: the shape of a right
     answer, in the format a Thai mill would actually write it. */
  example?: string;
  scope: FieldScope;
  mandatory: boolean | "complex" | "aluminium" | "electrolysis";
  buyerRecommended?: boolean;
};

export const CBAM_FIELDS: CbamField[] = [
  // Installation — identifies who produced the goods
  {
    id: "inst-name",
    label: "Installation name",
    group: "Installation",
    scope: "all",
    mandatory: true,
    buyerRecommended: true,
    hint: "Legal name of the producing installation",
    example: "Siam Steel Industry Co., Ltd. — Rayong Works",
  },
  {
    id: "inst-country",
    label: "Installation country",
    group: "Installation",
    scope: "all",
    mandatory: true,
    buyerRecommended: true,
    hint: "Country of production",
    example: "Thailand",
  },
  {
    id: "inst-address",
    label: "Site address",
    group: "Installation",
    scope: "all",
    mandatory: true,
    hint: "Full street address of the production site",
    example:
      "88/9 Moo 4, Map Ta Phut Industrial Estate, Huai Pong, Mueang Rayong, Rayong 21150",
  },
  {
    id: "inst-unlocode",
    label: "UN/LOCODE",
    group: "Installation",
    scope: "all",
    mandatory: false,
    hint: "The UN code for the town or port this site is in — five letters, country code first. No code yet? Apply directly through UNECE (ยื่นขอรหัสใหม่ ผ่านระบบ UNECE โดยตรง); until then use the nearest listed town.",
    example: "THRYG",
  },
  {
    id: "inst-coords",
    label: "Geographic coordinates",
    group: "Installation",
    scope: "all",
    mandatory: true,
    hint: "Latitude / longitude of the main emission source, in decimal degrees",
    example: "12.7031, 101.1543",
  },
  // Goods — what was produced
  {
    id: "goods-category",
    label: "Aggregated goods category",
    group: "Goods",
    scope: "all",
    mandatory: true,
    buyerRecommended: true,
    hint: "CBAM aggregated category for the CN code",
    example: "Crude steel",
  },
  {
    id: "cn-code",
    label: "CN code",
    group: "Goods",
    scope: "all",
    mandatory: true,
    buyerRecommended: true,
    hint: "8-digit Combined Nomenclature code",
    example: "7207 11 90",
  },
  {
    id: "process-route",
    label: "Production process / route",
    group: "Goods",
    scope: "all",
    mandatory: true,
    buyerRecommended: true,
    hint: "The route this good was actually made by. Steel: BF-BOF, EAF or DRI-EAF · Aluminium: electrolysis (Hall-Héroult), remelt or extrusion",
    example: "Electric arc furnace (EAF)",
  },
  {
    id: "quantity",
    label: "Quantity covered by this request (net mass, t)",
    group: "Goods",
    scope: "all",
    mandatory: true,
    buyerRecommended: true,
    hint: "Net mass the exporter bought from you in the period — not your installation's total production",
    example: "1,250",
  },
  /* The denominator. Every per-tonne figure in a CBAM filing is a division, and
     this is what it divides by — the installation's own output of this good in
     the period, which is a different (larger) number than `quantity` above.
     Without it an absolute electricity or fuel figure cannot become tCO₂e/t at
     all, so it is required, not optional. */
  {
    id: "production-output",
    label: "Your output of this good in the period (net mass, t)",
    group: "Goods",
    scope: "all",
    mandatory: true,
    buyerRecommended: true,
    hint: "Everything your installation produced of this good in the reporting period — including what you sold to others. This is the denominator behind every per-tonne figure.",
    example: "48,600",
  },
  // Embedded emissions — the heart of CBAM. Direct/indirect cover the good's
  // OWN production process; precursor embedded emissions are entered as
  // structured rows below and the total is DERIVED (own + precursors).
  {
    id: "direct-emissions",
    label: "Direct specific emissions — own process (tCO₂e/t)",
    group: "Embedded emissions",
    scope: "all",
    mandatory: true,
    buyerRecommended: true,
    hint: "Direct emissions of YOUR production step only — precursors are added separately below",
  },
  {
    id: "indirect-emissions",
    label: "Indirect specific emissions — own process (tCO₂e/t)",
    group: "Embedded emissions",
    scope: "all",
    mandatory: true,
    buyerRecommended: true,
    hint: "Electricity-related emissions of YOUR production step only",
  },
  {
    id: "total-emissions",
    label: "Total embedded emissions (tCO₂e/t)",
    group: "Embedded emissions",
    scope: "all",
    mandatory: true,
    buyerRecommended: true,
    hint: "Derived automatically: own direct + own indirect + precursor contribution",
    example: "Calculated for you",
  },
  {
    id: "method",
    label: "Determination method (actual / default)",
    group: "Embedded emissions",
    scope: "all",
    mandatory: true,
    buyerRecommended: true,
    hint: "Whether actual data or default values were used",
  },
  // Electricity — required where indirect emissions dominate (aluminium electrolysis)
  /* ABSOLUTE MWh for the whole reporting period — never per tonne. A per-tonne
     value entered here used to be divided by output a second time inside the
     calculation, understating indirect emissions by the tonnage (gap G1). The
     division now happens once, in the engine, against `production-output`.
     lib/cbam/electricity-migration.ts converts values stored the old way. */
  {
    id: "elec-consumed",
    label: "Electricity consumed (MWh, total for the period)",
    group: "Electricity",
    scope: "all",
    mandatory: "aluminium",
    hint: "Total MWh drawn across the whole reporting period — NOT per tonne. Certrace divides by your output to get the per-tonne figure.",
  },
  {
    id: "elec-factor",
    label: "Electricity emission factor & source",
    group: "Electricity",
    scope: "all",
    mandatory: "aluminium",
    hint: "Grid / PPA factor and its documented source",
    example: "0.4999 tCO₂/MWh — TGO national grid factor 2023",
  },
  {
    id: "al-process",
    label: "Electrolysis technology (prebake / Søderberg)",
    group: "Electricity",
    scope: "electrolysis",
    mandatory: "electrolysis",
    hint: "Smelting route — only for primary (unwrought) aluminium from electrolysis",
  },
  /* Activity data — the inputs BEHIND the emissions figure, not the figure.
     A supplier who fills this in is submitting something a verifier can
     re-derive rather than a number they have to take on trust, so it is the
     single most valuable optional field in the set. Off by default because a
     first-time mill cannot produce it; the exporter turns it on for the
     suppliers who can, on the Classification step. */
  {
    id: "activity-data",
    label:
      "Activity data behind the figure (fuel, electricity, process materials)",
    group: "Activity data",
    scope: "all",
    mandatory: false,
    hint: "Optional but decisive: enter the fuel burned, power drawn and process materials consumed, and Certrace computes the emissions instead of taking your figure on trust.",
  },
  // Precursors — only complex (downstream) goods embed upstream emissions
  {
    id: "precursors",
    label: "Relevant precursors & their embedded emissions",
    group: "Precursors",
    scope: "complex",
    mandatory: "complex",
    hint: "One row per input material: quantity consumed per tonne of this good × its embedded emissions",
  },
  {
    id: "precursor-route",
    label: "Precursor production routes",
    group: "Precursors",
    scope: "complex",
    mandatory: false,
    hint: "How each precursor was produced, where known",
    example:
      "Billet from Thai Metal Pro — scrap-fed EAF, Chonburi. Pig iron from Siam Iron — blast furnace route.",
  },
  // Carbon price — offsets the CBAM liability
  {
    id: "carbon-price",
    label: "Carbon price due in country of origin",
    group: "Carbon price",
    scope: "all",
    mandatory: true,
    buyerRecommended: true,
    hint: "Carbon price actually paid per tonne of CO₂e, if any",
  },
  {
    id: "carbon-price-currency",
    label: "Carbon price currency",
    group: "Carbon price",
    scope: "all",
    mandatory: false,
    hint: "Currency the carbon price was paid in (THB or EUR)",
  },
  {
    id: "carbon-price-form",
    label: "Form of carbon price (ETS / tax / levy)",
    group: "Carbon price",
    scope: "all",
    mandatory: false,
    hint: "Instrument under which the price was paid",
  },
  // Verification — accredited assurance of the figures
  {
    id: "verification",
    label: "Verification & verifier details",
    group: "Verification",
    scope: "all",
    mandatory: true,
    buyerRecommended: true,
    hint: "Accredited verifier and verification outcome",
    example: "TUV SUD (Thailand) Ltd. — unqualified opinion, 14 Feb 2026",
  },
];

/* Goods made from precursors ("complex goods") must carry their precursors'
   embedded emissions; primary inputs and unwrought metal do not. */
export const PRIMARY_GROUPS = PRIMARY_GROUPS_ALL;
export const isComplexGood = (p: CatalogProduct) =>
  !PRIMARY_GROUPS.has(p.group);
/* Electrolysis goods = primary (unwrought) aluminium — the only goods where a
   smelting-technology question makes sense. A downstream extruder must never
   be forced to answer prebake/Søderberg. */
export const isElectrolysisGood = (p: CatalogProduct) =>
  p.category === "Aluminium" && p.group === "Unwrought";

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
export function resolveCbamFields(
  selected: CatalogProduct[],
): ResolvedCbamField[] {
  const hasComplex = selected.some(isComplexGood);
  const hasAluminium = selected.some((p) => p.category === "Aluminium");
  const hasElectrolysis = selected.some(isElectrolysisGood);
  const inScope = (s: FieldScope) =>
    s === "all" ||
    (s === "complex" && hasComplex) ||
    (s === "aluminium" && hasAluminium) ||
    (s === "electrolysis" && hasElectrolysis);
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
  Hydrogen: false, // Annex II good
  Electricity: false,
  /* Cement and fertilisers are NOT in Annex II, so their indirect emissions
     (electricity) count toward the obligation. */
  Cement: true,
  Fertilisers: true,
};
export type Scope2Treatment = { category: ProductCategory; included: boolean };
/** Per-category Scope 2 treatment for the goods currently selected. */
export function scope2Treatment(selected: CatalogProduct[]): Scope2Treatment[] {
  return PRODUCT_CATEGORIES.filter((c) =>
    selected.some((p) => p.category === c),
  ).map((category) => ({
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
export const PRODUCT_UNITS = ["tonnes (t)", "kg"] as const;
export type ProductUnit = (typeof PRODUCT_UNITS)[number];
/* No default unit — the exporter must pick the unit their goods were invoiced
   in, so a quantity is never silently mis-typed as tonnes. */
export const DEFAULT_UNIT = "";

/** By id — the current codes first, then the old entries whose code was
    not an 8-digit CN code, so a workspace saved before the catalogue was
    replaced still resolves its product. */
export const getCatalogProduct = (id: string): CatalogProduct | undefined =>
  PRODUCT_CATALOG.find((p) => p.id === id) ??
  LEGACY_ONLY.find((p) => p.id === id);
export const productTemplate = (p: CatalogProduct) =>
  `CBAM · ${p.category} · ${p.group}`;
export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "Iron & Steel",
  "Aluminium",
  "Fertilisers",
  "Cement",
  "Hydrogen",
  "Electricity",
];

/* ── Aggregated goods categories ───────────────────────────────
   The EU's own grouping, from Annex II of Implementing Regulation (EU)
   2023/1773. It is not our sub-group by another name and it is not cosmetic:
   the aggregated category is the level at which embedded emissions are
   reported and at which the indirect-emissions rule bites, so it is the label
   a verifier and a customs authority both read.

   It is DERIVED from the CN code rather than typed on each row. A category
   that can disagree with the CN code beside it is a category nobody can trust,
   and 67 hand-entered copies of the same eight strings is 67 chances to
   mistype one. */
export type AggregatedGoodsCategory =
  | "Sintered ore"
  | "Pig iron"
  | "Ferro-alloys"
  | "Direct reduced iron"
  | "Crude steel"
  | "Iron or steel products"
  | "Unwrought aluminium"
  | "Aluminium products"
  | "Calcined clay"
  | "Cement clinker"
  | "Cement"
  | "Aluminous cement"
  | "Hydrogen"
  | "Electricity"
  | "Ammonia"
  | "Nitric acid"
  | "Urea"
  | "Mixed fertilisers";

/** CN prefix → aggregated goods category, from Table 1 of Annex I to
    Implementing Regulation (EU) 2025/2547. Longest prefix wins, so a heading
    rule can be narrowed by a subheading rule without reordering the table. */
const AGGREGATED_BY_CN: [prefix: string, category: AggregatedGoodsCategory][] =
  [
    ["2507", "Calcined clay"],
    ["2523", "Cement"],
    ["252310", "Cement clinker"],
    ["252330", "Aluminous cement"],
    ["2804", "Hydrogen"],
    ["2716", "Electricity"],
    ["2808", "Nitric acid"],
    ["2814", "Ammonia"],
    ["2834", "Mixed fertilisers"],
    ["3102", "Mixed fertilisers"],
    ["310210", "Urea"],
    ["3105", "Mixed fertilisers"],
    ["2601", "Sintered ore"],
    ["7201", "Pig iron"],
    ["7205", "Pig iron"],
    ["7202", "Ferro-alloys"],
    ["7203", "Direct reduced iron"],
    ["7206", "Crude steel"],
    ["7207", "Crude steel"],
    ["7218", "Crude steel"],
    ["7224", "Crude steel"],
    ["7601", "Unwrought aluminium"],
  ];

const digitsOf = (cn: string) => cn.replace(/\D/g, "");

export function aggregatedGoodsCategory(
  p: Pick<CatalogProduct, "cnCode" | "category">,
): AggregatedGoodsCategory {
  const d = digitsOf(p.cnCode);
  let best: AggregatedGoodsCategory | null = null;
  let bestLen = 0;
  for (const [prefix, cat] of AGGREGATED_BY_CN) {
    if (d.startsWith(prefix) && prefix.length > bestLen) {
      best = cat;
      bestLen = prefix.length;
    }
  }
  // Everything else in scope is a downstream good of its sector: chapters 72
  // and 73 beyond the precursor headings, and headings 7603–7616.
  return (
    best ??
    (p.category === "Aluminium"
      ? "Aluminium products"
      : "Iron or steel products")
  );
}

/* ── Product type ──────────────────────────────────────────────
   The tag shown on every catalogue row. It answers the one question that
   changes what the exporter has to do next — is this thing an INPUT to
   somebody else's process, a SEMI-FINISHED good, or a FINISHED article —
   because that is what decides whether the workspace will ask for precursors
   and how much of the SEE arrives already embedded. */
export type ProductType = "Precursor" | "Semi-finished" | "Finished product";

export const PRODUCT_TYPES: ProductType[] = [
  "Precursor",
  "Semi-finished",
  "Finished product",
];

export const PRODUCT_TYPE_HINT: Record<ProductType, string> = {
  Precursor:
    "A CBAM good that is normally consumed to make another CBAM good. It has no precursors of its own in scope, so its emissions are almost all direct.",
  "Semi-finished":
    "Cast or hot-worked but not yet a final shape. Carries the emissions of the precursors above it plus its own melting and casting.",
  "Finished product":
    "Rolled, coated, formed or assembled. Most of the embedded emissions arrive with the input material, so the precursor chain matters more than the site's own fuel.",
};

const PRECURSOR_GROUPS = PRIMARY_GROUPS_ALL;
const SEMI_GROUPS = new Set(["Semi-finished"]);

export function productType(p: Pick<CatalogProduct, "group">): ProductType {
  if (PRECURSOR_GROUPS.has(p.group)) return "Precursor";
  if (SEMI_GROUPS.has(p.group)) return "Semi-finished";
  return "Finished product";
}

/** Sub-groups present in the catalogue, in catalogue order — the filter chips
    on the product picker read from this so a group added to the catalogue
    appears in the filter without a second edit. */
export function productGroups(category?: ProductCategory): string[] {
  if (category) return GROUPS_BY_SECTOR[category] ?? [];
  return PRODUCT_CATEGORIES.flatMap((c) => GROUPS_BY_SECTOR[c]).filter(
    (g, i, all) => all.indexOf(g) === i,
  );
}

/** Search by name, keyword, official description, CN code or HS heading.
    Returns EVERY match — the picker pages by "show more", and a silent
    `.slice(0, 12)` is why the old catalogue read as incomplete when it was
    merely truncated. A digit-only query matches a CN prefix ("7208 3" finds
    every 7208 3x code), so the exporter can type what is on the declaration. */
export function searchCatalog(
  query: string,
  filters: {
    category?: ProductCategory;
    group?: string;
    type?: ProductType;
    heading?: string;
  } = {},
): CatalogProduct[] {
  const q = query.trim().toLowerCase();
  const digits = q.replace(/\D/g, "");
  const textual = /[a-z]/.test(q);
  return PRODUCT_CATALOG.filter((p) => {
    if (filters.category && p.category !== filters.category) return false;
    if (filters.group && p.group !== filters.group) return false;
    if (filters.heading && p.hsCode !== filters.heading) return false;
    if (filters.type && productType(p) !== filters.type) return false;
    if (!q) return true;
    if (digits && !textual) return digitsOf(p.cnCode).startsWith(digits);
    if (p.name.toLowerCase().includes(q)) return true;
    if (p.group.toLowerCase().includes(q)) return true;
    if (p.keywords.some((k) => k.includes(q))) return true;
    const description = (p as { description?: string }).description;
    if (description && description.toLowerCase().includes(q)) return true;
    if (
      digits &&
      (digitsOf(p.cnCode).startsWith(digits) || p.hsCode.startsWith(digits))
    )
      return true;
    return false;
  });
}

export const CATALOG_SIZE = PRODUCT_CATALOG.length;

/** The catalogue entry a typed CN code names: "7208 38 00", "72083800" and "7208.38.00" are one code.
    Fewer than eight digits name a heading, not a good, so they match nothing. */
export function catalogByCn(code: string): CatalogProduct | undefined {
  const d = digitsOf(code);
  if (d.length !== 8) return undefined;
  return PRODUCT_CATALOG.find((p) => digitsOf(p.cnCode) === d);
}
