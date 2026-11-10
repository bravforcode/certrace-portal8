"use client";

/* ════════════════════════════════════════════════════════════
   THE INSTALLATION TAB — the scoped site's record, edited in the workbook

   The same record Settings → Installations edits, so the two stay one thing.
   A row per field the installation form asks for; a required field left empty
   gets a red edge. Typing saves after a short pause, through the parent's
   `onSave`, which writes the record and refreshes the tab colour.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useT } from "@/lib/i18n";
import type { Installation } from "@/lib/installations";

type Field = { key: keyof Installation; label: string; required?: boolean };

// Labels are the ones the installation form already uses, so they translate once.
const FIELDS: Field[] = [
  { key: "name", label: "Name of the installation (English)", required: true },
  { key: "street", label: "Street, number", required: true },
  { key: "postcode", label: "Post code" },
  { key: "poBox", label: "P.O. Box" },
  { key: "city", label: "City", required: true },
  { key: "country", label: "Country", required: true },
  { key: "unlocode", label: "UNLOCODE" },
  { key: "lat", label: "Latitude — main emission source", required: true },
  { key: "lng", label: "Longitude — main emission source", required: true },
];

const SAVE_DELAY_MS = 600;

export function InstallationSheet({
  installation,
  onSave,
}: {
  installation: Installation | null;
  onSave?: (inst: Installation) => void;
}) {
  const t = useT();
  const [draft, setDraft] = React.useState<Installation | null>(installation);
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

  if (!draft) {
    return <div className="grid min-h-[240px] place-items-center bg-[#fafaf8] px-6 text-center text-[14px] text-black/55">{t("Choose an installation above to fill in its details.")}</div>;
  }

  const change = (key: keyof Installation, value: string) => {
    const next = { ...draft, [key]: value } as Installation;
    setDraft(next);
    pending.current = next;
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
        {FIELDS.map((f) => {
          const empty = f.required && !String(draft[f.key] ?? "").trim();
          return (
            <React.Fragment key={f.key}>
              <div className="border-b border-r border-black/[0.08] bg-[#f0efea] px-4 py-2 text-black/60">
                {t(f.label)}
                {f.required && <span className="text-[#dc2626]"> *</span>}
              </div>
              <div className={empty ? "border-b border-black/[0.08] border-l-2 border-l-[#dc2626] px-2 py-1" : "border-b border-black/[0.08] px-2 py-1"}>
                <input
                  value={String(draft[f.key] ?? "")}
                  onChange={(e) => change(f.key, e.target.value)}
                  aria-label={t(f.label)}
                  className="h-7 w-full bg-transparent px-2 text-[13px] text-black/80 focus:bg-[#fafaf8] focus:outline-none"
                />
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
