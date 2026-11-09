/* The report set → PDF.

   One PDF per report, in the same typographic grammar as the monitoring
   methodology document (lib/cbam/mmd-pdf.ts): Courier eyebrows, light Helvetica
   headings, hairline rules. jsPDF is imported dynamically so it never enters
   the edge bundle.

   Every row prints its Annex IV item number in the left column — the number a
   verifier cross-checks against the regulation. A row the portal does not hold
   prints its state in words ("Missing", "Kept outside the portal") rather than
   an empty cell, so a blank is never mistaken for an answer of "none". */

import type { Installation } from "../installations";
import { buildZip, type ZipEntry } from "../zip";
import { ITEM_STATE_LABEL, reportSetFileName, type ReportDoc } from "./report-set";

const MARGIN = 48;
const INK: [number, number, number] = [17, 17, 17];
const MUTED: [number, number, number] = [120, 118, 112];
const WARN: [number, number, number] = [180, 83, 9];

/** jsPDF's core fonts are Latin-1 only; anything outside it renders as junk. */
function pdfSafe(text: string): string {
  const fallback: Record<string, string> = { "₂": "2", "₃": "3", "—": "-", "–": "-", "·": "-", "→": "->", "≥": ">=", "≤": "<=", "Δ": "delta", "²": "2", "³": "3", "⁺": "+", "⁻": "-", "₄": "4" };
  let out = "";
  for (const ch of text) {
    if (fallback[ch]) {
      out += fallback[ch];
      continue;
    }
    const cp = ch.codePointAt(0)!;
    out += cp === 0x0a || (cp >= 0x20 && cp <= 0x7e) || (cp >= 0xa0 && cp <= 0xff) ? ch : "?";
  }
  return out;
}

export type ReportPdfContext = {
  installation: Installation | null;
  year: number;
  /** "Name · job title" of whoever signed the figures off, when somebody has */
  signedBy?: string;
  generatedAt?: Date;
  /** files that travel in the package beside the PDFs — the evidence and the precursors' verification reports */
  extraFiles?: ZipEntry[];
};

export async function buildReportPdf(report: ReportDoc, ctx: ReportPdfContext) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const width = pageWidth - MARGIN * 2;
  let y = MARGIN;

  const space = (needed: number) => {
    if (y + needed > pageHeight - MARGIN - 10) {
      doc.addPage();
      y = MARGIN;
    }
  };
  const eyebrow = (t: string) => {
    space(20);
    doc.setFont("courier", "normal").setFontSize(8.5).setTextColor(...MUTED);
    doc.text(pdfSafe(t).toUpperCase(), MARGIN, y);
    y += 16;
  };
  const heading = (t: string, size = 13) => {
    space(size + 16);
    doc.setFont("helvetica", "normal").setFontSize(size).setTextColor(...INK);
    doc.text(pdfSafe(t), MARGIN, y);
    y += size + 8;
  };
  const body = (t: string, color = MUTED) => {
    if (!t.trim()) return;
    doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(...color);
    for (const line of doc.splitTextToSize(pdfSafe(t), width)) {
      space(14);
      doc.text(line, MARGIN, y);
      y += 13;
    }
    y += 5;
  };

  const inst = ctx.installation;

  /* ── Cover ── */
  eyebrow(`${report.reg}`);
  doc.setFont("helvetica", "normal").setFontSize(24).setTextColor(...INK);
  doc.text(pdfSafe(report.title), MARGIN, y + 10);
  y += 42;
  body(`${inst?.name || "Installation"}${inst?.id ? ` (${inst.id})` : ""} - reporting year ${ctx.year}`);
  body(report.purpose);
  const incomplete = !report.complete;
  const index = report.kind === "precursor_verification" || report.kind === "evidence_index";
  if (incomplete) {
    body(
      index
        ? `This index is not complete: ${report.tally.missing} document(s) still to get and ${report.tally.partial} partly there. They are marked in the tables below.`
        : `This copy is incomplete: ${report.tally.missing} item(s) missing and ${report.tally.partial} partly there. They are marked in the tables below.`,
      WARN,
    );
  }
  if (ctx.signedBy) body(`Figures signed off internally by ${ctx.signedBy}. This is an internal control, not an electronic signature.`);
  else if (!incomplete) body("Complete, and not yet signed off internally.");
  body(index ? "The documents this index lists travel in the same package, in the folders beside the reports." : "Language: English, as the regulation requires of the operator's report.");

  if (incomplete) {
    const open = report.sections.flatMap((s) => s.rows.filter((r) => r.state === "missing" || r.state === "partial").map((r) => `${r.n}  ${r.label}`));
    if (open.length > 0) {
      y += 4;
      heading("Still to fill in", 12);
      for (const line of open.slice(0, 40)) body(`- ${line}`);
      if (open.length > 40) body(`... and ${open.length - 40} more, marked in the tables below.`);
    }
  }

  /* ── Sections ── */
  for (const section of report.sections) {
    space(60);
    heading(section.title, 13);
    autoTable(doc, {
      startY: y,
      head: [["Item", "Question", "Answer", "Status"]],
      body: section.rows.map((r) => [pdfSafe(r.n), pdfSafe(r.label), pdfSafe(r.value || "-"), pdfSafe(ITEM_STATE_LABEL[r.state])]),
      margin: { left: MARGIN, right: MARGIN },
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 5, textColor: MUTED, overflow: "linebreak" },
      headStyles: { fillColor: [245, 244, 240], textColor: INK, fontStyle: "normal" },
      columnStyles: { 0: { cellWidth: 54, font: "courier", textColor: INK }, 1: { cellWidth: 184 }, 3: { cellWidth: 74 } },
      theme: "grid",
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14;

    for (const t of section.tables ?? []) {
      if (t.table.rows.length === 0) continue;
      space(50);
      doc.setFont("courier", "normal").setFontSize(8).setTextColor(...MUTED);
      doc.text(pdfSafe(t.caption).toUpperCase(), MARGIN, y);
      y += 10;
      autoTable(doc, {
        startY: y,
        head: [t.table.head.map(pdfSafe)],
        body: t.table.rows.map((r) => r.map((c) => pdfSafe(c || "-"))),
        margin: { left: MARGIN, right: MARGIN },
        styles: { font: "helvetica", fontSize: 8, cellPadding: 4, textColor: MUTED, overflow: "linebreak" },
        headStyles: { fillColor: [250, 249, 247], textColor: INK, fontStyle: "normal" },
        theme: "grid",
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16;
    }
  }

  if (report.sections.length === 0) body(report.notApplicable ?? "Nothing to report.");

  /* ── Footer on every page ── */
  const pages = doc.getNumberOfPages();
  const stamp = (ctx.generatedAt ?? new Date()).toISOString().slice(0, 10);
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("courier", "normal").setFontSize(7.5).setTextColor(...MUTED);
    doc.text(pdfSafe(`${report.title} - ${inst?.name || "Installation"} - ${ctx.year}${incomplete ? " - INCOMPLETE" : ""} - ${stamp}`), MARGIN, pageHeight - 24);
    doc.text(`${i} / ${pages}`, pageWidth - MARGIN, pageHeight - 24, { align: "right" });
  }
  return doc;
}

export async function downloadReportPdf(report: ReportDoc, ctx: ReportPdfContext, fileName: string) {
  const doc = await buildReportPdf(report, ctx);
  doc.save(fileName);
}

/* ── The package ────────────────────────────────────────────────
   The set leaves as ONE file: every report, as a PDF, in a zip — with the two
   indexes (the precursors' verification reports, the supporting evidence) and,
   in folders beside them, the documents those indexes list. The screen only
   offers it once every report is complete, so no report in here is stamped
   INCOMPLETE on the way out; an index can still say what it could not carry. */
export async function buildReportPackage(reports: ReportDoc[], ctx: ReportPdfContext): Promise<{ bytes: Uint8Array; files: string[] }> {
  const entries: ZipEntry[] = [];
  for (const report of reports) {
    const doc = await buildReportPdf(report, ctx);
    entries.push({ name: reportSetFileName(ctx.installation, ctx.year, report.kind), data: new Uint8Array(doc.output("arraybuffer") as ArrayBuffer) });
  }
  entries.push(...(ctx.extraFiles ?? []));
  return { bytes: buildZip(entries, ctx.generatedAt), files: entries.map((e) => e.name) };
}

export async function downloadReportPackage(reports: ReportDoc[], ctx: ReportPdfContext, fileName: string) {
  const { bytes, files } = await buildReportPackage(reports, ctx);
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/zip" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoked on the next turn: the click has to have started the download first.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return files;
}
