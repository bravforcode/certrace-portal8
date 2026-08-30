/* ════════════════════════════════════════════════════════════
   THE DOWNLOAD FILENAME

   MMD_[Company/Factory]_[Product]_[Year]_v[Version][_Draft].pdf

   NAMING WARNING. "MMD" here stands for Monitoring Methodology
   DOCUMENTATION — the name the exported report now carries. It is NOT the
   Monitoring Methodology DOCUMENT in lib/cbam/mmd.ts, which is a different
   artefact with its own store, its own versions and its own readiness tab.
   The two are unrelated and this module is deliberately not called
   `mmd-filename.ts` so nobody imports one meaning the other.

   Filename only. Nothing here touches what the report contains or how it is
   generated — `assembleFinalReportPdf` produces the bytes and this decides
   what they are called on the way out.
   ════════════════════════════════════════════════════════════ */

/** Version rows, keyed by workspace. */
const KEY = "certrace:final-report-version";

export type ReportVersion = {
  /** minor only — 1.0, 1.1, 1.2. The major stays at 1 until something asks
      for a rule about when it moves, which nothing does yet. */
  minor: number;
  /** the figures the last download was taken against. See `nextVersion`. */
  fingerprint: string;
  at: string;
};

type Store = Record<string, ReportVersion>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Store) : {};
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
    /* Quota. The version is a label on a file that has already been built —
       losing it costs a version number, never the download itself. */
  }
}

export const getReportVersion = (workspaceId: string): ReportVersion | null => read()[workspaceId] ?? null;

/** The version this download should carry, recorded as it is handed out.

    v1.0 for the first one. After that the minor increments only when the
    FIGURES have moved since the last download — pressing the button twice on
    an unchanged workspace hands back the same document, and a document that
    has not changed is not a new version. `fingerprint` is the same one the
    sign-off gate computes, so "changed" means exactly what it means there. */
export function nextVersion(workspaceId: string, fingerprint: string): string {
  const previous = read()[workspaceId] ?? null;
  const minor = previous == null ? 0 : previous.fingerprint === fingerprint ? previous.minor : previous.minor + 1;
  const store = read();
  store[workspaceId] = { minor, fingerprint, at: new Date().toISOString() };
  write(store);
  return `1.${minor}`;
}

/** One filename segment: spaces and slashes become hyphens, anything a file
    system would argue about is dropped, and runs of hyphens collapse. Never
    returns an empty string — an unnamed segment would silently produce
    `MMD__Rebar_2026_v1.0.pdf`, which reads as a missing field rather than as
    a name nobody entered. */
export function fileSegment(raw: string | null | undefined, fallback: string): string {
  const cleaned = String(raw ?? "")
    .trim()
    .replace(/[\s/\\]+/g, "-")
    .replace(/[^A-Za-z0-9.\-()]+/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return cleaned.length > 0 ? cleaned : fallback;
}

export type FinalReportNameInput = {
  /** the installation record's name, or the workspace's copy of it */
  companyName: string;
  productName: string;
  year: number | string;
  /** stamped DRAFT — the workspace is not complete */
  draft: boolean;
  /** "1.0", "1.1", … from `nextVersion` */
  version: string;
  extension?: string;
};

export function finalReportFileName(input: FinalReportNameInput): string {
  const company = fileSegment(input.companyName, "Unnamed-Installation");
  const product = fileSegment(input.productName, "Unnamed-Product");
  const year = fileSegment(String(input.year), "Unknown-Year");
  const ext = input.extension ?? "pdf";
  return `MMD_${company}_${product}_${year}_v${input.version}${input.draft ? "_Draft" : ""}.${ext}`;
}
