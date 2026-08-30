"use client";

/* ════════════════════════════════════════════════════════════
   ASKING FOR A FIX, BY NAME

   The review bar has always carried "Ask for a fix", and it opened a dialog
   with one textarea in it. A sentence is how a person describes a problem to
   somebody sitting beside them; it is not how you hand work back across a
   company boundary to a plant that will read it three days later in their
   second language, against twenty screens of form.

   So a revision request is now TWO things, and the note is the second of them:

     · WHICH PARTS — checkboxes over lib/month-revision.ts, grouped by the step
       of the supplier's flow they live on. Each one carries a DOM anchor, and
       that anchor is what lets the supplier's own screen outline the field in
       blue and walk them to the first of them. A request that names nothing is
       still legal and reads on their side as "the whole month".

     · WHAT IS WRONG WITH THEM — the sentence, unchanged, because a checkbox
       says WHERE to look and never WHY.

   IT SITS AT THE FOOT OF THE MONTH, under the error list rather than in the
   bar at the top, because it is the decision those errors lead to. An exporter
   reading a month top to bottom arrives at "two errors" and then at the
   control that does something about them; the bar at the top is where they
   decide whether they are reviewing at all.

   WHICH VERSION GOES BACK is stated before the button, not after. If the
   exporter has already edited a figure, the supplier is being asked to revise
   the EXPORTER'S numbers — send them their own originals and they will either
   re-fix something already fixed or reply that it was right the first time.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Check, MessageSquareWarning, Undo2 } from "lucide-react";
import { Button, Field, SaveButton, inputClass, cn, useSaveState } from "@/components/ui";
import { SectionCard } from "@/components/workspace/chrome";
import { STEP_LABEL } from "@/lib/month-quality";
import { reopenMonth } from "@/lib/monthly-data";
import { AREAS_BY_STEP, REVISION_CHIP, resolveAreas } from "@/lib/month-revision";
import { formatSubmissionDate, requestRevision, type MonthSubmission } from "@/lib/month-submission";
import { monthNameLong } from "@/lib/workspace";
import { useT } from "@/lib/i18n";

export function RevisionRequestPanel({
  submission,
  month,
  disabled,
  onChanged,
  onReopened,
}: {
  submission: MonthSubmission;
  month: string;
  /** nothing has been submitted, so there is nobody to send it back to */
  disabled?: boolean;
  onChanged: (next: MonthSubmission) => void;
  /** the readings have gone back to draft — the page reloads them */
  onReopened?: () => void;
}) {
  const t = useT();
  const [picked, setPicked] = React.useState<string[]>([]);
  const [note, setNote] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const send = useSaveState(1600);

  /* A request already out is the state, not a form. Reopening the picker
     underneath it would offer a second request over the first, and the
     supplier would receive two lists of parts for one month. */
  const outstanding = submission.state === "changes_requested";
  const alreadyAsked = resolveAreas(submission.revisionAreas);

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const submitRequest = () => {
    if (!note.trim()) return;
    send.run(() => {
      onChanged(requestRevision(submission.workspaceId, month, note, picked));
      /* SENDING IT BACK IS WHAT REOPENS IT. A month left submitted while its
         state says "revision requested" is a form the supplier cannot type
         into under a list of things they have been asked to change — they
         would read the request, find every field locked, and reply asking to
         be let in. Asking for the fix IS granting access to make it. */
      reopenMonth(submission.workspaceId, month);
      onReopened?.();
      setOpen(false);
      setNote("");
      setPicked([]);
    });
  };

  if (outstanding) {
    return (
      <SectionCard
        title={t("Sent back for revision")}
        blurb={`${monthNameLong(month)} is with the supplier. Their link now opens on what you asked for, with each part outlined.`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]", REVISION_CHIP)}>
            <MessageSquareWarning size={12} strokeWidth={1.5} />
            Round {submission.revisionRound ?? 1} · sent {formatSubmissionDate(submission.revisionAt)}
          </span>
          {submission.revisionCarriedEdits && (
            <span className="inline-flex items-center rounded-full border border-[#fde68a] bg-[#fffbeb] px-2.5 py-1 text-[11px] text-[#b45309]">
              {t("Your edited version went back")}
            </span>
          )}
        </div>

        {submission.revisionNote && (
          <p className="mt-4 rounded-xl border border-black/[0.07] bg-[#faf9f7] px-4 py-3 text-[13px] leading-relaxed text-black/65">
            <strong className="font-medium text-black/80">{t("You asked for:")}</strong> {submission.revisionNote}
          </p>
        )}

        {alreadyAsked.length > 0 ? (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {alreadyAsked.map((a) => (
              <li key={a.id} className="flex items-start gap-2.5 rounded-xl border border-[rgba(60,122,203,0.25)] bg-[#eff6ff] px-3.5 py-2.5">
                <span className="mt-[6px] h-1.5 w-1.5 flex-none rounded-full bg-[#3C7ACB]" />
                <span className="min-w-0">
                  <span className="block text-[12.5px] text-black/80">{a.label}</span>
                  <span className="mt-0.5 block font-pixel text-[9.5px] uppercase tracking-[0.14em] text-black/35">{t(STEP_LABEL[a.step])}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-[12.5px] leading-relaxed text-black/45">
            {t("No particular part was named, so the whole month went back. Naming the parts next time is what puts a blue outline on their screen.")}
          </p>
        )}
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title={t("Ask for a revision")}
      helpTitle={t("What the supplier receives")}
      help={
        <>
          <p>{t("Everything you tick here is outlined in blue on their own screen, on the step it belongs to.")}</p>
          <p className="mt-2">{t("The first page of their link lists them, with a button that walks them to the first one.")}</p>
          <p className="mt-2">{t("The outline stays after they answer it, so a second round of questions is readable against the first.")}</p>
        </>
      }
      blurb={t("Name the parts that need another look, say what is wrong with them, and the month goes back.")}
      actions={
        !open && (
          <Button size="sm" variant="secondary" disabled={disabled} onClick={() => setOpen(true)}>
            <MessageSquareWarning size={13} strokeWidth={1.5} /> {t("Ask for a fix")}
          </Button>
        )
      }
    >
      {disabled ? (
        <p className="text-[13px] leading-relaxed text-black/45">
          Nothing has been submitted for {monthNameLong(month)} yet, so there is nobody to send it back to. Send the month&rsquo;s link from the
          Monthly data tab first.
        </p>
      ) : !open ? (
        <p className="text-[13px] leading-relaxed text-black/45">
          {submission.state === "confirmed"
            ? "You have confirmed this month. Asking for a revision reopens the conversation and puts it back with the supplier."
            : "A note on its own leaves them matching one sentence against twenty screens. Tick the parts as well and their screen marks them."}
        </p>
      ) : (
        <div className="space-y-5">
          {/* WHICH VERSION IS GOING, said before the button is pressed. */}
          <div
            className={cn(
              "rounded-xl border px-4 py-3 text-[12.5px] leading-relaxed",
              submission.editedByExporter ? "border-[#fde68a] bg-[#fffbeb] text-[#b45309]" : "border-black/[0.08] bg-[#faf9f7] text-black/55",
            )}
          >
            {submission.editedByExporter ? (
              <>
                <strong className="font-medium">{t("Your edited version is what goes back.")}</strong> {t("You have changed figures since this was submitted, so sending the original would ask them to fix something you have already fixed. They will see your numbers and revise from there.")}
              </>
            ) : (
              <>The version they submitted goes back unchanged. You have not edited it.</>
            )}
          </div>

          <div>
            <span className="mb-2 block text-[11px] uppercase tracking-[0.1em] text-black/55">
              Which parts {picked.length > 0 && <span className="text-black/35">· {picked.length} selected</span>}
            </span>
            <div className="grid gap-4 sm:grid-cols-2">
              {AREAS_BY_STEP.map((group) => (
                <div key={group.step} className="rounded-xl border border-black/[0.07] bg-[#faf9f7] p-3.5">
                  <div className="font-pixel text-[9.5px] uppercase tracking-[0.16em] text-black/40">{t(STEP_LABEL[group.step])}</div>
                  <div className="mt-2 space-y-1.5">
                    {group.areas.map((a) => {
                      const on = picked.includes(a.id);
                      return (
                        <label
                          key={a.id}
                          className={cn(
                            "flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 transition-colors",
                            on ? "border-[rgba(60,122,203,0.35)] bg-[#eff6ff]" : "border-transparent hover:bg-white",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => toggle(a.id)}
                            className="mt-0.5 h-3.5 w-3.5 flex-none accent-[#3C7ACB]"
                          />
                          <span className="min-w-0">
                            <span className="block text-[12.5px] leading-snug text-black/80">{a.label}</span>
                            <span className="mt-0.5 block text-[11.5px] leading-relaxed text-black/45">{a.hint}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-black/40">
              {t("Tick nothing and the whole month goes back with your note alone — which is what it used to do, and what leaves them guessing.")}
            </p>
          </div>

          <Field label={t("What is wrong with them")} hint={t("Name the figure and what is wrong with it. Required — a list of parts with no reason is a list of parts.")}>
            <textarea
              className={cn(inputClass, "min-h-[110px] resize-y py-2.5")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("The natural gas emission factor is 0.0561 tCO₂ per m³. It should be per GJ — please check the invoice and re-enter it.")}
            />
          </Field>

          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" variant="secondary" onClick={() => setOpen(false)} disabled={send.state !== "idle"}>
              <Undo2 size={13} strokeWidth={1.5} /> {t("Cancel")}
            </Button>
            <SaveButton
              state={send.state}
              onClick={submitRequest}
              disabled={!note.trim()}
              icon={<Check size={13} strokeWidth={2} />}
              idleLabel={picked.length > 0 ? `Send ${picked.length} part${picked.length === 1 ? "" : "s"} back` : "Send the month back"}
              savingLabel={t("Sending…")}
              savedLabel={t("Sent back")}
            />
          </div>
        </div>
      )}
    </SectionCard>
  );
}
