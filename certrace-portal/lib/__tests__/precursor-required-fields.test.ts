/* ════════════════════════════════════════════════════════════
   REQUIRED-FIELD GATES — supplierPrecursorGaps / precursorSubmissionGaps

   One list of gaps, read by both the exporter-side Precursors page and the
   /p/<token> supplier form, so neither can silently let something through
   the other blocks. Fail-closed: every check here is "is the fact there",
   so an unimplemented check is a missing push, not an inverted condition —
   nothing here can accidentally read as "nothing is wrong".
   ════════════════════════════════════════════════════════════ */

import { test } from "node:test";
import assert from "node:assert/strict";

const { emptySupplier, supplierPrecursorGaps, precursorSubmissionGaps } =
  await import("../precursor-suppliers");
const { precursorLinkGaps } = await import("../cbam/precursor-basis");

test("a default-value precursor link does not demand exporter-owned fields", () => {
  const row = { ...emptySupplier("ws-1"), valueBasis: "default" as const };
  assert.ok(precursorSubmissionGaps(row).length > 0);
  assert.deepEqual(precursorLinkGaps(row), []);
});

test("legacy precursor links keep their existing submission requirements", () => {
  const row = emptySupplier("ws-1");
  assert.deepEqual(precursorLinkGaps(row), precursorSubmissionGaps(row));
});

/* WHERE the plant is. Row-level checks are happy with a name; a SUBMISSION
   is scoped to a plant a verifier has to be able to reach, so the supplier
   form marks these required and `precursorRequirements(_, "submission")`
   gates on them. Purchased-origin only — a same-installation row is the
   exporter's own site, already identified on the workspace. */
const INSTALLATION_IDENTITY = {
  installationUniqueId: "TH-CHON-0042",
  unlocode: "THLCH",
  fullAddress: "88 Moo 4, Sriracha, Chonburi 20230, Thailand",
  latitude: 13.1,
  longitude: 100.9,
};

const VERIFIED_META = {
  verifierName: "SGS Thailand",
  verifierAccreditationNumber: "TH-ACC-001",
  verifierAccreditationIssuingCountry: "TH",
  verifierAccreditationExpiryDate: "2027-01-01",
  verificationReportIssueDate: "2026-06-01",
  verificationSectoralScope: "Iron and steel",
};

/* ── supplierPrecursorGaps — the row-level gate ────────────────── */

test("a blank purchased precursor is missing everything the row needs", () => {
  const gaps = supplierPrecursorGaps(emptySupplier("ws-1", null));
  assert.ok(gaps.length > 0);
  assert.ok(gaps.some((g) => g.includes("Company name")));
  assert.ok(gaps.some((g) => g.includes("Production route")));
  assert.ok(gaps.some((g) => g.includes("producing installation")));
  // Country is not checked here — emptySupplier() always seeds "TH", so an
  // untouched country field is never the thing this particular fixture is
  // missing. See the country-of-origin field directly in a case that clears it.
  assert.ok(gaps.some((g) => g.includes("embedded emissions")));
  assert.ok(gaps.some((g) => g.includes("reporting period")));
  assert.ok(gaps.some((g) => g.includes("quantity")));
});

test("clearing the country field on a purchased precursor is caught", () => {
  const s = {
    ...emptySupplier("ws-1", null),
    name: "Chonburi Foundry",
    installationName: "Chonburi Works",
    country: "",
  };
  assert.ok(
    supplierPrecursorGaps(s).some((g) => g.includes("Country of origin")),
  );
});

test("a fully filled purchased precursor has no gaps", () => {
  const s = {
    ...emptySupplier("ws-1", null),
    name: "Chonburi Foundry",
    installationName: "Chonburi Works",
    precursorName: "Billet",
    cnCode: "7207 11 90",
    country: "TH",
    productionRoute: "Scrap-based EAF",
    specificEmbeddedDirectTco2PerT: 0.07,
    reportingPeriodStart: "2026-01-01",
    reportingPeriodEnd: "2026-12-31",
    monthlyQuantities: [{ month: "2026-01", tonnes: 100 }],
  };
  assert.deepEqual(supplierPrecursorGaps(s), []);
});

test("a per-tonne ratio override counts as a quantity, same as monthly tonnes", () => {
  const s = {
    ...emptySupplier("ws-1", null),
    name: "Chonburi Foundry",
    installationName: "Chonburi Works",
    precursorName: "Billet",
    country: "TH",
    productionRoute: "Scrap-based EAF",
    specificEmbeddedDirectTco2PerT: 0.07,
    reportingPeriodStart: "2026-01-01",
    reportingPeriodEnd: "2026-12-31",
    qtyPerTonneOverride: 1.02,
  };
  assert.ok(!supplierPrecursorGaps(s).some((g) => g.includes("quantity")));
});

test("same-installation origin asks for the source process, not an installation or a country", () => {
  const s = {
    ...emptySupplier("ws-1", null),
    name: "n/a",
    origin: "same_installation" as const,
    precursorName: "Sinter",
    productionRoute: "Sintering",
    sourceProcessId: "Sinter line 1",
    specificEmbeddedDirectTco2PerT: 0.02,
    monthlyQuantities: [{ month: "2026-01", tonnes: 50 }],
  };
  const gaps = supplierPrecursorGaps(s);
  assert.deepEqual(
    gaps,
    [],
    "installation identity and reporting period are purchased-only, and this row supplies everything same-installation needs",
  );
});

test("same-installation origin without a source process is still incomplete", () => {
  const s = {
    ...emptySupplier("ws-1", null),
    name: "n/a",
    origin: "same_installation" as const,
    precursorName: "Sinter",
    productionRoute: "Sintering",
    specificEmbeddedDirectTco2PerT: 0.02,
    monthlyQuantities: [{ month: "2026-01", tonnes: 50 }],
  };
  assert.ok(
    supplierPrecursorGaps(s).some((g) => g.includes("production processes")),
  );
});

test("scrap is excused from the SEE and reporting-period checks, but not from identity or quantity", () => {
  const s = {
    ...emptySupplier("ws-1", null),
    name: "Scrap Yard Co.",
    installationName: "Scrap Yard",
    precursorName: "Steel scrap",
    country: "TH",
    productionRoute: "Collection",
    isScrap: true,
    monthlyQuantities: [{ month: "2026-01", tonnes: 200 }],
  };
  const gaps = supplierPrecursorGaps(s);
  assert.ok(
    !gaps.some((g) => g.includes("embedded emissions")),
    "scrap has no SEE to report",
  );
  assert.ok(
    !gaps.some((g) => g.includes("reporting period")),
    "scrap has no verification period to report",
  );
  assert.ok(!gaps.some((g) => g.includes("Company name")));
});

test("an EU-origin purchased precursor is excused from SEE and reporting period the same way scrap is", () => {
  const s = {
    ...emptySupplier("ws-1", null),
    name: "German Mill GmbH",
    installationName: "Duisburg Works",
    precursorName: "Billet",
    country: "DE",
    productionRoute: "BF-BOF",
    monthlyQuantities: [{ month: "2026-01", tonnes: 100 }],
  };
  const gaps = supplierPrecursorGaps(s);
  assert.ok(
    !gaps.some((g) => g.includes("embedded emissions")),
    "EU origin is locked to 0 — nothing to ask for",
  );
  assert.ok(!gaps.some((g) => g.includes("reporting period")));
});

/* ── precursorSubmissionGaps — the /p/<token> form's stricter gate ── */

test("the supplier submission form additionally requires the full verification package", () => {
  const base = {
    ...emptySupplier("ws-1", null),
    name: "Chonburi Foundry",
    installationName: "Chonburi Works",
    precursorName: "Billet",
    country: "TH",
    productionRoute: "Scrap-based EAF",
    specificEmbeddedDirectTco2PerT: 0.07,
    reportingPeriodStart: "2026-01-01",
    reportingPeriodEnd: "2026-12-31",
    monthlyQuantities: [{ month: "2026-01", tonnes: 100 }],
  };
  // Row-level gate alone is satisfied...
  assert.deepEqual(supplierPrecursorGaps(base), []);
  // ...but the submission gate still refuses without the verification package.
  const submissionGaps = precursorSubmissionGaps(base);
  assert.ok(submissionGaps.length > 0);
  assert.ok(submissionGaps.some((g) => g.includes("verification report")));
  assert.ok(submissionGaps.some((g) => g.includes("Verifier name")));
  assert.ok(submissionGaps.some((g) => g.includes("accreditation number")));
  assert.ok(submissionGaps.some((g) => g.includes("issuing country")));
  assert.ok(submissionGaps.some((g) => g.includes("expiry date")));
  assert.ok(submissionGaps.some((g) => g.includes("issue date")));
  assert.ok(submissionGaps.some((g) => g.includes("Sectoral scope")));
});

test("with the row fields and the full verification package, the submission gate is empty", () => {
  const s = {
    ...emptySupplier("ws-1", null),
    name: "Chonburi Foundry",
    installationName: "Chonburi Works",
    precursorName: "Billet",
    country: "TH",
    productionRoute: "Scrap-based EAF",
    specificEmbeddedDirectTco2PerT: 0.07,
    reportingPeriodStart: "2026-01-01",
    reportingPeriodEnd: "2026-12-31",
    monthlyQuantities: [{ month: "2026-01", tonnes: 100 }],
    verificationReportFileId: "ev-1",
    ...INSTALLATION_IDENTITY,
    ...VERIFIED_META,
  };
  assert.deepEqual(precursorSubmissionGaps(s), []);
});

test("scrap and EU-exempt rows never need the verification package on the submission form either", () => {
  const scrap = {
    ...emptySupplier("ws-1", null),
    name: "Scrap Yard Co.",
    installationName: "Scrap Yard",
    precursorName: "Steel scrap",
    country: "TH",
    productionRoute: "Collection",
    isScrap: true,
    ...INSTALLATION_IDENTITY,
    monthlyQuantities: [{ month: "2026-01", tonnes: 200 }],
  };
  assert.deepEqual(precursorSubmissionGaps(scrap), []);

  const euOrigin = {
    ...emptySupplier("ws-1", null),
    name: "German Mill GmbH",
    installationName: "Duisburg Works",
    precursorName: "Billet",
    country: "DE",
    productionRoute: "BF-BOF",
    ...INSTALLATION_IDENTITY,
    monthlyQuantities: [{ month: "2026-01", tonnes: 100 }],
  };
  assert.deepEqual(precursorSubmissionGaps(euOrigin), []);
});
