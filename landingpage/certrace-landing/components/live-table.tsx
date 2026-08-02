"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";

/* The table itself is a mock of the product's own console — supplier names,
   statuses and column headers stay in English in both locales, because that
   is what the workspace actually renders. Only the summary line underneath,
   which is marketing copy, is translated. */
const SUPPLIERS = [
  "Bangkok Steel Co.",
  "Eastern Aluminum",
  "Thai Metals Group",
  "Northern Components",
  "Rayong Industrial",
  "Chonburi Fabrication",
  "Siam Cement Works",
  "Korat Fertilizer Co.",
  "Map Ta Phut Chemicals",
  "Laem Chabang Forge",
];

const REGULATIONS = ["CBAM Q2 2026", "CBAM Q2 2026", "CBAM Q2 2026", "Buyer · Scope 3", "CBAM Q1 2026"];

const STATUSES = [
  { label: "approved", color: "#4ade80" },
  { label: "approved", color: "#4ade80" },
  { label: "submitted", color: "#4ade80" },
  { label: "in review", color: "#60a5fa" },
  { label: "changes requested", color: "#facc15" },
  { label: "reminded", color: "#facc15" },
];

const UPDATED = [
  "1h ago",
  "2h ago",
  "3h ago",
  "5h ago",
  "1d ago",
  "2d ago",
];

type SupplierRow = {
  id: string;
  name: string;
  regulation: string;
  status: (typeof STATUSES)[number];
  updated: string;
  progress: number;
  key: number;
};

function createRow(key: number): SupplierRow {
  const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
  return {
    id: Math.random().toString(36).slice(2, 8).toUpperCase(),
    name: SUPPLIERS[key % SUPPLIERS.length],
    regulation: REGULATIONS[Math.floor(Math.random() * REGULATIONS.length)],
    status,
    updated: UPDATED[Math.floor(Math.random() * UPDATED.length)],
    progress:
      status.label === "approved" || status.label === "submitted"
        ? 100
        : Math.floor(Math.random() * 70 + 20),
    key,
  };
}

function ProgressBar({ initial }: { initial: number }) {
  const [value, setValue] = useState(initial);
  const current = useRef(initial);
  const frame = useRef(0);

  useEffect(() => {
    if (initial >= 100) return;
    const tick = () => {
      current.current = Math.min(99, current.current + 0.015);
      setValue(Math.round(current.current));
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [initial]);

  return (
    <div
      style={{
        width: "100%",
        height: 2,
        background: "rgba(0,0,0,0.08)",
        borderRadius: 9,
      }}
    >
      <div
        style={{
          height: "100%",
          borderRadius: 9,
          width: `${value}%`,
          background:
            initial >= 100 ? "rgba(16,185,129,0.5)" : "rgba(0,0,0,0.35)",
          transition: "width 0.5s linear",
        }}
      />
    </div>
  );
}

export function LiveSupplierTable() {
  const { c } = useLang();
  const [rows, setRows] = useState<SupplierRow[]>([]);
  const keyRef = useRef(100);

  useEffect(() => {
    setRows(Array.from({ length: 6 }, (_, i) => createRow(i)));
    const interval = setInterval(() => {
      keyRef.current += 1;
      setRows((prev) => [...prev.slice(1), createRow(keyRef.current)]);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div
        style={{
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 16,
          overflow: "hidden",
          background: "rgba(255,255,255,0.7)",
        }}
      >
        <div
          className="live-grid"
          style={{
            padding: "8px 16px",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            background: "rgba(0,0,0,0.03)",
          }}
        >
          {["SUPPLIER", "REGULATION", "STATUS", "UPDATED"].map((label) => (
            <span
              key={label}
              className={label === "UPDATED" ? "live-updated" : undefined}
              style={{
                fontSize: 8,
                letterSpacing: "0.16em",
                color: "rgba(0,0,0,0.30)",
                fontFamily: "monospace",
              }}
            >
              {label}
            </span>
          ))}
        </div>

        <div style={{ overflow: "hidden" }}>
          {rows.map((row, index) => (
            <div
              key={row.key}
              /* `.live-grid` owns the column track (globals.css): status needs
                 96px because "changes requested" plus its dot measures 92px at
                 8px mono, and at 80px it printed over the UPDATED column. The
                 same class narrows the table on phones. */
              className="live-grid"
              style={{
                padding: "10px 16px",
                borderBottom: "1px solid rgba(0,0,0,0.04)",
                animation:
                  index === rows.length - 1
                    ? "rowSlideIn 0.4s cubic-bezier(0.16,1,0.3,1) both"
                    : "none",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 9,
                    color: "rgba(0,0,0,0.6)",
                    lineHeight: 1.35,
                    marginBottom: 5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.name}{" "}
                  <span
                    style={{
                      fontSize: 7.5,
                      fontFamily: "monospace",
                      color: "rgba(0,0,0,0.25)",
                    }}
                  >
                    #{row.id}
                  </span>
                </div>
                <ProgressBar initial={row.progress} />
              </div>

              <div
                style={{
                  fontSize: 8,
                  fontFamily: "monospace",
                  color: "rgba(0,0,0,0.30)",
                }}
              >
                {row.regulation}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: row.status.color,
                    boxShadow:
                      row.status.label === "approved"
                        ? `0 0 6px ${row.status.color}`
                        : "none",
                    animation:
                      row.status.label === "in review"
                        ? "statusPulse 2s ease-in-out infinite"
                        : "none",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 8,
                    fontFamily: "monospace",
                    color: "rgba(0,0,0,0.35)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.status.label}
                </span>
              </div>

              <div
                className="live-updated"
                style={{
                  fontSize: 8,
                  fontFamily: "monospace",
                  color: "rgba(0,0,0,0.30)",
                }}
              >
                {row.updated}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        {c.live.stats.map((stat, i) => (
          <span
            key={stat}
            className="flex items-center gap-2 text-[11px] tracking-wide text-black/40"
          >
            <span
              className={`w-1 h-1 rounded-full ${
                i === 2 ? "bg-amber-500/70" : "bg-emerald-500/70"
              }`}
            />
            {stat}
          </span>
        ))}
      </div>
    </div>
  );
}

export function CompletionCount() {
  const [count, setCount] = useState(24);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setCount((c) => Math.max(22, Math.min(27, c + Math.floor(Math.random() * 3) - 1)));
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      style={{
        fontFamily: "monospace",
        fontSize: "clamp(3rem, 6vw, 5rem)",
        fontWeight: 300,
        color: "rgba(0,0,0,0.85)",
        lineHeight: 1,
        letterSpacing: "-0.02em",
        /* "24 / 30" is one figure and must never break across lines. On a
           390px phone the Thai caption beside it is wide enough to squeeze
           this box until "30" dropped to a second line. */
        whiteSpace: "nowrap",
      }}
    >
      {mounted ? count : 24}
      <span style={{ color: "rgba(0,0,0,0.25)" }}> / 30</span>
    </span>
  );
}
