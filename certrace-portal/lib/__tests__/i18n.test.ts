import { test } from "node:test";
import assert from "node:assert/strict";
import { LANGUAGES, translate, localeFor, storedLang } from "../i18n";
import { TH } from "../i18n-th";

test("supported languages list has en and th with correct labels and glyphs", () => {
  assert.equal(LANGUAGES.length, 2);
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
  assert.equal(translate("th", "Workspaces"), "พื้นที่ทำงาน (Workspaces)");
  assert.equal(translate("th", "Settings"), "การตั้งค่า");
  assert.equal(translate("th", "Sign out"), "ออกจากระบบ");
  assert.equal(translate("th", "Signing out…"), "กำลังออกจากระบบ…");
});

test("translate interpolates variables correctly in EN and TH", () => {
  const templateEn = "Hello {name}, you have {count} items";
  assert.equal(translate("en", templateEn, { name: "Somchai", count: 5 }), "Hello Somchai, you have 5 items");

  // In Thai dictionary: "{plan} plan" -> "แพ็กเกจ {plan}"
  assert.equal(translate("th", "{plan} plan", { plan: "Pro" }), "แพ็กเกจ Pro");
});

test("storedLang safely returns en in node environment without localStorage", () => {
  // window is undefined in standard Node.js environment
  assert.equal(storedLang(), "en");
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
    assert.ok(TH[key], `Thai dictionary must contain translation for: "${key}"`);
    assert.notEqual(TH[key].trim(), "", `Translation for "${key}" must not be empty`);
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
