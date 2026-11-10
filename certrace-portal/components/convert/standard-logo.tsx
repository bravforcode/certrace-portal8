/* The tile beside each standard on the Convert screens. Drawn inline, like the
   language flags, so it reads the same on every machine. */

import * as React from "react";
import type { Standard } from "@/lib/convert-mock";
import { cn } from "@/components/ui";

function stars(cx: number, cy: number, r: number) {
  return Array.from({ length: 12 }, (_, i) => {
    const a = (i * 30 * Math.PI) / 180;
    return (
      <circle
        key={i}
        cx={(cx + r * Math.sin(a)).toFixed(2)}
        cy={(cy - r * Math.cos(a)).toFixed(2)}
        r="1.25"
        fill="#FFCC00"
      />
    );
  });
}

export function StandardLogo({
  logo,
  className,
}: {
  logo: Standard["logo"];
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden
      className={cn("h-10 w-10 flex-none rounded-xl", className)}
    >
      {logo === "eu" && (
        <>
          <rect width="40" height="40" rx="10" fill="#003399" />
          {stars(20, 20, 10)}
        </>
      )}
      {logo === "uk" && (
        <>
          <clipPath id="uk-tile">
            <rect width="40" height="40" rx="10" />
          </clipPath>
          <g clipPath="url(#uk-tile)">
            <rect width="40" height="40" fill="#012169" />
            <path d="M0,0 40,40 M40,0 0,40" stroke="#fff" strokeWidth="7" />
            <path d="M0,0 40,40 M40,0 0,40" stroke="#C8102E" strokeWidth="2.5" />
            <path d="M20,0 V40 M0,20 H40" stroke="#fff" strokeWidth="11" />
            <path d="M20,0 V40 M0,20 H40" stroke="#C8102E" strokeWidth="6" />
          </g>
        </>
      )}
      {logo === "iso" && (
        <>
          <rect width="40" height="40" rx="10" fill="#EDEBE6" />
          <text
            x="20"
            y="24.5"
            textAnchor="middle"
            fontSize="12"
            fontWeight="600"
            fill="#55534E"
            fontFamily="ui-sans-serif, system-ui"
          >
            ISO
          </text>
        </>
      )}
      {logo === "leaf" && (
        <>
          <rect width="40" height="40" rx="10" fill="#E3F1E7" />
          <path
            d="M12 28c0-10 7-16 17-16 0 10-6 17-16 17"
            fill="#5FAE7A"
          />
          <path
            d="M13 27 23 17"
            stroke="#2F7A4B"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
