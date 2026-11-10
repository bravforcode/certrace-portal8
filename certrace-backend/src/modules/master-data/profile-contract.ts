import type { Shape } from "../reporting/shape";

export type ProfileValues = Partial<{
  firstName: string;
  lastName: string;
  jobTitle: string;
  companyName: string;
  sector: string;
  installationId: string;
  jurisdiction: string;
  currency: string;
  unit: string;
  onboarded: boolean;
  goalAchieve: string[];
  currentManagement: string[];
  biggestChallenge: string[];
  cbamProductCount: string;
  supplierCount: string;
  installationCount: string;
  customerCount: string;
  hearAbout: string;
  phone: string;
  lineId: string;
  taxId: string;
  website: string;
  country: string;
  employeeBand: "1-49" | "50-199" | "200-999" | "1000+";
  exportMarkets: string[];
  productionModel: "own" | "oem" | "both";
  energySources: string[];
  boilerCount: string;
  furnaceCount: string;
  annualProductionBand: "<1k" | "1k-10k" | "10k-100k" | ">100k";
}>;

const str = (maxLength: number, pattern?: string): Shape => ({
  kind: "string",
  optional: true,
  maxLength,
  ...(pattern ? { pattern } : {}),
});

const fields: Record<string, Shape> = {
  firstName: str(120),
  lastName: str(120),
  jobTitle: str(120),
  companyName: str(200),
  sector: str(60),
  installationId: str(32),
  jurisdiction: str(8),
  currency: str(3, "^[A-Z]{3}$"),
  unit: str(16),
  cbamProductCount: str(20),
  supplierCount: str(20),
  installationCount: str(20),
  customerCount: str(20),
  hearAbout: str(200),
  phone: str(32, "^\\+?[0-9 ()-]{6,32}$"),
  lineId: str(40),
  taxId: str(13, "^\\d{13}$"),
  website: str(200, "^https://"),
  country: str(2, "^[A-Z]{2}$"),
  boilerCount: str(3, "^\\d{1,3}$"),
  furnaceCount: str(3, "^\\d{1,3}$"),
  employeeBand: {
    kind: "string",
    optional: true,
    enum: ["1-49", "50-199", "200-999", "1000+"],
  },
  productionModel: {
    kind: "string",
    optional: true,
    enum: ["own", "oem", "both"],
  },
  annualProductionBand: {
    kind: "string",
    optional: true,
    enum: ["<1k", "1k-10k", "10k-100k", ">100k"],
  },
};
fields.onboarded = { kind: "boolean", optional: true };
// Allowed values per list field; absent means any text up to 60 characters.
const listItemRules: Record<string, Partial<Shape>> = {
  exportMarkets: { pattern: "^(EU|[A-Z]{2})$" },
  energySources: {
    enum: [
      "electricity",
      "natural-gas",
      "oil",
      "lpg",
      "coal",
      "biomass",
      "steam-purchased",
    ],
  },
};
for (const key of [
  "goalAchieve",
  "currentManagement",
  "biggestChallenge",
  "exportMarkets",
  "energySources",
])
  fields[key] = {
    kind: "array",
    optional: true,
    table: "profile_" + key.toLowerCase(),
    item: {
      kind: "string",
      table: "profile_" + key.toLowerCase() + "_items",
      arrayElement: true,
      maxLength: 60,
      ...listItemRules[key],
    },
  };

export const profileSpec: Shape = {
  kind: "object",
  table: "account_profile",
  fields,
};
