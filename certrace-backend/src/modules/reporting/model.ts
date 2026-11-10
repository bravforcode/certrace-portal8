import { t } from "elysia";
import type { ReportStoreKey, ReportStoreValues } from "./catalogue";
import { jsonValue } from "../../lib/json";
import type { ProfileValues } from "../master-data/profile-contract";
export type ReportWrite =
  | { key: "certrace:profile"; value: ProfileValues | null; revision: number }
  | {
      [K in ReportStoreKey]: {
        key: K extends "certrace:report-snapshots:*"
          ? `certrace:report-snapshots:${string}`
          : K;
        value: ReportStoreValues[K] | null;
        revision: number;
      };
    }[ReportStoreKey];
// The service validates the concrete catalogue including nested types and account-scoped references.
export const ReportingModel = {
  write: t.Unsafe<ReportWrite>(
    t.Object({
      key: t.String({ maxLength: 250 }),
      value: jsonValue,
      revision: t.Integer({ minimum: 0 }),
    }),
  ),
  params: t.Object({ key: t.String({ minLength: 1, maxLength: 250 }) }),
};

export const reportBatch = t.Object({
  records: t.Array(ReportingModel.write, { minItems: 1, maxItems: 100 }),
});
