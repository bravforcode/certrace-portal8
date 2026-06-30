import * as React from "react";
import { Progress, StatusLabel, cn } from "./ui";
import { SupplierRow, supplierStatusMeta } from "@/lib/data";

export function SupplierTable({
  rows,
  compact,
  showEmissions,
  actions,
}: {
  rows: SupplierRow[];
  compact?: boolean;
  showEmissions?: boolean;
  actions?: (row: SupplierRow) => React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white/70">
      {/* header */}
      <div
        className={cn(
          "grid items-center gap-3 border-b border-black/[0.06] bg-black/[0.02] px-4 py-2.5 font-mono text-[8px] uppercase tracking-[0.16em] text-black/30",
          showEmissions ? "grid-cols-[1.6fr_1fr_0.8fr_0.8fr]" : "grid-cols-[1.6fr_1fr_0.9fr]",
        )}
      >
        <span>Supplier</span>
        <span>Progress</span>
        {showEmissions && <span>tCO₂e/t</span>}
        <span>Status</span>
      </div>

      {rows.map((row, i) => {
        const meta = supplierStatusMeta[row.status];
        return (
          <div
            key={row.id}
            className={cn(
              "grid items-center gap-3 border-b border-black/[0.04] px-4 last:border-0 hover:bg-[#fafaf8]",
              compact ? "py-2.5" : "py-3.5",
              showEmissions ? "grid-cols-[1.6fr_1fr_0.8fr_0.8fr]" : "grid-cols-[1.6fr_1fr_0.9fr]",
            )}
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="flex items-center gap-2">
                {row.critical && <span className="h-1 w-1 flex-none rounded-full bg-black/40" title="CBAM-critical" />}
                <span className="truncate font-mono text-[12px] text-[#111]">{row.name}</span>
                <span className="font-mono text-[11px] text-black/25">{row.ref}</span>
              </span>
              <span className="flex items-center gap-2 text-[10px] text-black/35 font-mono">
                <span>{row.material}</span>
                {row.productionRoute && row.productionRoute !== "N/A" && (
                  <>
                    <span>·</span>
                    <span className="rounded bg-black/[0.04] px-1 text-black/45">{row.productionRoute}</span>
                  </>
                )}
              </span>
            </span>
            <span>
              <Progress value={row.progress} tone={meta.tone === "muted" ? "muted" : meta.tone} />
            </span>
            {showEmissions && (
              <span className="font-mono text-[11px] text-black/55">
                {row.emissions != null ? row.emissions.toFixed(2) : <span className="text-black/25">—</span>}
              </span>
            )}
            <span className="flex items-center justify-between gap-2">
              <StatusLabel
                tone={meta.tone}
                label={meta.label}
                pulse={row.status === "in_progress"}
                glow={row.status === "submitted"}
              />
              {actions?.(row)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
