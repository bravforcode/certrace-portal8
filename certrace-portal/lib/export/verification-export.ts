/* ════════════════════════════════════════════════════════════
   THE VERIFICATION EXPORT — the sheets of one CBAM verification file

   Pure: no React, no storage. The page gathers the installation, the year's
   workbook, the precursor suppliers, the evidence and the carbon prices, and
   this turns them into sheets. What each sheet may contain is in
   lib/export/verifier-scope.ts; whether a row may carry its values is
   rowVerification there. Each sheet lists every row in scope by name, with a
   status and, when not verified, the reason. Values appear only on verified rows.

   The file is written by lib/xlsx-write.ts. Sheets come first in the order below,
   and the Summary opens the file.
   ════════════════════════════════════════════════════════════ */

import { coordinateError, type Installation } from "../installations";
import { estimateEmissions, indirectGate } from "../workbook/estimate";
import { toTonnes } from "../workbook/balance";
import { startedRow } from "../workbook/status";
import { DATA_ORIGIN_LABEL, type PrecursorSupplier } from "../precursor-suppliers";
import { EVIDENCE_SOURCE_LABEL, type EvidenceItem } from "../workspace-evidence";
import type { CarbonPriceRecord } from "../carbon-price";
import type { Sheet, SheetRow } from "../workspace-sheets";
import type { XlsxCell, XlsxSheet } from "../xlsx-write";
import {
  CARBON_PRICE_SCOPE,
  EVIDENCE_SCOPE,
  GOODS_SCOPE,
  INSTALLATION_SCOPE,
  METER_SCOPE,
  PRECURSOR_SCOPE,
  PROCESS_SCOPE,
  rowVerification,
  type ScopeField,
  type Verification,
} from "./verifier-scope";

export type VerificationExportInput = {
  installation: Installation;
  year: number;
  /** The workbook sheets of the reporting year (lib/workspace-sheets.ts). */
  sheets: Sheet[];
  /** Precursor records of the installation's verification workspaces, for linking precursor rows. */
  suppliers: PrecursorSupplier[];
  /** Evidence items of those workspaces. */
  evidence: EvidenceItem[];
  /** One entry per good with a recorded carbon price; `label` names the good. */
  carbonPrices: { label: string; record: CarbonPriceRecord }[];
  generatedAt: Date;
  /** Translator for every UI string in the file; identity when omitted. */
  t?: (en: string) => string;
};

export type VerificationExport = { fileName: string; sheets: XlsxSheet[] };

/** The sentence at the head of the Summary, verbatim from the specification. */
export const SCOPE_SENTENCE =
  "This file contains only data in scope for CBAM verification. Rows marked 'not yet verified' have no values.";

const SHEET = {
  summary: "Summary",
  installation: "Installation",
  goods: "Goods",
  precursors: "Precursors",
  steps: "Process steps",
  meters: "Meters",
  evidence: "Evidence",
  carbon: "Carbon price",
} as const;

const r4 = (x: number) => Math.round(x * 1e6) / 1e6;

const slugOf = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type Entry = { id: string; values: XlsxCell[]; check: Verification };
type Counted = { sheet: XlsxSheet; verified: number; pending: number };

/* One sheet: a header, then one row per entry. Verified rows carry their values;
   the rest keep the identifier, empty value cells, the status and the reason. */
function table(
  name: string,
  idLabel: string,
  valueFields: ScopeField[],
  entries: Entry[],
  t: (en: string) => string,
): Counted {
  const header: XlsxCell[] = [t(idLabel), ...valueFields.map((f) => t(f.label)), t("Status"), t("Reason")];
  let verified = 0;
  const body = entries.map((e): XlsxCell[] => {
    if (e.check.verified) {
      verified++;
      return [e.id, ...e.values, t("verified"), null];
    }
    return [e.id, ...e.values.map(() => null), t("not yet verified"), t(e.check.reason ?? "not yet verified")];
  });
  return {
    sheet: { name, rows: [header, ...body] },
    verified,
    pending: entries.length - verified,
  };
}

/* The rows of one workbook sheet that hold anything at all. A spare blank row is not in scope. */
const dataRows = (sheets: Sheet[], id: string): SheetRow[] =>
  (sheets.find((s) => s.id === id)?.rows ?? []).filter(startedRow);

export function buildVerificationExport(input: VerificationExportInput): VerificationExport {
  const t = input.t ?? ((en: string) => en);
  const inst = input.installation;
  const ctx = { suppliers: input.suppliers };
  const counted: Counted[] = [];

  /* Installation: one row per CBAM identification item in scope. */
  const coordsOk = coordinateError(inst.lat, inst.lng) === null;
  const installationEntries: Entry[] = INSTALLATION_SCOPE.map((f) => {
    const value = String((inst as unknown as Record<string, unknown>)[f.key] ?? "").trim();
    const coordinate = f.key === "lat" || f.key === "lng";
    const check = rowVerification(
      "installation",
      { value, valid: coordinate ? coordsOk : true },
      ctx,
    );
    return { id: t(f.label), values: [check.verified ? value : null], check };
  });
  counted.push(
    table(t(SHEET.installation), "Field", [{ key: "value", label: "Value", why: "The field as entered." }], installationEntries, t),
  );

  /* Estimate: the installation's totals, from lib/workbook/estimate.ts. */
  const estimate = estimateEmissions(input.sheets, { country: inst.country, year: input.year });
  const emissionsComplete = estimate.unmatched.length === 0 && estimate.productionT > 0;

  /* Goods. Specific emissions are the installation's totals per tonne of production.
     Indirect is counted only where indirectGate says the CN counts it. */
  const goodsEntries: Entry[] = dataRows(input.sheets, "products").map((r) => {
    const cn = (r.cells.cn ?? "").trim();
    const item = (r.cells.item ?? "").trim() || cn;
    const tonnes = toTonnes(r.cells.qty ?? "", r.cells.unit ?? "");
    const gate = indirectGate(cn);
    let check = rowVerification("products", r, ctx);
    if (check.verified && tonnes === null) check = { verified: false, reason: "unit is not a mass unit" };
    else if (check.verified && !emissionsComplete) check = { verified: false, reason: "emissions estimate incomplete" };
    else if (check.verified && gate === null) check = { verified: false, reason: "unknown CN code" };
    const p = estimate.productionT;
    const direct = p > 0 ? r4(estimate.directT / p) : null;
    const indirect: XlsxCell =
      gate === true && p > 0 ? r4(estimate.indirectT / p) : gate === false ? t("not counted (direct-only good)") : null;
    return {
      id: item,
      values: check.verified ? [cn, tonnes, direct, indirect] : [null, null, null, null],
      check,
    };
  });
  // The product name is the row's identifier; the CN code and the figures are its values.
  counted.push(table(t(SHEET.goods), "Product", GOODS_SCOPE.filter((f) => f.key !== "item"), goodsEntries, t));

  /* Precursors: each row is linked to a supplier by CN code. The figure is the supplier's. */
  const precursorEntries: Entry[] = dataRows(input.sheets, "materials").map((r) => {
    const cn = (r.cells.cn ?? "").trim();
    const item = (r.cells.item ?? "").trim() || cn;
    const tonnes = toTonnes(r.cells.qty ?? "", r.cells.unit ?? "");
    let check = rowVerification("materials", r, ctx);
    const digits = cn.replace(/\D/g, "");
    const match = digits ? input.suppliers.find((s) => !s.isScrap && s.cnCode.replace(/\D/g, "") === digits) : undefined;
    if (check.verified && tonnes === null) check = { verified: false, reason: "unit is not a mass unit" };
    else if (check.verified && (match?.seeTco2ePerT ?? null) === null) check = { verified: false, reason: "no verified supplier data" };
    return {
      id: item,
      values: check.verified && match
        ? [cn, tonnes, match.seeTco2ePerT, t(DATA_ORIGIN_LABEL[match.dataOrigin])]
        : [null, null, null, null],
      check,
    };
  });
  counted.push(table(t(SHEET.precursors), "Precursor", PRECURSOR_SCOPE, precursorEntries, t));

  /* Process steps. */
  const stepEntries: Entry[] = dataRows(input.sheets, "steps").map((r) => {
    const check = rowVerification("steps", r, ctx);
    const keep = (v: string | undefined) => (check.verified ? (v ?? "").trim() || null : null);
    return {
      id: (r.cells.step ?? "").trim(),
      values: [keep(r.cells.what), keep(r.cells.input), keep(r.cells.output)],
      check,
    };
  });
  counted.push(table(t(SHEET.steps), "Process step", PROCESS_SCOPE, stepEntries, t));

  /* Meters: each energy source with its step and monitoring method. */
  const meterEntries: Entry[] = dataRows(input.sheets, "energy").map((r) => {
    let check = rowVerification("energy", r, ctx);
    if (check.verified && !(r.cells.method ?? "").trim()) check = { verified: false, reason: "monitoring method missing" };
    const keep = (v: string | undefined) => (check.verified ? (v ?? "").trim() || null : null);
    return {
      id: (r.cells.item ?? "").trim(),
      values: [keep(r.cells.step), keep(r.cells.method)],
      check,
    };
  });
  counted.push(table(t(SHEET.meters), "Energy source", METER_SCOPE, meterEntries, t));

  /* Evidence: the document's name, type and date. Never its contents or a link. */
  const evidenceEntries: Entry[] = input.evidence.map((item) => {
    const check = rowVerification("evidence", item, ctx);
    return {
      id: item.fileName,
      values: check.verified
        ? [t(EVIDENCE_SOURCE_LABEL[item.sourceType]), item.capturedAt.slice(0, 10)]
        : [null, null],
      check,
    };
  });
  counted.push(table(t(SHEET.evidence), "Document", EVIDENCE_SCOPE, evidenceEntries, t));

  /* Carbon price: only recorded answers, and only the price, its currency and the rebate. */
  const carbonEntries: Entry[] = input.carbonPrices.map(({ label, record }) => {
    const check = rowVerification("carbon-price", {
      recorded: record.recorded,
      amountPerTonne: record.amountPerTonne,
      evidenceItemId: record.evidenceItemId,
    }, ctx);
    return {
      id: label,
      values: check.verified
        ? [record.amountPerTonne, record.currency, record.rebateAmountPerTonne ?? 0]
        : [null, null, null],
      check,
    };
  });
  if (carbonEntries.length > 0) counted.push(table(t(SHEET.carbon), "Good", CARBON_PRICE_SCOPE, carbonEntries, t));

  /* Summary: the facts a verifier starts from, then the counts per sheet. */
  const summaryRows: XlsxCell[][] = [
    [t("Installation"), inst.name],
    [t("Reporting year"), input.year],
    [t("Generated at"), input.generatedAt.toISOString()],
    [t("Standard"), t("EU CBAM")],
    [t(SCOPE_SENTENCE)],
    [],
    [t("Sheet"), t("Verified"), t("Not yet verified")],
    ...counted.map((c) => [c.sheet.name, c.verified, c.pending] as XlsxCell[]),
  ];
  const summary: XlsxSheet = { name: t(SHEET.summary), rows: summaryRows };

  const fileName = `certrace-verification-${slugOf(inst.name) || slugOf(inst.id) || "installation"}-${input.year}.xlsx`;
  return { fileName, sheets: [summary, ...counted.map((c) => c.sheet)] };
}
