"use client";

/* ════════════════════════════════════════════════════════════
   WASTE GASES BY GAS — volume and composition, and the energy follows

   Annex IV item 17 asks for a balance of waste gases in energy: what came in,
   what the installation made, what it used, what left. A works that runs a
   blast furnace or a coke oven does not meter energy; it meters volume, and
   knows the composition from the gas chromatograph. So each row is one gas in
   one direction — blast-furnace gas produced, coke-oven gas used here — with its
   volume in Nm³ and its composition. The row's calorific value is the plant's
   own when it gives one, otherwise worked out from the composition (CO, H₂ and
   CH₄ are what burn), otherwise the typical value for that gas — and which of
   the three it was is printed on the row. The four flows of the balance are the
   sums of the rows (lib/monthly-inputs.ts, `deriveMonth`).
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Plus } from "lucide-react";
import { Button, NumberInput, inputClass } from "@/components/ui";
import { Select } from "@/components/controls";
import { TaggedField } from "@/components/precursor/annex-fields";
import { RowCard, anchor } from "@/components/supplier/month-pieces";
import { fmt } from "@/components/workspace/chrome";
import { WASTE_GAS_FLOW_LABEL, WASTE_GAS_LABEL, compositionSum, wasteGasGj, wasteGasNcv, wasteGasProblem, type WasteGasFlow, type WasteGasKind, type WasteGasRow } from "@/lib/monthly-inputs";
import { uid } from "@/lib/monthly-data";
import { useT } from "@/lib/i18n";

const FROM: Record<ReturnType<typeof wasteGasNcv>["from"], string> = {
  entered: "your own value",
  composition: "worked out from the composition",
  typical: "the typical value for this gas",
  none: "not known yet",
};

export function WasteGasRows({ rows, onChange, readOnly }: { rows: WasteGasRow[]; onChange: (next: WasteGasRow[]) => void; readOnly: boolean }) {
  const t = useT();
  const set = (id: string, p: Partial<WasteGasRow>) => onChange(rows.map((r) => (r.id === id ? { ...r, ...p } : r)));
  return (
    <div className="space-y-3">
      {rows.map((r, i) => {
        const ncv = wasteGasNcv(r);
        const problem = r.volumeNm3 != null || r.coPct != null ? wasteGasProblem(r) : null;
        return (
          <RowCard key={r.id} title={`${t("Gas")} ${i + 1}`} removeLabel={`${t("Remove gas")} ${i + 1}`} onRemove={readOnly ? undefined : () => onChange(rows.filter((x) => x.id !== r.id))}>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <TaggedField tag="17" need="required" label={t("Which gas")}>
                <Select
                  value={r.gas}
                  onChange={(v) => set(r.id, { gas: v as WasteGasKind })}
                  options={(Object.keys(WASTE_GAS_LABEL) as WasteGasKind[]).map((g) => ({ value: g, label: t(WASTE_GAS_LABEL[g]) }))}
                  disabled={readOnly}
                  ariaLabel={t("Waste gas")}
                />
              </TaggedField>
              {r.gas === "other" && (
                <TaggedField id={anchor(`wasteGas:${r.id}`)} tag="17" need="required" label={t("Name of the gas")}>
                  <input className={inputClass} value={r.label ?? ""} disabled={readOnly} onChange={(e) => set(r.id, { label: e.target.value })} placeholder={t("Corex export gas")} />
                </TaggedField>
              )}
              <TaggedField tag="17" need="required" label={t("What happened to it")}>
                <Select
                  value={r.flow}
                  onChange={(v) => set(r.id, { flow: v as WasteGasFlow })}
                  options={(Object.keys(WASTE_GAS_FLOW_LABEL) as WasteGasFlow[]).map((f) => ({ value: f, label: t(WASTE_GAS_FLOW_LABEL[f]) }))}
                  disabled={readOnly}
                  ariaLabel={t("Flow")}
                />
              </TaggedField>
              <TaggedField id={r.gas === "other" ? undefined : anchor(`wasteGas:${r.id}`)} tag="17" need="required" label={t("Volume")} hint={t("Nm³ in the month.")}>
                <NumberInput value={r.volumeNm3} min={0} unit="Nm³" disabled={readOnly} onChange={(v) => set(r.id, { volumeNm3: v })} ariaLabel={t("Volume")} placeholder="48000000" />
              </TaggedField>
              <TaggedField tag="17" need="optional" label={t("Calorific value")} hint={t("Leave empty to use the composition, or the typical value.")}>
                <NumberInput value={r.ncvMjPerNm3} min={0} unit="MJ/Nm³" disabled={readOnly} onChange={(v) => set(r.id, { ncvMjPerNm3: v })} ariaLabel={t("Calorific value")} placeholder={ncv.value != null ? fmt(ncv.value, 2) : undefined} />
              </TaggedField>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <TaggedField tag="17" need="optional" label="CO" hint={t("% by volume")}>
                <NumberInput value={r.coPct} min={0} max={100} unit="%" disabled={readOnly} onChange={(v) => set(r.id, { coPct: v })} ariaLabel="CO" placeholder="22" />
              </TaggedField>
              <TaggedField tag="17" need="optional" label="CO₂" hint={t("% by volume")}>
                <NumberInput value={r.co2Pct} min={0} max={100} unit="%" disabled={readOnly} onChange={(v) => set(r.id, { co2Pct: v })} ariaLabel="CO2" placeholder="22" />
              </TaggedField>
              <TaggedField tag="17" need="optional" label="H₂" hint={t("% by volume")}>
                <NumberInput value={r.h2Pct} min={0} max={100} unit="%" disabled={readOnly} onChange={(v) => set(r.id, { h2Pct: v })} ariaLabel="H2" placeholder="3" />
              </TaggedField>
              <TaggedField tag="17" need="optional" label="CH₄" hint={t("% by volume")}>
                <NumberInput value={r.ch4Pct} min={0} max={100} unit="%" disabled={readOnly} onChange={(v) => set(r.id, { ch4Pct: v })} ariaLabel="CH4" placeholder="0.5" />
              </TaggedField>
            </div>
            <p className={problem ? "mt-3 text-[12px] text-[#b45309]" : "mt-3 text-[12px] text-black/50"}>
              {problem ? (
                t(problem)
              ) : (
                <>
                  {t("Energy:")} <span className="font-mono text-black/75">{fmt(wasteGasGj(r), 1)} GJ</span>
                  {ncv.value != null && (
                    <>
                      {" · "}
                      {fmt(ncv.value, 2)} MJ/Nm³, {t(FROM[ncv.from])}
                    </>
                  )}
                  {compositionSum(r) > 0 && compositionSum(r) < 100 && (
                    <>
                      {" · "}
                      {fmt(100 - compositionSum(r), 1)} % {t("other (N₂ and the rest)")}
                    </>
                  )}
                </>
              )}
            </p>
          </RowCard>
        );
      })}
      {!readOnly && (
        <Button size="sm" variant="secondary" onClick={() => onChange([...rows, { id: uid(), gas: "bfg", flow: "produced" }])}>
          <Plus size={12} strokeWidth={1.5} /> {t("Add a gas")}
        </Button>
      )}
    </div>
  );
}
