"use client";

import { useEffect, useRef, useState } from "react";

function easeOutExpo(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/* Animates a number on scroll-into-view — counts from `from` to `to` and
   stops. Used both for count-up-from-zero stats and for pain-number ->
   Certrace-number transitions.

   `active` gates the start: the hero stats are already in the viewport while
   the splash screen covers them, so without this the roll would finish
   unseen and the user would only ever see the resting value. */
export function AnimatedNumber({
  from = 0,
  to,
  duration = 1400,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
  style,
  active = true,
}: {
  from?: number;
  to: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  style?: React.CSSProperties;
  active?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(from);

  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;

    let raf: number | undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = easeOutExpo(t);
          setValue(from + (to - from) * eased);
          if (t < 1) {
            raf = requestAnimationFrame(tick);
          } else {
            setValue(to);
          }
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (raf !== undefined) cancelAnimationFrame(raf);
    };
  }, [from, to, duration, active]);

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
