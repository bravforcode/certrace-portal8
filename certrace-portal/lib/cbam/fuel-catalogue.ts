/* ════════════════════════════════════════════════════════════
   THE REST OF POINT G — every fuel the standard names, offered in the picker

   Annex II Point G of Implementing Regulation (EU) 2025/2547 lists 40 fossil
   fuels in Table 1 and 11 biomass materials in Table 2. The picker used to offer
   ten of them, chosen when this was a steel-and-aluminium portal in Thailand.
   It is not that any more: the catalogue covers cement, fertilisers, hydrogen,
   aluminium and iron and steel, and a cement kiln burns petroleum coke, lignite,
   tyres and rice husk where a rolling mill burns natural gas. A fuel the picker
   does not offer is a fuel filed as "Other" with no EU standard value behind it,
   which is a worse answer than the standard's own.

   So the whole of Point G is here. A row is the portal's id, the Point G row it
   stands for, the family it is grouped under in the picker, and the unit it
   opens in. The figures themselves stay in lib/cbam/fuel-defaults.ts — this file
   names fuels, it does not hold a number.

   THE UNIT A FUEL OPENS IN is the one Point G can answer without an assumption.
   Point G quotes NCV per tonne, so a solid or liquid opens in tonnes and a gas
   opens in GJ (a gas bill states energy as readily as volume, and GJ needs no
   calorific value). A plant invoiced in litres or cubic metres switches the unit
   and enters the calorific value from its supplier — a density the portal has
   not been given is a density it will not invent.
   ════════════════════════════════════════════════════════════ */

import type { MonthlyFuelUnit } from "../monthly-data";

export type AdditionalFuel = {
  /** the portal's fuel-type id; stored on every row, so never renamed */
  id: string;
  /** the Point G row it stands for, exactly as Point G prints it */
  pointG: string;
  /** the name the picker shows, where Point G's own would read badly */
  label?: string;
  family: "Solid fossil" | "Liquid fossil" | "Gaseous fossil" | "Waste-derived" | "Biomass";
  unit: MonthlyFuelUnit;
  note?: string;
};

export const ADDITIONAL_FUELS: AdditionalFuel[] = [
  // ── Solid fossil ──
  { id: "anthracite", pointG: "Anthracite", family: "Solid fossil", unit: "t" },
  { id: "bituminous_coal", pointG: "Other bituminous coal", label: "Bituminous coal", family: "Solid fossil", unit: "t" },
  { id: "sub_bituminous_coal", pointG: "Sub-bituminous coal", family: "Solid fossil", unit: "t" },
  { id: "lignite", pointG: "Lignite", label: "Lignite / brown coal", family: "Solid fossil", unit: "t" },
  { id: "petroleum_coke", pointG: "Petroleum coke", family: "Solid fossil", unit: "t", note: "The usual kiln fuel in cement." },
  { id: "gas_coke", pointG: "Gas coke", family: "Solid fossil", unit: "t" },
  { id: "patent_fuel", pointG: "Patent fuel", family: "Solid fossil", unit: "t" },
  { id: "oil_shale_tar_sands", pointG: "Oil shale and tar sands", family: "Solid fossil", unit: "t" },
  { id: "peat", pointG: "Peat", family: "Solid fossil", unit: "t" },
  // ── Liquid fossil ──
  { id: "crude_oil", pointG: "Crude oil", family: "Liquid fossil", unit: "t" },
  { id: "orimulsion", pointG: "Orimulsion", family: "Liquid fossil", unit: "t" },
  { id: "ngl", pointG: "Natural gas liquids", family: "Liquid fossil", unit: "t" },
  { id: "motor_gasoline", pointG: "Motor gasoline", label: "Motor gasoline (petrol)", family: "Liquid fossil", unit: "t" },
  { id: "kerosene", pointG: "Kerosene (other than jet kerosene)", label: "Kerosene", family: "Liquid fossil", unit: "t" },
  { id: "shale_oil", pointG: "Shale oil", family: "Liquid fossil", unit: "t" },
  { id: "naphtha", pointG: "Naphtha", family: "Liquid fossil", unit: "t" },
  { id: "bitumen", pointG: "Bitumen", family: "Liquid fossil", unit: "t" },
  { id: "lubricants", pointG: "Lubricants", family: "Liquid fossil", unit: "t" },
  { id: "refinery_feedstocks", pointG: "Refinery feedstocks", family: "Liquid fossil", unit: "t" },
  { id: "paraffin_waxes", pointG: "Paraffin waxes", family: "Liquid fossil", unit: "t" },
  { id: "white_spirit", pointG: "White spirit and SBP", family: "Liquid fossil", unit: "t" },
  { id: "other_petroleum", pointG: "Other petroleum products", family: "Liquid fossil", unit: "t" },
  { id: "coal_tar", pointG: "Coal tar", family: "Liquid fossil", unit: "t" },
  // ── Gaseous fossil ──
  { id: "ethane", pointG: "Ethane", family: "Gaseous fossil", unit: "GJ" },
  { id: "refinery_gas", pointG: "Refinery gas", family: "Gaseous fossil", unit: "GJ" },
  { id: "gas_works_gas", pointG: "Gas works gas", family: "Gaseous fossil", unit: "GJ" },
  { id: "bof_gas", pointG: "Oxygen steel furnace gas", label: "Oxygen steel furnace gas", family: "Gaseous fossil", unit: "GJ", note: "Only where the site runs a basic oxygen furnace." },
  { id: "carbon_monoxide", pointG: "Carbon monoxide", family: "Gaseous fossil", unit: "GJ" },
  { id: "methane", pointG: "Methane", family: "Gaseous fossil", unit: "GJ" },
  // ── Waste-derived ──
  { id: "industrial_waste", pointG: "Industrial wastes", family: "Waste-derived", unit: "GJ", note: "Point G prints no calorific value — enter yours, or give the quantity in GJ." },
  { id: "waste_oil", pointG: "Waste oils", family: "Waste-derived", unit: "t" },
  { id: "waste_tyres", pointG: "Waste tyres", label: "Waste tyres / tyre-derived fuel", family: "Waste-derived", unit: "GJ", note: "Point G prints no calorific value. A preliminary factor — the biomass fraction applies to it." },
  // ── Biomass ──
  { id: "wood_waste", pointG: "Wood / Wood waste (air dry)", label: "Wood / wood waste (air dry)", family: "Biomass", unit: "t" },
  { id: "black_liquor", pointG: "Sulphite lyes (black liquor)", family: "Biomass", unit: "t" },
  { id: "charcoal", pointG: "Charcoal", family: "Biomass", unit: "t" },
  { id: "biogasoline", pointG: "Biogasoline", family: "Biomass", unit: "t" },
  { id: "biodiesel", pointG: "Biodiesels", label: "Biodiesel", family: "Biomass", unit: "t" },
  { id: "other_liquid_biofuel", pointG: "Other liquid biofuels", family: "Biomass", unit: "t" },
  { id: "landfill_gas", pointG: "Landfill gas", family: "Biomass", unit: "GJ" },
  { id: "sludge_gas", pointG: "Sludge gas", family: "Biomass", unit: "GJ" },
  { id: "other_biogas", pointG: "Other biogas", label: "Biogas", family: "Biomass", unit: "GJ" },
  { id: "municipal_waste_bio", pointG: "Municipal waste (biomass fraction)", label: "Municipal waste (biomass fraction)", family: "Biomass", unit: "t" },
];
