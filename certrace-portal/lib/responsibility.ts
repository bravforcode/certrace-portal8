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
  supplier: "Supplier fills this in",
  exporter: "You fill this in",
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
    due: "Whenever something changes",
    what: "What this report covers and where it stands.",
    yourJob: "Keep the identity correct. Everything downstream is scoped by it.",
  },
  mmd: {
    owner: "supplier",
    cadence: "annual",
    due: "Once, at the end of the reporting year",
    what: "How the installation measures what it measures. It describes a plant, not a month, so it is written once and amended only when the plant changes.",
    yourJob: "Ask for it once. Chase it in Q4, before the year closes — a methodology finalised after the fact is the first thing a verifier questions.",
  },
  monthly: {
    owner: "supplier",
    cadence: "monthly",
    due: "Within a few weeks of each month closing",
    what: "The readings: production, fuel, process emissions, electricity — plus the documents behind them.",
    yourJob: "Send monthly, not once — a March bill requested in December is usually impossible to find.",
  },
  precursors: {
    owner: "supplier",
    cadence: "monthly",
    due: "With each month's readings",
    what: "What went into the good, from whom, and how much of it — tier by tier up the chain.",
    yourJob: "The slowest data in the workspace — your supplier has to chase theirs. Start early; top tiers often arrive as ratios, not tonnages.",
  },
  evidence: {
    owner: "exporter",
    cadence: "annual",
    due: "Once a year",
    what: "The installation-level paperwork: identity, calibration records, and a carbon-price receipt where a deduction is claimed.",
    yourJob:
      "Only the annual scope lives here now. Monthly bills belong inside their month, and precursor certificates belong on the precursor row — both are attached where the figure they support is entered.",
  },
  readiness: {
    owner: "exporter",
    cadence: "continuous",
    due: "Before you engage a verifier",
    what: "Whether this report would survive verification, and what is missing if not.",
    yourJob: "Read it before you book the verifier, not after.",
  },
  settings: {
    owner: "exporter",
    cadence: "continuous",
    due: "Set it once, correct it when the plant changes",
    what: "When the monthly request goes out, who it chases, and how to stop it.",
    yourJob: "Match the send day to when whoever fills this in actually closes their books.",
  },
  /* carbon_price and materiality are readiness RULES, not tabs with screens of
     their own — they surface inside Readiness. They are here because
     ReadinessTab enumerates them and a partial record would let a caller index
     into undefined at runtime, which is a worse outcome than two rows that
     point somewhere else. */
  carbon_price: {
    owner: "exporter",
    cadence: "annual",
    due: "Once a year, only if you claim a deduction",
    what: "Carbon price paid in Thailand and claimed against the CBAM liability.",
    yourJob: "Claimed, never auto-applied. If you claim it, the payment receipt goes in the annual evidence scope.",
  },
  materiality: {
    owner: "exporter",
    cadence: "continuous",
    due: "Checked automatically",
    what: "Whether the estimated portion of the year's emissions stays under the 5% materiality threshold.",
    yourJob: "Derived from the MMD's data-gap register. Nothing to fill in — it moves when the gaps do.",
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
