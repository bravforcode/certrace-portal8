"use client";

/* ════════════════════════════════════════════════════════════
   WIDGET E — COST AVOIDANCE CALCULATOR (core differentiator)

   The single largest, most prominent number on the dashboard. See
   lib/cbam/cost-exposure.ts for the five-step formula and
   lib/__tests__/cost-exposure.test.ts for the pinned worked example this
   widget's numbers are built to reproduce exactly.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, HelpTip, cn } from "@/components/ui";
import { CountUp } from "./count-up";
import type { CostAvoidanceResult } from "@/lib/cbam/cost-exposure";
import { useT } from "@/lib/i18n";

/* The one warm accent color on the page, reserved for money — distinct from
   the app's existing amber "warn" tone so a savings figure is never read as
   a warning. Used only here and nowhere else. */
const MONEY = "#A6742C";

const thb = (n: number) => `฿${Math.round(n).toLocaleString("en-US")}`;
const eur = (n: number) => `€${Math.round(n).toLocaleString("en-US")}`;

function EmptyCallToAction({ result }: { result: Exclude<CostAvoidanceResult, { status: "ok" }> }) {
  const t = useT();
  const cta =
    result.status === "no_export_volume"
      ? { label: "Enter export volume", href: "/workspaces" }
      : result.status === "not_computable"
        ? { label: "Enter monthly data", href: "/workspaces" }
        : result.status === "no_default"
          ? { label: "Check the product category", href: "/workspaces" }
          : result.status === "no_price"
            ? { label: "Add a certificate price", href: "/settings" }
            : { label: "Confirm the phase-in rate", href: "/settings" };
  return (
    <div className="mt-3">
      <p className="text-[15px] text-black/50">{t(result.reason)}</p>
      <Link href={cta.href} className="mt-3 inline-block rounded-lg border border-black/15 px-4 py-2 text-[12px] uppercase tracking-[0.08em] text-black/60 hover:border-black/30 hover:text-black">
        {t(cta.label)} →
      </Link>
    </div>
  );
}

export function CostAvoidanceWidget({ result, year }: { result: CostAvoidanceResult; year: number }) {
  const t = useT();
  const [expanded, setExpanded] = React.useState(false);

  return (
    <Card className="p-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-[family-name:var(--font-plex)] text-lg font-light tracking-tight text-[#111]">{t("Cost avoidance, {year}", { year })}</h2>
        <span className="text-[11px] uppercase tracking-[0.08em] text-black/35">{t("Verified actual vs. EU default value")}</span>
      </div>

      {result.status !== "ok" ? (
        <EmptyCallToAction result={result} />
      ) : (
        <>
          <div className="mt-3">
            <div className="font-[family-name:var(--font-plex)] text-[56px] font-light leading-none tracking-tight sm:text-[64px]" style={{ color: MONEY }}>
              <CountUp value={result.savingsThb} format={thb} />
            </div>
            <div className="mt-1.5 text-[15px] text-black/40">
              <CountUp value={result.savingsEur} format={eur} /> {t("avoided this year, so far")}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-black/[0.06] pt-4">
            <span className="text-[13px] text-black/50">
              {t("At full phase-in (2034 rate):")} <span className="font-medium text-black/75">{thb(result.savingsAtFullPhaseInThb)}</span>{" "}
              <span className="text-black/35">({eur(result.savingsAtFullPhaseInEur)})</span>
            </span>
            <HelpTip title={t("What is phase-in?")}>
              <p>
                CBAM certificates are only partly payable while the mechanism ramps up — in {year}, exporters actually owe just{" "}
                {result.steps.payableSharePercent}% of the theoretical certificate cost. That share rises every year until it reaches 100% in 2034. The
                figure above shows what today&rsquo;s savings would be worth at that full rate — the trajectory, not just this year&rsquo;s snapshot.
              </p>
            </HelpTip>
          </div>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-4 flex items-center gap-1.5 text-[12px] uppercase tracking-[0.08em] text-black/40 hover:text-black"
          >
            {expanded ? <ChevronUp size={13} strokeWidth={1.5} /> : <ChevronDown size={13} strokeWidth={1.5} />}
            See how this is calculated
          </button>

          {expanded && (
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl border border-black/[0.07] bg-[#faf9f7] p-4 sm:grid-cols-3">
              {[
                ["1 · EU default SEE", `${result.steps.seeDefault.toFixed(4)} tCO₂e/t`],
                ["2 · Your actual SEE", `${result.steps.seeActual.toFixed(4)} tCO₂e/t`],
                ["→ SEE gap", `${result.steps.seeGap.toFixed(4)} tCO₂e/t`],
                ["3 · Export volume", `${result.steps.exportVolumeTonnes.toLocaleString()} t`],
                ["4 · Certificate price", `€${result.steps.certificatePriceEurPerTco2e} (${result.steps.certificatePricePeriodLabel})`],
                ["5 · Payable share", `${result.steps.payableSharePercent}%`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[10.5px] uppercase tracking-[0.08em] text-black/40">{k}</dt>
                  <dd className="mt-0.5 font-mono text-[13px] text-black/75">{v}</dd>
                </div>
              ))}
              <div className="col-span-full mt-1 border-t border-black/[0.06] pt-3 text-[12px] text-black/50">
                gap × volume × price × payable share = {result.steps.seeGap.toFixed(4)} × {result.steps.exportVolumeTonnes.toLocaleString()} × €
                {result.steps.certificatePriceEurPerTco2e} × {result.steps.payableSharePercent}% = <span className="font-medium text-black/75">{eur(result.savingsEur)}</span>
              </div>
            </dl>
          )}
        </>
      )}
    </Card>
  );
}

export { MONEY as COST_AVOIDANCE_ACCENT };
