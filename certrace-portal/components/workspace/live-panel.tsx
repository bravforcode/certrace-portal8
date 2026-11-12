"use client";

/* ════════════════════════════════════════════════════════════
   LIVE CHECK — what the workspace still needs, whether it balances, and
   roughly how much embedded emission the data adds up to.

   Sits beside the sheet while the user types (MEASUR §4). Three cards:
   completeness per sheet, mass balance per process step, and an emissions
   estimate from the portal's own CBAM EU default tables. The estimate is
   labelled as an estimate and is not a declaration figure.

   The header button collapses the panel; the state is remembered in
   localStorage. Both reads and writes are guarded, since storage can be
   blocked (private windows, cleared site data).
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, Progress, cn } from "@/components/ui";
import { TONE_HEX } from "@/components/insight/kit";
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
import { estimateEmissions, type Note } from "@/lib/workbook/estimate";
import type { Installation } from "@/lib/installations";
import type { Sheet } from "@/lib/workspace-sheets";

const PANEL_KEY = "certrace:live-panel";
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
  country,
  year,
  onOpenSheet,
}: {
  sheets: Sheet[];
  installation: Installation | null;
  country: string;
  year: number;
  onOpenSheet: (id: string) => void;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = React.useState(true);
  const [tolerance, setTolerance] = React.useState(0.05);

  // Stored choices are read after mount, so the server render and the first client render agree.
  React.useEffect(() => {
    setOpen(readStored(PANEL_KEY) !== "closed");
    const saved = Number(readStored(TOLERANCE_KEY));
    if (TOLERANCES.includes(saved)) setTolerance(saved);
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    writeStored(PANEL_KEY, next ? "open" : "closed");
  };

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

  const est = React.useMemo(
    () => estimateEmissions(sheets, { country, year }),
    [sheets, country, year],
  );
  const shares =
    est.totalT > 0
      ? {
          direct: est.directT / est.totalT,
          indirect: est.indirectT / est.totalT,
          precursor: est.precursorT / est.totalT,
        }
      : null;
  const translate = (n: Note) => t(n.key, n.params);

  return (
    <aside aria-label={t("Live check")} className="flex min-w-0 flex-col gap-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="live-panel-body"
        onClick={toggle}
        className="flex items-center justify-between rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 text-left text-[13px] font-medium text-black/85"
      >
        {t("Live check")}
        <span className="inline-flex items-center gap-1 text-[12px] font-normal text-black/50">
          {open ? t("Hide panel") : t("Show panel")}
          {open ? (
            <ChevronUp size={14} strokeWidth={1.75} />
          ) : (
            <ChevronDown size={14} strokeWidth={1.75} />
          )}
        </span>
      </button>

      <div
        id="live-panel-body"
        className={cn("flex-col gap-3", open ? "flex" : "hidden")}
      >
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

        {/* ── Embedded emissions (estimate) ────────── */}
        <Card className="p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[13px] font-medium text-black/85">
              {t("Embedded emissions (estimate)")}
            </h3>
            <span className="rounded-full border border-black/15 px-2 py-px text-[11px] text-black/60">
              {t("Estimate")}
            </span>
          </div>
          <p className="mt-2 text-[20px] font-light tabular-nums text-black/85">
            {fmt(est.totalT)}{" "}
            <span className="text-[12px] text-black/50">tCO₂e</span>
          </p>
          <p className="text-[12px] text-black/50">
            {est.perTonne !== null
              ? t("{value} tCO₂e per tonne of product", {
                  value: fmt(est.perTonne, 3),
                })
              : t("Add product quantities to see per tonne")}
          </p>

          <div
            aria-hidden
            className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-black/[0.07]"
          >
            {shares && (
              <>
                <span
                  className="h-full"
                  style={{
                    width: `${shares.direct * 100}%`,
                    background: TONE_HEX.ok,
                  }}
                />
                <span
                  className="h-full"
                  style={{
                    width: `${shares.indirect * 100}%`,
                    background: TONE_HEX.info,
                  }}
                />
                <span
                  className="h-full"
                  style={{
                    width: `${shares.precursor * 100}%`,
                    background: TONE_HEX.warn,
                  }}
                />
              </>
            )}
          </div>
          <dl className="mt-2 grid grid-cols-3 gap-2 text-[11.5px] text-black/60">
            <div>
              <dt className="flex items-center gap-1">
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: TONE_HEX.ok }}
                />
                {t("Direct")}
              </dt>
              <dd className="tabular-nums text-black/85">{fmt(est.directT)}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1">
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: TONE_HEX.info }}
                />
                {t("Indirect")}
              </dt>
              <dd className="tabular-nums text-black/85">
                {fmt(est.indirectT)}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1">
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: TONE_HEX.warn }}
                />
                {t("Precursors")}
              </dt>
              <dd className="tabular-nums text-black/85">
                {fmt(est.precursorT)}
              </dd>
            </div>
          </dl>

          {est.precursors.length > 0 && (
            <p className="mt-3 text-[11.5px] text-black/55">
              {t("Precursors use the EU default for unknown origin")}
            </p>
          )}
          {est.notes.map((n) => (
            <p
              key={n.key + JSON.stringify(n.params)}
              className="mt-2 text-[11.5px] text-black/55"
            >
              {translate(n)}
            </p>
          ))}
          {est.unmatched.length > 0 && (
            <p className="mt-2 text-[11.5px] text-warn-text">
              {t("Not counted: {items}", {
                items: est.unmatched.map(translate).join(", "),
              })}
            </p>
          )}
          <p className="mt-3 border-t border-black/[0.06] pt-2 text-[11px] text-black/45">
            {t("EU default factors. Not a declaration figure.")}{" "}
            {t("Process emissions not included.")}
          </p>
        </Card>
      </div>
    </aside>
  );
}
