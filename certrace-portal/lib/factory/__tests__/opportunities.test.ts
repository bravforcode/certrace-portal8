import test from "node:test";
import assert from "node:assert/strict";
import {
  OPPORTUNITY_LIMIT, capOpportunities, factoryGapText, gapOpportunities, isOpportunity, mergeOpportunities,
  opportunityEditable, sheetTitle, summarize, type Opportunity,
} from "../opportunities";
import { emptyProfile } from "../profile";
import { defaultFor } from "../../cbam/precursor-basis";
import type { EmissionEstimate } from "../../workbook/estimate";

const base: EmissionEstimate = {
  productionT: 1000, directT: 0, indirectT: 0, indirectExcludedT: 0, precursorT: 0, totalT: 0, perTonne: null,
  byStep: {}, unmatched: [], notes: [], biomass: false, precursors: [],
};
const ctx = { year: 2026, exportedT: 500, priceEur: 80, factoryGaps: [], profile: emptyProfile(), emptySheets: ["transport"] };
const SCOPE = { year: 2026, loaded: new Set(["i1"]), factoryLoaded: new Set(["i1"]) };

const card = (over: Partial<Opportunity>): Opportunity => ({
  id: "x", key: "k", installationId: "i1", year: 2026, source: "data-gap", title: "t", detail: "", impactEur: null, impactT: null,
  assignee: "", status: "open", due: "", href: "", createdAt: "t0", updatedAt: "t0", ...over,
});

test("a precursor on default values counts only the mark-up part, keyed by year and material", () => {
  const d = defaultFor("72139110", undefined, 2026);
  assert.ok(d, "the CN code has a default");
  const line = { key: "materials:0", item: "Wire rod", cn: "72139110", tonnes: 1020, defaultSee: d.total, step: "Drawing" };
  const [c] = gapOpportunities("i1", { ...base, precursors: [line] }, ctx);
  assert.equal(c!.key, "precursor:i1:2026:wire rod|72139110");
  const impactT = d.total * (d.markup / (1 + d.markup)) * 1020 * (500 / 1000);
  if (d.markup > 0) {
    assert.ok(Math.abs(c!.impactT! - impactT) < 1e-9);
    assert.ok(Math.abs(c!.impactEur! - impactT * 80) < 1e-9);
  } else assert.equal(c!.impactEur, null);
});

test("a precursor with no mark-up or no price has no money impact", () => {
  const line = { key: "materials:0", item: "X", cn: "72139110", tonnes: 10, defaultSee: 2, step: "" };
  const [noPrice] = gapOpportunities("i1", { ...base, precursors: [line] }, { ...ctx, priceEur: null });
  assert.equal(noPrice!.impactEur, null);
  const [noMarkup] = gapOpportunities("i1", { ...base, precursors: [{ ...line, cn: "0000" }] }, ctx);
  assert.equal(noMarkup!.impactEur, null);
  assert.equal(noMarkup!.impactT, null);
});

test("with no production recorded the impact is unknown, not zero", () => {
  const line = { key: "materials:0", item: "Wire rod", cn: "72139110", tonnes: 10, defaultSee: 2, step: "" };
  const [c] = gapOpportunities("i1", { ...base, productionT: 0, precursors: [line] }, ctx);
  assert.equal(c!.impactT, null);
  assert.equal(c!.impactEur, null);
});

test("the same material on two rows gets two distinct keys", () => {
  const line = { key: "materials:0", item: "Wire rod", cn: "72139110", tonnes: 10, defaultSee: 2, step: "" };
  const keys = gapOpportunities("i1", { ...base, precursors: [line, { ...line, key: "materials:1" }] }, { ...ctx, emptySheets: [] }).map((c) => c.key);
  assert.equal(new Set(keys).size, 2);
});

test("a material keeps its key when a row above it is deleted", () => {
  const a = { key: "materials:0", item: "Wire rod", cn: "72139110", tonnes: 10, defaultSee: 2, step: "" };
  const b = { key: "materials:1", item: "Steel plate", cn: "72085100", tonnes: 5, defaultSee: 2, step: "" };
  const before = gapOpportunities("i1", { ...base, precursors: [a, b] }, { ...ctx, emptySheets: [] });
  const after = gapOpportunities("i1", { ...base, precursors: [{ ...b, key: "materials:0" }] }, { ...ctx, emptySheets: [] });
  const stored = [card({ id: "steel", key: before[1]!.key, title: before[1]!.title, assignee: "u1", status: "in-progress" })];
  const merged = mergeOpportunities(after, stored, "t1", SCOPE);
  const steel = merged.find((o) => o.title.includes("Steel plate"))!;
  assert.equal(steel.id, "steel");
  assert.equal(steel.assignee, "u1");
  assert.equal(steel.status, "in-progress");
});

test("factory gaps and empty sheets become cards; factory keys have no year, sheet keys do", () => {
  const profile = emptyProfile();
  const gap = { key: "processes:none", group: "processes" as const, message: "Add the processes inside the installation boundary." };
  const cards = gapOpportunities("i1", base, { ...ctx, factoryGaps: [gap], profile });
  assert.deepEqual(
    cards.map((o) => [o.key, o.title, o.impactEur]),
    [
      ["factory:i1:processes:none", "Add the processes inside the installation boundary.", null],
      ["sheet:i1:2026:transport", "Fill in the Transport sheet", null],
    ],
  );
  assert.deepEqual(cards[0]!.text, { key: "Add the processes inside the installation boundary." });
});

test("factory gap text uses the translatable template and the names from the profile", () => {
  const profile = { ...emptyProfile(), sources: [{ id: "s1", name: "Boiler", kind: "combustion" as const, processId: "p", fuel: "", tag: "" }], processes: [{ id: "p", name: "Kiln", step: "other" as const, route: "", inBoundary: true, note: "" }] };
  assert.deepEqual(factoryGapText({ key: "sources:s1:no-meter", group: "sources", message: "", refId: "s1" }, profile), {
    key: "{name} has no meter or data source.", params: { name: "Boiler" },
  });
  assert.deepEqual(factoryGapText({ key: "processes:p:no-source", group: "processes", message: "", refId: "p" }, profile), {
    key: "{name} has no emission source.", params: { name: "Kiln" },
  });
});

test("sheet titles use the workspace sheet names and fall back to the id", () => {
  assert.equal(sheetTitle("transport"), "Transport");
  assert.equal(sheetTitle("unknown-sheet"), "unknown-sheet");
});

test("merge keeps assignment, closes fixed data-gap cards with closedBy auto, keeps what-if cards", () => {
  const fresh = gapOpportunities("i1", base, { ...ctx, emptySheets: ["transport"] });
  const list = [
    card({ id: "a", key: "sheet:i1:2026:transport", assignee: "u1", status: "in-progress", due: "2026-12-01" }),
    card({ id: "b", key: "sheet:i1:2026:evidence", title: "Fill in the Evidence sheet" }),
    card({ id: "c", key: "what-if:1", source: "what-if", title: "Scenario", impactEur: 100 }),
    card({ id: "d", key: "factory:i1:gone", status: "dismissed" }),
  ];
  const merged = mergeOpportunities(fresh, list, "t1", SCOPE);
  const by = Object.fromEntries(merged.map((o) => [o.id, o]));
  assert.equal(by.a!.assignee, "u1");
  assert.equal(by.a!.status, "in-progress", "the transport sheet was still empty, so it stays in progress");
  assert.equal(by.b!.status, "done");
  assert.equal(by.b!.closedBy, "auto");
  assert.equal(by.b!.updatedAt, "t1");
  assert.equal(by.c!.status, "open");
  assert.equal(by.d!.status, "dismissed");
});

test("a fully filled installation closes its open cards, even with nothing derived for it", () => {
  const stored = [card({ id: "s", key: "sheet:i1:2026:transport" }), card({ id: "p", key: "precursor:i1:2026:wire rod|72139110" })];
  const merged = mergeOpportunities([], stored, "t1", SCOPE);
  assert.deepEqual(merged.map((o) => [o.id, o.status, o.closedBy]), [["s", "done", "auto"], ["p", "done", "auto"]]);
});

test("nothing closes when the installation's workbook did not load", () => {
  const merged = mergeOpportunities([], [card({ id: "s", key: "sheet:i1:2026:transport" })], "t1", { ...SCOPE, loaded: new Set() });
  assert.equal(merged[0]!.status, "open");
});

test("a card for another year is not closed by this year's run", () => {
  const merged = mergeOpportunities([], [card({ id: "s", key: "sheet:i1:2025:transport", year: 2025 })], "t1", SCOPE);
  assert.equal(merged[0]!.status, "open");
});

test("factory gap cards close from the factory profile, not from the workbook", () => {
  const stored = [card({ id: "f", key: "factory:i1:processes:none" })];
  assert.equal(mergeOpportunities([], stored, "t1", { ...SCOPE, loaded: new Set(), factoryLoaded: new Set(["i1"]) })[0]!.status, "done");
  assert.equal(mergeOpportunities([], stored, "t1", { ...SCOPE, factoryLoaded: new Set() })[0]!.status, "open");
});

test("an auto-closed card reopens when its gap returns; a manually closed one stays closed", () => {
  const auto = card({ id: "a", key: "sheet:i1:2026:transport", status: "done", closedBy: "auto", assignee: "u1" });
  const manual = card({ id: "m", key: "sheet:i1:2026:evidence", status: "done" });
  const derived = gapOpportunities("i1", base, { ...ctx, emptySheets: ["transport", "evidence"] });
  const merged = mergeOpportunities(derived, [auto, manual], "t2", SCOPE);
  const a = merged.find((o) => o.id === "a")!;
  const m = merged.find((o) => o.id === "m")!;
  assert.equal(a.status, "open");
  assert.equal(a.closedBy, undefined);
  assert.equal(a.assignee, "u1");
  assert.equal(m.status, "done");
});

test("a new derived card starts open and unassigned with a fresh id", () => {
  const [c] = mergeOpportunities(gapOpportunities("i1", base, { ...ctx, emptySheets: ["transport"] }), [], "t1", SCOPE);
  assert.equal(c!.status, "open");
  assert.equal(c!.assignee, "");
  assert.equal(c!.due, "");
  assert.ok(c!.id.length > 0);
  assert.equal(c!.createdAt, "t1");
});

test("open and in-progress cards sort first, by impact, then title", () => {
  const list = mergeOpportunities(
    [],
    [
      card({ id: "1", key: "a", title: "b", status: "done", impactEur: 999 }),
      card({ id: "2", key: "b", title: "b", impactEur: null }),
      card({ id: "3", key: "c", title: "a", impactEur: 5 }),
      card({ id: "4", key: "d", title: "z", impactEur: 50 }),
    ],
    "t1",
    { ...SCOPE, loaded: new Set() },
  );
  assert.deepEqual(list.map((o) => o.id), ["4", "3", "2", "1"]);
});

test("summary counts statuses and the impact of open cards only", () => {
  const s = summarize([
    card({ status: "open", impactEur: 10, impactT: 1 }),
    card({ status: "in-progress", impactEur: null, impactT: null }),
    card({ status: "done", impactEur: 99, impactT: 9 }),
    card({ status: "dismissed", impactEur: 99, impactT: 9 }),
  ]);
  assert.deepEqual(s, { open: 1, inProgress: 1, done: 1, impactEur: 10, impactT: 1 });
});

test("the cap drops the oldest closed cards first and never an active one", () => {
  const closed = Array.from({ length: 3 }, (_, i) => card({ id: `c${i}`, key: `c${i}`, status: "done", updatedAt: `2026-01-0${i + 1}` }));
  const active = Array.from({ length: OPPORTUNITY_LIMIT - 2 }, (_, i) => card({ id: `a${i}`, key: `a${i}` }));
  const fresh = [card({ id: "new", key: "new" }), card({ id: "new2", key: "new2" })];
  const { list, skipped } = capOpportunities([...closed, ...active, ...fresh], new Set(["c0", "c1", "c2", ...active.map((o) => o.id)]));
  assert.equal(list.length, OPPORTUNITY_LIMIT);
  assert.equal(skipped, 0);
  assert.ok(!list.some((o) => o.id === "c0"), "the oldest closed card goes first");
  assert.ok(list.some((o) => o.id === "new") && list.some((o) => o.id === "new2"));
});

test("at the cap with only active cards, the new derived cards are skipped and reported", () => {
  const active = Array.from({ length: OPPORTUNITY_LIMIT }, (_, i) => card({ id: `a${i}`, key: `a${i}` }));
  const fresh = [card({ id: "new", key: "new" }), card({ id: "new2", key: "new2" })];
  const { list, skipped } = capOpportunities([...active, ...fresh], new Set(active.map((o) => o.id)));
  assert.equal(skipped, 2);
  assert.equal(list.length, OPPORTUNITY_LIMIT);
  assert.ok(list.every((o) => o.id.startsWith("a")), "no existing active card is dropped");
});

test("only well-formed stored cards are accepted", () => {
  const good = card({ id: "g" });
  assert.equal(isOpportunity(good), true);
  assert.equal(isOpportunity({ ...good, status: "archived" }), false);
  assert.equal(isOpportunity({ ...good, year: "2026" }), false);
  assert.equal(isOpportunity({ ...good, impactEur: "10" }), false);
  assert.equal(isOpportunity({ ...good, closedBy: "someone" }), false);
  assert.equal(isOpportunity(null), false);
});

test("editing is blocked when the account is locked or the seat is verifier or legal", () => {
  assert.equal(opportunityEditable(false, null), true);
  assert.equal(opportunityEditable(false, "member"), true);
  assert.equal(opportunityEditable(true, null), false);
  assert.equal(opportunityEditable(false, "verifier"), false);
  assert.equal(opportunityEditable(false, "legal"), false);
});
