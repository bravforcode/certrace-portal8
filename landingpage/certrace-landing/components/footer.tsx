"use client";

/* ════════════════════════════════════════════════════════════
   THE FOOTER — the whole nav, in four columns

   THE RULE THIS FOLLOWS. Everything reachable from the header is reachable
   from here. A reader who has scrolled to the bottom has passed every section
   already; sending them back up to a menu to find Events or About CBAM is the
   one thing a footer exists to prevent.

   FOUR COLUMNS, not six. The grid is 12 tracks — 4 for the brand block and 2
   for each of four link columns. That is a hard constraint, so the header's
   five groups are folded into four:

     PRODUCT     the six platform features (was PLATFORM)
     WHO IT'S FOR the four sides of the chain, unchanged
     RESOURCES   About CBAM, How it works, FAQ, timeline, backlog, updates,
                 and the free CN-code engine
     COMPANY     about, contact, events, pricing, demo, and the three forms

   LINE IS NOT A SOCIAL ICON. It is the support channel Thai exporters actually
   answer on, so it gets a labelled button of its own in the brand column
   rather than being filed as one grey square among six. The feed accounts are
   icons, on their own row under the columns, and the two Thailand-market ones
   carry a TH tag; Facebook and Instagram appear twice each because the global
   page and the Thai page are different accounts — see lib/site.ts.

   THAT ICON ROW IS ALSO THE SIGN-UP ROW. See the Newsletter box below: the
   two of them share one line under the columns, which is what replaced the
   full-width newsletter strip that used to sit there.

   Report an issue has left the bottom bar. It sits in COMPANY now, as a form
   rather than a mail link, alongside Careers and Request a feature; the bottom
   bar is for legal fine print and the language control only.
   ════════════════════════════════════════════════════════════ */

import { CONTACT_EMAIL } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import { usePages } from "@/lib/i18n-pages";
import { FEED_SOCIALS, LINE_ID, LINE_URL } from "@/lib/site";
import Link from "next/link";
import { CertraceLogo } from "./logo";
import { LanguageSwitch } from "./navbar";
import { PopupForm, type PopupFormKind } from "./popup-form";
import { syncNewsletter } from "@/lib/sheet-sync";
import { useId, useState } from "react";

/* LINE's mark is a rounded-square badge with a white speech balloon and the
   LINE wordmark inside — drawn as paths so it stays crisp at 16px and
   inherits the ink around it rather than brand green. */
function LineIcon({ size = 16 }: { size?: number }) {
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

const ICONS: Record<string, React.ReactNode> = {
  linkedin: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  ),
  facebook: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94z" />
    </svg>
  ),
  instagram: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  youtube: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
    </svg>
  ),
};

/* A link in a column: a route, an external address, or one of the three
   dialogs. Keeping all three shapes in one type is what lets COMPANY hold
   Careers and Contact side by side without the column knowing the difference. */
type FooterLink = {
  label: string;
  href?: string;
  external?: boolean;
  form?: PopupFormKind;
};

/* ════════════════════════════════════════════════════════════
   THE NEWSLETTER BOX

   One field and a button, sitting beside the social icons rather than under a
   heading of its own. It used to be a full strip — "CBAM, in your inbox", a
   paragraph explaining the list, and a consent line under the field. That is
   three pieces of furniture for one input at the bottom of a page whose reader
   has already scrolled past everything.

   THE CONSENT SITS UNDER THE FIELD, small. It rode in the placeholder for a
   while, which cost no vertical space but spent the one line that should tell
   a reader what to type — and a placeholder cannot hold anchors, so Terms and
   Privacy were flattened to plain words. Under the row it is one 10.5px line,
   the field says `you@company.com` again, and the two labels are links.

   IT MUST NOT BE SQUEEZED. Field and button are one flex row from `sm` up,
   where the button never shrinks and the field takes the rest; below that they
   stack and both go full width at the same height. The whole box is capped so
   it stays a box rather than a banner.

   The field's `min-w` floor is set LOW on purpose. It is not there to keep the
   field wide — `flex-1` does that — it is there to stop the row overflowing
   its column at the one width where it is tightest: the md breakpoint, in
   Vietnamese, whose "ĐĂNG KÝ NHẬN TIN" button is half again as wide as
   "SUBSCRIBE". A 220px floor pushed the button 24px past the footer's right
   edge in that one combination.
   ════════════════════════════════════════════════════════════ */
function Newsletter() {
  const p = usePages();
  const n = p.footer.newsletter;
  const id = useId();

  const [email, setEmail] = useState("");
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);

  /* The same rule the pop-up forms use — something, an @, something with a
     dot in it. Anything stricter rejects real addresses. */
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      setError(true);
      return;
    }
    setError(false);
    syncNewsletter(email);
    setDone(true);
  }

  /* The consent sentence, with the two placeholders in the template resolved
     to real anchors. Splitting on the tokens keeps the surrounding words in
     whatever order the language puts them — Thai runs the labels together
     with no spaces, so nothing here may assume "… {terms} and {privacy}.". */
  const consent = n.consent.split(/(\{terms\}|\{privacy\})/g).map((part, i) => {
    if (part === "{terms}")
      return (
        <a key={i} href="/terms" className="underline underline-offset-2 hover:text-black/60">
          {n.termsLabel}
        </a>
      );
    if (part === "{privacy}")
      return (
        <a key={i} href="/privacy" className="underline underline-offset-2 hover:text-black/60">
          {n.privacyLabel}
        </a>
      );
    return <span key={i}>{part}</span>;
  });

  return (
    /* Grows toward 460px on a wide footer and holds a 340px floor on a narrow
       one, so the consent line under the field wraps to two rows at most
       without the box ever becoming a banner. */
    <div className="w-full md:max-w-[460px] md:min-w-[340px] md:flex-1">
      {done ? (
        <p
          className="flex min-h-[42px] items-center text-[12.5px] leading-relaxed text-black/55 md:justify-end md:text-right"
          role="status"
        >
          {n.success}
        </p>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor={id} className="sr-only">
            {n.heading}
          </label>
          <input
            id={id}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(false);
            }}
            placeholder={n.placeholder}
            aria-invalid={error || undefined}
            /* The consent line is described BY the field, not just printed
               near it, so it is read out with the label either way. */
            aria-describedby={error ? `${id}-err ${id}-consent` : `${id}-consent`}
            /* `flex-1` is `sm:` ONLY. While the row is stacked the container is
               a column, and there flex-basis:0 applies to the HEIGHT — which
               collapsed the field to 19px and made it look squeezed next to a
               full-height button. */
            className={`h-[42px] w-full min-w-0 rounded-[10px] border bg-white/70 px-3.5 text-[13px] text-[#111] outline-none transition-colors placeholder:text-black/30 focus:border-black/30 sm:min-w-[150px] sm:flex-1 ${
              error ? "border-[#B4462F]/50" : "border-black/[0.10]"
            }`}
          />
          <button
            type="submit"
            className="h-[42px] w-full shrink-0 rounded-[10px] bg-[#111] px-6 text-xs tracking-widest text-white transition-colors hover:bg-[#333] sm:w-auto"
          >
            {n.submit}
          </button>
        </form>
      )}

      {error && !done && (
        <p id={`${id}-err`} className="mt-2 text-[11px] text-[#B4462F] md:text-right">
          {n.invalidEmail}
        </p>
      )}

      {/* Under the bar, at the smallest size on the page. It is fine print by
          nature, and the reader has to see it before typing rather than after
          subscribing — so it goes when the form does. */}
      {!done && (
        <p
          id={`${id}-consent`}
          className="mt-2.5 text-[10.5px] leading-relaxed text-black/30 md:text-right"
        >
          {consent}
        </p>
      )}
    </div>
  );
}

export function Footer() {
  const { c } = useLang();
  const p = usePages();
  const l = c.footer.links;
  const [formOpen, setFormOpen] = useState<PopupFormKind | null>(null);

  const columns: { title: string; links: FooterLink[] }[] = [
    {
      title: p.footer.columns.product,
      links: [
        { label: l.smartLink, href: "/#platform-invite" },
        { label: l.profile, href: "/#platform-profile" },
        { label: l.aiCheck, href: "/#platform-quality" },
        { label: l.engine, href: "/#platform-engine" },
        { label: l.benchmark, href: "/#platform-benchmark" },
        { label: l.reports, href: "/#platform-report" },
        { label: l.pricing, href: "/pricing" },
      ],
    },
    {
      title: p.footer.columns.solutions,
      links: [
        { label: l.exporters, href: "/solutions/exporters" },
        { label: l.suppliers, href: "/solutions/suppliers" },
        { label: l.legalCompliance, href: "/solutions/legal-compliance" },
        { label: l.importers, href: "/solutions/importers" },
      ],
    },
    {
      title: p.footer.columns.resources,
      links: [
        { label: p.nav.aboutCbam, href: "/about-cbam" },
        { label: l.howItWorks, href: "/#how-it-works" },
        { label: l.faq, href: "/#faq" },
        { label: l.timeline, href: "/#why-now" },
        { label: l.backlog, href: "/backlog" },
        { label: p.nav.updates, href: "/updates" },
        { label: p.pricingPage.calc.navLabel, href: "/pricing#cbam-engine" },
      ],
    },
    {
      title: p.footer.columns.company,
      links: [
        { label: p.nav.about, href: "/about" },
        { label: p.nav.contact, href: "/contact" },
        { label: p.nav.events, href: "/events" },
        { label: l.bookDemo, href: "/#demo" },
        { label: p.nav.careers, form: "careers" },
        { label: p.nav.requestFeature, form: "feature" },
        { label: p.nav.reportIssue, form: "issue" },
      ],
    },
  ];

  /* Legal fine print only. Report an issue used to sit here as a mail link and
     has moved into COMPANY as a form — a bug report is not fine print. */
  const legalLinks: { label: string; href: string }[] = [
    { label: l.terms, href: "/terms" },
    { label: l.privacy, href: "/privacy" },
    /* Cookie policy has no page yet — left inert on purpose rather than
       pointing at a 404. */
    { label: l.cookies, href: "#" },
  ];

  const linkClass =
    "text-xs text-black/35 hover:text-black/70 transition-colors tracking-wide text-left";

  return (
    <footer className="pt-16 pb-10 px-6 md:px-12 lg:px-20 border-t border-black/[0.06]">
      {/* 12-column grid: 4 for the brand block + 2 per link column × 4 = 12.
          The total must land on exactly 12 — an earlier split summed to 15
          and wrapped the last column onto its own row. */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-12 gap-x-8 gap-y-12">
        <div className="col-span-2 md:col-span-4">
          <Link href="/#top" aria-label={c.nav.backToTop}>
            <CertraceLogo className="h-[18px] w-auto opacity-80" />
          </Link>
          <p className="mt-5 text-xs text-black/35 leading-relaxed max-w-[250px]">
            {c.footer.desc}
          </p>
          <div className="mt-6 space-y-1.5 text-xs text-black/35">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="block hover:text-black/70 transition-colors"
            >
              {CONTACT_EMAIL}
            </a>
            <p>{c.footer.location}</p>
          </div>

          {/* LINE, as a button. It is the channel that actually gets answered
              in this market, and an icon square said the opposite. */}
          <a
            href={LINE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2.5 rounded-[10px] border border-black/[0.10] bg-white/70 px-3.5 py-2.5 transition-colors hover:border-black/20 hover:bg-white"
          >
            <span className="text-[#06C755]">
              <LineIcon size={18} />
            </span>
            <span className="leading-tight">
              <span className="block text-[12px] text-black/70">{p.footer.lineCta}</span>
              {/* The offer first, the handle after it — "Talk to a CBAM
                  expert" is the reason to tap; the ID is only how you find
                  the account once you have decided to. */}
              <span className="block text-[10px] text-black/35">
                {p.footer.lineSub} · {LINE_ID}
              </span>
            </span>
          </a>
        </div>

        {columns.map((column) => (
          <div key={column.title} className="md:col-span-2">
            <div className="font-pixel text-[10px] tracking-[0.2em] text-black/30 mb-4">
              {column.title}
            </div>
            <ul className="space-y-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  {link.form ? (
                    <button
                      type="button"
                      onClick={() => setFormOpen(link.form!)}
                      className={linkClass}
                    >
                      {link.label}
                    </button>
                  ) : (
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className={linkClass}
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── FOLLOW + SIGN UP ────────────────────────────────────────────
          One row under the link columns and above the legal bar: the icons on
          the left, the newsletter box on the right. Both used to live
          elsewhere — the icons stacked under the LINE button in the brand
          column, the newsletter in a full-width strip of its own — and putting
          them on one line is what lets the strip go away without the sign-up
          going with it.

          It stacks on phones in DOM order, which is the order that reads: the
          things you can follow, then the thing you can subscribe to, then the
          fine print. */}
      <div className="mx-auto mt-14 flex max-w-6xl flex-col gap-8 border-t border-black/[0.06] pt-8 md:flex-row md:items-center md:justify-between md:gap-10">
        <div>
          <div className="font-pixel text-[10px] tracking-[0.2em] text-black/25 mb-2.5">
            {p.footer.followUs}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {FEED_SOCIALS.map((social) => (
              <a
                key={social.key}
                href={social.href}
                aria-label={
                  social.region ? `${social.label} (${social.region})` : social.label
                }
                target="_blank"
                rel="noopener noreferrer"
                className="relative w-8 h-8 rounded-lg border border-black/[0.08] flex items-center justify-center text-black/30 hover:text-black/70 hover:border-black/20 transition-colors"
              >
                {ICONS[social.icon ?? social.key]}
                {/* The market tag, for the two accounts that serve one. It
                    is a real distinction — the Thai channel posts in Thai —
                    so it is on the icon rather than only in the alt text. */}
                {social.region && (
                  <span className="absolute -bottom-1 -right-1 rounded-[3px] border border-black/[0.08] bg-[#F5F4F0] px-[3px] font-pixel text-[7px] leading-[1.4] tracking-wider text-black/40">
                    {social.region}
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>

        <Newsletter />
      </div>

      {/* Legal bar: copyright, the legal links, and the language control.
          Desktop: one row. Mobile: stacked and centred. DOM order gives both
          without reordering, so it matches reading order in either layout. */}
      <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-black/[0.04] flex flex-col items-center gap-5 text-center md:flex-row md:items-center md:justify-between md:gap-6 md:text-left">
        <div className="order-1 flex flex-col items-center gap-3 md:flex-row md:items-center md:gap-5">
          <span className="text-xs text-black/20">{c.footer.copyright}</span>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {legalLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs text-black/25 hover:text-black/60 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
        {/* Last row of the page — the panel has to open upward or it lands
            outside the document and gets clipped. And because this bar centres
            its children on phones, the panel is centred on the button there
            too (right-aligned again from md, where the bar goes back to one
            row with this control on the right edge). */}
        <LanguageSwitch className="order-2" placement="up" align="responsive" />
      </div>

      {(["careers", "feature", "issue"] as PopupFormKind[]).map((kind) => (
        <PopupForm
          key={kind}
          kind={kind}
          open={formOpen === kind}
          onClose={() => setFormOpen(null)}
        />
      ))}
    </footer>
  );
}
