"use client";

/* ════════════════════════════════════════════════════════════
   WIDGET L — RECENT ACTIVITY FEED

   Bottom of the page, smallest visual weight, no charts. A subtle
   staggered fade-in per item on load and nothing else — respecting
   prefers-reduced-motion by skipping the stagger entirely.
   ════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { FileUp, Layers, Send, Calendar } from "lucide-react";
import { Card } from "@/components/ui";
import type { ActivityEvent, ActivityKind } from "@/lib/cbam/activity-feed";
import { dateLocaleNow, useT } from "@/lib/i18n";

const KIND_ICON: Record<ActivityKind, typeof FileUp> = {
  supplier_submitted: Send,
  document_uploaded: FileUp,
  mmd_finalised: Layers,
  month_submitted: Calendar,
};

function ago(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const mins = Math.round((Date.now() - then) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(dateLocaleNow(), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  const t = useT();
  if (events.length === 0) return null;

  return (
    <Card className="p-6">
      <h2 className="text-[11px] uppercase tracking-[0.1em] text-black/40">
        {t("Recent activity")}
      </h2>
      <ul className="mt-3 divide-y divide-black/[0.04]">
        {events.map((e, i) => {
          const Icon = KIND_ICON[e.kind];
          /* .ct-row (0.4s, 8px, no blur) rather than .ct-enter's heavier
             blur-in — a feed row is a list item arriving, not a page
             section. globals.css's own prefers-reduced-motion reset
             disables it for users who ask. */
          return (
            <li
              key={`${e.workspaceId}-${e.kind}-${e.at}-${i}`}
              className="ct-row"
              style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
            >
              <Link
                href={e.deepLink}
                className="flex items-center gap-3 py-2 transition-colors hover:bg-[#fafaf8]"
              >
                <Icon
                  size={13}
                  strokeWidth={1.5}
                  className="flex-none text-black/25"
                />
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-black/65">
                  {e.label}
                </span>
                <span className="flex-none text-[11px] text-black/30">
                  {e.workspaceLabel}
                </span>
                <span className="w-16 flex-none text-right text-[11px] text-black/30">
                  {ago(e.at)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
