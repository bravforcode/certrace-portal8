/* ════════════════════════════════════════════════════════════
   SMART INTAKE — drop the documents first, work out what they are after

   PROTOTYPE. The upload flow everywhere else in the portal is SLOT-FIRST: the
   reader picks "Utility invoice — March" and then attaches a file to it. BD and
   ESG asked for the opposite order — throw the pile in, and let the product say
   what each file is, which month it covers and which checklist row it belongs
   to. This module is that order, and nothing else in the portal depends on it.

   DETECTION IS A MOCK. Nothing here calls a model. A file is recognised one of
   three ways, and the UI says which:

     document  — the sample PDFs in public/mock-documents carry the answer in
                 their Keywords metadata (scripts/make-mock-documents.mjs), so
                 a demo shows realistic values, confidences and failure cases
     filename  — any other file is guessed from its name alone, with lower
                 confidence and no values, because nothing inside was read
     none      — no guess; the reader picks

   The seam for a real model is `detect()`: same input, same `Detection` out.

   THE RULE FROM lib/workspace-evidence.ts STILL HOLDS: detection PROPOSES.
   Nothing is filed until a human confirms the card, and only the fields they
   leave ticked are written. Unticked fields are dropped rather than stored
   unaccepted, so a filed document always counts as reviewed.
   ════════════════════════════════════════════════════════════ */

import { PDFDocument } from "pdf-lib";
import {
  CONFIDENCE_FLOOR,
  INLINE_BYTES_LIMIT,
  annualRequiredKeys,
  annualScopeFor,
  listEvidence,
  requiredKeysForMonth,
  saveEvidence,
  uid,
  type EvidenceSourceType,
  type ExtractedField,
  type RequiredKey,
} from "./workspace-evidence";
import { emptyFuel, emptyElectricitySource, applyEuStandard, fuelTypeDef, getMonth, emptyMonth, saveMonth, type MonthlyEntry } from "./monthly-data";
import { markAiFilled } from "./ai-fill";
import { getWorkspace, monthsOf, type VerificationWorkspace } from "./workspace";
import { workspaceRequiresIndirectEmissions } from "./cbam/product-category-rules";
import { getCarbonPrice } from "./carbon-price";

/* ── What a document is about ─────────────────────────────────── */
export type DocSubject =
  | "electricity_bill"
  | "electricity_meter"
  | "fuel_invoice"
  | "fuel_meter"
  | "production"
  | "calibration"
  | "mill_test_certificate"
  | "precursor_verification"
  | "carbon_price"
  | "installation_diagram"
  | "lab_report"
  | "cbam_communication"
  | "certificate_of_origin"
  | "unrelated"
  | "unknown";

export const DOC_SUBJECTS: DocSubject[] = [
  "electricity_bill",
  "electricity_meter",
  "fuel_invoice",
  "fuel_meter",
  "production",
  "calibration",
  "mill_test_certificate",
  "precursor_verification",
  "carbon_price",
  "installation_diagram",
  "lab_report",
  "cbam_communication",
  "certificate_of_origin",
  "unrelated",
  "unknown",
];

export const DOC_SUBJECT_LABEL: Record<DocSubject, string> = {
  electricity_bill: "Electricity bill",
  electricity_meter: "Electricity meter log",
  fuel_invoice: "Fuel invoice / delivery note",
  fuel_meter: "Fuel consumption record",
  production: "Production record / ERP export",
  calibration: "Calibration certificate",
  mill_test_certificate: "Mill test certificate",
  precursor_verification: "Precursor verification report",
  carbon_price: "Carbon price receipt",
  installation_diagram: "Installation diagram",
  lab_report: "Laboratory analysis",
  cbam_communication: "CBAM communication sheet",
  certificate_of_origin: "Certificate of Origin",
  unrelated: "Not a CBAM document",
  unknown: "Not recognised",
};

const SOURCE_TYPE: Record<DocSubject, EvidenceSourceType> = {
  electricity_bill: "utility_invoice",
  electricity_meter: "meter_log",
  fuel_invoice: "fuel_invoice",
  fuel_meter: "meter_log",
  production: "erp_export",
  calibration: "calibration_record",
  mill_test_certificate: "mill_test_certificate",
  precursor_verification: "supplier_cti",
  carbon_price: "carbon_price_receipt",
  installation_diagram: "other",
  lab_report: "lab_report",
  cbam_communication: "supplier_cti",
  certificate_of_origin: "other",
  unrelated: "other",
  unknown: "other",
};

/** Subjects that need a fuel type to find their row. */
export const needsFuel = (s: DocSubject): boolean => s === "fuel_invoice" || s === "fuel_meter";

/* ── Detection ────────────────────────────────────────────────── */
export type DetectionSource = "document" | "filename" | "none";

export type Detection = {
  subject: DocSubject;
  subjectConfidence: number;
  /** 'YYYY-MM' */
  month?: string;
  monthConfidence: number;
  fuelType?: string;
  issuer?: string;
  summary: string;
  fields: ExtractedField[];
  via: DetectionSource;
};

const MOCK_PREFIX = "certrace-mock:";

type MockPayload = {
  v: 1;
  subject: DocSubject;
  subjectConfidence: number;
  month?: string;
  monthConfidence?: number;
  fuelType?: string;
  issuer?: string;
  summary: string;
  fields: { key: string; value: string; unit?: string; confidence: number }[];
};

const b64urlToText = (s: string): string => {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

async function readEmbedded(bytes: ArrayBuffer): Promise<MockPayload | null> {
  try {
    const pdf = await PDFDocument.load(bytes, { updateMetadata: false, ignoreEncryption: true });
    const kw = pdf.getKeywords() ?? "";
    const at = kw.indexOf(MOCK_PREFIX);
    if (at < 0) return null;
    const token = kw.slice(at + MOCK_PREFIX.length).split(/[\s,;]/)[0];
    const parsed = JSON.parse(b64urlToText(token)) as MockPayload;
    return parsed?.v === 1 && DOC_SUBJECTS.includes(parsed.subject) ? parsed : null;
  } catch {
    return null;
  }
}

const MONTHS_EN = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTHS_TH = ["ม.ค", "ก.พ", "มี.ค", "เม.ย", "พ.ค", "มิ.ย", "ก.ค", "ส.ค", "ก.ย", "ต.ค", "พ.ย", "ธ.ค"];

/** A month named in the file name, if any. Buddhist-era years are converted. */
export function monthFromName(name: string, fallbackYear: number): string | undefined {
  const lower = name.toLowerCase();
  const iso = /(20\d\d|25\d\d)[-_. ]?(0[1-9]|1[0-2])(?!\d)/.exec(lower);
  const toCe = (y: number) => (y > 2400 ? y - 543 : y);
  if (iso) return `${toCe(Number(iso[1]))}-${iso[2]}`;
  const yearMatch = /(20\d\d|25\d\d)/.exec(lower);
  const year = yearMatch ? toCe(Number(yearMatch[1])) : fallbackYear;
  const en = MONTHS_EN.findIndex((m) => new RegExp(`(^|[^a-z])${m}`).test(lower));
  if (en >= 0) return `${year}-${String(en + 1).padStart(2, "0")}`;
  const th = MONTHS_TH.findIndex((m) => name.includes(m));
  if (th >= 0) return `${year}-${String(th + 1).padStart(2, "0")}`;
  return undefined;
}

const NAME_RULES: { test: RegExp; subject: DocSubject; fuelType?: string }[] = [
  { test: /cbam|communication|emission.?sheet|embedded/, subject: "cbam_communication" },
  { test: /origin|\bcoo\b|form.?d|ถิ่นกำเนิด/, subject: "certificate_of_origin" },
  { test: /mill.?test|mtc|3\.1/, subject: "mill_test_certificate" },
  { test: /calib|สอบเทียบ/, subject: "calibration" },
  { test: /verif|ทวนสอบ/, subject: "precursor_verification" },
  { test: /carbon.?(tax|price)|ภาษีคาร์บอน/, subject: "carbon_price" },
  { test: /diagram|flow.?chart|แผนผัง/, subject: "installation_diagram" },
  { test: /\blab\b|ncv|analysis|วิเคราะห์/, subject: "lab_report" },
  { test: /diesel|ดีเซล/, subject: "fuel_invoice", fuelType: "diesel" },
  { test: /lpg/, subject: "fuel_invoice", fuelType: "lpg" },
  { test: /natural.?gas|ngv|ก๊าซธรรมชาติ/, subject: "fuel_invoice", fuelType: "natural_gas" },
  { test: /coal|ถ่านหิน/, subject: "fuel_invoice", fuelType: "bituminous_coal" },
  { test: /fuel|น้ำมัน|ptt/, subject: "fuel_invoice" },
  { test: /meter|มิเตอร์/, subject: "electricity_meter" },
  { test: /electric|ค่าไฟ|ไฟฟ้า|\bpea\b|\bmea\b|utility|power.?bill/, subject: "electricity_bill" },
  { test: /production|erp|ผลิต|output/, subject: "production" },
  { test: /receipt|ใบเสร็จ|stationery|office/, subject: "unrelated" },
];

function detectFromName(name: string, year: number): Detection {
  const lower = name.toLowerCase();
  const rule = NAME_RULES.find((r) => r.test.test(lower) || r.test.test(name));
  const month = monthFromName(name, year);
  if (!rule) {
    return {
      subject: "unknown",
      subjectConfidence: 0,
      month,
      monthConfidence: month ? 0.5 : 0,
      summary: "Nothing in the file name says what this is. Pick the document type below.",
      fields: [],
      via: "none",
    };
  }
  return {
    subject: rule.subject,
    subjectConfidence: 0.6,
    month,
    monthConfidence: month ? 0.55 : 0,
    fuelType: rule.fuelType,
    summary: "Guessed from the file name only. Nothing inside the file was read, so no values were proposed.",
    fields: [],
    via: "filename",
  };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** THE SEAM. A real model call replaces the body; the shape stays. */
export async function detect(file: File, bytes: ArrayBuffer, year: number): Promise<Detection> {
  await wait(700 + Math.random() * 1100);
  const embedded = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf") ? await readEmbedded(bytes) : null;
  if (!embedded) return detectFromName(file.name, year);
  return {
    subject: embedded.subject,
    subjectConfidence: embedded.subjectConfidence,
    month: embedded.month,
    monthConfidence: embedded.monthConfidence ?? (embedded.month ? 0.9 : 0),
    fuelType: embedded.fuelType,
    issuer: embedded.issuer,
    summary: embedded.summary,
    fields: embedded.fields.map((f) => ({ ...f, confidence: Math.min(1, Math.max(0, f.confidence)), accepted: f.confidence >= CONFIDENCE_FLOOR })),
    via: "document",
  };
}

/* ── Where a document files to ────────────────────────────────── */
export type Target = RequiredKey & { scope: "month" | "annual" };

type WorkspaceScope = { workspace: VerificationWorkspace; requiresIndirect: boolean };

function scopeOf(workspaceId: string): WorkspaceScope | null {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) return null;
  return { workspace, requiresIndirect: workspaceRequiresIndirectEmissions(workspace.productId) };
}

/** Every row a document could file to, for the month picked (if any) plus the
    year. Conditional annual rows are offered even when not yet triggered —
    the reader may be holding the document that proves they apply. */
export function targetsFor(workspaceId: string, month: string | undefined): Target[] {
  const s = scopeOf(workspaceId);
  if (!s) return [];
  const out: Target[] = [];
  if (month) {
    const entry = getMonth(workspaceId, month) ?? emptyMonth(workspaceId, month);
    for (const k of requiredKeysForMonth(entry, s.requiresIndirect)) out.push({ ...k, scope: "month" });
  }
  const scope = annualScopeFor(workspaceId, s.workspace.periodStart, s.workspace.periodEnd, getCarbonPrice(workspaceId).amountPerTonne > 0);
  const annual = annualRequiredKeys({ ...scope, hasPurchasedPrecursors: true, carbonPricePaid: true, usesLabAnalysis: true });
  for (const k of annual) if (!out.some((o) => o.key === k.key)) out.push({ ...k, scope: "annual" });
  return out;
}

const FIXED_KEY: Partial<Record<DocSubject, string>> = {
  electricity_bill: "utility-invoice",
  electricity_meter: "electricity-consumed",
  production: "production",
  calibration: "calibration-records",
  mill_test_certificate: "mill-test-certificate",
  precursor_verification: "precursor-verification-report",
  carbon_price: "carbon-price",
  installation_diagram: "installation-diagram",
  lab_report: "lab-analysis",
};

/* ── Short names for checklist rows ───────────────────────────────
   The checklist's own labels are written for a verifier ("ERP production
   export / meter log — monthly production volume for the reporting period").
   On the intake card the reader only needs to know where the file lands, so
   the card uses these. `text` is an English dictionary key; `{fuel}` is
   filled with the fuel's name in the reader's language. */
export type ShortLabel = { text: string; fuelType?: string };

const SHORT_LABEL: Record<string, string> = {
  production: "Production volume",
  "utility-invoice": "Electricity bill",
  "electricity-consumed": "Electricity meter readings",
  "electricity-factor": "Electricity emission factor",
  "calibration-records": "Calibration certificate",
  "installation-diagram": "Installation diagram",
  "installation-identity": "Installation identity",
  "internal-qa-record": "Internal QA record",
  "precursor-verification-report": "Precursor verification report",
  "mill-test-certificate": "Mill test certificate",
  "contract-or-ppa": "Electricity contract / PPA",
  "lab-analysis": "Laboratory analysis",
  "default-value-justification": "Default value justification",
  "carbon-price": "Carbon price receipt",
};

export function shortTargetLabel(workspaceId: string, key: string, month: string | undefined, fallbackFuelType?: string): ShortLabel {
  const [prefix, rowId] = key.split(":");
  if (rowId) {
    const fuelType = (month ? getMonth(workspaceId, month)?.fuels.find((f) => f.id === rowId)?.fuelType : undefined) || fallbackFuelType;
    const text = prefix === "fuel-invoice" ? "{fuel} — invoice" : prefix === "biomass" ? "{fuel} — biomass sustainability documents" : "{fuel} — consumption records";
    return { text, fuelType };
  }
  return { text: SHORT_LABEL[key] ?? key };
}

/** Keys `requiredKeysForMonth` produces — the per-month checklist rows. */
export const isMonthlyKey = (key: string): boolean =>
  key === "production" ||
  key === "electricity-consumed" ||
  key === "electricity-factor" ||
  key === "utility-invoice" ||
  key.startsWith("fuel:") ||
  key.startsWith("fuel-invoice:") ||
  key.startsWith("biomass:");

export type Suggestion = {
  key?: string;
  /** why no row could be suggested, in plain words */
  problem?: string;
  /** a fuel invoice whose fuel has no row this month — filing can add one */
  addFuelRow?: string;
  /** the document was understood, and this workspace simply does not need
      it. Not a question for the reader, so it must not sit in "needs you". */
  notNeeded?: string;
};

export function suggestTarget(workspaceId: string, subject: DocSubject, month: string | undefined, fuelType: string | undefined): Suggestion {
  const s = scopeOf(workspaceId);
  if (!s) return { problem: "Product report not found." };
  if (subject === "unrelated") return { notNeeded: "This does not look like anything a CBAM verifier asks for." };
  if (subject === "unknown") return { problem: "Pick what this document is first." };
  // Supplier-portal documents: the workspace checklist has no row for them.
  if (subject === "cbam_communication" || subject === "certificate_of_origin") {
    return { notNeeded: "This document belongs to a supplier's data request, not to this product report's checklist." };
  }
  if ((subject === "electricity_bill" || subject === "electricity_meter") && !s.requiresIndirect) {
    return { notNeeded: "Electricity emissions are not counted for {product}, so no electricity document is required." };
  }
  const monthly = subject === "electricity_bill" || subject === "electricity_meter" || subject === "production" || needsFuel(subject);
  if (monthly && !month) return { problem: "Pick which month this document covers." };
  if (month && !monthsOf(s.workspace).includes(month)) {
    return { problem: `The month is outside this workspace's reporting year (${s.workspace.year}).` };
  }
  if (needsFuel(subject)) {
    if (!fuelType) return { problem: "Pick which fuel this is for." };
    const entry = getMonth(workspaceId, month!) ?? emptyMonth(workspaceId, month!);
    const row = entry.fuels.find((f) => f.fuelType === fuelType);
    if (!row) return { addFuelRow: fuelType };
    return { key: `${subject === "fuel_invoice" ? "fuel-invoice" : "fuel"}:${row.id}` };
  }
  return { key: FIXED_KEY[subject] };
}

/* ── The queue ────────────────────────────────────────────────────
   In memory, per workspace, so moving between tabs or supplier steps keeps
   the pile. A reload clears it — anything already filed lives in the evidence
   store, and a prototype queue that outlived a reload would need a story for
   files too big to keep in the browser. */
export type IntakeStatus = "reading" | "review" | "filed" | "discarded";

export type IntakeDoc = {
  id: string;
  workspaceId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  hash?: string;
  fileDataUrl?: string;
  addedAt: string;
  status: IntakeStatus;
  detection?: Detection;
  /* The reader's current answer — seeded from detection, edited on the card. */
  subject: DocSubject;
  month?: string;
  fuelType?: string;
  /** a checklist row the reader picked by hand, overriding the suggestion */
  targetOverride?: string;
  fields: ExtractedField[];
  /** another document in the pile, or already filed, with the same bytes */
  duplicateOf?: string;
  filedTo?: { key: string; label: string; month?: string; short: ShortLabel };
  /** set when the reader dismissed it as not needed, rather than set it aside */
  notNeededReason?: string;
  notes?: IntakeNote[];
};

const queues = new Map<string, IntakeDoc[]>();
const listeners = new Set<() => void>();
const EMPTY: IntakeDoc[] = [];

const emit = () => listeners.forEach((l) => l());

export const subscribeIntake = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const intakeQueue = (workspaceId: string): IntakeDoc[] => queues.get(workspaceId) ?? EMPTY;

function setQueue(workspaceId: string, next: IntakeDoc[]) {
  queues.set(workspaceId, next);
  emit();
}

export function patchDoc(workspaceId: string, id: string, patch: Partial<IntakeDoc>) {
  setQueue(
    workspaceId,
    intakeQueue(workspaceId).map((d) => (d.id === id ? { ...d, ...patch } : d)),
  );
}

export const clearFinished = (workspaceId: string) =>
  setQueue(
    workspaceId,
    intakeQueue(workspaceId).filter((d) => d.status === "reading" || d.status === "review"),
  );

async function sha256(bytes: ArrayBuffer): Promise<string | undefined> {
  try {
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return undefined;
  }
}

const toDataUrl = (bytes: ArrayBuffer, mime: string): string => {
  let bin = "";
  const view = new Uint8Array(bytes);
  for (let i = 0; i < view.length; i += 0x8000) bin += String.fromCharCode(...view.subarray(i, i + 0x8000));
  return `data:${mime || "application/octet-stream"};base64,${btoa(bin)}`;
};

/** Add files to the pile and start reading each one. */
export async function addFiles(workspaceId: string, files: File[], onQueued?: (ids: string[]) => void): Promise<void> {
  const workspace = getWorkspace(workspaceId);
  const year = workspace?.year ?? new Date().getFullYear();
  const fresh: IntakeDoc[] = files.map((f) => ({
    id: uid(),
    workspaceId,
    fileName: f.name,
    mimeType: f.type,
    sizeBytes: f.size,
    addedAt: new Date().toISOString(),
    status: "reading",
    subject: "unknown",
    fields: [],
  }));
  setQueue(workspaceId, [...fresh, ...intakeQueue(workspaceId)]);
  // The popup follows exactly this batch — told before any reading starts.
  onQueued?.(fresh.map((d) => d.id));

  const filedNames = new Set(listEvidence(workspaceId).map((e) => `${e.fileName}|${e.sizeBytes ?? ""}`));

  await Promise.all(
    files.map(async (file, i) => {
      const doc = fresh[i];
      const bytes = await file.arrayBuffer();
      const hash = await sha256(bytes);
      const earlier = intakeQueue(workspaceId).find((d) => d.id !== doc.id && d.hash && d.hash === hash && d.status !== "discarded");
      const duplicateOf = earlier?.fileName ?? (filedNames.has(`${file.name}|${file.size}`) ? `${file.name} (already filed)` : undefined);
      const detection = await detect(file, bytes, year);
      patchDoc(workspaceId, doc.id, {
        hash,
        fileDataUrl: file.size <= INLINE_BYTES_LIMIT ? toDataUrl(bytes, file.type) : undefined,
        status: "review",
        detection,
        subject: detection.subject,
        month: detection.month,
        fuelType: detection.fuelType,
        fields: detection.fields,
        duplicateOf,
      });
    }),
  );
}

/* ── Readiness of one card ────────────────────────────────────── */
export type DocVerdict = {
  /** the row it will file to, when one is settled */
  target?: Target;
  suggestion: Suggestion;
  /** confident enough to file in the bulk action without opening the card */
  confident: boolean;
  /** the reader still has to answer something before it can file */
  blocked: string | null;
  /** understood, and not required here — see Suggestion.notNeeded */
  notNeeded: string | null;
};

export function verdictFor(doc: IntakeDoc): DocVerdict {
  const suggestion = suggestTarget(doc.workspaceId, doc.subject, doc.month, doc.fuelType);
  const key = doc.targetOverride ?? suggestion.key;
  const target = key ? targetsFor(doc.workspaceId, doc.month).find((t) => t.key === key) : undefined;
  const d = doc.detection;
  // A row picked by hand overrides "not needed" — the reader knows something
  // the product rules don't.
  const notNeeded = doc.status === "review" && !target && suggestion.notNeeded ? suggestion.notNeeded : null;
  const blocked =
    doc.status !== "review" || notNeeded
      ? null
      : target || suggestion.addFuelRow
        ? null
        : (suggestion.problem ?? "Pick a checklist row for this document.");
  const confident =
    !blocked &&
    !notNeeded &&
    !doc.duplicateOf &&
    !!d &&
    d.via === "document" &&
    !doc.targetOverride &&
    d.subjectConfidence >= CONFIDENCE_FLOOR &&
    (!d.month || d.monthConfidence >= CONFIDENCE_FLOOR) &&
    doc.fields.every((f) => f.confidence >= CONFIDENCE_FLOOR);
  return { target, suggestion, confident, blocked, notNeeded };
}

/* ── Filing ───────────────────────────────────────────────────────
   Only these extracted keys can move a figure. Everything else is context a
   verifier reads beside the document. */
export const WRITES_TO: Record<string, string> = {
  "electricity-consumed": "Electricity consumed (MWh)",
  "production-tonnes": "Production (t)",
  "fuel-quantity": "Fuel quantity",
};

const num = (v: string) => Number(String(v).replace(/[,\s]/g, ""));

/** What filing wrote, as a dictionary key plus values — the card translates it. */
export type IntakeNote = { text: string; vars?: Record<string, string> };

const fmtNum = (n: number) => n.toLocaleString("en-GB");

/** A box AI filled — key is relative to the month (`production`, `fuel:<id>`, `elec:<id>`). */
type AiMark = { key: string; value: number };

function applyFields(
  entry: MonthlyEntry,
  doc: IntakeDoc,
  fuelRowId: string | undefined,
  /** id for an electricity source row, if one has to be created — made by the
      caller so the dry run and the real write agree on it */
  elecRowId: string,
): { entry: MonthlyEntry; notes: IntakeNote[]; marks: AiMark[] } {
  let next = entry;
  const notes: IntakeNote[] = [];
  const marks: AiMark[] = [];
  for (const f of doc.fields.filter((x) => x.accepted)) {
    const n = num(f.value);
    const unit = (f.unit ?? "").toLowerCase();
    if (f.key === "electricity-consumed" && Number.isFinite(n)) {
      const mwh = unit === "kwh" ? n / 1000 : n;
      /* Into a SOURCE ROW. The month editor shows electricity only as source
         rows, so a bare electricityMwh used to be stored and never seen. */
      if (next.electricitySources && next.electricitySources.length > 0) {
        const idx = Math.max(0, next.electricitySources.findIndex((s) => s.sourceType === "grid_default"));
        const rowId = next.electricitySources[idx].id;
        next = { ...next, electricitySources: next.electricitySources.map((s, i) => (i === idx ? { ...s, mwh } : s)) };
        marks.push({ key: `elec:${rowId}`, value: mwh });
      } else {
        next = { ...next, electricitySources: [{ ...emptyElectricitySource(), id: elecRowId, mwh }] };
        marks.push({ key: `elec:${elecRowId}`, value: mwh });
      }
      notes.push(
        unit === "kwh"
          ? { text: "Electricity: {kwh} kWh → {mwh} MWh", vars: { kwh: fmtNum(n), mwh: fmtNum(mwh) } }
          : { text: "Electricity: {mwh} MWh", vars: { mwh: fmtNum(mwh) } },
      );
    }
    if (f.key === "production-tonnes" && Number.isFinite(n)) {
      const t = unit === "kg" ? n / 1000 : n;
      next = { ...next, productionTonnes: t };
      marks.push({ key: "production", value: t });
      notes.push({ text: "Production: {t} t", vars: { t: fmtNum(t) } });
    }
    if (f.key === "fuel-quantity" && Number.isFinite(n) && fuelRowId) {
      const row = next.fuels.find((x) => x.id === fuelRowId);
      const u = f.unit === "L" ? "l" : f.unit;
      if (row && (!u || u === row.unit)) {
        next = { ...next, fuels: next.fuels.map((x) => (x.id === fuelRowId ? { ...x, quantity: n } : x)) };
        marks.push({ key: `fuel:${fuelRowId}`, value: n });
        notes.push({ text: "Fuel quantity: {qty} {unit}", vars: { qty: fmtNum(n), unit: row.unit } });
      } else if (row) {
        notes.push({ text: "Fuel quantity not written — the document says {docUnit}, the row is in {rowUnit}", vars: { docUnit: f.unit ?? "", rowUnit: row.unit } });
      }
    }
  }
  if (next.status === "empty" && next !== entry) next = { ...next, status: "draft" };
  return { entry: next, notes, marks };
}

/** How the caller wants a month changed. The supplier flow holds the open
    month in an edit buffer, so it must not be written behind its back. */
export type MonthWriter = (month: string, update: (entry: MonthlyEntry) => MonthlyEntry) => void;

export function fileDoc(doc: IntakeDoc, uploadedBy: string, writeMonth: MonthWriter): { ok: boolean; message: string } {
  const v = verdictFor(doc);
  if (v.blocked) return { ok: false, message: v.blocked };
  if (v.notNeeded) return { ok: false, message: v.notNeeded };

  let key = v.target?.key;
  let fuelRowId: string | undefined;
  let label = v.target?.label ?? "";
  let addedRow: MonthlyEntry["fuels"][number] | undefined;

  if (!key && v.suggestion.addFuelRow && doc.month) {
    const def = fuelTypeDef(v.suggestion.addFuelRow);
    const row = applyEuStandard({ ...emptyFuel(), fuelType: v.suggestion.addFuelRow, unit: def?.typicalUnit ?? "m3" });
    addedRow = row;
    fuelRowId = row.id;
    writeMonth(doc.month, (e) => ({ ...e, fuels: [...e.fuels, row], status: e.status === "empty" ? "draft" : e.status }));
    key = `${doc.subject === "fuel_invoice" ? "fuel-invoice" : "fuel"}:${row.id}`;
    // The row may only exist in the supplier's edit buffer yet, so the label
    // is built here rather than looked up from the store.
    label = `${def?.label ?? "Fuel"} — ${doc.subject === "fuel_invoice" ? "fuel invoice / delivery note" : "consumption records"}`;
  } else if (key?.includes(":")) {
    fuelRowId = key.split(":")[1];
  }
  if (!key) return { ok: false, message: "No checklist row to file to." };

  /* Decided from the key's shape, not by looking the row up again: a fuel row
     added a moment ago may still sit in the supplier's edit buffer rather
     than the store, and a lookup would misfile March's gas invoice as annual. */
  const isMonthKey = !!doc.month && isMonthlyKey(key);
  const accepted = doc.fields.filter((f) => f.accepted);

  saveEvidence({
    id: uid(),
    workspaceId: doc.workspaceId,
    month: isMonthKey ? doc.month : undefined,
    boundTo: isMonthKey ? undefined : (doc.month ?? String(getWorkspace(doc.workspaceId)?.year ?? "")),
    fieldKeys: [key],
    sourceType: SOURCE_TYPE[doc.subject],
    fileName: doc.fileName,
    fileDataUrl: doc.fileDataUrl,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    capturedAt: new Date().toISOString(),
    uploadedBy,
    extraction: doc.detection
      ? {
          status: "done",
          fields: accepted,
          rawSummary: doc.detection.summary,
          extractedAt: new Date().toISOString(),
        }
      : undefined,
  });

  /* Notes come from a dry run against what the store holds (plus any row just
     added): the supplier's writer applies its update later, inside a React
     state update, so reading notes out of the real update would find none. */
  let notes: IntakeNote[] = [];
  if (doc.month && accepted.some((f) => f.key in WRITES_TO)) {
    const month = doc.month;
    const stored = getMonth(doc.workspaceId, month) ?? emptyMonth(doc.workspaceId, month);
    const preview = addedRow && !stored.fuels.some((x) => x.id === addedRow.id) ? { ...stored, fuels: [...stored.fuels, addedRow] } : stored;
    const elecRowId = uid();
    notes = applyFields(preview, doc, fuelRowId, elecRowId).notes;
    writeMonth(month, (e) => {
      const r = applyFields(e, doc, fuelRowId, elecRowId);
      for (const m of r.marks) markAiFilled(`ws:${doc.workspaceId}`, `${month}:${m.key}`, m.value, doc.fileName);
      return r.entry;
    });
  }

  const short = shortTargetLabel(doc.workspaceId, key, doc.month, addedRow?.fuelType ?? doc.fuelType);
  patchDoc(doc.workspaceId, doc.id, { status: "filed", filedTo: { key, label, month: isMonthKey ? doc.month : undefined, short }, notes });
  return { ok: true, message: short.fuelType ? label : short.text };
}

/** The default writer — straight to the store. The exporter's intake page has
    no edit buffer open, so this is safe there. */
export const storeMonthWriter =
  (workspaceId: string): MonthWriter =>
  (month, update) => {
    saveMonth(update(getMonth(workspaceId, month) ?? emptyMonth(workspaceId, month)));
  };
