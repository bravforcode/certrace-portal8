"use client";

/* ════════════════════════════════════════════════════════════
   THE CBAM TAB — the workbook's checklist of every CBAM template field

   Read-only. A summary (required fields filled, per item) and then the fields
   grouped by section, each with its template reference (sheet!cell), its value
   or "Missing", and its unit. Rows are tinted by state: red while a required
   field is missing, green once filled. The answers are written from the fill-in
   form (each unfinished item links to it) and Smart Links. The counting is
   lib/cbam/cbam-tab.ts.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { PencilLine } from "lucide-react";
import { Card, Chip, Progress, cn } from "@/components/ui";
import { useT } from "@/lib/i18n";
import {
  CBAM_FIELDS,
  cbamOptionLabel,
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
}: {
  cells: Record<string, string>;
  /** The fill-in form for an item; without it the tab offers no link. */
  fillHref?: (item: CbamItemId) => string;
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
                <div
                  className={cn(
                    "min-w-0 break-words",
                    state === "filled"
                      ? "text-black/80"
                      : state === "missing"
                        ? "text-[#b91c1c]"
                        : "text-black/40",
                  )}
                >
                  {state === "filled"
                    ? field.kind === "select"
                      ? cbamOptionLabel(field, value)
                      : value
                    : state === "optional"
                      ? t("Not required")
                      : t("Missing")}
                  {state === "filled" && field.unit && (
                    <span className="ml-1 text-black/40">{field.unit}</span>
                  )}
                </div>
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
