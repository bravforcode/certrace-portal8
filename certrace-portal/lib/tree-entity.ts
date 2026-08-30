/* ════════════════════════════════════════════════════════════
   ONE NODE OF THE CHAIN, AS A PLACE YOU CAN STAND

   The Supply Chain page shows MANY objects at once — the installation the
   product is made at, and every tier of precursor beneath it. The
   Overview / Monthly data / Readiness / Settings strip describes ONE object.
   Putting the strip above a page that shows many of them was a scope
   mismatch: whichever entity the reader was looking at, the tabs answered
   about a different one.

   So the strip belongs to an ENTITY, and this module is the single answer to
   "which entity is this node, where does its own page live, and which of the
   four tabs can it actually open".

   No new store. Everything here is derived from the tree lib/supplier-tree.ts
   already builds and the PrecursorSupplier rows it is built from.
   ════════════════════════════════════════════════════════════ */

import { buildSupplierPrecursorTree } from "./supplier-tree";
import { getSupplier, listSuppliers, type PrecursorSupplier } from "./precursor-suppliers";
import { listWorkspaces } from "./workspace";
import type { TreeNode } from "@/types/supplier-tree";

/** The workspace that IS this entity, when one exists.

    THE CHAIN'S ROOT INSTALLATION IS THE PRODUCT'S WORKSPACE. A chain belongs
    to one product (lib/supplier-tree.ts), and that product is made at exactly
    one site — so the root's months, MMD, readiness and settings are the
    workspace's own, and its four tabs are the real four. It used to be a
    grouping of every product at the site, which genuinely had no reporting
    year of its own; scoping the chain to one product is what gave it one.

    A precursor becomes a workspace the moment the exporter creates one for it
    (`linkedWorkspaceId`, set by "Track report" on the chain row), and
    from then on it has real months, a real MMD and a real readiness too. Any
    other precursor has none, and gets its own detail page instead. */
export function entityWorkspaceId(node: TreeNode): string | null {
  if (node.kind === "installation") return node.workspaceId ?? null;
  if (node.kind === "precursor" && node.workspaceId) return getSupplier(node.workspaceId, node.id)?.linkedWorkspaceId ?? null;
  return null;
}

/** Where clicking this node in the chain (sidebar or card) should land.

    An entity backed by a workspace goes STRAIGHT INTO that workspace — its
    Overview is the real one, with the real tabs, and a second detail page in
    front of it would only be a page you click through. That is the chain's
    root installation every time, which is exactly the intended landing: the
    chain page names the product and lists the chain, and clicking the site
    that makes it opens the four tabs where the year's work actually happens.
    Everything else gets its own page under the chain it belongs to. */
export function entityHref(node: TreeNode, chainWorkspaceId: string): string {
  const ws = entityWorkspaceId(node);
  return ws ? `/workspaces/${ws}` : `/workspaces/${chainWorkspaceId}/tree/${entitySegment(node)}`;
}

/** The URL segment that names a node on its own page.

    An installation node's id is the synthetic `installation:<installationId>`
    (lib/supplier-tree.ts), and a percent-encoded colon in a path segment is
    404'd before it ever reaches the route. There is exactly one installation
    root per chain — the chain is built FROM it — so the segment doesn't need
    to carry the id at all; the literal word resolves to the root. Precursor
    ids are `ps-<hex>` and go through unchanged. */
export const INSTALLATION_SEGMENT = "installation";

export const entitySegment = (node: TreeNode): string =>
  node.kind === "installation" ? INSTALLATION_SEGMENT : encodeURIComponent(node.id);

/** This node, found anywhere in its chain, by the segment entitySegment()
    wrote. Returns null for a segment that isn't in the tree — a stale
    bookmark, or a precursor deleted since. */
export function findChainNode(chainWorkspaceId: string, segment: string): TreeNode | null {
  const roots = buildSupplierPrecursorTree(chainWorkspaceId);
  if (segment === INSTALLATION_SEGMENT) return roots[0] ?? null;
  const walk = (nodes: TreeNode[]): TreeNode | null => {
    for (const n of nodes) {
      if (n.id === segment) return n;
      const hit = walk(n.children);
      if (hit) return hit;
    }
    return null;
  };
  return walk(roots);
}

export type EntityTabSpec = {
  key: "overview" | "monthly" | "readiness" | "settings";
  label: string;
  /** set when the tab is a real destination for THIS entity */
  href?: string;
  /** set instead of `href` — why it can't be opened, and what would open it */
  lockedReason?: string;
};

/* Every entity shows the same four tabs, in the same order, whether or not
   it can open all of them.

   The alternative — hiding what an entity hasn't got — makes the strip a
   different shape on every node, and the reader has to re-read it each time
   instead of learning it once. A tab that is present and locked also says
   something a missing tab cannot: that this entity is the kind of thing that
   HAS monthly data, and exactly what would unlock it. Which is the sentence
   in `lockedReason`, shown on the tab and again on the page. */
export function entityTabs(node: TreeNode, chainWorkspaceId: string): EntityTabSpec[] {
  const ws = entityWorkspaceId(node);
  if (ws) {
    return [
      { key: "overview", label: "Overview", href: `/workspaces/${ws}` },
      { key: "monthly", label: "Monthly data", href: `/workspaces/${ws}/monthly` },
      { key: "readiness", label: "Readiness", href: `/workspaces/${ws}/readiness` },
      { key: "settings", label: "Settings", href: `/workspaces/${ws}/settings` },
    ];
  }

  // Only ever a precursor: the root installation always has a workspace (see
  // entityWorkspaceId above), so it always takes the four real tabs.
  const locked = "This precursor has no workspace of its own yet. Track a report for it and its own months, readiness and settings open here.";

  return [
    { key: "overview", label: "Overview", href: `/workspaces/${chainWorkspaceId}/tree/${entitySegment(node)}` },
    { key: "monthly", label: "Monthly data", lockedReason: locked },
    { key: "readiness", label: "Readiness", lockedReason: locked },
    { key: "settings", label: "Settings", lockedReason: locked },
  ];
}

/* ── WHERE A TRACKED PRECURSOR CAME FROM ────────────────────────
   "Track report" on a chain row opens a REAL workspace for that precursor
   (see components/chain-actions.tsx), and from the inside that workspace is
   indistinguishable from one the exporter opened for their own good — the
   same four tabs, the same pipeline, deliberately.

   It is reached from somewhere else, though, and that is the difference this
   function exists for. A precursor's workspace is opened from ONE place: its
   row on the parent product's supply chain, standing beside every other
   supplier in that chain. Sending the reader "back" into the precursor's own
   chain — one installation, no siblings — returns them to a page that
   contains a single row and none of the context they left, and the way out of
   it is two more clicks up through the estate list.

   So: back, from anywhere inside a tracked precursor's workspace, is the
   PARENT chain, with that precursor's own row named on the address so the
   page scrolls to it. That is where the click came from, and it is the page
   with all the other suppliers on it.

   ONE PASS OVER EVERY CHAIN. `linkedWorkspaceId` lives on the precursor row,
   so the question "who links to this workspace" can only be answered by
   looking — there is no back-pointer on the workspace, and adding one would
   be a second copy of the same fact to keep in step. Chains are small (a
   handful of rows each) and this runs once per navigation. */
export type TrackedParent = {
  /** the workspace whose chain this precursor hangs in */
  workspaceId: string;
  /** the precursor row itself, for its name */
  precursor: PrecursorSupplier;
};

export function trackedParentOf(workspaceId: string): TrackedParent | null {
  for (const w of listWorkspaces()) {
    if (w.id === workspaceId) continue;
    for (const s of listSuppliers(w.id)) {
      if (s.linkedWorkspaceId === workspaceId) return { workspaceId: w.id, precursor: s };
    }
  }
  return null;
}

/** The parent chain's address, with the precursor's row selected on it.
    `?node=` is what the chain page already reads to scroll a card into view
    (components/workspace/chain-editor.tsx), so this needs nothing new on the
    receiving end. */
export const trackedParentChainHref = (parent: TrackedParent): string =>
  `/workspaces/${parent.workspaceId}/tree?node=${encodeURIComponent(parent.precursor.id)}`;
