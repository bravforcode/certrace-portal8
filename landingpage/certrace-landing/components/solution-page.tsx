"use client";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { PixelIcon, type PixelType } from "@/components/pixel-icon";
import { AnimateCard, BlurHeading, TagBadge, handleMouseGlow } from "@/components/ui";
import { WaitlistSection } from "@/components/waitlist-form";
import { useLang } from "@/lib/i18n";
import { usePages } from "@/lib/i18n-pages";
import { SIGNUP_URL } from "@/lib/site";
import Link from "next/link";

export type Persona = "exporters" | "suppliers" | "legal" | "importers";

const ICONS: Record<Persona, PixelType> = {
  exporters: "funnel",
  suppliers: "leaf",
  legal: "shield",
  importers: "globe",
};

/* Which sides of the chain are open today. The two that aren't still get a
   full page — the ask was that a SOON entry lead somewhere real rather than
   dead-ending — but the page ends on a waitlist instead of a demo booking,
   and its benefit cards are labelled "what's coming", not "what you get". */
const LIVE: Record<Persona, boolean> = {
  exporters: true,
  suppliers: true,
  legal: false,
  importers: false,
};

/* Confirmation mark for the guarantee lists. Emerald is the DS "good" tone and
   the only status colour in this section — 4×3 of them is already a lot of it,
   so nothing else here is allowed to carry a status colour. */
function Tick() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mt-[3px] shrink-0 text-emerald-600/70"
    >
      <path d="M2.5 6.5 5 9l4.5-6" />
    </svg>
  );
}

/* `children` is dropped in between the benefits grid and the closing CTA. The
   exporter page uses it to carry the full landing-page story — problem, why
   now, the platform, pricing, FAQ — while the other three stay short. */
export function SolutionPage({
  persona,
  children,
}: {
  persona: Persona;
  children?: React.ReactNode;
}) {
  const { c } = useLang();
  const p = usePages();
  const page = c.solutionPage[persona];
  const live = LIVE[persona];

  /* Suppliers is the only page that still carries a feature grid.
     Exporters run the whole landing story below instead, so a card summary of
     it read as a table of contents for the page you were already on; legal and
     importers had theirs taken down on purpose — describing features of
     software nobody can open yet is a spec sheet with no product behind it,
     and their pages now go straight from the pitch to the waitlist. */
  const benefits =
    persona === "suppliers" ? c.solutionPage.suppliers : null;
  /* A live page leads on the trial and offers the demo beside it — the
     site-wide pair. A page with no product behind it cannot offer either, so
     it keeps its single waitlist button. */
  const ctaLabel = live ? p.nav.startFreeTrial : c.common.joinWaitlist;
  const ctaHref = live ? SIGNUP_URL : "#waitlist";

  return (
    <div className="bg-[#F5F4F0] text-[#111] min-h-screen font-sans antialiased">
      <Navbar />

      <section className="pt-40 pb-24 px-6 md:px-12 lg:px-20">
        <div className="max-w-3xl mx-auto">
          <PixelIcon type={ICONS[persona]} size={40} />
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <TagBadge>{page.eyebrow}</TagBadge>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] tracking-widest border ${
                live
                  ? "border-emerald-600/15 bg-emerald-50 text-emerald-700"
                  : "border-black/10 bg-black/[0.03] text-black/40"
              }`}
            >
              {live && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
              {live ? c.common.live : c.common.comingSoon}
            </span>
          </div>
          <BlurHeading className="mt-5 text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.05]">
            {page.headline}
          </BlurHeading>
          <p className="mt-6 text-sm md:text-base text-black/45 leading-relaxed max-w-xl">
            {page.intro}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href={ctaHref}
              className="px-7 py-3 bg-[#111] text-white text-sm rounded-[10px] hover:bg-[#333] transition-colors tracking-widest"
            >
              {ctaLabel}
            </a>
            <a
              href={live ? "/#demo" : "/#stakeholders"}
              className="px-7 py-3 rounded-[10px] border border-black/10 text-sm text-black/60 hover:border-black/25 hover:text-black hover:bg-black/[0.04] transition-all tracking-widest"
            >
              {live ? c.common.bookDemo : c.common.allSolutions}
            </a>
          </div>
        </div>
      </section>

      {benefits && (
        <section className="py-24 px-6 md:px-12 lg:px-20 border-t border-black/[0.06]">
          <div className="max-w-6xl mx-auto">
            {/* A bare badge over a grid of four one-liners was the whole
                section, and it read as a placeholder. It now opens like every
                other section on the site — heading on the left, the promise
                opposite — and each card carries the three guarantees that
                answer the only question a supplier actually has. */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-12">
              <div>
                <TagBadge>{c.solutionPage.whatYouGet}</TagBadge>
                <BlurHeading className="mt-5 text-3xl md:text-4xl lg:text-5xl font-light tracking-tight leading-[1.05]">
                  {benefits.benefitsHeadline}
                </BlurHeading>
              </div>
              <p className="text-sm text-black/45 leading-relaxed max-w-xs">
                {benefits.benefitsIntro}
              </p>
            </div>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              onMouseMove={handleMouseGlow}
            >
              {benefits.benefits.map((benefit, i) => (
                <AnimateCard
                  key={benefit.title}
                  className="p-8 flex flex-col"
                  delay={i * 70}
                >
                  <h3 className="text-lg font-light mb-2.5">{benefit.title}</h3>
                  <p className="text-sm text-black/45 leading-relaxed">
                    {benefit.desc}
                  </p>
                  <ul className="mt-auto pt-6 flex flex-col gap-2">
                    {benefit.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-2.5 text-xs text-black/50 leading-relaxed"
                      >
                        <Tick />
                        {point}
                      </li>
                    ))}
                  </ul>
                </AnimateCard>
              ))}
            </div>
          </div>
        </section>
      )}

      {children}

      {!live && <WaitlistSection />}

      {/* The closing block asks for the one thing this page can actually give.
          On a page with no product yet, that's a demo of the side that *is*
          running — so the copy and the button both change, rather than
          repeating the waitlist ask directly above it. */}
      <section className="py-28 px-6 md:px-12 lg:px-20 border-t border-black/[0.06]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-light tracking-tight leading-[1.05]">
            {live
              ? c.solutionPage.closingHeadline
              : c.solutionPage.closingHeadlineSoon}
          </h2>
          <p className="mt-5 text-sm text-black/45 leading-relaxed max-w-md mx-auto">
            {live
              ? c.solutionPage.closingIntro
              : c.solutionPage.closingIntroSoon}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={SIGNUP_URL}
              className="px-7 py-3 bg-[#111] text-white text-sm rounded-[10px] hover:bg-[#333] transition-colors tracking-widest"
            >
              {p.nav.startFreeTrial}
            </a>
            <Link
              href="/#demo"
              className="px-7 py-3 rounded-[10px] border border-black/10 text-sm text-black/60 hover:border-black/25 hover:text-black hover:bg-black/[0.04] transition-all tracking-widest"
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
