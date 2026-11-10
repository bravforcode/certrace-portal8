/* Regressions for two crashes on the declaration review/filing screen:
   1. resolveSubmissions() crashed for a server-backed declaration (id
      `decl-<uuid>`) because it re-looked-up getDeclaration(), which only knows
      the bundled fixtures — the id was absent, resolveRequest(token)! was null,
      and the next deref threw.
   2. loadExporterState() shallow-merged a persisted blob, so a partial/legacy
      one could drop dispatch.acknowledgedAt / a recipients key, and the
      component then dereferenced undefined. */

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

const { DECLARATIONS } = await import("./fixtures/declaration");
const { resolveSubmissions, loadExporterState } = await import(
  "../exporter-review"
);
const { listSupplierRows } = await import("../supplier-directory");

test("an empty account does not inherit bundled suppliers or fabricated submissions", () => {
  storage.clear();
  assert.deepEqual(listSupplierRows(), []);
  const decl = { ...DECLARATIONS[0], id: "decl-empty-account" };
  const submittedFixture = decl.suppliers.find(
    (row) => row.status === "submitted",
  );
  assert.ok(submittedFixture);
  const submission = resolveSubmissions(decl, loadExporterState(decl.id)).find(
    (row) => row.supplier.id === submittedFixture.id,
  );
  assert.ok(submission);
  assert.equal(submission.submitted, false);
  assert.deepEqual(submission.values, {});
  assert.deepEqual(submission.docs, {});
});

test("resolveSubmissions resolves a server-backed (non-fixture) declaration id without crashing", () => {
  const base = DECLARATIONS[0];
  assert.ok(base.suppliers.length > 0, "need a declaration with supplier rows");
  // A wizard/server declaration carries id `decl-<uuid>`, absent from the
  // bundled fixtures — the old resolveRequest(token)! returned null and threw.
  const decl = { ...base, id: "decl-not-in-fixtures-0001" };
  const exporter = loadExporterState(decl.id);

  const subs = resolveSubmissions(decl, exporter);

  assert.equal(subs.length, decl.suppliers.length);
  for (const s of subs) assert.ok(s.token, "each submission carries its token");
});

test("loadExporterState deep-defaults dispatch/recipients from a partial persisted blob", () => {
  const declId = "decl-partial-0002";
  // Legacy blob: a dispatch object missing acknowledgedAt, and no recipients.
  storage.setItem(
    `certrace:exporter:${declId}`,
    JSON.stringify({ dispatch: { o3ciPushedAt: null, templateSentAt: null } }),
  );

  const st = loadExporterState(declId);

  assert.ok(
    st.dispatch.acknowledgedAt &&
      typeof st.dispatch.acknowledgedAt === "object",
    "acknowledgedAt defaulted",
  );
  assert.equal(st.recipients.buyer, true, "recipients defaulted");
});
