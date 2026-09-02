/* ════════════════════════════════════════════════════════════
   ACTIVITY DATA — persistence

   The dataset itself is defined in ./activity.ts and is deliberately free of
   storage concerns; the maths in ./engine.ts never touches this file. This is
   only the seam: one localStorage key, keyed by declaration, in the same shape
   as lib/shipments.ts and lib/declarations-store.ts so a real API replaces it
   without the callers noticing.

   The production quantity is the one field that does NOT live here — it lives
   in lib/annual-production.ts, because it is read by the shipment reconcile,
   the electricity migration and the validator, none of which want to load a
   whole activity dataset to find one number. `hydrateDataset` stitches the two
   together on read so callers see a single object.
   ════════════════════════════════════════════════════════════ */

import { getProduction, setProduction } from "../annual-production";
import { emptyDataset, emptyProvenance, type ActivityDataset, type ElectricityEntry, type FuelEntry, type ProcessEmissionEntry, type Provenance } from "./activity";
import { calendarYear, type ReportingPeriod } from "./boundary";

const KEY = "certrace:activity-data";

/** Stored shape — everything except the production quantity, which is owned by
    lib/annual-production.ts. */
type StoredDataset = Omit<ActivityDataset, "annualProductionTonnes" | "annualProductionProvenance">;

type Store = Record<string, StoredDataset>;

function load(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function persist(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore quota — the UI shows what is in memory; a failed write must not
       take the exporter's typing with it */
  }
}

export const uid = (prefix: string) =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? `${prefix}-${crypto.randomUUID().slice(0, 8)}`
    : `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/** Read the full dataset for a declaration, production quantity included. */
export function loadDataset(declarationId: string, period: ReportingPeriod, enteredBy: string): ActivityDataset {
  const stored = load()[declarationId];
  const production = getProduction(declarationId);
  const base = emptyDataset(declarationId, period, enteredBy);
  if (!stored) {
    return production
      ? { ...base, annualProductionTonnes: production.tonnes, annualProductionProvenance: production.provenance }
      : base;
  }
  return {
    ...base,
    ...stored,
    declarationId,
    // The stored period wins only if it was actually set; otherwise the caller's
    // period (derived from the declaration) is the truth.
    period: stored.period?.start ? stored.period : period,
    annualProductionTonnes: production?.tonnes ?? 0,
    annualProductionProvenance: production?.provenance ?? base.annualProductionProvenance,
  };
}

/** Write the full dataset back, splitting the production quantity out to its
    own store so there is exactly one copy of the denominator. */
export function saveDataset(d: ActivityDataset, confirmedAgainstShippedTonnes?: number): ActivityDataset {
  const store = load();
  const { annualProductionTonnes, annualProductionProvenance, ...rest } = d;
  store[d.declarationId] = { ...rest, updatedAt: Date.now() };
  persist(store);
  if (annualProductionTonnes > 0) {
    setProduction(d.declarationId, annualProductionTonnes, annualProductionProvenance, confirmedAgainstShippedTonnes);
  }
  return { ...d, updatedAt: Date.now() };
}

export function clearDataset(declarationId: string): void {
  const store = load();
  delete store[declarationId];
  persist(store);
}

/** Declarations that have any activity data at all — used by the readiness
    score to tell "not started" from "started and incomplete". */
export const declarationsWithActivityData = (): string[] => Object.keys(load());

/* ── Row helpers ────────────────────────────────────────────────
   Kept here rather than in the page so the shapes stay consistent between the
   UI, the MMD generator and any future importer (CSV, ERP connector). */

export const addFuel = (d: ActivityDataset, entry: FuelEntry): ActivityDataset => ({ ...d, fuels: [...d.fuels, entry] });
export const updateFuel = (d: ActivityDataset, id: string, patch: Partial<FuelEntry>): ActivityDataset => ({
  ...d,
  fuels: d.fuels.map((f) => (f.id === id ? { ...f, ...patch, id } : f)),
});
export const removeFuel = (d: ActivityDataset, id: string): ActivityDataset => ({ ...d, fuels: d.fuels.filter((f) => f.id !== id) });

export const addElectricity = (d: ActivityDataset, entry: ElectricityEntry): ActivityDataset => ({ ...d, electricity: [...d.electricity, entry] });
export const updateElectricity = (d: ActivityDataset, id: string, patch: Partial<ElectricityEntry>): ActivityDataset => ({
  ...d,
  electricity: d.electricity.map((e) => (e.id === id ? { ...e, ...patch, id } : e)),
});
export const removeElectricity = (d: ActivityDataset, id: string): ActivityDataset => ({ ...d, electricity: d.electricity.filter((e) => e.id !== id) });

export const addProcess = (d: ActivityDataset, entry: ProcessEmissionEntry): ActivityDataset => ({ ...d, processEmissions: [...d.processEmissions, entry] });
export const updateProcess = (d: ActivityDataset, id: string, patch: Partial<ProcessEmissionEntry>): ActivityDataset => ({
  ...d,
  processEmissions: d.processEmissions.map((p) => (p.id === id ? { ...p, ...patch, id } : p)),
});
export const removeProcess = (d: ActivityDataset, id: string): ActivityDataset => ({ ...d, processEmissions: d.processEmissions.filter((p) => p.id !== id) });

/** Touch a provenance record's authorship without disturbing the rest of it —
    every edit re-stamps who and when, which is what makes the trail usable. */
export const restamp = (p: Provenance, enteredBy: string): Provenance => ({ ...p, enteredBy, enteredAt: new Date().toISOString() });

export { emptyProvenance, calendarYear };
