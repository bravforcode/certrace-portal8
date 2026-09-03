"use client";

export const runtime = "edge";

/* ════════════════════════════════════════════════════════════
   ONE ENTITY IN THE CHAIN — where its four tabs actually live

   The Supply Chain page shows the whole chain and carries no tabs, because
   Overview / Monthly data / Readiness / Settings describe one entity and that
   page shows many. This is that one entity: a precursor that has no workspace
   of its own yet.

   AN ENTITY THAT DOES HAVE A WORKSPACE NEVER LANDS HERE. The chain's root
   installation IS this product's VerificationWorkspace — the good is made
   there, so the year's months and readiness are its own — and a precursor
   becomes one the moment somebody uses "Track report" on its chain row.
   In both cases the real Overview, with the real months and the real
   readiness, already exists at /workspaces/<id>, and a second detail page in
   front of it would be a page you click through. entityHref()
   (lib/tree-entity.ts) sends those straight there, and this route redirects
   if one is reached by an old link — including `…/tree/installation`, which
   older bookmarks still point at.

   The three tabs an entity here cannot open are shown LOCKED rather than
   hidden — see entityTabs() for why — and the note at the top of the page
   repeats the same sentence the lock's tooltip carries, next to the action
   that resolves it.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ListTree } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { FactGrid, Note, SectionCard } from "@/components/workspace/chrome";
import { ChainEditor } from "@/components/workspace/chain-editor";
import { TIER_LABEL } from "@/components/tree-node-card";
import { ValueTypeBadge } from "@/components/precursor/status-chips";
import { useWorkspace } from "@/components/workspace/provider";
import { entityTabs, entityWorkspaceId } from "@/lib/tree-entity";
import { DATA_ORIGIN_LABEL, PRECURSOR_ORIGIN_LABEL, totalTonnes } from "@/lib/precursor-suppliers";
import { useChainNode } from "@/lib/workspaces-query";
import { usePrecursorSupplier } from "@/lib/suppliers-query";
import type { TreeNode } from "@/types/supplier-tree";
import { useT } from "@/lib/i18n";

const dash = (v: React.ReactNode) => (v === "" || v == null ? "—" : v);

/* ── A precursor ────────────────────────────────────────────────
   Every fact on the row, laid out once. The row's ACTIONS — track a report,
   send the link, enter verified data, add a precursor — are not restated
   here: they are on the node card below, which is the same card the chain
   shows, wired through the same ChainEditor. */
function PrecursorBody({ node }: { node: TreeNode }) {
  const t = useT();
  const { workspace } = useWorkspace();
  const { data: row } = usePrecursorSupplier(workspace.id, node.id);

  if (!row) return null;

  /* HOW MUCH OF IT, in whichever of the two forms is actually on file.

     A tier-1 supplier reports twelve monthly tonnages; a tier-3 one almost
     never does — they quote a ratio ("0.5 t coke per t of output") and
     nothing else, which is what `qtyPerTonneOverride` holds. Quoting the
     monthly total alone therefore reads as "—" on most upper tiers even
     though the figure the arithmetic uses is right there. Same precedence as
     qtyPerTonne() in lib/precursor-suppliers.ts, so this can never show a
     quantity the calculation didn't use. */
  const tonnes = totalTonnes(row);
  const quantity =
    tonnes > 0
      ? `${tonnes.toLocaleString()} t`
      : row.qtyPerTonneOverride
        ? `${row.qtyPerTonneOverride} t per t of output (ratio)`
        : "—";

  /* THE SAME FIGURE THE CHAIN SHOWS, not the row's own field.

     A node with children has no meaningful seeTco2ePerT of its own — the
     compliance-facing number is effectiveSee()'s roll-up of what is beneath
     it, which is what TreeNode.see already carries and what the card below
     this prints. Reading row.seeTco2ePerT here instead put "Not declared
     yet" directly above a card showing 0.4800 for the same entity. */
  const seeLabel = node.children.length > 0 ? "Specific embedded emissions (rolled up from this chain)" : "Specific embedded emissions";

  return (
    <>
      <SectionCard
        title={t("About this entity")}
        blurb={t("Who produced this precursor, and the figure the chain carries for it.")}
        actions={<ValueTypeBadge node={row} />}
      >
        <FactGrid
          rows={[
            ["Company", dash(row.name)],
            ["Producing installation", dash(row.installationName)],
            ["Country", dash(row.country)],
            ["Precursor", dash(row.precursorName)],
            ["CN code", dash(row.cnCode)],
            ["Production route", dash(row.productionRoute)],
            ["Origin", PRECURSOR_ORIGIN_LABEL[row.origin]],
            ["Quantity used", quantity],
            [seeLabel, node.see != null ? `${node.see.toFixed(4)} tCO₂e/t` : "Not declared yet"],
            ["Where the figure came from", DATA_ORIGIN_LABEL[row.dataOrigin]],
          ]}
        />
      </SectionCard>

      <SectionCard
        title={t("This entity in the chain")}
        blurb={t("The same card the Supply Chain page shows for this node — its progress, its score and every action, on the one row. Documents and the four verification checks are inside Enter verified data, beside the figure they qualify.")}
      >
        <React.Suspense fallback={null}>
          <ChainEditor rootNodeId={node.id} />
        </React.Suspense>
      </SectionCard>
    </>
  );
}

function EntityDetail({ nodeId }: { nodeId: string }) {
  const t = useT();
  const { workspace } = useWorkspace();
  const router = useRouter();
  // Query semantics keep "not read yet" (undefined) and "read, and this node
  // isn't in the chain" (null) distinguishable, so the first paint of an
  // entity page never flashes the not-found state.
  const { data: found } = useChainNode(workspace.id, nodeId);
  const node = found ?? null;

  // A node that has a workspace of its own is that workspace — see the file
  // header. Redirect rather than render a shadow of it.
  const ownWorkspace = node ? entityWorkspaceId(node) : null;
  React.useEffect(() => {
    if (ownWorkspace) router.replace(`/workspaces/${ownWorkspace}`);
  }, [ownWorkspace, router]);

  if (found === null) {
    return (
      <EmptyState
        icon={<ListTree size={28} strokeWidth={1.25} />}
        title={t("This entity is no longer in the chain")}
        body={t("It may have been removed, or the link is from an older version of this chain.")}
        action={
          <Link
            href={`/workspaces/${workspace.id}/tree`}
            className="rounded-lg border border-black/15 px-4 py-2 text-[12px] uppercase tracking-[0.08em] text-black/60 hover:border-black/30 hover:text-black"
          >
            {t("Back to the supply chain →")}
          </Link>
        }
      />
    );
  }
  if (!node || ownWorkspace) return null;

  const locked = entityTabs(node, workspace.id).find((t) => t.lockedReason)?.lockedReason;

  return (
    <div className="space-y-5">
      {locked && (
        <Note tone="info">
          <span className="font-medium">{TIER_LABEL(node.tier, node.kind)}.</span> {locked}
        </Note>
      )}
      <PrecursorBody node={node} />
    </div>
  );
}

export default function EntityDetailPage({ params }: { params: Promise<{ nodeId: string }> }) {
  const { nodeId } = React.use(params);
  return <EntityDetail nodeId={decodeURIComponent(nodeId)} />;
}
