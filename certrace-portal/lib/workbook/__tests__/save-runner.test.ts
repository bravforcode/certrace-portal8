import { test } from "node:test";
import assert from "node:assert/strict";
import { SaveRunner } from "../save-runner";
import { pendingFor, type Target } from "../save-queue";

/* A fake clock: timers run when advance() passes their time. The patch is a
   scripted function, so each test decides what the server answers. */
function harness(account: string | null = "acct-a") {
  let now = 0;
  let seq = 0;
  const timers: { id: number; at: number; fn: () => void }[] = [];
  const calls: { t: Target; cells: Record<string, string | null> }[] = [];
  const notes: string[] = [];
  let answer: (t: Target, cells: Record<string, string | null>) => Promise<unknown> = async () => ({ ok: true });
  let who = account;
  const runner = new SaveRunner<unknown>({
    patch: (t, cells) => {
      calls.push({ t, cells });
      return answer(t, cells);
    },
    onSaved: () => {},
    notify: (m) => notes.push(m),
    account: () => who,
    now: () => now,
    setTimer: (fn, ms) => {
      const id = ++seq;
      timers.push({ id, at: now + ms, fn });
      return id;
    },
    clearTimer: (h) => {
      const i = timers.findIndex((x) => x.id === h);
      if (i >= 0) timers.splice(i, 1);
    },
    delayMs: 0,
  });
  return {
    runner,
    calls,
    notes,
    timers,
    setAnswer: (fn: typeof answer) => (answer = fn),
    setWho: (w: string | null) => (who = w),
    advance(ms: number) {
      now += ms;
      for (;;) {
        const due = timers.filter((x) => x.at <= now).sort((a, b) => a.at - b.at)[0];
        if (!due) break;
        timers.splice(timers.indexOf(due), 1);
        due.fn();
      }
    },
  };
}

/** Let promise callbacks run. */
const settle = () => new Promise((r) => setImmediate(r));
const T: Target = { accountId: "acct-a", iid: "inst", year: 2026 };
const T2: Target = { accountId: "acct-a", iid: "inst", year: 2025 };

test("single in-flight: a second flush while a batch is out sends nothing new", async () => {
  const h = harness();
  let release!: () => void;
  h.setAnswer(() => new Promise((r) => (release = () => r({ ok: true }))));
  h.runner.enqueue(T, "a:1:b", "one");
  h.runner.enqueue(T2, "a:1:b", "two");
  h.runner.flush();
  h.runner.flush();
  assert.equal(h.calls.length, 1);
  release();
  await settle();
  assert.equal(h.calls.length, 2, "the next target goes out only after the first answer");
});

test("a network or 5xx failure is retried with backoff, not dropped", async () => {
  const h = harness();
  let fails = 2;
  h.setAnswer(async () => {
    if (fails-- > 0) throw { status: 503, message: "down" };
    return { ok: true };
  });
  h.runner.enqueue(T, "a:1:b", "keep me");
  h.runner.flush();
  await settle();
  assert.equal(h.calls.length, 1);
  h.advance(999);
  assert.equal(h.calls.length, 1, "first retry waits 1 s");
  h.advance(1);
  await settle();
  assert.equal(h.calls.length, 2);
  h.advance(2_000);
  await settle();
  assert.equal(h.calls.length, 3, "second retry waits 2 s");
  assert.deepEqual(pendingFor(h.runner.snapshot(), T), {}, "the cell is acknowledged once the server takes it");
  assert.equal(h.notes.length, 0);
});

test("401 holds the queue without dropping it, and resumes when the same account is back", async () => {
  const h = harness();
  h.setAnswer(async () => {
    throw { status: 401, message: "session ended" };
  });
  h.runner.enqueue(T, "a:1:b", "typed");
  h.runner.flush();
  await settle();
  assert.equal(h.calls.length, 1);
  h.advance(60_000);
  await settle();
  assert.equal(h.calls.length >= 1, true);
  const sentBefore = h.calls.length;
  assert.deepEqual(pendingFor(h.runner.snapshot(), T), { "a:1:b": "typed" }, "the edit is still queued");
  h.setAnswer(async () => ({ ok: true }));
  h.runner.onAccountChange("acct-a");
  await settle();
  assert.equal(h.calls.length > sentBefore, true, "resumes on sign-in again");
  assert.deepEqual(pendingFor(h.runner.snapshot(), T), {});
});

test("422 splits the batch and drops only the cell that fails alone, with one notice", async () => {
  const h = harness();
  h.setAnswer(async (_t, cells) => {
    if ("a:2:b" in cells) throw { status: 422, message: "bad value" };
    return { ok: true };
  });
  h.runner.enqueue(T, "a:1:b", "fine");
  h.runner.enqueue(T, "a:2:b", "bad");
  h.runner.enqueue(T, "a:3:b", "fine too");
  h.runner.enqueue(T, "a:4:b", "fine four");
  h.runner.flush();
  for (let i = 0; i < 20; i++) await settle();
  assert.deepEqual(pendingFor(h.runner.snapshot(), T), {}, "every good cell was saved, the bad one dropped");
  assert.equal(h.notes.length, 1, "one notice for the whole batch");
  assert.ok(h.calls.every((c) => Object.keys(c.cells).length >= 1));
});

test("a failing target does not starve the other target", async () => {
  const h = harness();
  h.setAnswer(async (t) => {
    if (t.year === 2026) throw { status: 503, message: "down" };
    return { ok: true };
  });
  h.runner.enqueue(T, "a:1:b", "stuck");
  h.runner.enqueue(T2, "a:1:b", "free");
  h.runner.flush();
  for (let i = 0; i < 5; i++) await settle();
  assert.deepEqual(pendingFor(h.runner.snapshot(), T2), {}, "the other year was saved while this one waits");
  assert.deepEqual(pendingFor(h.runner.snapshot(), T), { "a:1:b": "stuck" });
});

test("changing account drops the previous account's edits and tells the reader once", () => {
  const h = harness();
  h.runner.enqueue(T, "a:1:b", "mine");
  h.runner.onAccountChange("acct-b");
  assert.deepEqual(h.runner.snapshot(), {});
  assert.equal(h.notes.length, 1);
});

test("an edit is never sent under another account", async () => {
  const h = harness("acct-b");
  h.runner.enqueue(T, "a:1:b", "mine");
  h.runner.flush();
  await settle();
  assert.equal(h.calls.length, 0);
  assert.deepEqual(pendingFor(h.runner.snapshot(), T), { "a:1:b": "mine" });
});

test("429 is retried with backoff, not dropped", async () => {
  const h = harness();
  let calls = 0;
  h.setAnswer(async () => {
    if (calls++ === 0) throw { status: 429, message: "slow down" };
    return { ok: true };
  });
  h.runner.enqueue(T, "a:1:b", "keep");
  h.runner.flush();
  await settle();
  h.advance(999);
  assert.equal(h.calls.length, 1);
  h.advance(1);
  await settle();
  assert.equal(h.calls.length, 2);
  assert.deepEqual(pendingFor(h.runner.snapshot(), T), {});
  assert.equal(h.notes.length, 0);
});

test("a Retry-After in seconds is honoured instead of the default backoff", async () => {
  const h = harness();
  let calls = 0;
  h.setAnswer(async () => {
    if (calls++ === 0) throw { status: 429, message: "slow down", retryAfter: 5 };
    return { ok: true };
  });
  h.runner.enqueue(T, "a:1:b", "keep");
  h.runner.flush();
  await settle();
  h.advance(4_999);
  assert.equal(h.calls.length, 1);
  h.advance(1);
  await settle();
  assert.equal(h.calls.length, 2);
});

test("a 404 on one target does not stop the other target", async () => {
  const h = harness();
  h.setAnswer(async (t) => {
    if (t.year === 2026) throw { status: 404, message: "gone" };
    return { ok: true };
  });
  h.runner.enqueue(T, "a:1:b", "missing");
  h.runner.enqueue(T2, "a:1:b", "fine");
  h.runner.flush();
  for (let i = 0; i < 5; i++) await settle();
  assert.deepEqual(pendingFor(h.runner.snapshot(), T2), {}, "the other year was saved");
  assert.deepEqual(pendingFor(h.runner.snapshot(), T), { "a:1:b": "missing" }, "the failing target waits");
});

test("a target refused with another 4xx is dropped after the attempt cap, with one notice", async () => {
  const h = harness();
  h.setAnswer(async () => {
    throw { status: 409, message: "conflict" };
  });
  h.runner.enqueue(T, "a:1:b", "conflict");
  h.runner.flush();
  for (let i = 0; i < 12; i++) {
    await settle();
    h.advance(30_000);
  }
  await settle();
  assert.deepEqual(pendingFor(h.runner.snapshot(), T), {});
  assert.equal(h.notes.length, 1);
});

// Diagram patches (enqueueCells) share the typed-edit path: one ordered queue, one batch in flight.
test("a diagram patch queued while a typed batch is in flight is sent after it and wins the cell", async () => {
  const h = harness();
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  h.setAnswer(async (_t, cells) => {
    if (cells.X === "typed") await gate;
    return { ok: true };
  });
  h.runner.enqueue(T, "X", "typed");
  h.advance(0); // the debounce fires; the typed batch is now in flight
  const diagram = h.runner.enqueueCells(T, { X: "diagram" });
  release();
  assert.deepEqual(await diagram, { ok: true });
  assert.deepEqual(
    h.calls.map((c) => c.cells),
    [{ X: "typed" }, { X: "diagram" }],
  );
  assert.deepEqual(pendingFor(h.runner.snapshot(), T), {});
});

test("a change of account drops the diagram patch of the previous account", async () => {
  const h = harness("acct-a");
  h.setAnswer(() => new Promise(() => {})); // never answers: the patch stays in flight
  const pending = h.runner.enqueueCells(T, { X: "diagram" });
  h.setWho("acct-b");
  h.runner.onAccountChange("acct-b");
  assert.deepEqual(await pending, { ok: false });
  assert.deepEqual(pendingFor(h.runner.snapshot(), T), {});
});

test("diagram patches for two years share one runner: one batch at a time, both resolve", async () => {
  const h = harness();
  let inFlight = 0;
  let maxInFlight = 0;
  h.setAnswer(async () => {
    inFlight++;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await settle();
    inFlight--;
    return { ok: true };
  });
  const a = h.runner.enqueueCells(T, { X: "1" });
  const b = h.runner.enqueueCells(T2, { X: "2" });
  assert.deepEqual([await a, await b], [{ ok: true }, { ok: true }]);
  assert.equal(maxInFlight, 1);
  assert.equal(h.calls.length, 2);
});

test("a diagram cell the server refuses resolves { ok: false } and leaves nothing pending", async () => {
  const h = harness();
  h.setAnswer(async () => {
    throw { status: 422, message: "bad value" };
  });
  assert.deepEqual(await h.runner.enqueueCells(T, { X: "bad" }), { ok: false });
  assert.deepEqual(pendingFor(h.runner.snapshot(), T), {});
});

test("a network failure fails the diagram patch at once and removes its cells; typed cells keep retrying", async () => {
  const h = harness();
  let calls = 0;
  h.setAnswer(async () => {
    calls++;
    if (calls === 1) throw { status: 0, message: "offline" };
    return { ok: true };
  });
  h.runner.enqueue(T, "Y", "typed");
  assert.deepEqual(await h.runner.enqueueCells(T, { X: "diagram" }), { ok: false });
  assert.deepEqual(Object.keys(pendingFor(h.runner.snapshot(), T)), ["Y"]);
  h.advance(1000); // the typed cell's retry
  await settle();
  assert.deepEqual(pendingFor(h.runner.snapshot(), T), {});
  assert.deepEqual(h.calls[1].cells, { Y: "typed" });
});
