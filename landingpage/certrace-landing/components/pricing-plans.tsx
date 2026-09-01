"use client";

/* ════════════════════════════════════════════════════════════
   THE PLAN CARDS — the short form, shown on the home page

   WHAT CHANGED. The cards used to carry an invented feature list per tier
   ("Auditor portal seat", "Multi-regulation templates") that did not match
   what the product does. They now render the real commercial model from
   lib/pricing-model.ts: the caps, and the sentence describing who the tier is
   for. One source, so the cards and the comparison table cannot disagree.

   NO PRICES, AND NO PRICE SLOT EITHER. Deliberate — see the header of
   lib/pricing-model.ts. The cards used to carry a "Priced on request" line
   sitting between two rules where a figure would go, which gave the loudest
   position on the card to the one thing that was not there. The plan NAME is
   the heading now, and the quote is where it belongs: on a button.

   THE BUTTONS. Starter and Standard lead on the free trial — somebody ready
   to try does not need a quote first. Enterprise leads on the quote, because
   an Enterprise account is scoped before it is opened, and its second action
   is the demo rather than a second route to the same dialog.

   The card ends on a link to /pricing, which carries the same three cards AND
   the 42-row comparison. This is the summary; that is the reference.
   ════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { usePages } from "@/lib/i18n-pages";
import { TIERS, type Cap, type Tier } from "@/lib/pricing-model";
import { SIGNUP_URL } from "@/lib/site";
import { AnimateCard, handleMouseGlow } from "@/components/ui";
import { PopupForm } from "@/components/popup-form";
import type { PageCopy } from "@/lib/pages";
import Link from "next/link";

const DELAYS = [0, 80, 140];

/* A cap is a shape, not a sentence, so "Up to" and "Unlimited" are translated
   once here rather than twelve times in the dictionary. */
export function capLabel(cap: Cap, caps: PageCopy["pricingPage"]["caps"]): string {
  switch (cap.kind) {
    case "exact":
      return String(cap.n);
    case "upTo":
      return caps.upTo.replace("{n}", String(cap.n));
    case "unlimited":
      return caps.unlimited;
    case "customFrom":
      return caps.customFrom.replace("{n}", String(cap.n));
  }
}

/* Which caps appear on a card, and in which order. The comparison table shows
   all six; a card shows the four a reader actually chooses on. */
const CARD_CAPS: (keyof Tier["caps"])[] = ["cnCodes", "sites", "seats", "suppliers"];

export function PricingPlans({ compareLink = true }: { compareLink?: boolean }) {
  const { c } = useLang();
  const p = usePages();
  const pp = p.pricingPage;
  /* One dialog for all three cards. REQUEST PRICING used to scroll to the demo
     form at the bottom of the home page, which answered a different question
     and, from /pricing, meant leaving the page entirely. */
  const [quoteOpen, setQuoteOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3" onMouseMove={handleMouseGlow}>
        {TIERS.map((tier, i) => {
          const t = pp.tiers[tier.id];
          const highlight = !!tier.featured;
          /* Only the featured card fills its primary button. The other two
             outline it, so one card per row reads as the recommendation. */
          const primaryClass = `w-full rounded-[10px] py-3 text-center text-sm tracking-widest transition-all duration-200 ${
            highlight
              ? "bg-[#111] text-white hover:bg-[#333]"
              : "border border-black/10 text-black/60 hover:border-black/25 hover:bg-black/[0.04] hover:text-black"
          }`;
          const secondaryClass =
            "w-full py-1 text-center font-pixel text-[10px] uppercase tracking-[0.16em] text-black/35 transition-colors hover:text-black";
          return (
            <AnimateCard
              key={tier.id}
              className={`flex flex-col p-8 ${highlight ? "border-black/20 bg-[#F0EEE8]" : ""}`}
              delay={DELAYS[i] ?? 0}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                {/* The plan name, at the size the price used to be. It is what
                    a reader is choosing between, so it gets the type. */}
                <h3
                  className="text-[26px] font-light leading-none tracking-tight text-[#111]"
                  style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif" }}
                >
                  {t.name}
                </h3>
                <span className="mt-1 shrink-0 rounded-full border border-black/10 px-2 py-0.5 font-pixel text-[9px] uppercase tracking-[0.12em] text-black/40">
                  {t.tag}
                </span>
              </div>

              {/* Two lines of room, so the Enterprise line does not shove the
                  block below it out of line with the other two cards. */}
              <p className="mb-6 min-h-[44px] text-sm leading-relaxed text-black/70">{t.line}</p>

              <dl className="mb-6">
                <dt className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/35">
                  {t.forLabel}
                </dt>
                <dd className="mt-2 text-[13px] leading-relaxed text-black/55">{t.builtFor}</dd>
              </dl>

              <div className="mt-auto border-t border-black/[0.08]">
                {CARD_CAPS.map((key, j) => (
                  <div
                    key={key}
                    className={`flex items-baseline justify-between gap-3 py-2.5 text-[13px] ${
                      j < CARD_CAPS.length - 1 ? "border-b border-black/[0.06]" : ""
                    }`}
                  >
                    <span className="text-black/50">{pp.caps[key]}</span>
                    <span className="font-pixel text-[11px] uppercase tracking-[0.04em] text-black/75">
                      {capLabel(tier.caps[key], pp.caps)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Enterprise is the one tier whose first move is a conversation,
                  so the two actions swap: the quote takes the button, and the
                  demo takes the quiet line under it. */}
              <div className="mt-6 flex flex-col gap-2">
                {tier.id === "enterprise" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setQuoteOpen(true)}
                      className={primaryClass}
                    >
                      {c.common.requestPricing}
                    </button>
                    <Link href="/#demo" className={secondaryClass}>
                      {c.common.bookDemo}
                    </Link>
                  </>
                ) : (
                  <>
                    <a href={SIGNUP_URL} className={primaryClass}>
                      {pp.startTrial}
                    </a>
                    <button
                      type="button"
                      onClick={() => setQuoteOpen(true)}
                      className={secondaryClass}
                    >
                      {c.common.requestPricing}
                    </button>
                  </>
                )}
              </div>
            </AnimateCard>
          );
        })}
      </div>

      {/* The bridge to the full table. The ask was explicit: the landing shows
          cards, and a reader who wants the detail clicks through to a page
          carrying both the cards and the comparison. */}
      {compareLink && (
        <a
          href="/pricing"
          className="group mt-3 flex items-center justify-between gap-4 rounded-2xl border border-black/[0.07] bg-white/60 px-6 py-5 transition-colors hover:border-black/20 hover:bg-white"
        >
          <span className="min-w-0">
            <span className="block font-pixel text-[11px] uppercase tracking-[0.18em] text-black/60 group-hover:text-black">
              {pp.compareLink}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-black/35">
              {pp.compareLinkSub}
            </span>
          </span>
          <span className="shrink-0 text-black/30 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-black">
            →
          </span>
        </a>
      )}

      <PopupForm kind="pricing" open={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </>
  );
}
