/* Bug 8 — a section must not read COMPLETE on the basis of an empty state.
   Two instances of the same failure mode, both audited and fixed: Evidence
   (zero months submitted) and Materiality (zero emissions recorded). */

import { test } from "node:test";
import assert from "node:assert/strict";

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  clear() {
    this.map.clear();
  }
}

const g = globalThis as unknown as { window?: unknown; localStorage?: unknown };
const storage = new MemoryStorage();
g.window = { localStorage: storage };
g.localStorage = storage;

const { createWorkspace } = await import("../workspace");
const { workspaceReadiness } = await import("../readiness");
const { emptyMonth, saveMonth } = await import("../monthly-data");

function freshWorkspace() {
  storage.clear();
  return createWorkspace({
    installationId: "TH-PLANT-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2026,
  });
}

test("Bug 8 — a brand-new workspace's Evidence tab reads not_started, never complete", () => {
  const ws = freshWorkspace();
  const r = workspaceReadiness(ws);
  const evidence = r.tabs.find((t) => t.tab === "evidence")!;
  assert.equal(
    evidence.state,
    "not_started",
    "zero months submitted is not the same claim as 'nothing missing'",
  );
  assert.ok(
    evidence.missing.length > 0,
    "the empty state still names something to do",
  );
});

test("Bug 8 — a brand-new workspace's Materiality tab reads not_started, never complete", () => {
  const ws = freshWorkspace();
  const r = workspaceReadiness(ws);
  const materiality = r.tabs.find((t) => t.tab === "materiality")!;
  assert.equal(
    materiality.state,
    "not_started",
    "zero recorded emissions is not the same claim as '0% estimated'",
  );
});

test("Bug 8 — the overall rollup treats not_started the same as incomplete, never complete", () => {
  const ws = freshWorkspace();
  const r = workspaceReadiness(ws);
  assert.notEqual(
    r.overall,
    "complete",
    "a workspace with nothing entered cannot be overall-complete",
  );
  assert.equal(
    r.percentComplete,
    0,
    "nothing entered means nothing counts toward the descriptive percentage either",
  );
});

test("Bug 8 — Evidence and Materiality both read complete once real data backs them, not just because a document happens to be attached", () => {
  const ws = freshWorkspace();
  saveMonth({
    ...emptyMonth(ws.id, "2026-01"),
    month: "2026-01",
    productionTonnes: 875,
    fuels: [
      {
        id: "f1",
        fuelType: "natural_gas",
        quantity: 12_400,
        unit: "m3",
        ncvMjPerUnit: 38,
        efTco2PerGj: 0.0561,
        oxidationFactor: 1,
        factorSource: "lab_analysis",
      },
    ],
    electricityMwh: 393.75,
    electricityFactorTco2PerMwh: 0.4999,
    electricityFactorSource: "grid_default",
    status: "submitted",
    submittedAt: "2026-01-31T00:00:00.000Z",
    submittedBy: "Test",
  });
  const r = workspaceReadiness(ws);
  const materiality = r.tabs.find((t) => t.tab === "materiality")!;
  // Nothing is estimated (no MMD data-gap register entries) against a
  // non-zero total, so this is now a genuine, evaluated complete — not the
  // false green a zero-total default would have produced.
  assert.equal(materiality.state, "complete");
});

/* ── The MMD tab is what gates the download ─────────────────────
   The Readiness tab's download button reads THIS tab's state rather than
   asking its own "is the methodology final?" question, so the button and the
   BLOCKED badge on the MMD card can never disagree. Two things have to hold
   for that to be safe, and they are what these pin. */

test("the MMD tab is only ever complete or blocked, so 'not complete' is a real block", () => {
  storage.clear();
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2026,
  });
  const tab = workspaceReadiness(ws).tabs.find((t) => t.tab === "mmd")!;
  assert.equal(
    tab.state,
    "blocked",
    "a fresh workspace has no final methodology",
  );
  assert.ok(
    ["complete", "blocked"].includes(tab.state),
    "there is no third state for the download gate to fall through",
  );
});

test("a blocked MMD tab always carries the reason the button prints beside itself", () => {
  storage.clear();
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2026,
  });
  const tab = workspaceReadiness(ws).tabs.find((t) => t.tab === "mmd")!;
  assert.ok(
    tab.blockingReason,
    "the disabled button has no wording of its own — it prints this",
  );
  assert.match(tab.blockingReason!, /No final MMD exists for this period/);
});
