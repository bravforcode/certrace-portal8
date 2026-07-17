"use client";

import * as React from "react";
import { Button, Card, PageHeader } from "@/components/ui";
import { SectionTitle, StatusChip, Table, Td, Th } from "@/components/admin/bits";
import { ModuleGuard } from "@/components/admin/shell";
import { useAdminAuth } from "@/lib/admin-auth";
import { useAdminStore, allDrafts, updateDraft, nowStamp, staffName } from "@/lib/admin-store";
import { REG_DATASETS } from "@/lib/admin-data";

export default function RegulatoryData() {
  const { user, hasPower } = useAdminAuth();
  useAdminStore();
  const [rejecting, setRejecting] = React.useState<string | null>(null);
  const [note, setNote] = React.useState("");

  const drafts = allDrafts();
  const canDraft = hasPower("draft-regdata");
  const canPublish = hasPower("publish-regdata");

  return (
    <ModuleGuard module="regulatory">
      <div className="ct-enter space-y-6">
        <PageHeader
          eyebrow="Regulatory master data"
          title="Master data & drafts"
          lead="The single source of truth every tenant calculates against — CN codes, default factors, checklists, jurisdictions. Changes ship maker-checker: one person drafts, a different person publishes."
        />

        <Card>
          <SectionTitle>Published datasets</SectionTitle>
          <Table>
            <thead><tr><Th>Dataset</Th><Th>Records</Th><Th>Version</Th><Th>Published</Th><Th>By</Th></tr></thead>
            <tbody>
              {REG_DATASETS.map((d) => (
                <tr key={d.id} className="ct-row">
                  <Td>{d.name}</Td>
                  <Td><span className="font-mono text-[12px]">{d.records}</span></Td>
                  <Td><span className="font-mono text-[12px]">{d.version}</span></Td>
                  <Td><span className="font-mono text-[11px] text-black/40">{d.publishedAt}</span></Td>
                  <Td className="whitespace-nowrap">{d.publishedBy}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card>
          <SectionTitle>Change drafts (maker-checker)</SectionTitle>
          <div className="space-y-0 px-5 pb-5">
            {drafts.map((dr) => {
              const dataset = REG_DATASETS.find((d) => d.id === dr.datasetId);
              const own = user?.id === dr.draftedById;
              return (
                <div key={dr.id} className="border-b border-black/[0.06] py-4 last:border-b-0">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] text-black/35">{dr.id}</span>
                        <StatusChip value={dr.status} />
                        <span className="font-pixel text-[10px] uppercase tracking-[0.12em] text-black/30">{dataset?.name}</span>
                      </div>
                      <h3 className="mt-1.5 text-[15px] text-black/80">{dr.title}</h3>
                      <p className="mt-1 rounded-lg bg-black/[0.03] px-3 py-1.5 font-mono text-[12px] text-black/55">{dr.diff}</p>
                      <p className="mt-1.5 text-xs text-black/40">
                        Drafted by {staffName(dr.draftedById)} · {dr.draftedAt.slice(0, 10)}
                        {dr.approvedById && <> · decided by {staffName(dr.approvedById)} {dr.decidedAt?.slice(0, 10)}</>}
                        {dr.note && <> · {dr.note}</>}
                      </p>
                    </div>

                    <div className="flex flex-none flex-wrap items-center gap-2">
                      {dr.status === "draft" && canDraft && user && (
                        <Button size="sm" variant="secondary" onClick={() => updateDraft(user, dr.id, { status: "awaiting-approval" }, "draft.submit", dr.title)}>
                          Submit for approval
                        </Button>
                      )}
                      {dr.status === "awaiting-approval" && canPublish && user && (
                        <>
                          <Button
                            size="sm"
                            disabled={own}
                            title={own ? "Maker-checker: you drafted this — a different steward must publish it." : undefined}
                            onClick={() =>
                              updateDraft(user, dr.id, { status: "published", approvedById: user.id, decidedAt: nowStamp() }, "draft.publish", dr.title)
                            }
                          >
                            Approve &amp; publish
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => { setRejecting(rejecting === dr.id ? null : dr.id); setNote(""); }}>
                            Reject…
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {dr.status === "awaiting-approval" && canPublish && user?.id === dr.draftedById && (
                    <p className="mt-2 text-xs text-[#b45309]">
                      Maker-checker: you drafted this change — publishing is disabled for you. A different steward must approve it.
                    </p>
                  )}

                  {rejecting === dr.id && user && (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Rejection reason (required, audited)"
                        className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-black/70 placeholder:text-black/25 focus:border-black/25 focus:outline-none"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={note.trim().length < 5}
                        onClick={() => {
                          updateDraft(user, dr.id, { status: "rejected", approvedById: user.id, decidedAt: nowStamp(), note: note.trim() }, "draft.reject", note.trim());
                          setRejecting(null);
                        }}
                      >
                        Confirm reject
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <p className="text-xs text-black/35">
          This browser-only demo does not publish across tenants or recalculate remote records. A future controlled publication workflow must preserve the exact regulatory-data version used by each draft. Every
          decision lands in the audit log.
        </p>
      </div>
    </ModuleGuard>
  );
}
