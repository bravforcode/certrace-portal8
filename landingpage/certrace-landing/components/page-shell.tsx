"use client";

/* ════════════════════════════════════════════════════════════
   THE SHELL EVERY NEW PAGE SITS IN

   Events, Updates, About, Contact, the CBAM hub and every article open the
   same way — pixel eyebrow, blurred-in headline, one paragraph of lead — and
   close on the same CTA band. Writing that seven times invites seven slightly
   different vertical rhythms, which is exactly the drift that makes a site
   built over months look built over months.

   The CTA band is `PageCta`, and it carries the site's new default pair:
   FREE TRIAL as the primary action, BOOK A DEMO as the secondary. That order
   holds everywhere except the pages of a product that is not open yet, which
   still end on their waitlist.
   ════════════════════════════════════════════════════════════ */

import { Footer } from "./footer";
import { Navbar } from "./navbar";
import { BlurHeading, TagBadge } from "./ui";
import { usePages } from "@/lib/i18n-pages";
import { useLang } from "@/lib/i18n";
import { SIGNUP_URL } from "@/lib/site";

export function PageShell({ children }: { children: React.ReactNode }) {
  /* `lang` here as well as on <html>: the root layout prints `lang="en"` on
     every server pass and LanguageProvider corrects it only after hydration,
     so this is what tells a crawler — and a screen reader before the script
     runs — that /th/… is Thai. */
  const { lang } = useLang();
  return (
    <div lang={lang} className="bg-[#F5F4F0] text-[#111] min-h-screen font-sans antialiased">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}

export function PageHero({
  eyebrow,
  headline,
  intro,
  children,
  narrow,
}: {
  eyebrow: string;
  headline: string;
  intro?: string;
  children?: React.ReactNode;
  /** article pages want a reading measure, index pages want the full width */
  narrow?: boolean;
}) {
  return (
    <section className="px-6 pt-32 pb-12 md:px-12 md:pt-40 lg:px-20">
      <div className={`mx-auto ${narrow ? "max-w-3xl" : "max-w-6xl"}`}>
        <TagBadge>{eyebrow}</TagBadge>
        <BlurHeading
          as="h1"
          className="mt-5 text-4xl font-light leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
        >
          {headline}
        </BlurHeading>
        {intro && (
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-black/45 md:text-base">
            {intro}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}

/* The band every new page ends on. `href`/`label` override the primary action
   for the pages that have a better one — the CBAM articles send the reader to
   the trial, the events page to the demo form. */
export function PageCta({
  headline,
  body,
  primaryHref = SIGNUP_URL,
  primaryLabel,
  secondaryHref = "/#demo",
  secondaryLabel,
}: {
  headline: string;
  body: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  const { c } = useLang();
  const p = usePages();

  return (
    <section className="border-t border-black/[0.06] px-6 py-24 md:px-12 md:py-28 lg:px-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2
          className="text-3xl font-light leading-[1.05] tracking-tight md:text-4xl"
          style={{ whiteSpace: "pre-line" }}
        >
          {headline}
        </h2>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-black/45">{body}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={primaryHref}
            className="rounded-[10px] bg-[#111] px-7 py-3 text-sm tracking-widest text-white transition-colors hover:bg-[#333]"
          >
            {primaryLabel ?? p.nav.startFreeTrial}
          </a>
          <a
            href={secondaryHref}
            className="rounded-[10px] border border-black/10 px-7 py-3 text-sm tracking-widest text-black/60 transition-all hover:border-black/25 hover:bg-black/[0.04] hover:text-black"
          >
            {secondaryLabel ?? c.common.bookDemo}
          </a>
        </div>
      </div>
    </section>
  );
}

/* A back link, in the pixel face the rest of the site uses for wayfinding. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-2 font-pixel text-[11px] uppercase tracking-[0.18em] text-black/35 transition-colors hover:text-black"
    >
      <span className="transition-transform duration-200 group-hover:-translate-x-1">←</span>
      {label}
    </a>
  );
}

/* Search + filter chips, shared by /events, /updates and /about-cbam. Three
   pages that list things should filter them the same way. */
export function ListControls({
  query,
  onQuery,
  placeholder,
  filters,
  active,
  onFilter,
}: {
  query: string;
  onQuery: (v: string) => void;
  placeholder: string;
  filters?: { key: string; label: string; count?: number }[];
  active?: string;
  onFilter?: (key: string) => void;
}) {
  return (
    <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {filters && filters.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => onFilter?.(f.key)}
              className={`rounded-full border px-3.5 py-1.5 text-xs tracking-wide transition-colors ${
                active === f.key
                  ? "border-transparent bg-[#111] text-white"
                  : "border-black/10 text-black/50 hover:border-black/25 hover:text-black"
              }`}
            >
              {f.label}
              {typeof f.count === "number" && (
                <span className={active === f.key ? "text-white/50" : "text-black/25"}>
                  {" "}
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="relative sm:w-64">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/25"
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5 14 14" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full rounded-[10px] border border-black/10 bg-white/70 py-2.5 pl-9 pr-3 text-xs text-[#111] transition-colors placeholder:text-black/35 focus:border-black/25 focus:outline-none"
        />
      </div>
    </div>
  );
}

export function EmptyResult({ message, onClear, clearLabel }: { message: string; onClear: () => void; clearLabel: string }) {
  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white/60 px-6 py-16 text-center">
      <p className="text-sm text-black/45">{message}</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-4 font-pixel text-[11px] uppercase tracking-[0.18em] text-black/35 transition-colors hover:text-black"
      >
        {clearLabel}
      </button>
    </div>
  );
}
