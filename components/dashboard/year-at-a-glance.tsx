"use client";

/* ════════════════════════════════════════════════════════════
   THE BAND ABOVE EVERYTHING — six figures, and every one of them a question
   the exporter actually asks

   WHY IT EXISTS. The dashboard had eleven widgets and no summit. Whatever
   the reader wanted to know, they scrolled for it, and the first thing they
   met was an Action queue that on a healthy account says "nothing needs
   attention" — a correct sentence that tells them nothing about the year.

   THE SIX ARE THE SIX QUESTIONS, in the order somebody opening the portal at
   9am asks them:

     1. How long have I got?            days to the declaration deadline
     2. What is on fire?                items already overdue
     3. Who am I waiting on?            asks out with suppliers, and late ones
     4. What could I send today?        products a buyer would accept
     5. How much of the year is in?     collection progress across the estate
     6. What is this worth?             what verified data saves against the
                                        EU default

   Two of them are money and time and belong to the board; four are work and
   belong to whoever is doing it. They sit in one row because an exporter is
   usually both of those people.

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
  buyerReady: number;
  buyerTotal: number;
  /** mean readiness across the active estate, 0–100 */
  collectedPercent: number;
  /** null when the arithmetic cannot run yet — see lib/cbam/cost-exposure.ts */
  savingsThb: number | null;
};

type Tone = "err" | "warn" | "ok" | "muted";

const VALUE_TONE: Record<Tone, string> = {
  err: "text-[#dc2626]",
  warn: "text-[#b45309]",
  ok: "text-[#047857]",
  muted: "text-[#111]",
};

function Tile({ value, label, sub, href, tone = "muted" }: { value: React.ReactNode; label: string; sub: string; href: string; tone?: Tone }) {
  return (
    <Link href={href} className="block min-w-0">
      <Card className={cn("h-full p-4 transition-colors hover:border-black/15 hover:bg-[#fafaf8] sm:p-5", tone === "err" && "border-[#fecaca]")}>
        {/* `truncate` plus a min-w-0 parent: a THB figure in the millions is
            wider than a sixth of the row, and a grid item refuses to shrink
            below its content unless told to. */}
        <div className={cn("truncate font-[family-name:var(--font-plex)] text-[26px] font-light leading-none tracking-tight sm:text-[30px]", VALUE_TONE[tone])}>
          {value}
        </div>
        {/* NEITHER LINE IS TRUNCATED. Six tiles across a 1280px screen leaves
            about 130px each, which is narrower than most of these labels —
            clipping them leaves the reader with "PRODUCTS A BUYER WOULD…" and
            no way to finish the sentence, and Thai sets wider than English so
            it loses more. The tiles are `h-full` in a grid, so the row simply
            takes the height of the tallest and they all stay level. */}
        <div className="mt-2 text-[11px] uppercase leading-snug tracking-[0.1em] text-black/45">{label}</div>
        <div className="mt-1 text-[11px] leading-snug text-black/35">{sub}</div>
      </Card>
    </Link>
  );
}

export function YearAtAGlance({ stats }: { stats: GlanceStats }) {
  const t = useT();
  const fmt = useFormat();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <Tile
        value={stats.daysToDeadline}
        label={t("Days to declaration")}
        sub={fmt.date(stats.deadlineDate)}
        href="/reports"
        tone={stats.daysToDeadline <= 30 ? "warn" : "muted"}
      />
      <Tile
        value={stats.overdue}
        label={t("Overdue now")}
        sub={stats.overdue > 0 ? t("in the action queue") : t("nothing is late")}
        href="/workspaces"
        tone={stats.overdue > 0 ? "err" : "muted"}
      />
      <Tile
        value={stats.awaiting}
        label={t("Waiting on suppliers")}
        sub={stats.late > 0 ? t("{count} past its date", { count: stats.late }) : t("none past its date")}
        href="/smart-links"
        tone={stats.late > 0 ? "warn" : "muted"}
      />
      <Tile
        value={`${stats.buyerReady}/${stats.buyerTotal}`}
        label={t("Buyer-ready")}
        sub={t("verification complete")}
        href="/workspaces"
        tone={stats.buyerTotal > 0 && stats.buyerReady === stats.buyerTotal ? "ok" : "muted"}
      />
      <Tile
        value={`${stats.collectedPercent}%`}
        label={t("Year collected")}
        sub={t("every product")}
        href="/workspaces"
      />
      <Tile
        value={stats.savingsThb == null ? "—" : `฿${fmt.number(Math.round(stats.savingsThb))}`}
        label={t("Avoided this year")}
        sub={stats.savingsThb == null ? t("needs monthly data") : t("against the EU default")}
        href="/carbon-cost"
      />
    </div>
  );
}

/** The band, before the client has measured anything. Same height as the real
    one so the page does not jump when the six figures land. */
export function YearAtAGlanceSkeleton({ t }: { t: TFunction }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6" aria-hidden aria-label={t("Loading")}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Card key={i} className="h-[108px] p-4 sm:p-5">
          <span />
        </Card>
      ))}
    </div>
  );
}
