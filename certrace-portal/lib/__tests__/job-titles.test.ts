/* The one "Other" that is not on a CBAM form, and matters anyway.

   The job title reaches a verifier twice: as the authorised representative on
   the installation record, and as the "requested by" line on every Smart Link
   the portal sends. Both call sites used to write `jobTitleOther || "Other"`,
   so choosing Other and typing nothing stored the literal word "Other" as
   somebody's role. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { JOB_TITLES, jobTitleIncomplete, jobTitleValue } from "../job-titles";

test("a listed title never asks for a description", () => {
  assert.equal(jobTitleIncomplete(JOB_TITLES[0], ""), false);
  assert.equal(jobTitleValue(JOB_TITLES[0], ""), JOB_TITLES[0]);
});

test('"other" with an empty box is incomplete', () => {
  assert.equal(jobTitleIncomplete("other", ""), true);
  assert.equal(
    jobTitleIncomplete("other", "   "),
    true,
    "whitespace is not an answer",
  );
});

test("filling the box clears it, and what is stored is what they typed", () => {
  assert.equal(jobTitleIncomplete("other", "Regional Trade Manager"), false);
  assert.equal(
    jobTitleValue("other", "  Regional Trade Manager  "),
    "Regional Trade Manager",
  );
});

test("the literal word Other is never what gets stored", () => {
  // The old fallback. Gating on `jobTitleIncomplete` is what stops it being
  // reachable; this pins that the value helper has no such fallback of its own.
  assert.equal(jobTitleValue("other", ""), "");
});
