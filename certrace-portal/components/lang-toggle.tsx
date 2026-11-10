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
import { LanguageSelect } from "./language-select";
import { cn } from "./ui";

/* `sm` exists for the supplier portal's top bar, which already carries the
   month, the autosave state, the deadline and the status as chips at
   text-[10px]. The onboarding wizard's header is empty by comparison and the
   default size is right there; the same control at the same size in a packed
   bar reads as the loudest thing in it, and on a phone it is what pushes the
   deadline off the edge. Same control, same hit area rules — only the padding
   and type scale come down to sit level with its neighbours. */
export function LanguageToggle({
  className,
  size = "md",
}: {
  className?: string;
  size?: "md" | "sm";
}) {
  /* Twelve languages no longer fit a row of pills in a packed top bar, so the toggle is now the same dropdown the links use —
     still in place (no navigation), still sized down for the bar. */
  return (
    <LanguageSelect className={cn("flex-none", className)} size={size} />
  );
}
