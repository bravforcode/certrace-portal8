"use client";

export const runtime = "edge";

/* ════════════════════════════════════════════════════════════
   EVIDENCE PACK

   Two questions, one screen.

   "Which figure has no document behind it?" — the coverage list. This is what
   an exporter should be able to answer before they engage a verifier, because
   afterwards it is written up as a finding rather than fixed over coffee.

   "What depends on this document?" — the reverse lookup. Open a file and see
   every figure that rests on it. That is what makes replacing a superseded
   invoice a decision rather than a gamble.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Paperclip,
  Upload,
  Trash2,
  Link2,
  TriangleAlert,
  Check,
} from "lucide-react";
import {
  Card,
  Button,
  Eyebrow,
  Progress,
  EmptyState,
  OptionalTag,
  cn,
} from "@/components/ui";
import { Select } from "@/components/controls";
import { toast } from "@/components/toast";
import { USER, type Declaration } from "@/lib/data";
import { useDeclaration } from "@/lib/declarations-query";
import { ErrorState, LoadingState } from "@/components/query-state";
import {
  calendarYear,
  displayDate,
  type ReportingPeriod,
} from "@/lib/cbam/boundary";
import { provenanceRefs, type ActivityDataset } from "@/lib/cbam/activity";
import {
  useActivityDataset,
  useSaveActivityDataset,
  useEvidence,
  useAddEvidence,
  useRemoveEvidence,
} from "@/lib/cbam/cbam-query";
import { useT } from "@/lib/i18n";
import {
  categoryForKey,
  coverage,
  dependents,
  hashBytes,
  uid,
  EVIDENCE_CATEGORIES,
  EVIDENCE_CATEGORY_LABEL,
  INLINE_BYTES_LIMIT,
  type EvidenceCategory,
  type EvidenceFile,
} from "@/lib/cbam/evidence";

function periodFor(decl: Declaration): ReportingPeriod {
  if (decl.periodStart && decl.periodEnd)
    return {
      start: decl.periodStart,
      end: decl.periodEnd,
      type: "calendar_year",
    };
  return calendarYear(
    Number(/(20\d\d)/.exec(decl.period)?.[1] ?? new Date().getFullYear()),
  );
}

const fmtSize = (b: number) =>
  b > 1_000_000
    ? `${(b / 1_000_000).toFixed(1)} MB`
    : `${Math.max(1, Math.round(b / 1000))} KB`;

export default function EvidencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useT();
  const { id } = React.use(params);
  const router = useRouter();
  const { data: decl, isError, refetch } = useDeclaration(id);
  /* The pieces that live NEXT TO the declaration (localStorage stores,
     drafts, snapshots) load once the query has it. */
  const { data: dataset } = useActivityDataset(
    id,
    decl ? periodFor(decl) : undefined,
    USER.name,
  );
  const { data: files } = useEvidence(id);
  const saveDataset = useSaveActivityDataset();
  const addEvidence = useAddEvidence();
  const removeEvidence = useRemoveEvidence();
  const [openFileId, setOpenFileId] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploadCategory, setUploadCategory] =
    React.useState<EvidenceCategory>("utility_bill");

  React.useEffect(() => {
    if (decl === null) router.replace("/declarations");
  }, [decl, router]);

  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!decl || !dataset || !files) return <LoadingState />;

  /* The coverage rows ARE the dataset's provenance records — one list, so a
     new kind of input can never quietly escape the evidence requirement. */
  const rows = provenanceRefs(dataset).map((r) => ({
    key: r.key,
    label: r.label,
    category: categoryForKey(r.key),
    required: r.critical,
    evidenceFileId: r.provenance.evidenceFileId ?? null,
  }));
  const cov = coverage(rows, files);

  const attach = (key: string, fileId: string | null) => {
    const next: ActivityDataset = structuredClone(dataset);
    const [section, entryId, slot] = key.split(":");
    const set = (p: { evidenceFileId?: string }) => {
      if (fileId) p.evidenceFileId = fileId;
      else delete p.evidenceFileId;
    };
    if (section === "production") set(next.annualProductionProvenance);
    if (section === "fuel") {
      const f = next.fuels.find((x) => x.id === entryId);
      if (f)
        set(
          slot === "ef"
            ? f.efProvenance
            : slot === "ncv" && f.ncvProvenance
              ? f.ncvProvenance
              : f.provenance,
        );
    }
    if (section === "electricity") {
      const e = next.electricity.find((x) => x.id === entryId);
      if (e) set(e.provenance);
    }
    if (section === "process") {
      const p = next.processEmissions.find((x) => x.id === entryId);
      if (p) set(p.provenance);
    }
    saveDataset.mutate({ dataset: next });
  };

  const onUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    for (const f of Array.from(fileList)) {
      const buffer = await f.arrayBuffer();
      const hash = await hashBytes(buffer);
      const dataUrl =
        f.size <= INLINE_BYTES_LIMIT
          ? await new Promise<string | undefined>((resolve) => {
              const reader = new FileReader();
              reader.onload = () =>
                resolve(
                  typeof reader.result === "string" ? reader.result : undefined,
                );
              reader.onerror = () => resolve(undefined);
              reader.readAsDataURL(f);
            })
          : undefined;
      const entry: EvidenceFile = {
        id: uid(),
        declarationId: decl.id,
        name: f.name,
        type: uploadCategory,
        mime: f.type || undefined,
        sizeBytes: f.size,
        uploadedBy: USER.name,
        uploadedAt: new Date().toISOString(),
        periodCovered: { start: dataset.period.start, end: dataset.period.end },
        hash,
        dataUrl,
      };
      try {
        await addEvidence.mutateAsync(entry);
      } catch (cause) {
        toast({
          message: "Could not save document",
          detail: cause instanceof Error ? cause.message : String(cause),
          tone: "err",
        });
        return;
      }
      if (!dataUrl) {
        toast({
          message: `${f.name} registered`,
          detail: `Over ${fmtSize(INLINE_BYTES_LIMIT)} — name, size and hash are held, the file itself is transferred out of band.`,
          tone: "info",
        });
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const grouped = EVIDENCE_CATEGORIES.map((cat) => ({
    cat,
    items: files.filter((f) => f.type === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-7">
      <div className="space-y-4">
        <Link
          href={`/declarations/${decl.id}`}
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-black/40 hover:text-black"
        >
          <ArrowLeft size={13} strokeWidth={1.5} /> {decl.title ?? decl.name}
        </Link>
        <div className="flex flex-col gap-4 border-b border-black/[0.06] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>{t("Evidence pack")}</Eyebrow>
            <h1 className="mt-2 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111] md:text-4xl">
              {t("One number, one document")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-black/45">
              {t(
                "A verifier does not read a folder — they pick a figure and ask to see what proves it. Attach each document to the input it supports, and the answer takes seconds instead of an afternoon.",
              )}
            </p>
          </div>
          <div className="flex flex-none flex-col items-start gap-2 md:items-end">
            <div className="w-[190px]">
              <Select
                value={uploadCategory}
                onChange={(v) => setUploadCategory(v as EvidenceCategory)}
                options={EVIDENCE_CATEGORIES.map((c) => ({
                  value: c,
                  label: EVIDENCE_CATEGORY_LABEL[c],
                }))}
                ariaLabel={t("Evidence category")}
              />
            </div>
            <Button size="sm" onClick={() => inputRef.current?.click()}>
              <Upload size={13} strokeWidth={1.5} /> {t("Upload evidence")}
            </Button>
            <input
              ref={inputRef}
              type="file"
              multiple
              hidden
              onChange={(e) => onUpload(e.target.files)}
            />
          </div>
        </div>
      </div>

      {/* Coverage */}
      <Card highlight className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>{t("Coverage")}</Eyebrow>
            <div className="mt-2 font-[family-name:var(--font-plex)] text-3xl font-light text-[#111]">
              {Math.round(cov.pct * 100)}%
            </div>
            <p className="mt-1 text-[12.5px] text-black/45">
              {cov.requiredCovered} of {cov.requiredTotal} inputs a filed figure
              depends on have a document attached.
            </p>
          </div>
          {cov.missing.length > 0 && (
            <p className="flex max-w-md items-start gap-1.5 text-[12.5px] leading-relaxed text-[#b45309]">
              <TriangleAlert
                size={13}
                strokeWidth={1.8}
                className="mt-[2px] flex-none"
              />
              {cov.missing.length} input{cov.missing.length === 1 ? "" : "s"}{" "}
              still unevidenced. Traceability is one of the seven things a
              verifier tests, and it is the cheapest one to pass before they
              arrive.
            </p>
          )}
        </div>
        <div className="mt-4">
          <Progress
            value={cov.pct * 100}
            tone={cov.pct >= 1 ? "ok" : cov.pct >= 0.6 ? "warn" : "err"}
          />
        </div>
      </Card>

      {/* Per-input attachment */}
      <Card className="p-6">
        <h2 className="text-[15px] text-black/80">
          {t("Inputs and their evidence")}
        </h2>
        <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-black/45">
          {t(
            "Every figure the calculation depends on, with the document behind it. Attach from the files you have uploaded.",
          )}
        </p>

        {cov.rows.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title={t("No inputs yet")}
              body={t(
                "Enter activity data first — the evidence list is derived from it, so there is nothing to attach documents to until then.",
              )}
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    router.push(`/declarations/${decl.id}/activity`)
                  }
                >
                  {t("Go to activity data")}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-5 space-y-2">
            {cov.rows.map((r) => {
              const attached =
                r.evidenceFileId &&
                files.some((f) => f.id === r.evidenceFileId);
              return (
                <div
                  key={r.key}
                  className={cn(
                    "flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between",
                    r.required && !attached
                      ? "border-[#d97706]/30 bg-[#fffbeb]"
                      : "border-black/[0.07]",
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[13px] text-black/75">
                      {attached ? (
                        <Check
                          size={13}
                          strokeWidth={2}
                          className="flex-none text-[#047857]"
                        />
                      ) : (
                        <Paperclip
                          size={13}
                          strokeWidth={1.5}
                          className="flex-none text-black/30"
                        />
                      )}
                      {r.label}
                      {!r.required && <OptionalTag />}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-black/30">
                      {t(EVIDENCE_CATEGORY_LABEL[r.category])}
                    </div>
                  </div>
                  <div className="w-full flex-none sm:w-[280px]">
                    <Select
                      value={r.evidenceFileId ?? ""}
                      onChange={(v) => attach(r.key, v || null)}
                      placeholder={t("Attach a document…")}
                      options={[
                        { value: "", label: "— none —" },
                        ...files.map((f) => ({ value: f.id, label: f.name })),
                      ]}
                      ariaLabel={`Evidence for ${r.label}`}
                      searchable={files.length > 8}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* The pack itself, grouped */}
      <Card className="p-6">
        <h2 className="text-[15px] text-black/80">{t("The pack")}</h2>
        <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-black/45">
          {t(
            "Grouped the way a verifier files them. Open a document to see every figure that depends on it.",
          )}
        </p>

        {files.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title={t("No documents yet")}
              body={t(
                "Utility bills, fuel invoices, meter logs, production reports, supplier attestations.",
              )}
            />
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            {grouped.map(({ cat, items }) => (
              <div key={cat}>
                <Eyebrow>{t(EVIDENCE_CATEGORY_LABEL[cat])}</Eyebrow>
                <div className="mt-2 space-y-2">
                  {items.map((f) => {
                    const deps = dependents(cov.rows, f.id);
                    return (
                      <div
                        key={f.id}
                        className="rounded-xl border border-black/[0.07] p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <button
                            onClick={() =>
                              setOpenFileId(openFileId === f.id ? null : f.id)
                            }
                            className="min-w-0 text-left"
                          >
                            <div className="truncate text-[13px] text-black/75">
                              {f.name}
                            </div>
                            <div className="mt-0.5 font-mono text-[10px] text-black/30">
                              {fmtSize(f.sizeBytes)} ·{" "}
                              {displayDate(f.uploadedAt)} · {f.uploadedBy}
                              {f.hash && ` · sha256 ${f.hash.slice(0, 12)}…`}
                            </div>
                          </button>
                          <div className="flex flex-none items-center gap-3">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 text-[11px]",
                                deps.length > 0
                                  ? "text-black/50"
                                  : "text-[#b45309]",
                              )}
                            >
                              <Link2 size={11} strokeWidth={1.5} />
                              {deps.length} figure{deps.length === 1 ? "" : "s"}
                            </span>
                            {f.dataUrl && (
                              <a
                                href={f.dataUrl}
                                download={f.name}
                                className="text-[11px] text-black/45 hover:text-black"
                              >
                                {t("Download")}
                              </a>
                            )}
                            <button
                              aria-label={t("Remove document")}
                              onClick={() => {
                                removeEvidence.mutate({
                                  declarationId: decl.id,
                                  id: f.id,
                                });
                                toast({
                                  message: `${f.name} removed`,
                                  detail:
                                    deps.length > 0
                                      ? `${deps.length} figure${deps.length === 1 ? "" : "s"} now unevidenced.`
                                      : undefined,
                                  tone: deps.length > 0 ? "warn" : "ok",
                                });
                              }}
                              className="text-black/25 hover:text-[#dc2626]"
                            >
                              <Trash2 size={14} strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>

                        {openFileId === f.id && (
                          <div className="mt-3 border-t border-black/[0.06] pt-3">
                            <Eyebrow>
                              {t("Figures that depend on this document")}
                            </Eyebrow>
                            {deps.length === 0 ? (
                              <p className="mt-2 text-[12.5px] text-black/45">
                                {t(
                                  "Nothing points at this file yet. An unattached document is storage, not evidence — attach it above.",
                                )}
                              </p>
                            ) : (
                              <ul className="mt-2 space-y-1">
                                {deps.map((d) => (
                                  <li
                                    key={d.key}
                                    className="text-[12.5px] text-black/60"
                                  >
                                    · {d.label}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {f.periodCovered && (
                              <p className="mt-2 font-mono text-[10px] text-black/30">
                                covers {displayDate(f.periodCovered.start)} —{" "}
                                {displayDate(f.periodCovered.end)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
