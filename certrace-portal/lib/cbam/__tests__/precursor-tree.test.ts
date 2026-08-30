/* Precursor chains: the §5.6 fixture, a real 3-tier chain, and the two ways a
   mistyped bill of materials used to be able to hang the browser. */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parsePrecursorTree,
  serializePrecursorTree,
  precursorSEE,
  seeForNode,
  massBalanceYield,
  flattenTree,
  PrecursorTreeError,
  MAX_DEPTH,
  emptyNode,
  type PrecursorNode,
} from "../precursor-tree";
import { parsePrecursors, precursorContribution } from "../../precursors";

const node = (p: Partial<PrecursorNode> & { id: string; name: string }): PrecursorNode => ({
  parentId: null,
  cnCode: "",
  qtyPerTonneOutput: 0,
  isScrap: false,
  route: "",
  children: [],
  ...p,
});

test("golden fixture — scrap forces 0, pig iron carries 0.0950000", () => {
  const roots: PrecursorNode[] = [
    node({ id: "scrap", name: "Steel scrap", qtyPerTonneOutput: 1.08, isScrap: true, seeDeclared: 9.99 }),
    node({ id: "pig", name: "Pig iron", cnCode: "7201 10 90", qtyPerTonneOutput: 0.05, seeDeclared: 1.9 }),
  ];

  const { perTonne, byNode } = precursorSEE(roots);

  // isScrap short-circuits BEFORE seeDeclared is read — the 9.99 is ignored.
  assert.equal(seeForNode(roots[0]), 0);
  assert.equal(byNode.find((n) => n.id === "scrap")!.contribution, 0);
  assert.ok(Math.abs(byNode.find((n) => n.id === "pig")!.contribution - 0.095) < 1e-9);
  assert.ok(Math.abs(perTonne - 0.095) < 1e-6, `expected 0.0950000, got ${perTonne}`);
});

test("mass-balance yield matches the fixture's 88.50%", () => {
  const roots: PrecursorNode[] = [
    node({ id: "scrap", name: "Steel scrap", qtyPerTonneOutput: 1.08, isScrap: true }),
    node({ id: "pig", name: "Pig iron", qtyPerTonneOutput: 0.05, seeDeclared: 1.9 }),
  ];
  const yieldPct = massBalanceYield(roots)! * 100;
  assert.ok(Math.abs(yieldPct - 88.4956) < 0.01, `expected ≈88.50%, got ${yieldPct}`);
});

test("a 3-tier chain resolves depth-first: ore → pig iron → billet", () => {
  /* 1 t billet takes 1.05 t pig iron; 1 t pig iron takes 1.6 t sintered ore at
     0.20 tCO₂e/t. So pig iron = 1.6 × 0.20 = 0.32, and billet's precursor
     share = 1.05 × 0.32 = 0.336. The typed 1.90 on pig iron is ignored the
     moment it has children — a derived tier cannot also be declared. */
  const roots: PrecursorNode[] = [
    node({
      id: "pig",
      name: "Pig iron",
      qtyPerTonneOutput: 1.05,
      seeDeclared: 1.9,
      children: [node({ id: "ore", parentId: "pig", name: "Sintered iron ore", qtyPerTonneOutput: 1.6, seeDeclared: 0.2 })],
    }),
  ];

  assert.ok(Math.abs(seeForNode(roots[0]) - 0.32) < 1e-9);
  const { perTonne, byNode } = precursorSEE(roots);
  assert.ok(Math.abs(perTonne - 0.336) < 1e-9, `expected 0.336, got ${perTonne}`);
  assert.equal(byNode.length, 2);
  assert.equal(byNode[1].depth, 2);
  assert.equal(flattenTree(roots).length, 2);
});

test("a cycle throws instead of recursing", () => {
  const parent: PrecursorNode = node({ id: "a", name: "Billet", qtyPerTonneOutput: 1 });
  const child: PrecursorNode = node({ id: "b", parentId: "a", name: "Pig iron", qtyPerTonneOutput: 1 });
  // b's child is a again — the loop a mistyped BOM produces.
  child.children = [parent];
  parent.children = [child];

  assert.throws(() => seeForNode(parent), (err: unknown) => err instanceof PrecursorTreeError && err.code === "CYCLE");
});

test("a chain deeper than the cap throws rather than running forever", () => {
  let deepest = node({ id: `n${MAX_DEPTH + 2}`, name: "leaf", qtyPerTonneOutput: 1, seeDeclared: 1 });
  for (let i = MAX_DEPTH + 1; i >= 1; i--) {
    deepest = node({ id: `n${i}`, name: `tier ${i}`, qtyPerTonneOutput: 1, children: [deepest] });
  }
  assert.throws(() => seeForNode(deepest), (err: unknown) => err instanceof PrecursorTreeError && err.code === "DEPTH");
});

test("legacy flat rows migrate to one tier; legacy prose still returns null", () => {
  const flat = JSON.stringify([{ name: "Pig iron", cn: "7201 10 90", qty: "0.05", see: "1.90", route: "BF route" }]);
  const migrated = parsePrecursorTree(flat)!;
  assert.equal(migrated.length, 1);
  assert.equal(migrated[0].parentId, null);
  assert.deepEqual(migrated[0].children, []);
  assert.equal(migrated[0].qtyPerTonneOutput, 0.05);
  assert.equal(migrated[0].seeDeclared, 1.9);
  assert.equal(migrated[0].isScrap, false); // never inferred from the name

  // parsePrecursors keeps its exact contract for free text.
  assert.equal(parsePrecursors("mostly scrap plus some pig iron"), null);
  assert.equal(parsePrecursorTree("mostly scrap plus some pig iron"), null);
});

test("precursorContribution reads flat rows and trees through one implementation", () => {
  const flat = JSON.stringify([{ name: "Pig iron", cn: "", qty: "0.4", see: "0.55", route: "" }]);
  assert.ok(Math.abs(precursorContribution(flat) - 0.22) < 1e-9);

  const tree = serializePrecursorTree([
    node({
      id: "pig",
      name: "Pig iron",
      qtyPerTonneOutput: 1.05,
      children: [node({ id: "ore", parentId: "pig", name: "Ore", qtyPerTonneOutput: 1.6, seeDeclared: 0.2 })],
    }),
  ]);
  assert.ok(Math.abs(precursorContribution(tree) - 0.336) < 1e-9);

  assert.equal(precursorContribution("free text"), 0);
});

test("a serialised tree round-trips", () => {
  const roots: PrecursorNode[] = [
    node({
      id: "pig",
      name: "Pig iron",
      cnCode: "7201 10 90",
      qtyPerTonneOutput: 1.05,
      children: [node({ id: "ore", parentId: "pig", name: "Sintered ore", qtyPerTonneOutput: 1.6, seeDeclared: 0.2 })],
    }),
    node({ id: "scrap", name: "Steel scrap", qtyPerTonneOutput: 0.3, isScrap: true }),
  ];
  const back = parsePrecursorTree(serializePrecursorTree(roots))!;
  assert.equal(back.length, 2);
  assert.equal(back[0].children.length, 1);
  assert.equal(back[0].children[0].parentId, back[0].id);
  assert.equal(back[1].isScrap, true);
  assert.ok(Math.abs(precursorSEE(back).perTonne - precursorSEE(roots).perTonne) < 1e-12);
});

/* ── An intermediate tier's own process ──────────────────────────
   `ownProcessSee` closes the gap between this tree and the EU template's
   `SEE(i) = SE(i) + Σ_j a(i,j)·SEE(j)` (InputOutput!AK71). Before it existed
   an internal node contributed only its children, so every middle tier's
   furnace vanished from the filed figure. */

test("an intermediate tier's own process is added, not dropped", () => {
  const billet: PrecursorNode = {
    ...emptyNode(),
    name: "Billet",
    qtyPerTonneOutput: 1.05,
    ownProcessSee: 0.3, // the caster's own furnace
    children: [{ ...emptyNode(), name: "Pig iron", qtyPerTonneOutput: 1.1, seeDeclared: 1.5 }],
  };
  // SEE(billet) = 0.30 + 1.1 × 1.50 = 1.95 ; contribution = 1.05 × 1.95
  assert.ok(Math.abs(seeForNode(billet) - 1.95) < 1e-9, `expected 1.95, got ${seeForNode(billet)}`);
  const { perTonne } = precursorSEE([billet]);
  assert.ok(Math.abs(perTonne - 1.05 * 1.95) < 1e-9, `expected ${1.05 * 1.95}, got ${perTonne}`);
});

test("omitting ownProcessSee changes nothing for chains entered before it existed", () => {
  const billet: PrecursorNode = {
    ...emptyNode(),
    name: "Billet",
    qtyPerTonneOutput: 1.05,
    children: [{ ...emptyNode(), name: "Pig iron", qtyPerTonneOutput: 1.1, seeDeclared: 1.5 }],
  };
  assert.ok(Math.abs(seeForNode(billet) - 1.65) < 1e-9, "children-only, exactly as before");
});

test("a negative own-process figure is read as zero rather than as a credit", () => {
  const n: PrecursorNode = {
    ...emptyNode(),
    name: "Trader",
    qtyPerTonneOutput: 1,
    ownProcessSee: -5,
    children: [{ ...emptyNode(), name: "Billet", qtyPerTonneOutput: 1, seeDeclared: 2 }],
  };
  assert.equal(seeForNode(n), 2);
});

test("scrap still short-circuits to zero even with an own-process figure", () => {
  const n: PrecursorNode = { ...emptyNode(), name: "Scrap", qtyPerTonneOutput: 1, isScrap: true, ownProcessSee: 9 };
  assert.equal(seeForNode(n), 0);
});
