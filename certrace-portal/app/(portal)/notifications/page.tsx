"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { NoticeLine } from "@/components/notifications/notice-line";
import { useNotifications } from "@/components/notifications/provider";
import { LoadingState } from "@/components/query-state";
import { Button, Card, EmptyState, FilterChip, PageHeader } from "@/components/ui";
import { useT } from "@/lib/i18n";
import type { Notice } from "@/lib/notifications/feed";

type Filter = "all" | "unread" | Notice["kind"];

/* Everything the bell would not fit, filed three ways: what needs doing, what has happened, what Certrace
   has to say. The same feed and the same read marks as the bell, so the two cannot disagree. */
export default function NotificationsPage() {
  const t = useT();
  const { ready, notices, unread, isRead, readAll, sample, useMine } = useNotifications();
  const [filter, setFilter] = React.useState<Filter>("all");

  const count = (f: Filter) => (f === "all" ? notices.length : f === "unread" ? unread : notices.filter((n) => n.kind === f).length);
  const shown = notices.filter((n) => (filter === "all" ? true : filter === "unread" ? !isRead(n) : n.kind === filter));
  const FILTERS: { id: Filter; label: string }[] = [
    { id: "all", label: t("All") },
    { id: "unread", label: t("Unread") },
    { id: "action", label: t("Needs action") },
    { id: "event", label: t("Happened") },
    { id: "message", label: t("Messages") },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={t("Account")}
        title={t("Notifications")}
        lead={t("What needs you, what has just happened, and what Certrace has to tell you — drawn from the same figures as the dashboard.")}
        actions={
          <>
            <Link href="/settings?tab=notifications" className="text-[11px] uppercase tracking-[0.1em] text-black/45 hover:text-black">
              {t("Notification settings")}
            </Link>
            <Button variant="secondary" size="sm" data-lock="allow" disabled={unread === 0} onClick={readAll}>
              <CheckCheck size={13} strokeWidth={1.5} /> {t("Mark all read")}
            </Button>
          </>
        }
      />

      {sample && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-[rgba(180,83,9,0.35)] bg-[#fffbeb] px-5 py-3.5 text-[12.5px] text-[#b45309]">
          <span>
            <strong className="font-medium">{t("Sample notifications.")}</strong> {t("These come from the made-up estate on the dashboard. Your own data is not touched.")}
          </span>
          <button type="button" data-lock="allow" onClick={useMine} className="rounded-lg border border-black/15 bg-white px-4 py-2 text-[12px] uppercase tracking-[0.08em] text-black/60 hover:border-black/30 hover:text-black">
            {t("Use my own data")}
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <FilterChip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label} · {count(f.id)}
          </FilterChip>
        ))}
      </div>

      {!ready ? (
        <LoadingState />
      ) : shown.length === 0 ? (
        <EmptyState icon={<Bell size={26} strokeWidth={1.3} />} title={filter === "unread" ? t("You're all caught up.") : t("Nothing to tell you right now.")} body={t("A notice appears when a month runs late, a supplier answers, a package is ready, or Certrace has something to say.")} />
      ) : (
        <Card className="overflow-hidden p-0">
          {shown.map((n) => (
            <NoticeLine key={n.id} n={n} roomy />
          ))}
        </Card>
      )}
    </div>
  );
}
