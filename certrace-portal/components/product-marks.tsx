import * as React from "react";
import { CeraMark } from "./cera/cera-mark";
/** Product ids, as in the landing page's lib/nav-menu.ts. */
export type ProductId =
  | "dashboard"
  | "workspace"
  | "convert"
  | "smartlink"
  | "carbonCost"
  | "supplyChain"
  | "prove"
  | "cera"
  | "trace"
  | "reduce"
  | "connect"
  | "market";

/* ════════════════════════════════════════════════════════════
   PRODUCT MARKS — one small mark per product

   Drawn in Cera's language so they sit together as one family: flat fills,
   three tones of one hue (back / front / where they overlap), rounded
   corners, no outlines. Each mark owns a hue —

     Dashboard    indigo — three tiles of a board: everything at a glance
     Prove        ink    — a shield over a panel, with a tick: proof
     Workspace    blue   — three stacked planes: every layer of your data
     Convert      amber  — one panel passing through another: data in, report out
     Smart Link   violet — two linked rings: the link between you and a supplier
     Carbon & Cost teal  — a pie: where the cost sits
     Supply Chain  teal  — three linked nodes: the chain
                          (the two dashboards share a hue: they are a pair)
     Cera         green  — her own mark, unchanged (components/cera-mark.tsx)
     Trace        sky    — a lens over a tick: find, and know it is verified
     Reduce       lime   — three falling bars
     Connect      pink   — two overlapping circles: a match
     Market       coral  — two arrows trading places: an exchange

   Like the Cera mark, the fills are CSS variables with defaults, so a theme
   can recolour them, and `tone="ink"` gives a one-colour version that follows
   currentColor.
   ════════════════════════════════════════════════════════════ */

type Tone = "brand" | "ink";

type Props = {
  product: ProductId;
  className?: string;
  tone?: Tone;
};

const HUES: Record<Exclude<ProductId, "cera">, [string, string, string]> = {
  dashboard: ["#C3C8F4", "#8D95E6", "#5A63CF"],
  workspace: ["#A9C6F5", "#6F9CEA", "#3F74D6"],
  convert: ["#F6D08A", "#EDA94E", "#D9862B"],
  smartlink: ["#C9BDF3", "#9C89E6", "#7259D3"],
  carbonCost: ["#A8DDD8", "#5FBFB7", "#2E9990"],
  supplyChain: ["#A8DDD8", "#5FBFB7", "#2E9990"],
  prove: ["#CFCCC4", "#8E8B84", "#2E2D2B"],
  trace: ["#B5DDF2", "#62B4E0", "#2185BA"],
  reduce: ["#D7E99E", "#A9CC50", "#7AA42A"],
  connect: ["#F4BED5", "#E68AB5", "#C9568F"],
  market: ["#F6C0AE", "#EB8C71", "#D2613F"],
};

type Fill = { fill: string; fillOpacity?: number };

function fills(
  product: Exclude<ProductId, "cera">,
  tone: Tone,
): [Fill, Fill, Fill] {
  if (tone === "ink") {
    return [
      { fill: "currentColor", fillOpacity: 0.32 },
      { fill: "currentColor", fillOpacity: 0.6 },
      { fill: "currentColor", fillOpacity: 1 },
    ];
  }
  const [a, b, c] = HUES[product];
  return [
    { fill: `var(--mark-${product}-back, ${a})` },
    { fill: `var(--mark-${product}-front, ${b})` },
    { fill: `var(--mark-${product}-overlap, ${c})` },
  ];
}

/* A board of three tiles: a tall one on the left, two stacked on the right —
   the light tone the big picture, the darker two the figures beside it. */
function DashboardMark({ tone }: { tone: Tone }) {
  const [back, front, overlap] = fills("dashboard", tone);
  return (
    <>
      <rect x="2.5" y="2.5" width="9" height="19" rx="2.6" {...back} />
      <rect x="13.5" y="2.5" width="8" height="8" rx="2.6" {...overlap} />
      <rect x="13.5" y="12.5" width="8" height="9" rx="2.6" {...front} />
    </>
  );
}

/* Three isometric planes, stacked. Drawn bottom-up so each layer sits on the
   one below; rounded by a same-colour stroke with round joins. */
function WorkspaceMark({ tone }: { tone: Tone }) {
  const [back, front, top] = fills("workspace", tone);
  const plane = (dy: number) =>
    `M12 ${3 + dy} L20.5 ${7.4 + dy} L12 ${11.8 + dy} L3.5 ${7.4 + dy} Z`;
  const layer = (f: Fill, dy: number) => (
    <path
      d={plane(dy)}
      fill={f.fill}
      fillOpacity={f.fillOpacity}
      stroke={f.fill}
      strokeOpacity={f.fillOpacity}
      strokeWidth={2.2}
      strokeLinejoin="round"
    />
  );
  return (
    <>
      {layer(back, 8.2)}
      {layer(front, 4.1)}
      {layer(top, 0)}
    </>
  );
}

/* Two rounded panels, the back one taller (the data), the front one
   offset to the right (the report). The overlap is the front panel clipped
   to the back one, as in the Cera mark, so the three regions stay aligned. */
function ConvertMark({ tone, uid }: { tone: Tone; uid: string }) {
  const [back, front, overlap] = fills("convert", tone);
  const clip = `convert-clip-${uid}`;
  const backPath =
    "M5.2 2.5h6.6a2.7 2.7 0 0 1 2.7 2.7v13.6a2.7 2.7 0 0 1-2.7 2.7H5.2a2.7 2.7 0 0 1-2.7-2.7V5.2a2.7 2.7 0 0 1 2.7-2.7Z";
  const frontPath =
    "M12.2 6.5h6.6a2.7 2.7 0 0 1 2.7 2.7v9.6a2.7 2.7 0 0 1-2.7 2.7h-6.6a2.7 2.7 0 0 1-2.7-2.7V9.2a2.7 2.7 0 0 1 2.7-2.7Z";
  return (
    <>
      <defs>
        <clipPath id={clip}>
          <path d={backPath} />
        </clipPath>
      </defs>
      <path d={backPath} {...back} />
      <path d={frontPath} {...front} />
      <path d={frontPath} {...overlap} clipPath={`url(#${clip})`} />
    </>
  );
}

/* Two rounded rings, crossed at 45°. The second ring is drawn twice: once
   whole, then its top-left half again over the first ring, so the pair reads
   as linked rather than stacked. */
function SmartLinkMark({ tone, uid }: { tone: Tone; uid: string }) {
  const [, a, b] = fills("smartlink", tone);
  const clip = `link-clip-${uid}`;
  const ring = (cx: number, cy: number) => (
    <rect
      x={cx - 6.2}
      y={cy - 3.6}
      width={12.4}
      height={7.2}
      rx={3.6}
      transform={`rotate(-45 ${cx} ${cy})`}
      fill="none"
      strokeWidth={2.4}
    />
  );
  const colour = (f: Fill) => ({
    stroke: f.fill,
    strokeOpacity: f.fillOpacity ?? 1,
  });
  return (
    <>
      <defs>
        {/* The two rings lie on one diagonal, so their outlines cross once
            on each side of it. This triangle is the upper-left side: redrawing
            the first ring inside it puts that ring over the second at one
            crossing and under it at the other. */}
        <clipPath id={clip}>
          <path d="M0 0H24L0 24Z" />
        </clipPath>
      </defs>
      <g {...colour(a)}>{ring(8.6, 15.4)}</g>
      <g {...colour(b)}>{ring(15.4, 8.6)}</g>
      <g {...colour(a)} clipPath={`url(#${clip})`}>
        {ring(8.6, 15.4)}
      </g>
    </>
  );
}

/* A rounded panel behind a shield; the shield's overlap with the panel is
   the darkest tone, and a tick is cut into the shield in white. */
function ProveMark({ tone, uid }: { tone: Tone; uid: string }) {
  const [back, front, overlap] = fills("prove", tone);
  const clip = `prove-clip-${uid}`;
  const panel =
    "M5.5 2.5h7a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-7a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3Z";
  const shield =
    "M15 8.2 21.5 10.7v4.7c0 3.6-2.6 6.3-6.5 7.8-3.9-1.5-6.5-4.2-6.5-7.8v-4.7Z";
  return (
    <>
      <defs>
        <clipPath id={clip}>
          <path d={panel} />
        </clipPath>
      </defs>
      <path d={panel} {...back} />
      <path d={shield} {...front} />
      <path d={shield} {...overlap} clipPath={`url(#${clip})`} />
      <path
        d="M12.2 15.4 14.2 17.4 17.9 13.6"
        fill="none"
        stroke="#fff"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

/* A pie: the whole in the light tone, two slices in the darker two. */
function CarbonCostMark({ tone }: { tone: Tone }) {
  const [back, front, overlap] = fills("carbonCost", tone);
  return (
    <>
      <circle cx="12" cy="12" r="9" {...back} />
      <path d="M12 12V3a9 9 0 0 1 6.89 14.79Z" {...front} />
      <path d="M12 12l6.89 5.79A9 9 0 0 1 8.92 20.46Z" {...overlap} />
    </>
  );
}

/* Three nodes and the links between them. */
function SupplyChainMark({ tone }: { tone: Tone }) {
  const [back, front, overlap] = fills("supplyChain", tone);
  return (
    <>
      <path
        d="M12 5.5 5.5 17.5H18.5Z"
        fill="none"
        stroke={back.fill}
        strokeOpacity={back.fillOpacity}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      <circle cx="5.5" cy="17.5" r="3.3" {...front} />
      <circle cx="18.5" cy="17.5" r="3.3" {...front} />
      <circle cx="12" cy="5.5" r="3.3" {...overlap} />
    </>
  );
}

/* A lens with a tick inside it, and its handle: search, and what you find is
   verified. */
function TraceMark({ tone }: { tone: Tone }) {
  const [back, front, overlap] = fills("trace", tone);
  return (
    <>
      <circle cx="10" cy="10" r="7" {...back} />
      <circle
        cx="10"
        cy="10"
        r="7"
        fill="none"
        stroke={front.fill}
        strokeOpacity={front.fillOpacity}
        strokeWidth={2.4}
      />
      <path
        d="M15.4 15.4 20.6 20.6"
        stroke={overlap.fill}
        strokeOpacity={overlap.fillOpacity}
        strokeWidth={3.2}
        strokeLinecap="round"
      />
      <path
        d="M6.9 10.2 9.1 12.4 13.2 8.1"
        fill="none"
        stroke={overlap.fill}
        strokeOpacity={overlap.fillOpacity}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

/* Three bars, each shorter and darker than the last. */
function ReduceMark({ tone }: { tone: Tone }) {
  const [back, front, overlap] = fills("reduce", tone);
  return (
    <>
      <rect x="2.5" y="3.5" width="5.6" height="17" rx="1.8" {...back} />
      <rect x="9.2" y="9" width="5.6" height="11.5" rx="1.8" {...front} />
      <rect x="15.9" y="14" width="5.6" height="6.5" rx="1.8" {...overlap} />
    </>
  );
}

/* Two circles; where they overlap is the match. */
function ConnectMark({ tone, uid }: { tone: Tone; uid: string }) {
  const [back, front, overlap] = fills("connect", tone);
  const clip = `connect-clip-${uid}`;
  return (
    <>
      <defs>
        <clipPath id={clip}>
          <circle cx="8.8" cy="12" r="6.6" />
        </clipPath>
      </defs>
      <circle cx="8.8" cy="12" r="6.6" {...back} />
      <circle cx="15.2" cy="12" r="6.6" {...front} />
      <circle
        cx="15.2"
        cy="12"
        r="6.6"
        {...overlap}
        clipPath={`url(#${clip})`}
      />
    </>
  );
}

/* Two arrows passing each other: something offered, something taken. */
function MarketMark({ tone }: { tone: Tone }) {
  const [, front, overlap] = fills("market", tone);
  const arrow = (d: string, f: Fill) => (
    <path
      d={d}
      fill={f.fill}
      fillOpacity={f.fillOpacity}
      stroke={f.fill}
      strokeOpacity={f.fillOpacity}
      strokeWidth={1.2}
      strokeLinejoin="round"
    />
  );
  return (
    <>
      {arrow("M3.5 6.6h11V3.8l6 4.4-6 4.4V9.8h-11Z", front)}
      {arrow("M20.5 14.2h-11v-2.8l-6 4.4 6 4.4v-2.8h11Z", overlap)}
    </>
  );
}

export function ProductMark({
  product,
  className = "h-5 w-5",
  tone = "brand",
}: Props) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");

  if (product === "cera") {
    /* Cera's mark is taller than it is wide; centre it in the same square
       box the others use so a row of marks lines up. */
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 ${className}`}
        aria-hidden="true"
      >
        <CeraMark tone={tone} className="h-[88%] w-auto" />
      </span>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {product === "dashboard" && <DashboardMark tone={tone} />}
      {product === "workspace" && <WorkspaceMark tone={tone} />}
      {product === "convert" && <ConvertMark tone={tone} uid={uid} />}
      {product === "smartlink" && <SmartLinkMark tone={tone} uid={uid} />}
      {product === "carbonCost" && <CarbonCostMark tone={tone} />}
      {product === "supplyChain" && <SupplyChainMark tone={tone} />}
      {product === "prove" && <ProveMark tone={tone} uid={uid} />}
      {product === "trace" && <TraceMark tone={tone} />}
      {product === "reduce" && <ReduceMark tone={tone} />}
      {product === "connect" && <ConnectMark tone={tone} uid={uid} />}
      {product === "market" && <MarketMark tone={tone} />}
    </svg>
  );
}
