import { accountStorage } from "./account-storage";
/* ════════════════════════════════════════════════════════════
   BUYERS — the EU importers a shipment goes to

   A buyer used to be a string typed into the shipment form. That is fine for
   one row and wrong by the tenth: "Rotterdam Steel Import BV", "Rotterdam
   Steel Import B.V." and "Rotterdam Steel" are three buyers to the totals and
   one company to everybody else, and the buyer total is the number an exporter
   hands to that company. Three rows where there should be one is not a
   cosmetic problem — it is three understated statements of embedded emissions,
   each of which looks complete.

   THE EORI IS THE REASON THIS IS A RECORD. It is the key the buyer's declarant
   files under, it is 3–17 characters of country code and digits that nobody
   remembers, and it has to be identical on every shipment to that buyer or the
   declarant cannot reconcile what they received. Typed per row it will not be.
   Held on the buyer and copied onto the shipment, it is typed once.

   Frontend-only MVP: one localStorage key, the same seam as lib/shipments.ts.
   ════════════════════════════════════════════════════════════ */

import { eoriLooksValid } from "./shipments";

export type Buyer = {
  id: string;
  /** the importing company's name, as it appears on the invoice */
  name: string;
  /** EU EORI — the key their declarant files under. Optional but strongly
      wanted: without it the declarant reconciles by name, which is the problem
      this record exists to solve. */
  eori: string;
  /** ISO-3166 alpha-2 of the importing country */
  country: string;
  /** who to talk to about a consignment */
  contactName: string;
  contactEmail: string;
  createdAt: string;
};

const KEY = "certrace:buyers";

export const buyerUid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? `buy-${crypto.randomUUID().slice(0, 8)}`
    : `buy-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export const emptyBuyer = (): Buyer => ({
  id: buyerUid(),
  name: "",
  eori: "",
  country: "NL",
  contactName: "",
  contactEmail: "",
  createdAt: new Date().toISOString(),
});

export const hydrate = (raw: Partial<Buyer>): Buyer => ({
  ...emptyBuyer(),
  ...raw,
  id: raw.id ?? buyerUid(),
});

function read(): Buyer[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(
      accountStorage.getItem(KEY) ?? "[]",
    ) as Partial<Buyer>[];
    return Array.isArray(parsed) ? parsed.map(hydrate) : [];
  } catch {
    return [];
  }
}

function write(all: Buyer[]): Buyer[] {
  if (typeof window === "undefined") return all;
  try {
    accountStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore quota */
  }
  return all;
}

export const listBuyers = (): Buyer[] =>
  read().sort((a, b) => a.name.localeCompare(b.name));

export const getBuyer = (id: string): Buyer | null =>
  read().find((b) => b.id === id) ?? null;

export const findBuyerByName = (name: string): Buyer | null => {
  const key = name.trim().toLowerCase();
  return read().find((b) => b.name.trim().toLowerCase() === key) ?? null;
};

export function saveBuyer(input: Buyer): Buyer {
  const record: Buyer = {
    ...input,
    name: input.name.trim(),
    eori: input.eori.trim().toUpperCase(),
    id: input.id || buyerUid(),
  };
  write([...read().filter((b) => b.id !== record.id), record]);
  return record;
}

export function removeBuyer(id: string): Buyer[] {
  return write(read().filter((b) => b.id !== id));
}

/** null when valid; otherwise the one sentence that says what to fix. Empty is
    allowed — an exporter often logs a consignment before the importer has sent
    their EORI, and blocking the row would mean the shipment is not logged at
    all, which is worse than a row with a gap in it. */
export function buyerEoriError(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (!eoriLooksValid(value))
    return "Two-letter country code, then up to 15 letters or digits — “NL812345678”.";
  return null;
}

export const canSaveBuyer = (b: Buyer): boolean =>
  Boolean(b.name.trim()) && buyerEoriError(b.eori) === null;

