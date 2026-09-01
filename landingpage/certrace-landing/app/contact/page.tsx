"use client";

/* Contact. Email and LINE at the top, then every social account, then the
   things a reader might actually be trying to do — see the product, price it,
   or start using it.

   LINE gets a panel rather than a row. It is the support channel this market
   answers on, and it was previously filed as one grey icon among the rest,
   which said the opposite of what is true.

   THE EMAIL ADDRESS OPENS GMAIL, not a `mailto:`. A bare mailto hands the
   click to whatever desktop client is registered, which on most machines is
   nothing at all — the link appears to do nothing. `composeHref` opens Gmail's
   compose window already addressed, which is the webmail this audience is
   actually signed into. Same rule as every other "email us" route on the site;
   see lib/content.ts. */

import { PageHero, PageShell } from "@/components/page-shell";
import { PopupFormTrigger } from "@/components/popup-form";
import { CONTACT_EMAIL, composeHref } from "@/lib/content";
import { usePages } from "@/lib/i18n-pages";
import { FEED_SOCIALS, LINE_ID, LINE_URL, SIGNUP_URL } from "@/lib/site";
import Link from "next/link";

function LineMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="21" height="21" rx="5.5" fill="currentColor" />
      <ellipse cx="12" cy="10.6" rx="7.6" ry="5.9" fill="#fff" />
      <path d="M9.4 14.9c-.3 1.6-1.4 3.2-2.1 3.8-.4.3-.7.1-.6-.3.1-.5.5-1.9.6-2.6z" fill="#fff" />
      <g fill="currentColor">
        <rect x="6.6" y="8.9" width=".8" height="3.4" />
        <rect x="6.6" y="11.5" width="2.1" height=".8" />
        <rect x="9.6" y="8.9" width=".8" height="3.4" />
        <rect x="11.4" y="8.9" width=".8" height="3.4" />
        <rect x="13.7" y="8.9" width=".8" height="3.4" />
        <polygon points="12.2,8.9 14.5,12.3 13.7,12.3 11.4,8.9" />
        <rect x="15.7" y="8.9" width=".8" height="3.4" />
        <rect x="15.7" y="8.9" width="2.1" height=".8" />
        <rect x="15.7" y="10.45" width="1.8" height=".75" />
        <rect x="15.7" y="11.5" width="2.1" height=".8" />
      </g>
    </svg>
  );
}

export default function ContactPage() {
  const p = usePages();
  const ct = p.contact;

  return (
    <PageShell>
      <PageHero eyebrow={ct.eyebrow} headline={ct.headline} intro={ct.intro} />

      <section className="px-6 pb-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* Email */}
            <div className="flex flex-col rounded-2xl border border-black/[0.07] bg-white/70 p-8">
              <h2 className="font-pixel text-[11px] uppercase tracking-[0.18em] text-black/35">
                {ct.emailHeading}
              </h2>
              <a
                href={composeHref(ct.emailSubject)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 text-xl font-light tracking-tight text-[#111] transition-colors hover:text-black/60 md:text-2xl"
                style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif" }}
              >
                {CONTACT_EMAIL}
              </a>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-black/45">{ct.emailBody}</p>
              <p className="mt-6 border-t border-black/[0.06] pt-4 text-xs text-black/35">
                {ct.responseNote}
              </p>
            </div>

            {/* LINE */}
            <div className="flex flex-col rounded-2xl border border-black/[0.07] bg-white/70 p-8">
              <h2 className="font-pixel text-[11px] uppercase tracking-[0.18em] text-black/35">
                {ct.lineHeading}
              </h2>
              <div className="mt-4 flex items-center gap-3">
                <span className="text-[#06C755]">
                  <LineMark size={26} />
                </span>
                <span
                  className="text-xl font-light tracking-tight text-[#111] md:text-2xl"
                  style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif" }}
                >
                  {LINE_ID}
                </span>
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-black/45">{ct.lineBody}</p>
              <a
                href={LINE_URL}
                target="_blank"
                rel="noopener noreferrer"
                /* No mark on the button. The panel already carries a 26px
                   LINE badge two lines above it, and repeating it inside the
                   button read as a second, competing logo rather than an
                   affordance. */
                className="mt-6 inline-flex items-center justify-center rounded-[10px] bg-[#06C755] px-5 py-3 text-xs tracking-widest text-white transition-opacity hover:opacity-90"
              >
                {ct.lineCta}
              </a>
            </div>
          </div>

          {/* Social */}
          <div className="mt-3 rounded-2xl border border-black/[0.07] bg-white/70 p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="font-pixel text-[11px] uppercase tracking-[0.18em] text-black/35">
                  {ct.socialHeading}
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-black/45">
                  {ct.socialBody}
                </p>
              </div>
            </div>

            {/* Six accounts, three across. Facebook and Instagram each appear
                twice — the global page and the Thailand-market one are separate
                accounts posting in different languages, and only the Thai ones
                carry a tag, so an untagged row is the global one. The list is
                lib/site.ts, shared with the footer, so the two can never
                disagree about which accounts exist. */}
            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {FEED_SOCIALS.map((s) => (
                <a
                  key={s.key}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3 rounded-xl border border-black/[0.07] px-4 py-3.5 transition-colors hover:border-black/20 hover:bg-white"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="text-[13px] text-black/70">{s.label}</span>
                      {s.region && (
                        <span className="rounded-[3px] border border-black/[0.08] bg-black/[0.03] px-1 font-pixel text-[8px] tracking-wider text-black/40">
                          {s.region}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-black/30">
                      {s.handle}
                    </span>
                  </span>
                  {/* A short horizontal arrow, not the long diagonal "↗". The
                      diagonal read as a stray rule cutting across the corner of
                      the box at this size; every other affordance on the site is
                      a "→" that slides right on hover, and these now match. */}
                  <span
                    className="shrink-0 text-black/25 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-black/60"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Office + the two real next steps */}
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-black/[0.07] bg-white/70 p-8">
              <h2 className="font-pixel text-[11px] uppercase tracking-[0.18em] text-black/35">
                {ct.officeHeading}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-black/45">{ct.officeBody}</p>
            </div>

            <div className="rounded-2xl border border-black/[0.07] bg-[#F0EEE8] p-8">
              <h2 className="font-pixel text-[11px] uppercase tracking-[0.18em] text-black/35">
                {ct.otherHeading}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-black/50">{ct.otherBody}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <a
                  href={SIGNUP_URL}
                  className="rounded-[10px] bg-[#111] px-5 py-2.5 text-xs tracking-widest text-white transition-colors hover:bg-[#333]"
                >
                  {ct.trialCta}
                </a>
                <Link
                  href="/#demo"
                  className="rounded-[10px] border border-black/10 px-5 py-2.5 text-xs tracking-widest text-black/60 transition-all hover:border-black/25 hover:bg-black/[0.04] hover:text-black"
                >
                  {ct.demoCta}
                </Link>
              </div>
            </div>
          </div>

          {/* The four forms, reachable from here as well as from the nav and
              the footer — somebody who came to "contact" to report a bug, or to
              ask what it costs, should not have to go back to a menu to find
              the right form. Request pricing leads: it is the one thing on this
              page a reader is most often here to do, and it was previously only
              reachable from the pricing page. */}
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                {
                  kind: "pricing" as const,
                  label: ct.pricingCardLabel,
                  desc: ct.pricingCardDesc,
                },
                { kind: "careers" as const, label: p.nav.careers, desc: p.nav.careersDesc },
                {
                  kind: "feature" as const,
                  label: p.nav.requestFeature,
                  desc: p.nav.requestFeatureDesc,
                },
                { kind: "issue" as const, label: p.nav.reportIssue, desc: p.nav.reportIssueDesc },
              ]
            ).map((f) => (
              <PopupFormTrigger
                key={f.kind}
                kind={f.kind}
                className="group flex flex-col rounded-2xl border border-black/[0.07] bg-white/60 p-6 text-left transition-colors hover:border-black/20 hover:bg-white"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="text-[14px] text-black/70 group-hover:text-black">
                    {f.label}
                  </span>
                  <span className="shrink-0 text-black/25 transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </span>
                <span className="mt-2 text-[12.5px] leading-relaxed text-black/35">{f.desc}</span>
              </PopupFormTrigger>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
