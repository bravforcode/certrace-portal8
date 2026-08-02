"use client";

import { useLang } from "@/lib/i18n";

/* Where each milestone sits relative to today. Positional rather than stored
   with the copy: the four milestones are the same events in both languages,
   and only the second one is the live "you are here" marker. */
const STATES = ["past", "current", "future", "future"] as const;

/* Horizontal stepper rail — DS tokens throughout: border-card (~7% ink) for
   the connecting line, ink-70/40 text scale, 16px-radius dot container,
   no card fills (a rail, not a grid of boxes). Collapses to a left-aligned
   vertical rail below sm, where a horizontal line has no room to read. */
export function CbamTimeline() {
  const { c } = useLang();

  return (
    <div className="relative">
      <div className="hidden sm:block absolute left-0 right-0 top-[5px] h-px bg-black/[0.08]" />
      <div className="sm:hidden absolute left-[5px] top-1.5 bottom-1.5 w-px bg-black/[0.08]" />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 sm:gap-6">
        {c.whyNow.milestones.map((m, i) => {
          const state = STATES[i] ?? "future";
          return (
            <div key={m.date} className="relative pl-7 sm:pl-0">
              <span
                className={`absolute left-0 sm:static sm:block top-1 sm:top-0 w-[11px] h-[11px] rounded-full border-2 ${
                  state === "past"
                    ? "border-black/20 bg-[#F5F4F0]"
                    : state === "current"
                      ? "border-emerald-500 bg-emerald-500"
                      : "border-black/15 bg-[#F5F4F0]"
                }`}
                style={
                  state === "current"
                    ? {
                        boxShadow: "0 0 0 4px rgba(74,222,128,0.15)",
                        animation: "statusPulse 2s ease-in-out infinite",
                      }
                    : undefined
                }
              />
              <div className="sm:mt-4">
                <span className="font-pixel text-[10px] tracking-widest text-black/40">
                  {m.date}
                </span>
                <h4 className="mt-1.5 text-sm text-black/80">{m.label}</h4>
                <p className="mt-1.5 text-xs text-black/40 leading-relaxed">
                  {m.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
