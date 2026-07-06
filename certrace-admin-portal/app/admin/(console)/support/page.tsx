"use client";

import * as React from "react";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { FilterChips, SectionTitle, StatusChip, Table, Td, Th } from "@/components/admin/bits";
import { ModuleGuard } from "@/components/admin/shell";
import { useAdminStore, allTickets } from "@/lib/admin-store";
import { getOrg, getStaff, getDepartment, type TicketStatus } from "@/lib/admin-data";

type Filter = "all" | TicketStatus;

const PRIORITY_STYLE: Record<string, string> = {
  urgent: "bg-[#fef2f2] text-[#dc2626]",
  high: "bg-[#fffbeb] text-[#b45309]",
  normal: "bg-black/[0.04] text-black/45",
  low: "bg-black/[0.03] text-black/35",
};

export default function Support() {
  useAdminStore();
  const [filter, setFilter] = React.useState<Filter>("all");
  const tickets = allTickets();
  const rows = tickets.filter((t) => filter === "all" || t.status === filter);
  const count = (s: TicketStatus) => tickets.filter((t) => t.status === s).length;

  return (
    <ModuleGuard module="support">
      <div className="ct-enter space-y-6">
        <PageHeader
          eyebrow="Support / Helpdesk"
          title="Ticket queue"
          lead="Tier 1 triages; Tier 2 escalates and routes across departments — billing disputes to Revenue Ops, data-correctness to Regulatory Affairs."
        />

        <FilterChips<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All", count: tickets.length },
            { value: "open", label: "Open", count: count("open") },
            { value: "pending", label: "Pending", count: count("pending") },
            { value: "escalated", label: "Escalated", count: count("escalated") },
            { value: "resolved", label: "Resolved", count: count("resolved") },
          ]}
        />

        <Card>
          <SectionTitle>{rows.length} ticket{rows.length === 1 ? "" : "s"}</SectionTitle>
          <Table>
            <thead><tr><Th>Ticket</Th><Th>Organisation</Th><Th>Priority</Th><Th>Routed to</Th><Th>Assignee</Th><Th>SLA due</Th><Th>Status</Th></tr></thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="ct-row transition-colors hover:bg-black/[0.02]">
                  <Td className="max-w-sm">
                    <Link href={`/admin/support/${t.id}`} className="text-black/75 hover:text-black">
                      <span className="mr-2 font-mono text-[11px] text-black/40">{t.id}</span>
                      {t.subject}
                    </Link>
                  </Td>
                  <Td className="whitespace-nowrap">{getOrg(t.orgId)?.name}</Td>
                  <Td>
                    <span className={`rounded-md px-2 py-0.5 font-pixel text-[10px] uppercase tracking-[0.12em] ${PRIORITY_STYLE[t.priority]}`}>
                      {t.priority}
                    </span>
                  </Td>
                  <Td><span className="font-mono text-[11px] text-black/50">{getDepartment(t.routedTo).code}</span></Td>
                  <Td className="whitespace-nowrap">{t.assigneeId ? getStaff(t.assigneeId)?.name : "—"}</Td>
                  <Td><span className="font-mono text-[11px] text-black/40">{t.slaDue.slice(5)}</span></Td>
                  <Td><StatusChip value={t.status} /></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </ModuleGuard>
  );
}
