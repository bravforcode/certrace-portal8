"use client";

import * as React from "react";
import { Pencil, UserPlus, X } from "lucide-react";
import { Button, Card, Field, PageHeader, TagBadge, inputClass } from "@/components/ui";
import { Modal, Select } from "@/components/controls";
import { LevelBadge, SectionTitle, StatusChip, Table, Td, Th } from "@/components/admin/bits";
import { ModuleGuard } from "@/components/admin/shell";
import { toast } from "@/components/toast";
import { useAdminAuth } from "@/lib/admin-auth";
import { useAdminStore, addStaffFixture, allStaff, updateStaff } from "@/lib/admin-store";
import { DEPARTMENTS, ROLES, DEPT_ACCESS, getRole, getDepartment, type ModuleId, type StaffUser } from "@/lib/admin-data";

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

const ROLE_OPTIONS = ROLES.map((r) => ({
  value: r.id,
  label: r.name,
  hint: `${getDepartment(r.dept).name} · tier ${r.tier}`,
}));

const validEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v);

function StaffForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial: { name: string; email: string; roleId: string };
  submitLabel: string;
  onSubmit: (v: { name: string; email: string; roleId: string }) => void;
}) {
  const [name, setName] = React.useState(initial.name);
  const [email, setEmail] = React.useState(initial.email);
  const [roleId, setRoleId] = React.useState(initial.roleId);
  const valid = name.trim().length >= 2 && validEmail(email) && roleId;

  return (
    <div className="space-y-4">
      <Field label="Full name">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nariya Suksawat" className={inputClass} />
      </Field>
      <Field label="Work email" hint="Must be a certrace.dev address in production — mock accepts any email.">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@certrace.dev" className={inputClass} />
      </Field>
      <Field label="Role" hint={roleId ? getRole(roleId).blurb : undefined}>
        <Select value={roleId} onChange={setRoleId} options={ROLE_OPTIONS} placeholder="Select a role…" ariaLabel="Role" />
      </Field>
      <div className="flex justify-end pt-1">
        <Button size="sm" disabled={!valid} onClick={() => onSubmit({ name: name.trim(), email: email.trim(), roleId })}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

export default function StaffAndRoles() {
  const { user, hasPower } = useAdminAuth();
  useAdminStore();
  const canManage = hasPower("manage-staff");
  const [inviting, setInviting] = React.useState(false);
  const [editing, setEditing] = React.useState<StaffUser | null>(null);

  const staff = allStaff();

  const handleInvite = (v: { name: string; email: string; roleId: string }) => {
    if (!user) return;
    addStaffFixture(user, v);
    setInviting(false);
    toast({ message: `${v.name} added as a local fixture`, detail: "No account, invitation, email, or production access was created." });
  };

  const handleEdit = (v: { name: string; email: string; roleId: string }) => {
    if (!user || !editing) return;
    const changes: string[] = [];
    if (v.name !== editing.name) changes.push(`name → ${v.name}`);
    if (v.email !== editing.email) changes.push(`email → ${v.email}`);
    if (v.roleId !== editing.roleId) changes.push(`role ${getRole(editing.roleId).name} → ${getRole(v.roleId).name}`);
    if (changes.length === 0) {
      setEditing(null);
      return;
    }
    updateStaff(
      user,
      editing.id,
      { name: v.name, email: v.email, roleId: v.roleId },
      v.roleId !== editing.roleId ? "staff.role-change" : "staff.update",
      changes.join(" · "),
    );
    setEditing(null);
    toast({ message: `${v.name} updated`, detail: changes.join(" · ") });
  };

  const setStatus = (person: StaffUser, status: "active" | "deactivated") => {
    if (!user) return;
    updateStaff(
      user,
      person.id,
      { status },
      status === "deactivated" ? "staff.deactivate" : "staff.reactivate",
      `${person.name} (${getRole(person.roleId).name})`,
    );
    setEditing(null);
    toast({
      message: status === "deactivated" ? `${person.name} fixture deactivated` : `${person.name} fixture reactivated`,
      detail: "Browser-local demo status changed; no production identity, access, or session was affected.",
      tone: status === "deactivated" ? "warn" : "ok",
    });
  };

  return (
    <ModuleGuard module="staff">
      <div className="ct-enter space-y-6">
        <PageHeader
          eyebrow="Staff & roles"
          title="Certrace staff directory"
          lead={`${staff.length} browser-local staff fixtures across ${DEPARTMENTS.length - 1} departments plus a Super Admin demo tier. These roles do not grant production access.`}
          actions={
            canManage ? (
              <Button size="sm" onClick={() => setInviting(true)}>
                <UserPlus size={14} strokeWidth={1.5} /> Add staff fixture
              </Button>
            ) : undefined
          }
        />

        {DEPARTMENTS.map((dept) => {
          const roles = ROLES.filter((r) => r.dept === dept.id);
          const people = staff.filter((s) => getRole(s.roleId).dept === dept.id);
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
                    <thead><tr><Th>Person</Th><Th>Role</Th><Th>Status</Th><Th>Last login</Th>{canManage && <Th />}</tr></thead>
                    <tbody>
                      {people.map((p) => (
                        <tr key={p.id} className="ct-row">
                          <Td className={p.status === "deactivated" ? "opacity-50" : undefined}>
                            {p.name}
                            <span className="block font-mono text-[10px] text-black/35">{p.email}</span>
                          </Td>
                          <Td><TagBadge>{getRole(p.roleId).name}</TagBadge></Td>
                          <Td><StatusChip value={p.status} /></Td>
                          <Td><span className="font-mono text-[11px] text-black/40">{p.lastLoginAt}</span></Td>
                          {canManage && (
                            <Td>
                              <button
                                type="button"
                                aria-label={`Edit ${p.name}`}
                                onClick={() => setEditing(p)}
                                className="rounded-lg p-1.5 text-black/35 transition-colors hover:bg-black/[0.05] hover:text-black"
                              >
                                <Pencil size={13} strokeWidth={1.5} />
                              </button>
                            </Td>
                          )}
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
            {canManage ? " You can add browser-local staff fixtures and edit their demo roles." : " Editing requires the manage-staff demo power."}
          </p>
        </Card>

        {/* Invite */}
        <Modal open={inviting} onClose={() => setInviting(false)} labelledBy="invite-title">
          <div className="flex items-start justify-between gap-4 p-6 pb-4">
            <div>
              <h2 id="invite-title" className="font-[family-name:var(--font-plex)] text-xl font-light tracking-tight text-[#111]">Add staff fixture</h2>
              <p className="mt-1 text-xs text-black/45">Saved in this browser only. No identity account, email invitation, or authenticated access is created.</p>
            </div>
            <button type="button" aria-label="Close" onClick={() => setInviting(false)} className="rounded-lg p-2 text-black/40 transition-colors hover:bg-black/[0.05] hover:text-black">
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
          <div className="p-6 pt-0">
            <StaffForm initial={{ name: "", email: "", roleId: "" }} submitLabel="Add local fixture" onSubmit={handleInvite} />
          </div>
        </Modal>

        {/* Edit */}
        <Modal open={!!editing} onClose={() => setEditing(null)} labelledBy="edit-title">
          {editing && (
            <>
              <div className="flex items-start justify-between gap-4 p-6 pb-4">
                <div>
                  <h2 id="edit-title" className="font-[family-name:var(--font-plex)] text-xl font-light tracking-tight text-[#111]">Edit {editing.name}</h2>
                  <p className="mt-1 text-xs text-black/45">Name, email and role changes are audited{editing.id === user?.id ? " · this is your own account" : ""}.</p>
                </div>
                <button type="button" aria-label="Close" onClick={() => setEditing(null)} className="rounded-lg p-2 text-black/40 transition-colors hover:bg-black/[0.05] hover:text-black">
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>
              <div className="p-6 pt-0">
                <StaffForm
                  key={editing.id}
                  initial={{ name: editing.name, email: editing.email, roleId: editing.roleId }}
                  submitLabel="Save changes"
                  onSubmit={handleEdit}
                />
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-black/[0.06] pt-4">
                  {editing.status === "deactivated" ? (
                    <Button size="sm" variant="secondary" onClick={() => setStatus(editing, "active")}>Reactivate fixture</Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={editing.id === user?.id}
                      title={editing.id === user?.id ? "You cannot deactivate your own account." : undefined}
                      className="!text-[#dc2626] hover:!border-[#dc2626]/40 hover:!bg-[#fef2f2]"
                      onClick={() => setStatus(editing, "deactivated")}
                    >
                      Deactivate fixture
                    </Button>
                  )}
                  <span className="text-xs text-black/35">
                    Browser-local demo status only; no production session is controlled here.
                  </span>
                </div>
              </div>
            </>
          )}
        </Modal>
      </div>
    </ModuleGuard>
  );
}
