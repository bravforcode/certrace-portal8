"use client";

import { Card, PageHeader, TagBadge } from "@/components/ui";
import { LevelBadge, SectionTitle, StatusChip, Table, Td, Th } from "@/components/admin/bits";
import { ModuleGuard } from "@/components/admin/shell";
import { useAdminAuth } from "@/lib/admin-auth";
import { DEPARTMENTS, ROLES, STAFF, DEPT_ACCESS, getRole, type ModuleId } from "@/lib/admin-data";

const MATRIX_MODULES: { id: ModuleId; label: string }[] = [
  { id: "accounts", label: "Accounts" },
  { id: "declarations", label: "Declarations" },
  { id: "verification", label: "Verification" },
  { id: "regulatory", label: "Reg. data" },
  { id: "billing", label: "Billing" },
  { id: "support", label: "Support" },
  { id: "staff", label: "Staff" },
  { id: "audit", label: "Audit" },
  { id: "announcements", label: "Announce" },
  { id: "system", label: "System" },
  { id: "reports", label: "Reports" },
  { id: "legal", label: "Legal" },
];

export default function StaffAndRoles() {
  const { hasPower } = useAdminAuth();
  const canManage = hasPower("manage-staff");

  return (
    <ModuleGuard module="staff">
      <div className="ct-enter space-y-6">
        <PageHeader
          eyebrow="Staff & roles"
          title="Certrace staff directory"
          lead={`${STAFF.length} staff across ${DEPARTMENTS.length - 1} departments plus a narrowly-held Super Admin tier. Access is granted per department, refined per role.`}
        />

        {DEPARTMENTS.map((dept) => {
          const roles = ROLES.filter((r) => r.dept === dept.id);
          const people = STAFF.filter((s) => getRole(s.roleId).dept === dept.id);
          if (!roles.length) return null;
          return (
            <Card key={dept.id}>
              <SectionTitle aside={<span className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/30">{dept.code}</span>}>
                {dept.name}
              </SectionTitle>
              <div className="grid grid-cols-1 gap-4 px-5 pb-5 lg:grid-cols-2">
                <div className="space-y-3">
                  {roles.map((r) => (
                    <div key={r.id} className="rounded-2xl border border-black/[0.06] bg-[#faf9f7] p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-medium text-black/75">{r.name}</span>
                        <span className="font-pixel text-[10px] uppercase tracking-[0.12em] text-black/30">Tier {r.tier}</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-black/50">{r.blurb}</p>
                      {r.powers.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {r.powers.slice(0, 6).map((p) => (
                            <span key={p} className="rounded bg-black/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-black/45">{p}</span>
                          ))}
                          {r.powers.length > 6 && <span className="font-mono text-[10px] text-black/35">+{r.powers.length - 6} more</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div>
                  <Table className="min-w-0">
                    <thead><tr><Th>Person</Th><Th>Role</Th><Th>Status</Th><Th>Last login</Th></tr></thead>
                    <tbody>
                      {people.map((p) => (
                        <tr key={p.id} className="ct-row">
                          <Td>
                            {p.name}
                            <span className="block font-mono text-[10px] text-black/35">{p.email}</span>
                          </Td>
                          <Td><TagBadge>{getRole(p.roleId).name}</TagBadge></Td>
                          <Td><StatusChip value={p.status} /></Td>
                          <Td><span className="font-mono text-[11px] text-black/40">{p.lastLoginAt}</span></Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            </Card>
          );
        })}

        <Card>
          <SectionTitle>Department × module access matrix</SectionTitle>
          <Table>
            <thead>
              <tr>
                <Th>Department</Th>
                {MATRIX_MODULES.map((m) => <Th key={m.id} className="text-center">{m.label}</Th>)}
              </tr>
            </thead>
            <tbody>
              {DEPARTMENTS.map((d) => (
                <tr key={d.id} className="ct-row">
                  <Td className="whitespace-nowrap">
                    {d.name}
                    <span className="ml-2 font-pixel text-[9px] uppercase tracking-[0.12em] text-black/30">{d.code}</span>
                  </Td>
                  {MATRIX_MODULES.map((m) => (
                    <Td key={m.id} className="text-center"><LevelBadge level={DEPT_ACCESS[d.id][m.id]} /></Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
          <p className="px-5 pb-5 text-xs text-black/35">
            admin = owns the module · act = approve/act within scope · view = read-only. Fine-grained powers (publish,
            impersonate, calibrate…) attach to the role tier, not the department.
            {canManage ? " You can invite staff and edit role assignments." : " Editing requires the manage-staff power (Exec Admin, Platform Admin or Super Admin)."}
          </p>
        </Card>
      </div>
    </ModuleGuard>
  );
}
