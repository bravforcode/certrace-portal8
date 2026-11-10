"use client";

/* ════════════════════════════════════════════════════════════
   WORKSPACE — the exporter's data, one reporting year at a time

   The year bar runs from 2020 to five years ahead and opens on the current
   year (lib/year-range.ts). What the page shows depends on that year:

     no data    the three ways to start (upload · from the beginning · from an
                earlier year) and one Confirm; only the current year shows a
                plain sheet under them
     syncing    the set-up stage — files are being sorted into the sheets
                (the mock takes SETUP_MS; "Show the set-up workspace" finishes
                it now)
     ready, not yet shown
                the year's card plays the walk-in, in the upload's space —
                pressed just now, or finished while the reader was away
     ready      the sheets, Excel-style, then the way on to Convert

   Mock storage (lib/workspace-store.ts); the sheet data is sample data
   (lib/workspace-sheets.ts) until the set-up runs for real.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { ArrowRight, Copy, FileText } from "lucide-react";
import { Button, ButtonLink, Card, PageHeader } from "@/components/ui";
import { YearBar } from "@/components/year-bar";
import { Spreadsheet } from "@/components/workspace/spreadsheet";
import { SettingUpStage } from "@/components/workspace/setting-up";
import { WorkspaceReveal } from "@/components/workspace/reveal";
import { UploadPanel } from "@/components/workspace/upload-panel";
import { ScopedInstallationSwitcher } from "@/components/scoped-installation-switcher";
import { useT } from "@/lib/i18n";
import { useScopedInstallation } from "@/lib/scoped-installation";
import { draftInstallation, getInstallation, saveInstallation } from "@/lib/installations";
import { currentYear, yearRange } from "@/lib/year-range";
import { buildSheets } from "@/lib/workspace-sheets";
import { SETUP_MS, useWorkspaceYears } from "@/lib/workspace-store";

/* useSearchParams() (read by the installation scope) needs a Suspense boundary above it. */
export default function WorkspacePage() {
  return (
    <React.Suspense fallback={null}>
      <WorkspaceInner />
    </React.Suspense>
  );
}

function WorkspaceInner() {
  const t = useT();
  const { scoped } = useScopedInstallation();
  // Saving the Installation tab writes the store without re-rendering this page, so a counter re-reads it.
  const [installTick, setInstallTick] = React.useState(0);
  const installation = React.useMemo(
    () => (scoped ? draftInstallation(scoped, getInstallation(scoped.id)) : null),
    [scoped, installTick],
  );
  const convertHref = scoped ? `/convert?installation=${encodeURIComponent(scoped.id)}` : "/convert";
  const [year, setYear] = React.useState(currentYear);
  const ws = useWorkspaceYears();
  const rec = ws.get(year);

  /* The mock set-up finishes SETUP_MS after Confirm, whether or not anybody is watching. A year that finished
     unseen is ready but not yet revealed: its card plays the walk-in the next time it is opened (or at once,
     if it is open now). */
  const syncing = yearRange().filter((y) => ws.get(y)?.status === "syncing");
  const syncKey = syncing.map((y) => `${y}:${ws.get(y)!.confirmedAt}`).join(",");
  React.useEffect(() => {
    if (!syncKey) return;
    const due = syncing.map((y) => ({ y, at: Date.parse(ws.get(y)!.confirmedAt) + SETUP_MS }));
    const now = Date.now();
    for (const d of due) if (d.at <= now) ws.markReady(d.y);
    const next = due.filter((d) => d.at > now).map((d) => d.at - now);
    if (!next.length) return;
    const id = window.setTimeout(() => {
      for (const d of due) if (d.at <= Date.now()) ws.markReady(d.y);
    }, Math.min(...next) + 50);
    return () => window.clearTimeout(id);
    // syncKey stands for the syncing years and when each was confirmed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncKey]);

  const withData = yearRange().filter((y) => ws.get(y)?.status === "ready");
  const sheets = React.useMemo(() => buildSheets(rec?.files ?? [], rec?.blank), [rec?.files, rec?.blank]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Workspace")}
        lead={t("Everything you upload for a year, sorted into sheets you can check and edit.")}
        actions={<ScopedInstallationSwitcher />}
      />

      <YearBar
        value={year}
        onChange={setYear}
        mark={(y) => {
          const s = ws.get(y)?.status;
          return s === "ready" ? "data" : s === "syncing" ? "pending" : undefined;
        }}
      />

      {!ws.loaded ? null : !rec ? (
        <>
          <UploadPanel
            year={year}
            onYear={setYear}
            copyFrom={withData.filter((y) => y < year).reverse()}
            onConfirm={(files) => ws.confirm(year, files)}
            onBlank={() => ws.startBlank(year)}
            onCopy={(from) => ws.copy(year, from)}
          />
          {/* Until a start is chosen, only the current year shows a plain sheet under the upload. */}
          {year === currentYear() && <Spreadsheet sheets={buildSheets([])} empty />}
        </>
      ) : rec.status === "ready" && rec.revealed === false ? (
        /* Set up and not yet shown: the card shows it is ready, and Get started opens the sheet. */
        <Card className="overflow-hidden p-0">
          <WorkspaceReveal key={year} onDone={() => ws.markRevealed(year)} />
        </Card>
      ) : rec.status === "syncing" ? (
        <Card className="p-6 md:p-8">
          <SettingUpStage files={rec.files.map((f) => f.name)} />
          <div className="mx-auto mt-6 max-w-xl text-center">
            <h2 className="font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#111]">
              {t("We're setting up your workspace")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-black/45">
              {rec.files.length === 1
                ? t("We're sorting your file into the sheets for the best experience. We'll let you know when it's ready.")
                : t("We're sorting your {n} files into the sheets for the best experience. We'll let you know when it's ready.", {
                    n: rec.files.length,
                  })}
            </p>
            <Button variant="ghost" size="sm" className="mt-4" onClick={() => ws.markReady(year)}>
              {t("Show the set-up workspace")} <ArrowRight size={13} strokeWidth={1.5} />
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-black/45">
            <span className="inline-flex items-center gap-1.5">
              <FileText size={13} strokeWidth={1.5} />
              {rec.files.length === 1 ? t("1 file") : t("{n} files", { n: rec.files.length })}
            </span>
            {rec.blank && !rec.copiedFrom && (
              <span className="inline-flex items-center gap-1.5">{t("Started from the beginning")}</span>
            )}
            {rec.copiedFrom && (
              <span className="inline-flex items-center gap-1.5">
                <Copy size={13} strokeWidth={1.5} />
                {t("Started from {year}", { year: rec.copiedFrom })}
              </span>
            )}
          </div>
          <Spreadsheet
            key={year}
            sheets={sheets}
            edits={rec.edits}
            onEdit={(cell, value) => ws.saveEdit(year, cell, value)}
            installation={installation}
            onInstallationSave={(inst) => {
              saveInstallation(inst);
              setInstallTick((n) => n + 1);
            }}
          />
          <ConvertBar href={convertHref} />
        </>
      )}
    </div>
  );
}

/* The way on: what is in the workspace serves every standard, chosen on Convert. */
function ConvertBar({ href }: { href: string }) {
  const t = useT();
  return (
    <Card className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-[15px] font-medium text-[#111]">{t("The data you've chosen works for every standard")}</div>
        <p className="mt-1 text-[13px] text-black/45">
          {t("Pick CBAM, ISO 14064-1, ISO 14067 or TGO on the Convert page — no need to upload again.")}
        </p>
      </div>
      <ButtonLink href={href} className="flex-none self-start sm:self-auto">
        {t("Go to Convert")} <ArrowRight size={14} strokeWidth={1.5} />
      </ButtonLink>
    </Card>
  );
}
