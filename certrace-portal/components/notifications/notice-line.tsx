"use client";

import * as React from "react";
import Link from "next/link";
import {
  BadgeCheck,
  ChevronRight,
  CreditCard,
  FileCheck2,
  FileText,
  Megaphone,
  MessageSquareText,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { cn, StatusDot } from "@/components/ui";
import { useNotifications } from "@/components/notifications/provider";
import { useAgo, useNoticeText } from "@/components/notifications/text";
import { useT } from "@/lib/i18n";
import type { Notice } from "@/lib/notifications/feed";
import type { PrefKey } from "@/lib/notification-prefs";

const GROUP_ICON: Record<PrefKey, React.ElementType> = {
  security: ShieldCheck,
  declarations: FileCheck2,
  suppliers: Users,
  ai_review: Sparkles,
  documents: FileText,
  regulation: Scale,
  billing: CreditCard,
  product: Megaphone,
};

/** One notice. About the reader's own work it is a link to the place that fixes it; from Certrace or the system it is a
    button that opens the message. The two look alike on purpose — the little mark at the end is what tells them apart. */
export function NoticeLine({
  n,
  roomy,
  onDone,
}: {
  n: Notice;
  roomy?: boolean /** called after a click, so a menu can close behind it */;
  onDone?: () => void;
}) {
  const t = useT();
  const { isRead, read, openMessage } = useNotifications();
  const text = useNoticeText();
  const ago = useAgo();
  const unread = !isRead(n);
  const Icon = GROUP_ICON[n.group] ?? BadgeCheck;
  const title = text.title(n);
  const meta = text.meta(n);

  const body = (
    <>
      <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg border border-black/10 text-black/55">
        <Icon size={15} strokeWidth={1.5} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-2 text-[13px] leading-snug">
          {unread ? (
            <span role="img" aria-label={t("Unread")} className="mt-[7px] flex flex-none">
              <StatusDot tone={n.tone} />
            </span>
          ) : (
            <span aria-hidden className="w-1.5 flex-none" />
          )}
          <span
            className={cn(
              "min-w-0 [overflow-wrap:anywhere]",
              unread ? "text-black/85" : "text-black/55",
              roomy ? "text-[14px]" : "line-clamp-2",
            )}
          >
            {title}
          </span>
        </span>
        {meta && (
          <span
            className={cn(
              "mt-0.5 block pl-[14px] text-[11.5px] text-black/40",
              roomy ? "[overflow-wrap:anywhere]" : "truncate",
            )}
          >
            {meta}
          </span>
        )}
      </span>
      <span className="mt-0.5 flex flex-none flex-col items-end gap-1.5">
        {n.kind !== "action" && !n.undated && (
          <span className="font-mono text-[10px] text-black/30">
            {ago(n.at)}
          </span>
        )}
        <span className="flex items-center gap-1.5 text-black/25">
          {n.message ? (
            <MessageSquareText size={13} strokeWidth={1.5} aria-hidden />
          ) : (
            <ChevronRight size={13} strokeWidth={1.5} aria-hidden />
          )}
        </span>
      </span>
    </>
  );

  const row = cn(
    "flex w-full items-start gap-3 border-b border-black/[0.04] px-3 py-3 text-left last:border-0 hover:bg-[#fafaf8]",
    roomy && "px-5 py-4",
    !unread && "opacity-75",
  );

  if (n.message) {
    return (
      <button
        type="button"
        data-lock="allow"
        onClick={() => {
          onDone?.();
          openMessage(n);
        }}
        className={row}
      >
        {body}
      </button>
    );
  }
  return (
    <Link
      href={n.href ?? "/dashboard"}
      onClick={() => {
        read(n);
        onDone?.();
      }}
      className={row}
    >
      {body}
    </Link>
  );
}
