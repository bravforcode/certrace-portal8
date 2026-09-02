/* ════════════════════════════════════════════════════════════
   PRECURSOR LINK STATUS AND VALUE TYPE — derived, never stored

   Six link states, read off three timestamps and the existing four-check
   verification gate. Two value types, read off the same gate. Neither is
   ever set directly — this file holds that down.
   ════════════════════════════════════════════════════════════ */

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

const { linkStatus, valueType, isVerificationExpired, markLinkOpened, markLinkSubmitted, saveSupplier, emptySupplier } = await import("../precursor-suppliers");
const { makePrecursorLinkToken, decodePrecursorLinkToken, resolvePrecursorLink } = await import("../precursor-link");
const { createWorkspace } = await import("../workspace");
const { makeWorkspaceToken } = await import("../workspace-link");

const PASS = { accreditationValid: true, sectoralScopeMatch: true, periodCovered: true, fileIntact: true, failedReasons: [] };
const FAIL = { accreditationValid: false, sectoralScopeMatch: true, periodCovered: true, fileIntact: false, failedReasons: ["no file"] };

/* ── linkStatus ─────────────────────────────────────────────── */

test("not_invited: nothing sent yet", () => {
  assert.equal(linkStatus({}), "not_invited");
});

test("invited_not_opened: sent, not yet opened", () => {
  assert.equal(linkStatus({ smartLinkSentAt: "2026-03-01T00:00:00Z" }), "invited_not_opened");
});

test("opened_in_progress: opened, not yet submitted", () => {
  assert.equal(linkStatus({ smartLinkSentAt: "2026-03-01T00:00:00Z", smartLinkOpenedAt: "2026-03-02T00:00:00Z" }), "opened_in_progress");
});

test("submitted_pending_validation: submitted with no checks run yet (unverified claim or default)", () => {
  assert.equal(
    linkStatus({
      smartLinkSentAt: "2026-03-01T00:00:00Z",
      smartLinkOpenedAt: "2026-03-02T00:00:00Z",
      smartLinkSubmittedAt: "2026-03-03T00:00:00Z",
      dataOrigin: "supplier_unverified",
    }),
    "submitted_pending_validation",
  );
  assert.equal(
    linkStatus({
      smartLinkSentAt: "2026-03-01T00:00:00Z",
      smartLinkOpenedAt: "2026-03-02T00:00:00Z",
      smartLinkSubmittedAt: "2026-03-03T00:00:00Z",
      dataOrigin: "supplier_verified",
      // no verificationChecks yet
    }),
    "submitted_pending_validation",
  );
});

test("submitted_verified: submitted, verified claim, all four checks pass", () => {
  assert.equal(
    linkStatus({
      smartLinkSentAt: "2026-03-01T00:00:00Z",
      smartLinkOpenedAt: "2026-03-02T00:00:00Z",
      smartLinkSubmittedAt: "2026-03-03T00:00:00Z",
      dataOrigin: "supplier_verified",
      verificationChecks: PASS,
    }),
    "submitted_verified",
  );
});

test("submitted_failed_validation: submitted, verified claim, a check failed", () => {
  assert.equal(
    linkStatus({
      smartLinkSentAt: "2026-03-01T00:00:00Z",
      smartLinkOpenedAt: "2026-03-02T00:00:00Z",
      smartLinkSubmittedAt: "2026-03-03T00:00:00Z",
      dataOrigin: "supplier_verified",
      verificationChecks: FAIL,
    }),
    "submitted_failed_validation",
  );
});

/* ── isVerificationExpired — the single function LinkStatusChip (Precursors
   tab) and computeNodeStatus (Tree page) both call, so the two screens
   can't independently drift on what "expired" means. ─────────────────── */

test("isVerificationExpired: no date recorded is never treated as expired", () => {
  assert.equal(isVerificationExpired(undefined), false);
  assert.equal(isVerificationExpired(null), false);
  assert.equal(isVerificationExpired(""), false);
});

test("isVerificationExpired: a past date is expired, a future date is not", () => {
  assert.equal(isVerificationExpired("2000-01-01"), true);
  assert.equal(isVerificationExpired("2099-01-01"), false);
});

test("timestamps out of order still resolve by presence, not by chronology — the function trusts what is set, not when", () => {
  // Sent and opened but somehow no submit — still opened_in_progress, whatever the actual wall-clock order was.
  assert.equal(linkStatus({ smartLinkSentAt: "2026-03-05T00:00:00Z", smartLinkOpenedAt: "2026-03-01T00:00:00Z" }), "opened_in_progress");
});

/* ── valueType ──────────────────────────────────────────────── */

test("scrap is always actual — zero is the true figure, not a default standing in for one", () => {
  assert.equal(valueType({ isScrap: true, dataOrigin: "default_value" }), "actual");
});

test("default_value origin is always a default, whatever else is set", () => {
  assert.equal(valueType({ isScrap: false, dataOrigin: "default_value", verificationChecks: PASS }), "default");
});

test("supplier_unverified is always a default — no checks were ever claimed", () => {
  assert.equal(valueType({ isScrap: false, dataOrigin: "supplier_unverified" }), "default");
});

test("supplier_verified with no checks run yet is a default, not an actual pending upgrade", () => {
  assert.equal(valueType({ isScrap: false, dataOrigin: "supplier_verified" }), "default");
});

test("supplier_verified with all four checks passing is the only path to actual", () => {
  assert.equal(valueType({ isScrap: false, dataOrigin: "supplier_verified", verificationChecks: PASS }), "actual");
});

test("supplier_verified with a failed check is a default, not actual with a warning", () => {
  assert.equal(valueType({ isScrap: false, dataOrigin: "supplier_verified", verificationChecks: FAIL }), "default");
});

/* ── The full loop through saveSupplier, which is what actually stamps verificationChecks ── */

test("saving a purchased, verified precursor with no report drops it to default_value, and valueType agrees", () => {
  storage.clear();
  const s = saveSupplier({
    ...emptySupplier("ws-1", null),
    origin: "purchased",
    country: "TH",
    dataOrigin: "supplier_verified",
    // no verificationReportFileId, no reporting period — the 4-check gate has nothing to pass
  });
  assert.equal(s.dataOrigin, "default_value", "the mandatory fallback already downgrades the origin");
  assert.equal(valueType(s), "default");
});

test("saving a purchased, verified precursor with a report and period passes all four checks", () => {
  storage.clear();
  const s = saveSupplier({
    ...emptySupplier("ws-1", null),
    origin: "purchased",
    country: "TH",
    dataOrigin: "supplier_verified",
    verificationReportFileId: "ev-1",
    reportingPeriodStart: "2026-01-01",
    reportingPeriodEnd: "2026-12-31",
    verifierAccreditationExpiryDate: "2027-01-01",
    verificationReportIssueDate: "2026-06-01",
    verificationSectoralScope: "Iron and steel",
  });
  assert.equal(s.dataOrigin, "supplier_verified");
  assert.equal(valueType(s), "actual");
});

/* ── markLinkOpened / markLinkSubmitted ────────────────────────── */

test("markLinkOpened stamps the first open and never overwrites it", () => {
  storage.clear();
  const s = saveSupplier(emptySupplier("ws-1", null));
  const opened = markLinkOpened("ws-1", s.id);
  assert.ok(opened?.smartLinkOpenedAt);

  const first = opened!.smartLinkOpenedAt;
  const again = markLinkOpened("ws-1", s.id);
  assert.equal(again?.smartLinkOpenedAt, first, "a second open must not move the timestamp");
});

test("markLinkSubmitted stamps submission, moving the derived status to submitted_*", () => {
  storage.clear();
  const s = saveSupplier({ ...emptySupplier("ws-1", null), smartLinkSentAt: "2026-03-01T00:00:00Z" });
  markLinkOpened("ws-1", s.id);
  const submitted = markLinkSubmitted("ws-1", s.id);
  assert.ok(submitted?.smartLinkSubmittedAt);
  assert.equal(linkStatus(submitted!), "submitted_pending_validation");
});

/* ── lib/precursor-link.ts — stateless token round-trip ────────── */

test("a precursor link token round-trips workspace id and node id", () => {
  const token = makePrecursorLinkToken("ws-42", "ps-7");
  assert.deepEqual(decodePrecursorLinkToken(token), { workspaceId: "ws-42", precursorNodeId: "ps-7" });
});

test("a workspace token and a precursor token are never mistaken for each other", () => {
  const wsToken = makeWorkspaceToken("ws-42", "2026-03");
  assert.equal(decodePrecursorLinkToken(wsToken), null, "a ws| token must not decode as a pr| token");
});

test("garbage decodes to null rather than throwing", () => {
  assert.equal(decodePrecursorLinkToken("not-a-real-token"), null);
});

test("resolvePrecursorLink resolves a real workspace and node, and null for anything else", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-A", installationName: "Plant A", productId: "billet", productionRoute: "scrap_eaf", year: 2026 });
  const s = saveSupplier({ ...emptySupplier(ws.id, null), name: "Chonburi Foundry" });

  const token = makePrecursorLinkToken(ws.id, s.id);
  const resolved = resolvePrecursorLink(token);
  assert.equal(resolved?.workspace.id, ws.id);
  assert.equal(resolved?.node.id, s.id);

  assert.equal(resolvePrecursorLink(makePrecursorLinkToken("no-such-ws", s.id)), null);
  assert.equal(resolvePrecursorLink(makePrecursorLinkToken(ws.id, "no-such-node")), null);
});
