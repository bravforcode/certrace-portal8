"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Lock,
  Search,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Mail,
  Building2,
  UserRound,
  Globe,
  Clock,
  Bell,
  Scale,
} from "lucide-react";
import { Card, Button, Eyebrow, Chip, Field, inputClass, cn } from "@/components/ui";
import { Select, DatePicker } from "@/components/controls";
import { toast } from "@/components/toast";
import {
  PURPOSES,
  type Purpose,
  CBAM_PERIODS,
  BUYER_PERIODS,
  type PeriodOption,
  PRODUCT_CATALOG,
  getCatalogProduct,
  productTemplate,
  PRODUCT_CATEGORIES,
  type ProductCategory,
  resolveCbamFields,
  scope2Treatment,
  PRODUCT_UNITS,
  DEFAULT_UNIT,
  ADDITIONAL_REQUESTS,
  REGULATIONS,
  getRegulation,
  JURISDICTIONS,
  getJurisdiction,
  DESTINATION_MARKETS,
  getDestination,
  destinationsForRegulation,
  STATUS_META,
} from "@/lib/config";
import { SUPPLIER_DIRECTORY, type DirectorySupplier, ORG } from "@/lib/data";
import { getDraft, saveDraft, deleteDraft, newDraftId, type Lot, type Mapping, type WizardSnapshot } from "@/lib/drafts";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = ["2024", "2025", "2026", "2027"];
const QUARTERS = [
  { value: "Q1", label: "Q1 (Jan–Mar)" },
  { value: "Q2", label: "Q2 (Apr–Jun)" },
  { value: "Q3", label: "Q3 (Jul–Sep)" },
  { value: "Q4", label: "Q4 (Oct–Dec)" },
];
const HALVES = [
  { value: "H1", label: "H1 (Jan–Jun)" },
  { value: "H2", label: "H2 (Jul–Dec)" },
];

const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random()}`);
const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
const newLot = (): Lot => ({ id: uid(), qty: "", unit: DEFAULT_UNIT, from: "", to: "", notes: "" });
const lotValid = (l: Lot) => Number(l.qty) > 0 && Boolean(l.unit);

/* ── small shared bits ───────────────────────────────────── */
function notify(name: string) {
  toast({ message: `Added to the ${name} waitlist.`, tone: "info", detail: "We'll email you the moment it opens." });
}

function SectionIntro({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <div>
      <Eyebrow>{kicker}</Eyebrow>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-black/50">{children}</p>
    </div>
  );
}

function SelectCard({ active, onClick, disabled, children, className }: { active: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "rounded-2xl border bg-white p-5 text-left transition-colors",
        active ? "border-black/25 bg-[#f0eee8]" : "border-black/[0.07]",
        disabled ? "cursor-not-allowed opacity-70" : "hover:border-black/15",
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ── responsive stepper (equal-width, never scrolls) ─────── */
function Stepper({ steps, step, goto }: { steps: { key: string; label: string }[]; step: number; goto: (i: number) => void }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.12em] text-black/40">
          Step {step + 1} of {steps.length}
        </span>
        <span className="font-pixel text-[11px] uppercase tracking-[0.16em] text-black/65 sm:hidden">{steps[step].label}</span>
      </div>
      <div className="flex gap-1.5">
        {steps.map((s, i) => {
          const reached = i <= step;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => i <= step && goto(i)}
              disabled={i > step}
              className="group min-w-0 flex-1 text-left"
            >
              <span className={cn("block h-1 overflow-hidden rounded-full transition-colors", reached ? "bg-[#111]" : "bg-black/[0.1]")} />
              <span className={cn("mt-2 hidden truncate text-[10px] uppercase tracking-[0.08em] sm:block", i === step ? "text-black/70" : "text-black/30")}>
                {s.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════ */
export default function NewDeclarationPage() {
  const router = useRouter();

  const [step, setStep] = React.useState(0);
  // regulation & route — the two scoping steps that frame everything downstream
  const [regulation, setRegulation] = React.useState("cbam");
  const [origin, setOrigin] = React.useState(ORG.origin);
  const [destination, setDestination] = React.useState("EU");
  const [purpose, setPurpose] = React.useState<Purpose>("cbam");
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");

  // period
  const [periodId, setPeriodId] = React.useState("annual");
  const [year, setYear] = React.useState("2026");
  const [quarter, setQuarter] = React.useState("Q2");
  const [half, setHalf] = React.useState("H1");
  const [month, setMonth] = React.useState("January");
  const [rangeStart, setRangeStart] = React.useState("");
  const [rangeEnd, setRangeEnd] = React.useState("");

  // products + classification
  const [query, setQuery] = React.useState("");
  const [catFilter, setCatFilter] = React.useState<ProductCategory | "all">("all");
  const [products, setProducts] = React.useState<string[]>([]);
  // which CBAM report fields are included. Defaults are derived from the product
  // selection + purpose in an effect below, so the checklist always reflects the
  // real applicable requirements for the chosen goods.
  const [reportFields, setReportFields] = React.useState<Record<string, boolean>>({});

  // documents (buyer)
  const [extras, setExtras] = React.useState<string[]>([]);

  // suppliers
  const [directory, setDirectory] = React.useState<DirectorySupplier[]>(SUPPLIER_DIRECTORY);
  const [mapping, setMapping] = React.useState<Mapping>({});
  const [inviteFor, setInviteFor] = React.useState<string | null>(null);
  const [inv, setInv] = React.useState({ company: "", contact: "", email: "", country: "" });

  // deadline
  const [deadline, setDeadline] = React.useState("2026-07-31");
  const [reminders, setReminders] = React.useState({ d7: true, d3: true, due: true });
  const [notes, setNotes] = React.useState("");

  // draft — id persists across saves so re-closing updates the same draft
  const draftId = React.useRef<string | null>(null);
  const hydrated = React.useRef(false);

  // Resume a draft when opened as /declarations/new?draft=<id>.
  React.useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const id = new URLSearchParams(window.location.search).get("draft");
    if (!id) return;
    const d = getDraft(id);
    if (!d) return;
    const s = d.snapshot;
    draftId.current = d.id;
    setRegulation(s.regulation ?? "cbam");
    setOrigin(s.origin ?? ORG.origin);
    setDestination(s.destination ?? "EU");
    setPurpose(s.purpose);
    setName(s.name);
    setDescription(s.description);
    setPeriodId(s.periodId);
    setYear(s.year);
    setQuarter(s.quarter);
    setHalf(s.half);
    setMonth(s.month);
    setRangeStart(s.rangeStart);
    setRangeEnd(s.rangeEnd);
    setProducts(s.products);
    setExtras(s.extras);
    setDirectory(s.directory);
    setMapping(s.mapping);
    setReportFields(s.reportFields);
    setDeadline(s.deadline);
    setReminders(s.reminders);
    setNotes(s.notes);
    setStep(s.step);
  }, []);

  // regulation & route — derived
  const activeRegulation = getRegulation(regulation) ?? REGULATIONS[0];
  const originJ = getJurisdiction(origin);
  const destinationMarket = getDestination(destination) ?? DESTINATION_MARKETS[0];
  const eligibleDestinations = React.useMemo(() => destinationsForRegulation(regulation), [regulation]);
  // keep the destination valid for the chosen regulation (e.g. switching off CBAM)
  React.useEffect(() => {
    if (!eligibleDestinations.some((d) => d.code === destination)) {
      setDestination(eligibleDestinations[0]?.code ?? "EU");
    }
  }, [eligibleDestinations, destination]);

  // derived
  const periodOptions = purpose === "cbam" ? CBAM_PERIODS : BUYER_PERIODS;
  const activePeriod = periodOptions.find((p) => p.id === periodId) ?? periodOptions[0];

  const steps = React.useMemo(() => {
    const base = [
      { key: "regulation", label: "Regulation" },
      { key: "route", label: "Route" },
      { key: "purpose", label: "Purpose" },
      { key: "period", label: "Period" },
      { key: "products", label: "Products" },
      { key: "classify", label: "Classification" },
    ];
    if (purpose === "buyer") base.push({ key: "documents", label: "Documents" });
    base.push({ key: "suppliers", label: "Suppliers" }, { key: "deadline", label: "Deadline" }, { key: "review", label: "Review" });
    return base;
  }, [purpose]);
  const current = steps[Math.min(step, steps.length - 1)].key;

  React.useEffect(() => {
    if (!periodOptions.some((p) => p.id === periodId)) setPeriodId(periodOptions[0].id);
  }, [periodOptions, periodId]);

  const periodSummary = React.useMemo(() => {
    switch (activePeriod.picker) {
      case "year":
        return `${activePeriod.label} ${year}`;
      case "quarter":
        return `${quarter} ${year}`;
      case "half":
        return `${half} ${year}`;
      case "month":
        return `${month} ${year}`;
      case "range":
        return rangeStart && rangeEnd
          ? `${new Date(rangeStart).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} → ${new Date(rangeEnd).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
          : "Custom range";
      default:
        return "One-time";
    }
  }, [activePeriod, year, quarter, half, month, rangeStart, rangeEnd]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCT_CATALOG.filter((p) => {
      if (catFilter !== "all" && p.category !== catFilter) return false;
      if (!q) return true;
      return [p.name, p.cnCode, p.hsCode, p.category, p.group, ...p.keywords].join(" ").toLowerCase().includes(q);
    });
  }, [query, catFilter]);

  // Classification — the real, applicable CBAM checklist for the chosen goods.
  const selectedProducts = React.useMemo(
    () => products.map(getCatalogProduct).filter((p): p is NonNullable<typeof p> => Boolean(p)),
    [products],
  );
  const resolvedFields = React.useMemo(() => resolveCbamFields(selectedProducts), [selectedProducts]);
  const scope2 = React.useMemo(() => scope2Treatment(selectedProducts), [selectedProducts]);
  const requiredCount = React.useMemo(() => resolvedFields.filter((f) => f.required).length, [resolvedFields]);
  const isIncluded = React.useCallback(
    (id: string) => {
      const f = resolvedFields.find((x) => x.id === id);
      if (!f) return false;
      if (purpose === "cbam" && f.required) return true;
      return Boolean(reportFields[id]);
    },
    [resolvedFields, purpose, reportFields],
  );
  const includedFields = React.useMemo(() => resolvedFields.filter((f) => isIncluded(f.id)), [resolvedFields, isIncluded]);
  const fieldGroups = React.useMemo(() => Array.from(new Set(resolvedFields.map((f) => f.group))), [resolvedFields]);

  // Fill in defaults for any newly-applicable field without disturbing existing
  // choices (additive → safe for draft hydration). CBAM: everything on, required
  // forced on. Buyer Request: only recommended fields on. Switching purpose
  // clears the map (see the purpose cards) so defaults re-seed for the new mode.
  React.useEffect(() => {
    setReportFields((prev) => {
      const next = { ...prev };
      for (const f of resolvedFields) {
        if (!(f.id in next)) next[f.id] = purpose === "cbam" ? true : Boolean(f.buyerRecommended);
        if (purpose === "cbam" && f.required) next[f.id] = true;
      }
      return next;
    });
  }, [resolvedFields, purpose]);

  const uniqueSuppliers = React.useMemo(() => {
    const s = new Set<string>();
    Object.values(mapping).forEach((entries) => entries.forEach((e) => s.add(e.supplierId)));
    return s.size;
  }, [mapping]);
  const totalLots = React.useMemo(() => Object.values(mapping).reduce((a, entries) => a + entries.reduce((b, e) => b + e.lots.length, 0), 0), [mapping]);
  const totalTonnes = React.useMemo(() => {
    let t = 0;
    Object.values(mapping).forEach((entries) => entries.forEach((e) => e.lots.forEach((l) => {
      if (l.unit === "tonnes (t)") t += Number(l.qty) || 0;
    })));
    return t;
  }, [mapping]);
  const estDays = Math.min(45, 7 + uniqueSuppliers * 2 + Math.ceil(products.length / 3));

  // actions
  const toggleProduct = (id: string) =>
    setProducts((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const moveProduct = (id: string, dir: -1 | 1) =>
    setProducts((p) => {
      const i = p.indexOf(id);
      const j = i + dir;
      if (j < 0 || j >= p.length) return p;
      const next = [...p];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const addSupplier = (productId: string, supplierId: string) =>
    setMapping((m) => {
      const entries = m[productId] ?? [];
      if (entries.some((e) => e.supplierId === supplierId)) return m;
      return { ...m, [productId]: [...entries, { supplierId, lots: [newLot()] }] };
    });
  const removeSupplier = (productId: string, supplierId: string) =>
    setMapping((m) => ({ ...m, [productId]: (m[productId] ?? []).filter((e) => e.supplierId !== supplierId) }));
  const patchLot = (productId: string, supplierId: string, lotId: string, patch: Partial<Lot>) =>
    setMapping((m) => ({
      ...m,
      [productId]: (m[productId] ?? []).map((e) =>
        e.supplierId === supplierId ? { ...e, lots: e.lots.map((l) => (l.id === lotId ? { ...l, ...patch } : l)) } : e,
      ),
    }));
  const addLot = (productId: string, supplierId: string) =>
    setMapping((m) => ({
      ...m,
      [productId]: (m[productId] ?? []).map((e) => (e.supplierId === supplierId ? { ...e, lots: [...e.lots, newLot()] } : e)),
    }));
  const removeLot = (productId: string, supplierId: string, lotId: string) =>
    setMapping((m) => ({
      ...m,
      [productId]: (m[productId] ?? []).map((e) =>
        e.supplierId === supplierId ? { ...e, lots: e.lots.filter((l) => l.id !== lotId) } : e,
      ),
    }));

  const inviteValid = Boolean(inv.company.trim() && inv.email.trim() && inv.contact.trim() && inv.country.trim());
  const submitInvite = () => {
    if (!inviteValid) return;
    const id = `new-${Date.now()}`;
    const supplier: DirectorySupplier = {
      id,
      company: inv.company.trim(),
      contact: inv.contact.trim(),
      email: inv.email.trim(),
      country: inv.country.trim(),
    };
    setDirectory((d) => [...d, supplier]);
    if (inviteFor) addSupplier(inviteFor, id);
    toast({ message: `${supplier.company} added`, detail: "Saved to your supplier directory — no onboarding needed.", tone: "ok" });
    setInv({ company: "", contact: "", email: "", country: "" });
    setInviteFor(null);
  };

  const supplierStats = (productId: string) => {
    const entries = mapping[productId] ?? [];
    return entries.map((e) => {
      const byUnit: Record<string, number> = {};
      e.lots.forEach((l) => {
        byUnit[l.unit] = (byUnit[l.unit] ?? 0) + (Number(l.qty) || 0);
      });
      const total = Object.entries(byUnit)
        .filter(([, v]) => v > 0)
        .map(([u, v]) => `${fmt(v)} ${u.split(" ")[0]}`)
        .join(" + ");
      return { entry: e, total: total || "—" };
    });
  };

  // gate
  const canContinue = (() => {
    switch (current) {
      case "regulation":
        return Boolean(getRegulation(regulation)?.available);
      case "route":
        return Boolean(getJurisdiction(origin)?.available && eligibleDestinations.some((d) => d.code === destination));
      case "purpose":
        return name.trim().length > 0;
      case "period":
        return activePeriod.picker === "range" ? Boolean(rangeStart && rangeEnd) : true;
      case "products":
        return products.length > 0;
      case "classify":
        // CBAM always has its mandatory fields; a Buyer Request needs ≥1 field.
        return purpose === "cbam" ? true : resolvedFields.some((f) => reportFields[f.id]);
      case "suppliers":
        return (
          products.length > 0 &&
          products.every((pid) => {
            const entries = mapping[pid] ?? [];
            return entries.length > 0 && entries.every((e) => e.lots.length > 0 && e.lots.every(lotValid));
          })
        );
      case "deadline":
        return Boolean(deadline);
      default:
        return true;
    }
  })();

  const next = () => setStep((s) => Math.min(steps.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const isLast = step === steps.length - 1;

  const buildSnapshot = (): WizardSnapshot => ({
    regulation, origin, destination,
    purpose, name, description, periodId, year, quarter, half, month, rangeStart, rangeEnd,
    products, reportFields, extras, directory, mapping, deadline, reminders, notes, step,
  });

  // Closing the wizard saves a draft (when anything meaningful was entered) so
  // nothing is lost, then returns to the list — standard SaaS behaviour.
  const handleClose = () => {
    const touched = Boolean(name.trim() || description.trim() || products.length || extras.length || Object.keys(mapping).length || step > 0);
    if (touched) {
      const id = draftId.current ?? newDraftId();
      draftId.current = id;
      saveDraft({
        id,
        updatedAt: Date.now(),
        snapshot: buildSnapshot(),
        display: {
          name: name.trim() || PURPOSES.find((p) => p.id === purpose)?.title || "Untitled declaration",
          purpose,
          productCount: products.length,
          supplierCount: uniqueSuppliers,
          period: periodSummary,
          deadline,
        },
      });
      toast({ message: "Saved as draft", detail: "Pick up where you left off from the Declarations list.", tone: "ok" });
    }
    router.push("/declarations");
  };

  const create = () => {
    if (draftId.current) deleteDraft(draftId.current); // it's a real declaration now
    toast({
      message: "Declaration created.",
      detail: `${name.trim() || "New declaration"} — ${uniqueSuppliers} suppliers · ${products.length} products · ${totalLots} lots queued.`,
      tone: "ok",
    });
    router.push("/declarations/cbam-2026-q2-steel");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-7 pb-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow>New declaration</Eyebrow>
          <h1 className="mt-2 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">Scope it once.</h1>
          <p className="mt-2 text-sm text-black/45">
            <span className="font-mono text-black/60">{originJ?.name ?? origin}</span> → <span className="font-mono text-black/60">{destinationMarket.name}</span> · {activeRegulation.short}. Suppliers fill a free guided form — no account, no seat.
          </p>
        </div>
        <button type="button" onClick={handleClose} aria-label="Close and save draft" className="mt-1 text-black/35 hover:text-black">
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>

      <Stepper steps={steps} step={step} goto={setStep} />

      {/* Body */}
      <div key={current} className="ct-enter min-h-[360px]">
        {/* 1 ─ REGULATION */}
        {current === "regulation" && (
          <div className="space-y-5">
            <SectionIntro kicker="Compliance regulation">
              Which regime are you reporting for? Certrace launched on CBAM — the obligation that bites first for exporters into the EU. The rest run on the same engine and switch on as their data models are verified.
            </SectionIntro>
            <div className="grid gap-3 sm:grid-cols-2">
              {REGULATIONS.map((r) => {
                const meta = STATUS_META[r.status];
                const live = r.available;
                const active = regulation === r.id;
                const inner = (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {!live && <Lock size={14} strokeWidth={1.5} className="text-black/30" />}
                        <span className="font-[family-name:var(--font-plex)] text-xl font-light text-[#111]">{r.short}</span>
                        {active && (
                          <span className="grid h-5 w-5 place-items-center rounded-full bg-[#111] text-white">
                            <Check size={12} strokeWidth={2} />
                          </span>
                        )}
                      </div>
                      <Chip tone={meta.tone}>{meta.label}</Chip>
                    </div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.1em] text-black/35">{r.full}</div>
                    <p className="mt-3 text-xs leading-relaxed text-black/50">{live ? `${r.cadence} · filed to ${r.authority}.` : r.soonNote}</p>
                  </>
                );
                return (
                  <SelectCard key={r.id} active={active} disabled={!live} onClick={() => live && setRegulation(r.id)}>
                    {inner}
                  </SelectCard>
                );
              })}
            </div>
          </div>
        )}

        {/* 2 ─ ROUTE */}
        {current === "route" && (
          <div className="space-y-5">
            <SectionIntro kicker="Export route">
              Where do you export from, and into which market? {activeRegulation.short} applies to goods entering the EU — your origin sets the emission-factor library Certrace calculates with.
            </SectionIntro>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
              {/* Origin */}
              <div className="space-y-2">
                <div className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/40">From — country of origin</div>
                {JURISDICTIONS.map((j) => {
                  const live = j.available;
                  const active = origin === j.code;
                  const inner = (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2.5">
                          <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-black/[0.04] font-mono text-[10px] text-black/45">{j.flag}</span>
                          <span className="truncate text-sm text-black/75">{j.name}</span>
                        </span>
                        {active ? (
                          <span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-[#111] text-white"><Check size={12} strokeWidth={2} /></span>
                        ) : !live ? (
                          <Lock size={13} strokeWidth={1.5} className="flex-none text-black/30" />
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-black/40">{live ? j.factorSet : j.note}</p>
                    </>
                  );
                  return live ? (
                    <button key={j.code} type="button" onClick={() => setOrigin(j.code)} aria-pressed={active} className={cn("w-full rounded-xl border bg-white p-3 text-left transition-colors", active ? "border-black/25 bg-[#f0eee8]" : "border-black/[0.07] hover:border-black/15")}>
                      {inner}
                    </button>
                  ) : (
                    <div key={j.code} className="rounded-xl border border-black/[0.06] bg-white p-3 opacity-75">
                      {inner}
                      <button type="button" onClick={() => notify(j.name)} className="mt-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-black/45 hover:text-black">
                        <Bell size={11} strokeWidth={1.5} /> notify me
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* arrow */}
              <div className="hidden items-center justify-center self-center sm:flex">
                <ArrowRight size={18} strokeWidth={1.5} className="text-black/25" />
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <div className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/40">To — destination market</div>
                {DESTINATION_MARKETS.map((d) => {
                  const enforces = d.regulations.includes(regulation);
                  const active = destination === d.code;
                  const inner = (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2.5">
                          <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-black/[0.04] font-mono text-[10px] text-black/45">{d.flag}</span>
                          <span className="truncate text-sm text-black/75">{d.name}</span>
                        </span>
                        {active ? (
                          <span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-[#111] text-white"><Check size={12} strokeWidth={2} /></span>
                        ) : !enforces ? (
                          <Lock size={13} strokeWidth={1.5} className="flex-none text-black/30" />
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-black/40">
                        {enforces ? `Enforces ${activeRegulation.short}` : `No ${activeRegulation.short} obligation here`}
                      </p>
                    </>
                  );
                  return enforces ? (
                    <button key={d.code} type="button" onClick={() => setDestination(d.code)} aria-pressed={active} className={cn("w-full rounded-xl border bg-white p-3 text-left transition-colors", active ? "border-black/25 bg-[#f0eee8]" : "border-black/[0.07] hover:border-black/15")}>
                      {inner}
                    </button>
                  ) : (
                    <div key={d.code} className="rounded-xl border border-black/[0.06] bg-white p-3 opacity-60">{inner}</div>
                  );
                })}
              </div>
            </div>

            <Card warm className="flex items-start gap-3 p-4">
              <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg border border-black/[0.08] bg-white text-black/55">
                <Globe size={15} strokeWidth={1.5} />
              </span>
              <p className="text-sm leading-relaxed text-black/55">
                <span className="text-black/75">{originJ?.name ?? origin}</span> → <span className="text-black/75">{destinationMarket.name}</span> · factors from <span className="text-black/75">{originJ?.factorSet ?? "—"}</span>, filed to <span className="text-black/75">{activeRegulation.authority}</span>.
              </p>
            </Card>
          </div>
        )}

        {/* 3 ─ PURPOSE */}
        {current === "purpose" && (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {PURPOSES.map((p) => (
                <SelectCard key={p.id} active={purpose === p.id} onClick={() => { if (p.id !== purpose) { setPurpose(p.id); setReportFields({}); } }}>
                  <div className="flex items-center justify-between">
                    <span className="font-[family-name:var(--font-plex)] text-xl font-light text-[#111]">{p.title}</span>
                    {purpose === p.id && (
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-[#111] text-white">
                        <Check size={12} strokeWidth={2} />
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-black/50">{p.description}</p>
                </SelectCard>
              ))}
            </div>
            <div className="space-y-4 border-t border-black/[0.06] pt-6">
              <Field label="Request name" hint="Shown to suppliers and on every reminder. Make it recognisable.">
                <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder={PURPOSES.find((p) => p.id === purpose)?.namePlaceholder} />
              </Field>
              <Field label="Request description (optional)" hint="Context for your suppliers — what this is for, who the buyer is.">
                <textarea className={cn(inputClass, "min-h-[84px] resize-y")} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Annual CBAM carbon data for our EU steel exports. Please report at installation level." />
              </Field>
            </div>
          </div>
        )}

        {/* 4 ─ PERIOD */}
        {current === "period" && (
          <div className="space-y-6">
            <SectionIntro kicker="Reporting period">
              {purpose === "cbam"
                ? "Official CBAM declarations are annual — but you can collect supplier data quarterly if that fits your cycle."
                : "Buyer requests can run on any cadence. Pick the rhythm that matches how this buyer wants the data."}
            </SectionIntro>
            <div className="grid gap-3 sm:grid-cols-2">
              {periodOptions.map((p: PeriodOption) => (
                <SelectCard key={p.id} active={periodId === p.id} onClick={() => setPeriodId(p.id)} className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-black/75">{p.label}</span>
                    {p.id === "annual" && purpose === "cbam" && <Chip tone="ok">recommended</Chip>}
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-black/40">{p.hint}</p>
                </SelectCard>
              ))}
            </div>
            <Card warm className="space-y-4 p-5">
              <Eyebrow>{activePeriod.picker === "range" ? "Choose dates" : activePeriod.picker === "none" ? "One-time collection" : "Choose period"}</Eyebrow>
              <div className="flex flex-wrap items-end gap-3">
                {activePeriod.picker === "quarter" && (
                  <LabeledControl label="Quarter">
                    <Select value={quarter} onChange={setQuarter} options={QUARTERS} className="w-48" ariaLabel="Quarter" />
                  </LabeledControl>
                )}
                {activePeriod.picker === "half" && (
                  <LabeledControl label="Half">
                    <Select value={half} onChange={setHalf} options={HALVES} className="w-48" ariaLabel="Half-year" />
                  </LabeledControl>
                )}
                {activePeriod.picker === "month" && (
                  <LabeledControl label="Month">
                    <Select value={month} onChange={setMonth} options={MONTHS.map((m) => ({ value: m, label: m }))} className="w-44" ariaLabel="Month" />
                  </LabeledControl>
                )}
                {activePeriod.picker === "range" ? (
                  <>
                    <LabeledControl label="Start date">
                      <DatePicker value={rangeStart} onChange={setRangeStart} className="w-44" ariaLabel="Start date" />
                    </LabeledControl>
                    <LabeledControl label="End date">
                      <DatePicker value={rangeEnd} onChange={setRangeEnd} min={rangeStart || undefined} className="w-44" ariaLabel="End date" />
                    </LabeledControl>
                  </>
                ) : activePeriod.picker !== "none" ? (
                  <LabeledControl label="Year">
                    <Select value={year} onChange={setYear} options={YEARS.map((y) => ({ value: y, label: y }))} className="w-32" ariaLabel="Year" />
                  </LabeledControl>
                ) : (
                  <p className="text-sm text-black/45">A single, ad-hoc collection — no recurring period.</p>
                )}
              </div>
              <p className="text-[11px] text-black/40">
                Period reads as <span className="font-mono text-black/60">{periodSummary}</span>
              </p>
            </Card>
          </div>
        )}

        {/* 5 ─ PRODUCTS */}
        {current === "products" && (
          <div className="space-y-5">
            <SectionIntro kicker="Products">
              Search the CBAM goods catalogue by product name, CN code or HS code. Pick everything in scope — reorder to match how you brief suppliers.
            </SectionIntro>
            <div className="space-y-3">
              <div className="relative">
                <Search size={16} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
                <input className={cn(inputClass, "pl-11")} placeholder="Search… e.g. Hot-rolled coil, 7208, or aluminium" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-2">
                {(["all", ...PRODUCT_CATEGORIES] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCatFilter(c as ProductCategory | "all")}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-[12px] transition-colors",
                      catFilter === c ? "border-black/25 bg-[#111] text-white" : "border-black/10 text-black/55 hover:border-black/25",
                    )}
                  >
                    {c === "all" ? "All goods" : c}
                  </button>
                ))}
                <span className="ml-auto self-center font-mono text-[11px] text-black/35">{filtered.length} in catalogue</span>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
              <Card className="max-h-[440px] divide-y divide-black/[0.05] overflow-y-auto p-0">
                {filtered.length === 0 && <div className="px-4 py-10 text-center text-sm text-black/40">No products match “{query}”.</div>}
                {filtered.map((p) => {
                  const on = products.includes(p.id);
                  return (
                    <button key={p.id} type="button" onClick={() => toggleProduct(p.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#fafaf8]">
                      <span className={cn("grid h-5 w-5 flex-none place-items-center rounded-md border", on ? "border-transparent bg-[#111] text-white" : "border-black/15")}>
                        {on && <Check size={12} strokeWidth={2.5} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-black/75">{p.name}</span>
                        <span className="block text-[11px] text-black/40">{p.category} · {p.group}</span>
                      </span>
                      <span className="flex-none font-mono text-[10px] text-black/40">CN {p.cnCode}</span>
                    </button>
                  );
                })}
              </Card>

              <Card warm className="h-fit p-4">
                <div className="flex items-center justify-between">
                  <Eyebrow>In scope</Eyebrow>
                  <span className="font-mono text-[11px] text-black/45">{products.length}</span>
                </div>
                {products.length === 0 ? (
                  <p className="mt-3 text-[12px] leading-relaxed text-black/40">Nothing selected yet. Tick products on the left to add them.</p>
                ) : (
                  <ul className="mt-3 space-y-1.5">
                    {products.map((id, i) => {
                      const p = getCatalogProduct(id)!;
                      return (
                        <li key={id} className="flex items-center gap-1.5 rounded-lg border border-black/[0.06] bg-white px-2.5 py-2">
                          <span className="font-mono text-[10px] text-black/30">{i + 1}</span>
                          <span className="min-w-0 flex-1 truncate text-[12px] text-black/70">{p.name}</span>
                          <button type="button" onClick={() => moveProduct(id, -1)} disabled={i === 0} aria-label="Move up" className="text-black/30 hover:text-black disabled:opacity-25">
                            <ArrowUp size={13} strokeWidth={1.5} />
                          </button>
                          <button type="button" onClick={() => moveProduct(id, 1)} disabled={i === products.length - 1} aria-label="Move down" className="text-black/30 hover:text-black disabled:opacity-25">
                            <ArrowDown size={13} strokeWidth={1.5} />
                          </button>
                          <button type="button" onClick={() => toggleProduct(id)} aria-label="Remove" className="text-black/30 hover:text-[#dc2626]">
                            <X size={13} strokeWidth={1.5} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* 6 ─ CLASSIFICATION */}
        {current === "classify" && (
          <div className="space-y-5">
            <SectionIntro kicker="Classification & report fields">
              Certrace classified each product automatically — category, CN / HS codes and the CBAM template come from the catalogue and can&apos;t be edited. The checklist below reflects the data points that actually apply to the goods you selected.
            </SectionIntro>

            <div className="space-y-2.5">
              {products.map((id) => {
                const p = getCatalogProduct(id)!;
                return (
                  <Card key={id} className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-[15px] text-black/80">{p.name}</div>
                        <div className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-black/40">{productTemplate(p)}</div>
                      </div>
                      <div className="flex items-center gap-4 font-mono text-[12px] text-black/55">
                        <span>CN {p.cnCode}</span>
                        <span className="text-black/30">HS {p.hsCode}</span>
                        <Lock size={12} strokeWidth={1.5} className="text-black/30" />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Scope 2 (indirect) liability — derived from the goods in scope */}
            {scope2.length > 0 && (
              <Card className="flex items-start gap-3 p-4">
                <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg border border-black/[0.08] bg-white text-black/55">
                  <Scale size={15} strokeWidth={1.5} />
                </span>
                <div className="min-w-0 text-[12px] leading-relaxed text-black/55">
                  <span className="text-[13px] text-black/75">Scope 2 (indirect) treatment</span>
                  <p className="mt-0.5 text-black/45">
                    Indirect electricity emissions are always reported, but only some sectors carry them into the CBAM bill. Certrace applies the rule per CN code:
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {scope2.map((s) => (
                      <li key={s.category} className="flex items-start gap-2">
                        <span
                          className={cn(
                            "mt-0.5 inline-flex flex-none items-center rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.1em]",
                            s.included ? "border-[#3C7ACB]/25 bg-[#3C7ACB]/[0.07] text-[#2f63a8]" : "border-black/10 bg-black/[0.03] text-black/45",
                          )}
                        >
                          {s.included ? "in the bill" : "reported only"}
                        </span>
                        <span>
                          <span className="text-black/70">{s.category}</span> —{" "}
                          {s.included
                            ? "indirect emissions count toward the CBAM financial obligation."
                            : "indirect emissions are excluded from the CBAM bill in the definitive period."}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            )}

            {/* report fields */}
            <Card warm className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Eyebrow>{purpose === "cbam" ? "CBAM report fields" : "Carbon data to request"}</Eyebrow>
                <span className="font-mono text-[11px] text-black/45">
                  {includedFields.length} of {resolvedFields.length} included
                </span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-black/50">
                {purpose === "cbam" ? (
                  <>These are the data points CBAM requires for the goods you selected. Required fields are locked on; the rest are recommended and on by default — keep or drop them to match how you collect data.</>
                ) : (
                  <>Choose the carbon-data fields this buyer needs. Recommended fields are pre-selected because buyers commonly ask for them — adjust freely, keeping at least one.</>
                )}
              </p>

              <div className="mt-4 space-y-4">
                {fieldGroups.map((group) => (
                  <div key={group}>
                    <div className="mb-1.5 font-pixel text-[10px] uppercase tracking-[0.16em] text-black/40">{group}</div>
                    <div className="space-y-1.5">
                      {resolvedFields.filter((f) => f.group === group).map((f) => {
                        const locked = purpose === "cbam" && f.required;
                        const on = locked ? true : Boolean(reportFields[f.id]);
                        const recommended = Boolean(f.buyerRecommended) && !locked;
                        return (
                          <div key={f.id} className="flex items-center gap-3 rounded-lg border border-black/[0.05] bg-white px-3 py-2">
                            <button
                              type="button"
                              disabled={locked}
                              onClick={() => setReportFields((r) => ({ ...r, [f.id]: !r[f.id] }))}
                              aria-label={`${on ? "Deselect" : "Select"} ${f.label}`}
                              className={cn(
                                "grid h-5 w-5 flex-none place-items-center rounded-md border transition-colors",
                                on ? "border-transparent bg-[#111] text-white" : "border-black/20",
                                locked && "cursor-not-allowed opacity-90",
                              )}
                            >
                              {on && <Check size={12} strokeWidth={2.5} />}
                            </button>
                            <span className="min-w-0 flex-1">
                              <span className={cn("block text-[13px]", on ? "text-black/75" : "text-black/40")}>{f.label}</span>
                              <span className="block truncate text-[11px] text-black/35">{f.hint}</span>
                            </span>
                            {locked ? (
                              <span className="inline-flex flex-none items-center gap-1 rounded-full border border-black/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-black/45">
                                <Lock size={9} strokeWidth={1.5} /> required
                              </span>
                            ) : recommended ? (
                              <span className="inline-flex flex-none items-center rounded-full border border-[#3C7ACB]/25 bg-[#3C7ACB]/[0.07] px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-[#2f63a8]">
                                recommended
                              </span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* 7 ─ DOCUMENTS (buyer only) */}
        {current === "documents" && (
          <div className="space-y-5">
            <SectionIntro kicker="Additional documents">
              The real deliverables EU buyers ask for alongside the carbon data. Pick only what this buyer needs — suppliers upload them in the same guided form.
            </SectionIntro>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-black/45">Additional to the CBAM carbon data.</span>
              <span className="font-mono text-[11px] text-black/45">{extras.length} selected</span>
            </div>
            <div className="space-y-4">
              {ADDITIONAL_REQUESTS.map((g) => (
                <div key={g.group}>
                  <div className="mb-2 font-pixel text-[10px] uppercase tracking-[0.16em] text-black/40">{g.group}</div>
                  <div className="flex flex-wrap gap-2">
                    {g.items.map((it) => {
                      const on = extras.includes(it.id);
                      return (
                        <button
                          key={it.id}
                          type="button"
                          onClick={() => setExtras((e) => (e.includes(it.id) ? e.filter((x) => x !== it.id) : [...e, it.id]))}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                            on ? "border-black/25 bg-[#f0eee8] text-black/80" : "border-black/10 text-black/55 hover:border-black/25 hover:text-black",
                          )}
                        >
                          <span className={cn("grid h-4 w-4 place-items-center rounded-full", on ? "bg-[#111] text-white" : "border border-black/20")}>{on && <Check size={10} strokeWidth={3} />}</span>
                          {it.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8 ─ SUPPLIERS */}
        {current === "suppliers" && (
          <div className="space-y-5">
            <SectionIntro kicker="Suppliers, lots & quantities">
              Map suppliers to each product, then add the production lots you bought in this period. Each lot keeps its own quantity and optional production period, so the embedded-emissions calculation stays fully traceable.
            </SectionIntro>

            {products.map((pid) => {
              const p = getCatalogProduct(pid)!;
              const stats = supplierStats(pid);
              const used = (mapping[pid] ?? []).map((e) => e.supplierId);
              const available = directory.filter((d) => !used.includes(d.id));
              return (
                <Card key={pid} className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-[family-name:var(--font-plex)] text-base font-light text-[#111]">{p.name}</span>
                      <span className="font-mono text-[10px] text-black/35">CN {p.cnCode}</span>
                    </div>
                  </div>

                  {stats.map(({ entry, total }) => {
                    const sup = directory.find((d) => d.id === entry.supplierId);
                    return (
                      <div key={entry.supplierId} className="mt-3 rounded-xl border border-black/[0.07] bg-[#fafaf8] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-[13px] text-black/80">{sup?.company}</div>
                            <div className="truncate text-[11px] text-black/40">{sup?.contact ? `${sup.contact} · ` : ""}{sup?.email}</div>
                          </div>
                          <div className="flex flex-none items-center gap-3">
                            {total !== "—" && <span className="font-mono text-[11px] text-black/45">{total}</span>}
                            <button type="button" onClick={() => removeSupplier(pid, entry.supplierId)} aria-label="Remove supplier" className="text-black/30 hover:text-[#dc2626]">
                              <Trash2 size={14} strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>

                        <div className="mt-2.5 space-y-2">
                          {entry.lots.map((l, idx) => (
                            <LotRow
                              key={l.id}
                              lot={l}
                              index={idx + 1}
                              canRemove={entry.lots.length > 1}
                              onChange={(patch) => patchLot(pid, entry.supplierId, l.id, patch)}
                              onRemove={() => removeLot(pid, entry.supplierId, l.id)}
                            />
                          ))}
                        </div>
                        <button type="button" onClick={() => addLot(pid, entry.supplierId)} className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-black/15 px-3 py-1.5 text-[11px] text-black/55 hover:border-black/30 hover:text-black">
                          <Plus size={12} strokeWidth={1.5} /> Add lot
                        </button>
                      </div>
                    );
                  })}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {available.length > 0 && (
                      <Select
                        value=""
                        onChange={(v) => v && addSupplier(pid, v)}
                        options={available.map((d) => ({ value: d.id, label: d.company, hint: d.country }))}
                        placeholder="Add supplier from directory…"
                        className="w-64"
                        ariaLabel="Add supplier"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setInviteFor(pid);
                        setInv({ company: "", contact: "", email: "", country: "" });
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-black/15 px-3.5 py-2.5 text-[12px] text-black/55 hover:border-black/30 hover:text-black"
                    >
                      <Plus size={13} strokeWidth={1.5} /> Invite new supplier
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* 9 ─ DEADLINE */}
        {current === "deadline" && (
          <div className="space-y-6">
            <SectionIntro kicker="Deadline & reminders">
              Set the submission deadline suppliers see, and let Certrace chase them automatically so you don&apos;t have to.
            </SectionIntro>
            <LabeledControl label="Submission deadline" hint="The date suppliers must submit by.">
              <DatePicker value={deadline} onChange={setDeadline} className="max-w-xs" ariaLabel="Submission deadline" />
            </LabeledControl>

            <Card warm className="p-5">
              <Eyebrow>Automatic reminders</Eyebrow>
              <div className="mt-3 divide-y divide-black/[0.05]">
                {([
                  ["d7", "7 days before the deadline"],
                  ["d3", "3 days before the deadline"],
                  ["due", "On the due date"],
                ] as const).map(([key, label]) => {
                  const on = reminders[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setReminders((r) => ({ ...r, [key]: !on }))}
                      className="flex w-full items-center gap-3 py-2.5 text-left"
                    >
                      <span className={cn("grid h-5 w-5 flex-none place-items-center rounded-md border transition-colors", on ? "border-transparent bg-[#111] text-white" : "border-black/20")}>
                        {on && <Check size={12} strokeWidth={2.5} />}
                      </span>
                      <span className="text-sm text-black/65">{label}</span>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Field label="Notes to suppliers (optional)" hint="Appears at the top of every supplier's guided form.">
              <textarea className={cn(inputClass, "min-h-[84px] resize-y")} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Please use installation-level actual data where possible. Contact us if you need help." />
            </Field>
          </div>
        )}

        {/* 10 ─ REVIEW */}
        {current === "review" && (
          <div className="space-y-5">
            <SectionIntro kicker="Review & create">
              One last look. We&apos;ll prepare the guided forms and reminders — you send them when you&apos;re ready.
            </SectionIntro>

            <Card warm className="grid grid-cols-2 divide-x divide-y divide-black/[0.06] p-0 sm:grid-cols-4 sm:divide-y-0">
              {[
                [`${uniqueSuppliers}`, "Suppliers"],
                [`${products.length}`, "Products"],
                [`${totalLots}`, "Lots"],
                [`~${estDays}d`, "Est. completion"],
              ].map(([v, l]) => (
                <div key={l} className="px-5 py-4 text-center">
                  <div className="font-[family-name:var(--font-plex)] text-2xl font-light text-[#111]">{v}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.1em] text-black/40">{l}</div>
                </div>
              ))}
            </Card>

            <Card className="divide-y divide-black/[0.06] p-0">
              {[
                ["Regulation", `${activeRegulation.short} · ${activeRegulation.full}`],
                ["Route", `${originJ?.name ?? origin} → ${destinationMarket.name}`],
                ["Authority", activeRegulation.authority],
                ["Purpose", PURPOSES.find((p) => p.id === purpose)?.title ?? ""],
                ["Request name", name.trim() || "—"],
                ["Period", periodSummary],
                ["Products", `${products.length} · CN-classified`],
                ["Report fields", purpose === "cbam" ? `${includedFields.length} of ${resolvedFields.length} (${requiredCount} required)` : `${includedFields.length} selected`],
                ...(purpose === "buyer" ? ([["Extra documents", `${extras.length} requested`]] as [string, string][]) : []),
                ["Total volume", totalTonnes > 0 ? `${fmt(totalTonnes)} t across ${totalLots} lots` : `${totalLots} lots`],
                ["Deadline", deadline ? new Date(deadline + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"],
                ["Reminders", Object.entries(reminders).filter(([, v]) => v).map(([k]) => (k === "d7" ? "7d" : k === "d3" ? "3d" : "due")).join(" · ") || "none"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4 px-5 py-3">
                  <span className="text-[11px] uppercase tracking-[0.1em] text-black/35">{k}</span>
                  <span className="text-right text-sm text-black/70">{v}</span>
                </div>
              ))}
            </Card>

            <Card className="p-5">
              <Eyebrow>Product → supplier → lots</Eyebrow>
              <div className="mt-3 space-y-2.5">
                {products.map((pid) => {
                  const p = getCatalogProduct(pid)!;
                  const stats = supplierStats(pid);
                  return (
                    <div key={pid} className="text-[13px]">
                      <span className="text-black/75">{p.name}</span>
                      <span className="ml-2 text-black/40">
                        {stats.length === 0 ? "— no suppliers yet" : stats.map((s) => `${directory.find((d) => d.id === s.entry.supplierId)?.company} (${s.entry.lots.length} lot${s.entry.lots.length === 1 ? "" : "s"}, ${s.total})`).join(" · ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card warm className="flex items-start gap-3 p-4">
              <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg border border-black/[0.08] bg-white text-[#047857]">
                <Clock size={15} strokeWidth={1.5} />
              </span>
              <p className="text-sm leading-relaxed text-black/55">
                Estimated effort with Certrace: <span className="text-[#111]">3–5 working days</span> of your time vs 9–15 weeks chasing data by email. Suppliers report for free.
              </p>
            </Card>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="sticky bottom-0 -mx-1 flex items-center justify-between gap-3 border-t border-black/[0.06] bg-[#f5f4f0]/90 px-1 py-4 backdrop-blur">
        {step > 0 ? (
          <Button variant="ghost" size="sm" onClick={back}>
            <ArrowLeft size={14} strokeWidth={1.5} /> Back
          </Button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          {isLast ? (
            <Button onClick={create}>
              Create declaration <ArrowRight size={15} strokeWidth={1.5} />
            </Button>
          ) : (
            <Button onClick={next} disabled={!canContinue}>
              Continue <ArrowRight size={15} strokeWidth={1.5} />
            </Button>
          )}
        </div>
      </div>

      {/* invite modal */}
      {inviteFor && (
        <Modal onClose={() => setInviteFor(null)} title="Invite supplier" subtitle="Saved to your directory — no onboarding needed">
          <div className="space-y-3 px-5 py-4">
            <Field label="Company name">
              <IconInput icon={Building2} value={inv.company} onChange={(v) => setInv((s) => ({ ...s, company: v }))} placeholder="e.g. Eastern Steel Mill" />
            </Field>
            <Field label="Contact person">
              <IconInput icon={UserRound} value={inv.contact} onChange={(v) => setInv((s) => ({ ...s, contact: v }))} placeholder="Full name" />
            </Field>
            <Field label="Email">
              <IconInput icon={Mail} type="email" value={inv.email} onChange={(v) => setInv((s) => ({ ...s, email: v }))} placeholder="contact@supplier.com" />
            </Field>
            <Field label="Country">
              <IconInput icon={Globe} value={inv.country} onChange={(v) => setInv((s) => ({ ...s, country: v }))} placeholder="e.g. Thailand" />
            </Field>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-black/[0.06] px-5 py-3">
            <Button variant="ghost" size="sm" onClick={() => setInviteFor(null)}>Cancel</Button>
            <Button size="sm" onClick={submitInvite} disabled={!inviteValid}>
              <Plus size={13} strokeWidth={1.5} /> Add supplier
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── lot row ──────────────────────────────────────────────── */
function LotRow({ lot, index, canRemove, onChange, onRemove }: { lot: Lot; index: number; canRemove: boolean; onChange: (p: Partial<Lot>) => void; onRemove: () => void }) {
  const qtyMissing = !(Number(lot.qty) > 0);
  return (
    <div className="rounded-lg border border-black/[0.06] bg-white p-2.5">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-black/30">Lot {index}</span>
        {canRemove && (
          <button type="button" onClick={onRemove} aria-label="Remove lot" className="ml-auto text-black/25 hover:text-[#dc2626]">
            <X size={13} strokeWidth={1.5} />
          </button>
        )}
      </div>
      {/* Required: quantity + unit */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          type="number"
          min={0}
          value={lot.qty}
          onChange={(e) => onChange({ qty: e.target.value })}
          placeholder="Quantity"
          aria-label="Quantity"
          className={cn(
            "w-28 rounded-lg border bg-white px-3 py-2 text-sm text-black/70 placeholder:text-black/30 focus:outline-none",
            qtyMissing ? "border-[#f87171]/60 focus:border-[#f87171]" : "border-black/10 focus:border-black/25",
          )}
        />
        <Select value={lot.unit} onChange={(v) => onChange({ unit: v })} options={PRODUCT_UNITS.map((u) => ({ value: u, label: u }))} placeholder="Select unit" className="w-36" ariaLabel="Unit" invalid={!lot.unit} />
      </div>
      {/* Optional: production date range — equal-width columns, single line */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <DatePicker value={lot.from} onChange={(v) => onChange({ from: v })} className="w-full" ariaLabel="Produced from" placeholder="Produced from" />
        <DatePicker value={lot.to} onChange={(v) => onChange({ to: v })} min={lot.from || undefined} className="w-full" ariaLabel="Produced to" placeholder="Produced to" />
      </div>
      {/* Optional: notes */}
      <div className="mt-2">
        <input value={lot.notes} onChange={(e) => onChange({ notes: e.target.value })} placeholder="Notes (optional)" className="w-full rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[12px] text-black/65 placeholder:text-black/30 focus:border-black/25 focus:outline-none" />
      </div>
    </div>
  );
}

/* ── helpers ─────────────────────────────────────────────── */
function LabeledControl({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.1em] text-black/50">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-black/35">{hint}</span>}
    </label>
  );
}

function IconInput({ icon: Icon, value, onChange, placeholder, type = "text" }: { icon: React.ElementType; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div className="relative">
      <Icon size={15} strokeWidth={1.5} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" />
      <input type={type} className={cn(inputClass, "pl-10")} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function Modal({ title, subtitle, children, onClose }: { title: string; subtitle?: string; children: React.ReactNode; onClose: () => void }) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgba(245,244,240,0.6)] backdrop-blur-md" onClick={onClose} aria-hidden />
      <div className="ct-enter relative w-full max-w-md overflow-hidden rounded-2xl border border-black/[0.07] bg-white" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06)" }}>
        <div className="flex items-start justify-between border-b border-black/[0.06] px-5 py-3.5">
          <div>
            <div className="font-[family-name:var(--font-plex)] text-base font-light text-[#111]">{title}</div>
            {subtitle && <div className="mt-0.5 text-[11px] text-black/40">{subtitle}</div>}
          </div>
          <button onClick={onClose} aria-label="Close" className="text-black/35 hover:text-black">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
