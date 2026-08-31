"use client";

import Link from "next/link";
import { CONTACT_EMAIL, composeHref } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import { CertraceLogo } from "./logo";
import { LanguageSwitch } from "./navbar";

/* LINE's mark is a rounded-square badge with a white speech balloon and the
   LINE wordmark inside — drawn as paths so it stays crisp at 16px and
   inherits the footer's greyscale ink rather than brand green. */
function LineIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

const SOCIALS = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/certrace-co",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/certrace",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3.6l.4-4H14V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/certrace",
    icon: (
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
  },
  {
    label: "LINE Official",
    href: "https://lin.ee/P76yqsw",
    icon: <LineIcon />,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@Certrace",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
      </svg>
    ),
  },
];

export function Footer() {
  const { c } = useLang();
  const l = c.footer.links;

  /* Mirrors the nav IA: Platform / Who It's For / Resources / Company. Legal
     lives in the bottom bar — a fifth column doesn't fit the 12-track grid
     (4 brand + 2 × 4), and legal links belong in the fine print anyway. */
  const columns: {
    title: string;
    links: { label: string; href: string; external?: boolean }[];
  }[] = [
    {
      title: c.footer.columns.platform,
      links: [
        { label: l.smartLink, href: "/#platform-invite" },
        { label: l.profile, href: "/#platform-profile" },
        { label: l.aiCheck, href: "/#platform-quality" },
        { label: l.engine, href: "/#platform-engine" },
        { label: l.benchmark, href: "/#platform-benchmark" },
        { label: l.reports, href: "/#platform-report" },
      ],
    },
    {
      title: c.footer.columns.whoItsFor,
      links: [
        { label: l.exporters, href: "/solutions/exporters" },
        { label: l.suppliers, href: "/solutions/suppliers" },
        { label: l.legalCompliance, href: "/solutions/legal-compliance" },
        { label: l.importers, href: "/solutions/importers" },
      ],
    },
    {
      title: c.footer.columns.resources,
      links: [
        { label: l.howItWorks, href: "/#how-it-works" },
        { label: l.faq, href: "/#faq" },
        { label: l.timeline, href: "/#why-now" },
        { label: l.backlog, href: "/backlog" },
      ],
    },
    {
      title: c.footer.columns.company,
      links: [
        { label: l.pricing, href: "/pricing" },
        {
          label: l.contact,
          href: composeHref(c.footer.contactSubject),
          external: true,
        },
        { label: l.bookDemo, href: "/#demo" },
      ],
    },
  ];

  const legalLinks: { label: string; href: string; external?: boolean }[] = [
    { label: l.terms, href: "/terms" },
    { label: l.privacy, href: "/privacy" },
    /* Cookie policy has no page yet — left inert on purpose rather than
       pointing at a 404. */
    { label: l.cookies, href: "#" },
    /* Gmail compose, like every other "email us" route on the site — a plain
       mailto: opens whatever desktop client is registered, which on most
       machines is nothing. */
    {
      label: l.reportIssue,
      href: composeHref(c.footer.issueSubject),
      external: true,
    },
  ];

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
          <div className="mt-6 flex items-center gap-3">
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg border border-black/[0.08] flex items-center justify-center text-black/30 hover:text-black/70 hover:border-black/20 transition-colors"
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {columns.map((column) => (
          <div key={column.title} className="md:col-span-2">
            <div className="font-pixel text-[10px] tracking-[0.2em] text-black/30 mb-4">
              {column.title}
            </div>
            <ul className="space-y-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    className="text-xs text-black/35 hover:text-black/70 transition-colors tracking-wide"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar: copyright, the legal links (moved down here when the
          fourth column became RESOURCES), and the language control. Desktop:
          one row. Mobile: stacked and centred. DOM order gives both without
          reordering, so it matches reading order in either layout. */}
      <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-black/[0.04] flex flex-col items-center gap-5 text-center md:flex-row md:items-center md:justify-between md:gap-6 md:text-left">
        <div className="order-1 flex flex-col items-center gap-3 md:flex-row md:items-center md:gap-5">
          <span className="text-xs text-black/20">{c.footer.copyright}</span>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {legalLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
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
    </footer>
  );
}
