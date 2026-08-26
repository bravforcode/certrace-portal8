"use client";

/* ════════════════════════════════════════════════════════════
   THE TWO CHIPS THE CHAIN IS READ BY

   Both are drawn here rather than in the card, because the chain is now read
   two ways — as a tree of cards and as a table (components/tree-table.tsx) —
   and a status that looks or reads differently between the two views is a
   status the reader has to learn twice.

   StageMeter  HOW FAR ALONG, on the four steps of lib/chain-progress.ts.
               Drawn as a filled meter, not a pill, and deliberately so: a
               pill is a state, a meter is a distance, and the question this
               answers is "how much further". It sits beside the actions
               rather than up in the identity row for the same reason — it
               is there to be compared against the button you are about to
               press, not to label the row.

   ScoreChip   HOW GOOD IT IS — the four-check verification score for a
               precursor, the workspace readiness percentage for the root
               installation. One shape for both, since the reader's question
               ("is this figure sound?") is the same either way.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useT } from "@/lib/i18n";
import { cn } from "@/components/ui";
import { CHAIN_STAGES, STAGE_HINT, STAGE_LABEL, chainScore, chainStage, stageIndex, type ChainStage } from "@/lib/chain-progress";
import type { TreeNode } from "@/types/supplier-tree";

/* Same four colours the seven-state pill already uses for the equivalent
   states (components/tree-node-card.tsx's STATUS_STYLE) — amber for waiting,
   blue for underway, green for done — so collapsing seven into four never
   changes what a colour means. */
const STAGE_STYLE: Record<ChainStage, { chip: string; fill: string; empty: string }> = {
  not_started: { chip: "border-black/[0.08] bg-black/[0.02] text-black/45", fill: "bg-black/25", empty: "bg-black/[0.08]" },
  tracking: { chip: "border-[rgba(161,98,7,0.18)] bg-[#fefce8] text-[#a16207]", fill: "bg-[#a16207]", empty: "bg-[rgba(161,98,7,0.16)]" },
  in_progress: { chip: "border-[rgba(29,78,216,0.18)] bg-[#eff6ff] text-[#1d4ed8]", fill: "bg-[#1d4ed8]", empty: "bg-[rgba(29,78,216,0.16)]" },
  buyer_ready: { chip: "border-[rgba(5,150,105,0.18)] bg-[#ecfdf5] text-[#047857]", fill: "bg-[#047857]", empty: "bg-[rgba(5,150,105,0.16)]" },
};

export function StageMeter({ node, className }: { node: TreeNode; className?: string }) {
  const t = useT();
  const stage = chainStage(node);
  const step = stageIndex(stage);
  const style = STAGE_STYLE[stage];

  return (
    <span
      className={cn("inline-flex flex-none items-center gap-2 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.08em]", style.chip, className)}
      title={`Step ${step} of ${CHAIN_STAGES.length} — ${t(STAGE_HINT[stage])}`}
      /* One control, one announcement: without this a screen reader reads
         four unlabelled bars and then the words, as five separate things. */
      role="img"
      aria-label={`Progress: step ${step} of ${CHAIN_STAGES.length}, ${t(STAGE_LABEL[stage])}`}
    >
      <span aria-hidden className="flex items-center gap-[2px]">
        {CHAIN_STAGES.map((_, i) => (
          <span key={i} className={cn("h-[3px] w-[7px] rounded-full transition-colors", i < step ? style.fill : style.empty)} />
        ))}
      </span>
      {t(STAGE_LABEL[stage])}
    </span>
  );
}

/** The verification score, alone. The four checks' own pass/fail detail
    lives inside Enter verified data, next to the figure it qualifies —
    a permanently expandable checklist on every row of a forty-row chain is
    forty things to open before the reader finds the one that matters. The
    number is what scans; the detail is what you open. */
export function ScoreChip({ node, className }: { node: TreeNode; className?: string }) {
  const score = chainScore(node);
  if (!score) return null;

  const tone =
    score.percent >= 100
      ? "border-[rgba(5,150,105,0.18)] bg-[#ecfdf5] text-[#047857]"
      : score.percent > 0
        ? "border-[rgba(180,83,9,0.18)] bg-[#fffbeb] text-[#b45309]"
        : "border-black/[0.08] bg-black/[0.02] text-black/40";

  return (
    <span
      className={cn("inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.08em]", tone, className)}
      title={score.title}
    >
      {score.label}
      <span className="font-mono text-[10.5px] tabular-nums">{score.value}</span>
    </span>
  );
}
