import { accountStorage } from "../account-storage";
/* Boundary persistence — one per declaration.

   Kept apart from lib/cbam/boundary.ts so the type and its helpers stay pure
   and unit-testable, matching the split everywhere else in this namespace. */

import { emptyBoundary, type Boundary, type ProcessStep } from "./boundary";

const KEY = "certrace:cbam-boundary";

function read(): Record<string, Boundary> {
  if (typeof window === "undefined") return {};
  try {
    const raw = accountStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Boundary>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function write(all: Record<string, Boundary>): void {
  if (typeof window === "undefined") return;
  try {
    accountStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore quota */
  }
}

export const loadBoundary = (declarationId: string): Boundary =>
  read()[declarationId] ?? emptyBoundary(declarationId);

export function saveBoundary(b: Boundary, updatedBy: string): Boundary {
  const all = read();
  const next = { ...b, updatedAt: Date.now(), updatedBy };
  all[b.declarationId] = next;
  write(all);
  return next;
}

/** Move one step between the included / excluded / undecided buckets. A step
    can never be in two at once — the whole value of the checklist is that
    each answer is exactly one of three. */
export function setStep(
  b: Boundary,
  step: ProcessStep,
  bucket: "included" | "excluded" | "undecided",
): Boundary {
  const included = b.included.filter((s) => s !== step);
  const excluded = b.excluded.filter((s) => s !== step);
  if (bucket === "included") included.push(step);
  if (bucket === "excluded") excluded.push(step);
  return { ...b, included, excluded };
}
