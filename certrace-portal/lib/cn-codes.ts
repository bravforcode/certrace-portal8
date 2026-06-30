// Mock database of CBAM CN Codes and Default Emission Values
// Based on EU Regulation OJ L 2025/2621

export type CnCodeRecord = {
  code: string;
  description: string;
  category: "Iron and Steel" | "Aluminium" | "Cement" | "Fertilizers" | "Electricity" | "Hydrogen";
  aggregatedCategory: string;
  defaultDirectEmissions: number; // tCO2e per ton
  defaultIndirectEmissions: number; // tCO2e per ton
};

export const CN_CODES_DB: CnCodeRecord[] = [
  // Iron & Steel
  {
    code: "72000000",
    description: "Iron and non-alloy steel in primary forms",
    category: "Iron and Steel",
    aggregatedCategory: "Pig Iron",
    defaultDirectEmissions: 1.85,
    defaultIndirectEmissions: 0.20,
  },
  {
    code: "73181520",
    description: "Screws and bolts, whether or not with their nuts or washers",
    category: "Iron and Steel",
    aggregatedCategory: "Iron or steel products",
    defaultDirectEmissions: 2.30,
    defaultIndirectEmissions: 0.45,
  },
  // Aluminium
  {
    code: "76011000",
    description: "Unwrought aluminium, not alloyed",
    category: "Aluminium",
    aggregatedCategory: "Unwrought Aluminium",
    defaultDirectEmissions: 1.50,
    defaultIndirectEmissions: 6.80, // High indirect due to electricity
  },
  {
    code: "76041010",
    description: "Aluminium bars, rods and profiles",
    category: "Aluminium",
    aggregatedCategory: "Aluminium products",
    defaultDirectEmissions: 1.65,
    defaultIndirectEmissions: 7.10,
  },
  // Cement
  {
    code: "25231000",
    description: "Cement clinkers",
    category: "Cement",
    aggregatedCategory: "Cement clinker",
    defaultDirectEmissions: 0.85,
    defaultIndirectEmissions: 0.05,
  },
  {
    code: "25232900",
    description: "Portland cement",
    category: "Cement",
    aggregatedCategory: "Cement",
    defaultDirectEmissions: 0.70,
    defaultIndirectEmissions: 0.08,
  },
  // Fertilizers
  {
    code: "31021010",
    description: "Urea, whether or not in aqueous solution",
    category: "Fertilizers",
    aggregatedCategory: "Urea",
    defaultDirectEmissions: 1.20,
    defaultIndirectEmissions: 0.15,
  }
];

// Helper to find a CN code
export function findCnCode(code: string): CnCodeRecord | undefined {
  // Simple strict match or starts-with for partial matching
  return CN_CODES_DB.find((c) => code.startsWith(c.code.substring(0, 4)));
}
