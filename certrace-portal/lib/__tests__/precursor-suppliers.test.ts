/* Precursor suppliers: the EU/exempt-origin lock, the direct/indirect SEE
   split staying in sync with the combined figure, and the mandatory
   4-check fallback for a "verified" claim (Bug 9). */

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

const { emptySupplier, saveSupplier, validateVerificationReport } =
  await import("../precursor-suppliers");

test("Bug 9 — a purchased precursor from an EU country locks SEE at 0, no report required", () => {
  storage.clear();
  const s = saveSupplier({
    ...emptySupplier("ws-1"),
    name: "Ruhr Stahl GmbH",
    installationName: "Duisburg plant",
    country: "DE",
    origin: "purchased",
    dataOrigin: "supplier_verified",
    specificEmbeddedDirectTco2PerT: 3.2,
    specificEmbeddedIndirectTco2PerT: 0.4,
  });
  assert.equal(
    s.seeTco2ePerT,
    0,
    "SEE is 0 by construction for an EU origin, regardless of what was typed",
  );
  assert.equal(s.specificEmbeddedDirectTco2PerT, 0);
  assert.equal(s.specificEmbeddedIndirectTco2PerT, 0);
  assert.equal(
    s.verificationChecks,
    undefined,
    "no verification report is required for an exempt origin",
  );
});

test("Bug 9 — exempt territories (Switzerland, Norway) also lock to 0", () => {
  storage.clear();
  const ch = saveSupplier({
    ...emptySupplier("ws-1"),
    country: "CH",
    origin: "purchased",
    seeTco2ePerT: 5,
  });
  assert.equal(ch.seeTco2ePerT, 0);
});

test("Bug 9 — the direct/indirect split is kept in sync with the combined figure", () => {
  storage.clear();
  const s = saveSupplier({
    ...emptySupplier("ws-1"),
    name: "Chonburi Foundry",
    installationName: "Rayong plant",
    country: "TH",
    origin: "purchased",
    dataOrigin: "supplier_unverified",
    specificEmbeddedDirectTco2PerT: 1.5,
    specificEmbeddedIndirectTco2PerT: 0.35,
  });
  assert.equal(
    s.seeTco2ePerT,
    1.85,
    "seeTco2ePerT is the sum, so effectiveSee and every existing reader need no change",
  );
});

test("Bug 9 — an unverified claim is never gated by the verification checks", () => {
  storage.clear();
  const s = saveSupplier({
    ...emptySupplier("ws-1"),
    name: "Chonburi Foundry",
    installationName: "Rayong plant",
    country: "TH",
    origin: "purchased",
    dataOrigin: "supplier_unverified",
    seeTco2ePerT: 1.85,
  });
  assert.equal(
    s.dataOrigin,
    "supplier_unverified",
    "unverified makes no claim a report could fail",
  );
  assert.equal(s.verificationChecks, undefined);
});

test("Bug 9 — a supplier_verified claim with no report attached fails all four checks and falls back to default_value", () => {
  storage.clear();
  const s = saveSupplier({
    ...emptySupplier("ws-1"),
    name: "Chonburi Foundry",
    installationName: "Rayong plant",
    country: "TH",
    origin: "purchased",
    dataOrigin: "supplier_verified",
    seeTco2ePerT: 1.85,
  });
  assert.equal(
    s.dataOrigin,
    "default_value",
    "the mandatory fallback — not a warning beside a figure that stays put",
  );
  assert.ok(
    s.verificationChecks && s.verificationChecks.failedReasons.length > 0,
    "both parties are told which check failed",
  );
  assert.equal(s.verificationChecks!.fileIntact, false);
});

test("Bug 9 — a supplier_verified claim with a report, a period, and the structured verifier metadata passes and stays verified", () => {
  storage.clear();
  const s = saveSupplier({
    ...emptySupplier("ws-1"),
    name: "Chonburi Foundry",
    installationName: "Rayong plant",
    country: "TH",
    origin: "purchased",
    dataOrigin: "supplier_verified",
    seeTco2ePerT: 1.85,
    verificationReportFileId: "ev-abc123",
    reportingPeriodStart: "2026-01-01",
    reportingPeriodEnd: "2026-12-31",
    verifierAccreditationExpiryDate: "2027-01-01",
    verificationReportIssueDate: "2026-06-01",
    verificationSectoralScope: "Iron and steel",
  });
  assert.equal(s.dataOrigin, "supplier_verified");
  assert.equal(s.verificationChecks?.accreditationValid, true);
  assert.equal(s.verificationChecks?.periodCovered, true);
  assert.equal(
    s.verificationChecks?.sectoralScopeMatch,
    true,
    "no catalogue link on this row, so a non-empty self-declared scope is taken as the claim",
  );
});

test("Bug 9 — the same report but an accreditation that had already expired before the report was issued fails the check", () => {
  storage.clear();
  const s = saveSupplier({
    ...emptySupplier("ws-1"),
    name: "Chonburi Foundry",
    installationName: "Rayong plant",
    country: "TH",
    origin: "purchased",
    dataOrigin: "supplier_verified",
    seeTco2ePerT: 1.85,
    verificationReportFileId: "ev-abc123",
    reportingPeriodStart: "2026-01-01",
    reportingPeriodEnd: "2026-12-31",
    verifierAccreditationExpiryDate: "2026-01-01",
    verificationReportIssueDate: "2026-06-01",
    verificationSectoralScope: "Iron and steel",
  });
  assert.equal(
    s.dataOrigin,
    "default_value",
    "an expired accreditation is a failed check, and a failed check falls back to default",
  );
  assert.equal(s.verificationChecks?.accreditationValid, false);
});

test("a claimed sectoral scope that does not cover the precursor's own catalogue category fails the match", () => {
  storage.clear();
  const s = saveSupplier({
    ...emptySupplier("ws-1"),
    name: "Chonburi Foundry",
    installationName: "Rayong plant",
    country: "TH",
    origin: "purchased",
    dataOrigin: "supplier_verified",
    catalogProductId: "billet",
    seeTco2ePerT: 1.85,
    verificationReportFileId: "ev-abc123",
    reportingPeriodStart: "2026-01-01",
    reportingPeriodEnd: "2026-12-31",
    verifierAccreditationExpiryDate: "2027-01-01",
    verificationReportIssueDate: "2026-06-01",
    verificationSectoralScope: "Aluminium",
  });
  assert.equal(s.verificationChecks?.sectoralScopeMatch, false);
  assert.equal(s.dataOrigin, "default_value");
});

test("Bug 9 — same-installation origin is never gated by the purchased-only verification checks", () => {
  storage.clear();
  const s = saveSupplier({
    ...emptySupplier("ws-1"),
    name: "",
    installationName: "",
    origin: "same_installation",
    sourceProcessId: "sinter-line-1",
    dataOrigin: "supplier_verified",
    seeTco2ePerT: 0.9,
  });
  assert.equal(
    s.dataOrigin,
    "supplier_verified",
    "same-installation figures are not purchased, so nothing here needs a verification report",
  );
  assert.equal(s.seeTco2ePerT, 0.9);
});

test("validateVerificationReport names the specific failure, not a generic rejection", () => {
  const result = validateVerificationReport({
    reportingPeriodStart: undefined,
    reportingPeriodEnd: undefined,
    verificationReportFileId: undefined,
    verifierAccreditationExpiryDate: undefined,
    verificationReportIssueDate: undefined,
    verificationSectoralScope: undefined,
    catalogProductId: undefined,
  });
  assert.equal(result.fileIntact, false);
  assert.equal(result.periodCovered, false);
  assert.equal(result.accreditationValid, false);
  assert.equal(result.sectoralScopeMatch, false);
  assert.equal(
    result.failedReasons.length,
    4,
    "one reason per distinct missing fact — file, accreditation dates, sectoral scope, period",
  );
});

test("validateVerificationReport reads only the structured metadata — it never inspects the PDF itself", () => {
  // A file id proves nothing on its own without the four supporting facts —
  // this is the whole point of the structured-metadata requirement.
  const result = validateVerificationReport({
    reportingPeriodStart: "2026-01-01",
    reportingPeriodEnd: "2026-12-31",
    verificationReportFileId: "ev-1",
    verifierAccreditationExpiryDate: undefined,
    verificationReportIssueDate: undefined,
    verificationSectoralScope: undefined,
    catalogProductId: undefined,
  });
  assert.equal(result.fileIntact, true);
  assert.equal(result.accreditationValid, false);
  assert.equal(result.sectoralScopeMatch, false);
});
