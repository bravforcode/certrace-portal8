/* ════════════════════════════════════════════════════════════
   EVIDENCE AT DATA-POINT LEVEL (gap G7)

   Evidence used to attach to a declaration: a folder of PDFs beside a filing.
   That is not how verification works. A verifier picks ONE NUMBER — the gas
   consumption for August, the grid factor, the electrode mass — and asks to
   see the document behind THAT. A folder means somebody spends the afternoon
   hunting, and the finding gets written up as "traceability not demonstrated"
   whether or not the invoice existed.

   So evidence binds to the data point. `Provenance.evidenceFileId` already
   carried the field; this module gives it something to point at, and adds the
   two views that make the binding useful:

     COVERAGE   — which inputs still have no document (validation V10). The
                  question an exporter should be able to answer before they
                  call a verifier, not after.
     REVERSE    — open one file and see every figure that depends on it. This
                  is what makes a superseded document safe to replace: you can
                  see what moves.

   Files carry a content hash so a document swapped after sign-off is
   detectable. Frontend-only MVP: bytes live in localStorage as data URLs for
   small files (same constraint and same reasoning as lib/supplier-store.ts);
   anything larger keeps name, size and hash only.
   ════════════════════════════════════════════════════════════ */

export type EvidenceCategory =
  | "utility_bill"
  | "fuel_receipt"
  | "meter_log"
  | "production_log"
  | "carbon_price"
  | "supplier_attestation"
  | "lab_report"
  | "diagram"
  | "other";

export const EVIDENCE_CATEGORIES: EvidenceCategory[] = [
  "utility_bill",
  "fuel_receipt",
  "meter_log",
  "production_log",
  "carbon_price",
  "supplier_attestation",
  "lab_report",
  "diagram",
  "other",
];

export const EVIDENCE_CATEGORY_LABEL: Record<EvidenceCategory, string> = {
  utility_bill: "Utility bills",
  fuel_receipt: "Fuel receipts & invoices",
  meter_log: "Meter logs",
  production_log: "Production logs",
  carbon_price: "Carbon price evidence",
  supplier_attestation: "Supplier attestations",
  lab_report: "Laboratory reports",
  diagram: "Installation diagrams",
  other: "Other",
};

export type EvidenceFile = {
  id: string;
  declarationId: string;
  name: string;
  type: EvidenceCategory;
  /** MIME type, when the browser gave us one */
  mime?: string;
  sizeBytes: number;
  uploadedBy: string;
  /** ISO timestamp */
  uploadedAt: string;
  /** the window the document covers, so a verifier can see the year is complete */
  periodCovered?: { start: string; end: string };
  /** sha-256 of the contents. A document swapped after sign-off changes this. */
  hash?: string;
  /** data URL for small files — the difference between holding evidence and
      holding a filename */
  dataUrl?: string;
};

const KEY = "certrace:evidence";

/** Above this, only the metadata and hash are kept — a 5 MB scan in
    localStorage takes the whole store down with it. */
export const INLINE_BYTES_LIMIT = 1_500_000;

type Store = Record<string, EvidenceFile[]>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function write(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore quota */
  }
}

export const listEvidence = (declarationId: string): EvidenceFile[] =>
  (read()[declarationId] ?? []).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

export const getEvidence = (declarationId: string, id: string): EvidenceFile | null =>
  listEvidence(declarationId).find((f) => f.id === id) ?? null;

export function addEvidence(file: EvidenceFile): EvidenceFile[] {
  const store = read();
  store[file.declarationId] = [...(store[file.declarationId] ?? []), file];
  write(store);
  return store[file.declarationId];
}

export function removeEvidence(declarationId: string, id: string): EvidenceFile[] {
  const store = read();
  store[declarationId] = (store[declarationId] ?? []).filter((f) => f.id !== id);
  write(store);
  return store[declarationId];
}

export const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? `ev-${crypto.randomUUID().slice(0, 10)}` : `ev-${Date.now().toString(36)}`;

/** sha-256 of the file bytes, so a swapped document is detectable. Returns
    undefined where WebCrypto is unavailable rather than inventing a digest. */
export async function hashBytes(buffer: ArrayBuffer): Promise<string | undefined> {
  try {
    if (typeof crypto === "undefined" || !crypto.subtle) return undefined;
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return undefined;
  }
}

/* ── Coverage (validation V10) ──────────────────────────────────
   `required` here means "an input a filed figure depends on". Those need a
   document. Nice-to-haves do not, and treating them the same would turn the
   coverage number into noise nobody acts on. */
export type CoverageRow = {
  key: string;
  label: string;
  category: EvidenceCategory;
  required: boolean;
  evidenceFileId: string | null;
  fileName: string | null;
};

export type Coverage = {
  rows: CoverageRow[];
  requiredTotal: number;
  requiredCovered: number;
  /** 0..1 across required inputs only */
  pct: number;
  missing: CoverageRow[];
};

export function coverage(rows: Omit<CoverageRow, "fileName">[], files: EvidenceFile[]): Coverage {
  const byId = new Map(files.map((f) => [f.id, f]));
  const full: CoverageRow[] = rows.map((r) => ({ ...r, fileName: r.evidenceFileId ? (byId.get(r.evidenceFileId)?.name ?? null) : null }));
  // A pointer to a file that has since been deleted is NOT coverage.
  const covered = full.filter((r) => r.required && r.evidenceFileId && byId.has(r.evidenceFileId));
  const requiredRows = full.filter((r) => r.required);
  return {
    rows: full,
    requiredTotal: requiredRows.length,
    requiredCovered: covered.length,
    pct: requiredRows.length === 0 ? 1 : covered.length / requiredRows.length,
    missing: requiredRows.filter((r) => !r.evidenceFileId || !byId.has(r.evidenceFileId)),
  };
}

/** Every figure that depends on one file — the reverse lookup. Replacing a
    superseded document is only safe when you can see what it moves. */
export const dependents = (rows: CoverageRow[], fileId: string): CoverageRow[] => rows.filter((r) => r.evidenceFileId === fileId);

/** Which bucket an input's evidence naturally belongs in, so the upload
    dialog is pre-filled correctly and the pack groups itself. */
export function categoryForKey(key: string): EvidenceCategory {
  if (key.startsWith("production:")) return "production_log";
  if (key.startsWith("electricity:")) return "utility_bill";
  if (key.startsWith("fuel:") && key.endsWith(":ncv")) return "lab_report";
  if (key.startsWith("fuel:")) return "fuel_receipt";
  if (key.startsWith("process:")) return "meter_log";
  if (key.startsWith("supplier:")) return "supplier_attestation";
  if (key.startsWith("carbon:")) return "carbon_price";
  return "other";
}
