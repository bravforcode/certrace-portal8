/* Default values for EVERY country — Implementing Regulation (EU) 2025/2621.

   Annex I lists default values per exporting country; a country that is not
   listed (or listed with "–" for a good) takes the "Other countries and
   territories" row, and Annex IV gives the value for a precursor whose country
   of production cannot be identified. The precursor flow reads all three, so
   the data has to answer for every CN code × every country, not just Thailand. */

import { test } from "node:test";
import assert from "node:assert/strict";

const { FULL_CATALOGUE } = await import("../cn-catalogue");
const { COUNTRIES } = await import("../../config");
const { lookupDefault, lookupUnknownOrigin, countryIsListed } = await import(
  "../eu-rates"
);
const { defaultFor } = await import("../precursor-basis");

const needsVariant = (cn: string) =>
  cn === "2523 10 00" || cn === "2523 90 00" ? "A" : undefined;

test("every CN code resolves to a default value for every country on the picker (own row, or 'Other countries')", () => {
  const missing: string[] = [];
  for (const c of COUNTRIES) {
    for (const p of FULL_CATALOGUE) {
      const hit = lookupDefault(p.cnCode, c.code, needsVariant(p.cnCode));
      /* >= 0, not > 0: Annex I itself prints 0 for a few goods (Mali's hydrogen) and the
         table is the law — it is shown as published, not "corrected". */
      if (!hit || !Number.isFinite(hit.rates.y2026) || hit.rates.y2026 < 0)
        missing.push(`${c.code} ${p.cnCode}`);
    }
  }
  assert.deepEqual(
    missing.slice(0, 10),
    [],
    `${missing.length} country × CN pairs have no default value`,
  );
});

test("the mark-up rises 2026 → 2028 in every listed country's row", () => {
  for (const c of COUNTRIES.filter((x) => countryIsListed(x.code)).slice(
    0,
    40,
  )) {
    for (const p of FULL_CATALOGUE.slice(0, 120)) {
      const h = lookupDefault(p.cnCode, c.code, needsVariant(p.cnCode));
      if (!h) continue;
      assert.ok(
        h.rates.y2027 >= h.rates.y2026 - 1e-9 &&
          h.rates.y2028 >= h.rates.y2027 - 1e-9,
        `${c.code} ${p.cnCode}`,
      );
    }
  }
});

test("a country Annex I does not list takes the 'Other countries and territories' row — it is not left without a value", () => {
  const afghanistan = lookupDefault("7208 39 00", "AF")!;
  assert.ok(afghanistan, "Afghanistan is not in Annex I");
  assert.equal(afghanistan.usedOther, true);
  assert.equal(afghanistan.usedCountry, "ZZ");
  assert.equal(
    lookupDefault("7208 39 00", "ZZ")!.rates.y2026,
    afghanistan.rates.y2026,
  );
  // and a listed country is read from its own row
  assert.equal(lookupDefault("7208 39 00", "TH")!.usedOther, false);
});

test("Annex IV: every CN code has a value for a precursor of unidentified origin, and it is at the top of what any country carries", () => {
  const notHighest: string[] = [];
  const none: string[] = [];
  for (const p of FULL_CATALOGUE) {
    const u = lookupUnknownOrigin(p.cnCode);
    if (!u) {
      none.push(p.cnCode);
      continue;
    }
    let max = 0;
    for (const c of COUNTRIES) {
      const h = lookupDefault(p.cnCode, c.code, needsVariant(p.cnCode));
      if (h) max = Math.max(max, h.rates.y2026);
    }
    /* Annex IV is the value of "the third country with the highest emission intensities".
       The Commission's own tables disagree with themselves by up to a few tenths of a
       percent for a handful of stainless codes (7218: Annex IV 9.493, Taiwan's row 9.537),
       so this checks that it is at the top end — within 1 % of the highest country — and
       the figure applied is Annex IV's, as published. */
    if (u.y2026 < max * 0.99)
      notHighest.push(`${p.cnCode}: Annex IV ${u.y2026} < ${max}`);
  }
  assert.deepEqual(none, [], "a CN code with no Annex IV value");
  /* Annex IV and Annex I disagree for a few stainless/alloy codes — e.g. 7222 11: Annex IV
     8.690 base, while one country's row carries a base of 10. The Annex is the law for an
     unidentified origin, so its figure is applied as published; what is pinned here is
     that the disagreement stays the exception (26 of 570 codes today), so a parsing slip
     that dropped or shifted a block of rows would show up as a jump. */
  assert.ok(
    notHighest.length <= 40,
    `${notHighest.length} codes where an ordinary country exceeds Annex IV: ${notHighest.slice(0, 5).join("; ")}`,
  );
});

test("an unknown origin gives the Annex IV figure, never a named country's", () => {
  const unknown = defaultFor("7207 11 16", "", 2026, { unknownOrigin: true })!;
  const named = defaultFor("7207 11 16", "TH", 2026)!;
  assert.equal(unknown.source, "unknown_origin");
  assert.ok(unknown.total >= named.total);
});
