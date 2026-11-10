import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
class MemoryStorage {
  map = new Map<string, string>();
  getItem(k: string) {
    return this.map.get(k) ?? null;
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
const storage = new MemoryStorage();
Object.assign(globalThis, {
  localStorage: storage,
  window: { localStorage: storage },
});
const { emptyMonth, emptyElectricitySource, saveMonth, getMonth, monthIssues } =
  await import("../monthly-data");
const { fileDoc, fillProblem, storeMonthWriter } = await import(
  "../smart-intake"
);
const {
  initialInputPlan,
  linkedPrecursorProductIds,
  planWithPrecursorLink,
  processesForPrecursorProducts,
  structuredMonthIssues,
} = await import("../verification-inputs");
import type { IntakeDoc } from "../smart-intake";
import type { VerificationWorkspace } from "../workspace";
const ws = {
  id: "input-ws",
  installationId: "TH-01",
  installationName: "Factory",
  productId: "billet",
  productName: "Billets",
  cnCode: "72071190",
  productionRoute: "scrap_eaf",
  year: 2026,
  periodStart: "2026-01-01",
  periodEnd: "2026-12-31",
  declarationIds: [],
  createdAt: "2026-01-01",
} as unknown as VerificationWorkspace;
beforeEach(() => {
  storage.clear();
  storage.setItem("certrace:workspaces", JSON.stringify([ws]));
});
const doc = (patch: Partial<IntakeDoc> = {}): IntakeDoc => ({
  id: "doc",
  workspaceId: ws.id,
  fileName: "actual.pdf",
  mimeType: "application/pdf",
  sizeBytes: 3,
  fileDataUrl: "data:application/pdf;base64,YWJj",
  addedAt: "",
  status: "review",
  subject: "production",
  month: "2026-03",
  fields: [
    {
      key: "production-tonnes",
      value: "125000",
      unit: "kg",
      confidence: 0.9,
      accepted: true,
    },
  ],
  ...patch,
});
test("confirmed document writes normalized quantity to the visible monthly store", () => {
  assert.equal(fileDoc(doc(), "Operator", storeMonthWriter(ws.id)).ok, true);
  assert.equal(getMonth(ws.id, "2026-03")?.productionTonnes, 125);
});
test("existing values, submitted months and wrong reporting periods are protected", () => {
  saveMonth({
    ...emptyMonth(ws.id, "2026-03"),
    productionTonnes: 100,
    status: "draft",
  });
  assert.match(fillProblem(doc())!, /already entered/);
  assert.equal(fillProblem(doc({ overwriteConfirmed: true })), null);
  saveMonth({ ...getMonth(ws.id, "2026-03")!, status: "submitted" });
  assert.match(fillProblem(doc({ overwriteConfirmed: true }))!, /submitted/);
  assert.match(fillProblem(doc({ month: "2025-03" }))!, /reporting period/);
});
test("multi-month totals and mismatched evidence targets cannot fill inputs", () => {
  assert.match(
    fillProblem(
      doc({
        detection: {
          subject: "production",
          subjectConfidence: 0.9,
          monthConfidence: 0,
          summary: "",
          fields: [],
          via: "document",
          periodConflict: true,
        },
      }),
    )!,
    /multiple months/,
  );
  assert.match(
    fillProblem(doc({ targetOverride: "utility-invoice" }))!,
    /evidence row/,
  );
});
test("multiple electricity supplies require explicit source selection and convert kWh", () => {
  saveMonth({
    ...emptyMonth(ws.id, "2026-03"),
    electricitySources: [
      { ...emptyElectricitySource(), id: "a", mwh: 4 },
      { ...emptyElectricitySource(), id: "b", mwh: 5 },
    ],
  });
  const d = doc({
    subject: "electricity_bill",
    fields: [
      {
        key: "electricity-consumed",
        value: "6000",
        unit: "kWh",
        confidence: 0.9,
        accepted: true,
      },
    ],
  });
  assert.match(fillProblem(d)!, /Choose which electricity source/);
  assert.equal(
    fileDoc(
      { ...d, electricitySourceId: "b", overwriteConfirmed: true },
      "Operator",
      storeMonthWriter(ws.id),
    ).ok,
    true,
  );
  assert.deepEqual(
    getMonth(ws.id, "2026-03")?.electricitySources?.map((s) => s.mwh),
    [4, 6],
  );
});
test("fuel delivery never becomes fuel consumed", () => {
  const d = doc({
    subject: "fuel_invoice",
    fuelType: "natural_gas",
    fields: [
      {
        key: "fuel-delivered",
        value: "500",
        unit: "m3",
        confidence: 0.9,
        accepted: true,
      },
    ],
  });
  assert.equal(fileDoc(d, "Operator", storeMonthWriter(ws.id)).ok, true);
  const fuel = getMonth(ws.id, "2026-03")!.fuels[0];
  assert.equal(fuel.quantity, 0);
  assert.equal(fuel.deliveredQuantity, 500);
});
test("an idle month is an explicit product state, not an unfilled production value", () => {
  const e = emptyMonth(ws.id, "2026-03");
  assert.ok(monthIssues(e).some((i) => i.field === "production"));
  assert.deepEqual(monthIssues({ ...e, notManufactured: true }), []);
});
test("selected extra flows remain incomplete until measurements are entered", () => {
  const plan = initialInputPlan(ws);
  plan.additionalFlows = ["Heat / CHP"];
  assert.match(
    structuredMonthIssues(plan, emptyMonth(ws.id, "2026-03"))[0],
    /Heat/,
  );
});
test("precursor links identify products within processes and keep process links in sync", () => {
  const plan = initialInputPlan(ws);
  const first = plan.processes[0];
  first.products.push({
    id: "second-product",
    name: "Rebar",
    cnCode: "72142000",
    description: "",
    unit: "t",
    benchmark: "",
  });
  plan.processes.push({
    id: "second-process",
    name: "Rolling",
    routes: [],
    steps: [],
    precursorIds: [],
    otherInputs: [],
    products: [
      {
        id: "third-product",
        name: "Coil",
        cnCode: "72083900",
        description: "",
        unit: "t",
        benchmark: "",
      },
    ],
  });
  assert.deepEqual(
    linkedPrecursorProductIds(
      { consumingProcessIds: [first.id] },
      plan.processes,
    ),
    first.products.map((product) => product.id),
  );
  assert.deepEqual(
    linkedPrecursorProductIds(
      { consumingProductIds: ["second-product"] },
      plan.processes,
    ),
    ["second-product"],
  );
  assert.deepEqual(
    processesForPrecursorProducts(
      ["second-product", "third-product"],
      plan.processes,
    ),
    [first.id, "second-process"],
  );
  const linked = planWithPrecursorLink(plan, "source-1", [
    "second-product",
    "third-product",
  ]);
  assert.deepEqual(
    linked.processes.map((process) => process.precursorIds),
    [["source-1"], ["source-1"]],
  );
  const unlinked = planWithPrecursorLink(linked, "source-1", ["third-product"]);
  assert.deepEqual(
    unlinked.processes.map((process) => process.precursorIds),
    [[], ["source-1"]],
  );
});
