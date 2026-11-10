"use client";

/* ════════════════════════════════════════════════════════════
   THE CHAIN AS A TABLE — the same rows, read a different way

   A tree answers "what is under what". A table answers "which of these
   forty rows still needs me", and those are two genuinely different jobs
   that one layout cannot do at once: the cards give each row four lines and
   its own actions, which is right when you are working ONE row and wrong
   when you are triaging the whole chain before breakfast.

   So the chain is offered both ways (the switch lives in
   components/workspace/chain-editor.tsx) and this is the second one. It is
   NOT a second source of truth: the rows are the same TreeNode forest, the
   status is the same computeNodeStatus, the score and the progress meter are
   the same two chips (components/chain-status.tsx), and the buttons are the
   same ChainJourneyActions the cards render. Only the layout differs.

   FLAT, NOT COLLAPSIBLE. Depth is carried by indentation and the tier label,
   because a table you have to expand to search is a tree with extra lines —
   the reason to switch to this view is to see everything at once.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { cn } from "@/components/ui";
import {
  ChainDocumentActions,
  ChainJourneyActions,
  type ChainRowActions,
} from "@/components/chain-actions";
import { ScoreChip, StageMeter } from "@/components/chain-status";
import { NodeStatusBadge, TIER_LABEL } from "@/components/tree-node-card";
import type { TreeNode } from "@/types/supplier-tree";
import { useT } from "@/lib/i18n";

type Row = { node: TreeNode; depth: number };

function flattenTree(nodes: TreeNode[], depth = 0, out: Row[] = []): Row[] {
  for (const n of nodes) {
    out.push({ node: n, depth });
    flattenTree(n.children, depth + 1, out);
  }
  return out;
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "whitespace-nowrap px-3 py-2.5 text-[10px] font-normal uppercase tracking-[0.1em] text-black/40",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TreeTable({
  roots,
  workspaceId,
  onEnterVerifiedData,
  onAddPrecursor,
}: ChainRowActions & { roots: TreeNode[]; workspaceId: string }) {
  const t = useT();
  const rows = flattenTree(roots);

  return (
    // The chain has more columns than a phone has width, and squeezing an
    // action bar into 320px turns every button into two lines of shouting.
    // One horizontal scroller, and the first column stays readable.
    <div className="overflow-x-auto rounded-xl border border-black/[0.07] bg-white">
      <table className="w-full min-w-[1400px] border-collapse text-left">
        <thead>
          <tr className="border-b border-black/[0.07] bg-[#faf9f7]">
            {/* Widths are declared rather than left to the browser: with
                auto layout the actions column is whatever is left over, which
                on a narrow window is one button per line — three lines of
                wrapped shouting down every row of the chain. */}
            <Th className="w-[24%] min-w-[220px]">{t("Entity")}</Th>
            <Th className="w-[124px]">{t("Emissions")}</Th>
            {/* Wide enough for the longest label the seven-state vocabulary
                has — "Submitted — pending verification". Sized to the worst
                case rather than the common one, because a status pill that
                wraps or clips is the one row a reader stops trusting. */}
            <Th className="w-[224px]">{t("State")}</Th>
            <Th className="w-[108px]">{t("Score")}</Th>
            <Th className="w-[144px]">{t("Progress")}</Th>
            <Th className="w-[440px]">{t("Next step")}</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ node, depth }) => (
            // Same id the cards carry, so ?node=<id> scrolls to the right row
            // in whichever view is on screen.
            <tr
              key={node.id}
              id={`tree-node-${node.id}`}
              className="scroll-mt-40 border-b border-black/[0.05] align-top last:border-b-0 hover:bg-black/[0.012]"
            >
              <td className="px-3 py-3">
                {/* Indent by tier rather than a nested table: a chain several
                    tiers deep would otherwise need a table per tier, and the
                    columns would stop lining up at exactly the moment they
                    are being compared. */}
                <div style={{ paddingLeft: depth * 16 }}>
                  <span className="block text-[10px] uppercase tracking-[0.08em] text-black/35">
                    {TIER_LABEL(node.tier, node.kind)}
                  </span>
                  <span
                    className="mt-0.5 block truncate text-[13.5px] text-black/80"
                    title={node.name}
                  >
                    {node.name || "Unnamed"}
                  </span>
                  {node.cnCode && (
                    <span className="mt-0.5 block font-mono text-[11px] text-black/35">
                      CN {node.cnCode}
                    </span>
                  )}
                  {node.cyclicReference && (
                    <span className="mt-1 block text-[11px] text-[#dc2626]">
                      {t("Cycle detected — chain not shown")}
                    </span>
                  )}
                </div>
              </td>

              <td className="whitespace-nowrap px-3 py-3 font-mono text-[11.5px] text-black/55">
                {node.see != null ? (
                  <>
                    {node.see.toFixed(4)}
                    <span className="ml-1 text-black/30">
                      tCO₂e/
                      {node.functionalUnit === "tonne" || !node.functionalUnit
                        ? "t"
                        : node.functionalUnit}
                    </span>
                  </>
                ) : (
                  <span className="text-black/25">—</span>
                )}
                {node.quantityRatio && (
                  <span className="mt-0.5 block text-[11px] text-black/30">
                    {node.quantityRatio.precursorMassConsumed.toLocaleString()}t
                    / {node.quantityRatio.outputMassProduced.toLocaleString()}t
                  </span>
                )}
              </td>

              {/* A status pill that wraps stops being a pill, so each of the
                  three chip columns keeps its label on one line and lets the
                  table's own scroller take the overflow instead. */}
              <td className="whitespace-nowrap px-3 py-3">
                <NodeStatusBadge node={node} />
              </td>

              <td className="whitespace-nowrap px-3 py-3">
                <ScoreChip node={node} />
              </td>

              <td className="whitespace-nowrap px-3 py-3">
                <StageMeter node={node} />
              </td>

              <td className="px-3 py-3">
                <ChainJourneyActions
                  node={node}
                  workspaceId={workspaceId}
                  showStage={false}
                  onEnterVerifiedData={onEnterVerifiedData}
                  onAddPrecursor={onAddPrecursor}
                />
                <ChainDocumentActions
                  node={node}
                  workspaceId={workspaceId}
                  className="mt-1.5"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
