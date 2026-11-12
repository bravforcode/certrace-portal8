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

export type AdminPreverificationDetail = AdminPreverification & {
  /** Reviewed CBAM cells, keyed `cbam:0:<fieldId>`. */
  cells: Record<string, string>;
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
