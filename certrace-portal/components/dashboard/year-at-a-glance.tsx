"use client";

/* ════════════════════════════════════════════════════════════
   THE BAND ABOVE EVERYTHING — four figures, and every one of them a question
   the exporter actually asks

   WHY IT EXISTS. The dashboard had eleven widgets and no summit. Whatever
   the reader wanted to know, they scrolled for it, and the first thing they
   met was an Action queue that on a healthy account says "nothing needs
   attention" — a correct sentence that tells them nothing about the year.

   THE FOUR ARE THE FOUR QUESTIONS, in the order somebody opening the portal
   at 9am asks them:

     1. How long have I got?            days to the declaration deadline
     2. What is on fire?                items already overdue
     3. Who am I waiting on?            asks out with suppliers, and late ones
     4. How much of the year is in?     collection progress across the estate

   IT USED TO BE SIX. "Buyer-ready" and "Avoided this year" sat in this row
   too, and six tiles across a laptop left each one about 130px: figures in
   26px over two lines of 11px capitals, which is a row a reader with
   reading glasses skims past rather than reads. Four is what fits at a size
   that can be read from a normal sitting distance, and the two that left are
   not gone — each has a whole widget of its own under "more detail" on the
   dashboard, which says more than a tile did. The four that stayed are the
   ones that change what somebody does today.

   EVERY TILE IS A LINK. A number on a dashboard that cannot be opened is a
   number the reader has to go and find somewhere else, which is the same as
   not having shown it.

   TONE IS EARNED, NEVER DECORATIVE. Red means a date has already passed.
   Amber means it is close enough to plan around. Everything else is black,
   so that when something does turn colour it is worth looking at.
   ════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { Card, cn } from "@/components/ui";
import { useFormat, useT, type TFunction } from "@/lib/i18n";

export type GlanceStats = {
  daysToDeadline: number;
  deadlineDate: Date;
  /** action items already past their due date */
  overdue: number;
  /** asks that have gone out and not come back */
  awaiting: number;
  /** of those, the ones past the date they were promised for */
  late: number;
  /** mean readiness across the active estate, 0–100 */
  collectedPercent: number;
  /** report packages (site × year) that can be downloaded, and how many there are */
  packagesReady: number;
  packagesTotal: number;
  /** months submitted, of the months the company's own reports carry */
  monthsIn: number;
  monthsOf: number;
};

type Tone = "err" | "warn" | "ok" | "muted";

const VALUE_TONE: Record<Tone, string> = {
  err: "text-[#dc2626]",
  warn: "text-[#b45309]",
  ok: "text-[#047857]",
  muted: "text-[#111]",
};

function Tile({
  value,
  label,
  sub,
  href,
  tone = "muted",
}: {
  value: React.ReactNode;
  label: string;
  sub: string;
  href: string;
  tone?: Tone;
}) {
  return (
    <Link href={href} className="block min-w-0">
      <Card
        className={cn(
          "h-full p-5 transition-colors hover:border-black/15 hover:bg-[#fafaf8] sm:p-6",
          tone === "err" && "border-[#fecaca]",
        )}
      >
        <div
          className={cn(
            "truncate font-[family-name:var(--font-plex)] text-4xl font-light leading-none tracking-tight sm:text-5xl",
            VALUE_TONE[tone],
          )}
        >
          {value}
        </div>
        {/* NEITHER LINE IS TRUNCATED, and the label is in sentence case. A
            clipped label leaves the reader with half a sentence and no way to
            finish it, and Thai sets wider than English so it loses more;
            capitals with wide tracking are the slowest way to set a phrase
            somebody has to read rather than recognise. The tiles are `h-full`
            in a grid, so the row takes the height of the tallest and they all
            stay level. */}
        <div className="mt-3 text-[14px] leading-snug text-black/75">
          {label}
        </div>
        <div className="mt-1 text-[12px] leading-snug text-black/45">{sub}</div>
      </Card>
    </Link>
  );
}

export function YearAtAGlance({ stats }: { stats: GlanceStats }) {
  const t = useT();
  const fmt = useFormat();

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <Tile
        value={stats.daysToDeadline}
        label={t("Days to declaration")}
        sub={fmt.date(stats.deadlineDate)}
        href="/reports"
        tone={stats.daysToDeadline <= 30 ? "warn" : "muted"}
      />
      <Tile
        value={`${stats.packagesReady}/${stats.packagesTotal}`}
        label={t("Packages ready")}
        sub={t("to send to the verifier")}
        href="/reports"
        tone={
          stats.packagesTotal > 0 && stats.packagesReady === stats.packagesTotal
            ? "ok"
            : "muted"
        }
      />
      <Tile
        value={`${stats.collectedPercent}%`}
        label={t("Reports ready")}
        sub={t("average of all reports")}
        href="/workspaces"
      />
      <Tile
        value={`${stats.monthsIn}/${stats.monthsOf}`}
        label={t("Months in")}
        sub={t("submitted so far")}
        href="/workspaces"
      />
      <Tile
        value={stats.awaiting}
        label={t("Waiting on suppliers")}
        sub={
          stats.late > 0
            ? t("{count} past its date", { count: stats.late })
            : t("none past its date")
        }
        href="/smart-links"
        tone={stats.late > 0 ? "warn" : "muted"}
      />
      <Tile
        value={stats.overdue}
        label={t("Overdue now")}
        sub={
          stats.overdue > 0 ? t("in the action queue") : t("nothing is late")
        }
        href="#needs-you"
        tone={stats.overdue > 0 ? "err" : "muted"}
      />
    </div>
  );
}

/** The band, before the client has measured anything. Same height as the real
    one so the page does not jump when the four figures land. */
export function YearAtAGlanceSkeleton({ t }: { t: TFunction }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 lg:grid-cols-3"
      aria-hidden
      aria-label={t("Loading")}
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Card key={i} className="h-[136px] p-5 sm:p-6">
          <span />
        </Card>
      ))}
    </div>
  );
}
