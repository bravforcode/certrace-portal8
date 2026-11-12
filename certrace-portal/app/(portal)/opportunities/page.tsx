"use client";

/* ════════════════════════════════════════════════════════════
   OPPORTUNITIES — the to-do list of what would cut the bill

   Each card is either a data gap that forces a default value (the default carries a mark-up,
   so the company pays for it) or a saved what-if scenario. The team assigns, moves and dates
   the cards here. Gap cards close on their own once the gap is filled. Print the report with
   the browser's print dialog; the print layout is built into this page.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lightbulb, Printer } from "lucide-react";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  PageHeader,
  inputClass,
  useFlash,
  type Tone,
} from "@/components/ui";
import { ErrorState, LoadingState } from "@/components/query-state";
import { useAccount } from "@/components/account-lock";
import { useT } from "@/lib/i18n";
import { useProfile } from "@/lib/profile";
import { useTeam } from "@/lib/team-query";
import { useStoreSync } from "@/lib/use-store-sync";
import { currentYear, yearRange } from "@/lib/year-range";
import { getInstallation, listInstallations } from "@/lib/installations";
import { collectOpportunities } from "@/lib/factory/opportunity-collect";
import {
  opportunityEditable,
  summarize,
  type Opportunity,
  type OpportunityStatus,
} from "@/lib/factory/opportunities";
import { cardText } from "@/lib/factory/opportunity-text";
import {
  SAVE_FAILED,
  updateOpportunity,
} from "@/lib/factory/opportunity-store";

const STATUSES: OpportunityStatus[] = [
  "open",
  "in-progress",
  "done",
  "dismissed",
];
const STATUS_LABEL: Record<OpportunityStatus, string> = {
  open: "Open card",
  "in-progress": "In progress",
  done: "Done",
  dismissed: "Dismissed",
};
const STATUS_TONE: Record<OpportunityStatus, Tone> = {
  open: "warn",
  "in-progress": "info",
  done: "ok",
  dismissed: "muted",
};
const ACTIVE = (o: Opportunity) =>
  o.status === "open" || o.status === "in-progress";
const UNDO_MS = 6000;

const formatNumber = (n: number, digits: number) =>
  n.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });

export default function OpportunitiesPage() {
  const t = useT();
  const qc = useQueryClient();
  const team = useTeam();
  const { profile } = useProfile();
  const account = useAccount();
  // The seat role is not exposed to the portal yet, so only the account lock gates editing here.
  const editable = opportunityEditable(account.locked, null);
  const [year, setYear] = React.useState(currentYear());
  const [installation, setInstallation] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [source, setSource] = React.useState("");
  const [assignee, setAssignee] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [undo, setUndo] = React.useState<{
    id: string;
    status: OpportunityStatus;
  } | null>(null);
  const [undoOn, fireUndo] = useFlash(UNDO_MS);

  const ids = listInstallations()
    .map((i) => i.id)
    .join(",");
  const { data, isError, refetch } = useQuery({
    queryKey: ["opportunities", year, ids],
    queryFn: () => collectOpportunities(year),
    staleTime: 0,
    refetchOnMount: "always",
  });
  useStoreSync(() => void refetch());

  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!data) return <LoadingState />;

  const cards = data.list;
  const list = cards.filter(
    (o) =>
      (!installation || o.installationId === installation) &&
      (!status || o.status === status) &&
      (!source || o.source === source) &&
      (!assignee ||
        (assignee === "none" ? o.assignee === "" : o.assignee === assignee)) &&
      (!search.trim() ||
        cardText(t, o).toLowerCase().includes(search.trim().toLowerCase())),
  );
  const totals = summarize(cards);
  const installationName = (id: string) => getInstallation(id)?.name || id;
  const members = team.data ?? [];
  const memberName = (id: string) =>
    members.find((m) => m.id === id)?.name ?? id;
  const today = new Date().toISOString().slice(0, 10);
  const printGroups = listInstallations()
    .map((i) => ({
      id: i.id,
      name: i.name || i.id,
      items: cards.filter((o) => o.installationId === i.id),
    }))
    .filter((g) => g.items.length > 0);

  const change = async (
    id: string,
    patch: Partial<Pick<Opportunity, "assignee" | "status" | "due">>,
  ) => {
    setError(null);
    try {
      await updateOpportunity(id, patch);
    } catch (e) {
      setError(e instanceof Error ? e.message : SAVE_FAILED);
    }
    await qc.invalidateQueries({ queryKey: ["opportunities"] });
  };

  const dismiss = async (o: Opportunity) => {
    setUndo({ id: o.id, status: o.status });
    fireUndo();
    await change(o.id, { status: "dismissed" });
  };

  const restore = async () => {
    if (!undo) return;
    await change(undo.id, { status: undo.status });
    setUndo(null);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={t("Opportunities")}
        title={t("Opportunities")}
        lead={t(
          "Find the gaps and savings to close, assign them, and print a report.",
        )}
      />

      {!editable && (
        <p
          role="status"
          className="rounded-md border border-black/10 px-3 py-2 text-sm text-black/70 print:hidden"
        >
          {t("Read-only. This account or seat cannot change opportunities.")}
        </p>
      )}
      {(error || data.saveFailed) && (
        <p role="alert" className="text-sm text-err-text print:hidden">
          {t(error ?? SAVE_FAILED)}
        </p>
      )}
      {data.skipped > 0 && (
        <p role="status" className="text-sm text-warn-text print:hidden">
          {t("{count} new items did not fit the list limit.", {
            count: String(data.skipped),
          })}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
        <label className="flex items-center gap-2 text-sm text-black/60">
          <span>{t("Reporting year")}</span>
          <select
            className={inputClass}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {yearRange().map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <Button onClick={() => window.print()}>
          <Printer size={15} strokeWidth={1.5} /> {t("Print report")}
        </Button>
      </div>

      <section
        aria-label={t("Opportunities summary")}
        className="grid gap-3 sm:grid-cols-3 print:hidden"
      >
        <Card>
          <p className="text-sm text-black/55">{t("Open cards")}</p>
          <p className="text-2xl font-light">
            {totals.open + totals.inProgress}
          </p>
          <p className="text-xs text-black/50">
            {t("Open")} {totals.open} · {t("In progress")} {totals.inProgress} ·{" "}
            {t("Done")} {totals.done}
          </p>
        </Card>
        <Card className="sm:col-span-2">
          <p className="text-sm text-black/60" aria-live="polite">
            {t("Open items worth at least {eur} EUR and {t} tCO₂e", {
              eur: formatNumber(totals.impactEur, 0),
              t: formatNumber(totals.impactT, 2),
            })}
          </p>
        </Card>
      </section>

      <div
        className="grid gap-2 sm:grid-cols-5 print:hidden"
        role="group"
        aria-label={t("Filter")}
      >
        <label className="sr-only" htmlFor="opp-installation">
          {t("Filter by installation")}
        </label>
        <select
          id="opp-installation"
          className={inputClass}
          value={installation}
          onChange={(e) => setInstallation(e.target.value)}
        >
          <option value="">
            {t("Installation")}: {t("All")}
          </option>
          {listInstallations().map((i) => (
            <option key={i.id} value={i.id}>
              {i.name || i.id}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="opp-status">
          {t("Filter by status")}
        </label>
        <select
          id="opp-status"
          className={inputClass}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">
            {t("Status")}: {t("All")}
          </option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(STATUS_LABEL[s])}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="opp-source">
          {t("Filter by source")}
        </label>
        <select
          id="opp-source"
          className={inputClass}
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          <option value="">
            {t("Source")}: {t("All")}
          </option>
          <option value="data-gap">{t("Data gap")}</option>
          <option value="what-if">{t("What-if")}</option>
        </select>
        <label className="sr-only" htmlFor="opp-assignee">
          {t("Filter by assignee")}
        </label>
        <select
          id="opp-assignee"
          className={inputClass}
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
        >
          <option value="">
            {t("Assignee")}: {t("All")}
          </option>
          <option value="none">{t("Unassigned")}</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="opp-search">
          {t("Search")}
        </label>
        <input
          id="opp-search"
          className={inputClass}
          type="search"
          placeholder={t("Search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {undoOn && undo && editable && (
        <div className="flex items-center justify-end gap-2 text-sm print:hidden">
          <Button variant="ghost" onClick={() => void restore()}>
            {t("Undo")}
          </Button>
        </div>
      )}

      {list.length === 0 ? (
        <div className="print:hidden">
          <EmptyState
            icon={<Lightbulb size={28} strokeWidth={1.25} />}
            title={t("Nothing to close yet")}
            body={t(
              "Gaps and saved scenarios appear here as you fill in the workspace.",
            )}
          />
        </div>
      ) : (
        <ul className="space-y-2 print:hidden" aria-label={t("Opportunities")}>
          {list.map((o) => (
            <li key={o.id}>
              <Card className="space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium text-black/80">
                      {cardText(t, o)}
                    </p>
                    <p className="text-xs text-black/50">
                      {installationName(o.installationId)} ·{" "}
                      {t(o.source === "data-gap" ? "Data gap" : "What-if")}
                    </p>
                    {o.detail && (
                      <p className="text-xs text-black/50">{t(o.detail)}</p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-black/80">
                      {o.impactEur === null
                        ? "—"
                        : `${formatNumber(o.impactEur, 0)} EUR`}
                    </p>
                    <p className="text-xs text-black/50">
                      {o.impactT === null
                        ? ""
                        : `${formatNumber(o.impactT, 2)} tCO₂e`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <label className="text-xs text-black/60">
                    <span className="block">{t("Assignee")}</span>
                    <select
                      className={inputClass}
                      value={o.assignee}
                      disabled={!editable}
                      onChange={(e) =>
                        void change(o.id, { assignee: e.target.value })
                      }
                    >
                      <option value="">{t("Unassigned")}</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                      {o.assignee &&
                        !members.some((m) => m.id === o.assignee) && (
                          <option value={o.assignee}>
                            {memberName(o.assignee)}
                          </option>
                        )}
                    </select>
                  </label>
                  <label className="text-xs text-black/60">
                    <span className="block">{t("Status")}</span>
                    <select
                      className={inputClass}
                      value={o.status}
                      disabled={!editable}
                      onChange={(e) =>
                        void change(o.id, {
                          status: e.target.value as OpportunityStatus,
                        })
                      }
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {t(STATUS_LABEL[s])}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs text-black/60">
                    <span className="block">{t("Due date")}</span>
                    <input
                      type="date"
                      className={inputClass}
                      value={o.due}
                      disabled={!editable}
                      onChange={(e) =>
                        void change(o.id, { due: e.target.value })
                      }
                    />
                  </label>
                  <Chip tone={STATUS_TONE[o.status]}>
                    {t(STATUS_LABEL[o.status])}
                  </Chip>
                  <Link
                    href={o.href}
                    className="text-sm text-black/70 underline-offset-2 hover:underline"
                  >
                    {t("Open the item")}
                  </Link>
                  {ACTIVE(o) && editable && (
                    <Button variant="ghost" onClick={() => void dismiss(o)}>
                      {t("Dismiss")}
                    </Button>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {/* The printed report: every card of the year, grouped by installation, open cards first. Hidden on screen. */}
      <section
        className="hidden print:block"
        aria-label={t("Opportunities summary")}
      >
        <h2 className="text-lg">{t("Opportunities")}</h2>
        {profile.companyName && (
          <p>
            {t("Opportunities report for {company}", {
              company: profile.companyName,
            })}
          </p>
        )}
        <p>{t("Printed on {date}", { date: today })}</p>
        <p>
          {t("Open items worth at least {eur} EUR and {t} tCO₂e", {
            eur: formatNumber(totals.impactEur, 0),
            t: formatNumber(totals.impactT, 2),
          })}
        </p>
        {printGroups.map((g) => (
          <div key={g.id} className="mt-4">
            <h3 className="text-base">{g.name}</h3>
            <table className="mt-1 w-full border-collapse text-left text-sm">
              <thead>
                <tr>
                  <th scope="col" className="border-b py-1">
                    {t("Open item")}
                  </th>
                  <th scope="col" className="border-b py-1">
                    {t("Assignee")}
                  </th>
                  <th scope="col" className="border-b py-1">
                    {t("Status")}
                  </th>
                  <th scope="col" className="border-b py-1">
                    {t("Impact (EUR)")}
                  </th>
                  <th scope="col" className="border-b py-1">
                    {t("Impact (tCO₂e)")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {g.items.map((o) => (
                  <tr key={o.id}>
                    <td className="border-b py-1">{cardText(t, o)}</td>
                    <td className="border-b py-1">
                      {o.assignee ? memberName(o.assignee) : t("Unassigned")}
                    </td>
                    <td className="border-b py-1">
                      {t(STATUS_LABEL[o.status])}
                    </td>
                    <td className="border-b py-1">
                      {o.impactEur === null
                        ? "—"
                        : formatNumber(o.impactEur, 0)}
                    </td>
                    <td className="border-b py-1">
                      {o.impactT === null ? "—" : formatNumber(o.impactT, 2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {cards.length === 0 && <p>{t("No open items")}</p>}
      </section>
    </div>
  );
}
