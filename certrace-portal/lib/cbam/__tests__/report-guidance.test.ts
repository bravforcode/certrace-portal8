/* What a report row that is not ready says about how to fill it — and that it never says what the regulation does not.

   Pinned:
     · the monitoring-plan guide has exactly the elements of Annex II point A.5, numbered as there;
     · every row of the set that is missing, partial or kept outside has its instruction, a place and a link;
     · the figures the regulation fixes are the ones the guidance states: six years of records, indirect emissions only outside Annex II, the
       country default grid factor unless point D.4.3 is met, zero-rated fuels as sustainable biomass, the definitive period;
     · the Overview's 17 and its checklist are the same 17;
     · a product report reads Blocked while the site's one-time information is unanswered, and says so on its card. */

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

const { createWorkspace } = await import("../../workspace");
const { emptyInstallation, saveInstallation } = await import("../../installations");
const { buildReportSet } = await import("../report-set");
const { GUIDE_TABLES, GUIDED_KEYS, hrefFor, translateValue, WHERE_LABEL } = await import("../report-guidance");
const { profileGroups, profileStatus } = await import("../installation-profile");
const { asLine, covers, namesIn } = await import("../profile-suggestions");

const A5 = [
  "MP 1", "MP 2", "MP 3", "MP 4", "MP 5", "MP 6", "MP 7(a)", "MP 7(b)", "MP 8", "MP 9", "MP 10", "MP 11", "MP 12", "MP 13", "MP 14", "MP 15", "MP 16", "MP 17", "MP 18", "MP 19", "MP 20", "MP 21",
  "MP 22(a)", "MP 22(b)", "MP 22(c)", "MP 22(d)", "MP 22(e)", "MP 22(f)", "MP 22(g)", "MP 22(h)",
];

function blankSet() {
  storage.clear();
  const ws = createWorkspace({ installationId: "TH-PLANT-A", installationName: "Plant A", productId: "fasteners", productionRoute: "scrap_eaf", year: 2026 });
  return { ws, set: buildReportSet({ installation: emptyInstallation(true), workspaces: [ws], year: 2026 }) };
}

test("the monitoring-plan guide has every element of Annex II point A.5, and no other", () => {
  assert.deepEqual([...GUIDED_KEYS.monitoring_plan].sort(), [...A5].sort());
});

test("every row that is missing, partial or kept outside has its instruction, a place and a link", () => {
  const { set } = blankSet();
  const needs: string[] = [];
  for (const r of [...set.reports, ...set.attachments]) {
    for (const s of r.sections) {
      for (const row of s.rows) {
        if (row.state === "ready" || row.state === "not_applicable") {
          assert.equal(row.guide, undefined, `${r.kind} ${row.n}: a finished row does not instruct`);
          continue;
        }
        if (!row.guide) needs.push(`${r.kind} ${row.n} ${row.label.slice(0, 50)}`);
        else {
          assert.ok(row.guide.how.length > 10, `${r.kind} ${row.n}`);
          assert.ok(row.guide.href.startsWith("/workspaces/"), `${r.kind} ${row.n} → ${row.guide.href}`);
          assert.ok(WHERE_LABEL[row.guide.where], `${r.kind} ${row.n}`);
        }
      }
    }
  }
  // Rows the portal fills from another screen may carry none — but nothing the reader has to ANSWER may be left without.
  const unguidedAnswers = needs.filter((x) => !/16\(c\)|2\(a\)|15\(c\)|15\(d\)/.test(x));
  assert.deepEqual(unguidedAnswers, [], "rows that are missing or partial with nothing said about them");
});

test("where an answer is typed on the Overview the link goes to that field", () => {
  const { set } = blankSet();
  const mp = set.reports.find((r) => r.kind === "monitoring_plan")!;
  const row = mp.sections.flatMap((s) => s.rows).find((r) => r.n === "MP 15")!;
  assert.equal(row.guide?.where, "overview");
  assert.match(row.guide!.href, /^\/workspaces\/installation\/TH-PLANT-A#ip-zeroRatedFuels$/);
  const ident = mp.sections.flatMap((s) => s.rows).find((r) => r.label === "Name of the operator")!;
  assert.match(ident.guide!.href, /#ip-operatorName$/);
});

test("rows read from a product report lead to the product report that is furthest from ready", () => {
  const { ws, set } = blankSet();
  const mp = set.reports.find((r) => r.kind === "monitoring_plan")!;
  const row = mp.sections.flatMap((s) => s.rows).find((r) => r.n === "MP 7(b)")!;
  assert.equal(row.guide?.href, `/workspaces/${ws.id}/mmd`);
});

test("the guidance states what the regulation fixes, and not what an older checklist remembered", () => {
  const all = Object.values({ ...GUIDE_TABLES.MONITORING_PLAN, ...GUIDE_TABLES.EMISSIONS_REPORT, ...GUIDE_TABLES.SUMMARY_REPORT })
    .map((x) => `${x.how} ${x.example ?? ""}`)
    .join("\n");
  // Annex II A.2(4): at least six years after the reporting period.
  const records = GUIDE_TABLES.MONITORING_PLAN["MP 22(h)"];
  assert.match(`${records.how} ${records.example}`, /six years/);
  assert.doesNotMatch(all, /\b(4|four) years\b/i);
  // The definitive period is running: no "transitional" wording anywhere.
  assert.doesNotMatch(all + JSON.stringify(GUIDE_TABLES.ATTACHMENTS), /transitional/i);
  // Element 18 is for goods outside Annex II, defaults come from Annex II of 2025/2621, and a national average is not an actual value.
  const mp18 = GUIDE_TABLES.MONITORING_PLAN["MP 18"].how;
  assert.match(mp18, /outside Annex II/);
  assert.match(mp18, /2025\/2621/);
  assert.match(mp18, /D\.4\.3/);
  assert.match(mp18, /not an actual value/);
  // Grid electricity is not a source stream of direct emissions (element 9).
  assert.match(GUIDE_TABLES.MONITORING_PLAN["MP 9"].how, /not a source stream/);
  // Zero-rated = sustainable biomass, not a tax matter.
  assert.match(GUIDE_TABLES.MONITORING_PLAN["MP 15"].how, /biomass that meets the sustainability criteria/);
  assert.match(GUIDE_TABLES.MONITORING_PLAN["MP 15"].how, /not a fuel that is tax-exempt/);
  // Scrap is not a precursor.
  assert.match(GUIDE_TABLES.MONITORING_PLAN["MP 14"].how, /Scrap is not a precursor/);
  // Items 9–12 and 26 are asked only of goods outside Annex II.
  for (const k of ["9", "11", "12", "15(e)", "26"]) assert.match(GUIDE_TABLES.EMISSIONS_REPORT[k].how, /outside Annex II/, `item ${k}`);
});

test("the examples are the answer to type, in English, and never Thai", () => {
  for (const table of [GUIDE_TABLES.MONITORING_PLAN, GUIDE_TABLES.EMISSIONS_REPORT, GUIDE_TABLES.SUMMARY_REPORT, GUIDE_TABLES.IDENTITY]) {
    for (const [k, v] of Object.entries(table)) if (v.example) assert.doesNotMatch(v.example, /[฀-๿]/, k);
  }
});

test("a link to a screen is built from the installation and, for a report's own screens, the report", () => {
  assert.equal(hrefFor({ how: "", where: "products" }, { installationId: "TH-A B" }), "/workspaces/installation/TH-A%20B/products");
  assert.equal(hrefFor({ how: "", where: "monthly" }, { installationId: "TH-A", workspaceId: "ws-1" }), "/workspaces/ws-1/monthly");
});

test("a value built from product names and fixed phrases is said in the language of the screen, and what is not ours passes through", () => {
  const th: Record<string, string> = { "Steel billet": "เหล็กแท่ง", "Draft — not finalised": "ฉบับร่าง — ยังไม่ปิดฉบับ", "good(s)": "สินค้า", Yes: "ใช่", fuels: "เชื้อเพลิง", "monitoring throughout": "ติดตามเองตลอด" };
  const t = (s: string) => th[s] ?? s;
  assert.equal(translateValue(t, "Steel billet: Draft — not finalised; Steel billet: monitoring throughout"), "เหล็กแท่ง: ฉบับร่าง — ยังไม่ปิดฉบับ; เหล็กแท่ง: ติดตามเองตลอด");
  assert.equal(translateValue(t, "3 good(s)"), "3 สินค้า");
  assert.equal(translateValue(t, "Yes — Blast-furnace gas from the neighbouring works"), "ใช่ — Blast-furnace gas from the neighbouring works");
  assert.equal(translateValue(t, "Steel billet (CN 7207 11 11) — Scrap-EAF"), "เหล็กแท่ง (CN 7207 11 11) — Scrap-EAF");
  assert.equal(translateValue(t, "fuels: Natural gas"), "เชื้อเพลิง: Natural gas");
  assert.equal(translateValue((s) => s, "12.7, 101.1"), "12.7, 101.1", "English stays as it is");
});

test("the 17 of the Overview are the 17 of the checklist, group by group", () => {
  storage.clear();
  const blank = emptyInstallation(true);
  const status = profileStatus(blank);
  const groups = profileGroups(blank);
  assert.equal(status.total, 17);
  assert.deepEqual(groups.map((x) => [x.key, x.items.length]), [["operator", 3], ["installation", 4], ["plan", 3], ["questions", 7]]);
  assert.equal(groups.reduce((a, x) => a + x.items.length, 0), status.total);
  assert.equal(groups.reduce((a, x) => a + x.answered, 0), status.answered);

  const filled = {
    ...blank,
    operatorName: "Siam Steel Co., Ltd.",
    operatorRegistrationNumber: "0105551234567",
    operatorAddress: "1 Moo 1, Rayong, Thailand",
    name: "Plant A",
    unlocode: "THMTP",
    street: "1 Moo 1",
    city: "Rayong",
    lat: "12.681",
    lng: "101.159",
    monitoring: { ...blank.monitoring, nonCbamProcesses: "None", topFuels: "Natural gas", topMaterials: "None", cems: "no" as const, zeroRatedFuels: "no" as const, heatTrade: "no" as const, electricityMixed: "no" as const, onsiteElectricity: "no" as const, wasteGases: "no" as const, co2Transfer: "no" as const },
  };
  assert.equal(profileStatus(filled).complete, true);
  assert.ok(profileGroups(filled).every((x) => x.answered === x.items.length));
  // A "yes" with no detail is not an answer yet.
  const yes = { ...filled, monitoring: { ...filled.monitoring, heatTrade: "yes" as const, heatDetail: "" } };
  assert.equal(profileStatus(yes).answered, 16);
  assert.equal(profileGroups(yes).find((x) => x.key === "questions")!.items.find((i) => i.anchor === "ip-heatTrade")!.done, false);
  // Every anchor is unique, so a link goes to exactly one field.
  const anchors = profileGroups(blank).flatMap((x) => x.items.map((i) => i.anchor));
  assert.equal(new Set(anchors).size, anchors.length);
});

test("a suggestion is offered until the field already names every one of its entries, in any order and case", () => {
  const ranked = [{ name: "Natural gas", value: 9 }, { name: "Diesel", value: 3 }];
  assert.equal(asLine(ranked), "Natural gas, Diesel");
  assert.deepEqual(namesIn("diesel;  Natural GAS\n"), ["diesel", "natural gas"]);
  assert.equal(covers("", ranked), false);
  assert.equal(covers("Natural gas", ranked), false);
  assert.equal(covers("diesel, natural gas, coal", ranked), true);
  assert.equal(covers("anything", []), false, "nothing to suggest, nothing to cover");
});

test("a product report reads Blocked while its site's one-time information is unanswered — and says why", async () => {
  storage.clear();
  const { holdsFor } = await import("../report-holds");
  const { workspaceReadiness } = await import("../../readiness");
  const ws = createWorkspace({ installationId: "TH-PLANT-A", installationName: "Plant A", productId: "fasteners", productionRoute: "scrap_eaf", year: 2026 });
  saveInstallation({ ...emptyInstallation(true), id: "TH-PLANT-A", name: "Plant A" });
  const readiness = workspaceReadiness(ws);

  const open = holdsFor(readiness, profileStatus(emptyInstallation(true)));
  assert.equal(open.overall, "blocked");
  assert.deepEqual(open.holds[0], { text: "Installation info {a}/{b}", vars: { a: 0, b: 17 } });

  // Answered: the report reads whatever its own tabs say, and the hold is gone.
  const answered = holdsFor(readiness, { total: 17, answered: 17, gaps: [], complete: true });
  assert.equal(answered.overall, readiness.overall);
  assert.ok(!answered.holds.some((h) => h.text.startsWith("Installation info")));
});
