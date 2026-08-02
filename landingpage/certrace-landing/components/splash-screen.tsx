"use client";

import { useEffect, useState } from "react";
import { CertraceLogo } from "./logo";

const IN_END = 1100;
const CURTAIN_START = IN_END + 350;
const SPLASH_DONE = CURTAIN_START + 450 + 1400;
export const HERO_REVEAL_MS = CURTAIN_START + 1300 - 150;

type Phase = "idle" | "in" | "out" | "done";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [curtainUp, setCurtainUp] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("in"), 80);
    const t2 = setTimeout(() => setPhase("out"), IN_END);
    const t3 = setTimeout(() => setCurtainUp(true), CURTAIN_START);
    const t4 = setTimeout(() => onDone(), HERO_REVEAL_MS);
    const t5 = setTimeout(() => setPhase("done"), SPLASH_DONE);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onDone]);

  if (phase === "done") return null;

  const isIdle = phase === "idle";
  const isIn = phase === "in";
  const isOut = phase === "out";

  return (
    <div
      className="fixed inset-0 z-[100] pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="absolute inset-x-0 top-0"
        style={{
          bottom: curtainUp ? "100%" : "0%",
          transition: curtainUp
            ? "bottom 1.3s cubic-bezier(0.76, 0, 0.24, 1)"
            : "none",
          background: "#f5f4f1",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          style={{
            opacity: isIdle ? 0 : isIn ? 1 : 0,
            filter: `blur(${isIdle ? 28 : isIn ? 0 : 18}px)`,
            transform: `translateY(${isIdle ? 40 : isIn ? 0 : -18}px) scale(${isIdle ? 0.94 : isIn ? 1 : 1.02})`,
            transition: isOut
              ? "opacity 450ms cubic-bezier(0.4,0,1,1), filter 450ms cubic-bezier(0.4,0,1,1), transform 450ms cubic-bezier(0.4,0,1,1)"
              : isIn
                ? "opacity 900ms cubic-bezier(0.16,1,0.3,1), filter 900ms cubic-bezier(0.16,1,0.3,1), transform 900ms cubic-bezier(0.16,1,0.3,1)"
                : "none",
            willChange: "opacity, filter, transform",
          }}
        >
          <CertraceLogo className="w-[min(56vw,440px)] h-auto" />
        </div>
      </div>
    </div>
  );
}
