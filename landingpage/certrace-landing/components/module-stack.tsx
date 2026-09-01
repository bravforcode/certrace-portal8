"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import { FeatureScreen } from "./portal-screens";
import { TagBadge } from "./ui";

type VisualType =
  | "invite"
  | "profile"
  | "quality"
  | "engine"
  | "benchmark"
  | "report";

/* Anchor id + which portal screen to draw. Copy comes from lib/content.ts, in
   the same order — the anchors are linked from the nav and the footer, so
   these ids are fixed regardless of language.

   The visuals used to be invented mini-cards. They are now the product's own
   screens, redrawn from the portal's tokens and its own strings — see
   components/portal-screens.tsx for why they are drawn rather than captured. */
const MODULE_SHELLS: { id: string; visual: VisualType }[] = [
  { id: "platform-invite", visual: "invite" },
  { id: "platform-profile", visual: "profile" },
  { id: "platform-quality", visual: "quality" },
  { id: "platform-engine", visual: "engine" },
  { id: "platform-benchmark", visual: "benchmark" },
  { id: "platform-report", visual: "report" },
];

const PANEL_GRID = {
  backgroundImage:
    "linear-gradient(rgba(0,0,0,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.035) 1px, transparent 1px)",
  backgroundSize: "24px 24px",
} as const;

function ModuleVisual({ type }: { type: VisualType }) {
  return (
    <div
      className="flex h-full w-full items-center justify-center px-4 md:py-7"
      style={PANEL_GRID}
    >
      {/* Capped rather than full-bleed: the panel is half the card on desktop
          and the whole card on phones, and a window that fills either edge to
          edge stops reading as a window. */}
      <div className="w-full max-w-[330px]">
        <FeatureScreen type={type} />
      </div>
    </div>
  );
}

export function ModuleStack() {
  const { c } = useLang();
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [stacked, setStacked] = useState(MODULE_SHELLS.map(() => 0));

  useEffect(() => {
    const onScroll = () => {
      setStacked(
        MODULE_SHELLS.map((_, i) => {
          let count = 0;
          for (let j = i + 1; j < MODULE_SHELLS.length; j++) {
            const el = cardRefs.current[j];
            if (!el) continue;
            const top = el.getBoundingClientRect().top;
            const stickyTop = 80 + 16 * j;
            if (top <= stickyTop + 2) count++;
          }
          return count;
        }),
      );
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="flex flex-col"
      style={{ perspective: "1400px", perspectiveOrigin: "50% 0%" }}
    >
      {MODULE_SHELLS.map((shell, i) => {
        const depth = stacked[i];
        const mod = c.platform.modules[i];
        return (
          <div
            key={shell.id}
            id={shell.id}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="sticky mb-4"
            style={{ top: `${80 + 16 * i}px`, zIndex: 10 + i }}
          >
            <div
              style={{
                transform: `scale(${1 - 0.04 * depth}) translateY(${8 * depth}px)`,
                transformOrigin: "top center",
                transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
                willChange: "transform",
              }}
            >
              {/* md:min-h — the desktop panel is sized by the tallest screen it
                  has to carry (307px) plus its padding, NOT by the length of
                  the copy beside it. Before this the card was whatever the
                  paragraph made it, which on English was 290px, and the window
                  was clipped at both ends by the card's own overflow-hidden. */}
              <div className="group relative bg-[#faf9f7] rounded-2xl border border-black/[0.07] overflow-hidden md:min-h-[404px]">
                {/* h-72, not h-52: the panel now carries a whole application
                    window rather than a 150px mini-card, and the old height
                    sliced the last two rows off on phones. The mask still
                    fades it into the copy below. */}
                <div className="relative w-full h-72 pointer-events-none md:hidden">
                  <div
                    className="absolute inset-0"
                    style={{
                      maskImage:
                        "linear-gradient(to bottom, black 0%, black 35%, transparent 95%)",
                      WebkitMaskImage:
                        "linear-gradient(to bottom, black 0%, black 35%, transparent 95%)",
                    }}
                  >
                    <ModuleVisual type={shell.visual} />
                  </div>
                </div>

                <div className="hidden md:block absolute inset-y-0 right-0 w-1/2 pointer-events-none">
                  <ModuleVisual type={shell.visual} />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to right, #faf9f7 0%, transparent 55%)",
                    }}
                  />
                </div>

                <div className="relative z-10 flex h-full flex-col p-8 md:min-h-[404px]">
                  <div className="md:max-w-[55%]">
                    <div className="flex items-start justify-between mb-6">
                      <TagBadge>{mod.label}</TagBadge>
                    </div>
                    <h3 className="text-xl md:text-2xl font-light mb-3">
                      {mod.title}
                    </h3>
                    <p className="text-sm text-black/45 leading-relaxed mb-8">
                      {mod.desc}
                    </p>
                  </div>

                  {/* The rule stops before the panel starts. Full-bleed, it was
                      drawn straight across the prototype window in the right
                      half of the card — the content layer sits above the
                      visual, so the line read as a slice through the screen.

                      50% minus a gutter, NOT the 55% the copy above it uses:
                      the panel begins at exactly half the card, and 55% put the
                      line 17px into it at md widths. The copy can run to 55%
                      because it sits over the panel's own fade-to-#faf9f7; a
                      1px rule cannot, because a rule is visible wherever it
                      lands. */}
                  <div className="mt-auto flex flex-wrap gap-2 pt-6 border-t border-black/[0.06] md:max-w-[calc(50%-1rem)]">
                    {mod.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-full text-[10px] tracking-wider text-black/35 border border-black/[0.08]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
