/* The save runner: sends queued workbook cells one batch at a time, never under
   another account, and never drops an edit for a network, 5xx or session
   problem. All I/O is injected (patch, clock, timers, account), so the rules
   are unit-tested in __tests__/save-runner.test.ts.

   Rules:
   - one batch in flight at any time
   - targets are served in rotation; a target waiting on backoff does not block the others
   - network and 5xx: keep the cells, retry with backoff (1 s, 2 s ... 30 s)
   - 400 / 413 / 422: split the batch in halves until the bad cell is alone, drop only that cell, one notice
   - 401 / 403 / anything else: hold everything, retry after 30 s or when the same account signs in again
   - a change of account drops the queued edits of the previous account (one notice)
   - diagram patches (enqueueCells) use the same queue; a waiter resolves { ok: false } when its
     cells are refused, or fail on a transient error, and those cells are removed at once;
     typed cells of the same target keep their own retry rules */

import {
  acknowledge,
  dropKeys,
  enqueue,
  enqueueMany,
  isValidationRefusal,
  keepAccount,
  nextBatch,
  pendingFor,
  retryDelay,
  targetKey,
  type Cells,
  type Queue,
  type Target,
} from "./save-queue";

const HOLD_MS = 30_000;
/** A target refused with a non-transient 4xx this many times in a row is dropped. */
const MAX_REFUSALS = 5;

export type RunnerDeps<S> = {
  patch: (t: Target, cells: Cells) => Promise<S>;
  onSaved: (t: Target, saved: S) => void;
  notify: (message: string, detail?: string) => void;
  /** The signed-in account id, or null when signed out. */
  account: () => string | null;
  now: () => number;
  setTimer: (fn: () => void, ms: number) => unknown;
  clearTimer: (handle: unknown) => void;
  /** Debounce before a typed edit is sent. */
  delayMs?: number;
};

type Split = { key: string; keys: string[] };

/** A caller waiting for cells to be saved. `cells` null means "until nothing is pending for the target". */
type Waiter = { target: Target; key: string; cells: string[] | null; ok: boolean; resolve: (r: { ok: boolean }) => void };

export class SaveRunner<S> {
  private q: Queue = {};
  private sending = false;
  private held = false;
  private splits: Split[] = [];
  private retries = new Map<string, { attempt: number; at: number }>();
  private last: string | null = null;
  private noticed = false;
  private timers: Partial<Record<"debounce" | "hold" | "retry", { handle: unknown; at: number }>> = {};
  private listeners = new Set<() => void>();
  private waiters: Waiter[] = [];
  private d: RunnerDeps<S>;

  constructor(deps: RunnerDeps<S>) {
    this.d = deps;
  }

  snapshot(): Queue {
    return this.q;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  enqueue(t: Target, cellKey: string, value: string): void {
    this.setQueue(enqueue(this.q, t, cellKey, value));
    this.arm("debounce", this.d.now() + (this.d.delayMs ?? 600), () => this.pump());
  }

  /**
   * Queue cells for a target (a diagram patch) on the same path as typed edits, and send them now.
   * Resolves { ok: true } once the cells are saved, or { ok: false } when the server refused them or
   * a transient failure gave up on them; those cells are then removed, so nothing stays on screen.
   */
  enqueueCells(t: Target, cells: Record<string, string | null>): Promise<{ ok: boolean }> {
    this.setQueue(enqueueMany(this.q, t, cells));
    const done = this.wait(t, Object.keys(cells));
    this.pump();
    return done;
  }

  /** Resolves once no queued or in-flight cells remain for the target. */
  idle(t: Target): Promise<{ ok: boolean }> {
    return this.wait(t, null);
  }

  /** Send now (poll, page leave, explicit save). */
  flush(): void {
    this.disarm("debounce");
    this.pump();
  }

  /** The signed-in account changed. A different account drops the previous account's edits; the same account resumes. */
  onAccountChange(account: string | null): void {
    if (account === null) return; // signed out: edits wait for this account, nothing is sent
    const kept = keepAccount(this.q, account);
    const dropped = Object.keys(kept).length !== Object.keys(this.q).length;
    for (const w of this.waiters) if (!(w.key in kept)) w.ok = false;
    this.setQueue(kept);
    this.splits = [];
    this.retries.clear();
    this.held = false;
    this.disarm("hold");
    this.disarm("retry");
    if (dropped) this.d.notify("Unsaved changes from the previous account were discarded");
    this.pump();
  }

  private setQueue(q: Queue) {
    this.q = q;
    if (Object.keys(q).length === 0) this.noticed = false;
    this.settle();
    this.listeners.forEach((l) => l());
  }

  private wait(t: Target, cells: string[] | null): Promise<{ ok: boolean }> {
    return new Promise((resolve) => {
      this.waiters.push({ target: t, key: targetKey(t), cells, ok: true, resolve });
      this.settle();
    });
  }

  /** Resolve every waiter whose cells have left the queue (saved, dropped or replaced). */
  private settle() {
    this.waiters = this.waiters.filter((w) => {
      const pending = pendingFor(this.q, w.target);
      const left = w.cells === null ? Object.keys(pending).length : w.cells.filter((k) => k in pending).length;
      if (left) return true;
      w.resolve({ ok: w.ok });
      return false;
    });
  }

  /**
   * A batch for `key` failed for good (or was refused). Waiters whose cells were in it resolve { ok: false }
   * and their cells leave the queue. Other cells of the target keep their own retry or refusal rules.
   */
  private failWaiters(key: string, batch: string[]) {
    const hit = this.waiters.filter((w) => w.key === key && w.cells !== null && w.cells.some((k) => batch.includes(k)));
    if (!hit.length) return;
    let q = this.q;
    for (const w of hit) {
      w.ok = false;
      q = dropKeys(q, w.target, w.cells!);
    }
    this.setQueue(q);
  }

  private arm(name: "debounce" | "hold" | "retry", at: number, fn: () => void) {
    const cur = this.timers[name];
    if (cur && name !== "debounce" && cur.at <= at) return; // keep the earlier wake-up
    if (cur) this.d.clearTimer(cur.handle);
    const handle = this.d.setTimer(() => {
      delete this.timers[name];
      fn();
    }, Math.max(0, at - this.d.now()));
    this.timers[name] = { handle, at };
  }

  private disarm(name: "debounce" | "hold" | "retry") {
    const cur = this.timers[name];
    if (cur) this.d.clearTimer(cur.handle);
    delete this.timers[name];
  }

  private pump(): void {
    if (this.sending || this.held) return;
    const acct = this.d.account();
    if (acct === null) return;

    // Bisect work first: halves of a refused batch, read from the queue as it is now.
    while (this.splits.length) {
      const s = this.splits.shift()!;
      const e = this.q[s.key];
      if (!e || e.target.accountId !== acct) continue;
      const cells: Cells = {};
      for (const k of s.keys) if (k in e.cells) cells[k] = e.cells[k];
      if (Object.keys(cells).length) return this.send(e.target, cells, s.key);
    }

    const now = this.d.now();
    const all = Object.keys(this.q);
    const mine = all.filter((k) => this.q[k].target.accountId === acct && Object.keys(this.q[k].cells).length > 0);
    const ready = mine.filter((k) => (this.retries.get(k)?.at ?? 0) <= now);
    if (!ready.length) {
      const waiting = mine.map((k) => this.retries.get(k)?.at).filter((x): x is number => x !== undefined);
      if (waiting.length) this.arm("retry", Math.min(...waiting), () => this.pump());
      return;
    }

    // Rotation: the next ready target after the one sent last.
    const start = this.last === null ? -1 : all.indexOf(this.last);
    let key = ready[0];
    for (let i = 1; i <= all.length; i++) {
      const k = all[(start + i + all.length) % all.length];
      if (ready.includes(k)) {
        key = k;
        break;
      }
    }
    this.last = key;
    const e = this.q[key];
    this.send(e.target, nextBatch(this.q, e.target), key);
  }

  private send(t: Target, cells: Cells, key: string): void {
    this.sending = true;
    new Promise<S>((resolve) => resolve(this.d.patch(t, cells))).then(
      (saved) => {
        this.sending = false;
        this.retries.delete(key);
        this.setQueue(acknowledge(this.q, t, cells));
        this.d.onSaved(t, saved);
        this.pump();
      },
      (e: { status?: number; message?: string }) => this.failed(t, cells, key, e),
    );
  }

  private failed(t: Target, cells: Cells, key: string, e: { status?: number; message?: string; retryAfter?: number }): void {
    this.sending = false;
    const status = e.status ?? 0;
    const keys = Object.keys(cells);

    // Session-wide: the session or trial handling shows the reason. Hold everything and try again later.
    if (status === 401 || status === 403) {
      this.held = true;
      this.arm("hold", this.d.now() + HOLD_MS, () => {
        this.held = false;
        this.pump();
      });
      this.listeners.forEach((l) => l());
      return;
    }

    if (!isValidationRefusal({ status })) {
      // Network, 5xx, 429 and other 4xx each back off per target; the other targets keep going.
      const attempt = this.retries.get(key)?.attempt ?? 0;
      const transient = status === 0 || status === 429 || status >= 500;
      this.splits = this.splits.filter((s) => s.key !== key);
      if (transient) this.failWaiters(key, keys);
      if (!transient && attempt + 1 >= MAX_REFUSALS) {
        this.retries.delete(key);
        const dropped = Object.keys(pendingFor(this.q, t));
        this.failWaiters(key, dropped);
        this.setQueue(dropKeys(this.q, t, dropped));
        if (!this.noticed) {
          this.noticed = true;
          this.d.notify("Some changes were refused and not saved", e.message);
        }
        this.pump();
        return;
      }
      const wait = e.retryAfter && e.retryAfter > 0 ? e.retryAfter * 1000 : retryDelay(attempt);
      this.retries.set(key, { attempt: attempt + 1, at: this.d.now() + wait });
      this.pump();
      return;
    }

    if (isValidationRefusal({ status })) {
      if (keys.length > 1) {
        const mid = Math.ceil(keys.length / 2);
        this.splits.unshift({ key, keys: keys.slice(0, mid) }, { key, keys: keys.slice(mid) });
        this.pump();
        return;
      }
      this.failWaiters(key, keys);
      this.setQueue(dropKeys(this.q, t, keys));
      if (!this.noticed) {
        this.noticed = true;
        this.d.notify("Some changes were refused and not saved", e.message);
      }
      this.pump();
      return;
    }
  }
}
