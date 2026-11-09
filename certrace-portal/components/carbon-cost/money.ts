"use client";

import * as React from "react";
import { useFormat } from "@/lib/i18n";
import { CURRENCIES, type Currency, type Rates } from "@/lib/cbam/carbon-cost-model";

export const CURRENCY_SYMBOL: Record<Currency, string> = { THB: "฿", EUR: "€", CNY: "¥", INR: "₹" };

/** Money and tonnes, in the language and currency on screen. Everything is held in euros (the certificate price is) and converted here,
    once, so a figure and the figure beside it can never use different rates. */
export function useMoney(currency: Currency, rates: Rates) {
  const { number } = useFormat();
  return React.useMemo(() => {
    const sym = CURRENCY_SYMBOL[currency];
    const conv = (eur: number) => eur * rates[currency];
    const ok = (n: number | null | undefined): n is number => n != null && Number.isFinite(n);
    const fromThb = (thb: number) => (thb / rates.THB) * rates[currency];
    return {
      sym,
      conv,
      fromThb,
      full: (eur: number | null | undefined) => (ok(eur) ? `${sym}${number(Math.round(conv(eur)))}` : "—"),
      compact: (eur: number | null | undefined) => (ok(eur) ? `${sym}${number(conv(eur), { notation: "compact", maximumFractionDigits: 1 })}` : "—"),
      /** a ฿ amount typed by the exporter (per tonne, per kWh), shown in the chosen currency */
      thb: (v: number | null | undefined, dp = 0) =>
        ok(v) ? `${sym}${number(fromThb(v), { minimumFractionDigits: dp, maximumFractionDigits: dp })}` : "—",
      t: (n: number | null | undefined, dp = 0) => (ok(n) ? number(n, { minimumFractionDigits: dp, maximumFractionDigits: dp }) : "—"),
      tCompact: (n: number | null | undefined) => (ok(n) ? number(n, { notation: "compact", maximumFractionDigits: 1 }) : "—"),
      pct: (n: number | null | undefined, dp = 0) => (ok(n) ? `${number(n, { minimumFractionDigits: dp, maximumFractionDigits: dp })}%` : "—"),
    };
  }, [currency, rates, number]);
}

/** "Mar 26" — the month as a short axis label, with the year only when the chart spans more than one. */
export function shortMonth(ym: string, locale: string, withYear: boolean): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  const mon = d.toLocaleDateString(locale, { month: "short" });
  return withYear ? `${mon} ${String(y).slice(2)}` : mon;
}

const CURRENCY_KEY = "certrace:carbon-cost-currency";

/** The currency the reader chose — kept in this browser, shared by every page that shows money. */
export function usePersistedCurrency(): [Currency, (c: Currency) => void] {
  const [c, setC] = React.useState<Currency>("THB");
  React.useEffect(() => {
    try {
      const v = window.localStorage.getItem(CURRENCY_KEY);
      if (v && (CURRENCIES as string[]).includes(v)) setC(v as Currency);
    } catch {
      /* private window */
    }
  }, []);
  return [
    c,
    (next) => {
      setC(next);
      try {
        window.localStorage.setItem(CURRENCY_KEY, next);
      } catch {
        /* private window */
      }
    },
  ];
}
