"use client";

export const runtime = "edge";

/* ════════════════════════════════════════════════════════════
   OVERVIEW — what this product report is about

   Three things, in this order:

     1. THE PRODUCT, ITS ROUTE AND ITS COUNTRY — the facts that belong to THIS
        report and no other. The good is chosen from the whole CBAM catalogue
        (570 CN codes), the route from the routes the EU actually recognises for
        that CN code (lib/cbam/routes.ts), and the country is the one the rate
        sheet is read for. Under them, what the code leads to: the EU default
        value, the free allocation and the indicative cost.

     2. THE INSTALLATION — read-only here. The operator and installation facts
        are entered ONCE, on the installation page, and every product report made
        there reads them. Editing them from each report is how one site ends up
        with five slightly different addresses, so this card shows the record and
        points to where it is edited.

     3. THE SPECIFIC EMBEDDED EMISSIONS once they are computable, with the
        workings, and a missing list that links straight to the offending tab.

   The reporting YEAR is locked: every monthly entry and evidence item is keyed
   to it, so changing it would leave twelve months of data describing a year the
   report no longer claims to cover. A different year is a new product report.

   SAVING IS EXPLICIT, with one Save, and the Save is held until the route is
   valid for the CN code — a route that does not belong to the good would be
   rejected by a verifier, so it is refused here instead.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { Card, Emphasis, Stat, TagBadge } from "@/components/ui";
import { CnRatePanel } from "@/components/workspace/cn-rate-panel";
import {
  FactGrid,
  Note,
  SectionCard,
  fmt,
} from "@/components/workspace/chrome";
import { useWorkspace } from "@/components/workspace/provider";
import {
  aggregatedGoodsCategory,
  countryName,
  getCatalogProduct,
  productType,
} from "@/lib/config";
import { useInstallationForWorkspace } from "@/lib/installations-query";
import { useWorkspaceSEE } from "@/lib/workspace-data-query";
import {
  letterOfRoute,
  routeIsValidFor,
  routeOptionsFor,
} from "@/lib/cbam/routes";
import { useCountryName, useFormat, useT } from "@/lib/i18n";
import {
  getRoute,
  isComplexWorkspace,
  routeLabel,
  workspaceCountry,
} from "@/lib/workspace";

export default function WorkspaceOverviewPage() {
  const t = useT();
  const countryOf = useCountryName();
  const { date } = useFormat();
  const { workspace } = useWorkspace();
  const see = useWorkspaceSEE(workspace).data ?? null;
  const country = workspaceCountry(workspace);

  const installation =
    useInstallationForWorkspace({
      installationId: workspace.installationId,
      installationName: workspace.installationName,
      selfSupplied: workspace.selfSupplied,
      supplierId: workspace.supplierId,
    }).data ?? null;
  const product = getCatalogProduct(workspace.productId);
  const route = getRoute(workspace.productionRoute);
  /* The hint is the one written for THIS good: a route's description for a
     rolled or coated product says where its steel came from, not how it is
     melted (lib/cbam/routes.ts). */
  const routeText =
    (product
      ? routeOptionsFor(product, { year: workspace.year }).find(
          (o) => o.id === workspace.productionRoute,
        )
      : undefined) ?? route;
  const category = product ? aggregatedGoodsCategory(product) : null;
  const routeMismatch = Boolean(
    product &&
      workspace.productionRoute &&
      !routeIsValidFor(workspace.productionRoute, product),
  );

  return (
    <div className="space-y-5">
      <SectionCard title={t("About this product report")}>
        {/* Read-only: the good, its route and its country are fixed when the report is made. A different product is a new report. */}
        <>
          <FactGrid
            rows={[
              ["Reporting year", String(workspace.year)],
              ["Product", t(workspace.productName)],
              ["CN code", workspace.cnCode || "—"],
              [
                "Aggregated goods category",
                product ? t(aggregatedGoodsCategory(product)) : "—",
              ],
              [
                "Production route",
                route
                  ? `${t(route.label)} — ${t(route.standardName)}`
                  : t(routeLabel(workspace.productionRoute)),
              ],
              [
                "Country of production",
                countryOf(country, countryName(country)),
              ],
              [
                "Reporting period",
                t("{from} to {to}", {
                  from: date(workspace.periodStart),
                  to: date(workspace.periodEnd),
                }),
              ],
            ]}
            badges={
              <>
                {product && (
                  <TagBadge tone="info">{t(productType(product))}</TagBadge>
                )}
                <TagBadge
                  tone={isComplexWorkspace(workspace) ? "warn" : "muted"}
                >
                  {isComplexWorkspace(workspace)
                    ? t("Has precursors")
                    : t("No precursors")}
                </TagBadge>
                {isComplexWorkspace(workspace) && (
                  <Link
                    href={`/workspaces/${workspace.id}/precursors`}
                    className="text-[11px] uppercase tracking-[0.1em] text-black/40 underline underline-offset-2 hover:text-black"
                  >
                    {t("Manage precursors →")}
                  </Link>
                )}
              </>
            }
          />

          {routeText && (
            <p className="mt-4 max-w-3xl text-[12.5px] leading-relaxed text-black/50">
              <strong className="font-medium text-black/65">
                {t(routeText.hint)}
              </strong>{" "}
              {t(routeText.precursors)} {t(routeText.dominantSource)}
            </p>
          )}

          {routeMismatch && category && (
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-[#fde68a] bg-[#fffbeb] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#b45309]">
              <TriangleAlert
                size={14}
                strokeWidth={1.5}
                className="mt-0.5 flex-none"
              />
              <span>
                <strong className="font-medium">
                  {route
                    ? t(route.label)
                    : t(routeLabel(workspace.productionRoute))}
                </strong>{" "}
                {t("is not a production route for")}{" "}
                <strong className="font-medium">CN {workspace.cnCode}</strong>{" "}
                {t(
                  "— the EU recognises other routes for this code. Make a new product report with the right one.",
                )}
              </span>
            </p>
          )}
        </>

        {/* What the CN code leads to — read-only, always for the STORED values. */}
        {product && (
          <div className="mt-6">
            <CnRatePanel
              product={product}
              country={country}
              year={workspace.year}
              routeLetter={letterOfRoute(workspace.productionRoute)}
            />
          </div>
        )}
      </SectionCard>

      <SectionCard
        title={t("Installation")}
        blurb={t(
          "Entered once, on the installation page, and read by every product report made there.",
        )}
        actions={
          <Link
            href={`/workspaces/installation/${encodeURIComponent(workspace.installationId)}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-[12px] text-black/60 transition-colors hover:border-black/25 hover:text-black"
          >
            {t("Open installation")} <ArrowRight size={13} strokeWidth={1.5} />
          </Link>
        }
      >
        {installation ? (
          <FactGrid
            rows={[
              [
                "Name of the installation",
                installation.name || workspace.installationName,
              ],
              [
                "Installation reference",
                installation.id || workspace.installationId,
              ],
              ["UN/LOCODE", installation.unlocode || "—"],
              [
                "Address",
                [
                  installation.street,
                  installation.city,
                  installation.postcode,
                  countryOf(
                    installation.country,
                    countryName(installation.country),
                  ),
                ]
                  .filter(Boolean)
                  .join(", ") || "—",
              ],
              [
                "Main emission source",
                installation.lat && installation.lng
                  ? `${installation.lat}, ${installation.lng}`
                  : "—",
              ],
            ]}
          />
        ) : (
          <p className="text-[13px] text-black/40">
            {t("Reading this installation’s record…")}
          </p>
        )}
      </SectionCard>

      <SectionCard
        title={t("Specific embedded emissions")}
        blurb={t(
          "Computed from the monthly entries — numerator and denominator aggregated separately, divided once.",
        )}
      >
        {!see || !see.computable ? (
          <Note>
            {t(
              "Nothing to compute yet — no month has been submitted. Start with",
            )}{" "}
            <Link
              href={`/workspaces/${workspace.id}/monthly`}
              className="underline underline-offset-2"
            >
              {t("Monthly data")}
            </Link>
            .
          </Note>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                value={fmt(see.seeDirect, 4)}
                label={t("SEE direct")}
                sub={t("tCO₂e per tonne")}
              />
              <Stat
                value={fmt(see.seeIndirect, 4)}
                label={t("SEE indirect")}
                sub={t("tCO₂e per tonne")}
              />
              <Stat
                value={fmt(see.seePrecursor, 4)}
                label={t("SEE precursor")}
                sub={t("tCO₂e per tonne")}
              />
              <Stat
                value={fmt(see.seeTotal, 4)}
                label={t("SEE total (reported)")}
                sub={t("tCO₂e per tonne")}
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Card warm className="p-4">
                <div className="text-[11px] uppercase tracking-[0.1em] text-black/40">
                  {t("Annual production")}
                </div>
                <div className="mt-1 font-mono text-[15px] text-black/80">
                  {fmt(see.production.tonnes, 3)} t
                </div>
                <div className="mt-1 text-[11px] text-black/40">
                  {t("{n} of 12 months", { n: see.production.monthsCounted })}
                </div>
              </Card>
              <Card warm className="p-4">
                <div className="text-[11px] uppercase tracking-[0.1em] text-black/40">
                  {t("Direct emissions")}
                </div>
                <div className="mt-1 font-mono text-[15px] text-black/80">
                  {fmt(see.directTCO2, 2)} tCO₂
                </div>
                <div className="mt-1 text-[11px] text-black/40">
                  {t("{fuel} fuel + {process} process", {
                    fuel: fmt(see.fuelTCO2, 1),
                    process: fmt(see.processTCO2, 1),
                  })}
                </div>
              </Card>
              <Card warm className="p-4">
                <div className="text-[11px] uppercase tracking-[0.1em] text-black/40">
                  {t("Chargeable SEE")}
                </div>
                <div className="mt-1 font-mono text-[15px] text-black/80">
                  {fmt(see.seeChargeable, 4)} tCO₂e/t
                </div>
                <div className="mt-1 text-[11px] text-black/40">
                  {see.indirectCounted
                    ? t("Indirect included")
                    : t("Annex II — direct only")}
                </div>
              </Card>
            </div>

            {/* SEE_g = ae_g + Σ(m_i × SEE_i), spelled out with this workspace's
                own numbers — not just the result. A precursor's contribution
                (M8) is the term most often missing from a hand-rebuilt
                figure, so it is shown alongside the others, not separately. */}
            <div className="mt-5 rounded-xl border border-black/[0.07] bg-white p-4">
              <div className="mb-2 text-[11px] uppercase tracking-[0.1em] text-black/40">
                {t("The workings")}
              </div>
              <dl className="space-y-2">
                {see.workings.map((w) => (
                  <div
                    key={w.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 text-[12.5px]"
                  >
                    <dt className="text-black/45">
                      <span className="font-mono text-[11px] text-black/30">
                        {w.id}
                      </span>{" "}
                      {t(w.label)} — {w.formula}
                    </dt>
                    <dd className="font-mono tabular-nums text-black/70">
                      {w.substitution} = {w.result}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-[11px] leading-relaxed text-black/40">
                M8 (precursor SEE) already includes each supplier&rsquo;s own
                upstream chain where they gave a verified figure — this
                workspace does not re-derive it. Only a precursor entered
                without one is drilled into further, on the{" "}
                <Link
                  href={`/workspaces/${workspace.id}/precursors`}
                  className="underline underline-offset-2"
                >
                  {t("Precursors")}
                </Link>{" "}
                page.
              </p>
            </div>

            {!see.production.complete && (
              <div className="mt-4">
                <Note tone="warn">
                  <Emphasis
                    text={
                      see.production.missingMonths.length === 1
                        ? t(
                            "1 month is not submitted, so the annual figure is **incomplete, not smaller**. Every per-tonne figure above divides by a denominator that is missing that month, which overstates them.",
                          )
                        : t(
                            "{n} months are not submitted, so the annual figure is **incomplete, not smaller**. Every per-tonne figure above divides by a denominator that is missing those months, which overstates them.",
                            { n: see.production.missingMonths.length },
                          )
                    }
                  />
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
