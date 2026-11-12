"use client";

/* ════════════════════════════════════════════════════════════
   LIVE CHECK — what the workspace still needs and whether it balances.

   Sits beside the sheet while the user types (MEASUR §4), always open. Under
   whatever the caller puts on top (the year's files): completeness per sheet
   and mass balance per process step. The tolerance choice is remembered in
   localStorage; reads and writes are guarded, since storage can be blocked
   (private windows, cleared site data).
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Card, Progress, cn } from "@/components/ui";
import { useLanguage } from "@/lib/i18n";
import {
  SHEET_ORDER,
  STATUS_LABEL,
  installationGaps,
  installationSheetStatus,
  missingCells,
  sheetStatus,
  type SheetStatus,
} from "@/lib/workbook/status";
import { massBalance } from "@/lib/workbook/balance";
import type { Installation } from "@/lib/installations";
import type { Sheet } from "@/lib/workspace-sheets";

const TOLERANCE_KEY = "certrace:balance-tolerance";
const TOLERANCES = [0.02, 0.05, 0.1];

function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage blocked: the choice lasts for this view only */
  }
}

const DOT: Record<SheetStatus, string> = {
  untouched: "bg-black/15",
  missing: "bg-err-text",
  review: "bg-warn-text",
  complete: "bg-ok-text",
};

const fmt = (n: number, digits = 1) =>
  n.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });

export function LivePanel({
  sheets,
  installation,
  onOpenSheet,
  top,
}: {
  sheets: Sheet[];
  installation: Installation | null;
  onOpenSheet: (id: string) => void;
  /** Rendered first, above Completeness. */
  top?: React.ReactNode;
}) {
  const { t } = useLanguage();
  const [tolerance, setTolerance] = React.useState(0.05);

  // Stored choices are read after mount, so the server render and the first client render agree.
  React.useEffect(() => {
    const saved = Number(readStored(TOLERANCE_KEY));
    if (TOLERANCES.includes(saved)) setTolerance(saved);
  }, []);

  const completeness = React.useMemo(() => {
    const rows = [
      {
        id: "installation",
        name: "Installation",
        status: installationSheetStatus(installation),
        gaps: installation ? installationGaps(installation) : 0,
      },
    ];
    for (const id of SHEET_ORDER) {
      if (id === "installation") continue;
      const sheet = sheets.find((s) => s.id === id);
      if (sheet)
        rows.push({
          id,
          name: sheet.name,
          status: sheetStatus(sheet),
          gaps: missingCells(sheet).length,
        });
    }
    return rows;
  }, [sheets, installation]);
  const doneCount = completeness.filter((l) => l.status === "complete").length;

  const balance = React.useMemo(
    () => massBalance(sheets, tolerance),
    [sheets, tolerance],
  );
  const ignored = balance.reduce((n, b) => n + b.ignored, 0);

  return (
    <aside aria-label={t("Live check")} className="flex min-w-0 flex-col gap-3">
      {top}
      <div className="flex flex-col gap-3">
        {/* ── Completeness ─────────────────────────── */}
        <Card className="p-4">
          <h3 className="text-[13px] font-medium text-black/85">
            {t("Completeness")}
          </h3>
          <p className="mt-1 text-[12px] text-black/50">
            {t("{n} of {m} sheets complete", {
              n: doneCount,
              m: completeness.length,
            })}
          </p>
          <div className="mt-2">
            <Progress
              value={
                completeness.length
                  ? (doneCount / completeness.length) * 100
                  : 0
              }
              tone="ok"
            />
          </div>
          <ul className="mt-3 flex flex-col gap-1">
            {completeness.map(({ id, name, status, gaps }) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onOpenSheet(id)}
                  className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-[12.5px] text-black/75 hover:bg-black/[0.03]"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "inline-block h-2 w-2 flex-none rounded-full",
                      DOT[status],
                    )}
                  />
                  <span className="flex-1 truncate">{t(name)}</span>
                  <span
                    className={cn(
                      "whitespace-nowrap text-[11.5px]",
                      status === "missing" ? "text-err-text" : "text-black/45",
                    )}
                  >
                    {status === "missing"
                      ? id === "installation"
                        ? t("{n} missing fields", { n: gaps })
                        : t("{n} rows missing data", { n: gaps })
                      : t(STATUS_LABEL[status])}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {/* ── Mass balance ─────────────────────────── */}
        <Card className="p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[13px] font-medium text-black/85">
              {t("Mass balance")}
            </h3>
            <label className="flex items-center gap-1.5 text-[11.5px] text-black/50">
              {t("Tolerance")}
              <select
                value={tolerance}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setTolerance(v);
                  writeStored(TOLERANCE_KEY, String(v));
                }}
                className="rounded-md border border-black/10 bg-white px-1.5 py-0.5 text-[12px] text-black/75"
              >
                {TOLERANCES.map((v) => (
                  <option key={v} value={v}>
                    {Math.round(v * 100)} %
                  </option>
                ))}
              </select>
            </label>
          </div>
          {balance.length === 0 ? (
            <p className="mt-2 text-[12px] text-black/45">
              {t("No steps recorded yet")}
            </p>
          ) : (
            <table className="mt-2 w-full text-[12px]">
              <thead>
                <tr className="text-left text-black/45">
                  <th className="pb-1 font-normal">{t("Step")}</th>
                  <th className="pb-1 text-right font-normal">{t("In (t)")}</th>
                  <th className="pb-1 text-right font-normal">
                    {t("Out (t)")}
                  </th>
                  <th className="pb-1 text-right font-normal">
                    {t("Difference")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {balance.map((b) => (
                  <React.Fragment key={b.step}>
                    <tr
                      className={cn(
                        "border-t border-black/[0.06]",
                        !b.ok && "text-warn-text",
                      )}
                    >
                      <td className="py-1 pr-2">{b.step}</td>
                      <td className="py-1 text-right tabular-nums">
                        {fmt(b.inT, 2)}
                      </td>
                      <td className="py-1 text-right tabular-nums">
                        {fmt(b.outT, 2)}
                      </td>
                      <td className="py-1 text-right tabular-nums">
                        {b.diffPct === null ? "—" : `${fmt(b.diffPct * 100)} %`}
                      </td>
                    </tr>
                    {!b.ok && (
                      <tr className="text-warn-text">
                        <td colSpan={4} className="pb-1 text-[11.5px]">
                          {b.diffPct === null
                            ? t("No inputs recorded for this step.")
                            : t(
                                "Inputs and outputs differ by {pct} %; check losses, scrap or units.",
                                { pct: fmt(Math.abs(b.diffPct) * 100) },
                              )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
          {ignored > 0 && (
            <p className="mt-2 text-[11.5px] text-black/45">
              {t("{n} rows not counted (unit or number)", { n: ignored })}
            </p>
          )}
        </Card>
      </div>
    </aside>
  );
}
