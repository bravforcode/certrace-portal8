/* ════════════════════════════════════════════════════════════
   MONTHLY ACTIVITY DATA — the core new thing

   Part 1 collected a year at a time. This collects a month at a time, and the
   year becomes a sum. Three reasons, all of them things a verifier does:

     1. A verifier SAMPLES MONTHS, not years. "Show me March" has to produce
        March's meter reading, March's utility bill and March's production log,
        all agreeing. A single annual figure cannot answer that question.

     2. Gaps become visible while they can still be fixed. A missing April bill
        found in May is a phone call. Found in February 2027 it is a
        non-conformity.

     3. P_annual = Σ(monthly production) can never silently disagree with the
        detail behind it, because there is no second place to type it.

   THE RULE THIS FILE ENFORCES. A missing month makes the annual figure
   INCOMPLETE, not smaller. Silently summing eleven months gives a smaller
   denominator, and a smaller denominator INFLATES SEE per tonne — which is
   exactly the error a verifier catches, and it would be an error the portal
   introduced. So `annualProductionFor` reports coverage alongside the total
   and callers must handle an incomplete year explicitly.

   UNITS. NCV is stored in MJ per unit here (§2.2 of the spec, and what a fuel
   spec sheet actually prints), while lib/cbam/units.ts canonicalises energy in
   GJ. The bridge is one division by 1000, applied in ONE place — `fuelGJ`
   below — which then hands off to the Part-1 `toGJ` so the refusal to guess a
   missing NCV stays in a single implementation.
   ════════════════════════════════════════════════════════════ */

import { euStandardFor, euStandardLockedHint, hasEuStandard, isWasteGas, matchesEuStandard } from "./cbam/fuel-defaults";
import { gridFactorFor } from "./cbam/electricity-grid-factors";
import { massBalanceProcessEmission, standardProcessEmission } from "./cbam/process-factors";
import { TEMPLATE_NATURAL_GAS_EF } from "./cbam/template-reference";
import { toGJ, UnitError, type FuelUnit } from "./cbam/units";
import { monthsOf, type VerificationWorkspace } from "./workspace";

export { euStandardFor, euStandardLockedHint, hasEuStandard, isWasteGas } from "./cbam/fuel-defaults";

/** The evidence key a Type II fuel row's supporting document is filed under —
    the same key `requiredKeysForMonth` in lib/workspace-evidence.ts already
    generates per fuel row, so a document attached in the month's Documents
    checklist is the same document this lock checks for. One key, not two. */
export const fuelEvidenceKey = (fuelId: string): string => `fuel:${fuelId}`;

/** The evidence key a biomass fuel row's sustainability documentation is
    filed under. Mirrors `fuelEvidenceKey` above — one key, generated the
    same way, checked by `requiredKeysForMonth` and by the fuel row's own
    biomass-fraction lock. Required only where the fuel is biomass-family
    (see `FuelFamily`), never for a fossil row. */
export const biomassEvidenceKey = (fuelId: string): string => `biomass:${fuelId}`;

/* ── Fuel ───────────────────────────────────────────────────────
   One row per fuel per month. The emission factor is tCO₂ per GJ, always —
   never per m³. Part 1's note is worth repeating because it is the failure
   that silently destroys a number: natural gas is ≈0.0561 tCO₂/GJ, and the
   same figure read as tCO₂/m³ overstates the result by roughly 25×. */
/* ── Where the factors came from (Annex II, Point B.5.2) ────────
   THE LIST IS A RANKING, NOT A MENU OF EQUALS, and it runs the opposite way to
   how it reads. Point B.5.2 admits a TYPE I standard value — the Point G table
   — only where no TYPE II value exists: a supplier's certified figure, a
   national inventory value, a laboratory result on the actual batch.

   So the EU default is the FALLBACK. Nothing here or on the screens above may
   describe it as recommended, preferred or the safe choice, because a
   verifier reading a row that says "EU standard value" next to a plant with a
   gas chromatograph on the incomer opens a finding about exactly that. */
export type FuelFactorSource = "eu_standard" | "lab_analysis" | "national_inventory" | "supplier_specific";

export const FUEL_FACTOR_SOURCES: FuelFactorSource[] = ["lab_analysis", "supplier_specific", "national_inventory", "eu_standard"];

export const FUEL_FACTOR_SOURCE_LABEL: Record<FuelFactorSource, string> = {
  eu_standard: "EU standard value (Type I)",
  lab_analysis: "Laboratory analysis (Type II)",
  national_inventory: "National inventory (Type II)",
  supplier_specific: "Supplier-specific (Type II)",
};

export const FUEL_FACTOR_SOURCE_HINT: Record<FuelFactorSource, string> = {
  eu_standard:
    "The Point G default for this fuel category. Admissible only where no Type II value exists — it is the fallback, not the preferred answer. The values fill in and lock.",
  lab_analysis: "Measured from your own samples. The strongest evidence, and it needs the certificate and the sampling frequency behind it.",
  national_inventory: "Thailand's national GHG inventory value (TGO), where it is the more representative figure. Say why it is.",
  supplier_specific: "A certified figure from the fuel supplier — the spec sheet or the delivery certificate. Attach it.",
};

/** Type I is the standard-value route; everything else is Type II and is
    entered by hand against a document. The one place the distinction is
    encoded, so a screen cannot decide it differently from the validator. */
export const isTypeIStandard = (s: FuelFactorSource): boolean => s === "eu_standard";

/** The NCV field's hint, by factor source. A Type I row STATES the source —
    it does not disclaim it, because filling the field with the standard
    value is exactly what picking Type I means. A Type II row keeps the
    disclaimer, because there the portal genuinely will not guess: the figure
    has to come from the document the reader is about to attach. */
export function ncvFieldHint(f: Pick<FuelEntry, "fuelType" | "unit" | "factorSource">, typicalNcv?: string): string {
  if (isTypeIStandard(f.factorSource)) {
    return euStandardLockedHint(f.fuelType, f.unit) ?? "No EU standard value is on file for this fuel — pick a Type II source and enter it from a document.";
  }
  return `From the fuel's spec sheet or supplier invoice. Required — Certrace will not substitute a standard value.${typicalNcv ? ` For reference, this fuel is ${typicalNcv}.` : ""}`;
}

/* The unit set is Part 1's, which adds litres to the four the spec enumerates.
   Diesel and fuel oil are invoiced in litres in Thailand, and §2.2 lists both
   as fuels this screen must accept — dropping the unit would have forced a
   conversion outside the portal, which is the invisible assumption every rule
   in lib/cbam/units.ts exists to prevent. */
export type MonthlyFuelUnit = FuelUnit;

export const MONTHLY_FUEL_UNITS: MonthlyFuelUnit[] = ["m3", "kg", "t", "l", "GJ"];

/* ── Fuel types ─────────────────────────────────────────────────
   Named to the IPCC 2006 Guidelines fuel categories the EU methodology draws
   its standard factors from, because "gas" on a Thai invoice can mean pipeline
   natural gas, LNG regas or LPG, and those are three different factors.

   The list is DEEP but it still ends in "Other". A closed list with no escape
   makes an operator burning rice husk pick "Biomass" and lose the fact that it
   was rice husk; an open text box makes twelve months of the same fuel arrive
   as "NG", "Nat gas" and "natural gas", which cannot be summed. Both, then:
   a standard code for the cases the standard names, and a described Other for
   the ones it does not.

   `typicalNcv` is a RANGE shown as a hint, never a value that fills the field.
   A spec sheet's NCV is a property of the batch, and substituting a typical
   one moves a number a verifier recomputes — the same reason `toGJ` refuses to
   guess. It is here so an operator can tell a plausible reading from a
   mistyped one, which is what catches a decimal in the wrong place.

   IT IS QUOTED IN MJ PER UNIT, matching `ncvMjPerUnit` and matching the field
   the operator types into. The solid fuels used to read "typically 27–30 GJ/t"
   beside a box labelled "MJ per t" — a factor of a thousand between the label
   and its own hint, which is the exact class of error the hint exists to
   catch. An operator reading 27–30 and typing 28 into an MJ/t field loses
   99.9% of that fuel's energy, the month passes validation, and the figure is
   only wrong. */
export type FuelTypeDef = {
  id: string;
  label: string;
  /** Thai name. The picker renders it WITH the English term in brackets rather
      than instead of it: the English name is what appears on the invoice, the
      spec sheet and the verifier's report, so hiding it in the Thai interface
      would make the two impossible to reconcile. */
  labelTh: string;
  /** IPCC 2006 / EU standard-factor family */
  family: FuelFamily;
  typicalUnit: MonthlyFuelUnit;
  /** plain-language sanity range for the NCV, in MJ per typical unit */
  typicalNcv?: string;
  /** when this fuel is the right answer, in one clause. English and Thai. */
  note?: string;
  noteTh?: string;
};

export type FuelFamily = "Solid fossil" | "Liquid fossil" | "Gaseous fossil" | "Biomass" | "Waste-derived" | "Other";

/* ── The fuel list ──────────────────────────────────────────────
   Ten fuels, not twenty-five.

   The long list was a catalogue of everything a plant anywhere might burn, and
   in a steel and aluminium portal in Thailand that is the wrong trade: an
   operator hunting for "natural gas" scrolled past sub-bituminous coal,
   lignite, bagasse and tyre-derived fuel to find it, and every one of those
   rows was a chance to pick the neighbouring line by mistake. This is the list
   the sector actually burns, and anything genuinely outside it goes through
   "Other fuel — specify", which is a free-text answer a verifier can read.

   LPG sits under liquid fuels and says so, because it is stored as a liquid
   and burned as a gas, and which of the two an operator calls it decides which
   unit they reach for. */
export const FUEL_TYPES: FuelTypeDef[] = [
  // ── Solid fossil ──
  {
    id: "coking_coal",
    label: "Coking coal / metallurgical coal",
    labelTh: "ถ่านหินสำหรับถลุงเหล็ก",
    family: "Solid fossil",
    typicalUnit: "t",
    typicalNcv: "typically 27,000–30,000 MJ/t",
    note: "Coal charged to a coke oven or used as a reductant.",
    noteTh: "ถ่านหินที่ป้อนเข้าเตาอบโค้ก หรือใช้เป็นตัวรีดิวซ์",
  },
  {
    id: "coke",
    label: "Coke",
    labelTh: "โค้ก",
    family: "Solid fossil",
    typicalUnit: "t",
    typicalNcv: "typically 28,000–30,000 MJ/t",
    note: "Including coke breeze.",
    noteTh: "รวมถึงผงโค้ก",
  },
  {
    id: "anthracite_bituminous",
    label: "Anthracite / bituminous coal",
    labelTh: "ถ่านหินแอนทราไซต์ / บิทูมินัส",
    family: "Solid fossil",
    typicalUnit: "t",
    typicalNcv: "typically 24,000–33,000 MJ/t",
    note: "Thermal coal burned for heat rather than as a reductant.",
    noteTh: "ถ่านหินที่เผาเพื่อให้ความร้อน ไม่ใช่เพื่อรีดิวซ์",
  },
  // ── Liquid fossil ──
  {
    id: "fuel_oil_heavy",
    label: "Fuel oil / heavy fuel oil",
    labelTh: "น้ำมันเตา",
    family: "Liquid fossil",
    typicalUnit: "l",
    typicalNcv: "typically 38–41 MJ/litre",
  },
  {
    id: "diesel",
    label: "Diesel",
    labelTh: "น้ำมันดีเซล",
    family: "Liquid fossil",
    typicalUnit: "l",
    typicalNcv: "typically 35–37 MJ/litre",
  },
  {
    id: "lpg",
    label: "LPG",
    labelTh: "แอลพีจี",
    family: "Liquid fossil",
    typicalUnit: "kg",
    typicalNcv: "typically 45–47 MJ/kg",
    note: "Liquid or gaseous depending on how it is used — record the unit your invoice uses.",
    noteTh: "เป็นได้ทั้งของเหลวและก๊าซ แล้วแต่การใช้งาน — ให้บันทึกตามหน่วยในใบแจ้งหนี้",
  },
  // ── Gaseous fossil ──
  {
    id: "natural_gas",
    label: "Natural gas",
    labelTh: "ก๊าซธรรมชาติ",
    family: "Gaseous fossil",
    typicalUnit: "m3",
    typicalNcv: "typically 33–39 MJ/m³",
  },
  {
    id: "coke_oven_gas",
    label: "Coke oven gas",
    labelTh: "ก๊าซจากเตาอบโค้ก",
    family: "Gaseous fossil",
    typicalUnit: "m3",
    typicalNcv: "typically 16–19 MJ/m³",
    note: "Only where the site runs its own coke ovens.",
    noteTh: "สำหรับโรงงานเหล็กบางประเภทที่มีเตาอบโค้กเอง",
  },
  {
    id: "blast_furnace_gas",
    label: "Blast furnace gas",
    labelTh: "ก๊าซจากเตาถลุง",
    family: "Gaseous fossil",
    typicalUnit: "m3",
    typicalNcv: "typically 2.7–4 MJ/m³",
    note: "Only where the site runs a blast furnace.",
    noteTh: "เฉพาะกรณีที่มีเตาถลุง",
  },
  // ── Biomass ──
  {
    id: "biomass",
    label: "Biomass / biofuel",
    labelTh: "ชีวมวล / เชื้อเพลิงชีวภาพ",
    family: "Biomass",
    typicalUnit: "t",
    typicalNcv: "typically 12,000–19,000 MJ/t as received",
    note: "Where biomass is co-fired. Zero-rated only if the sustainability criteria are met.",
    noteTh: "กรณีมีการผสมเชื้อเพลิงชีวมวล นับเป็นศูนย์ได้เฉพาะเมื่อผ่านเกณฑ์ความยั่งยืน",
  },
];

/* Fuels the picker no longer offers, kept so a row entered before the list was
   trimmed still renders its name rather than a raw id. Nothing reads these
   except `fuelTypeDef`, and nothing new can be created with them. */
const RETIRED_FUEL_TYPES: Pick<FuelTypeDef, "id" | "label" | "labelTh">[] = [
  { id: "lng", label: "Liquefied natural gas (LNG)", labelTh: "ก๊าซธรรมชาติเหลว (LNG)" },
  { id: "bof_gas", label: "Basic oxygen furnace gas", labelTh: "ก๊าซจากเตาออกซิเจน" },
  { id: "refinery_gas", label: "Refinery gas", labelTh: "ก๊าซจากโรงกลั่น" },
  { id: "fuel_oil_light", label: "Light fuel oil", labelTh: "น้ำมันเตาชนิดเบา" },
  { id: "kerosene", label: "Kerosene", labelTh: "น้ำมันก๊าด" },
  { id: "petroleum_coke", label: "Petroleum coke", labelTh: "ปิโตรเลียมโค้ก" },
  { id: "anthracite", label: "Anthracite", labelTh: "แอนทราไซต์" },
  { id: "bituminous_coal", label: "Bituminous coal", labelTh: "ถ่านหินบิทูมินัส" },
  { id: "sub_bituminous_coal", label: "Sub-bituminous coal", labelTh: "ถ่านหินซับบิทูมินัส" },
  { id: "lignite", label: "Lignite / brown coal", labelTh: "ลิกไนต์" },
  { id: "wood_chips", label: "Wood chips / wood pellets", labelTh: "ชิ้นไม้สับ / เม็ดไม้" },
  { id: "rice_husk", label: "Rice husk", labelTh: "แกลบ" },
  { id: "bagasse", label: "Bagasse", labelTh: "ชานอ้อย" },
  { id: "biogas", label: "Biogas", labelTh: "ก๊าซชีวภาพ" },
  { id: "biodiesel", label: "Biodiesel / bio-oil", labelTh: "ไบโอดีเซล" },
  { id: "rdf", label: "Refuse-derived fuel (RDF/SRF)", labelTh: "เชื้อเพลิงจากขยะ (RDF/SRF)" },
  { id: "waste_oil", label: "Waste oil", labelTh: "น้ำมันใช้แล้ว" },
  { id: "tyres", label: "Tyre-derived fuel", labelTh: "เชื้อเพลิงจากยางรถยนต์" },
];

export const FUEL_TYPE_OTHER = "other";

export const fuelTypeDef = (id: string): FuelTypeDef | undefined =>
  FUEL_TYPES.find((f) => f.id === id) ??
  (RETIRED_FUEL_TYPES.find((f) => f.id === id) as FuelTypeDef | undefined);

export const fuelTypeLabel = (id: string, otherText?: string): string => {
  if (id === FUEL_TYPE_OTHER) return otherText?.trim() ? otherText.trim() : "Other fuel";
  return fuelTypeDef(id)?.label ?? id;
};

/** The name to show in a given interface language.

    Thai carries the English term in brackets rather than replacing it. A Thai
    operator picking "ก๊าซธรรมชาติ" is reading a meter and an invoice that both
    say "Natural gas", and the verifier's report will say it too — so the two
    names have to appear together or the trail breaks at the language boundary. */
export function fuelTypeLabelIn(lang: string, id: string, otherText?: string): string {
  if (id === FUEL_TYPE_OTHER) return otherText?.trim() ? otherText.trim() : lang === "th" ? "เชื้อเพลิงอื่น ๆ" : "Other fuel";
  const def = fuelTypeDef(id);
  if (!def) return id;
  return lang === "th" ? `${def.labelTh} (${def.label})` : def.label;
}

export const fuelTypeNoteIn = (lang: string, id: string): string | undefined => {
  const def = fuelTypeDef(id);
  if (!def) return undefined;
  return lang === "th" ? (def.noteTh ?? def.note) : def.note;
};

/** Families in list order — the fuel picker groups by these so the menu reads
    as three kinds of fuel plus biomass rather than as ten unrelated rows. */
export const FUEL_FAMILIES = ["Solid fossil", "Liquid fossil", "Gaseous fossil", "Biomass"] as const;

/** Family headings, both languages. Same rule as the fuel names: Thai first,
    English in brackets, because the family is what an EU factor table is
    indexed by. */
export const FUEL_FAMILY_LABEL: Record<string, { en: string; th: string }> = {
  "Solid fossil": { en: "Solid fossil fuels", th: "เชื้อเพลิงแข็ง" },
  "Liquid fossil": { en: "Liquid fossil fuels", th: "เชื้อเพลิงเหลว" },
  "Gaseous fossil": { en: "Gaseous fossil fuels", th: "เชื้อเพลิงก๊าซ" },
  Biomass: { en: "Biomass", th: "ชีวมวล" },
  "Waste-derived": { en: "Waste-derived", th: "เชื้อเพลิงจากของเสีย" },
  Other: { en: "Other", th: "อื่น ๆ" },
};

export const fuelFamilyLabelIn = (lang: string, family: string): string => {
  const entry = FUEL_FAMILY_LABEL[family];
  if (!entry) return family;
  return lang === "th" ? `${entry.th} (${entry.en})` : entry.en;
};

export type FuelEntry = {
  id: string;
  fuelType: string;
  /** free text when `fuelType` is "other" — named, so the row stays legible */
  fuelTypeOther?: string;
  quantity: number;
  unit: MonthlyFuelUnit;
  /** MJ per one of `unit`. Required unless the unit is already GJ. */
  ncvMjPerUnit?: number;
  /** tCO₂ per GJ — never per volume */
  efTco2PerGj: number;
  /* ── Oxidation factor (Annex II, Equation 5) ────────────────────
     Em = AD × EF × OF. Defaulting to 1 is not a simplification the portal
     invented — the regulation explicitly permits OF = 1 as the conservative
     choice, to spare an installation the tracking burden of proving that some
     carbon left unburned. So the field exists, carries 1, and is not asked for
     on the form; a plant that measures its own OF has somewhere to put it
     without a schema migration. */
  oxidationFactor?: number;
  /* ── Bug 6 — OF has to be SOURCED, never a bare typed number ────
     A typed OF below 1 reduces reported emissions — the direction a
     verifier scrutinises hardest — with no evidence behind it. The default
     path locks at 1.0, no evidence needed; the measured path collects
     C_ash and C_total and DERIVES OF = 1 − (C_ash / C_total) — the engine
     computes it, the reader never types it. `oxidationFactor` above stays
     as the resolved figure `fuelCO2` actually multiplies by
     (`resolvedOxidationFactor` keeps it in sync); these two are only ever
     read when `oxidationFactorSource === "measured"`. */
  oxidationFactorSource?: "conservative_default" | "measured";
  cAsh?: number;
  cTotal?: number;
  /* ── Biomass fraction (Annex II, Equation 10) ───────────────────
     EF = EF_preliminary × (1 − BF). ZERO IS THE LEGAL DEFAULT, not a UI
     convenience: where the fraction is unknown the whole stream counts as
     fossil. A figure above zero needs the sustainability criteria of Directive
     (EU) 2018/2001 Article 29(2)–(7) and (10) evidenced behind it — Annex II
     Point B.3.3 — which is why the form gates it on a document. */
  biomassFraction?: number;
  /** the written confirmation that the sustainability criteria behind a
      non-zero `biomassFraction` are met and documented. Block-with-override,
      the same shape the precursor verification report uses. */
  biomassEvidenced?: boolean;
  factorSource: FuelFactorSource;
  /** This row was burned to generate the month's self-generated electricity
      — flags it as an input to EF_El = (Σ(AD×NCV×EF) + Em_FGC) / El_prod,
      not to the good's own direct fuel emissions a second time. A fuel can
      be flagged even though its combustion CO₂ is already counted in
      fuelCO2 above: the flag only feeds the ELECTRICITY factor calculation,
      it does not double-count the fuel's own direct emissions. */
  usedForSelfGeneratedElectricity?: boolean;
};

/* ── Electricity ────────────────────────────────────────────────
   ABSOLUTE MWh for the month. Never MWh per tonne — the per-tonne figure is
   derived once, by the single division in `workspaceSEE`.

   FOUR SOURCE TYPES, because Annex II Point D.4 recognises four ways
   electricity reaches an installation, and a single percentage split cannot
   carry the fact that each source has ITS OWN factor — see
   `ElectricitySourceRow` below, which is what actually replaced the old
   single factor-source-plus-percentage field. */
export type ElectricityFactorSource = "grid_default" | "ppa" | "self_generated" | "direct_technical_link";

export const ELECTRICITY_FACTOR_SOURCES: ElectricityFactorSource[] = [
  "grid_default",
  "self_generated",
  "ppa",
  "direct_technical_link",
];

export const ELECTRICITY_FACTOR_SOURCE_LABEL: Record<ElectricityFactorSource, string> = {
  grid_default: "Grid",
  ppa: "Power purchase agreement",
  self_generated: "Self-generated",
  direct_technical_link: "Direct technical link",
};

export const ELECTRICITY_FACTOR_SOURCE_HINT: Record<ElectricityFactorSource, string> = {
  grid_default: "Drawn from the public grid. Factor is the published country default — locked, never typed.",
  ppa: "Bought under a power purchase agreement. Factor is the contracted generator's own, evidenced by the agreement.",
  self_generated: "Generated on site. Factor is derived from the fuels burned to generate it — see the fuel rows above, flagged for self-generation.",
  direct_technical_link: "A dedicated line from a specific generating installation, outside the public grid. Factor is that generator's own.",
};

/* ── Where the electricity factor comes from ────────────────────
   THE FACTOR FOLLOWS THE SOURCE. Grid supply takes the published country
   default and nothing else — LOCKED, whether or not a value has been
   published yet (see lib/cbam/electricity-grid-factors.ts: a blank is
   honest, a substitute figure under the wrong citation is not). Every other
   source takes the generator's own, evidenced by the contract, the direct
   line, or — for self-generation — derived from the fuels burned.

   `country` defaults to "TH" because every installation in this portal is
   Thai; a multi-country deployment would thread the installation's own
   country through instead of relying on the default. */
export function electricityFactorFor(source: ElectricityFactorSource, country: string = "TH"): number | null {
  if (source !== "grid_default") return null;
  return gridFactorFor(country)?.value ?? null;
}

/** Grid is ALWAYS locked, whether or not the country default has been
    published yet — a grid row is never a free-typed figure, only ever the
    country default or a blank awaiting it. */
export const isGridFactorLocked = (source: ElectricityFactorSource): boolean => source === "grid_default";

/* ── Repeatable electricity sources ──────────────────────────────
   Replaces the single "Grid default factor" + "self-generated share %"
   pair. Where an installation draws from more than one source, the
   emission factor is the average of each source's own factor, weighted by
   its share of total electricity consumed — a bare percentage carries no
   factor with it, so it could never express that. */
export type ElectricitySourceRow = {
  id: string;
  sourceType: ElectricityFactorSource;
  /** absolute MWh from this source this month — real (active) power only,
      reactive power is not metered here */
  mwh: number;
  /** tCO₂ per MWh. null means "awaiting a published figure" — distinct from
      a genuine 0, and only possible on a grid row whose country default
      isn't seeded yet. For a grid row this is always overwritten on read
      from `electricityFactorFor`, never trusted from storage — which is
      what closes the "stale grid figure survives a source change" bug. For
      a self-generated row, derived by `selfGeneratedElectricityEf`. For PPA
      / direct technical link, the figure the reader typed in. */
  factorTco2PerMwh: number | null;
};

export const emptyElectricitySource = (): ElectricitySourceRow => ({ id: uid(), sourceType: "grid_default", mwh: 0, factorTco2PerMwh: electricityFactorFor("grid_default") });

export type MonthStatus = "empty" | "draft" | "submitted" | "reviewed";

export const MONTH_STATUS_LABEL: Record<MonthStatus, string> = {
  empty: "Not started",
  draft: "Draft",
  submitted: "Submitted",
  reviewed: "Reviewed",
};

/** Submitted and reviewed months are the ones that count toward the annual
    figure. A draft is someone's work in progress, and including it would let
    an unfinished month move a filed number. */
export const COUNTS_TOWARD_ANNUAL: MonthStatus[] = ["submitted", "reviewed"];

export const monthCounts = (m: Pick<MonthlyEntry, "status">): boolean => COUNTS_TOWARD_ANNUAL.includes(m.status);

/* ── Process emissions (Bug 5) ────────────────────────────────────
   Structured entry, two paths — never a bare typed number with a prose
   sentence behind it. `note` on either variant is supplementary commentary
   only; it is never what the figure is derived FROM, only additional
   context a verifier might find useful. */
export type ProcessEmissionEntry =
  | {
      id: string;
      method: "standard";
      /** id into lib/cbam/process-factors.ts's STANDARD_MATERIALS */
      materialId: string;
      quantityT: number;
      /** default 1, must sit in (0, 1] */
      conversionFactor: number;
      note?: string;
    }
  | {
      id: string;
      method: "mass_balance";
      /** id into lib/cbam/process-factors.ts's CARBON_CONTENTS */
      materialId: string;
      /** NEGATIVE for an output stream — see process-factors.ts */
      quantityT: number;
      note?: string;
    };

export const emptyProcessEmissionEntry = (): ProcessEmissionEntry => ({ id: uid(), method: "standard", materialId: "", quantityT: 0, conversionFactor: 1 });

/** Em_j = AD×EF×CF (standard) or Em_k = 3.664×AD×CC (mass balance, negative
    AD on an output stream) — the single place either formula runs, so a
    screen and a report can never compute it two different ways. */
export function processEmissionEntryTCO2(e: ProcessEmissionEntry): number {
  if (e.method === "standard") return standardProcessEmission(e.materialId, e.quantityT, e.conversionFactor || 1);
  return massBalanceProcessEmission(e.materialId, e.quantityT);
}

export type MonthlyEntry = {
  id: string;
  workspaceId: string;
  /** 'YYYY-MM' */
  month: string;
  productionTonnes: number;
  fuels: FuelEntry[];
  /** derived from `processEmissionEntries` by `saveMonth` whenever that
      array is present, so workspaceSEE/monthResult need no change */
  processEmissionsTco2: number;
  /** legacy free-text field — kept for back-compat with records saved
      before structured entry existed. A fresh row is always written
      through `processEmissionEntries` instead; the note fields on those
      entries are supplementary commentary only, never the sole record of
      how a figure was derived (Bug 5). */
  processEmissionsBasis?: string;
  /** Bug 5's structured replacement for the free tCO₂ + prose pair. */
  processEmissionEntries?: ProcessEmissionEntry[];
  /** ABSOLUTE MWh for the month — derived from `electricitySources` by
      `saveMonth` whenever that array is present, so every existing reader
      (workspaceSEE, readiness, month-quality) keeps working against a
      figure that is always in sync with the row-level breakdown. */
  electricityMwh: number;
  electricityFactorTco2PerMwh: number;
  /** kept for back-compat with records saved before the source list existed
      — a fresh row is always written through `electricitySources` instead */
  electricityFactorSource: ElectricityFactorSource;
  selfGeneratedSharePct?: number;
  /** The repeatable source list (Bug 4) — the figure of record whenever
      present. Each source has its own factor; the weighted average is what
      `electricityFactorTco2PerMwh` above is kept synced to. */
  electricitySources?: ElectricitySourceRow[];
  /** Em_FGC — process emissions from flue gas cleaning, tCO₂, entering
      EF_El's numerator alongside the fuel terms. Defaults to 0. */
  flueGasCleaningEmissionsTco2?: number;
  status: MonthStatus;
  submittedAt?: string;
  submittedBy?: string;
  notes?: string;
};

/* ── Waste gas cap ──────────────────────────────────────────────
   Annex III Equations 53-54: a waste gas fed into electricity generation
   caps at the natural gas standard factor (56.1 tCO₂/TJ) rather than
   carrying its own — otherwise blast furnace gas (260) or oxygen steel
   furnace gas (182) would inflate EF_El by an order of magnitude relative
   to every other fuel in the mix. Only applied here, inside the
   electricity-factor calculation — the fuel's own DIRECT emissions
   (fuelCO2 above) always use its real factor, uncapped. */
export function cappedFuelEfForElectricity(fuelTypeId: string, efTco2PerGj: number): number {
  if (!isWasteGas(fuelTypeId)) return efTco2PerGj;
  const efTco2PerTj = efTco2PerGj * 1000;
  return efTco2PerTj > TEMPLATE_NATURAL_GAS_EF.value ? TEMPLATE_NATURAL_GAS_EF.value / 1000 : efTco2PerGj;
}

/** EF_El = ( Σ(AD_i × NCV_i × EF_i) + Em_FGC ) / El_prod — the self-generated
    row's own factor, derived from the month's fuel rows flagged
    `usedForSelfGeneratedElectricity`, never typed by hand. `elProdMwh` is
    that source row's own MWh (El_prod). Returns 0 when nothing is flagged
    or El_prod is 0 — an empty numerator over a real denominator is
    legitimately zero, not unknown. */
export function selfGeneratedElectricityEf(entry: Pick<MonthlyEntry, "fuels" | "flueGasCleaningEmissionsTco2">, elProdMwh: number): number {
  if (!(elProdMwh > 0)) return 0;
  const flagged = entry.fuels.filter((f) => f.usedForSelfGeneratedElectricity);
  const fuelTerm = flagged.reduce((sum, f) => sum + fuelGJ(f) * cappedFuelEfForElectricity(f.fuelType, f.efTco2PerGj) * resolvedOxidationFactor(f), 0);
  const emFgc = entry.flueGasCleaningEmissionsTco2 ?? 0;
  return (fuelTerm + emFgc) / elProdMwh;
}

/** Recomputes each source row's factor and the derived totals — the single
    place this happens, called by `saveMonth` so every write goes through
    it. Grid rows are ALWAYS overwritten from the published country default
    (never trusted from storage — this is what closes the "stale grid
    figure survives a source change" bug); self-generated rows are always
    recomputed from the flagged fuel rows; PPA and direct-technical-link
    rows keep whatever was typed. */
export function resolveElectricitySources(entry: MonthlyEntry): {
  sources: ElectricitySourceRow[];
  totalMwh: number;
  weightedFactor: number;
  /** true when a grid row is present but its country default isn't
      published yet — the total below is understated by that row's MWh
      until it is. Surfaced so `monthIssues` can block rather than silently
      accept an incomplete weighted average. */
  awaitingGridFactor: boolean;
} {
  const sources = (entry.electricitySources ?? []).map((s) => {
    if (s.sourceType === "grid_default") return { ...s, factorTco2PerMwh: electricityFactorFor("grid_default") };
    if (s.sourceType === "self_generated") return { ...s, factorTco2PerMwh: selfGeneratedElectricityEf(entry, s.mwh) };
    return s;
  });
  const totalMwh = sources.reduce((a, s) => a + (s.mwh || 0), 0);
  const totalTCO2 = sources.reduce((a, s) => a + (s.mwh || 0) * (s.factorTco2PerMwh ?? 0), 0);
  const weightedFactor = totalMwh > 0 ? totalTCO2 / totalMwh : 0;
  const awaitingGridFactor = sources.some((s) => s.sourceType === "grid_default" && s.mwh > 0 && s.factorTco2PerMwh == null);
  return { sources, totalMwh, weightedFactor, awaitingGridFactor };
}

/* ── Store ──────────────────────────────────────────────────────
   Same seam as lib/shipments.ts. Keyed by workspace so a month can be read
   without loading every workspace's year. */
const KEY = "certrace:monthly-data";

type Store = Record<string, MonthlyEntry[]>;

export const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? `m-${crypto.randomUUID().slice(0, 8)}` : `m-${Date.now().toString(36)}`;

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
    /* ignore quota — §6 of the spec flags localStorage as the forcing function
       for a real backend once evidence files land here */
  }
}

export const emptyMonth = (workspaceId: string, month: string): MonthlyEntry => ({
  id: uid(),
  workspaceId,
  month,
  productionTonnes: 0,
  fuels: [],
  processEmissionsTco2: 0,
  electricityMwh: 0,
  /* THE FACTOR COMES WITH THE SOURCE, even on a blank month. The source starts
     at "grid default", which locks the factor field — so a month opening with
     0 in it opened with a locked, empty, unfillable box. Seeded from the same
     function the picker uses. */
  electricityFactorTco2PerMwh: electricityFactorFor("grid_default") ?? 0,
  electricityFactorSource: "grid_default",
  // Deliberately NOT seeded with a default source row (unlike `fuels`, which
  // also opens empty) — an `electricitySources` array with a single zero-MWh
  // row is indistinguishable, to `monthIssues`, from a real answer of "one
  // grid source, nothing drawn yet", and would make every legacy-scalar-only
  // caller (old records, fixtures) misread as an empty new-model month. The
  // editor's own "+ Add source" is what starts the array, same as fuels.
  status: "empty",
});

/* A NEW ROW NAMES NO FUEL. It used to open as natural gas in m³, which is the
   right guess often enough that nobody notices the times it is wrong — and a
   row silently filed as natural gas because the reader never opened the
   dropdown is a fuel a verifier finds by reading the invoice beside it.

   `applyEuStandard` is what fills the factors once a fuel IS chosen, so the
   blank row costs nothing in typing. */
export const emptyFuel = (): FuelEntry => ({
  id: uid(),
  fuelType: "",
  quantity: 0,
  unit: "m3",
  ncvMjPerUnit: undefined,
  efTco2PerGj: 0,
  oxidationFactor: 1,
  oxidationFactorSource: "conservative_default",
  biomassFraction: 0,
  factorSource: "eu_standard",
});

/* ── The Type I lock, in one function ───────────────────────────
   Called wherever a fuel row's type, unit or factor source changes. On a Type
   I row it writes the Point G values and the screens render the two fields
   read-only; on a Type II row it hands the fields back and leaves whatever was
   there, because the figure the reader is about to type is the one on the spec
   sheet in front of them.

   The lock is enforced HERE and again in `monthIssues`, deliberately. A
   disabled input is a suggestion — anything writing to the store directly
   would sail past it — so the validator refuses a row that claims to be an EU
   standard value while carrying something else. */
export function applyEuStandard(f: FuelEntry): FuelEntry {
  if (!isTypeIStandard(f.factorSource)) return f;
  const d = euStandardFor(f.fuelType, f.unit);
  if (!d) return f;
  return {
    ...f,
    efTco2PerGj: d.efTco2PerGj,
    ncvMjPerUnit: f.unit === "GJ" ? undefined : (d.ncvMjPerUnit ?? f.ncvMjPerUnit),
  };
}

/** Every entry stored for a workspace — sparse, only the months touched. */
export const listMonths = (workspaceId: string): MonthlyEntry[] =>
  (read()[workspaceId] ?? []).sort((a, b) => a.month.localeCompare(b.month));

export const getMonth = (workspaceId: string, month: string): MonthlyEntry | null =>
  listMonths(workspaceId).find((m) => m.month === month) ?? null;

/** All twelve months of the year, with empty placeholders for months not yet
    entered. The screen never has to reason about absence — an untouched
    March comes back as an `empty` March, which is what makes "11 of 12
    submitted" a fact rather than an inference. */
export function monthsForWorkspace(workspace: Pick<VerificationWorkspace, "id" | "year">): MonthlyEntry[] {
  const stored = new Map(listMonths(workspace.id).map((m) => [m.month, m]));
  return monthsOf(workspace).map((ym) => stored.get(ym) ?? emptyMonth(workspace.id, ym));
}

export function saveMonth(rawEntry: MonthlyEntry): MonthlyEntry {
  let entry = rawEntry;
  // Bug 4: whenever the repeatable source list is in use, it is the figure
  // of record — the legacy scalar pair is kept as its derived sum/weighted
  // average so every existing reader (workspaceSEE, readiness,
  // month-quality) needs no change and never sees a stale grid figure.
  if (entry.electricitySources && entry.electricitySources.length > 0) {
    const { sources, totalMwh, weightedFactor } = resolveElectricitySources(entry);
    entry = { ...entry, electricitySources: sources, electricityMwh: totalMwh, electricityFactorTco2PerMwh: weightedFactor };
  }
  // Bug 5: same pattern — the structured entries are the figure of record
  // whenever present, kept in sync so monthResult's processTCO2 (and every
  // downstream reader of it) needs no change.
  if (entry.processEmissionEntries && entry.processEmissionEntries.length > 0) {
    const total = entry.processEmissionEntries.reduce((a, e) => a + processEmissionEntryTCO2(e), 0);
    entry = { ...entry, processEmissionsTco2: total };
  }
  const store = read();
  const rows = store[entry.workspaceId] ?? [];
  const idx = rows.findIndex((m) => m.month === entry.month);
  if (idx >= 0) rows[idx] = entry;
  else rows.push(entry);
  store[entry.workspaceId] = rows;
  write(store);
  return entry;
}

export function removeMonth(workspaceId: string, month: string): MonthlyEntry[] {
  const store = read();
  store[workspaceId] = (store[workspaceId] ?? []).filter((m) => m.month !== month);
  write(store);
  return store[workspaceId];
}

/** Drop everything for a workspace — used when the workspace itself is
    deleted, so a new workspace can never inherit an old year's months. */
export function removeMonthsForWorkspace(workspaceId: string): void {
  const store = read();
  delete store[workspaceId];
  write(store);
}

export function submitMonth(workspaceId: string, month: string, by: string): MonthlyEntry | null {
  const entry = getMonth(workspaceId, month);
  if (!entry) return null;
  if (monthIssues(entry).some((i) => i.severity === "error")) return null;
  return saveMonth({ ...entry, status: "submitted", submittedAt: new Date().toISOString(), submittedBy: by });
}

/* ── Reopening a submitted month ────────────────────────────────
   The counterpart to `submitMonth`, and the ONLY way back out of a submitted
   month on the supplier's side. It is not called by the supplier's own screen:
   an exporter approves the request first (see `approveEditRequest` in
   lib/month-submission.ts), and this applies that decision to the readings.

   The attestation is left where it is. Reopening does not retract the
   statement that was made — it says the figures may move again, and the
   submission record is what carries whose name was on the last set. */
export function reopenMonth(workspaceId: string, month: string): MonthlyEntry | null {
  const entry = getMonth(workspaceId, month);
  if (!entry) return null;
  if (entry.status !== "submitted" && entry.status !== "reviewed") return entry;
  return saveMonth({ ...entry, status: "draft" });
}

/* ── Copy from previous month ───────────────────────────────────
   Real exporters re-enter the same setup twelve times, and that is where
   transcription errors come from: a NCV typed 38 in January and 3.8 in July
   moves the year's direct emissions by an order of magnitude and looks like
   nothing on the screen.

   Clones the SETUP — fuel types, factors, NCVs, oxidation factors, the
   electricity factor and its source. Never the QUANTITIES: a copied volume
   would be a fabricated meter reading, which is the one thing a verifier is
   actually looking for. */
export function copyFromPreviousMonth(workspaceId: string, month: string): MonthlyEntry | null {
  const all = monthsForWorkspaceById(workspaceId, month);
  if (!all) return null;
  const { previous, current } = all;
  if (!previous) return null;
  return {
    ...current,
    fuels: previous.fuels.map((f) => ({ ...f, id: uid(), quantity: 0 })),
    electricityMwh: 0,
    electricityFactorTco2PerMwh: previous.electricityFactorTco2PerMwh,
    electricityFactorSource: previous.electricityFactorSource,
    selfGeneratedSharePct: previous.selfGeneratedSharePct,
    electricitySources: previous.electricitySources?.map((s) => ({ ...s, id: uid(), mwh: 0 })),
    processEmissionsTco2: 0,
    processEmissionsBasis: previous.processEmissionsBasis,
    processEmissionEntries: previous.processEmissionEntries?.map((e) => ({ ...e, id: uid(), quantityT: 0 })),
  };
}

function monthsForWorkspaceById(workspaceId: string, month: string): { previous: MonthlyEntry | null; current: MonthlyEntry } | null {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return null;
  const prevMonth = m === 1 ? null : `${y}-${String(m - 1).padStart(2, "0")}`;
  return {
    previous: prevMonth ? getMonth(workspaceId, prevMonth) : null,
    current: getMonth(workspaceId, month) ?? emptyMonth(workspaceId, month),
  };
}

/** Is there a previous month with a setup worth copying? */
export function hasPreviousMonthSetup(workspaceId: string, month: string): boolean {
  const pair = monthsForWorkspaceById(workspaceId, month);
  return Boolean(pair?.previous && (pair.previous.fuels.length > 0 || pair.previous.electricityFactorTco2PerMwh > 0));
}

/* ── Validation ─────────────────────────────────────────────────
   Errors BLOCK submission. Warnings do not. The distinction is the whole
   point: a blocked month is one where the arithmetic would be wrong, and
   letting it through would put a wrong number in front of a verifier under
   the portal's name. */
export type MonthIssueSeverity = "error" | "warn";

export type MonthIssue = {
  severity: MonthIssueSeverity;
  /** which input — used to scroll to and highlight the field */
  field: string;
  message: string;
};

export function monthIssues(entry: MonthlyEntry): MonthIssue[] {
  const issues: MonthIssue[] = [];

  if (!(entry.productionTonnes > 0)) {
    issues.push({
      severity: "error",
      field: "production",
      message:
        "Production for the month is missing. It is the denominator of every per-tonne figure in the year, and a month counted as zero would inflate the annual SEE rather than leave a visible gap.",
    });
  }

  entry.fuels.forEach((f, i) => {
    /* NAME THE ROW THE WAY THE ROW NAMES ITSELF.
       `fuelTypeLabel(f.fuelType)` with no second argument renders every
       unlisted fuel as the literal words "Other fuel" and an unpicked row as
       the empty string — so three findings about three different fuels came
       out reading the same, and the reader could not tell which row to open.
       Same fix as the evidence checklist made for the same reason. */
    const named = fuelTypeLabel(f.fuelType, f.fuelTypeOther);
    const name = f.fuelType ? named : `Fuel row ${i + 1}`;
    /* "Other" OBLIGES A DESCRIPTION.
       A row filed as "Other fuel" with nothing behind it is a quantity and an
       emission factor attached to a substance nobody has named — the verifier
       cannot check the factor against the fuel, and Certrace cannot sum it
       with anything. This is the same rule mmdIssues applies to the
       methodology's own fuel list; the month has to apply it too, or the
       methodology names the fuel and the readings do not. */
    if (f.fuelType === FUEL_TYPE_OTHER && !f.fuelTypeOther?.trim()) {
      issues.push({
        severity: "error",
        field: `fuel:${f.id}:type`,
        message: `Fuel row ${i + 1} is set to "Other fuel" with no name. Say what it is, in the terms your invoices use — an emission factor against an unnamed fuel is a figure a verifier cannot test.`,
      });
    }
    /* A ROW WITH NO FUEL CHOSEN. New rows open blank now, so this is the first
       thing to say about one — every check below it would otherwise report the
       row as "Fuel row 3" three times over. */
    if (!f.fuelType) {
      issues.push({
        severity: "error",
        field: `fuel:${f.id}:type`,
        message: `Fuel row ${i + 1} has no fuel chosen. Pick one, or remove the row if nothing of the kind was burned this month.`,
      });
    }
    /* THE TYPE I LOCK, ENFORCED WHERE IT CANNOT BE CLICKED PAST.
       A disabled input stops a person; it does not stop a payload. A row that
       says "EU standard value" has to carry the Point G values for its fuel
       and its unit, or the claim on the row is not true of the figures beside
       it — which is the kind of contradiction a verifier finds by looking up
       one number. */
    if (isTypeIStandard(f.factorSource) && f.fuelType && f.fuelType !== FUEL_TYPE_OTHER) {
      if (!hasEuStandard(f.fuelType)) {
        issues.push({
          severity: "error",
          field: `fuel:${f.id}:factorSource`,
          message: `${name} (row ${i + 1}) is marked as an EU standard value, but Annex II Point G publishes no value for it. Use a laboratory, supplier or national-inventory figure instead.`,
        });
      } else if (!matchesEuStandard(f.fuelType, f.unit, f.ncvMjPerUnit, f.efTco2PerGj)) {
        const d = euStandardFor(f.fuelType, f.unit);
        issues.push({
          severity: "error",
          field: `fuel:${f.id}:ef`,
          message:
            `${name} (row ${i + 1}) is marked as an EU standard value but does not carry one. Point G gives ${d?.efTco2PerGj} tCO₂/GJ` +
            (d?.ncvMjPerUnit != null ? ` and ${d.ncvMjPerUnit} MJ per ${f.unit}` : "") +
            ". Either restore those, or change the factor source to the document the figures actually come from.",
        });
      }
    }
    /* "EU standard value" on an unlisted fuel is a claim about a category
       Point G does not name. */
    if (isTypeIStandard(f.factorSource) && f.fuelType === FUEL_TYPE_OTHER) {
      issues.push({
        severity: "error",
        field: `fuel:${f.id}:factorSource`,
        message: `Row ${i + 1} is a fuel Point G does not list, so there is no EU standard value for it. Its calorific value and emission factor have to come from a laboratory analysis or from the supplier.`,
      });
    }
    if (f.unit !== "GJ" && !(Number(f.ncvMjPerUnit) > 0)) {
      issues.push({
        severity: "error",
        field: `fuel:${f.id}:ncv`,
        message:
          `${name} (row ${i + 1}) has a quantity in ${f.unit} but no net calorific value. ` +
          "An emission factor in tCO₂/GJ cannot be applied to a volume without a calorific value — the two are in different units, " +
          "and Certrace will not substitute a standard NCV because the wrong one moves the emissions figure a verifier recomputes.",
      });
    }
    /* A QUANTITY IS REQUIRED, not merely expected. A row carrying a fuel, a
       calorific value and an emission factor but no quantity contributes zero
       tCO₂ to a month in which the meter says otherwise, and it looks complete
       while doing it. If nothing of this fuel was burned, the answer is to
       remove the row — which also removes it from the methodology, so the two
       still agree. */
    if (!(f.quantity > 0)) {
      issues.push({
        severity: "error",
        field: `fuel:${f.id}:quantity`,
        message: `${name} (row ${i + 1}) has no quantity for this month. Enter the metered figure, or remove the row if this fuel was not burned.`,
      });
    }
    /* Biomass fraction — Annex II Equation 10 and Point B.3.3. Zero needs
       nothing; anything above it needs the sustainability criteria evidenced,
       and until they are the row is blocked rather than quietly zero-rated. */
    const bf = f.biomassFraction;
    if (bf != null && (bf < 0 || bf > 1)) {
      issues.push({ severity: "error", field: `fuel:${f.id}:bf`, message: `${name} (row ${i + 1}) has a biomass fraction outside 0–1. It is a fraction, not a percentage.` });
    } else if (bf != null && bf > 0 && !f.biomassEvidenced) {
      issues.push({
        severity: "error",
        field: `fuel:${f.id}:bf`,
        message:
          `${name} (row ${i + 1}) claims a biomass fraction of ${bf}, which zero-rates that share of its carbon. ` +
          "Annex II Point B.3.3 allows it only where the sustainability criteria of Directive (EU) 2018/2001 Article 29(2)–(7) and (10) are met and evidenced. Confirm that, or set the fraction to 0 — an unknown fraction counts as fossil.",
      });
    }
    if (!(f.efTco2PerGj > 0)) {
      issues.push({
        severity: "error",
        field: `fuel:${f.id}:ef`,
        message: `${name} (row ${i + 1}) has no emission factor. It must be in tCO₂ per GJ — a factor per m³ or per litre is roughly 25× out.`,
      });
    }
    if (f.oxidationFactorSource === "measured") {
      if (!(f.cTotal! > 0)) {
        issues.push({
          severity: "error",
          field: `fuel:${f.id}:ox`,
          message: `${name} (row ${i + 1}) claims a measured oxidation factor but C_total is missing. OF is derived from the lab result, never typed directly.`,
        });
      } else {
        const of = 1 - (f.cAsh ?? 0) / f.cTotal!;
        if (!(of > 0 && of <= 1)) {
          issues.push({
            severity: "error",
            field: `fuel:${f.id}:ox`,
            message: `${name} (row ${i + 1})'s measured C_ash/C_total gives an oxidation factor outside 0–1 — check the lab figures.`,
          });
        }
      }
    } else {
      // Legacy typed rows, saved before the source model existed.
      const ox = f.oxidationFactor;
      if (ox != null && (ox < 0 || ox > 1)) {
        issues.push({ severity: "error", field: `fuel:${f.id}:ox`, message: `${name} (row ${i + 1}) has an oxidation factor outside 0–1.` });
      }
    }
  });

  if (entry.processEmissionEntries && entry.processEmissionEntries.length > 0) {
    // Bug 5: each entry has to actually resolve to a number — a material
    // picked and a quantity, not a narrated derivation. The note field is
    // never checked here, because it is supplementary, never the record.
    entry.processEmissionEntries.forEach((e, i) => {
      if (!e.materialId) {
        issues.push({
          severity: "error",
          field: `processEntry:${e.id}:material`,
          message: `Process emission row ${i + 1} has no material chosen — the figure cannot be derived without one.`,
        });
      }
      if (!(Number(e.quantityT) !== 0)) {
        issues.push({
          severity: "error",
          field: `processEntry:${e.id}:quantity`,
          message: `Process emission row ${i + 1} has no quantity. Enter it, or remove the row.`,
        });
      }
      if (e.method === "standard" && !(e.conversionFactor > 0 && e.conversionFactor <= 1)) {
        issues.push({
          severity: "error",
          field: `processEntry:${e.id}:cf`,
          message: `Process emission row ${i + 1}'s conversion factor must be greater than 0 and no more than 1.`,
        });
      }
    });
  } else if (entry.processEmissionsTco2 > 0 && !entry.processEmissionsBasis?.trim()) {
    issues.push({
      severity: "error",
      field: "processBasis",
      message:
        "Process emissions are recorded but the basis is empty. A verifier will ask how the figure was derived — electrode consumption, carbonate decomposition, flux — and an unexplained tonnage is a finding.",
    });
  }

  if (entry.electricitySources && entry.electricitySources.length > 0) {
    /* Bug 4's model: each row validated on its own terms, not one pair of
       scalars. A grid row with no published country default is not "you
       forgot to fill this in" — it is a genuine data gap upstream of the
       exporter, so it gets its own message rather than the generic
       missing-factor one. */
    const { totalMwh, awaitingGridFactor } = resolveElectricitySources(entry);
    if (!(totalMwh > 0)) {
      issues.push({
        severity: "error",
        field: "electricity",
        message: "Electricity consumed this month is missing. Enter the absolute MWh from each source's invoice or meter, not MWh per tonne — and 0 only if the plant genuinely drew nothing.",
      });
    }
    if (awaitingGridFactor) {
      issues.push({
        severity: "error",
        field: "electricityFactor",
        message: "A grid source is recorded but the Commission has not yet published a country default for this installation's country — this cannot be entered manually. The month cannot be submitted with a grid factor missing.",
      });
    }
    for (const s of entry.electricitySources) {
      if (s.mwh > 0 && (s.sourceType === "ppa" || s.sourceType === "direct_technical_link") && !(s.factorTco2PerMwh != null && s.factorTco2PerMwh > 0)) {
        issues.push({
          severity: "error",
          field: "electricityFactor",
          message: `${ELECTRICITY_FACTOR_SOURCE_LABEL[s.sourceType]} source has MWh recorded but no emission factor — enter the contracted generator's own figure.`,
        });
      }
    }
  } else {
    if (!(entry.electricityMwh > 0)) {
      issues.push({
        severity: "error",
        field: "electricity",
        message: "Electricity consumed this month is missing. Enter the absolute MWh from the invoice, not MWh per tonne — and 0 only if the plant genuinely drew nothing.",
      });
    } else if (!(entry.electricityFactorTco2PerMwh > 0)) {
      issues.push({
        severity: "error",
        field: "electricityFactor",
        message: "Electricity is recorded without an emission factor in tCO₂/MWh.",
      });
    }

    /* GRID SUPPLY CARRIES THE GRID FACTOR. If the row says grid and the number
       is not the published one, one of the two is wrong — and the case that
       matters runs the other way: a plant that switched to self-generation and
       left the grid figure behind is reporting somebody else's carbon.
       Legacy single-source records only — a source-list record is checked
       per row above instead. */
    const expectedGrid = electricityFactorFor(entry.electricityFactorSource);
    if (expectedGrid != null && entry.electricityMwh > 0 && Math.abs(entry.electricityFactorTco2PerMwh - expectedGrid) > 1e-6) {
      issues.push({
        severity: "error",
        field: "electricityFactor",
        message: `Grid supply takes the published country default — ${expectedGrid} tCO₂/MWh. Change the source if this power does not come from the grid.`,
      });
    }
    if (expectedGrid == null && entry.electricityFactorSource === "grid_default" && entry.electricityMwh > 0) {
      issues.push({
        severity: "error",
        field: "electricityFactor",
        message: "Grid supply is recorded but the Commission has not yet published a country default for this installation's country — this cannot be entered manually. The month cannot be submitted with a grid factor missing.",
      });
    }
    if (entry.electricityFactorSource !== "grid_default" && entry.electricityMwh > 0) {
      const gridValue = electricityFactorFor("grid_default");
      if (gridValue != null && Math.abs(entry.electricityFactorTco2PerMwh - gridValue) < 1e-6) {
        issues.push({
          severity: "warn",
          field: "electricityFactor",
          message: `This power is not from the grid, but the factor is still the grid figure of ${gridValue}. Use the generator's own factor, evidenced by the contract or by your on-site generation records.`,
        });
      }
    }
  }

  if (entry.fuels.length === 0) {
    issues.push({
      severity: "warn",
      field: "fuels",
      message: "No fuel recorded for this month. If the installation genuinely burned nothing, say so in the notes — a verifier will ask.",
    });
  }

  const share = entry.selfGeneratedSharePct;
  if (share != null && (share < 0 || share > 100)) {
    issues.push({ severity: "error", field: "selfGenerated", message: "Self-generated share must be between 0 and 100%." });
  }

  return issues;
}

export const monthCanSubmit = (entry: MonthlyEntry): boolean => !monthIssues(entry).some((i) => i.severity === "error");

/* ── Monthly arithmetic (M1–M6 numerators) ──────────────────────
   Everything aggregates monthly first, then divides ONCE. `workspaceSEE` in
   lib/workspace-see.ts owns the division; nothing in this file divides by
   production, because a per-month SEE that looks like a real figure is how
   somebody ends up averaging twelve of them. */

/** Energy of one fuel row, in GJ.

    The NCV arrives in MJ per unit (§2.2) and the canon is GJ, so it is
    divided by 1000 here and handed to Part 1's `toGJ`, which owns the refusal
    to guess a missing value. One conversion, one place, exactly as
    lib/cbam/units.ts requires. Throws UnitError when the NCV is missing. */
export function fuelGJ(f: FuelEntry): number {
  const ncvGjPerUnit = f.unit === "GJ" ? undefined : Number(f.ncvMjPerUnit) / 1000;
  return toGJ(f.quantity, f.unit, ncvGjPerUnit);
}

/** The emission factor actually applied to a row, in tCO₂/GJ.

    Annex II Equation 10: EF = EF_preliminary × (1 − BF). The stored
    `efTco2PerGj` is the PRELIMINARY factor — the Point G value or the lab
    result for the fuel as a whole — and the biomass fraction is what removes
    the part of it that is zero-rated. Clamped to 0–1 so a mistyped 50 (meaning
    50%) cannot turn the row negative. */
export function effectiveEf(f: FuelEntry): number {
  const bf = Math.min(1, Math.max(0, Number(f.biomassFraction) || 0));
  return f.efTco2PerGj * (1 - bf);
}

/** Bug 6 — the ONLY place OF is decided. Conservative default (or unset,
    same thing): 1.0, no evidence needed. Measured: DERIVED from C_ash /
    C_total, never trusted from a typed `oxidationFactor` even if one is
    sitting in storage from before this path existed — a measured claim
    with no C_ash/C_total behind it collapses back to the conservative 1.0
    rather than silently keeping whatever number was last saved. */
export function resolvedOxidationFactor(f: Pick<FuelEntry, "oxidationFactorSource" | "cAsh" | "cTotal">): number {
  if (f.oxidationFactorSource !== "measured") return 1;
  if (!(f.cTotal! > 0) || f.cAsh == null || f.cAsh < 0) return 1;
  const of = 1 - f.cAsh / f.cTotal!;
  return of > 0 && of <= 1 ? of : 1;
}

/** M2 — fuel_CO2_m = Σ_f (qty × NCV / 1000) × EF × (1 − BF) × OF, in tCO₂. */
export function fuelCO2(f: FuelEntry): number {
  return fuelGJ(f) * effectiveEf(f) * resolvedOxidationFactor(f);
}

/** Every fuel row's tCO₂ for one month, plus the month's fuel total. Rows
    that cannot be converted are reported as errors rather than dropped — a
    silently skipped fuel row understates the month. */
export type MonthFuelResult = { id: string; label: string; gj: number; tCO2: number };

export type MonthResult = {
  month: string;
  /** tCO₂ from fuel combustion */
  fuelTCO2: number;
  /** tCO₂ from process sources, as entered */
  processTCO2: number;
  /** fuel + process, tCO₂ */
  directTCO2: number;
  /** tCO₂ from purchased/consumed electricity */
  indirectTCO2: number;
  productionTonnes: number;
  byFuel: MonthFuelResult[];
  /** rows the arithmetic refused — a missing NCV, almost always */
  errors: string[];
  counted: boolean;
};

export function monthResult(entry: MonthlyEntry): MonthResult {
  const byFuel: MonthFuelResult[] = [];
  const errors: string[] = [];
  let fuel = 0;

  for (const f of entry.fuels) {
    try {
      const gj = fuelGJ(f);
      const tCO2 = gj * effectiveEf(f) * resolvedOxidationFactor(f);
      fuel += tCO2;
      byFuel.push({ id: f.id, label: `${fuelTypeLabel(f.fuelType)} (${f.quantity} ${f.unit})`, gj, tCO2 });
    } catch (e) {
      errors.push(e instanceof UnitError ? e.message : `${fuelTypeLabel(f.fuelType)} could not be converted to energy.`);
    }
  }

  const process = entry.processEmissionsTco2 || 0;
  return {
    month: entry.month,
    fuelTCO2: fuel,
    processTCO2: process,
    directTCO2: fuel + process,
    indirectTCO2: (entry.electricityMwh || 0) * (entry.electricityFactorTco2PerMwh || 0),
    productionTonnes: entry.productionTonnes || 0,
    byFuel,
    errors,
    counted: monthCounts(entry),
  };
}

/* ── M1 · Annual production ─────────────────────────────────────
   Σ over months that are submitted or reviewed.

   The coverage fields are not decoration. A caller that reads `tonnes` and
   ignores `complete` is the bug this shape exists to prevent: eleven months
   summed and divided is a smaller denominator, a larger SEE, and a figure
   that looks perfectly plausible right up until a verifier asks for April. */
export type AnnualProduction = {
  tonnes: number;
  /** months that counted */
  monthsCounted: number;
  /** the twelve months of the year, minus the ones that counted */
  missingMonths: string[];
  complete: boolean;
};

export function annualProductionFor(workspace: Pick<VerificationWorkspace, "id" | "year">): AnnualProduction {
  const months = monthsForWorkspace(workspace);
  const counted = months.filter(monthCounts);
  return {
    tonnes: counted.reduce((a, m) => a + (m.productionTonnes || 0), 0),
    monthsCounted: counted.length,
    missingMonths: months.filter((m) => !monthCounts(m)).map((m) => m.month),
    complete: counted.length === 12,
  };
}

/** The bare tonnage, for callers that have already handled incompleteness.
    Returns null rather than 0 when nothing has been submitted — the
    difference between "no production" and "not entered yet". */
export function annualProductionTonnes(workspace: Pick<VerificationWorkspace, "id" | "year">): number | null {
  const p = annualProductionFor(workspace);
  return p.tonnes > 0 ? p.tonnes : null;
}

/** Progress copy for the dashboard subtitle: "12 of 12 months submitted". */
export const monthsSubmittedLabel = (workspace: Pick<VerificationWorkspace, "id" | "year">): string => {
  const p = annualProductionFor(workspace);
  return `${p.monthsCounted} of 12 months submitted`;
};

/** Every month with a hard error — the Monthly Data tab is BLOCKED, not
    merely incomplete, when this is non-empty (§4, per-tab rules). */
export function blockedMonths(workspace: Pick<VerificationWorkspace, "id" | "year">): { month: string; issues: MonthIssue[] }[] {
  return monthsForWorkspace(workspace)
    .filter((m) => m.status !== "empty")
    .map((m) => ({ month: m.month, issues: monthIssues(m).filter((i) => i.severity === "error") }))
    .filter((r) => r.issues.length > 0);
}

/** A fuel row anywhere in the year with a quantity but no NCV. §4 names this
    exact condition as what BLOCKS the Monthly Data tab. */
export function monthsMissingNcv(workspace: Pick<VerificationWorkspace, "id" | "year">): string[] {
  return monthsForWorkspace(workspace)
    .filter((m) => m.fuels.some((f) => f.quantity > 0 && f.unit !== "GJ" && !(Number(f.ncvMjPerUnit) > 0)))
    .map((m) => m.month);
}

/* ── Indicative monthly SEE ─────────────────────────────────────
   Shown in the UI as a TREND ONLY, and labelled as such everywhere it
   appears. Σ(emissions)/Σ(production) ≠ mean(monthly SEE) whenever monthly
   production varies, which it always does — so this number must never reach
   a filing, a total, or a verifier pack. It exists to make a bad month
   visible, nothing else. */
export function indicativeMonthlySEE(entry: MonthlyEntry): number | null {
  const r = monthResult(entry);
  if (!(r.productionTonnes > 0)) return null;
  return (r.directTCO2 + r.indirectTCO2) / r.productionTonnes;
}

