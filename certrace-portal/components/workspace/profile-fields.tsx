"use client";

/* The one-time installation fields that Annex IV starts the operator's
   emissions report with: the operator (1(a)–(c)), the CBAM Registry identifier
   (1(d)), and the summary of the monitoring plan (2–6). The installation's own
   identity — name, reference, address, UN/LOCODE, coordinates — is
   `InstallationFields` (components/workspace/installation-form.tsx), unchanged.

   Every field carries the boxed Annex IV item number, and the box is the
   required / optional marker (components/precursor/annex-fields.tsx): ink with
   white text = required, white = optional, the word on hover or tap. The same
   way the precursor fields do it, so the two halves of the portal read as one
   system. Free text is English — the report must be (Article 10(4)). */

import * as React from "react";
import { inputClass, cn } from "@/components/ui";
import { Select } from "@/components/controls";
import { AnnexTag } from "@/components/precursor/annex-fields";
import {
  ADDENDUM_QUESTION,
  MONITORING_QUESTIONS,
  MONITORING_TEXT,
  OPERATOR_FIELDS,
  type ProfileField,
} from "@/lib/cbam/installation-profile";
import type { Installation, InstallationMonitoring, YesNo } from "@/lib/installations";
import { asLine, covers, type Ranked } from "@/lib/cbam/profile-suggestions";
import { useT } from "@/lib/i18n";

function Label({ tag, label, need }: { tag: string; label: string; need: "required" | "optional" }) {
  const t = useT();
  return (
    // The box stays beside the text however long the label runs.
    <span className="mb-1.5 flex items-start gap-2">
      <AnnexTag tag={tag} need={need} />
      <span className="min-w-0 text-[12.5px] leading-snug text-black/75">{t(label)}</span>
    </span>
  );
}

/** The ranking the monthly data gives for a list field, offered once and never written on its own. Gone as soon as the field already names every one of them. */
function Suggestion({ ranked, value, onUse }: { ranked: Ranked[]; value: string; onUse: (line: string) => void }) {
  const t = useT();
  if (ranked.length === 0 || covers(value, ranked)) return null;
  const line = asLine(ranked);
  return (
    <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-lg border border-dashed border-black/[0.14] bg-[#faf9f7] px-3 py-2 text-[11.5px] leading-snug text-black/55">
      <span className="min-w-0">
        {t("From your monthly data")}: <span className="text-black/75">{line}</span>
      </span>
      <button
        type="button"
        onClick={() => onUse(line)}
        className="inline-flex flex-none items-center whitespace-nowrap rounded-md border border-black/15 bg-white px-2 py-0.5 text-[11px] text-black/70 transition-colors hover:border-black/35 hover:text-black"
      >
        {value.trim() ? t("Replace with this list") : t("Use this list")}
      </button>
    </span>
  );
}

function TextInput({
  field,
  value,
  onChange,
  disabled,
  suggestion,
}: {
  field: ProfileField;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  suggestion?: Ranked[];
}) {
  const t = useT();
  return (
    /* A two-row subgrid of the row it sits in (label, then control + hint), so
       the boxes stay level when one label wraps and its neighbour does not.
       `gap-y-0` keeps the label against its own box; the grid's row gap only
       separates one field from the next. */
    <div id={`ip-${field.key.replace("monitoring.", "")}`} className={cn("grid scroll-mt-44 grid-rows-subgrid row-span-2 gap-y-0", field.input === "textarea" && "sm:col-span-2")}>
      <Label tag={field.tag} label={field.label} need={field.need} />
      <div>
        {field.input === "textarea" ? (
          <textarea className={cn(inputClass, "min-h-[72px]")} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} aria-label={field.label} />
        ) : (
          <input className={inputClass} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} aria-label={field.label} />
        )}
        {field.hint && <span className="mt-1.5 block text-[11.5px] leading-snug text-black/40">{t(field.hint)}</span>}
        {suggestion && !disabled && <Suggestion ranked={suggestion} value={value} onUse={onChange} />}
      </div>
    </div>
  );
}

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export function OperatorFields({ value, onChange, disabled }: { value: Installation; onChange: (next: Installation) => void; disabled?: boolean }) {
  return (
    <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
      {OPERATOR_FIELDS.map((f) => (
        <TextInput
          key={f.key}
          field={f}
          disabled={disabled}
          value={String((value as unknown as Record<string, unknown>)[f.key] ?? "")}
          onChange={(v) => onChange({ ...value, [f.key]: v })}
        />
      ))}
    </div>
  );
}

export function MonitoringFields({
  value,
  onChange,
  disabled,
  suggestions,
}: {
  value: Installation;
  onChange: (next: Installation) => void;
  disabled?: boolean;
  /** what the monthly data ranks, for items 2(d) and 2(e) */
  suggestions?: { topFuels: Ranked[]; topMaterials: Ranked[] };
}) {
  const t = useT();
  const m = value.monitoring;
  const setM = (patch: Partial<InstallationMonitoring>) => onChange({ ...value, monitoring: { ...m, ...patch } });

  return (
    <div className="space-y-6">
      <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
        {MONITORING_TEXT.map((f) => (
          <TextInput
            key={f.key}
            field={f}
            disabled={disabled}
            value={String((m as unknown as Record<string, unknown>)[f.key.replace("monitoring.", "")] ?? "")}
            onChange={(v) => setM({ [f.key.replace("monitoring.", "")]: v } as Partial<InstallationMonitoring>)}
            suggestion={f.key === "monitoring.topFuels" ? suggestions?.topFuels : f.key === "monitoring.topMaterials" ? suggestions?.topMaterials : undefined}
          />
        ))}
      </div>

      <div className="space-y-4">
        {[...MONITORING_QUESTIONS].map((q) => {
          const answer = m[q.key] as YesNo;
          return (
            <div key={q.key} id={`ip-${q.key}`} className="scroll-mt-44 rounded-xl border border-black/[0.07] p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_9rem] sm:items-start">
                <Label tag={q.tag} label={q.label} need="required" />
                <Select
                  value={answer}
                  onChange={(v) => setM({ [q.key]: v } as Partial<InstallationMonitoring>)}
                  disabled={disabled}
                  options={YES_NO.map((o) => ({ ...o, label: t(o.label) }))}
                  placeholder={t("Choose…")}
                  ariaLabel={q.label}
                />
              </div>
              {answer === "yes" && (
                <div className="mt-3">
                  <span className="mb-1.5 flex items-start gap-2">
                    <AnnexTag tag={q.tag} need="required" />
                    <span className="min-w-0 text-[12px] text-black/60">{t(q.detailLabel)}</span>
                  </span>
                  <textarea
                    className={cn(inputClass, "min-h-[64px]")}
                    value={String(m[q.detailKey] ?? "")}
                    disabled={disabled}
                    onChange={(e) => setM({ [q.detailKey]: e.target.value } as Partial<InstallationMonitoring>)}
                    aria-label={q.detailLabel}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* The one question that decides whether a fourth report exists. */}
        <div id="ip-electricityToEu" className="scroll-mt-44 rounded-xl border border-dashed border-black/15 p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_9rem] sm:items-start">
            <div>
              <Label tag={ADDENDUM_QUESTION.tag} label={ADDENDUM_QUESTION.label} need="optional" />
              <p className="text-[11.5px] leading-snug text-black/40">{t(ADDENDUM_QUESTION.hint)}</p>
            </div>
            <Select
              value={m.electricityToEu}
              onChange={(v) => setM({ electricityToEu: v as YesNo })}
              disabled={disabled}
              options={YES_NO.map((o) => ({ ...o, label: t(o.label) }))}
              placeholder={t("No")}
              ariaLabel={ADDENDUM_QUESTION.label}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
