"use client";

/* ════════════════════════════════════════════════════════════
   CONVERT — the standards a workspace's data can be turned into

   Laid out like an app directory: status tabs on the left with their counts,
   search on the right, then a grid of standards. The last tab, Report, is
   where finished reports are collected. Only EU CBAM opens; the rest are
   coming soon. Readiness is worked out live from the installation the page is
   scoped to and its workbook (lib/convert/requirements.ts).
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import {
  Chip,
  EmptyState,
  FilterChip,
  PageHeader,
  cn,
  inputClass,
} from "@/components/ui";
import { ScopedInstallationSwitcher } from "@/components/scoped-installation-switcher";
import { StandardLogo } from "@/components/convert/standard-logo";
import { DeclarationRows } from "@/components/convert/declaration-rows";
import { useDeclarations } from "@/lib/declarations-query";
import { useT } from "@/lib/i18n";
import { STANDARDS, type Standard } from "@/lib/convert-standards";
import { liveRequirements, readiness } from "@/lib/convert/requirements";
import { useConvertContext } from "@/lib/convert/use-convert-context";
import { installationRole } from "@/lib/installations";

type Tab = "all" | "in-progress" | "ready" | "report";
const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "in-progress", label: "In progress" },
  { key: "ready", label: "Ready" },
  { key: "report", label: "Report" },
];

const countFor = (tab: Tab, reports: number) =>
  tab === "all"
    ? STANDARDS.length
    : tab === "report"
      ? reports
      : STANDARDS.filter((s) => s.status === tab).length;

// An own plant is the default, so only the other roles get a label.
const ROLE_LABEL = {
  oem: "OEM plant",
  supplier: "Supplier plant",
} as const;

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

  const installationParam = params.get("installation");
  const go = (next: Tab) => {
    setTab(next);
    const q = new URLSearchParams();
    if (next !== "all") q.set("tab", next);
    if (installationParam) q.set("installation", installationParam);
    const qs = q.toString();
    router.replace(qs ? `/convert?${qs}` : "/convert", { scroll: false });
  };

  const t = useT();
  const { installation, sheets, cells } = useConvertContext();
  const { data: declarations = [] } = useDeclarations();
  const role = installation ? installationRole(installation) : null;
  const pctOf = (s: Standard) =>
    readiness(liveRequirements(s, { installation, sheets, cells }));

  const q = query.trim().toLowerCase();
  const matches = (s: Standard) =>
    !q || `${s.name} ${s.region}`.toLowerCase().includes(q);
  const shown = STANDARDS.filter(
    (s) => (tab === "all" || s.status === tab) && matches(s),
  );
  const live = shown.filter((s) => s.status !== "soon");
  const soon = shown.filter((s) => s.status === "soon");
  const reports = declarations.filter(
    (d) => !q || `${d.title ?? d.name} ${d.period}`.toLowerCase().includes(q),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Convert"
        lead="Turn your workspace data into the report each standard asks for."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {role && role !== "own" && (
              <Chip tone="muted">{t(ROLE_LABEL[role])}</Chip>
            )}
            <ScopedInstallationSwitcher />
          </div>
        }
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
              {label} ({countFor(key, declarations.length)})
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
            placeholder={
              tab === "report" ? "Search reports…" : "Search standards…"
            }
            aria-label="Search"
          />
        </div>
      </div>

      {tab === "report" ? (
        reports.length === 0 ? (
          <EmptyState
            title={t("No reports yet.")}
            body={t("Open a standard and convert it to get one.")}
          />
        ) : (
          <DeclarationRows items={reports} />
        )
      ) : shown.length === 0 ? (
        <EmptyState
          title={
            q
              ? `Nothing matches “${query}”.`
              : `No standard is ${TABS.find((x) => x.key === tab)?.label.toLowerCase()} yet.`
          }
          body={
            q
              ? undefined
              : "Standards show up here once their requirements reach this stage."
          }
        />
      ) : (
        <div className="space-y-10">
          {live.length > 0 && (
            <Section title="Available">
              {live.map((s) => (
                <StandardCard key={s.id} s={s} pct={pctOf(s)} />
              ))}
            </Section>
          )}
          {soon.length > 0 && (
            <Section title="Coming soon">
              {soon.map((s) => (
                <StandardCard key={s.id} s={s} pct={0} />
              ))}
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

function StandardCard({ s, pct }: { s: Standard; pct: number }) {
  const installation = useSearchParams().get("installation");
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
            <Chip tone={pct === 100 ? "ok" : "warn"}>{pct}% ready</Chip>
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
      href={`/convert/${s.id}${installation ? `?installation=${encodeURIComponent(installation)}` : ""}`}
      className={cn(box, "border-black/[0.08] hover:border-black/25")}
    >
      {body}
    </Link>
  );
}
