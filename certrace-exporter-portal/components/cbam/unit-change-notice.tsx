"use client";

/* The electricity unit change, explained once, per declaration.

   `elec-consumed` used to be collected per tonne and is now collected as an
   absolute total for the reporting period. Values already in the store carry
   no unit tag, so they are read as the old convention and converted — which
   means a number on screen can change without anyone touching it. A silent
   reinterpretation of a filed figure is indistinguishable from a bug, so the
   exporter sees exactly what was stored, what it is now read as, and what it
   makes the indirect figure, and confirms before moving on.

   Shown only while there is untagged data and the exporter hasn't dismissed
   it. Anything entered through the app since the change is already tagged and
   never appears here. */

import * as React from "react";
import { Zap, X } from "lucide-react";
import { Card, Button, Eyebrow, cn } from "@/components/ui";
import { acknowledgeMigration, migrationAcknowledged, type ElectricityMigrationRow } from "@/lib/cbam/electricity-migration";
import { useT } from "@/lib/i18n";

export function UnitChangeNotice({
  declId,
  rows,
}: {
  declId: string;
  rows: (ElectricityMigrationRow & { supplierName?: string })[];
}) {
  const t = useT();
  const [dismissed, setDismissed] = React.useState(true);

  React.useEffect(() => {
    setDismissed(migrationAcknowledged(declId));
  }, [declId]);

  if (dismissed || rows.length === 0) return null;

  const dismiss = () => {
    acknowledgeMigration(declId);
    setDismissed(true);
  };

  return (
    <Card warm className="border-[#d97706]/25 p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-xl border border-[#d97706]/25 text-[#b45309]">
          <Zap size={15} strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <Eyebrow className="text-[#b45309]">{t("Unit change · electricity")}</Eyebrow>
          <p className="mt-2 text-sm leading-relaxed text-black/60">
            {t("Electricity is now collected as an")} <span className="text-black/80">{t("absolute total for the reporting period")}</span>{t(", not per tonne. The per-tonne figure is derived once, inside the calculation, by dividing by your output — previously it was divided a second time, which understated indirect emissions.")}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-black/45">
            {rows.length === 1 ? "One figure was" : `${rows.length} figures were`} entered before this change and {rows.length === 1 ? "is" : "are"} being
            read as MWh per tonne. Check {rows.length === 1 ? "it" : "them"} below, then re-enter{" "}
            {rows.length === 1 ? "it" : "them"} as a period total on the supplier form.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b border-black/[0.07] text-[10px] uppercase tracking-[0.12em] text-black/35">
                  <th className="py-2 pr-4 font-normal">{t("Good")}</th>
                  <th className="py-2 pr-4 font-normal">{t("Stored")}</th>
                  <th className="py-2 pr-4 font-normal">{t("Read as")}</th>
                  <th className="py-2 pr-4 font-normal">{t("Output")}</th>
                  <th className="py-2 font-normal">{t("Indirect")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.supplierName ?? ""}-${r.productId}`} className="border-b border-black/[0.04] last:border-0 align-top">
                    <td className="py-2.5 pr-4 text-[13px] text-black/70">
                      {r.productName}
                      {r.supplierName && <span className="block text-[11px] text-black/35">{r.supplierName}</span>}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-[12px] text-black/55">{r.beforeMWhPerTonne} MWh/t</td>
                    <td className={cn("py-2.5 pr-4 font-mono text-[12px]", r.blockedOnOutput ? "text-[#b45309]" : "text-black/70")}>
                      {r.afterMWhAbsolute != null ? `${r.afterMWhAbsolute.toLocaleString("en-US")} MWh` : "needs output"}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-[12px] text-black/45">
                      {r.outputTonnes != null ? `${r.outputTonnes.toLocaleString("en-US")} t` : "—"}
                    </td>
                    <td className="py-2.5 font-mono text-[12px] text-black/55">
                      {r.indirectPerTonne != null ? `${r.indirectPerTonne.toFixed(4)} tCO₂e/t` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button size="sm" variant="secondary" className="bg-white" onClick={dismiss}>
              {t("Understood")}
            </Button>
            <span className="text-[11px] text-black/35">{t("Dismissing does not change any stored value.")}</span>
          </div>
        </div>
        <button onClick={dismiss} aria-label={t("Dismiss")} className="flex-none text-black/25 hover:text-black/60">
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>
    </Card>
  );
}
