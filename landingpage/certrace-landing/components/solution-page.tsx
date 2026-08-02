"use client";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { PixelIcon, type PixelType } from "@/components/pixel-icon";
import { AnimateCard, BlurHeading, TagBadge, handleMouseGlow } from "@/components/ui";
import { useLang } from "@/lib/i18n";

export type Persona = "exporters" | "suppliers" | "legal" | "importers";

const ICONS: Record<Persona, PixelType> = {
  exporters: "funnel",
  suppliers: "leaf",
  legal: "shield",
  importers: "globe",
};

/* `children` is dropped in between the benefits grid and the closing CTA. The
   exporter page uses it to carry the full landing-page story — problem, why
   now, the platform, pricing, FAQ — while the other three stay short. */
export function SolutionPage({
  persona,
  benefits = true,
  children,
}: {
  persona: Persona;
  /* The exporter page opts out: with the whole landing story running below it,
     a four-card summary of the same ground read as a table of contents for
     the page you were already on. The short persona pages keep it. */
  benefits?: boolean;
  children?: React.ReactNode;
}) {
  const { c } = useLang();
  const page = c.solutionPage[persona];
  const live = persona !== "importers";
  const ctaLabel =
    persona === "importers" ? c.solutionPage.importers.ctaLabel : c.common.bookDemo;

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
              href="/#demo"
              className="px-7 py-3 bg-[#111] text-white text-sm rounded-[10px] hover:bg-[#333] transition-colors tracking-widest"
            >
              {ctaLabel}
            </a>
            <a
              href="/#stakeholders"
              className="px-7 py-3 rounded-[10px] border border-black/10 text-sm text-black/60 hover:border-black/25 hover:text-black hover:bg-black/[0.04] transition-all tracking-widest"
            >
              {c.common.allSolutions}
            </a>
          </div>
        </div>
      </section>

      {benefits && (
        <section className="py-24 px-6 md:px-12 lg:px-20 border-t border-black/[0.06]">
          <div className="max-w-6xl mx-auto">
            <div className="mb-12">
              <TagBadge>{c.solutionPage.whatYouGet}</TagBadge>
            </div>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              onMouseMove={handleMouseGlow}
            >
              {page.benefits.map((benefit, i) => (
                <AnimateCard
                  key={benefit.title}
                  className="p-8 flex flex-col min-h-[170px]"
                  delay={i * 80}
                >
                  <h3 className="text-lg font-light mb-2">{benefit.title}</h3>
                  <p className="text-sm text-black/45 leading-relaxed">
                    {benefit.desc}
                  </p>
                </AnimateCard>
              ))}
            </div>
          </div>
        </section>
      )}

      {children}

      <section className="py-28 px-6 md:px-12 lg:px-20 border-t border-black/[0.06]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-light tracking-tight leading-[1.05]">
            {c.solutionPage.closingHeadline}
          </h2>
          <p className="mt-5 text-sm text-black/45 leading-relaxed max-w-md mx-auto">
            {c.solutionPage.closingIntro}
          </p>
          <a
            href="/#demo"
            className="mt-8 inline-flex px-7 py-3 bg-[#111] text-white text-sm rounded-[10px] hover:bg-[#333] transition-colors tracking-widest"
          >
            {ctaLabel}
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
