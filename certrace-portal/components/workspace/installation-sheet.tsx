"use client";

/* ════════════════════════════════════════════════════════════
   THE INSTALLATION TAB — the scoped site's record, edited in the workbook

   The same record Settings → Installations edits, so the two stay one thing.
   A row per field the installation form asks for; a required field left empty
   gets a red edge and a screen-reader "missing" note.

   Typing is checked by the same validators the form uses. A value they reject
   stays on screen with its message beside the field and is NOT saved; the
   record keeps its last valid value. Valid edits save after a short pause,
   through the parent's `onSave`, which writes the record and refreshes the tab.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useT } from "@/lib/i18n";
import {
  INSTALLATION_SHEET_FIELDS,
  installationErrors,
  type Installation,
  type InstallationFieldErrors,
} from "@/lib/installations";

const SAVE_DELAY_MS = 600;

type FieldMessages = Partial<Record<keyof Installation, string>>;

// A coordinate pair is validated as a pair; either box shows the pair's message.
const fieldError = (errs: InstallationFieldErrors, key: keyof Installation): string | undefined =>
  errs[key] ?? (key === "lat" || key === "lng" ? errs.coordinates : undefined);

export function InstallationSheet({
  installation,
  onSave,
}: {
  installation: Installation | null;
  onSave?: (inst: Installation) => void;
}) {
  const t = useT();
  const [draft, setDraft] = React.useState<Installation | null>(installation);
  const [messages, setMessages] = React.useState<FieldMessages>({});
  // The last record that is saved or waiting to be saved. A rejected field reverts to it.
  const known = React.useRef<Installation | null>(installation);
  const pending = React.useRef<Installation | null>(null);
  // Raw values the validators rejected. They stay in the field and survive a refresh; they are never saved.
  const rejected = React.useRef<Partial<Installation>>({});
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

  // A saved record that arrives while nothing is pending replaces the draft; rejected raw values stay on screen.
  React.useEffect(() => {
    if (pending.current || !installation) return;
    known.current = installation;
    setDraft({ ...installation, ...rejected.current });
  }, [installation]);

  if (!draft) {
    return <div className="grid min-h-[240px] place-items-center bg-[#fafaf8] px-6 text-center text-[14px] text-black/55">{t("Choose an installation above to fill in its details.")}</div>;
  }

  const change = (key: keyof Installation, value: string) => {
    const next = { ...draft, [key]: value } as Installation;
    const message = fieldError(installationErrors(next, draft.id), key);
    const kept: Partial<Installation> = { ...rejected.current };
    if (message) Object.assign(kept, { [key]: value });
    else delete kept[key];
    rejected.current = kept;
    setDraft(next);
    setMessages((prev) => ({ ...prev, [key]: message }));
    const persisted = message ? ({ ...next, [key]: known.current?.[key] ?? "" } as Installation) : next;
    known.current = persisted;
    pending.current = persisted;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, SAVE_DELAY_MS);
  };

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
          const message = messages[f.key];
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
