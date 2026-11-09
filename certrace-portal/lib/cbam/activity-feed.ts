/* ════════════════════════════════════════════════════════════
   WIDGET L — RECENT ACTIVITY FEED

   The last handful of events across every workspace, assembled from the
   timestamps the product already records. Nothing here writes a new event
   log: an activity feed backed by its own store would be a second copy of
   facts that can drift from the records it describes. Every row is derived
   from the thing that actually happened.
   ════════════════════════════════════════════════════════════ */

import { listEvidence } from "../workspace-evidence";
import { listSuppliers } from "../precursor-suppliers";
import { listVersions } from "../workspace-mmd";
import { monthsForWorkspace, monthCounts } from "../monthly-data";
import { monthNameLong, type VerificationWorkspace } from "../workspace";

export type ActivityKind = "supplier_submitted" | "document_uploaded" | "mmd_finalised" | "month_submitted";

export type ActivityEvent = {
  kind: ActivityKind;
  at: string;
  label: string;
  /** the label as a template and its parts, so a screen can say it in its own language; `month` is an ISO month ('2026-08') */
  say?: { key: string; vars: Record<string, string | number> };
  workspaceId: string;
  workspaceLabel: string;
  deepLink: string;
};

export function activityFeedFor(workspaces: VerificationWorkspace[], limit = 15): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  for (const ws of workspaces) {
    for (const s of listSuppliers(ws.id)) {
      if (s.smartLinkSubmittedAt) {
        events.push({
          kind: "supplier_submitted",
          at: s.smartLinkSubmittedAt,
          label: `${s.name || s.precursorName || "A precursor supplier"} submitted their data`,
          say: { key: "{name} submitted their data", vars: { name: s.name || s.precursorName || "A precursor supplier" } },
          workspaceId: ws.id,
          workspaceLabel: ws.productName,
          deepLink: `/workspaces/${ws.id}/precursors`,
        });
      }
    }

    for (const item of listEvidence(ws.id)) {
      events.push({
        kind: "document_uploaded",
        at: item.capturedAt,
        label: `${item.fileName} uploaded${item.uploadedBy ? ` by ${item.uploadedBy}` : ""}`,
        say: item.uploadedBy ? { key: "{file} uploaded by {who}", vars: { file: item.fileName, who: item.uploadedBy } } : { key: "{file} uploaded", vars: { file: item.fileName } },
        workspaceId: ws.id,
        workspaceLabel: ws.productName,
        deepLink: item.month ? `/workspaces/${ws.id}/monthly/${item.month}` : `/workspaces/${ws.id}/mmd`,
      });
    }

    for (const v of listVersions(ws.id)) {
      events.push({
        kind: "mmd_finalised",
        at: v.finalisedAt,
        label: `Monitoring plan v${v.n} finalised by ${v.author}`,
        say: { key: "Monitoring plan v{n} finalised by {who}", vars: { n: v.n, who: v.author } },
        workspaceId: ws.id,
        workspaceLabel: ws.productName,
        deepLink: `/workspaces/${ws.id}/mmd`,
      });
    }

    for (const entry of monthsForWorkspace(ws)) {
      if (monthCounts(entry) && entry.submittedAt) {
        events.push({
          kind: "month_submitted",
          at: entry.submittedAt,
          label: `${monthNameLong(entry.month)} submitted${entry.submittedBy ? ` by ${entry.submittedBy}` : ""}`,
          say: entry.submittedBy ? { key: "{month} submitted by {who}", vars: { month: entry.month, who: entry.submittedBy } } : { key: "{month} submitted", vars: { month: entry.month } },
          workspaceId: ws.id,
          workspaceLabel: ws.productName,
          deepLink: `/workspaces/${ws.id}/monthly/${entry.month}`,
        });
      }
    }
  }

  return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}
