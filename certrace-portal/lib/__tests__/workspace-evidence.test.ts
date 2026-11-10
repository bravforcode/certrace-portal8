/* ════════════════════════════════════════════════════════════
   THE EVIDENCE CHECKLIST — what is asked for, and on whose authority

   Three things this file exists to hold still:

     THE KEYS NEVER MOVE. Every uploaded document stores the key it
     substantiates. Rename a key and the document is orphaned — still in the
     store, pointing at a name nothing asks for, so the checklist reads as
     though it was never attached. The keys are pinned literally here so a
     rename cannot pass review by accident.

     EVERY CITATION IS REAL OR ABSENT. `cite` is optional exactly so a document
     Certrace asks for on practical grounds says nothing rather than something
     invented. The test therefore does NOT require a citation on every row — it
     requires that any citation present names a regulation that was actually
     checked, and that the two deliberately-uncited rows stay uncited.

     A REQUIREMENT THAT DOES NOT APPLY IS NOT A GAP. The conditional rows
     appear only when the workspace records the thing they evidence.
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
  ANNUAL_REQUIRED_KEYS,
  CARBON_PRICE_KEY,
  DEFAULT_VALUE_JUSTIFICATION_KEY,
  EVIDENCE_DEPARTMENT_LABEL,
  LAB_ANALYSIS_KEY,
  PRECURSOR_VERIFICATION_KEY,
  annualCoverage,
  annualRequiredKeys,
  ALL_CONDITIONAL_ANNUAL_KEYS,
  annualScopeFor,
  coverageForMonth,
  requiredKeysForMonth,
  yearCoverage,
} = await import("../workspace-evidence");
const { emptyMonth } = await import("../monthly-data");

const everyKey = () => [
  ...annualRequiredKeys({
    carbonPricePaid: true,
    hasPurchasedPrecursors: true,
    usesLabAnalysis: true,
    usesDefaultValues: true,
  }),
  ...requiredKeysForMonth(
    {
      ...emptyMonth("ws-1", "2026-03"),
      fuels: [
        {
          id: "f1",
          fuelType: "natural_gas",
          quantity: 1,
          unit: "m3",
          efTco2PerGj: 0.056,
          oxidationFactor: 1,
          factorSource: "eu_standard",
        },
        {
          id: "f2",
          fuelType: "diesel",
          quantity: 1,
          unit: "l",
          efTco2PerGj: 0.074,
          oxidationFactor: 1,
          factorSource: "eu_standard",
        },
      ],
    },
    true,
  ),
];

/* ── Shape ──────────────────────────────────────────────────── */

test("the full list resolves with no duplicate keys", () => {
  const keys = everyKey().map((k) => k.key);
  assert.equal(
    new Set(keys).size,
    keys.length,
    `duplicate key: ${keys.filter((k, i) => keys.indexOf(k) !== i).join(", ")}`,
  );
});

test("every item has a non-empty label and a department", () => {
  for (const k of everyKey()) {
    assert.ok(k.label.trim().length > 0, `${k.key} has no label`);
    assert.ok(k.department, `${k.key} is not assigned to a department`);
    assert.ok(
      EVIDENCE_DEPARTMENT_LABEL[k.department!],
      `${k.key} names a department that does not exist`,
    );
  }
});

/* ── The keys are the contract ──────────────────────────────── */

test("the stable keys are exactly these, and a rename needs a migration", () => {
  assert.deepEqual(
    ANNUAL_REQUIRED_KEYS.map((k) => k.key),
    [
      "installation-identity",
      "calibration-records",
      "installation-diagram",
      "internal-qa-record",
    ],
  );
  assert.equal(CARBON_PRICE_KEY.key, "carbon-price");
  // Per-month keys. `fuel:<row id>` is keyed by the ROW, not by its index, so
  // a fuel deleted in June cannot re-point July's evidence at another fuel.
  // Each fuel also carries a separate finance-side invoice key — the meter
  // reading and the vendor's receipt are two documents, two people.
  // utility-invoice moved here too — the bill for THIS month, not one
  // sample bill standing in for the whole year. Passed `true` for
  // requiresIndirect — Sintered Ore's case, where the three electricity
  // documents are real requirements; see the gating test below for the
  // opposite (iron/steel, aluminium) case.
  const monthKeys = requiredKeysForMonth(
    {
      ...emptyMonth("ws-1", "2026-03"),
      fuels: [
        {
          id: "f1",
          fuelType: "natural_gas",
          quantity: 1,
          unit: "m3",
          efTco2PerGj: 0.056,
          oxidationFactor: 1,
          factorSource: "eu_standard",
        },
      ],
    },
    true,
  ).map((k) => k.key);
  assert.deepEqual(monthKeys, [
    "production",
    "electricity-consumed",
    "electricity-factor",
    "utility-invoice",
    "fuel:f1",
    "fuel-invoice:f1",
  ]);
});

test("the three electricity-only documents drop out entirely when the category does not count indirect emissions", () => {
  const withIndirect = requiredKeysForMonth(
    emptyMonth("ws-1", "2026-03"),
    true,
  ).map((k) => k.key);
  assert.ok(withIndirect.includes("electricity-consumed"));
  assert.ok(withIndirect.includes("electricity-factor"));
  assert.ok(withIndirect.includes("utility-invoice"));

  const withoutIndirect = requiredKeysForMonth(
    emptyMonth("ws-1", "2026-03"),
    false,
  ).map((k) => k.key);
  assert.equal(withoutIndirect.includes("electricity-consumed"), false);
  assert.equal(withoutIndirect.includes("electricity-factor"), false);
  assert.equal(withoutIndirect.includes("utility-invoice"), false);
  // production is not electricity-only, so it stays either way.
  assert.ok(withoutIndirect.includes("production"));
});

/* ── Citations ──────────────────────────────────────────────── */

/** The documents whose text these citations were read against, verbatim —
    the four implementing/delegated acts, the parent regulation, and the EU
    communication template. Anything citing something else has not been
    verified and must not ship. */
const CHECKED =
  /IR \(EU\) 2025\/254[678]|DR \(EU\) 2025\/2551|Regulation \(EU\) 2023\/956|CBAM communication template/;

test("every citation present names a source that was actually read", () => {
  // Citation is optional by design (see the module docstring) — a document
  // Certrace asks for on practical grounds (an org chart, a mill test
  // certificate) says nothing rather than inventing an Annex reference.
  for (const k of everyKey()) {
    if (!k.cite) continue;
    assert.match(
      k.cite,
      CHECKED,
      `${k.key} cites something outside the checked set: "${k.cite}"`,
    );
    assert.match(
      k.cite,
      /Annex|Article/,
      `${k.key} cites a regulation but no Annex or Article: "${k.cite}"`,
    );
  }
});

test("the carbon price row cites the PARENT regulation, not an implementing act", () => {
  /* IR (EU) 2025/2548 covers only how the CBAM certificate price is
     calculated and published — nothing about evidencing a price paid abroad.
     Recital 26 of IR (EU) 2025/2547 names the real home: "the reporting
     period applicable to the determination of the carbon price paid in
     accordance with Article 9 of Regulation (EU) 2023/956". */
  assert.equal(CARBON_PRICE_KEY.cite, "Article 9, Regulation (EU) 2023/956");
  assert.doesNotMatch(
    CARBON_PRICE_KEY.cite!,
    /2025\/2548/,
    "2025/2548 is certificate pricing and does not back this row",
  );
});

test("the default-value justification does not cite Article 11", () => {
  /* Article 11 governs the DECLARANT determining embedded emissions from
     published defaults. The operator's obligation to write down WHY a default
     was used is in Annex II A.3(7) and A.3(8) — "a justification for this
     fact shall be laid down in the monitoring plan". */
  assert.doesNotMatch(DEFAULT_VALUE_JUSTIFICATION_KEY.cite!, /Article 11/);
  assert.match(DEFAULT_VALUE_JUSTIFICATION_KEY.cite!, /A\.3\(7\)/);
});

/* ── Conditional rows ───────────────────────────────────────── */

test("a workspace with none of the conditions asks for exactly the four fixed annual documents", () => {
  // utility-invoice is not one of these any more — it is a per-month
  // document now (requiredKeysForMonth), not an annual one.
  assert.deepEqual(
    annualRequiredKeys({ carbonPricePaid: false }).map((k) => k.key),
    [
      "installation-identity",
      "calibration-records",
      "installation-diagram",
      "internal-qa-record",
    ],
  );
});

test("each condition adds exactly its own row(s)", () => {
  const has = (scope: Parameters<typeof annualRequiredKeys>[0], key: string) =>
    annualRequiredKeys(scope).some((k) => k.key === key);

  assert.equal(has({ carbonPricePaid: true }, "carbon-price"), true);
  assert.equal(has({ carbonPricePaid: false }, "carbon-price"), false);
  // A purchased precursor pulls in the verification report AND the mill test
  // certificate together — they only ever apply as a set. (The generic
  // supplier-communication-template requirement that used to sit alongside
  // them was retired — the Tree's own per-node Documents section replaced it.)
  for (const key of [
    "precursor-verification-report",
    "mill-test-certificate",
  ]) {
    assert.equal(
      has({ carbonPricePaid: false, hasPurchasedPrecursors: true }, key),
      true,
      key,
    );
    assert.equal(has({ carbonPricePaid: false }, key), false, key);
  }
  assert.equal(
    has({ carbonPricePaid: false, usesLabAnalysis: true }, "lab-analysis"),
    true,
  );
  assert.equal(
    has(
      { carbonPricePaid: false, usesDefaultValues: true },
      "default-value-justification",
    ),
    true,
  );
  assert.equal(
    has({ carbonPricePaid: false }, "default-value-justification"),
    false,
  );
  assert.equal(
    has(
      { carbonPricePaid: false, hasPpaOrDirectLink: true },
      "contract-or-ppa",
    ),
    true,
  );
  assert.equal(has({ carbonPricePaid: false }, "contract-or-ppa"), false);

  /* The three conditional documents still have a CARD when their condition is
     false — greyed, unopenable, "Not applicable to this workspace right now" —
     rather than vanishing. A card that disappeared could not be told apart
     from one nobody ever asked about. Their presence here is what puts that
     placeholder on the page; `annualRequiredKeys` above is what decides
     whether it counts. */
  for (const key of [
    "default-value-justification",
    "contract-or-ppa",
    "carbon-price",
  ]) {
    assert.equal(
      ALL_CONDITIONAL_ANNUAL_KEYS.some((k) => k.key === key),
      true,
      `${key} still renders as a not-applicable card`,
    );
  }
  // A first verification year genuinely has no previous report to produce —
  // absent from the required list, same as any other inapplicable row. The
  // Documents card still shows the document type as "Not applicable" from
  // its static catalog; that is a display choice, not a coverage gap.
  // Retired as a requirement — no scope brings it back.
  assert.equal(
    has({ carbonPricePaid: false }, "previous-verification-report"),
    false,
  );
  assert.equal(
    has(
      { carbonPricePaid: false, hasPurchasedPrecursors: true },
      "supplier-communication-template",
    ),
    false,
  );
});

/* ── Coverage still computes with the added rows ─────────────── */

test("annual coverage counts every applicable row and none of the others", () => {
  storage.clear();
  storage.setItem(
    "certrace:workspace-evidence",
    JSON.stringify({
      "ws-1": [
        {
          id: "e1",
          workspaceId: "ws-1",
          fieldKeys: ["installation-identity"],
          sourceType: "other",
          fileName: "id.pdf",
          capturedAt: "2026-01-01",
        },
      ],
    }),
  );

  const bare = annualCoverage("ws-1", { carbonPricePaid: false });
  assert.equal(
    bare.length,
    4,
    "four fixed rows — the org chart is no longer one of them, and utility-invoice moved to the per-month keys",
  );
  assert.equal(
    bare.filter((r) => r.covered).length,
    1,
    "identity is evidenced, nothing else is",
  );

  const full = annualCoverage("ws-1", {
    carbonPricePaid: true,
    hasPurchasedPrecursors: true,
    usesLabAnalysis: true,
    usesDefaultValues: true,
    hasPpaOrDirectLink: true,
  });
  assert.equal(
    full.length,
    10,
    "the four fixed rows plus the six rows this scope triggers — supplier-communication-template was retired",
  );
  assert.equal(
    full.filter((r) => r.covered).length,
    1,
    "the added rows start uncovered rather than crashing or counting as covered",
  );
  // The citation reaches the row, which is what puts the Annex on the screen.
  assert.ok(
    full
      .find((r) => r.key === "calibration-records")!
      .cite?.includes("A.5(22)(a)"),
  );
});

test("year coverage sums the months and the annual rows", () => {
  storage.clear();
  storage.setItem(
    "certrace:workspace-evidence",
    JSON.stringify({ "ws-1": [] }),
  );
  const march = { ...emptyMonth("ws-1", "2026-03"), fuels: [] };

  const monthTotal = coverageForMonth("ws-1", march, false).total;
  const year = yearCoverage("ws-1", [march], { carbonPricePaid: false });

  assert.equal(
    year.total,
    monthTotal + 4,
    "the monthly figures (utility-invoice now among them) plus the four always-required annual rows",
  );
  assert.equal(year.covered, 0);
  assert.equal(year.complete, false);
  assert.ok(Number.isFinite(year.ratio));
});

/* ── The scope is derived, not asked ────────────────────────── */

test("the scope reads the precursor chain and the methodology rather than a checkbox", () => {
  storage.clear();
  storage.setItem(
    "certrace:precursor-suppliers",
    JSON.stringify({
      "ws-1": [
        {
          id: "p1",
          workspaceId: "ws-1",
          parentId: null,
          name: "Chonburi Foundry",
          isScrap: false,
          dataOrigin: "supplier_verified",
          monthlyQuantities: [],
        },
        {
          id: "p2",
          workspaceId: "ws-1",
          parentId: null,
          name: "Unknown mill",
          isScrap: false,
          dataOrigin: "default_value",
          monthlyQuantities: [],
        },
      ],
    }),
  );
  storage.setItem(
    "certrace:workspace-mmd-draft",
    JSON.stringify({
      "ws-1": {
        fuelInstruments: [{ id: "m1", factorSource: "lab_analysis" }],
        electricityInstruments: [],
      },
    }),
  );

  const scope = annualScopeFor("ws-1", "2026-01-01", "2026-12-31", false);
  assert.equal(
    scope.hasPurchasedPrecursors,
    true,
    "an actual-data precursor needs its producer's verification report",
  );
  assert.equal(scope.usesDefaultValues, true);
  assert.equal(scope.usesLabAnalysis, true);
  assert.equal(scope.carbonPricePaid, false);
});

test("scrap is not a precursor whose producer has anything to verify", () => {
  storage.clear();
  storage.setItem(
    "certrace:precursor-suppliers",
    JSON.stringify({
      "ws-1": [
        {
          id: "p1",
          workspaceId: "ws-1",
          parentId: null,
          name: "Scrap yard",
          isScrap: true,
          dataOrigin: "supplier_verified",
          monthlyQuantities: [],
        },
      ],
    }),
  );
  storage.setItem(
    "certrace:workspace-mmd-draft",
    JSON.stringify({
      "ws-1": { fuelInstruments: [], electricityInstruments: [] },
    }),
  );

  assert.equal(
    annualScopeFor("ws-1", "2026-01-01", "2026-12-31", false)
      .hasPurchasedPrecursors,
    false,
  );
});

test("an empty workspace asks for nothing conditional", () => {
  storage.clear();
  const scope = annualScopeFor("ws-empty", "2026-01-01", "2026-12-31", false);
  assert.equal(scope.hasPurchasedPrecursors, false);
  assert.equal(scope.usesLabAnalysis, false);
  assert.equal(scope.usesDefaultValues, false);
  assert.equal(scope.hasPpaOrDirectLink, false);
  assert.deepEqual(
    annualRequiredKeys(scope).map((k) => k.key),
    [
      "installation-identity",
      "calibration-records",
      "installation-diagram",
      "internal-qa-record",
    ],
  );
});

test("a PPA row in any recorded month reads as a direct-link electricity source", () => {
  storage.clear();
  storage.setItem(
    "certrace:monthly-data",
    JSON.stringify({
      "ws-1": [
        {
          workspaceId: "ws-1",
          month: "2026-03",
          fuels: [],
          electricitySources: [
            { id: "s1", sourceType: "ppa", mwh: 10, factorTco2PerMwh: 0.4 },
          ],
        },
      ],
    }),
  );
  const scope = annualScopeFor("ws-1", "2026-01-01", "2026-12-31", false);
  assert.equal(scope.hasPpaOrDirectLink, true);
});

test("a prior verified period no longer changes what is asked for", () => {
  storage.clear();
  const firstYear = annualRequiredKeys(
    annualScopeFor("ws-1", "2026-01-01", "2026-12-31", false),
  ).map((k) => k.key);
  storage.setItem(
    "certrace:workspace-mmd-versions",
    JSON.stringify({
      "ws-1": [
        {
          id: "v1",
          workspaceId: "ws-1",
          n: 1,
          finalisedAt: "2025-10-01",
          author: "a",
          content: {},
          periodStart: "2025-01-01",
          periodEnd: "2025-12-31",
        },
      ],
    }),
  );
  const laterYear = annualRequiredKeys(
    annualScopeFor("ws-1", "2026-01-01", "2026-12-31", false),
  ).map((k) => k.key);
  assert.deepEqual(
    laterYear,
    firstYear,
    "the previous verification report was the only row a prior period ever added",
  );
});
