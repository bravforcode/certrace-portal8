"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import { TagBadge } from "./ui";

type VisualType =
  | "invite"
  | "profile"
  | "quality"
  | "engine"
  | "benchmark"
  | "report";

/* Anchor id + which mini-visual to draw. Copy comes from lib/content.ts, in
   the same order — the anchors are linked from the nav and the footer, so
   these ids are fixed regardless of language. */
const MODULE_SHELLS: { id: string; visual: VisualType }[] = [
  { id: "platform-invite", visual: "invite" },
  { id: "platform-profile", visual: "profile" },
  { id: "platform-quality", visual: "quality" },
  { id: "platform-engine", visual: "engine" },
  { id: "platform-benchmark", visual: "benchmark" },
  { id: "platform-report", visual: "report" },
];

const PANEL_GRID = {
  backgroundImage:
    "linear-gradient(rgba(0,0,0,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.035) 1px, transparent 1px)",
  backgroundSize: "24px 24px",
} as const;

const MONO = { fontFamily: "var(--font-geist-mono), monospace" } as const;

function MiniCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-[85%] max-w-[300px] rounded-xl border border-black/[0.08] bg-white/80 shadow-[0_8px_24px_rgba(0,0,0,0.05)] overflow-hidden">
      {children}
    </div>
  );
}

function MiniHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-3 py-2 border-b border-black/[0.06] bg-black/[0.03] text-[8px] tracking-[0.16em] text-black/30"
      style={MONO}
    >
      {children}
    </div>
  );
}

function InviteVisual() {
  const rows = [
    { name: "bangkok-steel", state: "approved", color: "#4ade80" },
    { name: "eastern-aluminum", state: "in review", color: "#60a5fa" },
    { name: "thai-metal-pro", state: "changes requested", color: "#facc15" },
    { name: "chonburi-fab", state: "submitted", color: "#4ade80" },
  ];
  return (
    <MiniCard>
      <MiniHeader>SMART LINKS · Q2 2026</MiniHeader>
      <div className="p-3 space-y-2.5">
        {rows.map((row) => (
          <div key={row.name} className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: row.color }}
            />
            <span className="text-[9px] text-black/55 flex-1" style={MONO}>
              {row.name}
            </span>
            <span className="text-[8px] text-black/35" style={MONO}>
              {row.state}
            </span>
          </div>
        ))}
        <div
          className="pt-1.5 text-[8px] text-black/30 border-t border-black/[0.05]"
          style={MONO}
        >
          ✓ reminder sent · rayong-industrial · 2h ago
        </div>
      </div>
    </MiniCard>
  );
}

/* Two panes on purpose: the top half is the data entered once, the bottom half
   is two *different* buyers' requests filling themselves from it. The reuse is
   the whole point of the feature, and a single saved-fields list wouldn't show
   it. */
function ProfileVisual() {
  /* Two saved rows, not three: with the reuse pane and the closing line below
     it, a third pushed the card past the module panel's height and the last
     line was sliced off at the edge. These two are also the most obviously
     static facts about a supplier, which is the point being made. */
  const saved = ["installation address", "production route"];
  const reused = [
    { req: "Q3 2026 · buyer A", state: "14/18 prefilled" },
    { req: "Q3 2026 · buyer B", state: "14/18 prefilled" },
  ];
  return (
    <MiniCard>
      <MiniHeader>SUPPLIER PROFILE · bangkok-steel</MiniHeader>
      <div className="p-3 space-y-2 text-[9px]" style={MONO}>
        {saved.map((field) => (
          <div key={field} className="flex items-center justify-between">
            <span className="text-black/50">{field}</span>
            <span className="text-emerald-600">saved ✓</span>
          </div>
        ))}
        <div className="pt-2 mt-1 border-t border-black/[0.06] space-y-2">
          {reused.map((row) => (
            <div key={row.req} className="flex items-center justify-between">
              <span className="text-black/35">{row.req}</span>
              <span className="text-emerald-600">{row.state}</span>
            </div>
          ))}
        </div>
        <div className="text-black/30 pt-0.5">
          entered once — never asked again
        </div>
      </div>
    </MiniCard>
  );
}

function QualityVisual() {
  return (
    <MiniCard>
      <MiniHeader>AI QUALITY CHECK · SUBMISSION v2</MiniHeader>
      <div className="p-3 space-y-1.5 text-[9px] leading-relaxed" style={MONO}>
        <div className="flex items-center justify-between">
          <span className="text-black/50">trust_score</span>
          <span className="text-emerald-600">87 / 100</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-black/50">required fields</span>
          <span className="text-emerald-600">18 / 18 ✓</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-black/50">electricity vs Q1</span>
          <span className="text-amber-600">↓ 34% · flagged</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-black/50">mill test certificate</span>
          <span className="text-emerald-600">attached ✓</span>
        </div>
        <div className="pt-1.5 mt-1 border-t border-black/[0.06] text-black/30">
          advisory only — filed figures stay deterministic
        </div>
      </div>
    </MiniCard>
  );
}

function EngineVisual() {
  const checks = [
    { label: "Default-value cap (20%)", state: "1 breach", ok: false },
    { label: "Scope 2 treatment", state: "reported-only ✓", ok: true },
    { label: "Verification records", state: "5/6 ✓", ok: true },
    { label: "CBAM exposure", state: "€41,200", ok: true },
  ];
  return (
    <MiniCard>
      <MiniHeader>REGISTRY PRE-FLIGHT · DEFINITIVE PERIOD</MiniHeader>
      <div className="p-3 space-y-2 text-[9px]" style={MONO}>
        {checks.map((check) => (
          <div key={check.label} className="flex items-center justify-between">
            <span className="text-black/50">{check.label}</span>
            <span className={check.ok ? "text-emerald-600" : "text-red-500"}>
              {check.state}
            </span>
          </div>
        ))}
        <div className="pt-1.5 border-t border-black/[0.05] text-red-500/80">
          ✗ dispatch blocked until resolved
        </div>
      </div>
    </MiniCard>
  );
}

/* Bars against a benchmark line, not a table of numbers: the feature's promise
   is "see where you stand", and standing somewhere is a position, not a value.
   The dashed rule is the CBAM penalty rate; anything crossing it is the thing
   worth fixing, so those bars carry the error tone. */
function BenchmarkVisual() {
  const lines = [
    { name: "hot-rolled coil", value: 1.82, pct: 88, over: true },
    { name: "rebar", value: 1.21, pct: 52, over: false },
    { name: "alu extrusion", value: 6.4, pct: 94, over: true },
    { name: "wire rod", value: 1.05, pct: 44, over: false },
  ];
  /* Where the dashed benchmark rule sits, as a % of the track width. Bars
     past it are the exposed ones. */
  const threshold = 70;

  return (
    <MiniCard>
      <MiniHeader>CARBON BENCHMARK · vs CBAM RATE</MiniHeader>
      <div className="p-3 text-[9px]" style={MONO}>
        {/* The rule is a sibling spanning the whole list, not one per row, so
            the eye reads a single shared threshold rather than four unrelated
            tracks. Both it and the bars measure from the same padding box, so
            the percentages line up. */}
        <div className="relative space-y-2">
          <div
            aria-hidden="true"
            className="absolute inset-y-0 z-10 pointer-events-none"
            style={{
              left: `${threshold}%`,
              borderLeft: "1px dashed rgba(17,17,17,0.28)",
            }}
          />
          {lines.map((line) => (
            <div key={line.name}>
              <div className="flex items-center justify-between">
                <span className="text-black/50">{line.name}</span>
                <span className={line.over ? "text-red-500" : "text-black/35"}>
                  {line.value.toFixed(2)} t
                </span>
              </div>
              <div className="relative mt-1 h-1.5 rounded-full bg-black/[0.05] overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${line.pct}%`,
                    background: line.over
                      ? "rgba(248,113,113,0.55)"
                      : "rgba(17,17,17,0.22)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2.5 flex items-center justify-between pt-1.5 border-t border-black/[0.05]">
          <span className="text-black/30">exposure if unchanged</span>
          <span className="text-black/50">€41,200</span>
        </div>
      </div>
    </MiniCard>
  );
}

function ReportVisual() {
  const files = [
    { name: "CBAM_Communication_Package.pdf", state: "24 pp ✓" },
    { name: "annex_iv_template.xml", state: "✓" },
    { name: "evidence_register/ · 142 files", state: "✓" },
    { name: "sha256 · 9f3a…c21d", state: "sealed ✓" },
  ];
  return (
    <MiniCard>
      <MiniHeader>REPORT PACKAGE · READY NOW</MiniHeader>
      <div className="p-3 space-y-2 text-[9px]" style={MONO}>
        {files.map((file) => (
          <div key={file.name} className="flex items-center justify-between">
            <span className="text-black/50">{file.name}</span>
            <span className="text-emerald-600">{file.state}</span>
          </div>
        ))}
        <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-600/15 text-emerald-700 text-[8px]">
          <span className="w-1 h-1 rounded-full bg-emerald-500" />
          CURRENT AS OF 4 MIN AGO · NOBODY ASKED
        </div>
      </div>
    </MiniCard>
  );
}

function ModuleVisual({ type }: { type: VisualType }) {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={PANEL_GRID}
    >
      {type === "invite" && <InviteVisual />}
      {type === "profile" && <ProfileVisual />}
      {type === "quality" && <QualityVisual />}
      {type === "engine" && <EngineVisual />}
      {type === "benchmark" && <BenchmarkVisual />}
      {type === "report" && <ReportVisual />}
    </div>
  );
}

export function ModuleStack() {
  const { c } = useLang();
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [stacked, setStacked] = useState(MODULE_SHELLS.map(() => 0));

  useEffect(() => {
    const onScroll = () => {
      setStacked(
        MODULE_SHELLS.map((_, i) => {
          let count = 0;
          for (let j = i + 1; j < MODULE_SHELLS.length; j++) {
            const el = cardRefs.current[j];
            if (!el) continue;
            const top = el.getBoundingClientRect().top;
            const stickyTop = 80 + 16 * j;
            if (top <= stickyTop + 2) count++;
          }
          return count;
        }),
      );
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="flex flex-col"
      style={{ perspective: "1400px", perspectiveOrigin: "50% 0%" }}
    >
      {MODULE_SHELLS.map((shell, i) => {
        const depth = stacked[i];
        const mod = c.platform.modules[i];
        return (
          <div
            key={shell.id}
            id={shell.id}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="sticky mb-4"
            style={{ top: `${80 + 16 * i}px`, zIndex: 10 + i }}
          >
            <div
              style={{
                transform: `scale(${1 - 0.04 * depth}) translateY(${8 * depth}px)`,
                transformOrigin: "top center",
                transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
                willChange: "transform",
              }}
            >
              <div className="group relative bg-[#faf9f7] rounded-2xl border border-black/[0.07] overflow-hidden">
                <div className="relative w-full h-52 pointer-events-none md:hidden">
                  <div
                    className="absolute inset-0"
                    style={{
                      maskImage:
                        "linear-gradient(to bottom, black 0%, black 35%, transparent 95%)",
                      WebkitMaskImage:
                        "linear-gradient(to bottom, black 0%, black 35%, transparent 95%)",
                    }}
                  >
                    <ModuleVisual type={shell.visual} />
                  </div>
                </div>

                <div className="hidden md:block absolute inset-y-0 right-0 w-1/2 pointer-events-none">
                  <ModuleVisual type={shell.visual} />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to right, #faf9f7 0%, transparent 55%)",
                    }}
                  />
                </div>

                <div className="relative z-10 p-8">
                  <div className="md:max-w-[55%]">
                    <div className="flex items-start justify-between mb-6">
                      <TagBadge>{mod.label}</TagBadge>
                    </div>
                    <h3 className="text-xl md:text-2xl font-light mb-3">
                      {mod.title}
                    </h3>
                    <p className="text-sm text-black/45 leading-relaxed mb-8">
                      {mod.desc}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-6 border-t border-black/[0.06]">
                    {mod.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-full text-[10px] tracking-wider text-black/35 border border-black/[0.08]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
