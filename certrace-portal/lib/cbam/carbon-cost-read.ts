/* ════════════════════════════════════════════════════════════
   CARBON & COST — READING THE PORTAL

   The tab shows nothing of its own. Every figure is read, each time it is
   opened, from the same stores the rest of the portal writes:

     product reports        listWorkspaces()          which installation, good, year
     monthly data           monthsForWorkspace()      production, fuels, process, electricity
     the SEE engine         workspaceSEE()            direct, indirect, precursor, standing
     precursor chain        (inside workspaceSEE)     verified, unverified and default rows
     products made here     (inside workspaceSEE)     internal precursors
     production route       getRoute()                the benchmark route letter
     carbon price at home   getCarbonPrice()          claimed, never subtracted
     certificate price      latestCertificatePriceFor, getExchangeRate   (Settings)
     EU volume              totalExportVolume()       tonnes shipped to the EU
     the exporter's prices  getUnitCosts()            selling price, tariffs, piece weight

   A month that does not count (a draft, an unsent month) contributes to none
   of it, and a month the plant did not run counts with no tonnes — the same
   rule the report and the verifier pack use, because it is the same engine.
   ════════════════════════════════════════════════════════════ */

import { deriveMonth } from "../monthly-inputs";
import {
  monthCounts,
  monthsForWorkspace,
  FUEL_TYPE_OTHER,
} from "../monthly-data";
import { getCarbonPrice } from "../carbon-price";
import { fuelKey, getUnitCosts } from "../unit-costs";
import {
  getRoute,
  listWorkspaces,
  workspaceCountry,
  type VerificationWorkspace,
} from "../workspace";
import { workspaceSEE } from "../workspace-see";
import { totalExportVolume } from "./export-volumes";
import {
  getExchangeRate,
  getExtraRates,
  latestCertificatePriceFor,
} from "./cost-exposure";
import { workspaceStanding } from "./carbon-scope";
import type { CostEnv, CostFacts, FuelUse } from "./carbon-cost-model";

export function costEnv(): CostEnv {
  const thb = getExchangeRate().eurToThb;
  const extra = getExtraRates();
  return {
    rates: { THB: thb, EUR: 1, CNY: extra.eurToCny, INR: extra.eurToInr },
    certificatePrice: (year) => {
      const row = latestCertificatePriceFor(year);
      return row
        ? { eurPerTonne: row.priceEurPerTco2e, label: row.periodLabel }
        : null;
    },
    eurToThb: getExchangeRate().eurToThb,
  };
}

export function costFactsFor(w: VerificationWorkspace): CostFacts {
  const see = workspaceSEE(w);
  const standing = workspaceStanding(w, see);

  const fuels = new Map<string, FuelUse>();
  let electricityKwh = 0;
  for (const raw of monthsForWorkspace(w).filter(monthCounts)) {
    const entry = deriveMonth(raw);
    electricityKwh += (Number(entry.electricityMwh) || 0) * 1000;
    for (const f of entry.fuels) {
      const quantity = Number(f.quantity) || 0;
      if (!(quantity > 0)) continue;
      const key = fuelKey(f.fuelType, f.fuelTypeOther, f.unit);
      const cur = fuels.get(key) ?? {
        key,
        fuelType: f.fuelType,
        other: f.fuelType === FUEL_TYPE_OTHER ? f.fuelTypeOther : undefined,
        unit: f.unit,
        quantity: 0,
      };
      cur.quantity += quantity;
      fuels.set(key, cur);
    }
  }

  /* The precursor row's own default share is a share of the EXTERNAL chain; products made at the same site are actual figures, so the share
     of the whole precursor term is rebased on what it adds up to. */
  const externalDefault =
    see.precursors.perTonne * see.precursors.defaultValueShare;
  const precursorDefaultShare =
    see.seePrecursor > 0 ? Math.min(1, externalDefault / see.seePrecursor) : 0;

  const home = getCarbonPrice(w.id);
  const unit = getUnitCosts(w.id);

  return {
    id: w.id,
    installationId: w.installationId,
    installationName: w.installationName,
    productId: w.productId,
    productName: w.productName,
    cnCode: w.cnCode,
    year: w.year,
    country: workspaceCountry(w),
    routeLetter: getRoute(w.productionRoute)?.letter,
    indirectCounted: see.indirectCounted,
    tonnes: see.production.tonnes,
    monthsCounted: see.production.monthsCounted,
    directT: see.directTCO2,
    indirectT: see.indirectTCO2,
    precursorT: see.computable ? see.seePrecursor * see.production.tonnes : 0,
    precursorDefaultShare,
    months: see.months.map((m) => ({
      month: m.month,
      tonnes: m.productionTonnes,
      directT: m.directTCO2,
      indirectT: m.indirectTCO2,
      precursorT: see.seePrecursor * m.productionTonnes,
    })),
    reason: standing.reason,
    euTonnes: totalExportVolume(w.id, w.year),
    energy: { fuels: [...fuels.values()], electricityKwh },
    inputs: unit
      ? {
          priceThbPerTonne: unit.priceThbPerTonne,
          pieceKg: unit.pieceKg,
          electricityThbPerKwh: unit.electricityThbPerKwh,
          fuelThbPerUnit: unit.fuelThbPerUnit,
        }
      : null,
    homePrice:
      home.recorded && home.amountPerTonne > 0
        ? {
            amountPerTonne: home.amountPerTonne,
            currency: home.currency,
            sharePct: home.shareOfEmissionsCovered ?? null,
            rebatePerTonne: home.rebateAmountPerTonne ?? 0,
          }
        : null,
  };
}

export const readCostFacts = (): CostFacts[] =>
  listWorkspaces().map(costFactsFor);
