"use client";

/* ════════════════════════════════════════════════════════════
   YOUR SITES — where each site and each year stands

   The same shape as the Verification page: a site, and under it a row per
   reporting year — how many product reports, how far along, how many months are
   in, and whether the package can leave. Every row opens that year's Readiness.
   ════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { Card, Chip, Progress } from "@/components/ui";
import type { CompanyStatus } from "@/lib/cbam/company-status";
import { useT } from "@/lib/i18n";

export function SitesOverview({ status }: { status: CompanyStatus }) {
  const t = useT();
  if (status.sites.length === 0) return null;
  return (
    <div className="grid gap-3 lg:grid-cols-2 [&>*]:min-w-0">
      {status.sites.map((site) => (
        <Card key={site.id} className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <Building2 size={16} strokeWidth={1.5} className="flex-none text-black/35" />
              <div className="min-w-0">
                <p className="truncate text-[15px] text-[#111]">{site.name}</p>
                <p className="truncate font-mono text-[11px] text-black/40">{site.id}</p>
              </div>
            </div>
            <Link href={`/workspaces/installation/${encodeURIComponent(site.id)}`} className="flex-none text-[12px] text-black/45 underline underline-offset-2 hover:text-black">
              {t("Open site")}
            </Link>
          </div>

          <ul className="mt-4 divide-y divide-black/[0.06]">
            {site.years.map((y) => (
              <li key={y.year}>
                <Link href={`/workspaces/installation/${encodeURIComponent(site.id)}/readiness?year=${y.year}`} className="group flex items-center gap-4 py-3">
                  <span className="w-11 flex-none font-mono text-[13px] text-black/70">{y.year}</span>
                  <span className="min-w-0 flex-1">
                    <Progress value={y.percent} tone={y.blocked > 0 ? "err" : y.percent === 100 ? "ok" : "warn"} />
                    <span className="mt-1.5 flex flex-wrap gap-x-3 text-[11.5px] text-black/45">
                      <span>{t("{n} product reports", { n: y.reports })}</span>
                      <span>{t("{in} of {of} months in", { in: y.monthsIn, of: y.monthsOf })}</span>
                    </span>
                  </span>
                  <span className="flex flex-none items-center gap-2">
                    <Chip tone={y.packageReady ? "ok" : y.blocked > 0 ? "err" : "warn"}>
                      {y.packageReady ? t("Ready to send") : y.blocked > 0 ? t("Blocked") : t("{n} to do", { n: y.holding })}
                    </Chip>
                    <ArrowRight size={14} strokeWidth={1.5} className="text-black/25 transition-transform group-hover:translate-x-0.5 group-hover:text-black/60" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
