/* ════════════════════════════════════════════════════════════
   THE SUPPLY CHAIN MODEL — what "healthy" means, pinned

   Scores are a weighted mean over the aspects that could be measured; an aspect with nothing to measure
   is left out rather than counted as zero. A state follows from the score and the concerns, and the
   summary's counts must add up to the parties it was given — the page and the dashboard read the same one.
   ════════════════════════════════════════════════════════════ */

import { test } from "node:test";
import assert from "node:assert/strict";

const { CHAIN_STATES, plantHealth, precursorHealth, scoreOf, summarise } =
  await import("../supply-chain-model");
const { samplePlants, samplePrecursors } = await import(
  "./fixtures/supply-chain-sample"
);

const NOW = new Date("2026-10-25T09:00:00");

test("a score is the weighted mean of what could be measured — and nothing is read as zero", () => {
  assert.equal(scoreOf([]), null);
  assert.equal(
    scoreOf([{ key: "a", label: "A", value: null, weight: 1 }]),
    null,
  );
  assert.equal(
    scoreOf([
      { key: "a", label: "A", value: 100, weight: 1 },
      { key: "b", label: "B", value: null, weight: 5 },
    ]),
    100,
  );
  assert.equal(
    scoreOf([
      { key: "a", label: "A", value: 100, weight: 1 },
      { key: "b", label: "B", value: 0, weight: 3 },
    ]),
    25,
  );
});

test("every plant and precursor in the sample has a state, a 0–100 score and a concern list", () => {
  const plants = samplePlants().map(plantHealth);
  const precursors = samplePrecursors(NOW).map((f) => precursorHealth(f, NOW));
  assert.ok(
    plants.length >= 5 && precursors.length >= 8,
    "the sample is a chain worth looking at",
  );
  for (const h of [...plants, ...precursors]) {
    assert.ok(
      CHAIN_STATES.includes(h.state),
      `${h.facts.id}: unknown state ${h.state}`,
    );
    if (h.score != null)
      assert.ok(
        h.score >= 0 && h.score <= 100,
        `${h.facts.id}: score ${h.score}`,
      );
    assert.ok(Array.isArray(h.concerns));
  }
});

test("a plant's months are counted once each, and what was asked is what is answered, waiting or late", () => {
  for (const p of samplePlants().map(plantHealth)) {
    const total =
      p.counts.done +
      p.counts.late +
      p.counts.waiting +
      p.counts.send +
      p.counts.later;
    assert.equal(total, p.facts.months.length, p.facts.id);
    assert.equal(
      p.asked,
      p.counts.done + p.counts.late + p.counts.waiting,
      p.facts.id,
    );
  }
});

test("the summary adds up to the parties it was given, and ranks the worst concern first", () => {
  const plants = samplePlants().map(plantHealth);
  const precursors = samplePrecursors(NOW).map((f) => precursorHealth(f, NOW));
  const s = summarise(plants, precursors);
  assert.equal(s.total, plants.length + precursors.length);
  assert.equal(
    Object.values(s.byState).reduce((a, b) => a + b, 0),
    s.total,
  );
  assert.equal(
    Object.values(s.plantsByState).reduce((a, b) => a + b, 0),
    s.plants,
  );
  assert.equal(
    Object.values(s.precursorsByState).reduce((a, b) => a + b, 0),
    s.precursors,
  );
  assert.equal(
    s.precursorBasis.verified +
      s.precursorBasis.unverified +
      s.precursorBasis.default,
    s.precursors,
  );
  const rank = { high: 0, medium: 1, low: 2 } as Record<string, number>;
  const ranks = s.concerns.map((c) => rank[c.severity] ?? 3);
  assert.deepEqual(
    ranks,
    [...ranks].sort((a, b) => a - b),
    "concerns are most severe first",
  );
  const shares = s.concentration.map((c) => c.share);
  assert.deepEqual(
    shares,
    [...shares].sort((a, b) => b - a),
    "the supplier carrying most of the emissions comes first",
  );
});

test("an empty chain is not a healthy one: no score, no percentages", () => {
  const s = summarise([], []);
  assert.equal(s.total, 0);
  assert.equal(s.avgScore, null);
  assert.equal(s.responsePct, null);
  assert.equal(s.verifiedPct, null);
  assert.equal(s.defaultPct, null);
});
