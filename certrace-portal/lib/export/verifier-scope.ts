/* ════════════════════════════════════════════════════════════
   WHAT THE VERIFICATION EXPORT MAY CONTAIN

   An accredited CBAM verifier checks a fixed set of facts. This file says which
   fields of the workbook, the installation and the evidence reach the export,
   and why each one is there. Everything not named here stays in the portal:
   internal notes, costs and prices other than the carbon price, contact phone
   and email, transport data, user names and ids, revision metadata.

   It is an allowlist on purpose. A field added to the workbook later reaches the
   file only when someone adds it here with a reason.

   rowVerification decides whether a row's values may be written at all. A row
   that fails its check is still listed, by name, with no values.
   ════════════════════════════════════════════════════════════ */

import { coordinateError } from "../installations";
import { REQUIRED } from "../workbook/status";
import type { PrecursorSupplier } from "../precursor-suppliers";
import type { EvidenceItem } from "../workspace-evidence";
import type { SheetRow } from "../workspace-sheets";

/** One column of the export: the source key, the column's English label, and the verifier's reason for it. */
export type ScopeField = { key: string; label: string; why: string };

/* ── Allowlists, one per sheet of the export ─────────────────── */

/* Installation: the CBAM identification items (Annex IV 1(a)–(c) and the site
   identity). The phone and email are deliberately absent, as is the local-language
   name, which the verifier does not need to locate the site. */
export const INSTALLATION_SCOPE: ScopeField[] = [
  { key: "name", label: "Name of the installation", why: "Identifies the installation the report covers (item ii)." },
  { key: "street", label: "Street, number", why: "Site address the verifier visits (item iii)." },
  { key: "postcode", label: "Post code", why: "Part of the site address (item v)." },
  { key: "poBox", label: "P.O. Box", why: "Postal address line where the site uses one (item vi)." },
  { key: "city", label: "City", why: "Part of the site address (item vii)." },
  { key: "country", label: "Country", why: "Decides which EU default values and rules apply (item viii)." },
  { key: "unlocode", label: "UN/LOCODE", why: "Locates the site in the UN trade-location code (item ix)." },
  { key: "lat", label: "Latitude", why: "Coordinates of the main emission source (item x)." },
  { key: "lng", label: "Longitude", why: "Coordinates of the main emission source (item xi)." },
  { key: "economicActivity", label: "Economic activity", why: "The activity the installation is classified under (item iv)." },
  { key: "contactName", label: "Authorised representative", why: "The operator contact name only (item xii); no phone or email." },
];

/* Goods: one row per product. Production tonnes is the denominator of every
   specific embedded emission, so it is exported with them. */
export const GOODS_SCOPE: ScopeField[] = [
  { key: "cn", label: "CN code", why: "Identifies the good against the CBAM goods list." },
  { key: "item", label: "Product", why: "The good as the verifier will match it to the CN code." },
  { key: "tonnes", label: "Production (t)", why: "The quantity the specific emissions are expressed per." },
  { key: "direct", label: "Direct SEE (tCO2e/t)", why: "Direct specific embedded emissions of the good." },
  { key: "indirect", label: "Indirect SEE (tCO2e/t)", why: "Indirect emissions, only where the CN counts them (indirectCounts)." },
];

/* Precursors: the bought-in inputs and their embedded emissions. The data origin
   tells the verifier which figure stands behind the number. */
export const PRECURSOR_SCOPE: ScopeField[] = [
  { key: "name", label: "Precursor", why: "The input the verifier traces to a supplier." },
  { key: "cn", label: "CN code", why: "Identifies the precursor against the CBAM goods list." },
  { key: "tonnes", label: "Quantity (t)", why: "The quantity of precursor consumed." },
  { key: "see", label: "Embedded emissions (tCO2e/t)", why: "The supplier's embedded emissions the figure rests on." },
  { key: "origin", label: "Data origin", why: "Whether the figure is supplier-verified or a default value." },
];

/* Process steps: what happens at each step, which the verifier needs to follow
   the production route. */
export const PROCESS_SCOPE: ScopeField[] = [
  { key: "what", label: "What happens", why: "The process the verifier checks against the production route." },
  { key: "input", label: "Main input", why: "The main input to the step, for the mass flow." },
  { key: "output", label: "Output", why: "The output of the step, for the mass flow." },
];

/* Monitoring meters: each energy source with the step it feeds and how it is
   measured. This is the monitoring method the verifier audits. */
export const METER_SCOPE: ScopeField[] = [
  { key: "step", label: "Process step", why: "The step the metered energy feeds." },
  { key: "method", label: "Monitoring method", why: "How the quantity is measured or calculated." },
];

/* Evidence: the document's name, what kind of document it is and its date. The
   file contents and any link are never exported. */
export const EVIDENCE_SCOPE: ScopeField[] = [
  { key: "type", label: "Document type", why: "What kind of document backs a figure (for sampling)." },
  { key: "date", label: "Date", why: "When the document was captured, for matching to the period." },
];

/* Carbon price paid: the amount per tonne, its currency and any rebate taken off
   it. The only price the export carries. */
export const CARBON_PRICE_SCOPE: ScopeField[] = [
  { key: "amount", label: "Carbon price per tCO2e", why: "The carbon price effectively paid (Article 9)." },
  { key: "currency", label: "Currency", why: "The currency the price is stated in." },
  { key: "rebate", label: "Rebate per tCO2e", why: "The rebate deducted from the price, which the template subtracts." },
];

/* ── Verification ────────────────────────────────────────────── */

export type Verification = { verified: boolean; reason?: string };

/** Installation input: the field's value and whether it passes its own check. */
export type InstallationFieldInput = { value: string; valid: boolean };

/** Carbon price input: whether the exporter recorded an answer, and its evidence. */
export type CarbonPriceInput = { recorded: boolean; amountPerTonne: number; evidenceItemId?: string };

export type VerificationContext = { suppliers: PrecursorSupplier[] };

const filled = (v: string | undefined) => v !== undefined && v.trim() !== "";
const digits = (s: string | undefined) => (s ?? "").replace(/\D/g, "");

/* A precursor is linked to its supplier by CN code. A row with no CN, or with no
   supplier record carrying the same code, cannot be linked, so it is not verified. */
function precursorOrigin(row: SheetRow, ctx: VerificationContext): Verification {
  const cn = digits(row.cells.cn);
  const matches = cn ? ctx.suppliers.filter((s) => !s.isScrap && digits(s.cnCode) === cn) : [];
  if (matches.length === 0) return { verified: false, reason: "no verified supplier data" };
  if (matches.some((s) => s.dataOrigin === "default_value")) return { verified: false, reason: "default value" };
  if (matches.some((s) => s.dataOrigin !== "supplier_verified"))
    return { verified: false, reason: "supplier data not verified" };
  return { verified: true };
}

function workbookRow(sheet: string, row: SheetRow, ctx: VerificationContext): Verification {
  const required = REQUIRED[sheet] ?? [];
  if (required.some((k) => !filled(row.cells[k]))) return { verified: false, reason: "required field missing" };
  if (row.status === "missing") return { verified: false, reason: "marked missing" };
  if (row.status === "review") return { verified: false, reason: "waiting for review" };
  if (row.status === "empty") return { verified: false, reason: "required field missing" };
  if (sheet === "materials") return precursorOrigin(row, ctx);
  return { verified: true };
}

function evidenceItem(item: EvidenceItem): Verification {
  if (item.reviewedBy) return { verified: true };
  const status = item.extraction?.status;
  if (status === "done") return { verified: true };
  if (status === "failed") return { verified: false, reason: "extraction failed" };
  return { verified: false, reason: "waiting for review" };
}

/**
 * Whether one row may carry its values in the export. The sheet decides which
 * check applies: "installation", "evidence" and "carbon-price" take their own
 * input shapes, every other sheet id is a workbook sheet (lib/workbook/status.ts).
 */
export function rowVerification(sheet: "installation", row: InstallationFieldInput, ctx: VerificationContext): Verification;
export function rowVerification(sheet: "evidence", row: EvidenceItem, ctx: VerificationContext): Verification;
export function rowVerification(sheet: "carbon-price", row: CarbonPriceInput, ctx: VerificationContext): Verification;
export function rowVerification(sheet: string, row: SheetRow, ctx: VerificationContext): Verification;
export function rowVerification(
  sheet: string,
  row: SheetRow | InstallationFieldInput | EvidenceItem | CarbonPriceInput,
  ctx: VerificationContext,
): Verification {
  if (sheet === "installation") {
    const f = row as InstallationFieldInput;
    if (!filled(f.value)) return { verified: false, reason: "required field missing" };
    return f.valid ? { verified: true } : { verified: false, reason: "invalid value" };
  }
  if (sheet === "evidence") return evidenceItem(row as EvidenceItem);
  if (sheet === "carbon-price") {
    const c = row as CarbonPriceInput;
    if (!c.recorded) return { verified: false, reason: "not recorded" };
    if (c.amountPerTonne > 0 && !c.evidenceItemId) return { verified: false, reason: "required field missing" };
    return { verified: true };
  }
  return workbookRow(sheet, row as SheetRow, ctx);
}

/** The installation check: a coordinate pair is valid when both halves parse and are in range. */
export const coordinatesValid = (lat: string, lng: string) => coordinateError(lat, lng) === null;
