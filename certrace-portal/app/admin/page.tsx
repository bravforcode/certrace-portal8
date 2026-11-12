"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CertraceLogo } from "@/components/logo";
import { Button, Card, Field, Modal, inputClass } from "@/components/ui";
import { isApiError } from "@/lib/api";
import {
  extendAdminTrial,
  listAdminUsers,
  rejectAdminUser,
  setAdminUserReady,
  type AdminUser,
} from "@/lib/api/admin";

export default function AdminPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [appliedSearch, setAppliedSearch] = React.useState("");
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [denied, setDenied] = React.useState(false);
  const [error, setError] = React.useState("");
  const [rejecting, setRejecting] = React.useState<AdminUser | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");
  const [rejectError, setRejectError] = React.useState("");
  const rejectTrigger = React.useRef<HTMLButtonElement | null>(null);

  const load = React.useCallback(
    async (query: string, after?: string) => {
      setLoading(true);
      setError("");
      try {
        const result = await listAdminUsers(query, after);
        setUsers((current) =>
          after ? [...current, ...result.users] : result.users,
        );
        setCursor(result.nextCursor);
      } catch (cause) {
        if (isApiError(cause) && cause.status === 401) router.replace("/login");
        else if (isApiError(cause) && cause.status === 403) setDenied(true);
        else
          setError(
            cause instanceof Error ? cause.message : "Could not load users.",
          );
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  React.useEffect(() => {
    void load("");
  }, [load]);

  async function changeReady(user: AdminUser) {
    setSavingId(user.id);
    setError("");
    try {
      const result = await setAdminUserReady(user.id, !user.ready);
      setUsers((current) =>
        current.map((item) => (item.id === user.id ? result.user : item)),
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not update this user.",
      );
    } finally {
      setSavingId(null);
    }
  }

  // Closing the dialog returns focus to the row button that opened it.
  function closeReject() {
    setRejecting(null);
    rejectTrigger.current?.focus();
  }

  async function extendTrial(user: AdminUser, days: number) {
    setSavingId(user.id);
    setError("");
    try {
      const result = await extendAdminTrial(user.id, days);
      setUsers((current) =>
        current.map((item) => (item.id === user.id ? result.user : item)),
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not extend the trial.",
      );
    } finally {
      setSavingId(null);
    }
  }

  async function submitReject() {
    if (!rejecting) return;
    const reason = rejectReason.trim();
    if (reason.length < 3) {
      setRejectError("Give a reason of at least 3 characters.");
      return;
    }
    setSavingId(rejecting.id);
    setRejectError("");
    try {
      const result = await rejectAdminUser(rejecting.id, reason);
      setUsers((current) =>
        current.map((item) => (item.id === rejecting.id ? result.user : item)),
      );
      setRejectReason("");
      closeReject();
    } catch (cause) {
      setRejectError(
        cause instanceof Error ? cause.message : "Could not reject this user.",
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="min-h-dvh bg-[#f5f4f0] px-5 py-8 text-[#111] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4">
          <CertraceLogo className="h-6 w-auto" />
          <div className="flex items-center gap-5 text-sm">
            <Link href="/admin/preverifications" className="text-black/60 hover:text-black">
              Pre-verifications
            </Link>
            <Link href="/" className="text-black/60 hover:text-black">
              Back to portal
            </Link>
          </div>
        </header>
        <div className="mt-10">
          <p className="text-xs uppercase tracking-[0.16em] text-black/45">
            Administration
          </p>
          <h1 className="mt-2 text-3xl font-light">Users</h1>
          <p className="mt-2 text-sm text-black/55">
            View registered accounts and control access to onboarding and the
            workspace.
          </p>
        </div>

        {denied ? (
          <Card className="mt-8 p-6">
            <p role="alert">You do not have admin access.</p>
          </Card>
        ) : (
          <>
            <form
              className="mt-8 flex max-w-lg gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                setAppliedSearch(search.trim());
                void load(search.trim());
              }}
            >
              <input
                className={inputClass}
                aria-label="Search users"
                placeholder="Search email, name or company"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <Button type="submit" disabled={loading}>
                Search
              </Button>
            </form>
            {error && (
              <p className="mt-4 text-sm text-[#dc2626]" role="alert">
                {error}
              </p>
            )}
            <Card className="mt-5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-black/[0.03] text-xs uppercase tracking-wide text-black/45">
                    <tr>
                      <th className="px-5 py-4 font-medium">User</th>
                      <th className="px-5 py-4 font-medium">Company</th>
                      <th className="px-5 py-4 font-medium">Registered</th>
                      <th className="px-5 py-4 font-medium">Account</th>
                      <th className="px-5 py-4 font-medium">Onboarding</th>
                      <th className="px-5 py-4 font-medium">Ready</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.07]">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-5 py-4">
                          <div className="font-medium">
                            {[user.firstName, user.lastName]
                              .filter(Boolean)
                              .join(" ") || "No name"}
                          </div>
                          <div className="mt-1 text-xs text-black/50">
                            {user.email}
                          </div>
                          <div className="mt-1 font-mono text-[10px] text-black/35">
                            {user.id}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-black/65">
                          {user.companyName || "—"}
                        </td>
                        <td className="px-5 py-4 text-black/65">
                          <div>
                            {new Date(user.registeredAt).toLocaleDateString()}
                          </div>
                          {user.approvedAt && (
                            <div className="mt-1 text-xs text-black/45">
                              Approved{" "}
                              {new Date(user.approvedAt).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-black/65">
                          {user.status} · {user.planId}
                        </td>
                        <td className="px-5 py-4 text-black/65">
                          {user.onboarded ? "Completed" : "Incomplete"}
                        </td>
                        <td className="px-5 py-4">
                          <span className="mr-3 text-black/65">
                            {user.ready ? "Ready" : "Not ready"}
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={savingId === user.id}
                            aria-label={`Mark ${user.email} ${user.ready ? "not ready" : "ready"}`}
                            onClick={() => void changeReady(user)}
                          >
                            {savingId === user.id
                              ? "Saving…"
                              : user.ready
                                ? "Set not ready"
                                : "Set ready"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="ml-2"
                            disabled={savingId === user.id}
                            onClick={() => void extendTrial(user, 14)}
                          >
                            +14 days
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="ml-2"
                            disabled={savingId === user.id || user.status === "SUSPENDED"}
                            aria-label={`Reject ${user.email}`}
                            onClick={(event) => {
                              rejectTrigger.current = event.currentTarget;
                              setRejectError("");
                              setRejectReason("");
                              setRejecting(user);
                            }}
                          >
                            Reject
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!loading && users.length === 0 && (
                <p className="p-6 text-sm text-black/50">No users found.</p>
              )}
            </Card>
            {loading && (
              <p className="mt-4 text-sm text-black/50" role="status">
                Loading users…
              </p>
            )}
            {cursor && !loading && (
              <Button
                className="mt-5"
                variant="secondary"
                onClick={() => void load(appliedSearch, cursor)}
              >
                Load more
              </Button>
            )}
          </>
        )}
      </div>
      <Modal
        open={rejecting !== null}
        onClose={closeReject}
        title="Reject account"
        lead={rejecting?.email}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={savingId !== null}
              onClick={closeReject}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={savingId !== null}
              onClick={() => void submitReject()}
            >
              Reject account
            </Button>
          </>
        }
      >
        <Field label="Reason (shown to the customer)">
          <textarea
            className={inputClass}
            rows={3}
            maxLength={500}
            autoFocus
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
          />
        </Field>
        {rejectError && (
          <p className="mt-3 text-sm text-[#dc2626]" role="alert">
            {rejectError}
          </p>
        )}
      </Modal>
    </main>
  );
}
