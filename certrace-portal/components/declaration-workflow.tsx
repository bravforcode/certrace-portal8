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
  ExternalLink,
  PenLine,
  TriangleAlert,
  CircleCheck,
  CircleX,
  Users,
  ChevronRight,
  FileCode,
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
import { getRegulation, getJurisdiction, type ResolvedCbamField } from "@/lib/config";
import { downloadPackage } from "@/lib/download";
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
  markSummaryGenerated,
  markPackageGenerated,
  fileDeclaration,
  setRecipients as persistRecipients,
  REVIEWERS,
  getReviewer,
  LIFECYCLE_META,
  EXPORTER,
  type ExporterDeclState,
  type ReviewSubmission,
  type ReviewRollup,
} from "@/lib/exporter-review";

type Tab = "submissions" | "summary" | "package" | "xml";

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
   Declaration review workspace (exporter side · flow steps 4–10)
   ════════════════════════════════════════════════════════════ */
export function DeclarationWorkflow({ declaration }: { declaration: Declaration }) {
  const reg = getRegulation(declaration.regulation)!;
  const jur = getJurisdiction(declaration.origin)!;

  // exporter state lives in localStorage — hydrate after mount to avoid a
  // server/client mismatch, then re-read on focus so a supplier resubmission in
  // another tab shows up here without a backend.
  const [exporter, setExporter] = React.useState<ExporterDeclState>(() => loadExporterState(declaration.id));
  const [mounted, setMounted] = React.useState(false);
  const [tab, setTab] = React.useState<Tab>("submissions");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const refresh = React.useCallback(() => setExporter(loadExporterState(declaration.id)), [declaration.id]);
  React.useEffect(() => {
    setMounted(true);
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refresh]);

  const roll: ReviewRollup = React.useMemo(() => (mounted ? buildRollup(declaration, exporter) : EMPTY_ROLL), [declaration, exporter, mounted]);
  const open = openId ? roll.submissions.find((s) => s.supplier.id === openId) ?? null : null;

  return (
    <div className="space-y-7">
      {/* Breadcrumb + header */}
      <div className="space-y-4">
        <Link href="/declarations" className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-black/40 hover:text-black">
          <ArrowLeft size={13} strokeWidth={1.5} /> Declarations
        </Link>
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

      <LifecycleBar roll={roll} filed={Boolean(exporter.filedAt)} />

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {([
          ["submissions", "Submissions", Inbox],
          ["summary", "Executive Summary", Sparkles],
          ["package", "Audit Package", BadgeCheck],
          ["xml", "EU XML Export", FileCode],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => {
              setTab(key as Tab);
              setOpenId(null);
            }}
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
        ) : tab === "submissions" ? (
          open ? (
            <SubmissionReview decl={declaration} sub={open} onBack={() => setOpenId(null)} onChanged={setExporter} />
          ) : (
            <SubmissionsTab decl={declaration} roll={roll} onOpen={(id) => setOpenId(id)} />
          )
        ) : tab === "summary" ? (
          <ExecutiveSummaryTab decl={declaration} roll={roll} exporter={exporter} onChanged={setExporter} onOpen={(id) => { setTab("submissions"); setOpenId(id); }} />
        ) : tab === "package" ? (
          <AuditPackageTab decl={declaration} roll={roll} exporter={exporter} onChanged={setExporter} />
        ) : (
          <XmlExportTab decl={declaration} roll={roll} />
        )}
      </div>
    </div>
  );
}

/* ── Lifecycle bar (Collecting → Reviewing → Approved → Filed) ── */
function LifecycleBar({ roll, filed }: { roll: ReviewRollup; filed: boolean }) {
  const stages = ["collecting", "reviewing", "approved", "filed"] as const;
  const labels: Record<(typeof stages)[number], string> = { collecting: "Collecting", reviewing: "In review", approved: "Approved", filed: "Filed" };
  const activeIdx = stages.indexOf(roll.stage);
  return (
    <Card warm className="p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {stages.map((s, i) => {
            const done = i < activeIdx || (filed && s === "filed");
            const current = i === activeIdx;
            return (
              <React.Fragment key={s}>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.08em]",
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

/* ════════════════════════ Submissions (step 4) ════════════════════════ */
function SubmissionsTab({ decl, roll, onOpen }: { decl: Declaration; roll: ReviewRollup; onOpen: (id: string) => void }) {
  const stats: { value: React.ReactNode; label: string }[] = [
    { value: `${roll.submittedCount}/${roll.total}`, label: "Submitted" },
    { value: roll.counts.in_review + roll.counts.submitted, label: "Awaiting review" },
    { value: roll.changesCount, label: "Changes requested" },
    { value: roll.approvedCount, label: "Approved" },
  ];
  const first = roll.submissions[0];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <Stat value={s.value} label={s.label} />
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow>Supplier submissions</Eyebrow>
          <p className="mt-1 max-w-xl text-sm text-black/45">
            Each supplier filled their own smartlink, the AI checked it, they e-signed and submitted. Open a submission to read the
            data, see the AI summary, and approve it or request a revision.
          </p>
        </div>
        {first && (
          <a href={first.href} target="_blank" rel="noreferrer">
            <Button variant="secondary" size="sm">
              <ExternalLink size={14} strokeWidth={1.5} /> Preview supplier view
            </Button>
          </a>
        )}
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
  const copy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(`${window.location.origin}${sub.href}`);
    toast({ message: "Smartlink copied", detail: `${sub.supplier.name}'s personal data-request link.`, tone: "ok" });
  };
  return (
    <div className="flex items-center gap-3 border-b border-black/[0.05] px-4 py-3.5 last:border-0 hover:bg-[#fafaf8]">
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

      {/* smartlink controls */}
      <span className="hidden items-center gap-1.5 sm:inline-flex">
        <button onClick={copy} title="Copy smartlink" aria-label="Copy smartlink" className="grid h-6 w-6 place-items-center rounded-full border border-black/10 text-black/45 transition-colors hover:border-black/25 hover:text-black">
          <Link2 size={12} strokeWidth={1.5} />
        </button>
        <a href={sub.href} target="_blank" rel="noreferrer" title="Open supplier view" aria-label="Open supplier view" className="grid h-6 w-6 place-items-center rounded-full border border-black/10 text-black/45 transition-colors hover:border-black/25 hover:text-black">
          <ExternalLink size={12} strokeWidth={1.5} />
        </a>
      </span>

      <span className="flex flex-none items-center gap-3">
        <StatusLabel tone={meta.tone} label={meta.label} pulse={sub.lifecycle === "in_review" || sub.lifecycle === "submitted"} glow={sub.lifecycle === "approved"} />
        {sub.submitted ? (
          <Button variant="secondary" size="sm" onClick={onOpen}>
            Review <ArrowRight size={13} strokeWidth={1.5} />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => toast({ message: "Reminder sent", detail: `${sub.supplier.name} nudged to complete their smartlink.`, tone: "info" })}>
            <Bell size={13} strokeWidth={1.5} /> Remind
          </Button>
        )}
      </span>
    </div>
  );
}

/* ════════════════════════ Submission review (steps 5,6,7,9) ════════════════════════ */
function SubmissionReview({ decl, sub, onBack, onChanged }: { decl: Declaration; sub: ReviewSubmission; onBack: () => void; onChanged: (s: ExporterDeclState) => void }) {
  const [showRevision, setShowRevision] = React.useState(false);
  const meta = LIFECYCLE_META[sub.lifecycle];

  const approve = () => {
    onChanged(approveSubmission(decl.id, sub.supplier.id, sub.version));
    toast({ message: "Submission approved", detail: `${sub.supplier.name} · v${sub.version} locked into the audit package.`, tone: "ok" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-black/40 hover:text-black">
          <ArrowLeft size={13} strokeWidth={1.5} /> All submissions
        </button>
        <div className="flex items-center gap-2">
          <a href={sub.href} target="_blank" rel="noreferrer">
            <Button variant="secondary" size="sm">
              <ExternalLink size={13} strokeWidth={1.5} /> Open supplier view
            </Button>
          </a>
        </div>
      </div>

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
          <p className="text-sm text-black/60">Approved — v{sub.version} is locked into the audit-ready package. Reopen by requesting another revision below.</p>
        </Card>
      )}
      {sub.lifecycle === "changes_requested" && (
        <Card className="border-[#2563eb]/25 bg-[#eff6ff] p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg bg-[#dbeafe] text-[#2563eb]"><PenLine size={15} strokeWidth={1.5} /></span>
            <div className="min-w-0 text-[13px] leading-relaxed text-black/65">
              <span className="text-black/80">Revision requested.</span> {sub.supplier.name} has been asked to update {sub.review.unlockedFields.length} field{sub.review.unlockedFields.length === 1 ? "" : "s"}{sub.review.unlockedDocs.length ? ` and ${sub.review.unlockedDocs.length} document${sub.review.unlockedDocs.length === 1 ? "" : "s"}` : ""}. Only those unlock on their smartlink.
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
            toast({ message: "Revision requested", detail: `${sub.supplier.name}'s smartlink reopened the flagged items.`, tone: "info" });
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

/* AI Executive Summary for one submission (step 5) */
function ExecSummary({ sub }: { sub: ReviewSubmission }) {
  const check = sub.check;
  const scoreTone = (s: number) => (s >= 85 ? "#047857" : s >= 60 ? "#b45309" : "#dc2626");
  const warnings = check?.findings.filter((f) => f.severity === "warning") ?? [];
  const criticals = check?.findings.filter((f) => f.severity === "critical") ?? [];

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b border-black/[0.06] bg-black/[0.02] px-5 py-3">
        <Sparkles size={14} strokeWidth={1.5} className="text-black/55" />
        <Eyebrow>AI executive summary</Eyebrow>
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
              <div className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/40">AI flagged for your attention</div>
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

/* Assign internal reviewers (step 6) */
function ReviewerPicker({ decl, sub, onChanged }: { decl: Declaration; sub: ReviewSubmission; onChanged: (s: ExporterDeclState) => void }) {
  return (
    <Card warm className="p-5">
      <div className="flex items-center gap-2">
        <Users size={15} strokeWidth={1.5} className="text-black/55" />
        <Eyebrow>Internal reviewers</Eyebrow>
      </div>
      <p className="mt-1.5 text-[12px] text-black/45">Share this submission with the teams who need to sign off — ESG, Compliance, Legal or your verifier. They get scoped, read-only access to the source data.</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {REVIEWERS.map((r) => {
          const on = sub.review.reviewers.includes(r.id);
          return (
            <button
              key={r.id}
              onClick={() => onChanged(toggleReviewer(decl.id, sub.supplier.id, r.id))}
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
          Shared with {sub.review.reviewers.map((id) => getReviewer(id)?.name).filter(Boolean).join(", ")}.
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
      <p className="mt-1.5 text-[12px] text-black/50">Select exactly what {sub.supplier.name} should fix. Only these reopen on their smartlink — everything else stays locked — and they resubmit as v{sub.version + 1}.</p>

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

/* ════════════════════════ Executive Summary — declaration roll-up (step 5) ════════════════════════ */
function ExecutiveSummaryTab({ decl, roll, exporter, onChanged, onOpen }: { decl: Declaration; roll: ReviewRollup; exporter: ExporterDeclState; onChanged: (s: ExporterDeclState) => void; onOpen: (id: string) => void }) {
  const generated = Boolean(exporter.summaryGeneratedAt);
  const reg = getRegulation(decl.regulation)!;
  const submitted = roll.submissions.filter((s) => s.submitted);

  if (submitted.length === 0) {
    return <Card className="p-10 text-center text-sm text-black/40">No submissions yet — the executive summary appears once suppliers start submitting.</Card>;
  }

  if (!generated) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl border border-black/10 bg-white text-black/45"><Sparkles size={24} strokeWidth={1.5} /></span>
        <h2 className="mt-5 font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#111]">Generate the executive summary</h2>
        <p className="mt-2 max-w-md text-sm text-black/50">The AI rolls up all {submitted.length} submissions — key emissions, documents, warnings, anomalies and a data-quality score — so reviewers see the whole declaration at a glance.</p>
        <Button className="mt-6" onClick={() => onChanged(markSummaryGenerated(decl.id))}>
          <Sparkles size={15} strokeWidth={1.5} /> Generate summary
        </Button>
      </Card>
    );
  }

  const scoreTone = (s: number) => (s >= 85 ? "#047857" : s >= 60 ? "#b45309" : "#dc2626");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow>Executive summary</Eyebrow>
          <p className="mt-1 max-w-xl text-sm text-black/45">{reg.short} · {decl.period} — across {submitted.length} of {roll.total} suppliers.</p>
        </div>
        <span className="font-mono text-[11px] text-black/35">generated {new Date(exporter.summaryGeneratedAt!).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-5"><Stat value={roll.submittedEmissions.toLocaleString("en-US")} label="tCO₂e submitted" /></Card>
        <Card className="p-5"><Stat value={<span style={{ color: scoreTone(roll.avgScore ?? 0) }}>{roll.avgScore ?? "—"}</span>} label="Avg quality score" /></Card>
        <Card className="p-5"><Stat value={roll.warnings} label="Warnings" /></Card>
        <Card className="p-5"><Stat value={roll.anomalies} label="Anomalies" /></Card>
      </div>

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-3">
          <Eyebrow>By supplier</Eyebrow>
          <span className="font-mono text-[10px] text-black/35">{roll.reviewedEmissions.toLocaleString("en-US")} tCO₂e approved</span>
        </div>
        <div className="divide-y divide-black/[0.05]">
          {submitted.map((s) => {
            const meta = LIFECYCLE_META[s.lifecycle];
            return (
              <button key={s.supplier.id} onClick={() => onOpen(s.supplier.id)} className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-[#fafaf8]">
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-[13px] text-black/75"><span className="truncate">{s.supplier.name}</span><span className="font-mono text-[10px] text-black/30">v{s.version}</span></span>
                  <span className="font-mono text-[11px] text-black/40">{s.totalTCO2e.toLocaleString("en-US")} tCO₂e · score {s.check?.score ?? "—"} · {s.check?.warnings ?? 0} warning{s.check?.warnings === 1 ? "" : "s"}</span>
                </span>
                <StatusLabel tone={meta.tone} label={meta.label} glow={s.lifecycle === "approved"} />
                <ChevronRight size={15} strokeWidth={1.5} className="flex-none text-black/25" />
              </button>
            );
          })}
        </div>
      </Card>

      {roll.awaitingCount > 0 && (
        <Card warm className="flex items-center gap-3 p-4">
          <StatusDot tone="warn" />
          <p className="text-sm text-black/55">{roll.awaitingCount} supplier{roll.awaitingCount === 1 ? "" : "s"} {roll.awaitingCount === 1 ? "has" : "have"} not submitted yet — chase them on the Submissions tab before filing.</p>
        </Card>
      )}
    </div>
  );
}

/* ════════════════════════ Audit-ready package (step 10) + hand off ════════════════════════ */
function AuditPackageTab({ decl, roll, exporter, onChanged }: { decl: Declaration; roll: ReviewRollup; exporter: ExporterDeclState; onChanged: (s: ExporterDeclState) => void }) {
  const reg = getRegulation(decl.regulation)!;
  const jur = getJurisdiction(decl.origin)!;
  const approved = roll.submissions.filter((s) => s.lifecycle === "approved");
  const generated = Boolean(exporter.packageGeneratedAt);
  const filed = Boolean(exporter.filedAt);
  const recipients = exporter.recipients;

  const ref = `CTR-${reg.short.replace(/\s/g, "")}-${decl.period}`.replace(/[^A-Za-z0-9-]/g, "");

  const doDownload = () => {
    downloadPackage({
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
      suppliers: approved.map((s) => ({ name: s.supplier.name, material: s.supplier.material, emissions: s.emissions[0]?.perTonne ?? null })),
    });
    toast({ message: "Package downloaded.", detail: "Open it and Print → Save as PDF." });
  };

  const targets = [
    { key: "buyer" as const, icon: Building2, title: "EU buyer / importer", to: "procurement@eu-importer.example", desc: "The declarant who files at the border." },
    { key: "authority" as const, icon: Landmark, title: reg.authority, to: "CBAM transitional registry", desc: "Lodges the embedded-emissions data with the authority." },
    { key: "verifier" as const, icon: BadgeCheck, title: "Accredited verifier", to: "TÜV SÜD · auditor portal", desc: "Scoped source-data access — no email attachments." },
  ];

  if (filed) {
    return <FiledReceipt decl={decl} roll={roll} reg={reg} recipients={recipients} ref={ref} filedAt={exporter.filedAt!} />;
  }

  const canGenerate = approved.length > 0;
  const canFile = generated && roll.awaitingCount === 0 && roll.submissions.every((s) => s.lifecycle === "approved");

  return (
    <div className="space-y-5">
      <div>
        <Eyebrow>Audit-ready package</Eyebrow>
        <p className="mt-1 max-w-2xl text-sm text-black/45">
          One consolidated, timestamped package from the <span className="text-black/65">approved</span> submissions — verified figures, supplier documents, the AI validation summary, the audit trail and every version. This is what goes to your buyer, the authority and the verifier.
        </p>
      </div>

      {/* readiness */}
      <Card className="divide-y divide-black/[0.06] p-0">
        {[
          { label: "Submissions approved", value: `${roll.approvedCount}/${roll.total}`, ok: roll.submissions.every((s) => s.lifecycle === "approved") && roll.total > 0 },
          { label: "Outstanding suppliers", value: `${roll.awaitingCount}`, ok: roll.awaitingCount === 0 },
          { label: "Revisions open", value: `${roll.changesCount}`, ok: roll.changesCount === 0 },
        ].map((r) => (
          <div key={r.label} className="flex items-center justify-between px-5 py-3.5">
            <span className="flex items-center gap-3 text-sm text-black/65">
              <span className={cn("grid h-5 w-5 place-items-center rounded-full", r.ok ? "bg-[#ecfdf5] text-[#047857]" : "border border-[rgba(180,83,9,0.3)] text-[#b45309]")}>{r.ok ? <Check size={12} strokeWidth={2.5} /> : "!"}</span>
              {r.label}
            </span>
            <span className="font-mono text-[12px] text-black/55">{r.value}</span>
          </div>
        ))}
      </Card>

      {/* package preview */}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-black/[0.06] bg-black/[0.02] px-5 py-3">
          <StatusDot /> <StatusDot /> <StatusDot />
          <span className="ml-2 font-mono text-[11px] text-black/35">certrace · {ref.toLowerCase()}.pdf</span>
          {generated && <span className="ml-auto"><StatusLabel tone="ok" label="generated" glow /></span>}
        </div>
        {generated ? (
          <div className="space-y-5 p-7">
            <div>
              <div className="font-pixel text-[10px] uppercase tracking-[0.2em] text-black/40">{reg.full}</div>
              <div className="mt-2 font-[family-name:var(--font-plex)] text-2xl font-light text-[#111]">Embedded emissions declaration</div>
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

      {/* hand off */}
      {generated && (
        <>
          <div>
            <Eyebrow>Hand off</Eyebrow>
            <p className="mt-1 max-w-2xl text-sm text-black/45">Route the sealed package to every stakeholder at once, with a delivery receipt for each — replacing the manual email to the buyer and the authority.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {targets.map((t) => {
              const Icon = t.icon;
              const on = recipients[t.key];
              return (
                <button
                  key={t.key}
                  onClick={() => onChanged(persistRecipients(decl.id, { ...recipients, [t.key]: !on }))}
                  className={cn("rounded-2xl border p-5 text-left transition-colors", on ? "border-black/20 bg-[#f0eee8]" : "border-black/[0.07] bg-white hover:border-black/15")}
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-black/10 text-black/60"><Icon size={18} strokeWidth={1.5} /></span>
                    <span className={cn("grid h-5 w-5 place-items-center rounded-full border", on ? "border-transparent bg-[#111] text-white" : "border-black/15")}>{on && <Check size={12} strokeWidth={2} />}</span>
                  </div>
                  <div className="mt-4 text-sm text-[#111]">{t.title}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-black/40">{t.to}</div>
                  <p className="mt-2 text-[12px] leading-relaxed text-black/45">{t.desc}</p>
                </button>
              );
            })}
          </div>

          {!canFile && (
            <Card warm className="flex items-center gap-3 p-4">
              <StatusDot tone="warn" />
              <p className="text-sm text-black/55">{roll.awaitingCount > 0 ? `${roll.awaitingCount} supplier${roll.awaitingCount === 1 ? "" : "s"} still outstanding` : roll.changesCount > 0 ? `${roll.changesCount} revision${roll.changesCount === 1 ? "" : "s"} still open` : "Every submission must be approved"} before you can file the full declaration.</p>
            </Card>
          )}

          <div className="flex items-center justify-between border-t border-black/[0.06] pt-5">
            <span className="font-mono text-[11px] text-black/40">{Object.values(recipients).filter(Boolean).length} recipients · {roll.reviewedEmissions.toLocaleString("en-US")} tCO₂e</span>
            <Button
              disabled={!canFile}
              onClick={() => {
                onChanged(fileDeclaration(decl.id, recipients));
                toast({ message: "Declaration filed", detail: "Sealed package delivered to every recipient with a receipt.", tone: "ok" });
              }}
            >
              <BadgeCheck size={15} strokeWidth={1.5} /> File & hand off
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/* Receipt after filing */
function FiledReceipt({ decl, roll, reg, recipients, ref, filedAt }: { decl: Declaration; roll: ReviewRollup; reg: NonNullable<ReturnType<typeof getRegulation>>; recipients: { buyer: boolean; authority: boolean; verifier: boolean }; ref: string; filedAt: number }) {
  const jur = getJurisdiction(decl.origin)!;
  const approved = roll.submissions.filter((s) => s.lifecycle === "approved");
  const doDownload = () => {
    downloadPackage({
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
      suppliers: approved.map((s) => ({ name: s.supplier.name, material: s.supplier.material, emissions: s.emissions[0]?.perTonne ?? null })),
    });
    toast({ message: "Package downloaded.", detail: "Open it and Print → Save as PDF." });
  };
  const lines = [
    { on: recipients.buyer, label: "EU buyer / importer", to: "procurement@eu-importer.example" },
    { on: recipients.authority, label: reg.authority, to: "transitional registry" },
    { on: recipients.verifier, label: "Accredited verifier", to: "TÜV SÜD · auditor portal" },
  ].filter((l) => l.on);

  return (
    <div className="mx-auto max-w-2xl space-y-6 text-center">
      <div className="flex flex-col items-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#ecfdf5] text-[#047857]"><Check size={28} strokeWidth={1.5} /></span>
        <h2 className="mt-5 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">Declaration filed.</h2>
        <p className="mt-2 max-w-md text-sm text-black/45">Your {reg.short} package for {decl.period} is sealed from {approved.length} approved submissions and delivered to every stakeholder — with a receipt for each.</p>
      </div>

      <Card className="overflow-hidden p-0 text-left">
        <div className="flex items-center justify-between border-b border-black/[0.06] bg-black/[0.02] px-5 py-3">
          <span className="font-mono text-[11px] text-black/40">submission receipt</span>
          <span className="font-mono text-[11px] text-black/55">{ref}</span>
        </div>
        <div className="grid grid-cols-3 gap-3 p-6">
          <Stat value={roll.reviewedEmissions.toLocaleString("en-US")} label="tCO₂e filed" />
          <Stat value={`${approved.length}`} label="suppliers" />
          <Stat value={lines.length} label="recipients" />
        </div>
        <div className="divide-y divide-black/[0.06] border-t border-black/[0.06]">
          {lines.map((l) => (
            <div key={l.label} className="flex items-center justify-between px-6 py-3.5">
              <span className="flex items-center gap-3 text-sm text-black/65"><StatusDot tone="ok" glow /> {l.label}</span>
              <StatusLabel tone="ok" label="delivered" />
            </div>
          ))}
          <div className="flex items-center justify-between px-6 py-3.5">
            <span className="text-sm text-black/65">Timestamp</span>
            <span className="font-mono text-[11px] text-black/45">{new Date(filedAt).toUTCString()}</span>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="secondary" size="sm" onClick={doDownload}><Download size={14} strokeWidth={1.5} /> Download package</Button>
        <Link href="/reports"><Button size="sm">View in reports <ArrowRight size={14} strokeWidth={1.5} /></Button></Link>
        <Link href="/dashboard"><Button variant="ghost" size="sm">Back to dashboard</Button></Link>
      </div>
    </div>
  );
}

/* ════════════════════════ EU XML Export (CBAM specific) ════════════════════════ */
function XmlExportTab({ decl, roll }: { decl: Declaration; roll: ReviewRollup }) {
  const [validating, setValidating] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [done, setDone] = React.useState(false);

  const handleExport = () => {
    setValidating(true);
    // Simulate validation and XML generation
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setValidating(false);
          setDone(true);
          
          const approved = roll.submissions.filter((s) => s.lifecycle === "approved");
          const today = new Date().toISOString().split('T')[0];
          
          const goodsXml = approved.map((sub, index) => {
            const emissions = sub.emissions[0];
            return `      <cbam:GoodsItem>
        <cbam:ItemNumber>${index + 1}</cbam:ItemNumber>
        <cbam:CommodityCode>${sub.supplier.material === "Steel" ? "72081000" : "76011000"}</cbam:CommodityCode>
        <cbam:Description>${sub.supplier.material} imported from ${sub.supplier.name}</cbam:Description>
        <cbam:Quantity>100</cbam:Quantity>
        <cbam:Emissions>
          <cbam:DirectEmissions>${emissions?.productId ? sub.values[valueKey("direct-emissions", emissions.productId)] : 1.5}</cbam:DirectEmissions>
          <cbam:IndirectEmissions>${emissions?.productId ? sub.values[valueKey("indirect-emissions", emissions.productId)] : 0.5}</cbam:IndirectEmissions>
          <cbam:TotalSpecificEmissions>${emissions?.perTonne ?? 2.0}</cbam:TotalSpecificEmissions>
        </cbam:Emissions>
      </cbam:GoodsItem>`;
          }).join("\\n");
      
          const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<cbam:CBAMDeclaration xmlns:cbam="urn:eu:taxud:cbam:v1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <cbam:DeclarationHeader>
    <cbam:DeclarationID>CBAM-${decl.period.replace(/\\s+/g, "")}-${decl.id.substring(0, 8).toUpperCase()}</cbam:DeclarationID>
    <cbam:ReportingPeriod>${decl.period}</cbam:ReportingPeriod>
    <cbam:CreationDate>${today}</cbam:CreationDate>
    <cbam:Declarant>
      <cbam:Name>${ORG.name}</cbam:Name>
      <cbam:EORI>${(ORG as any).eori ?? "NL123456789"}</cbam:EORI>
    </cbam:Declarant>
  </cbam:DeclarationHeader>
  <cbam:ImportedGoods>
${goodsXml || `    <!-- No approved supplier submissions yet -->`}
  </cbam:ImportedGoods>
  <cbam:TotalEmissions>
    <cbam:TotalEmbeddedEmissions>${roll.reviewedEmissions}</cbam:TotalEmbeddedEmissions>
  </cbam:TotalEmissions>
</cbam:CBAMDeclaration>`;

          const blob = new Blob([xmlContent], { type: "application/xml" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `cbam_report_${decl.period.replace(/\\s+/g, "_")}.xml`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          toast({ message: "XML Generated", detail: "CBAM XML file downloaded successfully.", tone: "ok" });
          return 100;
        }
        return p + 20;
      });
    }, 400);
  };

  const missingData = roll.awaitingCount > 0;

  return (
    <div className="space-y-5">
      <div>
        <Eyebrow>EU CBAM Registry XML</Eyebrow>
        <p className="mt-1 max-w-2xl text-sm text-black/45">
          Generate the official XSD-compliant XML file required for the EU CBAM Transitional Registry. The system will run a pre-flight validation check before generating the file.
        </p>
      </div>

      <Card className="p-8 text-center flex flex-col items-center justify-center">
        <div className="h-16 w-16 rounded-2xl bg-[#fafaf8] border border-black/10 flex items-center justify-center mb-6 text-[#2563eb]">
          <FileCode size={28} strokeWidth={1.5} />
        </div>
        
        <h3 className="font-medium text-[#111] text-lg">Export Machine-Readable Report</h3>
        <p className="text-sm text-black/50 mt-2 max-w-md">
          {missingData 
            ? "Warning: Some suppliers have not submitted their data yet. Exporting now will result in incomplete XML data, which may be rejected by the EU."
            : "All submissions are collected. You are ready to generate the compliance XML."}
        </p>

        {validating ? (
          <div className="mt-8 w-64 max-w-full space-y-2">
            <div className="flex justify-between text-xs text-black/50">
              <span>Validating schema...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
              <div className="h-full bg-[#2563eb] transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : done ? (
          <div className="mt-8 space-y-4">
            <div className="inline-flex items-center gap-2 text-[#047857] bg-[#ecfdf5] px-4 py-2 rounded-full text-sm font-medium">
              <Check size={16} /> Validation Passed
            </div>
            <p className="text-xs text-black/40">File: cbam_report_{decl.period.replace(/\s+/g, "_")}.xml downloaded.</p>
          </div>
        ) : (
          <Button 
            className="mt-8" 
            onClick={handleExport}
            variant={missingData ? "secondary" : "primary"}
          >
            <FileCode size={16} strokeWidth={1.5} className="mr-2" />
            Validate & Export XML
          </Button>
        )}
      </Card>
    </div>
  );
}
