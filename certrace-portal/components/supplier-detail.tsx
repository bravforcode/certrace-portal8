"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Bell, ExternalLink, FileText, Package, Clock, AlertTriangle } from "lucide-react";
import { Card, Button, Chip, Stat, Eyebrow, Progress, StatusLabel, StatusDot, cn } from "./ui";
import { toast } from "./toast";
import { type SupplierProfile, supplierStatusMeta } from "@/lib/data";

export function SupplierDetail({ profile: p }: { profile: SupplierProfile }) {
  const meta = supplierStatusMeta[p.status];
  return (
    <div className="space-y-7">
      <Link href="/suppliers" className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.08em] text-black/40 hover:text-black">
        <ArrowLeft size={14} strokeWidth={1.5} /> Suppliers
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-black/[0.06] pb-6 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-black/[0.04] font-mono text-[13px] text-black/50">{p.country}</span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">{p.name}</h1>
              {p.critical && <Chip tone="warn">CBAM-critical</Chip>}
            </div>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-black/45">
              <span className="font-mono text-black/35">{p.ref}</span>
              <span>{p.contact}</span>
              <span className="text-black/30">·</span>
              <a href={`mailto:${p.email}`} className="hover:text-black">{p.email}</a>
            </p>
            <div className="mt-2.5"><StatusLabel tone={meta.tone} label={meta.label} glow={p.status === "submitted"} pulse={p.status === "in_progress"} /></div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => toast({ message: `Reminder sent to ${p.name}.`, detail: "They get a fresh guided-form link.", tone: "info" })}>
            <Bell size={14} strokeWidth={1.5} /> Send reminder
          </Button>
          <Link href="/s/demo-token">
            <Button size="sm">
              <ExternalLink size={14} strokeWidth={1.5} /> Open guided form
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-5"><Stat value={`${p.compliancePct}%`} label="Compliance" /></Card>
        <Card className="p-5"><Stat value={p.products.length} label="Products supplied" /></Card>
        <Card className="p-5"><Stat value={p.declarations.length} label="Declarations" /></Card>
        <Card className="p-5"><Stat value={p.emissions != null ? p.emissions.toFixed(2) : "—"} label="tCO₂e/t latest" /></Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {/* Left: declarations + reports */}
        <div className="space-y-3 lg:col-span-2">
          <Card className="p-5">
            <Eyebrow>Declaration status</Eyebrow>
            <div className="mt-3 divide-y divide-black/[0.06]">
              {p.declarations.map((d) => {
                const m = supplierStatusMeta[d.status];
                return (
                  <Link key={d.id + d.period} href={`/declarations/${d.id}`} className="flex items-center gap-3 py-3 transition-colors hover:bg-[#fafaf8]">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-black/75">{d.name}</span>
                      <span className="block text-[11px] text-black/40">{d.period} · due {d.due}</span>
                    </span>
                    <span className="w-24"><Progress value={d.progress} tone={m.tone === "muted" ? "muted" : m.tone} /></span>
                    <StatusLabel tone={m.tone} label={m.label} glow={d.status === "submitted"} />
                    <ArrowRight size={14} strokeWidth={1.5} className="text-black/25" />
                  </Link>
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <Eyebrow>Submitted reports</Eyebrow>
              <span className="font-mono text-[11px] text-black/40">{p.reports.length}</span>
            </div>
            {p.reports.length === 0 ? (
              <p className="mt-3 text-[12px] text-black/40">No verified reports yet.</p>
            ) : (
              <div className="mt-3 divide-y divide-black/[0.06]">
                {p.reports.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 py-2.5">
                    <FileText size={15} strokeWidth={1.5} className="flex-none text-black/35" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-[12px] text-black/65">{r.id}</span>
                      <span className="block text-[11px] text-black/40">{r.period}</span>
                    </span>
                    <span className="font-mono text-[12px] text-black/55">{r.emissions != null ? `${r.emissions.toFixed(2)} tCO₂e/t` : "—"}</span>
                    <Chip tone="ok" pulse={false}>{r.state}</Chip>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right: products, pending, documents, activity */}
        <div className="space-y-3">
          <Card className="p-5">
            <Eyebrow>Products supplied</Eyebrow>
            <div className="mt-3 space-y-2">
              {p.products.map((pr) => (
                <div key={pr.cn} className="flex items-center gap-2.5 rounded-lg border border-black/[0.06] bg-[#fafaf8] px-3 py-2">
                  <Package size={14} strokeWidth={1.5} className="flex-none text-black/35" />
                  <span className="min-w-0 flex-1 truncate text-[12px] text-black/70">{pr.name}</span>
                  <span className="flex-none font-mono text-[10px] text-black/40">CN {pr.cn}</span>
                </div>
              ))}
            </div>
          </Card>

          {p.pending.length > 0 && (
            <Card warm className="p-5">
              <Eyebrow>Pending requests</Eyebrow>
              <div className="mt-3 space-y-2">
                {p.pending.map((req) => (
                  <Link key={req.label} href={`/declarations/${req.declId}`} className="flex items-start gap-2.5 rounded-lg border border-black/[0.06] bg-white px-3 py-2.5 hover:border-black/15">
                    <AlertTriangle size={14} strokeWidth={1.5} className="mt-0.5 flex-none text-[#b45309]" />
                    <span className="min-w-0">
                      <span className="block text-[12px] text-black/70">{req.label}</span>
                      <span className="block text-[11px] text-black/40">due {req.due}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-5">
            <Eyebrow>Documents</Eyebrow>
            {p.documents.length === 0 ? (
              <p className="mt-3 text-[12px] text-black/40">No documents on file yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {p.documents.map((doc) => (
                  <div key={doc.name} className="flex items-center gap-2.5">
                    <span className="grid h-7 w-7 flex-none place-items-center rounded-lg border border-black/10 text-black/45"><FileText size={13} strokeWidth={1.5} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] text-black/70">{doc.name}</span>
                      <span className="block text-[11px] text-black/35">{doc.type} · {doc.date}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <Eyebrow>Activity</Eyebrow>
            <div className="mt-3 space-y-3">
              {p.activity.map((a, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="mt-1"><StatusDot tone={a.tone} /></span>
                  <span className="min-w-0">
                    <span className="block text-[12px] text-black/70">{a.text}</span>
                    <span className="block font-mono text-[10px] text-black/35">{a.when}</span>
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
