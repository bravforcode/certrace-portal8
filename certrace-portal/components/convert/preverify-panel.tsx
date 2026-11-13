"use client";

/* CBAM pre-verification on Convert, in two parts that read one query:

   PreverifyMenu    the one "Export for verification" button on CBAM: download the
                    verification file, how many of the plan's pre-verifications are
                    left, Submit, and Top up once they run out
   PreverifyPanel   the section where the workbook stands with the AI check and the
                    Certrace team, with the findings or the team's note

   Every value comes from the API; the quota is counted and enforced by the server. */

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, CreditCard, Download, Send } from "lucide-react";
import { Button, Card, Chip, cn, type Tone } from "@/components/ui";
import { toast } from "@/components/toast";
import { isApiError } from "@/lib/api";
import {
  getPreverification,
  preverifyState,
  submitPreverification,
  type AiFinding,
  type PreverifyState,
} from "@/lib/api/preverifications";
import { cbamCellLabel } from "@/lib/cbam/template-fields";
import { useT, type TFunction } from "@/lib/i18n";

type StepKey = "done" | "issue" | "active" | "stale" | "pending";

const STEPS = ["AI check", "Certrace team review", "Pre-verified"] as const;

const STEP_STATES: Record<PreverifyState, [StepKey, StepKey, StepKey]> = {
  incomplete: ["pending", "pending", "pending"],
  ready: ["pending", "pending", "pending"],
  flagged: ["issue", "pending", "pending"],
  in_review: ["done", "active", "pending"],
  approved: ["done", "done", "done"],
  changes_requested: ["done", "issue", "pending"],
  stale: ["stale", "pending", "pending"],
};

const STEP_CHIP: Record<StepKey, { tone: Tone; label: string }> = {
  done: { tone: "ok", label: "Done" },
  issue: { tone: "err", label: "Action needed" },
  active: { tone: "warn", label: "In progress" },
  stale: { tone: "warn", label: "Outdated" },
  pending: { tone: "muted", label: "Pending" },
};

/** States from which the customer may send the workbook (again). */
const SUBMITTABLE: PreverifyState[] = [
  "ready",
  "flagged",
  "changes_requested",
  "stale",
];

/** The year's pre-verification status and the submit action, shared by the menu and the panel. */
export function usePreverification(
  installationId: string | null,
  year: number,
  canConvert: boolean,
  /** Only CBAM is pre-verified; other standards keep the query off. */
  enabled = true,
) {
  const t = useT();
  const client = useQueryClient();
  const key = ["preverification", installationId, year] as const;
  const status = useQuery({
    queryKey: key,
    queryFn: () => getPreverification(installationId!, year),
    enabled: enabled && installationId !== null,
  });
  const submit = useMutation({
    mutationFn: () => submitPreverification(installationId!, year),
    onSuccess: () => toast(t("Submitted for pre-verification")),
    onError: (err) => toast({ message: submitError(err, t), tone: "err" }),
    // Returned, so the mutation stays pending until the refetch lands and a second click cannot slip in.
    onSettled: () => client.invalidateQueries({ queryKey: key }),
  });
  const data = status.data;
  const state = data
    ? preverifyState(data.latest, data.currentRevision, canConvert)
    : null;
  const left = data ? Math.max(0, data.quota - data.used) : null;
  return { status, submit, data, state, left };
}

export function PreverifyMenu({
  pv,
  canConvert,
  onExport,
}: {
  pv: ReturnType<typeof usePreverification>;
  canConvert: boolean;
  /** Downloads the verification file; offered once every requirement is complete. */
  onExport: () => void;
}) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const root = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const { data, state, left, submit } = pv;
  const approved = state === "approved";
  const canSend =
    canConvert &&
    left !== null &&
    left > 0 &&
    state !== null &&
    SUBMITTABLE.includes(state) &&
    !submit.isPending;
  const why = !canConvert
    ? t("Complete every requirement first")
    : left === 0
      ? t("No pre-verifications left")
      : state === "in_review"
        ? t("Waiting for the Certrace team")
        : approved
          ? t("Already pre-verified")
          : null;

  return (
    <div ref={root} className="relative">
      <Button
        aria-haspopup="menu"
        aria-expanded={open}
        aria-describedby={canConvert ? undefined : "convert-incomplete"}
        onClick={() => setOpen((v) => !v)}
      >
        <Download size={15} strokeWidth={1.5} />
        {t("Export for verification")}
        <ChevronDown
          size={14}
          strokeWidth={1.5}
          className={cn("transition-transform", open && "rotate-180")}
        />
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-black/[0.08] bg-white p-2 shadow-[0_12px_32px_rgba(0,0,0,0.08)]"
        >
          <button
            type="button"
            role="menuitem"
            disabled={!canConvert}
            onClick={() => {
              setOpen(false);
              onExport();
            }}
            className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <Download size={14} strokeWidth={1.5} className="mt-0.5 flex-none" />
            <span className="min-w-0">
              <span className="block text-[13px] text-[#111]">
                {t("Download verification file")}
              </span>
              {!canConvert && (
                <span className="block text-[11.5px] text-black/45">
                  {t("Complete every requirement first")}
                </span>
              )}
            </span>
          </button>
          <div className="my-1.5 h-px bg-black/[0.06]" />
          {data && (
          <div className="px-2.5 pb-2 pt-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[13px] font-medium text-[#111]">
                {t("Pre-verifications")}
              </span>
              <span
                className={cn(
                  "font-mono text-[12px] tabular-nums",
                  left === 0 ? "text-[#b91c1c]" : "text-black/55",
                )}
              >
                {t("{left} of {quota} left", {
                  left: left ?? 0,
                  quota: data.quota,
                })}
              </span>
            </div>
            <div aria-hidden className="mt-2 flex gap-1">
              {Array.from({ length: data.quota }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    i < data.used ? "bg-black/15" : "bg-[#16a34a]",
                  )}
                />
              ))}
            </div>
          </div>
          )}
          <button
            type="button"
            role="menuitem"
            disabled={!canSend}
            onClick={() => {
              setOpen(false);
              submit.mutate();
            }}
            className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <Send size={14} strokeWidth={1.5} className="mt-0.5 flex-none" />
            <span className="min-w-0">
              <span className="block text-[13px] text-[#111]">
                {submit.isPending
                  ? t("Submitting…")
                  : approved
                    ? t("Pre-verified")
                    : state === "ready" || state === "incomplete" || state === null
                    ? t("Submit for pre-verification")
                    : t("Resubmit for pre-verification")}
              </span>
              {why && (
                <span className="block text-[11.5px] text-black/45">{why}</span>
              )}
            </span>
          </button>
          <Link
            role="menuitem"
            href="/billing"
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-[#111] hover:bg-black/[0.04]"
          >
            <CreditCard size={14} strokeWidth={1.5} className="flex-none" />
            {t("Top up")}
          </Link>
        </div>
      )}
    </div>
  );
}

export function PreverifyPanel({
  pv,
}: {
  pv: ReturnType<typeof usePreverification>;
}) {
  const t = useT();
  const { status, data, state } = pv;

  const body = status.isError ? (
    <p className="text-[13px] text-black/55">
      {t("Could not load the pre-verification status.")}
    </p>
  ) : !data || !state ? null : (
    <>
      <ol className="grid gap-2 sm:grid-cols-3">
        {STEPS.map((label, i) => {
          const step = STEP_CHIP[STEP_STATES[state][i]];
          return (
            <li
              key={label}
              className="flex items-center justify-between gap-2 rounded-xl border border-black/[0.06] px-3 py-2"
            >
              <span className="text-[13px] text-black/75">{t(label)}</span>
              <Chip tone={step.tone} filled>
                {t(step.label)}
              </Chip>
            </li>
          );
        })}
      </ol>
      <StateNote pv={pv} />
    </>
  );

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-[family-name:var(--font-plex)] text-xl font-light tracking-tight text-[#111]">
          {t("Pre-verification")}
        </h2>
        <p className="mt-1 text-[12px] text-black/40">
          {t(
            "The AI checks the workbook first. A Certrace team member then reviews it.",
          )}
        </p>
      </div>
      {body && <Card className="space-y-5 p-5">{body}</Card>}
    </section>
  );
}

function StateNote({ pv }: { pv: ReturnType<typeof usePreverification> }) {
  const t = useT();
  const latest = pv.data?.latest ?? null;
  switch (pv.state) {
    case "incomplete":
      return (
        <p className="text-[13px] text-black/55">
          {t(
            "Complete every requirement, then submit from Export for verification above.",
          )}
        </p>
      );
    case "ready":
      return (
        <p className="text-[13px] text-black/55">
          {t(
            "The workbook is complete. Submit it from Export for verification above.",
          )}
        </p>
      );
    case "flagged":
      return latest ? (
        <>
          <p className="text-[13px] text-black/60">
            {t("Fix the points below in the workbook, then resubmit.")}
          </p>
          <Findings findings={latest.aiFindings} />
        </>
      ) : null;
    case "in_review":
      return latest ? (
        <>
          <p className="text-[14px] text-black/80">
            {t("Waiting for Certrace team review.")}
          </p>
          <p className="text-[12px] text-black/50">
            {t("Submitted {time}", { time: formatTime(latest.submittedAt) })}
          </p>
          {latest.aiSummary && (
            <p className="text-[13px] leading-relaxed text-black/60">
              {latest.aiSummary}
            </p>
          )}
          <Findings
            findings={latest.aiFindings.filter((f) => f.severity === "warn")}
          />
        </>
      ) : null;
    case "approved":
      return latest ? (
        <>
          <p className="text-[14px] text-black/80">
            {t("Pre-verified by Certrace")}
          </p>
          <p className="text-[12px] text-black/50">
            {t("Reviewed {time}", { time: formatTime(latest.reviewedAt) })}
          </p>
          {latest.teamNote && (
            <p className="text-[13px] leading-relaxed text-black/60">
              {latest.teamNote}
            </p>
          )}
        </>
      ) : null;
    case "changes_requested":
      return latest ? (
        <>
          <p className="text-[14px] font-medium text-[#b91c1c]">
            {t("Certrace asked for changes")}
          </p>
          {latest.teamNote && (
            <p className="whitespace-pre-line rounded-xl border border-[rgba(220,38,38,0.18)] bg-[#fef2f2] px-4 py-3 text-[13px] leading-relaxed text-black/75">
              {latest.teamNote}
            </p>
          )}
        </>
      ) : null;
    case "stale":
      return (
        <p className="text-[14px] text-black/80">
          {t("Data changed since the review. Resubmit.")}
        </p>
      );
    default:
      return null;
  }
}

function Findings({ findings }: { findings: AiFinding[] }) {
  const t = useT();
  return (
    <ul className="space-y-3">
      {findings.map((f, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="pt-0.5">
            <Chip tone={f.severity === "error" ? "err" : "warn"} filled>
              {t(f.severity === "error" ? "Error" : "Warning")}
            </Chip>
          </span>
          <span className="min-w-0 flex-1 text-[13px] leading-relaxed text-black/70">
            {f.field && (
              <span className="block text-[12px] text-black/45">
                {cbamCellLabel(f.field)}
              </span>
            )}
            {f.message}
          </span>
        </li>
      ))}
    </ul>
  );
}

function formatTime(iso: string | null) {
  return iso ? new Date(iso).toLocaleString() : "";
}

function submitError(err: unknown, t: TFunction) {
  if (isApiError(err)) {
    if (err.code === "QUOTA_EXCEEDED")
      return t(
        "All pre-verifications in your plan are used. Top up on the billing page to submit again.",
      );
    if (err.code === "ALREADY_IN_REVIEW")
      return t(
        "This workbook is already waiting for the Certrace team. Change the data to submit again.",
      );
    if (err.status === 429) return t("Too many submissions. Try again later.");
    if (err.code === "EMPTY_WORKBOOK")
      return t(
        "Fill in the CBAM requirements before you submit for pre-verification.",
      );
    return err.message;
  }
  return t("Could not submit for pre-verification. Try again.");
}
