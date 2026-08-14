"use client";

import { Card, PageHeader, Stat, Eyebrow, Chip } from "@/components/ui";
import { DECLARATIONS } from "@/lib/data";
import { useLiabilityView } from "@/lib/use-liability-view";
import { formatDecimal } from "@/lib/workflow-measurements";

const active = DECLARATIONS.find((d) => d.id === "cbam-2026-annual-steel")!;

export default function FinancialsPage() {
  const view = useLiabilityView(active);
  const cost = view?.cost ?? null;
  const submissions = view?.rollup.submissions ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Financial"
        title="Carbon liability forecast."
        lead="Estimated CBAM certificate cost for the active declaration — chargeable embedded emissions priced at the officially published certificate price for the reporting period, minus carbon price already paid. A local estimate, not a filed figure."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card className="p-5">
          <Stat value={cost ? formatDecimal(cost.chargeableTCO2e) : "—"} label="Chargeable tCO2e" />
        </Card>
        <Card className="p-5">
          <Stat
            value={cost?.certificatePriceEURPerTCO2e ? `€${formatDecimal(cost.certificatePriceEURPerTCO2e)}` : "—"}
            label="Certificate price €/t"
          />
        </Card>
        <Card className="p-5">
          <Stat value={cost?.netExposureEUR ? `€${formatDecimal(cost.netExposureEUR)}` : "—"} label="Net exposure EUR" />
        </Card>
        <Card className="p-5">
          <Stat value={cost?.netExposureTHB ? `฿${formatDecimal(cost.netExposureTHB)}` : "—"} label="≈ THB" />
        </Card>
      </div>

      {/* No official price for the resolved date means no number at all — a
          previous quarter's price is never carried forward to fill the gap. */}
      {cost && !cost.available && (
        <Card warm className="p-5">
          <Eyebrow>Cost outcome unavailable</Eyebrow>
          <p className="mt-2 text-sm leading-relaxed text-black/55">
            {cost.unavailableReason ??
              `No officially published CBAM certificate price covers ${cost.asOf}.`}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-black/40">
            The forecast stays blank until the price for this period is published and ingested. No proxy, historic, or
            previous-quarter price is substituted.
          </p>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-black/35">
        <span>{active.period} —</span>
        <Chip tone="muted">Estimate</Chip>
        {cost && <Chip tone="muted">฿{cost.fx.thbPerEur} / EUR · {cost.fx.asOf}</Chip>}
        {cost && <Chip tone="muted">Priced as of {cost.asOf}</Chip>}
        {cost && (
          <Chip tone={cost.fx.stale ? "warn" : "ok"}>
            {cost.fx.stale ? "ECB rate unavailable — fallback rate" : `ECB reference rate (${cost.fx.source})`}
          </Chip>
        )}
      </div>

      <div className="space-y-3">
        <Eyebrow>Supplier breakdown</Eyebrow>
        {submissions.length === 0 ? (
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
                {submissions.map((sub) => {
                  const f = view?.facts.perSupplier[sub.supplier.id];
                  return (
                    <tr key={sub.supplier.id} className="border-b border-black/5 last:border-0">
                      <td className="px-5 py-3 text-black/70">{sub.supplier.name}</td>
                      <td className="px-5 py-3 text-right font-mono text-black/60">
                        {f ? formatDecimal(f.chargeableTCO2e) : "—"}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-black/60">
                        {f?.carbonPricePaidEUR ? `€${formatDecimal(f.carbonPricePaidEUR)}` : "—"}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-black/60">
                        {f?.netExposureEUR ? `€${formatDecimal(f.netExposureEUR)}` : "—"}
                      </td>
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
