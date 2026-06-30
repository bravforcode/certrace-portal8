"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ArrowRight, LayoutGrid, Table2, Search, ChevronLeft, ChevronRight, PenLine, Trash2 } from "lucide-react";
import { Card, Button, Chip, Progress, Eyebrow, cn } from "@/components/ui";
import { DECLARATIONS, ORG, type Declaration } from "@/lib/data";
import { getRegulation, getJurisdiction } from "@/lib/config";
import { loadDrafts, deleteDraft, type Draft } from "@/lib/drafts";

const STEP_LABEL: Record<string, string> = {
  collect: "Collecting",
  calculate: "Calculating",
  comply: "Compliance",
  review: "In review",
  report: "Report",
  submit: "Submitting",
  done: "Submitted",
};

function tone(d: Declaration) {
  return d.step === "done" ? "ok" : d.dueInDays < 0 ? "err" : d.dueInDays < 21 ? "warn" : "info";
}
function pct(d: Declaration) {
  const done = d.suppliers.filter((s) => s.status === "submitted").length;
  return Math.round((done / d.suppliers.length) * 100);
}
function productCount(d: Declaration) {
  return d.productCount ?? new Set(d.suppliers.map((s) => s.material)).size;
}
function heading(d: Declaration) {
  return d.kind === "buyer" ? d.title ?? d.name : getRegulation(d.regulation)?.short ?? d.name;
}
function sub(d: Declaration) {
  return d.kind === "buyer" ? "Buyer request" : getRegulation(d.regulation)?.full ?? "";
}

const KINDS = [
  { id: "all", label: "All" },
  { id: "cbam", label: "CBAM" },
  { id: "buyer", label: "Buyer" },
] as const;
const STATUSES = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "open", label: "Open" },
  { id: "overdue", label: "Overdue" },
  { id: "submitted", label: "Submitted" },
] as const;

const PAGE_SIZE_CARDS = 8;
const PAGE_SIZE_ROWS = 10;

function draftDue(deadline: string) {
  if (!deadline) return { label: "—", days: 9999 };
  const d = new Date(deadline + "T00:00:00");
  const days = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
  return { label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }), days };
}

export default function DeclarationsPage() {
  const router = useRouter();
  const [view, setView] = React.useState<"cards" | "table">("cards");
  const [q, setQ] = React.useState("");
  const [kind, setKind] = React.useState<(typeof KINDS)[number]["id"]>("all");
  const [status, setStatus] = React.useState<(typeof STATUSES)[number]["id"]>("all");
  const [page, setPage] = React.useState(1);

  // Drafts live in localStorage; surfaced at the top of the list until completed.
  const [drafts, setDrafts] = React.useState<Draft[]>([]);
  React.useEffect(() => setDrafts(loadDrafts()), []);
  const discardDraft = (id: string) => {
    deleteDraft(id);
    setDrafts(loadDrafts());
  };

  const list = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (status === "draft") return []; // drafts render in their own leading block
    return DECLARATIONS.filter((d) => {
      if (kind !== "all" && (d.kind ?? "cbam") !== kind) return false;
      if (status === "open" && d.step === "done") return false;
      if (status === "overdue" && !(d.step !== "done" && d.dueInDays < 0)) return false;
      if (status === "submitted" && d.step !== "done") return false;
      if (needle && ![heading(d), sub(d), d.period, d.sector, d.kind ?? "cbam"].join(" ").toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [q, kind, status]);

  const draftItems = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!(status === "all" || status === "draft")) return [];
    return drafts.filter((d) => {
      if (kind !== "all" && d.display.purpose !== kind) return false;
      if (needle && ![d.display.name, d.display.purpose, d.display.period].join(" ").toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [drafts, q, kind, status]);

  const pageSize = view === "cards" ? PAGE_SIZE_CARDS : PAGE_SIZE_ROWS;
  const pageCount = Math.max(1, Math.ceil(list.length / pageSize));
  React.useEffect(() => setPage(1), [q, kind, status, view]);
  const safePage = Math.min(page, pageCount);
  const pageItems = list.slice((safePage - 1) * pageSize, safePage * pageSize);
  // drafts sit at the top — on the Draft tab always, elsewhere only on page 1
  const showDrafts = draftItems.length > 0 && (status === "draft" || safePage === 1);
  const shownCount = status === "draft" ? draftItems.length : list.length;

  const open = DECLARATIONS.filter((d) => d.step !== "done").length;
  const submitted = DECLARATIONS.filter((d) => d.step === "done").length;

  const filterPill = (active: boolean) =>
    cn("rounded-full border px-3 py-1.5 text-[12px] transition-colors", active ? "border-black/25 bg-[#111] text-white" : "border-black/10 text-black/55 hover:border-black/25");

  return (
    <div className="space-y-5">
      {/* Description — matches dashboard header, action on the right */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Eyebrow>Declarations</Eyebrow>
          <h1 className="mt-2 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111] md:text-4xl">Reporting cycles.</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-black/45">
            Every regulation, market and period you&apos;re filing for. A declaration is the unit of compliance — scope it once, the platform runs the rest.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip tone="info" pulse={false}>{open} open</Chip>
            <Chip tone="ok" pulse={false}>{submitted} submitted</Chip>
            {drafts.length > 0 && <Chip pulse={false}>{drafts.length} draft{drafts.length === 1 ? "" : "s"}</Chip>}
            <Chip pulse={false}>{DECLARATIONS.length} total</Chip>
          </div>
        </div>
        <Link href="/declarations/new" className="hidden md:block">
          <Button>
            <Plus size={15} strokeWidth={1.5} /> New declaration
          </Button>
        </Link>
      </div>

      {/* Sticky action section — filters/tags, search, view toggle, Start New (always reachable) */}
      <div className="sticky top-16 z-30 -mx-4 border-b border-black/[0.06] bg-[#f5f4f0]/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8 lg:-mx-10 lg:px-10">
        <div className="flex flex-col gap-3">
          {/* Tags / filters */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex items-center gap-1.5">
              {KINDS.map((k) => (
                <button key={k.id} onClick={() => setKind(k.id)} className={filterPill(kind === k.id)}>{k.label}</button>
              ))}
            </div>
            <span className="hidden h-4 w-px bg-black/10 sm:block" />
            <div className="flex flex-wrap items-center gap-1.5">
              {STATUSES.map((s) => (
                <button key={s.id} onClick={() => setStatus(s.id)} className={filterPill(status === s.id)}>{s.label}</button>
              ))}
            </div>
            <Link href="/declarations/new" className="ml-auto md:hidden">
              <Button size="sm">
                <Plus size={14} strokeWidth={1.5} /> New
              </Button>
            </Link>
          </div>

          {/* Search + view toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={15} strokeWidth={1.5} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search declarations…"
                className="w-full rounded-xl border border-black/10 bg-white py-2.5 pl-10 pr-3 text-sm text-black/70 placeholder:text-black/30 focus:border-black/25 focus:outline-none"
              />
            </div>
            <div className="flex flex-none items-center rounded-xl border border-black/10 bg-white p-0.5">
              {([
                ["cards", LayoutGrid],
                ["table", Table2],
              ] as const).map(([v, Icon]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  aria-label={`${v} view`}
                  aria-pressed={view === v}
                  className={cn("grid h-9 w-9 place-items-center rounded-lg transition-colors", view === v ? "bg-[#111] text-white" : "text-black/45 hover:text-black")}
                >
                  <Icon size={15} strokeWidth={1.5} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-black/40">
          {shownCount} {status === "draft" ? "draft" : "declaration"}{shownCount === 1 ? "" : "s"}
          {(kind !== "all" || status !== "all" || q) && " · filtered"}
        </span>
      </div>

      {/* CARDS */}
      {view === "cards" &&
        (pageItems.length === 0 && !showDrafts ? (
          <Empty />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {showDrafts && draftItems.map((d) => <DraftCard key={d.id} draft={d} onDiscard={() => discardDraft(d.id)} />)}
            {pageItems.map((d) => {
              const jur = getJurisdiction(d.origin);
              const done = d.suppliers.filter((s) => s.status === "submitted").length;
              return (
                <Link key={d.id} href={`/declarations/${d.id}`} className="block">
                  <Card className="flex h-full flex-col p-6 transition-colors hover:border-black/15 hover:bg-[#fafaf8]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="block truncate font-[family-name:var(--font-plex)] text-2xl font-light text-[#111]">{heading(d)}</span>
                        <p className="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-black/35">
                          {d.kind === "buyer" && <Chip pulse={false}>buyer</Chip>}
                          {sub(d)}
                        </p>
                      </div>
                      <Chip tone={tone(d)} pulse={false}>{STEP_LABEL[d.step]}</Chip>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-y-3 text-[12px]">
                      <Meta label="Period" value={d.period} />
                      <Meta label="Route" value={<span className="flex items-center gap-1.5"><span className="font-mono text-[10px] text-black/40">{jur?.flag}</span> {d.origin} → {d.market}</span>} />
                      <Meta label="Products" value={productCount(d)} />
                      <Meta label="Due" value={d.due} />
                    </div>
                    <div className="mt-5 flex items-center gap-3 border-t border-black/[0.06] pt-4">
                      <Progress value={pct(d)} tone={tone(d)} />
                      <span className="font-mono text-[11px] text-black/45">{done}/{d.suppliers.length}</span>
                      <ArrowRight size={15} strokeWidth={1.5} className="text-black/30" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        ))}

      {/* TABLE */}
      {view === "table" &&
        (pageItems.length === 0 && !showDrafts ? (
          <Empty />
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-black/[0.07] bg-[#fafaf8]">
                    {["Declaration", "Type", "Period", "Route", "Products", "Progress", "Due", "Status"].map((h) => (
                      <th key={h} className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-black/40">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {showDrafts && draftItems.map((d) => <DraftRow key={d.id} draft={d} onDiscard={() => discardDraft(d.id)} />)}
                  {pageItems.map((d) => {
                    const jur = getJurisdiction(d.origin);
                    const done = d.suppliers.filter((s) => s.status === "submitted").length;
                    return (
                      <tr
                        key={d.id}
                        onClick={() => router.push(`/declarations/${d.id}`)}
                        className="cursor-pointer border-b border-black/[0.05] transition-colors last:border-0 hover:bg-[#fafaf8]"
                      >
                        <td className="px-4 py-3">
                          <div className="text-[13px] text-black/80">{heading(d)}</div>
                          <div className="text-[11px] text-black/40">{sub(d)}</div>
                        </td>
                        <td className="px-4 py-3"><span className="font-mono text-[11px] uppercase tracking-[0.08em] text-black/50">{d.kind === "buyer" ? "Buyer" : "CBAM"}</span></td>
                        <td className="px-4 py-3 text-[12px] text-black/60">{d.period}</td>
                        <td className="px-4 py-3 text-[12px] text-black/60"><span className="font-mono text-[10px] text-black/40">{jur?.flag}</span> {d.origin} → {d.market}</td>
                        <td className="px-4 py-3 font-mono text-[12px] text-black/60">{productCount(d)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20"><Progress value={pct(d)} tone={tone(d)} /></div>
                            <span className="font-mono text-[11px] text-black/45">{done}/{d.suppliers.length}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-black/60">{d.due}</td>
                        <td className="px-4 py-3"><Chip tone={tone(d)} pulse={false}>{STEP_LABEL[d.step]}</Chip></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ))}

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="font-mono text-[11px] text-black/40">
            Page {safePage} of {pageCount}
          </span>
          <div className="flex items-center gap-1.5">
            <PageBtn disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Previous page">
              <ChevronLeft size={15} strokeWidth={1.5} />
            </PageBtn>
            {Array.from({ length: pageCount }, (_, i) => i + 1)
              .filter((n) => Math.abs(n - safePage) <= 2 || n === 1 || n === pageCount)
              .map((n, idx, arr) => (
                <React.Fragment key={n}>
                  {idx > 0 && n - arr[idx - 1] > 1 && <span className="px-1 text-black/30">…</span>}
                  <button
                    onClick={() => setPage(n)}
                    className={cn(
                      "grid h-8 min-w-8 place-items-center rounded-lg px-2 font-mono text-[12px] transition-colors",
                      n === safePage ? "bg-[#111] text-white" : "text-black/55 hover:bg-black/[0.05]",
                    )}
                  >
                    {n}
                  </button>
                </React.Fragment>
              ))}
            <PageBtn disabled={safePage === pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} aria-label="Next page">
              <ChevronRight size={15} strokeWidth={1.5} />
            </PageBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.1em] text-black/35">{label}</div>
      <div className="mt-0.5 text-black/60">{value}</div>
    </div>
  );
}

function DraftCard({ draft, onDiscard }: { draft: Draft; onDiscard: () => void }) {
  const jur = getJurisdiction(ORG.origin);
  const due = draftDue(draft.display.deadline);
  return (
    <div className="relative">
      <Link href={`/declarations/new?draft=${draft.id}`} className="block">
        <Card className="flex h-full flex-col border-dashed p-6 transition-colors hover:border-black/20 hover:bg-[#fafaf8]">
          <div className="min-w-0 pr-8">
            <span className="block truncate font-[family-name:var(--font-plex)] text-2xl font-light text-[#111]">{draft.display.name}</span>
            <p className="mt-1.5 flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-black/35">
              <Chip pulse={false}>Draft</Chip>
              {draft.display.purpose === "buyer" ? "Buyer request" : "CBAM compliance"}
            </p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-y-3 text-[12px]">
            <Meta label="Period" value={draft.display.period || "—"} />
            <Meta label="Route" value={<span className="flex items-center gap-1.5"><span className="font-mono text-[10px] text-black/40">{jur?.flag}</span> {ORG.origin} → EU</span>} />
            <Meta label="Products" value={draft.display.productCount} />
            <Meta label="Deadline" value={due.label} />
          </div>
          <div className="mt-5 flex items-center gap-2 border-t border-black/[0.06] pt-4 text-[11px] text-black/45">
            <PenLine size={13} strokeWidth={1.5} /> Continue editing
            <ArrowRight size={15} strokeWidth={1.5} className="ml-auto text-black/30" />
          </div>
        </Card>
      </Link>
      <button onClick={onDiscard} aria-label="Discard draft" className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-lg text-black/30 transition-colors hover:bg-black/[0.05] hover:text-[#dc2626]">
        <Trash2 size={13} strokeWidth={1.5} />
      </button>
    </div>
  );
}

function DraftRow({ draft, onDiscard }: { draft: Draft; onDiscard: () => void }) {
  const router = useRouter();
  const jur = getJurisdiction(ORG.origin);
  const due = draftDue(draft.display.deadline);
  return (
    <tr
      onClick={() => router.push(`/declarations/new?draft=${draft.id}`)}
      className="cursor-pointer border-b border-black/[0.05] bg-[#fcfcfa] transition-colors hover:bg-[#fafaf8]"
    >
      <td className="px-4 py-3">
        <div className="text-[13px] text-black/80">{draft.display.name}</div>
        <div className="text-[11px] text-black/40">Draft · not yet sent</div>
      </td>
      <td className="px-4 py-3"><span className="font-mono text-[11px] uppercase tracking-[0.08em] text-black/50">{draft.display.purpose === "buyer" ? "Buyer" : "CBAM"}</span></td>
      <td className="px-4 py-3 text-[12px] text-black/60">{draft.display.period || "—"}</td>
      <td className="px-4 py-3 text-[12px] text-black/60"><span className="font-mono text-[10px] text-black/40">{jur?.flag}</span> {ORG.origin} → EU</td>
      <td className="px-4 py-3 font-mono text-[12px] text-black/60">{draft.display.productCount}</td>
      <td className="px-4 py-3 font-mono text-[12px] text-black/30">—</td>
      <td className="px-4 py-3 text-[12px] text-black/60">{due.label}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Chip pulse={false}>Draft</Chip>
          <button onClick={(e) => { e.stopPropagation(); onDiscard(); }} aria-label="Discard draft" className="text-black/30 transition-colors hover:text-[#dc2626]">
            <Trash2 size={13} strokeWidth={1.5} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function PageBtn({ children, disabled, onClick, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-lg border border-black/10 text-black/50 transition-colors hover:border-black/25 hover:text-black disabled:pointer-events-none disabled:opacity-30"
      {...rest}
    >
      {children}
    </button>
  );
}

function Empty() {
  return (
    <Link href="/declarations/new" className="block">
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 p-8 text-center transition-colors hover:border-black/25 hover:bg-[#fafaf8]">
        <span className="grid h-11 w-11 place-items-center rounded-xl border border-black/10 text-black/50">
          <Plus size={18} strokeWidth={1.5} />
        </span>
        <p className="mt-4 text-sm font-light text-black/70">No declarations match these filters</p>
        <p className="mt-1 max-w-xs text-xs text-black/40">Clear the filters, or start a new declaration — CBAM compliance or a custom buyer request.</p>
      </div>
    </Link>
  );
}
