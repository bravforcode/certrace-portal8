"use client";

/* The small pieces the month's form is built from, shared by the general form
   (monthly-step.tsx) and the steel and aluminium blocks (sector-blocks.tsx) —
   kept apart so neither has to import the other. */

import * as React from "react";
import { Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { ANCHOR_PREFIX, FOCUS_EVENT, takeFocus } from "@/lib/cera/focus";

/** Anchor id for a quality-check finding to scroll to. Kept in one place so
    the check and the form cannot name a field differently. */
export const anchor = (field: string) => `${ANCHOR_PREFIX}${field}`;

/** Bring the month's form to a part of itself when something asked for it — Cera, after it filled the month, leads here. Scrolls to
    the part and lights it for a moment, and gives the browser's hash back so a reload does not do it again. */
export function useMonthFocus() {
  React.useEffect(() => {
    let timer: number | undefined;
    let cancelled = false;
    const run = () => {
      const fromHash = window.location.hash.startsWith(`#${ANCHOR_PREFIX}`) ? window.location.hash.slice(1) : null;
      const wanted = takeFocus() ?? fromHash;
      if (!wanted) return;
      const ids = wanted.split(",");
      let tries = 0;
      const attempt = () => {
        if (cancelled) return;
        const el = ids.map((i) => document.getElementById(i)).find(Boolean);
        if (!el) {
          // The part may not have drawn yet — a route's blocks come in after the form's first paint.
          if (tries++ < 80) timer = window.setTimeout(attempt, 100); // up to 8 s: a first visit loads the month before it draws the form
          return;
        }
        /* A section can be taller than the screen — the fuels, with a row each — and centring it shows the middle of it, which is rarely
           where the figures are. A tall one is taken to the first value Cera wrote in it (they wear the green box), and failing that to its top. */
        const tall = el.getBoundingClientRect().height > window.innerHeight * 0.6;
        const written = tall ? el.querySelector<HTMLElement>('[class*="43A97F"]') : null;
        (written ?? el).scrollIntoView({ behavior: "smooth", block: written ? "center" : tall ? "start" : "center" });
        el.classList.remove("ct-focus");
        void el.offsetWidth; // restart the animation if it is asked for twice
        el.classList.add("ct-focus");
        window.setTimeout(() => el.classList.remove("ct-focus"), 2800);
        if (fromHash) window.history.replaceState(null, "", window.location.pathname + window.location.search);
      };
      attempt();
    };
    run();
    window.addEventListener(FOCUS_EVENT, run);
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      window.removeEventListener(FOCUS_EVENT, run);
    };
  }, []);
}

export function RowCard({ title, onRemove, removeLabel, confirmRemove, children }: { title: string; onRemove?: () => void; removeLabel: string; /** two presses: the first arms the button and says so, the second removes */ confirmRemove?: boolean; children: React.ReactNode }) {
  const t = useT();
  const [armed, setArmed] = React.useState(false);
  // An armed button stands down on its own — a press that comes seconds later is not a confirmation.
  React.useEffect(() => {
    if (!armed) return;
    const id = window.setTimeout(() => setArmed(false), 4000);
    return () => window.clearTimeout(id);
  }, [armed]);
  return (
    <div className="rounded-xl border border-black/[0.07] bg-[#faf9f7] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/40">{title}</span>
        {onRemove &&
          (armed ? (
            <span className="flex items-center gap-1">
              <button type="button" onClick={() => setArmed(false)} className="rounded-lg px-2 py-1 text-[12px] text-black/45 hover:text-black">
                {t("Keep")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setArmed(false);
                  onRemove();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#fef2f2] px-2.5 py-1 text-[12px] text-[#dc2626] hover:bg-[#fee2e2]"
                aria-label={removeLabel}
              >
                <Trash2 size={13} strokeWidth={1.5} /> {t("Delete")}
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => (confirmRemove ? setArmed(true) : onRemove())}
              className="grid h-7 w-7 place-items-center rounded-lg text-black/30 transition-colors hover:bg-[#fef2f2] hover:text-[#dc2626]"
              aria-label={removeLabel}
              title={removeLabel}
            >
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
          ))}
      </div>
      {children}
    </div>
  );
}

export function EmptyNote({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <p id={id} className="scroll-mt-32 rounded-xl border border-dashed border-black/10 px-4 py-5 text-center text-[13px] text-black/40">
      {children}
    </p>
  );
}
