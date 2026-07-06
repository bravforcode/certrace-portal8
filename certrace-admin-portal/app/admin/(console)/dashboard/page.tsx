"use client";

import Link from "next/link";
import { Card, PageHeader, Stat, StatusDot } from "@/components/ui";
import { MiniBars, SectionTitle, StatusChip, Table, Td, Th } from "@/components/admin/bits";
import { ModuleGuard } from "@/components/admin/shell";
import { useAdminAuth, roleOf } from "@/lib/admin-auth";
import { useAdminStore, allQueue, allAudit, allDrafts, allTickets } from "@/lib/admin-store";
import { KPIS, MRR_TREND, ORGS, DECLARATIONS, getOrg, getStaff } from "@/lib/admin-data";

export default function Dashboard() {
  const { user, can } = useAdminAuth();
  useAdminStore();
  if (!user) return null;

  const queue = allQueue().filter((q) => q.status !== "resolved");
  const audit = allAudit().slice(0, 6);
  const pendingDrafts = allDrafts().filter((d) => d.status === "awaiting-approval").length;
  const openTickets = allTickets().filter((t) => t.status !== "resolved").length;
  const watchlist = [
    ...ORGS.filter((o) => o.renewalRisk).map((o) => ({
      key: o.id,
      label: o.name,
      note: "Account renewal-risk",
      href: `/admin/accounts/${o.id}`,
      tone: "err" as const,
    })),
    ...DECLARATIONS.filter((d) => d.riskFlags.length > 0).map((d) => ({
      key: d.id,
      label: `${getOrg(d.orgId)?.name} — ${d.title}`,
      note: d.riskFlags.join(" · "),
      href: `/admin/declarations`,
      tone: "warn" as const,
    })),
  ];

  return (
    <ModuleGuard module="dashboard">
      <div className="ct-enter space-y-6">
        <PageHeader
          eyebrow="Certrace · Staff"
          title={`Morning, ${user.name.split(" ")[0]}`}
          lead={`Signed in as ${roleOf(user).name}. Company-wide view across ${ORGS.length} tenant organisations.`}
        />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="p-5"><Stat value={`€${KPIS.mrr.toLocaleString()}`} label="MRR" sub={`${KPIS.activeOrgs} paying orgs · ${KPIS.trials} trials`} /></Card>
          <Card className="p-5"><Stat value={KPIS.declarationsInFlight} label="Declarations in flight" sub="across all tenants" /></Card>
          <Card className="p-5"><Stat value={queue.length} label="Verification queue" sub={`${pendingDrafts} reg draft${pendingDrafts === 1 ? "" : "s"} awaiting approval`} /></Card>
          <Card className="p-5"><Stat value={openTickets} label="Open tickets" sub={`${KPIS.renewalRisk} account at renewal risk`} /></Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <SectionTitle>Revenue trend</SectionTitle>
            <div className="px-5 pb-5">
              <MiniBars data={MRR_TREND} format={(v) => `€${(v / 1000).toFixed(1)}k`} />
            </div>
          </Card>

          <Card>
            <SectionTitle>Risk watchlist</SectionTitle>
            <ul className="px-5 pb-4">
              {watchlist.map((w) => (
                <li key={w.key} className="border-b border-black/[0.05] py-2.5 last:border-b-0">
                  <Link href={w.href} className="group flex items-start gap-2.5">
                    <StatusDot tone={w.tone} className="mt-1.5" />
                    <span>
                      <span className="block text-[13px] text-black/70 group-hover:text-black">{w.label}</span>
                      <span className="block text-xs text-black/40">{w.note}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {can("verification") !== "none" && (
          <Card>
            <SectionTitle
              aside={<Link href="/admin/verification-queue" className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/35 hover:text-black">View queue →</Link>}
            >
              Verification queue — open items
            </SectionTitle>
            <Table>
              <thead><tr><Th>Item</Th><Th>Org</Th><Th>Kind</Th><Th>SLA</Th><Th>Status</Th></tr></thead>
              <tbody>
                {queue.map((q) => (
                  <tr key={q.id} className="ct-row">
                    <Td className="max-w-md">{q.summary}</Td>
                    <Td>{getOrg(q.orgId)?.name}</Td>
                    <Td><span className="font-mono text-[11px] text-black/50">{q.kind}</span></Td>
                    <Td><span className="font-mono text-[11px] text-black/50">{q.slaHours}h</span></Td>
                    <Td><StatusChip value={q.status} /></Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        )}

        <Card>
          <SectionTitle
            aside={can("audit") !== "none" ? <Link href="/admin/audit-log" className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/35 hover:text-black">Full log →</Link> : undefined}
          >
            Recent activity
          </SectionTitle>
          <ul className="px-5 pb-4">
            {audit.map((e) => (
              <li key={e.id} className="flex items-baseline gap-3 border-b border-black/[0.05] py-2.5 text-[13px] last:border-b-0">
                <span className="w-28 flex-none font-mono text-[11px] text-black/35">{e.at.slice(5)}</span>
                <span className="text-black/70">
                  <span className="text-black/45">{getStaff(e.actorId)?.name ?? e.actorId}</span>{" "}
                  <span className="font-mono text-[12px]">{e.action}</span>{" "}
                  <span className="text-black/45">→ {e.target}</span>
                  {e.superFlag && <span className="ml-2 rounded bg-[#3C7ACB]/10 px-1.5 py-0.5 font-pixel text-[9px] uppercase tracking-[0.12em] text-[#2c5c9c]">Super admin</span>}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </ModuleGuard>
  );
}
