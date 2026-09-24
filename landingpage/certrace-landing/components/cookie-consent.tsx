"use client";

/* ════════════════════════════════════════════════════════════
   COOKIE CONSENT BANNER

   Full screen: a dimmed, blurred backdrop over the whole page with a large
   card centred on it, and page scroll locked while it is up. There is no
   close button and clicking the backdrop does nothing — every way out is an
   explicit choice, so no one ends up "consenting" by dismissing it.

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

  /* Lock page scroll while the overlay is up, restoring whatever was set. */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

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
    "flex-1 whitespace-nowrap rounded-xl px-6 py-4 text-[14px] font-medium tracking-wide transition-colors";
  const btnPrimary = `${btnBase} bg-[#111] text-white hover:bg-[#333] active:bg-black`;
  const btnSecondary = `${btnBase} border border-black/[0.12] bg-white text-black/70 hover:border-black/25 hover:text-black`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={`fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto p-4 sm:p-8 transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div aria-hidden="true" className="fixed inset-0 bg-[#111]/45 backdrop-blur-md" />

      <div
        className={`relative my-auto w-full max-w-3xl rounded-3xl border border-black/[0.08] bg-[#faf9f7] p-7 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.45)] sm:p-12 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          visible ? "translate-y-0 scale-100 blur-0" : "translate-y-8 scale-[0.98] blur-[2px]"
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/[0.08] bg-white">
          <CookieIcon />
        </div>

        <h2
          id={titleId}
          className="mt-5 text-4xl font-light leading-[1.05] tracking-tight text-[#111] sm:text-5xl"
        >
          {showSettings ? t.settingsTitle : t.title}
        </h2>

        {showSettings ? (
          <ul className="mt-8 space-y-3">
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
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-black/55 sm:text-lg">
            {t.body}{" "}
            <a
              href="/privacy#cookies"
              className="text-black/75 underline underline-offset-2 hover:text-black"
            >
              {t.policyLink}
            </a>
          </p>
        )}

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          {showSettings ? (
            <button type="button" className={btnSecondary} onClick={() => decide(prefs)}>
              {t.save}
            </button>
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
                className={btnSecondary}
                onClick={() => setShowSettings(true)}
              >
                {t.customise}
              </button>
            </>
          )}
          <button
            type="button"
            className={btnPrimary}
            onClick={() => decide({ analytics: true, marketing: true })}
          >
            {t.acceptAll}
          </button>
        </div>
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
    <li className="flex items-start justify-between gap-4 rounded-2xl border border-black/[0.06] bg-white/70 px-5 py-4 sm:px-6 sm:py-5">
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
        <span className="block text-[15px] text-black/80 sm:text-base">{name}</span>
        <span className="mt-1 block text-[13px] leading-snug text-black/45 sm:text-sm">{desc}</span>
      </label>
      {locked ? (
        <span className="shrink-0 pt-0.5 font-pixel text-[10px] uppercase tracking-[0.15em] text-emerald-600">
          {lockedLabel}
        </span>
      ) : (
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange?.(!checked)}
          className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors ${
            checked ? "bg-[#111]" : "bg-black/15"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      )}
    </li>
  );
}

function CookieIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-black/45">
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
