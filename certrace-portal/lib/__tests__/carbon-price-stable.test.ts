/* ════════════════════════════════════════════════════════════
   AN UNTOUCHED CARBON PRICE READS THE SAME EVERY TIME

   The Cost tab saves as you type, by comparing what is on screen with what it
   last saved. An unanswered record used to be stamped with the moment it was
   read, so each refetch looked like an edit: the badge sat on "unsaved
   changes" and the form wrote an answer nobody had given. Reading must not
   change the value.
   ════════════════════════════════════════════════════════════ */

import { test } from "node:test";
import assert from "node:assert/strict";

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  clear() {
    this.map.clear();
  }
}
const g = globalThis as unknown as { window?: unknown; localStorage?: unknown };
const storage = new MemoryStorage();
g.window = { localStorage: storage };
g.localStorage = storage;

const { getCarbonPrice, saveCarbonPrice, sameCarbonPriceAnswers } =
  await import("../carbon-price");

test("an unanswered carbon price is the same value on every read, and is not marked as answered", async () => {
  storage.clear();
  const first = getCarbonPrice("ws-1");
  await new Promise((r) => setTimeout(r, 5));
  const second = getCarbonPrice("ws-1");
  assert.deepEqual(first, second, "reading it twice must not change it");
  assert.equal(first.recorded, false);
  assert.equal(JSON.stringify(first), JSON.stringify(second));
});

test("saving it is what stamps it answered", () => {
  storage.clear();
  const saved = saveCarbonPrice({
    ...getCarbonPrice("ws-1"),
    amountPerTonne: 0,
    instrument: "none",
  });
  assert.equal(saved.recorded, true);
  assert.ok(saved.updatedAt.length > 0);
  assert.deepEqual(getCarbonPrice("ws-1"), saved);
});

test("a save receipt is not a new carbon-price answer", () => {
  const draft = { ...getCarbonPrice("ws-2"), amountPerTonne: 200 };
  const saved = { ...draft, recorded: true, updatedAt: "2026-10-30T00:00:00Z" };
  assert.equal(sameCarbonPriceAnswers(draft, saved), true);
  assert.equal(
    sameCarbonPriceAnswers(draft, { ...saved, amountPerTonne: 300 }),
    false,
    "a real change still replaces the draft",
  );
});
