"use client";

/* ════════════════════════════════════════════════════════════
   THE DASHBOARD — the whole business on one screen

   ── WHAT CHANGED, AND WHY ──────────────────────────────────
   The page used to be nine unlabelled rows in a single column, ordered
   actionable-first. Every widget on it was worth having and every one of them
   is still here — but as a SCREEN it had three problems, and all three came
   from the same thing: it had no summit and no map.

   1. NO SUMMIT. Whatever the reader wanted to know, they scrolled for it. The
      first thing they met was the Action queue, which on a healthy account
      says "nothing needs attention" — true, and it tells them nothing about
      the year. The new band (YearAtAGlance) answers the six questions
      somebody opening the portal actually has, above the fold, in one row.

   2. NO MAP. Eleven cards in a column with no headings read as eleven
      unrelated cards. They are not: they are four different jobs. The page is
      now four labelled bands — what needs you, where each product stands, who
      you are waiting on, and what it is worth — so a reader looking for the
      supplier picture can find it without reading the money widgets on the
      way past.

   3. NOTHING ABOUT COLLECTING. The single hardest part of a CBAM year is
      getting answers out of suppliers, and the only thing the dashboard said
      about it was a funnel of how many had ever replied. It never showed the
      asks sitting UNSENT on the exporter's own desk — the one state in the
      whole flow that is their move rather than somebody else's. That is the
      new RequestBoard, read from the same builder the Smart Links page uses.

   REPLACED: the old Widget B (Risk & Deadline Overview) row of four tiles.
   Every one of its figures survives — days to the deadline and blocked count
   in the band above, percent-on-default in the RequestBoard's footnote — but
   as four tiles of its own it was a second summary competing with the first.

   ── WHAT IS STILL DELIBERATELY MISSING ─────────────────────
   Widget H (Certificate Price Exposure Forecast), which the original pack
   itself gates: "do not build until cbam_phase_in_factors is fully sourced,
   since an inaccurate forecast is worse than no forecast on a compliance
   product." Only 2026's 2.5% is confirmed (see lib/cbam/cost-exposure.ts), so
   a forecast into 2027+ would have to invent the rate that governs it.

   Widget D (trust score) renders a dependency notice rather than a number,
   for the reason given in its own file — the same "flag it, don't invent it"
   rule. It has moved out of the prime slot beside Buyer-ready and now sits
   where a reader is already reading about verification quality.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { LayoutGrid, Plus } from "lucide-react";
import { Button, EmptyState, Eyebrow, PageHeader, cn } from "@/components/ui";
import { useClientData } from "@/components/workspace/chrome";
import { USER } from "@/lib/data";
import { DATA_OWNER_NAME, can } from "@/lib/seat";
import { useT } from "@/lib/i18n";
import { actionQueueFor, type ActionItem } from "@/lib/cbam/action-queue";
import { portfolioCostAvoidance, type CostAvoidanceResult } from "@/lib/cbam/cost-exposure";
import {
  buyerReadyRows,
  nextDeclarationDeadline,
  daysToNextDeclarationDeadline,
  riskDeadlineStats,
  supplierFunnel,
  type BuyerReadyRow,
  type SupplierFunnel,
} from "@/lib/cbam/dashboard-aggregates";
import { activityFeedFor, type ActivityEvent } from "@/lib/cbam/activity-feed";
import { precursorRiskFor } from "@/lib/cbam/precursor-risk";
import { benchmarkOutperformance, seeTrendFor, type BenchmarkOutperformance, type SeeTrendPoint } from "@/lib/cbam/see-trend";
import { defaultSeeForWorkspace } from "@/lib/cbam/cost-exposure";
import { buildSmartLinks, countByState } from "@/lib/smart-links";
import { listWorkspaces, type VerificationWorkspace } from "@/lib/workspace";
import { workspaceReadiness, type WorkspaceReadiness } from "@/lib/readiness";
import { workspaceSEE } from "@/lib/workspace-see";
import { ActionQueue } from "@/components/dashboard/action-queue";
import { CostAvoidanceWidget } from "@/components/dashboard/cost-avoidance";
import { WorkspaceSummary, type WorkspaceSummaryRow } from "@/components/dashboard/workspace-summary";
import { BuyerReadyStatus } from "@/components/dashboard/buyer-ready-status";
import { SupplierHealth } from "@/components/dashboard/supplier-health";
import { TrustScoreWidget } from "@/components/dashboard/trust-score";
import { SeeTrend } from "@/components/dashboard/see-trend";
import { BenchmarkWidget } from "@/components/dashboard/benchmark";
import { PrecursorRiskWidget, type PrecursorRiskRow } from "@/components/dashboard/precursor-risk";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { YearAtAGlance, YearAtAGlanceSkeleton, type GlanceStats } from "@/components/dashboard/year-at-a-glance";
import { RequestBoard, type RequestBoardStats } from "@/components/dashboard/request-board";

type DashboardData = {
  workspaces: VerificationWorkspace[];
  glance: GlanceStats;
  requests: RequestBoardStats;
  actionItems: ActionItem[];
  costAvoidance: CostAvoidanceResult;
  summaryRows: WorkspaceSummaryRow[];
  buyerReady: BuyerReadyRow[];
  funnel: SupplierFunnel;
  trendPoints: SeeTrendPoint[];
  trendDefault: number | null;
  benchmarks: BenchmarkOutperformance[];
  precursorRisk: PrecursorRiskRow[];
  activity: ActivityEvent[];
};

function build(): DashboardData {
  const workspaces = listWorkspaces();
  const actionItems = actionQueueFor(workspaces);

  const withSee = workspaces.map((workspace) => ({ workspace, see: workspaceSEE(workspace) }));
  const { total } = portfolioCostAvoidance(withSee);

  const readinessRows = workspaces.map((workspace) => ({ workspace, readiness: workspaceReadiness(workspace) }));
  const readinessByWorkspace = new Map<string, WorkspaceReadiness>(readinessRows.map((r) => [r.workspace.id, r.readiness]));

  const summaryRows: WorkspaceSummaryRow[] = workspaces.map((workspace) => {
    const itemsForThis = actionItems.filter((i) => i.workspaceId === workspace.id);
    const nearestDeadlineDays = itemsForThis.length > 0 ? Math.min(...itemsForThis.map((i) => i.daysUntilDue)) : null;
    return { workspace, readiness: readinessByWorkspace.get(workspace.id)!, nearestDeadlineDays };
  });

  const overdueWorkspaceIds = new Set(actionItems.filter((i) => i.daysUntilDue < 0).map((i) => i.workspaceId));
  const risk = riskDeadlineStats(readinessRows, overdueWorkspaceIds);
  const buyerReady = buyerReadyRows(readinessRows);

  /* THE SAME BUILDER THE SMART LINKS PAGE RENDERS. Counting requests a second
     way here is how a summary starts disagreeing with the list it summarises. */
  const links = buildSmartLinks();
  const byState = countByState(links);

  /* Collection progress is the MEAN of the per-workspace readiness the rest of
     the product already computes — not a second definition of "done". An empty
     estate reads 0 rather than NaN. */
  const collectedPercent =
    readinessRows.length === 0 ? 0 : Math.round(readinessRows.reduce((sum, r) => sum + r.readiness.percentComplete, 0) / readinessRows.length);

  /* Widget F plots ONE workspace's series — several products on one axis
     would be several different goods' per-tonne figures overlaid, which is
     not a trend, it is a coincidence. The first workspace with a computable
     series is the one shown; its own category default is the reference
     line, so the two always describe the same good. */
  const trendSource = withSee.find((r) => seeTrendFor(r.see).length > 0) ?? withSee[0];
  const trendPoints = trendSource ? seeTrendFor(trendSource.see) : [];
  const trendDefaultRow = trendSource ? defaultSeeForWorkspace(trendSource.workspace) : null;
  const trendDefault = trendDefaultRow ? trendDefaultRow.defaultSeeDirect + trendDefaultRow.defaultSeeIndirect : null;

  const benchmarks = withSee
    .map((r) => benchmarkOutperformance(r.workspace, r.see))
    .filter((b): b is BenchmarkOutperformance => b != null);

  return {
    workspaces,
    glance: {
      daysToDeadline: daysToNextDeclarationDeadline(),
      deadlineDate: nextDeclarationDeadline(),
      overdue: actionItems.filter((i) => i.daysUntilDue < 0).length,
      awaiting: byState.late + byState.in_process,
      late: byState.late,
      buyerReady: buyerReady.filter((r) => r.ready).length,
      buyerTotal: buyerReady.length,
      collectedPercent,
      savingsThb: total.status === "ok" ? total.savingsThb : null,
    },
    requests: {
      toSend: byState.send_now,
      late: byState.late,
      inProgress: byState.in_process,
      answered: byState.done,
      notDue: byState.not_due,
      percentOnDefault: risk.percentPrecursorDefault,
    },
    actionItems,
    costAvoidance: total,
    summaryRows,
    buyerReady,
    funnel: supplierFunnel(workspaces),
    trendPoints,
    trendDefault,
    benchmarks,
    precursorRisk: workspaces.map((workspace) => ({ workspace, risk: precursorRiskFor(workspace) })),
    activity: activityFeedFor(workspaces),
  };
}

export default function DashboardPage() {
  const t = useT();
  const [data] = useClientData(build);
  const year = new Date().getFullYear();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("Overview")}
        title={t("Good afternoon, {name}.", { name: USER.name.split(" ")[0] })}
        lead={t("Everything that needs you, what it is worth avoiding, and where every product stands.")}
        actions={
          /* NOT THIS SEAT'S. Building a workspace originates the thing this
             seat exists to check (lib/seat.ts). The dashboard is the screen a
             reviewer opens every morning, so a create button they can never
             press would be the most-seen refusal in the product. */
          can("buildWorkspaces") ? (
            <Link href="/workspaces/new">
              <Button>
                <Plus size={15} strokeWidth={1.5} /> {t("New workspace")}
              </Button>
            </Link>
          ) : null
        }
      />

      {data === null ? (
        <YearAtAGlanceSkeleton t={t} />
      ) : data.workspaces.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid size={28} strokeWidth={1.25} />}
          title={t("Nothing to show yet")}
          body={
            /* THE EMPTY STATE HAD TO CHANGE, not just lose its button. The
               owner build's copy is an instruction — "Create the first one and
               this screen fills itself" — addressed to somebody who cannot.
               An empty account is not this seat's problem to solve; it is a
               fact about somebody else's work not having started, and the
               screen should say whose. */
            can("buildWorkspaces")
              ? t(
                  "A verification workspace is one installation × one good × one reporting year. Create the first one and this screen fills itself: what needs you, what verified data is worth against the EU default, and how close each product is to surviving a verifier.",
                )
              : t(
                  "A verification workspace is one installation × one good × one reporting year. Nothing has been built yet, so there is nothing to review — this screen fills itself once {name} starts the first one.",
                  { name: DATA_OWNER_NAME },
                )
          }
          action={
            can("buildWorkspaces") ? (
              <Link href="/workspaces/new">
                <Button>
                  <Plus size={15} strokeWidth={1.5} /> {t("Create the first workspace")}
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* ── The summit. Six figures, no heading — a band that needs a
                label to be understood is not a summary. ─────────────── */}
          <Row i={0}>
            <YearAtAGlance stats={data.glance} />
          </Row>

          {/* ── 1 · What needs you ─────────────────────────────────── */}
          <Band i={1} title={t("What needs you")}>
            <ActionQueue items={data.actionItems} />
          </Band>

          {/* ── 2 · Who you are waiting on ─────────────────────────── */}
          <Band i={2} title={t("Who you're waiting on")}>
            <div className={cn(GRID, "lg:grid-cols-2")}>
              <RequestBoard stats={data.requests} />
              <SupplierHealth funnel={data.funnel} />
            </div>
            <PrecursorRiskWidget rows={data.precursorRisk} />
          </Band>

          {/* ── 3 · Where each product stands ──────────────────────── */}
          <Band i={3} title={t("Where each product stands")}>
            <WorkspaceSummary rows={data.summaryRows} />
            <div className={GRID}>
              <div className="min-w-0 lg:col-span-2">
                <BuyerReadyStatus rows={data.buyerReady} />
              </div>
              <TrustScoreWidget />
            </div>
          </Band>

          {/* ── 4 · What it is worth ───────────────────────────────── */}
          <Band i={4} title={t("What it's worth")}>
            <CostAvoidanceWidget result={data.costAvoidance} year={year} />
            <div className={cn(GRID, "lg:grid-cols-2")}>
              <SeeTrend points={data.trendPoints} defaultSee={data.trendDefault} />
              <BenchmarkWidget benchmarks={data.benchmarks} />
            </div>
          </Band>

          {/* ── 5 · What has happened ──────────────────────────────── */}
          <Band i={5} title={t("Recently")}>
            <ActivityFeed events={data.activity} />
          </Band>
        </>
      )}
    </div>
  );
}

/* A GRID ITEM DEFAULTS TO `min-width: auto`, which means it refuses to
   shrink below its own content's intrinsic minimum — so one long
   `truncate` line inside a card sized the whole track wider than the
   viewport and put the entire page into a horizontal scroll at mobile
   width. `[&>*]:min-w-0` lets every child shrink, which is what finally
   lets the truncation inside them actually engage. */
const GRID = "grid gap-3 lg:grid-cols-3 [&>*]:min-w-0";

/** One row of the dashboard, with the spec's staggered entrance: ~50ms
    between rows, capped so the full sequence stays inside the ~400ms
    budget rather than trickling in. globals.css's own
    prefers-reduced-motion reset disables the animation entirely for users
    who ask for that. */
function Row({ i, children }: { i: number; children: React.ReactNode }) {
  return (
    <div className="ct-row" style={{ animationDelay: `${Math.min(i * 45, 360)}ms` }}>
      {children}
    </div>
  );
}

/** A labelled band. The heading is a `section` landmark as well as a line of
    type: a reader on a screen reader gets the same four-part map a sighted
    reader gets from the eyebrows, instead of eleven sibling cards. */
function Band({ i, title, children }: { i: number; title: string; children: React.ReactNode }) {
  return (
    <Row i={i}>
      <section aria-label={title} className="space-y-3">
        <Eyebrow className="block">{title}</Eyebrow>
        {children}
      </section>
    </Row>
  );
}
