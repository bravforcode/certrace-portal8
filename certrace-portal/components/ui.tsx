"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useT, useFormat } from "@/lib/i18n";
import { Check, HelpCircle, Languages, X } from "lucide-react";

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
/* Shared with ButtonLink below, so a button and a link that sit side by side
   are the same control at the same size — see its header. */
const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-xl uppercase tracking-[0.1em] transition-colors disabled:opacity-40 disabled:pointer-events-none";
const btnSizing = (size: "md" | "sm") => (size === "sm" ? "px-4 py-2 text-[11px]" : "px-6 py-3 text-[13px]");
const btnVariants: Record<"primary" | "secondary" | "ghost", string> = {
  primary: "bg-[#111] text-white hover:bg-[#333]",
  secondary: "border border-black/10 text-black/60 hover:border-black/25 hover:text-black hover:bg-black/[0.04]",
  ghost: "text-black/45 hover:text-black",
};

export function Button({ variant = "primary", size = "md", className, children, ...props }: BtnProps) {
  return (
    <button className={cn(btnBase, btnSizing(size), btnVariants[variant], className)} {...props}>
      {children}
    </button>
  );
}

/* ── The same button, as a link ─────────────────────────────
   A destination is a link. Rendering one as a <button> with router.push()
   breaks middle-click, cmd-click, "open in new tab", the status bar preview
   and every assistive technology that distinguishes "this goes somewhere"
   from "this does something — but it has to LOOK like the button beside it,
   or the strip reads as two unrelated controls.

   Before this existed, four screens hand-copied Button's class string onto an
   anchor. That is how a design system stops being one: the copies were
   already drifting on padding, and none of them had the disabled or focus
   handling. One primitive, the same `variant`/`size` vocabulary as Button,
   and the class string lives in exactly one place.

   `external` swaps next/link for a plain anchor with the safe rel — a target
   outside the app must not go through the client router, and noreferrer is
   not optional on a target="_blank". */
export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  external,
  className,
  children,
  ...rest
}: {
  href: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "sm";
  external?: boolean;
  className?: string;
  children: React.ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children">) {
  const cls = cn(btnBase, btnSizing(size), btnVariants[variant], className);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  );
}

/* ── Save button state machine ─────────────────────────────
   Shared "Save changes → Saving… → Saved → Save changes" cycle used across
   every settings form, so the feedback pattern reads the same everywhere. */
/* ── Confirmation that stays where it was pressed ───────────────
   A toast answers "did that work?" at the edge of the screen, while the
   reader is still looking at the button they pressed — and it leaves whether
   or not anyone read it. A button that says what it just did, where it was
   pressed, needs neither. `useFlash` is the timer behind that: fire it on the
   action, and the caller swaps the label and the colour for a couple of
   seconds. Lifted out of the precursor dialog, which had it first. */
export function useFlash(ms = 2200): readonly [boolean, () => void] {
  const [on, setOn] = React.useState(false);
  const timer = React.useRef<number | null>(null);
  React.useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );
  const fire = React.useCallback(() => {
    setOn(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOn(false), ms);
  }, [ms]);
  return [on, fire] as const;
}

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
  idleLabel,
  savingLabel,
  savedLabel,
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
  // Defaults resolve through the dictionary, so a call site that doesn't pass
  // labels still speaks the interface language.
  const t = useT();
  const idle = idleLabel ?? t("Save changes");
  const saving = savingLabel ?? t("Saving…");
  const saved = savedLabel ?? t("Saved");
  return (
    <Button size="sm" variant={variant} disabled={state === "saving" || disabled} className={className} {...props}>
      {state === "saving" ? (
        <span className={cn("h-3.5 w-3.5 animate-spin rounded-full border-2", spinnerClass)} aria-hidden />
      ) : state === "saved" ? (
        <Check size={13} strokeWidth={1.5} />
      ) : (
        icon
      )}
      {state === "saving" ? saving : state === "saved" ? saved : idle}
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

/* ── Chip ───────────────────────────────────────────────────
   ONE CHIP GEOMETRY FOR THE WHOLE PORTAL — rounded-full, a 6px status dot, a
   10px uppercase label on 0.12em tracking. Every status pill in the product
   is this shape, and `StateChip` (components/workspace/chrome.tsx) is the
   same shape with readiness's own vocabulary in it.

   `toneChip` below is that pair's shared palette, lifted out of StateChip so
   the two cannot drift. It is the one place a tone becomes a colour, and the
   values are StateChip's own: a 0.18-alpha border of the text colour over a
   pale tint of it, which is what keeps a chip legible at 10px without
   shouting. */
export const toneChip: Record<Tone, string> = {
  ok: "border-[rgba(5,150,105,0.18)] bg-[#ecfdf5] text-[#047857]",
  info: "border-[rgba(29,78,216,0.18)] bg-[#eff6ff] text-[#1d4ed8]",
  warn: "border-[rgba(180,83,9,0.18)] bg-[#fffbeb] text-[#b45309]",
  err: "border-[rgba(220,38,38,0.18)] bg-[#fef2f2] text-[#dc2626]",
  muted: "border-black/[0.08] bg-black/[0.02] text-black/50",
};

export function Chip({
  children,
  tone = "muted",
  pulse,
  filled,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  pulse?: boolean;
  /* THE DEFAULT CHIP IS GREY WITH A COLOURED DOT, and that is right where a
     chip is a label that happens to have a state — one pill beside a heading,
     read once. It is wrong in a COLUMN of them: five states rendered as five
     grey pills makes the reader parse a 6px dot on every row of a table they
     came to triage. `filled` is for that case, and it gives the chip exactly
     the colours StateChip already uses everywhere else in the portal, so a
     late row and a blocked tab are the same red to the same reader.

     Left as a prop rather than made the default so no existing chip changes
     appearance — this widens the vocabulary, it does not restate it. */
  filled?: boolean;
  className?: string;
}) {
  const live = tone === "ok";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em]",
        filled ? toneChip[tone] : live ? toneChip.ok : "border-black/10 bg-black/[0.03] text-black/45",
        className,
      )}
    >
      <StatusDot tone={tone} pulse={pulse ?? live} glow={live} />
      {children}
    </span>
  );
}

/* ── Filter chip (toggleable) ───────────────────────────── */
export function FilterChip({
  children,
  active,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      /* A filter changes what you are LOOKING at, never what is stored, so it
         keeps working on a read-only account — see components/account-lock.tsx.
         Marked on the primitive rather than at each of the two dozen call
         sites, which is also what stops the next filter from forgetting. */
      data-lock="allow"
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] transition-colors",
        active ? "border-transparent bg-[#111] text-white" : "border-black/10 text-black/50 hover:border-black/25 hover:text-black",
      )}
    >
      {children}
    </button>
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

/* ── Form field ─────────────────────────────────────────────
   ONE PLACE MARKS A FIELD OPTIONAL, and it is beside the label.

   It used to be said two ways — "· optional" after the label on some fields,
   the word "Optional." as the first sentence of the hint under the box on
   others — often in the same row of the same form. Two spellings of one fact
   read as two different facts: a reader who has learned to look under the box
   does not see the marker beside the label, and vice versa, so they end up
   checking both places for every field.

   So the marker is a PROP, not prose. It renders in exactly one position, the
   hint underneath is free to say something the marker does not, and no call
   site can invent a third spelling. `OptionalTag` is exported for the handful
   of places that cannot use <Field> — a label wrapping two controls forwards
   every click to the first one, so the phone row builds its own label — and
   they get the identical markup rather than a lookalike. */
export function OptionalTag() {
  const t = useT();
  return <span className="normal-case tracking-normal text-black/30">{t("· optional")}</span>;
}

export function FieldLabel({ label, optional, children }: { label: string; optional?: boolean; children?: React.ReactNode }) {
  return (
    <span className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-black/55">
      {label}
      {optional && <OptionalTag />}
      {children}
    </span>
  );
}

export function Field({
  label,
  hint,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  /** Marked here rather than written into `hint`. See the note above. */
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <FieldLabel label={label} optional={optional} />
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

/* The disabled state is on the shared class rather than added per call site,
   so a locked form LOOKS locked everywhere. Without it a disabled input is
   pixel-identical to an editable one and the only way to find out is to click
   it and have nothing happen. */
export const inputClass =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black/70 placeholder:text-black/25 focus:border-black/25 focus:outline-none transition-colors disabled:cursor-not-allowed disabled:border-black/[0.07] disabled:bg-black/[0.02] disabled:text-black/40 disabled:placeholder:text-black/15";

/* ── Numeric input ──────────────────────────────────────────
   Every number on the verification screens goes through this, and it exists
   because the obvious spelling is broken in a way that is invisible until
   somebody types a decimal:

     value={entry.tonnes || ""} onChange={(e) => set(Number(e.target.value))}

   Type "0." and `Number("0.")` is 0, `0 || ""` is "", and the field empties
   underneath the cursor. Type "0.5" and it never survives the "0". So the
   component keeps the RAW STRING the operator typed and reports the parsed
   number alongside it — the display is what they wrote, the model is what it
   means, and the two only re-sync when the value changes from outside.

   `max` is a real clamp, not a hint: a percentage field that accepts 140%
   pushes an impossible figure into a filing (§22). `unit` renders BELOW the
   field rather than inside the label, because a unit hanging off a label
   reads as part of the question rather than as the unit of the answer (§19).*/
export function NumberInput({
  value,
  onChange,
  min,
  max,
  unit,
  placeholder,
  disabled,
  invalid,
  className,
  inputClassName,
  ariaLabel,
}: {
  value: number | undefined | null;
  /** undefined when the field is cleared, so "not answered" stays different from 0 */
  onChange: (v: number | undefined) => void;
  min?: number;
  max?: number;
  /** locked unit shown under the field — "t", "%", "MWh" */
  unit?: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  /** classes for the input box itself (className styles the wrapper) */
  inputClassName?: string;
  ariaLabel?: string;
}) {
  const external = value == null || Number.isNaN(value) ? "" : String(value);
  const [draft, setDraft] = React.useState(external);

  // Re-sync only when the outside value stops matching what the draft means.
  // Comparing the parsed draft rather than the text is what lets "0." and
  // "1.50" survive a re-render that carries the same number back down.
  React.useEffect(() => {
    const parsed = draft.trim() === "" ? null : Number(draft.replace(/,/g, ""));
    const incoming = value == null || Number.isNaN(value) ? null : value;
    if (parsed !== incoming && !(parsed != null && incoming != null && parsed === incoming)) setDraft(external);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [external]);

  const clamped = React.useMemo(() => {
    const n = Number(draft.replace(/,/g, ""));
    if (draft.trim() === "" || !Number.isFinite(n)) return null;
    return n;
  }, [draft]);

  const over = clamped != null && max != null && clamped > max;
  const under = clamped != null && min != null && clamped < min;

  const commit = (raw: string) => {
    // Allow the intermediate states a decimal number passes through — "", "-",
    // "0.", ".5" — without destroying them, but never store a non-number.
    if (!/^-?\d*[.,]?\d*$/.test(raw)) return;
    setDraft(raw);
    const n = Number(raw.replace(/,/g, "."));
    if (raw.trim() === "") onChange(undefined);
    else if (Number.isFinite(n)) onChange(n);
  };

  // Clamp on blur rather than on keystroke: clamping live means typing "100"
  // into a max-100 field gets stuck at "1" → "10" is fine but "1000" silently
  // becomes 100 mid-keystroke, which is worse than a visible correction.
  const blur = () => {
    if (clamped == null) return;
    let next = clamped;
    if (max != null && next > max) next = max;
    if (min != null && next < min) next = min;
    if (next !== clamped) {
      setDraft(String(next));
      onChange(next);
    }
  };

  return (
    <div className={className}>
      <div className="relative">
        <input
          className={cn(inputClass, inputClassName, (invalid || over || under) && "border-[#dc2626]", unit && "pr-14")}
          inputMode="decimal"
          autoComplete="off"
          aria-label={ariaLabel}
          disabled={disabled}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => commit(e.target.value)}
          onBlur={blur}
        />
        {unit && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[12px] text-black/35">{unit}</span>
        )}
      </div>
      {over && <span className="mt-1.5 block text-[11px] text-[#dc2626]">Cannot be more than {max}{unit ? ` ${unit}` : ""}.</span>}
      {under && <span className="mt-1.5 block text-[11px] text-[#dc2626]">Cannot be less than {min}{unit ? ` ${unit}` : ""}.</span>}
    </div>
  );
}

/* ── Help tip ───────────────────────────────────────────────
   A "?" beside a heading that opens the rule behind it. Used where a field is
   answerable but the CONSEQUENCE of the answer is not obvious — the reporting
   period being the clearest case: nothing on the screen tells an exporter that
   changing a production process mid-year means a second report rather than an
   edited one.

   IT IS PORTALED AND CLAMPED, for the same reason every popover in
   controls.tsx is. It used to be `absolute right-0 top-8` inside whatever
   element held the "?", which breaks in two ways that only show up once the
   window is narrow or the tip sits low on the page:

     · A "?" near the right edge of a modal, a card or a phone screen pushed a
       fixed 300px panel off-screen — the reader saw a sliver and could not
       scroll to the rest, because the panel was clipped by an ancestor's
       overflow rather than by the window.
     · A "?" in the last row of a long form opened downward into space below
       the fold.

   So the panel renders through a portal at the top of the stacking order, is
   measured, and is then placed against the trigger but ALWAYS fully inside the
   viewport: below if it fits, above if that fits better, otherwise clamped —
   and its width shrinks with the window rather than staying 300px. */
const HELP_TIP_WIDTH = 300;

export function HelpTip({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const [style, setStyle] = React.useState<React.CSSProperties>({ position: "fixed", top: -9999, left: -9999, visibility: "hidden" });

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
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

  React.useEffect(() => {
    if (!open) return;
    let raf = 0;
    const place = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const r = trigger.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 12;
      const gap = 8;
      const width = Math.min(HELP_TIP_WIDTH, vw - margin * 2);
      const maxHeight = Math.min(420, vh - margin * 2);
      const h = Math.min(panelRef.current?.offsetHeight ?? 0, maxHeight) || 0;

      let top: number;
      if (r.bottom + gap + h <= vh - margin) top = r.bottom + gap;
      else if (r.top - gap - h >= margin) top = r.top - gap - h;
      else top = Math.max(margin, Math.min(r.bottom + gap, vh - margin - h));

      // Right-aligned to the "?" by preference — the tip reads as hanging off
      // the thing it explains — then clamped so neither edge leaves the window.
      let left = r.right - width;
      left = Math.max(margin, Math.min(left, vw - margin - width));

      setStyle({ position: "fixed", top: Math.round(top), left: Math.round(left), width, maxHeight, zIndex: 500, visibility: "visible" });
    };
    place();
    raf = requestAnimationFrame(place);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  return (
    <span className={cn("relative inline-flex", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-lock="allow"
        aria-label={title ? `Help: ${title}` : "Help"}
        aria-expanded={open}
        className={cn(
          "grid h-6 w-6 flex-none place-items-center rounded-full border transition-colors",
          open ? "border-black/30 bg-[#f0eee8] text-black/70" : "border-black/12 text-black/35 hover:border-black/25 hover:text-black/70",
        )}
      >
        <HelpCircle size={13} strokeWidth={1.5} />
      </button>
      {open &&
        mounted &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            style={{ ...style, boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06)", overscrollBehavior: "contain" }}
            className="ct-pop overflow-y-auto rounded-xl border border-black/[0.08] bg-white p-4 text-left normal-case tracking-normal"
          >
            {title && <div className="mb-1.5 text-[11px] uppercase tracking-[0.1em] text-black/45">{title}</div>}
            <div className="text-[12.5px] font-normal leading-relaxed text-black/60">{children}</div>
          </div>,
          document.body,
        )}
    </span>
  );
}

/* ── Modal ──────────────────────────────────────────────────
   Portaled so it clears every sticky header and blurred panel on the page,
   and scroll-locked so the page behind it does not move while a wizard step
   is open.

   IT IS BOUNDED BY THE VIEWPORT, NOT BY A FRACTION OF IT. The body used to be
   `max-h-[68vh]` on a dialog that also carried a header and a footer, so the
   whole thing could measure well over 100vh: on a 375×812 phone the
   installation form rendered 796px of dialog inside 812px of screen with 30px
   of padding above it, which put SAVE INSTALLATION 14px below the fold. The
   overlay scrolled, so the button was reachable — by scrolling an overlay that
   looks like a backdrop, past a dialog that looks complete. Every reader who
   did not try that concluded the form could not be submitted.

   So the dialog is capped at the visible height and laid out as a column: the
   header and footer are `flex-none` and always on screen, and the BODY is the
   only part that scrolls. `100dvh` rather than `100vh` because mobile Safari's
   `vh` includes the collapsing address bar, which is the same 60–80px error
   again on the devices least able to absorb it. */
export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  lead,
  footer,
  children,
  width = "max-w-2xl",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  lead?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  width?: string;
  /** extra classes on the dialog panel */
  className?: string;
}) {
  const t = useT();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/25 p-4 backdrop-blur-[2px] sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        /* max-h is the visible height less this container's own padding, so
           the dialog can never extend past the screen it is centred in. */
        className={cn(
          "ct-enter flex max-h-[calc(100dvh-2rem)] w-full flex-col rounded-2xl border border-black/[0.07] bg-white sm:max-h-[calc(100dvh-3rem)]",
          width,
          className,
        )}
        style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.16)" }}
      >
        <div className="flex flex-none items-start justify-between gap-4 border-b border-black/[0.06] px-6 py-5">
          <div className="min-w-0">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            <h2 className="mt-1.5 font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#111]">{title}</h2>
            {lead && <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-black/45">{lead}</p>}
          </div>
          <button type="button" onClick={onClose} data-lock="allow" aria-label={t("Close")} className="-mr-1 -mt-1 flex-none rounded-lg p-2 text-black/30 hover:bg-black/[0.04] hover:text-black">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
        {/* min-h-0 is what makes the flex child actually shrink: a flex item's
            default min-height is `auto`, so without it the body sizes to its
            content and pushes the footer back off the bottom — the exact bug
            this layout exists to fix. overscroll-contain stops a flick at the
            end of the list from scrolling the page behind the dialog. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">{children}</div>
        {footer && (
          <div className="flex flex-none flex-wrap items-center justify-end gap-3 border-t border-black/[0.06] px-6 py-4">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* ── Auto-save ──────────────────────────────────────────────
   The verification workspace is not a form somebody completes in one sitting —
   it is a year of readings entered by whoever is at the plant that week. A
   "Save draft" button in that setting is a way to lose an afternoon, so every
   field on those screens writes on its own and SAYS SO.

   Saying so is the part that matters. Auto-save without a visible state is
   indistinguishable from auto-save that is broken, so the hook exposes the
   status and `AutoSaveBadge` renders it in one shared shape. */
export type AutoSaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

export function useAutoSave<T>(value: T, save: (v: T) => void, { delayMs = 600, enabled = true }: { delayMs?: number; enabled?: boolean } = {}) {
  const [status, setStatus] = React.useState<AutoSaveStatus>("idle");
  const [savedAt, setSavedAt] = React.useState<Date | null>(null);
  const saveRef = React.useRef(save);
  saveRef.current = save;
  // The first value a screen renders is the value it just loaded. Writing that
  // straight back would stamp "saved" on a file nobody has touched.
  const primed = React.useRef(false);

  /* ── Why the value is compared BY CONTENT ──────────────────────
     The effect used to depend on `value` by reference, and the supplier
     portal passes an inline object — `useAutoSave({ entry, mmd, installation }, …)`
     — which is a fresh identity on every render. That produced a loop nobody
     could see the shape of from the outside:

       effect runs → setStatus("pending") → re-render → NEW object literal →
       effect runs again → clears the pending timer → setStatus("pending") …

     and when a timer did survive, `setStatus("saving")` and
     `setSavedAt(new Date())` each triggered another render, another new
     literal, and another restart. The badge sat on "Unsaved changes…"
     indefinitely on an idle form, the same data was written over and over,
     and on a slow phone the form stuttered while typing.

     Serialising is the honest fix: the hook's contract is "save this data
     when it changes", and data equality is what that means. Callers must not
     be required to memoise — the one that forgot is exactly the one that
     broke, and it broke silently. */
  const serialised = React.useMemo(() => {
    try {
      return JSON.stringify(value);
    } catch {
      // Circular or non-serialisable: fall back to identity, which is the old
      // behaviour rather than a crash.
      return null;
    }
  }, [value]);
  const lastSaved = React.useRef<string | null>(null);
  const valueRef = React.useRef(value);
  valueRef.current = value;

  React.useEffect(() => {
    if (!enabled) return;
    if (!primed.current) {
      primed.current = true;
      lastSaved.current = serialised;
      return;
    }
    // Nothing actually changed — a re-render for some other reason.
    if (serialised !== null && serialised === lastSaved.current) return;
    setStatus("pending");
    const t = window.setTimeout(() => {
      setStatus("saving");
      try {
        saveRef.current(valueRef.current);
        // Recorded BEFORE the state updates that follow, so the re-render they
        // cause sees the value as already saved and does not re-arm the timer.
        lastSaved.current = serialised;
        setSavedAt(new Date());
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, delayMs);
    return () => window.clearTimeout(t);
  }, [serialised, delayMs, enabled]);

  const flush = React.useCallback(() => {
    try {
      saveRef.current(valueRef.current);
      lastSaved.current = serialised;
      setSavedAt(new Date());
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, [serialised]);

  return { status, savedAt, flush };
}

export function AutoSaveBadge({ status, savedAt, className }: { status: AutoSaveStatus; savedAt?: Date | null; className?: string }) {
  const t = useT();
  const { locale } = useFormat();
  /* The clock follows the interface language too — a Thai reader gets Thai
     digits' grouping and the 24-hour form their locale uses, rather than
     en-GB's, which is what this was pinned to. */
  const time = savedAt ? savedAt.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }) : null;
  const map: Record<AutoSaveStatus, { label: string; tone: string }> = {
    idle: { label: t("All changes saved"), tone: "text-black/35" },
    pending: { label: t("Unsaved changes…"), tone: "text-black/45" },
    saving: { label: t("Saving…"), tone: "text-black/45" },
    saved: {
      label: time ? t("Saved automatically at {time}", { time }) : t("Saved automatically"),
      tone: "text-[#047857]",
    },
    error: { label: t("Could not save — copy your entries before leaving"), tone: "text-[#dc2626]" },
  };
  const { label, tone } = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px]", tone, className)} aria-live="polite">
      {status === "saving" || status === "pending" ? (
        <span className={cn("h-2.5 w-2.5 rounded-full border-2 border-black/15 border-t-black/45", status === "saving" && "animate-spin")} aria-hidden />
      ) : status === "saved" ? (
        <Check size={12} strokeWidth={2} />
      ) : (
        <StatusDot tone={status === "error" ? "err" : "muted"} />
      )}
      {label}
    </span>
  );
}

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

/* ── English-only notice ────────────────────────────────────
   Article 5(6) requires the monitoring methodology in English; Article 10(4)
   requires the operator's emissions report in English. Neither is a Certrace
   preference and neither is negotiable, and the cost of learning it late is
   the whole year: a boundary description, twelve months of notes and every
   exclusion ground written in Thai have to be retyped before a verifier can
   start, by which point the deadline is the problem.

   So it is stated where the typing happens rather than buried in onboarding —
   once per portal, at the top, small enough to live there permanently. The
   "why" sits behind the "?" so the strip stays one line.

   NUMBERS ARE NOT TEXT. Nobody has to translate 41,300 — saying "everything in
   English" at a screen that is mostly numeric fields reads as a bigger ask
   than it is, and an exporter who thinks the ask is bigger than it is waits
   for a translator instead of typing. */
/* `scope` names WHAT has to be in English on the screen it sits above —
   "everything you type" by default, "the boundary description" on a form that
   only takes one field. It arrives as an English phrase and is translated
   here, at the render, so a caller can keep passing a plain literal; the
   dictionary is keyed by the English source string, so `t(scope)` resolves
   exactly as a literal would. */
export function EnglishOnlyNotice({ className, scope = "everything you type" }: { className?: string; scope?: string }) {
  const t = useT();
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-[#3C7ACB]/20 bg-[#3C7ACB]/[0.045] px-3.5 py-2.5 text-[12px] leading-relaxed text-black/60",
        className,
      )}
    >
      <Languages size={14} strokeWidth={1.5} className="mt-[2px] flex-none text-[#3C7ACB]" />
      <p className="min-w-0">
        <span className="text-black/80">{t("Please write {scope} in English", { scope: t(scope) })}</span>{" "}
        {t("— an EU-accredited verifier reads it. Numbers and dates stay as they are.")}
      </p>
      <EnglishWhyTip className="ml-auto flex-none" />
    </div>
  );
}

/* ── Why English, said once ─────────────────────────────────────
   The strip above, the "?" beside a form heading and the "?" on a supplier's
   own link all answer the same question, so they answer it out of one place.
   Two copies of a regulatory citation are two things to keep in step, and the
   one that drifts is always the one nobody is looking at.

   IT IS SHORT ON PURPOSE. A reader presses "?" because they are mid-form and
   want to know whether this applies to them; three sentences answer that, and
   a fourth loses the two who most needed the first. The article references
   stay because they are what turns "our preference" into "the rule". */
export function EnglishWhyBody() {
  const t = useT();
  return (
    <>
      <p>
        {t("An EU-accredited verifier reads this. Implementing Regulation (EU) 2025/2547 puts it in writing — the monitoring methodology under Article 5(6), the emissions report under Article 10(4).")}
      </p>
      <p className="mt-2">{t("Anything in Thai has to be translated before verification can start. English now is the same work done once, not twice.")}</p>
      <p className="mt-2 text-black/45">
        {t("Numbers, dates, CN codes and meter references stay as they are. If a machine only has a Thai name, write it in English with the Thai in brackets.")}
      </p>
    </>
  );
}

/** The "?" on its own — for a heading that is not a whole form. */
export function EnglishWhyTip({ className }: { className?: string }) {
  const t = useT();
  return (
    <HelpTip title={t("Why English?")} className={className}>
      <EnglishWhyBody />
    </HelpTip>
  );
}

/** One line of highlighted instruction, for a card that already carries prose
    and only needs the rule attached to it — see the supplier link's "What this
    is for". The "?" rides with it, so the reason is never more than a tap
    away from the instruction. */
export function EnglishOnlyLine({ className }: { className?: string }) {
  const t = useT();
  return (
    <p className={cn("flex items-start gap-2 text-[12.5px] leading-relaxed text-black/60", className)}>
      <Languages size={14} strokeWidth={1.5} className="mt-[2px] flex-none text-[#3C7ACB]" />
      <span className="min-w-0">
        <strong className="font-medium text-black/85">{t("Write everything in English.")}</strong> {t("An EU-accredited verifier reads it, and anything in Thai has to be translated first. Numbers and dates stay as they are.")}
      </span>
      <EnglishWhyTip className="ml-auto flex-none" />
    </p>
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
