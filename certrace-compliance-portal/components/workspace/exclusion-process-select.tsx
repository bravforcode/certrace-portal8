"use client";

/* ════════════════════════════════════════════════════════════
   "WHICH PROCESS IS OUTSIDE THE BOUNDARY" — a picker, not a text box

   Shared by the exporter's MMD screen and the supplier's monthly form,
   because an exclusion typed one way in one and another way in the other is
   two exclusions as far as a verifier's comparison is concerned.

   THREE RULES, and each exists because of a specific failure:

   1. IT IS THE SAME CLOSED LIST AS "PROCESSES INCLUDED". An exclusion is a
      declaration that a NAMED process is outside the line, and the only
      names that mean anything are the ones the boundary is drawn in. Free
      text produced "rolling", "Rolling mill", "hot mill line 3" and
      "Reheat/rolling" across four rows describing two processes.

   2. NO ORDER. Included processes are a SEQUENCE — material moves through
      them, and the order is a claim about the plant. Excluded ones are a
      SET: nothing flows through them by definition, so ranking them would
      invite a reader to infer something that is not there.

   3. A PROCESS ALREADY EXCLUDED DROPS OUT OF THE LIST. Declaring the same
      process outside the boundary twice is not a stronger declaration, it is
      two rows a verifier has to reconcile. "Other" is the exception and
      stays available for ever, because two different unlisted processes are
      genuinely two exclusions — the free text is what distinguishes them.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Select } from "@/components/controls";
import { inputClass, cn } from "@/components/ui";
import { useT } from "@/lib/i18n";
import {
  EXCLUSION_GROUNDS,
  EXCLUSION_GROUND_HINT,
  EXCLUSION_GROUND_LABEL,
  PROCESS_OPTIONS,
  type ExclusionGround,
  type ProcessExclusion,
} from "@/lib/workspace-mmd";

const OTHER = "__other__";

const isListed = (v: string): boolean => (PROCESS_OPTIONS as readonly string[]).includes(v);

export function ExclusionProcessSelect({
  /** the row being edited */
  value,
  /** every exclusion on the form, so the ones already taken can be hidden */
  all,
  onChange,
  disabled,
}: {
  value: ProcessExclusion;
  all: ProcessExclusion[];
  onChange: (process: string) => void;
  disabled?: boolean;
}) {
  const t = useT();
  /* Taken by ANOTHER row. This row's own value stays in the list, or the
     select would render with nothing selected the moment it was chosen. */
  const takenElsewhere = React.useMemo(
    () => new Set(all.filter((x) => x.id !== value.id).map((x) => x.process).filter(isListed)),
    [all, value.id],
  );

  /* ── "Other" is a CHOICE, not an inference ────────────────────
     This was the bug. `custom` was derived as "there is text and it is not on
     the list", and picking Other writes an EMPTY process — so the derivation
     read false the instant it was picked and the text box never appeared.
     Choosing Other did nothing at all, and the only way to reach the box was
     to somehow already have free text in the row.

     So the choice is held in state. It is seeded from the value for a row
     loaded from storage, cleared when a listed process is picked, and
     deliberately SURVIVES the box being emptied — a reader who clears what
     they typed is mid-edit, not asking for the field to vanish. */
  const customValue = Boolean(value.process) && !isListed(value.process);
  const [otherChosen, setOtherChosen] = React.useState(customValue);
  React.useEffect(() => {
    if (isListed(value.process)) setOtherChosen(false);
    else if (value.process) setOtherChosen(true);
  }, [value.process]);

  const custom = otherChosen || customValue;

  const options = React.useMemo(
    () => [
      ...PROCESS_OPTIONS.filter((p) => !takenElsewhere.has(p)).map((p) => ({ value: p, label: p })),
      {
        value: OTHER,
        label: "Other — describe it",
        hint: "A process the list above does not name. You type the name, and it stays available for further exclusions.",
      },
    ],
    [takenElsewhere],
  );

  /* Everything on the list is already excluded and nothing custom is being
     typed. Rare, but the alternative is a dropdown containing only "Other"
     with no explanation of where the rest went. */
  const listExhausted = options.length === 1 && !custom;

  return (
    <div className="space-y-2">
      <Select
        value={custom ? OTHER : value.process}
        onChange={(v) => {
          setOtherChosen(v === OTHER);
          onChange(v === OTHER ? "" : v);
        }}
        options={options}
        placeholder={t("Which process?")}
        ariaLabel={t("Process excluded")}
        searchable={options.length > 10}
        searchPlaceholder={t("Search processes…")}
        invalid={!value.process.trim() && !custom}
      />
      {custom && (
        <input
          className={cn(inputClass, !value.process.trim() && "border-[#f59e0b]/60")}
          value={value.process}
          disabled={disabled}
          autoFocus
          placeholder={t("Name it as your team names it — e.g. Billet reheating, Line 3")}
          aria-label={t("Name the excluded process")}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {listExhausted && (
        <p className="text-[11px] leading-relaxed text-black/40">
          {t("Every process on the list is already declared outside the boundary. If that is right, nothing is inside it — check the “Processes included” list above.")}
        </p>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   THE GROUND, AND — WHEN IT IS "OTHER" — WHAT THE GROUND ACTUALLY IS

   The list offered "Other ground — describe it" and then gave the reader
   nowhere to describe it. The detail field further down the row is a
   different question (which meter, which subcontractor, which threshold), so
   an exclusion on an unlisted ground reached the verifier as the word "other"
   with a sentence about a meter under it — the ground itself never stated,
   which is precisely the finding the exclusions section exists to prevent.

   Shared between the exporter's MMD screen and the supplier's monthly form
   for the same reason the process picker is: one ground typed two ways in the
   two places is two grounds to reconcile.
   ════════════════════════════════════════════════════════════ */
export function ExclusionGroundSelect({
  value,
  onChange,
  disabled,
}: {
  value: ProcessExclusion;
  onChange: (patch: Pick<ProcessExclusion, "ground" | "groundOther">) => void;
  disabled?: boolean;
}) {
  const t = useT();
  const isOther = value.ground === "other";

  return (
    <div className="space-y-2">
      <Select
        value={value.ground}
        onChange={(v) =>
          onChange({
            ground: v as ExclusionGround,
            // Moving off "other" drops the written ground rather than keeping
            // it invisibly attached to a standard one.
            groundOther: v === "other" ? value.groundOther : "",
          })
        }
        options={EXCLUSION_GROUNDS.map((g) => ({ value: g, label: t(EXCLUSION_GROUND_LABEL[g]), hint: EXCLUSION_GROUND_HINT[g] }))}
        ariaLabel={t("Ground for excluding it")}
      />
      {isOther && (
        <input
          className={cn(inputClass, !value.groundOther.trim() && "border-[#f59e0b]/60")}
          value={value.groundOther}
          disabled={disabled}
          autoFocus
          placeholder={t("State the ground — e.g. Leased to a tenant with its own permit")}
          aria-label={t("Describe the ground for excluding it")}
          onChange={(e) => onChange({ ground: "other", groundOther: e.target.value })}
        />
      )}
    </div>
  );
}
