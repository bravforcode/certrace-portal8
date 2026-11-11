import type { Declaration } from "../data";

/* A declaration's timestamps arrive as epoch milliseconds from the backend
   (saveDeclaration stores Date.now()), but a stored period is an ISO string.
   Both shapes are read here, so no caller has to know which it holds. */
export type Stamp = number | string | undefined;

/** The calendar year a stamp falls in, or null when there is no usable value. */
export function yearOf(value: Stamp): number | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "string" && /^\d{4}-/.test(value)) return Number(value.slice(0, 4));
  const at = new Date(typeof value === "number" ? value : Date.parse(value));
  return Number.isNaN(at.getTime()) ? null : at.getFullYear();
}

/** The year a declaration belongs to: its period, else when it was created, else last changed. */
export function declarationYear(
  d: Pick<Declaration, "periodStart" | "createdAt" | "updatedAt">,
): number | null {
  return yearOf(d.periodStart) ?? yearOf(d.createdAt) ?? yearOf(d.updatedAt);
}

/** The moment a declaration was generated, as a Date, or null when unknown. */
export function generatedDate(
  d: Pick<Declaration, "createdAt" | "updatedAt">,
): Date | null {
  const stamp = d.createdAt ?? d.updatedAt;
  if (stamp === undefined || stamp === "") return null;
  const at = new Date(typeof stamp === "number" ? stamp : Date.parse(stamp));
  return Number.isNaN(at.getTime()) ? null : at;
}
