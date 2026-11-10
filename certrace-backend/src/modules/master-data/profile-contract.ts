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
}>;
const fields: Record<string, Shape> = {};
for (const key of [
  "firstName",
  "lastName",
  "jobTitle",
  "companyName",
  "sector",
  "installationId",
  "jurisdiction",
  "currency",
  "unit",
  "cbamProductCount",
  "supplierCount",
  "installationCount",
  "customerCount",
  "hearAbout",
  "phone",
  "lineId",
])
  fields[key] = { kind: "string", optional: true };
fields.onboarded = { kind: "boolean", optional: true };
for (const key of ["goalAchieve", "currentManagement", "biggestChallenge"])
  fields[key] = {
    kind: "array",
    optional: true,
    table: "profile_" + key.toLowerCase(),
    item: {
      kind: "string",
      table: "profile_" + key.toLowerCase() + "_items",
      arrayElement: true,
    },
  };
export const profileSpec: Shape = {
  kind: "object",
  table: "account_profile",
  fields,
};
