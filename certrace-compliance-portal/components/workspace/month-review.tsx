"use client";

/* ════════════════════════════════════════════════════════════
   THE REVIEW BAR — what the exporter does with a month once it arrives

   A month that a supplier has filled in creates a job the portal previously
   had no place for: somebody has to LOOK at it, and then either accept it or
   say what is wrong. The screen offered neither — it offered an editable form,
   so the only way to disagree with a figure was to overwrite it, silently,
   under the supplier's name.

   THE DEFAULT IS READ-ONLY, AND THAT IS THE POINT. Arriving on a submitted
   month in an editable form invites correction as the first act, before the
   figures have been read as a set. Reviewing is reading; editing is a decision
   with consequences for whose attestation covers what. So the month opens
   fixed, with EDIT on the bar, and taking that action is deliberate and
   recorded.

   IT SAYS WHICH VERSION, AND WHEN. The bar used to carry a state chip and a
   sentence of prose about provenance. "Awaiting your review" is the state of a
   CONVERSATION; the question somebody opening March in November actually has
   is which document they are looking at and when it landed — a month
   resubmitted twice after two rounds of questions is three different documents
   wearing the same chip. So the chip stays, and beside it now sits `v2 ·
   14 Mar 2026`, from lib/month-submission.ts.

   ASKING FOR A FIX HAS LEFT THIS BAR. It is a decision about the CONTENT of
   the month — which parts of it need another look — and it now sits at the
   foot of the month, under the errors that lead to it, as
   components/workspace/revision-request.tsx. What stays here are the two
   decisions that are about the month's STATUS rather than its figures:
   confirming it, and handing it to a colleague.

   AND THE ONE DECISION THAT COMES FROM THE OTHER SIDE. A submitted month is
   closed to the supplier — but plants find their own mistakes, and the only
   alternative to a request is a phone call the portal never hears about. When
   one is waiting, this bar is where it is answered, and approving is what
   actually puts the month back into draft on their screen. Both answers report
   on the button that was pressed rather than in the corner of the screen: the
   reader is looking at their cursor.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Check, Lock, Pencil, Send, ThumbsDown, ThumbsUp, UserRound } from "lucide-react";
import { Button, Card, Chip, Field, Modal, SaveButton, cn, useSaveState } from "@/components/ui";
import { Select } from "@/components/controls";
import { toast } from "@/components/toast";
import { USER } from "@/lib/data";
import { loadTeam, type TeamMember } from "@/lib/team-store";
import { REVISION_CHIP } from "@/lib/month-revision";
import { reopenMonth } from "@/lib/monthly-data";
import {
  REVIEW_STATE_LABEL,
  REVIEW_STATE_TONE,
  approveEditRequest,
  assignReviewer,
  confirmMonth,
  formatSubmissionDate,
  rejectEditRequest,
  submissionVersion,
  type MonthSubmission,
} from "@/lib/month-submission";
import { monthNameLong } from "@/lib/workspace";
import { useT } from "@/lib/i18n";

export function MonthReviewBar({
  submission,
  month,
  locked,
  onUnlock,
  onChanged,
  onReopened,
  canEdit = true,
}: {
  submission: MonthSubmission;
  month: string;
  /** true while the form is fixed. The bar owns the button; the page owns the
      state, because everything below it reads the same flag. */
  locked: boolean;
  onUnlock: () => void;
  onChanged: (next: MonthSubmission) => void;
  /** the month's readings have just gone back to draft — the page reloads them */
  onReopened?: () => void;
  canEdit?: boolean;
}) {
  const t = useT();
  const [assigning, setAssigning] = React.useState(false);
  const [team, setTeam] = React.useState<TeamMember[]>([]);
  const [reviewerId, setReviewerId] = React.useState("");
  const approve = useSaveState(1600);
  const reject = useSaveState(1600);

  React.useEffect(() => setTeam(loadTeam()), []);

  const submitted = submission.state !== "open";
  const tone = REVIEW_STATE_TONE[submission.state];
  const version = submissionVersion(submission);
  const pendingEdit = submission.editRequest?.state === "pending";

  const confirm = () => {
    onChanged(confirmMonth(submission.workspaceId, month, USER.name));
    toast({ message: `${monthNameLong(month)} confirmed`, detail: "It counts toward the year and stops appearing as outstanding.", tone: "ok" });
  };

  const hand = () => {
    const member = team.find((m) => m.id === reviewerId);
    if (!member) return;
    onChanged(assignReviewer(submission.workspaceId, month, member.id, member.name));
    setAssigning(false);
    toast({ message: `${member.name} is reviewing ${monthNameLong(month)}`, detail: "Certrace does not notify them yet — tell them.", tone: "info" });
  };

  /* APPROVING IS WHAT REOPENS IT. The decision and the unlock are one press,
     in one place: recording "approved" without putting the readings back into
     draft would leave the supplier looking at a request marked granted over a
     form that is still fixed. */
  const doApprove = () =>
    approve.run(() => {
      onChanged(approveEditRequest(submission.workspaceId, month, USER.name));
      reopenMonth(submission.workspaceId, month);
      onReopened?.();
    });

  const doReject = () =>
    reject.run(() => {
      onChanged(rejectEditRequest(submission.workspaceId, month, USER.name));
    });

  return (
    /* data-seat="allow" on the whole review card. Confirming a month and
       handing it to a named reviewer are both `reviewMonth` (lib/seat.ts) —
       this seat's own work — and the reviewer picker inside is a field, so
       the guard would otherwise freeze the one control the card exists for. */
    <div data-seat="allow">
      <Card className={cn("p-4 sm:p-5", submission.state === "changes_requested" && "border-[#fde68a] bg-[#fffbeb]")}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/40">{t("Review")}</span>
              <Chip tone={tone}>{t(REVIEW_STATE_LABEL[submission.state])}</Chip>
              {locked && submitted && (
                <span className="inline-flex items-center gap-1 text-[11px] text-black/40">
                  <Lock size={11} strokeWidth={1.5} /> {t("read-only")}
                </span>
              )}
            </div>

            {/* WHICH DOCUMENT, AND WHEN — see the header. Prose about
                provenance sat here and answered neither. */}
            {version ? (
              <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-mono text-[14px] tabular-nums text-black/80">{version.label}</span>
                <span className="text-[13px] text-black/50">· {formatSubmissionDate(version.at)}</span>
                {submission.attestation && (
                  <span className="text-[12.5px] text-black/40">
                    · {submission.attestation.fullName}
                    {submission.attestation.role ? ` · ${submission.attestation.role}` : ""}
                  </span>
                )}
              </p>
            ) : (
              <p className="mt-2 text-[12.5px] leading-relaxed text-black/45">
                {t("No version on file. Nothing has been submitted for this month yet.")}
              </p>
            )}

            {submission.state === "in_review" && submission.reviewerName && (
              <p className="mt-1 flex items-center gap-1.5 text-[12px] text-black/45">
                <UserRound size={12} strokeWidth={1.5} /> With {submission.reviewerName}.
              </p>
            )}
            {submission.state === "changes_requested" && submission.revisionNote && (
              <p className="mt-2 rounded-lg border border-black/[0.07] bg-white px-3 py-2 text-[12.5px] leading-relaxed text-black/60">
                <strong className="font-medium text-black/80">{t("You asked for:")}</strong> {submission.revisionNote}
              </p>
            )}
            {submission.state === "confirmed" && submission.confirmedBy && (
              <p className="mt-1 text-[12px] text-[#047857]">Confirmed by {submission.confirmedBy}.</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:flex-none">
            {/* EDIT IS THE WAY OUT OF READ-ONLY, and it is on the bar rather
                than beside each field: unlocking is one decision about the
                month, not thirty about individual boxes. */}
            {canEdit &&
              (locked ? (
                <Button size="sm" variant="secondary" onClick={onUnlock}>
                  <Pencil size={13} strokeWidth={1.5} /> {t("Edit")}
                </Button>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#111] bg-[#111] px-2.5 py-1.5 text-[11px] uppercase tracking-[0.08em] text-white">
                  <Pencil size={12} strokeWidth={1.5} /> {t("Editing")}
                </span>
              ))}

            {submitted && submission.state !== "confirmed" && (
              <>
                <Button size="sm" variant="secondary" onClick={() => setAssigning(true)}>
                  <Send size={13} strokeWidth={1.5} /> {t("Hand to a colleague")}
                </Button>
                <Button size="sm" onClick={confirm}>
                  <Check size={13} strokeWidth={2} /> {t("Confirm")}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ── The supplier is asking for the month back ────────
            Under the bar rather than beside it: it is a message from another
            company, and it needs the reason on screen next to the two answers
            to it. Both answers report on their own button. */}
        {submission.editRequest && (
          <div
            className={cn(
              "mt-4 rounded-xl border px-4 py-3.5",
              pendingEdit ? REVISION_CHIP : "border-black/[0.08] bg-[#faf9f7] text-black/55",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-pixel text-[10px] uppercase tracking-[0.16em]">
                {pendingEdit
                  ? "The supplier has asked to edit this month"
                  : submission.editRequest.state === "approved"
                    ? "You reopened this month"
                    : "You declined to reopen this month"}
              </span>
              <span className="text-[11px] opacity-60">
                {formatSubmissionDate(submission.editRequest.decidedAt ?? submission.editRequest.at)}
              </span>
            </div>

            <p className="mt-2 text-[13px] leading-relaxed text-black/70">
              <strong className="font-medium text-black/85">{t("They wrote:")}</strong> {submission.editRequest.reason}
            </p>

            {pendingEdit ? (
              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                <SaveButton
                  state={approve.state}
                  onClick={doApprove}
                  disabled={reject.state !== "idle"}
                  icon={<ThumbsUp size={13} strokeWidth={1.5} />}
                  idleLabel={t("Approve — reopen the month")}
                  savingLabel={t("Reopening…")}
                  savedLabel={t("Reopened")}
                />
                <SaveButton
                  state={reject.state}
                  variant="secondary"
                  onClick={doReject}
                  disabled={approve.state !== "idle"}
                  icon={<ThumbsDown size={13} strokeWidth={1.5} />}
                  idleLabel={t("Reject")}
                  savingLabel={t("Recording…")}
                  savedLabel={t("Rejected")}
                />
                <span className="text-[12px] leading-relaxed text-black/50">
                  {t("Approving puts their form back into draft. Rejecting leaves the month exactly as it is and tells them so.")}
                </span>
              </div>
            ) : (
              <p className="mt-2 text-[12px] text-black/45">
                {submission.editRequest.state === "approved"
                  ? `Reopened by ${submission.editRequest.decidedBy ?? "you"} — the supplier can change their figures and resubmit.`
                  : `Declined by ${submission.editRequest.decidedBy ?? "you"} — their form stayed closed.`}
              </p>
            )}
          </div>
        )}
      </Card>

      {/* ── Hand over ──────────────────────────────────────── */}
      <Modal
        open={assigning}
        onClose={() => setAssigning(false)}
        eyebrow={t("Review")}
        title={`Who should look at ${monthNameLong(month)}?`}
        lead={t("An assignment, not an approval — it records who is looking, so the month stops being everybody's job and nobody's.")}
        width="max-w-lg"
        footer={
          <>
            <Button size="sm" variant="secondary" onClick={() => setAssigning(false)}>
              {t("Cancel")}
            </Button>
            <Button size="sm" disabled={!reviewerId} onClick={hand}>
              {t("Hand it over")}
            </Button>
          </>
        }
      >
        <Field label={t("Reviewer")} hint={t("Anyone on your team. Suppliers are never reviewers of their own month.")}>
          <Select
            value={reviewerId}
            onChange={setReviewerId}
            options={team.map((m) => ({ value: m.id, label: m.name, hint: m.role }))}
            placeholder={team.length ? "Choose someone" : "Nobody on the team yet"}
            searchable={team.length > 8}
            ariaLabel={t("Reviewer")}
          />
        </Field>
        <p className="mt-4 text-[12px] leading-relaxed text-black/45">
          {t("Certrace does not notify them yet — this build has no mail service. Tell them, and the month will be waiting under their name.")}
        </p>
      </Modal>
    </div>
  );
}
