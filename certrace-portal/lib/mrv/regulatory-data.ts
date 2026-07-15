import { assertIsoDate, MrvValidationError } from "./decimal";
import { REGULATORY_DATA_VERSION } from "./measurements";
import type {
  AggregatedGoodsCategory,
  GreenhouseGas,
  ProductionRouteCode,
  RegulatoryProduct,
  RegulatorySourceReference,
  Sector,
} from "./types";

const EUR_LEX_BASE = "https://eur-lex.europa.eu/eli/reg";

export const REGULATORY_SOURCES = {
  cbam: {
    id: "EU-2023-956-CONSOLIDATED-2025-10-20",
    title: "Regulation (EU) 2023/956 establishing a carbon border adjustment mechanism, as amended",
    celex: "02023R0956-20251020",
    url: `${EUR_LEX_BASE}/2023/956/2025-10-20/eng`,
    provisions: ["Articles 2 and 7", "Annex I", "Annex II", "Annex IV"],
    effectiveFrom: "2026-01-01",
  },
  simplification: {
    id: "EU-2025-2083",
    title: "Regulation (EU) 2025/2083 amending Regulation (EU) 2023/956",
    celex: "32025R2083",
    url: `${EUR_LEX_BASE}/2025/2083/oj/eng`,
    provisions: ["Article 2(3a)", "Article 6", "Annex VII"],
    effectiveFrom: "2025-10-20",
  },
  certificatePrices: {
    id: "EU-COMMISSION-CBAM-CERTIFICATE-PRICES-2026",
    title: "European Commission — Price of CBAM certificates",
    celex: "N/A-OFFICIAL-COMMISSION-PUBLICATION",
    url: "https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/price-cbam-certificates_en",
    provisions: ["Official quarterly CBAM certificate price publication table"],
    effectiveFrom: "2026-01-01",
  },
  verification: {
    id: "EU-2025-2546",
    title: "Commission Implementing Regulation (EU) 2025/2546 on verification principles",
    celex: "32025R2546",
    url: `${EUR_LEX_BASE}_impl/2025/2546/oj/eng`,
    provisions: ["Verification principles pursuant to Article 8(3) of Regulation (EU) 2023/956"],
    effectiveFrom: "2026-01-01",
  },
  monitoring: {
    id: "EU-2025-2547",
    title: "Commission Implementing Regulation (EU) 2025/2547 on calculation of embedded emissions",
    celex: "32025R2547",
    url: `${EUR_LEX_BASE}_impl/2025/2547/oj/eng`,
    provisions: [
      "Annex I, Table 1",
      "Annex I, points 3.11 to 3.18",
      "Annex II, point B.7",
      "Annex III",
    ],
    effectiveFrom: "2026-01-01",
  },
  accreditation: {
    id: "EU-2025-2551",
    title: "Commission Delegated Regulation (EU) 2025/2551 on accreditation of verifiers",
    celex: "32025R2551",
    url: `${EUR_LEX_BASE}_del/2025/2551/oj/eng`,
    provisions: ["Article 18", "Sectoral accreditation scopes"],
    effectiveFrom: "2026-01-01",
  },
  freeAllocation: {
    id: "EU-2025-2620",
    title: "Commission Implementing Regulation (EU) 2025/2620 on the free-allocation adjustment",
    celex: "32025R2620",
    url: `${EUR_LEX_BASE}_impl/2025/2620/oj/eng`,
    provisions: ["Calculation of the adjustment reflecting EU ETS free allocation"],
    effectiveFrom: "2026-01-01",
  },
  defaults: {
    id: "EU-2025-2621",
    title: "Commission Implementing Regulation (EU) 2025/2621 on default values",
    celex: "32025R2621",
    url: `${EUR_LEX_BASE}_impl/2025/2621/oj/eng`,
    provisions: ["Default-value tables, including reporting-year columns with definitive-period mark-ups"],
    effectiveFrom: "2026-01-01",
  },
} as const satisfies Record<string, RegulatorySourceReference>;

type CnMatch =
  | { type: "EXACT"; value: string }
  | { type: "PREFIX"; value: string };

export interface CnClassificationRule {
  id: string;
  match: CnMatch;
  sector: Sector;
  category: AggregatedGoodsCategory;
  description: string;
  productionRoutes: readonly ProductionRouteCode[];
  qualifyingParameters: readonly string[];
  gases: readonly GreenhouseGas[];
  requiresProductionContext?: boolean;
}

const STEEL_PRODUCT_HEADINGS = [
  "7205",
  "7208",
  "7209",
  "7210",
  "7211",
  "7212",
  "7213",
  "7214",
  "7215",
  "7216",
  "7217",
  "7219",
  "7220",
  "7221",
  "7222",
  "7223",
  "7225",
  "7226",
  "7227",
  "7228",
  "7229",
  "7301",
  "7302",
  "7303",
  "7304",
  "7305",
  "7306",
  "7307",
  "7308",
  "7309",
  "7310",
  "7311",
  "7318",
  "7326",
] as const;

const ALUMINIUM_PRODUCT_HEADINGS = [
  "7603",
  "7604",
  "7605",
  "7606",
  "7607",
  "7608",
  "7610",
  "7612",
  "7614",
  "7616",
] as const;

function prefixRules(
  prefixes: readonly string[],
  common: Omit<CnClassificationRule, "id" | "match">,
): CnClassificationRule[] {
  return prefixes.map((prefix) => ({
    ...common,
    id: `${common.category.toLowerCase()}-${prefix}`,
    match: { type: "PREFIX", value: prefix },
  }));
}

/**
 * Complete steel/aluminium Annex-I mapping for the 2026 snapshot.
 *
 * This is intentionally expressed as auditable heading/subheading rules rather
 * than a hand-maintained list of every tariff leaf. A syntactically valid CN8
 * code is classified only when an explicit rule matches it. Chapter 72
 * exclusions (including 7204 scrap and the excluded ferro-alloys) therefore
 * cannot accidentally inherit a steel-product classification.
 */
export const CN_CLASSIFICATION_RULES_2026: readonly CnClassificationRule[] = [
  {
    id: "sintered-ore-26011200",
    match: { type: "EXACT", value: "26011200" },
    sector: "IRON_STEEL",
    category: "SINTERED_ORE",
    description: "Agglomerated iron ores and concentrates, other than roasted iron pyrites",
    productionRoutes: ["SINTERING", "PELLETISING"],
    qualifyingParameters: ["ore_grade", "sinter_or_pellet", "biomass_content"],
    gases: ["CO2"],
  },
  {
    id: "pig-iron-7201",
    match: { type: "PREFIX", value: "7201" },
    sector: "IRON_STEEL",
    category: "PIG_IRON",
    description: "Pig iron and spiegeleisen in pigs, blocks or other primary forms",
    productionRoutes: ["BLAST_FURNACE", "SMELTING_REDUCTION"],
    qualifyingParameters: ["manganese_content", "nickel_content", "hot_metal_transfer"],
    gases: ["CO2"],
  },
  {
    id: "ferromanganese-72021",
    match: { type: "PREFIX", value: "72021" },
    sector: "IRON_STEEL",
    category: "FERROMANGANESE",
    description: "Ferro-manganese",
    productionRoutes: ["SUBMERGED_ARC_FURNACE", "BLAST_FURNACE"],
    qualifyingParameters: ["manganese_content", "carbon_content"],
    gases: ["CO2"],
  },
  {
    id: "ferrochromium-72024",
    match: { type: "PREFIX", value: "72024" },
    sector: "IRON_STEEL",
    category: "FERROCHROMIUM",
    description: "Ferro-chromium",
    productionRoutes: ["SUBMERGED_ARC_FURNACE"],
    qualifyingParameters: ["chromium_content", "carbon_content"],
    gases: ["CO2"],
  },
  {
    id: "ferronickel-72026",
    match: { type: "PREFIX", value: "72026" },
    sector: "IRON_STEEL",
    category: "FERRONICKEL",
    description: "Ferro-nickel",
    productionRoutes: ["ROTARY_KILN_ELECTRIC_FURNACE", "BLAST_FURNACE"],
    qualifyingParameters: ["nickel_content", "npi_over_ten_percent_nickel"],
    gases: ["CO2"],
  },
  {
    id: "dri-7203",
    match: { type: "PREFIX", value: "7203" },
    sector: "IRON_STEEL",
    category: "DRI",
    description: "Direct reduced iron and other spongy ferrous products",
    productionRoutes: ["GAS_BASED_DRI", "COAL_BASED_DRI", "HYDROGEN_BASED_DRI"],
    qualifyingParameters: ["reducing_agent", "metallisation", "hydrogen_share"],
    gases: ["CO2"],
  },
  ...prefixRules(["7206", "7207", "7218", "7224"], {
    sector: "IRON_STEEL",
    category: "CRUDE_STEEL",
    description: "Crude or semi-finished steel",
    productionRoutes: ["BF_BOF", "SCRAP_EAF", "DRI_EAF"],
    qualifyingParameters: ["steel_grade", "alloy_content", "scrap_share", "dri_share"],
    gases: ["CO2"],
  }),
  ...prefixRules(STEEL_PRODUCT_HEADINGS, {
    sector: "IRON_STEEL",
    category: "IRON_STEEL_PRODUCTS",
    description: "Iron or steel downstream product",
    productionRoutes: ["IRON_STEEL_DOWNSTREAM"],
    qualifyingParameters: ["precursor_route", "precursor_cn_code", "alloy_content", "coating"],
    gases: ["CO2"],
  }).map((rule) =>
    rule.match.value === "7205"
      ? {
          ...rule,
          category: "PIG_IRON_OR_IRON_STEEL_PRODUCTS" as const,
          description: "Iron or steel granules/powders requiring production-context classification",
          productionRoutes: ["BLAST_FURNACE", "SMELTING_REDUCTION", "IRON_STEEL_DOWNSTREAM"] as const,
          qualifyingParameters: ["production_origin", "pig_iron_characteristics"] as const,
          requiresProductionContext: true,
        }
      : rule,
  ),
  {
    id: "unwrought-aluminium-7601",
    match: { type: "PREFIX", value: "7601" },
    sector: "ALUMINIUM",
    category: "UNWROUGHT_ALUMINIUM",
    description: "Unwrought aluminium",
    productionRoutes: ["PRIMARY_HALL_HEROULT", "SECONDARY_ALUMINIUM_REMELT"],
    qualifyingParameters: ["primary_secondary_status", "alloy_content", "prebake_or_soderberg"],
    gases: ["CO2", "CF4", "C2F6"],
  },
  ...prefixRules(ALUMINIUM_PRODUCT_HEADINGS, {
    sector: "ALUMINIUM",
    category: "ALUMINIUM_PRODUCTS",
    description: "Aluminium downstream product",
    productionRoutes: ["ALUMINIUM_DOWNSTREAM"],
    qualifyingParameters: ["precursor_route", "precursor_cn_code", "primary_secondary_share", "alloy_content"],
    gases: ["CO2", "CF4", "C2F6"],
  }),
  ...(["76090000", "76110000", "76130000"] as const).map((cnCode) => ({
    id: `aluminium-products-${cnCode}`,
    match: { type: "EXACT" as const, value: cnCode },
    sector: "ALUMINIUM" as const,
    category: "ALUMINIUM_PRODUCTS" as const,
    description: "Aluminium downstream product",
    productionRoutes: ["ALUMINIUM_DOWNSTREAM"] as const,
    qualifyingParameters: ["precursor_route", "precursor_cn_code", "primary_secondary_share", "alloy_content"] as const,
    gases: ["CO2", "CF4", "C2F6"] as const,
  })),
];

function normalizeCnCode(cnCode: string): string {
  const normalized = cnCode.replace(/\s/g, "");
  if (!/^\d{8}$/.test(normalized)) {
    throw new MrvValidationError("INVALID_CN_CODE", "CN code must contain exactly eight digits");
  }
  return normalized;
}

function dateIsWithinSnapshot(asOf: string): boolean {
  assertIsoDate(asOf, "Classification date");
  return asOf >= "2026-01-01" && asOf <= "2026-12-31";
}

function matches(code: string, match: CnMatch): boolean {
  return match.type === "EXACT" ? code === match.value : code.startsWith(match.value);
}

export function classifyCnCode(
  cnCode: string,
  asOf: string = "2026-01-01",
): RegulatoryProduct | undefined {
  const normalized = normalizeCnCode(cnCode);
  if (!dateIsWithinSnapshot(asOf)) return undefined;

  const rule = CN_CLASSIFICATION_RULES_2026.find((candidate) => matches(normalized, candidate.match));
  if (!rule) return undefined;

  return {
    classificationId: rule.id,
    cnCode: normalized,
    sector: rule.sector,
    aggregatedGoodsCategory: rule.category,
    description: rule.description,
    productionRoutes: rule.productionRoutes,
    qualifyingParameters: rule.qualifyingParameters,
    greenhouseGases: rule.gases,
    directEmissionsTreatment: "INCLUDED",
    indirectEmissionsTreatment: "EXCLUDED_FROM_EMBEDDED_EMISSIONS_ANNEX_II",
    requiresProductionContext: rule.requiresProductionContext ?? false,
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    regulatoryDataVersion: REGULATORY_DATA_VERSION,
    sourceReferences: [REGULATORY_SOURCES.cbam, REGULATORY_SOURCES.monitoring],
  };
}

export function isCbamSteelOrAluminiumCnCode(cnCode: string, asOf?: string): boolean {
  return classifyCnCode(cnCode, asOf) !== undefined;
}
