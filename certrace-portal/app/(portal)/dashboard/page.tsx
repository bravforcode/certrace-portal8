"use client";

import Link from "next/link";
import { ArrowRight, Plus, TriangleAlert, Bell } from "lucide-react";
import { Card, PageHeader, Button, Stat, Chip, StatusDot, Progress, Eyebrow, StatusLabel, EmptyState } from "@/components/ui";
import { SupplierTable } from "@/components/supplier-table";
import { FinancialLiabilityPreview } from "@/components/financial-liability-preview";
import { toast } from "@/components/toast";
import { DECLARATIONS, ORG, USER, getUniqueSuppliers } from "@/lib/data";
import { getRegulation, getPlan } from "@/lib/config";

const STEP_LABEL: Record<string, string> = {
  collect: "Collecting",
  calculate: "Calculating",
  comply: "Compliance",
  review: "In review",
  report: "Report",
  submit: "Submitting",
  done: "Closed demo",
};

export default function DashboardPage() {
  const active = DECLARATIONS.find((d) => d.id === "cbam-2026-annual-steel")!;
  const activeCount = DECLARATIONS.filter((d) => d.step !== "done").length;
  const submitted = active.suppliers.filter((s) => s.status === "submitted").length;
  const overdue = active.suppliers.filter((s) => s.status === "overdue").length;
  const completion = Math.round(
    active.suppliers.reduce((a, s) => a + s.progress, 0) / active.suppliers.length,
  );
  const plan = getPlan(ORG.plan)!;
  const supplierCount = getUniqueSuppliers().length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title={`Good afternoon, ${USER.name.split(" ")[0]}.`}
        lead="Your CBAM Q2 cycle is open and the deadline is inside three weeks. Here's what needs you."
        actions={
          <Link href="/declarations/new">
            <Button>
              <Plus size={15} strokeWidth={1.5} /> New declaration
            </Button>
          </Link>
        }
      />

      {/* Stat band */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="p-6">
          <Stat value={activeCount} label="Active declarations" />
        </Card>
        <Card className="p-6">
          <Stat value={`${submitted}/${active.suppliers.length}`} label="Suppliers submitted" sub="this cycle" />
        </Card>
        <Card className="p-6">
          <Stat value={`${completion}%`} label="Package ready" />
        </Card>
        <Card highlight className="p-6">
          <Stat value={`${active.dueInDays}d`} label="Next deadline" sub="CBAM Q2 · 31 Jul" />
        </Card>
        <Card className="p-6">
          <Stat
            value={plan.supplierCap != null ? `${supplierCount}/${plan.supplierCap}` : supplierCount}
            label="Suppliers, org-wide"
            sub={`${plan.name} plan cap`}
          />
        </Card>
      </div>

      {/* Priority alert */}
      <Card warm className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-xl border border-black/10 text-black/60">
            <TriangleAlert size={17} strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-sm text-[#111]">
              {overdue} CBAM-critical supplier{overdue === 1 ? " is" : "s are"} overdue on {active.name}.
            </p>
            <p className="mt-1 text-sm text-black/45">
              Follow up before the internal collection deadline. No email or automatic escalation is configured in this demo.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-none">
          <Button variant="ghost" size="sm" onClick={() => toast({ message: "Follow-up noted locally", tone: "info", detail: "No email was sent; a notification provider is not configured." })}>
            <Bell size={14} strokeWidth={1.5} /> Note follow-up
          </Button>
          <Link href={`/declarations/${active.id}`}>
            <Button variant="secondary" size="sm">
              Open declaration <ArrowRight size={14} strokeWidth={1.5} />
            </Button>
          </Link>
        </div>
      </Card>

      {/* Financial liability preview — estimated 2026 CBAM certificate cost */}
      <FinancialLiabilityPreview declaration={active} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Active declarations */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <Eyebrow>Active declarations</Eyebrow>
            <Link href="/declarations" className="text-[11px] uppercase tracking-[0.1em] text-black/40 hover:text-black">
              View all →
            </Link>
          </div>

          {DECLARATIONS.filter((d) => d.step !== "done").length === 0 ? (
            <EmptyState
              title="No active declarations"
              body="You're all caught up. Start a new declaration when you're ready."
              action={
                <Link href="/declarations/new">
                  <Button variant="secondary" size="sm">
                    <Plus size={14} strokeWidth={1.5} /> New declaration
                  </Button>
                </Link>
              }
            />
          ) : (
            DECLARATIONS.filter((d) => d.step !== "done").map((d) => {
              const reg = getRegulation(d.regulation);
              const done = d.suppliers.filter((s) => s.status === "submitted").length;
              const pct = Math.round((done / d.suppliers.length) * 100);
              return (
                <Link key={d.id} href={`/declarations/${d.id}`} className="block">
                  <Card className="p-5 transition-colors hover:border-black/15 hover:bg-[#fafaf8]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-[family-name:var(--font-plex)] text-lg font-light text-[#111]">
                            {reg?.short}
                          </span>
                          <span className="text-sm text-black/40">· {d.period}</span>
                        </div>
                        <p className="mt-0.5 text-[12px] text-black/40">
                          {d.sector} → {d.market} · due {d.due}
                        </p>
                      </div>
                      <Chip tone={d.dueInDays < 0 ? "err" : d.dueInDays < 21 ? "warn" : "muted"} pulse={false}>
                        {STEP_LABEL[d.step]}
                      </Chip>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <Progress value={pct} />
                      <span className="font-mono text-[11px] text-black/45">
                        {done}/{d.suppliers.length}
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })
          )}
        </section>

        {/* Live supplier feed */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <Eyebrow>Latest activity</Eyebrow>
            <StatusLabel tone="ok" label="live" pulse glow />
          </div>
          <SupplierTable rows={active.suppliers.slice(0, 6)} compact />
          <div className="flex items-center gap-4 px-1 pt-1 text-[11px] tracking-wide text-black/40">
            <span className="inline-flex items-center gap-1.5">
              <StatusDot tone="ok" /> {submitted} submitted
            </span>
            <span className="inline-flex items-center gap-1.5">
              <StatusDot tone="err" /> {overdue} overdue
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
