/* ════════════════════════════════════════════════════════════
   THE DASHBOARD — WHAT IT READS

   One screen that has to answer, in the order somebody opening the portal at
   nine asks them:

     where do I stand      months in, packages ready, days to the declaration
     what does it mean     emissions against the EU default, what the
                           certificates cost with my data and without
     who am I relying on   the health of the supply chain
     what must I do        what is late or about to be, and the few dates that
                           matter
     what just happened    the last things that changed

   Everything is read from the same places the tabs underneath read, through the
   same functions — nothing is recomputed here — so the Dashboard can never say
   something the tab it links to does not. The sample is a made-up estate in the
   same shape, never written anywhere.
   ════════════════════════════════════════════════════════════ */

import { actionQueueFor, type ActionItem } from "./action-queue";
import { activityFeedFor, type ActivityEvent } from "./activity-feed";
import { companyStatus, type CompanyStatus, type Site } from "./company-status";
import { costEnv, costFactsFor } from "./carbon-cost-read";
import { priceFacts, type CostEnv, type PricedRow } from "./carbon-cost-model";
import { sampleCostFacts } from "./carbon-cost-sample";
import { daysToNextDeclarationDeadline, nextDeclarationDeadline } from "./dashboard-aggregates";
import { plantHealth, precursorHealth, summarise, type ChainSummary } from "./supply-chain-model";
import { readPlants, readPrecursors } from "./supply-chain-read";
import { samplePlants, samplePrecursors } from "./supply-chain-sample";
import { workspaceReadiness, READINESS_TABS, type ReadinessTab } from "../readiness";
import { buildSmartLinks, countByState } from "../smart-links";
import { listWorkspaces } from "../workspace";

export type TabTally = { tab: ReadinessTab; complete: number; todo: number; blocked: number; notStarted: number; total: number };

export type DashboardData = {
  now: Date;
  daysToDeadline: number;
  deadline: Date;
  carbon: { rows: PricedRow[]; env: CostEnv };
  chain: ChainSummary;
  company: CompanyStatus;
  tabs: TabTally[];
  actions: ActionItem[];
  activity: ActivityEvent[];
  /** asks outstanding with suppliers */
  asks: { toSend: number; waiting: number; late: number; answered: number };
  /** whether the account has anything of its own in it */
  hasFigures: boolean;
  /** where each party in the chain is worked on, by the id its concerns carry — a plant's months, a precursor's page. Empty on the sample, which leads nowhere. */
  concernLinks: Record<string, string>;
};

/* ── The dates that matter ───────────────────────────────────────
   From Regulation (EU) 2023/956 as amended by 2025/2083. They are the importer's
   dates, and they are the exporter's too: a buyer who must hold certificates
   and declare will ask for verified figures before them. Fixed text, stated
   once, with who each date binds. */
export type KeyDate = { date: string; key: string; who: "you" | "buyers" | "both" };

export function keyDates(now: Date): KeyDate[] {
  const y = now.getFullYear();
  const all: KeyDate[] = [
    { date: `${y}-12-31`, key: "Reporting year {year} ends: every month and supplier figure should be in", who: "you" },
    { date: "2027-01-01", key: "Buyers start holding certificates each quarter", who: "buyers" },
    { date: "2027-02-01", key: "Certificate sales open", who: "buyers" },
    { date: "2027-09-30", key: "First CBAM declaration, and certificates surrendered, for 2026", who: "both" },
    { date: "2027-10-31", key: "Last day to ask for surplus certificates to be repurchased", who: "buyers" },
    { date: "2027-11-01", key: "Unused 2026 certificates are cancelled", who: "buyers" },
  ];
  return all.filter((d) => new Date(`${d.date}T23:59:59`) >= now).sort((a, b) => a.date.localeCompare(b.date));
}

function tallies(workspaces: ReturnType<typeof listWorkspaces>): TabTally[] {
  const out = new Map<ReadinessTab, TabTally>(READINESS_TABS.map((tab) => [tab, { tab, complete: 0, todo: 0, blocked: 0, notStarted: 0, total: 0 }]));
  for (const w of workspaces) {
    for (const r of workspaceReadiness(w).tabs) {
      if (r.state === "not_applicable") continue;
      const t = out.get(r.tab)!;
      t.total += 1;
      if (r.state === "complete") t.complete += 1;
      else if (r.state === "blocked") t.blocked += 1;
      else if (r.state === "not_started") t.notStarted += 1;
      else t.todo += 1;
    }
  }
  return [...out.values()].filter((t) => t.total > 0);
}

export function readDashboard(now: Date = new Date()): DashboardData {
  const workspaces = listWorkspaces();
  const env = costEnv();
  const rows = workspaces.map((w) => priceFacts(costFactsFor(w), env, false));
  const links = buildSmartLinks(now);
  const plants = readPlants(workspaces, links).map(plantHealth);
  const precursors = readPrecursors(workspaces).map((f) => precursorHealth(f, now));
  const by = countByState(links);
  const concernLinks: Record<string, string> = {};
  for (const p of plants) if (p.facts.reportIds[0]) concernLinks[p.facts.id] = `/workspaces/${p.facts.reportIds[0]}/monthly`;
  for (const p of precursors) concernLinks[p.facts.id] = `/workspaces/${p.facts.workspaceId}/precursors`;
  return {
    now,
    daysToDeadline: daysToNextDeclarationDeadline(now),
    deadline: nextDeclarationDeadline(now),
    carbon: { rows, env },
    chain: summarise(plants, precursors),
    company: companyStatus(workspaces),
    tabs: tallies(workspaces),
    actions: actionQueueFor(workspaces),
    activity: activityFeedFor(workspaces, 8),
    asks: { toSend: by.send_now, waiting: by.in_process, late: by.late, answered: by.done },
    hasFigures: rows.some((r) => r.facts.tonnes > 0),
    concernLinks,
  };
}

/* ── A made-up estate ────────────────────────────────────────── */
const ago = (now: Date, days: number, hours = 0) => new Date(now.getTime() - days * 86_400_000 - hours * 3_600_000).toISOString();

export function sampleDashboard(now: Date = new Date()): DashboardData {
  const env = costEnv();
  const rows = sampleCostFacts().map((f) => priceFacts(f, env, false));
  const plants = samplePlants().map(plantHealth);
  const precursors = samplePrecursors(now).map((f) => precursorHealth(f, now));

  const site = (id: string, name: string, years: Site["years"]): Site => ({ id, name, installation: null, years });
  const sites: Site[] = [
    site("TH-RAYONG-01", "Rayong Steel Works", [{ year: 2026, reports: 2, percent: 78, complete: 0, blocked: 0, monthsIn: 18, monthsOf: 24, packageReady: false, holding: 2 }]),
    site("TH-CHONBURI-01", "Chonburi Rolling Mill", [
      { year: 2026, reports: 2, percent: 64, complete: 0, blocked: 1, monthsIn: 17, monthsOf: 24, packageReady: false, holding: 3 },
      { year: 2025, reports: 1, percent: 100, complete: 1, blocked: 0, monthsIn: 12, monthsOf: 12, packageReady: true, holding: 0 },
    ]),
    site("TH-SAMUTPRAKAN-01", "Samut Prakan Aluminium", [{ year: 2026, reports: 1, percent: 52, complete: 0, blocked: 0, monthsIn: 8, monthsOf: 12, packageReady: false, holding: 2 }]),
  ];
  const all = sites.flatMap((s) => s.years);
  const reports = all.reduce((a, y) => a + y.reports, 0);
  const company: CompanyStatus = {
    sites,
    reports,
    percent: Math.round(all.reduce((a, y) => a + y.percent * y.reports, 0) / reports),
    packagesReady: all.filter((y) => y.packageReady).length,
    packagesTotal: all.length,
    monthsIn: all.reduce((a, y) => a + y.monthsIn, 0),
    monthsOf: all.reduce((a, y) => a + y.monthsOf, 0),
    blocked: all.reduce((a, y) => a + y.blocked, 0),
  };

  const tabs: TabTally[] = [
    { tab: "mmd", complete: 2, todo: 3, blocked: 0, notStarted: 0, total: 5 },
    { tab: "monthly", complete: 1, todo: 4, blocked: 0, notStarted: 0, total: 5 },
    { tab: "precursors", complete: 2, todo: 1, blocked: 2, notStarted: 0, total: 5 },
    { tab: "evidence", complete: 3, todo: 2, blocked: 0, notStarted: 0, total: 5 },
    { tab: "carbon_price", complete: 4, todo: 0, blocked: 1, notStarted: 0, total: 5 },
    { tab: "materiality", complete: 5, todo: 0, blocked: 0, notStarted: 0, total: 5 },
  ];

  const mk = (type: ActionItem["type"], days: number, label: string, ws: string, deepLink = "/workspaces"): ActionItem => ({ type, daysUntilDue: days, label, workspaceId: ws, workspaceLabel: ws, deepLink });
  const actions: ActionItem[] = [
    { ...mk("monthly_data", -34, "August 2026 data", "Hot-rolled coil", "/workspaces/sample/monthly/2026-08"), say: { key: "{month} data", vars: { month: "August 2026" } } },
    { ...mk("monthly_data", -12, "September 2026 data", "Aluminium sheet", "/workspaces/sample/monthly/2026-09"), say: { key: "{month} data", vars: { month: "September 2026" } } },
    { ...mk("precursor_invite", -9, "Korat Alloy Powders — no response", "Reinforcing bar"), say: { key: "{name} — no response", vars: { name: "Korat Alloy Powders" } } },
    mk("mmd_draft", 6, "Monitoring plan — draft not finalised", "Steel billet"),
    { ...mk("document_unbound", 11, "Meter calibration certificate — uploaded, needs binding", "Galvanised sheet"), say: { key: "{label} — uploaded, needs binding", vars: { label: "Meter calibration certificate" } } },
  ];

  const ev = (kind: ActivityEvent["kind"], at: string, label: string, ws: string, say?: ActivityEvent["say"]): ActivityEvent => ({ kind, at, label, say, workspaceId: ws, workspaceLabel: ws, deepLink: "/workspaces" });
  const activity: ActivityEvent[] = [
    ev("supplier_submitted", ago(now, 0, 3), "Siam DRI Co. submitted their data", "Hot-rolled coil", { key: "{name} submitted their data", vars: { name: "Siam DRI Co." } }),
    ev("month_submitted", ago(now, 1, 5), "September 2026 submitted by Somchai Prasert", "Aluminium sheet", { key: "{month} submitted by {who}", vars: { month: "2026-09", who: "Somchai Prasert" } }),
    ev("document_uploaded", ago(now, 2), "Electricity-bill-sep.pdf uploaded by Wipada Rattana", "Steel billet", { key: "{file} uploaded by {who}", vars: { file: "Electricity-bill-sep.pdf", who: "Wipada Rattana" } }),
    ev("mmd_finalised", ago(now, 6), "Monitoring plan v2 finalised by Kanya S.", "Reinforcing bar", { key: "Monitoring plan v{n} finalised by {who}", vars: { n: 2, who: "Kanya S." } }),
    ev("month_submitted", ago(now, 9), "August 2026 submitted by Nattaya Wong", "Ferro-manganese", { key: "{month} submitted by {who}", vars: { month: "2026-08", who: "Nattaya Wong" } }),
  ];

  return {
    now,
    daysToDeadline: daysToNextDeclarationDeadline(now),
    deadline: nextDeclarationDeadline(now),
    carbon: { rows, env },
    chain: summarise(plants, precursors),
    company,
    tabs,
    actions,
    activity,
    asks: { toSend: 12, waiting: 4, late: 8, answered: 60 },
    hasFigures: true,
    concernLinks: {},
  };
}
