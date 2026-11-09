"use client";

/* ════════════════════════════════════════════════════════════
   CARBON & COST — WHAT THE COST RESTS ON

   Every cost on the tab is built from six things, and four of them are not the
   plant's: the certificate price, the free-allocation phase-out (CBAM factor),
   the default mark-up and the exchange rate. They are shown here, once, where a
   reader who doubts a figure goes first — and the two the exporter may need to
   change (the price they plan against, the rate they budget in) are typed here
   and kept in the same stores the rest of the portal reads, so the dashboard
   and this tab cannot use different prices.

   Two simplifications are stated rather than hidden: the cross-sectoral
   correction factor is taken as 1, and a bought-in precursor's own free
   allocation is not netted off.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { AutoSaveBadge, NumberInput, cn, useAutoSave } from "@/components/ui";
import { Panel, TH } from "@/components/insight/kit";
import { useT } from "@/lib/i18n";
import { cbamFactor } from "@/lib/cbam/eu-rates";
import { getExchangeRate, getExtraRates, removeCertificatePrice, saveCertificatePrice, saveExchangeRate, saveExtraRates } from "@/lib/cbam/cost-exposure";
import type { CostEnv, PricedRow } from "@/lib/cbam/carbon-cost-model";
import type { useMoney } from "./money";

type Money = ReturnType<typeof useMoney>;

type Draft = { thb?: number; cny?: number; inr?: number; prices: Record<number, number | undefined> };

export function AssumptionsCard({ rows, env, money, editable, onSaved }: { rows: PricedRow[]; env: CostEnv; money: Money; editable: boolean; onSaved: () => void }) {
  const t = useT();
  const years = [...new Set(rows.map((r) => r.facts.year))].filter((y) => y >= 2026).sort((a, b) => a - b);
  const [draft, setDraft] = React.useState<Draft>(() => ({
    thb: env.rates.THB,
    cny: env.rates.CNY,
    inr: env.rates.INR,
    prices: Object.fromEntries(years.map((y) => [y, env.certificatePrice(y)?.eurPerTonne])),
  }));

  /* New years appear when the scope widens; they start from what the portal already uses. */
  React.useEffect(() => {
    setDraft((d) => {
      const prices = { ...d.prices };
      let changed = false;
      for (const y of years) {
        if (!(y in prices)) {
          prices[y] = env.certificatePrice(y)?.eurPerTonne;
          changed = true;
        }
      }
      return changed ? { ...d, prices } : d;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [years.join(","), env]);

  const save = (d: Draft) => {
    if (!editable) return;
    const today = new Date().toISOString().slice(0, 10);
    if (d.thb != null && d.thb > 0 && d.thb !== getExchangeRate().eurToThb) saveExchangeRate({ eurToThb: d.thb, asOf: today });
    const extra = getExtraRates();
    const cny = d.cny != null && d.cny > 0 ? d.cny : extra.eurToCny;
    const inr = d.inr != null && d.inr > 0 ? d.inr : extra.eurToInr;
    if (cny !== extra.eurToCny || inr !== extra.eurToInr) saveExtraRates({ eurToCny: cny, eurToInr: inr, asOf: today });
    for (const [ys, v] of Object.entries(d.prices)) {
      const y = Number(ys);
      const now = env.certificatePrice(y)?.eurPerTonne;
      if (v == null || !(v > 0)) {
        removeCertificatePrice(`manual-${y}`);
      } else if (v !== now) {
        saveCertificatePrice({ id: `manual-${y}`, periodLabel: `${y}-manual`, priceEurPerTco2e: v, publishedDate: `${y}-12-31` });
      }
    }
    onSaved();
  };
  const { status, savedAt } = useAutoSave(draft, save, { delayMs: 600, enabled: editable });

  const assumed = rows.filter((r) => r.costActualEur != null && r.costBasis === "produced").length;
  const claimedRows = rows.filter((r) => r.facts.homePrice).length;
  const markupOf = (y: number) => rows.find((r) => r.facts.year === y && r.defaultMarkup != null)?.defaultMarkup ?? null;

  return (
    <Panel
      title={t("What the cost rests on")}
      sub={t("Change a price here and every page of the portal uses it")}
      action={editable ? <AutoSaveBadge status={status} savedAt={savedAt} /> : undefined}
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div className="min-w-0">
      {years.length === 0 ? (
        <p className="text-[12.5px] text-black/45">{t("CBAM certificates start with 2026 imports.")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[440px] border-collapse text-left text-[12.5px]">
            <thead>
              <tr>
                <th className={cn("pb-2 text-left", TH)}>{t("Year")}</th>
                <th className={cn("pb-2 text-left", TH)}>{t("Certificate price")}</th>
                <th className={cn("pb-2 text-right", TH)}>{t("Free allocation left")}</th>
                <th className={cn("pb-2 text-right", TH)}>{t("Default mark-up")}</th>
              </tr>
            </thead>
            <tbody>
              {years.map((y) => {
                const f = cbamFactor(y);
                const mk = markupOf(y);
                const published = env.certificatePrice(y);
                return (
                  <tr key={y} className="border-t border-black/[0.06]">
                    <td className="py-3 pr-3 tabular-nums text-black/75">{y}</td>
                    <td className="py-3 pr-3">
                      <div className="w-[150px]">
                        <NumberInput
                          value={draft.prices[y]}
                          onChange={(v) => setDraft((d) => ({ ...d, prices: { ...d.prices, [y]: v } }))}
                          min={0}
                          unit="€/tCO₂e"
                          disabled={!editable}
                          ariaLabel={t("Certificate price {year}", { year: y })}
                        />
                      </div>
                      {published && <div className="mt-1 text-[11px] text-black/35">{published.label}</div>}
                    </td>
                    <td className="py-3 text-right tabular-nums text-black/70">{f != null ? money.pct(f * 100, 1) : "—"}</td>
                    <td className="py-3 text-right tabular-nums text-black/70">{mk != null ? `+${money.pct(mk * 100, 0)}` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 border-t border-black/[0.06] pt-4">
        <div className="grid grid-cols-3 gap-3">
          {([
            ["thb", "฿ / €", draft.thb],
            ["cny", "¥ / €", draft.cny],
            ["inr", "₹ / €", draft.inr],
          ] as const).map(([k, unit, v]) => (
            <label key={k} className="block min-w-0">
              <span className="mb-1.5 block text-[12px] text-black/55">{t("Exchange rate")} · {k.toUpperCase()}</span>
              <NumberInput value={v} onChange={(n) => setDraft((d) => ({ ...d, [k]: n }))} min={0} unit={unit} disabled={!editable} ariaLabel={`${t("Exchange rate")} ${k.toUpperCase()}`} />
            </label>
          ))}
        </div>
        <p className="mt-2 text-[11.5px] leading-snug text-black/40">{t("Used to show every euro figure in baht, yuan and rupees.")}</p>
      </div>
      </div>
      <ul className="space-y-2.5 self-start rounded-xl border border-black/[0.07] bg-[#faf9f7] p-4 text-[12px] leading-relaxed text-black/50">
        <li>{t("The cross-sectoral correction factor is taken as 1: the Commission has not published it in the rules this was built from.")}</li>
        <li>{t("A bought-in precursor's own free allocation is not netted off, so a complex good's cost is never shown lower than it is.")}</li>
        {assumed > 0 && <li className="text-[#92400e]">{assumed === 1 ? t("1 product has no EU volume entered, so all the tonnes made are assumed shipped to the EU.") : t("{n} products have no EU volume entered, so all the tonnes made are assumed shipped to the EU.", { n: assumed })}</li>}
        {claimedRows > 0 && <li>{claimedRows === 1 ? t("A carbon price paid at home is recorded for 1 product. It is shown as claimed and never subtracted.") : t("A carbon price paid at home is recorded for {n} products. It is shown as claimed and never subtracted.", { n: claimedRows })}</li>}
      </ul>
      </div>
    </Panel>
  );
}
