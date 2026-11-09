"use client";

/* ════════════════════════════════════════════════════════════
   INSTRUMENT ROWS — one list, rendered twice

   The fuels card and the electricity card ask the same four questions about
   an instrument: what it measures, what the instrument is, how often it is
   read, and when it was last calibrated. They are two separate ARRAYS (a
   plant burning three fuels must not have its instrument requirement
   satisfied by an electricity meter) rendered by one component, so the two
   cards can never drift into asking the same thing two different ways.

   MEASUREMENT-BASED ADDS TWO FIELDS, and only to the fuels card. A CEMS
   carries a QAL2 calibration reference and a sampling location; a rotary gas
   meter has neither. "Measurement point" is a DEFINED TERM — Annex I item 25
   of IR (EU) 2025/2547 — and it means the point in the duct where a
   continuous analyser samples. It is used here and nowhere else in the
   product: the electricity field next door is an "electricity metering
   point", because calling that a measurement point would tell a verifier a
   CEMS is fitted to the incoming feeder.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, Field, HelpTip, NumberInput, inputClass, cn } from "@/components/ui";
import { DatePicker, Select } from "@/components/controls";
import { READING_FREQUENCY_OPTIONS, type MeasurementMethodRow } from "@/lib/workspace-mmd";
import { useT } from "@/lib/i18n";

const FREQUENCY_OPTIONS = [
  ...READING_FREQUENCY_OPTIONS.map((o) => ({ value: o.id, label: o.label, hint: o.hint })),
  { value: "other", label: "Other — say how often", hint: "Anything the list does not cover. You describe it in the field that appears." },
];

const OTHER = "__other";

/* What the instrument measures: a choice from the list, and "Other — name it" for anything the list does not cover. A value saved before
   this was a list (free text) that is not on it opens as "Other" with its words in the box, so nothing already written is lost. */
function ParameterField({ row, options, disabled, onChange }: { row: MeasurementMethodRow; options: string[]; disabled?: boolean; onChange: (parameter: string) => void }) {
  const t = useT();
  const listed = options.includes(row.parameter);
  const [other, setOther] = React.useState(!listed && row.parameter.trim() !== "");
  const asOther = other || (!listed && row.parameter.trim() !== "");
  return (
    <Field label={t("Parameter")} hint={t("What this instrument measures.")}>
      <Select
        value={asOther ? OTHER : listed ? row.parameter : ""}
        onChange={(v) => {
          if (v === OTHER) {
            setOther(true);
            onChange(listed ? "" : row.parameter);
          } else {
            setOther(false);
            onChange(v);
          }
        }}
        options={[...options.map((o) => ({ value: o, label: t(o) })), { value: OTHER, label: t("Other — name it") }]}
        placeholder={t("Choose")}
        disabled={disabled}
        ariaLabel={t("Parameter")}
      />
      {asOther && (
        <input
          className={cn(inputClass, "mt-2")}
          value={row.parameter}
          disabled={disabled}
          placeholder={t("Say what it measures")}
          aria-label={t("What this instrument measures.")}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

export function InstrumentRows({
  rows,
  onChange,
  /** shown when the list is empty — it must say what to do, not that it is empty */
  emptyHint,
  addLabel = "Add an instrument",
  /** the fuels card only, and only when the method is measurement-based */
  showCems = false,
  parameterOptions,
  instrumentPlaceholder = "Elster RVG G250 rotary meter",
  disabled,
  /** anchor so a validation message can scroll to the right card */
  anchorId,
  makeRow,
}: {
  rows: MeasurementMethodRow[];
  onChange: (next: MeasurementMethodRow[]) => void;
  emptyHint: React.ReactNode;
  addLabel?: string;
  showCems?: boolean;
  /** what this card's instruments can measure — a list to choose from, with "Other" for the rest */
  parameterOptions: string[];
  instrumentPlaceholder?: string;
  disabled?: boolean;
  anchorId?: string;
  /** the row factory. The electricity card seeds its rows with a parameter
      already filled in, the fuels card does not, so the caller owns it. */
  makeRow: () => MeasurementMethodRow;
}) {
  const t = useT();
  const patch = (id: string, p: Partial<MeasurementMethodRow>) => onChange(rows.map((r) => (r.id === id ? { ...r, ...p } : r)));

  return (
    <div id={anchorId} className="scroll-mt-32">
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/10 px-4 py-4 text-[12.5px] leading-relaxed text-black/45">{typeof emptyHint === "string" ? t(emptyHint) : emptyHint}</p>
      ) : (
        <div className="space-y-3">
          {rows.map((m, i) => (
            <div key={m.id} className="rounded-xl border border-black/[0.07] bg-[#faf9f7] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/40">{t("Instrument")} {i + 1}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onChange(rows.filter((x) => x.id !== m.id))}
                    className="grid h-7 w-7 place-items-center rounded-lg text-black/30 transition-colors hover:bg-[#fef2f2] hover:text-[#dc2626]"
                    aria-label={`${t("Remove instrument")} ${i + 1}`}
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <ParameterField row={m} options={parameterOptions} disabled={disabled} onChange={(parameter) => patch(m.id, { parameter })} />
                <Field label={t("Instrument")} hint={t("Make, model and tag — enough to find it on the plant.")}>
                  <input
                    className={inputClass}
                    value={m.instrument}
                    disabled={disabled}
                    placeholder={instrumentPlaceholder}
                    onChange={(e) => patch(m.id, { instrument: e.target.value })}
                  />
                </Field>
                <Field label={t("Read how often")}>
                  <Select
                    value={m.readingFrequency}
                    onChange={(v) => patch(m.id, { readingFrequency: v })}
                    options={FREQUENCY_OPTIONS}
                    placeholder={t("Choose")}
                    ariaLabel={t("Reading frequency")}
                  />
                </Field>
                <Field label={t("Last calibrated")} hint={t("The date on the calibration certificate.")}>
                  <DatePicker value={m.lastCalibration} onChange={(iso) => patch(m.id, { lastCalibration: iso })} ariaLabel={t("Last calibration date")} />
                </Field>
              </div>

              {/* Annex II A.5(7)(b) asks for the exact place of each instrument; B.3.1 for its uncertainty. */}
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="sm:col-span-2 xl:col-span-3">
                  <Field label={t("Where it sits")} hint={t("The line, feeder or tank it is fitted to — so a verifier can walk to it.")} optional>
                    <input
                      className={inputClass}
                      value={m.location ?? ""}
                      disabled={disabled}
                      placeholder={t("Gas main to reheat furnace RF-1, upstream of the burner skid")}
                      onChange={(e) => patch(m.id, { location: e.target.value })}
                    />
                  </Field>
                </div>
                <Field label={t("Uncertainty")} hint={t("± %, from the maker or the calibration certificate.")} optional>
                  <NumberInput value={m.uncertaintyPct} onChange={(v) => patch(m.id, { uncertaintyPct: v })} min={0} max={100} unit="%" disabled={disabled} ariaLabel={t("Measurement uncertainty")} />
                </Field>
              </div>

              {m.readingFrequency === "other" && (
                <div className="mt-4">
                  <Field label={t("Say how often")}>
                    <input
                      className={inputClass}
                      value={m.readingFrequencyOther ?? ""}
                      disabled={disabled}
                      placeholder={t("At each ladle tap, roughly 18 times a day")}
                      onChange={(e) => patch(m.id, { readingFrequencyOther: e.target.value })}
                    />
                  </Field>
                </div>
              )}

              {showCems && (
                <div className="mt-4 grid gap-4 border-t border-black/[0.06] pt-4 sm:grid-cols-2">
                  <Field label={t("CEMS calibration reference")} hint={t("The QAL2 certificate number for this analyser.")}>
                    <input
                      className={cn(inputClass, !m.cemsCalibrationRef?.trim() && "border-[#f59e0b]/50")}
                      value={m.cemsCalibrationRef ?? ""}
                      disabled={disabled}
                      placeholder={t("QAL2-2026-0148, issued 12 Feb 2026")}
                      onChange={(e) => patch(m.id, { cemsCalibrationRef: e.target.value })}
                    />
                  </Field>
                  <label className="block">
                    <span className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-black/55">
                      {t("Measurement point")}
                      <HelpTip title={t("Measurement point")}>
                        <p>
                          {t("Where in the duct or stack the analyser takes its sample. This is a defined term — Annex I item 25 of Implementing Regulation (EU) 2025/2547 — and it applies only to continuous emission measurement.")}
                        </p>
                        <p className="mt-2">
                          {t("It is not the same thing as the electricity metering point on the card below. That one is a revenue meter; this one is a sampling location on a flue.")}
                        </p>
                        <p className="mt-2 text-black/45">{t("Name the stack and the height or distance, so a verifier can stand next to it.")}</p>
                      </HelpTip>
                    </span>
                    <input
                      className={cn(inputClass, !m.measurementPointLocation?.trim() && "border-[#f59e0b]/50")}
                      value={m.measurementPointLocation ?? ""}
                      disabled={disabled}
                      placeholder={t("EAF stack S-1, sampling port 8 m above the bag-house outlet")}
                      aria-label={t("Measurement point location")}
                      onChange={(e) => patch(m.id, { measurementPointLocation: e.target.value })}
                    />
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!disabled && (
        <Button size="sm" variant="secondary" className="mt-3" onClick={() => onChange([...rows, makeRow()])}>
          <Plus size={12} strokeWidth={1.5} /> {t(addLabel)}
        </Button>
      )}
    </div>
  );
}
