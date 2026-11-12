import { accountStorage, flushAccount } from "../account-storage";
import {
  capOpportunities,
  isOpportunity,
  type Derived,
  type Opportunity,
} from "./opportunities";

export const OPPORTUNITIES_KEY = "certrace:opportunities";
export const SAVE_FAILED = "Your changes could not be saved.";
export const LIST_FULL =
  "The opportunity list is full. Close or remove cards first.";

/** Stored cards that fail the Opportunity shape are dropped, not shown. Unreadable storage reads as empty. */
export function readOpportunities(): Opportunity[] {
  try {
    const v: unknown = JSON.parse(
      accountStorage.getItem(OPPORTUNITIES_KEY) ?? "[]",
    );
    return Array.isArray(v) ? v.filter(isOpportunity) : [];
  } catch {
    return [];
  }
}

export async function saveOpportunities(list: Opportunity[]) {
  try {
    accountStorage.setItem(OPPORTUNITIES_KEY, JSON.stringify(list));
    await flushAccount();
  } catch {
    throw new Error(SAVE_FAILED);
  }
}

/** Assigns, moves or dates one card. Returns false when the card is gone. */
export async function updateOpportunity(
  id: string,
  patch: Partial<Pick<Opportunity, "assignee" | "status" | "due">>,
) {
  const list = readOpportunities();
  const i = list.findIndex((o) => o.id === id);
  if (i < 0) return false;
  list[i] = { ...list[i]!, ...patch, updatedAt: new Date().toISOString() };
  await saveOpportunities(list);
  return true;
}

/** Adds a card, or updates the card with the same key (keeping its id, assignee, status and due date).
    Used by the what-if panel's "Save as opportunity" action. Refuses a new card when the list is full
    and nothing closed can make room. */
export async function saveOpportunity(d: Derived) {
  const now = new Date().toISOString();
  const list = readOpportunities();
  const i = list.findIndex((o) => o.key === d.key);
  if (i >= 0) {
    list[i] = { ...list[i]!, ...d, updatedAt: now };
    await saveOpportunities(list);
    return;
  }
  const added: Opportunity = {
    ...d,
    id: crypto.randomUUID(),
    assignee: "",
    status: "open",
    due: "",
    createdAt: now,
    updatedAt: now,
  };
  const { list: capped, skipped } = capOpportunities(
    [...list, added],
    new Set(list.map((o) => o.id)),
  );
  if (skipped > 0) throw new Error(LIST_FULL);
  await saveOpportunities(capped);
}
