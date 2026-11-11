import test from "node:test";
import assert from "node:assert/strict";
import { createSyncQueue } from "../sync-queue";

test("patches run one at a time in order; after a failure, waiting patches are skipped", async () => {
  const sent: string[] = [];
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  const q = createSyncQueue(async (p) => {
    const k = Object.keys(p)[0]!;
    sent.push(k);
    if (k === "a") await gate;
    if (k === "b") throw new Error("network");
  });
  const results = Promise.all([q.enqueue({ a: "1" }), q.enqueue({ b: "1" }), q.enqueue({ c: "1" })]);
  assert.equal(q.size(), 2);
  release();
  assert.deepEqual(await results, ["saved", "failed", "skipped"]);
  assert.deepEqual(sent, ["a", "b"]);
  assert.equal(await q.enqueue({ d: "1" }), "saved");
});
test("an empty patch saves without a request", async () => {
  let calls = 0;
  const q = createSyncQueue(async () => void calls++);
  assert.equal(await q.enqueue({}), "saved");
  assert.equal(calls, 0);
});
