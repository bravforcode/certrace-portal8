/* ════════════════════════════════════════════════════════════
   WHAT A CN CODE LEADS TO — the emission rate and the price behind it

   Pick a CN code and the EU has already said three things about it, before a
   single meter is read:

     1. THE DEFAULT VALUE — how many tonnes of CO₂e the Commission will assume
        per tonne of that good if no verified figure is given. It is set per
        country (Implementing Regulation (EU) 2025/2621, Annex I), already
        carries the year's mark-up (+10 % for 2026, +20 % for 2027, +30 % from
        2028; +1 % for fertilisers), and names the production route it was
        built on.
     2. THE BENCHMARK — the free-allocation offset, per tonne, EU producers
        already get (Implementing Regulation (EU) 2025/2620). It is what the
        CBAM certificate bill is reduced by, and it depends on the production
        route.
     3. THE CERTIFICATE PRICE — what a tonne of CO₂e costs on the day, which
        the Commission publishes (Regulation 2023/956 Art. 21, as amended by
        2025/2083: the quarterly EU ETS auction average for 2026 imports).

   Together they give the line an exporter's buyer is actually thinking about:

       chargeable tCO₂e per tonne = default value − (CBAM factor × benchmark)
       indicative cost per tonne  = chargeable × certificate price

   THIS IS THE DEFAULT-VALUE EXPOSURE, and it is labelled that way everywhere
   it appears. It is what the buyer pays if no actual data is supplied — not a
   figure a filing is built from. It is also, deliberately, not the whole of
   the statutory formula: the cross-sectoral correction factor (CSCF) that
   multiplies the benchmark is published by the Commission and is not in the
   regulations this was built from, so it is treated as 1 and the result says
   so. See `RateSheet.notes`.

   A country Annex I does not list — or lists with "–" for a good — is priced
   from "Other countries and territories", as the Annex says.
   ════════════════════════════════════════════════════════════ */

import { CN_ROWS, type BenchmarkValue, type CnRow } from "./data/cn-catalogue";
import {
  DEFAULTS_OTHER,
  DEFAULTS_TH,
  type DefaultRow,
} from "./data/defaults-th";
import {
  UNKNOWN_ORIGIN_DEFAULTS,
  type UnknownOriginRow,
} from "./data/unknown-origin";
import { ALL_DEFAULTS } from "./data/defaults-all";

export type { DefaultRow };

const digits = (cn: string) => cn.replace(/\D/g, "");

/* ── The phase-in ───────────────────────────────────────────────
   CBAM factor = the share of an EU producer's free allocation still deducted
   from the certificate bill. 97.5 % in 2026, falling to 0 in 2034 — as the
   FTI deck (slide 18, citing ICAP) tabulates for Article 10a(1a) of the ETS
   Directive. The payable share is its complement: 2.5 % of embedded emissions
   in 2026, 100 % from 2034. */
export const CBAM_FACTOR_BY_YEAR: Record<number, number> = {
  2026: 0.975,
  2027: 0.95,
  2028: 0.9,
  2029: 0.775,
  2030: 0.515,
  2031: 0.39,
  2032: 0.265,
  2033: 0.14,
  2034: 0,
};

/** null before the definitive period; 0 from 2034. */
export const cbamFactor = (year: number): number | null => {
  if (year < 2026) return null;
  if (year >= 2034) return 0;
  return CBAM_FACTOR_BY_YEAR[year] ?? null;
};

/** The default-value mark-up: 10 % / 20 % / 30 % for 2026 / 2027 / 2028 and
    after, and 1 % in every year for fertilisers (2621, recital 6). */
export function defaultMarkup(sector: CnRow["sector"], year: number): number {
  if (sector === "Fertilisers") return 0.01;
  if (year <= 2026) return 0.1;
  if (year === 2027) return 0.2;
  return 0.3;
}

/* ── Where a country's rows come from ─────────────────────────────
   Every country Annex I lists is bundled (about 520 kB of JSON, ~100 kB over the
   wire). It was loaded on demand for a while, and the cost of that was a
   default value that was sometimes not there yet: a precursor from Vietnam
   saved a figure of zero because the table had not arrived. A number that can
   silently be absent is a worse trade than a heavier page, so it is imported
   once and every lookup is synchronous. */
type CountryTable = Record<string, DefaultRow>;
const allTables: Record<string, CountryTable> = ALL_DEFAULTS;

/** Kept so callers written for the lazy version still compile. Nothing to load. */
export const loadAllDefaults = (): Promise<void> => Promise.resolve();
export const defaultsLoaded = (): boolean => true;
export const onDefaultsLoaded = (fn: () => void): (() => void) => {
  fn();
  return () => {};
};

function tableFor(country: string): CountryTable | null {
  const code = country.toUpperCase();
  if (code === "TH") return DEFAULTS_TH;
  if (code === "ZZ") return DEFAULTS_OTHER;
  return allTables[code] ?? null;
}

/** Does Annex I name this country at all? Unlisted countries use the "Other"
    table for every good. */
export function countryIsListed(country: string): boolean {
  const code = country.toUpperCase();
  return code === "TH" || code === "ZZ" || Boolean(allTables[code]);
}

/* ── Finding the row ────────────────────────────────────────────
   Annex I states values at heading, 6-digit and 8-digit level, whichever the
   Commission found sufficient, so the lookup walks from the most specific
   prefix up. Cement clinker and "other hydraulic cements" carry a white and a
   grey row under one CN code; the route letter (B / A) picks between them. */
const KEY_LENGTHS = [8, 6, 4] as const;

function findIn(
  table: CountryTable,
  cn: string,
  variant: "A" | "B" | undefined,
): { key: string; row: DefaultRow } | null {
  const d = digits(cn);
  for (const len of KEY_LENGTHS) {
    const k = d.slice(0, len);
    if (len === 8 && (k === "25231000" || k === "25239000")) {
      const suffixed = table[`${k}${variant === "B" ? "W" : "G"}`];
      if (suffixed)
        return { key: `${k}${variant === "B" ? "W" : "G"}`, row: suffixed };
      continue;
    }
    if (table[k]) return { key: k, row: table[k] };
  }
  return null;
}

export type DefaultRates = {
  /** tCO₂e per tonne, before the mark-up */
  direct: number;
  indirect: number | null;
  total: number;
  /** with the mark-up — what the registry applies */
  y2026: number;
  y2027: number;
  y2028: number;
  /** the CBAM route letter the value was built on; "" when the benchmark does not depend on a route */
  route: string;
};

export type DefaultLookup = {
  rates: DefaultRates;
  /** the Annex I key that matched — a heading ("7208"), 6-digit or 8-digit code */
  key: string;
  /** the country whose row was used: the one asked for, or "ZZ" (Other) */
  usedCountry: string;
  /** true when the country's own row was missing and "Other countries and territories" stood in */
  usedOther: boolean;
};

const toRates = (r: DefaultRow): DefaultRates => ({
  direct: r[0],
  indirect: r[1],
  total: r[2],
  y2026: r[3],
  y2027: r[4],
  y2028: r[5],
  route: r[6],
});

/** The default value for one CN code and one country. A country Annex I does
    not list is read from "Other countries and territories"; null only when no
    row exists for the good at all. */
export function lookupDefault(
  cn: string,
  country: string,
  variant?: "A" | "B",
): DefaultLookup | null {
  /* A country Annex I does not list at all has no table of its own — and that is
     NOT "no default value": the Annex's own rule is that "where a country or
     territory is not explicitly listed, the default value for the respective good
     from the table 'Other countries and territories' needs to be selected". So an
     unlisted country falls straight through to that table. (It used to return
     null here, which left every country outside Annex I's 120 without a value.) */
  const own = tableFor(country);
  const hit = own ? findIn(own, cn, variant) : null;
  if (hit)
    return {
      rates: toRates(hit.row),
      key: hit.key,
      usedCountry: country.toUpperCase(),
      usedOther: false,
    };
  const other = findIn(DEFAULTS_OTHER, cn, variant);
  if (other)
    return {
      rates: toRates(other.row),
      key: other.key,
      usedCountry: "ZZ",
      usedOther: country.toUpperCase() !== "ZZ",
    };
  return null;
}

/** The value for the reporting year. Before 2026 there is no definitive
    period; from 2028 the 2028 column applies "and onwards". */
export const rateForYear = (r: DefaultRates, year: number): number =>
  year <= 2026 ? r.y2026 : year === 2027 ? r.y2027 : r.y2028;

/* ── Annex IV: the country of production cannot be identified ─── */
export type UnknownOriginDefault = {
  highest: number;
  y2026: number;
  y2027: number;
  y2028: number;
  route: string;
  key: string;
};

export function lookupUnknownOrigin(cn: string): UnknownOriginDefault | null {
  const d = digits(cn);
  for (const len of KEY_LENGTHS) {
    const row: UnknownOriginRow | undefined =
      UNKNOWN_ORIGIN_DEFAULTS[d.slice(0, len)];
    if (row)
      return {
        highest: row[0],
        y2026: row[1],
        y2027: row[2],
        y2028: row[3],
        route: row[4],
        key: d.slice(0, len),
      };
  }
  return null;
}

/* ── Benchmarks ─────────────────────────────────────────────────── */
export const cnRowOf = (cn: string): CnRow | undefined => {
  const d = digits(cn);
  return CN_ROWS.find((r) => digits(r.cn) === d);
};

/** First 8-digit row under the same heading — for an old catalogue code that is
    not itself an 8-digit CN code. */
const nearestRow = (cn: string): CnRow | undefined => {
  const d = digits(cn);
  for (const len of [6, 4]) {
    const hit = CN_ROWS.find((r) => digits(r.cn).startsWith(d.slice(0, len)));
    if (hit) return hit;
  }
  return undefined;
};

export const rowForAnyCn = (cn: string): CnRow | undefined =>
  cnRowOf(cn) ?? nearestRow(cn);

/** Does this benchmark entry apply in this production year? "1" = 2026-27,
    "2" = 2028-30, "" = every year. */
const periodApplies = (flag: string, year: number): boolean =>
  flag === "" ||
  (flag === "1" && year <= 2027) ||
  (flag === "2" && year >= 2028);

function pick(
  list: BenchmarkValue[],
  letter: string | undefined,
  year: number,
): number | null {
  const live = list.filter(([, , period]) => periodApplies(period, year));
  if (live.length === 0) return null;
  if (letter) {
    const hit = live.find(([, l]) => l === letter);
    if (hit) return hit[0];
  }
  // No route letter on the row at all: the value is route-independent.
  const unlabelled = live.find(([, l]) => l === "");
  if (unlabelled) return unlabelled[0];
  return null;
}

export type BenchmarkPair = {
  /** Column A — BM*, the process benchmark used with ACTUAL values */
  process: number | null;
  /** Column B — BM, the default benchmark used with DEFAULT values */
  default: number | null;
};

export function benchmarkFor(
  row: CnRow,
  letter: string | undefined,
  year: number,
): BenchmarkPair {
  return {
    process: pick(row.bmProcess, letter, year),
    default: pick(row.bmDefault, letter, year),
  };
}

/** Every route letter the benchmark table gives this CN code. */
export function routeLettersOf(row: CnRow): string[] {
  const seen: string[] = [];
  for (const [, l] of [...row.bmDefault, ...row.bmProcess])
    if (l && !seen.includes(l)) seen.push(l);
  return seen;
}

/* ── The rate sheet ─────────────────────────────────────────────── */
export type RateSheet = {
  cn: string;
  country: string;
  year: number;
  sector: CnRow["sector"];
  lookup: DefaultLookup;
  markup: number;
  /** tCO₂e/t, the registry's value for this year (mark-up included) */
  defaultValue: number;
  /** the same before the mark-up */
  baseValue: number;
  direct: number;
  indirect: number | null;
  /** the CBAM route letter the EU built this country's default on */
  euRoute: string;
  /** the route letter the benchmark below was read for (the exporter's own choice, else the EU's) */
  benchmarkRoute: string;
  benchmark: BenchmarkPair;
  cbamFactor: number | null;
  /** tCO₂e/t of free allocation deducted — CBAM factor × default benchmark */
  freeAllocation: number | null;
  /** the amount the certificate bill is raised on, per tonne */
  chargeable: number | null;
  pricePerTonne: number | null;
  /** indicative EUR per tonne of product — null without a price */
  costPerTonne: number | null;
  notes: string[];
};

export function rateSheet(args: {
  cn: string;
  country: string;
  year: number;
  /** the route letter chosen for this good, when the exporter has chosen one */
  routeLetter?: string;
  /** EUR per tCO₂e */
  price?: number | null;
}): RateSheet | null {
  const row = rowForAnyCn(args.cn);
  if (!row) return null;
  const variant =
    args.routeLetter === "B" ? "B" : args.routeLetter === "A" ? "A" : undefined;
  const lookup = lookupDefault(args.cn, args.country, variant);
  if (!lookup) return null;

  const year = Math.max(2026, args.year);
  const markup = defaultMarkup(row.sector, year);
  const euRoute = lookup.rates.route;
  const benchmarkRoute = args.routeLetter ?? euRoute;
  const benchmark = benchmarkFor(row, benchmarkRoute || undefined, year);
  const factor = cbamFactor(year);
  const freeAllocation =
    benchmark.default != null && factor != null
      ? factor * benchmark.default
      : null;
  const defaultValue = rateForYear(lookup.rates, year);
  const chargeable =
    freeAllocation != null ? Math.max(0, defaultValue - freeAllocation) : null;
  const price = args.price != null && args.price > 0 ? args.price : null;

  const notes: string[] = [];
  if (lookup.usedOther)
    notes.push(
      "Annex I has no row for this country and good, so “Other countries and territories” applies.",
    );
  notes.push(
    "The cross-sectoral correction factor (CSCF) that also multiplies the benchmark is published by the Commission and is not yet applied here.",
  );
  if (args.year < 2026)
    notes.push(
      "CBAM's definitive period starts in 2026, so the 2026 values are shown.",
    );

  return {
    cn: args.cn,
    country: args.country.toUpperCase(),
    year,
    sector: row.sector,
    lookup,
    markup,
    defaultValue,
    baseValue: lookup.rates.total,
    direct: lookup.rates.direct,
    indirect: lookup.rates.indirect,
    euRoute,
    benchmarkRoute,
    benchmark,
    cbamFactor: factor,
    freeAllocation,
    chargeable,
    pricePerTonne: price,
    costPerTonne:
      chargeable != null && price != null ? chargeable * price : null,
    notes,
  };
}

/** Largest tCO₂e/t gap between a default and an actual figure is worth
    stating in euros: this is the one line the pricing argument rests on. */
export const eurPerTonne = (tco2ePerTonne: number, price: number): number =>
  tco2ePerTonne * price;
