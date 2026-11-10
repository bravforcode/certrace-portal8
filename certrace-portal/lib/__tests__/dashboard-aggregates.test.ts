/* Widget B/C/K's aggregation. Each defers to logic that already exists
   elsewhere (isBuyerReady, linkStatus, valueType) — this file checks the
   WALK and the DATE ARITHMETIC, which are new here. */

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

const {
  nextDeclarationDeadline,
  daysToNextDeclarationDeadline,
  supplierFunnel,
  buyerReadyRows,
} = await import("../cbam/dashboard-aggregates");
const { createWorkspace } = await import("../workspace");
const { saveSupplier, emptySupplier } = await import("../precursor-suppliers");
const { workspaceReadiness } = await import("../readiness");

/* ── The Sept 30 rollover ─────────────────────────────────────── */

test("before Sept 30, the deadline is THIS year's Sept 30", () => {
  const d = nextDeclarationDeadline(new Date(2026, 2, 15)); // 15 March 2026
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 8); // September, 0-indexed
  assert.equal(d.getDate(), 30);
});

test("on Sept 30 itself, the deadline is still today — not yet rolled over", () => {
  const d = nextDeclarationDeadline(new Date(2026, 8, 30, 9, 0, 0));
  assert.equal(d.getFullYear(), 2026);
});

test("after Sept 30 has passed, the deadline rolls to NEXT year's Sept 30", () => {
  const d = nextDeclarationDeadline(new Date(2026, 9, 1)); // 1 October 2026
  assert.equal(d.getFullYear(), 2027);
  assert.equal(d.getMonth(), 8);
  assert.equal(d.getDate(), 30);
});

test("the day count is positive and shrinks as the deadline approaches", () => {
  const far = daysToNextDeclarationDeadline(new Date(2026, 0, 1));
  const near = daysToNextDeclarationDeadline(new Date(2026, 8, 25));
  assert.ok(far > near);
  assert.ok(near >= 0 && near <= 10);
});

/* ── Buyer-ready rows ─────────────────────────────────────────── */

test("buyerReadyRows carries a reason only for the not-ready workspaces", () => {
  storage.clear();
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2026,
  });
  const readiness = workspaceReadiness(ws);
  const rows = buyerReadyRows([{ workspace: ws, readiness }]);
  assert.equal(rows.length, 1);
  assert.equal(
    rows[0].ready,
    false,
    "a freshly created workspace has nothing entered yet",
  );
  assert.ok(rows[0].reason);
});

/* ── Supplier funnel ──────────────────────────────────────────── */

test("an empty portfolio has an empty funnel, not a divide-by-zero", () => {
  storage.clear();
  const funnel = supplierFunnel([]);
  assert.deepEqual(funnel, {
    invited: 0,
    responded: 0,
    verified: 0,
    totalPrecursorSuppliers: 0,
    staleCount: 0,
  });
});

test("scrap suppliers are excluded from the funnel — nothing to invite them to verify", () => {
  storage.clear();
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2026,
  });
  saveSupplier({
    ...emptySupplier(ws.id, null),
    name: "Scrap Co",
    isScrap: true,
    smartLinkSentAt: new Date().toISOString(),
  });
  const funnel = supplierFunnel([ws]);
  assert.equal(funnel.totalPrecursorSuppliers, 0);
});

test("invited / responded / verified count correctly across the three stages", () => {
  storage.clear();
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2026,
  });
  const now = new Date().toISOString();
  // Never invited.
  saveSupplier({ ...emptySupplier(ws.id, null), name: "Not yet invited" });
  // Invited, not opened.
  saveSupplier({
    ...emptySupplier(ws.id, null),
    name: "Invited only",
    smartLinkSentAt: now,
  });
  // Invited and opened (responded, not yet verified).
  saveSupplier({
    ...emptySupplier(ws.id, null),
    name: "Opened",
    smartLinkSentAt: now,
    smartLinkOpenedAt: now,
  });
  // Fully submitted and verified.
  saveSupplier({
    ...emptySupplier(ws.id, null),
    name: "Verified",
    dataOrigin: "supplier_verified",
    verificationReportFileId: "ev-1",
    reportingPeriodStart: "2026-01-01",
    reportingPeriodEnd: "2026-12-31",
    verifierAccreditationExpiryDate: "2027-01-01",
    verificationReportIssueDate: "2026-06-01",
    verificationSectoralScope: "Iron and steel",
    verificationCoverageStart: "2026-01-01",
    verificationCoverageEnd: "2026-12-31",
    verifierName: "Example verifier",
    verifierAccreditationNumber: "EX-123",
    verifierAccreditationIssuingCountry: "TH",
    smartLinkSentAt: now,
    smartLinkOpenedAt: now,
    smartLinkSubmittedAt: now,
  });

  const funnel = supplierFunnel([ws]);
  assert.equal(funnel.totalPrecursorSuppliers, 4);
  assert.equal(funnel.invited, 3, "everyone except the never-invited one");
  assert.equal(
    funnel.responded,
    2,
    "opened + verified, not the invited-only one",
  );
  assert.equal(funnel.verified, 1);
});

test("a stale, unresponsive invite is counted; a fresh one is not", () => {
  storage.clear();
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2026,
  });
  const stale = new Date();
  stale.setDate(stale.getDate() - 20);
  const fresh = new Date();
  fresh.setDate(fresh.getDate() - 2);
  saveSupplier({
    ...emptySupplier(ws.id, null),
    name: "Stale",
    smartLinkSentAt: stale.toISOString(),
  });
  saveSupplier({
    ...emptySupplier(ws.id, null),
    name: "Fresh",
    smartLinkSentAt: fresh.toISOString(),
  });
  assert.equal(supplierFunnel([ws]).staleCount, 1);
});
