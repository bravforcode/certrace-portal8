"use client";

import * as React from "react";
import { StatusDot, cn } from "./ui";
import { CertraceLogo } from "./logo";
import { useT } from "@/lib/i18n";
import { MARKETING_SITE_URL } from "@/lib/links";
import { warmBackend } from "@/lib/api";

/* ── The brand-panel sub-line ───────────────────────────────────
   The default is the copy /register and /forgot-password carry, and it stays
   exactly as it was — the create-account flow is signed off and nothing here
   may move it. /login passes its own line instead: sign-in is the screen a
   returning exporter reads, and the positioning solution line ("an AI workflow
   platform connecting buyers, exporters, and suppliers") is what the public
   site says to that reader. One prop, one override, no shared copy edited. */
const DEFAULT_DESCRIPTION =
  "Carbon compliance infrastructure for exporters — collect supplier data through one link, have it checked automatically, calculate CBAM emissions, and keep an audit-ready report package your buyer can act on.";

/* ── The wordmark is the way back out ───────────────────────────
   Top-left on every auth screen, and it goes to the PUBLIC SITE, not to a
   route inside the portal: someone sitting on /login has no session yet, so
   the only "home" that exists for them is certrace.co. A logo that looks
   clickable and isn't is the reason people close the tab rather than read the
   form, so it is a real anchor with a real destination. `target` is
   deliberately absent — this is a way out of the app, not a side trip. */
function HomeLogo({ className }: { className?: string }) {
  const t = useT();
  return (
    <a
      href={MARKETING_SITE_URL}
      aria-label={t("Certrace — go to certrace.co")}
      className="inline-block rounded-sm transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
    >
      <CertraceLogo className={className} />
    </a>
  );
}

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
export function AuthLayout({ children, description }: { children: React.ReactNode; description?: string }) {
  const t = useT();
  /* Every auth screen is the first thing someone opens before talking to the
     backend, so this is where it gets woken up — see lib/api/warm.ts. */
  React.useEffect(() => {
    warmBackend();
  }, []);
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

        <div className="relative"><HomeLogo className="h-6 w-auto" /></div>

        {/* Positioning copy, kept in step with the public site: category is
            "carbon compliance infrastructure", the hook is that the order is
            lost on proof arriving second, and the regulation story is EU CBAM
            ONLY — which is why the old "CBAM live / EUDR · CSRD soon" chips
            are gone rather than restyled. One regulation, done properly. */}
        <div className="relative">
          <h1 className="max-w-md font-[family-name:var(--font-plex)] text-4xl font-light leading-[1.05] tracking-tight text-[#111]">
            {t("Buyers don't wait. They pick whoever proves it first.")}
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-black/45">
            {t(description ?? DEFAULT_DESCRIPTION)}
          </p>
        </div>

        <div className="relative flex items-center gap-6 text-[11px] uppercase tracking-[0.1em] text-black/35">
          <span className="inline-flex items-center gap-2">
            <StatusDot tone="ok" pulse glow /> {t("94% avg completion")}
          </span>
          <span>{t("6× faster filing")}</span>
        </div>
      </div>

      <div className="flex justify-center overflow-y-auto px-6 py-8 [align-items:safe_center] lg:py-16">
        <div className="w-full max-w-sm">
          <div className="lg:hidden"><HomeLogo className="h-5 w-auto" /></div>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── Google sign-in: off for launch ────────────────────────────
   There is no OAuth client registered for Certrace yet, so the button could
   only ever pretend: click it and you are signed in as nobody, which is worse
   than not offering it. Hidden rather than deleted because it is coming back —
   flipping this to true restores the button, its divider and both handlers,
   which are all still here and still wired.

   One flag for both screens on purpose. /login and /register each render their
   own copy, and a launch that shipped the button on one and not the other
   would look like a bug on whichever page you saw second.

   Typed as boolean, not inferred as `false`, so the code behind the flag stays
   type-checked instead of narrowing to a branch the compiler treats as dead. */
export const GOOGLE_AUTH_ENABLED: boolean = false;

/* "G" glyph drawn in brand-neutral strokes — no imported logo asset, just the
   universally-recognised four-colour mark so the button reads instantly. */
export function GoogleButton({ onClick, loading, label = "Continue with Google" }: { onClick: () => void; loading?: boolean; label?: string }) {
  const t = useT();
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
      {loading ? t("Connecting…") : t(label)}
    </button>
  );
}

export function Divider({ label = "or" }: { label?: string }) {
  const t = useT();
  return (
    <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.1em] text-black/30">
      <span className="h-px flex-1 bg-black/[0.08]" />
      {t(label)}
      <span className="h-px flex-1 bg-black/[0.08]" />
    </div>
  );
}

export function PasswordStrength({ value }: { value: string }) {
  const t = useT();
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
      <span className="mt-1.5 block text-[11px] text-black/35">{t(labels[score])}</span>
    </div>
  );
}

/* ── Nothing to sign in to ─────────────────────────────────────
   Rendered in PLACE OF the form when the build has neither a backend nor a
   sanctioned demo — `authUnavailable()` in lib/api/config.ts.

   Replaced rather than disabled, on purpose. A live-looking password box that
   goes nowhere invites a returning exporter to type their real password into a
   page with nothing behind it; a greyed-out one invites them to hunt for the
   thing they must be doing wrong. Neither is true, and both are worse than
   saying it plainly: accounts are not open on this deployment yet.

   No retry, no "try again later" spinner — nothing about this resolves by
   waiting on the client. The way out is the public site, which the wordmark
   above already links to. */
export function AuthUnavailable({ lead }: { lead?: string }) {
  const t = useT();
  return (
    <div className="mt-7 rounded-xl border border-black/10 bg-black/[0.015] px-5 py-5">
      <div className="flex items-center gap-2.5">
        <StatusDot tone="warn" />
        <p className="text-[11px] uppercase tracking-[0.1em] text-black/55">
          {t("Not open yet")}
        </p>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-black/60">
        {lead ?? t("Accounts aren't open on this deployment yet — there's no sign-in to complete.")}
      </p>
      <p className="mt-3 text-[13px] leading-relaxed text-black/45">
        {t("If you're expecting access, the exporter who invited you can tell you when the portal opens.")}
      </p>
    </div>
  );
}
