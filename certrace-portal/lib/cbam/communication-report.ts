/* ════════════════════════════════════════════════════════════
   OUTPUT 1 — THE COMMUNICATION REPORT

   The same information the EU "CBAM Communication template for installations"
   carries, rendered in the Certrace design system, with the arithmetic shown.

   THE TEST THIS HAS TO PASS: a verifier with the workbook open beside this
   document can check the two against each other field by field and find no
   difference — not "no material difference", none. That is why every section
   below prints its workbook coordinate (`Summary_Products!I`, `A_InstData 2.0
   (ii)`) and why the closed lists come from lib/cbam/template-reference.ts
   verbatim rather than being rewritten to read better.

   WHAT THIS ADDS OVER THE WORKBOOK, and the reason it exists at all: the
   spreadsheet shows a verifier the ANSWER. A green cell reading 1.311 is the
   output of a formula chain across five sheets, and checking it means
   unhiding InputOutput, reading MINVERSE, and reconstructing what fed it. So
   §4 here prints formula → substitution → result for every figure, and every
   heading carries a plain-language note saying what the number is for. The
   verifier re-keys the substitution line and lands on the same value, or they
   do not, and either way it took a minute.

   DRAFT IS STAMPED, LOUDLY. A report assembled from an incomplete workspace
   still generates — refusing to produce one just means somebody rebuilds it
   by hand in Excel — but it says on every page that it is not ready, because
   the failure mode of a clean-looking incomplete pack is that it gets sent.
   ════════════════════════════════════════════════════════════ */

import { downloadFile } from "../download";
import {
  getCarbonPrice,
  shareFraction,
  CARBON_PRICE_INSTRUMENT_LABEL,
} from "../carbon-price";
import { getInstallation } from "../installations";
import { getOrgIdentity } from "../org";
import { workspaceReadiness, type WorkspaceReadiness } from "../readiness";
import { workspaceSEE } from "../workspace-see";
import {
  directMethodSummary,
  finalVersionCovering,
  loadDraft,
  migrateMmd,
} from "../workspace-mmd";
import {
  goodsCategory,
  routeLabel,
  workspaceTitle,
  type VerificationWorkspace,
} from "../workspace";
import {
  COMMUNICATION_COLUMNS,
  ELECTRICITY_EF_SOURCES,
  TEMPLATE_UNITS,
  categoryForCn,
  indirectApplies,
  specialParametersFor,
} from "./template-reference";

/* ── Formatting ─────────────────────────────────────────────────
   Two rules, both about being re-keyable rather than pretty.

   `sig` keeps four decimals because that is the precision the workbook's own
   example row carries (0.915 / 0.396 / 1.311) and a figure rounded further
   cannot be reconciled against it.

   Nothing rounds before it is printed. Rounding in the middle drifts the
   verifier's recomputation in the fourth decimal, which is exactly the
   discrepancy that turns a half-day review into a week. */
const esc = (v: unknown): string =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const sig = (v: number, dp = 4): string =>
  Number.isFinite(v)
    ? v.toLocaleString("en-GB", {
        minimumFractionDigits: 0,
        maximumFractionDigits: dp,
      })
    : "—";

const dash = (v: string | null | undefined): string =>
  v && String(v).trim() ? esc(v) : "—";

/* ── The design system, inlined ─────────────────────────────────
   Certrace tokens: #3C7ACB primary, #f5f4f0 ground, #111 ink. No webfont
   link — the report is opened from a downloads folder, often offline, and a
   font that fails to load silently re-flows a document somebody is about to
   print to PDF and send to a regulator. The stack names the brand faces first
   so they are used where installed and degrade to system faces where not.

   IBM Plex Sans Thai, not Noto: the brand book specifies it, and the two have
   different metrics, so a mixed-script line breaks differently under each. */
const STYLE = `
  @page { size: A4; margin: 15mm 13mm; }
  * { box-sizing: border-box; }
  :root {
    --ink: #111; --ink-2: #444; --ink-3: #6b6b6b; --ink-4: #8a8a8a;
    --line: #e6e4de; --line-2: #d3d0c8; --ground: #f5f4f0; --paper: #fff;
    --primary: #3C7ACB; --warn: #d97706; --err: #b91c1c; --ok: #15803d;
  }
  body { font-family: "Outfit", "IBM Plex Sans Thai", ui-sans-serif, system-ui, "Segoe UI", Helvetica, Arial, sans-serif;
         color: var(--ink); background: var(--ground); margin: 0; padding: 20px 16px; line-height: 1.55; font-size: 12px; }
  .wrap { max-width: 940px; margin: 0 auto; background: var(--paper); padding: 28px 30px 34px; border-radius: 14px; }
  h1 { font-family: "Chillax", "Outfit", ui-sans-serif, system-ui, sans-serif;
       font-size: 25px; font-weight: 300; letter-spacing: -0.02em; margin: 0 0 6px; }
  h2 { font-size: 14px; font-weight: 500; margin: 30px 0 4px; padding-bottom: 6px;
       border-bottom: 1px solid var(--line-2); page-break-after: avoid; }
  h3 { font-size: 12px; font-weight: 600; margin: 18px 0 4px; page-break-after: avoid; }
  .eyebrow { font-size: 9.5px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-4); }
  .lead { color: var(--ink-2); margin: 4px 0 0; max-width: 62ch; }
  /* The plain-language note under every heading. This is the half of the
     document the spreadsheet does not have. */
  .why { color: var(--ink-3); font-size: 11px; margin: 4px 0 10px; max-width: 78ch; }
  .ref { font-family: ui-monospace, "SFMono-Regular", Menlo, monospace; font-size: 9.5px;
         color: var(--primary); background: rgba(60,122,203,0.07); border-radius: 4px; padding: 1px 5px; white-space: nowrap; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 4px; }
  th, td { text-align: left; padding: 5px 8px; border-bottom: 1px solid var(--line); vertical-align: top; }
  th { font-size: 9.5px; letter-spacing: 0.07em; text-transform: uppercase; color: var(--ink-3);
       border-bottom: 1px solid var(--line-2); font-weight: 500; }
  td.n, th.n { text-align: right; font-variant-numeric: tabular-nums;
               font-family: ui-monospace, "SFMono-Regular", Menlo, monospace; }
  tr { page-break-inside: avoid; }
  /* Wide tables scroll on a phone instead of forcing the page sideways, and
     print at full width. The communication table is 12 columns — it is never
     going to fit 375px, and squeezing it there would make it unreadable
     rather than merely wide. */
  .scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 8px -4px; padding: 0 4px; }
  .scroll table { min-width: 780px; }
  .kv { display: grid; grid-template-columns: minmax(150px, 240px) 1fr; gap: 3px 14px; margin: 8px 0; }
  .kv dt { color: var(--ink-3); }
  .kv dd { margin: 0; }
  .work { border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; margin: 8px 0; page-break-inside: avoid; background: #fbfaf8; }
  .work .id { font-weight: 600; font-size: 11px; }
  .work .lbl { color: var(--ink-3); font-size: 11px; }
  .work .formula, .work .sub, .work .res { font-family: ui-monospace, "SFMono-Regular", Menlo, monospace; font-size: 10.5px; word-break: break-word; }
  .work .formula { color: var(--ink-3); margin-top: 5px; }
  .work .sub { color: var(--ink); margin-top: 3px; }
  .work .res { margin-top: 3px; font-weight: 600; color: var(--primary); }
  .note { background: #faf9f7; border-left: 3px solid var(--line-2); padding: 8px 12px; margin: 10px 0; color: var(--ink-2); }
  .warn { background: #fffbeb; border-left-color: var(--warn); }
  .draft { background: #fef2f2; border: 1px solid #fecaca; color: var(--err);
           padding: 10px 14px; border-radius: 8px; margin: 14px 0 0; font-weight: 600; }
  .muted { color: var(--ink-4); }
  .pill { display: inline-block; border: 1px solid var(--line-2); border-radius: 999px; padding: 1px 8px; font-size: 9.5px; color: var(--ink-3); }
  footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid var(--line-2); color: var(--ink-4); font-size: 10px; }
  @media (max-width: 620px) {
    body { padding: 10px 8px; font-size: 12.5px; }
    .wrap { padding: 18px 14px 24px; border-radius: 10px; }
    h1 { font-size: 21px; }
    /* A two-column definition list at 375px gives each side ~150px and wraps
       every value onto three lines. Stacked, each pair reads as a unit. */
    .kv { grid-template-columns: 1fr; gap: 0 0; }
    .kv dt { margin-top: 8px; font-size: 10.5px; }
  }
  @media print {
    body { background: #fff; padding: 0; }
    .wrap { padding: 0; border-radius: 0; max-width: none; }
    .scroll { overflow: visible; } .scroll table { min-width: 0; }
    .no-print { display: none; }
  }
`;

export type ReportResult = { html: string; fileName: string; draft: boolean };

/** The report as a fragment — no `<html>`/`<head>`/`<body>` shell — so a
    combiner (see lib/cbam/final-report.ts) can place it alongside another
    document's fragment inside one shared shell. `buildCommunicationReport`
    below is a thin wrapper around this for standalone use. */
export type ReportSection = {
  bodyHtml: string;
  styleCss: string;
  draft: boolean;
  fileNameSlug: string;
};

/* What was outstanding when the report was generated. Readiness carries this
   per tab as `missing` plus an optional `blockingReason`; the report needs one
   flat list, most serious first, so a blocked tab's reason leads. */
function outstanding(r: WorkspaceReadiness): string[] {
  const out: string[] = [];
  for (const t of r.tabs) {
    if (t.blockingReason) out.push(`${t.tab}: ${t.blockingReason}`);
  }
  for (const t of r.tabs) {
    for (const m of t.missing) out.push(`${t.tab}: ${m.label}`);
  }
  return out;
}

/** One product row on the communication table — the workbook's
    Summary_Products columns D..O plus its sector parameters. */
type ProductRow = {
  process: string;
  aggregatedGood: string;
  cnCode: string;
  cnName: string;
  productName: string;
  seeDirect: number;
  seeIndirect: number;
  seeTotal: number;
  unit: string;
  defaultShare: number;
  electricityEfSource: string;
  embeddedElectricity: number | null;
  special: { label: string; value: string }[];
};

export function buildCommunicationReportSection(
  ws: VerificationWorkspace,
  readiness?: WorkspaceReadiness,
): ReportSection {
  const r = readiness ?? workspaceReadiness(ws);
  const draft = r.overall !== "complete";
  const see = workspaceSEE(ws);
  const org = getOrgIdentity();
  const inst = getInstallation(ws.installationId);
  const cp = getCarbonPrice(ws.id);
  const mmdFinal = finalVersionCovering(ws.id, ws.periodStart, ws.periodEnd);
  const mmd = mmdFinal
    ? migrateMmd(mmdFinal.content, ws.periodStart, ws.periodEnd)
    : loadDraft(ws.id, ws.periodStart, ws.periodEnd);

  /* The aggregated goods category comes from the CN CODE, not from the
     portal's sector label. `goodsCategory()` returns "Iron & Steel" — a sector,
     and not one of the template's eighteen categories, so it matches nothing
     and the report would print an empty route list beside it. The CN code is
     what the workbook keys on, and it is what the customs declaration carries. */
  const good = categoryForCn(ws.cnCode);
  const categoryLabel = good ? good.label.trim() : "";
  const indirectRelevant = good ? indirectApplies(good.id) : true;
  /* Sector fallback, named as one. An unmatched CN code is a data problem the
     report must surface rather than paper over — the declarant cannot file
     against a category that does not exist. */
  const sectorFallback = good ? null : goodsCategory(ws);

  const parts: string[] = [];

  /* ── Header ─────────────────────────────────────────────── */
  parts.push(`
<header>
  <span class="eyebrow">CBAM · Communication with the reporting declarant</span>
  <h1>${esc(ws.productName)}</h1>
  <p class="lead">
    ${esc(ws.installationName)} · reporting period ${esc(ws.periodStart)} to ${esc(ws.periodEnd)}.
    This report carries the same information as the EU communication template for installations
    (v2.1.1, 13 December 2024). Every section names the workbook cell it corresponds to, so the two can be checked
    against each other directly.
  </p>
  ${draft ? `<div class="draft">DRAFT — NOT READY FOR VERIFICATION. ${esc(outstanding(r)[0] ?? "The workspace has outstanding items.")}</div>` : ""}
</header>`);

  /* ── §1 Installation ────────────────────────────────────── */
  parts.push(`
<h2>1 · Installation details <span class="ref">A_InstData 2.0</span></h2>
<p class="why">Who produced the goods and where. The declarant copies these fields into the CBAM Registry, so a name
   that does not match the installation's registration documents is the most common reason a declaration is queried.</p>
<dl class="kv">
  <dt>Name of the installation (English)</dt><dd>${dash(inst?.name ?? ws.installationName)}</dd>
  <dt>Name in local language</dt><dd>${dash(inst?.nameLocal)}</dd>
  <dt>Street, number</dt><dd>${dash(inst?.street)}</dd>
  <dt>Economic activity</dt><dd>${dash(inst?.economicActivity)}</dd>
  <dt>Post code</dt><dd>${dash(inst?.postcode)}</dd>
  <dt>P.O. Box</dt><dd>${dash(inst?.poBox)}</dd>
  <dt>City</dt><dd>${dash(inst?.city)}</dd>
  <dt>Country</dt><dd>${dash(inst?.country)}</dd>
  <dt>UNLOCODE</dt><dd>${dash(inst?.unlocode)}</dd>
  <dt>Coordinates (latitude)</dt><dd>${dash(inst?.lat)}</dd>
  <dt>Coordinates (longitude)</dt><dd>${dash(inst?.lng)}</dd>
  <dt>Authorised representative</dt><dd>${dash(inst?.contactName)}</dd>
  <dt>Email</dt><dd>${dash(inst?.contactEmail)}</dd>
  <dt>Telephone</dt><dd>${dash(inst?.contactPhone)}</dd>
  <dt>Reporting period start</dt><dd>${esc(ws.periodStart)}</dd>
  <dt>Reporting period end</dt><dd>${esc(ws.periodEnd)}</dd>
  <dt>Operator</dt><dd>${dash(org.name)}</dd>
</dl>`);

  /* ── §2 Goods and routes ────────────────────────────────── */
  parts.push(`
<h2>2 · Aggregated goods category and production route <span class="ref">A_InstData 4.0</span></h2>
<p class="why">The category decides which default values apply, which sector-specific parameters have to be reported,
   and whether indirect (electricity) emissions are reported at all. It is one of the eighteen categories in the
   template — not a free description.</p>
<dl class="kv">
  <dt>Aggregated goods category</dt>
  <dd>${
    good
      ? esc(good.label.trim())
      : `<span style="color:var(--err)">Not resolved from CN ${esc(ws.cnCode || "—")}</span> <span class="muted">— Certrace has this workspace under the ${esc(sectorFallback ?? "")} sector, which is not one of the template's eighteen categories. Check the CN code.</span>`
  }</dd>
  <dt>CN code</dt><dd>${dash(ws.cnCode)}</dd>
  <dt>Production route</dt><dd>${dash(routeLabel(ws.productionRoute))}</dd>
  <dt>Routes available for this category</dt><dd>${good ? esc(good.routes.join(" · ")) : "—"}</dd>
  <dt>Unit</dt><dd>${good ? esc(good.unit) : "t"}</dd>
  <dt>Indirect emissions reported?</dt>
  <dd>${indirectRelevant ? "Yes" : `No — the definitive regime excludes indirect emissions for this category <span class="muted">(Parameters_Constants!C89:C106)</span>`}</dd>
</dl>
${
  !indirectRelevant
    ? `<div class="note">Indirect emissions are still <strong>measured and shown</strong> below, because the declarant may need them
       and because leaving the row blank is indistinguishable from having failed to collect it. They are excluded from
       the chargeable figure, which is what the exclusion actually means.</div>`
    : ""
}`);

  /* ── §3 The communication table ─────────────────────────── */
  const row = productRow(
    ws,
    see,
    categoryLabel,
    good?.unit ?? "t",
    mmd.electricitySupply,
  );
  parts.push(renderCommunicationTable([row]));

  /* ── §4 The workings ────────────────────────────────────── */
  parts.push(`
<h2>4 · How every figure above was calculated <span class="ref">InputOutput · D_Processes</span></h2>
<p class="why">The workbook shows the answer; this shows the arithmetic. Each block gives the formula, then the same
   formula with this installation's numbers in it, then the result. Re-key the middle line and you should land on the
   bottom one. Nothing below is rounded before it is printed.</p>`);

  if (!see.computable) {
    parts.push(
      `<div class="note warn">No production quantity is recorded for the period, so nothing can be expressed per tonne.
       Every per-tonne figure in this report is therefore zero and must not be read as a result.</div>`,
    );
  }

  for (const w of see.workings) {
    parts.push(`
<div class="work">
  <div><span class="id">${esc(w.id)}</span> <span class="lbl">${esc(w.label)}</span></div>
  <div class="formula">${esc(w.formula)}</div>
  <div class="sub">${esc(w.substitution)}</div>
  <div class="res">= ${esc(w.result)}</div>
</div>`);
  }

  if (see.errors.length > 0) {
    parts.push(`
<div class="note warn">
  <strong>Unit failures collected across the year.</strong> Each one is a figure that could not be converted, which means
  the totals above are incomplete rather than merely uncertain.
  <ul>${see.errors.map((e) => `<li>${esc(e)}</li>`).join("")}</ul>
</div>`);
  }

  /* ── §5 Precursors ──────────────────────────────────────── */
  parts.push(renderPrecursors(see));

  /* ── §6 Carbon price ────────────────────────────────────── */
  parts.push(renderCarbonPrice(cp, see));

  /* ── §7 Monitoring, data quality and verification ───────── */
  parts.push(`
<h2>7 · Monitoring methodology, data quality and verification <span class="ref">C_Emissions&amp;Energy 2.0 · A_InstData 3.0</span></h2>
<p class="why">What stands behind the numbers: how the boundary was drawn, how the data was produced, and who has
   checked it. A verifier reads this before the figures, because it tells them which figures to test hardest.</p>
<dl class="kv">
  <dt>Monitoring methodology</dt>
  <dd>${mmdFinal ? `Final version ${mmdFinal.n}, issued ${esc(new Date(mmdFinal.finalisedAt).toISOString().slice(0, 10))}` : `<span style="color:var(--err)">DRAFT — not finalised</span>`}</dd>
  <dt>Boundary</dt><dd>${dash(mmd.boundaryDescription)}</dd>
  <dt>Processes inside the boundary</dt><dd>${mmd.processesIncluded.length ? esc(mmd.processesIncluded.join(" → ")) : "—"}</dd>
  <dt>Declared exclusions</dt>
  <dd>${mmd.exclusions.length ? mmd.exclusions.map((x) => `${esc(x.process)} — ${esc(x.note || "no ground given")}`).join("<br>") : "None declared"}</dd>
  <dt>Determination method</dt><dd>${esc(directMethodSummary(mmd))}</dd>
  <dt>Electricity source</dt><dd>${dash(mmd.electricitySupply)}</dd>
  <dt>Electricity metering point</dt><dd>${dash(mmd.electricityMeteringPoint)}</dd>
  <dt>Quality assurance</dt><dd>${dash(mmd.qualityAssurance)} ${mmd.reviewerName ? `· ${esc(mmd.reviewerName)}` : ""}</dd>
  <dt>Data gaps declared</dt>
  <dd>${
    mmd.dataGaps.length
      ? `${mmd.dataGaps.length} — ${sig(
          mmd.dataGaps.reduce((a, g) => a + (Number(g.estimatedTCO2e) || 0), 0),
          2,
        )} tCO₂e estimated`
      : "None"
  }</dd>
</dl>`);

  /* ── §8 Readiness ───────────────────────────────────────── */
  parts.push(`
<h2>8 · Completeness at the time of generation</h2>
<p class="why">What was outstanding when this report was produced. An item listed here is not an opinion about the
   figures — it is a statement that something the methodology requires had not yet been recorded.</p>
<p><span class="pill">${esc(r.overall)}</span> ${r.percentComplete}% of applicable tabs complete</p>
${
  outstanding(r).length > 0
    ? `<ul>${outstanding(r)
        .map((m) => `<li>${esc(m)}</li>`)
        .join("")}</ul>`
    : `<p class="muted">Nothing outstanding.</p>`
}`);

  const bodyHtml = `<div class="wrap">
${parts.join("\n")}
<footer>
  Generated by Certrace · ${esc(workspaceTitle(ws))} · ${draft ? "DRAFT — NOT READY FOR VERIFICATION" : "Complete"}<br>
  Field-for-field equivalent to the EU CBAM Communication template for installations v2.1.1 (13 December 2024).
  Workbook cell references are printed beside each section so the two documents can be reconciled directly.
</footer>
</div>`;

  const fileNameSlug = `${ws.productName}-${ws.installationName}-${ws.year}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return { bodyHtml, styleCss: STYLE, draft, fileNameSlug };
}

export function buildCommunicationReport(
  ws: VerificationWorkspace,
  readiness?: WorkspaceReadiness,
): ReportResult {
  const section = buildCommunicationReportSection(ws, readiness);
  const title = `CBAM communication — ${workspaceTitle(ws)}`;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>${section.styleCss}</style>
</head><body>${section.bodyHtml}</body></html>`;

  return {
    html,
    fileName: `cbam-communication-${section.fileNameSlug}${section.draft ? "-draft" : ""}.html`,
    draft: section.draft,
  };
}

/* ── The communication row ──────────────────────────────────────
   Summary_Products!D..T. The one table a declarant actually needs, and the
   reason this report exists: everything above it is context for these twelve
   numbers. */
function productRow(
  ws: VerificationWorkspace,
  see: ReturnType<typeof workspaceSEE>,
  categoryLabel: string,
  unit: string,
  electricitySupply: string,
): ProductRow {
  const good = categoryForCn(ws.cnCode);
  /* SEE(direct) on the communication row is the FULL embedded direct figure —
     the installation's own direct emissions plus everything carried in from
     precursors. The precursor contribution is direct emissions upstream, so
     it belongs in column I and not in a column of its own; the workbook has
     no separate precursor column for exactly this reason. */
  const seeDirect = see.seeDirect + see.seePrecursor;
  const seeIndirect = see.seeIndirect;
  return {
    process: ws.productName,
    aggregatedGood: categoryLabel,
    // The workbook writes CN codes unspaced (Summary_Products!F9 = 72071919).
    cnCode: (ws.cnCode || "").replace(/\s+/g, ""),
    cnName: ws.productName,
    productName: ws.productName,
    seeDirect,
    seeIndirect,
    seeTotal: seeDirect + seeIndirect,
    unit: unit === "MWh" ? "tCO2e/MWh" : TEMPLATE_UNITS.emissionsPerTonne,
    defaultShare: see.precursors.defaultValueShare ?? 0,
    electricityEfSource: electricitySupply || "—",
    embeddedElectricity: null,
    special: (good ? specialParametersFor(good.id) : []).map((label) => ({
      label,
      value: "—",
    })),
  };
}

function renderCommunicationTable(rows: ProductRow[]): string {
  const head = COMMUNICATION_COLUMNS.map(
    (c) =>
      `<th class="${c.key.startsWith("see") || c.key === "defaultShare" || c.key === "embeddedElectricity" ? "n" : ""}">${esc(c.label)}<br><span class="ref">${esc(c.column)}</span></th>`,
  ).join("");
  const body = rows
    .map(
      (row) => `<tr>
    <td>${dash(row.process)}</td>
    <td>${dash(row.aggregatedGood)}</td>
    <td>${dash(row.cnCode)}</td>
    <td>${dash(row.cnName)}</td>
    <td>${dash(row.productName)}</td>
    <td class="n">${sig(row.seeDirect)}</td>
    <td class="n">${sig(row.seeIndirect)}</td>
    <td class="n">${sig(row.seeTotal)}</td>
    <td>${esc(row.unit)}</td>
    <td class="n">${sig(row.defaultShare, 3)}</td>
    <td>${dash(row.electricityEfSource)}</td>
    <td class="n">${row.embeddedElectricity == null ? "—" : sig(row.embeddedElectricity)}</td>
  </tr>`,
    )
    .join("");

  const special = rows[0]?.special ?? [];

  return `
<h2>3 · Summary of products — what the declarant receives <span class="ref">Summary_Products!D8:O8</span></h2>
<p class="why">These are the exact columns the EU template hands to the reporting declarant. The importer takes
   <strong>SEE (total)</strong> and multiplies it by the net mass on the customs declaration to get the embedded
   emissions of the consignment, then by the certificate price to get what they owe. Every other column exists so they
   can check that figure belongs to the goods in front of them.</p>
<div class="scroll"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>
<h3>What each column is for</h3>
<dl class="kv">
${COMMUNICATION_COLUMNS.map((c) => `  <dt>${esc(c.label)}</dt><dd>${esc(c.purpose)}</dd>`).join("\n")}
</dl>
${
  special.length > 0
    ? `<h3>Sector-specific parameters for this category <span class="ref">Summary_Products!P.. · Parameters_Constants!B110:I127</span></h3>
       <p class="why">Which parameters appear here is decided by the aggregated goods category, not by choice. A blank
          is a gap a verifier will raise, because the template requires the field for this category.</p>
       <div class="scroll"><table><thead><tr><th>Parameter</th><th>Value</th></tr></thead><tbody>
       ${special.map((s) => `<tr><td>${esc(s.label)}</td><td>${dash(s.value)}</td></tr>`).join("")}
       </tbody></table></div>`
    : ""
}`;
}

function renderPrecursors(see: ReturnType<typeof workspaceSEE>): string {
  const nodes = see.precursors.byNode ?? [];
  if (nodes.length === 0) {
    return `
<h2>5 · Purchased precursors <span class="ref">E_PurchPrec</span></h2>
<p class="why">Materials bought in that already carry embedded emissions when they arrive. Those emissions travel with
   the material into this good.</p>
<p class="muted">No purchased precursors recorded. For a good made only from scrap and energy that is correct; for a
   rolled or coated product it almost never is, and a verifier will ask what the input material was.</p>`;
  }

  return `
<h2>5 · Purchased precursors <span class="ref">E_PurchPrec · InputOutput!AK71</span></h2>
<p class="why">Each tier states how much of itself goes into one tonne of the tier above, and what its own embedded
   emissions are. The chain resolves as <code>SEE(i) = own process + Σ (quantity × SEE of the tier below)</code> —
   the same relation the workbook evaluates by matrix inversion on its hidden InputOutput sheet.</p>
<div class="scroll"><table>
  <thead><tr>
    <th>Tier</th><th>Material</th><th class="n">t per t of parent</th>
    <th class="n">Own declared share<br>tCO₂e/t of good</th><th class="n">SEE incl. chain<br>tCO₂e/t</th>
    <th class="n">Contribution to the good<br>tCO₂e/t</th>
  </tr></thead>
  <tbody>
  ${nodes
    .map(
      (nd) => `<tr>
      <td>${nd.depth}</td>
      <td>${esc(nd.precursorName || nd.name || "unnamed")}${nd.isScrap ? ` <span class="pill">scrap · zero-rated</span>` : ""}</td>
      <td class="n">${nd.ratio == null ? "—" : sig(nd.ratio, 4)}</td>
      <td class="n">${sig(nd.ownContribution)}</td>
      <td class="n">${sig(nd.see)}</td>
      <td class="n">${sig(nd.contribution)}</td>
    </tr>`,
    )
    .join("")}
  </tbody>
  <tfoot><tr>
    <td colspan="5"><strong>Precursor contribution to this good</strong></td>
    <td class="n"><strong>${sig(see.seePrecursor)}</strong></td>
  </tr></tfoot>
</table></div>
<div class="note">Scrap carries an embedded emission factor of exactly zero under CBAM, however carefully a figure is
  entered against it. Rows marked <em>scrap</em> above therefore contribute nothing, and that is the intended answer
  rather than missing data.</div>`;
}

function renderCarbonPrice(
  cp: ReturnType<typeof getCarbonPrice>,
  see: ReturnType<typeof workspaceSEE>,
): string {
  /* F_Tools §2. The workbook's chain, kept in its own order:
       covered SE   = SE(total) × share covered
       CP per tonne = covered SE × price per tCO₂e
       effective    = CP per tonne − rebate per tonne
     The declarant deducts the effective figure from what they owe, so an
     overstatement here is an under-payment of CBAM — which is why the report
     prints the share and the instrument beside it rather than just the money. */
  const claimed = Number(cp?.amountPerTonne ?? 0);
  /* F_Tools!H101 takes the covered SHARE as an input, 0–1, and the carbon price tab asks for it (as a percentage). A price with no share entered is
     NOT assumed to cover everything — that overstated the deduction, and an overstated deduction is an under-payment of CBAM. It prints as "not
     recorded" and deducts nothing until it is. A nil return needs no share. */
  const recordedShare = cp ? shareFraction(cp) : null;
  const shareMissing = claimed > 0 && recordedShare == null;
  const share: number = recordedShare ?? 0;
  const rebate = Math.max(0, Number(cp?.rebateAmountPerTonne ?? 0) || 0);
  const coveredSE = see.seeTotal * share;
  const due = coveredSE * claimed;
  const rebateDue = coveredSE * rebate;
  const effective = Math.max(0, due - rebateDue);

  return `
<h2>6 · Carbon price due in the country of production <span class="ref">F_Tools 2.0</span></h2>
<p class="why">A carbon price already paid on these emissions at home is deducted from what the importer owes in the
   EU. It only counts where it has actually been paid and not refunded — which is why the rebate line exists and why a
   rebate larger than the price is treated as zero rather than as a credit.</p>
<dl class="kv">
  <dt>Instrument</dt><dd>${dash(cp?.instrument ? CARBON_PRICE_INSTRUMENT_LABEL[cp.instrument] : "")}</dd>
  <dt>Currency</dt><dd>${dash(cp?.currency)}</dd>
  <dt>SEE (total)</dt><dd>${sig(see.seeTotal)} ${TEMPLATE_UNITS.emissionsPerTonne}</dd>
  <dt>Share of emissions covered</dt>
  <dd>${shareMissing ? `<span class="muted">not recorded — see the note below</span>` : claimed > 0 || recordedShare != null ? sig(share, 4) : "—"}</dd>
  <dt>Covered SE</dt><dd>${sig(coveredSE)} ${TEMPLATE_UNITS.emissionsPerTonne}</dd>
  <dt>Carbon price due</dt><dd>${sig(claimed, 2)} per tCO₂e</dd>
  <dt>Rebate</dt><dd>${sig(rebate, 2)} per tCO₂e${cp?.rebates ? ` <span class="muted">— ${esc(cp.rebates)}</span>` : ""}</dd>
</dl>
${
  shareMissing
    ? `<div class="note warn"><strong>The covered share has not been entered.</strong> The EU template asks for the
       fraction of total specific emissions the carbon price actually covers (F_Tools!H101). Most domestic instruments
       cover only part of a good's emissions, so nothing is deducted below until the real share is recorded on the
       Carbon price tab.</div>`
    : ""
}
${
  claimed > 0 && (cp?.legalBasis?.trim() || cp?.certifiedBy?.trim())
    ? `<dl class="kv">
  ${cp?.legalBasis?.trim() ? `<dt>Charged under</dt><dd>${esc(cp.legalBasis)}</dd>` : ""}
  ${cp?.certifiedBy?.trim() ? `<dt>Payment certified by</dt><dd>${esc(cp.certifiedBy)}</dd>` : ""}
</dl>`
    : ""
}
<div class="work">
  <div><span class="id">CP1</span> <span class="lbl">Effective carbon price due, per tonne of product</span></div>
  <div class="formula">(SEE_total × share_covered × price) − (SEE_total × share_covered × rebate)</div>
  <div class="sub">(${sig(see.seeTotal)} × ${sig(share, 4)} × ${sig(claimed, 2)}) − (${sig(see.seeTotal)} × ${sig(share, 4)} × ${sig(rebate, 2)})</div>
  <div class="res">= ${sig(effective, 2)} ${esc(cp?.currency ?? "")} per tonne</div>
</div>
${
  claimed > 0 && !shareMissing && share === 0
    ? `<div class="note warn">A carbon price is stated but the share of emissions it covers is zero, so nothing is
       deductible. If the price genuinely covers part of these emissions, set the share — leaving it at zero forfeits
       the deduction.</div>`
    : ""
}
${
  rebateDue > due && due > 0
    ? `<div class="note warn">The rebate exceeds the price paid. The effective figure is floored at zero: CBAM has no
       mechanism by which a domestic rebate produces a credit against EU liability.</div>`
    : ""
}
<h3>Electricity emission factor sources <span class="ref">Parameters_Constants!B15:H15</span></h3>
<p class="why">The template records the source of the electricity factor as a clause reference from Annex II, not as a
   description. This is what each one means.</p>
<div class="scroll"><table><thead><tr><th>Code</th><th>What it means</th></tr></thead><tbody>
${ELECTRICITY_EF_SOURCES.map((s) => `<tr><td><span class="ref">${esc(s.code)}</span></td><td>${esc(s.gloss)}</td></tr>`).join("")}
</tbody></table></div>`;
}

export function downloadCommunicationReport(
  ws: VerificationWorkspace,
  readiness?: WorkspaceReadiness,
): ReportResult {
  const report = buildCommunicationReport(ws, readiness);
  downloadFile(report.fileName, report.html, "text/html");
  return report;
}
