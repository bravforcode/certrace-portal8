import test from "node:test";
import assert from "node:assert/strict";
import { ADDITIONAL_ROUTES, PRODUCTION_ROUTES } from "../../workspace";
import { FULL_CATALOGUE } from "../cn-catalogue";
import { ROUTE_LETTER_LABEL, routeOptionsFor } from "../routes";
import { translate } from "../../i18n";

const th = (s: string) => translate("th", s);

test("every production route reads in Thai — name, standard name and the three sentences it carries", () => {
  for (const r of [...PRODUCTION_ROUTES, ...ADDITIONAL_ROUTES]) {
    for (const key of [
      "label",
      "standardName",
      "hint",
      "precursors",
      "dominantSource",
    ] as const) {
      const text = r[key];
      if (!text) continue;
      assert.notEqual(th(text), text, `${r.id}.${key}: no Thai for "${text}"`);
    }
  }
});

test("the route letters have Thai names", () => {
  for (const label of Object.values(ROUTE_LETTER_LABEL))
    assert.notEqual(th(label), label, `no Thai for "${label}"`);
});

test("the sentences written for rolled and coated steel are translated for every route letter", () => {
  const rolled = FULL_CATALOGUE.find((p) => p.cnCode === "7208 37 00")!;
  const options = routeOptionsFor(rolled, { year: 2026 });
  assert.ok(options.length > 0);
  for (const o of options) {
    for (const text of [o.hint, o.precursors, o.dominantSource])
      assert.notEqual(th(text), text, `no Thai for "${text}"`);
  }
});
