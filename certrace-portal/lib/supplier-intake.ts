/* ════════════════════════════════════════════════════════════
   SUPPLIER-PORTAL SMART INTAKE

   The same "drop the documents first" idea as lib/smart-intake.ts, for the
   Supplier Portal (/s/<token> and /self/<token>). What differs is where a
   document lands: not a workspace checklist, but the short list the exporter
   asked this supplier for (`req.documents` — CBAM communication sheet, mill
   test certificate, certificate of origin, verification statement).

   Detection is the SAME mock (`detect()` in lib/smart-intake.ts), so the
   sample PDFs, confidence floor and filename guesses behave identically.
   Filing goes through the portal's own `uploadFiles`, so the trail event, the
   inline-bytes cap and the revision locks all apply exactly as they do to a
   file attached by hand. Extracted values are shown as context only — this
   version does not write them into the questionnaire.
   ════════════════════════════════════════════════════════════ */

import {
  CONFIDENCE_FLOOR,
  uid,
  type ExtractedField,
} from "./workspace-evidence";
import { detect, type Detection, type DocSubject } from "./smart-intake";
import {
  isOnceField,
  valueKey,
  type RequestDocAsk,
  type SupplierRequest,
} from "./supplier";
import { markAiFilled } from "./ai-fill";

/** Which requested document a detected subject answers. */
const DOC_ID_FOR: Partial<Record<DocSubject, string>> = {
  cbam_communication: "cbam-sheet",
  mill_test_certificate: "mtc",
  certificate_of_origin: "coo",
  precursor_verification: "verif",
};

export type SupplierIntakeStatus = "reading" | "review" | "filed" | "discarded";

export type SupplierIntakeDoc = {
  id: string;
  token: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  hash?: string;
  /** kept only for the in-page preview; filing uploads the original File */
  fileDataUrl?: string;
  status: SupplierIntakeStatus;
  detection?: Detection;
  subject: DocSubject;
  /** a requested document picked by hand, overriding the suggestion */
  targetOverride?: string;
  fields: ExtractedField[];
  duplicateOf?: string;
  filedTo?: { docId: string; label: string };
  notNeededReason?: string;
};

/* ── The queue: in memory, per request token ───────────────────── */
const queues = new Map<string, SupplierIntakeDoc[]>();
/* The File objects themselves — uploadFiles needs a real File, and a File
   cannot live in the queue records without surviving them. */
const originals = new Map<string, File>();
const listeners = new Set<() => void>();
const EMPTY: SupplierIntakeDoc[] = [];

const emit = () => listeners.forEach((l) => l());

export const subscribeSupplierIntake = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const supplierIntakeQueue = (token: string): SupplierIntakeDoc[] =>
  queues.get(token) ?? EMPTY;

function setQueue(token: string, next: SupplierIntakeDoc[]) {
  queues.set(token, next);
  emit();
}

export function patchSupplierDoc(
  token: string,
  id: string,
  patch: Partial<SupplierIntakeDoc>,
) {
  setQueue(
    token,
    supplierIntakeQueue(token).map((d) =>
      d.id === id ? { ...d, ...patch } : d,
    ),
  );
}

export const clearFinishedSupplierDocs = (token: string) =>
  setQueue(
    token,
    supplierIntakeQueue(token).filter(
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

const PREVIEW_BYTES_LIMIT = 1_500_000;

const toDataUrl = (bytes: ArrayBuffer, mime: string): string => {
  let bin = "";
  const view = new Uint8Array(bytes);
  for (let i = 0; i < view.length; i += 0x8000)
    bin += String.fromCharCode(...view.subarray(i, i + 0x8000));
  return `data:${mime || "application/octet-stream"};base64,${btoa(bin)}`;
};

/** Add files and start reading each one. `alreadyAttached` is the set of
    "name|size" already on the request, for the duplicate warning. */
export async function addSupplierFiles(
  token: string,
  files: File[],
  year: number,
  alreadyAttached: Set<string>,
  onQueued?: (ids: string[]) => void,
): Promise<void> {
  const fresh: SupplierIntakeDoc[] = files.map((f) => ({
    id: uid(),
    token,
    fileName: f.name,
    mimeType: f.type,
    sizeBytes: f.size,
    status: "reading",
    subject: "unknown",
    fields: [],
  }));
  fresh.forEach((d, i) => originals.set(d.id, files[i]));
  setQueue(token, [...fresh, ...supplierIntakeQueue(token)]);
  onQueued?.(fresh.map((d) => d.id));

  await Promise.all(
    files.map(async (file, i) => {
      const doc = fresh[i];
      const bytes = await file.arrayBuffer();
      const hash = await sha256(bytes);
      const earlier = supplierIntakeQueue(token).find(
        (d) =>
          d.id !== doc.id &&
          d.hash &&
          d.hash === hash &&
          d.status !== "discarded",
      );
      const duplicateOf =
        earlier?.fileName ??
        (alreadyAttached.has(`${file.name}|${file.size}`)
          ? `${file.name} (already attached)`
          : undefined);
      const detection = await detect(file, bytes, year);
      patchSupplierDoc(token, doc.id, {
        hash,
        fileDataUrl:
          file.size <= PREVIEW_BYTES_LIMIT
            ? toDataUrl(bytes, file.type)
            : undefined,
        status: "review",
        detection,
        subject: detection.subject,
        fields: detection.fields,
        duplicateOf,
      });
    }),
  );
}

/* ── Where it goes, and whether it is ready ────────────────────── */
export type SupplierVerdict = {
  target?: RequestDocAsk;
  /** the suggested requested document, before any override */
  suggestedId?: string;
  confident: boolean;
  blocked: string | null;
  notNeeded: string | null;
};

export function supplierVerdict(
  doc: SupplierIntakeDoc,
  requested: RequestDocAsk[],
  isEditable: (docId: string) => boolean,
): SupplierVerdict {
  const suggestedId = DOC_ID_FOR[doc.subject];
  const suggested = suggestedId
    ? requested.find((r) => r.id === suggestedId)
    : undefined;
  const target = doc.targetOverride
    ? requested.find((r) => r.id === doc.targetOverride)
    : suggested;

  let notNeeded: string | null = null;
  let blocked: string | null = null;
  if (doc.status === "review") {
    if (!target) {
      if (doc.subject === "unknown")
        blocked = "Pick what this document is first.";
      else
        notNeeded =
          "{exporter} did not ask for this document. Pick a requested document above if it belongs to one.";
    } else if (!isEditable(target.id)) {
      blocked = "Locked — not part of this revision.";
    }
  }

  const d = doc.detection;
  const confident =
    !blocked &&
    !notNeeded &&
    !!target &&
    !doc.duplicateOf &&
    !!d &&
    d.via === "document" &&
    !doc.targetOverride &&
    d.subjectConfidence >= CONFIDENCE_FLOOR &&
    doc.fields.every((f) => f.confidence >= CONFIDENCE_FLOOR);

  return { target, suggestedId: suggested?.id, confident, blocked, notNeeded };
}

/* ── Values a document fills into the questionnaire ────────────────
   Only the CBAM communication sheet carries figures the questionnaire asks
   for directly. Per-good fields go to the good whose CN code matches the
   sheet (or the only good on the request); with no match they are left for
   the supplier to type, never guessed onto the wrong product. */
const WRITES_FROM_CBAM_SHEET = ["direct-emissions", "indirect-emissions"];

export type QuestionnaireWrite = {
  fieldId: string;
  productId?: string;
  label: string;
  productName?: string;
  value: string;
  unit?: string;
  confidence: number;
  accepted: boolean;
  /** what the box holds now, so a replacement can be shown as one */
  current: string;
};

const digitsOf = (s: string) => s.replace(/\D/g, "");

export function questionnaireWritesFor(
  doc: SupplierIntakeDoc,
  req: SupplierRequest,
  getValue: (fieldId: string, productId?: string) => string,
): QuestionnaireWrite[] {
  if (doc.subject !== "cbam_communication") return [];
  const cn = digitsOf(doc.fields.find((f) => f.key === "cn-code")?.value ?? "");
  const byCn = cn
    ? req.products.find((p) => {
        const pc = digitsOf(p.product.cnCode);
        return pc.startsWith(cn) || cn.startsWith(pc);
      })
    : undefined;
  const product =
    byCn ?? (req.products.length === 1 ? req.products[0] : undefined);

  const out: QuestionnaireWrite[] = [];
  for (const key of WRITES_FROM_CBAM_SHEET) {
    const f = doc.fields.find((x) => x.key === key);
    const field = req.fields.find((x) => x.id === key);
    if (!f || !field) continue;
    const once = isOnceField(field.group);
    if (!once && !product) continue;
    const productId = once ? undefined : product!.product.id;
    out.push({
      fieldId: key,
      productId,
      label: field.label,
      productName: once ? undefined : product!.product.name,
      value: f.value,
      unit: f.unit,
      confidence: f.confidence,
      accepted: f.accepted,
      current: getValue(key, productId),
    });
  }
  return out;
}

export type QuestionnaireAccess = {
  req: SupplierRequest;
  getValue: (fieldId: string, productId?: string) => string;
  setValue: (
    fieldId: string,
    productId: string | undefined,
    value: string,
  ) => void;
  isEditable: (key: string) => boolean;
};

/** Attach the original file to the requested document through the portal's
    own upload path, then fill the questionnaire values the reader kept.
    Resolves with the refusal reason, if there was one. */
export async function fileSupplierDoc(
  doc: SupplierIntakeDoc,
  verdict: SupplierVerdict,
  uploadFiles: (
    docId: string,
    files: File[],
  ) => Promise<{ name: string; reason: string }[]>,
  questionnaire?: QuestionnaireAccess,
): Promise<{ ok: boolean; message: string; written: number }> {
  if (verdict.blocked)
    return { ok: false, message: verdict.blocked, written: 0 };
  if (verdict.notNeeded || !verdict.target)
    return {
      ok: false,
      message: verdict.notNeeded ?? "Pick a requested document for this file.",
      written: 0,
    };
  const file = originals.get(doc.id);
  if (!file)
    return {
      ok: false,
      message: "The file is no longer in this page. Drop it again.",
      written: 0,
    };

  const refused = await uploadFiles(verdict.target.id, [file]);
  if (refused.length > 0)
    return { ok: false, message: refused[0].reason, written: 0 };

  let written = 0;
  if (questionnaire) {
    for (const w of questionnaireWritesFor(
      doc,
      questionnaire.req,
      questionnaire.getValue,
    )) {
      const key = valueKey(w.fieldId, w.productId);
      if (!w.accepted || !questionnaire.isEditable(key)) continue;
      questionnaire.setValue(w.fieldId, w.productId, w.value);
      markAiFilled(`sup:${doc.token}`, key, w.value, doc.fileName);
      written += 1;
    }
  }

  patchSupplierDoc(doc.token, doc.id, {
    status: "filed",
    filedTo: { docId: verdict.target.id, label: verdict.target.label },
  });
  return { ok: true, message: verdict.target.label, written };
}
