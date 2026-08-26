"use client";

/* ════════════════════════════════════════════════════════════
   THE VERIFICATION DASHBOARD

   The screen an exporter opens to answer one question: where are we, across
   everything we have to get verified?

   WHAT CHANGED AND WHY:

   · THE FILTERS ARE THE TWO THINGS AN EXPORTER ACTUALLY LOOKS FOR. They used
     to be "type" and "group", which are the catalogue's own axes — a taxonomy
     the reader has to already know to use. Nobody arrives at this screen
     thinking "show me the Iron & steel group"; they arrive thinking "where is
     the rebar one" or "what is outstanding at Rayong". So the filters are now
     INSTALLATION (by site, including your own) and GOOD (by name and CN code,
     which is what the customs declaration says). Year and readiness stay.

     INSTALLATION LEADS. It is the coarser cut and the one that matches how the
     page below is now grouped — supplier, then site, then goods. A filter pair
     ordered against the grouping underneath it reads as two different mental
     models of the same estate.

   · THE ESTATE IS SUPPLIER → INSTALLATION → GOOD. It used to be installation →
     good, which flattened away the level an exporter actually chases: two
     plants belonging to one mill read as two unrelated sites, and "where is
     G J Steel" had no single answer on the screen. The supplier is the
     headline, each of their plants a sub-heading, and that plant's goods the
     cards under it.

   · PAGINATION, on both views, PINNED TO THE BOTTOM. An estate of sixty
     workspaces is one scroll with no sense of position and no way to say "the
     ones I have not looked at". A page count is also the only honest answer to
     "how many are there" — a bare list implies you have seen them all. It is
     sticky because a pager that lives at the end of the content is a pager you
     have to scroll past everything to reach, on every page.

   · DRAFTS SIT BELOW THE FILTERS. A half-finished flow is a reminder, not a
     section: three abandoned drafts used to push every real workspace below
     the fold. One scrolling row, with arrows so it reads as scrollable rather
     than as three drafts and no more. Under the filters rather than above
     them, because the filters are the controls FOR the list and splitting them
     from it with an unrelated strip breaks that pairing.

   · A TABLE VIEW. Cards are the right shape for scanning a small estate and
     the wrong one for comparing thirty.

   · READINESS ON THE CARD, AS A PERCENTAGE. The dots say WHICH tab is behind;
     they do not say how much of the workspace is done, which is what an
     exporter tracks week to week, so a bar carries it. It measures READINESS
     rather than months submitted — on a complex good the precursor chain, the
     MMD and the evidence weigh as much as the readings, and "8 of 12 months"
     read as nearly finished while three tabs were still empty. Same figure as
     the workspace's own Readiness section, so the two never disagree.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  ArrowRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  Factory,
  LayoutGrid,
  PenLine,
  Plus,
  Search,
  Table2,
  Trash2,
} from "lucide-react";
import { Button, Card, Chip, EmptyState, PageHeader, Progress, TagBadge, cn } from "@/components/ui";
import { Select } from "@/components/controls";
import { toast } from "@/components/toast";
import { DotStrip, StateChip, useClientData } from "@/components/workspace/chrome";
import { WorkspaceMenu } from "@/components/workspace/workspace-menu";
import { getCatalogProduct } from "@/lib/config";
import { listInstallations } from "@/lib/installations";
import { getOrgIdentity } from "@/lib/org";
import { listSuppliers } from "@/lib/precursor-suppliers";
import { dotStates, workspaceReadiness, type TabState } from "@/lib/readiness";
import {
  groupBySupplier,
  listArchivedWorkspaces,
  listWorkspaces,
  restoreWorkspace,
  routeLabel,
  type VerificationWorkspace,
} from "@/lib/workspace";
import { deleteWorkspaceDraft, loadWorkspaceDrafts, type WorkspaceDraft } from "@/lib/workspace-drafts";
import { useT } from "@/lib/i18n";

type CardData = {
  workspace: VerificationWorkspace;
  overall: TabState;
  dots: TabState[];
  percent: number;
  precursors: number;
};

function toCards(workspaces: VerificationWorkspace[]): CardData[] {
  return workspaces.map((w) => {
    const readiness = workspaceReadiness(w);
    return {
      workspace: w,
      overall: readiness.overall,
      dots: dotStates(readiness),
      percent: readiness.percentComplete,
      precursors: listSuppliers(w.id).length,
    };
  });
}

const buildCards = (): CardData[] => toCards(listWorkspaces());

/* Read separately rather than filtered out of one list: listWorkspaces() is
   the ACTIVE estate everywhere in the portal, and having this screen be the
   one place that reads archived rows keeps that true. */
const buildArchivedCards = (): CardData[] => toCards(listArchivedWorkspaces());

/* ── Active or archived ─────────────────────────────────────────
   One screen, two scopes, and the archive is a SCOPE rather than a page of
   its own on purpose: it is the same estate, the same grouping and the same
   filters — a second route would be a second implementation of all three that
   could drift from this one. The toggle sits beside the search box, where the
   reader is already looking when they cannot find something. */
type Scope = "active" | "archived";

const STATES: { id: TabState; label: string }[] = [
  { id: "complete", label: "Complete" },
  { id: "incomplete", label: "Incomplete" },
  { id: "blocked", label: "Blocked" },
];

/* Nine and fifteen rather than one number for both: a card is three to a row on
   a wide screen, so nine fills exactly three rows and never leaves a ragged
   last one; a table row is a line, and fifteen is about a screen of them. */
const CARDS_PER_PAGE = 9;
const ROWS_PER_PAGE = 15;

export default function WorkspacesPage() {
  const t = useT();
  const router = useRouter();
  const [cards, refreshActive] = useClientData(buildCards);
  const [archivedCards, refreshArchived] = useClientData(buildArchivedCards);
  const [drafts, refreshDrafts] = useClientData(loadWorkspaceDrafts);

  /* Archiving moves a card BETWEEN the two lists, so both are re-read on any
     change. Refreshing only the one being looked at would leave the count on
     the other pill stale — the exact number the reader is about to use to
     decide whether the archive is worth opening. */
  const refresh = React.useCallback(() => {
    refreshActive();
    refreshArchived();
  }, [refreshActive, refreshArchived]);

  const [query, setQuery] = React.useState("");
  const [good, setGood] = React.useState("");
  const [installation, setInstallation] = React.useState("");
  const [year, setYear] = React.useState("");
  const [state, setState] = React.useState<TabState | "all">("all");
  const [view, setView] = React.useState<"cards" | "table">("cards");
  const [scope, setScope] = React.useState<Scope>("active");
  const [page, setPage] = React.useState(1);

  const active = React.useMemo(() => cards ?? [], [cards]);
  const archived = React.useMemo(() => archivedCards ?? [], [archivedCards]);
  /* Everything below this line — filters, grouping, paging, the empty states —
     is written against `all` and never asks which scope it is in. That is the
     point of a scope: the archive is the same screen, reading a different
     list. */
  const all = scope === "archived" ? archived : active;
  const years = React.useMemo(() => [...new Set(all.map((c) => c.workspace.year))].sort((a, b) => b - a), [all]);

  /* ── Goods, as the exporter's own estate contains them ──────
     Built from the workspaces on screen rather than from the 67-good
     catalogue: a filter listing goods you do not have is a list of dead ends,
     and the CN code rides along because that is the number on the customs
     declaration they are holding. */
  const goods = React.useMemo(() => {
    const seen = new Map<string, { value: string; label: string; hint: string }>();
    for (const c of all) {
      const w = c.workspace;
      const key = w.productId || w.productName;
      if (!key || seen.has(key)) continue;
      const cn = w.cnCode || getCatalogProduct(w.productId)?.cnCode || "";
      seen.set(key, { value: key, label: w.productName, hint: cn ? `CN ${cn}` : "" });
    }
    return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [all]);

  /* ── Installations, INCLUDING your own ──────────────────────
     The registered own-site is offered even when it has no workspace yet.
     Leaving it out made the exporter's own plant the one site they could not
     filter by, which is the site most of them work on most. */
  const installations = React.useMemo(() => {
    const seen = new Map<string, { value: string; label: string; hint: string }>();
    for (const c of all) {
      const w = c.workspace;
      if (!w.installationId || seen.has(w.installationId)) continue;
      seen.set(w.installationId, { value: w.installationId, label: w.installationName || w.installationId, hint: w.installationId });
    }
    for (const inst of listInstallations()) {
      if (seen.has(inst.id)) continue;
      seen.set(inst.id, { value: inst.id, label: inst.name || inst.id, hint: inst.self ? `${inst.id} · your site` : inst.id });
    }
    return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [all]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((c) => {
      const w = c.workspace;
      if (q && ![w.productName, w.cnCode, w.supplierName, w.installationName, w.installationId].some((f) => (f ?? "").toLowerCase().includes(q))) return false;
      if (good && (w.productId || w.productName) !== good) return false;
      if (installation && w.installationId !== installation) return false;
      if (year && String(w.year) !== year) return false;
      if (state !== "all" && c.overall !== state) return false;
      return true;
    });
  }, [all, query, good, installation, year, state]);

  const perPage = view === "table" ? ROWS_PER_PAGE : CARDS_PER_PAGE;
  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));

  // Narrowing the filters can leave the reader on a page that no longer
  // exists — which renders as an empty screen that looks like "no results"
  // when there are plenty, one page up.
  React.useEffect(() => {
    setPage((p) => Math.min(p, Math.max(1, Math.ceil(filtered.length / perPage))));
  }, [filtered.length, perPage]);
  React.useEffect(() => setPage(1), [query, good, installation, year, state, scope]);

  const paged = React.useMemo(() => filtered.slice((page - 1) * perPage, page * perPage), [filtered, page, perPage]);

  /* The exporter's own company name, for the "your own sites" heading. Read
     once on the client — getOrgIdentity() touches localStorage, so calling it
     during render would differ between the server pass and the first client
     pass and trip hydration. */
  const [selfName, setSelfName] = React.useState("Your own sites");
  React.useEffect(() => {
    const org = getOrgIdentity();
    if (org?.name) setSelfName(org.name);
  }, []);

  /* Grouping happens AFTER paging, so a page is always `perPage` workspaces
     however many suppliers and sites they span. Grouping first and then paging
     the groups would make page size depend on how many products a site has. */
  const grouped = React.useMemo(() => {
    const byId = new Map(paged.map((c) => [c.workspace.id, c]));
    return groupBySupplier(
      paged.map((c) => c.workspace),
      selfName,
    ).map((g) => ({
      ...g,
      installations: g.installations.map((inst) => ({
        ...inst,
        cards: inst.workspaces.map((w) => byId.get(w.id)!).filter(Boolean),
      })),
    }));
  }, [paged, selfName]);

  const filtering = Boolean(query.trim() || good || installation || year || state !== "all");
  const showingArchive = scope === "archived";

  const clear = () => {
    setQuery("");
    setGood("");
    setInstallation("");
    setYear("");
    setState("all");
  };

  const discardDraft = (id: string) => {
    deleteWorkspaceDraft(id);
    refreshDrafts();
  };

  const from = filtered.length === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, filtered.length);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("Verification")}
        title={t("Verification workspaces")}
        lead={t("One workspace per installation × product × reporting year. It is the screen you monitor each month, and the screen you hand to a verifier at the end of it.")}
        actions={
          /* Deliberately the full-size button rather than size="sm". This is
             the only action on the screen and the one an exporter arrives
             wanting; a small secondary-looking control was reading as a
             utility next to the page title. */
          <Button className="whitespace-nowrap" onClick={() => router.push("/workspaces/new")}>
            <Plus size={16} strokeWidth={1.5} /> {t("New workspace")}
          </Button>
        }
      />

      {/* ── Search · archive · filters ─────────────────────── */}
      {(active.length > 0 || archived.length > 0) && (
        <div className="space-y-3">
          {/* ONE TOOLBAR, and the archive is a control in it.

              It used to be a pair of ACTIVE / ARCHIVED tabs sitting above
              everything else, which is the shape a screen uses for two equal
              halves of one thing — Inbox and Sent, Open and Closed. The
              archive is not that. It is a small, cold, occasionally-visited
              corner of the estate, and giving it top billing spent the most
              valuable row on the page announcing a place almost nobody was
              going, while pushing the search box — the control people
              actually arrive using — a row further down.

              So it is now what it behaves like: a filter, in the toolbar,
              beside the other controls for the list. It still carries its
              count (so "is there anything in there" is answered before it is
              opened) and it still renders when the current scope is empty
              (so an archive is never a place you can only find once you have
              already been). Pressed, it fills black — leaving the default
              view should never be a state you are in by accident. */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search size={15} strokeWidth={1.5} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={showingArchive ? "Search archived workspaces…" : "Search by product, CN code, supplier or installation…"}
                aria-label={showingArchive ? "Search archived workspaces" : "Search workspaces"}
                className="w-full rounded-xl border border-black/10 bg-white py-2.5 pl-10 pr-4 text-sm text-black/70 placeholder:text-black/25 transition-colors focus:border-black/25 focus:outline-none"
              />
            </div>
            <div className="flex flex-none flex-wrap items-center gap-2 self-start sm:ml-auto sm:self-auto">
              <ArchiveToggle active={showingArchive} count={archived.length} onClick={() => setScope(showingArchive ? "active" : "archived")} />
              <div className="flex items-center gap-1 rounded-xl border border-black/10 bg-white p-1">
                <ViewToggle active={view === "cards"} onClick={() => setView("cards")} label={t("Cards")}>
                  <LayoutGrid size={15} strokeWidth={1.5} />
                </ViewToggle>
                <ViewToggle active={view === "table"} onClick={() => setView("table")} label={t("Table")}>
                  <Table2 size={15} strokeWidth={1.5} />
                </ViewToggle>
              </div>
            </div>
          </div>

          {/* THE TOOLBAR DOES NOT MOVE WHEN THE SCOPE DOES. Search, the two
              views and the four filters used to be gated on the CURRENT
              scope having rows, so opening an empty archive took the whole
              toolbar off the screen with it — pressing Archived looked like
              it had broken the page rather than filtered it. Switching scope
              now changes exactly one thing: which list is being read (and
              the pill's colour, saying so). The controls stay put, in the
              same place, doing the same job on the archive that they do on
              the active estate. */}
          {/* INSTALLATION FIRST. It is the coarser cut and it matches the
              supplier → site → good grouping below; a filter pair ordered
              against the grouping under it reads as two mental models of one
              estate. */}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <FilterSelect
              label={t("Installation")}
              value={installation}
              onChange={setInstallation}
              allLabel={t("All installations")}
              options={installations}
              searchable={installations.length > 8}
              searchPlaceholder={t("Site name or reference…")}
            />
            <FilterSelect
              label={t("Good")}
              value={good}
              onChange={setGood}
              allLabel={t("All goods")}
              options={goods}
              searchable={goods.length > 8}
              searchPlaceholder={t("Name or CN code…")}
            />
            <FilterSelect label={t("Year")} value={year} onChange={setYear} allLabel={t("All years")} options={years.map((y) => ({ value: String(y), label: String(y) }))} />
            <FilterSelect
              label={t("Readiness")}
              value={state === "all" ? "" : state}
              onChange={(v) => setState((v || "all") as TabState | "all")}
              allLabel={t("Any readiness")}
              options={STATES.map((s) => ({ value: s.id as string, label: s.label }))}
            />
          </div>

          {/* Drafts sit BELOW the filters: the filters are the controls for the
              list, and separating them from it with an unrelated strip breaks
              that pairing. They are still one scrolling line — a half-finished
              flow is a reminder, not a section. */}
          {!showingArchive && drafts && drafts.length > 0 && <DraftStrip drafts={drafts} onDiscard={discardDraft} />}

          {/* The COUNT is the one line that stays scope-gated: "No matches out
              of 0" over an empty archive is a sentence about nothing, and the
              empty state below already says what the archive is. */}
          {all.length > 0 && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11.5px] text-black/40">
                {filtered.length === 0 ? (
                  <>No matches out of {all.length}.</>
                ) : (
                  <>
                    Showing <strong className="font-medium text-black/60">{from}–{to}</strong> of {filtered.length}
                    {filtered.length === all.length ? "" : ` filtered`} {showingArchive ? "archived " : ""}workspace{filtered.length === 1 ? "" : "s"}.
                  </>
                )}
              </p>
              {filtering && (
                <button onClick={clear} className="text-[11px] uppercase tracking-[0.1em] text-black/40 underline decoration-black/20 underline-offset-2 hover:text-black">
                  {t("Clear filters")}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Body ───────────────────────────────────────────── */}
      {cards === null ? null : all.length === 0 && showingArchive ? (
        <EmptyState
          icon={<Archive size={28} strokeWidth={1.25} />}
          title={t("Nothing archived")}
          body={t("Archiving takes a finished year out of the estate — off the dashboard, out of the Inbox, and no longer counted in Reports — without deleting a single reading. Anything you archive lands here, and comes back with one click.")}
          action={
            <Button size="sm" variant="secondary" onClick={() => setScope("active")}>
              {t("Back to active workspaces")}
            </Button>
          }
        />
      ) : all.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid size={28} strokeWidth={1.25} />}
          title={t("No verification workspaces yet")}
          body={t("A workspace is one installation × one product × one reporting year — “Steel billet · Plant A · 2026”. Monthly readings, the MMD, the precursor chain and evidence all hang off it.")}
          action={
            <Button onClick={() => router.push("/workspaces/new")}>
              <Plus size={16} strokeWidth={1.5} /> {t("Create the first workspace")}
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search size={28} strokeWidth={1.25} />}
          title={t("Nothing matches those filters")}
          body={t("Clear them to see every workspace, or widen one — readiness and year are the two that narrow hardest.")}
          action={
            <Button size="sm" variant="secondary" onClick={clear}>
              {t("Clear filters")}
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {/* One line saying what this list IS, only in the archive. The cards
              below are individually marked, but a reader who arrives on this
              scope from a bookmark or a mis-click should not have to infer it
              from a badge. */}
          {showingArchive && (
            <p className="flex items-start gap-2.5 rounded-xl border-l-[3px] border-l-black/20 bg-[#faf9f7] px-4 py-3 text-[12.5px] leading-relaxed text-black/55">
              <Archive size={14} strokeWidth={1.5} className="mt-0.5 flex-none text-black/35" />
              <span>
                {t("These are out of the active estate — not on the dashboard, not chased in the Inbox, and not counted in Reports. Nothing has been deleted: open one to read it, or restore it to bring it back.")}
              </span>
            </p>
          )}
          {view === "table" ? (
            <WorkspaceTable rows={paged} onChanged={refresh} archived={showingArchive} />
          ) : (
            /* SUPPLIER → INSTALLATION → GOOD. The supplier is the headline
               because it is the party an exporter chases; the installation is
               the sub-heading because it is what a verifier scopes to; the
               cards are the goods, because that is the unit of a workspace. */
            grouped.map((group) => (
              <section key={group.supplierId} className="space-y-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-black/[0.07] pb-2">
                  <h2 className="flex items-center gap-2 font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#111]">
                    {group.self ? (
                      <Factory size={17} strokeWidth={1.5} className="text-black/35" />
                    ) : (
                      <Building2 size={17} strokeWidth={1.5} className="text-black/35" />
                    )}
                    {group.supplierName}
                  </h2>
                  {group.self && <TagBadge tone="info">{t("Your own sites")}</TagBadge>}
                  <span className="font-mono text-[11px] text-black/35">
                    {group.installations.length} site{group.installations.length === 1 ? "" : "s"}
                  </span>
                </div>

                {group.installations.map((inst) => (
                  <div key={inst.installationId} className="space-y-3">
                    <div className="flex items-baseline gap-2.5 pl-0.5">
                      <h3 className="font-pixel text-[11px] uppercase tracking-[0.16em] text-black/50">{inst.installationName}</h3>
                      <span className="font-mono text-[11px] text-black/30">{inst.installationId}</span>
                    </div>

                    {/* items-stretch is the grid default and every card carries
                        h-full through the link, so a row of cards is one height
                        however long the product names are. */}
                    <div className="grid items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {inst.cards.map((c) => (
                        <WorkspaceCard key={c.workspace.id} data={c} onChanged={refresh} archived={showingArchive} />
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            ))
          )}
        </div>
      )}

      {/* PINNED. Outside the conditional above so the position of the pager
          never moves between a full page and a filtered one, and sticky so it
          is reachable without scrolling an entire page of cards first. It
          renders nothing when there is only one page. */}
      <Pager page={page} pageCount={pageCount} onChange={setPage} total={filtered.length} from={from} to={to} />
    </div>
  );
}

/* ── Pagination ───────────────────────────────────────────────
   Numbered, because "next" alone gives a reader no idea how much is left, and
   windowed so sixty pages do not become sixty buttons.

   PINNED TO THE BOTTOM OF THE VIEWPORT. A pager that sits at the end of the
   content has to be scrolled to, past everything on the current page, every
   time — which on a card view means scrolling nine cards to reach "next" and
   then being returned to the top to read the next nine. Sticky, it is where
   the reader's eye already is when they finish a page.

   The negative margins let the bar's background reach the page gutters, so
   cards passing underneath are covered rather than showing in a strip either
   side. `-bottom-8` cancels the shell's `py-8` on <main>, so it sits flush
   with the bottom of the window rather than floating 32px above it. */
function Pager({
  page,
  pageCount,
  onChange,
  total,
  from,
  to,
}: {
  page: number;
  pageCount: number;
  onChange: (p: number) => void;
  total: number;
  from: number;
  to: number;
}) {
  const t = useT();
  if (pageCount <= 1) return null;

  const pages: (number | "gap")[] = [];
  const push = (n: number | "gap") => pages.push(n);
  const window_ = 1;
  for (let i = 1; i <= pageCount; i++) {
    if (i === 1 || i === pageCount || Math.abs(i - page) <= window_) push(i);
    else if (pages[pages.length - 1] !== "gap") push("gap");
  }

  const btn = "grid h-8 min-w-8 place-items-center rounded-lg px-2 text-[12.5px] transition-colors";

  const go = (p: number) => {
    onChange(p);
    // Land at the top of the new page. Without this the reader arrives at the
    // bottom of page 2, which reads as nothing having happened.
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav
      className="sticky -bottom-8 z-20 -mx-4 mt-2 flex items-center justify-between gap-3 border-t border-black/[0.06] bg-[#f5f4f0]/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8 lg:-mx-10 lg:px-10"
      aria-label={t("Pagination")}
    >
      <span className="hidden font-mono text-[11px] text-black/40 sm:block">
        {from}–{to} of {total}
      </span>
      <div className="flex flex-1 items-center justify-center gap-1 sm:flex-none">
        <button
          type="button"
          onClick={() => go(Math.max(1, page - 1))}
          disabled={page === 1}
          aria-label={t("Previous page")}
          className={cn(btn, "text-black/45 hover:bg-black/[0.05] hover:text-black disabled:pointer-events-none disabled:text-black/15")}
        >
          <ChevronLeft size={15} strokeWidth={1.5} />
        </button>
        {pages.map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} className="px-1 text-[12.5px] text-black/25">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => go(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(btn, p === page ? "bg-[#111] text-white" : "text-black/50 hover:bg-black/[0.05] hover:text-black")}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => go(Math.min(pageCount, page + 1))}
          disabled={page === pageCount}
          aria-label={t("Next page")}
          className={cn(btn, "text-black/45 hover:bg-black/[0.05] hover:text-black disabled:pointer-events-none disabled:text-black/15")}
        >
          <ChevronRight size={15} strokeWidth={1.5} />
        </button>
      </div>
      <span className="hidden font-mono text-[11px] text-black/40 sm:block">
        Page {page} of {pageCount}
      </span>
    </nav>
  );
}

/* ── Card ─────────────────────────────────────────────────── */
function WorkspaceCard({ data, onChanged, archived = false }: { data: CardData; onChanged: () => void; archived?: boolean }) {
  const t = useT();
  const { workspace, overall, dots, percent, precursors } = data;
  return (
    <div className={cn("relative h-full", archived && "opacity-75 transition-opacity hover:opacity-100")}>
      {/* h-full on the LINK as well as the card. Without it the anchor sizes to
          its content and `h-full` on the card inside means 100% of that — so
          the cards in a row ended up as tall as their own text rather than as
          tall as the row. */}
      <Link href={`/workspaces/${workspace.id}/tree`} className="block h-full">
        <Card className="flex h-full flex-col p-5 transition-colors hover:border-black/20">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="min-w-0">
              <div className="truncate text-[15px] text-black/85">{workspace.productName}</div>
              <div className="mt-0.5 font-mono text-[11px] text-black/40">
                CN {workspace.cnCode || "—"} · {routeLabel(workspace.productionRoute)} · {workspace.year}
              </div>
              {/* Whose plant this is, on the card as well as in the heading
                  above it. A card gets copied into a screenshot, opened from a
                  search result and read on a phone where the heading has
                  scrolled away — all three lose the grouping that would
                  otherwise be the only place the supplier is named. */}
              <div className="mt-2">
                <TagBadge tone={workspace.selfSupplied ? "info" : "muted"}>
                  {workspace.selfSupplied ? t("Our own site") : workspace.supplierName || t("Unassigned supplier")}
                </TagBadge>
              </div>
            </div>
            <StateChip state={overall} />
          </div>

          {/* READINESS, not months submitted. Twelve months of readings is a
              fraction of the work on a complex good — the precursor chain, the
              MMD, the evidence and the carbon price all have to land too, and
              "8 of 12 months" read as nearly done while three of those were
              still empty. This is the same figure the workspace's own
              Readiness section reports (readiness.percentComplete, over the
              applicable tabs), so the card and the section never disagree.
              mt-auto pins it and the strip below to the bottom, so the figures
              line up across a row whatever the header above them wrapped to. */}
          <div className="mt-auto pt-4">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-black/35">{t("Readiness")}</span>
              <span className="font-mono text-[11px] text-black/45">{percent}%</span>
            </div>
            <Progress value={percent} tone={overall === "blocked" ? "err" : overall === "complete" ? "ok" : "warn"} />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <DotStrip states={dots} />
            <span className="font-mono text-[10.5px] text-black/35">
              {precursors} precursor{precursors === 1 ? "" : "s"}
            </span>
          </div>

          {/* Restore ON the card, not only in the kebab. Bringing something
              back is the one thing a reader is in the archive to do, and it
              is safe — hiding it behind a ⋯ makes the archive read as a
              graveyard rather than a drawer. */}
          {archived && (
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-black/[0.06] pt-3">
              <span className="font-mono text-[10.5px] text-black/35">Archived {archivedOn(workspace)}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  restore(workspace, onChanged);
                }}
                className="inline-flex flex-none items-center gap-1.5 rounded-lg border border-black/10 px-2.5 py-1.5 text-[11.5px] text-black/60 transition-colors hover:border-black/25 hover:text-black"
              >
                <ArchiveRestore size={12} strokeWidth={1.5} /> {t("Restore")}
              </button>
            </div>
          )}
        </Card>
      </Link>
      <span className="absolute right-3 top-3" onClick={(e) => e.preventDefault()}>
        <WorkspaceMenu workspace={workspace} afterChange={onChanged} />
      </span>
    </div>
  );
}

/* ── Archive helpers, shared by the card and the table row ───── */

/** The date it was put away, in the short form the rest of the estate uses.
    A workspace archived before `archivedAt` existed simply has no date — the
    badge says so rather than inventing "today", which would make an old
    archive look like something that just happened. */
function archivedOn(w: VerificationWorkspace): string {
  if (!w.archivedAt) return "—";
  const d = new Date(w.archivedAt);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function restore(w: VerificationWorkspace, onChanged: () => void) {
  restoreWorkspace(w.id);
  toast({ message: "Workspace restored", detail: `${w.productName} · ${w.installationName} is back in the estate.`, tone: "ok" });
  onChanged();
}

/* ── Table ────────────────────────────────────────────────── */
function WorkspaceTable({ rows, onChanged, archived = false }: { rows: CardData[]; onChanged: () => void; archived?: boolean }) {
  const t = useT();
  const router = useRouter();
  const th = "px-4 py-2.5 text-left font-pixel text-[10px] uppercase tracking-[0.14em] text-black/35";
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1020px] border-collapse">
          <thead className="border-b border-black/[0.07] bg-[#faf9f7]">
            <tr>
              <th className={th}>{t("Product")}</th>
              <th className={th}>{t("Supplier")}</th>
              <th className={th}>{t("Installation")}</th>
              <th className={th}>{t("Route")}</th>
              <th className={th}>{t("Year")}</th>
              <th className={th}>{t("Readiness")}</th>
              <th className={th}>{t("Precursors")}</th>
              <th className={th}>{archived ? "Archived" : "Status"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ workspace: w, overall, percent, precursors }) => (
              <tr
                key={w.id}
                onClick={() => router.push(`/workspaces/${w.id}/tree`)}
                className="cursor-pointer border-b border-black/[0.05] transition-colors last:border-0 hover:bg-[#fafaf8]"
              >
                <td className="px-4 py-3">
                  <div className="text-[13px] text-black/80">{w.productName}</div>
                  <div className="font-mono text-[11px] text-black/40">CN {w.cnCode || "—"}</div>
                </td>
                <td className="px-4 py-3">
                  <div className={cn("text-[12.5px]", w.selfSupplied ? "text-black/50" : "text-black/65")}>
                    {w.selfSupplied ? t("Our own site") : w.supplierName || t("Unassigned")}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-[12.5px] text-black/65">{w.installationName}</div>
                  <div className="font-mono text-[11px] text-black/35">{w.installationId}</div>
                </td>
                <td className="px-4 py-3 text-[12px] text-black/60">{routeLabel(w.productionRoute)}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-black/60">{w.year}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16">
                      <Progress value={percent} tone={overall === "blocked" ? "err" : overall === "complete" ? "ok" : "warn"} />
                    </div>
                    <span className="font-mono text-[11px] text-black/45">{percent}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-[12px] text-black/60">{precursors}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {archived ? (
                      <>
                        <span className="font-mono text-[11px] text-black/40">{archivedOn(w)}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            restore(w, onChanged);
                          }}
                          className="inline-flex flex-none items-center gap-1.5 rounded-lg border border-black/10 px-2.5 py-1.5 text-[11.5px] text-black/60 transition-colors hover:border-black/25 hover:text-black"
                        >
                          <ArchiveRestore size={12} strokeWidth={1.5} /> {t("Restore")}
                        </button>
                      </>
                    ) : (
                      <StateChip state={overall} />
                    )}
                    <span onClick={(e) => e.stopPropagation()}>
                      <WorkspaceMenu workspace={w} afterChange={onChanged} />
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ── Draft strip ──────────────────────────────────────────────
   ONE ROW, always. Drafts used to be a full grid above everything else, so
   three abandoned flows pushed the entire estate off the first screen — the
   unfinished thing outranking the finished ones purely because it was
   unfinished.

   Overflow scrolls sideways, and the arrows are there to SAY it scrolls:
   a row that ends flush at the container edge reads as a row that ends. They
   disable at each end and hide entirely when everything already fits, so they
   never promise more than there is. */
function DraftStrip({ drafts, onDiscard }: { drafts: WorkspaceDraft[]; onDiscard: (id: string) => void }) {
  const t = useT();
  const railRef = React.useRef<HTMLDivElement | null>(null);
  const [edges, setEdges] = React.useState({ left: false, right: false });

  const measure = React.useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const slack = el.scrollWidth - el.clientWidth;
    setEdges({ left: el.scrollLeft > 4, right: slack > 4 && el.scrollLeft < slack - 4 });
  }, []);

  React.useEffect(() => {
    measure();
    const el = railRef.current;
    if (!el) return;
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure, drafts.length]);

  const nudge = (dir: -1 | 1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.8), behavior: "smooth" });
  };

  const scrollable = edges.left || edges.right;

  return (
    <section className="space-y-2">
      <h2 className="font-pixel text-[11px] uppercase tracking-[0.16em] text-black/40">{t("Draft")}</h2>
      <div
        ref={railRef}
        className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {drafts.map((d) => (
          <div key={d.id} className="w-[min(19rem,80vw)] flex-none snap-start">
            <DraftCard draft={d} onDiscard={() => onDiscard(d.id)} />
          </div>
        ))}
      </div>
      {scrollable && (
        <div className="flex items-center justify-end gap-1">
          <ArrowBtn label={t("Scroll drafts left")} disabled={!edges.left} onClick={() => nudge(-1)}>
            <ChevronLeft size={15} strokeWidth={1.5} />
          </ArrowBtn>
          <ArrowBtn label={t("Scroll drafts right")} disabled={!edges.right} onClick={() => nudge(1)}>
            <ChevronRight size={15} strokeWidth={1.5} />
          </ArrowBtn>
        </div>
      )}
    </section>
  );
}

function ArrowBtn({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-7 w-7 place-items-center rounded-lg border border-black/10 bg-white text-black/45 transition-colors hover:border-black/25 hover:text-black disabled:pointer-events-none disabled:text-black/15"
    >
      {children}
    </button>
  );
}

/* ── Draft card ───────────────────────────────────────────── */
function DraftCard({ draft, onDiscard }: { draft: WorkspaceDraft; onDiscard: () => void }) {
  const t = useT();
  const pct = Math.round((draft.display.step / draft.display.stepCount) * 100);
  return (
    <div className="relative h-full">
      <Link href={`/workspaces/new?draft=${draft.id}`} className="block h-full">
        <Card className="flex h-full flex-col border-dashed p-4 transition-colors hover:border-black/20 hover:bg-[#fafaf8]">
          <div className="min-w-0 pr-8">
            <div className="truncate text-[14px] text-black/85">{draft.display.productName}</div>
            <div className="mt-1 flex items-center gap-2">
              <Chip pulse={false}>{t("Draft")}</Chip>
              <span className="truncate font-mono text-[11px] text-black/40">
                {draft.display.installationName} · {draft.display.year}
              </span>
            </div>
          </div>
          <div className="mt-auto pt-3">
            <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-black/35">
              Step {draft.display.step} of {draft.display.stepCount}
            </div>
            <Progress value={pct} tone="muted" />
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-black/[0.06] pt-2.5 text-[11px] text-black/45">
            <PenLine size={13} strokeWidth={1.5} /> {t("Continue where you left off")}
            <ArrowRight size={15} strokeWidth={1.5} className="ml-auto text-black/30" />
          </div>
        </Card>
      </Link>
      <button
        onClick={onDiscard}
        aria-label={t("Discard draft")}
        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg text-black/30 transition-colors hover:bg-black/[0.05] hover:text-[#dc2626]"
      >
        <Trash2 size={13} strokeWidth={1.5} />
      </button>
    </div>
  );
}

/* ── Small shared controls ────────────────────────────────── */
/* ── Archive toggle ───────────────────────────────────────────
   Labelled, not an icon — it changes WHAT is listed rather than how it is
   drawn, and an unlabelled pill for that is a mode switch nobody can name.
   The count rides inside it so the archive answers "is there anything in
   there" before it is opened, and it is deliberately shown at zero.

   Pressed reads as the black filled state rather than a tint: the archive is
   not the estate, and a reader who lands here from a bookmark or a mis-click
   should be able to tell at a glance that this is not the normal view. */
function ArchiveToggle({ active, count, onClick }: { active: boolean; count: number; onClick: () => void }) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={
        active
          ? "Back to the active estate"
          : "Show archived workspaces — off the dashboard, out of the Inbox, not counted in Reports. Nothing is deleted."
      }
      className={cn(
        "inline-flex h-10 flex-none items-center gap-2 rounded-xl border px-3 text-[12.5px] transition-colors",
        active ? "border-black bg-[#111] text-white hover:bg-[#333]" : "border-black/10 bg-white text-black/50 hover:border-black/25 hover:text-black",
      )}
    >
      <Archive size={14} strokeWidth={1.5} />
      {t("Archived")}
      <span className={cn("font-mono text-[10.5px] tabular-nums", active ? "text-white/60" : "text-black/35")}>{count}</span>
    </button>
  );
}

function ViewToggle({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn("grid h-8 w-9 place-items-center rounded-lg transition-colors", active ? "bg-[#111] text-white" : "text-black/40 hover:bg-black/[0.05] hover:text-black")}
    >
      {children}
    </button>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
  searchable,
  searchPlaceholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; hint?: string }[];
  allLabel: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.1em] text-black/40">{label}</span>
      <Select
        value={value}
        onChange={(v) => onChange(v === "__all" ? "" : v)}
        options={[{ value: "__all", label: allLabel }, ...options]}
        placeholder={allLabel}
        ariaLabel={label}
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
      />
    </label>
  );
}
