/* ════════════════════════════════════════════════════════════
   THE COMPANY'S STANDING — read the way the Verification page is organised

   Company → site (installation) → reporting year → product reports. The Dashboard
   used to count "workspaces"; this counts what the Verification page lists, and
   reads the same rules the Readiness tab and the Reports page read (`packageStatus`),
   so the three can never disagree about whether a package is ready.

   Only the company's own sites are here. A supplier's site is the supplier's
   report to make; it shows up under Smart Links, not as the company's own status.
   ════════════════════════════════════════════════════════════ */

import { getInstallation, type Installation } from "../installations";
import { monthCounts, monthsForWorkspace } from "../monthly-data";
import { listWorkspaces, type VerificationWorkspace } from "../workspace";
import { packageStatus } from "./package-status";

export type SiteYear = {
  year: number;
  reports: number;
  /** mean readiness of the year's product reports, 0–100 */
  percent: number;
  /** product reports whose every part is complete */
  complete: number;
  blocked: number;
  /** months submitted, of the months the year's reports carry */
  monthsIn: number;
  monthsOf: number;
  /** the year's package can be downloaded */
  packageReady: boolean;
  /** what is holding the package: product reports, installation facts, reports with items to do */
  holding: number;
};

export type Site = {
  id: string;
  name: string;
  installation: Installation | null;
  years: SiteYear[];
};

export type CompanyStatus = {
  sites: Site[];
  reports: number;
  percent: number;
  packagesReady: number;
  packagesTotal: number;
  monthsIn: number;
  monthsOf: number;
  blocked: number;
};

export function companyStatus(
  workspaces: VerificationWorkspace[] = listWorkspaces(),
): CompanyStatus {
  const own = workspaces.filter((w) => w.selfSupplied);
  const byId = new Map<string, VerificationWorkspace[]>();
  for (const w of own)
    byId.set(w.installationId, [...(byId.get(w.installationId) ?? []), w]);

  const sites: Site[] = [...byId.entries()]
    .map(([id, list]) => {
      const installation = getInstallation(id);
      const years = [...new Set(list.map((w) => w.year))]
        .sort((a, b) => b - a)
        .map((year): SiteYear => {
          const status = packageStatus({
            installation,
            workspaces: list,
            year,
          });
          const ofYear = list.filter((w) => w.year === year);
          const months = ofYear.flatMap((w) => monthsForWorkspace(w));
          return {
            year,
            reports: status.reports.length,
            percent: status.percent,
            complete: status.reports.filter((x) => x.r.overall === "complete")
              .length,
            blocked: status.reports.filter((x) => x.r.overall === "blocked")
              .length,
            monthsIn: months.filter(monthCounts).length,
            monthsOf: months.length,
            packageReady: status.packageReady,
            holding: status.holding.length,
          };
        });
      return {
        id,
        name: installation?.name || list[0].installationName || id,
        installation,
        years,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const all = sites.flatMap((s) => s.years);
  const reports = all.reduce((a, y) => a + y.reports, 0);
  return {
    sites,
    reports,
    percent:
      reports === 0
        ? 0
        : Math.round(
            all.reduce((a, y) => a + y.percent * y.reports, 0) / reports,
          ),
    packagesReady: all.filter((y) => y.packageReady).length,
    packagesTotal: all.length,
    monthsIn: all.reduce((a, y) => a + y.monthsIn, 0),
    monthsOf: all.reduce((a, y) => a + y.monthsOf, 0),
    blocked: all.reduce((a, y) => a + y.blocked, 0),
  };
}
