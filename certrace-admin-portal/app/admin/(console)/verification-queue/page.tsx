"use client";

import * as React from "react";
import Link from "next/link";
import { Button, Card, PageHeader } from "@/components/ui";
import { FilterChips, StatusChip } from "@/components/admin/bits";
import { ModuleGuard } from "@/components/admin/shell";
import { useAdminAuth } from "@/lib/admin-auth";
import { useAdminStore, allQueue, updateQueue, staffName } from "@/lib/admin-store";
import { getOrg, type QueueKind, type QueueStatus } from "@/lib/admin-data";

type Filter = "all" | QueueKind | QueueStatus;

const KIND_LABEL: Record<QueueKind, string> = {
  "ai-critical": "Deterministic critical",
  escalation: "Escalation",
  "spot-audit": "Spot audit",
};

export default function VerificationQueue() {
  const { user, hasPower } = useAdminAuth();
  useAdminStore();
  const [filter, setFilter] = React.useState<Filter>("all");
  const [resolving, setResolving] = React.useState<string | null>(null);
  const [note, setNote] = React.useState("");

  const items = allQueue();
  const rows = items.filter((i) => {
    if (filter === "all") return true;
    return i.kind === filter || i.status === filter;
  });

  const canReview = hasPower("review-queue");
  const canAssign = hasPower("assign-queue");

  return (
    <ModuleGuard module="verification">
      <div className="ct-enter space-y-6">
        <PageHeader
          eyebrow="Verification & QA"
          title="Verification queue"
          lead="Deterministic validation blockers, human-review escalations and local spot checks in this browser-only admin demo."
        />

        <FilterChips<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All", count: items.length },
            { value: "open", label: "Open", count: items.filter((i) => i.status === "open").length },
            { value: "assigned", label: "Assigned", count: items.filter((i) => i.status === "assigned").length },
            { value: "resolved", label: "Resolved", count: items.filter((i) => i.status === "resolved").length },
            { value: "ai-critical", label: "Deterministic critical" },
            { value: "escalation", label: "Escalations" },
            { value: "spot-audit", label: "Spot audits" },
          ]}
        />

        <div className="space-y-3">
          {rows.map((q) => (
            <Card key={q.id} className="ct-row p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-black/[0.05] px-2 py-0.5 font-pixel text-[10px] uppercase tracking-[0.14em] text-black/45">
                      {KIND_LABEL[q.kind]}
                    </span>
                    <span className="font-mono text-[11px] text-black/35">{q.id}</span>
                    <StatusChip value={q.status} />
                    <span className="font-mono text-[11px] text-black/35">SLA {q.slaHours}h · raised {q.raisedAt.slice(5)}</span>
                  </div>
                  <h3 className="mt-2 text-[15px] text-black/80">{q.summary}</h3>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-black/50">{q.detail}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-black/40">
                    <Link href={`/admin/accounts/${q.orgId}`} className="underline-offset-2 hover:text-black hover:underline">
                      {getOrg(q.orgId)?.name}
                    </Link>
                    <span className="font-mono">{q.declId}</span>
                    {q.assigneeId && <span>Assignee: {staffName(q.assigneeId)}</span>}
                  </div>
                  {q.resolution && (
                    <p className="mt-2 rounded-xl bg-[#ecfdf5] px-3 py-2 text-xs text-[#047857]">Resolution: {q.resolution}</p>
                  )}
                </div>

                {q.status !== "resolved" && (canReview || canAssign) && (
                  <div className="flex flex-none flex-wrap items-center gap-2">
                    {q.status === "open" && (canAssign || canReview) && user && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateQueue(user, q.id, { status: "assigned", assigneeId: user.id }, "queue.assign", `Assigned to ${user.name}.`)}
                      >
                        Assign to me
                      </Button>
                    )}
                    {q.status === "assigned" && canReview && (
                      <Button size="sm" onClick={() => { setResolving(resolving === q.id ? null : q.id); setNote(""); }}>
                        Resolve…
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {resolving === q.id && user && (
                <div className="mt-4 flex flex-col gap-2 border-t border-black/[0.06] pt-4 sm:flex-row">
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Resolution note (required, goes to the audit log)"
                    className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-black/70 placeholder:text-black/25 focus:border-black/25 focus:outline-none"
                  />
                  <Button
                    size="sm"
                    disabled={note.trim().length < 8}
                    onClick={() => {
                      updateQueue(user, q.id, { status: "resolved", resolution: note.trim() }, "queue.resolve", note.trim());
                      setResolving(null);
                    }}
                  >
                    Mark resolved
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>

        {!canReview && !canAssign && (
          <p className="text-xs text-black/35">Your role has read access — assigning and resolving requires the Verification &amp; QA department.</p>
        )}
      </div>
    </ModuleGuard>
  );
}
