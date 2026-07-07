"use client";

import * as React from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { Button, Card, PageHeader, Stat } from "@/components/ui";
import { FilterChips, SectionTitle, StatusChip, Table, Td, Th } from "@/components/admin/bits";
import { ModuleGuard } from "@/components/admin/shell";
import { InvoiceModal, invoiceLines } from "@/components/admin/invoice-modal";
import { toast } from "@/components/toast";
import { useAdminAuth } from "@/lib/admin-auth";
import { useAdminStore, allInvoices } from "@/lib/admin-store";
import { PLANS, KPIS, ORGS, getOrg, thb, type Invoice } from "@/lib/admin-data";

type Filter = "all" | Invoice["status"];

export default function Billing() {
  const { hasPower } = useAdminAuth();
  useAdminStore();
  const [filter, setFilter] = React.useState<Filter>("all");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const invoices = allInvoices();
  const rows = invoices.filter((i) => filter === "all" || i.status === filter);
  const overdue = invoices.filter((i) => i.status === "overdue");
  const count = (s: Invoice["status"]) => invoices.filter((i) => i.status === s).length;
  const canManage = hasPower("manage-billing");
  const canExport = canManage || hasPower("export-finance");
  const open = openId ? invoices.find((i) => i.id === openId) ?? null : null;

  const exportCsv = () => {
    const lines = [
      "invoice,organisation,period,issued,due,subtotal_thb,vat_thb,total_thb,status",
      ...invoices.map((i) => {
        const L = invoiceLines(i);
        return [i.id, `"${L.org?.name}"`, i.period, i.issuedAt, L.due, L.subtotal, L.vat, L.total, i.status].join(",");
      }),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([lines], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `certrace-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ message: "Invoice export downloaded", detail: `${invoices.length} invoices · amounts in THB.`, tone: "info" });
  };

  return (
    <ModuleGuard module="billing">
      <div className="ct-enter space-y-6">
        <PageHeader
          eyebrow="Billing & subscriptions"
          title="Revenue operations"
          lead="Plans, invoices and dunning across all tenants, billed in Thai baht. Credits follow segregation of duties: the analyst who drafts one cannot approve it."
          actions={
            canExport ? (
              <Button size="sm" variant="secondary" onClick={exportCsv}>
                <Download size={14} strokeWidth={1.5} /> Export CSV
              </Button>
            ) : undefined
          }
        />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="p-5"><Stat value={thb(KPIS.mrr)} label="MRR" /></Card>
          <Card className="p-5"><Stat value={KPIS.activeOrgs} label="Paying orgs" sub={`${KPIS.trials} trials in funnel`} /></Card>
          <Card className="p-5"><Stat value={overdue.length} label="Overdue invoices" sub={overdue.length ? `${thb(overdue.reduce((s, i) => s + i.amount, 0))} outstanding` : "nothing outstanding"} /></Card>
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
          <SectionTitle
            aside={
              <FilterChips<Filter>
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "all", label: "All", count: invoices.length },
                  { value: "due", label: "Due", count: count("due") },
                  { value: "overdue", label: "Overdue", count: count("overdue") },
                  { value: "paid", label: "Paid", count: count("paid") },
                ]}
              />
            }
          >
            Invoices
          </SectionTitle>
          <Table>
            <thead><tr><Th>Invoice</Th><Th>Organisation</Th><Th>Period</Th><Th>Amount (excl. VAT)</Th><Th>Issued</Th><Th>Status</Th></tr></thead>
            <tbody>
              {rows.map((i) => (
                <tr
                  key={i.id}
                  className="ct-row cursor-pointer transition-colors hover:bg-black/[0.02]"
                  onClick={() => setOpenId(i.id)}
                >
                  <Td><span className="font-mono text-[12px] underline decoration-black/20 underline-offset-2">{i.id}</span></Td>
                  <Td>
                    <Link href={`/admin/accounts/${i.orgId}`} onClick={(e) => e.stopPropagation()} className="hover:text-black">
                      {getOrg(i.orgId)?.name}
                    </Link>
                  </Td>
                  <Td>{i.period}</Td>
                  <Td><span className="font-mono text-[12px]">{thb(i.amount)}</span></Td>
                  <Td><span className="font-mono text-[11px] text-black/40">{i.issuedAt}</span></Td>
                  <Td><StatusChip value={i.status} /></Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <p className="px-5 pb-4 pt-1 text-xs text-black/35">Click an invoice to open it — full document, VAT breakdown, dunning and payment actions.</p>
        </Card>

        {!canManage && (
          <p className="text-xs text-black/35">
            Read-only for your role — managing subscriptions, credits and dunning requires the Revenue Ops Analyst role.
          </p>
        )}

        <InvoiceModal invoice={open} onClose={() => setOpenId(null)} />
      </div>
    </ModuleGuard>
  );
}
