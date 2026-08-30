"use client";

export const runtime = "edge";

/* ════════════════════════════════════════════════════════════
   MONTHLY DATA — the whole year, and everything that hangs off a month

   THE MMD AND PRECURSOR TABS ARE GONE, and their content lives here. That was
   not a tidy-up. Three tabs implied three separate jobs on three separate
   rhythms, and the reality is one job twelve times: for March, a verifier
   wants March's methodology, March's readings and March's precursor
   quantities, together and agreeing. Splitting them across tabs meant nobody
   could see that March's readings were in and March's precursors were not
   without visiting three screens and holding the answer in their head.

   So the year is one page, in the order the work actually happens:

     1 · what the year adds up to           — annual production
     2 · the schedule, and the deadline     — editable here, not only at setup
     3 · twelve months you can act on       — open · link · send · remind
     4 · the MMD, month by month
     5 · the monthly readings, month by month
     6 · the precursor chain, month by month

   EACH MONTH BOX IS AN ACTION SURFACE, not a link. Opening the month was its
   only affordance, so sending the request meant leaving for Settings, copying
   a workspace-wide link that guessed a month, and pasting it — three steps
   away from the row that told you it was missing. Now the row that shows the
   gap is the row that closes it.

   THE SUPPLIER SUBMISSIONS GRID IS GONE TOO. It asked the exporter to pick a
   declaration and a supplier and then "create a 12-month series", which is a
   second, parallel way of expressing what creating the workspace already said:
   this installation, this good, twelve months. Two places to start the same
   twelve requests is two places for them to disagree about how many have gone
   out. Creating the workspace IS the series; these twelve boxes are it.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BellRing, Check, Circle, Copy, Pencil, Send, Timer, TriangleAlert } from "lucide-react";
import { cn, useFlash } from "@/components/ui";
import { Select } from "@/components/controls";
import { toast } from "@/components/toast";
import { Num, SectionCard, fmt } from "@/components/workspace/chrome";
import { useWorkspace } from "@/components/workspace/provider";
import {
  DUE_STATE_LABEL,
  countdownFor,
  dispatchesFor,
  dueDateFor,
  dueStateFor,
  effectiveDueDay,
  formatDate,
  markMonthReminded,
  markMonthSent,
  reminderState,
  requestDateFor,
  type DueState,
  type MonthDispatch,
} from "@/lib/month-dispatch";
import {
  annualProductionFor,
  indicativeMonthlySEE,
  monthCounts,
  monthIssues,
  monthResult,
  monthsForWorkspace,
  MONTH_STATUS_LABEL,
  type MonthlyEntry,
} from "@/lib/monthly-data";
import { REVIEW_STATE_LABEL, formatSubmissionDate, submissionVersion, submissionsFor, type MonthSubmission } from "@/lib/month-submission";
import { dueDayOptions, monthName, scheduleFor, updateWorkspace } from "@/lib/workspace";
import { workspaceLinkFor } from "@/lib/workspace-link";
import { listSuppliers, totalTonnes, type PrecursorSupplier } from "@/lib/precursor-suppliers";
import { annualEvidence, evidenceForMonth } from "@/lib/workspace-evidence";
import { electricitySupplyLabel, finalVersionCovering, latestVersion, loadDraft, mmdIssues } from "@/lib/workspace-mmd";
import { useT } from "@/lib/i18n";

const STATUS_STYLE: Record<MonthlyEntry["status"], string> = {
  empty: "border-black/10 bg-black/[0.03] text-black/40",
  draft: "border-[rgba(180,83,9,0.18)] bg-[#fffbeb] text-[#b45309]",
  submitted: "border-[rgba(5,150,105,0.18)] bg-[#ecfdf5] text-[#047857]",
  reviewed: "border-[rgba(5,150,105,0.18)] bg-[#ecfdf5] text-[#047857]",
};

/* The card's own skin. Status is carried by the whole surface rather than by a
   chip inside it, so a year's state is readable at a glance from across the
   desk — which is the actual question this screen answers. */
const CARD_STYLE: Record<MonthlyEntry["status"], string> = {
  empty: "border-black/[0.08] bg-white",
  draft: "border-[#fde68a] bg-[#fffbeb]",
  submitted: "border-[rgba(5,150,105,0.25)] bg-[#ecfdf5]",
  reviewed: "border-[rgba(5,150,105,0.4)] bg-[#ecfdf5]",
};

const STATUS_ICON: Record<MonthlyEntry["status"], React.ReactNode> = {
  empty: <Circle size={13} strokeWidth={1.5} className="text-black/20" />,
  draft: <Pencil size={13} strokeWidth={1.5} className="text-[#b45309]" />,
  submitted: <Check size={13} strokeWidth={2} className="text-[#047857]" />,
  reviewed: <Check size={13} strokeWidth={2} className="text-[#047857]" />,
};

const DUE_TONE: Record<DueState, string> = {
  pending: "text-black/35",
  open: "text-black/45",
  due_soon: "text-[#b45309]",
  overdue: "text-[#dc2626]",
  done: "text-[#047857]",
};

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};

export default function MonthlyDataPage() {
  const t = useT();
  const { workspace, readiness, refresh } = useWorkspace();
  const router = useRouter();
  const [entries, setEntries] = React.useState<MonthlyEntry[] | null>(null);
  const [dispatch, setDispatch] = React.useState<Record<string, MonthDispatch>>({});
  const [submissions, setSubmissions] = React.useState<Record<string, MonthSubmission>>({});

  const schedule = scheduleFor(workspace);

  React.useEffect(() => {
    setEntries(monthsForWorkspace(workspace));
    setDispatch(dispatchesFor(workspace.id));
    setSubmissions(submissionsFor(workspace.id));
  }, [workspace, readiness]);

  const production = entries ? annualProductionFor(workspace) : null;
  const thisMonth = new Date().toISOString().slice(0, 7);

  /* Changing the deadline moves the months that have NOT gone out. The ones
     already sent keep the date they were sent under — see the note on
     MonthDispatch.dueDay. Nothing extra is needed here for that: the snapshot
     lives on the dispatch record, and every reader goes through
     effectiveDueDay(). */
  const setSchedule = (patch: Partial<typeof schedule>) => {
    updateWorkspace(workspace.id, { schedule: { ...schedule, ...patch } });
    refresh();
  };

  /* NO TOAST ON SEND OR COPY. Both are pressed on a card in a grid of twelve,
     and both used to answer in the corner of the screen — so the reader's eye
     had to leave the month they were working on to find out whether the month
     they were working on had gone. The button says it instead, where the
     click happened, and the card's own "sent <date>" line is the durable
     record the toast was standing in for. What sending MEANS in a build with
     no mail server behind it stays in the section's help, which can be
     re-read; a toast carrying that could only be read once. */
  /* SENDING DOES NOT ALSO COPY. It used to put the link on the clipboard as a
     side effect and say so — "Sent · link copied" — which made one press do
     two things and quietly overwrite whatever the reader had on their
     clipboard at the time. Copy link is right beside it and is the press that
     means "give me the link"; this one means "ask for this month". */
  const send = (month: string) => {
    markMonthSent(workspace.id, month, schedule.dueDay);
    setDispatch(dispatchesFor(workspace.id));
  };

  const remind = (month: string) => {
    markMonthReminded(workspace.id, month);
    setDispatch(dispatchesFor(workspace.id));
    toast({
      message: `Reminder logged for ${monthName(month)}`,
      detail: `You can chase this month again in ${6} hours.`,
      tone: "info",
    });
  };

  const copy = (month: string) => {
    const link = workspaceLinkFor(workspace.id, month);
    if (typeof navigator !== "undefined" && navigator.clipboard) void navigator.clipboard.writeText(link).catch(() => {});
  };

  return (
    <div className="space-y-5">
      {/* ── 1 · What the year adds up to ─────────────────────── */}
      <SectionCard
        title={t("Annual production")}
        blurb={t("The sum of the submitted months. Nothing to type here — a second copy of this figure is a second thing that can disagree with the readings behind it.")}
      >
        {production && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <div className="font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">{fmt(production.tonnes, 3)}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.1em] text-black/40">{t("tonnes produced")}</div>
            </div>
            <div>
              <div className="font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
                {production.monthsCounted}
                <span className="text-lg text-black/30"> / 12</span>
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.1em] text-black/40">{t("months submitted")}</div>
            </div>
            {/* Only the complete case says anything. The incomplete one used
                to list all twelve month names, which on a workspace that has
                just been created is a wall of red-flag text about work that
                has not fallen due yet — the "8 / 12 months submitted" figure
                beside it already says exactly what is outstanding, and the
                schedule below names each month with its own state. */}
            <div className="sm:col-span-1">
              {production.complete && <p className="text-[13px] text-[#047857]">{t("Every month is in. The annual figure is complete.")}</p>}
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── 2 · The schedule, editable in place ──────────────── */}
      <SectionCard
        title={t("The year")}
        helpTitle={t("How the twelve months are asked for")}
        help={
          <>
            <p>{t("A month can only be reported once it has ended, so each request goes out in the month after the one it covers.")}</p>
            <p className="mt-2">{t("The deadline runs from that request. Change either here and every month below moves with it.")}</p>
            <p className="mt-2">
              {t("Certrace does not deliver yet. Sending records the ask and starts the clock;")} <strong>{t("Copy link")}</strong> {t("beside it is what puts the address on your clipboard to paste into an email.")}
            </p>
          </>
        }
        blurb={t("Click a month to open it. The buttons on each one send that month's link, copy it again, or log a chase.")}
      >
        <div className="mb-5 rounded-xl border border-black/[0.07] bg-[#faf9f7] p-4">
          <p className="text-[12.5px] leading-relaxed text-black/55">
            {t("Each month is asked for once it has ended — the request is dated the")} <strong>{t("last day of the month")}</strong> {t("it covers, and the data is due by the")} <strong>{t("{day} of the month after it", { day: ordinal(schedule.dueDay) })}</strong>.{" "}
            {workspace.selfSupplied ? t("It lands in your own inbox.") : t("It goes to {installation}.", { installation: workspace.installationName })}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:max-w-xl">
            {/* The same control as this workspace's Settings tab — an exporter
                changing the deadline here should not be offered a different set
                of answers from the one they see there. */}
            <label className="block">
              <span className="mb-2 block text-[11px] uppercase tracking-[0.1em] text-black/55">{t("Last date to send")}</span>
              <Select
                value={String(schedule.dueDay)}
                onChange={(v) => setSchedule({ dueDay: Number(v) })}
                options={dueDayOptions().map((d) => ({ value: String(d), label: t("{day} of the following month", { day: ordinal(d) }) }))}
                ariaLabel={t("Last date to send")}
              />
            </label>
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-black/40">
            {t("Changing this moves the months that have not gone out yet. A month already sent keeps the deadline it was sent under — the person answering it was told that date.")}
          </p>
        </div>

        {/* ── 3 · Twelve months you can act on ──────────────── */}
        {entries === null ? null : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {entries.map((e) => (
              <MonthBox
                key={e.month}
                entry={e}
                current={e.month === thisMonth}
                dispatch={dispatch[e.month] ?? null}
                scheduleDueDay={schedule.dueDay}
                onOpen={() => router.push(`/workspaces/${workspace.id}/monthly/${e.month}`)}
                onSend={() => send(e.month)}
                onCopy={() => copy(e.month)}
                onRemind={() => remind(e.month)}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── 4 · The MMD, month by month ──────────────────────── */}
      <MmdByMonth />

      {/* ── 5 · The readings, month by month ─────────────────── */}
      <SectionCard
        title={t("Monthly data")}
        blurb={t("The same twelve months as a column of numbers — the shape for checking a year rather than opening a month. The review column is where each one stands with you.")}
      >
        {entries === null ? null : (
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="border-b border-black/10">
                  {[t("Month"), t("Status"), t("Review"), t("Version"), t("Production"), t("Fuels"), t("Electricity"), t("Process CO₂"), t("Monthly CO₂"), t("SEE (indicative)"), t("Notes")].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "px-2 pb-2 text-[10px] uppercase tracking-[0.12em] text-black/40",
                          i >= 4 && i <= 9 ? "text-right" : "text-left",
                        )}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const res = monthResult(e);
                  const see = indicativeMonthlySEE(e);
                  const sub = submissions[e.month];
                  const state = sub?.state ?? "open";
                  const version = sub ? submissionVersion(sub) : null;
                  return (
                    <tr key={e.month} className={cn("border-b border-black/[0.04] hover:bg-[#fafaf8]", !monthCounts(e) && "text-black/50")}>
                      <td className="px-2 py-2.5">
                        <Link href={`/workspaces/${workspace.id}/monthly/${e.month}`} className="text-[13px] text-black/80 hover:underline">
                          {monthName(e.month)}
                        </Link>
                      </td>
                      <td className="px-2 py-2.5">
                        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.1em]", STATUS_STYLE[e.status])}>
                          {t(MONTH_STATUS_LABEL[e.status])}
                        </span>
                      </td>
                      {/* WHERE IT STANDS WITH THE EXPORTER, which is a different
                          question from whether the supplier has filled it in.
                          A submitted month that nobody has confirmed is the one
                          that quietly reaches December unreviewed. */}
                      <td className="px-2 py-2.5">
                        <span className="text-[12px] text-black/55">{t(REVIEW_STATE_LABEL[state])}</span>
                        {sub?.editedByExporter && <span className="mt-0.5 block text-[10.5px] text-[#b45309]">{t("edited by you")}</span>}
                      </td>
                      {/* WHICH VERSION IS ON FILE, and when — the answer to
                          "is what I am reading the figure they sent me, or the
                          one I changed in October". */}
                      <td className="px-2 py-2.5">
                        {version ? (
                          <>
                            <Num className="text-black/70">{version.label}</Num>
                            <span className="mt-0.5 block text-[10.5px] text-black/35">{formatSubmissionDate(version.at)}</span>
                          </>
                        ) : (
                          <Num className="text-black/25">—</Num>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <Num>{e.productionTonnes > 0 ? `${fmt(e.productionTonnes, 3)} t` : "—"}</Num>
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <Num>{e.fuels.length || "—"}</Num>
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <Num>{e.electricityMwh > 0 ? `${fmt(e.electricityMwh, 3)} MWh` : "—"}</Num>
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <Num>{res.processTCO2 > 0 ? `${fmt(res.processTCO2, 2)} t` : "—"}</Num>
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <Num>{res.directTCO2 + res.indirectTCO2 > 0 ? `${fmt(res.directTCO2 + res.indirectTCO2, 2)} t` : "—"}</Num>
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <Num className="text-black/40">{see == null ? "—" : fmt(see, 4)}</Num>
                      </td>
                      {/* PROSE DOES NOT GO IN A TABLE. A month's note is a
                          paragraph; printed in a cell it either wraps the row
                          to six lines or is truncated to something misleading.
                          The cell says whether there IS one, and the month
                          screen is where it is read. */}
                      <td className="px-2 py-2.5">
                        <span className="text-[12px] text-black/55">{e.notes?.trim() ? "Submitted" : "—"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ── 6 · What arrived from upstream, month by month ───── */}
      <PrecursorsByMonth />

      {/* ── 7 · What stands behind it, month by month ────────── */}
      <DocumentsByMonth />
    </div>
  );
}

/* ── Precursors received, month by month ──────────────────────
   Step 5 of the supplier's link, in the shape a year is checked in. The link
   asks for one month at a time — which is right for the person answering — and
   leaves the exporter with no way to see that April's billet tonnage was
   entered and May's was not without opening twelve screens.

   TONNAGES ARE PRINTED, NOT SUMMARISED. A precursor quantity is the number
   that multiplies a supplier's SEE into this good; "submitted" would hide the
   one figure the reader is checking. The row is the month, the column is the
   precursor, and the last one is what the month adds up to. */
function PrecursorsByMonth() {
  const t = useT();
  const { workspace, readiness } = useWorkspace();
  const [rows, setRows] = React.useState<PrecursorSupplier[] | null>(null);

  React.useEffect(() => {
    setRows(listSuppliers(workspace.id).filter((s) => s.parentId === null));
  }, [workspace, readiness]);

  const months = React.useMemo(
    () => Array.from({ length: 12 }, (_, i) => `${workspace.year}-${String(i + 1).padStart(2, "0")}`),
    [workspace.year],
  );

  if (rows === null) return null;

  return (
    <SectionCard
      title={t("Precursors received")}
      helpTitle={t("Where these figures come from")}
      help={
        <>
          <p>{t("Entered on the Precursors step of each month’s supplier link, or on the month screen here — one record, either way.")}</p>
          <p className="mt-2">{t("A blank is a gap, not a zero. A month that genuinely received none should say 0, because the arithmetic cannot tell the two apart.")}</p>
        </>
      }
      blurb={t("What each bought-in CBAM input weighed, month by month. The tonnage is what carries a supplier's emissions into this good, so it is printed rather than summarised.")}
    >
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/10 px-4 py-6 text-center text-[13px] text-black/40">
          No precursors listed for this good. Add them on the{" "}
          <Link href={`/workspaces/${workspace.id}/tree`} className="underline underline-offset-2">
            {t("Supply Chain")}
          </Link>{" "}
          page — the chain is a property of the year, the tonnages are a property of the month.
        </p>
      ) : (
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-black/10">
                <th className="px-2 pb-2 text-left text-[10px] uppercase tracking-[0.12em] text-black/40">{t("Month")}</th>
                {rows.map((r) => (
                  <th key={r.id} className="px-2 pb-2 text-right text-[10px] uppercase tracking-[0.12em] text-black/40">
                    {r.precursorName || r.name || "Unnamed"}
                  </th>
                ))}
                <th className="px-2 pb-2 text-right text-[10px] uppercase tracking-[0.12em] text-black/40">{t("Month total")}</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => {
                const cells = rows.map((r) => (r.monthlyQuantities ?? []).find((q) => q.month === m)?.tonnes);
                const total = cells.reduce<number>((sum, v) => sum + (v ?? 0), 0);
                const anything = cells.some((v) => v != null);
                return (
                  <tr key={m} className={cn("border-b border-black/[0.04] hover:bg-[#fafaf8]", !anything && "text-black/40")}>
                    <td className="px-2 py-2.5">
                      <Link href={`/workspaces/${workspace.id}/monthly/${m}`} className="text-[13px] text-black/80 hover:underline">
                        {monthName(m)}
                      </Link>
                    </td>
                    {cells.map((v, i) => (
                      <td key={rows[i].id} className="px-2 py-2.5 text-right">
                        <Num className={v == null ? "text-black/25" : undefined}>{v == null ? "—" : `${fmt(v, 3)} t`}</Num>
                      </td>
                    ))}
                    <td className="px-2 py-2.5 text-right">
                      <Num className={anything ? "text-black/70" : "text-black/25"}>{anything ? `${fmt(total, 3)} t` : "—"}</Num>
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t border-black/10">
                <td className="px-2 py-2.5 text-[11px] uppercase tracking-[0.1em] text-black/45">{t("Year to date")}</td>
                {rows.map((r) => (
                  <td key={r.id} className="px-2 py-2.5 text-right">
                    <Num className="text-black/70">{fmt(totalTonnes(r), 3)} t</Num>
                  </td>
                ))}
                <td className="px-2 py-2.5 text-right">
                  <Num className="text-black/70">{fmt(rows.reduce((sum, r) => sum + totalTonnes(r), 0), 3)} t</Num>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

/* ── Documents, month by month ────────────────────────────────
   Step 6 of the supplier's link. A file name is not a fact anybody checks a
   year against, and twelve rows of "Feb-2026-PEA-invoice-scan-final(2).pdf"
   is a table nobody reads — so the cell that matters is HOW MANY are attached
   and whether the month has anything behind it at all. The file itself is one
   click away, in the month it belongs to. */
function DocumentsByMonth() {
  const t = useT();
  const { workspace, readiness } = useWorkspace();
  const [rows, setRows] = React.useState<{ month: string; count: number; latest: string | null; kinds: number }[] | null>(null);

  React.useEffect(() => {
    const months = Array.from({ length: 12 }, (_, i) => `${workspace.year}-${String(i + 1).padStart(2, "0")}`);
    setRows(
      months.map((month) => {
        const items = evidenceForMonth(workspace.id, month);
        return {
          month,
          count: items.length,
          latest: items.length ? (items[0].capturedAt ?? null) : null,
          kinds: new Set(items.flatMap((i) => i.fieldKeys)).size,
        };
      }),
    );
  }, [workspace, readiness]);

  const annual = React.useMemo(() => (rows === null ? 0 : annualEvidence(workspace.id).length), [rows, workspace.id]);

  if (rows === null) return null;

  return (
    <SectionCard
      title={t("Documents")}
      helpTitle={t("What counts as attached")}
      help={
        <>
          <p>{t("A document is attached to a MONTH and to the figure it stands behind. A file with nothing bound to it is a file, not evidence.")}</p>
          <p className="mt-2">{t("Annual paperwork — the licence, the calibration records, a carbon-price receipt — sits outside the twelve months and is counted separately below.")}</p>
        </>
      }
      blurb={t("What has been uploaded against each month, from the Documents step of the supplier's link or from the month screen here.")}
    >
      <div className="-mx-2 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="border-b border-black/10">
              {[t("Month"), t("State"), t("Files"), t("Figures covered"), t("Last upload")].map((h, i) => (
                <th key={h} className={cn("px-2 pb-2 text-[10px] uppercase tracking-[0.12em] text-black/40", i >= 2 && i <= 3 ? "text-right" : "text-left")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.month} className={cn("border-b border-black/[0.04] hover:bg-[#fafaf8]", r.count === 0 && "text-black/40")}>
                <td className="px-2 py-2.5">
                  <Link href={`/workspaces/${workspace.id}/monthly/${r.month}`} className="text-[13px] text-black/80 hover:underline">
                    {monthName(r.month)}
                  </Link>
                </td>
                <td className="px-2 py-2.5">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.1em]",
                      r.count > 0 ? STATUS_STYLE.submitted : STATUS_STYLE.empty,
                    )}
                  >
                    {r.count > 0 ? t("Submitted") : t("Nothing yet")}
                  </span>
                </td>
                <td className="px-2 py-2.5 text-right">
                  <Num className={r.count === 0 ? "text-black/25" : undefined}>{r.count || "—"}</Num>
                </td>
                <td className="px-2 py-2.5 text-right">
                  <Num className={r.kinds === 0 ? "text-black/25" : undefined}>{r.kinds || "—"}</Num>
                </td>
                <td className="px-2 py-2.5">
                  <span className="text-[12px] text-black/50">{r.latest ? formatDate(new Date(r.latest)) : "—"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-black/40">
        {annual === 0
          ? t("No annual paperwork attached yet — the licence, calibration records and any carbon-price receipt live on the Readiness tab, outside the twelve months.")
          : `${annual} annual document${annual === 1 ? "" : "s"} are held outside the twelve months, on the Readiness tab.`}
      </p>
    </SectionCard>
  );
}

/* ── A month ──────────────────────────────────────────────────
   Status on the surface, the figures in the middle, and the things you might
   do with it along the bottom. The box itself is not a link — it holds
   buttons, and a clickable container full of clickable children is a box where
   every click is a gamble. The month name is a heading rather than a target.

   THE ACTIONS ARE A SEQUENCE, NOT A MENU. Before a month has gone out there is
   exactly one thing to do with it: send it. Edit, Copy link and Remind all
   presuppose a request that exists — editing data nobody was asked for,
   copying a link nobody has, chasing somebody who was never written to. So the
   card shows SEND NOW alone, and the other three appear the moment it has been
   sent. That is also what makes the send button meaningful: it is the act that
   creates the record, not a shortcut past it.

   THE COUNTDOWN IS ON THE CARD once it has been sent, because "how long have
   they got" is the question this screen exists to answer and it was previously
   only derivable by reading a date and doing the arithmetic. */
function MonthBox({
  entry,
  current,
  dispatch,
  scheduleDueDay,
  onOpen,
  onSend,
  onCopy,
  onRemind,
}: {
  entry: MonthlyEntry;
  current: boolean;
  dispatch: MonthDispatch | null;
  scheduleDueDay: number;
  onOpen: () => void;
  onSend: () => void;
  onCopy: () => void;
  onRemind: () => void;
}) {
  const t = useT();
  const errors = monthIssues(entry).filter((i) => i.severity === "error");
  const submitted = entry.status === "submitted" || entry.status === "reviewed";
  const sent = Boolean(dispatch);

  // Both actions put the link on the clipboard and neither leaves the page,
  // so both answer on the button — see MonthAction.
  const [justSent, flashSent] = useFlash();
  const [justCopied, flashCopied] = useFlash();

  // A month already sent is measured against the deadline it was sent under,
  // not against whatever the workspace says today.
  const dueDay = effectiveDueDay(dispatch, scheduleDueDay);
  const due = dueStateFor(entry.month, { dueDay, submitted });
  const countdown = countdownFor(entry.month, dueDay);
  const label = monthName(entry.month).split(" ")[0];

  const reminder = reminderState({ dispatch, submitted, due: countdown.due });

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border p-4 transition-colors",
        CARD_STYLE[entry.status],
        current && "ring-2 ring-[#111] ring-offset-2 ring-offset-[#fdfdfc]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-[family-name:var(--font-plex)] text-[17px] font-light tracking-tight text-[#111]">{label}</span>
        {STATUS_ICON[entry.status]}
      </div>

      <div className="mt-2 font-mono text-[13px] tabular-nums text-black/70">
        {entry.productionTonnes > 0 ? `${fmt(entry.productionTonnes, 1)} t` : <span className="text-black/25">—</span>}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className={cn("rounded-full border px-2 py-0.5 text-[9.5px] uppercase tracking-[0.1em]", STATUS_STYLE[entry.status])}>
          {t(MONTH_STATUS_LABEL[entry.status])}
        </span>
        {errors.length > 0 && (
          <span className="inline-flex items-center gap-1 text-[10.5px] text-[#dc2626]" title={errors[0].message}>
            <TriangleAlert size={11} strokeWidth={1.5} /> {errors.length}
          </span>
        )}
      </div>

      {/* THE COUNTDOWN, once it is out there and not yet in. A month nobody has
          asked for has no clock running on it — showing one would be counting
          down a deadline the other end has never been told about. */}
      {sent && !submitted && (
        <div className={cn("mt-2.5 flex items-baseline gap-1.5", countdown.overdue ? "text-[#dc2626]" : DUE_TONE[due])}>
          <Timer size={12} strokeWidth={1.5} className="translate-y-[1px]" />
          <span className="font-mono text-[12px] tabular-nums">{countdown.label}</span>
          <span className="text-[10.5px] text-black/35">· due {formatDate(countdown.due)}</span>
        </div>
      )}

      {/* When it was asked for and where it stands — the row that shows the gap
          is the row that explains it. */}
      <p className={cn("mt-2 text-[11px] leading-relaxed", DUE_TONE[due])}>
        {due === "pending" ? (
          `Askable ${formatDate(requestDateFor(entry.month))}`
        ) : due === "done" ? (
          "In"
        ) : sent ? (
          DUE_STATE_LABEL[due]
        ) : (
          <>
            {t(DUE_STATE_LABEL[due])} · due {formatDate(dueDateFor(entry.month, dueDay))}
          </>
        )}
        {sent && dispatch && (
          <span className="text-black/35">
            {" · "}sent {formatDate(new Date(dispatch.sentAt))}
            {dispatch.reminderCount > 0 ? ` · chased ${dispatch.reminderCount}×` : ""}
          </span>
        )}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-1 pt-3">
        {justSent ? (
          /* THE CONFIRMATION OUTLIVES THE BUTTON IT BELONGS TO. Sending flips
             this card from "not sent" to "sent", and the sent card carries a
             different set of actions — so the Send button that was pressed
             stops existing at the exact moment it has something to report,
             and a flash on it would never be seen. It is held here for the
             length of the flash instead, saying what happened, and the
             Edit / Copy link / Remind row takes over once it has been read. */
          <MonthAction label={t("Send now")} confirmLabel={t("Sent")} confirmed onClick={() => {}} primary>
            <Send size={12} strokeWidth={1.5} />
          </MonthAction>
        ) : !sent ? (
          /* One action, deliberately. See the header note above. */
          <MonthAction
            label={t("Send now")}
            onClick={() => {
              onSend();
              flashSent();
            }}
            primary
          >
            <Send size={12} strokeWidth={1.5} />
          </MonthAction>
        ) : (
          <>
            <MonthAction label={t("Edit")} onClick={onOpen} primary>
              <Pencil size={12} strokeWidth={1.5} />
            </MonthAction>
            <MonthAction
              label={t("Copy link")}
              confirmLabel={t("Copied")}
              confirmed={justCopied}
              onClick={() => {
                onCopy();
                flashCopied();
              }}
            >
              <Copy size={12} strokeWidth={1.5} />
            </MonthAction>
            {/* Disabled rather than hidden, with the reason in the tooltip: a
                button that appears only once somebody is late is a button an
                exporter cannot find when they go looking for it. */}
            {/* Remind, not re-send. Re-sending minted a second link for a month
                that already had one out there, so the supplier held two links
                to the same month and the exporter could not tell which one the
                answer came back through. Chasing the existing link is the same
                intent without the ambiguity. */}
            <MonthAction
              label={t("Remind")}
              onClick={onRemind}
              disabled={!reminder.allowed}
              title={reminder.allowed ? "Chase this month" : reminder.label}
            >
              <BellRing size={12} strokeWidth={1.5} />
            </MonthAction>
          </>
        )}
      </div>
    </div>
  );
}

/* `confirmed` is what a toast used to be. The button holds its own success
   for a couple of seconds — green, with a tick that pops in — and then goes
   back to being a button. It is width-stable through the swap (`min-w`), so
   the control does not resize under the cursor at the moment it succeeds,
   which reads as a control that broke. */
function MonthAction({
  label,
  confirmLabel,
  confirmed,
  onClick,
  children,
  primary,
  disabled,
  title,
}: {
  label: string;
  confirmLabel?: string;
  confirmed?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  primary?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  const showing = Boolean(confirmed && confirmLabel);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1 text-[10.5px] transition-colors duration-300",
        confirmLabel && "min-w-[6.5rem]",
        showing
          ? "border-[rgba(5,150,105,0.35)] bg-[#ecfdf5] text-[#047857]"
          : primary
            ? "border-transparent bg-[#111] text-white hover:bg-[#333]"
            : "border-black/10 bg-white/70 text-black/55 hover:border-black/25 hover:text-black",
        disabled && "pointer-events-none border-black/[0.06] bg-black/[0.02] text-black/25",
      )}
    >
      {showing ? <Check size={12} strokeWidth={2} className="ct-confirm" /> : children}
      {showing ? confirmLabel : label}
    </button>
  );
}

/* ── The MMD, month by month ──────────────────────────────────
   The MMD is written once for a reporting period, not twelve times — but it
   COVERS each month, and "which version was in force in March" is the question
   a verifier asks. So the table is one row per month naming the version that
   applies to it, which is also what tells an exporter that finalising in
   August left January to July describing a plant that has since changed. */
type MmdRow = {
  month: string;
  version: string;
  final: boolean;
  open: number;
  boundary: boolean;
  processes: number;
  fuels: number;
  supply: string;
  gaps: number;
};

function MmdByMonth() {
  const t = useT();
  const { workspace, readiness } = useWorkspace();
  const [rows, setRows] = React.useState<MmdRow[] | null>(null);

  React.useEffect(() => {
    const draft = loadDraft(workspace.id, workspace.periodStart, workspace.periodEnd);
    const finalised = finalVersionCovering(workspace.id, workspace.periodStart, workspace.periodEnd);
    const latest = latestVersion(workspace.id);
    /* THE CONTENT IN FORCE FOR A MONTH IS THE FINALISED VERSION'S, not the
       draft's, when one exists — a verifier asking what March was reported
       under is asking about the stamped document, and reading the live draft
       would answer with whatever has been typed since. */
    const inForce = finalised ? finalised.content : draft;
    const open = mmdIssues(draft).length;
    const months = Array.from({ length: 12 }, (_, i) => `${workspace.year}-${String(i + 1).padStart(2, "0")}`);
    setRows(
      months.map((month) => ({
        month,
        version: finalised ? `v${finalised.n}` : latest ? `v${latest.n} (superseded)` : "Draft",
        final: Boolean(finalised),
        open,
        boundary: inForce.boundaryDescription.trim().length > 0,
        processes: inForce.processesIncluded.length,
        fuels: inForce.fuelTypeIds.length,
        supply: inForce.electricitySupply
          ? electricitySupplyLabel(inForce.electricitySupply, inForce.electricitySupplyOther)
          : "",
        gaps: inForce.dataGaps.length,
      })),
    );
  }, [workspace, readiness]);

  return (
    <SectionCard
      title={t("MMD by month")}
      helpTitle={t("The monitoring methodology")}
      blurb={t("One methodology covers the year — this is which version applies to each month, what it says, and what is still outstanding in it.")}
      help={
        <>
          <p>{t("The MMD describes how these figures are produced: the boundary, the instruments, the factors and their sources.")}</p>
          <p className="mt-2">{t("Finalising stamps a version. Editing after that forks the next one, so a document handed over in March still says in December what it said in March.")}</p>
          <p className="mt-2">
            {t("The boundary is a paragraph and the exclusions are a list, so those columns say only whether an answer exists — the counts beside them are what a year is actually checked against.")}
          </p>
        </>
      }
    >
      {rows === null ? null : (
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr className="border-b border-black/10">
                {[t("Month"), t("Version in force"), t("State"), t("Boundary"), t("Processes"), t("Fuels declared"), t("Electricity supply"), t("Data gaps"), t("Outstanding")].map(
                  (h, i) => (
                    <th
                      key={h}
                      className={cn(
                        "px-2 pb-2 text-[10px] uppercase tracking-[0.12em] text-black/40",
                        i === 4 || i === 5 || i === 7 || i === 8 ? "text-right" : "text-left",
                      )}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.month} className="border-b border-black/[0.04] hover:bg-[#fafaf8]">
                  <td className="px-2 py-2.5">
                    <Link href={`/workspaces/${workspace.id}/monthly/${r.month}`} className="text-[13px] text-black/80 hover:underline">
                      {monthName(r.month)}
                    </Link>
                  </td>
                  <td className="px-2 py-2.5">
                    <Num className="text-black/60">{r.version}</Num>
                  </td>
                  <td className="px-2 py-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.1em]",
                        r.final ? STATUS_STYLE.submitted : STATUS_STYLE.draft,
                      )}
                    >
                      {r.final ? "Final" : "Draft"}
                    </span>
                  </td>
                  {/* A PARAGRAPH IS NOT A CELL. Whether one exists is the fact
                      the year is checked against; the paragraph itself is read
                      on the month screen. */}
                  <td className="px-2 py-2.5">
                    <span className={cn("text-[12px]", r.boundary ? "text-black/55" : "text-black/25")}>{r.boundary ? "Submitted" : "—"}</span>
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <Num className={r.processes === 0 ? "text-black/25" : undefined}>{r.processes || "—"}</Num>
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <Num className={r.fuels === 0 ? "text-black/25" : undefined}>{r.fuels || "—"}</Num>
                  </td>
                  <td className="px-2 py-2.5">
                    <span className={cn("text-[12px]", r.supply ? "text-black/55" : "text-black/25")}>{r.supply || "—"}</span>
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <Num className={r.gaps === 0 ? "text-black/25" : "text-[#b45309]"}>{r.gaps || "—"}</Num>
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <Num className={r.open > 0 ? "text-[#b45309]" : "text-black/35"}>{r.open > 0 ? t("{count} to answer", { count: r.open }) : "—"}</Num>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

