/* ════════════════════════════════════════════════════════════
   THE THREE PLANS, AS THEY WERE ORDERED

   Starter, Standard and Enterprise: the numbers below are the commercial terms, so a change to any of them is a decision,
   not a refactor. The comparison table is built from the same data, shows exactly the rows that were asked for and no
   others, and nothing on it says suppliers are "free" — their side of the smart link is simply without limit.
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
g.window = { localStorage: storage, dispatchEvent: () => true };
g.localStorage = storage;

const { PLANS, TRIAL_PLAN, PLAN_COMPARISON, PLAN_COLOPHON } = await import(
  "../config"
);
const { CAP_BLOCKED, CAP_LABEL, CAP_REMEDY } = await import("../plan");

const byId = (id: string) => PLANS.find((p) => p.id === id)!;

test("the three plans carry the terms they were given", () => {
  assert.deepEqual(
    PLANS.map((p) => p.id),
    ["starter", "standard", "enterprise"],
  );

  const want = {
    starter: {
      companies: 1,
      sites: 1,
      cnCodes: 1,
      precursors: 1,
      years: 1,
      aiTokens: 500,
      aiQuestions: 50,
      uploadPages: 100,
      seats: 3,
    },
    standard: {
      companies: 2,
      sites: 2,
      cnCodes: 3,
      precursors: 4,
      years: 1,
      aiTokens: 1500,
      aiQuestions: 150,
      uploadPages: 300,
      seats: 5,
    },
    enterprise: {
      companies: 2,
      sites: 3,
      cnCodes: 6,
      precursors: 8,
      years: 1,
      aiTokens: 3000,
      aiQuestions: 300,
      uploadPages: 600,
      seats: 10,
    },
  } as const;
  for (const [id, w] of Object.entries(want)) {
    const p = byId(id);
    assert.equal(p.allowance.companies, w.companies, `${id} companies`);
    assert.equal(p.caps.sites, w.sites, `${id} installations`);
    assert.equal(p.caps.cnCodes, w.cnCodes, `${id} CN codes`);
    assert.equal(p.allowance.precursors, w.precursors, `${id} precursors`);
    assert.equal(p.caps.years, w.years, `${id} reporting years`);
    assert.equal(p.allowance.aiTokens, w.aiTokens, `${id} AI tokens`);
    assert.equal(p.allowance.aiQuestions, w.aiQuestions, `${id} AI questions`);
    assert.equal(
      p.allowance.uploadPages,
      w.uploadPages,
      `${id} smart-upload pages`,
    );
    assert.equal(p.caps.seats, w.seats, `${id} seats`);
  }
});

test("ten tokens are a question, on every plan — tokens are the unit behind it, never the one on show", () => {
  for (const p of PLANS)
    assert.equal(
      (p.allowance.aiTokens as number) / 10,
      p.allowance.aiQuestions,
    );
});

test("each plan is a step up from the one before, never a step sideways", () => {
  const order = ["starter", "standard", "enterprise"].map(byId);
  for (let i = 1; i < order.length; i += 1) {
    const [a, b] = [order[i - 1], order[i]];
    for (const k of ["cnCodes", "sites", "seats"] as const)
      assert.ok(
        (b.caps[k] as number) > (a.caps[k] as number),
        `${k} grows from ${a.id} to ${b.id}`,
      );
    for (const k of [
      "companies",
      "precursors",
      "aiTokens",
      "uploadPages",
    ] as const)
      assert.ok(
        (b.allowance[k] as number) >= (a.allowance[k] as number),
        `${k} never shrinks`,
      );
  }
});

test("a plan is quoted, not listed: no price figure anywhere on it", () => {
  for (const p of PLANS) {
    assert.equal(p.amount, "Price on request");
    assert.equal(p.columnPrice, "Price on request");
    assert.doesNotMatch(
      `${p.amount} ${p.unit} ${p.columnPrice}`,
      /[฿€$]\s?\d|\d\s?(THB|EUR|USD)/,
    );
  }
});

test("the free trial is not a fourth column and caps nothing", () => {
  assert.ok(!PLANS.some((p) => p.id === "trial"));
  assert.ok(
    Object.values(TRIAL_PLAN.caps)
      .filter((v) => v !== TRIAL_PLAN.caps.chainTiers)
      .every((v) => v === null),
  );
  assert.ok(Object.values(TRIAL_PLAN.allowance).every((v) => v === null));
});

test("the table shows what was asked for and nothing else, in the order it was asked", () => {
  const rows = PLAN_COMPARISON.flatMap((g) => g.rows.map((r) => r.label));
  assert.deepEqual(rows, [
    "Company",
    "Installation & report package",
    "CN code",
    "Precursor",
    "Reporting year",
    "AI",
    "Smart upload",
    "Smart link",
    "Team seats",
    "Onboarding",
    "Support",
  ]);
});

test("the table is built from the plans' own numbers, so the two can never disagree", () => {
  const row = (label: string) =>
    PLAN_COMPARISON.flatMap((g) => g.rows).find((r) => r.label === label)!
      .cells;
  assert.deepEqual(row("CN code"), ["1", "3", "6"]);
  assert.deepEqual(row("Installation & report package"), ["1", "2", "3"]);
  assert.deepEqual(row("Company"), ["1", "2", "2"]);
  assert.deepEqual(row("Precursor"), ["1", "4", "8"]);
  assert.deepEqual(row("Reporting year"), ["1", "1", "1"]);
  assert.deepEqual(row("Team seats"), ["3", "5", "10"]);
  assert.deepEqual(row("Smart link"), ["Unlimited", "Unlimited", "Unlimited"]);
  assert.deepEqual(row("Onboarding"), [
    "Provided + 1 meeting session",
    "Provided + 1 meeting session",
    "Provided + 1 meeting session",
  ]);
  assert.deepEqual(row("Support"), [
    "1 business day",
    "1 business day",
    "1 business day",
  ]);

  const ai = row("AI") as { text: string; n: number; sub?: unknown }[];
  assert.deepEqual(
    ai.map((c) => [c.text, c.n]),
    [
      ["{n} questions", 50],
      ["{n} questions", 150],
      ["{n} questions", 300],
    ],
  );
  assert.ok(
    ai.every((c) => c.sub === undefined),
    "the AI is stated in questions alone — no token count under it",
  );
  const pages = row("Smart upload") as { n: number }[];
  assert.deepEqual(
    pages.map((c) => c.n),
    [100, 300, 600],
  );
});

test("nowhere on a plan, its table or its limit messages is a supplier called free", () => {
  const strings: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") strings.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(PLANS);
  walk(PLAN_COMPARISON);
  walk(PLAN_COLOPHON);
  walk(CAP_BLOCKED);
  walk(CAP_LABEL);
  strings.push(CAP_REMEDY);
  for (const s of strings) assert.doesNotMatch(s, /\bfree\b/i, s);
  assert.match(CAP_REMEDY, /suppliers and precursor suppliers/i);
});

test("the limit messages speak of installations, as the table does", () => {
  assert.equal(CAP_LABEL.sites, "Installations");
  assert.match(CAP_BLOCKED.sites.one, /installation/);
  assert.match(CAP_BLOCKED.sites.many, /installations/);
  assert.doesNotMatch(
    `${CAP_BLOCKED.sites.one} ${CAP_BLOCKED.sites.many}`,
    /production site/,
  );
});
