"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { Dropdown } from "@/components/controls";
import { NoticeLine } from "@/components/notifications/notice-line";
import { useNotifications } from "@/components/notifications/provider";
import { useT } from "@/lib/i18n";

/** How many the bell lists; the rest are one click away on the page. */
const SHOWN = 8;

/** Reads the feed again the moment the menu opens, so what it shows is what is true now and not what was true a minute ago. */
function OnOpen({ run }: { run: () => void }) {
  React.useEffect(run, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export function NotificationsBell() {
  const t = useT();
  const { notices, unread, readAll, refresh, sample, useMine } = useNotifications();
  const shown = notices.slice(0, SHOWN);

  return (
    <Dropdown
      align="right"
      width="w-[min(24rem,calc(100vw-1.5rem))]"
      trigger={() => (
        <span
          aria-label={unread > 0 ? t("Notifications — {n} unread", { n: unread }) : t("Notifications")}
          className="relative grid h-11 w-11 place-items-center rounded-xl border border-black/10 text-black/55 hover:border-black/25 hover:text-black"
        >
          <Bell size={19} strokeWidth={1.5} />
          {unread > 0 && <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#f87171]" />}
        </span>
      )}
    >
      {(close) => (
        <>
          <OnOpen run={refresh} />
          <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-3 py-2.5">
            <span className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/35">{t("Notifications")}</span>
            {unread > 0 ? (
              <button onClick={readAll} data-lock="allow" className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.08em] text-black/40 hover:text-black">
                <CheckCheck size={12} strokeWidth={1.5} /> {t("Mark all read")}
              </button>
            ) : (
              <span className="font-mono text-[10px] text-black/30">{t("You're all caught up.")}</span>
            )}
          </div>
          {sample && (
            <div className="flex items-center justify-between gap-3 border-b border-dashed border-[rgba(180,83,9,0.3)] bg-[#fffbeb] px-3 py-2 text-[11.5px] leading-snug text-[#b45309]">
              <span>{t("Sample notifications — your own data is not touched.")}</span>
              <button type="button" data-lock="allow" onClick={useMine} className="flex-none rounded-md border border-black/15 bg-white px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-black/60 hover:text-black">
                {t("Use my own data")}
              </button>
            </div>
          )}
          <div className="max-h-[min(55vh,26rem)] overflow-y-auto overscroll-contain">
            {shown.length === 0 ? (
              <p className="px-4 py-10 text-center text-[13px] text-black/40">{t("Nothing to tell you right now.")}</p>
            ) : (
              shown.map((n) => <NoticeLine key={n.id} n={n} onDone={close} />)
            )}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-black/[0.06] px-3 py-2.5 text-[11px] uppercase tracking-[0.08em]">
            <Link href="/notifications" onClick={close} className="text-black/55 hover:text-black">
              {notices.length > SHOWN ? t("See all {n}", { n: notices.length }) : t("See all notifications")}
            </Link>
            <Link href="/settings?tab=notifications" onClick={close} className="text-black/40 hover:text-black">
              {t("Notification settings")}
            </Link>
          </div>
        </>
      )}
    </Dropdown>
  );
}
