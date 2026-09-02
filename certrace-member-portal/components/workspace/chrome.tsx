"use client";

/* ════════════════════════════════════════════════════════════
   WORKSPACE CHROME — the seven tabs, and the vocabulary they share

   Everything visual that more than one workspace tab needs lives here, so the
   readiness colour of a tab means the same thing on the dashboard card, the
   tab strip, the Overview list and the Readiness cards. A state that renders
   amber in one place and green in another is worse than no colour at all.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, CalendarClock, Lock, User, Users } from "lucide-react";
import { cn, HelpTip, StatusDot, type Tone } from "@/components/ui";
import { READINESS_TABS, TAB_LABEL, TAB_STATE_LABEL, type ReadinessTab, type TabState } from "@/lib/readiness";
import { CADENCE_LABEL, OWNER_LABEL, RESPONSIBILITY } from "@/lib/responsibility";
import type { EntityTabSpec } from "@/lib/tree-entity";
import type { VerificationWorkspace } from "@/lib/workspace";
import { useT } from "@/lib/i18n";

/* complete → green · incomplete → amber · blocked → red · n/a → grey ·
   not_started → grey (distinct shade from n/a — see StateChip) ·
   pending → blue, because it is neither a gap nor a rule failure, it is
   "cannot be checked yet" and that is a different thing to tell the reader.
   Stated once; every surface reads it from here. */
export const STATE_TONE: Record<TabState, Tone> = {
  complete: "ok",
  incomplete: "warn",
  blocked: "err",
  not_applicable: "muted",
  not_started: "muted",
  pending: "info",
};

export const STATE_TEXT: Record<TabState, string> = {
  complete: "text-[#16a34a]",
  incomplete: "text-[#b45309]",
  blocked: "text-[#dc2626]",
  not_applicable: "text-black/35",
  not_started: "text-black/45",
  pending: "text-[#1d4ed8]",
};

export function StateChip({ state, className }: { state: TabState; className?: string }) {
  const t = useT();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em]",
        state === "complete"
          ? "border-[rgba(5,150,105,0.18)] bg-[#ecfdf5] text-[#047857]"
          : state === "blocked"
            ? "border-[rgba(220,38,38,0.18)] bg-[#fef2f2] text-[#dc2626]"
            : state === "incomplete"
              ? "border-[rgba(180,83,9,0.18)] bg-[#fffbeb] text-[#b45309]"
              : state === "pending"
                ? "border-[rgba(29,78,216,0.18)] bg-[#eff6ff] text-[#1d4ed8]"
                : state === "not_started"
                  ? "border-black/[0.08] bg-black/[0.02] text-black/50"
                  : "border-black/10 bg-black/[0.03] text-black/45",
        className,
      )}
    >
      <StatusDot tone={STATE_TONE[state]} />
      {t(TAB_STATE_LABEL[state])}
    </span>
  );
}

/** The compact 7-dot strip, one dot per tab in tab order. Small enough for a
    dashboard card, and the only place readiness is shown without words —
    which is why every dot carries a title attribute. */
export function DotStrip({ states, className }: { states: TabState[]; className?: string }) {
  const t = useT();
  return (
    <span className={cn("inline-flex items-center gap-1", className)} aria-label={t("Readiness by tab")}>
      {states.map((s, i) => (
        <span key={READINESS_TABS[i]} title={`${t(TAB_LABEL[READINESS_TABS[i]])}: ${t(TAB_STATE_LABEL[s])}`} className="inline-flex">
          <StatusDot tone={STATE_TONE[s]} />
        </span>
      ))}
    </span>
  );
}

/* ── The seven tabs ─────────────────────────────────────────────
   Nested routes rather than a query parameter, because the readiness rules
   emit deep links to exact fields — /workspaces/x/monthly/2026-03 has to be a
   real address a verifier or a colleague can be sent. */
export type WorkspaceTabKey = ReadinessTab | "overview" | "readiness" | "settings";
export type WorkspaceTab = { key: WorkspaceTabKey; label: string; href: string };

export function tabsFor(id: string): WorkspaceTab[] {
  return [
    { key: "overview", label: "Overview", href: `/workspaces/${id}` },
    // No MMD tab and no Precursors tab. Both live inside Monthly data now —
    // see the header of app/(portal)/workspaces/[id]/monthly/page.tsx. Their
    // ROUTES still exist and are still where the editing happens, so every
    // readiness deep link, verifier link and bookmark keeps working; what
    // changed is that you reach them from the month they belong to rather than
    // from a tab that implied a separate, annual job.
    { key: "monthly", label: "Monthly data", href: `/workspaces/${id}/monthly` },
    // No Evidence tab. Evidence is not a kind of work, it is the document
    // behind a figure — so it renders inside the MMD, inside each month and
    // inside the precursor chain, next to the figure it substantiates. A tab
    // for it only ever meant "upload it all in December", by which time the
    // March gas bill is gone. Readiness still reports coverage across all of
    // them, because THAT is an annual question.
    { key: "readiness", label: "Readiness", href: `/workspaces/${id}/readiness` },
    // Last, and deliberately after Readiness: it is the only tab that is about
    // the workspace rather than about the year's data.
    { key: "settings", label: "Settings", href: `/workspaces/${id}/settings` },
  ];
}

export function TabStrip({
  workspace,
  states,
}: {
  workspace: VerificationWorkspace;
  states: Partial<Record<ReadinessTab, TabState>>;
}) {
  const t = useT();
  const pathname = usePathname();
  const tabs = tabsFor(workspace.id);

  return (
    <div className="flex items-center justify-between gap-3 border-b border-black/[0.06]">
      <nav className="-mx-1 flex flex-1 gap-1 overflow-x-auto pb-px" aria-label={t("Workspace sections")}>
        {/* `tab`, not `t` — `t` is the translator in every component in this
            codebase, and shadowing it here left the whole tab strip in English
            while the page around it was Thai. */}
        {tabs.map((tab) => {
          const active = tab.href === `/workspaces/${workspace.id}` ? pathname === tab.href : pathname.startsWith(tab.href);
          const state = tab.key === "overview" ? undefined : states[tab.key as ReadinessTab];
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={cn(
                "flex flex-none items-center gap-2 rounded-t-xl border-b-2 px-3 py-2.5 text-[13px] transition-colors",
                active ? "border-[#111] text-black" : "border-transparent text-black/45 hover:text-black/75",
              )}
            >
              {state && <StatusDot tone={STATE_TONE[state]} />}
              {t(tab.label)}
            </Link>
          );
        })}
      </nav>
      {/* No Supply Chain button here any more. The chain is the level ABOVE
          these tabs — it is the page a product card opens, and the four tabs
          belong to the installation you reach by clicking into it — so the
          way back to it is the identity bar's own back link, which says
          "Supply chain" on every one of these tabs. A second control pointing
          at the same place would make the reader pick between two arrows to
          undo one click. */}
    </div>
  );
}

/* ── The identity bar ───────────────────────────────────────────
   WHAT YOU ARE LOOKING AT, DIRECTLY ABOVE THE TABS THAT ACT ON IT.

   A tab strip on its own says which VIEW you are in and nothing about which
   OBJECT the view is of. Inside a workspace that gap is survivable — there is
   only ever one product. The moment the chain gained pages of its own it
   stopped being survivable: "Monthly data" above a precursor and "Monthly
   data" above the finished good are the same three words over two different
   things, and a reader forty rows into a fuel table has no way to tell which
   one they are filling in.

   So one bar, three parts, always in the same order: where BACK goes, WHAT
   this is, and HOW IT IS DOING. Deliberately two short rows rather than the
   tall title block this replaced — it is pinned, and every pixel it takes is
   a pixel of the table underneath it.

   `right` is the status end of the bar: readiness percentage and state chip
   for a workspace, node status for an entity. It is right-aligned and
   baseline-aligned with the title, so the eye reads name → identity → state
   in one pass. */
export function IdentityBar({
  back,
  title,
  meta,
  right,
}: {
  back: { href: string; label: string };
  title: string;
  /** the one line that makes the title unambiguous — CN code, year, tier */
  meta?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <>
      <Link href={back.href} className="inline-flex items-center gap-1.5 text-[12px] text-black/40 transition-colors hover:text-black">
        <ArrowLeft size={13} strokeWidth={1.5} /> {back.label}
      </Link>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <h1 className="min-w-0 truncate font-[family-name:var(--font-plex)] text-[21px] font-light leading-tight tracking-tight text-[#111]">{title}</h1>
          {meta && <span className="font-mono text-[11.5px] text-black/40">{meta}</span>}
        </div>
        {/* flex-none so it is never squeezed by the title beside it, and
            flex-wrap so it folds onto its own lines instead of overflowing
            when it lands on a phone. Without the second half, a four-counter
            strip stayed 408px wide inside a 343px column and the last counter
            was simply cut off the right edge — the counter, not coincidentally,
            most often being "blocked". */}
        {/* THREE CLASSES, AND ALL THREE ARE LOAD-BEARING. `flex-none` so the
            strip is never squeezed by the title beside it. `flex-wrap` so it
            folds onto extra lines rather than overflowing. And `max-w-full`,
            which is the one that makes flex-wrap work at all: `flex-none` is
            `flex: 0 0 auto`, so without a width cap the container sizes itself
            to max-content and there is never a boundary for its children to
            wrap at. That is why a four-counter strip sat 408px wide inside a
            343px column on a phone and had its last counter cut off — the
            counter, not coincidentally, most often being "blocked". */}
        {right && <div className="flex max-w-full flex-none flex-wrap items-center gap-x-3 gap-y-1.5">{right}</div>}
      </div>
    </>
  );
}

/* ── The entity tab strip ───────────────────────────────────────
   Same four tabs, same order, same look as TabStrip above — because they mean
   the same thing, one object down. What differs is that an entity in the
   chain does not always HAVE all four: an installation has no reporting year,
   and a precursor has no months until somebody creates a workspace for it.

   Those tabs render locked rather than missing. A strip whose shape changes
   from node to node has to be re-read on every node; a locked tab is read
   once and understood, and it carries the one sentence that says what would
   open it. See lib/tree-entity.ts's entityTabs() for where that sentence is
   decided. */
export function EntityTabStrip({ tabs, activeKey }: { tabs: EntityTabSpec[]; activeKey: EntityTabSpec["key"] }) {
  const t = useT();
  return (
    <div className="flex items-center justify-between gap-3 border-b border-black/[0.06]">
      <nav className="-mx-1 flex flex-1 gap-1 overflow-x-auto pb-px" aria-label={t("Entity sections")}>
        {/* `tab`, not `t` — see TabStrip above: shadowing the translator left
            this strip in English inside an otherwise Thai page. */}
        {tabs.map((tab) =>
          tab.href ? (
            <Link
              key={tab.key}
              href={tab.href}
              className={cn(
                "flex flex-none items-center gap-2 rounded-t-xl border-b-2 px-3 py-2.5 text-[13px] transition-colors",
                tab.key === activeKey ? "border-[#111] text-black" : "border-transparent text-black/45 hover:text-black/75",
              )}
            >
              {t(tab.label)}
            </Link>
          ) : (
            <span
              key={tab.key}
              title={tab.lockedReason ? t(tab.lockedReason) : undefined}
              aria-disabled="true"
              className="flex flex-none cursor-not-allowed items-center gap-1.5 border-b-2 border-transparent px-3 py-2.5 text-[13px] text-black/25"
            >
              <Lock size={11} strokeWidth={1.5} />
              {t(tab.label)}
            </span>
          ),
        )}
      </nav>
    </div>
  );
}

/* ── Who fills this in, and when ────────────────────────────────
   Rendered under the tab strip on every tab. Seven tabs that look identical
   are seven tabs an exporter treats identically — and they are not: three of
   them are somebody else's homework, one is due twelve times a year, and one
   is due every time a truck leaves. Saying so on the tab turns the workspace
   from a form into a schedule, which is the only shape in which a year of
   supplier chasing is actually manageable.

   It reads from lib/responsibility.ts rather than restating anything, so the
   declaration hierarchy's legend and this bar can never disagree. */
export function ResponsibilityBar({ tab }: { tab: WorkspaceTabKey }) {
  /* The four strings on this bar live as data in lib/responsibility.ts — one
     table, read by every tab — so they arrive here as English and are
     translated at the point of RENDER rather than at the point of definition.
     The dictionary is keyed by the English source string (see lib/i18n.tsx),
     so `t(someEnglishString)` resolves exactly as a literal would, and the
     table stays a plain module with no React in it. */
  const t = useT();
  const r = RESPONSIBILITY[tab];
  if (!r) return null;
  const supplierOwned = r.owner === "supplier";

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border-l-[3px] px-4 py-3 sm:flex-row sm:items-start sm:gap-4",
        supplierOwned ? "border-l-[#d97706] bg-[#fffbeb]" : "border-l-black/20 bg-[#faf9f7]",
      )}
    >
      <span className="flex flex-none items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.1em]",
            supplierOwned ? "border-[rgba(180,83,9,0.25)] bg-white text-[#b45309]" : "border-black/12 bg-white text-black/55",
          )}
        >
          {supplierOwned ? <Users size={11} strokeWidth={1.5} /> : <User size={11} strokeWidth={1.5} />}
          {t(OWNER_LABEL[r.owner])}
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-black/40">
          <CalendarClock size={11} strokeWidth={1.5} />
          {t(CADENCE_LABEL[r.cadence])}
        </span>
      </span>
      <p className={cn("min-w-0 text-[12.5px] leading-relaxed", supplierOwned ? "text-[#78350f]" : "text-black/55")}>
        <span className="font-medium">{t(r.due)}.</span> {t(r.yourJob)}
      </p>
    </div>
  );
}

/** Which tab a pathname is on — the layout needs it to pick the bar's copy,
    and deriving it from the URL keeps it correct for deep links into a month
    or a coverage row. */
export function tabKeyFromPath(pathname: string, id: string): WorkspaceTabKey {
  const rest = pathname.replace(`/workspaces/${id}`, "").replace(/^\//, "");
  if (!rest) return "overview";
  const head = rest.split("/")[0];
  // The Supply Chain page and every entity page under it ARE the precursor
  // chain — same work, same owner, same cadence — so they read the chain's
  // responsibility line rather than falling through to the Overview's, which
  // is what they used to do and which told a reader chasing a tier-3 supplier
  // to "keep the identity correct".
  if (head === "tree") return "precursors";
  const known: WorkspaceTabKey[] = ["mmd", "monthly", "precursors", "evidence", "readiness", "settings"];
  return known.find((k) => k === head) ?? "overview";
}

/* ── Small shared pieces ────────────────────────────────────── */

/* ── Section card ───────────────────────────────────────────────
   THE HELP TIP BELONGS BESIDE THE HEADING.

   It used to be passed in `actions`, which floats it to the card's top-RIGHT
   corner — the far end of a row whose left end is the thing it explains. At
   that distance a "?" reads as help for the card as a whole, or for whatever
   button it is sitting next to, and the reader has to guess. Beside the
   heading there is nothing to guess: it explains the words it is touching.

   `actions` still exists, for actual actions — "Add parameter", "Declare an
   exclusion" — which is what a top-right slot is for. */
export function SectionCard({
  title,
  blurb,
  help,
  helpTitle,
  actions,
  children,
  id,
  className,
}: {
  title: string;
  /** One line, at most. Anything longer belongs behind `help`. ReactNode
      rather than string so a single word in it can be emphasised — see the
      supplier form's "in English", which is an instruction the reader has to
      catch before they start typing, not decoration. */
  blurb?: React.ReactNode;
  help?: React.ReactNode;
  helpTitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
  /** Spacing only. The card owns its own look; what sits above it is the
      caller's business. */
  className?: string;
}) {
  return (
    <section id={id} className={cn("rounded-2xl border border-black/[0.07] bg-white p-5 sm:p-6", className)}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-[family-name:var(--font-plex)] text-lg font-light tracking-tight text-[#111]">{title}</h2>
            {help && <HelpTip title={helpTitle ?? title}>{help}</HelpTip>}
          </div>
          {blurb && <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-black/45">{blurb}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

/* ── Fact grid ──────────────────────────────────────────────────
   Label-above-value pairs plus an optional badge row — the "About the
   installation" read view. Started life inline on the workspace Overview
   page; pulled out here so the Supplier Portal's own "About the
   installation" section (app/p/[token]/page.tsx) renders identically rather
   than a visually-similar, separately-coded copy that could drift from it. */
export function FactGrid({
  rows,
  badges,
}: {
  rows: [label: string, value: React.ReactNode][];
  badges?: React.ReactNode;
}) {
  return (
    <>
      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-[11px] uppercase tracking-[0.1em] text-black/40">{k}</dt>
            <dd className="mt-1 text-[13px] text-black/75">{v}</dd>
          </div>
        ))}
      </dl>
      {badges && <div className="mt-4 flex flex-wrap items-center gap-2">{badges}</div>}
    </>
  );
}

/* ── Field-group heading ────────────────────────────────────────
   The same rule one level down: a label with its "?" attached, for groups
   inside a card that are not cards of their own. */
export function GroupHeading({
  children,
  help,
  helpTitle,
  actions,
}: {
  children: React.ReactNode;
  help?: React.ReactNode;
  helpTitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-black/55">
        {children}
        {help && <HelpTip title={helpTitle}>{help}</HelpTip>}
      </span>
      {actions}
    </div>
  );
}

/** A note the exporter should read but not act on immediately. `tone="warn"`
    for anything that changes what they should do next. */
export function Note({ tone = "muted", children }: { tone?: "muted" | "warn" | "err" | "info"; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-xl border-l-[3px] px-4 py-3 text-[13px] leading-relaxed",
        tone === "warn"
          ? "border-l-[#d97706] bg-[#fffbeb] text-[#78350f]"
          : tone === "err"
            ? "border-l-[#dc2626] bg-[#fef2f2] text-[#991b1b]"
            : tone === "info"
              ? "border-l-[#2563eb] bg-[#eff6ff] text-[#1e40af]"
              : "border-l-black/15 bg-[#faf9f7] text-black/55",
      )}
    >
      {children}
    </div>
  );
}

/** "Example" — reveals filled sample text inline, greyed, and NEVER writes it
    into the field. §A5 requires this on every MMD field; it is here rather
    than in the MMD page because the same affordance is useful wherever an
    exporter is asked for prose they have never written before.

    The label is the single word. "Show a worked example" describes the button
    rather than naming what is behind it, and a screen with eight of them
    spends eight lines saying "show". */
export function ExampleToggle({ example, label = "Example" }: { example: string; label?: string }) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        /* Reading an example is reading — see components/account-lock.tsx. */
        data-lock="allow"
        className="text-[11px] uppercase tracking-[0.1em] text-black/35 underline decoration-black/20 underline-offset-2 hover:text-black/60"
      >
        {open ? "Hide example" : label}
      </button>
      {open && (
        <p className="mt-1.5 rounded-lg border border-dashed border-black/10 bg-[#faf9f7] px-3 py-2 text-[12px] italic leading-relaxed text-black/40">
          {t(example)}
        </p>
      )}
    </div>
  );
}

/** Numbers in tables. Tabular figures so columns line up — a verifier scans
    these vertically, and proportional digits make that harder than it needs
    to be. */
export function Num({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("font-mono text-[12px] tabular-nums", className)}>{children}</span>;
}

export const fmt = (v: number, dp = 2): string =>
  Number.isFinite(v) ? v.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: dp }) : "—";

/** A hook that re-reads localStorage-backed data after mount.

    Every store in this build is browser-only, so the first server render has
    nothing. Reading in an effect keeps hydration honest instead of rendering
    a zero that flips to a real number a tick later. */
export function useClientData<T>(read: () => T, deps: React.DependencyList = []): [T | null, () => void] {
  const [value, setValue] = React.useState<T | null>(null);
  const refresh = React.useCallback(() => setValue(read()), deps); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    refresh();
  }, [refresh]);
  return [value, refresh];
}
