/* ════════════════════════════════════════════════════════════
   THE DECLARATION HIERARCHY — buyer → annual report → verification

   A declaration used to be a flat five-step wizard with a supplier table in
   the middle. That shape hid the one fact that governs the whole job:

        A DECLARATION FANS OUT INTO ONE ANNUAL REPORT PER
        SUPPLIER × PRODUCT, AND EACH OF THOSE IS A SEPARATE
        THING THAT GETS VERIFIED.

   Three suppliers and two products each is six reports, six methodologies, six
   sets of twelve months. An exporter who thinks they are filling in "a
   declaration" is going to be surprised in October. So the declaration screen
   is now the hierarchy itself:

        Buyer  (who this is filed for — top, because it is the one fact
                that makes the rest deliverable)
          └── Annual report  (supplier × product × year)
                └── Verification workspace  (the seven tabs, unchanged)

   WHAT THIS MODULE DOES AND DOES NOT DO. It derives the report list from the
   declaration's own request spec, and it finds or creates the workspace behind
   each row. It does NOT compute emissions — that is lib/workspace-see.ts
   through the Part-1 engine, and a second implementation here would be a
   second answer to the same question.

   WHY CREATION IS LAZY. A declaration for six supplier×product pairs does not
   create six workspaces the moment it is saved: most exporters edit the spec
   two or three times in the first week, and eagerly created workspaces would
   leave orphans behind every edit. A workspace appears when somebody opens the
   report, which is the first moment it has anything to hold.
   ════════════════════════════════════════════════════════════ */

import { aggregatedGoodsCategory, PRODUCT_CATALOG, getCatalogProduct } from "./config";
import { SELF_SUPPLIER_ID, isSelfSupplier, type Declaration, type SupplierRow } from "./data";
import { dotStates, workspaceReadiness, type TabState } from "./readiness";
import { shipmentsForWorkspace } from "./shipments";
import { annualProductionFor } from "./monthly-data";
import { listSuppliers } from "./precursor-suppliers";
import {
  createWorkspace,
  linkDeclaration,
  listWorkspaces,
  routesForCategory,
  type VerificationWorkspace,
} from "./workspace";

/** One row of the hierarchy: a supplier, a product, and the workspace that
    holds the year of evidence for that pair. */
export type AnnualReport = {
  /** stable across renders — supplier and product together identify the row */
  key: string;
  supplierId: string;
  supplierName: string;
  supplierCountry: string;
  selfSupplied: boolean;
  productId: string;
  productName: string;
  cnCode: string;
  /** the supplier's material could not be mapped to a CN code — the row still
      renders, because a supplier with no report is invisible */
  unresolved: boolean;
  /** set when the supplier provides an INPUT rather than a CBAM good. Such a
      supplier has no annual report and is never chased for one. */
  inputKind: InputKind | null;
  year: number;
  /** null until somebody opens it — see "why creation is lazy" above */
  workspace: VerificationWorkspace | null;
};

export type AnnualReportStatus = {
  report: AnnualReport;
  overall: TabState;
  dots: TabState[];
  monthsSubmitted: number;
  precursorCount: number;
  shipmentCount: number;
  /** the sentence under the row — the answer to "where is this one?" */
  subtitle: string;
};

const listCatalog = () => PRODUCT_CATALOG;

const yearOf = (d: Declaration): number => {
  const iso = d.periodStart ?? d.periodEnd;
  const parsed = iso ? Number(iso.slice(0, 4)) : NaN;
  if (Number.isFinite(parsed)) return parsed;
  // `period` is free text like "2026" or "FY2026 H1" — take the first year in
  // it rather than failing, because a declaration with no parseable year would
  // otherwise silently produce zero reports.
  const fromLabel = Number((d.period ?? "").match(/\b(20\d{2})\b/)?.[1]);
  return Number.isFinite(fromLabel) ? fromLabel : new Date().getFullYear();
};

const supplierName = (d: Declaration, supplierId: string): SupplierRow | undefined =>
  d.suppliers.find((s) => s.id === supplierId);

/** Find the workspace already standing behind a (supplier, product, year) row.

    Matched on installation + product + year rather than on a stored id,
    because the same physical installation legitimately feeds several
    declarations and we want the second declaration to REUSE the first one's
    year of readings rather than open an empty duplicate beside it. */
function findWorkspace(supplierId: string, productId: string, year: number): VerificationWorkspace | null {
  return listWorkspaces().find((w) => w.installationId === installationIdFor(supplierId) && w.productId === productId && w.year === year) ?? null;
}

/** A supplier's installation reference. Self-supply resolves to the exporter's
    own site; everyone else gets a reference derived from their supplier id, so
    the mapping is stable without a supplier→installation registry this MVP
    does not have. */
export const installationIdFor = (supplierId: string): string =>
  isSelfSupplier(supplierId) ? "SELF" : `SUP-${supplierId.toUpperCase()}`;

/* ── Deriving the rows ──────────────────────────────────────────
   Preferred source is `requests` — the wizard's explicit supplier × product
   grid. A declaration created before that existed only has `suppliers`, so
   each of those contributes one row against the declaration's own product
   where it can be resolved. Both shapes produce the same row type, so nothing
   downstream has to know which it came from. */
export function annualReportsFor(declaration: Declaration): AnnualReport[] {
  const year = yearOf(declaration);
  const rows: AnnualReport[] = [];

  const push = (supplierId: string, productId: string, inputKind: InputKind | null = null) => {
    const supplier = supplierName(declaration, supplierId);
    const product = getCatalogProduct(productId);
    const key = `${supplierId}::${productId}`;
    if (rows.some((r) => r.key === key)) return;
    const unresolved = productId === UNRESOLVED_PRODUCT;
    const isInput = productId === INPUT_SUPPLIER;
    rows.push({
      key,
      supplierId,
      supplierName: supplier?.name ?? (isSelfSupplier(supplierId) ? "Your own installation" : supplierId),
      supplierCountry: supplier?.country ?? "TH",
      selfSupplied: Boolean(supplier?.selfSupplied) || isSelfSupplier(supplierId),
      productId,
      // Never render a sentinel. The row says what it is instead.
      productName: unresolved || isInput ? supplier?.material?.trim() || "Product not identified" : product?.name ?? productId,
      cnCode: product?.cnCode ?? "",
      unresolved,
      inputKind,
      year,
      workspace: unresolved || isInput ? null : findWorkspace(supplierId, productId, year),
    });
  };

  if (declaration.requests && declaration.requests.length > 0) {
    for (const req of declaration.requests) {
      for (const p of req.products) push(req.supplierId, p.productId);
    }
    return rows;
  }

  /* Fallback for declarations written before the wizard recorded an explicit
     supplier × product grid. Each supplier row carries a `material` in the
     words a salesperson uses — "Hot-rolled coil", "Steel billet", "Rebar" —
     so resolve that against the catalogue and give the supplier one report for
     it. A material that resolves to nothing still produces a row, because a
     supplier who is on the declaration and has no report is invisible, and
     invisible is worse than imprecise. */
  for (const s of declaration.suppliers) {
    // Scrap and utilities are inputs, not goods — classified BEFORE the
    // catalogue lookup, because "Steel scrap" would otherwise match "Steel
    // wire" on a loose contains and invent a report nobody owes.
    const inputKind = classifyInput(s.material);
    if (inputKind) {
      push(s.id, INPUT_SUPPLIER, inputKind);
      continue;
    }
    const productId = resolveMaterial(s.material);
    push(s.id, productId ?? UNRESOLVED_PRODUCT);
  }

  return rows;
}

/** Sentinel for a supplier whose material we could not map to a CN code. The
    row renders, and it renders as needing a product chosen — which is the
    honest state, and the one thing that gets it fixed. */
export const UNRESOLVED_PRODUCT = "__unresolved__";

/** Sentinel for a supplier who is legitimately NOT making a CBAM good. */
export const INPUT_SUPPLIER = "__input__";

/* ── Not every supplier gets a report ───────────────────────────
   A scrap merchant and the electricity utility are both on the declaration and
   neither of them has an annual report, because neither supplies a CBAM good:

     · Scrap is zero-rated. It has no embedded emissions to collect, and the
       fact that it is scrap is recorded on the precursor row, not in a
       twelve-month return nobody owes.
     · Grid electricity is an input to the installation, not a good it makes.
       It is monitored inside each month's electricity figure, and its supplier
       is named in the MMD.

   Getting this wrong is not cosmetic. Asking a scrap merchant for twelve
   months of production data is a request they cannot fulfil, and a dashboard
   that counts it as outstanding shows a year as 6-of-8 complete forever. So
   these resolve to an INPUT row that says where the data actually lives. */
const SCRAP_PATTERN = /\b(scrap|waste|swarf|turnings|offcut|เศษ)\b/i;
const UTILITY_PATTERN = /\b(electricity|power|grid|energy|utility|steam|กระแสไฟฟ้า)\b/i;

export type InputKind = "scrap" | "utility";

export function classifyInput(material: string | undefined): InputKind | null {
  const m = (material ?? "").trim();
  if (!m) return null;
  if (SCRAP_PATTERN.test(m)) return "scrap";
  if (UTILITY_PATTERN.test(m)) return "utility";
  return null;
}

export const INPUT_EXPLANATION: Record<InputKind, string> = {
  scrap:
    "Scrap is zero-rated — there are no embedded emissions to collect. Record it as a scrap input on the Precursors tab of the report it feeds.",
  utility:
    "Electricity is an input, not a CBAM good. It is captured in each month's electricity figure, and the supply is named in the MMD.",
};

/** Best-effort catalogue lookup from a free-text material name. Exact name
    first, then keyword, then a loose contains — in that order, so "Steel
    billet" lands on Billets rather than on the first row that happens to
    contain "steel". */
export function resolveMaterial(material: string | undefined): string | null {
  const q = (material ?? "").trim().toLowerCase();
  if (!q) return null;

  const all = listCatalog();
  const exact = all.find((p) => p.name.toLowerCase() === q);
  if (exact) return exact.id;

  const byKeyword = all.find((p) => p.keywords.some((k) => q.includes(k) && k.length > 3));
  if (byKeyword) return byKeyword.id;

  const loose = all.find((p) => p.name.toLowerCase().includes(q) || q.includes(p.name.toLowerCase()));
  return loose?.id ?? null;
}

/** Find or create the workspace behind a report row, and link the declaration
    to it so the trail runs both ways. Idempotent. */
export function openReport(declaration: Declaration, report: AnnualReport): VerificationWorkspace {
  const existing = report.workspace ?? findWorkspace(report.supplierId, report.productId, report.year);
  if (existing) {
    linkDeclaration(existing.id, declaration.id);
    return existing;
  }

  const product = getCatalogProduct(report.productId);
  // The route is genuinely unknown until the supplier says — but a workspace
  // needs one, and leaving it blank makes the Precursors tab unable to say
  // which tiers should exist. The first route valid for the product's sector
  // is a starting point the Overview tab can correct in place, which is a
  // better failure than a workspace that cannot be created at all.
  const fallbackRoute = product ? routesForCategory(aggregatedGoodsCategory(product))[0]?.id ?? "" : "";

  const ws = createWorkspace({
    installationId: installationIdFor(report.supplierId),
    installationName: report.supplierName,
    productId: report.productId,
    productionRoute: fallbackRoute,
    year: report.year,
  });
  linkDeclaration(ws.id, declaration.id);
  return ws;
}

/* ── Status for a row ───────────────────────────────────────────
   Read-only: never creates a workspace. A report with no workspace yet reads
   as "not started", which is true, rather than as an error. */
export function reportStatus(report: AnnualReport): AnnualReportStatus {
  /* An input supplier is `not_applicable`, not incomplete. This is the same
     distinction the Precursors tab makes for a simple good, and for the same
     reason: a thing that was never required must not read as a thing that is
     missing, or the dashboard can never reach 100%. */
  if (report.inputKind) {
    return {
      report,
      overall: "not_applicable",
      dots: ["not_applicable", "not_applicable", "not_applicable", "not_applicable", "not_applicable"],
      monthsSubmitted: 12,
      precursorCount: 0,
      shipmentCount: 0,
      subtitle: INPUT_EXPLANATION[report.inputKind],
    };
  }

  if (report.unresolved) {
    return {
      report,
      overall: "blocked",
      dots: ["blocked", "blocked", "blocked", "blocked", "blocked"],
      monthsSubmitted: 0,
      precursorCount: 0,
      shipmentCount: 0,
      subtitle: "No CN code — pick the good this supplier makes before anything can be collected.",
    };
  }

  if (!report.workspace) {
    return {
      report,
      overall: "incomplete",
      dots: ["incomplete", "incomplete", "incomplete", "incomplete", "incomplete"],
      monthsSubmitted: 0,
      precursorCount: 0,
      shipmentCount: 0,
      subtitle: "Not started — open it to create the year and send the first request.",
    };
  }

  const w = report.workspace;
  const readiness = workspaceReadiness(w);
  const production = annualProductionFor(w);
  const precursorCount = listSuppliers(w.id).length;
  const shipmentCount = shipmentsForWorkspace(w.id).length;

  return {
    report,
    overall: readiness.overall,
    dots: dotStates(readiness),
    monthsSubmitted: production.monthsCounted,
    precursorCount,
    shipmentCount,
    subtitle: `${production.monthsCounted} of 12 months · ${precursorCount} precursor${precursorCount === 1 ? "" : "s"} · ${shipmentCount} shipment${shipmentCount === 1 ? "" : "s"}`,
  };
}

/* ── Roll-up for the declaration header ─────────────────────────
   The one number the exporter wants on arrival: how many of my reports are
   actually done. Deliberately counts a missing workspace as not-complete
   rather than skipping it, for the same reason the Overview tab lists unbuilt
   tabs as missing — a declaration that renders "0 outstanding" because nothing
   has been started would be the most misleading screen in the product. */
export type DeclarationRollup = {
  total: number;
  complete: number;
  blocked: number;
  notStarted: number;
  /** months owed across every report — what a chase is actually asking for */
  monthsOutstanding: number;
  percentComplete: number;
};

export function rollup(statuses: AnnualReportStatus[]): DeclarationRollup {
  // Input suppliers are excluded from every count. Including them would make
  // the denominator wrong in the one direction that matters — a declaration
  // permanently short of 100% because a scrap merchant never filed a year of
  // production data they were never asked for.
  const reports = statuses.filter((s) => !s.report.inputKind);
  const total = reports.length;
  const complete = reports.filter((s) => s.overall === "complete").length;
  const blocked = reports.filter((s) => s.overall === "blocked").length;
  const notStarted = reports.filter((s) => !s.report.workspace && !s.report.unresolved).length;
  const monthsOutstanding = reports.reduce((a, s) => a + Math.max(0, 12 - s.monthsSubmitted), 0);
  return {
    total,
    complete,
    blocked,
    notStarted,
    monthsOutstanding,
    percentComplete: total === 0 ? 0 : Math.round((complete / total) * 100),
  };
}

/** Group the rows by supplier, which is how a chase is addressed: one email to
    one supplier covers every product they make for you. */
export type SupplierGroup = {
  supplierId: string;
  supplierName: string;
  supplierCountry: string;
  selfSupplied: boolean;
  statuses: AnnualReportStatus[];
};

export function groupBySupplier(statuses: AnnualReportStatus[]): SupplierGroup[] {
  const map = new Map<string, SupplierGroup>();
  for (const s of statuses) {
    const g = map.get(s.report.supplierId) ?? {
      supplierId: s.report.supplierId,
      supplierName: s.report.supplierName,
      supplierCountry: s.report.supplierCountry,
      selfSupplied: s.report.selfSupplied,
      statuses: [],
    };
    g.statuses.push(s);
    map.set(s.report.supplierId, g);
  }
  return [...map.values()].sort((a, b) => {
    // Own installation first: it is the one nobody has to be chased for, and
    // seeing it at the top makes the rest read as "the external dependencies".
    if (a.selfSupplied !== b.selfSupplied) return a.selfSupplied ? -1 : 1;
    return a.supplierName.localeCompare(b.supplierName);
  });
}

export { SELF_SUPPLIER_ID };
