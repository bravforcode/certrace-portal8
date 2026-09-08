"use client";

/* One event. The poster, the facts, why it matters, what we are doing there,
   and a button that puts it in the reader's own calendar.

   ADD TO GOOGLE CALENDAR is built in lib/events.ts, where the all-day end-date
   rule is documented — Google's template API takes an exclusive end, and an
   inclusive one silently drops the last day of a multi-day show. */

import { use } from "react";
import Image from "next/image";
import { BackLink, PageCta, PageShell } from "@/components/page-shell";
import { eventBySlug, googleCalendarUrl, isUpcoming } from "@/lib/events";
import { formatRange } from "@/lib/format-date";
import { siteUrl } from "@/lib/site";
import { useLang } from "@/lib/i18n";
import { usePages } from "@/lib/i18n-pages";

export default function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { lang } = useLang();
  const p = usePages();
  const e = p.events;
  const ev = eventBySlug(slug);
  const t = ev ? e.items[ev.slug] : undefined;

  if (!ev || !t) {
    return (
      <PageShell>
        <section className="px-6 pt-40 pb-32 md:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl">
            <BackLink href="/events" label={e.backToEvents} />
            <h1 className="mt-6 text-3xl font-light tracking-tight">{e.notFound}</h1>
          </div>
        </section>
      </PageShell>
    );
  }

  const soon = isUpcoming(ev);
  const calendarUrl = googleCalendarUrl(ev, t.name, `${t.summary}\n\n${siteUrl(`/events/${ev.slug}`)}`);

  return (
    <PageShell>
      <section className="px-6 pt-32 pb-16 md:px-12 md:pt-40 lg:px-20">
        <div className="mx-auto max-w-5xl">
          <BackLink href="/events" label={e.backToEvents} />

          <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-[300px_1fr] md:gap-12">
            <div className="order-2 md:order-1">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-black/[0.07] bg-[#faf9f7]">
                <Image
                  src={ev.image}
                  alt={t.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                  className="object-cover"
                  priority
                />
              </div>

              {/* The facts, beside the poster rather than under the prose — a
                  reader deciding whether to go needs the date and the place
                  before the argument. */}
              <dl className="mt-5 rounded-2xl border border-black/[0.07] bg-white/70 p-5">
                <div className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/30">
                  {e.detailsHeading}
                </div>
                <div className="mt-4 space-y-3 text-[13px]">
                  <div>
                    <dt className="text-black/30">{e.dateLabel}</dt>
                    <dd className="mt-0.5 text-black/70">{formatRange(ev.start, ev.end, lang)}</dd>
                  </div>
                  {ev.timeStart && ev.timeEnd && (
                    <div>
                      <dt className="text-black/30">{e.timeLabel}</dt>
                      <dd className="mt-0.5 text-black/70">
                        {ev.timeStart}–{ev.timeEnd}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-black/30">{e.venueLabel}</dt>
                    <dd className="mt-0.5 leading-relaxed text-black/70">
                      {ev.venue}
                      <br />
                      {ev.city}, {ev.country}
                    </dd>
                  </div>
                </div>

                {soon && (
                  <a
                    href={calendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#111] px-4 py-3 font-pixel text-[10px] uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#333]"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                      <rect x="2" y="3.5" width="12" height="11" rx="1.5" />
                      <path d="M2 7h12M5.5 1.5v4M10.5 1.5v4" strokeLinecap="round" />
                    </svg>
                    {e.addToCalendar}
                  </a>
                )}
              </dl>
            </div>

            <div className="order-1 md:order-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/35">
                  {t.kindLabel}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 font-pixel text-[9px] uppercase tracking-[0.14em] ${
                    soon
                      ? "border-emerald-600/20 bg-emerald-50 text-emerald-700"
                      : "border-black/10 bg-black/[0.03] text-black/45"
                  }`}
                >
                  {soon ? e.upcomingBadge : e.pastBadge}
                </span>
              </div>

              <h1
                className="mt-4 text-3xl font-light leading-[1.1] tracking-tight text-[#111] md:text-4xl"
                style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif" }}
              >
                {t.name}
              </h1>
              <p className="mt-5 text-base leading-relaxed text-black/55">{t.summary}</p>

              <h2 className="mt-10 font-pixel text-[11px] uppercase tracking-[0.18em] text-black/35">
                {e.aboutHeading}
              </h2>
              <div className="mt-4 space-y-4">
                {t.body.map((para) => (
                  <p key={para} className="text-[15px] leading-[1.75] text-black/60">
                    {para}
                  </p>
                ))}
              </div>

              {t.presence && (
                <>
                  <h2 className="mt-10 font-pixel text-[11px] uppercase tracking-[0.18em] text-black/35">
                    {e.presenceHeading}
                  </h2>
                  <ul className="mt-4 space-y-3">
                    {t.presence.map((item) => (
                      <li key={item} className="flex gap-3 text-[15px] leading-[1.7] text-black/60">
                        <span className="mt-[10px] h-1 w-1 shrink-0 rounded-full bg-emerald-600/50" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {ev.provisional && (
                <p className="mt-8 rounded-xl border border-black/[0.07] bg-white/60 px-5 py-4 text-[13px] leading-relaxed text-black/45">
                  {e.provisionalNote}
                </p>
              )}

              {ev.updateSlug && (
                <a
                  href={`/updates/${ev.updateSlug}`}
                  className="mt-8 inline-flex font-pixel text-[11px] uppercase tracking-[0.16em] text-black/40 transition-colors hover:text-black"
                >
                  {e.relatedUpdate}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <PageCta headline={e.ctaHeadline} body={e.ctaBody} />
    </PageShell>
  );
}
