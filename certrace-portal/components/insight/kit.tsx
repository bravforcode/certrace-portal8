"use client";

/* ════════════════════════════════════════════════════════════
   INSIGHT KIT — the few pieces the analysis pages share, in the portal's own look

   Dashboard, Carbon & Cost and Supply Chain are all "read the state of things
   at a glance, then drill in": a row of figures, a table you can triage, a ring
   and some bars. The reference dashboards decide WHAT is drawn and WHERE; how
   it looks is Certrace's, and nothing here is borrowed from them:

     figures     IBM Plex Sans Light, large, tone carried by the text colour
                 alone (#111 · #047857 · #b45309 · #dc2626) — as the existing tiles
     cards       white, rounded-2xl, a 7 % black hairline, on the warm canvas
     headings    Plex Light, tracking-tight; captions in 11px tracked capitals
     tables      Courier-pixel capitals for the head, hairline rows, #fafaf8 hover
     controls    the FilterChip, Chip, Progress and Pager already in the portal
     palette     ink · #3C7ACB · #047857 · #b45309 · #dc2626, never a gradient

   Colour is never the only carrier of meaning: a figure has its number, a chip
   its word, a bar its value beside it.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, FilterChip, cn, type Tone } from "@/components/ui";
import { Select } from "@/components/controls";
import { useT } from "@/lib/i18n";

/* ── Tones: the same values as Progress / StatusDot in ui.tsx ─── */
export const TONE_HEX: Record<Tone, string> = {
  ok: "#10b981",
  info: "#60a5fa",
  warn: "#facc15",
  err: "#f87171",
  muted: "#c7c5be",
};

/** Text colour for a figure — the same four the dashboard tiles use. */
export const TONE_TEXT: Record<Tone, string> = {
  ok: "text-[#047857]",
  info: "text-[#1d4ed8]",
  warn: "text-[#b45309]",
  err: "text-[#dc2626]",
  muted: "text-[#111]",
};

/** Head of a table column: Courier-pixel capitals, as every table in the portal. */
export const TH = "font-pixel text-[10px] uppercase tracking-[0.14em] text-black/35";

/* ── The figure tile ───────────────────────────────────────────
   Number first, then what it is, then what it is measured against — the shape of
   the dashboard's own tiles. `lines` adds the reference's three-row footer
   (label · value, hairline between) where a tile has more to say. `bars` is the
   little run of thin bars in the corner: a direction, not a value. */
export type TileLine = { label: string; value: React.ReactNode; tone?: Tone };

export function StatTile({
  value,
  unit,
  label,
  sub,
  tone = "muted",
  chip,
  bars,
  lines,
  onClick,
  active,
  dark,
  className,
}: {
  value: React.ReactNode;
  unit?: string;
  label: string;
  sub?: React.ReactNode;
  tone?: Tone;
  chip?: React.ReactNode;
  bars?: React.ReactNode;
  lines?: TileLine[];
  onClick?: () => void;
  active?: boolean;
  /** the one figure the page is about, on ink */
  dark?: boolean;
  className?: string;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                "truncate font-[family-name:var(--font-plex)] text-[26px] font-light leading-none tracking-tight tabular-nums sm:text-[30px]",
                dark ? "text-white" : TONE_TEXT[tone],
              )}
            >
              {value}
            </span>
            {unit && <span className={cn("flex-none text-[13px]", dark ? "text-white/50" : "text-black/40")}>{unit}</span>}
          </div>
        </div>
        {bars}
      </div>
      <div className={cn("mt-2.5 text-[13px] leading-snug", dark ? "text-white/80" : "text-black/75")}>{label}</div>
      {sub && <div className={cn("mt-0.5 text-[11.5px] leading-snug", dark ? "text-white/45" : "text-black/45")}>{sub}</div>}
      {chip && <div className="mt-2.5">{chip}</div>}
      {lines && lines.length > 0 && (
        <dl className={cn("mt-3 divide-y", dark ? "divide-white/10" : "divide-black/[0.06]")}>
          {lines.map((l) => (
            <div key={l.label} className="flex items-center justify-between gap-3 py-1.5 text-[12px]">
              <dt className={cn("min-w-0 truncate", dark ? "text-white/45" : "text-black/45")}>{l.label}</dt>
              <dd className={cn("flex-none tabular-nums", l.tone ? TONE_TEXT[l.tone] : dark ? "text-white/85" : "text-black/80")}>{l.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </>
  );
  const cls = cn(
    "block h-full w-full min-w-0 rounded-2xl border p-4 text-left sm:p-[18px]",
    dark ? "border-[#111] bg-[#111]" : "border-black/[0.07] bg-white",
    onClick && !dark && "transition-colors hover:border-black/15 hover:bg-[#fafaf8]",
    active && !dark && "!border-black/40",
    className,
  );
  return onClick ? (
    <button type="button" onClick={onClick} aria-pressed={active} className={cls}>
      {inner}
    </button>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/** A run of thin bars in the corner of a tile — the last one full ink, the rest fading. */
export function MiniBars({ values, dark, className }: { values: number[]; dark?: boolean; className?: string }) {
  const shown = values.slice(-8);
  const max = Math.max(...shown, 0);
  return (
    <span aria-hidden className={cn("flex h-9 flex-none items-end gap-[3px]", className)}>
      {shown.map((v, i) => {
        const last = i === shown.length - 1;
        const h = max > 0 ? Math.max(14, (v / max) * 100) : 14;
        return <span key={i} className="w-[3px] rounded-full" style={{ height: `${h}%`, background: dark ? "#fff" : "#111", opacity: last ? 1 : 0.14 + (i / shown.length) * 0.3 }} />;
      })}
    </span>
  );
}

/* ── A panel ───────────────────────────────────────────────────
   Heading in Plex Light, a caption in tracked capitals at the right, a quiet line
   under it — the cost-avoidance widget's own head. */
export function Panel({
  title,
  sub,
  caption,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  sub?: string;
  caption?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Card className={cn("min-w-0 overflow-hidden", className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 pt-4 sm:px-5 sm:pt-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="font-[family-name:var(--font-plex)] text-[16px] font-light tracking-tight text-[#111]">{title}</h2>
            {caption && <span className="text-[11px] uppercase tracking-[0.08em] text-black/35">{caption}</span>}
          </div>
          {sub && <p className="mt-0.5 text-[12px] leading-snug text-black/45">{sub}</p>}
        </div>
        {action}
      </div>
      <div className={cn("px-4 pb-4 pt-3 sm:px-5 sm:pb-5", bodyClassName)}>{children}</div>
    </Card>
  );
}

/** A small set of exclusive choices, drawn as the portal's own filter chips. */
export function Segmented<T extends string>({ value, onChange, options, ariaLabel }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; ariaLabel: string }) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap items-center gap-1.5">
      {options.map((o) => (
        <FilterChip key={o.value} active={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </FilterChip>
      ))}
    </div>
  );
}

/** A thin bar beside its number, the Progress bar of ui.tsx with its figure. `value` is 0–100. */
export function ScoreBar({ value, tone, className, width = 72 }: { value: number | null; tone: Tone; className?: string; width?: number }) {
  const v = value == null || !Number.isFinite(value) ? 0 : Math.min(100, Math.max(0, value));
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="h-[3px] flex-none overflow-hidden rounded-full bg-black/[0.07]" style={{ width }} aria-hidden>
        <span className="block h-full rounded-full" style={{ width: `${v}%`, background: TONE_HEX[tone] }} />
      </span>
      <span className="w-7 font-mono text-[11.5px] tabular-nums text-black/55">{value == null ? "—" : Math.round(v)}</span>
    </span>
  );
}

/* ── Pager: the portal's own, with an entries-per-page choice ──── */
export const PAGE_SIZES = [6, 10, 20, 50];

/** Rows to show for a page, and the page clamped into range. */
export function paginate<T>(rows: T[], page: number, size: number): { rows: T[]; page: number; pageCount: number } {
  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  const p = Math.min(Math.max(1, page), pageCount);
  return { rows: rows.slice((p - 1) * size, p * size), page: p, pageCount };
}

export function TablePager({
  page,
  pageCount,
  size,
  onPage,
  onSize,
  total,
}: {
  page: number;
  pageCount: number;
  size: number;
  onPage: (p: number) => void;
  onSize: (n: number) => void;
  total: number;
}) {
  const t = useT();
  const pages: (number | "gap")[] = [];
  for (let i = 1; i <= pageCount; i += 1) {
    if (i === 1 || i === pageCount || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== "gap") pages.push("gap");
  }
  const btn = "grid h-8 min-w-8 place-items-center rounded-lg px-2 text-[12.5px] transition-colors";
  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] px-4 py-3 sm:px-5" aria-label={t("Pagination")}>
      <div className="flex items-center gap-3 text-[12.5px] text-black/45">
        <div className="w-[88px]">
          <Select
            value={String(size)}
            onChange={(v) => onSize(Number(v))}
            options={PAGE_SIZES.map((n) => ({ value: String(n), label: String(n), hint: undefined }))}
            ariaLabel={t("Entries per page")}
          />
        </div>
        <span>{t("entries per page")}</span>
        <span className="hidden font-mono text-[11px] text-black/35 sm:inline">· {total}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page === 1}
          aria-label={t("Previous page")}
          className={cn(btn, "text-black/45 hover:bg-black/[0.05] hover:text-black disabled:pointer-events-none disabled:text-black/15")}
        >
          <ChevronLeft size={15} strokeWidth={1.5} />
        </button>
        {pages.map((p, i) =>
          p === "gap" ? (
            <span key={`g${i}`} className="px-1 text-[12.5px] text-black/25">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(btn, p === page ? "bg-[#111] text-white" : "text-black/50 hover:bg-black/[0.05] hover:text-black")}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPage(Math.min(pageCount, page + 1))}
          disabled={page === pageCount}
          aria-label={t("Next page")}
          className={cn(btn, "text-black/45 hover:bg-black/[0.05] hover:text-black disabled:pointer-events-none disabled:text-black/15")}
        >
          <ChevronRight size={15} strokeWidth={1.5} />
        </button>
      </div>
    </nav>
  );
}

/** A search box in the portal's input shape (rounded-xl, hairline), with the icon inside. */
export function SearchPill({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  return (
    <label className={cn("flex h-10 min-w-0 items-center gap-2.5 rounded-xl border border-black/10 bg-white px-3.5 text-[13px] text-black/70 transition-colors focus-within:border-black/25", className)}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden className="flex-none text-black/30">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-black/25" />
    </label>
  );
}
