/* ════════════════════════════════════════════════════════════
   THE MONTHLY DATA OF STEEL AND ALUMINIUM

   Iron and steel and aluminium are the two sectors this portal collects monthly
   data for in full, and what a plant has to read off its own records each month
   is not the same list for a blast furnace, an electric arc furnace, a primary
   smelter and a scrap remelter. This file says, per good and route, which
   source streams exist, so the monthly form can open with the rows that plant
   actually has — and nothing it does not.

   WHERE EACH ROW COMES FROM (Implementing Regulation (EU) 2025/2547):
     · Annex I, 3.11 – 3.18   the system boundary of each aggregated category —
                              which fuels, reducing agents, electrodes, fluxes,
                              flue-gas chemicals and perfluorocarbons are inside
     · Annex II, B.3.1        combustion and process emissions, standard method
     · Annex II, B.3.2        the mass balance — carbon in, carbon out, outputs
                              negative — which BOF, EAF, blast-furnace and
                              ferro-alloy routes use for carbon that stays in
                              the product, the slag or the dust
     · Annex II, B.7          PFC from anode effects: slope method (A) and
                              overvoltage method (B), with the technology
                              factors of Tables 2 and 3
     · Annex II, Point G      Table 5 carbon contents; Table 6 GWPs
     · Annex IV, items 13, 16(a), 35   what the report asks the rows to answer

   NOTHING HERE IS A NEW CALCULATION RULE. The pack chooses what to show; the
   figures are computed by lib/monthly-data.ts with the same functions every
   screen and report already uses.
   ════════════════════════════════════════════════════════════ */

import { aggregatedGoodsCategory, getCatalogProduct, type AggregatedGoodsCategory } from "../config";
import { getRoute, type VerificationWorkspace } from "../workspace";
import { GWP } from "./template-reference";

export type Sector = "steel" | "aluminium";

const STEEL_CATEGORIES = new Set<AggregatedGoodsCategory>(["Sintered ore", "Pig iron", "Ferro-alloys", "Direct reduced iron", "Crude steel", "Iron or steel products"]);
const ALUMINIUM_CATEGORIES = new Set<AggregatedGoodsCategory>(["Unwrought aluminium", "Aluminium products"]);

/** Which of the two sectors a product report belongs to, or null for any other good. */
export function sectorOf(ws: Pick<VerificationWorkspace, "productId">): Sector | null {
  const product = getCatalogProduct(ws.productId);
  if (!product) return null;
  const agg = aggregatedGoodsCategory(product);
  if (STEEL_CATEGORIES.has(agg)) return "steel";
  if (ALUMINIUM_CATEGORIES.has(agg)) return "aluminium";
  return null;
}

/* ── A row the plant can fill ───────────────────────────────────
   A guided row is a place, not a record: nothing is stored until a quantity is
   typed in it, and clearing the quantity removes it. That is what lets a form
   list every usual material of the route without making the plant delete the
   ones it does not use. */
export type MaterialRowSpec = {
  /** stable id, kept on the saved entry so the row finds it again */
  key: string;
  label: string;
  hint: string;
  /** id into CARBON_CONTENTS (Annex II Table 5) — the EU standard carbon content; absent where the plant must give its own */
  materialId?: string;
  direction: "in" | "out";
  /** scrap — the quantity also feeds Annex IV item 35, with its pre-consumer share */
  scrap?: boolean;
};

/** What a month's page opens with for one product report. */
export type SectorPack = {
  sector: Sector;
  category: AggregatedGoodsCategory;
  /** a sentence naming the route in the plant's own words */
  intro: string;
  /** carbon in materials that are not fuels, and carbon leaving in the product and by-products */
  materials: MaterialRowSpec[];
  /** whether the month asks for scrap and its pre-consumer share as a block of its own (aluminium) */
  scrapBlock: boolean;
  /** whether the month asks for PFC from anode effects */
  pfc: boolean;
  /** the technologies the PFC block offers first for this route */
  pfcTechnologies: string[];
  /** fuels the route usually has — a line of guidance above the fuel rows, never a restriction */
  fuelHint: string;
  /** whether the process gases (blast-furnace, coke-oven, converter) are likely here */
  wasteGases: boolean;
  /** fluxes and flue-gas chemicals the route usually has */
  fluxHint: string;
};

const R = (key: string, label: string, hint: string, direction: "in" | "out", materialId?: string, scrap?: boolean): MaterialRowSpec => ({ key, label, hint, direction, materialId, scrap });

const SCRAP_ROWS = [
  R("steel_scrap", "Steel scrap charged", "Tonnes of steel scrap put into the furnace this month.", "in", "steel_scrap", true),
  R("iron_scrap", "Iron scrap charged", "Cast iron and other iron scrap — tonnes.", "in", "iron_scrap", true),
];
const EAF_INPUTS = [
  R("dri", "Direct reduced iron (DRI) charged", "Tonnes of DRI put into the furnace.", "in", "dri"),
  R("hbi", "Hot briquetted iron (HBI) charged", "Tonnes of HBI put into the furnace.", "in", "hbi"),
  R("pig_iron_in", "Pig iron bought in", "Pig iron or hot metal that came from outside this installation — tonnes.", "in", "pig_iron"),
  R("eaf_electrodes", "Carbon electrodes consumed", "Tonnes of electrode and electrode paste used up this month.", "in", "eaf_carbon_electrodes"),
  R("charge_carbon", "Charge carbon", "Coal, anthracite or coke added to the furnace as a carbon source — tonnes.", "in", "eaf_charge_carbon"),
  R("petcoke", "Petroleum coke", "Tonnes used as a carbon source.", "in", "petroleum_coke"),
];
const STEEL_OUT = R("steel_out", "Crude steel leaving", "Tonnes of steel made — normally the same as production. Its carbon stays in the steel instead of being emitted.", "out", "steel_scrap");

/** The steel pack for a category and route. */
function steelPack(agg: AggregatedGoodsCategory, routeId: string, letter: string | undefined): SectorPack {
  const base = { sector: "steel" as const, category: agg, scrapBlock: false, pfc: false, pfcTechnologies: [] as string[] };

  if (agg === "Sintered ore") {
    return {
      ...base,
      intro: "Sintering — iron ore is agglomerated by burning fuel. Most of the CO₂ comes from the fuel and the flux.",
      materials: [],
      fuelHint: "Coke breeze, coal, natural gas and any process gas used to fire the sinter strand.",
      wasteGases: true,
      fluxHint: "Limestone and dolomite added to the sinter mix.",
    };
  }
  if (agg === "Pig iron") {
    return {
      ...base,
      intro: routeId === "smelting_reduction" ? "Smelting reduction — iron ore reduced in a smelter." : "Blast furnace — iron ore reduced with coke and injected coal.",
      materials: [
        R("scrap_in", "Scrap charged", "Iron or steel scrap put into the furnace — tonnes. Leave empty if none.", "in", "iron_scrap", true),
        R("pig_out", "Pig iron leaving", "Tonnes of pig iron tapped or sold. Its carbon stays in the iron instead of being emitted.", "out", "pig_iron"),
        R("process_gas_out", "Furnace or converter gas sent out", "Tonnes of gas sent to another user — only if it is weighed, not counted by energy.", "out", "bof_gas"),
      ],
      fuelHint: "Coke, coke dust, injected coal, natural gas, fuel oil, plastic waste, charcoal and the process gases of the furnace.",
      wasteGases: true,
      fluxHint: "Limestone, dolomite and magnesite charged as flux, and any flue-gas cleaning chemicals.",
    };
  }
  if (agg === "Direct reduced iron") {
    return {
      ...base,
      intro: "Direct reduction — iron ore reduced in the solid state, without melting it.",
      materials: [
        R("dri_out", "DRI or HBI leaving", "Tonnes of iron sponge, DRI or HBI made. Its carbon stays in the product instead of being emitted.", "out", "dri"),
      ],
      fuelHint: "Natural gas, other fossil fuels or biomass used as the reducing agent and for heating. Hydrogen used as a reductant is a precursor, not a fuel.",
      wasteGases: false,
      fluxHint: "Any flue-gas cleaning chemicals; carbonates only if the plant adds them.",
    };
  }
  if (agg === "Ferro-alloys") {
    return {
      ...base,
      intro: "Ferro-alloys — made by reducing ore with carbon in an electric furnace.",
      materials: [
        R("eaf_electrodes", "Carbon electrodes consumed", "Tonnes of electrode and electrode paste used up this month.", "in", "eaf_carbon_electrodes"),
        R("charge_carbon", "Reducing carbon charged", "Coke, coal or charcoal added as the reducing agent — tonnes.", "in", "eaf_charge_carbon"),
        R("petcoke", "Petroleum coke", "Tonnes used as a carbon source.", "in", "petroleum_coke"),
        R("alloy_out", "Alloy leaving", "Tonnes of alloy made, with the carbon content of your own analysis — the EU table has no standard value for it.", "out"),
      ],
      fuelHint: "Fuels and reducing agents of the furnace, whether burned for energy or used as a material.",
      wasteGases: true,
      fluxHint: "Limestone and any flue-gas cleaning chemicals.",
    };
  }
  if (agg === "Crude steel") {
    const bof = letter === "C" || letter === "F" || routeId === "bf_bof" || routeId === "lowalloy_bf_bof";
    if (bof) {
      return {
        ...base,
        intro: "Basic oxygen steelmaking — hot metal from the blast furnace is refined in an oxygen converter.",
        materials: [
          ...SCRAP_ROWS,
          R("pig_iron_in", "Pig iron or hot metal bought in", "Only what came from outside this installation — tonnes.", "in", "pig_iron"),
          R("dri", "Direct reduced iron (DRI) charged", "Tonnes of DRI put into the converter.", "in", "dri"),
          STEEL_OUT,
          R("bof_gas_out", "Converter gas sent out", "Tonnes of oxygen steel furnace gas sent to another user — only if it is weighed, not counted by energy.", "out", "bof_gas"),
        ],
        fuelHint: "Natural gas, fuel oil, coal and the process gases (blast-furnace, coke-oven, converter) used for heating, ladle preheating and reheating.",
        wasteGases: true,
        fluxHint: "Limestone, dolomite and magnesite charged as flux, and any flue-gas cleaning chemicals.",
      };
    }
    return {
      ...base,
      intro: "Electric arc furnace — scrap or direct reduced iron melted with electricity and carbon electrodes.",
      materials: [...SCRAP_ROWS, ...EAF_INPUTS, STEEL_OUT],
      fuelHint: "Natural gas, fuel oil and coal for burners, ladle preheating and reheating before casting or rolling.",
      wasteGases: false,
      fluxHint: "Limestone, dolomite and magnesite added as flux, and any flue-gas cleaning chemicals.",
    };
  }
  // Iron or steel products — rolled, forged, drawn, coated: the metal is bought in, and the plant mostly burns fuel and draws power.
  return {
    ...base,
    intro: "Further processing — reheating, rolling, forging, annealing, drawing, pickling or coating. The steel itself comes in as a precursor.",
    materials: [],
    fuelHint: "Natural gas, fuel oil and process gas for reheating and annealing furnaces; fuel for coating and galvanising lines.",
    wasteGases: false,
    fluxHint: "Only the chemicals of flue-gas treatment, if there are any.",
  };
}

/** The aluminium pack. */
function aluminiumPack(agg: AggregatedGoodsCategory, routeId: string): SectorPack {
  const base = { sector: "aluminium" as const, category: agg, wasteGases: false };
  if (agg === "Unwrought aluminium") {
    const primary = routeId === "hall_heroult" || routeId === "soderberg" || routeId === "al_primary";
    if (primary) {
      const soderberg = routeId === "soderberg";
      return {
        ...base,
        intro: soderberg ? "Primary smelting, Søderberg cells — alumina is electrolysed with a self-baking anode paste." : "Primary smelting, prebake cells — alumina is electrolysed with baked carbon anodes.",
        materials: [
          R("anode", soderberg ? "Anode paste consumed" : "Anodes consumed", "Tonnes used up this month, with the carbon content from the supplier's specification or your analysis — the EU table has no standard value.", "in"),
          R("electrode_other", "Other carbon electrodes or paste", "Cathode, ramming or baking paste consumed — tonnes, with its own carbon content.", "in"),
        ],
        scrapBlock: true,
        pfc: true,
        pfcTechnologies: soderberg ? ["VSS", "HSS"] : ["PFPB_M", "PFPB_L", "PFPB_MW", "CWPB", "SWPB"],
        fuelHint: "Fuel for anode baking, for drying and preheating raw materials, for heating the cells and for casting.",
        fluxHint: "Soda ash or limestone used to clean the flue gas.",
      };
    }
    return {
      ...base,
      intro: "Secondary melting — aluminium scrap is melted and cast. Unwrought aluminium bought in and added is a precursor, not scrap.",
      materials: [],
      scrapBlock: true,
      pfc: false,
      pfcTechnologies: [],
      fuelHint: "Fuel for drying and preheating scrap, for the melting furnaces, for de-coating and de-oiling, for burning off the residues, for treating skimmings and for casting.",
      fluxHint: "Soda ash or limestone used to clean the flue gas.",
    };
  }
  return {
    ...base,
    intro: "Further processing — casting, homogenising, rolling, extruding, annealing or coating. The metal comes in as a precursor.",
    materials: [],
    scrapBlock: true,
    pfc: false,
    pfcTechnologies: [],
    fuelHint: "Fuel for remelting, casting, homogenising, annealing and coating furnaces.",
    fluxHint: "Only the chemicals of flue-gas treatment, if there are any.",
  };
}

/** The pack for a product report, or null where the good is in neither sector. */
export function packFor(ws: Pick<VerificationWorkspace, "productId" | "productionRoute">, letterOverride?: string): SectorPack | null {
  const product = getCatalogProduct(ws.productId);
  if (!product) return null;
  const agg = aggregatedGoodsCategory(product);
  const letter = letterOverride ?? getRoute(ws.productionRoute)?.letter;
  if (STEEL_CATEGORIES.has(agg)) return steelPack(agg, ws.productionRoute, letter);
  if (ALUMINIUM_CATEGORIES.has(agg)) return aluminiumPack(agg, ws.productionRoute);
  return null;
}

/* ── PFC from anode effects — Annex II B.7 ───────────────────────
   Primary smelting only. Two ways to count the anode effects, each with
   technology factors the plant uses until it has measured its own. */

export type PfcMethod = "slope" | "overvoltage";

export type PfcTechnology = {
  id: string;
  label: string;
  /** Table 2: (kg CF₄ / t Al) / (anode-effect minutes / cell-day). Null — the plant has to measure its own. */
  slopeCf4: number | null;
  /** Table 2: t C₂F₆ / t CF₄ */
  slopeC2f6: number | null;
  /** Table 3: (kg CF₄ / t Al) / mV — only the two technologies the table names */
  overvoltageCf4?: number;
  overvoltageC2f6?: number;
};

export const PFC_TECHNOLOGIES: PfcTechnology[] = [
  { id: "PFPB_L", label: "Legacy point-feed prebake", slopeCf4: 0.122, slopeC2f6: 0.097 },
  { id: "PFPB_M", label: "Modern point-feed prebake", slopeCf4: 0.104, slopeC2f6: 0.057 },
  { id: "PFPB_MW", label: "Modern point-feed prebake without fully automated anode-effect intervention", slopeCf4: null, slopeC2f6: null },
  { id: "CWPB", label: "Centre-worked prebake", slopeCf4: 0.143, slopeC2f6: 0.121, overvoltageCf4: 1.16, overvoltageC2f6: 0.121 },
  { id: "SWPB", label: "Side-worked prebake", slopeCf4: 0.233, slopeC2f6: 0.28, overvoltageCf4: 3.65, overvoltageC2f6: 0.252 },
  { id: "VSS", label: "Vertical-stud Søderberg", slopeCf4: 0.058, slopeC2f6: 0.086 },
  { id: "HSS", label: "Horizontal-stud Søderberg", slopeCf4: 0.165, slopeC2f6: 0.077 },
];

export const pfcTechnology = (id: string): PfcTechnology | undefined => PFC_TECHNOLOGIES.find((t) => t.id === id);

/** One line of cells — a potline or potroom. Plants with more than one cell type, or lines that run differently, give a row each; the
    block's figures are then the sum of the lines, each worked out with its own cell type's factors (Annex II B.7). */
export type Potline = {
  id: string;
  /** "Line 1", "Potroom B" */
  label: string;
  /** a PFC_TECHNOLOGIES id */
  technology: string;
  /** the share of the month's primary aluminium this line made, % — the shares of all lines add up to 100 */
  sharePct?: number;
  /** slope method — anode effects per cell-day, and how many minutes each lasted */
  aePerCellDay?: number;
  aeMinutes?: number;
  /** cells in operation × days — kept so the minutes per cell-day can be traced to the cells */
  cellDays?: number;
  /** overvoltage method — this line's overvoltage (mV) and current efficiency (%) */
  aeo?: number;
  ce?: number;
};

/** Anode-effect minutes per cell-day of a line: how often × how long. Null until both are entered. */
export const potlineAem = (l: Potline): number | null => (l.aePerCellDay != null && l.aeMinutes != null && l.aePerCellDay >= 0 && l.aeMinutes >= 0 ? l.aePerCellDay * l.aeMinutes : null);

export const emptyPotline = (technology = ""): Potline => ({ id: `pl-${Math.random().toString(36).slice(2, 8)}`, label: "", technology });

/** The month's anode-effect minutes per cell-day, averaged over the lines by their share of the metal — what the single field would hold. */
export function potlinesAem(lines: Potline[]): number | null {
  const parts = lines.map((l) => ({ w: l.sharePct ?? 0, a: potlineAem(l) }));
  if (parts.length === 0 || parts.some((p) => p.a == null)) return null;
  const w = parts.reduce((a, p) => a + p.w, 0);
  return w > 0 ? parts.reduce((a, p) => a + p.w * (p.a as number), 0) / w : null;
}

/** What the plant types for the month. Everything is optional in the type so a half-filled block still saves; `pfcIssues` says what is missing. */
export type PfcInputs = {
  method: PfcMethod;
  technology: string;
  /** primary aluminium made this month, t — the production figure unless a different one is typed */
  primaryAlT?: number;
  /** slope method — anode-effect minutes per cell-day, averaged over the month */
  aem?: number;
  /** overvoltage method — anode-effect overvoltage in mV (time-integrated, per cell) */
  aeo?: number;
  /** overvoltage method — current efficiency, % */
  ce?: number;
  /** the plant's own CF₄ factor from field measurement — replaces the technology table */
  ownCf4Factor?: number;
  /** the plant's own C₂F₆ fraction from field measurement */
  ownC2f6Fraction?: number;
  /** share of the PFC that the duct collects, % — what is measured in the duct is divided by it to include the fume that escapes */
  collectionEfficiencyPct?: number;
  /** one row per line of cells; when present they replace `technology`, `aem`, `aeo` and `ce` above */
  potlines?: Potline[];
};

export type PfcResult = {
  cf4T: number;
  c2f6T: number;
  /** duct emissions, tCO₂e */
  ductTCO2e: number;
  /** after the collection efficiency — what is added to the month */
  totalTCO2e: number;
  /** which factors were used — the technology table, or the plant's own */
  factorSource: "table" | "own";
  /** the technology has no table value and the plant gave none, so the centre-worked values stood in (Table 2, note 1) */
  fellBack: boolean;
};

/** The CF₄ factor and C₂F₆ fraction for a cell type under a method: the plant's own where it has measured them, the table's otherwise. */
function factorsFor(method: PfcMethod, tech: PfcTechnology, ownCf4?: number, ownC2f6?: number): { cf4Factor: number; c2f6Fraction: number; fellBack: boolean } | null {
  let cf4Factor: number | null | undefined;
  let c2f6Fraction: number | null | undefined;
  let fellBack = false;
  if (method === "slope") {
    cf4Factor = ownCf4 ?? tech.slopeCf4;
    c2f6Fraction = ownC2f6 ?? tech.slopeC2f6;
    if ((cf4Factor == null || c2f6Fraction == null) && tech.id === "PFPB_MW") {
      // Table 2, note 1: where own measurement is not feasible, the centre-worked values are used.
      const cwpb = pfcTechnology("CWPB")!;
      cf4Factor = ownCf4 ?? cwpb.slopeCf4;
      c2f6Fraction = ownC2f6 ?? cwpb.slopeC2f6;
      fellBack = ownCf4 == null || ownC2f6 == null;
    }
  } else {
    cf4Factor = ownCf4 ?? tech.overvoltageCf4;
    c2f6Fraction = ownC2f6 ?? tech.overvoltageC2f6;
  }
  return cf4Factor == null || c2f6Fraction == null ? null : { cf4Factor, c2f6Fraction, fellBack };
}

/** CF₄ and C₂F₆ from anode effects, as tonnes and as tCO₂e. Null until enough is entered to compute it. */
export function pfcEmissions(pfc: PfcInputs, productionTonnes: number): PfcResult | null {
  const prAl = pfc.primaryAlT ?? productionTonnes;
  if (!(prAl > 0)) return null;
  const eff = pfc.collectionEfficiencyPct;
  if (!(eff != null && eff > 0 && eff <= 100)) return null;

  /* One cell type, or a row per line of cells. Either way each (technology, metal, anode-effect figure) is worked out with its own
     factors and the tonnes are added: Equation 21 / 24 per line, 22 / 25 for the C₂F₆, 26 for the CO₂e, 20 for the collection. */
  const lines: { tech: PfcTechnology; prAl: number; aem?: number | null; aeo?: number; ce?: number }[] = [];
  if (pfc.potlines && pfc.potlines.length > 0) {
    for (const l of pfc.potlines) {
      const tech = pfcTechnology(l.technology);
      if (!tech || !(l.sharePct != null && l.sharePct > 0)) return null;
      lines.push({ tech, prAl: (prAl * l.sharePct) / 100, aem: potlineAem(l), aeo: l.aeo, ce: l.ce });
    }
  } else {
    const tech = pfcTechnology(pfc.technology);
    if (!tech) return null;
    lines.push({ tech, prAl, aem: pfc.aem, aeo: pfc.aeo, ce: pfc.ce });
  }

  let cf4T = 0;
  let c2f6T = 0;
  let fellBack = false;
  for (const l of lines) {
    const fx = factorsFor(pfc.method, l.tech, pfc.ownCf4Factor, pfc.ownC2f6Fraction);
    if (!fx) return null;
    fellBack = fellBack || fx.fellBack;
    let cf4: number;
    if (pfc.method === "slope") {
      if (l.aem == null) return null;
      cf4 = l.aem * (fx.cf4Factor / 1000) * l.prAl; // Equation 21
    } else {
      if (l.aeo == null || !(l.ce != null && l.ce > 0)) return null;
      cf4 = fx.cf4Factor * (l.aeo / l.ce) * l.prAl * 0.001; // Equation 24
    }
    cf4T += cf4;
    c2f6T += cf4 * fx.c2f6Fraction; // Equations 22 and 25
  }
  const ductTCO2e = cf4T * GWP.CF4 + c2f6T * GWP.C2F6; // Equation 26
  const own = pfc.ownCf4Factor != null || pfc.ownC2f6Fraction != null;
  return { cf4T, c2f6T, ductTCO2e, totalTCO2e: ductTCO2e / (eff / 100), factorSource: own ? "own" : "table", fellBack }; // Equation 20
}

/** What is missing from a PFC block, in the plant's words. Empty when it computes. */
export function pfcIssues(pfc: PfcInputs, productionTonnes: number): { field: string; message: string }[] {
  const out: { field: string; message: string }[] = [];
  if (!((pfc.primaryAlT ?? productionTonnes) > 0)) out.push({ field: "pfc:primary", message: "Enter the primary aluminium made this month, or the production figure it is taken from." });

  if (pfc.potlines && pfc.potlines.length > 0) {
    const total = pfc.potlines.reduce((a, l) => a + (l.sharePct ?? 0), 0);
    if (Math.abs(total - 100) > 0.5) out.push({ field: "pfc:potlines", message: `The lines' shares of the metal add up to ${Math.round(total * 10) / 10} %, not 100 %.` });
    pfc.potlines.forEach((l, i) => {
      const name = l.label.trim() || `Line ${i + 1}`;
      const tech = pfcTechnology(l.technology);
      if (!tech) out.push({ field: `pfc:line:${l.id}:technology`, message: `${name} — pick the cell technology; it sets the factors that line's PFC calculation uses.` });
      if (!(l.sharePct != null && l.sharePct > 0 && l.sharePct <= 100)) out.push({ field: `pfc:line:${l.id}:share`, message: `${name} — enter the share of the month's metal this line made, above 0 and up to 100 %.` });
      if (pfc.method === "slope") {
        if (l.aePerCellDay == null || l.aeMinutes == null) out.push({ field: `pfc:line:${l.id}:aem`, message: `${name} — enter how often anode effects happen per cell-day and how many minutes each lasts — 0 if there were none.` });
        else if (l.aePerCellDay < 0 || l.aeMinutes < 0) out.push({ field: `pfc:line:${l.id}:aem`, message: `${name} — anode-effect figures cannot be negative.` });
      } else {
        if (l.aeo == null) out.push({ field: `pfc:line:${l.id}:aeo`, message: `${name} — enter the anode-effect overvoltage in mV for the month — 0 if there was none.` });
        if (!(l.ce != null && l.ce > 0 && l.ce <= 100)) out.push({ field: `pfc:line:${l.id}:ce`, message: `${name} — enter the current efficiency, above 0 and up to 100 %.` });
        if (tech && tech.overvoltageCf4 == null && pfc.ownCf4Factor == null) out.push({ field: `pfc:line:${l.id}:technology`, message: `${name} — the overvoltage method has EU factors only for centre-worked and side-worked prebake; for this cell type enter the plant's own measured factors, or use the slope method.` });
      }
    });
  } else {
    const tech = pfcTechnology(pfc.technology);
    if (!tech) out.push({ field: "pfc:technology", message: "Pick the cell technology — it sets the factors the PFC calculation uses until the plant has measured its own." });
    if (pfc.method === "slope") {
      if (pfc.aem == null) out.push({ field: "pfc:aem", message: "Enter the anode-effect minutes per cell-day for the month — 0 if there were none." });
      else if (pfc.aem < 0) out.push({ field: "pfc:aem", message: "Anode-effect minutes cannot be negative." });
    } else {
      if (pfc.aeo == null) out.push({ field: "pfc:aeo", message: "Enter the anode-effect overvoltage in mV for the month — 0 if there was none." });
      if (!(pfc.ce != null && pfc.ce > 0 && pfc.ce <= 100)) out.push({ field: "pfc:ce", message: "Enter the current efficiency, above 0 and up to 100 %." });
      if (tech && tech.overvoltageCf4 == null && pfc.ownCf4Factor == null) out.push({ field: "pfc:technology", message: "The overvoltage method has EU factors only for centre-worked and side-worked prebake — for this cell type enter the plant's own measured factors, or use the slope method." });
    }
  }
  // A cell type with no Table 2 value is not an error: note 1 lets the centre-worked values stand in, and the month says so.
  const eff = pfc.collectionEfficiencyPct;
  if (!(eff != null && eff > 0 && eff <= 100)) out.push({ field: "pfc:eff", message: "Enter the share of the PFC the duct collects, above 0 and up to 100 % — the duct figure is divided by it to include fume that escapes." });
  if (pfc.ownCf4Factor != null && pfc.ownCf4Factor < 0) out.push({ field: "pfc:own", message: "The plant's own CF₄ factor cannot be negative." });
  if (pfc.ownC2f6Fraction != null && pfc.ownC2f6Fraction < 0) out.push({ field: "pfc:own", message: "The plant's own C₂F₆ fraction cannot be negative." });
  return out;
}

/** A starting block for a route: the method most plants use, the technology the route implies, the duct at full collection to be corrected. */
export function emptyPfc(technologies: string[]): PfcInputs {
  return { method: "slope", technology: technologies.length === 1 ? technologies[0] : "" };
}

/* ── Scrap, for Annex IV item 35 ────────────────────────────────
   Steel: the scrap rows of the carbon balance. Aluminium: the block of its own.
   Either way the report states tonnes of scrap per tonne of product and the
   share that is pre-consumer. */
export type ScrapInputs = { tonnes?: number; preConsumerT?: number };

/** Scrap and its pre-consumer part for a month. */
export function scrapOf(entry: {
  processEmissionEntries?: { method: string; materialId: string; quantityT: number; preConsumerT?: number }[];
  scrap?: ScrapInputs;
}): { tonnes: number; preConsumerT: number } {
  let tonnes = Number(entry.scrap?.tonnes) > 0 ? Number(entry.scrap?.tonnes) : 0;
  let pre = Number(entry.scrap?.preConsumerT) > 0 ? Number(entry.scrap?.preConsumerT) : 0;
  for (const e of entry.processEmissionEntries ?? []) {
    if (e.method === "mass_balance" && (e.materialId === "steel_scrap" || e.materialId === "iron_scrap") && e.quantityT > 0) {
      tonnes += e.quantityT;
      pre += Number(e.preConsumerT) > 0 ? Number(e.preConsumerT) : 0;
    }
  }
  return { tonnes, preConsumerT: pre };
}
