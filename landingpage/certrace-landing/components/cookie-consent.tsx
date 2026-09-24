"use client";

/* ════════════════════════════════════════════════════════════
   COOKIE CONSENT BANNER

   A card pinned bottom-left (full-width on phones), not a page-blocking modal:
   the site works the same whichever button is pressed, so there is no reason
   to hold the page hostage until one is.

   THE THREE WAYS OUT carry equal weight. "Essential only" sits beside
   "Accept all" at the same size — a refusal hidden behind a settings screen is
   not a free choice under the PDPA or the GDPR.

   WHEN IT SHOWS. Only after mount, and only when no valid choice is stored —
   reading storage during render would mismatch the server HTML. The short
   delay lets the home page's splash (z-[100], above this card) clear first.
   The footer's "Cookie settings" reopens it straight onto the toggles.

   See lib/cookie-consent.ts for where the choice is kept and how scripts
   should gate on it.
   ════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useId, useState } from "react";
import { useLang } from "@/lib/i18n";
import {
  COOKIE_COPY,
  OPEN_SETTINGS_EVENT,
  readConsent,
  saveConsent,
  type ConsentCategory,
} from "@/lib/cookie-consent";

const SHOW_DELAY_MS = 1200;

export function CookieConsent() {
  const { lang } = useLang();
  const t = COOKIE_COPY[lang];
  const titleId = useId();

  const [open, setOpen] = useState(false);
  /* Drives the enter/exit transition separately from mounting, so the card
     slides in rather than popping into place. */
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs] = useState<Record<ConsentCategory, boolean>>({
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (!readConsent()) {
      timer = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    }

    const reopen = () => {
      const stored = readConsent();
      setPrefs({
        analytics: stored?.analytics ?? false,
        marketing: stored?.marketing ?? false,
      });
      setShowSettings(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, reopen);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener(OPEN_SETTINGS_EVENT, reopen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const decide = useCallback((choice: Record<ConsentCategory, boolean>) => {
    saveConsent(choice);
    setVisible(false);
    /* Unmount after the exit transition (matches duration-500 below). */
    setTimeout(() => {
      setOpen(false);
      setShowSettings(false);
    }, 500);
  }, []);

  if (!open) return null;

  const btnBase =
    "flex-1 whitespace-nowrap rounded-[10px] px-4 py-2.5 text-[12px] font-medium tracking-wide transition-colors";
  const btnPrimary = `${btnBase} bg-[#111] text-white hover:bg-[#333] active:bg-black`;
  const btnSecondary = `${btnBase} border border-black/[0.12] bg-white text-black/70 hover:border-black/25 hover:text-black`;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className={`fixed inset-x-3 bottom-3 z-[90] sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[400px] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        visible ? "translate-y-0 opacity-100 blur-0" : "translate-y-6 opacity-0 blur-[2px]"
      }`}
    >
      <div className="rounded-2xl border border-black/[0.08] bg-[#faf9f7]/95 p-5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] backdrop-blur-md">
        <div className="flex items-center gap-2">
          <CookieIcon />
          <h2
            id={titleId}
            className="font-pixel text-[10px] uppercase tracking-[0.2em] text-black/50"
          >
            {showSettings ? t.settingsTitle : t.title}
          </h2>
        </div>

        {showSettings ? (
          <ul className="mt-4 space-y-2">
            <CategoryRow
              name={t.categories.essential.name}
              desc={t.categories.essential.desc}
              locked
              lockedLabel={t.alwaysOn}
              checked
            />
            {(["analytics", "marketing"] as const).map((key) => (
              <CategoryRow
                key={key}
                name={t.categories[key].name}
                desc={t.categories[key].desc}
                checked={prefs[key]}
                onChange={(value) => setPrefs((p) => ({ ...p, [key]: value }))}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[13px] leading-relaxed text-black/55">
            {t.body}{" "}
            <a
              href="/privacy#cookies"
              className="text-black/75 underline underline-offset-2 hover:text-black"
            >
              {t.policyLink}
            </a>
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          {showSettings ? (
            <>
              <button type="button" className={btnSecondary} onClick={() => decide(prefs)}>
                {t.save}
              </button>
              <button
                type="button"
                className={btnPrimary}
                onClick={() => decide({ analytics: true, marketing: true })}
              >
                {t.acceptAll}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={btnSecondary}
                onClick={() => decide({ analytics: false, marketing: false })}
              >
                {t.essentialOnly}
              </button>
              <button
                type="button"
                className={btnPrimary}
                onClick={() => decide({ analytics: true, marketing: true })}
              >
                {t.acceptAll}
              </button>
            </>
          )}
        </div>

        {!showSettings && (
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="mt-3 w-full text-center text-[12px] text-black/40 underline-offset-2 transition-colors hover:text-black/70 hover:underline"
          >
            {t.customise}
          </button>
        )}
      </div>
    </div>
  );
}

function CategoryRow({
  name,
  desc,
  checked,
  onChange,
  locked,
  lockedLabel,
}: {
  name: string;
  desc: string;
  checked: boolean;
  onChange?: (value: boolean) => void;
  locked?: boolean;
  lockedLabel?: string;
}) {
  const id = useId();
  return (
    <li className="flex items-start justify-between gap-4 rounded-xl border border-black/[0.06] bg-white/70 px-3.5 py-3">
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
        <span className="block text-[13px] text-black/80">{name}</span>
        <span className="mt-0.5 block text-[11px] leading-snug text-black/40">{desc}</span>
      </label>
      {locked ? (
        <span className="shrink-0 pt-0.5 font-pixel text-[9px] uppercase tracking-[0.15em] text-emerald-600">
          {lockedLabel}
        </span>
      ) : (
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange?.(!checked)}
          className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${
            checked ? "bg-[#111]" : "bg-black/15"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
              checked ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      )}
    </li>
  );
}

function CookieIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-black/45">
      <path
        d="M12 3a9 9 0 1 0 9 9 3 3 0 0 1-3.5-3A3 3 0 0 1 14 5.5 3 3 0 0 1 12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="8.5" cy="10" r="1" fill="currentColor" />
      <circle cx="10" cy="15.5" r="1" fill="currentColor" />
      <circle cx="15" cy="15" r="1" fill="currentColor" />
    </svg>
  );
}
