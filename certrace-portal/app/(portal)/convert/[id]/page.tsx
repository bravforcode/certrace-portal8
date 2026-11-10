"use client";

/* ════════════════════════════════════════════════════════════
   ONE STANDARD — what converting into it needs, and the button that does it

   Logo, name and description on top, with the one primary action: convert
   the workspace data into the standard's report. Under it, the reporting
   year (only the current one is open; later years are locked), then each
   requirement with its readiness and two ways to work on it — send a Smart
   Link or fill it in — which stay available even once it is complete, so
   a figure can still be corrected. Last, the reports already generated for
   that year. Mock data (lib/convert-mock.ts).
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Download,
  FileArchive,
  FileSpreadsheet,
  Link2,
  PencilLine,
  Search,
} from "lucide-react";
import {
  Button,
  ButtonLink,
  Card,
  Chip,
  EmptyState,
  Progress,
  cn,
  inputClass,
} from "@/components/ui";
import { toast } from "@/components/toast";
import { YearBar } from "@/components/year-bar";
import { currentYear } from "@/lib/year-range";
import { StandardLogo } from "@/components/convert/standard-logo";
import {
  REPORTS,
  getStandard,
  readiness,
  type ConvertedReport,
  type Requirement,
  type RequirementState,
} from "@/lib/convert-mock";

const STATE: Record<
  RequirementState,
  { label: string; tone: "ok" | "warn" | "err" }
> = {
  complete: { label: "Complete", tone: "ok" },
  "in-progress": { label: "In progress", tone: "warn" },
  missing: { label: "Missing", tone: "err" },
};

export default function ConvertStandardPage() {
  const { id } = useParams<{ id: string }>();
  const s = getStandard(id);
  const [more, setMore] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState<string | null>(null);
  const thisYear = currentYear();
  const [year, setYear] = React.useState(thisYear);
  // Set when Convert is pressed too early: the unfinished requirements light up.
  const [flagged, setFlagged] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);
  // The highlight is a pointer, not a state: it fades out on its own.
  React.useEffect(() => {
    if (!flagged) return;
    const id = window.setTimeout(() => setFlagged(false), 2600);
    return () => window.clearTimeout(id);
  }, [flagged]);
  const [history, setHistory] = React.useState<ConvertedReport[]>(() =>
    REPORTS.filter((r) => r.standardId === id),
  );

  if (!s || s.status === "soon")
    return (
      <div className="space-y-6">
        <BackLink />
        <p className="text-[14px] text-black/55">
          {s ? `${s.name} is coming soon.` : "This standard does not exist."}
        </p>
      </div>
    );

  // Only the current year has data so far: any other year shows every requirement missing.
  const locked = year !== thisYear;
  const requirements: Requirement[] = locked
    ? s.requirements.map((r) => ({ ...r, state: "missing", progress: undefined }))
    : s.requirements;
  const pct = readiness({ ...s, requirements });
  const open_ = requirements.filter((r) => r.state !== "complete").length;
  // Converting needs every requirement complete.
  const canConvert = open_ === 0;
  const q = query.trim().toLowerCase();
  const rows = requirements.filter(
    (r) => !q || r.title.toLowerCase().includes(q),
  );
  const yearHistory = history.filter((r) => r.year === year);

  const convert = () => {
    if (!canConvert) {
      setQuery("");
      setFlagged(true);
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    setHistory((h) => [
      {
        id: `r-${Date.now()}`,
        standardId: s.id,
        title: `${s.name} report package — ${year}`,
        year,
        period: `${year} to date`,
        createdAt: today,
        format: "ZIP",
      },
      ...h,
    ]);
    toast(`${s.name} report for ${year} is ready. (Mock)`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <BackLink />

      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-4">
          <StandardLogo logo={s.logo} className="h-12 w-12" />
          <div className="min-w-0">
            <h1 className="font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
              {s.name}
            </h1>
            <p
              className={cn(
                "mt-2 max-w-xl text-[14px] leading-relaxed text-black/55",
                !more && "line-clamp-2",
              )}
            >
              {s.description}
            </p>
            <button
              type="button"
              onClick={() => setMore((v) => !v)}
              className="mt-1.5 text-[13px] font-medium text-black/75 hover:text-black"
            >
              {more ? "Read less" : "Read more"}
            </button>
          </div>
        </div>

        {/* Looks inactive until every requirement is complete, but still answers a
            click: it points at what is left instead of doing nothing. */}
        <Button
          onClick={convert}
          aria-disabled={!canConvert}
          className={cn(
            "flex-none self-start",
            !canConvert && "bg-black/[0.08] text-black/35 hover:bg-black/[0.08]",
          )}
        >
          Convert to report
        </Button>
      </div>

      {/* Reporting year: the shared bar (2020 → five years ahead, opening on
          the current year). Years ahead carry a lock but still open: they
          show every requirement as missing, as does any earlier year. */}
      <YearBar
        value={year}
        onChange={(y) => {
          setYear(y);
          setFlagged(false);
        }}
        mark={(y) => (y > thisYear ? "locked" : undefined)}
      />

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1 sm:max-w-sm">
            <h2 className="font-[family-name:var(--font-plex)] text-xl font-light tracking-tight text-[#111]">
              Readiness
            </h2>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1">
                <Progress value={pct} tone={pct === 100 ? "ok" : "warn"} />
              </div>
              <span className="font-mono text-[12px] tabular-nums text-black/50">
                {pct}%
              </span>
            </div>
            <p className="mt-1.5 text-[12px] text-black/40">
              {s.requirements.length - open_} of {s.requirements.length}{" "}
              requirements complete
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search
              size={15}
              strokeWidth={1.5}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30"
            />
            <input
              className={inputClass + " pl-10"}
              data-lock="allow"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search requirements…"
              aria-label="Search requirements"
            />
          </div>
        </div>

        <div ref={listRef} className="scroll-mt-24" />
        <Card className="overflow-hidden p-0">
          {rows.length === 0 ? (
            <p className="px-5 py-6 text-[13px] text-black/40">
              No requirement matches “{query}”.
            </p>
          ) : (
            rows.map((r, i) => (
              <RequirementRow
                key={r.id}
                r={r}
                first={i === 0}
                flagged={flagged && r.state !== "complete"}
                open={open === r.id}
                onToggle={() => setOpen((v) => (v === r.id ? null : r.id))}
              />
            ))
          )}
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="font-[family-name:var(--font-plex)] text-xl font-light tracking-tight text-[#111]">
          Report history
        </h2>
        {yearHistory.length === 0 ? (
          <EmptyState title={`No reports generated for ${year} yet.`} />
        ) : (
          <div className="overflow-hidden rounded-xl border border-black/[0.08] bg-white">
            {yearHistory.map((r, i) => (
              <div
                key={r.id}
                className={cn(
                  "flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center",
                  i > 0 && "border-t border-black/[0.06]",
                )}
              >
                {r.format === "ZIP" ? (
                  <FileArchive size={18} strokeWidth={1.5} className="hidden flex-none text-black/35 sm:block" />
                ) : (
                  <FileSpreadsheet size={18} strokeWidth={1.5} className="hidden flex-none text-black/35 sm:block" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] text-black/85">
                    {r.title}
                  </div>
                  <div className="mt-0.5 text-[12px] text-black/40">
                    {r.period} · Generated {r.createdAt}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  aria-label={`Download ${r.title} (${r.format})`}
                  onClick={() =>
                    toast(`${r.title} (${r.format}) — download is a mock for now.`)
                  }
                  className="flex-none self-start sm:self-auto"
                >
                  <Download size={13} strokeWidth={1.5} /> Download
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/convert"
      className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.08em] text-black/40 hover:text-black"
    >
      <ArrowLeft size={14} strokeWidth={1.5} /> Convert
    </Link>
  );
}

function RequirementRow({
  r,
  first,
  flagged,
  open,
  onToggle,
}: {
  r: Requirement;
  first: boolean;
  /** Still to do, and Convert was pressed: tinted so it stands out. */
  flagged: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const st = STATE[r.state];
  return (
    <div
      className={cn(
        "border-l-2 transition-colors duration-700 ease-out",
        !first && "border-t border-t-black/[0.06]",
        flagged ? "border-l-[#dc2626] bg-[#fef2f2]" : "border-l-transparent",
      )}
    >
      <div
        className={cn(
          "px-5 py-3 transition-colors",
          flagged ? "hover:bg-[#fde8e8]" : "hover:bg-[#fafaf8]",
        )}
      >
        <button
          type="button"
          aria-expanded={open}
          onClick={onToggle}
          className="flex w-full min-w-0 items-center gap-3 py-1 text-left"
        >
          <ChevronDown
            size={16}
            strokeWidth={1.5}
            className={cn(
              "flex-none text-black/35 transition-transform",
              open && "rotate-180",
            )}
          />
          <span className="min-w-0 flex-1 text-[14px] text-black/80">
            {r.title}
          </span>
          {r.progress && (
            <span className="hidden text-[12px] text-black/40 md:inline">
              {r.progress}
            </span>
          )}
          <Chip tone={st.tone} filled>
            {st.label}
          </Chip>
        </button>
      </div>
      {open && (
        <div className="px-5 pb-5 pl-12">
          <p className="max-w-2xl text-[13px] leading-relaxed text-black/55">
            {r.detail}
          </p>
          {r.progress && (
            <p className="mt-1 text-[12px] text-black/40 md:hidden">
              {r.progress}
            </p>
          )}
          {/* Both stay available whatever the state — a complete figure can still be corrected. */}
          <div className="mt-3 flex flex-wrap gap-2">
            <ButtonLink href="/smart-links" variant="secondary" size="sm">
              <Link2 size={13} strokeWidth={1.5} /> Smart Link
            </ButtonLink>
            <ButtonLink href="/workspaces" variant="secondary" size="sm">
              <PencilLine size={13} strokeWidth={1.5} /> Fill in
            </ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}
