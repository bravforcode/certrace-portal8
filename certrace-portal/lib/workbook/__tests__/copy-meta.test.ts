import test from "node:test";
import assert from "node:assert/strict";
import { copyingMeta } from "../copy-meta";

// A copy first marks its year "syncing". The set-up timer only finishes a syncing year that
// has confirmedAt, so a copy interrupted before "ready" would otherwise stay syncing forever.
test("the syncing meta of a copy carries a confirmedAt, so the timer can finish an interrupted copy", () => {
  const at = "2026-11-11T10:00:00.000Z";
  const meta = copyingMeta(
    2025,
    {
      status: "ready",
      files: [
        { id: "f1", name: "a.xlsx", size: 1, type: "x", description: "" },
      ],
      blank: false,
    },
    at,
  );
  assert.equal(meta.status, "syncing");
  assert.equal(meta.confirmedAt, at);
  assert.equal(meta.copiedFrom, 2025);
  assert.equal(meta.files?.length, 1);
  assert.equal(meta.blank, false);
});

test("a copy of a blank year keeps the blank flag and has no files when the source has none", () => {
  const meta = copyingMeta(
    2024,
    { status: "ready", blank: true },
    "2026-11-11T10:00:00.000Z",
  );
  assert.deepEqual(meta.files, []);
  assert.equal(meta.blank, true);
});
