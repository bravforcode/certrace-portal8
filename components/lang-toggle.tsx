"use client";

/* ── EN / ไทย, outside the portal chrome ────────────────────────
   Inside the product the language switcher lives in the account menu
   (components/portal-shell.tsx). /onboarding renders before that chrome
   exists — there is no top bar and no account menu yet — so the wizard
   carries its own switcher, or a Thai exporter fills in five steps of English
   with no way out of it.

   It is a TOGGLE, not a link. Switching language must not navigate: the
   wizard's step and every answer already typed live in React state on the
   page, and a `?lang=th` round trip would remount the page and throw both
   away. Setting the context re-renders the same tree in place, so the person
   stays on the step they were on with the fields they had filled in.

   Deliberately absent from /onboarding/done — that page reads in whatever
   language the flow was finished in. */

import * as React from "react";
import { LANGUAGES, useLanguage, useT } from "@/lib/i18n";
import { cn } from "./ui";

export function LanguageToggle({ className }: { className?: string }) {
  const t = useT();
  const { lang, setLang } = useLanguage();
  return (
    <div className={cn("inline-flex items-center gap-0.5 rounded-full border border-black/[0.08] bg-white p-0.5", className)} role="group" aria-label={t("Language")}>
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          aria-pressed={l.code === lang}
          className={cn(
            "rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.1em] transition-colors",
            l.code === lang ? "bg-[#111] text-white" : "text-black/45 hover:text-black",
          )}
        >
          {l.code === "th" ? l.nativeLabel : l.glyph}
        </button>
      ))}
    </div>
  );
}
