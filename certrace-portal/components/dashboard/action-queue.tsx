"use client";

/* ════════════════════════════════════════════════════════════
   WIDGET A — ACTION QUEUE

   The single list of everything overdue or due soon, across every
   workspace. This is why the exporter opens the dashboard daily, so it
   renders first, full width, and never as a blank space — an empty queue
   is still a fact worth confirming ("nothing needs attention"), not the
   absence of a widget.

   FIVE ROWS, THEN A BUTTON. The list is sorted most-overdue first, so the
   first five are the five that matter this morning; the twelve it used to
   show was a list long enough that the reader counted it instead of reading
   it. The rest are one press away, in place — and unlike the old "+ N more"
   line, which named items it gave no way to see, every one can be reached.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { Calendar, CheckCircle2, Layers, Paperclip, ShieldAlert, Users } from "lucide-react";
import { Card, cn } from "@/components/ui";
import type { ActionItem, ActionItemType } from "@/lib/cbam/action-queue";
import { useT, type TFunction } from "@/lib/i18n";

const TYPE_ICON: Record<ActionItemType, typeof Calendar> = {
  monthly_data: Calendar,
  precursor_invite: Users,
  mmd_draft: Layers,
  document_unbound: Paperclip,
  precursor_deadline: ShieldAlert,
};

const TYPE_LABEL: Record<ActionItemType, string> = {
  monthly_data: "Monthly data",
  precursor_invite: "Precursor",
  mmd_draft: "Monitoring plan",
  document_unbound: "Document",
  precursor_deadline: "Precursor deadline",
};

function dueLabel(daysUntilDue: number, t: TFunction): { text: string; tone: "err" | "warn" } {
  const n = Math.abs(daysUntilDue);
  if (daysUntilDue < 0) return { text: n === 1 ? t("1 day overdue") : t("{n} days overdue", { n }), tone: "err" };
  if (daysUntilDue === 0) return { text: t("Needs attention"), tone: "warn" };
  return { text: daysUntilDue === 1 ? t("Due in 1 day") : t("Due in {n} days", { n: daysUntilDue }), tone: "warn" };
}

const SHOWN_FIRST = 5;

export function ActionQueue({ items }: { items: ActionItem[] }) {
  const t = useT();
  const [showAll, setShowAll] = React.useState(false);
  const shown = showAll ? items : items.slice(0, SHOWN_FIRST);
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-plex)] text-lg font-light tracking-tight text-[#111]">{t("Action queue")}</h2>
        {items.length > 0 && (
          <span className="rounded-full bg-[#111] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-white">
            {items.length === 1 ? t("1 item") : t("{n} items", { n: items.length })}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-[rgba(5,150,105,0.18)] bg-[#ecfdf5] px-4 py-4">
          <CheckCircle2 size={18} strokeWidth={1.5} className="flex-none text-[#047857]" />
          <p className="text-[13px] text-[#047857]">{t("Nothing needs attention right now.")}</p>
        </div>
      ) : (
        <ul className="divide-y divide-black/[0.05]">
          {shown.map((item, i) => {
            const Icon = TYPE_ICON[item.type];
            const due = dueLabel(item.daysUntilDue, t);
            return (
              <li key={`${item.workspaceId}-${item.type}-${i}`}>
                <Link href={item.deepLink} className="flex items-center gap-3 py-3.5 transition-colors hover:bg-[#fafaf8]">
                  <span
                    className={cn(
                      "grid h-9 w-9 flex-none place-items-center rounded-lg border",
                      due.tone === "err" ? "border-[rgba(220,38,38,0.18)] bg-[#fef2f2] text-[#dc2626]" : "border-[rgba(180,83,9,0.18)] bg-[#fffbeb] text-[#b45309]",
                    )}
                  >
                    <Icon size={16} strokeWidth={1.5} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-black/80">{item.say ? t(item.say.key, item.say.vars) : t(item.label)}</span>
                    <span className="block truncate text-[11px] text-black/40">
                      {t(TYPE_LABEL[item.type])} · {t(item.workspaceLabel)}
                    </span>
                  </span>
                  <span className={cn("flex-none whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.06em]", due.tone === "err" ? "text-[#dc2626]" : "text-[#b45309]")}>
                    {due.text}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {items.length > SHOWN_FIRST && (
        <button
          type="button"
          data-lock="allow"
          aria-expanded={showAll}
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 w-full rounded-xl border border-black/10 px-4 py-3 text-[13px] text-black/70 transition-colors hover:border-black/25 hover:text-black"
        >
          {showAll ? t("Show fewer") : t("Show all {count}", { count: items.length })}
        </button>
      )}
    </Card>
  );
}
