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
import type { Attestation } from "./supplier-records";
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
/* Two ways the bytes can exist, and which one is used depends on whether
   there is a backend to talk to:

   `fileId`   the file is ON THE SERVER (lib/api/files.ts). This is the real
              path: any size up to the published limit, the hash computed
              where the bytes landed, and the exporter fetches it rather than
              being handed a copy that travelled through a JSON blob.
   `dataUrl`  base64 of the file, inline. The fallback for demo mode, where
              there is no server to hold anything. Still capped at ~1.5 MB by
              the browser's storage quota, and still loses everything larger —
              which is exactly the limitation `fileId` exists to end.

   Neither is required: a row with only name and size is a file somebody
   attached before either path could keep it, and it stays readable. */
export type UploadedFile = {
  name: string;
  size: number;
  addedAt: number;
  fileId?: string;
  dataUrl?: string;
};
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

/** One real, persisted event in the submission's history — the verification trail
    (flow step 3: "records the complete Verification Trail — all edits, uploads,
    signatures, timestamps, versions, and AI validation results"). Appended as
    it happens, never derived at render time, so it survives across sessions
    and can be embedded verbatim in the exporter's verification-ready package. */
export type TrailEventKind = "doc_upload" | "doc_remove" | "check_run" | "submit" | "revision_requested" | "carried_forward" | "access_changed";
export type TrailEvent = { id: string; at: number; kind: TrailEventKind; text: string };

/** Values this draft was seeded with from the supplier's own saved record
    (lib/supplier-records.ts) rather than typed for this request. Kept on the
    state so the "confirm this is still true" prompt survives a reload, and so
    the verification trail can say which figures were carried rather than re-reported. */
export type CarriedData = {
  keys: string[];
  docIds: string[];
  sourceAt: number | null;
  sourcePeriods: string[];
  acknowledgedAt: number | null;
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
  events: TrailEvent[];
  /** Revision: value-keys the exporter unlocked. Empty/undefined = everything editable (first draft). */
  unlocked: string[];
  /** Revision: document ids the exporter asked to re-upload / change. */
  unlockedDocs: string[];
  revisionNote: string;
  /** what was pre-filled from the supplier's saved record, and whether they've
      confirmed it still holds for THIS period (null = nothing was carried) */
  carried: CarriedData | null;
  /** the named person who stood behind these numbers at submit — written on
      sign, carried into the supplier's durable record, shown to the verifier */
  attestation: Attestation | null;
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
    events: [],
    unlocked: [],
    unlockedDocs: [],
    revisionNote: "",
    carried: null,
    attestation: null,
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

/** Append one real verification event — the single write path so every entry point
    (supplier actions, exporter-initiated revisions) logs the same shape. */
export function pushEvent(state: SupplierState, kind: TrailEventKind, text: string): SupplierState {
  return { ...state, events: [...state.events, { id: uid(), at: Date.now(), kind, text }] };
}
