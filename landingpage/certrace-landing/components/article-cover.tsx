"use client";

/* ════════════════════════════════════════════════════════════
   COVER ART FOR THE CBAM GUIDES — drawn, not licensed

   WHY NOT A PHOTOGRAPH. Fifteen stock photographs of steel mills and shipping
   containers would say nothing about fifteen different arguments, would need
   licensing for commercial use, and would drag a megabyte each onto pages
   whose whole point is being fast to read. These are inline SVG: a few
   hundred bytes, sharp at any size, in the site's own ink-on-bone palette,
   and each one draws the actual shape of its article's argument.

   Each motif is a diagram, not decoration:
     border    goods crossing a line that costs something to cross
     calendar  a run of months with the deadline marked
     price     a stepped series, two known, two not
     formula   one term multiplied by a bracket of three
     decline   the free-allocation curve, 97.5% to zero
     scope     six filled sectors and the ring of downstream goods
     values    two bars, the true one and the punitive default
     tree      a precursor chain narrowing into one good
     seal      a mark that something was checked
     tonne     one tonne, and the slice of it that is carbon cost
     globe     three regimes, one requirement
     path      a route with a milestone on it
     choice    two identical goods at the border; the proven one goes through
     request   a form passed up the chain from supplier to exporter
     sum       three inputs added, then divided into one figure

   Emerald is the only colour, used for the good outcome, exactly as the rest
   of the site uses it. Everything else is ink at low opacity.
   ════════════════════════════════════════════════════════════ */

import type { Motif } from "@/lib/cbam-guide";

const INK = "rgba(17,17,17,0.28)";
const INK_SOFT = "rgba(17,17,17,0.12)";
const INK_FAINT = "rgba(17,17,17,0.06)";
const GOOD = "rgba(5,150,105,0.55)";
const BAD = "rgba(220,38,38,0.35)";

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 200 130"
      className="h-full w-full"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      {children}
    </svg>
  );
}

const MOTIFS: Record<Motif, React.ReactNode> = {
  border: (
    <>
      <line x1="100" y1="14" x2="100" y2="116" stroke={INK} strokeWidth="1" strokeDasharray="3 4" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={30 + i * 20} y={54 - i * 6} width="16" height={22 + i * 12} fill={INK_SOFT} />
      ))}
      <path d="M96 65h20m-6-5 6 5-6 5" stroke={GOOD} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={126 + i * 20} y={54 - i * 6} width="16" height={22 + i * 12} fill={INK_FAINT} stroke={INK_SOFT} />
      ))}
    </>
  ),
  calendar: (
    <>
      <rect x="30" y="26" width="140" height="78" rx="4" stroke={INK_SOFT} />
      <line x1="30" y1="42" x2="170" y2="42" stroke={INK_SOFT} />
      {Array.from({ length: 24 }, (_, i) => {
        const col = i % 6;
        const row = Math.floor(i / 6);
        const last = i === 23;
        return (
          <rect
            key={i}
            x={40 + col * 21}
            y={52 + row * 14}
            width="13"
            height="8"
            rx="1.5"
            fill={last ? GOOD : i > 17 ? INK_SOFT : INK_FAINT}
          />
        );
      })}
    </>
  ),
  price: (
    <>
      <line x1="28" y1="104" x2="172" y2="104" stroke={INK_SOFT} />
      {[
        { h: 54, known: true },
        { h: 53, known: true },
        { h: 34, known: false },
        { h: 34, known: false },
      ].map((b, i) => (
        <rect
          key={i}
          x={44 + i * 32}
          y={104 - b.h}
          width="20"
          height={b.h}
          fill={b.known ? INK_SOFT : "none"}
          stroke={b.known ? "none" : INK_SOFT}
          strokeDasharray={b.known ? undefined : "3 3"}
        />
      ))}
      <line x1="36" y1="46" x2="164" y2="46" stroke={GOOD} strokeWidth="1" strokeDasharray="2 4" />
    </>
  ),
  formula: (
    <>
      <rect x="26" y="52" width="26" height="26" rx="3" fill={INK_SOFT} />
      <path d="M60 65h8M64 61v8" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M78 40q-8 25 0 50M162 40q8 25 0 50" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
      <rect x="88" y="52" width="26" height="26" rx="3" fill={INK_SOFT} />
      <path d="M120 65h8" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
      <rect x="134" y="52" width="20" height="26" rx="3" fill="none" stroke={GOOD} strokeDasharray="3 3" />
    </>
  ),
  decline: (
    <>
      <line x1="28" y1="104" x2="172" y2="104" stroke={INK_SOFT} />
      <path
        d="M32 32 L52 34 L72 38 L92 50 L112 68 L132 80 L152 92 L172 104"
        stroke={INK}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 32 L52 34 L72 38 L92 50 L112 68 L132 80 L152 92 L172 104 L172 104 L32 104 Z"
        fill={INK_FAINT}
      />
      <circle cx="32" cy="32" r="2.6" fill={INK} />
      <circle cx="172" cy="104" r="2.6" fill={BAD} />
    </>
  ),
  scope: (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <circle key={i} cx={48 + (i % 3) * 26} cy={48 + Math.floor(i / 3) * 26} r="9" fill={INK_SOFT} />
      ))}
      <circle cx="74" cy="61" r="44" stroke={GOOD} strokeDasharray="4 4" />
      {Array.from({ length: 5 }, (_, i) => {
        const a = (-50 + i * 25) * (Math.PI / 180);
        return (
          <rect
            key={i}
            x={74 + Math.cos(a) * 56 - 4}
            y={61 + Math.sin(a) * 56 - 4}
            width="8"
            height="8"
            rx="1.5"
            fill="none"
            stroke={INK_SOFT}
          />
        );
      })}
    </>
  ),
  values: (
    <>
      <line x1="28" y1="104" x2="172" y2="104" stroke={INK_SOFT} />
      <rect x="56" y="40" width="30" height="64" fill={BAD} />
      <rect x="114" y="62" width="30" height="42" fill={GOOD} />
      <line x1="46" y1="40" x2="154" y2="40" stroke={INK_SOFT} strokeDasharray="2 4" />
      <line x1="46" y1="62" x2="154" y2="62" stroke={INK_SOFT} strokeDasharray="2 4" />
      <path d="M100 44v14m-3-4 3 4 3-4" stroke={INK} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  tree: (
    <>
      <rect x="88" y="92" width="24" height="16" rx="2" fill={GOOD} />
      <path d="M100 92V76M100 76H62M100 76h38M62 76V64M138 76V64" stroke={INK} strokeWidth="1.1" />
      <rect x="52" y="48" width="20" height="16" rx="2" fill={INK_SOFT} />
      <rect x="128" y="48" width="20" height="16" rx="2" fill={INK_SOFT} />
      <path d="M62 48V38M62 38H40M62 38h22M40 38v-8M84 38v-8" stroke={INK_SOFT} strokeWidth="1" />
      <rect x="32" y="20" width="16" height="12" rx="2" fill={INK_FAINT} stroke={INK_SOFT} />
      <rect x="76" y="20" width="16" height="12" rx="2" fill={INK_FAINT} stroke={INK_SOFT} />
      <path d="M138 48V32" stroke={INK_SOFT} strokeWidth="1" strokeDasharray="2 3" />
      <rect x="130" y="20" width="16" height="12" rx="2" fill="none" stroke={BAD} strokeDasharray="2 2" />
    </>
  ),
  seal: (
    <>
      <circle cx="100" cy="60" r="30" stroke={INK_SOFT} />
      <circle cx="100" cy="60" r="38" stroke={INK_FAINT} strokeDasharray="3 5" />
      <path d="M88 60.5 96.5 69 113 51" stroke={GOOD} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M88 90v22l12-7 12 7V90" stroke={INK_SOFT} strokeWidth="1.2" strokeLinejoin="round" />
    </>
  ),
  tonne: (
    <>
      <rect x="62" y="28" width="76" height="76" rx="3" stroke={INK_SOFT} />
      <rect x="62" y="28" width="76" height="26" fill={BAD} />
      <rect x="62" y="54" width="76" height="50" fill={INK_FAINT} />
      <line x1="62" y1="54" x2="138" y2="54" stroke={INK_SOFT} />
      <path d="M148 30v22m0 0-3-4m3 4 3-4" stroke={INK} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  globe: (
    <>
      <circle cx="100" cy="64" r="34" stroke={INK_SOFT} />
      <ellipse cx="100" cy="64" rx="14" ry="34" stroke={INK_FAINT} />
      <line x1="66" y1="64" x2="134" y2="64" stroke={INK_FAINT} />
      <line x1="72" y1="46" x2="128" y2="46" stroke={INK_FAINT} />
      <line x1="72" y1="82" x2="128" y2="82" stroke={INK_FAINT} />
      <circle cx="84" cy="50" r="3.4" fill={INK} />
      <circle cx="112" cy="58" r="3.4" fill={INK_SOFT} />
      <circle cx="94" cy="80" r="3.4" fill={GOOD} />
    </>
  ),
  path: (
    <>
      <path
        d="M30 96 Q66 96 74 74 T118 46 T170 34"
        stroke={INK}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="1 6"
      />
      {[
        [30, 96],
        [74, 74],
        [118, 46],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill="none" stroke={INK_SOFT} strokeWidth="1.4" />
      ))}
      <circle cx="170" cy="34" r="5.5" fill={GOOD} />
    </>
  ),
  choice: (
    <>
      <line x1="120" y1="14" x2="120" y2="116" stroke={INK} strokeWidth="1" strokeDasharray="3 4" />
      {/* the same crate twice: one carries a verified figure and crosses */}
      <rect x="44" y="34" width="26" height="22" rx="2" fill={INK_SOFT} />
      <path d="M51 45.5 55.5 50 63 41" stroke={GOOD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M76 45h60m-6-5 6 5-6 5" stroke={GOOD} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="146" y="34" width="26" height="22" rx="2" fill="none" stroke={GOOD} strokeWidth="1.2" />
      {/* the other has no figure, and is held at the line with a default */}
      <rect x="44" y="76" width="26" height="22" rx="2" fill={INK_SOFT} />
      <path d="M76 87h34" stroke={INK_SOFT} strokeWidth="1.4" strokeLinecap="round" strokeDasharray="2 4" />
      <rect x="92" y="74" width="22" height="26" rx="2" fill="none" stroke={BAD} strokeDasharray="2 2" />
    </>
  ),
  request: (
    <>
      {/* the supplier's sheet, filled in, travelling to the exporter */}
      <rect x="42" y="30" width="44" height="58" rx="3" fill="#fff" stroke={INK_SOFT} />
      {[42, 52, 62, 72].map((y) => (
        <line key={y} x1="50" y1={y} x2={y === 72 ? 66 : 78} y2={y} stroke={INK_SOFT} strokeWidth="2" strokeLinecap="round" />
      ))}
      <path d="M92 59h30m-6-5 6 5-6 5" stroke={GOOD} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="128" y="38" width="34" height="42" rx="3" fill={INK_FAINT} stroke={INK_SOFT} />
      <path d="M137 59.5 142.5 65 153 53" stroke={GOOD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="64" cy="102" r="3" fill={INK_SOFT} />
      <circle cx="145" cy="94" r="3" fill={INK} />
    </>
  ),
  sum: (
    <>
      {/* three inputs of very different size, one dominant — the precursor */}
      <rect x="44" y="28" width="16" height="10" fill={INK_SOFT} />
      <rect x="44" y="44" width="10" height="10" fill={INK_FAINT} stroke={INK_SOFT} strokeDasharray="2 2" />
      <rect x="44" y="60" width="72" height="10" fill={GOOD} />
      <line x1="40" y1="80" x2="124" y2="80" stroke={INK} strokeWidth="1" />
      <path d="M134 75h10m-10 6h10" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
      <rect x="152" y="66" width="20" height="24" rx="2" fill="none" stroke={GOOD} strokeWidth="1.2" />
      <text x="82" y="100" textAnchor="middle" fontSize="9" fontFamily="monospace" fill={INK}>÷ t</text>
    </>
  ),
};

export function ArticleCover({
  motif,
  className = "",
}: {
  motif: Motif;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-[#faf9f7] ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.028) 1px, transparent 1px)",
        backgroundSize: "16px 16px",
      }}
    >
      <div className="absolute inset-0 p-4">
        <Frame>{MOTIFS[motif]}</Frame>
      </div>
    </div>
  );
}
