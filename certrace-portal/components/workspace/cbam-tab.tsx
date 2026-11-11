"use client";

/* ════════════════════════════════════════════════════════════
   THE CBAM TAB — the workbook's checklist of every CBAM template field

   Read-only. A summary (required fields filled, per item) and then the fields
   grouped by section, each with its template reference (sheet!cell), its value
   or "Missing", and its unit. The answers are written from Convert (the fill-in
   form and Smart Link); this tab only shows what is there. The counting is
   lib/cbam/cbam-tab.ts.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Card, Chip, Progress, cn } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { CBAM_FIELDS, type CbamItemId } from "@/lib/cbam/template-fields";
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

const STATE_CHIP: Record<CbamRowState, { tone: "ok" | "muted"; label: string }> = {
  filled: { tone: "ok", label: "Filled" },
  missing: { tone: "muted", label: "Missing" },
  optional: { tone: "muted", label: "Optional" },
};

export function CbamTab({ cells }: { cells: Record<string, string> }) {
  const t = useT();
  const summary = React.useMemo(() => summariseCbam(cells), [cells]);

  if (CBAM_FIELDS.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-black/45">{t("No CBAM fields configured")}</p>
      </Card>
    );
  }

  const percent = summary.total === 0 ? 0 : Math.round((summary.filled / summary.total) * 100);

  return (
    <div className="space-y-4 p-4">
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-[15px] font-medium text-[#111]">{t("CBAM report fields")}</div>
          <div className="font-mono text-[13px] text-black/60">
            {t("{filled} of {total} required filled", { filled: summary.filled, total: summary.total })}
          </div>
        </div>
        <Progress value={percent} />
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone={summary.missing === 0 ? "ok" : "muted"}>
            {summary.missing === 0 ? t("All required fields filled") : t("{n} missing", { n: summary.missing })}
          </Chip>
        </div>
        <ul className="grid gap-x-6 gap-y-1.5 text-[12.5px] sm:grid-cols-2 lg:grid-cols-3">
          {summary.byItem.map((c) => (
            <li key={c.item} className="flex items-center justify-between gap-3 border-b border-black/[0.06] py-1">
              <span className="text-black/65">{t(ITEM_LABEL[c.item as CbamItemId] ?? c.item)}</span>
              <span className={cn("font-mono", c.filled === c.total ? "text-emerald-700" : "text-black/55")}>
                {c.filled}/{c.total}
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
              <li key={field.id} className="grid gap-1 px-5 py-2.5 text-[13px] sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_auto] sm:items-center sm:gap-4">
                <div className="min-w-0">
                  <div className="text-[#111]">{t(field.label)}</div>
                  <div className="font-mono text-[11px] text-black/40">{`${field.sheet}!${field.cell}`}</div>
                </div>
                <div className={cn("min-w-0 break-words", state === "filled" ? "text-black/80" : "text-black/40")}>
                  {state === "filled" ? value : state === "optional" ? t("Not required") : t("Missing")}
                  {state === "filled" && field.unit && <span className="ml-1 text-black/40">{field.unit}</span>}
                </div>
                <div>
                  <Chip tone={STATE_CHIP[state].tone} filled={state === "filled"}>
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
