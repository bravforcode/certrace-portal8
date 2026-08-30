/* ════════════════════════════════════════════════════════════
   CYCLE DETECTION FOR THE SUPPLIER AND PRECURSOR TREE — INSTANCE-BASED

   "Iron or steel products" can legitimately be its own precursor: rebar
   (CN 7318) can be consumed to make a different rebar product, from a
   different mill. Blocking on CN code / product category would refuse that
   real chain. What actually has to be refused is the SAME real-world
   supplier/installation appearing twice in one ancestor chain — regardless
   of what CN code it's named under this time.

   THIS IS A PRE-WRITE CHECK, deliberately distinct from what already exists.
   lib/precursor-suppliers.ts's `treeFor()` already detects a cycle, but only
   reactively — it throws while walking a tree that has ALREADY been saved,
   keyed on PrecursorSupplier.id (the row), not on real-world identity. Two
   different rows naming the same actual installation would sail straight
   through that check, because they are two different ids. wouldCreateCycle()
   below is asked BEFORE a new edge is committed, and blocks on entity
   identity (lib/supplier-tree.ts's precursorEntityId) instead.
   ════════════════════════════════════════════════════════════ */

import type { TreeNode } from "@/types/supplier-tree";

export type CycleCheckResult = { cycle: boolean; conflictingNode?: TreeNode };

/** Every node in `roots`, flattened, keyed by id — built once per call
    rather than walked repeatedly, since a deep chain checked node-by-node
    while the user is filling in an "Add Precursor" form should not get
    slower the more precursors already exist. */
function indexById(roots: TreeNode[]): Map<string, TreeNode> {
  const byId = new Map<string, TreeNode>();
  const visit = (n: TreeNode) => {
    byId.set(n.id, n);
    for (const c of n.children) visit(c);
  };
  for (const r of roots) visit(r);
  return byId;
}

/** Would adding a precursor identified by `candidateEntityId` under
    `targetParentNodeId` create a cycle? Walks from the target parent UP to
    the root via `parentNodeId`, comparing `entityId` at every ancestor —
    never `cnCode`, never `name` alone. `roots` is normally the whole tree
    returned by `buildSupplierPrecursorTree()`; passing a single root works
    identically since only ancestors of `targetParentNodeId` are ever
    visited. */
export function wouldCreateCycle(roots: TreeNode[], targetParentNodeId: string, candidateEntityId: string): CycleCheckResult {
  const byId = indexById(roots);
  let current = byId.get(targetParentNodeId) ?? null;

  // The target parent's OWN entity (if it's itself a precursor node, not the
  // product/installation root) counts as the first ancestor to check —
  // otherwise adding a precursor directly under a node naming the same
  // entity as itself would slip through.
  while (current) {
    if (current.entityId === candidateEntityId) return { cycle: true, conflictingNode: current };
    current = current.parentNodeId ? (byId.get(current.parentNodeId) ?? null) : null;
  }
  return { cycle: false };
}
