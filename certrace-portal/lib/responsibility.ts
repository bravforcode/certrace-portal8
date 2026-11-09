/* ════════════════════════════════════════════════════════════
   WHO FILLS THIS IN, AND WHEN

   The single most confusing thing about the verification workspace was that
   six tabs looked identical and were not. They differ on two axes that
   decide everything about how the exporter should behave:

     WHO   — the supplier writes most of it; the exporter writes some of it.
     WHEN  — some of it is due once a year, some every month.

   An exporter looking at six identical tabs cannot tell that Monthly data is
   twelve chases and the MMD is one. So they treat the whole workspace as one
   enormous form, open it in November, and discover eleven months of missing
   supplier data.

   Stating it in one table, and rendering it on every tab, turns the workspace
   from a form into a schedule. It is also what makes the reminder button
   meaningful: "chase this supplier" is only actionable if the screen knows
   whose turn it is.

   Nothing here computes a number. It is vocabulary — but it is the vocabulary
   the whole declaration hierarchy is built out of, which is why it is a module
   and not a constant inside a component.
   ════════════════════════════════════════════════════════════ */

import type { ReadinessTab } from "./readiness";

export type Owner = "supplier" | "exporter";

export const OWNER_LABEL: Record<Owner, string> = {
  supplier: "Supplier fills in",
  exporter: "You fill in",
};

export const OWNER_SHORT: Record<Owner, string> = {
  supplier: "Supplier",
  exporter: "You",
};

/** How often the thing comes due. `per_shipment` is deliberately not a period:
    it is the only cadence in CBAM driven by an event rather than a calendar,
    and collapsing it into "monthly" is what makes exporters batch shipments
    and lose the dates. */
export type Cadence = "annual" | "monthly" | "per_shipment" | "continuous";

export const CADENCE_LABEL: Record<Cadence, string> = {
  annual: "Once a year",
  monthly: "Every month",
  per_shipment: "Every shipment",
  continuous: "Ongoing",
};

export type Responsibility = {
  owner: Owner;
  cadence: Cadence;
  /** when it is actually due, in words */
  due: string;
  /** one sentence: what this tab is, from the point of view of the schedule */
  what: string;
  /** what the exporter's job is, when the supplier owns the tab */
  yourJob: string;
};

export const RESPONSIBILITY: Record<ReadinessTab | "overview" | "readiness" | "settings", Responsibility> = {
  overview: {
    owner: "exporter",
    cadence: "continuous",
    due: "Whenever it changes",
    what: "What this report covers.",
    yourJob: "Keep it correct.",
  },
  mmd: {
    owner: "supplier",
    cadence: "annual",
    due: "Once a year",
    what: "How the plant measures. Written once, changed only when the plant changes.",
    yourJob: "Ask early — finish it before the year closes.",
  },
  monthly: {
    owner: "supplier",
    cadence: "monthly",
    due: "Every month",
    what: "Production, fuel, electricity and the documents behind them.",
    yourJob: "Ask every month, not once.",
  },
  precursors: {
    owner: "supplier",
    cadence: "annual",
    due: "Once a year",
    what: "One final figure for each direct precursor.",
    yourJob: "Choose default or actual. For actual, copy the link and send it.",
  },
  evidence: {
    owner: "exporter",
    cadence: "annual",
    due: "Once a year",
    what: "Identity, calibration and carbon-price papers.",
    yourJob: "Attach each document next to its figure.",
  },
  readiness: {
    owner: "exporter",
    cadence: "continuous",
    due: "Before the verifier",
    what: "Whether this report would pass verification.",
    yourJob: "Read it before you book a verifier.",
  },
  settings: {
    owner: "exporter",
    cadence: "continuous",
    due: "Set once",
    what: "When the monthly request goes out.",
    yourJob: "Match the send day to their month-end.",
  },
  /* carbon_price and materiality are readiness RULES, not tabs with screens of
     their own — they surface inside Readiness. They are here because
     ReadinessTab enumerates them and a partial record would let a caller index
     into undefined at runtime, which is a worse outcome than two rows that
     point somewhere else. */
  carbon_price: {
    owner: "exporter",
    cadence: "annual",
    due: "Once a year, if you claim it",
    what: "Carbon price paid at home.",
    yourJob: "Keep the payment receipt.",
  },
  materiality: {
    owner: "exporter",
    cadence: "continuous",
    due: "Automatic",
    what: "Whether estimates stay under 5 % of the year's emissions.",
    yourJob: "Nothing to fill in.",
  },
};

/** Tabs the supplier owns — what a reminder is actually about. */
export const SUPPLIER_TABS: ReadinessTab[] = ["mmd", "monthly", "precursors"];

/** Tabs the exporter owns. */
export const EXPORTER_TABS: ReadinessTab[] = ["evidence"];

export const CADENCE_TONE: Record<Cadence, "info" | "warn" | "ok" | "muted"> = {
  annual: "muted",
  monthly: "warn",
  per_shipment: "info",
  continuous: "muted",
};
