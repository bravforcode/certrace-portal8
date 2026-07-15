"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { UserCog } from "lucide-react";
import { Button, Card, PageHeader, TagBadge } from "@/components/ui";
import { HealthBar, KV, SectionTitle, StatusChip, Table, Td, Th } from "@/components/admin/bits";
import { ModuleGuard } from "@/components/admin/shell";
import { useAdminAuth } from "@/lib/admin-auth";
import { useAdminStore, allTickets, allAudit, allInvoices, staffName } from "@/lib/admin-store";
import { InvoiceModal } from "@/components/admin/invoice-modal";
import { getOrg, getStaff, thb, DECLARATIONS, DPAS } from "@/lib/admin-data";

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const { hasPower } = useAdminAuth();
  useAdminStore();
  const [impOpen, setImpOpen] = React.useState(false);
  const [openInvoiceId, setOpenInvoiceId] = React.useState<string | null>(null);

  const org = getOrg(id);
  if (!org) {
    return (
      <ModuleGuard module="accounts">
        <div className="py-16 text-center text-sm text-black/45">Unknown organisation. <Link className="underline" href="/admin/accounts">Back to accounts</Link></div>
      </ModuleGuard>
    );
  }

  const decls = DECLARATIONS.filter((d) => d.orgId === org.id);
  const invoices = allInvoices().filter((i) => i.orgId === org.id);
  const openInvoice = openInvoiceId ? invoices.find((i) => i.id === openInvoiceId) ?? null : null;
  const tickets = allTickets().filter((t) => t.orgId === org.id);
  const dpa = DPAS.find((d) => d.orgId === org.id);
  const activity = allAudit().filter((e) => e.target === org.id || decls.some((d) => e.target === d.id));

  return (
    <ModuleGuard module="accounts">
      <div className="ct-enter space-y-6">
        <div className="font-pixel text-[11px] uppercase tracking-[0.16em] text-black/35">
          <Link href="/admin/accounts" className="hover:text-black">← Accounts</Link>
        </div>

        <PageHeader
          eyebrow={org.kind.replace("-", " ")}
          title={org.name}
          lead={`${org.sectors.join(", ")} · ${org.country} · customer since ${org.createdAt}`}
          actions={
            hasPower("impersonate") ? (
              <Button size="sm" variant="secondary" onClick={() => setImpOpen((v) => !v)}>
                <UserCog size={14} strokeWidth={1.5} /> Impersonate
              </Button>
            ) : undefined
          }
        />

        {impOpen && (
          <Card warm className="p-5">
            <p className="text-sm text-black/60">
              Impersonation is unavailable. It requires authoritative staff authentication, tenant authorization,
              short-lived server sessions, revocation, and an immutable security audit trail; none are configured in this demo.
            </p>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-5">
            <SectionTitle>Profile</SectionTitle>
            <div className="px-5 pb-4 -mt-2">
              <KV k="Plan" v={<TagBadge>{org.plan}</TagBadge>} />
              <KV k="MRR" v={org.mrr ? thb(org.mrr) : "—"} />
              <KV k="Seats" v={org.seats} />
              <KV k="Health" v={<HealthBar value={org.health} />} />
              <KV k="Renewal risk" v={org.renewalRisk ? "Yes — flagged by CS" : "No"} />
              <KV k="CS owner" v={getStaff(org.csOwnerId)?.name} />
              <KV k="DPA" v={dpa ? `${dpa.version} · ${dpa.status}` : "Not on file"} />
              <KV k="Last activity" v={<span className="font-mono text-[11px]">{org.lastActivity}</span>} />
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <SectionTitle>Declarations</SectionTitle>
            {decls.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-black/40">No declarations yet.</p>
            ) : (
              <Table>
                <thead><tr><Th>Declaration</Th><Th>Period</Th><Th>Suppliers</Th><Th>Status</Th><Th>Risk flags</Th></tr></thead>
                <tbody>
                  {decls.map((d) => (
                    <tr key={d.id} className="ct-row">
                      <Td>{d.title}</Td>
                      <Td><span className="font-mono text-[11px]">{d.period}</span></Td>
                      <Td><span className="font-mono text-[11px]">{d.submitted}/{d.suppliers}</span></Td>
                      <Td><StatusChip value={d.status} /></Td>
                      <Td className="text-xs text-black/45">{d.riskFlags.join(" · ") || "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <SectionTitle>Invoices</SectionTitle>
            {invoices.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-black/40">No invoices — {org.plan} plan.</p>
            ) : (
              <Table className="min-w-0">
                <thead><tr><Th>Invoice</Th><Th>Period</Th><Th>Amount</Th><Th>Status</Th></tr></thead>
                <tbody>
                  {invoices.map((i) => (
                    <tr
                      key={i.id}
                      className="ct-row cursor-pointer transition-colors hover:bg-black/[0.02]"
                      onClick={() => setOpenInvoiceId(i.id)}
                    >
                      <Td><span className="font-mono text-[12px] underline decoration-black/20 underline-offset-2">{i.id}</span></Td>
                      <Td>{i.period}</Td>
                      <Td><span className="font-mono text-[12px]">{thb(i.amount)}</span></Td>
                      <Td><StatusChip value={i.status} /></Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>

          <Card>
            <SectionTitle>Support tickets</SectionTitle>
            {tickets.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-black/40">No open tickets.</p>
            ) : (
              <ul className="px-5 pb-4">
                {tickets.map((t) => (
                  <li key={t.id} className="border-b border-black/[0.05] py-2.5 last:border-b-0">
                    <Link href={`/admin/support/${t.id}`} className="group flex items-center justify-between gap-3">
                      <span className="text-[13px] text-black/70 group-hover:text-black">
                        <span className="mr-2 font-mono text-[11px] text-black/40">{t.id}</span>
                        {t.subject}
                      </span>
                      <StatusChip value={t.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card>
          <SectionTitle>Account activity (audit)</SectionTitle>
          {activity.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-black/40">No audited staff actions touch this org yet.</p>
          ) : (
            <ul className="px-5 pb-4">
              {activity.map((e) => (
                <li key={e.id} className="flex items-baseline gap-3 border-b border-black/[0.05] py-2.5 text-[13px] last:border-b-0">
                  <span className="w-28 flex-none font-mono text-[11px] text-black/35">{e.at.slice(5)}</span>
                  <span className="text-black/70">
                    <span className="text-black/45">{staffName(e.actorId)}</span>{" "}
                    <span className="font-mono text-[12px]">{e.action}</span>
                    {e.detail && <span className="text-black/45"> — {e.detail}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <InvoiceModal invoice={openInvoice} onClose={() => setOpenInvoiceId(null)} />
      </div>
    </ModuleGuard>
  );
}
