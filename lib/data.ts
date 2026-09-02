/* Mock fixtures. Frontend-only MVP — this is the seam where a real API would slot in.
   Posture: a Thai steel exporter (Siam Steel Export Co.) filing CBAM for the EU,
   as of mid-June 2026. CBAM-only, steel-only — matches the launch gating in config.ts. */

import { getCreatedDeclaration } from "./declarations-store";
import { getCatalogProduct, getPlan } from "./config";

export type SupplierStatus = "submitted" | "in_progress" | "overdue" | "not_started";

export type SupplierRow = {
  id: string;
  name: string;
  ref: string;
  country: string;
  material: string;
  progress: number; // 0–100
  status: SupplierStatus;
  emissions: number | null; // tCO₂e/t embedded, once submitted
  updated: string;
  critical: boolean;
  /** the exporter produces this themselves — no Smart Link, they fill it in-app */
  selfSupplied?: boolean;
};

/* ── Self-supply ───────────────────────────────────────────────
   Plenty of Thai exporters own the mill. When they do, the "supplier" for a
   product is themselves: there's nobody to email a Smart Link to, and the data
   lives under their own org profile. It's still a supplier row — same request
   spec, same guided form, same AI check, same calculation, same verification trail —
   just one whose identity resolves from lib/org.ts and whose link is never
   sent anywhere. The reserved id keeps it recognisable everywhere downstream. */
export const SELF_SUPPLIER_ID = "self";
export const isSelfSupplier = (supplierId: string) => supplierId === SELF_SUPPLIER_ID;

export type DeclarationStep =
  | "collect"
  | "calculate"
  | "comply"
  | "review"
  | "report"
  | "submit"
  | "done";

/* ── The exact ask, per supplier ──────────────────────────────
   Wizard-created declarations persist what was actually requested: which
   catalogue products each supplier delivers and the real lots behind them,
   plus which optional CBAM fields the exporter kept. The Smart Link resolves
   from this — one link per supplier covering ALL their products — instead of
   re-deriving a single product from a display string. Fixture declarations
   don't carry it; lib/supplier.ts falls back to material-based synthesis. */
export type RequestLotSpec = {
  qty: number;
  unit: string; // as invoiced — lib/supplier.ts converts net mass to tonnes
  from: string; // optional production-period start (ISO)
  to: string; // optional production-period end (ISO)
  notes: string;
};
export type RequestProductSpec = { productId: string; lots: RequestLotSpec[] };
export type SupplierRequestSpec = { supplierId: string; products: RequestProductSpec[] };

/* The EU buyer / importer this declaration's data is communicated to. Their
   Authorised CBAM Declarant is the party that actually files with the CBAM
   Registry — without a named buyer + EORI the output cannot reach anyone. */
export type DeclarationBuyer = {
  name: string; // legal name of the EU importer
  eori: string; // EORI number the declarant files under
  email: string; // where the Communication Template is sent
  contact?: string;
};

export type Declaration = {
  id: string;
  name: string;
  regulation: string; // regulation id
  origin: string; // jurisdiction code
  market: string; // destination market code
  sector: string;
  period: string;
  due: string;
  dueInDays: number;
  step: DeclarationStep;
  suppliers: SupplierRow[];
  totalEmbedded: number | null;
  carbonPricePaid: number | null; // THB/tCO₂e proxy (Thailand has no carbon price yet → 0)
  /** "cbam" = generated from the CBAM template · "buyer" = custom buyer request */
  kind?: "cbam" | "buyer";
  /** display title for the list (buyer requests carry their own name) */
  title?: string;
  productCount?: number;
  /** per-supplier request spec (wizard-created declarations only) */
  requests?: SupplierRequestSpec[];
  /** CBAM field ids the exporter included on Classification (required ones are always in) */
  includedFieldIds?: string[];
  /** EU buyer / importer whose declarant receives this data (wizard-created) */
  buyer?: DeclarationBuyer;
  /** exporter's note shown at the top of every supplier's guided form */
  notesToSuppliers?: string;
  /** internal request description from the wizard */
  description?: string;
  /** ISO reporting-period bounds, e.g. 2026-01-01 / 2026-12-31 */
  periodStart?: string;
  periodEnd?: string;
};

/* The company's saved supplier directory. New suppliers invited during a
   declaration are appended here — no separate onboarding.

   Deliberately just identity: company, who to contact, where they are. There
   was once a "readiness" verdict on each row ("Completed CBAM before",
   "Never submitted") — it's gone, because nothing in the app actually measures
   a supplier's character, and a label that looks derived but isn't is worse
   than no label. Real per-supplier status comes from their submissions. */
export type DirectorySupplier = {
  id: string;
  company: string;
  contact: string;
  email: string;
  country: string; // ISO 3166-1 alpha-2
  material?: string;
};
export const SUPPLIER_DIRECTORY: DirectorySupplier[] = [
  { id: "d1", company: "Siam Yamato Steel", contact: "Niran T.", email: "exports@siamyamato.co.th", country: "TH", material: "Hot-rolled coil" },
  { id: "d2", company: "Thai Metal Pro", contact: "Ploy S.", email: "carbon@thaimetalpro.com", country: "TH", material: "Steel billet" },
  { id: "d3", company: "G J Steel", contact: "Anan W.", email: "esg@gjsteel.co.th", country: "TH", material: "Hot-rolled coil" },
  { id: "d4", company: "Rayong Steel Co", contact: "Suda P.", email: "quality@rayongsteel.co.th", country: "TH", material: "Rebar" },
  { id: "d5", company: "EEC Galvanizing Ltd", contact: "Korn M.", email: "ops@eecgalv.co.th", country: "TH", material: "Galvanised sheet" },
  { id: "d6", company: "Chonburi Foundry", contact: "Wichai R.", email: "sales@chonburifoundry.co.th", country: "TH", material: "Pig iron" },
];

export type SeatRole = "owner" | "member" | "legal" | "verifier";
export type SeatState = "active" | "invited" | "review_requested" | "signed_off";

export type Seat = {
  id: string;
  name: string;
  email: string;
  org: string;
  role: SeatRole;
  state: SeatState;
  lastActive: string;
};

export type ReportRecord = {
  id: string;
  declaration: string;
  regulation: string;
  period: string;
  generated: string;
  recipients: { buyer: boolean; authority: boolean; verifier: boolean };
  state: "draft" | "in_review" | "submitted" | "accepted";
};

/* ════════════════════════════════════════════════════════════
   WHICH PLAN THIS DEMO ACCOUNT IS ON

   FOUR STATES, ONE CONSTANT. Change `ORG_PLAN` to walk the product through
   every commercial posture it has:

     "starter"      · 5 CN codes, 1 site, 3 seats, no AI extraction
     "standard"     · 20 CN codes, 5 sites, 10 seats
     "enterprise"   · nothing capped
     "trial"        · nothing capped either, for one month — and then the
                      whole account goes read-only (see TRIAL_STARTED_ON)

   `TRIAL_STARTED_ON` is what decides whether a trial account is LIVE or
   ENDED. It is a date rather than a boolean on purpose: the countdown bar on
   /billing, the days-left figure and the lock all read the same one fact, so
   they can never disagree about how much of the month is left.

     · a date inside the last 30 days  → trial running, days-left bar fills
     · a date more than 30 days ago    → trial over, account locked read-only

   THE SAME TWO KNOBS WORK WITHOUT EDITING THIS FILE. `?plan=trial`,
   `?trialDay=31` (how many days into the trial to pretend it is) and
   `?plan=standard` are read once from the URL and remembered in
   localStorage — see lib/plan.ts, `demoOverride`. That exists so the four
   states can be SHOWN to somebody on a running build; the constants here are
   still the default the app boots with.
   ════════════════════════════════════════════════════════════ */

const ORG_PLAN = "trial" as const;

/** Day the free trial started, ISO date. Only read when ORG_PLAN is "trial". */
export const TRIAL_STARTED_ON = "2026-08-04";

export const ORG = {
  name: "Siam Steel Export Co.",
  plan: ORG_PLAN, // plan id in config.PLANS (or "trial" — see above)
  planLabel: getPlan(ORG_PLAN)?.name ?? "Standard",
  origin: "TH",
  sector: "Steel & iron",
  installationId: "TH-RYG-0418",
  /* NEITHER OF THESE IS A LITERAL ANY MORE, and both used to be.

     `seatsUsed` said 4 while /team listed three people: the fourth row in
     SEATS is the verifier, which the product no longer has a portal for and
     which /team filters out — so the sidebar and the page it links to
     disagreed about the same account. A getter, because SEATS is declared
     further down this file and is only ever read at render time.

     `seatsTotal` said 8 while Standard sold 10. The seat count is a term of
     the plan, so it comes from the plan. */
  get seatsUsed() {
    return SEATS.filter((s) => s.role !== "verifier").length;
  },
  seatsTotal: getPlan(ORG_PLAN)?.caps.seats ?? 0,
};

/* THE SIGNED-IN PERSON — and in this build they hold the LEGAL / COMPLIANCE
   seat, not the owner's.

   The owner build shipped this as Wasawat K., who is `u1` in SEATS and owns
   the account. Leaving it would have produced the worst possible thing here:
   a portal that greets the owner by name, writes their name into every
   sign-off, and then refuses them the readings — while the owner is also the
   person this seat is supposed to be independent of.

   USER.name is not decoration. It is the provenance stamp written into every
   month sign-off and every pack signature (grep USER.name), so a verifier
   reading the pack sees who inside the company actually attested to it. On
   this seat that stamp IS the deliverable, and it has to be whoever is
   holding the tab. See lib/seat.ts, SIGNED_IN_SEAT. */
export const USER = {
  // Permanent, never changes — this is the identity your org access, history and
  // seats are actually keyed to. Email is just a contact channel on top of it,
  // so swapping email (e.g. an employee leaving) never orphans the account.
  accountId: "CTR-8841-4472",
  username: "pimchanok.s",
  name: "Pimchanok S.",
  role: "Legal & Compliance Manager",
  initials: "PS",
  email: "pimchanok@siamsteel.co.th",
  emailVerified: true,
  memberSince: "Feb 2026",
};

export type NoticeCategory = "security" | "event" | "credential" | "offer";
export type Notice = {
  id: string;
  category: NoticeCategory;
  tone: "err" | "info" | "ok" | "warn" | "muted";
  title: string;
  meta: string;
  href: string;
  time: string;
  read?: boolean;
};

export const NOTIFICATIONS: Notice[] = [
  { id: "n1", category: "event", tone: "err", title: "G J Steel is overdue", meta: "CBAM Q2 2026 · 9 days no response", href: "/declarations/cbam-2026-q2-steel", time: "2h ago" },
  { id: "n2", category: "credential", tone: "info", title: "Legal sign-off requested", meta: "Krit Legal Partners notified", href: "/declarations/cbam-2026-q1-steel", time: "1d ago" },
  { id: "n3", category: "credential", tone: "ok", title: "Q1 2026 package accepted", meta: "EU importer confirmed receipt", href: "/reports", time: "3d ago" },
  { id: "n4", category: "security", tone: "warn", title: "New sign-in from Chrome on macOS", meta: "Bangkok, TH · if this wasn't you, secure your account", href: "/settings?tab=privacy", time: "4d ago" },
  { id: "n5", category: "event", tone: "ok", title: "Thai Metal Pro submitted their form", meta: "64% → 100% complete · ready to review", href: "/suppliers/d2", time: "5d ago" },
  { id: "n6", category: "offer", tone: "muted", title: "EUDR coverage is opening soon", meta: "Join the waitlist from Coverage", href: "/regulations", time: "1w ago" },
];

// Steel & iron supply chain only — the precursors and inputs a CBAM steel
// installation actually has to account for (pig iron, scrap, DRI, coatings, grid power).
const supplierPool = (): SupplierRow[] => [
  { id: "s1", name: "Siam Yamato Steel", ref: "#0418", country: "TH", material: "Hot-rolled coil", progress: 100, status: "submitted", emissions: 1.84, updated: "2d ago", critical: true },
  { id: "s2", name: "Thai Metal Pro", ref: "#0231", country: "TH", material: "Steel billet", progress: 64, status: "in_progress", emissions: null, updated: "5h ago", critical: true },
  { id: "s3", name: "G J Steel", ref: "#0107", country: "TH", material: "Hot-rolled coil", progress: 28, status: "overdue", emissions: null, updated: "9d ago", critical: true },
  { id: "s4", name: "Rayong Steel Co", ref: "#0356", country: "TH", material: "Rebar", progress: 100, status: "submitted", emissions: 2.11, updated: "1d ago", critical: false },
  { id: "s5", name: "EEC Galvanizing Ltd", ref: "#0289", country: "TH", material: "Zinc coating", progress: 100, status: "submitted", emissions: 0.42, updated: "3d ago", critical: false },
  { id: "s6", name: "Chonburi Foundry", ref: "#0512", country: "TH", material: "Pig iron", progress: 0, status: "not_started", emissions: null, updated: "—", critical: true },
  { id: "s7", name: "Map Ta Phut Power", ref: "#0044", country: "TH", material: "Grid electricity", progress: 100, status: "submitted", emissions: 0.51, updated: "4d ago", critical: false },
  { id: "s8", name: "Eastern Scrap Trading", ref: "#0623", country: "TH", material: "Steel scrap", progress: 45, status: "in_progress", emissions: null, updated: "1d ago", critical: false },
];

/* QA fixture — deliberately malformed/extreme rows for stress-testing the AI
   check (lib/ai-check.ts) and the PDF renderer (lib/download.ts). Not wired
   into any live declaration, dashboard, or reports list — importing this
   into a real Declaration would surface obviously-broken numbers to whoever
   is looking at the demo, so it stays a standalone fixture until there's an
   automated (Phase D) test harness to drive it instead. */
export const EDGE_CASE_SUPPLIERS: SupplierRow[] = [
  { id: "qa1", name: "Eastern Seaboard Integrated Steel Manufacturing & Galvanizing Public Company Limited", ref: "#9001", country: "TH", material: "Hot-rolled coil", progress: 100, status: "submitted", emissions: 1.6, updated: "1d ago", critical: true },
  { id: "qa2", name: "Zero Co", ref: "#9002", country: "TH", material: "Steel billet", progress: 100, status: "submitted", emissions: 0, updated: "1d ago", critical: false },
  { id: "qa3", name: "Way-Over-Benchmark Mills", ref: "#9003", country: "TH", material: "Rebar", progress: 100, status: "submitted", emissions: 42, updated: "1d ago", critical: true },
  { id: "qa4", name: "No Data Yet Ltd", ref: "#9004", country: "TH", material: "Steel scrap", progress: 0, status: "not_started", emissions: null, updated: "—", critical: false },
  { id: "qa5", name: "Unmapped Material Co", ref: "#9005", country: "TH", material: "Ferro-alloy additive", progress: 100, status: "submitted", emissions: 0.95, updated: "1d ago", critical: false },
];

export const DECLARATIONS: Declaration[] = [
  {
    id: "cbam-2026-q2-steel",
    name: "CBAM · Q2 2026 · Steel",
    regulation: "cbam",
    origin: "TH",
    market: "EU",
    sector: "Steel & iron",
    period: "Q2 2026 (Apr–Jun)",
    due: "31 Jul 2026",
    dueInDays: 17,
    step: "collect",
    suppliers: supplierPool(),
    totalEmbedded: null,
    carbonPricePaid: 0,
  },
  {
    id: "cbam-2026-q1-steel",
    name: "CBAM · Q1 2026 · Steel",
    regulation: "cbam",
    origin: "TH",
    market: "EU",
    sector: "Steel & iron",
    period: "Q1 2026 (Jan–Mar)",
    due: "30 Apr 2026",
    dueInDays: -45,
    step: "done",
    suppliers: supplierPool().map((s) => ({ ...s, status: "submitted", progress: 100, emissions: s.emissions ?? Number((1.2 + (parseInt(s.ref.slice(1)) % 9) * 0.13).toFixed(2)) })),
    totalEmbedded: 4820,
    carbonPricePaid: 0,
  },
  {
    id: "cbam-2025-q4-steel",
    name: "CBAM · Q4 2025 · Steel",
    regulation: "cbam",
    origin: "TH",
    market: "EU",
    sector: "Steel & iron",
    period: "Q4 2025 (Oct–Dec)",
    due: "31 Jan 2026",
    dueInDays: -134,
    step: "done",
    suppliers: supplierPool().map((s) => ({ ...s, status: "submitted", progress: 100, emissions: s.emissions ?? Number((1.1 + (parseInt(s.ref.slice(1)) % 9) * 0.12).toFixed(2)) })),
    totalEmbedded: 4615,
    carbonPricePaid: 0,
  },
];

/* Historical + custom declarations — give the index a real, scrollable archive.
   Kept `done` (except where noted) so the dashboard's "active" view stays focused
   on the open Q2 cycle. Each links to a working detail page. */
const closedPool = (base: number) =>
  supplierPool().map((s) => ({
    ...s,
    status: "submitted" as SupplierStatus,
    progress: 100,
    emissions: s.emissions ?? Number((base + (parseInt(s.ref.slice(1)) % 9) * 0.12).toFixed(2)),
  }));

const ARCHIVE: Declaration[] = [
  { id: "cbam-2025-q3-steel", name: "CBAM · Q3 2025 · Steel", kind: "cbam", regulation: "cbam", origin: "TH", market: "EU", sector: "Steel & iron", period: "Q3 2025 (Jul–Sep)", due: "31 Oct 2025", dueInDays: -240, step: "done", suppliers: closedPool(1.05), totalEmbedded: 4480, carbonPricePaid: 0, productCount: 11 },
  { id: "cbam-2025-q2-steel", name: "CBAM · Q2 2025 · Steel", kind: "cbam", regulation: "cbam", origin: "TH", market: "EU", sector: "Steel & iron", period: "Q2 2025 (Apr–Jun)", due: "31 Jul 2025", dueInDays: -332, step: "done", suppliers: closedPool(1.0), totalEmbedded: 4390, carbonPricePaid: 0, productCount: 9 },
  { id: "cbam-2025-q1-steel", name: "CBAM · Q1 2025 · Steel", kind: "cbam", regulation: "cbam", origin: "TH", market: "EU", sector: "Steel & iron", period: "Q1 2025 (Jan–Mar)", due: "30 Apr 2025", dueInDays: -424, step: "done", suppliers: closedPool(0.98), totalEmbedded: 4205, carbonPricePaid: 0, productCount: 8 },
  { id: "cbam-2024-annual-steel", name: "CBAM · 2024 Annual · Steel", kind: "cbam", regulation: "cbam", origin: "TH", market: "EU", sector: "Steel & iron", period: "Annual 2024", due: "31 May 2025", dueInDays: -393, step: "done", suppliers: closedPool(0.92), totalEmbedded: 17120, carbonPricePaid: 0, productCount: 14 },
  { id: "buyer-abc-carbon-2026", name: "ABC Buyer · Carbon Data Request", kind: "buyer", title: "ABC Buyer — Carbon Data Request", regulation: "cbam", origin: "TH", market: "EU", sector: "Steel & iron", period: "Annual 2026 · per PO", due: "30 Sep 2026", dueInDays: 78, step: "collect", suppliers: closedPool(1.1).map((s, i) => (i > 2 ? { ...s, status: "in_progress", progress: 55, emissions: null } : s)), totalEmbedded: null, carbonPricePaid: 0, productCount: 6 },
  { id: "buyer-meridian-mtc-2026", name: "Meridian GmbH · MTC + EPD", kind: "buyer", title: "Meridian GmbH — MTC + EPD pack", regulation: "cbam", origin: "TH", market: "EU", sector: "Steel & iron", period: "Q2 2026 · per shipment", due: "15 Aug 2026", dueInDays: 48, step: "done", suppliers: closedPool(1.15), totalEmbedded: 3960, carbonPricePaid: 0, productCount: 5 },
  { id: "cbam-2024-q4-steel", name: "CBAM · Q4 2024 · Steel", kind: "cbam", regulation: "cbam", origin: "TH", market: "EU", sector: "Steel & iron", period: "Q4 2024 (Oct–Dec)", due: "31 Jan 2025", dueInDays: -513, step: "done", suppliers: closedPool(0.9), totalEmbedded: 4310, carbonPricePaid: 0, productCount: 10 },
  { id: "cbam-2024-q3-steel", name: "CBAM · Q3 2024 · Steel", kind: "cbam", regulation: "cbam", origin: "TH", market: "EU", sector: "Steel & iron", period: "Q3 2024 (Jul–Sep)", due: "31 Oct 2024", dueInDays: -605, step: "done", suppliers: closedPool(0.88), totalEmbedded: 4150, carbonPricePaid: 0, productCount: 8 },
];

DECLARATIONS.push(...ARCHIVE);

/* THE LEGAL SEAT IS AN EMPLOYEE HERE, NOT THE OUTSIDE FIRM.

   The owner build put Krit Legal Partners — external counsel, a different
   org — in the legal seat. That is a real arrangement, but it cannot be the
   one this build signs in as: lib/seat.ts resolves SIGNED_IN_SEAT from this
   list, and a portal that stamps an outside law firm's name onto the
   company's own attestation is claiming something about that firm which
   nobody at it agreed to.

   So `u3` is Pimchanok S., Legal & Compliance in-house, matching USER above.
   Krit stays on the account as external counsel — the arrangement is real —
   but they hold no seat, because they do not sign the company's figures. */
export const SEATS: Seat[] = [
  { id: "u1", name: "Wasawat K.", email: "wasawat@siamsteel.co.th", org: "Siam Steel", role: "owner", state: "active", lastActive: "2h ago" },
  { id: "u2", name: "Ananya P.", email: "ananya@siamsteel.co.th", org: "Siam Steel", role: "member", state: "active", lastActive: "1h ago" },
  { id: "u3", name: "Pimchanok S.", email: "pimchanok@siamsteel.co.th", org: "Siam Steel", role: "legal", state: "active", lastActive: "now" },
  { id: "u4", name: "TÜV SÜD (Verifier)", email: "verification@tuv-sud.example", org: "TÜV SÜD", role: "verifier", state: "invited", lastActive: "—" },
];

export const REPORTS: ReportRecord[] = [
  {
    id: "CTR-CBAM-2026-Q1",
    declaration: "CBAM · Q1 2026 · Steel",
    regulation: "cbam",
    period: "Q1 2026",
    generated: "27 Apr 2026",
    recipients: { buyer: true, authority: true, verifier: true },
    state: "accepted",
  },
  {
    id: "CTR-CBAM-2025-Q4",
    declaration: "CBAM · Q4 2025 · Steel",
    regulation: "cbam",
    period: "Q4 2025",
    generated: "28 Jan 2026",
    recipients: { buyer: true, authority: true, verifier: true },
    state: "accepted",
  },
  {
    id: "CTR-CBAM-2025-Q3",
    declaration: "CBAM · Q3 2025 · Steel",
    regulation: "cbam",
    period: "Q3 2025",
    generated: "26 Oct 2025",
    recipients: { buyer: true, authority: true, verifier: true },
    state: "accepted",
  },
];

export const getDeclaration = (id: string) => DECLARATIONS.find((d) => d.id === id) ?? getCreatedDeclaration(id) ?? undefined;

export const supplierStatusMeta: Record<SupplierStatus, { label: string; tone: "ok" | "info" | "warn" | "err" | "muted" }> = {
  submitted: { label: "submitted", tone: "ok" },
  in_progress: { label: "in progress", tone: "info" },
  overdue: { label: "overdue", tone: "err" },
  not_started: { label: "not started", tone: "muted" },
};

/* De-duped supplier directory across every declaration — the single source
   of truth for "how many suppliers is this org actively working with".

   NO PLAN READS THIS ANY MORE. It used to feed a supplier cap; suppliers are
   unlimited and free on every tier now (the meter is CN codes — see the
   pricing block in config.ts), so this is a working count for the reader, not
   an entitlement. */
export function getUniqueSuppliers(): SupplierRow[] {
  return getUniqueSuppliersFrom(DECLARATIONS);
}

/** Same roll-up over an arbitrary declaration set, so the client can fold in
    wizard-created declarations (which live in localStorage, not in the array). */
export function getUniqueSuppliersFrom(declarations: Declaration[]): SupplierRow[] {
  const map = new Map<string, SupplierRow>();
  declarations.forEach((d) => d.suppliers.forEach((s) => map.set(s.name, s)));
  return [...map.values()];
}

/* ── Supplier profile (exporter-side detail) ──────────────────
   Assembled from existing declaration data. Master data (product names, CN
   codes) is real; quantities, documents and the activity log are mock. */
export const supplierSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// material → real CN code (CBAM master data) for the products-supplied view.
const MATERIAL_CN: Record<string, { name: string; cn: string }> = {
  "Hot-rolled coil": { name: "Hot-rolled coil", cn: "7208 39 00" },
  "Steel billet": { name: "Billets (semi-finished)", cn: "7207 11 90" },
  Rebar: { name: "Reinforcing bar (rebar)", cn: "7214 20 00" },
  "Zinc coating": { name: "Hot-dip galvanised sheet", cn: "7210 49 00" },
  "Pig iron": { name: "Pig iron, non-alloy", cn: "7201 10 90" },
  "Grid electricity": { name: "Electricity (precursor input)", cn: "2716 00 00" },
  "Steel scrap": { name: "Ferrous waste & scrap", cn: "7204 49 90" },
};

export type SupplierProfile = {
  id: string;
  name: string;
  slug: string;
  country: string;
  ref: string;
  contact: string;
  email: string;
  status: SupplierStatus;
  critical: boolean;
  compliancePct: number;
  emissions: number | null;
  installation: { name: string; id: string } | null;
  requiredFields: { completed: number; total: number };
  documentsStats: { uploaded: number; total: number };
  missingInfo: string[];
  verificationStatus: "not_verified" | "internally_verified" | "third_party_verified";
  products: { name: string; cn: string }[];
  declarations: { id: string; name: string; period: string; status: SupplierStatus; progress: number; due: string }[];
  reports: { id: string; period: string; emissions: number | null; state: "accepted" | "submitted" }[];
  documents: { name: string; type: string; date: string }[];
  pending: { label: string; declId: string; due: string }[];
  activity: { when: string; text: string; tone: "ok" | "info" | "warn" | "muted" }[];
};

export function getSupplierProfile(slug: string): SupplierProfile | null {
  return getSupplierProfileFrom(slug, DECLARATIONS);
}

/** Profile assembled from an explicit declaration set, so the client can
    include wizard-created declarations from localStorage. */
export function getSupplierProfileFrom(slug: string, declarationSet: Declaration[], directory: DirectorySupplier[] = SUPPLIER_DIRECTORY): SupplierProfile | null {
  let base: SupplierRow | undefined;
  const hits: { decl: Declaration; row: SupplierRow }[] = [];
  declarationSet.forEach((d) =>
    d.suppliers.forEach((s) => {
      if (supplierSlug(s.name) === slug) {
        base = base ?? s;
        hits.push({ decl: d, row: s });
      }
    }),
  );
  if (!base) return null;

  const dir = new Map(directory.map((d) => [d.company, d])).get(base.name);
  // Wizard-created declarations carry the exact catalogue products requested;
  // fixtures fall back to the display-material lookup.
  const fromRequests = hits.flatMap((h) =>
    (h.decl.requests?.find((r) => r.supplierId === h.row.id)?.products ?? [])
      .map((p) => getCatalogProduct(p.productId))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((p) => ({ name: p.name, cn: p.cnCode })),
  );
  const materials = [...new Set(hits.map((h) => h.row.material))];
  const fromMaterials = materials.map((m) => MATERIAL_CN[m] ?? { name: m, cn: "—" });
  const merged = fromRequests.length > 0 ? fromRequests : fromMaterials;
  const products = [...new Map(merged.map((p) => [p.cn + p.name, p])).values()];

  // newest declarations first (by |dueInDays| with open ones first)
  const declarations = hits
    .sort((a, b) => (a.decl.step === "done" ? 1 : 0) - (b.decl.step === "done" ? 1 : 0) || a.decl.dueInDays - b.decl.dueInDays)
    .map((h) => ({ id: h.decl.id, name: h.decl.title ?? h.decl.name, period: h.decl.period, status: h.row.status, progress: h.row.progress, due: h.decl.due }));

  const reports = hits
    .filter((h) => h.decl.step === "done")
    .map((h) => ({ id: `CTR-${h.decl.id.toUpperCase()}`, period: h.decl.period, emissions: h.row.emissions, state: "accepted" as const }));

  const pending = hits
    .filter((h) => h.decl.step !== "done" && h.row.status !== "submitted")
    .map((h) => ({ label: `${h.decl.title ?? h.decl.name} — carbon data`, declId: h.decl.id, due: h.decl.due }));

  const submitted = base.status === "submitted";
  const documents = submitted
    ? [
        { name: "Mill Test Certificate (EN 10204 3.1)", type: "MTC", date: base.updated },
        { name: "CBAM embedded-emissions sheet", type: "CBAM", date: base.updated },
        { name: "Certificate of Origin", type: "COO", date: base.updated },
      ]
    : base.status === "in_progress"
      ? [{ name: "Mill Test Certificate (EN 10204 3.1)", type: "MTC", date: base.updated }]
      : [];

  const activity: SupplierProfile["activity"] = [
    submitted
      ? { when: base.updated, text: "Submitted verified CBAM data", tone: "ok" }
      : base.status === "overdue"
        ? { when: base.updated, text: "Reminder sent — response overdue", tone: "warn" }
        : { when: base.updated, text: "Opened the guided form", tone: "info" },
    { when: "this cycle", text: `Invited to ${declarations[0]?.name ?? "CBAM declaration"}`, tone: "muted" },
    ...(reports.length ? [{ when: reports[0].period, text: `${reports[0].period} package accepted by importer`, tone: "ok" as const }] : []),
  ];

  // Generate mock statistics based on the supplier's status
  const requiredFieldsTotal = 18;
  const requiredFieldsCompleted = submitted ? 18 : base.status === "in_progress" ? Math.floor((base.progress / 100) * 18) : 0;
  
  const documentsTotal = 10;
  const documentsUploaded = documents.length;

  const missingInfo = [];
  if (base.status === "in_progress") {
    missingInfo.push("Electricity consumption data");
    missingInfo.push("Production route details");
  } else if (base.status === "overdue" || base.status === "not_started") {
    missingInfo.push("All mandatory CBAM data");
  }

  const verificationStatus = submitted ? "third_party_verified" : base.status === "in_progress" ? "not_verified" : "not_verified";

  return {
    id: base.id,
    name: base.name,
    slug,
    country: base.country,
    ref: base.ref,
    contact: dir?.contact ?? "—",
    email: dir?.email ?? `${slug}@supplier.example`,
    status: base.status,
    critical: base.critical,
    compliancePct: base.progress,
    emissions: base.emissions,
    installation: { name: `${base.name} Primary Facility`, id: `${base.country}-${Math.floor(1000 + Math.random() * 9000)}` },
    requiredFields: { completed: requiredFieldsCompleted, total: requiredFieldsTotal },
    documentsStats: { uploaded: documentsUploaded, total: documentsTotal },
    missingInfo,
    verificationStatus,
    products,
    declarations,
    reports,
    documents,
    pending,
    activity,
  };
}
