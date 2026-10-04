"use client";

/* Company news. Cards carry the cover photograph, the date, the kind and the
   dek; the post itself carries the rest of the photographs inline. */

import { useState } from "react";
import Image from "next/image";
import { EmptyResult, ListControls, PageCta, PageHero, PageShell } from "@/components/page-shell";
import { UPDATES_SORTED } from "@/lib/updates";
import { formatDate } from "@/lib/format-date";
import { useLang } from "@/lib/i18n";
import { usePages } from "@/lib/i18n-pages";
import { localePath } from "@/lib/locales";

export default function UpdatesPage() {
  const { lang } = useLang();
  const p = usePages();
  const u = p.updates;
  const [query, setQuery] = useState("");

  const list = UPDATES_SORTED.filter((post) => {
    if (!query.trim()) return true;
    const t = u.items[post.slug];
    const q = query.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.dek.toLowerCase().includes(q) ||
      t.body.some((b) => b.toLowerCase().includes(q))
    );
  });

  return (
    <PageShell>
      <PageHero eyebrow={u.eyebrow} headline={u.headline} intro={u.intro} />

      <section className="px-6 pb-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <ListControls query={query} onQuery={setQuery} placeholder={u.searchPlaceholder} />

          {list.length === 0 ? (
            <EmptyResult message={u.noResults} onClear={() => setQuery("")} clearLabel={u.clear} />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {list.map((post) => {
                const t = u.items[post.slug];
                return (
                  <a
                    key={post.slug}
                    href={localePath(lang, `/updates/${post.slug}`)}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-black/[0.07] bg-white/70 transition-colors hover:border-black/20 hover:bg-white"
                  >
                    <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-[#faf9f7]">
                      <Image
                        src={post.images[0]}
                        alt={t.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-7">
                      <div className="flex items-center gap-3 font-pixel text-[10px] uppercase tracking-[0.16em] text-black/30">
                        <span className="rounded-full bg-black/[0.04] px-2.5 py-1">
                          {t.kindLabel}
                        </span>
                        <span>{formatDate(post.date, lang)}</span>
                      </div>
                      <h2 className="mt-3 text-[19px] font-light leading-snug text-[#111]">
                        {t.title}
                      </h2>
                      <p className="mt-3 flex-1 text-[13.5px] leading-relaxed text-black/45">
                        {t.dek}
                      </p>
                      <span className="mt-6 flex items-center justify-between font-pixel text-[10px] uppercase tracking-[0.14em] text-black/30">
                        {u.readMore}
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

      <PageCta headline={u.ctaHeadline} body={u.ctaBody} />
    </PageShell>
  );
}
