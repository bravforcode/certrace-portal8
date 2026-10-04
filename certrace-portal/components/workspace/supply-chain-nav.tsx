"use client";

/* ════════════════════════════════════════════════════════════
   SUPPLY CHAIN — the part of the sidebar that belongs to one workspace

   Standing inside one product, the sidebar shows that product's chain:
   "Supply Chain" at the top, doing exactly what the Supply Chain button in
   the tab strip does, then every node of the tree beneath it in tree order,
   then Add precursor pinned below the last one.

   IT SITS UNDER "VERIFICATION" IN THE MAIN MENU — IT DOES NOT REPLACE IT.
   This list used to take the whole sidebar over: open a workspace and
   Dashboard, Smart Links and Reports were gone, with one back link where
   eight destinations had been. That was argued for on height, and it cost
   the reader the one thing a sidebar is for — the same map in the same
   place on every screen. Somebody who wanted Smart Links from inside a
   month had to work out that they first needed to leave, and nothing on
   screen said where "here" was in the product. So the menu now stays put
   and the chain opens beneath the item it is part of (see PortalShell), the
   way a folder opens in a file list. The way out of a workspace is the
   Verification row directly above, which is why this list no longer
   carries a back link of its own.

   THE LIST IS THE TREE, not a second reading of it. It renders
   buildSupplierPrecursorTree() (lib/supplier-tree.ts) — the same call the
   Tree page itself makes — flattened and indented by tier, so the first row
   is always the installation this product is made at (the exporter's own
   site, or the supplier's), exactly as it is at the top of the tree on the
   page. There is no state here that the page could disagree with, and no
   sibling product: the chain belongs to the one product you are inside.

   A NODE IN THIS LIST IS A PLACE, NOT A SCROLL POSITION. Clicking one used
   to put ?node=<id> on the chain page and scroll that card into view, which
   left the reader on a page whose tab strip was about a different entity
   entirely. Each node now opens its own page instead — its own identity, its
   own status, its own four tabs — via entityHref() (lib/tree-entity.ts),
   which sends a node that already HAS a workspace straight into that
   workspace rather than to a detail page in front of it. The root
   installation always does: it IS this product's workspace.

   The ?node= parameter still works: the chain page still reads it and still
   scrolls, so older links and anything else that emits one keep behaving.

   ── EVERY ROW CARRIES A `+`, AND THAT IS WHERE ADDING A TIER LIVES NOW ──
   The chain page's rows used to end with an "Add precursor" button, one per
   row, and it was the only control in that strip that CREATED something
   rather than reading the row it sat on. Here it costs nothing: the list is
   already the tree, so "one tier under THIS supplier" is a position the
   reader can see rather than a sentence they have to trust. Press the `+`
   against any supplier or precursor and the new row appears indented
   directly beneath it.

   IT IS A LINK, NOT A SECOND DIALOG. `?add=<nodeId>` on the chain page opens
   the page's own Add-precursor dialog parented on that node — the same
   dialog, the same cycle check, the same write. A copy of it here would be a
   second place for those three rules to drift. It is deliberately NOT nested
   inside the row's own <Link>: an anchor inside an anchor is invalid HTML and
   the browser resolves it by dropping one of them, so the two sit side by
   side in a flex row that as a whole looks like the row.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CornerDownRight, Factory, ListTree, Plus } from "lucide-react";
import { cn } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { entityHref } from "@/lib/tree-entity";
import { buildSupplierPrecursorTree } from "@/lib/supplier-tree";
import { TREE_CHANGED_EVENT } from "@/lib/tree-events";
import type { TreeNode } from "@/types/supplier-tree";

/** The workspace a portal pathname is inside, or null. `/workspaces` (the
    list) and `/workspaces/new` (the wizard) are not workspaces — neither has
    a chain to show, and `new` would be read as an id. */
export function workspaceIdFromPath(pathname: string): string | null {
  const m = /^\/workspaces\/([^/]+)/.exec(pathname);
  if (!m) return null;
  return m[1] === "new" ? null : decodeURIComponent(m[1]);
}

type Row = { node: TreeNode; depth: number };

function flattenTree(nodes: TreeNode[], depth = 0, out: Row[] = []): Row[] {
  for (const n of nodes) {
    out.push({ node: n, depth });
    flattenTree(n.children, depth + 1, out);
  }
  return out;
}

const NODE_ICON = {
  installation: Factory,
  precursor: CornerDownRight,
} as const;

export function SupplyChainNav({ workspaceId, onNavigate }: { workspaceId: string; onNavigate?: () => void }) {
  const t = useT();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [rows, setRows] = React.useState<Row[]>([]);

  // localStorage-backed, so nothing exists on the server render — read after
  // mount, and again whenever the chain is edited on the page beside this.
  const reload = React.useCallback(() => setRows(flattenTree(buildSupplierPrecursorTree(workspaceId))), [workspaceId]);

  React.useEffect(() => {
    reload();
    window.addEventListener(TREE_CHANGED_EVENT, reload);
    return () => window.removeEventListener(TREE_CHANGED_EVENT, reload);
  }, [reload]);

  const treeHref = `/workspaces/${workspaceId}/tree`;
  /* Where the `+` on a row points. Always the CHAIN page, never the entity
     page the row itself opens: the dialog lives on the chain page, and the
     new tier is only visible in a list that draws the whole chain. */
  const addHref = (nodeId: string) => `${treeHref}?add=${encodeURIComponent(nodeId)}`;
  // The chain page and an entity page under it are two different rows in this
  // list, so they are two different tests: `startsWith` for both would light
  // "Supply Chain" and the node at the same time, which reads as being in two
  // places at once.
  const onChain = pathname === treeHref;
  const onEntityPage = pathname.startsWith(`${treeHref}/`);
  const selected = searchParams.get("node");

  // The chain's root installation — where a precursor added from the sidebar
  // hangs, the same parent the Tree page's own Add precursor uses.
  const rootNode = rows.find((r) => r.node.kind === "installation")?.node ?? null;

  return (
    <nav className="flex flex-col gap-0.5" aria-label={t("Supply chain")}>
      {/* Same destination as the Supply Chain button in the tab strip. */}
      <Link
        href={treeHref}
        onClick={onNavigate}
        className={cn(
          "flex min-h-10 items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] leading-snug transition-colors",
          onChain ? "bg-black/[0.06] font-medium text-black" : "text-black/60 hover:bg-black/[0.03] hover:text-black",
        )}
      >
        <ListTree size={16} strokeWidth={1.5} className="flex-none" />
        {t("Supply Chain")}
      </Link>

      <div className="mt-0.5 flex flex-col gap-0.5">
        {rows.map(({ node, depth }) => {
          const Icon = NODE_ICON[node.kind];
          const href = entityHref(node, workspaceId);
          // Highlighted when you are standing ON that entity — including
          // deeper inside it, so a product node stays lit across its own
          // Monthly data and Readiness tabs rather than only on its Overview.
          const active =
            onChain || onEntityPage ? pathname === href || selected === node.id : pathname === href || pathname.startsWith(`${href}/`);
          return (
            /* `group` so the `+` can stay quiet until the row is pointed at,
               and `focus-within` so it is never quiet for a keyboard — a
               control that only exists on hover is a control a keyboard user
               does not have. On touch there is no hover at all, which is why
               the resting opacity is 40% rather than 0: visible enough to be
               found, faint enough not to compete with the name. */
            <div
              key={node.id}
              className={cn(
                "group flex items-center gap-0.5 rounded-lg pr-1 transition-colors",
                active ? "bg-black/[0.05]" : "hover:bg-black/[0.03]",
              )}
            >
              <Link
                href={href}
                onClick={onNavigate}
                title={node.name}
                className={cn(
                  "flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-lg py-1.5 text-[12.5px] transition-colors",
                  active ? "font-medium text-black" : "text-black/60 group-hover:text-black",
                )}
                // Indent by tier rather than by a nested list: the chain can run
                // several tiers deep and a nested <ul> per tier would push the
                // deepest names off the sidebar entirely.
                style={{ paddingLeft: 12 + depth * 12 }}
              >
                <Icon size={13} strokeWidth={1.5} className="flex-none opacity-70" />
                <span className="truncate">{node.name || t("Unnamed")}</span>
              </Link>
              {/* A cyclic row cannot take a child — the same guard the row
                  buttons used to apply — so it gets no `+` rather than one
                  that opens a dialog which then refuses. */}
              {!node.cyclicReference && (
                <Link
                  href={addHref(node.id)}
                  onClick={onNavigate}
                  aria-label={t("Add a precursor under {name}", { name: node.name || t("Unnamed") })}
                  title={t("Add a precursor under {name}", { name: node.name || t("Unnamed") })}
                  className="grid h-8 w-8 flex-none place-items-center rounded-md text-black/40 opacity-60 transition-all hover:bg-black/[0.06] hover:text-black focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Plus size={15} strokeWidth={1.75} />
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Always below the last node in the chain, and parented on the ROOT —
          the tier-1 shortcut, for the common case of adding a direct input to
          the installation without having to find its row first. Every other
          tier is the `+` on the row it hangs from. `?add=1` still resolves to
          the root, so links from before the parameter took a node id keep
          working. */}
      <Link
        href={rootNode ? addHref(rootNode.id) : `${treeHref}?add=1`}
        onClick={onNavigate}
        aria-disabled={rootNode == null}
        className={cn(
          "mt-1.5 flex min-h-10 items-center gap-2 rounded-lg border border-dashed border-black/15 px-3 py-2 text-[12px] text-black/60 transition-colors hover:border-black/30 hover:text-black",
          rootNode == null && "pointer-events-none opacity-40",
        )}
      >
        <Plus size={14} strokeWidth={1.5} /> {t("Add precursor")}
      </Link>
    </nav>
  );
}
