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
import { Button, Card, Chip, EmptyState, PageHeader, inputClass, type Tone } from "@/components/ui";
import { ErrorState, LoadingState } from "@/components/query-state";
import { useT, type TFunction } from "@/lib/i18n";
import { useTeam } from "@/lib/team-query";
import { useStoreSync } from "@/lib/use-store-sync";
import { currentYear, yearRange } from "@/lib/year-range";
import { getInstallation, listInstallations } from "@/lib/installations";
import { collectOpportunities } from "@/lib/factory/opportunity-collect";
import { summarize, type Opportunity, type OpportunityStatus } from "@/lib/factory/opportunities";
import { updateOpportunity } from "@/lib/factory/opportunity-store";

const STATUSES: OpportunityStatus[] = ["open", "in-progress", "done", "dismissed"];
const STATUS_LABEL: Record<OpportunityStatus, string> = {
  open: "Open",
  "in-progress": "In progress",
  done: "Done",
  dismissed: "Dismissed",
};
const STATUS_TONE: Record<OpportunityStatus, Tone> = { open: "warn", "in-progress": "info", done: "ok", dismissed: "muted" };
const ACTIVE = (o: Opportunity) => o.status === "open" || o.status === "in-progress";

/* The cards hold English text from the derivation; the known templates are translated with their values. */
function localised(t: TFunction, text: string): string {
  const sheet = /^Fill in the (.+) sheet$/.exec(text);
  if (sheet) return t("Fill in the {name} sheet", { name: sheet[1]! });
  const precursor = /^Get actual emissions for (.+) \(CN (.+)\)$/.exec(text);
  if (precursor) return t("Get actual emissions for {item} (CN {cn})", { item: precursor[1]!, cn: precursor[2]! });
  return t(text);
}

const formatNumber = (n: number, digits: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });

export default function OpportunitiesPage() {
  const t = useT();
  const qc = useQueryClient();
  const team = useTeam();
  const [year, setYear] = React.useState(currentYear());
  const [installation, setInstallation] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [source, setSource] = React.useState("");
  const [assignee, setAssignee] = React.useState("");
  const [search, setSearch] = React.useState("");

  const ids = listInstallations().map((i) => i.id).join(",");
  const { data, isError, refetch } = useQuery({
    queryKey: ["opportunities", year, ids],
    queryFn: () => collectOpportunities(year),
    staleTime: 0,
    refetchOnMount: "always",
  });
  useStoreSync(() => void refetch());

  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!data) return <LoadingState />;

  const list = data.filter(
    (o) =>
      (!installation || o.installationId === installation) &&
      (!status || o.status === status) &&
      (!source || o.source === source) &&
      (!assignee || (assignee === "none" ? o.assignee === "" : o.assignee === assignee)) &&
      (!search.trim() || localised(t, o.title).toLowerCase().includes(search.trim().toLowerCase())),
  );
  const totals = summarize(data);
  const installationName = (id: string) => getInstallation(id)?.name || id;
  const members = team.data ?? [];
  const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? id;

  const change = async (o: Opportunity, patch: Partial<Pick<Opportunity, "assignee" | "status" | "due">>) => {
    await updateOpportunity(o.id, patch);
    await qc.invalidateQueries({ queryKey: ["opportunities"] });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={t("Opportunities")}
        title={t("Opportunities")}
        lead={t("Find the gaps and savings to close, assign them, and print a report.")}
      />

      <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
        <label className="flex items-center gap-2 text-sm text-black/60">
          <span>{t("Reporting year")}</span>
          <select className={inputClass} value={year} onChange={(e) => setYear(Number(e.target.value))}>
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

      <section aria-label={t("Opportunities summary")} className="grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-black/55">{t("Open cards")}</p>
          <p className="text-2xl font-light">{totals.open + totals.inProgress}</p>
          <p className="text-xs text-black/50">
            {t("Open")} {totals.open} · {t("In progress")} {totals.inProgress} · {t("Done")} {totals.done}
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

      <div className="grid gap-2 sm:grid-cols-5 print:hidden" role="group" aria-label={t("Filter")}>
        <label className="sr-only" htmlFor="opp-installation">{t("Filter by installation")}</label>
        <select id="opp-installation" className={inputClass} value={installation} onChange={(e) => setInstallation(e.target.value)}>
          <option value="">{t("Installation")}: {t("All")}</option>
          {listInstallations().map((i) => (
            <option key={i.id} value={i.id}>{i.name || i.id}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="opp-status">{t("Filter by status")}</label>
        <select id="opp-status" className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{t("Status")}: {t("All")}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{t(STATUS_LABEL[s])}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="opp-source">{t("Filter by source")}</label>
        <select id="opp-source" className={inputClass} value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">{t("Source")}: {t("All")}</option>
          <option value="data-gap">{t("Data gap")}</option>
          <option value="what-if">{t("What-if")}</option>
        </select>
        <label className="sr-only" htmlFor="opp-assignee">{t("Filter by assignee")}</label>
        <select id="opp-assignee" className={inputClass} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
          <option value="">{t("Assignee")}: {t("All")}</option>
          <option value="none">{t("Unassigned")}</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="opp-search">{t("Search")}</label>
        <input id="opp-search" className={inputClass} type="search" placeholder={t("Search")} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<Lightbulb size={28} strokeWidth={1.25} />}
          title={t("Nothing to close yet")}
          body={t("Gaps and saved scenarios appear here as you fill in the workspace.")}
        />
      ) : (
        <ul className="space-y-2 print:hidden" aria-label={t("Opportunities")}>
          {list.map((o) => (
            <li key={o.id}>
              <Card className="space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium text-black/80">{localised(t, o.title)}</p>
                    <p className="text-xs text-black/50">
                      {installationName(o.installationId)} · {t(o.source === "data-gap" ? "Data gap" : "What-if")}
                    </p>
                    {o.detail && <p className="text-xs text-black/50">{t(o.detail)}</p>}
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-black/80">
                      {o.impactEur === null ? "—" : `${formatNumber(o.impactEur, 0)} EUR`}
                    </p>
                    <p className="text-xs text-black/50">
                      {o.impactT === null ? "" : `${formatNumber(o.impactT, 2)} tCO₂e`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <label className="text-xs text-black/60">
                    <span className="block">{t("Assignee")}</span>
                    <select className={inputClass} value={o.assignee} onChange={(e) => void change(o, { assignee: e.target.value })}>
                      <option value="">{t("Unassigned")}</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                      {o.assignee && !members.some((m) => m.id === o.assignee) && (
                        <option value={o.assignee}>{memberName(o.assignee)}</option>
                      )}
                    </select>
                  </label>
                  <label className="text-xs text-black/60">
                    <span className="block">{t("Status")}</span>
                    <select className={inputClass} value={o.status} onChange={(e) => void change(o, { status: e.target.value as OpportunityStatus })}>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{t(STATUS_LABEL[s])}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs text-black/60">
                    <span className="block">{t("Due date")}</span>
                    <input type="date" className={inputClass} value={o.due} onChange={(e) => void change(o, { due: e.target.value })} />
                  </label>
                  <Chip tone={STATUS_TONE[o.status]}>{t(STATUS_LABEL[o.status])}</Chip>
                  <Link href={o.href} className="text-sm text-black/70 underline-offset-2 hover:underline">
                    {t("Open the item")}
                  </Link>
                  {ACTIVE(o) && (
                    <Button variant="ghost" onClick={() => void change(o, { status: "dismissed" })}>
                      {t("Dismiss")}
                    </Button>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {/* The printed report: the same cards, without the controls. Hidden on screen. */}
      <section className="hidden print:block" aria-label={t("Opportunities summary")}>
        <h2 className="text-lg">{t("Opportunities")}</h2>
        <p>
          {t("Open items worth at least {eur} EUR and {t} tCO₂e", {
            eur: formatNumber(totals.impactEur, 0),
            t: formatNumber(totals.impactT, 2),
          })}
        </p>
        <table className="mt-2 w-full border-collapse text-left text-sm">
          <thead>
            <tr>
              <th className="border-b py-1">{t("Open item")}</th>
              <th className="border-b py-1">{t("Installation")}</th>
              <th className="border-b py-1">{t("Assignee")}</th>
              <th className="border-b py-1">{t("Status")}</th>
              <th className="border-b py-1">{t("Impact (EUR)")}</th>
              <th className="border-b py-1">{t("Impact (tCO₂e)")}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((o) => (
              <tr key={o.id}>
                <td className="border-b py-1">{localised(t, o.title)}</td>
                <td className="border-b py-1">{installationName(o.installationId)}</td>
                <td className="border-b py-1">{o.assignee ? memberName(o.assignee) : t("Unassigned")}</td>
                <td className="border-b py-1">{t(STATUS_LABEL[o.status])}</td>
                <td className="border-b py-1">{o.impactEur === null ? "—" : formatNumber(o.impactEur, 0)}</td>
                <td className="border-b py-1">{o.impactT === null ? "—" : formatNumber(o.impactT, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && <p>{t("No open items")}</p>}
      </section>
    </div>
  );
}
