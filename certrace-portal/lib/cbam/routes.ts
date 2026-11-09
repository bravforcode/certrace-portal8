/* ════════════════════════════════════════════════════════════
   THE ROUTE OPTIONS OF ONE CN CODE

   "How is it produced" is not a free choice and it is not one list for the
   whole sector. The EU fixes, per CN code, which routes it recognises — and
   it does so in two places that have to agree:

     · the benchmark table (Implementing Regulation (EU) 2025/2620) and the
       default-value table (2025/2621) key the number on a ROUTE LETTER —
       C/D/E carbon steel (BF-BOF, DRI-EAF, scrap-EAF), F/G/H the same three
       for low-alloy steel, J high-alloy, K primary and L secondary aluminium,
       A grey and B white clinker. Every steel and aluminium CN code carries
       its own set of letters; a hot-rolled coil can be C, D or E, a stainless
       flat product only J.
     · the communication template (Commission, v2.1.1) lists the production
       routes of the five goods it treats as route-relevant — crude steel,
       pig iron, hydrogen, ammonia and unwrought aluminium — plus "Other" and
       "Unknown", and calls everything else "All production routes".

   So a CN code's options are: the route letters its benchmark row carries; or,
   where it has none, the technology routes of its aggregated goods category
   (Annex I of Implementing Regulation (EU) 2025/2547) — plus the template's
   Other and Unknown for the five route-relevant goods. Nothing is offered
   that the EU does not name for that code, and nothing the EU names is left
   out.

   An older workspace may hold a route that is no longer offered (rolling-only,
   extrusion). It still resolves and renders; it simply is not an option for a
   new one.
   ════════════════════════════════════════════════════════════ */

import { aggregatedGoodsCategory, type AggregatedGoodsCategory, type CatalogProduct } from "../config";
import { ADDITIONAL_ROUTES, PRODUCTION_ROUTES, getRoute, type ProductionRoute } from "../workspace";
import { benchmarkFor, rowForAnyCn, routeLettersOf, type BenchmarkPair } from "./eu-rates";

/** The legend printed under every default-value and benchmark table in the
    regulations, in words. */
export const ROUTE_LETTER_LABEL: Record<string, string> = {
  A: "Grey clinker / cement",
  B: "White clinker / cement",
  C: "Carbon steel — BF/BOF",
  D: "Carbon steel — DRI/EAF",
  E: "Carbon steel — scrap/EAF",
  F: "Low-alloy steel — BF/BOF",
  G: "Low-alloy steel — DRI/EAF",
  H: "Low-alloy steel — scrap/EAF",
  J: "High-alloy steel — EAF",
  K: "Primary aluminium",
  L: "Secondary aluminium",
};

/** Letter → route id, for a CN code in this aggregated category. Primary
    aluminium splits in two for unwrought metal, where the anode technology
    changes the PFC arithmetic; for a product made from the metal it is one
    answer. */
function routeIdsForLetter(letter: string, agg: AggregatedGoodsCategory): string[] {
  switch (letter) {
    case "A":
      return ["clinker_grey"];
    case "B":
      return ["clinker_white"];
    case "C":
      return ["bf_bof"];
    case "D":
      return ["dri_eaf"];
    case "E":
      return ["scrap_eaf"];
    case "F":
      return ["lowalloy_bf_bof"];
    case "G":
      return ["lowalloy_dri_eaf"];
    case "H":
      return ["lowalloy_scrap_eaf"];
    case "J":
      return ["highalloy_eaf"];
    case "K":
      return agg === "Unwrought aluminium" ? ["hall_heroult", "soderberg"] : ["al_primary"];
    case "L":
      return agg === "Unwrought aluminium" ? ["remelt"] : ["al_secondary"];
    default:
      return [];
  }
}

/** The routes of a good the EU does not split by letter: its technology. */
const TECHNOLOGY: Partial<Record<AggregatedGoodsCategory, string[]>> = {
  "Calcined clay": ["calcining"],
  "Cement clinker": ["clinker_grey", "clinker_white"],
  Cement: ["cement_all_routes"],
  "Aluminous cement": ["cement_all_routes"],
  Hydrogen: ["steam_reforming", "electrolysis_water", "chlor_alkali"],
  Ammonia: ["haber_bosch_smr", "haber_bosch_gasification"],
  "Nitric acid": ["nitric_acid_plant"],
  Urea: ["urea_synthesis"],
  "Mixed fertilisers": ["fertiliser_production"],
  "Sintered ore": ["sintering"],
  "Pig iron": ["blast_furnace", "smelting_reduction"],
  "Ferro-alloys": ["ferro_alloy_smelting"],
  "Direct reduced iron": ["direct_reduction"],
};

/** The five goods the communication template treats as route-relevant — the
    only ones for which it offers "Other" and "Unknown". */
const ROUTE_RELEVANT = new Set<AggregatedGoodsCategory>(["Crude steel", "Pig iron", "Hydrogen", "Ammonia", "Unwrought aluminium"]);

export type RouteOption = {
  id: string;
  label: string;
  /** the CBAM route letter, when the EU benchmark depends on one */
  letter?: string;
  /** what the letter means, in words */
  letterLabel?: string;
  /** the route as the communication template spells it */
  templateRoute: string;
  standardName: string;
  hint: string;
  precursors: string;
  dominantSource: string;
  /** the benchmarks for THIS route, in the reporting year — null where the EU gives none */
  benchmark?: BenchmarkPair;
  /** the route the EU built the country's default value on */
  isEuDefault?: boolean;
};

/* A route written for the crude-steel stage describes melting. The same route
   letter on a rolled or coated product means something different — the steel
   in it came from that route — so the sentence is rewritten rather than reused. */
const DOWNSTREAM_STEEL = new Set<AggregatedGoodsCategory>(["Iron or steel products"]);
const DOWNSTREAM_AL = new Set<AggregatedGoodsCategory>(["Aluminium products"]);

/* One whole sentence per route letter, not a sentence stitched from a fragment: Thai puts the pieces in another order, and a whole
   sentence is the unit a translation can hold. */
const STEEL_ORIGIN_HINT: Record<string, string> = {
  C: "The steel in this product comes from a blast furnace and a basic oxygen furnace. You roll, draw, coat or form it.",
  D: "The steel in this product comes from direct reduced iron melted in an electric arc furnace. You roll, draw, coat or form it.",
  E: "The steel in this product comes from scrap melted in an electric arc furnace. You roll, draw, coat or form it.",
  F: "The steel in this product comes from a blast furnace and a basic oxygen furnace, alloyed to low-alloy steel. You roll, draw, coat or form it.",
  G: "The steel in this product comes from direct reduced iron melted in an electric arc furnace, alloyed to low-alloy steel. You roll, draw, coat or form it.",
  H: "The steel in this product comes from scrap melted in an electric arc furnace, alloyed to low-alloy steel. You roll, draw, coat or form it.",
  J: "The steel in this product comes from an electric arc furnace making high-alloy steel. You roll, draw, coat or form it.",
};
const STEEL_ORIGIN_HINT_ANY = "The steel in this product comes from the route named. You roll, draw, coat or form it.";

function describe(route: ProductionRoute, agg: AggregatedGoodsCategory): Pick<RouteOption, "hint" | "precursors" | "dominantSource"> {
  if (DOWNSTREAM_STEEL.has(agg) && route.letter) {
    return {
      hint: STEEL_ORIGIN_HINT[route.letter] ?? STEEL_ORIGIN_HINT_ANY,
      precursors:
        route.letter === "E" || route.letter === "H"
          ? "The steel you buy or make as a direct precursor. For scrap-based steel it carries little embedded emission, but it is still a precursor you declare."
          : "The steel you buy or make as a direct precursor — nearly all of this product's embedded emissions arrive with it.",
      dominantSource: "Reheat-furnace and finishing fuel on site, which is small next to what the steel already carries.",
    };
  }
  if (DOWNSTREAM_AL.has(agg)) return { hint: route.hint, precursors: route.precursors, dominantSource: route.dominantSource };
  return { hint: route.hint, precursors: route.precursors, dominantSource: route.dominantSource };
}

function optionFrom(route: ProductionRoute, agg: AggregatedGoodsCategory, year: number, row: ReturnType<typeof rowForAnyCn>, euRoute: string): RouteOption {
  const d = describe(route, agg);
  return {
    id: route.id,
    label: route.label,
    letter: route.letter,
    letterLabel: route.letter ? ROUTE_LETTER_LABEL[route.letter] : undefined,
    templateRoute: route.templateRoute ?? "All production routes",
    standardName: route.standardName,
    ...d,
    benchmark: row ? benchmarkFor(row, route.letter, year) : undefined,
    isEuDefault: Boolean(route.letter && euRoute && route.letter === euRoute),
  };
}

/** Every route the EU recognises for this good — for a new workspace's
    picker, a workspace's Overview, and the reports. `euRoute` is the letter
    the country's default value was built on; the matching option is flagged. */
export function routeOptionsFor(product: Pick<CatalogProduct, "cnCode" | "category">, opts: { year?: number; euRoute?: string } = {}): RouteOption[] {
  const year = opts.year ?? 2026;
  const agg = aggregatedGoodsCategory(product);
  const row = rowForAnyCn(product.cnCode);
  const letters = row ? routeLettersOf(row) : [];
  const euRoute = opts.euRoute ?? "";

  const ids: string[] = [];
  const push = (id: string) => {
    if (!ids.includes(id)) ids.push(id);
  };

  if (letters.length > 0) {
    for (const l of letters) for (const id of routeIdsForLetter(l, agg)) push(id);
  } else if (TECHNOLOGY[agg]) {
    for (const id of TECHNOLOGY[agg] ?? []) push(id);
  } else if (agg === "Crude steel") {
    /* Stainless ingots and the like: the benchmark does not depend on a route
       letter, but the template still offers a crude-steel producer its routes. */
    for (const id of ["bf_bof", "dri_eaf", "scrap_eaf", "highalloy_eaf"]) push(id);
  } else if (agg === "Iron or steel products") {
    /* Stainless and alloy products: the regulations give one value for the
       good, whichever route made the steel. */
    push("steel_all_routes");
  }
  // Unwrought aluminium and the other route-relevant goods carry Other and
  // Unknown in the template whatever else is on the row.
  if (ROUTE_RELEVANT.has(agg)) {
    push("route_other");
    push("route_unknown");
  }

  // Downstream aluminium and steel with no letters would be a data fault — the
  // tables always give one — but never leave the picker empty.
  if (ids.length === 0) {
    const fallback = PRODUCTION_ROUTES.filter((r) => !r.legacy && r.aggregatedCategories.includes(agg)).map((r) => r.id);
    for (const id of fallback) push(id);
  }

  return ids
    .map((id) => getRoute(id))
    .filter((r): r is ProductionRoute => Boolean(r))
    .map((r) => optionFrom(r, agg, year, row, euRoute));
}

/** Is this stored route valid for this good? A route an older workspace holds
    that is no longer offered still counts as valid — it is not an error, it is
    history. */
export function routeIsValidFor(routeId: string, product: Pick<CatalogProduct, "cnCode" | "category">): boolean {
  const route = getRoute(routeId);
  if (!route) return false;
  if (route.legacy) return route.aggregatedCategories.includes(aggregatedGoodsCategory(product));
  return routeOptionsFor(product).some((o) => o.id === routeId);
}

/** The route letter of a stored route — what the benchmark is read for. */
export const letterOfRoute = (routeId: string): string | undefined => getRoute(routeId)?.letter;

/** Every route the registry knows, offered or not. */
export const ALL_ROUTES: ProductionRoute[] = [...PRODUCTION_ROUTES, ...ADDITIONAL_ROUTES];
