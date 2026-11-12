/* ── Language-menu flags ────────────────────────────────────────
   Drawn inline rather than as emoji: Windows renders flag emoji as two
   letters ("GB"), and the menu has to read the same on every machine. The
   shapes are simplified for a 22×16 chip — recognisable, not heraldic. */

import * as React from "react";
import type { MenuCode } from "@/lib/i18n";
import { cn } from "./ui";

/** A five-point star centred on (cx, cy) with outer radius r. */
function star(cx: number, cy: number, r: number, rotate = 0): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.382;
    const a = ((-90 + rotate + i * 36) * Math.PI) / 180;
    pts.push(
      `${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`,
    );
  }
  return pts.join(" ");
}

/* Every flag is drawn on a 30×20 canvas. */
const FLAGS: Record<MenuCode, React.ReactNode> = {
  en: (
    <>
      <rect width="30" height="20" fill="#012169" />
      <path d="M0,0 30,20 M30,0 0,20" stroke="#fff" strokeWidth="4" />
      <path d="M0,0 30,20 M30,0 0,20" stroke="#C8102E" strokeWidth="1.4" />
      <path d="M15,0 V20 M0,10 H30" stroke="#fff" strokeWidth="6" />
      <path d="M15,0 V20 M0,10 H30" stroke="#C8102E" strokeWidth="3.4" />
    </>
  ),
  "en-US": (
    <>
      <rect width="30" height="20" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect
          key={i}
          y={(i * 20) / 13}
          width="30"
          height={20 / 13}
          fill="#B22234"
        />
      ))}
      <rect width="13" height={(20 / 13) * 7} fill="#3C3B6E" />
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2, 3, 4].map((c) => (
          <circle
            key={`${r}-${c}`}
            cx={1.6 + c * 2.45 + (r % 2) * 1.2}
            cy={1.5 + r * 2.4}
            r="0.55"
            fill="#fff"
          />
        )),
      )}
    </>
  ),
  th: (
    <>
      <rect width="30" height="20" fill="#A51931" />
      <rect y="3.33" width="30" height="13.34" fill="#F4F5F8" />
      <rect y="6.67" width="30" height="6.66" fill="#2D2A4A" />
    </>
  ),
  vi: (
    <>
      <rect width="30" height="20" fill="#DA251D" />
      <polygon points={star(15, 10.4, 6)} fill="#FFFF00" />
    </>
  ),
  tr: (
    <>
      <rect width="30" height="20" fill="#E30A17" />
      <circle cx="11.5" cy="10" r="5" fill="#fff" />
      <circle cx="12.75" cy="10" r="4" fill="#E30A17" />
      <polygon points={star(18.2, 10, 2.5, -90)} fill="#fff" />
    </>
  ),
  hi: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <rect width="30" height="6.67" fill="#FF9933" />
      <rect y="13.33" width="30" height="6.67" fill="#138808" />
      <circle
        cx="15"
        cy="10"
        r="2.4"
        fill="none"
        stroke="#000080"
        strokeWidth="0.6"
      />
      <circle cx="15" cy="10" r="0.6" fill="#000080" />
    </>
  ),
  zh: (
    <>
      <rect width="30" height="20" fill="#EE1C25" />
      <polygon points={star(5, 5, 3)} fill="#FFFF00" />
      <polygon points={star(10, 2, 1, 23)} fill="#FFFF00" />
      <polygon points={star(12, 4, 1, 45)} fill="#FFFF00" />
      <polygon points={star(12, 7, 1, 70)} fill="#FFFF00" />
      <polygon points={star(10, 9, 1, 20)} fill="#FFFF00" />
    </>
  ),
  ko: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <circle cx="15" cy="10" r="5" fill="#0047A0" />
      <path
        d="M10,10 A5,5 0 0 1 20,10 A2.5,2.5 0 0 1 15,10 A2.5,2.5 0 0 0 10,10 Z"
        fill="#CD2E3A"
      />
      <g stroke="#000" strokeWidth="0.8">
        <path d="M4,4.6 l2.2,-1.6 M4.6,5.6 l2.2,-1.6 M5.2,6.6 l2.2,-1.6" />
        <path d="M22.6,13.4 l2.2,1.6 M23.2,12.4 l2.2,1.6 M23.8,11.4 l2.2,1.6" />
        <path d="M22.6,6.6 l2.2,-1.6 M23.2,7.6 l2.2,-1.6 M21.9,5.6 l2.2,-1.6" />
        <path d="M4,15.4 l2.2,1.6 M4.6,14.4 l2.2,1.6 M5.2,13.4 l2.2,1.6" />
      </g>
    </>
  ),
  "zh-TW": (
    <>
      <rect width="30" height="20" fill="#FE0000" />
      <rect width="15" height="10" fill="#000095" />
      <polygon points={star(7.5, 5, 3.6)} fill="#fff" />
      <circle cx="7.5" cy="5" r="1.9" fill="#000095" />
      <circle cx="7.5" cy="5" r="1.5" fill="#fff" />
    </>
  ),
  id: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <rect width="30" height="10" fill="#CE1126" />
    </>
  ),
  ja: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <circle cx="15" cy="10" r="6" fill="#BC002D" />
    </>
  ),
  ms: (
    <>
      <rect width="30" height="20" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect
          key={i}
          y={(i * 20) / 14}
          width="30"
          height={20 / 14}
          fill="#CC0001"
        />
      ))}
      <rect width="15" height={(20 / 14) * 8} fill="#010066" />
      <circle cx="5.6" cy="5.7" r="3.4" fill="#FFCC00" />
      <circle cx="6.6" cy="5.7" r="2.8" fill="#010066" />
      <polygon points={star(11, 5.7, 2.4)} fill="#FFCC00" />
    </>
  ),
};

export function Flag({
  code,
  className,
}: {
  code: MenuCode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 30 20"
      aria-hidden
      className={cn(
        "h-[14px] w-[21px] flex-none overflow-hidden rounded-[3px] ring-1 ring-black/10",
        className,
      )}
    >
      {FLAGS[code]}
    </svg>
  );
}
