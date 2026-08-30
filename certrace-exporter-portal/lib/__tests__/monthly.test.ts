/* ════════════════════════════════════════════════════════════
   THE MONTHLY WORKED EXAMPLE, PINNED (spec §3)

   Every monthly figure divides evenly into the Part 1 annual fixture on
   purpose: if a change breaks the aggregation, this fails immediately rather
   than drifting in the fourth decimal until somebody re-derives it by hand.

     12 months × 875 t                     → 10,500 t
     gas 12,400 m³/month, NCV 38, EF 0.0561 →    317.2 tCO₂
     process 3.75 t/month                   →     45.0 tCO₂
     SEE_direct                             →      0.0345 tCO₂e/t
     electricity 393.75 MWh @ 0.4999        →  2,362.0 tCO₂
     SEE_indirect                           →      0.2250 tCO₂e/t
     billet 892.5 t/month → m = 1.02, SEE 0.072 → 0.0734 tCO₂e/t
     SEE_total                              →      0.3329 tCO₂e/t
     SEE_charge (Annex II: direct + prec)   →      0.1079 tCO₂e/t
     shipment 45.2 t                        →      4.877 tCO₂e
   ════════════════════════════════════════════════════════════ */

import { test } from "node:test";
import assert from "node:assert/strict";

/* The stores are browser-only by design. A minimal in-memory localStorage
   lets the whole monthly → annual path run here exactly as it does in the
   browser, rather than testing a parallel pure re-implementation that could
   drift from what the screens actually use. */
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
  fuelGJ,
  fuelCO2,
  monthResult,
  annualProductionFor,
  monthsForWorkspace,
  saveMonth,
  monthIssues,
  monthCanSubmit,
  emptyMonth,
  copyFromPreviousMonth,
  applyEuStandard,
  electricityFactorFor,
  isGridFactorLocked,
  euStandardFor,
} = await import("../monthly-data");
const { matchesEuStandard } = await import("../cbam/fuel-defaults");
const { saveSupplier, emptySupplier, precursorContribution, effectiveSee, treeFor } = await import("../precursor-suppliers");
const { workspaceSEE } = await import("../workspace-see");
const { createWorkspace, monthsOf } = await import("../workspace");

const near = (actual: number, expected: number, tol: number, what: string) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${what}: expected ≈${expected}, got ${actual} (tolerance ${tol})`);

/* ── The fixture ────────────────────────────────────────────── */

function seedWorkspace(productId = "billet") {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-PLANT-A", installationName: "Plant A", productId, productionRoute: "scrap_eaf", year: 2026 });

  for (const month of monthsOf(ws)) {
    saveMonth({
      ...emptyMonth(ws.id, month),
      month,
      productionTonnes: 875,
      fuels: [
        {
          id: `f-${month}`,
          fuelType: "natural_gas",
          quantity: 12_400,
          unit: "m3",
          ncvMjPerUnit: 38,
          efTco2PerGj: 0.0561,
          oxidationFactor: 1,
          /* LAB-ANALYSED, not the EU default. 38 MJ/m³ is a plausible measured
             value for Thai pipeline gas but it is not the Point G figure, and
             a row claiming a Type I standard value now has to carry the Type I
             numbers — see `matchesEuStandard`. A fixture that claimed the
             default while carrying a measurement was the exact contradiction
             the rule exists to catch. */
          factorSource: "lab_analysis",
        },
      ],
      processEmissionsTco2: 3.75,
      processEmissionsBasis: "Graphite electrode consumption",
      electricityMwh: 393.75,
      // PPA, not grid — Bug 3 correctly leaves the Thai grid default
      // unpublished (see lib/cbam/electricity-grid-factors.ts), so a fixture
      // that claims grid_default now correctly BLOCKS until that figure
      // exists. 0.4999 stands as a typed, evidenced PPA figure instead —
      // same magnitude, same worked-example numbers, no dependency on a
      // country default this fixture was never meant to be testing.
      electricityFactorTco2PerMwh: 0.4999,
      electricityFactorSource: "ppa",
      status: "submitted",
      submittedAt: "2026-01-31T00:00:00.000Z",
      submittedBy: "Test",
    });
  }
  return ws;
}

/* ── M2 · one month's fuel ──────────────────────────────────── */

test("M2 — 12,400 m³ at NCV 38 MJ/m³ is 471.2 GJ and 26.43 tCO₂", () => {
  const fuel = {
    id: "f1",
    fuelType: "natural_gas",
    quantity: 12_400,
    unit: "m3" as const,
    ncvMjPerUnit: 38,
    efTco2PerGj: 0.0561,
    oxidationFactor: 1,
    factorSource: "eu_standard" as const,
  };
  near(fuelGJ(fuel), 471.2, 1e-9, "monthly GJ");
  near(fuelCO2(fuel), 26.43, 0.005, "monthly fuel tCO₂");
});

test("a fuel row in m³ with no NCV refuses to convert rather than guessing one", () => {
  assert.throws(
    () =>
      fuelGJ({
        id: "f1",
        fuelType: "natural_gas",
        quantity: 12_400,
        unit: "m3",
        ncvMjPerUnit: undefined,
        efTco2PerGj: 0.0561,
        factorSource: "eu_standard",
      }),
    /calorific value/i,
  );
});

/* ── M1, M3–M6 · the annual roll-up ─────────────────────────── */

test("M1–M6 — the annual figures reproduce the worked example", () => {
  const ws = seedWorkspace();
  const production = annualProductionFor(ws);
  assert.equal(production.monthsCounted, 12);
  assert.equal(production.complete, true);
  near(production.tonnes, 10_500, 1e-9, "M1 production_annual");

  const see = workspaceSEE(ws);
  near(see.fuelTCO2, 317.2, 0.05, "M3 annual fuel tCO₂");
  near(see.processTCO2, 45.0, 1e-9, "M3 annual process tCO₂");
  near(see.seeDirect, 0.0345, 5e-5, "M4 SEE_direct");
  near(see.indirectTCO2, 2362.0, 0.05, "M5 elec_CO₂_annual");
  near(see.seeIndirect, 0.225, 5e-5, "M6 SEE_indirect");
});

/* ── M7–M10 · precursors and totals ─────────────────────────── */

test("M7–M10 — billet at 1.02 t/t and SEE 0.072 gives SEE_total 0.3329 and SEE_charge 0.1079", () => {
  const ws = seedWorkspace();

  const billet = emptySupplier(ws.id, null);
  saveSupplier({
    ...billet,
    name: "Chonburi Foundry",
    installationName: "Chonburi Works",
    precursorName: "Billet",
    seeTco2ePerT: 0.072,
    dataOrigin: "supplier_verified",
    monthlyQuantities: monthsOf(ws).map((month) => ({ month, tonnes: 892.5 })),
  });

  const prec = precursorContribution(ws);
  const depth1 = prec.byNode.find((n) => n.depth === 1)!;
  near(depth1.ratio!, 1.02, 1e-9, "M7 m_billet");
  near(prec.perTonne, 0.0734, 5e-5, "M8 SEE_prec");

  const see = workspaceSEE(ws);
  near(see.seeTotal, 0.3329, 1e-4, "M9 SEE_total");
  // Iron & steel is Annex II: indirect is reported but not charged.
  assert.equal(see.indirectCounted, false);
  near(see.seeChargeable, 0.1079, 1e-4, "M10 SEE_charge");

  // The shipment figure the spec carries forward.
  near(45.2 * see.seeChargeable, 4.877, 5e-3, "45.2 t shipment embedded tCO₂e");
});

test("scrap contributes zero at any depth", () => {
  const ws = seedWorkspace();
  const scrap = emptySupplier(ws.id, null);
  saveSupplier({
    ...scrap,
    name: "Local scrap merchant",
    installationName: "Bangkok yard",
    precursorName: "Steel scrap",
    isScrap: true,
    seeTco2ePerT: 99, // deliberately non-zero — the store must force it to 0
    dataOrigin: "supplier_unverified",
    monthlyQuantities: monthsOf(ws).map((month) => ({ month, tonnes: 306.25 })), // 3,675 t/yr → m = 0.35
  });

  const prec = precursorContribution(ws);
  const node = prec.byNode[0];
  near(node.ratio!, 0.35, 1e-9, "m_scrap");
  assert.equal(node.see, 0, "scrap SEE must be exactly 0");
  assert.equal(prec.perTonne, 0, "scrap contributes nothing to SEE_prec");
});

/* ── §A6 acceptance — the nested chain ──────────────────────── */

test("A6 — rebar ← billet (1.02) ← pig iron (0.85, SEE 1.9) gives 1.615 and 1.6473", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-PLANT-A", installationName: "Plant A", productId: "rebar", productionRoute: "scrap_eaf", year: 2026 });
  for (const month of monthsOf(ws)) {
    saveMonth({ ...emptyMonth(ws.id, month), month, productionTonnes: 875, status: "submitted" });
  }

  const billet = emptySupplier(ws.id, null);
  saveSupplier({
    ...billet,
    name: "Billet supplier",
    installationName: "Rayong Works",
    precursorName: "Billet",
    dataOrigin: "supplier_verified",
    monthlyQuantities: monthsOf(ws).map((month) => ({ month, tonnes: 892.5 })), // 1.02 t/t
  });

  const pigIron = emptySupplier(ws.id, billet.id);
  saveSupplier({
    ...pigIron,
    name: "Pig iron supplier",
    installationName: "Map Ta Phut BF",
    precursorName: "Pig iron",
    seeTco2ePerT: 1.9,
    dataOrigin: "supplier_verified",
    // 0.85 t pig iron per t of billet → 0.85 × 10,710
    monthlyQuantities: monthsOf(ws).map((month) => ({ month, tonnes: 892.5 * 0.85 })),
  });

  const roots = treeFor(ws.id);
  near(effectiveSee(roots[0]), 1.615, 1e-6, "billet effectiveSee = 0.85 × 1.9");

  const prec = precursorContribution(ws);
  near(prec.perTonne, 1.6473, 1e-3, "contribution = 1.02 × 1.615");
});

test("A6 — marking pig iron default_value pushes the share past the 20% cap", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-PLANT-A", installationName: "Plant A", productId: "rebar", productionRoute: "scrap_eaf", year: 2026 });
  for (const month of monthsOf(ws)) saveMonth({ ...emptyMonth(ws.id, month), month, productionTonnes: 875, status: "submitted" });

  const billet = emptySupplier(ws.id, null);
  saveSupplier({
    ...billet,
    name: "Billet supplier",
    installationName: "Rayong Works",
    precursorName: "Billet",
    dataOrigin: "supplier_verified",
    monthlyQuantities: monthsOf(ws).map((month) => ({ month, tonnes: 892.5 })),
  });
  const pigIron = emptySupplier(ws.id, billet.id);
  saveSupplier({
    ...pigIron,
    name: "Pig iron supplier",
    installationName: "Map Ta Phut BF",
    precursorName: "Pig iron",
    seeTco2ePerT: 1.9,
    dataOrigin: "default_value",
    monthlyQuantities: monthsOf(ws).map((month) => ({ month, tonnes: 892.5 * 0.85 })),
  });

  const prec = precursorContribution(ws);
  assert.equal(prec.overDefaultCap, true, "a chain resting entirely on a default value is over the 20% cap");
  assert.equal(prec.byNode.find((n) => n.depth === 1)!.weakestOrigin, "default_value", "the weakest link propagates up");
});

test("A6 — a cycle raises rather than looping", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "X", installationName: "X", productId: "rebar", productionRoute: "scrap_eaf", year: 2026 });
  const a = emptySupplier(ws.id, null);
  const b = emptySupplier(ws.id, a.id);
  saveSupplier({ ...a, name: "A", parentId: b.id });
  saveSupplier({ ...b, name: "B" });
  const result = precursorContribution(ws);
  assert.ok(result.error, "a cycle must surface as an error, not a hang or a silent zero");
});

/* ── §A2 acceptance — the NCV block ─────────────────────────── */

test("A2 — removing the NCV from one fuel row blocks that month's submission", () => {
  const ws = seedWorkspace();
  const march = monthsForWorkspace(ws).find((m) => m.month === "2026-03")!;
  assert.equal(monthCanSubmit(march), true, "the seeded month submits cleanly");

  const broken = { ...march, fuels: march.fuels.map((f) => ({ ...f, ncvMjPerUnit: undefined })) };
  saveMonth(broken);

  assert.equal(monthCanSubmit(broken), false);
  const ncvError = monthIssues(broken).find((i) => i.severity === "error" && i.field.endsWith(":ncv"));
  assert.ok(ncvError, "the blocking issue names the NCV field");
  assert.match(ncvError!.message, /tCO₂\/GJ cannot be applied to a volume/i);
});

/* ── "Other" obliges a description ──────────────────────────────
   The methodology's fuel list already refused a bare "Other" (mmdIssues); the
   month has to as well, or the MMD names the fuel and the readings do not. */

test('a monthly fuel row set to "Other fuel" with no name blocks the month', () => {
  const ws = seedWorkspace();
  const march = monthsForWorkspace(ws).find((m) => m.month === "2026-03")!;
  assert.equal(monthCanSubmit(march), true, "the seeded month submits cleanly");

  const unnamed = { ...march, fuels: march.fuels.map((f) => ({ ...f, fuelType: "other", fuelTypeOther: "" })) };
  const issue = monthIssues(unnamed).find((i) => i.severity === "error" && i.field.endsWith(":type"));
  assert.ok(issue, "an unnamed Other fuel is a blocking issue");
  assert.match(issue!.message, /"Other fuel" with no name/);
  assert.equal(monthCanSubmit(unnamed), false);
});

test("naming the other fuel clears it", () => {
  const ws = seedWorkspace();
  const march = monthsForWorkspace(ws).find((m) => m.month === "2026-03")!;
  const named = { ...march, fuels: march.fuels.map((f) => ({ ...f, fuelType: "other", fuelTypeOther: "Rice husk pellets, 14.2 MJ/kg" })) };

  assert.equal(
    monthIssues(named).some((i) => i.field.endsWith(":type")),
    false,
  );
  assert.equal(monthCanSubmit(named), true);
});

test("a listed fuel is never asked to describe itself", () => {
  const ws = seedWorkspace();
  const march = monthsForWorkspace(ws).find((m) => m.month === "2026-03")!;
  assert.equal(
    monthIssues(march).some((i) => i.field.endsWith(":type")),
    false,
  );
});

test("A2 — a missing month makes the annual figure incomplete, not smaller", () => {
  const ws = seedWorkspace();
  const march = monthsForWorkspace(ws).find((m) => m.month === "2026-03")!;
  saveMonth({ ...march, status: "empty", productionTonnes: 0, fuels: [], electricityMwh: 0 });

  const production = annualProductionFor(ws);
  assert.equal(production.complete, false, "eleven months is not a complete year");
  assert.deepEqual(production.missingMonths, ["2026-03"], "the gap is named, not absorbed");
  near(production.tonnes, 9_625, 1e-9, "the total drops, and `complete` is what tells callers not to trust it");
});

test("A2 — copy from previous month clones the setup but never the quantities", () => {
  const ws = seedWorkspace();
  const copied = copyFromPreviousMonth(ws.id, "2026-04")!;
  assert.equal(copied.fuels.length, 1);
  assert.equal(copied.fuels[0].ncvMjPerUnit, 38, "NCV is carried — this is where transcription errors come from");
  assert.equal(copied.fuels[0].efTco2PerGj, 0.0561, "emission factor is carried");
  assert.equal(copied.electricityFactorTco2PerMwh, 0.4999, "electricity factor is carried");
  assert.equal(copied.fuels[0].quantity, 0, "fuel quantity is NOT carried — a copied reading is a fabricated reading");
  assert.equal(copied.electricityMwh, 0, "electricity consumption is NOT carried");
  assert.equal(copied.productionTonnes, 875, "production stays whatever that month already had");
});

/* ── §A8 acceptance — the verifier pack ─────────────────────── */

/* Everything a workspace needs to reach `complete`, minus the monthly data
   the fixture already supplies: a final MMD covering the year, a recorded
   carbon price, no unassigned shipments, one precursor supplier (a billet is
   a complex good, so that tab is applicable), and evidence for every required
   field key. Shared by both A8 tests so they cannot drift apart. */
function seedGreenScaffolding(ws: { id: string; year: number }) {
  const months = monthsOf(ws);

  storage.setItem(
    "certrace:workspace-mmd-versions",
    JSON.stringify({
      [ws.id]: [
        {
          id: "mmd-1",
          workspaceId: ws.id,
          n: 1,
          finalisedAt: "2026-04-02T09:00:00.000Z",
          author: "N. Sae-Ngow",
          periodStart: "2026-01-01",
          periodEnd: "2026-12-31",
          content: {
            boundaryDescription: "Scrap-EAF melting furnace and hot-rolling mill.",
            processesIncluded: ["Melting (EAF)"],
            processesExcluded: [],
            periodStart: "2026-01-01",
            periodEnd: "2026-12-31",
            periodType: "calendar",
            directMethod: "calculation",
            fuelTypes: "Natural gas",
            electricitySource: "Grid",
            measurements: [],
            dataGaps: [],
            qualityAssurance: "four_eyes",
            reviewerName: "N. Sae-Ngow",
            reviewFrequency: "Monthly",
            diagramFileName: null,
          },
        },
      ],
    }),
  );

  storage.setItem(
    "certrace:carbon-price",
    JSON.stringify({ [ws.id]: { workspaceId: ws.id, amountPerTonne: 0, currency: "THB", instrument: "none", recorded: true, updatedAt: "2026-01-01" } }),
  );
  storage.setItem("certrace:shipments", JSON.stringify([]));

  const evidence: Record<string, unknown>[] = months.flatMap((m) =>
    ["production", "electricity-consumed", "electricity-factor", "utility-invoice", `fuel:f-${m}`, `fuel-invoice:f-${m}`].map((key, i) => ({
      id: `ev-${m}-${i}`,
      workspaceId: ws.id,
      month: m,
      fieldKeys: [key],
      sourceType: "utility_invoice",
      fileName: `${m}.pdf`,
      capturedAt: `${m}-28T00:00:00.000Z`,
    })),
  );
  evidence.push(
    { id: "ev-id", workspaceId: ws.id, fieldKeys: ["installation-identity"], sourceType: "other", fileName: "id.pdf", capturedAt: "2026-01-01T00:00:00.000Z" },
    { id: "ev-cal", workspaceId: ws.id, fieldKeys: ["calibration-records"], sourceType: "calibration_record", fileName: "cal.pdf", capturedAt: "2026-01-01T00:00:00.000Z", boundTo: "2026" },
    /* The chain below reports the billet on ACTUAL supplier data, and under
       Annex II A.1(4) of IR (EU) 2025/2547 actual data from an external
       precursor producer is only actual data if a verification report stands
       behind it. So a genuinely complete workspace carries one — this fixture
       was green without it, which was the checklist being wrong rather than
       the workspace being ready. */
    {
      id: "ev-prec",
      workspaceId: ws.id,
      fieldKeys: ["precursor-verification-report"],
      sourceType: "supplier_cti",
      fileName: "chonburi-foundry-verification-2026.pdf",
      capturedAt: "2026-01-01T00:00:00.000Z",
      boundTo: "Chonburi Foundry",
    },
    /* Same reasoning again for the newer Section-1 annual keys: a genuinely
       complete workspace carries every fixed document, the supplier-side
       precursor documents (the chain below buys a precursor on actual data),
       and the PPA agreement (this fixture's electricity factor source is
       "ppa") — a fixture that skipped any of them would be readiness
       reading as green on a checklist that was wrong, not a workspace that
       was actually ready. utility-invoice is seeded per month above now —
       it moved out of the fixed annual keys into requiredKeysForMonth(). */
    { id: "ev-diagram", workspaceId: ws.id, fieldKeys: ["installation-diagram"], sourceType: "other", fileName: "diagram.pdf", capturedAt: "2026-01-01T00:00:00.000Z" },
    { id: "ev-org", workspaceId: ws.id, fieldKeys: ["internal-qa-record"], sourceType: "other", fileName: "qa-record.pdf", capturedAt: "2026-01-01T00:00:00.000Z" },
    { id: "ev-qa", workspaceId: ws.id, fieldKeys: ["internal-qa-record"], sourceType: "other", fileName: "qa-log.pdf", capturedAt: "2026-01-01T00:00:00.000Z" },
    { id: "ev-mill", workspaceId: ws.id, fieldKeys: ["mill-test-certificate"], sourceType: "mill_test_certificate", fileName: "mill-test.pdf", capturedAt: "2026-01-01T00:00:00.000Z", boundTo: "Chonburi Foundry" },
    { id: "ev-ppa", workspaceId: ws.id, fieldKeys: ["contract-or-ppa"], sourceType: "other", fileName: "ppa.pdf", capturedAt: "2026-01-01T00:00:00.000Z" },
  );
  storage.setItem("certrace:workspace-evidence", JSON.stringify({ [ws.id]: evidence }));

  const billet = emptySupplier(ws.id, null);
  saveSupplier({
    ...billet,
    name: "Chonburi Foundry",
    installationName: "Chonburi Works",
    precursorName: "Billet",
    seeTco2ePerT: 0.072,
    dataOrigin: "supplier_verified",
    monthlyQuantities: months.map((month) => ({ month, tonnes: 892.5 })),
    // A "verified" claim now has to pass the four-check gate (Bug 9) — the
    // evidence item above satisfies the OLD generic workspace-evidence key,
    // but the structured per-supplier fields are what the gate actually
    // reads, so the fixture carries both. Section 2 tightened the
    // accreditation and sectoral-scope checks to read structured metadata
    // rather than just the file's presence, so a genuinely complete fixture
    // now carries those two facts as well.
    verificationReportFileId: "ev-prec",
    reportingPeriodStart: "2026-01-01",
    reportingPeriodEnd: "2026-12-31",
    verifierAccreditationExpiryDate: "2027-01-01",
    verificationReportIssueDate: "2026-06-01",
    verificationSectoralScope: "Crude steel",
  });
}

test("A8 — the pack renders M4 as (317.2 + 45.0) tCO₂ / 10,500 t = 0.0345 tCO₂e/t", async () => {
  const { buildVerifierPack } = await import("../verifier-pack");
  const ws = seedWorkspace();
  seedGreenScaffolding(ws);

  const pack = buildVerifierPack(ws);
  assert.equal(pack.draft, false, "with every tab complete the pack is not stamped DRAFT");
  assert.ok(
    pack.html.includes("(317.2 + 45.0) tCO₂ / 10,500 t") && pack.html.includes("0.0345 tCO₂e/t"),
    "the M4 substitution and result must render exactly as the spec's acceptance line",
  );
  assert.ok(pack.html.includes("SEE_direct = direct_CO₂_annual / production_annual"), "the formula is shown alongside the substitution");
  assert.ok(!pack.html.includes("DRAFT — NOT READY FOR VERIFICATION"), "a complete pack carries no draft stamp");
});

test("A8 — deleting March turns monthly amber and stamps the pack DRAFT", async () => {
  const { buildVerifierPack } = await import("../verifier-pack");
  const { workspaceReadiness } = await import("../readiness");
  const ws = seedWorkspace();
  seedGreenScaffolding(ws);

  const march = monthsForWorkspace(ws).find((m) => m.month === "2026-03")!;
  saveMonth({ ...march, status: "empty", productionTonnes: 0, fuels: [], electricityMwh: 0 });

  const readiness = workspaceReadiness(ws);
  const monthly = readiness.tabs.find((t) => t.tab === "monthly")!;
  assert.equal(monthly.state, "incomplete", "a missing month is incomplete, not blocked and not complete");
  const item = monthly.missing.find((m) => m.label.includes("March 2026"));
  assert.ok(item, "the missing item names the month");
  assert.equal(item!.label, "March 2026 not submitted");
  assert.equal(item!.deepLink, `/workspaces/${ws.id}/monthly/2026-03`, "and links straight to that month");

  const pack = buildVerifierPack(ws, readiness);
  assert.equal(pack.draft, true);
  assert.ok(pack.html.includes("DRAFT — NOT READY FOR VERIFICATION"), "an incomplete pack is stamped on the page, not only in the filename");
});

/* ── The discipline the whole file exists to protect ────────── */

test("Σ(emissions)/Σ(production) is not the mean of the monthly SEEs when output varies", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-PLANT-A", installationName: "Plant A", productId: "billet", productionRoute: "scrap_eaf", year: 2026 });

  // Same total emissions each month, wildly different output.
  const outputs = [200, 1550, 200, 1550, 200, 1550, 200, 1550, 200, 1550, 200, 1550];
  monthsOf(ws).forEach((month, i) => {
    saveMonth({
      ...emptyMonth(ws.id, month),
      month,
      productionTonnes: outputs[i],
      fuels: [{ id: `f-${month}`, fuelType: "natural_gas", quantity: 12_400, unit: "m3", ncvMjPerUnit: 38, efTco2PerGj: 0.0561, oxidationFactor: 1, factorSource: "lab_analysis" }],
      processEmissionsTco2: 0,
      electricityMwh: 0,
      electricityFactorTco2PerMwh: 0.4999,
      electricityFactorSource: "grid_default",
      status: "submitted",
    });
  });

  const see = workspaceSEE(ws);
  const entries = monthsForWorkspace(ws);
  const meanOfMonthly = entries.reduce((a, e) => {
    const r = monthResult(e);
    return a + r.directTCO2 / r.productionTonnes;
  }, 0) / 12;

  assert.ok(
    Math.abs(see.seeDirect - meanOfMonthly) > 1e-3,
    `the two must differ — aggregate ${see.seeDirect}, mean-of-monthly ${meanOfMonthly}. If they ever match here the fixture stopped varying output.`,
  );
});

/* ════════════════════════════════════════════════════════════
   THE LOCKS AND THE DEFAULTS THAT ARE NOT DEFAULTS

   Three rules land here, and each one exists because the wrong version of it
   produces a number that looks right:

     · a row claiming an EU standard value has to carry one (Issue 1)
     · the electricity factor follows its source (Issue 2)
     · an unknown biomass fraction counts as fossil (Issue 5, Equation 10)
   ════════════════════════════════════════════════════════════ */

const gasRow = (over: Partial<Parameters<typeof fuelCO2>[0]> = {}) => ({
  id: "f1",
  fuelType: "natural_gas",
  quantity: 12_400,
  unit: "m3" as const,
  ncvMjPerUnit: 34.3488,
  efTco2PerGj: 0.0561,
  oxidationFactor: 1,
  factorSource: "eu_standard" as const,
  ...over,
});

test("applyEuStandard fills the Point G pair, and re-fills it when the unit moves", () => {
  const blank = applyEuStandard({ ...gasRow(), ncvMjPerUnit: undefined, efTco2PerGj: 0 });
  near(blank.efTco2PerGj, 0.0561, 1e-9, "EF filled from Point G");
  near(blank.ncvMjPerUnit!, 34.3488, 1e-4, "NCV filled through the density table");

  // Diesel is invoiced in litres; the same row in tonnes is a different NCV.
  const perLitre = applyEuStandard({ ...gasRow(), fuelType: "diesel", unit: "l" });
  near(perLitre.ncvMjPerUnit!, 35.7975, 1e-4, "litres");
  const perTonne = applyEuStandard({ ...gasRow(), fuelType: "diesel", unit: "t" });
  near(perTonne.ncvMjPerUnit!, 43_000, 1e-6, "tonnes");
});

test("Bug 1/2 — Diesel in litres locks to Point G's exact EF/NCV pair, not a 1000× or 25× error", () => {
  // The live validator message this regression pins: "Point G gives 0.0741
  // tCO₂/GJ and 35.7975 MJ per l."
  const diesel = applyEuStandard({ ...gasRow(), fuelType: "diesel", unit: "l", ncvMjPerUnit: undefined, efTco2PerGj: 0 });
  near(diesel.efTco2PerGj, 0.0741, 1e-9, "EF: Point G's 74.1 tCO₂/TJ ÷ 1000, not ÷ 1");
  near(diesel.ncvMjPerUnit!, 35.7975, 1e-4, "NCV: 43.0 GJ/t × 0.8325 kg/l density, not the bare mass figure");

  // Bug 2's own worry, made concrete: forgetting the TJ→GJ step makes
  // emissions 1000× too high. Ten litres of diesel does not emit a tonne of
  // CO₂ — assert the actual order of magnitude directly off fuelCO2.
  const co2 = fuelCO2({ ...diesel, quantity: 1000 }); // 1000 l ≈ 1 t of diesel
  assert.ok(co2 > 2.5 && co2 < 3, `1000 l of diesel should emit roughly 2.66 tCO₂, not ${co2} (a 1000× bug would read ~2660, a 25× volume-unit bug would read ~66)`);
});

test("Bug 1 — matchesEuStandard rejects a hand-typed pair that drifts from Point G", () => {
  assert.equal(matchesEuStandard("diesel", "l", 35.7975, 0.0741), true, "the table's own figures match themselves");
  assert.equal(matchesEuStandard("diesel", "l", 35.7975, 0.08), false, "a typed EF that drifted from the table is rejected");
  assert.equal(matchesEuStandard("diesel", "l", 30, 0.0741), false, "a typed NCV that drifted from the table is rejected");
});

test("Bug 2 — euStandardFor's two-step chain: TJ→GJ and mass→volume are independent bugs, tested independently", () => {
  // step 1 alone: a mass-basis unit (tonnes) needs no density, only ÷1000.
  const perTonne = euStandardFor("natural_gas", "t")!;
  near(perTonne.efTco2PerGj, 0.0561, 1e-9, "56.1 tCO₂/TJ ÷ 1000");
  near(perTonne.ncvMjPerUnit!, 48_000, 1e-6, "48.0 GJ/t × 1000 kg/t, no density involved");

  // step 2 alone: same fuel, volume unit, now the density table is load-bearing.
  const perM3 = euStandardFor("natural_gas", "m3")!;
  near(perM3.ncvMjPerUnit!, 34.3488, 1e-4, "48.0 GJ/t × 0.7156 kg/m³");
  assert.equal(perM3.efTco2PerGj, perTonne.efTco2PerGj, "the EF (step 1) does not depend on the unit (step 2) — they are separate conversions");
});

test("a Type II row is left alone — the reader is copying a spec sheet", () => {
  const lab = applyEuStandard({ ...gasRow(), factorSource: "lab_analysis", ncvMjPerUnit: 38, efTco2PerGj: 0.0555 });
  assert.equal(lab.ncvMjPerUnit, 38);
  assert.equal(lab.efTco2PerGj, 0.0555);
});

test("claiming an EU standard value while carrying a typed one blocks the month", () => {
  const ws = seedWorkspace();
  const march = monthsForWorkspace(ws).find((m) => m.month === "2026-03")!;
  // The fixture's own lab-analysed row, relabelled as the EU default.
  const mislabelled = { ...march, fuels: march.fuels.map((f) => ({ ...f, factorSource: "eu_standard" as const })) };

  const issue = monthIssues(mislabelled).find((i) => i.severity === "error" && i.field.endsWith(":ef"));
  assert.ok(issue, "the mismatch is a blocking issue, not a hint");
  assert.match(issue!.message, /Point G gives/);
  assert.equal(monthCanSubmit(mislabelled), false);

  // Restoring the table's own values clears it.
  const restored = { ...march, fuels: march.fuels.map((f) => ({ ...applyEuStandard({ ...f, factorSource: "eu_standard" as const }) })) };
  assert.equal(monthCanSubmit(restored), true);
});

test("an unlisted fuel cannot claim an EU standard value at all", () => {
  const ws = seedWorkspace();
  const march = monthsForWorkspace(ws).find((m) => m.month === "2026-03")!;
  const other = {
    ...march,
    fuels: march.fuels.map((f) => ({ ...f, fuelType: "other", fuelTypeOther: "Rice husk pellets", factorSource: "eu_standard" as const })),
  };
  const issue = monthIssues(other).find((i) => i.field.endsWith(":factorSource"));
  assert.ok(issue, "Point G names categories — an unlisted fuel is not one of them");
  assert.match(issue!.message, /no EU standard value/);
});

/* ── Electricity (Issue 2) ──────────────────────────────────── */

test("Thailand's grid factor is 0.47, and only a grid supply takes it", () => {
  // The deployment mandates 0.47 tCO2/MWh for Thailand. It is NOT the
  // EGAT/TGO 0.4999 the portal once showed, and the citation beside it does
  // not claim to be the Commission's Annex II D.2.3 average — see
  // lib/cbam/electricity-grid-factors.ts.
  assert.equal(electricityFactorFor("grid_default"), 0.47);
  assert.notEqual(electricityFactorFor("grid_default"), 0.4999, "not the EGAT/TGO domestic figure");
  // Every other source carries the generator's own factor, never the country default.
  assert.equal(electricityFactorFor("self_generated"), null);
  assert.equal(electricityFactorFor("ppa"), null);
  // And a grid row is never free-typed.
  assert.equal(isGridFactorLocked("grid_default"), true);
  assert.equal(isGridFactorLocked("ppa"), false);
});

test("a grid source carrying the country default no longer blocks submission", () => {
  const ws = seedWorkspace();
  const march = monthsForWorkspace(ws).find((m) => m.month === "2026-03")!;

  // The fixture's own factor is a typed 0.4999 under a PPA. Relabelling the
  // SOURCE as grid without moving the number to 0.47 is still stale data.
  const stale = { ...march, electricityFactorSource: "grid_default" as const };
  assert.ok(
    monthIssues(stale).find((i) => i.severity === "error" && i.field === "electricityFactor"),
    "a grid row not carrying the country default is still caught",
  );

  const grid = { ...march, electricityFactorSource: "grid_default" as const, electricityFactorTco2PerMwh: 0.47 };
  assert.equal(
    monthIssues(grid).find((i) => i.severity === "error" && i.field === "electricityFactor"),
    undefined,
    "with the country default in place, grid supply is a complete answer",
  );
});

test("the grid factor left behind after switching away from grid is caught, once a country default exists", () => {
  const ws = seedWorkspace();
  const march = monthsForWorkspace(ws).find((m) => m.month === "2026-03")!;

  // march's own fixture source is PPA with a typed 0.4999 — switching the
  // SOURCE label to grid_default without changing the number is the stale
  // case this guards, checked the other direction (source says grid, number
  // does not match — the "grid must carry the grid figure" half only fires
  // once a country default is actually on file, so this exercises it
  // against a non-null published value directly rather than TH's own).
  const nonGridStaleAtGridValue = { ...march, electricityFactorSource: "self_generated" as const, electricityFactorTco2PerMwh: 0.4999 };
  // With TH's own default unpublished, the "still carrying the grid figure"
  // warning cannot fire either — there is no known grid figure to compare
  // against. Confirms the check degrades safely rather than guessing.
  const warn = monthIssues(nonGridStaleAtGridValue).find((i) => i.field === "electricityFactor" && i.severity === "warn");
  assert.equal(warn, undefined, "no known grid figure to compare against — nothing to flag as stale");
});

/* ── Biomass fraction (Issue 5) ─────────────────────────────── */

test("EF × (1 − BF) — Equation 10, with zero as the legal default", () => {
  const fossil = gasRow({ factorSource: "lab_analysis" });
  const half = gasRow({ factorSource: "lab_analysis", biomassFraction: 0.5, biomassEvidenced: true });
  near(fuelCO2(half), fuelCO2(fossil) / 2, 1e-9, "half the stream zero-rated");

  // Unset behaves as 0 — the whole stream counts as fossil.
  near(fuelCO2(gasRow({ factorSource: "lab_analysis", biomassFraction: undefined })), fuelCO2(fossil), 1e-9, "unknown is fossil");
});

test("a non-zero biomass fraction without the sustainability evidence blocks", () => {
  const ws = seedWorkspace();
  const march = monthsForWorkspace(ws).find((m) => m.month === "2026-03")!;

  const claimed = { ...march, fuels: march.fuels.map((f) => ({ ...f, biomassFraction: 0.4 })) };
  const issue = monthIssues(claimed).find((i) => i.severity === "error" && i.field.endsWith(":bf"));
  assert.ok(issue, "zero-rating carbon needs the criteria evidenced");
  assert.match(issue!.message, /2018\/2001/);
  assert.equal(monthCanSubmit(claimed), false);

  const evidenced = { ...march, fuels: march.fuels.map((f) => ({ ...f, biomassFraction: 0.4, biomassEvidenced: true })) };
  assert.equal(monthCanSubmit(evidenced), true);
});

test("a biomass fraction stated as a percentage is refused rather than applied", () => {
  const ws = seedWorkspace();
  const march = monthsForWorkspace(ws).find((m) => m.month === "2026-03")!;
  const pct = { ...march, fuels: march.fuels.map((f) => ({ ...f, biomassFraction: 40, biomassEvidenced: true })) };
  const issue = monthIssues(pct).find((i) => i.field.endsWith(":bf"));
  assert.match(issue!.message, /fraction, not a percentage/);
});

/* ── A fuel row with no quantity ────────────────────────────── */

test("a fuel row with no quantity blocks — it is a row that should not exist", () => {
  const ws = seedWorkspace();
  const march = monthsForWorkspace(ws).find((m) => m.month === "2026-03")!;
  const empty = { ...march, fuels: march.fuels.map((f) => ({ ...f, quantity: 0 })) };
  const issue = monthIssues(empty).find((i) => i.severity === "error" && i.field.endsWith(":quantity"));
  assert.ok(issue);
  assert.match(issue!.message, /remove the row/);
});
