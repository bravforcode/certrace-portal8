/* ════════════════════════════════════════════════════════════
   CERA ANSWERS THE TWO QUESTIONS THE DASHBOARD CARD PUTS ONE TAP AWAY

   "Who is late and what should I chase first?" and "Which suppliers should I get verified figures from?" used to land on the
   general entry about suppliers. They are answered from the reader's own chain now — in the language of the question, with
   the button text of the dashboard card understood exactly like free typing.
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
g.window = { localStorage: storage, dispatchEvent: () => true };
g.localStorage = storage;

const { reply } = await import("../engine");
const { applyEuStandard, emptyMonth, saveMonth } = await import(
  "../../monthly-data"
);
const { emptySupplier, saveSupplier } = await import(
  "../../precursor-suppliers"
);
const { createWorkspace } = await import("../../workspace");
const { markMonthSent } = await import("../../month-dispatch");
const { translate } = await import("../../i18n");

const CHASE = "Who is late and what should I chase first?";
const VERIFY = "Which suppliers should I get verified figures from?";

function estate() {
  storage.clear();
  const ws = createWorkspace({
    installationId: "TH-A",
    installationName: "Plant A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2026,
    selfSupplied: true,
  });
  for (let m = 1; m <= 3; m += 1) {
    saveMonth({
      ...emptyMonth(ws.id, `2026-0${m}`),
      productionTonnes: 4000,
      fuels: [
        applyEuStandard({
          id: `f${m}`,
          fuelType: "natural_gas",
          quantity: 200,
          unit: "t",
          efTco2PerGj: 0,
          factorSource: "eu_standard",
          oxidationFactor: 1,
        }),
      ],
      status: "submitted",
      submittedAt: new Date(2026, m, 5).toISOString(),
      submittedBy: "Test",
    });
  }
  markMonthSent(ws.id, "2026-04", 15);
  markMonthSent(ws.id, "2026-05", 15);
  saveSupplier({
    ...emptySupplier(ws.id),
    name: "Chonburi Foundry",
    country: "TH",
    origin: "purchased",
    precursorName: "Pig iron",
    cnCode: "7201",
    dataOrigin: "default_value",
    seeTco2ePerT: 1.9,
    monthlyQuantities: [{ month: "2026-01", tonnes: 800 }],
  });
  return ws;
}

test("who is late: the overdue months, oldest first, and a button to open the first of them", () => {
  estate();
  const r = reply(CHASE);
  assert.match(r.text, /overdue, worst first/);
  const lines = r.text.split("\n").filter((l) => l.startsWith("•"));
  assert.ok(lines.length >= 2);
  assert.match(
    lines[0],
    /April 2026 data — Plant A|April 2026 data — Billet|April 2026 data/,
  );
  assert.match(lines[0], /\d+ days late/);
  const card = r.cards?.find((c) => c.kind === "links");
  assert.ok(card && card.kind === "links");
  assert.match(card.links[0].href, /\/monthly\/2026-04$/);
  assert.equal(
    card.links[0].focus,
    "#qf-production",
    "the button leads to the first empty field",
  );
});

test("it is the same question however it is put — typed, or the dashboard's own button", () => {
  estate();
  for (const q of [
    "Who is late and what should I chase first?",
    "what should I do next?",
    "which suppliers are overdue",
    "what should I chase first",
  ]) {
    assert.match(reply(q).text, /overdue|Nothing is late/, q);
  }
});

test("in Thai, Chinese and Hindi the button text of the dashboard card gets the same answer, in that language", () => {
  estate();
  const th = reply(translate("th", CHASE), { lang: "th" });
  assert.match(th.text, /เลยกำหนด/);
  const zh = reply(translate("zh", CHASE), { lang: "zh" });
  assert.match(zh.text, /逾期/);
  const hi = reply(translate("hi", CHASE), { lang: "hi" });
  assert.match(hi.text, /देर/);
  for (const r of [th, zh, hi])
    assert.ok(
      r.cards?.some((c) => c.kind === "links"),
      "a button to open the month",
    );
});

test("which suppliers to ask: the ones carrying the most, still on a default value, with their share", () => {
  estate();
  const r = reply(VERIFY);
  assert.match(r.text, /Chonburi Foundry/);
  assert.match(r.text, /\d+%/);
  assert.match(r.text, /default value/);
  assert.ok(
    r.cards?.some(
      (c) => c.kind === "links" && c.links[0].href === "/supply-chain",
    ),
  );
  for (const [lang, word] of [
    ["th", "ค่า default"],
    ["zh", "默认值"],
    ["hi", "डिफ़ॉल्ट"],
  ] as const) {
    const x = reply(translate(lang, VERIFY), { lang });
    assert.match(x.text, new RegExp(word), lang);
    assert.match(x.text, /Chonburi Foundry/, lang);
  }
});

test("with nothing late and no chain it says so, rather than inventing a worry", () => {
  storage.clear();
  const r = reply(CHASE);
  assert.match(r.text, /Nothing is late right now/);
  assert.ok(!r.cards, "nothing to open");
  const v = reply(VERIFY);
  assert.match(v.text, /No bought-in input carries emissions yet/);
});

test("a supplier on a smart link has no account to read: the question is not answered from one", () => {
  estate();
  const r = reply(CHASE, { supplier: true });
  assert.ok(
    !/April 2026 data/.test(r.text),
    "the exporter's late months are not the supplier's business",
  );
});

test("suggestions after the answer are in the language of the answer", () => {
  estate();
  const r = reply(translate("zh", CHASE), { lang: "zh" });
  assert.ok(r.suggestions && r.suggestions.length > 0);
  assert.ok(
    r.suggestions.every((s) => s !== VERIFY),
    "the English button text is not left in a Chinese reply",
  );
});
