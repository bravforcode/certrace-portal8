"use client";

import * as React from "react";
import Link from "next/link";
import { Progress, StatusLabel, cn } from "./ui";
import { SupplierRow, supplierStatusMeta, supplierSlug } from "@/lib/data";

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
                {row.emissions != null ? row.emissions.toFixed(2) : <span className="text-black/25">—</span>}
              </span>
            )}
            <span className="flex items-center justify-between gap-2" onClick={(e) => {
              if (actions) {
                // Prevent navigation if an action was clicked (not perfect without tracking exact target, but actions usually are standalone)
                // We'll just let the Link handle the click for now unless the user clicks a specific button inside.
              }
            }}>
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
  );
}
