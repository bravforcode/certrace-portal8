"use client";

/* ════════════════════════════════════════════════════════════
   THE ANNEX IV FIELD KIT — shared by both sides of a precursor request

   The exporter's Precursors tab and the precursor's own /p/<token> form draw
   their fields from the same registry (lib/cbam/precursor-fields.ts) through
   the components below, so a label, its Annex IV number and its Required /
   Optional marker look and read the same wherever they are met.

   THE BOX BEFORE EACH LABEL is the item of Annex IV to Implementing Regulation
   (EU) 2025/2547 that the answer feeds in the operator's emissions report —
   “23(e)” is item 23(e), the specific embedded emissions of a precursor on an
   actual value. A box starting “VR” is the matching item of the verification
   report template in Implementing Regulation (EU) 2025/2546. The box is a
   reference, not a control: it sits in the label's own line so it reads as
   part of the name, never as a button.

   REQUIRED AND OPTIONAL LIVE IN THE BOX. A field used to carry its number AND a
   "Required" / "Optional" chip, which doubled the furniture on every line of a
   long form. Now the number box says both: ink-filled with white digits is
   required, a white box with dark digits is optional, and hovering, focusing or
   tapping it names it — one word, “Required” or “Optional”. Where the regulation
   explains why an optional field is still worth filling, that stays as a quiet
   line under the field. Nothing here is red: a field not yet filled in is a
   question, not an error.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Lock } from "lucide-react";
import { Checkbox, NumberInput, inputClass, cn } from "@/components/ui";
import { DatePicker, Select } from "@/components/controls";
import { SectionEvidence } from "@/components/workspace/evidence-panel";
import { COUNTRIES } from "@/lib/config";
import {
  GROUP_LABEL,
  readField,
  writeField,
  type FieldGroup,
  type PrecursorField,
} from "@/lib/cbam/precursor-fields";
import type { PrecursorSupplier } from "@/lib/precursor-suppliers";
import { useT } from "@/lib/i18n";

/* ── The tag ─────────────────────────────────────────────────── */
/** The tag of a field that is asked but is not an item of Annex IV. */
export const NO_ITEM = "—";

export function AnnexTag({
  tag,
  need,
  className,
  quiet,
}: {
  tag: string;
  need?: PrecursorField["need"];
  className?: string;
  quiet?: boolean;
}) {
  const t = useT();
  const [tip, setTip] = React.useState(false);
  const timer = React.useRef<number | null>(null);
  React.useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const vr = tag.startsWith("VR");
  /* "MP 8": an element of the monitoring plan template, Annex II point A.5 — not an item of Annex IV. */
  const mp = tag.startsWith("MP ");
  /* "—": asked, but not an item of Annex IV (the installation's local name, its
     Certrace reference, the authorised representative's contact details). */
  const source =
    tag === NO_ITEM
      ? "Not an item of Annex IV"
      : vr
        ? `Verification report template, Implementing Regulation (EU) 2025/2546 — item ${tag.replace(/^VR\s*/, "")}`
        : mp
          ? `Monitoring plan template, Annex II point A.5, Implementing Regulation (EU) 2025/2547 — element ${tag.replace(/^MP\s*/, "")}`
          : `Annex IV, Implementing Regulation (EU) 2025/2547 — item ${tag}`;
  const box =
    "inline-flex flex-none items-center rounded-[5px] border px-1.5 font-mono text-[10px] leading-[18px] tracking-[0.02em]";

  /* QUIET: the box keeps its fill — ink for required, white for optional — and says nothing when touched. For the places
     where the box is a label on a figure being checked (Cera's review of a file), not something to be explained. */
  if (quiet) {
    return (
      <span
        className={cn(
          box,
          need === "required"
            ? "border-[#111] bg-[#111] text-white"
            : need === "optional"
              ? "border-black/30 bg-white text-black/75"
              : "border-black/25 bg-white text-black/65",
          className,
        )}
      >
        {tag}
      </span>
    );
  }

  // No requirement to state: the plain reference box.
  if (!need) {
    return (
      <span
        title={source}
        aria-label={source}
        className={cn(box, "border-black/25 bg-white text-black/65", className)}
      >
        {tag}
      </span>
    );
  }

  const word = need === "required" ? t("Required") : t("Optional");
  const flash = () => {
    // A tap has no hover: show the word for a moment, then let it go.
    setTip(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setTip(false), 1600);
  };

  return (
    <span className={cn("group relative inline-flex flex-none", className)}>
      <button
        type="button"
        onClick={flash}
        aria-label={`${source} — ${word}`}
        className={cn(
          box,
          "cursor-default",
          need === "required"
            ? "border-[#111] bg-[#111] text-white"
            : "border-black/30 bg-white text-black/75",
        )}
      >
        {tag}
      </button>
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#111] px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.1em] text-white opacity-0 shadow-sm transition-opacity group-focus-within:opacity-100 group-hover:opacity-100",
          tip && "opacity-100",
        )}
      >
        {word}
      </span>
    </span>
  );
}

/** The paragraph that used to explain the numbered boxes is gone — a screen should not need a legend to be read. The box still names
    its item (and whether it is required) when touched; this stays as a no-op so every screen that placed one keeps compiling. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AnnexLegend(_props: {
  className?: string;
  showNeed?: boolean;
  showNoItem?: boolean;
  noVr?: boolean;
}) {
  return null;
}

/* ── A labelled field for the forms that are not driven by a registry ─────
   The monthly readings, the installation's own record: a number box, a label,
   the control, and a quiet line under it. The cell is a two-row SUBGRID of
   the row it sits in, so the controls stay level when one label wraps and its
   neighbour does not — see the note on `CELL` in installation-form.tsx. */
export function TaggedField({
  tag,
  need,
  label,
  hint,
  children,
  className,
  id,
}: {
  tag: string;
  need: PrecursorField["need"];
  label: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** an anchor the quality check can scroll to */
  id?: string;
}) {
  return (
    <label
      id={id}
      className={cn(
        "grid scroll-mt-32 grid-rows-subgrid row-span-2 gap-y-0",
        className,
      )}
    >
      <span className="mb-1.5 flex items-start gap-2">
        <AnnexTag tag={tag} need={need} />
        <span className="min-w-0 text-[12.5px] leading-snug text-black/75">
          {label}
        </span>
      </span>
      <div>
        {children}
        {hint && (
          <span className="mt-1.5 block text-[11.5px] leading-snug text-black/40">
            {hint}
          </span>
        )}
      </div>
    </label>
  );
}

/* ── One field's label line ─────────────────────────────────── */
export function AnnexLabel({ field }: { field: PrecursorField }) {
  const t = useT();
  return (
    <span className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
      <AnnexTag tag={field.tag} need={field.need} />
      <span className="text-[12.5px] leading-snug text-black/75">
        {t(field.label)}
      </span>
    </span>
  );
}

/* ── The control ─────────────────────────────────────────────── */
const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({
  value: c.code,
  label: c.name,
}));

export function FieldControl({
  field,
  row,
  onChange,
  disabled,
  extraCountryOptions,
}: {
  field: PrecursorField;
  row: PrecursorSupplier;
  onChange: (next: PrecursorSupplier) => void;
  disabled?: boolean;
  extraCountryOptions?: { value: string; label: string }[];
}) {
  const t = useT();
  const raw = readField(row, field.key);
  const set = (v: unknown) => onChange(writeField(row, field.key, v));

  /* LOCKED: shown the way the Overview shows its locked reporting year — the value,
     a lock, and no control to retype it with. */
  if (field.locked) {
    return (
      <div
        className={cn(
          inputClass,
          "flex items-center justify-between gap-2 bg-black/[0.02] text-black/55",
          field.key === "cnCode" && "font-mono",
        )}
        title={t("Fixed when the precursor was added")}
      >
        <span className="min-w-0 truncate">
          {typeof raw === "string" && raw ? raw : "—"}
        </span>
        <Lock
          size={13}
          strokeWidth={1.5}
          className="flex-none text-black/25"
          aria-hidden
        />
      </div>
    );
  }

  switch (field.input) {
    case "checkbox":
      return (
        <Checkbox
          checked={Boolean(raw)}
          onChange={(v) => set(v)}
          disabled={disabled}
          label={t(field.label)}
        />
      );
    case "number":
      return (
        <NumberInput
          value={
            typeof raw === "number"
              ? raw
              : raw === "" || raw == null
                ? undefined
                : Number(raw)
          }
          min={0}
          unit={field.unit}
          onChange={(v) => set(v)}
          ariaLabel={field.label}
        />
      );
    case "date":
      return (
        <DatePicker
          value={typeof raw === "string" ? raw : ""}
          onChange={(iso) => set(iso)}
          ariaLabel={field.label}
        />
      );
    case "country":
      return (
        <Select
          value={typeof raw === "string" ? raw : ""}
          onChange={(v) => set(v)}
          searchable
          /* An unidentified country is not a country to pick: the box is ticked INSTEAD. */
          disabled={
            disabled || (field.key === "country" && Boolean(row.originUnknown))
          }
          options={[...(extraCountryOptions ?? []), ...COUNTRY_OPTIONS]}
          placeholder={
            field.key === "country" && row.originUnknown
              ? t("Not identified")
              : t("Choose a country")
          }
          ariaLabel={field.label}
        />
      );
    case "select":
    case "yesno":
      return (
        <Select
          value={typeof raw === "string" ? raw : ""}
          onChange={(v) => set(v)}
          options={(field.options ?? []).map((o) => ({
            value: o.value,
            label: t(o.label),
          }))}
          placeholder={t("Choose…")}
          ariaLabel={field.label}
        />
      );
    case "textarea":
      return (
        <textarea
          className={cn(inputClass, "min-h-[84px]")}
          value={typeof raw === "string" ? raw : ""}
          onChange={(e) => set(e.target.value)}
          disabled={disabled}
          aria-label={field.label}
        />
      );
    default:
      return (
        <input
          className={cn(
            inputClass,
            field.key === "unlocode" || field.key === "cnCode"
              ? "font-mono"
              : undefined,
          )}
          value={typeof raw === "string" ? raw : raw == null ? "" : String(raw)}
          onChange={(e) =>
            set(
              field.key === "unlocode"
                ? e.target.value.toUpperCase()
                : e.target.value,
            )
          }
          placeholder={field.placeholder}
          disabled={disabled}
          aria-label={field.label}
        />
      );
  }
}

/* ── A document slot ──────────────────────────────────────────── */
export const slotKey = (
  nodeId: string,
  slot: NonNullable<PrecursorField["slot"]>,
): string =>
  slot === "report" ? `precursor:${nodeId}` : `precursor:${nodeId}:${slot}`;

export function DocSlot({
  workspaceId,
  nodeId,
  field,
  onChange,
}: {
  workspaceId: string;
  nodeId: string;
  field: PrecursorField;
  onChange?: () => void;
}) {
  const keys = React.useMemo(
    () =>
      field.slot
        ? [{ key: slotKey(nodeId, field.slot), label: field.label }]
        : [],
    [nodeId, field.slot, field.label],
  );
  if (!field.slot) return null;
  return (
    <SectionEvidence
      workspaceId={workspaceId}
      keys={keys}
      openable
      emptyLabel="Nothing attached yet."
      onChange={onChange}
    />
  );
}

/* ── A field, labelled and controlled ─────────────────────────── */
export function AnnexField({
  field,
  row,
  onChange,
  workspaceId,
  onDocChange,
  disabled,
  extraCountryOptions,
}: {
  field: PrecursorField;
  row: PrecursorSupplier;
  onChange: (next: PrecursorSupplier) => void;
  workspaceId: string;
  onDocChange?: () => void;
  disabled?: boolean;
  extraCountryOptions?: { value: string; label: string }[];
}) {
  const t = useT();
  if (field.input === "checkbox") {
    // The sentence is the box's own label, so the number box leads it on the same line.
    return (
      <div className="sm:col-span-2">
        <div className="flex items-start gap-2">
          <AnnexTag tag={field.tag} need={field.need} className="mt-[2px]" />
          <Checkbox
            checked={Boolean(readField(row, field.key))}
            onChange={(v) => onChange(writeField(row, field.key, v))}
            disabled={disabled}
            label={t(field.label)}
            hint={field.hint ? t(field.hint) : undefined}
          />
        </div>
      </div>
    );
  }
  return (
    <div
      className={cn(
        field.input === "file" || field.input === "textarea"
          ? "sm:col-span-2"
          : undefined,
      )}
    >
      <AnnexLabel field={field} />
      {field.input === "file" ? (
        <DocSlot
          workspaceId={workspaceId}
          nodeId={row.id}
          field={field}
          onChange={onDocChange}
        />
      ) : (
        <FieldControl
          field={field}
          row={row}
          onChange={onChange}
          disabled={disabled}
          extraCountryOptions={extraCountryOptions}
        />
      )}
      {(field.hint || (field.need === "optional" && field.whyOptional)) && (
        <span className="mt-1.5 block text-[11.5px] leading-snug text-black/40">
          {field.hint ? t(field.hint) : null}
          {field.hint && field.need === "optional" && field.whyOptional
            ? " "
            : null}
          {field.need === "optional" && field.whyOptional
            ? t(field.whyOptional)
            : null}
        </span>
      )}
    </div>
  );
}

/* ── Fields, grouped ──────────────────────────────────────────── */
const GROUP_ORDER: FieldGroup[] = [
  "identity",
  "origin",
  "quantity",
  "installation",
  "period",
  "emissions",
  "sector",
  "verifier",
  "documents",
];

export function AnnexFieldGroups({
  fields,
  row,
  onChange,
  workspaceId,
  onDocChange,
  disabled,
  extraCountryOptions,
}: {
  fields: PrecursorField[];
  row: PrecursorSupplier;
  onChange: (next: PrecursorSupplier) => void;
  workspaceId: string;
  onDocChange?: () => void;
  disabled?: boolean;
  extraCountryOptions?: { value: string; label: string }[];
}) {
  const t = useT();
  const groups = GROUP_ORDER.map((g) => ({
    g,
    items: fields.filter((f) => f.group === g),
  })).filter((x) => x.items.length > 0);
  return (
    <div className="space-y-5">
      {groups.map(({ g, items }) => (
        /* The id is where Cera's "open this part" buttons take the page after it has filled a precursor's form (lib/cera/focus.ts). */
        <section key={g} id={`qf-precursor-${g}`} className="scroll-mt-32">
          <h4 className="mb-2.5 border-b border-black/[0.06] pb-1.5 text-[10.5px] uppercase tracking-[0.12em] text-black/40">
            {t(GROUP_LABEL[g])}
          </h4>
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            {items.map((f) => (
              <AnnexField
                key={f.key}
                field={f}
                row={row}
                onChange={onChange}
                workspaceId={workspaceId}
                onDocChange={onDocChange}
                disabled={disabled}
                extraCountryOptions={extraCountryOptions}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
