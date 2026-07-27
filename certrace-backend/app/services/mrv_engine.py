"""Sector MRV calculation engine for Certrace."""

from __future__ import annotations

from decimal import ROUND_HALF_EVEN, Decimal, InvalidOperation, getcontext

from app.config import REGULATORY_DATA_VERSION
from app.models.calculation import (
    AluminiumPfcInput,
    CalculationRequest,
    ElectricityInput,
    MeasuredValue,
    PrecursorInput,
    SourceStreamInput,
    UnitCode,
)
from app.services.errors import CalculationError

getcontext().prec = 80
getcontext().rounding = ROUND_HALF_EVEN

GWP_CF4 = Decimal(6630)
GWP_C2F6 = Decimal(11100)
KG_TO_TONNE = Decimal("0.001")

EU_DEFAULT_FACTORS: dict[tuple[str, int], Decimal] = {
    ("72071190", 2026): Decimal("1.10"),
    ("72083900", 2026): Decimal("1.85"),
    ("76011090", 2026): Decimal("8.00"),
    ("76042100", 2026): Decimal("6.50"),
}


def decimal_value(value: str | float | Decimal, field_name: str) -> Decimal:
    try:
        parsed = Decimal(str(value))
    except (InvalidOperation, ValueError) as exc:
        raise CalculationError(
            "INVALID_DECIMAL", f"{field_name} must be a decimal."
        ) from exc
    if not parsed.is_finite():
        raise CalculationError("INVALID_DECIMAL", f"{field_name} must be finite.")
    return parsed


def decimal_to_string(value: Decimal) -> str:
    normalized = value.normalize()
    if normalized == normalized.to_integral():
        return format(normalized.quantize(Decimal(1)), "f")
    return format(normalized, "f")


def require_unit(value: MeasuredValue, unit: UnitCode, field_name: str) -> Decimal:
    if value.unit != unit:
        raise CalculationError("UNIT_MISMATCH", f"{field_name} must use unit {unit}.")
    return decimal_value(value.value, field_name)


def require_non_negative(value: Decimal, field_name: str) -> None:
    if value < 0:
        raise CalculationError("NEGATIVE_VALUE", f"{field_name} cannot be negative.")


def require_positive(value: Decimal, field_name: str) -> None:
    if value <= 0:
        raise CalculationError(
            "NON_POSITIVE_VALUE", f"{field_name} must be greater than zero."
        )


def fraction(
    value: MeasuredValue | None, field_name: str, default: Decimal = Decimal(1)
) -> Decimal:
    if value is None:
        return default
    parsed = require_unit(value, "FRACTION", field_name)
    if parsed < 0 or parsed > 1:
        raise CalculationError(
            "INVALID_FRACTION", f"{field_name} must be between 0 and 1."
        )
    return parsed


def pfc_mass_ratio(value: MeasuredValue, field_name: str) -> Decimal:
    parsed = require_unit(value, "TNE_C2F6_PER_TNE_CF4", field_name)
    if parsed < 0 or parsed > 1:
        raise CalculationError(
            "INVALID_PFC_MASS_RATIO", f"{field_name} must be between 0 and 1."
        )
    return parsed


def measured_input(
    name: str, value: MeasuredValue, source_reference: str | None = None
) -> dict[str, str]:
    item = {
        "name": name,
        "value": decimal_to_string(decimal_value(value.value, name)),
        "unit": value.unit,
    }
    if source_reference:
        item["sourceReference"] = source_reference
    return item


def calculation_trace(
    trace_id: str,
    method: str,
    formula: str,
    exact_inputs: list[dict[str, str]],
    value: Decimal,
    unit: UnitCode,
    warnings: list[dict[str, str]] | None = None,
) -> dict[str, object]:
    output_value = decimal_to_string(value)
    evidence = sorted(
        {
            item["sourceReference"]
            for item in exact_inputs
            if item.get("sourceReference")
        }
    )
    return {
        "id": trace_id,
        "method": method,
        "formula": formula,
        "exactInputs": exact_inputs,
        "output": {"value": output_value, "unit": unit},
        "evidenceReferences": evidence,
        "regulatoryDataVersion": REGULATORY_DATA_VERSION,
        "decimalContext": {"significantDigits": 80, "rounding": "ROUND_HALF_EVEN"},
        "authoritative": True,
        "warnings": warnings or [],
    }


def calculate_source_stream(
    stream: SourceStreamInput,
) -> tuple[Decimal, dict[str, object]]:
    activity = require_unit(stream.activity, "TNE", f"{stream.id}.activity")
    factor_value = require_unit(
        stream.emission_factor, "TCO2E_PER_TNE", f"{stream.id}.emission_factor"
    )
    require_non_negative(activity, f"{stream.id}.activity")
    require_non_negative(factor_value, f"{stream.id}.emission_factor")
    oxidation = fraction(stream.oxidation_factor, f"{stream.id}.oxidation_factor")
    conversion = fraction(stream.conversion_factor, f"{stream.id}.conversion_factor")
    emissions = activity * factor_value * oxidation * conversion
    trace = calculation_trace(
        stream.id,
        "STANDARD_CALCULATION",
        "E = activityData x emissionFactor x oxidationFactor x conversionFactor",
        [
            measured_input("activityData", stream.activity, stream.evidence_reference),
            measured_input(
                "emissionFactor", stream.emission_factor, stream.evidence_reference
            ),
            {
                "name": "oxidationFactor",
                "value": decimal_to_string(oxidation),
                "unit": "FRACTION",
            },
            {
                "name": "conversionFactor",
                "value": decimal_to_string(conversion),
                "unit": "FRACTION",
            },
        ],
        emissions,
        "TCO2E",
    )
    return emissions, trace


def calculate_electricity(
    input_value: ElectricityInput,
) -> tuple[Decimal, dict[str, object]]:
    electricity = require_unit(input_value.electricity, "MWH", "electricity")
    factor_value = require_unit(
        input_value.emission_factor, "TCO2E_PER_MWH", "electricity.emission_factor"
    )
    require_non_negative(electricity, "electricity")
    require_non_negative(factor_value, "electricity.emission_factor")
    emissions = electricity * factor_value
    trace = calculation_trace(
        "electricity",
        "ELECTRICITY",
        "E_indirect = electricityConsumed x applicableElectricityEmissionFactor",
        [
            measured_input(
                "electricityConsumed",
                input_value.electricity,
                input_value.evidence_reference,
            ),
            measured_input(
                "emissionFactor",
                input_value.emission_factor,
                input_value.evidence_reference,
            ),
        ],
        emissions,
        "TCO2E",
    )
    return emissions, trace


def calculate_pfc(input_value: AluminiumPfcInput) -> tuple[Decimal, dict[str, object]]:
    production = require_unit(
        input_value.primary_aluminium_production,
        "TNE",
        "pfc.primary_aluminium_production",
    )
    c2f6_ratio = pfc_mass_ratio(
        input_value.c2f6_to_cf4_weight_fraction, "pfc.c2f6_to_cf4_weight_fraction"
    )
    collection_efficiency = fraction(
        input_value.collection_efficiency, "pfc.collection_efficiency"
    )
    require_non_negative(production, "pfc.primary_aluminium_production")
    require_positive(collection_efficiency, "pfc.collection_efficiency")
    exact_inputs = [
        measured_input(
            "primaryAluminiumProduction", input_value.primary_aluminium_production
        )
    ]

    if input_value.method == "SLOPE":
        if (
            not input_value.anode_effect_minutes_per_cell_day
            or not input_value.cf4_slope_emission_factor
        ):
            raise CalculationError(
                "PFC_INPUT_MISSING",
                "Slope PFC calculation requires anode effect minutes and CF4 slope factor.",
            )
        aem = require_unit(
            input_value.anode_effect_minutes_per_cell_day,
            "AEM_MIN_PER_CELL_DAY",
            "pfc.anode_effect_minutes_per_cell_day",
        )
        slope = require_unit(
            input_value.cf4_slope_emission_factor,
            "KGM_CF4_PER_TNE_AL_PER_AEM",
            "pfc.cf4_slope_emission_factor",
        )
        require_non_negative(aem, "pfc.anode_effect_minutes_per_cell_day")
        require_non_negative(slope, "pfc.cf4_slope_emission_factor")
        duct_cf4 = aem * slope * production * KG_TO_TONNE
        method = "ALUMINIUM_PFC_SLOPE"
        formula = "CF4_duct[t] = AEM x SEF_CF4[kg/t Al/AEM] x production[t] / 1000; PFC_CO2e = CF4_t x 6630 + C2F6_t x 11100"
        exact_inputs.extend(
            [
                measured_input(
                    "anodeEffectMinutesPerCellDay",
                    input_value.anode_effect_minutes_per_cell_day,
                ),
                measured_input(
                    "cf4SlopeEmissionFactor", input_value.cf4_slope_emission_factor
                ),
            ]
        )
    else:
        if (
            not input_value.anode_effect_overvoltage
            or not input_value.current_efficiency
            or not input_value.cf4_overvoltage_coefficient
        ):
            raise CalculationError(
                "PFC_INPUT_MISSING",
                "Overvoltage PFC calculation requires overvoltage, current efficiency, and coefficient.",
            )
        overvoltage = require_unit(
            input_value.anode_effect_overvoltage,
            "MILLIVOLT",
            "pfc.anode_effect_overvoltage",
        )
        efficiency = fraction(input_value.current_efficiency, "pfc.current_efficiency")
        coefficient = require_unit(
            input_value.cf4_overvoltage_coefficient,
            "KGM_CF4_PER_TNE_AL_PER_MILLIVOLT",
            "pfc.cf4_overvoltage_coefficient",
        )
        require_non_negative(overvoltage, "pfc.anode_effect_overvoltage")
        require_positive(efficiency, "pfc.current_efficiency")
        require_non_negative(coefficient, "pfc.cf4_overvoltage_coefficient")
        duct_cf4 = coefficient * (overvoltage / efficiency) * production * KG_TO_TONNE
        method = "ALUMINIUM_PFC_OVERVOLTAGE"
        formula = "CF4_duct[t] = OVC[kg/t Al/mV] x overvoltage[mV] / currentEfficiency x production[t] / 1000; PFC_CO2e = CF4_t x 6630 + C2F6_t x 11100"
        exact_inputs.extend(
            [
                measured_input(
                    "anodeEffectOvervoltage", input_value.anode_effect_overvoltage
                ),
                measured_input("currentEfficiency", input_value.current_efficiency),
                measured_input(
                    "cf4OvervoltageCoefficient", input_value.cf4_overvoltage_coefficient
                ),
            ]
        )

    cf4 = duct_cf4 / collection_efficiency
    c2f6 = duct_cf4 * c2f6_ratio / collection_efficiency
    emissions = cf4 * GWP_CF4 + c2f6 * GWP_C2F6
    exact_inputs.extend(
        [
            measured_input(
                "c2f6ToCf4WeightFraction",
                input_value.c2f6_to_cf4_weight_fraction,
                input_value.evidence_reference,
            ),
            measured_input(
                "collectionEfficiency",
                input_value.collection_efficiency,
                input_value.evidence_reference,
            ),
            {"name": "GWP_CF4", "value": "6630", "unit": "FRACTION"},
            {"name": "GWP_C2F6", "value": "11100", "unit": "FRACTION"},
        ]
    )
    trace = calculation_trace(
        "aluminium-pfc", method, formula, exact_inputs, emissions, "TCO2E"
    )
    trace["cf4Tonnes"] = decimal_to_string(cf4)
    trace["c2f6Tonnes"] = decimal_to_string(c2f6)
    return emissions, trace


def default_factor(
    cn_code: str | None,
    year: int | None,
    country_of_origin: str | None = None,
    factor_lookup=None,
) -> Decimal | None:
    if factor_lookup is not None:
        looked_up = factor_lookup(cn_code, year, country_of_origin)
        if looked_up is not None:
            return looked_up
    if cn_code is None or year is None:
        return None
    normalized = cn_code.replace(" ", "")
    return EU_DEFAULT_FACTORS.get((normalized, year))


def calculate_precursors(
    production: Decimal,
    reporting_year: int,
    precursors: list[PrecursorInput],
    factor_lookup=None,
) -> tuple[Decimal, list[dict[str, object]], list[dict[str, str]], dict[str, object]]:
    contribution = Decimal(0)
    embedded_mass = Decimal(0)
    total_input_mass = Decimal(0)
    scrap_mass = Decimal(0)
    actual_mass = Decimal(0)
    default_mass = Decimal(0)
    traces: list[dict[str, object]] = []
    warnings: list[dict[str, str]] = []
    for precursor in precursors:
        quantity = require_unit(precursor.quantity, "TNE", f"{precursor.id}.quantity")
        require_non_negative(quantity, f"{precursor.id}.quantity")
        total_input_mass += quantity
        exact_inputs = [
            measured_input(
                "quantityConsumed", precursor.quantity, precursor.evidence_reference
            )
        ]
        if precursor.method == "SCRAP":
            scrap_mass += quantity
            specific = Decimal(0)
            method = "SCRAP_ZERO_CARBON"
            formula = "scrapEmbeddedEmissions = 0 tCO2e/t; contribution = quantityConsumed x 0 / goodsProduction"
            warnings.append(
                {
                    "code": f"SCRAP_ZERO_CARBON:{precursor.id}",
                    "severity": "INFO",
                    "message": "Scrap input was assigned zero embedded carbon under the configured mass-balance rule.",
                }
            )
        elif precursor.method == "ACTUAL":
            if not precursor.actual_specific_embedded_emissions:
                raise CalculationError(
                    "ACTUAL_PRECURSOR_VALUE_MISSING",
                    f"{precursor.id} is ACTUAL but has no specific embedded emissions.",
                )
            specific = require_unit(
                precursor.actual_specific_embedded_emissions,
                "TCO2E_PER_TNE",
                f"{precursor.id}.actual_specific_embedded_emissions",
            )
            require_non_negative(
                specific, f"{precursor.id}.actual_specific_embedded_emissions"
            )
            actual_mass += quantity
            exact_inputs.append(
                measured_input(
                    "actualSpecificEmbeddedEmissions",
                    precursor.actual_specific_embedded_emissions,
                )
            )
            method = "ACTUAL_PRECURSOR"
            formula = "contribution = quantityConsumed x actualSpecificEmbeddedEmissions / goodsProduction"
        else:
            factor_year = precursor.default_year or reporting_year
            factor_value = default_factor(
                precursor.cn_code,
                factor_year,
                precursor.country_of_origin,
                factor_lookup,
            )
            if factor_value is None:
                raise CalculationError(
                    "DEFAULT_FACTOR_NOT_FOUND",
                    f"No EU default factor is bundled for {precursor.cn_code or 'unknown CN'} in {factor_year}.",
                )
            specific = factor_value
            default_mass += quantity
            exact_inputs.append(
                {
                    "name": "euDefaultSpecificEmbeddedEmissions",
                    "value": decimal_to_string(factor_value),
                    "unit": "TCO2E_PER_TNE",
                    "sourceReference": f"EU_DEFAULT:{precursor.cn_code}:{precursor.country_of_origin or 'UNSPECIFIED'}:{factor_year}",
                }
            )
            method = "EU_DEFAULT_PRECURSOR"
            formula = "contribution = quantityConsumed x euDefaultSpecificEmbeddedEmissions / goodsProduction"
            warnings.append(
                {
                    "code": f"EU_DEFAULT_USED:{precursor.id}",
                    "severity": "WARNING",
                    "message": "Bundled EU default value was used because no actual precursor value was supplied.",
                }
            )
        value = quantity * specific / production
        embedded_mass += quantity * specific
        contribution += value
        traces.append(
            calculation_trace(
                precursor.id, method, formula, exact_inputs, value, "TCO2E_PER_TNE"
            )
        )
    scrap_ratio = scrap_mass / total_input_mass if total_input_mass else Decimal(0)
    weighted_average = (
        embedded_mass / total_input_mass if total_input_mass else Decimal(0)
    )
    material_mix = {
        "totalInputMass": {"value": decimal_to_string(total_input_mass), "unit": "TNE"},
        "scrapInputMass": {"value": decimal_to_string(scrap_mass), "unit": "TNE"},
        "actualPrecursorMass": {"value": decimal_to_string(actual_mass), "unit": "TNE"},
        "defaultPrecursorMass": {
            "value": decimal_to_string(default_mass),
            "unit": "TNE",
        },
        "scrapRatio": {"value": decimal_to_string(scrap_ratio), "unit": "FRACTION"},
        "weightedAverageEmbeddedEmission": {
            "value": decimal_to_string(weighted_average),
            "unit": "TCO2E_PER_TNE",
        },
        "formula": "weightedAverageEmbeddedEmission = sum(inputMass_i x specificEmbeddedEmission_i) / sum(inputMass_i); scrap specificEmbeddedEmission = 0",
    }
    return contribution, traces, warnings, material_mix


def route_uses_pfc(request: CalculationRequest) -> bool:
    return request.sector == "ALUMINIUM" and request.route == "PRIMARY_HALL_HEROULT"


def route_requirement_warnings(request: CalculationRequest) -> list[dict[str, str]]:
    iron_routes = {"BF_BOF", "EAF", "DRI_EAF"}
    aluminium_routes = {"PRIMARY_HALL_HEROULT", "SECONDARY_ALUMINIUM_REMELT"}
    if request.sector == "IRON_STEEL" and request.route not in iron_routes:
        raise CalculationError(
            "ROUTE_SECTOR_MISMATCH", f"{request.route} is not an iron/steel route."
        )
    if request.sector == "ALUMINIUM" and request.route not in aluminium_routes:
        raise CalculationError(
            "ROUTE_SECTOR_MISMATCH", f"{request.route} is not an aluminium route."
        )

    warnings: list[dict[str, str]] = []
    has_scrap = any(precursor.method == "SCRAP" for precursor in request.precursors)
    has_non_scrap_precursor = any(
        precursor.method != "SCRAP" for precursor in request.precursors
    )

    def blocker(code: str, message: str) -> None:
        warnings.append({"code": code, "severity": "BLOCKER", "message": message})

    if request.route == "BF_BOF" and not request.source_streams:
        blocker(
            "BF_BOF_SOURCE_STREAMS_MISSING",
            "BF-BOF calculations require at least one coke, ore, fuel, or process source stream.",
        )
    if request.route == "EAF":
        if request.electricity is None:
            blocker(
                "EAF_ELECTRICITY_MISSING",
                "EAF calculations require electricity input for the furnace route.",
            )
        if not has_scrap and not has_non_scrap_precursor:
            blocker(
                "EAF_METALLIC_INPUTS_MISSING",
                "EAF calculations require scrap and/or metallic precursor inputs.",
            )
    if request.route == "DRI_EAF":
        if request.electricity is None:
            blocker(
                "DRI_EAF_ELECTRICITY_MISSING",
                "DRI-EAF calculations require EAF electricity input.",
            )
        if not has_non_scrap_precursor:
            blocker(
                "DRI_EAF_DRI_PRECURSOR_MISSING",
                "DRI-EAF calculations require an actual or default DRI/metallic precursor input.",
            )
    if request.route == "PRIMARY_HALL_HEROULT" and request.aluminium_pfc is None:
        blocker(
            "PRIMARY_ALUMINIUM_PFC_MISSING",
            "Primary aluminium calculations require PFC slope or overvoltage inputs.",
        )
    if request.route == "SECONDARY_ALUMINIUM_REMELT" and not has_scrap:
        blocker(
            "SECONDARY_ALUMINIUM_SCRAP_MISSING",
            "Secondary aluminium remelt calculations require scrap input.",
        )
    return warnings


def calculate_mrv(request: CalculationRequest, factor_lookup=None) -> dict[str, object]:
    production = require_unit(request.production, "TNE", "production")
    require_positive(production, "production")
    direct_emissions = Decimal(0)
    indirect_emissions = Decimal(0)
    traces: list[dict[str, object]] = []
    warnings: list[dict[str, str]] = route_requirement_warnings(request)

    for stream in request.source_streams:
        value, trace = calculate_source_stream(stream)
        direct_emissions += value
        traces.append(trace)

    if request.electricity:
        value, trace = calculate_electricity(request.electricity)
        indirect_emissions += value
        traces.append(trace)

    if route_uses_pfc(request) and request.aluminium_pfc is not None:
        value, trace = calculate_pfc(request.aluminium_pfc)
        direct_emissions += value
        traces.append(trace)

    precursor_specific, precursor_traces, precursor_warnings, material_mix = (
        calculate_precursors(
            production,
            request.reporting_year,
            request.precursors,
            factor_lookup,
        )
    )
    traces.extend(precursor_traces)
    warnings.extend(precursor_warnings)

    own_specific = direct_emissions / production
    indirect_specific = indirect_emissions / production
    specific_embedded = own_specific + precursor_specific
    if request.sector == "ALUMINIUM" and request.route != "PRIMARY_HALL_HEROULT":
        specific_embedded += indirect_specific
    elif indirect_emissions:
        warnings.append(
            {
                "code": "INDIRECT_EMISSIONS_RETAINED_NOT_EMBEDDED",
                "severity": "INFO",
                "message": "Indirect emissions are returned in the trace but excluded from embedded emissions for this route.",
            }
        )

    return {
        "traceId": request.trace_id,
        "sector": request.sector,
        "route": request.route,
        "production": {"value": decimal_to_string(production), "unit": "TNE"},
        "directEmissions": {
            "value": decimal_to_string(direct_emissions),
            "unit": "TCO2E",
        },
        "indirectEmissions": {
            "value": decimal_to_string(indirect_emissions),
            "unit": "TCO2E",
        },
        "ownProcessSpecificEmissions": {
            "value": decimal_to_string(own_specific),
            "unit": "TCO2E_PER_TNE",
        },
        "precursorSpecificEmissions": {
            "value": decimal_to_string(precursor_specific),
            "unit": "TCO2E_PER_TNE",
        },
        "specificEmbeddedEmissions": {
            "value": decimal_to_string(specific_embedded),
            "unit": "TCO2E_PER_TNE",
        },
        "materialMix": material_mix,
        "regulatoryDataVersion": REGULATORY_DATA_VERSION,
        "traces": traces,
        "warnings": warnings,
    }
