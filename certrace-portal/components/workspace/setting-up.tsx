"use client";

/* ════════════════════════════════════════════════════════════
   SETTING UP — the wait after the upload is confirmed

   A software workspace in the middle (window chrome, a sidebar, figures, a
   table filling row by row, a small chart) and seven mini workers around it.
   Each one walks from a pile of files at the edge, carries a card of data
   to the screen, drops it in and walks back for the next. Under it, the
   file being read right now — the real uploaded names, in turn.

   Ink on bone, hairlines, no colour but the one amber "in progress" dot —
   the design system's palette. Motion stops for readers who ask for less.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useT } from "@/lib/i18n";

type Worker = { x0: string; y0: string; x1: string; y1: string; dir: 1 | -1; delay: string; file: string };

/* Start (at a pile of files) and end (at the screen's edge), as % of the stage. */
const WORKERS: Worker[] = [
  { x0: "7%", y0: "18%", x1: "29%", y1: "30%", dir: 1, delay: "0s", file: "PDF" },
  { x0: "4%", y0: "50%", x1: "28%", y1: "50%", dir: 1, delay: "-1.4s", file: "XLSX" },
  { x0: "8%", y0: "80%", x1: "29%", y1: "68%", dir: 1, delay: "-2.8s", file: "JPG" },
  { x0: "91%", y0: "18%", x1: "71%", y1: "30%", dir: -1, delay: "-0.7s", file: "CSV" },
  { x0: "94%", y0: "50%", x1: "72%", y1: "50%", dir: -1, delay: "-2.1s", file: "PDF" },
  { x0: "90%", y0: "80%", x1: "71%", y1: "68%", dir: -1, delay: "-3.5s", file: "DOCX" },
  { x0: "50%", y0: "95%", x1: "50%", y1: "84%", dir: 1, delay: "-1.8s", file: "XLSX" },
];

export function SettingUpStage({ files }: { files: string[] }) {
  const t = useT();
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    if (files.length < 2) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % files.length), 1600);
    return () => window.clearInterval(id);
  }, [files.length]);

  return (
    <div>
      <style>{WORKER_CSS}</style>
      <div
        aria-hidden="true"
        className="ws-stage relative h-[340px] overflow-hidden rounded-2xl border border-black/[0.07] bg-[#fafaf8] md:h-[380px]"
      >
        {/* piles of files the workers fetch from */}
        {WORKERS.map((w, n) => (
          <div
            key={`pile${n}`}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: w.x0, top: w.y0 }}
          >
            <div className="relative h-9 w-7">
              <span className="absolute left-1.5 top-0 h-8 w-6 rounded-[3px] border border-black/15 bg-white" />
              <span className="absolute left-0.5 top-0.5 h-8 w-6 rounded-[3px] border border-black/20 bg-white" />
              <span className="absolute left-0 top-1 flex h-8 w-6 items-end justify-center rounded-[3px] border border-black/25 bg-white pb-1 font-mono text-[6px] font-semibold text-black/55">
                {w.file}
              </span>
            </div>
          </div>
        ))}

        {/* the software in the middle */}
        <MiniPlatform className="absolute left-1/2 top-1/2 h-[58%] w-[44%] max-w-[360px] -translate-x-1/2 -translate-y-1/2" />

        {/* the mini workers */}
        {WORKERS.map((w, n) => (
          <div
            key={`w${n}`}
            className="ws-walker absolute"
            style={
              {
                "--x0": w.x0,
                "--y0": w.y0,
                "--x1": w.x1,
                "--y1": w.y1,
                "--dir": w.dir,
                animationDelay: w.delay,
              } as React.CSSProperties
            }
          >
            <div className="ws-face -translate-x-1/2 -translate-y-full" style={{ animationDelay: w.delay }}>
              <span className="ws-card absolute -top-1.5 left-1/2 h-3.5 w-5 -translate-x-1/2 rounded-[2px] border border-black/50 bg-white" style={{ animationDelay: w.delay }}>
                <span className="mx-auto mt-[3px] block h-px w-2.5 bg-black/40" />
                <span className="mx-auto mt-[2px] block h-px w-2 bg-black/40" />
              </span>
              <WorkerFigure className="ws-bob mt-2.5 h-8 w-[22px]" />
            </div>
          </div>
        ))}
      </div>

      {files.length > 0 && (
        <p className="mt-3 flex items-center justify-center gap-2 text-[12.5px] text-black/45">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
          <span className="truncate">{t("Reading {file}…", { file: files[i % files.length]! })}</span>
        </p>
      )}
    </div>
  );
}

/** The software the workers fill: window chrome, a sidebar, figures, a table filling row by row, a small chart. */
export function MiniPlatform({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={"overflow-hidden rounded-xl border border-black/[0.12] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] " + (className ?? "")}
      style={style}
    >
          <div className="flex h-6 items-center gap-1 border-b border-black/[0.07] bg-[#f7f6f2] px-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-black/20" />
            <span className="h-1.5 w-1.5 rounded-full bg-black/20" />
            <span className="h-1.5 w-1.5 rounded-full bg-black/20" />
            <span className="ml-2 h-1.5 w-16 rounded-full bg-black/10" />
          </div>
          <div className="flex h-[calc(100%-1.5rem)]">
            <div className="w-[18%] space-y-1.5 border-r border-black/[0.06] bg-[#fafaf8] p-2">
              {[70, 90, 55, 80, 60].map((w, n) => (
                <span key={n} className="block h-1 rounded-full bg-black/10" style={{ width: `${w}%` }} />
              ))}
            </div>
            <div className="flex-1 space-y-2 p-2.5">
              <div className="grid grid-cols-3 gap-1.5">
                {[0, 1, 2].map((n) => (
                  <div key={n} className="rounded-md border border-black/[0.07] p-1.5">
                    <span className="block h-1 w-1/2 rounded-full bg-black/10" />
                    <span className="ws-tick mt-1.5 block h-2 rounded-sm bg-[#111]" style={{ animationDelay: `${-n * 0.9}s` }} />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="flex-1 space-y-1.5 rounded-md border border-black/[0.07] p-1.5">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <div key={n} className="flex items-center gap-1.5">
                      <span className="h-1 w-3 rounded-full bg-black/15" />
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.05]">
                        <span className="ws-fill block h-full rounded-full bg-black/45" style={{ animationDelay: `${n * 0.55}s` }} />
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex w-[34%] items-end gap-1 rounded-md border border-black/[0.07] p-1.5">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <span key={n} className="ws-bar block w-full rounded-t-sm bg-black/25" style={{ animationDelay: `${-n * 0.45}s` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
            </div>
  );
}

/** One mini worker, facing the reader. The head and body are one group (`ws-upper`), so a bow can fold them over the legs. */
export function WorkerFigure({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 24" className={className} fill="none">
      <g className="ws-upper">
        <circle cx="8" cy="4" r="3" fill="#111" />
        <rect x="4.5" y="8" width="7" height="8" rx="3" fill="#111" />
      </g>
      <path className="ws-leg-a" d="M6.5 15.5 5.5 22" stroke="#111" strokeWidth="1.8" strokeLinecap="round" />
      <path className="ws-leg-b" d="M9.5 15.5 10.5 22" stroke="#111" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** The stage's keyframes, shared with the reveal. */
export const WORKER_CSS = `
@keyframes ws-walk {
  0%, 6%   { left: var(--x0); top: var(--y0); }
  44%, 56% { left: var(--x1); top: var(--y1); }
  94%,100% { left: var(--x0); top: var(--y0); }
}
@keyframes ws-turn {
  0%, 49%  { transform: translate(-50%, -100%) scaleX(var(--dir)); }
  50%,100% { transform: translate(-50%, -100%) scaleX(calc(var(--dir) * -1)); }
}
@keyframes ws-carry {
  0%, 6%   { opacity: 0; transform: translate(-50%, 4px); }
  10%, 46% { opacity: 1; transform: translate(-50%, 0); }
  52%,100% { opacity: 0; transform: translate(-50%, -6px); }
}
@keyframes ws-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-1.2px); } }
@keyframes ws-leg-a { 0%,100% { transform: rotate(14deg); } 50% { transform: rotate(-14deg); } }
@keyframes ws-leg-b { 0%,100% { transform: rotate(-14deg); } 50% { transform: rotate(14deg); } }
@keyframes ws-fill { 0% { width: 0; } 40%, 80% { width: 100%; } 100% { width: 100%; opacity: 0.35; } }
@keyframes ws-bar  { 0%,100% { height: 30%; } 50% { height: 90%; } }
@keyframes ws-tick { 0%,100% { width: 40%; } 50% { width: 80%; } }

.ws-walker { animation: ws-walk 5.6s ease-in-out infinite; }
.ws-face   { position: relative; animation: ws-turn 5.6s steps(1) infinite; }
.ws-card   { animation: ws-carry 5.6s ease-in-out infinite; }
.ws-bob    { animation: ws-bob 0.36s ease-in-out infinite; }
.ws-leg-a, .ws-leg-b { transform-box: fill-box; transform-origin: top center; animation-duration: 0.36s; animation-iteration-count: infinite; animation-timing-function: ease-in-out; }
.ws-leg-a  { animation-name: ws-leg-a; }
.ws-leg-b  { animation-name: ws-leg-b; }
.ws-fill   { animation: ws-fill 3.4s ease-out infinite; }
.ws-bar    { animation: ws-bar 1.8s ease-in-out infinite; }
.ws-tick   { animation: ws-tick 2.7s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .ws-stage * { animation: none !important; }
  .ws-walker { left: var(--x1); top: var(--y1); }
  .ws-fill { width: 70%; }
  .ws-bar { height: 60%; }
}
`;
