"use client";

import * as React from "react";
import Link from "next/link";
import { Card, PageHeader, TagBadge } from "@/components/ui";
import { FilterChips, HealthBar, Table, Td, Th } from "@/components/admin/bits";
import { ModuleGuard } from "@/components/admin/shell";
import { ORGS, getStaff, type OrgKind } from "@/lib/admin-data";

type Filter = "all" | OrgKind | "risk";

export default function Accounts() {
  const [filter, setFilter] = React.useState<Filter>("all");
  const [q, setQ] = React.useState("");

  const rows = ORGS.filter((o) => {
    if (filter === "risk" && !o.renewalRisk) return false;
    if (filter !== "all" && filter !== "risk" && o.kind !== filter) return false;
    if (q && !o.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <ModuleGuard module="accounts">
      <div className="ct-enter space-y-6">
        <PageHeader
          eyebrow="Accounts"
          title="Tenant organisations"
          lead="Every exporter, supplier and verifier-partner org on the platform — plan, health, CS ownership and open work."
        />

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <FilterChips<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All", count: ORGS.length },
              { value: "exporter", label: "Exporters", count: ORGS.filter((o) => o.kind === "exporter").length },
              { value: "supplier", label: "Suppliers", count: ORGS.filter((o) => o.kind === "supplier").length },
              { value: "verifier-partner", label: "Verifier partners", count: ORGS.filter((o) => o.kind === "verifier-partner").length },
              { value: "risk", label: "Renewal risk", count: ORGS.filter((o) => o.renewalRisk).length },
            ]}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search organisations…"
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-black/70 placeholder:text-black/25 focus:border-black/25 focus:outline-none md:w-64"
          />
        </div>

        <Card>
          <Table>
            <thead>
              <tr><Th>Organisation</Th><Th>Kind</Th><Th>Plan</Th><Th>MRR</Th><Th>Seats</Th><Th>Health</Th><Th>CS owner</Th><Th>Last activity</Th></tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="ct-row transition-colors hover:bg-black/[0.02]">
                  <Td>
                    <Link href={`/admin/accounts/${o.id}`} className="text-black/80 hover:text-black">
                      {o.name}
                      {o.renewalRisk && <span className="ml-2 rounded bg-[#fef2f2] px-1.5 py-0.5 font-pixel text-[9px] uppercase tracking-[0.12em] text-[#dc2626]">Risk</span>}
                    </Link>
                  </Td>
                  <Td><span className="font-mono text-[11px] text-black/50">{o.kind}</span></Td>
                  <Td><TagBadge>{o.plan}</TagBadge></Td>
                  <Td><span className="font-mono text-[12px]">{o.mrr ? `€${o.mrr.toLocaleString()}` : "—"}</span></Td>
                  <Td>{o.seats}</Td>
                  <Td><HealthBar value={o.health} /></Td>
                  <Td className="whitespace-nowrap">{getStaff(o.csOwnerId)?.name}</Td>
                  <Td><span className="font-mono text-[11px] text-black/40">{o.lastActivity}</span></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </ModuleGuard>
  );
}
