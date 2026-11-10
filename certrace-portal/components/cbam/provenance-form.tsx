"use client";

/* Provenance, attached to a single figure.

   This is the smallest unit of the whole verification build: one number, and
   next to it where it came from, which document proves it, who typed it and
   when. A verifier tracing accuracy does not ask for a spreadsheet — they
   pick one figure and ask "show me". Everything else in lib/cbam/ exists so
   this sub-form has something to describe.

   Rendered inline rather than behind a modal on purpose. A provenance dialog
   is a provenance nobody fills in. */

import * as React from "react";
import { TriangleAlert, Paperclip } from "lucide-react";
import { Select } from "@/components/controls";
import { inputClass, cn } from "@/components/ui";
import {
  PROVENANCE_HINT,
  PROVENANCE_LABEL,
  PROVENANCE_SOURCES,
  type Provenance,
  type ProvenanceSource,
} from "@/lib/cbam/activity";
import { useT } from "@/lib/i18n";

export function AssumptionChip() {
  const t = useT();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d97706]/30 bg-[#fffbeb] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-[#b45309]">
      <TriangleAlert size={11} strokeWidth={1.8} />
      {t("Assumption")}
    </span>
  );
}

export function ProvenanceForm({
  value,
  onChange,
  evidencePicker,
  compact,
}: {
  value: Provenance;
  onChange: (next: Provenance) => void;
  /** slot for the Evidence Pack picker (wired in P9) */
  evidencePicker?: React.ReactNode;
  compact?: boolean;
}) {
  const t = useT();
  const isAssumption = value.source === "ASSUMPTION";

  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        isAssumption
          ? "border-[#d97706]/30 bg-[#fffbeb]"
          : "border-black/[0.07] bg-[#faf9f7]",
        compact && "p-2.5",
      )}
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[180px] flex-1">
          <span className="mb-1.5 block text-[10px] uppercase tracking-[0.12em] text-black/40">
            {t("Where this came from")}
          </span>
          <Select
            value={value.source}
            onChange={(v) =>
              onChange({ ...value, source: v as ProvenanceSource })
            }
            options={PROVENANCE_SOURCES.map((s) => ({
              value: s,
              label: PROVENANCE_LABEL[s],
            }))}
          />
        </label>
        <label className="min-w-[180px] flex-1">
          <span className="mb-1.5 block text-[10px] uppercase tracking-[0.12em] text-black/40">
            {t("Reference")}
          </span>
          <input
            className={inputClass}
            value={value.reference ?? ""}
            placeholder={t("Invoice no. / meter id / dataset")}
            onChange={(e) => onChange({ ...value, reference: e.target.value })}
          />
        </label>
        {evidencePicker && (
          <div className="min-w-[200px] flex-1">{evidencePicker}</div>
        )}
      </div>

      <p
        className={cn(
          "mt-2 text-[11.5px] leading-relaxed",
          isAssumption ? "text-[#b45309]" : "text-black/40",
        )}
      >
        {isAssumption && (
          <TriangleAlert
            size={11}
            strokeWidth={1.8}
            className="mr-1 inline-block align-[-1px]"
          />
        )}
        {t(PROVENANCE_HINT[value.source])}
      </p>

      <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[10px] text-black/30">
        {value.evidenceFileId && <Paperclip size={10} strokeWidth={1.5} />}
        entered by {value.enteredBy || "—"} ·{" "}
        {value.enteredAt
          ? value.enteredAt.slice(0, 10).replace(/-/g, "/")
          : "—"}
      </p>
    </div>
  );
}
