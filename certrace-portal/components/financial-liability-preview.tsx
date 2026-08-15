"use client";

import { Landmark } from "lucide-react";
import { Card, Chip, Eyebrow } from "@/components/ui";
import { type Declaration } from "@/lib/data";
import { useLiabilityView } from "@/lib/use-liability-view";
import { formatDecimal } from "@/lib/workflow-measurements";

export function FinancialLiabilityPreview({ declaration }: { declaration: Declaration }) {
  const view = useLiabilityView(declaration);
  const cost = view?.cost ?? null;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 flex-none place-items-center rounded-lg border border-black/10 text-black/60">
            <Landmark size={16} strokeWidth={1.5} />
          </span>
          <Eyebrow>Financial liability preview</Eyebrow>
        </div>
        <Chip tone="muted">Estimate</Chip>
      </div>

      {cost && !cost.available ? (
        /* An unpublished certificate price is stated plainly rather than
           papered over with the previous quarter's number. */
        <>
          <p className="mt-4 text-sm text-black/45">
            {cost.unavailableReason ?? `No officially published CBAM certificate price covers ${cost.asOf}.`}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-black/40">
            {formatDecimal(cost.chargeableTCO2e)} tCO₂e chargeable is already resolved — only the certificate price is
            missing. No proxy or previous-quarter price is substituted.
          </p>
        </>
      ) : cost === null || cost.netExposureEUR === null ? (
        <p className="mt-4 text-sm text-black/45">
          A financial estimate appears once suppliers submit their emissions data for this cycle. It uses the published
          CBAM certificate price and the ECB THB/EUR reference rate.
        </p>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="font-[family-name:var(--font-plex)] text-4xl font-light tracking-tight text-[#111]">
                €{formatDecimal(cost.netExposureEUR)}
              </div>
              <div className="mt-1.5 text-[11px] uppercase tracking-[0.1em] text-black/40">
                Estimated {cost.year} certificate cost
              </div>
              {cost.netExposureTHB && (
                <div className="mt-1 font-mono text-[12px] text-black/45">≈ ฿{formatDecimal(cost.netExposureTHB)} THB</div>
              )}
            </div>
            <div className="text-right text-[12px] text-black/45">
              <div>
                {formatDecimal(cost.chargeableTCO2e)} tCO₂e chargeable · €{cost.certificatePriceEURPerTCO2e}/t
              </div>
              {cost.grossCostEUR && (
                <div className="mt-0.5">€{formatDecimal(cost.grossCostEUR)} gross − carbon price paid</div>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-black/[0.06] pt-4 text-[11px] text-black/40">
            <span>
              Certificate price as of <span className="font-mono text-black/55">{cost.asOf}</span>
            </span>
            <span className="text-black/20">·</span>
            <span>
              THB/EUR <span className="font-mono text-black/55">{cost.fx.thbPerEur}</span> as of{" "}
              <span className="font-mono text-black/55">{cost.fx.asOf}</span>
              {cost.fx.stale && <span className="ml-1 text-[#b45309]">(fallback rate — ECB unavailable)</span>}
            </span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-black/40">
            Direct (Annex-II chargeable) emissions only, net of declared carbon price paid. Not a filed figure —
            verification, free allocation and deductible-carbon-price evidence remain separate gates.
          </p>
        </>
      )}
    </Card>
  );
}
