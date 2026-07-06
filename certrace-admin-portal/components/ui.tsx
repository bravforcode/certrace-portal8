import * as React from "react";
import { Check } from "lucide-react";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ── Status grammar ─────────────────────────────────────── */
export type Tone = "ok" | "info" | "warn" | "err" | "muted";

const dotColor: Record<Tone, string> = {
  ok: "#4ade80",
  info: "#60a5fa",
  warn: "#facc15",
  err: "#f87171",
  muted: "#c7c5be",
};
const toneText: Record<Tone, string> = {
  ok: "text-[#16a34a]",
  info: "text-[#2563eb]",
  warn: "text-[#b45309]",
  err: "text-[#dc2626]",
  muted: "text-black/40",
};

export function StatusDot({ tone = "muted", pulse, glow, className }: { tone?: Tone; pulse?: boolean; glow?: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block h-[6px] w-[6px] flex-none rounded-full", pulse && "ct-pulse", className)}
      style={{ background: dotColor[tone], boxShadow: glow ? `0 0 6px ${dotColor[tone]}` : undefined }}
    />
  );
}

/* ── Card ───────────────────────────────────────────────── */
export function Card({
  children,
  className,
  highlight,
  warm,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  highlight?: boolean;
  warm?: boolean;
  as?: React.ElementType;
}) {
  return (
    <Tag
      className={cn(
        "rounded-2xl border bg-white",
        highlight && "border-black/20 !bg-[#f0eee8]",
        warm && "!bg-[#faf9f7]",
        !highlight && "border-black/[0.07]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/* ── Buttons ────────────────────────────────────────────── */
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "sm";
};
export function Button({ variant = "primary", size = "md", className, children, ...props }: BtnProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl uppercase tracking-[0.1em] transition-colors disabled:opacity-40 disabled:pointer-events-none";
  const sizing = size === "sm" ? "px-4 py-2 text-[11px]" : "px-6 py-3 text-[13px]";
  const variants = {
    primary: "bg-[#111] text-white hover:bg-[#333]",
    secondary: "border border-black/10 text-black/60 hover:border-black/25 hover:text-black hover:bg-black/[0.04]",
    ghost: "text-black/45 hover:text-black",
  };
  return (
    <button className={cn(base, sizing, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

/* ── Save button state machine ─────────────────────────────
   Shared "Save changes → Saving… → Saved → Save changes" cycle used across
   every settings form, so the feedback pattern reads the same everywhere. */
export type SaveState = "idle" | "saving" | "saved";

export function useSaveState(holdSavedMs = 1600) {
  const [state, setState] = React.useState<SaveState>("idle");
  const run = React.useCallback(
    (action?: () => void, delayMs = 700) => {
      if (state === "saving") return;
      setState("saving");
      window.setTimeout(() => {
        action?.();
        setState("saved");
        window.setTimeout(() => setState("idle"), holdSavedMs);
      }, delayMs);
    },
    [state, holdSavedMs],
  );
  return { state, run };
}

export function SaveButton({
  state,
  idleLabel = "Save changes",
  savingLabel = "Saving…",
  savedLabel = "Saved",
  icon,
  className,
  variant = "primary",
  disabled,
  ...props
}: {
  state: SaveState;
  idleLabel?: string;
  savingLabel?: string;
  savedLabel?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
} & Omit<BtnProps, "children" | "disabled">) {
  // The primary button is dark-filled (needs a light spinner); secondary/ghost
  // are light (needs a dark one) — otherwise the spinner is invisible on one of them.
  const spinnerClass = variant === "primary" ? "border-white/25 border-t-white/80" : "border-black/15 border-t-black/50";
  return (
    <Button size="sm" variant={variant} disabled={state === "saving" || disabled} className={className} {...props}>
      {state === "saving" ? (
        <span className={cn("h-3.5 w-3.5 animate-spin rounded-full border-2", spinnerClass)} aria-hidden />
      ) : state === "saved" ? (
        <Check size={13} strokeWidth={1.5} />
      ) : (
        icon
      )}
      {state === "saving" ? savingLabel : state === "saved" ? savedLabel : idleLabel}
    </Button>
  );
}

/* ── Eyebrow / labels ───────────────────────────────────── */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("font-pixel text-[11px] uppercase tracking-[0.18em] text-black/40", className)}>{children}</span>
  );
}

export function TagBadge({ children, tone }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-3 py-1 font-pixel text-[11px] uppercase tracking-[0.16em] text-black/40">
      {tone && <StatusDot tone={tone} pulse={tone === "ok"} />}
      {children}
    </span>
  );
}

/* ── Chip ───────────────────────────────────────────────── */
export function Chip({
  children,
  tone = "muted",
  pulse,
}: {
  children: React.ReactNode;
  tone?: Tone;
  pulse?: boolean;
}) {
  const live = tone === "ok";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em]",
        live ? "border-[rgba(5,150,105,0.18)] bg-[#ecfdf5] text-[#047857]" : "border-black/10 bg-black/[0.03] text-black/45",
      )}
    >
      <StatusDot tone={tone} pulse={pulse ?? live} glow={live} />
      {children}
    </span>
  );
}

/* ── Status label (dot + lowercase mono) ────────────────── */
export function StatusLabel({ tone, label, pulse, glow }: { tone: Tone; label: string; pulse?: boolean; glow?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <StatusDot tone={tone} pulse={pulse} glow={glow} />
      <span className={cn("font-mono text-[11px] tracking-wide", toneText[tone])}>{label}</span>
    </span>
  );
}

/* ── Progress bar ───────────────────────────────────────── */
export function Progress({ value, tone = "ok" }: { value: number; tone?: Tone }) {
  return (
    <div className="h-[3px] w-full overflow-hidden rounded-full bg-black/[0.07]">
      <div
        className="h-full rounded-full transition-[width] duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: value >= 100 ? "#10b981" : dotColor[tone], ...(tone !== "ok" && value < 100 ? { background: dotColor[tone] } : {}) }}
      />
    </div>
  );
}

/* ── Stat numeral ───────────────────────────────────────── */
export function Stat({ value, label, sub }: { value: React.ReactNode; label: string; sub?: string }) {
  return (
    <div>
      <div className="font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111] sm:text-4xl">
        {value}
      </div>
      <div className="mt-2 text-[11px] uppercase tracking-[0.1em] text-black/40">{label}</div>
      {sub && <div className="mt-1 text-xs text-black/35">{sub}</div>}
    </div>
  );
}

/* ── Form field ─────────────────────────────────────────── */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] uppercase tracking-[0.1em] text-black/55">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-black/35">{hint}</span>}
    </label>
  );
}

/* ── Switch (toggle) ────────────────────────────────────── */
export function Switch({
  checked,
  onChange,
  disabled,
  ariaLabel,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative inline-flex h-6 w-10 flex-none items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "border-transparent bg-[#111]" : "border-black/15 bg-black/[0.06]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block h-4 w-4 flex-none translate-x-1 rounded-full bg-white shadow-sm transition-transform",
          checked && "translate-x-[18px]",
        )}
      />
    </button>
  );
}

export const inputClass =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black/70 placeholder:text-black/25 focus:border-black/25 focus:outline-none transition-colors";

/* ── Empty state ────────────────────────────────────────── */
export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 px-6 py-14 text-center">
      {icon && <div className="mb-4 text-black/30">{icon}</div>}
      <div className="text-base font-light text-black/70">{title}</div>
      {body && <p className="mt-2 max-w-md text-sm text-black/45">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ── Page header (dashboard rhythm) ─────────────────────── */
export function PageHeader({
  eyebrow,
  title,
  lead,
  actions,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-black/[0.06] pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="mt-2 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111] md:text-4xl">
          {title}
        </h1>
        {lead && <p className="mt-3 max-w-xl text-sm leading-relaxed text-black/45">{lead}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
