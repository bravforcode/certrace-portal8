"use client";
import * as React from "react";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { CookieModal } from "@/components/cookie-modal";
import { useT } from "@/lib/i18n";
import { COOKIE_POLICY_VERSION, readChoice, saveChoice } from "@/lib/cookie-consent";

/* Shown until the visitor records a choice. Necessary cookies are always on; Accept and Reject are equal so refusing is as easy as accepting. */
export function CookieBanner() {
  const t = useT();
  // Starts hidden and is decided after mount, so server and client markup match.
  const [open, setOpen] = React.useState(false);
  const [customising, setCustomising] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    setOpen(readChoice() === null);
  }, []);

  const closeModal = React.useCallback(() => {
    setCustomising(false);
    setOpen(readChoice() === null);
  }, []);

  const decide = async (analytics: boolean, marketing: boolean) => {
    setBusy(true);
    setFailed(false);
    try {
      await saveChoice({
        analytics,
        marketing,
        policyVersion: COOKIE_POLICY_VERSION,
      });
      setOpen(false);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {open && (
        <section
          aria-labelledby="cookie-banner-title"
          className="fixed bottom-4 right-4 left-4 z-[80] sm:left-auto"
        >
          <Card className="w-full p-4 shadow-lg sm:max-w-[380px]">
            <h2
              id="cookie-banner-title"
              className="text-[13px] font-medium text-[#111]"
            >
              {t("Cookie consent")}
            </h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-black/65">
              {t(
                "We use necessary cookies to keep you signed in. With your permission we also use analytics cookies to improve Certrace.",
              )}{" "}
              <Link href="/legal/privacy" className="underline">
                {t("Privacy Policy")}
              </Link>
            </p>
            {failed && (
              <p role="alert" className="mt-3 text-[12px] text-red-700">
                {t("Could not save your cookie choice. Please try again.")}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Button size="sm"
                variant="primary"
                disabled={busy}
                onClick={() => decide(false, false)}
              >
                {t("Reject optional")}
              </Button>
              <Button size="sm"
                variant="primary"
                disabled={busy}
                onClick={() => decide(true, true)}
              >
                {t("Accept all")}
              </Button>
              <Button size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => setCustomising(true)}
              >
                {t("Customise")}
              </Button>
            </div>
          </Card>
        </section>
      )}
      {customising && <CookieModal onClose={closeModal} />}
    </>
  );
}
