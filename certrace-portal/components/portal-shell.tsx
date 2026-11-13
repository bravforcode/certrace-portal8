"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Users,
  Settings,
  CreditCard,
  Bell,
  ChevronDown,
  Menu,
  X,
  Globe,
  UserCircle2,
  LogOut,
  LifeBuoy,
  Lightbulb,
  PlayCircle,
  ExternalLink,
  PanelLeft,
  Factory,
} from "lucide-react";
import { cn } from "./ui";
import { Dropdown } from "./controls";
import { CertraceIcon, CertraceLogo } from "./logo";
import { Toaster } from "./toast";
import { logout } from "@/lib/api";
import { MENU_LANGUAGES, useLanguage, useT } from "@/lib/i18n";
import { Flag } from "./flag";
import { ProductMark, type ProductId } from "./product-marks";
import {
  FEATURE_REQUEST_URL,
  GUIDE_VIDEO_URL,
  SOCIAL_LINE_URL,
} from "@/lib/links";
import { useAccountEmail, useProfile, useSessionUser } from "@/lib/profile";
import { seatCap } from "@/lib/plan";
import { useCompanyDirectory } from "@/lib/team-query";
import { useAccount } from "./account-lock";
import { CeraProvider, useCera } from "./cera/cera-provider";
import { CeraMark } from "./cera/cera-mark";
import { CeraButton } from "./cera/cera-button";
import { shownTitle } from "@/lib/cera/history";
import { CeraPanel } from "./cera/cera-panel";
import { CeraMissingProvider } from "./cera/cera-missing";
import { NotificationsBell } from "./notifications/bell";
import { NotificationsProvider } from "./notifications/provider";

/* ── Support ────────────────────────────────────────────────────
   Certrace's LINE official account. Declared here as a named constant rather
   than inlined in the menu so the same link can be reused by the supplier
   portal and by any error state that offers help, and so changing it is one
   edit rather than a search.

   The real official-account short link now lives in lib/links.ts alongside the
   rest of the public Certrace presence (the sign-up completion page offers the
   same LINE account), and is re-exported here so existing callers keep
   working. If the account is ever moved, only lib/links.ts changes. */
export const SUPPORT_LINE_URL = SOCIAL_LINE_URL;

/* ── The strip at the foot of the sidebar ───────────────────────
   ON A PAID TIER it counts seats, which is what it has always done. ON A
   TRIAL it counts DAYS, because that is the only number on a trial account
   that is going anywhere: the caps are all unlimited, so a seat meter there
   would be a bar that can never fill sitting where the one bar that matters
   should be.

   The bar EMPTIES rather than fills. Everywhere else in the product a meter
   fills up towards a limit; a countdown that fills up as time runs out reads
   backwards at a glance. This one is how much month is left. */
function PlanStrip({ onNavigate }: { onNavigate: () => void }) {
  const t = useT();
  const { ready, plan, trial } = useAccount();
  /* Measured HERE rather than passed in from the shell. The shell is not a
     context consumer, so it never re-renders when the plan resolves — a seat
     cap read up there would still be the boot-time plan's after the real one
     arrived. */
  useCompanyDirectory();
  const seats = seatCap();

  const onTrial = ready && trial.onTrial;
  /* Under a week left is the point at which the countdown stops being
     information and starts being a deadline. */
  const urgent = onTrial && trial.onTrial && trial.daysLeft <= 7;
  const ended = onTrial && trial.onTrial && trial.ended;

  return (
    <Link
      href="/billing"
      onClick={onNavigate}
      className="mt-6 block rounded-2xl border border-black/[0.07] bg-[#faf9f7] p-4 transition-colors hover:border-black/15"
    >
      {/* The seat count is the PLAN's, read from lib/plan.ts. It used to
          be a literal on ORG that said 8 while Standard sold 10 — the
          one number in the product a reader checks against their
          contract, and it disagreed with the billing page. */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/40">
          {onTrial ? t("Free trial") : t("{plan} plan", { plan: plan.name })}
        </span>
        <span
          className={cn(
            "font-mono text-[11px] tabular-nums",
            ended
              ? "text-[#b45309]"
              : urgent
                ? "text-[#b45309]"
                : "text-black/45",
          )}
        >
          {onTrial && trial.onTrial
            ? ended
              ? t("ended")
              : t("{days}d left", { days: trial.daysLeft })
            : seats.cap == null
              ? t("Unlimited")
              : seats.label}
        </span>
      </div>
      <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-black/[0.07]">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300",
            urgent || ended ? "bg-[#b45309]" : "bg-[#111]",
          )}
          style={{
            width:
              onTrial && trial.onTrial
                ? `${Math.round((trial.daysLeft / trial.totalDays) * 100)}%`
                : seats.cap == null
                  ? "100%"
                  : `${Math.round(seats.fraction * 100)}%`,
          }}
        />
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-black/40">
        {onTrial
          ? ended
            ? t("Your trial has ended.")
            : t("Days left in your trial. Everything is unlimited.")
          : t(
              "Seats used. Suppliers fill in through their link without limit.",
            )}
      </p>
    </Link>
  );
}

type NavIcon = React.ComponentType<{
  size?: number;
  strokeWidth?: number;
  className?: string;
}>;
type NavEntry =
  | {
      kind: "link";
      href: string;
      label: string;
      icon: NavIcon;
      divider?: boolean;
      /** Indented under a group heading (the Prove family). */
      child?: boolean;
    }
  | { kind: "group"; label: string; icon: NavIcon }
  | { kind: "soon"; label: string; icon: NavIcon }
  | { kind: "cera"; label: string; icon: NavIcon };

/** A landing-page product mark sized like the sidebar's 19 px line icons. */
function mark(product: ProductId): NavIcon {
  function NavMark({ className }: { className?: string }) {
    return (
      <ProductMark
        product={product}
        className={cn("h-[19px] w-[19px] flex-none", className)}
      />
    );
  }
  return NavMark;
}

/* THE SIDEBAR FOLLOWS THE PRODUCT FAMILY on the public site (certrace-landing
   lib/nav-menu.ts): Prove and its five parts, Trace, the three lines still to
   come, and Cera — with the same marks, and no descriptions. Dashboard stays on
   top as the screen the day starts on. */
function useNav(): NavEntry[] {
  const { t } = useLanguage();
  return [
    {
      kind: "link",
      href: "/dashboard",
      label: t("Dashboard"),
      icon: mark("dashboard"),
    },
    {
      kind: "link",
      href: "/opportunities",
      label: t("Opportunities"),
      icon: Lightbulb,
    },
    { kind: "group", label: "Prove", icon: mark("prove") },
    {
      kind: "link",
      href: "/workspace",
      label: "Workspace",
      icon: mark("workspace"),
      child: true,
    },
    {
      kind: "link",
      href: "/convert",
      label: "Convert",
      icon: mark("convert"),
      child: true,
    },
    {
      kind: "link",
      href: "/smart-links",
      label: "Smart Link",
      icon: mark("smartlink"),
      child: true,
    },
    {
      kind: "link",
      href: "/carbon-cost",
      label: "Carbon & Cost Dashboard",
      icon: mark("carbonCost"),
      child: true,
    },
    {
      kind: "link",
      href: "/supply-chain",
      label: "Supply Chain Dashboard",
      icon: mark("supplyChain"),
      child: true,
    },
    { kind: "link", href: "/trace", label: "Trace", icon: mark("trace") },
    { kind: "soon", label: "Reduce", icon: mark("reduce") },
    { kind: "soon", label: "Connect", icon: mark("connect") },
    { kind: "soon", label: "Market", icon: mark("market") },
    // CERA INTELLIGENCE is not a page — it is the assistant, opened FULL SCREEN
    // from wherever you are standing. So this entry is an action, not a link.
    { kind: "cera", label: t("Cera Intelligence"), icon: CeraNavIcon },
    // WORK ABOVE THE RULE, THE ACCOUNT BELOW IT.
    {
      kind: "link",
      href: "/team",
      label: t("Team & seats"),
      icon: Users,
      divider: true,
    },
    {
      kind: "link",
      href: "/billing",
      label: t("Plan & billing"),
      icon: CreditCard,
    },
    { kind: "link", href: "/settings", label: t("Settings"), icon: Settings },
  ];
}

/* The sidebar's icons are 19 px line icons that take `size`; the Cera mark is a
   taller-than-wide graphic, so it is sized by height to sit on the same line. */
function CeraNavIcon({
  size = 19,
  className,
}: {
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  // Centred in a square the width of the other icons, so the labels line up down the column.
  return (
    <span
      className={cn("grid flex-none place-items-center", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <CeraMark className="w-auto" style={{ height: size - 1 }} />
    </span>
  );
}

/** The saved conversations under the sidebar's Cera entry: the newest few, indented under a hairline. */
function CeraHistoryNav({ onNavigate }: { onNavigate: () => void }) {
  const t = useT();
  const cera = useCera();
  const [all, setAll] = React.useState(false);
  const shown = all ? cera.history : cera.history.slice(0, 5);
  if (cera.history.length === 0) return null;
  return (
    <ul
      aria-label={t("Earlier conversations with Cera")}
      className="mb-1 ml-[21px] mt-0.5 space-y-px border-l border-black/[0.09] pl-2"
    >
      {shown.map((c) => {
        const on = cera.open && cera.fullscreen && cera.conversationId === c.id;
        return (
          <li key={c.id}>
            <button
              type="button"
              title={shownTitle(c.title, t)}
              onClick={() => {
                cera.openConversation(c.id);
                cera.showFullscreen();
                onNavigate();
              }}
              className={cn(
                "block w-full truncate rounded-lg px-2.5 py-1.5 text-left text-[12px] leading-snug transition-colors",
                on
                  ? "bg-black/[0.05] font-medium text-black/80"
                  : "text-black/45 hover:bg-black/[0.03] hover:text-black/75",
              )}
            >
              {shownTitle(c.title, t)}
            </button>
          </li>
        );
      })}
      {cera.history.length > 5 && (
        <li>
          <button
            type="button"
            onClick={() => setAll((v) => !v)}
            className="block w-full rounded-lg px-2.5 py-1.5 text-left text-[11.5px] text-black/35 transition-colors hover:text-black/65"
          >
            {all
              ? t("Show fewer")
              : t("Show all {n}", { n: cera.history.length })}
          </button>
        </li>
      )}
    </ul>
  );
}

function Wordmark() {
  const t = useT();
  return (
    <Link
      href="/dashboard"
      aria-label={t("Certrace — dashboard")}
      className="inline-flex flex-none items-center"
    >
      {/* The lockup needs about 96 px to read (LOGO_GUIDELINES.md). With the Cera
          button added to the top bar, a phone no longer has them, so below 420 px
          the mark alone stands in — the guideline's own fallback — instead of the
          wordmark shrinking to a smudge or the account menu being pushed off-screen. */}
      <CertraceLogo className="hidden h-[19px] w-auto max-w-none flex-none min-[420px]:block" />
      <CertraceIcon className="block h-6 w-6 flex-none min-[420px]:hidden" />
    </Link>
  );
}

function AccountMenu() {
  const router = useRouter();
  const { t } = useLanguage();
  const { choice, setLang } = useLanguage();
  const { profile, stored } = useProfile();
  const sessionUser = useSessionUser();
  /* A SAVED profile wins — Settings edits it, and a rename there has to show
     up here. Without one, the session's name is the truth: a fresh sign-in on
     a second machine has no local profile yet, and the unsaved default is the
     demo fixture's name, which is nobody. */
  const savedName = stored
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : "";
  const sessionName =
    `${sessionUser?.firstName ?? ""} ${sessionUser?.lastName ?? ""}`.trim();
  const fullName =
    savedName ||
    sessionName ||
    `${profile.firstName} ${profile.lastName}`.trim();
  const accountEmail = useAccountEmail();
  const [signingOut, setSigningOut] = React.useState(false);

  const signOut = () => {
    setSigningOut(true);
    // Clears localStorage and revokes the refresh token server-side
    // (fire-and-forget) — see logout() in lib/api/auth.ts. Without this the
    // session survived the button and / bounced straight back to /dashboard.
    logout();
    window.setTimeout(() => router.push("/login"), 600);
  };

  return (
    <Dropdown
      align="right"
      width="w-64"
      trigger={(open) => (
        <span className="flex min-h-11 max-w-[128px] items-center gap-2 rounded-xl border border-black/10 px-3 py-1.5 hover:border-black/20 min-[420px]:max-w-[160px] sm:max-w-none">
          <span className="min-w-0 text-left leading-tight">
            <span className="block truncate text-[12px] text-black/70">
              {fullName}
            </span>
            <span className="block truncate text-[10px] uppercase tracking-[0.1em] text-black/35">
              {profile.companyName}
            </span>
          </span>
          <ChevronDown
            size={13}
            strokeWidth={1.5}
            className={cn(
              "flex-none text-black/30 transition-transform",
              open && "rotate-180",
            )}
          />
        </span>
      )}
    >
      {(close) => (
        <>
          <div className="border-b border-black/[0.06] px-3 py-3">
            <div className="text-[13px] text-black/80">{fullName}</div>
            {accountEmail && (
              <div className="mt-0.5 truncate text-[11px] text-black/40">
                {accountEmail}
              </div>
            )}
          </div>
          <div className="py-1">
            <Link
              href="/settings?tab=organisation"
              onClick={close}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-black/70 hover:bg-[#fafaf8]"
            >
              <UserCircle2
                size={15}
                strokeWidth={1.5}
                className="text-black/40"
              />{" "}
              {t("Profile & account")}
            </Link>
            <Link
              href="/settings?tab=notifications"
              onClick={close}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-black/70 hover:bg-[#fafaf8]"
            >
              <Bell size={15} strokeWidth={1.5} className="text-black/40" />{" "}
              {t("Notification settings")}
            </Link>
            <Link
              href="/settings?tab=installation"
              onClick={close}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-black/70 hover:bg-[#fafaf8]"
            >
              <Factory size={15} strokeWidth={1.5} className="text-black/40" />{" "}
              {t("Installation")}
            </Link>
            <Link
              href="/billing"
              onClick={close}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-black/70 hover:bg-[#fafaf8]"
            >
              <CreditCard
                size={15}
                strokeWidth={1.5}
                className="text-black/40"
              />{" "}
              {t("Plan & billing")}
            </Link>
            {/* The walkthrough sits ABOVE "Report a problem" on purpose: most
                of what gets reported as a problem is somebody not finding the
                screen, and the cheaper answer should be the one they reach
                first. Same new-tab treatment as support — a half-entered
                month must not be navigated away from to watch it. */}
            <a
              href={GUIDE_VIDEO_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-black/70 hover:bg-[#fafaf8]"
            >
              <PlayCircle
                size={15}
                strokeWidth={1.5}
                className="text-black/40"
              />
              <span className="min-w-0 flex-1">{t("Guide video")}</span>
              <ExternalLink
                size={12}
                strokeWidth={1.5}
                className="flex-none text-black/25"
              />
            </a>
            {/* A FEATURE REQUEST IS NOT A PROBLEM REPORT, and the two are
                deliberately two rows rather than one. "Report a problem" is
                for something broken in front of you now and goes to LINE,
                where a specialist answers; a feature request is a note to the
                roadmap and goes to the public site. Folded together, every
                roadmap idea arrives in the support queue as an incident and
                every real incident waits behind one. It sits directly above
                the support row for the same reason the guide video sits above
                both — the cheaper errand is offered first. */}
            <a
              href={FEATURE_REQUEST_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-black/70 hover:bg-[#fafaf8]"
            >
              <Lightbulb
                size={15}
                strokeWidth={1.5}
                className="text-black/40"
              />
              <span className="min-w-0 flex-1">{t("Feature request")}</span>
              <ExternalLink
                size={12}
                strokeWidth={1.5}
                className="flex-none text-black/25"
              />
            </a>
            {/* Support goes to LINE, not to a form. A Thai exporter stuck on a
                CBAM field at 9pm will message on LINE and will not fill in a
                web form, so the shortest path to a human is the one that gets
                used. Opens in a new tab with `noopener` — a half-completed
                month must not be navigated away from to ask a question
                about it. */}
            <a
              href={SUPPORT_LINE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-black/70 hover:bg-[#fafaf8]"
            >
              <LifeBuoy size={15} strokeWidth={1.5} className="text-black/40" />
              <span className="min-w-0 flex-1">{t("Report a problem")}</span>
              <ExternalLink
                size={12}
                strokeWidth={1.5}
                className="flex-none text-black/25"
              />
            </a>
          </div>
          <div className="border-t border-black/[0.06] py-1">
            <div className="flex items-center gap-2 px-2.5 pb-1 pt-2 font-pixel text-[10px] uppercase tracking-[0.16em] text-black/30">
              <Globe size={12} strokeWidth={1.5} /> {t("Language")}
            </div>
            {/* Twelve rows. The menu panel itself scrolls (it is capped to the screen), so no second scroller here. */}
            <div>
              {MENU_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  lang={l.code}
                  onClick={() => setLang(l.code)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-[#fafaf8]",
                    l.code === choice && "bg-black/[0.04]",
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Flag code={l.code} />
                    <span
                      className={cn(
                        l.code === choice ? "text-black/85" : "text-black/60",
                      )}
                    >
                      {l.nativeLabel}
                    </span>
                  </span>
                  {l.code === choice && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#111]" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-black/[0.06] py-1">
            <button
              disabled={signingOut}
              onClick={signOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-black/70 hover:bg-[#fafaf8] disabled:cursor-not-allowed"
            >
              {signingOut ? (
                <span
                  className="h-[15px] w-[15px] flex-none animate-spin rounded-full border-2 border-black/15 border-t-black/50"
                  aria-hidden
                />
              ) : (
                <LogOut size={15} strokeWidth={1.5} className="text-black/40" />
              )}
              {signingOut ? t("Signing out…") : t("Sign out")}
            </button>
          </div>
        </>
      )}
    </Dropdown>
  );
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  // The provider has to sit ABOVE the frame: the sidebar's Cera entry and the top-bar
  // button both read it, and a component cannot use a context it renders itself.
  return (
    <CeraProvider>
      {/* The missing-data monitor reads the selected installation, so it sits inside the shell: a supplier link never gets it. */}
      <CeraMissingProvider>
        <ShellFrame>{children}</ShellFrame>
      </CeraMissingProvider>
    </CeraProvider>
  );
}

function ShellFrame({ children }: { children: React.ReactNode }) {
  // The feed sits between the Cera provider and the frame: the bell and the page read it, and a message can put a question to Cera.
  return (
    <NotificationsProvider>
      <ShellFrameInner>{children}</ShellFrameInner>
    </NotificationsProvider>
  );
}

const SIDEBAR_KEY = "certrace:sidebar-collapsed";

function ShellFrameInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const cera = useCera();
  const t = useT();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const nav = useNav();
  /* OPEN OR CLOSED ON DESKTOP. Closed, the sidebar narrows to its icons; the choice is remembered per
     browser. Read after mount, so the server pass and the first client pass agree (always open). The
     phone drawer ignores it. */
  const [collapsed, setCollapsed] = React.useState(false);
  // Animated only when the button is pressed — the remembered state is applied on load without a slide.
  const [animate, setAnimate] = React.useState(false);
  React.useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(SIDEBAR_KEY) === "1");
    } catch {
      /* storage blocked: stays open */
    }
  }, []);
  const toggleSidebar = () => {
    setAnimate(true);
    setCollapsed((v) => {
      try {
        window.localStorage.setItem(SIDEBAR_KEY, v ? "0" : "1");
      } catch {
        /* storage blocked: still toggles for this visit */
      }
      return !v;
    });
  };
  const c = collapsed;
  /* A label that hides when the sidebar is closed (desktop only). */
  const label = (text: string) => (
    <span className={cn(c && "md:hidden")}>{text}</span>
  );

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      {/* Topbar */}
      {/* data-lock="chrome" — the read-only lock never touches the shell, so a
          frozen account can still navigate, switch language and read its
          notifications. See components/account-lock.tsx. */}
      <header
        data-lock="chrome"
        className="sticky top-0 z-50 border-b border-black/[0.06] bg-[rgba(245,244,240,0.8)] backdrop-blur-md print:hidden"
      >
        <div className="flex h-16 items-center gap-4 px-4 md:px-6">
          <button
            className="md:hidden"
            aria-label={t("Open menu")}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? (
              <X size={20} strokeWidth={1.5} />
            ) : (
              <Menu size={20} strokeWidth={1.5} />
            )}
          </button>
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={c ? t("Open sidebar") : t("Close sidebar")}
            aria-expanded={!c}
            title={c ? t("Open sidebar") : t("Close sidebar")}
            className="-ml-[8.5px] hidden h-9 w-9 flex-none items-center justify-center rounded-lg text-black/55 transition-colors hover:bg-black/[0.05] hover:text-black md:flex"
          >
            <PanelLeft size={19} strokeWidth={1.5} />
          </button>
          <div className="hidden w-[224px] items-center md:flex">
            <Wordmark />
          </div>
          <div className="flex flex-none items-center md:hidden">
            <Wordmark />
          </div>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <CeraButton />
            <NotificationsBell />
            <AccountMenu />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          data-lock="chrome"
          className={cn(
            "print:hidden",
            // Fixed-height + self-start keeps `sticky` working: without an explicit
            // height the flex row stretches the sidebar to the full content height,
            // which is taller than the viewport and silently breaks sticky so it
            // scrolls with the page. Pinned here, only the content area scrolls.
            "fixed inset-y-0 left-0 top-16 z-40 w-[272px] flex-none overflow-y-auto [scrollbar-gutter:stable] border-r border-black/[0.06] bg-white px-3 py-5 transition-transform md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:translate-x-0 md:self-start",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
            animate && "md:transition-[width]",
            // 68px closed puts every icon on the same 33.5px centre as when open, and under the toggle.
            c && "md:w-[68px] md:px-2 md:[scrollbar-width:none]",
          )}
        >
          <nav className="flex flex-col gap-0.5">
            {nav.map((item, index) => {
              const Icon = item.icon;
              const row = cn(
                "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] leading-snug transition-colors",
                c && "md:justify-center md:gap-0 md:px-0",
              );
              // A group heading (Prove): not a page — its parts are the rows under it.
              if (item.kind === "group")
                return (
                  <div
                    key={item.label}
                    title={c ? item.label : undefined}
                    className={cn(
                      "mt-3 flex min-h-10 items-center gap-3 px-3 py-2 text-[13px] text-black/80",
                      c &&
                        "md:justify-center md:gap-0 md:border-t md:border-black/[0.08] md:px-0 md:pt-3",
                    )}
                  >
                    <Icon size={19} />
                    {label(item.label)}
                  </div>
                );
              // A product line that is not live yet: shown, greyed, not clickable.
              if (item.kind === "soon")
                return (
                  <div
                    key={item.label}
                    aria-disabled
                    title={c ? `${item.label} · ${t("Soon")}` : undefined}
                    className={cn(row, "cursor-default text-black/35")}
                  >
                    <Icon size={19} className="opacity-60" />
                    {label(item.label)}
                    <span
                      className={cn(
                        "rounded-full border border-black/10 px-2 py-0.5 text-[10px] text-black/40",
                        c && "md:hidden",
                      )}
                    >
                      {t("Soon")}
                    </span>
                  </div>
                );
              // An action entry (Cera): a button, "on" while its full-screen view is showing.
              if (item.kind === "cera") {
                const on = cera.open && cera.fullscreen;
                return (
                  <React.Fragment key="cera">
                    <button
                      type="button"
                      onClick={() => {
                        cera.showFullscreen();
                        setMobileOpen(false);
                      }}
                      aria-pressed={on}
                      title={c ? item.label : undefined}
                      className={cn(
                        row,
                        "max-md:min-h-0 max-md:py-1.5 max-md:text-sm",
                        on
                          ? "bg-black/[0.06] font-medium text-black"
                          : "text-black/60 hover:bg-black/[0.03] hover:text-black",
                      )}
                    >
                      <Icon size={19} strokeWidth={1.5} className="flex-none" />
                      {label(item.label)}
                    </button>
                    {/* THE EARLIER CONVERSATIONS HANG OFF IT, one step in and quieter — a subset of Cera, not five more
                        destinations beside Dashboard and Settings. Opening one opens Cera full screen on it. */}
                    <div className={cn(c && "md:hidden")}>
                      <CeraHistoryNav onNavigate={() => setMobileOpen(false)} />
                    </div>
                  </React.Fragment>
                );
              }
              const active = isActive(item.href);
              const link = (
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={c ? item.label : undefined}
                  aria-label={c ? item.label : undefined}
                  className={cn(
                    row,
                    active
                      ? "bg-black/[0.06] font-medium text-black"
                      : "text-black/60 hover:bg-black/[0.03] hover:text-black",
                    item.divider &&
                      "relative mt-4 before:absolute before:inset-x-3 before:-top-2 before:border-t before:border-black/[0.08]",
                  )}
                >
                  <Icon size={19} strokeWidth={1.5} className="flex-none" />
                  {label(item.label)}
                </Link>
              );
              /* The Prove family hangs off its heading on a hairline, as on the public site's menu. */
              if (item.child) {
                const prev = nav[index - 1];
                const next = nav[index + 1];
                const first = prev?.kind === "group";
                const last = !(next?.kind === "link" && next.child);
                return (
                  <div
                    key={item.href}
                    className={cn(
                      "ml-[21px] border-l border-black/[0.09] pl-2",
                      first && "pt-0.5",
                      last && "pb-0.5",
                      c && "md:ml-0 md:border-l-0 md:pl-0",
                    )}
                  >
                    {link}
                  </div>
                );
              }
              return <React.Fragment key={item.href}>{link}</React.Fragment>;
            })}
          </nav>

          <div className={cn(c && "md:hidden")}>
            <PlanStrip onNavigate={() => setMobileOpen(false)} />
          </div>
        </aside>

        {mobileOpen && (
          <div
            className="fixed inset-0 top-16 z-30 bg-black/10 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
        )}

        {/* Content */}
        <main className="min-w-0 flex-1 px-4 py-8 md:px-8 lg:px-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      <CeraPanel />
      <Toaster />
    </div>
  );
}
