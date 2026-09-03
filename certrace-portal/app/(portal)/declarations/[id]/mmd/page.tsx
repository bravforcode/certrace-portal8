"use client";

export const runtime = "edge";

/* ════════════════════════════════════════════════════════════
   MONITORING METHODOLOGY DOCUMENTATION

   The document a verifier asks for before they look at a number. Not a form:
   every section is generated from what the portal already holds, and the
   exporter reads, corrects and confirms. If a section here asks for something
   the system could have derived, that is a defect.

   Two things only a human can supply, and they are the only real inputs on
   this screen: the boundary (which production steps are in scope) and the
   measurement detail (which instrument, how often, last calibrated when).
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Download, Check, TriangleAlert, History, ChevronRight } from "lucide-react";
import { Card, Button, Eyebrow, inputClass, cn, useSaveState, SaveButton } from "@/components/ui";
import { DatePicker, Select } from "@/components/controls";
import { toast } from "@/components/toast";
import { USER, ORG, type Declaration } from "@/lib/data";
import { useDeclaration } from "@/lib/declarations-query";
import { ErrorState, LoadingState } from "@/components/query-state";
import { getOrgIdentity } from "@/lib/org";
import { getRecord } from "@/lib/supplier-records";
import { countryName } from "@/lib/config";
import { PROCESS_STEPS, PROCESS_STEP_LABEL, PROCESS_STEP_HINT, calendarYear, displayDate, type Boundary, type ProcessStep, type ReportingPeriod } from "@/lib/cbam/boundary";
import { setStep } from "@/lib/cbam/boundary-store";
import {
  useActivityDataset,
  useBoundary,
  useDataGaps,
  useFinaliseMmdVersion,
  useMmdDraft,
  useMmdVersions,
  useSaveBoundary,
  useSaveMmdDraft,
} from "@/lib/cbam/cbam-query";
import {
  generateMmd,
  mmdIssues,
  diffVersions,
  latestVersion,
  QUALITY_ASSURANCE_OPTIONS,
  QUALITY_ASSURANCE_LABEL,
  MMD_SECTION_TITLE,
  MMD_SECTION_BLURB,
  type MmdDraft,
  type MmdChange,
  type QualityAssurance,
} from "@/lib/cbam/mmd";
import { downloadMmdPdf } from "@/lib/cbam/mmd-pdf";
import { useT } from "@/lib/i18n";

function periodFor(decl: Declaration): ReportingPeriod {
  if (decl.periodStart && decl.periodEnd) return { start: decl.periodStart, end: decl.periodEnd, type: "calendar_year" };
  return calendarYear(Number(/(20\d\d)/.exec(decl.period)?.[1] ?? new Date().getFullYear()));
}

export default function MmdPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useT();
  const { id } = React.use(params);
  const router = useRouter();
  const { data: decl, isError, refetch } = useDeclaration(id);
  const period = React.useMemo(() => (decl ? periodFor(decl) : undefined), [decl]);
  /* The pieces that live NEXT TO the declaration (localStorage stores,
     drafts, snapshots) come from the cbam query cache — any mutation
     invalidates the declaration's subtree and everything below refetches. */
  const { data: savedDraft } = useMmdDraft(id);
  const { data: savedBoundary } = useBoundary(id);
  const { data: versions } = useMmdVersions(id);
  const { data: dataset } = useActivityDataset(id, period, USER.name);
  const { data: gaps } = useDataGaps(id);
  const saveMmdDraft = useSaveMmdDraft();
  const saveBoundaryMutation = useSaveBoundary();
  const finaliseMmd = useFinaliseMmdVersion();
  /* Edit buffers for the two genuinely human sections — seeded from the
     query cache, kept local so typing stays synchronous, autosaved through
     the mutations above. */
  const [draft, setDraft] = React.useState<MmdDraft | null>(null);
  const [boundary, setBoundary] = React.useState<Boundary | null>(null);
  const save = useSaveState();

  /* Seed the buffers ONCE per declaration. updateDraft/updateBoundary already
     keep local state in step with each write, so reseeding on every refetch
     buys nothing — and since each mutation invalidates the whole ["cbam", id]
     subtree, an unguarded reseed would hand back the just-written value and
     clobber any keystroke typed in the in-flight window. The ref lets a real
     declaration change (navigation) reseed. */
  const seededFor = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!savedDraft || !savedBoundary || seededFor.current === id) return;
    seededFor.current = id;
    setDraft(savedDraft);
    setBoundary(savedBoundary);
  }, [savedDraft, savedBoundary, id]);

  React.useEffect(() => {
    if (decl === null) router.replace("/declarations");
  }, [decl, router]);

  const content = React.useMemo(() => {
    if (!decl || !draft || !boundary || !period || !dataset || !gaps) return null;
    const org = getOrgIdentity();
    /* The exporter's own installation details already exist — they answered
       them once as a self-supply record. Asking again here would be exactly
       the defect the build spec's closing note describes. */
    const own = getRecord(org.name);
    const inst = own?.installation ?? {};
    return generateMmd({
      declarationId: decl.id,
      installation: {
        installationName: inst["inst-name"] || org.name,
        operator: org.name,
        country: countryName(inst["inst-country"] || org.origin),
        address: inst["inst-address"] ?? "",
        unlocode: inst["inst-unlocode"] ?? "",
        coordinates: inst["inst-coords"] ?? "",
      },
      boundary,
      period,
      dataset,
      gaps,
      draft: { qa: draft.qa, measurement: draft.measurement, overrides: draft.overrides },
    });
  }, [decl, draft, boundary, period, dataset, gaps]);

  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!decl || !draft || !boundary || !versions || !content) return <LoadingState />;

  const issues = mmdIssues(content);
  /* Two different diffs, and conflating them is what made this screen say
     "nothing has changed" the instant a version was finalised.

     RELEASED — the change list between the last two finalised versions. This
     is the one a verifier reads: it answers "is the method the same as last
     year", and it does not move when someone edits a draft.

     PENDING — what has changed since the latest version but has not been
     finalised. That is the exporter's own working state, and it is what the
     next version will record. */
  const previous = versions.length ? versions[versions.length - 1] : null;
  const priorToPrevious = versions.length > 1 ? versions[versions.length - 2] : null;
  const releasedChanges = priorToPrevious && previous ? diffVersions(priorToPrevious.content, previous.content) : [];
  const pendingChanges = previous ? diffVersions(previous.content, content) : [];
  /* The PDF carries the released change list when there is one — the document
     a verifier receives should describe finalised versions, not a draft. */
  const changes = priorToPrevious ? releasedChanges : pendingChanges;

  const updateDraft = (next: MmdDraft) => {
    setDraft(next);
    saveMmdDraft.mutate(next);
  };

  const updateBoundary = (step: ProcessStep, bucket: "included" | "excluded" | "undecided") => {
    const next = setStep(boundary, step, bucket);
    setBoundary(next);
    saveBoundaryMutation.mutate({ boundary: next, updatedBy: USER.name });
  };

  const updateBoundaryDescription = (description: string) => {
    const next = { ...boundary, description };
    setBoundary(next);
    saveBoundaryMutation.mutate({ boundary: next, updatedBy: USER.name });
  };

  const finalise = () => {
    save.run(() => {
      finaliseMmd.mutate(
        { declarationId: decl.id, content, author: USER.name },
        {
          onSuccess: (v) =>
            toast({
              message: `MMD version ${v.n} finalised`,
              detail: previous
                ? `${pendingChanges.length} change${pendingChanges.length === 1 ? "" : "s"} recorded against version ${previous.n}.`
                : "First version — this becomes next year's baseline.",
              tone: "ok",
            }),
        },
      );
    });
  };

  const exportPdf = async () => {
    await downloadMmdPdf(
      {
        content,
        declarationName: decl.title ?? decl.name,
        version: latestVersion(decl.id),
        changes,
        previousVersionLabel: priorToPrevious ? `version ${priorToPrevious.n}` : null,
        generatedFor: ORG.name,
      },
      `mmd-${decl.id}.pdf`,
    );
    toast({ message: "MMD exported", detail: "Send it to the verifier before the dossier — it is what they read first.", tone: "ok" });
  };

  return (
    <div className="space-y-7">
      <div className="space-y-4">
        <Link href={`/declarations/${decl.id}`} className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-black/40 hover:text-black">
          <ArrowLeft size={13} strokeWidth={1.5} /> {decl.title ?? decl.name}
        </Link>
        <div className="flex flex-col gap-4 border-b border-black/[0.06] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>{t("Monitoring methodology")}</Eyebrow>
            <h1 className="mt-2 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111] md:text-4xl">
              {t("How you know your numbers")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-black/45">
              {t("This is the first thing a verifier asks for — before any figure is tested. Everything below is generated from what you have already entered; read it, correct what is wrong, and finalise a version.")}
            </p>
          </div>
          <div className="flex flex-none flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={exportPdf}>
              <Download size={13} strokeWidth={1.5} /> {t("Export PDF")}
            </Button>
            <SaveButton state={save.state} onClick={finalise} idleLabel={previous ? `Finalise version ${previous.n + 1}` : "Finalise version 1"} savedLabel={t("Finalised")} />
          </div>
        </div>
      </div>

      {/* What a verifier would send back */}
      {issues.length > 0 && (
        <Card warm className="border-[#d97706]/25 p-5">
          <div className="flex items-start gap-3">
            <TriangleAlert size={15} strokeWidth={1.8} className="mt-0.5 flex-none text-[#b45309]" />
            <div className="min-w-0">
              <p className="text-[13px] text-black/80">{issues.length} thing{issues.length === 1 ? "" : "s"} a verifier would ask about</p>
              <ul className="mt-2 space-y-1.5">
                {issues.map((iss, i) => (
                  <li key={i} className="text-[12.5px] leading-relaxed text-black/55">
                    <span className="font-mono text-[10px] text-black/30">{MMD_SECTION_TITLE[iss.section].split(" · ")[0]}</span> · {iss.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Version history + diff — the consistency test */}
      {versions.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <History size={14} strokeWidth={1.5} className="text-black/40" />
            <span className="text-[13px] text-black/75">{t("Version history")}</span>
          </div>
          <ul className="mt-3 space-y-1.5">
            {versions.map((v) => (
              <li key={v.id} className="flex flex-wrap items-baseline gap-x-3 text-[12.5px] text-black/55">
                <span className="font-mono text-[11px] text-black/70">v{v.n}</span>
                <span>{displayDate(new Date(v.finalisedAt).toISOString())}</span>
                <span className="text-black/35">{v.author}</span>
              </li>
            ))}
          </ul>
          {priorToPrevious && previous && (
            <div className="mt-4 border-t border-black/[0.06] pt-4">
              <Eyebrow>
                Version {priorToPrevious.n} → {previous.n}
              </Eyebrow>
              {releasedChanges.length === 0 ? (
                <p className="mt-2 text-[12.5px] text-black/45">
                  {t("The method is unchanged between these versions. Same method year over year is exactly what the consistency assertion is looking for.")}
                </p>
              ) : (
                <ChangeList changes={releasedChanges} />
              )}
            </div>
          )}

          {previous && (
            <div className="mt-4 border-t border-black/[0.06] pt-4">
              <Eyebrow>{pendingChanges.length > 0 ? `Not yet finalised — ${pendingChanges.length} change${pendingChanges.length === 1 ? "" : "s"} since version ${previous.n}` : `Matches version ${previous.n}`}</Eyebrow>
              {pendingChanges.length === 0 ? (
                <p className="mt-2 text-[12.5px] text-black/45">
                  Everything on this screen is already in version {previous.n}. Nothing to finalise.
                </p>
              ) : (
                <>
                  <ChangeList changes={pendingChanges} />
                  <p className="mt-2 text-[11.5px] leading-relaxed text-black/40">
                    These are edits nobody has signed off. Finalise version {previous.n + 1} to put them on the record.
                  </p>
                </>
              )}
            </div>
          )}
        </Card>
      )}

      {/* 1 · Identity */}
      <Section n="identity">
        <Rows
          rows={[
            ["Installation", content.identity.installationName],
            ["Operator", content.identity.operator],
            ["Country", content.identity.country],
            ["UN/LOCODE", content.identity.unlocode],
            ["Coordinates", content.identity.coordinates],
          ]}
        />
      </Section>

      {/* 2 · Boundary — the one genuinely human section */}
      <Section n="boundary">
        <label className="block">
          <Lbl>{t("Boundary description — the production process, not the site")}</Lbl>
          <textarea
            className={cn(inputClass, "min-h-[84px] resize-y")}
            value={boundary.description}
            placeholder={t("e.g. scrap-fed EAF steelmaking from scrap receipt through continuous casting and hot rolling; the on-site fabrication shop serving the domestic market is outside the boundary")}
            onChange={(e) => updateBoundaryDescription(e.target.value)}
          />
        </label>
        <div className="mt-4 space-y-2">
          {PROCESS_STEPS.map((step) => {
            const state = boundary.included.includes(step) ? "included" : boundary.excluded.includes(step) ? "excluded" : "undecided";
            return (
              <div
                key={step}
                className={cn(
                  "flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between",
                  state === "undecided" ? "border-[#dc2626]/25 bg-[#fef2f2]" : "border-black/[0.07]",
                )}
              >
                <div className="min-w-0">
                  <div className="text-[13px] text-black/75">{t(PROCESS_STEP_LABEL[step])}</div>
                  <div className="mt-0.5 text-[11.5px] leading-relaxed text-black/40">{t(PROCESS_STEP_HINT[step])}</div>
                </div>
                <div className="flex flex-none gap-1.5">
                  {(["included", "excluded", "undecided"] as const).map((b) => (
                    <button
                      key={b}
                      onClick={() => updateBoundary(step, b)}
                      className={cn(
                        "rounded-lg border px-2.5 py-1.5 text-[11px] transition-colors",
                        state === b ? "border-black/30 bg-[#111] text-white" : "border-black/10 text-black/45 hover:border-black/25 hover:text-black",
                      )}
                    >
                      {b === "undecided" ? "not answered" : b}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 3 · Period */}
      <Section n="period">
        <Rows rows={[["Reporting period", content.period.display], ["Type", content.period.type === "calendar_year" ? "Calendar year" : "Fiscal year"]]} />
      </Section>

      {/* 4 · Parameters */}
      <Section n="parameters">
        <Table head={["Parameter", "Unit", "Source"]} rows={content.parameters.map((p) => [p.name, p.unit, p.source])} />
      </Section>

      {/* 5 · Measurement — the other genuinely human section */}
      <Section n="measurement">
        {content.measurement.length === 0 ? (
          <p className="text-[12.5px] text-black/40">{t("Enter activity data first — the parameter list is derived from it.")}</p>
        ) : (
          <div className="space-y-3">
            {content.measurement.map((m) => (
              <div key={m.key} className="rounded-xl border border-black/[0.07] p-3">
                <div className="text-[13px] text-black/75">{m.parameter}</div>
                <div className="mt-0.5 text-[11.5px] text-black/40">{m.source}</div>
                <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
                  <input
                    className={inputClass}
                    value={m.instrument}
                    placeholder={t("Instrument")}
                    onChange={(e) =>
                      updateDraft({
                        ...draft,
                        measurement: { ...draft.measurement, [m.key]: { instrument: e.target.value, frequency: m.frequency, calibrationDate: m.calibrationDate } },
                      })
                    }
                  />
                  <input
                    className={inputClass}
                    value={m.frequency}
                    placeholder={t("Frequency, e.g. monthly")}
                    onChange={(e) =>
                      updateDraft({
                        ...draft,
                        measurement: { ...draft.measurement, [m.key]: { instrument: m.instrument, frequency: e.target.value, calibrationDate: m.calibrationDate } },
                      })
                    }
                  />
                  <DatePicker
                    value={m.calibrationDate}
                    ariaLabel={`${m.key} — last calibrated`}
                    onChange={(iso) =>
                      updateDraft({
                        ...draft,
                        measurement: { ...draft.measurement, [m.key]: { instrument: m.instrument, frequency: m.frequency, calibrationDate: iso } },
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* 6 · Factors */}
      <Section n="factors">
        <Table
          head={["Factor", "Value", "Unit", "Source"]}
          rows={content.factors.map((f) => [f.parameter + (f.isAssumption ? "  ⚠ assumption" : ""), f.value, f.unit, f.source])}
        />
      </Section>

      {/* 7 · Gaps */}
      <Section n="gaps">
        <Table
          head={["Parameter", "Window", "Method", "Conservativeness", "tCO₂e"]}
          rows={content.gaps.map((g) => [g.parameter, g.window, g.method, g.justification, String(g.estimatedTCO2e)])}
        />
        <p className="mt-3 text-[12px] text-black/40">
          Maintained on the{" "}
          <Link href={`/declarations/${decl.id}/activity`} className="underline underline-offset-2 hover:text-black">
            {t("activity data")}
          </Link>{" "}
          screen.
        </p>
      </Section>

      {/* 8 · QA — exactly four options */}
      <Section n="qa">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
          <div>
            <Lbl>{t("Method")}</Lbl>
            <Select
              value={draft.qa.method}
              onChange={(v) => updateDraft({ ...draft, qa: { ...draft.qa, method: v as QualityAssurance } })}
              options={QUALITY_ASSURANCE_OPTIONS.map((q) => ({ value: q, label: QUALITY_ASSURANCE_LABEL[q] }))}
            />
          </div>
          <label className="block">
            <Lbl>{t("Note")}</Lbl>
            <input
              className={inputClass}
              value={draft.qa.note}
              placeholder={t("e.g. every figure is entered by production and checked by ESG before sign-off")}
              onChange={(e) => updateDraft({ ...draft, qa: { ...draft.qa, note: e.target.value } })}
            />
          </label>
        </div>
      </Section>

      {/* 9 · Assumptions */}
      <Section n="assumptions">
        {content.assumptions.length === 0 ? (
          <p className="flex items-center gap-2 text-[12.5px] text-black/45">
            <Check size={13} strokeWidth={1.8} className="text-[#047857]" /> {t("No inputs are declared as assumptions.")}
          </p>
        ) : (
          <Table head={["Input", "Reference", "Entered by"]} rows={content.assumptions.map((a) => [a.input, a.reference, a.enteredBy])} />
        )}
      </Section>

      {/* 10 · Diagram */}
      <Section n="diagram">
        <p className="text-[12.5px] leading-relaxed text-black/45">
          {content.diagram.fileId
            ? `Attached: ${content.diagram.fileName ?? content.diagram.fileId}`
            : "No installation diagram attached. A one-page process flow with the boundary drawn on it answers the completeness question faster than any amount of prose."}
        </p>
      </Section>

      <div className="flex justify-end pb-4">
        <SaveButton state={save.state} onClick={finalise} idleLabel={previous ? `Finalise version ${previous.n + 1}` : "Finalise version 1"} savedLabel={t("Finalised")} />
      </div>
    </div>
  );
}

function ChangeList({ changes }: { changes: MmdChange[] }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {changes.slice(0, 12).map((c, i) => (
        <li key={i} className="text-[12.5px] leading-relaxed text-black/55">
          <span className="font-mono text-[10px] text-black/30">{MMD_SECTION_TITLE[c.section].split(" · ")[0]}</span> {c.field} ·{" "}
          <span className="text-black/35 line-through">{c.before || "—"}</span> <ChevronRight size={10} className="inline" />{" "}
          <span className="text-black/70">{c.after || "—"}</span>
        </li>
      ))}
      {changes.length > 12 && <li className="text-[11.5px] text-black/35">+ {changes.length - 12} more in the exported PDF</li>}
    </ul>
  );
}

function Section({ n, children }: { n: keyof typeof MMD_SECTION_TITLE; children: React.ReactNode }) {
  const t = useT();
  return (
    <Card className="p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 flex-none place-items-center rounded-xl border border-black/10 text-black/55">
          <FileText size={15} strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] text-black/80">{t(MMD_SECTION_TITLE[n])}</h2>
          <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-black/45">{t(MMD_SECTION_BLURB[n])}</p>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </Card>
  );
}

function Lbl({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-[10px] uppercase tracking-[0.12em] text-black/40">{children}</span>;
}

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className="text-[10px] uppercase tracking-[0.12em] text-black/35">{k}</dt>
          <dd className="mt-1 text-[13px] text-black/70">{v || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  const t = useT();
  if (rows.length === 0) return <p className="text-[12.5px] text-black/40">{t("Nothing recorded yet.")}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-left">
        <thead>
          <tr className="border-b border-black/[0.07] text-[10px] uppercase tracking-[0.12em] text-black/35">
            {head.map((h) => (
              <th key={h} className="py-2 pr-4 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-black/[0.04] last:border-0 align-top">
              {r.map((c, j) => (
                <td key={j} className="py-2.5 pr-4 text-[12.5px] text-black/65">
                  {c || "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
