"use client";

/* ════════════════════════════════════════════════════════════
   THE CBAM TAB — the workbook's checklist of every CBAM template field

   A summary (required fields filled, per item) and then the fields grouped by
   section, each with its template reference (sheet!cell), its value or
   "Missing", and its unit. Rows are tinted by state: red while a required field
   is missing, green once filled. A value is edited in place (click it, Enter or
   leaving the field saves, Escape cancels); the fill-in form (each unfinished
   item links to it) and Smart Links write the same cells. The counting is
   lib/cbam/cbam-tab.ts.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { PencilLine } from "lucide-react";
import { Card, Chip, Progress, cn } from "@/components/ui";
import { useT } from "@/lib/i18n";
import {
  CBAM_FIELDS,
  cbamCellKey,
  cbamOptionLabel,
  type CbamField,
  type CbamItemId,
} from "@/lib/cbam/template-fields";
import { summariseCbam, type CbamRowState } from "@/lib/cbam/cbam-tab";

const ITEM_LABEL: Record<CbamItemId, string> = {
  installation: "Installation",
  goods: "Goods",
  direct: "Direct emissions",
  indirect: "Indirect emissions",
  precursors: "Precursors",
  "carbon-price": "Carbon price",
  monitoring: "Monitoring",
  communication: "Communication",
  verification: "Verification",
};

const STATE_CHIP: Record<
  CbamRowState,
  { tone: "ok" | "err" | "muted"; label: string }
> = {
  filled: { tone: "ok", label: "Filled" },
  missing: { tone: "err", label: "Missing" },
  optional: { tone: "muted", label: "Optional" },
};

const ROW_TINT: Record<CbamRowState, string> = {
  filled: "border-l-[#16a34a] bg-[#f0fdf4]/60",
  missing: "border-l-[#dc2626] bg-[#fef2f2]/70",
  optional: "border-l-transparent",
};

export function CbamTab({
  cells,
  fillHref,
  onEdit,
}: {
  cells: Record<string, string>;
  /** The fill-in form for an item; without it the tab offers no link. */
  fillHref?: (item: CbamItemId) => string;
  /** Saves one cell ("cbam:0:<field id>"); an empty value clears it. Without it values are read-only. */
  onEdit?: (cellKey: string, value: string) => void;
}) {
  const t = useT();
  const summary = React.useMemo(() => summariseCbam(cells), [cells]);

  if (CBAM_FIELDS.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-black/45">
          {t("No CBAM fields configured")}
        </p>
      </Card>
    );
  }

  const percent =
    summary.total === 0
      ? 0
      : Math.round((summary.filled / summary.total) * 100);

  return (
    <div className="space-y-4 p-4">
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-[15px] font-medium text-[#111]">
            {t("CBAM report fields")}
          </div>
          <div className="font-mono text-[13px] text-black/60">
            {t("{filled} of {total} required filled", {
              filled: summary.filled,
              total: summary.total,
            })}
          </div>
        </div>
        <Progress value={percent} />
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone={summary.missing === 0 ? "ok" : "muted"}>
            {summary.missing === 0
              ? t("All required fields filled")
              : t("{n} missing", { n: summary.missing })}
          </Chip>
        </div>
        <ul className="grid gap-x-6 gap-y-1.5 text-[12.5px] sm:grid-cols-2 lg:grid-cols-3">
          {summary.byItem.map((c) => (
            <li
              key={c.item}
              className="flex items-center justify-between gap-3 border-b border-black/[0.06] py-1"
            >
              <span className="text-black/65">
                {t(ITEM_LABEL[c.item as CbamItemId] ?? c.item)}
              </span>
              <span className="flex items-center gap-2">
                {fillHref && c.filled < c.total && (
                  <Link
                    href={fillHref(c.item as CbamItemId)}
                    className="inline-flex items-center gap-1 text-[12px] text-black/55 underline-offset-2 hover:text-black hover:underline"
                  >
                    <PencilLine size={12} strokeWidth={1.5} />
                    {t("Fill in")}
                  </Link>
                )}
                <span
                  className={cn(
                    "font-mono",
                    c.filled === c.total
                      ? "text-emerald-700"
                      : "text-[#b91c1c]",
                  )}
                >
                  {c.filled}/{c.total}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {summary.sections.map((sec) => (
        <Card key={sec.section} className="overflow-hidden p-0">
          <h3 className="border-b border-black/[0.07] bg-[#faf9f7] px-5 py-2.5 text-[13px] font-medium text-[#111]">
            {t(sec.section)}
          </h3>
          <ul className="divide-y divide-black/[0.06]">
            {sec.rows.map(({ field, value, state }) => (
              <li
                key={field.id}
                className={cn(
                  "grid gap-1 border-l-2 px-5 py-2.5 text-[13px] sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_auto] sm:items-center sm:gap-4",
                  ROW_TINT[state],
                )}
              >
                <div className="min-w-0">
                  <div className="text-[#111]">{t(field.label)}</div>
                  <div className="font-mono text-[11px] text-black/40">{`${field.sheet}!${field.cell}`}</div>
                </div>
                <CbamValue
                  field={field}
                  value={value}
                  state={state}
                  onSave={
                    onEdit ? (v) => onEdit(cbamCellKey(field), v) : undefined
                  }
                />
                <div>
                  <Chip
                    tone={STATE_CHIP[state].tone}
                    filled={state !== "optional"}
                  >
                    {t(STATE_CHIP[state].label)}
                  </Chip>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}

/** One field's value: text until clicked, then an input of the field's kind. */
function CbamValue({
  field,
  value,
  state,
  onSave,
}: {
  field: CbamField;
  value: string;
  state: CbamRowState;
  onSave?: (value: string) => void;
}) {
  const t = useT();
  const [draft, setDraft] = React.useState<string | null>(null);
  const [error, setError] = React.useState(false);
  const label = t(field.label);

  const shownText =
    state === "filled"
      ? field.kind === "select"
        ? cbamOptionLabel(field, value)
        : value
      : state === "optional"
        ? t("Not required")
        : t("Missing");
  const text = (
    <>
      {shownText}
      {state === "filled" && field.unit && (
        <span className="ml-1 text-black/40">{field.unit}</span>
      )}
    </>
  );
  const tone =
    state === "filled"
      ? "text-black/80"
      : state === "missing"
        ? "text-[#b91c1c]"
        : "text-black/40";

  if (!onSave)
    return <div className={cn("min-w-0 break-words", tone)}>{text}</div>;

  const save = (v: string) => {
    const next = v.trim();
    // A number field keeps its draft open on a value that is not a number, rather than storing it.
    if (
      field.kind === "number" &&
      next !== "" &&
      !Number.isFinite(Number(next))
    ) {
      setError(true);
      return;
    }
    setDraft(null);
    setError(false);
    if (next !== value.trim()) onSave(next);
  };

  if (draft === null)
    return (
      <button
        type="button"
        onClick={() => setDraft(value)}
        aria-label={t("Edit {field}", { field: label })}
        className={cn(
          "-mx-1.5 min-w-0 cursor-text break-words rounded px-1.5 py-0.5 text-left hover:bg-black/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#111]",
          tone,
        )}
      >
        {text}
      </button>
    );

  const common = {
    autoFocus: true,
    "aria-label": label,
    "aria-invalid": error || undefined,
    className: cn(
      "h-8 w-full min-w-0 rounded-md border bg-white px-2 text-[13px] text-[#111] outline-none focus:border-black/40",
      error ? "border-[#dc2626]" : "border-black/15",
    ),
    onKeyDown: (
      e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setDraft(null);
        setError(false);
      } else if (e.key === "Enter") {
        e.preventDefault();
        save(e.currentTarget.value);
      }
    },
  };

  return (
    <div className="min-w-0">
      {field.kind === "select" ? (
        <select
          {...common}
          value={draft}
          onChange={(e) => save(e.target.value)}
          onBlur={() => setDraft(null)}
        >
          <option value="">—</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {cbamOptionLabel(field, o)}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...common}
          type={field.kind === "date" ? "date" : "text"}
          inputMode={field.kind === "number" ? "decimal" : undefined}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setError(false);
          }}
          onBlur={(e) => save(e.target.value)}
        />
      )}
      {error && (
        <p className="mt-1 text-[11.5px] text-[#b91c1c]">
          {t("Enter a number.")}
        </p>
      )}
    </div>
  );
}
