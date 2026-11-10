import { accountStorage } from "../account-storage";
/* ════════════════════════════════════════════════════════════
   THE FINAL REPORT, FROZEN AT SIGN-OFF

   lib/pack-signoff.ts already decides WHEN a workspace's figures are settled
   enough to matter — a fingerprint of the reported outputs, recorded the
   moment somebody signs. What it does not do is stop the REPORT ITSELF from
   drifting: `downloadFinalReport()` has always rebuilt the document from
   live data on every call, so an edit made after sign-off — one that
   doesn't move the fingerprint (a typo in the boundary description, an
   evidence caption) as much as one that does — could still change the next
   PDF somebody downloads, with nothing on the signed record to say so.

   That is the same class of bug lib/cbam-xml.ts once had: a comment
   promising the export "binds to the frozen snapshot, not live inputs"
   while the code underneath still read live data. This file is what
   actually closes that gap for the Final Report, by storing the fully-built
   FinalReportDoc — not just its fingerprint — at the moment of sign-off.

   WHAT IS AND ISN'T FROZEN:
     · Signed and unchanged since (fingerprint still matches) → the download
       is served from THIS stored doc, not rebuilt from current data.
     · Draft, never signed, or signed-then-edited (fingerprint moved, i.e.
       pack-signoff's "stale") → still built live, same as before. A DRAFT
       report is supposed to show what's true right now; freezing only ever
       applies to the copy that left the building signed.
   ════════════════════════════════════════════════════════════ */

import type { FinalReportDoc } from "./final-report-doc";

export type FinalReportSnapshot = {
  workspaceId: string;
  /** the pack-signoff fingerprint that was true at this moment — the same
      value signOffState() compares against to decide "signed" vs "stale" */
  fingerprint: string;
  signedAt: string;
  doc: FinalReportDoc;
};

const KEY = "certrace:final-report-snapshot";

type Store = Record<string, FinalReportSnapshot>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = accountStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Store) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function write(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    accountStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore quota — the signature itself (lib/pack-signoff.ts) still
       recorded the fingerprint even if the heavier document body didn't
       fit; the next download simply falls back to a live rebuild, which is
       the same behaviour this module didn't exist to change. */
  }
}

export const getFinalReportSnapshot = (
  workspaceId: string,
): FinalReportSnapshot | null => read()[workspaceId] ?? null;

/** Called at the same moment as signOffPack() — see lib/pack-signoff.ts —
    never on its own. `doc` must be the exact document a plain
    buildFinalReport() call would have produced right now, deep-copied by
    the JSON round-trip below so a later mutation of the workspace's live
    objects (or of the doc a caller is still holding a reference to) cannot
    reach back into what was signed. */
export function saveFinalReportSnapshot(
  workspaceId: string,
  fingerprint: string,
  doc: FinalReportDoc,
): FinalReportSnapshot {
  const record: FinalReportSnapshot = {
    workspaceId,
    fingerprint,
    signedAt: new Date().toISOString(),
    doc: JSON.parse(JSON.stringify(doc)) as FinalReportDoc,
  };
  const store = read();
  store[workspaceId] = record;
  write(store);
  return record;
}

export function clearFinalReportSnapshot(workspaceId: string): void {
  const store = read();
  delete store[workspaceId];
  write(store);
}
