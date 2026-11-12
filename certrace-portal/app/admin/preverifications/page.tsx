"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CertraceLogo } from "@/components/logo";
import { Card, Chip, inputClass } from "@/components/ui";
import { isApiError } from "@/lib/api";
import {
  listPreverifications,
  type AdminPreverification,
  type PreverificationStatus,
} from "@/lib/api/preverifications";

const STATUSES: { value: PreverificationStatus; label: string }[] = [
  { value: "team_review", label: "Waiting for team review" },
  { value: "ai_flagged", label: "Flagged by AI" },
  { value: "approved", label: "Approved" },
  { value: "changes_requested", label: "Changes requested" },
  { value: "superseded", label: "Superseded" },
];

export default function PreverificationListPage() {
  const router = useRouter();
  const [status, setStatus] = React.useState<PreverificationStatus>("team_review");
  const [items, setItems] = React.useState<AdminPreverification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [denied, setDenied] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    listPreverifications(status)
      .then((rows) => live && setItems(rows))
      .catch((cause: unknown) => {
        if (!live) return;
        if (isApiError(cause) && cause.status === 401) router.replace("/login");
        else if (isApiError(cause) && cause.status === 403) setDenied(true);
        else setError(cause instanceof Error ? cause.message : "Could not load submissions.");
      })
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [status, router]);

  return (
    <main className="min-h-dvh bg-[#f5f4f0] px-5 py-8 text-[#111] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4">
          <CertraceLogo className="h-6 w-auto" />
          <Link href="/admin" className="text-sm text-black/60 hover:text-black">
            Back to users
          </Link>
        </header>
        <div className="mt-10">
          <p className="text-xs uppercase tracking-[0.16em] text-black/45">Administration</p>
          <h1 className="mt-2 text-3xl font-light">CBAM pre-verification</h1>
          <p className="mt-2 text-sm text-black/55">
            Review what the AI checked, then approve or request changes.
          </p>
        </div>

        {denied ? (
          <Card className="mt-8 p-6">
            <p role="alert">Certrace team only.</p>
          </Card>
        ) : (
          <>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-3 text-sm text-black/60">
                Status
                <select
                  className={inputClass + " w-auto"}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PreverificationStatus)}
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {error && (
              <p role="alert" className="mt-4 text-sm text-[#dc2626]">
                {error}
              </p>
            )}

            <Card className="mt-4 overflow-hidden p-0">
              {loading ? (
                <p className="px-5 py-6 text-[13px] text-black/40">Loading…</p>
              ) : items.length === 0 ? (
                <p className="px-5 py-6 text-[13px] text-black/40">No submissions here.</p>
              ) : (
                items.map((item, i) => {
                  const errors = item.aiFindings.filter((f) => f.severity === "error").length;
                  const warns = item.aiFindings.length - errors;
                  return (
                    <Link
                      key={item.id}
                      href={`/admin/preverifications/${item.id}`}
                      className={
                        "flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-[#fafaf8] " +
                        (i === 0 ? "" : "border-t border-t-black/[0.06]")
                      }
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] text-black/85">
                          {item.companyName || item.companyEmail}
                        </p>
                        <p className="mt-0.5 text-[12px] text-black/45">
                          Installation {item.installationId} · {item.year} · Submitted{" "}
                          {new Date(item.submittedAt).toLocaleString()}
                        </p>
                      </div>
                      <Chip tone={errors ? "err" : "muted"} filled={errors > 0}>
                        {errors} errors
                      </Chip>
                      <Chip tone={warns ? "warn" : "muted"} filled={warns > 0}>
                        {warns} warnings
                      </Chip>
                      {item.stale && (
                        <Chip tone="warn" filled>
                          Data changed
                        </Chip>
                      )}
                    </Link>
                  );
                })
              )}
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
