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
test("several patches waiting behind a failure are all skipped, never sent", async () => {
  const sent: string[] = [];
  const q = createSyncQueue(async (p) => {
    const k = Object.keys(p)[0]!;
    sent.push(k);
    if (k === "a") throw new Error("network");
  });
  const results = await Promise.all([q.enqueue({ a: "1" }), q.enqueue({ b: "1" }), q.enqueue({ c: "1" })]);
  assert.deepEqual(results, ["failed", "skipped", "skipped"]);
  assert.deepEqual(sent, ["a"]);
  assert.equal(q.size(), 0);
});

test("a synchronous throw from send counts as a failure and skips the waiting patches", async () => {
  const sent: string[] = [];
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  const q = createSyncQueue((p) => {
    const k = Object.keys(p)[0]!;
    sent.push(k);
    if (k === "x") return gate; // holds the queue so the next jobs wait
    if (k === "b") throw new Error("boom"); // not a rejected promise
    return Promise.resolve();
  });
  const results = Promise.all([q.enqueue({ x: "1" }), q.enqueue({ b: "1" }), q.enqueue({ c: "1" })]);
  release();
  assert.deepEqual(await results, ["saved", "failed", "skipped"]);
  assert.deepEqual(sent, ["x", "b"]);
});

test("a job-typed queue treats a job with an empty patch as saved without a send", async () => {
  let calls = 0;
  const q = createSyncQueue<{ patch: Record<string, string> }>(
    async () => void calls++,
    (job) => Object.keys(job.patch).length === 0,
  );
  assert.equal(await q.enqueue({ patch: {} }), "saved");
  assert.equal(calls, 0);
});

test("an empty patch saves without a request", async () => {
  let calls = 0;
  const q = createSyncQueue(async () => void calls++);
  assert.equal(await q.enqueue({}), "saved");
  assert.equal(calls, 0);
});

// The queue is shared by every installation and year. A failure on one target must not
// skip a patch that was queued for a different target.
test("after a failure, only waiting jobs for the same target are skipped", async () => {
  type J = { target: string; patch: Record<string, string> };
  const sent: string[] = [];
  const q = createSyncQueue<J>(
    async (job) => {
      sent.push(job.patch.k!);
      if (job.patch.k === "a1") throw new Error("network");
    },
    (job) => Object.keys(job.patch).length === 0,
    (x, y) => x.target === y.target,
  );
  const results = await Promise.all([
    q.enqueue({ target: "inst-1:2026", patch: { k: "a1" } }),
    q.enqueue({ target: "inst-1:2026", patch: { k: "a2" } }),
    q.enqueue({ target: "inst-2:2026", patch: { k: "b1" } }),
  ]);
  assert.deepEqual(results, ["failed", "skipped", "saved"]);
  assert.deepEqual(sent, ["a1", "b1"]);
});
