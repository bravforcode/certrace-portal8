"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Building2,
  FileCheck2,
  Users,
  Globe2,
  Settings,
  CreditCard,
  Bell,
  ChevronDown,
  Menu,
  X,
  TriangleAlert,
  ShieldCheck,
  BadgeCheck,
} from "lucide-react";
import { cn, StatusDot } from "./ui";
import { Toaster } from "./toast";
import { ORG, USER } from "@/lib/data";
import { JURISDICTIONS } from "@/lib/config";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/declarations", label: "Declarations", icon: Layers },
  { href: "/suppliers", label: "Suppliers", icon: Building2 },
  { href: "/reports", label: "Reports", icon: FileCheck2 },
  { href: "/team", label: "Team & seats", icon: Users },
  { href: "/regulations", label: "Coverage", icon: Globe2 },
  { href: "/billing", label: "Plan & billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Pixel glyph that reads as "C" on a 5×5 grid (DS: generative pixel-grid logo).
//  · ■ ■ ■ ·
//  ■ · · · ·
//  ■ · · · ·
//  ■ · · · ·
//  · ■ ■ ■ ·
const C_ON = new Set([1, 2, 3, 5, 10, 15, 21, 22, 23]);

function Wordmark() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span className="grid h-7 w-7 flex-none grid-cols-5 grid-rows-5 gap-[2px] rounded-md bg-[#111] p-[4px]" aria-hidden>
        {Array.from({ length: 25 }, (_, i) => (
          <span key={i} className="rounded-[1px] bg-white" style={{ opacity: C_ON.has(i) ? 1 : 0 }} />
        ))}
      </span>
      <span className="font-pixel text-[12px] uppercase tracking-[0.25em] text-black/70">Certrace</span>
    </Link>
  );
}

function CountrySwitcher() {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(JURISDICTIONS[0]);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-[11px] uppercase tracking-[0.1em] text-black/55 hover:border-black/25 hover:text-black"
      >
        <span className="font-mono text-[10px] tracking-[0.16em] text-black/40">{active.flag}</span>
        {active.name}
        <ChevronDown size={13} strokeWidth={1.5} className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} aria-hidden />
          <div
            className="absolute right-0 z-[60] mt-2 w-64 overflow-hidden rounded-2xl border border-black/[0.07] bg-white"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <div className="border-b border-black/[0.06] px-4 py-2.5 font-pixel text-[10px] uppercase tracking-[0.16em] text-black/35">
              Operating jurisdiction
            </div>
            {JURISDICTIONS.map((j) => {
              const live = j.status === "live";
              return (
                <button
                  key={j.code}
                  disabled={!j.available}
                  onClick={() => {
                    setActive(j);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[#fafaf8] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <span className="font-mono text-[10px] tracking-[0.16em] text-black/40">{j.flag}</span>
                  <span className="flex-1">
                    <span className="block text-sm text-black/70">{j.name}</span>
                    <span className="block text-[11px] text-black/35">{live ? j.factorSet : "coming soon"}</span>
                  </span>
                  <StatusDot tone={live ? "ok" : "muted"} />
                </button>
              );
            })}
            <div className="border-t border-black/[0.06] px-4 py-2.5 text-[11px] text-black/35">
              Thailand is live. More markets onboard as factor libraries verify.
            </div>
          </div>
        </>
      )}
    </div>
  );
}

type Notice = { icon: React.ElementType; tone: "err" | "info" | "ok" | "warn"; title: string; meta: string; href: string };
const NOTICES: Notice[] = [
  { icon: TriangleAlert, tone: "err", title: "G J Steel is overdue", meta: "CBAM Q2 2026 · 9 days no response", href: "/declarations/cbam-2026-q2-steel" },
  { icon: ShieldCheck, tone: "info", title: "Legal sign-off requested", meta: "Krit Legal Partners notified", href: "/declarations/cbam-2026-q1-steel" },
  { icon: BadgeCheck, tone: "ok", title: "Q1 2026 package accepted", meta: "EU importer confirmed receipt", href: "/reports" },
];

function NotificationsBell() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <button
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-xl border border-black/10 text-black/55 hover:border-black/25 hover:text-black"
      >
        <Bell size={16} strokeWidth={1.5} />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#f87171]" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} aria-hidden />
          <div
            className="absolute right-0 z-[60] mt-2 w-80 overflow-hidden rounded-2xl border border-black/[0.07] bg-white"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-2.5">
              <span className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/35">Notifications</span>
              <span className="font-mono text-[10px] text-black/35">3 new</span>
            </div>
            {NOTICES.map((n) => {
              const Icon = n.icon;
              return (
                <Link
                  key={n.title}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 border-b border-black/[0.04] px-4 py-3 last:border-0 hover:bg-[#fafaf8]"
                >
                  <span className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-lg border border-black/10 text-black/55">
                    <Icon size={14} strokeWidth={1.5} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-[13px] text-black/75">
                      <StatusDot tone={n.tone} /> {n.title}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-black/40">{n.meta}</span>
                  </span>
                </Link>
              );
            })}
            <Link href="/dashboard" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-center text-[11px] uppercase tracking-[0.1em] text-black/40 hover:text-black">
              View all activity →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

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
          <div className="hidden w-[228px] md:block">
            <Wordmark />
          </div>
          <div className="md:hidden">
            <Wordmark />
          </div>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <div className="hidden sm:block">
              <CountrySwitcher />
            </div>
            <NotificationsBell />
            <div className="flex items-center gap-2.5 rounded-xl border border-black/10 py-1.5 pl-1.5 pr-3">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#111] text-[11px] font-medium text-white">
                {USER.initials}
              </span>
              <span className="hidden leading-tight sm:block">
                <span className="block text-[12px] text-black/70">{USER.name}</span>
                <span className="block text-[10px] uppercase tracking-[0.1em] text-black/35">{ORG.name}</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 top-16 z-40 w-[228px] flex-none border-r border-black/[0.06] bg-white px-3 py-5 transition-transform md:sticky md:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <nav className="flex flex-col gap-0.5">
            {NAV.map((item) => {
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
