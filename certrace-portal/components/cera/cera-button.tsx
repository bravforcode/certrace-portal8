"use client";

import { cn } from "@/components/ui";
import { CeraMark } from "@/components/cera/cera-mark";
import { useCera } from "@/components/cera/cera-provider";
import { useT } from "@/lib/i18n";

/* The Cera button in the top bar — the same 44 px square as the notifications
   bell beside it, so the two read as one pair of controls. It is a real
   <button> (the bell is a trigger inside a dropdown), pressed-state aware: while
   the panel is showing it holds the "on" look, the way an open menu does.

   A SURFACE, NOT AN OUTLINE. A plain hairline square read as one more icon
   button; this one is lifted a little — a soft top-lit gradient, a light inner
   edge and a shadow under it — so the assistant looks like the thing it is.
   Pressed, it sinks: the gradient flips and the shadow goes inward.

   NO DOT. It used to carry one when a CBAM rule change had gone unread; that
   flag is gone from the button, and the digest stays one question away ("What's
   new in CBAM?"). */
export function CeraButton() {
  const t = useT();
  const { open, minimized, toggle } = useCera();
  const showing = open && !minimized;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("Cera Intelligence")}
      aria-pressed={showing}
      aria-haspopup="dialog"
      title={t("Cera Intelligence")}
      className={cn(
        "group relative grid h-11 w-11 place-items-center rounded-[14px] border transition-all duration-200",
        showing
          ? "border-black/20 bg-gradient-to-b from-[#f1efe9] to-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)]"
          : "border-black/[0.09] bg-gradient-to-b from-white to-[#f6f4ef] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_1px_2px_rgba(0,0,0,0.06),0_6px_14px_-8px_rgba(0,0,0,0.25)] hover:-translate-y-px hover:border-black/20 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_2px_4px_rgba(0,0,0,0.06),0_10px_20px_-10px_rgba(0,0,0,0.3)]",
      )}
    >
      <CeraMark className="h-[22px] w-auto transition-transform duration-200 group-hover:scale-105" />
    </button>
  );
}
