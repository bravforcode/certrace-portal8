/* Mock fixtures. Frontend-only MVP — this is the seam where a real API would slot in.
   Posture: a Thai steel exporter (Siam Steel Export Co.) filing CBAM for the EU,
   as of mid-June 2026. CBAM-only, steel-only — matches the launch gating in config.ts. */

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
  productionRoute?: string;
};

export type DeclarationStep =
  | "collect"
  | "calculate"
  | "comply"
  | "review"
  | "report"
  | "submit"
  | "done";

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
};

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
  plan: "growth" as const, // plan id in config.PLANS
  planLabel: "Growth",
  origin: "TH",
  sector: "Steel & iron",
  installationId: "TH-RYG-0418",
  seatsUsed: 4,
  seatsTotal: 8,
};

export const USER = {
  name: "Wasawat K.",
  role: "Head of Export Ops",
  initials: "WK",
};

// Steel & iron supply chain only — the precursors and inputs a CBAM steel
// installation actually has to account for (pig iron, scrap, DRI, coatings, grid power).
const supplierPool = (): SupplierRow[] => [
  { id: "s1", name: "Siam Yamato Steel", ref: "#0418", country: "TH", material: "Hot-rolled coil", progress: 100, status: "submitted", emissions: 1.84, updated: "2d ago", critical: true, productionRoute: "EAF" },
  { id: "s2", name: "Thai Metal Pro", ref: "#0231", country: "TH", material: "Steel billet", progress: 64, status: "in_progress", emissions: null, updated: "5h ago", critical: true, productionRoute: "EAF" },
  { id: "s3", name: "G J Steel", ref: "#0107", country: "TH", material: "Hot-rolled coil", progress: 28, status: "overdue", emissions: null, updated: "9d ago", critical: true, productionRoute: "EAF" },
  { id: "s4", name: "Rayong Steel Co", ref: "#0356", country: "TH", material: "Rebar", progress: 100, status: "submitted", emissions: 2.11, updated: "1d ago", critical: false, productionRoute: "BF-BOF" },
  { id: "s5", name: "EEC Galvanizing Ltd", ref: "#0289", country: "TH", material: "Zinc coating", progress: 100, status: "submitted", emissions: 0.42, updated: "3d ago", critical: false, productionRoute: "N/A" },
  { id: "s6", name: "Chonburi Foundry", ref: "#0512", country: "TH", material: "Pig iron", progress: 0, status: "not_started", emissions: null, updated: "—", critical: true, productionRoute: "BF-BOF" },
  { id: "s7", name: "Map Ta Phut Power", ref: "#0044", country: "TH", material: "Grid electricity", progress: 100, status: "submitted", emissions: 0.51, updated: "4d ago", critical: false, productionRoute: "N/A" },
  { id: "s8", name: "Eastern Scrap Trading", ref: "#0623", country: "TH", material: "Steel scrap", progress: 45, status: "in_progress", emissions: null, updated: "1d ago", critical: false, productionRoute: "N/A" },
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

export const SEATS: Seat[] = [
  { id: "u1", name: "Wasawat K.", email: "wasawat@siamsteel.co.th", org: "Siam Steel", role: "owner", state: "active", lastActive: "now" },
  { id: "u2", name: "Ananya P.", email: "ananya@siamsteel.co.th", org: "Siam Steel", role: "member", state: "active", lastActive: "1h ago" },
  { id: "u3", name: "Krit Legal Partners", email: "krit@kritlegal.co.th", org: "Krit Legal Partners", role: "legal", state: "active", lastActive: "3h ago" },
  { id: "u4", name: "TÜV SÜD (Verifier)", email: "audit@tuv-sud.example", org: "TÜV SÜD", role: "auditor", state: "invited", lastActive: "—" },
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

export const getDeclaration = (id: string) => DECLARATIONS.find((d) => d.id === id);

export const supplierStatusMeta: Record<SupplierStatus, { label: string; tone: "ok" | "info" | "warn" | "err" | "muted" }> = {
  submitted: { label: "submitted", tone: "ok" },
  in_progress: { label: "in progress", tone: "info" },
  overdue: { label: "overdue", tone: "err" },
  not_started: { label: "not started", tone: "muted" },
};
