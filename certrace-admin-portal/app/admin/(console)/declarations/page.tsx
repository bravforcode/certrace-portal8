"use client";

import * as React from "react";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { FilterChips, SectionTitle, StatusChip, Table, Td, Th } from "@/components/admin/bits";
import { ModuleGuard } from "@/components/admin/shell";
import { DECLARATIONS, getOrg, type DeclStatus } from "@/lib/admin-data";

type Filter = "all" | DeclStatus | "flagged";

export default function DeclarationsMonitor() {
  const [filter, setFilter] = React.useState<Filter>("all");

  const rows = DECLARATIONS.filter((d) => {
    if (filter === "flagged") return d.riskFlags.length > 0;
    if (filter !== "all") return d.status === filter;
    return true;
  });

  const count = (s: DeclStatus) => DECLARATIONS.filter((d) => d.status === s).length;

  return (
    <ModuleGuard module="declarations">
      <div className="ct-enter space-y-6">
        <PageHeader
          eyebrow="Declarations monitor"
          title="Declarations across all tenants"
          lead="Portfolio view of every declaration in flight — spot a systemic problem (a bad factor, a missed deadline pattern) before it becomes ten separate tickets."
        />

        <FilterChips<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All", count: DECLARATIONS.length },
            { value: "collecting", label: "Collecting", count: count("collecting") },
            { value: "in-review", label: "In review", count: count("in-review") },
            { value: "approved", label: "Approved", count: count("approved") },
            { value: "draft-preview", label: "Draft preview", count: count("draft-preview") },
            { value: "flagged", label: "Risk-flagged", count: DECLARATIONS.filter((d) => d.riskFlags.length > 0).length },
          ]}
        />

        <Card>
          <SectionTitle>{rows.length} declaration{rows.length === 1 ? "" : "s"}</SectionTitle>
          <Table>
            <thead>
              <tr><Th>Organisation</Th><Th>Declaration</Th><Th>Period</Th><Th>Suppliers</Th><Th>tCO₂e</Th><Th>Deadline</Th><Th>Status</Th><Th>Risk flags</Th></tr>
            </thead>
            <tbody>
              {rows.map((d) => {
                const org = getOrg(d.orgId);
                const deadlineSoon = d.status !== "draft-preview" && d.deadline <= "2027-01-31";
                return (
                  <tr key={d.id} className="ct-row transition-colors hover:bg-black/[0.02]">
                    <Td className="whitespace-nowrap">
                      <Link href={`/admin/accounts/${d.orgId}`} className="text-black/70 hover:text-black">{org?.name}</Link>
                    </Td>
                    <Td className="max-w-xs">{d.title}</Td>
                    <Td><span className="font-mono text-[11px]">{d.period}</span></Td>
                    <Td><span className="font-mono text-[11px]">{d.submitted}/{d.suppliers}</span></Td>
                    <Td><span className="font-mono text-[12px]">{d.tco2e ? d.tco2e.toLocaleString() : "—"}</span></Td>
                    <Td><span className={`font-mono text-[11px] ${deadlineSoon ? "text-[#b45309]" : "text-black/40"}`}>{d.deadline}</span></Td>
                    <Td><StatusChip value={d.status} /></Td>
                    <Td className="max-w-xs text-xs text-black/45">{d.riskFlags.join(" · ") || "—"}</Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>

        <p className="text-xs text-black/35">
          Staff view is read-mostly: annotate and flag here; data changes always happen through the tenant&apos;s own
          portal or a logged support workflow — never silently from the console.
        </p>
      </div>
    </ModuleGuard>
  );
}
