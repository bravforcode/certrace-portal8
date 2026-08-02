"use client";

import { useLang } from "@/lib/i18n";
import { AnimateCard, handleMouseGlow } from "@/components/ui";

/* Middle plan is the highlighted one; the stagger is positional. Everything
   else — tier names, the supplier band under each name, and the feature
   lists — comes from lib/content.ts so both languages stay in step. */
const HIGHLIGHT_INDEX = 1;
const DELAYS = [0, 80, 140];

export function PricingPlans() {
  const { c } = useLang();

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-3 gap-3"
      onMouseMove={handleMouseGlow}
    >
      {c.pricing.plans.map((plan, i) => {
        const highlight = i === HIGHLIGHT_INDEX;
        return (
          <AnimateCard
            key={plan.name}
            className={`p-8 flex flex-col ${
              highlight ? "border-black/20 bg-[#F0EEE8]" : ""
            }`}
            delay={DELAYS[i] ?? 0}
          >
            <div className="font-pixel text-[11px] tracking-widest text-black/40 mb-4">
              {plan.name}
            </div>
            {/* The band this plan covers. Two lines of room so the Enterprise
                tier's longer qualifier doesn't shove its rule out of line with
                the other two cards. */}
            <p className="text-sm text-black/55 leading-relaxed min-h-[44px]">
              {plan.sub}
            </p>

            <div className="my-6 h-px bg-black/[0.08]" />

            <ul className="space-y-3 flex-1 mb-8">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-3 text-sm text-black/55"
                >
                  <span className="w-1 h-1 rounded-full bg-black/25 shrink-0 mt-[7px]" />
                  <span className="leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>

            <a
              href="/#demo"
              className={`w-full py-3 rounded-[10px] text-sm tracking-widest text-center transition-all duration-200 ${
                highlight
                  ? "bg-[#111] text-white hover:bg-[#333]"
                  : "border border-black/10 text-black/60 hover:border-black/25 hover:text-black hover:bg-black/[0.04]"
              }`}
            >
              {c.common.requestPricing}
            </a>
          </AnimateCard>
        );
      })}
    </div>
  );
}
