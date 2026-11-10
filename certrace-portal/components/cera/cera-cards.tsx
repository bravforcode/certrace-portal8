"use client";

/* ════════════════════════════════════════════════════════════
   THE CARDS UNDER CERA'S WORDS

   A reply can carry a small interactive block. Each is the same ink-on-bone as the
   rest of the portal — hairline borders, mono capitals for the labels — and none of
   them does anything on its own: a card shows, asks, or offers a button, and what
   the button does is the provider's.

     upload       a place to put ONE file
     choice       a question with buttons — asked only when Cera could not tell
     extraction   what Cera found in a file, laid out as the form it goes into
     updates      what has changed in the rules, and what is coming
     links        where to go next
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, FileText, Upload } from "lucide-react";
import { Button, Checkbox, cn } from "@/components/ui";
import { Select } from "@/components/controls";
import { AnnexLegend, AnnexTag } from "@/components/precursor/annex-fields";
import { useCera } from "@/components/cera/cera-provider";
import { markUpdatesSeen } from "@/lib/cera/updates";
import {
  parseNumber,
  planProblems,
  readingOptions,
} from "@/lib/cera/smart-upload";
import type {
  CeraCard,
  ExtractedReading,
  ExtractionPlan,
  UpdateItem,
} from "@/lib/cera/types";
import { useLanguage, useT, type TFunction } from "@/lib/i18n";
import { pick, type CeraLang } from "@/lib/cera/lang";
import { requestFocus } from "@/lib/cera/focus";
import { listWorkspaces } from "@/lib/workspace";
import { ReportAutofill } from "@/components/intake/report-autofill";

function EarlierVersion() {
  const t = useT();
  return (
    <p className="mt-2 text-[12px] text-black/40">
      {t(
        "This file was read in an earlier version — give it to me again to fill it in.",
      )}
    </p>
  );
}

export function CeraCardView({
  messageId,
  card,
}: {
  messageId: string;
  card: CeraCard;
}) {
  switch (card.kind) {
    case "upload":
      return <UploadCard />;
    case "report-autofill":
      return <ReportAutofillCard card={card} />;
    case "choice":
      return <ChoiceCard messageId={messageId} card={card} />;
    case "extraction":
      // A card saved by an older version has no editable fields — it cannot be filled in, so it is not offered.
      return card.plan.readings.every((r) => r.input) ? (
        <ExtractionCard messageId={messageId} card={card} />
      ) : (
        <EarlierVersion />
      );
    case "updates":
      return <UpdatesCard card={card} />;
    case "links":
      return <LinksCard card={card} />;
  }
}

const shell = "mt-3 rounded-xl border border-black/[0.09] bg-white";

function ReportAutofillCard({
  card,
}: {
  card: Extract<CeraCard, { kind: "report-autofill" }>;
}) {
  const { getReportFiles } = useCera();
  const storedFiles = getReportFiles(card.id);
  const [reattached, setReattached] = React.useState<File[]>([]);
  const [fileLimitError, setFileLimitError] = React.useState("");
  const files = storedFiles.length ? storedFiles : reattached;
  const workspaces = listWorkspaces().filter((w) => !w.archivedAt);
  const [workspaceId, setWorkspaceId] = React.useState(
    workspaces.length === 1 ? workspaces[0]!.id : "",
  );
  const [month, setMonth] = React.useState("");
  const [started, setStarted] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [readyToAdvance, setReadyToAdvance] = React.useState(false);
  const workspace = workspaces.find((w) => w.id === workspaceId);
  if (!workspaces.length)
    return (
      <p className="mt-3 text-sm text-black/60">
        Create a product report before filling it from a document.
      </p>
    );
  return (
    <div className="mt-3 space-y-2">
      <p className="text-sm text-black/60">
        {files.length
          ? `${files.length} ${files.length === 1 ? "document" : "documents"}: ${files.map((file) => file.name).join(", ")}`
          : `Reattach ${card.fileNames?.join(", ") ?? card.fileName} to start a new reading.`}
      </p>
      {files.length > 1 && (
        <p className="text-xs text-black/50">
          These files will be read one at a time for the same report. A selected
          month applies to all files; otherwise Cera checks each document for
          its month.
        </p>
      )}
      {!files.length && (
        <input
          aria-label="Reattach documents for autofill"
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.docx,.pptx,.txt,.log,.csv,.tsv,.md,.markdown,.json,.xlsx"
          onChange={(event) => {
            const chosen = Array.from(event.target.files ?? []);
            setFileLimitError(
              chosen.length > 10 ? "Only the first 10 files were added." : "",
            );
            setReattached(chosen.slice(0, 10));
          }}
        />
      )}
      {fileLimitError && (
        <p role="alert" className="text-xs text-[#b45309]">
          {fileLimitError}
        </p>
      )}
      <label className="block text-sm">
        Product report
        <select
          aria-label="Report to autofill"
          value={workspaceId}
          onChange={(event) => {
            setWorkspaceId(event.target.value);
            setStarted(false);
            setActiveIndex(0);
          }}
          className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2"
        >
          <option value="">Choose a report</option>
          {workspaces.map((w) => (
            <option key={w.id} value={w.id}>
              {w.productName} · {w.installationName} · {w.year}
            </option>
          ))}
        </select>
      </label>
      {workspace && (
        <label className="block text-sm">
          Reporting month (optional when shown in the document)
          <input
            aria-label="Autofill reporting month"
            type="month"
            min={workspace.periodStart.slice(0, 7)}
            max={workspace.periodEnd.slice(0, 7)}
            value={month}
            onChange={(event) => {
              setMonth(event.target.value);
              setStarted(false);
              setActiveIndex(0);
            }}
            className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2"
          />
          <span className="mt-1 block text-xs text-black/50">
            Cera detects one clear month from the documents or filename. Choose
            it here if the month is missing or ambiguous.
          </span>
        </label>
      )}
      {workspace && !started && (
        <Button
          disabled={!files.length}
          onClick={() => {
            setActiveIndex(0);
            setReadyToAdvance(false);
            setStarted(true);
          }}
        >
          Read and propose values from {files.length}{" "}
          {files.length === 1 ? "file" : "files"}
        </Button>
      )}
      {workspace && started && activeIndex < files.length && (
        <>
          <p className="text-sm font-medium">
            File {activeIndex + 1} of {files.length}: {files[activeIndex]!.name}
          </p>
          <ReportAutofill
            key={`${workspace.id}:${activeIndex}`}
            workspaceId={workspace.id}
            periodStart={workspace.periodStart}
            periodEnd={workspace.periodEnd}
            initialFile={files[activeIndex]}
            fixedFile
            reportMonth={month}
            autoStart
            showRecent={false}
            onReadComplete={() => setReadyToAdvance(true)}
            onApplied={() => {
              setReadyToAdvance(false);
              setActiveIndex((index) => index + 1);
            }}
          />
          {readyToAdvance && activeIndex + 1 < files.length && (
            <Button
              variant="secondary"
              onClick={() => {
                setReadyToAdvance(false);
                setActiveIndex((index) => index + 1);
              }}
            >
              Skip to next file
            </Button>
          )}
        </>
      )}
      {workspace && started && activeIndex >= files.length && (
        <p role="status" className="text-sm text-black/60">
          Batch finished. Check the report before submission.
        </p>
      )}
    </div>
  );
}

/* ── A file ─────────────────────────────────────────────────── */
function UploadCard() {
  const t = useT();
  const { pickFile, thinking, answering } = useCera();
  const input = React.useRef<HTMLInputElement | null>(null);
  const [over, setOver] = React.useState(false);
  const [taken, setTaken] = React.useState<string | null>(null);
  const busy = thinking || answering;

  const take = (list: FileList | null) => {
    const f = list?.[0];
    if (!f || busy) return;
    setTaken(f.name);
    pickFile(f);
  };

  return (
    <div className={shell}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!taken) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (!taken) take(e.dataTransfer.files);
        }}
        className={cn(
          "m-2 rounded-lg border border-dashed px-4 py-5 text-center transition-colors",
          over ? "border-black/40 bg-[#faf9f7]" : "border-black/15",
        )}
      >
        {taken ? (
          <p className="flex items-center justify-center gap-2 text-[13px] text-black/60">
            <FileText size={15} strokeWidth={1.5} className="text-black/40" />{" "}
            {taken}
          </p>
        ) : (
          <>
            <Upload
              size={18}
              strokeWidth={1.5}
              className="mx-auto text-black/35"
            />
            <p className="mt-2 text-[13px] text-black/70">
              {t("Drop one file here")}
            </p>
            <p className="mt-0.5 text-[11.5px] text-black/40">
              {t("PDF, image, Office, text or CSV · one at a time")}
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="mt-3"
              onClick={() => input.current?.click()}
              disabled={busy}
            >
              {t("Choose a file")}
            </Button>
            <input
              ref={input}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.docx,.pptx,.xlsx,.txt,.csv,.tsv,.md,.json,.log,text/*"
              className="hidden"
              onChange={(e) => {
                take(e.target.files);
                e.target.value = "";
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

/* ── A question ─────────────────────────────────────────────── */
function ChoiceCard({
  messageId,
  card,
}: {
  messageId: string;
  card: Extract<CeraCard, { kind: "choice" }>;
}) {
  const t = useT();
  const { answerChoice, thinking, answering } = useCera();
  const done = Boolean(card.answer);
  return (
    <div className={cn(shell, "px-4 py-3.5")}>
      <p className="text-[13px] text-black/80">{t(card.question)}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {card.options.map((o) => {
          const chosen = card.answer === o.id;
          return (
            <button
              key={o.id}
              type="button"
              disabled={done || thinking || answering}
              onClick={() => answerChoice(messageId, card.id, o.id)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-left text-[12.5px] leading-snug transition-colors",
                chosen
                  ? "border-[#111] bg-[#111] text-white"
                  : done
                    ? "border-black/[0.07] text-black/30"
                    : "border-black/12 text-black/70 hover:border-black/35 hover:text-black",
              )}
            >
              <span className="block">{t(o.label)}</span>
              {o.hint && (
                <span
                  className={cn(
                    "block text-[11px]",
                    chosen ? "text-white/65" : "text-black/40",
                  )}
                >
                  {t(o.hint)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── What was found, as the form it goes into ───────────────── */
const SECTION_TITLE: Record<ExtractedReading["section"], string> = {
  production: "Production",
  fuel: "Fuels burned",
  electricity: "Electricity",
  process: "Process emissions",
  scrap: "Scrap",
  pfc: "PFC from anode effects",
  notes: "Gaps, estimates and notes",
  p_operator: "Operator and installation of origin",
  p_period: "Reporting period",
  p_emissions: "Specific embedded emissions",
  p_verifier: "The verifier and the verification statement",
};
const SECTION_ORDER: ExtractedReading["section"][] = [
  "production",
  "fuel",
  "electricity",
  "process",
  "scrap",
  "pfc",
  "notes",
  "p_operator",
  "p_period",
  "p_emissions",
  "p_verifier",
];

const box =
  "w-full rounded-xl border bg-white px-3 py-2.5 text-[13px] text-black/80 placeholder:text-black/25 transition-colors focus:border-black/30 focus:outline-none";

/* The names the form offers — a fuel, a source, a method, a unit — are English source strings, like the rest of the portal's copy, so
   they are put through the dictionary here. The list of materials is generated ("CaCO3 (carbonate)"), so its tail is translated on its own. */
const optionText = (t: TFunction, label: string): string => {
  const m = label.match(/^(.+) \(carbonate\)$/);
  return m ? `${m[1]} (${t("carbonate")})` : t(label);
};
/** "Fuel 2", "Source 1", "Entry 3" — numbered in the file's order, worded in the language of the card. */
const groupText = (t: TFunction, title: string): string => {
  const m = title.match(/^(Fuel|Source|Entry) (\d+)$/);
  return m ? t(`${m[1]} {n}`, { n: m[2] }) : t(title);
};
const unitText = (t: TFunction, unit: string): string =>
  unit.replace(/\blitres\b/g, t("litres"));

/** What the file said, worded the way the field shows it — for "the file said …" under a changed value. */
function foundText(
  plan: ExtractionPlan,
  r: ExtractedReading,
  t: TFunction,
): string {
  const raw = r.found.raw;
  if (r.input.kind === "select") {
    const label = readingOptions(plan, { ...r, raw }).find(
      (o) => o.id === raw,
    )?.label;
    return label ? optionText(t, label) : raw;
  }
  if (r.input.kind === "number") {
    const n = parseNumber(raw);
    const text =
      n == null ? raw : n.toLocaleString("en-GB", { maximumFractionDigits: 4 });
    const unit = r.found.unitId
      ? r.unitOptions?.find((u) => u.id === r.found.unitId)?.label
      : r.field === "fuelNcv"
        ? undefined
        : r.unit;
    return unit ? `${text} ${unitText(t, unit)}` : text;
  }
  return raw.length > 60 ? `${raw.slice(0, 60)}…` : raw;
}

/** One reading. While the card is open and its row is ticked it is a field — type a number, pick from the form's own
    list, switch the unit — so the reader can check it against the file and change it before anything is written. Once
    the card is closed, or the row is left out, it is the plain value. */
function Reading({
  plan,
  r,
  muted,
  editable,
  error,
  onChange,
  onReset,
}: {
  plan: ExtractionPlan;
  r: ExtractedReading;
  muted: boolean;
  editable: boolean;
  error?: string;
  onChange: (patch: { raw?: string; unitId?: string }) => void;
  onReset: () => void;
}) {
  const t = useT();
  const live = editable && !muted;

  return (
    <div className={cn("min-w-0", muted && "opacity-40")}>
      <div className="mb-1.5 flex items-start gap-2">
        <AnnexTag tag={r.tag} need={r.need} quiet />
        <span className="min-w-0 text-[12.5px] leading-snug text-black/75">
          {t(r.label)}
        </span>
      </div>

      {live ? (
        <>
          {r.input.kind === "number" && (
            <div className="flex items-start gap-2">
              <input
                value={r.raw}
                inputMode="decimal"
                autoComplete="off"
                aria-label={r.label}
                aria-invalid={!!error}
                onChange={(e) =>
                  /^[\d,]*\.?\d*$/.test(e.target.value) &&
                  onChange({ raw: e.target.value })
                }
                className={cn(
                  box,
                  "min-w-0 flex-1 tabular-nums",
                  error ? "border-[#dc2626]" : "border-black/10",
                )}
              />
              {r.unitOptions ? (
                <Select
                  value={r.unitId ?? ""}
                  onChange={(v) => onChange({ unitId: v })}
                  options={r.unitOptions.map((u) => ({
                    value: u.id,
                    label: unitText(t, u.label),
                  }))}
                  ariaLabel={`${r.label} — unit`}
                  className="w-[104px] flex-none"
                />
              ) : (
                r.unit && (
                  <span className="flex-none self-center text-[12px] text-black/40">
                    {unitText(t, r.unit)}
                  </span>
                )
              )}
            </div>
          )}
          {r.input.kind === "text" && (
            <input
              value={r.raw}
              aria-label={r.label}
              onChange={(e) => onChange({ raw: e.target.value })}
              className={cn(box, "border-black/10")}
            />
          )}
          {r.input.kind === "textarea" && (
            <textarea
              value={r.raw}
              rows={3}
              aria-label={r.label}
              onChange={(e) => onChange({ raw: e.target.value })}
              className={cn(box, "resize-y border-black/10 leading-relaxed")}
            />
          )}
          {r.input.kind === "select" && (
            <Select
              value={r.raw}
              onChange={(v) => onChange({ raw: v })}
              options={readingOptions(plan, r).map((o) => ({
                value: o.id,
                label: optionText(t, o.label),
              }))}
              placeholder={t("Choose one")}
              ariaLabel={r.label}
              invalid={!!error}
              searchable={readingOptions(plan, r).length > 8}
            />
          )}
          {error && (
            <p className="mt-1 text-[11px] text-[#dc2626]">{t(error)}</p>
          )}
          {r.edited ? (
            <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-[11px] text-black/45">
              <span>
                {t("You changed this — the file says")}{" "}
                <span className="text-black/65">{foundText(plan, r, t)}</span>
              </span>
              <button
                type="button"
                onClick={onReset}
                className="text-black/55 underline decoration-black/20 underline-offset-2 hover:text-black"
              >
                {t("Undo")}
              </button>
            </p>
          ) : (
            r.source && (
              <p
                title={`${t("From the file")}: ${r.source}`}
                className="mt-1 truncate font-mono text-[10.5px] text-black/35"
              >
                {r.source}
              </p>
            )
          )}
        </>
      ) : (
        <>
          <div
            title={r.source ? `${t("From the file")}: ${r.source}` : undefined}
            className="flex min-h-[40px] items-center justify-between gap-3 rounded-xl border border-black/10 bg-[#faf9f7] px-3 py-2 text-[13px] text-black/80"
          >
            <span className="min-w-0 whitespace-pre-wrap break-words">
              {r.input.kind === "select" ? optionText(t, r.value) : r.value}
            </span>
            {r.unit && (
              <span className="flex-none text-[12px] text-black/40">
                {unitText(t, r.unit)}
              </span>
            )}
          </div>
          {r.source && (
            <p className="mt-1 truncate font-mono text-[10.5px] text-black/35">
              {r.source}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function ExtractionCard({
  messageId,
  card,
}: {
  messageId: string;
  card: Extract<CeraCard, { kind: "extraction" }>;
}) {
  const t = useT();
  const {
    toggleReadings,
    editReading,
    applyExtraction,
    discardExtraction,
    thinking,
    answering,
  } = useCera();
  const plan: ExtractionPlan = card.plan;
  const open = card.state === "open" && !card.saveState;

  // Rows within a section, in the order they were found: a fuel, a source, an entry — or the single reading of production and notes.
  const rowsOf = (section: ExtractedReading["section"]) => {
    const rows: {
      group: string | undefined;
      title?: string;
      items: ExtractedReading[];
    }[] = [];
    for (const r of plan.readings.filter((x) => x.section === section)) {
      let row = rows.find((x) => x.group === r.group);
      if (!row) {
        row = { group: r.group, title: r.groupLabel, items: [] };
        rows.push(row);
      }
      row.items.push(r);
    }
    return rows;
  };
  const kept = plan.readings.filter((r) => r.included).length;
  const problems = planProblems(plan);
  const blocked = Object.keys(problems).length > 0;
  const changed = plan.readings.filter((r) => r.included && r.edited).length;

  return (
    <div className={shell}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-black/[0.06] px-4 py-3">
        <FileText
          size={14}
          strokeWidth={1.5}
          className="flex-none text-black/40"
        />
        <span className="min-w-0 truncate text-[12.5px] text-black/70">
          {plan.fileName}
        </span>
        <ArrowRight
          size={13}
          strokeWidth={1.5}
          className="flex-none text-black/30"
        />
        <span className="min-w-0 text-[12.5px] text-black/85">
          {plan.workspaceLabel} ·{" "}
          <strong className="font-medium">{plan.monthLabel}</strong>
        </span>
      </div>

      <div className="space-y-5 px-4 py-4">
        {open && (
          <p className="text-[12.5px] leading-relaxed text-black/60">
            {t(
              "This is what I found. Check each figure against your file and change anything that is not right — nothing goes into the form until you confirm.",
            )}
          </p>
        )}
        <AnnexLegend showNeed noVr />
        {SECTION_ORDER.map((section) => {
          const rows = rowsOf(section);
          if (rows.length === 0) return null;
          return (
            <section key={section}>
              <h4 className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/40">
                {t(SECTION_TITLE[section])}
              </h4>
              <div className="mt-2 space-y-2.5">
                {rows.map((row) => {
                  const on = row.items.every((i) => i.included);
                  return (
                    <div
                      key={row.group ?? section}
                      className={cn(
                        "rounded-xl border p-3",
                        on ? "border-black/[0.08]" : "border-black/[0.05]",
                      )}
                    >
                      {(row.title || open) && (
                        <div className="mb-2.5 flex items-center justify-between gap-2">
                          <span className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/40">
                            {row.title ? groupText(t, row.title) : ""}
                          </span>
                          {open && (
                            <Checkbox
                              checked={on}
                              onChange={() =>
                                toggleReadings(
                                  messageId,
                                  card.id,
                                  section,
                                  row.group,
                                )
                              }
                              label={
                                <span className="text-[12px] text-black/55">
                                  {t("Include")}
                                </span>
                              }
                            />
                          )}
                        </div>
                      )}
                      <div className="grid gap-3 sm:grid-cols-2">
                        {row.items.map((r) => (
                          <div
                            key={r.id}
                            className={cn(
                              (r.label.length > 34 ||
                                r.input.kind === "textarea") &&
                                "sm:col-span-2",
                            )}
                          >
                            <Reading
                              plan={plan}
                              r={r}
                              muted={!on}
                              editable={open}
                              error={problems[r.id]}
                              onChange={(patch) =>
                                editReading(messageId, card.id, r.id, patch)
                              }
                              onReset={() =>
                                editReading(messageId, card.id, r.id, "reset")
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {card.saveState === "failed" && (
        <div role="alert" className="px-4 pb-3 text-[12.5px] text-[#dc2626]">
          {t("Could not save — copy your entries before leaving")}.{" "}
          {card.saveError}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] px-4 py-3">
        {card.state === "applied" ? (
          <span className="inline-flex items-center gap-1.5 text-[12.5px] text-[#047857]">
            <Check size={14} strokeWidth={2} /> {t("Filled in")}{" "}
            {plan.monthLabel}
          </span>
        ) : card.state === "review" ? (
          <span className="text-[12.5px] text-black/60">
            {pick(
              plan.lang ?? "en",
              "Save was not confirmed. Open the form to check its current values.",
              "ยังไม่ได้ยืนยันการบันทึก เปิดแบบฟอร์มเพื่อตรวจสอบค่าปัจจุบัน",
              "尚未确认保存。请打开表单检查当前值。",
              "सहेजने की पुष्टि नहीं हुई। मौजूदा मान जाँचने के लिए फ़ॉर्म खोलें।",
            )}
          </span>
        ) : card.saveState ? (
          <Button
            size="sm"
            onClick={() => applyExtraction(messageId, card.id)}
            disabled={card.saveState === "pending"}
          >
            {card.saveState === "pending"
              ? t("Saving…")
              : pick(
                  plan.lang ?? "en",
                  "Retry save",
                  "ลองบันทึกอีกครั้ง",
                  "重试保存",
                  "फिर से सहेजें",
                )}
          </Button>
        ) : card.state === "discarded" ? (
          <span className="text-[12.5px] text-black/40">
            {t("Discarded — nothing was saved")}
          </span>
        ) : (
          <>
            <span
              className={cn(
                "text-[11.5px]",
                blocked ? "text-[#dc2626]" : "text-black/40",
              )}
            >
              {blocked
                ? t("Fix the figures marked in red to continue.")
                : `${kept} ${kept === 1 ? t("reading") : t("readings")} ${t("will be written as a draft")}${changed > 0 ? ` · ${changed} ${t("changed by you")}` : ""}`}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => discardExtraction(messageId, card.id)}
                disabled={thinking || answering}
              >
                {t("Discard")}
              </Button>
              <Button
                size="sm"
                onClick={() => applyExtraction(messageId, card.id)}
                disabled={kept === 0 || blocked || thinking || answering}
              >
                {t("Confirm and fill in")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── The rules ──────────────────────────────────────────────── */
/* Both follow the language of the message they are in, not the screen's: a digest asked for in English on a Thai screen is English
   all through. The Thai year stays Gregorian — these are the dates of EU rules, not of a Thai calendar. */
const dateText = (iso: string, lang: CeraLang) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(
    lang === "th"
      ? "th-TH-u-ca-gregory"
      : lang === "zh"
        ? "zh-CN"
        : lang === "hi"
          ? "hi-IN"
          : "en-GB",
    { day: "numeric", month: "short", year: "numeric" },
  );

function inText(iso: string, lang: CeraLang, today = new Date()): string {
  const days = Math.round(
    (new Date(`${iso}T00:00:00`).getTime() - today.getTime()) / 86400000,
  );
  if (days <= 0) return pick(lang, "today", "วันนี้", "今天", "आज");
  if (days < 45)
    return pick(
      lang,
      `in ${days} day${days === 1 ? "" : "s"}`,
      `อีก ${days} วัน`,
      `${days} 天后`,
      `${days} दिन में`,
    );
  const months = Math.round(days / 30.4);
  if (months < 18)
    return pick(
      lang,
      `in ${months} months`,
      `อีก ${months} เดือน`,
      `${months} 个月后`,
      `${months} महीने में`,
    );
  const years = (months / 12).toFixed(1).replace(".0", "");
  return pick(
    lang,
    `in ${years} years`,
    `อีก ${years} ปี`,
    `${years} 年后`,
    `${years} साल में`,
  );
}

function UpdateRow({ u, upcoming }: { u: UpdateItem; upcoming?: boolean }) {
  const { lang } = useLanguage();
  // The date sits above the title, not beside it — the chat is a narrow column
  // and a side column would leave the text a few words wide.
  return (
    <li className="py-3">
      <span className="flex flex-wrap items-baseline gap-x-2 font-mono text-[10.5px] leading-relaxed text-black/40">
        {dateText(u.date, lang)}
        {upcoming && (
          <span className="text-black/70">· {inText(u.date, lang)}</span>
        )}
      </span>
      <span className="mt-0.5 block text-[13px] leading-snug text-black/80">
        {u.title}
      </span>
      <span className="mt-1 block text-[12px] leading-relaxed text-black/50">
        {u.body}
      </span>
      {u.source && (
        <span className="mt-1 block text-[11px] leading-relaxed text-black/35">
          {pick(lang, "Source", "ที่มา", "来源", "स्रोत")}: {u.source}
        </span>
      )}
    </li>
  );
}

function UpdatesCard({
  card,
}: {
  card: Extract<CeraCard, { kind: "updates" }>;
}) {
  const t = useT();
  React.useEffect(() => {
    markUpdatesSeen([...card.inForce, ...card.upcoming].map((u) => u.id));
  }, [card]);

  return (
    <div className={shell}>
      <div className="px-4 py-3.5">
        <h4 className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/40">
          {t("Coming up")}
        </h4>
        <ul className="mt-1 divide-y divide-black/[0.05]">
          {card.upcoming.map((u) => (
            <UpdateRow key={u.id} u={u} upcoming />
          ))}
        </ul>
        <h4 className="mt-4 font-pixel text-[10px] uppercase tracking-[0.14em] text-black/40">
          {t("Already in force")}
        </h4>
        <ul className="mt-1 divide-y divide-black/[0.05]">
          {card.inForce.map((u) => (
            <UpdateRow key={u.id} u={u} />
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ── Where next ─────────────────────────────────────────────── */
function LinksCard({ card }: { card: Extract<CeraCard, { kind: "links" }> }) {
  const { hide, setFullscreen, supplier, followFocus } = useCera();
  const pill =
    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-black/12 bg-white px-3 py-1.5 text-[12.5px] text-black/70 transition-colors hover:border-black/35 hover:text-black";
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {card.links.map((l) =>
        supplier && l.focus && l.month ? (
          // On a supplier's link there is no exporter screen to open: the button takes the page to that part of the form.
          <button
            key={l.href}
            type="button"
            onClick={() => {
              followFocus(l.month!, l.focus!);
              setFullscreen(false);
              hide();
            }}
            className={pill}
          >
            {l.label} <ArrowRight size={13} strokeWidth={1.5} />
          </button>
        ) : (
          <Link
            key={l.href}
            href={l.href}
            /* Going somewhere means getting Cera out of the way: leave full screen and fold to the pill, so the page it opens is the page you see. */
            onClick={() => {
              // A page that is already open does not hear about a hash; tell its form to go to the part.
              if (l.focus) requestFocus(l.focus);
              setFullscreen(false);
              hide();
            }}
            className={pill}
          >
            {l.label} <ArrowRight size={13} strokeWidth={1.5} />
          </Link>
        ),
      )}
    </div>
  );
}
