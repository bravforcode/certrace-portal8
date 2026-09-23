"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardCheck,
  Link2 as LinkIcon,
  FileCheck2,
  Coins,
  Users,
  Settings,
  CreditCard,
  Bell,
  ChevronDown,
  Menu,
  X,
  TriangleAlert,
  ShieldCheck,
  BadgeCheck,
  Globe,
  UserCircle2,
  LogOut,
  CheckCheck,
  LifeBuoy,
  Lightbulb,
  PlayCircle,
  ExternalLink,
  Activity,
} from "lucide-react";
import { cn, StatusDot } from "./ui";
import { SupplyChainNav, workspaceIdFromPath } from "./workspace/supply-chain-nav";
import { Dropdown } from "./controls";
import { CertraceLogo } from "./logo";
import { Toaster } from "./toast";
import { NOTIFICATIONS, type Notice } from "@/lib/data";
import { logout } from "@/lib/api";
import { LANGUAGES, useLanguage, useT } from "@/lib/i18n";
import { FEATURE_REQUEST_URL, GUIDE_VIDEO_URL, SOCIAL_LINE_URL } from "@/lib/links";
import { useAccountEmail, useProfile, useSessionUser } from "@/lib/profile";
import { seatCap } from "@/lib/plan";
import { useAccount } from "./account-lock";

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
        <span className={cn("font-mono text-[11px] tabular-nums", ended ? "text-[#b45309]" : urgent ? "text-[#b45309]" : "text-black/45")}>
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
          className={cn("h-full rounded-full transition-[width] duration-300", urgent || ended ? "bg-[#b45309]" : "bg-[#111]")}
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
        {onTrial ? (ended ? t("Your trial has ended.") : t("Days left in your trial. Everything is unlimited.")) : t("Seats used. Suppliers are always free.")}
      </p>
    </Link>
  );
}

function useNav() {
  const { t } = useLanguage();
  return [
    { href: "/dashboard", label: t("Dashboard"), icon: LayoutDashboard },
    // The read-only phone view — see app/(portal)/monitor. Listed in the phone
    // menu only: on a desk the dashboard already answers it.
    { href: "/monitor", label: t("Monitor"), icon: Activity, mobileOnly: true },
    // The workspace an exporter lives in: monthly data, the MMD, precursors
    // and readiness for one installation × product × year. It is the spine of
    // the portal now — the separate Declarations list was a second place to
    // track the same estate, and it is gone.
    { href: "/workspaces", label: t("Verification"), icon: ClipboardCheck },
    // EVERY LINK THE ACCOUNT HAS ISSUED, in one list. A workspace mints links
    // as it goes — one per month it asks for, one per precursor it needs a
    // verified figure from — and before this they could only be seen one
    // workspace at a time. Directly under Verification because it is the same
    // work seen from the other end: what has been asked, and of whom.
    { href: "/smart-links", label: t("Smart Links"), icon: LinkIcon },
    // SUPPLIERS IS NOT A TOP-LEVEL DESTINATION. The supplier directory still
    // exists at /suppliers and is still reached from the dashboard's supplier
    // panel and from any supplier name in a table — but it is a lookup, not a
    // place work happens. Every act involving a supplier (asking them, reading
    // what came back, chasing a late month) belongs to a workspace or to a
    // Smart Link, and a nav entry beside those implied a fourth place to go
    // and do the same job.
    { href: "/reports", label: t("Reports"), icon: FileCheck2 },
    // Embedded-emissions profile against the EU default, and what it costs
    // each buyer — reporting/analysis, grouped with Reports rather than the
    // operational Verification / Smart Links block above.
    { href: "/carbon-cost", label: t("Carbon & Cost"), icon: Coins },
    { href: "/team", label: t("Team & seats"), icon: Users },
    { href: "/billing", label: t("Plan & billing"), icon: CreditCard },
    { href: "/settings", label: t("Settings"), icon: Settings },
  ];
}

function Wordmark() {
  const t = useT();
  return (
    <Link href="/dashboard" aria-label={t("Certrace — dashboard")} className="inline-flex items-center">
      <CertraceLogo className="h-[19px] w-auto" />
    </Link>
  );
}

const CATEGORY_ICON: Record<Notice["category"], React.ElementType> = {
  security: ShieldCheck,
  event: TriangleAlert,
  credential: BadgeCheck,
  offer: Bell,
};

const READ_KEY = "certrace:notifications:read";

/* Shared with the /notifications page so the bell badge and the full history
   agree on what's read — localStorage only (no backend in this MVP). */
export function useNotificationRead() {
  const [readIds, setReadIds] = React.useState<string[]>([]);
  React.useEffect(() => {
    try {
      setReadIds(JSON.parse(window.localStorage.getItem(READ_KEY) ?? "[]"));
    } catch {
      setReadIds([]);
    }
  }, []);
  const markRead = React.useCallback((ids: string[]) => {
    setReadIds((prev) => {
      const next = Array.from(new Set([...prev, ...ids]));
      // Guarded: setItem throws in private mode, and this runs inside a state
      // updater (render-phase) with no error boundary above the shell — an
      // uncaught throw here white-screens every authenticated page.
      try {
        window.localStorage.setItem(READ_KEY, JSON.stringify(next));
      } catch {
        /* best-effort: unread badge just won't persist across reloads */
      }
      return next;
    });
  }, []);
  return { readIds, markRead };
}

function NotificationsBell() {
  const { t } = useLanguage();
  const { readIds, markRead } = useNotificationRead();
  const unread = NOTIFICATIONS.filter((n) => !readIds.includes(n.id));

  return (
    <Dropdown
      align="right"
      width="w-80"
      trigger={() => (
        <span
          aria-label={t("Notifications")}
          className="relative grid h-9 w-9 place-items-center rounded-xl border border-black/10 text-black/55 hover:border-black/25 hover:text-black"
        >
          <Bell size={16} strokeWidth={1.5} />
          {unread.length > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#f87171]" />}
        </span>
      )}
    >
      {(close) => (
        <>
          <div className="flex items-center justify-between border-b border-black/[0.06] px-3 py-2.5">
            <span className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/35">{t("Notifications")}</span>
            {unread.length > 0 ? (
              <button
                onClick={() => markRead(NOTIFICATIONS.map((n) => n.id))}
                className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.08em] text-black/40 hover:text-black"
              >
                <CheckCheck size={12} strokeWidth={1.5} /> {t("Mark all read")}
              </button>
            ) : (
              <span className="font-mono text-[10px] text-black/30">{t("You're all caught up.")}</span>
            )}
          </div>
          <div>
            {NOTIFICATIONS.map((n) => {
              const Icon = CATEGORY_ICON[n.category];
              const isRead = readIds.includes(n.id);
              return (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => {
                    markRead([n.id]);
                    close();
                  }}
                  className={cn("flex items-start gap-3 border-b border-black/[0.04] px-3 py-3 last:border-0 hover:bg-[#fafaf8]", isRead && "opacity-55")}
                >
                  <span className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-lg border border-black/10 text-black/55">
                    <Icon size={14} strokeWidth={1.5} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start gap-2 text-[13px] leading-snug text-black/75">
                      <StatusDot tone={n.tone} className="mt-[7px]" />
                      <span>{n.title}</span>
                    </span>
                    <span className="mt-0.5 block text-[11px] text-black/40">{n.meta}</span>
                  </span>
                  <span className="mt-0.5 flex-none font-mono text-[10px] text-black/30">{n.time}</span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </Dropdown>
  );
}

function AccountMenu() {
  const router = useRouter();
  const { t } = useLanguage();
  const { lang, setLang } = useLanguage();
  const { profile, stored } = useProfile();
  const sessionUser = useSessionUser();
  /* A SAVED profile wins — Settings edits it, and a rename there has to show
     up here. Without one, the session's name is the truth: a fresh sign-in on
     a second machine has no local profile yet, and the unsaved default is the
     demo fixture's name, which is nobody. */
  const savedName = stored ? `${profile.firstName} ${profile.lastName}`.trim() : "";
  const sessionName = `${sessionUser?.firstName ?? ""} ${sessionUser?.lastName ?? ""}`.trim();
  const fullName = savedName || sessionName || `${profile.firstName} ${profile.lastName}`.trim();
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
        <span className="flex max-w-[160px] items-center gap-2 rounded-xl border border-black/10 px-3 py-2 hover:border-black/20 sm:max-w-none">
          <span className="min-w-0 text-left leading-tight">
            <span className="block truncate text-[12px] text-black/70">{fullName}</span>
            <span className="block truncate text-[10px] uppercase tracking-[0.1em] text-black/35">{profile.companyName}</span>
          </span>
          <ChevronDown size={13} strokeWidth={1.5} className={cn("flex-none text-black/30 transition-transform", open && "rotate-180")} />
        </span>
      )}
    >
      {(close) => (
        <>
          <div className="border-b border-black/[0.06] px-3 py-3">
            <div className="text-[13px] text-black/80">{fullName}</div>
            {accountEmail && <div className="mt-0.5 truncate text-[11px] text-black/40">{accountEmail}</div>}
          </div>
          <div className="py-1">
            <Link href="/settings?tab=organisation" onClick={close} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-black/70 hover:bg-[#fafaf8]">
              <UserCircle2 size={15} strokeWidth={1.5} className="text-black/40" /> {t("Profile & account")}
            </Link>
            <Link href="/settings?tab=notifications" onClick={close} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-black/70 hover:bg-[#fafaf8]">
              <Bell size={15} strokeWidth={1.5} className="text-black/40" /> {t("Notification settings")}
            </Link>
            <Link href="/billing" onClick={close} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-black/70 hover:bg-[#fafaf8]">
              <CreditCard size={15} strokeWidth={1.5} className="text-black/40" /> {t("Plan & billing")}
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
              <PlayCircle size={15} strokeWidth={1.5} className="text-black/40" />
              <span className="min-w-0 flex-1">{t("Guide video")}</span>
              <ExternalLink size={12} strokeWidth={1.5} className="flex-none text-black/25" />
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
              <Lightbulb size={15} strokeWidth={1.5} className="text-black/40" />
              <span className="min-w-0 flex-1">{t("Feature request")}</span>
              <ExternalLink size={12} strokeWidth={1.5} className="flex-none text-black/25" />
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
              <ExternalLink size={12} strokeWidth={1.5} className="flex-none text-black/25" />
            </a>
          </div>
          <div className="border-t border-black/[0.06] py-1">
            <div className="flex items-center gap-2 px-2.5 pb-1 pt-2 font-pixel text-[10px] uppercase tracking-[0.16em] text-black/30">
              <Globe size={12} strokeWidth={1.5} /> {t("Language")}
            </div>
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-[#fafaf8]"
              >
                <span className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] tracking-[0.1em] text-black/40">{l.glyph}</span>
                  <span className={cn(l.code === lang ? "text-black/85" : "text-black/60")}>{l.nativeLabel}</span>
                </span>
                {l.code === lang && <span className="h-1.5 w-1.5 rounded-full bg-[#111]" />}
              </button>
            ))}
          </div>
          <div className="border-t border-black/[0.06] py-1">
            <button
              disabled={signingOut}
              onClick={signOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-black/70 hover:bg-[#fafaf8] disabled:cursor-not-allowed"
            >
              {signingOut ? (
                <span className="h-[15px] w-[15px] flex-none animate-spin rounded-full border-2 border-black/15 border-t-black/50" aria-hidden />
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
  const pathname = usePathname();
  const t = useT();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const nav = useNav();
  const workspaceId = workspaceIdFromPath(pathname);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      {/* Topbar */}
      {/* data-lock="chrome" — the read-only lock never touches the shell, so a
          frozen account can still navigate, switch language and read its
          notifications. See components/account-lock.tsx. */}
      <header data-lock="chrome" className="sticky top-0 z-50 border-b border-black/[0.06] bg-[rgba(245,244,240,0.8)] backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-4 md:px-6">
          <button
            className="md:hidden"
            aria-label={t("Open menu")}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
          </button>
          <div className="hidden w-[228px] items-center md:flex">
            <Wordmark />
          </div>
          <div className="flex items-center md:hidden">
            <Wordmark />
          </div>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
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
            // Fixed-height + self-start keeps `sticky` working: without an explicit
            // height the flex row stretches the sidebar to the full content height,
            // which is taller than the viewport and silently breaks sticky so it
            // scrolls with the page. Pinned here, only the content area scrolls.
            "fixed inset-y-0 left-0 top-16 z-40 w-[228px] flex-none overflow-y-auto border-r border-black/[0.06] bg-white px-3 py-5 transition-transform md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:translate-x-0 md:self-start",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {/* Inside a workspace the sidebar IS the chain — the estate-wide nav
              is one click away at the top of it (see SupplyChainNav's own
              header comment for why). Suspense because useSearchParams, which
              the selection highlight reads, suspends on first render. */}
          {workspaceId ? (
            <React.Suspense fallback={<div className="h-32" />}>
              <SupplyChainNav workspaceId={workspaceId} onNavigate={() => setMobileOpen(false)} />
            </React.Suspense>
          ) : (
            <nav className="flex flex-col gap-0.5">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-colors",
                      active ? "bg-black/[0.05] text-black" : "text-black/50 hover:bg-black/[0.03] hover:text-black/80",
                      item.mobileOnly && "md:hidden",
                    )}
                  >
                    <Icon size={17} strokeWidth={1.5} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}

          <PlanStrip onNavigate={() => setMobileOpen(false)} />
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

      <Toaster />
    </div>
  );
}
