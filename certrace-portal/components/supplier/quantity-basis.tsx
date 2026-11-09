"use client";

/* ════════════════════════════════════════════════════════════
   HOW A QUANTITY IS FOUND — one meter, a stock change, or a share of a meter

   Most rows are read off one meter or one invoice, and say so by having a
   quantity box. Two other ways of arriving at the same quantity are common
   enough to be asked for:

     From deliveries and stock   (Annex II B.4.1)
         What was burned is what was delivered, plus what was in the tank at the
         start of the month, minus what is left at the end. Plants that buy in
         lots and draw down a stock have no meter on the consumption.

     A share of a shared meter   (Annex IV items 26 · 29 · 30)
         One meter feeds several product reports. The whole meter's reading is
         entered once, with the allocation key — tonnes made, energy burned, or a
         share the plant sets — and this good takes its part.

   Either way the row's quantity is WORKED OUT (lib/monthly-inputs.ts,
   `deriveMonth`); the quantity box turns read-only and says where it comes
   from. Choosing "one meter" again keeps the figure and lets it be typed.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { NumberInput, inputClass, cn } from "@/components/ui";
import { Select } from "@/components/controls";
import { TaggedField } from "@/components/precursor/annex-fields";
import { fmt } from "@/components/workspace/chrome";
import { anchor } from "@/components/supplier/month-pieces";
import { suggestShare } from "@/lib/shared-meter";
import { consumedFromStock, quantityBasisOf, sharedFraction, sharedProblem, stockProblem, SHARED_KEY_LABEL, type QuantityBasis as Basis, type SharedKey, type SharedMeter, type StockChange } from "@/lib/monthly-inputs";
import type { MonthlyEntry } from "@/lib/monthly-data";
import { useT } from "@/lib/i18n";

export type BasisPatch = { stock?: StockChange; shared?: SharedMeter };

export function QuantityBasis({
  stock,
  shared,
  onChange,
  unit,
  readOnly,
  allowShared = true,
  allowStock = true,
  compact = false,
  stockTag = "16(a)",
  sharedTag = "29 · 30",
  workspaceId,
  entry,
  fieldKey,
}: {
  stock?: StockChange;
  shared?: SharedMeter;
  onChange: (p: BasisPatch) => void;
  /** the row's own unit, as printed: "m³", "t", "MWh" */
  unit: string;
  readOnly: boolean;
  /** a material or a fuel can be shared; a flux is not */
  allowShared?: boolean;
  /** electricity is not drawn down from a stock */
  allowStock?: boolean;
  /** an unused guided row: a quiet link instead of a field, until the plant says its quantity is worked out */
  compact?: boolean;
  stockTag?: string;
  sharedTag?: string;
  /** needed only where the row can be a share of a shared meter */
  workspaceId?: string;
  entry?: MonthlyEntry;
  /** the row's anchor key — the quality check scrolls to `…:stock` / `…:shared` */
  fieldKey: string;
}) {
  const t = useT();
  const basis: Basis = quantityBasisOf({ stock, shared });

  const options: { value: Basis; label: string; hint?: string }[] = [
    { value: "reading", label: t("One meter or invoice"), hint: t("The quantity is read off a single figure") },
    ...(allowStock ? [{ value: "stock" as Basis, label: t("Deliveries and stock"), hint: t("Delivered + stock at the start − stock at the end") }] : []),
    ...(allowShared ? [{ value: "shared" as Basis, label: t("A share of a shared meter"), hint: t("One meter feeds several product reports") }] : []),
  ];
  const choose = (b: Basis) => {
    if (b === basis) return;
    if (b === "reading") onChange({ stock: undefined, shared: undefined });
    else if (b === "stock") onChange({ stock: {}, shared: undefined });
    else onChange({ stock: undefined, shared: { meter: "", key: "production" } });
  };

  // A row nobody has started yet offers the option as a link, so twenty empty rows do not carry twenty extra boxes.
  if (compact && basis === "reading") {
    return readOnly ? null : (
      <button type="button" onClick={() => choose("stock")} className="mt-3 text-[12.5px] text-black/55 underline decoration-black/20 underline-offset-2 hover:text-black">
        {t("Work it out from deliveries and stock")}
      </button>
    );
  }

  const sp = stockProblem(stock);
  const hp = sharedProblem(shared);

  return (
    <div className="mt-4 border-t border-black/[0.06] pt-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TaggedField tag={basis === "shared" ? sharedTag : stockTag} need="optional" label={t("How the quantity is found")}>
          <Select value={basis} onChange={(v) => choose(v as Basis)} options={options} disabled={readOnly} ariaLabel={t("How the quantity is found")} />
        </TaggedField>

        {basis === "stock" && (
          <>
            <TaggedField id={anchor(`${fieldKey}:stock`)} tag={stockTag} need="required" label={t("Delivered in the month")}>
              <NumberInput value={stock?.delivered} min={0} unit={unit} disabled={readOnly} onChange={(v) => onChange({ stock: { ...stock, delivered: v } })} ariaLabel={t("Delivered")} />
            </TaggedField>
            <TaggedField tag={stockTag} need="required" label={t("Stock at the start")} hint={t("What was in the tank or yard on the 1st.")}>
              <NumberInput value={stock?.opening} min={0} unit={unit} disabled={readOnly} onChange={(v) => onChange({ stock: { ...stock, opening: v } })} ariaLabel={t("Opening stock")} />
            </TaggedField>
            <TaggedField tag={stockTag} need="required" label={t("Stock at the end")} hint={t("What was left on the last day.")}>
              <NumberInput value={stock?.closing} min={0} unit={unit} disabled={readOnly} onChange={(v) => onChange({ stock: { ...stock, closing: v } })} ariaLabel={t("Closing stock")} />
            </TaggedField>
          </>
        )}
      </div>

      {basis === "stock" && (
        <p className={cn("mt-3 text-[12px]", sp && (stock?.delivered != null || stock?.opening != null || stock?.closing != null) ? "text-[#b45309]" : "text-black/50")}>
          {sp && (stock?.delivered != null || stock?.opening != null || stock?.closing != null) ? (
            t(sp)
          ) : (
            <>
              {t("Used this month:")} <span className="font-mono text-black/75">{fmt(consumedFromStock(stock), 3)} {unit}</span>
            </>
          )}
        </p>
      )}

      {basis === "shared" && shared && workspaceId && entry && <SharedFields shared={shared} onChange={(s) => onChange({ shared: s })} unit={unit} readOnly={readOnly} tag={sharedTag} workspaceId={workspaceId} entry={entry} fieldKey={fieldKey} problem={hp} />}
    </div>
  );
}

function SharedFields({
  shared,
  onChange,
  unit,
  readOnly,
  tag,
  workspaceId,
  entry,
  fieldKey,
  problem,
}: {
  shared: SharedMeter;
  onChange: (s: SharedMeter) => void;
  unit: string;
  readOnly: boolean;
  tag: string;
  workspaceId: string;
  entry: MonthlyEntry;
  fieldKey: string;
  problem: string | null;
}) {
  const t = useT();
  const set = (p: Partial<SharedMeter>) => onChange({ ...shared, ...p });
  const manual = shared.key === "manual";
  const keyUnit = shared.key === "energy" ? "GJ" : "t";
  const suggestion = React.useMemo(
    () => (manual ? null : suggestShare(workspaceId, entry, shared.key as "production" | "energy")),
    // The suggestion is read from the stored months of the other reports and this month as it stands.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workspaceId, entry.month, entry.productionTonnes, entry.fuels, shared.key, manual],
  );
  const fraction = sharedFraction(shared);

  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TaggedField id={anchor(`${fieldKey}:shared`)} tag={tag} need="required" label={t("Meter")} hint={t("Its name or tag.")}>
          <input className={inputClass} value={shared.meter} disabled={readOnly} onChange={(e) => set({ meter: e.target.value })} placeholder={t("Main incomer E-221")} />
        </TaggedField>
        <TaggedField tag={tag} need="required" label={t("The whole meter's reading")} hint={t("For the month, across every product it feeds.")}>
          <NumberInput value={shared.reading} min={0} unit={unit} disabled={readOnly} onChange={(v) => set({ reading: v })} ariaLabel={t("Whole meter reading")} />
        </TaggedField>
        <TaggedField tag={tag} need="required" label={t("Split by")} hint={t("The allocation key. A verifier recomputes the share from it.")}>
          <Select
            value={shared.key}
            onChange={(v) => set({ key: v as SharedKey, thisValue: undefined, totalValue: undefined })}
            options={(Object.keys(SHARED_KEY_LABEL) as SharedKey[]).map((k) => ({ value: k, label: t(SHARED_KEY_LABEL[k]) }))}
            disabled={readOnly}
            ariaLabel={t("Allocation key")}
          />
        </TaggedField>
        {manual ? (
          <TaggedField tag={tag} need="required" label={t("This good's share")} hint={t("Between 0 and 100 %.")}>
            <NumberInput value={shared.manualPct} min={0} max={100} unit="%" disabled={readOnly} onChange={(v) => set({ manualPct: v })} ariaLabel={t("Share of the meter")} />
          </TaggedField>
        ) : (
          <>
            <TaggedField tag={tag} need="required" label={shared.key === "energy" ? t("Energy burned for this good") : t("Tonnes of this good")}>
              <NumberInput value={shared.thisValue} min={0} unit={keyUnit} disabled={readOnly} onChange={(v) => set({ thisValue: v })} ariaLabel={t("This good's value of the key")} />
            </TaggedField>
            <TaggedField tag={tag} need="required" label={t("Total across the products the meter feeds")}>
              <NumberInput value={shared.totalValue} min={0} unit={keyUnit} disabled={readOnly} onChange={(v) => set({ totalValue: v })} ariaLabel={t("Total of the key")} />
            </TaggedField>
          </>
        )}
      </div>

      {!manual && suggestion && !readOnly && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white px-4 py-3 text-[12px] text-black/55">
          <span className="min-w-0 flex-1">
            {suggestion.parts.map((p, i) => (
              <span key={p.name + i}>
                {i > 0 && " · "}
                <span className={p.self ? "text-black/80" : undefined}>
                  {t(p.name)} {fmt(p.value, 1)} {keyUnit}
                </span>
              </span>
            ))}
          </span>
          <button
            type="button"
            onClick={() => set({ thisValue: suggestion.thisValue, totalValue: suggestion.totalValue })}
            className="whitespace-nowrap text-black/60 underline decoration-black/20 underline-offset-2 hover:text-black"
          >
            {t("Fill from the other product reports")}
          </button>
        </div>
      )}

      <p className={cn("text-[12px]", problem ? "text-[#b45309]" : "text-black/50")}>
        {problem ? (
          t(problem)
        ) : (
          <>
            {t("This good's share:")} <span className="font-mono text-black/75">{fmt((fraction ?? 0) * 100, 2)} %</span> {" · "}
            {t("takes")} <span className="font-mono text-black/75">{fmt((fraction ?? 0) * (shared.reading ?? 0), 3)} {unit}</span>
          </>
        )}
      </p>
    </div>
  );
}
