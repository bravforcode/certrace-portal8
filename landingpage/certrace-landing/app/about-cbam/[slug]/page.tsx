"use client";

/* One CBAM guide.

   THE READING ORDER is the argument of the whole hub: the short answer sits
   above the explanation, never after it. A reader in a hurry gets the numbers
   and leaves; a reader who wants the reasoning scrolls. An answer engine lifts
   the key-facts block and the FAQ, which is why both are marked up as
   structured data rather than only as prose.

   THE CLOSING BANNER is the ask from the brief: every article ends on the
   product, once, at the bottom, after the reader has been given something
   without being sold to.

   THE MEASURE. The body sits in a column of about 680px at 17px, darker than
   the rest of the site's grey copy: these pages are read end to end, not
   scanned, and Thai — with no word spaces to rest the eye on — was running
   past a hundred characters a line in the old 768px column. On a wide screen
   the contents move into a sticky rail beside the text and follow the reader
   down the page; on a phone they fold into one card above the body. */

import { useEffect, useState } from "react";
import { use } from "react";
import { ArticleCover } from "@/components/article-cover";
import { BackLink, PageShell } from "@/components/page-shell";
import { articleBySlug } from "@/lib/cbam-guide";
import { JsonLd, ORG_ID, breadcrumbNode } from "@/components/json-ld";
import { useCbamGuide } from "@/lib/use-cbam-guide";
import { useLang } from "@/lib/i18n";
import { usePages } from "@/lib/i18n-pages";
import { localePath } from "@/lib/locales";
import { OG_IMAGE, SIGNUP_URL, siteUrl } from "@/lib/site";
import Link from "next/link";

/* An id a heading can be linked to, and the table of contents can point at.
   Built from the index rather than the text so it is stable across languages —
   a Thai reader and an English reader share a URL fragment. */
const sectionId = (i: number) => `section-${i + 1}`;
const FAQ_ID = "faq";

/** "01", "02" — the section's place in the argument, shown above its heading. */
const ordinal = (i: number) => String(i + 1).padStart(2, "0");

/* Which section the reader is in, for the contents rail. A section counts as
   current once its heading has passed the top fifth of the screen, so the
   highlight changes where the reader's eye is, not where the page edge is. */
function useActiveSection(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    const els = key
      .split(",")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((x, y) => x.boundingClientRect.top - y.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [key]);

  return active;
}

/* A hairline across the top of the screen that fills as the article is read.
   Measured against the <article>, not the page, so the footer and the related
   cards do not count as reading. */
function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const article = document.querySelector("article");
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      setProgress(total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px]">
      <div
        className="h-full origin-left bg-emerald-600/70"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}

export default function CbamArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const guide = useCbamGuide();
  const { lang } = useLang();
  const nav = usePages().nav;
  const hubPath = localePath(lang, "/about-cbam");
  const meta = articleBySlug(slug);
  const a = guide.articles[slug];
  /* Called before the not-found return below — a hook cannot sit after it. */
  const active = useActiveSection([
    ...(a?.sections ?? []).map((_, i) => sectionId(i)),
    FAQ_ID,
  ]);

  if (!meta || !a) {
    return (
      <PageShell>
        <section className="px-6 pt-40 pb-32 md:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl">
            <BackLink href={hubPath} label={guide.article.backToHub} />
            <h1 className="mt-6 text-3xl font-light tracking-tight">{guide.hub.noResults}</h1>
          </div>
        </section>
      </PageShell>
    );
  }

  /* Structured data, in the language of the address. On these routes the URL
     fixes the language (lib/locales.ts), so the server pass a crawler reads is
     the Thai one at /th/… and the English one at the bare path — the markup
     and the prose it describes always agree. FAQPage is what puts these
     answers into an answer box; Article carries the dates and the publisher. */
  const pageUrl = siteUrl(localePath(lang, `/about-cbam/${slug}`));
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: a.title,
        description: a.metaDescription,
        datePublished: meta.updated,
        dateModified: meta.updated,
        inLanguage: lang,
        /* Pointed at by @id rather than restated: the publisher is declared
           once, on the root layout, so a change of name or of social accounts
           cannot leave a second copy of the organisation behind here. */
        author: { "@id": ORG_ID },
        publisher: { "@id": ORG_ID },
        image: siteUrl(OG_IMAGE),
        about: { "@type": "Thing", name: "EU Carbon Border Adjustment Mechanism" },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": pageUrl,
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: a.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      breadcrumbNode([
        { name: "Certrace", path: "" },
        { name: nav.aboutCbam, path: hubPath },
        { name: a.title },
      ]),
    ],
  };

  const related = meta.related
    .map((s) => ({ meta: articleBySlug(s)!, text: guide.articles[s] }))
    .filter((r) => r.meta && r.text);

  /* The contents, once for the rail and once for the phone card. */
  const contents = [
    ...a.sections.map((sec, i) => ({ id: sectionId(i), n: ordinal(i), label: sec.h })),
    { id: FAQ_ID, n: "Q", label: guide.article.faqHeading },
  ];

  const body = "text-[16.5px] leading-[1.85] text-black/75 md:text-[17px]";

  return (
    <PageShell>
      <JsonLd data={jsonLd} />
      <ReadingProgress />

      <article className="px-6 pt-32 md:px-12 md:pt-40 lg:px-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-x-16 lg:grid-cols-[minmax(0,680px)_minmax(0,1fr)]">
          {/* ── Header ───────────────────────────────────────── */}
          <header className="lg:col-start-1">
            <BackLink href={hubPath} label={guide.article.backToHub} />

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-pixel text-[10px] uppercase tracking-[0.16em] text-black/40">
              <span className="rounded-full bg-black/[0.05] px-2.5 py-1 text-black/55">{a.topic}</span>
              <span>
                {meta.readMinutes} {guide.hub.readTime}
              </span>
              <span>
                {guide.article.updatedPrefix} {meta.updated}
              </span>
            </div>

            <h1
              className="mt-5 text-[30px] font-light leading-[1.15] tracking-tight text-[#111] md:text-[40px]"
              style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif" }}
            >
              {a.title}
            </h1>

            {/* The dek is the answer to the title. It is set larger than the
                body on purpose — for a lot of readers it is the whole visit. */}
            <p className="mt-6 border-l-2 border-emerald-600/40 pl-5 text-[17px] leading-[1.75] text-black/70 md:text-[19px]">
              {a.dek}
            </p>

            <ArticleCover
              motif={meta.motif}
              className="mt-10 h-40 w-full rounded-2xl border border-black/[0.07] md:h-52"
            />
          </header>

          {/* ── Contents rail (wide screens) ─────────────────── */}
          {/* The offset lives on the column, not the sticky nav, so the rail
              starts level with the headline and then sticks flush under the
              header instead of carrying that gap down the page. */}
          <aside className="hidden pt-[52px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:block">
            <nav aria-label={guide.article.onThisPage} className="sticky top-28">
              <h2 className="font-pixel text-[10px] uppercase tracking-[0.18em] text-black/35">
                {guide.article.onThisPage}
              </h2>
              <ol className="mt-4 border-l border-black/[0.08]">
                {contents.map((c) => {
                  const on = active === c.id;
                  return (
                    <li key={c.id}>
                      <a
                        href={`#${c.id}`}
                        aria-current={on ? "location" : undefined}
                        className={`-ml-px flex gap-3 border-l-2 py-2 pl-4 text-[13px] leading-snug transition-colors ${
                          on
                            ? "border-emerald-600 text-[#111]"
                            : "border-transparent text-black/45 hover:text-black"
                        }`}
                      >
                        <span className="w-4 shrink-0 font-pixel text-[10px] leading-[1.9] text-black/30">
                          {c.n}
                        </span>
                        <span>{c.label}</span>
                      </a>
                    </li>
                  );
                })}
              </ol>
            </nav>
          </aside>

          <div className="lg:col-start-1">
            {/* ── The short answer ──────────────────────────── */}
            <section
              aria-labelledby="key-facts"
              className="mt-12 rounded-2xl border border-black/[0.07] bg-white/80 p-6 md:p-8"
            >
              <h2 id="key-facts" className="font-pixel text-[11px] uppercase tracking-[0.18em] text-emerald-700/80">
                {guide.article.keyFacts}
              </h2>
              <dl className="mt-5 divide-y divide-black/[0.06]">
                {a.keyFacts.map((f) => (
                  <div
                    key={f.label}
                    className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-baseline sm:gap-6"
                  >
                    <dt className="shrink-0 text-[13px] text-black/45 sm:w-48">{f.label}</dt>
                    <dd className="text-[15px] leading-snug text-[#111]">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* ── Contents card (phones and tablets) ────────── */}
            <details className="group mt-8 rounded-2xl border border-black/[0.07] bg-white/60 lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-pixel text-[11px] uppercase tracking-[0.18em] text-black/50 [&::-webkit-details-marker]:hidden">
                {guide.article.onThisPage}
                <span aria-hidden="true" className="text-black/30 transition-transform group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <ol className="space-y-1 border-t border-black/[0.06] px-5 py-4">
                {contents.map((c) => (
                  <li key={c.id}>
                    <a
                      href={`#${c.id}`}
                      className="flex gap-3 py-1.5 text-[14px] leading-snug text-black/60 hover:text-black"
                    >
                      <span className="w-5 shrink-0 font-pixel text-[10px] leading-[2] text-black/30">{c.n}</span>
                      <span>{c.label}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </details>

            {/* ── The body ──────────────────────────────────── */}
            <div className="mt-4">
              {a.sections.map((sec, i) => (
                <section
                  key={sectionId(i)}
                  id={sectionId(i)}
                  className="scroll-mt-28 border-t border-black/[0.07] pt-10 mt-12 first:mt-10"
                >
                  <div className="font-pixel text-[11px] tracking-[0.18em] text-emerald-700/70">{ordinal(i)}</div>
                  <h2
                    className="mt-2 text-[22px] font-normal leading-snug tracking-tight text-[#111] md:text-[26px]"
                    style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif" }}
                  >
                    {sec.h}
                  </h2>

                  {sec.p?.map((para) => (
                    <p key={para} className={`mt-5 ${body}`}>
                      {para}
                    </p>
                  ))}

                  {sec.list && (
                    <ul className="mt-6 space-y-4">
                      {sec.list.map((item) => (
                        <li key={item} className={`flex gap-4 ${body}`}>
                          <span
                            aria-hidden="true"
                            className="mt-[0.75em] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600/60"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {sec.table && (
                    /* Its own scroll box, so a wide table never makes the page
                       body scroll sideways. */
                    <div className="mt-7 overflow-x-auto rounded-xl border border-black/[0.08] bg-white">
                      <table className="w-full min-w-[480px] border-collapse text-left">
                        <thead className="bg-black/[0.025]">
                          <tr>
                            {sec.table.head.map((h) => (
                              <th
                                key={h}
                                scope="col"
                                className="border-b border-black/[0.1] px-4 py-3 align-bottom font-pixel text-[10px] uppercase leading-snug tracking-[0.12em] text-black/50"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sec.table.rows.map((row, r) => (
                            <tr key={r} className="even:bg-black/[0.015]">
                              {row.map((cell, ci) => (
                                <td
                                  key={ci}
                                  className={`border-b border-black/[0.05] px-4 py-3.5 align-top text-[14.5px] leading-relaxed ${
                                    ci === 0 ? "font-medium text-[#111]" : "text-black/70"
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

                  {sec.note && (
                    <aside className="mt-7 rounded-xl border-l-[3px] border-emerald-600/50 bg-emerald-50/70 px-5 py-4 md:px-6 md:py-5">
                      <p className="text-[15.5px] leading-[1.75] text-black/75">{sec.note}</p>
                    </aside>
                  )}
                </section>
              ))}

              {/* ── FAQ ─────────────────────────────────────── */}
              <section id={FAQ_ID} className="mt-16 scroll-mt-28 border-t border-black/[0.07] pt-10">
                <h2
                  className="text-[22px] font-normal tracking-tight text-[#111] md:text-[26px]"
                  style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif" }}
                >
                  {guide.article.faqHeading}
                </h2>
                <dl className="mt-6 space-y-3">
                  {a.faq.map((f) => (
                    <div key={f.q} className="rounded-xl border border-black/[0.07] bg-white/70 px-5 py-5 md:px-6">
                      <dt className="flex gap-3 text-[16px] font-medium leading-snug text-[#111]">
                        <span aria-hidden="true" className="font-pixel text-[11px] leading-[1.9] text-emerald-700/70">
                          Q
                        </span>
                        {f.q}
                      </dt>
                      <dd className="mt-2.5 pl-6 text-[15.5px] leading-[1.75] text-black/70">{f.a}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            </div>
          </div>
        </div>
      </article>

      {/* ── The banner ──────────────────────────────────────
          One product pitch, at the bottom, after the article has given
          something away. */}
      <section className="mt-20 border-t border-black/[0.06] px-6 py-20 md:px-12 lg:px-20">
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
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/55">
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
                  href={localePath(lang, `/about-cbam/${r.meta.slug}`)}
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
    </PageShell>
  );
}
