"use client";

/* One post. Prose first, then the rest of the photographs — a reader who
   scrolled here came for what happened, not for a gallery. */

import { use } from "react";
import Image from "next/image";
import { BackLink, PageCta, PageShell } from "@/components/page-shell";
import { updateBySlug } from "@/lib/updates";
import { formatDate } from "@/lib/format-date";
import { useLang } from "@/lib/i18n";
import { usePages } from "@/lib/i18n-pages";
import { localePath } from "@/lib/locales";

export default function UpdateDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { lang } = useLang();
  const p = usePages();
  const u = p.updates;
  const post = updateBySlug(slug);
  const t = post ? u.items[post.slug] : undefined;

  if (!post || !t) {
    return (
      <PageShell>
        <section className="px-6 pt-40 pb-32 md:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl">
            <BackLink href={localePath(lang, "/updates")} label={u.backToUpdates} />
            <h1 className="mt-6 text-3xl font-light tracking-tight">{u.notFound}</h1>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <article>
        <section className="px-6 pt-32 pb-10 md:px-12 md:pt-40 lg:px-20">
          <div className="mx-auto max-w-3xl">
            <BackLink href={localePath(lang, "/updates")} label={u.backToUpdates} />
            <div className="mt-6 flex items-center gap-3 font-pixel text-[10px] uppercase tracking-[0.16em] text-black/30">
              <span className="rounded-full bg-black/[0.04] px-2.5 py-1">{t.kindLabel}</span>
              <span>{formatDate(post.date, lang)}</span>
            </div>
            <h1
              className="mt-5 text-3xl font-light leading-[1.1] tracking-tight text-[#111] md:text-4xl"
              style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif" }}
            >
              {t.title}
            </h1>
            <p className="mt-6 text-base leading-relaxed text-black/55 md:text-lg">{t.dek}</p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-6 md:px-12 lg:px-0">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-black/[0.07] bg-[#faf9f7]">
            <Image
              src={post.images[0]}
              alt={t.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
            />
          </div>
        </div>

        <section className="px-6 py-14 md:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl">
            <div className="space-y-5">
              {t.body.map((para) => (
                <p key={para} className="text-[15px] leading-[1.8] text-black/60">
                  {para}
                </p>
              ))}
            </div>

            {post.images.length > 1 && (
              <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {post.images.slice(1).map((src, i) => (
                  <div
                    key={src}
                    className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-black/[0.07] bg-[#faf9f7]"
                  >
                    <Image
                      src={src}
                      alt={`${t.title} — ${i + 2}`}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {post.eventSlug && (
              <a
                href={`/events/${post.eventSlug}`}
                className="mt-10 inline-flex font-pixel text-[11px] uppercase tracking-[0.16em] text-black/40 transition-colors hover:text-black"
              >
                {u.relatedEvent}
              </a>
            )}
          </div>
        </section>
      </article>

      <PageCta headline={u.ctaHeadline} body={u.ctaBody} />
    </PageShell>
  );
}
