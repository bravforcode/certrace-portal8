"use client";

/* ════════════════════════════════════════════════════════════
   ENTER VERIFIED DATA — the last step of the chain's journey

   Everything that decides whether ONE entity's figure can be handed to a
   buyer lives in this one dialog, in the order the work happens:

     1  Ask the supplier      send them their own link and let them fill it
     2  Completeness          a score over every question this row has to
                              answer
     3  Saved versions        what changed, and when
     4  The supplier form     SupplierEditor, wrapped as-is — autosaved —
                              with the documents behind the figure attached
                              at the bottom of it

   THE TWO WAYS A FIGURE ARRIVES ARE BOTH HERE, in the order they are
   actually reached for. Most rows start with nothing, so the first thing in
   the dialog is the button that asks somebody else to fill it in; typing it
   in yourself is what you do when the report is already in your hand. A
   dialog that only offered the second one made the exporter the data-entry
   clerk for their whole supply chain.

   DOCUMENTS ARE PART OF THE FORM, not a block above it. Evidence attached
   two panels away from the fields it substantiates reads as a separate
   errand; attached at the foot of the same form, it is the last thing you
   do before the row is finished. It is the same SectionEvidence store the
   supplier's own /p/<token> form writes to, so a report attached on either
   side is the same file on the other.

   SupplierEditor is wrapped rather than rebuilt: same fields, same autosave,
   same four-check gate as editing the row from anywhere else — there is
   exactly one place these facts live. Its own "not yet complete" list is
   suppressed here (`showGaps={false}`) because the completeness meter above
   already carries the score, against the wider submission scope.

   ONE DIALOG FOR EVERY ROW, INCLUDING THE ONE AT THE TOP. The installation
   the product is made at used to open a different dialog: an installation
   form, a workspace-readiness meter and a panel of links out to the monthly
   screens. Same button, same place on the row, two differently-shaped
   screens — and the odd one out was the row that actually gets handed to a
   buyer. It now opens THIS dialog, against a chain-root supplier row
   (lib/chain-root-supplier.ts) seeded from the Installation record, so the
   exporter, the supplier's own /p/<token> link and every tier in between are
   looking at one form.

   THIS DIALOG IS NOT "TRACK REPORT". Track report opens the workspace — the
   twelve months, the MMD, the readiness checklist — and that is where a
   report is BUILT. This is what goes out: the figure, the period it covers,
   the verification report behind it and the documents that stand it up. The
   panel of links into the workspace tabs that used to end the root's dialog
   is gone with that distinction, not despite it.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Check, Clock, Copy, History, Mail, Paperclip, Send } from "lucide-react";
import { Button, Modal, Progress, cn } from "@/components/ui";
import { SupplierEditor } from "@/components/precursor/supplier-editor";
import { SectionEvidence } from "@/components/workspace/evidence-panel";
import { precursorLinkFor } from "@/lib/precursor-link";
import type { RequiredKey } from "@/lib/workspace-evidence";
import { precursorCompleteness } from "@/lib/precursor-suppliers";
import type { SupplierNode } from "@/lib/precursor-suppliers";
import { formatVersionDate, listVersions, type PrecursorVersion } from "@/lib/precursor-versions";
import { useT } from "@/lib/i18n";

/* Shared chrome for the blocks around the editor — the same card shape the
   workspace tabs use, so this dialog does not invent a third look for a
   titled section. `action` is the top-right slot: a panel whose whole point
   is a button puts it on the title line, where the eye lands, rather than
   under a paragraph explaining it. */
function Panel({
  icon,
  title,
  blurb,
  tone = "plain",
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  blurb: React.ReactNode;
  /** "lead" is the one panel that is an ACTION rather than a reading — it
      carries the dialog's primary button, so it is tinted to be found
      without scrolling. */
  tone?: "plain" | "lead";
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-xl border p-4", tone === "lead" ? "border-black/[0.09] bg-[#faf9f7]" : "border-black/[0.07] bg-white")}>
      {/* THE BUTTONS DROP BELOW THE SENTENCE ON A NARROW SCREEN. Held on one
          row at every width, two uppercase buttons squeezed the title and the
          blurb into a four-word-wide column — "Ask the / supplier" over eight
          lines of ragged text, in a dialog whose whole first impression is
          that panel. Same shape SectionCard already uses: stacked under 640,
          side by side above it. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 flex-none text-black/35">{icon}</span>
          <div className="min-w-0">
            <h3 className="text-[11px] uppercase tracking-[0.1em] text-black/55">{title}</h3>
            <div className="mt-1 text-[12px] leading-relaxed text-black/45">{blurb}</div>
          </div>
        </div>
        {action && <div className="flex flex-wrap items-center gap-2 sm:flex-none sm:justify-end">{action}</div>}
      </div>
      {children && <div className="mt-3.5">{children}</div>}
    </section>
  );
}

/* ── 1. Ask the supplier ────────────────────────────────────────
   The send action, on the screen where somebody discovers they have nothing
   to type in. Wired to the caller's handler rather than reimplemented —
   reuse the token, stamp the timestamps once, copy the URL — so this and the
   chain's own send path cannot drift on what "sent" means.

   THE EMAIL IS SHOWN, NOT ASSUMED. It is the address the arrangement runs
   on, and the one field that silently breaks everything when it is wrong,
   so it is printed with the sentence it belongs to rather than left to be
   trusted.

   ONE SEND A DAY, UNLIMITED COPIES. Sending is somebody else's inbox, and a
   second identical ask an hour after the first is how a supplier learns to
   ignore this chain; copying the URL touches nobody, so it is never
   throttled. The throttle is not advertised in the copy — it only speaks up
   at the moment somebody presses the button again. */
const RESEND_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Whole hours left before this link may be sent again — 0 when it may be
    sent now. Rounded UP and floored at 1, so a link with eleven minutes left
    on it never reports "0 hours" and then refuses. */
function hoursUntilResend(node: SupplierNode): number {
  const last = node.smartLinkLastSentAt ?? node.smartLinkSentAt;
  if (!last) return 0;
  const elapsed = Date.now() - new Date(last).getTime();
  if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed >= RESEND_WINDOW_MS) return 0;
  return Math.max(1, Math.ceil((RESEND_WINDOW_MS - elapsed) / (60 * 60 * 1000)));
}

/* ── Feedback lives IN the button, not in a corner of the screen ──
   Copy link and Send link both used to answer with a toast. That is the
   wrong shape for this panel twice over: the toast lands at the edge of the
   viewport while the reader is still looking at the button they just
   pressed, and it leaves whether or not it was read — so "did that work?"
   is a question the interface answers somewhere else, briefly. A button
   that says what it did, where it was pressed, needs none of that trust.

   Anything the toast was carrying that does not fit on a button — why a
   resend was refused, what "send" actually means in a build with no mail
   server behind it — stays on the panel as a line that can be re-read. */
const FLASH_MS = 2200;

function useFlash(ms = FLASH_MS): readonly [boolean, () => void] {
  const [on, setOn] = React.useState(false);
  const timer = React.useRef<number | null>(null);
  React.useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  const fire = React.useCallback(() => {
    setOn(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOn(false), ms);
  }, [ms]);
  return [on, fire] as const;
}

/** The panel's own status line — what the toast used to say, kept on the
    panel so it survives being looked away from. */
function PanelNote({ tone, children }: { tone: "ok" | "warn"; children: React.ReactNode }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-lg border-l-[3px] px-3 py-2 text-[12px] leading-relaxed",
        tone === "ok" ? "border-l-[#047857] bg-[#ecfdf5] text-[#047857]" : "border-l-[#b45309] bg-[#fffbeb] text-[#b45309]",
      )}
    >
      {children}
    </p>
  );
}

function AskSupplierPanel({ node, onSend }: { node: SupplierNode; onSend?: () => void }) {
  const t = useT();
  const email = (node.contactEmail ?? "").trim();
  const sent = Boolean(node.smartLinkSentAt);

  const [copied, flashCopied] = useFlash();
  const [justSent, flashSent] = useFlash(2600);
  const [note, setNote] = React.useState<{ tone: "ok" | "warn"; text: string } | null>(null);

  /* THE SEND IS NOT THIS COMPONENT'S, so the button does not congratulate
     itself on the click. ChainEditor owns it, and on a row that has been
     asked before it takes a detour through a resend confirmation first — a
     button that flashed "Sent" on mousedown would be lying to anyone who
     then pressed Cancel. So it watches the row's own last-sent stamp and
     animates when that actually moves, which is true on both paths and on
     neither if the dialog is dismissed. */
  const lastSentAt = node.smartLinkLastSentAt ?? node.smartLinkSentAt ?? null;
  const seen = React.useRef<string | null>(lastSentAt);
  React.useEffect(() => {
    if (lastSentAt === seen.current) return;
    seen.current = lastSentAt;
    flashSent();
    setNote({
      tone: "ok",
      text: `Link copied to your clipboard — paste it wherever you reach ${node.name || "this supplier"}. This build does not send the email itself.`,
    });
  }, [lastSentAt, node.name, flashSent]);

  const send = () => {
    const wait = hoursUntilResend(node);
    if (wait > 0) {
      setNote({
        tone: "warn",
        text: `Already sent today. You can send this link again in ${wait} hour${wait === 1 ? "" : "s"} — Copy link works any time in the meantime.`,
      });
      return;
    }
    setNote(null);
    onSend?.();
  };

  const copy = () => {
    const url = precursorLinkFor(node.workspaceId, node.id);
    if (!url) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) void navigator.clipboard.writeText(url).catch(() => {});
    flashCopied();
  };

  return (
    <Panel
      icon={<Send size={14} strokeWidth={1.5} />}
      title={t("Ask the supplier")}
      tone="lead"
      /* THE EMAIL RIDES WITH THE SENTENCE IT BELONGS TO. It used to sit in
         the panel's body slot, which starts at the card's own padding — so
         the one fact that decides whether any of this works was the only
         thing on the panel not lined up with "Ask the supplier" and "Send
         this precursor…". It is the address the arrangement runs on, and
         still printed rather than assumed: it is the field that silently
         breaks everything when it is wrong. */
      blurb={
        <>
          <span className="block">{t("Send this supplier their own link and they answer it themselves — no account, no spreadsheet coming back.")}</span>
          {email ? (
            <span className="mt-1.5 flex min-w-0 items-center gap-1.5 text-black/50">
              <Mail size={12} strokeWidth={1.5} className="flex-none text-black/30" />
              <span className="truncate font-mono text-[11.5px]">{email}</span>
            </span>
          ) : (
            <span className="mt-1.5 flex min-w-0 items-start gap-1.5 text-[#b45309]">
              <Mail size={12} strokeWidth={1.5} className="mt-0.5 flex-none" />
              <span>{t("No email on file — add one below, or the link has nowhere to go.")}</span>
            </span>
          )}
        </>
      }
      action={
        <>
          {/* Both carry a min-width so the label swap does not resize the
              button under the cursor — a control that jumps as it succeeds
              reads as a control that broke. */}
          <Button
            size="sm"
            variant="secondary"
            onClick={copy}
            className={cn("min-w-[7.75rem]", copied && "border-[rgba(5,150,105,0.35)] bg-[#ecfdf5] text-[#047857] hover:border-[rgba(5,150,105,0.35)] hover:bg-[#ecfdf5] hover:text-[#047857]")}
          >
            {copied ? <Check size={13} strokeWidth={1.5} /> : <Copy size={13} strokeWidth={1.5} />}
            {copied ? "Copied" : "Copy link"}
          </Button>
          {onSend && (
            <Button size="sm" onClick={send} className={cn("min-w-[8.5rem]", justSent && "bg-[#047857] hover:bg-[#047857]")}>
              {justSent ? <Check size={13} strokeWidth={1.5} /> : <Send size={13} strokeWidth={1.5} />}
              {justSent ? "Sent" : sent ? "Resend link" : "Send link"}
            </Button>
          )}
        </>
      }
    >
      {note && (
        <PanelNote tone={note.tone}>
          {note.tone === "ok" ? (
            <Check size={13} strokeWidth={1.5} className="mt-0.5 flex-none" />
          ) : (
            <Clock size={13} strokeWidth={1.5} className="mt-0.5 flex-none" />
          )}
          <span>{note.text}</span>
        </PanelNote>
      )}
    </Panel>
  );
}

/* ── 2. Completeness ────────────────────────────────────────────
   A score, not a warning. The gap list on its own could only ever say what
   was still missing, which reads as failure from the first keystroke to the
   last; the same facts counted against a denominator say "you are 12 of 17
   through", which is the sentence that keeps somebody filling the form in.

   The LIST is gone with it. Every field it named is marked required on the
   form itself a few centimetres below, so the list was the same information
   twice — once as a wall of red before you had typed anything.

   The denominator moves with the row (see precursorRequirements): a scrap
   input is not missing an emissions figure, so a finished scrap row reads
   100% rather than 90%. */
function CompletenessPanel({ node }: { node: SupplierNode }) {
  const t = useT();
  const c = precursorCompleteness(node, "submission");
  const done = c.outstanding.length === 0;

  return (
    <Panel
      icon={<Check size={14} strokeWidth={1.5} />}
      title={t("Completeness")}
      blurb={
        done
          ? "Every question this supplier has to answer has an answer."
          : "Every question this supplier has to answer, and how many of them have an answer so far."
      }
    >
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[12.5px] text-black/60">
          <span className="font-mono tabular-nums text-black/80">
            {c.answered} of {c.total}
          </span>{" "}
          answered
        </span>
        <span className={cn("font-mono text-[13px] tabular-nums", done ? "text-[#047857]" : "text-black/45")}>{c.percent}%</span>
      </div>
      <Progress value={c.percent} tone={done ? "ok" : "warn"} />
    </Panel>
  );
}

/* ── 3. Saved versions ──────────────────────────────────────────
   What autosave owes back. Directly under the score, because both answer
   "where is this row up to" — one as a number, one as a history. See
   lib/precursor-versions.ts for why there is no restore button here. */
function VersionsPanel({ versions }: { versions: PrecursorVersion[] }) {
  const t = useT();
  const [expanded, setExpanded] = React.useState(false);
  // Three is enough to see that it is working and when it last moved;
  // anything older is a question somebody asks deliberately.
  const shown = expanded ? versions : versions.slice(0, 3);

  return (
    <Panel
      icon={<History size={14} strokeWidth={1.5} />}
      title={t("Saved versions")}
      blurb={
        versions.length === 0
          ? "This form saves itself as you type. Each save that changes something is kept here, with its date."
          : "This form saves itself as you type. Each save that changed something is listed with its date and what moved."
      }
    >
      {versions.length === 0 ? (
        <p className="text-[12px] text-black/40">{t("Nothing saved yet — the first change you make becomes version 1.")}</p>
      ) : (
        <>
          <ul className="divide-y divide-black/[0.05]">
            {shown.map((v, i) => (
              <li key={v.version} className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 py-2 text-[12.5px]">
                <span className="font-mono text-[11.5px] tabular-nums text-black/70">v{v.version}</span>
                <span className="text-black/55">{formatVersionDate(v.savedAt)}</span>
                {/* The newest one is the row as it stands — worth saying, so
                    nobody reads the list as a stack of drafts behind a
                    fourth, current, invisible one. */}
                {i === 0 && !expanded && <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-black/40">{t("Current")}</span>}
                <span className="min-w-0 flex-1 truncate text-[11.5px] text-black/35" title={v.changed.join(", ")}>
                  {v.changed.length === 0 ? "First recorded" : v.changed.join(", ")}
                </span>
              </li>
            ))}
          </ul>
          {versions.length > 3 && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mt-2 text-[11px] uppercase tracking-[0.1em] text-black/45 underline decoration-black/20 underline-offset-2 hover:text-black"
            >
              {expanded ? "Show fewer" : `Show all ${versions.length}`}
            </button>
          )}
        </>
      )}
    </Panel>
  );
}

export function TreeVerifiedDataModal({
  node,
  onClose,
  onSaved,
  onSend,
  eyebrow = "Precursor",
}: {
  node: SupplierNode | null;
  onClose: () => void;
  onSaved: () => void;
  /** sends this precursor's Smart Link — the caller's own send handler, so
      the dialog and the chain cannot disagree on what sending means */
  onSend?: () => void;
  /** Which KIND of row this is — the only thing that differs between opening
      this on a precursor and opening it on the installation at the top of the
      chain. One word above the title, so the reader can tell which row they
      pressed; everything below it is the same dialog either way. */
  eyebrow?: string;
}) {
  const t = useT();
  /* Bumped on every attach/remove so the editor re-reads which file is bound
     to this row. SupplierEditor keeps `verificationReportFileId` pointed at
     whatever the Documents block holds, and without a version to watch, a
     report attached in the block below it would not reach the row until the
     dialog was closed and reopened. */
  const [evidenceVersion, setEvidenceVersion] = React.useState(0);
  const [versions, setVersions] = React.useState<PrecursorVersion[]>([]);

  const workspaceId = node?.workspaceId;
  const nodeId = node?.id;

  // localStorage, so read after mount rather than during render — and again
  // whenever an autosave records one.
  const reloadVersions = React.useCallback(() => {
    if (!workspaceId || !nodeId) return;
    setVersions(listVersions(workspaceId, nodeId));
  }, [workspaceId, nodeId]);

  React.useEffect(() => reloadVersions(), [reloadVersions]);

  const evidenceKeys: RequiredKey[] = node
    ? [{ key: `precursor:${node.id}`, label: `${node.name || "Unnamed precursor"} — emissions figure` }]
    : [];

  return (
    <Modal
      open={node != null}
      onClose={onClose}
      eyebrow={t(eyebrow)}
      title={node ? `Enter verified data — ${node.name || "Unnamed supplier"}` : "Enter verified data"}
      lead={t("Send the supplier their own link, or record a report you already hold — it is all on this one screen, and it saves as you go.")}
      width="max-w-3xl"
      footer={
        <Button size="sm" variant="secondary" onClick={onClose}>
          {t("Close")}
        </Button>
      }
    >
      {node && (
        <div className="space-y-4">
          {/* Keyed on the row, so the copied/sent flashes and the panel's
              note belong to the precursor on screen and never carry over
              into the next one the reader opens. */}
          <AskSupplierPanel key={node.id} node={node} onSend={onSend} />

          <CompletenessPanel node={node} />

          <VersionsPanel versions={versions} />

          {/* The editor keeps its own frame — it is the row's full form, and
              boxing it a second time would nest three borders deep. The
              documents ride inside that same frame, at the foot of the form
              they belong to. */}
          <div className="overflow-hidden rounded-xl border border-black/[0.07]">
            <SupplierEditor
              node={node}
              onSaved={onSaved}
              evidenceVersion={evidenceVersion}
              showGaps={false}
              onVersionRecorded={reloadVersions}
            />

            <div className="border-t border-black/[0.06] bg-[#faf9f7] p-4">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex-none text-black/35">
                  <Paperclip size={14} strokeWidth={1.5} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[11px] uppercase tracking-[0.1em] text-black/55">{t("Documents")}</h3>
                  <p className="mt-1 text-[12px] leading-relaxed text-black/45">
                    {t("The verification report, and anything else that stands behind this figure.")}
                  </p>
                </div>
              </div>
              <div className="mt-3.5">
                <SectionEvidence
                  workspaceId={node.workspaceId}
                  keys={evidenceKeys}
                  emptyLabel={t("Nothing attached yet — this figure needs something behind it.")}
                  openable
                  onChange={() => setEvidenceVersion((v) => v + 1)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
