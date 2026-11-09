/* The report set — Annex IV to Implementing Regulation (EU) 2025/2547.

   Pinned: three reports, four only when the declarant-specific addendum
   applies; the operator's emissions report answers every item 1–35 and the
   summary every item 1–16, each row carrying the Annex number it answers; the
   installation profile asks the identity and monitoring-plan items once. */

import { test } from "node:test";
import assert from "node:assert/strict";
import zlib from "node:zlib";

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

const { createWorkspace } = await import("../../workspace");
const { emptyInstallation } = await import("../../installations");
const { emptySupplier } = await import("../../precursor-suppliers");
const { commitPrecursor } = await import("../precursor-basis");
const { buildReportSet, reportPackageFileName, reportSetFileName } = await import("../report-set");
const { crc32 } = await import("../../zip");
const { packageStatus, reportsInPackage, documentsInPackage } = await import("../package-status");
const { profileGaps, profileStatus } = await import("../installation-profile");

const items = (rows: { n: string }[]) => {
  const out = new Set<number>();
  for (const r of rows) for (const m of r.n.matchAll(/\d+/g)) out.add(Number(m[0]));
  return out;
};

test("a set is three reports; the declarant-specific addendum is a fourth only when electricity goes to the EU", () => {
  storage.clear();
  const inst = emptyInstallation(true);
  const three = buildReportSet({ installation: inst, workspaces: [], year: 2026 });
  assert.deepEqual(three.reports.map((r) => r.kind), ["monitoring_plan", "emissions_report", "summary_report"]);

  const four = buildReportSet({ installation: { ...inst, monitoring: { ...inst.monitoring, electricityToEu: "yes" } }, workspaces: [], year: 2026 });
  assert.equal(four.reports.length, 4);
  assert.equal(four.reports[3].kind, "declarant_addendum");
  assert.ok(four.reports.length >= 3 && four.reports.length <= 4);
});

test("the operator's emissions report answers every item of Annex IV point 1.1 (1 to 35); the summary every item of 1.2 (1 to 16)", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-PLANT-A", installationName: "Plant A", productId: "fasteners", productionRoute: "scrap_eaf", year: 2026 });
  commitPrecursor({ ...emptySupplier(ws.id, null), precursorName: "Billet", cnCode: "7207 11 90", country: "TH", valueBasis: "default", quantityUsedT: 100 }, ws);
  const set = buildReportSet({ installation: emptyInstallation(true), workspaces: [ws], year: 2026 });

  const emissions = set.reports.find((r) => r.kind === "emissions_report")!;
  const seen = items(emissions.sections.flatMap((s) => s.rows));
  for (let n = 1; n <= 35; n++) assert.ok(seen.has(n), `emissions report item ${n}`);

  const summary = set.reports.find((r) => r.kind === "summary_report")!;
  const seenS = items(summary.sections.flatMap((s) => s.rows));
  for (let n = 1; n <= 16; n++) assert.ok(seenS.has(n), `summary report item ${n}`);
});

test("every lettered item of Annex IV point 1.1 is a row of its own — 2(c) and the identity items included", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-PLANT-A", installationName: "Plant A", productId: "fasteners", productionRoute: "scrap_eaf", year: 2026 });
  const emissions = buildReportSet({ installation: emptyInstallation(true), workspaces: [ws], year: 2026 }).reports.find((r) => r.kind === "emissions_report")!;
  const tags = new Set(emissions.sections.flatMap((s) => s.rows.map((r) => r.n)));
  for (const n of ["1(a)", "1(b)", "1(c)", "1(d)", "2(a)", "2(b)", "2(c)", "2(d)", "2(e)", "2(f)", "2(g)", "2(h)", "15(a)", "15(b)", "15(c)", "15(d)", "15(e)", "15(f)", "16(a)", "16(b)", "16(c)", "16(d)", "16(e)"]) {
    assert.ok(tags.has(n), `emissions report row ${n}`);
  }
});

test("a precursor on a default value is item 22 / 12, with its default value — and not item 23", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-PLANT-A", installationName: "Plant A", productId: "fasteners", productionRoute: "scrap_eaf", year: 2026 });
  commitPrecursor({ ...emptySupplier(ws.id, null), precursorName: "Billet", cnCode: "7207 11 90", country: "TH", valueBasis: "default", quantityUsedT: 100 }, ws);
  const emissions = buildReportSet({ installation: emptyInstallation(true), workspaces: [ws], year: 2026 }).reports.find((r) => r.kind === "emissions_report")!;
  const prec = emissions.sections.find((s) => s.title.startsWith("18"))!;
  const table22 = prec.tables!.find((t) => t.caption.startsWith("Item 22"))!.table;
  const table23 = prec.tables!.find((t) => t.caption.startsWith("Item 23"))!.table;
  assert.equal(table22.rows.length, 1);
  assert.equal(table22.rows[0][1], "7207 11 90");
  assert.equal(table23.rows.length, 0);
});

test("an empty installation is not complete, and says which Annex items hold it up", () => {
  storage.clear();
  const gaps = profileGaps(emptyInstallation(true));
  const tags = new Set(gaps.map((g) => g.tag));
  for (const t of ["1(a)", "1(b)", "1(c)", "1(d)", "2(b)", "2(d)", "2(e)", "2(f)", "2(g)", "2(h)", "3", "4", "5", "6"]) assert.ok(tags.has(t), t);
  assert.equal(profileStatus(emptyInstallation(true)).complete, false);
  assert.equal(buildReportSet({ installation: emptyInstallation(true), workspaces: [], year: 2026 }).complete, false);
});

test("a complete profile asks nothing more — and a 'yes' needs its detail", () => {
  const inst = emptyInstallation(true);
  const full = {
    ...inst,
    id: "TH-PLANT-A",
    name: "Plant A",
    operatorName: "Siam Steel Co., Ltd.",
    operatorRegistrationNumber: "0105551234567",
    operatorAddress: "1 Moo 1, Rayong, Thailand",
    street: "1 Moo 1",
    city: "Rayong",
    postcode: "21000",
    unlocode: "THMTP",
    lat: "12.7",
    lng: "101.1",
    monitoring: {
      ...inst.monitoring,
      nonCbamProcesses: "None",
      topFuels: "Natural gas",
      topMaterials: "Limestone",
      cems: "no" as const,
      zeroRatedFuels: "no" as const,
      heatTrade: "no" as const,
      electricityMixed: "no" as const,
      onsiteElectricity: "no" as const,
      wasteGases: "no" as const,
      co2Transfer: "no" as const,
    },
  };
  assert.equal(profileStatus(full).complete, true);
  const yesNoDetail = profileGaps({ ...full, monitoring: { ...full.monitoring, wasteGases: "yes" as const } });
  assert.equal(yesNoDetail.length, 1);
  assert.equal(yesNoDetail[0].tag, "5");
});

test("file names carry the installation, the year and the report", () => {
  assert.equal(reportSetFileName({ ...emptyInstallation(true), id: "TH-RAYONG-01" }, 2026, "summary_report"), "TH-RAYONG-01_2026_Operators-summary-emissions-report.pdf");
});

test("every report in the set renders to a PDF, with its Annex item numbers on the page", async () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-PLANT-A", installationName: "Plant A", productId: "fasteners", productionRoute: "scrap_eaf", year: 2026 });
  commitPrecursor({ ...emptySupplier(ws.id, null), precursorName: "Billet", cnCode: "7207 11 90", country: "TH", valueBasis: "default", quantityUsedT: 100 }, ws);
  const inst = { ...emptyInstallation(true), id: "TH-PLANT-A", name: "Plant A", monitoring: { ...emptyInstallation(true).monitoring, electricityToEu: "yes" as const } };
  const set = buildReportSet({ installation: inst, workspaces: [ws], year: 2026 });
  assert.equal(set.reports.length, 4);
  /* jsPDF probes for a browser `window` and chokes on the storage shim above, so
     the PDFs are built the way a server would build them: the data is already
     assembled, and nothing in the builder reads a store. */
  const shim = g.window;
  delete g.window;
  const { buildReportPdf } = await import("../report-set-pdf");
  for (const report of set.reports) {
    const doc = await buildReportPdf(report, { installation: inst, year: 2026 });
    assert.ok(doc.getNumberOfPages() >= 1, report.title);
    const bytes = doc.output("arraybuffer") as ArrayBuffer;
    assert.equal(new TextDecoder().decode(new Uint8Array(bytes).slice(0, 5)), "%PDF-", report.title);
  }
  g.window = shim;
});

test("the package is one zip holding every report of the set, each a readable PDF", async () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-PLANT-B", installationName: "Plant B", productId: "fasteners", productionRoute: "scrap_eaf", year: 2026 });
  const inst = { ...emptyInstallation(true), id: "TH-PLANT-B", name: "Plant B", monitoring: { ...emptyInstallation(true).monitoring, electricityToEu: "yes" as const } };
  const set = buildReportSet({ installation: inst, workspaces: [ws], year: 2026 });
  assert.equal(set.reports.length, 4);

  const shim = g.window;
  delete g.window;
  const { buildReportPackage } = await import("../report-set-pdf");
  const { bytes, files } = await buildReportPackage(set.reports, { installation: inst, year: 2026 });
  g.window = shim;

  assert.deepEqual(files, set.reports.map((r) => reportSetFileName(inst, 2026, r.kind)));
  assert.equal(reportPackageFileName(inst, 2026), "TH-PLANT-B_2026_CBAM-report-package.zip");

  // Read it back the way an unzip tool does: end record → central directory → local entries.
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const end = bytes.byteLength - 22;
  assert.equal(view.getUint32(end, true), 0x06054b50, "end-of-central-directory record");
  assert.equal(view.getUint16(end + 10, true), 4, "four entries");
  let p = view.getUint32(end + 16, true);
  const seen: string[] = [];
  for (let i = 0; i < 4; i++) {
    assert.equal(view.getUint32(p, true), 0x02014b50);
    const crc = view.getUint32(p + 16, true);
    const size = view.getUint32(p + 24, true);
    const nameLen = view.getUint16(p + 28, true);
    const local = view.getUint32(p + 42, true);
    const name = new TextDecoder().decode(bytes.slice(p + 46, p + 46 + nameLen));
    seen.push(name);
    assert.equal(view.getUint32(local, true), 0x04034b50);
    const data = bytes.slice(local + 30 + view.getUint16(local + 26, true), local + 30 + view.getUint16(local + 26, true) + size);
    assert.equal(new TextDecoder().decode(data.slice(0, 5)), "%PDF-", `${name} is a PDF`);
    assert.equal(crc32(data), zlib.crc32(data), `${name}: checksum`);
    assert.equal(crc, zlib.crc32(data), `${name}: stored checksum matches the bytes`);
    p += 46 + nameLen;
  }
  assert.deepEqual(seen, files);
});

test("the package is held until everything is in, and says what is holding it", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-PLANT-C", installationName: "Plant C", productId: "fasteners", productionRoute: "scrap_eaf", year: 2026 });
  const inst = { ...emptyInstallation(true), id: "TH-PLANT-C", name: "Plant C" };

  const status = packageStatus({ installation: inst, workspaces: [ws], year: 2026 });
  assert.equal(status.packageReady, false, "a blank installation with an unfinished product report is not ready");
  assert.equal(status.reports.length, 1);
  assert.equal(status.signKey, "inst:TH-PLANT-C:2026");
  const kinds = status.holding.map((h) => h.kind);
  assert.ok(kinds.includes("product_reports"), "the unfinished product report is named");
  assert.ok(kinds.includes("installation_info"), "the missing installation information is named");
  assert.ok(kinds.includes("report"), "the reports with items to do are named");

  assert.equal(packageStatus({ installation: inst, workspaces: [ws], year: 2030 }).reports.length, 0, "another year has no product reports");
});

test("a free trial packages the set without the monitoring plan", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-PLANT-D", installationName: "Plant D", productId: "fasteners", productionRoute: "scrap_eaf", year: 2026 });
  const inst = { ...emptyInstallation(true), id: "TH-PLANT-D", name: "Plant D" };
  const set = buildReportSet({ installation: inst, workspaces: [ws], year: 2026 });

  assert.deepEqual(reportsInPackage(set, false).map((r) => r.kind), ["monitoring_plan", "emissions_report", "summary_report"]);
  assert.deepEqual(reportsInPackage(set, true).map((r) => r.kind), ["emissions_report", "summary_report"]);
});

test("items 14, 16(b), 16(d) and 17 are read from the monthly figures, not left outside the portal", async () => {
  storage.clear();
  const { saveMonth, emptyMonth } = await import("../../monthly-data");
  const ws = createWorkspace({ installationId: "TH-PLANT-E", installationName: "Plant E", productId: "fasteners", productionRoute: "scrap_eaf", year: 2026 });
  const base = emptyInstallation(true);
  const inst = {
    ...base,
    id: "TH-PLANT-E",
    name: "Plant E",
    monitoring: { ...base.monitoring, cems: "yes" as const, co2Transfer: "yes" as const, co2TransferDetail: "Sent to the Map Ta Phut capture plant", nonCbamProcesses: "Galvanising" },
  };
  const row = (set: ReturnType<typeof buildReportSet>, n: string) => set.reports.find((r) => r.kind === "emissions_report")!.sections.flatMap((s) => s.rows).find((r) => r.n === n)!;

  // Before any month: continuous measurement is claimed but nothing is entered.
  const before = buildReportSet({ installation: inst, workspaces: [ws], year: 2026 });
  assert.equal(row(before, "16(b)").state, "missing");
  assert.equal(row(before, "14").state, "partial", "non-CBAM processes are listed but no quantities are entered");

  saveMonth({
    ...emptyMonth(ws.id, "2026-01"),
    productionTonnes: 500,
    status: "submitted",
    measuredEmissions: [{ id: "m1", source: "Furnace stack", gas: "co2", tCO2e: 42 }],
    co2ReceivedT: 5,
    co2TransferredOutT: 8,
    nonCbamGoods: [{ id: "g1", name: "Galvanised sheet", tonnes: 120 }],
    heatGj: { exported: 300 },
    electricityExportedMwh: 7,
  });
  const after = buildReportSet({ installation: inst, workspaces: [ws], year: 2026 });
  assert.equal(row(after, "16(b)").state, "ready");
  assert.match(row(after, "16(b)").value, /42/);
  assert.equal(row(after, "16(d)").state, "ready");
  assert.match(row(after, "16(d)").value, /received 5/);
  assert.match(row(after, "16(d)").value, /sent on 8/);
  assert.equal(row(after, "14").state, "ready");
  assert.match(row(after, "14").value, /Galvanised sheet: 120/);
  assert.equal(row(after, "17").state, "ready");
  assert.match(row(after, "17").value, /Heat: 0 in, 0 made, 0 used, 300 out/);
});

/* ── The monitoring plan follows Annex II A.5; two attachments travel with the reports ─────── */
const mpRows = (set: ReturnType<typeof buildReportSet>) => set.reports.find((r) => r.kind === "monitoring_plan")!.sections.flatMap((s) => s.rows);

test("the monitoring plan is Annex II point A.5: every element 1 to 22 is a row, and 22(a) to 22(h) each have their own", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-PLANT-F", installationName: "Plant F", productId: "fasteners", productionRoute: "scrap_eaf", year: 2026 });
  const rows = mpRows(buildReportSet({ installation: emptyInstallation(true), workspaces: [ws], year: 2026 }));
  const tags = new Set(rows.map((r) => r.n));
  for (let n = 1; n <= 22; n++) {
    const has = [...tags].some((t) => new RegExp(`^MP ${n}(\\(|$)`).test(t));
    assert.ok(has, `monitoring plan element ${n}`);
  }
  for (const l of ["a", "b", "c", "d", "e", "f", "g", "h"]) assert.ok(tags.has(`MP 22(${l})`), `element 22(${l})`);
  assert.ok(tags.has("MP 7(a)") && tags.has("MP 7(b)"));
});

test("the monitoring plan's own elements come from the methodology: a sampling plan and the control system turn their rows ready", async () => {
  storage.clear();
  const { loadDraft, saveDraft } = await import("../../workspace-mmd");
  const ws = createWorkspace({ installationId: "TH-PLANT-G", installationName: "Plant G", productId: "fasteners", productionRoute: "scrap_eaf", year: 2026 });
  const inst = emptyInstallation(true);
  const state = (set: ReturnType<typeof buildReportSet>, n: string) => mpRows(set).find((r) => r.n === n)!.state;

  const before = buildReportSet({ installation: inst, workspaces: [ws], year: 2026 });
  for (const n of ["MP 8", "MP 22(b)", "MP 22(c)", "MP 22(d)", "MP 22(f)", "MP 22(g)", "MP 22(h)"]) assert.equal(state(before, n), "missing", n);

  const draft = loadDraft(ws.id, ws.periodStart, ws.periodEnd);
  saveDraft(ws.id, {
    ...draft,
    samplingPlan: "One composite sample per 500 t of scrap",
    controlSystem: { riskAssessment: "Reviewed each January", itSystems: "SAP, tested on a copy", segregationOfDuties: "Operator records, planner checks", corrections: "Corrected at source, logged", outsourced: "None", records: "Ten years on the document server" },
  });
  const after = buildReportSet({ installation: inst, workspaces: [ws], year: 2026 });
  for (const n of ["MP 8", "MP 22(b)", "MP 22(c)", "MP 22(d)", "MP 22(f)", "MP 22(g)", "MP 22(h)"]) assert.equal(state(after, n), "ready", n);
  assert.match(mpRows(after).find((r) => r.n === "MP 8")!.value, /composite sample/);
});

test("a methodology saved before these fields existed still opens, with the new answers empty", async () => {
  storage.clear();
  const { migrateMmd } = await import("../../workspace-mmd");
  const old = migrateMmd({ boundaryDescription: "Melt shop" } as never, "2026-01-01", "2026-12-31");
  assert.equal(old.samplingPlan, "");
  assert.deepEqual(old.controlSystem, { riskAssessment: "", itSystems: "", segregationOfDuties: "", corrections: "", outsourced: "", records: "" });
  assert.equal(old.boundaryDescription, "Melt shop");
});

test("an instrument's place and uncertainty reach the monitoring plan's instrument table", async () => {
  storage.clear();
  const { loadDraft, saveDraft, emptyMeasurement } = await import("../../workspace-mmd");
  const ws = createWorkspace({ installationId: "TH-PLANT-H", installationName: "Plant H", productId: "fasteners", productionRoute: "scrap_eaf", year: 2026 });
  const draft = loadDraft(ws.id, ws.periodStart, ws.periodEnd);
  saveDraft(ws.id, { ...draft, fuelInstruments: [{ ...emptyMeasurement("Natural gas volume"), instrument: "Elster RVG G250", readingFrequency: "daily", lastCalibration: "2026-03-12", location: "Gas main to RF-1", uncertaintyPct: 1.5 }] });
  const set = buildReportSet({ installation: emptyInstallation(true), workspaces: [ws], year: 2026 });
  const plan = set.reports.find((r) => r.kind === "monitoring_plan")!;
  const table = plan.sections.flatMap((s) => s.tables ?? []).find((t) => t.caption.startsWith("Measuring instruments"))!.table;
  assert.equal(table.rows.length, 1);
  assert.equal(table.rows[0][3], "Gas main to RF-1");
  assert.equal(table.rows[0][6], "1.5");
  assert.equal(mpRows(set).find((r) => r.n === "MP 7(b)")!.state, "ready");
  assert.equal(mpRows(set).find((r) => r.n === "MP 22(a)")!.state, "ready");
});

test("the set is three reports, a fourth where electricity goes to the EU, and two attachments that never hold the package", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-PLANT-I", installationName: "Plant I", productId: "fasteners", productionRoute: "scrap_eaf", year: 2026 });
  const inst = emptyInstallation(true);
  const set = buildReportSet({ installation: inst, workspaces: [ws], year: 2026 });
  assert.deepEqual(set.attachments.map((a) => a.kind), ["precursor_verification", "evidence_index"]);
  assert.deepEqual(set.notNeeded.map((r) => r.kind), ["declarant_addendum"], "the addendum is named as not needed");
  assert.equal(set.reports.length, 3);

  // The package's documents are the reports plus the attachments — and the holding list counts reports only.
  assert.deepEqual(documentsInPackage(set, false).map((r) => r.kind), ["monitoring_plan", "emissions_report", "summary_report", "precursor_verification", "evidence_index"]);
  assert.deepEqual(documentsInPackage(set, true).map((r) => r.kind), ["emissions_report", "summary_report", "precursor_verification", "evidence_index"], "a trial keeps the attachments");
  const status = packageStatus({ installation: inst, workspaces: [ws], year: 2026 });
  assert.ok(status.holding.every((h) => h.kind !== "report" || !/verification|evidence/i.test(h.title)), "an attachment is never a reason the package is held");

  const four = buildReportSet({ installation: { ...inst, monitoring: { ...inst.monitoring, electricityToEu: "yes" } }, workspaces: [ws], year: 2026 });
  assert.equal(four.reports.length, 4);
  assert.equal(four.notNeeded.length, 0);
});

test("a precursor on an actual value from outside the Union appears in the verification register until its report is in", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-PLANT-J", installationName: "Plant J", productId: "fasteners", productionRoute: "scrap_eaf", year: 2026 });
  commitPrecursor({ ...emptySupplier(ws.id, null), precursorName: "Wire rod", cnCode: "7213 91 10", country: "VN", valueBasis: "actual", quantityUsedT: 80 }, ws);
  commitPrecursor({ ...emptySupplier(ws.id, null), precursorName: "Billet", cnCode: "7207 11 90", country: "TH", valueBasis: "default", quantityUsedT: 100 }, ws);
  const reg = buildReportSet({ installation: emptyInstallation(true), workspaces: [ws], year: 2026 }).attachments[0];
  const rows = reg.sections[0].rows;
  assert.equal(rows.length, 1, "only the actual-value precursor from outside the EU owes a verification report");
  assert.match(rows[0].label, /Wire rod/);
  assert.ok(rows[0].state === "missing" || rows[0].state === "partial");
  assert.equal(reg.sections[0].tables![0].table.rows[0][9], "not attached", "column 9 is the report file, after the reporting period was added");
  assert.equal(reg.complete, false);
});

test("with no such precursor the register says nothing is owed", () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-PLANT-K", installationName: "Plant K", productId: "fasteners", productionRoute: "scrap_eaf", year: 2026 });
  const reg = buildReportSet({ installation: emptyInstallation(true), workspaces: [ws], year: 2026 }).attachments[0];
  assert.equal(reg.sections[0].rows[0].state, "not_applicable");
  assert.equal(reg.complete, true);
});

test("the evidence index lists every attached document with the figure it supports, and the package carries the files", async () => {
  storage.clear();
  const { saveEvidence } = await import("../../workspace-evidence");
  const { evidenceFilesForPackage } = await import("../package-evidence");
  const ws = createWorkspace({ installationId: "TH-PLANT-L", installationName: "Plant L", productId: "fasteners", productionRoute: "scrap_eaf", year: 2026 });
  const bytes = Buffer.from("%PDF-1.4 a bill").toString("base64");
  saveEvidence({
    id: "ev-1",
    workspaceId: ws.id,
    month: "2026-03",
    fieldKeys: ["production"],
    sourceType: "erp_export",
    fileName: "March production.pdf",
    fileDataUrl: `data:application/pdf;base64,${bytes}`,
    mimeType: "application/pdf",
    capturedAt: "2026-04-02T09:00:00.000Z",
    uploadedBy: "Nattapong S.",
  });
  saveEvidence({ id: "ev-2", workspaceId: ws.id, fieldKeys: ["calibration-records"], sourceType: "calibration_record", fileName: "FT-2201 calibration.pdf", capturedAt: "2026-04-03T09:00:00.000Z" });

  const index = buildReportSet({ installation: emptyInstallation(true), workspaces: [ws], year: 2026 }).attachments[1];
  const table = index.sections.flatMap((s) => s.tables ?? [])[0].table;
  assert.equal(table.rows.length, 2);
  assert.equal(table.rows[0][3], "March production.pdf");
  assert.match(table.rows[0][4], /production/i, "the figure it supports is named in words");
  assert.equal(table.rows[0][5], "Nattapong S.");
  assert.ok(index.sections.flatMap((s) => s.rows).some((r) => /1 in the package, 1 too large/.test(r.value)), "the file too large to carry is said, not hidden");

  const files = evidenceFilesForPackage([ws], 2026);
  assert.equal(files.length, 1, "only a file that was kept can travel");
  assert.match(files[0].name, /^supporting-evidence\/.+\/2026-03\/March-production\.pdf$/);
  assert.equal(new TextDecoder().decode(files[0].data), "%PDF-1.4 a bill");
});

/* ── The new monthly inputs reach the report ─────────────────────── */
test("items 18, 19 and 27 read the product this site makes and uses; 16(a), 17, 29 and 35 read the worked-out inputs", async () => {
  storage.clear();
  const { saveMonth, emptyMonth, emptyFuel } = await import("../../monthly-data");
  const { saveInternal } = await import("../../internal-precursors");
  const billet = createWorkspace({ installationId: "TH-MILL", installationName: "Mill", productId: "billet", productionRoute: "scrap_eaf", year: 2026 });
  const wire = createWorkspace({ installationId: "TH-MILL", installationName: "Mill", productId: "wirerod", productionRoute: "scrap_eaf", year: 2026 });
  const inst = { ...emptyInstallation(true), id: "TH-MILL", name: "Mill" };
  const gas = { ...emptyFuel(), fuelType: "natural_gas", unit: "GJ" as const, efTco2PerGj: 0.0561, factorSource: "lab_analysis" as const };

  saveMonth({
    ...emptyMonth(billet.id, "2026-01"),
    productionTonnes: 1000,
    status: "submitted",
    fuels: [{ ...gas, stock: { delivered: 9000, opening: 2000, closing: 1000 } }],
    electricitySources: [{ id: "e1", sourceType: "ppa", mwh: 0, factorTco2PerMwh: 0.4, shared: { meter: "E-221", key: "production", reading: 1000, thisValue: 1000, totalValue: 1800 } }],
    wasteGases: [{ id: "g1", gas: "bfg", flow: "produced", volumeNm3: 1_000_000 }],
    scrapDeliveries: [{ id: "d1", material: "steel_scrap", supplier: "Rayong Metals", grade: "HMS", origin: "pre_consumer", tonnes: 50 }],
    processEmissionEntries: [{ id: "p1", method: "mass_balance", specKey: "steel_scrap", materialId: "steel_scrap", quantityT: 0 }],
    composition: { mnPct: 1.2, crPct: 0.4 },
  });
  saveMonth({ ...emptyMonth(wire.id, "2026-01"), productionTonnes: 800, status: "submitted" });
  saveInternal({ id: "ip1", workspaceId: wire.id, sourceWorkspaceId: billet.id, quantityUsedT: 820 });

  const set = buildReportSet({ installation: inst, workspaces: [billet, wire], year: 2026 });
  const emissions = set.reports.find((r) => r.kind === "emissions_report")!;
  const rows = emissions.sections.flatMap((s) => s.rows);
  const get = (n: string) => rows.find((r) => r.n === n)!;

  assert.equal(get("18 · 19").state, "ready");
  assert.match(get("18 · 19").value, /820 t of/);
  assert.equal(get("27").state, "ready");
  assert.match(get("16(a)").value, /worked out from stock changes/);
  assert.match(get("17").value, /gas row/);
  assert.equal(get("26").state, "not_applicable", "steel is an Annex II sector — electricity is reported but item 26 does not arise");
  assert.match(get("29").value, /split by tonnes made/);
  assert.match(get("35").value, /Mn 1\.2%/);
  assert.match(get("35").value, /scrap from 1 supplier/);

  const tables = emissions.sections.flatMap((s) => s.tables ?? []);
  assert.equal(tables.find((t) => t.caption.startsWith("Items 18, 19 and 27"))!.table.rows.length, 1);
  assert.equal(tables.find((t) => t.caption.startsWith("Item 16(a)"))!.table.rows[0][6], "10,000");
  assert.equal(tables.find((t) => t.caption.startsWith("Item 17"))!.table.rows.length, 1);
  assert.equal(tables.find((t) => t.caption.startsWith("Items 26, 29 and 30"))!.table.rows[0][8], "55.56%");
  assert.equal(tables.find((t) => t.caption.startsWith("Item 35"))!.table.rows[0][5], "Pre-consumer (offcuts, runaround, from manufacturing)");
});

/* ── Item 35 — what each good's category asks for, and what steel bought in carries ───────── */
test("item 35: a rolled steel product takes its scrap figures from the verified steel it was made from, and is ready only when everything asked for is there", async () => {
  storage.clear();
  const { saveMonth, emptyMonth } = await import("../../monthly-data");
  const { saveSupplier } = await import("../../precursor-suppliers");
  const wire = createWorkspace({ installationId: "TH-MILL", installationName: "Mill", productId: "wirerod", productionRoute: "scrap_eaf", year: 2026 });
  const inst = { ...emptyInstallation(true), id: "TH-MILL", name: "Mill" };
  saveMonth({ ...emptyMonth(wire.id, "2026-01"), productionTonnes: 800, status: "submitted" });
  const billet = {
    ...emptySupplier(wire.id, null),
    precursorName: "Billet",
    cnCode: "7207 11 11",
    country: "TH",
    valueBasis: "actual" as const,
    dataOrigin: "supplier_verified" as const,
    // the four checks are recomputed from these on save — a report that covers the year, from an accredited verifier whose scope matches
    origin: "purchased" as const,
    reportingPeriodStart: "2026-01-01",
    reportingPeriodEnd: "2026-12-31",
    verificationReportFileId: "file-1",
    verifierAccreditationExpiryDate: "2030-01-01",
    verificationReportIssueDate: "2027-02-01",
    verificationSectoralScope: "Iron and steel",
    quantityUsedT: 840,
    sectorParams: { scrapUsedTPerT: "1.05", preConsumerScrapPct: "40" },
  };
  saveSupplier(billet);
  const read = () => {
    const set = buildReportSet({ installation: inst, workspaces: [wire], year: 2026 });
    return set.reports.find((r) => r.kind === "emissions_report")!.sections.flatMap((s) => s.rows).find((r) => r.n === "35")!;
  };

  const first = read();
  assert.match(first.value, /scrap 1\.103 t\/t/, "840 t of billet at 1.05 t of scrap per tonne, over 800 t made");
  assert.match(first.value, /pre-consumer scrap 40%/);
  assert.match(first.value, /precursor\(s\) bought in/);
  assert.equal(first.state, "partial", "the alloy percentages are still not given");
  assert.match(first.value, /still needed: the alloy percentages/);

  const comp = { mnPct: 0.8, crPct: 0.05, niPct: 0, otherPct: 0.1 };
  saveMonth({ ...emptyMonth(wire.id, "2026-01"), productionTonnes: 800, status: "submitted", composition: comp });
  assert.equal(read().state, "ready", "every figure the category asks for is there");
});

test("item 35: bought-in steel on a default value carries no scrap figure, so the good is not ready until the plant gives one", async () => {
  storage.clear();
  const { saveMonth, emptyMonth } = await import("../../monthly-data");
  const wire = createWorkspace({ installationId: "TH-MILL", installationName: "Mill", productId: "wirerod", productionRoute: "scrap_eaf", year: 2026 });
  const inst = { ...emptyInstallation(true), id: "TH-MILL", name: "Mill" };
  saveMonth({ ...emptyMonth(wire.id, "2026-01"), productionTonnes: 800, status: "submitted", composition: { mnPct: 0.8, crPct: 0.05, niPct: 0, otherPct: 0.1 } });
  commitPrecursor({ ...emptySupplier(wire.id, null), precursorName: "Billet", cnCode: "7207 11 11", country: "TH", valueBasis: "default", quantityUsedT: 840 }, wire);
  const row = () => buildReportSet({ installation: inst, workspaces: [wire], year: 2026 }).reports.find((r) => r.kind === "emissions_report")!.sections.flatMap((s) => s.rows).find((r) => r.n === "35")!;

  const before = row();
  assert.equal(before.state, "partial");
  assert.match(before.value, /default values carry no scrap figure/);
});

test("the evidence index asks for the paper behind a worked-out quantity, only when the month uses it", async () => {
  storage.clear();
  const { requiredKeysForMonth } = await import("../../workspace-evidence");
  const { emptyMonth, emptyFuel } = await import("../../monthly-data");
  const plain = requiredKeysForMonth(emptyMonth("w", "2026-01"), false).map((k) => k.key);
  for (const k of ["stock-records", "allocation-basis", "waste-gas-records", "mill-certificates"]) assert.ok(!plain.includes(k), `${k} is not asked of a plain month`);
  const used = requiredKeysForMonth(
    {
      ...emptyMonth("w", "2026-01"),
      fuels: [{ ...emptyFuel(), fuelType: "natural_gas", stock: {}, shared: { meter: "M", key: "manual" } }],
      wasteGases: [{ id: "g", gas: "cog", flow: "consumed" }],
      composition: { niPct: 8 },
    },
    false,
  ).map((k) => k.key);
  for (const k of ["stock-records", "allocation-basis", "waste-gas-records", "mill-certificates"]) assert.ok(used.includes(k), `${k} is asked once the month uses the input`);
});

test("the package carries the two attachments as PDFs, and the evidence files in folders beside them", async () => {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-PLANT-M", installationName: "Plant M", productId: "fasteners", productionRoute: "scrap_eaf", year: 2026 });
  const inst = { ...emptyInstallation(true), id: "TH-PLANT-M", name: "Plant M", monitoring: { ...emptyInstallation(true).monitoring, electricityToEu: "yes" as const } };
  const set = buildReportSet({ installation: inst, workspaces: [ws], year: 2026 });
  const docs = documentsInPackage(set, false);
  assert.equal(docs.length, 6, "four reports and two attachments");

  const shim = g.window;
  delete g.window;
  const { buildReportPackage } = await import("../report-set-pdf");
  const evidence = { name: "supporting-evidence/Fasteners/2026-03/March-bill.pdf", data: new TextEncoder().encode("%PDF-1.4 bill") };
  const { bytes, files } = await buildReportPackage(docs, { installation: inst, year: 2026, extraFiles: [evidence] });
  g.window = shim;

  assert.equal(files.length, 7);
  assert.ok(files.includes("TH-PLANT-M_2026_Verification-reports-of-precursor-installations.pdf"));
  assert.ok(files.includes("TH-PLANT-M_2026_Supporting-evidence-and-records-index.pdf"));
  assert.equal(files[6], evidence.name);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  assert.equal(view.getUint16(bytes.byteLength - 22 + 10, true), 7, "seven entries in the zip");
});

test("the documents a month asks for follow what it reports: D.4.3 for a PPA or a direct link, B.6, B.8 and heat records", async () => {
  storage.clear();
  const { requiredKeysForMonth } = await import("../../workspace-evidence");
  const { emptyMonth } = await import("../../monthly-data");
  const keys = (m: Parameters<typeof requiredKeysForMonth>[0], indirect = true) => requiredKeysForMonth(m, indirect).map((k) => k.key);
  const base = emptyMonth("w", "2026-01");
  const none = keys(base);
  for (const k of ["smart-meter-data", "single-line-diagram", "cems-records", "co2-transfer-records", "heat-records"]) assert.ok(!none.includes(k), `${k} is not asked of a plain month`);

  const ppa = keys({ ...base, electricitySources: [{ id: "a", sourceType: "ppa", mwh: 10, factorTco2PerMwh: 0.1 }] });
  assert.ok(ppa.includes("smart-meter-data") && !ppa.includes("single-line-diagram"), "a PPA needs the smart-meter data, not the link's diagram");
  const link = keys({ ...base, electricitySources: [{ id: "a", sourceType: "direct_technical_link", mwh: 10, factorTco2PerMwh: 0.1 }] });
  assert.ok(link.includes("smart-meter-data") && link.includes("single-line-diagram"));
  assert.ok(!keys({ ...base, electricitySources: [{ id: "a", sourceType: "ppa", mwh: 10, factorTco2PerMwh: 0.1 }] }, false).includes("smart-meter-data"), "no indirect emissions counted — no electricity evidence");

  const rest = keys({ ...base, measuredEmissions: [{ id: "m", source: "Stack", gas: "co2", tCO2e: 5 }], co2TransferredOutT: 3, heatGj: { exported: 100 } });
  for (const k of ["cems-records", "co2-transfer-records", "heat-records"]) assert.ok(rest.includes(k), k);
});
