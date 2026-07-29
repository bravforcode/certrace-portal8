"use client";

import * as React from "react";
import { Landmark } from "lucide-react";
import { Card, Chip, Eyebrow } from "@/components/ui";
import { type Declaration } from "@/lib/data";
import { loadExporterState, rollup as buildRollup } from "@/lib/exporter-review";
import { computeComplianceFacts, type ComplianceFacts } from "@/lib/compliance-engine";
import { fetchEcbThbEur, FALLBACK_THB_EUR_RATE, type ThbEurRate } from "@/lib/fx";
import { decimal, decimalToString } from "@/lib/mrv";
import { formatDecimal } from "@/lib/workflow-measurements";

const CERTIFICATE_PRICE_AS_OF = "2026-06-30";

export function FinancialLiabilityPreview({ declaration }: { declaration: Declaration }) {
  const [rate, setRate] = React.useState<ThbEurRate>(FALLBACK_THB_EUR_RATE);
  const [facts, setFacts] = React.useState<ComplianceFacts | null>(null);

  React.useEffect(() => {
    let active = true;
    // localStorage-backed exporter state only exists client-side; compute after mount.
    fetchEcbThbEur().then((r) => {
      if (!active) return;
      setRate(r);
      const roll = buildRollup(declaration, loadExporterState(declaration.id));
      setFacts(computeComplianceFacts(roll, 2026, CERTIFICATE_PRICE_AS_OF, r));
    });
    return () => {
      active = false;
    };
  }, [declaration]);

  const price = facts?.certificatePriceEURPerTCO2e ?? null;
  const chargeable = facts?.totalChargeableTCO2e ?? "0";
  // Gross certificate cost before any carbon-price offset, straight from the
  // engine's inputs (chargeable tonnes × published price) — display only.
  const grossCostEUR = price ? decimalToString(decimal(chargeable).times(decimal(price)).toDecimalPlaces(2)) : null;
  const netEUR = facts?.totalNetExposureEUR ?? null;
  const netTHB = netEUR ? decimalToString(decimal(netEUR).times(decimal(rate.thbPerEur)).toDecimalPlaces(2)) : null;

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

      {netEUR === null ? (
        <p className="mt-4 text-sm text-black/45">
          A financial estimate appears once suppliers submit their emissions data for this cycle. It uses the published CBAM
          certificate price and the ECB THB/EUR reference rate.
        </p>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="font-[family-name:var(--font-plex)] text-4xl font-light tracking-tight text-[#111]">
                €{formatDecimal(netEUR)}
              </div>
              <div className="mt-1.5 text-[11px] uppercase tracking-[0.1em] text-black/40">
                Estimated 2026 certificate cost
              </div>
              {netTHB && <div className="mt-1 font-mono text-[12px] text-black/45">≈ ฿{formatDecimal(netTHB)} THB</div>}
            </div>
            <div className="text-right text-[12px] text-black/45">
              <div>
                {formatDecimal(chargeable)} tCO₂e chargeable · €{price}/t
              </div>
              {grossCostEUR && (
                <div className="mt-0.5">
                  €{formatDecimal(grossCostEUR)} gross − carbon price paid
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-black/[0.06] pt-4 text-[11px] text-black/40">
            <span>
              Certificate price as of <span className="font-mono text-black/55">{facts?.certificatePriceAsOf}</span>
            </span>
            <span className="text-black/20">·</span>
            <span>
              THB/EUR <span className="font-mono text-black/55">{rate.thbPerEur}</span> as of{" "}
              <span className="font-mono text-black/55">{rate.asOf}</span>
              {rate.stale && <span className="ml-1 text-[#b45309]">(fallback rate — ECB unavailable)</span>}
            </span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-black/40">
            Direct (Annex-II chargeable) emissions only, net of declared carbon price paid. Not a filed figure — verification,
            free allocation and deductible-carbon-price evidence remain separate gates.
          </p>
        </>
      )}
    </Card>
  );
}
