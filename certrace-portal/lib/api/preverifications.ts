/* CBAM pre-verification: the customer submits a workbook, the AI checks it, and the
   Certrace team decides by hand. The backend owns every status; this file only shapes
   the calls and the one pure rule that turns a status into what the Convert page shows. */

import { api, result } from "./client";

export type PreverificationStatus =
  | "ai_flagged"
  | "team_review"
  | "approved"
  | "changes_requested"
  | "superseded";

export type AiFinding = {
  severity: "error" | "warn";
  field?: string;
  message: string;
};

export type PreverificationView = {
  id: string;
  installationId: string;
  year: number;
  standardId: "cbam";
  status: PreverificationStatus;
  workbookRevision: number;
  aiFindings: AiFinding[];
  aiSummary: string | null;
  aiModel: string | null;
  teamNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
};

export type PreverificationLatest = {
  latest: PreverificationView | null;
  currentRevision: number;
  /** Pre-verifications that reached the Certrace team, across the company. */
  used: number;
  /** How many the plan includes before a top-up. */
  quota: number;
};

/** Admin list row: the view plus the company, the reviewer and whether the data moved on since. */
export type AdminPreverification = PreverificationView & {
  reviewedBy: string | null;
  companyId: string;
  companyName: string | null;
  companyEmail: string;
  currentRevision: number;
  stale: boolean;
};

export type AdminPreverificationFile = {
  id: string;
  name: string;
  description: string;
  reviewedAt: string | null;
};

export type AdminPreverificationDetail = AdminPreverification & {
  /** Reviewed CBAM cells, keyed `cbam:0:<fieldId>`. */
  cells: Record<string, string>;
  /** Evidence files uploaded for this installation and year. */
  files: AdminPreverificationFile[];
};

export type PreverifyState =
  | "incomplete"
  | "ready"
  | "flagged"
  | "in_review"
  | "approved"
  | "changes_requested"
  | "stale";

export async function getPreverification(
  installationId: string,
  year: number,
): Promise<PreverificationLatest> {
  return (await result(
    api().api.v1.preverifications.get({
      query: { installationId, year, standardId: "cbam" },
    }),
  )) as PreverificationLatest;
}

export async function submitPreverification(
  installationId: string,
  year: number,
): Promise<PreverificationView> {
  return (await result(
    api().api.v1.preverifications.post({
      installationId,
      year,
      standardId: "cbam",
    }),
  )) as PreverificationView;
}

export async function listPreverifications(
  status?: PreverificationStatus,
): Promise<AdminPreverification[]> {
  const res = (await result(
    api().api.admin.preverifications.get({ query: status ? { status } : {} }),
  )) as { items: AdminPreverification[] };
  return res.items;
}

export async function getPreverificationDetail(
  id: string,
): Promise<AdminPreverificationDetail> {
  return (await result(
    api().api.admin.preverifications({ id }).get(),
  )) as AdminPreverificationDetail;
}

export async function decidePreverification(
  id: string,
  decision: "approved" | "changes_requested",
  note: string,
): Promise<PreverificationView> {
  return (await result(
    api().api.admin.preverifications({ id }).decision.post({ decision, note }),
  )) as PreverificationView;
}

/** What the customer sees for CBAM pre-verification, from the latest submission and the workbook.
    A submission is open while it waits for the team or for the customer to fix it; a revision
    the customer changed after the AI check turns an approved, waiting or sent-back one stale. */
export function preverifyState(
  latest: PreverificationView | null,
  currentRevision: number,
  canConvert: boolean,
): PreverifyState {
  // Data edited after the last submission: nothing decided on it still applies.
  const changed =
    latest !== null && latest.workbookRevision !== currentRevision;
  // Nothing open to show, or the customer may submit again: only complete data can be sent.
  const submittable = canConvert ? "ready" : "incomplete";
  if (!latest || latest.status === "superseded") return submittable;
  switch (latest.status) {
    case "ai_flagged":
      // A fix in the workbook means the flags may be gone, so the customer resubmits.
      return changed ? submittable : "flagged";
    case "team_review":
      return changed ? "stale" : "in_review";
    case "approved":
      return changed ? "stale" : "approved";
    case "changes_requested":
      return changed ? "stale" : "changes_requested";
  }
}

/** The Convert page's three status dots: red = ready to start, yellow = in progress, green = completed. */
export type StageDot = "ready" | "progress" | "done";

export function stageDots(
  /** The standard's requirements; any requirement started (not "missing") makes Complete in progress. */
  requirements: readonly { state: string }[],
  state: PreverifyState,
  hasDeclaration: boolean,
): { complete: StageDot; review: StageDot; reporting: StageDot } {
  // Readiness counts only finished requirements, so a half-filled one would still read as "not started".
  const complete: StageDot =
    requirements.length > 0 && requirements.every((r) => r.state === "complete")
      ? "done"
      : requirements.some((r) => r.state !== "missing")
        ? "progress"
        : "ready";
  const review: StageDot =
    state === "approved"
      ? "done"
      : state === "incomplete" || state === "ready"
        ? "ready"
        : "progress";
  const reporting: StageDot =
    state !== "approved" ? "ready" : hasDeclaration ? "done" : "progress";
  return { complete, review, reporting };
}

/** Marks one evidence file reviewed by Certrace (or clears it). The customer sees a green dot. */
export async function reviewWorkbookFile(
  row: Pick<AdminPreverification, "companyId" | "installationId" | "year">,
  fileId: string,
  reviewed: boolean,
): Promise<void> {
  await result(
    api()
      .api.admin.workbooks({ companyId: row.companyId })({
        installationId: row.installationId,
      })({ year: row.year })
      .files({ fileId })
      .review.put({ reviewed }),
  );
}
