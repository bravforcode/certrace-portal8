/* ════════════════════════════════════════════════════════════
   OUTPUT 2 — THE EVIDENCE PACK

   Every supporting document the exporter and their suppliers uploaded,
   assembled into ONE file the exporter downloads and hands to the verifier
   alongside the communication report.

   ── The page furniture, exactly as specified ─────────────────

   Every page carries a slim bar across the top, and nothing else touches the
   evidence:

     [ Certrace mark ]   What this is · sheet 2 of 3        [ page 7 / 24 ]
     └── left           └── centre, the document and its    └── right,
                            position WITHIN ITS OWN TYPE        the whole pack

   The centre counter is per-document-type, not per-pack, because that is the
   question a verifier actually asks: "is this all the fuel invoices?" A single
   running count answers "where am I", which they can already see on the right.

   ── The evidence itself is never cropped ─────────────────────

   The uploaded artefact sits BELOW the bar, centred, with a margin on all four
   sides, scaled DOWN to fit and never up. `object-fit: contain` with
   `max-width/max-height` and no `overflow: hidden` anywhere on the path: a
   scan that is taller than the page shrinks until all of it is visible.

   This is the whole point of the file. A verifier who receives a cropped
   invoice cannot see the account number that ties it to the installation, and
   the item stops being evidence. Cropping is the one failure this must not
   have, so the frame gives way, never the document.

   ── What it cannot do, and says so ───────────────────────────

   An uploaded PDF cannot be re-paginated in the browser: jsPDF writes PDFs, it
   does not read them, and the project carries no PDF parser. Rasterising one
   into an image would be the cropping failure by another route. So a PDF gets
   a full referral page inside the pack — bar, filename, what it substantiates,
   page count if known — and travels beside the pack as its original file. The
   pack's contents page lists it as a separate attachment rather than pretending
   it is inside.
   ════════════════════════════════════════════════════════════ */

import { downloadFile } from "../download";
import {
  annualEvidence,
  departmentForEvidenceItem,
  EVIDENCE_CATEGORY_ORDER,
  listEvidence,
  isReviewed,
  EVIDENCE_SOURCE_LABEL,
  type EvidenceItem,
  type EvidenceSourceType,
} from "../workspace-evidence";
import { monthName, workspaceTitle, type VerificationWorkspace } from "../workspace";

const esc = (v: unknown): string =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** The Certrace mark, inline. An <img src> to a hosted asset would leave a
    broken box in a pack opened offline, which is where these are read. */
const LOGO = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
  <path d="M15.5 4.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 1 0-15Z"/><path d="M8.5 4.5a7.5 7.5 0 0 1 0 15"/></svg>`;

export type EvidencePackResult = {
  html: string;
  fileName: string;
  /** documents rendered inside the pack */
  embedded: number;
  /** documents that travel beside it — PDFs, and files stored by metadata only */
  referred: EvidenceItem[];
  totalPages: number;
};

/** The pack as a fragment — no `<html>`/`<head>`/`<body>` shell — so a
    combiner (see lib/cbam/final-report.ts) can place it alongside another
    document's fragment inside one shared shell. `buildEvidencePack` below is
    a thin wrapper around this for standalone use. */
export type EvidencePackSection = {
  bodyHtml: string;
  styleCss: string;
  embedded: number;
  referred: EvidenceItem[];
  totalPages: number;
  fileNameSlug: string;
};

/* A4 at 96dpi is 794 × 1123 px. The bar takes 34px; the rest is the frame the
   evidence is contained inside, less its margin. Fixed rather than fluid so
   the on-screen pack and the printed one paginate identically — a verifier
   quoting "page 11" must mean the same page in both. */
const PAGE_W = 794;
const PAGE_H = 1123;
const BAR_H = 34;
const FRAME_MARGIN = 26;

const STYLE = `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  :root {
    --ink: #111; --ink-3: #6b6b6b; --ink-4: #8a8a8a;
    --line: #e6e4de; --line-2: #d3d0c8; --ground: #f5f4f0; --paper: #fff; --primary: #3C7ACB;
  }
  body { font-family: "Outfit", "IBM Plex Sans Thai", ui-sans-serif, system-ui, "Segoe UI", Helvetica, Arial, sans-serif;
         color: var(--ink); background: var(--ground); margin: 0; padding: 18px 0; font-size: 12px; line-height: 1.5; }
  .page {
    width: ${PAGE_W}px; min-height: ${PAGE_H}px; margin: 0 auto 18px; background: var(--paper);
    display: flex; flex-direction: column; page-break-after: always; break-after: page;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .page:last-child { page-break-after: auto; break-after: auto; }

  /* ── The bar. Slim by instruction: 34px, one line, never wraps. ── */
  .bar {
    height: ${BAR_H}px; flex: 0 0 ${BAR_H}px; display: flex; align-items: center; gap: 10px;
    padding: 0 12px; border-bottom: 1px solid var(--line-2); background: var(--paper);
  }
  .bar .mark { display: inline-flex; align-items: center; gap: 5px; flex: 0 0 auto; color: var(--ink); }
  .bar .mark span { font-size: 9px; letter-spacing: 0.17em; text-transform: uppercase; }
  /* The centre is the only part allowed to shrink, and it ellipsises rather
     than pushing the page counter off the edge. */
  .bar .what { flex: 1 1 auto; min-width: 0; text-align: center; font-size: 10.5px; color: var(--ink-3);
               white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bar .what strong { color: var(--ink); font-weight: 500; }
  .bar .of { color: var(--ink-4); }
  .bar .pg { flex: 0 0 auto; font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
             font-size: 9.5px; color: var(--ink-4); font-variant-numeric: tabular-nums; }

  /* ── The frame. Nothing here clips: no overflow:hidden on the path. ── */
  .frame { flex: 1 1 auto; display: flex; align-items: center; justify-content: center; padding: ${FRAME_MARGIN}px; }
  .frame img {
    display: block; max-width: 100%; max-height: ${PAGE_H - BAR_H - FRAME_MARGIN * 2}px;
    width: auto; height: auto;            /* scale DOWN only — never enlarge a small scan into mush */
    object-fit: contain; border: 1px solid var(--line);
  }

  .referral { text-align: center; max-width: 62ch; color: var(--ink-3); }
  .referral h3 { font-size: 15px; font-weight: 400; color: var(--ink); margin: 0 0 6px; }
  .referral .fn { font-family: ui-monospace, "SFMono-Regular", Menlo, monospace; font-size: 12px;
                  color: var(--ink); background: var(--ground); border-radius: 6px; padding: 6px 10px;
                  display: inline-block; margin: 8px 0; word-break: break-all; }

  /* ── Contents page ── */
  .contents { padding: 34px 46px; }
  h1 { font-family: "Chillax", "Outfit", ui-sans-serif, system-ui, sans-serif;
       font-size: 25px; font-weight: 300; letter-spacing: -0.02em; margin: 0 0 6px; }
  .eyebrow { font-size: 9.5px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-4); }
  .lead { color: #444; margin: 4px 0 18px; max-width: 62ch; }
  h2 { font-size: 12px; font-weight: 600; margin: 20px 0 4px; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0; }
  th, td { text-align: left; padding: 5px 8px; border-bottom: 1px solid var(--line); vertical-align: top; }
  th { font-size: 9.5px; letter-spacing: 0.07em; text-transform: uppercase; color: var(--ink-3);
       border-bottom: 1px solid var(--line-2); font-weight: 500; }
  td.n, th.n { text-align: right; font-variant-numeric: tabular-nums;
               font-family: ui-monospace, "SFMono-Regular", Menlo, monospace; }
  .note { background: #faf9f7; border-left: 3px solid var(--line-2); padding: 8px 12px; margin: 12px 0; color: #444; }
  .warn { background: #fffbeb; border-left-color: #d97706; }
  .muted { color: var(--ink-4); }

  /* On a phone the fixed A4 page would force a horizontal scroll of the whole
     document. It scales instead, so the pack stays readable on the device the
     exporter is most likely checking it on before they send it. */
  @media (max-width: ${PAGE_W + 40}px) {
    body { padding: 8px 0; }
    .page { width: 100%; min-height: 0; box-shadow: none; margin-bottom: 10px; border-bottom: 1px solid var(--line-2); }
    .frame { padding: 14px; }
    .frame img { max-height: none; }
    .contents { padding: 20px 16px; }
    h1 { font-size: 21px; }
  }
  @media print {
    body { background: #fff; padding: 0; }
    .page { width: auto; min-height: 100vh; margin: 0; box-shadow: none; }
    .no-print { display: none; }
  }
`;

/** Can this item be shown inside the pack without cropping it? Only a raster
    image we actually hold the bytes for. */
const isEmbeddableImage = (e: EvidenceItem): boolean =>
  Boolean(e.fileDataUrl) && (e.mimeType ?? "").startsWith("image/");

/** The document TYPE the centre counter counts within. Source type is the
    right grain: a verifier samples "the fuel invoices", not "the uploads". */
const typeLabel = (t: EvidenceSourceType): string => EVIDENCE_SOURCE_LABEL[t] ?? String(t);

/** What this document is, for the centre of the bar — the type plus the month
    it belongs to, because "Utility invoice" alone does not identify one of
    twelve. */
function documentTitle(e: EvidenceItem): string {
  const base = typeLabel(e.sourceType);
  return e.month ? `${base} · ${monthName(e.month)}` : base;
}

/* The key the "1 of N" counts within: THE TYPE, and only the type.

   Including the month here was wrong and quietly defeated the whole feature —
   twelve monthly utility invoices each came out as "1 of 1", because each
   month was its own series of one. The counter exists to answer "is this all
   the utility invoices?", and that question is about the type across the
   year. The month still prints beside it, so the reader can see WHICH of the
   twelve they are looking at; it just does not partition the count. */
const seriesKey = (e: EvidenceItem): string => String(e.sourceType);

export function buildEvidencePackSection(ws: VerificationWorkspace): EvidencePackSection {
  /* Ordered by the five formal categories first (§5/§6.3 of the restructure
     pack — Production & Process Records, Laboratory Analysis & Third-Party
     Verification, Supplier-Submitted Documentation, Organisational &
     Compliance Documentation, Financial & Procurement Records, in that fixed
     order), then the way a verifier reads within a category: annual context
     first, then month by month, grouped by type so the per-type counter
     runs consecutively rather than jumping around the pack. */
  const all = listEvidence(ws.id);
  const annualIds = new Set(annualEvidence(ws.id).map((e) => e.id));
  const ordered = [...all].sort((a, b) => {
    const deptA = EVIDENCE_CATEGORY_ORDER.indexOf(departmentForEvidenceItem(a));
    const deptB = EVIDENCE_CATEGORY_ORDER.indexOf(departmentForEvidenceItem(b));
    if (deptA !== deptB) return deptA - deptB;
    const scopeA = annualIds.has(a.id) ? 0 : 1;
    const scopeB = annualIds.has(b.id) ? 0 : 1;
    if (scopeA !== scopeB) return scopeA - scopeB;
    const typeCompare = typeLabel(a.sourceType).localeCompare(typeLabel(b.sourceType));
    if (typeCompare !== 0) return typeCompare;
    return (a.month ?? "").localeCompare(b.month ?? "");
  });

  /* The per-type denominators, computed BEFORE anything renders. "1 of 3" has
     to know there are three before it prints the first, which is why this is a
     counting pass rather than a running tally. */
  const totalOfType = new Map<string, number>();
  for (const e of ordered) {
    const k = seriesKey(e);
    totalOfType.set(k, (totalOfType.get(k) ?? 0) + 1);
  }
  const seenOfType = new Map<string, number>();

  const referred = ordered.filter((e) => !isEmbeddableImage(e));
  // Contents page + one page per document (embedded or referral).
  const totalPages = 1 + ordered.length;

  const bar = (what: string, page: number): string => `
    <div class="bar">
      <span class="mark">${LOGO}<span>Certrace</span></span>
      <span class="what">${what}</span>
      <span class="pg">${page} / ${totalPages}</span>
    </div>`;

  const pages: string[] = [];

  /* ── Page 1 · contents ──────────────────────────────────── */
  const byType = [...totalOfType.entries()]
    .map(([key, count]) => ({ key, count, label: typeLabel(ordered.find((e) => seriesKey(e) === key)!.sourceType) }))
    .sort((a, b) => a.label.localeCompare(b.label));
  pages.push(`
<section class="page">
  ${bar(`<strong>Contents</strong>`, 1)}
  <div class="contents">
    <span class="eyebrow">CBAM · Supporting evidence</span>
    <h1>${esc(ws.productName)}</h1>
    <p class="lead">
      ${esc(ws.installationName)} · ${esc(ws.periodStart)} to ${esc(ws.periodEnd)}.
      Every document behind the figures in the communication report, in the order a verifier reads them:
      annual context first, then month by month. Each page carries the document's position within its own
      type, so a missing item in a series is visible without counting.
    </p>
    <h2>Documents in this pack</h2>
    <table>
      <thead><tr><th>Type</th><th class="n">Count</th><th>Scope</th><th>Reviewed</th></tr></thead>
      <tbody>
      ${byType
        .map(({ key, count, label }) => {
          const items = ordered.filter((e) => seriesKey(e) === key);
          const reviewed = items.filter(isReviewed).length;
          return `<tr>
            <td>${esc(label)}</td>
            <td class="n">${count}</td>
            <td>${items[0]?.month ? "Monthly" : "Annual"}</td>
            <td>${reviewed} of ${count}</td>
          </tr>`;
        })
        .join("")}
      </tbody>
    </table>
    ${
      ordered.length === 0
        ? `<div class="note warn">No evidence has been uploaded for this workspace. A pack with no documents in it does
           not support any figure in the communication report — a verifier receiving this will ask for the invoices,
           meter logs and production records before they begin.</div>`
        : ""
    }
    ${
      referred.length > 0
        ? `<h2>Attachments that travel beside this pack</h2>
           <div class="note">
             ${referred.length} document${referred.length === 1 ? "" : "s"} could not be placed inside the pack without
             the risk of cropping ${referred.length === 1 ? "it" : "them"} — PDFs, and files too large to hold inline.
             ${referred.length === 1 ? "It has" : "They each have"} a referral page here naming
             ${referred.length === 1 ? "it" : "them"}, and the original file${referred.length === 1 ? "" : "s"} must be
             sent to the verifier unchanged alongside this pack.
           </div>
           <table>
             <thead><tr><th>File</th><th>Type</th><th>Scope</th></tr></thead>
             <tbody>
             ${referred
               .map(
                 (e) => `<tr><td>${esc(e.fileName)}</td><td>${esc(typeLabel(e.sourceType))}</td>
                   <td>${e.month ? esc(monthName(e.month)) : "Annual"}</td></tr>`,
               )
               .join("")}
             </tbody>
           </table>`
        : ""
    }
  </div>
</section>`);

  /* ── One page per document ──────────────────────────────── */
  ordered.forEach((e, i) => {
    const title = documentTitle(e);
    const key = seriesKey(e);
    const n = (seenOfType.get(key) ?? 0) + 1;
    seenOfType.set(key, n);
    const total = totalOfType.get(key) ?? 1;
    const what = `<strong>${esc(title)}</strong> <span class="of">· ${n} of ${total}</span>`;
    const page = i + 2; // contents is 1

    if (isEmbeddableImage(e)) {
      pages.push(`
<section class="page">
  ${bar(what, page)}
  <div class="frame"><img src="${esc(e.fileDataUrl)}" alt="${esc(e.fileName)}"></div>
</section>`);
      return;
    }

    /* A referral page. It carries the same bar and the same position in the
       series, so the pack's numbering stays continuous and a verifier counting
       "fuel invoice 2 of 3" finds a page there whether or not the bytes could
       be embedded. */
    const isPdf = (e.mimeType ?? "").includes("pdf");
    pages.push(`
<section class="page">
  ${bar(what, page)}
  <div class="frame">
    <div class="referral">
      <h3>Attached separately</h3>
      <div class="fn">${esc(e.fileName)}</div>
      <p>
        ${
          isPdf
            ? "This is a PDF. It is sent to the verifier as its original file rather than redrawn into this pack, so that not one page of it is resized, re-compressed or cropped."
            : "The original file is held outside this pack and is sent to the verifier unchanged."
        }
      </p>
      <p class="muted">
        ${esc(typeLabel(e.sourceType))}${e.month ? ` · ${esc(monthName(e.month))}` : " · annual"}
        ${e.sizeBytes ? ` · ${Math.round(e.sizeBytes / 1024).toLocaleString("en-GB")} KB` : ""}
        · uploaded ${esc(e.capturedAt.slice(0, 10))}
      </p>
      ${e.fieldKeys.length > 0 ? `<p class="muted">Substantiates: ${esc(e.fieldKeys.join(", "))}</p>` : ""}
    </div>
  </div>
</section>`);
  });

  const fileNameSlug = `${ws.productName}-${ws.installationName}-${ws.year}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return {
    bodyHtml: pages.join("\n"),
    styleCss: STYLE,
    embedded: ordered.length - referred.length,
    referred,
    totalPages,
    fileNameSlug,
  };
}

export function buildEvidencePack(ws: VerificationWorkspace): EvidencePackResult {
  const section = buildEvidencePackSection(ws);
  const title = `CBAM evidence pack — ${workspaceTitle(ws)}`;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>${section.styleCss}</style>
</head><body>
${section.bodyHtml}
</body></html>`;

  return { html, fileName: `cbam-evidence-pack-${section.fileNameSlug}.html`, embedded: section.embedded, referred: section.referred, totalPages: section.totalPages };
}

export function downloadEvidencePack(ws: VerificationWorkspace): EvidencePackResult {
  const pack = buildEvidencePack(ws);
  downloadFile(pack.fileName, pack.html, "text/html");
  return pack;
}
