"use client";

/* ════════════════════════════════════════════════════════════
   SMART LINKS — everything this account has asked for, and of whom

   THIS SCREEN USED TO BE "INBOX", and the Inbox was a narrower thing: the
   monthly request for a workspace whose installation is the exporter's OWN
   site, which has nowhere to go because the person it would be emailed to is
   already sitting in the app. That case is real and it is still here — the
   `toSelf` rows — but it was never the whole picture, and having its own
   top-level destination made it look like it was.

   The whole picture is this: a workspace asks for twelve months of readings
   and a verified figure from every precursor supplier under it, and every one
   of those asks is a LINK somebody has to open and fill in. Before this page,
   those links could only be seen one workspace at a time, one tab at a time.
   Six workspaces is roughly a hundred live asks and no way to answer "which
   of these is late".

   ── WHAT IT DOES NOT DO ────────────────────────────────────────
   It is not a second source of truth. Every row is derived on read by
   lib/smart-links.ts from the workspaces, the dispatch records, the month
   submissions and the precursor rows — there is no smart-links store, and
   nothing here can drift out of step with the screens the data is actually
   entered on. Marking one sent writes to the SAME dispatch record the month
   card writes to, so the two surfaces cannot disagree about whether an ask
   went out.

   ── TWO FILTERS, BECAUSE THERE ARE TWO QUESTIONS ───────────────
   "What needs me today" is a STATE question, and "what kind of ask is this"
   is a KIND question, and an exporter asks them independently — "show me the
   late precursor links" is one filter each, not one of nine combined chips.
   Both carry live counts, because a filter whose result you cannot predict
   is a filter you press twice.

   ── THE ROW OPENS A DIALOG, NOT A NEW TAB ──────────────────────
   The old Inbox row was an anchor with target="_blank" straight into the
   month's form, on the reasoning that answering a request is a job you finish
   and come back from. That reasoning holds for the row's OWN case and not for
   this list, because most rows here are not yours to fill in: they belong to
   a supplier, and what the exporter needs from them is the LINK — to copy, to
   paste into a chat, to send. So the row opens a dialog that hands over the
   address and says where it stands, and the dialog offers the new tab for the
   one case where the exporter is also the person who fills it in.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { ArrowUpRight, Check, Copy, Link2, Send } from "lucide-react";
import { Button, ButtonLink, Card, Chip, EmptyState, FilterChip, PageHeader, Progress, StatusDot, Modal, cn, useFlash } from "@/components/ui";
import { ErrorState, LoadingState } from "@/components/query-state";
import { ActionButton } from "@/components/chain-actions";
import { useQueryClient } from "@tanstack/react-query";
import { MONTH_STATUS_LABEL } from "@/lib/monthly-data";
import { makePrecursorLinkToken } from "@/lib/precursor-link";
import { getSupplier } from "@/lib/precursor-suppliers";
import {
  countByKind,
  countByState,
  countdown,
  SMART_LINK_KIND_BLURB,
  SMART_LINK_KIND_LABEL,
  SMART_LINK_STATE_BLURB,
  SMART_LINK_STATE_LABEL,
  SMART_LINK_STATE_TONE,
  SMART_LINK_STATES,
  type SmartLink,
  type SmartLinkKind,
  type SmartLinkState,
} from "@/lib/smart-links";
import { scheduleFor, workspaceTitle } from "@/lib/workspace";
import { SMART_LINKS_KEY, useMarkMonthSent, useSmartLinks } from "@/lib/workspace-data-query";
import { ensureWorkspaceLink } from "@/lib/workspace-link-sync";
import { ensurePrecursorLink, pullAllPrecursorAnswers } from "@/lib/precursor-link-sync";
import { useSavePrecursorSupplier } from "@/lib/suppliers-query";
import { useFormat, useT, type TFunction } from "@/lib/i18n";

type StateFilter = SmartLinkState | "all";
type KindFilter = SmartLinkKind | "all";

/* THREE CASES, THREE SENTENCES. Built as a function rather than assembled
   inline from conditional fragments: the inline version produced "monthly data
   links." as a complete sentence whenever only the kind was filtered, which is
   a noun phrase with a full stop after it and reads as a bug. */
function emptyFilterLine(state: StateFilter, kind: KindFilter, t: TFunction): string {
  const s = state === "all" ? null : t(SMART_LINK_STATE_LABEL[state]);
  const k = kind === "all" ? null : t(SMART_LINK_KIND_LABEL[kind]);

  if (s && k) return t("No {kind} links are {state}.", { kind: k, state: s });
  if (s) return t("No links are {state}.", { state: s });
  if (k) return t("No {kind} links yet.", { kind: k });
  return t("Clear the filter to see every link.");
}

export default function SmartLinksPage() {
  const t = useT();
  /* The rows are a pure function of the stores, so re-deriving them IS the
     refresh — there is no local copy of a row to keep in step, and nothing to
     patch in place. The send mutations invalidate SMART_LINKS_KEY, which
     re-runs the derivation; no hand-wired refresh callback needed. */
  const { data: links, isError, refetch } = useSmartLinks();

  /* Precursor answers submitted on the producers' own machines land in the
     rows this page derives from (lib/precursor-link-sync.ts). */
  const client = useQueryClient();
  React.useEffect(() => {
    let live = true;
    void pullAllPrecursorAnswers()
      .then((changed) => {
        if (live && changed > 0) void client.invalidateQueries({ queryKey: SMART_LINKS_KEY });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [client]);

  const [state, setState] = React.useState<StateFilter>("all");
  const [kind, setKind] = React.useState<KindFilter>("all");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const all = React.useMemo(() => links ?? [], [links]);
  const stateCounts = React.useMemo(() => countByState(all), [all]);
  const kindCounts = React.useMemo(() => countByKind(all), [all]);

  const shown = all.filter((l) => (state === "all" || l.state === state) && (kind === "all" || l.kind === kind));
  const open = openId ? all.find((l) => l.id === openId) ?? null : null;

  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (links === undefined) return <LoadingState />;

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("Smart Links")}
        lead={t("Every request for data, and where it stands.")}
      />

      {all.length === 0 ? (
        <EmptyState
          icon={<Link2 size={28} strokeWidth={1.25} />}
          title={t("No links yet")}
          body={t("A product report gets one link for each month, and one for each precursor supplier.")}
          action={<ButtonLink href="/workspaces/new">{t("New product report")}</ButtonLink>}
        />
      ) : (
        <>
          <Filters
            state={state}
            kind={kind}
            onState={setState}
            onKind={setKind}
            stateCounts={stateCounts}
            kindCounts={kindCounts}
            total={all.length}
          />

          {shown.length === 0 ? (
            <Card className="px-6 py-10 text-center">
              <p className="text-[13.5px] text-black/55">{t("Nothing matches this filter.")}</p>
              <p className="mx-auto mt-1.5 max-w-md text-[12.5px] leading-relaxed text-black/40">{emptyFilterLine(state, kind, t)}</p>
              <div className="mt-4">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setState("all");
                    setKind("all");
                  }}
                >
                  {t("Clear the filter")}
                </Button>
              </div>
            </Card>
          ) : (
            <LinkTable links={shown} onOpen={setOpenId} />
          )}
        </>
      )}

      <LinkDialog link={open} onClose={() => setOpenId(null)} />
    </div>
  );
}

/* ── The two filters ────────────────────────────────────────────
   State on top, because it is the question asked on arrival; kind under it,
   because it narrows an answer rather than starting one. Each chip carries
   its own count so the reader can see what pressing it will cost them. */
function Filters({
  state,
  kind,
  onState,
  onKind,
  stateCounts,
  kindCounts,
  total,
}: {
  state: StateFilter;
  kind: KindFilter;
  onState: (s: StateFilter) => void;
  onKind: (k: KindFilter) => void;
  stateCounts: Record<SmartLinkState, number>;
  kindCounts: Record<SmartLinkKind, number>;
  total: number;
}) {
  const t = useT();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 font-pixel text-[10px] uppercase tracking-[0.16em] text-black/35">{t("Status")}</span>
        <FilterChip active={state === "all"} onClick={() => onState("all")} title={t("Every link.")}>
          {t("All")} · {total}
        </FilterChip>
        {SMART_LINK_STATES.map((s) => (
          <FilterChip key={s} active={state === s} onClick={() => onState(s)} title={t(SMART_LINK_STATE_BLURB[s])}>
            <StatusDot tone={SMART_LINK_STATE_TONE[s]} className="mr-1.5" />
            {t(SMART_LINK_STATE_LABEL[s])} · {stateCounts[s]}
          </FilterChip>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 font-pixel text-[10px] uppercase tracking-[0.16em] text-black/35">{t("Asking for")}</span>
        <FilterChip active={kind === "all"} onClick={() => onKind("all")} title={t("Both kinds.")}>
          {t("All")} · {total}
        </FilterChip>
        <FilterChip active={kind === "monthly"} onClick={() => onKind("monthly")} title={t(SMART_LINK_KIND_BLURB.monthly)}>
          {t(SMART_LINK_KIND_LABEL.monthly)} · {kindCounts.monthly}
        </FilterChip>
        <FilterChip active={kind === "verified_data"} onClick={() => onKind("verified_data")} title={t(SMART_LINK_KIND_BLURB.verified_data)}>
          {t(SMART_LINK_KIND_LABEL.verified_data)} · {kindCounts.verified_data}
        </FilterChip>
      </div>

      {/* THE SELECTED FILTER DEFINES ITSELF. "Send now" and "Late" are not
          self-explanatory words, and a reader who guesses wrong at what they
          mean acts on the wrong rows. One line, only for the filter actually
          on. */}
      {state !== "all" && <p className="text-[12px] leading-relaxed text-black/45">{t(SMART_LINK_STATE_BLURB[state])}</p>}
    </div>
  );
}

/* ── The table ──────────────────────────────────────────────────
   SEVEN COLUMNS ON A DESKTOP, THREE ON A PHONE, and the same rows either way.

   components/tree-table.tsx solves the narrow-window problem with one
   horizontal scroller and a 1400px minimum, and that is right for the chain:
   every row there carries an action strip, so there is no width at which the
   buttons stop needing their space. This table carries no buttons — it is a
   list you read and then tap one of — so the columns can simply stand down.

   What NEVER stands down is the subject, the status and the deadline. Those
   three are the reason to be on the page, so on a phone the deadline moves
   INTO the subject cell rather than off the screen, and the kind goes with
   it. Nothing is hidden without being re-said somewhere the reader can still
   see it; a column that disappears taking its fact with it is worse than a
   scrollbar. The remaining scroller is kept for the in-between widths where
   two columns are back and the third has not fitted yet. */
function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th scope="col" className={cn("whitespace-nowrap px-2 py-2.5 text-[10px] font-normal uppercase tracking-[0.1em] text-black/40 sm:px-3", className)}>
      {children}
    </th>
  );
}

/** The deadline, worded and coloured once so the cell and the phone-sized
    line under the subject cannot disagree. */
function deadlineTone(l: SmartLink): string {
  if (l.state === "done") return "text-black/35";
  if (l.overdue) return "text-[#dc2626]";
  return l.msLeft <= 3 * 864e5 ? "text-[#b45309]" : "text-black/50";
}

/** The month a link covers, spelled in the active language; a precursor link keeps its supplier's name. */
function useSubject() {
  const { date } = useFormat();
  return (l: SmartLink) => {
    if (l.kind !== "monthly" || !l.month) return l.subject;
    const [y, m] = l.month.split("-").map(Number);
    return date(new Date(y, m - 1, 1), { month: "long", year: "numeric" });
  };
}

function LinkTable({ links, onOpen }: { links: SmartLink[]; onOpen: (id: string) => void }) {
  const t = useT();
  const { date } = useFormat();
  const subjectOf = useSubject();
  return (
    <div className="overflow-x-auto rounded-2xl border border-black/[0.07] bg-white">
      {/* FIXED LAYOUT IS WHAT MAKES `truncate` WORK. In an auto-layout table a
          child with white-space:nowrap — which is what truncate sets — widens its
          column rather than ellipsising, so one long workspace title pushed the
          whole table past the phone it was meant to fit. Fixed layout honours the
          declared widths and lets the overflow do what it was asked to. */}
      <table className="w-full table-fixed border-collapse text-left">
        <thead>
          <tr className="border-b border-black/[0.07] bg-[#faf9f7]">
            <Th className="w-[46%] sm:w-[30%] sm:min-w-[170px]">{t("Request")}</Th>
            <Th className="hidden w-[150px] lg:table-cell">{t("Asking for")}</Th>
            <Th className="hidden w-[22%] min-w-[160px] md:table-cell">{t("Who fills it in")}</Th>
            {/* Sized to the longest label the vocabulary has, so a chip never
                wraps — a status that wraps is the row a reader stops trusting. */}
            <Th className="w-[116px] sm:w-[132px]">{t("Status")}</Th>
            <Th className="hidden w-[150px] sm:table-cell">{t("Deadline")}</Th>
            <Th className="hidden w-[120px] xl:table-cell">{t("Filled in")}</Th>
            <Th className="w-[40px] sm:w-[48px]">
              <span className="sr-only">{t("Open link")}</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {links.map((l) => (
            /* THE WHOLE ROW IS THE TARGET, and the last cell holds a real
               <button> carrying the same action. A mouse gets the row's full
               width; a keyboard gets one labelled control per row in the tab
               order, which a div with an onClick would not give either. */
            <tr
              key={l.id}
              onClick={() => onOpen(l.id)}
              className="cursor-pointer border-b border-black/[0.05] align-top transition-colors last:border-b-0 hover:bg-[#fafaf8]"
            >
              <td className="px-2 py-3 sm:px-3">
                <span className="block text-[13.5px] leading-snug text-black/80">{subjectOf(l)}</span>
                <span className="mt-0.5 block truncate text-[11.5px] text-black/40" title={workspaceTitle(l.workspace, t)}>
                  {workspaceTitle(l.workspace, t)}
                </span>

                {/* What the hidden columns were carrying, folded back in at
                    the widths that dropped them. */}
                <span className="mt-1 block text-[11px] text-black/40 lg:hidden">
                  {t(SMART_LINK_KIND_LABEL[l.kind])}
                  <span className="md:hidden"> · {t(l.recipient)}</span>
                </span>
                <span className={cn("mt-0.5 block font-mono text-[11px] sm:hidden", deadlineTone(l))}>
                  {l.state === "done" ? t("Deadline met") : countdown(l.msLeft, t, l.due)} · {date(l.due)}
                </span>
              </td>

              <td className="hidden px-3 py-3 lg:table-cell">
                <span className="text-[12.5px] text-black/60">{t(SMART_LINK_KIND_LABEL[l.kind])}</span>
                {/* Which of the three sources this link came from. A month
                    belonging to a workspace opened on a supplier's behalf is a
                    different conversation from one of your own plant's, and
                    the row is where that has to be said — the workspace title
                    alone does not carry it. */}
                {l.viaPrecursor && <span className="mt-0.5 block text-[11px] text-black/35">{t("Tracked for a precursor")}</span>}
              </td>

              <td className="hidden px-3 py-3 md:table-cell">
                <span className="block truncate text-[12.5px] text-black/60" title={t(l.recipient)}>
                  {t(l.recipient)}
                </span>
                {l.toSelf && <span className="mt-0.5 block text-[11px] text-black/35">{t("Lands on you")}</span>}
              </td>

              <td className="whitespace-nowrap px-2 py-3 sm:px-3">
                <Chip filled tone={SMART_LINK_STATE_TONE[l.state]} className="whitespace-nowrap">
                  {t(SMART_LINK_STATE_LABEL[l.state])}
                </Chip>
              </td>

              <td className="hidden whitespace-nowrap px-3 py-3 sm:table-cell">
                <span className={cn("block font-mono text-[11.5px]", deadlineTone(l))}>{l.state === "done" ? t("Met") : countdown(l.msLeft, t, l.due)}</span>
                <span className="mt-0.5 block font-mono text-[10.5px] text-black/30">{date(l.due)}</span>
              </td>

              <td className="hidden whitespace-nowrap px-3 py-3 xl:table-cell">
                {/* A month is all-or-nothing; a precursor form is a
                    percentage. Both are drawn the same way so the column means
                    one thing, with the month's own word underneath. */}
                <div className="w-[84px]">
                  <Progress value={l.percentComplete} tone={l.percentComplete >= 100 ? "ok" : l.overdue ? "err" : "warn"} />
                </div>
                <span className="mt-1 block font-mono text-[10.5px] text-black/35">
                  {l.monthStatus ? t(MONTH_STATUS_LABEL[l.monthStatus]) : `${l.percentComplete}%`}
                </span>
              </td>

              <td className="px-2 py-3 text-right sm:px-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen(l.id);
                  }}
                  aria-label={`${t("Open link")} · ${subjectOf(l)}`}
                  className="rounded-lg p-1.5 text-black/25 transition-colors hover:bg-black/[0.04] hover:text-black"
                >
                  <ArrowUpRight size={15} strokeWidth={1.5} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── One link, opened ───────────────────────────────────────────
   What the exporter came for: the address, in full, copyable — plus where it
   stands and the two presses that move it on. The link is shown as TEXT and
   not only behind a Copy button, because an exporter pasting it into LINE or
   a phone call needs to be able to read it, and because a copy that silently
   fails on a browser without clipboard permission leaves nothing behind. */
function LinkDialog({ link, onClose }: { link: SmartLink | null; onClose: () => void }) {
  const t = useT();
  const subjectOf = useSubject();
  const [copied, flashCopied] = useFlash();
  const [sent, flashSent] = useFlash();
  const markSent = useMarkMonthSent();
  const savePrecursor = useSavePrecursorSupplier();
  const client = useQueryClient();

  const localUrl = React.useMemo(() => (link && typeof window !== "undefined" ? `${window.location.origin}${link.path}` : ""), [link]);
  /* A link is minted on the server the moment it is looked at, so the
     address shown, copied and sent is one the supplier can open on their own
     machine (lib/workspace-link-sync.ts for a month, lib/precursor-link-sync.ts
     for a precursor). Without a backend it stays local. */
  const [serverUrl, setServerUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    setServerUrl(null);
    if (!link) return;
    const minting =
      link.kind === "monthly" && link.month
        ? ensureWorkspaceLink(link.workspace.id, link.month)
        : link.precursor
          ? ensurePrecursorLink(link.workspace.id, link.precursor.id)
          : null;
    if (!minting) return;
    let live = true;
    void minting
      .then((minted) => {
        if (live) setServerUrl(minted);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [link]);
  const url = serverUrl ?? localUrl;

  if (!link) return null;

  const copy = () => {
    if (!url) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) void navigator.clipboard.writeText(url).catch(() => {});
    flashCopied();
  };

  /* SENDING WRITES TO THE RECORD THE MONTH CARD READS. A month goes through
     lib/month-dispatch.ts, exactly as pressing Send on the workspace's own
     Monthly data tab does; a precursor stamps the same two fields the chain
     editor stamps. There is no third code path and no smart-links-only state,
     so an ask sent from here is indistinguishable from one sent from there —
     which is the point.

     Nothing is transmitted. Same honesty as everywhere else in this build:
     this records that the ask went out and puts the address on the clipboard
     for the exporter to paste. */
  const send = () => {
    if (link.kind === "monthly" && link.month) {
      markSent.mutate({ workspaceId: link.workspace.id, month: link.month, dueDay: scheduleFor(link.workspace).dueDay });
    } else if (link.precursor) {
      const row = getSupplier(link.workspace.id, link.precursor.id);
      if (!row) return;
      const now = new Date().toISOString();
      savePrecursor.mutate(
        {
          ...row,
          smartLinkToken: row.smartLinkToken ?? makePrecursorLinkToken(link.workspace.id, row.id),
          smartLinkSentAt: row.smartLinkSentAt ?? now,
          smartLinkLastSentAt: now,
        },
        /* The precursor mutation settles its own keys but not this page's
           list, which derives from the same rows — SMART_LINKS_KEY is
           exported for exactly this nudge. */
        { onSuccess: () => void client.invalidateQueries({ queryKey: SMART_LINKS_KEY }) },
      );
    }
    if (url && typeof navigator !== "undefined" && navigator.clipboard) void navigator.clipboard.writeText(url).catch(() => {});
    flashSent();
  };

  const workspaceHref = link.kind === "monthly" ? `/workspaces/${link.workspace.id}/monthly` : `/workspaces/${link.workspace.id}/precursors`;

  return (
    <Modal
      open
      onClose={onClose}
      eyebrow={t(SMART_LINK_KIND_LABEL[link.kind])}
      title={subjectOf(link)}
      lead={t(SMART_LINK_KIND_BLURB[link.kind])}
      footer={
        <>
          <Button size="sm" variant="secondary" onClick={onClose}>
            {t("Close")}
          </Button>
          <ButtonLink href={workspaceHref} variant="secondary" size="sm">
            {t("Open the product report")}
          </ButtonLink>
          <Button size="sm" onClick={send}>
            {sent ? (
              <>
                <Check size={13} strokeWidth={2} /> {t("Sent")}
              </>
            ) : (
              <>
                <Send size={13} strokeWidth={1.5} /> {link.sentAt ? t("Send again") : t("Send now")}
              </>
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Where it stands, in one line, before anything else. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Chip filled tone={SMART_LINK_STATE_TONE[link.state]}>{t(SMART_LINK_STATE_LABEL[link.state])}</Chip>
          <span className="text-[12.5px] text-black/50">{t(SMART_LINK_STATE_BLURB[link.state])}</span>
        </div>

        <Card warm className="p-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/35">{t("Link")}</span>
            <ActionButton onClick={copy} className="inline-flex flex-none items-center gap-1.5">
              {copied ? <Check size={11} strokeWidth={2} /> : <Copy size={11} strokeWidth={1.5} />}
              {copied ? t("Copied") : t("Copy link")}
            </ActionButton>
          </div>
          {/* break-all, not truncate: a token is unreadable either way, but a
              truncated one cannot be read aloud or checked against what was
              pasted. */}
          <p className="mt-2 break-all font-mono text-[11.5px] leading-relaxed text-black/60">{url}</p>
          <p className="mt-2.5 text-[12px] leading-relaxed text-black/40">
            {t("No account needed. Send marks it as asked and copies the link — paste it wherever you reach them.")}
          </p>
        </Card>

        <Facts link={link} />

        {/* The exporter's own months are the one case where the person
            filling this in is the person reading it — so the form itself is
            offered, in a new tab, exactly as the old Inbox row did. */}
        {link.toSelf && link.state !== "done" && (
          <ButtonLink href={`/workspaces/${link.workspace.id}/monthly/${link.month}`} external size="sm">
            {t("Fill this in yourself")} <ArrowUpRight size={13} strokeWidth={1.5} />
          </ButtonLink>
        )}
      </div>
    </Modal>
  );
}

/** The timeline, as facts rather than prose. Absent stages are shown as "—"
    rather than hidden, so the shape of the list is the same on every link and
    the reader learns where to look once. */
function Facts({ link }: { link: SmartLink }) {
  const t = useT();
  const { date } = useFormat();
  const stamp = (iso: string | null) => (iso ? date(new Date(iso)) : "—");

  const rows: [string, string][] = [
    [t("Who fills it in"), t(link.recipient)],
    [t("Product report"), workspaceTitle(link.workspace, t)],
    [t("Deadline"), `${date(link.due)} · ${link.state === "done" ? t("Met") : countdown(link.msLeft, t, link.due)}`],
    [t("First sent"), stamp(link.sentAt)],
    ...(link.resendCount > 0 ? ([[t("Chased"), t("{n} times · last {date}", { n: link.resendCount, date: stamp(link.lastSentAt) })]] as [string, string][]) : []),
    ...(link.kind === "verified_data" ? ([[t("Opened"), stamp(link.openedAt)]] as [string, string][]) : []),
    [t("Filled in"), link.answeredAt ? stamp(link.answeredAt) : link.monthStatus ? t(MONTH_STATUS_LABEL[link.monthStatus]) : t("{n}% answered", { n: link.percentComplete })],
  ];

  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-[10px] uppercase tracking-[0.1em] text-black/35">{label}</dt>
          <dd className="mt-1 break-words text-[13px] text-black/70">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
