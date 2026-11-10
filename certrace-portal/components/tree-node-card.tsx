"use client";

/* ════════════════════════════════════════════════════════════
   TREE NODE CARD

   Renders a single TreeNode: status, identity, tier, and — when the caller
   wires the handlers — its actions. Status always comes from
   computeNodeStatus() (lib/supplier-tree.ts), never read or set locally.

   EVERY ROW OFFERS THE SAME THREE THINGS, root installation included: Track
   report, Enter verified data, Add precursor. A chain where the top row
   answers to a different set of buttons than the rows beneath it is a chain
   the reader has to re-learn at tier 1; the actions MEAN something slightly
   different up there — the root is the exporter's own workspace rather than
   somebody they chase — so they resolve to different destinations, but they
   are the same three words in the same order on every row.

   The four-step progress meter (lib/chain-progress.ts) is NOT among them —
   see showStage below.

   Send / Resend is the one exception, and stays precursor-only: it copies a
   Smart Link for somebody outside the account, and the root installation is
   the account.

   THE NAME IS NOT A LINK. Actions are buttons, in the action bar, where the
   reader looks for actions. A name that silently navigated meant the row had
   one control nobody could see and one destination nobody could predict from
   looking at it — the sidebar still opens each node's own page, and Track
   report opens the place the work happens.

   Any handler left unset — or `readOnly` — simply renders no button for that
   action, which is how the read-only supplier view still works unchanged.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/components/ui";
import { computeNodeStatus } from "@/lib/supplier-tree";
import { getSupplier } from "@/lib/precursor-suppliers";
import {
  ChainDocumentActions,
  ChainJourneyActions,
  type ChainRowActions,
} from "@/components/chain-actions";
import { ScoreChip } from "@/components/chain-status";
import { ValueTypeBadge } from "@/components/precursor/status-chips";
import type { NodeStatus, TreeNode } from "@/types/supplier-tree";
import { useT } from "@/lib/i18n";

const STATUS_STYLE: Record<NodeStatus, string> = {
  NOT_SENT: "border-black/[0.08] bg-black/[0.02] text-black/40",
  SENT_PENDING: "border-[rgba(161,98,7,0.18)] bg-[#fefce8] text-[#a16207]",
  IN_PROGRESS: "border-[rgba(29,78,216,0.18)] bg-[#eff6ff] text-[#1d4ed8]",
  SUBMITTED_PENDING_VERIFICATION:
    "border-[rgba(124,58,237,0.18)] bg-[#f5f3ff] text-[#7c3aed]",
  VERIFIED: "border-[rgba(5,150,105,0.18)] bg-[#ecfdf5] text-[#047857]",
  VERIFICATION_EXPIRED:
    "border-[rgba(180,83,9,0.18)] bg-[#fffbeb] text-[#b45309]",
  BLOCKED: "border-[rgba(220,38,38,0.18)] bg-[#fef2f2] text-[#dc2626]",
};

const STATUS_LABEL: Record<NodeStatus, string> = {
  NOT_SENT: "Not sent",
  SENT_PENDING: "Sent — pending",
  IN_PROGRESS: "In progress",
  SUBMITTED_PENDING_VERIFICATION: "Submitted — pending verification",
  VERIFIED: "Verified",
  VERIFICATION_EXPIRED: "Verification expired",
  BLOCKED: "Blocked",
};

/** The node's own status pill — exported because the entity detail page's
    identity bar has to show the SAME pill for the same node as the chain
    does. Two components deriving "blocked" separately is how a node ends up
    red in the tree and grey on its own page. */
export function NodeStatusBadge({ node }: { node: TreeNode }) {
  const t = useT();
  const status = computeNodeStatus(node);
  /* `max-w-full` is what stops the longest label in the vocabulary —
     "Submitted — pending verification" — from being cut off the right edge of
     a phone. `flex-none` alone sizes the pill to max-content and refuses to
     shrink, which is right beside a title on a desktop and is 238px inside a
     224px column on a 375px screen. Clamped, the text wraps to two lines
     instead, and `leading-tight` keeps those two lines looking like one pill.

     In the table view the surrounding cell sets `whitespace-nowrap`, so the
     pill still cannot wrap there and still overflows into that table's own
     horizontal scroller — which is what the table is designed to do. */
  return (
    <span
      className={cn(
        "flex-none max-w-full rounded-full border px-2.5 py-1 text-[10px] uppercase leading-tight tracking-[0.08em]",
        STATUS_STYLE[status],
      )}
    >
      {t(STATUS_LABEL[status])}
    </span>
  );
}

/* The old Precursors tab's "Actual value" / "Default value" chip
   (components/precursor/status-chips.tsx) — reused verbatim, not
   reimplemented, so this reads exactly the same fact the same way. Whether
   a figure is a real measured value or an EU default fallback is
   compliance-relevant and was not previously shown anywhere on the Tree
   page; this is the one piece Step A of the pre-removal check found
   missing. */
function NodeValueTypeBadge({
  workspaceId,
  nodeId,
}: {
  workspaceId: string;
  nodeId: string;
}) {
  const supplier = getSupplier(workspaceId, nodeId);
  if (!supplier) return null;
  return <ValueTypeBadge node={supplier} />;
}

/* The chain's own numbering, one product deep. Raw tier 1 is the
   installation the product is made at (the chain's root, and the reader's own
   site or their supplier's); raw tier 2 is a direct input, which is Tier 1 of
   the precursor chain; raw 3+ are nested under that. There is no product tier
   — a product is the same level as its chain, not a row inside it. */
export const TIER_LABEL = (tier: number, kind: TreeNode["kind"]) =>
  kind === "installation" ? "Installation" : `Tier ${tier - 1} · Precursor`;

/* Documents and the four verification checks used to sit on this card as two
   collapsed drawers per row. Both moved into Enter verified data
   (components/tree-verified-data-modal.tsx), where the figure they qualify
   is: a document is evidence FOR a number, and a check is a verdict ON one,
   so reading either one apart from the number was always a click away from
   meaning something. On a forty-row chain they were also eighty drawers to
   open before the reader found the one row they came for.

   What stays on the row is the SCORE — ScoreChip, components/chain-status.tsx
   — because "3/4" is what scans down a column and decides which row to open.
   ══════════════════════════════════════════════════════════════ */

export function TreeNodeCard({
  node,
  defaultOpen,
  readOnly,
  chainWorkspaceId,
  onEnterVerifiedData,
  onAddPrecursor,
}: ChainRowActions & {
  node: TreeNode;
  defaultOpen: boolean;
  readOnly?: boolean;
  /** The workspace whose chain this card is being drawn in. Set only by the
      exporter-side chain (ChainEditor). The supplier's own /p/<token> view
      leaves it unset — a supplier has no account, and every destination the
      action bar points at is behind the exporter's login. */
  chainWorkspaceId?: string;
}) {
  const t = useT();
  const [open, setOpen] = React.useState(defaultOpen);
  const hasChildren = node.children.length > 0;
  const isPrecursor = node.kind === "precursor";
  // Every node of a chain carries the chain's own workspace id, so these are
  // the same value on the exporter side; the fallback is only for a card
  // rendered outside a chain (the supplier's own subtree view).
  const wsId = chainWorkspaceId ?? node.workspaceId;

  return (
    // The id is what the sidebar's chain links scroll to (?node=<id> on the
    // Tree page) — getElementById rather than a CSS selector, because node
    // ids carry ":" and "~" and would need escaping in one.
    <div
      id={`tree-node-${node.id}`}
      className="scroll-mt-32 rounded-xl border border-black/[0.07] bg-white"
    >
      <div className="flex items-start gap-3 p-4">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-0.5 flex-none rounded-lg p-1 text-black/35 hover:bg-black/[0.04] hover:text-black"
            aria-label={open ? "Collapse" : "Expand"}
          >
            {open ? (
              <ChevronDown size={15} strokeWidth={1.5} />
            ) : (
              <ChevronRight size={15} strokeWidth={1.5} />
            )}
          </button>
        ) : (
          <span className="mt-0.5 w-[27px] flex-none" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10.5px] uppercase tracking-[0.08em] text-black/35">
              {TIER_LABEL(node.tier, node.kind)}
            </span>
            {/* The root carries a status too. It used to be a grouping with
                no reporting year, so it had nothing to be; now it IS the
                product's workspace, and computeNodeStatus reads that
                workspace's readiness — the same figure the estate card shows
                for it. */}
            <NodeStatusBadge node={node} />
            {/* The score, not the checklist — see the note above TreeNodeCard. */}
            <ScoreChip node={node} />
            {isPrecursor && node.workspaceId && (
              <NodeValueTypeBadge
                workspaceId={node.workspaceId}
                nodeId={node.id}
              />
            )}
            {node.cyclicReference && (
              <span className="rounded-full border border-[rgba(220,38,38,0.18)] bg-[#fef2f2] px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] text-[#dc2626]">
                {t("Cycle detected — chain not shown")}
              </span>
            )}
          </div>
          {/* THE NAME IS A LABEL, NOT A CONTROL. It used to be the way in,
              which made the row's most-read text also its least visible
              button: nothing about a name announces where it goes, and the
              destination changed by node kind. Every way out of this row is
              now in the action bar below, spelled out. */}
          <div
            className="mt-1.5 truncate text-[15px] text-black/80"
            title={node.name}
          >
            {node.name}
          </div>
          <div className="mt-0.5 font-mono text-[11.5px] text-black/40">
            {node.cnCode ? `CN ${node.cnCode}` : null}
            {node.cnCode && node.see != null ? " · " : null}
            {node.see != null
              ? `${node.see.toFixed(4)} tCO₂e/${node.functionalUnit === "tonne" || !node.functionalUnit ? "t" : node.functionalUnit}`
              : null}
            {node.quantityRatio && (
              <span className="ml-2 text-black/35">
                {node.quantityRatio.precursorMassConsumed.toLocaleString()}t
                consumed /{" "}
                {node.quantityRatio.outputMassProduced.toLocaleString()}t
                produced
              </span>
            )}
          </div>

          {!readOnly && wsId && (
            <ChainJourneyActions
              node={node}
              workspaceId={wsId}
              className="mt-3 border-t border-black/[0.05] pt-3"
              /* NO PROGRESS METER ON THE CARD. The row already carries the
                 status pill and the score two lines above, and a four-step
                 meter wedged between Enter verified data and Add precursor
                 said a third version of the same thing in the middle of the
                 action bar — so the strip read as five controls, one of which
                 could not be pressed. The table view keeps its meter, because
                 there it is a COLUMN of its own and scans down the page. */
              showStage={false}
              onEnterVerifiedData={onEnterVerifiedData}
              onAddPrecursor={onAddPrecursor}
            />
          )}

          {wsId && (
            <ChainDocumentActions
              node={node}
              workspaceId={wsId}
              className="mt-2"
            />
          )}
        </div>
      </div>

      {hasChildren && open && (
        <div className="space-y-2.5 border-t border-black/[0.06] p-3 pl-8">
          {node.children.map((child) => (
            // Raw tier 2 is a direct input (chain Tier 1) and opens with the
            // installation above it; raw 3+ is nested under that and starts
            // collapsed, so a deep chain arrives readable rather than as
            // forty rows the reader has to scroll past to find the one they
            // came for.
            <TreeNodeCard
              key={child.id}
              node={child}
              defaultOpen={child.tier <= 2}
              readOnly={readOnly}
              chainWorkspaceId={chainWorkspaceId}
              onEnterVerifiedData={onEnterVerifiedData}
              onAddPrecursor={onAddPrecursor}
            />
          ))}
        </div>
      )}
    </div>
  );
}
