import test from "node:test";
import assert from "node:assert/strict";
import { FULL_CATALOGUE, LEGACY_ONLY, headingInfo } from "../cn-catalogue";
import { CN_DESC_TH } from "../data/cn-catalogue-th";
import { translate } from "../../i18n";

const THAI = /[฀-๿]/;
/* Latin words that may stay in a Thai explanation: units, the standard the text cites, and the names of things that are English everywhere. */
const ALLOWED_LATIN = new Set(["MPa", "CN", "Annex"]);

test("every CN code in scope has a Thai explanation", () => {
  for (const p of FULL_CATALOGUE) {
    const th = CN_DESC_TH[p.cnCode];
    assert.ok(th && THAI.test(th), `${p.cnCode} has no Thai explanation`);
  }
});

test("Thai explanations are Thai, not English with a few Thai words in it", () => {
  for (const [cn, th] of Object.entries(CN_DESC_TH)) {
    const latin = (th.match(/[A-Za-z]{4,}/g) ?? []).filter(
      (w) => !ALLOWED_LATIN.has(w),
    );
    assert.deepEqual(latin, [], `${cn}: ${th}`);
    assert.ok(
      !/ {2}|\.\.|, ,|\( | \)/.test(th),
      `${cn} has stray spacing or punctuation: ${th}`,
    );
    assert.ok(
      !th.includes("…") || th.includes("[") || th.includes("("),
      `${cn} left an elision in the text: ${th}`,
    );
  }
});

test("Thai explanations keep the numbers of the English wording", () => {
  const nums = (s: string) =>
    (s.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(",", ".")).sort();
  const sample = FULL_CATALOGUE.find((p) => p.cnCode === "7208 37 00")!;
  const th = CN_DESC_TH[sample.cnCode];
  // 600 mm, 4.75 mm and 10 mm all appear in "7208 37 00": a Thai line that dropped one would describe a different good.
  for (const n of ["600", "4.75", "10"])
    assert.ok(nums(th).includes(n), `${n} missing from: ${th}`);
});

test("product names, headings and sub-groups are translated", () => {
  const names = new Set<string>();
  for (const p of [...FULL_CATALOGUE, ...LEGACY_ONLY]) {
    names.add(p.name);
    names.add(p.group);
  }
  for (const p of FULL_CATALOGUE)
    names.add(headingInfo(p.heading)?.title ?? p.headingTitle);
  for (const name of names) {
    assert.notEqual(translate("th", name), name, `no Thai for "${name}"`);
  }
});
