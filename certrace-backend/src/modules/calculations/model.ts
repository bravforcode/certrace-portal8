import { t } from "elysia";
const units = [
  "TNE",
  "TCO2E",
  "TCO2E_PER_TNE",
  "MWH",
  "TCO2E_PER_MWH",
  "FRACTION",
  "GJ",
  "TCO2E_PER_GJ",
  "MTQ",
  "KGM",
  "LTR",
  "GJ_PER_TNE",
  "GJ_PER_MTQ",
  "GJ_PER_KGM",
  "GJ_PER_LTR",
  "TNE_PER_TNE",
  "KGM_CF4_PER_TNE_AL_PER_AEM",
  "KGM_CF4_PER_TNE_AL_PER_MILLIVOLT",
  "TNE_C2F6_PER_TNE_CF4",
  "AEM_MIN_PER_CELL_DAY",
  "MILLIVOLT",
] as const;
export const measured = t.Object(
  {
    value: t.Union([t.String({ maxLength: 200 }), t.Number()]),
    unit: t.Union(units.map((v) => t.Literal(v))),
  },
  { additionalProperties: false },
);
const optionalMeasure = t.Optional(t.Nullable(measured));
const evidence = t.Optional(t.Nullable(t.String()));
const source = t.Object(
  {
    id: t.String({ minLength: 1 }),
    activity: measured,
    emission_factor: measured,
    net_calorific_value: optionalMeasure,
    oxidation_factor: optionalMeasure,
    conversion_factor: optionalMeasure,
    evidence_reference: evidence,
  },
  { additionalProperties: false },
);
const process = t.Object(
  {
    id: t.String({ minLength: 1 }),
    mass: measured,
    carbon_content: measured,
    evidence_reference: evidence,
  },
  { additionalProperties: false },
);
const electricity = t.Object(
  {
    electricity: measured,
    emission_factor: measured,
    evidence_reference: evidence,
  },
  { additionalProperties: false },
);
const pfc = t.Object(
  {
    method: t.Union([t.Literal("SLOPE"), t.Literal("OVERVOLTAGE")]),
    primary_aluminium_production: measured,
    c2f6_to_cf4_weight_fraction: measured,
    collection_efficiency: measured,
    anode_effect_minutes_per_cell_day: optionalMeasure,
    cf4_slope_emission_factor: optionalMeasure,
    anode_effect_overvoltage: optionalMeasure,
    current_efficiency: optionalMeasure,
    cf4_overvoltage_coefficient: optionalMeasure,
    evidence_reference: evidence,
  },
  { additionalProperties: false },
);
export const precursor = t.Recursive((Self) =>
  t.Object(
    {
      id: t.String({ minLength: 1 }),
      method: t.Union([
        t.Literal("ACTUAL"),
        t.Literal("DEFAULT"),
        t.Literal("SCRAP"),
      ]),
      quantity: measured,
      cn_code: t.Optional(t.Nullable(t.String())),
      country_of_origin: t.Optional(t.Nullable(t.String())),
      actual_specific_embedded_emissions: optionalMeasure,
      own_process_specific_emissions: optionalMeasure,
      default_year: t.Optional(t.Nullable(t.Integer())),
      evidence_reference: evidence,
      children: t.Optional(t.Array(Self, { maxItems: 1000 })),
    },
    { additionalProperties: false },
  ),
);
export const calculation = t.Object(
  {
    trace_id: t.Optional(t.String()),
    reporting_year: t.Optional(t.Integer({ minimum: 2024, maximum: 2030 })),
    sector: t.Union([t.Literal("IRON_STEEL"), t.Literal("ALUMINIUM")]),
    route: t.Union(
      [
        "BF_BOF",
        "EAF",
        "DRI_EAF",
        "PRIMARY_HALL_HEROULT",
        "SECONDARY_ALUMINIUM_REMELT",
      ].map((v) => t.Literal(v)),
    ),
    production: measured,
    source_streams: t.Optional(t.Array(source, { maxItems: 1000 })),
    process_emissions: t.Optional(t.Array(process, { maxItems: 1000 })),
    electricity: t.Optional(t.Nullable(electricity)),
    aluminium_pfc: t.Optional(t.Nullable(pfc)),
    precursors: t.Optional(t.Array(precursor, { maxItems: 1000 })),
  },
  { additionalProperties: false },
);
export type Measured = typeof measured.static;
export type Calculation = typeof calculation.static;
export type Precursor = typeof precursor.static;
export type Pfc = typeof pfc.static;
