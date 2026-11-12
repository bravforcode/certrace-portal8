"use client";

/* ════════════════════════════════════════════════════════════
   FILL IN — one Convert requirement typed in as a form

   Every answer is a CBAM template input, saved on row 0 of the CBAM tab in the
   installation's workbook for the current year, so a second save overwrites the
   first. Fields come from lib/convert/fill-items.ts; inputs are prefilled from the
   workbook and only the fields the user changed are saved (useWorkbook's savePatch).
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, PageHeader, cn, inputClass } from "@/components/ui";
import { ScopedInstallationSwitcher } from "@/components/scoped-installation-switcher";
import { useConvertContext } from "@/lib/convert/use-convert-context";
import {
  getFillItem,
  type FillField,
  type FillItem,
} from "@/lib/convert/fill-items";
import {
  cbamOptionLabel,
  cbamProgress,
  declaredBlocks,
  visibleBlocks,
} from "@/lib/cbam/template-fields";
import { withInstallationDefaults } from "@/lib/cbam/installation-defaults";
import { getStandard } from "@/lib/convert-standards";
import { useWorkbook } from "@/lib/workbook/use-workbook";
import { cellKey } from "@/lib/workbook/cells";
import { CELL_MAX } from "@/lib/workbook/save-queue";
import type { CellPatch } from "@/lib/workbook/flow-edit";
import { currentYear } from "@/lib/year-range";

/** CBAM answers always live on row 0 of the CBAM tab. */
const ROW = 0;

export default function ConvertFillPage() {
  return (
    <React.Suspense fallback={null}>
      <FillInner />
    </React.Suspense>
  );
}

function FillInner() {
  const { item } = useParams<{ item: string }>();
  const def = getFillItem(item);
  if (!def) {
    return (
      <Shell title="Not found">
        <p className="text-[14px] text-black/55">
          This requirement does not exist.
        </p>
      </Shell>
    );
  }
  return <FillForm id={item} def={def} />;
}

function FillForm({ id, def }: { id: string; def: FillItem }) {
  const { installation } = useConvertContext();
  const year = currentYear();
  const { cells, loaded, error, savePatch } = useWorkbook(
    installation?.id ?? null,
    year,
  );
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const [notice, setNotice] = React.useState<{
    tone: "ok" | "err";
    text: string;
  } | null>(null);
  // Fill in was opened from a regulation page; going back returns there, not to the Convert list.
  const from = useSearchParams().get("from");
  const standard = from ? getStandard(from) : undefined;

  // The site wizard's answers prefill the form; a first Save writes them into the workbook.
  const prefilled = React.useMemo(
    () => withInstallationDefaults(cells, installation, year),
    [cells, installation, year],
  );
  const saved = (f: FillField) => cells[cellKey(def.sheet, ROW, f.cell)] ?? "";
  const shown = (f: FillField) =>
    values[f.key] ?? prefilled[cellKey(def.sheet, ROW, f.cell)] ?? "";
  const setValue = (key: string, value: string) =>
    setValues((v) => ({ ...v, [key]: value }));
  const progress = cbamProgress(cells, id);

  const groups = new Map<string, FillField[]>();
  const declared = React.useMemo(() => declaredBlocks(prefilled), [prefilled]);
  for (const f of visibleBlocks(
    def.fields,
    (f) => shown(f).trim() !== "",
    declared,
  ))
    groups.set(f.section ?? "", [...(groups.get(f.section ?? "") ?? []), f]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!installation || !loaded) return;
    // Only fields whose shown value differs from the stored one are written: edits, and
    // site-record defaults that were never saved.
    const changed = def.fields.filter(
      (f) => shown(f).trim() !== saved(f).trim(),
    );
    if (changed.length === 0)
      return setNotice({ tone: "err", text: "Nothing changed." });
    const badNumber = changed.find(
      (f) =>
        f.kind === "number" &&
        shown(f).trim() !== "" &&
        !Number.isFinite(Number(shown(f))),
    );
    if (badNumber)
      return setNotice({
        tone: "err",
        text: `${badNumber.label} must be a number.`,
      });

    const patch: CellPatch = {};
    for (const f of changed)
      patch[cellKey(def.sheet, ROW, f.cell)] = shown(f)
        .trim()
        .slice(0, CELL_MAX);

    setBusy(true);
    const result = await savePatch(patch);
    setBusy(false);
    if (result === "saved") {
      setNotice({
        tone: "ok",
        text: `Saved ${changed.length} ${changed.length === 1 ? "answer" : "answers"}.`,
      });
    } else {
      setNotice({
        tone: "err",
        text:
          result === "skipped"
            ? "Not saved: an earlier save failed. Try again."
            : "Not saved. Try again.",
      });
    }
  };

  const backHref =
    (standard ? `/convert/${encodeURIComponent(standard.id)}` : "/convert") +
    (installation
      ? `?installation=${encodeURIComponent(installation.id)}`
      : "");
  const backLabel = standard ? standard.name : "Convert";
  const back = (
    <Link
      href={backHref}
      className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.08em] text-black/40 hover:text-black"
    >
      <ArrowLeft size={14} strokeWidth={1.5} /> {backLabel}
    </Link>
  );

  let body: React.ReactNode;
  if (!installation)
    body = (
      <p className="text-[14px] text-black/55">
        Choose an installation on Convert first.
      </p>
    );
  else if (error)
    body = (
      <p className="text-[14px] text-black/55">
        Could not load the workbook. Reload the page.
      </p>
    );
  else if (!loaded)
    body = <p className="text-[14px] text-black/40">Loading…</p>;
  else if (def.fields.length === 0)
    body = (
      <p className="text-[14px] text-black/55">
        The CBAM template has no input for this requirement.
      </p>
    );
  else
    body = (
      <form onSubmit={submit} className="max-w-xl space-y-8">
        {[...groups].map(([section, fields]) => (
          <fieldset key={section} className="space-y-5">
            <legend className="mb-3 text-[12px] uppercase tracking-[0.08em] text-black/50">
              {section}
            </legend>
            {fields.map((f) => (
              <label key={f.key} className="block space-y-1.5">
                <span className="text-[13px] text-black/60">
                  {f.label}
                  {f.unit && <span className="text-black/40"> ({f.unit})</span>}
                  {f.optional && (
                    <span className="text-black/40"> · optional</span>
                  )}
                </span>
                <FillInput
                  field={f}
                  value={shown(f)}
                  onChange={(v) => setValue(f.key, v)}
                />
              </label>
            ))}
          </fieldset>
        ))}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
          {notice && (
            <span
              className={cn(
                "text-[13px]",
                notice.tone === "ok" ? "text-emerald-700" : "text-red-600",
              )}
              role="status"
            >
              {notice.text}
            </span>
          )}
          {notice?.tone === "ok" && (
            <Link
              href={backHref}
              className="text-[13px] text-black/60 underline-offset-4 hover:text-black hover:underline"
            >
              Back to {backLabel}
            </Link>
          )}
        </div>
      </form>
    );

  return (
    <Shell
      title={def.title}
      back={back}
      actions={<ScopedInstallationSwitcher />}
    >
      {progress.total > 0 && (
        <p className="text-[13px] text-black/55">
          {progress.filled} of {progress.total} required filled
        </p>
      )}
      {body}
    </Shell>
  );
}

function FillInput({
  field,
  value,
  onChange,
}: {
  field: FillField;
  value: string;
  onChange: (v: string) => void;
}) {
  if (field.kind === "select")
    return (
      <select
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">—</option>
        {(field.options ?? []).map((o) => (
          <option key={o} value={o}>
            {cbamOptionLabel(field, o)}
          </option>
        ))}
      </select>
    );
  return (
    <input
      className={inputClass}
      type={
        field.kind === "date"
          ? "date"
          : field.kind === "number"
            ? "number"
            : "text"
      }
      step={field.kind === "number" ? "any" : undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function Shell({
  title,
  back,
  actions,
  children,
}: {
  title: string;
  back?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {back ?? (
          <Link
            href="/convert"
            className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.08em] text-black/40 hover:text-black"
          >
            <ArrowLeft size={14} strokeWidth={1.5} /> Convert
          </Link>
        )}
        {actions}
      </div>
      <PageHeader
        title={title}
        lead="Answers are saved into the installation workbook for this year."
      />
      {children}
    </div>
  );
}
