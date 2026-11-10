"use client";

/* ════════════════════════════════════════════════════════════
   STEEL AND ALUMINIUM — the blocks of the monthly form that depend on the good

   The general form (monthly-step.tsx) asks every plant for production, fuels
   and electricity. What differs between a blast furnace, an electric arc
   furnace, a primary smelter and a scrap remelter is what happens to carbon and
   to scrap, and these blocks are that difference — the rows come from the
   sector pack (lib/cbam/sector-pack.ts), which says which streams the route
   really has.

     Raw materials and carbon    steel — carbon in the charge and carbon leaving
     Anodes and electrodes       aluminium — carbon consumed in the cells
     Scrap melted                aluminium — tonnes and pre-consumer share
     Fluxes and chemicals        both — carbonates and flue-gas cleaning
     PFC from anode effects      primary aluminium

   A guided row is a place to type, not a record: nothing is saved until a
   quantity (or a carbon content) is entered, and clearing it removes the row.
   So the form can list every usual material of the route without asking the
   plant to delete the ones it does not use.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Plus } from "lucide-react";
import { Button, NumberInput, inputClass, cn } from "@/components/ui";
import { Select } from "@/components/controls";
import { SectionCard, fmt } from "@/components/workspace/chrome";
import { TaggedField } from "@/components/precursor/annex-fields";
import { anchor, EmptyNote, RowCard } from "@/components/supplier/month-pieces";
import { QuantityBasis } from "@/components/supplier/quantity-basis";
import { ScrapDeliveries } from "@/components/supplier/scrap-deliveries";
import {
  CARBON_CONTENTS,
  STANDARD_MATERIALS,
  carbonContentFor,
} from "@/lib/cbam/process-factors";
import {
  emptyPfc,
  emptyPotline,
  pfcEmissions,
  pfcTechnology,
  PFC_TECHNOLOGIES,
  potlineAem,
  potlinesAem,
  scrapOf,
  type MaterialRowSpec,
  type PfcInputs,
  type SectorPack,
} from "@/lib/cbam/sector-pack";
import {
  compositionTotal,
  scrapDeliveryTotals,
  type ScrapMaterial,
  type StockChange,
} from "@/lib/monthly-inputs";
import {
  CUSTOM_MATERIAL,
  processEmissionEntryTCO2,
  uid,
  type MonthlyEntry,
  type ProcessEmissionEntry,
} from "@/lib/monthly-data";
import { useT } from "@/lib/i18n";

type Patch = (p: Partial<MonthlyEntry>) => void;
type MassBalance = Extract<ProcessEmissionEntry, { method: "mass_balance" }>;

const isMass = (e: ProcessEmissionEntry): e is MassBalance =>
  e.method === "mass_balance";

/* ── Reading and writing a guided row ────────────────────────── */

type RowValues = {
  qty?: number;
  cc?: number;
  pre?: number;
  stock?: StockChange;
  keep?: boolean;
};

function valuesOf(e: MassBalance | undefined): RowValues {
  if (!e) return {};
  return {
    qty: e.quantityT !== 0 ? Math.abs(e.quantityT) : undefined,
    cc: e.carbonContent,
    pre: e.preConsumerT,
    stock: e.stock,
  };
}

/** The entries with one guided row set to `next` — added, changed, or dropped when nothing is left in it. */
function withSpec(
  entries: ProcessEmissionEntry[],
  spec: MaterialRowSpec,
  next: RowValues,
): ProcessEmissionEntry[] {
  const at = entries.findIndex((e) => isMass(e) && e.specKey === spec.key);
  const empty =
    !(next.qty && next.qty !== 0) &&
    next.cc == null &&
    next.pre == null &&
    !next.stock &&
    !next.keep;
  if (empty) return at >= 0 ? entries.filter((_, i) => i !== at) : entries;
  const base: MassBalance =
    at >= 0
      ? (entries[at] as MassBalance)
      : {
          id: uid(),
          method: "mass_balance",
          specKey: spec.key,
          materialId: spec.materialId ?? CUSTOM_MATERIAL,
          label: spec.materialId ? undefined : spec.label,
          quantityT: 0,
        };
  const e: MassBalance = {
    ...base,
    quantityT: (next.qty ?? 0) * (spec.direction === "out" ? -1 : 1),
    carbonContent: next.cc,
    preConsumerT: spec.scrap ? next.pre : undefined,
    stock: spec.direction === "in" ? next.stock : undefined,
  };
  return at >= 0 ? entries.map((x, i) => (i === at ? e : x)) : [...entries, e];
}

/* ── The carbon content of a row ─────────────────────────────── */
function CarbonContentField({
  materialId,
  value,
  onChange,
  readOnly,
  anchorId,
  required,
}: {
  materialId: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  readOnly: boolean;
  anchorId?: string;
  /** a material the EU table does not list — the plant's own figure is the only one there is */
  required: boolean;
}) {
  const t = useT();
  const table = carbonContentFor(materialId)?.tCPerT;
  const own = value != null;
  return (
    <TaggedField
      id={anchorId}
      tag="16(a)"
      need={required ? "required" : "optional"}
      label={t("Carbon content")}
      hint={
        table != null && !own ? (
          <>
            {t("EU standard")} <span className="font-mono">{table}</span>{" "}
            {t("t C per t — used unless you have your own analysis.")}{" "}
            {!readOnly && (
              <button
                type="button"
                onClick={() => onChange(table)}
                className="text-black/55 underline decoration-black/20 underline-offset-2 hover:text-black"
              >
                {t("Use my own value")}
              </button>
            )}
          </>
        ) : table != null ? (
          <>
            {t("Your analysis. The EU standard is")}{" "}
            <span className="font-mono">{table}</span>.{" "}
            {!readOnly && (
              <button
                type="button"
                onClick={() => onChange(undefined)}
                className="text-black/55 underline decoration-black/20 underline-offset-2 hover:text-black"
              >
                {t("Back to the EU standard")}
              </button>
            )}
          </>
        ) : (
          t(
            "Tonnes of carbon per tonne of material — from the supplier's specification or your own analysis. The EU table has no value for this one.",
          )
        )
      }
    >
      {own || table == null ? (
        <NumberInput
          value={value}
          min={0}
          max={1}
          unit="t C/t"
          disabled={readOnly}
          onChange={onChange}
          ariaLabel={t("Carbon content")}
          placeholder="0.95"
        />
      ) : (
        <div className="flex min-h-[44px] items-center rounded-xl border border-black/[0.07] bg-white px-4 font-mono text-[13px] text-black/45">
          {table} t C/t
        </div>
      )}
    </TaggedField>
  );
}

/* ── One material of the route ───────────────────────────────── */
function MaterialRow({
  spec,
  entry,
  production,
  onChange,
  readOnly,
  workspaceNote,
  derived,
  extras,
}: {
  spec: MaterialRowSpec;
  entry: MassBalance | undefined;
  production: number;
  onChange: (next: RowValues) => void;
  readOnly: boolean;
  workspaceNote?: string;
  /** the quantity (and the pre-consumer part) is worked out from the stock change or the scrap deliveries below */
  derived?: boolean;
  /** what sits under the row's own fields: the stock change, or the scrap deliveries */
  extras?: React.ReactNode;
}) {
  const t = useT();
  const v = valuesOf(entry);
  const used =
    v.qty != null || v.cc != null || Boolean(v.stock) || Boolean(derived);
  const sameAsProduction =
    spec.direction === "out" &&
    /_out$/.test(spec.key) &&
    !spec.key.includes("gas");
  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors",
        used
          ? "border-black/[0.12] bg-white"
          : "border-black/[0.07] bg-[#faf9f7]",
      )}
    >
      <div className="mb-3 min-w-0">
        <p className="text-[13.5px] text-black/80">{t(spec.label)}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-black/45">
          {t(spec.hint)}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <TaggedField
          id={anchor(
            entry
              ? `processEntry:${entry.id}:quantity`
              : `material:${spec.key}`,
          )}
          tag="16(a)"
          need="optional"
          label={t("Quantity")}
          hint={
            derived
              ? spec.scrap
                ? t("Worked out from the deliveries below.")
                : t("Worked out from the stock change below.")
              : workspaceNote
          }
        >
          <NumberInput
            value={v.qty}
            min={0}
            unit="t"
            disabled={readOnly || derived}
            onChange={(q) => onChange({ ...v, qty: q })}
            ariaLabel={`${t(spec.label)} — ${t("Quantity")}`}
          />
          {!readOnly && sameAsProduction && production > 0 && v.qty == null && (
            <button
              type="button"
              onClick={() => onChange({ ...v, qty: production })}
              className="mt-1.5 text-[11.5px] text-black/50 underline decoration-black/20 underline-offset-2 hover:text-black"
            >
              {t("Same as production")} ({fmt(production, 3)} t)
            </button>
          )}
        </TaggedField>
        {spec.scrap && used && (
          <TaggedField
            id={
              entry ? anchor(`processEntry:${entry.id}:preConsumer`) : undefined
            }
            tag="35"
            need="optional"
            label={t("of which pre-consumer")}
            hint={t(
              "Offcuts, trimmings and rejects from manufacturing — not end-of-life scrap.",
            )}
          >
            <NumberInput
              value={v.pre}
              min={0}
              unit="t"
              disabled={readOnly || v.qty == null || derived}
              onChange={(pre) => onChange({ ...v, pre })}
              ariaLabel={`${t(spec.label)} — ${t("pre-consumer")}`}
            />
          </TaggedField>
        )}
        {(used || !spec.materialId) && (
          <CarbonContentField
            materialId={spec.materialId ?? CUSTOM_MATERIAL}
            value={v.cc}
            onChange={(cc) => onChange({ ...v, cc })}
            readOnly={readOnly}
            anchorId={entry ? anchor(`processEntry:${entry.id}:cc`) : undefined}
            required={!spec.materialId}
          />
        )}
      </div>
      {extras}
      {entry && v.qty != null && (
        <p className="mt-3 text-[12px] text-black/50">
          {spec.direction === "out"
            ? t("Carbon that stays in it:")
            : t("Carbon it brings:")}{" "}
          <span className="font-mono text-black/75">
            {fmt(Math.abs(processEmissionEntryTCO2(entry)), 3)} tCO₂
          </span>
        </p>
      )}
    </div>
  );
}

/* ── Raw materials and carbon (steel) · Anodes and electrodes (aluminium) ── */
export function MaterialsCard({
  pack,
  entry,
  patch,
  readOnly,
}: {
  pack: SectorPack;
  entry: MonthlyEntry;
  patch: Patch;
  readOnly: boolean;
}) {
  const t = useT();
  const entries = entry.processEmissionEntries ?? [];
  const specKeys = new Set(pack.materials.map((m) => m.key));
  // Carbon rows the plant added by hand, or that an earlier form saved: anything mass-balance that is not one of this route's guided rows.
  const free = entries.filter(
    (e): e is MassBalance =>
      isMass(e) && !(e.specKey && specKeys.has(e.specKey)),
  );
  const steel = pack.sector === "steel";
  const inputs = pack.materials.filter((m) => m.direction === "in");
  const outputs = pack.materials.filter((m) => m.direction === "out");

  const setSpec = (spec: MaterialRowSpec) => (next: RowValues) =>
    patch({ processEmissionEntries: withSpec(entries, spec, next) });
  const setFree = (id: string, p: Partial<MassBalance>) =>
    patch({
      processEmissionEntries: entries.map((e) =>
        e.id === id && isMass(e) ? { ...e, ...p } : e,
      ),
    });
  const net = entries
    .filter(isMass)
    .reduce((a, e) => a + processEmissionEntryTCO2(e), 0);
  const hasAny = entries.some((e) => isMass(e) && e.quantityT !== 0);

  const addFree = () =>
    patch({
      processEmissionEntries: [
        ...entries,
        {
          id: uid(),
          method: "mass_balance",
          materialId: "",
          quantityT: 0,
        } as MassBalance,
      ],
    });

  return (
    <SectionCard
      id={anchor("materials")}
      title={steel ? t("Raw materials and carbon") : t("Anodes and electrodes")}
      helpTitle={
        steel ? t("Raw materials and carbon") : t("Anodes and electrodes")
      }
      help={
        <>
          <p>
            {t(
              "Carbon that goes in is counted as emitted. Carbon that leaves in the product, the slag or a by-product is not — it comes off.",
            )}
          </p>
          <p className="mt-2">
            {t(
              "Fuels are not entered here; they have their own block. Type a quantity only in the rows the plant uses — the rest stay empty and cost nothing.",
            )}
          </p>
        </>
      }
      blurb={t(pack.intro)}
    >
      {pack.materials.length === 0 && free.length === 0 ? (
        <EmptyNote>
          {t(
            "Nothing to enter here for this process — its emissions are the fuel it burns and the electricity it draws.",
          )}
        </EmptyNote>
      ) : (
        <div className="space-y-5">
          {inputs.length > 0 && (
            <div>
              <p className="mb-2 font-pixel text-[10px] uppercase tracking-[0.14em] text-black/40">
                {steel ? t("Charged to the furnace") : t("Consumed this month")}
              </p>
              <div className="space-y-3">
                {inputs.map((spec) => {
                  const row = entries.find(
                    (e): e is MassBalance =>
                      isMass(e) && e.specKey === spec.key,
                  );
                  const material = spec.scrap
                    ? (spec.materialId as ScrapMaterial)
                    : null;
                  const hasDeliveries =
                    material != null &&
                    (entry.scrapDeliveries ?? []).some(
                      (d) => d.material === material,
                    );
                  const v = valuesOf(row);
                  return (
                    <MaterialRow
                      key={spec.key}
                      spec={spec}
                      entry={row}
                      production={entry.productionTonnes}
                      onChange={setSpec(spec)}
                      readOnly={readOnly}
                      derived={hasDeliveries || Boolean(row?.stock)}
                      extras={
                        material ? (
                          <ScrapDeliveries
                            material={material}
                            entry={entry}
                            readOnly={readOnly}
                            // The first delivery makes sure the row exists, so the totals have somewhere to land.
                            onChange={(next, added) =>
                              patch({
                                scrapDeliveries: next,
                                ...(added
                                  ? {
                                      processEmissionEntries: withSpec(
                                        entries,
                                        spec,
                                        { ...v, keep: true },
                                      ),
                                    }
                                  : {}),
                              })
                            }
                          />
                        ) : (
                          <QuantityBasis
                            stock={row?.stock}
                            onChange={(p) =>
                              setSpec(spec)({ ...v, stock: p.stock })
                            }
                            unit="t"
                            readOnly={readOnly}
                            allowShared={false}
                            compact={v.qty == null && v.cc == null}
                            fieldKey={
                              row
                                ? `processEntry:${row.id}`
                                : `material:${spec.key}`
                            }
                          />
                        )
                      }
                    />
                  );
                })}
              </div>
            </div>
          )}
          {outputs.length > 0 && (
            <div>
              <p className="mb-2 font-pixel text-[10px] uppercase tracking-[0.14em] text-black/40">
                {t("Leaving in the product and by-products")}
              </p>
              <div className="space-y-3">
                {outputs.map((spec) => (
                  <MaterialRow
                    key={spec.key}
                    spec={spec}
                    entry={entries.find(
                      (e): e is MassBalance =>
                        isMass(e) && e.specKey === spec.key,
                    )}
                    production={entry.productionTonnes}
                    onChange={setSpec(spec)}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            </div>
          )}

          {(free.length > 0 || !readOnly) && (
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/40">
                  {t("Another carbon-bearing material")}
                </p>
                {!readOnly && (
                  <Button size="sm" variant="secondary" onClick={addFree}>
                    <Plus size={12} strokeWidth={1.5} /> {t("Add a material")}
                  </Button>
                )}
              </div>
              {free.length > 0 && (
                <div className="space-y-3">
                  {free.map((e, i) => {
                    const out = e.quantityT < 0;
                    const table =
                      e.materialId !== CUSTOM_MATERIAL && e.materialId !== "";
                    return (
                      <RowCard
                        key={e.id}
                        title={`${t("Material")} ${i + 1}`}
                        removeLabel={`${t("Remove material")} ${i + 1}`}
                        onRemove={
                          readOnly
                            ? undefined
                            : () =>
                                patch({
                                  processEmissionEntries: entries.filter(
                                    (x) => x.id !== e.id,
                                  ),
                                })
                        }
                      >
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          <TaggedField
                            tag="16(a)"
                            need="required"
                            label={t("Direction")}
                          >
                            <Select
                              value={out ? "out" : "in"}
                              onChange={(d) =>
                                setFree(e.id, {
                                  quantityT:
                                    (d === "out" ? -1 : 1) *
                                    Math.abs(e.quantityT),
                                })
                              }
                              options={[
                                {
                                  value: "in",
                                  label: t("Goes in — counted as emitted"),
                                },
                                {
                                  value: "out",
                                  label: t("Leaves — carbon stays in it"),
                                },
                              ]}
                              ariaLabel={t("Direction")}
                            />
                          </TaggedField>
                          <TaggedField
                            id={anchor(`processEntry:${e.id}:material`)}
                            tag="16(a)"
                            need="required"
                            label={t("Material")}
                          >
                            <Select
                              value={e.materialId}
                              onChange={(m) =>
                                setFree(e.id, {
                                  materialId: m,
                                  carbonContent:
                                    m === CUSTOM_MATERIAL
                                      ? e.carbonContent
                                      : undefined,
                                })
                              }
                              options={[
                                ...CARBON_CONTENTS.map((c) => ({
                                  value: c.material,
                                  label: c.label,
                                  hint: `${c.tCPerT} t C/t`,
                                })),
                                {
                                  value: CUSTOM_MATERIAL,
                                  label: t("Another material — name it"),
                                  hint: t(
                                    "Not in the EU table; you give its carbon content",
                                  ),
                                },
                              ]}
                              searchable
                              placeholder={t("Pick a material")}
                              ariaLabel={t("Material")}
                            />
                          </TaggedField>
                          <TaggedField
                            id={anchor(`processEntry:${e.id}:quantity`)}
                            tag="16(a)"
                            need="required"
                            label={t("Quantity")}
                            hint={
                              e.stock
                                ? t("Worked out from the stock change below.")
                                : t("Tonnes.")
                            }
                          >
                            <NumberInput
                              value={Math.abs(e.quantityT) || undefined}
                              min={0}
                              unit="t"
                              disabled={readOnly || Boolean(e.stock)}
                              onChange={(q) =>
                                setFree(e.id, {
                                  quantityT: (out ? -1 : 1) * (q ?? 0),
                                })
                              }
                              ariaLabel={t("Quantity")}
                            />
                          </TaggedField>
                          {e.materialId === CUSTOM_MATERIAL && (
                            <TaggedField
                              id={anchor(`processEntry:${e.id}:label`)}
                              tag="16(a)"
                              need="required"
                              label={t("Name of the material")}
                            >
                              <input
                                className={inputClass}
                                value={e.label ?? ""}
                                disabled={readOnly}
                                onChange={(ev) =>
                                  setFree(e.id, { label: ev.target.value })
                                }
                                placeholder={t("Baked anode")}
                              />
                            </TaggedField>
                          )}
                        </div>
                        {e.materialId !== "" && (
                          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <CarbonContentField
                              materialId={e.materialId}
                              value={e.carbonContent}
                              onChange={(cc) =>
                                setFree(e.id, { carbonContent: cc })
                              }
                              readOnly={readOnly}
                              anchorId={anchor(`processEntry:${e.id}:cc`)}
                              required={!table}
                            />
                          </div>
                        )}
                        {!out && (
                          <QuantityBasis
                            stock={e.stock}
                            onChange={(p) => setFree(e.id, { stock: p.stock })}
                            unit="t"
                            readOnly={readOnly}
                            allowShared={false}
                            fieldKey={`processEntry:${e.id}`}
                          />
                        )}
                        <p className="mt-3 text-[12px] text-black/50">
                          {t("Computed:")}{" "}
                          <span className="font-mono text-black/75">
                            {fmt(processEmissionEntryTCO2(e), 3)} tCO₂
                          </span>
                        </p>
                      </RowCard>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {hasAny && (
            <p className="rounded-xl bg-[#faf9f7] px-4 py-3 text-[12.5px] text-black/55">
              {t("Net from the carbon balance:")}{" "}
              <span className="font-mono text-black/80">
                {fmt(net, 3)} tCO₂
              </span>{" "}
              <span className="text-black/40">
                — {t("carbon in, minus carbon that leaves.")}
              </span>
            </p>
          )}
        </div>
      )}
    </SectionCard>
  );
}

/* ── Scrap melted (aluminium) ────────────────────────────────── */
export function ScrapCard({
  entry,
  patch,
  readOnly,
}: {
  entry: MonthlyEntry;
  patch: Patch;
  readOnly: boolean;
}) {
  const t = useT();
  const sc = entry.scrap ?? {};
  const set = (p: Partial<NonNullable<MonthlyEntry["scrap"]>>) =>
    patch({ scrap: { ...sc, ...p } });
  const total = scrapOf(entry);
  const byDelivery =
    scrapDeliveryTotals(entry.scrapDeliveries ?? [], "aluminium_scrap").count >
    0;
  const perTonne =
    entry.productionTonnes > 0 && total.tonnes > 0
      ? total.tonnes / entry.productionTonnes
      : null;
  const share =
    total.tonnes > 0 ? (total.preConsumerT / total.tonnes) * 100 : null;
  return (
    <SectionCard
      id={anchor("scrap")}
      title={t("Scrap melted")}
      helpTitle={t("Scrap")}
      help={
        <>
          <p>
            {t(
              "Aluminium scrap put into the furnace this month, and how much of it came from manufacturing rather than from end-of-life products.",
            )}
          </p>
          <p className="mt-2">
            {t(
              "The report states tonnes of scrap per tonne of metal and the pre-consumer share. Unwrought aluminium bought in and added is not scrap — it is a precursor, entered on the Precursors tab.",
            )}
          </p>
        </>
      }
      blurb={t("Leave empty if the plant melts no scrap.")}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TaggedField
          id={anchor("scrap:tonnes")}
          tag="35"
          need="optional"
          label={t("Scrap melted")}
          hint={t("Tonnes charged this month.")}
        >
          <NumberInput
            value={sc.tonnes}
            min={0}
            unit="t"
            disabled={readOnly || byDelivery}
            onChange={(v) => set({ tonnes: v })}
            ariaLabel={t("Scrap melted")}
          />
        </TaggedField>
        <TaggedField
          id={anchor("scrap:pre")}
          tag="35"
          need="optional"
          label={t("of which pre-consumer")}
          hint={t(
            "Offcuts, trimmings and rejects from manufacturing — not end-of-life scrap.",
          )}
        >
          <NumberInput
            value={sc.preConsumerT}
            min={0}
            unit="t"
            disabled={readOnly || sc.tonnes == null || byDelivery}
            onChange={(v) => set({ preConsumerT: v })}
            ariaLabel={t("Pre-consumer scrap")}
          />
        </TaggedField>
      </div>
      <ScrapDeliveries
        material="aluminium_scrap"
        entry={entry}
        readOnly={readOnly}
        onChange={(next) => patch({ scrapDeliveries: next })}
      />
      {perTonne != null && (
        <p className="mt-3 text-[12px] text-black/50">
          <span className="font-mono text-black/75">{fmt(perTonne, 3)} t</span>{" "}
          {t("of scrap per tonne made")}
          {share != null && total.preConsumerT > 0 && (
            <>
              {" · "}
              <span className="font-mono text-black/75">{fmt(share, 1)}%</span>{" "}
              {t("pre-consumer")}
            </>
          )}
        </p>
      )}
    </SectionCard>
  );
}

/* ── Fluxes and flue-gas chemicals ───────────────────────────── */
export function FluxesCard({
  pack,
  entry,
  patch,
  readOnly,
}: {
  pack: SectorPack;
  entry: MonthlyEntry;
  patch: Patch;
  readOnly: boolean;
}) {
  const t = useT();
  const entries = entry.processEmissionEntries ?? [];
  const standard = entries.filter(
    (e): e is Extract<ProcessEmissionEntry, { method: "standard" }> =>
      e.method === "standard",
  );
  const setStd = (id: string, p: Partial<(typeof standard)[number]>) =>
    patch({
      processEmissionEntries: entries.map((e) =>
        e.id === id && e.method === "standard" ? { ...e, ...p } : e,
      ),
    });
  return (
    <SectionCard
      title={t("Fluxes and flue-gas chemicals")}
      helpTitle={t("Fluxes and chemicals")}
      help={
        <p>
          {t(
            "CO₂ released when a carbonate decomposes — limestone, dolomite, magnesite, soda ash. Pick the material and the tonnes; the figure is the quantity times the EU factor for that material. Leave it empty if the plant adds none.",
          )}
        </p>
      }
      blurb={t(pack.fluxHint)}
      actions={
        !readOnly && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              patch({
                processEmissionEntries: [
                  ...entries,
                  {
                    id: uid(),
                    method: "standard",
                    materialId: "",
                    quantityT: 0,
                    conversionFactor: 1,
                  },
                ],
              })
            }
          >
            <Plus size={12} strokeWidth={1.5} /> {t("Add a material")}
          </Button>
        )
      }
    >
      <div id={anchor("processBasis")} className="scroll-mt-32 space-y-3">
        {standard.length === 0 ? (
          <EmptyNote>
            {t("None recorded. Leave empty if no flux or chemical was added.")}
          </EmptyNote>
        ) : (
          standard.map((e, i) => (
            <RowCard
              key={e.id}
              title={`${t("Material")} ${i + 1}`}
              removeLabel={`${t("Remove material")} ${i + 1}`}
              onRemove={
                readOnly
                  ? undefined
                  : () =>
                      patch({
                        processEmissionEntries: entries.filter(
                          (x) => x.id !== e.id,
                        ),
                      })
              }
            >
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <TaggedField
                  id={anchor(`processEntry:${e.id}:material`)}
                  tag="16(a)"
                  need="required"
                  label={t("Material")}
                >
                  <Select
                    value={e.materialId}
                    onChange={(v) => setStd(e.id, { materialId: v })}
                    options={STANDARD_MATERIALS.map((m) => ({
                      value: m.id,
                      label: m.label,
                      hint: `${m.tco2PerUnit} tCO₂/${m.unit}`,
                    }))}
                    searchable
                    placeholder={t("Pick a material")}
                    ariaLabel={t("Material")}
                  />
                </TaggedField>
                <TaggedField
                  id={anchor(`processEntry:${e.id}:quantity`)}
                  tag="16(a)"
                  need="required"
                  label={t("Quantity")}
                  hint={
                    e.stock
                      ? t("Worked out from the stock change below.")
                      : t("Tonnes used this month.")
                  }
                >
                  <NumberInput
                    value={e.quantityT || undefined}
                    min={0}
                    unit="t"
                    disabled={readOnly || Boolean(e.stock)}
                    onChange={(q) => setStd(e.id, { quantityT: q ?? 0 })}
                    ariaLabel={t("Quantity")}
                  />
                </TaggedField>
                <TaggedField
                  id={anchor(`processEntry:${e.id}:cf`)}
                  tag="16(a)"
                  need="required"
                  label={t("Conversion factor")}
                  hint={t("1 unless only part of the material converts.")}
                >
                  <NumberInput
                    value={e.conversionFactor ?? 1}
                    min={0.0001}
                    max={1}
                    disabled={readOnly}
                    onChange={(v) => setStd(e.id, { conversionFactor: v ?? 1 })}
                    ariaLabel={t("Conversion factor")}
                  />
                </TaggedField>
              </div>
              <QuantityBasis
                stock={e.stock}
                onChange={(p) => setStd(e.id, { stock: p.stock })}
                unit="t"
                readOnly={readOnly}
                allowShared={false}
                fieldKey={`processEntry:${e.id}`}
              />
              <p className="mt-3 text-[12px] text-black/50">
                {t("Computed:")}{" "}
                <span className="font-mono text-black/75">
                  {fmt(processEmissionEntryTCO2(e), 3)} tCO₂
                </span>
              </p>
            </RowCard>
          ))
        )}
      </div>
    </SectionCard>
  );
}

/* ── PFC from anode effects (primary aluminium) ──────────────── */
export function PfcCard({
  pack,
  entry,
  patch,
  readOnly,
}: {
  pack: SectorPack;
  entry: MonthlyEntry;
  patch: Patch;
  readOnly: boolean;
}) {
  const t = useT();
  const pfc: PfcInputs = entry.pfc ?? emptyPfc(pack.pfcTechnologies);
  const set = (p: Partial<PfcInputs>) => patch({ pfc: { ...pfc, ...p } });
  const slope = pfc.method === "slope";
  const tech = pfcTechnology(pfc.technology);
  const result = pfcEmissions(pfc, entry.productionTonnes || 0);
  const [ownOpen, setOwnOpen] = React.useState(
    pfc.ownCf4Factor != null || pfc.ownC2f6Fraction != null,
  );
  // One row per line of cells, when the cells are not all one type or do not all run alike.
  const lines = pfc.potlines && pfc.potlines.length > 0 ? pfc.potlines : null;
  const setLine = (
    id: string,
    p: Partial<NonNullable<PfcInputs["potlines"]>[number]>,
  ) =>
    set({
      potlines: (pfc.potlines ?? []).map((l) =>
        l.id === id ? { ...l, ...p } : l,
      ),
    });
  const shareTotal = (pfc.potlines ?? []).reduce(
    (a, l) => a + (l.sharePct ?? 0),
    0,
  );
  const techOptions = PFC_TECHNOLOGIES.filter(
    (x) =>
      pack.pfcTechnologies.length === 0 || pack.pfcTechnologies.includes(x.id),
  ).map((x) => ({
    value: x.id,
    label: t(x.label),
    hint: slope
      ? x.slopeCf4 != null
        ? `CF₄ ${x.slopeCf4} · C₂F₆ ${x.slopeC2f6}`
        : t("Measure your own factors")
      : x.overvoltageCf4 != null
        ? `CF₄ ${x.overvoltageCf4} · C₂F₆ ${x.overvoltageC2f6}`
        : t("No EU factor for the overvoltage method"),
  }));
  return (
    <SectionCard
      id={anchor("pfc")}
      title={t("PFC from anode effects")}
      helpTitle={t("PFC from anode effects")}
      help={
        <>
          <p>
            {t(
              "During an anode effect an electrolysis cell emits CF₄ and C₂F₆, gases that warm the atmosphere thousands of times more than CO₂. They are counted as CO₂ equivalent: CF₄ × 6,630 and C₂F₆ × 11,100.",
            )}
          </p>
          <p className="mt-2">
            {t(
              "Count the anode effects one of two ways — minutes per cell per day (the slope method) or the overvoltage — and use the factors for the cell type until you have measured your own.",
            )}
          </p>
        </>
      }
      blurb={t(
        "Primary smelting only. Zero minutes is a valid answer — enter it rather than leaving the box empty.",
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <TaggedField
          tag="16(a)"
          need="required"
          label={t("How the anode effects are counted")}
        >
          <Select
            value={pfc.method}
            onChange={(m) =>
              set({
                method: m as PfcInputs["method"],
                ownCf4Factor: undefined,
                ownC2f6Fraction: undefined,
              })
            }
            options={[
              {
                value: "slope",
                label: t("Minutes per cell-day (slope)"),
                hint: t("The most common way"),
              },
              {
                value: "overvoltage",
                label: t("Overvoltage"),
                hint: t("Where the anode-effect voltage is recorded"),
              },
            ]}
            disabled={readOnly}
            ariaLabel={t("PFC method")}
          />
        </TaggedField>
        {!lines && (
          <TaggedField
            id={anchor("pfc:technology")}
            tag="16(a)"
            need="required"
            label={t("Cell type")}
            hint={t("Sets the EU factors used until you have your own.")}
          >
            <Select
              value={pfc.technology}
              onChange={(v) => set({ technology: v })}
              options={techOptions}
              placeholder={t("Pick the cell type")}
              disabled={readOnly}
              ariaLabel={t("Cell type")}
            />
          </TaggedField>
        )}
        <TaggedField
          id={anchor("pfc:primary")}
          tag="13"
          need="optional"
          label={t("Primary aluminium made")}
          hint={t(
            "Tonnes this month. Empty means the production figure above.",
          )}
        >
          <NumberInput
            value={pfc.primaryAlT}
            min={0}
            unit="t"
            disabled={readOnly}
            onChange={(v) => set({ primaryAlT: v })}
            ariaLabel={t("Primary aluminium made")}
            placeholder={
              entry.productionTonnes > 0
                ? String(entry.productionTonnes)
                : undefined
            }
          />
        </TaggedField>
        {lines ? null : slope ? (
          <TaggedField
            id={anchor("pfc:aem")}
            tag="16(a)"
            need="required"
            label={t("Anode-effect minutes per cell-day")}
            hint={t(
              "Average for the month: anode effects per cell per day, times the minutes each lasts. 0 if there were none.",
            )}
          >
            <NumberInput
              value={pfc.aem}
              min={0}
              unit="min"
              disabled={readOnly}
              onChange={(v) => set({ aem: v })}
              ariaLabel={t("Anode-effect minutes per cell-day")}
            />
          </TaggedField>
        ) : (
          <>
            <TaggedField
              id={anchor("pfc:aeo")}
              tag="16(a)"
              need="required"
              label={t("Anode-effect overvoltage")}
              hint={t(
                "Time-integrated voltage above target, averaged over the month. 0 if none.",
              )}
            >
              <NumberInput
                value={pfc.aeo}
                min={0}
                unit="mV"
                disabled={readOnly}
                onChange={(v) => set({ aeo: v })}
                ariaLabel={t("Anode-effect overvoltage")}
              />
            </TaggedField>
            <TaggedField
              id={anchor("pfc:ce")}
              tag="16(a)"
              need="required"
              label={t("Current efficiency")}
              hint={t("Average for the month.")}
            >
              <NumberInput
                value={pfc.ce}
                min={0}
                max={100}
                unit="%"
                disabled={readOnly}
                onChange={(v) => set({ ce: v })}
                ariaLabel={t("Current efficiency")}
              />
            </TaggedField>
          </>
        )}
        <TaggedField
          id={anchor("pfc:eff")}
          tag="16(a)"
          need="required"
          label={t("Share collected by the duct")}
          hint={t(
            "What is measured in the duct is divided by this to include fume that escapes. From your last field measurement; 100 only if the collection is complete.",
          )}
        >
          <NumberInput
            value={pfc.collectionEfficiencyPct}
            min={0}
            max={100}
            unit="%"
            disabled={readOnly}
            onChange={(v) => set({ collectionEfficiencyPct: v })}
            ariaLabel={t("Duct collection efficiency")}
            placeholder="95"
          />
        </TaggedField>
      </div>

      {/* ── A row per line of cells ──
          Plants with more than one cell type, or lines that run differently, give each line its own share of the metal and its own
          anode-effect figures; each is worked out with its own cell type's factors and the tonnes are added. */}
      <div id={anchor("pfc:potlines")} className="scroll-mt-32 mt-4">
        {lines ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/40">
                {t("Lines of cells")}
              </p>
              {!readOnly && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => set({ potlines: undefined })}
                    className="text-[12px] text-black/50 underline decoration-black/20 underline-offset-2 hover:text-black"
                  >
                    {t("Back to one cell type")}
                  </button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      set({
                        potlines: [...(pfc.potlines ?? []), emptyPotline()],
                      })
                    }
                  >
                    <Plus size={12} strokeWidth={1.5} /> {t("Add a line")}
                  </Button>
                </div>
              )}
            </div>
            {lines.map((l, i) => {
              const aem = potlineAem(l);
              return (
                <RowCard
                  key={l.id}
                  title={`${t("Line")} ${i + 1}`}
                  removeLabel={`${t("Remove line")} ${i + 1}`}
                  onRemove={
                    readOnly || lines.length < 2
                      ? undefined
                      : () =>
                          set({ potlines: lines.filter((x) => x.id !== l.id) })
                  }
                >
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <TaggedField
                      tag="—"
                      need="optional"
                      label={t("Name")}
                      hint={t("Potline or potroom.")}
                    >
                      <input
                        className={inputClass}
                        value={l.label}
                        disabled={readOnly}
                        onChange={(e) =>
                          setLine(l.id, { label: e.target.value })
                        }
                        placeholder={t("Potroom A")}
                      />
                    </TaggedField>
                    <TaggedField
                      id={anchor(`pfc:line:${l.id}:technology`)}
                      tag="16(a)"
                      need="required"
                      label={t("Cell type")}
                    >
                      <Select
                        value={l.technology}
                        onChange={(v) => setLine(l.id, { technology: v })}
                        options={techOptions}
                        placeholder={t("Pick the cell type")}
                        disabled={readOnly}
                        ariaLabel={t("Cell type")}
                      />
                    </TaggedField>
                    <TaggedField
                      id={anchor(`pfc:line:${l.id}:share`)}
                      tag="13"
                      need="required"
                      label={t("Share of the metal")}
                      hint={t(
                        "Of this month's primary aluminium. All lines add up to 100 %.",
                      )}
                    >
                      <NumberInput
                        value={l.sharePct}
                        min={0}
                        max={100}
                        unit="%"
                        disabled={readOnly}
                        onChange={(v) => setLine(l.id, { sharePct: v })}
                        ariaLabel={t("Share of the metal")}
                      />
                    </TaggedField>
                    <TaggedField
                      tag="16(a)"
                      need="optional"
                      label={t("Cell-days in the month")}
                      hint={t(
                        "Cells in operation × days — so the minutes can be traced to the cells.",
                      )}
                    >
                      <NumberInput
                        value={l.cellDays}
                        min={0}
                        disabled={readOnly}
                        onChange={(v) => setLine(l.id, { cellDays: v })}
                        ariaLabel={t("Cell-days")}
                      />
                    </TaggedField>
                    {slope ? (
                      <>
                        <TaggedField
                          id={anchor(`pfc:line:${l.id}:aem`)}
                          tag="16(a)"
                          need="required"
                          label={t("Anode effects per cell-day")}
                          hint={t(
                            "How often one happens, on average. 0 if none.",
                          )}
                        >
                          <NumberInput
                            value={l.aePerCellDay}
                            min={0}
                            disabled={readOnly}
                            onChange={(v) => setLine(l.id, { aePerCellDay: v })}
                            ariaLabel={t("Anode effects per cell-day")}
                            placeholder="0.12"
                          />
                        </TaggedField>
                        <TaggedField
                          tag="16(a)"
                          need="required"
                          label={t("Minutes each lasts")}
                        >
                          <NumberInput
                            value={l.aeMinutes}
                            min={0}
                            unit="min"
                            disabled={readOnly}
                            onChange={(v) => setLine(l.id, { aeMinutes: v })}
                            ariaLabel={t("Minutes per anode effect")}
                            placeholder="2.1"
                          />
                        </TaggedField>
                        <div className="flex items-end pb-3 text-[12px] text-black/50">
                          {aem != null ? (
                            <span>
                              {t("Minutes per cell-day:")}{" "}
                              <span className="font-mono text-black/75">
                                {fmt(aem, 3)}
                              </span>
                            </span>
                          ) : null}
                        </div>
                      </>
                    ) : (
                      <>
                        <TaggedField
                          id={anchor(`pfc:line:${l.id}:aeo`)}
                          tag="16(a)"
                          need="required"
                          label={t("Anode-effect overvoltage")}
                        >
                          <NumberInput
                            value={l.aeo}
                            min={0}
                            unit="mV"
                            disabled={readOnly}
                            onChange={(v) => setLine(l.id, { aeo: v })}
                            ariaLabel={t("Anode-effect overvoltage")}
                          />
                        </TaggedField>
                        <TaggedField
                          id={anchor(`pfc:line:${l.id}:ce`)}
                          tag="16(a)"
                          need="required"
                          label={t("Current efficiency")}
                        >
                          <NumberInput
                            value={l.ce}
                            min={0}
                            max={100}
                            unit="%"
                            disabled={readOnly}
                            onChange={(v) => setLine(l.id, { ce: v })}
                            ariaLabel={t("Current efficiency")}
                          />
                        </TaggedField>
                      </>
                    )}
                  </div>
                </RowCard>
              );
            })}
            <p
              className={cn(
                "text-[12px]",
                Math.abs(shareTotal - 100) > 0.5
                  ? "text-[#b45309]"
                  : "text-black/50",
              )}
            >
              {t("Shares add up to")}{" "}
              <span className="font-mono">{fmt(shareTotal, 1)} %</span>
              {slope && potlinesAem(lines) != null && (
                <>
                  {" · "}
                  {t("Average minutes per cell-day:")}{" "}
                  <span className="font-mono text-black/75">
                    {fmt(potlinesAem(lines) as number, 3)}
                  </span>
                </>
              )}
            </p>
          </div>
        ) : (
          !readOnly && (
            <button
              type="button"
              onClick={() =>
                set({
                  potlines: [
                    {
                      ...emptyPotline(pfc.technology),
                      sharePct: 100,
                      aePerCellDay: undefined,
                      aeMinutes: undefined,
                      aeo: pfc.aeo,
                      ce: pfc.ce,
                    },
                  ],
                })
              }
              className="text-[12.5px] text-black/55 underline decoration-black/20 underline-offset-2 hover:text-black"
            >
              {t("My cells are not all one type, or the lines run differently")}
            </button>
          )
        )}
      </div>

      <div className="mt-4">
        {!ownOpen ? (
          !readOnly && (
            <button
              type="button"
              onClick={() => setOwnOpen(true)}
              className="text-[12.5px] text-black/55 underline decoration-black/20 underline-offset-2 hover:text-black"
            >
              {t("I have my own measured factors")}
            </button>
          )
        ) : (
          <div className="rounded-xl border border-black/[0.07] bg-[#faf9f7] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/40">
                {t("Your own factors")}
              </span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => {
                    setOwnOpen(false);
                    set({
                      ownCf4Factor: undefined,
                      ownC2f6Fraction: undefined,
                    });
                  }}
                  className="text-[12px] text-black/50 underline decoration-black/20 underline-offset-2 hover:text-black"
                >
                  {t("Back to the EU factors")}
                </button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TaggedField
                id={anchor("pfc:own")}
                tag="16(a)"
                need="optional"
                label={t("CF₄ factor")}
                hint={
                  slope
                    ? t(
                        "kg of CF₄ per tonne of aluminium, per anode-effect minute per cell-day.",
                      )
                    : t("kg of CF₄ per tonne of aluminium, per mV.")
                }
              >
                <NumberInput
                  value={pfc.ownCf4Factor}
                  min={0}
                  disabled={readOnly}
                  onChange={(v) => set({ ownCf4Factor: v })}
                  ariaLabel={t("Own CF₄ factor")}
                />
              </TaggedField>
              <TaggedField
                tag="16(a)"
                need="optional"
                label={t("C₂F₆ fraction")}
                hint={t("Tonnes of C₂F₆ per tonne of CF₄.")}
              >
                <NumberInput
                  value={pfc.ownC2f6Fraction}
                  min={0}
                  disabled={readOnly}
                  onChange={(v) => set({ ownC2f6Fraction: v })}
                  ariaLabel={t("Own C₂F₆ fraction")}
                />
              </TaggedField>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-black/45">
              {t(
                "Established by field measurement to industry best practice, within ±15%, and renewed at least every three years or when the cells change. Attach the measurement report on the Documents step.",
              )}
            </p>
          </div>
        )}
      </div>

      {result && (
        <div className="mt-5 grid gap-3 rounded-xl bg-[#faf9f7] px-4 py-3.5 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="CF₄" value={`${fmt(result.cf4T, 4)} t`} />
          <Stat label="C₂F₆" value={`${fmt(result.c2f6T, 5)} t`} />
          <Stat
            label={t("In the duct")}
            value={`${fmt(result.ductTCO2e, 2)} tCO₂e`}
          />
          <Stat
            label={t("Added to the month")}
            value={`${fmt(result.totalTCO2e, 2)} tCO₂e`}
            strong
          />
        </div>
      )}
      {result?.fellBack && (
        <p className="mt-2 text-[12px] leading-relaxed text-[#92620d]">
          {t(
            "The EU gives no slope factor for this cell type. Until you have measured your own, the centre-worked prebake values are used, as the rules allow.",
          )}
        </p>
      )}
      {!result && (tech || lines) && (
        <p className="mt-3 text-[12px] text-black/40">
          {t(
            "The figure appears once the cell type, the anode-effect reading and the duct share are in.",
          )}
        </p>
      )}
    </SectionCard>
  );
}

function Stat({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-[0.1em] text-black/40">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 font-mono text-[13px]",
          strong ? "text-black/90" : "text-black/65",
        )}
      >
        {value}
      </div>
    </div>
  );
}

/* ── What the metal is made of this month (steel, Annex IV item 35) ── */
export function CompositionCard({
  entry,
  patch,
  readOnly,
}: {
  entry: MonthlyEntry;
  patch: Patch;
  readOnly: boolean;
}) {
  const t = useT();
  const c = entry.composition ?? {};
  const set = (p: Partial<NonNullable<MonthlyEntry["composition"]>>) =>
    patch({ composition: { ...c, ...p } });
  const total = compositionTotal(entry.composition);
  const field = (
    key: "mnPct" | "crPct" | "niPct" | "otherPct",
    label: string,
    hint?: string,
  ) => (
    <TaggedField tag="35" need="optional" label={label} hint={hint}>
      <NumberInput
        value={c[key]}
        min={0}
        max={100}
        unit="%"
        disabled={readOnly}
        onChange={(v) => set({ [key]: v })}
        ariaLabel={label}
      />
    </TaggedField>
  );
  return (
    <SectionCard
      id={anchor("composition")}
      title={t("What the steel is made of")}
      helpTitle={t("Product composition")}
      help={
        <>
          <p>
            {t(
              "The alloying elements of what was made this month, from the mill test certificates, weighted by the heats cast.",
            )}
          </p>
          <p className="mt-2">
            {t(
              "The report states Mn, Cr, Ni and the other alloying elements for the year: the months' figures, weighted by what was made in each. Leave a month empty if it was ordinary carbon steel with only trace elements.",
            )}
          </p>
        </>
      }
      blurb={t(
        "Optional. Weighted by tonnes made across the year in the report.",
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {field("mnPct", t("% Mn"), t("Manganese."))}
        {field("crPct", t("% Cr"), t("Chromium."))}
        {field("niPct", t("% Ni"), t("Nickel."))}
        {field(
          "otherPct",
          t("% other alloys"),
          t("All other alloying elements together."),
        )}
      </div>
      <div className="mt-4 sm:max-w-xl">
        <TaggedField
          tag="35"
          need="optional"
          label={t("Where the figures come from")}
          hint={t("So a verifier knows which certificates to ask for.")}
        >
          <input
            className={inputClass}
            value={c.basis ?? ""}
            disabled={readOnly}
            onChange={(e) => set({ basis: e.target.value })}
            placeholder={t("Mill test certificates, weighted by heat")}
          />
        </TaggedField>
      </div>
      {total >= 8 && (
        <p className="mt-3 rounded-xl border border-[#f4d9a8] bg-[#fef3e2] px-4 py-3 text-[12.5px] leading-relaxed text-[#92620d]">
          {t(
            "This composition may qualify as high alloy steel rather than non-alloy steel — confirm the CN code and aggregated goods category are still correct for this product report.",
          )}
        </p>
      )}
    </SectionCard>
  );
}
