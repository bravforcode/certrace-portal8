import Decimal from "decimal.js";
import { z } from "zod";

import type { DecimalString } from "./types";

export const ExactDecimal = Decimal.clone({
  precision: 80,
  rounding: Decimal.ROUND_HALF_EVEN,
  toExpNeg: -80,
  toExpPos: 80,
});

const PLAIN_DECIMAL = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;

export const decimalStringSchema = z.string().max(200, "Decimal is too long").superRefine((value, context) => {
  if (!PLAIN_DECIMAL.test(value)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Expected a plain base-10 decimal string without exponent or separators",
    });
    return;
  }

  try {
    const parsed = new ExactDecimal(value);
    if (!parsed.isFinite()) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Decimal must be finite" });
    }
  } catch {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid decimal" });
  }
});

export class MrvValidationError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "MrvValidationError";
    this.code = code;
  }
}

export function decimal(value: DecimalString): Decimal {
  const parsed = decimalStringSchema.safeParse(value);
  if (!parsed.success) {
    throw new MrvValidationError("INVALID_DECIMAL", parsed.error.issues[0]?.message ?? "Invalid decimal");
  }
  return new ExactDecimal(value);
}

export function decimalToString(value: Decimal): DecimalString {
  if (!value.isFinite()) {
    throw new MrvValidationError("NON_FINITE_RESULT", "MRV calculations cannot produce a non-finite result");
  }

  const fixed = value.toFixed();
  if (fixed === "-0") return "0";
  return fixed.includes(".") ? fixed.replace(/\.?0+$/, "") : fixed;
}

export function decimalPlaces(value: DecimalString): number {
  const separator = value.indexOf(".");
  return separator === -1 ? 0 : value.length - separator - 1;
}

export function requireNonNegative(value: Decimal, name: string): void {
  if (value.isNegative()) {
    throw new MrvValidationError("NEGATIVE_VALUE", `${name} must be zero or greater`);
  }
}

export function requirePositive(value: Decimal, name: string): void {
  if (!value.greaterThan(0)) {
    throw new MrvValidationError("NON_POSITIVE_VALUE", `${name} must be greater than zero`);
  }
}

export function requireFraction(value: Decimal, name: string): void {
  if (value.isNegative() || value.greaterThan(1)) {
    throw new MrvValidationError("INVALID_FRACTION", `${name} must be between 0 and 1 inclusive`);
  }
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function assertIsoDate(value: string, field: string): void {
  if (!isIsoDate(value)) {
    throw new MrvValidationError("INVALID_DATE", `${field} must be a valid ISO date (YYYY-MM-DD)`);
  }
}
