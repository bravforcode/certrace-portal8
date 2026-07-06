"use client";

/* Staff console shell — deliberately visually distinct from the customer
   portals (plan doc §7): dark #111 top bar + accent strip + "STAFF · INTERNAL"
   Courier tag, so nobody mistakes which surface they're on mid-impersonation. */

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  FileCheck2,
  ShieldCheck,
  Database,
  CreditCard,
  LifeBuoy,
  Users,
  ScrollText,
  Megaphone,
  Server,
  BarChart3,
  Scale,
  Settings,
  LogOut,
} from "lucide-react";
import { CertraceLogo } from "@/components/logo";
import { cn } from "@/components/ui";
import { useAdminAuth, roleOf, deptOf } from "@/lib/admin-auth";
import type { ModuleId } from "@/lib/admin-data";

const NAV: { group: string; items: { module: ModuleId; href: string; label: string; icon: React.ElementType }[] }[] = [
  {
    group: "Operate",
    items: [
      { module: "dashboard", href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { module: "accounts", href: "/admin/accounts", label: "Accounts", icon: Building2 },
      { module: "declarations", href: "/admin/declarations", label: "Declarations", icon: FileCheck2 },
      { module: "verification", href: "/admin/verification-queue", label: "Verification queue", icon: ShieldCheck },
    ],
  },
  {
    group: "Govern",
    items: [
      { module: "regulatory", href: "/admin/regulatory-data", label: "Regulatory data", icon: Database },
      { module: "audit", href: "/admin/audit-log", label: "Audit log", icon: ScrollText },
      { module: "legal", href: "/admin/legal", label: "Legal & privacy", icon: Scale },
    ],
  },
  {
    group: "Run",
    items: [
      { module: "billing", href: "/admin/billing", label: "Billing", icon: CreditCard },
      { module: "support", href: "/admin/support", label: "Support tickets", icon: LifeBuoy },
      { module: "announcements", href: "/admin/announcements", label: "Announcements", icon: Megaphone },
      { module: "system", href: "/admin/system", label: "System", icon: Server },
    ],
  },
  {
    group: "Understand",
    items: [
      { module: "reports", href: "/admin/reports", label: "Reports", icon: BarChart3 },
      { module: "staff", href: "/admin/staff", label: "Staff & roles", icon: Users },
    ],
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, ready, can, signOut } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (ready && !user) router.replace("/admin/login");
  }, [ready, user, router]);

  if (!ready) return null;
  if (!user) return null;

  const role = roleOf(user);
  const dept = deptOf(user);

  return (
    <div className="min-h-screen">
      {/* Accent strip — the STAFF marker */}
      <div className="h-[3px] w-full bg-[#3C7ACB]" />

      {/* Dark staff top bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#111]">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard" className="flex items-center gap-3">
              <CertraceLogo variant="onDark" className="h-[16px] w-auto" />
            </Link>
            <span className="rounded-md border border-[#3C7ACB]/60 bg-[#3C7ACB]/15 px-2 py-0.5 font-pixel text-[10px] uppercase tracking-[0.18em] text-[#9cc0ee]">
              Staff · Internal
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-[13px] text-white/85">{user.name}</div>
              <div className="font-pixel text-[10px] uppercase tracking-[0.14em] text-white/40">
                {role.name} · {dept.code}
              </div>
            </div>
            <Link
              href="/admin/settings"
              aria-label="Settings"
              className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Settings size={16} strokeWidth={1.5} />
            </Link>
            <button
              type="button"
              aria-label="Sign out"
              onClick={() => {
                signOut();
                router.replace("/admin/login");
              }}
              className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-8 px-4 py-8 md:px-6">
        {/* Sidebar — modules filtered by the viewer's department access */}
        <aside className="hidden w-52 flex-none md:sticky md:top-[4.5rem] md:block md:h-[calc(100vh-5.5rem)] md:self-start md:overflow-y-auto">
          <nav className="space-y-6">
            {NAV.map((g) => {
              const visible = g.items.filter((i) => can(i.module) !== "none");
              if (!visible.length) return null;
              return (
                <div key={g.group}>
                  <div className="mb-2 px-3 font-pixel text-[10px] uppercase tracking-[0.2em] text-black/30">{g.group}</div>
                  <ul className="space-y-0.5">
                    {visible.map((i) => {
                      const active = pathname === i.href || pathname.startsWith(i.href + "/");
                      return (
                        <li key={i.href}>
                          <Link
                            href={i.href}
                            className={cn(
                              "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-colors",
                              active ? "bg-[#111] text-white" : "text-black/55 hover:bg-black/[0.05] hover:text-black",
                            )}
                          >
                            <i.icon size={15} strokeWidth={1.5} className={active ? "text-white/70" : "text-black/35"} />
                            {i.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

/* Guard for a module page: renders children only if the viewer has access. */
export function ModuleGuard({ module, children }: { module: ModuleId; children: React.ReactNode }) {
  const { user, ready, can } = useAdminAuth();
  if (!ready || !user) return null;
  if (can(module) === "none") {
    return (
      <div className="rounded-2xl border border-dashed border-black/10 bg-white px-6 py-16 text-center">
        <div className="font-pixel text-[11px] uppercase tracking-[0.18em] text-black/35">No access</div>
        <p className="mx-auto mt-3 max-w-sm text-sm text-black/50">
          Your role ({roleOf(user).name}) has no access to this module. Access is granted per department — see Staff &
          roles, or ask a Platform Admin.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
