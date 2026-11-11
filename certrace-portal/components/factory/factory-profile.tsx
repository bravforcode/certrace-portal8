"use client";

import * as React from "react";
import { Button, Card, EmptyState, Progress, StatusDot, inputClass, useFlash } from "@/components/ui";
import { PROCESS_STEPS, PROCESS_STEP_HINT, PROCESS_STEP_LABEL, type ProcessStep } from "@/lib/cbam/boundary";
import { useT, type TFunction } from "@/lib/i18n";
import {
  emptyProfile, factoryGaps, factoryProgress, processesFromSteps, productionMismatch, validateProfile,
  type FactoryGap, type FactoryProfile, type MeterFrequency, type ProcessRow, type SourceKind,
} from "@/lib/factory/profile";
import { readFactory, saveFactory } from "@/lib/factory/store";

type Group = "processes" | "sources" | "meters" | "production";
const GROUPS: Group[] = ["processes", "sources", "meters", "production"];
const GROUP_LABEL: Record<Group, string> = {
  processes: "Processes",
  sources: "Emission sources",
  meters: "Meters and data",
  production: "Production",
};
const KINDS: SourceKind[] = ["combustion", "process", "electricity", "other"];
const KIND_LABEL: Record<SourceKind, string> = {
  combustion: "Combustion",
  process: "Process emission",
  electricity: "Electricity",
  other: "Other",
};
const FREQUENCIES: MeterFrequency[] = ["continuous", "daily", "weekly", "monthly", "per-delivery", "annual"];
const FREQUENCY_LABEL: Record<MeterFrequency, string> = {
  continuous: "Continuous",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  "per-delivery": "Per delivery",
  annual: "Annual",
};
const id = () => crypto.randomUUID();
const monthKey = (year: number, i: number) => `${year}-${String(i + 1).padStart(2, "0")}`;

// Field errors arrive as "path: message". The message is English from the
// validator, so it is translated here; anything with a number is matched by shape.
function errorText(t: TFunction, message: string) {
  const at = /^at most (\d+) characters$/.exec(message);
  if (at) return t("at most {n} characters", { n: at[1]! });
  const rows = /^at most (\d+) rows$/.exec(message);
  if (rows) return t("at most {n} rows", { n: rows[1]! });
  return t(message);
}

function gapText(t: TFunction, gap: FactoryGap, p: FactoryProfile): string {
  const proc = p.processes.find((x) => x.id === gap.refId);
  const meter = p.meters.find((x) => x.id === gap.refId);
  const source = p.sources.find((x) => x.id === gap.refId);
  if (gap.key === "processes:none") return t("Add the processes inside the installation boundary.");
  if (gap.key.endsWith(":no-source") && proc) return t("{name} has no emission source.", { name: proc.name });
  if (gap.key.endsWith(":no-meter") && source) return t("{name} has no meter or data source.", { name: source.name });
  if (gap.key.endsWith(":owner") && meter) return t("Who reads {name}?", { name: meter.name });
  if (gap.key.endsWith(":calibration") && meter)
    return t("{name} calibration expired on {date}.", { name: meter.name, date: meter.calibratedUntil });
  if (gap.group === "production")
    return t("Production missing for: {months}", { months: gap.message.replace("Production missing for: ", "") });
  return gap.message;
}

export function FactoryProfileView({
  installationId,
  stepNames,
  year = new Date().getFullYear(),
  workbookTonnes,
}: {
  installationId: string;
  /** Process step names from the workbook; the caller passes stepNames(cells). */
  stepNames: string[];
  /** Reporting year the production months are checked against. */
  year?: number;
  /** Products total from the workbook, for the mismatch hint. */
  workbookTonnes?: number;
}) {
  const t = useT();
  const [profile, setProfile] = React.useState<FactoryProfile>(emptyProfile);
  const [tab, setTab] = React.useState<Group>("processes");
  const [focusId, setFocusId] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [saveError, setSaveError] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [saved, flashSaved] = useFlash();

  // Storage is browser-side, so the profile is read after mount, not during render.
  React.useEffect(() => {
    setProfile(readFactory(installationId));
    setErrors([]);
    setSaveError("");
  }, [installationId]);

  React.useEffect(() => {
    if (!focusId) return;
    const row = document.getElementById(`factory-row-${focusId}`);
    row?.querySelector<HTMLElement>("input, select")?.focus();
    setFocusId(null);
  }, [focusId, tab]);

  const gaps = React.useMemo(() => factoryGaps(profile, year), [profile, year]);
  const progress = React.useMemo(() => factoryProgress(profile, year), [profile, year]);
  const groupGaps = (g: Group) => gaps.filter((x) => x.group === g);
  const mismatch = workbookTonnes ? productionMismatch(profile, year, workbookTonnes) : null;

  const fieldError = (path: string) => {
    const hit = errors.find((e) => e.startsWith(path + ":"));
    return hit ? errorText(t, hit.slice(path.length + 2)) : null;
  };

  const update = <K extends keyof FactoryProfile>(key: K, rows: FactoryProfile[K]) =>
    setProfile((p) => ({ ...p, [key]: rows }));

  const importSteps = () => setProfile((p) => processesFromSteps(p, stepNames));

  const addMissingMonths = () => {
    const have = new Set(profile.production.map((r) => r.month));
    const added = Array.from({ length: 12 }, (_, i) => monthKey(year, i))
      .filter((m) => !have.has(m))
      .map((month) => ({ month, product: profile.production.at(-1)?.product ?? "", tonnes: 0 }));
    update("production", [...profile.production, ...added]);
  };

  const removeProcess = (proc: ProcessRow) => {
    const sources = profile.sources.filter((s) => s.processId === proc.id);
    if (sources.length && !window.confirm(t("Delete {name} and its {n} sources?", { name: proc.name, n: sources.length }))) return;
    const sourceIds = new Set(sources.map((s) => s.id));
    setProfile((p) => ({
      ...p,
      processes: p.processes.filter((x) => x.id !== proc.id),
      sources: p.sources.filter((s) => !sourceIds.has(s.id)),
      meters: p.meters.filter((m) => !sourceIds.has(m.sourceId)),
    }));
  };

  const removeSource = (sourceId: string, name: string) => {
    const meters = profile.meters.filter((m) => m.sourceId === sourceId);
    if (meters.length && !window.confirm(t("Delete {name} and its {n} meters?", { name, n: meters.length }))) return;
    setProfile((p) => ({
      ...p,
      sources: p.sources.filter((s) => s.id !== sourceId),
      meters: p.meters.filter((m) => m.sourceId !== sourceId),
    }));
  };

  const save = async () => {
    const checked = validateProfile(profile);
    setSaveError("");
    if (!checked.ok) {
      setErrors(checked.errors);
      setSaveError(t("Fix the highlighted fields before saving."));
      return;
    }
    setErrors([]);
    setSaving(true);
    try {
      await saveFactory(installationId, profile);
      flashSaved();
    } catch {
      setSaveError(t("Could not save the factory profile. Your edits are still here."));
    } finally {
      setSaving(false);
    }
  };

  const goto = (gap: FactoryGap) => {
    setTab(gap.group);
    if (gap.refId) setFocusId(gap.refId);
  };

  const text = (label: string, value: string, onChange: (v: string) => void, path?: string, placeholder?: string) => {
    const e = path ? fieldError(path) : null;
    return (
      <div>
        <input
          aria-label={label}
          aria-invalid={e ? true : undefined}
          className={inputClass}
          value={value}
          placeholder={placeholder}
          onChange={(ev) => onChange(ev.target.value)}
        />
        {e && <span className="mt-1 block text-xs text-[#dc2626]">{e}</span>}
      </div>
    );
  };

  const select = <V extends string>(label: string, value: V, options: { value: V; label: string; title?: string }[], onChange: (v: V) => void, path?: string) => {
    const e = path ? fieldError(path) : null;
    return (
      <div>
        <select
          aria-label={label}
          aria-invalid={e ? true : undefined}
          className={inputClass}
          value={value}
          onChange={(ev) => onChange(ev.target.value as V)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} title={o.title}>
              {o.label}
            </option>
          ))}
        </select>
        {e && <span className="mt-1 block text-xs text-[#dc2626]">{e}</span>}
      </div>
    );
  };

  const removeButton = (label: string, onClick: () => void) => (
    <Button variant="ghost" size="sm" aria-label={label} onClick={onClick}>
      {t("Remove")}
    </Button>
  );

  const empty = (title: string, body: string) => <EmptyState title={t(title)} body={t(body)} />;

  const processOptions = profile.processes.map((p) => ({ value: p.id, label: p.name || t("(no name)") }));
  const sourceOptions = profile.sources.map((s) => ({ value: s.id, label: s.name || t("(no name)") }));
  const stepOptions = [
    { value: "other", label: t("Other"), title: undefined as string | undefined },
    ...PROCESS_STEPS.map((s: ProcessStep) => ({ value: s, label: t(PROCESS_STEP_LABEL[s]), title: t(PROCESS_STEP_HINT[s]) })),
  ];

  return (
    <Card className="space-y-6">
      <header className="space-y-3">
        <h2 className="text-lg font-light text-black/80">{t("Factory profile")}</h2>
        <div className="flex items-center gap-3 text-sm text-black/55">
          <Progress value={progress.pct} />
          <span className="whitespace-nowrap">
            {t("{done} of {total} checks done", { done: progress.done, total: progress.total })}
          </span>
        </div>
        {gaps.length > 0 && (
          <ul className="space-y-1" aria-label={t("Open gaps")}>
            {gaps.map((g) => (
              <li key={g.key}>
                <button type="button" className="text-left text-sm text-[#b45309] underline-offset-2 hover:underline" onClick={() => goto(g)}>
                  {gapText(t, g, profile)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </header>

      <div role="tablist" aria-label={t("Factory profile")} className="flex flex-wrap gap-2">
        {GROUPS.map((g) => {
          const open = groupGaps(g).length > 0;
          const selected = tab === g;
          return (
            <button
              key={g}
              type="button"
              role="tab"
              id={`factory-tab-${g}`}
              aria-selected={selected}
              aria-controls={`factory-panel-${g}`}
              onClick={() => setTab(g)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
                selected ? "border-black/25 text-black" : "border-black/10 text-black/55 hover:text-black"
              }`}
            >
              <StatusDot tone={open ? "warn" : "ok"} />
              {t(GROUP_LABEL[g])}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`factory-panel-${tab}`} aria-labelledby={`factory-tab-${tab}`} className="space-y-4">
        {tab === "processes" && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={importSteps} disabled={!stepNames.length}>
                {t("Import steps from workbook")}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => update("processes", [...profile.processes, { id: id(), name: "", step: "other", route: "", inBoundary: true, note: "" }])}>
                {t("Add process")}
              </Button>
            </div>
            {profile.processes.length === 0
              ? empty("No processes yet", "List every process inside the installation boundary, from raw material to finished product.")
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-[0.1em] text-black/45">
                      <tr>
                        <th className="pb-2 pr-3 font-normal">{t("Name")}</th>
                        <th className="pb-2 pr-3 font-normal">{t("Process step")}</th>
                        <th className="pb-2 pr-3 font-normal">{t("Route")}</th>
                        <th className="pb-2 pr-3 font-normal">{t("Inside the boundary")}</th>
                        <th className="pb-2 pr-3 font-normal">{t("Note")}</th>
                        <th className="pb-2 font-normal"><span className="sr-only">{t("Actions")}</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.processes.map((p, i) => (
                        <tr key={p.id} id={`factory-row-${p.id}`} className="align-top">
                          <td className="py-1 pr-3">{text(t("Name"), p.name, (v) => update("processes", profile.processes.map((x) => (x.id === p.id ? { ...x, name: v } : x))), `processes.${i}.name`)}</td>
                          <td className="py-1 pr-3">
                            {select(t("Process step"), p.step, stepOptions as { value: string; label: string; title?: string }[], (v) =>
                              update("processes", profile.processes.map((x) => (x.id === p.id ? { ...x, step: v as ProcessRow["step"] } : x))), `processes.${i}.step`)}
                          </td>
                          <td className="py-1 pr-3">{text(t("Route"), p.route, (v) => update("processes", profile.processes.map((x) => (x.id === p.id ? { ...x, route: v } : x))), `processes.${i}.route`)}</td>
                          <td className="py-1 pr-3">
                            <input
                              type="checkbox"
                              aria-label={t("Inside the boundary")}
                              className="h-5 w-5 accent-[#111]"
                              checked={p.inBoundary}
                              onChange={(ev) => update("processes", profile.processes.map((x) => (x.id === p.id ? { ...x, inBoundary: ev.target.checked } : x)))}
                            />
                          </td>
                          <td className="py-1 pr-3">{text(t("Note"), p.note, (v) => update("processes", profile.processes.map((x) => (x.id === p.id ? { ...x, note: v } : x))), `processes.${i}.note`)}</td>
                          <td className="py-1">{removeButton(t("Remove process {name}", { name: p.name || t("(no name)") }), () => removeProcess(p))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </>
        )}

        {tab === "sources" && (
          <>
            <Button variant="secondary" size="sm" disabled={!profile.processes.length} onClick={() => update("sources", [...profile.sources, { id: id(), name: "", kind: "combustion", processId: profile.processes[0]?.id ?? "", fuel: "", tag: "" }])}>
              {t("Add source")}
            </Button>
            {profile.sources.length === 0
              ? empty("No emission sources yet", "Add each furnace, burner, stack or process line that emits CO2, with the process it belongs to.")
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-[0.1em] text-black/45">
                      <tr>
                        <th className="pb-2 pr-3 font-normal">{t("Name")}</th>
                        <th className="pb-2 pr-3 font-normal">{t("Type")}</th>
                        <th className="pb-2 pr-3 font-normal">{t("Process")}</th>
                        <th className="pb-2 pr-3 font-normal">{t("Fuel or material")}</th>
                        <th className="pb-2 pr-3 font-normal">{t("Tag")}</th>
                        <th className="pb-2 font-normal"><span className="sr-only">{t("Actions")}</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.sources.map((s, i) => (
                        <tr key={s.id} id={`factory-row-${s.id}`} className="align-top">
                          <td className="py-1 pr-3">{text(t("Name"), s.name, (v) => update("sources", profile.sources.map((x) => (x.id === s.id ? { ...x, name: v } : x))), `sources.${i}.name`)}</td>
                          <td className="py-1 pr-3">
                            {select(t("Type"), s.kind, KINDS.map((k) => ({ value: k, label: t(KIND_LABEL[k]) })), (v) =>
                              update("sources", profile.sources.map((x) => (x.id === s.id ? { ...x, kind: v } : x))), `sources.${i}.kind`)}
                          </td>
                          <td className="py-1 pr-3">
                            {select(t("Process"), s.processId, processOptions, (v) =>
                              update("sources", profile.sources.map((x) => (x.id === s.id ? { ...x, processId: v } : x))), `sources.${i}.processId`)}
                          </td>
                          <td className="py-1 pr-3">{text(t("Fuel or material"), s.fuel, (v) => update("sources", profile.sources.map((x) => (x.id === s.id ? { ...x, fuel: v } : x))), `sources.${i}.fuel`)}</td>
                          <td className="py-1 pr-3">{text(t("Tag"), s.tag, (v) => update("sources", profile.sources.map((x) => (x.id === s.id ? { ...x, tag: v } : x))), `sources.${i}.tag`)}</td>
                          <td className="py-1">{removeButton(t("Remove source {name}", { name: s.name || t("(no name)") }), () => removeSource(s.id, s.name))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </>
        )}

        {tab === "meters" && (
          <>
            <Button variant="secondary" size="sm" disabled={!profile.sources.length} onClick={() => update("meters", [...profile.meters, { id: id(), name: "", measures: "", sourceId: profile.sources[0]?.id ?? "", owner: "", frequency: "monthly", evidence: "", calibratedUntil: "" }])}>
              {t("Add meter or data source")}
            </Button>
            {profile.meters.length === 0
              ? empty("No meters or data sources yet", "Add every meter, invoice or log the numbers come from: gas meter, electricity bill, weighbridge.")
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-[0.1em] text-black/45">
                      <tr>
                        <th className="pb-2 pr-3 font-normal">{t("Name")}</th>
                        <th className="pb-2 pr-3 font-normal">{t("What it measures")}</th>
                        <th className="pb-2 pr-3 font-normal">{t("Source")}</th>
                        <th className="pb-2 pr-3 font-normal">{t("Who reads it")}</th>
                        <th className="pb-2 pr-3 font-normal">{t("Frequency")}</th>
                        <th className="pb-2 pr-3 font-normal">{t("Evidence")}</th>
                        <th className="pb-2 pr-3 font-normal">{t("Calibrated until")}</th>
                        <th className="pb-2 font-normal"><span className="sr-only">{t("Actions")}</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.meters.map((m, i) => {
                        const patch = (p: Partial<typeof m>) => update("meters", profile.meters.map((x) => (x.id === m.id ? { ...x, ...p } : x)));
                        return (
                          <tr key={m.id} id={`factory-row-${m.id}`} className="align-top">
                            <td className="py-1 pr-3">{text(t("Name"), m.name, (v) => patch({ name: v }), `meters.${i}.name`)}</td>
                            <td className="py-1 pr-3">{text(t("What it measures"), m.measures, (v) => patch({ measures: v }), `meters.${i}.measures`)}</td>
                            <td className="py-1 pr-3">{select(t("Source"), m.sourceId, sourceOptions, (v) => patch({ sourceId: v }), `meters.${i}.sourceId`)}</td>
                            <td className="py-1 pr-3">{text(t("Who reads it"), m.owner, (v) => patch({ owner: v }), `meters.${i}.owner`)}</td>
                            <td className="py-1 pr-3">{select(t("Frequency"), m.frequency, FREQUENCIES.map((f) => ({ value: f, label: t(FREQUENCY_LABEL[f]) })), (v) => patch({ frequency: v }), `meters.${i}.frequency`)}</td>
                            <td className="py-1 pr-3">{text(t("Evidence"), m.evidence, (v) => patch({ evidence: v }), `meters.${i}.evidence`)}</td>
                            <td className="py-1 pr-3">
                              <input
                                type="date"
                                aria-label={t("Calibrated until")}
                                className={inputClass}
                                value={m.calibratedUntil}
                                onChange={(ev) => patch({ calibratedUntil: ev.target.value })}
                              />
                              {fieldError(`meters.${i}.calibratedUntil`) && <span className="mt-1 block text-xs text-[#dc2626]">{fieldError(`meters.${i}.calibratedUntil`)}</span>}
                            </td>
                            <td className="py-1">{removeButton(t("Remove meter {name}", { name: m.name || t("(no name)") }), () => update("meters", profile.meters.filter((x) => x.id !== m.id)))}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
          </>
        )}

        {tab === "production" && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={addMissingMonths}>
                {t("Add the 12 months of {year}", { year })}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => update("production", [...profile.production, { month: monthKey(year, 0), product: "", tonnes: 0 }])}>
                {t("Add row")}
              </Button>
            </div>
            {profile.production.length === 0
              ? empty("No production yet", "Enter the tonnes produced each month, per product. The months must match the reporting year.")
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-[0.1em] text-black/45">
                      <tr>
                        <th className="pb-2 pr-3 font-normal">{t("Month")}</th>
                        <th className="pb-2 pr-3 font-normal">{t("Product")}</th>
                        <th className="pb-2 pr-3 font-normal">{t("Tonnes")}</th>
                        <th className="pb-2 font-normal"><span className="sr-only">{t("Actions")}</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.production.map((r, i) => (
                        <tr key={`${r.month}-${i}`} className="align-top">
                          <td className="py-1 pr-3">
                            <input
                              type="month"
                              aria-label={t("Month")}
                              aria-invalid={fieldError(`production.${i}.month`) ? true : undefined}
                              className={inputClass}
                              value={r.month}
                              onChange={(ev) => update("production", profile.production.map((x, j) => (j === i ? { ...x, month: ev.target.value } : x)))}
                            />
                          </td>
                          <td className="py-1 pr-3">
                            {text(t("Product"), r.product, (v) => update("production", profile.production.map((x, j) => (j === i ? { ...x, product: v } : x))), `production.${i}.product`)}
                          </td>
                          <td className="py-1 pr-3">
                            <input
                              type="number"
                              min={0}
                              step="any"
                              aria-label={t("Tonnes")}
                              aria-invalid={fieldError(`production.${i}.tonnes`) ? true : undefined}
                              className={inputClass}
                              value={r.tonnes}
                              onChange={(ev) => update("production", profile.production.map((x, j) => (j === i ? { ...x, tonnes: ev.target.valueAsNumber } : x)))}
                            />
                            {fieldError(`production.${i}.tonnes`) && <span className="mt-1 block text-xs text-[#dc2626]">{fieldError(`production.${i}.tonnes`)}</span>}
                          </td>
                          <td className="py-1">{removeButton(t("Remove month {month}", { month: r.month }), () => update("production", profile.production.filter((_, j) => j !== i)))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            {mismatch !== null && mismatch > 0.05 && (
              <p className="text-sm text-[#b45309]">
                {t("Production here differs from the Products sheet by {pct} %.", { pct: Math.round(mismatch * 100) })}
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-black/[0.07] pt-4">
        <Button onClick={save} disabled={saving}>
          {saving ? t("Saving…") : t("Save factory profile")}
        </Button>
        {saved && <span role="status" className="text-sm text-[#16a34a]">{t("Factory profile saved")}</span>}
        {saveError && <span role="alert" className="text-sm text-[#dc2626]">{saveError}</span>}
      </div>
      {/* Every validator error, including those with no field to sit under (for example a
          row that is not an object), so nothing that blocks the save is silent. */}
      {errors.length > 0 && (
        <ul role="alert" className="list-disc space-y-1 pl-5 text-sm text-[#dc2626]">
          {errors.map((e) => (
            <li key={e}>{errorText(t, e.slice(e.indexOf(": ") + 2))}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
