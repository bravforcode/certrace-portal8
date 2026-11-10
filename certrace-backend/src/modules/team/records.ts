import { object } from "../../lib/json";
import type { StoredReport } from "../reporting/service";

// Report documents are already company-scoped. Only these legacy record keys
// are shared. Preferences, chat history, and unknown keys stay personal.
const shared = new Set(
  [
    "activity-data",
    "ai-filled",
    "buyers",
    "calc-snapshots",
    "carbon-price",
    "cbam-boundary",
    "cbam-certificate-prices",
    "certificate-pricing",
    "data-gaps",
    "drafts",
    "evidence",
    "export-volumes",
    "final-report-version",
    "mmd-draft",
    "mmd-versions",
    "month-dispatch",
    "month-signoff",
    "shipments",
    "supplier-directory",
    "supplier-records",
    "supplier:profiles",
    "team-members",
    "validation-overrides",
    "workspace-server-links",
  ].map((k) => "certrace:" + k),
);
export function sharedRecord(key: string) {
  return (
    shared.has(key) ||
    key.startsWith("certrace:exporter:") ||
    key.startsWith("certrace:intake:")
  );
}
export const personalPrefix = (companyId: string) =>
  "member:" + companyId + ":";
export function visibleReports(rows: StoredReport[], isOwner: boolean) {
  if (isOwner) return rows;
  return rows.map((r) => {
    if (r.key !== "certrace:profile") return r;
    const profile = object(r.value);
    const fields = [
      "companyName",
      "sector",
      "jurisdiction",
      "installationId",
      "currency",
    ];
    return {
      ...r,
      value: Object.fromEntries(
        fields
          .filter((k) => profile[k] !== undefined)
          .map((k) => [k, profile[k]!]),
      ),
    };
  });
}
