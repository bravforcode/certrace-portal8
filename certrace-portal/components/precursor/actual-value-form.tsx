"use client";

/* ════════════════════════════════════════════════════════════
   THE PRECURSOR OPERATOR'S SIDE OF A REQUEST FOR AN ACTUAL VALUE

   Opened from /p/<token> when the exporter chose "actual" for this direct
   precursor. One box asks for the FINAL data of the reporting year — nothing
   is generated for the precursor and nothing is collected month by month.

   It shows what the exporter has already stated (the good, where it came from)
   so the operator is answering about the right thing, and then asks only for
   what the exporter cannot know: the operator and installation, the reporting
   period, the specific embedded emissions, the sector parameters, the
   verifier's details and the verification report. Every field says which item
   of Annex IV to Implementing Regulation (EU) 2025/2547 it feeds, and whether
   it is required — the same registry the exporter's tab draws from
   (lib/cbam/precursor-fields.ts), so the two sides cannot disagree.

   WHY THE VERIFICATION REPORT IS REQUIRED. Annex II A.1(4): a third-country
   operator's data can be used by the exporter only from a verification report
   issued by an accredited verifier whose scope covers the good and which covers
   the period in which it was made. Without it the exporter must use the default
   value, which is higher than most real figures — so the form says so.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Info } from "lucide-react";
import { AnnexFieldGroups, AnnexLegend } from "@/components/precursor/annex-fields";
import { actualFields } from "@/lib/cbam/precursor-fields";
import { countryNameShown as countryName } from "@/lib/config";
import type { PrecursorSupplier } from "@/lib/precursor-suppliers";
import { useT } from "@/lib/i18n";

/* THE FIELDS AND THEIR EXPLANATION, one scrolling page — what the operator answers on /p/<token>, and exactly what the exporter sees when they
   check or fill in the same answer on the precursor's card. Same legend, same cards, same Annex IV tags, same documents block; only the closing
   sentence changes person, because "you must use the default" is true of the exporter and a statement about them to the operator. */
export function ActualValueFields({
  draft,
  set,
  workspaceId,
  exporterName,
  onDocChange,
}: {
  draft: PrecursorSupplier;
  set: (next: PrecursorSupplier) => void;
  workspaceId: string;
  /** who the answer is for, when the reader is the operator; omitted when the reader is the exporter */
  exporterName?: string;
  onDocChange: () => void;
}) {
  const t = useT();
  const fields = React.useMemo(() => actualFields(draft).filter((f) => f.owner === "precursor"), [draft.cnCode, draft.catalogProductId, draft.country]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-5">
      <AnnexLegend showNeed />

      <section className="rounded-2xl border border-black/[0.07] bg-white p-5 sm:p-6">
        <AnnexFieldGroups fields={fields} row={draft} onChange={set} workspaceId={workspaceId} onDocChange={onDocChange} />
      </section>

      <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-black/50">
        <Info size={13} strokeWidth={1.5} className="mt-[3px] flex-none text-black/30" />
        <span>
          {exporterName
            ? t("The verification report is required: without a report from an accredited verifier that covers this good and the period, {exporter} has to use the EU's default value for it instead of your figure (Annex II A.1(4) of Implementing Regulation (EU) 2025/2547).", { exporter: exporterName })
            : t("The verification report is required: without a report from an accredited verifier that covers this good and the period, the EU's default value is used instead of this figure (Annex II A.1(4) of Implementing Regulation (EU) 2025/2547).")}
        </span>
      </p>
    </div>
  );
}

export function ActualValueForm({
  draft,
  set,
  workspaceId,
  exporterName,
  onDocChange,
}: {
  draft: PrecursorSupplier;
  set: (next: PrecursorSupplier) => void;
  workspaceId: string;
  exporterName: string;
  onDocChange: () => void;
}) {
  const t = useT();

  return (
    <div className="mt-6 space-y-5">
      <section className="rounded-2xl border border-black/[0.07] bg-[#faf9f7] p-5">
        <h2 className="text-[11px] uppercase tracking-[0.12em] text-black/45">{t("What {exporter} has told us", { exporter: exporterName })}</h2>
        <dl className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-3">
          <div>
            <dt className="text-[11px] uppercase tracking-[0.1em] text-black/40">{t("The good")}</dt>
            <dd className="mt-1 text-[13px] text-black/75">{draft.precursorName || "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.1em] text-black/40">{t("CN code")}</dt>
            <dd className="mt-1 font-mono text-[13px] text-black/75">{draft.cnCode || "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.1em] text-black/40">{t("Country of origin")}</dt>
            <dd className="mt-1 text-[13px] text-black/75">{draft.country ? countryName(draft.country) : "—"}</dd>
          </div>
        </dl>
        <p className="mt-3 text-[12px] leading-relaxed text-black/45">
          {t("If any of this is wrong, tell {exporter} before you answer — the figures below are only valid for this good.", { exporter: exporterName })}
        </p>
      </section>

      <ActualValueFields draft={draft} set={set} workspaceId={workspaceId} exporterName={exporterName} onDocChange={onDocChange} />
    </div>
  );
}
