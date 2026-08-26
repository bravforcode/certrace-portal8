"use client";

/* ════════════════════════════════════════════════════════════
   WIDGET K — SUPPLIER & PRECURSOR CHAIN HEALTH

   Condensed to dashboard scale — a three-stage funnel, the account-
   stickiness metric, and one link out to actually chase the stale ones,
   rather than repeating the Suppliers page's full content here.
   ════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui";
import type { SupplierFunnel } from "@/lib/cbam/dashboard-aggregates";
import { useT } from "@/lib/i18n";

function FunnelBar({ funnel }: { funnel: SupplierFunnel }) {
  const total = funnel.totalPrecursorSuppliers || 1;
  const stages = [
    { label: "Invited", count: funnel.invited, color: "#d4d4d4" },
    { label: "Responded", count: funnel.responded, color: "#93c5fd" },
    { label: "Verified", count: funnel.verified, color: "#047857" },
  ];
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-black/[0.04]">
        {stages.map((s) => (
          <div key={s.label} style={{ width: `${(s.count / total) * 100}%`, background: s.color }} title={`${s.label}: ${s.count}`} />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1">
        {stages.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5 text-[12px] text-black/50">
            <span className="h-2 w-2 flex-none rounded-full" style={{ background: s.color }} />
            {s.label} — {s.count}
          </span>
        ))}
      </div>
    </div>
  );
}

export function SupplierHealth({ funnel }: { funnel: SupplierFunnel }) {
  const t = useT();
  return (
    <Card className="p-6">
      <h2 className="font-[family-name:var(--font-plex)] text-lg font-light tracking-tight text-[#111]">{t("Supplier & precursor chain health")}</h2>

      {funnel.totalPrecursorSuppliers === 0 ? (
        <p className="mt-3 text-[13px] text-black/40">{t("No precursor suppliers on file yet.")}</p>
      ) : (
        <>
          <div className="mt-4">
            <FunnelBar funnel={funnel} />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-4">
            <p className="text-[13px] text-black/60">
              <span className="font-medium text-black/80">
                {funnel.withAccount} of {funnel.totalPrecursorSuppliers}
              </span>{" "}
              precursor suppliers have a Certrace account
            </p>

            {funnel.staleCount > 0 && (
              <Link href="/suppliers" className="flex-none rounded-lg border border-black/15 px-3 py-1.5 text-[11px] uppercase tracking-[0.08em] text-black/60 hover:border-black/30 hover:text-black">
                Chase these {funnel.staleCount} supplier{funnel.staleCount === 1 ? "" : "s"} <ArrowRight size={11} strokeWidth={1.5} className="ml-1 inline" />
              </Link>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
