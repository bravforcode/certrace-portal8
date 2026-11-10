"use client";

/* ════════════════════════════════════════════════════════════
   YEAR BAR — the horizontal year picker on Workspace and Convert

   Every year from 2020 to five years ahead (lib/year-range.ts). It opens
   scrolled so the CURRENT year is the first one in view — the years ahead
   read left to right — and the earlier years are there by scrolling (or the
   arrow) to the left. The kit's filter-pill look, one line at every width.

   `mark` lets a page say what a year holds: a dot for a year with data, a
   pulsing dot while it is being set up, a lock for a year not open yet.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { cn } from "./ui";
import { useT } from "@/lib/i18n";
import { currentYear, yearRange } from "@/lib/year-range";

export type YearMark = "data" | "pending" | "locked" | undefined;

export function YearBar({
  value,
  onChange,
  mark,
  label = "Reporting year",
}: {
  value: number;
  onChange: (year: number) => void;
  mark?: (year: number) => YearMark;
  label?: string;
}) {
  const t = useT();
  const years = React.useMemo(() => yearRange(), []);
  const now = currentYear();
  const track = React.useRef<HTMLDivElement>(null);
  const [edges, setEdges] = React.useState({ left: false, right: false });
  /* Room after the last year, so the bar can always open with the current
     year at its left edge — even on a screen wide enough to show every year.
     The earlier years are then off to the left, a scroll away. */
  const [tail, setTail] = React.useState(0);

  const measure = React.useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdges({
      left: el.scrollLeft > 2,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2,
    });
  }, []);

  const fit = React.useCallback(() => {
    const el = track.current;
    const cur = el?.querySelector<HTMLElement>(`[data-year="${now}"]`);
    const last = el?.querySelector<HTMLElement>(`[data-year="${years[years.length - 1]}"]`);
    if (!el || !cur || !last) return 0;
    const span = last.offsetLeft + last.offsetWidth - cur.offsetLeft;
    return Math.max(0, el.clientWidth - span - 4);
  }, [now, years]);

  // Open with the current year first in view; earlier years sit to the left.
  React.useLayoutEffect(() => {
    setTail(fit());
  }, [fit]);
  const toCurrent = React.useCallback(() => {
    const el = track.current;
    const btn = el?.querySelector<HTMLElement>(`[data-year="${now}"]`);
    if (el && btn) el.scrollLeft = btn.offsetLeft - 4;
    measure();
  }, [now, measure]);
  // Whenever the tail changes size (first paint, a resize, the web font
  // arriving and widening the pills), put the current year back at the start.
  React.useLayoutEffect(toCurrent, [tail, toCurrent]);
  React.useEffect(() => {
    let live = true;
    void document.fonts?.ready.then(() => {
      if (!live) return;
      setTail(fit());
      toCurrent();
    });
    return () => {
      live = false;
    };
  }, [fit, toCurrent]);

  React.useEffect(() => {
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setTail(fit());
      measure();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, fit]);

  const step = (dir: -1 | 1) =>
    track.current?.scrollBy({ left: dir * 240, behavior: "smooth" });

  return (
    <div className="relative flex min-w-0 items-center gap-1">
      <button
        type="button"
        aria-label={t("Earlier years")}
        onClick={() => step(-1)}
        className={cn(
          "grid h-8 w-8 flex-none place-items-center rounded-full text-black/45 transition-colors hover:bg-black/[0.05] hover:text-black",
          !edges.left && "pointer-events-none opacity-0",
        )}
      >
        <ChevronLeft size={15} strokeWidth={1.5} />
      </button>
      <div
        ref={track}
        role="group"
        aria-label={t(label)}
        onScroll={measure}
        className="relative flex min-w-0 flex-1 items-center gap-2 overflow-x-auto whitespace-nowrap py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {years.map((y) => {
          const m = mark?.(y);
          const on = value === y;
          return (
            <button
              key={y}
              type="button"
              data-year={y}
              aria-pressed={on}
              data-lock="allow"
              onClick={() => onChange(y)}
              title={m === "locked" ? t("{year} is locked — no data yet", { year: y }) : undefined}
              className={cn(
                "inline-flex flex-none items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-mono text-[12px] tabular-nums transition-colors",
                on
                  ? "border-transparent bg-[#111] text-white"
                  : "border-black/10 text-black/55 hover:border-black/25 hover:text-black",
                y === now && !on && "border-black/25 text-black/80",
              )}
            >
              {m === "locked" && <Lock size={11} strokeWidth={1.75} />}
              {y}
              {m === "data" && (
                <span className={cn("h-1.5 w-1.5 rounded-full", on ? "bg-white" : "bg-[#111]")} />
              )}
              {m === "pending" && (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
              )}
            </button>
          );
        })}
        {tail > 0 && <span aria-hidden="true" className="flex-none" style={{ width: tail }} />}
      </div>
      <button
        type="button"
        aria-label={t("Later years")}
        onClick={() => step(1)}
        className={cn(
          "grid h-8 w-8 flex-none place-items-center rounded-full text-black/45 transition-colors hover:bg-black/[0.05] hover:text-black",
          !edges.right && "pointer-events-none opacity-0",
        )}
      >
        <ChevronRight size={15} strokeWidth={1.5} />
      </button>
    </div>
  );
}
