"use client";
import * as React from "react";
import { hasCode } from "@/lib/api/errors";
import { selectCompany } from "@/lib/company-session";
import { LegalRenewal } from "./legal-renewal";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { restoreSession } from "@/lib/api/auth";
import { loadSession, onSessionChange } from "@/lib/api/session";
import {
  accountSyncState,
  companyDirectory,
  subscribeAccount,
  hydrateAccount,
  refreshAccountRecords,
  resetAccount,
  legacyRecords,
  importLegacyRecords,
  retryAccountSave,
  exportPendingRecords,
  isConflict,
} from "@/lib/account-storage";
function downloadPending() {
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(
    new Blob([exportPendingRecords()], { type: "application/json" }),
  );
  anchor.download = "certrace-unsaved-changes.json";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
}
export function AccountDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(),
    queryClient = useQueryClient();
  const publicLink = /^\/(s|w|p)\//.test(pathname);
  const [legalRequired, setLegalRequired] = React.useState(false);
  const [revoked, setRevoked] = React.useState(false);
  const [refreshError, setRefreshError] = React.useState<string | null>(null);
  const [loaded, setLoaded] = React.useState(false),
    [error, setError] = React.useState<string | null>(null),
    [sync, setSync] = React.useState(accountSyncState),
    [legacy, setLegacy] = React.useState(0),
    [dismissed, setDismissed] = React.useState(false);
  const reload = React.useCallback(async () => {
    setLoaded(false);
    setError(null);
    if (publicLink) {
      setLoaded(true);
      return;
    }
    try {
      for (const key of [
        "certrace:auth",
        "certrace:anthropic-key",
        "certrace:demo-plan",
      ])
        window.localStorage.removeItem(key);
      const session = await restoreSession();
      setLegalRequired(Boolean(session.user.legalConsentRequired));
      setLegacy(legacyRecords().length);
    } catch (e) {
      if (!(e && typeof e === "object" && "status" in e && e.status === 401))
        setError(
          e instanceof Error ? e.message : "Could not load your account.",
        );
    } finally {
      setLoaded(true);
    }
  }, [publicLink]);
  React.useEffect(() => {
    void reload();
  }, [reload]);
  React.useEffect(
    () => subscribeAccount(() => setSync(accountSyncState())),
    [],
  );
  const refresh = React.useCallback(async () => {
    if (
      publicLink ||
      !loaded ||
      legalRequired ||
      !loadSession() ||
      document.visibilityState !== "visible"
    )
      return;
    try {
      const changed = await refreshAccountRecords();
      setRefreshError(null);
      if (changed) await queryClient.invalidateQueries();
    } catch (e) {
      if (hasCode(e, "COMPANY_ACCESS")) setRevoked(true);
      setRefreshError(
        e instanceof Error ? e.message : "Could not refresh your account.",
      );
    }
  }, [publicLink, loaded, legalRequired, queryClient]);
  React.useEffect(() => {
    if (publicLink || !loaded || legalRequired) return;
    const update = () => {
      void refresh();
    };
    window.addEventListener("focus", update);
    window.addEventListener("online", update);
    document.addEventListener("visibilitychange", update);
    const interval = window.setInterval(update, 30_000);
    return () => {
      window.removeEventListener("focus", update);
      window.removeEventListener("online", update);
      document.removeEventListener("visibilitychange", update);
      window.clearInterval(interval);
    };
  }, [publicLink, loaded, legalRequired, refresh]);
  React.useEffect(
    () =>
      onSessionChange((session) => {
        queryClient.clear();
        setLegalRequired(Boolean(session?.user.legalConsentRequired));
        if (!session) {
          resetAccount();
          return;
        }
        if (publicLink) return;
        if (session.user.legalConsentRequired) {
          setError(null);
          setLoaded(true);
          return;
        }
        setError(null);
        // Sign-in hydrates before publishing the session. Keep the current
        // screen visible instead of flashing the global loading page.
        void hydrateAccount(session.user.id, !session.user.ready)
          .then(() => {
            setLegacy(legacyRecords().length);
            setLoaded(true);
          })
          .catch((e) => {
            setError(String(e));
            setLoaded(true);
          });
      }),
    [publicLink, queryClient],
  );
  React.useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => {
      if (accountSyncState().pending) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const online = () => {
      void retryAccountSave().catch(() => {});
    };
    const saveError = (event: Event) =>
      setError((event as CustomEvent<string>).detail);
    window.addEventListener("beforeunload", unload);
    window.addEventListener("online", online);
    window.addEventListener("certrace:save-error", saveError);
    return () => {
      window.removeEventListener("beforeunload", unload);
      window.removeEventListener("online", online);
      window.removeEventListener("certrace:save-error", saveError);
    };
  }, []);
  if (!loaded)
    return (
      <div className="p-8 text-sm" role="status">
        Loading your account…
      </div>
    );
  if (
    legalRequired &&
    !publicLink &&
    !pathname.startsWith("/legal/") &&
    pathname !== "/auth/google"
  )
    return <LegalRenewal />;
  if (revoked && loadSession())
    return (
      <div className="p-8 space-y-4" role="alert">
        <p>Your access to this company has ended.</p>
        {sync.pending > 0 && (
          <button onClick={downloadPending}>Download unsaved changes</button>
        )}
        <button
          onClick={() => {
            const id = loadSession()!.user.id;
            selectCompany(id, id);
            window.location.replace("/dashboard");
          }}
        >
          Open my workspace
        </button>
      </div>
    );
  if (error)
    return (
      <div className="p-8" role="alert">
        <p>{error}</p>
        <button onClick={() => void reload()}>Retry</button>
        {sync.pending > 0 && (
          <button className="ml-4 underline" onClick={downloadPending}>
            Download unsaved changes
          </button>
        )}
      </div>
    );
  return (
    <>
      {!publicLink &&
        loadSession()?.user.ready &&
        companyDirectory()?.isOwner !== false &&
        legacy > 0 &&
        !dismissed && (
          <div className="border-b border-[#b45309]/20 bg-[#fffbeb] p-4 text-sm">
            <p>
              This browser has {legacy} saved data groups from the previous
              version. Import them into {loadSession()?.user.email}? Existing
              server records will be kept.
            </p>
            <button
              className="mr-4 underline"
              onClick={() =>
                void importLegacyRecords()
                  .then(() => {
                    queryClient.clear();
                    setLegacy(legacyRecords().length);
                    window.location.reload();
                  })
                  .catch((e) => setError(String(e)))
              }
            >
              Import browser data
            </button>
            <button className="underline" onClick={() => setDismissed(true)}>
              Later
            </button>
          </div>
        )}
      {children}
      {!publicLink && (sync.error || refreshError) && (
        <div
          className="sticky bottom-4 z-[100] mx-4 mb-4 max-w-md rounded border bg-white p-4 shadow sm:ml-auto"
          role="status"
        >
          <p>{sync.error ?? `Updates unavailable: ${refreshError}`}</p>
          {refreshError && !sync.error && sync.pending === 0 && (
            <button className="underline" onClick={() => void refresh()}>
              Retry refresh
            </button>
          )}
          {sync.error && (
            <>
              <button
                className="mr-4 underline"
                onClick={() => void retryAccountSave().catch(() => {})}
              >
                Retry
              </button>
              <button className="underline" onClick={downloadPending}>
                Download unsaved changes
              </button>
              {isConflict() && (
                <p>
                  Save a copy above before reloading to resolve the conflict.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
