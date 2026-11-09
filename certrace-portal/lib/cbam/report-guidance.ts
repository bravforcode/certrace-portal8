/* ════════════════════════════════════════════════════════════
   HOW TO FILL THE REPORT SET IN — what each item wants, an example, and where it is entered

   Every row of every report names the Annex item it answers and shows what the portal holds. A row that is missing
   or only partly there also says HOW to fill it: what to write, an example of the answer, and the screen where it is
   entered — a link, not a paragraph to go and find. The reader of a Thai screen gets the instruction in Thai and the
   EXAMPLE in English, because the monitoring plan and the operator's emissions report are written in English
   (Implementing Regulation (EU) 2025/2547, Article 10(4)) and an example in Thai would invite a Thai answer.

   WHAT THE REGULATION SAYS, AND THIS FILE FOLLOWS (not what a checklist from elsewhere remembers):

     · the monitoring plan has the 22 elements of Annex II point A.5, numbered as there;
     · records are kept at least SIX years after the reporting period (Annex II A.2(4));
     · indirect emissions count only for goods that are NOT in Annex II of Regulation (EU) 2023/956 — iron, steel,
       aluminium, hydrogen and electricity carry direct emissions only, so grid electricity is never a source stream
       of a steel mill's direct emissions and element 18 and items 9–12 do not arise for it;
     · where indirect emissions do count, the default is the country's grid factor in Annex II of Implementing
       Regulation (EU) 2025/2621; actual values need a direct technical link or a power purchase agreement with
       hourly metering and the evidence of point D.4.3 — a national average factor is not an actual value;
     · "zero-rated" fuels are biomass that meets the sustainability criteria (point B.3.3), not fuels that are
       tax-exempt;
     · the definitive period is running since 1 January 2026: a verification report comes from an accredited
       verifier, whatever year the figures are for.
   ════════════════════════════════════════════════════════════ */

import type { ReportKind } from "./report-set";

/** Where an answer is entered. `computed` rows are added up from other screens, so they point at the one that feeds them. */
export type Where = "overview" | "products" | "mmd" | "monthly" | "precursors";

export type Guide = {
  /** what to do, in a sentence or two — translated on a Thai screen */
  how: string;
  /** an example answer, or the shape of one — always English, because the report is */
  example?: string;
  where: Where;
  /** the field on the installation Overview to scroll to, when the answer is typed there */
  anchor?: string;
};

export const WHERE_LABEL: Record<Where, string> = {
  overview: "Installation overview",
  products: "Products",
  mmd: "Methodology (MMD)",
  monthly: "Monthly data",
  precursors: "Precursors",
};

/* ── Facts about the installation itself — the same in all three reports ───────────────────── */
const IDENTITY: Record<string, Guide> = {
  "Name of the operator": {
    where: "overview",
    anchor: "ip-operatorName",
    how: "The legal person that runs the installation — the company named on its registration documents.",
    example: "Siam Steel Co., Ltd.",
  },
  "Corporate or activity registration number of the operator": {
    where: "overview",
    anchor: "ip-operatorRegistrationNumber",
    how: "The registration number exactly as it appears on the company's registration certificate.",
    example: "0105551234567",
  },
  "Full address of the operator, in English": {
    where: "overview",
    anchor: "ip-operatorAddress",
    how: "The registered address, written out in English.",
    example: "1 Moo 1, Map Ta Phut Industrial Estate, Rayong 21150, Thailand",
  },
  "Name of the installation": {
    where: "overview",
    anchor: "ip-name",
    how: "The English name of the producing site — the one the declarant and the verifier will use.",
    example: "Rayong Steel Works",
  },
  "UN/LOCODE of the location": {
    where: "overview",
    anchor: "ip-unlocode",
    how: "The five-letter UN/LOCODE of the place the site is in: two letters of the country, then three of the place.",
    example: "THMTP",
  },
  "Full address of the installation, in English": {
    where: "overview",
    anchor: "ip-address",
    how: "Street, post code, city and country of the site, in English.",
    example: "88 Moo 4, Map Ta Phut Industrial Estate, Rayong 21150, Thailand",
  },
  "Geographical coordinates of the installation's main emission source": {
    where: "overview",
    anchor: "ip-coords",
    how: "Decimal degrees with six decimals, of the main emission source — the stack of the furnace that dominates the figures, not the front gate.",
    example: "12.681000, 101.159000",
  },
};

/* ── 1 · Monitoring plan — Annex II point A.5, elements 1 to 22 ───────────────────────────── */
const MONITORING_PLAN: Record<string, Guide> = {
  "MP 1": {
    where: "mmd",
    how: "Finalise the methodology: that stamps its version number and date. Editing afterwards forks the next version, so the one a verifier read stays as it was.",
    example: "Version 1, finalised 12 January 2026",
  },
  "MP 2": {
    where: "mmd",
    how: "Describe the site and list, in order, the production processes inside the boundary.",
    example: "Scrap melting in the electric arc furnace → ladle refining → continuous casting → reheating → rolling. Boundary: gate to gate, every fuel burned on site.",
  },
  "MP 3": { where: "products", how: "Read from your product reports, one line per CN code. Add a product report for every good the site makes." },
  "MP 4": { where: "products", how: "Read from your product reports: each one is a production route and the good it delivers." },
  "MP 5": {
    where: "overview",
    anchor: "ip-nonCbamProcesses",
    how: "Write None on the Overview if the site makes nothing outside CBAM. Otherwise list each process there and enter the tonnes made in the monthly data.",
    example: "None",
  },
  "MP 6": { where: "products", how: "Read from the CN code and route of each product report. Give every product report a CN code and a route." },
  "MP 7(a)": {
    where: "monthly",
    how: "Written from the streams your monthly data carries. For fuels: quantity × net calorific value × emission factor × oxidation factor. For process materials: quantity × emission factor × conversion factor. Enter the fuels and materials in the months.",
    example: "Calculation-based, standard method: emissions = activity data × emission factor, with activity data = fuel quantity × net calorific value (oxidation factor 1).",
  },
  "MP 7(b)": {
    where: "mmd",
    how: "List every instrument and say exactly where it sits: the weighbridge, the gas and electricity meters.",
    example: "Weighbridge at the raw-material gate; gas meter on the supply line to the melting furnace; electricity meter at the furnace transformer.",
  },
  "MP 8": {
    where: "mmd",
    how: "For each source stream say where its calculation factor comes from and how often it is sampled. Laboratory analyses follow ISO or EN standards (ISO/IEC 17025 is recommended), at least as often as the regulation requires.",
    example: "Net calorific value and carbon content from the supplier's certificate of analysis for each delivery; where there is none, a sample goes to an ISO/IEC 17025 laboratory.",
  },
  "MP 9": {
    where: "monthly",
    how: "List every source stream and emission source of each process: the fuels burned, the carbon-bearing materials, the fluxes. It is written from your monthly readings. Grid electricity is not a source stream of direct emissions.",
    example: "Natural gas — reheating furnace. Electrodes and carbon additives — arc furnace. Limestone and dolomite — flux. Scrap — carbon balance.",
  },
  "MP 10": { where: "monthly", how: "Written from the months: which streams use the standard method and which the mass balance. Enter the fuels and process materials in the monthly data." },
  "MP 11": { where: "overview", anchor: "ip-cems", how: "Answer the continuous-measurement question on the Overview. If the answer is yes, describe each analyser and where it samples in the methodology." },
  "MP 12": { where: "mmd", how: "Only for primary aluminium: describe how the perfluorocarbons are monitored in the methodology." },
  "MP 13": {
    where: "mmd",
    how: "Attach a process flow diagram that draws the boundary and shows where every stream enters and leaves — so nothing is counted twice and nothing is missing.",
    example: "One page: raw-material gate → melting → casting → rolling, with the fuel and electricity meters marked on it.",
  },
  "MP 14": {
    where: "precursors",
    how: "Read from the precursors of each product report: name, CN code, who supplies it and from which country. Scrap is not a precursor.",
    example: "Pig iron — Siam Iron Co., Thailand",
  },
  "MP 15": {
    where: "overview",
    anchor: "ip-zeroRatedFuels",
    how: "Zero-rated means biomass that meets the sustainability criteria and counts as zero emissions — not a fuel that is tax-exempt. If none is burned, answer No; if some is, say how you demonstrate it.",
    example: "No — no biomass fuel is used.",
  },
  "MP 16": {
    where: "overview",
    anchor: "ip-heatTrade",
    how: "Say whether measurable heat is imported or exported. If yes, name the installations and enter the heat quantities in the monthly data.",
    example: "No — no heat is bought from or sold to another installation.",
  },
  "MP 17": {
    where: "overview",
    anchor: "ip-onsiteElectricity",
    how: "Say whether electricity is generated inside the installation and, if so, how.",
    example: "No — all electricity is bought from the grid.",
  },
  "MP 18": {
    where: "mmd",
    how: "Only for goods outside Annex II, such as cement and fertilisers. Their indirect emissions use the country's default grid factor (Annex II of Implementing Regulation (EU) 2025/2621) unless a direct technical link or a power purchase agreement with hourly metering gives the evidence of point D.4.3 — a national average grid factor is not an actual value. Say which supply you have and where it is metered.",
    example: "Grid supply from the provincial electricity authority, metered at the main substation; the default factor applies.",
  },
  "MP 19": { where: "overview", anchor: "ip-electricityToEu", how: "Only where electricity from this installation is imported into the EU. Otherwise answer No on the Overview." },
  "MP 20": {
    where: "overview",
    anchor: "ip-wasteGases",
    how: "Say whether waste gases are produced and used here, or imported or exported. If yes, name the installations.",
    example: "No — no waste gas is used or exchanged.",
  },
  "MP 21": { where: "overview", anchor: "ip-co2Transfer", how: "Say whether CO₂ is captured, stored or used elsewhere. If yes, give the responsible person at the receiving installation." },
  "MP 22(a)": {
    where: "mmd",
    how: "Give every instrument a calibration date in the methodology. Calibrate at regular intervals against standards that trace to international ones.",
    example: "The weighbridge and the energy meters are calibrated every year by an accredited body; the certificates are kept.",
  },
  "MP 22(b)": {
    where: "mmd",
    how: "Say where an error could enter between the first reading and the reported figure, and what is done about it.",
    example: "Raw data is checked each month between the production floor and accounting and environment, to catch keying errors. Highest risk: weighbridge tickets typed in by hand.",
  },
  "MP 22(c)": {
    where: "mmd",
    how: "Name the systems that process the data and say how they are tested, controlled and maintained.",
    example: "Production data sits in the ERP; access is by named user; changes are tested on a copy and approved by IT before they go live.",
  },
  "MP 22(d)": {
    where: "mmd",
    how: "Say who records, who checks and who approves, and how those people are trained.",
    example: "Shift operators record; the production planner checks; the environmental manager approves. All three are trained each year on the monitoring plan.",
  },
  "MP 22(e)": {
    where: "mmd",
    how: "Choose a review method and name the reviewer and how often. A second person reviewing the first one's work before it goes out is the usual one (the four-eyes principle).",
    example: "Four-eyes principle: one person prepares the monthly report and a second reviews it before it is sent to the verifier.",
  },
  "MP 22(f)": {
    where: "mmd",
    how: "Say what is done when a review finds an error or an instrument is out of tolerance.",
    example: "The figure is corrected at source, the correction is logged with a reason, and the month is reviewed again.",
  },
  "MP 22(g)": {
    where: "mmd",
    how: "Name any part of the data flow done by someone else — a laboratory, a metering contractor — and how it is controlled. Write None if there is none.",
    example: "None",
  },
  "MP 22(h)": {
    where: "mmd",
    how: "Keep the records and their supporting documents at the installation for at least six years after the reporting period. Say where, and how an old version is told from the current one.",
    example: "Weighbridge tickets, invoices and production reports are kept in the company's document system for at least six years after the reporting period; superseded versions are archived and never overwritten.",
  },
};

/* ── 2 · Operator's emissions report — Annex IV point 1.1, items 1 to 35 ──────────────────── */
const COMPUTED_FROM_MONTHS = "Added up from your monthly data — nothing to type here. It is ready when every month of the year is submitted.";
const EMISSIONS_REPORT: Record<string, Guide> = {
  "2(a)": { where: "products", how: "Read from your product reports: each is one production route. Add a product report for every good the site makes." },
  "2(b)": {
    where: "overview",
    anchor: "ip-nonCbamProcesses",
    how: "List the production processes at the site that are not CBAM goods, or write None.",
    example: "None",
  },
  "2(c)": { where: "products", how: "Read from your product reports: the five goods of each route that weigh the most, by CN code." },
  "2(d)": {
    where: "overview",
    anchor: "ip-topFuels",
    how: "List the five fuels that give the most energy, most important first. Your monthly data can suggest the list.",
    example: "Natural gas, diesel",
  },
  "2(e)": {
    where: "overview",
    anchor: "ip-topMaterials",
    how: "List the five materials that lead to the most process emissions — raw materials, fluxes, carbon additives — or write None. Your monthly data can suggest the list.",
    example: "Limestone, electrodes, carbon additives",
  },
  "2(f)": { where: "overview", anchor: "ip-cems", how: "Say whether continuous emissions measurement is used. If yes, name the gases and the five biggest sources it covers." },
  "2(g)": {
    where: "overview",
    anchor: "ip-zeroRatedFuels",
    how: "Say whether any zero-rated fuel (biomass that meets the sustainability criteria) is used, and how you demonstrate it.",
    example: "No — no biomass fuel is used.",
  },
  "2(h)": {
    where: "overview",
    anchor: "ip-heatTrade",
    how: "Say whether measurable heat is bought from or sold to another installation. If yes, name it.",
    example: "No — no heat is exchanged with another installation.",
  },
  "3": {
    where: "overview",
    anchor: "ip-electricityMixed",
    how: "Say whether electricity comes from more than one source. If yes, give the sources and quantities, and the name and country of a supplier that is another installation.",
    example: "Yes — grid supply from the provincial electricity authority; solar PPA with Rayong Solar Farm 2 (Thailand).",
  },
  "4": {
    where: "overview",
    anchor: "ip-onsiteElectricity",
    how: "Say whether electricity is generated inside the installation — by co-generation or separate generation, from fossil or renewable sources, and whether it leaves a production process.",
    example: "No — all electricity is bought from the grid.",
  },
  "5": {
    where: "overview",
    anchor: "ip-wasteGases",
    how: "Say whether waste gases are produced and used here, or imported from or exported to other installations.",
    example: "No",
  },
  "6": { where: "overview", anchor: "ip-co2Transfer", how: "Say whether CO₂ is transferred elsewhere. If yes, give the responsible person at the receiving installation." },
  "7": { where: "monthly", how: "Added up from your monthly data — nothing to type here. It needs every month submitted, each with its production and its fuels." },
  "9": { where: "monthly", how: "Only for goods outside Annex II. Enter the installation's total electricity in each month, or the report uses the CBAM goods' own electricity." },
  "11": {
    where: "mmd",
    how: "Only for goods outside Annex II. Name the utility or installation that supplies the electricity: choose the supply in the methodology, or name the supplier installation on the month's electricity row. For a power purchase agreement, name the producer.",
    example: "Provincial electricity authority (grid supply)",
  },
  "12": { where: "monthly", how: "Only for goods outside Annex II. Enter each electricity source in the months: MWh, country and emission factor." },
  "13": { where: "monthly", how: COMPUTED_FROM_MONTHS },
  "14": { where: "overview", anchor: "ip-nonCbamProcesses", how: "Where the site makes goods outside CBAM, enter the tonnes in the monthly data." },
  "15(a)": { where: "monthly", how: COMPUTED_FROM_MONTHS },
  "15(e)": { where: "monthly", how: "Only for goods outside Annex II. Enter the electricity in the months: the report works out the indirect share and the specific indirect emissions." },
  "16(a)": { where: "monthly", how: "Enter the fuels, materials and electricity in each month — the activity data and the calculation factors are read from them." },
  "16(b)": { where: "monthly", how: "Continuous measurement is used: enter each measured source and its emissions in the monthly data." },
  "16(d)": { where: "overview", anchor: "ip-co2Transfer", how: "CO₂ transfer applies: give the receiving party on the Overview and the tonnes received and sent on in the monthly data." },
  "17": { where: "monthly", how: "Enter the heat, waste-gas and electricity flows in the months where they apply — the balance is added up from them." },
  "18 · 19": { where: "precursors", how: "Products made at this installation and used in another are read from your product reports. Link them under Precursors." },
  "20 · 21": { where: "precursors", how: "Enter each bought-in precursor with the quantity used under Precursors." },
  "26": { where: "monthly", how: "Only for goods outside Annex II. Where one meter feeds several products, set the allocation key in the month." },
  "27": { where: "precursors", how: "Enter the quantity of each precursor made here and used in each process under Precursors." },
  "29": { where: "mmd", how: "Finalise the methodology: it describes how the emissions of each production process are attributed." },
  "30": { where: "monthly", how: COMPUTED_FROM_MONTHS },
  "31": { where: "products", how: "Read from your product reports. Add a product report for every good the site makes." },
  "34": { where: "monthly", how: COMPUTED_FROM_MONTHS },
  "35": {
    where: "mmd",
    how: "Each product has its own parameters. Steel: the Mn/Cr/Ni and other alloy percentages, the scrap per tonne and its pre-consumer share; for pig iron and direct reduced iron, the main reducing agent. A product made from steel or aluminium you buy in takes its scrap from that metal's own figures when it is on actual values; otherwise enter the total for the good. Ferro-manganese: mass percent of manganese and carbon. Aluminium: scrap per tonne, pre-consumer share and any non-aluminium elements. Cement: the clinker-to-cement ratio. Fertilisers: nitrogen content, purity or concentration. Calcined clay, clinker, aluminous cement, hydrogen and sintered ore: none required.",
    example: "Ferro-manganese: Mn 78%, carbon 6.5%",
  },
};

/* ── 3 · Operator's summary emissions report — Annex IV point 1.2, items 1 to 16 ─────────── */
const SUMMARY_REPORT: Record<string, Guide> = {
  "3": { where: "products", how: "Read from your product reports: each is one production route and the good it delivers." },
  "4(a)": { where: "monthly", how: COMPUTED_FROM_MONTHS },
  "5": { where: "monthly", how: COMPUTED_FROM_MONTHS },
  "7": { where: "overview", anchor: "ip-heatTrade", how: "Answer on the Overview whether measurable heat is imported or exported.", example: "No" },
  "8": { where: "overview", anchor: "ip-zeroRatedFuels", how: "Answer on the Overview whether any zero-rated fuel is used, and how you demonstrate it.", example: "No — no biomass fuel is used." },
  "9": { where: "overview", anchor: "ip-wasteGases", how: "Answer on the Overview whether waste gases are produced and used here, or exchanged.", example: "No" },
  "10": { where: "overview", anchor: "ip-co2Transfer", how: "Answer on the Overview whether CO₂ is captured or transferred, and where it goes." },
  "11": { where: "overview", anchor: "ip-onsiteElectricity", how: "Answer on the Overview whether electricity is generated inside the installation, and how.", example: "No — all electricity is bought from the grid." },
};

/* ── The two attachments ───────────────────────────────────────────────────────────────── */
const ATTACHMENTS = {
  precursor_verification: {
    where: "precursors",
    how: "Ask the operator of the precursor's installation for the verification report on its figures. Enter the verifier, the accreditation number, the issue date and the reporting period (start and end) of the figures, and attach the report.",
  } as Guide,
  evidence_index: {
    where: "monthly",
    how: "Attach each month's documents — invoices, meter logs, certificates, calibration records — in that month's Documents step. Each is filed against the figure it supports.",
  } as Guide,
};

const REPORT_GUIDE: Partial<Record<ReportKind, Record<string, Guide>>> = {
  monitoring_plan: MONITORING_PLAN,
  emissions_report: EMISSIONS_REPORT,
  summary_report: SUMMARY_REPORT,
};

/** The guide of one row, or nothing where the row needs no instruction (it is not asked of anyone, or it is read from a screen that already says so). */
export function guideFor(kind: ReportKind, n: string, label: string): Guide | undefined {
  if (IDENTITY[label]) return IDENTITY[label];
  if (kind === "precursor_verification" || kind === "evidence_index") return ATTACHMENTS[kind];
  return REPORT_GUIDE[kind]?.[n];
}

/** Every key a report's guide table holds — for the tests that check no element of the regulation is left without its instruction. */
export const GUIDED_KEYS = {
  monitoring_plan: Object.keys(MONITORING_PLAN),
  emissions_report: Object.keys(EMISSIONS_REPORT),
  summary_report: Object.keys(SUMMARY_REPORT),
};

export const GUIDE_TABLES = { MONITORING_PLAN, EMISSIONS_REPORT, SUMMARY_REPORT, IDENTITY, ATTACHMENTS };

/* ── Where each guide leads ─────────────────────────────────────────────────────────────── */
export type GuideTarget = { installationId: string; workspaceId?: string };

export function hrefFor(guide: Guide, target: GuideTarget): string {
  const base = `/workspaces/installation/${encodeURIComponent(target.installationId)}`;
  const ws = target.workspaceId;
  switch (guide.where) {
    case "overview":
      return guide.anchor ? `${base}#${guide.anchor}` : base;
    case "products":
      return `${base}/products`;
    case "mmd":
      return ws ? `/workspaces/${ws}/mmd` : `${base}/products`;
    case "monthly":
      return ws ? `/workspaces/${ws}/monthly` : `${base}/products`;
    case "precursors":
      return ws ? `/workspaces/${ws}/precursors` : `${base}/products`;
  }
}

/* ── The values on a report row, said in the language of the screen ─────────────────────────────
   A row's value is built in report-set.ts out of the figures and the names the portal holds — "Rayong Steel Works: Draft — not
   finalised; Wire rod: Draft — not finalised" — so it reaches the screen as one English string no dictionary has as a key. It is taken
   apart at the "; " between products, at the ": " after a name and at a leading count ("3 good(s)"), and each piece the dictionary knows is
   said in Thai; a piece it does not know — a figure, a number, something the plant typed — passes through. The report itself, and every
   PDF made from it, stays English: this is for the screen only. */
/** The fixed phrases report-set.ts builds its values out of. Each is a dictionary key of its own; where one sits inside a longer value it is
    swapped in place, longest first so a phrase is never cut by a shorter one that it contains. */
export const VALUE_PHRASES = [
  "fuels, standard method: quantity × net calorific value × emission factor × oxidation factor",
  "process emissions, standard method: activity data × emission factor",
  "carbon-balance materials, mass balance: (carbon in − carbon out) × 44/12",
  "electricity: MWh consumed × emission factor of the source",
  "perfluorocarbons: anode-effect minutes × emission factor of the cell type",
  "standard method (net calorific value, emission factor, oxidation factor)",
  "mass balance (carbon content of each input and output)",
  "standard method (emission factor)",
  "— (write it under Methodology → Monitoring plan elements)",
  "— (attach it under Methodology → Installation diagram)",
  "default values used for some precursors",
  "monitoring throughout",
  "of precursor emissions",
  "made at this installation",
  "bought in",
  "none entered",
  "none required",
  "kept outside the portal",
  "(table below)",
  "mass balance",
  "standard method",
  "fuels",
].sort((x, y) => y.length - x.length);

export function translateValue(t: (en: string, vars?: Record<string, string | number>) => string, value: string): string {
  const phrases = (s: string): string => {
    let out = s;
    for (const p of VALUE_PHRASES) {
      if (!out.includes(p)) continue;
      const said = t(p);
      if (said !== p) out = out.split(p).join(said);
    }
    return out;
  };
  const one = (seg: string): string => {
    const s = seg.trim();
    if (!s) return seg;
    const direct = t(s);
    if (direct !== s) return direct;
    const colon = s.indexOf(": ");
    if (colon > 0) return `${one(s.slice(0, colon))}: ${one(s.slice(colon + 2))}`;
    if (s.startsWith("Yes — ")) return `${t("Yes")} — ${one(s.slice(6))}`;
    const counted = s.match(/^([\d.,]+) (.+)$/);
    if (counted) {
      const rest = t(counted[2]);
      if (rest !== counted[2]) return `${counted[1]} ${rest}`;
      return `${counted[1]} ${phrases(counted[2])}`;
    }
    // "Good name (CN 7207 11 11)" — the name is ours, the code is not
    const coded = s.match(/^(.*?) \((CN [\d ]+)\)(.*)$/);
    if (coded) return `${one(coded[1])} (${coded[2]})${phrases(coded[3])}`;
    return phrases(s);
  };
  return value.split("; ").map(one).join("; ");
}
