"use client";

/* Month coverage and the data-gap register, side by side.

   The two belong on one screen because they are one question: for every month
   in the reporting period, is there a reading — and if not, is there an
   explanation? A month that is neither is the only genuine failure, and it is
   the thing this layout is designed to make impossible to miss.

   The register is not an admission of weakness. A verifier expects gaps; what
   they test is whether the estimate could have flattered the exporter. So the
   conservative-justification field is required, not optional, and the copy
   says why. */

import * as React from "react";
import { CalendarCheck, Plus, Trash2, TriangleAlert } from "lucide-react";
import { Card, Button, Eyebrow, inputClass, cn } from "@/components/ui";
import { DatePicker, Select } from "@/components/controls";
import { ProvenanceForm } from "@/components/cbam/provenance-form";
import { emptyProvenance } from "@/lib/cbam/activity";
import {
  monthsInPeriod,
  monthLabel,
  displayDate,
  type ReportingPeriod,
} from "@/lib/cbam/boundary";
import { useT } from "@/lib/i18n";
import {
  ESTIMATION_METHODS,
  ESTIMATION_METHOD_LABEL,
  ESTIMATION_METHOD_HINT,
  monthCoverage,
  gapShare,
  saveGap,
  removeGap,
  type EstimationMethod,
  type GapEntry,
} from "@/lib/cbam/data-gaps";

const uid = () => `gap-${Math.random().toString(36).slice(2, 10)}`;

export function DataGapSection({
  declarationId,
  period,
  monthsWithData,
  gaps,
  onGapsChange,
  onMonthsChange,
  totalTCO2e,
  enteredBy,
}: {
  declarationId: string;
  period: ReportingPeriod;
  monthsWithData: string[];
  gaps: GapEntry[];
  onGapsChange: (next: GapEntry[]) => void;
  onMonthsChange: (next: string[]) => void;
  /** total emissions the share is measured against; 0 = not computable yet */
  totalTCO2e: number;
  enteredBy: string;
}) {
  const t = useT();
  const coverage = monthCoverage(period, monthsWithData, gaps);
  const unexplained = coverage.filter((m) => !m.covered);
  const share = gapShare(gaps, totalTCO2e);
  const months = monthsInPeriod(period);

  const toggleMonth = (m: string) => {
    const set = new Set(monthsWithData);
    if (set.has(m)) set.delete(m);
    else set.add(m);
    onMonthsChange([...set].sort());
  };

  const addGap = () => {
    const entry: GapEntry = {
      id: uid(),
      declarationId,
      periodStart: period.start,
      periodEnd: period.end,
      affectedParameter: "",
      reason: "",
      estimationMethod: "prior_period_average",
      conservativeJustification: "",
      estimatedTCO2e: 0,
      provenance: emptyProvenance(enteredBy),
      createdAt: Date.now(),
    };
    onGapsChange(saveGap(entry));
  };

  const patch = (g: GapEntry, p: Partial<GapEntry>) =>
    onGapsChange(saveGap({ ...g, ...p }));

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-xl border border-black/10 text-black/55">
            <CalendarCheck size={16} strokeWidth={1.5} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-black/30">5</span>
              <h2 className="text-[15px] text-black/80">
                {t("Month coverage & data gaps")}
              </h2>
            </div>
            <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-black/45">
              {t(
                "Every month in the period needs a reading, or an entry explaining why not. A month that has neither is the one thing a verifier cannot work around.",
              )}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="flex-none"
          onClick={addGap}
        >
          <Plus size={13} strokeWidth={1.5} /> {t("Add gap")}
        </Button>
      </div>

      {/* Month strip */}
      <div className="mt-5">
        <Eyebrow>{t("Months with primary data — click to toggle")}</Eyebrow>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {months.map((m) => {
            const row = coverage.find((c) => c.month === m)!;
            const hasData = monthsWithData.includes(m);
            return (
              <button
                key={m}
                onClick={() => toggleMonth(m)}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 font-mono text-[11px] transition-colors",
                  hasData
                    ? "border-[#059669]/25 bg-[#ecfdf5] text-[#047857]"
                    : row.covered
                      ? "border-[#d97706]/30 bg-[#fffbeb] text-[#b45309]"
                      : "border-[#dc2626]/30 bg-[#fef2f2] text-[#dc2626]",
                )}
                title={
                  hasData
                    ? "Primary data"
                    : row.covered
                      ? "Explained by a gap entry"
                      : "No reading and no explanation"
                }
              >
                {monthLabel(m)}
              </button>
            );
          })}
        </div>
        <p className="mt-2.5 text-[11.5px] leading-relaxed text-black/40">
          <span className="text-[#047857]">{t("green")}</span> = primary data ·{" "}
          <span className="text-[#b45309]">{t("amber")}</span> = explained by a
          gap entry · <span className="text-[#dc2626]">{t("red")}</span> =
          unexplained
        </p>
      </div>

      {unexplained.length > 0 && (
        <p className="mt-4 flex items-start gap-1.5 rounded-xl border border-[#dc2626]/25 bg-[#fef2f2] px-3 py-2.5 text-[12.5px] leading-relaxed text-[#dc2626]">
          <TriangleAlert
            size={13}
            strokeWidth={1.8}
            className="mt-[2px] flex-none"
          />
          <span>
            {unexplained.length} month{unexplained.length === 1 ? "" : "s"} with
            neither a reading nor an explanation:{" "}
            {unexplained.map((m) => monthLabel(m.month)).join(", ")}. Add a gap
            entry for each, or mark the month as covered once the reading is in.
          </span>
        </p>
      )}

      {share.escalate && (
        <p className="mt-4 flex items-start gap-1.5 rounded-xl border border-[#d97706]/30 bg-[#fffbeb] px-3 py-2.5 text-[12.5px] leading-relaxed text-[#b45309]">
          <TriangleAlert
            size={13}
            strokeWidth={1.8}
            className="mt-[2px] flex-none"
          />
          <span>{share.message}</span>
        </p>
      )}

      {/* Register */}
      {gaps.length > 0 && (
        <div className="mt-6 space-y-4">
          {gaps.map((g) => (
            <div
              key={g.id}
              className="rounded-2xl border border-black/[0.07] p-4"
            >
              <div className="flex flex-wrap items-end gap-3">
                <label className="min-w-[200px] flex-1">
                  <Lbl>{t("Affected parameter")}</Lbl>
                  <input
                    className={inputClass}
                    value={g.affectedParameter}
                    placeholder={t("e.g. natural gas consumption")}
                    onChange={(e) =>
                      patch(g, { affectedParameter: e.target.value })
                    }
                  />
                </label>
                <label className="min-w-[130px] flex-none">
                  <Lbl>{t("From")}</Lbl>
                  <DatePicker
                    value={g.periodStart}
                    onChange={(iso) => patch(g, { periodStart: iso })}
                    ariaLabel={t("Data gap — period start")}
                  />
                </label>
                <label className="min-w-[130px] flex-none">
                  <Lbl>{t("To")}</Lbl>
                  <DatePicker
                    value={g.periodEnd}
                    onChange={(iso) => patch(g, { periodEnd: iso })}
                    ariaLabel={t("Data gap — period end")}
                  />
                </label>
                <label className="min-w-[140px] flex-none">
                  <Lbl>{t("Estimated tCO₂e")}</Lbl>
                  <input
                    className={inputClass}
                    inputMode="decimal"
                    value={g.estimatedTCO2e || ""}
                    onChange={(e) =>
                      patch(g, { estimatedTCO2e: Number(e.target.value) || 0 })
                    }
                  />
                </label>
                <button
                  aria-label={t("Remove gap entry")}
                  onClick={() => onGapsChange(removeGap(declarationId, g.id))}
                  className="mb-3 flex-none text-black/25 hover:text-[#dc2626]"
                >
                  <Trash2 size={15} strokeWidth={1.5} />
                </button>
              </div>

              <p className="mt-1 font-mono text-[10px] text-black/30">
                {displayDate(g.periodStart)} — {displayDate(g.periodEnd)}
              </p>

              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <label className="block">
                  <Lbl>{t("Why there is no primary data")}</Lbl>
                  <textarea
                    className={cn(inputClass, "min-h-[72px] resize-y")}
                    value={g.reason}
                    placeholder={t(
                      "e.g. the main gas meter failed on 12 August and was replaced on 3 September",
                    )}
                    onChange={(e) => patch(g, { reason: e.target.value })}
                  />
                </label>
                <div>
                  <Lbl>{t("How the gap was filled")}</Lbl>
                  <Select
                    value={g.estimationMethod}
                    onChange={(v) =>
                      patch(g, { estimationMethod: v as EstimationMethod })
                    }
                    options={ESTIMATION_METHODS.map((m) => ({
                      value: m,
                      label: ESTIMATION_METHOD_LABEL[m],
                    }))}
                  />
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-black/40">
                    {t(ESTIMATION_METHOD_HINT[g.estimationMethod])}
                  </p>
                </div>
              </div>

              <label className="mt-3 block">
                <Lbl>{t("Why the estimate cannot flatter you")}</Lbl>
                <textarea
                  className={cn(
                    inputClass,
                    "min-h-[64px] resize-y",
                    !g.conservativeJustification.trim() &&
                      "border-[#d97706]/50",
                  )}
                  value={g.conservativeJustification}
                  placeholder={t(
                    "e.g. we used the highest monthly consumption of the year rather than the average, so the estimate is above any plausible actual",
                  )}
                  onChange={(e) =>
                    patch(g, { conservativeJustification: e.target.value })
                  }
                />
                <span className="mt-1.5 block text-[11.5px] leading-relaxed text-black/40">
                  {t(
                    "Conservativeness is one of the seven things a verifier tests. The question is not whether you estimated — it is whether the estimate could have come out in your favour.",
                  )}
                </span>
              </label>

              <div className="mt-3">
                <Lbl>{t("Provenance")}</Lbl>
                <ProvenanceForm
                  value={g.provenance}
                  onChange={(p) => patch(g, { provenance: p })}
                  compact
                />
              </div>
            </div>
          ))}

          <p className="text-right font-mono text-[11px] text-black/40">
            {share.estimatedTCO2e.toLocaleString("en-US", {
              maximumFractionDigits: 2,
            })}{" "}
            tCO₂e estimated
            {totalTCO2e > 0 &&
              ` · ${(share.share * 100).toFixed(1)}% of the total`}
          </p>
        </div>
      )}
    </Card>
  );
}

function Lbl({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-[10px] uppercase tracking-[0.12em] text-black/40">
      {children}
    </span>
  );
}
