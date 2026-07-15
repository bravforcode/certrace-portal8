"use client";

import { Card, PageHeader, Progress, Stat } from "@/components/ui";
import { MiniBars, SectionTitle, StatusChip, Table, Td, Th } from "@/components/admin/bits";
import { ModuleGuard } from "@/components/admin/shell";
import { DECLARATIONS, FUNNEL, KPIS, MRR_TREND, ORGS, QUEUE, getOrg, thb, thbCompact } from "@/lib/admin-data";

export default function Reports() {
  const byStatus = ["collecting", "in-review", "approved", "draft-preview"].map((s) => ({
    status: s,
    count: DECLARATIONS.filter((d) => d.status === s).length,
  }));
  const resolvedQueue = QUEUE.filter((q) => q.status === "resolved").length;

  return (
    <ModuleGuard module="reports">
      <div className="ct-enter space-y-6">
        <PageHeader
          eyebrow="Analytics & reports"
          title="Business intelligence"
          lead="The roll-up view: adoption funnel, compliance-risk distribution, revenue trend and verification SLA performance."
        />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="p-5"><Stat value={thb(KPIS.mrr)} label="MRR" sub="flat month-over-month" /></Card>
          <Card className="p-5"><Stat value={`${Math.round((FUNNEL[4].value / FUNNEL[1].value) * 100)}%`} label="Trial → paid" sub={`${FUNNEL[1].value} trials, 30 days`} /></Card>
          <Card className="p-5"><Stat value={`${Math.round((resolvedQueue / QUEUE.length) * 100)}%`} label="Queue resolved" sub={`${resolvedQueue}/${QUEUE.length} items`} /></Card>
          <Card className="p-5"><Stat value={KPIS.renewalRisk} label="Accounts at risk" sub="of renewal churn" /></Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <SectionTitle>Adoption funnel (30 days)</SectionTitle>
            <div className="space-y-3 px-5 pb-5">
              {FUNNEL.map((f, i) => (
                <div key={f.stage}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="text-[13px] text-black/60">{f.stage}</span>
                    <span className="font-mono text-[12px] text-black/45">{f.value.toLocaleString()}</span>
                  </div>
                  <Progress value={(f.value / FUNNEL[Math.max(0, i - 1)].value) * 100} tone={i === 0 ? "ok" : "info"} />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle>Revenue trend</SectionTitle>
            <div className="px-5 pb-5">
              <MiniBars data={MRR_TREND} format={thbCompact} />
              <p className="mt-4 text-xs text-black/40">
                Flat Jun→Jul: no new paid conversions this month; two trials in late-stage evaluation.
              </p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <SectionTitle>Declarations by stage</SectionTitle>
            <div className="space-y-3 px-5 pb-5">
              {byStatus.map((b) => (
                <div key={b.status} className="flex items-center gap-4">
                  <span className="w-28 flex-none"><StatusChip value={b.status} /></span>
                  <div className="flex-1"><Progress value={(b.count / DECLARATIONS.length) * 100} tone="info" /></div>
                  <span className="w-6 text-right font-mono text-[12px] text-black/45">{b.count}</span>
                </div>
              ))}
              <p className="pt-1 text-xs text-black/40">
                {DECLARATIONS.filter((d) => d.riskFlags.length > 0).length} of {DECLARATIONS.length} declarations carry at least one risk flag.
              </p>
            </div>
          </Card>

          <Card>
            <SectionTitle>Renewal watch</SectionTitle>
            <Table className="min-w-0">
              <thead><tr><Th>Organisation</Th><Th>Health</Th><Th>Signal</Th></tr></thead>
              <tbody>
                {ORGS.filter((o) => o.renewalRisk || o.health < 65).map((o) => (
                  <tr key={o.id} className="ct-row">
                    <Td>{getOrg(o.id)?.name}</Td>
                    <Td><span className="font-mono text-[12px]">{o.health}</span></Td>
                    <Td className="text-xs text-black/45">{o.renewalRisk ? "Flagged renewal-risk" : "Health below 65"}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </div>
      </div>
    </ModuleGuard>
  );
}
