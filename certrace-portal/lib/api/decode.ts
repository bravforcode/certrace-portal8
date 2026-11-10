import { ApiError } from "./errors";
import type { JsonObject } from "@certrace/backend/src/lib/json";
export function decode<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
): T {
  if (!guard(value))
    throw new ApiError(
      "BAD_RESPONSE",
      "The server returned an invalid document.",
    );
  return value;
}
/** JSON serialization drops optional undefined fields before the typed document boundary. */
export function jsonDocument(value: object): JsonObject {
  return JSON.parse(JSON.stringify(value)) as JsonObject;
}
