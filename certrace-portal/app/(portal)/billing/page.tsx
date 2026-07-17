"use client";

import Link from "next/link";
import { ArrowRight, Check, CreditCard, Download } from "lucide-react";

import { toast } from "@/components/toast";
import { Button, Card, Chip, Eyebrow, PageHeader, StatusDot, cn } from "@/components/ui";
import { PLANS, type Plan } from "@/lib/config";
import { ORG, getUniqueSuppliers } from "@/lib/data";

const CURRENT = ORG.plan;
const PLAN_ORDER: Plan["id"][] = ["starter", "standard", "enterprise"];
const thb = (amount: number) => `฿${amount.toLocaleString("en-US")}`;

const INVOICE_FIXTURES = [
  { id: "INV-DEMO-2026-06", date: "01 Jun 2026", amount: thb(360_000), plan: "Standard · annual" },
];

function ctaFor(plan: Plan): { label: string; kind: "current" | "upgrade" | "downgrade" | "contact" } {
  if (plan.id === "enterprise") return { label: "Talk to sales", kind: "contact" };
  if (plan.id === CURRENT) return { label: "Current plan", kind: "current" };
  return PLAN_ORDER.indexOf(plan.id) > PLAN_ORDER.indexOf(CURRENT)
    ? { label: `Upgrade to ${plan.name}`, kind: "upgrade" }
    : { label: `Switch to ${plan.name}`, kind: "downgrade" };
}

export default function BillingPage() {
  const supplierCount = getUniqueSuppliers().length;
  const currentPlan = PLANS.find((plan) => plan.id === CURRENT)!;

  const unavailable = (label: string) =>
    toast({
      message: `${label} unavailable`,
      detail: "No request, payment, subscription, entitlement, email, or invoice action occurred.",
      tone: "info",
    });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Plan & billing"
        title="Pricing that scales with suppliers, not seats."
        lead="Illustrative annual pricing only. No payment provider, subscription, entitlement, invoice, or billing backend is configured in this readiness demo."
      />

      <Card warm className="flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <StatusDot tone="muted" />
          <p className="text-sm text-black/60">
            Demo plan fixture: <span className="text-[#111]">{ORG.planLabel}</span> · no active subscription or renewal ·{" "}
            <span className="font-mono text-[12px] text-black/45">
              {supplierCount}/{currentPlan.supplierCap ?? "∞"} fixture suppliers
            </span>
          </p>
        </div>
        <Chip tone="muted">billing not configured</Chip>
      </Card>

      <div className="grid gap-3 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const cta = ctaFor(plan);
          const isCurrent = plan.id === CURRENT;
          return (
            <Card key={plan.id} highlight={plan.highlight} className={cn("flex h-full flex-col p-6", isCurrent && "ring-1 ring-black/15")}>
              <div className="flex items-center justify-between">
                <span className="font-[family-name:var(--font-plex)] text-2xl font-light text-[#111]">{plan.name}</span>
                {isCurrent ? <Chip tone="muted">demo fixture</Chip> : plan.highlight ? <Chip tone="info">most fit</Chip> : null}
              </div>
              <p className="mt-2 min-h-[40px] text-[13px] leading-relaxed text-black/45">{plan.tagline}</p>
              <div className="mt-4 flex items-end gap-1.5 border-t border-black/[0.06] pt-4">
                <span className="font-[family-name:var(--font-plex)] text-4xl font-light text-[#111]">{thb(plan.annual)}</span>
                <span className="mb-1 text-[12px] text-black/40">/ yr</span>
              </div>
              <div className="mt-4">
                <span className="rounded-full border border-black/[0.08] px-2.5 py-1 text-[10px] uppercase tracking-[0.06em] text-black/45">
                  {plan.limits.suppliers}
                </span>
              </div>
              <ul className="mt-4 flex-1 space-y-2.5 border-t border-black/[0.06] pt-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-[13px] text-black/60">
                    <Check size={15} strokeWidth={1.5} className="mt-0.5 flex-none text-[#047857]" /> {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {cta.kind === "current" ? (
                  <Button variant="secondary" className="w-full" disabled>
                    <Check size={14} strokeWidth={2} /> Demo selection
                  </Button>
                ) : (
                  <Button variant="secondary" className="w-full" onClick={() => unavailable(cta.kind === "contact" ? "Sales request" : "Plan change")}>
                    {cta.label} <ArrowRight size={14} strokeWidth={1.5} />
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="p-6">
          <Eyebrow>Payment integration</Eyebrow>
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-black/[0.08] p-4">
            <span className="grid h-10 w-14 place-items-center rounded-lg bg-[#111] text-white"><CreditCard size={18} strokeWidth={1.5} /></span>
            <div className="flex-1">
              <div className="font-mono text-[13px] text-black/70">Not configured</div>
              <div className="text-[11px] text-black/40">No card or payment token is stored.</div>
            </div>
            <Button variant="ghost" size="sm" disabled>Unavailable</Button>
          </div>
          <p className="mt-3 text-[11px] text-black/35">A production payment provider and audited webhook/entitlement flow must be selected before billing can operate.</p>
        </Card>

        <Card className="p-6">
          <Eyebrow>Illustrative invoice fixtures</Eyebrow>
          <div className="mt-2 divide-y divide-black/[0.06]">
            {INVOICE_FIXTURES.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-[13px] text-black/70">{invoice.id}</div>
                  <div className="font-mono text-[11px] text-black/40">{invoice.date} · {invoice.plan}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[13px] text-black/60">{invoice.amount}</span>
                  <button onClick={() => unavailable("Invoice")} className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.08em] text-black/55 hover:border-black/25 hover:text-black">
                    <Download size={13} strokeWidth={1.5} /> Unavailable
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <p className="text-center text-xs text-black/35">
        Need EUDR, CSRD or another origin country?{" "}
        <Link href="/regulations" className="text-black/55 underline-offset-2 hover:text-black hover:underline">See what&apos;s coming →</Link>
      </p>
    </div>
  );
}
