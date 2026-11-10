/* ════════════════════════════════════════════════════════════
   descendantsOf, matchesExistingInstallation, and the /p/<token> portal's
   submit-time batch-stamp rule — Section 9, the recursive Entity Portal.

   The batch-stamp rule itself has no exported function (it lives inline in
   app/p/[token]/page.tsx's submit()); it is exercised here as a pure
   scenario over saveSupplier/descendantsOf/precursorSubmissionGaps, the
   exact same building blocks the page uses, so a regression in the rule's
   LOGIC is caught here even though the page's own JSX isn't rendered.
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

const {
  descendantsOf,
  matchesExistingInstallation,
  emptySupplier,
  saveSupplier,
  precursorSubmissionGaps,
} = await import("../precursor-suppliers");
const { createWorkspace } = await import("../workspace");
const { emptyInstallation, saveInstallation } = await import(
  "../installations"
);

function ws() {
  const w = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2026,
  });
  saveInstallation({ ...emptyInstallation(true), id: "TH-A", name: "Plant A" });
  return w;
}

/* A row that passes every check precursorSubmissionGaps runs — mirrors
   supplier-tree.test.ts's own "genuinely verified" fixture, plus the
   quantity field that gate also requires. */
const complete = {
  dataOrigin: "supplier_verified" as const,
  productionRoute: "Route A",
  // The installation identity the submission gate also requires — see
  // precursorRequirements' "submission" scope.
  installationUniqueId: "TH-CHON-0042",
  unlocode: "THLCH",
  fullAddress: "88 Moo 4, Sriracha, Chonburi 20230, Thailand",
  latitude: 13.1,
  longitude: 100.9,
  specificEmbeddedDirectTco2PerT: 1.2,
  specificEmbeddedIndirectTco2PerT: 0.3,
  reportingPeriodStart: "2026-01-01",
  reportingPeriodEnd: "2026-12-31",
  verificationCoverageStart: "2026-01-01",
  verificationCoverageEnd: "2026-12-31",
  qtyPerTonneOverride: 1.05,
  verificationReportFileId: "ev-1",
  verifierName: "Bureau Veritas",
  verifierAccreditationNumber: "TH-1",
  verifierAccreditationIssuingCountry: "TH",
  verifierAccreditationExpiryDate: "2027-01-01",
  verificationReportIssueDate: "2026-06-01",
  verificationSectoralScope: "Iron or steel products",
};

/* ── descendantsOf ────────────────────────────────────────────── */

test("descendantsOf returns direct and transitive children, depth-first, never the root itself", () => {
  storage.clear();
  const w = ws();
  saveSupplier({
    ...emptySupplier(w.id),
    id: "a",
    name: "A",
    installationName: "A plant",
    precursorName: "X",
    cnCode: "1",
  });
  saveSupplier({
    ...emptySupplier(w.id, "a"),
    id: "b",
    name: "B",
    installationName: "B plant",
    precursorName: "Y",
    cnCode: "2",
  });
  saveSupplier({
    ...emptySupplier(w.id, "b"),
    id: "c",
    name: "C",
    installationName: "C plant",
    precursorName: "Z",
    cnCode: "3",
  });

  const ids = descendantsOf(w.id, "a").map((n) => n.id);
  assert.deepEqual(ids.sort(), ["b", "c"]);
});

test("descendantsOf is empty for a leaf node", () => {
  storage.clear();
  const w = ws();
  saveSupplier({
    ...emptySupplier(w.id),
    id: "a",
    name: "A",
    installationName: "A plant",
    precursorName: "X",
    cnCode: "1",
  });
  assert.deepEqual(descendantsOf(w.id, "a"), []);
});

/* ── matchesExistingInstallation ──────────────────────────────── */

test("matchesExistingInstallation matches by unique ID against another row", () => {
  storage.clear();
  const w = ws();
  saveSupplier({
    ...emptySupplier(w.id),
    id: "a",
    name: "A",
    installationName: "A plant",
    precursorName: "X",
    cnCode: "1",
    installationUniqueId: "ID-1",
  });
  assert.equal(
    matchesExistingInstallation(w.id, {
      id: "new",
      installationUniqueId: "ID-1",
    }),
    true,
  );
});

test("matchesExistingInstallation matches by UN/LOCODE against another row", () => {
  storage.clear();
  const w = ws();
  saveSupplier({
    ...emptySupplier(w.id),
    id: "a",
    name: "A",
    installationName: "A plant",
    precursorName: "X",
    cnCode: "1",
    unlocode: "THLCH",
  });
  assert.equal(
    matchesExistingInstallation(w.id, { id: "new", unlocode: "THLCH" }),
    true,
  );
});

test("matchesExistingInstallation is false when no identity is given, and false when the identity is genuinely new", () => {
  storage.clear();
  const w = ws();
  saveSupplier({
    ...emptySupplier(w.id),
    id: "a",
    name: "A",
    installationName: "A plant",
    precursorName: "X",
    cnCode: "1",
    installationUniqueId: "ID-1",
  });
  assert.equal(
    matchesExistingInstallation(w.id, { id: "new" }),
    false,
    "no identity typed — nothing to match",
  );
  assert.equal(
    matchesExistingInstallation(w.id, {
      id: "new",
      installationUniqueId: "ID-2",
    }),
    false,
    "a different id is not a match",
  );
});

/* ── the submit-time batch-stamp rule (as a pure scenario) ───────── */

function batchStamp(workspaceId: string, rootNodeId: string) {
  const now = new Date().toISOString();
  descendantsOf(workspaceId, rootNodeId)
    .filter((n) => !n.smartLinkToken && precursorSubmissionGaps(n).length === 0)
    .forEach((n) =>
      saveSupplier({
        ...n,
        dataOrigin:
          n.dataOrigin === "default_value" ? n.dataOrigin : "supplier_verified",
        smartLinkSentAt: n.smartLinkSentAt ?? now,
        smartLinkOpenedAt: n.smartLinkOpenedAt ?? now,
        smartLinkSubmittedAt: now,
      }),
    );
}

test("a complete, never-sent child gets all three lifecycle timestamps stamped together", () => {
  storage.clear();
  const w = ws();
  saveSupplier({
    ...emptySupplier(w.id),
    id: "root",
    name: "Root",
    installationName: "Root plant",
    precursorName: "X",
    cnCode: "72011000",
    ...complete,
  });
  saveSupplier({
    ...emptySupplier(w.id, "root"),
    id: "child",
    name: "Child",
    installationName: "Child plant",
    precursorName: "Y",
    cnCode: "72011000",
    ...complete,
  });

  batchStamp(w.id, "root");

  const rows = JSON.parse(storage.getItem("certrace:precursor-suppliers")!)[
    w.id
  ] as Array<Record<string, unknown>>;
  const child = rows.find((r) => r.id === "child")!;
  assert.ok(child.smartLinkSentAt);
  assert.ok(child.smartLinkOpenedAt);
  assert.ok(child.smartLinkSubmittedAt);
  assert.equal(child.dataOrigin, "supplier_verified");
});

test("a child that already carries a real smartLinkToken is left untouched", () => {
  storage.clear();
  const w = ws();
  saveSupplier({
    ...emptySupplier(w.id),
    id: "root",
    name: "Root",
    installationName: "Root plant",
    precursorName: "X",
    cnCode: "72011000",
    ...complete,
  });
  saveSupplier({
    ...emptySupplier(w.id, "root"),
    id: "child",
    name: "Child",
    installationName: "Child plant",
    precursorName: "Y",
    cnCode: "72011000",
    ...complete,
    smartLinkToken: "real-token",
  });

  batchStamp(w.id, "root");

  const rows = JSON.parse(storage.getItem("certrace:precursor-suppliers")!)[
    w.id
  ] as Array<Record<string, unknown>>;
  const child = rows.find((r) => r.id === "child")!;
  assert.equal(
    child.smartLinkSentAt,
    undefined,
    "a node with a real invite lifecycle must never be re-stamped by the parent's submit",
  );
});

test("an incomplete child is left as an identity-only stub", () => {
  storage.clear();
  const w = ws();
  saveSupplier({
    ...emptySupplier(w.id),
    id: "root",
    name: "Root",
    installationName: "Root plant",
    precursorName: "X",
    cnCode: "72011000",
    ...complete,
  });
  saveSupplier({
    ...emptySupplier(w.id, "root"),
    id: "child",
    name: "Child",
    installationName: "Child plant",
    precursorName: "Y",
    cnCode: "2",
  });

  batchStamp(w.id, "root");

  const rows = JSON.parse(storage.getItem("certrace:precursor-suppliers")!)[
    w.id
  ] as Array<Record<string, unknown>>;
  const child = rows.find((r) => r.id === "child")!;
  assert.equal(child.smartLinkSentAt, undefined);
});

test("a resubmit does not move an already-stamped-in-session child's sentAt/openedAt, but does move submittedAt", async () => {
  storage.clear();
  const w = ws();
  saveSupplier({
    ...emptySupplier(w.id),
    id: "root",
    name: "Root",
    installationName: "Root plant",
    precursorName: "X",
    cnCode: "72011000",
    ...complete,
  });
  saveSupplier({
    ...emptySupplier(w.id, "root"),
    id: "child",
    name: "Child",
    installationName: "Child plant",
    precursorName: "Y",
    cnCode: "72011000",
    ...complete,
  });

  batchStamp(w.id, "root");
  const rowsAfterFirst = JSON.parse(
    storage.getItem("certrace:precursor-suppliers")!,
  )[w.id] as Array<Record<string, unknown>>;
  const firstSentAt = rowsAfterFirst.find(
    (r) => r.id === "child",
  )!.smartLinkSentAt;
  const firstSubmittedAt = rowsAfterFirst.find(
    (r) => r.id === "child",
  )!.smartLinkSubmittedAt;

  await new Promise((r) => setTimeout(r, 5)); // force a distinct millisecond for submittedAt
  batchStamp(w.id, "root");
  const rowsAfterSecond = JSON.parse(
    storage.getItem("certrace:precursor-suppliers")!,
  )[w.id] as Array<Record<string, unknown>>;
  const second = rowsAfterSecond.find((r) => r.id === "child")!;

  assert.equal(
    second.smartLinkSentAt,
    firstSentAt,
    "sentAt is only ever set once",
  );
  assert.notEqual(
    second.smartLinkSubmittedAt,
    firstSubmittedAt,
    "each resubmit re-stamps submittedAt — a corrected answer is still a submission",
  );
});
