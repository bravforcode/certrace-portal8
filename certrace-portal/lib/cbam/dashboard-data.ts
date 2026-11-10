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
   something the tab it links to does not.
   ════════════════════════════════════════════════════════════ */

import { actionQueueFor, type ActionItem } from "./action-queue";
import { activityFeedFor, type ActivityEvent } from "./activity-feed";
import { companyStatus, type CompanyStatus } from "./company-status";
import { costEnv, costFactsFor } from "./carbon-cost-read";
import { priceFacts, type CostEnv, type PricedRow } from "./carbon-cost-model";
import {
  daysToNextDeclarationDeadline,
  nextDeclarationDeadline,
} from "./dashboard-aggregates";
import {
  plantHealth,
  precursorHealth,
  summarise,
  type ChainSummary,
} from "./supply-chain-model";
import { readPlants, readPrecursors } from "./supply-chain-read";
import {
  workspaceReadiness,
  READINESS_TABS,
  type ReadinessTab,
} from "../readiness";
import { buildSmartLinks, countByState } from "../smart-links";
import { listWorkspaces } from "../workspace";

export type TabTally = {
  tab: ReadinessTab;
  complete: number;
  todo: number;
  blocked: number;
  notStarted: number;
  total: number;
};

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
  /** where each party in the chain is worked on, by the id its concerns carry — a plant's months, a precursor's page. Derived from the account records. */
  concernLinks: Record<string, string>;
};

/* ── The dates that matter ───────────────────────────────────────
   From Regulation (EU) 2023/956 as amended by 2025/2083. They are the importer's
   dates, and they are the exporter's too: a buyer who must hold certificates
   and declare will ask for verified figures before them. Fixed text, stated
   once, with who each date binds. */
export type KeyDate = {
  date: string;
  key: string;
  who: "you" | "buyers" | "both";
};

export function keyDates(now: Date): KeyDate[] {
  const y = now.getFullYear();
  const all: KeyDate[] = [
    {
      date: `${y}-12-31`,
      key: "Reporting year {year} ends: every month and supplier figure should be in",
      who: "you",
    },
    {
      date: "2027-01-01",
      key: "Buyers start holding certificates each quarter",
      who: "buyers",
    },
    { date: "2027-02-01", key: "Certificate sales open", who: "buyers" },
    {
      date: "2027-09-30",
      key: "First CBAM declaration, and certificates surrendered, for 2026",
      who: "both",
    },
    {
      date: "2027-10-31",
      key: "Last day to ask for surplus certificates to be repurchased",
      who: "buyers",
    },
    {
      date: "2027-11-01",
      key: "Unused 2026 certificates are cancelled",
      who: "buyers",
    },
  ];
  return all
    .filter((d) => new Date(`${d.date}T23:59:59`) >= now)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function tallies(workspaces: ReturnType<typeof listWorkspaces>): TabTally[] {
  const out = new Map<ReadinessTab, TabTally>(
    READINESS_TABS.map((tab) => [
      tab,
      { tab, complete: 0, todo: 0, blocked: 0, notStarted: 0, total: 0 },
    ]),
  );
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
  const precursors = readPrecursors(workspaces).map((f) =>
    precursorHealth(f, now),
  );
  const by = countByState(links);
  const concernLinks: Record<string, string> = {};
  for (const p of plants)
    if (p.facts.reportIds[0])
      concernLinks[p.facts.id] = `/workspaces/${p.facts.reportIds[0]}/monthly`;
  for (const p of precursors)
    concernLinks[p.facts.id] = `/workspaces/${p.facts.workspaceId}/precursors`;
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
    asks: {
      toSend: by.send_now,
      waiting: by.in_process,
      late: by.late,
      answered: by.done,
    },
    hasFigures: rows.some((r) => r.facts.tonnes > 0),
    concernLinks,
  };
}
