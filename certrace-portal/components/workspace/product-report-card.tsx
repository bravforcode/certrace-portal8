"use client";

/* The product report card — one CN code, one route, one reporting year — and
   the helpers every list of them shares. Used by the Verification page and by
   an installation's Products tab, so a report looks and behaves the same
   wherever it is listed. */

import * as React from "react";
import Link from "next/link";
import { ArchiveRestore } from "lucide-react";
import { Card, Progress, TagBadge, cn } from "@/components/ui";
import { toast } from "@/components/toast";
import { DotStrip, StateChip } from "@/components/workspace/chrome";
import { WorkspaceMenu } from "@/components/workspace/workspace-menu";
import { listSuppliers } from "@/lib/precursor-suppliers";
import { dotStates, workspaceReadiness, type TabState } from "@/lib/readiness";
import { holdsFor } from "@/lib/cbam/report-holds";
import { installationForWorkspace, listInstallations } from "@/lib/installations";
import { profileStatus } from "@/lib/cbam/installation-profile";
import { routeLabel, type VerificationWorkspace } from "@/lib/workspace";
import { useRestoreWorkspace } from "@/lib/store";
import { useT } from "@/lib/i18n";

export type CardData = {
  workspace: VerificationWorkspace;
  overall: TabState;
  dots: TabState[];
  percent: number;
  precursors: number;
};

export function toCards(workspaces: VerificationWorkspace[]): CardData[] {
  const stored = new Map(listInstallations().map((i) => [i.id, i]));
  return workspaces.map((w) => {
    const readiness = workspaceReadiness(w);
    const { overall } = holdsFor(readiness, profileStatus(stored.get(w.installationId) ?? installationForWorkspace(w)));
    return {
      workspace: w,
      overall,
      dots: dotStates(readiness),
      percent: readiness.percentComplete,
      precursors: listSuppliers(w.id).length,
    };
  });
}

/* ── Card ─────────────────────────────────────────────────── */
export function ProductReportCard({ data, onChanged, archived = false }: { data: CardData; onChanged: () => void; archived?: boolean }) {
  const t = useT();
  const restoreWs = useRestoreWorkspace();
  const { workspace, overall, dots, percent, precursors } = data;
  return (
    <div className={cn("relative h-full", archived && "opacity-75 transition-opacity hover:opacity-100")}>
      {/* h-full on the LINK as well as the card. Without it the anchor sizes to
          its content and `h-full` on the card inside means 100% of that — so
          the cards in a row ended up as tall as their own text rather than as
          tall as the row. */}
      <Link href={`/workspaces/${workspace.id}`} className="block h-full">
        <Card className="flex h-full flex-col p-5 transition-colors hover:border-black/20">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="min-w-0">
              <div className="truncate text-[15px] text-black/85">{t(workspace.productName)}</div>
              <div className="mt-0.5 font-mono text-[11px] text-black/40">
                CN {workspace.cnCode || "—"} · {t(routeLabel(workspace.productionRoute))} · {workspace.year}
              </div>
              {/* A supplier's name stays on the card, for the same reason as
                  before: a card gets copied into a screenshot, opened from a
                  search result and read on a phone where the heading has
                  scrolled away, and the supplier is named nowhere else. Your own
                  site carries no tag — being the exporter's own is the default,
                  and a tag on every card says nothing. */}
              {!workspace.selfSupplied && (
                <div className="mt-2">
                  <TagBadge tone="muted">{workspace.supplierName || t("Unassigned supplier")}</TagBadge>
                </div>
              )}
            </div>
            <StateChip state={overall} />
          </div>

          {/* READINESS, not months submitted. Twelve months of readings is a
              fraction of the work on a complex good — the precursor chain, the
              MMD, the evidence and the carbon price all have to land too, and
              "8 of 12 months" read as nearly done while three of those were
              still empty. This is the same figure the workspace's own
              Readiness section reports (readiness.percentComplete, over the
              applicable tabs), so the card and the section never disagree.
              mt-auto pins it and the strip below to the bottom, so the figures
              line up across a row whatever the header above them wrapped to. */}
          <div className="mt-auto pt-4">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-black/35">{t("Readiness")}</span>
              <span className="font-mono text-[11px] text-black/45">{percent}%</span>
            </div>
            <Progress value={percent} tone={overall === "blocked" ? "err" : overall === "complete" ? "ok" : "warn"} />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <DotStrip states={dots} />
            <span className="font-mono text-[10.5px] text-black/35">
              {t(precursors === 1 ? "{n} precursor" : "{n} precursors", { n: precursors })}
            </span>
          </div>

          {/* Restore ON the card, not only in the kebab. Bringing something
              back is the one thing a reader is in the archive to do, and it
              is safe — hiding it behind a ⋯ makes the archive read as a
              graveyard rather than a drawer. */}
          {archived && (
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-black/[0.06] pt-3">
              <span className="font-mono text-[10.5px] text-black/35">Archived {archivedOn(workspace)}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  restore(workspace, restoreWs.mutate);
                }}
                className="inline-flex flex-none items-center gap-1.5 rounded-lg border border-black/10 px-2.5 py-1.5 text-[11.5px] text-black/60 transition-colors hover:border-black/25 hover:text-black"
              >
                <ArchiveRestore size={12} strokeWidth={1.5} /> {t("Restore")}
              </button>
            </div>
          )}
        </Card>
      </Link>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events --
   the row is a <Link>; this wrapper exists only to stop the link firing when the
   menu inside it is used. It is plumbing, not a control — the menu it wraps is the
   control, and that one is a real button. */}
<span className="absolute right-3 top-3" onClick={(e) => e.preventDefault()}>
        <WorkspaceMenu workspace={workspace} afterChange={onChanged} />
      </span>
    </div>
  );
}

/* ── Archive helpers, shared by the card and the table row ───── */

/** The date it was put away, in the short form the rest of the estate uses.
    A workspace archived before `archivedAt` existed simply has no date — the
    badge says so rather than inventing "today", which would make an old
    archive look like something that just happened. */
export function archivedOn(w: VerificationWorkspace): string {
  if (!w.archivedAt) return "—";
  const d = new Date(w.archivedAt);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/* Restore goes through the mutation, which invalidates the whole
   ["workspaces"] prefix itself — no hand-rolled refresh needed. */
export function restore(w: VerificationWorkspace, mutate: (id: string) => void) {
  mutate(w.id);
  toast({ message: "Product report restored", detail: `${w.productName} · ${w.installationName} is back in the estate.`, tone: "ok" });
}

