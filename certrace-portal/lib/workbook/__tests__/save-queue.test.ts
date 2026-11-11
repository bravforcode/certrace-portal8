import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CELL_MAX,
  CHUNK,
  acknowledge,
  dropKeys,
  enqueue,
  isRetryable,
  nextBatch,
  pendingCount,
  pendingFor,
  retryDelay,
  type Queue,
} from "../save-queue";

const T = { iid: "inst-1", year: 2026 };
const OTHER = { iid: "inst-1", year: 2025 };

test("enqueue clamps a value to 10,000 characters and turns an empty value into a delete", () => {
  let q: Queue = {};
  q = enqueue(q, T, "a:1:b", "x".repeat(CELL_MAX + 50));
  q = enqueue(q, T, "a:2:b", "");
  assert.equal(pendingFor(q, T)["a:1:b"]?.length, CELL_MAX);
  assert.equal(pendingFor(q, T)["a:2:b"], null);
});

test("a later edit to the same cell replaces the earlier one in the queue", () => {
  let q: Queue = {};
  q = enqueue(q, T, "a:1:b", "first");
  q = enqueue(q, T, "a:1:b", "second");
  assert.deepEqual(pendingFor(q, T), { "a:1:b": "second" });
  assert.equal(pendingCount(q, T), 1);
});

test("pending edits are kept per installation and year", () => {
  let q: Queue = {};
  q = enqueue(q, T, "a:1:b", "this year");
  q = enqueue(q, OTHER, "a:1:b", "last year");
  assert.deepEqual(pendingFor(q, T), { "a:1:b": "this year" });
  assert.deepEqual(pendingFor(q, OTHER), { "a:1:b": "last year" });
  assert.deepEqual(pendingFor(q, { iid: "inst-2", year: 2026 }), {});
});

test("nextBatch takes at most 2,000 cells", () => {
  let q: Queue = {};
  for (let i = 0; i < CHUNK + 10; i++) q = enqueue(q, T, `a:${i}:b`, "v");
  const batch = nextBatch(q, T);
  assert.equal(Object.keys(batch).length, CHUNK);
});

test("acknowledge removes what was sent and keeps a cell typed again after sending", () => {
  let q: Queue = {};
  q = enqueue(q, T, "a:1:b", "sent");
  q = enqueue(q, T, "a:2:b", "also sent");
  const sent = nextBatch(q, T);
  q = enqueue(q, T, "a:1:b", "typed again"); // after the batch left
  q = acknowledge(q, T, sent);
  assert.deepEqual(pendingFor(q, T), { "a:1:b": "typed again" });
});

test("dropKeys removes rejected cells and leaves the rest of the target queued", () => {
  let q: Queue = {};
  q = enqueue(q, T, "a:1:b", "bad");
  q = enqueue(q, T, "a:2:b", "good");
  q = dropKeys(q, T, ["a:1:b"]);
  assert.deepEqual(pendingFor(q, T), { "a:2:b": "good" });
});

test("dropping the last cell removes the target entirely", () => {
  let q: Queue = enqueue({}, T, "a:1:b", "bad");
  q = dropKeys(q, T, ["a:1:b"]);
  assert.equal(pendingCount(q, T), 0);
  assert.equal(Object.keys(q).length, 0);
});

test("only network errors and 5xx responses are retried", () => {
  assert.equal(isRetryable({ status: 0 }), true);
  assert.equal(isRetryable({ status: 503 }), true);
  assert.equal(isRetryable({ status: 422 }), false);
  assert.equal(isRetryable({ status: 413 }), false);
  assert.equal(isRetryable({ status: 404 }), false);
});

test("retry backoff doubles and stops at 30 seconds", () => {
  assert.equal(retryDelay(0), 1_000);
  assert.equal(retryDelay(1), 2_000);
  assert.equal(retryDelay(2), 4_000);
  assert.equal(retryDelay(10), 30_000);
});
