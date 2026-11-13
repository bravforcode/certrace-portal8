"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CertraceLogo } from "@/components/logo";
import { Button, Card, Chip, inputClass } from "@/components/ui";
import { toast } from "@/components/toast";
import { isApiError } from "@/lib/api";
import {
  decidePreverification,
  getPreverificationDetail,
  reviewWorkbookFile,
  type AdminPreverificationDetail,
} from "@/lib/api/preverifications";
import {
  CBAM_FIELDS,
  cbamCellLabel,
  cbamOptionLabel,
} from "@/lib/cbam/template-fields";

const NOTE_MAX = 2000;

export default function PreverificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = React.useState<AdminPreverificationDetail | null>(
    null,
  );
  const [loading, setLoading] = React.useState(true);
  const [denied, setDenied] = React.useState(false);
  const [error, setError] = React.useState("");
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [reviewing, setReviewing] = React.useState<string | null>(null);

  React.useEffect(() => {
    let live = true;
    setLoading(true);
    getPreverificationDetail(id)
      .then((row) => live && setDetail(row))
      .catch((cause: unknown) => {
        if (!live) return;
        if (isApiError(cause) && cause.status === 401) router.replace("/login");
        else if (isApiError(cause) && cause.status === 403) setDenied(true);
        else
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load this submission.",
          );
      })
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [id, router]);

  const cellRows = React.useMemo(() => {
    if (!detail) return [];
    return CBAM_FIELDS.flatMap((f) => {
      const raw = detail.cells[`cbam:0:${f.id}`];
      if (!raw || !raw.trim()) return [];
      const value = cbamOptionLabel(f, raw) + (f.unit ? ` ${f.unit}` : "");
      return [{ key: f.id, label: cbamCellLabel(f.id), value }];
    });
  }, [detail]);

  // Decisions are only open for a submission still waiting on the team, with data unchanged since the AI check.
  const blocked = detail
    ? detail.status !== "team_review"
      ? "This submission is no longer waiting for review."
      : detail.stale
        ? "The customer changed the data after the AI check. It cannot be decided; they must submit again."
        : null
    : null;

  async function toggleReview(fileId: string, reviewed: boolean) {
    if (!detail) return;
    setReviewing(fileId);
    try {
      await reviewWorkbookFile(detail, fileId, reviewed);
      const at = reviewed ? new Date().toISOString() : null;
      setDetail({
        ...detail,
        files: detail.files.map((f) =>
          f.id === fileId ? { ...f, reviewedAt: at } : f,
        ),
      });
    } catch (cause) {
      toast(
        isApiError(cause) ? cause.message : "Could not save the file review.",
      );
    } finally {
      setReviewing(null);
    }
  }

  async function decide(decision: "approved" | "changes_requested") {
    if (!detail) return;
    const text = note.trim();
    if (decision === "changes_requested" && !text) {
      setError(
        "Write what the customer should change before requesting changes.",
      );
      return;
    }
    setSaving(true);
    setError("");
    try {
      await decidePreverification(
        detail.id,
        decision,
        decision === "changes_requested" ? text : "",
      );
      toast(
        decision === "approved"
          ? "Pre-verification approved"
          : "Changes requested",
      );
      router.push("/admin/preverifications");
    } catch (cause) {
      setError(decideError(cause));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[#f5f4f0] px-5 py-8 text-[#111] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4">
          <CertraceLogo className="h-6 w-auto" />
          <Link
            href="/admin/preverifications"
            className="text-sm text-black/60 hover:text-black"
          >
            Back to submissions
          </Link>
        </header>

        {denied ? (
          <Card className="mt-8 p-6">
            <p role="alert">Certrace team only.</p>
          </Card>
        ) : loading ? (
          <p className="mt-10 text-[13px] text-black/40">Loading…</p>
        ) : !detail ? (
          <Card className="mt-8 p-6">
            <p role="alert">
              {error || "This submission could not be loaded."}
            </p>
          </Card>
        ) : (
          <>
            <div className="mt-10">
              <p className="text-xs uppercase tracking-[0.16em] text-black/45">
                CBAM pre-verification
              </p>
              <h1 className="mt-2 text-3xl font-light">
                {detail.companyName || detail.companyEmail}
              </h1>
              <p className="mt-2 text-sm text-black/55">
                Installation {detail.installationId} · {detail.year} · Submitted{" "}
                {new Date(detail.submittedAt).toLocaleString()}
              </p>
              {detail.stale && (
                <div className="mt-3">
                  <Chip tone="warn" filled>
                    Data changed since the AI check
                  </Chip>
                </div>
              )}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
              <Card className="space-y-4 p-6">
                <h2 className="text-sm font-medium text-black/75">AI check</h2>
                {detail.aiSummary && (
                  <p className="text-[13px] leading-relaxed text-black/65">
                    {detail.aiSummary}
                  </p>
                )}
                {detail.aiFindings.length === 0 ? (
                  <p className="text-[13px] text-black/45">No findings.</p>
                ) : (
                  <ul className="space-y-3">
                    {detail.aiFindings.map((f, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="pt-0.5">
                          <Chip
                            tone={f.severity === "error" ? "err" : "warn"}
                            filled
                          >
                            {f.severity === "error" ? "Error" : "Warning"}
                          </Chip>
                        </span>
                        <span className="min-w-0 flex-1 text-[13px] leading-relaxed text-black/70">
                          {f.field && (
                            <span className="block text-[12px] text-black/45">
                              {cbamCellLabel(f.field)}
                            </span>
                          )}
                          {f.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card className="space-y-4 p-6">
                <h2 className="text-sm font-medium text-black/75">Decision</h2>
                {blocked && (
                  <p role="alert" className="text-[13px] text-[#b45309]">
                    {blocked}
                  </p>
                )}
                <Button
                  onClick={() => decide("approved")}
                  disabled={saving || blocked !== null}
                >
                  Approve
                </Button>
                <div className="space-y-2">
                  <label
                    className="block text-[13px] text-black/60"
                    htmlFor="review-note"
                  >
                    Note for the customer (required to request changes)
                  </label>
                  <textarea
                    id="review-note"
                    className={inputClass + " min-h-28"}
                    maxLength={NOTE_MAX}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    disabled={blocked !== null}
                  />
                  <Button
                    variant="secondary"
                    onClick={() => decide("changes_requested")}
                    disabled={saving || blocked !== null}
                  >
                    Request changes
                  </Button>
                </div>
                {error && (
                  <p role="alert" className="text-[13px] text-[#dc2626]">
                    {error}
                  </p>
                )}
              </Card>
            </div>

            <Card className="mt-6 overflow-hidden p-0">
              <div className="px-5 py-4">
                <h2 className="text-sm font-medium text-black/75">
                  Evidence files
                </h2>
                <p className="mt-1 text-[12px] text-black/45">
                  Marking a file reviewed shows the customer a green dot. It
                  does not change their data.
                </p>
              </div>
              {detail.files.length === 0 ? (
                <p className="px-5 pb-5 text-[13px] text-black/40">
                  No files uploaded for this year.
                </p>
              ) : (
                <ul>
                  {detail.files.map((f) => (
                    <li
                      key={f.id}
                      className="flex flex-wrap items-center gap-3 border-t border-black/[0.06] px-5 py-3"
                    >
                      <span className="min-w-0 flex-1 text-[13px]">
                        <span className="block truncate text-black/85">
                          {f.name}
                        </span>
                        {f.description && (
                          <span className="block text-[12px] text-black/45">
                            {f.description}
                          </span>
                        )}
                      </span>
                      {f.reviewedAt && (
                        <Chip tone="ok" filled>
                          Reviewed {new Date(f.reviewedAt).toLocaleDateString()}
                        </Chip>
                      )}
                      <Button
                        variant="secondary"
                        onClick={() => toggleReview(f.id, !f.reviewedAt)}
                        disabled={reviewing !== null}
                      >
                        {f.reviewedAt ? "Clear review" : "Mark reviewed"}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="mt-6 overflow-hidden p-0">
              <div className="px-5 py-4">
                <h2 className="text-sm font-medium text-black/75">
                  Reviewed answers
                </h2>
              </div>
              {cellRows.length === 0 ? (
                <p className="px-5 pb-5 text-[13px] text-black/40">
                  No answers filled.
                </p>
              ) : (
                <table className="w-full text-left text-[13px]">
                  <thead className="border-t border-black/[0.06] text-black/45">
                    <tr>
                      <th className="px-5 py-2 font-normal">Field</th>
                      <th className="px-5 py-2 font-normal">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cellRows.map((row) => (
                      <tr
                        key={row.key}
                        className="border-t border-black/[0.06]"
                      >
                        <td className="px-5 py-2 align-top text-black/65">
                          {row.label}
                        </td>
                        <td className="px-5 py-2 align-top text-black/85">
                          {row.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </>
        )}
      </div>
    </main>
  );
}

function decideError(cause: unknown) {
  if (isApiError(cause)) {
    if (cause.code === "STALE_SUBMISSION")
      return "The customer changed the data after the AI check. They must submit again.";
    if (cause.code === "NOT_IN_REVIEW")
      return "This submission was already decided.";
    return cause.message;
  }
  return "Could not record the decision. Try again.";
}
