/* ════════════════════════════════════════════════════════════
   SUPPLIER PORTAL — request resolution (the smartlink seam)

   When an exporter finishes the "Create declaration" wizard, every mapped
   supplier is emailed a smartlink: /s/<token>. The token encodes the
   declaration + the supplier, and resolving it here reconstructs *that
   supplier's slice* of the request — the products & lots assigned to them, the
   exact CBAM data fields that apply to those goods (via resolveCbamFields), the
   documents the exporter asked for, the deadline and the note.

   Frontend-only MVP: the request is derived from the same DECLARATIONS fixtures
   + config the exporter side uses, so nothing is invented. This file is the
   read-only "what was asked" half; lib/supplier-store.ts holds the supplier's
   answers. Both are the seam where a real API would slot in.
   ════════════════════════════════════════════════════════════ */

import { DECLARATIONS, ORG, USER, type SupplierRow } from "./data";
import {
  getRegulation,
  getJurisdiction,
  getDestination,
  resolveCbamFields,
  getCatalogProduct,
  type ResolvedCbamField,
  type CatalogProduct,
} from "./config";

/* ── Token ─────────────────────────────────────────────────────
   Opaque-ish but deterministic: base64url("declId|supplierId"). Isomorphic so
   the route (server) and the provider (client) decode the same way. */
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
  "Steel scrap": "billet",
  "Grid electricity": "hrc",
};
export const productForMaterial = (material: string): CatalogProduct =>
  getCatalogProduct(MATERIAL_TO_PRODUCT[material] ?? "hrc") ?? getCatalogProduct("hrc")!;

/* Deterministic mock lots from the supplier ref so the same link always shows
   the same quantities. Quantity is real-looking; emissions stay for the supplier
   to report. */
export type RequestLot = { id: string; qty: number; unit: string; from: string; to: string };
function lotsForSupplier(row: SupplierRow): RequestLot[] {
  const seed = parseInt(row.ref.replace(/\D/g, "") || "100", 10);
  const base = 200 + (seed % 9) * 140;
  const lots: RequestLot[] = [
    { id: `${row.id}-l1`, qty: base, unit: "tonnes (t)", from: "2026-04-01", to: "2026-05-31" },
  ];
  if (seed % 2 === 0) lots.push({ id: `${row.id}-l2`, qty: Math.round(base * 0.6), unit: "tonnes (t)", from: "2026-06-01", to: "2026-06-30" });
  return lots;
}

export type RequestProduct = {
  product: CatalogProduct;
  lots: RequestLot[];
  totalTonnes: number;
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
  // what to fill
  products: RequestProduct[];
  fields: ResolvedCbamField[];
  documents: RequestDocAsk[];
};

/* The documents an EU steel buyer/importer typically asks for alongside the CBAM
   carbon data. Fixed, realistic set for the demo request. */
const REQUESTED_DOCS: RequestDocAsk[] = [
  { id: "cbam-sheet", label: "CBAM communication / embedded-emissions sheet", required: true },
  { id: "mtc", label: "Mill Test Certificate (EN 10204 3.1)", required: true },
  { id: "coo", label: "Certificate of Origin (COO)", required: true },
  { id: "verif", label: "Verification statement (accredited verifier)", required: false },
];

const DEFAULT_NOTE =
  "Please report at installation level using actual data where you have it. If you only have default factors, mark the method as “default”. Reach out if anything is unclear — we'd rather help than receive a guess.";

export function resolveRequest(token: string): SupplierRequest | null {
  const decoded = decodeToken(token);
  if (!decoded) return null;
  const decl = DECLARATIONS.find((d) => d.id === decoded.declId);
  if (!decl) return null;
  const row = decl.suppliers.find((s) => s.id === decoded.supplierId);
  if (!row) return null;

  const reg = getRegulation(decl.regulation) ?? getRegulation("cbam")!;
  const origin = getJurisdiction(decl.origin);
  const dest = getDestination(decl.market);

  const product = productForMaterial(row.material);
  const lots = lotsForSupplier(row);
  const totalTonnes = lots.reduce((a, l) => a + (l.unit === "tonnes (t)" ? l.qty : 0), 0);
  const products: RequestProduct[] = [{ product, lots, totalTonnes }];

  const fields = resolveCbamFields(products.map((p) => p.product));

  return {
    token,
    declId: decl.id,
    supplierId: row.id,
    supplierName: row.name,
    supplierRef: row.ref,
    supplierCountry: row.country,
    critical: row.critical,
    exporterName: ORG.name,
    exporterContact: USER.name,
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
    noteToSuppliers: DEFAULT_NOTE,
    products,
    fields,
    documents: REQUESTED_DOCS,
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
