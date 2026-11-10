/* ════════════════════════════════════════════════════════════
   THE FINAL REPORT — one export action, one PDF

   The Verification Report pages followed immediately by the Evidence pages,
   in the same document. Not a ZIP, not a pair of links, not the report on
   its own with the evidence somewhere else.

   WHAT CHANGED AND WHY. This module used to compose two HTML fragments into
   one .html file and leave the reader to print it. That satisfied "one file"
   only in the narrowest sense: the thing that landed in the download folder
   was a web page, the page order was whatever the print stylesheet decided,
   and a supplier's scanned PDF invoice could not be inside it at all — the
   pack listed such files as "send these alongside", which is precisely the
   separate-attachment outcome the contract forbids.

   It now produces a real PDF:
     · lib/cbam/final-report-doc.ts fixes the ORDER   — Parts 1-4, then the
       five evidence categories, each sorted by the field it supports.
     · lib/cbam/final-report-pdf.ts fixes the FORMAT  — jsPDF renders the
       report, pdf-lib concatenates the evidence into it.

   This module is only the seam between them and the download itself.
   ════════════════════════════════════════════════════════════ */

import { getInstallation } from "../installations";
import { getSignOff, packFingerprint } from "../pack-signoff";
import { workspaceReadiness, type WorkspaceReadiness } from "../readiness";
import { listEvidence } from "../workspace-evidence";
import { workspaceSEE } from "../workspace-see";
import type { VerificationWorkspace } from "../workspace";
import { finalReportFileName, nextVersion } from "./final-report-filename";
import { buildFinalReportDoc, type FinalReportDoc } from "./final-report-doc";
import {
  assembleFinalReportPdf,
  type FinalReportPdf,
  type MergeFailure,
} from "./final-report-pdf";
import { getFinalReportSnapshot } from "./final-report-snapshot";

export type { FinalReportDoc, FinalReportPdf, MergeFailure };
export { buildFinalReportDoc };

/** The same fingerprint lib/pack-signoff.ts records at sign-off and compares
    at every download — computed here too so this module can ask "is there a
    frozen snapshot for what's true RIGHT NOW" without importing UI state. */
function currentFingerprint(
  ws: VerificationWorkspace,
  readiness: WorkspaceReadiness,
  see: ReturnType<typeof workspaceSEE>,
): string {
  return packFingerprint({
    seeDirect: see.seeDirect,
    seeIndirect: see.seeIndirect,
    seePrecursor: see.seePrecursor,
    productionTonnes: see.production.tonnes,
    readiness: readiness.overall === "complete" ? "complete" : "incomplete",
    evidenceCount: listEvidence(ws.id).length,
  });
}

/** The document model — ordered, format-neutral, synchronous. Everything the
    contract fixes about ORDER is decided here and can be asserted without
    rendering a byte.

    Rebuilds from live data every time — this is the DRAFT/preview path.
    `buildFinalReportPdf`/`downloadFinalReport` are what apply the frozen-
    snapshot rule below; call this directly only where a live, current-state
    document is actually wanted (a preview, a test, the sign-off action
    itself capturing what's about to be frozen). */
export function buildFinalReport(
  ws: VerificationWorkspace,
  readiness?: WorkspaceReadiness,
): FinalReportDoc {
  return buildFinalReportDoc(ws, readiness ?? workspaceReadiness(ws));
}

/** THE FROZEN-SNAPSHOT RULE.

    A workspace that is currently signed off (lib/pack-signoff.ts: the
    fingerprint on file still matches what's true now) serves its Final
    Report from the exact FinalReportDoc captured at that sign-off —
    lib/cbam/final-report-snapshot.ts — never rebuilt from live data. Editing
    anything after signing, even something that doesn't move the fingerprint
    enough to show as "stale" on the Readiness tab, must not reach a PDF that
    already went out under a name and a job title.

    Draft, never-signed, or stale (signed-then-edited) workspaces still build
    live, same as always — a report that has not been attested to is
    supposed to show what's true right now, not an old frozen guess. */
export function finalReportDocForDownload(
  ws: VerificationWorkspace,
  readiness?: WorkspaceReadiness,
): FinalReportDoc {
  const r = readiness ?? workspaceReadiness(ws);
  const see = workspaceSEE(ws);
  const fingerprint = currentFingerprint(ws, r, see);

  /* Mirrors signOffState()'s own "signed" branch exactly (lib/pack-signoff.ts)
     rather than trusting the snapshot's fingerprint alone — a snapshot left
     over from a signature that was since cleared (clearSignOff) must not go
     on serving frozen content just because nothing else happens to have
     moved the coarse fingerprint since. */
  const signOff = getSignOff(ws.id);
  const isSigned = signOff != null && signOff.fingerprint === fingerprint;
  if (isSigned) {
    const snapshot = getFinalReportSnapshot(ws.id);
    if (snapshot && snapshot.fingerprint === fingerprint) return snapshot.doc;
  }
  return buildFinalReportDoc(ws, r);
}

/** The single artefact. One call, one PDF, report then evidence. */
export async function buildFinalReportPdf(
  ws: VerificationWorkspace,
  readiness?: WorkspaceReadiness,
): Promise<FinalReportPdf> {
  return assembleFinalReportPdf(finalReportDocForDownload(ws, readiness));
}

/** The name this download carries: MMD_Company_Product_Year_vX.Y[_Draft].pdf.

    Decided HERE, at the download, not inside the builder — the report's
    content and the label on it are separate concerns, and the version can
    only be settled at the moment a file is actually handed over. */
function downloadName(ws: VerificationWorkspace, draft: boolean): string {
  const see = workspaceSEE(ws);
  const fingerprint = packFingerprint({
    seeDirect: see.seeDirect,
    seeIndirect: see.seeIndirect,
    seePrecursor: see.seePrecursor,
    productionTonnes: see.production.tonnes,
    readiness: draft ? "incomplete" : "complete",
    evidenceCount: listEvidence(ws.id).length,
  });
  return finalReportFileName({
    companyName:
      getInstallation(ws.installationId)?.name || ws.installationName,
    productName: ws.productName,
    year: ws.year,
    draft,
    version: nextVersion(ws.id, fingerprint),
  });
}

/** THE export action. One file lands, and there is no second one to fetch.

    Kept as the only download in the Verification-workspace's Readiness tab:
    the report-only and evidence-only buttons that used to sit beside it were
    removed rather than repointed, because a second link is the bug even when
    both links work. */
export async function downloadFinalReport(
  ws: VerificationWorkspace,
  readiness?: WorkspaceReadiness,
): Promise<FinalReportPdf> {
  const built = await buildFinalReportPdf(ws, readiness);
  /* The version is consumed only when a file really leaves, so building a
     report in a test or a preview never burns a version number. */
  const result: FinalReportPdf =
    typeof window === "undefined"
      ? built
      : { ...built, fileName: downloadName(ws, built.draft) };
  if (typeof window !== "undefined") {
    /* Copied into a fresh ArrayBuffer: `bytes` is a view over pdf-lib's own
       buffer, and Blob over a view that outlives the call is how a truncated
       download happens. */
    const copy = new Uint8Array(result.bytes.length);
    copy.set(result.bytes);
    const blob = new Blob([copy.buffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return result;
}
