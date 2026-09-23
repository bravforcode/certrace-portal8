"use client";

/* ════════════════════════════════════════════════════════════
   MONITOR

   The phone view. Filing documents on a phone is awkward and the review
   popup wants a real screen, but "where does the year stand, and what is
   waiting on me" is exactly the question asked from a phone between
   meetings. So this page only reads: every month of every workspace sorted
   into one of a few states, the handful of things that need a person, and
   what happened recently. Every row links to the screen where the work is
   done — which is still best opened on a computer.

   Built phone-first (one column, large tap targets) in the portal's own
   Certrace style, like every other screen. On a desktop it is simply a
   narrow column.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { ChevronRight, CircleAlert, FileText, Laptop, Send, Sparkles, Undo2, Inbox } from "lucide-react";
import { Card, Eyebrow, cn } from "@/components/ui";
import { useFormat, useLanguage, useT } from "@/lib/i18n";
import { useWorkspaces } from "@/lib/store";
import { monthsOf, scheduleFor, type VerificationWorkspace } from "@/lib/workspace";
import { monthsForWorkspace, type MonthlyEntry } from "@/lib/monthly-data";
import { dispatchesFor, dueStateFor, effectiveDueDay, type MonthDispatch } from "@/lib/month-dispatch";
import { submissionsFor, type MonthSubmission } from "@/lib/month-submission";
import { listEvidence } from "@/lib/workspace-evidence";
import { workspaceReadiness } from "@/lib/readiness";
import { daysToNextDeclarationDeadline, nextDeclarationDeadline } from "@/lib/cbam/dashboard-aggregates";

type Kind = "done" | "check" | "revision" | "overdue" | "waiting" | "draft" | "notsent" | "future";

const KIND: Record<Kind, { label: string; dot: string; chip: string }> = {
  done: { label: "Received", dot: "bg-[#10b981]", chip: "bg-[#ecfdf5] text-[#047857]" },
  check: { label: "Waiting for your review", dot: "bg-[#3C7ACB]", chip: "bg-[#eff6ff] text-[#1d4ed8]" },
  revision: { label: "Sent back for revision", dot: "bg-[#f59e0b]", chip: "bg-[#fffbeb] text-[#b45309]" },
  overdue: { label: "Overdue", dot: "bg-[#ef4444]", chip: "bg-[#fef2f2] text-[#dc2626]" },
  waiting: { label: "Asked — waiting", dot: "bg-[#a1a1aa]", chip: "bg-[#f4f4f5] text-[#52525b]" },
  draft: { label: "Being filled in", dot: "bg-[#fcd34d]", chip: "bg-[#fffbeb] text-[#b45309]" },
  notsent: { label: "Not asked yet", dot: "bg-[#e4e4e7]", chip: "bg-[#f4f4f5] text-[#71717a]" },
  future: { label: "Not due yet", dot: "border border-[#e4e4e7] bg-white", chip: "bg-[#f4f4f5] text-[#a1a1aa]" },
};

function classify(entry: MonthlyEntry | undefined, sub: MonthSubmission | undefined, dispatch: MonthDispatch | undefined, month: string, dueDay: number): Kind {
  if (sub?.state === "confirmed" || entry?.status === "reviewed") return "done";
  if (sub?.state === "changes_requested") return "revision";
  if (sub?.state === "submitted" || sub?.state === "in_review" || entry?.status === "submitted") return "check";
  const due = dueStateFor(month, { dueDay: effectiveDueDay(dispatch, dueDay), submitted: false });
  if (due === "pending") return "future";
  if (due === "overdue") return "overdue";
  if (dispatch) return "waiting";
  if (entry?.status === "draft") return "draft";
  return "notsent";
}

type MonthCell = { month: string; kind: Kind };
type WsView = { ws: VerificationWorkspace; cells: MonthCell[]; percent: number };
type Activity = { at: string; icon: "doc" | "ai" | "send" | "in" | "back"; text: string; product: string; month?: string; by?: string; href: string };

function useMonitorData(workspaces: VerificationWorkspace[] | undefined) {
  return React.useMemo(() => {
    if (!workspaces) return null;
    const views: WsView[] = [];
    const activity: Activity[] = [];
    for (const ws of workspaces) {
      const entries = new Map(monthsForWorkspace(ws).map((e) => [e.month, e]));
      const subs = submissionsFor(ws.id);
      const dispatches = dispatchesFor(ws.id);
      const dueDay = scheduleFor(ws).dueDay;
      const cells = monthsOf(ws).map((m) => ({ month: m, kind: classify(entries.get(m), subs[m], dispatches[m], m, dueDay) }));
      views.push({ ws, cells, percent: workspaceReadiness(ws).percentComplete });

      const monthHref = (m?: string) => (m ? `/workspaces/${ws.id}/monthly/${m}` : `/workspaces/${ws.id}/monthly`);
      for (const e of listEvidence(ws.id)) {
        activity.push({
          at: e.capturedAt,
          icon: e.extraction?.status === "done" ? "ai" : "doc",
          text: e.fileName,
          product: ws.productName,
          month: e.month,
          by: e.uploadedBy,
          href: monthHref(e.month),
        });
      }
      for (const s of Object.values(subs)) {
        if (s.submittedAt) activity.push({ at: s.submittedAt, icon: "in", text: s.month, product: ws.productName, href: monthHref(s.month) });
      }
      for (const d of Object.values(dispatches)) {
        activity.push({ at: d.sentAt, icon: "send", text: d.month, product: ws.productName, href: monthHref(d.month) });
      }
    }
    activity.sort((a, b) => b.at.localeCompare(a.at));
    return { views, activity: activity.slice(0, 8) };
  }, [workspaces]);
}

function useMonthShort() {
  const { lang } = useLanguage();
  return React.useCallback(
    (m: string, style: "short" | "narrow" = "short") =>
      new Date(`${m}-01T00:00:00`).toLocaleDateString(lang === "th" ? "th-TH" : "en-GB", style === "narrow" ? { month: "narrow" } : { month: "short", year: "numeric" }),
    [lang],
  );
}

function useAgo() {
  const { lang } = useLanguage();
  return React.useCallback(
    (iso: string) => {
      const rtf = new Intl.RelativeTimeFormat(lang === "th" ? "th" : "en", { numeric: "auto" });
      const mins = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
      if (Math.abs(mins) < 60) return rtf.format(mins, "minute");
      const hours = Math.round(mins / 60);
      if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
      return rtf.format(Math.round(hours / 24), "day");
    },
    [lang],
  );
}

function Tile({ value, label, tone }: { value: React.ReactNode; label: string; tone?: "ok" | "info" | "err" | "warn" }) {
  const color = tone === "ok" ? "text-[#047857]" : tone === "info" ? "text-[#1d4ed8]" : tone === "err" ? "text-[#dc2626]" : tone === "warn" ? "text-[#b45309]" : "text-[#111]";
  return (
    <Card className="p-4">
      <div className={cn("font-[family-name:var(--font-plex)] text-[28px] font-light leading-none tracking-tight", color)}>{value}</div>
      <div className="mt-2 text-[11px] uppercase leading-snug tracking-[0.1em] text-black/45">{label}</div>
    </Card>
  );
}

export default function MonitorPage() {
  const t = useT();
  const fmt = useFormat();
  const monthShort = useMonthShort();
  const ago = useAgo();
  const { data: workspaces } = useWorkspaces();
  const data = useMonitorData(workspaces);

  if (!data) return null;
  const all = data.views.flatMap((v) => v.cells.map((c) => ({ ...c, ws: v.ws })));
  const count = (k: Kind) => all.filter((c) => c.kind === k).length;
  const counted = all.filter((c) => c.kind !== "future").length;
  const days = daysToNextDeclarationDeadline();

  /* Months to review or re-check are one row each — each is a decision.
     Overdue months are one row per workspace: eight red rows for one
     supplier who has gone quiet is one thing to chase, not eight. */
  type Row = { key: string; kind: Kind; title: string; sub: string; href: string };
  const attention: Row[] = [
    ...all
      .filter((c) => c.kind === "check" || c.kind === "revision")
      .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "check" ? -1 : 1))
      .map((c) => ({
        key: `${c.ws.id}:${c.month}`,
        kind: c.kind,
        title: `${monthShort(c.month)} · ${c.ws.productName}`,
        sub: t(KIND[c.kind].label),
        href: `/workspaces/${c.ws.id}/monthly/${c.month}`,
      })),
    ...data.views
      .map((v) => ({ v, late: v.cells.filter((c) => c.kind === "overdue") }))
      .filter(({ late }) => late.length > 0)
      .map(({ v, late }) => ({
        key: `${v.ws.id}:overdue`,
        kind: "overdue" as Kind,
        title: v.ws.productName,
        sub: t("{n} months overdue · {first}–{last}", { n: late.length, first: monthShort(late[0].month), last: monthShort(late[late.length - 1].month) }),
        href: `/workspaces/${v.ws.id}/monthly`,
      })),
  ];

  const ACT_ICON = {
    doc: <FileText size={15} className="text-black/45" />,
    ai: <Sparkles size={15} className="text-[#3C7ACB]" />,
    send: <Send size={15} className="text-black/45" />,
    in: <Inbox size={15} className="text-[#047857]" />,
    back: <Undo2 size={15} className="text-[#b45309]" />,
  } as const;
  const ACT_TEXT: Record<Activity["icon"], string> = {
    doc: "Document added",
    ai: "Document read by AI",
    send: "Request sent",
    in: "Data received",
    back: "Sent back",
  };

  return (
    <div className="mx-auto max-w-xl space-y-7 pb-10">
      <div>
        <Eyebrow>
          {t("Monitor")} · {fmt.date(new Date(), { weekday: "long", day: "numeric", month: "long" })}
        </Eyebrow>
        <h1 className="mt-2 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">{t("Where the year stands")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-black/50">{t("Where every month stands, and what is waiting on you.")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Tile value={`${count("done") + count("check")}/${counted}`} label={t("Months received so far")} tone="ok" />
        <Tile value={count("check")} label={t("Waiting for your review")} tone={count("check") > 0 ? "info" : undefined} />
        <Tile value={count("overdue")} label={t("Months overdue")} tone={count("overdue") > 0 ? "err" : undefined} />
        <Tile value={days} label={t("Days to declaration · {date}", { date: fmt.date(nextDeclarationDeadline(), { day: "numeric", month: "short" }) })} tone={days <= 30 ? "warn" : undefined} />
      </div>

      <section>
        <Eyebrow className="mb-2.5 block">{t("Needs attention")}</Eyebrow>
        {attention.length === 0 ? (
          <div className="rounded-2xl border border-black/[0.07] bg-white px-4 py-4 text-[14px] text-black/55">{t("Nothing is waiting on you right now.")}</div>
        ) : (
          <ul className="divide-y divide-black/[0.06] overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
            {attention.slice(0, 6).map((r) => (
              <li key={r.key}>
                <Link href={r.href} className="flex items-center gap-3 px-4 py-3.5 active:bg-black/[0.03]">
                  <span className={cn("h-2.5 w-2.5 flex-none rounded-full", KIND[r.kind].dot)} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] text-[#111]">{r.title}</span>
                    <span className="block text-[13px] text-black/50">{r.sub}</span>
                  </span>
                  <ChevronRight size={16} className="flex-none text-black/25" />
                </Link>
              </li>
            ))}
            {attention.length > 6 && <li className="px-4 py-3 text-[13px] text-black/45">{t("+{n} more", { n: attention.length - 6 })}</li>}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <Eyebrow className="block">{t("Workspaces")}</Eyebrow>
        {data.views.map(({ ws, cells, percent }) => {
          const done = cells.filter((c) => c.kind === "done" || c.kind === "check").length;
          return (
            <Link key={ws.id} href={`/workspaces/${ws.id}/monthly`} className="block rounded-2xl border border-black/[0.07] bg-white p-4 active:bg-black/[0.02]">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-[family-name:var(--font-plex)] text-[16px] text-[#111]">{ws.productName}</div>
                  <div className="truncate text-[13px] text-black/50">
                    {ws.installationName} · {ws.year}
                  </div>
                </div>
                <ChevronRight size={16} className="mt-1 flex-none text-black/25" />
              </div>
              <div className="mt-3 grid grid-cols-12 gap-1">
                {cells.map((c) => (
                  <div key={c.month} className="flex flex-col items-center gap-1" title={`${monthShort(c.month)} · ${t(KIND[c.kind].label)}`}>
                    <span className={cn("h-6 w-full rounded-md", KIND[c.kind].dot)} />
                    <span className="text-[10px] text-black/40">{monthShort(c.month, "narrow")}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-[13px] text-black/55">
                <span>{t("{done} of 12 months in", { done })}</span>
                <span>{t("Ready {n}%", { n: percent })}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
                <div className="h-full rounded-full bg-[#111]" style={{ width: `${percent}%` }} />
              </div>
            </Link>
          );
        })}
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 px-1">
          {(["done", "check", "revision", "overdue", "waiting", "notsent", "future"] as Kind[]).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5 text-[12px] text-black/50">
              <span className={cn("h-2.5 w-2.5 rounded-full", KIND[k].dot)} /> {t(KIND[k].label)}
            </span>
          ))}
        </div>
      </section>

      <section>
        <Eyebrow className="mb-2.5 block">{t("Recent activity")}</Eyebrow>
        {data.activity.length === 0 ? (
          <div className="rounded-2xl border border-black/[0.07] bg-white px-4 py-4 text-[14px] text-black/55">{t("Nothing has happened yet.")}</div>
        ) : (
          <ul className="divide-y divide-black/[0.06] overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
            {data.activity.map((a, i) => (
              <li key={`${a.at}:${i}`}>
                <Link href={a.href} className="flex items-center gap-3 px-4 py-3 active:bg-black/[0.03]">
                  <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-[#f5f4f0]">{ACT_ICON[a.icon]}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] text-black/50">{t(ACT_TEXT[a.icon])}</span>
                    <span className="block truncate text-[14.5px] text-[#111]">{/^\d{4}-\d{2}$/.test(a.text) ? monthShort(a.text) : a.text}</span>
                    <span className="block truncate text-[12px] text-black/40">{[a.product, a.month && monthShort(a.month), a.by].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span className="flex-none text-[12px] text-black/40">{ago(a.at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex items-start gap-3 rounded-2xl border border-black/[0.07] bg-[#faf9f7] px-4 py-3.5 text-[13px] leading-relaxed text-black/55">
        <Laptop size={16} className="mt-0.5 flex-none text-black/40" />
        <span>{t("Adding and checking documents is easier on a computer. On a phone, use this page to keep track.")}</span>
      </div>
      {counted === 0 && (
        <p className="flex items-center gap-2 text-[12px] text-black/40">
          <CircleAlert size={13} /> {t("No months are due yet this year.")}
        </p>
      )}
    </div>
  );
}
