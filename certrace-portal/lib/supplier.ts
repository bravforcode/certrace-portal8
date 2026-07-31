/* ════════════════════════════════════════════════════════════
   SUPPLIER PORTAL — request resolution (the smartlink seam)

   When an exporter finishes the browser-only wizard, every mapped supplier
   gets a same-browser demo route: /s/<token>. The token encodes the
   declaration + the supplier, and resolving it here reconstructs *that
   supplier's slice* of the request — the products & lots assigned to them, the
   exact CBAM data fields that apply to those goods (via resolveCbamFields), the
   documents the exporter asked for, the deadline and the note.

   Frontend-only MVP: the request is derived from the same DECLARATIONS fixtures
   + config the exporter side uses, so nothing is invented. This file is the
   read-only "what was asked" half; lib/supplier-store.ts holds the supplier's
   answers. Both are the seam where a real API would slot in.
   ════════════════════════════════════════════════════════════ */

import { getDeclaration, type Declaration, type SupplierRow, type RequestLotSpec } from "./data";
import { getOrgIdentity } from "./org";
import {
  getRegulation,
  getJurisdiction,
  getDestination,
  resolveCbamFields,
  fieldAppliesTo,
  fieldRequiredFor,
  getCatalogProduct,
  sectorLabelFor,
  METHOD_CONDITIONAL_FIELD_IDS,
  type ProductUnit,
  type ResolvedCbamField,
  type CatalogProduct,
} from "./config";
import type { MeasuredValue } from "./mrv";
import { goodsMass, sumCanonicalTonnes } from "./workflow-measurements";
import { parsePrecursors } from "./precursors";

/* ── Token ─────────────────────────────────────────────────────
   Opaque-ish but deterministic: base64url("declId|supplierId"). Isomorphic so
   the route (server) and the provider (client) decode the same way.

   ⚠️ SECURITY — MVP ONLY. This encoding is NOT authentication: anyone who can
   guess a declaration + supplier id can mint a link. Acceptable in this
   frontend-only demo (all data is mock, nothing is server-persisted), but
   production Smart Links MUST be server-issued signed tokens (HMAC or JWT)
   with expiry + revocation, resolved against server-side access control.
   See docs/SECURITY.md. */
function b64urlEncode(s: string): string {
  if (typeof btoa !== "undefined") return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return Buffer.from(s, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string): string {
  const p = s.replace(/-/g, "+").replace(/_/g, "/");
  try {
    if (typeof atob !== "undefined") return atob(p);
    return Buffer.from(p, "base64").toString("utf8");
  } catch {
    return "";
  }
}

export function makeToken(declId: string, supplierId: string): string {
  return b64urlEncode(`${declId}|${supplierId}`);
}
export function decodeToken(token: string): { declId: string; supplierId: string } | null {
  const raw = b64urlDecode(token);
  const i = raw.indexOf("|");
  if (i < 0) return null;
  const declId = raw.slice(0, i);
  const supplierId = raw.slice(i + 1);
  if (!declId || !supplierId) return null;
  return { declId, supplierId };
}

/* ── Material → real CBAM catalogue product ────────────────────
   The demo suppliers carry a free-text `material`; map it to a real catalogue
   product so the resolved CBAM checklist + classification are authentic. */
const MATERIAL_TO_PRODUCT: Record<string, string> = {
  "Hot-rolled coil": "hrc",
  "Steel billet": "billet",
  Rebar: "rebar",
  "Zinc coating": "galv",
  "Galvanised sheet": "galv",
  "Pig iron": "pigiron",
};
export const productForMaterial = (material: string): CatalogProduct | null => {
  const id = MATERIAL_TO_PRODUCT[material];
  return id ? getCatalogProduct(id) ?? null : null;
};

/* Deterministic mock lots from the supplier ref so the same link always shows
   the same quantities. Quantity is real-looking; emissions stay for the supplier
   to report. */
export type RequestLot = {
  id: string;
  qty: string;
  unit: ProductUnit;
  measurement: MeasuredValue;
  from: string;
  to: string;
};
function lotsForSupplier(row: SupplierRow): RequestLot[] {
  const seed = parseInt(row.ref.replace(/\D/g, "") || "100", 10);
  const base = 200 + (seed % 9) * 140;
  const lots: RequestLot[] = [
    { id: `${row.id}-l1`, qty: String(base), unit: "TNE", measurement: goodsMass(String(base), "TNE"), from: "2026-04-01", to: "2026-05-31" },
  ];
  if (seed % 2 === 0) {
    const quantity = String(Math.round(base * 0.6));
    lots.push({ id: `${row.id}-l2`, qty: quantity, unit: "TNE", measurement: goodsMass(quantity, "TNE"), from: "2026-06-01", to: "2026-06-30" });
  }
  return lots;
}

export type RequestProduct = {
  product: CatalogProduct;
  lots: RequestLot[];
  /** Commercial quantity shipped/purchased for this request. */
  commercialQuantityTonnes: string;
};

export type RequestDocAsk = { id: string; label: string; required: boolean };

export type SupplierRequest = {
  token: string;
  declId: string;
  supplierId: string;
  // who's being asked
  supplierName: string;
  supplierRef: string;
  supplierCountry: string;
  critical: boolean;
  // who's asking
  exporterName: string;
  exporterContact: string;
  // scope
  regulationId: string;
  regulationShort: string;
  regulationFull: string;
  authority: string;
  originName: string;
  originFactorSet: string;
  destinationName: string;
  period: string;
  deadline: string;
  dueInDays: number;
  noteToSuppliers: string;
  classificationIssue?: string;
  /** sector wording derived from THIS supplier's goods ("steel", "aluminium") */
  sectorWord: string;
  // what to fill
  products: RequestProduct[];
  fields: ResolvedCbamField[];
  documents: RequestDocAsk[];
};

/* The documents an EU buyer/importer typically asks for alongside the CBAM
   carbon data — chosen per goods category, so an aluminium supplier is never
   asked for a steel mill certificate. */
function requestedDocsFor(products: CatalogProduct[]): RequestDocAsk[] {
  const hasAluminium = products.some((p) => p.category === "Aluminium");
  const hasSteel = products.some((p) => p.category === "Iron & Steel");
  const materialCert: RequestDocAsk =
    hasAluminium && !hasSteel
      ? { id: "mtc", label: "Works / alloy test certificate (EN 10204 3.1)", required: true }
      : { id: "mtc", label: "Mill Test Certificate (MTC) — EN 10204 3.1, or commercial invoice", required: true };
  const docs: RequestDocAsk[] = [
    { id: "cbam-sheet", label: "CBAM communication / embedded-emissions sheet", required: true },
    materialCert,
    { id: "coo", label: "Certificate of Origin (COO)", required: true },
    { id: "verif", label: "Verification statement (accredited verifier)", required: false },
  ];
  if (products.some((p) => p.category === "Iron & Steel" && p.group === "Semi-finished")) {
    docs.push(
      { id: "electricity-evidence", label: "Electricity bill or Solar Rooftop PPA (indirect-emissions evidence)", required: false },
      { id: "carbon-fee-proof", label: "Thai carbon fee / tax payment proof (carbon price paid)", required: false },
    );
  }
  return docs;
}

const DEFAULT_NOTE =
  "Please report at installation level using actual data where you have it. If you only have default factors, mark the method as “default”. Reach out if anything is unclear — we'd rather help than receive a guess.";

/* Exact canonical TNE sum. Every lot already carries its entered value/unit,
   conversion rule, precision and regulatory-data version. */
const netMassTonnes = (lots: readonly { measurement: MeasuredValue }[]): string =>
  sumCanonicalTonnes(lots.map((lot) => lot.measurement));

/* Wizard-created declarations carry the exact ask (decl.requests); build the
   supplier's slice from it — every product they were mapped to, with the real
   lots the exporter entered. */
function productsFromSpec(
  decl: Declaration,
  row: SupplierRow,
): { products: RequestProduct[]; classificationIssue?: string } | null {
  const spec = decl.requests?.find((r) => r.supplierId === row.id);
  if (!spec || spec.products.length === 0) return null;
  const out: RequestProduct[] = [];
  const issues: string[] = [];
  for (const ps of spec.products) {
    const product = getCatalogProduct(ps.productId);
    if (!product) {
      issues.push(`Product ${ps.productId} is not present in the effective regulatory catalogue.`);
      continue;
    }
    const lots: RequestLot[] = [];
    for (const [index, lot] of ps.lots.entries()) {
      try {
        const expected = goodsMass(lot.qty, lot.unit);
        const persisted = (lot as RequestLotSpec).measurement;
        if (
          !persisted ||
          persisted.enteredValue !== expected.enteredValue ||
          persisted.enteredUnit !== expected.enteredUnit ||
          persisted.canonicalValue !== expected.canonicalValue ||
          persisted.canonicalUnit !== "TNE" ||
          persisted.regulatoryDataVersion !== expected.regulatoryDataVersion
        ) {
          issues.push(`${product.name} lot ${index + 1} has missing or inconsistent measurement metadata.`);
          continue;
        }
        lots.push({
          id: `${row.id}-${ps.productId}-l${index + 1}`,
          qty: lot.qty,
          unit: lot.unit,
          measurement: persisted,
          from: lot.from,
          to: lot.to,
        });
      } catch {
        issues.push(`${product.name} lot ${index + 1} has an invalid decimal quantity or unit.`);
      }
    }
    if (lots.length === 0) continue;
    const commercialQuantityTonnes = netMassTonnes(lots);
    out.push({ product, lots, commercialQuantityTonnes });
  }
  return {
    products: out,
    classificationIssue: issues.length > 0 ? issues.join(" ") : undefined,
  };
}

export function resolveRequest(token: string): SupplierRequest | null {
  const decoded = decodeToken(token);
  if (!decoded) return null;
  const decl = getDeclaration(decoded.declId);
  if (!decl) return null;
  const row = decl.suppliers.find((s) => s.id === decoded.supplierId);
  if (!row) return null;

  const reg = getRegulation(decl.regulation) ?? getRegulation("cbam")!;
  const origin = getJurisdiction(decl.origin);
  const dest = getDestination(decl.market);

  // Real spec when the wizard recorded one; material-based synthesis for fixtures.
  const requestSpec = decl.requests?.find((request) => request.supplierId === row.id);
  const specifiedProducts = productsFromSpec(decl, row);
  let products = specifiedProducts?.products ?? null;
  let classificationIssue = specifiedProducts?.classificationIssue;
  if (!specifiedProducts && requestSpec) {
    products = [];
    classificationIssue = "The requested product specification is empty or invalid. No fallback classification was applied.";
  } else if (!specifiedProducts) {
    const product = productForMaterial(row.material);
    if (!product) {
      products = [];
      classificationIssue = `No approved regulatory product mapping exists for “${row.material}”. Classification is required before data collection can continue.`;
    } else {
      const lots = lotsForSupplier(row);
      const commercialQuantityTonnes = netMassTonnes(lots);
      products = [{ product, lots, commercialQuantityTonnes }];
    }
  }
  if (products === null) {
    products = [];
    classificationIssue = "The product scope could not be resolved. No fallback classification was applied.";
  }

  // Scope the checklist to THIS supplier's goods, then honor the exporter's
  // Classification choices: a CBAM run always keeps the legally-required set;
  // a Buyer Request asks exactly the fields the exporter selected.
  const resolved = resolveCbamFields(products.map((p) => p.product));
  const included = decl.includedFieldIds;
  const fields = included
    ? resolved.filter((f) => (decl.kind === "buyer" ? included.includes(f.id) || METHOD_CONDITIONAL_FIELD_IDS.has(f.id) : f.required || included.includes(f.id) || METHOD_CONDITIONAL_FIELD_IDS.has(f.id)))
    : resolved;

  const org = getOrgIdentity();
  const sectorLabel = sectorLabelFor(products.map((p) => p.product));

  return {
    token,
    declId: decl.id,
    supplierId: row.id,
    supplierName: row.name,
    supplierRef: row.ref,
    supplierCountry: row.country,
    critical: row.critical,
    exporterName: org.name,
    exporterContact: org.contact,
    regulationId: reg.id,
    regulationShort: reg.short,
    regulationFull: reg.full,
    authority: reg.authority,
    originName: origin?.name ?? decl.origin,
    originFactorSet: origin?.factorSet ?? "—",
    destinationName: dest?.name ?? decl.market,
    period: decl.period,
    deadline: decl.due,
    dueInDays: decl.dueInDays,
    // the exporter's actual instruction reaches the supplier; canned copy is
    // only the fallback for fixtures that never had one
    noteToSuppliers: decl.notesToSuppliers?.trim() || DEFAULT_NOTE,
    classificationIssue,
    sectorWord: sectorLabel === "Aluminium" ? "aluminium" : sectorLabel === "Iron & Steel" ? "steel" : "steel & aluminium",
    products,
    fields,
    documents: requestedDocsFor(products.map((p) => p.product)),
  };
}

/* ── Sections — how the questionnaire splits across departments ──
   Each CBAM field group becomes an assignable section with a default department
   so the supplier can hand pieces to the right colleague (seats). Scope says
   whether it's filled once for the installation, once per product, or is the
   document upload area. */
export type SectionKey =
  | "installation"
  | "goods"
  | "emissions"
  | "electricity"
  | "precursors"
  | "carbon"
  | "verification"
  | "documents";

export type SupplierSection = {
  key: SectionKey;
  label: string;
  department: string;
  groups: string[]; // CBAM field groups this section covers
  scope: "once" | "product" | "docs";
  blurb: string;
};

export const SECTIONS: SupplierSection[] = [
  { key: "installation", label: "Installation", department: "Operations / EHS", groups: ["Installation"], scope: "once", blurb: "Who produced the goods and where." },
  { key: "goods", label: "Production", department: "Production / Plant", groups: ["Goods"], scope: "product", blurb: "Route and quantity per good." },
  { key: "emissions", label: "Embedded emissions", department: "Sustainability / ESG", groups: ["Embedded emissions"], scope: "product", blurb: "Direct & indirect emissions per tonne." },
  { key: "electricity", label: "Electricity", department: "Energy", groups: ["Electricity"], scope: "product", blurb: "Power use & grid factor (electrolysis goods)." },
  { key: "precursors", label: "Precursors", department: "Procurement", groups: ["Precursors"], scope: "product", blurb: "Embedded emissions carried in from inputs." },
  { key: "carbon", label: "Carbon price", department: "Finance", groups: ["Carbon price"], scope: "once", blurb: "Any carbon price paid in country of origin." },
  { key: "verification", label: "Verification", department: "QA / Verifier", groups: ["Verification"], scope: "once", blurb: "Accredited verifier and outcome." },
  { key: "documents", label: "Documents", department: "Compliance / QA", groups: [], scope: "docs", blurb: "Certificates and supporting files." },
];

/* Fields the supplier never types — derived from the request and shown read-only. */
export const AUTO_FIELDS = new Set(["goods-category", "cn-code", "quantity", "total-emissions"]);

/* Value-key helpers: installation-level keys are bare field ids; product-level
   keys are namespaced so each good keeps its own answer. */
export const valueKey = (fieldId: string, productId?: string) => (productId ? `${productId}::${fieldId}` : fieldId);

const ONCE_GROUPS = new Set(["Installation", "Carbon price", "Verification"]);
export const isOnceField = (group: string) => ONCE_GROUPS.has(group);

/** Verification is legally required once ANY good claims actual data — a
    supplier reporting every good on default values needs no accredited
    verifier in the definitive period. A not-yet-chosen method counts as
    "actual" (the safe default), so the requirement only relaxes on an
    explicit all-defaults submission. */
export function verificationRequired(req: SupplierRequest, values: Record<string, string>): boolean {
  return req.products.some((requestProduct) => {
    if ((values[valueKey("method", requestProduct.product.id)] || "actual") !== "default") return true;
    const rows = parsePrecursors(values[valueKey("precursors", requestProduct.product.id)]);
    return rows?.some((row) => row.method === "actual") ?? false;
  });
}

/** Which sections actually apply to this request (electricity/precursors only
    appear when the goods bring them into scope). */
export function sectionsForRequest(req: SupplierRequest): SupplierSection[] {
  const activeGroups = new Set(req.fields.map((f) => f.group));
  return SECTIONS.filter((s) => s.scope === "docs" || s.groups.some((g) => activeGroups.has(g)));
}

/** The fields belonging to a section (excludes the auto-derived ones). */
export function fieldsForSection(req: SupplierRequest, section: SupplierSection): ResolvedCbamField[] {
  return req.fields.filter((f) => section.groups.includes(f.group) && !AUTO_FIELDS.has(f.id));
}

/** Same, scoped to ONE good — precursor questions only reach products that
    actually have precursors, electricity detail only the electrolysis goods.
    `required` is re-resolved per product so an optional-for-steel field isn't
    marked mandatory just because an aluminium good shares the request. */
export function productFieldsForSection(req: SupplierRequest, section: SupplierSection, product: CatalogProduct): ResolvedCbamField[] {
  return fieldsForSection(req, section)
    .filter((f) => fieldAppliesTo(f, product))
    .map((f) => ({ ...f, required: fieldRequiredFor(f, product) }));
}

export { fieldAppliesTo, fieldRequiredFor };
