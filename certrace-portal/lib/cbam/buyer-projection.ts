/* ════════════════════════════════════════════════════════════
   WHAT EACH BUYER WILL COST, AND WHERE THE YEAR ENDS UP

   The exporter's question is not "what did we emit". It is the one their
   customer asks on a call: *what is CBAM going to add to my landed cost this
   year, on what I buy from you?* That is a per-buyer question, and until now
   the Carbon & cost screen answered it in aggregate only.

   ── The arithmetic ───────────────────────────────────────────

     embedded(buyer)  = Σ shipments [ tonnes × SEE_chargeable(workspace) ]
     certificates     = embedded                    (one per tonne of CO₂e)
     cost             = certificates × price per certificate
     projection       = cost × 12 ÷ closed months of the year

   SEE_chargeable, not SEE_total. Annex II excludes indirect emissions from
   the chargeable figure for iron & steel, aluminium and hydrogen, and
   lib/workspace-see.ts already resolves that per workspace. Pricing the total
   would overstate every steel exporter's exposure by their whole electricity
   footprint.

   ── Four things it refuses to do ─────────────────────────────

   1. IT NEVER PRICES AN UNPRICEABLE TONNE. A shipment against a workspace with
      no production figure has no SEE, and multiplying by zero would report
      that consignment as free. Those tonnes are counted separately and named,
      so a buyer total that is missing half its volume says so.

   2. THE PROJECTION SHOWS ITS DIVISOR. "Annualised from 5 of 12 months" is an
      estimate a reader can argue with; the same number with no divisor is a
      forecast they will quote back. Below `MIN_MONTHS_TO_PROJECT` months of
      shipping there is no projection at all — one month × 12 is noise.

   3. IT NEVER STRAIGHT-LINES A PART-MONTH. Elapsed share is whole months that
      have CLOSED, so a projection run on the 2nd of July divides by 6, not by
      6.03. Dividing by a part-month inflates the year every time it is run
      early in a month, which is when people run it.

   4. THE CARBON PRICE ALREADY PAID IS NEVER SUBTRACTED. It sits on its own
      line beside the cost. lib/carbon-price.ts sets this rule and gives the
      reason: Thailand's THB 200/tCO₂e lives inside the oil excise structure
      rather than as a standalone carbon tax, and whether the EU accepts it
      under Art. 9 of Reg. (EU) 2023/956 is unsettled. Netting it off would
      hand an exporter a budget that is too low on a question nobody has
      answered — so the cost figure assumes it is disallowed, and the claim is
      shown so a declarant who accepts it can take it off themselves.
   ════════════════════════════════════════════════════════════ */

import { claimedDeduction, getCarbonPrice } from "../carbon-price";
import { loadPricing, type CertificatePricing } from "../carbon-economics";
import { listShipments } from "../shipments";
import { listWorkspaces, type VerificationWorkspace } from "../workspace";
import { workspaceSEE } from "../workspace-see";

/** Below this, annualising is arithmetic rather than information. Two months
    of a seasonal steel order book says almost nothing about twelve. */
export const MIN_MONTHS_TO_PROJECT = 3;

export type BuyerProjection = {
  buyer: string;
  buyerEori?: string;
  shipments: number;
  /** tonnes that could be priced */
  tonnes: number;
  /** tonnes on a workspace with no SEE — excluded from every figure below */
  unpricedTonnes: number;
  /** Σ tonnes × SEE_chargeable */
  embeddedTCO2e: number;
  /** carbon price already paid on those tonnes — a CLAIM, never netted off.
      Reported in the currency it was paid in. */
  claimed: number;
  claimedCurrency: string;
  /** certificates due — one per tonne of chargeable CO₂e */
  certificates: number;
  costEUR: number;
  costTHB: number;
  /** null when there is not enough of the year to extrapolate from */
  projectedCostEUR: number | null;
  projectedTonnes: number | null;
  /** the products this buyer takes, for the row's second line */
  products: string[];
};

export type ProjectionSummary = {
  buyers: BuyerProjection[];
  /** whole months of the reporting year that have closed, 1–12 */
  monthsElapsed: number;
  /** true when `monthsElapsed` is high enough to annualise */
  projectable: boolean;
  totalCostEUR: number;
  totalProjectedEUR: number | null;
  totalUnpricedTonnes: number;
  pricing: CertificatePricing;
  /** workspaces that could not be priced, by name — the reason a total is low */
  unpriceable: string[];
};

/** Whole CLOSED months of `year` as at `asOf`. A future year is 0; a past year
    is 12; the current year counts months strictly before this one. */
export function monthsElapsed(year: number, asOf: Date = new Date()): number {
  const y = asOf.getFullYear();
  if (year < y) return 12;
  if (year > y) return 0;
  return asOf.getMonth(); // 0-indexed month == count of months already closed
}

export function buyerProjections(
  year: number,
  asOf: Date = new Date(),
): ProjectionSummary {
  const pricing = loadPricing();
  const workspaces = listWorkspaces().filter((w) => w.year === year);
  const byId = new Map(workspaces.map((w) => [w.id, w]));

  /* SEE per workspace, computed ONCE. workspaceSEE walks every month of
     activity data; calling it per shipment would make a 300-shipment year
     quadratic in the number of readings. */
  const seeByWorkspace = new Map<
    string,
    { see: number; priceable: boolean; ws: VerificationWorkspace }
  >();
  const unpriceable: string[] = [];
  for (const w of workspaces) {
    const s = workspaceSEE(w);
    const priceable = s.computable && s.seeChargeable > 0;
    seeByWorkspace.set(w.id, {
      see: priceable ? s.seeChargeable : 0,
      priceable,
      ws: w,
    });
    if (!priceable) unpriceable.push(w.productName);
  }

  /* The claim is per WORKSPACE, per tonne of product, in the currency it was
     paid in. Apportioned to buyers by the tonnes each took — the only split
     that does not favour whoever happens to be listed first. */
  const claimPerTonne = new Map<
    string,
    { perTonne: number; currency: string }
  >();
  for (const w of workspaces) {
    const s = seeByWorkspace.get(w.id);
    if (!s?.priceable) {
      claimPerTonne.set(w.id, { perTonne: 0, currency: "" });
      continue;
    }
    const c = claimedDeduction(getCarbonPrice(w.id), s.see);
    claimPerTonne.set(w.id, { perTonne: c.claimed, currency: c.currency });
  }

  const rows = new Map<string, BuyerProjection>();
  let totalUnpricedTonnes = 0;

  for (const sh of listShipments()) {
    if (!sh.workspaceId) continue; // a shipment nobody attributed prices nothing
    const ws = byId.get(sh.workspaceId);
    if (!ws) continue; // another reporting year
    if (sh.date < ws.periodStart || sh.date > ws.periodEnd) continue;

    const entry = rows.get(sh.buyer) ?? {
      buyer: sh.buyer,
      buyerEori: sh.buyerEori,
      shipments: 0,
      tonnes: 0,
      unpricedTonnes: 0,
      embeddedTCO2e: 0,
      claimed: 0,
      claimedCurrency: "",
      certificates: 0,
      costEUR: 0,
      costTHB: 0,
      projectedCostEUR: null,
      projectedTonnes: null,
      products: [],
    };
    entry.shipments += 1;
    if (!entry.products.includes(ws.productName))
      entry.products.push(ws.productName);
    entry.buyerEori = entry.buyerEori ?? sh.buyerEori;

    const s = seeByWorkspace.get(sh.workspaceId);
    if (!s?.priceable) {
      entry.unpricedTonnes += sh.quantityTonnes;
      totalUnpricedTonnes += sh.quantityTonnes;
    } else {
      entry.tonnes += sh.quantityTonnes;
      entry.embeddedTCO2e += sh.quantityTonnes * s.see;
      const c = claimPerTonne.get(sh.workspaceId);
      if (c) {
        entry.claimed += sh.quantityTonnes * c.perTonne;
        // Mixed currencies across one buyer's workspaces would make the total
        // meaningless, so the row says so rather than adding baht to euros.
        entry.claimedCurrency =
          entry.claimedCurrency && entry.claimedCurrency !== c.currency
            ? "mixed"
            : c.currency;
      }
    }
    rows.set(sh.buyer, entry);
  }

  const elapsed = monthsElapsed(year, asOf);
  const projectable = elapsed >= MIN_MONTHS_TO_PROJECT;

  const buyers = [...rows.values()].map((b) => {
    /* One certificate per tonne of chargeable CO₂e. The claim is NOT netted
       off — see rule 4 in the header. */
    const certificates = b.embeddedTCO2e;
    const costEUR = certificates * pricing.pricePerTonneEUR;
    const scale = projectable ? 12 / elapsed : null;
    return {
      ...b,
      certificates,
      costEUR,
      costTHB: costEUR * pricing.thbPerEur,
      projectedCostEUR: scale == null ? null : costEUR * scale,
      projectedTonnes: scale == null ? null : b.tonnes * scale,
    };
  });

  buyers.sort((a, b) => b.costEUR - a.costEUR);

  const totalCostEUR = buyers.reduce((a, b) => a + b.costEUR, 0);
  return {
    buyers,
    monthsElapsed: elapsed,
    projectable,
    totalCostEUR,
    totalProjectedEUR: projectable ? totalCostEUR * (12 / elapsed) : null,
    totalUnpricedTonnes,
    pricing,
    unpriceable: [...new Set(unpriceable)],
  };
}

/** One sentence saying what the projection was extrapolated from — rendered
    beside every projected figure, never separated from it. */
export const projectionBasis = (s: ProjectionSummary): string =>
  s.projectable
    ? `Annualised from ${s.monthsElapsed} closed ${s.monthsElapsed === 1 ? "month" : "months"} of ${12}. It assumes the rest of the year ships at the same rate and at the same emissions intensity.`
    : `Not projected — only ${s.monthsElapsed} ${s.monthsElapsed === 1 ? "month has" : "months have"} closed, and ${MIN_MONTHS_TO_PROJECT} are needed before annualising says anything. The figures shown are what has actually shipped.`;
