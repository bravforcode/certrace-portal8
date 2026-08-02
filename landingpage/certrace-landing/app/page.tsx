"use client";

import { useCallback, useState } from "react";
import { AnimatedNumber } from "@/components/animated-number";
import { DemoForm } from "@/components/demo-form";
import { HeroCanvas } from "@/components/hero-canvas";
import { MarqueeBand } from "@/components/marquee";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { PixelIcon } from "@/components/pixel-icon";
import {
  ComparisonSection,
  FaqSection,
  HERO_STATS,
  HowItWorksSection,
  LanguagesSection,
  LiveSection,
  PlatformSection,
  PricingSection,
  ProblemSection,
  WhyNowSection,
} from "@/components/sections";
import { SplashScreen } from "@/components/splash-screen";
import { AnimateCard, BlurHeading, TagBadge, handleMouseGlow } from "@/components/ui";
import { useLang } from "@/lib/i18n";

const AUDIENCE_LINKS: { id: string; href: string; live: boolean; delay: number }[] =
  [
    { id: "for-exporters", href: "/solutions/exporters", live: true, delay: 0 },
    { id: "for-suppliers", href: "/solutions/suppliers", live: true, delay: 80 },
    {
      id: "for-legal",
      href: "/solutions/legal-compliance",
      live: true,
      delay: 140,
    },
    {
      id: "for-importers",
      href: "/solutions/importers",
      live: false,
      delay: 200,
    },
  ];

function CtaBarField() {
  // Echo of a rising bar chart — emissions data settling into order.
  const bars = Array.from({ length: 36 }, (_, i) => {
    const bell = Math.exp(-Math.pow((i - 17.5) / 9, 2));
    return {
      height: 28 + bell * 110 + ((i * 37) % 23),
      emerald: i % 3 === 0,
      delay: (i * 137) % 900,
    };
  });

  return (
    <>
      <div
        className="absolute inset-x-0 bottom-0 flex items-end justify-center gap-[6px] px-6 pointer-events-none select-none"
        aria-hidden="true"
      >
        {bars.map((bar, i) => (
          <div
            key={i}
            className="w-3 sm:w-4 rounded-t-md shrink-0"
            style={{
              height: bar.height,
              background: bar.emerald
                ? "rgba(16,185,129,0.16)"
                : "rgba(17,17,17,0.06)",
              border: "1px solid rgba(17,17,17,0.05)",
              borderBottom: "none",
              transformOrigin: "bottom",
              animation: `barBreathe ${5 + (i % 4)}s ease-in-out ${bar.delay}ms infinite`,
            }}
          />
        ))}
      </div>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          maskImage: "linear-gradient(to top, transparent 0%, black 55%)",
          WebkitMaskImage: "linear-gradient(to top, transparent 0%, black 55%)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(245,244,240,0.4) 0%, rgba(245,244,240,0.92) 30%, transparent 60%)",
        }}
      />
    </>
  );
}

export default function HomePage() {
  const { c } = useLang();
  const [heroReady, setHeroReady] = useState(false);

  const onSplashDone = useCallback(() => setHeroReady(true), []);

  const heroFade = (delay: number) =>
    ({
      opacity: heroReady ? 1 : 0,
      filter: heroReady ? "blur(0px)" : "blur(16px)",
      transform: heroReady ? "translateY(0px)" : "translateY(24px)",
      transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms, filter 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }) as const;

  return (
    <div
      id="top"
      className="bg-[#F5F4F0] text-[#111] min-h-screen font-sans antialiased"
    >
      <SplashScreen onDone={onSplashDone} />
      <Navbar />

      {/* ---------------------------------------------------------------- */}
      {/* HERO                                                              */}
      {/* ---------------------------------------------------------------- */}
      {/* `.hero-shell` = min-height:100svh (globals.css), and the copy below is
          in flow with `mt-auto` rather than pinned with `absolute bottom-0`.
          Both are for phones: a fixed 100vh box on a phone is taller than the
          screen, and a bottom-pinned block spends that difference growing up
          behind the header — the eyebrow and the first headline line were off
          the top of the screen on anything shorter than ~850px. In flow the
          section grows downward instead, so nothing can ever sit under the
          header. Desktop geometry is unchanged: the copy still bottoms out on
          the fold. */}
      <section className="hero-shell relative overflow-hidden flex flex-col">
        <div
          className="absolute inset-0 z-0"
          style={{
            transform: heroReady ? "scale(1.02)" : "scale(0.88)",
            opacity: heroReady ? 1 : 0,
            transition:
              "transform 2s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.2s ease",
          }}
        >
          <HeroCanvas />
        </div>

        <div
          className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
          style={{
            height: "65%",
            background:
              "linear-gradient(to top, #F5F4F0 0%, #F5F4F0 14%, rgba(245,244,240,0.8) 32%, rgba(245,244,240,0.45) 55%, rgba(245,244,240,0.1) 75%, transparent 100%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
          style={{
            height: "20%",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            maskImage: "linear-gradient(to top, black 0%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to top, black 0%, transparent 100%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
          style={{
            height: "45%",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            maskImage: "linear-gradient(to top, black 0%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to top, black 0%, transparent 100%)",
          }}
        />

        {/* Header clearance: the copy can never rise past this. */}
        <div className="h-20 shrink-0" />

        <div className="relative z-30 mt-auto flex flex-col px-6 md:px-12 pb-10 md:pb-12 max-w-4xl">
          <div style={heroFade(0)} className="mb-6">
            <TagBadge>{c.hero.badge}</TagBadge>
          </div>

          <h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-[#111] leading-[1.0] tracking-tight mb-7"
            style={{
              fontFamily: "var(--font-ibm-plex-sans), sans-serif",
              whiteSpace: "pre-line",
              ...heroFade(60),
            }}
          >
            {c.hero.headline}
          </h1>

          <p
            className="text-sm md:text-base text-black/45 leading-relaxed max-w-md mb-8"
            style={heroFade(180)}
          >
            {c.hero.intro}
          </p>

          <div className="flex flex-wrap gap-3 mb-10" style={heroFade(260)}>
            <a
              href="#demo"
              className="px-7 py-3 bg-[#111] text-white text-sm rounded-[10px] hover:bg-[#333] transition-colors tracking-widest"
            >
              {c.common.bookDemo}
            </a>
            <a
              href="#how-it-works"
              className="px-7 py-3 rounded-[10px] border border-black/10 text-sm text-black/60 hover:border-black/25 hover:text-black hover:bg-black/[0.04] transition-all tracking-widest"
            >
              {c.common.seeHowItWorks}
            </a>
          </div>

          {/* 2×2 on phones, one row from sm up — a wrapping flex row left a
              lone stat stranded on its own line at mobile widths. */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-6 sm:gap-x-10">
            {HERO_STATS.map((stat, i) => (
              <div key={c.hero.stats[i]} style={heroFade(340 + 80 * i)}>
                <div
                  className="text-3xl sm:text-4xl text-[#111] font-light tracking-tight"
                  style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif" }}
                >
                  <AnimatedNumber
                    from={stat.from}
                    to={stat.to}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    duration={1500 + i * 120}
                    active={heroReady}
                  />
                </div>
                <div
                  className="text-xs text-black/40 tracking-widest uppercase mt-1 max-w-[140px]"
                  style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif" }}
                >
                  {c.hero.stats[i]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarqueeBand />

      {/* ---------------------------------------------------------------- */}
      {/* VIDEO INTRO                                                       */}
      {/* ---------------------------------------------------------------- */}
      <section
        id="intro"
        className="py-20 px-6 md:px-12 lg:px-20 border-t border-black/[0.06]"
      >
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <div className="w-full rounded-2xl overflow-hidden bg-black aspect-video">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/_OHf61dbt4Y"
              title={c.hero.videoTitle}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      <ProblemSection />
      <WhyNowSection />
      <LiveSection />
      <PlatformSection />
      <ComparisonSection />
      <HowItWorksSection />

      {/* ---------------------------------------------------------------- */}
      {/* WHO IT'S FOR                                                      */}
      {/* ---------------------------------------------------------------- */}
      <section
        id="stakeholders"
        className="py-32 px-6 md:px-12 lg:px-20 border-t border-black/[0.06]"
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <PixelIcon type="people" size={40} />
            <div className="mt-4">
              <TagBadge>{c.stakeholders.badge}</TagBadge>
            </div>
            <BlurHeading className="mt-5 text-4xl md:text-5xl font-light tracking-tight leading-[1.05]">
              {c.stakeholders.headline}
            </BlurHeading>
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
            onMouseMove={handleMouseGlow}
          >
            {c.stakeholders.audiences.map((audience, i) => {
              const link = AUDIENCE_LINKS[i];
              return (
                <AnimateCard
                  key={audience.title}
                  id={link.id}
                  className="p-8 flex flex-col min-h-[240px]"
                  delay={link.delay}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-light">{audience.title}</h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] tracking-widest border shrink-0 ${
                        link.live
                          ? "border-emerald-600/15 bg-emerald-50 text-emerald-700"
                          : "border-black/10 bg-black/[0.03] text-black/40"
                      }`}
                    >
                      {link.live && (
                        <span className="w-1 h-1 rounded-full bg-emerald-500" />
                      )}
                      {link.live ? c.common.live : c.common.soon}
                    </span>
                  </div>
                  <p className="text-sm text-black/45 leading-relaxed flex-1 mb-6">
                    {audience.desc}
                  </p>
                  <a
                    href={link.href}
                    className="inline-flex items-center gap-2 text-[11px] tracking-widest text-black/40 hover:text-black transition-colors group/link"
                  >
                    {audience.cta.toUpperCase()}
                    <span className="transition-transform duration-200 group-hover/link:translate-x-1">
                      →
                    </span>
                  </a>
                </AnimateCard>
              );
            })}
          </div>
        </div>
      </section>

      <LanguagesSection />
      <PricingSection />
      <FaqSection />

      {/* ---------------------------------------------------------------- */}
      {/* FINAL CTA                                                         */}
      {/* ---------------------------------------------------------------- */}
      <section
        id="demo"
        className="relative py-32 md:py-40 px-6 md:px-12 lg:px-20 border-t border-black/[0.06] overflow-hidden"
      >
        <CtaBarField />

        <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div>
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.05] mb-6"
              style={{ whiteSpace: "pre-line" }}
            >
              {c.cta.headline}
            </h2>
            <p className="text-sm text-black/45 leading-relaxed mb-6 max-w-sm">
              {c.cta.intro}
            </p>
            <p className="text-xs text-black/30 tracking-wide">{c.cta.note}</p>
          </div>

          <DemoForm />
        </div>
      </section>

      <MarqueeBand variant="cta" />

      {/* ---------------------------------------------------------------- */}
      {/* FOOTER                                                            */}
      {/* ---------------------------------------------------------------- */}
      <Footer />
    </div>
  );
}
