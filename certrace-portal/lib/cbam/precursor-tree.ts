/* ════════════════════════════════════════════════════════════
   MULTI-TIER PRECURSORS (gap G4)

   A flat precursor list can describe "rebar is made from billet". It cannot
   describe what actually happened: ore → pig iron → billet → rebar, where the
   emissions of every tier are carried forward into the next. Real CBAM chains
   in iron & steel are two to four tiers deep, and a verifier testing precursor
   integrity follows them all the way up.

   So precursors are a TREE. Each node states how much of itself goes into one
   tonne of its PARENT's output, and the embedded emissions resolve depth-first
   from the leaves down (spec §5.4):

     SEE(n) = n.isScrap             → 0
            : n has no children     → n.seeDeclared
            : otherwise             → Σ children [ c.qtyPerTonneOutput × SEE(c) ]

     SEE_prec = Σ top-level nodes [ n.qtyPerTonneOutput × SEE(n) ]

   Two guards are not optional. Scrap short-circuits to zero BEFORE anything
   else is read, because a scrap input carries no embedded emissions under
   CBAM however carefully someone fills in a figure for it. And the traversal
   refuses cycles and depth beyond 10: a bill of materials mistyped into a loop
   would otherwise hang the browser rather than tell anyone it was wrong.
   ════════════════════════════════════════════════════════════ */

import { MAX_PRECURSOR_DEPTH } from "./reference";

export type PrecursorNode = {
  id: string;
  /** null = a direct input to the finished good */
  parentId: string | null;
  name: string;
  cnCode?: string;
  /** tonnes of this precursor per tonne of the PARENT's output */
  qtyPerTonneOutput: number;
  /** scrap and waste carry an embedded emission factor of exactly 0 */
  isScrap: boolean;
  /** tCO₂e/t — only meaningful on a leaf supplied by a supplier */
  seeDeclared?: number;
  /* ── The tier's OWN process, tCO₂e per tonne of THIS node's output ──
     Everything this step emitted itself: its furnace, its reheat, its power.
     NOT what it carried in from the tiers below — those are the children.

     This field exists because the model could not previously say it. An
     internal node's SEE was `Σ children (qty × SEE(child))` and nothing else,
     so a caster that melts purchased pig iron contributed the pig iron and
     none of its own furnace, and every multi-tier good came out low by the
     whole of every middle tier.

     The EU template has no such gap: InputOutput!AK71 evaluates
     `SEE(i) = SE(i) + Σ_j a(i,j)·SEE(j)`, and `SE(i)` is exactly this. See
     lib/cbam/leontief.ts, which implements that solve at installation level.

     Optional and defaulting to zero, so a chain entered before this existed
     still resolves to the number it resolved to yesterday. Zero is also the
     right answer for a pure trading tier that transforms nothing. */
  ownProcessSee?: number;
  /** production route, where known */
  route?: string;
  /** links to lib/supplier-records.ts */
  supplierRecordKey?: string;
  children: PrecursorNode[];
};

export class PrecursorTreeError extends Error {
  readonly code: "CYCLE" | "DEPTH";
  readonly nodeName: string;

  constructor(code: "CYCLE" | "DEPTH", message: string, nodeName: string) {
    super(message);
    this.name = "PrecursorTreeError";
    this.code = code;
    this.nodeName = nodeName;
  }
}

export const MAX_DEPTH = MAX_PRECURSOR_DEPTH.value;

export const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? `p-${crypto.randomUUID().slice(0, 8)}`
    : `p-${Math.random().toString(36).slice(2, 10)}`;

export const emptyNode = (parentId: string | null = null): PrecursorNode => ({
  id: uid(),
  parentId,
  name: "",
  cnCode: "",
  qtyPerTonneOutput: 0,
  isScrap: false,
  seeDeclared: undefined,
  ownProcessSee: undefined,
  route: "",
  children: [],
});

/* ── The calculation ────────────────────────────────────────────
   Pure, no I/O, unit-tested against the spec §5.6 fixture. */

/** Embedded emissions of ONE node, tCO₂e per tonne of that node's own output. */
export function seeForNode(
  node: PrecursorNode,
  ancestry: Set<string> = new Set(),
  depth = 1,
): number {
  if (depth > MAX_DEPTH) {
    throw new PrecursorTreeError(
      "DEPTH",
      `Precursor chain is more than ${MAX_DEPTH} tiers deep at "${node.name || "unnamed"}". Real iron & steel chains are 2–4 tiers — check for a row that points back into the chain.`,
      node.name,
    );
  }
  if (ancestry.has(node.id)) {
    throw new PrecursorTreeError(
      "CYCLE",
      `"${node.name || "unnamed"}" appears inside its own supply chain. A precursor cannot be made from itself — remove the loop before this can be calculated.`,
      node.name,
    );
  }

  // Scrap first, always: a scrap input has no embedded emissions to carry,
  // whatever is entered below it.
  if (node.isScrap) return 0;

  if (node.children.length === 0) {
    const declared = node.seeDeclared;
    return Number.isFinite(declared) && declared != null ? declared : 0;
  }

  /* SEE(i) = SE(i) + Σ_j qty(j) × SEE(j) — the tier's own process PLUS
     everything it carried in. Dropping the first term was the understatement
     described on `ownProcessSee` above. */
  const nextAncestry = new Set(ancestry);
  nextAncestry.add(node.id);
  let total = ownProcessSee(node);
  for (const child of node.children) {
    total +=
      child.qtyPerTonneOutput * seeForNode(child, nextAncestry, depth + 1);
  }
  return total;
}

/** The tier's own process emissions, defaulting to zero. A negative figure is
    read as zero rather than as a credit: CBAM has no mechanism by which a
    production step removes embedded emissions from the material passing
    through it, so a minus sign here is a typo, and letting it net off a real
    tier below would understate the good silently. */
export const ownProcessSee = (node: PrecursorNode): number => {
  const v = node.ownProcessSee;
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0;
};

export type NodeContribution = {
  id: string;
  name: string;
  depth: number;
  qtyPerTonneOutput: number;
  /** the node's own embedded emissions, tCO₂e/t of the node — own process
      plus everything carried in from its children */
  see: number;
  /** just the node's own process step, tCO₂e/t of the node. Printed beside
      `see` so a reader can tell a tier that transforms material from one that
      only passes it through. */
  ownSee: number;
  /** what this node adds to the finished good, tCO₂e per tonne of the GOOD */
  contribution: number;
  isScrap: boolean;
};

/** Σ over top-level nodes — the precursor share of the finished good's SEE,
    plus the per-node breakdown a reviewer needs to see where it came from. */
export function precursorSEE(roots: PrecursorNode[]): {
  perTonne: number;
  byNode: NodeContribution[];
} {
  const byNode: NodeContribution[] = [];
  let perTonne = 0;

  const walk = (
    node: PrecursorNode,
    depth: number,
    factorFromRoot: number,
    ancestry: Set<string>,
  ) => {
    const see = seeForNode(node, ancestry, depth);
    const contribution = factorFromRoot * node.qtyPerTonneOutput * see;
    byNode.push({
      id: node.id,
      name: node.name,
      depth,
      qtyPerTonneOutput: node.qtyPerTonneOutput,
      see,
      ownSee: node.isScrap
        ? 0
        : node.children.length === 0
          ? see
          : ownProcessSee(node),
      contribution,
      isScrap: node.isScrap,
    });
    const nextAncestry = new Set(ancestry);
    nextAncestry.add(node.id);
    for (const child of node.children) {
      walk(
        child,
        depth + 1,
        factorFromRoot * node.qtyPerTonneOutput,
        nextAncestry,
      );
    }
  };

  for (const root of roots) {
    perTonne += root.qtyPerTonneOutput * seeForNode(root);
    walk(root, 1, 1, new Set());
  }

  return { perTonne, byNode };
}

/** Mass balance: 1 / Σ(top-level qty per tonne). Below ~70% the bill of
    materials consumes more input than any real route needs; above 100% it
    claims to create mass. Validation V6 reads this. */
export function massBalanceYield(roots: PrecursorNode[]): number | null {
  const totalIn = roots.reduce((a, n) => a + n.qtyPerTonneOutput, 0);
  return totalIn > 0 ? 1 / totalIn : null;
}

/** Depth-first walk with no arithmetic — used by editors and the dossier. */
export function flattenTree(
  roots: PrecursorNode[],
): { node: PrecursorNode; depth: number }[] {
  const out: { node: PrecursorNode; depth: number }[] = [];
  const walk = (nodes: PrecursorNode[], depth: number) => {
    if (depth > MAX_DEPTH) return;
    for (const n of nodes) {
      out.push({ node: n, depth });
      walk(n.children, depth + 1);
    }
  };
  walk(roots, 1);
  return out;
}

export const treeDepth = (roots: PrecursorNode[]): number =>
  roots.reduce(
    (max, n) =>
      Math.max(
        max,
        1 + (n.children.length ? treeDepth(n.children) - 1 + 1 : 0),
      ),
    0,
  );

/* ── Editing ────────────────────────────────────────────────────
   Immutable helpers so React state updates stay predictable. */

export function updateNode(
  roots: PrecursorNode[],
  id: string,
  patch: Partial<PrecursorNode>,
): PrecursorNode[] {
  return roots.map((n) =>
    n.id === id
      ? { ...n, ...patch, id: n.id, children: patch.children ?? n.children }
      : { ...n, children: updateNode(n.children, id, patch) },
  );
}

export function addChild(
  roots: PrecursorNode[],
  parentId: string,
): PrecursorNode[] {
  return roots.map((n) =>
    n.id === parentId
      ? { ...n, children: [...n.children, emptyNode(n.id)] }
      : { ...n, children: addChild(n.children, parentId) },
  );
}

/** Removing a node removes everything under it — a subtree is one claim. */
export function removeSubtree(
  roots: PrecursorNode[],
  id: string,
): PrecursorNode[] {
  return roots
    .filter((n) => n.id !== id)
    .map((n) => ({ ...n, children: removeSubtree(n.children, id) }));
}

/* ── Storage & migration ────────────────────────────────────────
   The tree lives in the same `${productId}::precursors` value key the flat
   rows always used, so nothing about the supplier store changes. Three shapes
   can come back out of it and all three must keep working:

     free text          → null, exactly as before (parsePrecursors' contract)
     flat PrecursorRow[]→ migrated to one level of nodes, parentId null
     PrecursorNode[]    → read as-is

   The flat→tree migration is lossless: a flat row is a leaf. */

type LegacyRow = {
  name?: unknown;
  cn?: unknown;
  qty?: unknown;
  see?: unknown;
  route?: unknown;
};

const isNodeShape = (v: unknown): boolean =>
  typeof v === "object" &&
  v !== null &&
  ("children" in (v as object) || "qtyPerTonneOutput" in (v as object));

function fromLegacyRow(r: LegacyRow): PrecursorNode {
  const name = String(r?.name ?? "");
  return {
    id: uid(),
    parentId: null,
    name,
    cnCode: String(r?.cn ?? ""),
    qtyPerTonneOutput: Number(r?.qty ?? 0) || 0,
    /* Legacy rows carry no scrap flag, and inferring one from the name would
       be a guess that silently rewrites a filed number. Migrate as declared;
       the editor nudges when a row looks like scrap but isn't marked. */
    isScrap: false,
    seeDeclared: Number(r?.see ?? 0) || 0,
    route: String(r?.route ?? ""),
    children: [],
  };
}

function reviveNode(
  v: Record<string, unknown>,
  parentId: string | null,
): PrecursorNode {
  const id = typeof v.id === "string" && v.id ? v.id : uid();
  const rawChildren = Array.isArray(v.children)
    ? (v.children as Record<string, unknown>[])
    : [];
  return {
    id,
    parentId,
    name: String(v.name ?? ""),
    cnCode: String(v.cnCode ?? v.cn ?? ""),
    qtyPerTonneOutput: Number(v.qtyPerTonneOutput ?? v.qty ?? 0) || 0,
    isScrap: Boolean(v.isScrap),
    seeDeclared:
      v.seeDeclared == null && v.see == null
        ? undefined
        : Number(v.seeDeclared ?? v.see) || 0,
    route: String(v.route ?? ""),
    supplierRecordKey:
      typeof v.supplierRecordKey === "string" ? v.supplierRecordKey : undefined,
    children: rawChildren.map((c) => reviveNode(c, id)),
  };
}

/** Parse a stored precursors value into a tree. Returns null for legacy free
    text — the same signal `parsePrecursors` has always given. */
export function parsePrecursorTree(
  raw: string | undefined | null,
): PrecursorNode[] | null {
  if (!raw || !raw.trim().startsWith("[")) return null;
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return null;
    if (arr.length === 0) return [];
    return arr.some(isNodeShape)
      ? (arr as Record<string, unknown>[]).map((v) => reviveNode(v, null))
      : (arr as LegacyRow[]).map(fromLegacyRow);
  } catch {
    return null;
  }
}

export const serializePrecursorTree = (roots: PrecursorNode[]): string =>
  JSON.stringify(roots);

/** A node counts toward the calculation once it is named, has a quantity, and
    either declares its own SEE, is scrap, or has children that do. */
export function nodeComplete(n: PrecursorNode): boolean {
  if (!n.name.trim() || !(n.qtyPerTonneOutput > 0)) return false;
  if (n.isScrap) return true;
  if (n.children.length > 0) return n.children.some(nodeComplete);
  return Number.isFinite(n.seeDeclared) && (n.seeDeclared ?? 0) > 0;
}

/** Human-readable, indented — review screens, PDF, XML fallback. */
export function formatTree(roots: PrecursorNode[]): string {
  return flattenTree(roots)
    .filter(({ node }) => node.name.trim())
    .map(({ node, depth }) => {
      const indent = "  ".repeat(depth - 1);
      const cn = node.cnCode?.trim() ? ` (CN ${node.cnCode})` : "";
      const see = node.isScrap
        ? "0 tCO₂e/t (scrap)"
        : node.children.length
          ? "derived from inputs"
          : `${node.seeDeclared ?? "?"} tCO₂e/t`;
      const route = node.route?.trim() ? ` · ${node.route}` : "";
      return `${indent}${depth > 1 ? "└ " : ""}${node.name}${cn} — ${node.qtyPerTonneOutput || "?"} t/t × ${see}${route}`;
    })
    .join("\n");
}

/** A row that looks like scrap but isn't flagged. Surfaced as a prompt in the
    editor, never applied automatically — the difference between helping and
    silently rewriting someone's declaration. */
export const looksLikeScrap = (n: PrecursorNode): boolean =>
  !n.isScrap && /\b(scrap|waste|swarf|turnings|offcut)\b/i.test(n.name);
