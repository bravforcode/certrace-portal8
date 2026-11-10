"use client";

/* The two annual sections that used to sit on a product report's Readiness tab
   and now sit, per product report, on the INSTALLATION's Readiness tab: the
   materiality self-check and the carbon price paid at the country of origin.

   They stay per product report because the data is: the share of a good's
   emissions that is estimated, and the price a home-country instrument charges
   on it, are facts about one good in one year. What moved is where they are
   read — together, for every report of the year, beside the report set they
   gate. */

import * as React from "react";
import {
  AutoSaveBadge,
  Field,
  inputClass,
  cn,
  useAutoSave,
} from "@/components/ui";
import { Select } from "@/components/controls";
import { Note, SectionCard, fmt } from "@/components/workspace/chrome";
import { SectionEvidence } from "@/components/workspace/evidence-panel";
import {
  CARBON_PRICE_CLAIMED_NOTE,
  CARBON_PRICE_INSTRUMENTS,
  CARBON_PRICE_INSTRUMENT_HINT,
  CARBON_PRICE_INSTRUMENT_LABEL,
  claimedDeduction,
  sameCarbonPriceAnswers,
  THAILAND_EXCISE_CARBON_PRICE,
  type CarbonPriceInstrument,
  type CarbonPriceRecord,
} from "@/lib/carbon-price";
import {
  materiality,
  MATERIALITY_THRESHOLD,
  type WorkspaceReadiness,
} from "@/lib/readiness";
import { CARBON_PRICE_KEY } from "@/lib/workspace-evidence";
import { useSaveCarbonPrice } from "@/lib/workspace-data-query";
import { workspaceSEE } from "@/lib/workspace-see";
import type { VerificationWorkspace } from "@/lib/workspace";
import { useT } from "@/lib/i18n";

const numeric = (v: string): number => {
  const n = Number(v.replace(/[,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/* ── Materiality ────────────────────────────────────────────── */
export function MaterialityBlock({
  workspace,
  readiness,
}: {
  workspace: VerificationWorkspace;
  readiness: WorkspaceReadiness;
}) {
  const t = useT();
  // materiality() reads the MMD/monthly stores at call time; readiness is the
  // recompute trigger, not an input the closure names.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mat = React.useMemo(
    () => materiality(workspace),
    [workspace, readiness],
  );
  return (
    <div className="grid gap-4 sm:grid-cols-4">
      <div>
        <div className="font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
          {fmt(mat.estimatedTCO2e, 2)}
        </div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.1em] text-black/40">
          {t("tCO₂e estimated")}
        </div>
      </div>
      <div>
        <div className="font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
          {fmt(mat.totalTCO2e, 2)}
        </div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.1em] text-black/40">
          {t("tCO₂e total")}
        </div>
      </div>
      <div>
        <div
          className={cn(
            "font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight",
            mat.overThreshold ? "text-[#dc2626]" : "text-[#111]",
          )}
        >
          {fmt(mat.share * 100, 2)}%
        </div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.1em] text-black/40">
          {t("estimated share · threshold {threshold}%", {
            threshold: MATERIALITY_THRESHOLD.value * 100,
          })}
        </div>
      </div>
      <div className="flex items-center">
        <p className="text-[13px] text-black/50">
          {mat.overThreshold
            ? "Past 5% the estimate is the number. Close the largest gaps with primary data before engaging a verifier."
            : t("Within the self-check threshold.")}
        </p>
      </div>
    </div>
  );
}

/* ── The carbon price — saved as it is typed ────────────────────
   Like every other form in the portal: no Edit, Save or Cancel, a badge that says "All changes saved". The draft is held for the
   debounce, so a half-typed amount is not written on every keystroke. */
export function CarbonPriceCard({
  workspace,
  price,
  see,
  priceEvidenced,
  onEvidenceChange,
  refresh,
}: {
  workspace: VerificationWorkspace;
  price: CarbonPriceRecord;
  see: ReturnType<typeof workspaceSEE> | null;
  priceEvidenced: boolean;
  onEvidenceChange: () => void;
  refresh: () => void;
}) {
  const t = useT();
  const saveRecord = useSaveCarbonPrice();
  const [draft, setDraft] = React.useState<CarbonPriceRecord>(price);
  const autosave = useAutoSave(draft, (d) =>
    saveRecord.mutateAsync(d, { onSuccess: refresh }),
  );

  // The record changed underneath (a receipt attached, another tab): take it, unless something typed is still waiting to be saved.
  React.useEffect(() => {
    if (autosave.status !== "pending" && autosave.status !== "saving")
      setDraft((current) =>
        sameCarbonPriceAnswers(current, price) ? current : price,
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price]);

  const set = (p: Partial<CarbonPriceRecord>) =>
    setDraft((d) => ({ ...d, ...p }));
  const shown = draft;

  return (
    <SectionCard
      id={`carbon-price-${workspace.id}`}
      title={t("Carbon price paid in the country of origin")}
      blurb={t(
        "Yearly. Zero is a valid answer — enter it, don't leave it blank.",
      )}
      actions={
        <AutoSaveBadge status={autosave.status} savedAt={autosave.savedAt} />
      }
    >
      {/* NO CURRENCY PICKER. The claim is read off a receipt issued in one
          currency, and the record already carries it — offering a dropdown
          beside the amount invites relabelling 200 THB as 200 EUR without
          touching the figure, which is a forty-fold change to a claim against
          a liability. The unit is stated on the field instead. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field
          label={t("Amount per tCO₂e ({currency})", {
            currency: shown.currency,
          })}
        >
          <input
            className={inputClass}
            inputMode="decimal"
            value={shown.amountPerTonne || ""}
            onChange={(e) => set({ amountPerTonne: numeric(e.target.value) })}
            placeholder="200"
          />
        </Field>
        <Field
          label={t("Instrument")}
          hint={t(CARBON_PRICE_INSTRUMENT_HINT[shown.instrument])}
        >
          <Select
            value={shown.instrument}
            onChange={(v) => set({ instrument: v as CarbonPriceInstrument })}
            options={CARBON_PRICE_INSTRUMENTS.map((i) => ({
              value: i,
              label: t(CARBON_PRICE_INSTRUMENT_LABEL[i]),
              hint: t(CARBON_PRICE_INSTRUMENT_HINT[i]),
            }))}
          />
        </Field>
        <Field
          label={t("Share of emissions covered (%)")}
          hint={t(
            "What share, 0 to 100%, of this good's total specific embedded emissions this instrument actually applies to. If unsure, 100% is rarely correct — check your documentation rather than guessing.",
          )}
        >
          <input
            className={inputClass}
            inputMode="decimal"
            value={shown.shareOfEmissionsCovered ?? ""}
            onChange={(e) =>
              set({ shareOfEmissionsCovered: numeric(e.target.value) })
            }
            placeholder="40"
          />
        </Field>
        <Field
          label={t("Rebates or free allocation")}
          hint={t("Any offset received against the above, in words.")}
        >
          <input
            className={inputClass}
            value={shown.rebates ?? ""}
            onChange={(e) => set({ rebates: e.target.value })}
          />
        </Field>
      </div>

      {/* WHAT ARTICLE 9 ASKS THE DECLARANT TO KEEP, and what the EU template subtracts. The rebate has to be a figure, because the report deducts a
          number — a sentence about it cannot change the arithmetic. The legal references and the independent certifier are records, asked for
          once a price is claimed. */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          label={t("Rebate per tCO₂e ({currency})", {
            currency: shown.currency,
          })}
          hint={t(
            "The same offset as a figure, so the report can take it off. 0 if there was none.",
          )}
        >
          <input
            className={inputClass}
            inputMode="decimal"
            value={shown.rebateAmountPerTonne || ""}
            onChange={(e) =>
              set({ rebateAmountPerTonne: numeric(e.target.value) })
            }
            placeholder="0"
          />
        </Field>
        <Field
          label={t("Charged under")}
          hint={t(
            "The law or regulation the price is charged under — Article 9 asks for the reference. Write it in English.",
          )}
        >
          <input
            className={inputClass}
            value={shown.legalBasis ?? ""}
            onChange={(e) => set({ legalBasis: e.target.value })}
            placeholder={t("The act or regulation, and its article")}
          />
        </Field>
        <Field
          label={t("Payment certified by")}
          hint={t(
            "The independent person who certified the payment records — name and contact. Not someone from your own company.",
          )}
        >
          <input
            className={inputClass}
            value={shown.certifiedBy ?? ""}
            onChange={(e) => set({ certifiedBy: e.target.value })}
            placeholder={t("Auditor name, firm, email")}
          />
        </Field>
      </div>

      {price.amountPerTonne > 0 && see?.computable && (
        <p className="mt-4 text-[13px] text-black/55">
          {t("Claimed deduction for the year:")}{" "}
          <strong className="font-mono">
            {fmt(
              claimedDeduction(price, see.seeChargeable * see.production.tonnes)
                .claimed,
              0,
            )}{" "}
            {price.currency}
          </strong>
        </p>
      )}

      <div className="mt-4 space-y-3">
        <Note tone="warn">{t(CARBON_PRICE_CLAIMED_NOTE)}</Note>
        {price.instrument === "excise_embedded" && (
          <Note>
            {t(
              "Thailand’s {value} THB/tCO₂e sits inside this: {source}. If you burn diesel or fuel oil, the honest answer to “what carbon price did you pay?” is no longer zero — attach the excise receipt below and let your verifier see the claim.",
              {
                value: THAILAND_EXCISE_CARBON_PRICE.value,
                source: t(THAILAND_EXCISE_CARBON_PRICE.source),
              },
            )}
          </Note>
        )}
        {price.amountPerTonne > 0 &&
          !price.evidenceItemId &&
          !priceEvidenced && (
            <Note tone="err">
              {t(
                "An amount above zero is claimed with no payment evidence attached. Attach the excise or tax receipt below.",
              )}
            </Note>
          )}
        {price.amountPerTonne > 0 && price.shareOfEmissionsCovered == null && (
          <Note tone="err">
            {t(
              "Zero is not a safe default here — enter the real share of this good's emissions the instrument actually covers before this can be submitted.",
            )}
          </Note>
        )}
        {price.amountPerTonne > 0 &&
          (!price.legalBasis?.trim() || !price.certifiedBy?.trim()) && (
            <Note tone="warn">
              {t(
                "To stand as a claim, Article 9 also asks for the law the price is charged under and a payment certified by an independent person. They do not hold this tab back, but the report prints them as not recorded until they are here.",
              )}
            </Note>
          )}
      </div>

      {/* The receipt attaches beside the claim it evidences. `openable`
          because what a reader wants from a receipt is to READ it — a review
          badge belongs to the extraction workflow, not to the document. */}
      <div className="mt-5 border-t border-black/[0.06] pt-5">
        <SectionEvidence
          workspaceId={workspace.id}
          keys={[CARBON_PRICE_KEY]}
          openable
          emptyLabel={t(
            "No receipt attached. A claimed deduction with nothing behind it is the first thing a verifier removes.",
          )}
          onChange={onEvidenceChange}
        />
      </div>
    </SectionCard>
  );
}
