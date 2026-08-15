/* ════════════════════════════════════════════════════════════
   CBAM MACHINE-READABLE EXPORTS — Excel / XML / JSON

   Three client-side downloads that hand off the SAME resolved dataset the
   PDF package renders (PackageInput, lib/download.ts) — no page or format
   re-derives its own numbers. Every emission/quantity value is a decimal
   STRING throughout; nothing is ever parseFloat-ed into float math.

     buildDeclarationHandoff()   canonical, stable-key-order object
     serializeHandoffJson()      that object → pretty JSON
     serializeHandoffXml()       that object → <CBAMDeclaration> XML
     buildDeclarationWorkbook()  Excel modelled on the EU official
                                 "CBAM Communication Template for
                                 Installations" (steel & aluminium scope)

   Like the PDF, none of these establish legal validity, verification,
   custody, immutable retention or delivery. They are a browser-local draft
   handoff only.
   ════════════════════════════════════════════════════════════ */

import type { PackageInput, SupplierChapter, ChapterProduct } from "./download";

/* ── Canonical handoff object ──────────────────────────────────
   Stable key order (installation → goods → emissions → precursors →
   carbon price → verification), decimal strings preserved verbatim. The
   XML and JSON serializers both walk THIS object, so the two formats stay
   byte-for-byte consistent in content. */

export type DeclarationHandoff = ReturnType<typeof buildDeclarationHandoff>;

export function buildDeclarationHandoff(p: PackageInput) {
  const chapters = p.chapters ?? [];
  return {
    meta: {
      reference: p.ref,
      regulation: p.regulationFull,
      period: p.period,
      sector: p.sector,
      origin: p.origin,
      market: p.market,
      generatedAt: new Date().toISOString(),
      contentHash: p.contentHash ?? null,
      disclaimer:
        "Browser-local draft handoff. Not verified, immutable, audit-ready or filed. The EU authorised declarant remains responsible for the annual declaration.",
    },
    operator: {
      name: p.org,
      installationId: p.installationId,
      buyer: p.buyerLine ?? null,
    },
    totals: {
      totalEmbeddedTCO2e: p.totalEmbedded, // decimal string
      supplierSubmissions: p.supplierCount,
      carbonPricePaid: p.carbonPricePaid, // decimal string
      factorSet: p.factorSet,
    },
    costOutcome: costOutcomeHandoff(p.costOutcome),
    suppliers: chapters.map(supplierHandoff),
  };
}

/* The money block is self-describing on purpose: a consumer must be able to
   tell "no liability" from "the price for this period is not published yet"
   without reading our source. `available: false` means every amount is null. */
function costOutcomeHandoff(cost: PackageInput["costOutcome"]) {
  if (!cost) return null;
  return {
    available: cost.available,
    unavailableReason: cost.unavailableReason,
    pricedAsOf: cost.asOf,
    reportingYear: cost.year,
    chargeableTCO2e: cost.chargeableTCO2e, // decimal string
    certificatePriceEURPerTCO2e: cost.certificatePriceEURPerTCO2e, // decimal string | null
    grossCostEUR: cost.grossCostEUR, // decimal string | null
    carbonPricePaidEUR: cost.carbonPricePaidEUR, // decimal string
    netExposureEUR: cost.netExposureEUR, // decimal string | null
    netExposureTHB: cost.netExposureTHB, // decimal string | null
    fxThbPerEur: cost.fx.thbPerEur,
    fxAsOf: cost.fx.asOf,
    fxSource: cost.fx.source,
    fxStale: cost.fx.stale,
    basis:
      "Annex-II direct embedded emissions priced at the officially published CBAM certificate price, net of declared carbon price paid, floored at zero per supplier. Estimate only; no proxy price is substituted for an unpublished period.",
  };
}

function supplierHandoff(c: SupplierChapter) {
  return {
    name: c.name,
    reference: c.ref,
    country: c.country,
    version: c.version,
    submittedAt: c.submittedAt,
    installation: {
      name: c.installation.name,
      address: c.installation.address,
      country: c.installation.country,
      unlocode: c.installation.unlocode ?? null,
      coordinates: c.installation.coordinates ?? null,
    },
    goods: c.products.map(goodHandoff),
    carbonPrice: {
      amount: c.carbonPrice.amount, // decimal string (with unit suffix, as authored)
      instrument: c.carbonPrice.instrument ?? null,
    },
    verification: c.verification || null,
  };
}

function goodHandoff(prod: ChapterProduct) {
  return {
    name: prod.name,
    cnCode: prod.cnCode,
    hsCode: prod.hsCode ?? null,
    category: prod.category,
    group: prod.group,
    productionRoute: prod.route ?? null,
    quantityTonnes: prod.quantityTonnes, // decimal string
    emissions: {
      directPerTonne: prod.directPerTonne, // decimal string | null
      indirectPerTonne: prod.indirectPerTonne, // decimal string | null
      totalPerTonne: prod.totalPerTonne, // decimal string | null
      absoluteTCO2e: prod.absoluteTCO2e, // decimal string | null
      method: prod.method ?? null,
    },
    energy: {
      electricityConsumedMWhPerT: prod.electricityConsumed ?? null,
      electricityFactor: prod.electricityFactor ?? null,
      electrolysisTechnology: prod.electrolysisTech ?? null,
    },
    // Precursors arrive already formatted as readable lines from
    // package-data.ts (formatPrecursors). Passed through verbatim so the
    // handoff mirrors what the PDF shows.
    precursors: prod.precursors ?? null,
  };
}

/* ── JSON ──────────────────────────────────────────────────── */

export function serializeHandoffJson(handoff: DeclarationHandoff): string {
  // buildDeclarationHandoff already fixes key order; JSON.stringify preserves
  // insertion order for string keys, so this is deterministic.
  return JSON.stringify(handoff, null, 2);
}

/* ── XML ───────────────────────────────────────────────────────
   Small escape-safe serializer — no XML library. Walks the same handoff
   object as JSON so both formats carry identical content and decimal
   strings. Arrays become repeated <Supplier>/<Good> elements. */

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Turn a plain object/array/scalar into indented XML. `singular` names the
    element used for array items (e.g. list "suppliers" → item "Supplier"). */
function toXml(node: unknown, tag: string, indent: string, singular?: string): string {
  const pad = indent;
  if (node === null || node === undefined) {
    return `${pad}<${tag} />`;
  }
  if (Array.isArray(node)) {
    const itemTag = singular ?? tag;
    if (node.length === 0) return `${pad}<${tag} />`;
    const items = node.map((item) => toXml(item, itemTag, indent + "  ")).join("\n");
    return `${pad}<${tag}>\n${items}\n${pad}</${tag}>`;
  }
  if (typeof node === "object") {
    const entries = Object.entries(node as Record<string, unknown>).map(([key, value]) =>
      toXml(value, capitalize(key), indent + "  ", ARRAY_ITEM_TAGS[key]),
    );
    return `${pad}<${tag}>\n${entries.join("\n")}\n${pad}</${tag}>`;
  }
  return `${pad}<${tag}>${xmlEscape(String(node))}</${tag}>`;
}

// Repeated-element naming for the two list fields in the handoff.
const ARRAY_ITEM_TAGS: Record<string, string> = {
  suppliers: "Supplier",
  goods: "Good",
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function serializeHandoffXml(handoff: DeclarationHandoff): string {
  // TODO: confirm target schema (CBAM Transitional Registry / O3CI import format
  // is unconfirmed) — this is a self-describing <CBAMDeclaration> tree, not an
  // official importer-system XSD.
  const body = toXml(handoff, "CBAMDeclaration", "");
  return `<?xml version="1.0" encoding="UTF-8"?>\n${body}\n`;
}

/* ── Excel ─────────────────────────────────────────────────────
   Modelled on the EU official "CBAM communication template for
   installations" (steel & aluminium scope). Verified sheet identifiers from
   the published template:

     A_InstData          installation data & boundaries
     C_Emissions&Energy  emissions and energy data
     D_Processes         production-route / goods summary
     E_PurchPrec         purchased precursors

   The template's exact per-cell layout (merged headers, hidden helper rows,
   CodeLists) is NOT reproduced — those cell positions could not be verified
   from public sources, so this is a best-effort, human-readable export that
   uses the official sheet names and CBAM field grammar. Do not treat cell
   coordinates here as officially conformant.

   TODO: verify exact cell mapping against the official EU template
   (CBAM communication template for installations, published by
   taxation-customs.ec.europa.eu — layout version unconfirmed). */

// exceljs' Workbook type; imported dynamically to keep it out of the SSR path,
// matching how download.ts lazy-loads jsPDF.
type Workbook = import("exceljs").Workbook;

export async function buildDeclarationWorkbook(p: PackageInput): Promise<Workbook> {
  const ExcelJS = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "Certrace";
  wb.created = new Date();

  const chapters = p.chapters ?? [];

  /* ── Summary Communication ── */
  const summary = wb.addWorksheet("Summary Communication");
  summary.columns = [{ width: 42 }, { width: 48 }];
  const kv = (label: string, value: string | number) => summary.addRow([label, value]);
  kv("Declaration reference", p.ref);
  kv("Regulation", p.regulationFull);
  kv("Reporting period", p.period);
  kv("Goods sector", p.sector);
  kv("Route", `${p.origin} → ${p.market}`);
  kv("Communicating operator", p.org);
  kv("Operator reference", p.installationId);
  if (p.buyerLine) kv("EU buyer / declarant", p.buyerLine);
  kv("Total embedded emissions (tCO2e)", p.totalEmbedded); // decimal string, kept as text
  kv("Carbon price paid (origin)", p.carbonPricePaid);
  kv("Emission factor set", p.factorSet);
  kv("Supplier submissions", p.supplierCount);
  if (p.costOutcome) {
    const c = p.costOutcome;
    kv("Chargeable embedded emissions (tCO2e)", c.chargeableTCO2e);
    kv("Certificate price applied (EUR/tCO2e)", c.certificatePriceEURPerTCO2e ?? "Not published");
    kv("Certificate price as of", c.asOf);
    kv("Gross certificate cost (EUR)", c.grossCostEUR ?? "Unavailable");
    kv("Carbon price already paid (EUR)", c.carbonPricePaidEUR);
    kv("Estimated net certificate cost (EUR)", c.netExposureEUR ?? "Unavailable");
    kv("Estimated net certificate cost (THB)", c.netExposureTHB ?? "Unavailable");
    kv("THB/EUR reference rate", `${c.fx.thbPerEur} as of ${c.fx.asOf} (${c.fx.stale ? "fallback" : c.fx.source})`);
    if (!c.available) {
      kv("Cost outcome unavailable because", c.unavailableReason ?? `No published price covers ${c.asOf}.`);
    }
  }
  kv("Generated (UTC)", new Date().toUTCString());
  if (p.contentHash) kv("Local dataset sha-256", p.contentHash);
  summary.getColumn(1).font = { bold: true };
  summary.addRow([]);
  summary.addRow([
    "DRAFT PREVIEW ONLY — not verified, immutable, audit-ready or filed. The EU authorised declarant remains responsible for the annual declaration.",
  ]);

  /* ── A_InstData — installation data & boundaries ── */
  // TODO: verify against official EU template A_InstData layout.
  const inst = wb.addWorksheet("A_InstData");
  inst.addRow([
    "Supplier",
    "Installation name",
    "Address",
    "Country",
    "UN/LOCODE",
    "Coordinates (main source)",
    "Supplier ref",
  ]);
  for (const c of chapters) {
    inst.addRow([
      c.name,
      c.installation.name || "",
      c.installation.address || "",
      c.installation.country || "",
      c.installation.unlocode || "",
      c.installation.coordinates || "",
      c.ref,
    ]);
  }

  /* ── D_Processes — production routes / summary of goods ── */
  // TODO: verify against official EU template D_Processes layout.
  const goods = wb.addWorksheet("D_Processes");
  goods.addRow([
    "Supplier",
    "Good",
    "CN code",
    "Aggregated goods category",
    "Production route",
    "Quantity (t net mass)",
    "SEE direct (tCO2e/t)",
    "SEE indirect (tCO2e/t)",
    "SEE total (tCO2e/t)",
    "Absolute (tCO2e)",
    "Method",
  ]);
  for (const c of chapters) {
    for (const prod of c.products) {
      // Emission/quantity values written as strings — Excel stores them as
      // text so the exact decimal is never coerced to a float.
      goods.addRow([
        c.name,
        prod.name,
        prod.cnCode,
        `${prod.category} — ${prod.group}`,
        prod.route || "",
        prod.quantityTonnes,
        prod.directPerTonne ?? "",
        prod.indirectPerTonne ?? "",
        prod.totalPerTonne ?? "",
        prod.absoluteTCO2e ?? "",
        prod.method ?? "",
      ]);
    }
  }
  goods.getRow(1).font = { bold: true };

  /* ── C_Emissions&Energy — electricity / energy per good ── */
  // TODO: verify against official EU template C_Emissions&Energy layout.
  const energy = wb.addWorksheet("C_Emissions&Energy");
  energy.addRow([
    "Supplier",
    "Good",
    "CN code",
    "Electricity consumed (MWh/t)",
    "Electricity factor & source",
    "Electrolysis technology",
    "SEE indirect (tCO2e/t)",
  ]);
  for (const c of chapters) {
    for (const prod of c.products) {
      energy.addRow([
        c.name,
        prod.name,
        prod.cnCode,
        prod.electricityConsumed ?? "",
        prod.electricityFactor ?? "",
        prod.electrolysisTech ?? "",
        prod.indirectPerTonne ?? "",
      ]);
    }
  }
  energy.getRow(1).font = { bold: true };

  /* ── E_PurchPrec — purchased precursors ── */
  // TODO: verify against official EU template E_PurchPrec layout. The formatted
  // precursor lines carry qty × embedded emissions per row already (from
  // package-data.ts / formatPrecursors); one spreadsheet row per precursor line.
  const prec = wb.addWorksheet("E_PurchPrec");
  prec.addRow(["Supplier", "Good", "CN code", "Purchased precursor (qty × SEE)"]);
  for (const c of chapters) {
    for (const prod of c.products) {
      if (!prod.precursors) continue;
      for (const line of prod.precursors.split("\n")) {
        if (line.trim()) prec.addRow([c.name, prod.name, prod.cnCode, line.trim()]);
      }
    }
  }
  prec.getRow(1).font = { bold: true };

  /* ── Carbon Price Due ── */
  const carbon = wb.addWorksheet("Carbon Price");
  carbon.addRow(["Supplier", "Amount", "Instrument"]);
  for (const c of chapters) {
    carbon.addRow([c.name, c.carbonPrice.amount, c.carbonPrice.instrument ?? ""]);
  }
  carbon.getRow(1).font = { bold: true };

  return wb;
}

/* ── Download orchestration (mirrors download.ts) ──────────────
   Reuse downloadFile + datasetHash from download.ts; no duplicate helpers. */

import { downloadFile, datasetHash } from "./download";

const slugify = (p: PackageInput) =>
  `${p.regulationShort}-${p.period}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function downloadDeclarationJson(p: PackageInput) {
  if (typeof window === "undefined") return;
  const contentHash = p.contentHash ?? (await datasetHash(p));
  const handoff = buildDeclarationHandoff({ ...p, contentHash });
  downloadFile(`certrace-${slugify(p)}-declaration.json`, serializeHandoffJson(handoff), "application/json");
}

export async function downloadDeclarationXml(p: PackageInput) {
  if (typeof window === "undefined") return;
  const contentHash = p.contentHash ?? (await datasetHash(p));
  const handoff = buildDeclarationHandoff({ ...p, contentHash });
  downloadFile(`certrace-${slugify(p)}-declaration.xml`, serializeHandoffXml(handoff), "application/xml");
}

export async function downloadDeclarationExcel(p: PackageInput) {
  if (typeof window === "undefined") return;
  const contentHash = p.contentHash ?? (await datasetHash(p));
  const wb = await buildDeclarationWorkbook({ ...p, contentHash });
  const buffer = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `certrace-${slugify(p)}-cbam-template.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
