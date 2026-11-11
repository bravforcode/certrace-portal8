"use client";

/* ════════════════════════════════════════════════════════════
   THE FACTORY MAP — the flow diagram coloured by data status

   The installation's workbook drawn as the factory floor (FlowDiagram), each
   node coloured by its data status and annotated with its estimated tCO2e.
   Selecting a node shows its gaps and links to the row to fix. Read-only.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useRouter } from "next/navigation";
import { ButtonLink, Card, Chip, inputClass } from "@/components/ui";
import { FlowDiagram } from "@/components/workspace/flow-diagram";
import { useT } from "@/lib/i18n";
import { useActiveInstallation } from "@/lib/active-installation";
import { getInstallation } from "@/lib/installations";
import { buildFactoryMap, MAP_TONE, type MapNode, type MapStatus } from "@/lib/factory/map";
import { yearRange } from "@/lib/year-range";
import { massBalance } from "@/lib/workbook/balance";
import { estimateEmissions } from "@/lib/workbook/estimate";
import { sheetStatus, STATUS_LABEL, type SheetStatus } from "@/lib/workbook/status";
import { useWorkbook } from "@/lib/workbook/use-workbook";
import type { FlowNode } from "@/lib/workbook/flow";

/** The map's four statuses, as the workbook's own status labels. */
const MAP_LABEL: Record<MapStatus, SheetStatus> = { ok: "complete", warn: "review", err: "missing", muted: "untouched" };
const KIND_LABEL: Record<FlowNode["kind"], string> = {
  step: "Step",
  material: "Material",
  energy: "Energy",
  output: "Output",
  product: "Product",
};
const SHEET_OF: Record<FlowNode["kind"], string> = {
  step: "steps",
  material: "materials",
  energy: "energy",
  output: "output",
  product: "products",
};

export function FactoryMap({
  installationId,
  year,
  onInstallationChange,
  onYearChange,
}: {
  installationId: string;
  year: number;
  onInstallationChange: (id: string) => void;
  onYearChange: (year: number) => void;
}) {
  const t = useT();
  const router = useRouter();
  const { options } = useActiveInstallation();
  const { sheets, cells, loaded } = useWorkbook(installationId, year);
  const country = getInstallation(installationId)?.country ?? "";
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const estimate = React.useMemo(() => estimateEmissions(sheets, { country, year }), [sheets, country, year]);
  const balance = React.useMemo(() => massBalance(sheets), [sheets]);
  const map = React.useMemo(() => buildFactoryMap(sheets, estimate, balance), [sheets, estimate, balance]);
  const selected: MapNode | null = map.nodes.find((n) => n.id === selectedId) ?? null;
  const empty = loaded && sheets.every((s) => sheetStatus(s) === "untouched");
  const total = estimate.totalT;
  const steps = map.nodes.filter((n) => n.kind === "step" && n.label);
  const withGaps = steps.filter((n) => n.gaps.length > 0 || n.status === "err").length;
  const openSheet = (sheet: string) => router.push(`/workspace?installation=${installationId}&year=${year}&sheet=${sheet}`);

  return (
    <Card as="section" className="space-y-4" aria-labelledby="factory-map-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="factory-map-title" className="text-[15px] font-medium text-black/80">
          {t("Factory map")}
        </h2>
        <div className="flex flex-wrap items-end gap-2">
          <label className="space-y-1 text-[12px] text-black/55">
            <span className="block">{t("Installation")}</span>
            <select className={inputClass} value={installationId} onChange={(e) => onInstallationChange(e.target.value)}>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-[12px] text-black/55">
            <span className="block">{t("Year")}</span>
            <select className={inputClass} value={year} onChange={(e) => onYearChange(Number(e.target.value))}>
              {yearRange().map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[13px] text-black/65">
        {(["ok", "warn", "err", "muted"] as MapStatus[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: MAP_TONE[s] }} />
            {t(STATUS_LABEL[MAP_LABEL[s]])}
          </span>
        ))}
        {total > 0 && (
          <span className="inline-flex items-center gap-2">
            <Chip tone="muted">{t("Estimate")}</Chip>
            <span className="tabular-nums">{total.toFixed(1)} t CO₂e</span>
          </span>
        )}
      </div>

      {empty ? (
        <div className="space-y-2 py-6 text-center">
          <p className="text-[14px] text-black/65">{t("No workbook for {year} yet", { year })}</p>
          <ButtonLink href={`/workspace?installation=${installationId}&year=${year}`} variant="secondary">
            {t("Open workspace")}
          </ButtonLink>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px] [&>*]:min-w-0">
          <div role="region" aria-label={t("Factory map")} className="max-w-full overflow-auto rounded-xl">
            <FlowDiagram
              sheets={sheets}
              cells={cells}
              t={t}
              onOpenSheet={openSheet}
              nodeTone={map.tone}
              nodeBadge={map.badge}
              onSelect={(n) => setSelectedId(n?.id ?? null)}
            />
            {/* Text equivalent of the drawing for screen readers. */}
            <div className="sr-only">
              <p>{t("{n} steps, {m} with gaps", { n: steps.length, m: withGaps })}</p>
              <ul>
                {map.nodes.map((n) => (
                  <li key={n.id}>
                    {t("{name}: {status}", {
                      name: n.label || t(KIND_LABEL[n.kind]),
                      status: t(STATUS_LABEL[MAP_LABEL[n.status]]),
                    })}
                    {n.tCO2e !== null ? ` · ${n.tCO2e.toFixed(1)} t CO₂e` : ""}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="space-y-3 text-[13px] text-black/70" aria-live="polite">
            {selected ? (
              <>
                <div className="space-y-1">
                  <p className="text-[12px] text-black/50">{t(KIND_LABEL[selected.kind])}</p>
                  <h3 className="text-[15px] font-medium text-black/85">
                    {selected.label || t("Unassigned")}
                  </h3>
                  <p>{t(STATUS_LABEL[MAP_LABEL[selected.status]])}</p>
                </div>
                {selected.tCO2e !== null && (
                  <p className="tabular-nums">
                    {selected.tCO2e.toFixed(1)} t CO₂e
                    {total > 0 && ` · ${t("{pct} % of total", { pct: Math.round((selected.tCO2e / total) * 100).toString() })}`}
                  </p>
                )}
                {selected.gaps.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-medium text-black/75">{t("Gaps")}</p>
                    <ul className="list-disc space-y-1 pl-4">
                      {selected.gaps.map((g, i) => (
                        <li key={i}>{t(g.key, g.params)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <ButtonLink href={`/workspace?installation=${installationId}&sheet=${SHEET_OF[selected.kind]}`} variant="secondary" size="sm">
                  {t("Fix in workspace")}
                </ButtonLink>
              </>
            ) : (
              <p className="text-black/55">{t("Choose a step or item on the map to see its gaps.")}</p>
            )}
          </aside>
        </div>
      )}
    </Card>
  );
}
