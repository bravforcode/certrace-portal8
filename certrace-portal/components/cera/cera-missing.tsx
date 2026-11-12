"use client";

/* ════════════════════════════════════════════════════════════
   CERA MISSING DATA — what Cera watches for on its own, and the two things it shows

   Mounted once inside the portal shell (components/portal-shell.tsx), so it runs on every portal
   page while an installation is selected. It reads the same Convert context the readiness page
   reads, so the count can never disagree with the requirements. Supplier and precursor links do
   not mount it: there is no account to watch there, and `useCeraMissing` returns null.

   The count drives a badge on the Cera button; the list is the "Missing data" section at the top
   of the panel. "Ask Cera to fill" sends a message; Cera answers with confirmable action cards,
   and nothing is written until the user confirms each one.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { useCera } from "@/components/cera/cera-provider";
import { useConvertContext } from "@/lib/convert/use-convert-context";
import { getStandard } from "@/lib/convert-standards";
import { fillRequest, missingData, type MissingData } from "@/lib/cera/monitor";
import type { Installation } from "@/lib/installations";
import { useT } from "@/lib/i18n";
import { cn } from "@/components/ui";

/** How many missing items the panel lists before it says how many more there are. */
const LISTED = 8;

type Monitor = {
  installation: Installation;
  year: number;
  data: MissingData;
  /** sends Cera the fill request for the missing CBAM cells */
  askToFill: () => void;
};

const MonitorContext = React.createContext<Monitor | null>(null);

/** The monitor, or null where there is no account to watch (supplier and precursor links). */
export function useCeraMissing(): Monitor | null {
  return React.useContext(MonitorContext);
}

export function CeraMissingProvider({ children }: { children: React.ReactNode }) {
  const { installation, sheets, cells, year, loaded } = useConvertContext();
  const { send } = useCera();
  const std = getStandard("eu-cbam");
  // Nothing to watch until an installation is selected and its workbook has loaded; an unloaded
  // workbook has no answers yet, which would look like everything being missing.
  const data = React.useMemo(
    () => (installation && std && loaded ? missingData(std, { installation, sheets, cells }) : null),
    [installation, std, loaded, sheets, cells],
  );
  const value = React.useMemo<Monitor | null>(
    () =>
      installation && data
        ? {
            installation,
            year,
            data,
            askToFill: () => send(fillRequest({ id: installation.id, name: installation.name }, year, data.fields)),
          }
        : null,
    [installation, year, data, send],
  );
  return <MonitorContext.Provider value={value}>{children}</MonitorContext.Provider>;
}

/** The "Missing data" block at the top of the panel. Renders nothing where there is no monitor. */
export function CeraMissingSection() {
  const t = useT();
  const cera = useCeraMissing();
  const { thinking, answering } = useCera();
  if (!cera) return null;
  const { data } = cera;
  const count = data.fields.length;
  const listed = data.fields.slice(0, LISTED);

  return (
    <section
      aria-label={t("Missing data")}
      className="mx-4 mb-3 flex-none rounded-2xl border border-black/[0.07] bg-[#fafaf8] px-3.5 py-3"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-pixel text-[9.5px] uppercase tracking-[0.16em] text-black/45">{t("Missing data")}</p>
        <p className="font-mono text-[11px] text-black/45">
          {count === 0 ? t("Complete") : t("{n} missing", { n: count })}
        </p>
      </div>

      {count === 0 ? (
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-black/55">
          {t("Everything Cera checks for this installation is in.")}
        </p>
      ) : (
        <>
          <ul className="mt-2 space-y-0.5">
            {listed.map((f) => {
              const text = f.kind === "field" ? `${f.section} · ${f.label}` : f.label;
              return (
                <li key={`${f.kind}:${f.id}`}>
                  <Link
                    href={f.href ?? "#"}
                    className="block truncate rounded-lg px-2 py-1 text-[12.5px] text-black/70 transition-colors hover:bg-white hover:text-black"
                  >
                    {text}
                  </Link>
                </li>
              );
            })}
          </ul>
          {count > LISTED && (
            <p className="mt-1 px-2 text-[11.5px] text-black/40">{t("and {n} more", { n: count - LISTED })}</p>
          )}
          <button
            type="button"
            onClick={cera.askToFill}
            disabled={thinking || answering}
            title={t("Cera proposes each change; you confirm it before anything is saved.")}
            className={cn(
              "mt-2.5 w-full rounded-xl border border-black/[0.09] bg-white px-3 py-2 text-left text-[13px] text-black/80 transition-colors hover:border-black/25",
              (thinking || answering) && "cursor-not-allowed opacity-50",
            )}
          >
            {t("Ask Cera to fill")}
          </button>
        </>
      )}
    </section>
  );
}
