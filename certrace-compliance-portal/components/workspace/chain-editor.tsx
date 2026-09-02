"use client";

/* ════════════════════════════════════════════════════════════
   THE CHAIN, EDITED — one component, two scopes

   Everything that CHANGES the precursor chain lives here: Enter Verified
   Data, Send / Resend the Smart Link, Add Precursor, and the modals behind
   all three. It is one component because the Supply Chain page and an
   entity's own page both offer the same actions on the same rows, and two
   copies of "reuse the token, stamp smartLinkSentAt once, copy the URL" is
   two places for that rule to drift.

   `rootNodeId` is the only difference between the two callers:

     · omitted  → the whole chain, from the installation the product is made
                  at down (the Supply Chain page).
     · set      → that node and what hangs beneath it (an entity's page) —
                  the same cards, the same handlers, just a narrower window
                  onto the same tree.

   `view` picks the layout, and only the layout: the same rows, the same
   handlers and the same modals either way (components/tree-table.tsx). The
   switch itself lives on the page rather than in here, because it belongs
   beside the page's own heading — and because an entity's page shows one
   node, where "tree or table" is not a question worth asking.

   Extracted from app/(portal)/workspaces/[id]/tree/page.tsx, which is now a
   thin caller of it. Nothing about the behaviour changed in the move.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ListTree } from "lucide-react";
import { Button, EmptyState, Modal } from "@/components/ui";
import { useWorkspace } from "@/components/workspace/provider";
import { buildSupplierPrecursorTree } from "@/lib/supplier-tree";
import { flatten, getSupplier, saveSupplier, treeFor, type PrecursorSupplier, type SupplierNode } from "@/lib/precursor-suppliers";
import { ensureChainRootSupplier } from "@/lib/chain-root-supplier";
import { makePrecursorLinkToken, precursorLinkFor } from "@/lib/precursor-link";
import { TreeNodeCard } from "@/components/tree-node-card";
import { TreeTable } from "@/components/tree-table";
import { TreeVerifiedDataModal } from "@/components/tree-verified-data-modal";
import type { ChainView } from "@/components/chain-view-toggle";
import { TreeAddPrecursorModal } from "@/components/tree-add-precursor-modal";
import { notifyTreeChanged } from "@/lib/tree-events";
import type { TreeNode } from "@/types/supplier-tree";
import { useT } from "@/lib/i18n";

/** A flat row as the editor wants it. The chain-root row has no children and
    sits at the top, which is exactly `depth: 1` — the same shape treeFor
    hands back for a tier-1 precursor, so SupplierEditor's indentation and
    every other reader of SupplierNode need no special case for it. */
const asNode = (row: PrecursorSupplier): SupplierNode => ({ ...row, children: [], depth: 1 });

function findTreeNode(nodes: TreeNode[], id: string): TreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findTreeNode(n.children, id);
    if (found) return found;
  }
  return null;
}

export function ChainEditor({ rootNodeId, view = "tree" }: { rootNodeId?: string; view?: ChainView }) {
  const t = useT();
  const { workspace } = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [roots, setRoots] = React.useState<TreeNode[]>(() => buildSupplierPrecursorTree(workspace.id));
  const [verifiedDataNodeId, setVerifiedDataNodeId] = React.useState<string | null>(null);
  const [addPrecursorParentId, setAddPrecursorParentId] = React.useState<string | null>(null);
  const [resendTarget, setResendTarget] = React.useState<TreeNode | null>(null);

  // notifyTreeChanged so the sidebar's copy of this same chain
  // (components/workspace/supply-chain-nav.tsx) re-reads with it — the two
  // render the same store from opposite sides of the portal layout.
  const reload = React.useCallback(() => {
    setRoots(buildSupplierPrecursorTree(workspace.id));
    notifyTreeChanged();
  }, [workspace.id]);

  /* ONE piece of state, ONE dialog, because it is one button — on every row
     of the chain including the installation at the top. A precursor row is
     found in the tree; the root has no tree row of its own, so
     ensureChainRootSupplier mints (or returns) the chain-root supplier row
     seeded from the Installation record. Both end up as a SupplierNode, and
     TreeVerifiedDataModal cannot tell them apart.

     The root's row is created LAZILY, on the first open, rather than when the
     workspace is created: a chain nobody has opened this dialog on has
     nothing to store, and back-filling every existing workspace would be a
     migration for a record that is derived from one already on file. */
  const verifiedDataTreeNode = verifiedDataNodeId ? findTreeNode(roots, verifiedDataNodeId) : null;
  const verifiedDataNode: SupplierNode | null = React.useMemo(() => {
    if (!verifiedDataTreeNode) return null;
    if (verifiedDataTreeNode.kind === "precursor") {
      return flatten(treeFor(workspace.id)).find((n) => n.id === verifiedDataTreeNode.id) ?? null;
    }
    return asNode(ensureChainRootSupplier(workspace));
    // Re-read when the open row changes, and after a save (`roots` is rebuilt
    // by reload()), so the dialog never shows a snapshot the store has moved on from.
  }, [verifiedDataTreeNode, workspace, roots]);
  const addPrecursorParent = addPrecursorParentId ? findTreeNode(roots, addPrecursorParentId) : null;
  // The chain's root — the installation this product is made at. A chain is
  // built FROM one workspace (lib/supplier-tree.ts), so there is exactly one
  // root and it exists the instant the workspace does, even with zero
  // precursors under it. It is also where `?add=1` hangs a first precursor.
  const rootNode = roots[0] ?? null;

  // What gets rendered: the whole forest, or the one node this page is about.
  const shown = rootNodeId ? [findTreeNode(roots, rootNodeId)].filter((n): n is TreeNode => n != null) : roots;

  /* ── What the sidebar's chain links do here ────────────────────
     ?node=<id> scrolls that node's card into view; ?add=<nodeId> opens the
     Add precursor dialog parented on THAT node. Both are read from the URL
     rather than pushed through a context, so the sidebar can stay a plain set
     of links and the addresses are shareable.

     `?add=1` — what the sidebar emitted before the parameter carried a node —
     still means "the chain's root installation". Kept because it is one line
     and because a bookmarked or shared address should not quietly stop
     opening the dialog it used to. */
  const selectedNodeId = searchParams.get("node");
  const addParam = searchParams.get("add");

  const clearParams = React.useCallback(() => router.replace(pathname, { scroll: false }), [router, pathname]);

  React.useEffect(() => {
    if (!selectedNodeId) return;
    document.getElementById(`tree-node-${selectedNodeId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedNodeId, roots]);

  /* Which node the URL is asking to add under. Resolved to an id — a plain
     string — rather than to a node, because the effect below must not re-fire
     when the tree object is rebuilt.

     A node id that is not in this chain resolves to nothing rather than
     falling back to the root: a stale link should open no dialog at all, not
     silently hang a supplier's precursor off the wrong parent. */
  const chainRootId = rootNode?.id ?? null;
  const addTargetId =
    addParam == null ? null : addParam === "1" ? chainRootId : findTreeNode(roots, addParam) ? addParam : null;

  // Keyed on the id, not the node object. reload() rebuilds the tree from
  // scratch, so the node is a fresh object every time a precursor is saved —
  // depending on the object re-fired this effect while ?add= was still on the
  // URL (router.replace lands a tick later), which reopened the dialog on top
  // of the row that had just been added.
  React.useEffect(() => {
    if (addTargetId) setAddPrecursorParentId(addTargetId);
  }, [addTargetId]);

  /* Same logic as sendPrecursorLink on the Precursors tab (reused, not
     reimplemented): reuse an existing token, only stamp smartLinkSentAt the
     first time, copy the URL.

     IT NO LONGER TOASTS. The Send button lives in Enter verified data's own
     "Ask the supplier" panel, and that panel now answers in the button and
     on its own status line — including the honest part about this build not
     sending mail itself. A toast on top of that was the same news twice, in
     the one place the reader was not looking. `smartLinkLastSentAt` moving
     is what the panel watches, which is why it is stamped here and nowhere
     else. */
  const sendLink = (node: TreeNode) => {
    /* getSupplier, not a walk of treeFor: the row at the top of the chain is
       deliberately not IN the tree (see PrecursorSupplier.isChainRoot), and
       it is sendable like any other. Addressing the row by its id is what
       finds both. */
    const row = getSupplier(workspace.id, node.id) ?? (node.kind === "installation" ? ensureChainRootSupplier(workspace) : null);
    if (!row) return;
    const token = row.smartLinkToken ?? makePrecursorLinkToken(workspace.id, row.id);
    const now = new Date().toISOString();
    /* `smartLinkSentAt` still only moves once — the link-status state machine
       reads it as "has this supplier ever been asked", and re-stamping it on
       every resend would reset a chain's whole invite history. The once-a-day
       throttle needs the OTHER question, so `smartLinkLastSentAt` moves every
       time. */
    saveSupplier({ ...row, smartLinkToken: token, smartLinkSentAt: row.smartLinkSentAt ?? now, smartLinkLastSentAt: now });
    reload();
    const url = precursorLinkFor(workspace.id, row.id);
    if (typeof navigator !== "undefined" && navigator.clipboard) void navigator.clipboard.writeText(url).catch(() => {});
  };

  const handleSend = (node: TreeNode) => {
    /* `sentAt` is a tree field, and the root has no tree row — so the "have we
       asked before" question is put to the STORED row, which is the same
       answer for a precursor and the only answer there is for the root. */
    const sent = getSupplier(workspace.id, node.id)?.smartLinkSentAt ?? node.sentAt;
    if (sent) {
      setResendTarget(node);
      return;
    }
    sendLink(node);
  };

  return (
    <>
      {rootNode == null ? (
        // Shouldn't happen — every workspace has a chain root the moment it
        // exists — but fails to the same "go elsewhere" shape rather than a
        // blank page if the workspace record itself is somehow missing here.
        <EmptyState
          icon={<ListTree size={28} strokeWidth={1.25} />}
          title={t("This workspace isn't set up yet")}
          body={t("Something is missing before a chain can be built here.")}
          action={
            <Link
              href={`/workspaces/${workspace.id}`}
              className="rounded-lg border border-black/15 px-4 py-2 text-[12px] uppercase tracking-[0.08em] text-black/60 hover:border-black/30 hover:text-black"
            >
              {t("Go to Overview →")}
            </Link>
          }
        />
      ) : (
        /* No "nothing here yet" state. A chain is never empty: the tier-1
           installation the product is made at — the exporter's own site, or
           the supplier's — is a node from the moment the workspace exists,
           and it sits at the top of the chain. An empty state here would have
           been the app claiming there was nothing to show while the first row
           of the chain was already known. Add precursor lives on the nodes
           themselves (and in the sidebar) instead. */
        <div className="space-y-2.5">
          {view === "table" ? (
            <TreeTable
              roots={shown}
              workspaceId={workspace.id}
              onEnterVerifiedData={(n) => setVerifiedDataNodeId(n.id)}
              onAddPrecursor={(n) => setAddPrecursorParentId(n.id)}
            />
          ) : (
            shown.map((root) => (
              <TreeNodeCard
                key={root.id}
                node={root}
                defaultOpen
                chainWorkspaceId={workspace.id}
                onEnterVerifiedData={(n) => setVerifiedDataNodeId(n.id)}
                onAddPrecursor={(n) => setAddPrecursorParentId(n.id)}
              />
            ))
          )}
        </div>
      )}

      {/* The dialog's own "Send link" is the SAME action the row's button is,
          routed through the same handler — including the resend confirmation,
          which is why this hands it the TreeNode rather than calling sendLink
          directly. A second copy of "reuse the token, stamp smartLinkSentAt
          once, copy the URL" is the drift this component exists to prevent. */}
      <TreeVerifiedDataModal
        node={verifiedDataNode}
        eyebrow={verifiedDataTreeNode?.kind === "installation" ? "Installation" : "Precursor"}
        onClose={() => setVerifiedDataNodeId(null)}
        onSaved={reload}
        onSend={() => {
          const target = verifiedDataNodeId ? findTreeNode(roots, verifiedDataNodeId) : null;
          if (target) handleSend(target);
        }}
      />

      <TreeAddPrecursorModal
        parent={addPrecursorParent}
        roots={roots}
        onClose={() => {
          setAddPrecursorParentId(null);
          if (addParam != null) clearParams();
        }}
        onAdded={() => {
          setAddPrecursorParentId(null);
          if (addParam != null) clearParams();
          reload();
        }}
      />

      <Modal
        open={resendTarget != null}
        onClose={() => setResendTarget(null)}
        eyebrow={t("Precursor")}
        title={t("Resend link?")}
        lead={resendTarget ? `A link was already sent to ${resendTarget.name || "this supplier"}. Copy a fresh one to send again?` : undefined}
        width="max-w-md"
        footer={
          <>
            <Button size="sm" variant="secondary" onClick={() => setResendTarget(null)}>
              {t("Cancel")}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (resendTarget) sendLink(resendTarget);
                setResendTarget(null);
              }}
            >
              {t("Resend")}
            </Button>
          </>
        }
      >
        <></>
      </Modal>
    </>
  );
}
