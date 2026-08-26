"use client";

import { Lock } from "lucide-react";
import { Card, PageHeader, Chip, Eyebrow, StatusDot, Tone } from "@/components/ui";
import { REGULATIONS, JURISDICTIONS, PRODUCT_SECTORS, STATUS_META } from "@/lib/config";
import { useT } from "@/lib/i18n";

export default function CoveragePage() {
  const t = useT();
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("Coverage")}
        title={t("What's live, and what's next.")}
        lead={t("Certrace launched on the obligation that bites first: CBAM for steel exporters into the EU. Every other regime and market is built on the same engine — we turn them on as their factor libraries and calculation routes are verified.")}
      />

      {/* Regulations */}
      <section className="space-y-4">
        <Eyebrow>{t("Regulations")}</Eyebrow>
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
                  <Chip tone={meta.tone as Tone}>{t(meta.label)}</Chip>
                </div>
                <p className="mt-4 flex-1 text-sm text-black/45">
                  {live ? `${t(r.cadence)} · ${t("filed to")} ${t(r.authority)}.` : t(r.soonNote ?? "")}
                </p>
                {live && (
                  <div className="mt-4 flex flex-wrap gap-1.5 border-t border-black/[0.06] pt-4">
                    {r.dataPoints.slice(0, 4).map((d) => (
                      <span key={d} className="rounded-full border border-black/[0.08] px-2.5 py-1 text-[10px] text-black/40">
                        {t(d)}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* CBAM sectors */}
      <section className="space-y-4">
        <Eyebrow>{t("CBAM goods coverage")}</Eyebrow>
        <Card className="overflow-hidden p-0">
          <div className="grid grid-cols-[1.4fr_0.8fr_1fr] gap-3 border-b border-black/[0.06] bg-black/[0.02] px-5 py-2.5 font-mono text-[8px] uppercase tracking-[0.16em] text-black/30">
            <span>{t("Sector")}</span>
            <span>{t("CN codes")}</span>
            <span>{t("Status")}</span>
          </div>
          {PRODUCT_SECTORS.map((p) => (
            <div key={p.id} className="grid grid-cols-[1.4fr_0.8fr_1fr] items-center gap-3 border-b border-black/[0.04] px-5 py-4 last:border-0">
              <span className="flex items-center gap-2 text-sm text-black/70">
                {!p.available && <Lock size={13} strokeWidth={1.5} className="text-black/30" />}
                {t(p.name)}
              </span>
              <span className="font-mono text-[12px] text-black/45">{p.cnHint}</span>
              <span className="inline-flex items-center gap-2">
                <StatusDot tone={p.available ? "ok" : "muted"} pulse={p.available} glow={p.available} />
                <span className="text-[11px] uppercase tracking-[0.08em] text-black/45">{p.available ? t("live") : t("soon")}</span>
              </span>
            </div>
          ))}
        </Card>
        <p className="text-center text-xs text-black/35">{t("Steel & iron covers CN chapters 72–73 — the bulk of Thai CBAM exports. Other goods open next.")}</p>
      </section>

      {/* Jurisdictions */}
      <section className="space-y-4">
        <Eyebrow>{t("Markets")}</Eyebrow>
        <Card className="overflow-hidden p-0">
          <div className="grid grid-cols-[1.2fr_1.4fr_0.8fr] gap-3 border-b border-black/[0.06] bg-black/[0.02] px-5 py-2.5 font-mono text-[8px] uppercase tracking-[0.16em] text-black/30">
            <span>{t("Market")}</span>
            <span>{t("Emission-factor library")}</span>
            <span>{t("Status")}</span>
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
                    <span className="block text-sm text-black/70">{t(j.name)}</span>
                    <span className="block text-[11px] text-black/35">{t(j.note)}</span>
                  </span>
                </span>
                <span className="font-mono text-[12px] text-black/45">{j.factorSet}</span>
                <span className="inline-flex items-center gap-2">
                  <StatusDot tone={meta.tone as Tone} pulse={j.status === "live"} glow={j.status === "live"} />
                  <span className="text-[11px] uppercase tracking-[0.08em] text-black/45">{t(meta.label)}</span>
                </span>
              </div>
            );
          })}
        </Card>
      </section>
    </div>
  );
}
