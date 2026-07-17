"use client";

import * as React from "react";
import { Megaphone, X } from "lucide-react";
import { Button, Card, Field, PageHeader, inputClass } from "@/components/ui";
import { Modal, Select } from "@/components/controls";
import { StatusChip } from "@/components/admin/bits";
import { ModuleGuard } from "@/components/admin/shell";
import { toast } from "@/components/toast";
import { useAdminAuth } from "@/lib/admin-auth";
import { useAdminStore, allAnnouncements, createAnnouncement, staffName } from "@/lib/admin-store";

const AUDIENCES = [
  "All orgs",
  "All exporter orgs",
  "Exporters — Iron & Steel",
  "Exporters — Aluminium",
  "Suppliers",
  "Verifier partners",
].map((a) => ({ value: a, label: a }));

export default function Announcements() {
  const { user, hasPower } = useAdminAuth();
  useAdminStore();
  const [composing, setComposing] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [audience, setAudience] = React.useState("All orgs");
  const items = allAnnouncements();
  const canPublish = hasPower("publish-announcements");
  const valid = title.trim().length >= 8 && body.trim().length >= 20;

  const submit = () => {
    if (!user) return;
    createAnnouncement(user, { title: title.trim(), body: body.trim(), audience });
    setComposing(false);
    setTitle("");
    setBody("");
    setAudience("All orgs");
    toast({
      message: "Local announcement draft saved",
      detail: "Browser-local fixture only; nothing was published or delivered to the selected audience.",
      tone: "info",
    });
  };

  return (
    <ModuleGuard module="announcements">
      <div className="ct-enter space-y-6">
        <PageHeader
          eyebrow="Announcements"
          title="Customer-facing announcements"
          lead="Browser-local announcement drafting demo. No customer feed, audience delivery, or production publishing service is configured."
          actions={
            canPublish ? (
              <Button size="sm" onClick={() => setComposing(true)}>
                <Megaphone size={14} strokeWidth={1.5} /> New announcement
              </Button>
            ) : undefined
          }
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
                  <p className="mt-2 text-xs text-black/35">By {staffName(a.authorId)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {!canPublish && (
          <p className="text-xs text-black/35">Drafting requires the configured demo permission. Publishing is unavailable without a backend and delivery channel.</p>
        )}

        <Modal open={composing} onClose={() => setComposing(false)} labelledBy="compose-title">
          <div className="flex items-start justify-between gap-4 p-6 pb-4">
            <div>
              <h2 id="compose-title" className="font-[family-name:var(--font-plex)] text-xl font-light tracking-tight text-[#111]">New announcement</h2>
              <p className="mt-1 text-xs text-black/45">This saves browser-local draft metadata only. It does not publish or deliver anything.</p>
            </div>
            <button type="button" aria-label="Close" onClick={() => setComposing(false)} className="rounded-lg p-2 text-black/40 transition-colors hover:bg-black/[0.05] hover:text-black">
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
          <div className="space-y-4 p-6 pt-0">
            <Field label="Title">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Scheduled maintenance — Sunday 02:00–04:00 UTC" className={inputClass} />
            </Field>
            <Field label="Body">
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="What changes for customers, and what (if anything) they need to do…" className={inputClass} />
            </Field>
            <Field label="Audience">
              <Select value={audience} onChange={setAudience} options={AUDIENCES} ariaLabel="Audience" />
            </Field>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button size="sm" disabled={!valid} onClick={submit}>Save local draft</Button>
            </div>
          </div>
        </Modal>
      </div>
    </ModuleGuard>
  );
}
