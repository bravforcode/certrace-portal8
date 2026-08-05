/* Optional server-side cross-check for the supplier portal's plant MRV numbers.

   The browser-local `calculatePlantMrv` stays authoritative for the demo (sync,
   offline, per-keystroke). This module only maps the supplier's entered data to
   the FastAPI engine's `CalculationRequest` (Pydantic, extra="forbid" — keys
   must match exactly) so the reviewer can compare both results on submit. */

import { api } from "./api-client";
import { classifyCnCode, decimal, decimalToString } from "./mrv";
import { parsePlantMrvPayload } from "./plant-mrv";
import { parsePrecursors } from "./precursors";
import { type SupplierRequest, valueKey } from "./supplier";

interface MeasuredValueDto {
  value: string;
  unit: string;
}

interface SourceStreamDto {
  id: string;
  activity: MeasuredValueDto;
  emission_factor: MeasuredValueDto;
  oxidation_factor?: MeasuredValueDto;
  conversion_factor?: MeasuredValueDto;
  evidence_reference?: string;
}

interface ElectricityDto {
  electricity: MeasuredValueDto;
  emission_factor: MeasuredValueDto;
  evidence_reference?: string;
}

interface AluminiumPfcDto {
  method: "SLOPE" | "OVERVOLTAGE";
  primary_aluminium_production: MeasuredValueDto;
  c2f6_to_cf4_weight_fraction: MeasuredValueDto;
  collection_efficiency: MeasuredValueDto;
  anode_effect_minutes_per_cell_day?: MeasuredValueDto;
  cf4_slope_emission_factor?: MeasuredValueDto;
  anode_effect_overvoltage?: MeasuredValueDto;
  current_efficiency?: MeasuredValueDto;
  cf4_overvoltage_coefficient?: MeasuredValueDto;
}

interface PrecursorDto {
  id: string;
  method: "ACTUAL" | "DEFAULT" | "SCRAP";
  quantity: MeasuredValueDto;
  cn_code?: string;
  actual_specific_embedded_emissions?: MeasuredValueDto;
  default_year?: number;
}

export interface CalculationRequest {
  trace_id: string;
  reporting_year?: number;
  sector: "IRON_STEEL" | "ALUMINIUM";
  route: string;
  production: MeasuredValueDto;
  source_streams: SourceStreamDto[];
  electricity?: ElectricityDto;
  aluminium_pfc?: AluminiumPfcDto;
  precursors: PrecursorDto[];
}

export interface CalculationResponse {
  traceId: string;
  directEmissions: MeasuredValueDto;
  indirectEmissions: MeasuredValueDto;
  ownProcessSpecificEmissions: MeasuredValueDto;
  precursorSpecificEmissions: MeasuredValueDto;
  specificEmbeddedEmissions: MeasuredValueDto;
  regulatoryDataVersion: string;
  warnings: { code: string; severity: string; message: string }[];
}

export function calculateMrv(request: CalculationRequest): Promise<CalculationResponse> {
  return api.post<CalculationResponse>("/api/v1/calculate", request);
}

export type ServerCalcPlan = { ok: true; request: CalculationRequest } | { ok: false; reason: string };

/* Supplier portal routes the engine can recompute. SCRAP_EAF is the portal's
   name for the engine's EAF route; the remaining portal routes (sinter, DRI
   production, downstream, …) have no engine equivalent yet. */
const ROUTE_MAP: Record<string, string> = {
  BF_BOF: "BF_BOF",
  SCRAP_EAF: "EAF",
  DRI_EAF: "DRI_EAF",
  PRIMARY_HALL_HEROULT: "PRIMARY_HALL_HEROULT",
  SECONDARY_ALUMINIUM_REMELT: "SECONDARY_ALUMINIUM_REMELT",
};

class NotServerVerifiable extends Error {}

function need(label: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) throw new NotServerVerifiable(`${label} is missing`);
  return trimmed;
}

/* The engine accepts a narrower unit set than the questionnaire; convert the
   trivially convertible units and refuse the rest (GJ/NM3 streams etc.). */
type UnitRule = { unit: string; div?: number };

function toUnit(label: string, mv: { value: string; unit: string }, rules: Record<string, UnitRule>): MeasuredValueDto {
  const value = need(label, mv.value);
  const rule = rules[mv.unit];
  if (!rule) throw new NotServerVerifiable(`${label}: ${mv.unit} has no server-side equivalent yet`);
  return { value: rule.div ? decimalToString(decimal(value).dividedBy(rule.div)) : value, unit: rule.unit };
}

const MASS: Record<string, UnitRule> = { TNE: { unit: "TNE" }, KGM: { unit: "TNE", div: 1000 } };
const FRACTION: Record<string, UnitRule> = { FRACTION: { unit: "FRACTION" }, PERCENT: { unit: "FRACTION", div: 100 } };
const MASS_FACTOR: Record<string, UnitRule> = {
  TCO2E_PER_TNE: { unit: "TCO2E_PER_TNE" },
  KGCO2E_PER_TNE: { unit: "TCO2E_PER_TNE", div: 1000 },
};
const ENERGY: Record<string, UnitRule> = { MWH: { unit: "MWH" }, KWH: { unit: "MWH", div: 1000 } };
/* kgCO2e/kWh is numerically identical to tCO2e/MWh. */
const ENERGY_FACTOR: Record<string, UnitRule> = {
  TCO2E_PER_MWH: { unit: "TCO2E_PER_MWH" },
  KGCO2E_PER_KWH: { unit: "TCO2E_PER_MWH" },
};

export function buildCalculationRequest(
  req: SupplierRequest,
  values: Record<string, string>,
  productId: string,
): ServerCalcPlan {
  try {
    const product = req.products.find((rp) => rp.product.id === productId)?.product;
    if (!product) throw new NotServerVerifiable("Unknown product");
    if (values[valueKey("method", productId)] !== "actual") {
      throw new NotServerVerifiable("Server verify applies when the actual-data method is selected");
    }
    const regulatory = classifyCnCode(product.cnCode);
    if (!regulatory) throw new NotServerVerifiable(`CN ${product.cnCode} is not a classified CBAM good`);
    if (regulatory.sector !== "IRON_STEEL" && regulatory.sector !== "ALUMINIUM")
      throw new NotServerVerifiable(`${regulatory.sector} has no server-side calculation yet`);
    const route = ROUTE_MAP[values[valueKey("process-route", productId)] ?? ""];
    if (!route) throw new NotServerVerifiable("The selected process route has no server-side calculation yet");
    const production = need("Production activity", values[valueKey("production-activity", productId)]);

    const rawMrv = values[valueKey("plant-mrv", productId)];
    if (!rawMrv?.trim()) throw new NotServerVerifiable("No plant MRV data entered yet");
    const payload = parsePlantMrvPayload(rawMrv);
    if (payload.directMethod !== "STANDARD_CALCULATION") {
      throw new NotServerVerifiable("Server verify supports the calculation-based (standard) method only");
    }
    if (payload.measurableHeatInputs.length || payload.chpInputs.length || payload.wasteGasAllocations.length) {
      throw new NotServerVerifiable("Measurable heat, CHP and waste-gas inputs have no server-side equivalent yet");
    }

    const source_streams = payload.standardCalculationSourceStreams.map((row): SourceStreamDto => ({
      id: row.id,
      activity: toUnit(`${row.name} activity`, row.activityData, MASS),
      emission_factor: toUnit(`${row.name} emission factor`, row.emissionFactor, MASS_FACTOR),
      ...(row.oxidationFactor?.value.trim()
        ? { oxidation_factor: toUnit(`${row.name} oxidation factor`, row.oxidationFactor, FRACTION) }
        : {}),
      ...(row.conversionFactor?.value.trim()
        ? { conversion_factor: toUnit(`${row.name} conversion factor`, row.conversionFactor, FRACTION) }
        : {}),
      ...(row.evidenceReferences[0] ? { evidence_reference: row.evidenceReferences[0] } : {}),
    }));

    let electricity: ElectricityDto | undefined;
    if (payload.electricityInputs.length > 1) {
      throw new NotServerVerifiable("Server verify supports a single electricity input");
    }
    const elec = payload.electricityInputs[0];
    if (elec) {
      electricity = {
        electricity: toUnit(`${elec.name} quantity`, elec.quantity, ENERGY),
        emission_factor: toUnit(`${elec.name} emission factor`, elec.emissionFactor, ENERGY_FACTOR),
        ...(elec.evidenceReferences[0] ? { evidence_reference: elec.evidenceReferences[0] } : {}),
      };
    }

    const slope = payload.aluminiumPfcSlopeInputs ?? [];
    const over = payload.aluminiumPfcOvervoltageInputs ?? [];
    if (slope.length + over.length > 1) throw new NotServerVerifiable("Server verify supports a single PFC input");
    let aluminium_pfc: AluminiumPfcDto | undefined;
    if (slope[0]) {
      const row = slope[0];
      aluminium_pfc = {
        method: "SLOPE",
        primary_aluminium_production: toUnit(`${row.name} production`, row.primaryAluminiumProduction, MASS),
        anode_effect_minutes_per_cell_day: passThrough(`${row.name} anode effect minutes`, row.anodeEffectMinutesPerCellDay),
        cf4_slope_emission_factor: passThrough(`${row.name} CF4 slope factor`, row.cf4SlopeEmissionFactor),
        c2f6_to_cf4_weight_fraction: passThrough(`${row.name} C2F6/CF4 fraction`, row.c2f6ToCf4WeightFraction),
        collection_efficiency: toUnit(`${row.name} collection efficiency`, row.collectionEfficiency, FRACTION),
      };
    } else if (over[0]) {
      const row = over[0];
      aluminium_pfc = {
        method: "OVERVOLTAGE",
        primary_aluminium_production: toUnit(`${row.name} production`, row.primaryAluminiumProduction, MASS),
        anode_effect_overvoltage: passThrough(`${row.name} overvoltage`, row.anodeEffectOvervoltage),
        current_efficiency: toUnit(`${row.name} current efficiency`, row.currentEfficiency, FRACTION),
        cf4_overvoltage_coefficient: passThrough(`${row.name} CF4 coefficient`, row.cf4OvervoltageCoefficient),
        c2f6_to_cf4_weight_fraction: passThrough(`${row.name} C2F6/CF4 fraction`, row.c2f6ToCf4WeightFraction),
        collection_efficiency: toUnit(`${row.name} collection efficiency`, row.collectionEfficiency, FRACTION),
      };
    }

    const precursors: PrecursorDto[] = [];
    const rawPrecursors = values[valueKey("precursors", productId)];
    if (rawPrecursors?.trim()) {
      const rows = parsePrecursors(rawPrecursors);
      if (!rows) throw new NotServerVerifiable("Precursor rows are incomplete or malformed");
      rows.forEach((row, index) => {
        /* Portal stores quantity per tonne of output; the engine wants absolute
           tonnes consumed (it divides by production itself). */
        const perTonne = decimal(need(`Precursor ${index + 1} quantity`, row.qty));
        const scaled = row.qtyUnit === "KGM_PER_TNE" ? perTonne.dividedBy(1000) : perTonne;
        const quantity = decimalToString(scaled.times(decimal(production)));
        precursors.push({
          id: row.name.trim() || `precursor-${index + 1}`,
          method: row.method === "actual" ? "ACTUAL" : "DEFAULT",
          quantity: { value: quantity, unit: "TNE" },
          ...(row.cn.trim() ? { cn_code: row.cn.replace(/\s/g, "") } : {}),
          ...(row.method === "actual"
            ? { actual_specific_embedded_emissions: { value: need(`Precursor ${index + 1} emissions`, row.see), unit: "TCO2E_PER_TNE" } }
            : {}),
        });
      });
    }

    const year = /(20\d\d)/.exec(req.period)?.[1];
    return {
      ok: true,
      request: {
        trace_id: productId,
        ...(year ? { reporting_year: Number(year) } : {}),
        sector: regulatory.sector,
        route,
        production: { value: production, unit: "TNE" },
        source_streams,
        ...(electricity ? { electricity } : {}),
        ...(aluminium_pfc ? { aluminium_pfc } : {}),
        precursors,
      },
    };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : "Could not prepare the server request" };
  }
}

function passThrough(label: string, mv: { value: string; unit: string }): MeasuredValueDto {
  return { value: need(label, mv.value), unit: mv.unit };
}

/* Local preview and engine both compute tCO2e/t; tolerate rounding drift only. */
export function emissionsMatch(local: string, server: string): boolean {
  try {
    return decimal(local).minus(decimal(server)).abs().lessThanOrEqualTo(decimal("0.001"));
  } catch {
    return false;
  }
}
