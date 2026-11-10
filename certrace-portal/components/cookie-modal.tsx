"use client";
import * as React from "react";
import { X } from "lucide-react";
import { Portal } from "@/components/controls";
import { Card, Eyebrow, Switch, SaveButton, type SaveState } from "@/components/ui";
import { useT } from "@/lib/i18n";
import {
  COOKIE_POLICY_VERSION,
  readChoice,
  saveChoice,
} from "@/lib/cookie-consent";

/* Shared by the first-visit banner and Settings. Analytics and marketing start off unless the visitor already chose. */
export function CookieModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const [analytics, setAnalytics] = React.useState(false);
  const [marketing, setMarketing] = React.useState(false);
  const [state, setState] = React.useState<SaveState>("idle");
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    const saved = readChoice();
    if (saved) {
      setAnalytics(saved.analytics);
      setMarketing(saved.marketing);
    }
  }, []);

  // Lock background scroll while the modal is open — otherwise the page
  // scrolls (and its scrollbar keeps showing through) underneath the overlay.
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Saved state auto-closes the popup shortly after.
  React.useEffect(() => {
    if (state !== "saved") return;
    const timer = window.setTimeout(onClose, 500);
    return () => window.clearTimeout(timer);
  }, [state, onClose]);

  const save = async () => {
    setState("saving");
    setFailed(false);
    try {
      await saveChoice({
        analytics,
        marketing,
        policyVersion: COOKIE_POLICY_VERSION,
      });
      setState("saved");
    } catch {
      setState("idle");
      setFailed(true);
    }
  };

  // Portaled to <body> — this modal is rendered inside the tab's `.ct-enter`
  // wrapper, whose entrance animation leaves a lingering `transform` (fill-mode:
  // both). A transformed ancestor becomes the containing block for `position:
  // fixed` descendants, so without the portal this "fullscreen" overlay would
  // only ever cover the tab-content box, not the real viewport.
  return (
    <Portal>
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden
        />
        <Card className="ct-enter relative z-10 w-full max-w-sm p-6">
          <button
            onClick={onClose}
            aria-label={t("Close")}
            className="absolute right-4 top-4 text-black/35 hover:text-black"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
          <Eyebrow>{t("Cookies")}</Eyebrow>
          <h2 className="mt-2 font-[family-name:var(--font-plex)] text-2xl font-light text-[#111]">
            {t("Manage cookies")}
          </h2>
          <div className="mt-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[13px] text-black/75">
                  {t("Essential")}
                </div>
                <p className="mt-0.5 text-[12px] text-black/40">
                  {t("Required to keep you signed in. Can't be disabled.")}
                </p>
              </div>
              <Switch checked disabled ariaLabel={t("Essential cookies")} />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[13px] text-black/75">
                  {t("Analytics")}
                </div>
                <p className="mt-0.5 text-[12px] text-black/40">
                  {t("Helps us see which parts of Certrace actually get used.")}
                </p>
              </div>
              <Switch
                checked={analytics}
                onChange={setAnalytics}
                ariaLabel={t("Analytics cookies")}
              />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[13px] text-black/75">
                  {t("Marketing")}
                </div>
                <p className="mt-0.5 text-[12px] text-black/40">
                  {t(
                    "Used to tailor announcements about new coverage and features.",
                  )}
                </p>
              </div>
              <Switch
                checked={marketing}
                onChange={setMarketing}
                ariaLabel={t("Marketing cookies")}
              />
            </div>
          </div>
          {failed && (
            <p role="alert" className="mt-4 text-[12px] text-red-700">
              {t("Could not save your cookie choice. Please try again.")}
            </p>
          )}
          <div className="mt-6">
            <SaveButton
              state={state}
              onClick={save}
              idleLabel={t("Save preferences")}
              savingLabel={t("Saving…")}
              savedLabel={t("Saved")}
            />
          </div>
        </Card>
      </div>
    </Portal>
  );
}
