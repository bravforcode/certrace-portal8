import { accountStorage } from "./account-storage";
/* ════════════════════════════════════════════════════════════
   THE VERIFIER PACK (§A8)

   The definition of done for this whole work stream: a document whose
   arithmetic a verifier can re-perform line by line without asking a single
   follow-up question.

   That sets three rules the builder below follows without exception:

     1. EVERY NUMBER CARRIES ITS UNIT. A bare "0.0345" is not evidence, it is
        a figure someone has to come back and ask about.

     2. THE WORKINGS SHOW formula → substitution → result. Not the answer with
        a formula printed above it — the actual numbers in the actual formula,
        so the verifier re-keys them and lands on the same value. M1 to M10.

     3. AN INCOMPLETE PACK SAYS SO, ON EVERY PAGE. `overall !== "complete"`
        stamps DRAFT — NOT READY FOR VERIFICATION across the header and into
        the print styles. A pack that looks final and isn't is worse than no
        pack: it gets sent, and the gap is found by the person it was sent to.

   Gated on `overall !== "blocked"`. A blocked workspace has arithmetic that
   cannot be performed — shipped exceeding produced, a fuel with no NCV — and
   assembling a pack around it would put a wrong number under the exporter's
   letterhead.
   ════════════════════════════════════════════════════════════ */

import { downloadFile } from "./download";
import {
  getCarbonPrice,
  shareFraction,
  CARBON_PRICE_CLAIMED_NOTE,
  CARBON_PRICE_INSTRUMENT_LABEL,
} from "./carbon-price";
import { getOrgIdentity } from "./org";
import {
  fuelTypeLabel,
  monthResult,
  monthsForWorkspace,
  MONTH_STATUS_LABEL,
  monthCounts,
} from "./monthly-data";
import { DATA_ORIGIN_LABEL } from "./precursor-suppliers";
import {
  materiality,
  workspaceReadiness,
  TAB_LABEL,
  TAB_STATE_LABEL,
  type WorkspaceReadiness,
} from "./readiness";
import {
  reconcileMass,
  shipmentsForWorkspace,
  shippedTonnesForWorkspace,
} from "./shipments";
import {
  annualEvidence,
  CARBON_PRICE_KEY,
  EVIDENCE_SOURCE_LABEL,
  evidenceForMonth,
  isReviewed,
  listEvidence,
} from "./workspace-evidence";
import {
  finalVersionCovering,
  loadDraft,
  /* DIRECT_METHOD_LABEL is for ONE ROW. The document-level line uses
     `directMethodSummary`, because the method is per source stream (Annex II
     B.2, IR (EU) 2025/2547) and a boundary can carry both. */
  DIRECT_METHOD_LABEL,
  directMethodSummary,
  QUALITY_ASSURANCE_LABEL,
  FACTOR_SOURCE_LABEL,
  exclusionGroundLabel,
  electricitySupplyLabel,
  isOwnGeneration,
  migrateMmd,
  readingFrequencyLabel,
} from "./workspace-mmd";
import { workspaceSEE } from "./workspace-see";
import {
  monthName,
  routeLabel,
  workspaceTitle,
  type VerificationWorkspace,
} from "./workspace";

const esc = (v: unknown): string =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const num = (v: number, dp = 2): string =>
  Number.isFinite(v)
    ? v.toLocaleString("en-GB", {
        minimumFractionDigits: 0,
        maximumFractionDigits: dp,
      })
    : "—";

const dash = (v: string | null | undefined): string =>
  v && String(v).trim() ? esc(v) : "—";

/** Print-optimised, self-contained. No external stylesheet, no webfont — the
    pack is opened from a downloads folder, often offline, sometimes printed
    straight to PDF by somebody who has never seen the portal. */
const STYLE = `
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, "Segoe UI", Helvetica, Arial, sans-serif;
         color: #111; background: #fff; margin: 0; padding: 24px; line-height: 1.5; font-size: 12px; }
  .wrap { max-width: 900px; margin: 0 auto; }
  h1 { font-size: 22px; font-weight: 300; letter-spacing: -0.02em; margin: 0 0 4px; }
  h2 { font-size: 14px; font-weight: 500; margin: 28px 0 8px; padding-bottom: 6px;
       border-bottom: 1px solid #ddd; page-break-after: avoid; }
  h3 { font-size: 12px; font-weight: 600; margin: 16px 0 6px; }
  .eyebrow { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #666; }
  .lead { color: #444; margin: 4px 0 0; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 4px; page-break-inside: auto; }
  th, td { text-align: left; padding: 5px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
  th { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: #555; border-bottom: 1px solid #ccc; }
  td.n, th.n { text-align: right; font-variant-numeric: tabular-nums; }
  tr { page-break-inside: avoid; }
  .kv { display: grid; grid-template-columns: 200px 1fr; gap: 2px 12px; margin: 6px 0; }
  .kv dt { color: #666; }
  .kv dd { margin: 0; }
  .work { border: 1px solid #e5e5e5; border-radius: 6px; padding: 10px 12px; margin: 8px 0; page-break-inside: avoid; }
  .work .id { font-weight: 600; }
  .work .formula, .work .sub, .work .res { font-family: ui-monospace, "SFMono-Regular", Menlo, monospace; font-size: 11px; }
  .work .formula { color: #555; }
  .work .sub { color: #222; margin-top: 3px; }
  .work .res { margin-top: 3px; font-weight: 600; }
  .note { background: #faf9f7; border-left: 3px solid #ccc; padding: 8px 12px; margin: 8px 0; color: #444; }
  .warn { background: #fffbeb; border-left-color: #d97706; }
  .draft { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
           padding: 10px 14px; border-radius: 6px; margin: 12px 0 0; font-weight: 600; }
  .muted { color: #777; }
  .indent-1 { padding-left: 16px; } .indent-2 { padding-left: 32px; }
  .indent-3 { padding-left: 48px; } .indent-4 { padding-left: 64px; }
  .pill { display: inline-block; border: 1px solid #ddd; border-radius: 999px; padding: 1px 8px; font-size: 10px; }
  footer { margin-top: 32px; padding-top: 10px; border-top: 1px solid #ddd; color: #777; font-size: 10px; }
  @media print { body { padding: 0; } .no-print { display: none; } }
`;

export type PackResult = { html: string; fileName: string; draft: boolean };

export class PackBlockedError extends Error {
  /* Written as an explicit field rather than a parameter property: the repo's
     test runner strips types without transforming, and a parameter property
     is syntax it cannot strip. */
  readonly reasons: string[];

  constructor(reasons: string[]) {
    super("The verifier pack cannot be assembled while a tab is blocked.");
    this.name = "PackBlockedError";
    this.reasons = reasons;
  }
}

export function buildVerifierPack(
  ws: VerificationWorkspace,
  readiness?: WorkspaceReadiness,
): PackResult {
  const r = readiness ?? workspaceReadiness(ws);

  if (r.overall === "blocked") {
    throw new PackBlockedError(
      r.tabs
        .filter((t) => t.state === "blocked")
        .map((t) => `${TAB_LABEL[t.tab]}: ${t.blockingReason ?? "blocked"}`),
    );
  }

  const draft = r.overall !== "complete";
  const org = getOrgIdentity();
  const see = workspaceSEE(ws);
  const entries = monthsForWorkspace(ws);
  const counted = entries.filter(monthCounts);
  const mmd = finalVersionCovering(ws.id, ws.periodStart, ws.periodEnd);
  /* A version finalised before the boundary section became ordered-plus-
     justified is an immutable snapshot in the old shape — that is the whole
     point of stamping it. So the pack migrates it on READ rather than editing
     the stored version, and a v1 from last year still renders. */
  const mmdContent = mmd
    ? migrateMmd(mmd.content, ws.periodStart, ws.periodEnd)
    : loadDraft(ws.id, ws.periodStart, ws.periodEnd);
  const price = getCarbonPrice(ws.id);
  /* The receipt is attached on the Evidence tab against the `carbon-price` key and the record's own pointer is only set for one linked directly —
     the pack reads both, as readiness does, or it reports "not attached" beside a receipt that is. */
  const carbonReceipt =
    Boolean(price.evidenceItemId) ||
    listEvidence(ws.id).some((i) => i.fieldKeys.includes(CARBON_PRICE_KEY.key));
  const mat = materiality(ws);
  const shipments = shipmentsForWorkspace(ws.id);
  const shipped = shippedTonnesForWorkspace(ws.id);
  const recon = reconcileMass(
    shipped,
    see.production.tonnes > 0 ? see.production.tonnes : null,
  );

  const parts: string[] = [];

  /* 1 · Identity */
  parts.push(`
    <header>
      <div class="eyebrow">Verification pack · CBAM</div>
      <h1>${esc(workspaceTitle(ws))}</h1>
      <p class="lead">${esc(org.name)} · installation ${esc(ws.installationName)} · reporting year ${ws.year}</p>
      ${draft ? `<div class="draft">DRAFT — NOT READY FOR VERIFICATION. ${r.tabs.filter((t) => t.state === "incomplete").length} tab(s) still incomplete; the figures below are provisional.</div>` : ""}
    </header>

    <h2>1 · Identity</h2>
    <dl class="kv">
      <dt>Operator</dt><dd>${esc(org.name)}</dd>
      <dt>Operator reference</dt><dd>${dash(org.installationId)}</dd>
      <dt>Country of origin</dt><dd>${dash(org.origin)}</dd>
      <dt>Installation</dt><dd>${esc(ws.installationName)} (${esc(ws.installationId)})</dd>
      <dt>Good</dt><dd>${esc(ws.productName)}</dd>
      <dt>CN code</dt><dd>${dash(ws.cnCode)}</dd>
      <dt>Production route</dt><dd>${esc(routeLabel(ws.productionRoute))}</dd>
      <dt>Reporting period</dt><dd>${esc(ws.periodStart)} to ${esc(ws.periodEnd)}</dd>
      <dt>Declarations served</dt><dd>${ws.declarationIds.length > 0 ? esc(ws.declarationIds.join(", ")) : "—"}</dd>
      <dt>Pack generated</dt><dd>${esc(new Date().toISOString().slice(0, 19).replace("T", " "))} UTC</dd>
    </dl>`);

  /* 2 · Final MMD */
  parts.push(`
    <h2>2 · Monitoring methodology (MMD)</h2>
    ${
      mmd
        ? `<p class="muted">Version ${mmd.n}, finalised ${esc(mmd.finalisedAt.slice(0, 10))} by ${esc(mmd.author)}. Covers ${esc(mmd.periodStart)} to ${esc(mmd.periodEnd)}.</p>`
        : `<div class="note warn">No final MMD covers this period — the methodology below is taken from the current draft and has not been stamped.</div>`
    }
    <dl class="kv">
      <dt>Boundary</dt><dd>${dash(mmdContent.boundaryDescription)}</dd>
      <dt>Processes included</dt><dd>${
        mmdContent.processesIncluded.length
          ? // Numbered, because the order IS the claim: this is the sequence
            // material moves through the boundary, not an unordered set.
            esc(
              mmdContent.processesIncluded
                .map((p, i) => `${i + 1}. ${p}`)
                .join("  →  "),
            )
          : "—"
      }</dd>
      <dt>Processes excluded</dt><dd>${
        mmdContent.exclusions.length
          ? mmdContent.exclusions
              .map(
                (x) =>
                  `${esc(x.process)} — ${esc(exclusionGroundLabel(x))}${x.note.trim() ? `: ${esc(x.note)}` : ' <span class="warn-inline">(no ground given)</span>'}`,
              )
              .join("<br>")
          : "None declared"
      }</dd>
      <dt>Reporting period</dt><dd>${esc(mmdContent.periodStart)} to ${esc(mmdContent.periodEnd)}</dd>
      <dt>Direct method</dt><dd>${esc(directMethodSummary(mmdContent))}</dd>
      <dt>Fuel types</dt><dd>${
        mmdContent.fuelTypeIds.length || mmdContent.fuelTypesOther.trim()
          ? esc(
              [
                ...mmdContent.fuelTypeIds
                  .filter((f) => f !== "other")
                  .map((f) => fuelTypeLabel(f)),
                mmdContent.fuelTypesOther.trim(),
              ]
                .filter(Boolean)
                .join(", "),
            )
          : "—"
      }</dd>
      <dt>Electricity source</dt><dd>${esc(electricitySupplyLabel(mmdContent.electricitySupply, mmdContent.electricitySupplyOther))}${
        mmdContent.electricityMeteringPoint.trim()
          ? ` · ${esc(mmdContent.electricityMeteringPoint)}`
          : ""
      }</dd>
      <dt>Quality assurance</dt><dd>${esc(QUALITY_ASSURANCE_LABEL[mmdContent.qualityAssurance])}${mmdContent.reviewerName ? ` · reviewer ${esc(mmdContent.reviewerName)}` : ""}${mmdContent.reviewFrequency ? ` · ${esc(mmdContent.reviewFrequency)}` : ""}</dd>
      <dt>Installation diagram</dt><dd>${dash(mmdContent.diagramFileName)}</dd>
    </dl>

    <h3>Measurement methods</h3>
    <table>
      <thead><tr><th>Measures</th><th>Method</th><th>Parameter</th><th>Instrument</th><th>Reading frequency</th><th>Last calibration</th><th>Factor source</th><th>CEMS reference &amp; measurement point</th></tr></thead>
      <tbody>${(() => {
        /* Fuels and electricity are separate lists now, and the pack says
             WHICH a row belongs to — a verifier sampling "the fuel meters"
             should not have to infer it from the parameter name. The CEMS
             column stays empty unless the row actually carries one.

             The METHOD column is per row for the same reason the field is:
             Annex II B.2 of IR (EU) 2025/2547 lets the two be combined per
             source stream, so "which of these is the CEMS" is a question the
             table has to answer rather than one summarised away above it. */
        const rows: {
          kind: string;
          m: (typeof mmdContent.fuelInstruments)[number];
        }[] = [
          ...mmdContent.fuelInstruments.map((m) => ({ kind: "Fuel", m })),
          ...mmdContent.electricityInstruments.map((m) => ({
            kind: "Electricity",
            m,
          })),
        ];
        if (rows.length === 0)
          return `<tr><td colspan="8" class="muted">No measurement methods recorded.</td></tr>`;
        return rows
          .map(({ kind, m }) => {
            const cems = [m.cemsCalibrationRef, m.measurementPointLocation]
              .filter((v) => v && String(v).trim())
              .join(" · ");
            const method = DIRECT_METHOD_LABEL[m.directMethod ?? "calculation"];
            return `<tr><td>${esc(kind)}</td><td>${esc(method)}</td><td>${dash(m.parameter)}</td><td>${dash(m.instrument)}</td><td>${dash(readingFrequencyLabel(m.readingFrequency, m.readingFrequencyOther))}</td><td>${dash(m.lastCalibration)}</td><td>${esc(FACTOR_SOURCE_LABEL[m.factorSource])}</td><td>${dash(cems)}</td></tr>`;
          })
          .join("");
      })()}</tbody>
    </table>
    ${
      mmdContent.electricitySupply &&
      isOwnGeneration(mmdContent.electricitySupply)
        ? `<p class="note${mmdContent.ownGenerationFuelDeclared ? "" : " warn"}">
             <strong>On-site generation.</strong> ${
               mmdContent.ownGenerationFuelDeclared
                 ? "The operator confirms the fuel burned by this generation is declared in the fuel list above and is not also reported as purchased electricity."
                 : "NOT CONFIRMED. The operator has not confirmed that the fuel burned by this generation is in the fuel list — check for a double count, or for the fuel being missing entirely."
             }
           </p>`
        : ""
    }

    <h3>Data gaps</h3>
    <table>
      <thead><tr><th>Period</th><th>Reason</th><th>Estimation method</th><th class="n">Estimated</th></tr></thead>
      <tbody>${
        mmdContent.dataGaps.length
          ? mmdContent.dataGaps
              .map(
                (g) =>
                  `<tr><td>${dash(g.periodStart)} to ${dash(g.periodEnd)}</td><td>${dash(g.reason)}</td><td>${dash(g.estimationMethod)}</td><td class="n">${num(g.estimatedTCO2e, 2)} tCO₂e</td></tr>`,
              )
              .join("")
          : `<tr><td colspan="4" class="muted">No data gaps recorded — every month is primary data.</td></tr>`
      }</tbody>
    </table>`);

  /* 3 · The 12-month table */
  parts.push(`
    <h2>3 · Monthly activity data</h2>
    <p class="muted">${see.production.monthsCounted} of 12 months submitted. Only submitted and reviewed months contribute to the annual figures below.</p>
    <table>
      <thead>
        <tr>
          <th>Month</th><th>Status</th><th class="n">Production</th><th>Fuels</th>
          <th class="n">Fuel CO₂</th><th class="n">Process CO₂</th>
          <th class="n">Electricity</th><th class="n">Elec. factor</th><th class="n">Electricity CO₂</th>
        </tr>
      </thead>
      <tbody>${entries
        .map((e) => {
          const res = monthResult(e);
          const fuels = e.fuels.length
            ? e.fuels
                .map(
                  (f) =>
                    `${esc(fuelTypeLabel(f.fuelType))} ${num(f.quantity, 2)} ${esc(f.unit)}${f.ncvMjPerUnit ? ` · NCV ${num(f.ncvMjPerUnit, 3)} MJ/${esc(f.unit)}` : ""} · EF ${num(f.efTco2PerGj, 4)} tCO₂/GJ`,
                )
                .join("<br>")
            : `<span class="muted">none</span>`;
          return `<tr${monthCounts(e) ? "" : ' class="muted"'}>
            <td>${esc(monthName(e.month))}</td>
            <td>${esc(MONTH_STATUS_LABEL[e.status])}</td>
            <td class="n">${num(e.productionTonnes, 3)} t</td>
            <td>${fuels}</td>
            <td class="n">${num(res.fuelTCO2, 2)} tCO₂</td>
            <td class="n">${num(res.processTCO2, 2)} tCO₂</td>
            <td class="n">${num(e.electricityMwh, 3)} MWh</td>
            <td class="n">${num(e.electricityFactorTco2PerMwh, 4)} tCO₂/MWh</td>
            <td class="n">${num(res.indirectTCO2, 2)} tCO₂</td>
          </tr>`;
        })
        .join("")}
      </tbody>
      <tfoot>
        <tr>
          <th>Total (counted)</th><th>${counted.length} months</th>
          <th class="n">${num(see.production.tonnes, 3)} t</th><th></th>
          <th class="n">${num(see.fuelTCO2, 2)} tCO₂</th>
          <th class="n">${num(see.processTCO2, 2)} tCO₂</th>
          <th class="n">${num(
            counted.reduce((a, m) => a + m.electricityMwh, 0),
            3,
          )} MWh</th>
          <th></th>
          <th class="n">${num(see.indirectTCO2, 2)} tCO₂</th>
        </tr>
      </tfoot>
    </table>
    ${
      see.production.complete
        ? ""
        : `<div class="note warn">${see.production.missingMonths.length} month(s) not submitted: ${esc(see.production.missingMonths.map(monthName).join(", "))}. The annual production figure is INCOMPLETE, not smaller — every per-tonne figure below is understated in its denominator until they are entered.</div>`
    }
    ${
      mmdContent.dataGaps.length > 0
        ? ""
        : see.production.complete
          ? ""
          : `<div class="note">Months absent from the table above need a matching entry in the MMD's data-gap register.</div>`
    }`);

  /* 4 · Calculation workings, M1–M10 */
  parts.push(`
    <h2>4 · Calculation workings</h2>
    <p class="muted">Formula, substitution and result for each step. Numerator and denominator are aggregated separately and divided once — monthly SEE figures are never averaged.</p>
    ${see.workings
      .map(
        (w) => `<div class="work">
          <div><span class="id">${esc(w.id)}</span> — ${esc(w.label)}</div>
          <div class="formula">${esc(w.formula)}</div>
          <div class="sub">= ${esc(w.substitution)}</div>
          <div class="res">= ${esc(w.result)}</div>
        </div>`,
      )
      .join("")}
    ${
      see.errors.length
        ? `<div class="note warn"><strong>Rows the arithmetic refused:</strong><br>${see.errors.map(esc).join("<br>")}</div>`
        : ""
    }
    <div class="note">Indirect emissions are ${see.indirectCounted ? "INCLUDED in" : "REPORTED but EXCLUDED from"} the chargeable figure for ${esc(ws.productName)} (${see.indirectCounted ? "not an Annex II sector" : "Annex II sector — direct emissions only"}).</div>`);

  /* 5 · Precursor tree */
  parts.push(`
    <h2>5 · Precursor chain</h2>
    ${
      see.precursors.byNode.length === 0
        ? `<p class="muted">No precursor suppliers recorded.</p>`
        : `<table>
            <thead><tr><th>Supplier / precursor</th><th>Installation</th><th class="n">Ratio</th><th class="n">SEE</th><th class="n">Contribution</th><th>Data origin</th><th>Weakest in chain</th></tr></thead>
            <tbody>${see.precursors.byNode
              .map(
                (nde) => `<tr>
                  <td class="indent-${Math.min(4, nde.depth - 1)}">${esc(nde.name || "—")}${nde.precursorName ? ` · <span class="muted">${esc(nde.precursorName)}</span>` : ""}</td>
                  <td>${esc(nodeInstallation(ws.id, nde.id))}</td>
                  <td class="n">${nde.ratio == null ? "—" : `${num(nde.ratio, 4)} t/t`}</td>
                  <td class="n">${nde.isScrap ? "0 (scrap)" : `${num(nde.see, 4)} tCO₂e/t`}</td>
                  <td class="n">${num(nde.contribution, 4)} tCO₂e/t</td>
                  <td>${esc(DATA_ORIGIN_LABEL[nde.dataOrigin])}</td>
                  <td>${esc(DATA_ORIGIN_LABEL[nde.weakestOrigin])}</td>
                </tr>`,
              )
              .join("")}</tbody>
          </table>
          <dl class="kv">
            <dt>Precursor contribution</dt><dd>${num(see.seePrecursor, 4)} tCO₂e per tonne of ${esc(ws.productName)}</dd>
            <dt>Default-value share</dt><dd>${num(see.precursors.defaultValueShare * 100, 1)}% (cap 20%)</dd>
          </dl>
          <div class="note">A chain is only as verified as its weakest link — the final column propagates the weakest data origin upward, which is what a verifier tests on a complex good.</div>`
    }`);

  /* 6 · Evidence index, grouped by month */
  parts.push(`
    <h2>6 · Evidence index</h2>
    <table>
      <thead><tr><th>Month</th><th>Document</th><th>Type</th><th>Substantiates</th><th>Reviewed</th><th>Captured</th></tr></thead>
      <tbody>${(() => {
        const rows: string[] = [];
        for (const e of entries) {
          for (const item of evidenceForMonth(ws.id, e.month)) {
            rows.push(
              `<tr><td>${esc(monthName(e.month))}</td><td>${esc(item.fileName)}</td><td>${esc(EVIDENCE_SOURCE_LABEL[item.sourceType])}</td><td>${esc(item.fieldKeys.join(", "))}</td><td>${isReviewed(item) ? "Yes" : "<strong>No</strong>"}</td><td>${esc(item.capturedAt.slice(0, 10))}</td></tr>`,
            );
          }
        }
        for (const item of annualEvidence(ws.id)) {
          rows.push(
            `<tr><td>Annual</td><td>${esc(item.fileName)}</td><td>${esc(EVIDENCE_SOURCE_LABEL[item.sourceType])}</td><td>${esc(item.fieldKeys.join(", "))}</td><td>${isReviewed(item) ? "Yes" : "<strong>No</strong>"}</td><td>${esc(item.capturedAt.slice(0, 10))}</td></tr>`,
          );
        }
        return rows.length
          ? rows.join("")
          : `<tr><td colspan="6" class="muted">No evidence attached.</td></tr>`;
      })()}</tbody>
    </table>
    <div class="note">"Reviewed = No" means an AI extraction proposed values that nobody has accepted yet. Those documents do not count toward evidence coverage — a figure is evidence only once a human tied it to the document.</div>`);

  /* 7 · Shipments and mass reconciliation */
  parts.push(`
    <h2>7 · Shipments and mass reconciliation</h2>
    <table>
      <thead><tr><th>Date</th><th>Reference</th><th>Buyer</th><th>Buyer EORI</th><th class="n">Net mass</th><th class="n">Embedded</th></tr></thead>
      <tbody>${
        shipments.length
          ? shipments
              .map(
                (s) =>
                  `<tr><td>${esc(s.date)}</td><td>${dash(s.invoiceRef)}</td><td>${esc(s.buyer)}</td><td>${dash(s.buyerEori)}</td><td class="n">${num(s.quantityTonnes, 3)} t</td><td class="n">${num(s.quantityTonnes * see.seeChargeable, 3)} tCO₂e</td></tr>`,
              )
              .join("")
          : `<tr><td colspan="6" class="muted">No shipments assigned to this product report.</td></tr>`
      }</tbody>
      <tfoot><tr><th colspan="4">Total</th><th class="n">${num(shipped, 3)} t</th><th class="n">${num(shipped * see.seeChargeable, 3)} tCO₂e</th></tr></tfoot>
    </table>
    <dl class="kv">
      <dt>Shipped</dt><dd>${num(shipped, 3)} t</dd>
      <dt>Produced</dt><dd>${see.production.tonnes > 0 ? `${num(see.production.tonnes, 3)} t` : "—"}</dd>
      <dt>Ratio</dt><dd>${recon.ratio == null ? "—" : `${num(recon.ratio * 100, 2)}%`}</dd>
    </dl>
    <div class="note${recon.level === "error" ? " warn" : ""}">${esc(recon.message)}</div>`);

  /* 8 · Carbon price */
  parts.push(`
    <h2>8 · Carbon price paid in the country of origin</h2>
    <dl class="kv">
      <dt>Amount</dt><dd>${num(price.amountPerTonne, 2)} ${esc(price.currency)} per tCO₂e</dd>
      <dt>Instrument</dt><dd>${esc(CARBON_PRICE_INSTRUMENT_LABEL[price.instrument])}</dd>
      <dt>Share of emissions covered</dt><dd>${price.amountPerTonne > 0 ? (shareFraction(price) == null ? "<strong>Not recorded</strong>" : `${num((shareFraction(price) ?? 0) * 100, 1)}%`) : "Not required (nothing claimed)"}</dd>
      <dt>Rebates / free allocation</dt><dd>${dash(price.rebates)}${price.rebateAmountPerTonne ? ` — ${num(price.rebateAmountPerTonne, 2)} ${esc(price.currency)} per tCO₂e` : ""}</dd>
      <dt>Charged under</dt><dd>${price.amountPerTonne > 0 ? dash(price.legalBasis) : "Not required (nothing claimed)"}</dd>
      <dt>Payment certified by</dt><dd>${price.amountPerTonne > 0 ? dash(price.certifiedBy) : "Not required (nothing claimed)"}</dd>
      <dt>Payment evidence</dt><dd>${carbonReceipt ? "Attached — see the evidence index" : price.amountPerTonne > 0 ? "<strong>Not attached</strong>" : "Not required (nothing claimed)"}</dd>
      <dt>Recorded</dt><dd>${price.recorded ? esc(price.updatedAt.slice(0, 10)) : "Not yet recorded"}</dd>
    </dl>
    <div class="note">${esc(CARBON_PRICE_CLAIMED_NOTE)}</div>`);

  /* 9 · Materiality self-check */
  parts.push(`
    <h2>9 · Materiality self-check</h2>
    <dl class="kv">
      <dt>Estimated emissions</dt><dd>${num(mat.estimatedTCO2e, 2)} tCO₂e</dd>
      <dt>Total emissions</dt><dd>${num(mat.totalTCO2e, 2)} tCO₂e</dd>
      <dt>Estimated share</dt><dd>${num(mat.share * 100, 2)}% (threshold 5%)</dd>
      <dt>Result</dt><dd>${mat.overThreshold ? "<strong>Over threshold</strong>" : "Within threshold"}</dd>
    </dl>

    <h2>10 · Readiness at time of issue</h2>
    <table>
      <thead><tr><th>Tab</th><th>State</th><th>Outstanding</th></tr></thead>
      <tbody>${r.tabs
        .map(
          (t) =>
            `<tr><td>${esc(TAB_LABEL[t.tab])}</td><td>${esc(TAB_STATE_LABEL[t.state])}</td><td>${
              t.missing.length
                ? t.missing.map((m) => esc(m.label)).join("<br>")
                : `<span class="muted">—</span>`
            }</td></tr>`,
        )
        .join("")}</tbody>
    </table>
    <p class="muted">${r.percentComplete}% of applicable tabs complete. This percentage is descriptive only and is never used as a gate.</p>`);

  const title = `${workspaceTitle(ws)} — Verifier pack${draft ? " (DRAFT)" : ""}`;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>${STYLE}</style>
</head><body><div class="wrap">
${parts.join("\n")}
<footer>
  Generated by Certrace · ${esc(workspaceTitle(ws))} · ${draft ? "DRAFT — NOT READY FOR VERIFICATION" : "Complete"}<br>
  Every figure in this pack is derived from the monthly activity data recorded in the workspace. Section 4 shows the arithmetic in full so it can be re-performed independently.
</footer>
</div></body></html>`;

  const slug = `${ws.productName}-${ws.installationName}-${ws.year}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return {
    html,
    fileName: `verifier-pack-${slug}${draft ? "-draft" : ""}.html`,
    draft,
  };
}

/* The installation behind a precursor node. Looked up rather than carried on
   NodeContribution, because the contribution type is the calculation's
   output and installation is identity — mixing them would put a display
   concern inside the arithmetic. */
function nodeInstallation(workspaceId: string, nodeId: string): string {
  if (typeof window === "undefined") return "—";
  try {
    const raw = accountStorage.getItem("certrace:precursor-suppliers");
    if (!raw) return "—";
    const store = JSON.parse(raw) as Record<
      string,
      { id: string; installationName?: string; country?: string }[]
    >;
    const row = (store[workspaceId] ?? []).find((s) => s.id === nodeId);
    if (!row) return "—";
    return (
      [row.installationName, row.country].filter(Boolean).join(", ") || "—"
    );
  } catch {
    return "—";
  }
}

export function downloadVerifierPack(
  ws: VerificationWorkspace,
  readiness?: WorkspaceReadiness,
): PackResult {
  const pack = buildVerifierPack(ws, readiness);
  downloadFile(pack.fileName, pack.html, "text/html");
  return pack;
}
