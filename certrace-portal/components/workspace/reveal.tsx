"use client";

/* ════════════════════════════════════════════════════════════
   THE REVEAL — the year's set-up is ready

   Played inside the year's white card, in the space the upload had — never
   over the whole screen. It plays when the set-up has finished and the
   reader has not yet seen it: they press "Show the set-up workspace", or the
   set-up finished while they were away and they open the year.

     walk   seven mini workers walk in from the card's corners and edges and
            stop in one straight, horizontal line under the platform
     ready  "Your workspace is set up" and Get started
     bow    on Get started they bow together (a small wave from the left)
     zoom   the platform grows towards the reader and fades with the card,
            and the sheet takes its place

   There is no Skip button. With reduced motion there is no walk, bow or
   zoom: the line is already standing, and Get started opens the sheet.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { MiniPlatform, WORKER_CSS, WorkerFigure } from "@/components/workspace/setting-up";
import { useT } from "@/lib/i18n";

type Phase = "enter" | "walk" | "ready" | "bow" | "zoom";

/* Where each one comes from (just outside the card's corners and edges), as % of the card. */
const STARTS: [number, number][] = [
  [-6, -8],
  [-8, 46],
  [-6, 108],
  [50, 112],
  [106, 108],
  [108, 46],
  [106, -8],
];
const LINE_X = (i: number) => 26 + i * (48 / (STARTS.length - 1)); // 26% → 74%
const PLAT_Y = 31; // % — the platform's centre
const LINE_Y = 62; // % — the line they stand in
const TEXT_Y = 67; // % — the words and the button
const WALK_MS = 2200;
const STAGGER_MS = 110;
const BOW_MS = 1300;
const ZOOM_MS = 950;

/** `onDone` when the zoom has finished (or at once, with reduced motion): the page shows the sheet. */
export function WorkspaceReveal({ onDone }: { onDone: () => void }) {
  const t = useT();
  const [phase, setPhase] = React.useState<Phase>("enter");
  const stage = React.useRef<HTMLDivElement>(null);
  const [box, setBox] = React.useState<{ w: number; h: number } | null>(null);
  const calm = React.useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const timers = React.useRef<number[]>([]);
  /* The page hands in a new callback every time it draws; kept in a ref, so the timers below are set once and a
     re-render of the page cannot clear them (which left the workers standing outside the card). */
  const cb = React.useRef(onDone);
  cb.current = onDone;

  // The platform is fitted to the card.
  React.useEffect(() => {
    const measure = () => {
      const el = stage.current;
      if (el) setBox({ w: el.clientWidth, h: el.clientHeight });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  React.useEffect(() => {
    const list = timers.current;
    if (calm) setPhase("ready");
    else {
      /* A moment at the start positions, then walk — so the transition has somewhere to come from. A timer, not
         requestAnimationFrame: a frame can be held back (a background tab), and then nobody would walk. */
      list.push(window.setTimeout(() => setPhase("walk"), 60));
      list.push(window.setTimeout(() => setPhase("ready"), 60 + WALK_MS + STAGGER_MS * STARTS.length + 150));
    }
    return () => list.forEach(window.clearTimeout);
  }, [calm]);

  const start = () => {
    if (phase !== "ready") return;
    if (calm) return cb.current();
    setPhase("bow");
    timers.current.push(window.setTimeout(() => setPhase("zoom"), BOW_MS));
    timers.current.push(window.setTimeout(() => cb.current(), BOW_MS + ZOOM_MS));
  };

  // As wide as 460px or 62% of the card, and never taller than 31% of it.
  const wide = box ? Math.min(460, box.w * 0.62) : 460;
  const fit = box ? Math.min(wide / 360, (box.h * 0.31) / 220) : 1;
  const placed = phase !== "enter";
  const zooming = phase === "zoom";

  return (
    <div
      ref={stage}
      role="region"
      aria-label={t("Your workspace is set up")}
      className="relative h-[480px] overflow-hidden rounded-2xl bg-[#fafaf8]"
      style={{ opacity: zooming ? 0 : 1, transition: `opacity ${ZOOM_MS}ms ease-in ${ZOOM_MS * 0.35}ms` }}
    >
      <style>{WORKER_CSS + REVEAL_CSS}</style>

      {/* the platform, drawn at the set-up stage's own size and scaled, so its contents grow with it */}
      <div
        className="absolute left-1/2 h-[220px] w-[360px]"
        style={{
          top: `${PLAT_Y}%`,
          transform: `translate(-50%, -50%) scale(${(zooming ? 3.4 : 1) * fit})`,
          opacity: zooming ? 0 : 1,
          transition: `transform ${ZOOM_MS}ms cubic-bezier(.55,0,.75,.2), opacity ${ZOOM_MS}ms ease-in`,
        }}
      >
        <MiniPlatform className="h-full w-full" />
      </div>

      {/* the line of workers */}
      <div aria-hidden="true" className={phase === "walk" ? "" : "rv-still"}>
        {STARTS.map(([x0, y0], i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${placed ? LINE_X(i) : x0}%`,
              top: `${placed ? LINE_Y : y0}%`,
              transform: "translate(-50%, -100%)",
              transition: calm
                ? undefined
                : `left ${WALK_MS}ms cubic-bezier(.4,.1,.3,1) ${i * STAGGER_MS}ms, top ${WALK_MS}ms cubic-bezier(.4,.1,.3,1) ${i * STAGGER_MS}ms, opacity 300ms ease-in`,
              opacity: zooming ? 0 : 1,
            }}
          >
            <div className={phase === "bow" ? "rv-bow" : ""} style={{ "--bow-delay": `${i * 60}ms` } as React.CSSProperties}>
              <WorkerFigure className="ws-bob h-11 w-[30px]" />
            </div>
          </div>
        ))}
      </div>

      {/* the words and the button */}
      <div
        className="absolute inset-x-0 flex flex-col items-center px-4 text-center"
        style={{
          top: `${TEXT_Y}%`,
          opacity: phase === "ready" ? 1 : 0,
          transform: phase === "ready" ? "translateY(0)" : "translateY(6px)",
          transition: "opacity 400ms ease-out, transform 400ms ease-out",
          pointerEvents: phase === "ready" ? "auto" : "none",
        }}
      >
        <h2 className="font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#111]">
          {t("Your workspace is set up")}
        </h2>
        <p className="mt-1.5 text-sm text-black/45">{t("Every file is sorted into the sheets.")}</p>
        <Button className="mt-5" onClick={start}>
          {t("Get started")} <ArrowRight size={14} strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
}

const REVEAL_CSS = `
/* standing still: no stepping, no bob */
.rv-still .ws-leg-a, .rv-still .ws-leg-b, .rv-still .ws-bob { animation: none !important; }
/* a bow, facing the reader: head and body fold forward over the hips, hold, and rise */
@keyframes rv-bow {
  0%       { transform: translateY(0) scaleY(1); }
  32%, 66% { transform: translateY(2.2px) scaleY(0.7); }
  100%     { transform: translateY(0) scaleY(1); }
}
.ws-upper { transform-box: view-box; transform-origin: 8px 16px; }
.rv-bow .ws-upper { animation: rv-bow ${BOW_MS - 200}ms cubic-bezier(.45,0,.35,1) var(--bow-delay, 0ms) both; }
`;
