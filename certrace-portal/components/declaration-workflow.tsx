"use client";

import * as React from "react";
import Link from "next/link";
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
  PenLine,
  TriangleAlert,
  CircleCheck,
  CircleX,
  Users,
  ChevronRight,
  Gauge,
  Calculator,
  History,
  Package,
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
import { Declaration, ORG } from "@/lib/data";
import { getRegulation, getJurisdiction, scope2Treatment, type ResolvedCbamField } from "@/lib/config";
import { downloadPackage, downloadXmlFile } from "@/lib/download";
import { validateForRegistry, buildCbamXml } from "@/lib/cbam-xml";
import {
  sectionsForRequest,
  fieldsForSection,
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
  REVIEWERS,
  getReviewer,
  LIFECYCLE_META,
  EXPORTER,
  type ExporterDeclState,
  type ReviewSubmission,
  type ReviewRollup,
  type DispatchRecipient,
} from "@/lib/exporter-review";
import { computeComplianceFacts, MASS_THRESHOLD_TONNES_PER_YEAR, type ComplianceFacts } from "@/lib/compliance-engine";
import { buildSupplierChapters, buildSignOff, packageSummaryData, packageHistoryData } from "@/lib/package-data";
import { buildIntelligence, type IntelligenceReport } from "@/lib/compliance-intelligence";
import {
  loadChain,
  startChain,
  approveStep,
  requestChangesAtStep,
  skipStep,
  addComment,
  activeSteps,
  currentStep,
  isChainComplete,
  CHAIN_TEMPLATE_META,
  type ChainState,
  type ChainTemplateId,
} from "@/lib/approval-chain";

type Tab ="overview" | "submissions" | "intelligence" | "emissions" | "approval" | "output" | "handoff" | "audit";

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

/* Package data assembly moved to lib/package-data.ts so the Reports page
   generates the exact same package from the exact same dataset. */

/* ════════════════════════════════════════════════════════════
   Declaration compliance workspace (exporter side · post-submission)

   Eight sections replace the old Submissions / Executive Summary / Audit
   Package tabs — see docs/EXPORTER-PORTAL-REDESIGN.md for the architecture:
     Overview                    control tower
     Submissions & Evidence      per-supplier frozen data (kept, extended)
     Compliance Intelligence     Stage 2 — AI judgment, always advisory
     Emissions & Methodology     Stage 1 — the actual regulatory math
     Review & Approval           Stage 4 — configurable internal sign-off chain
     Output Center               Stage 5 — the output fan-out
     Buyer & Authority Handoff   the real O3CI / Communication Template channels
     Audit Trail & Version History — one unified, append-only timeline
   ════════════════════════════════════════════════════════════ */
export function DeclarationWorkflow({ declaration }: { declaration: Declaration }) {
  const reg = getRegulation(declaration.regulation)!;
  const jur = getJurisdiction(declaration.origin)!;

  // exporter + chain state live in localStorage — hydrate after mount to avoid
  // a server/client mismatch, then re-read on focus so a supplier resubmission
  // in another tab shows up here without a backend.
  const [exporter, setExporter] = React.useState<ExporterDeclState>(() => loadExporterState(declaration.id));
  const [chain, setChain] = React.useState<ChainState>(() => loadChain(declaration.id));
  const [mounted, setMounted] = React.useState(false);
  const [tab, setTab] = React.useState<Tab>("overview");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const refresh = React.useCallback(() => {
    setExporter(loadExporterState(declaration.id));
    setChain(loadChain(declaration.id));
  }, [declaration.id]);
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
  const chainComplete = isChainComplete(chain, legalRequired);

  // "the exporter is notified data is ready for review": watch for
  // submissions that arrived since the last read (e.g. a supplier submitted in
  // another tab) and surface it, instead of silently refreshing underneath them.
  const lastSubmittedCount = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (!mounted) return;
    if (lastSubmittedCount.current !== null && roll.submittedCount > lastSubmittedCount.current) {
      const delta = roll.submittedCount - lastSubmittedCount.current;
      toast({ message: `${delta} new submission${delta === 1 ? "" : "s"} ready for review`, detail: "Submissions & Evidence has been updated.", tone: "info" });
    }
    lastSubmittedCount.current = roll.submittedCount;
  }, [mounted, roll.submittedCount]);
  const open = openId ? roll.submissions.find((s) => s.supplier.id === openId) ?? null : null;

  const goTo = (t: Tab) => {
    setTab(t);
    setOpenId(null);
  };

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
          </div>
        </div>
      </div>

      <LifecycleBar roll={roll} dispatched={Boolean(exporter.dispatch.o3ciPushedAt || exporter.dispatch.templateSentAt)} />

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {([
          ["overview", "Overview", Gauge],
          ["submissions", "Submissions & Evidence", Inbox],
          ["intelligence", "Compliance Intelligence", Sparkles],
          ["emissions", "Emissions & Methodology", Calculator],
          ["approval", "Review & Approval", ClipboardCheck],
          ["output", "Output Center", Package],
          ["handoff", "Buyer & Authority", Send],
          ["audit", "Audit Trail", History],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => goTo(key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[11px] uppercase tracking-[0.08em] transition-colors",
              tab === key ? "border-black/25 bg-[#111] text-white" : "border-black/10 text-black/50 hover:border-black/25 hover:text-black",
            )}
          >
            <Icon size={13} strokeWidth={1.5} /> {label}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div key={`${tab}-${openId ?? ""}`} className="ct-enter">
        {!mounted ? (
          <Card className="p-10 text-center text-sm text-black/35">Loading submissions…</Card>
        ) : tab === "overview" ? (
          <OverviewTab decl={declaration} roll={roll} facts={facts} intel={intel} chain={chain} legalRequired={legalRequired} onNavigate={goTo} />
        ) : tab === "submissions" ? (
          open ? (
            <SubmissionReview decl={declaration} sub={open} onChanged={setExporter} />
          ) : (
            <SubmissionsTab decl={declaration} roll={roll} onOpen={(id) => setOpenId(id)} />
          )
        ) : tab === "intelligence" ? (
          <ComplianceIntelligenceTab roll={roll} intel={intel} />
        ) : tab === "emissions" ? (
          <EmissionsMethodologyTab roll={roll} facts={facts} />
        ) : tab === "approval" ? (
          <ReviewApprovalTab decl={declaration} chain={chain} onChanged={setChain} legalRequired={legalRequired} />
        ) : tab === "output" ? (
          <OutputCenterTab decl={declaration} roll={roll} exporter={exporter} onChanged={setExporter} />
        ) : tab === "handoff" ? (
          <BuyerAuthorityHandoffTab decl={declaration} roll={roll} exporter={exporter} onChanged={setExporter} chainComplete={chainComplete} />
        ) : (
          <AuditTrailTab roll={roll} chain={chain} />
        )}
      </div>
    </div>
  );
}

/* ── Lifecycle bar (Collecting → Reviewing → Approved → Dispatched) ──
   "Dispatched" — not "Filed" — because the exporter never files with the
   authority directly; see the Buyer & Authority Handoff tab. */
function LifecycleBar({ roll, dispatched }: { roll: ReviewRollup; dispatched: boolean }) {
  const stages = ["collecting", "reviewing", "approved", "filed"] as const;
  const labels: Record<(typeof stages)[number], string> = { collecting: "Collecting", reviewing: "In review", approved: "Approved", filed: "Dispatched" };
  const activeIdx = stages.indexOf(roll.stage === "filed" && !dispatched ? "approved" : roll.stage);
  return (
    <Card warm className="p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          {stages.map((s, i) => {
            const done = i < activeIdx || (dispatched && s === "filed");
            const current = i === activeIdx && !(dispatched && s === "filed");
            return (
              <React.Fragment key={s}>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.08em]",
                    done ? "bg-[#ecfdf5] text-[#047857]" : current ? "bg-[#111] text-white" : "text-black/35",
                  )}
                >
                  {done && <Check size={11} strokeWidth={2.5} />} {labels[s]}
                </span>
                {i < stages.length - 1 && <span className="hidden h-px w-3 flex-none bg-black/15 sm:block" />}
              </React.Fragment>
            );
          })}
        </div>
        <span className="font-mono text-[11px] text-black/45">
          {roll.approvedCount}/{roll.total} approved · {roll.submittedCount} submitted
        </span>
      </div>
    </Card>
  );
}

/* ════════════════════════ Overview — control tower ════════════════════════ */
function OverviewTab({
  decl,
  roll,
  facts,
  intel,
  chain,
  legalRequired,
  onNavigate,
}: {
  decl: Declaration;
  roll: ReviewRollup;
  facts: ComplianceFacts;
  intel: IntelligenceReport;
  chain: ChainState;
  legalRequired: boolean;
  onNavigate: (t: Tab) => void;
}) {
  const scoreTone = (s: number) => (s >= 85 ? "#047857" : s >= 60 ? "#b45309" : "#dc2626");
  const steps = activeSteps(chain, legalRequired);
  const doneSteps = steps.filter((s) => s.status === "approved" || s.status === "skipped").length;
  const active = currentStep(chain, legalRequired);
  const complete = isChainComplete(chain, legalRequired);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-5">
          <Stat value={<span style={{ color: scoreTone(intel.trustScore) }}>{intel.trustScore}</span>} label="Trust score" />
        </Card>
        <Card className="p-5">
          <Stat value={decl.due} label={decl.dueInDays < 0 ? "was due" : `due in ${decl.dueInDays}d`} />
        </Card>
        <Card className="p-5">
          <Stat value={chain.started ? `${doneSteps}/${steps.length}` : "—"} label="Sign-off steps" />
        </Card>
        <Card className="p-5">
          <Stat value={roll.awaitingCount} label="Suppliers outstanding" />
        </Card>
      </div>

      {roll.submittedCount > 0 && (
        <Card className="p-5">
          <Eyebrow>Estimated CBAM exposure</Eyebrow>
          <div className="mt-2 font-[family-name:var(--font-plex)] text-3xl font-light text-[#111]">
            €{intel.businessImpact.low.toLocaleString("en-US")}–{intel.businessImpact.high.toLocaleString("en-US")}
          </div>
          <p className="mt-1.5 max-w-2xl text-[12px] text-black/45">{intel.businessImpact.note}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <button onClick={() => onNavigate("intelligence")} className="rounded-2xl border border-black/[0.07] bg-white p-5 text-left transition-colors hover:border-black/20">
          <Eyebrow>Compliance intelligence</Eyebrow>
          <p className="mt-2 text-sm text-black/60">{intel.approvalRecommendation.rationale}</p>
          <span className="mt-3 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.08em] text-black/45">
            Review flags <ArrowRight size={12} strokeWidth={1.5} />
          </span>
        </button>
        <button onClick={() => onNavigate("approval")} className="rounded-2xl border border-black/[0.07] bg-white p-5 text-left transition-colors hover:border-black/20">
          <Eyebrow>Review & approval</Eyebrow>
          <p className="mt-2 text-sm text-black/60">
            {!chain.started ? "No sign-off chain started yet." : complete ? "All required sign-offs are complete." : `Waiting on ${active?.label ?? "the next step"}.`}
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.08em] text-black/45">
            Open chain <ArrowRight size={12} strokeWidth={1.5} />
          </span>
        </button>
      </div>

      {roll.awaitingCount > 0 && (
        <Card warm className="flex items-center gap-3 p-4">
          <StatusDot tone="warn" />
          <p className="text-sm text-black/55">
            {roll.awaitingCount} supplier{roll.awaitingCount === 1 ? "" : "s"} {roll.awaitingCount === 1 ? "hasn't" : "haven't"} submitted yet.
          </p>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => onNavigate("submissions")}>
            Go to Submissions
          </Button>
        </Card>
      )}
    </div>
  );
}

/* ════════════════════════ Submissions & Evidence (step 4) ════════════════════════ */
function SubmissionsTab({ decl, roll, onOpen }: { decl: Declaration; roll: ReviewRollup; onOpen: (id: string) => void }) {
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
          Each supplier filled their own Smart Link, the AI checked it, they e-signed and submitted. Click a submission to read the
          data, see the AI summary, and approve it or request a revision.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
        {roll.submissions.map((s) => (
          <SubmissionRow key={s.supplier.id} sub={s} onOpen={() => onOpen(s.supplier.id)} />
        ))}
      </div>
    </div>
  );
}

function SubmissionRow({ sub, onOpen }: { sub: ReviewSubmission; onOpen: () => void }) {
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
        {sub.supplier.critical && <span className="h-1.5 w-1.5 flex-none rounded-full bg-black/40" title="CBAM-critical supplier" />}
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="truncate text-[13px] text-black/75">{sub.supplier.name}</span>
            <span className="font-mono text-[11px] text-black/25">{sub.supplier.ref}</span>
          </span>
          <span className="mt-0.5 flex items-center gap-2 text-[11px] text-black/40">
            <span className="font-mono text-[10px] text-black/35">{sub.supplier.country}</span>
            {sub.supplier.material}
            {sub.submitted && <span className="text-black/30">· v{sub.version}{sub.check ? ` · score ${sub.check.score}` : ""}</span>}
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
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); toast({ message: "Reminder sent", detail: `${sub.supplier.name} nudged to complete their Smart Link.`, tone: "info" }); }}>
            <Bell size={13} strokeWidth={1.5} /> Remind
          </Button>
        )}
      </span>
    </div>
  );
}

/* ════════════════════════ Submission review (steps 5,6,7,9) ════════════════════════ */
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

      {/* Decision (steps 7 / 9) */}
      {showRevision ? (
        <RevisionForm
          decl={decl}
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

/* AI-flagged evidence summary for one submission (step 5) */
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
              {sub.emissions.map((e) => (
                <div key={e.productId} className="flex items-center justify-between rounded-lg border border-black/[0.06] bg-[#fafaf8] px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] text-black/75">{e.productName}</div>
                    <div className="font-mono text-[10px] text-black/40">CN {e.cnCode} · {e.tonnes.toLocaleString("en-US")} t</div>
                  </div>
                  <div className="text-right">
                    <div className="font-[family-name:var(--font-plex)] text-lg font-light text-[#111]">{e.perTonne.toFixed(2)} <span className="text-xs text-black/40">tCO₂e/t</span></div>
                    <div className="font-mono text-[10px] text-black/40">{e.total.toLocaleString("en-US")} tCO₂e total</div>
                  </div>
                </div>
              ))}
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
          {sub.request.products.map((rp) => (
            <div key={rp.product.id} className={cn(sub.request.products.length > 1 && "rounded-xl border border-black/[0.06] bg-[#fafaf8] p-3")}>
              {sub.request.products.length > 1 && <div className="mb-2 text-[11px] text-black/50">{rp.product.name} <span className="font-mono text-[10px] text-black/35">· CN {rp.product.cnCode}</span></div>}
              <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
                {fields.map((f) => (
                  <DataRow key={f.id} label={f.label} value={displayValue(f, rp.product.id)} />
                ))}
              </dl>
            </div>
          ))}
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

/* Assign internal reviewers to look at one submission (step 6) — distinct from
   the declaration-level sign-off chain in Review & Approval. */
function ReviewerPicker({ decl, sub, onChanged }: { decl: Declaration; sub: ReviewSubmission; onChanged: (s: ExporterDeclState) => void }) {
  return (
    <Card warm className="p-5">
      <div className="flex items-center gap-2">
        <Users size={15} strokeWidth={1.5} className="text-black/55" />
        <Eyebrow>Internal reviewers</Eyebrow>
      </div>
      <p className="mt-1.5 text-[12px] text-black/45">Share this submission with the teams who need to sign off — ESG, Compliance, Legal or your verifier. We email them an invite, and they get scoped, read-only access to the source data.</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {REVIEWERS.map((r) => {
          const on = sub.review.reviewers.includes(r.id);
          return (
            <button
              key={r.id}
              onClick={() => {
                onChanged(toggleReviewer(decl.id, sub.supplier.id, r.id));
                if (!on) toast({ message: `${r.name} assigned`, detail: `Notified by email — scoped, read-only access to ${sub.supplier.name}'s submission.`, tone: "info" });
              }}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                on ? "border-black/25 bg-[#f0eee8] text-black/80" : "border-black/10 text-black/50 hover:border-black/25 hover:text-black",
              )}
            >
              <span className={cn("grid h-4 w-4 place-items-center rounded-full", on ? "bg-[#111] text-white" : "border border-black/20")}>{on && <Check size={10} strokeWidth={3} />}</span>
              {r.name} <span className="text-black/35">· {r.role}</span>
            </button>
          );
        })}
      </div>
      {sub.review.reviewers.length > 0 && (
        <p className="mt-2.5 text-[11px] text-[#047857]">
          Shared with {sub.review.reviewers.map((id) => getReviewer(id)?.name).filter(Boolean).join(", ")} — they'll be notified by email.
        </p>
      )}
    </Card>
  );
}

/* Request revision — pick specific fields + docs + a comment (step 7 → writes step 8) */
function RevisionForm({ decl, sub, onCancel, onSubmit }: { decl: Declaration; sub: ReviewSubmission; onCancel: () => void; onSubmit: (p: { fields: string[]; docs: string[]; comment: string }) => void }) {
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
      else for (const rp of sub.request.products) fieldRows.push({ key: valueKey(f.id, rp.product.id), label: sub.request.products.length > 1 ? `${f.label} — ${rp.product.name}` : f.label });
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

/* ════════════════════════ Compliance Intelligence (Stage 2, AI advisory) ════════════════════════ */
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

/* ════════════════════════ Emissions & Methodology (Stage 1, deterministic) ════════════════════════ */
function EmissionsMethodologyTab({ roll, facts }: { roll: ReviewRollup; facts: ComplianceFacts }) {
  const submitted = roll.submissions.filter((s) => s.submitted);
  if (submitted.length === 0) {
    return <Card className="p-10 text-center text-sm text-black/40">No submissions yet — methodology and emissions figures appear once suppliers start submitting.</Card>;
  }
  const scope2 = scope2Treatment(submitted.flatMap((s) => s.request.products.map((rp) => rp.product)));
  const totalCapViolations = Object.values(facts.perSupplier).reduce((a, s) => a + s.capViolations.length, 0);

  return (
    <div className="space-y-5">
      <Card className={cn("flex items-center gap-3 p-4", facts.declarable ? "border-black/[0.08]" : "border-[rgba(180,83,9,0.25)] bg-[#fffbeb]")}>
        <StatusDot tone={facts.declarable ? "ok" : "warn"} />
        <p className="text-sm text-black/60">
          {facts.totalTonnes.toLocaleString("en-US")} t across submitted suppliers {facts.declarable ? "clears" : "is below"} the {MASS_THRESHOLD_TONNES_PER_YEAR}t/year mass threshold — indicative only; the real threshold is assessed on the importer's total annual CBAM imports across every supplier, not one declaration.
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-5"><Stat value={facts.totalGrossTCO2e.toLocaleString("en-US")} label="Gross tCO₂e reported" /></Card>
        <Card className="p-5"><Stat value={facts.totalChargeableTCO2e.toLocaleString("en-US")} label="Chargeable tCO₂e" /></Card>
        <Card className="p-5"><Stat value={`€${facts.totalNetExposureEUR.toLocaleString("en-US")}`} label="Net exposure" /></Card>
        <Card className="p-5"><Stat value={totalCapViolations} label="Cap violations" /></Card>
      </div>

      <Card className="p-0">
        <div className="border-b border-black/[0.06] px-5 py-3"><Eyebrow>Scope 2 (indirect) liability</Eyebrow></div>
        <div className="divide-y divide-black/[0.05] px-5">
          {scope2.map((s) => (
            <div key={s.category} className="flex items-center justify-between py-3 text-[13px] text-black/65">
              <span>{s.category}</span>
              <StatusLabel tone={s.included ? "warn" : "muted"} label={s.included ? "in the bill" : "reported only"} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-black/[0.06] px-5 py-3"><Eyebrow>By supplier</Eyebrow></div>
        <div className="divide-y divide-black/[0.05]">
          {submitted.map((s) => {
            const f = facts.perSupplier[s.supplier.id];
            if (!f) return null;
            const clean = f.capViolations.length === 0 && f.unverifiedActual.length === 0 && f.evidenceGaps.every((g) => !g.required);
            return (
              <div key={s.supplier.id} className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="text-[13px] text-black/75">{s.supplier.name}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-black/40">
                    {f.grossTCO2e.toLocaleString("en-US")} → {f.chargeableTCO2e.toLocaleString("en-US")} tCO₂e chargeable · €{f.netExposureEUR.toLocaleString("en-US")}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {f.capViolations.length > 0 && <Chip tone="err">cap breach</Chip>}
                  {f.unverifiedActual.length > 0 && <Chip tone="warn">unverified actual</Chip>}
                  {f.evidenceGaps.some((g) => g.required) && <Chip tone="warn">evidence gap</Chip>}
                  {clean && <Chip tone="ok">clean</Chip>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ════════════════════════ Review & Approval (Stage 4) ════════════════════════ */
function ReviewApprovalTab({ decl, chain, onChanged, legalRequired }: { decl: Declaration; chain: ChainState; onChanged: (c: ChainState) => void; legalRequired: boolean }) {
  const [comment, setComment] = React.useState("");

  if (!chain.started) {
    return (
      <div className="space-y-5">
        <div>
          <Eyebrow>Start the sign-off chain</Eyebrow>
          <p className="mt-1 max-w-xl text-sm text-black/45">Choose how this organisation approves a regulatory declaration before it's dispatched. Configurable per declaration — comments, e-signature and a full audit history are built in.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(Object.keys(CHAIN_TEMPLATE_META) as ChainTemplateId[]).map((id) => (
            <button key={id} onClick={() => onChanged(startChain(decl.id, id))} className="rounded-2xl border border-black/[0.08] bg-white p-5 text-left transition-colors hover:border-black/25">
              <div className="text-sm text-[#111]">{CHAIN_TEMPLATE_META[id].label}</div>
              <p className="mt-1.5 text-[12.5px] text-black/50">{CHAIN_TEMPLATE_META[id].description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const active = currentStep(chain, legalRequired);
  const complete = isChainComplete(chain, legalRequired);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Eyebrow>{CHAIN_TEMPLATE_META[chain.template].label} chain</Eyebrow>
          <p className="mt-1 text-sm text-black/45">{complete ? "Every required step is signed off." : `Waiting on ${active?.label ?? "…"}.`}</p>
        </div>
        {complete && <StatusLabel tone="ok" label="ready to dispatch" glow />}
      </div>

      <Card className="divide-y divide-black/[0.06] p-0">
        {chain.steps.map((s) => {
          const skippable = s.conditional && !legalRequired && s.status === "pending";
          const isCurrent = active?.role === s.role;
          return (
            <div key={s.role} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid h-9 w-9 flex-none place-items-center rounded-xl",
                      s.status === "approved" ? "bg-[#ecfdf5] text-[#047857]" : s.status === "changes_requested" ? "bg-[#fef2f2] text-[#dc2626]" : s.status === "skipped" ? "bg-black/[0.04] text-black/30" : "border border-black/10 text-black/40",
                    )}
                  >
                    {s.status === "approved" ? <Check size={16} strokeWidth={2} /> : s.status === "changes_requested" ? <CircleX size={16} strokeWidth={1.5} /> : <Users size={16} strokeWidth={1.5} />}
                  </span>
                  <div>
                    <div className="text-sm text-black/80">
                      {s.label} {s.conditional && <span className="ml-1 text-[10px] uppercase tracking-[0.08em] text-black/35">conditional</span>}
                    </div>
                    <div className="mt-0.5 text-[11px] text-black/40">
                      {s.actorName} · {s.actorTitle}
                      {s.at ? ` · ${new Date(s.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}
                    </div>
                  </div>
                </div>
                <StatusLabel tone={s.status === "approved" ? "ok" : s.status === "changes_requested" ? "err" : s.status === "skipped" ? "muted" : "info"} label={s.status.replace("_", " ")} glow={s.status === "approved"} />
              </div>
              {s.comment && <p className="mt-2.5 pl-12 text-[12.5px] text-black/55">“{s.comment}”</p>}
              {isCurrent && s.status === "pending" && (
                <div className="mt-3 flex flex-wrap items-center gap-2 pl-12">
                  <Button size="sm" onClick={() => onChanged(approveStep(decl.id, s.role))}>
                    <Check size={13} strokeWidth={1.5} /> Approve
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => onChanged(requestChangesAtStep(decl.id, s.role, "Changes requested."))}>
                    Request changes
                  </Button>
                  {skippable && (
                    <Button variant="ghost" size="sm" onClick={() => onChanged(skipStep(decl.id, s.role))}>
                      Skip — not triggered
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </Card>

      <Card className="p-5">
        <Eyebrow>Comments</Eyebrow>
        <div className="mt-2.5 space-y-2.5">
          {chain.comments.length === 0 && <p className="text-[12.5px] text-black/40">No comments yet.</p>}
          {chain.comments.map((c) => (
            <div key={c.id} className="text-[12.5px] text-black/60">
              <span className="text-black/75">{c.author}</span> <span className="text-black/35">· {new Date(c.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
              <p className="mt-0.5">{c.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input className={cn(inputClass, "flex-1")} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment for the chain…" />
          <Button
            size="sm"
            disabled={!comment.trim()}
            onClick={() => {
              onChanged(addComment(decl.id, EXPORTER.contact, comment.trim()));
              setComment("");
            }}
          >
            Post
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ════════════════════════ Output Center (Stage 5) ════════════════════════ */
function OutputCenterTab({ decl, roll, exporter, onChanged }: { decl: Declaration; roll: ReviewRollup; exporter: ExporterDeclState; onChanged: (s: ExporterDeclState) => void }) {
  const reg = getRegulation(decl.regulation)!;
  const jur = getJurisdiction(decl.origin)!;
  const approved = roll.submissions.filter((s) => s.lifecycle === "approved");
  const generated = Boolean(exporter.packageGeneratedAt);
  const canGenerate = approved.length > 0;
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
      signOff: buildSignOff(loadChain(decl.id)),
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
        <Eyebrow>Output center</Eyebrow>
        <p className="mt-1 max-w-2xl text-sm text-black/45">One approved dataset, generated into every artifact someone actually needs — collect once, generate everything.</p>
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
            <p className="mt-4 text-sm text-black/45">{canGenerate ? "Approve submissions, then generate the package." : "Approve at least one submission to generate the package."}</p>
            <Button className="mt-4" size="sm" disabled={!canGenerate} onClick={() => onChanged(markPackageGenerated(decl.id))}>
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
              <div className="mt-1 text-sm text-black/45">Feeds the CBAM Registry's O3CI module directly, or hands to a buyer not on it yet — see Buyer & Authority Handoff.</div>
            </div>
            <RegistryXmlPanel decl={decl} approved={approved} refSlug={ref.toLowerCase()} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl border border-black/10 text-black/40"><FileText size={20} strokeWidth={1.5} /></span>
            <p className="mt-4 text-sm text-black/45">{canGenerate ? "Approve submissions, then generate the package to unlock the XML export." : "Approve at least one submission to generate the package."}</p>
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

function RegistryXmlPanel({ decl, approved, refSlug }: { decl: Declaration; approved: ReviewSubmission[]; refSlug: string }) {
  const validation = React.useMemo(() => validateForRegistry(decl, approved), [decl, approved]);

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
          <p className="mt-1 text-black/60">No default values used, all required installation data present.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#dc2626]/20 bg-[#fef2f2] p-4 text-sm text-[#dc2626]">
          <div className="flex items-center gap-2 font-medium">
            <CircleX size={16} strokeWidth={2} />
            Validation failed
          </div>
          <ul className="mt-2 list-inside list-disc space-y-1 text-black/70">
            {validation.errors.map((err, i) => (
              <li key={i}>{err.supplierName}: {err.issue}</li>
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

/* ════════════════════════ Buyer & Authority Handoff (Stage 8) ════════════════════════ */
function BuyerAuthorityHandoffTab({
  decl,
  roll,
  exporter,
  onChanged,
  chainComplete,
}: {
  decl: Declaration;
  roll: ReviewRollup;
  exporter: ExporterDeclState;
  onChanged: (s: ExporterDeclState) => void;
  chainComplete: boolean;
}) {
  const reg = getRegulation(decl.regulation)!;
  const recipients = exporter.recipients;
  const dispatch = exporter.dispatch;
  const readyToDispatch = chainComplete && roll.total > 0 && roll.submissions.every((s) => s.lifecycle === "approved");
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
        <Card warm className="flex items-center gap-3 p-4">
          <StatusDot tone="warn" />
          <p className="text-sm text-black/55">{!chainComplete ? "The internal sign-off chain isn't complete yet — see Review & Approval." : "Every submission must be approved before dispatch."}</p>
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
function AuditTrailTab({ roll, chain }: { roll: ReviewRollup; chain: ChainState }) {
  type Row = { at: number; who: string; text: string };
  const rows: Row[] = [
    ...roll.submissions.flatMap((s) => s.events.map((e) => ({ at: e.at, who: s.supplier.name, text: e.text }))),
    ...chain.steps.filter((s): s is typeof s & { at: number } => s.at !== null).map((s) => ({ at: s.at, who: s.actorName, text: `${s.label}: ${s.status.replace("_", " ")}${s.comment ? ` — "${s.comment}"` : ""}` })),
    ...chain.comments.map((c) => ({ at: c.at, who: c.author, text: `Comment on the sign-off chain: "${c.text}"` })),
  ].sort((a, b) => b.at - a.at);

  if (rows.length === 0) {
    return <Card className="p-10 text-center text-sm text-black/40">Nothing recorded yet — every engine run, AI pass and human decision will appear here as it happens.</Card>;
  }

  return (
    <div className="space-y-3">
      <div>
        <Eyebrow>Audit trail</Eyebrow>
        <p className="mt-1 max-w-2xl text-sm text-black/45">One unified, append-only timeline across every submission and the internal sign-off chain.</p>
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
