import type { ActionItem } from "../../action-queue";
import type { ActivityEvent } from "../../activity-feed";
import type { CompanyStatus, Site } from "../../company-status";
import { costEnv } from "../../carbon-cost-read";
import { priceFacts } from "../../carbon-cost-model";
import {
  daysToNextDeclarationDeadline,
  nextDeclarationDeadline,
} from "../../dashboard-aggregates";
import {
  plantHealth,
  precursorHealth,
  summarise,
} from "../../supply-chain-model";
import type { DashboardData, TabTally } from "../../dashboard-data";
import { sampleCostFacts } from "./carbon-cost-sample";
import { samplePlants, samplePrecursors } from "./supply-chain-sample";

/* ── A made-up estate ────────────────────────────────────────── */
const ago = (now: Date, days: number, hours = 0) =>
  new Date(now.getTime() - days * 86_400_000 - hours * 3_600_000).toISOString();

export function sampleDashboard(now: Date = new Date()): DashboardData {
  const env = costEnv();
  const rows = sampleCostFacts().map((f) => priceFacts(f, env, false));
  const plants = samplePlants().map(plantHealth);
  const precursors = samplePrecursors(now).map((f) => precursorHealth(f, now));

  const site = (id: string, name: string, years: Site["years"]): Site => ({
    id,
    name,
    installation: null,
    years,
  });
  const sites: Site[] = [
    site("TH-RAYONG-01", "Rayong Steel Works", [
      {
        year: 2026,
        reports: 2,
        percent: 78,
        complete: 0,
        blocked: 0,
        monthsIn: 18,
        monthsOf: 24,
        packageReady: false,
        holding: 2,
      },
    ]),
    site("TH-CHONBURI-01", "Chonburi Rolling Mill", [
      {
        year: 2026,
        reports: 2,
        percent: 64,
        complete: 0,
        blocked: 1,
        monthsIn: 17,
        monthsOf: 24,
        packageReady: false,
        holding: 3,
      },
      {
        year: 2025,
        reports: 1,
        percent: 100,
        complete: 1,
        blocked: 0,
        monthsIn: 12,
        monthsOf: 12,
        packageReady: true,
        holding: 0,
      },
    ]),
    site("TH-SAMUTPRAKAN-01", "Samut Prakan Aluminium", [
      {
        year: 2026,
        reports: 1,
        percent: 52,
        complete: 0,
        blocked: 0,
        monthsIn: 8,
        monthsOf: 12,
        packageReady: false,
        holding: 2,
      },
    ]),
  ];
  const all = sites.flatMap((s) => s.years);
  const reports = all.reduce((a, y) => a + y.reports, 0);
  const company: CompanyStatus = {
    sites,
    reports,
    percent: Math.round(
      all.reduce((a, y) => a + y.percent * y.reports, 0) / reports,
    ),
    packagesReady: all.filter((y) => y.packageReady).length,
    packagesTotal: all.length,
    monthsIn: all.reduce((a, y) => a + y.monthsIn, 0),
    monthsOf: all.reduce((a, y) => a + y.monthsOf, 0),
    blocked: all.reduce((a, y) => a + y.blocked, 0),
  };

  const tabs: TabTally[] = [
    { tab: "mmd", complete: 2, todo: 3, blocked: 0, notStarted: 0, total: 5 },
    {
      tab: "monthly",
      complete: 1,
      todo: 4,
      blocked: 0,
      notStarted: 0,
      total: 5,
    },
    {
      tab: "precursors",
      complete: 2,
      todo: 1,
      blocked: 2,
      notStarted: 0,
      total: 5,
    },
    {
      tab: "evidence",
      complete: 3,
      todo: 2,
      blocked: 0,
      notStarted: 0,
      total: 5,
    },
    {
      tab: "carbon_price",
      complete: 4,
      todo: 0,
      blocked: 1,
      notStarted: 0,
      total: 5,
    },
    {
      tab: "materiality",
      complete: 5,
      todo: 0,
      blocked: 0,
      notStarted: 0,
      total: 5,
    },
  ];

  const mk = (
    type: ActionItem["type"],
    days: number,
    label: string,
    ws: string,
    deepLink = "/workspaces",
  ): ActionItem => ({
    type,
    daysUntilDue: days,
    label,
    workspaceId: ws,
    workspaceLabel: ws,
    deepLink,
  });
  const actions: ActionItem[] = [
    {
      ...mk(
        "monthly_data",
        -34,
        "August 2026 data",
        "Hot-rolled coil",
        "/workspaces/sample/monthly/2026-08",
      ),
      say: { key: "{month} data", vars: { month: "August 2026" } },
    },
    {
      ...mk(
        "monthly_data",
        -12,
        "September 2026 data",
        "Aluminium sheet",
        "/workspaces/sample/monthly/2026-09",
      ),
      say: { key: "{month} data", vars: { month: "September 2026" } },
    },
    {
      ...mk(
        "precursor_invite",
        -9,
        "Korat Alloy Powders — no response",
        "Reinforcing bar",
      ),
      say: {
        key: "{name} — no response",
        vars: { name: "Korat Alloy Powders" },
      },
    },
    mk("mmd_draft", 6, "Monitoring plan — draft not finalised", "Steel billet"),
    {
      ...mk(
        "document_unbound",
        11,
        "Meter calibration certificate — uploaded, needs binding",
        "Galvanised sheet",
      ),
      say: {
        key: "{label} — uploaded, needs binding",
        vars: { label: "Meter calibration certificate" },
      },
    },
  ];

  const ev = (
    kind: ActivityEvent["kind"],
    at: string,
    label: string,
    ws: string,
    say?: ActivityEvent["say"],
  ): ActivityEvent => ({
    kind,
    at,
    label,
    say,
    workspaceId: ws,
    workspaceLabel: ws,
    deepLink: "/workspaces",
  });
  const activity: ActivityEvent[] = [
    ev(
      "supplier_submitted",
      ago(now, 0, 3),
      "Siam DRI Co. submitted their data",
      "Hot-rolled coil",
      { key: "{name} submitted their data", vars: { name: "Siam DRI Co." } },
    ),
    ev(
      "month_submitted",
      ago(now, 1, 5),
      "September 2026 submitted by Somchai Prasert",
      "Aluminium sheet",
      {
        key: "{month} submitted by {who}",
        vars: { month: "2026-09", who: "Somchai Prasert" },
      },
    ),
    ev(
      "document_uploaded",
      ago(now, 2),
      "Electricity-bill-sep.pdf uploaded by Wipada Rattana",
      "Steel billet",
      {
        key: "{file} uploaded by {who}",
        vars: { file: "Electricity-bill-sep.pdf", who: "Wipada Rattana" },
      },
    ),
    ev(
      "mmd_finalised",
      ago(now, 6),
      "Monitoring plan v2 finalised by Kanya S.",
      "Reinforcing bar",
      {
        key: "Monitoring plan v{n} finalised by {who}",
        vars: { n: 2, who: "Kanya S." },
      },
    ),
    ev(
      "month_submitted",
      ago(now, 9),
      "August 2026 submitted by Nattaya Wong",
      "Ferro-manganese",
      {
        key: "{month} submitted by {who}",
        vars: { month: "2026-08", who: "Nattaya Wong" },
      },
    ),
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
