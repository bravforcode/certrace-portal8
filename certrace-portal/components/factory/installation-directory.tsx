"use client";

/* ════════════════════════════════════════════════════════════
   THE INSTALLATION DIRECTORY — each installation is a folder

   One card per installation: its workbook years (coloured by the worst sheet of
   the selected year), its factory profile progress, and links into the
   workspace. "Show on map" selects the installation the factory map draws.
   The summary line counts installations whose factory checks are complete.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { Factory, MapPin } from "lucide-react";
import {
  ButtonLink,
  Card,
  Chip,
  cn,
  EmptyState,
  Progress,
} from "@/components/ui";
import { PressScale, Stagger, StaggerItem } from "@/components/motion";
import { ErrorState, LoadingState } from "@/components/query-state";
import { useT } from "@/lib/i18n";
import { useActiveInstallation } from "@/lib/active-installation";
import { getInstallation } from "@/lib/installations";
import { countComplete, worstOf } from "@/lib/factory/directory";
import { factoryProgress } from "@/lib/factory/profile";
import { readFactory } from "@/lib/factory/store";
import {
  sheetStatus,
  STATUS_LABEL,
  type SheetStatus,
} from "@/lib/workbook/status";
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
    () =>
      countComplete(
        options.map((o) => factoryProgress(readFactory(o.id).profile, year)),
      ),
    [options, year],
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState onRetry={retry} />;

  return (
    <section aria-labelledby="installation-directory" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="installation-directory"
          className="text-[15px] font-medium text-black/80"
        >
          {t("Sites")}
        </h2>
        {options.length > 0 && (
          <p className="text-[13px] text-black/55">
            {t("{n} installations · {m} with factory checks complete", {
              n: options.length,
              m: complete,
            })}
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
        <Stagger className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {options.map((o) => (
            <StaggerItem key={o.id} className="h-full">
              <PressScale className="h-full">
                <InstallationCard
                  id={o.id}
                  name={o.name}
                  self={o.self}
                  year={year}
                  selected={o.id === selectedId}
                  onShowOnMap={onShowOnMap}
                />
              </PressScale>
            </StaggerItem>
          ))}
        </Stagger>
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
  const yearStatus =
    wb.loaded && wb.sheets.length
      ? worstOf(wb.sheets.map((s) => sheetStatus(s)))
      : null;
  const progress = factoryProgress(readFactory(id).profile, year);
  const yearList = [...years.years.map((y) => y.year)].sort((a, b) => b - a);

  return (
    <Card
      className={cn(
        "flex h-full flex-col gap-4 p-5 hover:border-black/15 hover:shadow-[0_6px_20px_rgba(0,0,0,0.05)]",
        selected && "ring-2 ring-black/20",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 truncate text-[15px] font-medium text-black/85">
          {name}
        </h3>
        <Chip tone="muted" className="flex-none">
          {t(self ? "Own site" : "OEM / supplier site")}
        </Chip>
      </div>

      <div className="flex min-w-0 items-baseline justify-between gap-3">
        <p className="min-w-0 truncate text-[13px] text-black/55">{country}</p>
        <span className="min-w-0 truncate font-mono text-[11px] text-black/40">
          {id}
        </span>
      </div>

      <ul className="flex flex-wrap gap-1.5" aria-label={t("Workbook years")}>
        {failed ? (
          <li className="text-[13px] text-black/55">{t("Could not load")}</li>
        ) : pending ? (
          <li className="text-[13px] text-black/55">{t("Loading…")}</li>
        ) : (
          <>
            {yearList.map((y) => {
              const current =
                y === year && yearStatus !== null ? yearStatus : null;
              const color = current ? PILL_TONE[current] : "var(--flow-edge)";
              return (
                <li
                  key={y}
                  className="rounded-full border px-2.5 py-0.5 text-[12px] tabular-nums"
                  style={{
                    borderColor: color,
                    color: current ? color : undefined,
                  }}
                  aria-label={
                    current
                      ? t("{y}: {status}", {
                          y,
                          status: t(STATUS_LABEL[current]),
                        })
                      : String(y)
                  }
                  title={current ? t(STATUS_LABEL[current]) : undefined}
                >
                  {y}
                </li>
              );
            })}
            {yearStatus === null && (
              <li className="text-[13px] text-black/55">
                {t("No workbook for {year} yet", { year })}
              </li>
            )}
          </>
        )}
      </ul>

      <div className="space-y-2">
        <Progress
          value={progress.pct}
          tone={progress.done === progress.total ? "ok" : "warn"}
        />
        <div className="flex items-center justify-between text-[12px] tabular-nums text-black/55">
          <span>
            {t("{done} of {total} checks", {
              done: progress.done,
              total: progress.total,
            })}
          </span>
          <span className="text-black/40">{Math.round(progress.pct)}%</span>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-black/[0.06] pt-4">
        <ButtonLink
          href={`/workspace?installation=${id}`}
          variant="primary"
          size="sm"
          className="!normal-case !tracking-normal !text-[13px]"
        >
          {t("Open workspace")}
        </ButtonLink>
        <Link
          href={`/workspace?installation=${id}&view=factory`}
          className="inline-flex items-center gap-1.5 text-[13px] text-black/55 transition-colors hover:text-black"
        >
          <Factory size={14} strokeWidth={1.5} aria-hidden />
          {t("Factory profile")}
        </Link>
        <button
          type="button"
          aria-pressed={selected}
          onClick={() => onShowOnMap(id)}
          className={cn(
            "inline-flex items-center gap-1.5 text-[13px] transition-colors hover:text-black",
            selected ? "text-black" : "text-black/55",
          )}
        >
          <MapPin size={14} strokeWidth={1.5} aria-hidden />
          {t("Show on map")}
        </button>
      </div>
    </Card>
  );
}
