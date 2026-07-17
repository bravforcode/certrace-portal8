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
  FileText,
  Download,
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
  inputClass,
  cn,
} from "./ui";
import { toast } from "./toast";
import { AddMemberModal } from "./add-member-modal";
import { DeclarationMenu } from "./declaration-menu";
import { Declaration } from "@/lib/data";
import { getRegulation, getJurisdiction, type ResolvedCbamField } from "@/lib/config";
import { downloadFile, downloadPackage } from "@/lib/download";
import { buildO3ciManualWorksheet, manualEntryIssues } from "@/lib/o3ci-worksheet";
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
  recordWorksheetDownload,
  setO3ciChecklistItem,
  actualValueVerificationBlockers,
  markPackageGenerated,
  requestReportSignoffs,
  confirmReportSignoff,
  withdrawReportSignoff,
  remindSupplier,
  lastReminderAt,
  LIFECYCLE_META,
  exporterIdentity,
  datasetHash,
  type ExporterDeclState,
  type ReviewSubmission,
  type ReviewRollup,
  type O3ciChecklistKey,
} from "@/lib/exporter-review";
import { loadTeam, getTeamMember, type TeamMember } from "@/lib/team-store";
import { computeComplianceFacts, yearFromPeriod, type ComplianceFacts } from "@/lib/compliance-engine";
import { buildSupplierChapters, buildSignOff, packageSummaryData, packageHistoryData } from "@/lib/package-data";
import { buildIntelligence, type IntelligenceReport } from "@/lib/compliance-intelligence";
import { formatDecimal } from "@/lib/workflow-measurements";

/* The four steps of the flow, in the order a real exporter walks them, plus
   two always-available insight views. */
type StepKey = "submissions" | "report" | "signoff" | "dispatch";
type View = StepKey | "intelligence" | "audit";

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
  reviewedEmissions: "0",
  submittedEmissions: "0",
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
     2  Generate preview   unlocks when every supplier is approved — a local
                           draft PDF plus manual-entry worksheet
     3  Internal sign-off  send the report to named people to preview;
                           each confirms before anything leaves the building
     4  Manual handoff     worksheet + self-attested operator checklist;
                           no external submission or delivery

   Compliance Intelligence and the Audit Trail stay as supporting views.
   Locked steps stay visible and say exactly what unlocks them.
   ════════════════════════════════════════════════════════════ */
export function DeclarationWorkflow({ declaration }: { declaration: Declaration }) {
  const router = useRouter();
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
  // Default-value markup follows the reporting period, not today's date.
  const facts: ComplianceFacts = React.useMemo(
    () => computeComplianceFacts(roll, yearFromPeriod(declaration.periodStart, declaration.period), declaration.periodEnd),
    [roll, declaration.periodStart, declaration.periodEnd, declaration.period],
  );
  const intel: IntelligenceReport = React.useMemo(() => buildIntelligence(roll, facts), [roll, facts]);
  const legalRequired = facts.anyUnverifiedActual || roll.anomalies > 0;
  // Internal mapping completeness + verifier-evidence gate. This is not a
  // Registry schema validation or prediction of external acceptance.
  const preflightOk = React.useMemo(() => {
    const approved = roll.submissions.filter((s) => s.lifecycle === "approved");
    if (approved.length === 0) return false;
    return manualEntryIssues(approved).length === 0 && actualValueVerificationBlockers(approved).length === 0;
  }, [roll]);

  // flow gates — each step unlocks the next
  const generated = Boolean(exporter.packageGeneratedAt);
  const signoffs = (exporter.signoffs ?? []).filter((signoff) => signoff.packageHash === exporter.packageHash);
  const confirmedSignoffs = signoffs.filter((s) => s.confirmedAt).length;
  const signoffPending = signoffs.length - confirmedSignoffs;
  const signoffComplete = generated && signoffs.length > 0 && signoffPending === 0;
  const handoffPrepared = Boolean(exporter.dispatch.worksheetDownloadedAt) && Object.values(exporter.dispatch.checklist).every(Boolean);

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
      toast({ message: `${delta} new submission${delta === 1 ? "" : "s"} ready for review`, detail: "Supplier data has been updated.", tone: "info" });
    }
    lastSubmittedCount.current = roll.submittedCount;
  }, [mounted, roll.submittedCount]);

  const open = openId ? roll.submissions.find((s) => s.supplier.id === openId) ?? null : null;

  const goTo = (v: View) => {
    setView(v);
    setOpenId(null);
  };

  const steps: StepMeta[] = [
    {
      key: "submissions",
      label: "Supplier data",
      icon: Inbox,
      locked: false,
      done: roll.allApproved,
      sub: `${roll.approvedCount}/${roll.total} approved`,
    },
    {
      key: "report",
      label: "Generate report",
      icon: FileText,
      locked: !roll.allApproved,
      done: generated,
      sub: generated ? "draft PDF preview generated" : roll.allApproved ? "ready to preview" : "needs all approvals",
    },
    {
      key: "signoff",
      label: "Internal sign-off",
      icon: ClipboardCheck,
      locked: !generated,
      done: signoffComplete,
      sub: signoffs.length > 0 ? `${confirmedSignoffs}/${signoffs.length} confirmed locally` : generated ? "assign confirmation" : "needs the preview",
    },
    {
      key: "dispatch",
      label: "Manual handoff",
      icon: Send,
      locked: !signoffComplete,
      done: handoffPrepared,
      sub: handoffPrepared ? "manual checklist complete" : "worksheet · operator checklist",
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
            <ArrowLeft size={13} strokeWidth={1.5} /> All submissions
          </button>
        ) : (
          <Link href="/declarations" className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-black/40 hover:text-black">
            <ArrowLeft size={13} strokeWidth={1.5} /> Declarations
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
              <span>{declaration.sector}</span>
              <span>{reg.cadence}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={declaration.dueInDays < 0 ? "err" : declaration.dueInDays < 21 ? "warn" : "muted"}>supplier collection due {declaration.collectionDeadline ?? declaration.due}</Chip>
            {declaration.cbamDeclarationDue && <Chip tone="info">EU-side annual declaration due {declaration.cbamDeclarationDue}</Chip>}
            <DeclarationMenu decl={declaration} afterDelete={() => router.replace("/declarations")} />
          </div>
        </div>
      </div>

      {/* What to do now — replaces the old Overview tab */}
      {mounted && (
        <NextAction
          roll={roll}
          generated={generated}
          signoffs={signoffs.length}
          signoffPending={signoffPending}
          handoffPrepared={handoffPrepared}
          preflightOk={preflightOk}
          view={view}
          onGo={goTo}
        />
      )}

      {/* Step rail — the flow itself */}
      <StepRail steps={steps} view={view} currentKey={currentKey} onSelect={goTo} />

      {/* Supporting views */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[10px] uppercase tracking-[0.14em] text-black/30">Insights</span>
        {([
          ["intelligence", "Compliance intelligence", Sparkles],
          ["audit", "Local activity", History],
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
          <Card className="p-10 text-center text-sm text-black/35">Loading submissions…</Card>
        ) : activeStep?.locked && view !== "dispatch" ? (
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
          <SignoffTab decl={declaration} exporter={exporter} onChanged={setExporter} legalRequired={legalRequired} />
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
        ) : view === "intelligence" ? (
          <ComplianceIntelligenceTab roll={roll} intel={intel} facts={facts} />
        ) : (
          <AuditTrailTab roll={roll} exporter={exporter} />
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
  handoffPrepared,
  preflightOk,
  view,
  onGo,
}: {
  roll: ReviewRollup;
  generated: boolean;
  signoffs: number;
  signoffPending: number;
  handoffPrepared: boolean;
  preflightOk: boolean;
  view: View;
  onGo: (v: View) => void;
}) {
  const toReview = roll.counts.submitted + roll.counts.in_review;

  let tone: "warn" | "info" | "ok" = "info";
  let text: React.ReactNode;
  let cta = "Open";
  let target: View = "submissions";

  if (toReview > 0) {
    text = (
      <>
        <span className="text-black/80">{toReview} submission{toReview === 1 ? "" : "s"}</span> waiting for your review.
      </>
    );
    cta = "Review supplier data";
  } else if (roll.awaitingCount > 0 || roll.changesCount > 0) {
    tone = "warn";
    const parts: string[] = [];
    if (roll.awaitingCount > 0) parts.push(`${roll.awaitingCount} supplier${roll.awaitingCount === 1 ? "" : "s"} haven't submitted`);
    if (roll.changesCount > 0) parts.push(`${roll.changesCount} revision${roll.changesCount === 1 ? "" : "s"} still with the supplier`);
    text = (
      <>
        Waiting on suppliers — <span className="text-black/80">{parts.join(" · ")}</span>.
      </>
    );
    cta = "See who's outstanding";
  } else if (!generated) {
    tone = "ok";
    text = (
      <>
        <span className="text-black/80">All supplier data approved.</span> Generate the report package.
      </>
    );
    cta = "Generate report";
    target = "report";
  } else if (signoffs === 0) {
    text = (
      <>
        <span className="text-black/80">Draft preview generated.</span> Assign local internal sign-off.
      </>
    );
    cta = "Open sign-off";
    target = "signoff";
  } else if (signoffPending > 0) {
    tone = "warn";
    text = (
      <>
        Waiting on <span className="text-black/80">{signoffPending} internal confirmation{signoffPending === 1 ? "" : "s"}</span>.
      </>
    );
    cta = "View sign-off";
    target = "signoff";
  } else if (!handoffPrepared && !preflightOk) {
    tone = "warn";
    text = (
      <>
        <span className="text-black/80">Manual handoff is blocked.</span> Resolve data and accredited-verifier evidence gaps first.
      </>
    );
    cta = "View issues";
    target = "dispatch";
  } else if (!handoffPrepared) {
    tone = "ok";
    text = (
      <>
        <span className="text-black/80">Locally signed off.</span> Prepare the manual O3CI worksheet and checklist.
      </>
    );
    cta = "Prepare manual handoff";
    target = "dispatch";
  } else {
    tone = "ok";
    text = (
      <>
        <span className="text-black/80">Manual-entry checklist recorded locally.</span> Complete the actual O3CI work in the operator&apos;s own account.
      </>
    );
    cta = "Review checklist";
    target = "dispatch";
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
  const blocker = steps.find((s) => !s.done && !s.locked);
  const reason =
    step.key === "report"
      ? "Every supplier submission must pass deterministic checks and be approved before a draft preview can be generated. Approval does not make actual values verified."
      : step.key === "signoff"
        ? "Generate the local draft preview first — sign-off is recorded only in this browser."
        : "Complete the local sign-off model before preparing the manual-entry worksheet. Nothing is dispatched by Certrace.";
  return (
    <Card className="flex flex-col items-center justify-center p-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl border border-black/10 text-black/35">
        <Lock size={20} strokeWidth={1.5} />
      </span>
      <p className="mt-4 text-sm text-black/60">{step.label} is locked for now.</p>
      <p className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-black/40">{reason}</p>
      {blocker && (
        <Button className="mt-5" size="sm" variant="secondary" onClick={() => onGo(blocker.key)}>
          Go to {blocker.label} <ArrowRight size={13} strokeWidth={1.5} />
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
  const stats: { value: React.ReactNode; label: string }[] = [
    { value: `${roll.submittedCount}/${roll.total}`, label: "Submitted" },
    { value: roll.counts.in_review + roll.counts.submitted, label: "Awaiting review" },
    { value: roll.changesCount, label: "Changes requested" },
    { value: roll.approvedCount, label: "Approved" },
  ];
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
        <Eyebrow>Supplier submissions</Eyebrow>
        <p className="mt-1 max-w-xl text-sm text-black/45">
          Same-browser demo links model supplier collection. No link is authenticated, emailed or cross-device. Open a submission to review deterministic checks before approval.
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
              toast({ message: "Follow-up noted locally", detail: `No reminder was sent to ${s.supplier.name}; contact them outside Certrace.`, tone: "info" });
            }}
            onOpen={() => onOpen(s.supplier.id)}
          />
        ))}
      </div>
    </div>
  );
}

function SubmissionRow({ sub, lastReminded, onRemind, onOpen }: { sub: ReviewSubmission; lastReminded: number | null; onRemind: () => void; onOpen: () => void }) {
  const meta = LIFECYCLE_META[sub.lifecycle];
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
            title="CBAM-critical: this supplier carries a major share of the declaration's embedded emissions — the package can't be filed without them."
          />
        )}
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="truncate text-[13px] text-black/75">{sub.supplier.name}</span>
            <span className="font-mono text-[11px] text-black/25">{sub.supplier.ref}</span>
          </span>
          <span className="mt-0.5 flex items-center gap-2 text-[11px] text-black/40">
            <span className="font-mono text-[10px] text-black/35">{sub.supplier.country}</span>
            {sub.supplier.material}
            {sub.submitted && <span className="text-black/30">· v{sub.version}{sub.check ? ` · score ${sub.check.score}` : ""}</span>}
            {!sub.submitted && lastReminded && <span className="text-black/30">· reminded {ago(lastReminded)}</span>}
          </span>
        </span>
      </span>

      {/* copy Smart Link — flips to a "copied" state inline, no popup */}
      <button
        onClick={copy}
        title="Copy same-browser demo link"
        aria-label="Copy same-browser demo link"
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
        {copied ? "Copied" : "Demo link"}
      </button>

      <span className="flex flex-none items-center gap-3">
        <StatusLabel tone={meta.tone} label={meta.label} pulse={sub.lifecycle === "in_review" || sub.lifecycle === "submitted"} glow={sub.lifecycle === "approved"} />
        {sub.submitted ? (
          <ChevronRight size={16} strokeWidth={1.5} className="text-black/30" />
        ) : (
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onRemind(); }}>
            <Bell size={13} strokeWidth={1.5} /> Remind
          </Button>
        )}
      </span>
    </div>
  );
}

/* ════════════════════════ Submission review ════════════════════════ */
function SubmissionReview({ decl, sub, onChanged }: { decl: Declaration; sub: ReviewSubmission; onChanged: (s: ExporterDeclState) => void }) {
  const [showRevision, setShowRevision] = React.useState(false);
  const meta = LIFECYCLE_META[sub.lifecycle];

  const approve = () => {
    try {
      onChanged(approveSubmission(decl.id, sub.supplier.id, sub.version));
      toast({ message: "Submission approved locally", detail: `${sub.supplier.name} · v${sub.version} added to the browser-local draft dataset.`, tone: "ok" });
    } catch (error) {
      toast({ message: "Approval blocked", detail: error instanceof Error ? error.message : "Resolve critical findings first.", tone: "err" });
    }
  };

  return (
    <div className="space-y-6">
      {/* identity header */}
      <div className="flex flex-col gap-3 border-b border-black/[0.06] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Eyebrow>Submission · v{sub.version}</Eyebrow>
          <h2 className="mt-1.5 font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#111]">{sub.supplier.name}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-black/45">
            <span className="font-mono text-[11px] text-black/35">{sub.supplier.country} · {sub.supplier.ref}</span>
            {sub.signedBy && <span>locally attested by {sub.signedBy} ({sub.signedRole})</span>}
            {sub.submittedAt && <span>{new Date(sub.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
          </p>
        </div>
        <StatusLabel tone={meta.tone} label={meta.label} pulse={sub.lifecycle === "in_review"} glow={sub.lifecycle === "approved"} />
      </div>

      {/* state banners */}
      {sub.lifecycle === "approved" && (
        <Card className="flex items-center gap-3 border-[#047857]/20 bg-[#ecfdf5] p-4">
          <StatusDot tone="ok" glow />
          <p className="text-sm text-black/60">Approved in this local draft — v{sub.version} is not immutable, regulator-filed or verifier-approved.</p>
        </Card>
      )}
      {sub.lifecycle === "changes_requested" && (
        <Card className="border-[#2563eb]/25 bg-[#eff6ff] p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg bg-[#dbeafe] text-[#2563eb]"><PenLine size={15} strokeWidth={1.5} /></span>
            <div className="min-w-0 text-[13px] leading-relaxed text-black/65">
              <span className="text-black/80">Revision recorded locally.</span> {sub.review.unlockedFields.length} field{sub.review.unlockedFields.length === 1 ? "" : "s"}{sub.review.unlockedDocs.length ? ` and ${sub.review.unlockedDocs.length} document${sub.review.unlockedDocs.length === 1 ? "" : "s"}` : ""} reopen in this browser. No message was delivered.
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
            toast({ message: "Revision recorded locally", detail: `Flagged items reopen in this browser; ${sub.supplier.name} was not emailed.`, tone: "info" });
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
                : "Review deterministic findings and advisory anomaly flags, then approve this local draft or identify fields to revise."}
            </p>
          </div>
          <div className="flex flex-none items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowRevision(true)}>
              <PenLine size={14} strokeWidth={1.5} /> Request revision
            </Button>
            <Button size="sm" onClick={approve} disabled={sub.lifecycle === "approved" || !sub.check?.passable || (sub.check?.critical ?? 0) > 0}>
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
  const check = sub.check;
  const scoreTone = (s: number) => (s >= 85 ? "#047857" : s >= 60 ? "#b45309" : "#dc2626");
  const warnings = check?.findings.filter((f) => f.severity === "warning") ?? [];
  const criticals = check?.findings.filter((f) => f.severity === "critical") ?? [];

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b border-black/[0.06] bg-black/[0.02] px-5 py-3">
        <Sparkles size={14} strokeWidth={1.5} className="text-black/55" />
        <Eyebrow>Submission evidence summary</Eyebrow>
        <span className="ml-auto font-mono text-[10px] text-black/35">{sub.source === "live" ? "from submitted data" : "generated"}</span>
      </div>
      <div className="grid grid-cols-1 gap-px bg-black/[0.06] sm:grid-cols-[180px_1fr]">
        <div className="flex flex-col items-center justify-center bg-white p-6 text-center">
          <div className="font-[family-name:var(--font-plex)] text-5xl font-light" style={{ color: scoreTone(check?.score ?? 0) }}>{check?.score ?? "—"}</div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.1em] text-black/40">data quality</div>
          <div className="mt-2 flex items-center gap-2 text-[11px]">
            <span className="text-[#dc2626]">{criticals.length} critical</span>
            <span className="text-black/20">·</span>
            <span className="text-[#b45309]">{warnings.length} warnings</span>
          </div>
        </div>
        <div className="space-y-4 bg-white p-5">
          {/* key emissions */}
          <div>
            <div className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/40">Key emissions data</div>
            <div className="mt-2 space-y-1.5">
              {sub.emissions.map((e) => {
                const direct = sub.values[valueKey("direct-emissions", e.productId)]?.trim() || null;
                const indirect = sub.values[valueKey("indirect-emissions", e.productId)]?.trim() || null;
                return (
                  <div key={e.productId} className="flex items-center justify-between rounded-lg border border-black/[0.06] bg-[#fafaf8] px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-[13px] text-black/75">{e.productName}</div>
                      <div className="font-mono text-[10px] text-black/40">CN {e.cnCode} · {formatDecimal(e.tonnes)} TNE</div>
                      {direct !== null && indirect !== null && (
                        <div className="font-mono text-[10px] text-black/35">direct {formatDecimal(direct)} · indirect {formatDecimal(indirect)} TCO2E_PER_TNE</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-[family-name:var(--font-plex)] text-lg font-light text-[#111]">{formatDecimal(e.perTonne)} <span className="text-xs text-black/40">TCO2E_PER_TNE</span></div>
                      <div className="font-mono text-[10px] text-black/40">{formatDecimal(e.total)} TCO2E total</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-black/50">
              <span>Embedded total: <span className="text-black/75">{formatDecimal(sub.totalTCO2e)} TCO2E</span></span>
              <span>File references: {Object.values(sub.docs).filter((d) => d.status === "uploaded").length}/{sub.request.documents.length}</span>
            </div>
          </div>

          {/* findings */}
          {(criticals.length > 0 || warnings.length > 0) ? (
            <div>
              <div className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/40">Flagged for your attention</div>
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
              <CircleCheck size={14} strokeWidth={1.5} /> No anomalies or gaps — figures are complete, in range and standardised.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/* Read-only view of exactly what the supplier submitted (same input / output) */
function SubmittedData({ sub }: { sub: ReviewSubmission }) {
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
        return rp ? `${formatDecimal(rp.commercialQuantityTonnes)} TNE` : "—";
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
        <Eyebrow>Submitted data</Eyebrow>
        <span className="ml-auto font-mono text-[10px] text-black/35">read-only</span>
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
                {!d.required && <span className="text-[9px] uppercase tracking-[0.1em] text-black/30">optional</span>}
                {uploaded ? (
                  <span className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-black/35">
                    {files.length === 0 && "metadata referenced"}
                    {files.map((f, i) => (
                      <span key={i} title="Metadata reference only — document bytes are not stored">{f.name} · reference only</span>
                    ))}
                  </span>
                ) : (
                  <span className="font-mono text-[10px] text-black/35">no file reference</span>
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
  const [members, setMembers] = React.useState<TeamMember[]>([]);
  const [showAdd, setShowAdd] = React.useState(false);
  React.useEffect(() => setMembers(loadTeam()), []);

  return (
    <Card warm className="p-5">
      <div className="flex items-center gap-2">
        <Users size={15} strokeWidth={1.5} className="text-black/55" />
        <Eyebrow>Internal reviewers</Eyebrow>
      </div>
      <p className="mt-1.5 text-[12px] text-black/45">Model local reviewer assignments for ESG, Compliance, Legal or a verifier. No email, identity authority or scoped access is configured.</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {members.map((m) => {
          const on = sub.review.reviewers.includes(m.id);
          return (
            <button
              key={m.id}
              onClick={() => {
                onChanged(toggleReviewer(decl.id, sub.supplier.id, m.id));
                if (!on) toast({ message: `${m.name} assigned locally`, detail: "No invitation or access link was sent.", tone: "info" });
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
          <Plus size={12} strokeWidth={2} /> Add person
        </button>
      </div>
      {sub.review.reviewers.length > 0 && (
        <p className="mt-2.5 text-[11px] text-[#047857]">
          Locally assigned: {sub.review.reviewers.map((id) => getTeamMember(id)?.name).filter(Boolean).join(", ")} — no notification was sent.
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
          toast({ message: `${m.name} added & assigned locally`, detail: "No invitation was sent; they also appear under Team & seats.", tone: "info" });
        }}
      />
    </Card>
  );
}

/* Request revision — pick specific fields + docs + a comment */
function RevisionForm({ sub, onCancel, onSubmit }: { sub: ReviewSubmission; onCancel: () => void; onSubmit: (p: { fields: string[]; docs: string[]; comment: string }) => void }) {
  const sections = sectionsForRequest(sub.request);
  const [fields, setFields] = React.useState<Set<string>>(new Set(sub.review.unlockedFields));
  const [docs, setDocs] = React.useState<Set<string>>(new Set(sub.review.unlockedDocs));
  const [comment, setComment] = React.useState(sub.review.comment);

  const toggle = (set: Set<string>, key: string, fn: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
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
        <Eyebrow>Request a revision</Eyebrow>
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
                  {!d.required && <span className="flex-none text-[9px] uppercase tracking-[0.1em] text-black/30">optional</span>}
                </button>
              );
            })}
          </div>
          <Field label="Comment to the supplier">
            <textarea
              className={cn(inputClass, "mt-2 min-h-[88px] resize-y")}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Explain what needs changing — e.g. “The direct emissions figure looks high for an EAF route; please confirm actual vs default and re-upload a legible Mill Test Certificate.”"
            />
          </Field>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-4">
        <span className="text-[11px] text-black/40">{total} item{total === 1 ? "" : "s"} selected{!comment.trim() && total > 0 ? " · add a comment to send" : ""}</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" disabled={!valid} onClick={() => onSubmit({ fields: [...fields], docs: [...docs], comment: comment.trim() })}>
            <Send size={14} strokeWidth={1.5} /> Send revision request
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* ════════════════════════ Compliance Intelligence (advisory) ════════════════════════ */
function ComplianceIntelligenceTab({ roll, intel, facts }: { roll: ReviewRollup; intel: IntelligenceReport; facts: ComplianceFacts }) {
  if (roll.submittedCount === 0) {
    return <Card className="p-10 text-center text-sm text-black/40">No submissions yet — trust score, narrative and business impact appear once suppliers start submitting.</Card>;
  }
  const scoreTone = (s: number) => (s >= 85 ? "#047857" : s >= 60 ? "#b45309" : "#dc2626");

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-black/[0.06] bg-black/[0.02] px-5 py-3">
          <Sparkles size={14} strokeWidth={1.5} className="text-black/55" />
          <Eyebrow>Trust score</Eyebrow>
          <span className="ml-auto font-mono text-[10px] text-black/35">advisory · not a filed figure</span>
        </div>
        <div className="grid grid-cols-1 gap-px bg-black/[0.06] sm:grid-cols-[160px_1fr]">
          <div className="flex flex-col items-center justify-center bg-white p-6 text-center">
            <div className="font-[family-name:var(--font-plex)] text-5xl font-light" style={{ color: scoreTone(intel.trustScore) }}>{intel.trustScore}</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.1em] text-black/40">can this be trusted</div>
          </div>
          <div className="space-y-2 bg-white p-5">
            {intel.trustFactors.length === 0 ? (
              <p className="text-[13px] text-black/45">Nothing pulling the score down — figures look clean.</p>
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
        <Eyebrow>What changed</Eyebrow>
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
        <Eyebrow>Estimated business impact</Eyebrow>
        <div className="mt-2 font-[family-name:var(--font-plex)] text-2xl font-light text-[#111]">
          {intel.businessImpact.low === null || intel.businessImpact.high === null
            ? "Unavailable — official price required"
            : `€${formatDecimal(intel.businessImpact.low)}–${formatDecimal(intel.businessImpact.high)}`}
        </div>
        <p className="mt-1.5 max-w-2xl text-[12px] text-black/45">{intel.businessImpact.note}</p>
      </Card>

      <Card warm className="p-5">
        <Eyebrow>50-tonne threshold · not assessed</Eyebrow>
        <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-black/55">
          The threshold is assessed per EU importer and calendar year across all eligible CBAM imports, not per Certrace request or supplier. Electricity and hydrogen are excluded from the mass test. Importer-wide customs totals are unavailable here, so the request&apos;s {formatDecimal(facts.totalTonnes)} TNE is not used to claim an exemption.
        </p>
      </Card>

      {intel.weakEvidence.length > 0 && (
        <Card className="p-5">
          <Eyebrow>Weak evidence</Eyebrow>
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
          <Eyebrow>Assumption ledger</Eyebrow>
          <div className="mt-2.5 space-y-2">
            {intel.assumptions.map((a, i) => (
              <div key={i} className="text-[12.5px] text-black/60"><span className="text-black/75">{a.supplier}.</span> {a.detail}</div>
            ))}
          </div>
        </Card>
      )}

      {intel.routing.length > 0 && (
        <Card className="p-5">
          <Eyebrow>Suggested routing</Eyebrow>
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
  const reg = getRegulation(decl.regulation)!;
  const jur = getJurisdiction(decl.origin)!;
  const approved = roll.submissions.filter((s) => s.lifecycle === "approved");
  const reportIssues = manualEntryIssues(approved);
  const verificationBlockers = actualValueVerificationBlockers(approved);
  const reportReady = roll.allApproved && approved.length > 0 && reportIssues.length === 0 && verificationBlockers.length === 0;
  const generated = Boolean(exporter.packageGeneratedAt);
  // The local draft preview must match the browser's approved dataset.
  const currentHash = datasetHash(roll.submissions);
  const stale = generated && exporter.packageHash !== null && exporter.packageHash !== currentHash;
  const ref = `CTR-${reg.short.replace(/\s/g, "")}-${decl.period}`.replace(/[^A-Za-z0-9-]/g, "");

  const doDownload = async () => {
    if (!reportReady) {
      toast({ message: "Draft package blocked", detail: verificationBlockers[0] ?? reportIssues[0]?.issue ?? "All current supplier versions must be approved.", tone: "err" });
      return;
    }
    const who = exporterIdentity();
    await downloadPackage({
      ref,
      regulationShort: reg.short,
      regulationFull: reg.full,
      period: decl.periodStart && decl.periodEnd ? `${decl.period} (${decl.periodStart} → ${decl.periodEnd})` : decl.period,
      collectionDeadline: decl.collectionDeadline ?? decl.due,
      cbamDeclarationDue: decl.cbamDeclarationDue,
      sector: decl.sector,
      origin: jur.name,
      market: decl.market === "EU" ? "European Union" : decl.market,
      org: who.org,
      installationId: who.installationId,
      buyerLine: decl.buyer ? `${decl.buyer.name} · EORI ${decl.buyer.eori}` : undefined,
      totalEmbedded: roll.reviewedEmissions,
      supplierCount: approved.length,
      carbonPricePaid: decl.carbonPricePaid ?? "0",
      factorSet: jur.factorSet,
      ...packageSummaryData(approved),
      ...packageHistoryData(approved),
      chapters: buildSupplierChapters(approved),
      signOff: buildSignOff((exporter.signoffs ?? []).filter((signoff) => signoff.packageHash === exporter.packageHash)),
    });
    toast({ message: "Draft preview downloaded", detail: "Local calculation preview only; not verified, immutable, filed or audit-ready." });
  };

  const stubOutputs = [
    { title: "Executive Summary", desc: "Trust score, narrative and business impact for management — see Compliance Intelligence.", status: "Available in-app" },
    { title: "Buyer-specific report", desc: "Planned layout for a named buyer; delivery and buyer templates are not configured.", status: "Deferred" },
    { title: "ERP / Finance export", desc: "Planned per-supplier line items; no ERP connector is configured.", status: "Deferred" },
    { title: "API export", desc: "Requires the deferred authenticated backend and webhook infrastructure.", status: "Backend required" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <Eyebrow>Draft report preview</Eyebrow>
        <p className="mt-1 max-w-2xl text-sm text-black/45">Browser-local calculation output with explicit evidence and verification blockers.</p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-black/[0.06] bg-black/[0.02] px-5 py-3">
          <StatusDot /> <StatusDot /> <StatusDot />
          <span className="ml-2 font-mono text-[11px] text-black/35">certrace · {ref.toLowerCase()}.pdf</span>
          {generated && <span className="ml-auto"><StatusLabel tone="ok" label="generated" glow /></span>}
        </div>
        {generated ? (
          <div className="space-y-5 p-7">
            {stale && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#d97706]/25 bg-[#fffbeb] px-4 py-3 text-sm text-[#92400e]">
                <span>The approved dataset changed after this package was generated — regenerate before sending anything out.</span>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!reportReady}
                  onClick={() => {
                    onChanged(markPackageGenerated(decl.id, currentHash));
                    toast({ message: "Draft preview regenerated", detail: "The local PDF now reflects the current browser dataset.", tone: "ok" });
                  }}
                >
                  Regenerate
                </Button>
              </div>
            )}
            <div>
              <div className="font-pixel text-[10px] uppercase tracking-[0.2em] text-black/40">Draft calculation & report preview</div>
              <div className="mt-2 font-[family-name:var(--font-plex)] text-2xl font-light text-[#111]">{reg.full}</div>
              <div className="mt-1 text-sm text-black/45">{decl.sector} · {decl.period} · {jur.name} → {decl.market}</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Stat value={formatDecimal(roll.reviewedEmissions)} label="TCO2E" />
              <Stat value={`${approved.length}`} label="suppliers" />
              <Stat value={`${roll.avgScore ?? "—"}`} label="avg score" />
            </div>
            <div className="hairline-grid h-28 rounded-xl border border-black/[0.06]" aria-hidden />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] text-black/35"><StatusDot tone="info" /> local SHA-256 checksum · not a trusted seal or immutable audit record</div>
              <Button variant="secondary" size="sm" disabled={!reportReady} onClick={doDownload}><Download size={13} strokeWidth={1.5} /> Download draft PDF</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl border border-black/10 text-black/40"><FileText size={20} strokeWidth={1.5} /></span>
            <p className="mt-4 text-sm text-black/45">
              Every supplier draft is approved — generate a local calculation preview when you&apos;re ready.
            </p>
            <Button
              className="mt-4"
              size="sm"
              disabled={!reportReady}
              onClick={() => {
                onChanged(markPackageGenerated(decl.id, datasetHash(roll.submissions)));
                toast({ message: "Draft preview generated", detail: "No Registry XML, email delivery, trusted seal or legal filing was created.", tone: "ok" });
              }}
            >
              <FileText size={14} strokeWidth={1.5} /> Generate draft preview
            </Button>
          </div>
        )}
      </Card>

      {!reportReady && (
        <Card className="border-[#b45309]/25 bg-[#fffbeb] p-5">
          <div className="flex items-center gap-2 text-[#b45309]"><TriangleAlert size={15} strokeWidth={1.8} /><Eyebrow>Draft package blocked</Eyebrow></div>
          <ul className="mt-2 space-y-1 text-[12.5px] text-black/60">
            {!roll.allApproved && <li>Every current supplier version must pass deterministic checks and receive local approval.</li>}
            {reportIssues.map((issue, index) => <li key={`mapping-${index}`}>{issue.supplierName}: {issue.issue}</li>)}
            {verificationBlockers.map((blocker, index) => <li key={`verification-${index}`}>{blocker}</li>)}
          </ul>
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-black/[0.06] bg-black/[0.02] px-5 py-3">
          <StatusDot /> <StatusDot /> <StatusDot />
          <span className="ml-2 font-mono text-[11px] text-black/35">certrace · {ref.toLowerCase()}-o3ci-manual-entry.csv</span>
          {generated && <span className="ml-auto"><StatusLabel tone="info" label="draft aid" /></span>}
        </div>
        {generated ? (
          <div className="space-y-5 p-7">
            <div>
              <div className="font-pixel text-[10px] uppercase tracking-[0.2em] text-black/40">O3CI manual-entry worksheet</div>
              <div className="mt-2 font-[family-name:var(--font-plex)] text-2xl font-light text-[#111]">Human mapping aid</div>
              <div className="mt-1 text-sm text-black/45">Not an O3CI upload, official schema, Registry XML or proof of submission. Enter and verify values manually in the operator&apos;s own account.</div>
            </div>
            <O3ciWorksheetPanel decl={decl} approved={approved} refSlug={ref.toLowerCase()} onOpenSubmission={onOpenSubmission} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl border border-black/10 text-black/40"><FileText size={20} strokeWidth={1.5} /></span>
            <p className="mt-4 text-sm text-black/45">Generate the draft preview to inspect the manual-entry worksheet.</p>
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

function O3ciWorksheetPanel({
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
  const issues = React.useMemo(() => manualEntryIssues(approved), [approved]);
  const verificationBlockers = React.useMemo(() => actualValueVerificationBlockers(approved), [approved]);
  const noApprovedSubmissions = approved.length === 0;

  const handleDownload = () => {
    if (noApprovedSubmissions || issues.length > 0 || verificationBlockers.length > 0) {
      toast({
        message: "Manual-entry CSV blocked",
        detail: verificationBlockers[0] ?? (noApprovedSubmissions ? "No current supplier submission has passed deterministic checks and local approval." : "Resolve every required mapping field before preparing the worksheet."),
        tone: "err",
      });
      return;
    }
    downloadFile(`certrace-${refSlug}-o3ci-manual-entry.csv`, buildO3ciManualWorksheet(decl, approved), "text/csv");
    toast({ message: "Manual-entry CSV downloaded", detail: "Draft mapping aid only; no O3CI upload or schema validation occurred.", tone: "info" });
  };

  return (
    <div className="space-y-4">
      {noApprovedSubmissions && (
        <div className="rounded-xl border border-[#dc2626]/20 bg-[#fef2f2] p-4 text-sm text-[#dc2626]">
          <div className="flex items-center gap-2 font-medium"><CircleX size={16} strokeWidth={2} /> No locally approved submissions are available</div>
          <p className="mt-1 text-black/60">A stale approval is ignored whenever current deterministic checks contain a critical finding.</p>
        </div>
      )}
      {issues.length === 0 && !noApprovedSubmissions ? (
        <div className="rounded-xl border border-[#047857]/20 bg-[#ecfdf5] p-4 text-sm text-[#047857]">
          <div className="flex items-center gap-2 font-medium">
            <Check size={16} strokeWidth={2} />
            Manual mapping fields are complete
          </div>
          <p className="mt-1 text-black/60">This is an internal completeness check, not validation against a Registry schema.</p>
        </div>
      ) : issues.length > 0 ? (
        <div className="rounded-xl border border-[#dc2626]/20 bg-[#fef2f2] p-4 text-sm text-[#dc2626]">
          <div className="flex items-center gap-2 font-medium">
            <CircleX size={16} strokeWidth={2} />
            Manual worksheet has {issues.length} blocking gap{issues.length === 1 ? "" : "s"}
          </div>
          <ul className="mt-2 space-y-1 text-black/70">
            {issues.map((err, i) => (
              <li key={i}>
                <button
                  onClick={() => onOpenSubmission(err.supplierId)}
                  className="text-left underline decoration-black/20 underline-offset-2 hover:decoration-black/60"
                  title="Open this supplier's submission"
                >
                  <span className="text-black/85">{err.supplierName}</span>: {err.issue}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[12px] text-black/50">Click an issue to open that supplier&apos;s submission and request a revision.</p>
        </div>
      ) : null}
      {verificationBlockers.length > 0 && (
        <div className="rounded-xl border border-[#b45309]/20 bg-[#fffbeb] p-4 text-sm">
          <div className="flex items-center gap-2 font-medium text-[#b45309]">
            <TriangleAlert size={15} strokeWidth={1.8} />
            Actual-value handoff blocked pending accredited-verifier evidence
          </div>
          <ul className="mt-2 space-y-1 text-[13px] text-black/60">
            {verificationBlockers.map((blocker, i) => <li key={i}>{blocker}</li>)}
          </ul>
        </div>
      )}

      <div className="hairline-grid h-28 rounded-xl border border-black/[0.06]" aria-hidden />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] text-black/35"><StatusDot tone={issues.length === 0 ? "info" : "err"} /> manual mapping aid · not an O3CI upload</div>
        <Button variant="secondary" size="sm" onClick={handleDownload} disabled={noApprovedSubmissions || issues.length > 0 || verificationBlockers.length > 0}><Download size={13} strokeWidth={1.5} /> Download manual-entry CSV</Button>
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
}: {
  decl: Declaration;
  exporter: ExporterDeclState;
  onChanged: (s: ExporterDeclState) => void;
  legalRequired: boolean;
}) {
  const [members, setMembers] = React.useState<TeamMember[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = React.useState(false);
  React.useEffect(() => setMembers(loadTeam()), []);

  const signoffs = (exporter.signoffs ?? []).filter((signoff) => signoff.packageHash === exporter.packageHash);
  const requestedIds = new Set(signoffs.map((s) => s.memberId));
  const available = members.filter((m) => !requestedIds.has(m.id));
  const legalCovered = signoffs.some((s) => getTeamMember(s.memberId)?.dept === "Legal");

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const assign = () => {
    const names = [...selected].map((id) => getTeamMember(id)?.name).filter(Boolean).join(", ");
    try {
      onChanged(requestReportSignoffs(decl.id, [...selected]));
    } catch (error) {
      toast({ message: "Confirmation assignment blocked", detail: error instanceof Error ? error.message : "Generate the current preview first.", tone: "err" });
      return;
    }
    setSelected(new Set());
    toast({ message: "Reviewers assigned locally", detail: `${names || "Selected reviewers"} were not emailed; confirmations are demo-only.`, tone: "info" });
  };

  return (
    <div className="space-y-5">
      <div>
        <Eyebrow>Internal sign-off</Eyebrow>
        <p className="mt-1 max-w-2xl text-sm text-black/45">
          Model internal confirmation in this browser. No preview link, email, identity verification or automatic confirmation is configured.
        </p>
      </div>

      {legalRequired && !legalCovered && (
        <Card warm className="flex items-start gap-3 p-4">
          <TriangleAlert size={16} strokeWidth={1.5} className="mt-0.5 flex-none text-[#b45309]" />
          <p className="text-[12.5px] leading-relaxed text-black/55">
            Anomalies were flagged in this declaration — include <span className="text-black/75">Legal counsel</span> in the sign-off.
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
                    {m?.role ?? "—"} · assigned locally {new Date(s.requestedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </div>
                </div>
                {confirmed ? (
                  <StatusLabel tone="ok" label={`confirmed ${new Date(s.confirmedAt!).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`} glow />
                ) : (
                  <div className="flex flex-none items-center gap-2">
                    <StatusLabel tone="info" label="awaiting confirmation" pulse />
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Demo-only local confirmation; no identity authority is configured."
                      onClick={() => {
                        onChanged(confirmReportSignoff(decl.id, s.memberId));
                        toast({ message: `${m?.name ?? "Reviewer"} marked confirmed locally`, detail: "Not identity-verified or externally delivered.", tone: "info" });
                      }}
                    >
                      Mark confirmed
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onChanged(withdrawReportSignoff(decl.id, s.memberId))}>
                      Withdraw
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
        <p className="mt-1.5 text-[12px] text-black/45">Pick from your local demo team, or add a person. No invitation is sent.</p>
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
            <Plus size={12} strokeWidth={2} /> Add person
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-black/[0.06] pt-4">
          <span className="text-[11px] text-black/40">{selected.size === 0 ? "Select at least one person" : `${selected.size} selected`}</span>
          <Button size="sm" disabled={selected.size === 0} onClick={assign}>
            <ClipboardCheck size={14} strokeWidth={1.5} /> Assign local confirmation
          </Button>
        </div>
      </Card>

      <AddMemberModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        note="They join the browser-local team list. No invitation, preview link or access grant is sent."
        onAdded={(m) => {
          setMembers(loadTeam());
          setSelected((prev) => new Set(prev).add(m.id));
          toast({ message: `${m.name} added locally`, detail: "Selected below; no invitation was sent.", tone: "info" });
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
  const dispatch = exporter.dispatch;
  const allApproved = roll.total > 0 && roll.submissions.every((s) => s.lifecycle === "approved");
  const approved = roll.submissions.filter((s) => s.lifecycle === "approved");
  const issues = React.useMemo(() => manualEntryIssues(approved), [approved]);
  const verificationBlockers = React.useMemo(() => actualValueVerificationBlockers(approved), [approved]);
  const packageStale = exporter.packageHash !== null && exporter.packageHash !== datasetHash(roll.submissions);
  const mappingReady = signoffComplete && allApproved && issues.length === 0 && verificationBlockers.length === 0 && !packageStale;
  const checklist: { key: O3ciChecklistKey; label: string; detail: string; blocked?: boolean }[] = [
    { key: "operator_account", label: "Operator account", detail: "Operator confirms access to its own EU Login and O3CI account." },
    { key: "installation_registered", label: "Installation registered", detail: "Operator confirms installation identity and boundaries in O3CI." },
    { key: "values_entered", label: "Values entered", detail: "Operator manually enters and independently checks worksheet values." },
    { key: "verifier_report_attached", label: "Verifier report attached", detail: "Accredited verifier report is attached in the controlled external workflow.", blocked: verificationBlockers.length > 0 },
  ];

  const downloadWorksheet = () => {
    if (!mappingReady) {
      toast({ message: "Manual worksheet blocked", detail: verificationBlockers[0] ?? issues[0]?.issue ?? "Complete current approval and sign-off gates first.", tone: "err" });
      return;
    }
    downloadFile(`certrace-${decl.id}-o3ci-manual-entry.csv`, buildO3ciManualWorksheet(decl, approved), "text/csv");
    onChanged(recordWorksheetDownload(decl.id));
    toast({ message: "Manual-entry CSV downloaded", detail: "No O3CI upload, email delivery or external submission occurred.", tone: "info" });
  };

  return (
    <div className="space-y-5">
      <Card warm className="p-5">
        <Eyebrow>Manual handoff boundary</Eyebrow>
        <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-black/55">
          Certrace has no official public O3CI write API or upload schema integration. The operator must use its own account and the EU importer or indirect customs representative remains responsible for the annual CBAM declaration. This page records a local checklist only.
        </p>
      </Card>

      {!mappingReady && (
        <Card warm className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <StatusDot tone="warn" />
            <p className="text-sm text-black/55">
              {!signoffComplete
                ? "Local sign-off is incomplete."
                : !allApproved
                  ? "Every submission must be approved before preparing the worksheet."
                  : verificationBlockers.length > 0
                    ? "Actual values require a securely available accredited-verifier report before handoff."
                  : packageStale
                    ? "The browser dataset changed after the draft preview was generated — regenerate it first."
                    : "The manual worksheet has blocking data gaps."}
            </p>
          </div>
          {!signoffComplete && (
            <Button size="sm" variant="ghost" className="flex-none" onClick={() => onNavigate("signoff")}>
              View sign-off <ArrowRight size={13} strokeWidth={1.5} />
            </Button>
          )}
        </Card>
      )}

      {signoffComplete && allApproved && issues.length > 0 && (
        <Card className="border-[#dc2626]/25 p-5">
          <div className="flex items-center gap-2">
            <CircleX size={15} strokeWidth={1.8} className="text-[#dc2626]" />
            <Eyebrow>Manual mapping incomplete</Eyebrow>
          </div>
          <ul className="mt-2.5 space-y-1.5 text-[13px] text-black/65">
            {issues.map((err, i) => (
              <li key={i}>
                <button
                  onClick={() => onOpenSubmission(err.supplierId)}
                  className="text-left underline decoration-black/20 underline-offset-2 hover:decoration-black/60"
                  title="Open this supplier's submission"
                >
                  <span className="text-black/85">{err.supplierName}</span>: {err.issue}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2.5 text-[12px] text-black/45">This is a Certrace completeness check, not a prediction of Registry acceptance.</p>
        </Card>
      )}

      {verificationBlockers.length > 0 && (
        <Card className="border-[#b45309]/25 bg-[#fffbeb] p-5">
          <div className="flex items-center gap-2 text-[#b45309]"><TriangleAlert size={15} strokeWidth={1.8} /><Eyebrow>Actual-value handoff blocked</Eyebrow></div>
          <ul className="mt-2.5 space-y-1 text-[12.5px] text-black/60">{verificationBlockers.map((blocker, index) => <li key={index}>{blocker}</li>)}</ul>
        </Card>
      )}

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm text-[#111]">O3CI manual-entry worksheet</div>
            <p className="mt-1.5 max-w-xl text-[12.5px] text-black/50">CSV mapping aid for manual re-entry. It is not an O3CI upload, official schema, Communication Template or evidence of delivery.</p>
          </div>
          {dispatch.worksheetDownloadedAt && <StatusLabel tone="info" label="downloaded locally" />}
        </div>
        <Button className="mt-3" size="sm" disabled={!mappingReady} onClick={downloadWorksheet}>
          <Download size={13} strokeWidth={1.5} /> Download manual-entry CSV
        </Button>
      </Card>

      <div>
        <Eyebrow>Operator checklist</Eyebrow>
        <p className="mt-1 max-w-2xl text-sm text-black/45">Self-attested local notes only. Certrace cannot observe or validate actions in EU Login, O3CI, a verifier system or a buyer&apos;s records.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {checklist.map((item) => {
          const checked = dispatch.checklist[item.key];
          return (
            <Card key={item.key} className={cn("p-5", checked && "border-[#047857]/20 bg-[#ecfdf5]") }>
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  disabled={!mappingReady || item.blocked}
                  onClick={() => onChanged(setO3ciChecklistItem(decl.id, item.key, !checked))}
                  className={cn("mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-md border", checked ? "border-transparent bg-[#111] text-white" : "border-black/20", (!mappingReady || item.blocked) && "opacity-40")}
                  aria-label={`${checked ? "Clear" : "Mark"} ${item.label}`}
                >
                  {checked && <Check size={12} strokeWidth={2.5} />}
                </button>
                <div>
                  <div className="text-sm text-black/75">{item.label}</div>
                  <p className="mt-1 text-[12px] leading-relaxed text-black/45">{item.detail}</p>
                  {item.blocked && <p className="mt-1 text-[11px] text-[#b45309]">Blocked until the accredited report is available through secure evidence storage.</p>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════ Local activity history ════════════════════════ */
function AuditTrailTab({ roll, exporter }: { roll: ReviewRollup; exporter: ExporterDeclState }) {
  const who = exporterIdentity().contact;
  type Row = { at: number; who: string; text: string };

  const supplierName = (id: string) => roll.submissions.find((s) => s.supplier.id === id)?.supplier.name ?? id;
  const rows: Row[] = [
    ...roll.submissions.flatMap((s) => s.events.map((e) => ({ at: e.at, who: s.supplier.name, text: e.text }))),
    ...Object.entries(exporter.remindersSent ?? {}).flatMap(([supplierId, times]) =>
      times.map((at) => ({ at, who: who, text: `Follow-up noted locally for ${supplierName(supplierId)} — no reminder sent` })),
    ),
    ...(exporter.packageGeneratedAt ? [{ at: exporter.packageGeneratedAt, who: who, text: "Draft calculation preview generated locally" }] : []),
    ...(exporter.signoffs ?? []).filter((signoff) => signoff.packageHash === exporter.packageHash).flatMap((s) => {
      const m = getTeamMember(s.memberId);
      const name = m?.name ?? "Reviewer";
      const out: Row[] = [{ at: s.requestedAt, who: who, text: `Local confirmation assigned to ${name}${m ? ` (${m.role})` : ""}; no invitation sent` }];
      if (s.confirmedAt) out.push({ at: s.confirmedAt, who: name, text: "Marked the draft preview confirmed locally (not identity-verified)" });
      return out;
    }),
    ...(exporter.dispatch.worksheetDownloadedAt ? [{ at: exporter.dispatch.worksheetDownloadedAt, who: who, text: "O3CI manual-entry worksheet downloaded; no external upload occurred" }] : []),
  ].sort((a, b) => b.at - a.at);

  if (rows.length === 0) {
    return <Card className="p-10 text-center text-sm text-black/40">Nothing recorded yet — local engine runs and demo decisions will appear here. This is not an audit ledger.</Card>;
  }

  return (
    <div className="space-y-3">
      <div>
        <Eyebrow>Local activity history</Eyebrow>
        <p className="mt-1 max-w-2xl text-sm text-black/45">Mutable browser-local demo events, newest first. This is not an immutable audit ledger or proof of external delivery.</p>
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
