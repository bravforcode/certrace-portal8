"use client";

/* ════════════════════════════════════════════════════════════
   WORKSPACE SHELL — one pinned bar, three things it can be about

   The upper part STICKS. What you are looking at, and which view of it you
   are in, are the two facts that make every number below them readable, and
   on the MMD and month screens the body is long enough that scrolling used to
   take both off the top of the window.

   THE BAR IS ABOUT ONE OBJECT AT A TIME. Which object depends on where you
   are standing, and there are exactly three places:

     chain      — the Supply Chain page, and the FIRST page a product card
                  opens. A product and its supply chain are the same level:
                  this is the chain OF that product, so the identity is the
                  product — its name and CN code — and the body is the chain
                  beneath it. NO object's tabs are drawn here: four tabs
                  above a page of many objects act on whichever one the
                  reader isn't looking at.
     workspace  — the chain's ROOT INSTALLATION, opened from the chain. It
                  is where this product is actually made, so the year's work
                  is its work: identity is the installation, and the strip is
                  the four real tabs.
     entity     — any other node of the chain, on its own page. Identity:
                  that node. Strip: that node's four tabs, locked where the
                  node genuinely hasn't got them (lib/tree-entity.ts).

   The identity block above the strip is deliberately two short rows, not the
   four-line title block this shell once carried: it is pinned, so every pixel
   it takes is a pixel of the table underneath it. See IdentityBar in
   components/workspace/chrome.tsx.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn, EnglishOnlyNotice } from "@/components/ui";
import {
  EntityTabStrip,
  IdentityBar,
  ResponsibilityBar,
  StateChip,
  TabStrip,
  tabKeyFromPath,
} from "@/components/workspace/chrome";
import { NodeStatusBadge, TIER_LABEL } from "@/components/tree-node-card";
import { WorkspaceProvider, useWorkspace } from "@/components/workspace/provider";
import { entityTabs, trackedParentChainHref, type TrackedParent } from "@/lib/tree-entity";
import { useChainCounts, useChainNode, useTrackedParent, useWorkspace as useWorkspaceQuery } from "@/lib/workspaces-query";
import { ErrorState, LoadingState } from "@/components/query-state";
import { useT, type TFunction } from "@/lib/i18n";

/* ── Which of the three the current address is ─────────────────── */
type Mode = { kind: "workspace" } | { kind: "chain" } | { kind: "entity"; nodeId: string };

function modeFor(pathname: string, id: string): Mode {
  const rest = pathname.replace(`/workspaces/${id}`, "").replace(/^\//, "");
  if (rest === "tree") return { kind: "chain" };
  if (rest.startsWith("tree/")) return { kind: "entity", nodeId: decodeURIComponent(rest.slice("tree/".length).split("/")[0]) };
  return { kind: "workspace" };
}

/* ── Where "back" goes ──────────────────────────────────────────
   One back control, and it points at whatever is actually one level up.

   A month screen used to carry two: the shell's "Verification workspaces" and
   the page's own "All months", stacked. Neither was wrong and together they
   were a guess — the reader has to decide which of two arrows undoes the
   click they just made. The shell now owns the only one, and on a month it
   says "All months", because that is the level above a month.

   ── A TRACKED PRECURSOR'S WORKSPACE CLIMBS TO THE PARENT CHAIN ──
   `parent` is set only for a workspace that exists because somebody pressed
   "Track report" on a precursor row (lib/tree-entity.ts). Inside, such a
   workspace is an ordinary one — same tabs, same pipeline — but it was
   REACHED from one specific page: that precursor's row on the parent
   product's supply chain, beside every other supplier in the chain. Its own
   chain holds one installation and no siblings, so backing into it returns
   the reader to a page with a single row on it and none of the context they
   left. So every level of a tracked workspace that would otherwise end at its
   own chain ends at the parent's instead, with the row selected.

   The INNER levels are untouched: a month still goes back to All months, and
   the MMD still goes back to Monthly data. Those are genuinely one level up
   inside this workspace, tracked or not. */
function backTarget(pathname: string, id: string, parent: TrackedParent | null, t: TFunction): { href: string; label: string } {
  const rest = pathname.replace(`/workspaces/${id}`, "").replace(/^\//, "");
  if (/^monthly\/\d{4}-\d{2}$/.test(rest)) return { href: `/workspaces/${id}/monthly`, label: t("All months") };
  // The MMD and the precursor chain no longer have tabs of their own — they are
  // opened from the Monthly data tab, so that is the level above them. Without
  // this they would send the reader all the way out to the estate, which is two
  // levels up and not where they came from.
  if (rest === "mmd" || rest.startsWith("precursors")) return { href: `/workspaces/${id}/monthly`, label: t("Monthly data") };
  if (parent)
    return {
      href: trackedParentChainHref(parent),
      label: t("{supplier} — supply chain", { supplier: parent.precursor.name || t("Supplier") }),
    };
  // Everything else is a tab of the root installation, and the level above an
  // installation is the chain it sits at the top of — not the estate, which
  // is two levels up and no longer where the reader came from.
  return { href: `/workspaces/${id}/tree`, label: t("Supply chain") };
}

/* ── Where the English notice belongs ───────────────────────────
   On the surfaces that take PROSE, and nowhere else. The readiness and
   shipments tabs are figures and pickers; a language notice above them is
   furniture the reader learns to skip, and a notice people have learned to
   skip is not on screen when it finally matters. */
function typesFreeText(pathname: string, id: string): boolean {
  const rest = pathname.replace(`/workspaces/${id}`, "").replace(/^\//, "");
  // NOT on the Overview, and NOT on the chain or the entity pages under it.
  // Those three are read far more often than they are typed into — the
  // Overview is a summary you pass through on the way to a tab, and the chain
  // is a map — so a language notice pinned above them is furniture on every
  // visit for the sake of the rare edit. It stays where prose is actually
  // being written: the MMD, a month, and the precursor screens.
  return rest === "mmd" || rest.startsWith("precursors") || /^monthly\/\d{4}-\d{2}$/.test(rest);
}

/* ── Where the responsibility bar belongs ───────────────────────
   Same argument as the notice above, one level up: on a tab that is somebody's
   recurring job, and nowhere else. The chain page and the entity pages under
   it show MANY objects (or one node of many), so a single "supplier fills this
   in, every month" line above them describes whichever tier the reader is not
   looking at; the Overview is identity, which is not a cadence at all. */
function showsResponsibility(pathname: string, id: string): boolean {
  const rest = pathname.replace(`/workspaces/${id}`, "").replace(/^\//, "");
  if (rest === "" || rest === "tree" || rest.startsWith("tree/")) return false;
  // Not on Monthly data either. That tab already IS the schedule — twelve
  // cards, each naming who it went to, when it is due and how long is left —
  // so a banner above it saying "supplier fills this in, every month, within
  // a few weeks of each month closing" is the same three facts a second time,
  // in the abstract, above the concrete version.
  if (rest === "monthly" || rest.startsWith("monthly/")) return false;
  /* Nor on Readiness or Settings, for the same reason one level up: neither is
     a recurring job somebody is chased for. Readiness is a REPORT ON the other
     tabs — "you fill this in, ongoing, before you engage a verifier" describes
     reading a screen, which is not a cadence — and Settings is one dropdown
     that is set once. Both banners said, in the abstract, what the screen
     underneath was already saying concretely. */
  if (rest === "readiness" || rest === "settings") return false;
  return true;
}

function CountChip({ value, label, tone }: { value: number; label: string; tone?: "err" | "ok" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.1em]",
        tone === "err" && value > 0
          ? "border-[rgba(220,38,38,0.18)] bg-[#fef2f2] text-[#dc2626]"
          : tone === "ok" && value > 0
            ? "border-[rgba(5,150,105,0.18)] bg-[#ecfdf5] text-[#047857]"
            : "border-black/10 bg-black/[0.03] text-black/45",
      )}
    >
      <span className="font-mono tabular-nums">{value}</span> {label}
    </span>
  );
}

function WorkspaceBar({ parent }: { parent: TrackedParent | null }) {
  const t = useT();
  const { workspace, readiness, states } = useWorkspace();
  const pathname = usePathname();

  return (
    <>
      <IdentityBar
        back={backTarget(pathname, workspace.id, parent, t)}
        /* THE INSTALLATION, because that is the node that was clicked. The
           chain page one level up already names the product; repeating it
           here would leave the reader unable to tell they had moved. The
           product stays in `meta`, where it keeps the four tabs unambiguous —
           "Monthly data" for THIS good at THIS site. */
        title={workspace.installationName}
        meta={`${workspace.productName} · CN ${workspace.cnCode || "—"} · ${workspace.year}`}
        right={
          <>
            <span
              className="hidden font-mono text-[11px] text-black/35 sm:inline"
              title={t("Share of readiness tabs that are fully complete. Descriptive only — never a gate to submission.")}
            >
              {t("{percent}% of applicable tabs", { percent: readiness.percentComplete })}
            </span>
            <StateChip state={readiness.overall} />
          </>
        }
      />
      <div className="mt-2">
        <TabStrip workspace={workspace} states={states} />
      </div>
    </>
  );
}

function ChainBar({ parent }: { parent: TrackedParent | null }) {
  const t = useT();
  const { workspace } = useWorkspace();
  /* What the four tabs cannot say at chain level: how deep does this go, and
     how much of it is in trouble. See useChainCounts in lib/workspaces-query.ts. */
  const { data: counts } = useChainCounts(workspace.id);

  return (
    <IdentityBar
      /* A tracked precursor's own chain climbs to the chain it hangs in, not
         out to the estate — see backTarget(). The estate is still one click
         away in the wordmark, and two clicks away up the chain it belongs to,
         which is the route that keeps the reader oriented. */
      back={
        parent
          ? {
              href: trackedParentChainHref(parent),
              label: t("{supplier} — supply chain", { supplier: parent.precursor.name || t("Supplier") }),
            }
          : { href: "/workspaces", label: t("Verification workspaces") }
      }
      /* THE PRODUCT. This page is not a thing beside the product that happens
         to list suppliers — it is that product's supply chain, and the level
         above it is the estate. Naming it "Supply chain" over an installation
         said the opposite: that a chain was a place with products in it. */
      title={workspace.productName}
      meta={`CN ${workspace.cnCode || "—"} · ${workspace.year}`}
      right={
        counts ? (
          <>
            <CountChip value={counts.suppliers} label={counts.suppliers === 1 ? t("supplier") : t("suppliers")} />
            <CountChip value={counts.tiers} label={counts.tiers === 1 ? t("tier deep") : t("tiers deep")} />
            <CountChip value={counts.blocked} label={t("blocked")} tone="err" />
            <CountChip value={counts.verified} label={t("verified")} tone="ok" />
          </>
        ) : null
      }
    />
  );
}

function EntityBar({ nodeId }: { nodeId: string }) {
  const t = useT();
  const { workspace } = useWorkspace();
  const { data: node } = useChainNode(workspace.id, nodeId);
  /* NOT the parent chain. An entity page is one level inside THIS chain, so
     the level above it is this chain — the reader clicked a row on it to get
     here. The climb to the parent happens from the chain page itself. */
  const back = { href: `/workspaces/${workspace.id}/tree`, label: t("Supply chain") };

  // Before the first client read there is nothing to name — the bar still
  // renders, so the back link and the strip's position don't jump in once
  // localStorage is read.
  if (!node) return <IdentityBar back={back} title="…" />;

  return (
    <>
      <IdentityBar
        back={back}
        title={node.name || "Unnamed"}
        meta={`${TIER_LABEL(node.tier, node.kind)}${node.cnCode ? ` · CN ${node.cnCode}` : ""}`}
        right={node.kind === "installation" ? undefined : <NodeStatusBadge node={node} />}
      />
      <div className="mt-2">
        <EntityTabStrip tabs={entityTabs(node, workspace.id)} activeKey="overview" />
      </div>
    </>
  );
}

function Header({ mode, parent }: { mode: Mode; parent: TrackedParent | null }) {
  return (
    <div
      className={
        // top-16, not top-0: the portal shell's own header is `sticky top-0`
        // and 4rem tall, so pinning this to 0 parks it underneath — invisible,
        // and worse than not pinning at all.
        //
        // -mt-8 cancels the shell's own `py-8` on <main>. Without it the bar
        // starts 32px below the topbar, so on arrival there is a band of bare
        // page background above it that closes the moment you scroll — which
        // reads as the header jumping rather than as padding.
        //
        // z-30 sits above page content and below the portaled popovers and
        // dialogs, so a dropdown opened in the last row of a long table still
        // renders over this bar.
        "sticky top-16 z-30 -mx-4 -mt-8 border-b border-black/[0.06] bg-[#fdfdfc]/95 px-4 pb-2 pt-3 backdrop-blur-md sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10"
      }
    >
      {mode.kind === "chain" ? <ChainBar parent={parent} /> : mode.kind === "entity" ? <EntityBar nodeId={mode.nodeId} /> : <WorkspaceBar parent={parent} />}
    </div>
  );
}

export default function WorkspaceLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const pathname = usePathname();
  const workspaceQuery = useWorkspaceQuery(id);
  const workspace = workspaceQuery.data ?? null;
  /* Which chain this workspace hangs in, if any. localStorage-backed like
     everything else here, so it resolves after mount — nothing on the first
     paint means the back link starts as this workspace's own chain and settles
     onto the parent's a tick later. That is the correct fallback rather than a
     flicker to fix: an untracked workspace never moves. */
  const parent = useTrackedParent(id).data ?? null;

  React.useEffect(() => {
    // `null` is a resolved miss; while loading the data is still undefined.
    if (workspaceQuery.data === null) router.replace("/workspaces");
  }, [workspaceQuery.data, router]);

  // `null` is a resolved miss (the effect above redirects); undefined is still
  // loading. Surface the two query states here, once, for every tab that hangs
  // off this layout rather than in each child page.
  if (workspaceQuery.isError) return <ErrorState onRetry={() => void workspaceQuery.refetch()} />;
  if (!workspace) return <LoadingState />;

  const mode = modeFor(pathname, workspace.id);

  return (
    <WorkspaceProvider workspace={workspace}>
      <div>
        <Header mode={mode} parent={parent} />
        {/* Anchored deep links (readiness → a month, a coverage row) have to
            clear the pinned header, or the row they scroll to lands under it. */}
        <div className="scroll-mt-40 space-y-5 pt-6">
          {/* The "who fills this in, and when" bar belongs on the tabs that
              ARE a piece of scheduled work. The Overview, the chain and an
              entity's own page are none of them: the Overview is identity,
              and the chain is every tier at once, each with a different owner
              and a different cadence — one banner over all of them can only
              be wrong about most. See showsResponsibility(). */}
          {showsResponsibility(pathname, workspace.id) && <ResponsibilityBar tab={tabKeyFromPath(pathname, workspace.id)} />}
          {typesFreeText(pathname, workspace.id) && <EnglishOnlyNotice />}
          {children}
        </div>
      </div>
    </WorkspaceProvider>
  );
}
