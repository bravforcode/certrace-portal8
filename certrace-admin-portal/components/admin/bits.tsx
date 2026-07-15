"use client";

import * as React from "react";
import { cn, StatusDot, type Tone } from "@/components/ui";
import type { AccessLevel } from "@/lib/admin-data";

/* ── Table primitives (mono data surfaces) ────────────────── */

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] border-collapse text-left">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn("border-b border-black/[0.07] px-4 py-3 font-pixel text-[10px] font-normal uppercase tracking-[0.16em] text-black/35", className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("border-b border-black/[0.05] px-4 py-3 text-[13px] text-black/70", className)}>{children}</td>;
}

/* ── Status vocabulary shared across modules ──────────────── */

export const STATUS_TONE: Record<string, Tone> = {
  // declarations
  collecting: "info",
  "in-review": "warn",
  approved: "ok",
  "draft-preview": "muted",
  // queue
  open: "err",
  assigned: "warn",
  resolved: "ok",
  // drafts
  draft: "muted",
  "awaiting-approval": "warn",
  published: "ok",
  rejected: "err",
  // tickets
  pending: "info",
  escalated: "err",
  // invoices
  paid: "ok",
  due: "info",
  overdue: "err",
  // misc
  active: "ok",
  invited: "info",
  deactivated: "muted",
  ok: "ok",
  warn: "warn",
};

export function StatusChip({ value, label }: { value: string; label?: string }) {
  const tone = STATUS_TONE[value] ?? "muted";
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <StatusDot tone={tone} />
      <span className="font-mono text-[11px] tracking-wide text-black/55">{label ?? value.replace(/-/g, " ")}</span>
    </span>
  );
}

/* ── Access-level badge (permission matrix) ───────────────── */

const LEVEL_STYLE: Record<AccessLevel, string> = {
  admin: "bg-[#111] text-white",
  act: "bg-black/[0.08] text-black/70",
  view: "bg-black/[0.03] text-black/45 border border-black/10",
  none: "text-black/20",
};

export function LevelBadge({ level }: { level: AccessLevel }) {
  if (level === "none") return <span className="text-black/20">—</span>;
  return (
    <span className={cn("inline-block rounded-md px-2 py-0.5 font-pixel text-[10px] uppercase tracking-[0.12em]", LEVEL_STYLE[level])}>
      {level}
    </span>
  );
}

/* ── Health bar ───────────────────────────────────────────── */

export function HealthBar({ value }: { value: number }) {
  const tone = value >= 75 ? "#4ade80" : value >= 55 ? "#facc15" : "#f87171";
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-[3px] w-16 overflow-hidden rounded-full bg-black/[0.07]">
        <span className="block h-full rounded-full" style={{ width: `${value}%`, background: tone }} />
      </span>
      <span className="font-mono text-[11px] text-black/45">{value}</span>
    </span>
  );
}

/* ── Section card header ──────────────────────────────────── */

export function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
      <h2 className="font-pixel text-[11px] uppercase tracking-[0.18em] text-black/40">{children}</h2>
      {aside}
    </div>
  );
}

/* ── Filter chips row ─────────────────────────────────────── */

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full border px-3 py-1.5 font-pixel text-[10px] uppercase tracking-[0.14em] transition-colors",
            value === o.value
              ? "border-transparent bg-[#111] text-white"
              : "border-black/10 bg-white text-black/45 hover:border-black/25 hover:text-black",
          )}
        >
          {o.label}
          {o.count !== undefined && <span className="ml-1.5 opacity-60">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ── Mini bar chart (dashboard/reports) ───────────────────── */

export function MiniBars({ data, format }: { data: { month: string; value: number }[]; format?: (v: number) => string }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-3">
      {data.map((d) => (
        <div key={d.month} className="flex flex-col items-center gap-1.5">
          <span className="font-mono text-[10px] text-black/35">{format ? format(d.value) : d.value}</span>
          <div className="w-9 rounded-t-md bg-[#111]/80" style={{ height: `${Math.max(6, (d.value / max) * 88)}px` }} />
          <span className="font-pixel text-[10px] uppercase tracking-[0.1em] text-black/35">{d.month}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Key/value row ────────────────────────────────────────── */

export function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-black/[0.05] py-2.5 last:border-b-0">
      <span className="text-[11px] uppercase tracking-[0.1em] text-black/40">{k}</span>
      <span className="text-right text-[13px] text-black/70">{v}</span>
    </div>
  );
}
