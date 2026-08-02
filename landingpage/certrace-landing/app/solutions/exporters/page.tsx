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
import { SolutionPage } from "@/components/solution-page";

/* Exporters are the primary audience, so this page carries the full story
   rather than a summary: the same sections the home page runs, rendered from
   the same components so the two can't drift. The "what you get" card grid is
   dropped here for the same reason — the sections below cover that ground in
   full. */
export default function ExportersPage() {
  return (
    <SolutionPage persona="exporters" benefits={false}>
      <ProblemSection topBorder />
      <WhyNowSection />
      <LiveSection />
      <PlatformSection />
      <ComparisonSection />
      <HowItWorksSection />
      <LanguagesSection />
      <PricingSection />
      <FaqSection />
    </SolutionPage>
  );
}
