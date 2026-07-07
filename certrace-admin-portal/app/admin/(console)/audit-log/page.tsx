"use client";

import * as React from "react";
import { Card, PageHeader } from "@/components/ui";
import { FilterChips, SectionTitle, Table, Td, Th } from "@/components/admin/bits";
import { ModuleGuard } from "@/components/admin/shell";
import { useAdminStore, allAudit, staffName } from "@/lib/admin-store";
import { type ModuleId } from "@/lib/admin-data";

type Filter = "all" | "super" | ModuleId;

export default function AuditLog() {
  useAdminStore();
  const [filter, setFilter] = React.useState<Filter>("all");
  const events = allAudit();

  const rows = events.filter((e) => {
    if (filter === "all") return true;
    if (filter === "super") return e.superFlag;
    return e.module === filter;
  });

  const moduleCounts = new Map<ModuleId, number>();
  for (const e of events) moduleCounts.set(e.module, (moduleCounts.get(e.module) ?? 0) + 1);
  const topModules = [...moduleCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <ModuleGuard module="audit">
      <div className="ct-enter space-y-6">
        <PageHeader
          eyebrow="Audit log"
          title="Immutable event feed"
          lead="Every mutating staff action, with actor, target and reason. Append-only — this is the module that makes every other module's power safe to grant. Super Admin actions are surfaced, not just logged."
        />

        <FilterChips<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All", count: events.length },
            { value: "super", label: "Super admin", count: events.filter((e) => e.superFlag).length },
            ...topModules.map(([m, c]) => ({ value: m as Filter, label: m, count: c })),
          ]}
        />

        <Card>
          <SectionTitle>{rows.length} event{rows.length === 1 ? "" : "s"}</SectionTitle>
          <Table>
            <thead><tr><Th>When</Th><Th>Actor</Th><Th>Module</Th><Th>Action</Th><Th>Target</Th><Th>Detail</Th></tr></thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className={`ct-row ${e.superFlag ? "bg-[#3C7ACB]/[0.04]" : ""}`}>
                  <Td><span className="whitespace-nowrap font-mono text-[11px] text-black/40">{e.at}</span></Td>
                  <Td className="whitespace-nowrap">
                    {staffName(e.actorId)}
                    {e.superFlag && (
                      <span className="ml-2 rounded bg-[#3C7ACB]/10 px-1.5 py-0.5 font-pixel text-[9px] uppercase tracking-[0.12em] text-[#2c5c9c]">Super</span>
                    )}
                  </Td>
                  <Td><span className="font-mono text-[11px] text-black/50">{e.module}</span></Td>
                  <Td><span className="font-mono text-[12px] text-black/70">{e.action}</span></Td>
                  <Td><span className="font-mono text-[11px] text-black/50">{e.target}</span></Td>
                  <Td className="max-w-md text-xs text-black/45">{e.detail ?? "—"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        <p className="text-xs text-black/35">
          MVP note: live events persist to this browser only. Production requires the append-only, hash-chained server
          store from SECURITY.md — client-mutable audit data is a blocking gap.
        </p>
      </div>
    </ModuleGuard>
  );
}
