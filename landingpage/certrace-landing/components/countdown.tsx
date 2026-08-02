"use client";

import { useEffect, useRef, useState } from "react";

type Remaining = { days: number; hours: number; minutes: number; seconds: number };

function getRemaining(target: Date): Remaining {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

const pad = (n: number) => String(Math.round(n)).padStart(2, "0");

function easeOutExpo(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/* Decorative, not live: on scroll-into-view, rolls down once from the real
   time remaining until `target` to 00:00:00:00 and rests there — the point
   being made is "that's data you can no longer go back and collect," not a
   ticking clock. Renders 00:00:00:00 until mounted so server/client markup
   match, and until the animation starts. */
export function CountdownTimer({
  target,
  units,
}: {
  target: string;
  /* Four labels, in order: days, hours, minutes, seconds. Passed in rather
     than hard-coded so the Thai page doesn't sit under English units. */
  units: string[];
}) {
  const [display, setDisplay] = useState<Remaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const start = getRemaining(new Date(target));

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const duration = 2600;
        const t0 = performance.now();
        let raf: number;
        const tick = (now: number) => {
          const t = Math.min(1, (now - t0) / duration);
          const remaining = 1 - easeOutExpo(t);
          setDisplay({
            days: start.days * remaining,
            hours: start.hours * remaining,
            minutes: start.minutes * remaining,
            seconds: start.seconds * remaining,
          });
          if (t < 1) {
            raf = requestAnimationFrame(tick);
          } else {
            setDisplay({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          }
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  const segments: { label: string; value: number }[] = [
    { label: units[0], value: display.days },
    { label: units[1], value: display.hours },
    { label: units[2], value: display.minutes },
    { label: units[3], value: display.seconds },
  ];

  return (
    <div ref={ref} className="flex items-start gap-2.5 sm:gap-4">
      {segments.map((seg, i) => (
        <div key={seg.label} className="flex items-start gap-2.5 sm:gap-4">
          <div className="flex flex-col items-center">
            <span
              className="text-4xl sm:text-5xl md:text-6xl font-light tabular-nums tracking-tight text-[#111]"
              style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif" }}
            >
              {pad(seg.value)}
            </span>
            <span className="mt-2 text-[10px] tracking-widest text-black/35">
              {seg.label}
            </span>
          </div>
          {i < segments.length - 1 && (
            <span className="text-4xl sm:text-5xl md:text-6xl font-light text-black/15">
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
