/* ════════════════════════════════════════════════════════════
   CBAM DRAFT CALCULATION / REPORT PREVIEW (PDF) + file download helpers

   Real client-side file generation. This builds the full package a buyer's
   CBAM declarant, a verifier or an auditor actually works from — not a
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
     Part H                    local activity history
     Part I                    glossary & regulatory references
     Limitations               local checksum + explicit blockers

   With a typical 8-supplier declaration this renders 20–30+ pages — the
   This renderer does not establish legal validity, evidence custody, identity,
   immutable retention, verification or delivery.
   ════════════════════════════════════════════════════════════ */

import type { jsPDF } from "jspdf";
import { decimal } from "./mrv";
import type { CalculationTrace } from "./mrv";
import { formatDecimal } from "./workflow-measurements";

/* ── Input types ───────────────────────────────────────────── */

export type ChapterProduct = {
  name: string;
  cnCode: string;
  hsCode?: string;
  category: string;
  group: string;
  route?: string;
  installationReference?: string;
  productionActivityTonnes?: string;
  mrvMethod?: string;
  monitoringPlanId?: string;
  monitoringPlanVersion?: string;
  systemBoundary?: string;
  excludedActivities?: string;
  dataGapMethodology?: string;
  controlActivities?: string;
  quantityTonnes: string;
  directPerTonne: string | null;
  indirectPerTonne: string | null;
  totalPerTonne: string | null;
  absoluteTCO2e: string | null;
  calculationTraces: readonly CalculationTrace[];
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
  actorRole?: "producer" | "trader";
  upstreamProducer?: string;
  installation: { name: string; address: string; country: string; unlocode?: string; coordinates?: string; productionActivity?: string };
  additionalInstallations: { id: string; name: string; country: string; address: string; routes: string[]; productionActivity?: string }[];
  monitoringPlans: { id: string; version: string; installationReference?: string }[];
  products: ChapterProduct[];
  carbonPrice: { amount: string; instrument?: string; note?: string };
  verification: string;
  documents: { label: string; required: boolean; status: "referenced" | "missing"; files: string[] }[];
  findings: { severity: "critical" | "warning"; title: string; detail: string }[];
  versions: { n: number; when: string; score: number; signedBy?: string | null }[];
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
  collectionDeadline?: string;
  cbamDeclarationDue?: string;
  sector: string;
  origin: string; // e.g. "Thailand"
  market: string; // e.g. "European Union"
  org: string;
  installationId: string;
  /** EU buyer / declarant line, e.g. "Berlin Stahlhandel GmbH · EORI DE55…" */
  buyerLine?: string;
  totalEmbedded: string; // exact TCO2E decimal string
  supplierCount: number;
  carbonPricePaid: string;
  factorSet: string;
  suppliers?: {
    name: string;
    material: string;
    emissions: string | null;
    productionRoute?: string;
    directEmissions?: string | null;
    indirectEmissions?: string | null;
    precursorEmissions?: string | null;
    verificationStatus?: string;
    exportQuantity?: string;
  }[];
  aiWarnings?: { supplier: string; message: string; type: "critical" | "warning" }[];
  documents?: { supplier: string; name: string; status: "referenced" | "missing" }[];
  scope2Notes?: { category: string; included: boolean }[];
  auditTrail?: { supplier: string; when: string; text: string }[];
  versionHistory?: { supplier: string; version: number; when: string; score: number }[];
  /** Full per-supplier chapters (Part C). When present the package renders the
      complete communication/audit document instead of summary tables only. */
  chapters?: SupplierChapter[];
  /** Internal approval chain record (Part G). */
  signOff?: SignOffStep[];
  /** Local sha-256 change checksum of the preview input. Not a signature. */
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

const fmtN = (value: string | number) => typeof value === "number"
  ? value.toLocaleString("en-US", { maximumFractionDigits: 2 })
  : formatDecimal(value);

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
    const lines = doc.splitTextToSize(pdfSafe(value), contentWidth * 0.55) as string[];
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
    const lines = doc.splitTextToSize(pdfSafe(text), contentWidth - 14) as string[];
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
    opts?: { colorColumn?: { index: number; color: (raw: string) => RGB | null }; columnWidths?: Record<number, number> },
  ) => {
    if (!body.length) return;
    if (title) eyebrow(title);
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN, bottom: MARGIN + 16, top: MARGIN + 10 },
      head: [head.map(pdfSafe)],
      body: body.map((row) => row.map(pdfSafe)),
      styles: { font: "helvetica", fontSize: 8, textColor: INK, cellPadding: 5, lineColor: BORDER, lineWidth: 0.5, valign: "middle" },
      headStyles: { fillColor: HEAD_BG, textColor: MUTED, fontStyle: "normal", fontSize: 6.8 },
      columnStyles: opts?.columnWidths
        ? Object.fromEntries(Object.entries(opts.columnWidths).map(([k, w]) => [k, { cellWidth: w }]))
        : undefined,
      didParseCell: (data) => {
        if (opts?.colorColumn && data.section === "body" && data.column.index === opts.colorColumn.index) {
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
  doc.text(pdfSafe(p.ref), pageWidth - MARGIN - 65, MARGIN + 3, { align: "center" });

  y = 190;
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(pdfSafe(p.regulationFull).toUpperCase(), MARGIN, y);
  y += 30;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(28);
  doc.setTextColor(...INK);
  doc.text("CBAM Calculation", MARGIN, y);
  y += 32;
  doc.text("& Report Preview", MARGIN, y);
  y += 30;
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  doc.text(pdfSafe(`${p.sector} · ${p.period} · ${p.origin} → ${p.market}`), MARGIN, y);
  y += 44;

  const stats: [string, string][] = [
    [fmtN(p.totalEmbedded), "tCO2e embedded"],
    [String(p.supplierCount), "supplier submissions"],
    [String(doc ? (p.chapters?.reduce((a, c) => a + c.products.length, 0) ?? p.suppliers?.length ?? 0) : 0), "goods reported"],
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
  doc.text(pdfSafe(`Communicating operator: ${p.org} · ${p.installationId}`), MARGIN, y);
  y += 14;
  doc.text(pdfSafe(`Generated: ${new Date().toUTCString()}`), MARGIN, y);
  y += 14;
  if (p.contentHash) {
    doc.text(pdfSafe(`Local dataset sha-256 checksum: ${p.contentHash}`), MARGIN, y, { maxWidth: contentWidth });
    y += 14;
  }

  doc.setFontSize(7.5);
  doc.text(
    pdfSafe(
      "DRAFT PREVIEW ONLY. Not verified, immutable, audit-ready, O3CI-ready or filed. Evidence file bytes are unavailable. The EU importer or indirect customs representative remains responsible for the annual declaration.",
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
  if (p.collectionDeadline) kv("Supplier data collection deadline (internal)", p.collectionDeadline);
  if (p.cbamDeclarationDue) kv("EU-side authorised declarant annual deadline", p.cbamDeclarationDue);
  kv("Goods sector", p.sector);
  kv("Route", `${p.origin} → ${p.market}`);
  kv("Communicating operator (exporter)", p.org);
  kv("Operator reference", p.installationId);
  if (p.buyerLine) kv("EU buyer / declarant", p.buyerLine);
  kv("Monitoring methodology", `Annex IV, Reg. (EU) 2023/956 · Implementing Reg. (EU) 2025/2547 · ${p.factorSet}`);
  kv("Total embedded emissions (locally approved drafts)", `${fmtN(p.totalEmbedded)} tCO2e`);
  kv("Carbon price paid in country of origin", decimal(p.carbonPricePaid).isZero() ? "None reported" : fmtN(p.carbonPricePaid));
  y += 8;

  table(
    "Consolidated per-supplier embedded emissions (tCO2e per tonne)",
    ["Supplier", "Material & route", "Export qty", "Direct", "Indirect", "Precursor", "Total", "Verifier text ref"],
    (p.suppliers ?? []).map((s) => [
      s.name,
      s.productionRoute ? `${s.material}\n${s.productionRoute}` : s.material,
      s.exportQuantity != null ? `${fmtN(s.exportQuantity)} t` : "—",
      s.directEmissions != null ? fmtN(s.directEmissions) : "—",
      s.indirectEmissions != null ? fmtN(s.indirectEmissions) : "—",
      s.precursorEmissions != null ? fmtN(s.precursorEmissions) : "—",
      s.emissions != null ? fmtN(s.emissions) : "unavailable",
      s.verificationStatus ?? "—",
    ]),
  );

  /* ════════ PART B — METHODOLOGY & LEGAL BASIS ════════ */
  partHeading(
    "Part B",
    "Methodology & legal basis",
    "Draft calculation context. A qualified reviewer must independently validate the inputs, formulas, evidence and regulatory-data version before any legal use.",
  );

  eyebrow("Calculation methodology");
  bullet("Specific embedded emissions (SEE) are monitored at installation level in tCO2e per tonne of net mass. For the steel and aluminium goods covered by Annex II in this draft, the definitive result is own-process direct emissions plus relevant precursor contributions; indirect electricity emissions remain a separately reported calculation trace and are excluded from that result.");
  bullet("Complex goods additionally carry the attributed embedded emissions of their relevant precursor materials (e.g. pig iron, ferro-alloys, crude steel inputs).");
  bullet(`Emission factors: ${p.factorSet}. Electricity factors follow the applicable grid or PPA factor with documented source.`);
  bullet("Quantities are normalised to tonnes of net mass; emissions figures to tCO2e per tonne (the CBAM canonical form).");
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
  bullet("Default values carry an effective-dated markup (+10% in 2026, +20% in 2027, +30% from 2028, subject to regulatory revision). Mixed actual/default precursor values are supported; the obsolete transitional 20% cap is not applied.");
  bullet("Actual-value figures require accredited verification. A typed verifier reference or filename is not the report, and this browser-only preview cannot label actual values verified.");
  bullet("A carbon price effectively paid in the country of origin is deductible from the CBAM obligation; the amount, instrument and country are recorded per supplier.");
  bullet("CBAM certificate prices track the EU ETS auction average (quarterly in 2026, weekly from 2027). Certificate purchase and surrender happen on the declarant's side.");
  y += 6;

  eyebrow("Data lineage");
  paragraph(
    "This preview uses browser-local demo records and deterministic checks plus advisory anomaly flags. Links are not authenticated, typed names are not trusted electronic signatures, versions are mutable local metadata, and the activity history is not an immutable audit ledger.",
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
      c.signedBy ? `Locally attested by ${c.signedBy}${c.signedRole ? ` (${c.signedRole})` : ""}` : null,
      c.dataQualityScore != null ? `Data quality ${c.dataQualityScore}/100` : null,
    ].filter(Boolean) as string[];
    doc.text(pdfSafe(metaBits.join("  ·  ")), MARGIN, y, { maxWidth: contentWidth });
    y += 20;

    eyebrow("Installation");
    if (c.actorRole) kv("Commercial actor role", c.actorRole === "trader" ? "Trader forwarding upstream producer data" : "Installation operator / producer");
    if (c.upstreamProducer) kv("Named upstream producer", c.upstreamProducer);
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
      if (prod.installationReference) kv("Producing installation reference", prod.installationReference);
      if (prod.productionActivityTonnes) kv("Process production activity", `${prod.productionActivityTonnes} TNE`);
      if (prod.mrvMethod) kv("MRV method", prod.mrvMethod);
      if (prod.monitoringPlanId || prod.monitoringPlanVersion) kv("Monitoring plan", `${prod.monitoringPlanId || "—"} · version ${prod.monitoringPlanVersion || "—"}`);
      if (prod.systemBoundary) kv("System boundary", prod.systemBoundary);
      kv("Quantity (net mass)", `${fmtN(prod.quantityTonnes)} TNE`);
      table(
        null,
        ["Component", "tCO2e / t", "Basis"],
        [
          ["Direct (Scope 1)", prod.directPerTonne != null ? fmtN(prod.directPerTonne) : "—", prod.method === "default" ? "DEFAULT VALUES" : "ACTUAL DATA"],
          ["Indirect (electricity; Annex-II trace)", prod.indirectPerTonne != null ? fmtN(prod.indirectPerTonne) : "—", prod.method === "default" ? "DEFAULT VALUES" : "ACTUAL DATA"],
          ["Definitive embedded emissions", prod.totalPerTonne != null ? fmtN(prod.totalPerTonne) : "—", ""],
          ["Absolute for quantity", prod.absoluteTCO2e != null ? `${fmtN(prod.absoluteTCO2e)} tCO2e` : "—", ""],
        ],
        { colorColumn: { index: 2, color: (raw) => (raw === "DEFAULT VALUES" ? AMBER : raw === "ACTUAL DATA" ? GREEN : null) } },
      );
      // Electricity data — justifies the indirect figure; required content for
      // aluminium goods, so it must appear in the communicated package.
      if (prod.electricityConsumed || prod.electricityFactor || prod.electrolysisTech) {
        eyebrow("Electricity");
        if (prod.electricityConsumed) kv("Electricity consumed", `${prod.electricityConsumed} MWh/t`);
        if (prod.electricityFactor) kv("Emission factor & source", prod.electricityFactor);
        if (prod.electrolysisTech) kv("Electrolysis technology", prod.electrolysisTech === "soderberg" ? "Soderberg" : "Prebake");
      }
      if (prod.precursors) {
        eyebrow("Precursors");
        paragraph(prod.precursors, INK, 9);
        if (prod.precursorRoutes) paragraph(`Production routes: ${prod.precursorRoutes}`);
      }
      if (prod.calculationTraces.length > 0) {
        eyebrow("Deterministic calculation trace");
        for (const trace of prod.calculationTraces) {
          kv("Method / output", `${trace.method} · ${trace.output.value} ${trace.output.unit}`);
          paragraph(`Formula: ${trace.formula}`, INK, 8.5);
          table(
            null,
            ["Exact input", "Decimal value", "Unit", "Source / evidence"],
            trace.exactInputs.map((input) => [input.name, input.value, input.unit, input.sourceReference ?? "—"]),
          );
          paragraph(`Regulatory data: ${trace.regulatoryDataVersion} · authoritative deterministic result · ${trace.decimalContext.rounding}`, MUTED, 8);
          if (trace.evidenceReferences.length > 0) paragraph(`Sources/evidence: ${trace.evidenceReferences.join(", ")}`, MUTED, 8);
          for (const warning of trace.warnings) {
            bullet(`[${warning.severity}] ${warning.code} — ${warning.message}`, warning.severity === "BLOCKER" ? RED : AMBER, 8);
          }
          y += 3;
        }
      }
    }

    eyebrow("Monitoring plan and installation boundary");
    if (c.monitoringPlans.length === 0) kv("Monitoring plan", "—");
    for (const plan of c.monitoringPlans) {
      kv(`Monitoring plan${plan.installationReference ? ` · ${plan.installationReference}` : ""}`, `${plan.id || "—"} · version ${plan.version || "—"}`);
    }
    for (const prod of c.products) {
      if (prod.excludedActivities) kv(`${prod.name} · excluded activities`, prod.excludedActivities);
      if (prod.dataGapMethodology) kv(`${prod.name} · data-gap methodology`, prod.dataGapMethodology);
      if (prod.controlActivities) kv(`${prod.name} · control activities`, prod.controlActivities);
    }
    if (c.installation.productionActivity) kv("Primary installation production activity", `${c.installation.productionActivity} TNE`);
    for (const installation of c.additionalInstallations) {
      kv(`Additional installation ${installation.id}`, `${installation.name || "—"} · ${installation.country || "—"}`);
      if (installation.routes.length > 0) kv("Routes", installation.routes.join(", "));
      if (installation.productionActivity) kv("Production activity", `${installation.productionActivity} TNE`);
    }

    eyebrow("Carbon price in country of origin");
    kv("Amount", !c.carbonPrice.amount || c.carbonPrice.amount === "0" || c.carbonPrice.amount.startsWith("0 ") ? "0 (no carbon price paid)" : c.carbonPrice.amount);
    if (c.carbonPrice.instrument) kv("Instrument", c.carbonPrice.instrument);
    y += 4;

    eyebrow("Verifier reference — unvalidated");
    paragraph(c.verification ? `${c.verification} — typed browser metadata only; no accredited report bytes or accreditation check is available.` : "No verifier reference provided.", AMBER, 9);

    table(
      "Evidence references (file bytes unavailable)",
      ["Document", "Required", "Status", "Filename metadata"],
      c.documents.map((d) => [d.label, d.required ? "Required" : "Optional", d.status.toUpperCase(), d.files.join(", ") || "—"]),
      { colorColumn: { index: 2, color: (raw) => (raw === "REFERENCED" ? AMBER : raw === "MISSING" ? RED : null) } },
    );

    if (c.findings.length) {
      eyebrow("Open findings at approval");
      for (const f of c.findings) {
        bullet(`[${f.severity.toUpperCase()}] ${f.title} — ${f.detail}`, f.severity === "critical" ? RED : AMBER, 8.5);
      }
      y += 4;
    }

    table(
      "Version history",
      ["Version", "Recorded", "Quality score", "Local attestation"],
      c.versions.map((v) => [`V${v.n}`, v.when, String(v.score), v.signedBy ?? "—"]),
    );
  });

  /* ════════ PART D — CONSOLIDATED EVIDENCE REGISTER ════════ */
  partHeading("Part D", "Evidence-reference register", "Filename and size metadata only. Document bytes are not stored and no malware scan, retention control or evidentiary chain is available.");
  table(
    null,
    ["Supplier", "Document", "Status"],
    (p.documents ?? []).map((d) => [d.supplier, d.name, d.status.toUpperCase()]),
    { colorColumn: { index: 2, color: (raw) => (raw === "REFERENCED" ? AMBER : raw === "MISSING" ? RED : null) } },
  );

  /* ════════ PART E — FINDINGS & DATA QUALITY ════════ */
  partHeading("Part E", "Findings & data quality", "Deterministic critical findings block local approval. Anomaly flags are advisory and never approve or verify data.");
  table(
    null,
    ["Severity", "Supplier", "Finding"],
    (p.aiWarnings ?? []).map((w) => [w.type.toUpperCase(), w.supplier, w.message]),
    { colorColumn: { index: 0, color: (raw) => (raw === "CRITICAL" ? RED : raw === "WARNING" ? AMBER : null) } },
  );
  if (!(p.aiWarnings ?? []).length) paragraph("No findings were open at approval — every submission passed the automated checks cleanly.", GREEN);

  /* ════════ PART F — VERSION HISTORY ════════ */
  partHeading("Part F", "Local version metadata", "Browser-local submission metadata only. Values are not frozen as immutable snapshots and require a trusted backend before audit use.");
  table(
    null,
    ["Supplier", "Version", "Submitted", "Quality score"],
    (p.versionHistory ?? []).map((v) => [v.supplier, `V${v.version}`, v.when, String(v.score)]),
  );

  /* ════════ PART G — APPROVAL & SIGN-OFF RECORD ════════ */
  partHeading("Part G", "Local approval model", "Demo-only typed confirmations without identity authority, trusted signature, segregation-of-duties enforcement or immutable version binding.");
  if (p.signOff?.length) {
    table(
      null,
      ["Step", "Actor", "Role", "Outcome", "Date"],
      p.signOff.map((s) => [s.label, s.actor, s.title, s.status.replace("_", " ").toUpperCase(), s.when ?? "—"]),
      { colorColumn: { index: 3, color: (raw) => (raw === "APPROVED" ? GREEN : raw === "CHANGES REQUESTED" ? RED : null) } },
    );
    const commented = p.signOff.filter((s) => s.comment);
    if (commented.length) {
      eyebrow("Step comments");
      for (const s of commented) bullet(`${s.actor} (${s.label}): "${s.comment}"`, INK, 8.5);
    }
  } else {
    paragraph("No internal sign-off chain was recorded for this declaration. For regulated filings, Certrace recommends at minimum a preparer + approver chain (see the Review & Approval workspace).", AMBER);
  }

  /* ════════ PART H — AUDIT TRAIL ════════ */
  partHeading("Part H", "Local activity history", "Mutable browser events for demonstration only. This is not complete, append-only or an audit ledger. Timestamps are client-generated UTC values.");
  table(
    null,
    ["Timestamp", "Supplier", "Event"],
    (p.auditTrail ?? []).map((e) => [e.when, e.supplier, e.text]),
    { columnWidths: { 0: 130, 1: 100 } },
  );

  /* ════════ PART I — GLOSSARY & REFERENCES ════════ */
  partHeading("Part I", "Glossary & regulatory references");
  eyebrow("Glossary");
  const glossary: [string, string][] = [
    ["CBAM", "Carbon Border Adjustment Mechanism — the EU's carbon price on embedded emissions of imported goods."],
    ["SEE", "Specific embedded emissions — tCO2e per tonne of net mass. Included components depend on the product's effective regulatory treatment; this steel/aluminium draft excludes Annex-II indirect emissions while retaining their trace."],
    ["Direct emissions", "Scope 1 emissions from the production processes of the installation, including heating/cooling consumed."],
    ["Indirect emissions", "Emissions from the production of electricity consumed during production."],
    ["Precursor", "An input material that is itself a CBAM good, whose embedded emissions carry into the finished (complex) good."],
    ["Complex good", "A good produced using relevant precursor materials — its SEE must include the precursors' attributed emissions."],
    ["Default value", "Commission-published fallback emission intensity with an effective-dated definitive-period markup; may be mixed with actual precursor values."],
    ["CN code", "8-digit Combined Nomenclature commodity code identifying the good."],
    ["Authorised CBAM Declarant", "The EU importer (or indirect customs representative) authorised to file CBAM declarations and surrender certificates."],
    ["O3CI", "The CBAM Registry module for Operators of Third-Country Installations — where a non-EU producer registers installations and shares emissions data with declarants."],
    ["Communication template", "The Commission's Annex IV-aligned format for transmitting embedded-emissions data from operator to declarant."],
  ];
  for (const [term, def] of glossary) bullet(`${term} — ${def}`, MUTED, 8.5);
  y += 6;
  eyebrow("Regulatory references");
  bullet("Regulation (EU) 2023/956 establishing a carbon border adjustment mechanism (the CBAM Regulation), incl. Annex IV monitoring rules.");
  bullet("Implementing Regulations (EU) 2025/2546 and 2025/2547 on the definitive-period Registry/declaration and embedded-emissions calculation rules.");
  bullet("Implementing Regulations (EU) 2025/2620 and 2025/2621 on certificate pricing/default values, as applicable and effective-dated.");
  bullet("CBAM Registry — Authorisation Management Module and the Operators of Third-Country Installations (O3CI) portal.");
  bullet("EU ETS auction prices (the reference for CBAM certificate pricing from 2026/2027).");

  /* ════════ LOCAL CHECKSUM ════════ */
  doc.addPage();
  toc.push({ label: "Local checksum & limitations", page: doc.getNumberOfPages() });
  y = MARGIN + 30;
  doc.setFillColor(...GREEN);
  doc.circle(MARGIN + 3, y - 3, 3, "F");
  doc.setFont("courier", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  const eventCount = p.auditTrail?.length ?? 0;
  doc.text(
    pdfSafe(`Draft generated locally · ${new Date().toUTCString()}${eventCount ? ` · ${eventCount} mutable local events listed in Part H` : ""}`),
    MARGIN + 12,
    y,
    { maxWidth: contentWidth - 12 },
  );
  y += 22;
  if (p.contentHash) {
    doc.text(pdfSafe(`Local dataset sha-256 checksum: ${p.contentHash}`), MARGIN, y, { maxWidth: contentWidth });
    y += 18;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    pdfSafe("The checksum detects changes to this locally generated preview only. It is not a trusted timestamp, signature, seal, immutable ledger, evidence hash manifest or proof of who approved or received the data."),
    MARGIN,
    y,
    { maxWidth: contentWidth },
  );
  y += 38;
  doc.setTextColor(...AMBER);
  doc.text(pdfSafe("BLOCKED FOR LEGAL / REGULATORY USE until secure evidence storage, accredited verification, trusted identity/signatures, immutable retention and an official submission workflow are configured."), MARGIN, y, { maxWidth: contentWidth });

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
    doc.text("DRAFT PREVIEW — NOT FOR REGULATORY SUBMISSION", pageWidth - MARGIN, 26, { align: "right" });
    doc.setDrawColor(...BORDER);
    doc.line(MARGIN, 32, pageWidth - MARGIN, 32);
    doc.setFontSize(7.5);
    doc.text(pdfSafe(`${p.ref} · page ${i} of ${pageCount}`), pageWidth - MARGIN, pageHeight - 22, { align: "right" });
  }

  return doc;
}

/* ── Download helpers ──────────────────────────────────────── */

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

/** Local sha-256 change checksum. This is not a signature or trusted seal. */
export async function datasetHash(p: PackageInput): Promise<string | undefined> {
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
  const slug = `${p.regulationShort}-${p.period}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const doc = await buildPackagePdf({ ...p, contentHash });
  doc.save(`certrace-${slug}-draft-preview.pdf`);
}
