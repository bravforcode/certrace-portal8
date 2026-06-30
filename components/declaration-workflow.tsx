"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Send,
  Bell,
  Calculator,
  ShieldCheck,
  UserPlus,
  FileText,
  Building2,
  Landmark,
  BadgeCheck,
  Download,
  Plus,
} from "lucide-react";
import {
  Card,
  Button,
  Eyebrow,
  Chip,
  StatusDot,
  StatusLabel,
  Progress,
  Stat,
  Field,
  inputClass,
  cn,
  Tone,
} from "./ui";
import { SupplierTable } from "./supplier-table";
import { Select } from "./controls";
import { toast } from "./toast";
import { Declaration, SEATS, Seat, ORG } from "@/lib/data";
import { getRegulation, getJurisdiction } from "@/lib/config";
import { downloadPackage } from "@/lib/download";

const FLOW = [
  { key: "collect", label: "Collect", icon: Send },
  { key: "calculate", label: "Calculate", icon: Calculator },
  { key: "comply", label: "Compliance", icon: ShieldCheck },
  { key: "review", label: "Sign-off", icon: UserPlus },
  { key: "report", label: "Report", icon: FileText },
  { key: "submit", label: "Submit", icon: BadgeCheck },
] as const;

export function DeclarationWorkflow({ declaration }: { declaration: Declaration }) {
  const reg = getRegulation(declaration.regulation)!;
  const jur = getJurisdiction(declaration.origin)!;
  const startIdx = Math.max(0, FLOW.findIndex((f) => f.key === declaration.step));
  const [idx, setIdx] = React.useState(declaration.step === "done" ? FLOW.length : startIdx);
  const done = idx >= FLOW.length;

  // per-step state
  const [reminded, setReminded] = React.useState<string[]>([]);
  const [calcRun, setCalcRun] = React.useState(false);
  const [review, setReview] = React.useState<"idle" | "requested" | "signed">("idle");
  const [seats, setSeats] = React.useState<Seat[]>(SEATS.filter((s) => s.role === "legal" || s.role === "auditor"));
  const [reportGenerated, setReportGenerated] = React.useState(false);
  const [recipients, setRecipients] = React.useState({ buyer: true, authority: true, verifier: true });

  const submitted = declaration.suppliers.filter((s) => s.status === "submitted").length;
  const total = declaration.suppliers.length;
  const completion = Math.round(declaration.suppliers.reduce((a, s) => a + s.progress, 0) / total);
  const totalEmbedded = 4820;

  const go = (i: number) => setIdx(i);

  return (
    <div className="space-y-7">
      {/* Breadcrumb + header */}
      <div className="space-y-4">
        <Link href="/declarations" className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-black/40 hover:text-black">
          <ArrowLeft size={13} strokeWidth={1.5} /> Declarations
        </Link>
        <div className="flex flex-col gap-4 border-b border-black/[0.06] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
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
            <Chip tone={declaration.dueInDays < 0 ? "err" : declaration.dueInDays < 21 ? "warn" : "muted"}>
              due {declaration.due}
            </Chip>
            <Chip tone="ok">{reg.authority.split("·")[0].trim()}</Chip>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {FLOW.map((f, i) => {
          const Icon = f.icon;
          const state = done || i < idx ? "done" : i === idx ? "current" : "todo";
          return (
            <React.Fragment key={f.key}>
              <button
                onClick={() => go(i)}
                className={cn(
                  "flex flex-none items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.08em] transition-colors",
                  state === "done" && "border-transparent bg-black/[0.05] text-black/60",
                  state === "current" && "border-black/25 bg-white text-black",
                  state === "todo" && "border-black/10 text-black/30",
                )}
              >
                <span className="grid h-4 w-4 place-items-center">
                  {state === "done" ? <Check size={12} strokeWidth={2} /> : <Icon size={12} strokeWidth={1.5} />}
                </span>
                {f.label}
              </button>
              {i < FLOW.length - 1 && <span className="h-px w-4 flex-none bg-black/[0.08]" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Panel */}
      <div key={done ? "done" : idx} className="ct-enter">
        {done ? (
          <ReceiptStep declaration={declaration} reg={reg} totalEmbedded={totalEmbedded} recipients={recipients} />
        ) : (
          <>
            {idx === 0 && (
              <CollectStep
                declaration={declaration}
                submitted={submitted}
                total={total}
                completion={completion}
                reminded={reminded}
                onRemind={(id) => setReminded((r) => (r.includes(id) ? r : [...r, id]))}
                onAll={() => setReminded(declaration.suppliers.filter((s) => s.status !== "submitted").map((s) => s.id))}
              />
            )}
            {idx === 1 && (
              <CalculateStep
                declaration={declaration}
                calcRun={calcRun}
                onRun={() => setCalcRun(true)}
                totalEmbedded={totalEmbedded}
              />
            )}
            {idx === 2 && <ComplyStep reg={reg} completion={completion} />}
            {idx === 3 && (
              <ReviewStep
                review={review}
                setReview={setReview}
                seats={seats}
                onInvite={(seat) => setSeats((s) => [...s, seat])}
              />
            )}
            {idx === 4 && (
              <ReportStep
                declaration={declaration}
                reg={reg}
                jur={jur}
                totalEmbedded={totalEmbedded}
                generated={reportGenerated}
                onGenerate={() => setReportGenerated(true)}
                signed={review === "signed"}
              />
            )}
            {idx === 5 && (
              <SubmitStep reg={reg} recipients={recipients} setRecipients={setRecipients} signed={review === "signed"} />
            )}
          </>
        )}
      </div>

      {/* Footer nav */}
      {!done && (
        <div className="flex items-center justify-between border-t border-black/[0.06] pt-5">
          <Button variant="ghost" size="sm" onClick={() => go(Math.max(0, idx - 1))} disabled={idx === 0}>
            <ArrowLeft size={14} strokeWidth={1.5} /> Back
          </Button>
          <StepPrimary
            idx={idx}
            calcRun={calcRun}
            review={review}
            reportGenerated={reportGenerated}
            onNext={() => go(idx + 1)}
            onRunCalc={() => setCalcRun(true)}
            onGenerate={() => setReportGenerated(true)}
            onSubmit={() => setIdx(FLOW.length)}
          />
        </div>
      )}
    </div>
  );
}

/* ── Footer primary button — contextual per step ────────── */
function StepPrimary({
  idx,
  calcRun,
  review,
  reportGenerated,
  onNext,
  onRunCalc,
  onGenerate,
  onSubmit,
}: {
  idx: number;
  calcRun: boolean;
  review: "idle" | "requested" | "signed";
  reportGenerated: boolean;
  onNext: () => void;
  onRunCalc: () => void;
  onGenerate: () => void;
  onSubmit: () => void;
}) {
  if (idx === 1 && !calcRun)
    return (
      <Button onClick={onRunCalc}>
        <Calculator size={15} strokeWidth={1.5} /> Run calculation
      </Button>
    );
  if (idx === 3)
    return (
      <Button onClick={onNext} disabled={review !== "signed"}>
        {review === "signed" ? "Continue to report" : "Awaiting sign-off"} <ArrowRight size={15} strokeWidth={1.5} />
      </Button>
    );
  if (idx === 4 && !reportGenerated)
    return (
      <Button onClick={onGenerate}>
        <FileText size={15} strokeWidth={1.5} /> Generate package
      </Button>
    );
  if (idx === 5)
    return (
      <Button onClick={onSubmit}>
        <BadgeCheck size={15} strokeWidth={1.5} /> Submit declaration
      </Button>
    );
  return (
    <Button onClick={onNext}>
      Continue <ArrowRight size={15} strokeWidth={1.5} />
    </Button>
  );
}

/* ── 1 · Collect ────────────────────────────────────────── */
function CollectStep({
  declaration,
  submitted,
  total,
  completion,
  reminded,
  onRemind,
  onAll,
}: {
  declaration: Declaration;
  submitted: number;
  total: number;
  completion: number;
  reminded: string[];
  onRemind: (id: string) => void;
  onAll: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-5">
          <Stat value={`${submitted}/${total}`} label="Submitted" />
        </Card>
        <Card className="p-5">
          <Stat value={`${completion}%`} label="Data complete" />
        </Card>
        <Card className="p-5">
          <Stat value={declaration.suppliers.filter((s) => s.status === "overdue").length} label="Overdue" />
        </Card>
        <Card className="p-5">
          <Stat value={declaration.suppliers.filter((s) => s.critical).length} label="Critical" />
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Eyebrow>Data collection</Eyebrow>
          <p className="mt-1 text-sm text-black/45">The platform auto-reminds. Chase only the ones that matter.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={onAll}>
          <Bell size={14} strokeWidth={1.5} /> Remind all pending
        </Button>
      </div>

      <SupplierTable
        rows={declaration.suppliers}
        actions={(row) =>
          row.status !== "submitted" ? (
            <button
              onClick={() => onRemind(row.id)}
              className={cn(
                "ml-2 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] transition-colors",
                reminded.includes(row.id)
                  ? "border-[rgba(5,150,105,0.18)] bg-[#ecfdf5] text-[#047857]"
                  : "border-black/10 text-black/45 hover:border-black/25 hover:text-black",
              )}
            >
              {reminded.includes(row.id) ? "reminded" : "remind"}
            </button>
          ) : null
        }
      />
    </div>
  );
}

/* ── 2 · Calculate ──────────────────────────────────────── */
function CalculateStep({
  declaration,
  calcRun,
  onRun,
  totalEmbedded,
}: {
  declaration: Declaration;
  calcRun: boolean;
  onRun: () => void;
  totalEmbedded: number;
}) {
  const log = [
    { t: "→", c: "info", l: "loading TGO / อบก. emission factors (TH 2026)" },
    { t: "✓", c: "ok", l: "mapped 18 activity fields → tCO₂e" },
    { t: "✓", c: "ok", l: "direct (Scope 1) emissions resolved" },
    { t: "✓", c: "ok", l: "indirect (electricity) emissions resolved" },
    { t: "●", c: "warn", l: "2 suppliers using default factors (no actual data)" },
    { t: "✓", c: "ok", l: "embedded emissions per tonne computed" },
  ];
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-4">
        <div>
          <Eyebrow>Carbon calculation</Eyebrow>
          <p className="mt-1 text-sm text-black/45">
            Activity data → embedded emissions, using IPCC & GHG Protocol methodology with localised factors.
          </p>
        </div>
        <Card className="p-6">
          <div className="rounded-xl border border-black/[0.06] bg-black/[0.03] p-5 font-mono text-[12px] leading-[1.9]">
            {!calcRun ? (
              <span className="text-black/40"># press “Run calculation” to compute embedded emissions…</span>
            ) : (
              log.map((line, i) => (
                <div
                  key={i}
                  className="ct-row"
                  style={{
                    animationDelay: `${i * 90}ms`,
                    color:
                      line.c === "ok" ? "#16a34a" : line.c === "warn" ? "#b45309" : line.c === "info" ? "#2563eb" : "#111",
                  }}
                >
                  <span className="mr-2">{line.t}</span>
                  {line.l}
                </div>
              ))
            )}
          </div>
        </Card>
        {calcRun && (
          <Card warm className="flex items-center justify-between p-5">
            <div>
              <div className="font-[family-name:var(--font-plex)] text-3xl font-light text-[#111]">
                {totalEmbedded.toLocaleString()}{" "}
                <span className="text-base text-black/40">tCO₂e</span>
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.1em] text-black/40">Total embedded · this cycle</div>
            </div>
            <StatusLabel tone="ok" label="computed" glow />
          </Card>
        )}
      </div>

      <div className="space-y-3">
        <Eyebrow>Per-supplier embedded emissions</Eyebrow>
        {calcRun ? (
          <SupplierTable
            rows={declaration.suppliers.map((s) => ({
              ...s,
              emissions: s.emissions ?? Number((1 + Math.random() * 1.5).toFixed(2)),
              status: "submitted",
              progress: 100,
            }))}
            showEmissions
            compact
          />
        ) : (
          <Card className="p-10 text-center text-sm text-black/35">
            Results appear after calculation runs.
          </Card>
        )}
      </div>
    </div>
  );
}

/* ── 3 · Compliance ─────────────────────────────────────── */
function ComplyStep({ reg, completion }: { reg: ReturnType<typeof getRegulation>; completion: number }) {
  const checks = (reg?.requirements ?? []).map((r, i) => ({
    label: r,
    ok: i < (reg!.requirements.length - 1),
  }));
  const ready = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
      <Card className="flex flex-col items-center justify-center p-8 text-center">
        <div className="relative grid h-40 w-40 place-items-center">
          <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="8" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="#10b981"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(ready / 100) * 327} 327`}
            />
          </svg>
          <div>
            <div className="font-[family-name:var(--font-plex)] text-4xl font-light text-[#111]">{ready}%</div>
            <div className="text-[10px] uppercase tracking-[0.1em] text-black/40">audit-ready</div>
          </div>
        </div>
        <p className="mt-5 max-w-xs text-sm text-black/45">
          Real-time gap detection against {reg?.short} requirements. Resolve gaps before sign-off.
        </p>
      </Card>

      <div className="space-y-3">
        <Eyebrow>Requirement checklist</Eyebrow>
        <Card className="divide-y divide-black/[0.06] p-0">
          {checks.map((c) => (
            <div key={c.label} className="flex items-center justify-between px-5 py-4">
              <span className="flex items-center gap-3 text-sm text-black/65">
                <span
                  className={cn(
                    "grid h-5 w-5 place-items-center rounded-full",
                    c.ok ? "bg-[#ecfdf5] text-[#047857]" : "border border-[rgba(220,38,38,0.25)] text-[#dc2626]",
                  )}
                >
                  {c.ok ? <Check size={12} strokeWidth={2} /> : "!"}
                </span>
                {c.label}
              </span>
              <StatusLabel tone={c.ok ? "ok" : "err"} label={c.ok ? "met" : "gap"} />
            </div>
          ))}
        </Card>
        <Card warm className="flex items-center gap-3 p-4">
          <StatusDot tone="warn" />
          <p className="text-sm text-black/55">
            One gap: carbon-price evidence missing for 2 suppliers. The platform flagged them — request before submitting.
          </p>
        </Card>
      </div>
    </div>
  );
}

/* ── 4 · Sign-off (SEATS) ───────────────────────────────── */
function ReviewStep({
  review,
  setReview,
  seats,
  onInvite,
}: {
  review: "idle" | "requested" | "signed";
  setReview: (v: "idle" | "requested" | "signed") => void;
  seats: Seat[];
  onInvite: (s: Seat) => void;
}) {
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<"legal" | "auditor">("legal");

  const invite = () => {
    if (!email) return;
    onInvite({
      id: `inv-${Date.now()}`,
      name: email.split("@")[0],
      email,
      org: email.split("@")[1] ?? "",
      role,
      state: "invited",
      lastActive: "—",
    });
    setEmail("");
  };

  const roleMeta: Record<string, { label: string; tone: Tone }> = {
    legal: { label: "Legal / compliance", tone: "info" },
    auditor: { label: "Verifier / auditor", tone: "ok" },
  };
  const stateMeta: Record<string, { label: string; tone: Tone }> = {
    active: { label: "active", tone: "ok" },
    invited: { label: "invited", tone: "muted" },
    review_requested: { label: "reviewing", tone: "info" },
    signed_off: { label: "signed off", tone: "ok" },
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
      {/* Seats */}
      <div className="space-y-4">
        <div>
          <Eyebrow>Review & sign-off</Eyebrow>
          <p className="mt-1 text-sm text-black/45">
            You don't file alone. Add your legal team or verifier as a seat — they review the source data and sign off
            before anything leaves the platform. Suppliers stay free; reviewers take a seat.
          </p>
        </div>

        <Card className="divide-y divide-black/[0.06] p-0">
          {seats.map((s) => {
            const rm = roleMeta[s.role] ?? roleMeta.legal;
            const sm = stateMeta[s.role === "legal" && review !== "idle" ? (review === "signed" ? "signed_off" : "review_requested") : s.state] ?? stateMeta.invited;
            return (
              <div key={s.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-xl border border-black/10 text-black/55">
                    {s.role === "auditor" ? <BadgeCheck size={16} strokeWidth={1.5} /> : <ShieldCheck size={16} strokeWidth={1.5} />}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm text-black/70">{s.name}</div>
                    <div className="truncate text-[11px] text-black/35">{s.email}</div>
                  </div>
                </div>
                <div className="flex flex-none flex-col items-end gap-1">
                  <Chip tone={rm.tone}>{rm.label}</Chip>
                  <StatusLabel tone={sm.tone} label={sm.label} pulse={sm.label === "reviewing"} />
                </div>
              </div>
            );
          })}
        </Card>

        {/* Invite a seat */}
        <Card warm className="p-5">
          <Eyebrow>Invite a reviewer</Eyebrow>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              className={inputClass}
              placeholder="lawyer@firm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Select
              className="sm:w-44"
              value={role}
              onChange={(v) => setRole(v as "legal" | "auditor")}
              options={[
                { value: "legal", label: "Legal / compliance" },
                { value: "auditor", label: "Verifier / auditor" },
              ]}
              ariaLabel="Reviewer role"
            />
            <Button variant="secondary" size="sm" onClick={invite} className="sm:flex-none">
              <Plus size={14} strokeWidth={1.5} /> Add seat
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-black/35">
            They get a scoped login to this declaration's source data — no spreadsheet attachments, no email chaos.
          </p>
        </Card>
      </div>

      {/* Sign-off status */}
      <Card className="flex flex-col p-6">
        <Eyebrow>Sign-off status</Eyebrow>
        <div className="mt-4 flex-1 space-y-3">
          {[
            { k: "requested", label: "Sign-off requested", desc: "Legal seat notified to review." },
            { k: "signed", label: "Legal sign-off", desc: "Reviewer approved the package." },
          ].map((s) => {
            const reached = review === "signed" || (s.k === "requested" && review === "requested");
            const isSigned = s.k === "signed" && review === "signed";
            const ok = isSigned || (s.k === "requested" && review !== "idle");
            return (
              <div key={s.k} className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full text-[11px]",
                    ok ? "bg-[#ecfdf5] text-[#047857]" : "border border-black/15 text-black/30",
                  )}
                >
                  {ok ? <Check size={12} strokeWidth={2} /> : ""}
                </span>
                <div>
                  <div className={cn("text-sm", ok ? "text-[#111]" : "text-black/45")}>{s.label}</div>
                  <div className="text-[12px] text-black/40">{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 border-t border-black/[0.06] pt-5">
          {review === "idle" && (
            <Button className="w-full" onClick={() => setReview("requested")}>
              <Send size={15} strokeWidth={1.5} /> Request legal sign-off
            </Button>
          )}
          {review === "requested" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <StatusDot tone="info" pulse />
                <span className="font-mono text-[12px] text-[#2563eb]">awaiting reviewer…</span>
              </div>
              <Button variant="secondary" className="w-full" onClick={() => setReview("signed")}>
                Mark as signed off (demo)
              </Button>
              <p className="text-[11px] text-black/35">
                In production the reviewer approves from their own seat. This button simulates it for the walkthrough.
              </p>
            </div>
          )}
          {review === "signed" && (
            <Card warm className="flex items-center gap-3 p-4">
              <StatusDot tone="ok" pulse glow />
              <p className="text-sm text-black/60">
                Signed off by Krit Legal Partners. The package can now be generated and submitted.
              </p>
            </Card>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ── 5 · Report ─────────────────────────────────────────── */
function ReportStep({
  declaration,
  reg,
  jur,
  totalEmbedded,
  generated,
  onGenerate,
  signed,
}: {
  declaration: Declaration;
  reg: NonNullable<ReturnType<typeof getRegulation>>;
  jur: NonNullable<ReturnType<typeof getJurisdiction>>;
  totalEmbedded: number;
  generated: boolean;
  onGenerate: () => void;
  signed: boolean;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
      <div className="space-y-4">
        <div>
          <Eyebrow>Audit-ready package</Eyebrow>
          <p className="mt-1 text-sm text-black/45">
            One consolidated, timestamped package — formatted exactly as SGS, TÜV, BV and the authority require.
            Exporters can't quietly export a raw file; the signed package is what goes out.
          </p>
        </div>
        {!signed && (
          <Card warm className="flex items-center gap-3 p-4">
            <StatusDot tone="warn" />
            <p className="text-sm text-black/55">Legal sign-off pending — generate is allowed, submission stays locked until signed.</p>
          </Card>
        )}
        <Card className="divide-y divide-black/[0.06] p-0">
          {[
            ["Cover & declarant", "Installation + exporter identity"],
            ["Embedded emissions", `${totalEmbedded.toLocaleString()} tCO₂e`],
            ["Methodology", "IPCC · GHG Protocol · " + jur.factorSet],
            ["Evidence trail", "Timestamped supplier submissions"],
            ["Verification block", "Reviewer sign-off + audit log"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm text-black/65">{k}</span>
              <span className="font-mono text-[11px] text-black/40">{v}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Document preview */}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-black/[0.06] bg-black/[0.02] px-5 py-3">
          <StatusDot /> <StatusDot /> <StatusDot />
          <span className="ml-2 font-mono text-[11px] text-black/35">
            certrace · {reg.short.toLowerCase()}-{declaration.period.toLowerCase().replace(/[^a-z0-9]/g, "")}.pdf
          </span>
          {generated && <span className="ml-auto"><StatusLabel tone="ok" label="generated" glow /></span>}
        </div>

        {generated ? (
          <div className="space-y-5 p-7">
            <div>
              <div className="font-pixel text-[10px] uppercase tracking-[0.2em] text-black/40">{reg.full}</div>
              <div className="mt-2 font-[family-name:var(--font-plex)] text-2xl font-light text-[#111]">
                Embedded emissions declaration
              </div>
              <div className="mt-1 text-sm text-black/45">
                {declaration.sector} · {declaration.period} · {jur.name} → {declaration.market}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Stat value={totalEmbedded.toLocaleString()} label="tCO₂e" />
              <Stat value={`${declaration.suppliers.length}`} label="suppliers" />
              <Stat value="100%" label="verified" />
            </div>
            <div className="hairline-grid h-28 rounded-xl border border-black/[0.06]" aria-hidden />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] text-black/35">
                <StatusDot tone="ok" /> sha-256 sealed · ready for handoff
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  downloadPackage({
                    ref: `CTR-${reg.short.replace(/\s/g, "")}-${declaration.period}`.replace(/[^A-Za-z0-9-]/g, ""),
                    regulationShort: reg.short,
                    regulationFull: reg.full,
                    period: declaration.period,
                    sector: declaration.sector,
                    origin: jur.name,
                    market: declaration.market === "EU" ? "European Union" : declaration.market,
                    org: ORG.name,
                    installationId: ORG.installationId,
                    totalEmbedded,
                    supplierCount: declaration.suppliers.length,
                    carbonPricePaid: declaration.carbonPricePaid ?? 0,
                    factorSet: jur.factorSet,
                    suppliers: declaration.suppliers.map((s) => ({ name: s.name, material: s.material, emissions: s.emissions })),
                  });
                  toast({ message: "Package downloaded.", detail: "Open it and Print → Save as PDF." });
                }}
              >
                <Download size={13} strokeWidth={1.5} /> Download
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl border border-black/10 text-black/40">
              <FileText size={20} strokeWidth={1.5} />
            </span>
            <p className="mt-4 text-sm text-black/45">No package yet.</p>
            <Button className="mt-4" size="sm" onClick={onGenerate}>
              Generate package
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ── 6 · Submit (the handoff) ───────────────────────────── */
function SubmitStep({
  reg,
  recipients,
  setRecipients,
  signed,
}: {
  reg: NonNullable<ReturnType<typeof getRegulation>>;
  recipients: { buyer: boolean; authority: boolean; verifier: boolean };
  setRecipients: (r: { buyer: boolean; authority: boolean; verifier: boolean }) => void;
  signed: boolean;
}) {
  const targets = [
    {
      key: "buyer" as const,
      icon: Building2,
      title: "EU buyer / importer",
      to: "procurement@eu-importer.example",
      desc: "Shares the verified package with the declarant who files at the border.",
    },
    {
      key: "authority" as const,
      icon: Landmark,
      title: reg.authority,
      to: "CBAM transitional registry",
      desc: "Lodges the embedded-emissions data directly with the authority.",
    },
    {
      key: "verifier" as const,
      icon: BadgeCheck,
      title: "Accredited verifier",
      to: "TÜV SÜD · auditor portal",
      desc: "Gives the verifier source-data access — no email attachments.",
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <Eyebrow>Submit & hand off</Eyebrow>
        <p className="mt-1 max-w-2xl text-sm text-black/45">
          Today an exporter emails the report to their buyer and the authority by hand. Certrace replaces that — route
          the signed package to every stakeholder at once, with a delivery receipt for each.
        </p>
      </div>

      {!signed && (
        <Card warm className="flex items-center gap-3 p-4">
          <StatusDot tone="err" />
          <p className="text-sm text-black/55">
            Submission is locked until legal sign-off is complete. Go back to the Sign-off step.
          </p>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        {targets.map((t) => {
          const Icon = t.icon;
          const on = recipients[t.key];
          return (
            <button
              key={t.key}
              onClick={() => setRecipients({ ...recipients, [t.key]: !on })}
              className={cn(
                "rounded-2xl border p-5 text-left transition-colors",
                on ? "border-black/20 bg-[#f0eee8]" : "border-black/[0.07] bg-white hover:border-black/15",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-black/10 text-black/60">
                  <Icon size={18} strokeWidth={1.5} />
                </span>
                <span
                  className={cn(
                    "grid h-5 w-5 place-items-center rounded-full border",
                    on ? "border-transparent bg-[#111] text-white" : "border-black/15",
                  )}
                >
                  {on && <Check size={12} strokeWidth={2} />}
                </span>
              </div>
              <div className="mt-4 text-sm text-[#111]">{t.title}</div>
              <div className="mt-0.5 font-mono text-[11px] text-black/40">{t.to}</div>
              <p className="mt-2 text-[12px] leading-relaxed text-black/45">{t.desc}</p>
            </button>
          );
        })}
      </div>

      <Card className="flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <StatusDot tone={signed ? "ok" : "muted"} pulse={signed} glow={signed} />
          <p className="text-sm text-black/55">
            {Object.values(recipients).filter(Boolean).length} recipients selected · package sealed & signed{" "}
            {signed ? "✓" : "—"}
          </p>
        </div>
        <span className="font-mono text-[11px] text-black/35">Submitting lodges data + notifies all recipients.</span>
      </Card>
    </div>
  );
}

/* ── 7 · Receipt (last screen) ──────────────────────────── */
function ReceiptStep({
  declaration,
  reg,
  totalEmbedded,
  recipients,
}: {
  declaration: Declaration;
  reg: NonNullable<ReturnType<typeof getRegulation>>;
  totalEmbedded: number;
  recipients: { buyer: boolean; authority: boolean; verifier: boolean };
}) {
  const ref = `CTR-${reg.short.replace(/\s/g, "")}-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const jur = getJurisdiction(declaration.origin)!;
  const doDownload = () => {
    downloadPackage({
      ref,
      regulationShort: reg.short,
      regulationFull: reg.full,
      period: declaration.period,
      sector: declaration.sector,
      origin: jur.name,
      market: declaration.market === "EU" ? "European Union" : declaration.market,
      org: ORG.name,
      installationId: ORG.installationId,
      totalEmbedded,
      supplierCount: declaration.suppliers.length,
      carbonPricePaid: declaration.carbonPricePaid ?? 0,
      factorSet: jur.factorSet,
      suppliers: declaration.suppliers.map((s) => ({ name: s.name, material: s.material, emissions: s.emissions })),
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
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#ecfdf5] text-[#047857]">
          <Check size={28} strokeWidth={1.5} />
        </span>
        <h2 className="mt-5 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
          Declaration submitted.
        </h2>
        <p className="mt-2 max-w-md text-sm text-black/45">
          Your {reg.short} package for {declaration.period} is sealed, signed, and delivered to every stakeholder. No
          emails. No attachments. A receipt for each.
        </p>
      </div>

      <Card className="overflow-hidden p-0 text-left">
        <div className="flex items-center justify-between border-b border-black/[0.06] bg-black/[0.02] px-5 py-3">
          <span className="font-mono text-[11px] text-black/40">submission receipt</span>
          <span className="font-mono text-[11px] text-black/55">{ref}</span>
        </div>
        <div className="grid grid-cols-3 gap-3 p-6">
          <Stat value={totalEmbedded.toLocaleString()} label="tCO₂e filed" />
          <Stat value={`${declaration.suppliers.length}`} label="suppliers" />
          <Stat value={lines.length} label="recipients" />
        </div>
        <div className="divide-y divide-black/[0.06] border-t border-black/[0.06]">
          {lines.map((l) => (
            <div key={l.label} className="flex items-center justify-between px-6 py-3.5">
              <span className="flex items-center gap-3 text-sm text-black/65">
                <StatusDot tone="ok" glow /> {l.label}
              </span>
              <StatusLabel tone="ok" label="delivered" />
            </div>
          ))}
          <div className="flex items-center justify-between px-6 py-3.5">
            <span className="text-sm text-black/65">Timestamp</span>
            <span className="font-mono text-[11px] text-black/45">{new Date().toUTCString()}</span>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="secondary" size="sm" onClick={doDownload}>
          <Download size={14} strokeWidth={1.5} /> Download package
        </Button>
        <Link href="/reports">
          <Button size="sm">
            View in reports <ArrowRight size={14} strokeWidth={1.5} />
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            Back to dashboard
          </Button>
        </Link>
      </div>

      <p className="text-[11px] text-black/30">
        Next {reg.short} cycle opens automatically. Suppliers who submitted carry forward — less to chase next time.
      </p>
    </div>
  );
}
