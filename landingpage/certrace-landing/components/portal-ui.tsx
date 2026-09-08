"use client";

/* ════════════════════════════════════════════════════════════
   THE PRODUCT, DRAWN — miniature reproductions of the exporter portal

   WHY DRAWN RATHER THAN SCREENSHOT. These sit in the six-feature stack and
   the four-step panel, where each one is 300–560px wide inside a section that
   already has its own type stack. A screenshot at that size is illegible, goes
   stale the moment the portal moves, and cannot follow the site's language
   switch. Redrawing the screens from the portal's own tokens keeps them crisp,
   keeps them in the reader's language, and keeps them honest — every label
   below is a real string from the portal, not marketing copy about it.

   FIDELITY RULES, kept deliberately tight:
     · the chrome is the portal's chrome — sidebar, eyebrow, light headline
     · the tokens are the portal's tokens — bone #F5F4F0, white cards on
       black/[0.07], rounded-2xl, and the five status colours below
     · the words are the portal's words, taken from its source
     · nothing shows a number the product could not produce

   The frame is a window, not a phone: the reader is being shown a desktop
   tool, and cropping it to a card would sell it as a widget.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";

/* The portal's status grammar, from components/ui.tsx in the portal itself. */
export const TONE: Record<string, string> = {
  ok: "#4ade80",
  info: "#60a5fa",
  warn: "#facc15",
  err: "#f87171",
  muted: "#c7c5be",
};
const TONE_TEXT: Record<string, string> = {
  ok: "#16a34a",
  info: "#2563eb",
  warn: "#b45309",
  err: "#dc2626",
  muted: "rgba(0,0,0,0.4)",
};

const PIXEL = { fontFamily: "var(--font-pixel), monospace" } as const;
const PLEX = { fontFamily: "var(--font-ibm-plex-sans), sans-serif" } as const;

/* ── The window ─────────────────────────────────────────────
   `dense` drops the sidebar: the six-feature panels are half-width and the
   sidebar eats a third of them, so those show the content pane only. The
   four-step panels are wide enough to carry the whole application. */
export function PortalFrame({
  children,
  sidebar = true,
  active,
  className = "",
}: {
  children: React.ReactNode;
  sidebar?: boolean;
  active?: string;
  className?: string;
}) {
  return (
    <div
      className={`w-full overflow-hidden rounded-xl border border-black/[0.09] bg-[#F5F4F0] shadow-[0_10px_30px_rgba(0,0,0,0.07)] ${className}`}
    >
      {/* Title bar. Three dots and an address — the smallest signal that this
          is an application and not an illustration. */}
      <div className="flex items-center gap-1.5 border-b border-black/[0.06] bg-white/70 px-2.5 py-[7px]">
        <span className="h-[5px] w-[5px] rounded-full bg-black/15" />
        <span className="h-[5px] w-[5px] rounded-full bg-black/15" />
        <span className="h-[5px] w-[5px] rounded-full bg-black/15" />
        <span className="ml-2 truncate text-[7px] tracking-[0.1em] text-black/25" style={PIXEL}>
          portal.certrace.co
        </span>
      </div>

      <div className="flex">
        {sidebar && <PortalSidebar active={active} />}
        <div className="min-w-0 flex-1 p-3.5">{children}</div>
      </div>
    </div>
  );
}

const NAV = [
  "Dashboard",
  "Verification",
  "Smart Links",
  "Reports",
  "Carbon & Cost",
  "Team & seats",
  "Settings",
];

function PortalSidebar({ active }: { active?: string }) {
  return (
    <div className="hidden w-[104px] shrink-0 border-r border-black/[0.06] bg-white/50 px-2 py-3 sm:block">
      <div className="mb-3 px-1.5 text-[7px] tracking-[0.22em] text-black/45" style={PIXEL}>
        CERTRACE
      </div>
      <div className="space-y-[3px]">
        {NAV.map((item) => (
          <div
            key={item}
            className={`truncate rounded-md px-1.5 py-[5px] text-[7.5px] leading-none ${
              item === active ? "bg-black/[0.06] text-black/70" : "text-black/35"
            }`}
          >
            {item}
          </div>
        ))}
      </div>
      {/* The trial meter is on every screen of the real portal, so it is on
          every screen of this one. */}
      <div className="mt-3 rounded-md border border-black/[0.06] px-1.5 py-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[6px] tracking-[0.14em] text-black/30" style={PIXEL}>
            FREE TRIAL
          </span>
          <span className="text-[6px] text-emerald-700" style={PIXEL}>
            26d
          </span>
        </div>
        <div className="mt-1 h-[2px] overflow-hidden rounded-full bg-black/[0.07]">
          <div className="h-full w-[86%] rounded-full bg-emerald-600/60" />
        </div>
      </div>
    </div>
  );
}

/* ── Page header ────────────────────────────────────────────
   The portal's own pattern: pixel eyebrow, a light Plex headline, and — when
   the screen has one — a primary action on the right. */
export function PortalHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: string;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[7px] tracking-[0.2em] text-black/35" style={PIXEL}>
          {eyebrow}
        </div>
        <div
          className="mt-1 truncate text-[13px] font-light leading-tight tracking-tight text-[#111]"
          style={PLEX}
        >
          {title}
        </div>
      </div>
      {action && (
        <div
          className="shrink-0 rounded-md bg-[#111] px-2 py-1 text-[6.5px] tracking-[0.12em] text-white"
          style={PIXEL}
        >
          {action}
        </div>
      )}
    </div>
  );
}

export function StatusDot({ tone = "muted" }: { tone?: keyof typeof TONE | string }) {
  return (
    <span
      aria-hidden
      className="inline-block h-[5px] w-[5px] shrink-0 rounded-full"
      style={{ background: TONE[tone] ?? TONE.muted }}
    />
  );
}

/* ── Tiles ──────────────────────────────────────────────────
   The dashboard band: a big light numeral over two small caption lines. */
export function TileRow({
  tiles,
}: {
  tiles: { value: string; label: string; sub?: string; tone?: string }[];
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-lg border border-black/[0.07] bg-white p-2">
          <div
            className="text-[15px] font-light leading-none tracking-tight"
            style={{ ...PLEX, color: t.tone ? TONE_TEXT[t.tone] : "#111" }}
          >
            {t.value}
          </div>
          <div className="mt-1 text-[6.5px] uppercase leading-tight tracking-[0.1em] text-black/45">
            {t.label}
          </div>
          {t.sub && <div className="mt-0.5 text-[6.5px] leading-tight text-black/30">{t.sub}</div>}
        </div>
      ))}
    </div>
  );
}

/* ── Filter chips ───────────────────────────────────────────
   The Smart Links page's status filter, and the same control on Suppliers. */
export function Chips({ items, active = 0 }: { items: string[]; active?: number }) {
  return (
    <div className="mb-2 flex flex-wrap gap-1">
      {items.map((label, i) => (
        <span
          key={label}
          className={`rounded-full border px-1.5 py-[3px] text-[6.5px] leading-none ${
            i === active
              ? "border-transparent bg-[#111] text-white"
              : "border-black/10 text-black/45"
          }`}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

/* ── A table, the portal's ────────────────────────────────── */
export function Rows({
  head,
  rows,
}: {
  head?: string[];
  rows: { cells: React.ReactNode[]; tone?: string }[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-black/[0.07] bg-white">
      {head && (
        <div className="flex items-center gap-2 border-b border-black/[0.06] bg-black/[0.02] px-2 py-[5px]">
          {head.map((h, i) => (
            <span
              key={h}
              className={`truncate text-[6px] uppercase tracking-[0.12em] text-black/30 ${
                i === 0 ? "flex-1" : "w-[64px] shrink-0 text-right"
              }`}
              style={PIXEL}
            >
              {h}
            </span>
          ))}
        </div>
      )}
      {rows.map((r, i) => (
        <div
          key={i}
          className={`flex items-center gap-2 px-2 py-[6px] text-[7.5px] ${
            i < rows.length - 1 ? "border-b border-black/[0.04]" : ""
          }`}
        >
          {r.cells.map((c, j) => (
            <span
              key={j}
              className={`truncate ${
                j === 0 ? "flex-1 text-black/60" : "w-[64px] shrink-0 text-right text-black/40"
              }`}
            >
              {c}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── A labelled bar, used by readiness and the benchmark ──── */
export function Bar({
  label,
  value,
  pct,
  tone = "ok",
}: {
  label: string;
  value: string;
  pct: number;
  tone?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-[7.5px] text-black/55">{label}</span>
        <span className="shrink-0 text-[7.5px]" style={{ color: TONE_TEXT[tone] }}>
          {value}
        </span>
      </div>
      <div className="mt-[3px] h-[3px] overflow-hidden rounded-full bg-black/[0.06]">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: TONE[tone], opacity: 0.75 }}
        />
      </div>
    </div>
  );
}

/* ── A key/value line, used everywhere in the portal ──────── */
export function Line({
  label,
  value,
  tone,
  dot,
}: {
  label: string;
  value: string;
  tone?: string;
  dot?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-[3px]">
      <span className="flex min-w-0 items-center gap-1.5">
        {dot && <StatusDot tone={dot} />}
        <span className="truncate text-[7.5px] text-black/55">{label}</span>
      </span>
      <span
        className="shrink-0 text-[7.5px] tabular-nums"
        style={{ color: tone ? TONE_TEXT[tone] : "rgba(0,0,0,0.45)" }}
      >
        {value}
      </span>
    </div>
  );
}

/* ── A white card, the portal's container ─────────────────── */
export function Panel({
  title,
  action,
  children,
}: {
  title?: string;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-black/[0.07] bg-white p-2.5">
      {title && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="truncate text-[8px] font-light text-[#111]" style={PLEX}>
            {title}
          </span>
          {action && (
            <span className="shrink-0 text-[6px] tracking-[0.12em] text-black/30" style={PIXEL}>
              {action}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

/* ── The wizard's stepper, from workspaces/new ─────────────── */
export function Stepper({ steps, at }: { steps: string[]; at: number }) {
  return (
    <div className="mb-2.5">
      <div className="mb-1 text-[6px] tracking-[0.16em] text-black/30" style={PIXEL}>
        STEP {at + 1} OF {steps.length}
      </div>
      <div className="flex gap-1">
        {steps.map((s, i) => (
          <div key={s} className="flex-1">
            <div
              className="h-[2px] rounded-full"
              style={{ background: i <= at ? "#111" : "rgba(0,0,0,0.08)" }}
            />
            <div
              className={`mt-1 truncate text-[6px] uppercase tracking-[0.1em] ${
                i === at ? "text-black/60" : "text-black/25"
              }`}
              style={PIXEL}
            >
              {s}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── A note strip, the portal's inline advisory ───────────── */
export function Note({ children, tone = "info" }: { children: React.ReactNode; tone?: string }) {
  const bg =
    tone === "err"
      ? "rgba(248,113,113,0.08)"
      : tone === "ok"
        ? "rgba(74,222,128,0.10)"
        : tone === "warn"
          ? "rgba(250,204,21,0.12)"
          : "rgba(96,165,250,0.10)";
  return (
    <div
      className="rounded-md px-2 py-1.5 text-[7px] leading-relaxed"
      style={{ background: bg, color: TONE_TEXT[tone] }}
    >
      {children}
    </div>
  );
}
