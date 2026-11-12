"use client";

/* CBAM pre-verification on Convert: where the workbook stands with the AI check and the Certrace
   team, and the one action the customer can take next. Every value comes from the API. */

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Chip, type Tone } from "@/components/ui";
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

export function PreverifyPanel({
  installationId,
  year,
  canConvert,
}: {
  installationId: string;
  year: number;
  canConvert: boolean;
}) {
  const t = useT();
  const client = useQueryClient();
  const key = ["preverification", installationId, year] as const;
  const status = useQuery({
    queryKey: key,
    queryFn: () => getPreverification(installationId, year),
  });
  const submit = useMutation({
    mutationFn: () => submitPreverification(installationId, year),
    onSuccess: () => toast(t("Submitted for pre-verification")),
    onError: (err) => toast({ message: submitError(err, t), tone: "err" }),
    // Returned, so the mutation stays pending until the refetch lands and a second click cannot slip in.
    onSettled: () => client.invalidateQueries({ queryKey: key }),
  });

  if (status.isError)
    return (
      <Card className="p-5">
        <p className="text-[13px] text-black/55">
          {t("Could not load the pre-verification status.")}
        </p>
      </Card>
    );
  if (!status.data) return null;

  const { latest, currentRevision } = status.data;
  const state = preverifyState(latest, currentRevision, canConvert);
  const steps = STEP_STATES[state];
  // Submit is closed in every state while the workbook is incomplete, not only when nothing was sent yet.
  const submitButton = (label: string) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        onClick={() => submit.mutate()}
        disabled={!canConvert || submit.isPending}
        title={canConvert ? undefined : t("Complete first")}
      >
        {submit.isPending ? t("Submitting…") : t(label)}
      </Button>
      {!canConvert && <span className="text-[12px] text-black/50">{t("Complete first")}</span>}
    </div>
  );

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-[family-name:var(--font-plex)] text-xl font-light tracking-tight text-[#111]">
          {t("Pre-verification")}
        </h2>
        <p className="mt-1 text-[12px] text-black/40">
          {t("The AI checks the workbook first. A Certrace team member then reviews it.")}
        </p>
      </div>
      <Card className="space-y-5 p-5">
        <ol className="grid gap-2 sm:grid-cols-3">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className="flex items-center justify-between gap-2 rounded-xl border border-black/[0.06] px-3 py-2"
            >
              <span className="text-[13px] text-black/75">{t(label)}</span>
              <Chip tone={STEP_CHIP[steps[i]].tone} filled>
                {t(STEP_CHIP[steps[i]].label)}
              </Chip>
            </li>
          ))}
        </ol>

        {(state === "incomplete" || state === "ready") && submitButton("Submit for pre-verification")}

        {state === "flagged" && latest && (
          <>
            <p className="text-[13px] text-black/60">
              {t("Fix the points below in the workbook, then resubmit.")}
            </p>
            <Findings findings={latest.aiFindings} />
            {submitButton("Resubmit for pre-verification")}
          </>
        )}

        {state === "in_review" && latest && (
          <>
            <p className="text-[14px] text-black/80">{t("Waiting for Certrace team review.")}</p>
            <p className="text-[12px] text-black/50">
              {t("Submitted {time}", { time: formatTime(latest.submittedAt) })}
            </p>
            {latest.aiSummary && (
              <p className="text-[13px] leading-relaxed text-black/60">{latest.aiSummary}</p>
            )}
            <Findings findings={latest.aiFindings.filter((f) => f.severity === "warn")} />
          </>
        )}

        {state === "approved" && latest && (
          <>
            <p className="text-[14px] text-black/80">{t("Pre-verified by Certrace")}</p>
            <p className="text-[12px] text-black/50">
              {t("Reviewed {time}", { time: formatTime(latest.reviewedAt) })}
            </p>
            {latest.teamNote && (
              <p className="text-[13px] leading-relaxed text-black/60">{latest.teamNote}</p>
            )}
          </>
        )}

        {state === "changes_requested" && latest && (
          <>
            <p className="text-[14px] font-medium text-[#b91c1c]">
              {t("Certrace asked for changes")}
            </p>
            {latest.teamNote && (
              <p className="whitespace-pre-line rounded-xl border border-[rgba(220,38,38,0.18)] bg-[#fef2f2] px-4 py-3 text-[13px] leading-relaxed text-black/75">
                {latest.teamNote}
              </p>
            )}
            {submitButton("Resubmit for pre-verification")}
          </>
        )}

        {state === "stale" && (
          <>
            <p className="text-[14px] text-black/80">
              {t("Data changed since the review. Resubmit.")}
            </p>
            {submitButton("Resubmit for pre-verification")}
          </>
        )}
      </Card>
    </section>
  );
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
              <span className="block text-[12px] text-black/45">{cbamCellLabel(f.field)}</span>
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
    if (err.code === "ALREADY_IN_REVIEW")
      return t("This workbook is already waiting for the Certrace team. Change the data to submit again.");
    if (err.status === 429) return t("Too many submissions. Try again later.");
    if (err.code === "EMPTY_WORKBOOK")
      return t("Fill in the CBAM requirements before you submit for pre-verification.");
    return err.message;
  }
  return t("Could not submit for pre-verification. Try again.");
}
