/* ════════════════════════════════════════════════════════════
   THE PRECURSOR NODE EXPORT

   The missing step between an entity submitting its data and an exporter
   sending it out for verification: a document containing everything one
   entity submitted, for the exporter to hand to an accredited third-party
   verifier — Certrace records a verification result, it does not perform
   one.

   DELIBERATELY NOT STYLED AS A MONITORING METHODOLOGY DOCUMENT. An earlier
   pass renamed this to "Monitoring Methodology Documentation" and gave it
   that document's file-name pattern and Part numbering — which is precisely
   backwards for what a verifier needs: an MMD's arithmetic has to be
   RE-PERFORMABLE from a workspace's own monthly fuel/electricity readings,
   and this row has none of that to show — it is one entity's own reported
   figure plus whatever it attached, nothing computed from a chain of
   monthly data. Labelling it as an MMD is the version that gets sent back.
   The real MMD-format file for a precursor now lives at
   components/tree-node-card.tsx's `MmdReportAction` — reached once that
   precursor has its own linked VerificationWorkspace (built via "Create
   workspace for this precursor"), which really does have monthly data to
   build one from, and reuses lib/cbam/final-report.ts's actual pipeline
   rather than a look-alike. This file stays what it always was: a plain
   record of one entity's own submission.

   Same MECHANISM as lib/verifier-pack.ts and lib/cbam/evidence-pack.ts, not
   the jsPDF/pdf-lib pipeline those two intentionally stay separate from (see
   lib/cbam/final-report-pdf.ts): a plain, self-contained, print-optimised
   HTML string, downloaded via lib/download.ts's downloadFile() and turned
   into a PDF by the reader's own browser (Ctrl+P → Save as PDF). That
   pipeline is built around merging scanned evidence FILES into a whole
   workspace's report; this is one row's own fields, and reusing it here
   would mean threading a single supplier through a document model shaped
   for something else entirely. Reusing verifier-pack.ts's actual pattern
   (esc/num/dash, the same STYLE block, downloadFile) is the real reuse — a
   second copy of the SAME small mechanism, not a second mechanism.
   ════════════════════════════════════════════════════════════ */

import { downloadFile } from "../download";
import { countryName } from "../config";
import { annualEvidence } from "../workspace-evidence";
import {
  DATA_ORIGIN_LABEL,
  totalTonnes,
  type PrecursorSupplier,
} from "../precursor-suppliers";

const esc = (v: unknown): string =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const num = (v: number | null | undefined, dp = 4): string =>
  v != null && Number.isFinite(v)
    ? v.toLocaleString("en-GB", {
        minimumFractionDigits: 0,
        maximumFractionDigits: dp,
      })
    : "—";

const dash = (v: string | null | undefined): string =>
  v && String(v).trim() ? esc(v) : "—";

const STYLE = `
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, "Segoe UI", Helvetica, Arial, sans-serif;
         color: #111; background: #fff; margin: 0; padding: 24px; line-height: 1.5; font-size: 12px; }
  .wrap { max-width: 800px; margin: 0 auto; }
  h1 { font-size: 20px; font-weight: 300; letter-spacing: -0.02em; margin: 0 0 4px; }
  h2 { font-size: 13px; font-weight: 500; margin: 22px 0 8px; padding-bottom: 6px;
       border-bottom: 1px solid #ddd; page-break-after: avoid; }
  .eyebrow { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #666; }
  .lead { color: #444; margin: 4px 0 0; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 4px; }
  th, td { text-align: left; padding: 5px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
  th { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: #555; border-bottom: 1px solid #ccc; }
  td.n, th.n { text-align: right; font-variant-numeric: tabular-nums; }
  .kv { display: grid; grid-template-columns: 220px 1fr; gap: 3px 12px; margin: 6px 0; }
  .kv dt { color: #666; }
  .kv dd { margin: 0; }
  .note { background: #faf9f7; border-left: 3px solid #ccc; padding: 8px 12px; margin: 8px 0; color: #444; }
  .warn { background: #fffbeb; border-left-color: #d97706; }
  .pass { color: #047857; } .fail { color: #dc2626; }
  .pill { display: inline-block; border: 1px solid #ddd; border-radius: 999px; padding: 1px 8px; font-size: 10px; }
  footer { margin-top: 32px; padding-top: 10px; border-top: 1px solid #ddd; color: #777; font-size: 10px; }
  @media print { body { padding: 0; } .no-print { display: none; } }
`;

function kv(rows: [string, string][]): string {
  return `<dl class="kv">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join("")}</dl>`;
}

const CHECK_LABEL: Record<
  "accreditationValid" | "sectoralScopeMatch" | "periodCovered" | "fileIntact",
  string
> = {
  accreditationValid: "Verifier accreditation valid",
  sectoralScopeMatch: "Sectoral scope matches product category",
  periodCovered: "Reporting period covered by report",
  fileIntact: "Report file readable/intact",
};

export type PrecursorNodeExportResult = { html: string; fileName: string };

/** Builds the export document for one entity — everything it submitted, in
    the shape an exporter hands to an external verifier. Pure: takes the row
    plus its workspace id (for the one evidence lookup, the attached
    report's file name), returns html + a suggested file name. Never reads
    ambient state beyond that. */
export function buildPrecursorNodeExport(
  node: PrecursorSupplier,
): PrecursorNodeExportResult {
  const reportFile = node.verificationReportFileId
    ? annualEvidence(node.workspaceId).find(
        (i) => i.id === node.verificationReportFileId,
      )?.fileName
    : undefined;

  const monthlyRows = node.monthlyQuantities.filter((q) => q.tonnes > 0);
  const total = totalTonnes(node);

  const checks = node.verificationChecks;

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${esc(node.name || node.precursorName || "Precursor")} — submitted data</title>
<style>${STYLE}</style></head>
<body><div class="wrap">

  <span class="eyebrow">Precursor entity submission</span>
  <h1>${esc(node.name || "Unnamed entity")}</h1>
  <p class="lead">Everything this entity submitted for ${esc(node.precursorName || "this precursor")}, as recorded on ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.</p>

  <div class="note">
    This is a data extract, not a verification result and not a Monitoring Methodology Documentation. It is provided for an accredited
    third-party verifier to review and confirm — Certrace records the outcome of that review, it does not perform it.
  </div>

  <h2>Identity</h2>
  ${kv([
    ["Company", dash(node.name)],
    ["Installation", dash(node.installationName)],
    ["Country", node.country ? esc(countryName(node.country)) : "—"],
    ["Installation unique ID", dash(node.installationUniqueId)],
    ["UN/LOCODE", dash(node.unlocode)],
    ["Full address", dash(node.fullAddress)],
    [
      "Coordinates",
      node.latitude != null && node.longitude != null
        ? `${node.latitude}, ${node.longitude}`
        : "—",
    ],
  ])}

  <h2>What they supply</h2>
  ${kv([
    ["Precursor", dash(node.precursorName)],
    ["CN code", dash(node.cnCode)],
    ["Production route", dash(node.productionRoute)],
    ["Scrap or waste", node.isScrap ? "Yes — zero-rated" : "No"],
  ])}

  <h2>Specific embedded emissions</h2>
  ${kv([
    ["Direct", `${num(node.specificEmbeddedDirectTco2PerT)} tCO₂e/t`],
    ["Indirect", `${num(node.specificEmbeddedIndirectTco2PerT)} tCO₂e/t`],
    ["Total", `${num(node.seeTco2ePerT)} tCO₂e/t`],
    ["Data origin", esc(DATA_ORIGIN_LABEL[node.dataOrigin])],
    [
      "Reporting period",
      node.reportingPeriodStart && node.reportingPeriodEnd
        ? `${node.reportingPeriodStart} to ${node.reportingPeriodEnd}`
        : "—",
    ],
  ])}

  <h2>Quantity</h2>
  ${kv([
    [
      "Per-tonne ratio override",
      node.qtyPerTonneOverride != null
        ? `${num(node.qtyPerTonneOverride)} t/t`
        : "—",
    ],
    [
      "Total consumed (monthly readings)",
      total > 0 ? `${num(total, 3)} t` : "—",
    ],
  ])}
  ${
    monthlyRows.length > 0
      ? `<table><thead><tr><th>Month</th><th class="n">Tonnes</th></tr></thead><tbody>${monthlyRows
          .map(
            (q) =>
              `<tr><td>${esc(q.month)}</td><td class="n">${num(q.tonnes, 3)}</td></tr>`,
          )
          .join("")}</tbody></table>`
      : ""
  }

  <h2>Verification evidence</h2>
  ${kv([
    [
      "Report attached",
      reportFile
        ? esc(reportFile)
        : node.verificationReportFileId
          ? "Attached (file name unavailable)"
          : "—",
    ],
    ["Verifier name", dash(node.verifierName)],
    ["Accreditation number", dash(node.verifierAccreditationNumber)],
    [
      "Accreditation issuing country",
      node.verifierAccreditationIssuingCountry
        ? esc(countryName(node.verifierAccreditationIssuingCountry))
        : "—",
    ],
    ["Accreditation expiry date", dash(node.verifierAccreditationExpiryDate)],
    ["Report issue date", dash(node.verificationReportIssueDate)],
    ["Report expires", dash(node.verificationReportExpiresAt)],
    ["Sectoral scope", dash(node.verificationSectoralScope)],
  ])}

  ${
    checks
      ? `<h2>Verification checks — as recorded by Certrace</h2>
    <table><thead><tr><th>Check</th><th>Result</th></tr></thead><tbody>
      ${(Object.keys(CHECK_LABEL) as (keyof typeof CHECK_LABEL)[])
        .map(
          (k) =>
            `<tr><td>${esc(CHECK_LABEL[k])}</td><td class="${checks[k] ? "pass" : "fail"}">${checks[k] ? "Pass" : "Fail"}</td></tr>`,
        )
        .join("")}
    </tbody></table>
    ${checks.failedReasons.length > 0 ? `<div class="note warn">${esc(checks.failedReasons.join(" "))}</div>` : ""}`
      : `<h2>Verification checks</h2><p class="lead">No verification has been attempted for this entity yet.</p>`
  }

  <footer>Entity ID ${esc(node.id)} · Certrace precursor entity export · generated ${new Date().toISOString()}</footer>

</div></body></html>`;

  const slug = (node.name || node.precursorName || "precursor")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return { html, fileName: `${slug}-submitted-data.html` };
}

export function downloadPrecursorNodeExport(node: PrecursorSupplier): void {
  const { html, fileName } = buildPrecursorNodeExport(node);
  downloadFile(fileName, html, "text/html");
}
