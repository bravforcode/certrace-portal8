"use client";

import {
  ComparisonSection,
  FaqSection,
  HowItWorksSection,
  LanguagesSection,
  LiveSection,
  PlatformSection,
  PricingSection,
  ProblemSection,
  WhyNowSection,
} from "@/components/sections";
import { CnCalculator } from "@/components/cn-calculator";
import { SolutionPage } from "@/components/solution-page";

/* Exporters are the primary audience, so this page carries the full story
   rather than a summary: the same sections the home page runs, rendered from
   the same components so the two can't drift. There is no "what you get" card
   grid here for the same reason — the sections below cover that ground in
   full; SolutionPage renders one for suppliers only. */
export default function ExportersPage() {
  return (
    <SolutionPage persona="exporters">
      <ProblemSection topBorder />
      <WhyNowSection />
      <LiveSection />
      <PlatformSection />
      <ComparisonSection />
      <HowItWorksSection />
      <LanguagesSection />
      {/* The count before the price — see the same pairing on the home page. */}
      <CnCalculator />
      <PricingSection />
      <FaqSection />
    </SolutionPage>
  );
}
