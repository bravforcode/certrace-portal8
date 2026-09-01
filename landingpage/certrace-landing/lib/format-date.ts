import { DATE_LOCALE, type Lang } from "./i18n";

/* Dates on the events and updates pages.

   Deliberately no year in the Buddhist era: `th-TH` renders 2026 as 2569, and
   this site does not use that calendar anywhere else — a poster saying
   1–6 September 2026 next to a card saying 2569 reads as two different events.
   So the year is appended from the Gregorian value and only the day and month
   are localised. */
export function formatDate(iso: string, lang: Lang): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dayMonth = date.toLocaleDateString(DATE_LOCALE[lang], {
    day: "numeric",
    month: "long",
  });
  return `${dayMonth} ${y}`;
}

/** A run of days, collapsed when they share a month: "1–6 September 2026". */
export function formatRange(start: string, end: string, lang: Lang): string {
  if (start === end) return formatDate(start, lang);

  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);

  if (sy === ey && sm === em) {
    const monthYear = new Date(ey, em - 1, ed).toLocaleDateString(DATE_LOCALE[lang], {
      month: "long",
    });
    return `${sd}–${ed} ${monthYear} ${ey}`;
  }
  return `${formatDate(start, lang)} – ${formatDate(end, lang)}`;
}
