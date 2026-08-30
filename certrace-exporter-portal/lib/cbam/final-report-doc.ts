/* ════════════════════════════════════════════════════════════
   THE FINAL REPORT, AS A DOCUMENT MODEL

   One export, one file: the Verification Report followed immediately by the
   Evidence pages. This module builds that document as an ordered STRUCTURE —
   parts, subsections, field rows, tables, and the evidence appendix plan —
   and renders nothing. lib/cbam/final-report-pdf.ts walks it into a PDF.

   WHY A MODEL AND NOT HTML. The old path composed two HTML fragments and
   relied on the browser's print dialog to make a PDF, which meant the export
   produced an .html file and the page order was whatever CSS decided on the
   day. The contract now fixes both: exactly one PDF, Parts 1-4 in the
   template's own order, evidence after them in a fixed category order. A
   structure can be asserted against directly in a test; a string of HTML
   can only be grepped, which is how "the divider is present somewhere"
   passed while the order underneath it was never checked at all.

   FIELD NAMES ARE VERBATIM. Every label in Parts 1-4 is copied from the EU
   CBAM Communication Template for Installations (v2.1.1, 13 December 2024) —
   sheets A_InstData, Summary_Processes, C_Emissions&Energy, Summary_Products
   and F_Tools. Where Certrace does not collect a field, the row still renders
   with NOT_PROVIDED rather than being dropped: a reviewer has to be able to
   see what is missing, not infer it from a row that was never printed.

   NOTE: "Monitoring Methodology Documentation" (this file's output) is the
   full 8-part exported report. It is NOT the same thing as the Smart Link
   wizard's "Methodology" step (boundary/fuels/electricity/process-emissions
   input, see components/supplier/month-steps.tsx's MmdStep). Do not conflate
   the two in UI copy — one is what a supplier fills in, the other is what
   gets handed to a verifier.
   ════════════════════════════════════════════════════════════ */

import { getCarbonPrice, CARBON_PRICE_INSTRUMENT_LABEL } from "../carbon-price";
import { getInstallation } from "../installations";
import { getOrgIdentity } from "../org";
import { monthsForWorkspace, fuelGJ, fuelTypeLabel, effectiveEf, resolvedOxidationFactor } from "../monthly-data";
import { workspaceReadiness, type WorkspaceReadiness } from "../readiness";
import { workspaceSEE } from "../workspace-see";
import { directMethodSummary, finalVersionCovering, loadDraft, migrateMmd, REDUCING_AGENT_LABEL, type SectorParameters } from "../workspace-mmd";
import { goodsCategory, routeLabel, workspaceTitle, type VerificationWorkspace } from "../workspace";
import {
  listEvidence,
  departmentForEvidenceItem,
  departmentForFieldKey,
  EVIDENCE_DEPARTMENT_LABEL,
  type EvidenceDepartment,
  type EvidenceItem,
} from "../workspace-evidence";
import { QUALITY_ASSURANCE_LABEL } from "./mmd";
import { categoryForCn, indirectApplies, specialParametersFor, TEMPLATE_UNITS } from "./template-reference";

/** What a field renders as when Certrace has no answer for it. Never an
    empty cell: a blank reads as "nothing needed here", and this has to read
    as "this was asked for and is missing". */
export const NOT_PROVIDED = "Not provided";

/** How many outstanding items the cover prints before deferring to the
    Readiness tab for the rest. */
export const OUTSTANDING_SHOWN = 12;

/* ── Blocks ─────────────────────────────────────────────────── */

export type FieldRow = { label: string; value: string };
export type FieldsBlock = { kind: "fields"; rows: FieldRow[] };
export type TableBlock = { kind: "table"; columns: string[]; rows: string[][]; caption?: string };
export type TextBlock = { kind: "text"; text: string };
export type Block = FieldsBlock | TableBlock | TextBlock;

export type Subsection = { number: string; title: string; blocks: Block[] };
export type Part = { number: number; title: string; subsections: Subsection[] };

/* ── The evidence appendix ──────────────────────────────────── */

/** The five formal categories, in the order the REPORT APPENDIX presents
    them. Deliberately NOT `EVIDENCE_CATEGORY_ORDER`, which is the A-E order
    the Documents screen lays its cards out in: the two differ at positions 2
    and 5, and collapsing them into one constant would silently re-letter the
    screen the next time this order changed. */
export const EVIDENCE_REPORT_CATEGORY_ORDER: EvidenceDepartment[] = [
  "operations", // 1. Production & Process Records
  "lab", // 2. Laboratory Analysis & Third-Party Verification
  "suppliers", // 3. Supplier-Submitted Documentation
  "organisation", // 4. Organisational & Compliance Documentation
  "finance", // 5. Financial & Procurement Records
];

/** Every subsection of Parts 1-4, in the order they are printed. An evidence
    item's position inside its category is decided by where the field it
    substantiates lands in this list — so a document behind a Part 2
    production route sorts ahead of one behind a Part 4 SEE figure, which is
    what a reader following the report forwards expects. */
export const PART_ANCHORS = ["1.1", "1.2", "1.3", "1.4", "2.1", "2.2", "3.1", "3.2", "3.3", "3.4", "4.1", "4.2"] as const;
export type PartAnchor = (typeof PART_ANCHORS)[number];

/** fieldKey → the subsection whose figure that document stands behind.
    `fieldKeys` IS the `supports_field_id` linkage the contract refers to; it
    already exists on every EvidenceItem, so this is a sort key, not a schema
    change. Prefix keys (per-fuel, per-precursor) are resolved in
    `anchorForFieldKey` below, the same way `departmentForFieldKey` does it. */
const FIELD_ANCHOR: Record<string, PartAnchor> = {
  "installation-identity": "1.2",
  "installation-diagram": "2.2",
  "lab-analysis": "3.1",
  "electricity-consumed": "3.2",
  "electricity-factor": "3.2",
  "utility-invoice": "3.2",
  "contract-or-ppa": "3.2",
  "calibration-records": "3.4",
  "internal-qa-record": "3.4",
  "default-value-justification": "3.4",
  production: "4.1",
  "precursor-verification-report": "4.1",
  "supplier-communication-template": "4.1",
  "mill-test-certificate": "4.1",
  /* The receipt evidences the QUANTIFIED price in 4.2, not the narrative in
     1.4 — the template keeps those apart and so does the appendix. */
  "carbon-price": "4.2",
};

/** Where a field key sits in Parts 1-4, or null when nothing maps it. Null is
    a real answer, not a failure: the caller sorts those to the end of their
    category by upload date rather than dropping them. */
export function anchorForFieldKey(key: string): PartAnchor | null {
  if (key.startsWith("fuel-invoice:")) return "3.1";
  if (key.startsWith("fuel:")) return "3.1";
  if (key.startsWith("precursor:")) return "4.1";
  return FIELD_ANCHOR[key] ?? null;
}

const anchorRank = (a: PartAnchor | null): number => (a == null ? Number.MAX_SAFE_INTEGER : PART_ANCHORS.indexOf(a));

export type EvidenceSection = {
  department: EvidenceDepartment;
  /** the number this category carries in the fixed order, 1-5. Kept even when
      earlier categories are skipped — hiding category 3 must not renumber 4. */
  ordinal: number;
  title: string;
  items: EvidenceItem[];
};

/** Group the workspace's evidence into the five categories, in the fixed
    appendix order, each sorted by the position of the field it supports.

    Empty categories are DROPPED entirely — no header, no placeholder line —
    while the ordinals stay pinned to the fixed order above, so a report with
    nothing in Supplier-Submitted Documentation still numbers Organisational
    as 4. */
export function planEvidence(workspaceId: string): EvidenceSection[] {
  const all = listEvidence(workspaceId);
  const sections: EvidenceSection[] = [];

  EVIDENCE_REPORT_CATEGORY_ORDER.forEach((department, i) => {
    const items = all.filter((e) => departmentForEvidenceItem(e) === department);
    if (items.length === 0) return; // §5 — hidden entirely, not shown empty

    items.sort((a, b) => {
      const ra = anchorRank(anchorForFieldKey(a.fieldKeys[0] ?? ""));
      const rb = anchorRank(anchorForFieldKey(b.fieldKeys[0] ?? ""));
      if (ra !== rb) return ra - rb;
      /* Same field, or both unmapped: upload date, oldest first. A stable
         tiebreak matters more than which one it is — two runs of the same
         export must not shuffle the appendix. */
      return String(a.capturedAt).localeCompare(String(b.capturedAt));
    });

    sections.push({ department, ordinal: i + 1, title: `Evidence — ${EVIDENCE_DEPARTMENT_LABEL[department]}`, items });
  });

  return sections;
}

/* ── Formatting ─────────────────────────────────────────────── */

/** Four decimals, matching the workbook's own example row (0.915 / 0.396 /
    1.311). Nothing rounds before it is printed. */
const sig = (v: number, dp = 4): string =>
  Number.isFinite(v) ? v.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: dp }) : NOT_PROVIDED;

const text = (v: unknown): string => {
  const s = String(v ?? "").trim();
  return s.length > 0 ? s : NOT_PROVIDED;
};

/** Maps a `specialParameters` label (Section 3's sector-parameters table) to
    the value stored under it, so the table's column order can vary by
    aggregated goods category without a separate row-builder per category. */
function sectorParameterValue(label: string, p: SectorParameters): string {
  switch (label) {
    case "The main reducing agent of the precursor, if known":
      if (!p.reducingAgent) return NOT_PROVIDED;
      return p.reducingAgent === "other" ? text(p.reducingAgentOther) : REDUCING_AGENT_LABEL[p.reducingAgent];
    case "Steel mill identification number":
      return text(p.steelMillId);
    case "% Mn":
      return p.mnPct != null ? `${sig(p.mnPct, 2)}%` : NOT_PROVIDED;
    case "% Cr":
      return p.crPct != null ? `${sig(p.crPct, 2)}%` : NOT_PROVIDED;
    case "% Ni":
      return p.niPct != null ? `${sig(p.niPct, 2)}%` : NOT_PROVIDED;
    case "% other alloys":
      return p.otherAlloyingPct != null ? `${sig(p.otherAlloyingPct, 2)}%` : NOT_PROVIDED;
    case "% other materials":
      return p.otherMaterialsPct != null ? `${sig(p.otherMaterialsPct, 2)}%` : NOT_PROVIDED;
    case "% carbon":
      return p.carbonPct != null ? `${sig(p.carbonPct, 2)}%` : NOT_PROVIDED;
    case "t scrap per t steel":
      return p.scrapTonnesPerTonneSteel != null ? `${sig(p.scrapTonnesPerTonneSteel, 3)} t/t` : NOT_PROVIDED;
    case "% pre-consumer scrap":
      return p.preConsumerScrapPct != null ? `${sig(p.preConsumerScrapPct, 2)}%` : NOT_PROVIDED;
    default:
      return NOT_PROVIDED;
  }
}

/* ── The document ───────────────────────────────────────────── */

export type FinalReportDoc = {
  /** Certrace's own front matter. The contract allows Certrace-specific
      content BEFORE Part 1 and nowhere else, so the workings, the precursor
      detail and the completeness note all live here rather than between
      parts where they would break the template's order. */
  cover: { title: string; subtitle: string; draftBanner: string | null; notes: FieldRow[]; outstanding: string[]; workings: string[] };
  parts: Part[];
  evidence: EvidenceSection[];
  draft: boolean;
  fileNameSlug: string;
};

export function buildFinalReportDoc(ws: VerificationWorkspace, readiness?: WorkspaceReadiness): FinalReportDoc {
  const r = readiness ?? workspaceReadiness(ws);
  const draft = r.overall !== "complete";
  const see = workspaceSEE(ws);
  const org = getOrgIdentity();
  const inst = getInstallation(ws.installationId);
  const cp = getCarbonPrice(ws.id);
  const mmdFinal = finalVersionCovering(ws.id, ws.periodStart, ws.periodEnd);
  const mmd = mmdFinal ? migrateMmd(mmdFinal.content, ws.periodStart, ws.periodEnd) : loadDraft(ws.id, ws.periodStart, ws.periodEnd);

  const good = categoryForCn(ws.cnCode);
  const categoryLabel = good ? good.label.trim() : text(goodsCategory(ws));
  const indirectRelevant = good ? indirectApplies(good.id) : true;
  const unit = good?.unit ?? "t";

  /* ── Part 1 — Installation details ─────────────────────────── */

  const part1: Part = {
    number: 1,
    title: "Installation details",
    subsections: [
      {
        number: "1.1",
        title: "Reporting period",
        blocks: [
          {
            kind: "fields",
            rows: [
              { label: "Reporting period start", value: text(ws.periodStart) },
              { label: "Reporting period end", value: text(ws.periodEnd) },
            ],
          },
        ],
      },
      {
        number: "1.2",
        title: "About the installation",
        blocks: [
          {
            kind: "fields",
            rows: [
              { label: "Name of the installation (optional)", value: text(inst?.nameLocal) },
              { label: "Name of the installation (English name)", value: text(inst?.name ?? ws.installationName) },
              { label: "Street, Number", value: text(inst?.street) },
              { label: "Economic activity", value: text(inst?.economicActivity) },
              { label: "Post code", value: text(inst?.postcode) },
              { label: "P.O. Box", value: text(inst?.poBox) },
              { label: "City", value: text(inst?.city) },
              { label: "Country", value: text(inst?.country) },
              { label: "UNLOCODE", value: text(inst?.unlocode) },
              { label: "Coordinates of the main emission source (latitude)", value: text(inst?.lat) },
              { label: "Coordinates of the main emission source (longitude)", value: text(inst?.lng) },
              { label: "Name of authorised representative", value: text(inst?.contactName) },
              { label: "Email", value: text(inst?.contactEmail) },
              { label: "Telephone", value: text(inst?.contactPhone) },
              {
                label: "Other goods produced at this installation (non-CBAM)",
                value: inst?.otherGoods?.length
                  ? inst.otherGoods.map((g) => (g.description ? `${g.name} — ${g.description}` : g.name)).join("; ")
                  : "None declared",
              },
            ],
          },
        ],
      },
      {
        number: "1.3",
        title: "Verifier of the report",
        /* Certrace collects a verifier for a PRECURSOR's report, never for
           the installation's own — and verification is not required during
           the transitional period. The contract asks for the stated
           not-applicable line rather than a block of empty fields. */
        blocks: [{ kind: "text", text: "Not applicable — transitional period." }],
      },
      {
        number: "1.4",
        title: "Carbon price instrument",
        blocks: [
          {
            kind: "fields",
            rows: [
              {
                label: "Carbon price instrument: description and indication of the legal act for the carbon price, and for any rebate or other compensation obtained",
                /* A stored instrument id that predates the current list has
                   no label. Reaching straight into the record printed the
                   word "undefined" into a government-facing field, so the
                   lookup falls back to the id itself. */
                value: cp?.instrument
                  ? `${CARBON_PRICE_INSTRUMENT_LABEL[cp.instrument] ?? cp.instrument}${cp.rebates ? ` — rebate or compensation: ${cp.rebates}` : ""}`
                  : NOT_PROVIDED,
              },
              { label: "Any additional information for the reporting declarant", value: text(mmd.boundaryDescription) },
            ],
          },
        ],
      },
    ],
  };

  /* ── Part 2 — Production processes and production routes ──── */

  /** Six route columns, exactly as the template lays them out. A category
      with fewer routes prints "n.a." in the rest rather than blank cells,
      which is what the workbook itself does. */
  const routeCells = (fill: (route: string) => string): string[] => {
    const routes = good?.routes ?? [];
    return Array.from({ length: 6 }, (_, i) => (routes[i] ? fill(routes[i]) : "n.a."));
  };

  const usedRoute = routeLabel(ws.productionRoute);
  const part2: Part = {
    number: 2,
    title: "Production processes and production routes summary",
    subsections: [
      {
        number: "2.1",
        title: "Aggregated goods categories and production routes",
        blocks: [
          {
            kind: "table",
            columns: ["Aggregated good produced", "Route 1", "Route 2", "Route 3", "Route 4", "Route 5", "Route 6"],
            rows: [[categoryLabel, ...routeCells((route) => route)]],
          },
        ],
      },
      {
        number: "2.2",
        title: "Production process summary",
        blocks: [
          {
            kind: "table",
            columns: ["Production process", "Aggregated goods category", "Route 1", "Route 2", "Route 3", "Route 4", "Route 5", "Route 6"],
            /* "x" marks the route this process feeds into — the template's
               own convention, not a tick or a repeated label. */
            rows: [[text(ws.productName), categoryLabel, ...routeCells((route) => (route === usedRoute ? "x" : ""))]],
          },
        ],
      },
    ],
  };

  /* ── Part 3 — Emissions by monitoring methodology ──────────── */

  const entries = monthsForWorkspace(ws).filter((e) => see.months.some((m) => m.month === e.month && m.counted));

  let totalGj = 0;
  let electricityGj = 0;
  let biomassTCO2 = 0;
  /** Annual per-fuel breakdown for 3.1a, keyed by fuel identity (type, or
      type+its "other" text) rather than row id — each month's fuel rows are
      independent records of the same fuel, and the report speaks about the
      fuel, not the row. */
  const fuelBreakdown = new Map<string, { label: string; gj: number; ef: number; tCO2: number; zeroRated: boolean }>();
  for (const entry of entries) {
    for (const f of entry.fuels) {
      let gj = 0;
      try {
        gj = fuelGJ(f);
      } catch {
        /* An unconvertible row is already reported as a unit failure by
           workspaceSEE; it contributes nothing here rather than aborting the
           balance and losing the rows that did convert. */
        continue;
      }
      totalGj += gj;
      if (f.usedForSelfGeneratedElectricity) electricityGj += gj;
      /* Annex II Equation 10 — the share of carbon the biomass fraction
         zero-rates, reported as its own memo line the way the template does,
         not folded into the CO2 total. */
      const bf = Math.min(1, Math.max(0, Number(f.biomassFraction) || 0));
      if (bf > 0) biomassTCO2 += gj * (f.efTco2PerGj - effectiveEf(f)) * resolvedOxidationFactor(f);

      const key = f.fuelType === "other" ? `other:${f.fuelTypeOther}` : f.fuelType;
      const row = fuelBreakdown.get(key) ?? { label: fuelTypeLabel(f.fuelType, f.fuelTypeOther), gj: 0, ef: f.efTco2PerGj, tCO2: 0, zeroRated: false };
      row.gj += gj;
      row.tCO2 += gj * effectiveEf(f) * resolvedOxidationFactor(f);
      if (bf > 0) row.zeroRated = true;
      fuelBreakdown.set(key, row);
    }
  }

  const TJ = (gj: number) => sig(gj / 1000, 4);
  const directFuelGj = Math.max(0, totalGj - electricityGj);

  /** The template splits each balance three ways: what came from sheet
      B_EmInst, what was typed in by hand, and the result. Certrace has no
      B_EmInst — every figure is entered against a month in the portal — so
      that row reads n.a. rather than printing a zero, which would read as a
      measured nil. Said once in each table's note; repeating the sentence in
      all seven columns buried the figures underneath it. */
  const NO_SHEET = "n.a.";
  const NO_SHEET_NOTE =
    "Certrace has no B_EmInst sheet: every figure is entered against a month in the portal, so that row is n.a. throughout and the manual-entry row " +
    "carries the totals.";

  const part3: Part = {
    number: 3,
    title: "Emissions by monitoring methodology and data quality summary",
    subsections: [
      {
        number: "3.1",
        title: "Fuel balance",
        blocks: [
          {
            kind: "table",
            caption: "Unit: TJ",
            columns: ["", "Total fuel input", "Direct fuel for CBAM goods", "Fuel for electricity", "Direct fuel for non-CBAM goods", "Rest"],
            rows: [
              ["from sheet B_EmInst", NO_SHEET, NO_SHEET, NO_SHEET, NO_SHEET, NO_SHEET],
              ["manual entries", TJ(totalGj), TJ(directFuelGj), TJ(electricityGj), NOT_PROVIDED, NOT_PROVIDED],
              ["Results", TJ(totalGj), TJ(directFuelGj), TJ(electricityGj), NOT_PROVIDED, NOT_PROVIDED],
            ],
          },
          {
            kind: "text",
            text:
              "Direct fuel for non-CBAM goods and Rest are not collected by Certrace: the workspace's boundary is drawn around the CBAM good's own " +
              "production process, so every fuel row inside it is already attributed to that good. A site that also burns fuel outside this boundary " +
              "must state that separately to its verifier. " +
              NO_SHEET_NOTE,
          },
        ],
      },
      {
        number: "3.1a",
        title: "Fuel breakdown",
        blocks:
          fuelBreakdown.size > 0
            ? [
                {
                  kind: "table",
                  caption: "Fuels contributing to Table 3.1's totals, individually. A fuel marked zero-rated still shows its real quantity and " +
                    "catalogue emission factor — only its contribution to the total is zeroed, under Annex II Equation 10.",
                  columns: ["Fuel", "Quantity (TJ)", "EF (catalogue, tCO2/GJ)", "Contribution (tCO2)"],
                  rows: [...fuelBreakdown.values()].map((r) => [
                    r.zeroRated ? `${r.label} (zero-rated — biomass)` : r.label,
                    TJ(r.gj),
                    sig(r.ef, 4),
                    sig(r.tCO2, 2),
                  ]),
                },
              ]
            : [{ kind: "text", text: "No fuel recorded for this workspace." }],
      },
      {
        number: "3.2",
        title: "GHG balance by type of GHG",
        blocks: [
          {
            kind: "table",
            caption: `Unit: ${TEMPLATE_UNITS.emissions}`,
            columns: [
              "",
              "Total CO2 emissions",
              "Biomass emissions",
              "Total N2O emissions",
              "Total PFC emissions",
              "Total direct emissions",
              "Total indirect emissions",
              "Total emissions",
            ],
            rows: [
              ["from sheet B_EmInst", NO_SHEET, NO_SHEET, NO_SHEET, NO_SHEET, NO_SHEET, NO_SHEET, NO_SHEET],
              [
                "manual entries",
                sig(see.directTCO2),
                sig(biomassTCO2),
                NOT_PROVIDED,
                good?.pfcRelevant ? NOT_PROVIDED : "n.a. — not a PFC category",
                sig(see.directTCO2),
                sig(see.indirectTCO2),
                sig(see.directTCO2 + see.indirectTCO2),
              ],
              [
                "Results",
                sig(see.directTCO2),
                sig(biomassTCO2),
                NOT_PROVIDED,
                good?.pfcRelevant ? NOT_PROVIDED : "n.a. — not a PFC category",
                sig(see.directTCO2),
                sig(see.indirectTCO2),
                sig(see.directTCO2 + see.indirectTCO2),
              ],
            ],
          },
          {
            kind: "text",
            text:
              "N2O is not collected by Certrace; it arises in nitric, adipic and glyoxylic acid production, which the portal does not yet model. " +
              "Biomass emissions are the share of carbon zero-rated under Annex II Equation 10 and are reported separately, not inside the CO2 total. " +
              (indirectRelevant
                ? "Indirect emissions are reported and chargeable for this category. "
                : "Indirect emissions are shown but excluded from the chargeable figure for this category under Annex II. ") +
              NO_SHEET_NOTE,
          },
        ],
      },
      {
        number: "3.3",
        title: "GHG balance by type of monitoring methodology",
        blocks: [
          {
            kind: "table",
            caption: `Unit: ${TEMPLATE_UNITS.emissions}`,
            columns: ["", "Calculation-based (excl. PFC emissions)", "Total PFC emissions", "Measurement-based", "Other"],
            rows: [
              ["from sheet B_EmInst", NO_SHEET, NO_SHEET, NO_SHEET, NO_SHEET],
              ["manual entries", sig(see.directTCO2), good?.pfcRelevant ? NOT_PROVIDED : "n.a. — not a PFC category", NOT_PROVIDED, NOT_PROVIDED],
              ["Results", sig(see.directTCO2), good?.pfcRelevant ? NOT_PROVIDED : "n.a. — not a PFC category", NOT_PROVIDED, NOT_PROVIDED],
            ],
          },
          {
            kind: "text",
            text:
              "Every figure Certrace produces is calculation-based: fuel quantity times net calorific value times emission factor times oxidation " +
              "factor, plus process emissions by the standard or mass-balance method. A measurement-based (CEMS) figure would have to be stated to " +
              "the verifier outside the portal. " +
              NO_SHEET_NOTE,
          },
        ],
      },
      {
        number: "3.4",
        title: "Information on data quality and quality assurance",
        blocks: [
          {
            kind: "fields",
            rows: [
              { label: "General information on data quality", value: text(directMethodSummary(mmd)) },
              {
                /* The template asks for a justification CATEGORY when default
                   values predominate. Certrace does not collect the category,
                   but it does know the share that rests on defaults — which
                   is the fact that decides whether the field applies at all. */
                label: "Justification for use of default values",
                value:
                  see.precursors.defaultValueShare > 0
                    ? `${sig(see.precursors.defaultValueShare * 100, 1)}% of the precursor contribution rests on EC-published default values. Justification category ${NOT_PROVIDED.toLowerCase()} — Certrace records the share, not the category.`
                    : "n.a. — no default values used",
              },
              { label: "Information on quality assurance", value: text(QUALITY_ASSURANCE_LABEL[mmd.qualityAssurance]) },
              {
                label: "Monitoring methodology document",
                value: mmdFinal
                  ? `Final version ${mmdFinal.n}, issued ${new Date(mmdFinal.finalisedAt).toISOString().slice(0, 10)}`
                  : "DRAFT — not finalised",
              },
              { label: "Processes inside the boundary", value: mmd.processesIncluded.length ? mmd.processesIncluded.join(" / ") : NOT_PROVIDED },
              {
                label: "Declared exclusions",
                value: mmd.exclusions.length ? mmd.exclusions.map((x) => `${x.process} — ${x.note || "no ground given"}`).join("; ") : "None declared",
              },
              {
                label: "Data gaps declared",
                value: mmd.dataGaps.length
                  ? `${mmd.dataGaps.length} — ${sig(mmd.dataGaps.reduce((a, g) => a + (Number(g.estimatedTCO2e) || 0), 0), 2)} tCO2e estimated`
                  : "None",
              },
            ],
          },
        ],
      },
    ],
  };

  /* ── Part 4 — Summary of products ──────────────────────────── */

  /* SEE(direct) on the communication row is the FULL embedded direct figure —
     the installation's own plus everything carried in from precursors. The
     workbook has no separate precursor column, so it belongs here. */
  const seeDirect = see.seeDirect + see.seePrecursor;
  const seeIndirect = see.seeIndirect;
  const perUnit = unit === "MWh" ? "tCO2e/MWh" : TEMPLATE_UNITS.emissionsPerTonne;

  /** Only the sector-specific parameters that apply to this CN code's
      category — a non-steel product must not print blank %Mn / %Cr / %Ni
      columns just because steel has them. */
  const special = good ? specialParametersFor(good.id) : [];
  const part4Columns = [
    "Production process from which the product arises",
    "Type of aggregated good or precursor",
    "CN Code",
    "CN Name",
    "Product name (as used on invoices)",
    "SEE (direct)",
    "SEE (indirect)",
    "SEE (total)",
    "Unit",
    "Share of emissions by default value",
    "Source for electricity emission factor",
    "Embedded electricity (MWh/t)",
    ...special,
  ];
  const part4Row = [
    text(ws.productName),
    categoryLabel,
    (ws.cnCode || "").replace(/\s+/g, "") || NOT_PROVIDED,
    text(ws.productName),
    text(ws.productName),
    sig(seeDirect),
    sig(seeIndirect),
    sig(seeDirect + seeIndirect),
    perUnit,
    sig(see.precursors.defaultValueShare ?? 0, 3),
    text(mmd.electricitySupply),
    NOT_PROVIDED,
    ...special.map((label) => sectorParameterValue(label, mmd.sectorParameters)),
  ];

  const claimed = Number(cp?.amountPerTonne ?? 0);
  /* F_Tools!H101 takes the covered share as an input, 0-1. Certrace stores it
     as 0-100 (shareOfEmissionsCovered) to match every other pct field in the
     app; an unset value on a legacy/incomplete record still falls back to
     1.0, named as an assumption rather than folded silently into the
     arithmetic — see the note block below. */
  const shareRecorded = cp?.shareOfEmissionsCovered != null;
  const share = shareRecorded ? Math.max(0, Math.min(100, cp!.shareOfEmissionsCovered!)) / 100 : 1;
  const rebate = 0;
  const coveredSE = see.seeTotal * share;
  const due = coveredSE * claimed;
  const rebateDue = coveredSE * rebate;
  const effective = Math.max(0, due - rebateDue);

  const part4: Part = {
    number: 4,
    title: "Summary of products",
    subsections: [
      {
        number: "4.1",
        title: "Per-product summary",
        blocks: [{ kind: "table", columns: part4Columns, rows: [part4Row] }],
      },
      {
        number: "4.2",
        title: "Carbon price and rebate detail",
        blocks: [
          {
            kind: "table",
            caption: `Currency: ${cp?.currency ?? NOT_PROVIDED}`,
            columns: [
              "Production process",
              "Aggregated goods category",
              "SEE (total)",
              "Share of emissions covered by the carbon price",
              "Covered SEE",
              "Carbon price (CP) due (local currency)",
              "Amount of rebate (local currency)",
              "CP due (per produced t or MWh)",
              "Rebate (per produced t or MWh)",
              "Result: Effective CP due (per produced t or MWh)",
            ],
            rows: [
              [
                text(ws.productName),
                categoryLabel,
                sig(see.seeTotal),
                sig(share, 4),
                sig(coveredSE),
                sig(due, 2),
                sig(rebateDue, 2),
                sig(due, 2),
                sig(rebateDue, 2),
                sig(effective, 2),
              ],
            ],
          },
          {
            kind: "text",
            text: shareRecorded
              ? `The share of emissions covered is ${sig(share * 100, 2)}%, as recorded against the carbon price instrument.`
              : "The share of emissions covered is assumed to be 1.0. The EU template asks for the fraction of total specific emissions the domestic " +
                "carbon price actually covers (F_Tools!H101) and this record predates that field. Where the instrument covers only part of these " +
                "emissions — most do — the effective figure above is too high and must not be deducted until the real share is entered.",
          },
        ],
      },
    ],
  };

  /* ── Certrace front matter ─────────────────────────────────── */

  /* Same shape the communication report uses: blocking reasons first, then
     every named missing item. A tab carries `tab`/`blockingReason`/`missing`
     and nothing else — there is no display label on it to reach for. */
  const outstanding: string[] = [];
  for (const t of r.tabs) if (t.blockingReason) outstanding.push(`${t.tab}: ${t.blockingReason}`);
  for (const t of r.tabs) for (const m of t.missing) outstanding.push(`${t.tab}: ${m.label}`);

  const cover = {
    title: `Monitoring Methodology Documentation — ${text(ws.productName)}`,
    subtitle: `${text(ws.installationName)} · reporting period ${text(ws.periodStart)} to ${text(ws.periodEnd)} · operator ${text(org.name)}`,
    draftBanner: draft ? `DRAFT — NOT READY FOR VERIFICATION. ${outstanding[0] ?? "The workspace has outstanding items."}` : null,
    notes: [
      { label: "Completeness at the time of generation", value: `${r.overall} — ${r.percentComplete}% of applicable tabs complete` },
      {
        label: "Outstanding",
        value: outstanding.length ? `${outstanding.length} item(s) — the first ${Math.min(outstanding.length, OUTSTANDING_SHOWN)} are listed below` : "Nothing outstanding",
      },
      { label: "Equivalent to", value: "EU CBAM Communication template for installations v2.1.1 (13 December 2024)" },
      {
        label: "Production quantity",
        value: see.computable
          ? `${sig(see.production.tonnes, 3)} ${unit} across ${see.production.monthsCounted} month(s)`
          : "No production quantity recorded — every per-tonne figure in this report is zero and must not be read as a result",
      },
      { label: "Unit failures", value: see.errors.length ? see.errors.join("; ") : "None" },
    ],
    /* Capped. A twelve-month workspace with nothing uploaded produces some
       three hundred of these, and a cover that runs to four pages is not a
       cover — the Readiness tab is where the whole list belongs. */
    outstanding: outstanding.slice(0, OUTSTANDING_SHOWN),
    /* The arithmetic behind every figure in Part 4. Certrace-specific, so it
       sits BEFORE Part 1 — the contract forbids anything between the parts
       and between Part 4 and the evidence divider, and this is the only slot
       left that does not lose it. */
    workings: see.workings.map((w) => `${w.id}  ${w.label}\n    ${w.formula}\n    ${w.substitution}\n    = ${w.result}`),
  };

  const fileNameSlug = `${ws.productName}-${ws.installationName}-${ws.year}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return { cover, parts: [part1, part2, part3, part4], evidence: planEvidence(ws.id), draft, fileNameSlug };
}

/** Re-exported so a caller sorting or grouping evidence outside this module
    cannot reach for the Documents screen's A-E order by accident. */
export { departmentForFieldKey, EVIDENCE_DEPARTMENT_LABEL };
export { workspaceTitle };
