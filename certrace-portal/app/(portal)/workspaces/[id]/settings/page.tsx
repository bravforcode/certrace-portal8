"use client";

export const runtime = "edge";

/* ════════════════════════════════════════════════════════════
   WORKSPACE SETTINGS — the deadline, and how to put the workspace away

   A workspace is not a form that gets filled once. The same three sections are
   needed twelve times, from the same place, for a year. This screen sets the
   one date that rhythm is measured against: the last day a month's data can
   come in.

   THE REQUEST DAY IS NO LONGER A SETTING. It is the end of the month being
   reported, always — nobody can report January's gas before January has ended,
   and asking later than that only shortens the time the other end has. What
   remains a choice is the DEADLINE, because a supplier who closes their books
   on the 5th and one who closes on the 25th genuinely cannot share one.

   WHAT THE DEADLINE ACTUALLY DOES, and it matters that this is stated
   precisely: Readiness, the dashboard's late band and the Inbox all measure
   against it. It does NOT send anything — this build has no mail service — and
   the card says so on screen rather than leaving an exporter to infer delivery
   from a date picker.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Archive, Check } from "lucide-react";
import { Button, Field, cn } from "@/components/ui";
import { Select } from "@/components/controls";
import { toast } from "@/components/toast";
import { SectionCard } from "@/components/workspace/chrome";
import { useWorkspace } from "@/components/workspace/provider";
import { dueDayOptions, scheduleFor, workspaceTitle, type WorkspaceSchedule } from "@/lib/workspace";
import { useArchiveWorkspace, useUpdateWorkspace } from "@/lib/workspaces-query";
import { useOrdinal, useT } from "@/lib/i18n";


export default function WorkspaceSettingsPage() {
  const t = useT();
  const ordinal = useOrdinal();
  const { workspace, refresh } = useWorkspace();
  const router = useRouter();
  const updateWorkspace = useUpdateWorkspace();
  const archiveWorkspace = useArchiveWorkspace();
  const [armed, setArmed] = React.useState(false);

  /* No mirrored state: the schedule is a pure derivation of the provider's
     workspace, and the write below refreshes the provider before re-render. */
  const schedule = scheduleFor(workspace);

  /* THERE IS NOTHING TO SAVE. This card holds one dropdown with twenty-eight
     answers in it, and picking one WAS the decision — a Save button beside it
     only creates a state where the screen shows the 20th and the workspace is
     still measuring against the 15th, which is the state an exporter leaves
     the page in. Choosing writes it, and the sentence underneath restates what
     was chosen so the press is legible without a confirmation of its own. */
  const set = (p: Partial<WorkspaceSchedule>) => {
    // refresh() keeps the legacy provider in step until it reads from the query.
    updateWorkspace.mutate({ id: workspace.id, patch: { schedule: { ...schedule, ...p } } }, { onSuccess: refresh });
  };

  const archive = () => {
    if (!armed) {
      setArmed(true);
      return;
    }
    archiveWorkspace.mutate(workspace.id, {
      onSuccess: () => {
        toast({
          message: "Product report archived",
          detail: "It is out of the estate but nothing was deleted — restore it from Archived.",
          tone: "info",
        });
        router.push("/workspaces");
      },
    });
  };

  return (
    <div className="space-y-5">
      {/* ── The monthly loop ─────────────────────────────── */}
      <SectionCard
        title={t("Monthly deadline")}
        helpTitle={t("How the twelve months are asked for")}
        help={
          <>
            <p>{t("The same three sections — MMD, monthly data and precursors — are needed for every month of the reporting year.")}</p>
            <p className="mt-2">
              {t("A month can only be reported once it has ENDED, so each request is dated the last day of the month it covers. That is not a setting: asking earlier is impossible and asking later only shortens the time the other end has to answer.")}
            </p>
            <p className="mt-2">
              {t("The deadline below is the last date that month’s data may be sent. It is the date Readiness, the dashboard and the Inbox all measure “late” against.")}
            </p>
            <p className="mt-2">
              <strong>{t("Automatic sending is not connected yet.")}</strong> {t("Until the hosted service is live, you send each month’s link yourself from the Monthly data tab.")}
            </p>
          </>
        }
      >
        <p className="mb-5 text-[13px] leading-relaxed text-black/50">
          {workspace.selfSupplied
            ? t("This installation is yours, so the month appears in your own inbox once it has been sent — nothing needs to go to a third party.")
            : t("The deadline below is the one {name} is measured against.", { name: workspace.installationName })}
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
          {/* Read-only rather than absent: an exporter who cannot see when the
              request is dated will assume it is dated today, and then read
              every deadline as shorter than it is. */}
          <Field label={t("Request dated")} hint={t("Fixed — a month cannot be reported before it has ended.")}>
            <div className="flex h-[42px] items-center rounded-xl border border-black/[0.08] bg-black/[0.02] px-3.5 text-[13px] text-black/50">
              {t("The last day of the month")}
            </div>
          </Field>
          <Field label={t("Last date to send")} hint={t("Day of the month AFTER the one being reported.")}>
            <Select
              value={String(schedule.dueDay)}
              onChange={(v) => set({ dueDay: Number(v) })}
              options={dueDayOptions().map((d) => ({ value: String(d), label: t("{day} of the following month", { day: ordinal(d) }) }))}
              ariaLabel={t("Last date to send")}
            />
          </Field>
        </div>

        <p className="mt-4 text-[12.5px] leading-relaxed text-black/45">
          {t("Example: January {year} is asked on 31 January and due by the {day} of February.", { year: workspace.year, day: ordinal(schedule.dueDay) })}
        </p>

        {/* There is deliberately no "pause this product report" switch and no send
            time. A paused workspace is one whose twelve months quietly stop
            falling due while still counting toward readiness — which is the
            exact state that lets somebody reach December having asked for
            nothing. Stop a workspace by archiving it, or leave the months late
            and visible. */}
      </SectionCard>

      {/* There is deliberately NO "supplier link" card here any more.

         A workspace-wide link is the wrong object: the ask is always "send me
         March", never "send me the year", and a link that opens on whichever
         month the reader happens to land on is a link that collects the wrong
         month. Each month's box on the Monthly data tab carries its own link,
         and it appears there only after that month has been sent — so a link
         that exists is always a link somebody has actually been given. */}

      {/* ── Putting it away ──────────────────────────────────
         ARCHIVE, NOT DELETE. This card used to destroy the workspace and
         everything hanging off it, permanently, from a screen an exporter
         opens to change a due date. But the readings, the MMD and the
         precursor chain are the evidence behind a declaration that has
         already been filed — a verifier coming back to a closed year is the
         ordinary case. What an exporter actually wants when a year is over is
         for it to stop appearing on the dashboard, which is what archiving
         does and what deleting was being used for. */}
      <SectionCard
        title={t("Archive this product report")}
        helpTitle={t("What archiving does")}
        help={
          <>
            <p>
              {t("It leaves the active estate: off the dashboard, out of the Inbox, and no longer counted in Reports or Carbon & Cost. Its monthly readings, MMD drafts and precursor rows are untouched.")}
            </p>
            <p className="mt-2">
              {t("You can still open it, and you can restore it at any time from")} <strong>{t("Archived")}</strong> {t("on the Verification page.")}
            </p>
          </>
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] leading-relaxed text-black/50">{t("{title} — nothing is deleted, and you can restore it later.", { title: workspaceTitle(workspace, t) })}</p>
          <Button size="sm" variant="secondary" onClick={archive} className={cn("flex-none", armed && "border-black/30 text-black")}>
            {armed ? <Check size={13} strokeWidth={2} /> : <Archive size={13} strokeWidth={1.5} />}
            {armed ? t("Click to confirm archive") : t("Archive product report")}
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
