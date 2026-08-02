"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";

type MarqueeRowConfig = {
  items: string[];
  /* Loop direction, and speed in px/second — expressing pace as speed rather
     than a fixed duration keeps both rows travelling at the same visual rate
     no matter how much copy each one carries. */
  direction?: "left" | "right";
  speed?: number;
  dotClass: string;
  textClass: string;
  bordered?: boolean;
};

/* Three copies: one scrolls out of frame while the next two cover the viewport,
   so the wrap is never visible even on ultrawide screens. */
const COPIES = [0, 1, 2];

function MarqueeRow({
  items,
  direction = "left",
  speed = 44,
  dotClass,
  textClass,
  bordered = true,
}: MarqueeRowConfig) {
  const copyRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const copy = copyRef.current;
    if (!copy) return;

    /* The loop travels exactly one copy's width, sub-pixels included. A
       percentage keyframe (-33.333%) leaves a remainder that shows up as a
       tick on every wrap — that's the flinch. The 0.5px threshold ignores
       measurement noise so the animation isn't re-declared for nothing. */
    const measure = () => {
      const next = copy.getBoundingClientRect().width;
      setDistance((prev) => (Math.abs(prev - next) < 0.5 ? prev : next));
    };

    measure();
    /* Webfonts resolve after first paint and change the text width. */
    document.fonts?.ready.then(measure).catch(() => {});

    const observer = new ResizeObserver(measure);
    observer.observe(copy);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`marquee-track flex w-max ${
        bordered ? "border-b border-black/[0.06]" : ""
      }`}
      style={
        {
          "--marquee-distance": `${distance}px`,
          /* Held off until measured, so the animation starts once and then runs
             uninterrupted for the life of the page. */
          animationName: distance > 0 ? "marqueeLoop" : "none",
          animationDuration: distance > 0 ? `${distance / speed}s` : undefined,
          animationDirection: direction === "right" ? "reverse" : "normal",
        } as React.CSSProperties
      }
    >
      {COPIES.map((copy) => (
        <div
          key={copy}
          ref={copy === 0 ? copyRef : undefined}
          className="flex shrink-0"
        >
          {items.map((item) => (
            <div
              key={`${copy}-${item}`}
              className="flex items-center gap-6 px-10 py-5 border-r border-black/[0.06] shrink-0"
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
              <span
                className={`text-sm whitespace-nowrap tracking-wide ${textClass}`}
              >
                {item}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* Two bands on the page: the credentials one under the hero, and the closing
   one above the footer. Only the wording differs, so the variant picks the
   copy and the motion stays identical. */
export function MarqueeBand({
  variant = "credentials",
}: {
  variant?: "credentials" | "cta";
}) {
  const { lang, c } = useLang();

  const rows: MarqueeRowConfig[] =
    variant === "cta"
      ? [
          {
            items: c.marquee.ctaRowOne,
            direction: "left",
            speed: 46,
            dotClass: "bg-emerald-600/30",
            textClass: "text-black/45",
          },
          {
            items: c.marquee.ctaRowTwo,
            direction: "right",
            speed: 34,
            dotClass: "bg-black/12",
            textClass: "text-black/30",
            bordered: false,
          },
        ]
      : [
          {
            items: c.marquee.rowOne,
            direction: "left",
            speed: 46,
            dotClass: "bg-emerald-600/30",
            textClass: "text-black/45",
          },
          {
            items: c.marquee.rowTwo,
            direction: "right",
            speed: 34,
            dotClass: "bg-black/12",
            textClass: "text-black/30",
            bordered: false,
          },
        ];

  return (
    <section
      className="py-0 border-t border-black/[0.06] overflow-hidden select-none"
      aria-hidden="true"
    >
      {rows.map((row, i) => (
        /* Re-keyed on language: the loop distance is measured once per mount,
           and swapping the copy changes that width — a remount is what forces
           the re-measure. */
        <MarqueeRow key={`${lang}-${i}`} {...row} />
      ))}
    </section>
  );
}
