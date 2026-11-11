"use client";

/* ════════════════════════════════════════════════════════════
   THE INSTALLATION DIRECTORY — each installation is a folder

   One card per installation: its workbook years (coloured by the worst sheet of
   the selected year), its factory profile progress, and links into the
   workspace. "Show on map" selects the installation the factory map draws.
   The summary line counts installations whose factory checks are complete.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { ButtonLink, Button, Card, Chip, EmptyState, Progress } from "@/components/ui";
import { ErrorState, LoadingState } from "@/components/query-state";
import { useT } from "@/lib/i18n";
import { useActiveInstallation } from "@/lib/active-installation";
import { getInstallation } from "@/lib/installations";
import { countComplete, worstOf } from "@/lib/factory/directory";
import { factoryProgress } from "@/lib/factory/profile";
import { readFactory } from "@/lib/factory/store";
import { sheetStatus, STATUS_LABEL, type SheetStatus } from "@/lib/workbook/status";
import { useWorkbook, useWorkbookYears } from "@/lib/workbook/use-workbook";

const PILL_TONE: Record<SheetStatus, string> = {
  untouched: "var(--flow-edge)",
  complete: "var(--color-ok-text)",
  review: "var(--color-warn-text)",
  missing: "var(--color-err-text)",
};

export function InstallationDirectory({
  year,
  selectedId,
  onShowOnMap,
}: {
  year: number;
  selectedId: string | null;
  onShowOnMap: (id: string) => void;
}) {
  const t = useT();
  const { options, loading, error, retry } = useActiveInstallation();
  const complete = React.useMemo(
    () => countComplete(options.map((o) => factoryProgress(readFactory(o.id), year))),
    [options, year],
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState onRetry={retry} />;

  return (
    <section aria-labelledby="installation-directory" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="installation-directory" className="text-[15px] font-medium text-black/80">
          {t("Sites")}
        </h2>
        {options.length > 0 && (
          <p className="text-[13px] text-black/55">
            {t("{n} installations · {m} with factory checks complete", { n: options.length, m: complete })}
          </p>
        )}
      </div>

      {options.length === 0 ? (
        <EmptyState
          title={t("No installations yet")}
          action={
            <ButtonLink href="/settings" variant="secondary">
              {t("Add your first installation")}
            </ButtonLink>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {options.map((o) => (
            <InstallationCard
              key={o.id}
              id={o.id}
              name={o.name}
              self={o.self}
              year={year}
              selected={o.id === selectedId}
              onShowOnMap={onShowOnMap}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function InstallationCard({
  id,
  name,
  self,
  year,
  selected,
  onShowOnMap,
}: {
  id: string;
  name: string;
  self: boolean;
  year: number;
  selected: boolean;
  onShowOnMap: (id: string) => void;
}) {
  const t = useT();
  const country = getInstallation(id)?.country ?? "";
  const years = useWorkbookYears(id);
  const wb = useWorkbook(id, year);
  const failed = years.error || wb.error;
  const pending = !failed && !(years.loaded && wb.loaded);
  const yearStatus = wb.loaded && wb.sheets.length ? worstOf(wb.sheets.map((s) => sheetStatus(s))) : null;
  const progress = factoryProgress(readFactory(id), year);
  const yearList = [...years.years.map((y) => y.year)].sort((a, b) => b - a);

  return (
    <Card className={selected ? "space-y-3 ring-2 ring-black/20" : "space-y-3"}>
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[15px] font-medium text-black/85">{name}</h3>
          <Chip tone="muted">{t(self ? "Own site" : "OEM / supplier site")}</Chip>
        </div>
        {country && <p className="text-[13px] text-black/55">{country}</p>}
      </div>

      <ul className="flex flex-wrap gap-1.5" aria-label={t("Workbook years")}>
        {failed ? (
          <li className="text-[13px] text-black/55">{t("Could not load")}</li>
        ) : pending ? (
          <li className="text-[13px] text-black/55">{t("Loading…")}</li>
        ) : (
          <>
            {yearList.map((y) => {
              const current = y === year && yearStatus !== null ? yearStatus : null;
              const color = current ? PILL_TONE[current] : "var(--flow-edge)";
              return (
                <li
                  key={y}
                  className="rounded-full border px-2.5 py-0.5 text-[12px] tabular-nums"
                  style={{ borderColor: color, color: current ? color : undefined }}
                  aria-label={current ? t("{y}: {status}", { y, status: t(STATUS_LABEL[current]) }) : String(y)}
                  title={current ? t(STATUS_LABEL[current]) : undefined}
                >
                  {y}
                </li>
              );
            })}
            {yearStatus === null && <li className="text-[13px] text-black/55">{t("No workbook for {year} yet", { year })}</li>}
          </>
        )}
      </ul>

      <div className="space-y-1">
        <Progress value={progress.pct} tone={progress.done === progress.total ? "ok" : "warn"} />
        <p className="text-[13px] text-black/55">{t("{done} of {total} checks", { done: progress.done, total: progress.total })}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <ButtonLink href={`/workspace?installation=${id}`} variant="secondary" size="sm">
          {t("Open workspace")}
        </ButtonLink>
        <ButtonLink href={`/workspace?installation=${id}&view=factory`} variant="ghost" size="sm">
          {t("Factory profile")}
        </ButtonLink>
        <Button variant="ghost" size="sm" aria-pressed={selected} onClick={() => onShowOnMap(id)}>
          {t("Show on map")}
        </Button>
      </div>
    </Card>
  );
}
