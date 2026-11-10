/* ════════════════════════════════════════════════════════════
   CERA ANSWERS IN THE LANGUAGE IT IS ASKED IN, PINNED

   One rule, and it is the user's own: write to Cera in Thai and it answers in
   Thai, write in English and it answers in English. The screen's language only
   decides what a message with no words of its own (a dropped file) is answered
   in — and what the buttons say, which is the same rule again, because a button
   sends its own text:

     · a Thai screen shows Thai buttons, a Thai button sends Thai, the answer is Thai
     · English typed on that Thai screen is answered in English, and the reverse
     · the CBAM updates digest and the smart upload are no exception
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

const { reply, CERA_SUGGESTIONS } = await import("../engine");
const { langOf, hasThai } = await import("../lang");
const { Q_TH, TH_KNOWLEDGE, thaiQuestion, englishQuestion, thaiAnswer } =
  await import("../knowledge-th");
const { KNOWLEDGE, best } = await import("../knowledge");
const { analyzeText, applyPlan, nextStep } = await import("../smart-upload");
const { createWorkspace, listWorkspaces } = await import("../../workspace");
const { emptyInstallation, saveInstallation } = await import(
  "../../installations"
);

const SAMPLE_2 = readFileSync(
  new URL(
    "./fixtures/cera-sample-2-meter-MTR-2210-march-2026.csv",
    import.meta.url,
  ),
  "utf8",
);
const SAMPLE_1 = readFileSync(
  new URL(
    "./fixtures/cera-sample-1-monthly-report-march-2026.txt",
    import.meta.url,
  ),
  "utf8",
);

/** Thai prose may carry Latin terms (CBAM, CN, kWh, default) — what must not happen is a Thai reply with no Thai in it. */
const thai = (s: string) => hasThai(s);

test("the language of a message is what it is written in — and the screen's only when it has no words", () => {
  assert.equal(langOf("อัพเดท CBAM", "en"), "th");
  assert.equal(langOf("What's new in CBAM?", "th"), "en");
  assert.equal(langOf("CBAM ล่าสุด", "en"), "th", "one Thai word is enough");
  assert.equal(
    langOf("7318 12 90", "th"),
    "th",
    "numbers alone fall back to the screen",
  );
  assert.equal(langOf("7318 12 90", "en"), "en");
  assert.equal(langOf("", "th"), "th");
});

test("a Thai button gets a Thai answer: CBAM updates", () => {
  const r = reply("อัพเดท CBAM", { lang: "th" });
  assert.equal(r.lang, "th");
  assert.ok(thai(r.text));
  const card = r.cards?.[0];
  assert.equal(card?.kind, "updates");
  if (card?.kind !== "updates") return;
  for (const u of [...card.inForce, ...card.upcoming]) {
    assert.ok(thai(u.title), `title in Thai: ${u.title}`);
    assert.ok(thai(u.body), `body in Thai: ${u.id}`);
  }
  assert.ok(
    r.suggestions?.length && r.suggestions.every(thai),
    "and what it offers next is Thai too",
  );
});

test("a Thai button gets a Thai answer: smart upload", () => {
  const r = reply("สมาร์ทอัพโหลด", { lang: "th" });
  assert.equal(r.lang, "th");
  assert.equal(r.startUpload, true);
  assert.ok(thai(r.text));
});

test("typed Thai is answered in Thai, whichever language the screen is in", () => {
  for (const screen of ["en", "th"] as const) {
    for (const q of [
      "อัพเดท CBAM",
      "สมาร์ทอัพโหลด",
      "CBAM คืออะไร",
      "ค่า default ของ CN 7318 12 90 คือเท่าไร",
    ]) {
      const r = reply(q, { lang: screen });
      assert.equal(r.lang, "th", `${q} on a ${screen} screen`);
      assert.ok(thai(r.text), `${q} → ${r.text.slice(0, 60)}`);
    }
  }
});

test("typed English is answered in English, whichever language the screen is in", () => {
  for (const screen of ["en", "th"] as const) {
    for (const q of [
      "What's new in CBAM?",
      "Smart upload",
      "What is CBAM?",
      "What is the default value for CN 7318 12 90?",
    ]) {
      const r = reply(q, { lang: screen });
      assert.equal(r.lang, "en", `${q} on a ${screen} screen`);
      assert.ok(!thai(r.text), `${q} → ${r.text.slice(0, 60)}`);
      if (r.cards?.[0]?.kind === "updates")
        assert.ok(!thai(r.cards[0].upcoming[0].title));
    }
  }
});

test("every Thai suggestion Cera can offer sends back to an English question it stands for", () => {
  for (const [en, th] of Object.entries(Q_TH)) {
    const back = englishQuestion(th);
    assert.ok(back, th);
    // two English wordings may share one Thai question ("What is / are embedded emissions?") — either one is the same question
    assert.equal(thaiQuestion(back), th);
    assert.equal(thaiQuestion(en), th);
  }
});

test("every follow-up Cera offers, in either language, has a Thai twin", () => {
  const asked = new Set<string>([
    ...CERA_SUGGESTIONS,
    "Where do I start in Certrace?",
    "Should I use default or actual values?",
    "What is CBAM?",
    "What are the key CBAM dates?",
  ]);
  for (const e of KNOWLEDGE) for (const q of e.related ?? []) asked.add(q);
  const missing = [...asked].filter((q) => !Q_TH[q]);
  assert.deepEqual(
    missing,
    [],
    "a follow-up with no Thai would stay English on a Thai screen",
  );
});

test("every question Cera offers in Thai gets a Thai answer, and only Thai follow-ups", () => {
  for (const [en, th] of Object.entries(Q_TH)) {
    const r = reply(th, { lang: "th" });
    assert.equal(r.lang, "th", th);
    assert.ok(thai(r.text), `${th} → ${r.text.slice(0, 80)}`);
    assert.ok(
      (r.suggestions ?? []).every(thai),
      `${th}: ${(r.suggestions ?? []).join(" | ")}`,
    );

    // When the English question lands on a knowledge entry, the Thai one lands on the same entry, in Thai.
    const e = reply(en, { lang: "en" });
    const hit = best(en);
    if (hit && e.text === hit.entry.answer)
      assert.equal(r.text, thaiAnswer(hit.entry.id)?.text, th);
  }
});

test("every entry has its Thai answer, written in Thai", () => {
  for (const e of KNOWLEDGE) {
    const th = TH_KNOWLEDGE[e.id];
    assert.ok(th, `no Thai for ${e.id}`);
    // a title may be a proper noun (UN/LOCODE); the answer and a way to ask for it may not
    assert.ok(
      thai(th.answer) && th.title.length > 0 && th.keys.length > 0,
      e.id,
    );
  }
});

test("what is not about CBAM or Certrace is turned down in the language it was asked in", () => {
  assert.ok(thai(reply("ช่วยเขียนบทกวีเกี่ยวกับทะเลหน่อย", { lang: "en" }).text));
  assert.ok(!thai(reply("write me a poem about the sea", { lang: "th" }).text));
});

/* ── The smart upload, in Thai ──────────────────────────────── */
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
  return createWorkspace({
    installationId: "TH-RAYONG-01",
    installationName: "Rayong Works",
    productId: "ironore",
    productionRoute: "sintering",
    year: 2026,
    selfSupplied: true,
  });
}

test("smart upload asks in Thai, with Thai months, when the question was Thai", () => {
  const iron = seed();
  const none = analyzeText("r.txt", "Natural gas: 12,000 m3\n");
  const s = nextStep(none, { workspaceId: iron.id }, listWorkspaces(), "th");
  assert.equal(s.kind, "ask");
  if (s.kind !== "ask" || s.card.kind !== "choice") return;
  assert.ok(thai(s.text) && thai(s.card.question));
  assert.match(
    s.card.options[0].label,
    /มกราคม 2026/,
    "Thai month, Gregorian year",
  );

  const en = nextStep(none, { workspaceId: iron.id }, listWorkspaces(), "en");
  assert.ok(en.kind === "ask" && /doesn't say which month/.test(en.text));
});

test("a file read in Thai is laid out and filled in Thai", () => {
  const iron = seed();
  const a = analyzeText("report.txt", SAMPLE_1);
  const s = nextStep(a, {}, listWorkspaces(), "th");
  assert.equal(s.kind, "plan");
  if (s.kind !== "plan") return;
  assert.equal(s.plan.lang, "th");
  assert.ok(
    thai(s.plan.documentKind) && /มีนาคม 2026/.test(s.plan.monthLabel),
    `${s.plan.documentKind} · ${s.plan.monthLabel}`,
  );
  const done = applyPlan(s.plan);
  assert.ok(done.ok);
  assert.ok(thai(done.message), done.message);
  assert.equal(iron.id, s.plan.workspaceId);
});

test("a meter log with no label is asked about in Thai, and the options are Thai", () => {
  seed();
  const a = analyzeText("meter.csv", SAMPLE_2);
  const s = nextStep(a, {}, listWorkspaces(), "th");
  assert.equal(s.kind, "ask");
  if (s.kind !== "ask" || s.card.kind !== "choice") return;
  assert.ok(thai(s.text) && thai(s.card.question));
  assert.ok(
    s.card.options.every((o) => thai(o.label) && (!o.hint || thai(o.hint))),
  );
});

test("asking why a product report says Blocked gets the explanation, not a summary of the account — in both languages", () => {
  storage.clear();
  createWorkspace({
    installationId: "TH-A",
    installationName: "A",
    productId: "billet",
    productionRoute: "scrap_eaf",
    year: 2026,
  });
  const en = reply("Why does my product report say Blocked?", { lang: "en" });
  assert.match(en.text, /^Blocked means/);
  const th = reply("ทำไมรายงานผลิตภัณฑ์ขึ้นว่าติดขัด", { lang: "th" });
  assert.match(th.text, /^ติดขัดหมายความว่า/);
  // …while "where do I stand" is still the account summary.
  assert.match(
    reply("What is my status?", { lang: "en" }).text,
    /^You have 1 product report/,
  );
});

test("the plain question about electricity for steel is answered, in Thai and in English", () => {
  const en = reply("Do I have to enter electricity for steel?", { lang: "en" });
  assert.match(en.text, /direct emissions/);
  assert.ok(!/annex|article/i.test(en.text), "no citation");
  const th = reply("ต้องกรอกไฟฟ้าสำหรับเหล็กไหม", { lang: "th" });
  assert.ok(thai(th.text) && /ทางตรง/.test(th.text));
});

test("after Cera fills a month it offers a button for every part of the form it wrote into, in the order the form shows them", () => {
  seed();
  const s = nextStep(
    analyzeText("report.txt", SAMPLE_1),
    {},
    listWorkspaces(),
    "en",
  );
  assert.equal(s.kind, "plan");
  if (s.kind !== "plan") return;
  const done = applyPlan(s.plan);
  assert.equal(done.ok, true);
  assert.ok(
    done.sections.includes("production") &&
      done.sections.includes("fuel") &&
      done.sections.includes("electricity"),
    done.sections.join(","),
  );
  const order = [
    "production",
    "fuel",
    "electricity",
    "process",
    "scrap",
    "pfc",
    "notes",
  ];
  assert.deepEqual(
    done.sections,
    [...done.sections].sort((a, b) => order.indexOf(a) - order.indexOf(b)),
  );
});
