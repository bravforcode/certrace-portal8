/* ════════════════════════════════════════════════════════════
   THE REPORT SET — what an installation hands over for a reporting year

   Not one file. The operator's side of the CBAM chain is a set of documents,
   each defined by the Implementing Regulation, and each with its own reader:

     1  Monitoring plan                 — Annex IV point 2 (the summary of the
        monitoring plan the operator's emissions report must contain) and Annex
        II, Part A. What the installation monitors and how. For the verifier,
        before the year is verified.
     2  Operator's emissions report     — Annex IV point 1.1, items 1–35. The
        full report the verifier verifies.
     3  Operator's summary emissions report — Annex IV point 1.2, items 1–16.
        The shortened report passed to authorised declarants.
     4  Declarant-specific addendum     — Annex IV point 1.1.1. ONLY for
        electricity imported into the EU, one per authorised declarant. It does
        not apply to the goods in this portal's catalogue, so it appears — as
        "not applicable" — only when the installation says it exports
        electricity to the EU.

   So the set is three reports, and four where the addendum applies: never
   fewer than three, never more than four.

   EVERY ROW CARRIES THE ANNEX ITEM NUMBER IT ANSWERS, and a state:

     ready           the portal holds the answer
     partial         the portal holds some of it (a month is missing)
     missing         the portal should hold it and does not yet
     not applicable  the question does not arise for this installation
     outside         the regulation asks for it and this portal does not collect it
                     — it is named, not hidden, so nobody files without it

   The set is built from the stores. It computes nothing the product reports do
   not already compute, and it states no number the reader could not trace to a
   screen.
   ════════════════════════════════════════════════════════════ */

import { aggregatedGoodsCategory, countryName, getCatalogProduct, isEuOrExempt, type AggregatedGoodsCategory } from "../config";
import type { Installation } from "../installations";
import { FUEL_TYPES, fuelTypeLabel, monthsForWorkspace, monthCounts, processEntryLabel, type MonthlyEntry } from "../monthly-data";
import { SCRAP_ORIGIN_LABEL, SHARED_KEY_LABEL, WASTE_GAS_FLOW_LABEL, WASTE_GAS_LABEL, consumedFromStock, sharedFraction, wasteGasGj, wasteGasNcv, weightedComposition } from "../monthly-inputs";
import { pfcTechnology, scrapOf } from "./sector-pack";
import { QUALITY_ASSURANCE_LABEL } from "./mmd";
import { listSuppliers, totalTonnes, valueType, type PrecursorSupplier } from "../precursor-suppliers";
import { DIAGRAM_REQUIREMENTS, electricitySupplyLabel, finalVersionCovering, loadDraft, estimatedGapTCO2e } from "../workspace-mmd";
import { internalContribution, workspaceSEE, type InternalRow } from "../workspace-see";
import { getRoute, monthNameLong, routeLabel, workspaceCountry, type VerificationWorkspace } from "../workspace";
import { ANNUAL_REQUIRED_KEYS, EVIDENCE_SOURCE_LABEL, coverageForMonth, isReviewed, listEvidence, requiredKeysForMonth } from "../workspace-evidence";
import { admissibility, defaultFor } from "./precursor-basis";
import { categoryOf, sectorParamsFor } from "./precursor-fields";
import { rateSheet } from "./eu-rates";
import { letterOfRoute } from "./routes";
import { categoryRequiresIndirect } from "./product-category-rules";
import { MONITORING_QUESTIONS, profileGaps } from "./installation-profile";
import { guideFor, hrefFor, type Where } from "./report-guidance";

export type ItemState = "ready" | "partial" | "missing" | "not_applicable" | "outside";

/** What a row that still needs something says about it: how to fill it, an example, and the screen it is entered on. */
export type RowGuide = { how: string; example?: string; where: Where; href: string };
export type ReportRow = {
  n: string;
  label: string;
  value: string;
  state: ItemState;
  /** the product report that is furthest from ready for this row, so the link opens the right one */
  ws?: string;
  guide?: RowGuide;
};
export type ReportTable = { head: string[]; rows: string[][] };
export type ReportSection = { title: string; rows: ReportRow[]; tables?: { caption: string; table: ReportTable }[] };

export type ReportKind = "monitoring_plan" | "emissions_report" | "summary_report" | "declarant_addendum" | "precursor_verification" | "evidence_index";

export type ReportDoc = {
  kind: ReportKind;
  title: string;
  /** where the regulation defines it */
  reg: string;
  /** who reads it, and why */
  purpose: string;
  applicable: boolean;
  notApplicable?: string;
  sections: ReportSection[];
  tally: Record<ItemState, number>;
  /** nothing the portal should hold is missing or partial */
  complete: boolean;
};

export const REPORT_LABEL: Record<ReportKind, string> = {
  monitoring_plan: "Monitoring plan",
  emissions_report: "Operator's emissions report",
  summary_report: "Operator's summary emissions report",
  declarant_addendum: "Declarant-specific addendum",
  precursor_verification: "Verification reports of precursor installations",
  evidence_index: "Supporting evidence and records",
};

export const ITEM_STATE_LABEL: Record<ItemState, string> = {
  ready: "Ready",
  partial: "Partly there",
  missing: "Missing",
  not_applicable: "Not applicable",
  outside: "Kept outside the portal",
};

/* ── Small helpers ──────────────────────────────────────────────── */
const f = (v: number, dp = 3) => (Number.isFinite(v) ? v.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: dp }) : "—");
const text = (s: string | undefined | null) => (s ?? "").trim();
const row = (n: string, label: string, value: string, state: ItemState): ReportRow => ({ n, label, value, state });
const have = (s: string | undefined | null, label: string, n: string): ReportRow => row(n, label, text(s) || "—", text(s) ? "ready" : "missing");

function tally(sections: ReportSection[]): Record<ItemState, number> {
  const t: Record<ItemState, number> = { ready: 0, partial: 0, missing: 0, not_applicable: 0, outside: 0 };
  for (const s of sections) for (const r of s.rows) t[r.state]++;
  return t;
}
const done = (t: Record<ItemState, number>) => t.missing === 0 && t.partial === 0;

/** Give every row that still needs something its instruction — how, an example, and the link to the screen that takes the answer. */
function attachGuides(report: ReportDoc, installationId: string, firstWorkspace: string | undefined): ReportDoc {
  for (const s of report.sections) {
    for (const r of s.rows) {
      if (r.state === "ready" || r.state === "not_applicable") continue;
      const g = guideFor(report.kind, r.n, r.label);
      if (!g) continue;
      r.guide = { how: g.how, example: g.example, where: g.where, href: hrefFor(g, { installationId, workspaceId: r.ws ?? firstWorkspace }) };
    }
  }
  return report;
}

type Facts = {
  ws: VerificationWorkspace;
  see: ReturnType<typeof workspaceSEE>;
  months: MonthlyEntry[];
  route: string;
  routeLetter: string | undefined;
  agg: string;
  indirectCounts: boolean;
  precursors: PrecursorSupplier[];
  mmd: ReturnType<typeof loadDraft>;
  mmdFinal: boolean;
  /** the version number and date of the final methodology, when there is one */
  mmdVersion: { n: number; at: string } | null;
  /** products this site makes itself that go into this one (items 18, 19, 27) */
  internal: InternalRow[];
};

function factsOf(ws: VerificationWorkspace): Facts {
  const product = getCatalogProduct(ws.productId);
  const agg = product ? aggregatedGoodsCategory(product) : "";
  const final = finalVersionCovering(ws.id, ws.periodStart, ws.periodEnd);
  return {
    ws,
    see: workspaceSEE(ws),
    months: monthsForWorkspace(ws).filter(monthCounts),
    route: getRoute(ws.productionRoute)?.label ?? routeLabel(ws.productionRoute),
    routeLetter: letterOfRoute(ws.productionRoute),
    agg,
    indirectCounts: product ? categoryRequiresIndirect(aggregatedGoodsCategory(product)) : true,
    precursors: listSuppliers(ws.id).filter((s) => !s.parentId && !s.isScrap),
    mmd: final ? final.content : loadDraft(ws.id, ws.periodStart, ws.periodEnd),
    mmdFinal: Boolean(final),
    mmdVersion: final ? { n: final.n, at: final.finalisedAt } : null,
    internal: internalContribution(ws).rows,
  };
}

/** Item 2(c) — the five most important goods by mass, per production process, by CN code. A process is a route; the mass is the
    submitted monthly production of the year. */
function topGoodsPerProcess(facts: Facts[]): string {
  const byRoute = new Map<string, { cn: string; name: string; tonnes: number }[]>();
  for (const x of facts) {
    const list = byRoute.get(x.route) ?? [];
    list.push({ cn: x.ws.cnCode || "—", name: x.ws.productName, tonnes: x.see.production.tonnes });
    byRoute.set(x.route, list);
  }
  return [...byRoute.entries()]
    .map(([route, goods]) => `${route}: ${goods.sort((a, b) => b.tonnes - a.tonnes).slice(0, 5).map((g) => `CN ${g.cn}`).join(", ")}`)
    .join("; ");
}

const gps = (i: Installation | null) => (i && i.lat.trim() && i.lng.trim() ? `${i.lat}, ${i.lng}` : "");
const addr = (i: Installation | null) => (i ? [i.street, i.city, i.postcode, i.country ? countryName(i.country) : ""].filter(Boolean).join(", ") : "");

/* ── Identity rows, shared by all three main reports ────────────── */
/* The same facts are numbered differently in the two reports: the full report
   (Annex IV point 1.1) puts the installation under item 1(d); the summary (point
   1.2) gives it its own item 2, (a)–(e). */
function identityRows(i: Installation | null, withInstallation: boolean, summary = false): ReportRow[] {
  const rows = [
    have(i?.operatorName, "Name of the operator", "1(a)"),
    have(i?.operatorRegistrationNumber, "Corporate or activity registration number of the operator", "1(b)"),
    have(i?.operatorAddress, "Full address of the operator, in English", "1(c)"),
  ];
  if (withInstallation) {
    const n = (full: string, sum: string) => (summary ? sum : full);
    rows.push(
      have(i?.name, "Name of the installation", n("1(d)", "2(a)")),
      row(n("1(d)", "2(b)"), "Unique installation identifier in the CBAM Registry", text(i?.registryId) || "Not issued yet", "ready"),
      have(i?.unlocode, "UN/LOCODE of the location", n("1(d)", "2(c)")),
      have(addr(i), "Full address of the installation, in English", n("1(d)", "2(d)")),
      have(gps(i), "Geographical coordinates of the installation's main emission source", n("1(d)", "2(e)")),
    );
  }
  return rows;
}

/* ── What the new monthly inputs leave behind, as tables a verifier can read ───────
   Stock changes (Annex II B.4.1), shared meters (items 26, 29, 30), waste gases (item 17),
   scrap deliveries (item 35). Each is a list of the months' rows that used the input. */
const monthLabel = (ym: string) => monthNameLong(ym);
const unitText = (u: string) => ({ m3: "m³", kg: "kg", t: "t", l: "litres", GJ: "GJ" }[u] ?? u);

function stockTable(facts: Facts[]): ReportTable {
  const t: ReportTable = { head: ["Product report", "Month", "Material or fuel", "Delivered", "At the start", "At the end", "Used", "Unit"], rows: [] };
  for (const x of facts) {
    for (const mo of x.months) {
      for (const fu of mo.fuels) {
        if (fu.stock) t.rows.push([x.ws.productName, monthLabel(mo.month), fuelTypeLabel(fu.fuelType, fu.fuelTypeOther), f(fu.stock.delivered ?? 0), f(fu.stock.opening ?? 0), f(fu.stock.closing ?? 0), f(consumedFromStock(fu.stock)), unitText(fu.unit)]);
      }
      for (const e of mo.processEmissionEntries ?? []) {
        if (e.stock) t.rows.push([x.ws.productName, monthLabel(mo.month), processEntryLabel(e), f(e.stock.delivered ?? 0), f(e.stock.opening ?? 0), f(e.stock.closing ?? 0), f(consumedFromStock(e.stock)), "t"]);
      }
    }
  }
  return t;
}

function sharedTable(facts: Facts[]): ReportTable {
  const t: ReportTable = { head: ["Product report", "Month", "Meter", "Feeds", "Whole reading", "Split by", "This good", "Total", "Share", "This good takes"], rows: [] };
  for (const x of facts) {
    for (const mo of x.months) {
      const add = (feeds: string, unit: string, sm: NonNullable<MonthlyEntry["fuels"][number]["shared"]>) => {
        const share = sharedFraction(sm);
        t.rows.push([
          x.ws.productName,
          monthLabel(mo.month),
          sm.meter || "—",
          feeds,
          `${f(sm.reading ?? 0)} ${unit}`,
          SHARED_KEY_LABEL[sm.key],
          sm.key === "manual" ? "—" : f(sm.thisValue ?? 0),
          sm.key === "manual" ? "—" : f(sm.totalValue ?? 0),
          share != null ? `${f(share * 100, 2)}%` : "—",
          `${f((sm.reading ?? 0) * (share ?? 0))} ${unit}`,
        ]);
      };
      for (const fu of mo.fuels) if (fu.shared) add(fuelTypeLabel(fu.fuelType, fu.fuelTypeOther), unitText(fu.unit), fu.shared);
      for (const s of mo.electricitySources ?? []) if (s.shared) add("Electricity", "MWh", s.shared);
    }
  }
  return t;
}

function wasteGasTable(facts: Facts[]): ReportTable {
  const t: ReportTable = { head: ["Product report", "Month", "Gas", "What happened to it", "Volume (Nm³)", "Calorific value (MJ/Nm³)", "From", "Energy (GJ)", "CO · CO₂ · H₂ · CH₄ (%)"], rows: [] };
  for (const x of facts) {
    for (const mo of x.months) {
      for (const g of mo.wasteGases ?? []) {
        const ncv = wasteGasNcv(g);
        t.rows.push([
          x.ws.productName,
          monthLabel(mo.month),
          g.gas === "other" ? text(g.label) || WASTE_GAS_LABEL.other : WASTE_GAS_LABEL[g.gas],
          WASTE_GAS_FLOW_LABEL[g.flow],
          f(g.volumeNm3 ?? 0, 0),
          ncv.value != null ? f(ncv.value, 2) : "—",
          { entered: "plant's own value", composition: "composition", typical: "typical value", none: "—" }[ncv.from],
          f(wasteGasGj(g), 1),
          [g.coPct, g.co2Pct, g.h2Pct, g.ch4Pct].map((v) => (v != null ? f(v, 2) : "—")).join(" · "),
        ]);
      }
    }
  }
  return t;
}

function scrapTable(facts: Facts[]): ReportTable {
  const t: ReportTable = { head: ["Product report", "Month", "Scrap", "Supplier", "Grade", "Origin", "Tonnes"], rows: [] };
  for (const x of facts) {
    for (const mo of x.months) {
      for (const d of mo.scrapDeliveries ?? []) {
        t.rows.push([x.ws.productName, monthLabel(mo.month), { steel_scrap: "Steel scrap", iron_scrap: "Iron scrap", aluminium_scrap: "Aluminium scrap" }[d.material], text(d.supplier) || "—", text(d.grade) || "—", SCRAP_ORIGIN_LABEL[d.origin], f(d.tonnes ?? 0)]);
      }
    }
  }
  return t;
}

/** Items 18, 19 and 27 — the precursors made at this installation and used here, from the product reports they came from. */
function internalTable(facts: Facts[]): ReportTable {
  return {
    head: ["Product report", "Precursor made here", "CN code", "Quantity used (t)", "Embedded emissions it carries (tCO2e/t)", "Adds to this good (tCO2e/t)"],
    rows: facts.flatMap((x) =>
      x.internal.map((r) => [x.ws.productName, r.source?.productName ?? "— (report no longer exists)", r.source?.cnCode || "—", r.quantityUsedT != null ? f(r.quantityUsedT) : "—", r.issue ? "—" : f(r.see, 5), r.issue ? "—" : f(r.contribution, 5)]),
    ),
  };
}

function internalRow(n: string, label: string, facts: Facts[]): ReportRow {
  const all = facts.flatMap((x) => x.internal.map((r) => ({ x, r })));
  if (all.length === 0) return row(n, label, "None — nothing this installation makes goes into another of its products here", "not_applicable");
  const open = all.filter((a) => a.r.issue);
  return row(n, label, all.map((a) => `${a.x.ws.productName} uses ${f(a.r.quantityUsedT ?? 0)} t of ${a.r.source?.productName ?? "a product made here"}, made at this installation.`).join("; "), open.length === 0 ? "ready" : "partial");
}

/** A phrase for rows whose quantity was worked out rather than read, for item 16(a). */
function derivedNote(facts: Facts[]): string {
  const stock = stockTable(facts).rows.length;
  const shared = sharedTable(facts).rows.length;
  return [stock > 0 && `${stock} quantity(ies) worked out from stock changes`, shared > 0 && `${shared} from shared meters`].filter(Boolean).join("; ");
}

/* ── The precursor tables (22, 23, 28) ──────────────────────────── */
function precursorTables(facts: Facts[]): { onDefault: ReportTable; onActual: ReportTable; origin: ReportTable; quantity: ReportTable } {
  const onDefault: ReportTable = { head: ["Product report", "CN code", "Name of the good", "Country of origin", "Default value (tCO2e/t)"], rows: [] };
  const onActual: ReportTable = { head: ["Product report", "CN code", "Name of the good", "Country of origin", "Reporting period", "Direct", "Indirect"], rows: [] };
  const origin: ReportTable = { head: ["Product report", "Operator", "Installation", "CBAM Registry identifier", "Reporting period"], rows: [] };
  const quantity: ReportTable = { head: ["Product report", "CN code", "Name of the good", "Quantity used (t)"], rows: [] };

  for (const fx of facts) {
    for (const p of fx.precursors) {
      const label = fx.ws.productName;
      quantity.rows.push([label, p.cnCode || "—", p.precursorName || "—", p.quantityUsedT != null ? f(p.quantityUsedT) : "—"]);
      const usable = p.valueBasis === "actual" && admissibility(p, fx.ws).usable;
      if (usable) {
        onActual.rows.push([
          label,
          p.cnCode || "—",
          p.precursorName || "—",
          p.country ? countryName(p.country) : "—",
          `${p.reportingPeriodStart ?? "—"} to ${p.reportingPeriodEnd ?? "—"} (${p.reportingPeriodBasis === "actual_time" ? "actual time of production" : "default period"})`,
          f(p.specificEmbeddedDirectTco2PerT ?? 0, 5),
          p.specificEmbeddedIndirectTco2PerT != null ? f(p.specificEmbeddedIndirectTco2PerT, 5) : "n/a",
        ]);
        origin.rows.push([label, p.name || "—", p.installationName || "—", p.installationUniqueId || "not available", `${p.reportingPeriodStart ?? "—"} to ${p.reportingPeriodEnd ?? "—"}`]);
      } else {
        const d = defaultFor(p.cnCode, p.country, fx.ws.year, { unknownOrigin: p.originUnknown });
        onDefault.rows.push([
          label,
          p.cnCode || "—",
          p.precursorName || "—",
          p.originUnknown || !p.country ? "not identified" : countryName(p.country),
          d ? f(d.total) : "—",
        ]);
      }
    }
  }
  return { onDefault, onActual, origin, quantity };
}

/* ── 1 · Monitoring plan ────────────────────────────────────────
   THE TEMPLATE IS ANNEX II POINT A.5. It lists the minimum elements a monitoring
   plan contains, numbered 1 to 22, and the verifier reads the plan against that
   list. So this report is that list: one row per element, tagged "MP" + the
   element's number, answered from what the portal holds. Elements that belong to
   a production process (7 to 14, 22) are answered for every product report and
   shown together, the state being the weakest of them. */
const WORSE: ItemState[] = ["missing", "partial", "outside", "ready", "not_applicable"];
const worst = (states: ItemState[]): ItemState => WORSE.find((s) => states.includes(s)) ?? "not_applicable";

type Per = { text: string; state: ItemState };

/** One row for an element that is answered once per product report. With a single product report the answer is printed
    plain; with several each carries the name of its product, and the row is as ready as the weakest of them. */
function perProduct(n: string, label: string, facts: Facts[], answer: (x: Facts) => Per): ReportRow {
  if (facts.length === 0) return row(n, label, "No product report this year", "missing");
  const per = facts.map((x) => ({ x, a: answer(x) }));
  const live = per.filter((p) => p.a.state !== "not_applicable");
  if (live.length === 0) return row(n, label, per[0].a.text, "not_applicable");
  const value = facts.length === 1 ? live[0].a.text : live.map((p) => `${p.x.ws.productName}: ${p.a.text}`).join("; ");
  const open = live.find((p) => p.a.state !== "ready")?.x.ws.id;
  return { ...row(n, label, value, worst(live.map((p) => p.a.state))), ws: open };
}

const instrumentsOf = (x: Facts) => [...x.mmd.fuelInstruments, ...x.mmd.electricityInstruments];

/** The yes/no questions the installation page asks once (2(f)–(h), 3–6), as a monitoring-plan element. */
function profileAnswer(m: Installation["monitoring"] | undefined, key: (typeof MONITORING_QUESTIONS)[number]["key"], detailKey: (typeof MONITORING_QUESTIONS)[number]["detailKey"], n: string, label: string): ReportRow {
  const a = m?.[key] as string | undefined;
  if (!a) return row(n, label, "—", "missing");
  if (a === "no") return row(n, label, "No", "ready");
  const d = text(m?.[detailKey] as string);
  return row(n, label, d ? `Yes — ${d}` : "Yes", d ? "ready" : "partial");
}

/** Non-CBAM goods made per production process (Annex IV item 14, and A.5 element 5). */
function nonCbamRow(n: string, label: string, m: Installation["monitoring"] | undefined, facts: Facts[]): ReportRow {
  const goodsMade = monthsOfAll(facts).flatMap((mo) => mo.nonCbamGoods ?? []).filter((g) => g.tonnes > 0);
  const totals = new Map<string, number>();
  for (const g of goodsMade) totals.set(g.name.trim() || "Unnamed good", (totals.get(g.name.trim() || "Unnamed good") ?? 0) + g.tonnes);
  const none = /^\s*(none|n\/?a|no|nil)\.?\s*$/i.test(m?.nonCbamProcesses ?? "");
  if (totals.size > 0) return row(n, label, [...totals].map(([k, t]) => `${k}: ${f(t, 1)} t`).join("; "), "ready");
  if (none || !text(m?.nonCbamProcesses)) return row(n, label, "None", none ? "not_applicable" : "missing");
  return row(n, label, `Processes listed (${text(m?.nonCbamProcesses)}) but no quantities entered`, "partial");
}

/** The free-allocation benchmark of each good (A.5 element 6, Annex IV item 4(e)). */
function benchmarkTable(facts: Facts[]): ReportTable {
  return {
    head: ["CN code", "Good", "Free allocation (tCO2e/t)", "Benchmark", "CBAM factor"],
    rows: facts.map((x) => {
      const s = rateSheet({ cn: x.ws.cnCode, country: workspaceCountry(x.ws), year: x.ws.year, routeLetter: x.routeLetter });
      return [x.ws.cnCode || "—", x.ws.productName, s?.freeAllocation != null ? f(s.freeAllocation, 5) : "—", s?.benchmark.default != null ? f(s.benchmark.default, 5) : "—", s?.cbamFactor != null ? `${Math.round(s.cbamFactor * 1000) / 10}%` : "—"];
    }),
  };
}

/** A.5 element 7(a) — the formulae the product's figures are computed with, read off the streams its months actually carry. */
function methodText(x: Facts): Per {
  const used = x.months.flatMap((mo) => (mo.processEmissionEntries ?? []).filter((e) => Number(e.quantityT) !== 0));
  const hasFuel = x.months.some((mo) => mo.fuels.some((fu) => Number(fu.quantity) !== 0)) || x.mmd.fuelTypeIds.length > 0;
  const parts = [
    hasFuel && "fuels, standard method: quantity × net calorific value × emission factor × oxidation factor",
    used.some((e) => e.method === "standard") && "process emissions, standard method: activity data × emission factor",
    used.some((e) => e.method === "mass_balance") && "carbon-balance materials, mass balance: (carbon in − carbon out) × 44/12",
    x.indirectCounts && "electricity: MWh consumed × emission factor of the source",
    x.mmd.pfcMethodology && "perfluorocarbons: anode-effect minutes × emission factor of the cell type",
  ].filter(Boolean) as string[];
  if (parts.length === 0) return { text: "—", state: "missing" };
  return { text: parts.join("; "), state: "ready" };
}

function monitoringPlan(i: Installation | null, facts: Facts[]): ReportDoc {
  const m = i?.monitoring;
  const noReports = facts.length === 0;
  const indirectGoods = facts.filter((x) => x.indirectCounts);
  const ms = monthsOfAll(facts);

  const goodsList: ReportTable = {
    head: ["CN code", "Good", "Functional unit", "Composition (clinker / nitrogen content)"],
    rows: facts.map((x) => [x.ws.cnCode || "—", x.ws.productName, "tonne", sectorParamsFor(x.agg as AggregatedGoodsCategory).length > 0 && !STEEL.has(x.agg) && !ALUMINIUM.has(x.agg) ? "to be stated" : "not applicable"]),
  };
  const processes: ReportTable = {
    head: ["CN code", "Good delivered", "Production process / route", "Route letter", "Functional unit"],
    rows: facts.map((x) => [x.ws.cnCode || "—", x.ws.productName, x.route, x.routeLetter ?? "—", "tonne"]),
  };
  const instruments: ReportTable = {
    head: ["Product report", "Measures", "Instrument", "Where it sits", "Read", "Last calibrated", "Uncertainty ±%"],
    rows: facts.flatMap((x) =>
      instrumentsOf(x).map((r) => [
        x.ws.productName,
        r.parameter || "—",
        r.instrument || "—",
        text(r.location) || text(r.measurementPointLocation) || "—",
        r.readingFrequency === "other" ? text(r.readingFrequencyOther) || "other" : r.readingFrequency || "—",
        r.lastCalibration || "—",
        r.uncertaintyPct != null ? f(r.uncertaintyPct, 2) : "—",
      ]),
    ),
  };
  const precursorList: ReportTable = {
    head: ["Product report", "Precursor", "CN code", "Made at / supplied by", "Country of origin"],
    rows: facts.flatMap((x) =>
      [
        ...x.precursors.map((p) => [x.ws.productName, p.precursorName || "—", p.cnCode || "—", p.origin === "purchased" ? text(p.installationName) || text(p.name) || "—" : "made at this installation", p.originUnknown ? "not identified" : p.country ? countryName(p.country) : "—"]),
        ...x.internal.map((r) => [x.ws.productName, r.source?.productName ?? "—", r.source?.cnCode || "—", "made at this installation", "this installation"]),
      ],
    ),
  };

  /* Element 1 — the date and the version number. */
  const versionOf = (x: Facts): Per => (x.mmdVersion ? { text: `Version ${x.mmdVersion.n}, ${x.mmdVersion.at.slice(0, 10)}`, state: "ready" } : { text: "Draft — not finalised", state: "partial" });

  const sections: ReportSection[] = [
    { title: "Operator and installation", rows: identityRows(i, true).map((r) => ({ ...r, n: "—" })) },
    {
      title: "1–6 · The installation and its goods",
      rows: [
        perProduct("MP 1", "The date and version number of the monitoring plan", facts, versionOf),
        perProduct("MP 2", "A description of the installation and of the production processes carried out at it", facts, (x) => {
          const b = text(x.mmd.boundaryDescription);
          const inside = x.mmd.processesIncluded ?? [];
          return b && inside.length > 0 ? { text: `${i?.name || "Installation"}: ${inside.join(" → ")} — ${b.length > 160 ? `${b.slice(0, 157)}…` : b}`, state: "ready" } : { text: "—", state: "missing" };
        }),
        row(
          "MP 3",
          "A list of all relevant goods produced, by CN code and functional unit — with their compositions in clinker and nitrogen content where that applies — including the precursors not covered by separate production processes",
          facts.length ? `${facts.length} good(s), each in tonnes` : "—",
          noReports ? "missing" : goodsList.rows.some((r) => r[3] === "to be stated") ? "outside" : "ready",
        ),
        row("MP 4", "A list of all CBAM production processes and routes carried out at the installation, and of the goods delivered per production process", facts.length ? facts.map((x) => `${x.route}: ${x.ws.productName} (CN ${x.ws.cnCode})`).join("; ") : "—", facts.length ? "ready" : "missing"),
        nonCbamRow("MP 5", "If relevant, a list of the non-CBAM goods produced per production process and the quantity produced", m, facts),
        row(
          "MP 6",
          "A list of the relevant CBAM benchmarks used to determine the free allocation adjustment of every relevant good",
          facts.length ? benchmarkTable(facts).rows.map((r) => `CN ${r[0]}: ${r[3]}`).join("; ") : "—",
          noReports ? "missing" : benchmarkTable(facts).rows.every((r) => r[3] !== "—") ? "ready" : "partial",
        ),
      ],
      tables: [
        { caption: "Goods, by CN code and functional unit", table: goodsList },
        { caption: "Production processes, routes and the goods each delivers", table: processes },
        { caption: "CBAM benchmarks", table: benchmarkTable(facts) },
      ],
    },
    {
      title: "7–13 · How each production process is monitored",
      rows: [
        perProduct("MP 7(a)", "The calculation-based methodology: its input data and calculation formulae", facts, methodText),
        perProduct("MP 7(b)", "The measurement systems used, and the exact location of the instrument on each source stream", facts, (x) => {
          const rows = instrumentsOf(x);
          if (rows.length === 0) return { text: "—", state: "missing" };
          const placed = rows.filter((r) => text(r.location) || text(r.measurementPointLocation)).length;
          return { text: `${rows.length} instrument(s)${placed === rows.length ? ", each with its location" : `, ${rows.length - placed} without a location`}`, state: placed === rows.length ? "ready" : "partial" };
        }),
        perProduct("MP 8", "The methods for determining the calculation factors, and the sampling plan for each source stream", facts, (x) =>
          text(x.mmd.samplingPlan) ? { text: text(x.mmd.samplingPlan), state: "ready" } : { text: "— (write it under Methodology → Monitoring plan elements)", state: "missing" },
        ),
        perProduct("MP 9", "A list of the source streams and emission sources of each production process, and their description", facts, (x) => {
          const streams = x.months.length > 0 ? sourceStreamSummary(x.months) : "";
          const fuelsDeclared = (x.mmd.fuelTypeIds ?? []).map((id) => FUEL_TYPES.find((ft) => ft.id === id)?.label ?? id);
          if (streams && !streams.startsWith("In the monthly readings")) return { text: streams, state: "ready" };
          return fuelsDeclared.length ? { text: `fuels: ${fuelsDeclared.join(", ")}`, state: "partial" } : { text: "—", state: "missing" };
        }),
        perProduct("MP 10", "The source streams on the standard method or the mass balance method, and how each relevant parameter is determined", facts, (x) => {
          const used = x.months.flatMap((mo) => (mo.processEmissionEntries ?? []).filter((e) => Number(e.quantityT) !== 0));
          const standard = new Set(used.filter((e) => e.method === "standard").map((e) => processEntryLabel(e)));
          const balance = new Set(used.filter((e) => e.method === "mass_balance").map((e) => processEntryLabel(e)));
          const fuels = new Set(x.months.flatMap((mo) => mo.fuels.filter((fu) => Number(fu.quantity) !== 0).map((fu) => fuelTypeLabel(fu.fuelType, fu.fuelTypeOther))));
          const parts = [
            fuels.size > 0 && `standard method (net calorific value, emission factor, oxidation factor): ${[...fuels].join(", ")}`,
            standard.size > 0 && `standard method (emission factor): ${[...standard].join(", ")}`,
            balance.size > 0 && `mass balance (carbon content of each input and output): ${[...balance].join(", ")}`,
          ].filter(Boolean) as string[];
          return parts.length ? { text: parts.join("; "), state: "ready" } : { text: "—", state: x.months.length > 0 ? "missing" : "partial" };
        }),
        (() => {
          const label = "The emission sources monitored by measurement, with the elements the regulation lists for them";
          if (m?.cems === "no") return row("MP 11", label, "No continuous measurement", "not_applicable");
          if (m?.cems !== "yes") return row("MP 11", label, "Answer the continuous-measurement question on the installation page first", "missing");
          const cems = facts.flatMap((x) => x.mmd.fuelInstruments.filter((r) => r.directMethod === "measurement"));
          const complete = cems.length > 0 && cems.every((r) => text(r.cemsCalibrationRef) && text(r.measurementPointLocation));
          return row("MP 11", label, cems.length ? `${cems.length} analyser(s): ${cems.map((r) => `${r.parameter || "analyser"} at ${text(r.measurementPointLocation) || "no point named"}`).join("; ")}` : "Continuous measurement is used but no analyser is described", complete ? "ready" : cems.length ? "partial" : "missing");
        })(),
        perProduct("MP 12", "The monitoring methodology for perfluorocarbons, where primary aluminium is made", facts, (x) => {
          const p = x.mmd.pfcMethodology;
          if (!p) return { text: "No primary aluminium smelter here", state: "not_applicable" };
          const doneP = Boolean(p.method && p.technology && p.factorSource && p.collectionBasis.trim());
          return doneP
            ? {
                text: [
                  p.method === "slope" ? "Slope method (anode-effect minutes per cell-day)" : "Overvoltage method",
                  pfcTechnology(p.technology)?.label ?? p.technology,
                  p.factorSource === "own_measurement" ? `own factors, measured ${p.measuredOn || "date not given"}` : "EU factors for the cell type",
                  `duct collection: ${p.collectionBasis.trim()}`,
                ].join(" · "),
                state: "ready",
              }
            : { text: "—", state: "missing" };
        }),
        perProduct("MP 13", "A diagram and process description of the installation, with its system boundaries, evidencing no double counting and no data gap", facts, (x) => {
          if (!x.mmd.diagramFileName) return { text: "— (attach it under Methodology → Installation diagram)", state: "missing" };
          const shown = (x.mmd.diagramCovers ?? []).length;
          const all = DIAGRAM_REQUIREMENTS.length;
          return { text: `${x.mmd.diagramFileName} — shows ${shown} of ${all} required points`, state: shown >= all ? "ready" : "partial" };
        }),
      ],
      tables: [{ caption: "Measuring instruments and where they sit", table: instruments }],
    },
    {
      title: "14–19 · Precursors, fuels, heat and electricity",
      rows: [
        (() => {
          const label = "The precursors used in each production process and, where made at another installation, the name and country of origin of their suppliers";
          const all = facts.flatMap((x) => x.precursors);
          const made = facts.flatMap((x) => x.internal);
          if (noReports) return row("MP 14", label, "—", "missing");
          if (all.length === 0 && made.length === 0) return row("MP 14", label, "No direct precursor", "not_applicable");
          const named = all.filter((p) => text(p.precursorName) && (p.originUnknown || text(p.country)));
          const incomplete = all.length - named.length + made.filter((r) => r.issue).length;
          return row(
            "MP 14",
            label,
            [all.length > 0 && `${all.length} bought in${named.length === all.length ? "" : `, ${all.length - named.length} without a name or a country`}`, made.length > 0 && `${made.length} made at this installation`].filter(Boolean).join("; "),
            incomplete === 0 ? "ready" : "partial",
          );
        })(),
        profileAnswer(m, "zeroRatedFuels", "zeroRatedDetail", "MP 15", "Whether zero-rated fuels are used, and how the operator demonstrates that zero-rating applies"),
        (() => {
          const base = profileAnswer(m, "heatTrade", "heatDetail", "MP 16", "Whether measurable heat is imported or exported, which installations, and how the emissions attributed to the heat flows are determined for each production process");
          if (m?.heatTrade !== "yes" || base.state !== "ready") return base;
          const heat = flow(ms, "heatGj");
          return heat.imported + heat.produced + heat.consumed + heat.exported > 0 ? base : { ...base, state: "partial", value: `${base.value} — the heat quantities are not in the monthly data yet` };
        })(),
        profileAnswer(m, "onsiteElectricity", "onsiteElectricityDetail", "MP 17", "Whether electricity is produced inside the installation, and if so whether by co-generation or separate generation, from fossil or renewable sources, and whether it leaves the system boundary of a production process"),
        indirectGoods.length === 0
          ? row("MP 18", "Where indirect emissions are determined on actual emissions, the information for the evidence in point D.4.3", "Every good here is in Annex II — direct emissions only", "not_applicable")
          : perProduct("MP 18", "Where indirect emissions are determined on actual emissions, the information for the evidence in point D.4.3", indirectGoods, (x) =>
              x.mmd.electricitySupply && text(x.mmd.electricityMeteringPoint)
                ? { text: `${electricitySupplyLabel(x.mmd.electricitySupply, x.mmd.electricitySupplyOther)}; metered at ${text(x.mmd.electricityMeteringPoint)}`, state: "ready" }
                : { text: "—", state: "missing" },
            ),
        m?.electricityToEu === "yes"
          ? row("MP 19", "Where the embedded emissions of electricity imported into the Union are determined on actual emissions, the information for the evidence in point D.2.4, and how the operator receives it", "See the declarant-specific addendum", "outside")
          : row("MP 19", "Where the embedded emissions of electricity imported into the Union are determined on actual emissions, the information for the evidence in point D.2.4", "Not applicable", "not_applicable"),
      ],
      tables: [{ caption: "Precursors and their suppliers", table: precursorList }],
    },
    {
      title: "20–21 · Waste gases and CO2",
      rows: [
        profileAnswer(m, "wasteGases", "wasteGasDetail", "MP 20", "Whether waste gases are produced and used in the installation, or imported from or exported to other installations — which"),
        profileAnswer(m, "co2Transfer", "co2TransferDetail", "MP 21", "Whether CO2 is captured, stored or used: the identity and contact data of the responsible person at the receiving installation, and the monitoring methodology"),
      ],
    },
    {
      title: "22 · The control system that keeps the data right",
      rows: [
        perProduct("MP 22(a)", "Quality assurance of the measurement equipment: calibrated, adjusted and checked at regular intervals, against traceable standards", facts, (x) => {
          const rows = instrumentsOf(x);
          if (rows.length === 0) return { text: "—", state: "missing" };
          const dated = rows.filter((r) => r.lastCalibration);
          const latest = dated.map((r) => r.lastCalibration).sort().at(-1);
          return { text: `${dated.length} of ${rows.length} instrument(s) with a calibration date${latest ? `, the latest on ${latest}` : ""}`, state: dated.length === rows.length ? "ready" : "partial" };
        }),
        perProduct("MP 22(b)", "A risk assessment of where errors can enter the data flow, from primary data to final data", facts, (x) => (text(x.mmd.controlSystem.riskAssessment) ? { text: text(x.mmd.controlSystem.riskAssessment), state: "ready" } : { text: "—", state: "missing" })),
        perProduct("MP 22(c)", "Quality assurance of the information technology systems", facts, (x) => (text(x.mmd.controlSystem.itSystems) ? { text: text(x.mmd.controlSystem.itSystems), state: "ready" } : { text: "—", state: "missing" })),
        perProduct("MP 22(d)", "Segregation of duties in the data flow and control activities, and management of competencies", facts, (x) => (text(x.mmd.controlSystem.segregationOfDuties) ? { text: text(x.mmd.controlSystem.segregationOfDuties), state: "ready" } : { text: "—", state: "missing" })),
        perProduct("MP 22(e)", "Internal reviews and validation of data", facts, (x) => {
          const q = x.mmd.qualityAssurance;
          if (!q || q === "none") return { text: "No review method is set", state: "missing" };
          const who = text(x.mmd.reviewerName);
          const when = text(x.mmd.reviewFrequency);
          return { text: `${QUALITY_ASSURANCE_LABEL[q] ?? q}${who ? `; reviewer ${who}` : ""}${when ? `; ${when}` : ""}`, state: who && when ? "ready" : "partial" };
        }),
        perProduct("MP 22(f)", "Corrections and corrective action", facts, (x) => (text(x.mmd.controlSystem.corrections) ? { text: text(x.mmd.controlSystem.corrections), state: "ready" } : { text: "—", state: "missing" })),
        perProduct("MP 22(g)", "Control of outsourced processes", facts, (x) => (text(x.mmd.controlSystem.outsourced) ? { text: text(x.mmd.controlSystem.outsourced), state: "ready" } : { text: "—", state: "missing" })),
        perProduct("MP 22(h)", "Keeping records and documentation, including the management of document versions", facts, (x) => (text(x.mmd.controlSystem.records) ? { text: text(x.mmd.controlSystem.records), state: "ready" } : { text: "—", state: "missing" })),
      ],
    },
  ];
  const t = tally(sections);
  return {
    kind: "monitoring_plan",
    title: REPORT_LABEL.monitoring_plan,
    reg: "Annex II point A.5 (elements 1 to 22) · Annex IV point 2, Implementing Regulation (EU) 2025/2547",
    purpose: "What the installation monitors and how, element by element as the template lists them. The verifier reads it before the year is verified.",
    applicable: true,
    sections,
    tally: t,
    complete: done(t),
  };
}

/* ── Item 35: the sector-specific parameters of the site's own goods ──
   Annex IV point 2 lists them by aggregated goods category. Where a category
   has none ("N.a."), the question does not arise. For iron and steel the
   monitoring methodology records them, so they are read from there. For the
   other categories (clinker ratio, urea purity, aluminium scrap share…) this
   portal does not collect them for the site's own goods yet, and says so. */
const STEEL = new Set(["Pig iron", "Direct reduced iron", "Ferro-alloys", "Crude steel", "Iron or steel products"]);
const ALUMINIUM = new Set(["Unwrought aluminium", "Aluminium products"]);

/** Scrap per tonne of product and the pre-consumer share, from the submitted monthly readings — the figures the plant already gives, so
    nobody has to type them a second time into the methodology. Null until a month has scrap in it. */
function scrapFromMonths(months: MonthlyEntry[]): { perTonne: number; preConsumerPct: number } | null {
  let scrap = 0;
  let pre = 0;
  let made = 0;
  for (const mo of months) {
    const s = scrapOf(mo);
    scrap += s.tonnes;
    pre += s.preConsumerT;
    if (s.tonnes > 0) made += mo.productionTonnes || 0;
  }
  return scrap > 0 && made > 0 ? { perTonne: scrap / made, preConsumerPct: (pre / scrap) * 100 } : null;
}

/** A figure the plant typed, as a number — an empty box is not zero. */
const given = (v: unknown): number | null => {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

/** Scrap that steel or aluminium BOUGHT IN carries with it, from what each of those precursors' own producers declared (Annex IV item 35 of
    their report) — so an exporter that rolls billet or extrudes ingot is not asked for a figure it cannot know. A precursor on a default value
    has no declared scrap, and is counted as unknown, never as zero. */
function scrapFromPrecursors(x: Facts, made: number): { perT: number; preConsumerPct: number | null; known: number; unknown: number } {
  let scrap = 0;
  let pre = 0;
  let known = 0;
  let unknown = 0;
  for (const s of x.precursors) {
    const cat = categoryOf(s);
    if (!cat || !sectorParamsFor(cat).some((p) => p.key === "scrapUsedTPerT")) continue;
    const used = totalTonnes(s);
    if (!(used > 0)) continue;
    const per = given(s.sectorParams?.scrapUsedTPerT);
    if (valueType(s) === "actual" && per != null) {
      const share = given(s.sectorParams?.preConsumerScrapPct);
      scrap += used * per;
      pre += used * per * ((share ?? 0) / 100);
      known++;
    } else unknown++;
  }
  return { perT: made > 0 ? scrap / made : 0, preConsumerPct: scrap > 0 ? (pre / scrap) * 100 : null, known, unknown };
}

/** What each good's Annex IV point 2 parameters ask for, and what is still open. "Ready" now means everything the category asks for is there, not
    that something was typed: an alloyed good with no scrap figure is partly there, and the row says which. */
function sectorRow(facts: Facts[]): ReportRow {
  if (facts.length === 0) return row("35", "Values of the sector-specific parameters of each good", "—", "missing");
  const per = facts.map((x) => {
    const params = sectorParamsFor(x.agg as AggregatedGoodsCategory);
    if (params.length === 0) return { text: `${x.ws.productName}: none required`, state: "not_applicable" as ItemState };
    const isSteel = STEEL.has(x.agg);
    const isAl = ALUMINIUM.has(x.agg);
    if (isSteel || isAl) {
      const sp = x.mmd.sectorParameters;
      const made = x.months.reduce((a, mo) => a + (mo.productionTonnes || 0), 0);
      // The methodology's own figure wins where the plant gave one; otherwise the months and the bought-in steel or aluminium give it.
      const own = scrapFromMonths(x.months);
      const carried = scrapFromPrecursors(x, made);
      const stated = isAl ? given(sp?.scrapTonnesPerTonneAluminium) : given(sp?.scrapTonnesPerTonneSteel);
      const fromParts = own || carried.known > 0 ? (own?.perTonne ?? 0) + carried.perT : null;
      const scrapPerT = stated ?? (fromParts != null && carried.unknown === 0 ? Math.round(fromParts * 1000) / 1000 : null);
      const ownPreShare = own && own.perTonne > 0 ? { t: own.perTonne * made, pct: own.preConsumerPct } : null;
      const derivedPre =
        fromParts != null && fromParts > 0
          ? Math.round((((ownPreShare ? ownPreShare.t * (ownPreShare.pct / 100) : 0) + (carried.preConsumerPct != null ? carried.perT * made * (carried.preConsumerPct / 100) : 0)) / (fromParts * made)) * 1000) / 10
          : null;
      const prePct = given(sp?.preConsumerScrapPct) ?? (carried.unknown === 0 ? derivedPre : null);
      /* The months' certificates, weighted by what was made, win over a single annual figure: they are what the plant actually cast. */
      const comp = weightedComposition(x.months);
      const mn = comp?.mnPct ?? given(sp?.mnPct);
      const cr = comp?.crPct ?? given(sp?.crPct);
      const ni = comp?.niPct ?? given(sp?.niPct);
      const other = comp?.otherPct ?? given(sp?.otherAlloyingPct);
      const deliveries = x.months.flatMap((mo) => mo.scrapDeliveries ?? []);
      const suppliers = new Set(deliveries.map((d) => text(d.supplier).toLowerCase()).filter(Boolean));
      const carbon = given(sp?.carbonPct);
      const parts = [
        isSteel && sp?.reducingAgent && `reducing agent ${sp.reducingAgent === "other" ? text(sp.reducingAgentOther) || "other" : sp.reducingAgent}`,
        scrapPerT != null && `scrap ${scrapPerT} t/t`,
        scrapPerT != null && carried.known > 0 && stated == null && `of which ${Math.round(carried.perT * 1000) / 1000} t/t is in the ${carried.known} precursor(s) bought in, from their producers' own figures`,
        scrapPerT != null && scrapPerT > 0 && prePct != null && `pre-consumer scrap ${prePct}%`,
        deliveries.length > 0 && `scrap from ${suppliers.size} supplier(s) in ${deliveries.length} delivery(ies)`,
        isSteel && mn != null && `Mn ${mn}%`,
        isSteel && cr != null && `Cr ${cr}%`,
        isSteel && ni != null && `Ni ${ni}%`,
        isSteel && other != null && `other alloy elements ${other}%`,
        isSteel && comp && "alloy figures weighted by tonnes made, from the months' certificates",
        isSteel && carbon != null && `carbon ${carbon}%`,
        isAl && given(sp?.nonAluminiumPct) != null && `non-aluminium elements ${sp?.nonAluminiumPct}%`,
      ].filter(Boolean);

      // What this good's category still asks for. Annex IV point 2: the alloying elements and the scrap figures for steel, the reducing agent for pig
      // iron and direct reduced iron (for crude steel and products only "if known"), carbon and the element for a ferro-alloy, scrap for aluminium.
      const open: string[] = [];
      const alloyed = x.agg === "Pig iron" || x.agg === "Direct reduced iron" || x.agg === "Crude steel" || x.agg === "Iron or steel products";
      if ((x.agg === "Pig iron" || x.agg === "Direct reduced iron") && !sp?.reducingAgent) open.push("the main reducing agent");
      if (alloyed) {
        const missing = [mn == null && "Mn", cr == null && "Cr", ni == null && "Ni", other == null && "other alloying elements"].filter(Boolean);
        if (missing.length) open.push(`the alloy percentages (${missing.join(", ")}; enter 0 where there is none)`);
      }
      if (x.agg === "Ferro-alloys") {
        if (mn == null && cr == null && ni == null) open.push("the manganese, chromium or nickel percentage of the alloy");
        if (carbon == null) open.push("the carbon percentage");
      }
      if (x.agg === "Crude steel" || x.agg === "Iron or steel products" || isAl) {
        if (scrapPerT == null) open.push(carried.unknown > 0 ? `the scrap used (${carried.unknown} bought-in precursor(s) on default values carry no scrap figure — enter the total for the good, or use actual values)` : "the tonnes of scrap used per tonne (enter 0 if none)");
        else if (scrapPerT > 0 && prePct == null) open.push("the pre-consumer share of the scrap");
      }
      const state: ItemState = parts.length === 0 ? "missing" : open.length > 0 ? "partial" : "ready";
      const tail = open.length ? ` — still needed: ${open.join("; ")}` : "";
      return { text: `${x.ws.productName}: ${parts.length ? parts.join(", ") : "none entered"}${tail}`, state };
    }
    return { text: `${x.ws.productName}: ${params.map((p) => p.label).join(", ")} - kept outside the portal`, state: "outside" as ItemState };
  });
  const order: ItemState[] = ["missing", "partial", "outside", "ready", "not_applicable"];
  const state = order.find((o) => per.some((p) => p.state === o)) ?? "not_applicable";
  return row("35", "Values of the sector-specific parameters of each good", per.map((p) => p.text).join("; "), state);
}

/** The source streams the monthly readings actually carry, in a line: fuels, the carbon-balance materials, the fluxes and the PFC method. */
function sourceStreamSummary(ms: MonthlyEntry[]): string {
  const fuels = new Set(ms.flatMap((mo) => mo.fuels.map((fu) => fuelTypeLabel(fu.fuelType, fu.fuelTypeOther))));
  const used = ms.flatMap((mo) => (mo.processEmissionEntries ?? []).filter((e) => Number(e.quantityT) !== 0));
  const materials = new Set(used.filter((e) => e.method === "mass_balance").map((e) => processEntryLabel(e)));
  const fluxes = new Set(used.filter((e) => e.method === "standard").map((e) => processEntryLabel(e)));
  const pfc = ms.find((mo) => mo.pfc)?.pfc;
  const parts = [
    fuels.size > 0 && `fuels: ${[...fuels].join(", ")}`,
    materials.size > 0 && `mass balance: ${[...materials].join(", ")}`,
    fluxes.size > 0 && `standard method: ${[...fluxes].join(", ")}`,
    pfc && `PFC by the ${pfc.method === "slope" ? "slope" : "overvoltage"} method`,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "In the monthly readings of each product report";
}

/* ── What the monthly readings add up to, for the items that are only ever
   read off them: 9, 14, 16(b), 16(d) and 17. ─────────────────────────── */
const monthsOfAll = (facts: Facts[]): MonthlyEntry[] => facts.flatMap((x) => x.months);
const sumOf = (ms: MonthlyEntry[], fn: (m: MonthlyEntry) => number | undefined) => ms.reduce((a, m) => a + (fn(m) || 0), 0);
const flow = (ms: MonthlyEntry[], key: "heatGj" | "wasteGasGj") => ({
  imported: sumOf(ms, (m) => m[key]?.imported),
  produced: sumOf(ms, (m) => m[key]?.produced),
  consumed: sumOf(ms, (m) => m[key]?.consumed),
  exported: sumOf(ms, (m) => m[key]?.exported),
});
const flowText = (name: string, v: ReturnType<typeof flow>) => `${name}: ${f(v.imported, 1)} in, ${f(v.produced, 1)} made, ${f(v.consumed, 1)} used, ${f(v.exported, 1)} out (GJ)`;

/** Item 9 — everything the installation drew. Where the plant gave the
    installation-wide figure for a month it is used (the same figure sits on each
    product report's month, so the largest is taken, not the sum); otherwise the
    CBAM goods' own electricity stands in for it. */
function installationElectricity(facts: Facts[]): { mwh: number; reported: boolean } {
  const months = new Set(monthsOfAll(facts).map((m) => m.month));
  let mwh = 0;
  let reported = facts.length > 0;
  for (const month of months) {
    const same = monthsOfAll(facts).filter((m) => m.month === month);
    const entered = Math.max(0, ...same.map((m) => m.electricityInstallationTotalMwh || 0));
    if (entered > 0) mwh += entered;
    else {
      mwh += sumOf(same, (m) => m.electricityMwh);
      reported = false;
    }
  }
  return { mwh, reported };
}

/* ── 2 · Operator's emissions report (Annex IV 1.1, items 1–35) ─── */
function emissionsReport(i: Installation | null, facts: Facts[], year: number): ReportDoc {
  const m = i?.monitoring;
  const sum = (fn: (x: Facts) => number) => facts.reduce((a, x) => a + fn(x), 0);
  const noReports = facts.length === 0;
  const allComputable = !noReports && facts.every((x) => x.see.computable);
  const allMonths = !noReports && facts.every((x) => x.see.production.complete);
  const totalDirect = sum((x) => x.see.directTCO2);
  const indirectGoods = facts.filter((x) => x.indirectCounts);
  const pt = precursorTables(facts);
  const qa = (key: (typeof MONITORING_QUESTIONS)[number]["key"], detailKey: (typeof MONITORING_QUESTIONS)[number]["detailKey"], n: string, label: string): ReportRow => {
    const a = m?.[key] as string | undefined;
    if (!a) return row(n, label, "—", "missing");
    if (a === "no") return row(n, label, "No", "ready");
    return row(n, label, `Yes — ${text(m?.[detailKey] as string) || "details missing"}`, text(m?.[detailKey] as string) ? "ready" : "partial");
  };

  const goods: ReportTable = {
    head: ["CN code", "Good", "Production route", "Quantity produced (t)", "SEE direct (tCO2e/t)", "SEE indirect", "SEE of precursors"],
    rows: facts.map((x) => [x.ws.cnCode || "—", x.ws.productName, x.route, f(x.see.production.tonnes), f(x.see.seeDirect, 5), x.indirectCounts ? f(x.see.seeIndirect, 5) : "n/a", f(x.see.seePrecursor, 5)]),
  };
  const attributed: ReportTable = {
    head: ["Production process (good)", "Activity level (t)", "Attributed direct emissions (tCO2)", "of which fuel", "of which process"],
    rows: facts.map((x) => [`${x.ws.productName} (CN ${x.ws.cnCode})`, f(x.see.production.tonnes), f(x.see.directTCO2, 2), f(x.see.fuelTCO2, 2), f(x.see.processTCO2, 2)]),
  };

  const sec: ReportSection[] = [
    { title: "1 · Operator and installation", rows: identityRows(i, true) },
    {
      title: "2–6 · Summary of the monitoring plan",
      rows: [
        row("2(a)", "CBAM production processes and routes", facts.length ? facts.map((x) => `${x.ws.productName} — ${x.route}`).join("; ") : "—", facts.length ? "ready" : "missing"),
        have(m?.nonCbamProcesses, "Non-CBAM production processes", "2(b)"),
        row("2(c)", "The five most important goods by mass produced per production process, identified by CN code", facts.length ? topGoodsPerProcess(facts) : "—", facts.length ? "ready" : "missing"),
        have(m?.topFuels, "The five most important fuels, by energy content", "2(d)"),
        have(m?.topMaterials, "The five most important materials leading to process emissions, by emissions", "2(e)"),
        qa("cems", "cemsDetail", "2(f)", "Continuous emissions measurement: the gases and the five biggest sources it is applied to"),
        qa("zeroRatedFuels", "zeroRatedDetail", "2(g)", "Zero-rated fuels, and how the operator demonstrates that zero-rating applies"),
        qa("heatTrade", "heatDetail", "2(h)", "Measurable heat imported from or exported to other installations, and which"),
        qa("electricityMixed", "electricityDetail", "3", "Electricity from different sources, in which quantities — and the supplier's name and country where another installation supplies it"),
        qa("onsiteElectricity", "onsiteElectricityDetail", "4", "Electricity produced inside the installation: co-generation or separate generation, fossil or renewable, and whether it is exported from a production process (a–d)"),
        qa("wasteGases", "wasteGasDetail", "5", "Waste gases produced and used here, or imported from or exported to other installations — which"),
        qa("co2Transfer", "co2TransferDetail", "6", "CO2 transfer: the identity and contact details of the responsible person at the receiving installation or transport infrastructure"),
      ],
    },
    {
      title: "7–12 · Direct emissions and electricity",
      rows: [
        row("7", "Total direct emissions of the installation in the reporting period", allComputable ? `${f(totalDirect, 2)} tCO2` : noReports ? "—" : `${f(totalDirect, 2)} tCO2 so far`, allComputable && allMonths ? "ready" : noReports ? "missing" : "partial"),
        row("8", "Months of monitoring, for a new installation", "Applies only to a new installation", "not_applicable"),
        indirectGoods.length
          ? row(
              "9",
              "Total electricity consumed in the installation",
              `${f(installationElectricity(facts).mwh, 1)} MWh${installationElectricity(facts).reported ? "" : " (the CBAM goods' own readings — enter the installation-wide figure in the monthly data to widen it)"}`,
              indirectGoods.every((x) => x.see.production.complete) ? "ready" : "partial",
            )
          : row("9", "Total electricity consumed in the installation", "Every good here is in Annex II — direct emissions only", "not_applicable"),
        indirectGoods.length
          ? row("10", "Electricity consumed for these goods", `${f(indirectGoods.reduce((a, x) => a + x.months.reduce((b, mo) => b + (mo.electricityMwh || 0), 0), 0), 1)} MWh`, "ready")
          : row("10", "Electricity consumed for these goods", "Not applicable", "not_applicable"),
        (() => {
          /* Item 11 names where the electricity comes from. It is answered by any of three things the portal already holds — the supply chosen in the
             methodology (a grid, a PPA producer), a supplier installation named on a month's electricity row, or the detail given when the site said
             it has more than one source — so a plant on one grid connection is not stuck on a box that only opens for "more than one source". */
          const label = "Installations from which the electricity is obtained";
          if (indirectGoods.length === 0) return row("11", label, "Not applicable", "not_applicable");
          const named = new Set<string>();
          for (const x of indirectGoods) {
            for (const mo of x.months) for (const e of mo.electricitySources ?? []) if (text(e.supplierInstallation)) named.add(text(e.supplierInstallation));
            if (x.mmd.electricitySupply) named.add(electricitySupplyLabel(x.mmd.electricitySupply, x.mmd.electricitySupplyOther));
          }
          if (m?.electricityMixed === "yes" && text(m.electricityDetail)) named.add(text(m.electricityDetail));
          return row("11", label, named.size ? [...named].join("; ") : "—", named.size ? "ready" : "missing");
        })(),
        indirectGoods.length
          ? row("12", "Electricity per source: quantity, country, emission factor", "See the monthly readings of each product report", indirectGoods.every((x) => x.months.length > 0) ? "ready" : "partial")
          : row("12", "Electricity per source", "Not applicable", "not_applicable"),
      ],
    },
    {
      title: "13–15 · Goods and specific embedded emissions",
      rows: [
        row("13", "Total goods produced, per production process", facts.length ? `${facts.length} good(s)` : "—", allMonths ? "ready" : noReports ? "missing" : "partial"),
        nonCbamRow("14", "Non-CBAM goods produced per production process", m, facts),
        row("15(a)", "Specific direct embedded emissions of each good", allComputable ? facts.map((x) => `${x.ws.productName}: ${f(x.see.seeDirect, 5)} tCO2e/t`).join("; ") : "—", allComputable ? "ready" : "missing"),
        row("15(b)", "Specific direct embedded emissions of compositions of goods", "Applies only where a good has compositions", "not_applicable"),
        row(
          "15(c)",
          "Data quality and methods; whether default values were used",
          facts.map((x) => `${x.ws.productName}: ${x.precursors.some((p) => p.dataOrigin === "default_value") ? "default values used for some precursors" : "monitoring throughout"}`).join("; ") || "—",
          noReports ? "missing" : "ready",
        ),
        row("15(d)", "Share of embedded emissions for which default values were used", facts.map((x) => `${x.ws.productName}: ${f(x.see.precursors.defaultValueShare * 100, 1)}% of precursor emissions`).join("; ") || "—", noReports ? "missing" : "ready"),
        indirectGoods.length
          ? row("15(e)", "Indirect emissions: share on actual and on default values; specific indirect emissions", indirectGoods.map((x) => `${x.ws.productName}: ${f(x.see.seeIndirect, 5)} tCO2e/t, from the monthly electricity readings`).join("; "), indirectGoods.every((x) => x.see.production.complete) ? "ready" : "partial")
          : row("15(e)", "Indirect emissions (goods not in Annex II)", "Not applicable", "not_applicable"),
        m?.electricityToEu === "yes" ? row("15(f)", "Electricity imported into the Union", "See the declarant-specific addendum", "outside") : row("15(f)", "Electricity imported into the Union", "Not applicable", "not_applicable"),
      ],
      tables: [{ caption: "Goods produced and their specific embedded emissions", table: goods }],
    },
    {
      title: "16–17 · Total emissions and balances",
      rows: [
        row(
          "16(a)",
          "Activity data per production process and calculation factors per source stream",
          facts.length ? [sourceStreamSummary(monthsOfAll(facts)), derivedNote(facts)].filter(Boolean).join(" · ") : "—",
          allMonths ? "ready" : noReports ? "missing" : "partial",
        ),
        (() => {
          const measured = monthsOfAll(facts).flatMap((mo) => mo.measuredEmissions ?? []);
          const label = "Emissions of each source monitored by measurement";
          if (m?.cems === "yes")
            return measured.length
              ? row("16(b)", label, `${f(measured.reduce((a, e) => a + (e.tCO2e || 0), 0), 2)} tCO2e from ${new Set(measured.map((e) => e.source.trim())).size} source(s)`, "ready")
              : row("16(b)", label, "Continuous measurement is used but no measured emissions are entered", "missing");
          return row("16(b)", label, m?.cems === "no" ? "No continuous measurement" : "Answer 2(f) first", "not_applicable");
        })(),
        row("16(c)", "Emissions determined by other methods", "Kept in the plant's records", "outside"),
        (() => {
          const ms = monthsOfAll(facts);
          const received = sumOf(ms, (mo) => mo.co2ReceivedT);
          const sentOn = sumOf(ms, (mo) => mo.co2TransferredOutT);
          const label = "CO2 received from other installations, and exported to them for storage or permanent use";
          const detail = text(m?.co2TransferDetail);
          if (!m?.co2Transfer) return row("16(d)", label, "—", "missing");
          if (m.co2Transfer === "no") return row("16(d)", label, "No", "ready");
          return row("16(d)", label, `Yes — ${detail || "details missing"}; received ${f(received, 2)} t, sent on ${f(sentOn, 2)} t`, detail && received + sentOn > 0 ? "ready" : "partial");
        })(),
        row("16(e)", "Data gaps and estimates used", `${f(sum((x) => estimatedGapTCO2e(x.mmd)), 2)} tCO2e estimated`, noReports ? "missing" : "ready"),
        (() => {
          const ms = monthsOfAll(facts);
          const heat = flow(ms, "heatGj");
          const waste = flow(ms, "wasteGasGj");
          const produced = sumOf(ms, (mo) => (mo.electricitySources ?? []).filter((e) => e.sourceType === "self_generated").reduce((a, e) => a + (e.mwh || 0), 0));
          const bought = sumOf(ms, (mo) => (mo.electricitySources ?? []).filter((e) => e.sourceType !== "self_generated").reduce((a, e) => a + (e.mwh || 0), 0));
          const exported = sumOf(ms, (mo) => mo.electricityExportedMwh);
          const any = (v: ReturnType<typeof flow>) => v.imported + v.produced + v.consumed + v.exported > 0;
          const parts = [`Electricity: ${f(bought, 1)} in, ${f(produced, 1)} made, ${f(bought + produced - exported, 1)} used, ${f(exported, 1)} out (MWh)`];
          if (any(heat)) parts.push(flowText("Heat", heat));
          if (any(waste)) parts.push(flowText("Waste gases", waste));
          const relevant = indirectGoods.length > 0 || m?.heatTrade === "yes" || m?.wasteGases === "yes";
          const have = bought + produced + exported > 0 || any(heat) || any(waste);
          const gasRows = wasteGasTable(facts).rows.length;
          if (gasRows > 0) parts.push(`waste gases from ${gasRows} gas row(s) of volume and composition — see the table`);
          return row("17", "Balance of imported, produced, consumed and exported measurable heat, waste gases and electricity per production process", have ? parts.join("; ") : "—", have ? "ready" : relevant ? "missing" : "not_applicable");
        })(),
      ],
      tables: [
        { caption: "Activity level and attributed emissions per production process", table: attributed },
        { caption: "Item 16(a) — quantities worked out from deliveries and stock", table: stockTable(facts) },
        { caption: "Item 17 — waste gases, by gas", table: wasteGasTable(facts) },
      ],
    },
    {
      title: "18–28 · Precursors",
      rows: [
        internalRow("18 · 19", "Quantity of each precursor produced at the installation and used by it, and in each production process", facts),
        row("20 · 21", "Quantity of each precursor produced outside the installation and used", pt.quantity.rows.length ? `${pt.quantity.rows.length} precursor line(s)` : "No direct precursor", pt.quantity.rows.length || facts.every((x) => !x.precursors.length) ? "ready" : "missing"),
        row("22", "Precursors on default values: CN code, name, country of origin, default value", pt.onDefault.rows.length ? `${pt.onDefault.rows.length} precursor(s)` : "None", "ready"),
        row("23", "Precursors on actual values: CN code, name, country, reporting period, specific embedded emissions", pt.onActual.rows.length ? `${pt.onActual.rows.length} precursor(s)` : "None", "ready"),
        row("24", "Precursors received from different reporting periods", "Stated in item 23 where it applies", "not_applicable"),
        row("25", "Precursors of one CN code obtained from several installations", facts.some((x) => x.precursors.some((p) => p.alsoFromOtherInstallations)) ? "Weighted average applies — see the product reports" : "None", "ready"),
        row(
          "26",
          "Electricity used in each production process",
          indirectGoods.length ? (sharedTable(indirectGoods).rows.some((r) => r[3] === "Electricity") ? "See item 12 — taken from shared meter(s), split by an allocation key (table below)" : "See item 12") : "Not applicable",
          indirectGoods.length ? "ready" : "not_applicable",
        ),
        internalRow("27", "Quantity of precursors produced at the installation and used in each production process", facts),
        row("28", "Operator and installation of origin of each precursor on an actual value", pt.origin.rows.length ? `${pt.origin.rows.length} precursor(s)` : "None", "ready"),
      ],
      tables: [
        { caption: "Items 18, 19 and 27 — precursors made at this installation", table: internalTable(facts) },
        { caption: "Item 22 — precursors on default values", table: pt.onDefault },
        { caption: "Item 23 — precursors on actual values", table: pt.onActual },
        { caption: "Item 28 — operator and installation of origin", table: pt.origin },
        { caption: "Items 20 and 21 — quantities used", table: pt.quantity },
      ],
    },
    {
      title: "29–35 · Attribution and parameters",
      rows: [
        row(
          "29",
          "How the attributed direct and indirect emissions of each production process were calculated",
          (facts.every((x) => x.mmdFinal) && !noReports ? "Described in the final monitoring methodology" : "Methodology not finalised") +
            (sharedTable(facts).rows.length > 0 ? `; shared meters are split by ${[...new Set(sharedTable(facts).rows.map((r) => r[5].toLowerCase()))].join(" and ")} (table below)` : ""),
          facts.every((x) => x.mmdFinal) && !noReports ? "ready" : "partial",
        ),
        row("30", "Activity level and attributed emissions of each production process", facts.length ? "Table above" : "—", allComputable ? "ready" : "missing"),
        row("31", "List of all goods produced, in the functional unit, for each CN code", facts.length ? facts.map((x) => x.ws.cnCode).join(", ") : "—", facts.length ? "ready" : "missing"),
        row("32", "Electricity emission factor, if actual values are used", indirectGoods.length ? "Per source, in the monthly readings" : "Not applicable", indirectGoods.length ? "ready" : "not_applicable"),
        row("33", "Electricity emission factor in a power purchase agreement", indirectGoods.length ? "Attach the agreement as evidence where one applies" : "Not applicable", indirectGoods.length ? "outside" : "not_applicable"),
        row("34", "Quantity of goods per production route", facts.length ? facts.map((x) => `${x.route}: ${f(x.see.production.tonnes)} t`).join("; ") : "—", allMonths ? "ready" : noReports ? "missing" : "partial"),
        sectorRow(facts),
      ],
      tables: [
        { caption: "Items 26, 29 and 30 — shared meters and how they are split", table: sharedTable(facts) },
        { caption: "Item 35 — scrap by delivery", table: scrapTable(facts) },
      ],
    },
  ];
  const t = tally(sec);
  void year;
  return {
    kind: "emissions_report",
    title: REPORT_LABEL.emissions_report,
    reg: "Annex IV point 1.1, Implementing Regulation (EU) 2025/2547 — items 1 to 35",
    purpose: "The full report the verifier verifies. It is in English (Article 10(4)).",
    applicable: true,
    sections: sec,
    tally: t,
    complete: done(t),
  };
}

/* ── 3 · Operator's summary emissions report (Annex IV 1.2) ─────── */
function summaryReport(i: Installation | null, facts: Facts[]): ReportDoc {
  const m = i?.monitoring;
  const noReports = facts.length === 0;
  const allComputable = !noReports && facts.every((x) => x.see.computable);
  const indirectGoods = facts.filter((x) => x.indirectCounts);
  const pt = precursorTables(facts);
  const yn = (v: string | undefined, d: string | undefined, n: string, label: string): ReportRow => {
    if (!v) return row(n, label, "—", "missing");
    if (v === "no") return row(n, label, "No", "ready");
    return row(n, label, `Yes — ${text(d) || "details missing"}`, text(d) ? "ready" : "partial");
  };

  const free = benchmarkTable(facts);

  const sec: ReportSection[] = [
    { title: "1–2 · Operator and installation", rows: identityRows(i, true, true) },
    {
      title: "3–6 · Processes and emissions",
      rows: [
        row("3", "CBAM production processes and routes, with the goods of each", facts.length ? facts.map((x) => `${x.ws.productName} (CN ${x.ws.cnCode}) — ${x.route}`).join("; ") : "—", facts.length ? "ready" : "missing"),
        row("4(a)", "Specific direct embedded emissions of each good", allComputable ? facts.map((x) => `${x.ws.productName}: ${f(x.see.seeDirect, 5)} tCO2e/t`).join("; ") : "—", allComputable ? "ready" : "missing"),
        row("4(b)", "Share of embedded emissions for which default values were used", facts.map((x) => `${x.ws.productName}: ${f(x.see.precursors.defaultValueShare * 100, 1)}%`).join("; ") || "—", noReports ? "missing" : "ready"),
        indirectGoods.length
          ? row("4(c)", "Indirect emissions: shares and specific indirect emissions", indirectGoods.map((x) => `${x.ws.productName}: ${f(x.see.seeIndirect, 5)} tCO2e/t`).join("; "), indirectGoods.every((x) => x.see.production.complete) ? "ready" : "partial")
          : row("4(c)", "Indirect emissions (goods not in Annex II)", "Not applicable", "not_applicable"),
        m?.electricityToEu === "yes" ? row("4(d)", "Electricity imported into the Union", "See the declarant-specific addendum", "outside") : row("4(d)", "Electricity imported into the Union", "Not applicable", "not_applicable"),
        row("4(e)", "Specific embedded free allocation of each good", facts.length ? "Table below" : "—", facts.length ? "ready" : "missing"),
        row("4(f)", "Confirmation of the CBAM benchmarks used and the method for the free allocation", "Benchmarks of Implementing Regulation (EU) 2025/2620; CSCF not yet applied", facts.length ? "ready" : "missing"),
        row("5", "Total direct emissions of the installation and per production process", allComputable ? `${f(facts.reduce((a, x) => a + x.see.directTCO2, 0), 2)} tCO2` : "—", allComputable ? "ready" : "missing"),
        indirectGoods.length
          ? row("6", "Indirect emissions of the installation", `${f(indirectGoods.reduce((a, x) => a + x.see.indirectTCO2, 0), 2)} tCO2`, "ready")
          : row("6", "Indirect emissions of the installation", "Not applicable", "not_applicable"),
      ],
      tables: [{ caption: "Item 4(e) — specific embedded free allocation", table: free }],
    },
    {
      title: "7–11 · Heat, fuels, gases and electricity",
      rows: [
        yn(m?.heatTrade, m?.heatDetail, "7", "Measurable heat imported or exported"),
        yn(m?.zeroRatedFuels, m?.zeroRatedDetail, "8", "Zero-rated fuels"),
        yn(m?.wasteGases, m?.wasteGasDetail, "9", "Waste gases"),
        yn(m?.co2Transfer, m?.co2TransferDetail, "10", "CO2 capture and transfer"),
        yn(m?.onsiteElectricity, m?.onsiteElectricityDetail, "11", "Electricity produced inside the installation"),
      ],
    },
    {
      title: "12–16 · Precursors",
      rows: [
        row("12", "Precursors on default values: CN code, name, country, default value", pt.onDefault.rows.length ? `${pt.onDefault.rows.length} precursor(s)` : "None", "ready"),
        row("13", "Precursors on actual values: CN code, name, country, period, specific embedded emissions", pt.onActual.rows.length ? `${pt.onActual.rows.length} precursor(s)` : "None", "ready"),
        row("14", "Precursors received from different reporting periods", "Stated in item 13 where it applies", "not_applicable"),
        row("15", "Precursors of one type from several installations", facts.some((x) => x.precursors.some((p) => p.alsoFromOtherInstallations)) ? "Weighted average applies" : "None", "ready"),
        row("16", "Operator and installation of origin of each precursor", pt.origin.rows.length ? `${pt.origin.rows.length} precursor(s)` : "None", "ready"),
      ],
      tables: [
        { caption: "Item 12 — precursors on default values", table: pt.onDefault },
        { caption: "Item 13 — precursors on actual values", table: pt.onActual },
        { caption: "Item 16 — operator and installation of origin", table: pt.origin },
      ],
    },
  ];
  const t = tally(sec);
  return {
    kind: "summary_report",
    title: REPORT_LABEL.summary_report,
    reg: "Annex IV point 1.2, Implementing Regulation (EU) 2025/2547 — items 1 to 16",
    purpose: "The shortened report passed on to authorised CBAM declarants (Article 8).",
    applicable: true,
    sections: sec,
    tally: t,
    complete: done(t),
  };
}

/* ── 4 · Declarant-specific addendum (Annex IV 1.1.1) ───────────── */
function addendum(i: Installation | null): ReportDoc {
  const applies = i?.monitoring.electricityToEu === "yes";
  const sections: ReportSection[] = applies
    ? [
        {
          title: "Per authorised CBAM declarant",
          rows: [
            row("1", "EORI number of the authorised CBAM declarant", "Entered per declarant when the addendum is issued", "outside"),
            row("2", "Criteria for the use of actual values (Annex IV points 5(a), 5(d) and, where relevant, 5(b)) met; evidence submitted to the verifier (Annex II D.2.4)", "Confirmed by the operator", "outside"),
            row("3", "Quantity of electricity imported by that declarant from the installation", "Entered per declarant", "outside"),
          ],
        },
      ]
    : [];
  const t = tally(sections);
  return {
    kind: "declarant_addendum",
    title: REPORT_LABEL.declarant_addendum,
    reg: "Annex IV point 1.1.1, Implementing Regulation (EU) 2025/2547",
    purpose: "One per authorised declarant, only for electricity imported into the EU.",
    applicable: applies,
    notApplicable: applies ? undefined : "This installation does not export electricity to the EU, so no addendum is needed.",
    sections,
    tally: t,
    complete: true,
  };
}

/* ════════════════════════════════════════════════════════════
   THE TWO ATTACHMENTS — what travels with the reports

   The regulation defines three reports the operator makes (and a fourth where
   electricity is imported into the Union). Two more things go to the verifier
   with them, and neither is a report the operator writes:

     · the verification reports of the installations that made the precursors
       the operator used on actual values — Annex II A.1(4) lets a third-country
       figure in only on the strength of one, and recital 18 says the same;
     · the supporting evidence and records — the bills, meter logs, certificates
       and calibration records every figure rests on (Annex II A.5(22)(h), D.2.4 and D.4.3).

   Each is shown as an INDEX, in the package, in the same grammar as the reports
   — one row per document, the figure it supports — and the documents themselves
   travel beside it. They never hold the package back: what is missing from an
   index is a thing to go and get, not a field to fill, and the product reports'
   own readiness already counts the evidence. They say so, in their own words.
   ════════════════════════════════════════════════════════════ */

/** Precursors on an actual value, made outside the Union: each owes a verification report (Annex II A.1(4)). */
function precursorVerification(facts: Facts[]): ReportDoc {
  const table: ReportTable = {
    head: ["Product report", "Precursor", "CN code", "Country", "Producer · installation", "Reporting period", "Verifier and its address", "Accreditation no.", "Report issued", "Report file", "Meets A.1(4)"],
    rows: [],
  };
  const rows: ReportRow[] = [];
  for (const x of facts) {
    for (const p of x.precursors) {
      if (p.valueBasis !== "actual" || p.originUnknown || !p.country || isEuOrExempt(p.country)) continue;
      const adm = admissibility(p, x.ws);
      const filed = Boolean(p.verificationReportFileId);
      const name = `${x.ws.productName} — ${p.precursorName || "precursor"}${p.cnCode ? ` (CN ${p.cnCode})` : ""}, ${countryName(p.country)}`;
      table.rows.push([
        x.ws.productName,
        p.precursorName || "—",
        p.cnCode || "—",
        countryName(p.country),
        [p.name, p.installationName].filter((s) => text(s)).join(" · ") || "—",
        text(p.reportingPeriodStart) && text(p.reportingPeriodEnd) ? `${p.reportingPeriodStart} to ${p.reportingPeriodEnd}` : "—",
        [p.verifierName, p.verifierAddress].filter((s) => text(s)).join(", ") || "—",
        text(p.verifierAccreditationNumber) || "—",
        text(p.verificationReportIssueDate) || "—",
        filed ? "attached" : "not attached",
        adm.usable ? "yes" : adm.state === "not_admissible" ? "no" : "not yet",
      ]);
      if (adm.usable) rows.push(row("—", name, `${text(p.verifierName) || "verifier"}, accreditation ${text(p.verifierAccreditationNumber) || "—"}, report of ${text(p.verificationReportIssueDate) || "—"} — attached`, "ready"));
      else if (adm.state === "not_admissible") rows.push(row("—", name, `The report is in but does not meet A.1(4): ${adm.reasons.join(" ")} The default value stands in.`, "partial"));
      else rows.push(row("—", name, filed ? "Report attached; the verifier's details are not all entered" : "No verification report yet — until there is one the default value stands in", adm.state === "needs_you" ? "partial" : "missing"));
    }
  }
  const sections: ReportSection[] = [
    {
      title: "Precursors on actual values, made outside the Union",
      rows: rows.length > 0 ? rows : [row("—", "Precursors on an actual value from outside the Union", "None — no verification report is owed", "not_applicable")],
      tables: [{ caption: "The verification reports behind them", table }],
    },
  ];
  const t = tally(sections);
  return {
    kind: "precursor_verification",
    title: REPORT_LABEL.precursor_verification,
    reg: "Annex II point A.1(4) and recital 18, Implementing Regulation (EU) 2025/2547 · verification report template, Implementing Regulation (EU) 2025/2546",
    purpose: "The verification reports of the installations that made your precursors on actual values. The reports themselves are in the package, beside this index.",
    applicable: true,
    sections,
    tally: t,
    complete: done(t),
  };
}

/** Every document attached to the year's product reports, and the figure each one supports. */
function evidenceIndex(facts: Facts[]): ReportDoc {
  const table: ReportTable = { head: ["Product report", "Period", "Document type", "File", "Figure it supports", "Attached by", "Attached on", "Reviewed"], rows: [] };
  const coverage: ReportRow[] = [];
  const filesHeld = { inPackage: 0, kept: 0 };

  for (const x of facts) {
    const items = listEvidence(x.ws.id);
    // The plain words for each key, from the requirements the months and the methodology carry.
    const labels = new Map<string, string>();
    for (const k of ANNUAL_REQUIRED_KEYS) labels.set(k.key, k.label);
    for (const mo of x.months) for (const k of requiredKeysForMonth(mo, x.indirectCounts)) labels.set(k.key, k.label);

    for (const e of [...items].sort((a, b) => (a.month ?? "9999").localeCompare(b.month ?? "9999") || a.capturedAt.localeCompare(b.capturedAt))) {
      if (e.fileDataUrl) filesHeld.inPackage++;
      else filesHeld.kept++;
      table.rows.push([
        x.ws.productName,
        e.month ? monthNameLong(e.month) : "Whole year",
        EVIDENCE_SOURCE_LABEL[e.sourceType] ?? e.sourceType,
        e.fileName,
        e.fieldKeys.map((k) => labels.get(k) ?? k).join("; ") || "—",
        text(e.uploadedBy) || "—",
        e.capturedAt.slice(0, 10),
        isReviewed(e) ? "yes" : "no",
      ]);
    }

    // Coverage: per month, how many of the documents the regulation expects are attached.
    for (const mo of x.months) {
      const c = coverageForMonth(x.ws.id, mo, x.indirectCounts);
      coverage.push(
        row("—", `${x.ws.productName} — ${monthNameLong(mo.month)}`, `${c.covered} of ${c.total} expected documents attached`, c.complete ? "ready" : c.covered > 0 ? "partial" : "missing"),
      );
    }
    if (x.months.length === 0) coverage.push(row("—", x.ws.productName, "No month submitted yet", "missing"));
  }

  const sections: ReportSection[] = [
    {
      title: "Documents expected, month by month",
      rows: coverage.length > 0 ? coverage : [row("—", "Supporting evidence", "No product report this year", "missing")],
    },
    {
      title: "Documents attached",
      rows: [
        (() => {
          const starts = facts.map((x) => x.ws.periodStart).filter(Boolean).sort();
          const ends = facts.map((x) => x.ws.periodEnd).filter(Boolean).sort();
          return row("—", "Reporting period covered", starts.length ? `${starts[0]} to ${ends[ends.length - 1]}` : "—", starts.length ? "ready" : "missing");
        })(),
        row("—", "Documents in this index", `${table.rows.length} document(s); ${filesHeld.inPackage} in the package${filesHeld.kept > 0 ? `, ${filesHeld.kept} too large to carry and kept by the operator` : ""}`, table.rows.length > 0 ? "ready" : "missing")],
      tables: [{ caption: "Index of supporting evidence and records", table }],
    },
  ];
  const t = tally(sections);
  return {
    kind: "evidence_index",
    title: REPORT_LABEL.evidence_index,
    reg: "Annex II points A.5(22)(h), D.2.4 and D.4.3, Implementing Regulation (EU) 2025/2547",
    purpose: "Every document behind a figure, and the figure it supports, so the verifier can sample a month and find its paper. The documents themselves are in the package, beside this index.",
    applicable: true,
    sections,
    tally: t,
    complete: done(t),
  };
}

/* ── The set ────────────────────────────────────────────────────── */
export type ReportSet = {
  year: number;
  /** three, or four when the addendum applies */
  reports: ReportDoc[];
  /** the two things that travel with the reports: the verification reports of precursor installations, and the supporting evidence.
      Indexes, never reports the operator writes — and they never hold the package back. */
  attachments: ReportDoc[];
  /** reports the set can include that this installation does not need — the addendum, when no electricity goes to the EU */
  notNeeded: ReportDoc[];
  /** the profile items still unanswered — they hold every report in the set */
  profileGaps: ReturnType<typeof profileGaps>;
  complete: boolean;
};

export function buildReportSet(args: { installation: Installation | null; workspaces: VerificationWorkspace[]; year: number }): ReportSet {
  const { installation, year } = args;
  const ws = args.workspaces.filter((w) => w.year === year && !w.archivedAt);
  const facts = ws.map(factsOf);
  const all = [monitoringPlan(installation, facts), emissionsReport(installation, facts, year), summaryReport(installation, facts), addendum(installation)];
  const reports = all.filter((r) => r.applicable);
  const iid = installation?.id || ws[0]?.installationId || "";
  const first = facts[0]?.ws.id;
  const attachments = [precursorVerification(facts), evidenceIndex(facts)];
  for (const r of [...all, ...attachments]) attachGuides(r, iid, first);
  return {
    year,
    reports,
    attachments,
    notNeeded: all.filter((r) => !r.applicable),
    profileGaps: profileGaps(installation),
    complete: reports.every((r) => r.complete) && facts.length > 0,
  };
}

const fileBase = (installation: Installation | null): string => (installation?.id || "installation").replace(/[^A-Za-z0-9-]/g, "");

/** The one download: every report of the set, zipped. */
export const reportPackageFileName = (installation: Installation | null, year: number): string => `${fileBase(installation)}_${year}_CBAM-report-package.zip`;

export const reportSetFileName = (installation: Installation | null, year: number, kind: ReportKind): string => {
  const base = fileBase(installation);
  const part: Record<ReportKind, string> = {
    monitoring_plan: "Monitoring-plan",
    emissions_report: "Operators-emissions-report",
    summary_report: "Operators-summary-emissions-report",
    declarant_addendum: "Declarant-specific-addendum",
    precursor_verification: "Verification-reports-of-precursor-installations",
    evidence_index: "Supporting-evidence-and-records-index",
  };
  return `${base}_${year}_${part[kind]}.pdf`;
};
