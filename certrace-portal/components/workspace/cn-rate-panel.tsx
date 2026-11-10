"use client";

/* ════════════════════════════════════════════════════════════
   WHAT A CN CODE LEADS TO

   The panel an exporter reads after picking a code, and the one a workspace's
   Overview keeps open: the EU's emission rate for that good in the country it
   is made in, what the CBAM free allocation takes off it, and what a tonne of
   the remainder costs at the latest published certificate price.

   It is the DEFAULT-VALUE exposure — what the buyer is charged when no verified
   figure is supplied — and the panel says so in its own heading rather than
   leaving "cost" to be read as a forecast. See lib/cbam/eu-rates.ts for where
   every number comes from and which one is not applied yet (the CSCF).

   Thai values are bundled; for any other country the panel waits for the
   table to load and shows that, rather than a stale or a wrong figure.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Info } from "lucide-react";
import { Card, cn } from "@/components/ui";
import {
  countryNameShown as countryName,
  type CatalogProduct,
} from "@/lib/config";
import {
  cbamFactor,
  defaultMarkup,
  rateSheet,
  rowForAnyCn,
} from "@/lib/cbam/eu-rates";
import { ROUTE_LETTER_LABEL } from "@/lib/cbam/routes";
import { useCertificatePrice, useDefaultsReady } from "@/lib/cbam/use-rates";
import { useT } from "@/lib/i18n";

const f3 = (v: number | null | undefined) =>
  v == null || !Number.isFinite(v)
    ? "—"
    : v.toLocaleString("en-GB", {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      });
const f2 = (v: number | null | undefined) =>
  v == null || !Number.isFinite(v)
    ? "—"
    : v.toLocaleString("en-GB", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
const pct = (v: number) => `${Math.round(v * 1000) / 10}%`;

function Tile({
  label,
  value,
  sub,
  strong,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-3.5",
        strong ? "border-black/20" : "border-black/[0.07]",
      )}
    >
      <div className="text-[10px] uppercase tracking-[0.1em] text-black/40">
        {label}
      </div>
      <div className="mt-1.5 font-[family-name:var(--font-plex)] text-[22px] font-light leading-none tracking-tight text-[#111] tabular-nums">
        {value}
      </div>
      {sub && (
        <div className="mt-1.5 text-[11px] leading-snug text-black/40">
          {sub}
        </div>
      )}
    </div>
  );
}

export function CnRatePanel({
  product,
  country = "TH",
  year,
  routeLetter,
  className,
}: {
  product: Pick<CatalogProduct, "cnCode" | "category" | "name">;
  country?: string;
  year: number;
  /** the route letter the exporter chose; the EU's own default route when omitted */
  routeLetter?: string;
  className?: string;
}) {
  const t = useT();
  const ready = useDefaultsReady(country);
  const { price, eurToThb } = useCertificatePrice(Math.max(2026, year));
  const where = countryName(country);

  const sheet = React.useMemo(
    () =>
      ready
        ? rateSheet({
            cn: product.cnCode,
            country,
            year,
            routeLetter,
            price: price?.priceEurPerTco2e ?? null,
          })
        : null,
    [ready, product.cnCode, country, year, routeLetter, price],
  );
  const row = rowForAnyCn(product.cnCode);

  if (!ready) {
    return (
      <Card warm className={cn("p-5 text-[13px] text-black/45", className)}>
        {t("Loading the EU default values for {country}…", { country: where })}
      </Card>
    );
  }
  if (!sheet || !row) {
    return (
      <Card warm className={cn("p-5 text-[13px] text-black/45", className)}>
        {t("The EU publishes no default value for this good.")}
      </Card>
    );
  }

  const years = [2026, 2027, 2028].map((y) => {
    const s = rateSheet({
      cn: product.cnCode,
      country,
      year: y,
      routeLetter,
      price: price?.priceEurPerTco2e ?? null,
    });
    return { y, s };
  });
  const routeText = sheet.euRoute
    ? `${t(ROUTE_LETTER_LABEL[sheet.euRoute] ?? sheet.euRoute)} (${sheet.euRoute})`
    : t("a route-independent value");

  return (
    <Card warm className={cn("p-5", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div>
          <div className="font-pixel text-[11px] uppercase tracking-[0.16em] text-black/40">
            {t("What this CN code leads to")}
          </div>
          <div className="mt-1 text-[13px] text-black/70">
            <span className="font-mono text-[12px] text-black/55">
              CN {product.cnCode}
            </span>{" "}
            · {where} · {sheet.year}
          </div>
        </div>
        <div className="text-[11px] text-black/40">
          {t(
            "The default-value exposure — what the buyer is charged if no verified figure is supplied.",
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          strong
          label={t("EU default value")}
          value={
            <>
              {f3(sheet.defaultValue)}{" "}
              <span className="text-[12px] text-black/40">tCO₂e/t</span>
            </>
          }
          sub={t("{base} + {markup} mark-up · built on {route}", {
            base: f3(sheet.baseValue),
            markup: pct(sheet.markup),
            route: routeText,
          })}
        />
        <Tile
          label={t("Free-allocation offset")}
          value={
            <>
              {f3(sheet.freeAllocation)}{" "}
              <span className="text-[12px] text-black/40">tCO₂e/t</span>
            </>
          }
          sub={
            sheet.benchmark.default != null && sheet.cbamFactor != null
              ? t("{factor} × benchmark {bm}", {
                  factor: pct(sheet.cbamFactor),
                  bm: f3(sheet.benchmark.default),
                })
              : t("No benchmark for this route")
          }
        />
        <Tile
          label={t("Chargeable per tonne")}
          value={
            <>
              {f3(sheet.chargeable)}{" "}
              <span className="text-[12px] text-black/40">tCO₂e/t</span>
            </>
          }
          sub={t("default value less the offset")}
        />
        <Tile
          label={t("Indicative cost per tonne")}
          value={
            sheet.costPerTonne != null ? <>€{f2(sheet.costPerTonne)}</> : "—"
          }
          sub={
            sheet.costPerTonne != null && price
              ? t("≈ ฿{thb} · at €{price} per tCO₂e ({period})", {
                  thb: Math.round(sheet.costPerTonne * eurToThb).toLocaleString(
                    "en-GB",
                  ),
                  price: f2(price.priceEurPerTco2e),
                  period: price.periodLabel,
                })
              : t("No certificate price on file yet")
          }
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-black/[0.07] bg-white">
        <table className="w-full min-w-[460px] border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-black/[0.06] text-left text-[10px] uppercase tracking-[0.1em] text-black/40">
              <th className="px-3.5 py-2 font-normal">{t("Reporting year")}</th>
              <th className="px-3.5 py-2 text-right font-normal">
                {t("Default value")}
              </th>
              <th className="px-3.5 py-2 text-right font-normal">
                {t("Mark-up")}
              </th>
              <th className="px-3.5 py-2 text-right font-normal">
                {t("CBAM factor")}
              </th>
              <th className="px-3.5 py-2 text-right font-normal">
                {t("Chargeable")}
              </th>
            </tr>
          </thead>
          <tbody>
            {years.map(({ y, s }) => (
              <tr
                key={y}
                className={cn(
                  "border-b border-black/[0.04] last:border-0",
                  y === Math.max(2026, year) && "bg-[#faf9f7]",
                )}
              >
                <td className="px-3.5 py-2 font-mono text-black/60">
                  {y === 2028 ? "2028 +" : y}
                </td>
                <td className="px-3.5 py-2 text-right font-mono tabular-nums text-black/75">
                  {f3(s?.defaultValue)}
                </td>
                <td className="px-3.5 py-2 text-right font-mono tabular-nums text-black/50">
                  +{pct(defaultMarkup(row.sector, y))}
                </td>
                <td className="px-3.5 py-2 text-right font-mono tabular-nums text-black/50">
                  {cbamFactor(y) != null ? pct(cbamFactor(y)!) : "—"}
                </td>
                <td className="px-3.5 py-2 text-right font-mono tabular-nums text-black/75">
                  {f3(s?.chargeable)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="mt-3 space-y-1.5 text-[11.5px] leading-relaxed text-black/45">
        {sheet.notes.map((n) => (
          <li key={n} className="flex items-start gap-2">
            <Info
              size={12}
              strokeWidth={1.5}
              className="mt-[3px] flex-none text-black/30"
            />
            <span>{t(n)}</span>
          </li>
        ))}
        <li className="flex items-start gap-2">
          <Info
            size={12}
            strokeWidth={1.5}
            className="mt-[3px] flex-none text-black/30"
          />
          <span>
            {t(
              "Sources: default values — Implementing Regulation (EU) 2025/2621, Annex I; benchmarks — 2025/2620; phase-in — Article 10a of the ETS Directive; price — Article 21 of Regulation 2023/956.",
            )}
          </span>
        </li>
      </ul>
    </Card>
  );
}
