import { accountStorage } from "./account-storage";
/** Document intake: read real PDF text, propose values, then file after review. */

import { readDocumentPages, readPdfPages } from "./document-reading";
import { documentDataUrl, storeDocumentFile } from "./document-files";
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
import {
  emptyFuel,
  emptyElectricitySource,
  applyEuStandard,
  fuelTypeDef,
  getMonth,
  emptyMonth,
  saveMonth,
  type MonthlyEntry,
} from "./monthly-data";
import { markAiFilled } from "./ai-fill";
import {
  getWorkspace,
  monthsOf,
  type VerificationWorkspace,
} from "./workspace";
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
export const needsFuel = (s: DocSubject): boolean =>
  s === "fuel_invoice" || s === "fuel_meter";

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
  periodConflict?: boolean;
};

const MONTHS_EN = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];
const MONTHS_TH = [
  "ม.ค",
  "ก.พ",
  "มี.ค",
  "เม.ย",
  "พ.ค",
  "มิ.ย",
  "ก.ค",
  "ส.ค",
  "ก.ย",
  "ต.ค",
  "พ.ย",
  "ธ.ค",
];

/** A month named in the file name, if any. Buddhist-era years are converted. */
export function monthFromName(
  name: string,
  fallbackYear: number,
): string | undefined {
  const lower = name.toLowerCase();
  const iso = /(20\d\d|25\d\d)[-_. ]?(0[1-9]|1[0-2])(?!\d)/.exec(lower);
  const toCe = (y: number) => (y > 2400 ? y - 543 : y);
  if (iso) return `${toCe(Number(iso[1]))}-${iso[2]}`;
  const yearMatch = /(20\d\d|25\d\d)/.exec(lower);
  const year = yearMatch ? toCe(Number(yearMatch[1])) : fallbackYear;
  const en = MONTHS_EN.findIndex((m) =>
    new RegExp(`(^|[^a-z])${m}`).test(lower),
  );
  if (en >= 0) return `${year}-${String(en + 1).padStart(2, "0")}`;
  const th = MONTHS_TH.findIndex((m) => name.includes(m));
  if (th >= 0) return `${year}-${String(th + 1).padStart(2, "0")}`;
  return undefined;
}

const NAME_RULES: { test: RegExp; subject: DocSubject; fuelType?: string }[] = [
  {
    test: /cbam|communication|emission.?sheet|embedded/,
    subject: "cbam_communication",
  },
  { test: /origin|\bcoo\b|form.?d|ถิ่นกำเนิด/, subject: "certificate_of_origin" },
  { test: /mill.?test|mtc|3\.1/, subject: "mill_test_certificate" },
  { test: /calib|สอบเทียบ/, subject: "calibration" },
  { test: /verif|ทวนสอบ/, subject: "precursor_verification" },
  { test: /carbon.?(tax|price)|ภาษีคาร์บอน/, subject: "carbon_price" },
  { test: /diagram|flow.?chart|แผนผัง/, subject: "installation_diagram" },
  { test: /\blab\b|ncv|analysis|วิเคราะห์/, subject: "lab_report" },
  { test: /diesel|ดีเซล/, subject: "fuel_invoice", fuelType: "diesel" },
  { test: /lpg/, subject: "fuel_invoice", fuelType: "lpg" },
  {
    test: /natural.?gas|ngv|ก๊าซธรรมชาติ/,
    subject: "fuel_invoice",
    fuelType: "natural_gas",
  },
  { test: /coal|ถ่านหิน/, subject: "fuel_invoice", fuelType: "bituminous_coal" },
  { test: /fuel|น้ำมัน|ptt/, subject: "fuel_invoice" },
  { test: /meter|มิเตอร์/, subject: "electricity_meter" },
  {
    test: /electric|ค่าไฟ|ไฟฟ้า|\bpea\b|\bmea\b|utility|power.?bill/,
    subject: "electricity_bill",
  },
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
      summary:
        "Nothing in the file name says what this is. Pick the document type below.",
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
    summary:
      "Guessed from the file name only. Nothing inside the file was read, so no values were proposed.",
    fields: [],
    via: "filename",
  };
}

/** Read content locally; filename guesses never supply quantities. */
export async function detect(
  file: File,
  bytes: ArrayBuffer,
  year: number,
): Promise<Detection> {
  const fallback = detectFromName(file.name, year);
  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    return {
      ...fallback,
      summary:
        "Image attached. Enter its values manually; automatic reading currently supports text PDFs.",
    };
  }
  try {
    const reading = readDocumentPages(await readPdfPages(bytes));
    return {
      subject:
        reading.subject === "unknown" ? fallback.subject : reading.subject,
      subjectConfidence:
        reading.subject === "unknown" ? fallback.subjectConfidence : 0.9,
      month: reading.month,
      monthConfidence: reading.month ? 0.95 : 0,
      fuelType: reading.fuelType ?? fallback.fuelType,
      summary: reading.summary,
      fields: reading.fields.map((f) => ({ ...f, accepted: true })),
      via: "document",
      periodConflict: reading.periodConflict,
    };
  } catch (error) {
    console.warn("[document-reading] PDF extraction unavailable", error);
    return {
      ...fallback,
      fields: [],
      summary:
        "This PDF could not be read. Check that it is unlocked and has readable text, or enter values manually. The file is still attached.",
    };
  }
}

/* ── Where a document files to ────────────────────────────────── */
export type Target = RequiredKey & { scope: "month" | "annual" };

type WorkspaceScope = {
  workspace: VerificationWorkspace;
  requiresIndirect: boolean;
};

function scopeOf(workspaceId: string): WorkspaceScope | null {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) return null;
  return {
    workspace,
    requiresIndirect: workspaceRequiresIndirectEmissions(workspace.productId),
  };
}

/** Every row a document could file to, for the month picked (if any) plus the
    year. Conditional annual rows are offered even when not yet triggered —
    the reader may be holding the document that proves they apply. */
export function targetsFor(
  workspaceId: string,
  month: string | undefined,
): Target[] {
  const s = scopeOf(workspaceId);
  if (!s) return [];
  const out: Target[] = [];
  if (month) {
    const entry =
      getMonth(workspaceId, month) ?? emptyMonth(workspaceId, month);
    for (const k of requiredKeysForMonth(entry, true))
      out.push({ ...k, scope: "month" });
  }
  const scope = annualScopeFor(
    workspaceId,
    s.workspace.periodStart,
    s.workspace.periodEnd,
    getCarbonPrice(workspaceId).amountPerTonne > 0,
  );
  const annual = annualRequiredKeys({
    ...scope,
    hasPurchasedPrecursors: true,
    carbonPricePaid: true,
    usesLabAnalysis: true,
  });
  for (const k of annual)
    if (!out.some((o) => o.key === k.key)) out.push({ ...k, scope: "annual" });
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

export function shortTargetLabel(
  workspaceId: string,
  key: string,
  month: string | undefined,
  fallbackFuelType?: string,
): ShortLabel {
  const [prefix, rowId] = key.split(":");
  if (rowId) {
    const fuelType =
      (month
        ? getMonth(workspaceId, month)?.fuels.find((f) => f.id === rowId)
            ?.fuelType
        : undefined) || fallbackFuelType;
    const text =
      prefix === "fuel-invoice"
        ? "{fuel} — invoice"
        : prefix === "biomass"
          ? "{fuel} — biomass sustainability documents"
          : "{fuel} — consumption records";
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

export function suggestTarget(
  workspaceId: string,
  subject: DocSubject,
  month: string | undefined,
  fuelType: string | undefined,
): Suggestion {
  const s = scopeOf(workspaceId);
  if (!s) return { problem: "Workspace not found." };
  if (subject === "unrelated")
    return {
      notNeeded: "This does not look like anything a CBAM verifier asks for.",
    };
  if (subject === "unknown")
    return { problem: "Pick what this document is first." };
  // Supplier-portal documents: the workspace checklist has no row for them.
  if (subject === "cbam_communication" || subject === "certificate_of_origin") {
    return {
      notNeeded:
        "This document belongs to a supplier's data request, not to this workspace's checklist.",
    };
  }
  const monthly =
    subject === "electricity_bill" ||
    subject === "electricity_meter" ||
    subject === "production" ||
    needsFuel(subject);
  if (monthly && !month)
    return { problem: "Pick which month this document covers." };
  if (month && !monthsOf(s.workspace).includes(month)) {
    return {
      problem: `The month is outside this workspace's reporting year (${s.workspace.year}).`,
    };
  }
  if (needsFuel(subject)) {
    if (!fuelType) return { problem: "Pick which fuel this is for." };
    const entry =
      getMonth(workspaceId, month!) ?? emptyMonth(workspaceId, month!);
    const row = entry.fuels.find((f) => f.fuelType === fuelType);
    if (!row) return { addFuelRow: fuelType };
    return {
      key: `${subject === "fuel_invoice" ? "fuel-invoice" : "fuel"}:${row.id}`,
    };
  }
  return { key: FIXED_KEY[subject] };
}

/* Queue metadata survives navigation/reload in localStorage; originals live in
   IndexedDB and are hydrated only in the browser. */
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
  localFileId?: string;
  overwriteConfirmed?: boolean;
  electricitySourceId?: string;
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

export function intakeQueue(workspaceId: string): IntakeDoc[] {
  if (queues.has(workspaceId)) return queues.get(workspaceId)!;
  if (typeof window === "undefined") return EMPTY;
  try {
    const restored = JSON.parse(
      accountStorage.getItem(`certrace:intake:${workspaceId}`) ?? "[]",
    ) as IntakeDoc[];
    if (!Array.isArray(restored)) return EMPTY;
    const rows = restored.map((d) =>
      d.status === "reading" ? { ...d, status: "review" as const } : d,
    );
    queues.set(workspaceId, rows);
    for (const doc of rows)
      if (doc.localFileId && !doc.fileDataUrl) {
        void documentDataUrl(doc.localFileId)
          .then((url) => {
            if (url) patchDoc(workspaceId, doc.id, { fileDataUrl: url });
          })
          .catch(() => {});
      }
    return rows;
  } catch {
    queues.set(workspaceId, EMPTY);
    return EMPTY;
  }
}

function setQueue(workspaceId: string, next: IntakeDoc[]) {
  queues.set(workspaceId, next);
  try {
    accountStorage.setItem(
      `certrace:intake:${workspaceId}`,
      JSON.stringify(next.map((doc) => ({ ...doc, fileDataUrl: undefined }))),
    );
  } catch {
    /* Originals remain in IndexedDB. */
  }
  emit();
}

export function patchDoc(
  workspaceId: string,
  id: string,
  patch: Partial<IntakeDoc>,
) {
  setQueue(
    workspaceId,
    intakeQueue(workspaceId).map((d) => (d.id === id ? { ...d, ...patch } : d)),
  );
}

export const clearFinished = (workspaceId: string) =>
  setQueue(
    workspaceId,
    intakeQueue(workspaceId).filter(
      (d) => d.status === "reading" || d.status === "review",
    ),
  );

async function sha256(bytes: ArrayBuffer): Promise<string | undefined> {
  try {
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return undefined;
  }
}

const toDataUrl = (bytes: ArrayBuffer, mime: string): string => {
  let bin = "";
  const view = new Uint8Array(bytes);
  for (let i = 0; i < view.length; i += 0x8000)
    bin += String.fromCharCode(...view.subarray(i, i + 0x8000));
  return `data:${mime || "application/octet-stream"};base64,${btoa(bin)}`;
};

/** Add files to the pile and start reading each one. */
export async function addFiles(
  workspaceId: string,
  files: File[],
  onQueued?: (ids: string[]) => void,
  defaultMonth?: string,
): Promise<void> {
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

  const filedNames = new Set(
    listEvidence(workspaceId).map((e) => `${e.fileName}|${e.sizeBytes ?? ""}`),
  );

  await Promise.all(
    files.map(async (file, i) => {
      const doc = fresh[i];
      try {
        if (file.size > 15 * 1024 * 1024)
          throw new Error(
            "Please upload a file smaller than 15 MB, or split it into relevant pages.",
          );
        const bytes = await file.arrayBuffer();
        const hash = await sha256(bytes);
        const earlier = hash
          ? intakeQueue(workspaceId).find(
              (d) =>
                d.id !== doc.id && d.hash === hash && d.status !== "discarded",
            )
          : undefined;
        const duplicateOf =
          earlier?.fileName ??
          (hash
            ? listEvidence(workspaceId).find((e) => e.fileHash === hash)
                ?.fileName
            : undefined) ??
          (filedNames.has(`${file.name}|${file.size}`)
            ? `${file.name} (already filed)`
            : undefined);
        patchDoc(workspaceId, doc.id, { hash, duplicateOf });
        await storeDocumentFile(doc.id, file);
        patchDoc(workspaceId, doc.id, {
          hash,
          localFileId: doc.id,
          fileDataUrl: toDataUrl(bytes, file.type),
          duplicateOf,
        });
        const detection = await detect(file, bytes, year);
        patchDoc(workspaceId, doc.id, {
          status: "review",
          detection,
          subject: detection.subject,
          month: detection.month ?? defaultMonth,
          fuelType: detection.fuelType,
          fields: detection.fields,
        });
      } catch (error) {
        patchDoc(workspaceId, doc.id, {
          status: "review",
          detection: {
            subject: "unknown",
            subjectConfidence: 0,
            monthConfidence: 0,
            via: "none",
            fields: [],
            summary:
              error instanceof Error
                ? error.message
                : "Upload failed. Please try again.",
          },
        });
      }
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
  const suggestion = suggestTarget(
    doc.workspaceId,
    doc.subject,
    doc.month,
    doc.fuelType,
  );
  const key = doc.targetOverride ?? suggestion.key;
  const target = key
    ? targetsFor(doc.workspaceId, doc.month).find((t) => t.key === key)
    : undefined;
  const d = doc.detection;
  // A row picked by hand overrides "not needed" — the reader knows something
  // the product rules don't.
  const notNeeded =
    doc.status === "review" && !target && suggestion.notNeeded
      ? suggestion.notNeeded
      : null;
  const targetBlocked =
    doc.status !== "review" || notNeeded
      ? null
      : target || suggestion.addFuelRow
        ? null
        : (suggestion.problem ?? "Pick a checklist row for this document.");
  const blocked = doc.duplicateOf
    ? "This file is already in the workspace. Use the existing document or set this copy aside."
    : !doc.fileDataUrl
      ? (doc.detection?.summary ??
        "Upload the file again; its contents are unavailable.")
      : doc.month &&
          suggestion.addFuelRow &&
          ["submitted", "reviewed"].includes(
            getMonth(doc.workspaceId, doc.month)?.status ?? "",
          )
        ? "Reopen this month before adding a fuel source."
        : (fillProblem(doc) ?? targetBlocked);
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
  "fuel-delivered": "Fuel received (not consumed)",
};

const num = (v: string) => Number(String(v).replace(/[,\s]/g, ""));

function normalizedValue(f: ExtractedField): number | null {
  if (!f.value.trim()) return null;
  const n = num(f.value);
  if (!Number.isFinite(n) || n < 0) return null;
  const unit = f.unit?.toLowerCase();
  if (f.key === "electricity-consumed")
    return unit === "kwh" ? n / 1000 : unit === "mwh" ? n : null;
  if (f.key === "production-tonnes")
    return unit === "kg" ? n / 1000 : unit === "t" ? n : null;
  return n;
}

export function previousFieldValue(
  doc: IntakeDoc,
  key: string,
): number | undefined {
  if (!doc.month) return;
  const entry = getMonth(doc.workspaceId, doc.month);
  if (!entry) return;
  if (key === "production-tonnes") return entry.productionTonnes;
  if (key === "electricity-consumed")
    return (
      entry.electricitySources?.find((s) =>
        doc.electricitySourceId
          ? s.id === doc.electricitySourceId
          : entry.electricitySources?.length === 1,
      )?.mwh ??
      (!entry.electricitySources?.length ? entry.electricityMwh : undefined)
    );
  const row = entry.fuels.find((f) =>
    doc.targetOverride?.includes(":")
      ? f.id === doc.targetOverride.split(":")[1]
      : f.fuelType === doc.fuelType,
  );
  return key === "fuel-delivered" ? row?.deliveredQuantity : row?.quantity;
}

export function fillProblem(doc: IntakeDoc): string | null {
  const selected = doc.fields.filter((f) => f.accepted && f.key in WRITES_TO);
  if (!selected.length) return null;
  if (!doc.month) return "Choose the month these values cover.";
  const workspace = getWorkspace(doc.workspaceId);
  if (
    !workspace ||
    doc.month < workspace.periodStart.slice(0, 7) ||
    doc.month > workspace.periodEnd.slice(0, 7)
  )
    return "Choose a month inside this workspace’s reporting period.";
  if (doc.detection?.periodConflict)
    return "This total covers multiple months. Untick its values to keep the file as evidence, then use monthly readings.";
  if (doc.detection?.month && doc.detection.month !== doc.month)
    return `The readings cover ${doc.detection.month}. Choose that month, or untick the values to keep evidence only.`;
  const entry = getMonth(doc.workspaceId, doc.month);
  if (entry && (entry.status === "submitted" || entry.status === "reviewed"))
    return "This month is submitted. Reopen it in Monthly data before changing values.";
  for (const field of selected) {
    const target = doc.targetOverride;
    const expected =
      field.key === "production-tonnes"
        ? ["production"]
        : field.key === "electricity-consumed"
          ? ["utility-invoice", "electricity-consumed"]
          : [];
    if (target && expected.length && !expected.includes(target))
      return "Match the document to the evidence row for the value being filled.";
    if (
      target &&
      field.key.startsWith("fuel-") &&
      !target.startsWith(
        field.key === "fuel-delivered" ? "fuel-invoice:" : "fuel:",
      )
    )
      return "Choose the corresponding fuel evidence row.";
    const value = normalizedValue(field);
    if (value == null)
      return "Check the quantity and unit. Electricity uses kWh/MWh and production uses kg/t.";
    if (
      field.key === "electricity-consumed" &&
      !["electricity_bill", "electricity_meter"].includes(doc.subject)
    )
      return "Electricity values must be matched to an electricity document.";
    if (field.key === "production-tonnes" && doc.subject !== "production")
      return "Match production output to a production record.";
    if (field.key === "fuel-quantity" && doc.subject !== "fuel_meter")
      return "A fuel delivery is not consumption. Untick the consumed quantity or choose a consumption record.";
    if (field.key === "fuel-delivered" && doc.subject !== "fuel_invoice")
      return "Match fuel deliveries to a fuel invoice or delivery note.";
    if (
      field.key === "electricity-consumed" &&
      (entry?.electricitySources?.length ?? 0) > 1 &&
      !entry?.electricitySources?.some((s) => s.id === doc.electricitySourceId)
    )
      return "Choose which electricity source this reading belongs to.";
    if (field.key.startsWith("fuel-")) {
      const rows =
        entry?.fuels.filter((f) => f.fuelType === doc.fuelType) ?? [];
      if (rows.length > 1 && !doc.targetOverride)
        return "Choose the fuel row this document belongs to.";
      const row = rows.find(
        (f) => !doc.targetOverride || f.id === doc.targetOverride.split(":")[1],
      );
      if (doc.targetOverride && !row)
        return "Choose a row for the same fuel as the document.";
      const unit = row?.unit ?? fuelTypeDef(doc.fuelType ?? "")?.typicalUnit;
      if (field.unit?.toLowerCase() !== unit?.toLowerCase())
        return `The fuel row uses ${unit ?? "an unknown unit"}. Convert the document quantity to that unit before accepting.`;
    }
    const previous = previousFieldValue(doc, field.key);
    if (
      previous != null &&
      previous !== 0 &&
      previous !== value &&
      !doc.overwriteConfirmed
    )
      return "A value is already entered. Review it and confirm replacement below.";
  }
  return null;
}

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
        const idx = doc.electricitySourceId
          ? next.electricitySources.findIndex(
              (s) => s.id === doc.electricitySourceId,
            )
          : 0;
        const rowId = next.electricitySources[idx].id;
        next = {
          ...next,
          electricitySources: next.electricitySources.map((s, i) =>
            i === idx ? { ...s, mwh } : s,
          ),
        };
        marks.push({ key: `elec:${rowId}`, value: mwh });
      } else {
        next = {
          ...next,
          electricitySources: [
            { ...emptyElectricitySource(), id: elecRowId, mwh },
          ],
        };
        marks.push({ key: `elec:${elecRowId}`, value: mwh });
      }
      notes.push(
        unit === "kwh"
          ? {
              text: "Electricity: {kwh} kWh → {mwh} MWh",
              vars: { kwh: fmtNum(n), mwh: fmtNum(mwh) },
            }
          : { text: "Electricity: {mwh} MWh", vars: { mwh: fmtNum(mwh) } },
      );
    }
    if (f.key === "production-tonnes" && Number.isFinite(n)) {
      const t = unit === "kg" ? n / 1000 : n;
      next = { ...next, productionTonnes: t };
      marks.push({ key: "production", value: t });
      notes.push({ text: "Production: {t} t", vars: { t: fmtNum(t) } });
    }
    if (
      (f.key === "fuel-quantity" || f.key === "fuel-delivered") &&
      Number.isFinite(n) &&
      fuelRowId
    ) {
      const row = next.fuels.find((x) => x.id === fuelRowId);
      const u = f.unit === "L" ? "l" : f.unit;
      if (row && u?.toLowerCase() === row.unit.toLowerCase()) {
        next = {
          ...next,
          fuels: next.fuels.map((x) =>
            x.id === fuelRowId
              ? {
                  ...x,
                  ...(f.key === "fuel-delivered"
                    ? { deliveredQuantity: n }
                    : { quantity: n }),
                }
              : x,
          ),
        };
        marks.push({
          key: `fuel:${fuelRowId}${f.key === "fuel-delivered" ? ":received" : ""}`,
          value: n,
        });
        notes.push({
          text: "Fuel quantity: {qty} {unit}",
          vars: { qty: fmtNum(n), unit: row.unit },
        });
      } else if (row) {
        notes.push({
          text: "Fuel quantity not written — the document says {docUnit}, the row is in {rowUnit}",
          vars: { docUnit: f.unit ?? "", rowUnit: row.unit },
        });
      }
    }
  }
  if (next.status === "empty" && next !== entry)
    next = { ...next, status: "draft" };
  return { entry: next, notes, marks };
}

/** How the caller wants a month changed. The supplier flow holds the open
    month in an edit buffer, so it must not be written behind its back. */
export type MonthWriter = (
  month: string,
  update: (entry: MonthlyEntry) => MonthlyEntry,
) => void;

export function fileDoc(
  doc: IntakeDoc,
  uploadedBy: string,
  writeMonth: MonthWriter,
): { ok: boolean; message: string } {
  const v = verdictFor(doc);
  if (v.blocked) return { ok: false, message: v.blocked };
  if (v.notNeeded) return { ok: false, message: v.notNeeded };

  let key = v.target?.key;
  let fuelRowId: string | undefined;
  let label = v.target?.label ?? "";
  let addedRow: MonthlyEntry["fuels"][number] | undefined;

  if (!key && v.suggestion.addFuelRow && doc.month) {
    const def = fuelTypeDef(v.suggestion.addFuelRow);
    const row = applyEuStandard({
      ...emptyFuel(),
      fuelType: v.suggestion.addFuelRow,
      unit: def?.typicalUnit ?? "m3",
    });
    addedRow = row;
    fuelRowId = row.id;
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

  const saved = saveEvidence({
    id: uid(),
    workspaceId: doc.workspaceId,
    month: isMonthKey ? doc.month : undefined,
    boundTo: isMonthKey
      ? undefined
      : (doc.month ?? String(getWorkspace(doc.workspaceId)?.year ?? "")),
    fieldKeys: [key],
    sourceType: SOURCE_TYPE[doc.subject],
    fileName: doc.fileName,
    fileDataUrl:
      doc.sizeBytes <= INLINE_BYTES_LIMIT ? doc.fileDataUrl : undefined,
    localFileId: doc.localFileId,
    fileHash: doc.hash,
    reviewedBy: uploadedBy,
    reviewedAt: new Date().toISOString(),
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
  if (!saved.stored)
    return {
      ok: false,
      message:
        "The document could not be saved. Free browser storage and retry; no values were filled.",
    };

  if (addedRow && doc.month) {
    const row = addedRow;
    writeMonth(doc.month, (e) => ({
      ...e,
      fuels: [...e.fuels, row],
      status: e.status === "empty" ? "draft" : e.status,
    }));
  }

  /* Notes come from a dry run against what the store holds (plus any row just
     added): the supplier's writer applies its update later, inside a React
     state update, so reading notes out of the real update would find none. */
  let notes: IntakeNote[] = [];
  if (doc.month && accepted.some((f) => f.key in WRITES_TO)) {
    const month = doc.month;
    const stored =
      getMonth(doc.workspaceId, month) ?? emptyMonth(doc.workspaceId, month);
    const preview =
      addedRow && !stored.fuels.some((x) => x.id === addedRow.id)
        ? { ...stored, fuels: [...stored.fuels, addedRow] }
        : stored;
    const elecRowId = uid();
    notes = applyFields(preview, doc, fuelRowId, elecRowId).notes;
    writeMonth(month, (e) => {
      const r = applyFields(e, doc, fuelRowId, elecRowId);
      for (const m of r.marks)
        markAiFilled(
          `ws:${doc.workspaceId}`,
          `${month}:${m.key}`,
          m.value,
          doc.fileName,
        );
      return r.entry;
    });
  }

  const short = shortTargetLabel(
    doc.workspaceId,
    key,
    doc.month,
    addedRow?.fuelType ?? doc.fuelType,
  );
  patchDoc(doc.workspaceId, doc.id, {
    status: "filed",
    filedTo: { key, label, month: isMonthKey ? doc.month : undefined, short },
    notes,
  });
  return { ok: true, message: short.fuelType ? label : short.text };
}

/** The default writer — straight to the store. The exporter's intake page has
    no edit buffer open, so this is safe there. */
export const storeMonthWriter =
  (workspaceId: string): MonthWriter =>
  (month, update) => {
    saveMonth(
      update(getMonth(workspaceId, month) ?? emptyMonth(workspaceId, month)),
    );
  };
