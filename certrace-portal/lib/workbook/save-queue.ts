/* Pure queue of typed cells waiting to reach the server workbook. One queue per
   target (account + installation + year), so a switch of year, installation or
   account never drops or re-routes an unsaved edit. The runner in save-runner.ts
   sends one batch at a time; these functions only shape the data. */

/** Backend limit: a cell value is at most 10,000 characters (model.ts). */
export const CELL_MAX = 10_000;
/** Backend limit: at most 2,000 cells in one patch. */
export const CHUNK = 2_000;

export type Target = { accountId: string | null; iid: string; year: number };
export type Cells = Record<string, string | null>;
type Entry = { target: Target; cells: Cells };
export type Queue = Record<string, Entry>;

export const targetKey = (t: Target) =>
  `${t.accountId ?? ""}|${t.iid}|${t.year}`;

/** Queue a typed value. An empty value queues a delete (null); long values are clamped. */
export function enqueue(
  q: Queue,
  t: Target,
  cellKey: string,
  value: string,
): Queue {
  const v: string | null = value === "" ? null : value.slice(0, CELL_MAX);
  const k = targetKey(t);
  return {
    ...q,
    [k]: { target: t, cells: { ...pendingFor(q, t), [cellKey]: v } },
  };
}

/** Queue several cells at once (a diagram patch). Same clamping as a typed edit; null deletes. */
export function enqueueMany(
  q: Queue,
  t: Target,
  cells: Record<string, string | null>,
): Queue {
  if (!Object.keys(cells).length) return q;
  const next: Cells = { ...pendingFor(q, t) };
  for (const [k, v] of Object.entries(cells))
    next[k] = v === null || v === "" ? null : v.slice(0, CELL_MAX);
  return { ...q, [targetKey(t)]: { target: t, cells: next } };
}

export function pendingFor(q: Queue, t: Target): Cells {
  return q[targetKey(t)]?.cells ?? {};
}

export function pendingCount(q: Queue, t: Target): number {
  return Object.keys(pendingFor(q, t)).length;
}

/** Targets that still have edits waiting, in the order they were first queued. */
export function targetsWithPending(q: Queue): Target[] {
  return Object.values(q)
    .filter((e) => Object.keys(e.cells).length > 0)
    .map((e) => e.target);
}

/** The next patch for a target: at most CHUNK cells. */
export function nextBatch(q: Queue, t: Target): Cells {
  return Object.fromEntries(Object.entries(pendingFor(q, t)).slice(0, CHUNK));
}

function withTarget(q: Queue, t: Target, cells: Cells): Queue {
  const out = { ...q };
  if (Object.keys(cells).length) out[targetKey(t)] = { target: t, cells };
  else delete out[targetKey(t)];
  return out;
}

/** After the server confirms `sent`, drop those cells, unless the reader typed a new value meanwhile. */
export function acknowledge(q: Queue, t: Target, sent: Cells): Queue {
  const rest = { ...pendingFor(q, t) };
  for (const [k, v] of Object.entries(sent)) if (rest[k] === v) delete rest[k];
  return withTarget(q, t, rest);
}

/** Drop cells the server refused; the rest of the target stays queued. */
export function dropKeys(q: Queue, t: Target, keys: string[]): Queue {
  const rest = { ...pendingFor(q, t) };
  for (const k of keys) delete rest[k];
  return withTarget(q, t, rest);
}

/** Patches that delete `keys` (null on the wire), each at most CHUNK cells. */
export function clearBatches(keys: string[]): Cells[] {
  const out: Cells[] = [];
  for (let i = 0; i < keys.length; i += CHUNK) {
    out.push(
      Object.fromEntries(keys.slice(i, i + CHUNK).map((k) => [k, null])),
    );
  }
  return out;
}

/** Keep only the targets that belong to `accountId`. Edits of any other account are discarded. */
export function keepAccount(q: Queue, accountId: string | null): Queue {
  const out: Queue = {};
  for (const [k, e] of Object.entries(q))
    if (e.target.accountId === accountId) out[k] = e;
  return out;
}

/** Network errors (status 0) and server errors (5xx) are retried; a 4xx is the server refusing the data. */
export function isRetryable(err: { status: number }): boolean {
  return err.status === 0 || err.status >= 500;
}

/** The server refused the data itself (a bad value or a batch too large): split the batch and find the cells. */
export function isValidationRefusal(err: { status: number }): boolean {
  return err.status === 400 || err.status === 413 || err.status === 422;
}

/** Backoff for a retry: 1 s, 2 s, 4 s, ... capped at 30 s. */
export function retryDelay(attempt: number): number {
  return Math.min(30_000, 1_000 * 2 ** attempt);
}
