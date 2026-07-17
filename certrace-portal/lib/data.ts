/* Synthetic fixtures. Frontend-only readiness demo — this is the seam where a real API would slot in.
   Posture: a Thai steel/aluminium exporter preparing operator data for an EU-side declarant,
   as of mid-June 2026. */

import { getCreatedDeclaration } from "./declarations-store";
import { getCatalogProduct } from "./config";
import { decimal, decimalToString, type MeasuredValue } from "./mrv";

export type SupplierStatus = "submitted" | "in_progress" | "overdue" | "not_started";

export type SupplierRow = {
  id: string;
  name: string;
  ref: string;
  country: string;
  material: string;
  progress: number; // 0–100
  status: SupplierStatus;
  emissions: string | null; // exact TCO2E_PER_TNE fixture string, once submitted
  updated: string;
  critical: boolean;
};

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
  /** Decimal string exactly as entered on the commercial document. */
  qty: string;
  /** UN/CEFACT-style mass unit code. */
  unit: "TNE" | "KGM";
  /** Entered value/unit plus exact canonical TNE conversion and data version. */
  measurement: MeasuredValue;
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
  email: string; // contact reference only; no email delivery is configured
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
  /** Internal supplier-data collection deadline, not the legal filing date. */
  collectionDeadline?: string;
  /** Annual declaration deadline for the EU-side authorised CBAM declarant. */
  cbamDeclarationDue?: string;
  step: DeclarationStep;
  suppliers: SupplierRow[];
  totalEmbedded: string | null;
  carbonPricePaid: string | null; // entered origin-country carbon price; fixture is zero
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

/* Supplier readiness — surfaced when the exporter is picking suppliers for a
   new request, so they know what to expect before they invite anyone:
     returning   — already completed a CBAM request before (🟢)
     missing_installation — has a directory entry but no installation on file (🟡)
     new         — never submitted anything through Certrace (🔴) */
export type SupplierReadiness = "returning" | "missing_installation" | "new";
export const readinessMeta: Record<SupplierReadiness, { label: string; tone: "ok" | "warn" | "err" }> = {
  returning: { label: "Completed CBAM before", tone: "ok" },
  missing_installation: { label: "Missing installation info", tone: "warn" },
  new: { label: "Never submitted", tone: "err" },
};

/* The company's saved supplier directory. New suppliers invited during a
   declaration are appended here — no separate onboarding. */
export type DirectorySupplier = {
  id: string;
  company: string;
  contact: string;
  email: string;
  country: string;
  material?: string;
  readiness?: SupplierReadiness;
};
export const SUPPLIER_DIRECTORY: DirectorySupplier[] = [
  { id: "d1", company: "Siam Yamato Steel", contact: "Niran T.", email: "exports@siamyamato.co.th", country: "TH", material: "Hot-rolled coil", readiness: "returning" },
  { id: "d2", company: "Thai Metal Pro", contact: "Ploy S.", email: "carbon@thaimetalpro.com", country: "TH", material: "Steel billet", readiness: "returning" },
  { id: "d3", company: "G J Steel", contact: "Anan W.", email: "esg@gjsteel.co.th", country: "TH", material: "Hot-rolled coil", readiness: "missing_installation" },
  { id: "d4", company: "Rayong Steel Co", contact: "Suda P.", email: "quality@rayongsteel.co.th", country: "TH", material: "Rebar", readiness: "returning" },
  { id: "d5", company: "EEC Galvanizing Ltd", contact: "Korn M.", email: "ops@eecgalv.co.th", country: "TH", material: "Galvanised sheet", readiness: "returning" },
  { id: "d6", company: "Chonburi Foundry", contact: "Wichai R.", email: "sales@chonburifoundry.co.th", country: "TH", material: "Pig iron", readiness: "new" },
];

export type SeatRole = "owner" | "member" | "legal" | "auditor";
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

export const ORG = {
  name: "Siam Steel Export Co.",
  plan: "standard" as const, // plan id in config.PLANS
  planLabel: "Standard",
  origin: "TH",
  sector: "Steel & iron",
  installationId: "TH-RYG-0418",
  seatsUsed: 4,
  seatsTotal: 8,
};

export const USER = {
  // Permanent, never changes — this is the identity your org access, history and
  // Fixture identifier only; no production identity or tenant authority exists.
  accountId: "CTR-8841-2093",
  username: "wasawat.k",
  name: "Wasawat K.",
  role: "Head of Export Ops",
  initials: "WK",
  email: "wasawat@siamsteel.co.th",
  emailVerified: true,
  memberSince: "Mar 2026",
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
  { id: "n1", category: "event", tone: "warn", title: "G J Steel needs a follow-up", meta: "Annual 2026 working data · no email sent", href: "/declarations/cbam-2026-annual-steel", time: "2h ago" },
  { id: "n2", category: "credential", tone: "info", title: "Local reviewer assignment added", meta: "Demo roster only · no invite delivered", href: "/declarations/cbam-2026-annual-steel", time: "1d ago" },
  { id: "n3", category: "credential", tone: "muted", title: "Historical draft preview available", meta: "Local fixture · no receipt or acceptance", href: "/reports", time: "3d ago" },
  { id: "n4", category: "security", tone: "warn", title: "Authentication backend not configured", meta: "Displayed device sessions are illustrative only", href: "/settings?tab=privacy", time: "4d ago" },
  { id: "n5", category: "event", tone: "ok", title: "Thai Metal Pro submitted their form", meta: "64% → 100% complete · ready to review", href: "/suppliers/d2", time: "5d ago" },
  { id: "n6", category: "offer", tone: "muted", title: "EUDR coverage is opening soon", meta: "Join the waitlist from Coverage", href: "/regulations", time: "1w ago" },
];

// Steel & iron supply chain only — the precursors and inputs a CBAM steel
// installation actually has to account for (pig iron, scrap, DRI, coatings, grid power).
const supplierPool = (): SupplierRow[] => [
  { id: "s1", name: "Siam Yamato Steel", ref: "#0418", country: "TH", material: "Hot-rolled coil", progress: 100, status: "submitted", emissions: "1.84", updated: "2d ago", critical: true },
  { id: "s2", name: "Thai Metal Pro", ref: "#0231", country: "TH", material: "Steel billet", progress: 64, status: "in_progress", emissions: null, updated: "5h ago", critical: true },
  { id: "s3", name: "G J Steel", ref: "#0107", country: "TH", material: "Hot-rolled coil", progress: 28, status: "overdue", emissions: null, updated: "9d ago", critical: true },
  { id: "s4", name: "Rayong Steel Co", ref: "#0356", country: "TH", material: "Rebar", progress: 100, status: "submitted", emissions: "2.11", updated: "1d ago", critical: false },
  { id: "s5", name: "EEC Galvanizing Ltd", ref: "#0289", country: "TH", material: "Zinc coating", progress: 100, status: "submitted", emissions: "0.42", updated: "3d ago", critical: false },
  { id: "s6", name: "Chonburi Foundry", ref: "#0512", country: "TH", material: "Pig iron", progress: 0, status: "not_started", emissions: null, updated: "—", critical: true },
  { id: "s7", name: "Map Ta Phut Power", ref: "#0044", country: "TH", material: "Grid electricity", progress: 100, status: "submitted", emissions: "0.51", updated: "4d ago", critical: false },
  { id: "s8", name: "Eastern Scrap Trading", ref: "#0623", country: "TH", material: "Steel scrap", progress: 45, status: "in_progress", emissions: null, updated: "1d ago", critical: false },
];

/* QA fixture — deliberately malformed/extreme rows for stress-testing deterministic
   check (lib/ai-check.ts) and the PDF renderer (lib/download.ts). Not wired
   into any live declaration, dashboard, or reports list — importing this
   into a real Declaration would surface obviously-broken numbers to whoever
   is looking at the demo, so it stays a standalone fixture until there's an
   automated (Phase D) test harness to drive it instead. */
export const EDGE_CASE_SUPPLIERS: SupplierRow[] = [
  { id: "qa1", name: "Eastern Seaboard Integrated Steel Manufacturing & Galvanizing Public Company Limited", ref: "#9001", country: "TH", material: "Hot-rolled coil", progress: 100, status: "submitted", emissions: "1.6", updated: "1d ago", critical: true },
  { id: "qa2", name: "Zero Co", ref: "#9002", country: "TH", material: "Steel billet", progress: 100, status: "submitted", emissions: "0", updated: "1d ago", critical: false },
  { id: "qa3", name: "Way-Over-Benchmark Mills", ref: "#9003", country: "TH", material: "Rebar", progress: 100, status: "submitted", emissions: "42", updated: "1d ago", critical: true },
  { id: "qa4", name: "No Data Yet Ltd", ref: "#9004", country: "TH", material: "Steel scrap", progress: 0, status: "not_started", emissions: null, updated: "—", critical: false },
  { id: "qa5", name: "Unmapped Material Co", ref: "#9005", country: "TH", material: "Ferro-alloy additive", progress: 100, status: "submitted", emissions: "0.95", updated: "1d ago", critical: false },
];

export const DECLARATIONS: Declaration[] = [
  {
    id: "cbam-2026-annual-steel",
    name: "CBAM operator data · Annual 2026 · Steel",
    kind: "cbam",
    regulation: "cbam",
    origin: "TH",
    market: "EU",
    sector: "Steel & iron",
    period: "Annual 2026 (Jan–Dec)",
    due: "31 Jan 2027",
    dueInDays: 200,
    collectionDeadline: "2027-01-31",
    cbamDeclarationDue: "2027-09-30",
    periodStart: "2026-01-01",
    periodEnd: "2026-12-31",
    step: "collect",
    suppliers: supplierPool(),
    totalEmbedded: null,
    carbonPricePaid: "0",
  },
  {
    id: "cbam-2025-q4-steel",
    name: "Transitional CBAM · Q4 2025 · Steel",
    regulation: "cbam",
    origin: "TH",
    market: "EU",
    sector: "Steel & iron",
    period: "Q4 2025 (Oct–Dec)",
    due: "31 Jan 2026",
    dueInDays: -134,
    step: "done",
    suppliers: supplierPool().map((s) => ({ ...s, status: "submitted", progress: 100, emissions: s.emissions ?? fixtureEmissions("1.1", s.ref) })),
    totalEmbedded: "4615",
    carbonPricePaid: "0",
  },
];

/* Historical transitional fixtures + custom buyer requests.
   Kept `done` (except where noted) so the dashboard's "active" view stays focused
   on the open annual 2026 data-collection cycle. */
function fixtureEmissions(base: string, reference: string): string {
  return decimalToString(decimal(base).plus(decimal(String(parseInt(reference.slice(1), 10) % 9)).times(decimal("0.12"))));
}

const closedPool = (base: string) =>
  supplierPool().map((s) => ({
    ...s,
    status: "submitted" as SupplierStatus,
    progress: 100,
    emissions: s.emissions ?? fixtureEmissions(base, s.ref),
  }));

const ARCHIVE: Declaration[] = [
  { id: "cbam-2025-q3-steel", name: "Transitional CBAM · Q3 2025 · Steel", kind: "cbam", regulation: "cbam", origin: "TH", market: "EU", sector: "Steel & iron", period: "Q3 2025 (Jul–Sep)", due: "31 Oct 2025", dueInDays: -240, step: "done", suppliers: closedPool("1.05"), totalEmbedded: "4480", carbonPricePaid: "0", productCount: 11 },
  { id: "cbam-2025-q2-steel", name: "Transitional CBAM · Q2 2025 · Steel", kind: "cbam", regulation: "cbam", origin: "TH", market: "EU", sector: "Steel & iron", period: "Q2 2025 (Apr–Jun)", due: "31 Jul 2025", dueInDays: -332, step: "done", suppliers: closedPool("1.0"), totalEmbedded: "4390", carbonPricePaid: "0", productCount: 9 },
  { id: "cbam-2025-q1-steel", name: "Transitional CBAM · Q1 2025 · Steel", kind: "cbam", regulation: "cbam", origin: "TH", market: "EU", sector: "Steel & iron", period: "Q1 2025 (Jan–Mar)", due: "30 Apr 2025", dueInDays: -424, step: "done", suppliers: closedPool("0.98"), totalEmbedded: "4205", carbonPricePaid: "0", productCount: 8 },
  { id: "cbam-2024-annual-steel", name: "Transitional CBAM · 2024 working summary · Steel", kind: "cbam", regulation: "cbam", origin: "TH", market: "EU", sector: "Steel & iron", period: "Annual 2024", due: "31 May 2025", dueInDays: -393, step: "done", suppliers: closedPool("0.92"), totalEmbedded: "17120", carbonPricePaid: "0", productCount: 14 },
  { id: "buyer-abc-carbon-2026", name: "ABC Buyer · Carbon Data Request", kind: "buyer", title: "ABC Buyer — Carbon Data Request", regulation: "cbam", origin: "TH", market: "EU", sector: "Steel & iron", period: "Annual 2026 · per PO", due: "30 Sep 2026", dueInDays: 78, step: "collect", suppliers: closedPool("1.1").map((s, i) => (i > 2 ? { ...s, status: "in_progress", progress: 55, emissions: null } : s)), totalEmbedded: null, carbonPricePaid: "0", productCount: 6 },
  { id: "buyer-meridian-mtc-2026", name: "Meridian GmbH · MTC + EPD", kind: "buyer", title: "Meridian GmbH — MTC + EPD pack", regulation: "cbam", origin: "TH", market: "EU", sector: "Steel & iron", period: "Q2 2026 · per shipment", due: "15 Aug 2026", dueInDays: 48, step: "done", suppliers: closedPool("1.15"), totalEmbedded: "3960", carbonPricePaid: "0", productCount: 5 },
  { id: "cbam-2024-q4-steel", name: "CBAM · Q4 2024 · Steel", kind: "cbam", regulation: "cbam", origin: "TH", market: "EU", sector: "Steel & iron", period: "Q4 2024 (Oct–Dec)", due: "31 Jan 2025", dueInDays: -513, step: "done", suppliers: closedPool("0.9"), totalEmbedded: "4310", carbonPricePaid: "0", productCount: 10 },
  { id: "cbam-2024-q3-steel", name: "CBAM · Q3 2024 · Steel", kind: "cbam", regulation: "cbam", origin: "TH", market: "EU", sector: "Steel & iron", period: "Q3 2024 (Jul–Sep)", due: "31 Oct 2024", dueInDays: -605, step: "done", suppliers: closedPool("0.88"), totalEmbedded: "4150", carbonPricePaid: "0", productCount: 8 },
];

DECLARATIONS.push(...ARCHIVE);

export const SEATS: Seat[] = [
  { id: "u1", name: "Wasawat K.", email: "wasawat@siamsteel.co.th", org: "Siam Steel", role: "owner", state: "active", lastActive: "now" },
  { id: "u2", name: "Ananya P.", email: "ananya@siamsteel.co.th", org: "Siam Steel", role: "member", state: "active", lastActive: "1h ago" },
  { id: "u3", name: "Krit Legal Partners", email: "krit@kritlegal.co.th", org: "Krit Legal Partners", role: "legal", state: "active", lastActive: "3h ago" },
  { id: "u4", name: "TÜV SÜD (Verifier)", email: "audit@tuv-sud.example", org: "TÜV SÜD", role: "auditor", state: "invited", lastActive: "—" },
];

export const REPORTS: ReportRecord[] = [
  {
    id: "CTR-CBAM-2025-Q4",
    declaration: "Transitional CBAM · Q4 2025 · Steel",
    regulation: "cbam",
    period: "Q4 2025",
    generated: "28 Jan 2026",
    recipients: { buyer: false, authority: false, verifier: false },
    state: "draft",
  },
  {
    id: "CTR-CBAM-2025-Q3",
    declaration: "Transitional CBAM · Q3 2025 · Steel",
    regulation: "cbam",
    period: "Q3 2025",
    generated: "26 Oct 2025",
    recipients: { buyer: false, authority: false, verifier: false },
    state: "draft",
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
   of truth for "how many suppliers is this org actively working with",
   which is what the supplier-scaled plan caps in config.PLANS. Suppliers
   page, dashboard and billing all read the same count from here. */
export function getUniqueSuppliers(): SupplierRow[] {
  const map = new Map<string, SupplierRow>();
  DECLARATIONS.forEach((d) => d.suppliers.forEach((s) => map.set(s.name, s)));
  return [...map.values()];
}

/* ── Supplier profile (exporter-side detail) ──────────────────
   Assembled from existing declaration data. Master data (product names, CN
   codes) is real; quantities, documents and the activity log are mock. */
export const supplierSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const DIRECTORY_BY_COMPANY = new Map(SUPPLIER_DIRECTORY.map((d) => [d.company, d]));

// material → real CN code (CBAM master data) for the products-supplied view.
const MATERIAL_CN: Record<string, { name: string; cn: string }> = {
  "Hot-rolled coil": { name: "Hot-rolled coil", cn: "7208 39 00" },
  "Steel billet": { name: "Billets (semi-finished)", cn: "7207 11 90" },
  Rebar: { name: "Reinforcing bar (rebar)", cn: "7214 20 00" },
  "Zinc coating": { name: "Hot-dip galvanised sheet", cn: "7210 49 00" },
  "Pig iron": { name: "Pig iron, non-alloy", cn: "7201 10 90" },
  "Grid electricity": { name: "Electricity (energy input; not a mass-threshold good)", cn: "2716 00 00" },
  "Steel scrap": { name: "Ferrous waste & scrap (input; outside CBAM goods scope)", cn: "7204 49 90" },
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
  emissions: string | null;
  installation: { name: string; id: string } | null;
  requiredFields: { completed: number; total: number };
  documentsStats: { uploaded: number; total: number };
  missingInfo: string[];
  verificationStatus: "not_verified" | "internally_verified" | "third_party_verified";
  products: { name: string; cn: string }[];
  declarations: { id: string; name: string; period: string; status: SupplierStatus; progress: number; due: string }[];
  reports: { id: string; period: string; emissions: string | null; state: "draft" }[];
  documents: { name: string; type: string; date: string }[];
  pending: { label: string; declId: string; due: string }[];
  activity: { when: string; text: string; tone: "ok" | "info" | "warn" | "muted" }[];
};

export function getSupplierProfile(slug: string): SupplierProfile | null {
  let base: SupplierRow | undefined;
  const hits: { decl: Declaration; row: SupplierRow }[] = [];
  DECLARATIONS.forEach((d) =>
    d.suppliers.forEach((s) => {
      if (supplierSlug(s.name) === slug) {
        base = base ?? s;
        hits.push({ decl: d, row: s });
      }
    }),
  );
  if (!base) return null;

  const dir = DIRECTORY_BY_COMPANY.get(base.name);
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
    .map((h) => ({ id: `CTR-${h.decl.id.toUpperCase()}`, period: h.decl.period, emissions: h.row.emissions, state: "draft" as const }));

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
      ? { when: base.updated, text: "Recorded supplier data locally (not verified)", tone: "info" }
      : base.status === "overdue"
        ? { when: base.updated, text: "Follow-up due — no reminder sent", tone: "warn" }
        : { when: base.updated, text: "Opened the guided form", tone: "info" },
    { when: "this cycle", text: `Added to ${declarations[0]?.name ?? "CBAM data request"} in this browser`, tone: "muted" },
    ...(reports.length ? [{ when: reports[0].period, text: `${reports[0].period} local draft preview available`, tone: "muted" as const }] : []),
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

  const verificationStatus = "not_verified" as const;

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
    installation: { name: `${base.name} Primary Facility (fixture)`, id: `${base.country}-${base.ref.replace(/\D/g, "").padStart(4, "0")}` },
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
