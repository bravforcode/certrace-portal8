import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LANGUAGES,
  translate,
  localeFor,
  storedLang,
  preferredLang,
} from "../i18n";
import { TH } from "../i18n-th";

test("supported languages list has en, th, zh and hi with correct labels and glyphs", () => {
  assert.equal(LANGUAGES.length, 4);
  const en = LANGUAGES.find((l) => l.code === "en");
  const th = LANGUAGES.find((l) => l.code === "th");

  assert.ok(en, "English config exists");
  assert.equal(en?.label, "English");
  assert.equal(en?.nativeLabel, "English");
  assert.equal(en?.glyph, "EN");

  assert.ok(th, "Thai config exists");
  assert.equal(th?.label, "Thai");
  assert.equal(th?.nativeLabel, "ไทย");
  assert.equal(th?.glyph, "TH");
});

test("localeFor returns corresponding BCP-47 locale tag", () => {
  assert.equal(localeFor("th"), "th-TH");
  assert.equal(localeFor("en"), "en-GB");
});

test("translate falls back to English when key is missing or when language is en", () => {
  assert.equal(translate("en", "Unknown String Here"), "Unknown String Here");
  assert.equal(translate("th", "Unknown String Here"), "Unknown String Here");
});

test("translate looks up Thai translations accurately", () => {
  assert.equal(translate("th", "Language"), "ภาษา");
  assert.equal(translate("th", "Declarations"), "การสำแดง");
  // A Thai label never carries the English one after it — the reader chose Thai.
  assert.equal(translate("th", "Workspaces"), "พื้นที่ทำงาน");
  assert.equal(translate("th", "Settings"), "การตั้งค่า");
  assert.equal(translate("th", "Sign out"), "ออกจากระบบ");
  assert.equal(translate("th", "Signing out…"), "กำลังออกจากระบบ…");
});

test("translate interpolates variables correctly in EN and TH", () => {
  const templateEn = "Hello {name}, you have {count} items";
  assert.equal(
    translate("en", templateEn, { name: "Somchai", count: 5 }),
    "Hello Somchai, you have 5 items",
  );

  // In Thai dictionary: "{plan} plan" -> "แพ็กเกจ {plan}"
  assert.equal(translate("th", "{plan} plan", { plan: "Pro" }), "แพ็กเกจ Pro");
});

test("storedLang safely returns en in node environment without localStorage", () => {
  // window is undefined in standard Node.js environment
  assert.equal(storedLang(), "en");
});

/* ── which language a page opens in ──────────────────────────────
   A supplier reaches a Smart Link with no account and no previous visit, so
   there is nothing on file to read a preference from and the browser's own
   list is the only signal there is. */

test("a saved choice always wins, whatever the browser asks for", () => {
  assert.equal(preferredLang("en", ["th-TH", "th"]), "en");
  assert.equal(preferredLang("th", ["en-GB"]), "th");
});

test("a Thai browser opens in Thai, in every shape the tag comes in", () => {
  assert.equal(preferredLang(null, ["th"]), "th");
  assert.equal(preferredLang(null, ["th-TH"]), "th");
  // Region, script and extension subtags all hang off the same language subtag.
  assert.equal(preferredLang(null, ["th-TH-u-nu-thai"]), "th");
  // Case is not significant in a language tag; a browser is free to send any.
  assert.equal(preferredLang(null, ["TH-th"]), "th");
});

test("the list is ordered, so the first language we speak wins", () => {
  /* The case the Browser pane itself reports: English first, Thai also
     installed. That reader asked for English and gets it — answering in Thai
     would overrule a preference they actually stated, and it is a common
     shape (an English-locale OS with Thai added). */
  assert.equal(preferredLang(null, ["en-US", "th"]), "en");
  assert.equal(preferredLang(null, ["th-TH", "en-GB"]), "th");
});

test("a language we do not speak is skipped, not answered in", () => {
  assert.equal(preferredLang(null, ["ja-JP", "th-TH", "en"]), "th");
  assert.equal(preferredLang(null, ["ja-JP", "ko"]), "en");
});

test("nothing to go on opens in English, the language the product is written in", () => {
  assert.equal(preferredLang(null, []), "en");
  assert.equal(preferredLang(null, [undefined]), "en");
  // Not a Thai tag: `tha` is ISO 639-2, which no browser sends, and matching
  // on a bare prefix would also catch invented tags like `thq`.
  assert.equal(preferredLang(null, ["tha"]), "en");
});

test("a junk value in storage is ignored rather than trusted", () => {
  assert.equal(preferredLang("klingon", ["th"]), "th");
  assert.equal(preferredLang("", ["en"]), "en");
});

test("portal navigation and action items are translated into Thai in dictionary", () => {
  const criticalPortalKeys = [
    "Language",
    "Declarations",
    "Workspaces",
    "Suppliers",
    "Settings",
    "Sign out",
    "Signing out…",
    "Report a problem",
    "Notifications",
    "Mark all read",
  ];

  for (const key of criticalPortalKeys) {
    assert.ok(
      TH[key],
      `Thai dictionary must contain translation for: "${key}"`,
    );
    assert.notEqual(
      TH[key].trim(),
      "",
      `Translation for "${key}" must not be empty`,
    );
  }
});

test("DOM representation logic for LanguageToggle", () => {
  // Test simulated rendering logic of LanguageToggle for both language states
  function renderToggleAttributes(currentLang: "en" | "th") {
    return {
      container: {
        role: "group",
        ariaLabel: translate(currentLang, "Language"),
      },
      buttons: LANGUAGES.map((l) => ({
        code: l.code,
        label: l.code === "th" ? l.nativeLabel : l.glyph,
        ariaPressed: l.code === currentLang,
        isActive: l.code === currentLang,
      })),
    };
  }

  // When current language is English
  const domEn = renderToggleAttributes("en");
  assert.equal(domEn.container.ariaLabel, "Language");
  assert.equal(domEn.buttons[0].ariaPressed, true); // EN active
  assert.equal(domEn.buttons[1].ariaPressed, false); // TH inactive

  // When current language is Thai
  const domTh = renderToggleAttributes("th");
  assert.equal(domTh.container.ariaLabel, "ภาษา");
  assert.equal(domTh.buttons[0].ariaPressed, false); // EN inactive
  assert.equal(domTh.buttons[1].ariaPressed, true); // TH active
});

test("no Thai label carries its English twin in brackets after it", () => {
  // "ติดขัด (Blocked)" reads as a translation left showing. Units, acronyms and codes — (MWh), (CO₂e), (NCV) — are not twins and stay.
  const gloss = /\s*\([A-Z]?[a-z][A-Za-z '’&-]{3,}\)\s*$/;
  for (const key of [
    "Blocked",
    "Verification",
    "Smart Links",
    "Carbon & Cost",
    "Monthly data",
    "Workspaces",
    "New workspace",
    "Reporting year",
    "Precursor",
  ]) {
    const th = translate("th", key);
    assert.ok(!gloss.test(th), `${key} → ${th}`);
  }
  assert.equal(translate("th", "Smart Links"), "สมาร์ทลิงค์");
});

/* ── Chinese and Hindi are offered on every screen ───────────── */
import { LINK_LANGUAGES, languagesFor } from "../i18n";

test("every screen offers English, Thai, Chinese and Hindi", () => {
  assert.deepEqual(
    languagesFor("/w/abc").map((l) => l.code),
    ["en", "th", "zh", "hi"],
  );
  assert.deepEqual(
    languagesFor("/p/abc").map((l) => l.code),
    ["en", "th", "zh", "hi"],
  );
  assert.deepEqual(
    languagesFor("/onboarding").map((l) => l.code),
    ["en", "th", "zh", "hi"],
  );
  assert.deepEqual(
    languagesFor("/onboarding/done").map((l) => l.code),
    ["en", "th", "zh", "hi"],
  );
  assert.deepEqual(
    languagesFor("/dashboard").map((l) => l.code),
    ["en", "th", "zh", "hi"],
  );
  assert.deepEqual(
    languagesFor("/workspaces/ws-1/monthly").map((l) => l.code),
    ["en", "th", "zh", "hi"],
  );
  assert.deepEqual(
    languagesFor(null).map((l) => l.code),
    ["en", "th", "zh", "hi"],
  );
  assert.equal(
    LINK_LANGUAGES.find((l) => l.code === "zh")?.nativeLabel,
    "中文",
  );
  assert.equal(LANGUAGES.length, 4);
});

test("a Chinese choice is honoured where Chinese is offered, and ignored where it is not", () => {
  assert.equal(preferredLang("zh", [], ["en", "th", "zh", "hi"]), "zh");
  assert.equal(
    preferredLang("zh", ["th"], ["en", "th"]),
    "th",
    "falls to the browser's list, never to a language the page cannot speak",
  );
  assert.equal(preferredLang(null, ["zh-CN", "en"], ["en", "th", "zh"]), "zh");
  assert.equal(preferredLang(null, ["zh-CN", "en"], ["en", "th"]), "en");
});

test("Chinese strings translate, and a sentence built before it reached t() is found by its template", () => {
  assert.equal(translate("zh", "Save changes"), "保存更改");
  assert.equal(
    translate("zh", "Fuel row 3 has no fuel chosen."),
    "燃料行 3 尚未选择燃料。",
  );
  // a fuel's name inside a template is translated on its own
  assert.equal(
    translate("zh", "Natural gas (row 2) has no emission factor."),
    "天然气（第 2 行）没有排放因子。",
  );
  // several sentences are taken one at a time
  assert.equal(
    translate(
      "zh",
      "Fuel row 3 has no fuel chosen. Pick one, or remove the row if nothing of the kind was burned this month.",
    ),
    "燃料行 3 尚未选择燃料。请选择一种燃料；如果本月没有燃烧此类燃料，请删除该行。",
  );
  // something with no entry stays as it came
  assert.equal(
    translate("zh", "A sentence nobody has translated yet."),
    "A sentence nobody has translated yet.",
  );
  assert.equal(
    translate("en", "Fuel row 3 has no fuel chosen."),
    "Fuel row 3 has no fuel chosen.",
  );
});

test("a generic template does not swallow an unrelated sentence", () => {
  const long =
    "Scrap is charged to the 90 t electric arc furnace, tapped to the ladle furnace and continuously cast into billet.";
  assert.equal(translate("th", long), long);
});

/* ── Hindi is on offer where Chinese is — the two links and the sign-up ───────── */
import { ZH } from "../i18n-zh";
import { HI } from "../i18n-hi";

test("Hindi is offered on the links and the sign-up, and nowhere in the portal", () => {
  assert.equal(
    LINK_LANGUAGES.find((l) => l.code === "hi")?.nativeLabel,
    "हिन्दी",
  );
  assert.deepEqual(
    languagesFor("/dashboard").map((l) => l.code),
    ["en", "th", "zh", "hi"],
  );
  assert.equal(preferredLang("hi", [], ["en", "th", "zh", "hi"]), "hi");
  assert.equal(
    preferredLang("hi", ["th"], ["en", "th"]),
    "th",
    "never a language the page cannot speak",
  );
  assert.equal(
    preferredLang(null, ["hi-IN", "en"], ["en", "th", "zh", "hi"]),
    "hi",
    "a reader whose browser is set to Hindi gets Hindi",
  );
  assert.equal(localeFor("hi"), "hi-IN");
});

test("Hindi has a row for every string Chinese has, with its placeholders intact", () => {
  const missing = Object.keys(ZH).filter((k) => HI[k] === undefined);
  assert.deepEqual(
    missing,
    [],
    "every link and sign-up string has a Hindi row",
  );
  const names = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
  for (const [k, v] of Object.entries(HI)) assert.equal(names(v), names(k), k);
});

test("Hindi strings are Hindi: the Devanagari script, not English left showing", () => {
  const letters = /[A-Za-z]{4,}/;
  const devanagari = /[\u0900-\u097F]/;
  const stillEnglish = Object.entries(HI).filter(
    ([k, v]) => letters.test(k) && !devanagari.test(v),
  );
  // A string that is only a name, a code or a unit (a CN code, "LINE ID", "name@company.com", "PTT, …") may stay as it is.
  assert.ok(
    stillEnglish.length <= 12,
    `${stillEnglish.length} rows have no Hindi: ${stillEnglish
      .slice(0, 5)
      .map(([k]) => k)
      .join(" | ")}`,
  );
});

test("Hindi strings translate, and a sentence built before it reached t() is found by its template", () => {
  assert.equal(translate("hi", "Save changes"), "बदलाव सहेजें");
  assert.equal(
    translate("hi", "Fuel row 3 has no fuel chosen."),
    "ईंधन पंक्ति 3 में कोई ईंधन नहीं चुना गया।",
  );
  assert.equal(translate("hi", "Month", undefined), "महीना");
  assert.equal(
    translate(
      "hi",
      "{n} things must be answered before this month can be submitted.",
      { n: 4 },
    ),
    "इस महीने को जमा करने से पहले 4 बातों का उत्तर देना ज़रूरी है।",
  );
  assert.equal(
    translate("hi", "A sentence nobody has translated yet."),
    "A sentence nobody has translated yet.",
  );
});
