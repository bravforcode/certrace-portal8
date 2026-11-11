"use client";

import { Chip, cn } from "@/components/ui";
import { useFormat, useT } from "@/lib/i18n";
import type { Declaration, DeclarationStep } from "@/lib/data";
import { getStandard } from "@/lib/convert-standards";

const STEP_LABEL: Record<DeclarationStep, string> = {
  collect: "Collecting data",
  calculate: "Calculating",
  comply: "Checking compliance",
  review: "In review",
  report: "Writing the report",
  submit: "Submitted",
  done: "Done",
};

/* The converted reports: one row per declaration, with where it stands. A
   declaration has no file to download, so the row carries only what it knows. */
export function DeclarationRows({ items }: { items: Declaration[] }) {
  const t = useT();
  const { date } = useFormat();
  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.08] bg-white">
      {items.map((d, i) => (
        <div
          key={d.id}
          className={cn(
            "flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center",
            i > 0 && "border-t border-black/[0.06]",
          )}
        >
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] text-black/85">{d.title ?? d.name}</div>
            <div className="mt-0.5 text-[12px] text-black/40">
              {[
                getStandard(d.regulation)?.name,
                d.period,
                (d.createdAt ?? d.updatedAt) &&
                  `${t("Generated")} ${date(d.createdAt ?? d.updatedAt!)}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
          <Chip tone={d.step === "done" || d.step === "submit" ? "ok" : "warn"}>
            {t(STEP_LABEL[d.step])}
          </Chip>
        </div>
      ))}
    </div>
  );
}
