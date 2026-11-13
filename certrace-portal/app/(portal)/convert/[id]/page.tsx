"use client";

/* ════════════════════════════════════════════════════════════
   ONE STANDARD — what converting into it needs, and the button that does it

   Logo, name and description on top, with Export for verification: a plain
   download, or on CBAM one menu that also holds pre-verification (quota,
   submit, top up). Under them three status
   dots (complete, under review, reporting: red ready, yellow in progress,
   green completed), the reporting year, and each requirement with its
   readiness: Fill in opens the workspace, and a Smart Link is offered only
   where the data comes from someone outside. Export and submit stay locked
   until every requirement is complete (D21). Last, the pre-verification
   status. Readiness is live (lib/convert/requirements.ts).
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Download,
  Link2,
  PencilLine,
  Search,
} from "lucide-react";
import {
  Button,
  ButtonLink,
  Card,
  Chip,
  Progress,
  StatusDot,
  cn,
  inputClass,
  type Tone,
} from "@/components/ui";
import { toast } from "@/components/toast";
import { YearBar } from "@/components/year-bar";
import { currentYear } from "@/lib/year-range";
import { StandardLogo } from "@/components/convert/standard-logo";
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
import { withInstallationDefaults } from "@/lib/cbam/installation-defaults";
import { listWorkspaces } from "@/lib/workspace";
import { listSuppliers } from "@/lib/precursor-suppliers";
import { listEvidence } from "@/lib/workspace-evidence";
import { getCarbonPrice } from "@/lib/carbon-price";
import { buildVerificationExport } from "@/lib/export/verification-export";
import { buildXlsx } from "@/lib/xlsx-write";
import { createItemLink } from "@/lib/api/item-links";
import {
  PreverifyMenu,
  PreverifyPanel,
  usePreverification,
} from "@/components/convert/preverify-panel";
import { stageDots, type StageDot } from "@/lib/api/preverifications";

const STATE: Record<
  RequirementState,
  { label: string; tone: "ok" | "warn" | "err" }
> = {
  complete: { label: "Complete", tone: "ok" },
  "in-progress": { label: "In progress", tone: "warn" },
  missing: { label: "Missing", tone: "err" },
};

// An own plant is the default, so only the other roles get a label.
const ROLE_LABEL = {
  oem: "OEM plant",
  supplier: "Supplier plant",
} as const;

const DOT: Record<StageDot, { tone: Tone; label: string }> = {
  ready: { tone: "err", label: "Ready" },
  progress: { tone: "warn", label: "In progress" },
  done: { tone: "ok", label: "Completed" },
};

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
  const { sheets: yearSheets, cells: yearCells } = useWorkbook(
    installation?.id ?? null,
    year,
  );
  const cells = React.useMemo(
    () => withInstallationDefaults(yearCells ?? {}, installation, year),
    [yearCells, installation, year],
  );

  const valid = s != null && s.status !== "soon";
  // Only the current year has data so far: any other year shows every requirement missing.
  const locked = year !== thisYear;
  // Readiness and the export read the same year, so the gate cannot pass on one year and export another.
  const live =
    s && valid
      ? liveRequirements(s, { installation, sheets: yearSheets, cells })
      : [];
  const requirements: LiveRequirement[] = locked
    ? live.map((r) => ({ ...r, state: "missing", progress: 0 }))
    : live;
  const pct = readiness(requirements);
  const incomplete = requirements.filter((r) => r.state !== "complete");
  // Export stays locked until every requirement is complete, but Convert itself stays open to browse (D21).
  const canConvert = valid && incomplete.length === 0;
  const isCbam = valid && s?.id === "eu-cbam";
  // Called before the early return below, so the hook order never changes between renders.
  const pv = usePreverification(
    installation?.id ?? null,
    year,
    canConvert,
    isCbam,
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

  const role = installation ? installationRole(installation) : null;
  const q = query.trim().toLowerCase();
  const rows = requirements.filter(
    (r) => !q || r.title.toLowerCase().includes(q),
  );
  // A declaration names its period; without one, the year it was created (or last changed) stands in.
  const yearHistory = declarations.filter((d) => declarationYear(d) === year);
  const dots = stageDots(
    requirements,
    pv.state ?? "incomplete",
    yearHistory.length > 0,
  );
  const stages: { label: string; dot: StageDot }[] = [
    { label: "Complete", dot: dots.complete },
    ...(isCbam
      ? [
          { label: "Under review", dot: dots.review },
          { label: "Reporting", dot: dots.reporting },
        ]
      : []),
  ];
  // Fill in opens the workbook: CBAM answers on the CBAM tab, everything else on the sheets.
  const fillHref = installation
    ? `/workspace?installation=${encodeURIComponent(installation.id)}&year=${year}${isCbam ? "&sheet=cbam" : ""}`
    : null;

  /* The verification file: only the allowlisted scope, built from the year's workbook and the
     installation's verification workspaces (lib/export/verifier-scope.ts). */
  const exportVerification = () => {
    if (!canConvert || !installation) return;
    try {
      const wss = listWorkspaces().filter(
        (w) => w.installationId === installation.id && w.year === year,
      );
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
      toast({
        message: t("Verification file downloaded"),
        detail: out.fileName,
      });
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
            {role && role !== "own" && (
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
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            {isCbam && installation ? (
              <PreverifyMenu
                pv={pv}
                canConvert={canConvert}
                onExport={exportVerification}
              />
            ) : (
              <Button
                onClick={exportVerification}
                disabled={!canConvert || !installation}
                aria-describedby={canConvert ? undefined : "convert-incomplete"}
              >
                <Download size={15} strokeWidth={1.5} />
                {t("Export for verification")}
              </Button>
            )}
          </div>
          {!canConvert && (
            <p
              id="convert-incomplete"
              className="max-w-xs text-[12px] leading-relaxed text-black/50 md:text-right"
            >
              {t("{n} requirements left before you can export or submit.", {
                n: incomplete.length,
              })}
            </p>
          )}
        </div>
      </div>

      <ol aria-label={t("Progress")} className="flex flex-wrap gap-2">
        {stages.map((st) => (
          <li
            key={st.label}
            className="flex items-center gap-2 rounded-full border border-black/[0.07] bg-white px-3 py-1.5 text-[12.5px]"
          >
            <StatusDot tone={DOT[st.dot].tone} className="h-2 w-2" />
            <span className="text-black/80">{t(st.label)}</span>
            <span className="text-black/45">{t(DOT[st.dot].label)}</span>
          </li>
        ))}
      </ol>

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
                installationId={installation?.id ?? null}
                fillHref={fillHref}
                year={year}
                first={i === 0}
                open={open === r.id}
                onToggle={() => setOpen((v) => (v === r.id ? null : r.id))}
              />
            ))
          )}
        </Card>
      </section>

      {isCbam && installation && <PreverifyPanel pv={pv} />}
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
      href={
        installation
          ? `/convert?installation=${encodeURIComponent(installation)}`
          : "/convert"
      }
      className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.08em] text-black/40 hover:text-black"
    >
      <ArrowLeft size={14} strokeWidth={1.5} /> Convert
    </Link>
  );
}

function RequirementRow({
  r,
  installationId,
  fillHref,
  year,
  first,
  open,
  onToggle,
}: {
  r: LiveRequirement;
  installationId: string | null;
  /** The workspace for this installation and year; null until an installation is chosen. */
  fillHref: string | null;
  year: number;
  first: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const t = useT();
  const st = STATE[r.state];
  const [linking, setLinking] = React.useState(false);
  // Fill in opens the workspace. A Smart Link hands the form to someone outside, so it shows only where the data is theirs.
  const fillIn = (
    <>
      <PencilLine size={13} strokeWidth={1.5} /> {t("Fill in")}
    </>
  );
  const smartLink = (
    <>
      <Link2 size={13} strokeWidth={1.5} />{" "}
      {linking ? t("Creating…") : t("Smart Link")}
    </>
  );
  const copySmartLink = async () => {
    if (!installationId) return;
    setLinking(true);
    try {
      const { path } = await createItemLink({
        installationId,
        year,
        itemKey: r.id,
      });
      const url = `${window.location.origin}${path}`;
      await navigator.clipboard.writeText(url).catch(() => undefined);
      toast(t("Smart Link copied. Send it to whoever fills this in."));
    } catch {
      toast(t("Could not create the Smart Link. Try again."));
    } finally {
      setLinking(false);
    }
  };
  const linkable = r.fix === "smart-link";
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
            {fillHref && installationId ? (
              <>
                <ButtonLink
                  href={fillHref}
                  variant={linkable ? "secondary" : "primary"}
                  size="sm"
                >
                  {fillIn}
                </ButtonLink>
                {linkable && (
                  <Button size="sm" disabled={linking} onClick={copySmartLink}>
                    {smartLink}
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="secondary" size="sm" disabled>
                  {fillIn}
                </Button>
                {linkable && (
                  <Button variant="secondary" size="sm" disabled>
                    {smartLink}
                  </Button>
                )}
                <span className="text-[12px] text-black/40">
                  {t("Choose an installation")}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
