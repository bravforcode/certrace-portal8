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
import type { MeasuredValue } from "./mrv";

export type SupplierActorRole = "producer" | "trader";

export type InstallationProfile = {
  id: string;
  name: string;
  country: string;
  address: string;
  unlocode: string;
  coordinates: string;
  routes: string[];
  /** Installation production activity for the reporting period. This is not
      the commercial shipment quantity requested by the exporter. */
  productionActivityTonnes: string;
  productionActivityMeasurement?: MeasuredValue;
};

export type SupplierProfile = {
  legalName: string;
  actorRole: SupplierActorRole;
  /** A trader forwards data from the named producer; it is not represented as
      the operator of an installation. */
  upstreamProducer: string;
  installationName: string;
  country: string;
  address: string;
  unlocode: string;
  coordinates: string;
  route: string; // production process / route, e.g. EAF
  productionActivityTonnes: string;
  productionActivityMeasurement?: MeasuredValue;
  additionalInstallations: InstallationProfile[];
};

export type DocStatus = "missing" | "uploaded";
/* Only safe metadata is retained. Evidence bytes require private backend
   storage, malware scanning and retention controls, which are not configured. */
export type UploadedFile = { name: string; size: number; addedAt: number; storage: "metadata_only" };
/** One requested document slot can hold several files (multi-page certs, etc.).
    `status` stays "uploaded" while ≥1 file reference is attached, so deterministic checks and the
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

/** One real, persisted event in the submission's history — the audit trail
    (flow step 3: "records the complete Audit Trail — all edits, uploads,
    typed attestations, timestamps, versions, and deterministic validation results"). Appended as
    it happens, never derived at render time, so it survives across sessions
    and can be shown in a draft preview. It is not an immutable audit event. */
export type AuditEventKind = "doc_upload" | "doc_remove" | "check_run" | "submit" | "revision_requested";
export type AuditEvent = { id: string; at: number; kind: AuditEventKind; text: string };

export type SupplierState = {
  schemaVersion: 2;
  dataClassification: "readiness_demo";
  legacyUnverifiedQuarantined: boolean;
  token: string;
  status: SubmissionStatus;
  values: Record<string, string>;
  docs: Record<string, DocState>;
  seats: Seat[];
  profile: SupplierProfile | null;
  profileSaved: boolean;
  versions: Version[];
  lastCheck: CheckResult | null;
  events: AuditEvent[];
  /** Revision: value-keys the exporter unlocked. Empty/undefined = everything editable (first draft). */
  unlocked: string[];
  /** Revision: document ids the exporter asked to re-upload / change. */
  unlockedDocs: string[];
  revisionNote: string;
  updatedAt: number;
};

const keyFor = (token: string) => `certrace:v2:supplier:${token}`;
const legacyKeyFor = (token: string) => `certrace:supplier:${token}`;
const quarantineKeyFor = (token: string) => `certrace:legacy_unverified:supplier:${token}`;
const PROFILE_KEY = "certrace:v2:supplier:profiles";
const LEGACY_PROFILE_KEY = "certrace:supplier:profiles";
const QUARANTINE_PROFILE_KEY = "certrace:legacy_unverified:supplier:profiles";

function quarantineLegacyRecord(legacyKey: string, quarantineKey: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const legacy = window.localStorage.getItem(legacyKey);
    if (legacy === null) return window.localStorage.getItem(quarantineKey) !== null;
    window.localStorage.removeItem(legacyKey);
    if (window.localStorage.getItem(quarantineKey) === null) {
      window.localStorage.setItem(
        quarantineKey,
        JSON.stringify({ classification: "legacy_unverified", quarantinedAt: Date.now(), originalKey: legacyKey, discardedBytes: legacy.length, reason: "Unversioned record discarded; payload not retained." }),
      );
    }
    return true;
  } catch {
    return true;
  }
}

export function emptyState(token: string): SupplierState {
  return {
    schemaVersion: 2,
    dataClassification: "readiness_demo",
    legacyUnverifiedQuarantined: false,
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
    updatedAt: Date.now(),
  };
}

export function loadState(token: string): SupplierState {
  if (typeof window === "undefined") return emptyState(token);
  const legacyUnverifiedQuarantined = quarantineLegacyRecord(legacyKeyFor(token), quarantineKeyFor(token));
  try {
    const raw = window.localStorage.getItem(keyFor(token));
    if (!raw) return { ...emptyState(token), legacyUnverifiedQuarantined };
    const parsed = JSON.parse(raw) as SupplierState;
    if (parsed.schemaVersion !== 2 || parsed.dataClassification !== "readiness_demo") {
      window.localStorage.removeItem(keyFor(token));
      window.localStorage.setItem(
        quarantineKeyFor(token),
        JSON.stringify({ classification: "legacy_unverified", quarantinedAt: Date.now(), originalKey: keyFor(token), discardedBytes: raw.length, reason: "Invalid schema record discarded; payload not retained." }),
      );
      return { ...emptyState(token), legacyUnverifiedQuarantined: true };
    }
    return { ...emptyState(token), ...parsed, token, legacyUnverifiedQuarantined };
  } catch {
    return { ...emptyState(token), legacyUnverifiedQuarantined };
  }
}

export function saveState(state: SupplierState): boolean {
  if (typeof window === "undefined") return false;
  try {
    const docs = Object.fromEntries(
      Object.entries(state.docs).map(([id, doc]) => [
        id,
        {
          ...doc,
          files: doc.files.map((file) => ({
            name: file.name,
            size: file.size,
            addedAt: file.addedAt,
            storage: "metadata_only" as const,
          })),
        },
      ]),
    );
    window.localStorage.setItem(keyFor(state.token), JSON.stringify({ ...state, docs, updatedAt: Date.now() }));
    return true;
  } catch {
    return false;
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
  quarantineLegacyRecord(LEGACY_PROFILE_KEY, QUARANTINE_PROFILE_KEY);
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

/** Append one real audit event — the single write path so every entry point
    (supplier actions, exporter-initiated revisions) logs the same shape. */
export function pushEvent(state: SupplierState, kind: AuditEventKind, text: string): SupplierState {
  return { ...state, events: [...state.events, { id: uid(), at: Date.now(), kind, text }] };
}
