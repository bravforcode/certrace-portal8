/* MMD → PDF.

   Reuses the same jsPDF approach as lib/download.ts (dynamic import, so the
   library never enters the edge bundle) and the same typographic grammar —
   Courier eyebrows, light Helvetica headings, hairline rules — because a
   verifier receiving both documents should recognise them as one system.

   Deliberately its own module rather than another branch inside
   buildPackagePdf: the MMD is a standalone deliverable that gets sent BEFORE
   the dossier exists, and coupling it to the package builder would mean it
   could not be produced until every supplier had submitted. */

import { displayDate } from "./boundary";
import {
  QUALITY_ASSURANCE_LABEL,
  MMD_SECTION_TITLE,
  type MmdContent,
  type MmdVersion,
  type MmdChange,
} from "./mmd";

const MARGIN = 48;
const INK: [number, number, number] = [17, 17, 17];
const MUTED: [number, number, number] = [120, 118, 112];
const WARN: [number, number, number] = [180, 83, 9];

/** jsPDF's core fonts are Latin-1 only; anything outside it renders as junk. */
function pdfSafe(text: string): string {
  const fallback: Record<string, string> = {
    "₂": "2",
    "₃": "3",
    "—": "-",
    "–": "-",
    "·": "-",
    "→": "->",
    "≥": ">=",
    "≤": "<=",
    Δ: "delta",
    "²": "2",
    "³": "3",
  };
  let out = "";
  for (const ch of text) {
    if (fallback[ch]) {
      out += fallback[ch];
      continue;
    }
    const cp = ch.codePointAt(0)!;
    out +=
      cp === 0x0a || (cp >= 0x20 && cp <= 0x7e) || (cp >= 0xa0 && cp <= 0xff)
        ? ch
        : "?";
  }
  return out;
}

export type MmdPdfInput = {
  content: MmdContent;
  declarationName: string;
  version: MmdVersion | null;
  /** change list against the previous version — the consistency test */
  changes: MmdChange[];
  previousVersionLabel: string | null;
  generatedFor: string;
};

export async function buildMmdPdf(input: MmdPdfInput) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const width = pageWidth - MARGIN * 2;
  let y = MARGIN;

  const space = (needed: number) => {
    if (y + needed > pageHeight - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const eyebrow = (text: string) => {
    space(20);
    doc
      .setFont("courier", "normal")
      .setFontSize(8.5)
      .setTextColor(...MUTED);
    doc.text(pdfSafe(text).toUpperCase(), MARGIN, y);
    y += 16;
  };

  const heading = (text: string, size = 15) => {
    space(size + 14);
    doc
      .setFont("helvetica", "normal")
      .setFontSize(size)
      .setTextColor(...INK);
    doc.text(pdfSafe(text), MARGIN, y);
    y += size + 8;
  };

  const body = (text: string, color = MUTED) => {
    if (!text.trim()) return;
    doc
      .setFont("helvetica", "normal")
      .setFontSize(9.5)
      .setTextColor(...color);
    for (const line of doc.splitTextToSize(pdfSafe(text), width)) {
      space(14);
      doc.text(line, MARGIN, y);
      y += 13;
    }
    y += 6;
  };

  const rule = () => {
    space(14);
    doc.setDrawColor(220, 218, 212).setLineWidth(0.5);
    doc.line(MARGIN, y, pageWidth - MARGIN, y);
    y += 14;
  };

  const table = (head: string[], rows: string[][]) => {
    if (rows.length === 0) {
      body("Nothing recorded.", MUTED);
      return;
    }
    autoTable(doc, {
      startY: y,
      head: [head.map(pdfSafe)],
      body: rows.map((r) => r.map((c) => pdfSafe(c || "—"))),
      margin: { left: MARGIN, right: MARGIN },
      styles: {
        font: "helvetica",
        fontSize: 8.5,
        cellPadding: 5,
        textColor: MUTED,
      },
      headStyles: {
        fillColor: [245, 244, 240],
        textColor: INK,
        fontStyle: "normal",
      },
      theme: "grid",
    });
    y =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 18;
  };

  const c = input.content;

  /* ── Cover ── */
  eyebrow("Monitoring Methodology Documentation");
  doc
    .setFont("helvetica", "normal")
    .setFontSize(26)
    .setTextColor(...INK);
  doc.text(
    pdfSafe(c.identity.installationName || "Installation"),
    MARGIN,
    y + 10,
  );
  y += 46;
  body(`${input.declarationName} · reporting period ${c.period.display}`);
  body(
    input.version
      ? `Version ${input.version.n} · finalised ${displayDate(new Date(input.version.finalisedAt).toISOString())} · ${input.version.author}`
      : "Draft — not yet finalised",
  );
  body(
    "This document describes how the emissions data in the accompanying dossier was monitored: the boundary it covers, the parameters measured, the instruments and factors used, and what was done where primary data was missing. It is intended to be read before any figure is tested.",
  );
  rule();

  /* ── Change list, when there is a prior version ── */
  if (input.previousVersionLabel) {
    heading("Changes since " + input.previousVersionLabel, 13);
    body(
      "Consistency of method year over year is tested explicitly. Everything that changed since the previous version is listed here so it can be reviewed on its own rather than found by re-reading the document.",
    );
    table(
      ["Section", "Field", "Before", "After"],
      input.changes.map((ch) => [
        MMD_SECTION_TITLE[ch.section],
        ch.field,
        truncate(ch.before),
        truncate(ch.after),
      ]),
    );
    if (input.changes.length === 0)
      body(
        "No changes — the methodology is unchanged from the previous version.",
      );
    rule();
  }

  /* ── 1 Identity ── */
  heading(MMD_SECTION_TITLE.identity, 13);
  table(
    ["Field", "Value"],
    [
      ["Installation", c.identity.installationName],
      ["Operator", c.identity.operator],
      ["Country", c.identity.country],
      ["Address", c.identity.address],
      ["UN/LOCODE", c.identity.unlocode],
      ["Coordinates", c.identity.coordinates],
    ],
  );

  /* ── 2 Boundary ── */
  heading(MMD_SECTION_TITLE.boundary, 13);
  body(c.boundary.description || "No boundary description recorded.");
  table(
    ["Process step", "Status"],
    [
      ...c.boundary.included.map((s) => [s, "Included"]),
      ...c.boundary.excluded.map((s) => [s, "Excluded"]),
      ...c.boundary.undecided.map((s) => [s, "NOT ANSWERED"]),
    ],
  );
  if (c.boundary.undecided.length > 0) {
    body(
      `${c.boundary.undecided.length} step(s) are neither included nor excluded. An open boundary cannot satisfy the completeness assertion.`,
      WARN,
    );
  }

  /* ── 3 Period ── */
  heading(MMD_SECTION_TITLE.period, 13);
  body(
    `${c.period.display} (${c.period.type === "calendar_year" ? "calendar year" : "fiscal year"})`,
  );

  /* ── 4 Parameters ── */
  heading(MMD_SECTION_TITLE.parameters, 13);
  table(
    ["Parameter", "Unit", "Source"],
    c.parameters.map((p) => [p.name, p.unit, p.source]),
  );

  /* ── 5 Measurement ── */
  heading(MMD_SECTION_TITLE.measurement, 13);
  table(
    ["Parameter", "Instrument", "Frequency", "Last calibration", "Source"],
    c.measurement.map((m) => [
      m.parameter,
      m.instrument,
      m.frequency,
      m.calibrationDate ? displayDate(m.calibrationDate) : "",
      m.source,
    ]),
  );

  /* ── 6 Factors ── */
  heading(MMD_SECTION_TITLE.factors, 13);
  table(
    ["Factor", "Value", "Unit", "Source"],
    c.factors.map((f) => [
      f.parameter + (f.isAssumption ? "  [ASSUMPTION]" : ""),
      f.value,
      f.unit,
      f.source,
    ]),
  );

  /* ── 7 Gaps ── */
  heading(MMD_SECTION_TITLE.gaps, 13);
  body(
    "Where primary data was unavailable, the parameter, the window, the estimation method and the reason the estimate cannot be favourable to the operator are recorded below.",
  );
  table(
    ["Parameter", "Window", "Reason", "Method", "Conservativeness", "tCO2e"],
    c.gaps.map((g) => [
      g.parameter,
      g.window,
      g.reason,
      g.method,
      g.justification,
      String(g.estimatedTCO2e),
    ]),
  );

  /* ── 8 QA ── */
  heading(MMD_SECTION_TITLE.qa, 13);
  body(QUALITY_ASSURANCE_LABEL[c.qa.method]);
  body(c.qa.note);

  /* ── 9 Assumptions ── */
  heading(MMD_SECTION_TITLE.assumptions, 13);
  body(
    "Every input recorded as an assumption rather than as measured or sourced data.",
  );
  table(
    ["Input", "Reference", "Entered by"],
    c.assumptions.map((a) => [a.input, a.reference, a.enteredBy]),
  );
  if (c.assumptions.length === 0)
    body("No inputs are declared as assumptions.");

  /* ── 10 Diagram ── */
  heading(MMD_SECTION_TITLE.diagram, 13);
  body(
    c.diagram.fileId
      ? `Attached: ${c.diagram.fileName ?? c.diagram.fileId}`
      : "No installation diagram attached.",
  );

  /* ── Footer on every page ── */
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc
      .setFont("courier", "normal")
      .setFontSize(7.5)
      .setTextColor(...MUTED);
    doc.text(
      pdfSafe(
        `${c.identity.installationName || "Installation"} · MMD · ${input.generatedFor}`,
      ),
      MARGIN,
      pageHeight - 24,
    );
    doc.text(`${i} / ${pages}`, pageWidth - MARGIN, pageHeight - 24, {
      align: "right",
    });
  }

  return doc;
}

const truncate = (s: string, n = 60) =>
  s.length > n ? `${s.slice(0, n - 1)}…` : s;

export async function downloadMmdPdf(input: MmdPdfInput, filename: string) {
  const doc = await buildMmdPdf(input);
  doc.save(filename);
}
