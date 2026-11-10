import { t } from "elysia";
import type { Prisma } from "../generated/prisma/client";
export type Json = Prisma.JsonValue;
export type JsonObject = { [key: string]: Json };
// The HTTP JSON parser restricts these values to JSON; domain documents are versioned opaque payloads.
export const jsonValue = t.Unsafe<Json>(t.Unknown());
export const jsonObject = t.Record(t.String(), jsonValue);
export const object = (value: unknown): JsonObject =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
export const array = (value: unknown): Json[] =>
  Array.isArray(value) ? (value as Json[]) : [];
export const string = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;
export const number = (value: unknown, fallback = 0) =>
  typeof value === "number" ? value : fallback;
export function canonical(value: Json): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(value[k] ?? null)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
