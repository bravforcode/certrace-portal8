import test from "node:test";
import assert from "node:assert/strict";
import { isLocaleLoaded, loadLocale, translate } from "../i18n";
import { TH_ALL } from "../i18n-th-all";

// The test loader preloads every dictionary; this proves loading is what makes translate() answer, and that a repeat load is a no-op.
test("a loaded dictionary answers synchronously, and loading again changes nothing", async () => {
  for (const lang of ["th", "zh", "hi"] as const)
    assert.equal(isLocaleLoaded(lang), true);
  assert.equal(isLocaleLoaded("en"), true);
  const before = translate("th", "Dashboard");
  assert.notEqual(before, "Dashboard");
  await loadLocale("th");
  assert.equal(translate("th", "Dashboard"), before);
});

test("Thai verification copy is available through the loaded locale", () => {
  assert.equal(translate("th", "Your input readiness"), "ความครบถ้วนของข้อมูล");
  assert.equal(translate("th", "Copy request link"), "คัดลอกลิงก์คำขอ");
  assert.equal(translate("th", "Mark as sent"), "บันทึกว่าส่งแล้ว");
});

// Every menu language must cover every string Thai covers. A missing row renders English, and with
// most rows missing a language looks like the menu did nothing (the original bug).
test("every non-English language translates every string Thai does", () => {
  const langs = ["zh", "hi", "vi", "tr", "ko", "zh-TW", "id", "ja", "ms"] as const;
  for (const lang of langs) {
    const missing = Object.keys(TH_ALL).filter(
      (k) => !translate(lang, k).trim(),
    );
    assert.deepEqual(missing.slice(0, 5), [], `${lang} has empty rows`);
  }
  assert.equal(translate("ja", "Dashboard") === "Dashboard", false);
  assert.equal(translate("vi", "Dashboard") === "Dashboard", false);
});

test("each language dictionary has a row for every Thai key", async () => {
  const dicts: Record<string, Record<string, string>> = {
    vi: (await import("../i18n-vi")).VI,
    tr: (await import("../i18n-tr")).TR,
    ko: (await import("../i18n-ko")).KO,
    "zh-TW": (await import("../i18n-zh-tw")).ZH_TW,
    id: (await import("../i18n-id")).ID,
    ja: (await import("../i18n-ja")).JA,
    ms: (await import("../i18n-ms")).MS,
    zh: {
      ...(await import("../i18n-zh")).ZH,
      ...(await import("../i18n-zh-extra")).ZH_EXTRA,
    },
    hi: {
      ...(await import("../i18n-hi")).HI,
      ...(await import("../i18n-hi-extra")).HI_EXTRA,
    },
  };
  for (const [lang, d] of Object.entries(dicts)) {
    const missing = Object.keys(TH_ALL).filter((k) => !(k in d));
    assert.deepEqual(missing.slice(0, 5), [], `${lang} missing ${missing.length} rows`);
  }
});

// The merged chunk must keep the old precedence: TH_POLISH, spread last, wins over every earlier part.
test("the Thai chunk keeps TH_POLISH as the final word", async () => {
  const { TH_POLISH } = await import("../i18n-th-polish");
  const [key, value] = Object.entries(TH_POLISH)[0]!;
  assert.equal(TH_ALL[key], value);
});
