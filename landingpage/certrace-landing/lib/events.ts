/* ════════════════════════════════════════════════════════════
   EVENTS — where you can meet us

   Dates and places are facts and live here once. Everything a reader actually
   reads — the summary, why it matters, what we are doing there — is copy and
   lives in EVENT_TEXT, one block per language.

   PROVISIONAL FIELDS. Some details on the two upcoming shows are not published
   yet (exact hall, booth number, session slot). They are marked `provisional`
   rather than invented into certainty, and the page prints them under a
   "details to be confirmed" note. Replace them, don't delete the flag until
   they're confirmed.

   UPCOMING vs PAST is derived from the end date at render time, never stored —
   a stored flag goes stale the morning after the show.
   ════════════════════════════════════════════════════════════ */

export type EventKind = "expo" | "conference" | "seminar";

export type CertraceEvent = {
  slug: string;
  kind: EventKind;
  /** poster or photograph, 4:5-ish, in /public/events */
  image: string;
  /** ISO dates, inclusive. A one-day event has start === end. */
  start: string;
  end: string;
  /** local clock, 24h, when a time is published. Omitted when it is not. */
  timeStart?: string;
  timeEnd?: string;
  venue: string;
  city: string;
  country: string;
  /** the organiser's own page, when there is one to link to */
  href?: string;
  /** true while any of venue/time/stand is still to be confirmed */
  provisional?: boolean;
  /** links this event to a post under /updates, when we wrote one */
  updateSlug?: string;
};

export const EVENTS: CertraceEvent[] = [
  {
    slug: "kmitl-expo-2026",
    kind: "expo",
    image: "/events/kmitl-expo-2026.jpg",
    start: "2026-09-01",
    end: "2026-09-06",
    venue: "King Mongkut's Institute of Technology Ladkrabang",
    city: "Bangkok",
    country: "Thailand",
    provisional: true,
  },
  {
    slug: "telecomsworld-asia-2026",
    kind: "conference",
    image: "/events/telecomsworld-asia-2026.jpg",
    start: "2026-10-27",
    end: "2026-10-28",
    venue: "Centara Grand & Bangkok Convention Centre, CentralWorld",
    city: "Bangkok",
    country: "Thailand",
    provisional: true,
  },
  {
    slug: "tgo-chula-cbam-phase-3",
    kind: "seminar",
    image: "/news/tgo-chula-cbam-1.jpg",
    start: "2026-08-14",
    end: "2026-08-14",
    timeStart: "09:00",
    timeEnd: "15:00",
    venue: "Chulalongkorn University",
    city: "Bangkok",
    country: "Thailand",
    provisional: true,
    updateSlug: "tgo-chula-cbam-seminar",
  },
];

/** Newest first for the upcoming list, most recent first for the past one —
    both handled by the page; this only guarantees a stable base order. */
export const eventBySlug = (slug: string) => EVENTS.find((e) => e.slug === slug);

/** An event is past once its last day is over. Compared on date only, so an
    event running today still counts as upcoming all day. */
export function isUpcoming(event: CertraceEvent, now = new Date()): boolean {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = event.end.split("-").map(Number);
  return new Date(y, m - 1, d).getTime() >= today.getTime();
}

/* ── Add to calendar ────────────────────────────────────────
   Google's template URL. All-day events use exclusive end dates (a 1–6 Sept
   event ends on the 7th), which is the single most common mistake with this
   API — an inclusive end silently drops the last day from the calendar. */
export function googleCalendarUrl(
  event: CertraceEvent,
  title: string,
  details: string,
): string {
  const compact = (iso: string) => iso.replace(/-/g, "");
  const plusOneDay = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    const next = new Date(Date.UTC(y, m - 1, d + 1));
    return next.toISOString().slice(0, 10).replace(/-/g, "");
  };

  const dates =
    event.timeStart && event.timeEnd
      ? `${compact(event.start)}T${event.timeStart.replace(":", "")}00/${compact(
          event.end,
        )}T${event.timeEnd.replace(":", "")}00`
      : `${compact(event.start)}/${plusOneDay(event.end)}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates,
    details,
    location: `${event.venue}, ${event.city}, ${event.country}`,
    /* Bangkok for every event so far. When one is held elsewhere this becomes
       a field on the event rather than a constant. */
    ctz: "Asia/Bangkok",
  });

  return `https://www.google.com/calendar/render?${params.toString()}`;
}
