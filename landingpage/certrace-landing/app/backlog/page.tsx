"use client";

import Link from "next/link";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { PixelIcon } from "@/components/pixel-icon";
import { BlurHeading, TagBadge } from "@/components/ui";
import { composeHref } from "@/lib/content";
import { useLang } from "@/lib/i18n";

/* The public backlog — a changelog, not a roadmap. Everything under RECENTLY
   SHIPPED is in the product today; the month is when it went live. Nothing on
   this page is forward-looking, so nothing here can over-promise.

   The entries carry no status pill: sitting under a heading that says "in the
   platform today", a LIVE chip on every row was label noise. Nothing responds
   to hover either — these are records to read, not controls.

   (The IN PROGRESS and ON THE LIST copy is still in lib/content.ts under
   `backlog.building` / `backlog.next` if those sections are ever wanted
   back.) */

export default function BacklogPage() {
  const { c } = useLang();
  const bl = c.backlog;

  return (
    <div className="bg-[#F5F4F0] text-[#111] min-h-screen font-sans antialiased">
      <Navbar />

      <section className="pt-40 pb-16 px-6 md:px-12 lg:px-20">
        {/* Left-aligned inside the same max-w-6xl rail every section below
            uses, so the h1 lines up with the changelog entries. */}
        <div className="max-w-6xl mx-auto">
          <PixelIcon type="steps" size={40} />
          <div className="mt-4">
            <TagBadge>{bl.badge}</TagBadge>
          </div>
          <BlurHeading
            as="h1"
            className="mt-5 text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.05]"
          >
            {bl.headline}
          </BlurHeading>
          <p className="mt-6 text-sm md:text-base text-black/45 leading-relaxed max-w-xl">
            {bl.intro}
          </p>
          <p className="mt-6 text-xs text-black/30 tracking-wide">
            {bl.updated}
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SHIPPED                                                             */}
      {/* ------------------------------------------------------------------ */}
      <section
        id="shipped"
        className="py-24 px-6 md:px-12 lg:px-20 border-t border-black/[0.06]"
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <TagBadge>{bl.shippedBadge}</TagBadge>
              <BlurHeading className="mt-5 text-3xl md:text-4xl font-light tracking-tight leading-[1.05]">
                {bl.shippedHeadline}
              </BlurHeading>
            </div>
            <p className="text-sm text-black/45 leading-relaxed max-w-xs">
              {bl.shippedIntro}
            </p>
          </div>

          {/* Month rail on the left, entry on the right: the dates are the
              point of a changelog, so they get their own column instead of
              being buried in the copy. */}
          <ol className="border-t border-black/[0.06]">
            {bl.shipped.map((item) => (
              <li
                key={item.title}
                className="grid grid-cols-1 md:grid-cols-[128px_1fr] gap-2 md:gap-8 py-7 border-b border-black/[0.06]"
              >
                <div className="font-pixel text-[11px] tracking-[0.18em] text-black/30 md:pt-1">
                  {item.month}
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-light tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-sm text-black/45 leading-relaxed max-w-2xl">
                    {item.desc}
                  </p>
                  <div className="mt-3 font-pixel text-[10px] tracking-[0.18em] text-black/25">
                    {item.tag}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-24 px-6 md:px-12 lg:px-20 border-t border-black/[0.06]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-light tracking-tight leading-tight">
              {bl.ctaHeadline}
            </h2>
            <p className="mt-3 text-sm text-black/45 leading-relaxed max-w-md">
              {bl.ctaIntro}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <a
              href={composeHref(bl.ctaSubject)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-[10px] border border-black/10 text-sm text-black/60 hover:border-black/25 hover:text-black hover:bg-black/[0.04] transition-all tracking-widest"
            >
              {bl.ctaButton}
            </a>
            <Link
              href="/#demo"
              className="px-7 py-3 rounded-[10px] bg-[#111] text-white text-sm hover:bg-[#333] transition-colors tracking-widest"
            >
              {c.common.bookDemo}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
