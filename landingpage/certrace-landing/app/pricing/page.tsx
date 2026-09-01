"use client";

/* The comprehensive pricing page. The home page and the exporter page carry
   the three cards and a link here; this page carries the cards AND the full
   42-row comparison, which is the ask: a reader who wants the detail lands on
   one page that has both rather than a table with no context. */

import { CnCalculator } from "@/components/cn-calculator";
import { PageCta, PageShell } from "@/components/page-shell";
import { PixelIcon } from "@/components/pixel-icon";
import { PricingCompare } from "@/components/pricing-compare";
import { PricingPlans } from "@/components/pricing-plans";
import { BlurHeading, TagBadge } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import { usePages } from "@/lib/i18n-pages";

export default function PricingPage() {
  const { c } = useLang();
  const p = usePages();
  const pp = p.pricingPage;

  return (
    <PageShell>
      <section className="px-6 pt-40 pb-14 md:px-12 lg:px-20">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <PixelIcon type="bars" size={40} />
          <div className="mt-4">
            <TagBadge>{pp.eyebrow}</TagBadge>
          </div>
          <BlurHeading
            as="h1"
            className="mt-5 text-4xl font-light leading-[1.05] tracking-tight md:text-5xl"
          >
            {pp.headline}
          </BlurHeading>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-black/45">{pp.intro}</p>
        </div>
      </section>

      {/* The cards, without the compare link — the reader is already here. */}
      <section className="px-6 pb-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-5xl">
          <PricingPlans compareLink={false} />
          <p className="mt-8 text-center text-xs tracking-wide text-black/35">{c.pricing.note}</p>
        </div>
      </section>

      <section
        id="compare"
        className="border-t border-black/[0.06] px-6 py-24 md:px-12 lg:px-20"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <PixelIcon type="doc" size={40} />
              <div className="mt-4">
                <TagBadge>{pp.compareLink}</TagBadge>
              </div>
              <BlurHeading className="mt-5 text-3xl font-light leading-[1.05] tracking-tight md:text-4xl">
                {pp.compareHeading}
              </BlurHeading>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-black/45">{pp.compareIntro}</p>
          </div>

          <PricingCompare />

          <p className="mt-6 flex flex-wrap gap-x-7 gap-y-1.5 font-pixel text-[10.5px] uppercase tracking-[0.1em] text-black/35">
            {pp.colophon.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </p>
        </div>
      </section>

      {/* The free engine sits BETWEEN the table and the plan FAQ, on purpose: a
          reader who has just been through 42 rows still has to answer "so which
          one am I?", and the answer turns on a number most exporters do not
          have to hand. See components/cn-calculator.tsx. */}
      <CnCalculator />

      {/* Plan questions, not product questions — the site-wide FAQ still lives
          on the home page and answers a different reader. */}
      <section className="border-t border-black/[0.06] px-6 py-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-3xl">
          <TagBadge>{c.pricing.questionsBadge}</TagBadge>
          <BlurHeading className="mt-5 text-3xl font-light leading-[1.05] tracking-tight md:text-4xl">
            {pp.faqHeading}
          </BlurHeading>
          <dl className="mt-10 divide-y divide-black/[0.07] border-y border-black/[0.07]">
            {pp.faq.map((item) => (
              <div key={item.q} className="py-6">
                <dt className="text-[15px] font-light text-[#111]">{item.q}</dt>
                <dd className="mt-2.5 max-w-2xl text-sm leading-relaxed text-black/50">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <PageCta headline={pp.ctaHeadline} body={pp.ctaBody} />
    </PageShell>
  );
}
