"use client";

import { useEffect, useRef, useState } from "react";
import { type Content } from "@/lib/content";
import { LANG_OPTIONS, useLang, type Lang } from "@/lib/i18n";
import { localePath } from "@/lib/locales";
import { usePages } from "@/lib/i18n-pages";
import type { PageCopy } from "@/lib/pages";
import { LOGIN_URL, SIGNUP_URL } from "@/lib/site";
import { CertraceLogo } from "./logo";
import { PopupForm, type PopupFormKind } from "./popup-form";
import Link from "next/link";

/* Nav IA. Every entry resolves to a real route or a real anchor on the home
   page — root-relative (`/#id`, not `#id`) so the same header works from
   /pricing and /solutions/* without dead-ending.

   Labels and descriptions come from the content dictionary; only the hrefs and
   badges live here, so the two languages can never drift out of sync with the
   structure. */

type MenuItem = {
  label: string;
  desc: string;
  href: string;
  badge?: { text: string; live?: boolean };
  /* Content that doesn't exist yet. Rendered as a non-interactive row rather
     than a link to "#", so nothing in the nav is a dead click. */
  soon?: boolean;
  /* Leaves the site — opens in its own tab. */
  external?: boolean;
  /* Opens one of the three pop-up forms instead of navigating. Careers,
     Request a feature and Report an issue all used to be mail-compose links;
     they now collect a structured answer. See components/popup-form.tsx. */
  form?: PopupFormKind;
};

type NavEntry =
  | {
      label: string;
      menu: { items: MenuItem[]; footer?: { label: string; href: string } };
      href?: undefined;
    }
  | { label: string; href: string; menu?: undefined };

function buildNav(c: Content, p: PageCopy, lang: Lang): NavEntry[] {
  const live = { text: c.common.live, live: true };
  const soon = { text: c.common.soon };

  return [
    {
      label: c.nav.platform.label,
      menu: {
        items: [
          { ...c.nav.platform.items[0], href: "/#platform-invite" },
          { ...c.nav.platform.items[1], href: "/#platform-profile" },
          { ...c.nav.platform.items[2], href: "/#platform-quality" },
          { ...c.nav.platform.items[3], href: "/#platform-engine" },
          { ...c.nav.platform.items[4], href: "/#platform-benchmark" },
          { ...c.nav.platform.items[5], href: "/#platform-report" },
        ],
        footer: { label: c.nav.platform.footer, href: "/#platform" },
      },
    },
    {
      /* Exporters and suppliers are the two sides that exist today; legal and
         importers each have a page, but it opens on a waitlist rather than a
         product. The badges have to say which is which before the click. */
      label: c.nav.solutions.label,
      menu: {
        items: [
          {
            ...c.nav.solutions.items[0],
            href: "/solutions/exporters",
            badge: live,
          },
          {
            ...c.nav.solutions.items[1],
            href: "/solutions/suppliers",
            badge: live,
          },
          {
            ...c.nav.solutions.items[2],
            href: "/solutions/legal-compliance",
            badge: soon,
          },
          {
            ...c.nav.solutions.items[3],
            href: "/solutions/importers",
            badge: soon,
          },
        ],
        footer: { label: c.nav.solutions.footer, href: "/#stakeholders" },
      },
    },
    {
      /* One regulation, deliberately: EU CBAM is what the product covers, and
         listing anything else here would promise coverage that isn't built.
         It lands on the live-platform section — the one place on the page
         that shows CBAM actually running. */
      label: c.nav.regulations.label,
      menu: {
        items: [
          { ...c.nav.regulations.items[0], href: "/#live", badge: live },
        ],
        footer: { label: c.nav.regulations.footer, href: "/backlog" },
      },
    },
    { label: c.nav.pricing, href: "/pricing" },
    {
      /* About CBAM leads: it is the only entry here that answers a question
         somebody types into a search engine rather than one they only have
         once they are already on the site. */
      label: c.nav.resources.label,
      menu: {
        items: [
          { label: p.nav.aboutCbam, desc: p.nav.aboutCbamDesc, href: localePath(lang, "/about-cbam") },
          { ...c.nav.resources.items[0], href: "/#how-it-works" },
          { ...c.nav.resources.items[1], href: "/#faq" },
          { ...c.nav.resources.items[2], href: "/#why-now" },
          { ...c.nav.resources.items[3], href: "/backlog" },
          { label: p.nav.updates, desc: p.nav.updatesDesc, href: localePath(lang, "/updates") },
          /* The free CN-code engine. It is a resource rather than a pricing
             row: it answers "which of these codes are even in scope", which is
             a question people arrive with long before they are choosing a
             plan — even though the tool lives on the pricing page. */
          {
            label: p.pricingPage.calc.navLabel,
            desc: p.pricingPage.calc.navDesc,
            href: "/pricing#cbam-engine",
          },
        ],
        footer: { label: c.nav.resources.footer, href: "/#demo" },
      },
    },
    {
      /* Everything a reader might want from the company, in the order they
         tend to want it: who you are, where to find you, what you have been
         doing, then the four ways to send us something. Those four open a form
         rather than a mail client — see the MenuItem note above.

         Request pricing leads that group. It is the one thing in this menu a
         reader is most often trying to do, and until now it was only reachable
         from the pricing and contact pages — which meant leaving whatever they
         were reading to ask what it costs. */
      label: c.nav.company.label,
      menu: {
        items: [
          { label: p.nav.about, desc: p.nav.aboutDesc, href: "/about" },
          { label: p.nav.contact, desc: p.nav.contactDesc, href: "/contact" },
          { label: p.nav.events, desc: p.nav.eventsDesc, href: "/events" },
          { label: p.nav.updates, desc: p.nav.updatesDesc, href: localePath(lang, "/updates") },
          {
            label: p.nav.requestPricing,
            desc: p.nav.requestPricingDesc,
            href: "#",
            form: "pricing",
          },
          { label: p.nav.careers, desc: p.nav.careersDesc, href: "#", form: "careers" },
          {
            label: p.nav.requestFeature,
            desc: p.nav.requestFeatureDesc,
            href: "#",
            form: "feature",
          },
          { label: p.nav.reportIssue, desc: p.nav.reportIssueDesc, href: "#", form: "issue" },
        ],
        footer: { label: c.nav.company.footer, href: "/#demo" },
      },
    },
  ];
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="transition-transform duration-200 shrink-0"
      style={{ transform: open ? "rotate(180deg)" : "none" }}
    >
      <path d="M2 3.5 5 6.5 8 3.5" />
    </svg>
  );
}

function MenuBadge({ badge }: { badge: NonNullable<MenuItem["badge"]> }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] tracking-[0.14em] border shrink-0 ${
        badge.live
          ? "border-emerald-600/15 bg-emerald-50 text-emerald-700"
          : "border-black/10 bg-black/[0.03] text-black/40"
      }`}
    >
      {badge.live && <span className="w-1 h-1 rounded-full bg-emerald-500" />}
      {badge.text}
    </span>
  );
}

/* Click-to-open dropdown, not a toggle — a real list so a third, fourth,
   fifth language is just another row. Selecting one switches the whole site
   through the language context.

   `placement="up"` is what the footer uses: this control sits in the last row
   of the page, so a panel dropping downward opens past the end of the
   document and is clipped out of frame.

   `align="responsive"` is also a footer case: the bottom bar centres this
   control on phones (and right-aligns it from md up), so a panel pinned to
   `right-0` hangs off to one side of a centred button. Responsive = centred on
   the button below md, right-edge-aligned from md. */
export function LanguageSwitch({
  className = "",
  placement = "down",
  align = "right",
  bordered = true,
}: {
  className?: string;
  placement?: "down" | "up";
  align?: "right" | "responsive";
  /* The header wants this control unboxed — it sits beside a bordered LOG IN
     and a solid CTA, and a third outline made that cluster read as three
     competing buttons. Transparent border, not none, so the button keeps its
     exact size either way. The footer keeps the stroke. */
  bordered?: boolean;
}) {
  const { lang, setLang, c } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected =
    LANG_OPTIONS.find((opt) => opt.code === lang) ?? LANG_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={c.nav.selectLanguage}
        className={`flex items-center gap-1.5 pl-3 pr-2.5 py-2 rounded-[10px] border text-[12px] tracking-widest text-black/60 hover:text-black transition-colors duration-200 whitespace-nowrap ${
          bordered
            ? "border-black/[0.10] hover:border-black/20"
            : "border-transparent hover:bg-black/[0.05]"
        }`}
      >
        {selected.short}
        <Chevron open={open} />
      </button>

      {open && (
        /* Two layers on purpose: the outer element owns the *placement*
           transform (-translate-x-1/2 when centred), the inner one owns the
           entrance animation. Merged into one element, the keyframe's own
           `transform` would overwrite the centring offset and shunt the panel
           half its width off to the right. */
        <div
          className={`absolute z-50 ${
            placement === "up" ? "bottom-full mb-2" : "top-full mt-2"
          } ${
            align === "responsive"
              ? "left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-0"
              : "right-0"
          }`}
        >
          <div
            className="w-44 max-w-[calc(100vw-3rem)] rounded-xl border border-black/[0.08] overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.99)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              boxShadow:
                placement === "up"
                  ? "0 -16px 40px rgba(0,0,0,0.12), 0 -2px 8px rgba(0,0,0,0.06)"
                  : "0 16px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
              animation: `${placement === "up" ? "navPanelUpIn" : "navPanelIn"} 0.25s var(--ease-signature) both`,
            }}
          >
            {LANG_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={() => {
                  setLang(opt.code);
                  setOpen(false);
                }}
                aria-pressed={lang === opt.code}
                className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-[13px] text-left transition-colors ${
                  lang === opt.code
                    ? "bg-black/[0.05] text-black"
                    : "text-black/55 hover:bg-black/[0.04] hover:text-black"
                }`}
              >
                <span>{opt.label}</span>
                <span className="font-pixel text-[9px] tracking-widest text-black/25">
                  {opt.short}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const { lang, setLang, c } = useLang();
  const p = usePages();
  /* Which pop-up form is open, if any. Held here rather than on each row so
     opening one can also close the menu that was used to reach it. */
  const [formOpen, setFormOpen] = useState<PopupFormKind | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGroup, setMobileGroup] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nav = buildNav(c, p, lang);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const enter = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(label);
  };

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 140);
  };

  const closeAll = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(null);
    setMobileOpen(false);
  };

  const solid = scrolled || openMenu !== null || mobileOpen;
  const dimmed = openMenu !== null || mobileOpen;

  return (
    <>
      {/* Scrim under any open menu. Deliberately a sibling of the header, not
          a child: the header carries a backdrop-filter, which makes it the
          containing block for fixed descendants — inside it, `bottom-0` would
          resolve to the header's own 64px box instead of the viewport.
          z-40 clears the hero's z-30 layer and stays under the header's z-50,
          so the bar and its panels sit on top of the dim. */}
      <div
        aria-hidden="true"
        onClick={closeAll}
        onMouseEnter={scheduleClose}
        className="fixed inset-x-0 top-16 bottom-0 z-40 transition-opacity duration-300"
        style={{
          background: "rgba(17,17,17,0.28)",
          opacity: dimmed ? 1 : 0,
          pointerEvents: dimmed ? "auto" : "none",
        }}
      />

      <header
        className="fixed top-0 inset-x-0 z-50 transition-colors duration-300"
        style={{
          background: solid ? "rgba(245,244,240,0.94)" : "rgba(245,244,240,0.80)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: solid
            ? "1px solid rgba(0,0,0,0.07)"
            : "1px solid rgba(0,0,0,0)",
        }}
      >
        {/* Full-bleed: logo on the true left edge, action cluster on the true
            right edge. Padding intentionally matches the hero's `px-6 md:px-12`
            so the logo's left edge lines up with the hero headline's first
            letter. */}
        <div className="w-full px-6 md:px-12 h-16 grid grid-cols-[auto_1fr_auto] items-center gap-3 md:gap-6">
          <Link
            href="/#top"
            onClick={closeAll}
            aria-label={c.nav.backToTop}
            className="col-start-1 justify-self-start shrink-0 flex items-center"
          >
            <CertraceLogo className="h-[17px] w-auto" />
          </Link>

          {/* Explicit col-start-2 keeps this in the middle track even though it's
              display:none below xl — without it, grid auto-placement collapses
              the hidden item out of the row and shifts the action cluster into
              the middle. Breakpoint is xl (1280px), not lg: at lg the nav links
              plus the language/login/demo cluster don't fit on one line. */}
          <nav
            className="col-start-2 hidden xl:flex items-center justify-center gap-1"
            aria-label={c.nav.primary}
          >
            {nav.map((entry) =>
              entry.menu ? (
                <div
                  key={entry.label}
                  className="relative"
                  onMouseEnter={() => enter(entry.label)}
                  onMouseLeave={scheduleClose}
                >
                  <button
                    type="button"
                    aria-haspopup="true"
                    aria-expanded={openMenu === entry.label}
                    onClick={() =>
                      setOpenMenu(openMenu === entry.label ? null : entry.label)
                    }
                    onFocus={() => enter(entry.label)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] tracking-wide whitespace-nowrap transition-colors duration-200 ${
                      openMenu === entry.label
                        ? "text-black bg-black/[0.05]"
                        : "text-black/60 hover:text-black hover:bg-black/[0.04]"
                    }`}
                  >
                    {entry.label}
                    <Chevron open={openMenu === entry.label} />
                  </button>

                  {openMenu === entry.label && (
                    <div className="fixed inset-x-0 top-16 z-40">
                      {/* No bottom stroke on the panel and no top stroke on the
                          footer strip: the strip's own change of fill already
                          separates it, and two hairlines stacked around one
                          band read as a seam. */}
                      <div
                        style={{
                          /* Fully opaque, not 0.98 + blur. The Platform menu
                             now carries six features, which makes the panel
                             ~400px tall — deep enough to sit over the hero
                             headline, and at 98% a headline that large still
                             ghosted through in real Chrome and fought with the
                             menu copy. There is no perceptible glass at 2%
                             anyway; the translucent header above it is what
                             carries that quality. Tinted to the header's own
                             bone rather than white — a white sheet hanging off
                             a bone-coloured bar read as a different surface,
                             and it's the white hover plates that should be the
                             light thing here. */
                          background: "#f2f0eb",
                          boxShadow:
                            "0 32px 64px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.05)",
                          animation: "navPanelIn 0.35s var(--ease-signature) both",
                        }}
                      >
                        {/* Regulations carries a single row. In a two-column
                            grid that leaves an empty right half beside it, so
                            a one-item menu spans the full width instead — the
                            copy is still capped at max-w-md, so nothing
                            stretches into a long line. */}
                        <div
                          className={`w-full px-6 md:px-12 py-7 grid gap-3 ${
                            entry.menu.items.length === 1
                              ? "grid-cols-1"
                              : "grid-cols-2"
                          }`}
                        >
                          {entry.menu.items.map((item) =>
                            item.soon ? (
                              <div
                                key={item.label}
                                aria-disabled="true"
                                className="flex flex-col gap-1.5 p-5 rounded-xl min-h-[92px] cursor-default"
                              >
                                <span className="flex items-center gap-2 text-[13px] text-black/45">
                                  {item.label}
                                  {item.badge && <MenuBadge badge={item.badge} />}
                                </span>
                                <span className="text-xs text-black/30 leading-relaxed max-w-md">
                                  {item.desc}
                                </span>
                              </div>
                            ) : item.form ? (
                              <button
                                key={item.label}
                                type="button"
                                onClick={() => {
                                  setFormOpen(item.form!);
                                  closeAll();
                                }}
                                className="group flex flex-col gap-1.5 p-5 rounded-xl min-h-[92px] text-left hover:bg-white/80 transition-colors duration-150"
                              >
                                <span className="flex items-center gap-2 text-[13px] text-black/80 group-hover:text-black transition-colors">
                                  {item.label}
                                  {item.badge && <MenuBadge badge={item.badge} />}
                                </span>
                                <span className="text-xs text-black/40 leading-relaxed max-w-md">
                                  {item.desc}
                                </span>
                              </button>
                            ) : (
                              <a
                                key={item.label}
                                href={item.href}
                                onClick={closeAll}
                                target={item.external ? "_blank" : undefined}
                                rel={
                                  item.external ? "noopener noreferrer" : undefined
                                }
                                className="group flex flex-col gap-1.5 p-5 rounded-xl min-h-[92px] hover:bg-white/80 transition-colors duration-150"
                              >
                                <span className="flex items-center gap-2 text-[13px] text-black/80 group-hover:text-black transition-colors">
                                  {item.label}
                                  {item.badge && <MenuBadge badge={item.badge} />}
                                </span>
                                <span className="text-xs text-black/40 leading-relaxed max-w-md">
                                  {item.desc}
                                </span>
                              </a>
                            ),
                          )}
                        </div>
                        {/* Footer strip: white against the bone panel, split
                            three-quarters context link / one-quarter CTA. Every
                            menu therefore ends with the same next step, without
                            the CTA stealing the whole row. */}
                        {entry.menu.footer && (
                          <div className="flex items-stretch bg-white">
                            <a
                              href={entry.menu.footer.href}
                              onClick={closeAll}
                              className="group flex-[3] flex items-center justify-center gap-2 px-5 py-3.5 font-pixel text-[11px] tracking-[0.18em] uppercase text-black/40 hover:text-black hover:bg-black/[0.02] transition-colors"
                            >
                              {entry.menu.footer.label}
                              <span className="transition-transform duration-200 group-hover:translate-x-1">
                                →
                              </span>
                            </a>
                            <a
                              href={SIGNUP_URL}
                              onClick={closeAll}
                              className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 border-l border-black/[0.06] bg-[#111] font-pixel text-[11px] tracking-[0.18em] uppercase text-white hover:bg-[#333] transition-colors"
                            >
                              {p.nav.freeTrial}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <a
                  key={entry.label}
                  href={entry.href}
                  onClick={closeAll}
                  className="px-3.5 py-2 rounded-[10px] text-[13px] tracking-wide whitespace-nowrap text-black/60 hover:text-black hover:bg-black/[0.04] transition-colors duration-200"
                >
                  {entry.label}
                </a>
              ),
            )}
          </nav>

          <div className="col-start-3 flex items-center gap-1.5 md:gap-2 shrink-0 justify-self-end">
            <LanguageSwitch className="hidden xl:block" bordered={false} />

            {/* Outlined, matching the language switch beside it and the mobile
                menu's LOG IN: it's the secondary action next to a solid dark
                CTA, so it reads as a button, not a text link. */}
            {/* LOG IN goes to the portal's sign-in screen; the primary CTA
                goes to its create-account screen. Sending somebody who has no
                account to a password field is the one wrong answer here. */}
            <a
              href={LOGIN_URL}
              onClick={closeAll}
              className="hidden xl:inline-flex text-[12px] px-4 py-2.5 rounded-[10px] border border-black/[0.10] text-black/55 hover:text-black hover:bg-black/[0.05] hover:border-black/20 transition-colors duration-200 tracking-widest whitespace-nowrap"
            >
              {c.nav.login}
            </a>

            <a
              href={SIGNUP_URL}
              onClick={closeAll}
              className="hidden xl:inline-flex text-[12px] px-5 py-2.5 rounded-[10px] bg-[#111] text-white hover:bg-[#333] transition-colors duration-200 tracking-widest whitespace-nowrap"
            >
              {p.nav.freeTrial}
            </a>

            <button
              onClick={() => {
                setMobileOpen((v) => !v);
                setOpenMenu(null);
              }}
              className="xl:hidden flex flex-col justify-center items-center w-9 h-9 gap-[5px] rounded-lg hover:bg-black/[0.04] transition-colors"
              aria-label={mobileOpen ? c.nav.closeMenu : c.nav.openMenu}
              aria-expanded={mobileOpen}
            >
              <span
                className="block h-px bg-black/60 transition-all duration-300 origin-center"
                style={{
                  width: "18px",
                  transform: mobileOpen
                    ? "translateY(6px) rotate(45deg)"
                    : "none",
                }}
              />
              <span
                className="block h-px bg-black/60 transition-all duration-300"
                style={{
                  width: "18px",
                  opacity: mobileOpen ? 0 : 1,
                  transform: mobileOpen ? "scaleX(0)" : "none",
                }}
              />
              <span
                className="block h-px bg-black/60 transition-all duration-300 origin-center"
                style={{
                  width: "18px",
                  transform: mobileOpen
                    ? "translateY(-6px) rotate(-45deg)"
                    : "none",
                }}
              />
            </button>
          </div>
        </div>

        {/* Mobile menu (below xl, matching the header switch above) */}
        <div
          className="xl:hidden overflow-y-auto transition-all duration-300 ease-in-out border-t border-black/[0.05]"
          style={{
            /* Dynamic viewport height, via a variable so a `vh` fallback can
               exist (globals.css) — `100vh` on a phone is taller than the
               screen, which put the panel's action block below the fold. */
            maxHeight: mobileOpen ? "var(--nav-panel-max)" : "0px",
            opacity: mobileOpen ? 1 : 0,
            borderTopColor: mobileOpen ? undefined : "transparent",
          }}
        >
          <nav className="px-5 py-3 flex flex-col" aria-label={c.nav.mobile}>
            {nav.map((entry) =>
              entry.menu ? (
                <div key={entry.label} className="border-b border-black/[0.05]">
                  <button
                    type="button"
                    aria-expanded={mobileGroup === entry.label}
                    onClick={() =>
                      setMobileGroup(
                        mobileGroup === entry.label ? null : entry.label,
                      )
                    }
                    className="w-full flex items-center justify-between px-2 py-4 text-sm text-black/70 hover:text-black transition-colors"
                  >
                    {entry.label}
                    <Chevron open={mobileGroup === entry.label} />
                  </button>
                  {/* 540, not 460: Platform carries six features now, and its
                      panel measures 486px at 390px wide and 505px at 320px —
                      the old cap sliced the last feature off. Measured at the
                      narrowest phone, plus headroom. Every other group is well
                      under (Resources is the next tallest at 321px). */}
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{
                      /* 640, not 540: Company now carries seven rows and
                         Resources six. Measured at 320px wide, where Company
                         is the tallest group at 604px. */
                      maxHeight: mobileGroup === entry.label ? "640px" : "0px",
                      opacity: mobileGroup === entry.label ? 1 : 0,
                    }}
                  >
                    <div className="pb-3 flex flex-col gap-0.5">
                      {entry.menu.items.map((item) =>
                        item.soon ? (
                          <div
                            key={item.label}
                            aria-disabled="true"
                            className="flex flex-col gap-0.5 px-4 py-2.5 rounded-xl cursor-default"
                          >
                            <span className="flex items-center gap-2 text-[13px] text-black/40">
                              {item.label}
                              {item.badge && <MenuBadge badge={item.badge} />}
                            </span>
                            <span className="text-xs text-black/25 leading-relaxed">
                              {item.desc}
                            </span>
                          </div>
                        ) : item.form ? (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => {
                              setFormOpen(item.form!);
                              closeAll();
                            }}
                            className="flex flex-col gap-0.5 px-4 py-2.5 rounded-xl text-left hover:bg-black/[0.03] transition-colors"
                          >
                            <span className="flex items-center gap-2 text-[13px] text-black/70">
                              {item.label}
                              {item.badge && <MenuBadge badge={item.badge} />}
                            </span>
                            <span className="text-xs text-black/35 leading-relaxed">
                              {item.desc}
                            </span>
                          </button>
                        ) : (
                          <a
                            key={item.label}
                            href={item.href}
                            onClick={closeAll}
                            target={item.external ? "_blank" : undefined}
                            rel={item.external ? "noopener noreferrer" : undefined}
                            className="flex flex-col gap-0.5 px-4 py-2.5 rounded-xl hover:bg-black/[0.03] transition-colors"
                          >
                            <span className="flex items-center gap-2 text-[13px] text-black/70">
                              {item.label}
                              {item.badge && <MenuBadge badge={item.badge} />}
                            </span>
                            <span className="text-xs text-black/35 leading-relaxed">
                              {item.desc}
                            </span>
                          </a>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <a
                  key={entry.label}
                  href={entry.href}
                  onClick={closeAll}
                  className="px-2 py-4 text-sm text-black/70 hover:text-black transition-colors border-b border-black/[0.05]"
                >
                  {entry.label}
                </a>
              ),
            )}

            {/* Language behaves like the other mobile groups — an accordion,
                not a floating popover that would clip inside this scroller. */}
            <div className="border-b border-black/[0.05]">
              <button
                type="button"
                aria-expanded={mobileGroup === "Language"}
                onClick={() =>
                  setMobileGroup(mobileGroup === "Language" ? null : "Language")
                }
                className="w-full flex items-center justify-between px-2 py-4 text-sm text-black/70 hover:text-black transition-colors"
              >
                <span>{c.nav.language}</span>
                {/* Current value sits with the chevron on the right, so the row
                    reads like every other setting row instead of trailing the
                    label at a different size. */}
                <span className="flex items-center gap-2">
                  <span className="text-[11px] leading-none tracking-widest text-black/35">
                    {lang.toUpperCase()}
                  </span>
                  <Chevron open={mobileGroup === "Language"} />
                </span>
              </button>
              <div
                className="overflow-hidden transition-all duration-300"
                /* 260px, not 200: five languages measure 218px of rows at
                   375px wide, so the old cap sliced हिन्दी off the bottom with
                   nothing to scroll. Re-measure if a sixth is ever added. */
                style={{
                  maxHeight: mobileGroup === "Language" ? "260px" : "0px",
                  opacity: mobileGroup === "Language" ? 1 : 0,
                }}
              >
                <div className="pb-3 flex flex-col gap-0.5">
                  {LANG_OPTIONS.map((opt) => (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => {
                        setLang(opt.code);
                        setMobileGroup(null);
                      }}
                      aria-pressed={lang === opt.code}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-[13px] text-left transition-colors ${
                        lang === opt.code
                          ? "bg-black/[0.05] text-black"
                          : "text-black/60 hover:bg-black/[0.03]"
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span className="font-pixel text-[9px] tracking-widest text-black/25">
                        {opt.short}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Log in leaves the link list and joins the action block at the
                bottom: centred, same width as the primary CTA, with its own
                hover plate so it reads as the secondary button it is. */}
            <div className="pt-4 pb-2 flex flex-col gap-2">
              <a
                href={LOGIN_URL}
                onClick={closeAll}
                className="block w-full text-center text-[12px] px-4 py-3 rounded-[10px] border border-black/[0.10] text-black/60 hover:text-black hover:bg-black/[0.05] hover:border-black/20 active:bg-black/[0.08] transition-colors tracking-widest"
              >
                {c.nav.login}
              </a>
              <a
                href={SIGNUP_URL}
                onClick={closeAll}
                className="block w-full text-center text-[12px] px-4 py-3 rounded-[10px] bg-[#111] text-white hover:bg-[#333] active:bg-black transition-colors tracking-widest"
              >
                {p.nav.freeTrial}
              </a>
            </div>
          </nav>
        </div>
      </header>

      {/* One instance of each dialog for the whole header — a row in the
          desktop menu and the same row in the mobile menu open the same one,
          so the state cannot get out of step between the two. */}
      {(["pricing", "careers", "feature", "issue"] as PopupFormKind[]).map((kind) => (
        <PopupForm
          key={kind}
          kind={kind}
          open={formOpen === kind}
          onClose={() => setFormOpen(null)}
        />
      ))}
    </>
  );
}
