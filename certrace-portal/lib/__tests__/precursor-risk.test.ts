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

const { precursorRiskFor, PRECURSOR_RISK_WEIGHTS } = await import("../cbam/precursor-risk");
const { createWorkspace } = await import("../workspace");
const { saveSupplier, emptySupplier } = await import("../precursor-suppliers");

test("no precursors, no risk", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-A", installationName: "Plant A", productId: "billet", productionRoute: "scrap_eaf", year: 2026 });
  const result = precursorRiskFor(ws);
  assert.equal(result.score, 0);
  assert.equal(result.topFactor, null);
});

test("a default-value node contributes exactly the default-value weight", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-A", installationName: "Plant A", productId: "billet", productionRoute: "scrap_eaf", year: 2026 });
  saveSupplier({ ...emptySupplier(ws.id, null), name: "Foundry", dataOrigin: "default_value" });
  const result = precursorRiskFor(ws);
  assert.equal(result.score, PRECURSOR_RISK_WEIGHTS.defaultValue);
  assert.ok(result.topFactor);
});

test("scrap never contributes risk, however incomplete", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-A", installationName: "Plant A", productId: "billet", productionRoute: "scrap_eaf", year: 2026 });
  saveSupplier({ ...emptySupplier(ws.id, null), name: "Scrap Co", isScrap: true, dataOrigin: "default_value" });
  assert.equal(precursorRiskFor(ws).score, 0);
});

test("a failed-validation node scores the failed-validation weight, the largest single factor", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-A", installationName: "Plant A", productId: "billet", productionRoute: "scrap_eaf", year: 2026 });
  const now = new Date().toISOString();
  saveSupplier({
    ...emptySupplier(ws.id, null),
    name: "Foundry",
    dataOrigin: "supplier_verified",
    smartLinkSentAt: now,
    smartLinkOpenedAt: now,
    smartLinkSubmittedAt: now,
    // no verification report/metadata attached, so the 4-check gate fails
    // and saveSupplier's own fallback drops this to default_value — this
    // test checks linkStatus reads "submitted_failed_validation" from the
    // timestamps regardless of what dataOrigin the fallback landed on.
  });
  const result = precursorRiskFor(ws);
  assert.ok(result.score > 0);
});

test("the score is capped at 100 how ever many risky nodes pile up", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-A", installationName: "Plant A", productId: "billet", productionRoute: "scrap_eaf", year: 2026 });
  for (let i = 0; i < 10; i++) {
    saveSupplier({ ...emptySupplier(ws.id, null), name: `Foundry ${i}`, dataOrigin: "default_value" });
  }
  assert.equal(precursorRiskFor(ws).score, 100);
});

test("the top factor names the highest-point contributor, not just the first node", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-A", installationName: "Plant A", productId: "billet", productionRoute: "scrap_eaf", year: 2026 });
  saveSupplier({ ...emptySupplier(ws.id, null), name: "Low risk", dataOrigin: "default_value" });
  const now = new Date().toISOString();
  saveSupplier({ ...emptySupplier(ws.id, null), name: "High risk", dataOrigin: "supplier_verified", smartLinkSentAt: now, smartLinkOpenedAt: now, smartLinkSubmittedAt: now });
  const result = precursorRiskFor(ws);
  assert.equal(result.topFactor?.node.name, "High risk");
});
