/* Widget A's aggregation — worst first, and every item points at the screen
   that fixes it. Each kind defers to the logic its own screen already uses
   (dueStateFor, linkStatus, awaitingBinding), so this file only checks that
   the WALK and the SORT are right, not that those underlying rules are —
   they have their own test files. */

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

const { actionQueueFor, PRECURSOR_STALE_DAYS } = await import(
  "../cbam/action-queue"
);
const { createWorkspace } = await import("../workspace");
const { markMonthSent } = await import("../month-dispatch");
const { saveSupplier, emptySupplier } = await import("../precursor-suppliers");

test("an empty account has nothing in the queue", () => {
  storage.clear();
  assert.deepEqual(actionQueueFor([]), []);
});

test("a month never sent for is never overdue — nothing to chase without a request", () => {
  storage.clear();
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2020,
  });
  const items = actionQueueFor([ws]);
  assert.equal(items.filter((i) => i.type === "monthly_data").length, 0);
});

test("a sent, unsubmitted, past-due month appears overdue and links to that month", () => {
  storage.clear();
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2020,
  });
  markMonthSent(ws.id, "2020-01", 15);
  const items = actionQueueFor([ws], new Date("2020-03-01"));
  const item = items.find((i) => i.type === "monthly_data");
  assert.ok(item);
  assert.equal(item!.deepLink, `/workspaces/${ws.id}/monthly/2020-01`);
  assert.ok(
    item!.daysUntilDue < 0,
    "an overdue item carries a negative days-until-due",
  );
});

test("overdue items sort worst-first, before due-soon items", () => {
  storage.clear();
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2020,
  });
  markMonthSent(ws.id, "2020-01", 15); // very overdue by March
  markMonthSent(ws.id, "2020-02", 15); // less overdue
  const items = actionQueueFor([ws], new Date("2020-03-20"));
  const monthly = items.filter((i) => i.type === "monthly_data");
  assert.equal(monthly.length, 2);
  assert.ok(
    monthly[0].daysUntilDue <= monthly[1].daysUntilDue,
    "most overdue (most negative) sorts first",
  );
});

test("a precursor invite under the stale threshold does not appear", () => {
  storage.clear();
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2026,
  });
  const sentAt = new Date();
  sentAt.setDate(sentAt.getDate() - (PRECURSOR_STALE_DAYS - 2));
  saveSupplier({
    ...emptySupplier(ws.id, null),
    name: "Chonburi Foundry",
    smartLinkSentAt: sentAt.toISOString(),
  });
  const items = actionQueueFor([ws]);
  assert.equal(items.filter((i) => i.type === "precursor_invite").length, 0);
});

test("a precursor invite past the stale threshold appears and links to the Precursors tab", () => {
  storage.clear();
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2026,
  });
  const sentAt = new Date();
  sentAt.setDate(sentAt.getDate() - (PRECURSOR_STALE_DAYS + 2));
  saveSupplier({
    ...emptySupplier(ws.id, null),
    name: "Chonburi Foundry",
    smartLinkSentAt: sentAt.toISOString(),
  });
  const items = actionQueueFor([ws]);
  const item = items.find((i) => i.type === "precursor_invite");
  assert.ok(item);
  assert.equal(item!.deepLink, `/workspaces/${ws.id}/precursors`);
});

test("a submitted precursor is never in the queue, however long ago it was sent", () => {
  storage.clear();
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2026,
  });
  const sentAt = new Date();
  sentAt.setDate(sentAt.getDate() - 60);
  saveSupplier({
    ...emptySupplier(ws.id, null),
    name: "Chonburi Foundry",
    smartLinkSentAt: sentAt.toISOString(),
    smartLinkOpenedAt: sentAt.toISOString(),
    smartLinkSubmittedAt: sentAt.toISOString(),
  });
  const items = actionQueueFor([ws]);
  assert.equal(items.filter((i) => i.type === "precursor_invite").length, 0);
});

test("scrap precursors are never chased for a response — nothing to verify", () => {
  storage.clear();
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2026,
  });
  const sentAt = new Date();
  sentAt.setDate(sentAt.getDate() - 60);
  saveSupplier({
    ...emptySupplier(ws.id, null),
    name: "Scrap Co",
    isScrap: true,
    smartLinkSentAt: sentAt.toISOString(),
  });
  const items = actionQueueFor([ws]);
  assert.equal(items.filter((i) => i.type === "precursor_invite").length, 0);
});

test("every item names the workspace it belongs to", () => {
  storage.clear();
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2020,
  });
  markMonthSent(ws.id, "2020-01", 15);
  const items = actionQueueFor([ws], new Date("2020-03-01"));
  assert.ok(
    items.every(
      (i) => i.workspaceId === ws.id && i.workspaceLabel === ws.productName,
    ),
  );
});

/* ── §3 — the precursor SEE & verification deadline (1 August) ──── */

test("a workspace with no precursors never carries a precursor-deadline item", () => {
  storage.clear();
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2026,
  });
  const items = actionQueueFor([ws], new Date(2027, 7, 15)); // well past 1 August 2027
  assert.equal(items.filter((i) => i.type === "precursor_deadline").length, 0);
});

test("well before the deadline, an unverified precursor raises nothing", () => {
  storage.clear();
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2026,
  });
  saveSupplier({ ...emptySupplier(ws.id, null), name: "Chonburi Foundry" });
  const items = actionQueueFor([ws], new Date(2026, 2, 1)); // March 2026, deadline is 1 Aug 2027
  assert.equal(items.filter((i) => i.type === "precursor_deadline").length, 0);
});

test("once the deadline has passed, an unverified precursor raises exactly one item for the whole workspace", () => {
  storage.clear();
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2026,
  });
  saveSupplier({ ...emptySupplier(ws.id, null), name: "Chonburi Foundry" });
  saveSupplier({ ...emptySupplier(ws.id, null), name: "Eastern Mill" });
  const items = actionQueueFor([ws], new Date(2027, 7, 15)); // mid-August 2027, past 1 August
  const deadlineItems = items.filter((i) => i.type === "precursor_deadline");
  assert.equal(
    deadlineItems.length,
    1,
    "one item per WORKSPACE, not per precursor node",
  );
  assert.ok(
    deadlineItems[0].label.includes("2"),
    "names how many precursors are still unverified",
  );
  assert.ok(
    deadlineItems[0].daysUntilDue < 0,
    "past the deadline reads as overdue",
  );
});

test("once every precursor in the chain is verified, the deadline item disappears even though the date has passed", () => {
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
    name: "Chonburi Foundry",
    dataOrigin: "supplier_verified",
    verificationReportFileId: "ev-1",
    reportingPeriodStart: ws.periodStart,
    reportingPeriodEnd: ws.periodEnd,
    verifierAccreditationExpiryDate: "2030-01-01",
    verificationReportIssueDate: ws.periodStart,
    verificationSectoralScope: "Iron and steel",
    verificationCoverageStart: ws.periodStart,
    verificationCoverageEnd: ws.periodEnd,
    verifierName: "Example verifier",
    verifierAccreditationNumber: "EX-123",
    verifierAccreditationIssuingCountry: "TH",
    smartLinkSentAt: ws.periodStart,
    smartLinkOpenedAt: ws.periodStart,
    smartLinkSubmittedAt: ws.periodStart,
  });
  const items = actionQueueFor([ws], new Date(2027, 7, 15));
  assert.equal(items.filter((i) => i.type === "precursor_deadline").length, 0);
});
