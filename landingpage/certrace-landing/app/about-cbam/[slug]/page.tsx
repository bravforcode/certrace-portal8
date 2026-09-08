"use client";

/* One CBAM guide.

   THE READING ORDER is the argument of the whole hub: the short answer sits
   above the explanation, never after it. A reader in a hurry gets the numbers
   and leaves; a reader who wants the reasoning scrolls. An answer engine lifts
   the key-facts block and the FAQ, which is why both are marked up as
   structured data rather than only as prose.

   THE CLOSING BANNER is the ask from the brief: every article ends on the
   product, once, at the bottom, after the reader has been given something
   without being sold to. */

import { use } from "react";
import { ArticleCover } from "@/components/article-cover";
import { BackLink, PageShell } from "@/components/page-shell";
import { articleBySlug } from "@/lib/cbam-guide";
import { CBAM_EN } from "@/lib/cbam-guide-en";
import { JsonLd, ORG_ID, breadcrumbNode } from "@/components/json-ld";
import { useCbamGuide } from "@/lib/use-cbam-guide";
import { OG_IMAGE, SIGNUP_URL, siteUrl } from "@/lib/site";
import Link from "next/link";

/* An id a heading can be linked to, and the table of contents can point at.
   Built from the index rather than the text so it is stable across languages —
   a Thai reader and an English reader share a URL fragment. */
const sectionId = (i: number) => `section-${i + 1}`;

export default function CbamArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const guide = useCbamGuide();
  const meta = articleBySlug(slug);
  const a = guide.articles[slug];

  if (!meta || !a) {
    return (
      <PageShell>
        <section className="px-6 pt-40 pb-32 md:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl">
            <BackLink href="/about-cbam" label={guide.article.backToHub} />
            <h1 className="mt-6 text-3xl font-light tracking-tight">{guide.hub.noResults}</h1>
          </div>
        </section>
      </PageShell>
    );
  }

  /* Structured data, from the English source so a crawler sees one stable
     description of the page whatever language a human happens to be reading
     it in. FAQPage is what puts these answers into an answer box; Article
     carries the dates and the publisher. */
  const en = CBAM_EN.articles[slug];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: en.title,
        description: en.metaDescription,
        datePublished: meta.updated,
        dateModified: meta.updated,
        inLanguage: "en",
        /* Pointed at by @id rather than restated: the publisher is declared
           once, on the root layout, so a change of name or of social accounts
           cannot leave a second copy of the organisation behind here. */
        author: { "@id": ORG_ID },
        publisher: { "@id": ORG_ID },
        image: siteUrl(OG_IMAGE),
        about: { "@type": "Thing", name: "EU Carbon Border Adjustment Mechanism" },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": siteUrl(`/about-cbam/${slug}`),
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: en.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      breadcrumbNode([
        { name: "Certrace", path: "" },
        { name: "About CBAM", path: "/about-cbam" },
        { name: en.title },
      ]),
    ],
  };

  const related = meta.related
    .map((s) => ({ meta: articleBySlug(s)!, text: guide.articles[s] }))
    .filter((r) => r.meta && r.text);

  return (
    <PageShell>
      <JsonLd data={jsonLd} />

      <article>
        <section className="px-6 pt-32 pb-10 md:px-12 md:pt-40 lg:px-20">
          <div className="mx-auto max-w-3xl">
            <BackLink href="/about-cbam" label={guide.article.backToHub} />

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-pixel text-[10px] uppercase tracking-[0.16em] text-black/35">
              <span className="rounded-full bg-black/[0.04] px-2.5 py-1">{a.topic}</span>
              <span>
                {meta.readMinutes} {guide.hub.readTime}
              </span>
              <span>
                {guide.article.updatedPrefix} {meta.updated}
              </span>
            </div>

            <h1
              className="mt-5 text-3xl font-light leading-[1.1] tracking-tight text-[#111] md:text-4xl lg:text-[42px]"
              style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif" }}
            >
              {a.title}
            </h1>

            {/* The dek is the answer to the title. It is set larger than the
                body on purpose — for a lot of readers it is the whole visit. */}
            <p className="mt-6 text-base leading-relaxed text-black/60 md:text-lg">{a.dek}</p>
          </div>
        </section>

        <ArticleCover
          motif={meta.motif}
          className="mx-auto h-40 w-full max-w-3xl rounded-2xl border border-black/[0.07] md:h-52"
        />

        <section className="px-6 py-14 md:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl">
            {/* ── The short answer ──────────────────────────── */}
            <div className="rounded-2xl border border-black/[0.07] bg-white/70 p-6 md:p-8">
              <h2 className="font-pixel text-[11px] uppercase tracking-[0.18em] text-black/40">
                {guide.article.keyFacts}
              </h2>
              <dl className="mt-5 divide-y divide-black/[0.06]">
                {a.keyFacts.map((f) => (
                  <div
                    key={f.label}
                    className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-6"
                  >
                    <dt className="shrink-0 text-[13px] text-black/40 sm:w-56">{f.label}</dt>
                    <dd className="text-[14px] leading-snug text-[#111]">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* ── Contents ──────────────────────────────────── */}
            <nav aria-label={guide.article.onThisPage} className="mt-10">
              <h2 className="font-pixel text-[10px] uppercase tracking-[0.18em] text-black/30">
                {guide.article.onThisPage}
              </h2>
              <ol className="mt-3 space-y-1.5">
                {a.sections.map((s, i) => (
                  <li key={sectionId(i)}>
                    <a
                      href={`#${sectionId(i)}`}
                      className="text-[13px] text-black/45 transition-colors hover:text-black"
                    >
                      {s.h}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            {/* ── The body ──────────────────────────────────── */}
            <div className="mt-12 space-y-12">
              {a.sections.map((s, i) => (
                <section key={sectionId(i)} id={sectionId(i)} className="scroll-mt-24">
                  <h2
                    className="text-xl font-light leading-snug tracking-tight text-[#111] md:text-2xl"
                    style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif" }}
                  >
                    {s.h}
                  </h2>

                  {s.p?.map((para) => (
                    <p key={para} className="mt-4 text-[15px] leading-[1.75] text-black/60">
                      {para}
                    </p>
                  ))}

                  {s.list && (
                    <ul className="mt-5 space-y-2.5">
                      {s.list.map((item) => (
                        <li
                          key={item}
                          className="flex gap-3 text-[15px] leading-[1.7] text-black/60"
                        >
                          <span className="mt-[10px] h-1 w-1 shrink-0 rounded-full bg-black/25" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {s.table && (
                    /* Its own scroll box, so a wide table never makes the page
                       body scroll sideways. */
                    <div className="mt-6 overflow-x-auto rounded-xl border border-black/[0.07] bg-white">
                      <table className="w-full min-w-[440px] border-collapse text-left">
                        <thead>
                          <tr>
                            {s.table.head.map((h) => (
                              <th
                                key={h}
                                scope="col"
                                className="border-b border-black/[0.1] px-4 py-3 font-pixel text-[10px] uppercase tracking-[0.12em] text-black/40"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {s.table.rows.map((row, r) => (
                            <tr key={r}>
                              {row.map((cell, ci) => (
                                <td
                                  key={ci}
                                  className={`border-b border-black/[0.05] px-4 py-3 text-[13.5px] leading-snug ${
                                    ci === 0 ? "text-[#111]" : "text-black/55"
                                  }`}
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {s.note && (
                    <div className="mt-6 rounded-xl border-l-2 border-emerald-600/40 bg-emerald-50/50 px-5 py-4">
                      <p className="text-[14px] leading-relaxed text-black/65">{s.note}</p>
                    </div>
                  )}
                </section>
              ))}
            </div>

            {/* ── FAQ ───────────────────────────────────────── */}
            <section className="mt-16 border-t border-black/[0.07] pt-10">
              <h2
                className="text-xl font-light tracking-tight text-[#111] md:text-2xl"
                style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif" }}
              >
                {guide.article.faqHeading}
              </h2>
              <dl className="mt-6 divide-y divide-black/[0.07] border-y border-black/[0.07]">
                {a.faq.map((f) => (
                  <div key={f.q} className="py-5">
                    <dt className="text-[15px] font-light text-[#111]">{f.q}</dt>
                    <dd className="mt-2 text-[14px] leading-relaxed text-black/55">{f.a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </section>

        {/* ── The banner ──────────────────────────────────────
            One product pitch, at the bottom, after the article has given
            something away. */}
        <section className="border-t border-black/[0.06] px-6 py-20 md:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-black/[0.08] bg-[#111] px-8 py-12 text-center md:px-12">
            <div className="font-pixel text-[10px] uppercase tracking-[0.2em] text-white/40">
              {guide.article.ctaEyebrow}
            </div>
            <h2
              className="mt-4 text-2xl font-light leading-tight tracking-tight text-white md:text-3xl"
              style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif" }}
            >
              {guide.article.ctaHeadline}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/50">
              {guide.article.ctaBody}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href={SIGNUP_URL}
                className="rounded-[10px] bg-white px-7 py-3 text-sm tracking-widest text-[#111] transition-colors hover:bg-white/90"
              >
                {guide.article.ctaPrimary}
              </a>
              <Link
                href="/#demo"
                className="rounded-[10px] border border-white/20 px-7 py-3 text-sm tracking-widest text-white/70 transition-colors hover:border-white/40 hover:text-white"
              >
                {guide.article.ctaSecondary}
              </Link>
            </div>
          </div>
        </section>

        {/* ── Read next ─────────────────────────────────────── */}
        {related.length > 0 && (
          <section className="border-t border-black/[0.06] px-6 py-20 md:px-12 lg:px-20">
            <div className="mx-auto max-w-6xl">
              <h2 className="font-pixel text-[11px] uppercase tracking-[0.18em] text-black/35">
                {guide.article.relatedHeading}
              </h2>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {related.map((r) => (
                  <a
                    key={r.meta.slug}
                    href={`/about-cbam/${r.meta.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-black/[0.07] bg-white/70 transition-colors hover:border-black/20 hover:bg-white"
                  >
                    <ArticleCover motif={r.meta.motif} className="h-24 shrink-0" />
                    <div className="flex flex-1 flex-col p-5">
                      <div className="font-pixel text-[9.5px] uppercase tracking-[0.16em] text-black/30">
                        {r.text.topic}
                      </div>
                      <h3 className="mt-2 flex-1 text-[15px] font-light leading-snug text-[#111]">
                        {r.text.title}
                      </h3>
                      <span className="mt-4 font-pixel text-[10px] uppercase tracking-[0.14em] text-black/30 transition-transform duration-200 group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}
      </article>
    </PageShell>
  );
}
