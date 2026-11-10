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
import {
  ChevronDown,
  ChevronUp,
  Check,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "./ui";
import { localeFor, useFormat, useLanguage, useT } from "@/lib/i18n";
import { COUNTRIES } from "@/lib/config";
import { calendarDate } from "@/lib/calendar-date";

const POPOVER_SHADOW =
  "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06)";

/* ── The stacking order, stated once ──────────────────────────
   toast 100 · sidebar/topbar 40–50 · add-member dialog 220 · Modal 300 ·
   POPOVER 400.

   A popover has to sit ABOVE every dialog, not below it. It used to be 200,
   which is under Modal's 300 — so a Select or DatePicker opened inside any
   modal rendered its menu behind the modal's own panel and read as a dropdown
   that does nothing when clicked. That is the whole of the "production route
   doesn't appear" and "reporting year doesn't appear" bug: both live in the
   new-workspace dialog, and both were opening correctly into a layer nobody
   could see. A popover is always transient and always owned by the top-most
   surface, so the top of the stack is where it belongs. */
const POPOVER_Z = 400;

const useIsoLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

/* ── Portal ───────────────────────────────────────────────── */
export function Portal({ children }: { children: React.ReactNode }) {
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
      if (triggerRef.current?.contains(t) || popRef.current?.contains(t))
        return;
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
  {
    matchWidth = false,
    align = "left",
    gap = 6,
    maxHeight: cap = MAX_POPOVER_HEIGHT,
  }: { matchWidth?: boolean; align?: "left" | "right"; gap?: number; maxHeight?: number } = {},
) {
  const [style, setStyle] = React.useState<React.CSSProperties>({
    position: "fixed",
    top: -9999,
    left: -9999,
    visibility: "hidden",
    zIndex: POPOVER_Z,
  });
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
      const maxHeight = Math.min(cap, vh - margin * 2);
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
    /* Measure again once the popover really exists. The popover is drawn through a Portal, which mounts one effect AFTER this
       one, so the first pass (and, on a busy page, the next frame's too) can find no popover and place it by a width of
       zero — which put the notifications menu at the bell's right edge, 351px wide, off a 375px screen. Keep trying frame
       by frame until it is there, then measure once more with its natural size so the clamp is right. */
    let tries = 0;
    let measured = false;
    const settle = () => {
      compute();
      if (popRef.current) {
        if (!measured) {
          measured = true;
          raf = requestAnimationFrame(compute);
        }
      } else if (tries++ < 60) {
        raf = requestAnimationFrame(settle);
      }
    };
    raf = requestAnimationFrame(settle);

    // Scrolling INSIDE the popover must not reposition it. The capture listener
    // exists to follow the trigger when an ancestor scrolls; a long list (the
    // country picker is 200 rows) fires the same event on its own scroll, and
    // recomputing from a trigger that has not moved makes the menu shudder and
    // fight the wheel. Ignoring events whose target is the popover itself is
    // what makes that list scrollable at all.
    const onScroll = (e: Event) => {
      const t = e.target as Node | null;
      if (
        t &&
        popRef.current &&
        (t === popRef.current || popRef.current.contains(t))
      )
        return;
      compute();
    };
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, matchWidth, align, gap, triggerRef, popRef]);
  return style;
}

/* Height and padding are the input's, not a smaller variant of it. A select
   sitting 6px shorter than the text field beside it is the single most visible
   way a form looks unfinished, and it is the one thing every row of mixed
   controls in this portal does. */
const triggerBase =
  "flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-4 py-3 text-left text-sm transition-colors focus:outline-none focus-visible:border-black/30";

export type Option = {
  value: string;
  label: string;
  hint?: string;
  /** Shown, greyed, and not pickable — the option exists but is not available to this reader yet. */
  disabled?: boolean;
  /** Drawn before the label, in the list and on the trigger (a country's flag). */
  icon?: React.ReactNode;
};

/* ── Select (single) ──────────────────────────────────────── */
/** The labels and hints a dropdown shows, in the language on screen. Callers hand over the lists they have — fuels, routes, frequencies, units — and
    most are English source strings; passing them through the dictionary here means no dropdown has to remember to, and one that is already
    translated passes through unchanged. */
function useTranslatedOptions(options: Option[]): Option[] {
  const t = useT();
  const { lang } = useLanguage();
  /* A country list is the one dropdown that is not a list of our own words: its labels are the English names of the ISO countries, and
     the platform already knows every one of them in every language (Intl.DisplayNames). An option is a country when its value is a
     country's code and its label is that country's English name — so a list that is something else is never touched. */
  const display = React.useMemo(() => {
    if (lang === "en") return null;
    try {
      return new Intl.DisplayNames([localeFor(lang)], { type: "region" });
    } catch {
      return null;
    }
  }, [lang]);
  return React.useMemo(
    () =>
      options.map((o) => {
        const country =
          display && COUNTRY_NAME_BY_CODE.get(o.value) === o.label
            ? display.of(o.value)
            : undefined;
        return {
          ...o,
          label: country || t(o.label),
          hint: o.hint ? t(o.hint) : o.hint,
        };
      }),
    [options, t, display],
  );
}

const COUNTRY_NAME_BY_CODE = new Map<string, string>(
  COUNTRIES.map((c) => [c.code, c.name]),
);

export function Select({
  value,
  onChange,
  options: optionsIn,
  placeholder = "Select…",
  className,
  ariaLabel,
  invalid = false,
  disabled = false,
  searchable = false,
  searchPlaceholder = "Search…",
  emptyLabel = "No matches",
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
  invalid?: boolean;
  /** A locked field is really locked — not merely covered by a parent's
      `pointer-events-none`, which leaves the trigger tabbable and openable
      from the keyboard. */
  disabled?: boolean;
  /** Long lists (countries, catalogues) get a type-to-filter box in the popover. */
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyLabel?: string;
}) {
  const t = useT();
  const options = useTranslatedOptions(optionsIn);
  const { open, setOpen, triggerRef, popRef } = usePopover();
  const anchor = useAnchoredStyle(open, triggerRef, popRef, {
    matchWidth: true,
  });
  const [active, setActive] = React.useState(0);
  const [query, setQuery] = React.useState("");
  const searchRef = React.useRef<HTMLInputElement | null>(null);
  /* The sticky filter row, measured rather than assumed — see the scroll
     effect below, which has to know how much of the list it covers. */
  const searchWrapRef = React.useRef<HTMLLIElement | null>(null);
  const optionRefs = React.useRef<(HTMLLIElement | null)[]>([]);
  const selected = options.find((o) => o.value === value);

  const shown = React.useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q) ||
        (o.hint ?? "").toLowerCase().includes(q),
    );
  }, [options, query, searchable]);

  /* Reset on OPEN only.

     This used to depend on `options` and `value` as well. Almost every call
     site builds its options inline — `options={FUEL_TYPES.map(…)}` — so the
     array is a new identity on every parent render, and any parent re-render
     while the menu was open re-ran this and wiped the search box mid-word. The
     question this answers is "what should the menu show when it opens", and
     that has exactly one trigger. */
  const latest = React.useRef({ options, value });
  latest.current = { options, value };
  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(
      Math.max(
        0,
        latest.current.options.findIndex(
          (o) => o.value === latest.current.value,
        ),
      ),
    );
  }, [open]);

  // Keep the highlight inside the filtered list as the query narrows it.
  React.useEffect(() => setActive(0), [query]);

  React.useEffect(() => {
    if (open && searchable) searchRef.current?.focus();
  }, [open, searchable]);

  /* Bring the highlighted row into view — BY MOVING THE LIST, not the page.

     Without this a long list opens scrolled to the top no matter what is
     selected: pick "Coking coal", reopen, and the menu shows Coke / Anthracite
     / Fuel oil with the selected row somewhere below the fold. The reader sees
     a list that does not contain their answer and picks the nearest thing that
     is visible — which is the one failure a closed list exists to prevent.

     `element.scrollIntoView()` is the obvious spelling and it is wrong here: it
     scrolls EVERY scrollable ancestor, and this list is portaled to
     document.body, so the browser also scrolls the document to "reveal" a
     fixed-position element that was never hidden. The whole page lurches
     downward the moment a dropdown opens. So the arithmetic is done by hand
     against the popover's own scrollTop and nothing else moves.

     `pad` is the sticky search box's height: a row scrolled flush to the top
     of a searchable list lands underneath the filter floating over it. It is
     MEASURED, not guessed — the row's height moves with the type scale, and a
     stale constant here hides the selected option behind the filter, which is
     the same failure this effect exists to prevent. */
  React.useEffect(() => {
    if (!open) return;
    const list = popRef.current as HTMLUListElement | null;
    const el = optionRefs.current[active];
    if (!list || !el) return;
    const raf = requestAnimationFrame(() => {
      const pad = searchWrapRef.current?.offsetHeight ?? 0;
      const top = el.offsetTop - pad;
      const bottom = el.offsetTop + el.offsetHeight;
      if (top < list.scrollTop) list.scrollTop = Math.max(0, top);
      else if (bottom > list.scrollTop + list.clientHeight)
        list.scrollTop = bottom - list.clientHeight;
    });
    return () => cancelAnimationFrame(raf);
  }, [open, active, shown.length, searchable, popRef]);

  const onKey = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (
      !open &&
      (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")
    ) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(shown.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (shown[active] && !shown[active].disabled) {
        onChange(shown[active].value);
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
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onKey}
        className={cn(
          triggerBase,
          disabled
            ? "cursor-not-allowed border-black/[0.07] bg-black/[0.02] text-black/40"
            : invalid
              ? "border-[#f87171]/60 focus-visible:border-[#f87171]"
              : open
                ? "border-black/30"
                : "border-black/10 hover:border-black/20",
        )}
      >
        <span
          className={cn(
            "flex min-w-0 items-center gap-2 truncate",
            selected ? "text-black/75" : "text-black/35",
          )}
        >
          {selected?.icon}
          <span className="truncate">{selected ? selected.label : t(placeholder)}</span>
        </span>
        <ChevronDown
          size={15}
          strokeWidth={1.5}
          className={cn(
            "flex-none text-black/35 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <Portal>
          <ul
            ref={popRef as React.RefObject<HTMLUListElement>}
            role="listbox"
            style={{
              ...anchor,
              boxShadow: POPOVER_SHADOW,
              overscrollBehavior: "contain",
            }}
            /* NO TOP PADDING WHEN SEARCHABLE — see the sticky <li> below. */
            className={cn(
              "ct-pop overflow-auto rounded-xl border border-black/[0.07] bg-white px-1 pb-1",
              searchable ? "pt-0" : "pt-1",
            )}
          >
            {searchable && (
              /* Sticky so the filter stays reachable while a long list scrolls.

                 The top inset has to be ZERO-COST, and that is why the list
                 above drops its top padding instead of this row cancelling it
                 with a negative margin. `-m-1` was the obvious spelling and it
                 is the bug: `top-0` resolves against the SCROLLPORT, which is
                 the padding box, so a row pulled 4px above the padding box is
                 immediately pushed back down to it. That left a 4px white band
                 above the search bar at rest — and the band is inside the
                 scrollport, so option text scrolled up through it and sat
                 visibly above the filter that was supposed to be covering it.

                 With `pt-0` on the list the row's natural position already IS
                 the sticky position, so nothing shifts and nothing shows above
                 it. `-mx-1` keeps the full-bleed rule; `px-2` puts the inner
                 padding back. */
              <li
                ref={searchWrapRef}
                className="sticky top-0 z-10 -mx-1 mb-1 border-b border-black/[0.06] bg-white px-2 pb-2 pt-2"
              >
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKey}
                  placeholder={t(searchPlaceholder)}
                  aria-label={t(searchPlaceholder)}
                  className="w-full rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-[13px] text-black/70 placeholder:text-black/30 focus:border-black/25 focus:outline-none"
                />
              </li>
            )}
            {shown.length === 0 && (
              <li className="px-2.5 py-3 text-center text-[12px] text-black/35">
                {t(emptyLabel)}
              </li>
            )}
            {shown.map((o, i) => {
              const on = o.value === value;
              return (
                <li
                  key={o.value}
                  role="option"
                  aria-selected={on}
                  ref={(el) => {
                    optionRefs.current[i] = el;
                  }}
                >
                  <button
                    type="button"
                    disabled={o.disabled}
                    aria-disabled={o.disabled || undefined}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => {
                      if (o.disabled) return;
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-start justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                      o.disabled
                        ? "cursor-not-allowed opacity-45"
                        : i === active
                          ? "bg-[#f0eee8]"
                          : "hover:bg-[#fafaf8]",
                    )}
                  >
                    {/* The hint WRAPS. A one-line explanation cut off at the
                        edge of the menu is worse than no explanation: the
                        reader learns there was something to know and not what
                        it was, which is exactly when people guess. */}
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "flex items-center gap-2",
                          on ? "text-black/85" : "text-black/65",
                        )}
                      >
                        {o.icon}
                        {o.label}
                      </span>
                      {o.hint && (
                        <span className="mt-0.5 block text-[11px] leading-snug text-black/40">
                          {o.hint}
                        </span>
                      )}
                    </span>
                    {on && (
                      <Check
                        size={14}
                        strokeWidth={2}
                        className="mt-0.5 flex-none text-[#111]"
                      />
                    )}
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
  options: optionsIn,
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
  const t = useT();
  const options = useTranslatedOptions(optionsIn);
  const { open, setOpen, triggerRef, popRef } = usePopover();
  const anchor = useAnchoredStyle(open, triggerRef, popRef, {
    matchWidth: true,
  });
  const toggle = (v: string) =>
    onChange(
      values.includes(v) ? values.filter((x) => x !== v) : [...values, v],
    );
  const label =
    values.length === 0
      ? t(placeholder)
      : values.length === 1
        ? (options.find((o) => o.value === values[0])?.label ??
          t("{n} selected", { n: values.length }))
        : t("{n} selected", { n: values.length });

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef as React.RefObject<HTMLButtonElement>}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          triggerBase,
          open ? "border-black/30" : "border-black/10 hover:border-black/20",
        )}
      >
        <span
          className={cn(
            "truncate",
            values.length ? "text-black/75" : "text-black/35",
          )}
        >
          {label}
        </span>
        <ChevronDown
          size={15}
          strokeWidth={1.5}
          className={cn(
            "flex-none text-black/35 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <Portal>
          <ul
            ref={popRef as React.RefObject<HTMLUListElement>}
            role="listbox"
            aria-multiselectable
            style={{
              ...anchor,
              boxShadow: POPOVER_SHADOW,
              overscrollBehavior: "contain",
            }}
            className="ct-pop overflow-auto rounded-xl border border-black/[0.07] bg-white p-1"
          >
            {options.map((o) => {
              const on = values.includes(o.value);
              return (
                <li key={o.value} role="option" aria-selected={on}>
                  <button
                    type="button"
                    onClick={() => toggle(o.value)}
                    className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-[#fafaf8]"
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid h-4 w-4 flex-none place-items-center rounded-[5px] border",
                        on
                          ? "border-transparent bg-[#111] text-white"
                          : "border-black/20",
                      )}
                    >
                      {on && <Check size={11} strokeWidth={3} />}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block",
                          on ? "text-black/85" : "text-black/65",
                        )}
                      >
                        {o.label}
                      </span>
                      {o.hint && (
                        <span className="mt-0.5 block text-[11px] leading-snug text-black/40">
                          {o.hint}
                        </span>
                      )}
                    </span>
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
  panelClassName,
  maxHeight,
}: {
  trigger: (open: boolean) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "left" | "right";
  className?: string;
  width?: string;
  /** Classes for the panel itself — e.g. a flex column whose own list scrolls, so the panel and the list never both do. */
  panelClassName?: string;
  /** A taller cap than the default (still never taller than the screen). */
  maxHeight?: number;
}) {
  const { open, setOpen, triggerRef, popRef } = usePopover();
  const anchor = useAnchoredStyle(open, triggerRef, popRef, { align, maxHeight });
  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef as React.RefObject<HTMLButtonElement>}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {trigger(open)}
      </button>
      {open && (
        <Portal>
          <div
            ref={popRef as React.RefObject<HTMLDivElement>}
            style={{ ...anchor, boxShadow: POPOVER_SHADOW }}
            className={cn(
              "ct-pop overflow-auto rounded-xl border border-black/[0.07] bg-white p-1",
              width,
              panelClassName,
            )}
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

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function Calendar({
  value,
  onSelect,
  min,
  max,
}: {
  value?: string;
  onSelect: (iso: string) => void;
  min?: string;
  /** inclusive upper bound, ISO 'YYYY-MM-DD' */
  max?: string;
}) {
  const t = useT();
  const { lang } = useLanguage();
  const { locale } = useFormat();
  // Month and weekday names come from the platform for the language on screen — a Thai or Chinese reader gets their own, not English's.
  const monthNames = React.useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) =>
        new Intl.DateTimeFormat(locale, { month: "long" }).format(
          new Date(2000, i, 1),
        ),
      ),
    [locale],
  );
  const weekdays = React.useMemo(
    () =>
      lang === "en"
        ? WEEKDAYS
        : Array.from({ length: 7 }, (_, i) =>
            new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
              new Date(2024, 0, 1 + i),
            ),
          ),
    [lang, locale],
  );
  const selected = calendarDate(value);
  const today = new Date();
  const minDate = calendarDate(min);
  const maxDate = calendarDate(max);

  // Open on a month the operator is allowed to pick from. Landing on today
  // when today is outside the bounds means the first thing they see is a grid
  // of disabled days and two arrows that do nothing.
  const init =
    selected ??
    (minDate && today < minDate
      ? minDate
      : maxDate && today > maxDate
        ? maxDate
        : today);
  const [view, setView] = React.useState({
    y: init.getFullYear(),
    m: init.getMonth(),
  });

  const firstOffset = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();

  // Arrows stop at the bounds rather than scrolling into months where every
  // day is dead. With min/max set to a reporting year this is what makes
  // "you cannot pick another year" a property of the control, not a warning.
  const canStep = (dir: -1 | 1) => {
    const m = view.m + dir;
    const y = m < 0 ? view.y - 1 : m > 11 ? view.y + 1 : view.y;
    const mm = ((m % 12) + 12) % 12;
    const lastOfTarget = new Date(y, mm + 1, 0);
    const firstOfTarget = new Date(y, mm, 1);
    if (minDate && lastOfTarget < minDate) return false;
    if (maxDate && firstOfTarget > maxDate) return false;
    return true;
  };

  const step = (dir: -1 | 1) => {
    if (!canStep(dir)) return;
    setView((v) => {
      const m = v.m + dir;
      if (m < 0) return { y: v.y - 1, m: 11 };
      if (m > 11) return { y: v.y + 1, m: 0 };
      return { y: v.y, m };
    });
  };

  const isSame = (a: Date, b?: Date) =>
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  return (
    <div className="w-[266px] p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={!canStep(-1)}
          aria-label={t("Previous month")}
          className="grid h-7 w-7 place-items-center rounded-lg text-black/45 hover:bg-[#f0eee8] hover:text-black disabled:pointer-events-none disabled:text-black/15"
        >
          <ChevronLeft size={15} strokeWidth={1.5} />
        </button>
        <span className="text-[13px] font-medium text-black/75">
          {monthNames[view.m]} {view.y}
        </span>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={!canStep(1)}
          aria-label={t("Next month")}
          className="grid h-7 w-7 place-items-center rounded-lg text-black/45 hover:bg-[#f0eee8] hover:text-black disabled:pointer-events-none disabled:text-black/15"
        >
          <ChevronRight size={15} strokeWidth={1.5} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {weekdays.map((w) => (
          <span
            key={w}
            className="grid h-7 place-items-center font-mono text-[10px] uppercase tracking-[0.08em] text-black/30"
          >
            {w}
          </span>
        ))}
        {Array.from({ length: firstOffset }, (_, i) => (
          <span key={`b${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = new Date(view.y, view.m, day);
          const disabled =
            (minDate ? date < minDate : false) ||
            (maxDate ? date > maxDate : false);
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
                sel
                  ? "bg-[#111] text-white"
                  : "text-black/65 hover:bg-[#f0eee8]",
                !sel && isToday && "ring-1 ring-inset ring-black/15",
                disabled &&
                  "cursor-not-allowed text-black/20 hover:bg-transparent",
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
  max,
  placeholder = "Select a date",
  className,
  ariaLabel,
  invalid = false,
  disabled = false,
}: {
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  /** inclusive upper bound — set both ends to a reporting year and the picker
      cannot leave it */
  max?: string;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const t = useT();
  const format = useFormat();
  const { open, setOpen, triggerRef, popRef } = usePopover();
  const anchor = useAnchoredStyle(open, triggerRef, popRef);
  const selected = calendarDate(value);
  const display = selected ? format.date(selected) : t(placeholder);
  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef as React.RefObject<HTMLButtonElement>}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          triggerBase,
          "disabled:cursor-not-allowed disabled:bg-black/[0.02] disabled:text-black/30",
          invalid
            ? "border-[#f87171]/60 focus-visible:border-[#f87171]"
            : open
              ? "border-black/30"
              : "border-black/10 hover:border-black/20",
        )}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <CalendarIcon
            size={15}
            strokeWidth={1.5}
            className="flex-none text-black/35"
          />
          <span
            className={cn(
              "truncate whitespace-nowrap",
              value ? "text-black/75" : "text-black/35",
            )}
          >
            {display}
          </span>
        </span>
        <ChevronDown
          size={15}
          strokeWidth={1.5}
          className={cn(
            "flex-none text-black/35 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <Portal>
          <div
            ref={popRef as React.RefObject<HTMLDivElement>}
            style={{
              ...anchor,
              boxShadow: POPOVER_SHADOW,
              overscrollBehavior: "contain",
            }}
            className="ct-pop overflow-auto rounded-xl border border-black/[0.07] bg-white"
          >
            <Calendar
              value={value}
              min={min}
              max={max}
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

/* ── SelectWithOther ──────────────────────────────────────────
   A closed list plus a real escape hatch. Two things go wrong without it, and
   both of them show up in a verification:

   1. A closed list with no "Other" makes people pick the nearest wrong option.
      A plant burning rice husk that has to choose between "Coal" and "Biomass"
      picks Biomass and loses the fact that it was rice husk.
   2. A free-text box with no list makes twelve months of the same fuel arrive
      as "NG", "Nat gas", "natural gas" and "LNG", which cannot be summed.

   So: pick from the standard list, or pick Other and SAY WHAT. The free text is
   stored alongside the code rather than instead of it, so the standard cases
   stay comparable and the unusual one stays legible. */
export function SelectWithOther({
  value,
  otherText,
  onChange,
  options,
  otherValue = "other",
  otherLabel = "Other — specify",
  otherPlaceholder = "Describe it in the terms your invoices use",
  placeholder,
  searchable,
  disabled,
  invalid,
  className,
  ariaLabel,
}: {
  value: string;
  otherText: string;
  onChange: (next: { value: string; otherText: string }) => void;
  options: Option[];
  otherValue?: string;
  otherLabel?: string;
  otherPlaceholder?: string;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const t = useT();
  const isOther = value === otherValue;
  const all: Option[] = [
    ...options,
    {
      value: otherValue,
      label: otherLabel,
      hint: "Anything the list above does not name. Describe it in the field that appears.",
    },
  ];

  return (
    <div className={cn("space-y-2", className)}>
      <Select
        value={value}
        onChange={(v) =>
          onChange({ value: v, otherText: v === otherValue ? otherText : "" })
        }
        options={all}
        placeholder={placeholder ? t(placeholder) : undefined}
        searchable={searchable}
        invalid={invalid}
        ariaLabel={ariaLabel}
      />
      {isOther && (
        <input
          className={cn(
            "w-full rounded-xl border bg-white px-4 py-3 text-sm text-black/70 placeholder:text-black/25 focus:outline-none transition-colors",
            otherText.trim()
              ? "border-black/10 focus:border-black/25"
              : "border-[#f59e0b]/50 focus:border-[#f59e0b]",
          )}
          value={otherText}
          disabled={disabled}
          placeholder={t(otherPlaceholder)}
          aria-label={`${ariaLabel ?? otherLabel} — description`}
          onChange={(e) => onChange({ value, otherText: e.target.value })}
        />
      )}
    </div>
  );
}

/* ── OrderedMultiSelect ───────────────────────────────────────
   Selection AND sequence. A list of processes is not a set: "raw material
   handling → melting → casting → hot rolling" describes a plant, and the same
   four names shuffled describe nothing. A verifier reads the included list as
   the order material moves through the boundary, so the order has to be
   something the exporter controls rather than an accident of click order. */
/* The empty state IS the dropdown.

   This used to render a dashed panel reading "Nothing selected yet. Add them
   in the order material moves through the plant", with the actual control
   underneath it — two boxes, one of which was a sentence explaining the other.
   Readers pressed the sentence. So the panel is gone: when nothing is chosen
   the only thing on screen is one dropdown that says what to do, and once
   something is chosen it says what to do next. */
export function OrderedMultiSelect({
  values,
  onChange,
  options,
  placeholder = "Add a process…",
  /** shown before anything is chosen; falls back to `placeholder` */
  firstPlaceholder,
  emptyLabel,
  disabled,
  className,
  ariaLabel,
  allowOther = false,
  otherLabel = "Other — name it yourself",
  otherPlaceholder = "Name it as your team names it",
}: {
  values: string[];
  onChange: (v: string[]) => void;
  options: Option[];
  placeholder?: string;
  firstPlaceholder?: string;
  /** optional dashed panel for the empty state. Omit it and the dropdown
      carries the empty state on its own, which is nearly always better. */
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  /** Append an "Other" row that takes a typed name and adds it as an ordinary
      entry. A closed list of process names cannot cover every plant, and the
      failure mode without this is silent: somebody whose line does not appear
      picks the nearest wrong name, and the boundary now describes a process
      that is not the one running. */
  allowOther?: boolean;
  otherLabel?: string;
  otherPlaceholder?: string;
}) {
  const t = useT();
  /* The typed entry, held here until it is committed. It is added as a plain
     string, exactly like a listed option, because `values` is `string[]` and
     the consumers (the MMD document, the exclusion picker, the report) already
     treat anything not in the catalogue as a custom name. */
  const [otherDraft, setOtherDraft] = React.useState<string | null>(null);
  const otherInputRef = React.useRef<HTMLInputElement | null>(null);
  React.useEffect(() => {
    if (otherDraft !== null) otherInputRef.current?.focus();
  }, [otherDraft !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  const available = options.filter((o) => !values.includes(o.value));
  const labelFor = (v: string) =>
    options.find((o) => o.value === v)?.label ?? v;

  const OTHER = "__other__";
  const commitOther = () => {
    const name = (otherDraft ?? "").trim();
    // Silently ignoring a duplicate is right: re-adding a name already in the
    // sequence would put the same process at two positions in one order.
    if (name && !values.includes(name)) onChange([...values, name]);
    setOtherDraft(null);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= values.length) return;
    const next = [...values];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    onChange(next);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {values.length === 0 ? (
        emptyLabel ? (
          <p className="rounded-xl border border-dashed border-black/10 px-4 py-3 text-[12.5px] text-black/40">
            {t(emptyLabel)}
          </p>
        ) : null
      ) : (
        <ol className="space-y-1.5">
          {values.map((v, i) => (
            <li
              key={v}
              className="flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-3 py-2"
            >
              <span className="grid h-6 w-6 flex-none place-items-center rounded-lg bg-[#f0eee8] font-mono text-[11px] text-black/50">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] text-black/75">
                {labelFor(v)}
              </span>
              <span className="flex flex-none items-center gap-0.5">
                <button
                  type="button"
                  disabled={disabled || i === 0}
                  onClick={() => move(i, i - 1)}
                  aria-label={`Move ${labelFor(v)} earlier`}
                  className="grid h-6 w-6 place-items-center rounded-lg text-black/35 hover:bg-black/[0.04] hover:text-black disabled:pointer-events-none disabled:text-black/12"
                >
                  <ChevronUp size={14} strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  disabled={disabled || i === values.length - 1}
                  onClick={() => move(i, i + 1)}
                  aria-label={`Move ${labelFor(v)} later`}
                  className="grid h-6 w-6 place-items-center rounded-lg text-black/35 hover:bg-black/[0.04] hover:text-black disabled:pointer-events-none disabled:text-black/12"
                >
                  <ChevronDown size={14} strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(values.filter((x) => x !== v))}
                  aria-label={`Remove ${labelFor(v)}`}
                  className="grid h-6 w-6 place-items-center rounded-lg text-black/30 hover:bg-[#fef2f2] hover:text-[#dc2626] disabled:pointer-events-none"
                >
                  <X size={13} strokeWidth={1.5} />
                </button>
              </span>
            </li>
          ))}
        </ol>
      )}
      {!disabled && otherDraft !== null && (
        /* Committed with Enter or the tick, abandoned with Escape or the cross.
           Nothing is written to `values` until it has a name — an unnamed row
           in an ordered boundary is worse than a missing one. */
        <div className="flex items-center gap-2">
          <input
            ref={otherInputRef}
            value={otherDraft}
            onChange={(e) => setOtherDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitOther();
              } else if (e.key === "Escape") {
                e.preventDefault();
                setOtherDraft(null);
              }
            }}
            placeholder={t(otherPlaceholder)}
            aria-label={`${ariaLabel ?? "Item"} — name it yourself`}
            className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black/70 placeholder:text-black/25 transition-colors focus:border-black/25 focus:outline-none"
          />
          <button
            type="button"
            onClick={commitOther}
            disabled={!otherDraft.trim()}
            aria-label={t("Add this one")}
            className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-[#111] text-white transition-colors hover:bg-[#333] disabled:pointer-events-none disabled:bg-black/[0.06] disabled:text-black/25"
          >
            <Check size={15} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => setOtherDraft(null)}
            aria-label={t("Cancel")}
            className="grid h-11 w-11 flex-none place-items-center rounded-xl border border-black/10 text-black/35 transition-colors hover:border-black/25 hover:text-black"
          >
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>
      )}
      {!disabled &&
        otherDraft === null &&
        (available.length > 0 || allowOther) && (
          <Select
            value=""
            onChange={(v) =>
              v === OTHER ? setOtherDraft("") : onChange([...values, v])
            }
            options={
              allowOther
                ? [
                    ...available,
                    {
                      value: OTHER,
                      label: otherLabel,
                      hint: "Anything the list above does not name. You type the name and it joins the sequence.",
                    },
                  ]
                : available
            }
            placeholder={t(
              values.length === 0
                ? (firstPlaceholder ?? placeholder)
                : placeholder,
            )}
            ariaLabel={ariaLabel}
            searchable={options.length > 10}
          />
        )}
    </div>
  );
}
