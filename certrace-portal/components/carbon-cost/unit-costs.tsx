"use client";

/* ════════════════════════════════════════════════════════════
   CARBON & COST — WHAT ONE UNIT COSTS

   The finance question that follows the carbon one: per tonne, or per piece,
   what does the energy cost, what does the carbon cost, and what does the good
   sell for? From that, how much of the price the first two take.

   Energy is the plant's own consumption (from the months it submitted) at the
   exporter's own prices; carbon is the certificate cost from the model, with
   the plant's data and on the EU default; the price is the exporter's. None of
   the prices is in the regulation, so none is guessed: a missing price leaves
   its figure as a dash and says which one to add.

   The prices stay with the exporter. They are not part of any link a plant or
   a precursor supplier opens (see lib/unit-costs.ts).
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Pencil } from "lucide-react";
import { AutoSaveBadge, NumberInput, cn, useAutoSave } from "@/components/ui";
import { Panel, Segmented, TH } from "@/components/insight/kit";
import { useLanguage, useT } from "@/lib/i18n";
import { fuelTypeLabelIn } from "@/lib/monthly-data";
import type { CostEnv, PricedRow } from "@/lib/cbam/carbon-cost-model";
import { unitCostsOf } from "@/lib/cbam/carbon-cost-model";
import { setAnnualExportVolume } from "@/lib/cbam/export-volumes";
import { saveUnitCosts } from "@/lib/unit-costs";
import type { useMoney } from "./money";

type Money = ReturnType<typeof useMoney>;
export type UnitBasis = "tonne" | "piece";

const COLORS = {
  energy: "#3C7ACB",
  carbon: "#047857",
  rest: "rgba(17,17,17,0.10)",
};

export function UnitCostCard({
  rows,
  env,
  money,
  basis,
  onBasis,
  onSaved,
}: {
  rows: PricedRow[];
  env: CostEnv;
  money: Money;
  basis: UnitBasis;
  onBasis: (b: UnitBasis) => void;
  onSaved: () => void;
}) {
  const t = useT();
  const [open, setOpen] = React.useState<string | null>(null);
  const withProduction = rows.filter((r) => r.see != null);

  /* Tonne-weighted across the products in view: a plain average would let a product made in tens of tonnes weigh as much as one made in
     thousands. Only products that HAVE the figure take part in it, and the line says how many. */
  const avg = (pick: (r: PricedRow) => number | null) => {
    let sum = 0;
    let w = 0;
    let n = 0;
    for (const r of withProduction) {
      const v = pick(r);
      if (v == null) continue;
      sum += v * r.tonnes;
      w += r.tonnes;
      n += 1;
    }
    return w > 0 ? { v: sum / w, n } : null;
  };
  const per = (r: PricedRow) => unitCostsOf(r, env, basis);
  const sEnergy = avg((r) => per(r)?.energyThb ?? null);
  const sCarbon = avg((r) => per(r)?.carbonThb ?? null);
  const sPrice = avg((r) => per(r)?.priceThb ?? null);
  const sShare =
    sEnergy && sCarbon && sPrice && sPrice.v > 0
      ? ((sEnergy.v + sCarbon.v) / sPrice.v) * 100
      : null;
  const unitWord = basis === "tonne" ? t("per tonne") : t("per piece");

  return (
    <Panel
      title={t("Cost per unit")}
      sub={t(
        "What the energy and the carbon cost, against what the good sells for",
      )}
      action={
        <Segmented<UnitBasis>
          value={basis}
          onChange={onBasis}
          ariaLabel={t("Unit")}
          options={[
            { value: "tonne", label: t("Per tonne") },
            { value: "piece", label: t("Per piece") },
          ]}
        />
      }
      bodyClassName="!px-0 !pt-3"
    >
      <div className="grid gap-px overflow-hidden border-y border-black/[0.06] bg-black/[0.06] sm:grid-cols-4 [&>*]:bg-white">
        <Summary
          label={t("Energy {unit}", { unit: unitWord })}
          value={sEnergy ? money.thb(sEnergy.v) : "—"}
          color={COLORS.energy}
        />
        <Summary
          label={t("Carbon {unit}, your data", { unit: unitWord })}
          value={sCarbon ? money.thb(sCarbon.v) : "—"}
          color={COLORS.carbon}
        />
        <Summary
          label={t("Sells for {unit}", { unit: unitWord })}
          value={sPrice ? money.thb(sPrice.v) : "—"}
          color="#111"
        />
        <Summary
          label={t("Energy and carbon, share of the price")}
          value={sShare != null ? money.pct(sShare, 1) : "—"}
          color="#b45309"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead className="border-b border-black/[0.07] bg-[#faf9f7]">
            <tr>
              <th className={cn("px-5 py-3 text-left sm:px-6", TH)}>
                {t("Product")}
              </th>
              <th className={cn("px-4 py-3 text-right", TH)}>{t("Energy")}</th>
              <th className={cn("px-4 py-3 text-right", TH)}>
                {t("Carbon, your data")}
              </th>
              <th className={cn("px-4 py-3 text-right", TH)}>
                {t("Carbon, EU default")}
              </th>
              <th className={cn("px-4 py-3 text-right", TH)}>
                {t("Sells for")}
              </th>
              <th className={cn("w-[26%] px-4 py-3 text-left", TH)}>
                {t("Where the price goes")}
              </th>
              <th className="w-12 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const u = per(r);
              const isOpen = open === r.facts.id;
              const dash = <span className="text-black/30">—</span>;
              return (
                <React.Fragment key={r.facts.id}>
                  <tr className="border-t border-black/[0.05] transition-colors hover:bg-[#fafaf8]">
                    <td className="px-5 py-3.5 sm:px-6">
                      <div className="max-w-[230px] truncate text-[13.5px] text-black/85">
                        {t(r.facts.productName)}
                      </div>
                      <div className="truncate font-mono text-[11px] text-black/35">
                        {r.facts.installationName} · {r.facts.year}
                      </div>
                    </td>
                    {u == null ? (
                      <td
                        colSpan={5}
                        className="px-4 py-3.5 text-[12.5px] text-black/40"
                      >
                        {t(
                          "Add the weight of one piece to see this per piece.",
                        )}
                      </td>
                    ) : (
                      <>
                        <td
                          className="px-4 py-3.5 text-right text-[13px] tabular-nums text-black/80"
                          title={
                            u.energyThb == null ? energyWhy(r, t) : undefined
                          }
                        >
                          {u.energyThb != null
                            ? money.thb(u.energyThb, basis === "piece" ? 2 : 0)
                            : dash}
                        </td>
                        <td className="px-4 py-3.5 text-right text-[13px] tabular-nums text-black/80">
                          {u.carbonThb != null
                            ? money.thb(u.carbonThb, basis === "piece" ? 2 : 0)
                            : dash}
                        </td>
                        <td className="px-4 py-3.5 text-right text-[13px] tabular-nums text-black/45">
                          {u.carbonDefaultThb != null
                            ? money.thb(
                                u.carbonDefaultThb,
                                basis === "piece" ? 2 : 0,
                              )
                            : dash}
                        </td>
                        <td className="px-4 py-3.5 text-right text-[13px] tabular-nums text-black/80">
                          {u.priceThb != null
                            ? money.thb(u.priceThb, basis === "piece" ? 2 : 0)
                            : dash}
                        </td>
                        <td className="px-4 py-3.5">
                          <PriceSplit u={u} t={t} money={money} />
                        </td>
                      </>
                    )}
                    <td className="px-3 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setOpen(isOpen ? null : r.facts.id)}
                        aria-expanded={isOpen}
                        aria-label={t("Edit prices")}
                        title={t("Edit prices")}
                        className={cn(
                          "grid h-8 w-8 place-items-center rounded-lg text-black/40 hover:bg-black/[0.05] hover:text-black",
                          isOpen && "bg-black/[0.06] text-black",
                        )}
                      >
                        <Pencil size={14} strokeWidth={1.6} />
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-[#faf9f7]">
                      <td colSpan={7} className="px-5 py-5 sm:px-6">
                        <PriceEditor row={r} onSaved={onSaved} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-5 pt-4 text-[11.5px] text-black/45 sm:px-6">
        <Key color={COLORS.energy} label={t("Energy")} />
        <Key color={COLORS.carbon} label={t("Carbon, your data")} />
        <Key
          color="rgba(17,17,17,0.16)"
          label={t("Everything else in the price")}
        />
      </div>
      <p className="px-5 pt-2 text-[11.5px] leading-relaxed text-black/40 sm:px-6">
        {t(
          "What is left of the price is not profit: wages, materials and every other cost are still in it.",
        )}
      </p>
    </Panel>
  );
}

function energyWhy(r: PricedRow, t: ReturnType<typeof useT>): string {
  if (r.energy.missing.length > 0)
    return r.energy.missing.length === 1
      ? t("Add the price of 1 energy item to see this.")
      : t("Add the price of {n} energy items to see this.", {
          n: r.energy.missing.length,
        });
  return t("No energy was recorded in the submitted months.");
}

function Key({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function Summary({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="px-5 py-4 sm:px-6">
      <div className="flex items-center gap-2 text-[11.5px] text-black/45">
        <span
          className="h-2 w-2 flex-none rounded-full"
          style={{ background: color }}
        />
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1.5 font-[family-name:var(--font-plex)] text-[26px] font-light tracking-tight tabular-nums text-[#111]">
        {value}
      </div>
    </div>
  );
}

function PriceSplit({
  u,
  t,
  money,
}: {
  u: NonNullable<ReturnType<typeof unitCostsOf>>;
  t: ReturnType<typeof useT>;
  money: Money;
}) {
  if (u.priceThb == null)
    return (
      <span className="text-[12px] text-black/40">
        {t("Add the selling price")}
      </span>
    );
  if (u.energyPctOfPrice == null || u.carbonPctOfPrice == null)
    return (
      <span className="text-[12px] text-black/40">
        {t("Add the energy prices")}
      </span>
    );
  const e = Math.min(100, u.energyPctOfPrice);
  const c = Math.min(100 - e, u.carbonPctOfPrice);
  return (
    <div>
      <div
        className="flex h-[6px] overflow-hidden rounded-full"
        style={{ background: COLORS.rest }}
        title={`${t("Energy")} ${money.pct(u.energyPctOfPrice, 1)} · ${t("Carbon, your data")} ${money.pct(u.carbonPctOfPrice, 1)}`}
      >
        <span style={{ width: `${e}%`, background: COLORS.energy }} />
        <span style={{ width: `${c}%`, background: COLORS.carbon }} />
      </div>
      <div className="mt-1.5 flex gap-3 text-[11.5px] tabular-nums text-black/50">
        <span>{money.pct(u.energyPctOfPrice, 1)}</span>
        <span className="text-[#047857]">
          {money.pct(u.carbonPctOfPrice, 1)}
        </span>
      </div>
    </div>
  );
}

/* ── The prices ──────────────────────────────────────────────── */
type Draft = {
  price?: number;
  pieceKg?: number;
  elec?: number;
  fuels: Record<string, number | undefined>;
  eu?: number;
};

function PriceEditor({
  row,
  onSaved,
}: {
  row: PricedRow;
  onSaved: () => void;
}) {
  const t = useT();
  const { lang } = useLanguage();
  const f = row.facts;
  const [draft, setDraft] = React.useState<Draft>(() => ({
    price: f.inputs?.priceThbPerTonne,
    pieceKg: f.inputs?.pieceKg,
    elec: f.inputs?.electricityThbPerKwh,
    fuels: { ...(f.inputs?.fuelThbPerUnit ?? {}) },
    eu: f.euTonnes ?? undefined,
  }));

  const save = (d: Draft) => {
    const fuels: Record<string, number> = {};
    for (const [k, v] of Object.entries(d.fuels))
      if (v != null && Number.isFinite(v)) fuels[k] = v;
    saveUnitCosts(f.id, {
      priceThbPerTonne: d.price,
      pieceKg: d.pieceKg,
      electricityThbPerKwh: d.elec,
      fuelThbPerUnit: fuels,
    });
    setAnnualExportVolume(f.id, f.year, f.cnCode, d.eu ?? null);
    onSaved();
  };
  const { status, savedAt } = useAutoSave(draft, save, {
    delayMs: 500,
    enabled: true,
  });

  const field = (
    label: string,
    unit: string,
    value: number | undefined,
    onChange: (v: number | undefined) => void,
    hint?: string,
  ) => (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[12px] text-black/55">{label}</span>
      <NumberInput
        value={value}
        onChange={onChange}
        min={0}
        unit={unit}
        ariaLabel={label}
      />
      {hint && (
        <span className="mt-1 block text-[11px] leading-snug text-black/35">
          {hint}
        </span>
      )}
    </label>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[13px] text-black/75">
          {t(f.productName)}{" "}
          <span className="text-black/35">
            · {f.installationName} · {f.year}
          </span>
        </h3>
        <AutoSaveBadge status={status} savedAt={savedAt} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {field(t("Selling price"), t("฿ / tonne"), draft.price, (v) =>
          setDraft((d) => ({ ...d, price: v })),
        )}
        {field(
          t("Weight of one piece"),
          "kg",
          draft.pieceKg,
          (v) => setDraft((d) => ({ ...d, pieceKg: v })),
          t("Turns every figure into a per-piece one."),
        )}
        {field(
          t("Tonnes shipped to the EU"),
          "t",
          draft.eu,
          (v) => setDraft((d) => ({ ...d, eu: v })),
          t(
            "The certificate bill is on these. Left empty, all tonnes made are assumed.",
          ),
        )}
        {f.energy.electricityKwh > 0 &&
          field(t("Electricity price"), t("฿ / kWh"), draft.elec, (v) =>
            setDraft((d) => ({ ...d, elec: v })),
          )}
        {f.energy.fuels
          .filter((u) => u.quantity > 0)
          .map((u) => (
            <div key={u.key}>
              {field(
                `${fuelTypeLabelIn(lang, u.fuelType, u.other)}`,
                `฿ / ${u.unit}`,
                draft.fuels[u.key],
                (v) =>
                  setDraft((d) => ({
                    ...d,
                    fuels: { ...d.fuels, [u.key]: v },
                  })),
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
