import test from "node:test";
import assert from "node:assert/strict";
import { countComplete, worstOf } from "../directory";

test("an installation counts as complete only when it has checks and all are done", () => {
  assert.equal(countComplete([{ done: 13, total: 13 }, { done: 2, total: 13 }, { done: 0, total: 0 }]), 1);
  assert.equal(countComplete([]), 0);
});

test("a year is as bad as its worst sheet: missing beats review beats complete beats untouched", () => {
  assert.equal(worstOf([]), "untouched");
  assert.equal(worstOf(["untouched", "complete"]), "complete");
  assert.equal(worstOf(["complete", "review"]), "review");
  assert.equal(worstOf(["review", "missing", "complete"]), "missing");
});
