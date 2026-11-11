import type { CellPatch } from "./flow-edit";

export type SyncResult = "saved" | "skipped" | "failed";

export function createSyncQueue(send: (patch: CellPatch) => Promise<void>) {
  const waiting: { patch: CellPatch; done: (r: SyncResult) => void }[] = [];
  let running = false;
  async function drain() {
    if (running) return;
    running = true;
    while (waiting.length) {
      const job = waiting.shift()!;
      if (!Object.keys(job.patch).length) {
        job.done("saved");
        continue;
      }
      try {
        await send(job.patch);
        job.done("saved");
      } catch {
        job.done("failed");
        // Built on cells that assumed the failed write landed; never send them.
        for (const later of waiting.splice(0)) later.done("skipped");
      }
    }
    running = false;
  }
  return {
    enqueue: (patch: CellPatch) =>
      new Promise<SyncResult>((done) => {
        waiting.push({ patch, done });
        void drain();
      }),
    size: () => waiting.length,
  };
}
