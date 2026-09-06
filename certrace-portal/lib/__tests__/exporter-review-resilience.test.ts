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

const { DECLARATIONS } = await import("../data");
const { resolveSubmissions, loadExporterState } = await import("../exporter-review");

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
  storage.setItem(`certrace:exporter:${declId}`, JSON.stringify({ dispatch: { o3ciPushedAt: null, templateSentAt: null } }));

  const st = loadExporterState(declId);

  assert.ok(st.dispatch.acknowledgedAt && typeof st.dispatch.acknowledgedAt === "object", "acknowledgedAt defaulted");
  assert.equal(st.recipients.buyer, true, "recipients defaulted");
});
