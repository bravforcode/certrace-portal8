/* Draft persistence for the new-declaration wizard.

   Frontend-only MVP: drafts live in localStorage (this is the seam where a real
   "save draft" API would slot in). Closing the wizard with the X saves a draft;
   the declarations list surfaces drafts at the top and links back into the
   wizard to resume exactly where the exporter left off. */

import type { ProductUnit, Purpose } from "./config";
import type { DirectorySupplier } from "./data";

/* A production lot bought from a supplier in the period. */
export type Lot = {
  id: string;
  qty: string;
  unit: ProductUnit | "";
  from: string; // optional production-period start (ISO)
  to: string; // optional production-period end (ISO)
  notes: string; // optional free-text
};
export type SupplierEntry = { supplierId: string; lots: Lot[] };
export type Mapping = Record<string, SupplierEntry[]>; // productId → suppliers

/* Everything needed to rebuild the wizard at the exact step the user left. */
export type WizardSnapshot = {
  regulation: string; // regulation id (e.g. "cbam")
  origin: string; // origin jurisdiction code (e.g. "TH")
  destination: string; // destination market code (e.g. "EU")
  purpose: Purpose; // "cbam" or "buyer" — mutually exclusive, each has its own qualification path
  name: string;
  description: string;
  /** EU buyer / importer whose declarant will receive the data */
  buyerName?: string;
  buyerEori?: string;
  buyerEmail?: string;
  periodId: string;
  year: string;
  quarter: string;
  half: string;
  month: string;
  rangeStart: string;
  rangeEnd: string;
  products: string[];
  reportFields: Record<string, boolean>;
  directory: DirectorySupplier[];
  mapping: Mapping;
  deadline: string;
  reminders: { d7: boolean; d3: boolean; due: boolean };
  notes: string;
  step: number;
};

export type Draft = {
  id: string;
  updatedAt: number; // epoch ms
  snapshot: WizardSnapshot;
  /** denormalised fields the declarations list renders without rehydrating */
  display: {
    name: string;
    purpose: Purpose;
    productCount: number;
    supplierCount: number;
    period: string;
    deadline: string; // ISO yyyy-mm-dd
  };
};

const KEY = "certrace:v2:drafts";
const LEGACY_KEY = "certrace:drafts";
const QUARANTINE_KEY = "certrace:legacy_unverified:drafts";

type DraftEnvelope = {
  schemaVersion: 2;
  dataClassification: "readiness_demo";
  records: Draft[];
};

function quarantineLegacyDrafts(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (raw === null) return;
    window.localStorage.removeItem(LEGACY_KEY);
    if (window.localStorage.getItem(QUARANTINE_KEY) === null) {
      window.localStorage.setItem(
        QUARANTINE_KEY,
        JSON.stringify({ classification: "legacy_unverified", quarantinedAt: Date.now(), originalKey: LEGACY_KEY, discardedBytes: raw.length, reason: "Unversioned record discarded; payload not retained." }),
      );
    }
  } catch {
    // Fail closed: an unversioned draft is never read into the current model.
  }
}

/* Defends against drafts written by an older schema (or otherwise malformed
   localStorage data) missing fields the current UI assumes are always
   present. Also migrates the old `display.purposes` array (back when a
   declaration could be both CBAM and Buyer at once) down to a single
   `display.purpose`. Normalise once here so nothing downstream needs to
   guard against it. */
function normaliseDraft(d: Draft & { display: { purposes?: Purpose[] } }): Draft {
  return {
    ...d,
    display: {
      ...d.display,
      purpose: d.display?.purpose ?? d.display?.purposes?.[0] ?? "cbam",
    },
  };
}

export function loadDrafts(): Draft[] {
  if (typeof window === "undefined") return [];
  quarantineLegacyDrafts();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const envelope = JSON.parse(raw) as DraftEnvelope;
    if (envelope.schemaVersion !== 2 || envelope.dataClassification !== "readiness_demo" || !Array.isArray(envelope.records)) {
      window.localStorage.removeItem(KEY);
      window.localStorage.setItem(
        QUARANTINE_KEY,
        JSON.stringify({ classification: "legacy_unverified", quarantinedAt: Date.now(), originalKey: KEY, discardedBytes: raw.length, reason: "Invalid schema record discarded; payload not retained." }),
      );
      return [];
    }
    return envelope.records.map(normaliseDraft).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function getDraft(id: string): Draft | null {
  return loadDrafts().find((d) => d.id === id) ?? null;
}

export function saveDraft(draft: Draft): void {
  if (typeof window === "undefined") return;
  const all = loadDrafts().filter((d) => d.id !== draft.id);
  all.unshift(draft);
  try {
    const envelope: DraftEnvelope = { schemaVersion: 2, dataClassification: "readiness_demo", records: all };
    window.localStorage.setItem(KEY, JSON.stringify(envelope));
  } catch {
    throw new Error("Local draft save failed. The draft was not recorded.");
  }
}

export function deleteDraft(id: string): void {
  if (typeof window === "undefined") return;
  const all = loadDrafts().filter((d) => d.id !== id);
  try {
    const envelope: DraftEnvelope = { schemaVersion: 2, dataClassification: "readiness_demo", records: all };
    window.localStorage.setItem(KEY, JSON.stringify(envelope));
  } catch {
    throw new Error("Local draft delete failed.");
  }
}

export const newDraftId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? `draft-${crypto.randomUUID()}` : `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;
