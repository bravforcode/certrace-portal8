"use client";
import * as React from "react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { Button, inputClass } from "@/components/ui";
import { PdfSourcePreview } from "./pdf-source-preview";
import { request } from "@/lib/api";
import { flushAccount, refreshReportRecords } from "@/lib/account-storage";
import { invalidateReportViews } from "@/lib/persist-report-change";
import {
  startAutofillFromDocument,
  type AutofillRunView,
  type Proposal,
} from "@/lib/report-autofill";

const display = (v: unknown) =>
  v === null || v === undefined || v === ""
    ? "Empty"
    : Array.isArray(v)
      ? v.join(", ")
      : String(v);
export function ReportAutofill({
  workspaceId,
  periodStart,
  periodEnd,
  onApplied,
  initialFile,
  fixedFile = false,
  reportMonth,
  autoStart = false,
  showRecent = true,
  onReadComplete,
}: {
  workspaceId: string;
  periodStart: string;
  periodEnd: string;
  onApplied: () => void;
  initialFile?: File;
  fixedFile?: boolean;
  reportMonth?: string;
  autoStart?: boolean;
  showRecent?: boolean;
  onReadComplete?: () => void;
}) {
  const queryClient = useQueryClient();
  const [cap, setCap] = React.useState<{
    available: boolean;
    textAvailable: boolean;
    allowed: boolean;
  } | null>(null);
  const [file, setFile] = React.useState<File | null>(initialFile ?? null);
  const [month, setMonth] = React.useState("");
  const [run, setRun] = React.useState<AutofillRunView | null>(null);
  const [recent, setRecent] = React.useState<AutofillRunView[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [busy, setBusy] = React.useState("");
  const [error, setError] = React.useState("");
  const [preview, setPreview] = React.useState("");
  const [source, setSource] = React.useState<Blob | null>(null);
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const textFile = Boolean(
    file &&
      /\.(docx|pptx|txt|log|csv|tsv|md|markdown|json|xlsx)$/i.test(file.name),
  );
  const canRead = Boolean(
    cap && (textFile ? cap.textAvailable : cap.available),
  );
  const active = React.useRef(true);
  const autoStarted = React.useRef(false);
  const onReadCompleteRef = React.useRef(onReadComplete);
  onReadCompleteRef.current = onReadComplete;
  React.useEffect(() => setFile(initialFile ?? null), [initialFile]);
  React.useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  React.useEffect(() => {
    let cancelled = false;
    Promise.all([
      request<typeof cap>("/api/v1/evidence/autofill/capabilities"),
      request<AutofillRunView[]>(
        `/api/v1/evidence/autofill/runs?workspaceId=${encodeURIComponent(workspaceId)}`,
      ),
    ])
      .then(([c, r]) => {
        if (!cancelled) {
          setCap(c);
          setRecent(r);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message);
          onReadCompleteRef.current?.();
        }
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);
  React.useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  React.useEffect(() => {
    if (run?.status !== "running") return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const next = await request<AutofillRunView>(
          `/api/v1/evidence/autofill/runs/${run.id}`,
        );
        if (cancelled) return;
        setRun(next);
        if (next.status === "running") timer = setTimeout(poll, 2000);
        else setBusy("");
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message);
          setBusy("");
          onReadCompleteRef.current?.();
        }
      }
    };
    timer = setTimeout(poll, 1500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [run?.id, run?.status]);
  const begin = React.useCallback(async () => {
    if (!file) return;
    setError("");
    setSelected(new Set());
    setRun(null);
    setBusy("Reading document…");
    try {
      await flushAccount();
      setSource(file);
      setPreview(
        file.type === "application/pdf" || file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : "",
      );
      setPage(1);
      setBusy("Reading document and mapping report inputs…");
      const next = await startAutofillFromDocument(
        workspaceId,
        file,
        reportMonth ?? month,
      );
      setRun(next);
      if (next.status !== "running") setBusy("");
    } catch (e) {
      setError((e as Error).message);
      setBusy("");
      onReadCompleteRef.current?.();
    }
  }, [file, workspaceId, reportMonth, month]);
  React.useEffect(() => {
    if (!autoStart || autoStarted.current || !file || !canRead || !cap?.allowed)
      return;
    autoStarted.current = true;
    void begin();
  }, [autoStart, file, canRead, cap?.allowed, begin]);
  React.useEffect(() => {
    if (run?.status === "review" || run?.status === "failed")
      onReadCompleteRef.current?.();
  }, [run?.status]);
  React.useEffect(() => {
    if (cap && (!canRead || !cap.allowed)) onReadCompleteRef.current?.();
  }, [cap, canRead]);
  const openRecent = async (r: AutofillRunView) => {
    setError("");
    setBusy("Opening saved reading…");
    setSelected(new Set());
    try {
      const [next, blob] = await Promise.all([
        request<AutofillRunView>(`/api/v1/evidence/autofill/runs/${r.id}`),
        r.sourceStored === false
          ? Promise.resolve(null)
          : request<Blob>(
              `/api/v1/account/files/${encodeURIComponent(r.fileId)}`,
              {
                responseType: "blob",
              },
            ),
      ]);
      setRun(next);
      setSource(blob);
      setPreview(
        blob &&
          (blob.type === "application/pdf" || blob.type.startsWith("image/"))
          ? URL.createObjectURL(blob)
          : "",
      );
      setPage(1);
      setBusy(next.status === "running" ? "Reading document…" : "");
    } catch (e) {
      setError((e as Error).message);
      setBusy("");
    }
  };
  const apply = async () => {
    if (!run) return;
    setError("");
    setBusy("Applying reviewed values…");
    try {
      await flushAccount();
      await request(`/api/v1/evidence/autofill/runs/${run.id}/apply`, {
        method: "POST",
        body: { selections: [...selected].map((id) => ({ id })) },
        timeoutMs: 60_000,
      });
      setRun({ ...run, status: "applied" });
      setSelected(new Set());
      await refreshReportRecords();
      await invalidateReportViews(queryClient);
      onApplied();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  };
  const toggle = (p: Proposal) =>
    setSelected((old) => {
      const next = new Set(old);
      if (next.has(p.id)) next.delete(p.id);
      else {
        for (const q of run?.result.proposals ?? [])
          if (q.target.id === p.target.id) next.delete(q.id);
        next.add(p.id);
      }
      return next;
    });
  const proposals = run?.result.proposals ?? [];
  return (
    <section
      className="mt-4 space-y-4 rounded-2xl border border-black/10 bg-white p-4 sm:p-5"
      data-testid="report-autofill"
    >
      <div>
        <h2 className="text-lg font-medium">
          Fill report inputs from a document
        </h2>
        <p className="mt-1 text-sm text-black/60">
          Review proposed values for company details, monitoring, monthly
          readings, suppliers and report tables. Values are saved only when you
          apply them.
        </p>
      </div>
      {cap && !canRead && (
        <p role="status" className="text-sm text-[#b45309]">
          {textFile
            ? "Smart upload is unavailable right now. Please try again later."
            : "Document reading is unavailable right now. Please try again later."}
        </p>
      )}
      {cap && !cap.allowed && (
        <p role="status" className="text-sm text-[#b45309]">
          AI reading requires an active trial, Standard or Enterprise plan.
        </p>
      )}
      <fieldset disabled={!!busy} className="grid gap-3 sm:grid-cols-2">
        {!fixedFile && (
          <label className="text-sm">
            Document
            <input
              aria-label="Document for report autofill"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.docx,.pptx,.txt,.log,.csv,.tsv,.md,.markdown,.json,.xlsx"
              className={`${inputClass} mt-1`}
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setRun(null);
                setSelected(new Set());
              }}
            />
          </label>
        )}
        {reportMonth === undefined && (
          <label className="text-sm">
            Reporting month (required for monthly values)
            <input
              aria-label="Autofill reporting month"
              type="month"
              min={periodStart.slice(0, 7)}
              max={periodEnd.slice(0, 7)}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className={`${inputClass} mt-1`}
            />
            <span className="mt-1 block text-xs text-black/50">
              If left blank, Cera uses a single clear month found in the
              document or filename. Choose it here when the month is missing or
              ambiguous.
            </span>
          </label>
        )}
      </fieldset>
      {file && <p className="text-xs text-black/60">Selected: {file.name}</p>}
      <p className="text-xs text-black/50">
        Selectable PDF text is read directly; scanned PDF pages and images use
        text recognition. Up to 20 PDF pages are read. Text-bearing Office files
        and spreadsheets are read directly. Cera then proposes report fields.
        Check each quote before applying it. Smart upload does not keep the
        original file; attach it in the report’s Documents area if it needs to
        be retained as evidence.
      </p>
      <Button
        onClick={begin}
        disabled={!file || !!busy || !canRead || !cap?.allowed}
      >
        Read and propose values
      </Button>
      {busy && (
        <p role="status" aria-live="polite" className="text-sm">
          {busy}
        </p>
      )}
      {(error || run?.error) && (
        <p
          role="alert"
          className="rounded-xl border border-[#dc2626]/20 bg-[#fef2f2] p-3 text-sm text-[#dc2626]"
        >
          {error || run?.error}
        </p>
      )}
      {run?.status === "applied" && (
        <p
          role="status"
          className="rounded-xl border border-[#047857]/20 bg-[#ecfdf5] p-3 text-sm text-[#047857]"
        >
          Selected values applied. Review the report’s remaining findings before
          submission.
        </p>
      )}
      {run?.status === "review" && (
        <>
          {run.monthInferred && run.month && (
            <p role="status" className="text-sm text-black/70">
              Reporting month detected: {run.month}. Check it against the
              document before applying monthly values.
            </p>
          )}
          {run.sourceStored === false && !source && (
            <p className="text-xs text-black/60">
              The original file is no longer available. Review the extracted
              quotes before applying values.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <strong className="text-sm">
              {proposals.length} proposals · {selected.size} selected
            </strong>
            <input
              aria-label="Search proposed report fields"
              placeholder="Find a report field…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputClass} max-w-xs`}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {preview && source?.type === "application/pdf" && (
              <PdfSourcePreview
                file={source}
                url={preview}
                page={page}
                onPage={setPage}
              />
            )}
            {preview && source?.type.startsWith("image/") && (
              <Image
                src={preview}
                alt={`Source document ${run.filename}`}
                width={800}
                height={800}
                unoptimized
                className="max-h-[650px] w-full object-contain"
              />
            )}
            <div className="max-h-[650px] space-y-3 overflow-auto">
              {proposals
                .filter((p) =>
                  `${p.target.label} ${p.target.context}`
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                )
                .map((p) => (
                  <article key={p.id} className="rounded-lg border p-3">
                    <label className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        aria-label={`Apply ${p.target.label}`}
                        checked={selected.has(p.id)}
                        disabled={p.blocked || !!busy}
                        onChange={() => toggle(p)}
                        className="mt-1"
                      />
                      <span className="text-sm font-medium">
                        {p.target.label}
                      </span>
                    </label>
                    <p className="mt-1 break-all text-xs text-black/50">
                      {p.target.context}
                    </p>
                    <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-black/50">Current</dt>
                        <dd className="break-words">
                          {display(p.target.current)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-black/50">Proposed</dt>
                        <dd className="break-words font-medium">
                          {display(p.value)} {p.target.unit}
                        </dd>
                      </div>
                    </dl>
                    {preview && (
                      <button
                        type="button"
                        className="mt-2 text-xs underline"
                        onClick={() => setPage(p.page)}
                      >
                        View page {p.page}
                      </button>
                    )}
                    <blockquote className="mt-1 whitespace-pre-wrap border-l-2 pl-2 text-xs text-black/65">
                      {p.quote}
                    </blockquote>
                    {p.sourceUnit && (
                      <p className="mt-1 text-xs">
                        Source: {p.original} {p.sourceUnit}
                      </p>
                    )}
                    {p.explanation && (
                      <p className="mt-1 text-xs text-black/65">
                        {p.explanation}
                      </p>
                    )}
                    {p.warnings.map((w, i) => (
                      <p
                        key={i}
                        className={`mt-1 text-xs ${p.blocked ? "text-[#dc2626]" : "text-[#b45309]"}`}
                      >
                        {w}
                      </p>
                    ))}
                  </article>
                ))}
              {!proposals.length && (
                <p className="text-sm">
                  No supported values were found. Try the relevant pages or
                  enter values in the report.
                </p>
              )}
            </div>
          </div>
          {!!run.result.unresolved.length && (
            <details open>
              <summary className="text-sm font-medium">
                Needs your attention
              </summary>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {run.result.unresolved.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </details>
          )}
          {!!run.result.needsVision.length && !busy && (
            <p className="text-sm text-[#b45309]">
              Check pages {run.result.needsVision.join(", ")}; their layout
              could not be resolved.
            </p>
          )}
          <p className="text-xs text-black/60">
            Select only values you have checked. Replacements and shared company
            details may affect other report views. New rows may require
            additional fields before they can be saved.
          </p>
          <Button onClick={apply} disabled={!selected.size || !!busy}>
            Apply {selected.size} reviewed values
          </Button>
        </>
      )}
      {showRecent && !!recent.length && (
        <details>
          <summary className="cursor-pointer text-sm">
            Previous readings
          </summary>
          <div className="mt-2 flex flex-wrap gap-2">
            {recent.map((r) => (
              <button
                key={r.id}
                type="button"
                disabled={!!busy}
                onClick={() => void openRecent(r)}
                className="rounded-lg border px-3 py-2 text-xs"
              >
                {r.filename} · {r.status}
              </button>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
