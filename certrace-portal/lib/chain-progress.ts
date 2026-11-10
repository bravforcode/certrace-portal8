/* ════════════════════════════════════════════════════════════
   THE CHAIN, AS A JOURNEY — four steps, one vocabulary

   `computeNodeStatus` (lib/supplier-tree.ts) answers "what state is this
   node in", in the seven words a verifier would use. That is the right
   answer to a compliance question and the wrong answer to the question an
   exporter actually opens the Supply Chain page with, which is:

       what do I do about this row, and how close is it to done?

   Seven states, four of which are shades of "waiting", cannot answer that.
   So this module collapses the same seven into the FOUR STEPS the work
   really has, in the order they happen:

     1  Not started         nothing asked for, nothing entered
     2  Tracking report     a report has been asked for — a Smart Link is
                            out, or a report workspace has been opened
     3  In progress         somebody is filling it in: the supplier on
                            their link, or the exporter in the workspace
     4  Updated with buyer  verified, rolled into the chain, ready to hand over

   IT IS DERIVED, NEVER STORED. Every stage here is a pure function of
   computeNodeStatus() plus one extra fact the seven-state enum does not
   carry (whether a report workspace exists for the row). Two screens can
   therefore never disagree about which step a node is on, and nothing has
   to be migrated when the underlying status rules change.

   MOST NODES ARRIVE AT STEP 1. That is the whole design premise of the
   chain page: an exporter opening a new chain has no figures for anybody,
   so the page has to make "get a report moving" the obvious next click and
   keep "hand it to the buyer" visible as the destination — not the other
   way round.
   ════════════════════════════════════════════════════════════ */

import { computeNodeStatus } from "./supplier-tree";
import { workspaceReadiness } from "./readiness";
import { getSupplier } from "./precursor-suppliers";
import { getWorkspace } from "./workspace";
import type { TreeNode } from "@/types/supplier-tree";

export type ChainStage =
  | "not_started"
  | "tracking"
  | "in_progress"
  | "buyer_ready";

/** In order. Rendered as a four-step meter, so the order is load-bearing. */
export const CHAIN_STAGES: ChainStage[] = [
  "not_started",
  "tracking",
  "in_progress",
  "buyer_ready",
];

export const STAGE_LABEL: Record<ChainStage, string> = {
  not_started: "Not started",
  tracking: "Tracking report",
  in_progress: "In progress",
  buyer_ready: "Updated with buyer",
};

/** What the step means, and what moves it on — shown on hover, because a
    four-word label cannot carry "and here is what happens next". */
export const STAGE_HINT: Record<ChainStage, string> = {
  not_started:
    "Nothing has been asked for and nothing entered. Track a report to start chasing this figure.",
  tracking:
    "A report has been asked for — a Smart Link is out, or a product report is open for this entity.",
  in_progress:
    "Being filled in — by the supplier on their link, or by you in the product report.",
  buyer_ready:
    "Verified and rolled into the chain. This figure is ready to hand to your buyer.",
};

/** Step number, 1-4 — for the meter and for "step 2 of 4" on hover. */
export const stageIndex = (s: ChainStage): number =>
  CHAIN_STAGES.indexOf(s) + 1;

/** A report workspace exists for this row, even if nobody has typed into it
    yet. The seven-state enum cannot see this: `linkedWorkspaceId` is set by
    Track report and says nothing about the Smart Link timeline, so a node
    whose workspace was created but never sent still reads NOT_SENT. Asking
    for a report IS step 2, however it was asked for. */
function reportTracked(node: TreeNode): boolean {
  if (node.kind !== "precursor" || !node.workspaceId) return false;
  return Boolean(getSupplier(node.workspaceId, node.id)?.linkedWorkspaceId);
}

export function chainStage(node: TreeNode): ChainStage {
  switch (computeNodeStatus(node)) {
    case "VERIFIED":
      return "buyer_ready";
    // Blocked and expired are both mid-journey, not a fifth step: the work
    // has started and is not finished. They are surfaced separately by
    // needsAttention() so the meter keeps meaning "how far", and the red
    // chip keeps meaning "something is wrong".
    case "IN_PROGRESS":
    case "SUBMITTED_PENDING_VERIFICATION":
    case "BLOCKED":
    case "VERIFICATION_EXPIRED":
      return "in_progress";
    case "SENT_PENDING":
      return "tracking";
    case "NOT_SENT":
    default:
      return reportTracked(node) ? "tracking" : "not_started";
  }
}

/** Something is wrong with this row and no amount of waiting fixes it —
    a failed verification check, a lapsed report, or a cycle in the chain. */
export function needsAttention(node: TreeNode): boolean {
  const s = computeNodeStatus(node);
  return s === "BLOCKED" || s === "VERIFICATION_EXPIRED";
}

/** THE SCORE, in whichever form this kind of node actually has one.

    A precursor is scored by the four-check verification gate it either
    passed or did not (lib/precursor-suppliers.ts). The chain's root
    installation has no such gate — it is the exporter's own workspace, and
    what "how ready is it" means there is the workspace's own readiness
    percentage, the same figure its tab strip shows. Two different
    denominators, one question, so they are returned in one shape and drawn
    by one chip. Null when there is nothing to score yet. */
export type ChainScore = {
  label: string;
  /** what the reader sees — "3/4" or "62%" */
  value: string;
  /** 0-100, for the meter and the tone */
  percent: number;
  title: string;
};

export function chainScore(node: TreeNode): ChainScore | null {
  if (node.kind === "installation") {
    const ws = node.workspaceId ? getWorkspace(node.workspaceId) : null;
    if (!ws) return null;
    const r = workspaceReadiness(ws);
    return {
      label: "Readiness",
      value: `${r.percentComplete}%`,
      percent: r.percentComplete,
      title:
        "Share of this product report's applicable readiness tabs that are complete. Descriptive only — never a gate to submission.",
    };
  }

  if (!node.workspaceId) return null;
  const checks = getSupplier(node.workspaceId, node.id)?.verificationChecks;
  if (!checks) {
    return {
      label: "Checks",
      value: "0/4",
      percent: 0,
      title:
        "No verification has been attempted for this entity yet. The four checks run when a verified figure is recorded against it.",
    };
  }

  const passed =
    Number(checks.accreditationValid) +
    Number(checks.sectoralScopeMatch) +
    Number(checks.periodCovered) +
    Number(checks.fileIntact);
  return {
    label: "Checks",
    value: `${passed}/4`,
    percent: (passed / 4) * 100,
    title:
      passed === 4
        ? "All four verification checks passed — accreditation, sectoral scope, period covered and file intact."
        : `${4 - passed} of the four verification checks did not pass. Open Enter verified data to see which.`,
  };
}
