"use client";

/* ════════════════════════════════════════════════════════════
   ONE FEED FOR THE WHOLE SHELL

   The bell in the top bar and the /notifications page read the same list, count the same unread
   and mark the same read — so the number on the bell is the number on the page. It is built from
   the same dashboard read the dashboard draws (and the same sample switch), so a month the
   dashboard calls late is a month the bell calls late.

   It is rebuilt when anything it depends on changes — a read mark, a switch in Settings, a note of
   a sign-in, the rules digest being opened — and otherwise once a minute, so a month that goes
   overdue at midnight is there by the time anybody looks.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useCera } from "@/components/cera/cera-provider";
import { MessageDialog } from "@/components/notifications/message-dialog";
import { readDashboard, sampleDashboard } from "@/lib/cbam/dashboard-data";
import { UPDATES, UPDATES_EVENT, markUpdatesSeen, seenUpdateIds } from "@/lib/cera/updates";
import { PREFS_EVENT, readNotificationPrefs } from "@/lib/notification-prefs";
import { ANNOUNCEMENTS } from "@/lib/notifications/announcements";
import { EVENTS_EVENT, readEvents } from "@/lib/notifications/events";
import { buildFeed, type Notice } from "@/lib/notifications/feed";
import { useReadIds } from "@/lib/notifications/state";
import { cnCodeCap, currentPlan, siteCap, trialState, yearCap } from "@/lib/plan";
import { useSampleMode } from "@/lib/sample-mode";

export type NotificationsValue = {
  /** the first read has landed — before it, an empty list means "not yet", not "nothing" */
  ready: boolean;
  notices: Notice[];
  unread: number;
  isRead: (n: Notice) => boolean;
  /** mark one read */
  read: (n: Notice) => void;
  readAll: () => void;
  /** a message from Certrace or the system: open it in the popup (and mark it read) */
  openMessage: (n: Notice) => void;
  /** the feed is the made-up estate's */
  sample: boolean;
  useMine: () => void;
  /** read again now — for when the bell is opened */
  refresh: () => void;
};

const Ctx = React.createContext<NotificationsValue | null>(null);

export function useNotifications(): NotificationsValue {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("useNotifications needs NotificationsProvider above it");
  return v;
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const cera = useCera();
  const { readIds, markRead } = useReadIds();
  const [mounted, setMounted] = React.useState(false);
  const [tick, setTick] = React.useState(0);
  const [open, setOpen] = React.useState<Notice | null>(null);

  React.useEffect(() => {
    setMounted(true);
    const bump = () => setTick((x) => x + 1);
    const events = [PREFS_EVENT, EVENTS_EVENT, UPDATES_EVENT, "storage", "focus"] as const;
    for (const e of events) window.addEventListener(e, bump);
    const id = window.setInterval(bump, 60_000);
    return () => {
      for (const e of events) window.removeEventListener(e, bump);
      window.clearInterval(id);
    };
  }, []);

  /* The same key as the dashboard page, so on that page the two share one read. */
  const { data, refetch } = useQuery({ queryKey: ["dashboard", "v2"], queryFn: () => readDashboard(), staleTime: 15_000, refetchInterval: 30_000, enabled: mounted });
  const hasFigures = data ? data.hasFigures || data.company.reports > 0 : null;
  const sample = useSampleMode(hasFigures);
  const dash = React.useMemo(() => (sample.on ? sampleDashboard() : (data ?? null)), [sample.on, data]);

  const notices = React.useMemo(() => {
    if (!mounted || !dash) return [];
    return buildFeed({
      now: new Date(),
      dash,
      sample: sample.on,
      trial: trialState(),
      caps: [cnCodeCap(), siteCap(), yearCap()],
      planName: currentPlan().name,
      events: readEvents(),
      updates: UPDATES,
      announcements: ANNOUNCEMENTS,
      prefs: readNotificationPrefs(),
    });
    // `tick` is the "something it depends on changed" signal: the inputs above are read from storage, not from React state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, dash, sample.on, tick]);

  const seen = React.useMemo(() => seenUpdateIds(), [tick, notices]); // eslint-disable-line react-hooks/exhaustive-deps
  const isRead = React.useCallback((n: Notice) => readIds.includes(n.id) || (n.updateId != null && seen.includes(n.updateId)), [readIds, seen]);

  const read = React.useCallback(
    (n: Notice) => {
      markRead([n.id]);
      if (n.updateId) markUpdatesSeen([n.updateId]);
    },
    [markRead],
  );
  const readAll = React.useCallback(() => {
    markRead(notices.map((n) => n.id));
    const news = notices.flatMap((n) => (n.updateId ? [n.updateId] : []));
    if (news.length) markUpdatesSeen(news);
  }, [markRead, notices]);
  const openMessage = React.useCallback(
    (n: Notice) => {
      read(n);
      setOpen(n);
    },
    [read],
  );

  const value = React.useMemo<NotificationsValue>(
    () => ({
      ready: mounted && dash != null && sample.ready,
      notices,
      unread: notices.filter((n) => !isRead(n)).length,
      isRead,
      read,
      readAll,
      openMessage,
      sample: sample.on,
      useMine: () => sample.set(false),
      refresh: () => {
        setTick((x) => x + 1);
        void refetch();
      },
    }),
    [mounted, dash, notices, isRead, read, readAll, openMessage, sample, refetch],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <MessageDialog
        notice={open}
        onClose={() => setOpen(null)}
        onAsk={(q) => {
          setOpen(null);
          cera.show();
          cera.send(q);
        }}
      />
    </Ctx.Provider>
  );
}
