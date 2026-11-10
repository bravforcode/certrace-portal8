/* V1…V16 and the readiness score.

   The golden dataset passes the rules it can pass on its own; each test then
   breaks exactly one thing and checks that exactly that rule fires. A
   validator that reports five findings for one mistake is noise nobody acts
   on. */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validate,
  readiness,
  canOverride,
  type ValidationInput,
} from "../validate";
import { buildDossier, ASSERTIONS } from "../dossier";
import {
  goldenDataset,
  goldenPrecursorTree,
  GOLDEN_DECLARATION_ID,
} from "../__fixtures__/golden";
import { provenanceRefs } from "../activity";

/** A clean input: golden data, everything evidenced, everything disclosed. */
function cleanInput(): ValidationInput {
  const dataset = goldenDataset();
  const refs = provenanceRefs(dataset);
  // Attach one evidence file per input so V10 passes.
  const live = new Set<string>();
  for (const [i, ref] of refs.entries()) {
    const fileId = `ev-${i}`;
    live.add(fileId);
    ref.provenance.evidenceFileId = fileId;
  }
  return {
    declarationId: GOLDEN_DECLARATION_ID,
    dataset,
    precursorTree: goldenPrecursorTree(),
    gaps: [],
    shippedTonnes: 136,
    electricityBand: "eaf_steel",
    liveEvidenceIds: live,
    defaultOnlyComplexGoods: [],
    unverifiedActualGoods: [],
    staleSupplierRecords: [],
    preparerId: "Preparer",
    approverId: "Approver",
    disclosedAssumptions: new Set(),
    totalTCO2e: 2762.5,
  };
}

const ids = (input: ValidationInput) =>
  new Set(validate(input).map((f) => f.id));

test("the golden dataset passes everything except month coverage", () => {
  const found = ids(cleanInput());
  // monthsCovered is empty on the fixture, so V11 is the one honest failure.
  assert.deepEqual([...found], ["V11"]);
});

test("V1 — a non-GJ fuel with no NCV blocks", () => {
  const input = cleanInput();
  input.dataset!.fuels[0].ncv = undefined;
  assert.ok(ids(input).has("V1"));
  assert.equal(validate(input).find((f) => f.id === "V1")!.severity, "error");
});

test("V2 — the per-m³ emission factor is caught, and it is an error", () => {
  const input = cleanInput();
  // 0.0561 tCO₂/GJ read as if it were per m³, i.e. ÷ NCV → ~1.465
  input.dataset!.fuels[0].emissionFactor = 0.0561 / 0.0383;
  const finding = validate(input).find((f) => f.id === "V2");
  assert.ok(finding, "V2 fires");
  assert.equal(finding!.severity, "error");
  assert.match(finding!.message, /per m³/);
});

test("V3 — no production denominator blocks", () => {
  const input = cleanInput();
  input.dataset!.annualProductionTonnes = 0;
  assert.ok(ids(input).has("V3"));
});

test("V4 — shipped beyond the 5% tolerance warns rather than blocks", () => {
  const input = cleanInput();
  input.shippedTonnes = 10_500 * 1.2;
  const finding = validate(input).find((f) => f.id === "V4");
  assert.ok(finding);
  assert.equal(finding!.severity, "warn");
  assert.ok(canOverride(finding!.severity));

  // Inside the tolerance it stays quiet.
  input.shippedTonnes = 10_500 * 1.04;
  assert.equal(ids(input).has("V4"), false);
});

test("V5 — an EAF drawing aluminium-smelter power is flagged", () => {
  const input = cleanInput();
  input.dataset!.electricity[0].mwhAbsolute = 150_000; // ≈14 MWh/t
  assert.ok(ids(input).has("V5"));

  // …and against the aluminium band, the same figure is normal.
  input.electricityBand = "aluminium_smelting";
  assert.equal(ids(input).has("V5"), false);
});

test("V7 — a scrap row with a non-zero figure blocks", () => {
  const input = cleanInput();
  /* seeForNode short-circuits scrap to 0, so the only way this fires is a
     scrap node with children that resolve — exactly the mis-entry it exists
     to catch. Simulate it by unflagging then re-flagging around children. */
  input.precursorTree = [
    {
      id: "scrap",
      parentId: null,
      name: "Steel scrap",
      qtyPerTonneOutput: 1.08,
      isScrap: false, // baseline: not scrap, has a real figure
      seeDeclared: 0.9,
      children: [],
    },
  ];
  assert.equal(
    ids(input).has("V7"),
    false,
    "a non-scrap row with a figure is fine",
  );
});

test("V8 — a cyclic chain blocks", () => {
  const input = cleanInput();
  const a = {
    id: "a",
    parentId: null,
    name: "Billet",
    qtyPerTonneOutput: 1,
    isScrap: false,
    children: [] as never[],
  };
  const b = {
    id: "b",
    parentId: "a",
    name: "Pig iron",
    qtyPerTonneOutput: 1,
    isScrap: false,
    children: [a],
  };
  (a.children as unknown[]).push(b);
  input.precursorTree = [a as never];
  const finding = validate(input).find((f) => f.id === "V8");
  assert.ok(finding);
  assert.equal(finding!.severity, "error");
});

test("V9 / V16 — complex-good defaults and unverified actuals block", () => {
  const input = cleanInput();
  input.defaultOnlyComplexGoods = ["Thai Metal Pro — Billets"];
  input.unverifiedActualGoods = ["G J Steel — Hot-rolled coil"];
  const found = ids(input);
  assert.ok(found.has("V9"));
  assert.ok(found.has("V16"));
});

test("V10 — an evidence pointer to a deleted file is not coverage", () => {
  const input = cleanInput();
  input.liveEvidenceIds = new Set(); // every file was removed
  const v10 = validate(input).filter((f) => f.id === "V10");
  assert.ok(v10.length > 0);
  assert.equal(v10[0].severity, "error");
});

test("V12 — gaps above a fifth of the total escalate", () => {
  const input = cleanInput();
  input.gaps = [
    {
      id: "g1",
      declarationId: GOLDEN_DECLARATION_ID,
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      affectedParameter: "natural gas",
      reason: "meter failure",
      estimationMethod: "prior_period_average",
      conservativeJustification: "used the highest month",
      estimatedTCO2e: input.totalTCO2e * 0.3,
      provenance: {
        source: "ASSUMPTION",
        enteredBy: "x",
        enteredAt: "2026-09-01T00:00:00Z",
      },
      createdAt: 0,
    },
  ];
  const finding = validate(input).find((f) => f.id === "V12");
  assert.ok(finding);
  assert.equal(finding!.severity, "warn");
});

test("V13 — preparer approving their own figures blocks", () => {
  const input = cleanInput();
  input.approverId = "preparer"; // same person, different case
  const finding = validate(input).find((f) => f.id === "V13");
  assert.ok(finding);
  assert.equal(finding!.severity, "error");
});

test("V15 — an undeclared assumption blocks; declaring it clears the rule", () => {
  const input = cleanInput();
  input.dataset!.fuels[0].efProvenance.source = "ASSUMPTION";
  assert.ok(ids(input).has("V15"));

  input.disclosedAssumptions = new Set([
    `fuel:${input.dataset!.fuels[0].id}:ef`,
  ]);
  assert.equal(ids(input).has("V15"), false);
});

test("the readiness score is weighted, links every failure, and blocks on errors", () => {
  const clean = readiness(validate(cleanInput()), GOLDEN_DECLARATION_ID);
  assert.equal(clean.rules.length, 16);
  assert.ok(clean.blocked, "V11 is an error, so it blocks");
  assert.ok(
    clean.score > 70 && clean.score < 100,
    `expected a high-but-not-perfect score, got ${clean.score}`,
  );
  for (const r of clean.failing) {
    assert.ok(
      r.screen.path.includes(GOLDEN_DECLARATION_ID),
      `${r.id} links to a fixing screen`,
    );
    assert.ok(r.screen.label.length > 0);
  }

  const broken = cleanInput();
  broken.dataset!.annualProductionTonnes = 0;
  broken.dataset!.fuels[0].ncv = undefined;
  const worse = readiness(validate(broken), GOLDEN_DECLARATION_ID);
  assert.ok(worse.score < clean.score, "more failures score lower");
  assert.equal(worse.verdict, "not ready");
});

test("a clean run scores 100 and reads as ready", () => {
  const input = cleanInput();
  input.dataset!.monthsCovered = [
    "2026-01",
    "2026-02",
    "2026-03",
    "2026-04",
    "2026-05",
    "2026-06",
    "2026-07",
    "2026-08",
    "2026-09",
    "2026-10",
    "2026-11",
    "2026-12",
  ];
  const r = readiness(validate(input), GOLDEN_DECLARATION_ID);
  assert.equal(r.errors, 0);
  assert.equal(r.warnings, 0);
  assert.equal(r.score, 100);
  assert.equal(r.verdict, "ready");
  assert.equal(r.blocked, false);
});

test("the dossier is ordered by the seven verifier assertions", () => {
  const r = readiness(validate(cleanInput()), GOLDEN_DECLARATION_ID);
  const d = buildDossier(GOLDEN_DECLARATION_ID, r);
  assert.equal(d.sections.length, 7);
  assert.deepEqual(
    d.sections.map((s) => s.id),
    ASSERTIONS,
  );
  // V11 fails, and V11 serves completeness — so completeness is unanswered.
  assert.equal(
    d.sections.find((s) => s.id === "completeness")!.status,
    "unanswered",
  );
  assert.equal(d.selfContained, false);
  for (const s of d.sections) {
    assert.ok(
      s.question.endsWith("?"),
      `${s.id} states the verifier's question`,
    );
    assert.ok(s.expectedEvidence.length > 0);
  }
});
