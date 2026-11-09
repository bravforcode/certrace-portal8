"use client";

export const runtime = "edge";

/* ════════════════════════════════════════════════════════════
   INSTALLATION · READINESS — can this site hand over its reports for the year?

   Readiness moved here from the product report: the monitoring plan, the
   operator's emissions report and the summary report are filed per
   installation and reporting year, so the year is read as a whole.

     1 · the year, chosen at the top
     2 · the installation's one-time information (Annex IV items 1–6)
     3 · every product report of the year, with its readiness and — opened —
         its materiality self-check and carbon price
     4 · WHAT GOES TO THE VERIFIER: three reports (the monitoring plan, the
         operator's emissions report, the summary report), a fourth where the
         declarant-specific addendum applies, and two attachments — the
         verification reports of the precursors' installations and the supporting
         evidence. Each lists what it contains, item by item, with a state.

   THE SET LEAVES AS ONE PACKAGE — a zip of every report, one button. The button
   is live only when the installation's information, every product report of the
   year and every report's own items are complete; until then it is inactive and
   the card says what is holding it. There are no loose, half-finished copies.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ChevronDown, Download } from "lucide-react";
import { Button, Chip, Field, Modal, Progress, cn, inputClass } from "@/components/ui";
import { Select } from "@/components/controls";
import { toast } from "@/components/toast";
import { Note, SectionCard, StateChip } from "@/components/workspace/chrome";
import { MaterialityBlock } from "@/components/workspace/readiness-sections";
import { useInstallationPage } from "@/components/workspace/installation-provider";
import { installationHref } from "@/components/workspace/installation-menu";
import { AnnexTag } from "@/components/precursor/annex-fields";
import { ITEM_STATE_LABEL, reportPackageFileName, type ItemState, type ReportDoc, type ReportRow, type RowGuide } from "@/lib/cbam/report-set";
import { WHERE_LABEL, translateValue } from "@/lib/cbam/report-guidance";
import { documentsInPackage, packageStatus } from "@/lib/cbam/package-status";
import { profileGroups } from "@/lib/cbam/installation-profile";
import { evidenceFilesForPackage } from "@/lib/cbam/package-evidence";
import { downloadReportPackage } from "@/lib/cbam/report-set-pdf";
import { workspaceReadiness } from "@/lib/readiness";
import { useSignOffPack, useSignOffState } from "@/lib/workspace-data-query";
import { SIGNOFF_DISCLAIMER, type SignOffState } from "@/lib/pack-signoff";
import { useAccount } from "@/components/account-lock";
import { LOCK_DESTINATION } from "@/lib/plan";
import type { VerificationWorkspace } from "@/lib/workspace";
import { dateLocaleNow, useT } from "@/lib/i18n";

const STATE_TONE: Record<ItemState, "ok" | "warn" | "err" | "muted" | "info"> = {
  ready: "ok",
  partial: "warn",
  missing: "err",
  not_applicable: "muted",
  outside: "info",
};

export default function InstallationReadinessPage() {
  return (
    <React.Suspense fallback={null}>
      <Readiness />
    </React.Suspense>
  );
}

function Readiness() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const { id, installation, workspaces } = useInstallationPage();
  const years = [...new Set(workspaces.map((w) => w.year))].sort((a, b) => b - a);
  const year = Number(params.get("year")) || years[0];
  const [tick, setTick] = React.useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const status = React.useMemo(() => packageStatus({ installation, workspaces, year }), [installation, workspaces, year, tick]);
  const { reports: readiness, percent, reportsComplete, profile, set, ready, packageReady, fingerprint } = status;
  const firstGap = React.useMemo(() => profileGroups(installation).flatMap((g) => g.items).find((x) => !x.done), [installation]);
  const [busy, setBusy] = React.useState(false);

  /* ── The sign-off gate, per installation and reporting year ───────
     One person inside the company puts their name to the figures before the
     set leaves. It records a fingerprint of the figures, so changing a month,
     a precursor or a document afterwards lapses it (lib/pack-signoff.ts). The
     record is keyed by the installation and the year because that is what the
     set is. */
  const signKey = status.signKey;
  const signQuery = useSignOffState(signKey, ready, fingerprint);
  const signState: SignOffState = signQuery.data ?? { kind: "draft_open", signOff: null };
  const signPack = useSignOffPack();
  const [signOpen, setSignOpen] = React.useState(false);
  const [signName, setSignName] = React.useState("");
  const [signTitle, setSignTitle] = React.useState("");
  const confirmSignOff = () => {
    if (!signName.trim() || !signTitle.trim()) return;
    signPack.mutate({ workspaceId: signKey, name: signName, jobTitle: signTitle, fingerprint });
    setSignOpen(false);
    toast({ message: "Signed off", detail: `${signName.trim()} · ${signTitle.trim()}. The reports can now be downloaded.`, tone: "ok" });
  };
  /* Signing off is optional: it puts a name on the cover of every report in the
     package, and it lapses if the figures move afterwards. */

  /* What a free trial holds back is the METHODOLOGY document (lib/config.ts
     TRIAL_PLAN, `methodologyDoc`) — here, the monitoring plan. The package is
     still one file, but on a trial it is built without that report, and the
     card says so. The operator's emissions report and the summary are the
     outcome of the whole portal and come with the trial. */
  const { plan } = useAccount();
  const methodologyLocked = !plan.features.methodologyDoc;
  const packaged = documentsInPackage(set, methodologyLocked);

  const downloadPackage = async () => {
    setBusy(true);
    try {
      const fileName = reportPackageFileName(installation, year);
      const extraFiles = evidenceFilesForPackage(workspaces, year);
      await downloadReportPackage(packaged, { installation, year, signedBy: signState.kind === "signed" ? `${signState.signOff.name}, ${signState.signOff.jobTitle}` : undefined, extraFiles }, fileName);
      toast({ message: "Package downloaded", detail: `${fileName} · ${packaged.length} documents + ${extraFiles.length} files`, tone: "ok" });
    } catch (e) {
      toast({ message: "Could not build the package", detail: e instanceof Error ? e.message : String(e), tone: "err" });
    } finally {
      setBusy(false);
    }
  };

  if (years.length === 0) {
    return <Note>{t("No product report yet — create one and its readiness appears here.")}</Note>;
  }

  return (
    <div className="space-y-5">
      <div className="max-w-xs">
        <span className="mb-1.5 block text-[10px] uppercase tracking-[0.1em] text-black/40">{t("Reporting year")}</span>
        <Select
          value={String(year)}
          onChange={(v) => router.replace(`${installationHref(id, "readiness")}?year=${v}`)}
          options={years.map((y) => ({ value: String(y), label: String(y) }))}
          ariaLabel={t("Reporting year")}
        />
      </div>

      <SectionCard title={t("Overall readiness")} blurb={t("The average of this year's product reports. A tab is green only when a verifier would find nothing missing there.")}>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Progress value={percent} tone={reportsComplete ? "ok" : "warn"} />
          </div>
          <span className="font-mono text-[13px] tabular-nums text-black/55">{percent}%</span>
        </div>
        <p className={cn("mt-3 text-[12.5px]", profile.complete ? "text-black/45" : "text-[#b45309]")}>
          {profile.complete ? (
            t("The installation's one-time information is complete.")
          ) : (
            <>
              {t("Installation info {a}/{b} — {n} still to answer:", { a: profile.answered, b: profile.total, n: profile.gaps.length })}{" "}
              {profile.gaps.slice(0, 4).map((g) => g.tag).join(", ")}
              {profile.gaps.length > 4 ? "…" : ""}{" "}
              <Link href={firstGap ? `${installationHref(id)}#${firstGap.anchor}` : installationHref(id)} className="whitespace-nowrap underline underline-offset-2">
                {t("Fill them in")}
              </Link>
            </>
          )}
        </p>
        {!profile.complete && <p className="mt-1.5 text-[12px] text-black/45">{t("Until then every product report of this site reads Blocked and the package stays locked.")}</p>}
      </SectionCard>

      <SectionCard title={t("Product reports")} blurb={t("Each report of the year. Open one to see its materiality self-check.")}>
        <ul className="space-y-3">
          {readiness.map(({ w, r }) => (
            <ReportRow key={w.id} workspace={w} state={r.overall} percent={r.percentComplete} defaultOpen={params.get("open") === w.id} onChanged={() => setTick((n) => n + 1)} />
          ))}
        </ul>
      </SectionCard>

      <SectionCard
        title={t("What goes to the verifier")}
        blurb={t("Everything this installation hands over for {year}, in one package: the reports you write, and the papers that travel with them.", { year })}
        actions={
          <Button size="sm" className="whitespace-nowrap" onClick={() => void downloadPackage()} disabled={!packageReady || busy} title={packageReady ? undefined : t("Every report has to be complete first")}>
            <Download size={13} strokeWidth={1.5} /> {busy ? t("Building…") : t("Download package")}
          </Button>
        }
      >
        {signState.kind === "signed" && (
          <div className="mb-4">
            <Note tone="info">
              {t("Signed off by")} <strong>{signState.signOff.name}</strong> · {signState.signOff.jobTitle} on{" "}
              {new Date(signState.signOff.signedAt).toLocaleDateString(dateLocaleNow(), { day: "numeric", month: "short", year: "numeric" })}.
            </Note>
          </div>
        )}
        {signState.kind === "stale" && (
          <div className="mb-4">
            <Note tone="warn">
              {t("The figures have changed since")} <strong>{signState.signOff.name}</strong> {t("signed. Sign again before sending — a signature against superseded numbers is worse than none.")}
            </Note>
          </div>
        )}
        {packageReady && methodologyLocked && (
          <div className="mb-4">
            <Note tone="info">
              {t("Your free trial leaves the monitoring plan out of the package.")}{" "}
              <Link href={LOCK_DESTINATION} className="underline underline-offset-2">
                {t("See plans")}
              </Link>
            </Note>
          </div>
        )}
        {ready && signState.kind !== "signed" && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Note tone="info">{t("Everything is complete. One person inside your company can sign these figures off, so the reports carry their name.")}</Note>
            <Button size="sm" onClick={() => setSignOpen(true)}>
              {signState.kind === "stale" ? t("Sign again") : t("Sign off")}
            </Button>
          </div>
        )}
        <PackageCount set={set} />

        <details className="mb-6 rounded-xl border border-black/[0.07]">
          <summary className="cursor-pointer px-4 py-2.5 text-[11px] uppercase tracking-[0.1em] text-black/45 hover:text-black">{t("Before it goes to the verifier")}</summary>
          <ul className="space-y-1.5 px-4 pb-3.5 pl-8 text-[12.5px] leading-relaxed text-black/60 [list-style:disc]">
            <li>{t("Check that the product names, CN codes and embedded emissions in the summary report match the invoices and the communication your EU buyers receive.")}</li>
            <li>{t("Look at the share of embedded emissions on default values (summary report, item 4(b)). A default is a published figure with the year’s mark-up added, not something you measured.")}</li>
            <li>{t("Keep the records behind every figure at the installation for at least six years after the reporting period.")}</li>
          </ul>
        </details>

        <p className="mb-2 text-[11px] uppercase tracking-[0.1em] text-black/45">{t("Reports")}</p>
        <div className="space-y-3">
          {set.reports.map((report, n) => (
            <DocBox key={report.kind} report={report} mark={String(n + 1)} locked={methodologyLocked && report.kind === "monitoring_plan"} />
          ))}
          {set.notNeeded.map((report) => (
            <div key={report.kind} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-black/[0.12] px-4 py-3.5">
              <div className="min-w-0">
                <p className="text-[14px] text-black/55">{t(report.title)}</p>
                <p className="mt-0.5 text-[12px] text-black/40">{t(report.notApplicable ?? "")}</p>
              </div>
              <Chip tone="muted">{t("Not needed")}</Chip>
            </div>
          ))}
        </div>

        <p className="mb-1 mt-6 text-[11px] uppercase tracking-[0.1em] text-black/45">{t("Attachments")}</p>
        <p className="mb-2 text-[12px] text-black/45">{t("Not reports you write. Each is an index of papers that travel in the package, beside the reports — and neither holds the package back.")}</p>
        <div className="space-y-3">
          {set.attachments.map((report, n) => (
            <DocBox key={report.kind} report={report} mark={String.fromCharCode(97 + n)} attachment />
          ))}
        </div>
      </SectionCard>

      <Modal
        open={signOpen}
        onClose={() => setSignOpen(false)}
        eyebrow={t("Internal sign-off")}
        title={t("Who is approving these figures?")}
        lead={t("The reports carry your company's name. One person inside the business puts theirs to them before they go out.")}
        footer={
          <>
            <Button size="sm" variant="secondary" onClick={() => setSignOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button size="sm" disabled={!signName.trim() || !signTitle.trim()} onClick={confirmSignOff}>
              {t("Sign off")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("Name")} hint={t("The person answering for these figures, not the person clicking.")}>
              <input className={inputClass} value={signName} onChange={(e) => setSignName(e.target.value)} autoFocus />
            </Field>
            <Field label={t("Job title")} hint={t("A verifier reads this to know whether the signatory could have known.")}>
              <input className={inputClass} value={signTitle} onChange={(e) => setSignTitle(e.target.value)} />
            </Field>
          </div>
          <Note tone="muted">{SIGNOFF_DISCLAIMER}</Note>
          <Note tone="warn">{t("If any figure changes after this — a month re-submitted, a precursor corrected, a document added — the sign-off lapses and has to be repeated.")}</Note>
        </div>
      </Modal>
    </div>
  );
}

/* One product report: its state, and — opened — the two annual checks that
   stay per report. */
function ReportRow({
  workspace,
  state,
  percent,
  defaultOpen,
  onChanged,
}: {
  workspace: VerificationWorkspace;
  state: Parameters<typeof StateChip>[0]["state"];
  percent: number;
  defaultOpen?: boolean;
  onChanged: () => void;
}) {
  const t = useT();
  const [open, setOpen] = React.useState(Boolean(defaultOpen));
  return (
    <li className="rounded-xl border border-black/[0.07]">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-w-0 flex-1 basis-[12rem] items-center gap-2.5 text-left">
          <ChevronDown size={15} strokeWidth={1.5} className={cn("flex-none text-black/35 transition-transform", !open && "-rotate-90")} />
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] text-black/80">{t(workspace.productName)}</span>
            <span className="whitespace-nowrap font-mono text-[11px] text-black/40">CN {workspace.cnCode || "—"}</span>
          </span>
        </button>
        <span className="font-mono text-[11px] text-black/45">{percent}%</span>
        <StateChip state={state} />
        <Link href={`/workspaces/${workspace.id}`} className="text-[11px] uppercase tracking-[0.1em] text-black/45 underline underline-offset-2 hover:text-black">
          {t("Open report")}
        </Link>
      </div>
      {open && <ReportDetails workspace={workspace} onChanged={onChanged} />}
    </li>
  );
}

function ReportDetails({ workspace }: { workspace: VerificationWorkspace; onChanged: () => void }) {
  const readiness = React.useMemo(() => workspaceReadiness(workspace), [workspace]);
  /* The carbon price is NOT here any more — it is its own tab on the product report, beside Precursors, because the claim is
     per good. What stays per report on this screen is the materiality self-check. */
  return (
    <div className="space-y-4 border-t border-black/[0.06] px-4 py-4">
      <MaterialityBlock workspace={workspace} readiness={readiness} />
    </div>
  );
}

/* How many things leave, in three tiles: the reports you write, the addendum (only where electricity goes to the EU), and the attachments. */
function PackageCount({ set }: { set: ReturnType<typeof packageStatus>["set"] }) {
  const t = useT();
  const written = set.reports.filter((r) => r.kind !== "declarant_addendum").length;
  const addendum = set.reports.some((r) => r.kind === "declarant_addendum");
  const tile = "rounded-xl border border-black/[0.07] bg-[#faf9f7] px-4 py-3.5";
  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-3">
      <div className={tile}>
        <p className="font-mono text-[26px] leading-none tabular-nums text-black/85">{written}</p>
        <p className="mt-2 text-[12.5px] text-black/75">{t("Reports")}</p>
        <p className="mt-0.5 text-[11.5px] leading-snug text-black/45">{t("Monitoring plan, operator's emissions report, summary report")}</p>
      </div>
      <div className={tile}>
        <p className="font-mono text-[26px] leading-none tabular-nums text-black/85">{addendum ? 1 : 0}</p>
        <p className="mt-2 text-[12.5px] text-black/75">{t("Addendum")}</p>
        <p className="mt-0.5 text-[11.5px] leading-snug text-black/45">{addendum ? t("Electricity goes to the EU — one per declarant") : t("Not needed — no electricity goes to the EU")}</p>
      </div>
      <div className={tile}>
        <p className="font-mono text-[26px] leading-none tabular-nums text-black/85">{set.attachments.length}</p>
        <p className="mt-2 text-[12.5px] text-black/75">{t("Attachments")}</p>
        <p className="mt-0.5 text-[11.5px] leading-snug text-black/45">{t("Precursor verification reports, supporting evidence")}</p>
      </div>
    </div>
  );
}

/* ── What a row that is not ready says: how to fill it, an example, and the screen ─────
   The instruction is in the reader's language; the EXAMPLE is always English, because it is an answer to be typed into a
   line of a report the regulation requires in English. */
function GuideBlock({ guide }: { guide: RowGuide }) {
  const t = useT();
  return (
    <div className="rounded-lg border border-black/[0.06] bg-[#faf9f7] px-3 py-2.5 text-[12px] leading-relaxed text-black/60">
      <p>{t(guide.how)}</p>
      {guide.example && (
        <p className="mt-1.5 text-[11.5px] text-black/50">
          <span className="mr-1.5 text-[10px] uppercase tracking-[0.1em] text-black/35">{t("Example")}</span>
          <span className="font-mono">{guide.example}</span>
        </p>
      )}
      <Link href={guide.href} className="mt-2 inline-flex items-center gap-1 whitespace-nowrap text-[11.5px] text-black/70 underline underline-offset-2 hover:text-black">
        {t("Open {place}", { place: t(WHERE_LABEL[guide.where]) })} <ArrowRight size={12} strokeWidth={1.5} />
      </Link>
    </div>
  );
}

/* One document of the package: what it is, who reads it, what it contains.

   OPENED, IT SHOWS WHAT IS LEFT, NOT EVERYTHING. A report has 20 to 60 items and most of them are ready or do not apply; listing all of them,
   each with its instruction open, made the page twenty thousand pixels tall and buried the three things a reader came to do. So it opens on "To do":
   where the work is (the screens that still owe it something), then only the rows that need something, each a single line that opens to
   its instruction, its example and the link. "All" brings back the rows that are ready or do not apply. */
function DocBox({ report, mark, locked, attachment }: { report: ReportDoc; mark: string; locked?: boolean; attachment?: boolean }) {
  const t = useT();
  const open = report.tally.missing + report.tally.partial;
  const [filter, setFilter] = React.useState<"todo" | "all">(open > 0 ? "todo" : "all");
  const [shown, setShown] = React.useState<Set<string>>(() => new Set());
  const toggle = (key: string) =>
    setShown((cur) => {
      const next = new Set(cur);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const needs = (r: ReportRow) => r.state === "missing" || r.state === "partial" || r.state === "outside";
  const total = report.sections.reduce((a, s) => a + s.rows.length, 0);
  const anyExample = report.sections.some((s) => s.rows.some((r) => r.guide?.example));
  return (
    <div className="rounded-xl border border-black/[0.07]">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5">
        <div className="flex min-w-0 gap-3">
          <span className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-[6px] border border-black/25 bg-white font-mono text-[11px] text-black/70">{mark}</span>
          <div className="min-w-0">
            <p className="text-[14px] text-black/85">{t(report.title)}</p>
            <p className="mt-0.5 font-mono text-[10.5px] text-black/40">{t(report.reg)}</p>
            <p className="mt-1 text-[12px] text-black/50">{t(report.purpose)}</p>
          </div>
        </div>
        <div className="flex flex-none items-center gap-2">
          <span className="font-mono text-[11px] text-black/40">
            {report.tally.ready} {t("ready")} · {open} {attachment ? t("to get") : t("to do")}
            {report.tally.not_applicable > 0 && <> · {report.tally.not_applicable} {t("not applicable")}</>}
          </span>
          {locked ? <Chip tone="muted">{t("Not in trial package")}</Chip> : <Chip tone={report.complete ? "ok" : attachment ? "info" : "warn"}>{report.complete ? t("Complete") : attachment ? t("Still to get") : t("To do")}</Chip>}
        </div>
      </div>
      <details className="border-t border-black/[0.06]">
        <summary className="cursor-pointer px-4 py-2.5 text-[11px] uppercase tracking-[0.1em] text-black/45 hover:text-black">{t("What it contains")}</summary>
        <div className="space-y-4 px-4 pb-4">
          {report.sections.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="inline-flex rounded-full border border-black/[0.1] bg-white p-0.5" role="group" aria-label={t("Show")}>
                {(["todo", "all"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    aria-pressed={filter === f}
                    className={cn(
                      "whitespace-nowrap rounded-full px-3 py-1 text-[11.5px] transition-colors",
                      filter === f ? "bg-[#111] text-white" : "text-black/55 hover:text-black",
                    )}
                  >
                    {f === "todo" ? `${attachment ? t("To get") : t("To do")} · ${open}` : `${t("All")} · ${total}`}
                  </button>
                ))}
              </div>
              {anyExample && filter === "todo" && <p className="text-[11.5px] text-black/40">{t("Examples are in English because the report is written in English.")}</p>}
            </div>
          )}

          {filter === "todo" && open === 0 && report.sections.length > 0 && <p className="text-[12.5px] text-[#047857]">{t("Nothing left to do here.")}</p>}

          {report.sections.map((s) => {
            const rows = s.rows.filter((r) => filter === "all" || needs(r));
            if (rows.length === 0) return null;
            const left = s.rows.filter(needs).length;
            return (
              <div key={s.title}>
                <p className="mb-1.5 flex items-baseline justify-between gap-3 text-[11px] uppercase tracking-[0.1em] text-black/45">
                  <span>{t(s.title)}</span>
                  {left > 0 && filter === "all" && <span className="font-mono normal-case tracking-normal text-[#b45309]">{t("{n} to do", { n: left })}</span>}
                </p>
                <ul className="divide-y divide-black/[0.05] overflow-hidden rounded-lg border border-black/[0.06]">
                  {rows.map((row, i) => {
                    const key = `${s.title}|${row.n}|${i}`;
                    const isOpen = shown.has(key);
                    const canOpen = Boolean(row.guide);
                    const head = (
                      <>
                        <AnnexTag tag={row.n} className="mt-px flex-none" />
                        <span className="min-w-0 flex-1">
                          <span className={cn("line-clamp-2 block", row.state === "not_applicable" ? "text-black/45" : "text-black/75")}>{t(row.label)}</span>
                          {row.state !== "missing" && <span className="block truncate text-[12px] text-black/40" title={translateValue(t, row.value)}>{translateValue(t, row.value)}</span>}
                        </span>
                        <Chip tone={STATE_TONE[row.state]} className="flex-none">{t(ITEM_STATE_LABEL[row.state])}</Chip>
                        {canOpen && <ChevronDown size={14} strokeWidth={1.5} className={cn("mt-0.5 flex-none text-black/30 transition-transform", !isOpen && "-rotate-90")} />}
                      </>
                    );
                    return (
                      <li key={key} className={cn("text-[12.5px]", row.state === "not_applicable" && "bg-[#fcfcfb]")}>
                        {canOpen ? (
                          <button type="button" onClick={() => toggle(key)} aria-expanded={isOpen} className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#fafaf8]">
                            {head}
                          </button>
                        ) : (
                          <div className="flex items-start gap-3 px-3 py-2.5">{head}</div>
                        )}
                        {isOpen && row.guide && (
                          <div className="px-3 pb-3">
                            <GuideBlock guide={row.guide} />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
          {report.sections.length === 0 && <p className="text-[12.5px] text-black/45">{report.notApplicable}</p>}
        </div>
      </details>
    </div>
  );
}
