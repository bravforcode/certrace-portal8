/* Ordering for diagram patches. Jobs run one at a time, in the order they were queued.

   Skip rule: when a job fails, the patches still waiting were built on cells that
   assumed the failed write landed, so they resolve "skipped" and are never sent.
   The caller shows one notice with the count of skipped patches.

   Empty jobs (no cells) resolve "saved" without a send. */

import type { CellPatch } from "./flow-edit";

export type SyncResult = "saved" | "skipped" | "failed";

export function createSyncQueue<J = CellPatch>(
  send: (job: J) => Promise<void>,
  isEmpty: (job: J) => boolean = (job) => Object.keys(job as object).length === 0,
) {
  const waiting: { job: J; done: (r: SyncResult) => void }[] = [];
  let running = false;
  async function drain() {
    if (running) return;
    running = true;
    while (waiting.length) {
      const next = waiting.shift()!;
      if (isEmpty(next.job)) {
        next.done("saved");
        continue;
      }
      try {
        await send(next.job);
        next.done("saved");
      } catch {
        next.done("failed");
        for (const later of waiting.splice(0)) later.done("skipped");
      }
    }
    running = false;
  }
  return {
    enqueue: (job: J) =>
      new Promise<SyncResult>((done) => {
        waiting.push({ job, done });
        void drain();
      }),
    size: () => waiting.length,
  };
}
