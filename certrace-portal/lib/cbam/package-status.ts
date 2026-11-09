/* Is the report package for this installation and year ready to leave?

   ONE RULE, READ BY BOTH SCREENS that offer the package — the installation's
   Readiness tab and the Reports page — so they can never disagree about whether
   the button is live. The package is every report of the set in one zip, and it
   is offered only when ALL of it is in:

     · the installation's own one-time information (Annex IV items 1–6),
     · every product report of the year, and
     · every report's own items.

   Until then `holding` says, in structure the screen words for itself, what is
   still in the way. */

import type { Installation } from "../installations";
import type { useT } from "../i18n";
import type { VerificationWorkspace } from "../workspace";
import { workspaceReadiness } from "../readiness";
import { workspaceSEE } from "../workspace-see";
import { listEvidence } from "../workspace-evidence";
import { packFingerprint } from "../pack-signoff";
import { profileStatus, type ProfileStatus } from "./installation-profile";
import { buildReportSet, type ReportSet } from "./report-set";

export type PackageHold =
  | { kind: "product_reports"; unfinished: number; total: number }
  | { kind: "installation_info"; items: number }
  | { kind: "report"; title: string; items: number };

export type PackageStatus = {
  year: number;
  /** the year's product reports at this installation, each with its readiness */
  reports: { w: VerificationWorkspace; r: ReturnType<typeof workspaceReadiness> }[];
  /** the average of the product reports' readiness */
  percent: number;
  reportsComplete: boolean;
  profile: ProfileStatus;
  set: ReportSet;
  /** installation information and every product report complete */
  ready: boolean;
  /** …and every report in the set complete: the package button is live */
  packageReady: boolean;
  holding: PackageHold[];
  /** where the internal sign-off for this installation and year is kept */
  signKey: string;
  /** moves when a figure behind the reports moves, which lapses the sign-off */
  fingerprint: string;
};

export function packageStatus(args: { installation: Installation | null; workspaces: VerificationWorkspace[]; year: number }): PackageStatus {
  const { installation, year } = args;
  const ofYear = args.workspaces.filter((w) => w.year === year);
  const reports = ofYear.map((w) => ({ w, r: workspaceReadiness(w) }));
  const percent = reports.length ? Math.round(reports.reduce((a, x) => a + x.r.percentComplete, 0) / reports.length) : 0;
  const reportsComplete = reports.length > 0 && reports.every((x) => x.r.overall === "complete");
  const profile = profileStatus(installation);
  const set = buildReportSet({ installation, workspaces: args.workspaces, year });
  const ready = reportsComplete && profile.complete;
  const packageReady = ready && set.complete;

  const holding: PackageHold[] = [];
  const unfinished = reports.filter((x) => x.r.overall !== "complete").length;
  if (unfinished > 0) holding.push({ kind: "product_reports", unfinished, total: reports.length });
  if (!profile.complete) holding.push({ kind: "installation_info", items: profile.gaps.length });
  for (const r of set.reports) {
    const items = r.tally.missing + r.tally.partial;
    if (!r.complete && items > 0) holding.push({ kind: "report", title: r.title, items });
  }

  const sees = ofYear.map((w) => workspaceSEE(w));
  const sum = (fn: (x: (typeof sees)[number]) => number) => sees.reduce((a, x) => a + fn(x), 0);
  const fingerprint = packFingerprint({
    seeDirect: sum((x) => x.seeDirect),
    seeIndirect: sum((x) => x.seeIndirect),
    seePrecursor: sum((x) => x.seePrecursor),
    productionTonnes: sum((x) => x.production.tonnes),
    readiness: ready ? "complete" : "incomplete",
    evidenceCount: ofYear.reduce((a, w) => a + listEvidence(w.id).length, 0),
  });

  return { year, reports, percent, reportsComplete, profile, set, ready, packageReady, holding, signKey: `inst:${installation?.id ?? ""}:${year}`, fingerprint };
}

/** What goes into the zip. A free trial holds back the methodology document —
    the monitoring plan — so there the package is built without it. */
export const reportsInPackage = (set: ReportSet, methodologyLocked: boolean) =>
  set.reports.filter((r) => !(methodologyLocked && r.kind === "monitoring_plan"));

/** Everything that goes into the zip as a document: the reports, then the two attachments. The attachments are indexes — they
    are never what holds the package back (`holding` above counts the reports only) and a free trial does not take them away. */
export const documentsInPackage = (set: ReportSet, methodologyLocked: boolean) => [...reportsInPackage(set, methodologyLocked), ...set.attachments];

/** One reason the package is held, in words. The two screens that show the list
    share this so a hold reads the same on both. */
export function holdLabel(h: PackageHold, t: ReturnType<typeof useT>): string {
  if (h.kind === "product_reports") {
    return h.total === 1 ? t("The product report is not complete") : t("{n} of {total} product reports are not complete", { n: h.unfinished, total: h.total });
  }
  if (h.kind === "installation_info") return h.items === 1 ? t("1 item of the installation's information is still missing") : t("{n} items of the installation's information are still missing", { n: h.items });
  return `${t(h.title)}: ${h.items === 1 ? t("1 item to do") : t("{n} items to do", { n: h.items })}`;
}
