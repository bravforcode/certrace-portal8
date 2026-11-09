"use client";

/* ── EN / ไทย, outside the portal chrome ────────────────────────
   Inside the product the language switcher lives in the account menu
   (components/portal-shell.tsx). Two places render before that chrome exists
   — there is no top bar and no account menu yet — and each carries this
   control instead:

     /onboarding, or a Thai exporter fills in five steps of English with no way
     out of it;

     the supplier portal (components/supplier/shell.tsx), where the reader has
     no account at all and so nothing on file to read a preference from. Their
     browser is asked instead (preferredLang in lib/i18n.ts) and this is how
     they overrule the answer.

   It is a TOGGLE, not a link. Switching language must not navigate: the
   wizard's step and every answer already typed live in React state on the
   page, and a `?lang=th` round trip would remount the page and throw both
   away. Setting the context re-renders the same tree in place, so the person
   stays on the step they were on with the fields they had filled in.

   Deliberately absent from /onboarding/done — that page reads in whatever
   language the flow was finished in. */

import * as React from "react";
import { useLanguage, useT } from "@/lib/i18n";
import { cn } from "./ui";

/* `sm` exists for the supplier portal's top bar, which already carries the
   month, the autosave state, the deadline and the status as chips at
   text-[10px]. The onboarding wizard's header is empty by comparison and the
   default size is right there; the same control at the same size in a packed
   bar reads as the loudest thing in it, and on a phone it is what pushes the
   deadline off the edge. Same control, same hit area rules — only the padding
   and type scale come down to sit level with its neighbours. */
export function LanguageToggle({ className, size = "md" }: { className?: string; size?: "md" | "sm" }) {
  const t = useT();
  const { lang, setLang, languages } = useLanguage();
  const sm = size === "sm";
  return (
    <div
      className={cn("inline-flex flex-none items-center gap-0.5 rounded-full border border-black/[0.08] bg-white", sm ? "p-[3px]" : "p-0.5", className)}
      role="group"
      aria-label={t("Language")}
    >
      {languages.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          aria-pressed={l.code === lang}
          className={cn(
            "inline-flex items-center justify-center rounded-full uppercase tracking-[0.1em] transition-colors",
            /* min-h/min-w hold the target at 24px even though the type came
               down to 10px to sit level with the chips beside it. Below that
               it fails WCAG 2.5.8, and this portal is opened on a phone more
               often than not — a supplier gets the link in a message. */
            sm ? "min-h-6 min-w-6 px-2 text-[10px]" : "px-3 py-1.5 text-[11px]",
            l.code === lang ? "bg-[#111] text-white" : "text-black/45 hover:text-black",
          )}
        >
          {l.code === "th" || l.code === "zh" || l.code === "hi" ? l.nativeLabel : l.glyph}
        </button>
      ))}
    </div>
  );
}
