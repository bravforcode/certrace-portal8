"use client";

/* Where to find us. Cards carry the poster, the name, the dates, the place
   and — when the organiser has published one — the time. Filter is
   All / Upcoming / Past, derived from today's date rather than stored, plus a
   search across name, summary and venue. */

import { useState } from "react";
import Image from "next/image";
import { EmptyResult, ListControls, PageCta, PageHero, PageShell } from "@/components/page-shell";
import { EVENTS, isUpcoming } from "@/lib/events";
import { formatRange } from "@/lib/format-date";
import { useLang } from "@/lib/i18n";
import { usePages } from "@/lib/i18n-pages";

export default function EventsPage() {
  const { lang } = useLang();
  const p = usePages();
  const e = p.events;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("upcoming");

  const upcomingCount = EVENTS.filter((ev) => isUpcoming(ev)).length;
  const pastCount = EVENTS.length - upcomingCount;

  const list = EVENTS.filter((ev) => {
    if (filter === "upcoming" && !isUpcoming(ev)) return false;
    if (filter === "past" && isUpcoming(ev)) return false;
    if (!query.trim()) return true;
    const t = e.items[ev.slug];
    const q = query.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.summary.toLowerCase().includes(q) ||
      ev.venue.toLowerCase().includes(q) ||
      ev.city.toLowerCase().includes(q)
    );
  }).sort((a, b) =>
    /* Upcoming reads soonest-first; past reads most-recent-first. Two different
       questions — "what is next" and "what did we just do" — so two orders. */
    isUpcoming(a) && isUpcoming(b)
      ? a.start.localeCompare(b.start)
      : b.start.localeCompare(a.start),
  );

  return (
    <PageShell>
      <PageHero eyebrow={e.eyebrow} headline={e.headline} intro={e.intro} />

      <section className="px-6 pb-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <ListControls
            query={query}
            onQuery={setQuery}
            placeholder={e.searchPlaceholder}
            active={filter}
            onFilter={setFilter}
            filters={[
              { key: "upcoming", label: e.filterUpcoming, count: upcomingCount },
              { key: "past", label: e.filterPast, count: pastCount },
              { key: "all", label: e.filterAll, count: EVENTS.length },
            ]}
          />

          {list.length === 0 ? (
            <EmptyResult
              message={e.noResults}
              onClear={() => {
                setQuery("");
                setFilter("all");
              }}
              clearLabel={e.clear}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((ev) => {
                const t = e.items[ev.slug];
                const soon = isUpcoming(ev);
                return (
                  <a
                    key={ev.slug}
                    href={`/events/${ev.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-black/[0.07] bg-white/70 transition-colors hover:border-black/20 hover:bg-white"
                  >
                    {/* 4:5 — the posters are portrait, and cropping them to a
                        landscape card cuts the date off the bottom of both. */}
                    <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-[#faf9f7]">
                      <Image
                        src={ev.image}
                        alt={t.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                      <span
                        className={`absolute left-3 top-3 rounded-full border px-2.5 py-1 font-pixel text-[9px] uppercase tracking-[0.14em] backdrop-blur-sm ${
                          soon
                            ? "border-emerald-600/20 bg-emerald-50/90 text-emerald-700"
                            : "border-black/10 bg-white/85 text-black/45"
                        }`}
                      >
                        {soon ? e.upcomingBadge : e.pastBadge}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <div className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/30">
                        {t.kindLabel}
                      </div>
                      <h2 className="mt-2 text-[17px] font-light leading-snug text-[#111]">
                        {t.name}
                      </h2>

                      <dl className="mt-4 space-y-1.5 text-[12.5px]">
                        <div className="flex gap-2">
                          <dt className="w-14 shrink-0 text-black/30">{e.dateLabel}</dt>
                          <dd className="text-black/60">{formatRange(ev.start, ev.end, lang)}</dd>
                        </div>
                        {ev.timeStart && ev.timeEnd && (
                          <div className="flex gap-2">
                            <dt className="w-14 shrink-0 text-black/30">{e.timeLabel}</dt>
                            <dd className="text-black/60">
                              {ev.timeStart}–{ev.timeEnd}
                            </dd>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <dt className="w-14 shrink-0 text-black/30">{e.venueLabel}</dt>
                          <dd className="text-black/60">
                            {ev.venue}, {ev.city}
                          </dd>
                        </div>
                      </dl>

                      <p className="mt-4 flex-1 text-[13px] leading-relaxed text-black/45">
                        {t.summary}
                      </p>

                      <span className="mt-5 flex items-center justify-between font-pixel text-[10px] uppercase tracking-[0.14em] text-black/30">
                        {e.viewEvent}
                        <span className="transition-transform duration-200 group-hover:translate-x-1">
                          →
                        </span>
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <PageCta headline={e.ctaHeadline} body={e.ctaBody} />
    </PageShell>
  );
}
