import { accountStorage, flushAccount } from "../account-storage";
import { capOpportunities, type Derived, type Opportunity } from "./opportunities";

export const OPPORTUNITIES_KEY = "certrace:opportunities";

export function readOpportunities(): Opportunity[] {
  try {
    const v = JSON.parse(accountStorage.getItem(OPPORTUNITIES_KEY) ?? "[]");
    return Array.isArray(v) ? (v as Opportunity[]) : [];
  } catch {
    return [];
  }
}

export async function saveOpportunities(list: Opportunity[]) {
  accountStorage.setItem(OPPORTUNITIES_KEY, JSON.stringify(capOpportunities(list)));
  await flushAccount();
}

/** Assigns, moves or dates one card. Returns false when the card is gone. */
export async function updateOpportunity(id: string, patch: Partial<Pick<Opportunity, "assignee" | "status" | "due">>) {
  const list = readOpportunities();
  const i = list.findIndex((o) => o.id === id);
  if (i < 0) return false;
  list[i] = { ...list[i]!, ...patch, updatedAt: new Date().toISOString() };
  await saveOpportunities(list);
  return true;
}

/** Adds a card, or updates the card with the same key (keeping its id, assignee, status and due date).
    Used by the what-if panel's "Save as opportunity" action. */
export async function saveOpportunity(d: Derived) {
  const now = new Date().toISOString();
  const list = readOpportunities();
  const i = list.findIndex((o) => o.key === d.key);
  if (i >= 0) list[i] = { ...list[i]!, ...d, updatedAt: now };
  else list.push({ ...d, id: crypto.randomUUID(), assignee: "", status: "open", due: "", createdAt: now, updatedAt: now });
  await saveOpportunities(list);
}
