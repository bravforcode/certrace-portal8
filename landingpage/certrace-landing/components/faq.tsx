"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";

/* Answers are deliberately short — one direct answer, then the detail that
   actually decides the question. Anything longer belongs in a guide, not an
   accordion. Copy lives in lib/content.ts, in both languages. */

/* One row owns its own panel measurement, so the reveal is exactly as tall as
   the answer at the current width — a fixed max-height clipped the longer
   answers on narrow screens. */
function FaqRow({
  item,
  isOpen,
  onToggle,
}: {
  item: { q: string; a: string };
  isOpen: boolean;
  onToggle: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const measure = () => setHeight(panel.scrollHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="border-b border-black/[0.06]">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-6 py-6 text-left group"
      >
        <span
          className="text-base md:text-lg font-light transition-colors duration-200"
          style={{ color: isOpen ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.55)" }}
        >
          {item.q}
        </span>
        <span className="relative w-4 h-4 shrink-0" aria-hidden="true">
          <span className="absolute top-1/2 left-0 w-4 h-px bg-black/40 -translate-y-1/2" />
          <span
            className="absolute top-0 left-1/2 w-px h-4 bg-black/40 -translate-x-1/2 transition-transform duration-300"
            style={{
              transform: isOpen
                ? "translateX(-50%) scaleY(0)"
                : "translateX(-50%) scaleY(1)",
            }}
          />
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isOpen ? `${height}px` : "0px",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div ref={panelRef}>
          <p className="pb-6 text-sm text-black/45 leading-relaxed max-w-2xl">
            {item.a}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FaqList() {
  const { lang, c } = useLang();
  const [open, setOpen] = useState<number | null>(0);

  return (
    /* Keyed on language: each row measures its own answer height, and a
       language swap changes that height without remounting — re-keying forces
       a fresh measurement instead of a panel clipped to the old copy. */
    <div key={lang} className="border-t border-black/[0.06]">
      {c.faq.items.map((item, i) => (
        <FaqRow
          key={item.q}
          item={item}
          isOpen={open === i}
          onToggle={() => setOpen(open === i ? null : i)}
        />
      ))}
    </div>
  );
}
