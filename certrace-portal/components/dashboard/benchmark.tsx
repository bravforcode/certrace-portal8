"use client";

/* ════════════════════════════════════════════════════════════
   WIDGET I — COUNTRY DEFAULT BENCHMARK COMPARISON

   Written to be SCREENSHOT-ABLE: one self-contained sentence an exporter
   can lift straight into a buyer conversation or a pitch deck. That is why
   the sentence names the facility, the percentage and the category in one
   line and does not depend on anything else on the page to make sense.
   ════════════════════════════════════════════════════════════ */

import { Card, cn } from "@/components/ui";
import type { BenchmarkOutperformance } from "@/lib/cbam/see-trend";
import { useT } from "@/lib/i18n";

export function BenchmarkWidget({ benchmarks }: { benchmarks: BenchmarkOutperformance[] }) {
  const t = useT();
  const usable = benchmarks.filter((b) => b.outperformancePercent > 0);

  return (
    <Card className="p-6">
      <h2 className="font-[family-name:var(--font-plex)] text-lg font-light tracking-tight text-[#111]">{t("Against the default")}</h2>

      {benchmarks.length === 0 ? (
        <p className="mt-3 text-[13px] text-black/40">{t("Enter monthly data to compare your facility against the EU default value.")}</p>
      ) : usable.length === 0 ? (
        <p className="mt-3 text-[13px] text-black/50">
          {t("No product is currently running below its default emissions factor. The comparison appears here once one does.")}
        </p>
      ) : (
        <ul className="mt-3 space-y-4">
          {usable.map((b) => (
            <li key={b.workspace.id}>
              <p className="text-[15px] leading-relaxed text-black/75">
                Your facility runs{" "}
                <span className="font-[family-name:var(--font-plex)] text-[22px] font-light tracking-tight text-[#047857]">
                  {b.outperformancePercent.toFixed(1)}%
                </span>{" "}
                below the default emissions factor for {b.category}.
              </p>
              <p className="mt-1 font-mono text-[11px] text-black/35">
                {t(b.workspace.productName)} · {b.seeActual.toFixed(4)} vs {b.seeDefault.toFixed(4)} tCO₂e/t
              </p>
            </li>
          ))}
        </ul>
      )}

      {benchmarks.length > 0 && (
        <p className={cn("mt-4 border-t border-black/[0.06] pt-3 text-[11px] leading-relaxed text-black/35")}>
          {t("Compared against Certrace’s indicative category reference values, not a filed figure — see the note in the default-value table.")}
        </p>
      )}
    </Card>
  );
}
