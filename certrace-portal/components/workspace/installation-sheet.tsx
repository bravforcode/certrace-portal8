"use client";

/* ════════════════════════════════════════════════════════════
   THE INSTALLATION TAB — the scoped site's record, edited in the workbook

   The same record Settings → Installations edits, so the two stay one thing.
   A row per field the installation form asks for; a required field left empty
   gets a red edge and a screen-reader "missing" note.

   The edit rules (what is saved, what is rejected) live in lib/installations.ts
   as applySheetEdit, so they are tested as a sequence. A value the validator
   rejects stays on screen with its message and is NOT saved. Valid edits save
   after a short pause, through the parent's `onSave`.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useT } from "@/lib/i18n";
import {
  INSTALLATION_SHEET_FIELDS,
  applySheetEdit,
  normaliseReference,
  startSheetEdit,
  type Installation,
  type SheetEditState,
} from "@/lib/installations";

const SAVE_DELAY_MS = 600;

// The echo of our own save: the store trims the name and normalises the reference.
const canonical = (i: Installation) =>
  JSON.stringify({ ...i, id: normaliseReference(i.id), name: i.name.trim() });

export function InstallationSheet({
  installation,
  onSave,
}: {
  installation: Installation | null;
  onSave?: (inst: Installation) => void;
}) {
  const t = useT();
  const [view, setView] = React.useState<SheetEditState | null>(() =>
    installation ? startSheetEdit(installation) : null,
  );
  // The source of truth for edits; `view` only re-renders the tab.
  const edit = React.useRef<SheetEditState | null>(view);
  // The record waiting to be saved.
  const pending = React.useRef<Installation | null>(null);
  const timer = React.useRef<number | undefined>(undefined);
  const onSaveRef = React.useRef(onSave);
  onSaveRef.current = onSave;

  // A kept edit is written even if the tab is left before the pause ends.
  const flush = React.useCallback(() => {
    window.clearTimeout(timer.current);
    const next = pending.current;
    pending.current = null;
    if (next) onSaveRef.current?.(next);
  }, []);
  React.useEffect(() => flush, [flush]);

  // A record that arrives from outside replaces the draft, and rejected values
  // with it. Our own save coming back is not outside: it is the same record.
  React.useEffect(() => {
    if (!installation || pending.current) return;
    if (edit.current && canonical(installation) === canonical(edit.current.known)) return;
    edit.current = startSheetEdit(installation);
    setView(edit.current);
  }, [installation]);

  if (!view) {
    return <div className="grid min-h-[240px] place-items-center bg-[#fafaf8] px-6 text-center text-[14px] text-black/55">{t("Choose an installation above to fill in its details.")}</div>;
  }

  const change = (key: keyof Installation, value: string) => {
    if (!edit.current) return;
    const next = applySheetEdit(edit.current, key, value);
    edit.current = next;
    setView(next);
    pending.current = next.known;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, SAVE_DELAY_MS);
  };

  const draft = view.draft;

  return (
    <div className="bg-white">
      <p className="border-b border-black/[0.08] px-4 py-2 text-[12.5px] text-black/55">
        {t("This tab edits the installation record. Changes also show in Settings → Installations.")}
      </p>
      <div className="grid grid-cols-[minmax(180px,260px)_1fr] text-[13px]">
        <div className="border-b border-r border-black/[0.08] bg-[#f0efea] px-4 py-2 text-black/60">{t("Installation reference")}</div>
        <div className="border-b border-black/[0.08] px-4 py-2 font-mono text-black/70">{draft.id}</div>
        {INSTALLATION_SHEET_FIELDS.map((f) => {
          const raw = String(draft[f.key] ?? "");
          const empty = f.required && !raw.trim();
          const message = view.messages[f.key];
          const invalid = empty || Boolean(message);
          const messageId = `installation-${String(f.key)}-message`;
          return (
            <React.Fragment key={f.key}>
              <div className="border-b border-r border-black/[0.08] bg-[#f0efea] px-4 py-2 text-black/60">
                {t(f.label)}
                {f.required && <span aria-hidden="true" className="text-[#dc2626]"> *</span>}
              </div>
              <div
                className={`border-b border-black/[0.08] border-l-2 px-2 py-1 ${invalid ? "border-l-[#dc2626]" : "border-l-transparent"}`}
              >
                <input
                  value={raw}
                  onChange={(e) => change(f.key, e.target.value)}
                  aria-label={t(f.label)}
                  required={f.required}
                  aria-invalid={invalid || undefined}
                  aria-describedby={message ? messageId : undefined}
                  className="h-7 w-full bg-transparent px-2 text-[13px] text-black/80 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#111]"
                />
                {empty && <span className="sr-only">{t("Missing data")}</span>}
                {message && (
                  <p id={messageId} className="px-2 text-[12px] text-[#dc2626]">
                    {t(message)}
                  </p>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
