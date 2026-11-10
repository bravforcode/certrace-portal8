"use client";

/* ════════════════════════════════════════════════════════════
   SCRAP BY DELIVERY — who sold it, what grade, and where it came from

   Annex IV item 35 asks for the scrap used per tonne of product and the share
   of it that is pre-consumer. A plant that buys scrap from several yards knows
   both from its delivery tickets, not from one number — so it can list the
   deliveries, and the month's scrap tonnes and pre-consumer tonnes are then
   WORKED OUT from them (lib/monthly-inputs.ts, `deriveMonth`) instead of typed
   a second time. The verifier gets the table: supplier, grade, origin, tonnes.

   Optional. A plant that keeps one monthly figure keeps typing it above.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Plus } from "lucide-react";
import { Button, NumberInput, inputClass } from "@/components/ui";
import { Select } from "@/components/controls";
import { TaggedField } from "@/components/precursor/annex-fields";
import { RowCard, anchor } from "@/components/supplier/month-pieces";
import { fmt } from "@/components/workspace/chrome";
import {
  SCRAP_ORIGIN_LABEL,
  scrapDeliveryProblem,
  scrapDeliveryTotals,
  type ScrapDelivery,
  type ScrapMaterial,
  type ScrapOrigin,
} from "@/lib/monthly-inputs";
import { uid, type MonthlyEntry } from "@/lib/monthly-data";
import { useT } from "@/lib/i18n";

export function ScrapDeliveries({
  material,
  entry,
  onChange,
  readOnly,
}: {
  material: ScrapMaterial;
  entry: MonthlyEntry;
  /** the full list, every material's, so a patch never drops another row's deliveries */
  onChange: (next: ScrapDelivery[], added?: boolean) => void;
  readOnly: boolean;
}) {
  const t = useT();
  const all = entry.scrapDeliveries ?? [];
  const mine = all.filter((d) => d.material === material);
  const totals = scrapDeliveryTotals(all, material);
  const [open, setOpen] = React.useState(mine.length > 0);

  const set = (id: string, p: Partial<ScrapDelivery>) =>
    onChange(all.map((d) => (d.id === id ? { ...d, ...p } : d)));
  const add = () => {
    setOpen(true);
    onChange(
      [
        ...all,
        {
          id: uid(),
          material,
          supplier: "",
          grade: "",
          origin: "post_consumer",
        },
      ],
      true,
    );
  };

  if (!open && mine.length === 0) {
    return readOnly ? null : (
      <button
        type="button"
        onClick={add}
        className="mt-3 text-[12.5px] text-black/55 underline decoration-black/20 underline-offset-2 hover:text-black"
      >
        {t("Record it by delivery — supplier, grade and origin")}
      </button>
    );
  }

  return (
    <div className="mt-4 border-t border-black/[0.06] pt-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/40">
          {t("Scrap by delivery")}
        </p>
        {!readOnly && (
          <Button size="sm" variant="secondary" onClick={add}>
            <Plus size={12} strokeWidth={1.5} /> {t("Add a delivery")}
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {mine.map((d, i) => (
          <RowCard
            key={d.id}
            title={`${t("Delivery")} ${i + 1}`}
            removeLabel={`${t("Remove delivery")} ${i + 1}`}
            onRemove={
              readOnly
                ? undefined
                : () => onChange(all.filter((x) => x.id !== d.id))
            }
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <TaggedField
                id={anchor(`scrapDelivery:${d.id}`)}
                tag="35"
                need="optional"
                label={t("Supplier")}
              >
                <input
                  className={inputClass}
                  value={d.supplier}
                  disabled={readOnly}
                  onChange={(e) => set(d.id, { supplier: e.target.value })}
                  placeholder={t("Rayong Metals Co.")}
                />
              </TaggedField>
              <TaggedField
                tag="35"
                need="optional"
                label={t("Grade")}
                hint={t("As the supplier sells it.")}
              >
                <input
                  className={inputClass}
                  value={d.grade}
                  disabled={readOnly}
                  onChange={(e) => set(d.id, { grade: e.target.value })}
                  placeholder="HMS 1&2"
                />
              </TaggedField>
              <TaggedField tag="35" need="optional" label={t("Origin")}>
                <Select
                  value={d.origin}
                  onChange={(v) => set(d.id, { origin: v as ScrapOrigin })}
                  options={(
                    Object.keys(SCRAP_ORIGIN_LABEL) as ScrapOrigin[]
                  ).map((o) => ({ value: o, label: t(SCRAP_ORIGIN_LABEL[o]) }))}
                  disabled={readOnly}
                  ariaLabel={t("Scrap origin")}
                />
              </TaggedField>
              <TaggedField tag="35" need="optional" label={t("Tonnes")}>
                <NumberInput
                  value={d.tonnes}
                  min={0}
                  unit="t"
                  disabled={readOnly}
                  onChange={(v) => set(d.id, { tonnes: v })}
                  ariaLabel={t("Tonnes delivered")}
                />
              </TaggedField>
            </div>
            {scrapDeliveryProblem(d) && d.tonnes != null && (
              <p className="mt-3 text-[12px] text-[#b45309]">
                {t(scrapDeliveryProblem(d)!)}
              </p>
            )}
          </RowCard>
        ))}
      </div>
      {totals.count > 0 && (
        <p className="mt-3 text-[12px] text-black/50">
          {t("From the deliveries:")}{" "}
          <span className="font-mono text-black/75">
            {fmt(totals.tonnes, 3)} t
          </span>{" "}
          {t("in all")}
          {totals.tonnes > 0 && (
            <>
              {" · "}
              <span className="font-mono text-black/75">
                {fmt((totals.preConsumerT / totals.tonnes) * 100, 1)} %
              </span>{" "}
              {t("pre-consumer")}
            </>
          )}
        </p>
      )}
    </div>
  );
}
