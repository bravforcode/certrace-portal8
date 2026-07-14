"use client";

/* The supplier portal's hub-and-spoke views (everything except the questionnaire,
   which lives in form-view.tsx). All read/write through the shared context. */

import * as React from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldCheck,
  FileText,
  Upload,
  Trash2,
  Plus,
  Users,
  Building2,
  Sparkles,
  CircleCheck,
  TriangleAlert,
  CircleX,
  Link2,
  PenLine,
  History,
  Mail,
  ChevronRight,
  Lock,
  X,
} from "lucide-react";
import { Card, Button, Eyebrow, StatusDot, Field, inputClass, cn } from "@/components/ui";
import { Select } from "@/components/controls";
import { toast } from "@/components/toast";
import { useSupplier } from "./context";
import { type SupplierSection, type RequestDocAsk, valueKey } from "@/lib/supplier";
import { type SupplierProfile, loadProfiles } from "@/lib/supplier-store";
import { runQualityCheck, CATEGORIES, CATEGORY_BLURB, type CheckResult, type Severity } from "@/lib/ai-check";

const DEPARTMENTS = [
  "Operations / EHS",
  "Production / Plant",
  "Sustainability / ESG",
  "Energy",
  "Procurement",
  "Finance",
  "QA / Verifier",
  "Compliance / QA",
];

/* ════════════════════════ Landing ════════════════════════ */
export function LandingView() {
  const { req, setView } = useSupplier();
  const groups = Array.from(new Set(req.fields.map((f) => f.group)));
  return (
    <div className="mx-auto max-w-2xl py-6">
      <Eyebrow>
        {req.regulationShort} · {req.period} data request
      </Eyebrow>
      <h1 className="mt-3 font-[family-name:var(--font-plex)] text-4xl font-light leading-tight tracking-tight text-[#111]">
        {req.exporterName} needs your carbon data.
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-black/55">
        You’re <span className="text-black/80">{req.supplierName}</span>. To keep shipping {req.originName} {req.sectorWord} into the {req.destinationName}, {req.exporterName} has
        to report the embedded emissions of the goods they buy from you — under {req.regulationFull}. This takes about 10 minutes, it’s free, and you don’t need an account.
      </p>

      <Card className="mt-7 divide-y divide-black/[0.06] p-0">
        {[
          ["Requested by", `${req.exporterName} · ${req.exporterContact}`],
          ["Regulation", `${req.regulationShort} — ${req.regulationFull}`],
          ["Goods in scope", req.products.map((p) => p.product.name).join(", ")],
          ["Reporting period", req.period],
          ["Documents requested", `${req.documents.length} (${req.documents.filter((d) => d.required).length} required)`],
          ["Deadline", req.deadline],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4 px-5 py-3">
            <span className="text-[11px] uppercase tracking-[0.1em] text-black/35">{k}</span>
            <span className="text-right text-sm text-black/70">{v}</span>
          </div>
        ))}
      </Card>

      <div className="mt-6">
        <Eyebrow>What you’ll be asked for</Eyebrow>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {groups.map((g) => (
            <span key={g} className="rounded-full border border-black/[0.08] bg-white px-2.5 py-1 text-[11px] text-black/55">
              {g}
            </span>
          ))}
          <span className="rounded-full border border-black/[0.08] bg-white px-2.5 py-1 text-[11px] text-black/55">Supporting documents</span>
        </div>
      </div>

      <Card warm className="mt-6 flex items-start gap-3 p-4">
        <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg border border-black/[0.08] bg-white text-[#047857]">
          <ShieldCheck size={15} strokeWidth={1.5} />
        </span>
        <p className="text-[13px] leading-relaxed text-black/55">
          Your figures are checked automatically before you submit, encrypted, and shared only with {req.exporterName} for this declaration. You can invite colleagues to fill the parts that belong to their department.
        </p>
      </Card>

      <div className="mt-7">
        <Button onClick={() => setView("overview")}>
          Start <ArrowRight size={15} strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
}

/* ════════════════════════ Profile (optional onboarding) ════════════════════════ */
const emptyProfile: SupplierProfile = { legalName: "", installationName: "", country: "", address: "", unlocode: "", coordinates: "", route: "" };

export function ProfileView() {
  const { req, saveProfile, setView, state } = useSupplier();
  const [p, setP] = React.useState<SupplierProfile>(() => state.profile ?? loadProfiles()[req.supplierName] ?? { ...emptyProfile, legalName: req.supplierName, country: req.originName });
  const set = (k: keyof SupplierProfile, v: string) => setP((s) => ({ ...s, [k]: v }));
  const valid = p.legalName.trim() && p.installationName.trim() && p.country.trim();

  return (
    <div className="mx-auto max-w-2xl py-4">
      <button onClick={() => setView("landing")} className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-black/40 hover:text-black">
        <ArrowLeft size={13} strokeWidth={1.5} /> Back
      </button>
      <h1 className="mt-4 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">Company & installation profile</h1>
      <p className="mt-2 text-sm text-black/50">
        Optional, and reusable. We save this securely so your installation identity pre-fills the questionnaire now and skips re-typing on every future request from any buyer.
      </p>

      <Card className="mt-6 space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Legal company name">
            <input className={inputClass} value={p.legalName} onChange={(e) => set("legalName", e.target.value)} placeholder="Thai Metal Pro Co., Ltd" />
          </Field>
          <Field label="Production installation">
            <input className={inputClass} value={p.installationName} onChange={(e) => set("installationName", e.target.value)} placeholder="Rayong Plant 2" />
          </Field>
          <Field label="Country">
            <input className={inputClass} value={p.country} onChange={(e) => set("country", e.target.value)} placeholder="Thailand" />
          </Field>
          <Field label="UN/LOCODE" hint="UN location code of the site.">
            <input className={inputClass} value={p.unlocode} onChange={(e) => set("unlocode", e.target.value)} placeholder="THRYG" />
          </Field>
        </div>
        <Field label="Site address">
          <textarea className={cn(inputClass, "min-h-[64px] resize-y")} value={p.address} onChange={(e) => set("address", e.target.value)} placeholder="123 Industrial Estate Rd, Rayong 21150" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Geographic coordinates" hint="Lat, long of the main emission source.">
            <input className={inputClass} value={p.coordinates} onChange={(e) => set("coordinates", e.target.value)} placeholder="12.6802, 101.2810" />
          </Field>
          <Field label="Main production route" hint="e.g. EAF, BF-BOF, DRI-EAF.">
            <input className={inputClass} value={p.route} onChange={(e) => set("route", e.target.value)} placeholder="EAF (electric arc furnace)" />
          </Field>
        </div>
      </Card>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setView("overview")}>
          Skip for now
        </Button>
        <Button
          size="sm"
          disabled={!valid}
          onClick={() => {
            saveProfile(p);
            toast({ message: "Profile saved", detail: "Your installation details now pre-fill the questionnaire.", tone: "ok" });
            setView("overview");
          }}
        >
          Save & continue <ArrowRight size={14} strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
}

/* ════════════════════════ Overview (hub) ════════════════════════ */
export function OverviewView() {
  const { req, state, sections, sectionProgress, overall, setView, focusRevision, goToCheck, hasAnyInput, requiredComplete, missingRequiredCount } = useSupplier();
  const latest = state.versions[state.versions.length - 1];
  const revFields = state.unlocked.length;
  const revDocs = state.unlockedDocs.length;
  const revTotal = revFields + revDocs;
  const revWhat = [revFields ? `${revFields} field${revFields === 1 ? "" : "s"}` : null, revDocs ? `${revDocs} document${revDocs === 1 ? "" : "s"}` : null].filter(Boolean).join(" and ");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Eyebrow>Your request workspace</Eyebrow>
          <h1 className="mt-2 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
            {req.regulationShort} · {req.period}
          </h1>
          <p className="mt-2 text-sm text-black/50">For {req.exporterName} — fill each section, attach documents, run the check, then sign and submit.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-[family-name:var(--font-plex)] text-3xl font-light text-[#111]">{overall.pct}%</div>
            <div className="text-[10px] uppercase tracking-[0.1em] text-black/40">complete</div>
          </div>
        </div>
      </div>

      {state.status === "revision_requested" && (
        <Card className="border-[#2563eb]/30 bg-[#eff6ff] p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg bg-[#dbeafe] text-[#2563eb]">
              <PenLine size={15} strokeWidth={1.5} />
            </span>
            <div className="text-[13px] leading-relaxed text-black/65">
              <span className="text-black/80">{req.exporterName} requested a revision.</span> Update the flagged {revWhat || "items"}, re-run the check and resubmit as Version {(latest?.n ?? 1) + 1}. Everything else stays locked.
              <p className="mt-1.5 text-black/55">“{state.revisionNote}”</p>
              <Button size="sm" className="mt-3" onClick={focusRevision}>
                Take me to the change{revTotal === 1 ? "" : "s"} <ArrowRight size={13} strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Exporter note */}
      <Card warm className="flex items-start gap-3 p-4">
        <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg border border-black/[0.08] bg-white text-black/55">
          <Mail size={15} strokeWidth={1.5} />
        </span>
        <div>
          <div className="text-[11px] uppercase tracking-[0.1em] text-black/40">Note from {req.exporterName}</div>
          <p className="mt-1 text-[13px] leading-relaxed text-black/60">{req.noteToSuppliers}</p>
        </div>
      </Card>

      {/* Section matrix */}
      <div>
        <Eyebrow>Sections</Eyebrow>
        <div className="mt-3 overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
          {sections.map((s) => {
            const prog = sectionProgress(s);
            const seat = state.seats.find((x) => x.sections.includes(s.key));
            return (
              <button
                key={s.key}
                onClick={() => setView(s.scope === "docs" ? "documents" : "form")}
                className="flex w-full items-center gap-3 border-b border-black/[0.05] px-4 py-3.5 text-left last:border-0 hover:bg-[#fafaf8]"
              >
                <span
                  className={cn(
                    "grid h-7 w-7 flex-none place-items-center rounded-lg border",
                    prog.complete ? "border-transparent bg-[#ecfdf5] text-[#047857]" : "border-black/10 text-black/30",
                  )}
                >
                  {prog.complete ? <Check size={14} strokeWidth={2.5} /> : prog.total === 0 ? <span className="text-[11px] text-black/25">–</span> : <span className="font-mono text-[10px]">{prog.done}/{prog.total}</span>}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-black/75">{s.label}</span>
                  <span className="block truncate text-[11px] text-black/40">
                    {s.blurb} · <span className="text-black/35">{seat ? `${seat.name.split(" ")[0]} (${seat.department})` : s.department}</span>
                  </span>
                </span>
                <ChevronRight size={15} strokeWidth={1.5} className="flex-none text-black/25" />
              </button>
            );
          })}
        </div>
      </div>

      {latest && (
        <Card className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-[#ecfdf5] text-[#047857]">
              <CircleCheck size={16} strokeWidth={1.5} />
            </span>
            <div className="text-[13px] text-black/65">
              Submitted as <span className="text-black/85">Version {latest.n}</span> · quality score {latest.score}
              <div className="text-[11px] text-black/40">View the receipt and audit trail.</div>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setView("done")}>
            View submission
          </Button>
        </Card>
      )}

      <div className="border-t border-black/[0.06] pt-5">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setView("form")}>
            {overall.pct > 0 ? "Continue questionnaire" : "Start questionnaire"} <ArrowRight size={15} strokeWidth={1.5} />
          </Button>
          <Button variant="secondary" size="md" onClick={goToCheck} disabled={!hasAnyInput}>
            <Sparkles size={14} strokeWidth={1.5} /> Run quality check
          </Button>
        </div>
        <p className="mt-2.5 text-[11px] text-black/40">
          {!hasAnyInput
            ? "Start filling in the questionnaire to enable the quality check."
            : !requiredComplete
              ? `${missingRequiredCount} required field${missingRequiredCount === 1 ? "" : "s"} left — we'll take you to them before running the check.`
              : "All required fields are in. The check is ready to run."}
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════ Documents ════════════════════════ */
const DOC_FLAG: Record<"warning" | "revision", { ring: string; ringStrong: string; text: string }> = {
  warning: { ring: "ring-2 ring-[#d97706]/40", ringStrong: "ring-4 ring-[#d97706]/60", text: "text-[#b45309]" },
  revision: { ring: "ring-2 ring-[#2563eb]/40", ringStrong: "ring-4 ring-[#2563eb]/55", text: "text-[#2563eb]" },
};
const fmtSize = (b: number) => (b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

function DocRow({ d }: { d: RequestDocAsk }) {
  const { state, addFiles, removeFile, isDocEditable, flaggedDocs, focusDocId, clearDocFocus } = useSupplier();
  const files = state.docs[d.id]?.files ?? [];
  const uploaded = files.length > 0;
  const editable = isDocEditable(d.id);
  const flag = flaggedDocs.get(d.id);
  const fs = flag ? DOC_FLAG[flag.severity] : null;

  const inputRef = React.useRef<HTMLInputElement>(null);
  const ref = React.useRef<HTMLDivElement>(null);
  const [pulse, setPulse] = React.useState(false);
  const isTarget = focusDocId === d.id;
  React.useEffect(() => {
    if (!isTarget || !ref.current) return;
    ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    setPulse(true);
    const t = setTimeout(() => {
      setPulse(false);
      clearDocFocus();
    }, 1900);
    return () => clearTimeout(t);
  }, [isTarget, clearDocFocus]);

  const ring = fs ? cn("transition-shadow duration-700", pulse ? fs.ringStrong : fs.ring) : "";
  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    e.target.value = ""; // let the same file be re-picked later
    // Keep the real bytes for files up to 1.5 MB so the exporter can retrieve
    // the evidence; bigger files record name + size only (storage quota).
    const MAX_INLINE = 1_500_000;
    const picked = await Promise.all(
      list.map(
        (f) =>
          new Promise<{ name: string; size: number; dataUrl?: string }>((resolve) => {
            if (f.size > MAX_INLINE) return resolve({ name: f.name, size: f.size });
            const reader = new FileReader();
            reader.onload = () => resolve({ name: f.name, size: f.size, dataUrl: typeof reader.result === "string" ? reader.result : undefined });
            reader.onerror = () => resolve({ name: f.name, size: f.size });
            reader.readAsDataURL(f);
          }),
      ),
    );
    addFiles(d.id, picked);
  };

  return (
    <div ref={ref} className={cn("scroll-mt-28 rounded-2xl", ring)}>
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <span className={cn("grid h-9 w-9 flex-none place-items-center rounded-lg border", uploaded ? "border-transparent bg-[#ecfdf5] text-[#047857]" : "border-black/10 text-black/35")}>
            {uploaded ? <Check size={16} strokeWidth={2} /> : <FileText size={16} strokeWidth={1.5} />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-black/75">{d.label}</span>
              {d.required ? (
                <span className="rounded-full border border-black/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-black/45">required</span>
              ) : (
                <span className="text-[9px] uppercase tracking-[0.1em] text-black/30">optional</span>
              )}
              {!editable && <Lock size={11} strokeWidth={1.5} className="text-black/30" />}
              {uploaded && <span className="font-mono text-[10px] text-black/35">{files.length} file{files.length === 1 ? "" : "s"}</span>}
            </div>

            {uploaded && (
              <ul className="mt-2 space-y-1.5">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-lg border border-black/[0.06] bg-[#fafaf8] px-2.5 py-1.5">
                    <FileText size={13} strokeWidth={1.5} className="flex-none text-black/35" />
                    <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-black/55">{f.name}</span>
                    <span className="flex-none font-mono text-[10px] text-black/35">{fmtSize(f.size)}</span>
                    {editable && (
                      <button onClick={() => removeFile(d.id, i)} aria-label={`Remove ${f.name}`} className="flex-none text-black/30 hover:text-[#dc2626]">
                        <X size={13} strokeWidth={1.5} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {editable ? (
              <>
                <input ref={inputRef} type="file" multiple onChange={onPick} className="hidden" aria-label={`Upload ${d.label}`} />
                <button
                  onClick={() => inputRef.current?.click()}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-black/15 px-3.5 py-2 text-[12px] text-black/55 hover:border-black/30 hover:text-black"
                >
                  <Upload size={13} strokeWidth={1.5} /> {uploaded ? "Add more files" : "Upload file(s)"}
                </button>
              </>
            ) : (
              <p className="mt-2 text-[11px] text-black/40">Locked — not part of this revision.</p>
            )}

            {flag && (
              <p className={cn("mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed", fs!.text)}>
                {flag.severity === "revision" ? <PenLine size={12} strokeWidth={1.8} className="mt-[2px] flex-none" /> : <TriangleAlert size={12} strokeWidth={1.8} className="mt-[2px] flex-none" />}
                <span>
                  <span className="font-pixel text-[9px] uppercase tracking-[0.14em] opacity-70">{flag.severity === "revision" ? "Exporter" : "AI check"} · </span>
                  {flag.message}
                </span>
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

export function DocumentsView() {
  const { req, state, setView, focusDoc } = useSupplier();
  const docRevision = state.status === "revision_requested" && state.unlockedDocs.length > 0;
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Supporting documents</Eyebrow>
        <h1 className="mt-2 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">Attach your certificates</h1>
        <p className="mt-2 max-w-2xl text-sm text-black/50">{req.exporterName} asked for these alongside the carbon data. Required ones are flagged; optional ones help but won’t block you. You can attach several files to each.</p>
      </div>

      {docRevision && (
        <Card className="border-[#2563eb]/30 bg-[#eff6ff] p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg bg-[#dbeafe] text-[#2563eb]">
              <PenLine size={15} strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex-1 text-[13px] leading-relaxed text-black/65">
              <span className="text-black/80">{req.exporterName} asked you to update {state.unlockedDocs.length} document{state.unlockedDocs.length === 1 ? "" : "s"}.</span> {state.unlockedDocs.length === 1 ? "It's" : "They're"} outlined in blue below — add or remove files there. Everything else stays locked.
              <Button size="sm" className="mt-3" onClick={() => focusDoc(state.unlockedDocs[0])}>
                Take me to the document <ArrowRight size={13} strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {req.documents.map((d) => (
          <DocRow key={d.id} d={d} />
        ))}
      </div>
      <p className="text-[12px] text-black/35">Files stay in your browser for this demo — names and sizes are recorded so you can see the flow; nothing is uploaded to a server.</p>

      <div className="flex items-center justify-between border-t border-black/[0.06] pt-5">
        <Button variant="ghost" size="sm" onClick={() => setView("form")}>
          <ArrowLeft size={14} strokeWidth={1.5} /> Questionnaire
        </Button>
        <Button size="sm" onClick={() => setView("team")}>
          Continue to team <ArrowRight size={14} strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
}

/* ════════════════════════ Team / seats ════════════════════════ */
export function TeamView() {
  const { req, state, sections, addSeat, removeSeat, toggleAssign, setView, goToCheck, hasAnyInput } = useSupplier();
  const [form, setForm] = React.useState({ name: "", email: "", department: DEPARTMENTS[0] });
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const copyTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const valid = form.name.trim() && /.+@.+\..+/.test(form.email);

  const copyLink = (seatId: string) => {
    const url = typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}?seat=${seatId}` : "";
    if (url && navigator.clipboard) navigator.clipboard.writeText(url);
    setCopiedId(seatId);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopiedId(null), 1900);
    toast({ message: "Scoped link copied", detail: "Send it to your colleague — it opens only their assigned sections.", tone: "ok" });
  };

  React.useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Team & departments</Eyebrow>
        <h1 className="mt-2 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">Split the work by department</h1>
        <p className="mt-2 max-w-2xl text-sm text-black/50">
          This data lives in different teams — emissions with ESG, carbon price with finance, certificates with QA. Invite a colleague and assign the sections that are theirs. They get a link to just their part; you stay in control and sign at the end.
        </p>
      </div>

      {/* invite */}
      <Card className="p-5">
        <Eyebrow>Invite a colleague</Eyebrow>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
          <Field label="Name">
            <input className={inputClass} value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="Full name" />
          </Field>
          <Field label="Email">
            <input className={inputClass} value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} placeholder="name@company.com" />
          </Field>
          <label className="block">
            <span className="mb-2 block text-[11px] uppercase tracking-[0.1em] text-black/55">Department</span>
            <Select value={form.department} onChange={(v) => setForm((s) => ({ ...s, department: v }))} options={DEPARTMENTS.map((d) => ({ value: d, label: d }))} className="w-full" ariaLabel="Department" />
          </label>
          <Button
            size="sm"
            disabled={!valid}
            onClick={() => {
              addSeat(form);
              toast({ message: `${form.name} invited`, detail: "Assign their sections below.", tone: "ok" });
              setForm({ name: "", email: "", department: DEPARTMENTS[0] });
            }}
          >
            <Plus size={13} strokeWidth={1.5} /> Invite
          </Button>
        </div>
      </Card>

      {/* seats + assignment */}
      {state.seats.length === 0 ? (
        <Card warm className="flex items-center gap-3 p-5 text-sm text-black/50">
          <Users size={18} strokeWidth={1.5} className="text-black/35" />
          No colleagues yet — you can fill everything yourself, or invite the right people above.
        </Card>
      ) : (
        <div className="space-y-3">
          {state.seats.map((seat) => (
            <Card key={seat.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#111] text-[11px] font-medium text-white">
                    {seat.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <div className="text-sm text-black/80">{seat.name}</div>
                    <div className="text-[11px] text-black/40">{seat.email} · {seat.department}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyLink(seat.id)}
                    style={{ transitionTimingFunction: "var(--ease-signature)" }}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] transition-all duration-300",
                      copiedId === seat.id
                        ? "border-[#16a34a]/30 bg-[#16a34a]/10 text-[#15803d]"
                        : "border-black/10 text-black/55 hover:border-black/25 hover:text-black",
                    )}
                  >
                    <span className="relative grid h-3 w-3 place-items-center">
                      <Link2 size={12} strokeWidth={1.5} className={cn("absolute transition-all duration-300", copiedId === seat.id ? "scale-50 opacity-0" : "scale-100 opacity-100")} />
                      <Check size={12} strokeWidth={2.5} className={cn("absolute transition-all duration-300", copiedId === seat.id ? "scale-100 opacity-100" : "scale-50 opacity-0")} />
                    </span>
                    {copiedId === seat.id ? "Copied!" : "Copy link"}
                  </button>
                  <button onClick={() => removeSeat(seat.id)} className="text-black/30 hover:text-[#dc2626]" aria-label="Remove colleague">
                    <Trash2 size={15} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
              <div className="mt-3 border-t border-black/[0.05] pt-3">
                <div className="mb-2 font-pixel text-[10px] uppercase tracking-[0.16em] text-black/40">Assigned sections</div>
                <div className="flex flex-wrap gap-1.5">
                  {sections.map((s: SupplierSection) => {
                    const on = seat.sections.includes(s.key);
                    return (
                      <button
                        key={s.key}
                        onClick={() => toggleAssign(seat.id, s.key)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                          on ? "border-black/25 bg-[#f0eee8] text-black/80" : "border-black/10 text-black/50 hover:border-black/25 hover:text-black",
                        )}
                      >
                        <span className={cn("grid h-4 w-4 place-items-center rounded-full", on ? "bg-[#111] text-white" : "border border-black/20")}>{on && <Check size={10} strokeWidth={3} />}</span>
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-black/[0.06] pt-5">
        <Button variant="ghost" size="sm" onClick={() => setView("documents")}>
          <ArrowLeft size={14} strokeWidth={1.5} /> Documents
        </Button>
        <Button size="sm" onClick={goToCheck} disabled={!hasAnyInput}>
          Run quality check <ArrowRight size={14} strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
}

/* ════════════════════════ AI quality check ════════════════════════ */
const SEV_META: Record<Severity, { tone: "ok" | "warn" | "err"; icon: React.ElementType; label: string }> = {
  pass: { tone: "ok", icon: CircleCheck, label: "Passed" },
  warning: { tone: "warn", icon: TriangleAlert, label: "Warning" },
  critical: { tone: "err", icon: CircleX, label: "Critical" },
};

export function CheckView() {
  const { runCheck, setView, state, focusField, focusDoc, goToCheck, requiredComplete, missingRequiredCount } = useSupplier();
  const [result, setResult] = React.useState<CheckResult | null>(state.lastCheck);
  const [running, setRunning] = React.useState(false);

  const run = React.useCallback(() => {
    setRunning(true);
    // brief delay so the "checking…" state is visible — feels like real work
    setTimeout(() => {
      setResult(runCheck());
      setRunning(false);
    }, 650);
  }, [runCheck]);

  React.useEffect(() => {
    // Never spend an AI run while required fields are still empty.
    if (requiredComplete && !state.lastCheck) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scoreTone = (s: number) => (s >= 85 ? "#047857" : s >= 60 ? "#b45309" : "#dc2626");

  // Gate: incomplete required data — lead the supplier back to fill it in rather
  // than running (and charging for) the AI check on data that can't pass anyway.
  if (!requiredComplete) {
    return (
      <div className="mx-auto max-w-xl py-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-black/10 bg-white text-black/45">
          <Sparkles size={24} strokeWidth={1.5} />
        </span>
        <h1 className="mt-5 font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#111]">Finish the required fields first</h1>
        <p className="mt-2 text-sm text-black/50">
          The AI quality check runs once every required field has a value — that way it never burns a run on data that isn’t ready yet. You have{" "}
          <span className="text-[#b45309]">{missingRequiredCount} required field{missingRequiredCount === 1 ? "" : "s"}</span> left.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={goToCheck}>
            Take me to the first one <ArrowRight size={15} strokeWidth={1.5} />
          </Button>
          <Button variant="secondary" size="md" onClick={() => setView("form")}>
            Back to questionnaire
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow>Automatic quality check</Eyebrow>
          <h1 className="mt-2 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">AI checks your data before you sign</h1>
          <p className="mt-2 max-w-2xl text-sm text-black/50">
            Completeness, validation, anomaly detection and standardization run automatically. Critical issues must be fixed; warnings you can acknowledge and proceed.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={run} disabled={running}>
          <Sparkles size={14} strokeWidth={1.5} /> {running ? "Checking…" : "Re-run"}
        </Button>
      </div>

      {running && (
        <Card className="flex items-center gap-3 p-6 text-sm text-black/55">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#60a5fa]" />
          Running quality checks across {CATEGORIES.length} categories…
        </Card>
      )}

      {result && !running && (
        <>
          {/* score + category summary */}
          <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
            <Card className="flex flex-col items-center justify-center p-6 text-center">
              <div className="font-[family-name:var(--font-plex)] text-5xl font-light" style={{ color: scoreTone(result.score) }}>
                {result.score}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.1em] text-black/40">data quality score</div>
              <div className="mt-3 flex items-center gap-2 text-[11px]">
                <span className="text-[#dc2626]">{result.critical} critical</span>
                <span className="text-black/20">·</span>
                <span className="text-[#b45309]">{result.warnings} warnings</span>
              </div>
            </Card>
            <Card className="grid grid-cols-2 gap-px overflow-hidden bg-black/[0.06] p-0">
              {CATEGORIES.map((cat) => {
                const items = result.findings.filter((f) => f.category === cat);
                const crit = items.filter((i) => i.severity === "critical").length;
                const warn = items.filter((i) => i.severity === "warning").length;
                const tone = crit ? "err" : warn ? "warn" : "ok";
                return (
                  <div key={cat} className="bg-white p-4">
                    <div className="flex items-center gap-2">
                      <StatusDot tone={tone} />
                      <span className="text-[13px] text-black/75">{cat}</span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-black/45">{CATEGORY_BLURB[cat]}</p>
                    <div className="mt-2 font-mono text-[10px] text-black/40">{crit ? `${crit} critical` : warn ? `${warn} to review` : "clear"}</div>
                  </div>
                );
              })}
            </Card>
          </div>

          {/* findings */}
          <div className="space-y-2.5">
            {(["critical", "warning", "pass"] as Severity[]).map((sev) => {
              const items = result.findings.filter((f) => f.severity === sev);
              if (items.length === 0) return null;
              const m = SEV_META[sev];
              return (
                <div key={sev}>
                  <div className="mb-1.5 flex items-center gap-2 font-pixel text-[10px] uppercase tracking-[0.16em] text-black/40">
                    <StatusDot tone={m.tone} /> {m.label} · {items.length}
                  </div>
                  <Card className="divide-y divide-black/[0.05] p-0">
                    {items.map((f) => {
                      const Icon = m.icon;
                      return (
                        <div key={f.id} className="flex items-start gap-3 px-4 py-3">
                          <Icon size={15} strokeWidth={1.5} className={cn("mt-0.5 flex-none", m.tone === "err" ? "text-[#dc2626]" : m.tone === "warn" ? "text-[#b45309]" : "text-[#047857]")} />
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] text-black/75">{f.title}</div>
                            <div className="text-[12px] text-black/45">{f.detail}</div>
                          </div>
                          {f.severity !== "pass" && (f.fieldId || f.docId || f.section) && (
                            <button
                              onClick={() => (f.fieldId ? focusField(valueKey(f.fieldId, f.productId)) : f.docId ? focusDoc(f.docId) : setView("documents"))}
                              className="inline-flex flex-none items-center gap-1 rounded-full border border-black/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] text-black/50 hover:border-black/25 hover:text-black"
                            >
                              {f.fieldId ? "take me there" : "upload"} <ArrowRight size={11} strokeWidth={1.8} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </Card>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-5">
            <Button variant="ghost" size="sm" onClick={() => setView("form")}>
              <ArrowLeft size={14} strokeWidth={1.5} /> Back to questionnaire
            </Button>
            {result.passable ? (
              <Button onClick={() => setView("submit")}>
                Continue to sign & submit <ArrowRight size={15} strokeWidth={1.5} />
              </Button>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-xl border border-[#dc2626]/20 bg-[#fef2f2] px-4 py-2.5 text-[12px] text-[#dc2626]">
                <CircleX size={14} strokeWidth={1.5} /> Fix {result.critical} critical issue{result.critical === 1 ? "" : "s"} to submit
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════ Review + e-sign + submit ════════════════════════ */
export function SubmitView() {
  const { req, state, submit, setView, getValue, totalRequiredCount } = useSupplier();
  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState("");
  const [attest, setAttest] = React.useState(false);
  // Pure compute — never call the state-mutating runCheck() during render.
  const result = React.useMemo(
    () => state.lastCheck ?? runQualityCheck(req, state.values, state.docs),
    [state.lastCheck, req, state.values, state.docs],
  );
  const warnings = result.warnings;
  const [ackWarnings, setAckWarnings] = React.useState(false);

  const canSign = result.passable && name.trim() && role.trim() && attest && (warnings === 0 || ackWarnings);
  const mandatoryDocs = req.documents.filter((d) => d.required);
  const mandatoryDocsDone = mandatoryDocs.filter((d) => state.docs[d.id]?.status === "uploaded").length;

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Review & submit</Eyebrow>
        <h1 className="mt-2 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">One last look, then sign</h1>
        <p className="mt-2 max-w-2xl text-sm text-black/50">This is what {req.exporterName} receives. Submitting locks it as a version with a timestamped audit trail.</p>
      </div>

      {!result.passable && (
        <Card className="flex items-center justify-between gap-3 border-[#dc2626]/20 bg-[#fef2f2] p-4">
          <span className="text-[13px] text-[#dc2626]">{result.critical} critical issue{result.critical === 1 ? "" : "s"} must be fixed before you can submit.</span>
          <Button variant="secondary" size="sm" onClick={() => setView("check")}>
            View issues
          </Button>
        </Card>
      )}

      {/* AI validation summary — the checklist the exporter's spec calls for right
          before the final submit button: what's complete, and what's flagged. */}
      {result.passable && (
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Sparkles size={15} strokeWidth={1.5} className="text-black/55" />
            <Eyebrow>AI validation summary</Eyebrow>
          </div>
          <div className="mt-3 space-y-1.5 text-[13px]">
            <div className="flex items-center gap-2 text-[#047857]"><CircleCheck size={14} strokeWidth={1.5} /> {totalRequiredCount}/{totalRequiredCount} required fields completed</div>
            {mandatoryDocsDone === mandatoryDocs.length ? (
              <div className="flex items-center gap-2 text-[#047857]"><CircleCheck size={14} strokeWidth={1.5} /> {mandatoryDocsDone}/{mandatoryDocs.length} mandatory documents uploaded</div>
            ) : (
              <div className="flex items-center gap-2 text-[#b45309]"><TriangleAlert size={14} strokeWidth={1.5} /> {mandatoryDocsDone}/{mandatoryDocs.length} mandatory documents uploaded</div>
            )}
            <div className="flex items-center gap-2 text-[#047857]"><CircleCheck size={14} strokeWidth={1.5} /> Units validated</div>
            {warnings > 0 ? (
              <div className="flex items-center gap-2 text-[#b45309]"><TriangleAlert size={14} strokeWidth={1.5} /> {warnings} warning{warnings === 1 ? "" : "s"} detected</div>
            ) : (
              <div className="flex items-center gap-2 text-[#047857]"><CircleCheck size={14} strokeWidth={1.5} /> No warnings</div>
            )}
          </div>
        </Card>
      )}

      {/* data summary */}
      <Card className="p-5">
        <Eyebrow>Emissions summary</Eyebrow>
        <div className="mt-3 space-y-2.5">
          {req.products.map((rp) => {
            const total = getValue("total-emissions", rp.product.id) || "—";
            const method = getValue("method", rp.product.id);
            return (
              <div key={rp.product.id} className="flex items-center justify-between rounded-xl border border-black/[0.06] bg-[#fafaf8] px-4 py-3">
                <div>
                  <div className="text-[14px] text-black/80">{rp.product.name}</div>
                  <div className="font-mono text-[11px] text-black/40">CN {rp.product.cnCode} · {rp.totalTonnes.toLocaleString("en-US")} t</div>
                </div>
                <div className="text-right">
                  <div className="font-[family-name:var(--font-plex)] text-xl font-light text-[#111]">{total} <span className="text-sm text-black/40">tCO₂e/t</span></div>
                  <div className="text-[10px] uppercase tracking-[0.1em] text-black/40">{method === "default" ? "default factors" : method === "actual" ? "actual data" : "method —"}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-black/50">
          <span>Documents attached: {req.documents.filter((d) => state.docs[d.id]?.status === "uploaded").length}/{req.documents.length}</span>
          <span>Quality score: <span style={{ color: result.score >= 85 ? "#047857" : result.score >= 60 ? "#b45309" : "#dc2626" }}>{result.score}</span></span>
          <span>{warnings} warning{warnings === 1 ? "" : "s"} flagged</span>
        </div>
      </Card>

      {/* e-signature */}
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <PenLine size={15} strokeWidth={1.5} className="text-black/55" />
          <Eyebrow>Electronic signature</Eyebrow>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Full name">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
          </Field>
          <Field label="Role / title">
            <input className={inputClass} value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Sustainability Manager" />
          </Field>
        </div>
        <label className="mt-3 flex cursor-pointer items-start gap-2.5">
          <span className={cn("mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-md border", attest ? "border-transparent bg-[#111] text-white" : "border-black/20")} onClick={() => setAttest((v) => !v)}>
            {attest && <Check size={12} strokeWidth={2.5} />}
          </span>
          <span className="text-[13px] leading-relaxed text-black/60" onClick={() => setAttest((v) => !v)}>
            I confirm the information is accurate and complete to the best of my knowledge, and I’m authorised to submit it on behalf of {req.supplierName}.
          </span>
        </label>
        {warnings > 0 && (
          <label className="mt-2.5 flex cursor-pointer items-start gap-2.5">
            <span className={cn("mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-md border", ackWarnings ? "border-transparent bg-[#111] text-white" : "border-black/20")} onClick={() => setAckWarnings((v) => !v)}>
              {ackWarnings && <Check size={12} strokeWidth={2.5} />}
            </span>
            <span className="text-[13px] leading-relaxed text-black/60" onClick={() => setAckWarnings((v) => !v)}>
              I’ve reviewed the {warnings} warning{warnings === 1 ? "" : "s"} from the quality check and confirm the data is correct as entered.
            </span>
          </label>
        )}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-5">
        <Button variant="ghost" size="sm" onClick={() => setView(warnings > 0 ? "form" : "check")}>
          <ArrowLeft size={14} strokeWidth={1.5} /> {warnings > 0 ? "Back to edit" : "Quality check"}
        </Button>
        <Button
          disabled={!canSign}
          onClick={() => {
            submit(name.trim(), role.trim());
            toast({ message: "Submitted", detail: `Sent to ${req.exporterName} with a timestamped audit trail.`, tone: "ok" });
            setView("done");
          }}
        >
          <ShieldCheck size={15} strokeWidth={1.5} /> {warnings > 0 ? "Submit anyway" : "Sign & submit"}
        </Button>
      </div>
    </div>
  );
}

/* ════════════════════════ Done / versions / revision ════════════════════════ */
export function DoneView() {
  const { req, state, setView, simulateRevision } = useSupplier();
  const latest = state.versions[state.versions.length - 1];
  if (!latest) {
    return (
      <div className="py-16 text-center text-sm text-black/45">
        Nothing submitted yet.
        <div className="mt-4">
          <Button size="sm" onClick={() => setView("overview")}>Back to overview</Button>
        </div>
      </div>
    );
  }
  const submittedAt = new Date(latest.submittedAt);
  const receiptId = `CTR-${req.declId.toUpperCase()}-${req.supplierRef.replace("#", "")}-V${latest.n}`;

  const EVENT_TONE: Record<string, "ok" | "info" | "warn" | "muted"> = {
    doc_upload: "info",
    doc_remove: "muted",
    check_run: "info",
    submit: "ok",
    revision_requested: "warn",
  };
  // Real, persisted events (lib/supplier-store.ts AuditEvent) — every edit, upload,
  // check run, signature and revision is logged as it happens, not derived here.
  const trail = [
    ...state.events.map((e) => ({ when: new Date(e.at), text: e.text, tone: EVENT_TONE[e.kind] ?? "muted" })),
    { when: submittedAt, text: `${req.exporterName} notified`, tone: "muted" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#047857]/15 bg-[#ecfdf5] p-6 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-[#047857]">
          <Check size={26} strokeWidth={1.5} />
        </span>
        <h1 className="mt-4 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">Submitted as Version {latest.n}</h1>
        <p className="mt-2 text-sm text-black/55">
          Sent to {req.exporterName} — they’ll review it and only contact you if something needs a quick fix. Nothing to pay, no account to manage.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 font-mono text-[11px] text-black/55">
          receipt {receiptId}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          [`${latest.score}`, "Quality score"],
          [`${latest.warnings}`, "Warnings flagged"],
          [submittedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }), "Submitted"],
        ].map(([v, l]) => (
          <Card key={l} className="p-5 text-center">
            <div className="font-[family-name:var(--font-plex)] text-2xl font-light text-[#111]">{v}</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.1em] text-black/40">{l}</div>
          </Card>
        ))}
      </div>

      {/* audit trail */}
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <History size={15} strokeWidth={1.5} className="text-black/55" />
          <Eyebrow>Audit trail</Eyebrow>
        </div>
        <div className="mt-3 space-y-2.5">
          {trail.map((t, i) => (
            <div key={i} className="flex items-center gap-3">
              <StatusDot tone={t.tone} />
              <span className="text-[13px] text-black/65">{t.text}</span>
              <span className="ml-auto font-mono text-[11px] text-black/35">{t.when.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* version history */}
      {state.versions.length > 1 && (
        <Card className="p-5">
          <Eyebrow>Version history</Eyebrow>
          <div className="mt-3 divide-y divide-black/[0.05]">
            {state.versions.map((v) => (
              <div key={v.n} className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-black/70">Version {v.n}</span>
                <span className="text-black/45">{new Date(v.submittedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                <span className="font-mono text-black/45">score {v.score}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* what's next + demo revision */}
      <Card warm className="p-5">
        <Eyebrow>What happens next</Eyebrow>
        <ol className="mt-3 space-y-2 text-[13px] text-black/55">
          <li className="flex gap-2"><span className="font-mono text-black/30">1</span> {req.exporterName} reviews your submission and the AI summary.</li>
          <li className="flex gap-2"><span className="font-mono text-black/30">2</span> They approve it, or request a revision on specific fields.</li>
          <li className="flex gap-2"><span className="font-mono text-black/30">3</span> If a revision is needed, you’ll get an email — only the flagged fields unlock.</li>
        </ol>
        <div className="mt-4 rounded-xl border border-dashed border-black/15 p-3">
          <div className="text-[11px] uppercase tracking-[0.1em] text-black/35">Demo</div>
          <div className="mt-1 flex items-center justify-between gap-3">
            <span className="text-[12px] text-black/50">Simulate the exporter requesting a revision to see the resubmission loop.</span>
            <Button variant="secondary" size="sm" onClick={simulateRevision}>
              Request revision
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
