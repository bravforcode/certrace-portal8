/* ════════════════════════════════════════════════════════════
   THE FINAL REPORT, AS ONE PDF

   Two stages, deliberately separate:

   1. jsPDF renders the Verification Report itself — the cover, then Parts
      1-4 — using the same typographic grammar as lib/download.ts and
      lib/cbam/mmd-pdf.ts (Courier eyebrows, light Helvetica headings,
      hairline rules), because a verifier receiving these documents should
      recognise them as one system.

   2. pdf-lib concatenates that report with every Evidence file, converting
      each one on the way in: native PDFs are copied page for page, images
      become one page each, and anything that cannot be rendered becomes a
      named placeholder page rather than a silent omission.

   WHY TWO LIBRARIES. jsPDF can only ever WRITE a page — it has no way to
   read an existing PDF back in, so it cannot pass a supplier's scanned
   invoice through unchanged. pdf-lib can copy pages between documents, which
   is the whole merge step. Neither replaces the other and the repo had no
   merge library at all, so pdf-lib is the one dependency this feature adds.

   Both are imported dynamically, the same way lib/download.ts imports jsPDF:
   these are large libraries and neither belongs in the edge bundle.

   KNOWN LIMIT — SCRIPT COVERAGE. jsPDF's core fonts are WinAnsi (cp1252), so
   Thai, Chinese and Arabic text cannot be drawn at all. Such a run renders as
   UNRENDERABLE below rather than as a string of question marks. Lifting this
   needs a Unicode TTF embedded through addFileToVFS/addFont — the repo ships
   no .ttf today (the brand faces arrive as woff2 through next/font, which
   jsPDF cannot read), so it is a deliberate gap, not an oversight.
   ════════════════════════════════════════════════════════════ */

import type { EvidenceItem } from "../workspace-evidence";
import type { Block, FinalReportDoc, Part } from "./final-report-doc";

const MARGIN = 48;
const A4: [number, number] = [595.28, 841.89];
const A4_LANDSCAPE: [number, number] = [841.89, 595.28];
const INK: [number, number, number] = [17, 17, 17];
const MUTED: [number, number, number] = [120, 118, 112];
const WARN: [number, number, number] = [180, 83, 9];

/** A table wider than this gets its own landscape page. Part 4.1 carries
    twelve columns before its sector-specific ones — squeezed onto portrait
    A4 that is under 30pt a column, which is not a document anybody can
    check a figure in. */
const LANDSCAPE_COLUMN_THRESHOLD = 7;

/* jsPDF's built-in fonts implement WinAnsi (cp1252) only; anything outside
   renders as mojibake. Every string reaching doc.text()/autoTable goes
   through this first, so an unsupported glyph degrades to "?" instead of
   shipping corrupted text in a government-facing document. */
const UNICODE_FALLBACK: Record<string, string> = {
  "→": "->", "≥": ">=", "≤": "<=", "·": "-", "×": "x", "−": "-", "÷": "/",
  /* The SEE workings are written in the regulation's own notation, so the
     summation sign reaches the renderer on every report. Left unmapped it
     printed "?_m production_m", which reads as a corrupted formula rather
     than the sum it is. */
  "Σ": "SUM", "∑": "SUM", "Δ": "delta", "δ": "delta", "α": "alpha", "β": "beta", "η": "eta", "ρ": "rho",
  "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9",
  "²": "2", "³": "3", "√": "sqrt", "∞": "inf", "≈": "~=", "≠": "!=",
  "ᵢ": "i", "ⱼ": "j", "ₖ": "k", "ₘ": "m", "ₙ": "n", "ₐ": "a", "ₑ": "e", "ₒ": "o", "ₓ": "x",
};

/** What stands in for a run of characters the core fonts cannot draw. One
    marker for the whole run, never one per character: a Thai installation
    name rendered character by character came out as "????????????????",
    which looks like corruption rather than like a limitation, and is the
    kind of thing that gets a filing queried. */
export const UNRENDERABLE = "[non-Latin script]";

export function pdfSafe(input: string): string {
  let out = "";
  let dropped = false;
  for (const ch of String(input ?? "")) {
    if (UNICODE_FALLBACK[ch]) {
      if (dropped) {
        out += UNRENDERABLE;
        dropped = false;
      }
      out += UNICODE_FALLBACK[ch];
      continue;
    }
    const cp = ch.codePointAt(0)!;
    const safe =
      cp === 0x0a ||
      cp === 0x0d ||
      (cp >= 0x20 && cp <= 0x7e) ||
      (cp >= 0xa0 && cp <= 0xff) ||
      [0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2026].includes(cp);
    if (safe) {
      if (dropped) {
        out += UNRENDERABLE;
        dropped = false;
      }
      out += ch;
    } else {
      dropped = true;
    }
  }
  if (dropped) out += UNRENDERABLE;
  return out;
}

/* ── Stage 1 · the Verification Report ──────────────────────── */

/** Called once per Part/Subsection heading as it is drawn, with the jsPDF
    page it landed on (`pdf.getNumberOfPages()` at that moment — this
    document's OWN page numbering, before the merge stage inserts anything
    ahead of it). `assembleFinalReportPdf` uses this to build the Table of
    Contents; the argument is optional so existing callers (and the test
    suite, which asserts against the bare report bytes) are unaffected. */
export type HeadingSeen = (label: string, jsPdfPage: number) => void;

export async function renderReportPdf(doc: FinalReportDoc, onHeading?: HeadingSeen): Promise<Uint8Array> {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const pdf = new jsPDF({ unit: "pt", format: "a4" });

  let y = MARGIN;
  const width = () => pdf.internal.pageSize.getWidth();
  const height = () => pdf.internal.pageSize.getHeight();
  const inner = () => width() - MARGIN * 2;
  const isLandscape = () => width() > height();

  /* PAGE BREAKS ARE LAZY. A page is requested, not added, and only becomes
     real when something is actually drawn on it. Adding it eagerly is what
     put a blank sheet after every landscape table and — worse — stranded a
     subsection's heading on the portrait page while its table appeared alone
     on the next one, a table with no title above it. */
  let pending: "portrait" | "landscape" | null = null;
  const request = (orientation: "portrait" | "landscape") => {
    pending = orientation;
  };
  const flush = () => {
    if (!pending) return;
    pdf.addPage(pending === "landscape" ? A4_LANDSCAPE : A4, pending);
    pending = null;
    y = MARGIN;
  };

  /** Space for `needed` points, breaking to a fresh page of the CURRENT
      orientation if there is not enough. */
  const room = (needed: number) => {
    flush();
    if (y + needed <= height() - MARGIN) return;
    pdf.addPage(isLandscape() ? A4_LANDSCAPE : A4, isLandscape() ? "landscape" : "portrait");
    y = MARGIN;
  };

  const eyebrow = (s: string) => {
    room(22);
    pdf.setFont("courier", "normal").setFontSize(7.5).setTextColor(...MUTED);
    pdf.text(pdfSafe(s.toUpperCase()), MARGIN, y);
    /* Clear of the heading that follows: a 20pt title drawn 14pt below this
       baseline reaches back up into it. */
    y += 22;
  };

  const heading = (s: string, size = 15) => {
    room(size + 14);
    pdf.setFont("helvetica", "normal").setFontSize(size).setTextColor(...INK);
    const lines = pdf.splitTextToSize(pdfSafe(s), inner()) as string[];
    for (const line of lines) {
      room(size + 4);
      pdf.text(line, MARGIN, y);
      y += size + 3;
    }
    y += 5;
  };

  const rule = () => {
    room(10);
    pdf.setDrawColor(226, 223, 216).setLineWidth(0.5);
    pdf.line(MARGIN, y, width() - MARGIN, y);
    y += 12;
  };

  const paragraph = (s: string, size = 8.5, color = MUTED) => {
    const lines = (() => {
      room(size + 3);
      pdf.setFont("helvetica", "normal").setFontSize(size);
      return pdf.splitTextToSize(pdfSafe(s), inner()) as string[];
    })();
    for (const line of lines) {
      room(size + 3);
      pdf.setFont("helvetica", "normal").setFontSize(size).setTextColor(...color);
      pdf.text(line, MARGIN, y);
      y += size + 2.5;
    }
    y += 6;
  };

  const bullets = (items: string[]) => {
    for (const item of items) {
      room(12);
      pdf.setFont("helvetica", "normal").setFontSize(8).setTextColor(...MUTED);
      const lines = pdf.splitTextToSize(pdfSafe(item), inner() - 12) as string[];
      lines.forEach((line, i) => {
        room(11);
        pdf.text(i === 0 ? `- ${line}` : `  ${line}`, MARGIN, y);
        y += 10;
      });
    }
    y += 6;
  };

  const fieldTable = (rows: { label: string; value: string }[]) => {
    room(40);
    autoTable(pdf, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      theme: "plain",
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: { top: 3, bottom: 3, left: 0, right: 6 }, textColor: INK, lineWidth: 0 },
      columnStyles: { 0: { cellWidth: inner() * 0.42, textColor: MUTED }, 1: { cellWidth: inner() * 0.58 } },
      body: rows.map((r) => [pdfSafe(r.label), pdfSafe(r.value)]),
    });
    y = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14;
  };

  const dataTable = (columns: string[], rows: string[][], caption?: string) => {
    if (caption) {
      room(14);
      pdf.setFont("helvetica", "normal").setFontSize(8).setTextColor(...MUTED);
      pdf.text(pdfSafe(caption), MARGIN, y);
      y += 12;
    }
    room(40);
    /* Sized to the page it landed on, not to the column count: the caller has
       already put a wide table on a landscape page. */
    const size = isLandscape() ? 6.5 : 7.5;
    autoTable(pdf, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      theme: "grid",
      styles: { font: "helvetica", fontSize: size, cellPadding: 3, textColor: INK, lineColor: [226, 223, 216], lineWidth: 0.4, overflow: "linebreak" },
      headStyles: { fillColor: [247, 246, 243], textColor: INK, fontStyle: "normal" },
      head: [columns.map(pdfSafe)],
      body: rows.map((r) => r.map(pdfSafe)),
    });
    y = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14;
  };

  const block = (b: Block) => {
    if (b.kind === "fields") fieldTable(b.rows);
    else if (b.kind === "table") dataTable(b.columns, b.rows, b.caption);
    else paragraph(b.text);
  };

  /* ── Cover — Certrace's own front matter, before Part 1 ───── */
  eyebrow("CBAM · Monitoring Methodology Documentation");
  heading(doc.cover.title, 20);
  paragraph(doc.cover.subtitle, 9);

  if (doc.cover.draftBanner) {
    room(30);
    pdf.setFillColor(254, 243, 226);
    pdf.rect(MARGIN, y - 9, inner(), 26, "F");
    pdf.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(...WARN);
    const lines = pdf.splitTextToSize(pdfSafe(doc.cover.draftBanner), inner() - 16) as string[];
    let ly = y + 2;
    for (const line of lines.slice(0, 2)) {
      pdf.text(line, MARGIN + 8, ly);
      ly += 11;
    }
    y += 34;
  }

  rule();
  fieldTable(doc.cover.notes);

  if (doc.cover.outstanding.length > 0) {
    bullets(doc.cover.outstanding);
    paragraph("The workspace's Readiness tab carries the complete list, each item linked to the screen that clears it.", 8);
  }

  if (doc.cover.workings.length > 0) {
    heading("How every figure in Part 4 was calculated", 11);
    paragraph(
      "Certrace's own working, printed before the template's parts so it never interrupts them. Each block gives the formula, the same formula with " +
        "this installation's numbers in it, then the result. Re-key the middle line and you should land on the bottom one.",
    );
    pdf.setFont("courier", "normal").setFontSize(7.5).setTextColor(...INK);
    for (const w of doc.cover.workings) {
      for (const raw of w.split("\n")) {
        const lines = pdf.splitTextToSize(pdfSafe(raw), inner()) as string[];
        for (const line of lines) {
          room(11);
          pdf.setFont("courier", "normal").setFontSize(7.5).setTextColor(...INK);
          pdf.text(line, MARGIN, y);
          y += 9.5;
        }
      }
      y += 6;
    }
    y += 4;
  }

  /* ── Parts 1-4, in order, never interleaved ───────────────── */

  /** A table this wide is unreadable on portrait A4 — Part 4.1 alone carries
      twelve columns before its sector-specific ones, which is under 30pt a
      column. The whole SUBSECTION moves to landscape, not just the table, so
      its heading and its note travel with it. */
  const isWide = (b: Block) => b.kind === "table" && b.columns.length > LANDSCAPE_COLUMN_THRESHOLD;

  const renderPart = (part: Part) => {
    request("portrait");
    eyebrow(`Part ${part.number}`);
    heading(part.title, 16);
    onHeading?.(`Part ${part.number} · ${part.title}`, pdf.getNumberOfPages());
    rule();
    for (const sub of part.subsections) {
      const wide = sub.blocks.some(isWide);
      if (wide) request("landscape");
      heading(`${sub.number} · ${sub.title}`, 11);
      onHeading?.(`${sub.number} · ${sub.title}`, pdf.getNumberOfPages());
      for (const b of sub.blocks) block(b);
      if (wide) request("portrait");
    }
  };
  for (const part of doc.parts) renderPart(part);

  return new Uint8Array(pdf.output("arraybuffer") as ArrayBuffer);
}

/* ── Stage 2 · the merge ────────────────────────────────────── */

/** base64 payload of a data URL → bytes, in either runtime. The browser has
    atob and node has Buffer; the export runs in the browser but the test
    suite runs in node, and a merge that only works in one of them is a merge
    nobody can prove works. */
export function bytesFromDataUrl(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(",");
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  if (typeof atob === "function") {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(b64, "base64"));
}

const mimeOf = (item: EvidenceItem): string => (item.mimeType ?? "").toLowerCase();

export type MergeFailure = { fileName: string; reason: string };

export type FinalReportPdf = {
  bytes: Uint8Array;
  fileName: string;
  draft: boolean;
  pageCount: number;
  /** evidence files whose own pages are inside the document */
  embedded: number;
  /** evidence files that became a placeholder page instead */
  placeholders: MergeFailure[];
};

/** One row of the Table of Contents — a Part, a Subsection, "Supporting
    Evidence" itself, or one of its populated categories. `page` is 1-based
    and refers to the FINAL merged document, after the TOC page itself has
    been inserted. */
type TocEntry = { label: string; page: number; indent: boolean };

/* ── The Certrace mark, as path data ─────────────────────────────
   Copied verbatim from the evidence-pack's own `.bar .mark` SVG (viewBox
   0 0 24 24, stroke-width 1.6, no fill) — one mark, one set of coordinates,
   so the header drawn here and the one that HTML path once drew never
   quietly diverge. */
const MARK_PATHS = ["M15.5 4.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 1 0-15Z", "M8.5 4.5a7.5 7.5 0 0 1 0 15"];
const MARK_VIEWBOX = 24;

export async function assembleFinalReportPdf(doc: FinalReportDoc): Promise<FinalReportPdf> {
  const { PDFDocument, StandardFonts, PDFName, PDFArray, rgb } = await import("pdf-lib");

  const out = await PDFDocument.create();
  const font = await out.embedFont(StandardFonts.Helvetica);
  const fontBold = await out.embedFont(StandardFonts.HelveticaBold);
  const mono = await out.embedFont(StandardFonts.Courier);

  /** A divider. Plain text, no branding — the contract fixes this: a reader
      scanning for a category should find a label, not a designed page. */
  const textPage = (title: string, lines: string[] = []) => {
    const page = out.addPage(A4);
    const { height } = page.getSize();
    page.drawText(pdfSafe(title), { x: MARGIN, y: height / 2, size: 18, font, color: rgb(0.07, 0.07, 0.07) });
    let ly = height / 2 - 24;
    for (const line of lines) {
      page.drawText(pdfSafe(line), { x: MARGIN, y: ly, size: 9, font: mono, color: rgb(0.42, 0.41, 0.39) });
      ly -= 13;
    }
    return page;
  };

  // The report itself. `reportToc` is filled in as renderReportPdf draws each
  // Part/Subsection heading, in this document's OWN page numbering.
  const reportToc: TocEntry[] = [];
  const reportBytes = await renderReportPdf(doc, (label, jsPdfPage) => {
    reportToc.push({ label, page: jsPdfPage, indent: !label.startsWith("Part ") });
  });
  const reportPdf = await PDFDocument.load(reportBytes);
  for (const page of await out.copyPages(reportPdf, reportPdf.getPageIndices())) out.addPage(page);

  /* THE TABLE OF CONTENTS PAGE IS RESERVED, NOT APPENDED.
     `renderReportPdf`'s own page-break rule (see the "PAGE BREAKS ARE LAZY"
     comment in Stage 1) makes the cover exactly one page and Part 1 always
     start a fresh one — so a blank page inserted at index 1 lands, every
     time, right between them. Every report-side page number collected above
     is now one page later than where it actually sits in `out`, hence the
     "+ 1" below; evidence pages, captured AFTER this insertion, need no such
     adjustment. */
  out.insertPage(1, A4);
  const toc: TocEntry[] = reportToc.map((e) => ({ ...e, page: e.page + 1 }));

  // §4 — the divider, immediately after Part 4.
  toc.push({ label: "Supporting Evidence", page: out.getPageCount() + 1, indent: false });
  textPage("Supporting Evidence");

  let embedded = 0;
  const placeholders: MergeFailure[] = [];

  for (const section of doc.evidence) {
    toc.push({ label: section.title, page: out.getPageCount() + 1, indent: true });
    textPage(section.title, [`Category ${section.ordinal} of 5`, `${section.items.length} document(s)`]);

    for (const item of section.items) {
      const name = item.fileName || "unnamed file";
      try {
        if (!item.fileDataUrl) {
          /* Metadata-only: the file was over the inline storage limit, so
             only its record is held. Named, not dropped — the reader has to
             know to ask for it. */
          throw new Error("held outside the browser — the file exceeds the inline storage limit and must be sent as the original");
        }
        const mime = mimeOf(item);
        const bytes = bytesFromDataUrl(item.fileDataUrl);

        if (mime === "application/pdf") {
          const src = await PDFDocument.load(bytes);
          const pages = await out.copyPages(src, src.getPageIndices());
          for (const p of pages) out.addPage(p);
          embedded++;
          continue;
        }

        if (mime === "image/jpeg" || mime === "image/jpg" || mime === "image/png") {
          const image = mime === "image/png" ? await out.embedPng(bytes) : await out.embedJpg(bytes);
          const page = out.addPage(A4);
          const { width: pw, height: ph } = page.getSize();
          /* Scaled to fit, never cropped: a page of a scanned certificate
             with its corner cut off is not evidence of anything. */
          const scale = Math.min((pw - MARGIN * 2) / image.width, (ph - MARGIN * 2) / image.height, 1);
          const w = image.width * scale;
          const h = image.height * scale;
          page.drawImage(image, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
          embedded++;
          continue;
        }

        throw new Error(`${item.mimeType || "this file type"} cannot be converted to PDF in the browser`);
      } catch (e) {
        const reason = e instanceof Error ? e.message : String(e);
        placeholders.push({ fileName: name, reason });
        /* §2 — a failed conversion holds its POSITION. Dropping it would
           make the appendix look complete when it is not. */
        textPage("Evidence file could not be rendered", [`${name} — ${reason}`]);
      }
    }
  }

  /* ── Table of Contents ───────────────────────────────────────
     Drawn last, once every page number in `toc` is known — the evidence loop
     above is what resolves the last of them. Every physical page the TOC can
     point at already exists in `out` by this point. */
  const allPages = out.getPages();
  const tocPage = allPages[1];
  const LINE = rgb(0.886, 0.875, 0.847);
  const INK = rgb(0.07, 0.07, 0.07);
  const INK_3 = rgb(0.29, 0.29, 0.28);
  const INK_4 = rgb(0.47, 0.46, 0.44);

  const linkTo = (page: (typeof allPages)[number], rect: [number, number, number, number], targetIndex: number) => {
    const annotRef = out.context.register(
      out.context.obj({
        Type: "Annot",
        Subtype: "Link",
        Rect: rect,
        Border: [0, 0, 0],
        Dest: [allPages[targetIndex].ref, "XYZ", null, null, null],
      }),
    );
    const existing = page.node.lookupMaybe(PDFName.of("Annots"), PDFArray);
    if (existing) existing.push(annotRef);
    else page.node.set(PDFName.of("Annots"), out.context.obj([annotRef]));
  };

  {
    const { width, height } = tocPage.getSize();
    tocPage.drawText("Table of Contents", { x: MARGIN, y: height - MARGIN - 6, size: 16, font: fontBold, color: INK });
    let y = height - MARGIN - 42;
    const rowH = 15.5;
    for (const entry of toc) {
      if (y < MARGIN + 14) break; // more rows than fit — see note above drawToc's caller
      const size = entry.indent ? 8.5 : 9.5;
      const x = MARGIN + (entry.indent ? 16 : 0);
      const labelFont = entry.indent ? font : fontBold;
      const label = pdfSafe(entry.label);
      const pageLabel = String(entry.page);
      const rightX = width - MARGIN;
      const pageWidth = mono.widthOfTextAtSize(pageLabel, size);
      const labelWidth = labelFont.widthOfTextAtSize(label, size);

      tocPage.drawText(label, { x, y, size, font: labelFont, color: entry.indent ? INK_3 : INK });
      tocPage.drawText(pageLabel, { x: rightX - pageWidth, y, size, font: mono, color: INK_3 });

      const leaderStart = x + labelWidth + 6;
      const leaderEnd = rightX - pageWidth - 6;
      const dotWidth = font.widthOfTextAtSize(". ", size);
      if (leaderEnd > leaderStart && dotWidth > 0) {
        const dots = Math.max(0, Math.floor((leaderEnd - leaderStart) / dotWidth));
        tocPage.drawText(". ".repeat(dots), { x: leaderStart, y, size, font, color: LINE });
      }

      // A row's whole width is clickable, not just the label — a reader's
      // eye lands anywhere across the dotted leader before it clicks.
      const targetIndex = Math.max(0, Math.min(allPages.length - 1, entry.page - 1));
      linkTo(tocPage, [MARGIN, y - 3, rightX, y + size + 2], targetIndex);

      y -= rowH;
    }
  }

  /* ── Running header, every content page ────────────────────────
     One pass over the FULL merged document — jsPDF-rendered report pages and
     pdf-lib evidence pages alike — because this is the only point that
     reaches both (see the file header comment on WHY TWO LIBRARIES). The
     cover (index 0) and the TOC itself (index 1) stay bare. */
  const sortedToc = [...toc].sort((a, b) => a.page - b.page);
  /** The section active on a given page: the last TOC entry at or before it
      — "last heading so far wins", the same rule a page that starts mid-
      section reads by. */
  const activeSectionFor = (pageNumber: number): string => {
    let label = "";
    for (const entry of sortedToc) {
      if (entry.page > pageNumber) break;
      label = entry.label;
    }
    return label;
  };
  const truncateToWidth = (text: string, size: number, maxWidth: number): string => {
    if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
    let t = text;
    while (t.length > 1 && font.widthOfTextAtSize(`${t}…`, size) > maxWidth) t = t.slice(0, -1);
    return `${t}…`;
  };

  for (let i = 2; i < allPages.length; i++) {
    const page = allPages[i];
    const pageNumber = i + 1;
    const { width, height } = page.getSize();
    const top = height - 12;

    // Left — the Certrace mark, stroke-only, matching the evidence pack's
    // own `.bar .mark` mark (see MARK_PATHS).
    const markSize = 9;
    const markScale = markSize / MARK_VIEWBOX;
    for (const d of MARK_PATHS) {
      page.drawSvgPath(d, { x: MARGIN, y: top, scale: markScale, borderColor: INK, borderWidth: 1.6 * markScale });
    }
    page.drawText("CERTRACE", { x: MARGIN + markSize + 5, y: top - markSize + 1, size: 7, font, color: INK });

    // Center — the section active on this page, ellipsised rather than
    // overlapping the page-number zone on a long title.
    const section = activeSectionFor(pageNumber);
    if (section) {
      const centerMaxWidth = width - MARGIN * 2 - 220;
      const centerText = truncateToWidth(pdfSafe(section), 9.5, Math.max(80, centerMaxWidth));
      const centerWidth = font.widthOfTextAtSize(centerText, 9.5);
      page.drawText(centerText, { x: (width - centerWidth) / 2, y: top - 7, size: 9.5, font, color: INK_3 });
    }

    // Right — plain sequential numbering, no denominator.
    const pageText = `Page ${pageNumber}`;
    const pageWidth = mono.widthOfTextAtSize(pageText, 9.5);
    page.drawText(pageText, { x: width - MARGIN - pageWidth, y: top - 7, size: 9.5, font: mono, color: INK_4 });

    page.drawLine({ start: { x: MARGIN, y: top - 16 }, end: { x: width - MARGIN, y: top - 16 }, thickness: 0.5, color: LINE });
  }

  const bytes = await out.save();
  return {
    bytes,
    fileName: `monitoring-methodology-documentation-${doc.fileNameSlug}${doc.draft ? "-draft" : ""}.pdf`,
    draft: doc.draft,
    pageCount: out.getPageCount(),
    embedded,
    placeholders,
  };
}
