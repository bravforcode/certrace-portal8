"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Send,
  Bell,
  Inbox,
  Sparkles,
  ClipboardCheck,
  BadgeCheck,
  FileText,
  Download,
  Building2,
  Landmark,
  Link2,
  Lock,
  PenLine,
  Plus,
  TriangleAlert,
  CircleCheck,
  CircleX,
  Users,
  ChevronRight,
  History,
  Clock,
  Coins,
  Flame,
  EyeOff,
  Trash2,
  Factory,
  Paperclip,
  ShieldCheck,
} from "lucide-react";
import {
  Card,
  Button,
  Eyebrow,
  Chip,
  StatusDot,
  StatusLabel,
  Stat,
  Field,
  OptionalTag,
  Progress,
  inputClass,
  cn,
} from "./ui";
import { toast } from "./toast";
import { AddMemberModal } from "./add-member-modal";
import { DeclarationMenu } from "./declaration-menu";
import { UnitChangeNotice } from "./cbam/unit-change-notice";
import { planElectricityMigration } from "@/lib/cbam/electricity-migration";
import { FreezePanel } from "./cbam/freeze-panel";
import { LinkedShipments } from "./cbam/linked-shipments";
import { ReadinessScore } from "./cbam/readiness-score";
import { computeReadiness } from "@/lib/cbam/readiness-input";
import type { Readiness } from "@/lib/cbam/validate";
import { productionTonnes } from "@/lib/annual-production";
import { activeSnapshot, type CalculationSnapshot } from "@/lib/cbam/freeze";
import { loadDataset } from "@/lib/cbam/activity-store";
import { parsePrecursorTree, type PrecursorNode } from "@/lib/cbam/precursor-tree";
import { calendarYear, type ReportingPeriod } from "@/lib/cbam/boundary";
import type { ActivityDataset } from "@/lib/cbam/activity";
import type { GoodsCategory } from "@/lib/cbam/engine";
import { USER } from "@/lib/data";
import { Declaration } from "@/lib/data";
import { getRegulation, getJurisdiction, getCatalogProduct, type ResolvedCbamField } from "@/lib/config";
import { downloadPackage, downloadXmlFile } from "@/lib/download";
import { validateForRegistry, buildCbamXml } from "@/lib/cbam-xml";
import { formatPrecursors } from "@/lib/precursors";
import {
  sectionsForRequest,
  fieldsForSection,
  productFieldsForSection,
  fieldAppliesTo,
  isOnceField,
  valueKey,
  type SupplierSection,
} from "@/lib/supplier";
import {
  loadExporterState,
  rollup as buildRollup,
  approveSubmission,
  requestRevision,
  toggleReviewer,
  setRecipients as persistRecipients,
  pushToO3CI,
  acknowledgeRecipient,
  markPackageGenerated,
  requestReportSignoffs,
  confirmReportSignoff,
  withdrawReportSignoff,
  remindSupplier,
  lastReminderAt,
  resolveBuyers,
  addBuyer,
  removeBuyer,
  sendToBuyer,
  acknowledgeBuyer,
  LIFECYCLE_META,
  exporterIdentity,
  datasetHash,
  type ExporterDeclState,
  type ReviewSubmission,
  type ReviewRollup,
  type DispatchRecipient,
  type DeclarationBuyerState,
} from "@/lib/exporter-review";
import { loadTeam, getTeamMember, type TeamMember } from "@/lib/team-store";
import { FRESHNESS_META, SECTION_ACCESS, type Freshness } from "@/lib/supplier-records";
import {
  DEFAULT_PRICING,
  computeCost,
  concentration,
  fmtEUR,
  fmtTHB,
  loadPricing,
  productHotspots,
  savePricing,
  supplierHotspots,
  type CertificatePricing,
  type Hotspot,
  type ProductCost,
} from "@/lib/carbon-economics";
import { BENCHMARK_META, benchmark } from "@/lib/default-values";
import { computeComplianceFacts, yearFromPeriod, type ComplianceFacts } from "@/lib/compliance-engine";
import { buildSupplierChapters, buildSignOff, packageSummaryData, packageHistoryData } from "@/lib/package-data";
import { buildIntelligence, type IntelligenceReport } from "@/lib/compliance-intelligence";
import { useT, useLanguage, localeFor, type TFunction } from "@/lib/i18n";

/* The four steps of the flow, in the order a real exporter walks them, plus
   two always-available insight views. */
type StepKey = "submissions" | "report" | "signoff" | "dispatch";
type View = StepKey | "cost" | "intelligence" | "verification";

/* Server-safe zeroed roll-up so the first render matches before localStorage is
   read on mount (the real data depends on the supplier + exporter stores). */
const EMPTY_ROLL: ReviewRollup = {
  submissions: [],
  counts: { awaiting: 0, submitted: 0, in_review: 0, changes_requested: 0, approved: 0 },
  total: 0,
  submittedCount: 0,
  approvedCount: 0,
  awaitingCount: 0,
  changesCount: 0,
  allApproved: false,
  reviewedEmissions: 0,
  submittedEmissions: 0,
  warnings: 0,
  anomalies: 0,
  avgScore: null,
  stage: "collecting",
};

/* ════════════════════════════════════════════════════════════
   Declaration compliance workspace (exporter side · post-submission)

   Redesigned as ONE guided flow instead of eight peer tabs — the page always
   answers "what do I do now, and what's waiting on someone else":

     1  Supplier data      suppliers send data back; review each submission,
                           approve it or request a revision, loop in internal
                           reviewers (add new people from a popup)
     2  Generate report    unlocks when every supplier is approved — the
                           verification package (PDF) + Registry XML
     3  Internal sign-off  send the report to named people to preview;
                           each confirms before anything leaves the building
     4  Send & export      O3CI push / Communication Template to the EU
                           buyer, registry and verifier + acknowledgements

   Compliance Intelligence and the Verification Trail stay as supporting views.
   Locked steps stay visible and say exactly what unlocks them.
   ════════════════════════════════════════════════════════════ */
export function DeclarationWorkflow({ declaration }: { declaration: Declaration }) {
  const router = useRouter();
  const t = useT();
  const reg = getRegulation(declaration.regulation)!;
  const jur = getJurisdiction(declaration.origin)!;

  // exporter state lives in localStorage — hydrate after mount to avoid a
  // server/client mismatch, then re-read on focus so a supplier resubmission
  // in another tab shows up here without a backend.
  const [exporter, setExporter] = React.useState<ExporterDeclState>(() => loadExporterState(declaration.id));
  const [mounted, setMounted] = React.useState(false);
  const [view, setView] = React.useState<View>("submissions");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const refresh = React.useCallback(() => setExporter(loadExporterState(declaration.id)), [declaration.id]);
  React.useEffect(() => {
    setMounted(true);
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refresh]);

  const roll: ReviewRollup = React.useMemo(() => (mounted ? buildRollup(declaration, exporter) : EMPTY_ROLL), [declaration, exporter, mounted]);

  /* The frozen calculation, when there is one. Everything downstream of
     sign-off reads from it rather than from live inputs — that is what makes
     an approved figure stay approved (lib/cbam/freeze.ts). */
  const [snapshot, setSnapshot] = React.useState<CalculationSnapshot | null>(null);
  React.useEffect(() => {
    if (mounted) setSnapshot(activeSnapshot(declaration.id));
  }, [mounted, declaration.id, exporter]);

  // Default-value markup follows the reporting period, not today's date.
  const facts: ComplianceFacts = React.useMemo(
    () =>
      computeComplianceFacts(
        roll,
        yearFromPeriod(declaration.periodStart, declaration.period),
        snapshot
          ? {
              directPerTonne: snapshot.outputs.directPerTonne,
              indirectPerTonne: snapshot.outputs.indirectPerTonne,
              precursorPerTonne: snapshot.outputs.precursorPerTonne,
              version: snapshot.version,
              contentHash: snapshot.contentHash,
            }
          : null,
      ),
    [roll, declaration.periodStart, declaration.period, snapshot],
  );

  /* Live activity inputs, for the freeze panel to snapshot. Read once per
     hydration; the panel itself detects drift against the frozen hash. */
  const declPeriod: ReportingPeriod = React.useMemo(
    () =>
      declaration.periodStart && declaration.periodEnd
        ? { start: declaration.periodStart, end: declaration.periodEnd, type: "calendar_year" }
        : calendarYear(Number(/(20\d\d)/.exec(declaration.period)?.[1] ?? new Date().getFullYear())),
    [declaration.periodStart, declaration.periodEnd, declaration.period],
  );
  const [liveDataset, setLiveDataset] = React.useState<ActivityDataset | null>(null);
  React.useEffect(() => {
    if (mounted) setLiveDataset(loadDataset(declaration.id, declPeriod, USER.name));
  }, [mounted, declaration.id, declPeriod]);

  /* The exporter's own precursor chain — taken from the self-supplied
     submission when there is one, so the freeze covers the same tree the
     supplier form edits rather than a second copy of it. */
  const livePrecursorTree: PrecursorNode[] = React.useMemo(() => {
    const self = roll.submissions.find((s) => s.supplier.selfSupplied);
    if (!self) return [];
    for (const rp of self.request.products) {
      const parsed = parsePrecursorTree(self.values[valueKey("precursors", rp.product.id)]);
      if (parsed && parsed.length) return parsed;
    }
    return [];
  }, [roll.submissions]);

  const goodsCategory: GoodsCategory = React.useMemo(() => {
    const cats = new Set(roll.submissions.flatMap((s) => s.request.products.map((p) => p.product.category)));
    return cats.has("Aluminium") && cats.size === 1 ? "Aluminium" : "Iron & Steel";
  }, [roll.submissions]);
  const intel: IntelligenceReport = React.useMemo(() => buildIntelligence(roll, facts), [roll, facts]);
  const legalRequired = facts.anyCapViolations || facts.anyUnverifiedActual || roll.anomalies > 0;
  // Registry pre-flight over the approved dataset — the same check that gates
  // the XML download and the dispatch buttons, surfaced up here so the
  // next-action banner never claims "ready" while the Registry would reject.
  const preflightOk = React.useMemo(() => {
    const approved = roll.submissions.filter((s) => s.lifecycle === "approved");
    if (approved.length === 0) return true;
    return validateForRegistry(declaration, approved).isValid;
  }, [declaration, roll]);

  // flow gates — each step unlocks the next
  const generated = Boolean(exporter.packageGeneratedAt);
  const signoffs = exporter.signoffs ?? [];
  const confirmedSignoffs = signoffs.filter((s) => s.confirmedAt).length;
  const signoffPending = signoffs.length - confirmedSignoffs;
  const signoffComplete = generated && signoffs.length > 0 && signoffPending === 0;
  // One dataset can now go to several buyers — anything having left the
  // building counts as dispatched, not just the declaration's own buyer.
  const buyers = React.useMemo(() => resolveBuyers(declaration, exporter), [declaration, exporter]);
  const dispatched = Boolean(exporter.dispatch.o3ciPushedAt || exporter.dispatch.templateSentAt || buyers.some((b) => b.templateSentAt));

  // land the exporter on the step that actually needs them (once, after hydration)
  const initialised = React.useRef(false);
  React.useEffect(() => {
    if (!mounted || initialised.current) return;
    initialised.current = true;
    if (!roll.allApproved) return; // default "submissions"
    if (!generated) setView("report");
    else if (!signoffComplete) setView("signoff");
    else setView("dispatch");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // "the exporter is notified data is ready for review": watch for submissions
  // that arrived since the last read (e.g. a supplier submitted in another tab).
  const lastSubmittedCount = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (!mounted) return;
    if (lastSubmittedCount.current !== null && roll.submittedCount > lastSubmittedCount.current) {
      const delta = roll.submittedCount - lastSubmittedCount.current;
      toast({ message: t("{count} new submissions ready for review", { count: delta }), detail: t("Supplier data has been updated."), tone: "info" });
    }
    lastSubmittedCount.current = roll.submittedCount;
  }, [mounted, roll.submittedCount, t]);

  /* The verifier pre-check, V1..V16. The single number an exporter can act
     on, and every failing rule links to the screen that fixes it. */
  const [ready, setReady] = React.useState<Readiness | null>(null);
  React.useEffect(() => {
    if (mounted) setReady(computeReadiness(declaration, roll, USER.name));
  }, [mounted, declaration, roll, snapshot]);

  /* Electricity figures stored before the unit change (gap G1) — read as
     MWh/t and converted up, surfaced once so the exporter confirms rather than
     discovers the reinterpretation in a filed number. */
  const legacyElectricity = React.useMemo(
    () =>
      roll.submissions.flatMap((s) =>
        planElectricityMigration(
          s.values,
          s.request.products.map((rp) => ({ id: rp.product.id, name: rp.product.name })),
        ).rows.map((r) => ({ ...r, supplierName: s.supplier.name })),
      ),
    [roll.submissions],
  );

  const open = openId ? roll.submissions.find((s) => s.supplier.id === openId) ?? null : null;

  const goTo = (v: View) => {
    setView(v);
    setOpenId(null);
  };

  const steps: StepMeta[] = [
    {
      key: "submissions",
      label: t("Supplier data"),
      icon: Inbox,
      locked: false,
      done: roll.allApproved,
      sub: t("{approved}/{total} approved", { approved: roll.approvedCount, total: roll.total }),
    },
    {
      key: "report",
      label: t("Generate report"),
      icon: FileText,
      locked: !roll.allApproved,
      done: generated,
      sub: generated ? t("PDF + XML generated") : roll.allApproved ? t("ready to generate") : t("needs all approvals"),
    },
    {
      key: "signoff",
      label: t("Internal sign-off"),
      icon: ClipboardCheck,
      locked: !generated,
      done: signoffComplete,
      sub: signoffs.length > 0 ? t("{confirmed}/{total} confirmed", { confirmed: confirmedSignoffs, total: signoffs.length }) : generated ? t("send for confirmation") : t("needs the report"),
    },
    {
      key: "dispatch",
      label: t("Send & export"),
      icon: Send,
      locked: !signoffComplete,
      done: dispatched,
      sub: dispatched ? t("dispatched") : t("O3CI · buyer · verifier"),
    },
  ];
  const currentKey: StepKey = (steps.find((s) => !s.done && !s.locked)?.key ?? "dispatch") as StepKey;
  const activeStep = steps.find((s) => s.key === view);

  return (
    <div className="space-y-7">
      {/* Breadcrumb + header */}
      <div className="space-y-4">
        {open ? (
          <button onClick={() => setOpenId(null)} className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-black/40 hover:text-black">
            <ArrowLeft size={13} strokeWidth={1.5} /> {t("All submissions")}
          </button>
        ) : (
          <Link href="/declarations" className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-black/40 hover:text-black">
            <ArrowLeft size={13} strokeWidth={1.5} /> {t("Declarations")}
          </Link>
        )}
        <div className="flex flex-col gap-4 border-b border-black/[0.06] pb-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <Eyebrow>{reg.full}</Eyebrow>
            <h1 className="mt-2 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111] md:text-4xl">
              {reg.short} · {declaration.period}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-black/45">
              <span className="inline-flex items-center gap-1.5">
                <span className="font-mono text-[11px] text-black/40">{jur.flag}</span> {declaration.origin} → {declaration.market}
              </span>
              <span>{t(declaration.sector)}</span>
              <span>{t(reg.cadence)}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={declaration.dueInDays < 0 ? "err" : declaration.dueInDays < 21 ? "warn" : "muted"}>{t("due {date}", { date: declaration.due })}</Chip>
            <Chip tone="ok">{reg.authority.split("·")[0].trim()}</Chip>
            <DeclarationMenu decl={declaration} afterDelete={() => router.replace("/declarations")} />
          </div>
        </div>
      </div>

      {/* The electricity unit change, explained once — see lib/cbam/electricity-migration.ts */}
      {mounted && <UnitChangeNotice declId={declaration.id} rows={legacyElectricity} />}

      {/* Am I ready to call the verifier? — the highest-leverage screen */}
      {mounted && ready && (
        <div className="space-y-3">
          <ReadinessScore declarationId={declaration.id} readiness={ready} by={USER.name} compact />
          {ready.failing.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.14em] text-black/30">{t("Fix")}</span>
              {ready.failing.slice(0, 4).map((r) => (
                <Link
                  key={r.id}
                  href={r.screen.path}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] transition-colors",
                    r.status === "fail"
                      ? "border-[#dc2626]/25 bg-[#fef2f2] text-[#dc2626] hover:border-[#dc2626]/50"
                      : "border-[#d97706]/25 bg-[#fffbeb] text-[#b45309] hover:border-[#d97706]/50",
                  )}
                >
                  <span className="font-mono text-[10px] opacity-70">{r.id}</span> {r.title}
                </Link>
              ))}
              <Link
                href={`/declarations/${declaration.id}/verification`}
                className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-[11px] text-black/50 hover:border-black/25 hover:text-black"
              >
                {t("All checks")} <ArrowRight size={11} strokeWidth={1.5} />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* What to do now — replaces the old Overview tab */}
      {mounted && (
        <NextAction
          roll={roll}
          generated={generated}
          signoffs={signoffs.length}
          signoffPending={signoffPending}
          signoffComplete={signoffComplete}
          dispatched={dispatched}
          preflightOk={preflightOk}
          exporter={exporter}
          buyers={buyers}
          view={view}
          onGo={goTo}
        />
      )}

      {/* What actually shipped under this declaration — reviewed and
          confirmed, never auto-absorbed (lib/shipments.ts). */}
      {mounted && <LinkedShipments declaration={declaration} producedTonnes={productionTonnes(declaration.id)} />}

      {/* Step rail — the flow itself */}
      <StepRail steps={steps} view={view} currentKey={currentKey} onSelect={goTo} />

      {/* Supporting views. The evidence pages are real routes rather than
          panels — they are long-form workspaces an exporter lives in for an
          afternoon, and they need to be linkable for a verifier. */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[10px] uppercase tracking-[0.14em] text-black/30">{t("Evidence")}</span>
        {([
          [`/declarations/${declaration.id}/activity`, t("Activity data"), Factory],
          [`/declarations/${declaration.id}/mmd`, t("Monitoring methodology"), FileText],
          [`/declarations/${declaration.id}/evidence`, t("Evidence pack"), Paperclip],
          [`/declarations/${declaration.id}/verification`, t("Verification dossier"), ShieldCheck],
        ] as const).map(([href, label, Icon]) => (
          <Link
            key={href}
            href={href}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3.5 py-2 text-[11px] uppercase tracking-[0.08em] text-black/50 transition-colors hover:border-black/25 hover:text-black"
          >
            <Icon size={13} strokeWidth={1.5} /> {label}
          </Link>
        ))}
        <span className="ml-2 mr-1 text-[10px] uppercase tracking-[0.14em] text-black/30">{t("Insights")}</span>
        {([
          ["cost", t("Cost & carbon"), Coins],
          ["intelligence", t("Compliance intelligence"), Sparkles],
          ["verification", t("Verification trail"), History],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => goTo(key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[11px] uppercase tracking-[0.08em] transition-colors",
              view === key ? "border-black/25 bg-[#111] text-white" : "border-black/10 text-black/50 hover:border-black/25 hover:text-black",
            )}
          >
            <Icon size={13} strokeWidth={1.5} /> {label}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div key={`${view}-${openId ?? ""}`} className="ct-enter">
        {!mounted ? (
          <Card className="p-10 text-center text-sm text-black/35">{t("Loading submissions…")}</Card>
        ) : activeStep?.locked ? (
          <LockedPanel step={activeStep} steps={steps} onGo={goTo} />
        ) : view === "submissions" ? (
          open ? (
            <SubmissionReview decl={declaration} sub={open} onChanged={setExporter} />
          ) : (
            <SubmissionsTab decl={declaration} roll={roll} exporter={exporter} onChanged={setExporter} onOpen={(id) => setOpenId(id)} />
          )
        ) : view === "report" ? (
          <ReportTab decl={declaration} roll={roll} exporter={exporter} onChanged={setExporter} onOpenSubmission={(id) => { setView("submissions"); setOpenId(id); }} />
        ) : view === "signoff" ? (
          <SignoffTab
            decl={declaration}
            exporter={exporter}
            onChanged={setExporter}
            legalRequired={legalRequired}
            freeze={{ dataset: liveDataset, precursorTree: livePrecursorTree, category: goodsCategory, signoffComplete }}
            onFrozen={() => setSnapshot(activeSnapshot(declaration.id))}
          />
        ) : view === "dispatch" ? (
          <DispatchTab
            decl={declaration}
            roll={roll}
            exporter={exporter}
            onChanged={setExporter}
            signoffComplete={signoffComplete}
            onNavigate={goTo}
            onOpenSubmission={(id) => { setView("submissions"); setOpenId(id); }}
          />
        ) : view === "cost" ? (
          <CostCarbonTab roll={roll} facts={facts} />
        ) : view === "intelligence" ? (
          <ComplianceIntelligenceTab roll={roll} intel={intel} />
        ) : (
          <VerificationTrailTab roll={roll} exporter={exporter} buyers={buyers} />
        )}
      </div>
    </div>
  );
}

/* ════════════════════════ Next action banner ════════════════════════ */
function NextAction({
  roll,
  generated,
  signoffs,
  signoffPending,
  signoffComplete,
  dispatched,
  preflightOk,
  exporter,
  buyers,
  view,
  onGo,
}: {
  roll: ReviewRollup;
  generated: boolean;
  signoffs: number;
  signoffPending: number;
  signoffComplete: boolean;
  dispatched: boolean;
  preflightOk: boolean;
  exporter: ExporterDeclState;
  buyers: DeclarationBuyerState[];
  view: View;
  onGo: (v: View) => void;
}) {
  const t = useT();
  const toReview = roll.counts.submitted + roll.counts.in_review;
  /* Every buyer acknowledges for themselves, so the count is per-buyer plus the
     two single-recipient channels the exporter still has switched on. */
  const nonBuyer = (["authority", "verifier"] as const).filter((k) => exporter.recipients[k]);
  const acked = buyers.filter((b) => b.acknowledgedAt).length + nonBuyer.filter((k) => exporter.dispatch.acknowledgedAt[k]).length;
  const wanted = buyers.length + nonBuyer.length;

  let tone: "warn" | "info" | "ok" = "info";
  let text: React.ReactNode;
  let cta = t("Open this step");
  let target: View = "submissions";

  if (toReview > 0) {
    text = (
      <>
        <span className="text-black/80">{t("{count} submissions", { count: toReview })}</span> {t("waiting for your review.")}
      </>
    );
    cta = t("Review supplier data");
  } else if (roll.awaitingCount > 0 || roll.changesCount > 0) {
    tone = "warn";
    // A self-supplied row isn't "waiting on a supplier" — it's waiting on US,
    // and the exporter should be told to go fill it rather than to chase mail.
    const ownOutstanding = roll.submissions.filter((s) => s.supplier.selfSupplied && !s.submitted).length;
    const parts: string[] = [];
    const external = roll.awaitingCount - ownOutstanding;
    if (external > 0) parts.push(t("{count} suppliers haven't submitted", { count: external }));
    if (ownOutstanding > 0) parts.push(t("{count} self-supplied products still to fill in", { count: ownOutstanding }));
    if (roll.changesCount > 0) parts.push(t("{count} revisions still with the supplier", { count: roll.changesCount }));
    text =
      external === 0 && ownOutstanding > 0 ? (
        <>
          {t("Waiting on you —")} <span className="text-black/80">{parts.join(" · ")}</span>.
        </>
      ) : (
        <>
          {t("Waiting on suppliers —")} <span className="text-black/80">{parts.join(" · ")}</span>.
        </>
      );
    cta = external === 0 && ownOutstanding > 0 ? t("Fill in our data") : t("See who's outstanding");
  } else if (!generated) {
    tone = "ok";
    text = (
      <>
        <span className="text-black/80">{t("All supplier data approved.")}</span> {t("Generate the report package.")}
      </>
    );
    cta = t("Generate report");
    target = "report";
  } else if (signoffs === 0) {
    text = (
      <>
        <span className="text-black/80">{t("Report generated.")}</span> {t("Send it for internal sign-off.")}
      </>
    );
    cta = t("Send for sign-off");
    target = "signoff";
  } else if (signoffPending > 0) {
    tone = "warn";
    text = (
      <>
        {t("Waiting on")} <span className="text-black/80">{t("{count} internal confirmations", { count: signoffPending })}</span>.
      </>
    );
    cta = t("View sign-off");
    target = "signoff";
  } else if (!dispatched && !preflightOk) {
    tone = "warn";
    text = (
      <>
        <span className="text-black/80">{t("Registry pre-flight failed.")}</span> {t("Fix the flagged submissions before anything is sent.")}
      </>
    );
    cta = t("View issues");
    target = "dispatch";
  } else if (!dispatched) {
    tone = "ok";
    text = (
      <>
        <span className="text-black/80">{t("Signed off.")}</span> {t("Ready to send & export.")}
      </>
    );
    cta = t("Send & export");
    target = "dispatch";
  } else if (acked < wanted) {
    text = (
      <>
        {t("Dispatched —")} <span className="text-black/80">{t("{acked}/{wanted} recipients", { acked, wanted })}</span> {t("acknowledged.")}
      </>
    );
    cta = t("Track acknowledgements");
    target = "dispatch";
  } else {
    tone = "ok";
    text = (
      <>
        <span className="text-black/80">{t("Cycle complete.")}</span> {t("All recipients acknowledged.")}
      </>
    );
    cta = t("Verification trail");
    target = "verification";
  }

  return (
    <Card highlight className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <StatusDot tone={tone} pulse={tone !== "ok"} glow={tone === "ok"} />
        <span className="text-sm leading-relaxed text-black/55">{text}</span>
      </span>
      {view !== target && (
        <Button size="sm" variant="secondary" className="flex-none bg-white" onClick={() => onGo(target)}>
          {cta} <ArrowRight size={13} strokeWidth={1.5} />
        </Button>
      )}
    </Card>
  );
}

/* ════════════════════════ Step rail ════════════════════════ */
type StepMeta = { key: StepKey; label: string; icon: React.ElementType; locked: boolean; done: boolean; sub: string };

function StepRail({ steps, view, currentKey, onSelect }: { steps: StepMeta[]; view: View; currentKey: StepKey; onSelect: (v: View) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {steps.map((s, i) => {
        const selected = view === s.key;
        const isCurrent = s.key === currentKey && !s.done;
        return (
          <button
            key={s.key}
            onClick={() => onSelect(s.key)}
            aria-current={selected ? "step" : undefined}
            className={cn(
              "rounded-2xl border p-4 text-left transition-colors",
              selected ? "border-black/30 bg-white" : "border-black/[0.07] bg-white hover:border-black/20",
              s.locked && !selected && "opacity-60",
            )}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "grid h-7 w-7 flex-none place-items-center rounded-full text-[11px]",
                  s.done ? "bg-[#ecfdf5] text-[#047857]" : s.locked ? "border border-black/10 text-black/30" : isCurrent ? "bg-[#111] text-white" : "border border-black/20 text-black/55",
                )}
              >
                {s.done ? <Check size={13} strokeWidth={2.5} /> : s.locked ? <Lock size={11} strokeWidth={1.5} /> : i + 1}
              </span>
              <span className="min-w-0">
                <span className={cn("block truncate text-[12.5px]", selected || isCurrent ? "text-black/85" : "text-black/60")}>{s.label}</span>
                <span className={cn("mt-0.5 block truncate font-mono text-[10px]", s.done ? "text-[#047857]" : "text-black/35")}>{s.sub}</span>
              </span>
            </div>
            <div className={cn("mt-3 h-[3px] w-full overflow-hidden rounded-full", s.done ? "bg-[#10b981]" : isCurrent ? "bg-black/[0.08]" : "bg-black/[0.05]")}>
              {isCurrent && <div className="h-full w-1/3 rounded-full bg-[#111]" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* A locked step stays visible and explains exactly what unlocks it. */
function LockedPanel({ step, steps, onGo }: { step: StepMeta; steps: StepMeta[]; onGo: (v: View) => void }) {
  const t = useT();
  const blocker = steps.find((s) => !s.done && !s.locked);
  const reason =
    step.key === "report"
      ? t("Every supplier submission must be approved before the report can be generated — the package only ever contains verified data.")
      : step.key === "signoff"
        ? t("Generate the report first — sign-off is a confirmation of the exact package that will be sent.")
        : t("Internal sign-off must be complete before anything is dispatched — every requested confirmation has to land first.");
  return (
    <Card className="flex flex-col items-center justify-center p-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl border border-black/10 text-black/35">
        <Lock size={20} strokeWidth={1.5} />
      </span>
      <p className="mt-4 text-sm text-black/60">{t("{step} is locked for now.", { step: step.label })}</p>
      <p className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-black/40">{reason}</p>
      {blocker && (
        <Button className="mt-5" size="sm" variant="secondary" onClick={() => onGo(blocker.key)}>
          {t("Go to {step}", { step: blocker.label })} <ArrowRight size={13} strokeWidth={1.5} />
        </Button>
      )}
    </Card>
  );
}

/* ════════════════════════ Step 1 — Supplier data ════════════════════════ */
/* "2m ago" / "3h ago" / "2d ago" for persisted timestamps. */
function ago(ts: number): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

function SubmissionsTab({
  decl,
  roll,
  exporter,
  onChanged,
  onOpen,
}: {
  decl: Declaration;
  roll: ReviewRollup;
  exporter: ExporterDeclState;
  onChanged: (s: ExporterDeclState) => void;
  onOpen: (id: string) => void;
}) {
  const t = useT();
  const stats: { value: React.ReactNode; label: string }[] = [
    { value: `${roll.submittedCount}/${roll.total}`, label: t("Submitted") },
    { value: roll.counts.in_review + roll.counts.submitted, label: t("Awaiting review") },
    { value: roll.changesCount, label: t("Changes requested") },
    { value: roll.approvedCount, label: t("Approved") },
  ];
  const selfCount = roll.submissions.filter((s) => s.supplier.selfSupplied).length;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <Stat value={s.value} label={s.label} />
          </Card>
        ))}
      </div>

      <div className="min-w-0">
        <Eyebrow>{t("Supplier submissions")}</Eyebrow>
        <p className="mt-1 max-w-xl text-sm text-black/45">
          {t("Each supplier filled their own Smart Link, the AI checked it, they e-signed and submitted. Open a submission to read the data, loop in your internal reviewers, then approve it or request a revision.")}
          {selfCount > 0 && (
            <>
              {" "}
              {t("{count} of these products are produced by you — no link goes out for them; fill them in here and they run through the same checks.", { count: selfCount })}
            </>
          )}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
        {roll.submissions.map((s) => (
          <SubmissionRow
            key={s.supplier.id}
            sub={s}
            lastReminded={lastReminderAt(exporter, s.supplier.id)}
            onRemind={() => {
              onChanged(remindSupplier(decl.id, s.supplier.id));
              toast({ message: t("Reminder sent"), detail: t("{name} nudged by email to complete their Smart Link.", { name: s.supplier.name }), tone: "info" });
            }}
            onOpen={() => onOpen(s.supplier.id)}
          />
        ))}
      </div>
    </div>
  );
}

function SubmissionRow({ sub, lastReminded, onRemind, onOpen }: { sub: ReviewSubmission; lastReminded: number | null; onRemind: () => void; onOpen: () => void }) {
  const t = useT();
  const meta = LIFECYCLE_META[sub.lifecycle];
  const self = Boolean(sub.supplier.selfSupplied);
  const [copied, setCopied] = React.useState(false);
  const copyTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(`${window.location.origin}${sub.href}`);
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1900);
  };
  // Whole row opens the detail — but only once the supplier has actually
  // submitted. Suppliers still collecting stay non-clickable (just remindable).
  const clickable = sub.submitted;
  return (
    /* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events --
    this row IS keyboard accessible — role, tabIndex and onKeyDown are all set on the
    same element. The rule cannot see through the `clickable` ternary and assumes the
    handler stands alone. */
    <div
      onClick={clickable ? onOpen : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } } : undefined}
      className={cn("flex items-center gap-3 border-b border-black/[0.05] px-4 py-3.5 last:border-0", clickable && "cursor-pointer hover:bg-[#fafaf8]")}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2.5">
        {sub.supplier.critical && (
          <span
            className="h-1.5 w-1.5 flex-none rounded-full bg-black/40"
            title={t("CBAM-critical: this supplier carries a major share of the declaration's embedded emissions — the package can't be filed without them.")}
          />
        )}
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="truncate text-[13px] text-black/75">{sub.supplier.name}</span>
            {self ? (
              <span className="flex-none rounded-full border border-black/15 bg-black/[0.03] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.1em] text-black/50">{t("this is us")}</span>
            ) : (
              <span className="font-mono text-[11px] text-black/25">{sub.supplier.ref}</span>
            )}
            {sub.source === "record" && (
              <span
                className="flex-none rounded-full border border-[#3C7ACB]/25 bg-[#3C7ACB]/[0.07] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.1em] text-[#2f63a8]"
                title={t("Pulled from this company's own supplier record — they answered these goods on another declaration")}
              >
                {t("from record")}
              </span>
            )}
          </span>
          <span className="mt-0.5 flex items-center gap-2 text-[11px] text-black/40">
            <span className="font-mono text-[10px] text-black/35">{sub.supplier.country}</span>
            {t(sub.supplier.material)}
            {sub.submitted && <span className="text-black/30">· v{sub.version}{sub.check ? ` · ${t("score")} ${sub.check.score}` : ""}</span>}
            {!sub.submitted && lastReminded && !self && <span className="text-black/30">· {t("reminded {ago}", { ago: ago(lastReminded) })}</span>}
            {sub.submitted && sub.freshnessLevel !== "fresh" && sub.freshnessLevel !== "unknown" && (
              <FreshnessBadge level={sub.freshnessLevel} title={sub.freshness.message ?? undefined} />
            )}
          </span>
        </span>
      </span>

      {/* copy Smart Link — flips to a "copied" state inline, no popup. Never for
          a self-supplied row: there is no link, and offering one would suggest
          somebody outside should be filling it. */}
      {!self && (
        <button
          onClick={copy}
          title={t("Copy Smart Link")}
          aria-label={t("Copy Smart Link")}
          style={{ transitionTimingFunction: "var(--ease-signature)" }}
          className={cn(
            "hidden h-7 items-center gap-1.5 rounded-full border px-2.5 text-[10px] uppercase tracking-[0.08em] transition-all duration-300 sm:inline-flex",
            copied ? "border-[#16a34a]/30 bg-[#16a34a]/10 text-[#15803d]" : "border-black/10 text-black/45 hover:border-black/25 hover:text-black",
          )}
        >
          <span className="relative grid h-3 w-3 place-items-center">
            <Link2 size={12} strokeWidth={1.5} className={cn("absolute transition-all duration-300", copied ? "scale-50 opacity-0" : "scale-100 opacity-100")} />
            <Check size={12} strokeWidth={2.5} className={cn("absolute transition-all duration-300", copied ? "scale-100 opacity-100" : "scale-50 opacity-0")} />
          </span>
          {copied ? t("Copied") : t("Copy link")}
        </button>
      )}

      <span className="flex flex-none items-center gap-3">
        <StatusLabel tone={meta.tone} label={t(meta.label)} pulse={sub.lifecycle === "in_review" || sub.lifecycle === "submitted"} glow={sub.lifecycle === "approved"} />
        {self ? (
          <Link href={`/self/${sub.token}`} onClick={(e) => e.stopPropagation()} className="flex-none">
            <Button variant={sub.submitted ? "ghost" : "secondary"} size="sm">
              <Building2 size={13} strokeWidth={1.5} /> {sub.submitted ? t("Edit our data") : t("Fill in our data")}
            </Button>
          </Link>
        ) : sub.submitted ? (
          <ChevronRight size={16} strokeWidth={1.5} className="text-black/30" />
        ) : (
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onRemind(); }}>
            <Bell size={13} strokeWidth={1.5} /> {t("Remind")}
          </Button>
        )}
        {self && sub.submitted && <ChevronRight size={16} strokeWidth={1.5} className="text-black/30" />}
      </span>
    </div>
  );
}

/** "a", "a and b", "a, b and c" — restriction lists read as prose, not CSV. */
function listWords(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/* Age / period verdict on a dataset — one badge, one tooltip that says what to
   do about it. Shared by the submission list, the review header and Insights. */
function FreshnessBadge({ level, title }: { level: Freshness; title?: string }) {
  const t = useT();
  const meta = FRESHNESS_META[level];
  const tone =
    meta.tone === "err"
      ? "border-[#dc2626]/25 bg-[#fef2f2] text-[#dc2626]"
      : meta.tone === "warn"
        ? "border-[#b45309]/25 bg-[#fffbeb] text-[#b45309]"
        : meta.tone === "ok"
          ? "border-[#047857]/20 bg-[#ecfdf5] text-[#047857]"
          : "border-black/10 bg-black/[0.03] text-black/45";
  return (
    <span title={title} className={cn("inline-flex flex-none items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.1em]", tone)}>
      <Clock size={9} strokeWidth={1.8} /> {t(meta.label)}
    </span>
  );
}

/* ════════════════════════ Submission review ════════════════════════ */
function SubmissionReview({ decl, sub, onChanged }: { decl: Declaration; sub: ReviewSubmission; onChanged: (s: ExporterDeclState) => void }) {
  const t = useT();
  const { lang } = useLanguage();
  const [showRevision, setShowRevision] = React.useState(false);
  const meta = LIFECYCLE_META[sub.lifecycle];

  const approve = () => {
    onChanged(approveSubmission(decl.id, sub.supplier.id, sub.version));
    toast({ message: t("Submission approved"), detail: t("{name} · v{version} locked into the compliance dataset.", { name: sub.supplier.name, version: sub.version }), tone: "ok" });
  };

  return (
    <div className="space-y-6">
      {/* identity header */}
      <div className="flex flex-col gap-3 border-b border-black/[0.06] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Eyebrow>{t("Submission")} · v{sub.version}</Eyebrow>
          <h2 className="mt-1.5 font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#111]">{sub.supplier.name}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-black/45">
            <span className="font-mono text-[11px] text-black/35">{sub.supplier.country} · {sub.supplier.ref}</span>
            {sub.signedBy && <span>{t("signed by {name} ({role})", { name: sub.signedBy, role: sub.signedRole ?? "" })}</span>}
            {sub.submittedAt && <span>{new Date(sub.submittedAt).toLocaleDateString(localeFor(lang), { day: "numeric", month: "short", year: "numeric" })}</span>}
            {sub.supplier.selfSupplied && <span className="text-black/60">{t("our own installation")}</span>}
          </p>
        </div>
        <span className="flex flex-wrap items-center gap-2">
          {sub.freshnessLevel !== "fresh" && sub.freshnessLevel !== "unknown" && <FreshnessBadge level={sub.freshnessLevel} title={sub.freshness.message ?? undefined} />}
          <StatusLabel tone={meta.tone} label={meta.label} pulse={sub.lifecycle === "in_review"} glow={sub.lifecycle === "approved"} />
        </span>
      </div>

      {/* state banners */}
      {sub.freshness.message && (
        <Card className={cn("flex items-start gap-3 p-4", sub.freshnessLevel === "stale" ? "border-[#dc2626]/25 bg-[#fef2f2]" : "border-[#b45309]/25 bg-[#fffbeb]")}>
          <Clock size={15} strokeWidth={1.5} className={cn("mt-0.5 flex-none", sub.freshnessLevel === "stale" ? "text-[#dc2626]" : "text-[#b45309]")} />
          <div className="min-w-0 text-[13px] leading-relaxed text-black/65">
            <span className="text-black/80">{sub.freshnessLevel === "stale" ? "This data needs refreshing." : "Worth a second look."}</span> {sub.freshness.message}
            {sub.source === "record" && <> It came from {sub.supplier.name}&apos;s own record rather than a submission against this declaration.</>}
          </div>
        </Card>
      )}
      {sub.restrictedForBuyer.length > 0 && (
        <Card warm className="flex items-start gap-3 p-4">
          <EyeOff size={15} strokeWidth={1.5} className="mt-0.5 flex-none text-black/45" />
          <div className="min-w-0 text-[13px] leading-relaxed text-black/60">
            <span className="text-black/80">{t("Onward sharing is restricted.")}</span> {sub.supplier.name} shares everything below with you, but keeps{" "}
            {listWords(sub.restrictedForBuyer)} from travelling on to buyers. Every figure CBAM requires still reaches them — the send step shows exactly what each buyer receives.
          </div>
        </Card>
      )}
      {sub.lifecycle === "approved" && (
        <Card className="flex items-center gap-3 border-[#047857]/20 bg-[#ecfdf5] p-4">
          <StatusDot tone="ok" glow />
          <p className="text-sm text-black/60">Approved — v{sub.version} is locked into the compliance dataset. Reopen by requesting another revision below.</p>
        </Card>
      )}
      {sub.lifecycle === "changes_requested" && (
        <Card className="border-[#2563eb]/25 bg-[#eff6ff] p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg bg-[#dbeafe] text-[#2563eb]"><PenLine size={15} strokeWidth={1.5} /></span>
            <div className="min-w-0 text-[13px] leading-relaxed text-black/65">
              <span className="text-black/80">{t("Revision requested.")}</span> {sub.supplier.name} has been asked to update {sub.review.unlockedFields.length} field{sub.review.unlockedFields.length === 1 ? "" : "s"}{sub.review.unlockedDocs.length ? ` and ${sub.review.unlockedDocs.length} document${sub.review.unlockedDocs.length === 1 ? "" : "s"}` : ""}. Only those unlock on their Smart Link.
              {sub.review.comment && <p className="mt-1.5 text-black/55">“{sub.review.comment}”</p>}
            </div>
          </div>
        </Card>
      )}

      <ExecSummary sub={sub} />
      <SubmittedData sub={sub} />
      <ReviewerPicker decl={decl} sub={sub} onChanged={onChanged} />

      {/* Decision */}
      {showRevision ? (
        <RevisionForm
          sub={sub}
          onCancel={() => setShowRevision(false)}
          onSubmit={(payload) => {
            onChanged(requestRevision(decl.id, sub.supplier.id, sub.version, payload));
            setShowRevision(false);
            toast({ message: "Revision requested", detail: `${sub.supplier.name}'s Smart Link reopened the flagged items — they'll be emailed.`, tone: "info" });
          }}
        />
      ) : (
        <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className={cn("grid h-9 w-9 flex-none place-items-center rounded-xl", sub.check?.passable ? "bg-[#ecfdf5] text-[#047857]" : "bg-[#fef2f2] text-[#dc2626]")}>
              {sub.check?.passable ? <ClipboardCheck size={18} strokeWidth={1.5} /> : <CircleX size={18} strokeWidth={1.5} />}
            </span>
            <p className="text-sm text-black/55">
              {sub.lifecycle === "approved"
                ? "Already approved. You can still request another revision if needed."
                : "Review the data and the AI summary, then approve this version or send it back with specific fields to revise."}
            </p>
          </div>
          <div className="flex flex-none items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowRevision(true)}>
              <PenLine size={14} strokeWidth={1.5} /> {t("Request revision")}
            </Button>
            <Button size="sm" onClick={approve} disabled={sub.lifecycle === "approved"}>
              <Check size={14} strokeWidth={1.5} /> {sub.lifecycle === "approved" ? "Approved" : "Approve"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

/* AI-flagged evidence summary for one submission */
function ExecSummary({ sub }: { sub: ReviewSubmission }) {
  const t = useT();
  const check = sub.check;
  const scoreTone = (s: number) => (s >= 85 ? "#047857" : s >= 60 ? "#b45309" : "#dc2626");
  const warnings = check?.findings.filter((f) => f.severity === "warning") ?? [];
  const criticals = check?.findings.filter((f) => f.severity === "critical") ?? [];

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b border-black/[0.06] bg-black/[0.02] px-5 py-3">
        <Sparkles size={14} strokeWidth={1.5} className="text-black/55" />
        <Eyebrow>{t("Submission evidence summary")}</Eyebrow>
        <span className="ml-auto font-mono text-[10px] text-black/35">{sub.source === "live" ? "from submitted data" : "generated"}</span>
      </div>
      <div className="grid grid-cols-1 gap-px bg-black/[0.06] sm:grid-cols-[180px_1fr]">
        <div className="flex flex-col items-center justify-center bg-white p-6 text-center">
          <div className="font-[family-name:var(--font-plex)] text-5xl font-light" style={{ color: scoreTone(check?.score ?? 0) }}>{check?.score ?? "—"}</div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.1em] text-black/40">{t("data quality")}</div>
          <div className="mt-2 flex items-center gap-2 text-[11px]">
            <span className="text-[#dc2626]">{criticals.length} critical</span>
            <span className="text-black/20">·</span>
            <span className="text-[#b45309]">{warnings.length} warnings</span>
          </div>
        </div>
        <div className="space-y-4 bg-white p-5">
          {/* key emissions */}
          <div>
            <div className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/40">{t("Key emissions data")}</div>
            <div className="mt-2 space-y-1.5">
              {sub.emissions.map((e) => {
                const direct = Number(sub.values[valueKey("direct-emissions", e.productId)]) || null;
                const indirect = Number(sub.values[valueKey("indirect-emissions", e.productId)]) || null;
                // The reported figure means little alone — the EU fallback for
                // the same good is what says whether it's good news.
                const catalog = getCatalogProduct(e.productId);
                const bm = catalog ? benchmark(catalog, e.perTonne, "total") : null;
                const bmMeta = BENCHMARK_META[bm?.verdict ?? "unknown"];
                return (
                  <div key={e.productId} className="flex items-center justify-between rounded-lg border border-black/[0.06] bg-[#fafaf8] px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-[13px] text-black/75">{e.productName}</div>
                      <div className="font-mono text-[10px] text-black/40">CN {e.cnCode} · {e.tonnes.toLocaleString("en-US")} t</div>
                      {direct !== null && indirect !== null && (
                        <div className="font-mono text-[10px] text-black/35">direct {direct.toFixed(2)} · indirect {indirect.toFixed(2)} tCO₂e/t</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-[family-name:var(--font-plex)] text-lg font-light text-[#111]">{e.perTonne.toFixed(2)} <span className="text-xs text-black/40">{t("tCO₂e/t")}</span></div>
                      <div className="font-mono text-[10px] text-black/40">{e.total.toLocaleString("en-US")} tCO₂e total</div>
                      {bm && (
                        <div
                          title={`EU fallback default for this good: ${bm.fallback.toFixed(2)} tCO₂e/t · ${bm.source}`}
                          className={cn(
                            "mt-0.5 font-mono text-[10px]",
                            bmMeta.tone === "ok" ? "text-[#16a34a]" : bmMeta.tone === "warn" ? "text-[#b45309]" : "text-black/35",
                          )}
                        >
                          {bm.deltaPct > 0 ? "+" : ""}
                          {bm.deltaPct.toFixed(0)}% vs {bm.fallback.toFixed(2)} default
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-black/50">
              <span>{t("Embedded total:")} <span className="text-black/75">{sub.totalTCO2e.toLocaleString("en-US")} tCO₂e</span></span>
              <span>Documents: {Object.values(sub.docs).filter((d) => d.status === "uploaded").length}/{sub.request.documents.length}</span>
            </div>
          </div>

          {/* findings */}
          {(criticals.length > 0 || warnings.length > 0) ? (
            <div>
              <div className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/40">{t("Flagged for your attention")}</div>
              <div className="mt-2 space-y-1.5">
                {[...criticals, ...warnings].slice(0, 5).map((f) => (
                  <div key={f.id} className="flex items-start gap-2 text-[12px]">
                    {f.severity === "critical" ? <CircleX size={13} strokeWidth={1.5} className="mt-0.5 flex-none text-[#dc2626]" /> : <TriangleAlert size={13} strokeWidth={1.5} className="mt-0.5 flex-none text-[#b45309]" />}
                    <span className="text-black/60"><span className="text-black/75">{f.title}.</span> {f.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[12px] text-[#047857]">
              <CircleCheck size={14} strokeWidth={1.5} /> {t("No anomalies or gaps — figures are complete, in range and standardised.")}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/* Read-only view of exactly what the supplier submitted (same input / output) */
function SubmittedData({ sub }: { sub: ReviewSubmission }) {
  const t = useT();
  const sections = sectionsForRequest(sub.request);
  const displayValue = (field: ResolvedCbamField, productId?: string): string => {
    switch (field.id) {
      case "cn-code": {
        const rp = sub.request.products.find((p) => p.product.id === productId);
        return rp?.product.cnCode ?? "—";
      }
      case "goods-category": {
        const rp = sub.request.products.find((p) => p.product.id === productId);
        return rp ? `${rp.product.category} · ${rp.product.group}` : "—";
      }
      case "quantity": {
        const rp = sub.request.products.find((p) => p.product.id === productId);
        return rp ? `${rp.totalTonnes.toLocaleString("en-US")} t` : "—";
      }
      case "precursors": {
        // structured rows render as readable lines, not raw JSON
        const raw = sub.values[valueKey(field.id, productId)];
        return raw ? formatPrecursors(raw) || "—" : "—";
      }
      default:
        return sub.values[valueKey(field.id, productId)] || "—";
    }
  };

  return (
    <Card className="p-0">
      <div className="flex items-center gap-2 border-b border-black/[0.06] px-5 py-3">
        <FileText size={14} strokeWidth={1.5} className="text-black/55" />
        <Eyebrow>{t("Submitted data")}</Eyebrow>
        <span className="ml-auto font-mono text-[10px] text-black/35">{t("read-only")}</span>
      </div>
      <div className="divide-y divide-black/[0.06]">
        {sections.map((section) => (
          <SectionBlock key={section.key} section={section} sub={sub} displayValue={displayValue} />
        ))}
      </div>
    </Card>
  );
}

function SectionBlock({ section, sub, displayValue }: { section: SupplierSection; sub: ReviewSubmission; displayValue: (f: ResolvedCbamField, p?: string) => string }) {
  const t = useT();
  if (section.scope === "docs") {
    return (
      <div className="px-5 py-4">
        <div className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/40">{section.label}</div>
        <div className="mt-2.5 space-y-1.5">
          {sub.request.documents.map((d) => {
            const uploaded = sub.docs[d.id]?.status === "uploaded";
            const files = sub.docs[d.id]?.files ?? [];
            return (
              <div key={d.id} className="flex items-center gap-2.5 text-[12px]">
                <span className={cn("grid h-5 w-5 flex-none place-items-center rounded-md", uploaded ? "bg-[#ecfdf5] text-[#047857]" : "border border-black/10 text-black/30")}>
                  {uploaded ? <Check size={11} strokeWidth={2.5} /> : "—"}
                </span>
                <span className="min-w-0 flex-1 truncate text-black/65">{d.label}</span>
                {!d.required && <OptionalTag />}
                {uploaded ? (
                  <span className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-black/35">
                    {files.length === 0 && "uploaded"}
                    {files.map((f, i) =>
                      f.dataUrl ? (
                        <a key={i} href={f.dataUrl} download={f.name} className="underline decoration-black/20 underline-offset-2 hover:text-black hover:decoration-black/50" title={t("Download this file")}>
                          {f.name}
                        </a>
                      ) : (
                        <span key={i} title={t("File larger than the inline limit - request it out-of-band")}>{f.name}</span>
                      ),
                    )}
                  </span>
                ) : (
                  <span className="font-mono text-[10px] text-black/35">{t("not attached")}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const fields = fieldsForSection(sub.request, section);
  if (fields.length === 0) return null;
  const once = section.scope === "once";

  return (
    <div className="px-5 py-4">
      <div className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/40">{section.label}</div>
      {once ? (
        <dl className="mt-2.5 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {fields.map((f) => (
            <DataRow key={f.id} label={f.label} value={displayValue(f)} />
          ))}
        </dl>
      ) : (
        <div className="mt-2.5 space-y-3">
          {sub.request.products.map((rp) => {
            // mirror the supplier's own form: only the fields that apply to this good
            const productFields = productFieldsForSection(sub.request, section, rp.product);
            if (productFields.length === 0) return null;
            return (
              <div key={rp.product.id} className={cn(sub.request.products.length > 1 && "rounded-xl border border-black/[0.06] bg-[#fafaf8] p-3")}>
                {sub.request.products.length > 1 && <div className="mb-2 text-[11px] text-black/50">{rp.product.name} <span className="font-mono text-[10px] text-black/35">· CN {rp.product.cnCode}</span></div>}
                <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
                  {productFields.map((f) => (
                    <DataRow key={f.id} label={f.label} value={displayValue(f, rp.product.id)} />
                  ))}
                </dl>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-[0.06em] text-black/35">{label}</dt>
      <dd className="mt-0.5 truncate text-[13px] text-black/70">{value}</dd>
    </div>
  );
}

/* Assign internal reviewers to look at one submission — the whole team is
   offered, and "+ Add person" creates someone new without leaving the page. */
function ReviewerPicker({ decl, sub, onChanged }: { decl: Declaration; sub: ReviewSubmission; onChanged: (s: ExporterDeclState) => void }) {
  const t = useT();
  const [members, setMembers] = React.useState<TeamMember[]>([]);
  const [showAdd, setShowAdd] = React.useState(false);
  React.useEffect(() => setMembers(loadTeam()), []);

  return (
    <Card warm className="p-5">
      <div className="flex items-center gap-2">
        <Users size={15} strokeWidth={1.5} className="text-black/55" />
        <Eyebrow>{t("Internal reviewers")}</Eyebrow>
      </div>
      <p className="mt-1.5 text-[12px] text-black/45">{t("Share this submission with the teams who need to sign off — ESG, Compliance, Legal or your verifier. We email them an invite, and they get scoped, read-only access to the source data.")}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {members.map((m) => {
          const on = sub.review.reviewers.includes(m.id);
          return (
            <button
              key={m.id}
              onClick={() => {
                onChanged(toggleReviewer(decl.id, sub.supplier.id, m.id));
                if (!on) toast({ message: `${m.name} assigned`, detail: `Notified by email — scoped, read-only access to ${sub.supplier.name}'s submission.`, tone: "info" });
              }}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                on ? "border-black/25 bg-[#f0eee8] text-black/80" : "border-black/10 text-black/50 hover:border-black/25 hover:text-black",
              )}
            >
              <span className={cn("grid h-4 w-4 place-items-center rounded-full", on ? "bg-[#111] text-white" : "border border-black/20")}>{on && <Check size={10} strokeWidth={3} />}</span>
              {m.name} <span className="text-black/35">· {m.role}</span>
            </button>
          );
        })}
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-black/20 px-3 py-1.5 text-[12px] text-black/45 transition-colors hover:border-black/40 hover:text-black"
        >
          <Plus size={12} strokeWidth={2} /> {t("Add person")}
        </button>
      </div>
      {sub.review.reviewers.length > 0 && (
        <p className="mt-2.5 text-[11px] text-[#047857]">
          Shared with {sub.review.reviewers.map((id) => getTeamMember(id)?.name).filter(Boolean).join(", ")} — they&apos;ll be notified by email.
        </p>
      )}
      <AddMemberModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        note={`They join your team list and are assigned to ${sub.supplier.name}'s submission right away — scoped, read-only access to this source data.`}
        onAdded={(m) => {
          setMembers(loadTeam());
          if (!sub.review.reviewers.includes(m.id)) {
            onChanged(toggleReviewer(decl.id, sub.supplier.id, m.id));
          }
          toast({ message: `${m.name} added & assigned`, detail: "Invite emailed — they also appear under Team & seats.", tone: "ok" });
        }}
      />
    </Card>
  );
}

/* Request revision — pick specific fields + docs + a comment */
function RevisionForm({ sub, onCancel, onSubmit }: { sub: ReviewSubmission; onCancel: () => void; onSubmit: (p: { fields: string[]; docs: string[]; comment: string }) => void }) {
  const t = useT();
  const sections = sectionsForRequest(sub.request);
  const [fields, setFields] = React.useState<Set<string>>(new Set(sub.review.unlockedFields));
  const [docs, setDocs] = React.useState<Set<string>>(new Set(sub.review.unlockedDocs));
  const [comment, setComment] = React.useState(sub.review.comment);

  const toggle = (set: Set<string>, key: string, fn: (s: Set<string>) => void) => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    fn(next);
  };

  const fieldRows: { key: string; label: string }[] = [];
  for (const section of sections) {
    if (section.scope === "docs") continue;
    const fs = fieldsForSection(sub.request, section);
    for (const f of fs) {
      if (isOnceField(f.group)) fieldRows.push({ key: valueKey(f.id), label: f.label });
      else
        for (const rp of sub.request.products) {
          if (!fieldAppliesTo(f, rp.product)) continue; // can't reopen a field this good never answers
          fieldRows.push({ key: valueKey(f.id, rp.product.id), label: sub.request.products.length > 1 ? `${f.label} — ${rp.product.name}` : f.label });
        }
    }
  }

  const total = fields.size + docs.size;
  const valid = total > 0 && comment.trim().length > 0;

  return (
    <Card className="border-[#2563eb]/25 p-5">
      <div className="flex items-center gap-2">
        <PenLine size={15} strokeWidth={1.5} className="text-[#2563eb]" />
        <Eyebrow>{t("Request a revision")}</Eyebrow>
      </div>
      <p className="mt-1.5 text-[12px] text-black/50">Select exactly what {sub.supplier.name} should fix. Only these reopen on their Smart Link — everything else stays locked — and they resubmit as v{sub.version + 1}.</p>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-2 font-pixel text-[10px] uppercase tracking-[0.16em] text-black/40">Fields ({fields.size})</div>
          <div className="max-h-72 space-y-1 overflow-y-auto rounded-xl border border-black/[0.07] bg-white p-2">
            {fieldRows.map((row) => {
              const on = fields.has(row.key);
              return (
                <button key={row.key} onClick={() => toggle(fields, row.key, setFields)} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[12.5px] hover:bg-[#fafaf8]">
                  <span className={cn("grid h-4 w-4 flex-none place-items-center rounded-[5px] border", on ? "border-transparent bg-[#2563eb] text-white" : "border-black/20")}>{on && <Check size={11} strokeWidth={2.5} />}</span>
                  <span className="min-w-0 flex-1 truncate text-black/65">{row.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="mb-2 font-pixel text-[10px] uppercase tracking-[0.16em] text-black/40">Documents ({docs.size})</div>
          <div className="space-y-1 rounded-xl border border-black/[0.07] bg-white p-2">
            {sub.request.documents.map((d) => {
              const on = docs.has(d.id);
              return (
                <button key={d.id} onClick={() => toggle(docs, d.id, setDocs)} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[12.5px] hover:bg-[#fafaf8]">
                  <span className={cn("grid h-4 w-4 flex-none place-items-center rounded-[5px] border", on ? "border-transparent bg-[#2563eb] text-white" : "border-black/20")}>{on && <Check size={11} strokeWidth={2.5} />}</span>
                  <span className="min-w-0 flex-1 truncate text-black/65">{d.label}</span>
                  {!d.required && <span className="flex-none"><OptionalTag /></span>}
                </button>
              );
            })}
          </div>
          <Field label={t("Comment to the supplier")}>
            <textarea
              className={cn(inputClass, "mt-2 min-h-[88px] resize-y")}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("Explain what needs changing — e.g. “The direct emissions figure looks high for an EAF route; please confirm actual vs default and re-upload a legible Mill Test Certificate.”")}
            />
          </Field>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-4">
        <span className="text-[11px] text-black/40">{total} item{total === 1 ? "" : "s"} selected{!comment.trim() && total > 0 ? " · add a comment to send" : ""}</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>{t("Cancel")}</Button>
          <Button size="sm" disabled={!valid} onClick={() => onSubmit({ fields: [...fields], docs: [...docs], comment: comment.trim() })}>
            <Send size={14} strokeWidth={1.5} /> {t("Send revision request")}
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* ════════════════════════ Cost & carbon ════════════════════════
   Three questions on one screen, in the order they get asked: what does this
   cost, how do we compare to the fallback everyone else pays, and where in the
   supply chain does it actually come from. Everything derives from Stage 1's
   facts — no number here is invented locally. */
function CostCarbonTab({ roll, facts }: { roll: ReviewRollup; facts: ComplianceFacts }) {
  const t = useT();
  const [pricing, setPricing] = React.useState<CertificatePricing>(DEFAULT_PRICING);
  const [priceInput, setPriceInput] = React.useState(String(DEFAULT_PRICING.pricePerTonneEUR));
  React.useEffect(() => {
    const p = loadPricing();
    setPricing(p);
    setPriceInput(String(p.pricePerTonneEUR));
  }, []);

  const cost = React.useMemo(() => computeCost(facts, pricing), [facts, pricing]);
  const bySupplier = React.useMemo(() => supplierHotspots(cost), [cost]);
  const byProduct = React.useMemo(() => productHotspots(cost), [cost]);
  const critical = React.useMemo(() => concentration(bySupplier, 0.8), [bySupplier]);
  const [lens, setLens] = React.useState<"supplier" | "product">("supplier");

  const applyPrice = (raw: string) => {
    setPriceInput(raw);
    const n = Number(raw);
    if (!(n > 0)) return;
    const next = { ...pricing, pricePerTonneEUR: n };
    setPricing(next);
    savePricing(next);
  };

  if (facts.totalChargeableTCO2e === 0) {
    return (
      <Card className="p-10 text-center text-sm text-black/40">
        {t("Nothing to cost yet — figures appear here as suppliers submit and you approve their data.")}
      </Card>
    );
  }

  const hotspots = lens === "supplier" ? bySupplier : byProduct;

  return (
    <div className="space-y-5">
      <div>
        <Eyebrow>{t("Cost & carbon")}</Eyebrow>
        <p className="mt-1 max-w-2xl text-sm text-black/45">
          {t("The same approved dataset, priced. Certificates are chargeable emissions only — the Annex II rule already excludes indirect emissions for steel and aluminium, and default-value markups are applied where a supplier reported on defaults.")}
        </p>
      </div>

      {/* ── The bill ── */}
      <Card className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-pixel text-[10px] uppercase tracking-[0.2em] text-black/40">{t("Estimated certificate cost")}</div>
            <div className="mt-2 font-[family-name:var(--font-plex)] text-4xl font-light tracking-tight text-[#111]">{fmtEUR(cost.netCostEUR)}</div>
            <div className="mt-1 text-sm text-black/45">
              {fmtTHB(cost.netCostTHB)} · {cost.totalCertificates.toLocaleString("en-US")} certificates · {fmtEUR(cost.costPerTonneOfGoodsEUR)} per tonne shipped
            </div>
          </div>
          <label className="flex flex-none items-end gap-2">
            <span className="block">
              <span className="mb-2 block text-[11px] uppercase tracking-[0.1em] text-black/55">{t("Certificate price")}</span>
              <span className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2.5">
                <span className="text-sm text-black/40">€</span>
                <input
                  type="number"
                  min={1}
                  value={priceInput}
                  onChange={(e) => applyPrice(e.target.value)}
                  aria-label={t("Certificate price in EUR per tonne CO2e")}
                  className="w-20 bg-transparent text-sm text-black/75 focus:outline-none"
                />
                <span className="font-mono text-[11px] text-black/35">{t("/tCO₂e")}</span>
              </span>
            </span>
          </label>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-black/[0.06] pt-5 sm:grid-cols-4">
          {[
            [`${cost.totalChargeableTCO2e.toLocaleString("en-US")} t`, "Chargeable CO₂e", `${cost.totalGrossTCO2e.toLocaleString("en-US")} t reported gross`],
            [fmtEUR(cost.grossCostEUR), "Before deductions", `at €${pricing.pricePerTonneEUR}/tCO₂e`],
            [`− ${fmtEUR(cost.carbonPriceCreditEUR)}`, "Carbon price paid", cost.carbonPriceCreditEUR > 0 ? "credited at origin" : "Thailand has no carbon price yet"],
            [
              cost.dataGapRiskEUR >= 0 ? `${fmtEUR(cost.dataGapRiskEUR)}` : `−${fmtEUR(Math.abs(cost.dataGapRiskEUR))}`,
              cost.dataGapRiskEUR >= 0 ? "Data gap risk avoided" : "Above the default value",
              "reporting actual data instead of falling back",
            ],
          ].map(([v, l, sub]) => (
            <div key={l}>
              <div className="font-[family-name:var(--font-plex)] text-xl font-light text-[#111]">{v}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.1em] text-black/40">{l}</div>
              <div className="mt-0.5 text-[11px] text-black/35">{sub}</div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[11.5px] leading-relaxed text-black/40">
          {t("An estimate for planning, not a filed figure — the declarant buys certificates at the published auction average for the week of import, and applies the official exchange rate. Change the price above to model a different scenario.")}
        </p>
      </Card>

      {/* ── Hotspots ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow>{t("Carbon hotspots")}</Eyebrow>
          <p className="mt-1 max-w-2xl text-sm text-black/45">
            {t("Ranked by absolute chargeable emissions, because that's what you pay for — a high-intensity supplier on a small lot costs less than an average one on a big one.")}
          </p>
        </div>
        <div className="flex flex-none items-center gap-1">
          {(["supplier", "product"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setLens(k)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.08em] transition-colors",
                lens === k ? "border-black/25 bg-[#111] text-white" : "border-black/10 text-black/50 hover:border-black/25 hover:text-black",
              )}
            >
              by {k}
            </button>
          ))}
        </div>
      </div>

      {lens === "supplier" && critical.length > 0 && critical.length < bySupplier.length && (
        <Card warm className="flex items-start gap-3 p-4">
          <Flame size={15} strokeWidth={1.5} className="mt-0.5 flex-none text-[#b45309]" />
          <p className="text-[12.5px] leading-relaxed text-black/55">
            <span className="text-black/80">
              {critical.length} of {bySupplier.length} suppliers
            </span>{" "}
            carry {Math.round(critical[critical.length - 1].cumulativeShare * 100)}% of the chargeable emissions — roughly {fmtEUR(critical.reduce((a, h) => a + h.costEUR, 0))} of this
            declaration&apos;s cost. Anything you do about carbon starts with {critical.length === 1 ? "this one" : "these"}.
          </p>
        </Card>
      )}

      <Card className="divide-y divide-black/[0.05] p-0">
        {hotspots.map((h, i) => (
          <HotspotRow key={h.key} hotspot={h} rank={i + 1} />
        ))}
      </Card>

      {/* ── Benchmark ── */}
      <div>
        <Eyebrow>{t("Against the EU default value")}</Eyebrow>
        <p className="mt-1 max-w-2xl text-sm text-black/45">
          {t("What each good would be assumed to emit if nobody measured it. A figure below the fallback is the whole argument for collecting real data — and the number to put in front of a buyer.")}
        </p>
      </div>
      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr_1fr] gap-3 border-b border-black/[0.06] bg-black/[0.02] px-5 py-2.5 font-mono text-[8px] uppercase tracking-[0.16em] text-black/30">
          <span>{t("Good · supplier")}</span>
          <span className="text-right">{t("Reported")}</span>
          <span className="text-right">{t("EU default")}</span>
          <span className="text-right">{t("Difference")}</span>
        </div>
        {cost.suppliers.flatMap((s) =>
          s.products.map((p) => (
            <BenchmarkRow key={`${s.supplierId}-${p.productId}`} supplierName={s.supplierName} product={p} />
          )),
        )}
        <div className="px-5 py-3 text-[11px] text-black/35">
          {t("Indicative category-level reference values held as data in Certrace, not filed figures — the Commission sets the operative defaults per CN code.")}
        </div>
      </Card>
    </div>
  );
}

function HotspotRow({ hotspot, rank }: { hotspot: Hotspot; rank: number }) {
  const pct = Math.round(hotspot.share * 100);
  const bm = hotspot.benchmark;
  return (
    <div className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:gap-4">
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-black/[0.04] font-mono text-[11px] text-black/45">{rank}</span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] text-black/75">{hotspot.label}</span>
          <span className="block truncate font-mono text-[10.5px] text-black/35">
            {hotspot.sublabel} · {hotspot.intensity} tCO₂e/t
            {bm && bm.verdict !== "level" && (
              <span className={bm.verdict === "better" ? "text-[#16a34a]" : "text-[#b45309]"}>
                {" "}
                · {bm.deltaPct > 0 ? "+" : ""}
                {Math.round(bm.deltaPct)}% vs default
              </span>
            )}
          </span>
        </span>
      </span>
      <span className="flex flex-none items-center gap-4">
        <span className="hidden w-32 sm:block">
          <Progress value={pct} tone={pct >= 40 ? "err" : pct >= 20 ? "warn" : "info"} />
        </span>
        <span className="w-12 text-right font-mono text-[12px] text-black/60">{pct}%</span>
        <span className="w-24 text-right text-[12.5px] text-black/70">{fmtEUR(hotspot.costEUR)}</span>
      </span>
    </div>
  );
}

function BenchmarkRow({ supplierName, product }: { supplierName: string; product: ProductCost }) {
  const t = useT();
  const bm = product.benchmark;
  const meta = BENCHMARK_META[bm?.verdict ?? "unknown"];
  return (
    <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr_1fr] items-center gap-3 border-b border-black/[0.04] px-5 py-3 last:border-0">
      <span className="min-w-0">
        <span className="block truncate text-[13px] text-black/75">{product.productName}</span>
        <span className="block truncate text-[11px] text-black/40">
          {supplierName}
          {product.defaultUsed && <span className="text-[#b45309]"> {t("· reported on defaults")}</span>}
        </span>
      </span>
      <span className="text-right font-mono text-[12px] text-black/70">{product.seePerTonne.toFixed(2)}</span>
      <span className="text-right font-mono text-[12px] text-black/40">{bm ? bm.fallback.toFixed(2) : "—"}</span>
      <span className="flex items-center justify-end gap-2">
        {bm ? (
          <>
            <span className={cn("font-mono text-[12px]", meta.tone === "ok" ? "text-[#16a34a]" : meta.tone === "warn" ? "text-[#b45309]" : "text-black/40")}>
              {bm.deltaPct > 0 ? "+" : ""}
              {bm.deltaPct.toFixed(0)}%
            </span>
            <StatusDot tone={meta.tone} glow={meta.tone === "ok"} />
          </>
        ) : (
          <span className="font-mono text-[11px] text-black/30">{t("no default")}</span>
        )}
      </span>
    </div>
  );
}

/* ════════════════════════ Compliance Intelligence (advisory) ════════════════════════ */
function ComplianceIntelligenceTab({ roll, intel }: { roll: ReviewRollup; intel: IntelligenceReport }) {
  const t = useT();
  if (roll.submittedCount === 0) {
    return <Card className="p-10 text-center text-sm text-black/40">{t("No submissions yet — trust score, narrative and business impact appear once suppliers start submitting.")}</Card>;
  }
  const scoreTone = (s: number) => (s >= 85 ? "#047857" : s >= 60 ? "#b45309" : "#dc2626");

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-black/[0.06] bg-black/[0.02] px-5 py-3">
          <Sparkles size={14} strokeWidth={1.5} className="text-black/55" />
          <Eyebrow>{t("Trust score")}</Eyebrow>
          <span className="ml-auto font-mono text-[10px] text-black/35">{t("advisory · not a filed figure")}</span>
        </div>
        <div className="grid grid-cols-1 gap-px bg-black/[0.06] sm:grid-cols-[160px_1fr]">
          <div className="flex flex-col items-center justify-center bg-white p-6 text-center">
            <div className="font-[family-name:var(--font-plex)] text-5xl font-light" style={{ color: scoreTone(intel.trustScore) }}>{intel.trustScore}</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.1em] text-black/40">{t("can this be trusted")}</div>
          </div>
          <div className="space-y-2 bg-white p-5">
            {intel.trustFactors.length === 0 ? (
              <p className="text-[13px] text-black/45">{t("Nothing pulling the score down — figures look clean.")}</p>
            ) : (
              intel.trustFactors.map((f, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[12.5px]">
                  <span className={cn("mt-0.5 flex-none font-mono text-[11px]", f.impact >= 0 ? "text-[#047857]" : "text-[#dc2626]")}>{f.impact >= 0 ? `+${f.impact}` : f.impact}</span>
                  <span className="text-black/60"><span className="text-black/75">{f.label}.</span> {f.detail}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      <Card className={cn("flex items-start gap-3 p-4", intel.approvalRecommendation.recommend ? "border-[#047857]/20 bg-[#ecfdf5]" : "border-[rgba(180,83,9,0.25)] bg-[#fffbeb]")}>
        {intel.approvalRecommendation.recommend ? <CircleCheck size={18} strokeWidth={1.5} className="mt-0.5 flex-none text-[#047857]" /> : <TriangleAlert size={18} strokeWidth={1.5} className="mt-0.5 flex-none text-[#b45309]" />}
        <div>
          <p className="text-sm text-black/70">
            {intel.approvalRecommendation.recommend ? "Recommend proceeding to sign-off" : "Not yet recommended for sign-off"}{" "}
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-black/35">({intel.approvalRecommendation.confidence} confidence)</span>
          </p>
          <p className="mt-1 text-[12.5px] text-black/55">{intel.approvalRecommendation.rationale}</p>
        </div>
      </Card>

      <Card className="p-5">
        <Eyebrow>{t("What changed")}</Eyebrow>
        <ul className="mt-2.5 space-y-1.5">
          {intel.changeNarrative.map((line, i) => (
            <li key={i} className="flex items-start gap-2 text-[12.5px] text-black/60">
              <span className="mt-1.5 h-1 w-1 flex-none rounded-full bg-black/30" />
              {line}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-5">
        <Eyebrow>{t("Estimated business impact")}</Eyebrow>
        <div className="mt-2 font-[family-name:var(--font-plex)] text-2xl font-light text-[#111]">
          €{intel.businessImpact.low.toLocaleString("en-US")}–{intel.businessImpact.high.toLocaleString("en-US")}
        </div>
        <p className="mt-1.5 max-w-2xl text-[12px] text-black/45">{intel.businessImpact.note}</p>
      </Card>

      {intel.weakEvidence.length > 0 && (
        <Card className="p-5">
          <Eyebrow>{t("Weak evidence")}</Eyebrow>
          <div className="mt-2.5 space-y-2">
            {intel.weakEvidence.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-[12.5px]">
                <TriangleAlert size={13} strokeWidth={1.5} className="mt-0.5 flex-none text-[#b45309]" />
                <span className="text-black/60"><span className="text-black/75">{w.supplier}.</span> {w.detail}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {intel.assumptions.length > 0 && (
        <Card className="p-5">
          <Eyebrow>{t("Assumption ledger")}</Eyebrow>
          <div className="mt-2.5 space-y-2">
            {intel.assumptions.map((a, i) => (
              <div key={i} className="text-[12.5px] text-black/60"><span className="text-black/75">{a.supplier}.</span> {a.detail}</div>
            ))}
          </div>
        </Card>
      )}

      {intel.routing.length > 0 && (
        <Card className="p-5">
          <Eyebrow>{t("Suggested routing")}</Eyebrow>
          <div className="mt-2.5 space-y-2">
            {intel.routing.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-[12.5px] text-black/60">
                <Chip tone="info">{r.role}</Chip>
                <span><span className="text-black/75">{r.supplier}.</span> {r.reason}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ════════════════════════ Step 2 — Generate report ════════════════════════ */
function ReportTab({
  decl,
  roll,
  exporter,
  onChanged,
  onOpenSubmission,
}: {
  decl: Declaration;
  roll: ReviewRollup;
  exporter: ExporterDeclState;
  onChanged: (s: ExporterDeclState) => void;
  onOpenSubmission: (supplierId: string) => void;
}) {
  const t = useT();
  const reg = getRegulation(decl.regulation)!;
  const jur = getJurisdiction(decl.origin)!;
  const approved = roll.submissions.filter((s) => s.lifecycle === "approved");
  const generated = Boolean(exporter.packageGeneratedAt);
  // The sealed package must match the live approved dataset — a resubmission
  // or re-approval after generation makes it stale until regenerated.
  const currentHash = datasetHash(roll.submissions);
  const stale = generated && exporter.packageHash !== null && exporter.packageHash !== currentHash;
  const ref = `CTR-${reg.short.replace(/\s/g, "")}-${decl.period}`.replace(/[^A-Za-z0-9-]/g, "");

  const doDownload = async () => {
    const who = exporterIdentity();
    await downloadPackage({
      ref,
      regulationShort: reg.short,
      regulationFull: reg.full,
      period: decl.periodStart && decl.periodEnd ? `${decl.period} (${decl.periodStart} → ${decl.periodEnd})` : decl.period,
      sector: decl.sector,
      origin: jur.name,
      market: decl.market === "EU" ? "European Union" : decl.market,
      org: who.org,
      installationId: who.installationId,
      buyerLine: decl.buyer ? `${decl.buyer.name} · EORI ${decl.buyer.eori}` : undefined,
      totalEmbedded: roll.reviewedEmissions,
      supplierCount: approved.length,
      carbonPricePaid: decl.carbonPricePaid ?? 0,
      factorSet: jur.factorSet,
      ...packageSummaryData(approved),
      ...packageHistoryData(approved),
      chapters: buildSupplierChapters(approved),
      signOff: buildSignOff(exporter.signoffs ?? []),
    });
    toast({ message: "Package downloaded.", detail: "Full communication & verification package — per-supplier chapters, evidence register, sign-off record and verification trail." });
  };

  const stubOutputs = [
    { title: "Executive Summary", desc: "Trust score, narrative and business impact for management — see Compliance Intelligence.", status: "Available in-app" },
    { title: "Buyer-specific report", desc: "This declaration scoped to one buyer's shipments and preferred layout.", status: "Generated on dispatch" },
    { title: "ERP / Finance export", desc: "Per-supplier emissions + estimated CBAM cost line items, SAP/Oracle-ready fields.", status: "Available on the Scale plan" },
    { title: "API export", desc: "The same compliance dataset via REST, with a webhook on new versions.", status: "Available on the Scale plan" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <Eyebrow>{t("Report package")}</Eyebrow>
        <p className="mt-1 max-w-2xl text-sm text-black/45">{t("One approved dataset, generated into every artifact you need.")}</p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-black/[0.06] bg-black/[0.02] px-5 py-3">
          <StatusDot /> <StatusDot /> <StatusDot />
          <span className="ml-2 font-mono text-[11px] text-black/35">certrace · {ref.toLowerCase()}.pdf</span>
          {generated && <span className="ml-auto"><StatusLabel tone="ok" label={t("generated")} glow /></span>}
        </div>
        {generated ? (
          <div className="space-y-5 p-7">
            {stale && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#d97706]/25 bg-[#fffbeb] px-4 py-3 text-sm text-[#92400e]">
                <span>{t("The approved dataset changed after this package was generated — regenerate before sending anything out.")}</span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    onChanged(markPackageGenerated(decl.id, currentHash));
                    toast({ message: "Package regenerated", detail: "PDF + Registry XML now reflect the current approved dataset.", tone: "ok" });
                  }}
                >
                  {t("Regenerate")}
                </Button>
              </div>
            )}
            <div>
              <div className="font-pixel text-[10px] uppercase tracking-[0.2em] text-black/40">{t("Verification & Evidence Package")}</div>
              <div className="mt-2 font-[family-name:var(--font-plex)] text-2xl font-light text-[#111]">{reg.full}</div>
              <div className="mt-1 text-sm text-black/45">{decl.sector} · {decl.period} · {jur.name} → {decl.market}</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Stat value={roll.reviewedEmissions.toLocaleString("en-US")} label={t("tCO₂e")} />
              <Stat value={`${approved.length}`} label={t("suppliers")} />
              <Stat value={`${roll.avgScore ?? "—"}`} label={t("avg score")} />
            </div>
            <div className="hairline-grid h-28 rounded-xl border border-black/[0.06]" aria-hidden />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] text-black/35"><StatusDot tone="ok" /> {t("sha-256 sealed · verification trail + version history embedded")}</div>
              <Button variant="secondary" size="sm" onClick={doDownload}><Download size={13} strokeWidth={1.5} /> {t("Download")}</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl border border-black/10 text-black/40"><FileText size={20} strokeWidth={1.5} /></span>
            <p className="mt-4 text-sm text-black/45">
              {t("Every supplier is approved — generate the sealed package when you're ready.")}
            </p>
            <Button
              className="mt-4"
              size="sm"
              onClick={() => {
                onChanged(markPackageGenerated(decl.id, datasetHash(roll.submissions)));
                toast({ message: "Report generated", detail: "Verification package + Registry XML sealed from the approved dataset. Next: internal sign-off.", tone: "ok" });
              }}
            >
              <FileText size={14} strokeWidth={1.5} /> {t("Generate package")}
            </Button>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-black/[0.06] bg-black/[0.02] px-5 py-3">
          <StatusDot /> <StatusDot /> <StatusDot />
          <span className="ml-2 font-mono text-[11px] text-black/35">certrace · {ref.toLowerCase()}-registry.xml</span>
          {generated && <span className="ml-auto"><StatusLabel tone="ok" label={t("generated")} glow /></span>}
        </div>
        {generated ? (
          <div className="space-y-5 p-7">
            <div>
              <div className="font-pixel text-[10px] uppercase tracking-[0.2em] text-black/40">{t("CBAM Communication Template · O3CI-ready")}</div>
              <div className="mt-2 font-[family-name:var(--font-plex)] text-2xl font-light text-[#111]">{t("Annex IV data export")}</div>
              <div className="mt-1 text-sm text-black/45">{t("Feeds the CBAM Registry's O3CI module directly, or hands to a buyer not on it yet — see Send & export.")}</div>
            </div>
            <RegistryXmlPanel decl={decl} approved={approved} refSlug={ref.toLowerCase()} onOpenSubmission={onOpenSubmission} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl border border-black/10 text-black/40"><FileText size={20} strokeWidth={1.5} /></span>
            <p className="mt-4 text-sm text-black/45">{t("Generating the package also produces the Registry XML export.")}</p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {stubOutputs.map((o) => (
          <Card key={o.title} className="p-5">
            <div className="text-sm text-[#111]">{o.title}</div>
            <p className="mt-1.5 text-[12.5px] text-black/50">{o.desc}</p>
            <span className="mt-2.5 inline-block font-mono text-[10px] uppercase tracking-[0.08em] text-black/35">{o.status}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}

function RegistryXmlPanel({
  decl,
  approved,
  refSlug,
  onOpenSubmission,
}: {
  decl: Declaration;
  approved: ReviewSubmission[];
  refSlug: string;
  onOpenSubmission: (supplierId: string) => void;
}) {
  const t = useT();
  const validation = React.useMemo(() => validateForRegistry(decl, approved), [decl, approved]);
  const hardErrors = validation.errors.filter((e) => e.severity === "error");
  const warnings = validation.errors.filter((e) => e.severity === "warning");

  /* Outputs bind to the FROZEN calculation, not to live inputs — what was
     approved is what gets filed (lib/cbam/freeze.ts). Exporting before a
     freeze still works, and says so in the file rather than pretending the
     figures are settled. */
  const snapshot = React.useMemo(() => activeSnapshot(decl.id), [decl.id]);

  const handleDownload = () => {
    const xmlContent = buildCbamXml(decl, approved, snapshot);
    downloadXmlFile(refSlug, xmlContent);
    toast({
      message: "XML downloaded.",
      detail: snapshot
        ? `Bound to frozen calculation v${snapshot.version} · ${snapshot.contentHash.slice(0, 10)}…`
        : "Exported from live inputs — freeze the calculation at sign-off so what was approved is what gets filed.",
      tone: snapshot ? "ok" : "warn",
    });
  };

  return (
    <div className="space-y-4">
      {validation.isValid ? (
        <div className="rounded-xl border border-[#047857]/20 bg-[#ecfdf5] p-4 text-sm text-[#047857]">
          <div className="flex items-center gap-2 font-medium">
            <Check size={16} strokeWidth={2} />
            {t("Schema valid for definitive period")}
          </div>
          <p className="mt-1 text-black/60">{t("All required installation and emissions data present.")}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#dc2626]/20 bg-[#fef2f2] p-4 text-sm text-[#dc2626]">
          <div className="flex items-center gap-2 font-medium">
            <CircleX size={16} strokeWidth={2} />
            The Registry would reject this — {hardErrors.length} blocking issue{hardErrors.length === 1 ? "" : "s"}
          </div>
          <ul className="mt-2 space-y-1 text-black/70">
            {hardErrors.map((err, i) => (
              <li key={i}>
                <button
                  onClick={() => onOpenSubmission(err.supplierId)}
                  className="text-left underline decoration-black/20 underline-offset-2 hover:decoration-black/60"
                  title={t("Open this supplier's submission")}
                >
                  <span className="text-black/85">{err.supplierName}</span>: {err.issue}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[12px] text-black/50">{t("Click an issue to open that supplier's submission and request a revision.")}</p>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="rounded-xl border border-[#b45309]/20 bg-[#fffbeb] p-4 text-sm">
          <div className="flex items-center gap-2 font-medium text-[#b45309]">
            <TriangleAlert size={15} strokeWidth={1.8} />
            {warnings.length} warning{warnings.length === 1 ? "" : "s"} — accepted by the Registry, but worth knowing
          </div>
          <ul className="mt-2 space-y-1 text-[13px] text-black/60">
            {warnings.map((w, i) => (
              <li key={i}><span className="text-black/80">{w.supplierName}</span>: {w.issue}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="hairline-grid h-28 rounded-xl border border-black/[0.06]" aria-hidden />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] text-black/35"><StatusDot tone={validation.isValid ? "ok" : "err"} /> {t("strict schema validation")}</div>
        <Button variant="secondary" size="sm" onClick={handleDownload} disabled={!validation.isValid}><Download size={13} strokeWidth={1.5} /> {t("Download XML")}</Button>
      </div>
    </div>
  );
}

/* ════════════════════════ Step 3 — Internal sign-off ════════════════════════ */
function SignoffTab({
  decl,
  exporter,
  onChanged,
  legalRequired,
  freeze,
  onFrozen,
}: {
  decl: Declaration;
  exporter: ExporterDeclState;
  onChanged: (s: ExporterDeclState) => void;
  legalRequired: boolean;
  freeze: { dataset: ActivityDataset | null; precursorTree: PrecursorNode[]; category: GoodsCategory; signoffComplete: boolean };
  onFrozen: () => void;
}) {
  const t = useT();
  const [members, setMembers] = React.useState<TeamMember[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = React.useState(false);
  React.useEffect(() => setMembers(loadTeam()), []);

  const signoffs = exporter.signoffs ?? [];
  const requestedIds = new Set(signoffs.map((s) => s.memberId));
  const available = members.filter((m) => !requestedIds.has(m.id));
  const legalCovered = signoffs.some((s) => getTeamMember(s.memberId)?.dept === "Legal");

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const send = () => {
    const names = [...selected].map((id) => getTeamMember(id)?.name).filter(Boolean).join(", ");
    onChanged(requestReportSignoffs(decl.id, [...selected]));
    setSelected(new Set());
    toast({ message: "Preview sent", detail: `${names} emailed a read-only preview of the report — dispatch unlocks when everyone confirms.`, tone: "info" });
  };

  return (
    <div className="space-y-5">
      <div>
        <Eyebrow>{t("Internal sign-off")}</Eyebrow>
        <p className="mt-1 max-w-2xl text-sm text-black/45">
          {t("Send the report for confirmation before it goes out. Each person gets a read-only preview link, and confirmations are recorded automatically.")}
        </p>
      </div>

      {/* Freezing is what sign-off MEANS — everything above is people
          agreeing, this is the agreement being made durable. */}
      <FreezePanel
        declarationId={decl.id}
        dataset={freeze.dataset}
        precursorTree={freeze.precursorTree}
        category={freeze.category}
        preparerId={USER.name}
        approverOptions={members.map((m) => ({ value: m.name, label: m.name }))}
        signoffComplete={freeze.signoffComplete}
        onFrozen={onFrozen}
      />

      {legalRequired && !legalCovered && (
        <Card warm className="flex items-start gap-3 p-4">
          <TriangleAlert size={16} strokeWidth={1.5} className="mt-0.5 flex-none text-[#b45309]" />
          <p className="text-[12.5px] leading-relaxed text-black/55">
            {t("Anomalies were flagged in this declaration — include")} <span className="text-black/75">{t("Legal counsel")}</span> {t("in the sign-off.")}
          </p>
        </Card>
      )}

      {/* who has it / who confirmed */}
      {signoffs.length > 0 && (
        <Card className="divide-y divide-black/[0.06] p-0">
          {signoffs.map((s) => {
            const m = getTeamMember(s.memberId);
            const confirmed = Boolean(s.confirmedAt);
            return (
              <div key={s.memberId} className="flex flex-wrap items-center gap-3 p-5">
                <span
                  className={cn(
                    "grid h-9 w-9 flex-none place-items-center rounded-xl",
                    confirmed ? "bg-[#ecfdf5] text-[#047857]" : "border border-black/10 text-black/40",
                  )}
                >
                  {confirmed ? <Check size={16} strokeWidth={2} /> : <Users size={16} strokeWidth={1.5} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-black/80">{m?.name ?? "Removed member"}</div>
                  <div className="mt-0.5 text-[11px] text-black/40">
                    {m?.role ?? "—"} · preview sent {new Date(s.requestedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </div>
                </div>
                {confirmed ? (
                  <StatusLabel tone="ok" label={`confirmed ${new Date(s.confirmedAt!).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`} glow />
                ) : (
                  <div className="flex flex-none items-center gap-2">
                    <StatusLabel tone="info" label={t("awaiting confirmation")} pulse />
                    <Button
                      variant="ghost"
                      size="sm"
                      title={t("Demo: records the confirmation that would arrive from their preview link.")}
                      onClick={() => {
                        onChanged(confirmReportSignoff(decl.id, s.memberId));
                        toast({ message: `${m?.name ?? "Reviewer"} confirmed`, detail: "Their confirmation is on the record and embedded in the package.", tone: "ok" });
                      }}
                    >
                      {t("Mark confirmed")}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onChanged(withdrawReportSignoff(decl.id, s.memberId))}>
                      {t("Withdraw")}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      )}

      {/* ask more people */}
      <Card warm className="p-5">
        <div className="flex items-center gap-2">
          <Users size={15} strokeWidth={1.5} className="text-black/55" />
          <Eyebrow>{signoffs.length > 0 ? "Ask someone else" : "Who needs to confirm?"}</Eyebrow>
        </div>
        <p className="mt-1.5 text-[12px] text-black/45">{t("Pick from your team, or add a new person — they'll appear under Team & seats too.")}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {available.map((m) => {
            const on = selected.has(m.id);
            return (
              <button
                key={m.id}
                onClick={() => toggleSelect(m.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                  on ? "border-black/25 bg-[#f0eee8] text-black/80" : "border-black/10 text-black/50 hover:border-black/25 hover:text-black",
                )}
              >
                <span className={cn("grid h-4 w-4 place-items-center rounded-full", on ? "bg-[#111] text-white" : "border border-black/20")}>{on && <Check size={10} strokeWidth={3} />}</span>
                {m.name} <span className="text-black/35">· {m.role}</span>
              </button>
            );
          })}
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-black/20 px-3 py-1.5 text-[12px] text-black/45 transition-colors hover:border-black/40 hover:text-black"
          >
            <Plus size={12} strokeWidth={2} /> {t("Add person")}
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-black/[0.06] pt-4">
          <span className="text-[11px] text-black/40">{selected.size === 0 ? "Select at least one person" : `${selected.size} selected`}</span>
          <Button size="sm" disabled={selected.size === 0} onClick={send}>
            <Send size={14} strokeWidth={1.5} /> {t("Send for confirmation")}
          </Button>
        </div>
      </Card>

      <AddMemberModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        note={t("They join your team list and can be sent this report to confirm — an emailed, read-only preview of exactly what will be dispatched.")}
        onAdded={(m) => {
          setMembers(loadTeam());
          setSelected((prev) => new Set(prev).add(m.id));
          toast({ message: `${m.name} added`, detail: "Selected below — hit “Send for confirmation” when your list is complete.", tone: "ok" });
        }}
      />
    </div>
  );
}

/* ════════════════════════ Step 4 — Send & export ════════════════════════ */
function DispatchTab({
  decl,
  roll,
  exporter,
  onChanged,
  signoffComplete,
  onNavigate,
  onOpenSubmission,
}: {
  decl: Declaration;
  roll: ReviewRollup;
  exporter: ExporterDeclState;
  onChanged: (s: ExporterDeclState) => void;
  signoffComplete: boolean;
  onNavigate: (v: View) => void;
  onOpenSubmission: (supplierId: string) => void;
}) {
  const t = useT();
  const reg = getRegulation(decl.regulation)!;
  const recipients = exporter.recipients;
  const dispatch = exporter.dispatch;
  const buyers = resolveBuyers(decl, exporter);
  const allApproved = roll.total > 0 && roll.submissions.every((s) => s.lifecycle === "approved");
  // The Registry would reject non-conforming data, so dispatch runs the same
  // pre-flight the XML export does — a hard error here blocks the push.
  const approved = roll.submissions.filter((s) => s.lifecycle === "approved");
  const validation = React.useMemo(() => validateForRegistry(decl, approved), [decl, approved]);
  const hardErrors = validation.errors.filter((e) => e.severity === "error");
  // The generated package must still match the live dataset — a resubmission
  // after generation makes it stale, and stale data must never be dispatched.
  const packageStale = exporter.packageHash !== null && exporter.packageHash !== datasetHash(roll.submissions);
  const readyToDispatch = signoffComplete && allApproved && validation.isValid && !packageStale;
  const dispatched = Boolean(dispatch.o3ciPushedAt || dispatch.templateSentAt);

  /* The buyer channel is now a LIST (one dataset, many importers) and has its
     own panel below; the two non-buyer channels keep the single-recipient
     acknowledgement grid they always had. */
  const targets: { key: DispatchRecipient; icon: typeof Building2; title: string; to: string; desc: string }[] = [
    { key: "authority", icon: Landmark, title: reg.authority, to: "O3CI · CBAM Registry", desc: "Reached via the O3CI push below, not a direct portal login." },
    { key: "verifier", icon: BadgeCheck, title: "Accredited verifier", to: "TÜV SÜD · verifier portal", desc: "Scoped source-data access — no email attachments." },
  ];

  return (
    <div className="space-y-5">
      <Card warm className="p-5">
        <Eyebrow>{t("Why this looks different")}</Eyebrow>
        <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-black/55">
          {t("Certrace never files with the CBAM authority directly — only the EU buyer's Authorised CBAM Declarant can do that. What actually reaches the regulator is either a push into the CBAM Registry's")} <span className="text-black/75">{t("O3CI")}</span> {t("module (so any declarant holding your EORI reference can pull the data straight in) or the official")} <span className="text-black/75">{t("Communication Template")}</span> {t("sent to a buyer who isn't on O3CI yet. Filing itself always happens on the buyer's side.")}
        </p>
      </Card>

      {!readyToDispatch && (
        <Card warm className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <StatusDot tone="warn" />
            <p className="text-sm text-black/55">
              {!signoffComplete
                ? "Internal sign-off isn't complete yet — every requested confirmation must land first."
                : !allApproved
                  ? "Every submission must be approved before dispatch."
                  : packageStale
                    ? "The dataset changed after the report was generated — regenerate the package before dispatch."
                    : "The dataset has blocking Registry issues — fix them before anything is sent."}
            </p>
          </div>
          {!signoffComplete && (
            <Button size="sm" variant="ghost" className="flex-none" onClick={() => onNavigate("signoff")}>
              {t("View sign-off")} <ArrowRight size={13} strokeWidth={1.5} />
            </Button>
          )}
        </Card>
      )}

      {/* Same pre-flight the Registry runs — a hard error means the push would bounce. */}
      {signoffComplete && allApproved && hardErrors.length > 0 && (
        <Card className="border-[#dc2626]/25 p-5">
          <div className="flex items-center gap-2">
            <CircleX size={15} strokeWidth={1.8} className="text-[#dc2626]" />
            <Eyebrow>{t("Registry pre-flight failed")}</Eyebrow>
          </div>
          <ul className="mt-2.5 space-y-1.5 text-[13px] text-black/65">
            {hardErrors.map((err, i) => (
              <li key={i}>
                <button
                  onClick={() => onOpenSubmission(err.supplierId)}
                  className="text-left underline decoration-black/20 underline-offset-2 hover:decoration-black/60"
                  title={t("Open this supplier's submission")}
                >
                  <span className="text-black/85">{err.supplierName}</span>: {err.issue}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2.5 text-[12px] text-black/45">{t("Click an issue to open the submission — request a revision there, and dispatch unlocks once the resubmission passes.")}</p>
        </Card>
      )}

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-[#111]">{t("Push to CBAM Registry (O3CI)")}</div>
          {dispatch.o3ciPushedAt && <StatusLabel tone="ok" label={t("pushed")} glow />}
        </div>
        <p className="mt-1.5 max-w-2xl text-[12.5px] text-black/50">
          {t("Uploads the approved installation + emissions dataset in the Registry's own schema. Pushed once, it serves every buyer below — any declarant holding your EORI reference pulls the same data in directly.")}
        </p>
        <Button
          className="mt-3"
          size="sm"
          disabled={!readyToDispatch || Boolean(dispatch.o3ciPushedAt)}
          onClick={() => {
            onChanged(pushToO3CI(decl.id));
            toast({ message: "Pushed to O3CI", detail: "Any declarant with your EORI reference can now pull this in.", tone: "ok" });
          }}
        >
          <Send size={13} strokeWidth={1.5} /> {dispatch.o3ciPushedAt ? `Pushed ${new Date(dispatch.o3ciPushedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "Push now"}
        </Button>
      </Card>

      <BuyerDispatchPanel decl={decl} roll={roll} exporter={exporter} buyers={buyers} readyToDispatch={readyToDispatch} onChanged={onChanged} />

      <div>
        <Eyebrow>{t("Acknowledgement")}</Eyebrow>
        <p className="mt-1 max-w-2xl text-sm text-black/45">{t("The real end state — confirmation a recipient actually received the data, not just that it was sent.")}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {targets.map((target) => {
          const Icon = target.icon;
          const on = recipients[target.key];
          const ack = dispatch.acknowledgedAt[target.key];
          return (
            <div key={target.key} className={cn("rounded-2xl border p-5", on ? "border-black/20 bg-[#f0eee8]" : "border-black/[0.07] bg-white")}>
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-black/10 text-black/60"><Icon size={18} strokeWidth={1.5} /></span>
                <button
                  onClick={() => onChanged(persistRecipients(decl.id, { ...recipients, [target.key]: !on }))}
                  className={cn("grid h-5 w-5 place-items-center rounded-full border", on ? "border-transparent bg-[#111] text-white" : "border-black/15")}
                >
                  {on && <Check size={12} strokeWidth={2} />}
                </button>
              </div>
              <div className="mt-4 text-sm text-[#111]">{target.title}</div>
              <div className="mt-0.5 font-mono text-[11px] text-black/40">{target.to}</div>
              <p className="mt-2 text-[12px] leading-relaxed text-black/45">{target.desc}</p>
              {on &&
                (ack ? (
                  <span className="mt-2 block"><StatusLabel tone="ok" label={`acknowledged ${new Date(ack).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`} glow /></span>
                ) : (
                  <Button variant="ghost" size="sm" className="mt-2" disabled={!dispatched} onClick={() => onChanged(acknowledgeRecipient(decl.id, target.key))}>
                    {t("Mark acknowledged")}
                  </Button>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════ Buyers — one dataset, many importers ════════════════════════ */
function BuyerDispatchPanel({
  decl,
  roll,
  exporter,
  buyers,
  readyToDispatch,
  onChanged,
}: {
  decl: Declaration;
  roll: ReviewRollup;
  exporter: ExporterDeclState;
  buyers: DeclarationBuyerState[];
  readyToDispatch: boolean;
  onChanged: (s: ExporterDeclState) => void;
}) {
  const t = useT();
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", eori: "", email: "", contact: "" });
  const reg = getRegulation(decl.regulation)!;
  const jur = getJurisdiction(decl.origin)!;
  const approved = roll.submissions.filter((s) => s.lifecycle === "approved");

  /* Exactly what one buyer receives — the approved dataset with each supplier's
     onward-sharing policy applied. Generated per buyer rather than once, since
     two buyers can legitimately get different packages from the same dataset. */
  const downloadFor = async (buyer: DeclarationBuyerState) => {
    const who = exporterIdentity();
    await downloadPackage({
      ref: `CTR-${reg.short.replace(/\s/g, "")}-${decl.period}-${buyer.eori}`.replace(/[^A-Za-z0-9-]/g, ""),
      regulationShort: reg.short,
      regulationFull: reg.full,
      period: decl.periodStart && decl.periodEnd ? `${decl.period} (${decl.periodStart} → ${decl.periodEnd})` : decl.period,
      sector: decl.sector,
      origin: jur.name,
      market: decl.market === "EU" ? "European Union" : decl.market,
      org: who.org,
      installationId: who.installationId,
      buyerLine: `${buyer.name} · EORI ${buyer.eori}`,
      totalEmbedded: roll.reviewedEmissions,
      supplierCount: approved.length,
      carbonPricePaid: decl.carbonPricePaid ?? 0,
      factorSet: jur.factorSet,
      ...packageSummaryData(approved),
      ...packageHistoryData(approved),
      chapters: buildSupplierChapters(approved, { audience: "buyer" }),
      signOff: buildSignOff(exporter.signoffs ?? []),
    });
    toast({ message: `Package for ${buyer.name}`, detail: "Scoped to this buyer, with any supplier-restricted detail withheld." });
  };

  const eoriOk = /^[A-Za-z]{2}[A-Za-z0-9]{6,15}$/.test(form.eori.replace(/\s/g, ""));
  const emailOk = /.+@.+\..+/.test(form.email.trim());
  const valid = form.name.trim().length > 0 && eoriOk && emailOk;
  const duplicate = buyers.some((b) => b.eori.toUpperCase() === form.eori.replace(/\s/g, "").toUpperCase());

  // What each buyer actually receives — the same approved dataset, minus
  // anything the supplier held back from onward sharing (lib/supplier-records).
  const withheld = roll.submissions.filter((s) => s.lifecycle === "approved" && s.restrictedForBuyer.length > 0);
  const sent = buyers.filter((b) => b.templateSentAt).length;

  const submit = () => {
    if (!valid || duplicate) return;
    onChanged(addBuyer(decl.id, form));
    toast({
      message: `${form.name.trim()} added`,
      detail: "Same approved dataset, their own EORI — send them the Communication Template when you're ready.",
      tone: "ok",
    });
    setForm({ name: "", eori: "", email: "", contact: "" });
    setAdding(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow>{t("Buyers receiving this dataset")}</Eyebrow>
          <p className="mt-1 max-w-2xl text-sm text-black/45">
            {t("The same approved figures go to every EU importer who bought these goods — each under their own EORI, each acknowledging separately. Adding a buyer never re-opens collection: the dataset is already confirmed.")}
          </p>
        </div>
        <span className="flex-none font-mono text-[11px] text-black/40">{sent}/{buyers.length} sent</span>
      </div>

      <Card className="divide-y divide-black/[0.05] p-0">
        {buyers.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-black/40">
            {t("No buyer on this declaration yet — add the EU importer whose declarant will file this data.")}
          </div>
        )}
        {buyers.map((b) => (
          <div key={b.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-xl border border-black/10 text-black/60">
              <Building2 size={17} strokeWidth={1.5} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm text-[#111]">{b.name}</span>
                {b.primary && (
                  <span className="flex-none rounded-full border border-black/10 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.1em] text-black/45">{t("on the declaration")}</span>
                )}
                {b.acknowledgedAt && <StatusLabel tone="ok" label={t("acknowledged")} glow />}
              </span>
              <span className="mt-0.5 block truncate font-mono text-[11px] text-black/40">
                {b.email} · EORI {b.eori}
              </span>
            </span>
            <span className="flex flex-none flex-wrap items-center gap-2">
              {approved.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => downloadFor(b)} title={t("The package as this buyer receives it")}>
                  <Download size={13} strokeWidth={1.5} /> {t("Their copy")}
                </Button>
              )}
              {b.templateSentAt ? (
                <>
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-black/35">
                    sent {new Date(b.templateSentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                  {!b.acknowledgedAt && (
                    <Button variant="ghost" size="sm" onClick={() => onChanged(acknowledgeBuyer(decl, b.id))}>
                      {t("Mark acknowledged")}
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!readyToDispatch}
                  onClick={() => {
                    onChanged(sendToBuyer(decl, b.id));
                    toast({ message: `Communication Template sent to ${b.name}`, detail: `Annex IV data under EORI ${b.eori}.`, tone: "ok" });
                  }}
                >
                  <FileText size={13} strokeWidth={1.5} /> {t("Send template")}
                </Button>
              )}
              {!b.primary && (
                <button
                  onClick={() => onChanged(removeBuyer(decl.id, b.id))}
                  aria-label={`Remove ${b.name}`}
                  title={t("Remove this buyer")}
                  className="text-black/25 hover:text-[#dc2626]"
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              )}
            </span>
          </div>
        ))}

        {adding ? (
          <div className="space-y-3 bg-[#fafaf8] px-5 py-4">
            <Eyebrow>{t("Add a buyer")}</Eyebrow>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("Importer legal name")}>
                <input className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={t("e.g. Meridian Stahl GmbH")} />
              </Field>
              <Field label={t("EORI number")} hint={form.eori && !eoriOk ? "Two-letter country code + 6–15 characters, e.g. DE123456789012." : "The number their declarant files under."}>
                <input className={inputClass} value={form.eori} onChange={(e) => setForm((f) => ({ ...f, eori: e.target.value }))} placeholder={t("DE123456789012")} />
              </Field>
              <Field label={t("Compliance email")}>
                <input className={inputClass} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder={t("cbam@buyer.example")} />
              </Field>
              <Field label={t("Contact")} optional>
                <input className={inputClass} value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} placeholder={t("e.g. Lena Vogt")} />
              </Field>
            </div>
            {duplicate && form.eori.trim() && <p className="text-[12px] text-[#b45309]">{t("That EORI is already on this declaration — one importer, one entry.")}</p>}
            <div className="flex items-center gap-2">
              <Button size="sm" disabled={!valid || duplicate} onClick={submit}>
                <Plus size={13} strokeWidth={1.5} /> {t("Add buyer")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                {t("Cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center gap-2 px-5 py-3.5 text-left text-[12.5px] text-black/50 transition-colors hover:bg-[#fafaf8] hover:text-black"
          >
            <Plus size={14} strokeWidth={1.5} /> {t("Add another buyer for this dataset")}
          </button>
        )}
      </Card>

      {withheld.length > 0 && (
        <Card warm className="p-4">
          <div className="flex items-center gap-2">
            <EyeOff size={14} strokeWidth={1.5} className="text-black/45" />
            <Eyebrow>{t("What buyers don't receive")}</Eyebrow>
          </div>
          <ul className="mt-2 space-y-1 text-[12.5px] text-black/55">
            {withheld.map((s) => (
              <li key={s.supplier.id}>
                <span className="text-black/80">{s.supplier.name}</span> withheld {listWords(s.restrictedForBuyer.map((k) => SECTION_ACCESS[k].key))} from onward sharing. Every figure
                CBAM requires still travels — only the supporting detail stays with you.
              </li>
            ))}
          </ul>
        </Card>
      )}

      {!exporter.dispatch.o3ciPushedAt && sent > 0 && (
        <p className="text-[12px] text-black/40">
          {t("Sent by template only. Pushing to O3CI as well means any future buyer can pull the same data without another send.")}
        </p>
      )}
    </div>
  );
}

/* ════════════════════════ Verification Trail & Version History ════════════════════════ */
function VerificationTrailTab({ roll, exporter, buyers }: { roll: ReviewRollup; exporter: ExporterDeclState; buyers: DeclarationBuyerState[] }) {
  const t = useT();
  const who = exporterIdentity().contact;
  type Row = { at: number; who: string; text: string };
  const recipientLabel: Record<DispatchRecipient, string> = { buyer: "EU buyer / importer", authority: "EU CBAM Registry", verifier: "Accredited verifier" };

  const supplierName = (id: string) => roll.submissions.find((s) => s.supplier.id === id)?.supplier.name ?? id;
  const rows: Row[] = [
    ...roll.submissions.flatMap((s) => s.events.map((e) => ({ at: e.at, who: s.supplier.name, text: e.text }))),
    ...Object.entries(exporter.remindersSent ?? {}).flatMap(([supplierId, times]) =>
      times.map((at) => ({ at, who: who, text: `Reminder emailed to ${supplierName(supplierId)} — Smart Link still awaiting submission` })),
    ),
    ...(exporter.packageGeneratedAt ? [{ at: exporter.packageGeneratedAt, who: who, text: "Report package generated — verification PDF + Registry XML sealed from the approved dataset" }] : []),
    ...(exporter.signoffs ?? []).flatMap((s) => {
      const m = getTeamMember(s.memberId);
      const name = m?.name ?? "Reviewer";
      const out: Row[] = [{ at: s.requestedAt, who: who, text: `Report preview sent to ${name}${m ? ` (${m.role})` : ""} for confirmation` }];
      if (s.confirmedAt) out.push({ at: s.confirmedAt, who: name, text: "Confirmed the report — sign-off recorded in the package" });
      return out;
    }),
    ...(exporter.dispatch.o3ciPushedAt ? [{ at: exporter.dispatch.o3ciPushedAt, who: who, text: "Pushed to the CBAM Registry's O3CI module" }] : []),
    // One line per buyer — with several importers on one dataset, "sent to the
    // buyer" is no longer a single event anyone can inspect.
    ...buyers.flatMap((b) => {
      const out: Row[] = [];
      if (b.templateSentAt) out.push({ at: b.templateSentAt, who, text: `Communication Template sent to ${b.name} (EORI ${b.eori}) at ${b.email}` });
      if (b.acknowledgedAt) out.push({ at: b.acknowledgedAt, who: b.name, text: "Acknowledged receipt of the declaration data" });
      if (!b.primary && b.addedAt) out.push({ at: b.addedAt, who, text: `${b.name} added as an additional buyer on the confirmed dataset` });
      return out;
    }),
    ...Object.entries(exporter.dispatch.acknowledgedAt)
      // the buyer channel is covered per-buyer above
      .filter(([key]) => key !== "buyer")
      .map(([key, at]) => ({
        at: at as number,
        who: recipientLabel[key as DispatchRecipient],
        text: "Acknowledged receipt of the declaration data",
      })),
  ].sort((a, b) => b.at - a.at);

  if (rows.length === 0) {
    return <Card className="p-10 text-center text-sm text-black/40">{t("Nothing recorded yet — every engine run, AI pass and human decision will appear here as it happens.")}</Card>;
  }

  return (
    <div className="space-y-3">
      <div>
        <Eyebrow>{t("Verification trail")}</Eyebrow>
        <p className="mt-1 max-w-2xl text-sm text-black/45">{t("One unified, append-only timeline — supplier submissions, internal sign-offs and every dispatch, newest first.")}</p>
      </div>
      <Card className="divide-y divide-black/[0.05] p-0">
        {rows.map((r, i) => (
          <div key={i} className="flex items-start gap-3 px-5 py-3">
            <History size={13} strokeWidth={1.5} className="mt-0.5 flex-none text-black/30" />
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] text-black/65">{r.text}</div>
              <div className="mt-0.5 font-mono text-[10px] text-black/35">{r.who} · {new Date(r.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
