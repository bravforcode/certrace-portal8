/* What the portal tells the server may be chased (R4).

   The interesting cases are the ones where an ask must NOT be registered, and
   the one field the job cannot compute for itself.

   A month with nobody to write to is not an error and must not be reported as
   one: an exporter reporting their own site has no supplier, and a supplier
   whose contact has never been filled in is a gap on the suppliers screen, not
   a failure of the send. Both simply produce nothing to chase. */

import { test } from "node:test";
import assert from "node:assert/strict";

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
}

const storage = new MemoryStorage();
const g = globalThis as unknown as { window?: unknown; localStorage?: unknown };
g.window = {
  localStorage: storage,
  location: { origin: "https://portal.certrace.co" },
};
g.localStorage = storage;

const { reminderSubjectFor, reminderSubjectKey } = await import(
  "../reminder-registration"
);
const { createWorkspace } = await import("../workspace");
const { saveSupplierCompany } = await import("../supplier-companies");

function seed(
  over: Record<string, unknown> = {},
  supplier: Record<string, unknown> | null = {},
) {
  storage.clear();
  let supplierId: string | undefined;
  if (supplier) {
    const saved = saveSupplierCompany({
      id: "",
      name: "Xingda Steel Cord (Thailand)",
      country: "TH",
      contactName: "Khun Malee",
      contactEmail: "plant@xingdathai.com",
      contactPhone: "",
      createdAt: new Date().toISOString(),
      ...supplier,
    } as never);
    supplierId = saved.id;
  }
  const workspace = createWorkspace({
    installationId: "inst-1",
    installationName: "Rayong plant",
    productId: "hrc",
    productionRoute: "EAF",
    year: 2026,
    supplierId,
    supplierName: "Xingda Steel Cord (Thailand)",
    ...over,
  } as never);
  return workspace;
}

test("an ask carries the label and deadline the job cannot work out itself", () => {
  const workspace = seed();
  const subject = reminderSubjectFor(
    workspace.id,
    "2026-03",
    "en",
    "https://portal.certrace.co/w/server-issued-token",
  );

  assert.ok(subject, "a workspace with a contactable supplier is chaseable");
  assert.equal(subject.key, reminderSubjectKey(workspace.id, "2026-03"));
  assert.equal(subject.body.recipient, "plant@xingdathai.com");
  /* Written for a reader, not a date: the job composing the email does not
     know the recipient's language well enough to format one. */
  assert.match(String(subject.body.periodLabel), /March/);
  /* The deadline falls in the month AFTER the one being reported — March data
     is due in April — which is the off-by-one worth pinning. */
  assert.match(String(subject.body.dueDate), /^2026-04-/);
  /* Absolute: a job writing an email has no origin to resolve a path against. */
  assert.match(
    String(subject.body.linkUrl),
    /^https:\/\/portal\.certrace\.co\/w\//,
  );
  assert.equal(subject.body.locale, "en");
});

test("a reminder is not registered with a browser-only link", () => {
  const workspace = seed();
  assert.equal(reminderSubjectFor(workspace.id, "2026-03", "en"), null);
});

test("the subject key is stable across sends", () => {
  /* It is the delivery log's key on the server. A new id per send would make
     every rung of the ladder look unsent, and re-send the whole thing nightly. */
  assert.equal(
    reminderSubjectKey("ws-1", "2026-03"),
    reminderSubjectKey("ws-1", "2026-03"),
  );
  assert.notEqual(
    reminderSubjectKey("ws-1", "2026-03"),
    reminderSubjectKey("ws-1", "2026-04"),
  );
});

test("a self-supplied workspace has nobody to chase", () => {
  const workspace = seed({ selfSupplied: true });
  assert.equal(reminderSubjectFor(workspace.id, "2026-03"), null);
});

test("a supplier with no email on file is skipped rather than half-registered", () => {
  /* The server refuses a recipient that is not an address, so registering one
     would turn an ordinary gap in a supplier record into a failed request in
     the middle of sending a month. */
  const workspace = seed({}, { contactEmail: "   " });
  assert.equal(reminderSubjectFor(workspace.id, "2026-03"), null);
});

test("a workspace with no supplier at all is skipped", () => {
  const workspace = seed({ supplierId: undefined }, null);
  assert.equal(reminderSubjectFor(workspace.id, "2026-03"), null);
});

test("an unknown workspace does not throw", () => {
  assert.equal(reminderSubjectFor("ws-does-not-exist", "2026-03"), null);
});
