"use client";

import { Bell, Lock } from "lucide-react";
import { Card, PageHeader, Chip, Eyebrow, StatusDot, Button, Tone } from "@/components/ui";
import { toast } from "@/components/toast";
import { REGULATIONS, JURISDICTIONS, PRODUCT_SECTORS, STATUS_META } from "@/lib/config";

function notify(name: string) {
  toast({ message: `Added to the ${name} waitlist.`, tone: "info", detail: "We'll email you the moment it opens." });
}

export default function CoveragePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Coverage"
        title="What's live, and what's next."
        lead="Certrace launched on the obligation that bites first: CBAM for steel exporters into the EU. Every other regime and market is built on the same engine — we turn them on as their factor libraries and calculation routes are verified."
      />

      {/* Regulations */}
      <section className="space-y-4">
        <Eyebrow>Regulations</Eyebrow>
        <div className="grid gap-3 sm:grid-cols-2">
          {REGULATIONS.map((r) => {
            const meta = STATUS_META[r.status];
            const live = r.available;
            return (
              <Card key={r.id} className={live ? "flex h-full flex-col p-6" : "flex h-full flex-col p-6 opacity-90"}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-[family-name:var(--font-plex)] text-3xl font-light text-[#111]">
                      {!live && <Lock size={16} strokeWidth={1.5} className="text-black/30" />}
                      {r.short}
                    </div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.1em] text-black/35">{r.full}</div>
                  </div>
                  <Chip tone={meta.tone as Tone}>{meta.label}</Chip>
                </div>
                <p className="mt-4 flex-1 text-sm text-black/45">
                  {live ? `${r.cadence} · filed to ${r.authority}.` : r.soonNote}
                </p>
                {live ? (
                  <div className="mt-4 flex flex-wrap gap-1.5 border-t border-black/[0.06] pt-4">
                    {r.dataPoints.slice(0, 4).map((d) => (
                      <span key={d} className="rounded-full border border-black/[0.08] px-2.5 py-1 text-[10px] text-black/40">
                        {d}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 border-t border-black/[0.06] pt-4">
                    <Button variant="secondary" size="sm" onClick={() => notify(r.short)}>
                      <Bell size={13} strokeWidth={1.5} /> Notify me when live
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* CBAM sectors */}
      <section className="space-y-4">
        <Eyebrow>CBAM goods coverage</Eyebrow>
        <Card className="overflow-hidden p-0">
          <div className="grid grid-cols-[1.4fr_0.8fr_1fr] gap-3 border-b border-black/[0.06] bg-black/[0.02] px-5 py-2.5 font-mono text-[8px] uppercase tracking-[0.16em] text-black/30">
            <span>Sector</span>
            <span>CN codes</span>
            <span>Status</span>
          </div>
          {PRODUCT_SECTORS.map((p) => (
            <div key={p.id} className="grid grid-cols-[1.4fr_0.8fr_1fr] items-center gap-3 border-b border-black/[0.04] px-5 py-4 last:border-0">
              <span className="flex items-center gap-2 text-sm text-black/70">
                {!p.available && <Lock size={13} strokeWidth={1.5} className="text-black/30" />}
                {p.name}
              </span>
              <span className="font-mono text-[12px] text-black/45">{p.cnHint}</span>
              <span className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2">
                  <StatusDot tone={p.available ? "ok" : "muted"} pulse={p.available} glow={p.available} />
                  <span className="text-[11px] uppercase tracking-[0.08em] text-black/45">{p.available ? "live" : "coming soon"}</span>
                </span>
                {!p.available && (
                  <button
                    onClick={() => notify(p.name)}
                    className="inline-flex items-center gap-1 rounded-full border border-black/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] text-black/50 hover:border-black/25 hover:text-black"
                  >
                    <Bell size={11} strokeWidth={1.5} /> notify
                  </button>
                )}
              </span>
            </div>
          ))}
        </Card>
        <p className="text-center text-xs text-black/35">Steel &amp; iron covers CN chapters 72–73 — the bulk of Thai CBAM exports. Other goods open next.</p>
      </section>

      {/* Jurisdictions */}
      <section className="space-y-4">
        <Eyebrow>Markets</Eyebrow>
        <Card className="overflow-hidden p-0">
          <div className="grid grid-cols-[1.2fr_1.4fr_0.8fr] gap-3 border-b border-black/[0.06] bg-black/[0.02] px-5 py-2.5 font-mono text-[8px] uppercase tracking-[0.16em] text-black/30">
            <span>Market</span>
            <span>Emission-factor library</span>
            <span>Status</span>
          </div>
          {JURISDICTIONS.map((j) => {
            const meta = STATUS_META[j.status];
            return (
              <div key={j.code} className="grid grid-cols-[1.2fr_1.4fr_0.8fr] items-center gap-3 border-b border-black/[0.04] px-5 py-4 last:border-0">
                <span className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-black/[0.04] font-mono text-[10px] text-black/45">
                    {j.flag}
                  </span>
                  <span>
                    <span className="block text-sm text-black/70">{j.name}</span>
                    <span className="block text-[11px] text-black/35">{j.note}</span>
                  </span>
                </span>
                <span className="font-mono text-[12px] text-black/45">{j.factorSet}</span>
                <span className="inline-flex items-center gap-2">
                  <StatusDot tone={meta.tone as Tone} pulse={j.status === "live"} glow={j.status === "live"} />
                  <span className="text-[11px] uppercase tracking-[0.08em] text-black/45">{meta.label}</span>
                </span>
              </div>
            );
          })}
        </Card>
      </section>
    </div>
  );
}
