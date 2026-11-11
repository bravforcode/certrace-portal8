/* Pure queue of typed cells waiting to reach the server workbook. One queue per
   target (installation + year), so a switch of year or installation never drops
   or re-routes an unsaved edit. The runner in use-workbook.ts sends one batch at
   a time; these functions only shape the data. */

/** Backend limit: a cell value is at most 10,000 characters (model.ts). */
export const CELL_MAX = 10_000;
/** Backend limit: at most 2,000 cells in one patch. */
export const CHUNK = 2_000;

export type Target = { iid: string; year: number };
export type Cells = Record<string, string | null>;
export type Queue = Record<string, Cells>;

const keyOf = (t: Target) => `${t.iid}:${t.year}`;

/** Queue a typed value. An empty value queues a delete (null); long values are clamped. */
export function enqueue(q: Queue, t: Target, cellKey: string, value: string): Queue {
  const v: string | null = value === "" ? null : value.slice(0, CELL_MAX);
  return { ...q, [keyOf(t)]: { ...(q[keyOf(t)] ?? {}), [cellKey]: v } };
}

export function pendingFor(q: Queue, t: Target): Cells {
  return q[keyOf(t)] ?? {};
}

export function pendingCount(q: Queue, t: Target): number {
  return Object.keys(pendingFor(q, t)).length;
}

/** Targets that still have edits waiting, in the order they were first queued. */
export function targetsWithPending(q: Queue): Target[] {
  return Object.keys(q)
    .filter((k) => Object.keys(q[k]).length > 0)
    .map((k) => {
      const i = k.lastIndexOf(":");
      return { iid: k.slice(0, i), year: Number(k.slice(i + 1)) };
    });
}

/** The next patch for a target: at most CHUNK cells. */
export function nextBatch(q: Queue, t: Target): Cells {
  return Object.fromEntries(Object.entries(pendingFor(q, t)).slice(0, CHUNK));
}

/** After the server confirms `sent`, drop those cells, unless the reader typed a new value meanwhile. */
export function acknowledge(q: Queue, t: Target, sent: Cells): Queue {
  const rest = { ...pendingFor(q, t) };
  for (const [k, v] of Object.entries(sent)) if (rest[k] === v) delete rest[k];
  return withTarget(q, t, rest);
}

/** Drop cells the server refused (a non-network 4xx); the rest of the target stays queued. */
export function dropKeys(q: Queue, t: Target, keys: string[]): Queue {
  const rest = { ...pendingFor(q, t) };
  for (const k of keys) delete rest[k];
  return withTarget(q, t, rest);
}

function withTarget(q: Queue, t: Target, cells: Cells): Queue {
  const out = { ...q };
  if (Object.keys(cells).length) out[keyOf(t)] = cells;
  else delete out[keyOf(t)];
  return out;
}

/** Network errors (status 0) and server errors (5xx) are retried; a 4xx is the server refusing the data. */
export function isRetryable(err: { status: number }): boolean {
  return err.status === 0 || err.status >= 500;
}

/** Backoff for a retry: 1 s, 2 s, 4 s, ... capped at 30 s. */
export function retryDelay(attempt: number): number {
  return Math.min(30_000, 1_000 * 2 ** attempt);
}
