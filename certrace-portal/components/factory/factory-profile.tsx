"use client";

import * as React from "react";
import { Button, Card, Checkbox, EmptyState, NumberInput, Progress, StatusDot, inputClass, useFlash } from "@/components/ui";
import { PROCESS_STEPS, PROCESS_STEP_HINT, PROCESS_STEP_LABEL, type ProcessStep } from "@/lib/cbam/boundary";
import { useT, type TFunction } from "@/lib/i18n";
import {
  PROFILE_LIMITS, clearFieldError, emptyProfile, factoryGaps, factoryProgress, monthRowsToAdd, newId, nextMissingMonth,
  processesFromSteps, productionMismatch, validateProfile,
  type FactoryGap, type FactoryProfile, type MeterFrequency, type MeterRow, type ProcessRow, type ProductionRow,
  type SourceKind, type SourceRow,
} from "@/lib/factory/profile";
import { readFactory, saveFactory } from "@/lib/factory/store";
import { FactorySaveError } from "@/lib/factory/stored";

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
const monthKey = (year: number, i: number) => `${year}-${String(i + 1).padStart(2, "0")}`;
const errId = (path: string) => `factory-err-${path.replace(/\./g, "-")}`;

// Field errors arrive as "path: message". The message is English from the
// validator, so it is translated here; anything with a number is matched by shape.
function errorText(t: TFunction, message: string) {
  const at = /^at most (\d+) characters$/.exec(message);
  if (at) return t("at most {n} characters", { n: at[1]! });
  const rows = /^at most (\d+) rows$/.exec(message);
  if (rows) return t("at most {n} rows", { n: rows[1]! });
  return t(message);
}

// "processes.1.name" -> "Processes row 2", so a summary line says which row it is about.
function rowLabel(t: TFunction, path: string) {
  const m = /^(processes|sources|meters|production)\.(\d+)(?=[.:])/.exec(path);
  return m ? t("{group} row {n}", { group: t(GROUP_LABEL[m[1] as Group]), n: Number(m[2]) + 1 }) : null;
}

function saveMessage(t: TFunction, e: unknown) {
  const reason = e instanceof FactorySaveError ? e.reason : "other";
  if (reason === "conflict") return t("Someone else changed this profile. Reload to see their changes.");
  if (reason === "trial") return t("Your trial has ended, so this profile cannot be saved.");
  return t("Could not save the factory profile. Your edits are still here.");
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
  const [unreadable, setUnreadable] = React.useState(false);
  const [tab, setTab] = React.useState<Group>("processes");
  const [focusId, setFocusId] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [saveError, setSaveError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [saved, flashSaved] = useFlash();
  const tabRefs = React.useRef<Record<Group, HTMLButtonElement | null>>({ processes: null, sources: null, meters: null, production: null });

  // Storage is browser-side, so the profile is read after mount, not during render.
  React.useEffect(() => {
    const r = readFactory(installationId);
    setProfile(r.profile);
    setUnreadable(r.unreadable);
    setErrors([]);
    setSaveError("");
    setNotice("");
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
  const nextMonth = nextMissingMonth(profile, year);
  const missingMonths = monthRowsToAdd(profile, year);

  const fieldError = (path: string) => {
    const hit = errors.find((e) => e.startsWith(path + ":"));
    return hit ? errorText(t, hit.slice(path.length + 2)) : null;
  };
  // Error text sits under its field and is linked to it, so a screen reader reads both together.
  const meta = (path?: string) => {
    const message = path ? fieldError(path) : null;
    return {
      invalid: message ? true : undefined,
      describedBy: path && message ? errId(path) : undefined,
      node: path && message ? <span id={errId(path)} className="mt-1 block text-xs text-err-text">{message}</span> : null,
    };
  };
  const clearFor = (path?: string) => {
    if (path) setErrors((prev) => clearFieldError(prev, path));
  };

  const patchProcess = (rowId: string, p: Partial<ProcessRow>) =>
    setProfile((prof) => ({ ...prof, processes: prof.processes.map((x) => (x.id === rowId ? { ...x, ...p } : x)) }));
  const patchSource = (rowId: string, p: Partial<SourceRow>) =>
    setProfile((prof) => ({ ...prof, sources: prof.sources.map((x) => (x.id === rowId ? { ...x, ...p } : x)) }));
  const patchMeter = (rowId: string, p: Partial<MeterRow>) =>
    setProfile((prof) => ({ ...prof, meters: prof.meters.map((x) => (x.id === rowId ? { ...x, ...p } : x)) }));
  const patchProduction = (rowId: string, p: Partial<ProductionRow>) =>
    setProfile((prof) => ({ ...prof, production: prof.production.map((x) => (x.id === rowId ? { ...x, ...p } : x)) }));

  const importSteps = () => {
    const r = processesFromSteps(profile, stepNames);
    setProfile(r.profile);
    setNotice(
      r.skipped
        ? t("Added {added} processes. {skipped} did not fit the limit of {limit} processes.", { added: r.added, skipped: r.skipped, limit: PROFILE_LIMITS.processes })
        : t("Added {added} processes.", { added: r.added }),
    );
  };

  const addMissingMonths = () => setProfile((p) => ({ ...p, production: [...p.production, ...monthRowsToAdd(p, year)] }));

  const removeProcess = (proc: ProcessRow) => {
    const sourceIds = new Set(profile.sources.filter((s) => s.processId === proc.id).map((s) => s.id));
    const meters = profile.meters.filter((m) => sourceIds.has(m.sourceId)).length;
    if ((sourceIds.size || meters) && !window.confirm(t("Delete {name}, its {n} sources and {m} meters?", { name: proc.name, n: sourceIds.size, m: meters }))) return;
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
    setNotice("");
    if (!checked.ok) {
      setErrors(checked.errors);
      setSaveError(t("Fix the highlighted fields before saving."));
      return;
    }
    setErrors([]);
    setSaving(true);
    try {
      await saveFactory(installationId, checked.data);
      flashSaved();
    } catch (e) {
      setSaveError(saveMessage(t, e));
    } finally {
      setSaving(false);
    }
  };

  const goto = (gap: FactoryGap) => {
    setTab(gap.group);
    if (gap.refId) setFocusId(gap.refId);
  };

  // Roving tabindex: arrows move between tabs, Home and End jump to the ends.
  const onTabKey = (e: React.KeyboardEvent, g: Group) => {
    const i = GROUPS.indexOf(g);
    const next =
      e.key === "ArrowRight" ? (i + 1) % GROUPS.length
      : e.key === "ArrowLeft" ? (i - 1 + GROUPS.length) % GROUPS.length
      : e.key === "Home" ? 0
      : e.key === "End" ? GROUPS.length - 1
      : -1;
    if (next < 0) return;
    e.preventDefault();
    const to = GROUPS[next]!;
    setTab(to);
    tabRefs.current[to]?.focus();
  };

  const text = (label: string, value: string, onChange: (v: string) => void, path?: string, placeholder?: string) => {
    const m = meta(path);
    return (
      <div>
        <input
          aria-label={label}
          aria-invalid={m.invalid}
          aria-describedby={m.describedBy}
          className={inputClass}
          value={value}
          placeholder={placeholder}
          onChange={(ev) => {
            clearFor(path);
            onChange(ev.target.value);
          }}
        />
        {m.node}
      </div>
    );
  };

  const select = (label: string, value: string, options: { value: string; label: string; title?: string }[], onChange: (v: string) => void, path?: string) => {
    const m = meta(path);
    return (
      <div>
        <select
          aria-label={label}
          aria-invalid={m.invalid}
          aria-describedby={m.describedBy}
          className={inputClass}
          value={value}
          onChange={(ev) => {
            clearFor(path);
            onChange(ev.target.value);
          }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} title={o.title}>
              {o.label}
            </option>
          ))}
        </select>
        {m.node}
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
    { value: "other", label: t("Other") },
    ...PROCESS_STEPS.map((s: ProcessStep) => ({ value: s, label: t(PROCESS_STEP_LABEL[s]), title: t(PROCESS_STEP_HINT[s]) })),
  ];
  const tabId = (g: Group) => `factory-tab-${g}`;
  const panelId = `factory-panel-${tab}`;

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
                <button type="button" className="text-left text-sm text-warn-text underline-offset-2 hover:underline" onClick={() => goto(g)}>
                  {gapText(t, g, profile)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </header>

      {unreadable && (
        <p role="alert" className="rounded-xl border border-err-text/30 px-4 py-3 text-sm text-err-text">
          {t("The saved factory profile could not be read. Saving is paused so the stored copy is not overwritten.")}
        </p>
      )}

      <div role="tablist" aria-label={t("Factory profile")} className="flex flex-wrap gap-2">
        {GROUPS.map((g) => {
          const open = groupGaps(g).length;
          const selected = tab === g;
          return (
            <button
              key={g}
              ref={(el) => {
                tabRefs.current[g] = el;
              }}
              type="button"
              role="tab"
              id={tabId(g)}
              aria-selected={selected}
              aria-controls={selected ? panelId : undefined}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(g)}
              onKeyDown={(e) => onTabKey(e, g)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
                selected ? "border-black/25 text-black" : "border-black/10 text-black/55 hover:text-black"
              }`}
            >
              <StatusDot tone={open ? "warn" : "ok"} />
              {t(GROUP_LABEL[g])}
              <span className="sr-only">{open ? t("{n} open gaps", { n: open }) : t("No open gaps")}</span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={panelId} aria-labelledby={tabId(tab)} className="space-y-4">
        {tab === "processes" && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={importSteps} disabled={!stepNames.length}>
                {t("Import steps from workbook")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={profile.processes.length >= PROFILE_LIMITS.processes}
                onClick={() => setProfile((p) => ({ ...p, processes: [...p.processes, { id: newId(), name: "", step: "other", route: "", inBoundary: true, note: "" }] }))}
              >
                {t("Add process")}
              </Button>
            </div>
            {notice && <p role="status" className="text-sm text-black/55">{notice}</p>}
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
                          <td className="py-1 pr-3">{text(t("Name"), p.name, (v) => patchProcess(p.id, { name: v }), `processes.${i}.name`)}</td>
                          <td className="py-1 pr-3">
                            {select(t("Process step"), p.step, stepOptions, (v) => patchProcess(p.id, { step: v as ProcessRow["step"] }), `processes.${i}.step`)}
                          </td>
                          <td className="py-1 pr-3">{text(t("Route"), p.route, (v) => patchProcess(p.id, { route: v }), `processes.${i}.route`)}</td>
                          <td className="py-1 pr-3">
                            <Checkbox
                              checked={p.inBoundary}
                              onChange={(v) => patchProcess(p.id, { inBoundary: v })}
                              label={<span className="sr-only">{t("Inside the boundary")}: {p.name || t("(no name)")}</span>}
                            />
                          </td>
                          <td className="py-1 pr-3">{text(t("Note"), p.note, (v) => patchProcess(p.id, { note: v }), `processes.${i}.note`)}</td>
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
            <Button
              variant="secondary"
              size="sm"
              disabled={!profile.processes.length || profile.sources.length >= PROFILE_LIMITS.sources}
              onClick={() => setProfile((p) => ({ ...p, sources: [...p.sources, { id: newId(), name: "", kind: "combustion", processId: p.processes[0]?.id ?? "", fuel: "", tag: "" }] }))}
            >
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
                          <td className="py-1 pr-3">{text(t("Name"), s.name, (v) => patchSource(s.id, { name: v }), `sources.${i}.name`)}</td>
                          <td className="py-1 pr-3">
                            {select(t("Type"), s.kind, KINDS.map((k) => ({ value: k, label: t(KIND_LABEL[k]) })), (v) => patchSource(s.id, { kind: v as SourceKind }), `sources.${i}.kind`)}
                          </td>
                          <td className="py-1 pr-3">
                            {select(t("Process"), s.processId, processOptions, (v) => patchSource(s.id, { processId: v }), `sources.${i}.processId`)}
                          </td>
                          <td className="py-1 pr-3">{text(t("Fuel or material"), s.fuel, (v) => patchSource(s.id, { fuel: v }), `sources.${i}.fuel`)}</td>
                          <td className="py-1 pr-3">{text(t("Tag"), s.tag, (v) => patchSource(s.id, { tag: v }), `sources.${i}.tag`)}</td>
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
            <Button
              variant="secondary"
              size="sm"
              disabled={!profile.sources.length || profile.meters.length >= PROFILE_LIMITS.meters}
              onClick={() => setProfile((p) => ({ ...p, meters: [...p.meters, { id: newId(), name: "", measures: "", sourceId: p.sources[0]?.id ?? "", owner: "", frequency: "monthly", evidence: "", calibratedUntil: "" }] }))}
            >
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
                        const calibration = meta(`meters.${i}.calibratedUntil`);
                        return (
                          <tr key={m.id} id={`factory-row-${m.id}`} className="align-top">
                            <td className="py-1 pr-3">{text(t("Name"), m.name, (v) => patchMeter(m.id, { name: v }), `meters.${i}.name`)}</td>
                            <td className="py-1 pr-3">{text(t("What it measures"), m.measures, (v) => patchMeter(m.id, { measures: v }), `meters.${i}.measures`)}</td>
                            <td className="py-1 pr-3">{select(t("Source"), m.sourceId, sourceOptions, (v) => patchMeter(m.id, { sourceId: v }), `meters.${i}.sourceId`)}</td>
                            <td className="py-1 pr-3">{text(t("Who reads it"), m.owner, (v) => patchMeter(m.id, { owner: v }), `meters.${i}.owner`)}</td>
                            <td className="py-1 pr-3">
                              {select(t("Frequency"), m.frequency, FREQUENCIES.map((f) => ({ value: f, label: t(FREQUENCY_LABEL[f]) })), (v) => patchMeter(m.id, { frequency: v as MeterFrequency }), `meters.${i}.frequency`)}
                            </td>
                            <td className="py-1 pr-3">{text(t("Evidence"), m.evidence, (v) => patchMeter(m.id, { evidence: v }), `meters.${i}.evidence`)}</td>
                            <td className="py-1 pr-3">
                              <input
                                type="date"
                                aria-label={t("Calibrated until")}
                                aria-invalid={calibration.invalid}
                                aria-describedby={calibration.describedBy}
                                className={inputClass}
                                value={m.calibratedUntil}
                                onChange={(ev) => {
                                  clearFor(`meters.${i}.calibratedUntil`);
                                  patchMeter(m.id, { calibratedUntil: ev.target.value });
                                }}
                              />
                              {calibration.node}
                            </td>
                            <td className="py-1">{removeButton(t("Remove meter {name}", { name: m.name || t("(no name)") }), () => setProfile((p) => ({ ...p, meters: p.meters.filter((x) => x.id !== m.id) })))}</td>
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
              <Button variant="secondary" size="sm" disabled={!missingMonths.length || profile.production.length + missingMonths.length > PROFILE_LIMITS.production} onClick={addMissingMonths}>
                {t("Add the 12 months of {year}", { year })}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={nextMonth === null || profile.production.length >= PROFILE_LIMITS.production}
                onClick={() => setProfile((p) => ({ ...p, production: [...p.production, { id: newId(), month: nextMonth ?? monthKey(year, 0), product: "", tonnes: 0 }] }))}
              >
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
                      {profile.production.map((r, i) => {
                        const month = meta(`production.${i}.month`);
                        const tonnes = meta(`production.${i}.tonnes`);
                        return (
                          <tr key={r.id} className="align-top">
                            <td className="py-1 pr-3">
                              <input
                                type="month"
                                aria-label={t("Month")}
                                aria-invalid={month.invalid}
                                aria-describedby={month.describedBy}
                                className={inputClass}
                                value={r.month}
                                onChange={(ev) => {
                                  clearFor(`production.${i}.month`);
                                  patchProduction(r.id, { month: ev.target.value });
                                }}
                              />
                              {month.node}
                            </td>
                            <td className="py-1 pr-3">
                              {text(t("Product"), r.product, (v) => patchProduction(r.id, { product: v }), `production.${i}.product`)}
                            </td>
                            <td className="py-1 pr-3">
                              <NumberInput
                                ariaLabel={t("Tonnes")}
                                min={0}
                                value={r.tonnes}
                                invalid={tonnes.invalid === true}
                                ariaDescribedBy={tonnes.describedBy}
                                onChange={(v) => {
                                  clearFor(`production.${i}.tonnes`);
                                  patchProduction(r.id, { tonnes: v ?? 0 });
                                }}
                              />
                              {tonnes.node}
                            </td>
                            <td className="py-1">{removeButton(t("Remove month {month}", { month: r.month }), () => setProfile((p) => ({ ...p, production: p.production.filter((x) => x.id !== r.id) })))}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            {mismatch !== null && mismatch > 0.05 && (
              <p className="text-sm text-warn-text">
                {t("Production here differs from the Products sheet by {pct} %.", { pct: Math.round(mismatch * 100) })}
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-black/[0.07] pt-4">
        <Button onClick={save} disabled={saving || unreadable}>
          {saving ? t("Saving…") : t("Save factory profile")}
        </Button>
        {saved && <span role="status" className="text-sm text-ok-text">{t("Factory profile saved")}</span>}
        {saveError && <span role="alert" className="text-sm text-err-text">{saveError}</span>}
      </div>
      {/* Every validator error, including those with no field to sit under (for example a
          row that is not an object), so nothing that blocks the save is silent. */}
      {errors.length > 0 && (
        <ul role="alert" className="list-disc space-y-1 pl-5 text-sm text-err-text">
          {errors.map((e) => {
            const message = errorText(t, e.slice(e.indexOf(": ") + 2));
            const row = rowLabel(t, e);
            return <li key={e}>{row ? t("{row}: {message}", { row, message }) : message}</li>;
          })}
        </ul>
      )}
    </Card>
  );
}
