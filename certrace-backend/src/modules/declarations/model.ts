import { t } from "elysia";
import { jsonValue } from "../../lib/json";
export const declarationModel = t.Intersect([
  t.Record(t.String(), jsonValue),
  t.Object(
    { id: t.String({ minLength: 1, maxLength: 200 }) },
    { additionalProperties: true },
  ),
]);
export const declarationParams = t.Object({
  declaration_id: t.String({ minLength: 1, maxLength: 200 }),
});
