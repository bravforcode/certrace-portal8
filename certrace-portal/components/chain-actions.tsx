"use client";

/* ════════════════════════════════════════════════════════════
   ONE ROW'S ACTIONS — defined once, drawn by both views of the chain

   The Supply Chain page can be read as a tree of cards or as a table
   (components/workspace/chain-editor.tsx offers the switch), and an entity's
   own page shows the same row again. Three surfaces, one row: if each drew
   its own buttons, "Track report" would eventually mean three slightly
   different things depending on which view you happened to be in.

   So the row's actions live here, in the order the work happens, and every
   surface renders the same two groups:

     ChainJourneyActions   Track report → Enter verified data, in the order
                           the work happens.

                           CHASING A SUPPLIER IS NOT A ROW ACTION. "Send"
                           used to sit here, which put the act of asking
                           somebody outside the account on the same strip as
                           four navigations — one row, five buttons, and the
                           one with a real-world consequence indistinguishable
                           from the ones that only move you somewhere. It now
                           lives in Enter verified data's own "Ask the
                           supplier" block, beside the email it goes to and
                           the throttle that governs it.

                           NEITHER IS EXTENDING THE CHAIN, any more. "Add
                           precursor" used to close this strip, and it was the
                           odd one out for the same reason "Send" was: the two
                           buttons beside it read THIS row, and it CREATES a
                           new one underneath. It now lives on the row in the
                           sidebar — a `+` against every supplier and every
                           precursor, parented on whichever one you press —
                           which is where the chain is already drawn as a
                           tree and where "one tier deeper than this" is a
                           position you can see rather than a sentence in a
                           tooltip. Same dialog, same cycle check, same
                           parent: see components/workspace/supply-chain-nav.tsx
                           and the `?add=` parameter it emits.

     ChainDocumentActions  What this row can hand over — the submission
                           record. A read, not a step.

   THE SAME TWO WORDS ON EVERY ROW, root installation included. What they
   resolve to differs — the root is the exporter's own workspace rather than
   somebody they chase — but a chain whose top row answers to a different set
   of buttons is a chain the reader has to re-learn at tier 1.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { cn } from "@/components/ui";
import { computeNodeStatus } from "@/lib/supplier-tree";
import { getSupplier } from "@/lib/precursor-suppliers";
import { PRODUCTION_ROUTES } from "@/lib/workspace";
import { StageMeter } from "@/components/chain-status";
import { downloadPrecursorNodeExport } from "@/lib/cbam/precursor-node-export";
import type { TreeNode } from "@/types/supplier-tree";
import { useT } from "@/lib/i18n";

export function ActionButton({ tone = "default", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "default" | "primary" | "warn" }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "rounded-lg border px-2.5 py-1 text-[10.5px] uppercase tracking-[0.06em] transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        tone === "primary" && "border-[rgba(180,83,9,0.3)] bg-[#fffbeb] text-[#b45309] hover:bg-[#fef3c7]",
        tone === "warn" && "border-[rgba(220,38,38,0.2)] bg-[#fef2f2] text-[#dc2626] hover:bg-[#fee2e2]",
        tone === "default" && "border-black/12 text-black/55 hover:border-black/25 hover:bg-black/[0.03] hover:text-black",
        props.className,
      )}
    />
  );
}

/* A sibling of ActionButton for actions that are a real navigation rather
   than an in-place operation — Next's <Link> rather than a button +
   router.push, so it works without JS and can be middle-clicked/opened in a
   new tab like any other link. `tone="solid"` (the default) is the black,
   filled CTA used for creating/opening a workspace; `tone="default"` matches
   ActionButton's own outline look, for a navigation that is not the row's
   primary action. */
export function ActionLink({
  href,
  tone = "solid",
  title,
  className,
  children,
}: {
  href: string;
  tone?: "solid" | "default";
  title?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      title={title}
      className={cn(
        "rounded-lg border px-2.5 py-1 text-[10.5px] uppercase tracking-[0.06em] transition-colors",
        tone === "solid" && "border-black bg-[#111] text-white hover:bg-[#333]",
        tone === "default" && "border-black/12 text-black/55 hover:border-black/25 hover:bg-black/[0.03] hover:text-black",
        className,
      )}
    >
      {children}
    </Link>
  );
}

/* TRACK REPORT — the one way in to wherever this entity's report is made.

   Named for the OUTCOME, not the mechanism. It used to say "Create workspace
   for this precursor", which is a true description of what the click does and
   an answer to a question nobody arrives with: an exporter opening a chain
   wants a report out of a supplier, and has no view on how many workspace
   records that takes. The three destinations below are all "go to where this
   entity's report is tracked", so they are one button with one name.

     · the chain's root installation → its own workspace. The good is made
       there, so the year's months, its MMD and its readiness ARE this
       product's report. Nothing to create; this opens it.
     · a precursor that already has a linked workspace → that workspace.
     · a precursor with none → the ordinary /workspaces/new wizard, pre-filled
       with whatever this row already knows.

   That last case is the path for a supplier who has never produced a report
   of their own. It spins up a REAL VerificationWorkspace (lib/workspace.ts)
   scoped to this precursor's own installation and good, and that workspace
   runs the exact same Overview → Monthly data → Readiness pipeline —
   including its own MMD generation and sign-off gate — as any of the
   exporter's own. Nothing here re-implements that pipeline; this only creates
   the link and hands off. `productionRoute` is stored on the row as the
   route's LABEL (see supplier-editor.tsx's picker), not its id, so it has to
   be resolved back to an id before it means anything to lib/workspace.ts's
   route picker. */
function TrackReportAction({ workspaceId, node }: { workspaceId: string; node: TreeNode }) {
  const t = useT();
  if (node.kind === "installation") {
    return (
      <ActionLink
        href={`/workspaces/${workspaceId}`}
        title={t("Open this installation's own product report — its months, its MMD and its readiness are this product's report.")}
      >
        {t("Track report")}
      </ActionLink>
    );
  }

  const supplier = getSupplier(workspaceId, node.id);
  if (!supplier) return null;

  if (supplier.linkedWorkspaceId) {
    return (
      <ActionLink href={`/workspaces/${supplier.linkedWorkspaceId}`} title={t("Open the product report already open for this precursor.")}>
        {t("Track report")}
      </ActionLink>
    );
  }

  const routeId = PRODUCTION_ROUTES.find((r) => r.label === supplier.productionRoute)?.id;
  const qs = new URLSearchParams({ precursorId: supplier.id, parentWorkspaceId: workspaceId });
  if (supplier.catalogProductId) qs.set("productId", supplier.catalogProductId);
  if (routeId) qs.set("route", routeId);

  return (
    <ActionLink
      href={`/workspaces/new?${qs.toString()}`}
      title={t("Open a product report for this precursor — same months, MMD and readiness as your own, pre-filled with what this row already knows.")}
    >
      {t("Track report")}
    </ActionLink>
  );
}

/* ENTER VERIFIED DATA — the end of the journey, on every row, AND THE SAME
   KIND OF EVENT ON EVERY ROW.

   It opens a dialog. On a precursor that dialog is the editor, where the
   figure, the documents behind it and the four verification checks live
   together; on the root installation it is the installation's own version of
   the same three blocks — ask the site, the year's completeness, and the
   screens the readings are actually entered on
   (components/tree-verified-data-modal.tsx).

   It used to be a LINK on the root, straight to /monthly. Same words, same
   position on the row, but pressing it navigated away from the chain instead
   of opening something on top of it — so the one action the page repeats on
   every tier behaved differently at tier 1, and the reader lost their place
   in the chain to find out. The destination is not gone: it is the first
   entry in the dialog's own "where these figures are entered" list. */
function EnterVerifiedDataAction({ node, onEnterVerifiedData }: { node: TreeNode; onEnterVerifiedData?: (node: TreeNode) => void }) {
  const t = useT();
  if (!onEnterVerifiedData) return null;
  return (
    <ActionButton
      onClick={() => onEnterVerifiedData(node)}
      title={
        node.kind === "installation"
          ? "This installation's verified figures are the year held in its own product report — ask for a month, or open the screen it is entered on."
          : "Record the verified figure, its documents and its verification checks for this entity."
      }
    >
      {t("Enter verified data")}
    </ActionButton>
  );
}

/** What a caller has to hand this row for its actions to work. Grouped into
    one type because the card, the table and an entity's own page all pass
    exactly the same set — a signature they can drift apart on is a signature
    that will.

    `onAddPrecursor` is still here and still threaded through both views even
    though no button in this file calls it: the dialog it opens is now reached
    from the sidebar (`?add=<nodeId>`), and the handler is what
    components/workspace/chain-editor.tsx binds that parameter to. Dropping it
    from the type would mean re-adding it the first time a row wants to offer
    the action again. */
export type ChainRowActions = {
  onEnterVerifiedData?: (node: TreeNode) => void;
  onAddPrecursor?: (node: TreeNode) => void;
};

/* ── The journey bar ────────────────────────────────────────────
   Left to right, in the order the work happens: track the report → record
   what came back → see how far that got. Extending the chain is not on it —
   see the header: that is the sidebar's `+`, on the row it would hang from.

   TRACK REPORT IS THE FILLED BUTTON, and that is the whole premise of the
   page. The overwhelmingly common state of a chain somebody has just opened
   is that nobody has any figures for anybody, so the first click has to be
   the one that starts getting them — not the one that records a figure they
   do not have yet. Enter verified data stays beside it, in outline, as the
   destination: what you come back and press when the report arrives.

   THE PROGRESS METER IS NOT IN THE STRIP on either view of the chain — see
   `showStage`. It is a reading, and the strip is for things you press. */
export function ChainJourneyActions({
  node,
  workspaceId,
  className,
  showStage = true,
  onEnterVerifiedData,
}: ChainRowActions & {
  node: TreeNode;
  workspaceId: string;
  className?: string;
  /** Both views of the chain pass false, for the same reason from two
      directions: progress is a READING, and this strip is what you press.
      The table gives it a column of its own, so a meter repeated inside the
      actions cell would be the same fact twice on one row; the card carries
      the status pill and the score two lines above the strip, so a meter
      wedged between Enter verified data and Add precursor was a third telling
      of it, sitting where the reader is looking for a button. Left as a prop
      rather than deleted so a surface that shows the strip ALONE — with no
      status of its own above it — can still turn it back on. */
  showStage?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <TrackReportAction workspaceId={workspaceId} node={node} />
      <EnterVerifiedDataAction node={node} onEnterVerifiedData={onEnterVerifiedData} />
      {showStage && <StageMeter node={node} />}
    </div>
  );
}

/** True when there is something worth handing to a verifier — submitted and
    pending, or already verified (so the record can be re-downloaded later). */
export function hasSubmissionRecord(node: TreeNode): boolean {
  if (node.kind !== "precursor") return false;
  const s = computeNodeStatus(node);
  return s === "SUBMITTED_PENDING_VERIFICATION" || s === "VERIFIED" || s === "VERIFICATION_EXPIRED";
}

/* ── What this row can hand over ────────────────────────────────
   Reads rather than steps, so they sit below the journey bar rather than in
   it.

   THE MONITORING METHODOLOGY DOCUMENTATION IS NOT ONE OF THEM ANY MORE. This
   row used to carry a "Monitoring Methodology Documentation" link, and it was
   never the document — it was a navigation into the linked workspace's own
   Readiness tab, where the real download lives behind the sign-off gate. So
   the chain offered a button that looked like an export and was a detour, on
   the one surface where every other button is a step in the journey. The
   destination is unchanged and one click away: Track report opens that
   workspace, and Readiness is where the file is actually produced — under the
   gate that decides whether it may be produced at all, which is exactly the
   context a row on the chain cannot carry.

   The submission-record download that remains is a genuine client-side
   export — it builds and hands over a file from data already on this row,
   with no gate to explain and nowhere else to do it. It needs no account
   either, so it stays available when `readOnly` hides the auth-side rest. */
export function ChainDocumentActions({
  node,
  workspaceId,
  className,
}: {
  node: TreeNode;
  workspaceId: string;
  className?: string;
}) {
  const t = useT();
  const record = hasSubmissionRecord(node);
  if (node.kind !== "precursor") return null;
  // Nothing to hand over yet — render no row at all rather than an empty one
  // that still costs vertical space on every unstarted node of the chain.
  if (!record) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <ActionButton
        title={t("Download this entity's submission record — the figure, its provenance and its verification checks, as handed to a verifier.")}
        onClick={() => {
          const supplier = getSupplier(workspaceId, node.id);
          if (supplier) downloadPrecursorNodeExport(supplier);
        }}
      >
        <Download size={11} strokeWidth={1.5} className="mr-1 inline -mt-px" />
        {t("Verification report")}
      </ActionButton>
    </div>
  );
}
