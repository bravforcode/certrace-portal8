import test from "node:test";
import assert from "node:assert/strict";
import { stageDots } from "../../api/preverifications";

// Red = ready to start, yellow = in progress, green = completed. The customer reads the three
// dots as "what is left before the report", so each one must turn green only when its stage is done.

const req = (...states: string[]) => states.map((state) => ({ state }));
const ALL_DONE = req("complete", "complete");

test("nothing filled and nothing sent: every stage is ready to start", () => {
  assert.deepEqual(stageDots(req("missing", "missing"), "incomplete", false), {
    complete: "ready",
    review: "ready",
    reporting: "ready",
  });
});

test("one requirement partly filled turns Complete yellow, though none is finished yet", () => {
  // Readiness counts only finished requirements (0% here), but the customer has started.
  const d = stageDots(req("in-progress", "missing"), "incomplete", false);
  assert.equal(d.complete, "progress");
  assert.equal(d.review, "ready");
});

test("Complete turns green only when every requirement is complete", () => {
  assert.equal(
    stageDots(req("complete", "in-progress"), "ready", false).complete,
    "progress",
  );
  assert.equal(stageDots(ALL_DONE, "ready", false).complete, "done");
  assert.equal(stageDots([], "incomplete", false).complete, "ready");
});

test("every review state between sending and approval reads in progress", () => {
  for (const s of [
    "flagged",
    "in_review",
    "changes_requested",
    "stale",
  ] as const)
    assert.equal(stageDots(ALL_DONE, s, false).review, "progress", s);
});

test("reporting waits for approval, then for the declaration", () => {
  // A declaration made before Certrace approved the data does not complete the reporting stage.
  assert.equal(stageDots(ALL_DONE, "in_review", true).reporting, "ready");
  assert.equal(stageDots(ALL_DONE, "approved", false).reporting, "progress");
  assert.deepEqual(stageDots(ALL_DONE, "approved", true), {
    complete: "done",
    review: "done",
    reporting: "done",
  });
});
