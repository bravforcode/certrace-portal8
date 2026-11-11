"use client";

/* ════════════════════════════════════════════════════════════
   ONE STANDARD — what converting into it needs, and the button that does it

   Logo, name and description on top, with the one primary action: convert
   the workspace data into the standard's report. Under it, the reporting
   year (only the current one is open; later years are locked), then each
   requirement with its readiness and the one way to work on it — fill it in,
   or request it through a Smart Link, depending on whose data it is. The
   report stays locked until every requirement is complete (D21). Last, the
   reports already generated for that year. Readiness is live
   (lib/convert/requirements.ts).
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronDown, Link2, PencilLine, Search } from "lucide-react";
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
import { DeclarationRows } from "@/components/convert/declaration-rows";
import { ScopedInstallationSwitcher } from "@/components/scoped-installation-switcher";
import { useDeclarations } from "@/lib/declarations-query";
import { useT } from "@/lib/i18n";
import { getStandard, type RequirementState } from "@/lib/convert-standards";
import {
  liveRequirements,
  readiness,
  type LiveRequirement,
} from "@/lib/convert/requirements";
import { useConvertContext } from "@/lib/convert/use-convert-context";
import { installationRole } from "@/lib/installations";
import { declarationYear } from "@/lib/convert/declaration-year";
import { useWorkbook } from "@/lib/workbook/use-workbook";
import { listWorkspaces } from "@/lib/workspace";
import { listSuppliers } from "@/lib/precursor-suppliers";
import { listEvidence } from "@/lib/workspace-evidence";
import { getCarbonPrice } from "@/lib/carbon-price";
import { buildVerificationExport } from "@/lib/export/verification-export";
import { buildXlsx } from "@/lib/xlsx-write";

const STATE: Record<
  RequirementState,
  { label: string; tone: "ok" | "warn" | "err" }
> = {
  complete: { label: "Complete", tone: "ok" },
  "in-progress": { label: "In progress", tone: "warn" },
  missing: { label: "Missing", tone: "err" },
};

const ROLE_LABEL = { own: "Own plant", oem: "OEM plant", supplier: "Supplier plant" } as const;

export default function ConvertStandardPage() {
  return (
    <React.Suspense fallback={null}>
      <ConvertStandardInner />
    </React.Suspense>
  );
}

function ConvertStandardInner() {
  const { id } = useParams<{ id: string }>();
  const s = getStandard(id);
  const t = useT();
  const { installation } = useConvertContext();
  const { data: declarations = [] } = useDeclarations();
  const [more, setMore] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState<string | null>(null);
  const thisYear = currentYear();
  const [year, setYear] = React.useState(thisYear);
  const { sheets: yearSheets } = useWorkbook(installation?.id ?? null, year);

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
  // Readiness and the export read the same year, so the gate cannot pass on one year and export another.
  const live = liveRequirements(s, { installation, sheets: yearSheets });
  const requirements: LiveRequirement[] = locked
    ? live.map((r) => ({ ...r, state: "missing", progress: 0 }))
    : live;
  const pct = readiness(requirements);
  const incomplete = requirements.filter((r) => r.state !== "complete");
  // Export stays locked until every requirement is complete, but Convert itself stays open to browse (D21).
  const canConvert = incomplete.length === 0;
  const role = installation ? installationRole(installation) : null;
  const q = query.trim().toLowerCase();
  const rows = requirements.filter(
    (r) => !q || r.title.toLowerCase().includes(q),
  );
  // A declaration names its period; without one, the year it was created (or last changed) stands in.
  const yearHistory = declarations.filter((d) => declarationYear(d) === year);

  /* The verification file: only the allowlisted scope, built from the year's workbook and the
     installation's verification workspaces (lib/export/verifier-scope.ts). */
  const exportVerification = () => {
    if (!canConvert || !installation) return;
    try {
      const wss = listWorkspaces().filter((w) => w.installationId === installation.id && w.year === year);
      const out = buildVerificationExport({
        installation,
        year,
        sheets: yearSheets,
        suppliers: wss.flatMap((w) => listSuppliers(w.id)),
        evidence: wss.flatMap((w) => listEvidence(w.id)),
        carbonPrices: wss
          .map((w) => ({ label: w.productName, record: getCarbonPrice(w.id) }))
          .filter((c) => c.record.recorded),
        generatedAt: new Date(),
        t: (en) => t(en),
      });
      const blob = new Blob([buildXlsx(out.sheets) as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = out.fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast({ message: t("Verification file downloaded"), detail: out.fileName });
    } catch (err) {
      toast({
        message: t("Could not build the verification file"),
        tone: "err",
        detail: err instanceof Error ? err.message : undefined,
      });
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackLink />
        <ScopedInstallationSwitcher />
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-4">
          <StandardLogo logo={s.logo} className="h-12 w-12" />
          <div className="min-w-0">
            <h1 className="font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
              {s.name}
            </h1>
            {role && (
              <div className="mt-2">
                <Chip tone="muted">{t(ROLE_LABEL[role])}</Chip>
              </div>
            )}
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

        <div className="flex flex-none flex-col items-start gap-2 md:items-end">
          <Button
            onClick={exportVerification}
            disabled={!canConvert || !installation}
            title={
              canConvert
                ? undefined
                : `${t("Complete first")}: ${incomplete.map((r) => r.title).join(", ")}`
            }
            aria-describedby={canConvert ? undefined : "convert-incomplete"}
            className="self-start"
          >
            {t("Export for verification")}
          </Button>
          {!canConvert && (
            <p
              id="convert-incomplete"
              className="max-w-xs text-[12px] leading-relaxed text-black/50 md:text-right"
            >
              {t("Complete first")}:{" "}
              {incomplete.map((r, i) => (
                <React.Fragment key={r.id}>
                  {i > 0 && ", "}
                  {r.href ? (
                    <Link href={r.href} className="underline underline-offset-2 hover:text-black">
                      {r.title}
                    </Link>
                  ) : (
                    r.title
                  )}
                </React.Fragment>
              ))}
            </p>
          )}
        </div>
      </div>

      {/* Reporting year: the shared bar (2020 → five years ahead, opening on
          the current year). Years ahead carry a lock but still open: they
          show every requirement as missing, as does any earlier year. */}
      <YearBar
        value={year}
        onChange={(y) => setYear(y)}
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
              {t("{done} of {total} requirements complete", {
                done: requirements.length - incomplete.length,
                total: requirements.length,
              })}
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
                open={open === r.id}
                onToggle={() => setOpen((v) => (v === r.id ? null : r.id))}
              />
            ))
          )}
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-[family-name:var(--font-plex)] text-xl font-light tracking-tight text-[#111]">
            Report history
          </h2>
          <p className="mt-1 text-[12px] text-black/40">
            {t("History covers all installations.")}
          </p>
        </div>
        {yearHistory.length === 0 ? (
          <EmptyState title={t("No reports generated for {year} yet.", { year })} />
        ) : (
          <DeclarationRows items={yearHistory} />
        )}
      </section>
    </div>
  );
}

/* Keeps the installation picked on Convert (`?installation=`) when going back. */
function BackLink() {
  return (
    <React.Suspense fallback={null}>
      <BackLinkInner />
    </React.Suspense>
  );
}

function BackLinkInner() {
  const installation = useSearchParams().get("installation");
  return (
    <Link
      href={installation ? `/convert?installation=${encodeURIComponent(installation)}` : "/convert"}
      className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.08em] text-black/40 hover:text-black"
    >
      <ArrowLeft size={14} strokeWidth={1.5} /> Convert
    </Link>
  );
}

function RequirementRow({
  r,
  first,
  open,
  onToggle,
}: {
  r: LiveRequirement;
  first: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const t = useT();
  const st = STATE[r.state];
  // One way to work on it, by whose data it is: an own gap is filled in, a supplier's is requested through a Smart Link.
  const action =
    r.fix === "fill-in"
      ? { label: t("Fill in"), icon: <PencilLine size={13} strokeWidth={1.5} /> }
      : { label: t("Request via Smart Link"), icon: <Link2 size={13} strokeWidth={1.5} /> };
  return (
    <div
      className={cn(
        "border-l-2 border-l-transparent transition-colors duration-700 ease-out",
        !first && "border-t border-t-black/[0.06]",
      )}
    >
      <div className="px-5 py-3 transition-colors hover:bg-[#fafaf8]">
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
          <span className="hidden text-[12px] tabular-nums text-black/40 md:inline">
            {r.progress}%
          </span>
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
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {r.href ? (
              <ButtonLink href={r.href} variant="secondary" size="sm">
                {action.icon} {action.label}
              </ButtonLink>
            ) : (
              <>
                <Button variant="secondary" size="sm" disabled>
                  {action.icon} {action.label}
                </Button>
                <span className="text-[12px] text-black/40">{t("Choose an installation")}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
