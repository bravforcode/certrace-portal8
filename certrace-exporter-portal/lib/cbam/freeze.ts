/* ════════════════════════════════════════════════════════════
   FREEZE, VERSION, FOUR EYES (gap G8)

   The failure this closes is quiet and total: someone approves a figure, then
   someone else fixes a typo in an input, and now the number in the signed PDF
   and the number the portal shows are different. Nobody did anything wrong.
   The verification trail is nonetheless broken, because "approved" no longer
   points at anything.

   So at sign-off the whole calculation is FROZEN: the activity dataset, the
   precursor tree, the engine version, every output, and a content hash over
   all of it. After that the inputs are read-only. Changing them is not an
   edit — it is a REVISION, which creates a new version and records who, when
   and why.

   Three properties matter downstream:

     · a shipment resolves to the snapshot valid ON ITS OWN DATE, never to the
       latest one (spec §5.5 Formula 5). After a mid-year re-baseline, blending
       versions silently mixes two emission factors into one buyer total.
     · outputs bind to the snapshot, not to live inputs — what was approved is
       what gets filed.
     · the preparer cannot be the approver, enforced HERE, at the store, not
       in the UI. A rule that only exists in a button's disabled state is not
       a control; anyone calling the function directly walks straight past it.
   ════════════════════════════════════════════════════════════ */

import type { ActivityDataset } from "./activity";
import type { PrecursorNode } from "./precursor-tree";
import { runEngine, ENGINE_VERSION, type GoodsCategory } from "./engine";

export type SnapshotOutputs = {
  directPerTonne: number;
  indirectPerTonne: number;
  precursorPerTonne: number;
  reportedPerTonne: number;
  chargeablePerTonne: number;
  directTotalTCO2: number;
  indirectTotalTCO2: number;
  productionTonnes: number;
  indirectCounted: boolean;
};

export type CalculationSnapshot = {
  id: string;
  declarationId: string;
  /** 1-based; a revision always creates the next one, never overwrites */
  version: number;
  engineVersion: string;
  frozenAt: number;
  /** ISO date this snapshot becomes the valid one for shipments */
  effectiveFrom: string;
  /** who assembled the dataset */
  preparerId: string;
  /** who signed it off — never the same person (four eyes, V13) */
  approverId: string;
  dataset: ActivityDataset;
  precursorTree: PrecursorNode[];
  category: GoodsCategory;
  outputs: SnapshotOutputs;
  /** sha-256 over the inputs + outputs; changes if anything is touched */
  contentHash: string;
  /** why this version exists. Null only on the first freeze. */
  revisionReason: string | null;
};

export class FourEyesError extends Error {
  readonly code = "FOUR_EYES";

  constructor(message: string) {
    super(message);
    this.name = "FourEyesError";
  }
}

export class FrozenError extends Error {
  readonly code = "FROZEN";

  constructor(message: string) {
    super(message);
    this.name = "FrozenError";
  }
}

const KEY = "certrace:calc-snapshots";

type Store = Record<string, CalculationSnapshot[]>;

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

export const listSnapshots = (declarationId: string): CalculationSnapshot[] =>
  (read()[declarationId] ?? []).sort((a, b) => a.version - b.version);

/** The current snapshot — what the UI shows and what new outputs bind to. */
export function activeSnapshot(declarationId: string): CalculationSnapshot | null {
  const list = listSnapshots(declarationId);
  return list.length ? list[list.length - 1] : null;
}

export const isFrozen = (declarationId: string): boolean => activeSnapshot(declarationId) !== null;

/** The snapshot that was valid on a given date — Formula 5's `decl(s)`.

    Deliberately NOT "the latest": a shipment that left in March is priced by
    what was approved in March, whatever has been re-baselined since. Returns
    null when nothing was in force yet, which leaves those tonnes visibly
    unpriced rather than silently valued at today's figure. */
export function snapshotForDate(declarationId: string, isoDate: string): CalculationSnapshot | null {
  const eligible = listSnapshots(declarationId).filter((s) => s.effectiveFrom <= isoDate);
  return eligible.length ? eligible[eligible.length - 1] : null;
}

/** Chargeable SEE per tonne valid on a date — the resolver lib/shipments.ts
    and the engine's perBuyerTotals both take. */
export const chargeableSeeForDate = (declarationId: string, isoDate: string): number | null =>
  snapshotForDate(declarationId, isoDate)?.outputs.chargeablePerTonne ?? null;

/* ── Hashing ────────────────────────────────────────────────────
   Over inputs AND outputs, so neither can drift without the hash moving. The
   digest is what makes "this is the dataset that was approved" a checkable
   claim rather than an assertion. */
async function hashSnapshot(payload: unknown): Promise<string> {
  const json = JSON.stringify(payload);
  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const bytes = new TextEncoder().encode(json);
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch {
    /* fall through */
  }
  /* No WebCrypto (old browser, non-secure context). A weak checksum still
     detects accidental drift, and it is labelled so nobody mistakes it for a
     cryptographic guarantee. */
  let h = 0;
  for (let i = 0; i < json.length; i++) h = (Math.imul(31, h) + json.charCodeAt(i)) | 0;
  return `weak-${(h >>> 0).toString(16)}`;
}

export type FreezeInput = {
  declarationId: string;
  dataset: ActivityDataset;
  precursorTree: PrecursorNode[];
  category: GoodsCategory;
  preparerId: string;
  approverId: string;
  /** ISO; defaults to the reporting period start so the whole period is covered */
  effectiveFrom?: string;
  /** required on every freeze after the first */
  revisionReason?: string;
};

/** Freeze the calculation. Throws rather than returning an error object: a
    caller that ignores a failed freeze would leave the exporter believing
    their figures are locked when they are not. */
export async function freezeCalculation(input: FreezeInput): Promise<CalculationSnapshot> {
  if (!input.preparerId.trim() || !input.approverId.trim()) {
    throw new FourEyesError("A frozen calculation needs both a named preparer and a named approver.");
  }
  if (input.preparerId.trim().toLowerCase() === input.approverId.trim().toLowerCase()) {
    throw new FourEyesError(
      "The person who prepared these figures cannot also approve them. Segregation of duties is one of the seven things a verifier tests, and it is checked here rather than hidden in the UI — pick a different approver.",
    );
  }

  const existing = listSnapshots(input.declarationId);
  if (existing.length > 0 && !input.revisionReason?.trim()) {
    throw new FrozenError(
      "This calculation is already frozen. Changing it creates a new version, and a new version needs a reason — that reason is what a verifier reads to understand why the number moved.",
    );
  }

  const engine = runEngine(input.dataset, input.precursorTree, input.category);
  const outputs: SnapshotOutputs = {
    directPerTonne: engine.direct.perTonne,
    indirectPerTonne: engine.indirect.perTonne,
    precursorPerTonne: engine.precursor.perTonne,
    reportedPerTonne: engine.totals.reported,
    chargeablePerTonne: engine.totals.chargeable,
    directTotalTCO2: engine.direct.total,
    indirectTotalTCO2: engine.indirect.total,
    productionTonnes: engine.productionTonnes,
    indirectCounted: engine.totals.indirectCounted,
  };

  const version = existing.length + 1;
  const effectiveFrom = input.effectiveFrom ?? input.dataset.period.start;
  const contentHash = await hashSnapshot({
    dataset: input.dataset,
    precursorTree: input.precursorTree,
    category: input.category,
    outputs,
    engineVersion: ENGINE_VERSION,
  });

  const snapshot: CalculationSnapshot = {
    id: `snap-${input.declarationId}-v${version}`,
    declarationId: input.declarationId,
    version,
    engineVersion: ENGINE_VERSION,
    frozenAt: Date.now(),
    effectiveFrom,
    preparerId: input.preparerId,
    approverId: input.approverId,
    dataset: input.dataset,
    precursorTree: input.precursorTree,
    category: input.category,
    outputs,
    contentHash,
    revisionReason: input.revisionReason?.trim() || null,
  };

  const store = read();
  store[input.declarationId] = [...existing, snapshot];
  write(store);
  return snapshot;
}

/** Has anything moved since the freeze? Used to warn on screens that still
    show live inputs, and to explain why a revision is needed. */
export async function driftedFromSnapshot(
  snapshot: CalculationSnapshot,
  dataset: ActivityDataset,
  precursorTree: PrecursorNode[],
  category: GoodsCategory,
): Promise<boolean> {
  try {
    const engine = runEngine(dataset, precursorTree, category);
    const outputs: SnapshotOutputs = {
      directPerTonne: engine.direct.perTonne,
      indirectPerTonne: engine.indirect.perTonne,
      precursorPerTonne: engine.precursor.perTonne,
      reportedPerTonne: engine.totals.reported,
      chargeablePerTonne: engine.totals.chargeable,
      directTotalTCO2: engine.direct.total,
      indirectTotalTCO2: engine.indirect.total,
      productionTonnes: engine.productionTonnes,
      indirectCounted: engine.totals.indirectCounted,
    };
    const hash = await hashSnapshot({ dataset, precursorTree, category, outputs, engineVersion: ENGINE_VERSION });
    return hash !== snapshot.contentHash;
  } catch {
    // The live inputs no longer even compute — that is drift by any measure.
    return true;
  }
}

/** A readable change list between two versions, for the verification trail. */
export type SnapshotChange = { field: string; before: number; after: number; deltaPct: number | null };

export function compareSnapshots(before: CalculationSnapshot, after: CalculationSnapshot): SnapshotChange[] {
  const fields: (keyof SnapshotOutputs)[] = [
    "directPerTonne",
    "indirectPerTonne",
    "precursorPerTonne",
    "reportedPerTonne",
    "chargeablePerTonne",
    "productionTonnes",
  ];
  const out: SnapshotChange[] = [];
  for (const f of fields) {
    const a = Number(before.outputs[f]);
    const b = Number(after.outputs[f]);
    if (a === b) continue;
    out.push({ field: f, before: a, after: b, deltaPct: a !== 0 ? ((b - a) / a) * 100 : null });
  }
  return out;
}
