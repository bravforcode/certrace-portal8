/* ════════════════════════════════════════════════════════════
   CARBON PRICE PAID IN THE COUNTRY OF ORIGIN (§2.6)

   Annual, not monthly — an excise structure or an ETS settlement is a
   year-level fact, and asking for it twelve times would invite twelve
   different answers.

   THE POSITION THIS FILE ENCODES, deliberately and reversibly:

   Thailand has had THB 200/tCO₂e embedded in the oil excise structure since
   2025. For a factory burning diesel or fuel oil, the honest answer to "what
   carbon price did you pay?" is therefore no longer zero. But it sits INSIDE
   an existing excise rather than standing up as a carbon tax, and whether the
   EU accepts it as a deductible carbon price under Art. 9 of Reg. (EU)
   2023/956 is not settled.

   So the portal does three things and refuses the fourth:

     1. Lets the exporter RECORD it, with its instrument type and its evidence.
     2. Shows it as a CLAIMED deduction, labelled as claimed everywhere.
     3. Carries it into the verifier pack so the question is asked out loud.
     4. NEVER auto-applies it to reduce a liability figure.

   The fourth is the one that matters. An exporter who budgets against a
   deduction the EU then refuses has under-provisioned for certificates by the
   full amount, and found out at settlement. Surfacing the uncertainty is
   worth more than resolving it in their favour.
   ════════════════════════════════════════════════════════════ */

export type CarbonPriceCurrency = "THB" | "EUR";

export const CARBON_PRICE_CURRENCIES: CarbonPriceCurrency[] = ["THB", "EUR"];

export type CarbonPriceInstrument = "ets" | "tax" | "levy" | "excise_embedded" | "none";

export const CARBON_PRICE_INSTRUMENTS: CarbonPriceInstrument[] = ["ets", "tax", "levy", "excise_embedded", "none"];

export const CARBON_PRICE_INSTRUMENT_LABEL: Record<CarbonPriceInstrument, string> = {
  ets: "Emissions trading scheme",
  tax: "Carbon tax",
  levy: "Levy",
  excise_embedded: "Embedded in fuel excise",
  none: "None paid",
};

export const CARBON_PRICE_INSTRUMENT_HINT: Record<CarbonPriceInstrument, string> = {
  ets: "Allowances surrendered under a trading scheme. Evidence is the settlement or surrender statement.",
  tax: "A standalone carbon tax, charged per tonne of CO₂e. Evidence is the tax receipt.",
  levy: "A levy charged on emissions or on fuel with an emissions basis.",
  excise_embedded:
    "A carbon component inside an existing excise — Thailand's THB 200/tCO₂e in the oil excise structure is this. Whether the EU accepts it under Art. 9 is unsettled, so it is recorded as claimed and never auto-applied.",
  none: "No carbon price paid in the country of origin. A valid and common answer — record it rather than leaving the field empty.",
};

/** Thailand's embedded carbon component. Named and dated, because a number
    without a citation is an assumption a verifier will ask about. */
export const THAILAND_EXCISE_CARBON_PRICE = {
  value: 200,
  currency: "THB" as CarbonPriceCurrency,
  source: "Thailand oil excise structure, carbon component of THB 200/tCO₂e, in force since 2025",
};

export type CarbonPriceRecord = {
  workspaceId: string;
  /** per tCO₂e, in `currency`. 0 is a valid, complete answer. */
  amountPerTonne: number;
  currency: CarbonPriceCurrency;
  instrument: CarbonPriceInstrument;
  /** rebates, free allocation or any offset received against the above */
  rebates?: string;
  /** What fraction of this good's total specific embedded emissions this
      instrument actually applies to — 0 to 100. Most domestic instruments
      cover only part of a good's emissions, so this must not default to
      100: an unset value is a missing answer, not a full-coverage claim. */
  shareOfEmissionsCovered?: number;
  /** EvidenceItem id — required when amountPerTonne > 0 */
  evidenceItemId?: string;
  /** true once the exporter has answered at all; distinguishes "recorded as
      zero" from "never opened the screen", which are different states and
      only one of them is complete */
  recorded: boolean;
  updatedAt: string;
};

const KEY = "certrace:carbon-price";

type Store = Record<string, CarbonPriceRecord>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function write(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore quota */
  }
}

export const emptyCarbonPrice = (workspaceId: string): CarbonPriceRecord => ({
  workspaceId,
  amountPerTonne: 0,
  currency: "THB",
  instrument: "none",
  recorded: false,
  updatedAt: new Date().toISOString(),
});

export const getCarbonPrice = (workspaceId: string): CarbonPriceRecord =>
  read()[workspaceId] ?? emptyCarbonPrice(workspaceId);

export function saveCarbonPrice(record: CarbonPriceRecord): CarbonPriceRecord {
  const store = read();
  const next: CarbonPriceRecord = { ...record, recorded: true, updatedAt: new Date().toISOString() };
  store[record.workspaceId] = next;
  write(store);
  return next;
}

export function removeCarbonPrice(workspaceId: string): void {
  const store = read();
  delete store[workspaceId];
  write(store);
}

/* ── Readiness (§4) ─────────────────────────────────────────────
   Complete once instrument + amount are recorded — 0 IS a valid answer, and
   treating it as "not filled in" would push every honest exporter who paid
   nothing into a permanent amber. Blocked when an amount above zero has no
   payment evidence, because an unevidenced deduction claim is worse than no
   claim: it is the one line a verifier is guaranteed to pull. */
export type CarbonPriceState = { complete: boolean; blocked: boolean; reason: string | null };

/** `hasPaymentEvidence` is passed in rather than read from `record.evidenceItemId`
    alone, because the receipt is attached on the Evidence tab against the
    `carbon-price` field key — the two must resolve to the same answer or an
    exporter attaches the receipt, watches nothing change, and concludes the
    readiness gate is broken. The record's own pointer still counts, for a
    receipt linked directly. */
export function carbonPriceState(record: CarbonPriceRecord, hasPaymentEvidence = false): CarbonPriceState {
  if (!record.recorded) {
    return {
      complete: false,
      blocked: false,
      reason: "Carbon price has not been recorded. Zero is a valid answer — record it rather than leaving it blank.",
    };
  }
  if (record.amountPerTonne > 0 && !record.evidenceItemId && !hasPaymentEvidence) {
    return {
      complete: false,
      blocked: true,
      reason: `${record.amountPerTonne} ${record.currency}/tCO₂e is claimed with no payment evidence attached. Attach the excise or tax receipt — an unevidenced deduction is the first line a verifier pulls.`,
    };
  }
  if (record.amountPerTonne > 0 && record.shareOfEmissionsCovered == null) {
    return {
      complete: false,
      blocked: false,
      reason:
        "Carbon price instrument is recorded, but the share of emissions it covers has not been entered. Zero is not a safe default here — " +
        "the real coverage share must be recorded before this can be submitted.",
    };
  }
  return { complete: true, blocked: false, reason: null };
}

/** What the claimed deduction is worth across a year's emissions — shown as
    context, never subtracted from anything. `claimed` is in the record's own
    currency, because converting it would imply a settled treatment. */
export function claimedDeduction(record: CarbonPriceRecord, chargeableTCO2e: number): { claimed: number; currency: CarbonPriceCurrency } {
  return { claimed: record.amountPerTonne * chargeableTCO2e, currency: record.currency };
}

export const CARBON_PRICE_CLAIMED_NOTE =
  "Recorded as a CLAIMED deduction. Certrace does not subtract it from any liability figure: Thailand's THB 200/tCO₂e sits inside the " +
  "oil excise structure rather than as a standalone carbon tax, and whether the EU accepts it under Art. 9 of Reg. (EU) 2023/956 is not " +
  "settled. Budget as though it will not be accepted, and present it to your verifier with its instrument type and receipt.";
