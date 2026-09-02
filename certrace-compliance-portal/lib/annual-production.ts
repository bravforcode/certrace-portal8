/* ════════════════════════════════════════════════════════════
   ANNUAL PRODUCTION — the denominator

   Every per-tonne figure the portal produces is a division, and this is what
   it divides by. Get it wrong and nothing downstream is right: SEE per tonne,
   the certificate bill, the benchmark against the EU default, the buyer's
   embedded-emissions total — all of them scale inversely with this one number.

   Which is exactly why it is entered, never derived.

   ⚠️ SHIPPED IS NOT PRODUCED. The tempting shortcut is to sum the shipment log
   and call it production. It is wrong in three ordinary situations: output
   sold domestically, output held as inventory, and output shipped under a
   different declaration. All three understate the denominator, and a smaller
   denominator INFLATES emissions per tonne on every good in the filing. So a
   shipment total may be shown as CONTEXT next to this field, with a visible
   diff and an explicit confirmation — never written into it.

   Frontend-only MVP: one localStorage key, same seam as lib/shipments.ts and
   lib/declarations-store.ts, and the same seam a real API would slot into.
   ════════════════════════════════════════════════════════════ */

import type { Provenance } from "./cbam/activity";
import { refuseWrite } from "./seat";
import { annualProductionFor, type AnnualProduction } from "./monthly-data";
import { getWorkspace } from "./workspace";

export type ProductionRecord = {
  declarationId: string;
  /** net mass produced in the reporting period, tonnes */
  tonnes: number;
  provenance: Provenance;
  /** set when the exporter explicitly accepted a suggested figure, so the
      confirmation survives a reload and shows in the verification trail */
  confirmedAt: number | null;
  /** the suggestion they were shown when they confirmed, for the trail */
  confirmedAgainstShippedTonnes?: number;
  updatedAt: number;
};

const KEY = "certrace:annual-production";

type Store = Record<string, ProductionRecord>;

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

function save(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore quota — a lost denominator must surface as "not entered", never
       as a silent zero that quietly divides by nothing */
  }
}

export const getProduction = (declarationId: string): ProductionRecord | null => load()[declarationId] ?? null;

/** Tonnes, or null when nothing has been entered. Callers must handle null —
    a `?? 0` here would turn "unknown" into "divide by zero". */
export const productionTonnes = (declarationId: string): number | null => {
  const rec = getProduction(declarationId);
  return rec && rec.tonnes > 0 ? rec.tonnes : null;
};

export function setProduction(
  declarationId: string,
  tonnes: number,
  provenance: Provenance,
  confirmedAgainstShippedTonnes?: number,
): ProductionRecord {
  const store = load();
  const prev = store[declarationId];
  /* The seat backstop — see refuseWrite() in lib/seat.ts. Returns the record
     that is already stored, so a refused write leaves the reader looking at
     the truth rather than at their own rejected number. */
  if (refuseWrite("enterFigures") && prev) return prev;
  const rec: ProductionRecord = {
    declarationId,
    tonnes,
    provenance,
    confirmedAt: confirmedAgainstShippedTonnes != null ? Date.now() : (prev?.confirmedAt ?? null),
    confirmedAgainstShippedTonnes: confirmedAgainstShippedTonnes ?? prev?.confirmedAgainstShippedTonnes,
    updatedAt: Date.now(),
  };
  store[declarationId] = rec;
  save(store);
  return rec;
}

export function clearProduction(declarationId: string): void {
  const store = load();
  delete store[declarationId];
  save(store);
}

/* ── Shipped vs produced ────────────────────────────────────────
   The comparison the exporter is shown instead of an auto-fill. Positive
   `overshipped` means the log records more leaving the gate than the
   installation says it made — a real inconsistency (validation V4), usually
   either an untracked production line or a shipment attributed to the wrong
   period. */
export type ProductionDiff = {
  producedTonnes: number | null;
  shippedTonnes: number;
  /** shipped − produced; positive = more shipped than produced */
  deltaTonnes: number | null;
  /** shipped / produced, 1.0 = exactly equal */
  ratio: number | null;
  overshipped: boolean;
};

/** 5% headroom for opening stock — goods made in December and shipped in
    January are ordinary, not an error. Beyond that it needs an explanation. */
export const SHIPPED_OVER_PRODUCED_TOLERANCE = {
  value: 1.05,
  source: "ASSUMPTION — opening-stock headroom, agreed with the ESG team; not a regulatory figure",
};

/* ════════════════════════════════════════════════════════════
   WORKSPACE PRODUCTION — DERIVED, NEVER TYPED (§A2)

   Inside a verification workspace the annual figure is the sum of the monthly
   entries and nothing else. There is no setter and no field to type into,
   because a typed annual total is a second source of truth that can silently
   disagree with the twelve readings behind it — and when it does, the smaller
   of the two is usually the one that reached the filing.

   A missing month makes the annual figure INCOMPLETE, not smaller. Callers
   read `complete` and `missingMonths` alongside the tonnage precisely so that
   "we only have eleven months" surfaces as a blocking gap rather than as a
   plausible-looking number that inflates every per-tonne figure downstream.

   ⚠️ The declaration-scoped `setProduction` above is NOT removed. It belongs
   to the Part 1 declaration flow, which still serves filings that have no
   workspace behind them. What it must never do is overwrite a workspace's
   derived figure — `productionTonnesForDeclaration` below enforces that by
   preferring the derived sum whenever a workspace is linked.
   ════════════════════════════════════════════════════════════ */

/** The one entry point for a workspace's annual production. Reads the monthly
    sum; there is deliberately no corresponding setter. */
export function getAnnualProductionQuantity(workspaceId: string): AnnualProduction | null {
  const ws = getWorkspace(workspaceId);
  if (!ws) return null;
  return annualProductionFor(ws);
}

/** Tonnes only, or null when nothing has been submitted. Callers must handle
    null — a `?? 0` here would turn "not entered yet" into "divide by zero". */
export function workspaceProductionTonnes(workspaceId: string): number | null {
  const p = getAnnualProductionQuantity(workspaceId);
  return p && p.tonnes > 0 ? p.tonnes : null;
}

/** @deprecated Annual production inside a workspace is DERIVED from the
 *  monthly entries (lib/monthly-data.ts) and cannot be set directly. This
 *  exists so older imports keep resolving; it deliberately does nothing and
 *  returns the derived figure so a caller that reads the result still sees
 *  the truth rather than the value it tried to write.
 *
 *  Do not delete — other code may still import it. Do not implement — a
 *  writable annual total is exactly the path this build removed. */
export function setAnnualProductionQuantity(workspaceId: string): AnnualProduction | null {
  if (typeof console !== "undefined") {
    console.warn(
      "[certrace] setAnnualProductionQuantity is a no-op. Annual production is the sum of the monthly entries — edit the month, not the total.",
    );
  }
  return getAnnualProductionQuantity(workspaceId);
}

/** A declaration's production figure, workspace-aware.

    When the declaration draws on a workspace, the derived monthly sum wins
    and the manual field is shown read-only. Otherwise the stored record is
    returned exactly as before, so nothing about the Part 1 flow changes. */
export function productionTonnesForDeclaration(declarationId: string, workspaceId?: string | null): number | null {
  if (workspaceId) {
    const derived = workspaceProductionTonnes(workspaceId);
    if (derived != null) return derived;
  }
  return productionTonnes(declarationId);
}

export function compareShippedToProduced(producedTonnes: number | null, shippedTonnes: number): ProductionDiff {
  if (producedTonnes == null || !(producedTonnes > 0)) {
    return { producedTonnes, shippedTonnes, deltaTonnes: null, ratio: null, overshipped: false };
  }
  const ratio = shippedTonnes / producedTonnes;
  return {
    producedTonnes,
    shippedTonnes,
    deltaTonnes: shippedTonnes - producedTonnes,
    ratio,
    overshipped: ratio > SHIPPED_OVER_PRODUCED_TOLERANCE.value,
  };
}
