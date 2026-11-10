/* The documents behind the package — the files, not the index.

   The package carries the reports as PDFs, the two indexes, and — beside them —
   the evidence files themselves, so the verifier opens one zip and finds every
   figure's paper. Two folders:

     precursor-verification-reports/   the verification reports of precursor installations (Annex II A.1(4), recital 18)
     supporting-evidence/<product>/<period>/   everything else attached to the year's product reports

   Stored originals are retrieved from the backend. Legacy name-only entries
   remain in the index; a missing referenced original fails the download.
   Names are made safe for a zip and never collide. */

import type { ZipEntry } from "../zip";
import { loadEvidenceFile } from "../document-files";
import { listEvidence } from "../workspace-evidence";
import { listSuppliers } from "../precursor-suppliers";
import type { VerificationWorkspace } from "../workspace";
import { finalVersionCovering, loadDraft } from "../workspace-mmd";
import { assertSessionUnchanged, sessionEpoch } from "../api/session";

const safe = (s: string): string =>
  s
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "file";

/** A `data:` URL to bytes; null when it is not one this can read. */
export function bytesOfDataUrl(url: string): Uint8Array | null {
  const comma = url.indexOf(",");
  if (!url.startsWith("data:") || comma < 0) return null;
  const meta = url.slice(5, comma);
  const body = url.slice(comma + 1);
  try {
    if (/;base64$/i.test(meta)) {
      const bin = atob(body);
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    }
    return new TextEncoder().encode(decodeURIComponent(body));
  } catch {
    return null;
  }
}

export async function evidenceFilesForPackage(
  workspaces: VerificationWorkspace[],
  year: number,
): Promise<ZipEntry[]> {
  const epoch = sessionEpoch();
  const out: ZipEntry[] = [];
  const pending: {
    name: string;
    file: Parameters<typeof loadEvidenceFile>[0];
  }[] = [];
  const taken = new Set<string>();
  const unique = (path: string): string => {
    let name = path;
    for (let n = 2; taken.has(name); n++)
      name = path.replace(/(\.[^./]+)?$/, `-${n}$1`);
    taken.add(name);
    return name;
  };

  for (const ws of workspaces.filter((w) => w.year === year && !w.archivedAt)) {
    const verificationReports = new Set(
      listSuppliers(ws.id)
        .map((s) => s.verificationReportFileId)
        .filter(Boolean) as string[],
    );
    for (const e of listEvidence(ws.id)) {
      if (!e.localFileId && !e.serverFileId && !e.fileDataUrl) continue;
      const folder = verificationReports.has(e.id)
        ? "precursor-verification-reports"
        : `supporting-evidence/${safe(ws.productName)}/${e.month ?? "whole-year"}`;
      pending.push({ name: unique(`${folder}/${safe(e.fileName)}`), file: e });
    }
    // Match the methodology selected by report-set.ts, including its final version.
    const mmd =
      finalVersionCovering(ws.id, ws.periodStart, ws.periodEnd)?.content ??
      loadDraft(ws.id, ws.periodStart, ws.periodEnd);
    if (mmd.diagramFileId || mmd.diagramDataUrl) {
      pending.push({
        name: unique(
          `supporting-evidence/${safe(ws.productName)}/whole-year/${safe(mmd.diagramFileName || "installation-diagram")}`,
        ),
        file: {
          localFileId: mmd.diagramFileId,
          fileDataUrl: mmd.diagramDataUrl,
        },
      });
    }
  }
  // Capture all references before awaiting downloads so account refreshes cannot
  // replace later workspaces midway through collecting this package.
  for (const entry of pending) {
    const file = await loadEvidenceFile(entry.file);
    if (!file) throw new Error(`Could not retrieve evidence: ${entry.name}`);
    const data = new Uint8Array(await file.arrayBuffer());
    assertSessionUnchanged(epoch);
    out.push({ name: entry.name, data });
  }
  return out;
}
