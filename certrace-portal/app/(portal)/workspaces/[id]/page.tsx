"use client";

export const runtime = "edge";

/* ════════════════════════════════════════════════════════════
   OVERVIEW

   Identity you can correct, the SEE figures once they are computable, and a
   "what's missing" list that links straight to the offending tab.

   ABOUT THE INSTALLATION IS THE INSTALLATION RECORD, ALL OF IT.

   This section used to hold two boxes — an installation NAME and an
   installation REFERENCE — which are the two facts lib/workspace.ts
   denormalises onto the workspace. The other fourteen a verifier actually
   asks about (the address, the economic activity, the UNLOCODE, the
   coordinates of the MAIN EMISSION SOURCE, the authorised representative and
   how to reach them, the other goods running through the same plant) existed
   only inside the create-an-installation form. So the page titled "About the
   installation" could not show, let alone correct, most of what is known
   about the installation, and the only way to fix a wrong coordinate was to
   find the site again under Settings.

   It is now `InstallationFields` — the SAME component the create form and the
   supplier portal render, field for field, in the EU template's own order —
   disabled until Edit is pressed. One component, so the screen that creates a
   site and the screen that is about it can never drift into asking for
   different things.

   THE PRODUCT AND ITS ROUTE ARE KEPT SEPARATE, in their own block at the foot
   of the same card. None of it is a fact about the SITE: the same plant runs a
   different good next year under a different route, and the EU asks for them
   on a different sheet. They stay INSIDE this card because they are still what
   this workspace is about, and a card of their own would put the good a screen
   away from the plant that makes it.

   IDENTITY IS EDITABLE, with one exception. An installation gets renamed, a
   reference gets typed wrong, a route gets picked in a hurry — none of those
   should mean rebuilding a year of readings, so all of them save in place.
   The reporting YEAR does not, because every monthly entry and evidence item
   in the workspace is keyed to it: changing it would leave twelve months of
   data describing a year the workspace no longer claims to cover.
   That is a new workspace, and the card says so rather than offering a control
   that would quietly orphan the data behind it.

   SAVING IS EXPLICIT HERE, where it used to autosave on a debounce. The
   reference is the record's KEY — `saveInstallation` upserts by it — so a
   keystroke-by-keystroke save of "TH-RAYONG-01" would write a dozen orphan
   installations on the way to the right one. One Save, gated on the same
   `canSaveInstallation` the create form gates its own button on.

   The missing list is the point of the lower half. Before any month is entered
   it lists every unbuilt tab as missing rather than claiming completeness — an
   empty workspace that renders as "0 problems" would be the single most
   misleading thing this product could say.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { Check, Lock, Pencil, TriangleAlert } from "lucide-react";
import { Button, Card, EnglishWhyBody, Field, SaveButton, Stat, TagBadge, inputClass, cn, useSaveState } from "@/components/ui";
import { Select } from "@/components/controls";
import { ProductPicker } from "@/components/workspace/product-picker";
import { InstallationFields, canSaveInstallation } from "@/components/workspace/installation-form";
import { FactGrid, GroupHeading, Note, SectionCard, StateChip, fmt } from "@/components/workspace/chrome";
import { useWorkspace } from "@/components/workspace/provider";
import { aggregatedGoodsCategory, getCatalogProduct, productType } from "@/lib/config";
import { installationErrors, installationForWorkspace, removeInstallation, saveInstallation, type Installation } from "@/lib/installations";
import { allMissing, TAB_LABEL } from "@/lib/readiness";
import { workspaceSEE } from "@/lib/workspace-see";
import { useT } from "@/lib/i18n";
import {
  getRoute,
  isComplexWorkspace,
  listWorkspaces,
  routeLabel,
  routeMatchesCategory,
  routesForCategory,
  updateWorkspace,
} from "@/lib/workspace";

export default function WorkspaceOverviewPage() {
  const t = useT();
  const { workspace, readiness, refresh } = useWorkspace();
  const [see, setSee] = React.useState<ReturnType<typeof workspaceSEE> | null>(null);
  const [editing, setEditing] = React.useState(false);
  /* SAVED IS SAID ON THE BUTTON, not in the corner of the screen. The reader
     is looking at the control they just pressed; a toast asks them to look
     somewhere else for an answer to a question they asked here. Same state
     machine every other form on the platform uses. */
  const save = useSaveState();

  /* ── The installation record behind this workspace ─────────────
     Read on the client, because every store in this build is localStorage and
     the value computed during the first render saw nothing. `installationRead`
     is bumped by hand after a save: the provider's `refresh()` only changes
     `workspace` when the WORKSPACE changed, and correcting a postcode changes
     the installation without touching it. */
  const [installationRead, setInstallationRead] = React.useState(0);
  const [installation, setInstallation] = React.useState<Installation | null>(null);
  React.useEffect(() => {
    setInstallation(installationForWorkspace(workspace));
  }, [workspace, installationRead]);

  /* The edit buffer is separate from the record so a half-typed installation
     name never reaches the title bar above. It resyncs whenever the record
     changes underneath — after a save, or when the provider reloads — but
     never mid-edit, which would discard what is being typed. */
  const [instDraft, setInstDraft] = React.useState<Installation | null>(null);
  React.useEffect(() => {
    if (installation && !editing) setInstDraft(installation);
  }, [installation, editing]);

  /* The two facts that are the WORKSPACE's rather than the site's. Same
     buffer discipline, same reason. */
  const [wsDraft, setWsDraft] = React.useState({ productId: workspace.productId, productionRoute: workspace.productionRoute });
  React.useEffect(() => {
    if (!editing) setWsDraft({ productId: workspace.productId, productionRoute: workspace.productionRoute });
  }, [workspace.productId, workspace.productionRoute, editing]);

  React.useEffect(() => {
    setSee(workspaceSEE(workspace));
  }, [workspace, readiness]);

  const draftProduct = getCatalogProduct(wsDraft.productId);
  const draftAggCategory = draftProduct ? aggregatedGoodsCategory(draftProduct) : null;
  const routes = draftAggCategory ? routesForCategory(draftAggCategory) : [];

  const missing = allMissing(readiness);
  const product = getCatalogProduct(workspace.productId);
  const route = getRoute(workspace.productionRoute);
  const productChanged = wsDraft.productId !== workspace.productId;
  const category = product ? aggregatedGoodsCategory(product) : null;
  const routeMismatch = Boolean(category && workspace.productionRoute && !routeMatchesCategory(workspace.productionRoute, category));

  /* What the fields are showing right now: the buffer while editing, the
     stored record otherwise. Null only before the first client read. */
  const shown = instDraft ?? installation;
  /* Exactly the gate the create form uses, so a site that cannot be created
     cannot be saved into here either — and the list beneath the form says
     which fields are holding it, because a Save button that is greyed out for
     an unstated reason is a Save button people press twice and then leave. */
  const gaps = shown ? Object.values(installationErrors(shown, installation?.id)) : [];
  const canSave = Boolean(shown) && canSaveInstallation(shown!, installation?.id);

  const cancelEdit = () => {
    setInstDraft(installation);
    setWsDraft({ productId: workspace.productId, productionRoute: workspace.productionRoute });
    setEditing(false);
  };

  /* The card stays in EDIT while the button plays its saving → saved cycle,
     and only settles back to the read state once the tick has been seen.
     Dropping out of edit on the click would delete the button mid-animation,
     which is the confirmation disappearing at the exact moment it has
     something to say. */
  const closingRef = React.useRef(false);
  React.useEffect(() => {
    if (save.state === "saved") closingRef.current = true;
    else if (save.state === "idle" && closingRef.current) {
      closingRef.current = false;
      setEditing(false);
    }
  }, [save.state]);

  const saveEdit = () => {
    if (!shown || !installation || !canSave) return;
    save.run(() => commitEdit());
  };

  const commitEdit = () => {
    if (!shown || !installation) return;
    const saved = saveInstallation(shown);

    /* THE REFERENCE IS THE RECORD'S KEY, so changing it MOVES the record
       rather than renaming it in place — `saveInstallation` has just written a
       second row under the new id. Repoint this workspace at where the site
       moved to, and drop the row it left behind only when no other workspace
       still names it: another year on the same plant is still pointing at the
       old reference, and that workspace is not this screen's to rewrite. */
    if (installation.id && saved.id !== installation.id) {
      const stillNamed = listWorkspaces().some((w) => w.id !== workspace.id && w.installationId === installation.id);
      if (!stillNamed) removeInstallation(installation.id);
    }

    const nextProduct = getCatalogProduct(wsDraft.productId);
    updateWorkspace(workspace.id, {
      installationId: saved.id,
      installationName: saved.name,
      productId: wsDraft.productId,
      // Denormalised at write time, exactly as at creation: a workspace
      // already handed to a verifier keeps saying what it said.
      productName: nextProduct?.name ?? workspace.productName,
      cnCode: nextProduct?.cnCode ?? workspace.cnCode,
      productionRoute: wsDraft.productionRoute,
    });

    setInstallationRead((v) => v + 1);
    refresh();
  };

  return (
    <div className="space-y-5">
      <SectionCard
        title={t("About the installation")}
        helpTitle={t("Why English?")}
        help={<EnglishWhyBody />}
        blurb={
          <>
            What this workspace covers, and what a verifier will scope their engagement against —{" "}
            <strong className="font-medium text-black/70">{t("in English")}</strong>.
          </>
        }
        actions={
          editing ? (
            <>
              <Button size="sm" variant="secondary" onClick={cancelEdit} disabled={save.state !== "idle"}>
                {t("Cancel")}
              </Button>
              <SaveButton
                state={save.state}
                disabled={!canSave}
                onClick={saveEdit}
                icon={<Check size={13} strokeWidth={2} />}
                idleLabel={t("Save")}
                savingLabel={t("Saving…")}
                savedLabel={t("Saved")}
              />
            </>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
              <Pencil size={13} strokeWidth={1.5} /> {t("Edit")}
            </Button>
          )
        }
      >
        {/* ── The site ──────────────────────────────────────────
            The create-an-installation form itself, not a summary of it — see
            the note at the top of this file. Disabled is the read state, so
            the reader is looking at the same fields in the same order they
            will be typing into a moment later. */}
        {shown ? (
          <InstallationFields value={shown} onChange={setInstDraft} existingId={installation?.id} disabled={!editing} />
        ) : (
          <p className="text-[13px] text-black/40">{t("Reading this installation’s record…")}</p>
        )}

        {editing && gaps.length > 0 && (
          <div className="mt-5">
            <Note tone="warn">
              <strong className="font-medium">{t("Save is held until these are answered:")}</strong>
              <ul className="mt-1.5 list-disc space-y-1 pl-4">
                {gaps.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </Note>
          </div>
        )}

        {/* ── What is made here, and how ────────────────────────
            Separate from the site above, and deliberately so — see the note at
            the top of this file. */}
        <div className="mt-6 border-t border-black/[0.07] pt-5">
          <GroupHeading
            helpTitle={t("Why this is a separate block")}
            help={
              <>
                <p>{t("Everything above describes the SITE, and a site outlives any one year of reporting.")}</p>
                <p className="mt-2">
                  {t("These three describe what this workspace is reporting ON: the good, the route it is made by, and the year. The same plant reports a different good next year, under a different route, in a different workspace — so they are kept apart from the record that stays the same.")}
                </p>
              </>
            }
          >
            {t("Product & production route")}
          </GroupHeading>

          {!editing ? (
            <>
              <FactGrid
                rows={[
                  ["Product", workspace.productName],
                  ["CN code", workspace.cnCode || "—"],
                  ["Aggregated goods category", product ? aggregatedGoodsCategory(product) : "—"],
                  ["Production route", route ? `${route.label} — ${route.standardName}` : routeLabel(workspace.productionRoute)],
                  ["Reporting period", `${workspace.periodStart} to ${workspace.periodEnd}`],
                ]}
                badges={
                  <>
                    {product && <TagBadge tone="info">{productType(product)}</TagBadge>}
                    <TagBadge tone={isComplexWorkspace(workspace) ? "warn" : "muted"}>
                      {isComplexWorkspace(workspace) ? "Complex good — has precursors in scope" : "Simple good — no precursors in scope"}
                    </TagBadge>
                    {isComplexWorkspace(workspace) && (
                      <Link
                        href={`/workspaces/${workspace.id}/tree`}
                        className="text-[11px] uppercase tracking-[0.1em] text-black/40 underline underline-offset-2 hover:text-black"
                      >
                        {t("Manage precursors →")}
                      </Link>
                    )}
                  </>
                }
              />

              {route && (
                <p className="mt-4 max-w-3xl text-[12.5px] leading-relaxed text-black/50">
                  <strong className="font-medium text-black/65">{route.hint}</strong> {route.precursors} {route.dominantSource}
                </p>
              )}

              {routeMismatch && category && (
                <p className="mt-4 flex items-start gap-2 rounded-xl border border-[#fde68a] bg-[#fffbeb] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#b45309]">
                  <TriangleAlert size={14} strokeWidth={1.5} className="mt-0.5 flex-none" />
                  <span>
                    <strong className="font-medium">{route ? route.label : routeLabel(workspace.productionRoute)}</strong> {t("is not a production route for")} <strong className="font-medium">{category}</strong> {t("— this workspace’s stored route doesn’t match its stored category. Fix it in Edit.")}
                  </span>
                </p>
              )}
            </>
          ) : (
            <div className="space-y-5">
              <div>
                <span className="mb-2 block text-[11px] uppercase tracking-[0.1em] text-black/55">{t("Product")}</span>
                <ProductPicker value={wsDraft.productId} onChange={(id) => setWsDraft((d) => ({ ...d, productId: id }))} />
                {productChanged && (
                  <div className="mt-3">
                    <Note tone="warn">
                      {t("Changing the product changes the CN code and the aggregated goods category this workspace reports under. The monthly readings stay — they describe the same furnace — but anything already sent to a verifier under the old code will not match.")}
                    </Note>
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("Production route")} hint={draftAggCategory ? `Routes valid for ${draftAggCategory}.` : "Pick a product first."}>
                  <Select
                    value={wsDraft.productionRoute}
                    onChange={(v) => setWsDraft((d) => ({ ...d, productionRoute: v }))}
                    options={routes.map((r) => ({ value: r.id, label: r.label, hint: r.hint }))}
                    placeholder={t("Choose a route")}
                    ariaLabel={t("Production route")}
                  />
                </Field>

                {/* Locked, and the reason is on the screen rather than in a
                    tooltip: the alternative is a control that silently orphans a
                    year of monthly entries. */}
                <Field label={t("Reporting year")} hint={t("Locked. Every month and evidence item here is keyed to it.")}>
                  <div className={cn(inputClass, "flex items-center justify-between gap-2 bg-black/[0.02] text-black/45")}>
                    <span>{workspace.year}</span>
                    <Lock size={13} strokeWidth={1.5} className="flex-none text-black/25" />
                  </div>
                </Field>
              </div>

              <Note>
                {t("To report a different year for the same installation and product, create a second workspace. Two years in one workspace cannot answer “show me March” without asking which March.")}
              </Note>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title={t("Specific embedded emissions")}
        blurb={t("Computed from the monthly entries — numerator and denominator aggregated separately, divided once.")}
      >
        {!see || !see.computable ? (
          <Note>
            Nothing is computable yet. Annual production is the sum of the submitted months, and no month has been submitted — so there is no
            denominator to divide by. Start with{" "}
            <Link href={`/workspaces/${workspace.id}/monthly`} className="underline underline-offset-2">
              {t("Monthly data")}
            </Link>
            .
          </Note>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Stat value={fmt(see.seeDirect, 4)} label={t("SEE direct")} sub={t("tCO₂e per tonne")} />
              <Stat value={fmt(see.seeIndirect, 4)} label={t("SEE indirect")} sub={t("tCO₂e per tonne")} />
              <Stat value={fmt(see.seePrecursor, 4)} label={t("SEE precursor")} sub={t("tCO₂e per tonne")} />
              <Stat value={fmt(see.seeTotal, 4)} label={t("SEE total (reported)")} sub={t("tCO₂e per tonne")} />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Card warm className="p-4">
                <div className="text-[11px] uppercase tracking-[0.1em] text-black/40">{t("Annual production")}</div>
                <div className="mt-1 font-mono text-[15px] text-black/80">{fmt(see.production.tonnes, 3)} t</div>
                <div className="mt-1 text-[11px] text-black/40">{see.production.monthsCounted} of 12 months</div>
              </Card>
              <Card warm className="p-4">
                <div className="text-[11px] uppercase tracking-[0.1em] text-black/40">{t("Direct emissions")}</div>
                <div className="mt-1 font-mono text-[15px] text-black/80">{fmt(see.directTCO2, 2)} tCO₂</div>
                <div className="mt-1 text-[11px] text-black/40">
                  {fmt(see.fuelTCO2, 1)} fuel + {fmt(see.processTCO2, 1)} process
                </div>
              </Card>
              <Card warm className="p-4">
                <div className="text-[11px] uppercase tracking-[0.1em] text-black/40">{t("Chargeable SEE")}</div>
                <div className="mt-1 font-mono text-[15px] text-black/80">{fmt(see.seeChargeable, 4)} tCO₂e/t</div>
                <div className="mt-1 text-[11px] text-black/40">{see.indirectCounted ? "Indirect included" : "Annex II — direct only"}</div>
              </Card>
            </div>

            {/* SEE_g = ae_g + Σ(m_i × SEE_i), spelled out with this workspace's
                own numbers — not just the result. A precursor's contribution
                (M8) is the term most often missing from a hand-rebuilt
                figure, so it is shown alongside the others, not separately. */}
            <div className="mt-5 rounded-xl border border-black/[0.07] bg-white p-4">
              <div className="mb-2 text-[11px] uppercase tracking-[0.1em] text-black/40">{t("The workings")}</div>
              <dl className="space-y-2">
                {see.workings.map((w) => (
                  <div key={w.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 text-[12.5px]">
                    <dt className="text-black/45">
                      <span className="font-mono text-[11px] text-black/30">{w.id}</span> {w.label} — {w.formula}
                    </dt>
                    <dd className="font-mono tabular-nums text-black/70">
                      {w.substitution} = {w.result}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-[11px] leading-relaxed text-black/40">
                M8 (precursor SEE) already includes each supplier&rsquo;s own upstream chain where they gave a verified figure — this workspace does
                not re-derive it. Only a precursor entered without one is drilled into further, on the{" "}
                <Link href={`/workspaces/${workspace.id}/tree`} className="underline underline-offset-2">
                  {t("Precursors")}
                </Link>{" "}
                page.
              </p>
            </div>

            {!see.production.complete && (
              <div className="mt-4">
                <Note tone="warn">
                  {see.production.missingMonths.length} month(s) are not submitted, so the annual figure is <strong>{t("incomplete, not smaller")}</strong>{t(". Every per-tonne figure above divides by a denominator that is missing those months, which overstates them.")}
                </Note>
              </div>
            )}

            {see.errors.length > 0 && (
              <div className="mt-4">
                <Note tone="err">
                  <strong>{t("Rows the arithmetic refused:")}</strong>
                  <ul className="mt-1.5 list-disc space-y-1 pl-4">
                    {see.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </Note>
              </div>
            )}
          </>
        )}
      </SectionCard>

    </div>
  );
}
