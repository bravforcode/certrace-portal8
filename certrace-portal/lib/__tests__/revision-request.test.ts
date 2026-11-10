/* ════════════════════════════════════════════════════════════
   REQUESTING A REVISION — which half of it is local

   A revision request is two writes, and they do not belong to the same place:

     THE SUPPLIER'S HALF — status back to `revision_requested`, the fields and
     documents that reopen, the note. This is the supplier's own state. With a
     backend wired up it lives on the SERVER, because the supplier filled the
     link on their own machine; writing it into the exporter's localStorage
     reopens nothing they will ever see. That is the bug this split exists to
     make impossible: the exporter's screen would say "revision requested"
     while the supplier's link stayed submitted and read-only.

     THE EXPORTER'S HALF — their record of the decision: lifecycle, comment,
     which items they picked. The backend API does not carry it, so it
     is local in BOTH modes.

   So recordRevisionDecision must write the second and never the first, and
   requestRevision — the no-backend demo path, where the supplier's state
   genuinely is in this browser — must still write both.
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

const { requestRevision, recordRevisionDecision, loadExporterState } =
  await import("../exporter-review");
const { makeToken } = await import("../supplier");
const { loadState } = await import("../supplier-store");

const DECL = "cbam-2026-q2-steel";
const SUPPLIER = "s2";
const PAYLOAD = {
  fields: ["direct_emissions", "electricity_consumed"],
  docs: ["mill_test_certificate"],
  comment:
    "Direct emissions look high for an EAF route — please confirm actual vs default.",
};

const supplierKey = `certrace:supplier:${makeToken(DECL, SUPPLIER)}`;

test("the demo path writes both halves — the supplier's link reopens in this browser", () => {
  storage.clear();

  const exporter = requestRevision(DECL, SUPPLIER, 2, PAYLOAD);

  const supplier = loadState(makeToken(DECL, SUPPLIER));
  assert.equal(supplier.status, "revision_requested");
  assert.deepEqual(supplier.unlocked, PAYLOAD.fields);
  assert.deepEqual(supplier.unlockedDocs, PAYLOAD.docs);
  assert.equal(supplier.revisionNote, PAYLOAD.comment);
  /* The trail is appended, never derived: the supplier sees who asked and for
     what when they reopen, and the verifier sees it in the package. */
  assert.equal(supplier.events.at(-1)?.kind, "revision_requested");

  const review = exporter.reviews[SUPPLIER];
  assert.equal(review?.decision, "changes_requested");
  assert.equal(review?.decidedVersion, 2);
  assert.deepEqual(review?.unlockedFields, PAYLOAD.fields);
});

test("recordRevisionDecision records the exporter's half and leaves the supplier's state alone", () => {
  storage.clear();

  const exporter = recordRevisionDecision(DECL, SUPPLIER, 2, PAYLOAD);

  const review = exporter.reviews[SUPPLIER];
  assert.equal(review?.decision, "changes_requested");
  assert.equal(review?.decidedVersion, 2);
  assert.equal(review?.comment, PAYLOAD.comment);
  assert.deepEqual(review?.unlockedFields, PAYLOAD.fields);
  assert.deepEqual(review?.unlockedDocs, PAYLOAD.docs);

  /* The point of the whole split. Not "the state is unchanged" — the key is
     never written at all, so there is no local copy to drift from what the
     server stored, and no stale unlocked set for a later demo read to find. */
  assert.equal(storage.getItem(supplierKey), null);
});

test("the exporter's decision survives being recorded twice — a retried send is not a second decision", () => {
  storage.clear();

  recordRevisionDecision(DECL, SUPPLIER, 2, PAYLOAD);
  const second = recordRevisionDecision(DECL, SUPPLIER, 2, {
    ...PAYLOAD,
    fields: ["direct_emissions"],
  });

  const review = second.reviews[SUPPLIER];
  assert.deepEqual(review?.unlockedFields, ["direct_emissions"]);
  assert.equal(Object.keys(second.reviews).length, 1);
  assert.equal(
    loadExporterState(DECL).reviews[SUPPLIER]?.unlockedFields.length,
    1,
  );
});
