"use client";

/* ════════════════════════════════════════════════════════════
   WHAT HAS BEEN ASKED, AND OF WHOM — the Smart Links board, summarised

   THE GAP THIS FILLS. Collecting from suppliers is the hardest part of a
   CBAM year and the dashboard had nothing about it except a funnel of how
   many had ever answered. "Four suppliers responded" does not tell an
   exporter whether there is an ask sitting unsent on their own desk this
   morning — and an unsent ask is the only one of the five states that is
   THEIR job rather than somebody else's.

   SO THE STATES ARE SPLIT BY WHOSE MOVE IT IS. "To send" is yours. "Late"
   and "In progress" are theirs. "Answered" is done. The one at the top is
   the one you can act on without waiting for anybody, which is why it is
   first even when it is zero.

   The counts come from lib/smart-links.ts — the same builder the Smart Links
   page renders row by row, so the summary and the list can never disagree.

   THE FOOTNOTE IS THE QUALITY MEASURE. A chain can be fully answered and
   still be mostly EU default values, which is the expensive kind of answered:
   defaults are deliberately punitive, so a high number here is money. It sits
   under the counts rather than beside them because it describes the answers,
   not the asking.
   ════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, StatusDot, cn, type Tone } from "@/components/ui";
import { SMART_LINK_STATE_TONE } from "@/lib/smart-links";
import { useT } from "@/lib/i18n";

export type RequestBoardStats = {
  toSend: number;
  late: number;
  inProgress: number;
  answered: number;
  notDue: number;
  /** share of precursor figures still resting on an EU default value, 0–100 */
  percentOnDefault: number;
};

/* Whose move it is, top to bottom. The label says the state; the hint says
   who is holding it, because that is the thing a reader is actually sorting
   by when they scan this. */
const ROWS: { key: keyof RequestBoardStats; label: string; hint: string; tone: Tone }[] = [
  { key: "toSend", label: "To send", hint: "yours to send", tone: SMART_LINK_STATE_TONE.send_now },
  { key: "late", label: "Late", hint: "past the date you set", tone: SMART_LINK_STATE_TONE.late },
  { key: "inProgress", label: "In progress", hint: "with the supplier", tone: SMART_LINK_STATE_TONE.in_process },
  { key: "answered", label: "Answered", hint: "back and readable", tone: SMART_LINK_STATE_TONE.done },
];

export function RequestBoard({ stats }: { stats: RequestBoardStats }) {
  const t = useT();
  const total = stats.toSend + stats.late + stats.inProgress + stats.answered + stats.notDue;

  return (
    <Card className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-[family-name:var(--font-plex)] text-lg font-light tracking-tight text-[#111]">{t("What you've asked for")}</h2>
        <Link href="/smart-links" className="flex-none font-pixel text-[10px] uppercase tracking-[0.12em] text-black/40 hover:text-black">
          {t("All links")} <ArrowRight size={11} strokeWidth={1.5} className="inline align-[-1px]" />
        </Link>
      </div>

      {total === 0 ? (
        <p className="text-[13px] text-black/45">{t("No requests yet. They appear here the moment a workspace asks for its first month.")}</p>
      ) : (
        <ul className="divide-y divide-black/[0.05]">
          {ROWS.map((row) => {
            const count = stats[row.key] as number;
            return (
              <li key={row.key}>
                <Link href="/smart-links" className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-[#fafaf8]">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <StatusDot tone={row.tone} glow={count > 0 && (row.key === "late" || row.key === "toSend")} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] text-black/70">{t(row.label)}</span>
                      <span className="block truncate text-[11.5px] text-black/35">{t(row.hint)}</span>
                    </span>
                  </span>
                  <span
                    className={cn(
                      "flex-none font-[family-name:var(--font-plex)] text-[22px] font-light leading-none tabular-nums",
                      count === 0 ? "text-black/25" : row.key === "late" ? "text-[#b45309]" : "text-[#111]",
                    )}
                  >
                    {count}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-auto pt-4 text-[11.5px] leading-relaxed text-black/40">
        {t("{percent}% of precursor figures still rest on an EU default value.", { percent: Math.round(stats.percentOnDefault) })}
      </p>
    </Card>
  );
}
