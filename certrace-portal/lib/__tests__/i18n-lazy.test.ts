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

// The merged chunk must keep the old precedence: TH_POLISH, spread last, wins over every earlier part.
test("the Thai chunk keeps TH_POLISH as the final word", async () => {
  const { TH_POLISH } = await import("../i18n-th-polish");
  const [key, value] = Object.entries(TH_POLISH)[0]!;
  assert.equal(TH_ALL[key], value);
});
