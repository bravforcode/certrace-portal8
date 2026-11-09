"use client";

export const runtime = "edge";

/* ════════════════════════════════════════════════════════════
   INSTALLATION · OVERVIEW — what is entered once

   Three groups, all of them Annex IV to Implementing Regulation (EU) 2025/2547
   and all of them true of the SITE rather than of any one year or good:

     1  the operator, and the installation's identity in the CBAM Registry
     2  the installation itself — name, reference, address, UN/LOCODE and the
        coordinates of the main emission source
     3  the summary of the monitoring plan — items 2 to 6

   Entered here, read by every product report and every report in the set. A
   fact that has to be typed again for each good or each year is a fact that
   will, in time, be typed differently.

   IT SAVES ITSELF. There is no Edit, Save or Cancel: the page is always
   editable, writes a moment after the last keystroke, and says so in the badge
   (the same `useAutoSave` the monthly screens use). A field left blank is saved
   blank — the meter and the field's own message say what is still owed — except
   the name, which falls back to the stored one so a site is never left unnamed.

   THE REFERENCE IS THE EXCEPTION. It is the record's KEY, so saving as you type
   would write a dozen orphan installations on the way to the right one. It is
   committed once, when the box loses focus and holds a valid, unused reference:
   then the record MOVES — every product report that names the old reference is
   pointed at the new one, and the old row is dropped. Until then everything
   else keeps saving under the reference the site already has.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AutoSaveBadge, useAutoSave } from "@/components/ui";
import { GroupHeading, SectionCard } from "@/components/workspace/chrome";
import { InstallationFields } from "@/components/workspace/installation-form";
import { MonitoringFields, OperatorFields } from "@/components/workspace/profile-fields";
import { useInstallationPage } from "@/components/workspace/installation-provider";
import { installationHref } from "@/components/workspace/installation-menu";
import { AnnexLegend } from "@/components/precursor/annex-fields";
import { topFuels, topMaterials } from "@/lib/cbam/profile-suggestions";
import { useOverviewFocus } from "@/components/workspace/profile-checklist";
import { referenceError, type Installation } from "@/lib/installations";
import { useRemoveInstallation, useSaveInstallation } from "@/lib/installations-query";
import { updateWorkspace, listArchivedWorkspaces, listWorkspaces } from "@/lib/workspace";
import { useInvalidateWorkspaces } from "@/lib/store";
import { workspaceReadiness } from "@/lib/readiness";
import { useT } from "@/lib/i18n";

/** Key order must not matter, and a trailing space in the name must not either:
    the store trims it, and a draft that lost its space on every pause between
    two words would be a draft nobody could type in. */
const stable = (i: Installation): string =>
  JSON.stringify({ ...i, name: i.name.trim() }, (_, v) =>
    v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([x], [y]) => x.localeCompare(y))) : v,
  );

export default function InstallationOverviewPage() {
  const t = useT();
  const router = useRouter();
  const { id, installation, workspaces } = useInstallationPage();
  const saveInstallation = useSaveInstallation();
  const removeInstallation = useRemoveInstallation();
  const invalidateWorkspaces = useInvalidateWorkspaces();

  const [draft, setDraft] = React.useState<Installation>(installation);
  /* What is typed in the reference box. Kept apart from `draft`, whose id is
     always the reference the record is stored under. */
  const [refInput, setRefInput] = React.useState(installation.id);
  const moving = React.useRef(false);

  const persist = (d: Installation) => {
    if (moving.current) return;
    const name = d.name.trim() ? d.name.trim() : installation.name;
    saveInstallation.mutate({ ...d, id: installation.id, name });
    /* The product reports carry a copy of the name, so a rename reaches them. */
    let renamed = false;
    for (const w of workspaces) {
      if (w.installationName === name) continue;
      updateWorkspace(w.id, { installationName: name });
      renamed = true;
    }
    if (renamed) invalidateWorkspaces();
  };
  const autosave = useAutoSave(draft, persist);

  /* The store moving underneath — another tab, the supplier's own correction —
     is read back in, but never over keystrokes the autosave has not written. */
  const statusRef = React.useRef(autosave.status);
  statusRef.current = autosave.status;
  React.useEffect(() => {
    if (statusRef.current === "pending" || statusRef.current === "saving") return;
    setDraft((d) => (stable(d) === stable(installation) ? d : installation));
  }, [installation]);
  React.useEffect(() => {
    moving.current = false;
    setRefInput(installation.id);
  }, [installation.id]);

  /* Leaving the page — another tab, closing the window — must not drop the last
     600 ms of typing. */
  const flushRef = React.useRef(autosave.flush);
  flushRef.current = autosave.flush;
  React.useEffect(() => {
    const onHide = () => statusRef.current === "pending" && flushRef.current();
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      onHide();
    };
  }, []);

  const commitReference = async () => {
    const next = refInput;
    if (!next || next === installation.id) return;
    if (referenceError(next, draft.country, installation.id)) return; // the field shows why
    moving.current = true;
    try {
      const name = draft.name.trim() ? draft.name.trim() : installation.name;
      const saved = await saveInstallation.mutateAsync({ ...draft, id: next, name });
      for (const w of [...listWorkspaces(), ...listArchivedWorkspaces()]) {
        if (w.installationId === installation.id) updateWorkspace(w.id, { installationId: saved.id, installationName: saved.name });
      }
      await removeInstallation.mutateAsync(installation.id);
      invalidateWorkspaces();
      router.replace(installationHref(saved.id));
    } catch {
      moving.current = false;
    }
  };

  const suggestions = React.useMemo(() => ({ topFuels: topFuels(workspaces), topMaterials: topMaterials(workspaces) }), [workspaces]);
  useOverviewFocus(true);

  const years = [...new Set(workspaces.map((w) => w.year))].sort((a, b) => b - a);

  return (
    <div className="space-y-5">
      <SectionCard
        title={t("Entered once")}
        blurb={t("The operator, the installation and its monitoring plan. Every product report and every report in the set reads them from here.")}
        actions={<AutoSaveBadge status={autosave.status} savedAt={autosave.savedAt} className="whitespace-nowrap" />}
      >
        <div className="mb-5 space-y-4">
          <AnnexLegend className="max-w-2xl" showNeed showNoItem noVr />
        </div>

        <div className="space-y-8">
          <div>
            <GroupHeading>{t("Operator")}</GroupHeading>
            <OperatorFields value={draft} onChange={setDraft} />
          </div>

          <div className="border-t border-black/[0.07] pt-6">
            <GroupHeading>{t("Installation")}</GroupHeading>
            <p className="mb-4 text-[12.5px] leading-relaxed text-black/45">
              {t("Annex IV item 1(d): the name, the CBAM Registry identifier, the UN/LOCODE, the full address in English and the coordinates of the main emission source.")}
            </p>
            <InstallationFields
              value={{ ...draft, id: refInput }}
              onChange={(n) => {
                setRefInput(n.id);
                setDraft({ ...n, id: installation.id });
              }}
              onReferenceBlur={() => void commitReference()}
              existingId={installation.id}
              annexTags
            />
          </div>

          <div className="border-t border-black/[0.07] pt-6">
            <GroupHeading>{t("Summary of the monitoring plan")}</GroupHeading>
            <p className="mb-4 text-[12.5px] leading-relaxed text-black/45">
              {t("Annex IV items 2 to 6.")}
            </p>
            <MonitoringFields value={draft} onChange={setDraft} suggestions={suggestions} />
          </div>

        </div>
      </SectionCard>

      <SectionCard title={t("Reporting years")} blurb={t("Each year at this installation is a set of product reports and one report set.")}>
        {years.length === 0 ? (
          <p className="text-[13px] text-black/45">{t("No product report yet. Create one and it appears here.")}</p>
        ) : (
          <ul className="divide-y divide-black/[0.06] overflow-hidden rounded-xl border border-black/[0.07]">
            {years.map((y) => {
              const ofYear = workspaces.filter((w) => w.year === y);
              const pcts = ofYear.map((w) => workspaceReadiness(w).percentComplete);
              const avg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
              return (
                <li key={y}>
                  <Link
                    href={`${installationHref(id, "readiness")}?year=${y}`}
                    className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-[#fafaf8]"
                  >
                    <span className="flex items-baseline gap-3">
                      <span className="font-[family-name:var(--font-plex)] text-[17px] font-light text-[#111]">{y}</span>
                      <span className="font-mono text-[11px] text-black/40">
                        {ofYear.length} {ofYear.length === 1 ? t("product report") : t("product reports")}
                      </span>
                    </span>
                    <span className="flex items-center gap-3 font-mono text-[11.5px] text-black/50">
                      {avg}% {t("ready")} <ArrowRight size={13} strokeWidth={1.5} className="text-black/30" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
