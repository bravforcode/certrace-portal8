/* ════════════════════════════════════════════════════════════
   THE GOLDEN FIXTURE — spec §5.6

   A scrap-fed EAF steel installation, CN 7213.10, calendar year 2026. Every
   figure below is the specification's, unchanged, and the test alongside this
   file asserts the whole chain reproduces to 1e-6 on ratios and 0.01 on
   currency. If a change to the engine moves any of these numbers, that change
   is either a bug or a deliberate re-baseline that needs saying out loud.

   The fixture is exported rather than inlined in the test because three other
   things need the same known-good dataset: the shipment/per-buyer assertion
   in P11, the readiness score's worked example, and anyone debugging a real
   exporter's figures who needs a reference installation to compare against.
   ════════════════════════════════════════════════════════════ */

import { calendarYear } from "../boundary";
import type { ActivityDataset, Provenance } from "../activity";
import type { PrecursorNode } from "../precursor-tree";

const prov = (source: Provenance["source"], reference: string): Provenance => ({
  source,
  reference,
  enteredBy: "ESG lead",
  enteredAt: "2026-01-15T09:00:00.000Z",
});

export const GOLDEN_DECLARATION_ID = "golden-eaf-2026";

/** Inputs, exactly as tabulated in spec §5.6. */
export const GOLDEN_INPUTS = {
  Q_prod: 10_500, // t — ERP production log
  Q_gas: 148_800, // m³ — 12 monthly gas invoices
  NCV_gas: 0.0383, // GJ/m³ — supplier gas spec sheet
  EF_gas: 0.0561, // tCO₂/GJ — IPCC / EU MRR default
  OX_gas: 1.0,
  m_electrode: 22.05, // t — procurement records (2.1 kg/t × 10,500 t)
  CC_electrode: 1.0, // graphite, ~100% C
  MWh_e: 4_725, // MWh absolute — 12 monthly utility bills
  EF_e: 0.4999, // tCO₂/MWh — Thailand grid, EGAT/TGO 2023
  scrap_qty: 1.08, // t/t, isScrap = true
  pigiron_qty: 0.05, // t/t
  pigiron_see: 1.9, // tCO₂e/t
} as const;

export const goldenDataset = (): ActivityDataset => ({
  declarationId: GOLDEN_DECLARATION_ID,
  period: calendarYear(2026),
  annualProductionTonnes: GOLDEN_INPUTS.Q_prod,
  annualProductionProvenance: prov("erp", "ERP production log 2026"),
  fuels: [
    {
      id: "gas",
      fuel: "natural_gas",
      quantity: GOLDEN_INPUTS.Q_gas,
      unit: "m3",
      ncv: GOLDEN_INPUTS.NCV_gas,
      ncvProvenance: prov("lab", "Supplier gas spec sheet"),
      emissionFactor: GOLDEN_INPUTS.EF_gas,
      efProvenance: prov(
        "national_dataset",
        "IPCC 2006 / EU MRR 2018/2066 Annex VI",
      ),
      oxidationFactor: GOLDEN_INPUTS.OX_gas,
      provenance: prov("invoice", "12 monthly gas invoices 2026"),
    },
  ],
  electricity: [
    {
      id: "grid",
      mwhAbsolute: GOLDEN_INPUTS.MWh_e,
      emissionFactor: GOLDEN_INPUTS.EF_e,
      factorSource: "grid_national",
      provenance: prov("invoice", "12 monthly utility bills 2026"),
    },
  ],
  processEmissions: [
    {
      id: "electrode",
      material: "graphite electrode",
      massTonnes: GOLDEN_INPUTS.m_electrode,
      carbonContent: GOLDEN_INPUTS.CC_electrode,
      provenance: prov("erp", "Procurement records 2026"),
    },
  ],
});

export const goldenPrecursorTree = (): PrecursorNode[] => [
  {
    id: "scrap",
    parentId: null,
    name: "Steel scrap",
    cnCode: "7204 49 90",
    qtyPerTonneOutput: GOLDEN_INPUTS.scrap_qty,
    isScrap: true,
    seeDeclared: 0,
    route: "Recycled",
    children: [],
  },
  {
    id: "pigiron",
    parentId: null,
    name: "Pig iron",
    cnCode: "7201 10 90",
    qtyPerTonneOutput: GOLDEN_INPUTS.pigiron_qty,
    isScrap: false,
    seeDeclared: GOLDEN_INPUTS.pigiron_see,
    route: "BF route",
    children: [],
  },
];

/** Buyer A's three shipments — 136.0 t in total (spec §5.6 F5). */
export const GOLDEN_SHIPMENTS = [
  {
    buyer: "Buyer A",
    date: "2026-01-18",
    declarationId: GOLDEN_DECLARATION_ID,
    quantityTonnes: 45.2,
  },
  {
    buyer: "Buyer A",
    date: "2026-02-09",
    declarationId: GOLDEN_DECLARATION_ID,
    quantityTonnes: 38.7,
  },
  {
    buyer: "Buyer A",
    date: "2026-03-22",
    declarationId: GOLDEN_DECLARATION_ID,
    quantityTonnes: 52.1,
  },
];

/** Expected values, spec §5.6 assertions table. */
export const GOLDEN_EXPECTED = {
  E_gas_GJ: 5_699.04,
  E_gas_tCO2: 319.7161,
  E_process_tCO2: 80.7912,
  E_direct_tCO2: 400.5073,
  SEE_dir: 0.0381436,
  E_indirect_tCO2: 2_362.0275,
  SEE_ind: 0.224955,
  SEE_prec: 0.095,
  SEE_total_reported: 0.3580986,
  SEE_total_chargeable: 0.1331436,
  T_buyerA_tonnes: 136.0,
  T_buyerA_tCO2e: 18.1075,
  massBalanceYieldPct: 88.4956,
  electricityIntensityMWhPerT: 0.45,
  // F6 — both inputs are explicitly unresolved (spec §9); the arithmetic is
  // pinned so a later change to the engine can't move it silently.
  D_default_UNVERIFIED: 1.37,
  P_cert_UNDECIDED: 75,
  markup2026: 0.1,
  exposure_delta: 1.2368564,
  exposure_tCO2e: 168.2125,
  exposure_EUR: 13_877.53,
} as const;
