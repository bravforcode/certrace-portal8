"use client";

import Link from "next/link";
import { Card, PageHeader, Stat } from "@/components/ui";
import { SectionTitle, StatusChip, Table, Td, Th } from "@/components/admin/bits";
import { ModuleGuard } from "@/components/admin/shell";
import { useAdminAuth } from "@/lib/admin-auth";
import { INVOICES, PLANS, KPIS, ORGS, getOrg } from "@/lib/admin-data";

export default function Billing() {
  const { hasPower } = useAdminAuth();
  const overdue = INVOICES.filter((i) => i.status === "overdue");
  const canManage = hasPower("manage-billing");

  return (
    <ModuleGuard module="billing">
      <div className="ct-enter space-y-6">
        <PageHeader
          eyebrow="Billing & subscriptions"
          title="Revenue operations"
          lead="Plans, invoices and dunning across all tenants. Credits follow segregation of duties: the analyst who drafts one cannot approve it."
        />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="p-5"><Stat value={`€${KPIS.mrr.toLocaleString()}`} label="MRR" /></Card>
          <Card className="p-5"><Stat value={KPIS.activeOrgs} label="Paying orgs" sub={`${KPIS.trials} trials in funnel`} /></Card>
          <Card className="p-5"><Stat value={overdue.length} label="Overdue invoices" sub={overdue.length ? `€${overdue.reduce((s, i) => s + i.amount, 0).toLocaleString()} outstanding` : undefined} /></Card>
          <Card className="p-5"><Stat value={ORGS.filter((o) => o.renewalRisk).length} label="Renewal risk" /></Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {PLANS.map((p) => (
            <Card key={p.name} className="p-5">
              <div className="font-pixel text-[11px] uppercase tracking-[0.18em] text-black/40">{p.name}</div>
              <div className="mt-2 font-[family-name:var(--font-plex)] text-2xl font-light text-[#111]">{p.price}</div>
              <p className="mt-2 text-xs leading-relaxed text-black/45">{p.blurb}</p>
              <div className="mt-3 font-mono text-[11px] text-black/35">{p.orgs} org{p.orgs === 1 ? "" : "s"}</div>
            </Card>
          ))}
        </div>

        <Card>
          <SectionTitle>Invoices</SectionTitle>
          <Table>
            <thead><tr><Th>Invoice</Th><Th>Organisation</Th><Th>Period</Th><Th>Amount</Th><Th>Issued</Th><Th>Status</Th></tr></thead>
            <tbody>
              {INVOICES.map((i) => (
                <tr key={i.id} className="ct-row">
                  <Td><span className="font-mono text-[12px]">{i.id}</span></Td>
                  <Td><Link href={`/admin/accounts/${i.orgId}`} className="hover:text-black">{getOrg(i.orgId)?.name}</Link></Td>
                  <Td>{i.period}</Td>
                  <Td><span className="font-mono text-[12px]">€{i.amount.toLocaleString()}</span></Td>
                  <Td><span className="font-mono text-[11px] text-black/40">{i.issuedAt}</span></Td>
                  <Td><StatusChip value={i.status} /></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        {!canManage && (
          <p className="text-xs text-black/35">
            Read-only for your role — managing subscriptions, credits and dunning requires the Revenue Ops Analyst role.
          </p>
        )}
      </div>
    </ModuleGuard>
  );
}
