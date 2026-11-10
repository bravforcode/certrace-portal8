import { accountStorage } from "./account-storage";
/* ════════════════════════════════════════════════════════════
   CARBON ECONOMICS — what the emissions actually cost, and where they sit

   Stage 1 (lib/compliance-engine.ts) answers "how many chargeable tonnes".
   This module answers the two questions an exporter asks next:

     What does that cost?   chargeable tCO₂e × certificate price, less the
                            carbon price already paid at home. A tonne of CO₂
                            is an abstraction; €48,000 on a quarter's shipments
                            is a number a managing director acts on.

     Where does it come from?  the hotspot ranking — which supplier, and which
                            good, carries the share. A declaration where one
                            mill is 60% of the bill is a completely different
                            commercial problem from one spread evenly, and the
                            totals alone never show that.

   Same discipline as the engine it reads from: pure functions of already-
   computed facts, no model calls, no hidden state. The certificate PRICE is
   the one input a human sets — it moves weekly in the real market — so it's
   persisted separately and passed in, never baked into a calculation.
   ════════════════════════════════════════════════════════════ */

import {
  EU_ETS_PROXY_EUR_PER_TCO2E,
  THB_PER_EUR,
  type ComplianceFacts,
  type ProductFacts,
} from "./compliance-engine";
import { getCatalogProduct } from "./config";
import { benchmark, defaultValueForId, type Benchmark } from "./default-values";
import { P_CERT_SOURCE } from "./cbam/reference";

/* ── The price of one certificate ──────────────────────────────
   One CBAM certificate covers one tonne of CO₂e and is priced off the EU ETS
   auction average — quarterly through 2026, weekly from 2027. It is not a
   Certrace number, so the exporter can set the figure they're planning
   against, and every cost on screen moves with it. */
export type CertificatePricing = {
  /** EUR per tCO₂e — one certificate, one tonne */
  pricePerTonneEUR: number;
  /** THB per EUR, for exporters who budget in baht */
  thbPerEur: number;
};

export const DEFAULT_PRICING: CertificatePricing = {
  pricePerTonneEUR: EU_ETS_PROXY_EUR_PER_TCO2E,
  thbPerEur: THB_PER_EUR,
};

const PRICING_KEY = "certrace:certificate-pricing";

export function loadPricing(): CertificatePricing {
  if (typeof window === "undefined") return DEFAULT_PRICING;
  try {
    const raw = accountStorage.getItem(PRICING_KEY);
    if (!raw) return DEFAULT_PRICING;
    const p = JSON.parse(raw) as Partial<CertificatePricing>;
    return {
      pricePerTonneEUR:
        Number(p.pricePerTonneEUR) > 0
          ? Number(p.pricePerTonneEUR)
          : DEFAULT_PRICING.pricePerTonneEUR,
      thbPerEur:
        Number(p.thbPerEur) > 0
          ? Number(p.thbPerEur)
          : DEFAULT_PRICING.thbPerEur,
    };
  } catch {
    return DEFAULT_PRICING;
  }
}

/* ── Where the price comes from ─────────────────────────────────
   ONE accessor, so every screen that shows money also shows what the price
   behind it actually is. The architecture decision — live EU ETS auction
   feed vs an admin-maintained variable — has not been made (spec §9), and
   until it is, the figure on screen is one the exporter typed. That is a
   perfectly good planning number and a completely inadequate basis for
   telling someone what they will pay, so the distinction travels with it
   rather than being buried in a footnote. */
export type PricingSource = {
  pricePerTonneEUR: number;
  resolved: boolean;
  warning: string;
  actionRequired: string;
};

export function certificatePriceSource(
  pricing: CertificatePricing = loadPricing(),
): PricingSource {
  return {
    pricePerTonneEUR: pricing.pricePerTonneEUR,
    resolved: P_CERT_SOURCE.resolved,
    warning: P_CERT_SOURCE.warning,
    actionRequired: P_CERT_SOURCE.actionRequired,
  };
}

export function savePricing(pricing: CertificatePricing): void {
  if (typeof window === "undefined") return;
  try {
    accountStorage.setItem(PRICING_KEY, JSON.stringify(pricing));
  } catch {
    /* ignore quota */
  }
}

/* ── Cost ──────────────────────────────────────────────────────
   certificates = chargeable tCO₂e (Annex II rule + default markup already
   applied by the engine) · gross cost = certificates × price · the carbon
   price the supplier already paid at home is deducted, floored at zero. */
export type ProductCost = ProductFacts & {
  certificates: number;
  grossCostEUR: number;
  /** the same good priced on the EU fallback default instead of reported data */
  defaultCostEUR: number | null;
  /* What NOT having this data would cost — the default-value penalty, at the
     year's markup. Positive = the missing data is expensive. Negative = this
     good is dirtier than the published default, which is an ADDED cost of
     reporting actual data, never a "negative saving". Never framed as a
     saving: a default value is a penalty for absent data, not a discount. */
  dataGapRiskEUR: number | null;
  benchmark: Benchmark | null;
};

export type SupplierCost = {
  supplierId: string;
  supplierName: string;
  products: ProductCost[];
  tonnes: number;
  grossTCO2e: number;
  chargeableTCO2e: number;
  grossCostEUR: number;
  carbonPriceCreditEUR: number;
  netCostEUR: number;
  dataGapRiskEUR: number;
  /** share of the declaration's chargeable emissions, 0–1 */
  share: number;
};

export type CostBreakdown = {
  pricing: CertificatePricing;
  suppliers: SupplierCost[];
  totalTonnes: number;
  totalGrossTCO2e: number;
  totalChargeableTCO2e: number;
  totalCertificates: number;
  grossCostEUR: number;
  carbonPriceCreditEUR: number;
  netCostEUR: number;
  netCostTHB: number;
  /** what the same shipments would cost reported entirely on default values —
      the counterfactual the Data Gap Risk figure is measured against */
  defaultCostEUR: number;
  dataGapRiskEUR: number;
  /** effective cost per tonne of goods shipped — the number that reaches a price list */
  costPerTonneOfGoodsEUR: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Cost the whole declaration from Stage 1's facts. */
export function computeCost(
  facts: ComplianceFacts,
  pricing: CertificatePricing = DEFAULT_PRICING,
): CostBreakdown {
  const price = pricing.pricePerTonneEUR;
  const suppliers: SupplierCost[] = [];

  let totalTonnes = 0;
  let totalGross = 0;
  let totalChargeable = 0;
  let grossCost = 0;
  let credit = 0;
  let defaultCost = 0;

  for (const sf of Object.values(facts.perSupplier)) {
    const products: ProductCost[] = sf.products.map((p) => {
      const catalog = getCatalogProduct(p.productId);
      const dv = defaultValueForId(p.productId);
      /* Priced on defaults, a good carries the fallback's DIRECT figure (the
         Annex II chargeable base for steel & aluminium) plus the year's markup
         — the same treatment the engine applies to a default-method product. */
      const defaultChargeablePerTonne = dv
        ? dv.seeDirect * (1 + (p.defaultUsed ? p.markup : markupLike(p)))
        : null;
      const defaultCostEUR =
        defaultChargeablePerTonne != null
          ? defaultChargeablePerTonne * p.tonnes * price
          : null;
      const grossCostEUR = p.chargeableTCO2e * price;
      return {
        ...p,
        certificates: p.chargeableTCO2e,
        grossCostEUR,
        defaultCostEUR,
        dataGapRiskEUR:
          defaultCostEUR != null ? defaultCostEUR - grossCostEUR : null,
        benchmark: catalog ? benchmark(catalog, p.seePerTonne, "total") : null,
      };
    });

    /* Priced off the PRODUCTS, never off sf.chargeableTCO2e. The engine
       rounds a supplier's chargeable tonnes to a whole tonne
       (compliance-engine.ts) while leaving each product's un-rounded, so
       multiplying the rounded figure by the price puts up to half a tonne of
       cost — ~EUR 41 at EUR 82/t, per supplier — between a supplier's total
       and the sum of the lines printed underneath it. An exporter reading the
       breakdown adds the rows up, and the answer has to match. */
    const supplierGrossCost = products.reduce((a, p) => a + p.grossCostEUR, 0);
    /* The engine already values the carbon price the supplier paid, but at its
       own proxy rate. Re-scale it to the price actually being modelled so the
       deduction doesn't drift when the exporter changes the certificate price. */
    const supplierCredit = Math.min(
      supplierGrossCost,
      sf.carbonPricePaidEUR * (price / EU_ETS_PROXY_EUR_PER_TCO2E),
    );
    const supplierDefaultCost = products.reduce(
      (a, p) => a + (p.defaultCostEUR ?? p.grossCostEUR),
      0,
    );
    const supplierTonnes = products.reduce((a, p) => a + p.tonnes, 0);

    suppliers.push({
      supplierId: sf.supplierId,
      supplierName: sf.supplierName,
      products,
      tonnes: round2(supplierTonnes),
      grossTCO2e: sf.grossTCO2e,
      chargeableTCO2e: sf.chargeableTCO2e,
      grossCostEUR: Math.round(supplierGrossCost),
      carbonPriceCreditEUR: Math.round(supplierCredit),
      netCostEUR: Math.round(Math.max(0, supplierGrossCost - supplierCredit)),
      dataGapRiskEUR: Math.round(supplierDefaultCost - supplierGrossCost),
      share: 0, // filled once the total is known
    });

    totalTonnes += supplierTonnes;
    totalGross += sf.grossTCO2e;
    totalChargeable += sf.chargeableTCO2e;
    grossCost += supplierGrossCost;
    credit += supplierCredit;
    defaultCost += supplierDefaultCost;
  }

  for (const s of suppliers)
    s.share = totalChargeable > 0 ? s.chargeableTCO2e / totalChargeable : 0;
  suppliers.sort((a, b) => b.chargeableTCO2e - a.chargeableTCO2e);

  const netCost = Math.max(0, grossCost - credit);
  return {
    pricing,
    suppliers,
    totalTonnes: round2(totalTonnes),
    totalGrossTCO2e: totalGross,
    totalChargeableTCO2e: totalChargeable,
    totalCertificates: Math.ceil(totalChargeable),
    grossCostEUR: Math.round(grossCost),
    carbonPriceCreditEUR: Math.round(credit),
    netCostEUR: Math.round(netCost),
    netCostTHB: Math.round(netCost * pricing.thbPerEur),
    defaultCostEUR: Math.round(defaultCost),
    dataGapRiskEUR: Math.round(defaultCost - grossCost),
    costPerTonneOfGoodsEUR: totalTonnes > 0 ? round2(netCost / totalTonnes) : 0,
  };
}

/* A product reported on ACTUAL data carries no markup — but the default-value
   alternative it's being compared against would. Reuse whatever markup rate the
   engine applied for this reporting year (it's on the facts when defaults were
   used) and fall back to the same schedule shape otherwise. */
function markupLike(p: ProductFacts): number {
  return p.markup > 0 ? p.markup : 0.1;
}

/* ── Hotspots ──────────────────────────────────────────────────
   The ranking is deliberately by ABSOLUTE chargeable tonnes, not by intensity:
   a mill with a terrible per-tonne figure on 12 tonnes of goods is a rounding
   error, and a merely-average mill on 4,000 tonnes is the whole problem. The
   per-tonne intensity rides along so the two can be read together. */
export type Hotspot = {
  key: string;
  label: string;
  sublabel: string;
  tonnes: number;
  chargeableTCO2e: number;
  intensity: number; // tCO₂e per tonne of goods
  costEUR: number;
  /** share of the total chargeable emissions, 0–1 */
  share: number;
  /** running share including everything ranked above it, 0–1 */
  cumulativeShare: number;
  benchmark: Benchmark | null;
};

function rank(rows: Omit<Hotspot, "share" | "cumulativeShare">[]): Hotspot[] {
  const total = rows.reduce((a, r) => a + r.chargeableTCO2e, 0);
  const sorted = [...rows].sort(
    (a, b) => b.chargeableTCO2e - a.chargeableTCO2e,
  );
  let running = 0;
  return sorted.map((r) => {
    const share = total > 0 ? r.chargeableTCO2e / total : 0;
    running += share;
    return { ...r, share, cumulativeShare: Math.min(1, running) };
  });
}

/** Suppliers ranked by how much of the chargeable total they carry. */
export function supplierHotspots(cost: CostBreakdown): Hotspot[] {
  return rank(
    cost.suppliers.map((s) => ({
      key: s.supplierId,
      label: s.supplierName,
      sublabel: `${s.products.length} good${s.products.length === 1 ? "" : "s"} · ${s.tonnes.toLocaleString("en-US")} t`,
      tonnes: s.tonnes,
      chargeableTCO2e: s.chargeableTCO2e,
      intensity: s.tonnes > 0 ? round2(s.chargeableTCO2e / s.tonnes) : 0,
      costEUR: s.netCostEUR,
      benchmark: null,
    })),
  );
}

/** Goods ranked the same way, merged across suppliers — "which product line
    is the carbon", which is the question a commercial team can act on. */
export function productHotspots(cost: CostBreakdown): Hotspot[] {
  const byProduct = new Map<
    string,
    {
      label: string;
      cn: string;
      tonnes: number;
      charge: number;
      cost: number;
      seeSum: number;
      seeWeight: number;
    }
  >();
  for (const s of cost.suppliers) {
    for (const p of s.products) {
      const cur = byProduct.get(p.productId) ?? {
        label: p.productName,
        cn: p.cnCode,
        tonnes: 0,
        charge: 0,
        cost: 0,
        seeSum: 0,
        seeWeight: 0,
      };
      cur.tonnes += p.tonnes;
      cur.charge += p.chargeableTCO2e;
      cur.cost += p.grossCostEUR;
      cur.seeSum += p.seePerTonne * p.tonnes; // tonnage-weighted, so one tiny lot can't skew it
      cur.seeWeight += p.tonnes;
      byProduct.set(p.productId, cur);
    }
  }
  return rank(
    [...byProduct.entries()].map(([id, v]) => {
      const catalog = getCatalogProduct(id);
      const weightedSee = v.seeWeight > 0 ? v.seeSum / v.seeWeight : 0;
      return {
        key: id,
        label: v.label,
        sublabel: `CN ${v.cn} · ${round2(v.tonnes).toLocaleString("en-US")} t`,
        tonnes: round2(v.tonnes),
        chargeableTCO2e: v.charge,
        intensity: round2(weightedSee),
        costEUR: Math.round(v.cost),
        benchmark: catalog ? benchmark(catalog, weightedSee, "total") : null,
      };
    }),
  );
}

/** The smallest set of hotspots that together carry ≥ `threshold` of the total
    — "fix these three and you've moved most of it". */
export function concentration(hotspots: Hotspot[], threshold = 0.8): Hotspot[] {
  const out: Hotspot[] = [];
  for (const h of hotspots) {
    out.push(h);
    if (h.cumulativeShare >= threshold) break;
  }
  return out;
}

export const fmtEUR = (n: number) =>
  `€${Math.round(n).toLocaleString("en-US")}`;
export const fmtTHB = (n: number) =>
  `฿${Math.round(n).toLocaleString("en-US")}`;
