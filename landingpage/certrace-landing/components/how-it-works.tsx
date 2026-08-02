"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";

/* The console panel's lines are stored as plain strings in lib/content.ts so
   the two languages stay easy to keep in sync. The leading glyph decides the
   colour — the same convention the product's own activity log uses:
     #  section heading   ✓  success   ●  attention   →  in progress
   An empty string is a blank line, used to group the log into stanzas. */
function lineTone(text: string) {
  if (!text.trim()) return "gap" as const;
  if (text.startsWith("#")) return "muted" as const;
  if (text.startsWith("✓")) return "ok" as const;
  if (text.startsWith("●")) return "warn" as const;
  if (text.startsWith("→")) return "info" as const;
  return "plain" as const;
}

const TONE_COLOR: Record<string, string> = {
  muted: "#9ca3af",
  ok: "#16a34a",
  warn: "#b45309",
  info: "#2563eb",
  plain: "#111",
};

function LogLineView({ text }: { text: string }) {
  const tone = lineTone(text);
  if (tone === "gap") return <div className="h-3" />;
  return <div style={{ color: TONE_COLOR[tone] }}>{text}</div>;
}

export function HowItWorksPanel() {
  const { c } = useLang();
  const steps = c.howItWorks.steps;

  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setActive((i) => (i + 1) % steps.length);
        setVisible(true);
      }, 180);
    }, 3600);
    return () => clearInterval(interval);
  }, [steps.length]);

  const step = steps[active];

  const selectStep = (index: number) => {
    if (index === active) return;
    setVisible(false);
    setTimeout(() => {
      setActive(index);
      setVisible(true);
    }, 180);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-stretch">
      <div className="flex flex-col gap-3">
        {steps.map((item, index) => (
          <button
            key={item.title}
            onClick={() => selectStep(index)}
            className="flex-1 text-left rounded-2xl border transition-all duration-200 p-6 group"
            style={{
              background:
                active === index ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.7)",
              borderColor:
                active === index ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.06)",
              boxShadow:
                active === index
                  ? "0 1px 3px rgba(0,0,0,0.06)"
                  : "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <div className="flex gap-4 items-start">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-light shrink-0 transition-colors duration-200"
                style={{
                  background:
                    active === index ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.04)",
                  color:
                    active === index ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.35)",
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="min-w-0">
                <p
                  className="text-sm font-light transition-colors duration-200"
                  style={{
                    color:
                      active === index ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.5)",
                  }}
                >
                  {item.title}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "rgba(0,0,0,0.28)" }}
                >
                  {item.desc}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div
        className="lg:col-span-2 rounded-2xl border border-black/[0.06] p-8 flex flex-col"
        style={{
          background: "rgba(255,255,255,0.7)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          minHeight: "360px",
        }}
      >
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div
            className="text-[10px] tracking-widest uppercase transition-all duration-200"
            style={{
              opacity: visible ? 1 : 0,
              filter: visible ? "blur(0px)" : "blur(4px)",
              transition: "opacity 200ms ease, filter 200ms ease",
              color: "rgba(0,0,0,0.3)",
            }}
          >
            {step.view}
          </div>
          <div className="flex gap-1.5">
            {steps.map((_, dot) => (
              <div
                key={dot}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  background:
                    dot === active ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.08)",
                }}
              />
            ))}
          </div>
        </div>

        <div
          className="flex-1 rounded-xl p-6 overflow-hidden"
          style={{
            background: "rgba(0,0,0,0.03)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <div
            className="font-mono text-[12px] leading-6"
            style={{
              opacity: visible ? 1 : 0,
              filter: visible ? "blur(0px)" : "blur(6px)",
              transform: visible ? "translateY(0)" : "translateY(6px)",
              transition:
                "opacity 220ms cubic-bezier(0.16,1,0.3,1), filter 220ms cubic-bezier(0.16,1,0.3,1), transform 220ms cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            {step.lines.map((line, i) => (
              <LogLineView key={i} text={line} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
