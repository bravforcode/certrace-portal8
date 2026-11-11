/* Account identity and plan are read from the signed-in account. */

import { getPlan } from "./config";
import { accountStorage } from "./account-storage";
import { loadSession } from "./api/session";

export type SupplierStatus =
  | "submitted"
  | "in_progress"
  | "overdue"
  | "not_started";

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
export const isSelfSupplier = (supplierId: string) =>
  supplierId === SELF_SUPPLIER_ID;

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
export type SupplierRequestSpec = {
  supplierId: string;
  products: RequestProductSpec[];
};

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
  /** ISO timestamps, when the store records them */
  createdAt?: string;
  updatedAt?: string;
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
export type SeatRole = "owner" | "member" | "legal" | "verifier";
export type SeatState =
  | "contact"
  | "active"
  | "invited"
  | "review_requested"
  | "signed_off";

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

function savedIdentity(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const value = JSON.parse(
      accountStorage.getItem("certrace:profile") ?? "null",
    );
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

const accountPlan = () => loadSession()?.user.planId ?? "standard";

export const ORG = {
  get name() {
    return savedIdentity().companyName || loadSession()?.user.companyName || "";
  },
  get plan() {
    return accountPlan();
  },
  get planLabel() {
    return (
      getPlan(accountPlan() as Parameters<typeof getPlan>[0])?.name ??
      "Standard"
    );
  },
  get origin() {
    return savedIdentity().jurisdiction || "";
  },
  get sector() {
    return savedIdentity().sector || "";
  },
  get installationId() {
    return savedIdentity().installationId || "";
  },
  get seatsUsed() {
    try {
      const members = JSON.parse(
        accountStorage.getItem("certrace:team-members") ?? "[]",
      );
      return (
        (loadSession() ? 1 : 0) + (Array.isArray(members) ? members.length : 0)
      );
    } catch {
      return loadSession() ? 1 : 0;
    }
  },
  get seatsTotal() {
    return (
      getPlan(accountPlan() as Parameters<typeof getPlan>[0])?.caps.seats ?? 0
    );
  },
};

export const USER = {
  get accountId() {
    return loadSession()?.user.id ?? "";
  },
  get username() {
    return (loadSession()?.user.email ?? "").split("@")[0];
  },
  get name() {
    const profile = savedIdentity();
    const user = loadSession()?.user;
    return (
      `${profile.firstName || user?.firstName || ""} ${profile.lastName || user?.lastName || ""}`.trim() ||
      user?.email ||
      ""
    );
  },
  get role() {
    return savedIdentity().jobTitle || "";
  },
  get initials() {
    return this.name
      .split(/\s+/)
      .map((part) => part[0] ?? "")
      .slice(0, 2)
      .join("")
      .toUpperCase();
  },
  get email() {
    return loadSession()?.user.email ?? "";
  },
  get emailVerified() {
    return Boolean(loadSession());
  },
  get memberSince() {
    return "";
  },
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

export const supplierStatusMeta: Record<
  SupplierStatus,
  { label: string; tone: "ok" | "info" | "warn" | "err" | "muted" }
> = {
  submitted: { label: "submitted", tone: "ok" },
  in_progress: { label: "in progress", tone: "info" },
  overdue: { label: "overdue", tone: "err" },
  not_started: { label: "not started", tone: "muted" },
};

export const supplierSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

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
  verificationStatus:
    | "not_verified"
    | "internally_verified"
    | "third_party_verified";
  products: { name: string; cn: string }[];
  declarations: {
    id: string;
    name: string;
    period: string;
    status: SupplierStatus;
    progress: number;
    due: string;
  }[];
  reports: {
    id: string;
    period: string;
    emissions: number | null;
    state: "accepted" | "submitted";
  }[];
  documents: { name: string; type: string; date: string }[];
  pending: { label: string; declId: string; due: string }[];
  activity: {
    when: string;
    text: string;
    tone: "ok" | "info" | "warn" | "muted";
  }[];
};
