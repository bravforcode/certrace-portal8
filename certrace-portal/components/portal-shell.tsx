"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Building2,
  FileCheck2,
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
  TrendingDown,
} from "lucide-react";
import { cn, StatusDot } from "./ui";
import { Dropdown } from "./controls";
import { CertraceLogo } from "./logo";
import { Toaster } from "./toast";
import { ORG, USER, NOTIFICATIONS, type Notice } from "@/lib/data";
import { LANGUAGES, useLanguage } from "@/lib/i18n";
import { useProfile } from "@/lib/profile";

function useNav() {
  const { t } = useLanguage();
  return [
    { href: "/dashboard", label: t("nav_dashboard"), icon: LayoutDashboard },
    { href: "/declarations", label: t("nav_declarations"), icon: Layers },
    { href: "/suppliers", label: t("nav_suppliers"), icon: Building2 },
    { href: "/reports", label: t("nav_reports"), icon: FileCheck2 },
    { href: "/financials", label: "Financial", icon: TrendingDown },
    { href: "/team", label: t("nav_team"), icon: Users },
    { href: "/billing", label: t("nav_billing"), icon: CreditCard },
    { href: "/settings", label: t("nav_settings"), icon: Settings },
  ];
}

function Wordmark() {
  return (
    <Link href="/dashboard" aria-label="Certrace — dashboard" className="inline-flex items-center">
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
      window.localStorage.setItem(READ_KEY, JSON.stringify(next));
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
          aria-label="Notifications"
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
            <span className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/35">{t("topbar_notifications")}</span>
            {unread.length > 0 ? (
              <button
                onClick={() => markRead(NOTIFICATIONS.map((n) => n.id))}
                className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.08em] text-black/40 hover:text-black"
              >
                <CheckCheck size={12} strokeWidth={1.5} /> Mark all read
              </button>
            ) : (
              <span className="font-mono text-[10px] text-black/30">{t("topbar_no_new")}</span>
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
  const { profile } = useProfile();
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  const [signingOut, setSigningOut] = React.useState(false);

  const signOut = () => {
    setSigningOut(true);
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
            <div className="mt-0.5 truncate text-[11px] text-black/40">{USER.email}</div>
          </div>
          <div className="py-1">
            <Link href="/settings?tab=organisation" onClick={close} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-black/70 hover:bg-[#fafaf8]">
              <UserCircle2 size={15} strokeWidth={1.5} className="text-black/40" /> {t("account_profile")}
            </Link>
            <Link href="/settings?tab=notifications" onClick={close} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-black/70 hover:bg-[#fafaf8]">
              <Bell size={15} strokeWidth={1.5} className="text-black/40" /> {t("account_notifications")}
            </Link>
            <Link href="/billing" onClick={close} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-black/70 hover:bg-[#fafaf8]">
              <CreditCard size={15} strokeWidth={1.5} className="text-black/40" /> {t("account_billing")}
            </Link>
          </div>
          <div className="border-t border-black/[0.06] py-1">
            <div className="flex items-center gap-2 px-2.5 pb-1 pt-2 font-pixel text-[10px] uppercase tracking-[0.16em] text-black/30">
              <Globe size={12} strokeWidth={1.5} /> {t("language_label")}
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
              {signingOut ? "Signing out…" : t("account_signout")}
            </button>
          </div>
        </>
      )}
    </Dropdown>
  );
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const nav = useNav();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      {/* Topbar */}
      <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-[rgba(245,244,240,0.8)] backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-4 md:px-6">
          <button
            className="md:hidden"
            aria-label="Open menu"
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
          className={cn(
            // Fixed-height + self-start keeps `sticky` working: without an explicit
            // height the flex row stretches the sidebar to the full content height,
            // which is taller than the viewport and silently breaks sticky so it
            // scrolls with the page. Pinned here, only the content area scrolls.
            "fixed inset-y-0 left-0 top-16 z-40 w-[228px] flex-none overflow-y-auto border-r border-black/[0.06] bg-white px-3 py-5 transition-transform md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:translate-x-0 md:self-start",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
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
                  )}
                >
                  <Icon size={17} strokeWidth={1.5} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/billing"
            onClick={() => setMobileOpen(false)}
            className="mt-6 block rounded-2xl border border-black/[0.07] bg-[#faf9f7] p-4 transition-colors hover:border-black/15"
          >
            <div className="flex items-center justify-between">
              <span className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/40">{ORG.planLabel} plan</span>
              <span className="font-mono text-[11px] text-black/45">
                {ORG.seatsUsed}/{ORG.seatsTotal}
              </span>
            </div>
            <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-black/[0.07]">
              <div className="h-full rounded-full bg-[#111]" style={{ width: `${(ORG.seatsUsed / ORG.seatsTotal) * 100}%` }} />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-black/40">Seats used. Suppliers are always free.</p>
          </Link>
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
