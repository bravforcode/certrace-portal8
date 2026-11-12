"use client";

/* CBAM cost what-if: today's estimate against a scenario, both as certificate cost in the chosen currency.
   The maths lives in lib/factory/what-if.ts; this panel only holds the inputs and shows the results. */

import * as React from "react";
import { Button, Card, Field, NumberInput } from "@/components/ui";
import { ErrorState, LoadingState } from "@/components/query-state";
import { useT, useFormat } from "@/lib/i18n";
import { getInstallation } from "@/lib/installations";
import { useWorkbook } from "@/lib/workbook/use-workbook";
import {
  estimateEmissions,
  type EmissionEstimate,
} from "@/lib/workbook/estimate";
import type { Currency, CostEnv } from "@/lib/cbam/carbon-cost-model";
import { useMoney } from "@/components/carbon-cost/money";
import {
  compareWhatIf,
  scenarioOpportunity,
  type WhatIfInput,
} from "@/lib/factory/what-if";
import {
  LIST_FULL,
  SAVE_FAILED,
  saveOpportunity,
} from "@/lib/factory/opportunity-store";

/** The price used when the cost page has none for this year. */
const FALLBACK_PRICE_EUR = 80;

type Env = Pick<CostEnv, "certificatePrice" | "rates">;

export function WhatIfPanel({
  installationId,
  year,
  env,
  currency,
}: {
  installationId: string;
  year: number;
  env: Env;
  currency: Currency;
}) {
  const wb = useWorkbook(installationId, year);
  const country = getInstallation(installationId)?.country ?? "";
  const estimate = React.useMemo(
    () => (wb.loaded ? estimateEmissions(wb.sheets, { country, year }) : null),
    [wb.loaded, wb.sheets, country, year],
  );
  if (wb.error) return <ErrorState onRetry={wb.retry} />;
  if (!estimate) return <LoadingState />;
  const productCn =
    (wb.sheets.find((s) => s.id === "products")?.rows ?? [])
      .map((r) => (r.cells.cn ?? "").trim())
      .find((cn) => cn !== "") ?? "";
  return (
    <WhatIfForm
      key={`${installationId}:${year}:${estimate.productionT}`}
      installationId={installationId}
      year={year}
      estimate={estimate}
      productCn={productCn}
      publishedPrice={env.certificatePrice(year)?.eurPerTonne ?? null}
      env={env}
      currency={currency}
    />
  );
}

function WhatIfForm({
  installationId,
  year,
  estimate: e,
  productCn,
  publishedPrice,
  env,
  currency,
}: {
  installationId: string;
  year: number;
  estimate: EmissionEstimate;
  productCn: string;
  publishedPrice: number | null;
  env: Env;
  currency: Currency;
}) {
  const t = useT();
  const { number } = useFormat();
  const money = useMoney(currency, env.rates);
  const eurMoney = useMoney("EUR", env.rates);
  const [saveMsg, setSaveMsg] = React.useState<{
    ok: boolean;
    key: string;
  } | null>(null);

  // Undefined means the field was cleared. It is kept apart from 0 so a blank field is never priced as zero.
  const [exported, setExported] = React.useState<number | undefined>(
    e.productionT,
  );
  const [price, setPrice] = React.useState<number | undefined>(
    publishedPrice ?? FALLBACK_PRICE_EUR,
  );
  const [actuals, setActuals] = React.useState<
    Record<string, number | undefined>
  >({});

  // Today: the estimate as it stands, exporting all of its production at the published price.
  const base: WhatIfInput = {
    exportedT: e.productionT,
    priceEur: publishedPrice ?? FALLBACK_PRICE_EUR,
    productCn,
    year,
    precursorActual: {},
  };
  const next: WhatIfInput = {
    exportedT: exported ?? null,
    priceEur: price ?? null,
    productCn,
    year,
    precursorActual: actuals,
  };
  const {
    base: today,
    next: scen,
    deltaEur,
    deltaT,
  } = compareWhatIf(e, base, next);
  const saving = deltaEur === null ? null : -deltaEur;
  const exportOver =
    exported !== undefined &&
    Number.isFinite(exported) &&
    exported > e.productionT;
  const missing =
    exported === undefined ||
    !Number.isFinite(exported) ||
    price === undefined ||
    !Number.isFinite(price);
  const noEstimate = e.productionT <= 0;
  const saveDisabled =
    noEstimate || missing || exportOver || saving === null || saving <= 0;

  const onSave = async () => {
    if (saving === null || deltaT === null) return;
    try {
      await saveOpportunity(
        scenarioOpportunity({
          installationId,
          year,
          e,
          base,
          next,
          savingEur: saving,
          savingT: -deltaT,
        }),
      );
      setSaveMsg({ ok: true, key: "Saved as opportunity." });
    } catch (err) {
      setSaveMsg({
        ok: false,
        key:
          err instanceof Error && err.message === LIST_FULL
            ? LIST_FULL
            : SAVE_FAILED,
      });
    }
  };

  const deltaText =
    deltaEur === null
      ? "—"
      : `${deltaEur > 0 ? "+" : deltaEur < 0 ? "−" : "±"}${money.full(Math.abs(deltaEur))}`;
  const deltaTone =
    deltaEur === null || deltaEur === 0
      ? "text-black/60"
      : deltaEur < 0
        ? "text-ok-text"
        : "text-err-text";

  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-light text-black/80">
          {t("Simulate CBAM cost")}
        </h2>
        {productCn && (
          <p className="text-xs text-black/50">
            {t("Product CN {cn}", { cn: productCn })}
          </p>
        )}
        {e.indirectExcludedT > 0 && (
          <p className="text-xs text-black/50">
            {t("Indirect emissions do not count for this good.")}
          </p>
        )}
      </div>

      {noEstimate ? (
        <p className="text-sm text-black/60">
          {t("Add product quantities in the Products sheet first.")}
        </p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <section
              aria-labelledby="whatif-today"
              className="space-y-2 rounded-md border border-black/10 p-3"
            >
              <h3
                id="whatif-today"
                className="text-sm font-medium text-black/70"
              >
                {t("Today")}
              </h3>
              <Result
                perTonne={today.chargeablePerTonne}
                certificates={today.certificatesT}
                cost={money.full(today.costEur)}
                costEur={eurMoney.full(today.costEur)}
                vsDefault={today.savingVsDefaultEur}
                money={money}
                t={t}
                number={number}
              />
            </section>

            <section
              aria-labelledby="whatif-scenario"
              className="space-y-3 rounded-md border border-black/10 p-3"
            >
              <h3
                id="whatif-scenario"
                className="text-sm font-medium text-black/70"
              >
                {t("Scenario")}
              </h3>
              <div>
                <Field
                  label={t("Exported to the EU (t/year)")}
                  hint={t(
                    "Production is {n} t a year; exports cannot exceed it.",
                    { n: number(e.productionT) },
                  )}
                >
                  <NumberInput
                    value={exported}
                    onChange={setExported}
                    min={0}
                    unit="t"
                    invalid={exportOver}
                    ariaDescribedBy={
                      exportOver ? "whatif-exported-error" : undefined
                    }
                  />
                </Field>
                {exportOver && (
                  <p
                    id="whatif-exported-error"
                    className="mt-1 text-xs text-err-text"
                  >
                    {t("Exported tonnes cannot exceed production.")}
                  </p>
                )}
              </div>
              <Field
                label={t("Certificate price (EUR/t CO₂)")}
                hint={
                  publishedPrice === null
                    ? t("Typical EU ETS price; replace with your own")
                    : undefined
                }
              >
                <NumberInput
                  value={price}
                  onChange={setPrice}
                  min={0}
                  unit="€"
                />
              </Field>
              {e.precursors.length > 0 && (
                <fieldset className="space-y-3">
                  <legend className="text-xs text-black/60">
                    {t("Supplier actual (t CO₂e/t)")}
                  </legend>
                  <p className="text-xs text-black/50">
                    {t("Blank uses the default.")}
                  </p>
                  {e.precursors.map((p) => (
                    <Field
                      key={p.key}
                      label={`${p.item || p.cn} (CN ${p.cn}) · ${t("Default SEE (t CO₂e/t)")} ${number(p.defaultSee, { maximumFractionDigits: 3 })}`}
                    >
                      <NumberInput
                        value={actuals[p.key]}
                        onChange={(v) =>
                          setActuals((a) => ({ ...a, [p.key]: v }))
                        }
                        min={0}
                      />
                    </Field>
                  ))}
                </fieldset>
              )}
              {missing && (
                <p className="text-xs text-warn-text">
                  {t("Fill in the exported tonnes and price to see the cost.")}
                </p>
              )}
              <Result
                perTonne={scen.chargeablePerTonne}
                certificates={scen.certificatesT}
                cost={money.full(scen.costEur)}
                costEur={eurMoney.full(scen.costEur)}
                vsDefault={scen.savingVsDefaultEur}
                money={money}
                t={t}
                number={number}
              />
              <p className={`text-sm ${deltaTone}`} role="status">
                {t("Scenario changes cost by {amount}", { amount: deltaText })}
              </p>
            </section>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void onSave()} disabled={saveDisabled}>
              {t("Save as opportunity")}
            </Button>
            {saveMsg && (
              <p
                role={saveMsg.ok ? "status" : "alert"}
                className={
                  saveMsg.ok ? "text-sm text-ok-text" : "text-sm text-err-text"
                }
              >
                {t(saveMsg.key)}
              </p>
            )}
          </div>
        </>
      )}

      <p className="text-xs text-black/50">
        {t("Estimate from EU default factors.")}{" "}
        {t(
          "Gross cost before free allocation and any carbon price paid in the country of origin.",
        )}
      </p>
    </Card>
  );
}

function Result({
  perTonne,
  certificates,
  cost,
  costEur,
  vsDefault,
  money,
  t,
  number,
}: {
  perTonne: number;
  certificates: number | null;
  cost: string;
  costEur: string;
  vsDefault: number | null;
  money: ReturnType<typeof useMoney>;
  t: ReturnType<typeof useT>;
  number: ReturnType<typeof useFormat>["number"];
}) {
  const fmt = (v: number | null) =>
    v === null ? "—" : number(v, { maximumFractionDigits: 2 });
  const vs =
    vsDefault === null
      ? "—"
      : vsDefault >= 0
        ? t("Saves {amount} against default values", {
            amount: money.full(vsDefault),
          })
        : t("Costs {amount} more than default values", {
            amount: money.full(-vsDefault),
          });
  return (
    <dl className="grid grid-cols-2 gap-2 text-sm">
      <dt className="text-black/60">{t("Chargeable (t CO₂e per t)")}</dt>
      <dd className="text-right">{fmt(perTonne)}</dd>
      <dt className="text-black/60">{t("Certificates (t CO₂e)")}</dt>
      <dd className="text-right">{fmt(certificates)}</dd>
      <dt className="text-black/60">{t("Cost")}</dt>
      <dd className="text-right font-medium">
        {cost}
        <span className="block text-xs font-normal text-black/50">
          {costEur}
        </span>
      </dd>
      <dt className="text-black/60">{t("vs default values")}</dt>
      <dd className="text-right">{vs}</dd>
    </dl>
  );
}
