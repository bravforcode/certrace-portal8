"use client";

import { Card, PageHeader, Switch } from "@/components/ui";
import { SectionTitle, StatusChip } from "@/components/admin/bits";
import { ModuleGuard } from "@/components/admin/shell";
import { useAdminAuth } from "@/lib/admin-auth";
import { useAdminStore, allFlags, toggleFlag } from "@/lib/admin-store";
import { INTEGRATIONS } from "@/lib/admin-data";

export default function SystemPage() {
  const { user, hasPower } = useAdminAuth();
  useAdminStore();
  const flags = allFlags();
  const canFlags = hasPower("flags");

  return (
    <ModuleGuard module="system">
      <div className="ct-enter space-y-6">
        <PageHeader
          eyebrow="System"
          title="Platform operations"
          lead="Feature flags, integrations and environment health. Flag changes are audited; production flags on customer-affecting paths follow maker-checker."
        />

        <Card>
          <SectionTitle>Feature flags</SectionTitle>
          <div className="px-5 pb-5">
            {flags.map((f) => (
              <div key={f.key} className="flex items-center justify-between gap-4 border-b border-black/[0.05] py-3.5 last:border-b-0">
                <div className="min-w-0">
                  <div className="font-mono text-[13px] text-black/75">{f.key}</div>
                  <p className="mt-0.5 text-xs text-black/45">{f.description}</p>
                  <span className="mt-1 inline-block rounded bg-black/[0.04] px-1.5 py-0.5 font-pixel text-[9px] uppercase tracking-[0.12em] text-black/40">
                    {f.scope}
                  </span>
                </div>
                <Switch
                  checked={f.enabled}
                  disabled={!canFlags}
                  ariaLabel={`Toggle ${f.key}`}
                  onChange={(v) => user && toggleFlag(user, f.key, v)}
                />
              </div>
            ))}
            {!canFlags && (
              <p className="pt-3 text-xs text-black/35">Toggling requires the Platform Admin role — read-only for you.</p>
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle>Integrations</SectionTitle>
          <ul className="px-5 pb-4">
            {INTEGRATIONS.map((i) => (
              <li key={i.name} className="flex items-center justify-between gap-4 border-b border-black/[0.05] py-3 last:border-b-0">
                <div>
                  <div className="text-[13px] text-black/75">{i.name}</div>
                  <p className="text-xs text-black/40">{i.note}</p>
                </div>
                <StatusChip value={i.status} label={i.status === "ok" ? "healthy" : "attention"} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </ModuleGuard>
  );
}
