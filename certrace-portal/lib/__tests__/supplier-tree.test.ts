/* ════════════════════════════════════════════════════════════
   computeNodeStatus() and the tree read-model — Foundation Pack Section A

   The one rule under test throughout: status is DERIVED from underlying
   data on every call, never a stored flag. Every test here changes
   underlying data and re-reads, rather than ever writing a status directly.
   ════════════════════════════════════════════════════════════ */

import { test } from "node:test";
import assert from "node:assert/strict";
import { verifiedReport } from "./precursor-test-fixtures";

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
  buildSupplierPrecursorTree,
  buildPrecursorSubtree,
  computeNodeStatus,
  precursorEntityId,
} = await import("../supplier-tree");
const { wouldCreateCycle } = await import("../cbam/tree-validation");
const { createWorkspace } = await import("../workspace");
const { emptySupplier, saveSupplier } = await import("../precursor-suppliers");
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

function findByName(
  nodes: import("../../types/supplier-tree").TreeNode[],
  name: string,
): import("../../types/supplier-tree").TreeNode {
  for (const n of nodes) {
    if (n.name === name) return n;
    const found = findByName(n.children, name);
    if (found) return found;
  }
  throw new Error(`no node named ${name}`);
}

/* ── computeNodeStatus ──────────────────────────────────────── */

test("a precursor with no Smart Link sent reads NOT_SENT", () => {
  storage.clear();
  const w = ws();
  saveSupplier({
    ...emptySupplier(w.id),
    id: "p1",
    name: "Foundry X",
    installationName: "Foundry X plant",
    precursorName: "Pig iron",
    cnCode: "72011000",
  });

  const status = computeNodeStatus(
    findByName(buildSupplierPrecursorTree(w.id), "Foundry X"),
  );
  assert.equal(status, "NOT_SENT");
});

test("sent but not opened reads SENT_PENDING; opened but not submitted reads IN_PROGRESS", () => {
  storage.clear();
  const w = ws();
  saveSupplier({
    ...emptySupplier(w.id),
    id: "p1",
    name: "Foundry X",
    installationName: "Foundry X plant",
    precursorName: "Pig iron",
    cnCode: "72011000",
    smartLinkSentAt: new Date().toISOString(),
  });
  assert.equal(
    computeNodeStatus(
      findByName(buildSupplierPrecursorTree(w.id), "Foundry X"),
    ),
    "SENT_PENDING",
  );

  saveSupplier({
    ...emptySupplier(w.id),
    id: "p1",
    name: "Foundry X",
    installationName: "Foundry X plant",
    precursorName: "Pig iron",
    cnCode: "72011000",
    smartLinkSentAt: new Date().toISOString(),
    smartLinkOpenedAt: new Date().toISOString(),
  });
  assert.equal(
    computeNodeStatus(
      findByName(buildSupplierPrecursorTree(w.id), "Foundry X"),
    ),
    "IN_PROGRESS",
  );
});

test("submitted with no report reads SUBMITTED_PENDING_VERIFICATION", () => {
  storage.clear();
  const w = ws();
  saveSupplier({
    ...emptySupplier(w.id),
    id: "p1",
    name: "Foundry X",
    installationName: "Foundry X plant",
    precursorName: "Pig iron",
    cnCode: "72011000",
    smartLinkSentAt: new Date().toISOString(),
    smartLinkOpenedAt: new Date().toISOString(),
    smartLinkSubmittedAt: new Date().toISOString(),
  });
  assert.equal(
    computeNodeStatus(
      findByName(buildSupplierPrecursorTree(w.id), "Foundry X"),
    ),
    "SUBMITTED_PENDING_VERIFICATION",
  );
});

// Passes every check validateVerificationReport() runs — this is the ONLY
// combination that reaches the app's real "verified" state (dataOrigin
// stays "supplier_verified" rather than saveSupplier's mandatory fallback
// dropping it to "default_value"). A file id alone is not enough; see the
// next test for the case that gets this wrong.
const genuinelyVerified = {
  smartLinkSentAt: new Date().toISOString(),
  smartLinkOpenedAt: new Date().toISOString(),
  smartLinkSubmittedAt: new Date().toISOString(),
  dataOrigin: "supplier_verified" as const,
  ...verifiedReport(),
};

test("a verification report with a future expiry reads VERIFIED; a past one reads VERIFICATION_EXPIRED — no manual status write, only the date changed", () => {
  storage.clear();
  const w = ws();
  const base = {
    ...emptySupplier(w.id),
    id: "p1",
    name: "Foundry X",
    installationName: "Foundry X plant",
    precursorName: "Pig iron",
    cnCode: "72011000",
    ...genuinelyVerified,
  };

  saveSupplier({ ...base, verificationReportExpiresAt: "2099-01-01" });
  assert.equal(
    computeNodeStatus(
      findByName(buildSupplierPrecursorTree(w.id), "Foundry X"),
    ),
    "VERIFIED",
  );

  saveSupplier({ ...base, verificationReportExpiresAt: "2000-01-01" });
  assert.equal(
    computeNodeStatus(
      findByName(buildSupplierPrecursorTree(w.id), "Foundry X"),
    ),
    "VERIFICATION_EXPIRED",
  );
});

test("a report on file with no expiry date recorded yet is not treated as expired", () => {
  storage.clear();
  const w = ws();
  saveSupplier({
    ...emptySupplier(w.id),
    id: "p1",
    name: "Foundry X",
    installationName: "Foundry X plant",
    precursorName: "Pig iron",
    cnCode: "72011000",
    ...genuinelyVerified,
  });
  assert.equal(
    computeNodeStatus(
      findByName(buildSupplierPrecursorTree(w.id), "Foundry X"),
    ),
    "VERIFIED",
  );
});

test("a verification report file attached with no passing verification claim behind it reads SUBMITTED_PENDING_VERIFICATION, not VERIFIED — a file id alone does not mean verified", () => {
  storage.clear();
  const w = ws();
  saveSupplier({
    ...emptySupplier(w.id),
    id: "p1",
    name: "Foundry X",
    installationName: "Foundry X plant",
    precursorName: "Pig iron",
    cnCode: "72011000",
    smartLinkSentAt: new Date().toISOString(),
    smartLinkOpenedAt: new Date().toISOString(),
    smartLinkSubmittedAt: new Date().toISOString(),
    verificationReportFileId: "ev-1",
    verificationReportExpiresAt: "2099-01-01",
    // dataOrigin left at its default ("supplier_unverified") — the claim
    // was never actually made, only a file was attached.
  });
  assert.equal(
    computeNodeStatus(
      findByName(buildSupplierPrecursorTree(w.id), "Foundry X"),
    ),
    "SUBMITTED_PENDING_VERIFICATION",
  );
});

test("a failed-validation submission reads BLOCKED, not VERIFIED or SUBMITTED_PENDING_VERIFICATION", () => {
  storage.clear();
  const w = ws();
  saveSupplier({
    ...emptySupplier(w.id),
    id: "p1",
    name: "Foundry X",
    installationName: "Foundry X plant",
    precursorName: "Pig iron",
    cnCode: "72011000",
    smartLinkSentAt: new Date().toISOString(),
    smartLinkOpenedAt: new Date().toISOString(),
    smartLinkSubmittedAt: new Date().toISOString(),
    dataOrigin: "supplier_verified",
    verificationChecks: {
      accreditationValid: false,
      sectoralScopeMatch: true,
      periodCovered: true,
      fileIntact: true,
      failedReasons: ["accreditation expired before the report was issued"],
    },
  });
  assert.equal(
    computeNodeStatus(
      findByName(buildSupplierPrecursorTree(w.id), "Foundry X"),
    ),
    "BLOCKED",
  );
});

/* ── precursorEntityId ──────────────────────────────────────── */

test("precursorEntityId prefers installationUniqueId over the name composite", () => {
  const a = precursorEntityId({
    installationUniqueId: "  ABC-123  ",
    name: "X",
    installationName: "X plant",
    country: "TH",
  });
  const b = precursorEntityId({
    installationUniqueId: "abc-123",
    name: "Different name entirely",
    installationName: "Different plant",
    country: "VN",
  });
  assert.equal(
    a,
    b,
    "the same installation id is the same entity regardless of how the name was typed",
  );
});

test("precursorEntityId falls back to name+installation+country when no installationUniqueId is on file", () => {
  const a = precursorEntityId({
    name: "Foundry X",
    installationName: "Foundry X plant",
    country: "TH",
  });
  const b = precursorEntityId({
    name: "Foundry Y",
    installationName: "Foundry Y plant",
    country: "TH",
  });
  assert.notEqual(a, b);
});

/* ── wouldCreateCycle — instance-based, not CN-code-based ────── */

test("the same entity appearing twice in one ancestor chain is blocked, and the conflicting node is named", () => {
  storage.clear();
  const w = ws();
  // A (direct input) -> B (Supplier X, rebar). Then check: can Supplier X
  // (same entity) be added again UNDER B?
  saveSupplier({
    ...emptySupplier(w.id),
    id: "a",
    name: "Supplier X",
    installationName: "Supplier X plant",
    installationUniqueId: "SX-1",
    precursorName: "Rebar",
    cnCode: "73181500",
  });

  const tree = buildSupplierPrecursorTree(w.id);
  const nodeA = findByName(tree, "Supplier X");
  const candidateEntityId = precursorEntityId({
    installationUniqueId: "SX-1",
    name: "Supplier X",
    installationName: "Supplier X plant",
    country: "TH",
  });

  const result = wouldCreateCycle(tree, nodeA.id, candidateEntityId);
  assert.equal(result.cycle, true);
  assert.equal(result.conflictingNode?.name, "Supplier X");
});

test("the same CN code from a genuinely different entity is allowed", () => {
  storage.clear();
  const w = ws();
  saveSupplier({
    ...emptySupplier(w.id),
    id: "a",
    name: "Supplier X",
    installationName: "Supplier X plant",
    installationUniqueId: "SX-1",
    precursorName: "Rebar",
    cnCode: "73181500",
  });

  const tree = buildSupplierPrecursorTree(w.id);
  const nodeA = findByName(tree, "Supplier X");
  const candidateEntityId = precursorEntityId({
    installationUniqueId: "SY-1",
    name: "Supplier Y",
    installationName: "Supplier Y plant",
    country: "TH",
  });

  const result = wouldCreateCycle(tree, nodeA.id, candidateEntityId);
  assert.equal(
    result.cycle,
    false,
    "same CN code, different real supplier — must be allowed",
  );
});

/* ── the read model itself ───────────────────────────────────── */

test("buildSupplierPrecursorTree is a pure read model — calling it twice with no data changes returns identical output", () => {
  storage.clear();
  const w = ws();
  saveSupplier({
    ...emptySupplier(w.id),
    id: "p1",
    name: "Foundry X",
    installationName: "Foundry X plant",
    precursorName: "Pig iron",
    cnCode: "72011000",
    seeTco2ePerT: 1.8,
  });

  const first = JSON.stringify(buildSupplierPrecursorTree(w.id));
  const second = JSON.stringify(buildSupplierPrecursorTree(w.id));
  assert.equal(first, second);
});

test("quantityRatio is populated from real tonnages and never defaulted to 1:1", () => {
  storage.clear();
  const w = ws();
  // No monthly production entered at all -> no output tonnage on file.
  saveSupplier({
    ...emptySupplier(w.id),
    id: "p1",
    name: "Foundry X",
    installationName: "Foundry X plant",
    precursorName: "Pig iron",
    cnCode: "72011000",
    monthlyQuantities: [{ month: "2026-01", tonnes: 100 }],
  });

  const node = findByName(buildSupplierPrecursorTree(w.id), "Foundry X");
  assert.equal(
    node.quantityRatio,
    null,
    "consumed tonnage is on file, but the parent's produced tonnage is not — must not guess a ratio",
  );
});

test("a parent precursor's own SEE rolls up from its children automatically — the Tree shows the same figure precursorContribution() computes, not a blank", () => {
  storage.clear();
  const w = ws();
  const billet = saveSupplier({
    ...emptySupplier(w.id),
    id: "p-billet",
    name: "Billet Co",
    installationName: "Billet Co plant",
    precursorName: "Billets",
    qtyPerTonneOverride: 1.05,
  });
  saveSupplier({
    ...emptySupplier(w.id, billet.id),
    id: "p-pigiron",
    name: "Pig Iron Foundry",
    installationName: "Pig Iron Foundry plant",
    precursorName: "Pig iron",
    cnCode: "72011000",
    productionRoute: "Blast furnace",
    seeTco2ePerT: 2,
    dataOrigin: "supplier_verified",
    qtyPerTonneOverride: 1.1,
    ...verifiedReport(),
  });

  const node = findByName(buildSupplierPrecursorTree(w.id), "Billet Co");
  assert.equal(
    node.see,
    1.1 * 2,
    "a node with children must show the weighted roll-up of its own children, not its own (always-null) seeTco2ePerT field",
  );

  const leaf = findByName(buildSupplierPrecursorTree(w.id), "Pig Iron Foundry");
  assert.equal(leaf.see, 2, "a leaf's own declared figure is unchanged");
});

/* ── buildPrecursorSubtree — the /p/<token> scoped read model ────── */

test("buildPrecursorSubtree returns null for a missing root id", () => {
  storage.clear();
  const w = ws();
  assert.equal(buildPrecursorSubtree(w.id, "does-not-exist"), null);
});

test("buildPrecursorSubtree shows only the given node and its own descendants — never a sibling elsewhere in the workspace", () => {
  storage.clear();
  const w = ws();
  saveSupplier({
    ...emptySupplier(w.id),
    id: "a",
    name: "Foundry X",
    installationName: "Foundry X plant",
    precursorName: "Pig iron",
    cnCode: "72011000",
  });
  saveSupplier({
    ...emptySupplier(w.id, "a"),
    id: "a1",
    name: "Coke Co",
    installationName: "Coke Co plant",
    precursorName: "Coke",
    cnCode: "27011200",
  });
  saveSupplier({
    ...emptySupplier(w.id),
    id: "b",
    name: "Sinter Co",
    installationName: "Sinter Co plant",
    precursorName: "Sinter",
    cnCode: "26011200",
  });

  const subtree = buildPrecursorSubtree(w.id, "a");
  assert.ok(subtree);
  assert.equal(subtree!.name, "Foundry X");
  assert.equal(subtree!.children.length, 1);
  assert.equal(subtree!.children[0].name, "Coke Co");
  assert.equal(
    JSON.stringify(subtree).includes("Sinter Co"),
    false,
    "a sibling elsewhere in the workspace must never appear in a scoped subtree",
  );
});

test("buildPrecursorSubtree is unaffected by a cycle in an unrelated branch of the same workspace", () => {
  storage.clear();
  const w = ws();
  saveSupplier({
    ...emptySupplier(w.id),
    id: "a",
    name: "Foundry X",
    installationName: "Foundry X plant",
    precursorName: "Pig iron",
    cnCode: "72011000",
  });
  // An unrelated cyclic pair elsewhere in the same workspace — treeFor(w.id)
  // would throw walking this; buildPrecursorSubtree rooted at "a" must not.
  saveSupplier({
    ...emptySupplier(w.id, "cycle-2"),
    id: "cycle-1",
    name: "Loop A",
    installationName: "Loop A plant",
    precursorName: "X",
    cnCode: "1",
  });
  saveSupplier({
    ...emptySupplier(w.id, "cycle-1"),
    id: "cycle-2",
    name: "Loop B",
    installationName: "Loop B plant",
    precursorName: "Y",
    cnCode: "2",
  });

  const subtree = buildPrecursorSubtree(w.id, "a");
  assert.ok(subtree);
  assert.equal(subtree!.name, "Foundry X");
  assert.equal(subtree!.children.length, 0);
});
