import Decimal from "decimal.js";
import { fail } from "../../lib/errors";
import { db } from "../../lib/db";
import type { Calculation, Measured, Precursor, Pfc } from "./model";
import type { JsonObject } from "../../lib/json";
Decimal.set({
  precision: 80,
  rounding: Decimal.ROUND_HALF_EVEN,
  toExpNeg: -1000,
  toExpPos: 1000,
});
const D = (v: Decimal.Value) => new Decimal(v);
const regulatoryVersion = "EU-CBAM-2026.1";
const ncvUnits: Record<string, string> = {
  TNE: "GJ_PER_TNE",
  MTQ: "GJ_PER_MTQ",
  KGM: "GJ_PER_KGM",
  LTR: "GJ_PER_LTR",
};
const defaults: Record<string, string> = {
  "72071190:2026": "1.10",
  "72083900:2026": "1.85",
  "76011090:2026": "8.00",
  "76042100:2026": "6.50",
};
type Warning = { code: string; severity: string; message: string };
type Input = {
  name: string;
  value: string;
  unit: string;
  sourceReference?: string;
};
function decimal(value: string | number, field: string) {
  let n: Decimal;
  try {
    n = D(value);
  } catch {
    return fail(422, "INVALID_DECIMAL", `${field} must be a decimal.`);
  }
  if (!n.isFinite()) fail(422, "INVALID_DECIMAL", `${field} must be finite.`);
  return n;
}
function unit(m: Measured, expected: string, field: string) {
  if (m.unit !== expected)
    fail(422, "UNIT_MISMATCH", `${field} must use unit ${expected}.`);
  return decimal(m.value, field);
}
function positive(n: Decimal, field: string) {
  if (n.lte(0))
    fail(422, "NON_POSITIVE_VALUE", `${field} must be greater than zero.`);
  return n;
}
function nonnegative(n: Decimal, field: string) {
  if (n.lt(0)) fail(422, "NEGATIVE_VALUE", `${field} cannot be negative.`);
  return n;
}
function fraction(m: Measured | null | undefined, field: string) {
  const n = m ? unit(m, "FRACTION", field) : D(1);
  if (n.lt(0) || n.gt(1))
    fail(422, "INVALID_FRACTION", `${field} must be between 0 and 1.`);
  return n;
}
const input = (name: string, m: Measured, ref?: string | null): Input => ({
  name,
  value: decimal(m.value, name).toFixed(),
  unit: m.unit,
  ...(ref ? { sourceReference: ref } : {}),
});
function trace(
  id: string,
  method: string,
  formula: string,
  exactInputs: Input[],
  value: Decimal,
  unit: string,
): JsonObject {
  return {
    id,
    method,
    formula,
    exactInputs: exactInputs.map((i) => ({ ...i })),
    output: { value: value.toFixed(), unit },
    evidenceReferences: [
      ...new Set(
        exactInputs.flatMap((i) =>
          i.sourceReference ? [i.sourceReference] : [],
        ),
      ),
    ].sort(),
    regulatoryDataVersion: regulatoryVersion,
    decimalContext: { significantDigits: 80, rounding: "ROUND_HALF_EVEN" },
    authoritative: true,
    warnings: [],
  };
}
function source(stream: NonNullable<Calculation["source_streams"]>[number]) {
  const activityField = `${stream.id}.activity`,
    factorField = `${stream.id}.emission_factor`,
    ncvField = `${stream.id}.net_calorific_value`;
  const oxidation = fraction(
      stream.oxidation_factor,
      `${stream.id}.oxidation_factor`,
    ),
    conversion = fraction(
      stream.conversion_factor,
      `${stream.id}.conversion_factor`,
    );
  const inputs = [
    input("activityData", stream.activity, stream.evidence_reference),
  ];
  let energy = D(0),
    basis: Decimal,
    factor: Decimal,
    formula: string;
  if (stream.activity.unit === "GJ") {
    if (stream.net_calorific_value)
      fail(
        422,
        "CALORIFIC_VALUE_NOT_APPLICABLE",
        `${stream.id} is already expressed in GJ.`,
      );
    energy = nonnegative(
      decimal(stream.activity.value, activityField),
      activityField,
    );
    basis = energy;
    factor = unit(stream.emission_factor, "TCO2E_PER_GJ", factorField);
    formula =
      "E = energyContent x emissionFactor x oxidationFactor x conversionFactor";
  } else if (stream.net_calorific_value) {
    const expected = ncvUnits[stream.activity.unit];
    if (!expected)
      fail(422, "UNIT_MISMATCH", `${activityField} must be a fuel quantity.`);
    const quantity = nonnegative(
        decimal(stream.activity.value, activityField),
        activityField,
      ),
      ncv = positive(
        unit(stream.net_calorific_value, expected, ncvField),
        ncvField,
      );
    factor = unit(stream.emission_factor, "TCO2E_PER_GJ", factorField);
    energy = quantity.mul(ncv);
    basis = energy;
    inputs.push(
      input(
        "netCalorificValue",
        stream.net_calorific_value,
        stream.evidence_reference,
      ),
    );
    formula =
      "E = activityData x netCalorificValue x emissionFactor x oxidationFactor x conversionFactor";
  } else if (stream.activity.unit === "TNE") {
    basis = nonnegative(
      unit(stream.activity, "TNE", activityField),
      activityField,
    );
    factor = unit(stream.emission_factor, "TCO2E_PER_TNE", factorField);
    formula =
      "E = activityData x emissionFactor x oxidationFactor x conversionFactor";
  } else
    return fail(
      422,
      "CALORIFIC_VALUE_REQUIRED",
      `${activityField} requires a net calorific value from the fuel specification.`,
    );
  nonnegative(factor, factorField);
  const emissions = basis.mul(factor).mul(oxidation).mul(conversion);
  inputs.push(
    input("emissionFactor", stream.emission_factor, stream.evidence_reference),
    { name: "oxidationFactor", value: oxidation.toFixed(), unit: "FRACTION" },
    { name: "conversionFactor", value: conversion.toFixed(), unit: "FRACTION" },
  );
  return {
    emissions,
    energy,
    trace: trace(
      stream.id,
      "STANDARD_CALCULATION",
      formula,
      inputs,
      emissions,
      "TCO2E",
    ),
  };
}
function pfc(p: Pfc) {
  const production = nonnegative(
    unit(
      p.primary_aluminium_production,
      "TNE",
      "pfc.primary_aluminium_production",
    ),
    "pfc.primary_aluminium_production",
  );
  const ratio = unit(
    p.c2f6_to_cf4_weight_fraction,
    "TNE_C2F6_PER_TNE_CF4",
    "pfc.c2f6_to_cf4_weight_fraction",
  );
  if (ratio.lt(0) || ratio.gt(1))
    fail(
      422,
      "INVALID_PFC_MASS_RATIO",
      "PFC mass ratio must be between 0 and 1.",
    );
  const collection = positive(
    fraction(p.collection_efficiency, "pfc.collection_efficiency"),
    "pfc.collection_efficiency",
  );
  const inputs = [
    input("primaryAluminiumProduction", p.primary_aluminium_production),
  ];
  let duct: Decimal, method: string, formula: string;
  if (p.method === "SLOPE") {
    if (!p.anode_effect_minutes_per_cell_day || !p.cf4_slope_emission_factor)
      return fail(
        422,
        "PFC_INPUT_MISSING",
        "Slope PFC calculation requires anode effect minutes and CF4 slope factor.",
      );
    const aem = nonnegative(
      unit(
        p.anode_effect_minutes_per_cell_day,
        "AEM_MIN_PER_CELL_DAY",
        "pfc.anode_effect_minutes_per_cell_day",
      ),
      "pfc.anode_effect_minutes_per_cell_day",
    );
    const slope = nonnegative(
      unit(
        p.cf4_slope_emission_factor,
        "KGM_CF4_PER_TNE_AL_PER_AEM",
        "pfc.cf4_slope_emission_factor",
      ),
      "pfc.cf4_slope_emission_factor",
    );
    duct = aem.mul(slope).mul(production).mul("0.001");
    method = "ALUMINIUM_PFC_SLOPE";
    formula =
      "CF4_duct[t] = AEM x SEF_CF4[kg/t Al/AEM] x production[t] / 1000; PFC_CO2e = CF4_t x 6630 + C2F6_t x 11100";
    inputs.push(
      input(
        "anodeEffectMinutesPerCellDay",
        p.anode_effect_minutes_per_cell_day,
      ),
      input("cf4SlopeEmissionFactor", p.cf4_slope_emission_factor),
    );
  } else {
    if (
      !p.anode_effect_overvoltage ||
      !p.current_efficiency ||
      !p.cf4_overvoltage_coefficient
    )
      return fail(
        422,
        "PFC_INPUT_MISSING",
        "Overvoltage PFC calculation requires overvoltage, current efficiency, and coefficient.",
      );
    const voltage = nonnegative(
      unit(
        p.anode_effect_overvoltage,
        "MILLIVOLT",
        "pfc.anode_effect_overvoltage",
      ),
      "pfc.anode_effect_overvoltage",
    );
    const efficiency = positive(
      fraction(p.current_efficiency, "pfc.current_efficiency"),
      "pfc.current_efficiency",
    );
    const coefficient = nonnegative(
      unit(
        p.cf4_overvoltage_coefficient,
        "KGM_CF4_PER_TNE_AL_PER_MILLIVOLT",
        "pfc.cf4_overvoltage_coefficient",
      ),
      "pfc.cf4_overvoltage_coefficient",
    );
    duct = coefficient
      .mul(voltage.div(efficiency))
      .mul(production)
      .mul("0.001");
    method = "ALUMINIUM_PFC_OVERVOLTAGE";
    formula =
      "CF4_duct[t] = OVC[kg/t Al/mV] x overvoltage[mV] / currentEfficiency x production[t] / 1000; PFC_CO2e = CF4_t x 6630 + C2F6_t x 11100";
    inputs.push(
      input("anodeEffectOvervoltage", p.anode_effect_overvoltage),
      input("currentEfficiency", p.current_efficiency),
      input("cf4OvervoltageCoefficient", p.cf4_overvoltage_coefficient),
    );
  }
  const cf4 = duct.div(collection),
    c2f6 = duct.mul(ratio).div(collection),
    emissions = cf4.mul(6630).add(c2f6.mul(11100));
  inputs.push(
    input(
      "c2f6ToCf4WeightFraction",
      p.c2f6_to_cf4_weight_fraction,
      p.evidence_reference,
    ),
    input(
      "collectionEfficiency",
      p.collection_efficiency,
      p.evidence_reference,
    ),
    { name: "GWP_CF4", value: "6630", unit: "FRACTION" },
    { name: "GWP_C2F6", value: "11100", unit: "FRACTION" },
  );
  return {
    emissions,
    trace: {
      ...trace("aluminium-pfc", method, formula, inputs, emissions, "TCO2E"),
      cf4Tonnes: cf4.toFixed(),
      c2f6Tonnes: c2f6.toFixed(),
    },
  };
}
export type FactorLookup = (
  cn: string,
  year: number,
  country?: string | null,
) => Promise<Decimal | null>;
export const lookupFactor: FactorLookup = async (cn, year, country) => {
  const rows = await db.default_emission_factors.findMany({
    where: {
      cn_code: cn.replaceAll(" ", ""),
      reporting_year: year,
      country_of_origin: {
        in: [country?.toUpperCase() ?? "UNSPECIFIED", "UNSPECIFIED"],
      },
    },
  });
  const row =
    rows.find((r) => r.country_of_origin === country?.toUpperCase()) ??
    rows.find((r) => r.country_of_origin === "UNSPECIFIED");
  return row ? D(row.specific_embedded_emissions.toString()) : null;
};
async function precursorValue(
  p: Precursor,
  share: Decimal,
  depth: number,
  ancestry: string[],
  year: number,
  lookup: FactorLookup,
  traces: JsonObject[],
  warnings: Warning[],
): Promise<Decimal> {
  if (ancestry.includes(p.id))
    fail(
      422,
      "PRECURSOR_CYCLE",
      `${p.id} appears inside its own supply chain.`,
    );
  if (depth > 10)
    fail(
      422,
      "PRECURSOR_DEPTH_EXCEEDED",
      `${p.id} exceeds ten precursor tiers.`,
    );
  const inputs = [input("quantityConsumed", p.quantity, p.evidence_reference)],
    children = p.children ?? [];
  if (p.method === "SCRAP") {
    if (children.length)
      warnings.push({
        code: `SCRAP_CHILDREN_IGNORED:${p.id}`,
        severity: "WARNING",
        message:
          "Scrap carries zero embedded carbon, so the tiers entered beneath it were not resolved and contribute nothing.",
      });
    warnings.push({
      code: `SCRAP_ZERO_CARBON:${p.id}`,
      severity: "INFO",
      message:
        "Scrap input was assigned zero embedded carbon under the configured mass-balance rule.",
    });
    traces.push(
      trace(
        p.id,
        "SCRAP_ZERO_CARBON",
        "scrapEmbeddedEmissions = 0 tCO2e/t; contribution = quantityConsumed x 0 / goodsProduction",
        inputs,
        D(0),
        "TCO2E_PER_TNE",
      ),
    );
    return D(0);
  }
  let specific: Decimal, method: string, formula: string;
  if (!children.length) {
    if (p.method === "ACTUAL") {
      if (!p.actual_specific_embedded_emissions)
        return fail(
          422,
          "ACTUAL_PRECURSOR_VALUE_MISSING",
          `${p.id} is ACTUAL but has no specific embedded emissions.`,
        );
      specific = nonnegative(
        unit(
          p.actual_specific_embedded_emissions,
          "TCO2E_PER_TNE",
          `${p.id}.actual_specific_embedded_emissions`,
        ),
        `${p.id}.actual_specific_embedded_emissions`,
      );
      inputs.push(
        input(
          "actualSpecificEmbeddedEmissions",
          p.actual_specific_embedded_emissions,
        ),
      );
      method = "ACTUAL_PRECURSOR";
      formula =
        "contribution = quantityConsumed x actualSpecificEmbeddedEmissions / goodsProduction";
    } else {
      const factorYear = p.default_year ?? year,
        fallback = defaults[`${p.cn_code?.replaceAll(" ", "")}:${factorYear}`];
      const value = p.cn_code
        ? await lookup(p.cn_code, factorYear, p.country_of_origin)
        : null;
      if (!value && !fallback)
        return fail(
          422,
          "DEFAULT_FACTOR_NOT_FOUND",
          `No EU default factor is bundled for ${p.cn_code ?? "unknown CN"} in ${factorYear}.`,
        );
      specific = value ?? D(fallback!);
      method = "EU_DEFAULT_PRECURSOR";
      formula =
        "contribution = quantityConsumed x euDefaultSpecificEmbeddedEmissions / goodsProduction";
      inputs.push({
        name: "euDefaultSpecificEmbeddedEmissions",
        value: specific.toFixed(),
        unit: "TCO2E_PER_TNE",
        sourceReference: `EU_DEFAULT:${p.cn_code}:${p.country_of_origin || "UNSPECIFIED"}:${factorYear}`,
      });
      warnings.push({
        code: `EU_DEFAULT_USED:${p.id}`,
        severity: "WARNING",
        message:
          "Bundled EU default value was used because no actual precursor value was supplied.",
      });
    }
  } else {
    if (p.actual_specific_embedded_emissions)
      warnings.push({
        code: `PRECURSOR_DECLARED_VALUE_SUPERSEDED:${p.id}`,
        severity: "WARNING",
        message:
          "This tier declares its own specific embedded emissions and also carries precursors of its own. The tree below it was used; the declared figure was not.",
      });
    specific = p.own_process_specific_emissions
      ? nonnegative(
          unit(
            p.own_process_specific_emissions,
            "TCO2E_PER_TNE",
            `${p.id}.own_process_specific_emissions`,
          ),
          `${p.id}.own_process_specific_emissions`,
        )
      : D(0);
    inputs.push(
      p.own_process_specific_emissions
        ? input("ownProcessSpecificEmissions", p.own_process_specific_emissions)
        : {
            name: "ownProcessSpecificEmissions",
            value: "0",
            unit: "TCO2E_PER_TNE",
          },
    );
    for (const child of children) {
      const ratio = nonnegative(
        unit(child.quantity, "TNE_PER_TNE", `${child.id}.quantity`),
        `${child.id}.quantity`,
      );
      specific = specific.add(
        ratio.mul(
          await precursorValue(
            child,
            share.mul(ratio),
            depth + 1,
            [...ancestry, p.id],
            year,
            lookup,
            traces,
            warnings,
          ),
        ),
      );
    }
    method = "PRECURSOR_TREE";
    formula =
      "SEE = ownProcessSpecificEmissions + sum(childQuantityPerTonne x SEE_child); contribution = quantityConsumed x SEE / goodsProduction";
  }
  traces.push(
    trace(p.id, method, formula, inputs, share.mul(specific), "TCO2E_PER_TNE"),
  );
  return specific;
}
export async function calculate(
  r: Calculation,
  lookup: FactorLookup = lookupFactor,
) {
  const production = positive(
      unit(r.production, "TNE", "production"),
      "production",
    ),
    traces: JsonObject[] = [],
    warnings: Warning[] = [];
  const streams = r.source_streams ?? [],
    processes = r.process_emissions ?? [],
    precursors = r.precursors ?? [];
  if (
    (r.sector === "IRON_STEEL") !==
    ["BF_BOF", "EAF", "DRI_EAF"].includes(r.route)
  )
    fail(
      422,
      "ROUTE_SECTOR_MISMATCH",
      `${r.route} is not a route for ${r.sector}.`,
    );
  const blocker = (code: string, message: string) =>
    warnings.push({ code, severity: "BLOCKER", message });
  if (r.route === "BF_BOF" && !streams.length)
    blocker(
      "BF_BOF_SOURCE_STREAMS_MISSING",
      "BF-BOF calculations require at least one coke, ore, fuel, or process source stream.",
    );
  if (r.route === "EAF") {
    if (!r.electricity)
      blocker(
        "EAF_ELECTRICITY_MISSING",
        "EAF calculations require electricity input for the furnace route.",
      );
    if (!precursors.length)
      blocker(
        "EAF_METALLIC_INPUTS_MISSING",
        "EAF calculations require scrap and/or metallic precursor inputs.",
      );
  }
  if (r.route === "DRI_EAF") {
    if (!r.electricity)
      blocker(
        "DRI_EAF_ELECTRICITY_MISSING",
        "DRI-EAF calculations require EAF electricity input.",
      );
    if (!precursors.some((p) => p.method !== "SCRAP"))
      blocker(
        "DRI_EAF_DRI_PRECURSOR_MISSING",
        "DRI-EAF calculations require an actual or default DRI/metallic precursor input.",
      );
  }
  if (r.route === "PRIMARY_HALL_HEROULT" && !r.aluminium_pfc)
    blocker(
      "PRIMARY_ALUMINIUM_PFC_MISSING",
      "Primary aluminium calculations require PFC slope or overvoltage inputs.",
    );
  if (
    r.route === "SECONDARY_ALUMINIUM_REMELT" &&
    !precursors.some((p) => p.method === "SCRAP")
  )
    blocker(
      "SECONDARY_ALUMINIUM_SCRAP_MISSING",
      "Secondary aluminium remelt calculations require scrap input.",
    );
  let fuel = D(0),
    energy = D(0),
    process = D(0),
    pfcTotal = D(0),
    indirect = D(0),
    contribution = D(0),
    embedded = D(0),
    mass = D(0),
    scrap = D(0),
    actual = D(0),
    defaultMass = D(0);
  for (const s of streams) {
    const x = source(s);
    fuel = fuel.add(x.emissions);
    energy = energy.add(x.energy);
    traces.push(x.trace);
  }
  for (const p of processes) {
    const value = nonnegative(
      unit(p.mass, "TNE", `${p.id}.mass`),
      `${p.id}.mass`,
    )
      .mul(fraction(p.carbon_content, `${p.id}.carbon_content`))
      .mul("3.664");
    process = process.add(value);
    traces.push(
      trace(
        p.id,
        "MASS_BALANCE",
        "E = mass x carbonContent x CO2_PER_C",
        [
          input("mass", p.mass, p.evidence_reference),
          input("carbonContent", p.carbon_content, p.evidence_reference),
          {
            name: "CO2_PER_C",
            value: "3.664",
            unit: "TCO2E_PER_TNE",
            sourceReference:
              "EU MRR (EU) 2018/2066 - standard conversion factor tCO2 per tC, from molar masses 44.010 / 12.011",
          },
        ],
        value,
        "TCO2E",
      ),
    );
  }
  if (r.electricity) {
    const e = r.electricity;
    indirect = nonnegative(
      unit(e.electricity, "MWH", "electricity"),
      "electricity",
    ).mul(
      nonnegative(
        unit(e.emission_factor, "TCO2E_PER_MWH", "electricity.emission_factor"),
        "electricity.emission_factor",
      ),
    );
    traces.push(
      trace(
        "electricity",
        "ELECTRICITY",
        "E_indirect = electricityConsumed x applicableElectricityEmissionFactor",
        [
          input("electricityConsumed", e.electricity, e.evidence_reference),
          input("emissionFactor", e.emission_factor, e.evidence_reference),
        ],
        indirect,
        "TCO2E",
      ),
    );
  }
  if (r.route === "PRIMARY_HALL_HEROULT" && r.aluminium_pfc) {
    const x = pfc(r.aluminium_pfc);
    pfcTotal = x.emissions;
    traces.push(x.trace);
  }
  for (const p of precursors) {
    const qty = nonnegative(
        unit(p.quantity, "TNE", `${p.id}.quantity`),
        `${p.id}.quantity`,
      ),
      specific = await precursorValue(
        p,
        qty.div(production),
        1,
        [],
        r.reporting_year ?? 2026,
        lookup,
        traces,
        warnings,
      );
    mass = mass.add(qty);
    if (p.method === "SCRAP") scrap = scrap.add(qty);
    else if (p.children?.length || p.method === "ACTUAL")
      actual = actual.add(qty);
    else defaultMass = defaultMass.add(qty);
    embedded = embedded.add(qty.mul(specific));
    contribution = contribution.add(qty.mul(specific).div(production));
  }
  const direct = fuel.add(process).add(pfcTotal),
    own = direct.div(production),
    indirectSpecific = indirect.div(production),
    chargeable = own.add(contribution);
  if (!indirect.isZero())
    warnings.push({
      code: "INDIRECT_EMISSIONS_REPORTED_NOT_CHARGEABLE",
      severity: "INFO",
      message:
        "Indirect emissions are included in the reported embedded emissions and excluded from the chargeable figure, because this sector is listed in Annex II to Regulation (EU) 2023/956.",
    });
  const mv = (v: Decimal, unit: string) => ({ value: v.toFixed(), unit }),
    specific = (v: Decimal) => mv(v, "TCO2E_PER_TNE");
  return {
    traceId: r.trace_id ?? "calculation",
    sector: r.sector,
    route: r.route,
    production: mv(production, "TNE"),
    directEmissions: mv(direct, "TCO2E"),
    directEmissionsComponents: {
      fuelCombustion: mv(fuel, "TCO2E"),
      processEmissions: mv(process, "TCO2E"),
      aluminiumPfc: mv(pfcTotal, "TCO2E"),
      fuelEnergyContent: mv(energy, "GJ"),
    },
    indirectEmissions: mv(indirect, "TCO2E"),
    ownProcessSpecificEmissions: specific(own),
    indirectSpecificEmissions: specific(indirectSpecific),
    precursorSpecificEmissions: specific(contribution),
    reportedSpecificEmbeddedEmissions: specific(
      own.add(indirectSpecific).add(contribution),
    ),
    chargeableSpecificEmbeddedEmissions: specific(chargeable),
    specificEmbeddedEmissions: specific(chargeable),
    indirectEmissionsChargeable: false,
    materialMix: {
      totalInputMass: mv(mass, "TNE"),
      scrapInputMass: mv(scrap, "TNE"),
      actualPrecursorMass: mv(actual, "TNE"),
      defaultPrecursorMass: mv(defaultMass, "TNE"),
      scrapRatio: mv(mass.isZero() ? D(0) : scrap.div(mass), "FRACTION"),
      weightedAverageEmbeddedEmission: specific(
        mass.isZero() ? D(0) : embedded.div(mass),
      ),
      formula:
        "weightedAverageEmbeddedEmission = sum(inputMass_i x specificEmbeddedEmission_i) / sum(inputMass_i); scrap specificEmbeddedEmission = 0",
      basis:
        "Top-level precursors only. Deeper tiers are ratios per tonne of their parent and are already inside each top-level SEE.",
    },
    regulatoryDataVersion: regulatoryVersion,
    traces,
    warnings,
  };
}
