"use client";
import * as React from "react";
import Link from "next/link";
import { Card, Button } from "@/components/ui";
import { api, result } from "@/lib/api/client";
import { loadSession, clearSession } from "@/lib/api/session";
import { restoreSession } from "@/lib/api/auth";
import { flushAccount, resetAccount } from "@/lib/account-storage";
import {
  forgetInvitation,
  pendingInvitation,
  rememberInvitation,
  selectCompany,
} from "@/lib/company-session";

export default function JoinPage() {
  const [secret, setSecret] = React.useState("");
  const [preview, setPreview] = React.useState<{
    company: string;
    email: string;
  } | null>(null);
  const [user, setUser] = React.useState(() => loadSession()?.user);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => {
    let live = true;
    const supplied = window.location.hash.slice(1);
    if (supplied) {
      rememberInvitation(supplied);
      window.history.replaceState(null, "", "/join");
    }
    const token = pendingInvitation();
    if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
      forgetInvitation();
      setError("Open the invitation link from your email.");
      return;
    }
    setSecret(token);
    result(api(false).api.v1.team.preview.post({ token }))
      .then((p) => {
        if (live) setPreview(p);
      })
      .catch((e) => {
        if (live) {
          setError(e.message);
          if (e.status === 410) forgetInvitation();
        }
      });
    return () => {
      live = false;
    };
  }, []);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg items-center px-6">
      <Card className="w-full space-y-5 p-7">
        <h1 className="text-2xl">
          {preview ? "Join " + preview.company : "Company invitation"}
        </h1>
        {error && <p role="alert">{error}</p>}
        {preview && (
          <>
            <p>
              You were invited to join as a member using{" "}
              <strong>{preview.email}</strong>.
            </p>
            {!user ? (
              <div className="flex gap-4">
                <Link className="underline" href="/login">
                  Sign in
                </Link>
                <Link className="underline" href="/register">
                  Create an account
                </Link>
              </div>
            ) : user.email.toLowerCase() !== preview.email ? (
              <>
                <p>You’re signed in as {user.email}.</p>
                <Button
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await flushAccount();
                      await result(api().api.auth.logout.post({}));
                      resetAccount();
                      clearSession();
                      window.location.assign("/login");
                    })
                  }
                >
                  Switch account
                </Button>
              </>
            ) : !user.ready ? (
              <>
                <p>
                  Your account is awaiting approval. Your invitation will be
                  available here until it expires.
                </p>
                <Button
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      setUser((await restoreSession()).user);
                    })
                  }
                >
                  Check approval
                </Button>
              </>
            ) : (
              <Button
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await flushAccount();
                    const joined = await result(
                      api().api.v1.team.accept.post({ token: secret }),
                    );
                    selectCompany(user.id, joined.companyId);
                    forgetInvitation();
                    window.location.replace("/dashboard");
                  })
                }
              >
                Accept invitation
              </Button>
            )}
          </>
        )}
        <button
          className="block text-sm underline"
          onClick={() => {
            forgetInvitation();
            window.location.assign(user?.ready ? "/dashboard" : "/login");
          }}
        >
          Leave invitation
        </button>
      </Card>
    </main>
  );
}
