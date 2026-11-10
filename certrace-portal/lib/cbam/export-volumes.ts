import { accountStorage } from "../account-storage";
/* ════════════════════════════════════════════════════════════
   EXPORT VOLUMES — the tonnage a workspace actually shipped

   The Cost Avoidance Calculator (lib/cbam/cost-exposure.ts) needs a real
   export volume to turn a per-tonne SEE gap into a euro figure — without it,
   the calculation has no denominator and must say so rather than guess one.
   This is deliberately a THIN store: one number per workspace per reporting
   period (optionally split by month), because that is all the formula reads.
   ════════════════════════════════════════════════════════════ */

export type ExportVolumeSource =
  | "manual_entry"
  | "shipment_import"
  | "estimated";

export type ExportVolume = {
  id: string;
  workspaceId: string;
  /** the reporting year this volume belongs to */
  reportingPeriod: number;
  /** 'YYYY-MM' — omitted when only an annual total is on file */
  month?: string;
  productCnCode: string;
  volumeTonnes: number;
  source: ExportVolumeSource;
};

const KEY = "certrace:export-volumes";

type Store = Record<string, ExportVolume[]>;

export const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? `ev-${crypto.randomUUID().slice(0, 8)}`
    : `ev-${Date.now().toString(36)}`;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = accountStorage.getItem(KEY);
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
    accountStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore quota */
  }
}

export const listExportVolumes = (workspaceId: string): ExportVolume[] =>
  read()[workspaceId] ?? [];

export function saveExportVolume(v: ExportVolume): ExportVolume {
  const store = read();
  const rows = store[v.workspaceId] ?? [];
  const idx = rows.findIndex((r) => r.id === v.id);
  if (idx >= 0) rows[idx] = v;
  else rows.push(v);
  store[v.workspaceId] = rows;
  write(store);
  return v;
}

export function removeExportVolume(workspaceId: string, id: string): void {
  const store = read();
  store[workspaceId] = (store[workspaceId] ?? []).filter((r) => r.id !== id);
  write(store);
}

export const emptyExportVolume = (
  workspaceId: string,
  reportingPeriod: number,
  productCnCode: string,
): ExportVolume => ({
  id: uid(),
  workspaceId,
  reportingPeriod,
  productCnCode,
  volumeTonnes: 0,
  source: "manual_entry",
});

/** Total tonnes on file for a workspace's reporting year — the sum the Cost
    Avoidance Calculator actually reads. Returns null, not 0, when nothing
    has been entered — 0 is a real answer ("we exported nothing"), null is
    "we don't know yet", and the two must never be confused into a silent
    €0 savings figure that looks like a computed result. */
export function totalExportVolume(
  workspaceId: string,
  reportingPeriod: number,
): number | null {
  const rows = listExportVolumes(workspaceId).filter(
    (r) => r.reportingPeriod === reportingPeriod,
  );
  if (rows.length === 0) return null;
  return rows.reduce((a, r) => a + (r.volumeTonnes || 0), 0);
}

/** The year's tonnes shipped to the EU, as ONE figure — what the Carbon & Cost tab asks for. Replaces any annual row already on file for the
    year (a month-by-month split, if one exists, is left alone), and `null` takes the annual figure back out. */
export function setAnnualExportVolume(
  workspaceId: string,
  reportingPeriod: number,
  productCnCode: string,
  tonnes: number | null,
): void {
  const store = read();
  const keep = (store[workspaceId] ?? []).filter(
    (r) => !(r.reportingPeriod === reportingPeriod && !r.month),
  );
  if (tonnes != null && Number.isFinite(tonnes) && tonnes >= 0) {
    keep.push({
      id: uid(),
      workspaceId,
      reportingPeriod,
      productCnCode,
      volumeTonnes: tonnes,
      source: "manual_entry",
    });
  }
  store[workspaceId] = keep;
  write(store);
}
