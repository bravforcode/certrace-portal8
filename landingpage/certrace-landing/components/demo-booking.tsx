"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CONTACT_EMAIL } from "@/lib/content";
import { DATE_LOCALE, useLang } from "@/lib/i18n";
import { calendarDayString, leadLocaleFields, postToSheet } from "@/lib/sheet-sync";
import { SelectChevron } from "./form-fields";
import {
  TIME_ZONE_REGIONS,
  calendarDayInZone,
  detectZone,
  wallTimeInstant,
  withDetectedZone,
  zoneLabel,
} from "@/lib/timezones";

/* Three-step booking dialog that opens once the demo form is submitted:
   (1) a short qualification pass, (2) day + time selection, (3) confirmation.

   The completed booking is posted to the lead sheet (lib/sheet-sync.ts), but
   no real calendar is touched and no invite is issued, so every string here
   has to stay honest about being a booking *request*: "invite on its way",
   never "meeting created". */

export type Booking = {
  /* Midnight of the chosen day, as a floating calendar date in the selected
     zone — not an instant. See `calendarDayInZone`. */
  date: Date;
  /* 24h "HH:MM" — the slot label as shown, in the selected zone */
  time: string;
  /* e.g. "Bangkok, Thailand (GMT+7)" */
  timeZoneLabel: string;
};

/* The full record the demo form collected, carried through so the booking
   post describes the same person rather than a three-field subset of them. */
type Lead = {
  firstName: string;
  lastName?: string;
  email: string;
  countryCode?: string;
  phone?: string;
  company: string;
  jobTitle?: string;
  sector?: string;
  employees?: string;
};

/* Half-hour slots across a working day, read in whichever zone the visitor has
   selected: the grid is the shape of *their* day, so someone booking from
   Hamburg picks 09:00–16:30 Hamburg time. Which of them a given date offers is
   derived from the date itself (see `slotsFor`) so the grid is stable — paging
   back and forth doesn't reshuffle availability. */
const BASE_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
];

const DAY_MS = 86_400_000;

function startOfDay(d: Date) {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function addDays(d: Date, n: number) {
  return startOfDay(new Date(d.getTime() + n * DAY_MS));
}

function isWeekend(d: Date) {
  return d.getDay() === 0 || d.getDay() === 6;
}

/* Stable pseudo-availability: seeded on the calendar date, so a Tuesday three
   weeks out always shows the same set. Roughly 8-10 of the 14 slots survive.

   The two-hour lead time is the one rule that has to cross zones properly: the
   slot is a wall-clock time in `zone`, so it is resolved to a real instant
   before being compared with now. Reading it as a local time instead would let
   a visitor twelve hours away book a call that already happened. */
function slotsFor(day: Date, now: Date, zone: string) {
  if (isWeekend(day)) return [];
  const seed =
    day.getFullYear() * 10_000 + (day.getMonth() + 1) * 100 + day.getDate();
  /* Two hours of lead time — nobody should be able to book a call that starts
     in ten minutes. */
  const earliest = now.getTime() + 2 * 60 * 60 * 1000;

  return BASE_SLOTS.filter((slot, i) => {
    const hash = (seed * 9301 + (i + 1) * 49_297) % 233_280;
    if (hash / 233_280 <= 0.36) return false;
    const [h, m] = slot.split(":").map(Number);
    const at = wallTimeInstant(
      zone,
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      h,
      m,
    );
    return at >= earliest;
  });
}

/* The first day from `from` that has any slot left, so step 2 never opens on
   an empty grid — after a zone change as much as on first open. */
function firstOpenDay(from: Date, now: Date, zone: string) {
  for (let i = 0; i < 21; i++) {
    const candidate = addDays(from, i);
    if (slotsFor(candidate, now, zone).length) return candidate;
  }
  return from;
}

const labelClass =
  "block text-[11px] tracking-widest uppercase text-black/55 font-medium mb-2.5";

function chipClass(active: boolean) {
  return `px-3 py-2 rounded-[10px] border text-xs transition-colors ${
    active
      ? "border-[#111] bg-[#111] text-white"
      : "border-black/10 bg-white text-black/60 hover:border-black/25 hover:text-black"
  }`;
}

function ChipGroup({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: string[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <fieldset>
      <legend className={labelClass}>{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            /* Clicking the active chip again clears it, so a mis-tap has a way
               back out rather than being locked in. */
            onClick={() => onChange(value === option ? "" : option)}
            aria-pressed={value === option}
            className={chipClass(value === option)}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function StepRail({ step, labels }: { step: number; labels: string[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {labels.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const current = step === n;
        return (
          <li key={label} className="flex items-center gap-3">
            <span
              className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] shrink-0 transition-colors ${
                done
                  ? "border-[#111] bg-[#111] text-white"
                  : current
                    ? "border-[#111] text-[#111]"
                    : "border-black/15 text-black/30"
              }`}
            >
              {done ? (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M2 5.2 4 7.2 8 2.8" />
                </svg>
              ) : (
                n
              )}
            </span>
            <span
              className={`text-xs transition-colors ${
                current ? "text-black/80" : done ? "text-black/45" : "text-black/30"
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function DemoBookingModal({
  open,
  lead,
  onClose,
  onComplete,
}: {
  open: boolean;
  lead: Lead;
  onClose: () => void;
  onComplete: (booking: Booking) => void;
}) {
  const { lang, c } = useLang();
  const b = c.booking;

  const [step, setStep] = useState(1);
  const [decision, setDecision] = useState("");
  const [budget, setBudget] = useState("");
  const [timing, setTiming] = useState("");
  const [source, setSource] = useState("");
  const [sourceOther, setSourceOther] = useState("");
  const [context, setContext] = useState("");

  /* `now` is frozen when the dialog opens: slot filtering and "is this day in
     the past" both read it, and a value that drifts mid-session could drop the
     slot the user is looking at. */
  const [now, setNow] = useState<Date | null>(null);
  const [weekStart, setWeekStart] = useState<Date | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [booked, setBooked] = useState<Booking | null>(null);

  /* Detected on open rather than at module load: the value is read from the
     browser, so it has to stay out of the server-rendered pass, and a visitor
     who changes their machine's zone between page load and booking gets the
     new one. Empty until then — the dialog renders nothing before `now` is
     set either. */
  const [zone, setZone] = useState("");

  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* The dialog renders into <body>, not in place. Its markup lives inside
     `#demo` → `div.relative.z-10`, which is a stacking context: a `z-[70]`
     child of a `z-10` parent still loses to the `z-50` header and to any
     later section, so the header sat on top of the overlay and the closing
     marquee band covered the panel's footer. A portal puts it back in the
     root stacking context, above everything. */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /* Fresh state every time it opens, and the first bookable day pre-selected
     so step 2 never lands on an empty slot grid. */
  useEffect(() => {
    if (!open) return;
    const today = new Date();
    const detected = detectZone();
    /* "Today" is the selected zone's calendar date, not the machine's: at
       23:00 in Bangkok it is still the previous afternoon in Berlin, and a
       Berlin visitor should be offered that afternoon. */
    const start = calendarDayInZone(detected, today);

    setStep(1);
    setNow(today);
    setZone(detected);
    setWeekStart(start);
    setSelectedDay(firstOpenDay(start, today, detected));
    setSelectedTime("");
    setBooked(null);
  }, [open]);

  /* Changing the zone re-cuts the calendar under the visitor: the day strip
     restarts on that zone's today, and the selection moves to its first open
     day. Keeping the old selection would leave a slot on screen that the new
     zone's lead-time rule may already have ruled out. */
  const changeZone = (next: string) => {
    if (!now || next === zone) return;
    const start = calendarDayInZone(next, now);
    setZone(next);
    setWeekStart(start);
    setSelectedDay(firstOpenDay(start, now, next));
    setSelectedTime("");
  };

  /* Escape closes, and the page behind must not scroll under the dialog. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  /* Long steps scroll internally — a step change has to return to the top of
     the pane, or step 2 opens already scrolled past its own heading. */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const days = useMemo(() => {
    if (!weekStart) return [];
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const slots = useMemo(
    () => (selectedDay && now && zone ? slotsFor(selectedDay, now, zone) : []),
    [selectedDay, now, zone],
  );

  /* Labelled for the day being booked, not for today: a call in late March
     may fall on the other side of a daylight-saving change from the day the
     visitor is looking at it. */
  const tzLabel = useMemo(
    () => (zone ? zoneLabel(zone, selectedDay ?? now ?? new Date()) : ""),
    [zone, selectedDay, now],
  );

  const zoneOptions = useMemo(() => (zone ? withDetectedZone(zone) : []), [zone]);

  if (!open || !mounted) return null;

  /* Paging back stops at the selected zone's today, not the machine's — the
     two can be different calendar dates. */
  const canGoBackAWeek = !!(
    weekStart &&
    now &&
    zone &&
    weekStart > calendarDayInZone(zone, now)
  );

  /* Each of the four questions needs an answer before the step advances. The
     free-text boxes are deliberately not part of this. */
  const step1Answered = !!(decision && budget && timing && source);

  const confirm = () => {
    if (!selectedDay || !selectedTime) return;
    const booking: Booking = {
      date: selectedDay,
      time: selectedTime,
      timeZoneLabel: tzLabel,
    };
    setBooked(booking);
    setStep(3);
    onComplete(booking);

    /* "14:00" is not a time until you know whose 14:00 it is. The slot was
       picked in the visitor's zone, so the record carries that zone three
       ways: the IANA id to compute with, the label as they saw it, and the
       resolved UTC instant — the only field that survives being read from
       another zone without reconstruction. */
    const [hour, minute] = selectedTime.split(":").map(Number);
    const startUtc = new Date(
      wallTimeInstant(
        zone,
        selectedDay.getFullYear(),
        selectedDay.getMonth(),
        selectedDay.getDate(),
        hour,
        minute,
      ),
    ).toISOString();

    postToSheet({
      ...lead,
      ...leadLocaleFields(),
      type: "demo_booking",
      bookingDate: calendarDayString(selectedDay),
      bookingTime: selectedTime,
      bookingTimeZone: zone,
      bookingTimeZoneLabel: tzLabel,
      bookingStartUtc: startUtc,
      decision,
      budget,
      timing,
      source: source === "other" ? sourceOther : source,
      context,
    });
  };

  /* Dates follow the language the site is being read in, not the browser's —
     a Turkish page showing "Monday, 18 August" would be the one English string
     left in the flow. `DATE_LOCALE` maps the five site languages onto their
     locales; no format here includes a year, which is what keeps the Thai
     locale from printing Buddhist-era dates the site deliberately doesn't use. */
  const locale = DATE_LOCALE[lang];

  const longDate = (d: Date) =>
    d.toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ animation: "modalFade 0.25s var(--ease-signature) both" }}
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0"
        style={{
          background: "rgba(17,17,17,0.32)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        tabIndex={-1}
        /* `sm:grid-rows-[minmax(0,1fr)]` is load-bearing: without an explicitly
           bounded row, the grid track sizes to its content, the column overflows
           the panel's max-height, and `overflow-hidden` clips the footer — the
           step's primary button with it. */
        className="relative w-full sm:max-w-3xl max-h-[94dvh] sm:max-h-[min(88dvh,700px)] flex flex-col sm:grid sm:grid-cols-[232px_1fr] sm:grid-rows-[minmax(0,1fr)] overflow-hidden rounded-t-2xl sm:rounded-2xl border border-black/[0.08] bg-[#F5F4F0] focus:outline-none"
        style={{
          boxShadow:
            "0 40px 80px rgba(0,0,0,0.22), 0 4px 20px rgba(0,0,0,0.10)",
          animation: "modalIn 0.4s var(--ease-signature) both",
        }}
      >
        {/* Context rail. Holds the identity the form already collected, so the
            step content never has to repeat it back. */}
        <aside className="hidden sm:flex flex-col justify-between gap-8 p-6 bg-[#F0EEE8] border-r border-black/[0.06]">
          <div>
            <div className="font-pixel text-[10px] tracking-[0.2em] text-black/35 mb-4">
              {b.yourDemo}
            </div>
            <StepRail step={step} labels={b.stepLabels} />
          </div>

          <div className="space-y-4">
            <div className="h-px bg-black/[0.07]" />
            <div className="space-y-1.5 text-[11px] leading-relaxed text-black/40">
              {lead.company && <p className="text-black/60">{lead.company}</p>}
              {lead.firstName && <p>{lead.firstName}</p>}
              {lead.email && <p className="break-all">{lead.email}</p>}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-pixel tracking-[0.14em] text-black/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {b.duration}
            </div>
          </div>
        </aside>

        <div className="flex flex-col min-h-0">
          {/* Mobile progress: the rail is hidden below sm, so the step count
              has to live in the header instead. */}
          <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:pt-7">
            <div className="min-w-0">
              <div className="font-pixel text-[10px] tracking-[0.2em] text-black/35">
                {b.stepOf.replace("{n}", String(Math.min(step, 3)))}
              </div>
              <div className="mt-2 flex gap-1 sm:hidden" aria-hidden="true">
                {[1, 2, 3].map((n) => (
                  <span
                    key={n}
                    className={`h-[3px] w-8 rounded-full transition-colors ${
                      step >= n ? "bg-[#111]" : "bg-black/10"
                    }`}
                  />
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={b.close}
              className="shrink-0 w-8 h-8 -mt-1 -mr-1 rounded-lg flex items-center justify-center text-black/35 hover:text-black hover:bg-black/[0.05] transition-colors"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M2 2 12 12M12 2 2 12" />
              </svg>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-6 pt-4 pb-6">
            {step === 1 && (
              <>
                <h2
                  id="booking-title"
                  className="text-2xl sm:text-[28px] font-light tracking-tight leading-[1.15]"
                  style={{
                    fontFamily: "var(--font-ibm-plex-sans), sans-serif",
                    whiteSpace: "pre-line",
                  }}
                >
                  {b.step1Title}
                </h2>
                <p className="mt-3 text-xs text-black/45 leading-relaxed max-w-md">
                  {b.step1Intro}
                </p>

                <div className="mt-7 space-y-6">
                  <ChipGroup
                    legend={b.qDecision}
                    options={b.decision}
                    value={decision}
                    onChange={setDecision}
                  />
                  <ChipGroup
                    legend={b.qBudget}
                    options={b.budget}
                    value={budget}
                    onChange={setBudget}
                  />
                  <ChipGroup
                    legend={b.qTiming}
                    options={b.timing}
                    value={timing}
                    onChange={setTiming}
                  />
                  <div>
                    <ChipGroup
                      legend={b.qSource}
                      options={b.source}
                      value={source}
                      onChange={(next) => {
                        setSource(next);
                        if (next !== b.source[b.source.length - 1])
                          setSourceOther("");
                      }}
                    />
                    {source === b.source[b.source.length - 1] && (
                      <input
                        type="text"
                        value={sourceOther}
                        onChange={(e) => setSourceOther(e.target.value)}
                        placeholder={b.sourceOtherPlaceholder}
                        aria-label={b.sourceOtherPlaceholder}
                        className="mt-2.5 w-full bg-white border border-black/10 rounded-[10px] px-3 py-[9px] text-xs text-[#111] placeholder:text-black/35 focus:outline-none focus:border-black/25 transition-colors"
                        style={{
                          animation:
                            "fadeInUp 0.25s var(--ease-signature) both",
                        }}
                      />
                    )}
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="booking-context">
                      {b.contextLabel}
                    </label>
                    <textarea
                      id="booking-context"
                      rows={3}
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder={b.contextPlaceholder}
                      className="w-full bg-white border border-black/10 rounded-[10px] px-3 py-2.5 text-xs text-[#111] placeholder:text-black/35 focus:outline-none focus:border-black/25 transition-colors resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2
                  id="booking-title"
                  className="text-2xl sm:text-[28px] font-light tracking-tight leading-[1.15]"
                  style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif" }}
                >
                  {b.step2Title}
                </h2>
                <p className="mt-3 text-xs text-black/45 leading-relaxed">
                  {b.step2Intro}
                </p>

                {/* Zone picker. The detected zone is already selected, so this
                    is a correction rather than a question — but it has to be a
                    real control, because a visitor booking on behalf of a
                    colleague in another market needs the grid in that market's
                    hours, and everything below reads `zone`. */}
                <div className="mt-6">
                  <label htmlFor="booking-timezone" className={labelClass}>
                    {b.timeZoneLabel}
                  </label>
                  <div className="relative">
                    <select
                      id="booking-timezone"
                      value={zone}
                      onChange={(e) => changeZone(e.target.value)}
                      className="w-full appearance-none bg-white border border-black/10 rounded-[10px] pl-3 pr-9 py-2.5 text-xs text-[#111] focus:outline-none focus:border-black/25 transition-colors"
                    >
                      {TIME_ZONE_REGIONS.map((region) => {
                        const inRegion = zoneOptions.filter(
                          (z) => z.region === region,
                        );
                        if (!inRegion.length) return null;
                        return (
                          <optgroup
                            key={region}
                            label={b.timeZoneRegions[region]}
                          >
                            {inRegion.map((z) => (
                              <option key={z.id} value={z.id}>
                                {zoneLabel(z.id, selectedDay ?? now ?? undefined)}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>
                    <SelectChevron />
                  </div>
                  <p className="mt-2 text-[11px] leading-snug text-black/35">
                    {b.timeZoneHint}
                  </p>
                </div>

                <div className="mt-7">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-pixel text-[10px] tracking-[0.2em] text-black/40">
                      {b.chooseDay}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          weekStart && setWeekStart(addDays(weekStart, -7))
                        }
                        disabled={!canGoBackAWeek}
                        aria-label={b.prevWeek}
                        className="w-7 h-7 rounded-lg border border-black/[0.08] bg-white flex items-center justify-center text-black/45 hover:text-black hover:border-black/25 disabled:opacity-30 disabled:hover:border-black/[0.08] disabled:hover:text-black/45 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M6.5 2 3.5 5l3 3" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          weekStart && setWeekStart(addDays(weekStart, 7))
                        }
                        aria-label={b.nextWeek}
                        className="w-7 h-7 rounded-lg border border-black/[0.08] bg-white flex items-center justify-center text-black/45 hover:text-black hover:border-black/25 transition-colors"
                      >
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3.5 2 6.5 5l-3 3" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                    {days.map((day) => {
                      const available =
                        now && zone ? slotsFor(day, now, zone).length > 0 : false;
                      const active =
                        !!selectedDay &&
                        day.getTime() === selectedDay.getTime();
                      return (
                        <button
                          key={day.toISOString()}
                          type="button"
                          disabled={!available}
                          onClick={() => {
                            setSelectedDay(day);
                            setSelectedTime("");
                          }}
                          aria-pressed={active}
                          className={`py-2 rounded-[10px] border flex flex-col items-center gap-0.5 transition-colors ${
                            active
                              ? "border-[#111] bg-[#111] text-white"
                              : available
                                ? "border-black/[0.08] bg-white text-black/70 hover:border-black/30 hover:text-black"
                                : "border-transparent bg-black/[0.02] text-black/20 cursor-not-allowed"
                          }`}
                        >
                          <span className="font-pixel text-[9px] tracking-[0.1em] opacity-70">
                            {day
                              .toLocaleDateString(locale, { weekday: "short" })
                              .slice(0, 3)
                              .toLocaleUpperCase(locale)}
                          </span>
                          <span className="text-sm leading-none">
                            {day.getDate()}
                          </span>
                          <span className="text-[9px] leading-none opacity-60">
                            {day.toLocaleDateString(locale, { month: "short" })}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-7">
                  <div className="flex items-baseline justify-between gap-3 mb-3">
                    <div className="font-pixel text-[10px] tracking-[0.2em] text-black/40">
                      {b.chooseSlot}
                    </div>
                    {selectedDay && (
                      <div className="text-[11px] text-black/35 truncate">
                        {longDate(selectedDay)}
                      </div>
                    )}
                  </div>

                  {slots.length ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
                      {slots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          aria-pressed={selectedTime === slot}
                          className={`py-2.5 rounded-[10px] border text-xs tabular-nums transition-colors ${
                            selectedTime === slot
                              ? "border-[#111] bg-[#111] text-white"
                              : "border-black/[0.08] bg-white text-black/65 hover:border-black/30 hover:text-black"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-black/40 leading-relaxed py-3">
                      {b.noSlots}{" "}
                      <a
                        href={`mailto:${CONTACT_EMAIL}`}
                        className="text-black/70 underline underline-offset-2"
                      >
                        {CONTACT_EMAIL}
                      </a>{" "}
                      {b.noSlotsTail}
                    </p>
                  )}
                </div>
              </>
            )}

            {step === 3 && booked && (
              <div style={{ animation: "fadeInUp 0.4s var(--ease-signature) both" }}>
                <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-600/20 flex items-center justify-center">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="#047857"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 8.4 6.3 11.7 13 5" />
                  </svg>
                </div>

                <h2
                  id="booking-title"
                  className="mt-5 text-2xl sm:text-[28px] font-light tracking-tight leading-[1.15]"
                  style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif" }}
                >
                  {lead.firstName
                    ? `${b.bookedTitle}, ${lead.firstName}.`
                    : `${b.bookedTitle}.`}
                </h2>

                <div className="mt-6 p-5 rounded-xl border border-black/[0.08] bg-white">
                  <div className="font-pixel text-[10px] tracking-[0.2em] text-black/35">
                    {b.yourSlot}
                  </div>
                  <div className="mt-2 text-lg font-light tracking-tight">
                    {longDate(booked.date)} · {booked.time}
                  </div>
                  <div className="mt-1.5 text-[11px] text-black/40">
                    {b.onlineDetail} · {booked.timeZoneLabel}
                  </div>
                  {lead.email && (
                    <div className="mt-4 pt-4 border-t border-black/[0.06] text-[11px] text-black/45 leading-relaxed">
                      {b.inviteTo}{" "}
                      <span className="text-black/70 break-all">{lead.email}</span>.
                    </div>
                  )}
                </div>

                <p className="mt-6 text-[11px] text-black/30 leading-relaxed">
                  {b.reschedule} {CONTACT_EMAIL} {b.rescheduleTail}
                </p>
              </div>
            )}
          </div>

          <div className="shrink-0 px-6 py-4 border-t border-black/[0.06] bg-[#FAF9F7]">
            {/* One action only — the close button in the header is the way
                out, so a second "not now" was just an exit sitting next to
                the thing we're asking them to do. */}
            {step === 1 && (
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!step1Answered}
                className="w-full px-6 py-3 rounded-[10px] bg-[#111] text-white text-[12px] tracking-widest font-medium hover:bg-[#333] active:bg-black disabled:bg-black/15 disabled:text-white/70 disabled:cursor-not-allowed transition-colors"
              >
                {b.chooseTime}
              </button>
            )}

            {step === 2 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-[10px] text-[12px] tracking-widest text-black/45 hover:text-black hover:bg-black/[0.05] transition-colors"
                >
                  {c.common.back}
                </button>
                <button
                  type="button"
                  onClick={confirm}
                  disabled={!selectedTime}
                  className="flex-1 px-6 py-3 rounded-[10px] bg-[#111] text-white text-[12px] tracking-widest font-medium hover:bg-[#333] active:bg-black disabled:bg-black/15 disabled:text-white/70 disabled:cursor-not-allowed transition-colors"
                >
                  {selectedTime && selectedDay
                    ? `${b.confirmPrefix} ${selectedDay
                        .toLocaleDateString(locale, {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })
                        /* Turkish "Eki" (October) uppercases to "EKİ", not
                           "EKI" — the locale-aware call is the difference
                           between a month abbreviation and a typo. */
                        .toLocaleUpperCase(locale)} · ${selectedTime}`
                    : b.selectToConfirm}
                </button>
              </div>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={onClose}
                className="w-full px-6 py-3 rounded-[10px] bg-[#111] text-white text-[12px] tracking-widest font-medium hover:bg-[#333] active:bg-black transition-colors"
              >
                {c.common.close}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
