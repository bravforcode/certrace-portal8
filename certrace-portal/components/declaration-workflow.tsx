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
import { Declaration, ORG } from "@/lib/data";
import { getRegulation, getJurisdiction, type ResolvedCbamField } from "@/lib/config";
import { downloadPackage, downloadXmlFile } from "@/lib/download";
import { validateForRegistry, buildCbamXml } from "@/lib/cbam-xml";
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
  sendCommunicationTemplate,
  acknowledgeRecipient,
  markPackageGenerated,
  requestReportSignoffs,
  confirmReportSignoff,
  withdrawReportSignoff,
  remindSupplier,
  lastReminderAt,
  LIFECYCLE_META,
  EXPORTER,
  type ExporterDeclState,
  type ReviewSubmission,
  type ReviewRollup,
  type DispatchRecipient,
} from "@/lib/exporter-review";
import { loadTeam, getTeamMember, type TeamMember } from "@/lib/team-store";
import { computeComplianceFacts, type ComplianceFacts } from "@/lib/compliance-engine";
import { buildSupplierChapters, buildSignOff, packageSummaryData, packageHistoryData } from "@/lib/package-data";
import { buildIntelligence, type IntelligenceReport } from "@/lib/compliance-intelligence";

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
                           audit package (PDF) + Registry XML
     3  Internal sign-off  send the report to named people to preview;
                           each confirms before anything leaves the building
     4  Send & export      O3CI push / Communication Template to the EU
                           buyer, registry and verifier + acknowledgements

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
  const facts: ComplianceFacts = React.useMemo(() => computeComplianceFacts(roll), [roll]);
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
  const dispatched = Boolean(exporter.dispatch.o3ciPushedAt || exporter.dispatch.templateSentAt);

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
      sub: generated ? "PDF + XML generated" : roll.allApproved ? "ready to generate" : "needs all approvals",
    },
    {
      key: "signoff",
      label: "Internal sign-off",
      icon: ClipboardCheck,
      locked: !generated,
      done: signoffComplete,
      sub: signoffs.length > 0 ? `${confirmedSignoffs}/${signoffs.length} confirmed` : generated ? "send for confirmation" : "needs the report",
    },
    {
      key: "dispatch",
      label: "Send & export",
      icon: Send,
      locked: !signoffComplete,
      done: dispatched,
      sub: dispatched ? "dispatched" : "O3CI · buyer · verifier",
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
            <Chip tone={declaration.dueInDays < 0 ? "err" : declaration.dueInDays < 21 ? "warn" : "muted"}>due {declaration.due}</Chip>
            <Chip tone="ok">{reg.authority.split("·")[0].trim()}</Chip>
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
          signoffComplete={signoffComplete}
          dispatched={dispatched}
          preflightOk={preflightOk}
          exporter={exporter}
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
          ["audit", "Audit trail", History],
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
          <ComplianceIntelligenceTab roll={roll} intel={intel} />
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
  signoffComplete,
  dispatched,
  preflightOk,
  exporter,
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
  view: View;
  onGo: (v: View) => void;
}) {
  const toReview = roll.counts.submitted + roll.counts.in_review;
  const acked = Object.keys(exporter.dispatch.acknowledgedAt).length;
  const wanted = Object.values(exporter.recipients).filter(Boolean).length;

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
        <span className="text-black/80">Report generated.</span> Send it for internal sign-off.
      </>
    );
    cta = "Send for sign-off";
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
  } else if (!dispatched && !preflightOk) {
    tone = "warn";
    text = (
      <>
        <span className="text-black/80">Registry pre-flight failed.</span> Fix the flagged submissions before anything is sent.
      </>
    );
    cta = "View issues";
    target = "dispatch";
  } else if (!dispatched) {
    tone = "ok";
    text = (
      <>
        <span className="text-black/80">Signed off.</span> Ready to send & export.
      </>
    );
    cta = "Send & export";
    target = "dispatch";
  } else if (acked < wanted) {
    text = (
      <>
        Dispatched — <span className="text-black/80">{acked}/{wanted} recipients</span> acknowledged.
      </>
    );
    cta = "Track acknowledgements";
    target = "dispatch";
  } else {
    tone = "ok";
    text = (
      <>
        <span className="text-black/80">Cycle complete.</span> All recipients acknowledged.
      </>
    );
    cta = "Audit trail";
    target = "audit";
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
      ? "Every supplier submission must be approved before the report can be generated — the package only ever contains verified data."
      : step.key === "signoff"
        ? "Generate the report first — sign-off is a confirmation of the exact package that will be sent."
        : "Internal sign-off must be complete before anything is dispatched — every requested confirmation has to land first.";
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
          Each supplier filled their own Smart Link, the AI checked it, they e-signed and submitted. Open a submission to read the
          data, loop in your internal reviewers, then approve it or request a revision.
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
              toast({ message: "Reminder sent", detail: `${s.supplier.name} nudged by email to complete their Smart Link.`, tone: "info" });
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
        title="Copy Smart Link"
        aria-label="Copy Smart Link"
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
        {copied ? "Copied" : "Copy link"}
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
    onChanged(approveSubmission(decl.id, sub.supplier.id, sub.version));
    toast({ message: "Submission approved", detail: `${sub.supplier.name} · v${sub.version} locked into the compliance dataset.`, tone: "ok" });
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
            {sub.signedBy && <span>signed by {sub.signedBy} ({sub.signedRole})</span>}
            {sub.submittedAt && <span>{new Date(sub.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
          </p>
        </div>
        <StatusLabel tone={meta.tone} label={meta.label} pulse={sub.lifecycle === "in_review"} glow={sub.lifecycle === "approved"} />
      </div>

      {/* state banners */}
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
              <span className="text-black/80">Revision requested.</span> {sub.supplier.name} has been asked to update {sub.review.unlockedFields.length} field{sub.review.unlockedFields.length === 1 ? "" : "s"}{sub.review.unlockedDocs.length ? ` and ${sub.review.unlockedDocs.length} document${sub.review.unlockedDocs.length === 1 ? "" : "s"}` : ""}. Only those unlock on their Smart Link.
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
              <PenLine size={14} strokeWidth={1.5} /> Request revision
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
                const direct = Number(sub.values[valueKey("direct-emissions", e.productId)]) || null;
                const indirect = Number(sub.values[valueKey("indirect-emissions", e.productId)]) || null;
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
                      <div className="font-[family-name:var(--font-plex)] text-lg font-light text-[#111]">{e.perTonne.toFixed(2)} <span className="text-xs text-black/40">tCO₂e/t</span></div>
                      <div className="font-mono text-[10px] text-black/40">{e.total.toLocaleString("en-US")} tCO₂e total</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-black/50">
              <span>Embedded total: <span className="text-black/75">{sub.totalTCO2e.toLocaleString("en-US")} tCO₂e</span></span>
              <span>Documents: {Object.values(sub.docs).filter((d) => d.status === "uploaded").length}/{sub.request.documents.length}</span>
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
        return rp ? `${rp.totalTonnes.toLocaleString("en-US")} t` : "—";
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
                <span className="font-mono text-[10px] text-black/35">{uploaded ? files.map((f) => f.name).join(", ") || "uploaded" : "not attached"}</span>
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
      <p className="mt-1.5 text-[12px] text-black/45">Share this submission with the teams who need to sign off — ESG, Compliance, Legal or your verifier. We email them an invite, and they get scoped, read-only access to the source data.</p>
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
          <Plus size={12} strokeWidth={2} /> Add person
        </button>
      </div>
      {sub.review.reviewers.length > 0 && (
        <p className="mt-2.5 text-[11px] text-[#047857]">
          Shared with {sub.review.reviewers.map((id) => getTeamMember(id)?.name).filter(Boolean).join(", ")} — they'll be notified by email.
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
function ComplianceIntelligenceTab({ roll, intel }: { roll: ReviewRollup; intel: IntelligenceReport }) {
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
          €{intel.businessImpact.low.toLocaleString("en-US")}–{intel.businessImpact.high.toLocaleString("en-US")}
        </div>
        <p className="mt-1.5 max-w-2xl text-[12px] text-black/45">{intel.businessImpact.note}</p>
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
  const generated = Boolean(exporter.packageGeneratedAt);
  const ref = `CTR-${reg.short.replace(/\s/g, "")}-${decl.period}`.replace(/[^A-Za-z0-9-]/g, "");

  const doDownload = async () => {
    await downloadPackage({
      ref,
      regulationShort: reg.short,
      regulationFull: reg.full,
      period: decl.period,
      sector: decl.sector,
      origin: jur.name,
      market: decl.market === "EU" ? "European Union" : decl.market,
      org: EXPORTER.org,
      installationId: ORG.installationId,
      totalEmbedded: roll.reviewedEmissions,
      supplierCount: approved.length,
      carbonPricePaid: decl.carbonPricePaid ?? 0,
      factorSet: jur.factorSet,
      ...packageSummaryData(approved),
      ...packageHistoryData(approved),
      chapters: buildSupplierChapters(approved),
      signOff: buildSignOff(exporter.signoffs ?? []),
    });
    toast({ message: "Package downloaded.", detail: "Full communication & audit package — per-supplier chapters, evidence register, sign-off record and audit trail." });
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
        <Eyebrow>Report package</Eyebrow>
        <p className="mt-1 max-w-2xl text-sm text-black/45">One approved dataset, generated into every artifact you need.</p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-black/[0.06] bg-black/[0.02] px-5 py-3">
          <StatusDot /> <StatusDot /> <StatusDot />
          <span className="ml-2 font-mono text-[11px] text-black/35">certrace · {ref.toLowerCase()}.pdf</span>
          {generated && <span className="ml-auto"><StatusLabel tone="ok" label="generated" glow /></span>}
        </div>
        {generated ? (
          <div className="space-y-5 p-7">
            <div>
              <div className="font-pixel text-[10px] uppercase tracking-[0.2em] text-black/40">Audit & Evidence Package</div>
              <div className="mt-2 font-[family-name:var(--font-plex)] text-2xl font-light text-[#111]">{reg.full}</div>
              <div className="mt-1 text-sm text-black/45">{decl.sector} · {decl.period} · {jur.name} → {decl.market}</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Stat value={roll.reviewedEmissions.toLocaleString("en-US")} label="tCO₂e" />
              <Stat value={`${approved.length}`} label="suppliers" />
              <Stat value={`${roll.avgScore ?? "—"}`} label="avg score" />
            </div>
            <div className="hairline-grid h-28 rounded-xl border border-black/[0.06]" aria-hidden />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] text-black/35"><StatusDot tone="ok" /> sha-256 sealed · audit trail + version history embedded</div>
              <Button variant="secondary" size="sm" onClick={doDownload}><Download size={13} strokeWidth={1.5} /> Download</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl border border-black/10 text-black/40"><FileText size={20} strokeWidth={1.5} /></span>
            <p className="mt-4 text-sm text-black/45">
              Every supplier is approved — generate the sealed package when you're ready.
            </p>
            <Button
              className="mt-4"
              size="sm"
              onClick={() => {
                onChanged(markPackageGenerated(decl.id));
                toast({ message: "Report generated", detail: "Audit package + Registry XML sealed from the approved dataset. Next: internal sign-off.", tone: "ok" });
              }}
            >
              <FileText size={14} strokeWidth={1.5} /> Generate package
            </Button>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-black/[0.06] bg-black/[0.02] px-5 py-3">
          <StatusDot /> <StatusDot /> <StatusDot />
          <span className="ml-2 font-mono text-[11px] text-black/35">certrace · {ref.toLowerCase()}-registry.xml</span>
          {generated && <span className="ml-auto"><StatusLabel tone="ok" label="generated" glow /></span>}
        </div>
        {generated ? (
          <div className="space-y-5 p-7">
            <div>
              <div className="font-pixel text-[10px] uppercase tracking-[0.2em] text-black/40">CBAM Communication Template · O3CI-ready</div>
              <div className="mt-2 font-[family-name:var(--font-plex)] text-2xl font-light text-[#111]">Annex IV data export</div>
              <div className="mt-1 text-sm text-black/45">Feeds the CBAM Registry's O3CI module directly, or hands to a buyer not on it yet — see Send & export.</div>
            </div>
            <RegistryXmlPanel decl={decl} approved={approved} refSlug={ref.toLowerCase()} onOpenSubmission={onOpenSubmission} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl border border-black/10 text-black/40"><FileText size={20} strokeWidth={1.5} /></span>
            <p className="mt-4 text-sm text-black/45">Generating the package also produces the Registry XML export.</p>
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
  const validation = React.useMemo(() => validateForRegistry(decl, approved), [decl, approved]);
  const hardErrors = validation.errors.filter((e) => e.severity === "error");
  const warnings = validation.errors.filter((e) => e.severity === "warning");

  const handleDownload = () => {
    const xmlContent = buildCbamXml(decl, approved);
    downloadXmlFile(refSlug, xmlContent);
    toast({ message: "XML downloaded.", detail: "Ready to push to the CBAM Registry's O3CI module." });
  };

  return (
    <div className="space-y-4">
      {validation.isValid ? (
        <div className="rounded-xl border border-[#047857]/20 bg-[#ecfdf5] p-4 text-sm text-[#047857]">
          <div className="flex items-center gap-2 font-medium">
            <Check size={16} strokeWidth={2} />
            Schema valid for definitive period
          </div>
          <p className="mt-1 text-black/60">All required installation and emissions data present.</p>
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
                  title="Open this supplier's submission"
                >
                  <span className="text-black/85">{err.supplierName}</span>: {err.issue}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[12px] text-black/50">Click an issue to open that supplier's submission and request a revision.</p>
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
        <div className="flex items-center gap-2 text-[11px] text-black/35"><StatusDot tone={validation.isValid ? "ok" : "err"} /> strict schema validation</div>
        <Button variant="secondary" size="sm" onClick={handleDownload} disabled={!validation.isValid}><Download size={13} strokeWidth={1.5} /> Download XML</Button>
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
        <Eyebrow>Internal sign-off</Eyebrow>
        <p className="mt-1 max-w-2xl text-sm text-black/45">
          Send the report for confirmation before it goes out. Each person gets a read-only preview link, and confirmations are recorded automatically.
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
                    {m?.role ?? "—"} · preview sent {new Date(s.requestedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
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
                      title="Demo: records the confirmation that would arrive from their preview link."
                      onClick={() => {
                        onChanged(confirmReportSignoff(decl.id, s.memberId));
                        toast({ message: `${m?.name ?? "Reviewer"} confirmed`, detail: "Their confirmation is on the record and embedded in the package.", tone: "ok" });
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
        <p className="mt-1.5 text-[12px] text-black/45">Pick from your team, or add a new person — they'll appear under Team & seats too.</p>
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
          <Button size="sm" disabled={selected.size === 0} onClick={send}>
            <Send size={14} strokeWidth={1.5} /> Send for confirmation
          </Button>
        </div>
      </Card>

      <AddMemberModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        note="They join your team list and can be sent this report to confirm — an emailed, read-only preview of exactly what will be dispatched."
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
  const reg = getRegulation(decl.regulation)!;
  const recipients = exporter.recipients;
  const dispatch = exporter.dispatch;
  const allApproved = roll.total > 0 && roll.submissions.every((s) => s.lifecycle === "approved");
  // The Registry would reject non-conforming data, so dispatch runs the same
  // pre-flight the XML export does — a hard error here blocks the push.
  const approved = roll.submissions.filter((s) => s.lifecycle === "approved");
  const validation = React.useMemo(() => validateForRegistry(decl, approved), [decl, approved]);
  const hardErrors = validation.errors.filter((e) => e.severity === "error");
  const readyToDispatch = signoffComplete && allApproved && validation.isValid;
  const dispatched = Boolean(dispatch.o3ciPushedAt || dispatch.templateSentAt);

  const targets: { key: DispatchRecipient; icon: typeof Building2; title: string; to: string; desc: string }[] = [
    { key: "buyer", icon: Building2, title: "EU buyer / importer", to: "procurement@eu-importer.example", desc: "The declarant who actually files with the CBAM Registry." },
    { key: "authority", icon: Landmark, title: reg.authority, to: "O3CI · CBAM Registry", desc: "Reached via the O3CI push below, not a direct portal login." },
    { key: "verifier", icon: BadgeCheck, title: "Accredited verifier", to: "TÜV SÜD · auditor portal", desc: "Scoped source-data access — no email attachments." },
  ];

  return (
    <div className="space-y-5">
      <Card warm className="p-5">
        <Eyebrow>Why this looks different</Eyebrow>
        <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-black/55">
          Certrace never files with the CBAM authority directly — only the EU buyer's Authorised CBAM Declarant can do that. What actually reaches the regulator is either a push into the CBAM Registry's <span className="text-black/75">O3CI</span> module (so any declarant holding your EORI reference can pull the data straight in) or the official <span className="text-black/75">Communication Template</span> sent to a buyer who isn't on O3CI yet. Filing itself always happens on the buyer's side.
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
                  : "The dataset has blocking Registry issues — fix them before anything is sent."}
            </p>
          </div>
          {!signoffComplete && (
            <Button size="sm" variant="ghost" className="flex-none" onClick={() => onNavigate("signoff")}>
              View sign-off <ArrowRight size={13} strokeWidth={1.5} />
            </Button>
          )}
        </Card>
      )}

      {/* Same pre-flight the Registry runs — a hard error means the push would bounce. */}
      {signoffComplete && allApproved && hardErrors.length > 0 && (
        <Card className="border-[#dc2626]/25 p-5">
          <div className="flex items-center gap-2">
            <CircleX size={15} strokeWidth={1.8} className="text-[#dc2626]" />
            <Eyebrow>Registry pre-flight failed</Eyebrow>
          </div>
          <ul className="mt-2.5 space-y-1.5 text-[13px] text-black/65">
            {hardErrors.map((err, i) => (
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
          <p className="mt-2.5 text-[12px] text-black/45">Click an issue to open the submission — request a revision there, and dispatch unlocks once the resubmission passes.</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[#111]">Push to CBAM Registry (O3CI)</div>
            {dispatch.o3ciPushedAt && <StatusLabel tone="ok" label="pushed" glow />}
          </div>
          <p className="mt-1.5 text-[12.5px] text-black/50">Uploads the approved installation + emissions dataset in the Registry's own schema.</p>
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
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[#111]">Send Communication Template</div>
            {dispatch.templateSentAt && <StatusLabel tone="ok" label="sent" glow />}
          </div>
          <p className="mt-1.5 text-[12.5px] text-black/50">Annex IV-aligned template, for buyers not using O3CI.</p>
          <Button
            className="mt-3"
            size="sm"
            variant="secondary"
            disabled={!readyToDispatch || Boolean(dispatch.templateSentAt)}
            onClick={() => {
              onChanged(sendCommunicationTemplate(decl.id));
              toast({ message: "Communication Template sent", detail: "Delivered to the buyer's compliance team.", tone: "ok" });
            }}
          >
            <FileText size={13} strokeWidth={1.5} /> {dispatch.templateSentAt ? `Sent ${new Date(dispatch.templateSentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "Send now"}
          </Button>
        </Card>
      </div>

      <div>
        <Eyebrow>Acknowledgement</Eyebrow>
        <p className="mt-1 max-w-2xl text-sm text-black/45">The real end state — confirmation a recipient actually received the data, not just that it was sent.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {targets.map((t) => {
          const Icon = t.icon;
          const on = recipients[t.key];
          const ack = dispatch.acknowledgedAt[t.key];
          return (
            <div key={t.key} className={cn("rounded-2xl border p-5", on ? "border-black/20 bg-[#f0eee8]" : "border-black/[0.07] bg-white")}>
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-black/10 text-black/60"><Icon size={18} strokeWidth={1.5} /></span>
                <button
                  onClick={() => onChanged(persistRecipients(decl.id, { ...recipients, [t.key]: !on }))}
                  className={cn("grid h-5 w-5 place-items-center rounded-full border", on ? "border-transparent bg-[#111] text-white" : "border-black/15")}
                >
                  {on && <Check size={12} strokeWidth={2} />}
                </button>
              </div>
              <div className="mt-4 text-sm text-[#111]">{t.title}</div>
              <div className="mt-0.5 font-mono text-[11px] text-black/40">{t.to}</div>
              <p className="mt-2 text-[12px] leading-relaxed text-black/45">{t.desc}</p>
              {on &&
                (ack ? (
                  <span className="mt-2 block"><StatusLabel tone="ok" label={`acknowledged ${new Date(ack).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`} glow /></span>
                ) : (
                  <Button variant="ghost" size="sm" className="mt-2" disabled={!dispatched} onClick={() => onChanged(acknowledgeRecipient(decl.id, t.key))}>
                    Mark acknowledged
                  </Button>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════ Audit Trail & Version History ════════════════════════ */
function AuditTrailTab({ roll, exporter }: { roll: ReviewRollup; exporter: ExporterDeclState }) {
  type Row = { at: number; who: string; text: string };
  const recipientLabel: Record<DispatchRecipient, string> = { buyer: "EU buyer / importer", authority: "EU CBAM Registry", verifier: "Accredited verifier" };

  const supplierName = (id: string) => roll.submissions.find((s) => s.supplier.id === id)?.supplier.name ?? id;
  const rows: Row[] = [
    ...roll.submissions.flatMap((s) => s.events.map((e) => ({ at: e.at, who: s.supplier.name, text: e.text }))),
    ...Object.entries(exporter.remindersSent ?? {}).flatMap(([supplierId, times]) =>
      times.map((at) => ({ at, who: EXPORTER.contact, text: `Reminder emailed to ${supplierName(supplierId)} — Smart Link still awaiting submission` })),
    ),
    ...(exporter.packageGeneratedAt ? [{ at: exporter.packageGeneratedAt, who: EXPORTER.contact, text: "Report package generated — audit PDF + Registry XML sealed from the approved dataset" }] : []),
    ...(exporter.signoffs ?? []).flatMap((s) => {
      const m = getTeamMember(s.memberId);
      const name = m?.name ?? "Reviewer";
      const out: Row[] = [{ at: s.requestedAt, who: EXPORTER.contact, text: `Report preview sent to ${name}${m ? ` (${m.role})` : ""} for confirmation` }];
      if (s.confirmedAt) out.push({ at: s.confirmedAt, who: name, text: "Confirmed the report — sign-off recorded in the package" });
      return out;
    }),
    ...(exporter.dispatch.o3ciPushedAt ? [{ at: exporter.dispatch.o3ciPushedAt, who: EXPORTER.contact, text: "Pushed to the CBAM Registry's O3CI module" }] : []),
    ...(exporter.dispatch.templateSentAt ? [{ at: exporter.dispatch.templateSentAt, who: EXPORTER.contact, text: "Communication Template sent to the buyer" }] : []),
    ...Object.entries(exporter.dispatch.acknowledgedAt).map(([key, at]) => ({
      at: at as number,
      who: recipientLabel[key as DispatchRecipient],
      text: "Acknowledged receipt of the declaration data",
    })),
  ].sort((a, b) => b.at - a.at);

  if (rows.length === 0) {
    return <Card className="p-10 text-center text-sm text-black/40">Nothing recorded yet — every engine run, AI pass and human decision will appear here as it happens.</Card>;
  }

  return (
    <div className="space-y-3">
      <div>
        <Eyebrow>Audit trail</Eyebrow>
        <p className="mt-1 max-w-2xl text-sm text-black/45">One unified, append-only timeline — supplier submissions, internal sign-offs and every dispatch, newest first.</p>
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
