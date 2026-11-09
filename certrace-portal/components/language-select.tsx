"use client";

/* ════════════════════════════════════════════════════════════
   THE LANGUAGE MENU ON A LINK

   A supplier or a precursor maker opens a link from a message: no account, no portal chrome, and a page
   that has to be readable to them at once. So the page carries its own language menu at the top, naming
   each language IN ITS OWN SCRIPT — "English", "ไทย", "中文" — because a reader who cannot read the page
   cannot read a menu that says "Language" either.

   It is a dropdown rather than a row of buttons because three languages and a status bar do not share a
   phone-width header; and it changes the language IN PLACE, so the step and every answer already typed stay
   where they are (a reload would drop them). What it offers comes from the context — Chinese on a link, never
   in the portal — so the same control cannot offer more than the page can speak.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { Dropdown } from "@/components/controls";
import { cn } from "@/components/ui";
import { useLanguage, useT } from "@/lib/i18n";

export function LanguageSelect({ className }: { className?: string }) {
  const t = useT();
  const { lang, setLang, languages } = useLanguage();
  const current = languages.find((l) => l.code === lang) ?? languages[0];
  return (
    <Dropdown
      align="right"
      width="w-40"
      className={className}
      trigger={(open) => (
        <span
          role="presentation"
          aria-label={t("Language")}
          title={t("Language")}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border bg-white px-3 text-[12.5px] transition-colors",
            open ? "border-black/30 text-black" : "border-black/10 text-black/65 hover:border-black/25 hover:text-black",
          )}
        >
          <Globe size={14} strokeWidth={1.5} className="flex-none text-black/45" />
          {current.nativeLabel}
          <ChevronDown size={13} strokeWidth={1.5} className={cn("flex-none text-black/35 transition-transform", open && "rotate-180")} />
        </span>
      )}
    >
      {(close) =>
        languages.map((l) => (
          <button
            key={l.code}
            type="button"
            lang={l.code}
            onClick={() => {
              setLang(l.code);
              close();
            }}
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-colors hover:bg-[#fafaf8]",
              l.code === lang ? "text-black" : "text-black/65",
            )}
          >
            {l.nativeLabel}
            {l.code === lang && <Check size={13} strokeWidth={2} className="flex-none" />}
          </button>
        ))
      }
    </Dropdown>
  );
}
