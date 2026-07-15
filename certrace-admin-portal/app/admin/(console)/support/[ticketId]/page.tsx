"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button, Card, PageHeader } from "@/components/ui";
import { KV, SectionTitle, StatusChip } from "@/components/admin/bits";
import { ModuleGuard } from "@/components/admin/shell";
import { useAdminAuth } from "@/lib/admin-auth";
import { useAdminStore, addTicketNote, allTickets, setTicketStatus } from "@/lib/admin-store";
import { getOrg, getStaff, getDepartment } from "@/lib/admin-data";

export default function TicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { user, hasPower } = useAdminAuth();
  useAdminStore();
  const [body, setBody] = React.useState("");

  const ticket = allTickets().find((t) => t.id === ticketId);
  if (!ticket) {
    return (
      <ModuleGuard module="support">
        <div className="py-16 text-center text-sm text-black/45">
          Unknown ticket. <Link className="underline" href="/admin/support">Back to queue</Link>
        </div>
      </ModuleGuard>
    );
  }

  const org = getOrg(ticket.orgId);
  const canReply = hasPower("reply-tickets");
  const canEscalate = hasPower("escalate-tickets");

  return (
    <ModuleGuard module="support">
      <div className="ct-enter space-y-6">
        <div className="font-pixel text-[11px] uppercase tracking-[0.16em] text-black/35">
          <Link href="/admin/support" className="hover:text-black">← Ticket queue</Link>
        </div>

        <PageHeader
          eyebrow={`${ticket.id} · ${ticket.priority}`}
          title={ticket.subject}
          lead={`${org?.name} · routed to ${getDepartment(ticket.routedTo).name}`}
          actions={
            <div className="flex items-center gap-2">
              <StatusChip value={ticket.status} />
              {user && ticket.status !== "resolved" && canReply && (
                <Button size="sm" variant="secondary" onClick={() => setTicketStatus(user, ticket.id, "resolved")}>Resolve</Button>
              )}
              {user && ticket.status !== "escalated" && ticket.status !== "resolved" && canEscalate && (
                <Button size="sm" variant="secondary" onClick={() => setTicketStatus(user, ticket.id, "escalated")}>Escalate</Button>
              )}
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="order-2 h-fit p-5 lg:order-1">
            <SectionTitle>Details</SectionTitle>
            <div className="-mt-2 px-5 pb-4">
              <KV k="Organisation" v={<Link href={`/admin/accounts/${ticket.orgId}`} className="underline-offset-2 hover:underline">{org?.name}</Link>} />
              <KV k="Opened" v={<span className="font-mono text-[11px]">{ticket.openedAt}</span>} />
              <KV k="SLA due" v={<span className="font-mono text-[11px]">{ticket.slaDue}</span>} />
              <KV k="Assignee" v={ticket.assigneeId ? getStaff(ticket.assigneeId)?.name : "Unassigned"} />
              <KV k="Routed to" v={getDepartment(ticket.routedTo).name} />
            </div>
          </Card>

          <Card className="order-1 lg:order-2 lg:col-span-2">
            <SectionTitle>Thread</SectionTitle>
            <div className="space-y-3 px-5 pb-5">
              {ticket.thread.map((m, i) => (
                <div
                  key={i}
                  className={`rounded-2xl px-4 py-3 ${m.internal ? "border border-dashed border-[#3C7ACB]/40 bg-[#3C7ACB]/[0.05]" : "bg-black/[0.03]"}`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[12px] font-medium text-black/60">{m.from}</span>
                    <span className="font-mono text-[10px] text-black/30">{m.at}</span>
                  </div>
                  {m.internal && (
                    <span className="mt-1 inline-block font-pixel text-[9px] uppercase tracking-[0.14em] text-[#2c5c9c]">Internal note</span>
                  )}
                  <p className="mt-1.5 text-sm leading-relaxed text-black/70">{m.body}</p>
                </div>
              ))}

              {canReply && ticket.status !== "resolved" && user && (
                <div className="border-t border-black/[0.06] pt-4">
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={3}
                    placeholder="Browser-local internal note (no customer message is sent)…"
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black/70 placeholder:text-black/25 focus:border-black/25 focus:outline-none"
                  />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-xs text-black/45">Local demo only · no email or customer delivery</span>
                    <Button
                      size="sm"
                      disabled={body.trim().length < 2}
                      onClick={() => {
                        addTicketNote(user, ticket.id, body.trim());
                        setBody("");
                      }}
                    >
                      Add local note
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </ModuleGuard>
  );
}
