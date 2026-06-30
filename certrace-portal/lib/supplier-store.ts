/* ════════════════════════════════════════════════════════════
   SUPPLIER PORTAL — answer + workspace state (the smartlink, persisted)

   Everything the supplier produces against a request: the questionnaire values,
   uploaded documents, invited colleagues (seats) and who owns which section,
   the optional reusable company profile, submitted versions, and — during a
   revision — which fields the exporter unlocked.

   Frontend-only MVP: state lives in localStorage, keyed by the smartlink token,
   so closing the tab never loses progress. This is the seam where a real API
   would slot in. The exporter side reads getSubmissionStatus() to reflect a
   supplier's submission without any backend.
   ════════════════════════════════════════════════════════════ */

import type { SectionKey } from "./supplier";
import type { CheckResult } from "./ai-check";

export type SupplierProfile = {
  legalName: string;
  installationName: string;
  country: string;
  address: string;
  unlocode: string;
  coordinates: string;
  route: string; // production process / route, e.g. EAF
};

export type DocStatus = "missing" | "uploaded";
export type UploadedFile = { name: string; size: number; addedAt: number };
/** One requested document slot can hold several files (multi-page certs, etc.).
    `status` stays "uploaded" while ≥1 file is attached, so the AI check and the
    completion matrix keep reading it the same way. */
export type DocState = { id: string; status: DocStatus; files: UploadedFile[] };

export type Seat = {
  id: string;
  name: string;
  email: string;
  department: string;
  sections: SectionKey[]; // sections assigned to this colleague
  invitedAt: number;
};

export type SubmissionStatus = "new" | "draft" | "in_check" | "submitted" | "revision_requested";

export type Version = {
  n: number;
  submittedAt: number;
  score: number;
  signedBy: string;
  signedRole: string;
  warnings: number;
  note?: string;
};

export type SupplierState = {
  token: string;
  status: SubmissionStatus;
  values: Record<string, string>;
  docs: Record<string, DocState>;
  seats: Seat[];
  profile: SupplierProfile | null;
  profileSaved: boolean;
  versions: Version[];
  lastCheck: CheckResult | null;
  /** Revision: value-keys the exporter unlocked. Empty/undefined = everything editable (first draft). */
  unlocked: string[];
  /** Revision: document ids the exporter asked to re-upload / change. */
  unlockedDocs: string[];
  revisionNote: string;
  updatedAt: number;
};

const keyFor = (token: string) => `certrace:supplier:${token}`;
const PROFILE_KEY = "certrace:supplier:profiles"; // company → profile, for reuse across requests

export function emptyState(token: string): SupplierState {
  return {
    token,
    status: "new",
    values: {},
    docs: {},
    seats: [],
    profile: null,
    profileSaved: false,
    versions: [],
    lastCheck: null,
    unlocked: [],
    unlockedDocs: [],
    revisionNote: "",
    updatedAt: Date.now(),
  };
}

export function loadState(token: string): SupplierState {
  if (typeof window === "undefined") return emptyState(token);
  try {
    const raw = window.localStorage.getItem(keyFor(token));
    if (!raw) return emptyState(token);
    const parsed = JSON.parse(raw) as SupplierState;
    return { ...emptyState(token), ...parsed, token };
  } catch {
    return emptyState(token);
  }
}

export function saveState(state: SupplierState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyFor(state.token), JSON.stringify({ ...state, updatedAt: Date.now() }));
  } catch {
    /* ignore quota / serialization — never break the supplier's flow */
  }
}

export function resetState(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(keyFor(token));
  } catch {
    /* ignore */
  }
}

/* What the exporter side reads — a tiny, dependency-free status probe so the
   Collect step can reflect "submitted" the moment the supplier signs. */
export function getSubmissionStatus(token: string): { status: SubmissionStatus; version: number; score: number | null } {
  const s = loadState(token);
  const latest = s.versions[s.versions.length - 1];
  return { status: s.status, version: latest?.n ?? 0, score: latest?.score ?? null };
}

/* Reusable company profiles — the "no re-typing identity next time" story. */
export function loadProfiles(): Record<string, SupplierProfile> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(PROFILE_KEY) || "{}");
  } catch {
    return {};
  }
}
export function saveProfileFor(company: string, profile: SupplierProfile): void {
  if (typeof window === "undefined") return;
  try {
    const all = loadProfiles();
    all[company] = profile;
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
