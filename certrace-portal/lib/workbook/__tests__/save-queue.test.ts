import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CELL_MAX,
  CHUNK,
  acknowledge,
  dropKeys,
  enqueue,
  isRetryable,
  isValidationRefusal,
  keepAccount,
  nextBatch,
  pendingCount,
  pendingFor,
  retryDelay,
  targetsWithPending,
  type Queue,
} from "../save-queue";

const T = { accountId: "acct-a", iid: "inst-1", year: 2026 };
const OTHER_YEAR = { accountId: "acct-a", iid: "inst-1", year: 2025 };
const OTHER_ACCOUNT = { accountId: "acct-b", iid: "inst-1", year: 2026 };

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

test("pending edits are kept per account, installation and year", () => {
  let q: Queue = {};
  q = enqueue(q, T, "a:1:b", "this year");
  q = enqueue(q, OTHER_YEAR, "a:1:b", "last year");
  q = enqueue(q, OTHER_ACCOUNT, "a:1:b", "other account");
  assert.deepEqual(pendingFor(q, T), { "a:1:b": "this year" });
  assert.deepEqual(pendingFor(q, OTHER_YEAR), { "a:1:b": "last year" });
  assert.deepEqual(pendingFor(q, OTHER_ACCOUNT), { "a:1:b": "other account" });
  assert.equal(targetsWithPending(q).length, 3);
});

test("nextBatch takes at most 2,000 cells", () => {
  let q: Queue = {};
  for (let i = 0; i < CHUNK + 10; i++) q = enqueue(q, T, `a:${i}:b`, "v");
  assert.equal(Object.keys(nextBatch(q, T)).length, CHUNK);
});

test("acknowledge removes what was sent and keeps a cell typed again after sending", () => {
  let q: Queue = {};
  q = enqueue(q, T, "a:1:b", "sent");
  q = enqueue(q, T, "a:2:b", "also sent");
  const sent = nextBatch(q, T);
  q = enqueue(q, T, "a:1:b", "typed again");
  q = acknowledge(q, T, sent);
  assert.deepEqual(pendingFor(q, T), { "a:1:b": "typed again" });
});

test("dropKeys removes refused cells and leaves the rest of the target queued", () => {
  let q: Queue = {};
  q = enqueue(q, T, "a:1:b", "bad");
  q = enqueue(q, T, "a:2:b", "good");
  q = dropKeys(q, T, ["a:1:b"]);
  assert.deepEqual(pendingFor(q, T), { "a:2:b": "good" });
});

test("dropping the last cell removes the target entirely", () => {
  let q: Queue = enqueue({}, T, "a:1:b", "bad");
  q = dropKeys(q, T, ["a:1:b"]);
  assert.equal(Object.keys(q).length, 0);
});

test("keepAccount discards every target that belongs to another account", () => {
  let q: Queue = {};
  q = enqueue(q, T, "a:1:b", "mine");
  q = enqueue(q, OTHER_ACCOUNT, "a:1:b", "theirs");
  q = keepAccount(q, "acct-b");
  assert.deepEqual(targetsWithPending(q), [OTHER_ACCOUNT]);
  assert.deepEqual(keepAccount(q, null), {});
});

test("only network errors and 5xx responses are retried", () => {
  assert.equal(isRetryable({ status: 0 }), true);
  assert.equal(isRetryable({ status: 503 }), true);
  assert.equal(isRetryable({ status: 422 }), false);
  assert.equal(isRetryable({ status: 401 }), false);
});

test("400, 413 and 422 are validation refusals; 401 and 403 are not", () => {
  assert.equal(isValidationRefusal({ status: 422 }), true);
  assert.equal(isValidationRefusal({ status: 413 }), true);
  assert.equal(isValidationRefusal({ status: 400 }), true);
  assert.equal(isValidationRefusal({ status: 401 }), false);
  assert.equal(isValidationRefusal({ status: 403 }), false);
});

test("retry backoff doubles and stops at 30 seconds", () => {
  assert.equal(retryDelay(0), 1_000);
  assert.equal(retryDelay(1), 2_000);
  assert.equal(retryDelay(2), 4_000);
  assert.equal(retryDelay(10), 30_000);
});
