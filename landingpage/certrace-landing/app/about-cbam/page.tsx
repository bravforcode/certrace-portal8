"use client";

/* The CBAM knowledge hub. Fifteen guides, filterable by topic and searchable.

   The pillar article is pulled out of the grid and given a wide card at the
   top: somebody arriving here from a search for "what is CBAM" should not have
   to pick their own entry point out of fifteen equally weighted tiles. */

import { useMemo, useState } from "react";
import { ArticleCover } from "@/components/article-cover";
import { EmptyResult, ListControls, PageCta, PageHero, PageShell } from "@/components/page-shell";
import { ARTICLES } from "@/lib/cbam-guide";
import { useCbamGuide } from "@/lib/use-cbam-guide";
import { useLang } from "@/lib/i18n";
import { localePath } from "@/lib/locales";

export default function AboutCbamPage() {
  const guide = useCbamGuide();
  const { lang } = useLang();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");

  const pillar = ARTICLES.find((a) => a.pillar);
  const rest = ARTICLES.filter((a) => !a.pillar);

  /* Topics come from the copy rather than a fixed list, so a language that
     groups them differently is free to. Order follows the article order. */
  const topics = useMemo(() => {
    const seen: string[] = [];
    for (const a of ARTICLES) {
      const t = guide.articles[a.slug].topic;
      if (!seen.includes(t)) seen.push(t);
    }
    return seen;
  }, [guide]);

  const matches = (slug: string) => {
    const t = guide.articles[slug];
    if (topic !== "all" && t.topic !== topic) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.dek.toLowerCase().includes(q) ||
      t.topic.toLowerCase().includes(q) ||
      t.keyFacts.some((f) => `${f.label} ${f.value}`.toLowerCase().includes(q))
    );
  };

  const filtering = query.trim() !== "" || topic !== "all";
  const shown = (filtering ? ARTICLES : rest).filter((a) => matches(a.slug));
  const pillarShown = !filtering && pillar;

  const clear = () => {
    setQuery("");
    setTopic("all");
  };

  return (
    <PageShell>
      <PageHero eyebrow={guide.hub.eyebrow} headline={guide.hub.headline} intro={guide.hub.intro} />

      <section className="px-6 pb-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <ListControls
            query={query}
            onQuery={setQuery}
            placeholder={guide.hub.searchPlaceholder}
            active={topic}
            onFilter={setTopic}
            filters={[
              { key: "all", label: guide.hub.allTopics, count: ARTICLES.length },
              ...topics.map((t) => ({
                key: t,
                label: t,
                count: ARTICLES.filter((a) => guide.articles[a.slug].topic === t).length,
              })),
            ]}
          />

          {pillarShown && pillar && (
            <a
              href={localePath(lang, `/about-cbam/${pillar.slug}`)}
              className="group mb-3 grid grid-cols-1 overflow-hidden rounded-2xl border border-black/[0.07] bg-white/70 transition-colors hover:border-black/20 hover:bg-white md:grid-cols-[1fr_280px]"
            >
              <div className="order-2 p-8 md:order-1 md:p-10">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/15 bg-emerald-50 px-2.5 py-1 font-pixel text-[9px] uppercase tracking-[0.14em] text-emerald-700">
                  <span className="h-1 w-1 rounded-full bg-emerald-500" />
                  {guide.hub.pillarLabel}
                </span>
                <h2
                  className="mt-4 text-2xl font-light leading-tight tracking-tight text-[#111] md:text-3xl"
                  style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif" }}
                >
                  {guide.articles[pillar.slug].title}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-black/45">
                  {guide.articles[pillar.slug].dek}
                </p>
                <div className="mt-6 flex items-center gap-4 font-pixel text-[10px] uppercase tracking-[0.14em] text-black/30">
                  <span>
                    {pillar.readMinutes} {guide.hub.readTime}
                  </span>
                  <span className="transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </div>
              <ArticleCover motif={pillar.motif} className="order-1 h-40 md:order-2 md:h-full" />
            </a>
          )}

          {shown.length === 0 ? (
            <EmptyResult message={guide.hub.noResults} onClear={clear} clearLabel={guide.hub.clear} />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((a) => {
                const t = guide.articles[a.slug];
                return (
                  <a
                    key={a.slug}
                    href={localePath(lang, `/about-cbam/${a.slug}`)}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-black/[0.07] bg-white/70 transition-colors hover:border-black/20 hover:bg-white"
                  >
                    <ArticleCover motif={a.motif} className="h-32 shrink-0" />
                    <div className="flex flex-1 flex-col p-6">
                      <div className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/30">
                        {t.topic}
                      </div>
                      <h3 className="mt-2.5 text-[17px] font-light leading-snug text-[#111]">
                        {t.title}
                      </h3>
                      <p className="mt-2.5 flex-1 text-[13px] leading-relaxed text-black/45">
                        {t.dek}
                      </p>
                      <div className="mt-5 flex items-center justify-between font-pixel text-[10px] uppercase tracking-[0.14em] text-black/30">
                        <span>
                          {a.readMinutes} {guide.hub.readTime}
                        </span>
                        <span className="transition-transform duration-200 group-hover:translate-x-1">
                          →
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <PageCta
        headline={guide.article.ctaHeadline}
        body={guide.article.ctaBody}
        primaryLabel={guide.article.ctaPrimary}
        secondaryLabel={guide.article.ctaSecondary}
      />
    </PageShell>
  );
}
