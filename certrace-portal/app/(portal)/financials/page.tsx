"use client";

import * as React from "react";
import { Card, PageHeader, Stat, Eyebrow, Chip } from "@/components/ui";
import { DECLARATIONS } from "@/lib/data";
import { loadExporterState, rollup, type ReviewRollup } from "@/lib/exporter-review";
import { computeComplianceFacts, type ComplianceFacts } from "@/lib/compliance-engine";
import { fetchEcbThbEur, FALLBACK_THB_EUR_RATE, type ThbEurRate } from "@/lib/fx";
import { decimal, decimalToString } from "@/lib/mrv";
import { formatDecimal } from "@/lib/workflow-measurements";

const CERTIFICATE_PRICE_AS_OF = "2026-06-30";

const active = DECLARATIONS.find((d) => d.id === "cbam-2026-annual-steel")!;

export default function FinancialsPage() {
  const [rate, setRate] = React.useState<ThbEurRate>(FALLBACK_THB_EUR_RATE);
  const [roll, setRoll] = React.useState<ReviewRollup | null>(null);
  const [facts, setFacts] = React.useState<ComplianceFacts | null>(null);

  React.useEffect(() => {
    let mounted = true;
    // localStorage-backed exporter state only exists client-side; compute after mount.
    fetchEcbThbEur().then((r) => {
      if (!mounted) return;
      const rollNow = rollup(active, loadExporterState(active.id));
      setRate(r);
      setRoll(rollNow);
      setFacts(computeComplianceFacts(rollNow, 2026, CERTIFICATE_PRICE_AS_OF, r));
    });
    return () => {
      mounted = false;
    };
  }, []);

  const price = facts?.certificatePriceEURPerTCO2e ?? null;
  const netEUR = facts?.totalNetExposureEUR ?? null;
  const netTHB = netEUR ? decimalToString(decimal(netEUR).times(decimal(rate.thbPerEur)).toDecimalPlaces(2)) : null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Financial"
        title="Carbon liability forecast."
        lead="Estimated 2026 CBAM certificate cost for the active declaration — chargeable embedded emissions priced at the published certificate price, minus carbon price already paid. A local estimate, not a filed figure."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-5">
          <Stat value={facts ? formatDecimal(facts.totalChargeableTCO2e) : "—"} label="Chargeable tCO2e" />
        </Card>
        <Card className="p-5">
          <Stat value={price ? `€${formatDecimal(price)}` : "—"} label={`Certificate price / t (${CERTIFICATE_PRICE_AS_OF})`} />
        </Card>
        <Card className="p-5">
          <Stat value={netEUR ? `€${formatDecimal(netEUR)}` : "—"} label="Net exposure (EUR)" />
        </Card>
        <Card className="p-5">
          <Stat value={netTHB ? `฿${formatDecimal(netTHB)}` : "—"} label="≈ Net exposure (THB)" />
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-black/35">
        <span>{active.period} —</span>
        <Chip tone="muted">Estimate</Chip>
        <Chip tone="muted">฿{rate.thbPerEur} / EUR · {rate.asOf}</Chip>
        <Chip tone={rate.stale ? "warn" : "ok"}>{rate.stale ? "ECB rate unavailable — fallback rate" : `ECB reference rate (${rate.source})`}</Chip>
        {facts?.certificatePriceWarning ? <Chip tone="warn">{facts.certificatePriceWarning}</Chip> : null}
      </div>

      <div className="space-y-3">
        <Eyebrow>Supplier breakdown</Eyebrow>
        {!roll || roll.submissions.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-black/45">
              A breakdown appears once suppliers submit their emissions data for this cycle.
            </p>
          </Card>
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left text-[11px] uppercase tracking-[0.08em] text-black/40">
                  <th className="px-5 py-3 font-normal">Supplier</th>
                  <th className="px-5 py-3 text-right font-normal">Chargeable tCO2e</th>
                  <th className="px-5 py-3 text-right font-normal">Carbon price paid (EUR)</th>
                  <th className="px-5 py-3 text-right font-normal">Net exposure (EUR)</th>
                </tr>
              </thead>
              <tbody>
                {roll.submissions.map((sub) => {
                  const f = facts?.perSupplier[sub.supplier.id];
                  return (
                    <tr key={sub.supplier.id} className="border-b border-black/5 last:border-0">
                      <td className="px-5 py-3 text-black/70">{sub.supplier.name}</td>
                      <td className="px-5 py-3 text-right font-mono text-black/60">{f ? formatDecimal(f.chargeableTCO2e) : "—"}</td>
                      <td className="px-5 py-3 text-right font-mono text-black/60">{f?.carbonPricePaidEUR ? `€${formatDecimal(f.carbonPricePaidEUR)}` : "—"}</td>
                      <td className="px-5 py-3 text-right font-mono text-black/60">{f?.netExposureEUR ? `€${formatDecimal(f.netExposureEUR)}` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
