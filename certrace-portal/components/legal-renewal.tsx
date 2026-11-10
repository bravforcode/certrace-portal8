"use client";
import * as React from "react";
import { LegalConsent } from "./legal-consent";
import { useLegalDocuments, legalVersionIds } from "@/lib/api/legal";
import { api, result } from "@/lib/api/client";
import { restoreSession } from "@/lib/api/auth";
import { clearSession } from "@/lib/api/session";

export function LegalRenewal() {
  const { documents, error: loadError, reload } = useLegalDocuments();
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [privacyAccepted, setPrivacyAccepted] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  async function accept() {
    if (!documents || !termsAccepted || !privacyAccepted) return;
    setBusy(true);
    setError(null);
    try {
      await result(
        api().api.auth.legal.accept.post({
          ...legalVersionIds(documents),
          termsAccepted,
          privacyAccepted,
        }),
      );
      await restoreSession();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not save your acceptance.",
      );
      setTermsAccepted(false);
      setPrivacyAccepted(false);
      await reload();
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl">
        Review our Terms of Service and Privacy Policy
      </h1>
      <p className="my-4 text-sm text-black/60">
        Please read and accept the current versions to continue. We record the
        versions, time, and available IP address of your acceptance.
      </p>
      {(error || loadError) && (
        <p role="alert" className="my-4">
          {error || loadError}
        </p>
      )}
      {!documents && !loadError && (
        <p role="status">Loading legal documents…</p>
      )}
      {loadError && <button onClick={() => void reload()}>Retry</button>}
      {documents && (
        <LegalConsent
          documents={documents}
          termsAccepted={termsAccepted}
          onTermsChange={setTermsAccepted}
          privacyAccepted={privacyAccepted}
          onPrivacyChange={setPrivacyAccepted}
        />
      )}
      <button
        className="mt-6 rounded bg-black px-5 py-3 text-white disabled:opacity-40"
        disabled={busy || !documents || !termsAccepted || !privacyAccepted}
        onClick={() => void accept()}
      >
        {busy ? "Saving…" : "Accept and continue"}
      </button>
      <button
        className="ml-4 underline"
        disabled={busy}
        onClick={() => {
          void result(api().api.auth.logout.post({}))
            .then(() => {
              clearSession();
              window.location.assign("/login");
            })
            .catch((e) => setError(String(e)));
        }}
      >
        Sign out
      </button>
    </main>
  );
}
