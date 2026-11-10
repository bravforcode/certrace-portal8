"use client";

/* Shared between the Precursors tab (tree + flat list) and the unified
   Suppliers page (§3) — the same two chips, so "verified" and "actual
   value" never mean something different depending on which screen is
   open. Pulled out of app/(portal)/workspaces/[id]/precursors/page.tsx,
   which defined these first. */

import { cn } from "@/components/ui";
import {
  LINK_STATUS_LABEL,
  isVerificationExpired,
  linkStatus,
  valueType,
  type LinkStatus,
  type PrecursorSupplier,
} from "@/lib/precursor-suppliers";
import { useT } from "@/lib/i18n";

export const LINK_STATUS_STYLE: Record<LinkStatus, string> = {
  not_invited: "border-black/[0.08] bg-black/[0.02] text-black/40",
  invited_not_opened:
    "border-[rgba(29,78,216,0.18)] bg-[#eff6ff] text-[#1d4ed8]",
  opened_in_progress:
    "border-[rgba(180,83,9,0.18)] bg-[#fffbeb] text-[#b45309]",
  submitted_pending_validation:
    "border-[rgba(29,78,216,0.18)] bg-[#eff6ff] text-[#1d4ed8]",
  submitted_verified:
    "border-[rgba(5,150,105,0.18)] bg-[#ecfdf5] text-[#047857]",
  submitted_failed_validation:
    "border-[rgba(220,38,38,0.18)] bg-[#fef2f2] text-[#dc2626]",
};

// A 7th, chip-local state layered on top of "submitted_verified" — not added
// to the LinkStatus union itself, which lib/supplier-tree.ts's
// trackingStatusForPrecursor also switches on and which this pass is not
// touching. Same amber token as VERIFICATION_EXPIRED on the Tree page
// (components/tree-node-card.tsx), so the one concept reads the same
// wherever it shows up — and deliberately not the "verified" green or the
// "failed validation" red, which is a different, sharper problem than a
// report simply lapsing.
const EXPIRED_STYLE =
  "border-[rgba(180,83,9,0.18)] bg-[#fffbeb] text-[#b45309]";

export function LinkStatusChip({
  node,
}: {
  node: Pick<
    PrecursorSupplier,
    | "smartLinkSentAt"
    | "smartLinkOpenedAt"
    | "smartLinkSubmittedAt"
    | "dataOrigin"
    | "verificationChecks"
    | "verificationReportExpiresAt"
  >;
}) {
  const t = useT();
  const status = linkStatus(node);
  if (
    status === "submitted_verified" &&
    isVerificationExpired(node.verificationReportExpiresAt)
  ) {
    return (
      <span
        className={cn(
          "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.08em]",
          EXPIRED_STYLE,
        )}
      >
        {t("Expired")}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.08em]",
        LINK_STATUS_STYLE[status],
      )}
    >
      {t(LINK_STATUS_LABEL[status])}
    </span>
  );
}

export function ValueTypeBadge({
  node,
}: {
  node: Pick<
    PrecursorSupplier,
    "dataOrigin" | "verificationChecks" | "isScrap"
  >;
}) {
  const t = useT();
  const type = valueType(node);
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.08em]",
        type === "actual"
          ? "border-[rgba(5,150,105,0.18)] bg-[#ecfdf5] text-[#047857]"
          : "border-black/[0.08] bg-black/[0.03] text-black/45",
      )}
      title={
        type === "actual"
          ? "Passed the four-check verification gate"
          : "Not eligible for actual value — see the data-origin note below"
      }
    >
      {type === "actual" ? t("Actual value") : t("Default value")}
    </span>
  );
}
