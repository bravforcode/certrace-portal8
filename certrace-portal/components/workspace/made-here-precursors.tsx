"use client";

/* ════════════════════════════════════════════════════════════
   MADE AT THIS INSTALLATION — a precursor that is another product report

   The cards above are goods bought in or made elsewhere. This is the other
   kind: a good the SAME site makes and then uses — billet that becomes wire
   rod. Annex IV asks the operator for its quantity (items 18, 19 and 27), and
   the embedded emissions it carries are its own report's, not a figure anyone
   types a second time (lib/internal-precursors.ts).

   A row is two answers — which product report, how many tonnes of it — and one
   figure read back: the specific embedded emissions that travel with it, and
   what they add to this good. Nothing is asked of a supplier, because there is
   none.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Plus } from "lucide-react";
import { AutoSaveBadge, Button, Card, NumberInput, cn } from "@/components/ui";
import { Select } from "@/components/controls";
import { RowCard } from "@/components/supplier/month-pieces";
import { TaggedField } from "@/components/precursor/annex-fields";
import { useWorkspace } from "@/components/workspace/provider";
import { newInternalId, removeInternal, saveInternal, wouldLoop, type InternalPrecursor } from "@/lib/internal-precursors";
import { internalContribution } from "@/lib/workspace-see";
import { listWorkspaces } from "@/lib/workspace";
import { useT } from "@/lib/i18n";

const f4 = (v: number) => v.toLocaleString("en-GB", { minimumFractionDigits: 4, maximumFractionDigits: 4 });

export function MadeHerePrecursors({ onChanged }: { onChanged: () => void }) {
  const t = useT();
  const { workspace } = useWorkspace();
  const [tick, setTick] = React.useState(0);
  // Every change is written the moment it is made; the badge says so, in the card that was changed, the way the other autosaving screens do.
  const [saved, setSaved] = React.useState<{ rowId: string | null; at: Date | null }>({ rowId: null, at: null });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { rows } = React.useMemo(() => internalContribution(workspace), [workspace, tick]);

  // The other product reports of this installation and year that could feed this one.
  const siblings = React.useMemo(
    () => listWorkspaces().filter((w) => w.id !== workspace.id && w.installationId === workspace.installationId && w.year === workspace.year),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workspace, tick],
  );
  const taken = new Set(rows.map((r) => r.sourceWorkspaceId));

  const changed = (rowId: string | null) => {
    setTick((n) => n + 1);
    setSaved({ rowId, at: new Date() });
    onChanged();
  };
  const add = () => {
    const first = siblings.find((s) => !taken.has(s.id) && !wouldLoop(workspace.id, s.id));
    if (!first) return;
    const id = newInternalId();
    saveInternal({ id, workspaceId: workspace.id, sourceWorkspaceId: first.id });
    changed(id);
  };
  const save = (row: InternalPrecursor) => {
    saveInternal(row);
    changed(row.id);
  };

  const available = siblings.filter((s) => !taken.has(s.id) && !wouldLoop(workspace.id, s.id));

  return (
    <section aria-labelledby="made-here" className="space-y-3 pt-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h2 id="made-here" className="flex items-center gap-2 text-[14px] text-black/80">
            {t("Made at this installation")}
            <span className="rounded-[5px] border border-black/25 bg-white px-1.5 font-mono text-[10px] leading-[18px] text-black/65">18 · 19 · 27</span>
          </h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-black/50">
            {t("A product this site makes and uses here — billet rolled into wire rod. Pick its report and the tonnes used.")}
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={add} disabled={available.length === 0} title={available.length === 0 ? t("This installation has no other product report for the year") : undefined}>
          <Plus size={14} strokeWidth={1.5} /> {t("Add a product made here")}
        </Button>
      </div>

      {rows.length === 0 ? (
        <Card className="px-5 py-4">
          <p className="text-[12.5px] leading-relaxed text-black/45">
            {siblings.length === 0
              ? t("No other product report at this installation for {year}.", { year: workspace.year })
              : t("None yet.")}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r, i) => {
            const link = { id: r.id, workspaceId: workspace.id, sourceWorkspaceId: r.sourceWorkspaceId, quantityUsedT: r.quantityUsedT ?? undefined };
            const options = siblings
              .filter((s) => s.id === r.sourceWorkspaceId || (!taken.has(s.id) && !wouldLoop(workspace.id, s.id)))
              .map((s) => ({ value: s.id, label: t(s.productName), hint: `CN ${s.cnCode || "—"}` }));
            return (
              <RowCard key={r.id} title={`${t("Made here")} ${i + 1}`} removeLabel={`${t("Remove")} ${i + 1}`} confirmRemove onRemove={() => { removeInternal(workspace.id, r.id); changed(null); }}>
                <div className="grid gap-4 sm:grid-cols-3">
                  <TaggedField tag="18 · 19" need="required" label={t("Product report")} hint={t("Of this installation, for the same year.")}>
                    <Select value={r.sourceWorkspaceId} onChange={(v) => save({ ...link, sourceWorkspaceId: v })} options={options} ariaLabel={t("Product report")} />
                  </TaggedField>
                  <TaggedField tag="18 · 19" need="required" label={t("Tonnes used in the year")} hint={t("All of it, including what never reached the product.")}>
                    <NumberInput value={r.quantityUsedT ?? undefined} min={0} unit="t" onChange={(v) => save({ ...link, quantityUsedT: v })} ariaLabel={t("Tonnes used")} placeholder="1200" />
                  </TaggedField>
                  <div className="grid grid-rows-subgrid row-span-2">
                    <span className="mb-1.5 text-[12.5px] leading-snug text-black/75">{t("Embedded emissions it carries")}</span>
                    <div>
                      <p className={cn("flex h-[44px] items-center rounded-xl border border-black/[0.07] bg-[#faf9f7] px-3.5 font-mono text-[13px]", r.issue ? "text-black/35" : "text-black/80")}>
                        {r.issue ? "—" : `${f4(r.see)} tCO₂e/t`}
                      </p>
                      <span className="mt-1.5 block text-[11.5px] leading-snug text-black/40">
                        {r.issue ? "" : t("Adds {n} tCO₂e per tonne to this good.", { n: f4(r.contribution) })}
                      </span>
                    </div>
                  </div>
                </div>
                {r.issue && <p className="mt-3 text-[12px] leading-relaxed text-[#b45309]">{t(r.issue)}</p>}
                <div className="mt-3 flex justify-end">
                  <AutoSaveBadge status={saved.rowId === r.id ? "saved" : "idle"} savedAt={saved.rowId === r.id ? saved.at : null} />
                </div>
              </RowCard>
            );
          })}
        </div>
      )}
    </section>
  );
}
