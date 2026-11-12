/* ════════════════════════════════════════════════════════════
   REFERENCE BANDS & UNRESOLVED FIGURES

   Two kinds of number live here, and the difference is the point of the file.

   PLAUSIBILITY BANDS are not values — they are the ranges a real figure has
   to fall inside. The validator uses them to catch the errors that look like
   data: a natural-gas emission factor of 0.0561 read as tCO₂ per m³ instead of
   per GJ is roughly 25× too high, sits far outside the band, and is otherwise
   completely invisible in a spreadsheet. Nothing here is ever written into a
   filing.

   UNRESOLVED FIGURES are values the build spec explicitly refused to guess
   (§9). They carry `resolved: false` and a note saying what still has to be
   confirmed against EUR-Lex or the Registry documentation, and every surface
   that shows one has to show the warning with it. They are structured this way
   so replacing them is an edit to a data file, not a refactor.

   Build rule (§0): every numeric constant names its origin. Anything sourced
   "ASSUMPTION" renders with a visible warning wherever it reaches a number.
   ════════════════════════════════════════════════════════════ */

import type { FuelKind } from "./activity";

export type Band = {
  low: number;
  high: number;
  unit: string;
  source: string;
};

/* ── Fuel emission factors, tCO₂ per GJ ─────────────────────────
   The bands are wide on purpose: they exist to catch unit errors and typos,
   not to second-guess a fuel analysis. Anything inside the band is accepted
   without comment. */
export const FUEL_EF_BAND: Record<FuelKind, Band> = {
  natural_gas: {
    low: 0.045,
    high: 0.07,
    unit: "tCO₂/GJ",
    source:
      "IPCC 2006 Vol.2 Table 1.4 / EU MRR 2018/2066 Annex VI — natural gas ≈ 0.0561 tCO₂/GJ",
  },
  diesel: {
    low: 0.06,
    high: 0.09,
    unit: "tCO₂/GJ",
    source: "IPCC 2006 Vol.2 Table 1.4 — gas/diesel oil ≈ 0.0741 tCO₂/GJ",
  },
  lpg: {
    low: 0.05,
    high: 0.08,
    unit: "tCO₂/GJ",
    source: "IPCC 2006 Vol.2 Table 1.4 — LPG ≈ 0.0631 tCO₂/GJ",
  },
  fuel_oil_heavy: {
    low: 0.065,
    high: 0.095,
    unit: "tCO₂/GJ",
    source: "IPCC 2006 Vol.2 Table 1.4 — residual fuel oil ≈ 0.0774 tCO₂/GJ",
  },
  coking_coal: {
    low: 0.08,
    high: 0.12,
    unit: "tCO₂/GJ",
    source: "IPCC 2006 Vol.2 Table 1.4 — coking coal ≈ 0.0946 tCO₂/GJ",
  },
  anthracite_bituminous: {
    low: 0.08,
    high: 0.13,
    unit: "tCO₂/GJ",
    source:
      "IPCC 2006 Vol.2 Table 1.4 — anthracite ≈ 0.0983, bituminous ≈ 0.0946 tCO₂/GJ",
  },
  coke: {
    low: 0.09,
    high: 0.13,
    unit: "tCO₂/GJ",
    source: "IPCC 2006 Vol.2 Table 1.4 — coke oven coke ≈ 0.107 tCO₂/GJ",
  },
  coke_oven_gas: {
    low: 0.03,
    high: 0.06,
    unit: "tCO₂/GJ",
    source: "IPCC 2006 Vol.2 Table 1.4 — coke oven gas ≈ 0.0444 tCO₂/GJ",
  },
  blast_furnace_gas: {
    low: 0.15,
    high: 0.3,
    unit: "tCO₂/GJ",
    source:
      "IPCC 2006 Vol.2 Table 1.4 — blast furnace gas ≈ 0.26 tCO₂/GJ; high per GJ because the gas is calorifically poor",
  },
  biomass: {
    low: 0.0,
    high: 0.13,
    unit: "tCO₂/GJ",
    source:
      "Reported and zero-rated only where the sustainability criteria are met — a non-zero factor here is the correct answer when they are not",
  },
  coal: {
    low: 0.08,
    high: 0.12,
    unit: "tCO₂/GJ",
    source:
      "RETIRED — bituminous coal ≈ 0.0946 tCO₂/GJ. Kept so previously submitted rows still validate.",
  },
  other: {
    low: 0.02,
    high: 0.15,
    unit: "tCO₂/GJ",
    source:
      "ASSUMPTION — outer envelope across common industrial fuels; narrow this once the fuel is identified",
  },
};

/* ── Electricity intensity, MWh per tonne of output ─────────────
   A scrap-fed EAF is a well-characterised process and its power draw is one
   of the most reliable sanity checks in the sector. Aluminium electrolysis is
   an order of magnitude higher, which is exactly why the two need separate
   bands — one shared band would accept both a typo and the truth. */
export const ELECTRICITY_INTENSITY_BAND = {
  eaf_steel: {
    low: 0.35,
    high: 0.7,
    unit: "MWh/t",
    source:
      "Industry range for scrap-fed EAF steelmaking (IEA Iron & Steel Technology Roadmap)",
  },
  aluminium_smelting: {
    low: 13,
    high: 16,
    unit: "MWh/t",
    source:
      "Industry range for Hall-Héroult primary aluminium (International Aluminium Institute)",
  },
} satisfies Record<string, Band>;

/* ── Mass balance / yield ───────────────────────────────────────
   1 / Σ(precursor t per t of output). Below 70% the bill of materials is
   consuming more input than any real process needs; above 100% it claims to
   create mass. Both are entry errors far more often than they are reality. */
export const MASS_BALANCE_BAND: Band = {
  low: 0.7,
  high: 1.0,
  unit: "yield",
  source:
    "ASSUMPTION — engineering plausibility envelope for metallurgical yield; agreed with the ESG team, not a regulatory figure",
};

/** Above this share of total emissions, the data-gap register stops being a
    footnote and becomes the finding — the dossier escalates rather than
    reporting a number nobody can stand behind. */
export const DATA_GAP_ESCALATION_SHARE = {
  value: 0.2,
  source:
    "ASSUMPTION — escalation threshold set for this product; the MRR requires gaps to be conservative but sets no single share",
};

/** Precursor trees deeper than this are a data-entry mistake, not a supply
    chain. The cap also guarantees the recursion terminates. */
export const MAX_PRECURSOR_DEPTH = {
  value: 10,
  source:
    "ASSUMPTION — depth cap; real iron & steel chains are 2–4 tiers (ore → pig iron → billet → rebar)",
};

/* ════════════════════════════════════════════════════════════
   UNRESOLVED — do not trust these numbers, do not hide them either
   ════════════════════════════════════════════════════════════ */

export type UnresolvedValue<T> = {
  value: T;
  resolved: false;
  /** what the exporter and the verifier both need to be told */
  warning: string;
  /** what has to happen before this can be trusted */
  actionRequired: string;
};

/* The certificate price. Undecided by design: it is either the live EU ETS
   auction average (quarterly through 2026, weekly from 2027) or an
   admin-maintained figure, and that is an architecture decision nobody has
   made yet. So it is INJECTED everywhere it is used — lib/carbon-economics.ts
   already persists an exporter-set price, and this is the flag that says the
   number's provenance is still open. */
export const P_CERT_SOURCE: UnresolvedValue<
  "live_ets_api" | "admin_variable" | "user_set"
> = {
  value: "user_set",
  resolved: false,
  warning:
    "Certificate price source is not fixed. The figure on screen is the one you set — it is not a live EU ETS quote and must not be treated as the price you will actually pay.",
  actionRequired:
    "Decide between a live EU ETS auction-average feed and an admin-maintained variable, then bind the price to that single source.",
};

/** Definitive-period Registry XML/O3CI schema — not published at the time of
    writing. lib/cbam-xml.ts keeps the transitional structure behind one
    adapter rather than inventing elements that will not match. */
export const REGISTRY_SCHEMA_STATUS: UnresolvedValue<"transitional_structure"> =
  {
    value: "transitional_structure",
    resolved: false,
    warning:
      "The definitive-period Registry schema has not been published. This export follows the transitional structure and the Annex IV communication template field set.",
    actionRequired:
      "Swap the adapter in lib/cbam-xml.ts once the Commission publishes the definitive XSD.",
  };

/* THAILAND_GRID_FACTOR (0.4999 tCO₂/MWh, EGAT/TGO 2023) was removed here.

   It was not stale, it was the wrong figure: EGAT/TGO publish a Thai
   regulatory number for Thai purposes, while CBAM wants the Commission's
   country default, computed as a five-year moving average under Annex II
   Point D.2.3, Equation 37. lib/cbam/electricity-grid-factors.ts already
   said so and already held the replacement — but this constant survived it,
   and the declaration activity screen was still offering 0.4999 as the
   placeholder in the emission-factor box and printing it underneath as
   "Reference". A placeholder is what somebody types when they do not know
   the answer, so the screen was recommending the number the rest of the
   system had already ruled out.

   Grid factors live in electricity-grid-factors.ts and are read through
   `electricityFactorFor` in lib/monthly-data.ts. There is deliberately no
   constant here to reach for instead. */
