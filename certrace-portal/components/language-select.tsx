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
import { Check, ChevronDown } from "lucide-react";
import { Dropdown } from "@/components/controls";
import { Flag } from "@/components/flag";
import { cn } from "@/components/ui";
import { useLanguage, useT } from "@/lib/i18n";

export function LanguageSelect({
  className,
  size = "md",
}: {
  className?: string;
  size?: "md" | "sm";
}) {
  const t = useT();
  const { choice, setLang, menu } = useLanguage();
  const current = menu.find((l) => l.code === choice) ?? menu[0];
  return (
    <Dropdown
      align="right"
      width="w-56"
      className={className}
      trigger={(open) => (
        <span
          role="presentation"
          aria-label={t("Language")}
          title={t("Language")}
          className={cn(
            "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border bg-white transition-colors",
            size === "sm"
              ? "h-7 px-2.5 text-[11px]"
              : "h-9 px-3 text-[12.5px]",
            open
              ? "border-black/30 text-black"
              : "border-black/10 text-black/65 hover:border-black/25 hover:text-black",
          )}
        >
          <Flag code={current.code} />
          {current.nativeLabel}
          <ChevronDown
            size={13}
            strokeWidth={1.5}
            className={cn(
              "flex-none text-black/35 transition-transform",
              open && "rotate-180",
            )}
          />
        </span>
      )}
    >
      {(close) => (
        /* Twelve rows. No scroll cap of its own: the Dropdown panel is already capped to the screen
           and scrolls, and a second scroller inside it drew two scrollbars side by side. */
        <div>
          {menu.map((l) => (
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
                l.code === choice ? "bg-black/[0.04] text-black" : "text-black/65",
              )}
            >
              <span className="flex items-center gap-2.5">
                <Flag code={l.code} />
                {l.nativeLabel}
              </span>
              {l.code === choice && (
                <Check size={13} strokeWidth={2} className="flex-none" />
              )}
            </button>
          ))}
        </div>
      )}
    </Dropdown>
  );
}
