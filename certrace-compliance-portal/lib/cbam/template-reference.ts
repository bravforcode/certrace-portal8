/* ════════════════════════════════════════════════════════════
   THE EU COMMUNICATION TEMPLATE, AS DATA

   Transcribed from "CBAM Communication template for installations"
   v2.1.1 (13 Dec 2024), hidden sheet `Parameters_Constants`. Cell references
   are given so any figure here can be checked against the workbook in one
   lookup rather than by searching it.

   Nothing in this file is a judgement call. Where the workbook offers a closed
   list, the list is reproduced verbatim, in its order, including the spellings
   ("Calcined clays " carries the trailing space it has in B91 — matching is by
   `id`, never by label, precisely so that kind of thing cannot bite).

   WHY IT MATTERS THAT THIS IS EXACT. The report Certrace generates has to be
   checkable against the workbook line by line by a verifier who has the
   workbook open beside it. A category we renamed to read better, or a route we
   merged because two looked similar, is a difference the verifier has to
   investigate before they can agree the two documents say the same thing.
   ════════════════════════════════════════════════════════════ */

/** Parameters_Constants!A89:A106 — the 18 aggregated goods categories, in
    workbook order. `id` is ours and stable; `label` is the workbook's. */
export type AggregatedGood = {
  id: string;
  /** exactly as the workbook spells it (CONST_LIST_Goods) */
  label: string;
  /** B89:B106 — "t" for everything except electricity, which is MWh */
  unit: "t" | "MWh";
  /** C89:C106 — are indirect emissions reported for this good in the
      DEFINITIVE regime? Note this differs from the transitional column D,
      where all but electricity were relevant. */
  indirectRelevantDefinitive: boolean;
  /** D89:D106 — the transitional-period answer, kept because a 2025 filing
      being re-examined has to be readable against the rules it was made under */
  indirectRelevantTransitional: boolean;
  /** E89:E106 — does this good have more than one production route? */
  routeRelevant: boolean;
  /** BN89:BN106 — PFC emissions apply (the two aluminium categories) */
  pfcRelevant: boolean;
  /** G89:P106 — CONST_MATRIX_ProductionRoute, "n.a." entries dropped */
  routes: string[];
  /** B110:I127 — CONST_MATRIX_SpecialPara, the sector-specific parameters
      that ride along with this good on the communication row */
  specialParameters: string[];
};

const ALL_ROUTES = ["All production routes"];

export const AGGREGATED_GOODS: AggregatedGood[] = [
  {
    id: "cement",
    label: "Cement",
    unit: "t",
    indirectRelevantDefinitive: true,
    indirectRelevantTransitional: true,
    routeRelevant: false,
    pfcRelevant: false,
    routes: ALL_ROUTES,
    specialParameters: ["Clinker factor"],
  },
  {
    id: "cement_clinker",
    label: "Cement clinker",
    unit: "t",
    indirectRelevantDefinitive: true,
    indirectRelevantTransitional: true,
    routeRelevant: false,
    pfcRelevant: false,
    routes: ALL_ROUTES,
    specialParameters: [],
  },
  {
    id: "calcined_clays",
    // The trailing space is the workbook's (B91). Kept so a byte-for-byte
    // comparison against an exported template does not report a difference.
    label: "Calcined clays ",
    unit: "t",
    indirectRelevantDefinitive: true,
    indirectRelevantTransitional: true,
    routeRelevant: false,
    pfcRelevant: false,
    routes: ALL_ROUTES,
    specialParameters: ["Calcined or not"],
  },
  {
    id: "aluminous_cement",
    label: "Aluminous cement",
    unit: "t",
    indirectRelevantDefinitive: true,
    indirectRelevantTransitional: true,
    routeRelevant: false,
    pfcRelevant: false,
    routes: ALL_ROUTES,
    specialParameters: [],
  },
  {
    id: "iron_or_steel_products",
    label: "Iron or steel products",
    unit: "t",
    indirectRelevantDefinitive: false,
    indirectRelevantTransitional: true,
    routeRelevant: false,
    pfcRelevant: false,
    routes: ALL_ROUTES,
    specialParameters: [
      "The main reducing agent of the precursor, if known",
      "Steel mill identification number",
      "% Mn",
      "% Cr",
      "% Ni",
      "% other alloys",
      "% other materials",
    ],
  },
  {
    id: "crude_steel",
    label: "Crude steel",
    unit: "t",
    indirectRelevantDefinitive: false,
    indirectRelevantTransitional: true,
    routeRelevant: true,
    pfcRelevant: false,
    routes: ["Basic oxygen steelmaking", "Electric arc furnace", "Other production routes", "Unknown production routes"],
    specialParameters: [
      "The main reducing agent of the precursor, if known",
      "% Mn",
      "% Cr",
      "% Ni",
      "% other alloys",
      "t scrap per t steel",
      "% pre-consumer scrap",
    ],
  },
  {
    id: "direct_reduced_iron",
    label: "Direct reduced iron",
    unit: "t",
    indirectRelevantDefinitive: false,
    indirectRelevantTransitional: true,
    routeRelevant: false,
    pfcRelevant: false,
    routes: ALL_ROUTES,
    specialParameters: ["The main reducing agent of the precursor, if known", "% Mn", "% Cr", "% Ni", "% other alloys"],
  },
  {
    id: "pig_iron",
    label: "Pig iron",
    unit: "t",
    indirectRelevantDefinitive: false,
    indirectRelevantTransitional: true,
    routeRelevant: true,
    pfcRelevant: false,
    routes: ["Blast furnace route", "Smelting reduction", "Other production routes", "Unknown production routes"],
    specialParameters: ["The main reducing agent of the precursor, if known", "% Mn", "% Cr", "% Ni", "% other alloys"],
  },
  {
    id: "alloys",
    label: "Alloys (FeMn, FeCr, FeNi)",
    unit: "t",
    indirectRelevantDefinitive: false,
    indirectRelevantTransitional: true,
    routeRelevant: false,
    pfcRelevant: false,
    routes: ALL_ROUTES,
    specialParameters: ["% Mn", "% Cr", "% Ni", "% carbon"],
  },
  {
    id: "sintered_ore",
    label: "Sintered Ore",
    unit: "t",
    indirectRelevantDefinitive: true,
    indirectRelevantTransitional: true,
    routeRelevant: false,
    pfcRelevant: false,
    routes: ALL_ROUTES,
    specialParameters: [],
  },
  {
    id: "hydrogen",
    label: "Hydrogen",
    unit: "t",
    indirectRelevantDefinitive: false,
    indirectRelevantTransitional: true,
    routeRelevant: true,
    pfcRelevant: false,
    routes: [
      "Steam reforming and partial oxidation",
      "Electrolysis of water",
      "Chlor-Alkali electrolysis and production of chlorates",
      "Other production routes",
      "Unknown production routes",
    ],
    specialParameters: [],
  },
  {
    id: "ammonia",
    label: "Ammonia",
    unit: "t",
    indirectRelevantDefinitive: false,
    indirectRelevantTransitional: true,
    routeRelevant: true,
    pfcRelevant: false,
    routes: [
      "Haber-Bosch process with steam reforming of natural gas or biogas",
      "Haber-Bosch process with gasification of coal or other fuels",
      "Other production routes",
      "Unknown production routes",
    ],
    specialParameters: ["Concentration, if hydrous solution"],
  },
  {
    id: "nitric_acid",
    label: "Nitric acid",
    unit: "t",
    indirectRelevantDefinitive: true,
    indirectRelevantTransitional: true,
    routeRelevant: false,
    pfcRelevant: false,
    routes: ALL_ROUTES,
    specialParameters: ["% nitric acid"],
  },
  {
    id: "urea",
    label: "Urea",
    unit: "t",
    indirectRelevantDefinitive: true,
    indirectRelevantTransitional: true,
    routeRelevant: false,
    pfcRelevant: false,
    routes: ALL_ROUTES,
    specialParameters: ["% urea", "% N contained"],
  },
  {
    id: "mixed_fertilisers",
    label: "Mixed fertilisers",
    unit: "t",
    indirectRelevantDefinitive: true,
    indirectRelevantTransitional: true,
    routeRelevant: false,
    pfcRelevant: false,
    routes: ALL_ROUTES,
    specialParameters: ["% N as ammonium (NH4+)", "% N as nitrate (NO3–)", "% N as Urea", "% N in other (organic) forms"],
  },
  {
    id: "aluminium_products",
    label: "Aluminium products",
    unit: "t",
    indirectRelevantDefinitive: false,
    indirectRelevantTransitional: true,
    routeRelevant: false,
    pfcRelevant: true,
    routes: ALL_ROUTES,
    specialParameters: ["t scrap per t aluminium", "% non-aluminium elements", "% pre-consumer scrap"],
  },
  {
    id: "unwrought_aluminium",
    label: "Unwrought aluminium",
    unit: "t",
    indirectRelevantDefinitive: false,
    indirectRelevantTransitional: true,
    routeRelevant: true,
    pfcRelevant: true,
    routes: ["Primary (electrolytic) smelting", "Secondary melting (recycling)", "Other production routes", "Unknown production routes"],
    specialParameters: ["t scrap per t aluminium", "% non-aluminium elements", "% pre-consumer scrap"],
  },
  {
    id: "electricity",
    label: "Electricity (export to EU)",
    unit: "MWh",
    indirectRelevantDefinitive: false,
    indirectRelevantTransitional: false,
    routeRelevant: false,
    pfcRelevant: false,
    routes: ALL_ROUTES,
    specialParameters: [],
  },
];

export const goodById = (id: string): AggregatedGood | undefined => AGGREGATED_GOODS.find((g) => g.id === id);
export const goodByLabel = (label: string): AggregatedGood | undefined => AGGREGATED_GOODS.find((g) => g.label.trim() === label.trim());

/* ── CN code → aggregated goods category ────────────────────────
   Parameters_Constants!B133 (CONST_CNTR_ListGoodsForCN) and the 569 codes
   beneath it in columns B..S. This is the map the workbook uses, transcribed
   whole rather than inferred from CN chapter prefixes.

   PREFIXES WOULD BE WRONG, and expensively so. Chapter 72 alone splits across
   five different categories — 7201 is Pig iron, 7202 is Alloys, 7203 is Direct
   reduced iron, 7206–7207 are Crude steel, and 7205/7208 onward are Iron or
   steel products. A `startsWith("72")` would put every one of them in the same
   bucket, and the bucket decides which default values apply, which sector
   parameters are mandatory, and whether indirect emissions are reported at
   all. Getting it wrong is not a labelling error, it is a different filing.

   Codes are stored WITHOUT spaces, as the workbook stores them. `categoryForCn`
   strips separators before looking up, so "7207 11 90" and "72071190" both
   resolve. */
export const CN_TO_GOOD: Record<string, string> = {
  "25070080": "calcined_clays",
  "25231000": "cement_clinker",
  "25232100": "cement",
  "25232900": "cement",
  "25233000": "aluminous_cement",
  "25239000": "cement",
  "26011200": "sintered_ore",
  "27160000": "electricity",
  "28041000": "hydrogen",
  "28080000": "nitric_acid",
  "28141000": "ammonia",
  "28142000": "ammonia",
  "28342100": "mixed_fertilisers",
  "31021010": "urea",
  "31021090": "urea",
  "31022100": "mixed_fertilisers",
  "31022900": "mixed_fertilisers",
  "31023010": "mixed_fertilisers",
  "31023090": "mixed_fertilisers",
  "31024010": "mixed_fertilisers",
  "31024090": "mixed_fertilisers",
  "31025000": "mixed_fertilisers",
  "31026000": "mixed_fertilisers",
  "31028000": "mixed_fertilisers",
  "31029000": "mixed_fertilisers",
  "31051000": "mixed_fertilisers",
  "31052010": "mixed_fertilisers",
  "31052090": "mixed_fertilisers",
  "31053000": "mixed_fertilisers",
  "31054000": "mixed_fertilisers",
  "31055100": "mixed_fertilisers",
  "31055900": "mixed_fertilisers",
  "31059020": "mixed_fertilisers",
  "31059080": "mixed_fertilisers",
  "72011011": "pig_iron",
  "72011019": "pig_iron",
  "72011030": "pig_iron",
  "72011090": "pig_iron",
  "72012000": "pig_iron",
  "72015010": "pig_iron",
  "72015090": "pig_iron",
  "72021120": "alloys",
  "72021180": "alloys",
  "72021900": "alloys",
  "72024110": "alloys",
  "72024190": "alloys",
  "72024910": "alloys",
  "72024950": "alloys",
  "72024990": "alloys",
  "72026000": "alloys",
  "72031000": "direct_reduced_iron",
  "72039000": "direct_reduced_iron",
  "72051000": "iron_or_steel_products",
  "72052100": "iron_or_steel_products",
  "72052900": "iron_or_steel_products",
  "72061000": "crude_steel",
  "72069000": "crude_steel",
  "72071111": "crude_steel",
  "72071114": "crude_steel",
  "72071116": "crude_steel",
  "72071190": "crude_steel",
  "72071210": "crude_steel",
  "72071290": "crude_steel",
  "72071912": "crude_steel",
  "72071919": "crude_steel",
  "72071980": "crude_steel",
  "72072011": "crude_steel",
  "72072015": "crude_steel",
  "72072017": "crude_steel",
  "72072019": "crude_steel",
  "72072032": "crude_steel",
  "72072039": "crude_steel",
  "72072052": "crude_steel",
  "72072059": "crude_steel",
  "72072080": "crude_steel",
  "72081000": "iron_or_steel_products",
  "72082500": "iron_or_steel_products",
  "72082600": "iron_or_steel_products",
  "72082700": "iron_or_steel_products",
  "72083600": "iron_or_steel_products",
  "72083700": "iron_or_steel_products",
  "72083800": "iron_or_steel_products",
  "72083900": "iron_or_steel_products",
  "72084000": "iron_or_steel_products",
  "72085120": "iron_or_steel_products",
  "72085191": "iron_or_steel_products",
  "72085198": "iron_or_steel_products",
  "72085210": "iron_or_steel_products",
  "72085291": "iron_or_steel_products",
  "72085299": "iron_or_steel_products",
  "72085310": "iron_or_steel_products",
  "72085390": "iron_or_steel_products",
  "72085400": "iron_or_steel_products",
  "72089020": "iron_or_steel_products",
  "72089080": "iron_or_steel_products",
  "72091500": "iron_or_steel_products",
  "72091610": "iron_or_steel_products",
  "72091690": "iron_or_steel_products",
  "72091710": "iron_or_steel_products",
  "72091790": "iron_or_steel_products",
  "72091810": "iron_or_steel_products",
  "72091891": "iron_or_steel_products",
  "72091899": "iron_or_steel_products",
  "72092500": "iron_or_steel_products",
  "72092610": "iron_or_steel_products",
  "72092690": "iron_or_steel_products",
  "72092710": "iron_or_steel_products",
  "72092790": "iron_or_steel_products",
  "72092810": "iron_or_steel_products",
  "72092890": "iron_or_steel_products",
  "72099020": "iron_or_steel_products",
  "72099080": "iron_or_steel_products",
  "72101100": "iron_or_steel_products",
  "72101220": "iron_or_steel_products",
  "72101280": "iron_or_steel_products",
  "72102000": "iron_or_steel_products",
  "72103000": "iron_or_steel_products",
  "72104100": "iron_or_steel_products",
  "72104900": "iron_or_steel_products",
  "72105000": "iron_or_steel_products",
  "72106100": "iron_or_steel_products",
  "72106900": "iron_or_steel_products",
  "72107010": "iron_or_steel_products",
  "72107080": "iron_or_steel_products",
  "72109030": "iron_or_steel_products",
  "72109040": "iron_or_steel_products",
  "72109080": "iron_or_steel_products",
  "72111300": "iron_or_steel_products",
  "72111400": "iron_or_steel_products",
  "72111900": "iron_or_steel_products",
  "72112320": "iron_or_steel_products",
  "72112330": "iron_or_steel_products",
  "72112380": "iron_or_steel_products",
  "72112900": "iron_or_steel_products",
  "72119020": "iron_or_steel_products",
  "72119080": "iron_or_steel_products",
  "72121010": "iron_or_steel_products",
  "72121090": "iron_or_steel_products",
  "72122000": "iron_or_steel_products",
  "72123000": "iron_or_steel_products",
  "72124020": "iron_or_steel_products",
  "72124080": "iron_or_steel_products",
  "72125020": "iron_or_steel_products",
  "72125030": "iron_or_steel_products",
  "72125040": "iron_or_steel_products",
  "72125061": "iron_or_steel_products",
  "72125069": "iron_or_steel_products",
  "72125090": "iron_or_steel_products",
  "72126000": "iron_or_steel_products",
  "72131000": "iron_or_steel_products",
  "72132000": "iron_or_steel_products",
  "72139110": "iron_or_steel_products",
  "72139120": "iron_or_steel_products",
  "72139141": "iron_or_steel_products",
  "72139149": "iron_or_steel_products",
  "72139170": "iron_or_steel_products",
  "72139190": "iron_or_steel_products",
  "72139910": "iron_or_steel_products",
  "72139990": "iron_or_steel_products",
  "72141000": "iron_or_steel_products",
  "72142000": "iron_or_steel_products",
  "72143000": "iron_or_steel_products",
  "72149110": "iron_or_steel_products",
  "72149190": "iron_or_steel_products",
  "72149910": "iron_or_steel_products",
  "72149931": "iron_or_steel_products",
  "72149939": "iron_or_steel_products",
  "72149950": "iron_or_steel_products",
  "72149971": "iron_or_steel_products",
  "72149979": "iron_or_steel_products",
  "72149995": "iron_or_steel_products",
  "72151000": "iron_or_steel_products",
  "72155011": "iron_or_steel_products",
  "72155019": "iron_or_steel_products",
  "72155080": "iron_or_steel_products",
  "72159000": "iron_or_steel_products",
  "72161000": "iron_or_steel_products",
  "72162100": "iron_or_steel_products",
  "72162200": "iron_or_steel_products",
  "72163110": "iron_or_steel_products",
  "72163190": "iron_or_steel_products",
  "72163211": "iron_or_steel_products",
  "72163219": "iron_or_steel_products",
  "72163291": "iron_or_steel_products",
  "72163299": "iron_or_steel_products",
  "72163310": "iron_or_steel_products",
  "72163390": "iron_or_steel_products",
  "72164010": "iron_or_steel_products",
  "72164090": "iron_or_steel_products",
  "72165010": "iron_or_steel_products",
  "72165091": "iron_or_steel_products",
  "72165099": "iron_or_steel_products",
  "72166110": "iron_or_steel_products",
  "72166190": "iron_or_steel_products",
  "72166900": "iron_or_steel_products",
  "72169110": "iron_or_steel_products",
  "72169180": "iron_or_steel_products",
  "72169900": "iron_or_steel_products",
  "72171010": "iron_or_steel_products",
  "72171031": "iron_or_steel_products",
  "72171039": "iron_or_steel_products",
  "72171050": "iron_or_steel_products",
  "72171090": "iron_or_steel_products",
  "72172010": "iron_or_steel_products",
  "72172030": "iron_or_steel_products",
  "72172050": "iron_or_steel_products",
  "72172090": "iron_or_steel_products",
  "72173041": "iron_or_steel_products",
  "72173049": "iron_or_steel_products",
  "72173050": "iron_or_steel_products",
  "72173090": "iron_or_steel_products",
  "72179020": "iron_or_steel_products",
  "72179050": "iron_or_steel_products",
  "72179090": "iron_or_steel_products",
  "72181000": "crude_steel",
  "72189110": "crude_steel",
  "72189180": "crude_steel",
  "72189911": "crude_steel",
  "72189919": "crude_steel",
  "72189920": "crude_steel",
  "72189980": "crude_steel",
  "72191100": "iron_or_steel_products",
  "72191210": "iron_or_steel_products",
  "72191290": "iron_or_steel_products",
  "72191310": "iron_or_steel_products",
  "72191390": "iron_or_steel_products",
  "72191410": "iron_or_steel_products",
  "72191490": "iron_or_steel_products",
  "72192110": "iron_or_steel_products",
  "72192190": "iron_or_steel_products",
  "72192210": "iron_or_steel_products",
  "72192290": "iron_or_steel_products",
  "72192300": "iron_or_steel_products",
  "72192400": "iron_or_steel_products",
  "72193100": "iron_or_steel_products",
  "72193210": "iron_or_steel_products",
  "72193290": "iron_or_steel_products",
  "72193310": "iron_or_steel_products",
  "72193390": "iron_or_steel_products",
  "72193410": "iron_or_steel_products",
  "72193490": "iron_or_steel_products",
  "72193510": "iron_or_steel_products",
  "72193590": "iron_or_steel_products",
  "72199020": "iron_or_steel_products",
  "72199080": "iron_or_steel_products",
  "72201100": "iron_or_steel_products",
  "72201200": "iron_or_steel_products",
  "72202021": "iron_or_steel_products",
  "72202029": "iron_or_steel_products",
  "72202041": "iron_or_steel_products",
  "72202049": "iron_or_steel_products",
  "72202081": "iron_or_steel_products",
  "72202089": "iron_or_steel_products",
  "72209020": "iron_or_steel_products",
  "72209080": "iron_or_steel_products",
  "72210010": "iron_or_steel_products",
  "72210090": "iron_or_steel_products",
  "72221111": "iron_or_steel_products",
  "72221119": "iron_or_steel_products",
  "72221181": "iron_or_steel_products",
  "72221189": "iron_or_steel_products",
  "72221910": "iron_or_steel_products",
  "72221990": "iron_or_steel_products",
  "72222011": "iron_or_steel_products",
  "72222019": "iron_or_steel_products",
  "72222021": "iron_or_steel_products",
  "72222029": "iron_or_steel_products",
  "72222031": "iron_or_steel_products",
  "72222039": "iron_or_steel_products",
  "72222081": "iron_or_steel_products",
  "72222089": "iron_or_steel_products",
  "72223051": "iron_or_steel_products",
  "72223091": "iron_or_steel_products",
  "72223097": "iron_or_steel_products",
  "72224010": "iron_or_steel_products",
  "72224050": "iron_or_steel_products",
  "72224090": "iron_or_steel_products",
  "72230011": "iron_or_steel_products",
  "72230019": "iron_or_steel_products",
  "72230091": "iron_or_steel_products",
  "72230099": "iron_or_steel_products",
  "72241010": "crude_steel",
  "72241090": "crude_steel",
  "72249002": "crude_steel",
  "72249003": "crude_steel",
  "72249005": "crude_steel",
  "72249007": "crude_steel",
  "72249014": "crude_steel",
  "72249018": "crude_steel",
  "72249031": "crude_steel",
  "72249038": "crude_steel",
  "72249090": "crude_steel",
  "72251100": "iron_or_steel_products",
  "72251910": "iron_or_steel_products",
  "72251990": "iron_or_steel_products",
  "72253010": "iron_or_steel_products",
  "72253030": "iron_or_steel_products",
  "72253090": "iron_or_steel_products",
  "72254012": "iron_or_steel_products",
  "72254015": "iron_or_steel_products",
  "72254040": "iron_or_steel_products",
  "72254060": "iron_or_steel_products",
  "72254090": "iron_or_steel_products",
  "72255020": "iron_or_steel_products",
  "72255080": "iron_or_steel_products",
  "72259100": "iron_or_steel_products",
  "72259200": "iron_or_steel_products",
  "72259900": "iron_or_steel_products",
  "72261100": "iron_or_steel_products",
  "72261910": "iron_or_steel_products",
  "72261980": "iron_or_steel_products",
  "72262000": "iron_or_steel_products",
  "72269120": "iron_or_steel_products",
  "72269191": "iron_or_steel_products",
  "72269199": "iron_or_steel_products",
  "72269200": "iron_or_steel_products",
  "72269910": "iron_or_steel_products",
  "72269930": "iron_or_steel_products",
  "72269970": "iron_or_steel_products",
  "72271000": "iron_or_steel_products",
  "72272000": "iron_or_steel_products",
  "72279010": "iron_or_steel_products",
  "72279050": "iron_or_steel_products",
  "72279095": "iron_or_steel_products",
  "72281020": "iron_or_steel_products",
  "72281050": "iron_or_steel_products",
  "72281090": "iron_or_steel_products",
  "72282010": "iron_or_steel_products",
  "72282091": "iron_or_steel_products",
  "72282099": "iron_or_steel_products",
  "72283020": "iron_or_steel_products",
  "72283041": "iron_or_steel_products",
  "72283049": "iron_or_steel_products",
  "72283061": "iron_or_steel_products",
  "72283069": "iron_or_steel_products",
  "72283070": "iron_or_steel_products",
  "72283089": "iron_or_steel_products",
  "72284010": "iron_or_steel_products",
  "72284090": "iron_or_steel_products",
  "72285020": "iron_or_steel_products",
  "72285040": "iron_or_steel_products",
  "72285061": "iron_or_steel_products",
  "72285069": "iron_or_steel_products",
  "72285080": "iron_or_steel_products",
  "72286020": "iron_or_steel_products",
  "72286080": "iron_or_steel_products",
  "72287010": "iron_or_steel_products",
  "72287090": "iron_or_steel_products",
  "72288000": "iron_or_steel_products",
  "72292000": "iron_or_steel_products",
  "72299020": "iron_or_steel_products",
  "72299050": "iron_or_steel_products",
  "72299090": "iron_or_steel_products",
  "73011000": "iron_or_steel_products",
  "73012000": "iron_or_steel_products",
  "73021010": "iron_or_steel_products",
  "73021022": "iron_or_steel_products",
  "73021028": "iron_or_steel_products",
  "73021040": "iron_or_steel_products",
  "73021050": "iron_or_steel_products",
  "73021090": "iron_or_steel_products",
  "73023000": "iron_or_steel_products",
  "73024000": "iron_or_steel_products",
  "73029000": "iron_or_steel_products",
  "73030010": "iron_or_steel_products",
  "73030090": "iron_or_steel_products",
  "73041100": "iron_or_steel_products",
  "73041910": "iron_or_steel_products",
  "73041930": "iron_or_steel_products",
  "73041990": "iron_or_steel_products",
  "73042200": "iron_or_steel_products",
  "73042300": "iron_or_steel_products",
  "73042400": "iron_or_steel_products",
  "73042910": "iron_or_steel_products",
  "73042930": "iron_or_steel_products",
  "73042990": "iron_or_steel_products",
  "73043120": "iron_or_steel_products",
  "73043180": "iron_or_steel_products",
  "73043950": "iron_or_steel_products",
  "73043982": "iron_or_steel_products",
  "73043983": "iron_or_steel_products",
  "73043988": "iron_or_steel_products",
  "73044100": "iron_or_steel_products",
  "73044983": "iron_or_steel_products",
  "73044985": "iron_or_steel_products",
  "73044989": "iron_or_steel_products",
  "73045110": "iron_or_steel_products",
  "73045181": "iron_or_steel_products",
  "73045189": "iron_or_steel_products",
  "73045930": "iron_or_steel_products",
  "73045982": "iron_or_steel_products",
  "73045983": "iron_or_steel_products",
  "73045989": "iron_or_steel_products",
  "73049000": "iron_or_steel_products",
  "73051100": "iron_or_steel_products",
  "73051200": "iron_or_steel_products",
  "73051900": "iron_or_steel_products",
  "73052000": "iron_or_steel_products",
  "73053100": "iron_or_steel_products",
  "73053900": "iron_or_steel_products",
  "73059000": "iron_or_steel_products",
  "73061100": "iron_or_steel_products",
  "73061900": "iron_or_steel_products",
  "73062100": "iron_or_steel_products",
  "73062900": "iron_or_steel_products",
  "73063012": "iron_or_steel_products",
  "73063018": "iron_or_steel_products",
  "73063041": "iron_or_steel_products",
  "73063049": "iron_or_steel_products",
  "73063072": "iron_or_steel_products",
  "73063077": "iron_or_steel_products",
  "73063080": "iron_or_steel_products",
  "73064020": "iron_or_steel_products",
  "73064080": "iron_or_steel_products",
  "73065021": "iron_or_steel_products",
  "73065029": "iron_or_steel_products",
  "73065080": "iron_or_steel_products",
  "73066110": "iron_or_steel_products",
  "73066192": "iron_or_steel_products",
  "73066199": "iron_or_steel_products",
  "73066910": "iron_or_steel_products",
  "73066990": "iron_or_steel_products",
  "73069000": "iron_or_steel_products",
  "73071110": "iron_or_steel_products",
  "73071190": "iron_or_steel_products",
  "73071910": "iron_or_steel_products",
  "73071990": "iron_or_steel_products",
  "73072100": "iron_or_steel_products",
  "73072210": "iron_or_steel_products",
  "73072290": "iron_or_steel_products",
  "73072310": "iron_or_steel_products",
  "73072390": "iron_or_steel_products",
  "73072910": "iron_or_steel_products",
  "73072980": "iron_or_steel_products",
  "73079100": "iron_or_steel_products",
  "73079210": "iron_or_steel_products",
  "73079290": "iron_or_steel_products",
  "73079311": "iron_or_steel_products",
  "73079319": "iron_or_steel_products",
  "73079391": "iron_or_steel_products",
  "73079399": "iron_or_steel_products",
  "73079910": "iron_or_steel_products",
  "73079980": "iron_or_steel_products",
  "73081000": "iron_or_steel_products",
  "73082000": "iron_or_steel_products",
  "73083000": "iron_or_steel_products",
  "73084000": "iron_or_steel_products",
  "73089051": "iron_or_steel_products",
  "73089059": "iron_or_steel_products",
  "73089098": "iron_or_steel_products",
  "73090010": "iron_or_steel_products",
  "73090030": "iron_or_steel_products",
  "73090051": "iron_or_steel_products",
  "73090059": "iron_or_steel_products",
  "73090090": "iron_or_steel_products",
  "73101000": "iron_or_steel_products",
  "73102111": "iron_or_steel_products",
  "73102119": "iron_or_steel_products",
  "73102191": "iron_or_steel_products",
  "73102199": "iron_or_steel_products",
  "73102910": "iron_or_steel_products",
  "73102990": "iron_or_steel_products",
  "73110011": "iron_or_steel_products",
  "73110013": "iron_or_steel_products",
  "73110019": "iron_or_steel_products",
  "73110030": "iron_or_steel_products",
  "73110091": "iron_or_steel_products",
  "73110099": "iron_or_steel_products",
  "73181100": "iron_or_steel_products",
  "73181210": "iron_or_steel_products",
  "73181290": "iron_or_steel_products",
  "73181300": "iron_or_steel_products",
  "73181410": "iron_or_steel_products",
  "73181491": "iron_or_steel_products",
  "73181499": "iron_or_steel_products",
  "73181520": "iron_or_steel_products",
  "73181535": "iron_or_steel_products",
  "73181542": "iron_or_steel_products",
  "73181548": "iron_or_steel_products",
  "73181552": "iron_or_steel_products",
  "73181558": "iron_or_steel_products",
  "73181562": "iron_or_steel_products",
  "73181568": "iron_or_steel_products",
  "73181575": "iron_or_steel_products",
  "73181582": "iron_or_steel_products",
  "73181588": "iron_or_steel_products",
  "73181595": "iron_or_steel_products",
  "73181631": "iron_or_steel_products",
  "73181639": "iron_or_steel_products",
  "73181640": "iron_or_steel_products",
  "73181660": "iron_or_steel_products",
  "73181692": "iron_or_steel_products",
  "73181699": "iron_or_steel_products",
  "73181900": "iron_or_steel_products",
  "73182100": "iron_or_steel_products",
  "73182200": "iron_or_steel_products",
  "73182300": "iron_or_steel_products",
  "73182400": "iron_or_steel_products",
  "73182900": "iron_or_steel_products",
  "73261100": "iron_or_steel_products",
  "73261910": "iron_or_steel_products",
  "73261990": "iron_or_steel_products",
  "73262000": "iron_or_steel_products",
  "73269030": "iron_or_steel_products",
  "73269040": "iron_or_steel_products",
  "73269050": "iron_or_steel_products",
  "73269060": "iron_or_steel_products",
  "73269092": "iron_or_steel_products",
  "73269094": "iron_or_steel_products",
  "73269096": "iron_or_steel_products",
  "73269098": "iron_or_steel_products",
  "76011010": "unwrought_aluminium",
  "76011090": "unwrought_aluminium",
  "76012030": "unwrought_aluminium",
  "76012040": "unwrought_aluminium",
  "76012080": "unwrought_aluminium",
  "76031000": "aluminium_products",
  "76032000": "aluminium_products",
  "76041010": "aluminium_products",
  "76041090": "aluminium_products",
  "76042100": "aluminium_products",
  "76042910": "aluminium_products",
  "76042990": "aluminium_products",
  "76051100": "aluminium_products",
  "76051900": "aluminium_products",
  "76052100": "aluminium_products",
  "76052900": "aluminium_products",
  "76061130": "aluminium_products",
  "76061150": "aluminium_products",
  "76061191": "aluminium_products",
  "76061193": "aluminium_products",
  "76061199": "aluminium_products",
  "76061211": "aluminium_products",
  "76061219": "aluminium_products",
  "76061230": "aluminium_products",
  "76061250": "aluminium_products",
  "76061292": "aluminium_products",
  "76061293": "aluminium_products",
  "76061299": "aluminium_products",
  "76069100": "aluminium_products",
  "76069200": "aluminium_products",
  "76071111": "aluminium_products",
  "76071119": "aluminium_products",
  "76071190": "aluminium_products",
  "76071910": "aluminium_products",
  "76071990": "aluminium_products",
  "76072010": "aluminium_products",
  "76072091": "aluminium_products",
  "76072099": "aluminium_products",
  "76081000": "aluminium_products",
  "76082020": "aluminium_products",
  "76082081": "aluminium_products",
  "76082089": "aluminium_products",
  "76090000": "aluminium_products",
  "76101000": "aluminium_products",
  "76109010": "aluminium_products",
  "76109090": "aluminium_products",
  "76110000": "aluminium_products",
  "76121000": "aluminium_products",
  "76129020": "aluminium_products",
  "76129030": "aluminium_products",
  "76129080": "aluminium_products",
  "76130000": "aluminium_products",
  "76141000": "aluminium_products",
  "76149000": "aluminium_products",
  "76161000": "aluminium_products",
  "76169100": "aluminium_products",
  "76169910": "aluminium_products",
  "76169990": "aluminium_products",
};

/** The aggregated goods category for a CN code, or undefined if it is not a
    CBAM good. Tolerant of spaces and dots; an 8-digit code is required, because
    a 6-digit HS heading genuinely does not determine the category. */
export function categoryForCn(cnCode: string | null | undefined): AggregatedGood | undefined {
  const digits = String(cnCode ?? "").replace(/[^0-9]/g, "");
  if (digits.length !== 8) return undefined;
  const id = CN_TO_GOOD[digits];
  return id ? goodById(id) : undefined;
}

/* ── Closed lists the template validates against ──────────────
   Each is a drop-down in the workbook, which means a value outside it is a
   value the template cannot round-trip. They are ordered as the workbook
   orders them, because the order is what a reader comparing the two documents
   scans by. */

/** Parameters_Constants!B42:F42 — CONST_DataQuality. Ordered best to worst,
    which is also the order the workbook lists them in. */
export const DATA_QUALITY_OPTIONS = [
  "Mostly measurements & analyses",
  "Mostly measurements & national standard factors for e.g. the emission factor",
  "Mostly measurements & sector-specific standard factors for e.g. the emission factor",
  "Mostly measurements & international standard factors for e.g. the emission factor",
  "Mostly default values provided by the European Commission",
] as const;

/** B43:E43 — CONST_DataVerification */
export const DATA_VERIFICATION_OPTIONS = ["Third-party verification", "Internal audits", "Four eyes principle", "None"] as const;

/** B44:D44 — CONST_DataQualityJustification */
export const DATA_QUALITY_JUSTIFICATION_OPTIONS = ["Unreasonable costs for more accurate monitoring", "Data gaps", "Other"] as const;

/** C45:I45 — CONST_CarbonPriceType */
export const CARBON_PRICE_TYPE_OPTIONS = [
  "None",
  "Carbon Tax",
  "Carbon Levy",
  "Carbon Fee",
  "National Emissions Trading System",
  "Regional Emissions Trading System",
  "Combination",
  "Other",
] as const;

/** C46:G46 — CONST_RebateType */
export const REBATE_TYPE_OPTIONS = ["None", "Free allocation", "Financial compensation", "Tax deduction", "Combination", "Other"] as const;

/** B56:D56 — CONST_MonitoringApproach */
export const MONITORING_APPROACH_OPTIONS = ["Combustion", "Process emissions", "Mass Balance"] as const;

/** B57:C57 — CONST_PFCSlopeOrOvervoltage */
export const PFC_METHOD_OPTIONS = ["Slope method", "Overvoltage method"] as const;

/** B58:E58 — CONST_ReducingAgent */
export const REDUCING_AGENT_OPTIONS = ["Coal or coke", "Natural gas", "Biogas", "Hydrogen"] as const;

/** B55:C55 — CONST_CEMSType */
export const CEMS_TYPE_OPTIONS = ["CO2", "N2O"] as const;

/** B68:C68 / B69:D69 */
export const MEASURED_OR_DEFAULT_OPTIONS = ["Measured", "Default"] as const;
export const MEASURED_DEFAULT_UNKNOWN_OPTIONS = ["Measured", "Default", "Unknown"] as const;

/** B15:H15 — CONST_ElecSource. These are the CLAUSE REFERENCES from Annex II
    of IR 2025/2547, not descriptions, and the workbook prints them raw into
    the communication row (Summary_Products column N). A declarant reading
    "D.4.1" needs to know what it means, so the gloss travels with the code —
    but the code is what gets filed, unchanged. */
export const ELECTRICITY_EF_SOURCES: { code: string; gloss: string }[] = [
  { code: "D.4(a)", gloss: "Actual emission factor of the electricity received, where a direct technical link or PPA supports it" },
  { code: "D.4(b)", gloss: "Grid emission factor of the country of production" },
  { code: "D.4.1", gloss: "Electricity received from the grid — default country factor" },
  { code: "D.4.2", gloss: "Electricity from a direct technical link with a generating installation" },
  { code: "D.4.3.1", gloss: "Power purchase agreement — actual factor of the contracted generator" },
  { code: "D.4.3.2", gloss: "Power purchase agreement — residual mix or fallback factor" },
  { code: "Mix", gloss: "More than one of the above applied across the period; the split is described in the monitoring methodology" },
];

/* ── Global warming potentials ────────────────────────────────
   B76:B78. These convert the non-CO₂ gases to CO₂-equivalent and they are
   FIXED BY THE TEMPLATE — using a different assessment report's figures gives
   a different filed number for the same plant, so they are pinned here rather
   than taken from whichever GWP table a developer reaches for. */
export const GWP = {
  /** nitrous oxide — nitric acid and mixed fertilisers */
  N2O: 265,
  /** tetrafluoromethane — aluminium anode effects */
  CF4: 6630,
  /** hexafluoroethane — aluminium anode effects */
  C2F6: 11100,
  source: "CBAM Communication template v2.1.1, Parameters_Constants!B76:B78 (IPCC AR5 100-year GWP)",
} as const;

/** B13 — the template's own natural-gas emission factor, tCO₂/TJ. Present so
    a report can say which figure was used when no site-specific one was. */
export const TEMPLATE_NATURAL_GAS_EF = {
  value: 56.1,
  unit: "tCO₂/TJ",
  source: "CBAM Communication template v2.1.1, Parameters_Constants!B13 (CONST_EFNatGas)",
} as const;

/** The units the template writes into its own output rows, so a Certrace
    report prints the same strings a verifier is reading in the workbook. */
export const TEMPLATE_UNITS = {
  emissionsPerTonne: "tCO2e/t",
  emissions: "tCO2e",
  co2: "tCO2",
  energy: "TJ",
  energyPerTonne: "GJ/t",
  electricity: "MWh",
  mass: "t",
  gasVolume: "1000Nm3",
  efPerEnergy: "tCO2/TJ",
  efPerMass: "tCO2/t",
} as const;

/* ── The communication row ────────────────────────────────────
   Summary_Products!D8:T8 and Summary_Communication!D25:N25 — the columns the
   operator actually hands the reporting declarant. This is the definition of
   "the same information as the Excel file": if the Certrace report carries
   every one of these for every product, the two documents are exchangeable.

   The example row is the workbook's own (Summary_Products row 9), kept because
   it is the only place the template shows the intended FORMAT of each value —
   a CN code with no spaces, a share as a decimal rather than a percentage,
   an electricity source as a bare clause reference. */
export type CommunicationColumn = {
  /** workbook column letter on Summary_Products */
  column: string;
  key: string;
  /** the workbook's own header text */
  label: string;
  /** Summary_Products!row 9 */
  example: string;
  /** what a declarant does with it — for the "?" on the report */
  purpose: string;
};

export const COMMUNICATION_COLUMNS: CommunicationColumn[] = [
  {
    column: "D",
    key: "process",
    label: "Production process from which the products arise",
    example: "Example process A",
    purpose: "Ties the row back to one production process, so a verifier can find the emissions that produced this figure.",
  },
  {
    column: "E",
    key: "aggregatedGood",
    label: "Type of aggregated good or precursor",
    example: "Iron or steel products",
    purpose: "One of the 18 CBAM categories. It decides which default values and which sector parameters apply.",
  },
  {
    column: "F",
    key: "cnCode",
    label: "CN Codes",
    example: "72071919",
    purpose: "The 8-digit code on the customs declaration. This is what the importer matches the consignment against.",
  },
  {
    column: "G",
    key: "cnName",
    label: "CN Name",
    example: "Semi-finished products of iron or non-alloy steel, containing by weight < 0,25% of carbon",
    purpose: "The official description of that CN code — printed so a mismatch between code and goods is visible.",
  },
  {
    column: "H",
    key: "productName",
    label: "Product name (used for communication with reporting declarant, e.g. on invoices)",
    example: "Example name A",
    purpose: "Your own commercial name for the product, so the importer can match this row to an invoice line.",
  },
  {
    column: "I",
    key: "seeDirect",
    label: "SEE (direct)",
    example: "0.915",
    purpose: "Specific embedded DIRECT emissions per tonne, including everything carried in from precursors.",
  },
  {
    column: "J",
    key: "seeIndirect",
    label: "SEE (indirect)",
    example: "0.396",
    purpose: "Specific embedded INDIRECT (electricity) emissions per tonne, including precursors.",
  },
  {
    column: "K",
    key: "seeTotal",
    label: "SEE (total)",
    example: "1.311",
    purpose: "Direct plus indirect. This is the number the importer uses to calculate the certificates due.",
  },
  { column: "L", key: "unit", label: "Unit", example: "tCO2e/t", purpose: "Always tCO2e per tonne, except electricity which is per MWh." },
  {
    column: "M",
    key: "defaultShare",
    label: "Share of emissions by default value",
    example: "0.0",
    purpose: "How much of the figure rests on default values rather than measurement, as a decimal. 0 means fully actual data.",
  },
  {
    column: "N",
    key: "electricityEfSource",
    label: "Source for electricity EF",
    example: "D.4.1",
    purpose: "Which rule in Annex II the electricity emission factor came from.",
  },
  {
    column: "O",
    key: "embeddedElectricity",
    label: "Embedded electricity (MWh/t)",
    example: "0.281",
    purpose: "Electricity per tonne including the chain — needed where the importer must recompute indirect emissions on EU factors.",
  },
];

/** Columns P onward on Summary_Products are the sector parameters, and WHICH
    ones appear depends on the aggregated good — Parameters_Constants!B110:I127.
    A report renders exactly `good.specialParameters`, in that order. */
export const specialParametersFor = (goodId: string): string[] => goodById(goodId)?.specialParameters ?? [];

/** Whether indirect emissions are reported at all for a good under the
    definitive regime. Steel and aluminium are excluded, which is why a steel
    report showing an indirect column of zeroes is right and one showing a
    figure needs explaining. */
export const indirectApplies = (goodId: string): boolean => goodById(goodId)?.indirectRelevantDefinitive ?? true;
