"use client";

export const runtime = "edge";

/* ════════════════════════════════════════════════════════════
   ACTIVITY DATA — the screen that makes the filing re-derivable

   Everywhere else in this portal an emissions figure is collected. Here it is
   CONSTRUCTED: fuel volumes and their calorific values, absolute electricity,
   process materials, and the production quantity they all divide by. The
   engine turns those into tCO₂e/t, and a verifier who re-runs the same
   arithmetic lands on the same number — which is the entire difference
   between a report and evidence.

   Three rules are load-bearing on this screen:
     · a fuel quantity in m³/kg/l needs an NCV, or the row will not compute
     · electricity is the period TOTAL, never per tonne
     · the production quantity is typed, never taken from the shipment log
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Fuel,
  Zap,
  FlaskConical,
  Factory,
  TriangleAlert,
  Info,
  Lock,
} from "lucide-react";
import {
  Card,
  Button,
  Eyebrow,
  Chip,
  EmptyState,
  inputClass,
  cn,
  useSaveState,
  SaveButton,
} from "@/components/ui";
import { Select } from "@/components/controls";
import { toast } from "@/components/toast";
import {
  ProvenanceForm,
  AssumptionChip,
} from "@/components/cbam/provenance-form";
import { DataGapSection } from "@/components/cbam/data-gap-section";
import { USER, type Declaration } from "@/lib/data";
import { useDeclaration } from "@/lib/declarations-query";
import { ErrorState, LoadingState } from "@/components/query-state";
import {
  emptyProvenance,
  emptyFuelEntry,
  emptyElectricityEntry,
  emptyProcessEntry,
  isAssumption,
  FUEL_KINDS,
  FUEL_LABEL,
  ELECTRICITY_FACTOR_SOURCES,
  ELECTRICITY_FACTOR_LABEL,
  PRODUCTION_NEVER_AUTOFILL_NOTE,
  isGridSourced,
  type ActivityDataset,
} from "@/lib/cbam/activity";
import {
  FUEL_UNITS,
  FUEL_UNIT_LABEL,
  needsNcv,
  ncvUnitLabel,
  toGJ,
  UnitError,
  CO2_PER_C,
} from "@/lib/cbam/units";
import { FUEL_EF_BAND } from "@/lib/cbam/reference";
import {
  gridFactorFor,
  gridFactorRowOrPlaceholder,
} from "@/lib/cbam/electricity-grid-factors";
import { CARBON_CONTENTS, carbonContentFor } from "@/lib/cbam/process-factors";
import {
  calendarYear,
  displayPeriod,
  displayDate,
  type ReportingPeriod,
} from "@/lib/cbam/boundary";
import {
  uid,
  addFuel,
  updateFuel,
  removeFuel,
  addElectricity,
  updateElectricity,
  removeElectricity,
  addProcess,
  updateProcess,
  removeProcess,
} from "@/lib/cbam/activity-store";
import {
  fuelTCO2,
  processTCO2,
  electricityTCO2,
  indirectIsChargeable,
} from "@/lib/cbam/engine";
import {
  chargeablePerTonne,
  dataGapPenalty,
  ownGoodsCnCodes,
  PENALTY_TITLE,
  PENALTY_SUBTITLE,
  publishedDefaultFor,
} from "@/lib/cbam/data-gaps";
import { defaultMarkup, rowForAnyCn } from "@/lib/cbam/eu-rates";
import { getCatalogProduct } from "@/lib/config";
import { certificatePriceSource } from "@/lib/carbon-economics";
import { compareShippedToProduced } from "@/lib/annual-production";
import { unlinkedShipmentsFor, shipmentsFor } from "@/lib/shipments";
import {
  useActivityDataset,
  useSaveActivityDataset,
  useDataGaps,
  useActiveSnapshot,
  useInvalidateCbam,
} from "@/lib/cbam/cbam-query";
import { useT } from "@/lib/i18n";

const num = (v: string): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fmt = (n: number, dp = 4) =>
  n.toLocaleString("en-US", { maximumFractionDigits: dp });

/* Sentinel for the material picker: a real material id can never be this, so
   selecting it is unambiguous. Storage still holds the typed name, not this. */
const MATERIAL_NOT_IN_TABLE = "__not_in_table";

/* ── Published figures win over stored ones ─────────────────────
   Two fields on this screen are looked up rather than typed: a grid row's
   emission factor and a Table 5 material's carbon content. The engine that
   computes the totals underneath reads what is IN STORAGE, while the rows
   render what the tables say — so a dataset saved before a table was
   corrected would show one number and total another. Reconciling on load
   keeps the arithmetic on screen self-consistent, and means an old dataset
   heals the moment somebody opens it. */
function withPublishedFactors(d: ActivityDataset): ActivityDataset {
  let changed = false;

  const electricity = d.electricity.map((e) => {
    if (!isGridSourced(e.factorSource)) return e;
    const published = gridFactorFor("TH")?.value ?? 0;
    if (published === e.emissionFactor) return e;
    changed = true;
    return { ...e, emissionFactor: published };
  });

  const processEmissions = d.processEmissions.map((p) => {
    const known = carbonContentFor(p.material);
    if (!known || known.tCPerT === p.carbonContent) return p;
    changed = true;
    return { ...p, carbonContent: known.tCPerT };
  });

  return changed ? { ...d, electricity, processEmissions } : d;
}

function periodFor(decl: Declaration): ReportingPeriod {
  if (decl.periodStart && decl.periodEnd)
    return {
      start: decl.periodStart,
      end: decl.periodEnd,
      type: "calendar_year",
    };
  const year = Number(
    /(20\d\d)/.exec(decl.period)?.[1] ?? new Date().getFullYear(),
  );
  return calendarYear(year);
}

export default function ActivityDataPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useT();
  const { id } = React.use(params);
  const router = useRouter();
  const { data: decl, isError, refetch } = useDeclaration(id);
  /* The pieces that live NEXT TO the declaration (localStorage stores,
     drafts, snapshots) load as queries once the declaration has. */
  const period = React.useMemo(
    () => (decl ? periodFor(decl) : undefined),
    [decl],
  );
  const { data: stored } = useActivityDataset(id, period, USER.name);
  const { data: gaps } = useDataGaps(id);
  /* Once the calculation is frozen these inputs are the record of what was
     approved, not a working document. Editing them would move a signed
     number, so the screen goes read-only and points at the revision path
     instead (lib/cbam/freeze.ts). */
  const { data: snapshot } = useActiveSnapshot(id);
  const saveActivity = useSaveActivityDataset();
  /* Gap writes happen inside DataGapSection, around the mutations — the
     callback flushes the cache so this screen re-reads them. */
  const invalidateCbam = useInvalidateCbam(id);
  const [dataset, setDataset] = React.useState<ActivityDataset | null>(null);
  const [productionInput, setProductionInput] = React.useState("");
  const save = useSaveState();

  React.useEffect(() => {
    if (decl === null) router.replace("/declarations");
  }, [decl, router]);

  /* The dataset is an edit buffer: seeded from the query ONCE per declaration,
     mutated locally, persisted through the save mutation. Seeding on every
     `stored` identity would wipe unsaved edits: loadDataset stamps a fresh
     provenance timestamp while production is unentered, so each refetch — a gap
     edit invalidating the cbam subtree, a window refocus — is a new reference,
     and this is a Save-button screen where edits sit unsaved by design. The
     ref reseeds only when the declaration itself changes, matching the old
     load-once-per-[decl] behaviour. */
  const seededFor = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!stored || seededFor.current === id) return;
    seededFor.current = id;
    const d = withPublishedFactors(stored);
    setDataset(d);
    setProductionInput(
      d.annualProductionTonnes > 0 ? String(d.annualProductionTonnes) : "",
    );
  }, [stored, id]);

  const shipped = React.useMemo(() => {
    if (!decl) return { linked: 0, candidates: 0 };
    const linked = shipmentsFor(decl.id).reduce(
      (a, s) => a + s.quantityTonnes,
      0,
    );
    const candidates = unlinkedShipmentsFor(decl).reduce(
      (a, s) => a + s.quantityTonnes,
      0,
    );
    return { linked, candidates };
  }, [decl]);

  /* The whole point of the screen, computed live from what is on it — with
     the engine's own guards, so a blocked row shows as blocked rather than as
     a quietly smaller number. Declared before the early return below: hooks
     cannot sit behind a conditional. */
  const computedTotals = React.useMemo(() => {
    let fuel = 0;
    let blocked = 0;
    for (const f of dataset?.fuels ?? []) {
      try {
        fuel += fuelTCO2(f);
      } catch {
        blocked += 1;
      }
    }
    const process = (dataset?.processEmissions ?? []).reduce(
      (a, p) => a + processTCO2(p),
      0,
    );
    const indirect = (dataset?.electricity ?? []).reduce(
      (a, e) => a + electricityTCO2(e),
      0,
    );
    return {
      fuelTCO2: fuel,
      processTCO2: process,
      indirectTCO2: indirect,
      totalTCO2: fuel + process + indirect,
      blocked,
    };
  }, [dataset]);

  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!decl || !dataset || gaps === undefined || snapshot === undefined)
    return <LoadingState />;

  const mutate = (next: ActivityDataset) => setDataset(next);

  const persist = (next: ActivityDataset = dataset) => {
    if (snapshot) {
      toast({
        message: "Frozen at version " + snapshot.version,
        detail:
          "These inputs are the approved record. Freeze a revision from internal sign-off to change them.",
        tone: "err",
      });
      return;
    }
    save.run(async () => {
      await saveActivity.mutateAsync({ dataset: next });
      toast({
        message: "Activity data saved",
        detail: "Every figure keeps its provenance.",
        tone: "ok",
      });
    });
  };

  const production = num(productionInput);
  const diff = compareShippedToProduced(
    production > 0 ? production : null,
    shipped.linked,
  );
  /* Every installation in this portal is Thai — see the note on
     `electricityFactorFor`, which defaults the same way. */
  const gridRow = gridFactorRowOrPlaceholder("TH");

  return (
    <div className="space-y-7">
      <div className="space-y-4">
        <Link
          href={`/declarations/${decl.id}`}
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-black/40 hover:text-black"
        >
          <ArrowLeft size={13} strokeWidth={1.5} /> {decl.title ?? decl.name}
        </Link>
        <div className="flex flex-col gap-4 border-b border-black/[0.06] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>{t("Activity data")}</Eyebrow>
            <h1 className="mt-2 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111] md:text-4xl">
              {t("What the emissions are made of")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-black/45">
              {t(
                "A verifier does not accept an emissions figure — they re-derive it. Enter the fuel, power and materials your installation actually consumed, and Certrace computes the per-tonne figure from them. Every input keeps where it came from.",
              )}
            </p>
          </div>
          <div className="flex flex-none flex-col items-start gap-2 md:items-end">
            <Chip>{displayPeriod(dataset.period)}</Chip>
            <SaveButton
              state={save.state}
              onClick={() => persist()}
              idleLabel={t("Save activity data")}
            />
          </div>
        </div>
      </div>

      {snapshot && (
        <Card warm className="border-black/15 p-5">
          <div className="flex items-start gap-3">
            <Lock
              size={16}
              strokeWidth={1.5}
              className="mt-0.5 flex-none text-black/55"
            />
            <div className="min-w-0">
              <p className="text-[13px] text-black/80">
                Frozen at version {snapshot.version} — these inputs are
                read-only
              </p>
              <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-black/50">
                Approved by {snapshot.approverId} on{" "}
                {displayDate(new Date(snapshot.frozenAt).toISOString())}. What
                was approved is what gets filed, so changing an input here would
                move a signed number. To bring new data in, freeze a revision
                from the declaration&apos;s internal sign-off step and record
                why the figure moved.
              </p>
              <p className="mt-2 font-mono text-[10px] text-black/30">
                {snapshot.engineVersion} · sha256{" "}
                {snapshot.contentHash.slice(0, 16)}…
              </p>
              <Link
                href={`/declarations/${decl.id}`}
                className="mt-3 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-black/45 hover:text-black"
              >
                {t("Go to sign-off to revise")}
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* ── 1 · Production quantity — THE denominator ───────────── */}
      <Card className="p-6">
        <SectionHead
          icon={Factory}
          n={1}
          title={t("Annual production quantity")}
          blurb={t(
            "The denominator behind every per-tonne figure in this filing.",
          )}
        />

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div>
            <label className="block">
              <span className="mb-2 block text-[11px] uppercase tracking-[0.1em] text-black/55">
                {t("Produced in the period (t)")}
              </span>
              <div className="flex items-center gap-2">
                <input
                  className={inputClass}
                  inputMode="decimal"
                  value={productionInput}
                  placeholder="e.g. 10500"
                  onChange={(e) => {
                    setProductionInput(e.target.value);
                    mutate({
                      ...dataset,
                      annualProductionTonnes: num(e.target.value),
                    });
                  }}
                />
                <span className="flex-none font-mono text-[12px] text-black/35">
                  t
                </span>
              </div>
            </label>
            <div className="mt-3">
              <ProvenanceForm
                value={dataset.annualProductionProvenance}
                onChange={(p) =>
                  mutate({ ...dataset, annualProductionProvenance: p })
                }
                compact
              />
            </div>
          </div>

          {/* Shipment context — never a prefill */}
          <div className="rounded-xl border border-black/[0.07] bg-[#faf9f7] p-4">
            <div className="flex items-start gap-2.5">
              <Info
                size={14}
                strokeWidth={1.5}
                className="mt-0.5 flex-none text-black/35"
              />
              <div className="min-w-0">
                <p className="text-[13px] text-black/70">
                  {t("Shipped, for context only")}
                </p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-black/45">
                  {PRODUCTION_NEVER_AUTOFILL_NOTE}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-[10px] uppercase tracking-[0.12em] text-black/35">
                      {t("Linked to this declaration")}
                    </dt>
                    <dd className="mt-1 font-mono text-[13px] text-black/70">
                      {fmt(shipped.linked, 1)} t
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-[0.12em] text-black/35">
                      {t("Unlinked in period")}
                    </dt>
                    <dd className="mt-1 font-mono text-[13px] text-black/45">
                      {fmt(shipped.candidates, 1)} t
                    </dd>
                  </div>
                </dl>
                {diff.overshipped && (
                  <p className="mt-3 flex items-start gap-1.5 text-[12px] leading-relaxed text-[#b45309]">
                    <TriangleAlert
                      size={12}
                      strokeWidth={1.8}
                      className="mt-[2px] flex-none"
                    />
                    More shipped ({fmt(diff.shippedTonnes, 1)} t) than produced
                    ({fmt(production, 1)} t). Opening stock explains a few
                    percent — beyond that, one of the two figures needs
                    correcting.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── 2 · Fuels ───────────────────────────────────────────── */}
      <Card className="p-6">
        <SectionHead
          icon={Fuel}
          n={2}
          title={t("Fuels")}
          blurb={t(
            "Emission factors are per GJ. A quantity in m³, kg or litres needs its net calorific value before it can become energy.",
          )}
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                mutate(addFuel(dataset, emptyFuelEntry(uid("fuel"), USER.name)))
              }
            >
              <Plus size={13} strokeWidth={1.5} /> {t("Add fuel")}
            </Button>
          }
        />

        {dataset.fuels.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title={t("No fuel entered yet")}
              body={t(
                "Add each fuel your installation burned in the period, taken from meter readings or supplier invoices.",
              )}
            />
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {dataset.fuels.map((f) => {
              const band = FUEL_EF_BAND[f.fuel];
              const efOutOfBand =
                f.emissionFactor > 0 &&
                (f.emissionFactor < band.low || f.emissionFactor > band.high);
              let gj: number | null = null;
              let unitError: string | null = null;
              try {
                gj = toGJ(f.quantity, f.unit, f.ncv);
              } catch (err) {
                unitError =
                  err instanceof UnitError
                    ? err.message
                    : "Cannot convert this quantity to energy.";
              }
              const tco2 =
                gj != null
                  ? gj * f.emissionFactor * (f.oxidationFactor ?? 1)
                  : null;

              return (
                <div
                  key={f.id}
                  className="rounded-2xl border border-black/[0.07] p-4"
                >
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="min-w-[170px] flex-1">
                      <FieldLabel>{t("Fuel")}</FieldLabel>
                      <Select
                        value={f.fuel}
                        onChange={(v) =>
                          mutate(
                            updateFuel(dataset, f.id, {
                              fuel: v as typeof f.fuel,
                            }),
                          )
                        }
                        options={FUEL_KINDS.map((k) => ({
                          value: k,
                          label: FUEL_LABEL[k],
                        }))}
                      />
                    </label>
                    <label className="min-w-[120px] flex-1">
                      <FieldLabel>{t("Quantity")}</FieldLabel>
                      <input
                        className={inputClass}
                        inputMode="decimal"
                        value={f.quantity || ""}
                        onChange={(e) =>
                          mutate(
                            updateFuel(dataset, f.id, {
                              quantity: num(e.target.value),
                            }),
                          )
                        }
                      />
                    </label>
                    <label className="min-w-[110px] flex-none">
                      <FieldLabel>{t("Unit")}</FieldLabel>
                      <Select
                        value={f.unit}
                        onChange={(v) =>
                          mutate(
                            updateFuel(dataset, f.id, {
                              unit: v as typeof f.unit,
                            }),
                          )
                        }
                        options={FUEL_UNITS.map((u) => ({
                          value: u,
                          label: FUEL_UNIT_LABEL[u],
                        }))}
                      />
                    </label>
                    <label className="min-w-[140px] flex-1">
                      <FieldLabel>
                        {needsNcv(f.unit)
                          ? `NCV (${ncvUnitLabel(f.unit)})`
                          : "NCV — not needed"}
                      </FieldLabel>
                      <input
                        className={cn(
                          inputClass,
                          unitError && "border-[#dc2626]/50",
                        )}
                        inputMode="decimal"
                        disabled={!needsNcv(f.unit)}
                        value={f.ncv ?? ""}
                        placeholder={
                          needsNcv(f.unit) ? "from the fuel spec sheet" : "—"
                        }
                        onChange={(e) =>
                          mutate(
                            updateFuel(dataset, f.id, {
                              ncv:
                                e.target.value === ""
                                  ? undefined
                                  : num(e.target.value),
                              ncvProvenance:
                                f.ncvProvenance ?? emptyProvenance(USER.name),
                            }),
                          )
                        }
                      />
                    </label>
                    <label className="min-w-[150px] flex-1">
                      <FieldLabel>{t("Emission factor (tCO₂/GJ)")}</FieldLabel>
                      <input
                        className={cn(
                          inputClass,
                          efOutOfBand && "border-[#d97706]/60",
                        )}
                        inputMode="decimal"
                        value={f.emissionFactor || ""}
                        onChange={(e) =>
                          mutate(
                            updateFuel(dataset, f.id, {
                              emissionFactor: num(e.target.value),
                            }),
                          )
                        }
                      />
                    </label>
                    <label className="min-w-[100px] flex-none">
                      <FieldLabel>{t("Oxidation")}</FieldLabel>
                      <input
                        className={inputClass}
                        inputMode="decimal"
                        value={f.oxidationFactor ?? 1}
                        onChange={(e) =>
                          mutate(
                            updateFuel(dataset, f.id, {
                              oxidationFactor: num(e.target.value),
                            }),
                          )
                        }
                      />
                    </label>
                    <button
                      aria-label={t("Remove fuel")}
                      onClick={() => mutate(removeFuel(dataset, f.id))}
                      className="mb-3 flex-none text-black/25 hover:text-[#dc2626]"
                    >
                      <Trash2 size={15} strokeWidth={1.5} />
                    </button>
                  </div>

                  {/* Live derivation — the row shows its own arithmetic */}
                  <div className="mt-3 rounded-xl border border-black/[0.05] bg-white px-3 py-2.5 font-mono text-[12px]">
                    {unitError ? (
                      <span className="flex items-start gap-1.5 text-[#dc2626]">
                        <TriangleAlert
                          size={12}
                          strokeWidth={1.8}
                          className="mt-[2px] flex-none"
                        />
                        <span className="font-sans">{unitError}</span>
                      </span>
                    ) : (
                      <span className="text-black/55">
                        {fmt(f.quantity, 2)} {t(FUEL_UNIT_LABEL[f.unit])}
                        {needsNcv(f.unit) &&
                          ` × ${fmt(f.ncv ?? 0, 4)} ${ncvUnitLabel(f.unit)}`}{" "}
                        ={" "}
                        <span className="text-black/80">
                          {fmt(gj ?? 0, 2)} GJ
                        </span>
                        {"  →  "}× {fmt(f.emissionFactor, 4)} tCO₂/GJ ×{" "}
                        {fmt(f.oxidationFactor ?? 1, 2)} ={" "}
                        <span className="text-black/80">
                          {fmt(tco2 ?? 0, 4)} tCO₂
                        </span>
                      </span>
                    )}
                  </div>
                  {efOutOfBand && (
                    <p className="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-[#b45309]">
                      <TriangleAlert
                        size={12}
                        strokeWidth={1.8}
                        className="mt-[2px] flex-none"
                      />
                      <span>
                        {fmt(f.emissionFactor, 4)} tCO₂/GJ sits outside the
                        plausible range for {FUEL_LABEL[f.fuel].toLowerCase()} (
                        {band.low}–{band.high}). A factor read per m³ instead of
                        per GJ lands roughly 25× high. Source: {band.source}
                      </span>
                    </p>
                  )}

                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <div>
                      <FieldLabel>{t("Quantity — provenance")}</FieldLabel>
                      <ProvenanceForm
                        value={f.provenance}
                        onChange={(p) =>
                          mutate(updateFuel(dataset, f.id, { provenance: p }))
                        }
                        compact
                      />
                    </div>
                    <div>
                      <FieldLabel>
                        {t("Emission factor — provenance")}
                      </FieldLabel>
                      <ProvenanceForm
                        value={f.efProvenance}
                        onChange={(p) =>
                          mutate(updateFuel(dataset, f.id, { efProvenance: p }))
                        }
                        compact
                      />
                    </div>
                    {needsNcv(f.unit) && f.ncvProvenance && (
                      <div>
                        <FieldLabel>{t("NCV — provenance")}</FieldLabel>
                        <ProvenanceForm
                          value={f.ncvProvenance}
                          onChange={(p) =>
                            mutate(
                              updateFuel(dataset, f.id, { ncvProvenance: p }),
                            )
                          }
                          compact
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── 3 · Electricity ─────────────────────────────────────── */}
      <Card className="p-6">
        <SectionHead
          icon={Zap}
          n={3}
          title={t("Electricity")}
          blurb={t(
            "Absolute MWh for the whole period — never per tonne. Certrace divides by production once, inside the calculation.",
          )}
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                mutate(
                  addElectricity(
                    dataset,
                    emptyElectricityEntry(uid("elec"), USER.name),
                  ),
                )
              }
            >
              <Plus size={13} strokeWidth={1.5} /> {t("Add meter")}
            </Button>
          }
        />

        {dataset.electricity.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title={t("No electricity entered yet")}
              body={t(
                "Add the total drawn across the period — usually the sum of twelve monthly utility bills.",
              )}
            />
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {dataset.electricity.map((e) => {
              /* Grid supply takes the country default and nothing else. The
                 stored figure is never trusted for a grid row — the table is
                 read on every render, so a factor that changes (or arrives)
                 shows up without anyone re-typing it. */
              const locked = isGridSourced(e.factorSource);
              const published = locked ? gridRow.value : null;
              const factor = locked ? (published ?? 0) : e.emissionFactor;
              const tco2 = e.mwhAbsolute * factor;
              const perTonne = production > 0 ? tco2 / production : null;
              return (
                <div
                  key={e.id}
                  className="rounded-2xl border border-black/[0.07] p-4"
                >
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="min-w-[170px] flex-1">
                      <FieldLabel>
                        {t("Consumption (MWh, whole period)")}
                      </FieldLabel>
                      <input
                        className={inputClass}
                        inputMode="decimal"
                        value={e.mwhAbsolute || ""}
                        placeholder="e.g. 4725"
                        onChange={(ev) =>
                          mutate(
                            updateElectricity(dataset, e.id, {
                              mwhAbsolute: num(ev.target.value),
                            }),
                          )
                        }
                      />
                    </label>
                    <label className="min-w-[150px] flex-1">
                      <FieldLabel>
                        {t("Emission factor (tCO₂/MWh)")}
                        {locked && (
                          <Lock
                            size={11}
                            strokeWidth={1.5}
                            className="ml-1.5 inline-block align-[-1px] text-black/30"
                          />
                        )}
                      </FieldLabel>
                      <input
                        className={cn(
                          inputClass,
                          locked && "bg-black/[0.03] text-black/55",
                        )}
                        inputMode="decimal"
                        value={
                          locked ? (published ?? "") : e.emissionFactor || ""
                        }
                        readOnly={locked}
                        aria-readonly={locked}
                        /* No suggested number on a free-typed row: PPA and
                           self-generated factors come from the generator, and
                           a hint here would be read as the expected answer. */
                        placeholder={
                          locked
                            ? t("Awaiting the published default")
                            : t("From your contract or fuel mix")
                        }
                        onChange={(ev) =>
                          mutate(
                            updateElectricity(dataset, e.id, {
                              emissionFactor: num(ev.target.value),
                            }),
                          )
                        }
                      />
                    </label>
                    <label className="min-w-[190px] flex-1">
                      <FieldLabel>{t("Factor source")}</FieldLabel>
                      <Select
                        value={e.factorSource}
                        onChange={(v) => {
                          const next = v as typeof e.factorSource;
                          /* Switching to grid overwrites whatever was typed:
                             a grid row carries the country default or nothing. */
                          mutate(
                            updateElectricity(dataset, e.id, {
                              factorSource: next,
                              ...(isGridSourced(next)
                                ? { emissionFactor: gridRow.value ?? 0 }
                                : {}),
                            }),
                          );
                        }}
                        options={ELECTRICITY_FACTOR_SOURCES.map((s) => ({
                          value: s,
                          label: ELECTRICITY_FACTOR_LABEL[s],
                        }))}
                      />
                    </label>
                    <button
                      aria-label={t("Remove meter")}
                      onClick={() => mutate(removeElectricity(dataset, e.id))}
                      className="mb-3 flex-none text-black/25 hover:text-[#dc2626]"
                    >
                      <Trash2 size={15} strokeWidth={1.5} />
                    </button>
                  </div>

                  <div className="mt-3 rounded-xl border border-black/[0.05] bg-white px-3 py-2.5 font-mono text-[12px] text-black/55">
                    {fmt(e.mwhAbsolute, 2)} MWh × {fmt(factor, 4)} tCO₂/MWh ={" "}
                    <span className="text-black/80">{fmt(tco2, 4)} tCO₂</span>
                    {perTonne != null ? (
                      <>
                        {"  →  ÷ "}
                        {fmt(production, 0)} t ={" "}
                        <span className="text-black/80">
                          {fmt(perTonne, 7)} tCO₂e/t
                        </span>
                      </>
                    ) : (
                      <span className="ml-2 font-sans text-[#b45309]">
                        {t(
                          "enter the production quantity to derive the per-tonne figure",
                        )}
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    <FieldLabel>{t("Provenance")}</FieldLabel>
                    <ProvenanceForm
                      value={e.provenance}
                      onChange={(p) =>
                        mutate(
                          updateElectricity(dataset, e.id, { provenance: p }),
                        )
                      }
                      compact
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* The citation travels with the number, from the one table that owns
            it — so a verifier reading this line is told where the figure
            actually came from, including when the honest answer is "not
            published yet". */}
        <p className="mt-4 text-[11.5px] leading-relaxed text-black/35">
          {/* The citation already names the figure — printing the number
              again ahead of it just says 0.47 twice. */}
          {gridRow.citation}
        </p>
      </Card>

      {/* ── 4 · Process emissions ───────────────────────────────── */}
      <Card className="p-6">
        <SectionHead
          icon={FlaskConical}
          n={4}
          title={t("Process emissions")}
          blurb={t(
            "Carbon that leaves as CO₂ without being burned as fuel — graphite electrodes, limestone flux. Mass × carbon content × 44/12.",
          )}
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                mutate(
                  addProcess(
                    dataset,
                    emptyProcessEntry(uid("proc"), USER.name),
                  ),
                )
              }
            >
              <Plus size={13} strokeWidth={1.5} /> {t("Add material")}
            </Button>
          }
        />

        {dataset.processEmissions.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title={t("No process materials entered yet")}
              body={t(
                "An EAF route normally carries at least graphite electrode consumption.",
              )}
            />
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {dataset.processEmissions.map((p) => {
              /* A material named in Point G Table 5 carries its own carbon
                 content, so the figure is looked up rather than typed. Rows
                 saved before this picker existed hold free text that matches
                 nothing in the table — they fall to the "other" branch and
                 keep the number they were entered with. */
              const known = carbonContentFor(p.material);
              const carbonContent = known ? known.tCPerT : p.carbonContent;
              const tco2 = p.massTonnes * carbonContent * CO2_PER_C.value;
              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-black/[0.07] p-4"
                >
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="min-w-[190px] flex-1">
                      <FieldLabel>{t("Material")}</FieldLabel>
                      <Select
                        value={known ? p.material : MATERIAL_NOT_IN_TABLE}
                        onChange={(v) =>
                          mutate(
                            updateProcess(
                              dataset,
                              p.id,
                              v === MATERIAL_NOT_IN_TABLE
                                ? { material: "" }
                                : {
                                    material: v,
                                    carbonContent:
                                      carbonContentFor(v)?.tCPerT ?? 0,
                                  },
                            ),
                          )
                        }
                        options={[
                          ...CARBON_CONTENTS.map((c) => ({
                            value: c.material,
                            label: c.label,
                            hint: `${c.tCPerT} t C/t`,
                          })),
                          {
                            value: MATERIAL_NOT_IN_TABLE,
                            label: t("Not in the table — enter it"),
                            hint: t(
                              "Needs its own carbon content and evidence",
                            ),
                          },
                        ]}
                      />
                    </label>
                    {!known && (
                      <label className="min-w-[170px] flex-1">
                        <FieldLabel>{t("Material name")}</FieldLabel>
                        <input
                          className={inputClass}
                          value={p.material}
                          placeholder={t("e.g. graphite electrode")}
                          onChange={(e) =>
                            mutate(
                              updateProcess(dataset, p.id, {
                                material: e.target.value,
                              }),
                            )
                          }
                        />
                      </label>
                    )}
                    <label className="min-w-[130px] flex-1">
                      <FieldLabel>{t("Mass (t)")}</FieldLabel>
                      <input
                        className={inputClass}
                        inputMode="decimal"
                        value={p.massTonnes || ""}
                        onChange={(e) =>
                          mutate(
                            updateProcess(dataset, p.id, {
                              massTonnes: num(e.target.value),
                            }),
                          )
                        }
                      />
                    </label>
                    <label className="min-w-[150px] flex-1">
                      <FieldLabel>
                        {t("Carbon content (0–1)")}
                        {known && (
                          <Lock
                            size={11}
                            strokeWidth={1.5}
                            className="ml-1.5 inline-block align-[-1px] text-black/30"
                          />
                        )}
                      </FieldLabel>
                      <input
                        className={cn(
                          inputClass,
                          known && "bg-black/[0.03] text-black/55",
                        )}
                        inputMode="decimal"
                        value={carbonContent}
                        readOnly={!!known}
                        aria-readonly={!!known}
                        onChange={(e) =>
                          mutate(
                            updateProcess(dataset, p.id, {
                              carbonContent: num(e.target.value),
                            }),
                          )
                        }
                      />
                    </label>
                    <button
                      aria-label={t("Remove material")}
                      onClick={() => mutate(removeProcess(dataset, p.id))}
                      className="mb-3 flex-none text-black/25 hover:text-[#dc2626]"
                    >
                      <Trash2 size={15} strokeWidth={1.5} />
                    </button>
                  </div>

                  <div className="mt-3 rounded-xl border border-black/[0.05] bg-white px-3 py-2.5 font-mono text-[12px] text-black/55">
                    {fmt(p.massTonnes, 2)} t × {fmt(carbonContent, 4)} × 44/12 ={" "}
                    <span className="text-black/80">{fmt(tco2, 4)} tCO₂</span>
                  </div>

                  {/* The citation travels with the figure. Where the operator
                      supplied their own, the screen says the evidence has to
                      as well — a carbon content nobody sourced is the way a
                      wrong one survives review. */}
                  <p className="mt-2 text-[11.5px] leading-relaxed text-black/35">
                    {known
                      ? `${known.tCPerT} t C/t — ${known.source}`
                      : t(
                          "Not a Point G Table 5 material. Record where this carbon content came from in the provenance below — a lab analysis or a supplier specification.",
                        )}
                  </p>

                  <div className="mt-3">
                    <FieldLabel>{t("Provenance")}</FieldLabel>
                    <ProvenanceForm
                      value={p.provenance}
                      onChange={(pr) =>
                        mutate(updateProcess(dataset, p.id, { provenance: pr }))
                      }
                      compact
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── 5 · Month coverage & data gaps ──────────────────────── */}
      <DataGapSection
        declarationId={decl.id}
        period={dataset.period}
        monthsWithData={dataset.monthsCovered ?? []}
        gaps={gaps}
        onGapsChange={invalidateCbam}
        onMonthsChange={(months) => {
          const next = { ...dataset, monthsCovered: months };
          setDataset(next);
          saveActivity.mutate({ dataset: next });
        }}
        totalTCO2e={computedTotals.totalTCO2}
        enteredBy={USER.name}
      />

      {/* What the whole dataset comes to — the point of entering any of it */}
      <DerivedTotals
        totals={computedTotals}
        production={production}
        reportingYear={Number(periodFor(decl).start.slice(0, 4))}
        country={decl.origin}
        ownCnCodes={ownGoodsCnCodes(
          decl.requests,
          (id) => getCatalogProduct(id)?.cnCode,
        )}
      />

      {/* Assumptions roll-up — every ASSUMPTION on one screen, because that is
          the list a verifier asks for by name */}
      <AssumptionsSummary dataset={dataset} />

      <div className="flex justify-end pb-4">
        <SaveButton
          state={save.state}
          onClick={() => persist()}
          idleLabel={t("Save activity data")}
        />
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-[10px] uppercase tracking-[0.12em] text-black/40">
      {children}
    </span>
  );
}

function SectionHead({
  icon: Icon,
  n,
  title,
  blurb,
  action,
}: {
  icon: React.ElementType;
  n: number;
  title: string;
  blurb: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-9 w-9 flex-none place-items-center rounded-xl border border-black/10 text-black/55">
          <Icon size={16} strokeWidth={1.5} />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-black/30">{n}</span>
            <h2 className="text-[15px] text-black/80">{title}</h2>
          </div>
          <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-black/45">
            {blurb}
          </p>
        </div>
      </div>
      {action && <div className="flex-none">{action}</div>}
    </div>
  );
}

/* What the dataset comes to, and what NOT having it would cost.

   The second half is the reframing this build insisted on: a published
   default value is a PENALTY for absent data, not a discount for skipping the
   work. Both of its inputs are explicitly unresolved (spec §9) — the
   published default per CN code and the certificate price — so the figure
   renders with its warnings attached rather than as a confident number. */
function DerivedTotals({
  totals,
  production,
  reportingYear,
  country,
  ownCnCodes,
}: {
  totals: {
    fuelTCO2: number;
    processTCO2: number;
    indirectTCO2: number;
    totalTCO2: number;
    blocked: number;
  };
  production: number;
  reportingYear: number;
  /** installation country: the declaration's origin, which picks the Annex I table */
  country: string;
  /** CN codes of the exporter's own goods; the penalty prices exactly one */
  ownCnCodes: string[];
}) {
  const t = useT();
  const pricing = certificatePriceSource();

  if (!(production > 0) || totals.totalTCO2 <= 0) return null;

  const directPerTonne = (totals.fuelTCO2 + totals.processTCO2) / production;
  const indirectPerTonne = totals.indirectTCO2 / production;

  /* The Annex I row needs one CN code. Several codes would need the production
     split per good, which the dataset does not hold, so no figure is shown. */
  const ownCn = ownCnCodes.length === 1 ? ownCnCodes[0] : null;
  /* Chargeability needs only the sector, so it holds for several CN codes as long as they share one. */
  const sectors = new Set(ownCnCodes.map((cn) => rowForAnyCn(cn)?.sector));
  const sector = sectors.size === 1 ? [...sectors][0] : undefined;
  const chargeable = sector
    ? chargeablePerTonne(sector, directPerTonne, indirectPerTonne)
    : directPerTonne;
  const published = ownCn
    ? publishedDefaultFor(ownCn, country, reportingYear)
    : null;
  const penalty =
    ownCn && sector && published !== null
      ? dataGapPenalty({
          defaultValue: published,
          chargeableSEE: chargeable,
          quantityTonnes: production,
          certificatePrice: pricing.pricePerTonneEUR,
          markup: defaultMarkup(sector, reportingYear),
        })
      : null;
  const noPenaltyReason =
    ownCnCodes.length === 0
      ? "No CN code on this declaration's own goods, so there is no published default to price the gap against."
      : ownCnCodes.length > 1
        ? `This declaration covers ${ownCnCodes.length} CN codes. The penalty needs one good, because production is not split per CN.`
        : `Annex I publishes no default for CN ${ownCn} in ${country}.`;

  return (
    <Card highlight className="p-6">
      <Eyebrow>{t("Derived from what you entered")}</Eyebrow>
      <div className="mt-4 grid gap-5 sm:grid-cols-3">
        <Derived
          label={t("Direct")}
          value={`${directPerTonne.toFixed(7)} tCO₂e/t`}
          sub={`${totals.fuelTCO2.toFixed(2)} fuel + ${totals.processTCO2.toFixed(2)} process tCO₂`}
        />
        <Derived
          label={t("Indirect")}
          value={`${indirectPerTonne.toFixed(7)} tCO₂e/t`}
          sub={`${totals.indirectTCO2.toFixed(2)} tCO₂ · ${sector && indirectIsChargeable(sector) ? "chargeable for this good" : "reported, not chargeable for this good"}`}
        />
        <Derived
          label={t("Chargeable (own process)")}
          value={`${chargeable.toFixed(7)} tCO₂e/t`}
          sub={t("before precursors")}
        />
      </div>
      {totals.blocked > 0 && (
        <p className="mt-4 flex items-start gap-1.5 text-[12.5px] leading-relaxed text-[#dc2626]">
          <TriangleAlert
            size={13}
            strokeWidth={1.8}
            className="mt-[2px] flex-none"
          />
          {totals.blocked} fuel row{totals.blocked === 1 ? " is" : "s are"}{" "}
          excluded — a quantity in m³, kg or litres cannot become energy without
          its net calorific value.
        </p>
      )}

      <div className="mt-6 rounded-2xl border border-[#d97706]/25 bg-[#fffbeb] p-4">
        <div className="flex items-center gap-2">
          <TriangleAlert
            size={14}
            strokeWidth={1.8}
            className="flex-none text-[#b45309]"
          />
          <span className="text-[13px] text-black/80">{PENALTY_TITLE}</span>
          <span className="text-[11.5px] text-black/45">
            · {PENALTY_SUBTITLE}
          </span>
        </div>
        {penalty && published !== null ? (
          <>
            <p className="mt-2 text-[13px] leading-relaxed text-black/65">
              {penalty.headline}
            </p>
            <p className="mt-2 font-mono text-[12px] text-black/55">
              Δ {penalty.delta.toFixed(4)} tCO₂e/t ×{" "}
              {production.toLocaleString("en-US")} t × €
              {pricing.pricePerTonneEUR} ={" "}
              <span className="text-black/80">
                €
                {Math.abs(penalty.currency).toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}
              </span>
            </p>
          </>
        ) : (
          <p className="mt-2 text-[13px] leading-relaxed text-black/65">
            {noPenaltyReason}
          </p>
        )}
        <ul className="mt-3 space-y-1.5 text-[11.5px] leading-relaxed text-black/45">
          {penalty && published !== null && (
            <li>
              · Published default {published.toFixed(3)} tCO₂e/t for CN {ownCn}{" "}
              in {country}, {reportingYear} (Annex I, Reg. (EU) 2025/2621). The{" "}
              {Math.round(penalty.markup * 100)}% markup is already inside it.
            </li>
          )}
          <li>· {pricing.warning}</li>
        </ul>
      </div>
    </Card>
  );
}

function Derived({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.12em] text-black/40">
        {label}
      </div>
      <div className="mt-1.5 font-mono text-[15px] text-black/80">{value}</div>
      <div className="mt-1 text-[11.5px] text-black/40">{sub}</div>
    </div>
  );
}

/* Every input the exporter declared as an assumption, in one place. This is
   the list that becomes the MMD's assumptions register (validation V15) — a
   verifier asks for it explicitly, and an exporter who can see it growing
   tends to go and find the invoice instead. */
function AssumptionsSummary({ dataset }: { dataset: ActivityDataset }) {
  const t = useT();
  const rows: { label: string; reference?: string }[] = [];
  if (isAssumption(dataset.annualProductionProvenance)) {
    rows.push({
      label: "Annual production quantity",
      reference: dataset.annualProductionProvenance.reference,
    });
  }
  for (const f of dataset.fuels) {
    if (isAssumption(f.provenance))
      rows.push({
        label: `${t(FUEL_LABEL[f.fuel])} — quantity`,
        reference: f.provenance.reference,
      });
    if (isAssumption(f.efProvenance))
      rows.push({
        label: `${t(FUEL_LABEL[f.fuel])} — emission factor`,
        reference: f.efProvenance.reference,
      });
    if (f.ncvProvenance && isAssumption(f.ncvProvenance))
      rows.push({
        label: `${t(FUEL_LABEL[f.fuel])} — net calorific value`,
        reference: f.ncvProvenance.reference,
      });
  }
  for (const e of dataset.electricity) {
    if (isAssumption(e.provenance))
      rows.push({
        label: "Electricity consumption & factor",
        reference: e.provenance.reference,
      });
  }
  for (const p of dataset.processEmissions) {
    if (isAssumption(p.provenance))
      rows.push({
        label: `${p.material || "Process material"} — mass & carbon content`,
        reference: p.provenance.reference,
      });
  }

  if (rows.length === 0) return null;

  return (
    <Card warm className="border-[#d97706]/25 p-6">
      <div className="flex items-center gap-3">
        <AssumptionChip />
        <h2 className="text-[15px] text-black/80">
          {rows.length} input{rows.length === 1 ? "" : "s"} declared as an
          assumption
        </h2>
      </div>
      <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-black/50">
        {t(
          "Assumptions are allowed — undeclared ones are not. Every entry below appears in the Monitoring Methodology Documentation's assumptions register, and a verifier will ask how each was derived and whether it was biased in your favour.",
        )}
      </p>
      <ul className="mt-4 space-y-2">
        {rows.map((r, i) => (
          <li
            key={i}
            className="flex items-baseline gap-2 text-[13px] text-black/65"
          >
            <span className="font-mono text-[10px] text-black/30">
              {String(i + 1).padStart(2, "0")}
            </span>
            {r.label}
            {r.reference && (
              <span className="text-[11px] text-black/35">· {r.reference}</span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
