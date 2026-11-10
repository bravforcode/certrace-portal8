import { t } from "elysia";
import { jsonValue } from "../../lib/json";
export const RecordModel = {
  params: t.Object({ key: t.String({ minLength: 1, maxLength: 250 }) }),
  write: t.Object({ value: jsonValue, revision: t.Integer({ minimum: 0 }) }),
  import: t.Object({
    records: t.Array(
      t.Object({
        key: t.String({ minLength: 1, maxLength: 250 }),
        value: jsonValue,
      }),
      { maxItems: 500 },
    ),
  }),
};
