"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ArrowRight, X, Lock, CreditCard, Download } from "lucide-react";
import { Card, PageHeader, Button, Eyebrow, Chip, StatusDot, StatusLabel, Field, inputClass, cn } from "@/components/ui";
import { toast } from "@/components/toast";
import { downloadFile } from "@/lib/download";
import { PLANS, Plan } from "@/lib/config";
import { ORG } from "@/lib/data";

const CURRENT = ORG.plan; // "growth"
const order: Plan["id"][] = ["starter", "growth", "scale"];

const INVOICES = [
  { id: "INV-2026-06", date: "01 Jun 2026", amount: "€660.00", plan: "Growth · annual" },
  { id: "INV-2026-05", date: "01 May 2026", amount: "€660.00", plan: "Growth · annual" },
  { id: "INV-2026-04", date: "01 Apr 2026", amount: "€660.00", plan: "Growth · annual" },
];

export default function BillingPage() {
  const [annual, setAnnual] = React.useState(true);
  const [checkout, setCheckout] = React.useState<Plan | null>(null);

  const ctaFor = (p: Plan): { label: string; kind: "current" | "upgrade" | "downgrade" | "contact" } => {
    if (p.id === "scale") return { label: "Talk to sales", kind: "contact" };
    if (p.id === CURRENT) return { label: "Current plan", kind: "current" };
    return order.indexOf(p.id) > order.indexOf(CURRENT)
      ? { label: `Upgrade to ${p.name}`, kind: "upgrade" }
      : { label: `Switch to ${p.name}`, kind: "downgrade" };
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Plan & billing"
        title="Pricing that scales with filings, not suppliers."
        lead="You pay for seats and workflow. Your suppliers fill their forms for free, forever — that's how you get them to actually respond."
        actions={
          <div className="inline-flex items-center rounded-full border border-black/10 p-1 text-[11px] uppercase tracking-[0.1em]">
            <button
              onClick={() => setAnnual(false)}
              className={cn("rounded-full px-3 py-1.5 transition-colors", !annual ? "bg-[#111] text-white" : "text-black/45 hover:text-black")}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn("rounded-full px-3 py-1.5 transition-colors", annual ? "bg-[#111] text-white" : "text-black/45 hover:text-black")}
            >
              Annual · save 2 months
            </button>
          </div>
        }
      />

      {/* Current plan strip */}
      <Card warm className="flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <StatusDot tone="ok" glow pulse />
          <p className="text-sm text-black/60">
            You&apos;re on <span className="text-[#111]">{ORG.planLabel}</span> · billed annually · renews 1 Jul 2026 ·{" "}
            <span className="font-mono text-[12px] text-black/45">{ORG.seatsUsed}/{ORG.seatsTotal} seats</span>
          </p>
        </div>
        <Chip tone="ok">suppliers free</Chip>
      </Card>

      {/* Plan cards */}
      <div className="grid gap-3 lg:grid-cols-3">
        {PLANS.map((p) => {
          const cta = ctaFor(p);
          const price = annual ? p.annual : p.monthly;
          const isCurrent = p.id === CURRENT;
          return (
            <Card
              key={p.id}
              highlight={p.highlight}
              className={cn("flex h-full flex-col p-6", isCurrent && "ring-1 ring-black/15")}
            >
              <div className="flex items-center justify-between">
                <span className="font-[family-name:var(--font-plex)] text-2xl font-light text-[#111]">{p.name}</span>
                {isCurrent ? <Chip tone="ok">current</Chip> : p.highlight ? <Chip tone="info">most popular</Chip> : null}
              </div>
              <p className="mt-2 min-h-[40px] text-[13px] leading-relaxed text-black/45">{p.tagline}</p>

              <div className="mt-4 flex items-end gap-1.5 border-t border-black/[0.06] pt-4">
                {p.id === "scale" ? (
                  <span className="font-[family-name:var(--font-plex)] text-3xl font-light text-[#111]">Custom</span>
                ) : (
                  <>
                    <span className="font-[family-name:var(--font-plex)] text-4xl font-light text-[#111]">€{price}</span>
                    <span className="mb-1 text-[12px] text-black/40">/ mo{annual ? " · billed yearly" : ""}</span>
                  </>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {[p.limits.seats, p.limits.declarations, p.limits.origins].map((l) => (
                  <span key={l} className="rounded-full border border-black/[0.08] px-2.5 py-1 text-[10px] uppercase tracking-[0.06em] text-black/45">
                    {l}
                  </span>
                ))}
              </div>

              <ul className="mt-4 flex-1 space-y-2.5 border-t border-black/[0.06] pt-4">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13px] text-black/60">
                    <Check size={15} strokeWidth={1.5} className="mt-0.5 flex-none text-[#047857]" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {cta.kind === "current" ? (
                  <Button variant="secondary" className="w-full" disabled>
                    <Check size={14} strokeWidth={2} /> Current plan
                  </Button>
                ) : cta.kind === "contact" ? (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => toast({ message: "Request sent to sales.", tone: "info", detail: "A specialist will reach out within one business day." })}
                  >
                    {cta.label} <ArrowRight size={14} strokeWidth={1.5} />
                  </Button>
                ) : (
                  <Button
                    variant={cta.kind === "upgrade" ? "primary" : "secondary"}
                    className="w-full"
                    onClick={() => setCheckout(p)}
                  >
                    {cta.label} {cta.kind === "upgrade" && <ArrowRight size={14} strokeWidth={1.5} />}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Payment method + invoices */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="p-6">
          <Eyebrow>Payment method</Eyebrow>
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-black/[0.08] p-4">
            <span className="grid h-10 w-14 place-items-center rounded-lg bg-[#111] text-white">
              <CreditCard size={18} strokeWidth={1.5} />
            </span>
            <div className="flex-1">
              <div className="font-mono text-[13px] text-black/70">•••• •••• •••• 4242</div>
              <div className="text-[11px] text-black/40">Visa · expires 09/28</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => toast("Update card — opens secure form (demo).")}>
              Update
            </Button>
          </div>
          <p className="mt-3 text-[11px] text-black/35">Payments are processed securely. Card details never touch Certrace servers.</p>
        </Card>

        <Card className="p-6">
          <Eyebrow>Invoices</Eyebrow>
          <div className="mt-2 divide-y divide-black/[0.06]">
            {INVOICES.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-[13px] text-black/70">{inv.id}</div>
                  <div className="font-mono text-[11px] text-black/40">{inv.date} · {inv.plan}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[13px] text-black/60">{inv.amount}</span>
                  <button
                    onClick={() =>
                      downloadFile(
                        `certrace-${inv.id}.txt`,
                        `CERTRACE — INVOICE ${inv.id}\n\nBilled to: ${ORG.name}\nDate: ${inv.date}\nPlan: ${inv.plan}\nAmount: ${inv.amount}\nStatus: PAID\n\nThank you.`,
                        "text/plain",
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.08em] text-black/55 hover:border-black/25 hover:text-black"
                  >
                    <Download size={13} strokeWidth={1.5} /> PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <p className="text-center text-xs text-black/35">
        Need EUDR, CSRD or another origin country?{" "}
        <Link href="/regulations" className="text-black/55 underline-offset-2 hover:text-black hover:underline">
          See what&apos;s coming →
        </Link>
      </p>

      {checkout && <CheckoutModal plan={checkout} annual={annual} onClose={() => setCheckout(null)} />}
    </div>
  );
}

/* ── Checkout flow (continuous to success) ──────────────── */
function CheckoutModal({ plan, annual, onClose }: { plan: Plan; annual: boolean; onClose: () => void }) {
  const [phase, setPhase] = React.useState<"review" | "processing" | "done">("review");
  const monthly = annual ? plan.annual : plan.monthly;
  const total = annual ? plan.annual * 12 : plan.monthly;

  const pay = () => {
    setPhase("processing");
    setTimeout(() => {
      setPhase("done");
      toast({ message: `You're on ${plan.name}.`, detail: "Receipt sent · new seats unlocked immediately." });
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={phase === "processing" ? undefined : onClose} aria-hidden />
      <Card className="relative z-10 w-full max-w-md p-6">
        <div className="flex items-start justify-between">
          <div>
            <Eyebrow>{phase === "done" ? "Confirmed" : "Confirm upgrade"}</Eyebrow>
            <h2 className="mt-2 font-[family-name:var(--font-plex)] text-2xl font-light text-[#111]">
              {phase === "done" ? `Welcome to ${plan.name}.` : `${plan.name} plan`}
            </h2>
          </div>
          {phase !== "processing" && (
            <button onClick={onClose} aria-label="Close" className="text-black/35 hover:text-black">
              <X size={20} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {phase === "review" && (
          <div className="mt-5 space-y-4">
            <Card warm className="divide-y divide-black/[0.06] p-0">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[13px] text-black/55">{plan.name} · {annual ? "annual" : "monthly"}</span>
                <span className="font-mono text-[13px] text-black/70">€{monthly}/mo</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[13px] text-black/55">Billed {annual ? "yearly today" : "monthly"}</span>
                <span className="font-[family-name:var(--font-plex)] text-xl font-light text-[#111]">€{total.toLocaleString()}</span>
              </div>
            </Card>
            <Field label="Card details">
              <div className="flex items-center gap-2 rounded-xl border border-black/10 px-4 py-3">
                <CreditCard size={16} strokeWidth={1.5} className="text-black/35" />
                <span className="font-mono text-[13px] text-black/60">•••• 4242</span>
                <Lock size={13} strokeWidth={1.5} className="ml-auto text-black/30" />
              </div>
            </Field>
            <Button className="w-full" onClick={pay}>
              Pay €{total.toLocaleString()} & upgrade <ArrowRight size={15} strokeWidth={1.5} />
            </Button>
            <p className="text-center text-[11px] text-black/35">Prorated against your current plan. Cancel anytime.</p>
          </div>
        )}

        {phase === "processing" && (
          <div className="mt-8 flex flex-col items-center gap-3 py-6">
            <StatusLabel tone="info" label="processing payment…" pulse />
            <p className="text-[12px] text-black/35">Securing your seats.</p>
          </div>
        )}

        {phase === "done" && (
          <div className="mt-5 space-y-4">
            <div className="flex flex-col items-center py-2 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#ecfdf5] text-[#047857]">
                <Check size={26} strokeWidth={1.5} />
              </span>
              <p className="mt-3 max-w-xs text-sm text-black/50">
                {plan.limits.seats} and {plan.id === "scale" ? "every feature" : "the full workflow"} are active now. A receipt is on its way.
              </p>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-black/[0.08] bg-[#faf9f7] px-4 py-3">
              <span className="text-[12px] text-black/45">Receipt</span>
              <span className="font-mono text-[12px] text-black/60">{INVOICE_REF}</span>
            </div>
            <Button className="w-full" onClick={onClose}>Done</Button>
          </div>
        )}
      </Card>
    </div>
  );
}

const INVOICE_REF = `CTR-INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
