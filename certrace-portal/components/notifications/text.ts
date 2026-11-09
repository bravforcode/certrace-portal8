"use client";

/* Saying a notice in the language then on screen.

   The feed holds sentences as dictionary keys and their parts, never as finished text, so a
   notice built before the reader switched language is still drawn in the one they switched to.
   A month is named, a date is written out and a tab is translated here, when it is drawn. */

import * as React from "react";
import { concernText } from "@/components/supply-chain/overview";
import { useFormat, useLanguage, useT } from "@/lib/i18n";
import { localisedUpdate } from "@/lib/cera/updates-text";
import { UPDATES } from "@/lib/cera/updates";
import type { Notice, Say } from "@/lib/notifications/feed";
import { monthNameLong } from "@/lib/workspace";

export function useSay(): (s: Say) => string {
  const t = useT();
  const { date } = useFormat();
  return React.useCallback(
    (s: Say) => {
      if (s.key === "") return s.text ?? "";
      const vars: Record<string, string | number> = { ...(s.vars ?? {}) };
      if (s.month && typeof vars.month === "string") vars.month = monthNameLong(vars.month);
      for (const k of s.tv ?? []) if (k in vars) vars[k] = t(String(vars[k]));
      for (const k of s.dv ?? []) if (k in vars) vars[k] = date(`${vars[k]}T12:00:00`, { day: "numeric", month: "long", year: "numeric" });
      return t(s.key, vars);
    },
    [t, date],
  );
}

/** What a notice says, drawn: its title, its second line, and — for a message — its paragraphs. */
export function useNoticeText() {
  const t = useT();
  const say = useSay();
  const { lang } = useLanguage();
  return React.useMemo(() => {
    const entry = (n: Notice) => {
      if (!n.updateId) return null;
      const u = UPDATES.find((x) => x.id === n.updateId);
      return u ? localisedUpdate(u, lang) : null;
    };
    return {
      title: (n: Notice): string => entry(n)?.title ?? say(n.title),
      meta: (n: Notice): string => {
        if (n.concern) return concernText(n.concern, t);
        if (n.meta) return say(n.meta);
        // a message has no "where" — it says who it is from instead
        if (n.message) return n.group === "security" ? t("System message") : t("Message from Certrace");
        return "";
      },
      body: (n: Notice): string[] => {
        const u = entry(n);
        if (u) return [u.body];
        return (n.message?.body ?? []).map(say);
      },
      source: (n: Notice): string | undefined => {
        const u = entry(n);
        return u?.source ?? n.message?.source;
      },
    };
  }, [say, t, lang]);
}

/** "5m ago", "3d ago" — or, for a date that has not come yet, the date. */
export function useAgo(): (iso: string, now?: number) => string {
  const t = useT();
  const { date } = useFormat();
  return React.useCallback(
    (iso: string, now: number = Date.now()) => {
      const at = Date.parse(iso);
      if (!Number.isFinite(at)) return "";
      const diff = now - at;
      if (diff < 0) return date(iso, { day: "numeric", month: "short", year: "numeric" });
      const mins = Math.floor(diff / 60_000);
      if (mins < 1) return t("just now");
      if (mins < 60) return t("{n}m ago", { n: mins });
      const hours = Math.floor(mins / 60);
      if (hours < 24) return t("{n}h ago", { n: hours });
      const days = Math.floor(hours / 24);
      if (days < 30) return t("{n}d ago", { n: days });
      return date(iso, { day: "numeric", month: "short", year: "numeric" });
    },
    [t, date],
  );
}
