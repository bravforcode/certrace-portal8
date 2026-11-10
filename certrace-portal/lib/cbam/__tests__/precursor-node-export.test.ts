/* ════════════════════════════════════════════════════════════
   THE PRECURSOR NODE EXPORT — everything one entity submitted, in one
   document, for the exporter to hand to an external verifier.
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

const { buildPrecursorNodeExport } = await import("../precursor-node-export");
const { emptySupplier } = await import("../../precursor-suppliers");
const { saveEvidence, uid } = await import("../../workspace-evidence");

const complete = {
  ...emptySupplier("ws-1", null),
  id: "p1",
  workspaceId: "ws-1",
  name: "Foundry X",
  installationName: "Foundry X plant",
  country: "TH",
  installationUniqueId: "FX-1",
  precursorName: "Pig iron",
  cnCode: "72011000",
  productionRoute: "Route A",
  specificEmbeddedDirectTco2PerT: 1.2,
  specificEmbeddedIndirectTco2PerT: 0.3,
  seeTco2ePerT: 1.5,
  dataOrigin: "supplier_verified" as const,
  qtyPerTonneOverride: 1.05,
  reportingPeriodStart: "2026-01-01",
  reportingPeriodEnd: "2026-12-31",
  verificationReportFileId: "ev-1",
  verifierName: "Bureau Veritas",
  verifierAccreditationNumber: "TH-1",
  verifierAccreditationIssuingCountry: "TH",
  verifierAccreditationExpiryDate: "2027-01-01",
  verificationReportIssueDate: "2026-06-01",
  verificationSectoralScope: "Iron or steel products",
  verificationChecks: {
    accreditationValid: true,
    sectoralScopeMatch: true,
    periodCovered: true,
    fileIntact: true,
    failedReasons: [],
  },
};

test("the export names the entity, its identity, SEE, quantity and verifier facts", () => {
  storage.clear();
  const { html, fileName } = buildPrecursorNodeExport(complete);

  assert.match(html, /Foundry X/);
  assert.match(html, /Foundry X plant/);
  assert.match(html, /72011000/);
  assert.match(html, /1\.2 tCO₂e\/t/); // direct SEE — num() strips trailing zeros, same as verifier-pack.ts's own num()
  assert.match(html, /Bureau Veritas/);
  assert.match(html, /2026-01-01 to 2026-12-31/);
  assert.equal(fileName, "foundry-x-submitted-data.html");
});

test("the document does not claim to be a Monitoring Methodology Documentation — that identity belongs to the real MMD, reached via a linked workspace", () => {
  storage.clear();
  const { html } = buildPrecursorNodeExport(complete);
  assert.doesNotMatch(html, /<title>Monitoring Methodology Documentation/);
  assert.doesNotMatch(html, /<h1>Monitoring Methodology Documentation/);
  assert.doesNotMatch(html, /Part \d ·/);
  // The disclaimer is allowed to name and deny the identity, not claim it.
  assert.match(html, /not a Monitoring Methodology Documentation/);
});

test("a passing four-check gate renders all four checks as Pass, no failure note", () => {
  storage.clear();
  const { html } = buildPrecursorNodeExport(complete);
  assert.match(html, /Verifier accreditation valid/);
  assert.doesNotMatch(html, /class="note warn"/);
});

test("a failed check names the specific reason, and a node with no verification attempt yet reads as such rather than 0/4", () => {
  storage.clear();
  const failed = {
    ...complete,
    dataOrigin: "default_value" as const,
    verificationChecks: {
      accreditationValid: false,
      sectoralScopeMatch: true,
      periodCovered: true,
      fileIntact: true,
      failedReasons: [
        "The accreditation expired 2025-01-01, before the report was issued on 2026-06-01.",
      ],
    },
  };
  const { html } = buildPrecursorNodeExport(failed);
  assert.match(html, /The accreditation expired 2025-01-01/);

  const neverVerified = {
    ...emptySupplier("ws-1", null),
    id: "p2",
    workspaceId: "ws-1",
    name: "Coke Co",
    precursorName: "Coke",
  };
  const { html: html2 } = buildPrecursorNodeExport(neverVerified);
  assert.match(html2, /No verification has been attempted/);
  assert.doesNotMatch(html2, /0\/4/);
});

test("the attached report's real file name is looked up from evidence, not just the file id", () => {
  storage.clear();
  saveEvidence({
    id: "ev-1",
    workspaceId: "ws-1",
    fieldKeys: ["precursor:p1"],
    sourceType: "supplier_cti",
    fileName: "foundry-x-verification.pdf",
    capturedAt: new Date().toISOString(),
  });
  const { html } = buildPrecursorNodeExport(complete);
  assert.match(html, /foundry-x-verification\.pdf/);
});
