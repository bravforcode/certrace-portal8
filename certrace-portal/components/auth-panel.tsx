"use client";

import * as React from "react";
import { Chip, StatusDot, cn } from "./ui";
import { CertraceLogo } from "./logo";

/* Shared shell for /login, /register and /forgot-password — same decorative
   brand panel + form frame, so the three auth screens read as one flow.

   The outer grid is pinned to exactly the viewport height and never scrolls
   itself — the left brand panel is decorative and fixed in place. Only the
   right column scrolls, and it uses `safe center`: short content still
   centers, but content taller than the viewport (e.g. the register form once
   a "Passwords don't match" line appears) falls back to top-aligned +
   scrollable instead of centering. Plain `items-center` on overflowing flex
   content clips symmetrically off both ends, and since scrollTop can't go
   negative, that clipped top (the logo) becomes permanently unreachable —
   `safe center` is the standard fix. */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid h-dvh overflow-hidden lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-black/[0.06] p-12 lg:flex">
        <div className="dotted-grid absolute inset-0 opacity-60" aria-hidden />
        <svg className="absolute inset-0 h-full w-full" aria-hidden>
          <g stroke="rgba(17,17,17,0.10)" strokeWidth="1">
            <line x1="80" y1="120" x2="220" y2="180" />
            <line x1="220" y1="180" x2="180" y2="340" />
            <line x1="220" y1="180" x2="380" y2="150" />
            <line x1="380" y1="150" x2="480" y2="280" />
          </g>
          <g fill="rgba(17,17,17,0.28)">
            <circle cx="80" cy="120" r="3" />
            <circle cx="180" cy="340" r="3" />
            <circle cx="480" cy="280" r="3" />
          </g>
          <g fill="#10b981" opacity="0.5">
            <circle cx="220" cy="180" r="3.4" />
            <circle cx="380" cy="150" r="3.4" />
          </g>
        </svg>

        <div className="relative"><CertraceLogo className="h-6 w-auto" /></div>

        <div className="relative">
          <h1 className="max-w-md font-[family-name:var(--font-plex)] text-4xl font-light leading-[1.05] tracking-tight text-[#111]">
            Supply-chain carbon compliance. Without the chaos.
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-black/45">
            Structure supplier data, calculate traceable draft emissions, and prepare a reviewed handoff for the EU-side
            declarant and accredited verifier.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <Chip tone="ok">CBAM live</Chip>
            <Chip>EUDR · CSRD soon</Chip>
          </div>
        </div>

        <div className="relative flex items-center gap-6 text-[11px] uppercase tracking-[0.1em] text-black/35">
          <span className="inline-flex items-center gap-2">
            <StatusDot tone="ok" pulse glow /> 94% avg completion
          </span>
          <span>6× faster filing</span>
        </div>
      </div>

      <div className="flex justify-center overflow-y-auto px-6 py-8 [align-items:safe_center] lg:py-16">
        <div className="w-full max-w-sm">
          <div className="lg:hidden"><CertraceLogo className="h-5 w-auto" /></div>
          {children}
        </div>
      </div>
    </div>
  );
}

/* "G" glyph drawn in brand-neutral strokes — no imported logo asset, just the
   universally-recognised four-colour mark so the button reads instantly. */
export function GoogleButton({ onClick, loading, label = "Continue with Google" }: { onClick: () => void; loading?: boolean; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-black/10 bg-white px-6 py-3 text-[13px] text-black/70 transition-colors hover:border-black/25 hover:bg-black/[0.02] disabled:pointer-events-none disabled:opacity-50"
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/15 border-t-black/50" aria-hidden />
      ) : (
        <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.9-2.26 5.36-4.78 7.02l7.73 6c4.51-4.18 7.09-10.36 7.09-17.49z" />
          <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A24 24 0 0 0 0 24c0 3.87.92 7.53 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
      )}
      {loading ? "Connecting…" : label}
    </button>
  );
}

export function Divider({ label = "or" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.1em] text-black/30">
      <span className="h-px flex-1 bg-black/[0.08]" />
      {label}
      <span className="h-px flex-1 bg-black/[0.08]" />
    </div>
  );
}

export function PasswordStrength({ value }: { value: string }) {
  const score = React.useMemo(() => {
    let s = 0;
    if (value.length >= 8) s++;
    if (/[A-Z]/.test(value)) s++;
    if (/[0-9]/.test(value)) s++;
    if (/[^A-Za-z0-9]/.test(value)) s++;
    return s;
  }, [value]);
  if (!value) return null;
  const labels = ["Too weak", "Weak", "Okay", "Good", "Strong"];
  const colors = ["#f87171", "#f87171", "#facc15", "#60a5fa", "#4ade80"];
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn("h-[3px] flex-1 rounded-full transition-colors")} style={{ background: i < score ? colors[score] : "rgba(0,0,0,0.08)" }} />
        ))}
      </div>
      <span className="mt-1.5 block text-[11px] text-black/35">{labels[score]}</span>
    </div>
  );
}
