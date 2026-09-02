"use client";

/* Widget E's savings figure is the one number on the dashboard that earns a
   moment of emphasis — everywhere else, motion is restrained by design (see
   the dashboard layout spec). Counts up from 0 over ~1s on first render,
   then holds still; respects prefers-reduced-motion by skipping straight to
   the final value, per that same spec. */

import * as React from "react";

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function CountUp({
  value,
  durationMs = 1000,
  format,
}: {
  value: number;
  durationMs?: number;
  format: (n: number) => string;
}) {
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = React.useState(reduced ? value : 0);
  const startRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    startRef.current = null;
    let raf: number;
    const step = (t: number) => {
      if (startRef.current == null) startRef.current = t;
      const elapsed = t - startRef.current;
      const progress = Math.min(1, elapsed / durationMs);
      // ease-out cubic — quick to start, settles rather than snapping
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    /* THE ANIMATION MUST NEVER BE THE ONLY PATH TO THE REAL NUMBER.
       requestAnimationFrame does not fire while a tab is hidden or is not
       compositing — open the dashboard in a background tab, or on a
       machine that throttles offscreen frames, and the rAF loop above
       never runs a single step. Without this fallback the figure stays
       frozen at its starting 0 for as long as the page is open, which on
       the single most important number on the dashboard reads as "you
       have saved nothing" rather than as an animation that has not
       started. The timeout guarantees the true value lands regardless. */
    const settle = setTimeout(() => setDisplay(value), durationMs + 80);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs, reduced]);

  return <>{format(display)}</>;
}
