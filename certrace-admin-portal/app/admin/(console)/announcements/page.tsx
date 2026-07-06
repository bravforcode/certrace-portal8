"use client";

import { Button, Card, PageHeader } from "@/components/ui";
import { SectionTitle, StatusChip } from "@/components/admin/bits";
import { ModuleGuard } from "@/components/admin/shell";
import { useAdminAuth } from "@/lib/admin-auth";
import { useAdminStore, allAnnouncements, publishAnnouncement } from "@/lib/admin-store";
import { getStaff } from "@/lib/admin-data";

export default function Announcements() {
  const { user, hasPower } = useAdminAuth();
  useAdminStore();
  const items = allAnnouncements();
  const canPublish = hasPower("publish-announcements");

  return (
    <ModuleGuard module="announcements">
      <div className="ct-enter space-y-6">
        <PageHeader
          eyebrow="Announcements"
          title="Customer-facing announcements"
          lead="Banners, release notes and regulation-change alerts, targeted by plan or jurisdiction — how a Commission rule change reaches every affected exporter at once."
        />

        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a.id} className="ct-row p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip value={a.status} />
                    <span className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/35">Audience: {a.audience}</span>
                    {a.publishedAt && <span className="font-mono text-[11px] text-black/35">{a.publishedAt}</span>}
                  </div>
                  <h3 className="mt-2 text-[15px] text-black/80">{a.title}</h3>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-black/50">{a.body}</p>
                  <p className="mt-2 text-xs text-black/35">By {getStaff(a.authorId)?.name}</p>
                </div>
                {a.status === "draft" && canPublish && user && (
                  <Button size="sm" className="flex-none" onClick={() => publishAnnouncement(user, a.id)}>
                    Publish
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {!canPublish && (
          <p className="text-xs text-black/35">Publishing requires Regulatory Affairs (steward+) — content ownership sits with Compliance.</p>
        )}
      </div>
    </ModuleGuard>
  );
}
