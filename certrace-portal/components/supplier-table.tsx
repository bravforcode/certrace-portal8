"use client";

import * as React from "react";
import Link from "next/link";
import { Progress, StatusLabel, cn } from "./ui";
import { SupplierRow, supplierStatusMeta, supplierSlug } from "@/lib/data";
import { formatDecimal } from "@/lib/workflow-measurements";

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
  // `scroll-x-contain` (globals.css): the min-w-[520px] below is a width
  // floor, and without paint containment it stretches the mobile layout
  // viewport and zooms the whole page out.
  return (
    <div className="overflow-x-auto scroll-x-contain rounded-2xl border border-black/[0.08] bg-white/70">
      <div className="min-w-[520px]">
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

      {rows.map((row) => {
        const meta = supplierStatusMeta[row.status];
        return (
          <Link
            key={row.id}
            href={`/suppliers/${supplierSlug(row.name)}`}
            className={cn(
              "grid items-center gap-3 border-b border-black/[0.04] px-4 last:border-0 hover:bg-[#fafaf8] cursor-pointer",
              compact ? "py-2.5" : "py-3.5",
              showEmissions ? "grid-cols-[1.6fr_1fr_0.8fr_0.8fr]" : "grid-cols-[1.6fr_1fr_0.9fr]",
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              {row.critical && <span className="h-1 w-1 flex-none rounded-full bg-black/40" title="CBAM-critical" />}
              <span className="truncate font-mono text-[12px] text-black/60 hover:text-black">{row.name}</span>
              <span className="font-mono text-[11px] text-black/25">{row.ref}</span>
            </span>
            <span>
              <Progress value={row.progress} tone={meta.tone === "muted" ? "muted" : meta.tone} />
            </span>
            {showEmissions && (
              <span className="font-mono text-[11px] text-black/55">
                {row.emissions != null ? formatDecimal(row.emissions) : <span className="text-black/25">—</span>}
              </span>
            )}
            <span className="flex items-center justify-between gap-2">
              <StatusLabel
                tone={meta.tone}
                label={meta.label}
                pulse={row.status === "in_progress"}
                glow={row.status === "submitted"}
              />
              <div onClick={(e) => e.preventDefault()}>{actions?.(row)}</div>
            </span>
          </Link>
        );
      })}
      </div>
    </div>
  );
}
