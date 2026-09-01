/* ════════════════════════════════════════════════════════════
   THE PLAN MODEL — three tiers, metered on CN codes

   WHAT IS AND IS NOT HERE. The commercial model is real: the tiers, what each
   one includes, and every cap on it. The PRICES are not. They are quoted, not
   listed — a CBAM engagement is scoped on how many CN codes and plants a year
   actually has, and a number on a page invites the wrong comparison before
   that conversation happens. Every price slot on the site therefore reads
   "on request" and every price button opens the demo form.

   That is a deliberate product decision, not missing data: do not put a figure
   back into this file without being asked to.

   SHAPE. Caps are modelled rather than written out — `{ kind: "upTo", n: 5 }`
   instead of the string "Up to 5" — so "Up to" and "Unlimited" are translated
   once in the dictionary instead of twelve times in a table. Feature cells are
   booleans wherever the answer is yes/no, and a text key only in the three
   rows where the three tiers genuinely differ in kind (onboarding, support,
   training) rather than in degree.

   ONE SOURCE, TWO SURFACES. The cards on the home page and the exporter page
   read TIERS. The comparison page reads TIERS *and* GROUPS. They cannot drift,
   which is the whole point of the file.
   ════════════════════════════════════════════════════════════ */

export type TierId = "starter" | "standard" | "enterprise";

/** A cap is a shape, not a sentence — see the header. */
export type Cap =
  | { kind: "exact"; n: number }
  | { kind: "upTo"; n: number }
  | { kind: "unlimited" }
  | { kind: "customFrom"; n: number };

export type Tier = {
  id: TierId;
  /** the middle tier carries the emphasis treatment on both surfaces */
  featured?: boolean;
  caps: {
    cnCodes: Cap;
    sites: Cap;
    years: Cap;
    seats: Cap;
    suppliers: Cap;
    tiersDeep: Cap;
  };
};

export const TIERS: Tier[] = [
  {
    id: "starter",
    caps: {
      cnCodes: { kind: "exact", n: 5 },
      sites: { kind: "exact", n: 1 },
      years: { kind: "exact", n: 1 },
      seats: { kind: "exact", n: 3 },
      suppliers: { kind: "unlimited" },
      tiersDeep: { kind: "upTo", n: 6 },
    },
  },
  {
    id: "standard",
    featured: true,
    caps: {
      cnCodes: { kind: "exact", n: 20 },
      sites: { kind: "upTo", n: 5 },
      years: { kind: "exact", n: 3 },
      seats: { kind: "exact", n: 10 },
      suppliers: { kind: "unlimited" },
      tiersDeep: { kind: "upTo", n: 6 },
    },
  },
  {
    id: "enterprise",
    caps: {
      cnCodes: { kind: "customFrom", n: 20 },
      sites: { kind: "unlimited" },
      years: { kind: "unlimited" },
      seats: { kind: "unlimited" },
      suppliers: { kind: "unlimited" },
      tiersDeep: { kind: "upTo", n: 6 },
    },
  },
];

/* ── The comparison matrix ──────────────────────────────────
   `true` = included · `false` = not on this tier · a string = a text cell,
   whose copy is looked up per language under `pricingPage.cells`.

   Row and group ids are stable and language-independent; every label lives in
   the dictionary. Adding a row here without adding its label there is a build
   error, which is the intended pressure. */
export type Cell = boolean | string;

export type CompareRow = {
  id: string;
  /** starter, standard, enterprise — always in that order */
  cells: [Cell, Cell, Cell];
};

export type CompareGroup = {
  id: string;
  rows: CompareRow[];
};

const ALL: [Cell, Cell, Cell] = [true, true, true];

export const COMPARE_GROUPS: CompareGroup[] = [
  {
    id: "scope",
    rows: [
      { id: "cnCodes", cells: ["capCn", "capCn", "capCn"] },
      { id: "sites", cells: ["capSites", "capSites", "capSites"] },
      { id: "years", cells: ["capYears", "capYears", "capYears"] },
      { id: "seats", cells: ["capSeats", "capSeats", "capSeats"] },
      { id: "suppliers", cells: ["capSuppliers", "capSuppliers", "capSuppliers"] },
      { id: "chainDepth", cells: ["capDepth", "capDepth", "capDepth"] },
    ],
  },
  {
    id: "collecting",
    rows: [
      { id: "linkNoAccount", cells: ALL },
      { id: "monthlyForm", cells: ALL },
      { id: "copyLastMonth", cells: ALL },
      { id: "bilingual", cells: ALL },
      { id: "blockIncomplete", cells: ALL },
      { id: "oneBoard", cells: ALL },
      { id: "chaseRecord", cells: ALL },
      { id: "ownDueDay", cells: ALL },
    ],
  },
  {
    id: "calculation",
    rows: [
      { id: "directIndirectPrecursor", cells: ALL },
      { id: "sectorRules", cells: ALL },
      { id: "everySupplierFigure", cells: ALL },
      { id: "weakestLink", cells: ALL },
      { id: "scrapZero", cells: ALL },
      { id: "defaultCap", cells: ALL },
    ],
  },
  {
    id: "readiness",
    rows: [
      { id: "showsMissing", cells: ALL },
      { id: "methodologyDoc", cells: ALL },
      { id: "versionsKept", cells: ALL },
      { id: "docsToMonth", cells: ALL },
      { id: "materiality", cells: ALL },
      /* The one genuine feature gate in the product. Everything else on this
         page differs by cap, not by capability. */
      { id: "aiExtraction", cells: [false, true, true] },
    ],
  },
  {
    id: "signoff",
    rows: [
      { id: "autosave", cells: ALL },
      { id: "signMonth", cells: ALL },
      { id: "signatureVoids", cells: ALL },
      { id: "sendBack", cells: ALL },
      { id: "activityFeed", cells: ALL },
    ],
  },
  {
    id: "cost",
    rows: [
      { id: "vsDefault", cells: ALL },
      { id: "certificateCost", cells: ALL },
      { id: "fullYear", cells: ALL },
      { id: "trendSector", cells: ALL },
      { id: "precursorShare", cells: ALL },
    ],
  },
  {
    id: "handover",
    rows: [
      { id: "onePdf", cells: ALL },
      { id: "verifierPack", cells: ALL },
      { id: "draftStamp", cells: ALL },
    ],
  },
  {
    id: "support",
    rows: [
      {
        id: "onboarding",
        cells: ["onboardingStarter", "onboardingStandard", "onboardingEnterprise"],
      },
      { id: "support", cells: ["supportStarter", "supportStandard", "supportEnterprise"] },
      { id: "training", cells: ["trainingStarter", "trainingStandard", "trainingEnterprise"] },
    ],
  },
];

/** Which cap a `cap*` cell key resolves to. Kept beside the matrix so a new
    cap row cannot be added without saying where its number comes from. */
export const CAP_CELL_KEYS: Record<string, keyof Tier["caps"]> = {
  capCn: "cnCodes",
  capSites: "sites",
  capYears: "years",
  capSeats: "seats",
  capSuppliers: "suppliers",
  capDepth: "tiersDeep",
};
