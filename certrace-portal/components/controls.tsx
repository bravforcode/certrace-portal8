"use client";

/* Design-system form controls — Select, MultiSelect, Dropdown, Calendar,
   DatePicker. These replace the browser-native <select> and <input type=date>
   so the experience is pixel-identical on Windows, macOS, iOS and Android.

   Every popover renders through a PORTAL with fixed positioning anchored to its
   trigger. That keeps menus, calendars and dropdowns above sticky footers and
   blurred panels no matter what stacking context they live in, and lets them
   flip upward when there isn't room below. One place fixes z-index everywhere. */

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "./ui";

const POPOVER_SHADOW = "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06)";
const POPOVER_Z = 200;

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

/* ── Portal ───────────────────────────────────────────────── */
function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

/* ── shared popover behaviour ─────────────────────────────────
   Tracks open state, closes on outside-click (checking both the trigger and the
   portaled menu) and on Escape. */
function usePopover() {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const popRef = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return { open, setOpen, triggerRef, popRef };
}

/* ── anchored, viewport-clamped fixed position ────────────────
   Measures the popover, then places it relative to the trigger but ALWAYS fully
   inside the viewport: prefer below, flip above if it fits better, otherwise
   clamp into view. maxHeight is capped to the viewport so a tall menu/calendar
   can never exceed the screen — overflow-auto then makes it scrollable. This
   holds even when the trigger sits at the very bottom edge (e.g. behind a
   sticky footer), where naive trigger-anchoring would push the menu off-screen. */
const MAX_POPOVER_HEIGHT = 384;
function useAnchoredStyle(
  open: boolean,
  triggerRef: React.RefObject<HTMLElement | null>,
  popRef: React.RefObject<HTMLElement | null>,
  { matchWidth = false, align = "left", gap = 6 }: { matchWidth?: boolean; align?: "left" | "right"; gap?: number } = {},
) {
  const [style, setStyle] = React.useState<React.CSSProperties>({ position: "fixed", top: -9999, left: -9999, visibility: "hidden", zIndex: POPOVER_Z });
  useIsoLayoutEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    if (!trigger) return;
    let raf = 0;
    const compute = () => {
      const r = trigger.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 8;
      const maxHeight = Math.min(MAX_POPOVER_HEIGHT, vh - margin * 2);
      const pop = popRef.current;
      const h = Math.min(pop ? pop.offsetHeight : maxHeight, maxHeight);
      const width = matchWidth ? r.width : pop ? pop.offsetWidth : 0;

      // Vertical: prefer below, else above, else clamp fully into the viewport.
      let top: number;
      if (r.bottom + gap + h <= vh - margin) top = r.bottom + gap;
      else if (r.top - gap - h >= margin) top = r.top - gap - h;
      else top = Math.max(margin, Math.min(r.bottom + gap, vh - margin - h));

      // Horizontal: align to the requested edge, then clamp into the viewport.
      let left = align === "right" ? r.right - width : r.left;
      left = Math.max(margin, Math.min(left, vw - margin - width));

      setStyle({
        position: "fixed",
        top: Math.round(top),
        left: Math.round(left),
        width: matchWidth ? Math.round(r.width) : undefined,
        maxHeight,
        zIndex: POPOVER_Z,
        visibility: "visible",
      });
    };
    compute();
    // Re-measure next frame: the first pass may run before the popover has its
    // natural size, so this locks in the correct clamped position.
    raf = requestAnimationFrame(compute);
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [open, matchWidth, align, gap, triggerRef, popRef]);
  return style;
}

const triggerBase =
  "flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 py-2.5 text-left text-sm transition-colors focus:outline-none focus-visible:border-black/30";

export type Option = { value: string; label: string; hint?: string };

/* ── Select (single) ──────────────────────────────────────── */
export function Select({
  value,
  onChange,
  options,
  placeholder = "Select…",
  className,
  ariaLabel,
  invalid = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
  invalid?: boolean;
}) {
  const { open, setOpen, triggerRef, popRef } = usePopover();
  const anchor = useAnchoredStyle(open, triggerRef, popRef, { matchWidth: true });
  const [active, setActive] = React.useState(0);
  const selected = options.find((o) => o.value === value);

  React.useEffect(() => {
    if (open) setActive(Math.max(0, options.findIndex((o) => o.value === value)));
  }, [open, options, value]);

  const onKey = (e: React.KeyboardEvent) => {
    if (!open && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(options.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (options[active]) {
        onChange(options[active].value);
        setOpen(false);
      }
    }
  };

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef as React.RefObject<HTMLButtonElement>}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKey}
        className={cn(
          triggerBase,
          invalid
            ? "border-[#f87171]/60 focus-visible:border-[#f87171]"
            : open
              ? "border-black/30"
              : "border-black/10 hover:border-black/20",
        )}
      >
        <span className={cn("truncate", selected ? "text-black/75" : "text-black/35")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={15} strokeWidth={1.5} className={cn("flex-none text-black/35 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <Portal>
          <ul
            ref={popRef as React.RefObject<HTMLUListElement>}
            role="listbox"
            style={{ ...anchor, boxShadow: POPOVER_SHADOW }}
            className="ct-enter overflow-auto rounded-xl border border-black/[0.07] bg-white p-1"
          >
            {options.map((o, i) => {
              const on = o.value === value;
              return (
                <li key={o.value} role="option" aria-selected={on}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                      i === active ? "bg-[#f0eee8]" : "hover:bg-[#fafaf8]",
                    )}
                  >
                    <span className="min-w-0">
                      <span className={cn("block truncate", on ? "text-black/85" : "text-black/65")}>{o.label}</span>
                      {o.hint && <span className="block truncate text-[11px] text-black/35">{o.hint}</span>}
                    </span>
                    {on && <Check size={14} strokeWidth={2} className="flex-none text-[#111]" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </Portal>
      )}
    </div>
  );
}

/* ── MultiSelect ──────────────────────────────────────────── */
export function MultiSelect({
  values,
  onChange,
  options,
  placeholder = "Select…",
  className,
  ariaLabel,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const { open, setOpen, triggerRef, popRef } = usePopover();
  const anchor = useAnchoredStyle(open, triggerRef, popRef, { matchWidth: true });
  const toggle = (v: string) => onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  const label =
    values.length === 0
      ? placeholder
      : values.length === 1
        ? options.find((o) => o.value === values[0])?.label ?? `${values.length} selected`
        : `${values.length} selected`;

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef as React.RefObject<HTMLButtonElement>}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className={cn(triggerBase, open ? "border-black/30" : "border-black/10 hover:border-black/20")}
      >
        <span className={cn("truncate", values.length ? "text-black/75" : "text-black/35")}>{label}</span>
        <ChevronDown size={15} strokeWidth={1.5} className={cn("flex-none text-black/35 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <Portal>
          <ul
            ref={popRef as React.RefObject<HTMLUListElement>}
            role="listbox"
            aria-multiselectable
            style={{ ...anchor, boxShadow: POPOVER_SHADOW }}
            className="ct-enter overflow-auto rounded-xl border border-black/[0.07] bg-white p-1"
          >
            {options.map((o) => {
              const on = values.includes(o.value);
              return (
                <li key={o.value} role="option" aria-selected={on}>
                  <button
                    type="button"
                    onClick={() => toggle(o.value)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-[#fafaf8]"
                  >
                    <span className={cn("grid h-4 w-4 flex-none place-items-center rounded-[5px] border", on ? "border-transparent bg-[#111] text-white" : "border-black/20")}>
                      {on && <Check size={11} strokeWidth={3} />}
                    </span>
                    <span className={cn("truncate", on ? "text-black/85" : "text-black/65")}>{o.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Portal>
      )}
    </div>
  );
}

/* ── Dropdown (generic menu) ──────────────────────────────── */
export function Dropdown({
  trigger,
  children,
  align = "left",
  className,
  width = "w-56",
}: {
  trigger: (open: boolean) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "left" | "right";
  className?: string;
  width?: string;
}) {
  const { open, setOpen, triggerRef, popRef } = usePopover();
  const anchor = useAnchoredStyle(open, triggerRef, popRef, { align });
  return (
    <div className={cn("relative", className)}>
      <button ref={triggerRef as React.RefObject<HTMLButtonElement>} type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {trigger(open)}
      </button>
      {open && (
        <Portal>
          <div
            ref={popRef as React.RefObject<HTMLDivElement>}
            style={{ ...anchor, boxShadow: POPOVER_SHADOW }}
            className={cn("ct-enter overflow-auto rounded-xl border border-black/[0.07] bg-white p-1", width)}
          >
            {children(() => setOpen(false))}
          </div>
        </Portal>
      )}
    </div>
  );
}

/* ── Calendar ─────────────────────────────────────────────── */
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function Calendar({
  value,
  onSelect,
  min,
}: {
  value?: string;
  onSelect: (iso: string) => void;
  min?: string;
}) {
  const selected = value ? new Date(value + "T00:00:00") : undefined;
  const today = new Date();
  const init = selected ?? today;
  const [view, setView] = React.useState({ y: init.getFullYear(), m: init.getMonth() });

  const firstOffset = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const minDate = min ? new Date(min + "T00:00:00") : undefined;

  const step = (dir: -1 | 1) =>
    setView((v) => {
      const m = v.m + dir;
      if (m < 0) return { y: v.y - 1, m: 11 };
      if (m > 11) return { y: v.y + 1, m: 0 };
      return { y: v.y, m };
    });

  const isSame = (a: Date, b?: Date) => b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  return (
    <div className="w-[266px] p-3">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => step(-1)} aria-label="Previous month" className="grid h-7 w-7 place-items-center rounded-lg text-black/45 hover:bg-[#f0eee8] hover:text-black">
          <ChevronLeft size={15} strokeWidth={1.5} />
        </button>
        <span className="text-[13px] font-medium text-black/75">
          {MONTH_NAMES[view.m]} {view.y}
        </span>
        <button type="button" onClick={() => step(1)} aria-label="Next month" className="grid h-7 w-7 place-items-center rounded-lg text-black/45 hover:bg-[#f0eee8] hover:text-black">
          <ChevronRight size={15} strokeWidth={1.5} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((w) => (
          <span key={w} className="grid h-7 place-items-center font-mono text-[10px] uppercase tracking-[0.08em] text-black/30">
            {w}
          </span>
        ))}
        {Array.from({ length: firstOffset }, (_, i) => (
          <span key={`b${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = new Date(view.y, view.m, day);
          const disabled = minDate ? date < minDate : false;
          const sel = isSame(date, selected);
          const isToday = isSame(date, today);
          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(toISO(date))}
              className={cn(
                "grid h-8 place-items-center rounded-lg text-[13px] transition-colors",
                sel ? "bg-[#111] text-white" : "text-black/65 hover:bg-[#f0eee8]",
                !sel && isToday && "ring-1 ring-inset ring-black/15",
                disabled && "cursor-not-allowed text-black/20 hover:bg-transparent",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── DatePicker ───────────────────────────────────────────── */
export function DatePicker({
  value,
  onChange,
  min,
  placeholder = "Select a date",
  className,
  ariaLabel,
  invalid = false,
}: {
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
  invalid?: boolean;
}) {
  const { open, setOpen, triggerRef, popRef } = usePopover();
  const anchor = useAnchoredStyle(open, triggerRef, popRef);
  const display = value
    ? new Date(value + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : placeholder;
  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef as React.RefObject<HTMLButtonElement>}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          triggerBase,
          invalid
            ? "border-[#f87171]/60 focus-visible:border-[#f87171]"
            : open
              ? "border-black/30"
              : "border-black/10 hover:border-black/20",
        )}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <CalendarIcon size={15} strokeWidth={1.5} className="flex-none text-black/35" />
          <span className={cn("truncate whitespace-nowrap", value ? "text-black/75" : "text-black/35")}>{display}</span>
        </span>
        <ChevronDown size={15} strokeWidth={1.5} className={cn("flex-none text-black/35 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <Portal>
          <div
            ref={popRef as React.RefObject<HTMLDivElement>}
            style={{ ...anchor, boxShadow: POPOVER_SHADOW }}
            className="ct-enter overflow-auto rounded-xl border border-black/[0.07] bg-white"
          >
            <Calendar
              value={value}
              min={min}
              onSelect={(iso) => {
                onChange(iso);
                setOpen(false);
              }}
            />
          </div>
        </Portal>
      )}
    </div>
  );
}
