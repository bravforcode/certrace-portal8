"use client";

/* ════════════════════════════════════════════════════════════
   CONVERT — the standards a workspace's data can be turned into

   Laid out like an app directory: status tabs on the left with their counts,
   search on the right, then a grid of standards. The last tab, Report, is
   where finished reports are collected. Only EU CBAM opens; the rest are
   coming soon. All data is mock (lib/convert-mock.ts).
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, FileArchive, FileSpreadsheet, Plus, Search } from "lucide-react";
import {
  Button,
  Chip,
  EmptyState,
  FilterChip,
  PageHeader,
  cn,
  inputClass,
} from "@/components/ui";
import { toast } from "@/components/toast";
import { StandardLogo } from "@/components/convert/standard-logo";
import {
  REPORTS,
  STANDARDS,
  getStandard,
  readiness,
  type Standard,
} from "@/lib/convert-mock";

type Tab = "all" | "in-progress" | "ready" | "report";
const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "in-progress", label: "In progress" },
  { key: "ready", label: "Ready" },
  { key: "report", label: "Report" },
];

const countFor = (tab: Tab) =>
  tab === "all"
    ? STANDARDS.length
    : tab === "report"
      ? REPORTS.length
      : STANDARDS.filter((s) => s.status === tab).length;

export default function ConvertPage() {
  return (
    <React.Suspense fallback={null}>
      <ConvertInner />
    </React.Suspense>
  );
}

function ConvertInner() {
  const router = useRouter();
  const params = useSearchParams();
  const fromUrl = params.get("tab") as Tab | null;
  const [tab, setTab] = React.useState<Tab>(
    fromUrl && TABS.some((t) => t.key === fromUrl) ? fromUrl : "all",
  );
  const [query, setQuery] = React.useState("");

  const go = (next: Tab) => {
    setTab(next);
    router.replace(next === "all" ? "/convert" : `/convert?tab=${next}`, {
      scroll: false,
    });
  };

  const q = query.trim().toLowerCase();
  const matches = (s: Standard) =>
    !q || `${s.name} ${s.region}`.toLowerCase().includes(q);
  const shown = STANDARDS.filter(
    (s) => (tab === "all" || s.status === tab) && matches(s),
  );
  const live = shown.filter((s) => s.status !== "soon");
  const soon = shown.filter((s) => s.status === "soon");
  const reports = REPORTS.filter(
    (r) =>
      !q || `${r.title} ${r.period}`.toLowerCase().includes(q),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Convert"
        lead="Turn your workspace data into the report each standard asks for."
      />

      {/* The kit's filter pills and search field, as on Suppliers and Notifications.
          One line at every width: on a narrow screen the pills scroll sideways. */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div
          role="group"
          aria-label="Status"
          className="flex max-w-full items-center gap-2 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {TABS.map(({ key, label }) => (
            <FilterChip key={key} active={tab === key} onClick={() => go(key)}>
              {label} ({countFor(key)})
            </FilterChip>
          ))}
        </div>
        <div className="relative w-full md:max-w-sm">
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
            placeholder={tab === "report" ? "Search reports…" : "Search standards…"}
            aria-label="Search"
          />
        </div>
      </div>

      {tab === "report" ? (
        <ReportList reports={reports} />
      ) : shown.length === 0 ? (
        <EmptyState
          title={q ? `Nothing matches “${query}”.` : `No standard is ${TABS.find((x) => x.key === tab)?.label.toLowerCase()} yet.`}
          body={q ? undefined : "Standards show up here once their requirements reach this stage."}
        />
      ) : (
        <div className="space-y-10">
          {live.length > 0 && (
            <Section title="Available">
              {live.map((s) => (
                <StandardCard key={s.id} s={s} />
              ))}
            </Section>
          )}
          {soon.length > 0 && (
            <Section title="Coming soon">
              {soon.map((s) => (
                <StandardCard key={s.id} s={s} />
              ))}
              {!q && (
                <div className="flex min-h-[104px] items-center gap-3 rounded-xl border border-dashed border-black/15 px-5 text-[13px] text-black/40">
                  <Plus size={16} strokeWidth={1.5} /> More standards on the way
                </div>
              )}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="font-[family-name:var(--font-plex)] text-xl font-light tracking-tight text-[#111]">
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

function StandardCard({ s }: { s: Standard }) {
  const soon = s.status === "soon";
  const body = (
    <>
      <StandardLogo logo={s.logo} className={cn(soon && "opacity-60")} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={cn(
              "text-[15px] leading-snug",
              soon ? "text-black/50" : "text-black/85",
            )}
          >
            {s.name}
          </span>
          {soon && (
            <span className="flex-none rounded-full border border-black/10 px-2 py-0.5 text-[10px] text-black/40">
              Soon
            </span>
          )}
        </div>
        <div className="mt-1 text-[12px] leading-snug text-black/40">
          {s.region}
        </div>
        {!soon && (
          <div className="mt-2.5 flex flex-wrap items-center gap-2 whitespace-nowrap">
            <Chip tone={readiness(s) === 100 ? "ok" : "warn"}>
              {readiness(s)}% ready
            </Chip>
            <span className="text-[11.5px] text-black/40">
              {s.requirements.length} requirements
            </span>
          </div>
        )}
      </div>
    </>
  );
  const box =
    "flex min-h-[104px] items-start gap-4 rounded-xl border bg-white px-5 py-4 transition-colors";
  return soon ? (
    <div
      aria-disabled
      className={cn(box, "cursor-default border-black/[0.06] bg-white/60")}
    >
      {body}
    </div>
  ) : (
    <Link
      href={`/convert/${s.id}`}
      className={cn(box, "border-black/[0.08] hover:border-black/25")}
    >
      {body}
    </Link>
  );
}

function ReportList({ reports }: { reports: typeof REPORTS }) {
  if (reports.length === 0)
    return (
      <EmptyState
        title="No reports yet."
        body="Open a standard and convert it to get one."
      />
    );
  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.08] bg-white">
      {reports.map((r, i) => (
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
            <div className="truncate text-[14px] text-black/85">{r.title}</div>
            <div className="mt-0.5 text-[12px] text-black/40">
              {getStandard(r.standardId)?.name} · {r.period} · Created{" "}
              {r.createdAt}
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
  );
}
