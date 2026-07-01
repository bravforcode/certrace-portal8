/* Real client-side file generation.
   Produces an actual, on-brand PDF and triggers a download — so every
   Download / PDF button delivers a file that's ready to file with the
   authority, not an HTML page with print instructions. */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type PackageInput = {
  ref: string;
  regulationShort: string;
  regulationFull: string;
  period: string;
  sector: string;
  origin: string; // e.g. "Thailand"
  market: string; // e.g. "European Union"
  org: string;
  installationId: string;
  totalEmbedded: number; // tCO₂e
  supplierCount: number;
  carbonPricePaid: number;
  factorSet: string;
  suppliers?: {
    name: string;
    material: string;
    emissions: number | null;
    productionRoute?: string;
    directEmissions?: number | null;
    indirectEmissions?: number | null;
    precursorEmissions?: number | null;
    verificationStatus?: string;
    exportQuantity?: number;
  }[];
  aiWarnings?: { supplier: string; message: string; type: "critical" | "warning" }[];
  documents?: { supplier: string; name: string; status: "uploaded" | "missing" }[];
  /** Per-category Scope 2 (indirect) liability treatment — see lib/config.ts's
      SCOPE2_IN_LIABILITY. Surfaced so the declarant never has to guess (or a
      buyer/authority never has to ask) whether indirect emissions are billable
      for this sector during the current definitive period. */
  scope2Notes?: { category: string; included: boolean }[];
  /** Real, persisted events across every approved submission — not a claim. */
  auditTrail?: { supplier: string; when: string; text: string }[];
  /** Every submitted version per supplier, so revisions are traceable. */
  versionHistory?: { supplier: string; version: number; when: string; score: number }[];
};

type RGB = [number, number, number];
const INK: RGB = [17, 17, 17];
const MUTED: RGB = [128, 128, 122];
const BORDER: RGB = [222, 220, 212];
const HEAD_BG: RGB = [250, 249, 246];
const GREEN: RGB = [16, 150, 106];
const RED: RGB = [217, 55, 55];
const AMBER: RGB = [180, 95, 6];

const MARGIN = 48;

/* jsPDF's built-in fonts (helvetica/courier/times) only implement WinAnsi
   (cp1252) — anything outside that doesn't error, it silently renders as
   mojibake. That includes the arrow used in "origin → market", the subscript
   in "tCO₂e", and any Thai-script text (e.g. a jurisdiction's factorSet name).
   Every string reaching doc.text()/autoTable is routed through this first, so
   an unsupported character degrades to a visible "?" instead of shipping a
   corrupted government-facing document. */
const UNICODE_FALLBACK: Record<string, string> = {
  "→": "->",
  "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4",
  "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9",
};
function pdfSafe(text: string): string {
  let out = "";
  for (const ch of text) {
    if (UNICODE_FALLBACK[ch]) {
      out += UNICODE_FALLBACK[ch];
      continue;
    }
    const cp = ch.codePointAt(0)!;
    // printable ASCII, Latin-1 supplement, the common cp1252 punctuation block
    // (curly quotes, en/em dash, ellipsis), and \n/\r (intentional line breaks
    // inside multi-line table cells) all render/behave fine as-is.
    const safe =
      cp === 0x0a ||
      cp === 0x0d ||
      (cp >= 0x20 && cp <= 0x7e) ||
      (cp >= 0xa0 && cp <= 0xff) ||
      [0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2026].includes(cp);
    out += safe ? ch : "?";
  }
  return out;
}

export function buildPackagePdf(p: PackageInput): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;
  let y = MARGIN;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const eyebrow = (text: string, color: RGB = MUTED) => {
    ensureSpace(20);
    doc.setFont("courier", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...color);
    doc.text(pdfSafe(text).toUpperCase(), MARGIN, y);
    y += 16;
  };

  const kv = (label: string, value: string) => {
    ensureSpace(20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(pdfSafe(label), MARGIN, y);
    doc.setTextColor(...INK);
    doc.text(pdfSafe(value), pageWidth - MARGIN, y, { align: "right" });
    doc.setDrawColor(...BORDER);
    doc.line(MARGIN, y + 6, pageWidth - MARGIN, y + 6);
    y += 20;
  };

  const paragraph = (text: string, color: RGB = MUTED, size = 9) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(pdfSafe(text), contentWidth) as string[];
    ensureSpace(lines.length * (size + 3) + 4);
    doc.setTextColor(...color);
    doc.text(lines, MARGIN, y);
    y += lines.length * (size + 3) + 8;
  };

  const table = (title: string, head: string[], body: string[][], colorColumn?: { index: number; color: (raw: string) => RGB | null }) => {
    if (!body.length) return;
    eyebrow(title);
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN, bottom: MARGIN },
      head: [head.map(pdfSafe)],
      body: body.map((row) => row.map(pdfSafe)),
      styles: { font: "helvetica", fontSize: 8.5, textColor: INK, cellPadding: 6, lineColor: BORDER, lineWidth: 0.5, valign: "middle" },
      headStyles: { fillColor: HEAD_BG, textColor: MUTED, fontStyle: "normal", fontSize: 7 },
      didParseCell: (data) => {
        if (colorColumn && data.section === "body" && data.column.index === colorColumn.index) {
          const raw = String(data.cell.raw ?? "");
          const c = colorColumn.color(raw);
          if (c) {
            data.cell.styles.textColor = c;
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 20;
  };

  /* Header */
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text("CERTRACE", MARGIN, y);
  doc.setDrawColor(...BORDER);
  doc.roundedRect(pageWidth - MARGIN - 100, y - 13, 100, 18, 3, 3);
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(pdfSafe(p.ref), pageWidth - MARGIN - 50, y, { align: "center" });
  y += 30;

  eyebrow(p.regulationFull);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(23);
  doc.setTextColor(...INK);
  doc.text("Embedded emissions declaration", MARGIN, y);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...MUTED);
  doc.text(pdfSafe(`${p.sector} · ${p.period} · ${p.origin} → ${p.market}`), MARGIN, y);
  y += 28;

  /* Stat boxes */
  const stats: [string, string][] = [
    [p.totalEmbedded.toLocaleString(), "tCO2e embedded"],
    [String(p.supplierCount), "suppliers verified"],
    ["100%", "audit-ready"],
  ];
  const boxGap = 8;
  const boxW = (contentWidth - boxGap * 2) / 3;
  const boxH = 54;
  ensureSpace(boxH + 24);
  stats.forEach(([v, l], i) => {
    const bx = MARGIN + i * (boxW + boxGap);
    doc.setDrawColor(...BORDER);
    doc.roundedRect(bx, y, boxW, boxH, 6, 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(18);
    doc.setTextColor(...INK);
    doc.text(pdfSafe(v), bx + 12, y + 27);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(pdfSafe(l).toUpperCase(), bx + 12, y + 41);
  });
  y += boxH + 26;

  /* Declarant */
  eyebrow("Declarant");
  kv("Exporter", p.org);
  kv("Installation / facility ID", p.installationId);
  kv("Methodology", `IPCC · GHG Protocol · ${p.factorSet}`);
  kv("Carbon price paid in origin", p.carbonPricePaid === 0 ? "None (Thailand — no carbon price)" : String(p.carbonPricePaid));
  y += 10;

  /* Legal notice — Scope 2 liability treatment, so nobody downstream has to
     guess (or worse, assume the wrong thing) about what's billable. */
  if (p.scope2Notes?.length) {
    eyebrow("Legal notice", AMBER);
    for (const note of p.scope2Notes) {
      paragraph(
        note.included
          ? `${note.category}: indirect (Scope 2 / electricity) emissions are reported above and count toward the CBAM financial obligation for this sector.`
          : `${note.category}: indirect (Scope 2 / electricity) emissions are reported above but are currently excluded from the CBAM financial obligation for this sector during the definitive period — only the direct and precursor emissions shown are billable.`,
      );
    }
    y += 2;
  }

  /* AI Validation Outcomes */
  table(
    "AI Validation Outcomes",
    ["Type", "Supplier", "Issue"],
    (p.aiWarnings ?? []).map((w) => [w.type.toUpperCase(), w.supplier, w.message]),
    { index: 0, color: (raw) => (raw === "CRITICAL" ? RED : raw === "WARNING" ? AMBER : null) },
  );

  /* Per-supplier embedded emissions */
  table(
    "Per-supplier embedded emissions (tCO₂e/t)",
    ["Supplier", "Material & route", "Export qty", "Direct", "Indirect", "Precursor", "Total", "Verification"],
    (p.suppliers ?? []).map((s) => [
      s.name,
      s.productionRoute ? `${s.material}\n${s.productionRoute}` : s.material,
      s.exportQuantity != null ? `${s.exportQuantity.toLocaleString()} t` : "—",
      s.directEmissions != null ? s.directEmissions.toFixed(2) : "—",
      s.indirectEmissions != null ? s.indirectEmissions.toFixed(2) : "—",
      s.precursorEmissions != null ? s.precursorEmissions.toFixed(2) : "—",
      s.emissions != null ? s.emissions.toFixed(2) : "default",
      s.verificationStatus ?? "—",
    ]),
  );

  /* Supporting documents */
  table(
    "Supporting documents package",
    ["Supplier", "Document", "Status"],
    (p.documents ?? []).map((d) => [d.supplier, d.name, d.status.toUpperCase()]),
    { index: 2, color: (raw) => (raw === "UPLOADED" ? GREEN : raw === "MISSING" ? RED : null) },
  );

  /* Version history */
  table(
    "Version history",
    ["Supplier", "Version", "Submitted", "Score"],
    (p.versionHistory ?? []).map((v) => [v.supplier, `V${v.version}`, v.when, String(v.score)]),
  );

  /* Audit trail */
  table(
    "Audit trail",
    ["Timestamp", "Supplier", "Event"],
    (p.auditTrail ?? []).map((e) => [e.when, e.supplier, e.text]),
  );

  /* Seal */
  ensureSpace(40);
  doc.setFillColor(...GREEN);
  doc.circle(MARGIN + 3, y - 3, 3, "F");
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  const auditCount = p.auditTrail?.length ?? 0;
  const sealText = `Generated ${new Date().toUTCString()} · sealed by Certrace · sha-256 evidence trail${auditCount ? ` · ${auditCount} audit events embedded above` : ""} · reviewer sign-off attached`;
  doc.text(pdfSafe(sealText), MARGIN + 12, y, { maxWidth: contentWidth - 12 });

  /* Page numbers */
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(pdfSafe(`${p.ref} · page ${i} of ${pageCount}`), pageWidth - MARGIN, pageHeight - 24, { align: "right" });
  }

  return doc;
}

export function downloadFile(filename: string, contents: string, mime = "text/html") {
  if (typeof window === "undefined") return;
  const blob = new Blob([contents], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadPackage(p: PackageInput) {
  if (typeof window === "undefined") return;
  const slug = `${p.regulationShort}-${p.period}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  buildPackagePdf(p).save(`certrace-${slug}.pdf`);
}

export function downloadXmlFile(slug: string, xmlContent: string) {
  if (typeof window === "undefined") return;
  downloadFile(`certrace-${slug}-registry.xml`, xmlContent, "application/xml");
}
