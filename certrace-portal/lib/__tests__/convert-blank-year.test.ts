/* ════════════════════════════════════════════════════════════
   BLANK YEAR — the year Convert has not started, which the Cera badge reads as 0

   Uses the pure rule exported from use-convert-context; no React render, so the test runs in plain node.
   ════════════════════════════════════════════════════════════ */

import { test } from "node:test";
import assert from "node:assert/strict";
import { isBlankYear } from "../convert/blank-year";

test("a year with no answers at all is blank, so the badge does not list every required field as missing", () => {
  // Why: an unstarted year has an empty store; treating it as "everything missing" would show the user a false backlog before they have begun.
  assert.equal(isBlankYear({}, undefined), true);
  assert.equal(isBlankYear(null, undefined), true);
  assert.equal(isBlankYear(undefined, { blank: false }), true);
});

test("a year the store marks blank stays blank even if some cells already hold values", () => {
  // Why: the blank mark is the store's own statement that the year is not started; the badge must follow it and show 0.
  assert.equal(isBlankYear({ a1: "x" }, { blank: true }), true);
});

test("a started year with answers is not blank, so its missing items are counted", () => {
  // Why: once the user has answered something the year is in progress, and the badge must report what is still open.
  assert.equal(isBlankYear({ a1: "x" }, { blank: false }), false);
  assert.equal(isBlankYear({ a1: "x" }, undefined), false);
});
