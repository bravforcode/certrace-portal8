"use client";

/* Staff sign-in (mock). Production: SSO + 2FA on a session fully separate from
   the customer portals. Here you pick a persona to demo the RBAC model. */

import * as React from "react";
import { useRouter } from "next/navigation";
import { CertraceLogo } from "@/components/logo";
import { cn } from "@/components/ui";
import { useAdminAuth } from "@/lib/admin-auth";
import { DEPARTMENTS, STAFF, getRole, type DeptId } from "@/lib/admin-data";

export default function StaffLogin() {
  const { user, ready, signIn } = useAdminAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (ready && user) router.replace("/admin/dashboard");
  }, [ready, user, router]);

  const byDept = DEPARTMENTS.map((d) => ({
    dept: d,
    people: STAFF.filter((s) => s.status === "active" && getRole(s.roleId).dept === d.id),
  })).filter((g) => g.people.length > 0);

  return (
    <div className="min-h-screen">
      <div className="h-[3px] w-full bg-[#3C7ACB]" />
      <div className="mx-auto max-w-3xl px-6 py-14">
        <div className="ct-enter flex items-center gap-3">
          <CertraceLogo className="h-[18px] w-auto" />
          <span className="rounded-md border border-[#3C7ACB]/40 bg-[#3C7ACB]/10 px-2 py-0.5 font-pixel text-[10px] uppercase tracking-[0.18em] text-[#2c5c9c]">
            Staff · Internal
          </span>
        </div>
        <h1 className="mt-8 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111] md:text-4xl">
          Admin Console
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-black/45">
          Certrace staff only. Access is scoped by department and role — pick a persona to sign in as. In production
          this is SSO with mandatory 2FA; every session and action is audited.
        </p>

        <div className="mt-10 space-y-8">
          {byDept.map(({ dept, people }) => (
            <div key={dept.id} className="ct-enter">
              <div className="mb-3 flex items-baseline gap-2">
                <span className="font-pixel text-[11px] uppercase tracking-[0.18em] text-black/40">{dept.name}</span>
                <span className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/25">{dept.code}</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {people.map((p) => {
                  const role = getRole(p.roleId);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        signIn(p.id);
                        router.push("/admin/dashboard");
                      }}
                      className={cn(
                        "group flex items-center justify-between gap-3 rounded-2xl border border-black/[0.07] bg-white px-4 py-3 text-left transition-colors",
                        "hover:border-black/25",
                        dept.id === "super" && "border-[#3C7ACB]/40 bg-[#3C7ACB]/[0.04]",
                      )}
                    >
                      <span>
                        <span className="block text-[13px] text-black/75">{p.name}</span>
                        <span className="mt-0.5 block font-pixel text-[10px] uppercase tracking-[0.14em] text-black/35">
                          {role.name}
                        </span>
                      </span>
                      <span className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/25 transition-colors group-hover:text-black/60">
                        Sign in →
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-12 border-t border-black/[0.06] pt-5 text-xs text-black/30">
          Mock authentication for the UX MVP — the permission model shown in-console is display-level; production must
          enforce it server-side. Spec: certrace-portal/docs/ADMIN-CONSOLE-PLAN.md
        </p>
      </div>
    </div>
  );
}
