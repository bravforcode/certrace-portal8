"use client";

import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { SectionTitle, StatusChip, Table, Td, Th } from "@/components/admin/bits";
import { ModuleGuard } from "@/components/admin/shell";
import { DPAS, DSRS, RETENTION, getOrg, getStaff } from "@/lib/admin-data";

export default function LegalPrivacy() {
  return (
    <ModuleGuard module="legal">
      <div className="ct-enter space-y-6">
        <PageHeader
          eyebrow="Legal & data privacy"
          title="Contracts, requests & retention"
          lead="DPA repository, GDPR data-subject requests and retention-schedule enforcement — the production blockers SECURITY.md already names, given an owner."
        />

        <Card>
          <SectionTitle>Data processing agreements</SectionTitle>
          <Table>
            <thead><tr><Th>Organisation</Th><Th>Version</Th><Th>Signed</Th><Th>Status</Th></tr></thead>
            <tbody>
              {DPAS.map((d) => (
                <tr key={d.orgId} className="ct-row">
                  <Td><Link href={`/admin/accounts/${d.orgId}`} className="hover:text-black">{getOrg(d.orgId)?.name}</Link></Td>
                  <Td><span className="font-mono text-[12px]">{d.version}</span></Td>
                  <Td><span className="font-mono text-[11px] text-black/40">{d.signed}</span></Td>
                  <Td>
                    {d.status === "active"
                      ? <StatusChip value="active" />
                      : <span className="font-mono text-[11px] text-[#b45309]">{d.status}</span>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card>
          <SectionTitle>Data-subject requests (GDPR)</SectionTitle>
          <Table>
            <thead><tr><Th>Request</Th><Th>Type</Th><Th>Subject</Th><Th>Opened</Th><Th>Due</Th><Th>Owner</Th><Th>Status</Th></tr></thead>
            <tbody>
              {DSRS.map((r) => (
                <tr key={r.id} className="ct-row">
                  <Td><span className="font-mono text-[12px]">{r.id}</span></Td>
                  <Td>{r.type}</Td>
                  <Td className="max-w-xs text-black/60">{r.subject}</Td>
                  <Td><span className="font-mono text-[11px] text-black/40">{r.opened}</span></Td>
                  <Td><span className={`font-mono text-[11px] ${r.status !== "closed" ? "text-[#b45309]" : "text-black/40"}`}>{r.due}</span></Td>
                  <Td className="whitespace-nowrap">{getStaff(r.ownerId)?.name}</Td>
                  <Td>
                    <StatusChip value={r.status === "closed" ? "resolved" : r.status === "open" ? "open" : "assigned"} label={r.status} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card>
          <SectionTitle>Retention schedules</SectionTitle>
          <Table>
            <thead><tr><Th>Data class</Th><Th>Schedule</Th><Th>Enforcement</Th></tr></thead>
            <tbody>
              {RETENTION.map((r) => (
                <tr key={r.dataClass} className="ct-row">
                  <Td>{r.dataClass}</Td>
                  <Td className="text-black/55">{r.schedule}</Td>
                  <Td>
                    {r.enforcement === "on schedule"
                      ? <StatusChip value="ok" label="on schedule" />
                      : <span className="font-mono text-[11px] text-[#b45309]">{r.enforcement}</span>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </ModuleGuard>
  );
}
