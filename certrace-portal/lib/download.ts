/* ════════════════════════════════════════════════════════════
   CBAM COMMUNICATION & VERIFICATION PACKAGE (PDF) + file download helpers

   Real client-side file generation. This builds the full package a buyer's
   CBAM declarant, a verifier actually works from — not a
   one-page summary. Structure:

     Cover                     identity, period, dataset hash, totals
     Contents                  with real page numbers (backfilled)
     Part A                    declaration summary + consolidated table
     Part B                    methodology & legal basis (definitive period)
     Part C                    one chapter PER SUPPLIER: installation data,
                               per-product emissions detail, carbon price,
                               verification, evidence register, findings,
                               version history
     Part D                    consolidated evidence register
     Part E                    findings & data quality
     Part F                    version history
     Part G                    internal approval & sign-off record
     Part H                    full verification trail
     Part I                    glossary & regulatory references
     Seal                      dataset hash + signature block

   With a typical 8-supplier declaration this renders 20–30+ pages — the
   size a real communication/verification package runs, because every number is
   traceable to its installation, method and evidence.
   ════════════════════════════════════════════════════════════ */

import type { jsPDF } from "jspdf";

/* ── Input types ───────────────────────────────────────────── */

export type ChapterProduct = {
  name: string;
  cnCode: string;
  hsCode?: string;
  category: string;
  group: string;
  route?: string;
  quantityTonnes: number;
  directPerTonne: number | null;
  indirectPerTonne: number | null;
  totalPerTonne: number | null;
  absoluteTCO2e: number | null;
  method?: string; // "actual" | "default"
  precursors?: string;
  precursorRoutes?: string;
  electricityConsumed?: string; // MWh/t
  electricityFactor?: string; // factor + documented source
  electrolysisTech?: string; // prebake | soderberg (primary aluminium only)
};

export type SupplierChapter = {
  name: string;
  ref: string;
  country: string;
  version: number;
  submittedAt: string | null;
  signedBy?: string | null;
  signedRole?: string | null;
  dataQualityScore?: number | null;
  installation: {
    name: string;
    address: string;
    country: string;
    unlocode?: string;
    coordinates?: string;
  };
  products: ChapterProduct[];
  carbonPrice: { amount: string; instrument?: string; note?: string };
  verification: string;
  documents: {
    label: string;
    required: boolean;
    status: "uploaded" | "missing";
    files: string[];
  }[];
  findings: {
    severity: "critical" | "warning";
    title: string;
    detail: string;
  }[];
  versions: {
    n: number;
    when: string;
    score: number;
    signedBy?: string | null;
  }[];
};

export type SignOffStep = {
  label: string;
  actor: string;
  title: string;
  status: string;
  when: string | null;
  comment?: string;
};

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
  /** EU buyer / declarant line, e.g. "Berlin Stahlhandel GmbH · EORI DE55…" */
  buyerLine?: string;
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
  aiWarnings?: {
    supplier: string;
    message: string;
    type: "critical" | "warning";
  }[];
  documents?: {
    supplier: string;
    name: string;
    status: "uploaded" | "missing";
  }[];
  scope2Notes?: { category: string; included: boolean }[];
  verificationTrail?: { supplier: string; when: string; text: string }[];
  versionHistory?: {
    supplier: string;
    version: number;
    when: string;
    score: number;
  }[];
  /** Full per-supplier chapters (Part C). When present the package renders the
      complete communication/verification document instead of summary tables only. */
  chapters?: SupplierChapter[];
  /** Internal approval chain record (Part G). */
  signOff?: SignOffStep[];
  /** sha-256 of the dataset JSON, computed by downloadPackage — printed on the
      cover and the seal page so any copy can be checked against the source. */
  contentHash?: string;
};

/* ── Palette (design system: ink on bone, colour = status only) ── */
type RGB = [number, number, number];
const INK: RGB = [17, 17, 17];
const MUTED: RGB = [128, 128, 122];
const BORDER: RGB = [222, 220, 212];
const HEAD_BG: RGB = [250, 249, 246];
const GREEN: RGB = [16, 150, 106];
const RED: RGB = [217, 55, 55];
const AMBER: RGB = [180, 95, 6];

const MARGIN = 48;

/* jsPDF's built-in fonts only implement WinAnsi (cp1252) — anything outside
   silently renders as mojibake. Every string reaching doc.text()/autoTable
   routes through this, so unsupported characters degrade to "?" instead of
   shipping corrupted glyphs in a government-facing document. */
const UNICODE_FALLBACK: Record<string, string> = {
  "→": "->",
  "≥": ">=",
  "≤": "<=",
  "·": "-",
  "₀": "0",
  "₁": "1",
  "₂": "2",
  "₃": "3",
  "₄": "4",
  "₅": "5",
  "₆": "6",
  "₇": "7",
  "₈": "8",
  "₉": "9",
};
function pdfSafe(text: string): string {
  let out = "";
  for (const ch of text) {
    if (UNICODE_FALLBACK[ch]) {
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
    out += safe ? ch : "?";
  }
  return out;
}

const fmtN = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 2 });

export async function buildPackagePdf(p: PackageInput): Promise<jsPDF> {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;
  let y = MARGIN;

  const toc: { label: string; page: number }[] = [];

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - MARGIN - 12) {
      doc.addPage();
      y = MARGIN + 10;
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

  /** Big part heading — always starts a fresh page and records a TOC entry. */
  const partHeading = (label: string, title: string, lead?: string) => {
    doc.addPage();
    y = MARGIN + 10;
    toc.push({ label: `${label} — ${title}`, page: doc.getNumberOfPages() });
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(pdfSafe(label).toUpperCase(), MARGIN, y);
    y += 20;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(19);
    doc.setTextColor(...INK);
    doc.text(pdfSafe(title), MARGIN, y);
    y += 14;
    doc.setDrawColor(...BORDER);
    doc.line(MARGIN, y, pageWidth - MARGIN, y);
    y += 18;
    if (lead) paragraph(lead);
  };

  const kv = (label: string, value: string) => {
    ensureSpace(20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...MUTED);
    doc.text(pdfSafe(label), MARGIN, y);
    doc.setTextColor(...INK);
    const lines = doc.splitTextToSize(
      pdfSafe(value),
      contentWidth * 0.55,
    ) as string[];
    doc.text(lines, pageWidth - MARGIN, y, { align: "right" });
    const rowH = Math.max(1, lines.length) * 12 + 8;
    doc.setDrawColor(...BORDER);
    doc.line(MARGIN, y + rowH - 12, pageWidth - MARGIN, y + rowH - 12);
    y += rowH;
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

  const bullet = (text: string, color: RGB = MUTED, size = 9) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(
      pdfSafe(text),
      contentWidth - 14,
    ) as string[];
    ensureSpace(lines.length * (size + 3) + 3);
    doc.setTextColor(...color);
    doc.circle(MARGIN + 3, y - 2.5, 1.1, "F");
    doc.text(lines, MARGIN + 14, y);
    y += lines.length * (size + 3) + 5;
  };

  const table = (
    title: string | null,
    head: string[],
    body: string[][],
    opts?: {
      colorColumn?: { index: number; color: (raw: string) => RGB | null };
      columnWidths?: Record<number, number>;
    },
  ) => {
    if (!body.length) return;
    if (title) eyebrow(title);
    autoTable(doc, {
      startY: y,
      margin: {
        left: MARGIN,
        right: MARGIN,
        bottom: MARGIN + 16,
        top: MARGIN + 10,
      },
      head: [head.map(pdfSafe)],
      body: body.map((row) => row.map(pdfSafe)),
      styles: {
        font: "helvetica",
        fontSize: 8,
        textColor: INK,
        cellPadding: 5,
        lineColor: BORDER,
        lineWidth: 0.5,
        valign: "middle",
      },
      headStyles: {
        fillColor: HEAD_BG,
        textColor: MUTED,
        fontStyle: "normal",
        fontSize: 6.8,
      },
      columnStyles: opts?.columnWidths
        ? Object.fromEntries(
            Object.entries(opts.columnWidths).map(([k, w]) => [
              k,
              { cellWidth: w },
            ]),
          )
        : undefined,
      didParseCell: (data) => {
        if (
          opts?.colorColumn &&
          data.section === "body" &&
          data.column.index === opts.colorColumn.index
        ) {
          const raw = String(data.cell.raw ?? "");
          const c = opts.colorColumn.color(raw);
          if (c) {
            data.cell.styles.textColor = c;
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 18;
  };

  /* ════════ COVER ════════ */
  doc.setFont("courier", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  doc.text("CERTRACE", MARGIN, MARGIN + 4);
  doc.setDrawColor(...BORDER);
  doc.roundedRect(pageWidth - MARGIN - 130, MARGIN - 9, 130, 18, 3, 3);
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(pdfSafe(p.ref), pageWidth - MARGIN - 65, MARGIN + 3, {
    align: "center",
  });

  y = 190;
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(pdfSafe(p.regulationFull).toUpperCase(), MARGIN, y);
  y += 30;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(28);
  doc.setTextColor(...INK);
  doc.text("CBAM Communication", MARGIN, y);
  y += 32;
  doc.text("& Verification Package", MARGIN, y);
  y += 30;
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  doc.text(
    pdfSafe(`${p.sector} · ${p.period} · ${p.origin} → ${p.market}`),
    MARGIN,
    y,
  );
  y += 44;

  const stats: [string, string][] = [
    [fmtN(p.totalEmbedded), "tCO2e embedded"],
    [String(p.supplierCount), "supplier submissions"],
    [
      String(
        doc
          ? (p.chapters?.reduce((a, c) => a + c.products.length, 0) ??
              p.suppliers?.length ??
              0)
          : 0,
      ),
      "goods reported",
    ],
  ];
  const boxGap = 8;
  const boxW = (contentWidth - boxGap * 2) / 3;
  const boxH = 58;
  stats.forEach(([v, l], i) => {
    const bx = MARGIN + i * (boxW + boxGap);
    doc.setDrawColor(...BORDER);
    doc.roundedRect(bx, y, boxW, boxH, 6, 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(19);
    doc.setTextColor(...INK);
    doc.text(pdfSafe(v), bx + 12, y + 28);
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(pdfSafe(l).toUpperCase(), bx + 12, y + 44);
  });
  y += boxH + 40;

  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(
    pdfSafe(`Communicating operator: ${p.org} · ${p.installationId}`),
    MARGIN,
    y,
  );
  y += 14;
  doc.text(pdfSafe(`Generated: ${new Date().toUTCString()}`), MARGIN, y);
  y += 14;
  if (p.contentHash) {
    doc.text(pdfSafe(`Dataset sha-256: ${p.contentHash}`), MARGIN, y, {
      maxWidth: contentWidth,
    });
    y += 14;
  }

  doc.setFontSize(7.5);
  doc.text(
    pdfSafe(
      "This package supports the buyer's CBAM declaration. It is communicated by the third-country operator; only the EU importer's Authorised CBAM Declarant files with the CBAM Registry.",
    ),
    MARGIN,
    pageHeight - MARGIN - 24,
    { maxWidth: contentWidth },
  );

  /* ════════ CONTENTS (reserved — backfilled after render) ════════ */
  doc.addPage();
  const tocPage = doc.getNumberOfPages();

  /* ════════ PART A — DECLARATION SUMMARY ════════ */
  partHeading("Part A", "Declaration summary");
  kv("Regulation", p.regulationFull);
  kv("Reporting period", p.period);
  kv("Goods sector", p.sector);
  kv("Route", `${p.origin} → ${p.market}`);
  kv("Communicating operator (exporter)", p.org);
  kv("Operator reference", p.installationId);
  if (p.buyerLine) kv("EU buyer / declarant", p.buyerLine);
  kv(
    "Monitoring methodology",
    `Annex IV, Reg. (EU) 2023/956 · Implementing Reg. (EU) 2025/2547 · ${p.factorSet}`,
  );
  kv(
    "Total embedded emissions (approved submissions)",
    `${fmtN(p.totalEmbedded)} tCO2e`,
  );
  kv(
    "Carbon price paid in country of origin",
    p.carbonPricePaid === 0
      ? "None (Thailand currently has no carbon price)"
      : fmtN(p.carbonPricePaid),
  );
  y += 8;

  table(
    "Consolidated per-supplier embedded emissions (tCO2e per tonne)",
    [
      "Supplier",
      "Material & route",
      "Export qty",
      "Direct",
      "Indirect",
      "Precursor",
      "Total",
      "Verification",
    ],
    (p.suppliers ?? []).map((s) => [
      s.name,
      s.productionRoute ? `${s.material}\n${s.productionRoute}` : s.material,
      s.exportQuantity != null ? `${fmtN(s.exportQuantity)} t` : "—",
      s.directEmissions != null ? s.directEmissions.toFixed(2) : "—",
      s.indirectEmissions != null ? s.indirectEmissions.toFixed(2) : "—",
      s.precursorEmissions != null ? s.precursorEmissions.toFixed(2) : "—",
      s.emissions != null ? s.emissions.toFixed(2) : "default",
      s.verificationStatus ?? "—",
    ]),
  );

  /* ════════ PART B — METHODOLOGY & LEGAL BASIS ════════ */
  partHeading(
    "Part B",
    "Methodology & legal basis",
    "How every figure in this package was determined, and the definitive-period rules it was checked against. A reviewer should be able to reproduce each number from this section plus the per-supplier chapters in Part C.",
  );

  eyebrow("Calculation methodology");
  bullet(
    "Specific embedded emissions (SEE) per good = own-process direct emissions + own-process indirect (electricity) emissions + embedded emissions of relevant precursors (complex goods), in tCO2e per tonne of net mass, monitored at installation level per Annex IV of Regulation (EU) 2023/956.",
  );
  bullet(
    "Complex goods additionally carry the attributed embedded emissions of their relevant precursor materials (e.g. pig iron, ferro-alloys, crude steel inputs).",
  );
  bullet(
    `Emission factors: ${p.factorSet}. Electricity factors follow the applicable grid or PPA factor with documented source.`,
  );
  bullet(
    "Quantities are normalised to tonnes of net mass; emissions figures to tCO2e per tonne (the CBAM canonical form).",
  );
  y += 6;

  if (p.scope2Notes?.length) {
    eyebrow("Scope 2 (indirect) liability treatment", AMBER);
    for (const note of p.scope2Notes) {
      bullet(
        note.included
          ? `${note.category}: indirect (electricity) emissions are reported AND count toward the CBAM financial obligation for this sector.`
          : `${note.category}: indirect (electricity) emissions are reported for transparency but are currently excluded from the CBAM financial obligation for this sector in the definitive period — only direct and precursor emissions are billable.`,
      );
    }
    y += 6;
  }

  eyebrow("Definitive-period rules applied");
  bullet(
    "Default values are permitted but carry a markup (+10% in 2026, +20% in 2027, +30% from 2028) — every default-value figure in this package is flagged in its supplier chapter.",
  );
  bullet(
    "Complex goods: default values may cover at most 20% of total embedded emissions; at least 80% must be actual, installation-level data.",
  );
  bullet(
    "Actual-value figures require verification by an EN ISO 14065-accredited verifier; verification statements are referenced per supplier in Part C and included in the evidence register.",
  );
  bullet(
    "A carbon price effectively paid in the country of origin is deductible from the CBAM obligation; the amount, instrument and country are recorded per supplier.",
  );
  bullet(
    "CBAM certificate prices track the EU ETS auction average (quarterly in 2026, weekly from 2027). Certificate purchase and surrender happen on the declarant's side.",
  );
  y += 6;

  eyebrow("Data lineage");
  paragraph(
    "Each supplier submission was collected through a Certrace Smart Link, passed the automated quality check (completeness, validation, anomaly, standardisation), was electronically signed by the supplier's authorised person, frozen as an immutable version, reviewed and approved by the exporter's internal chain (Part G), and only then locked into this package. The full event log is reproduced in Part H.",
  );

  /* ════════ PART C — PER-SUPPLIER CHAPTERS ════════ */
  const chapters = p.chapters ?? [];
  chapters.forEach((c, idx) => {
    partHeading(`Part C.${idx + 1}`, c.name);

    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    const metaBits = [
      `Ref ${c.ref}`,
      c.country,
      `Version ${c.version}`,
      c.submittedAt ? `Submitted ${c.submittedAt}` : null,
      c.signedBy
        ? `Signed by ${c.signedBy}${c.signedRole ? ` (${c.signedRole})` : ""}`
        : null,
      c.dataQualityScore != null
        ? `Data quality ${c.dataQualityScore}/100`
        : null,
    ].filter(Boolean) as string[];
    doc.text(pdfSafe(metaBits.join("  ·  ")), MARGIN, y, {
      maxWidth: contentWidth,
    });
    y += 20;

    eyebrow("Installation");
    kv("Installation name", c.installation.name || "—");
    kv("Address", c.installation.address || "—");
    kv("Country", c.installation.country || "—");
    if (c.installation.unlocode) kv("UN/LOCODE", c.installation.unlocode);
    kv("Coordinates (main emission source)", c.installation.coordinates || "—");
    y += 6;

    for (const prod of c.products) {
      eyebrow(`Good — ${prod.name}`);
      kv("CN code", prod.cnCode + (prod.hsCode ? `  (HS ${prod.hsCode})` : ""));
      kv("Aggregated goods category", `${prod.category} — ${prod.group}`);
      if (prod.route) kv("Production route", prod.route);
      kv("Quantity (net mass)", `${fmtN(prod.quantityTonnes)} t`);
      table(
        null,
        ["Component", "tCO2e / t", "Basis"],
        [
          [
            "Direct (Scope 1)",
            prod.directPerTonne != null ? prod.directPerTonne.toFixed(2) : "—",
            prod.method === "default" ? "DEFAULT VALUES" : "ACTUAL DATA",
          ],
          [
            "Indirect (electricity)",
            prod.indirectPerTonne != null
              ? prod.indirectPerTonne.toFixed(2)
              : "—",
            prod.method === "default" ? "DEFAULT VALUES" : "ACTUAL DATA",
          ],
          [
            "Total embedded (SEE)",
            prod.totalPerTonne != null ? prod.totalPerTonne.toFixed(2) : "—",
            "",
          ],
          [
            "Absolute for quantity",
            prod.absoluteTCO2e != null
              ? `${fmtN(prod.absoluteTCO2e)} tCO2e`
              : "—",
            "",
          ],
        ],
        {
          colorColumn: {
            index: 2,
            color: (raw) =>
              raw === "DEFAULT VALUES"
                ? AMBER
                : raw === "ACTUAL DATA"
                  ? GREEN
                  : null,
          },
        },
      );
      // Electricity data — justifies the indirect figure; required content for
      // aluminium goods, so it must appear in the communicated package.
      if (
        prod.electricityConsumed ||
        prod.electricityFactor ||
        prod.electrolysisTech
      ) {
        eyebrow("Electricity");
        if (prod.electricityConsumed)
          kv("Electricity consumed", `${prod.electricityConsumed} MWh/t`);
        if (prod.electricityFactor)
          kv("Emission factor & source", prod.electricityFactor);
        if (prod.electrolysisTech)
          kv(
            "Electrolysis technology",
            prod.electrolysisTech === "soderberg" ? "Soderberg" : "Prebake",
          );
      }
      if (prod.precursors) {
        eyebrow("Precursors");
        paragraph(prod.precursors, INK, 9);
        if (prod.precursorRoutes)
          paragraph(`Production routes: ${prod.precursorRoutes}`);
      }
    }

    eyebrow("Carbon price in country of origin");
    kv(
      "Amount",
      !c.carbonPrice.amount ||
        c.carbonPrice.amount === "0" ||
        c.carbonPrice.amount.startsWith("0 ")
        ? "0 (no carbon price paid)"
        : c.carbonPrice.amount,
    );
    if (c.carbonPrice.instrument) kv("Instrument", c.carbonPrice.instrument);
    y += 4;

    eyebrow("Verification");
    paragraph(
      c.verification || "No verification statement provided.",
      c.verification ? INK : AMBER,
      9,
    );

    table(
      "Evidence register",
      ["Document", "Required", "Status", "Files"],
      c.documents.map((d) => [
        d.label,
        d.required ? "Required" : "Optional",
        d.status.toUpperCase(),
        d.files.join(", ") || "—",
      ]),
      {
        colorColumn: {
          index: 2,
          color: (raw) =>
            raw === "UPLOADED" ? GREEN : raw === "MISSING" ? RED : null,
        },
      },
    );

    if (c.findings.length) {
      eyebrow("Open findings at approval");
      for (const f of c.findings) {
        bullet(
          `[${f.severity.toUpperCase()}] ${f.title} — ${f.detail}`,
          f.severity === "critical" ? RED : AMBER,
          8.5,
        );
      }
      y += 4;
    }

    table(
      "Version history",
      ["Version", "Submitted", "Quality score", "Signed by"],
      c.versions.map((v) => [
        `V${v.n}`,
        v.when,
        String(v.score),
        v.signedBy ?? "—",
      ]),
    );
  });

  /* ════════ PART D — CONSOLIDATED EVIDENCE REGISTER ════════ */
  partHeading(
    "Part D",
    "Consolidated evidence register",
    "Every supporting document across all submissions, with upload status at the time this package was sealed.",
  );
  table(
    null,
    ["Supplier", "Document", "Status"],
    (p.documents ?? []).map((d) => [
      d.supplier,
      d.name,
      d.status.toUpperCase(),
    ]),
    {
      colorColumn: {
        index: 2,
        color: (raw) =>
          raw === "UPLOADED" ? GREEN : raw === "MISSING" ? RED : null,
      },
    },
  );

  /* ════════ PART E — FINDINGS & DATA QUALITY ════════ */
  partHeading(
    "Part E",
    "Findings & data quality",
    "Automated quality-check outcomes that remained open when each submission was approved. Critical findings block a supplier's submission; warnings pass through with acknowledgement and are disclosed here.",
  );
  table(
    null,
    ["Severity", "Supplier", "Finding"],
    (p.aiWarnings ?? []).map((w) => [
      w.type.toUpperCase(),
      w.supplier,
      w.message,
    ]),
    {
      colorColumn: {
        index: 0,
        color: (raw) =>
          raw === "CRITICAL" ? RED : raw === "WARNING" ? AMBER : null,
      },
    },
  );
  if (!(p.aiWarnings ?? []).length)
    paragraph(
      "No findings were open at approval — every submission passed the automated checks cleanly.",
      GREEN,
    );

  /* ════════ PART F — VERSION HISTORY ════════ */
  partHeading(
    "Part F",
    "Version history",
    "Every submitted version of every supplier's data. A revision requested by the exporter reopens only the flagged fields; the resubmission is a new version — earlier versions are never overwritten.",
  );
  table(
    null,
    ["Supplier", "Version", "Submitted", "Quality score"],
    (p.versionHistory ?? []).map((v) => [
      v.supplier,
      `V${v.version}`,
      v.when,
      String(v.score),
    ]),
  );

  /* ════════ PART G — APPROVAL & SIGN-OFF RECORD ════════ */
  partHeading(
    "Part G",
    "Internal approval & sign-off record",
    "The exporter's internal review chain for this declaration. Each step is electronically recorded against the exact dataset version being approved.",
  );
  if (p.signOff?.length) {
    table(
      null,
      ["Step", "Actor", "Role", "Outcome", "Date"],
      p.signOff.map((s) => [
        s.label,
        s.actor,
        s.title,
        s.status.replace("_", " ").toUpperCase(),
        s.when ?? "—",
      ]),
      {
        colorColumn: {
          index: 3,
          color: (raw) =>
            raw === "APPROVED"
              ? GREEN
              : raw === "CHANGES REQUESTED"
                ? RED
                : null,
        },
      },
    );
    const commented = p.signOff.filter((s) => s.comment);
    if (commented.length) {
      eyebrow("Step comments");
      for (const s of commented)
        bullet(`${s.actor} (${s.label}): "${s.comment}"`, INK, 8.5);
    }
  } else {
    paragraph(
      "No internal sign-off chain was recorded for this declaration. For regulated filings, Certrace recommends at minimum a preparer + approver chain (see the Review & Approval product report).",
      AMBER,
    );
  }

  /* ════════ PART H — VERIFICATION TRAIL ════════ */
  partHeading(
    "Part H",
    "Verification trail",
    "The complete, append-only event log across every submission in this declaration — collection, quality checks, signatures, revisions, approvals. Timestamps are UTC.",
  );
  table(
    null,
    ["Timestamp", "Supplier", "Event"],
    (p.verificationTrail ?? []).map((e) => [e.when, e.supplier, e.text]),
    { columnWidths: { 0: 130, 1: 100 } },
  );

  /* ════════ PART I — GLOSSARY & REFERENCES ════════ */
  partHeading("Part I", "Glossary & regulatory references");
  eyebrow("Glossary");
  const glossary: [string, string][] = [
    [
      "CBAM",
      "Carbon Border Adjustment Mechanism — the EU's carbon price on embedded emissions of imported goods.",
    ],
    [
      "SEE",
      "Specific embedded emissions — tCO2e per tonne of net mass of a good (direct + indirect, plus attributed precursor emissions for complex goods).",
    ],
    [
      "Direct emissions",
      "Scope 1 emissions from the production processes of the installation, including heating/cooling consumed.",
    ],
    [
      "Indirect emissions",
      "Emissions from the production of electricity consumed during production.",
    ],
    [
      "Precursor",
      "An input material that is itself a CBAM good, whose embedded emissions carry into the finished (complex) good.",
    ],
    [
      "Complex good",
      "A good produced using relevant precursor materials — its SEE must include the precursors' attributed emissions.",
    ],
    [
      "Default value",
      "Commission-published fallback emission intensity, marked up year-on-year; capped at 20% of embedded emissions for complex goods.",
    ],
    [
      "CN code",
      "8-digit Combined Nomenclature commodity code identifying the good.",
    ],
    [
      "Authorised CBAM Declarant",
      "The EU importer (or indirect customs representative) authorised to file CBAM declarations and surrender certificates.",
    ],
    [
      "O3CI",
      "The CBAM Registry module for Operators of Third-Country Installations — where a non-EU producer registers installations and shares emissions data with declarants.",
    ],
    [
      "Communication template",
      "The Commission's Annex IV-aligned format for transmitting embedded-emissions data from operator to declarant.",
    ],
  ];
  for (const [term, def] of glossary) bullet(`${term} — ${def}`, MUTED, 8.5);
  y += 6;
  eyebrow("Regulatory references");
  bullet(
    "Regulation (EU) 2023/956 establishing a carbon border adjustment mechanism (the CBAM Regulation), incl. Annex IV monitoring rules.",
  );
  bullet(
    "Implementing Regulation (EU) 2025/2547 — the methodology for calculating embedded emissions under the definitive regime, in force from 1 January 2026.",
  );
  bullet(
    "Implementing Regulation (EU) 2025/2546 — verification principles, which set what an accredited verifier tests.",
  );
  bullet(
    "Implementing Regulation (EU) 2025/2621 — the default values usable per product and country where actual data cannot be obtained.",
  );
  bullet(
    "CBAM Registry — Authorisation Management Module and the Operators of Third-Country Installations (O3CI) portal.",
  );
  bullet(
    "EU ETS auction prices (the reference for CBAM certificate pricing from 2026/2027).",
  );

  /* ════════ SEAL ════════ */
  doc.addPage();
  toc.push({ label: "Seal & signatures", page: doc.getNumberOfPages() });
  y = MARGIN + 30;
  doc.setFillColor(...GREEN);
  doc.circle(MARGIN + 3, y - 3, 3, "F");
  doc.setFont("courier", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  const verificationEventCount = p.verificationTrail?.length ?? 0;
  doc.text(
    pdfSafe(
      `Sealed by Certrace · ${new Date().toUTCString()}${verificationEventCount ? ` · ${verificationEventCount} verification events embedded in Part H` : ""}`,
    ),
    MARGIN + 12,
    y,
    { maxWidth: contentWidth - 12 },
  );
  y += 22;
  if (p.contentHash) {
    doc.text(pdfSafe(`Dataset sha-256: ${p.contentHash}`), MARGIN, y, {
      maxWidth: contentWidth,
    });
    y += 18;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    pdfSafe(
      "Any copy of this package can be checked against the hash above. Regenerating the package from the same sealed dataset reproduces the same figures.",
    ),
    MARGIN,
    y,
    { maxWidth: contentWidth },
  );
  y += 50;
  for (const who of [
    "Prepared by (exporter)",
    "Approved by (management sign-off)",
    "Received by (declarant / buyer)",
  ]) {
    doc.setDrawColor(...BORDER);
    doc.line(MARGIN, y, MARGIN + 220, y);
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(pdfSafe(who).toUpperCase(), MARGIN, y + 12);
    y += 52;
  }

  /* ════════ BACKFILL CONTENTS ════════ */
  doc.setPage(tocPage);
  let ty = MARGIN + 10;
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("CONTENTS", MARGIN, ty);
  ty += 26;
  doc.setFont("helvetica", "normal");
  for (const entry of toc) {
    doc.setFontSize(9.5);
    doc.setTextColor(...INK);
    doc.text(pdfSafe(entry.label), MARGIN, ty, { maxWidth: contentWidth - 60 });
    doc.setTextColor(...MUTED);
    doc.text(String(entry.page), pageWidth - MARGIN, ty, { align: "right" });
    doc.setDrawColor(...BORDER);
    doc.line(MARGIN, ty + 5, pageWidth - MARGIN, ty + 5);
    ty += 20;
    if (ty > pageHeight - MARGIN) break; // single TOC page — plenty for ~20 parts
  }

  /* ════════ RUNNING HEADERS + PAGE NUMBERS ════════ */
  const pageCount = doc.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("courier", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(pdfSafe(`CERTRACE · ${p.ref}`), MARGIN, 26);
    doc.text(
      "CONFIDENTIAL — REGULATORY SUBMISSION SUPPORT",
      pageWidth - MARGIN,
      26,
      { align: "right" },
    );
    doc.setDrawColor(...BORDER);
    doc.line(MARGIN, 32, pageWidth - MARGIN, 32);
    doc.setFontSize(7.5);
    doc.text(
      pdfSafe(`${p.ref} · page ${i} of ${pageCount}`),
      pageWidth - MARGIN,
      pageHeight - 22,
      { align: "right" },
    );
  }

  return doc;
}

/* ── Download helpers ──────────────────────────────────────── */

export function downloadFile(
  filename: string,
  contents: string,
  mime = "text/html",
) {
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

/** sha-256 of the dataset JSON — printed on the cover + seal page so any copy
    of the package can be checked against the source dataset. */
async function datasetHash(p: PackageInput): Promise<string | undefined> {
  try {
    if (typeof crypto === "undefined" || !crypto.subtle) return undefined;
    const data = new TextEncoder().encode(JSON.stringify(p));
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return undefined;
  }
}

export async function downloadPackage(p: PackageInput) {
  if (typeof window === "undefined") return;
  const contentHash = p.contentHash ?? (await datasetHash(p));
  const slug = `${p.regulationShort}-${p.period}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const doc = await buildPackagePdf({ ...p, contentHash });
  doc.save(`certrace-${slug}.pdf`);
}

export function downloadXmlFile(slug: string, xmlContent: string) {
  if (typeof window === "undefined") return;
  downloadFile(`certrace-${slug}-registry.xml`, xmlContent, "application/xml");
}
