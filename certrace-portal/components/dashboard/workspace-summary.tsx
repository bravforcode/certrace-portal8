"use client";

/* ════════════════════════════════════════════════════════════
   WIDGET J — WORKSPACE SUMMARY (1-to-N scaling)

   Exactly 1 workspace: a single wide hero card, no grid, no "1 of 1".
   2+ workspaces: a sorted list/grid, most urgent first. Two genuinely
   different layouts, not the same card repeated into a one-cell grid.
   ════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, cn } from "@/components/ui";
import { DotStrip, StateChip } from "@/components/workspace/chrome";
import { isBuyerReady, notBuyerReadyReason } from "@/lib/cbam/buyer-ready";
import { TAB_LABEL, dotStates, type ReadinessTab, type TabState, type WorkspaceReadiness } from "@/lib/readiness";
import type { VerificationWorkspace } from "@/lib/workspace";
import { useT } from "@/lib/i18n";

export type WorkspaceSummaryRow = {
  workspace: VerificationWorkspace;
  readiness: WorkspaceReadiness;
  /** days until the nearest deadline this workspace owns, from the Action
      Queue — null when nothing is currently pending */
  nearestDeadlineDays: number | null;
};

const GATE_TABS: ReadinessTab[] = ["mmd", "monthly", "precursors", "evidence"];

function deadlineLabel(days: number | null): string {
  if (days == null) return "No deadline pending";
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due now";
  return `Due in ${days}d`;
}

function GateChips({ readiness }: { readiness: WorkspaceReadiness }) {
  const t = useT();
  return (
    <div className="flex flex-wrap gap-1.5">
      {GATE_TABS.map((tab) => {
        /* NOT `t` — that is the translator in every other component in this
           codebase, and shadowing it here made `title={t(TAB_LABEL[tab])}` call
           a readiness row. */
        const row = readiness.tabs.find((x) => x.tab === tab);
        if (!row) return null;
        return (
          <span key={tab} className="inline-flex items-center gap-1 text-[11px] text-black/45" title={t(TAB_LABEL[tab])}>
            <StateChip state={row.state} className="px-2 py-0.5 text-[9.5px]" />
          </span>
        );
      })}
    </div>
  );
}

function HeroCard({ row }: { row: WorkspaceSummaryRow }) {
  const t = useT();
  const { workspace: w, readiness } = row;
  const buyerReady = isBuyerReady(readiness);
  return (
    <Link href={`/workspaces/${w.id}/tree`} className="block">
      <Card className="p-7 transition-colors hover:border-black/15 hover:bg-[#fafaf8]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#111]">{w.productName}</div>
            <p className="mt-1 font-mono text-[12px] text-black/40">
              CN {w.cnCode || "—"} · {w.installationName} · {w.year}
            </p>
          </div>
          <span
            className={cn(
              "flex-none rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.08em]",
              buyerReady ? "border-[rgba(5,150,105,0.2)] bg-[#ecfdf5] text-[#047857]" : "border-black/10 bg-black/[0.03] text-black/45",
            )}
          >
            {buyerReady ? "Buyer-ready" : "Not yet buyer-ready"}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
          <GateChips readiness={readiness} />
          <span className="text-[12px] text-black/40">{deadlineLabel(row.nearestDeadlineDays)}</span>
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-[12px] uppercase tracking-[0.08em] text-black/35">
          {t("Open workspace")} <ArrowRight size={12} strokeWidth={1.5} />
        </div>
      </Card>
    </Link>
  );
}

function ListCard({ row }: { row: WorkspaceSummaryRow }) {
  const { workspace: w, readiness } = row;
  const buyerReady = isBuyerReady(readiness);
  const dots = dotStates(readiness);
  return (
    <Link href={`/workspaces/${w.id}/tree`} className="block">
      <Card className={cn("p-5 transition-colors hover:border-black/15 hover:bg-[#fafaf8]", readiness.overall === "blocked" && "border-[#fecaca]")}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate font-[family-name:var(--font-plex)] text-[15px] font-light text-[#111]">{w.productName}</div>
            <p className="mt-0.5 truncate font-mono text-[11px] text-black/40">
              CN {w.cnCode || "—"} · {w.installationName}
            </p>
          </div>
          <StateChip state={readiness.overall} className="flex-none" />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <DotStrip states={dots} className="flex-none" />
          <span className="flex-none text-[11px] text-black/40">{deadlineLabel(row.nearestDeadlineDays)}</span>
        </div>
        <div className="mt-2">
          <span className={cn("text-[11px] uppercase tracking-[0.06em]", buyerReady ? "text-[#047857]" : "text-black/35")}>
            {buyerReady ? "Buyer-ready" : notBuyerReadyReason(readiness) ?? "Not yet buyer-ready"}
          </span>
        </div>
      </Card>
    </Link>
  );
}

export function WorkspaceSummary({ rows }: { rows: WorkspaceSummaryRow[] }) {
  const t = useT();
  if (rows.length === 0) return null;

  // Most urgent first: blocked before incomplete before complete, and within
  // that, the nearer/more-overdue deadline first. A dashboard sorted by name
  // is a list; sorted by what needs you next, it is a work queue.
  const sorted = [...rows].sort((a, b) => {
    const rank = (s: TabState) => (s === "blocked" ? 0 : s === "incomplete" ? 1 : 2);
    const byState = rank(a.readiness.overall) - rank(b.readiness.overall);
    if (byState !== 0) return byState;
    const ad = a.nearestDeadlineDays ?? Infinity;
    const bd = b.nearestDeadlineDays ?? Infinity;
    return ad - bd;
  });

  if (sorted.length === 1) {
    return (
      <section>
        <h2 className="mb-3 text-[11px] uppercase tracking-[0.1em] text-black/40">{t("Your workspace")}</h2>
        <HeroCard row={sorted[0]} />
      </section>
    );
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[11px] uppercase tracking-[0.1em] text-black/40">Workspaces — {sorted.length}</h2>
        <Link href="/workspaces" className="text-[11px] uppercase tracking-[0.1em] text-black/40 hover:text-black">
          {t("View all →")}
        </Link>
      </div>
      <div className={cn("grid gap-3", sorted.length > 6 ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3")}>
        {sorted.map((row) => (
          <ListCard key={row.workspace.id} row={row} />
        ))}
      </div>
    </section>
  );
}
