"use client";

/* The reusable body of the marketing site.

   These sections are shared by the home page and the exporter solution page,
   so a copy or layout fix lands in both places at once. Everything textual
   comes from lib/content.ts; only the figures, icons and stagger delays —
   which are the same in every language — live here. */

import React from "react";
import { AnimatedNumber } from "@/components/animated-number";
import { CbamTimeline } from "@/components/cbam-timeline";
import { ComparisonTable } from "@/components/comparison-table";
import { CountdownTimer } from "@/components/countdown";
import { FaqList } from "@/components/faq";
import { HowItWorksPanel } from "@/components/how-it-works";
import { CompletionCount, LiveSupplierTable } from "@/components/live-table";
import { ModuleStack } from "@/components/module-stack";
import { PixelIcon } from "@/components/pixel-icon";
import { PricingPlans } from "@/components/pricing-plans";
import {
  AnimateCard,
  BlurHeading,
  TagBadge,
  handleMouseGlow,
} from "@/components/ui";
import { useLang } from "@/lib/i18n";

/* Count-up figures for the hero and the comparison strip. Three of the four
   roll "before → after", because they *are* comparisons — the status quo
   landing on what Certrace costs you instead. Only the coverage figure rolls
   up from zero: it is a fact, and a fact reads best arriving from nothing.

   All four are outcomes for the exporter reading them. Market-sizing and
   competitor counts used to sit here; they described our research rather than
   the visitor's return, and they handed the same research to anyone who
   scrolled. Captions live in the content dictionary, in this order. */
export const HERO_STATS: {
  from: number;
  to: number;
  prefix?: string;
  suffix?: string;
}[] = [
  { from: 95, to: 64, prefix: "-", suffix: "%" },
  { from: 95, to: 73, prefix: "-", suffix: "%" },
  { from: 0, to: 67 },
  { from: 40, to: 6, suffix: "×" },
];

/* Supplier-facing form languages. Thai and English are in the product today;
   the rest track the next exporter markets. */
const FORM_LANGUAGES: { name: string; live: boolean }[] = [
  { name: "English", live: true },
  { name: "ไทย", live: true },
  { name: "Tiếng Việt", live: false },
  { name: "Türkçe", live: false },
  { name: "हिन्दी", live: false },
];

/* Where the why-now timer starts its roll-down: the February 2027 milestone on
   the timeline right above it. It only sets the opening digits — the timer
   always ends on zero. */
const CERTIFICATE_SALES_OPEN = "2027-02-01T00:00:00Z";

const SECTION = "py-32 px-6 md:px-12 lg:px-20 border-t border-black/[0.06]";
const PLEX = { fontFamily: "var(--font-ibm-plex-sans), sans-serif" } as const;

/* ------------------------------------------------------------------ */
/* PAIN CHAIN — ask → delay → alternative → switch                     */
/* ------------------------------------------------------------------ */

/* Ink darkens step by step and the last beat turns to the error tone: the
   sequence itself is the argument, so it has to *look* like something going
   wrong rather than four equal-weight cards. Status colour only on the final
   step, per the DS — one red in the whole section. */
const CHAIN_TONE = [
  "text-black/25",
  "text-black/35",
  "text-black/50",
  "text-err-text",
];

function ChainArrow() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-center shrink-0 py-1.5 lg:py-0 lg:px-1 text-black/15"
    >
      {/* Points down while the cards are stacked, right once they sit in a
          row — same glyph, rotated by the breakpoint. */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="rotate-90 lg:rotate-0"
      >
        <path d="M2 7h10M8.5 3.5 12 7l-3.5 3.5" />
      </svg>
    </div>
  );
}

function PainChain() {
  const { c } = useLang();

  return (
    <div
      className="flex flex-col lg:flex-row lg:items-stretch"
      onMouseMove={handleMouseGlow}
    >
      {c.problem.chain.map((link, i) => (
        <React.Fragment key={link.step}>
          {i > 0 && <ChainArrow />}
          <AnimateCard
            className="flex-1 p-6 flex flex-col min-h-[180px]"
            delay={i * 90}
          >
            <span
              className={`font-pixel text-[11px] tracking-[0.18em] uppercase ${CHAIN_TONE[i]}`}
            >
              {String(i + 1).padStart(2, "0")} · {link.step}
            </span>
            <h3 className="mt-4 text-lg font-light leading-snug">
              {link.title}
            </h3>
            <p className="mt-2.5 text-sm text-black/45 leading-relaxed">
              {link.desc}
            </p>
          </AnimateCard>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PROBLEM                                                             */
/* ------------------------------------------------------------------ */
export function ProblemSection({ topBorder = false }: { topBorder?: boolean }) {
  const { c } = useLang();

  return (
    /* On the home page this section follows the video block, which already
       draws the dividing hairline; anywhere else it has to draw its own. */
    <section id="problem" className={topBorder ? SECTION : "py-32 px-6 md:px-12 lg:px-20"}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
          <div>
            <PixelIcon type="scatter" size={40} />
            <div className="mt-4">
              <TagBadge>{c.problem.badge}</TagBadge>
            </div>
            <BlurHeading className="mt-5 text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.05]">
              {c.problem.headline}
            </BlurHeading>
          </div>
          <p className="text-sm text-black/45 leading-relaxed max-w-xs">
            {c.problem.intro}
          </p>
        </div>

        <PainChain />

        {/* The stakes, in one strip rather than the four cards this replaced.
            Left is a real loss on a single order — the largest figure in the
            section, because it is the only one that already happened to
            somebody. Right is the recurring cost of carrying it by hand. */}
        <AnimateCard
          className="mt-3 p-8 md:p-10 flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12"
          delay={360}
          hover={false}
        >
          <div className="lg:w-[42%] shrink-0">
            <span className="font-pixel text-[11px] tracking-[0.18em] uppercase text-black/30">
              {c.problem.stakes.riskLabel}
            </span>
            <div className="mt-3 flex items-baseline gap-3 flex-wrap">
              <span
                className="text-4xl md:text-5xl font-light tracking-tight"
                style={PLEX}
              >
                {c.problem.stakes.riskFigure}
              </span>
              <span className="text-sm text-black/40">
                {c.problem.stakes.riskTitle}
              </span>
            </div>
            <p className="mt-2.5 text-sm text-black/45 leading-relaxed max-w-xs">
              {c.problem.stakes.riskCaption.before}
              <span className="text-[#111]">
                {c.problem.stakes.riskCaption.highlight}
              </span>
            </p>
          </div>

          {/* The rule is the divider between "what one order costs" and "what
              every year costs" — horizontal while the card is stacked. */}
          <div className="h-px w-full lg:h-20 lg:w-px bg-black/[0.08] shrink-0" />

          <div className="flex-1">
            <span className="font-pixel text-[11px] tracking-[0.18em] uppercase text-black/30">
              {c.problem.stakes.manualLabel}
            </span>
            <ul className="mt-3 flex flex-col gap-2">
              {c.problem.stakes.manual.map((fact) => (
                <li key={fact.lead} className="text-sm leading-relaxed">
                  <span className="text-[#111]">{fact.lead}</span>{" "}
                  <span className="text-black/45">{fact.rest}</span>
                </li>
              ))}
            </ul>
          </div>
        </AnimateCard>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* WHY NOW                                                             */
/* ------------------------------------------------------------------ */
export function WhyNowSection() {
  const { c } = useLang();

  return (
    <section id="why-now" className={SECTION}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
          <div>
            <PixelIcon type="globe" size={40} />
            <div className="mt-4">
              <TagBadge>{c.whyNow.badge}</TagBadge>
            </div>
            <BlurHeading className="mt-5 text-4xl md:text-5xl font-light tracking-tight leading-[1.05]">
              {c.whyNow.headline}
            </BlurHeading>
          </div>
          <p className="text-sm text-black/45 leading-relaxed max-w-xs">
            {c.whyNow.intro}
          </p>
        </div>

        {/* Dates, then the timer, then the line. Three blocks, three different
            kinds of thing — the "three forces" card row that used to open here
            summarised the problem rail, this timeline, and the comparison
            section, so it was the third telling of all three. */}
        <CbamTimeline />

        {/* The point of the timer is the zero it lands on: the window for
            collecting last period's data has already closed. It rolls down
            from the time left until certificate sales open and rests there. */}
        <AnimateCard className="mt-16 p-8 md:p-10" hover={false}>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
            <div>
              <span className="font-pixel text-[11px] tracking-[0.18em] uppercase text-black/30">
                {c.whyNow.countdown.eyebrow}
              </span>
              <h3 className="mt-4 text-2xl md:text-3xl font-light tracking-tight leading-snug max-w-sm">
                {c.whyNow.countdown.title}
              </h3>
            </div>
            <div className="shrink-0">
              <CountdownTimer
                target={CERTIFICATE_SALES_OPEN}
                units={c.whyNow.countdown.units}
              />
            </div>
          </div>
        </AnimateCard>

        <div className="mt-16 flex gap-6 max-w-3xl">
          <div className="w-px bg-black/15 shrink-0" />
          <blockquote className="text-xl md:text-2xl font-light leading-snug text-black/60">
            {c.whyNow.quote}
          </blockquote>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* LIVE PLATFORM                                                       */
/* ------------------------------------------------------------------ */
export function LiveSection() {
  const { c } = useLang();

  return (
    <section id="live" className={SECTION}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <PixelIcon type="signal" size={40} />
            <div className="mt-4">
              <TagBadge>{c.live.badge}</TagBadge>
            </div>
            <BlurHeading className="mt-5 text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.05]">
              {c.live.headline}
            </BlurHeading>
            <p className="mt-6 text-base text-black/40 leading-relaxed max-w-sm">
              {c.live.intro}
            </p>
            {/* Wraps rather than squeezing: the Thai caption is wider than the
                English one and, held on one line, it crushed the figure. */}
            <div className="mt-10 flex flex-wrap items-end gap-x-3 gap-y-2">
              <CompletionCount />
              <span className="text-black/30 text-sm mb-1 tracking-wide whitespace-pre-line">
                {c.live.suppliersSubmitted}
              </span>
            </div>
          </div>
          <div className="relative">
            <LiveSupplierTable />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* THE PLATFORM                                                        */
/* ------------------------------------------------------------------ */
export function PlatformSection() {
  const { c } = useLang();

  return (
    <section id="platform" className={SECTION}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
          <div>
            <PixelIcon type="leaf" size={40} />
            <div className="mt-4">
              <TagBadge>{c.platform.badge}</TagBadge>
            </div>
            <BlurHeading className="mt-5 text-4xl md:text-5xl font-light tracking-tight leading-[1.05]">
              {c.platform.headline}
            </BlurHeading>
          </div>
          <p className="text-sm text-black/45 leading-relaxed max-w-xs">
            {c.platform.intro}
          </p>
        </div>
        <ModuleStack />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* WHY CERTRACE — COMPARISON                                           */
/* ------------------------------------------------------------------ */
export function ComparisonSection() {
  const { c } = useLang();

  return (
    <section id="comparison" className={SECTION}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <PixelIcon type="scatter" size={40} />
          <div className="mt-4">
            <TagBadge>{c.comparison.badge}</TagBadge>
          </div>
          <BlurHeading className="mt-5 text-4xl md:text-5xl font-light tracking-tight leading-[1.05]">
            {c.comparison.headline}
          </BlurHeading>
          <p className="mt-6 text-sm text-black/45 leading-relaxed max-w-md">
            {c.comparison.intro}
          </p>
        </div>

        <div
          className="mb-10 grid grid-cols-2 md:grid-cols-4 gap-3"
          onMouseMove={handleMouseGlow}
        >
          {HERO_STATS.map((stat, i) => (
            <AnimateCard key={c.hero.stats[i]} className="p-6" delay={i * 80}>
              <div
                className="text-3xl md:text-4xl text-[#111] font-light tracking-tight"
                style={PLEX}
              >
                <AnimatedNumber
                  from={stat.from}
                  to={stat.to}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  duration={1500 + i * 120}
                />
              </div>
              <div className="text-xs text-black/40 tracking-widest uppercase mt-2 leading-snug">
                {c.hero.stats[i]}
              </div>
            </AnimateCard>
          ))}
        </div>

        <ComparisonTable />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* HOW IT WORKS                                                        */
/* ------------------------------------------------------------------ */
export function HowItWorksSection() {
  const { c } = useLang();

  return (
    <section id="how-it-works" className={SECTION}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <PixelIcon type="steps" size={40} />
          <div className="mt-4">
            <TagBadge>{c.howItWorks.badge}</TagBadge>
          </div>
          <BlurHeading className="mt-5 text-4xl md:text-5xl font-light tracking-tight leading-[1.05]">
            {c.howItWorks.headline}
          </BlurHeading>
        </div>

        <HowItWorksPanel />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* LANGUAGE SUPPORT                                                    */
/* ------------------------------------------------------------------ */
export function LanguagesSection() {
  const { c } = useLang();

  return (
    <section
      id="languages"
      className="py-24 px-6 md:px-12 lg:px-20 border-t border-black/[0.06]"
    >
      <div className="max-w-6xl mx-auto text-center flex flex-col items-center">
        <PixelIcon type="globe" size={40} />
        <div className="mt-4">
          <TagBadge>{c.languages.badge}</TagBadge>
        </div>
        <BlurHeading className="mt-5 text-3xl md:text-4xl font-light tracking-tight leading-[1.05]">
          {c.languages.headline}
        </BlurHeading>
        <p className="mt-5 text-sm text-black/45 leading-relaxed max-w-md">
          {c.languages.intro}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {FORM_LANGUAGES.map((lang) => (
            <div
              key={lang.name}
              className="flex items-center gap-2.5 pl-4 pr-3 py-2 rounded-full border border-black/[0.08] bg-white"
            >
              <span className="text-[13px] tracking-wide text-black/70">
                {lang.name}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] tracking-widest border ${
                  lang.live
                    ? "border-emerald-600/15 bg-emerald-50 text-emerald-700"
                    : "border-black/10 bg-black/[0.03] text-black/40"
                }`}
              >
                {lang.live && (
                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                )}
                {lang.live ? c.languages.statusLive : c.languages.statusSoon}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* PRICING                                                             */
/* ------------------------------------------------------------------ */
export function PricingSection() {
  const { c } = useLang();

  return (
    <section id="pricing" className={SECTION}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 flex flex-col items-center">
          <PixelIcon type="bars" size={40} />
          <div className="mt-4">
            <TagBadge>{c.pricing.badge}</TagBadge>
          </div>
          <BlurHeading className="mt-5 text-4xl md:text-5xl font-light tracking-tight leading-[1.05]">
            {c.pricing.headline}
          </BlurHeading>
          <p className="mt-6 text-sm text-black/45 leading-relaxed max-w-md">
            {c.pricing.intro}
          </p>
        </div>

        <PricingPlans />

        <p className="mt-10 text-xs text-black/35 tracking-wide text-center">
          {c.pricing.note}
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */
export function FaqSection() {
  const { c } = useLang();

  return (
    <section id="faq" className={SECTION}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div>
            <PixelIcon type="doc" size={40} />
            <div className="mt-4">
              <TagBadge>{c.faq.badge}</TagBadge>
            </div>
            <BlurHeading className="mt-5 text-4xl md:text-5xl font-light tracking-tight leading-[1.05]">
              {c.faq.headline}
            </BlurHeading>
          </div>
          <div className="lg:col-span-2">
            <FaqList />
          </div>
        </div>
      </div>
    </section>
  );
}
