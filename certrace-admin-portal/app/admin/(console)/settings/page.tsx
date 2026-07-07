"use client";

import { useRouter } from "next/navigation";
import { Button, Card, PageHeader, TagBadge } from "@/components/ui";
import { KV, SectionTitle } from "@/components/admin/bits";
import { ModuleGuard } from "@/components/admin/shell";
import { useAdminAuth, roleOf, deptOf } from "@/lib/admin-auth";
import { resetStore } from "@/lib/admin-store";

export default function StaffSettings() {
  const { user, signOut } = useAdminAuth();
  const router = useRouter();
  if (!user) return null;

  const role = roleOf(user);
  const dept = deptOf(user);

  return (
    <ModuleGuard module="dashboard">
      <div className="ct-enter space-y-6">
        <PageHeader eyebrow="Settings" title="Your staff profile" lead="Session, role and demo controls." />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <SectionTitle>Identity</SectionTitle>
            <div className="-mt-2 px-5 pb-4">
              <KV k="Name" v={user.name} />
              <KV k="Email" v={<span className="font-mono text-[12px]">{user.email}</span>} />
              <KV k="Department" v={`${dept.name} (${dept.code})`} />
              <KV k="Role" v={<TagBadge>{role.name}</TagBadge>} />
              <KV k="2FA" v="Enforced (mock)" />
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle>Role powers</SectionTitle>
            <div className="px-5 pb-4">
              {role.powers.length === 0 ? (
                <p className="text-sm text-black/45">No elevated powers — module access only.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {role.powers.map((p) => (
                    <span key={p} className="rounded bg-black/[0.05] px-2 py-1 font-mono text-[11px] text-black/55">{p}</span>
                  ))}
                </div>
              )}
              <p className="mt-3 text-xs text-black/35">{role.blurb}</p>
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <SectionTitle>Session & demo data</SectionTitle>
          <div className="flex flex-wrap items-center gap-3 px-5 pb-4">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                signOut();
                router.replace("/admin/login");
              }}
            >
              Sign out / switch role
            </Button>
            <Button size="sm" variant="ghost" onClick={() => resetStore()}>
              Reset demo data
            </Button>
            <span className="text-xs text-black/35">Reset clears local actions (queue, drafts, replies, flags, staff invites/edits, invoice payments, announcements, audit) back to fixtures.</span>
          </div>
        </Card>
      </div>
    </ModuleGuard>
  );
}
