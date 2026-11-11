import test from "node:test";
import assert from "node:assert/strict";
import {
  capOpportunities, gapOpportunities, mergeOpportunities, summarize, sheetTitle, type Opportunity,
} from "../opportunities";
import { defaultFor } from "../../cbam/precursor-basis";
import type { EmissionEstimate } from "../../workbook/estimate";

const base: EmissionEstimate = {
  productionT: 1000, directT: 0, indirectT: 0, indirectExcludedT: 0, precursorT: 0, totalT: 0, perTonne: null,
  byStep: {}, unmatched: [], notes: [], biomass: false, precursors: [],
};
const ctx = {
  year: 2026, exportedT: 500, priceEur: 80,
  factoryGaps: [{ key: "processes:none", group: "processes" as const, message: "Add the processes inside the installation boundary." }],
  emptySheets: ["transport"],
};

const stored = (over: Partial<Opportunity>): Opportunity => ({
  id: "x", key: "k", installationId: "i1", source: "data-gap", title: "t", detail: "", impactEur: null, impactT: null,
  assignee: "", status: "open", due: "", href: "", createdAt: "t0", updatedAt: "t0", ...over,
});

test("a precursor on default values counts only the mark-up part of its default", () => {
  const d = defaultFor("72139110", undefined, 2026);
  assert.ok(d, "the CN code has a default");
  const line = { key: "materials:0", item: "Wire rod", cn: "72139110", tonnes: 1020, defaultSee: d.total, step: "Drawing" };
  const [card] = gapOpportunities("i1", { ...base, precursors: [line] }, ctx);
  const impactT = d.total * (d.markup / (1 + d.markup)) * 1020 * (500 / 1000);
  assert.equal(card!.key, "precursor:i1:materials:0");
  assert.equal(card!.source, "data-gap");
  if (d.markup > 0) {
    assert.ok(Math.abs(card!.impactT! - impactT) < 1e-9);
    assert.ok(Math.abs(card!.impactEur! - impactT * 80) < 1e-9);
  } else {
    assert.equal(card!.impactEur, null);
  }
});

test("a precursor with no mark-up or no price has no money impact", () => {
  const line = { key: "materials:0", item: "X", cn: "72139110", tonnes: 10, defaultSee: 2, step: "" };
  const [noPrice] = gapOpportunities("i1", { ...base, precursors: [line] }, { ...ctx, priceEur: null });
  assert.equal(noPrice!.impactEur, null);
  const [noMarkup] = gapOpportunities("i1", { ...base, precursors: [{ ...line, cn: "0000" }] }, ctx);
  assert.equal(noMarkup!.impactEur, null);
  assert.equal(noMarkup!.impactT, null);
});

test("factory gaps and empty sheets become cards without money impact", () => {
  const cards = gapOpportunities("i1", base, ctx).map((o) => [o.key, o.title, o.impactEur]);
  assert.deepEqual(cards, [
    ["factory:i1:processes:none", "Add the processes inside the installation boundary.", null],
    ["sheet:i1:transport", "Fill in the Transport sheet", null],
  ]);
});

test("sheet titles use the workspace sheet names and fall back to the id", () => {
  assert.equal(sheetTitle("transport"), "Transport");
  assert.equal(sheetTitle("unknown-sheet"), "unknown-sheet");
});

test("merge keeps assignment, closes fixed data-gap cards, and keeps what-if cards", () => {
  const fresh = gapOpportunities("i1", base, { ...ctx, factoryGaps: [] });
  const list = [
    stored({ id: "a", key: "sheet:i1:transport", assignee: "u1", status: "in-progress", due: "2026-12-01" }),
    stored({ id: "b", key: "sheet:i1:evidence", title: "Fill in the Evidence sheet" }),
    stored({ id: "c", key: "what-if:1", source: "what-if", title: "Scenario", impactEur: 100 }),
    stored({ id: "d", key: "factory:i1:gone", status: "dismissed" }),
  ];
  const merged = mergeOpportunities(fresh, list, "t1");
  const by = Object.fromEntries(merged.map((o) => [o.key, o]));
  assert.equal(by["sheet:i1:transport"]!.id, "a");
  assert.equal(by["sheet:i1:transport"]!.assignee, "u1");
  assert.equal(by["sheet:i1:transport"]!.status, "in-progress");
  assert.equal(by["sheet:i1:evidence"]!.status, "done");
  assert.equal(by["sheet:i1:evidence"]!.updatedAt, "t1");
  assert.equal(by["what-if:1"]!.status, "open");
  assert.equal(by["factory:i1:gone"]!.status, "dismissed");
});

test("a new derived card starts open and unassigned with a fresh id", () => {
  const [card] = mergeOpportunities(gapOpportunities("i1", base, { ...ctx, factoryGaps: [] }), [], "t1");
  assert.equal(card!.status, "open");
  assert.equal(card!.assignee, "");
  assert.equal(card!.due, "");
  assert.ok(card!.id.length > 0);
  assert.equal(card!.createdAt, "t1");
});

test("gaps of another installation are not closed by a run for this one", () => {
  const list = [stored({ id: "z", key: "sheet:i2:transport", installationId: "i2" })];
  const merged = mergeOpportunities(gapOpportunities("i1", base, ctx), list, "t1");
  assert.equal(merged.find((o) => o.id === "z")!.status, "open");
});

test("open and in-progress cards sort first, by impact, then title", () => {
  const list = mergeOpportunities(
    [],
    [
      stored({ id: "1", key: "a", title: "b", status: "done", impactEur: 999 }),
      stored({ id: "2", key: "b", title: "b", impactEur: null }),
      stored({ id: "3", key: "c", title: "a", impactEur: 5 }),
      stored({ id: "4", key: "d", title: "z", impactEur: 50 }),
    ],
    "t1",
  );
  assert.deepEqual(list.map((o) => o.id), ["4", "3", "2", "1"]);
});

test("summary counts statuses and the impact of open cards only", () => {
  const s = summarize([
    stored({ status: "open", impactEur: 10, impactT: 1 }),
    stored({ status: "in-progress", impactEur: null, impactT: null }),
    stored({ status: "done", impactEur: 99, impactT: 9 }),
    stored({ status: "dismissed", impactEur: 99, impactT: 9 }),
  ]);
  assert.deepEqual(s, { open: 1, inProgress: 1, done: 1, impactEur: 10, impactT: 1 });
});

test("storage keeps at most 500 cards and drops the oldest closed ones first", () => {
  const many = Array.from({ length: 502 }, (_, i) =>
    stored({ id: `o${i}`, key: `k${i}`, status: i < 2 ? "done" : "open", updatedAt: `2026-01-${String((i % 28) + 1).padStart(2, "0")}T00:00` }),
  );
  const kept = capOpportunities(many);
  assert.equal(kept.length, 500);
  assert.ok(!kept.some((o) => o.id === "o0" || o.id === "o1"), "the two closed cards are dropped");
  assert.equal(capOpportunities(many.slice(0, 3)).length, 3);
});
