/* ════════════════════════════════════════════════════════════
   CERA'S SMART UPLOAD, PINNED

   The two example files that ship with Cera (lib/cera/__tests__/fixtures) are the
   fixtures: one says everything — installation, product, month and every
   reading — and must go through with no question; the other is a column of
   dated numbers with no label and no unit, and must ask what it measures and
   which product report it is for, and only then place it.
   ════════════════════════════════════════════════════════════ */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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
  analyzeText,
  applyPlan,
  describeAnalysis,
  isReadable,
  meterKindFromText,
  nextStep,
  monthsIn,
  editReading,
  planProblems,
} = await import("../smart-upload");
const { createWorkspace, listWorkspaces } = await import("../../workspace");
const { emptyInstallation, saveInstallation, listInstallations } = await import(
  "../../installations"
);
const { getMonth, saveMonth, emptyMonth } = await import("../../monthly-data");

const SAMPLE_1 = readFileSync(
  new URL(
    "./fixtures/cera-sample-1-monthly-report-march-2026.txt",
    import.meta.url,
  ),
  "utf8",
);
const SAMPLE_2 = readFileSync(
  new URL(
    "./fixtures/cera-sample-2-meter-MTR-2210-march-2026.csv",
    import.meta.url,
  ),
  "utf8",
);

function seed() {
  storage.clear();
  saveInstallation({
    ...emptyInstallation(true),
    id: "TH-RAYONG-01",
    name: "Rayong Works",
    street: "1",
    postcode: "2",
    city: "R",
    country: "TH",
    unlocode: "THMAT",
    lat: "1",
    lng: "1",
  });
  const iron = createWorkspace({
    installationId: "TH-RAYONG-01",
    installationName: "Rayong Works",
    productId: "ironore",
    productionRoute: "sintering",
    year: 2026,
    selfSupplied: true,
  });
  return { iron };
}

/* ── The file that says everything ──────────────────────────── */

test("a complete monthly report is read in full: every reading, with the line it came from", () => {
  seed();
  const a = analyzeText("report.txt", SAMPLE_1);
  const by = (k: string) => a.facts.filter((f) => f.kind === k);

  const prod = by("production")[0] as { tonnes: number };
  assert.equal(prod.tonnes, 4820.5);

  const fuels = by("fuel") as {
    fuelType: string;
    quantity: number;
    unit: string;
    ncvMjPerUnit?: number;
    source: string;
  }[];
  assert.deepEqual(
    fuels.map((f) => [f.fuelType, f.quantity, f.unit]),
    [
      ["natural_gas", 182400, "m3"],
      ["diesel", 14200, "l"],
    ],
  );
  assert.equal(
    fuels[0].ncvMjPerUnit,
    38.2,
    "the plant's own calorific value is carried",
  );
  assert.equal(
    fuels[1].ncvMjPerUnit,
    undefined,
    "and not invented where the file has none",
  );
  assert.match(fuels[0].source, /Natural gas/);

  const el = by("electricity")[0] as {
    mwh: number;
    sourceType: string;
    factor?: number;
    installation?: string;
  };
  assert.equal(el.mwh, 2140);
  assert.equal(el.sourceType, "ppa");
  assert.equal(el.factor, 0.05);
  assert.equal(el.installation, "Rayong Solar Farm 2");

  const proc = by("process")[0] as {
    materialId: string;
    method: string;
    quantityT: number;
  };
  assert.deepEqual(
    [proc.materialId, proc.method, proc.quantityT],
    ["CaCO3", "standard", 310],
  );

  assert.match((by("notes")[0] as { text: string }).text, /Furnace 2 was down/);
  assert.equal(a.context.statedMonth, "2026-03");
  assert.deepEqual(a.context.installationIds, ["TH-RAYONG-01"]);
  assert.deepEqual(a.context.cns, ["26011200"]);
});

test("a file that says where everything goes needs no question", () => {
  const { iron } = seed();
  // A second product report at the same installation, so "which one" is a real question — the CN code answers it.
  createWorkspace({
    installationId: "TH-RAYONG-01",
    installationName: "Rayong Works",
    productId: "cn25070080",
    productionRoute: "calcining",
    year: 2026,
    selfSupplied: true,
  });
  const step = nextStep(
    analyzeText("report.txt", SAMPLE_1),
    {},
    listWorkspaces(),
  );
  assert.equal(step.kind, "plan");
  if (step.kind !== "plan") return;
  assert.equal(step.plan.workspaceId, iron.id);
  assert.equal(step.plan.month, "2026-03");
  assert.equal(step.plan.documentKind, "monthly operations report");
});

test("the plan shows only what was found, laid out as the form — with the numbered box and whether it is required", () => {
  seed();
  const step = nextStep(
    analyzeText("report.txt", SAMPLE_1),
    {},
    listWorkspaces(),
  );
  assert.equal(step.kind, "plan");
  if (step.kind !== "plan") return;
  const r = (label: string, section: string) =>
    step.plan.readings.find((x) => x.label === label && x.section === section);

  assert.deepEqual(
    [
      r("Produced this month", "production")?.tag,
      r("Produced this month", "production")?.need,
    ],
    ["13 · 34(a)", "required"],
  );
  assert.equal(r("Quantity", "fuel")?.tag, "16(a)");
  assert.equal(r("Calorific value", "fuel")?.value, "38.2");
  assert.equal(r("Consumed", "electricity")?.tag, "10 · 12");
  assert.equal(
    r("Emission factor", "electricity")?.tag,
    "12 · 33",
    "a PPA factor is item 33",
  );
  assert.equal(
    r("Installation it comes from", "electricity")?.need,
    "optional",
  );
  assert.equal(r("Material", "process")?.value, "CaCO3 (carbonate)");
  assert.equal(
    r("What was missing or estimated, and anything unusual", "notes")?.need,
    "optional",
  );

  // Diesel's calorific value was not in the file, so no box for it is shown.
  assert.equal(
    step.plan.readings.filter((x) => x.label === "Calorific value").length,
    1,
  );
  assert.ok(step.plan.readings.every((x) => x.source && x.included));
});

test("pressing Fill in writes the month, and marks what Cera wrote", () => {
  const { iron } = seed();
  const step = nextStep(
    analyzeText("report.txt", SAMPLE_1),
    {},
    listWorkspaces(),
  );
  assert.equal(step.kind, "plan");
  if (step.kind !== "plan") return;

  const done = applyPlan(step.plan);
  assert.equal(done.ok, true);

  const m = getMonth(iron.id, "2026-03")!;
  assert.equal(m.productionTonnes, 4820.5);
  assert.equal(m.status, "draft", "a filled month is a draft, never submitted");
  assert.equal(m.fuels.length, 2);
  const gas = m.fuels.find((f) => f.fuelType === "natural_gas")!;
  assert.deepEqual(
    [gas.quantity, gas.unit, gas.ncvMjPerUnit, gas.factorSource],
    [182400, "m3", 38.2, "supplier_specific"],
  );
  assert.equal(
    gas.efTco2PerGj,
    0.0561,
    "the factor still comes from the EU table",
  );
  const diesel = m.fuels.find((f) => f.fuelType === "diesel")!;
  assert.equal(
    diesel.factorSource,
    "eu_standard",
    "no calorific value in the file → the EU standard fills in",
  );
  assert.ok(
    diesel.ncvMjPerUnit && diesel.ncvMjPerUnit > 35 && diesel.ncvMjPerUnit < 37,
  );

  const src = m.electricitySources![0];
  assert.deepEqual(
    [src.sourceType, src.mwh, src.factorTco2PerMwh, src.supplierInstallation],
    ["ppa", 2140, 0.05, "Rayong Solar Farm 2"],
  );
  assert.equal(m.electricityMwh, 2140);

  assert.equal(m.processEmissionEntries![0].materialId, "CaCO3");
  assert.match(m.notes!, /Furnace 2/);
  assert.equal(
    JSON.parse(storage.getItem("certrace:ai-filled")!)[`ws:${iron.id}`][
      "2026-03:production"
    ].value,
    "4820.5",
  );
});

test("unticking a reading keeps it out", () => {
  const { iron } = seed();
  const step = nextStep(
    analyzeText("report.txt", SAMPLE_1),
    {},
    listWorkspaces(),
  );
  if (step.kind !== "plan") return assert.fail("expected a plan");
  for (const r of step.plan.readings)
    if (r.section === "fuel" && r.groupLabel === "Fuel 2") r.included = false;
  for (const r of step.plan.readings)
    if (r.section === "fuel" && r.group === "fuel2") r.included = false;
  applyPlan(step.plan);
  const m = getMonth(iron.id, "2026-03")!;
  assert.deepEqual(
    m.fuels.map((f) => f.fuelType),
    ["natural_gas"],
  );
});

test("filling a month that already has figures adds to it and leaves the rest alone", () => {
  const { iron } = seed();
  saveMonth({
    ...emptyMonth(iron.id, "2026-03"),
    status: "draft",
    notes: "Earlier note.",
    fuels: [
      {
        id: "f0",
        fuelType: "natural_gas",
        quantity: 1,
        unit: "m3",
        efTco2PerGj: 0.0561,
        factorSource: "eu_standard",
      },
    ],
  });
  const step = nextStep(
    analyzeText("report.txt", SAMPLE_1),
    {},
    listWorkspaces(),
  );
  if (step.kind !== "plan") return assert.fail("expected a plan");
  applyPlan(step.plan);
  const m = getMonth(iron.id, "2026-03")!;
  assert.equal(
    m.fuels.length,
    2,
    "natural gas was updated in place, diesel was added",
  );
  assert.equal(m.fuels.find((f) => f.fuelType === "natural_gas")!.id, "f0");
  assert.match(m.notes!, /Earlier note\.\nFurnace 2/);
});

test("a month that has been submitted is never touched", () => {
  const { iron } = seed();
  saveMonth({
    ...emptyMonth(iron.id, "2026-03"),
    status: "submitted",
    productionTonnes: 100,
  });
  const step = nextStep(
    analyzeText("report.txt", SAMPLE_1),
    {},
    listWorkspaces(),
  );
  assert.equal(step.kind, "stop");
  assert.match(
    (step as { text: string }).text,
    /already submitted, so I won't change it/,
  );
  assert.equal(getMonth(iron.id, "2026-03")!.productionTonnes, 100);
});

/* ── Checking and changing what was found ──────────────────── */

test("the reader can change a number before anything is written, and the change is what goes into the month", () => {
  const { iron } = seed();
  const step = nextStep(
    analyzeText("report.txt", SAMPLE_1),
    {},
    listWorkspaces(),
  );
  if (step.kind !== "plan") return assert.fail("expected a plan");
  let plan = step.plan;
  const id = (field: string) =>
    plan.readings.find((r) => r.field === field)!.id;

  plan = editReading(plan, id("production"), { raw: "4,900" });
  const prod = plan.readings.find((r) => r.field === "production")!;
  assert.deepEqual(
    [prod.raw, prod.value, prod.edited, prod.found.raw],
    ["4,900", "4,900", true, "4820.5"],
    "shown as the form shows it, and remembered as a change",
  );

  plan = editReading(plan, id("production"), { raw: "4820.5" });
  assert.equal(
    plan.readings.find((r) => r.field === "production")!.edited,
    false,
    "typing the original back is no change",
  );

  plan = editReading(plan, id("production"), { raw: "4900" });
  plan = editReading(plan, id("elecMwh"), { raw: "2200" });
  plan = editReading(plan, id("elecFactor"), { raw: "0.04" });
  assert.deepEqual(planProblems(plan), {});

  assert.equal(
    getMonth(iron.id, "2026-03") ?? null,
    null,
    "nothing is written while the reader is still checking",
  );
  assert.equal(applyPlan(plan).ok, true);
  const m = getMonth(iron.id, "2026-03")!;
  assert.equal(m.productionTonnes, 4900);
  assert.deepEqual(
    [m.electricitySources![0].mwh, m.electricitySources![0].factorTco2PerMwh],
    [2200, 0.04],
  );
  assert.equal(m.electricityMwh, 2200);
});

test("a changed unit follows through to the calorific value, and is what is written", () => {
  const { iron } = seed();
  const step = nextStep(
    analyzeText("report.txt", SAMPLE_1),
    {},
    listWorkspaces(),
  );
  if (step.kind !== "plan") return assert.fail("expected a plan");
  const qty = step.plan.readings.find((r) => r.field === "fuelQty")!;
  const plan = editReading(step.plan, qty.id, { unitId: "kg" });
  assert.equal(plan.readings.find((r) => r.id === qty.id)!.unit, "kg");
  assert.equal(
    plan.readings.find((r) => r.field === "fuelNcv")!.unit,
    "MJ/kg",
    "the calorific value is per the same unit",
  );
  applyPlan(plan);
  assert.equal(
    getMonth(iron.id, "2026-03")!.fuels.find(
      (f) => f.fuelType === "natural_gas",
    )!.unit,
    "kg",
  );
});

test("a figure that is not a number blocks the fill — until it is fixed or its row is unticked", () => {
  seed();
  const step = nextStep(
    analyzeText("report.txt", SAMPLE_1),
    {},
    listWorkspaces(),
  );
  if (step.kind !== "plan") return assert.fail("expected a plan");
  const prod = step.plan.readings.find((r) => r.field === "production")!;

  let plan = editReading(step.plan, prod.id, { raw: "" });
  assert.equal(planProblems(plan)[prod.id], "Enter a number.");
  plan = editReading(plan, prod.id, { raw: "12x" });
  assert.equal(planProblems(plan)[prod.id], "That is not a number.");
  plan = editReading(plan, prod.id, { raw: "-5" });
  assert.equal(planProblems(plan)[prod.id], "It cannot be negative.");

  plan = {
    ...plan,
    readings: plan.readings.map((r) =>
      r.id === prod.id ? { ...r, included: false } : r,
    ),
  };
  assert.deepEqual(
    planProblems(plan),
    {},
    "a row that is not going in cannot be wrong",
  );
});

test("a choice can be changed, and a different method clears a material it does not have", () => {
  seed();
  const step = nextStep(
    analyzeText("report.txt", SAMPLE_1),
    {},
    listWorkspaces(),
  );
  if (step.kind !== "plan") return assert.fail("expected a plan");
  const fuelType = step.plan.readings.find((r) => r.field === "fuelType")!;
  let plan = editReading(step.plan, fuelType.id, { raw: "diesel" });
  assert.equal(
    plan.readings.find((r) => r.id === fuelType.id)!.value,
    "Diesel",
  );

  const method = plan.readings.find((r) => r.field === "procMethod")!;
  plan = editReading(plan, method.id, { raw: "mass_balance" });
  const material = plan.readings.find((r) => r.field === "procMaterial")!;
  assert.equal(
    material.raw,
    "",
    "CaCO3 is a standard-method material, not a mass-balance one",
  );
  assert.equal(planProblems(plan)[material.id], "Choose one.");
  plan = editReading(plan, material.id, { raw: "petroleum_coke" });
  assert.deepEqual(planProblems(plan), {});
});

/* ── The file that does not say ─────────────────────────────── */

test("a column of bare readings asks what it measures, then which product report, then places it", () => {
  const { iron } = seed();
  const other = createWorkspace({
    installationId: "TH-RAYONG-01",
    installationName: "Rayong Works",
    productId: "cn25070080",
    productionRoute: "calcining",
    year: 2026,
    selfSupplied: true,
  });
  const a = analyzeText("MTR-2210-march-2026.csv", SAMPLE_2);

  assert.equal(a.facts.length, 0, "nothing in the file says what it is");
  assert.equal(a.meter?.rows, 31);
  assert.equal(a.meter?.total, 479666);
  assert.equal(a.meter?.header, "reading");
  assert.deepEqual(
    Object.keys(a.context.months),
    ["2026-03"],
    "the dates give the month without being asked",
  );

  const q1 = nextStep(a, {}, listWorkspaces());
  assert.equal(q1.kind, "ask");
  if (q1.kind !== "ask") return;
  assert.equal(q1.card.id, "meter");
  assert.match(q1.text, /31 dated readings for March 2026/);
  assert.ok(q1.card.options.some((o) => o.id === "electricity_kwh"));

  const q2 = nextStep(a, { meterKind: "electricity_kwh" }, listWorkspaces());
  assert.equal(
    q2.kind,
    "ask",
    "two product reports and nothing to tell them apart",
  );
  if (q2.kind !== "ask") return;
  assert.equal(q2.card.id, "workspace");
  assert.deepEqual(
    q2.card.options.map((o) => o.id).sort(),
    [iron.id, other.id].sort(),
  );

  const done = nextStep(
    a,
    { meterKind: "electricity_kwh", workspaceId: iron.id },
    listWorkspaces(),
  );
  assert.equal(
    done.kind,
    "plan",
    "the month came from the dates, so no third question",
  );
  if (done.kind !== "plan") return;
  assert.equal(done.plan.month, "2026-03");
  assert.equal(
    done.plan.readings.find((r) => r.label === "Consumed")?.value,
    "479.666",
    "kWh become MWh",
  );
  assert.equal(done.plan.documentKind, "meter log");
});

test("the answer decides the unit: the same column is gas, or diesel, or production", () => {
  const { iron } = seed();
  const a = analyzeText("m.csv", SAMPLE_2);
  const plan = (kind: string) => {
    const s = nextStep(
      a,
      { meterKind: kind, workspaceId: iron.id },
      listWorkspaces(),
    );
    return s.kind === "plan" ? s.plan : null;
  };
  assert.equal(
    plan("gas_m3")!.readings.find((r) => r.label === "Fuel")!.value,
    "Natural gas",
  );
  assert.equal(
    plan("gas_m3")!.readings.find((r) => r.label === "Quantity")!.unit,
    "m³",
  );
  assert.equal(
    plan("diesel_l")!.readings.find((r) => r.label === "Quantity")!.unit,
    "litres",
  );
  assert.equal(plan("production_t")!.readings[0].label, "Produced this month");
  assert.equal(
    plan("electricity_mwh")!.readings.find((r) => r.label === "Consumed")!
      .value,
    "479,666",
  );
  const other = nextStep(
    a,
    { meterKind: "other", workspaceId: iron.id },
    listWorkspaces(),
  );
  assert.equal(other.kind, "stop");
});

test("with one product report there is nothing to ask about it", () => {
  seed();
  const a = analyzeText("m.csv", SAMPLE_2);
  const s = nextStep(a, { meterKind: "electricity_kwh" }, listWorkspaces());
  assert.equal(s.kind, "plan");
});

test("a file that mentions several months, or none, asks for the month", () => {
  const { iron } = seed();
  const two = analyzeText(
    "r.txt",
    "Installation: TH-RAYONG-01\nProduct CN 2601 12 00\nProduction in February 2026: 4,000 t\nProduction in March 2026: 4,800 t\n",
  );
  const s1 = nextStep(two, {}, listWorkspaces());
  assert.equal(s1.kind, "ask");
  if (s1.kind !== "ask") return;
  assert.equal(s1.card.id, "month");
  assert.match(s1.text, /2 different months/);
  assert.equal(s1.card.options.length, 12);

  const none = analyzeText("r.txt", "Natural gas: 12,000 m3\n");
  const s2 = nextStep(none, { workspaceId: iron.id }, listWorkspaces());
  assert.equal(s2.kind, "ask");
  assert.match((s2 as { text: string }).text, /doesn't say which month/);

  const placed = nextStep(
    none,
    { workspaceId: iron.id, month: "2026-05" },
    listWorkspaces(),
  );
  assert.equal(placed.kind, "plan");
  assert.equal((placed as { plan: { month: string } }).plan.month, "2026-05");
});

test("a file from another year than the product report is not silently placed", () => {
  const { iron } = seed();
  const a = analyzeText(
    "r.txt",
    "Installation: TH-RAYONG-01\nReporting month: March 2025\nElectricity: 100 MWh\n",
  );
  const s = nextStep(a, { workspaceId: iron.id }, listWorkspaces());
  assert.equal(s.kind, "ask");
  assert.match((s as { text: string }).text, /covers 2026/);
});

/* ── Files it cannot use ────────────────────────────────────── */

test("a PDF is accepted but not read, and Cera says where it goes instead", () => {
  seed();
  assert.equal(
    isReadable({ name: "bill.pdf", type: "application/pdf" }),
    false,
  );
  assert.equal(isReadable({ name: "bill.csv" }), true);
  const s = nextStep(
    {
      fileName: "bill.pdf",
      readable: false,
      facts: [],
      context: { installationIds: [], cns: [], haystack: "", months: {} },
    },
    {},
    listWorkspaces(),
  );
  assert.equal(s.kind, "stop");
  assert.match((s as { text: string }).text, /Documents step/);
});

test("prose with a number in it is not guessed at", () => {
  seed();
  const a = analyzeText(
    "note.txt",
    "Hi, the plant had a good month. We shipped about 4,000 pieces and the manager was happy.\nRegards\n",
  );
  assert.equal(a.facts.length, 0);
  // Nothing in it says what it is, so Cera asks the reader to say — and only gives up if the description does not help either.
  const s = nextStep(a, {}, listWorkspaces());
  assert.equal(s.kind, "describe");
  const again = nextStep(a, { described: true }, listWorkspaces());
  assert.equal(again.kind, "stop");
  assert.match(
    (again as { text: string }).text,
    /couldn't find a reading I can place/,
  );
});

test("with no product report at all, Cera says to make one first", () => {
  storage.clear();
  const s = nextStep(analyzeText("r.txt", SAMPLE_1), {}, []);
  assert.equal(s.kind, "stop");
  assert.match((s as { text: string }).text, /New product report/);
});

test("months are found in every way a plant writes a date", () => {
  assert.deepEqual(monthsIn("14/03/2026"), { "2026-03": 1 });
  assert.deepEqual(monthsIn("2026-03-14"), { "2026-03": 1 });
  assert.deepEqual(monthsIn("March 2026"), { "2026-03": 1 });
  assert.deepEqual(monthsIn("Mar 2026 and 04/2026"), {
    "2026-03": 1,
    "2026-04": 1,
  });
  assert.deepEqual(monthsIn("no dates here, 4820.5 t"), {});
});

test("a stray number is not read as a quantity — and units are not confused", () => {
  seed();
  const a = analyzeText(
    "r.txt",
    "Installation: TH-RAYONG-01\nReporting month: March 2026\nPlant ran 24 hours a day, 31 days\nElectricity: 482,100 kWh\nDiesel: 800 l\n",
  );
  const el = a.facts.find((f) => f.kind === "electricity") as
    | { mwh: number }
    | undefined;
  assert.equal(el?.mwh, 482.1, "kWh → MWh");
  const diesel = a.facts.find((f) => f.kind === "fuel") as
    | { quantity: number; unit: string }
    | undefined;
  assert.deepEqual([diesel?.quantity, diesel?.unit], [800, "l"]);
  assert.equal(a.facts.length, 2);
  void listInstallations;
});

/* ── Steel and aluminium: scrap and anode effects ────────────── */
const SMELTER = `Rayong Works — reporting month: March 2026
Primary aluminium produced: 1,200 t
Aluminium scrap melted: 300 t
  of which pre-consumer: 120 t
Anode effect minutes per cell-day: 0.85
`;

test("scrap and its pre-consumer part, and anode-effect minutes, are read from a smelter's report", () => {
  seed();
  const a = analyzeText("smelter.txt", SMELTER);
  const scrap = a.facts.find((f) => f.kind === "scrap") as {
    material: string;
    tonnes: number;
    preConsumerT?: number;
  };
  assert.deepEqual(
    [scrap.material, scrap.tonnes, scrap.preConsumerT],
    ["aluminium_scrap", 300, 120],
  );
  const pfc = a.facts.find((f) => f.kind === "pfc") as { aem: number };
  assert.equal(pfc.aem, 0.85);
  assert.equal(
    a.facts.filter((f) => f.kind === "production").length,
    1,
    "the scrap line is not production",
  );
});

test("a pre-consumer figure on the same line as the scrap is read too, and a steel scrap line lands on the carbon balance", () => {
  seed();
  const a = analyzeText(
    "steel.txt",
    "Steel scrap charged 1,800 t (pre-consumer 450 t)\nCast iron scrap 200 t\nScrap price 310 USD per tonne",
  );
  const scraps = a.facts.filter((f) => f.kind === "scrap") as {
    material: string;
    tonnes: number;
    preConsumerT?: number;
  }[];
  assert.deepEqual(
    scraps.map((s) => [s.material, s.tonnes, s.preConsumerT]),
    [
      ["steel_scrap", 1800, 450],
      ["iron_scrap", 200, undefined],
    ],
  );
});

test("filling a smelter month writes the scrap block and the anode-effect minutes", async () => {
  storage.clear();
  saveInstallation({
    ...emptyInstallation(true),
    id: "TH-RAYONG-01",
    name: "Rayong Works",
    street: "1",
    postcode: "2",
    city: "R",
    country: "TH",
    unlocode: "THMAT",
    lat: "1",
    lng: "1",
  });
  const { PRODUCT_CATALOG } = await import("../../config");
  const unwrought = PRODUCT_CATALOG.find((p) =>
    p.cnCode.replace(/\s/g, "").startsWith("7601"),
  )!;
  const al = createWorkspace({
    installationId: "TH-RAYONG-01",
    installationName: "Rayong Works",
    productId: unwrought.id,
    productionRoute: "hall_heroult",
    year: 2026,
    selfSupplied: true,
  });
  const step = nextStep(
    analyzeText("smelter.txt", SMELTER),
    {},
    listWorkspaces(),
  );
  assert.equal(step.kind, "plan");
  if (step.kind !== "plan") return;
  assert.ok(
    step.plan.readings.some(
      (r) => r.section === "scrap" && r.label === "of which pre-consumer",
    ),
  );
  assert.ok(
    step.plan.readings.some(
      (r) => r.section === "pfc" && r.tag === "16(a)" && r.need === "required",
    ),
  );
  const done = applyPlan(step.plan);
  assert.equal(done.ok, true);
  const m = getMonth(al.id, "2026-03")!;
  assert.deepEqual(m.scrap, { tonnes: 300, preConsumerT: 120 });
  assert.equal(m.pfc?.method, "slope");
  assert.equal(m.pfc?.aem, 0.85);
});

/* ── Many installations, years and products: one question at a time ─────────────── */

test("with several installations, years and products the question narrows: installation, then year, then product — each option names what it is", () => {
  storage.clear();
  saveInstallation({
    ...emptyInstallation(true),
    id: "TH-RAYONG-01",
    name: "Rayong Works",
    street: "1",
    postcode: "2",
    city: "R",
    country: "TH",
    unlocode: "THMAT",
    lat: "1",
    lng: "1",
  });
  saveInstallation({
    ...emptyInstallation(true),
    id: "TH-CHON-02",
    name: "Chonburi Mill",
    street: "1",
    postcode: "2",
    city: "C",
    country: "TH",
    unlocode: "THMAT",
    lat: "1",
    lng: "1",
  });
  const mk = (
    installationId: string,
    installationName: string,
    productId: string,
    year: number,
  ) =>
    createWorkspace({
      installationId,
      installationName,
      productId,
      productionRoute: "sintering",
      year,
      selfSupplied: true,
    });
  mk("TH-RAYONG-01", "Rayong Works", "ironore", 2026);
  mk("TH-RAYONG-01", "Rayong Works", "cn25070080", 2026);
  mk("TH-RAYONG-01", "Rayong Works", "ironore", 2025);
  mk("TH-CHON-02", "Chonburi Mill", "ironore", 2026);
  const a = analyzeText(
    "report.txt",
    "Natural gas: 1,000 m3\nProduced this month: 50 t\n",
  );

  const s1 = nextStep(a, {}, listWorkspaces());
  assert.equal(s1.kind, "ask");
  if (s1.kind !== "ask") return;
  assert.equal(s1.card.id, "installation");
  assert.deepEqual(s1.card.options.map((o) => o.label).sort(), [
    "Chonburi Mill",
    "Rayong Works",
  ]);
  assert.match(
    s1.card.options.find((o) => o.id === "TH-RAYONG-01")!.hint ?? "",
    /3 product reports/,
  );

  const s2 = nextStep(a, { installationId: "TH-RAYONG-01" }, listWorkspaces());
  assert.equal(s2.kind, "ask");
  if (s2.kind !== "ask") return;
  assert.equal(s2.card.id, "year");
  assert.deepEqual(
    s2.card.options.map((o) => o.id),
    ["2026", "2025"],
  );
  assert.match(s2.text, /Rayong Works/);

  const s3 = nextStep(
    a,
    { installationId: "TH-RAYONG-01", year: "2026" },
    listWorkspaces(),
  );
  assert.equal(s3.kind, "ask");
  if (s3.kind !== "ask") return;
  assert.equal(s3.card.id, "workspace");
  assert.equal(s3.card.options.length, 2);
  for (const o of s3.card.options)
    assert.match(
      o.hint ?? "",
      /Rayong Works · 2026/,
      "the installation and the year are on every product option",
    );
});

test("a file that names its year skips the year question", () => {
  storage.clear();
  saveInstallation({
    ...emptyInstallation(true),
    id: "TH-RAYONG-01",
    name: "Rayong Works",
    street: "1",
    postcode: "2",
    city: "R",
    country: "TH",
    unlocode: "THMAT",
    lat: "1",
    lng: "1",
  });
  createWorkspace({
    installationId: "TH-RAYONG-01",
    installationName: "Rayong Works",
    productId: "ironore",
    productionRoute: "sintering",
    year: 2026,
    selfSupplied: true,
  });
  createWorkspace({
    installationId: "TH-RAYONG-01",
    installationName: "Rayong Works",
    productId: "ironore",
    productionRoute: "sintering",
    year: 2025,
    selfSupplied: true,
  });
  const a = analyzeText(
    "report.txt",
    "Reporting month: March 2025\nNatural gas: 1,000 m3\n",
  );
  const s = nextStep(a, {}, listWorkspaces());
  assert.equal(
    s.kind,
    "plan",
    "one installation, one product, the year the file states: nothing left to ask",
  );
  if (s.kind === "plan") assert.equal(s.plan.month, "2025-03");
});

/* ── A file that does not say what it is ──────────────────────────────────────── */

test("a file with nothing recognisable asks the reader to describe it, and reads the description with the file", () => {
  seed();
  const a = analyzeText(
    "final_v3.txt",
    "Invoice no. 88231\nAmount due 54,200\nPlease remit within 30 days\n",
  );
  assert.equal(a.facts.length, 0);
  const first = nextStep(a, {}, listWorkspaces());
  assert.equal(first.kind, "describe");

  const { analysis } = describeAnalysis(
    a,
    "March 2026 gas invoice: natural gas 182,400 m3",
  );
  assert.equal(analysis.facts.length, 1);
  const f = analysis.facts[0] as {
    kind: string;
    fuelType?: string;
    quantity?: number;
  };
  assert.deepEqual(
    [f.kind, f.fuelType, f.quantity],
    ["fuel", "natural_gas", 182400],
  );
  const next = nextStep(analysis, { described: true }, listWorkspaces());
  assert.equal(next.kind, "plan");
  if (next.kind === "plan")
    assert.equal(
      next.plan.month,
      "2026-03",
      "the month in the description is the month",
    );
});

test("a column of bare readings can be described instead of picked from a list", () => {
  seed();
  const a = analyzeText("MTR-2210.csv", SAMPLE_2);
  assert.ok(a.meter);
  const ask = nextStep(a, {}, listWorkspaces());
  assert.equal(ask.kind, "ask");
  if (ask.kind === "ask")
    assert.equal(ask.describe, true, "the reader may describe it instead");

  const d = describeAnalysis(
    a,
    "this is the main electricity meter, readings in kWh",
  );
  assert.equal(d.meterKind, "electricity_kwh");
  assert.equal(meterKindFromText("natural gas, cubic metres m3"), "gas_m3");
  assert.equal(meterKindFromText("diesel in litres"), "diesel_l");
  assert.equal(
    meterKindFromText("electricity"),
    null,
    "electricity with no unit still needs the unit asked",
  );
  assert.equal(meterKindFromText("something I cannot say"), null);
});
