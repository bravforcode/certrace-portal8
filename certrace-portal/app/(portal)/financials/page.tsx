"use client";

import { useState, useEffect } from "react";
import { TrendingDown } from "lucide-react";
import { Card, PageHeader, Stat, Eyebrow, Chip } from "@/components/ui";
import { DECLARATIONS, ORG } from "@/lib/data";
import { fetchEcbThbEur, FALLBACK_THB_EUR_RATE } from "@/lib/fx";
import { loadExporterState, rollup } from "@/lib/exporter-review";
import { decimalToString, decimal } from "@/lib/mrv";

export default function FinancialsPage() {
  const [rate, setRate] = useState(FALLBACK_THB_EUR_RATE);

  useEffect(() => {
    fetchEcbThbEur().then(setRate);
  }, []);

  const decl = DECLARATIONS[0];
  if (!decl) return null;

  const exporter = loadExporterState(decl.id);
  const roll = rollup(decl, exporter);
  const approved = roll.submissions.filter((s) => s.lifecycle === "approved");

  const chargeableTCO2e = roll.reviewedEmissions || "0";
  const pricePerTonne = "55";
  const liabilityEUR = decimalToString(
    decimal(chargeableTCO2e).times(pricePerTonne).div(rate.thbPerEur)
  );

  const getLiabilityTone = (amount: string) => {
    const num = parseFloat(amount);
    if (num < 50000) return "ok";
    if (num < 150000) return "warn";
    return "err";
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Financial"
        title="Carbon liability forecast."
        lead="Annual CBAM certificate cost estimate for 2026 based on EU ETS reference price."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-5">
          <Stat value={chargeableTCO2e} label="Chargeable tCO2e" />
        </Card>
        <Card className="p-5">
          <Stat value={`€${pricePerTonne}`} label="Price per tonne" />
        </Card>
        <Card className="p-5">
          <Stat value={`€${liabilityEUR}`} label="Estimated exposure" />
        </Card>
        <Card className="p-5">
          <Stat value={rate.stale ? "STALE" : "LIVE"} label="FX rate status" />
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-black/35">
        <span>Annual 2026 —</span>
        <Chip tone="muted">THB {rate.thbPerEur} / EUR</Chip>
        <Chip tone={rate.stale ? "warn" : "ok"}>
          {rate.stale ? "Hardcoded fallback (ECB API pending)" : "Live ECB feed"}
        </Chip>
      </div>

      <div className="space-y-4">
        <Eyebrow>Supplier breakdown</Eyebrow>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10">
                <th className="text-left py-2 px-3 text-black/50 font-normal">Supplier</th>
                <th className="text-right py-2 px-3 text-black/50 font-normal">tCO2e</th>
                <th className="text-right py-2 px-3 text-black/50 font-normal">EUR exposure</th>
                <th className="text-right py-2 px-3 text-black/50 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {approved.map((sub) => {
                const exposure = decimalToString(
                  decimal(sub.totalTCO2e).times(pricePerTonne).div(rate.thbPerEur)
                );
                const tone = getLiabilityTone(exposure);
                return (
                  <tr key={sub.supplier.id} className="border-b border-black/5 hover:bg-black/[0.02]">
                    <td className="py-3 px-3 text-black/70">{sub.supplier.name}</td>
                    <td className="py-3 px-3 text-right font-mono text-black/60">{sub.totalTCO2e}</td>
                    <td className="py-3 px-3 text-right font-mono text-black/60">€{exposure}</td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          tone === "ok"
                            ? "bg-green-100 text-green-700"
                            : tone === "warn"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        <TrendingDown size={12} />
                        {tone === "ok" ? "Low" : tone === "warn" ? "Medium" : "High"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
