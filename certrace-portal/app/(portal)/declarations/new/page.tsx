"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Check, X, Lock, Bell } from "lucide-react";
import { Card, Button, Eyebrow, Chip, StatusDot, Field, inputClass, cn } from "@/components/ui";
import { toast } from "@/components/toast";
import { REGULATIONS, JURISDICTIONS, DESTINATION_MARKETS, PRODUCT_SECTORS, STATUS_META } from "@/lib/config";
import { DECLARATIONS } from "@/lib/data";

const STEPS = ["Regulation", "Route", "Scope", "Suppliers", "Review"];

function notifyMe(name: string) {
  toast({ message: `You're on the ${name} waitlist.`, tone: "info", detail: "We'll email wasawat@siamsteel.co.th the day it opens." });
}

function NotifyPill({ name, label = "notify me" }: { name: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => notifyMe(name)}
      className="inline-flex flex-none items-center gap-1 rounded-full border border-black/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] text-black/50 hover:border-black/25 hover:text-black"
    >
      <Bell size={11} strokeWidth={1.5} /> {label}
    </button>
  );
}

export default function NewDeclarationPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [reg, setReg] = React.useState("cbam");
  const [origin, setOrigin] = React.useState("TH");
  const [market, setMarket] = React.useState("EU");
  const [sector, setSector] = React.useState("steel");
  const [period, setPeriod] = React.useState("Q3 2026 (Jul–Sep)");
  const pool = DECLARATIONS[0].suppliers;
  const [picked, setPicked] = React.useState<string[]>(pool.filter((s) => s.critical).map((s) => s.id));

  const regulation = REGULATIONS.find((r) => r.id === reg)!;
  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header + close */}
      <div className="flex items-start justify-between">
        <div>
          <Eyebrow>New declaration</Eyebrow>
          <h1 className="mt-2 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
            Scope it once.
          </h1>
        </div>
        <Link href="/declarations" aria-label="Cancel" className="text-black/35 hover:text-black">
          <X size={20} strokeWidth={1.5} />
        </Link>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "grid h-6 w-6 place-items-center rounded-full border text-[11px] font-mono",
                  i < step
                    ? "border-transparent bg-[#111] text-white"
                    : i === step
                      ? "border-black/40 text-black"
                      : "border-black/15 text-black/30",
                )}
              >
                {i < step ? <Check size={12} strokeWidth={2} /> : i + 1}
              </span>
              <span className={cn("hidden text-[11px] uppercase tracking-[0.1em] sm:block", i === step ? "text-black/70" : "text-black/30")}>
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-black/[0.08]" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step body */}
      <div key={step} className="ct-enter">
        {step === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-black/45">Which obligation are you filing for? CBAM is live today — more schemes open as their engines verify.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {REGULATIONS.map((r) => {
                const meta = STATUS_META[r.status];
                const disabled = !r.available;
                const head = (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-[family-name:var(--font-plex)] text-xl font-light text-[#111]">
                        {disabled && <Lock size={13} strokeWidth={1.5} className="text-black/30" />}
                        {r.short}
                      </span>
                      <Chip tone={meta.tone}>{meta.label}</Chip>
                    </div>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-black/35">{r.full}</p>
                  </>
                );
                if (disabled) {
                  return (
                    <div key={r.id} className="rounded-2xl border border-black/[0.07] bg-white p-5 text-left opacity-80">
                      {head}
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <p className="text-xs leading-relaxed text-black/40">{r.soonNote}</p>
                        <NotifyPill name={r.short} />
                      </div>
                    </div>
                  );
                }
                return (
                  <button
                    key={r.id}
                    onClick={() => setReg(r.id)}
                    className={cn(
                      "rounded-2xl border bg-white p-5 text-left transition-colors",
                      reg === r.id ? "border-black/25 bg-[#f0eee8]" : "border-black/[0.07] hover:border-black/15",
                    )}
                  >
                    {head}
                    <p className="mt-3 text-xs leading-relaxed text-black/45">{r.cadence} · to {r.authority}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm text-black/45">Country of origin — sets the localised emission-factor library.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {JURISDICTIONS.map((j) => {
                  const meta = STATUS_META[j.status];
                  const disabled = !j.available;
                  const inner = (
                    <>
                      <span className="font-mono text-[11px] tracking-[0.16em] text-black/40">{j.flag}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-black/70">{j.name}</span>
                        <span className="block truncate text-[11px] text-black/35">{j.available ? j.factorSet : "coming soon"}</span>
                      </span>
                      <Chip tone={meta.tone}>{meta.label}</Chip>
                    </>
                  );
                  if (disabled) {
                    return (
                      <div key={j.code} className="flex items-center gap-3 rounded-2xl border border-black/[0.07] bg-white p-4 text-left opacity-80">
                        {inner}
                      </div>
                    );
                  }
                  return (
                    <button
                      key={j.code}
                      onClick={() => setOrigin(j.code)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border bg-white p-4 text-left transition-colors",
                        origin === j.code ? "border-black/25 bg-[#f0eee8]" : "border-black/[0.07] hover:border-black/15",
                      )}
                    >
                      {inner}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm text-black/45">Destination market — the authority that enforces.</p>
              <div className="flex flex-wrap gap-2">
                {DESTINATION_MARKETS.filter((m) => m.regulations.includes(reg)).map((m) => (
                  <button
                    key={m.code}
                    onClick={() => setMarket(m.code)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm transition-colors",
                      market === m.code ? "border-black/25 bg-[#111] text-white" : "border-black/10 text-black/55 hover:border-black/25",
                    )}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm text-black/45">CBAM goods scope — drives which CN codes and data points apply. Steel &amp; iron is open today.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {PRODUCT_SECTORS.filter((p) => p.regs.includes(reg)).map((p) => {
                  const disabled = !p.available;
                  if (disabled) {
                    return (
                      <div key={p.id} className="flex items-center justify-between gap-2 rounded-2xl border border-black/[0.07] bg-white p-4 text-left opacity-80">
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 text-sm text-black/70">
                            <Lock size={12} strokeWidth={1.5} className="text-black/30" />
                            {p.name}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-black/35">coming soon · {p.cnHint}</span>
                        </span>
                        <NotifyPill name={p.name} label="notify" />
                      </div>
                    );
                  }
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSector(p.id)}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-2xl border bg-white p-4 text-left transition-colors",
                        sector === p.id ? "border-black/25 bg-[#f0eee8]" : "border-black/[0.07] hover:border-black/15",
                      )}
                    >
                      <span className="text-sm text-black/70">{p.name}</span>
                      <span className="font-mono text-[10px] text-black/35">{p.cnHint}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <Field label="Reporting period">
              <input className={inputClass} value={period} onChange={(e) => setPeriod(e.target.value)} />
            </Field>
            <Card warm className="p-4">
              <Eyebrow>Data points this requires</Eyebrow>
              <div className="mt-3 flex flex-wrap gap-2">
                {regulation.dataPoints.map((d) => (
                  <span key={d} className="rounded-full border border-black/[0.08] px-2.5 py-1 text-[11px] text-black/45">
                    {d}
                  </span>
                ))}
              </div>
            </Card>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-black/45">Who do we collect from? Suppliers fill a free guided form — no account needed.</p>
              <span className="font-mono text-[11px] text-black/45">{picked.length} selected</span>
            </div>
            <Card className="divide-y divide-black/[0.05] p-0">
              {pool.map((s) => (
                <label key={s.id} className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-[#fafaf8]">
                  <input
                    type="checkbox"
                    checked={picked.includes(s.id)}
                    onChange={() => toggle(s.id)}
                    className="h-4 w-4 accent-[#111]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-black/70">{s.name}</span>
                    <span className="block text-[11px] text-black/35">{s.material}</span>
                  </span>
                  {s.critical && <Chip tone="warn">critical</Chip>}
                </label>
              ))}
            </Card>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-black/45">Confirm and create. We&apos;ll prepare the requests — you send when ready.</p>
            <Card className="divide-y divide-black/[0.06] p-0">
              {[
                ["Regulation", `${regulation.short} — ${regulation.full}`],
                ["Route", `${origin} → ${DESTINATION_MARKETS.find((m) => m.code === market)?.name}`],
                ["Sector", PRODUCT_SECTORS.find((p) => p.id === sector)?.name ?? sector],
                ["Period", period],
                ["Suppliers", `${picked.length} selected`],
                ["Authority", regulation.authority],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-[11px] uppercase tracking-[0.1em] text-black/35">{k}</span>
                  <span className="text-sm text-black/70">{v}</span>
                </div>
              ))}
            </Card>
            <Card warm className="flex items-center gap-3 p-4">
              <StatusDot tone="ok" pulse glow />
              <p className="text-sm text-black/55">
                Estimated effort with Certrace: <span className="text-[#111]">3–5 days</span> vs 9–15 weeks manual.
              </p>
            </Card>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between border-t border-black/[0.06] pt-5">
        <Button variant="ghost" size="sm" onClick={back} disabled={step === 0}>
          <ArrowLeft size={14} strokeWidth={1.5} /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next}>
            Continue <ArrowRight size={15} strokeWidth={1.5} />
          </Button>
        ) : (
          <Button
            onClick={() => {
              toast({ message: "Declaration created.", detail: "Collection requests are ready to send." });
              router.push("/declarations/cbam-2026-q2-steel");
            }}
          >
            Create declaration <ArrowRight size={15} strokeWidth={1.5} />
          </Button>
        )}
      </div>
    </div>
  );
}
