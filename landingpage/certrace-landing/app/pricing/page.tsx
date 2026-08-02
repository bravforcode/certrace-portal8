"use client";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { PixelIcon } from "@/components/pixel-icon";
import { FaqList } from "@/components/faq";
import { PricingPlans } from "@/components/pricing-plans";
import { BlurHeading, TagBadge } from "@/components/ui";
import { useLang } from "@/lib/i18n";

export default function PricingPage() {
  const { c } = useLang();

  return (
    <div className="bg-[#F5F4F0] text-[#111] min-h-screen font-sans antialiased">
      <Navbar />

      <section className="pt-40 pb-16 px-6 md:px-12 lg:px-20">
        <div className="max-w-5xl mx-auto text-center flex flex-col items-center">
          <PixelIcon type="bars" size={40} />
          <div className="mt-4">
            <TagBadge>{c.pricing.badge}</TagBadge>
          </div>
          <BlurHeading className="mt-5 text-4xl md:text-5xl font-light tracking-tight leading-[1.05]">
            {c.pricing.headline}
          </BlurHeading>
          <p className="mt-6 text-sm text-black/45 leading-relaxed max-w-md">
            {c.pricing.introPage}
          </p>
        </div>
      </section>

      <section className="pb-32 px-6 md:px-12 lg:px-20">
        <div className="max-w-5xl mx-auto">
          <PricingPlans />
          <p className="mt-10 text-xs text-black/35 tracking-wide text-center">
            {c.pricing.note}
          </p>
        </div>
      </section>

      <section className="py-28 px-6 md:px-12 lg:px-20 border-t border-black/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <PixelIcon type="doc" size={40} />
            <div className="mt-4">
              <TagBadge>{c.pricing.questionsBadge}</TagBadge>
            </div>
            <BlurHeading className="mt-5 text-4xl md:text-5xl font-light tracking-tight leading-[1.05]">
              {c.faq.headline}
            </BlurHeading>
          </div>
          <FaqList />
        </div>
      </section>

      {/* Closing CTA. Same block the solution pages end on, carrying the
          site-wide `cta` copy — a pricing page that ends on an FAQ leaves the
          reader with nowhere to go. */}
      <section className="py-28 px-6 md:px-12 lg:px-20 border-t border-black/[0.06]">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="text-3xl md:text-4xl font-light tracking-tight leading-[1.05]"
            style={{ whiteSpace: "pre-line" }}
          >
            {c.cta.headline}
          </h2>
          <p className="mt-5 text-sm text-black/45 leading-relaxed max-w-md mx-auto">
            {c.cta.intro}
          </p>
          <a
            href="/#demo"
            className="mt-8 inline-flex px-7 py-3 bg-[#111] text-white text-sm rounded-[10px] hover:bg-[#333] transition-colors tracking-widest"
          >
            {c.common.bookDemo}
          </a>
          <p className="mt-6 text-xs text-black/30 tracking-wide">
            {c.cta.note}
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
