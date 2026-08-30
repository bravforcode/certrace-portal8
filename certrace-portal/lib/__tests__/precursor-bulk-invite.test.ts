/* Section 2.4 — "Send links to all precursors in this chain". Skip logic:
   already-verified nodes and nodes already invited THIS period are
   skipped; scrap is skipped (nothing to verify); everyone else gets a
   token stamped and a sent timestamp. */

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

const { sendAllPrecursorLinks, decodePrecursorLinkToken } = await import("../precursor-link");
const { createWorkspace } = await import("../workspace");
const { saveSupplier, emptySupplier, getSupplier, listSuppliers } = await import("../precursor-suppliers");

test("an empty chain sends nothing", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-A", installationName: "Plant A", productId: "billet", productionRoute: "scrap_eaf", year: 2026 });
  const result = sendAllPrecursorLinks(ws);
  assert.deepEqual(result, { sent: 0, skippedVerified: 0, skippedAlreadyInvited: 0, skippedScrap: 0 });
});

test("a never-invited node gets a token stamped and a sent timestamp", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-A", installationName: "Plant A", productId: "billet", productionRoute: "scrap_eaf", year: 2026 });
  const s = saveSupplier({ ...emptySupplier(ws.id, null), name: "Chonburi Foundry" });
  const result = sendAllPrecursorLinks(ws);
  assert.equal(result.sent, 1);
  const saved = getSupplier(ws.id, s.id)!;
  assert.ok(saved.smartLinkToken);
  assert.ok(saved.smartLinkSentAt);
  assert.deepEqual(decodePrecursorLinkToken(saved.smartLinkToken!), { workspaceId: ws.id, precursorNodeId: s.id });
});

test("scrap is never sent a link — nothing to verify", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-A", installationName: "Plant A", productId: "billet", productionRoute: "scrap_eaf", year: 2026 });
  saveSupplier({ ...emptySupplier(ws.id, null), name: "Scrap Co", isScrap: true });
  const result = sendAllPrecursorLinks(ws);
  assert.equal(result.sent, 0);
  assert.equal(result.skippedScrap, 1);
});

test("a fully verified node is skipped, not re-invited", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-A", installationName: "Plant A", productId: "billet", productionRoute: "scrap_eaf", year: 2026 });
  const now = ws.periodStart;
  saveSupplier({
    ...emptySupplier(ws.id, null),
    name: "Verified Foundry",
    dataOrigin: "supplier_verified",
    verificationReportFileId: "ev-1",
    reportingPeriodStart: ws.periodStart,
    reportingPeriodEnd: ws.periodEnd,
    verifierAccreditationExpiryDate: "2030-01-01",
    verificationReportIssueDate: now,
    verificationSectoralScope: "Iron and steel",
    smartLinkSentAt: now,
    smartLinkOpenedAt: now,
    smartLinkSubmittedAt: now,
  });
  const result = sendAllPrecursorLinks(ws);
  assert.equal(result.sent, 0);
  assert.equal(result.skippedVerified, 1);
});

test("a node already invited THIS period is skipped on a second bulk send", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-A", installationName: "Plant A", productId: "billet", productionRoute: "scrap_eaf", year: 2026 });
  saveSupplier({ ...emptySupplier(ws.id, null), name: "Chonburi Foundry" });

  const first = sendAllPrecursorLinks(ws);
  assert.equal(first.sent, 1);

  const second = sendAllPrecursorLinks(ws);
  assert.equal(second.sent, 0);
  assert.equal(second.skippedAlreadyInvited, 1);
});

test("a node invited in a PRIOR period is re-invited, not skipped", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-A", installationName: "Plant A", productId: "billet", productionRoute: "scrap_eaf", year: 2026 });
  saveSupplier({ ...emptySupplier(ws.id, null), name: "Chonburi Foundry", smartLinkSentAt: "2025-03-01T00:00:00.000Z" });
  const result = sendAllPrecursorLinks(ws);
  assert.equal(result.sent, 1);
  assert.equal(result.skippedAlreadyInvited, 0);
});

test("a re-sent node reuses its existing token rather than minting a new one", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-A", installationName: "Plant A", productId: "billet", productionRoute: "scrap_eaf", year: 2026 });
  saveSupplier({ ...emptySupplier(ws.id, null), name: "Chonburi Foundry", smartLinkToken: "existing-token", smartLinkSentAt: "2025-03-01T00:00:00.000Z" });
  sendAllPrecursorLinks(ws);
  const saved = listSuppliers(ws.id)[0];
  assert.equal(saved.smartLinkToken, "existing-token");
});

test("a mixed chain reports accurate counts across every category", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-A", installationName: "Plant A", productId: "billet", productionRoute: "scrap_eaf", year: 2026 });
  saveSupplier({ ...emptySupplier(ws.id, null), name: "Fresh invite" });
  saveSupplier({ ...emptySupplier(ws.id, null), name: "Scrap", isScrap: true });
  saveSupplier({
    ...emptySupplier(ws.id, null),
    name: "Verified",
    dataOrigin: "supplier_verified",
    verificationReportFileId: "ev-1",
    reportingPeriodStart: ws.periodStart,
    reportingPeriodEnd: ws.periodEnd,
    verifierAccreditationExpiryDate: "2030-01-01",
    verificationReportIssueDate: ws.periodStart,
    verificationSectoralScope: "Iron and steel",
    smartLinkSentAt: ws.periodStart,
    smartLinkOpenedAt: ws.periodStart,
    smartLinkSubmittedAt: ws.periodStart,
  });
  saveSupplier({ ...emptySupplier(ws.id, null), name: "Already invited this period", smartLinkSentAt: ws.periodStart });

  const result = sendAllPrecursorLinks(ws);
  assert.equal(result.sent, 1);
  assert.equal(result.skippedScrap, 1);
  assert.equal(result.skippedVerified, 1);
  assert.equal(result.skippedAlreadyInvited, 1);
});
