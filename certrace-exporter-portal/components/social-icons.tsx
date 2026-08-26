"use client";

/* ── Platform marks, drawn rather than imported ─────────────────
   Each is the platform's own glyph on a 24×24 grid. Inline SVG rather than
   files in /public so the icons cannot 404 on the one screen a brand-new
   customer sees, and so they inherit the box size they are given.

   TWO INKS, ON PURPOSE.

   LINE is the support channel — the CBAM specialists answer there — so it
   keeps the real brand green: a generic chat bubble is not the LINE icon,
   and a Thai customer scans for the real one.

   The other four are a "follow us" row, not an action, so they are drawn in
   currentColor and carried in plain black by the caller. These are the same
   marks certrace.co uses in its footer (see certrace-landing
   components/footer.tsx) — LinkedIn and YouTube filled, Facebook and
   Instagram as outlines — so the two surfaces show one house style rather
   than five competing brand colours on a page whose subject is neither. */

export type SocialGlyph = "line" | "linkedin" | "facebook" | "instagram" | "youtube";

/* The LINE mark: speech bubble with the LINE letterforms knocked out. */
const LINE_PATH =
  "M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314";

export const SOCIAL_COLORS: Record<"line", string> = { line: "#06C755" };

export function SocialIcon({ glyph, size = 20, color, className }: { glyph: SocialGlyph; size?: number; color?: string; className?: string }) {
  const box = { width: size, height: size, viewBox: "0 0 24 24", className, "aria-hidden": true, focusable: "false" as const };

  if (glyph === "line") {
    return (
      <svg {...box} fill={color ?? SOCIAL_COLORS.line}>
        <path d={LINE_PATH} />
      </svg>
    );
  }

  /* currentColor throughout — the row that renders these sets the ink. */
  if (glyph === "linkedin") {
    return (
      <svg {...box} fill="currentColor">
        <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
      </svg>
    );
  }

  if (glyph === "facebook") {
    return (
      <svg {...box} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3.6l.4-4H14V7a1 1 0 0 1 1-1h3z" />
      </svg>
    );
  }

  if (glyph === "instagram") {
    return (
      <svg {...box} fill="none" stroke="currentColor" strokeWidth={1.7}>
        <rect x="3" y="3" width="18" height="18" rx="5.5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  return (
    <svg {...box} fill="currentColor">
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
    </svg>
  );
}
