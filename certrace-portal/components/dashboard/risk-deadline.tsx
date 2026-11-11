"use client";

/* ════════════════════════════════════════════════════════════
   WIDGET B — RISK & DEADLINE OVERVIEW

   The executive/BD-facing summary: are we in trouble, and when's the next
   hard deadline. A row of large stat figures, each clickable, none of them
   a table.
   ════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { Card, cn } from "@/components/ui";
import type { RiskDeadlineStats } from "@/lib/cbam/dashboard-aggregates";
import { useT } from "@/lib/i18n";

function StatTile({
  value,
  label,
  sub,
  href,
  tone,
}: {
  value: React.ReactNode;
  label: string;
  sub: string;
  href: string;
  tone?: "err" | "warn" | "muted";
}) {
  return (
    <Link href={href} className="block">
      <Card
        className={cn(
          "p-5 transition-colors hover:border-black/15 hover:bg-[#fafaf8]",
          tone === "err" && "border-[#fecaca]",
        )}
      >
        <div
          className={cn(
            "font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight",
            tone === "err"
              ? "text-[#dc2626]"
              : tone === "warn"
                ? "text-[#b45309]"
                : "text-[#111]",
          )}
        >
          {value}
        </div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.1em] text-black/45">
          {label}
        </div>
        <div className="mt-0.5 text-[11px] text-black/35">{sub}</div>
      </Card>
    </Link>
  );
}

export function RiskDeadlineOverview({ stats }: { stats: RiskDeadlineStats }) {
  const t = useT();
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile
        value={stats.workspacesBlocked}
        label={t("Product reports blocked")}
        sub={t("arithmetic that cannot run")}
        href="/convert"
        tone={stats.workspacesBlocked > 0 ? "err" : "muted"}
      />
      <StatTile
        value={stats.daysToDeclarationDeadline}
        label={t("Days to declaration deadline")}
        sub={t("30 September")}
        href="/reports"
        tone={stats.daysToDeclarationDeadline <= 30 ? "warn" : "muted"}
      />
      <StatTile
        value={`${Math.round(stats.percentPrecursorDefault)}%`}
        label={t("Precursor SEE on default value")}
        sub={t("across every chain")}
        href="/workspaces"
        tone={stats.percentPrecursorDefault >= 50 ? "warn" : "muted"}
      />
      <StatTile
        value={stats.workspacesWithOverdueCount}
        label={t("Product reports with an overdue item")}
        sub={t("see the action queue above")}
        href="/workspaces"
        tone={stats.workspacesWithOverdueCount > 0 ? "warn" : "muted"}
      />
    </div>
  );
}
