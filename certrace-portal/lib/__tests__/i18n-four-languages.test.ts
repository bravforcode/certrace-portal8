/* ════════════════════════════════════════════════════════════
   FOUR LANGUAGES, ONE DICTIONARY — what is written in Thai is written in Chinese and Hindi

   The dictionary is keyed on the English source string. Thai is the reference: every key it carries must also
   have a Chinese and a Hindi row, and a row must keep every {placeholder} its English has — a translation that
   drops {n} prints a sentence with a hole in it.
   ════════════════════════════════════════════════════════════ */

import { test } from "node:test";
import assert from "node:assert/strict";

const { TH } = await import("../i18n-th");
const { TH_LINK } = await import("../i18n-th-link");
const { TH_CN } = await import("../i18n-th-cn");
const { TH_ROUTES } = await import("../i18n-th-routes");
const { TH_SECTOR } = await import("../i18n-th-sector");
const { TH_INTAKE } = await import("../i18n-th-intake");
const { TH_POLISH } = await import("../i18n-th-polish");
const { ZH } = await import("../i18n-zh");
const { HI } = await import("../i18n-hi");
const { LANGUAGES, translate } = await import("../i18n");

const TH_ALL: Record<string, string> = {
  ...TH_LINK,
  ...TH_CN,
  ...TH_ROUTES,
  ...TH_SECTOR,
  ...TH_INTAKE,
  ...TH,
  ...TH_POLISH,
};
const holes = (s: string) =>
  [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test("the interface offers English, Thai, Chinese and Hindi", () => {
  assert.deepEqual(
    LANGUAGES.map((l) => l.code),
    ["en", "th", "zh", "hi"],
  );
});

test("every key the Thai dictionary carries has a Chinese and a Hindi row", () => {
  const missingZh = Object.keys(TH_ALL).filter((k) => !(k in ZH));
  const missingHi = Object.keys(TH_ALL).filter((k) => !(k in HI));
  assert.deepEqual(
    missingZh.slice(0, 10),
    [],
    `${missingZh.length} keys have no Chinese`,
  );
  assert.deepEqual(
    missingHi.slice(0, 10),
    [],
    `${missingHi.length} keys have no Hindi`,
  );
});

test("a row keeps every {placeholder} its English has, and adds none", () => {
  for (const [name, table] of [
    ["zh", ZH],
    ["hi", HI],
  ] as const) {
    const bad = Object.entries(table).filter(
      ([k, v]) => JSON.stringify(holes(k)) !== JSON.stringify(holes(v)),
    );
    assert.deepEqual(
      bad.slice(0, 5).map(([k, v]) => `${k} → ${v}`),
      [],
      `${name}: ${bad.length} rows change their placeholders`,
    );
  }
});

test("a row is written in its own script, not left as the English it translates", () => {
  const latinOnly = /^[\x00-\x7f…’“”–—·€£₂₃≈×÷±→←↑↓•]*$/;
  for (const [name, table, own] of [
    ["zh", ZH, /[一-鿿]/],
    ["hi", HI, /[ऀ-ॿ]/],
  ] as const) {
    // a brand, a unit or a code stays as it is; a sentence does not
    const sentences = Object.entries(table).filter(
      ([k]) =>
        /\s/.test(k) && /[a-z]{4}.*\s.*[a-z]{4}/i.test(k) && k.length > 40,
    );
    const untranslated = sentences.filter(
      ([, v]) => !own.test(v) && latinOnly.test(v),
    );
    assert.deepEqual(
      untranslated.slice(0, 5).map(([k]) => k),
      [],
      `${name}: ${untranslated.length} long sentences were left in English`,
    );
  }
});

test("translate() answers in the language asked, and falls back to the English when there is no row", () => {
  assert.equal(translate("zh", "Dashboard"), "仪表板");
  assert.equal(translate("hi", "Dashboard"), "डैशबोर्ड");
  assert.equal(
    translate("zh", "A sentence nobody has written a row for"),
    "A sentence nobody has written a row for",
  );
  assert.equal(
    translate(
      "hi",
      "Your buyers file their first CBAM declaration on {date} and need your verified figures before then.",
      { date: "30 September 2027" },
    ).includes("30 September 2027"),
    true,
  );
});
