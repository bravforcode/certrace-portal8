/* Freeze, version and four eyes — the store-layer guards.

   These run against a stubbed localStorage because the point of the tests is
   exactly that the rules live in the store rather than in a disabled button. */

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

/* Minimal localStorage stand-in, installed before the module under test reads
   `window`. Node's test runner shares module state across tests in a file, so
   each test clears it rather than re-importing. */
const store = new Map<string, string>();
(globalThis as { window?: unknown }).window = {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  },
};

const { freezeCalculation, listSnapshots, activeSnapshot, snapshotForDate, chargeableSeeForDate, compareSnapshots, driftedFromSnapshot, FourEyesError, FrozenError } =
  await import("../freeze");
const { goldenDataset, goldenPrecursorTree, GOLDEN_DECLARATION_ID, GOLDEN_EXPECTED } = await import("../__fixtures__/golden");

const base = () => ({
  declarationId: GOLDEN_DECLARATION_ID,
  dataset: goldenDataset(),
  precursorTree: goldenPrecursorTree(),
  category: "Iron & Steel" as const,
  preparerId: "Wasawat K.",
  approverId: "Nicha P.",
});

beforeEach(() => store.clear());

test("four eyes is enforced at the store layer, not in the UI", async () => {
  await assert.rejects(
    () => freezeCalculation({ ...base(), approverId: "Wasawat K." }),
    (err: unknown) => err instanceof FourEyesError,
  );
  // Case and padding must not be a way around it.
  await assert.rejects(() => freezeCalculation({ ...base(), approverId: "  wasawat k.  " }), FourEyesError);
  assert.equal(listSnapshots(GOLDEN_DECLARATION_ID).length, 0, "nothing was written");
});

test("a freeze captures the engine's outputs and a content hash", async () => {
  const snap = await freezeCalculation(base());
  assert.equal(snap.version, 1);
  assert.equal(snap.revisionReason, null);
  assert.ok(snap.contentHash.length > 8);
  assert.ok(Math.abs(snap.outputs.chargeablePerTonne - GOLDEN_EXPECTED.SEE_total_chargeable) < 1e-6);
  assert.ok(Math.abs(snap.outputs.reportedPerTonne - GOLDEN_EXPECTED.SEE_total_reported) < 1e-6);
  assert.equal(snap.outputs.indirectCounted, false);
  assert.equal(activeSnapshot(GOLDEN_DECLARATION_ID)!.id, snap.id);
});

test("re-freezing without a reason is refused; a revision creates a NEW version", async () => {
  await freezeCalculation(base());
  await assert.rejects(() => freezeCalculation(base()), FrozenError);

  const revised = goldenDataset();
  revised.fuels[0].quantity = 160_000; // the August invoice finally turned up
  const v2 = await freezeCalculation({
    ...base(),
    dataset: revised,
    effectiveFrom: "2026-07-01",
    revisionReason: "August gas invoice replaced the estimate",
  });

  assert.equal(v2.version, 2);
  assert.equal(listSnapshots(GOLDEN_DECLARATION_ID).length, 2, "version 1 is kept, not overwritten");
  assert.equal(listSnapshots(GOLDEN_DECLARATION_ID)[0].version, 1);
  assert.match(v2.revisionReason!, /August gas invoice/);

  const changes = compareSnapshots(listSnapshots(GOLDEN_DECLARATION_ID)[0], v2);
  assert.ok(changes.some((c) => c.field === "directPerTonne"));
  assert.ok(changes.every((c) => c.before !== c.after));
});

test("a shipment resolves to the snapshot valid on ITS date, never the latest", async () => {
  const v1 = await freezeCalculation({ ...base(), effectiveFrom: "2026-01-01" });

  const revised = goldenDataset();
  revised.fuels[0].quantity = 300_000; // a materially different installation
  const v2 = await freezeCalculation({
    ...base(),
    dataset: revised,
    effectiveFrom: "2026-07-01",
    revisionReason: "mid-year re-baseline after the second furnace came online",
  });

  assert.notEqual(v1.outputs.chargeablePerTonne, v2.outputs.chargeablePerTonne);

  // March shipment → version 1. October shipment → version 2.
  assert.equal(snapshotForDate(GOLDEN_DECLARATION_ID, "2026-03-22")!.version, 1);
  assert.equal(snapshotForDate(GOLDEN_DECLARATION_ID, "2026-10-04")!.version, 2);
  assert.equal(chargeableSeeForDate(GOLDEN_DECLARATION_ID, "2026-03-22"), v1.outputs.chargeablePerTonne);
  assert.equal(chargeableSeeForDate(GOLDEN_DECLARATION_ID, "2026-10-04"), v2.outputs.chargeablePerTonne);

  // Before anything was in force, there is no figure — not a zero.
  assert.equal(snapshotForDate(GOLDEN_DECLARATION_ID, "2025-12-31"), null);
  assert.equal(chargeableSeeForDate(GOLDEN_DECLARATION_ID, "2025-12-31"), null);
});

test("drift against the frozen hash is detected", async () => {
  const snap = await freezeCalculation(base());
  assert.equal(await driftedFromSnapshot(snap, goldenDataset(), goldenPrecursorTree(), "Iron & Steel"), false);

  const edited = goldenDataset();
  edited.electricity[0].mwhAbsolute = 5_000;
  assert.equal(await driftedFromSnapshot(snap, edited, goldenPrecursorTree(), "Iron & Steel"), true);
});
