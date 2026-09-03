/* ════════════════════════════════════════════════════════════
   WORKSPACE-SCOPED DATA AS QUERIES — same shape as lib/workspaces-query.ts

   One cache for everything a single workspace's screens read: the MMD draft
   and its versions, the twelve months, dispatches, submissions, evidence,
   the derived SEE, the carbon price, the pack sign-off and the report
   contents. All localStorage today; the swap to an API happens inside the
   store modules and no screen moves.

   staleTime 0 (overriding the provider's 30s): a localStorage read costs
   nothing, and plenty of flows still write around these mutations — those
   must be picked up the moment a screen remounts. See lib/workspaces-query.ts.

   KEY LAYOUT — ["workspace-data", <workspaceId>, <subkey>]. The derived
   reads (SEE, coverage, report contents, sign-off state) each depend on
   several stores at once, so every write invalidates its workspace's whole
   subtree rather than re-encoding those dependencies per subkey in a second
   place that drifts. Smart Links walk EVERY workspace, so they live beside
   the subtrees at ["workspace-data", "smart-links"] and are invalidated
   explicitly by the writes that move them (month saves, dispatches) and by
   supplier/precursor writers elsewhere via the exported SMART_LINKS_KEY.
   ════════════════════════════════════════════════════════════ */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCarbonPrice, saveCarbonPrice, type CarbonPriceRecord } from "./carbon-price";
import type { TFunction } from "./i18n";
import { dispatchesFor, markMonthReminded, markMonthSent } from "./month-dispatch";
import {
  approveEditRequest,
  assignReviewer,
  confirmMonth,
  markExporterEdited,
  rejectEditRequest,
  requestEdit,
  requestRevision,
  submissionFor,
  submissionsFor,
  submitWithAttestation,
  type Attestation,
} from "./month-submission";
import { getMonth, monthsForWorkspace, saveMonth, type MonthlyEntry } from "./monthly-data";
import { signOffPack, signOffState } from "./pack-signoff";
import type { WorkspaceReadiness } from "./readiness";
import { reportContents } from "./report-contents";
import { buildSmartLinks } from "./smart-links";
import type { VerificationWorkspace } from "./workspace";
import { annualCoverage, annualEvidence, evidenceForMonth, listEvidence, type AnnualScope } from "./workspace-evidence";
import {
  finaliseVersion,
  finalVersionCovering,
  latestVersion,
  listVersions,
  loadDraft,
  saveDraft,
  type WorkspaceMmdContent,
} from "./workspace-mmd";
import { workspaceSEE } from "./workspace-see";

/* `emptyMonth` is a pure constructor, not a read — re-exported so screens on
   these hooks need no second import path into the store. */
export { emptyMonth } from "./monthly-data";

const ROOT = ["workspace-data"] as const;
const wsKey = (workspaceId: string) => [...ROOT, workspaceId] as const;

/** Estate-wide, so it cannot live under one workspace's subtree. Exported so
    the supplier/precursor mutations in other query files can invalidate it —
    a send or a precursor submission changes what this list says. */
export const SMART_LINKS_KEY = [...ROOT, "smart-links"] as const;

function useWorkspaceWrite<V extends { workspaceId: string }, R>(fn: (v: V) => R, movesSmartLinks = false) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (v: V) => Promise.resolve(fn(v)),
    onSuccess: (_result, v) => {
      void client.invalidateQueries({ queryKey: wsKey(v.workspaceId) });
      if (movesSmartLinks) void client.invalidateQueries({ queryKey: SMART_LINKS_KEY });
    },
  });
}

/** Same escape hatch as useInvalidateWorkspaces — for legacy flows that still
    write to the stores directly. Without an id it settles the whole domain,
    smart links included. */
export function useInvalidateWorkspaceData(workspaceId?: string): () => void {
  const client = useQueryClient();
  return () => {
    void client.invalidateQueries({ queryKey: workspaceId ? wsKey(workspaceId) : ROOT });
    if (workspaceId) void client.invalidateQueries({ queryKey: SMART_LINKS_KEY });
  };
}

/* ── Monitoring methodology (lib/workspace-mmd.ts) ───────────── */

export function useMmdDraft(workspaceId: string | undefined, periodStart: string, periodEnd: string) {
  return useQuery({
    queryKey: [...wsKey(workspaceId ?? ""), "mmd-draft", periodStart, periodEnd],
    queryFn: () => loadDraft(workspaceId!, periodStart, periodEnd),
    enabled: Boolean(workspaceId),
    staleTime: 0,
  });
}

export function useMmdVersions(workspaceId: string | undefined) {
  return useQuery({
    queryKey: [...wsKey(workspaceId ?? ""), "mmd-versions"],
    queryFn: () => listVersions(workspaceId!),
    enabled: Boolean(workspaceId),
    staleTime: 0,
  });
}

export function useLatestMmdVersion(workspaceId: string | undefined) {
  return useQuery({
    queryKey: [...wsKey(workspaceId ?? ""), "mmd-latest"],
    queryFn: () => latestVersion(workspaceId!),
    enabled: Boolean(workspaceId),
    staleTime: 0,
  });
}

export function useFinalMmdVersion(workspaceId: string | undefined, periodStart: string, periodEnd: string) {
  return useQuery({
    queryKey: [...wsKey(workspaceId ?? ""), "mmd-final", periodStart, periodEnd],
    queryFn: () => finalVersionCovering(workspaceId!, periodStart, periodEnd),
    enabled: Boolean(workspaceId),
    staleTime: 0,
  });
}

export const useSaveMmdDraft = () =>
  useWorkspaceWrite(({ workspaceId, content }: { workspaceId: string; content: WorkspaceMmdContent }) =>
    saveDraft(workspaceId, content),
  );

export const useFinaliseMmdVersion = () =>
  useWorkspaceWrite(({ workspaceId, content, author }: { workspaceId: string; content: WorkspaceMmdContent; author: string }) =>
    finaliseVersion(workspaceId, content, author),
  );

/* ── Monthly readings (lib/monthly-data.ts) ──────────────────── */

export function useMonths(workspace: Pick<VerificationWorkspace, "id" | "year"> | undefined) {
  return useQuery({
    // year is in the key: monthsForWorkspace derives the month list from it, so
    // a year change must re-list rather than serve last year's months.
    queryKey: [...wsKey(workspace?.id ?? ""), "months", workspace?.year],
    queryFn: () => monthsForWorkspace(workspace!),
    enabled: Boolean(workspace),
    staleTime: 0,
  });
}

export function useMonth(workspaceId: string | undefined, month: string | undefined) {
  return useQuery({
    queryKey: [...wsKey(workspaceId ?? ""), "month", month],
    queryFn: () => getMonth(workspaceId!, month!),
    enabled: Boolean(workspaceId && month),
    staleTime: 0,
  });
}

/* A saved month moves the annual SEE, coverage, report contents AND the
   estate-wide ask list (a submitted month is an answered smart link). */
export const useSaveMonth = () => useWorkspaceWrite((entry: MonthlyEntry) => saveMonth(entry), true);

/* ── Dispatches (lib/month-dispatch.ts) ──────────────────────── */

export function useDispatches(workspaceId: string | undefined) {
  return useQuery({
    queryKey: [...wsKey(workspaceId ?? ""), "dispatches"],
    queryFn: () => dispatchesFor(workspaceId!),
    enabled: Boolean(workspaceId),
    staleTime: 0,
  });
}

export const useMarkMonthSent = () =>
  useWorkspaceWrite(
    ({ workspaceId, month, dueDay }: { workspaceId: string; month: string; dueDay?: number }) =>
      markMonthSent(workspaceId, month, dueDay),
    true,
  );

export const useMarkMonthReminded = () =>
  useWorkspaceWrite(({ workspaceId, month }: { workspaceId: string; month: string }) => markMonthReminded(workspaceId, month), true);

/* ── Submissions and the review loop (lib/month-submission.ts) ─
   None of these touch smart links: buildSmartLinks reads a month's answered
   state off the readings store, not the review state. */

export function useSubmissions(workspaceId: string | undefined) {
  return useQuery({
    queryKey: [...wsKey(workspaceId ?? ""), "submissions"],
    queryFn: () => submissionsFor(workspaceId!),
    enabled: Boolean(workspaceId),
    staleTime: 0,
  });
}

export function useSubmission(workspaceId: string | undefined, month: string | undefined) {
  return useQuery({
    queryKey: [...wsKey(workspaceId ?? ""), "submission", month],
    queryFn: () => submissionFor(workspaceId!, month!),
    enabled: Boolean(workspaceId && month),
    staleTime: 0,
  });
}

export const useSubmitWithAttestation = () =>
  useWorkspaceWrite(({ workspaceId, month, attestation }: { workspaceId: string; month: string; attestation: Attestation }) =>
    submitWithAttestation(workspaceId, month, attestation),
  );

export const useMarkExporterEdited = () =>
  useWorkspaceWrite(({ workspaceId, month }: { workspaceId: string; month: string }) => markExporterEdited(workspaceId, month));

export const useAssignReviewer = () =>
  useWorkspaceWrite(
    ({ workspaceId, month, reviewerId, reviewerName }: { workspaceId: string; month: string; reviewerId: string; reviewerName: string }) =>
      assignReviewer(workspaceId, month, reviewerId, reviewerName),
  );

export const useConfirmMonth = () =>
  useWorkspaceWrite(({ workspaceId, month, by }: { workspaceId: string; month: string; by: string }) => confirmMonth(workspaceId, month, by));

export const useRequestRevision = () =>
  useWorkspaceWrite(({ workspaceId, month, note, areas }: { workspaceId: string; month: string; note: string; areas?: string[] }) =>
    requestRevision(workspaceId, month, note, areas),
  );

export const useRequestEdit = () =>
  useWorkspaceWrite(({ workspaceId, month, reason }: { workspaceId: string; month: string; reason: string }) =>
    requestEdit(workspaceId, month, reason),
  );

export const useApproveEditRequest = () =>
  useWorkspaceWrite(({ workspaceId, month, by }: { workspaceId: string; month: string; by: string }) =>
    approveEditRequest(workspaceId, month, by),
  );

export const useRejectEditRequest = () =>
  useWorkspaceWrite(({ workspaceId, month, by }: { workspaceId: string; month: string; by: string }) =>
    rejectEditRequest(workspaceId, month, by),
  );

/* ── Evidence (lib/workspace-evidence.ts) ────────────────────── */

export function useEvidence(workspaceId: string | undefined) {
  return useQuery({
    queryKey: [...wsKey(workspaceId ?? ""), "evidence"],
    queryFn: () => listEvidence(workspaceId!),
    enabled: Boolean(workspaceId),
    staleTime: 0,
  });
}

export function useMonthEvidence(workspaceId: string | undefined, month: string | undefined) {
  return useQuery({
    queryKey: [...wsKey(workspaceId ?? ""), "evidence", month],
    queryFn: () => evidenceForMonth(workspaceId!, month!),
    enabled: Boolean(workspaceId && month),
    staleTime: 0,
  });
}

export function useAnnualEvidence(workspaceId: string | undefined) {
  return useQuery({
    queryKey: [...wsKey(workspaceId ?? ""), "evidence", "annual"],
    queryFn: () => annualEvidence(workspaceId!),
    enabled: Boolean(workspaceId),
    staleTime: 0,
  });
}

export function useAnnualCoverage(workspaceId: string | undefined, scope: AnnualScope | undefined) {
  return useQuery({
    queryKey: [...wsKey(workspaceId ?? ""), "annual-coverage", scope ?? null],
    queryFn: () => annualCoverage(workspaceId!, scope!),
    enabled: Boolean(workspaceId && scope),
    staleTime: 0,
  });
}

/* ── Derived views: SEE and the report's contents ────────────── */

export function useWorkspaceSEE(workspace: VerificationWorkspace | undefined) {
  return useQuery({
    /* The workspace value sits in the key: SEE reads product/route/etc off it,
       so an edit must recompute rather than serve the pre-edit figure cached
       under a value-blind id key. The layout query hands the prop down with
       structural sharing, so the key only moves when the value did. */
    queryKey: [...wsKey(workspace?.id ?? ""), "see", workspace],
    queryFn: () => workspaceSEE(workspace!),
    enabled: Boolean(workspace),
    staleTime: 0,
  });
}

/* `ws` and `readiness` are in the key because reportContents reads them (a
   changed readiness must refetch, not lag a cycle). `t` cannot be keyed — a
   function hashes to nothing — but locale switches never move ws/readiness, so
   this matches the old effect that keyed on [workspace, readiness] alone. */
export function useReportContents(ws: VerificationWorkspace | undefined, readiness: WorkspaceReadiness | undefined, t: TFunction) {
  return useQuery({
    queryKey: [...wsKey(ws?.id ?? ""), "report-contents", ws, readiness],
    queryFn: () => reportContents(ws!, readiness!, t),
    enabled: Boolean(ws && readiness),
    staleTime: 0,
  });
}

/* ── Carbon price (lib/carbon-price.ts) ──────────────────────── */

export function useCarbonPrice(workspaceId: string | undefined) {
  return useQuery({
    queryKey: [...wsKey(workspaceId ?? ""), "carbon-price"],
    queryFn: () => getCarbonPrice(workspaceId!),
    enabled: Boolean(workspaceId),
    staleTime: 0,
  });
}

export const useSaveCarbonPrice = () => useWorkspaceWrite((record: CarbonPriceRecord) => saveCarbonPrice(record));

/* ── Pack sign-off (lib/pack-signoff.ts) ─────────────────────── */

/* `complete` and `fingerprint` ARE keyed: the state is a function of them,
   and a fingerprint that moved must produce a fresh "stale" answer without
   waiting for an invalidation. */
export function useSignOffState(workspaceId: string | undefined, complete: boolean, fingerprint: string) {
  return useQuery({
    queryKey: [...wsKey(workspaceId ?? ""), "signoff", complete, fingerprint],
    queryFn: () => signOffState(workspaceId!, complete, fingerprint),
    enabled: Boolean(workspaceId),
    staleTime: 0,
  });
}

export const useSignOffPack = () =>
  useWorkspaceWrite(
    ({ workspaceId, name, jobTitle, fingerprint }: { workspaceId: string; name: string; jobTitle: string; fingerprint: string }) =>
      signOffPack(workspaceId, name, jobTitle, fingerprint),
  );

/* ── Smart links (lib/smart-links.ts) ────────────────────────── */

export function useSmartLinks() {
  return useQuery({ queryKey: SMART_LINKS_KEY, queryFn: () => buildSmartLinks(), staleTime: 0 });
}
