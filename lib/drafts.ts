/* Draft persistence for the new-declaration wizard.

   Frontend-only MVP: drafts live in localStorage (this is the seam where a real
   "save draft" API would slot in). Closing the wizard with the X saves a draft;
   the declarations list surfaces drafts at the top and links back into the
   wizard to resume exactly where the exporter left off. */

import type { Purpose } from "./config";
import type { DirectorySupplier } from "./data";

/* A production lot bought from a supplier in the period. */
export type Lot = {
  id: string;
  qty: string;
  unit: string;
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
  purpose: Purpose;
  name: string;
  description: string;
  periodId: string;
  year: string;
  quarter: string;
  half: string;
  month: string;
  rangeStart: string;
  rangeEnd: string;
  products: string[];
  reportFields: Record<string, boolean>;
  extras: string[];
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

const KEY = "certrace:drafts";

export function loadDrafts(): Draft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Draft[];
    return Array.isArray(arr) ? arr.slice().sort((a, b) => b.updatedAt - a.updatedAt) : [];
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
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore quota / serialization errors — a lost draft must never break the flow */
  }
}

export function deleteDraft(id: string): void {
  if (typeof window === "undefined") return;
  const all = loadDrafts().filter((d) => d.id !== id);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export const newDraftId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? `draft-${crypto.randomUUID()}` : `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;
