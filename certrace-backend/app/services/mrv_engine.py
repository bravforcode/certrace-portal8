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
    ProcessEmissionInput,
    SourceStreamInput,
    UnitCode,
)
from app.services.errors import CalculationError

getcontext().prec = 80
getcontext().rounding = ROUND_HALF_EVEN

GWP_CF4 = Decimal(6630)
GWP_C2F6 = Decimal(11100)
KG_TO_TONNE = Decimal("0.001")

# Elemental carbon to CO2. Written "44/12" everywhere as shorthand, but the
# operative constant is the ratio of the actual molar masses, 44.010 / 12.011
# = 3.664, which is what EU MRR (EU) 2018/2066 fixes and what a verifier
# recomputes with. The naive 44/12 = 3.6667 is 0.07% high - nothing, until it
# moves a process line by a tonne and the recomputation no longer ties out.
#
# Not an input. An installation cannot file against a private value of 44/12,
# so the engine states it and puts it in the trace with its source.
CO2_PER_C = Decimal("3.664")
CO2_PER_C_SOURCE = (
    "EU MRR (EU) 2018/2066 - standard conversion factor tCO2 per tC, "
    "from molar masses 44.010 / 12.011"
)

# A fuel quantity reaches energy through a net calorific value expressed in GJ
# per that same unit - never through a standard value this engine picked. The
# mirror of this map is FuelUnit/needsNcv in certrace-portal/lib/cbam/units.ts.
NCV_UNIT_FOR_ACTIVITY: dict[str, UnitCode] = {
    "TNE": "GJ_PER_TNE",
    "MTQ": "GJ_PER_MTQ",
    "KGM": "GJ_PER_KGM",
    "LTR": "GJ_PER_LTR",
}

# Real iron & steel chains are two to four tiers (ore -> pig iron -> billet ->
# rebar). The cap is a guard against a bill of materials mistyped into a loop,
# and mirrors MAX_PRECURSOR_DEPTH in certrace-portal/lib/cbam/reference.ts.
MAX_PRECURSOR_DEPTH = 10

# Annex II to Regulation (EU) 2023/956 lists the sectors whose financial
# obligation covers DIRECT emissions only, because they already receive
# indirect-cost compensation under the EU ETS State-aid framework. Indirect
# emissions are still REPORTED for every good - they just do not reach the
# certificate bill.
#
# The rule is stated once, here, and read only through
# `indirect_is_chargeable`. Scattering it is how one route ends up billing for
# electricity while its neighbour does not - which is exactly what happened
# before: aluminium remelt folded indirect emissions into the same field that
# primary aluminium left them out of.
#
# The mirror of this map on the portal side is INDIRECT_CHARGEABLE in
# certrace-portal/lib/cbam/engine.ts. The two must agree sector for sector.
INDIRECT_CHARGEABLE: dict[str, bool] = {
    "IRON_STEEL": False,
    "ALUMINIUM": False,
}


def indirect_is_chargeable(sector: str) -> bool:
    """Do indirect (electricity) emissions enter the chargeable figure?

    Unknown sectors default to True: a sector absent from Annex II is charged
    on its indirect emissions, so the safe default is to include them rather
    than to silently under-state what a good costs.
    """

    return INDIRECT_CHARGEABLE.get(sector, True)


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
) -> tuple[Decimal, Decimal, dict[str, object]]:
    """One source stream, on either the mass basis or the energy basis.

    Returns (emissions tCO2e, energy content GJ, trace). The energy content is
    zero on the mass path - it is reported so a reader can check a fuel row
    against the meter without re-deriving the conversion this function just
    applied.
    """

    activity_unit = stream.activity.unit
    activity_field = f"{stream.id}.activity"
    factor_field = f"{stream.id}.emission_factor"
    ncv_field = f"{stream.id}.net_calorific_value"
    oxidation = fraction(stream.oxidation_factor, f"{stream.id}.oxidation_factor")
    conversion = fraction(stream.conversion_factor, f"{stream.id}.conversion_factor")

    exact_inputs: list[dict[str, str]] = [
        measured_input("activityData", stream.activity, stream.evidence_reference)
    ]

    if activity_unit == "GJ":
        if stream.net_calorific_value is not None:
            raise CalculationError(
                "CALORIFIC_VALUE_NOT_APPLICABLE",
                f"{stream.id} is already expressed in GJ, so a net calorific "
                "value would be applied to energy a second time.",
            )
        energy = decimal_value(stream.activity.value, activity_field)
        require_non_negative(energy, activity_field)
        factor_value = require_unit(
            stream.emission_factor, "TCO2E_PER_GJ", factor_field
        )
        formula = (
            "E = energyContent x emissionFactor x oxidationFactor x conversionFactor"
        )
    elif stream.net_calorific_value is not None:
        expected_ncv_unit = NCV_UNIT_FOR_ACTIVITY.get(activity_unit)
        if expected_ncv_unit is None:
            raise CalculationError(
                "UNIT_MISMATCH",
                f"{activity_field} must be one of GJ, "
                f"{', '.join(sorted(NCV_UNIT_FOR_ACTIVITY))}.",
            )
        quantity = decimal_value(stream.activity.value, activity_field)
        require_non_negative(quantity, activity_field)
        ncv = require_unit(stream.net_calorific_value, expected_ncv_unit, ncv_field)
        # Zero would silently erase the row rather than fail it, which is the
        # behaviour a missing NCV already refuses.
        require_positive(ncv, ncv_field)
        factor_value = require_unit(
            stream.emission_factor, "TCO2E_PER_GJ", factor_field
        )
        energy = quantity * ncv
        exact_inputs.append(
            measured_input(
                "netCalorificValue",
                stream.net_calorific_value,
                stream.evidence_reference,
            )
        )
        formula = (
            "E = activityData x netCalorificValue x emissionFactor "
            "x oxidationFactor x conversionFactor"
        )
    elif activity_unit == "TNE":
        # The original mass basis: an emission factor already per tonne, with
        # no energy anywhere in the row.
        quantity = require_unit(stream.activity, "TNE", activity_field)
        require_non_negative(quantity, activity_field)
        factor_value = require_unit(
            stream.emission_factor, "TCO2E_PER_TNE", factor_field
        )
        energy = Decimal(0)
        emissions = quantity * factor_value * oxidation * conversion
        exact_inputs.append(
            measured_input(
                "emissionFactor", stream.emission_factor, stream.evidence_reference
            )
        )
        exact_inputs.extend(_factor_inputs(oxidation, conversion))
        require_non_negative(factor_value, factor_field)
        return (
            emissions,
            energy,
            calculation_trace(
                stream.id,
                "STANDARD_CALCULATION",
                "E = activityData x emissionFactor x oxidationFactor x conversionFactor",
                exact_inputs,
                emissions,
                "TCO2E",
            ),
        )
    else:
        raise CalculationError(
            "CALORIFIC_VALUE_REQUIRED",
            f"{activity_field} is in {activity_unit}, which is a quantity and "
            "not energy. Supply net_calorific_value in "
            f"{NCV_UNIT_FOR_ACTIVITY[activity_unit]} from the fuel's spec sheet "
            "or supplier invoice. Certrace will not substitute a standard "
            "value: the wrong calorific value moves the very figure a verifier "
            "recomputes.",
        )

    require_non_negative(factor_value, factor_field)
    emissions = energy * factor_value * oxidation * conversion
    exact_inputs.append(
        measured_input(
            "emissionFactor", stream.emission_factor, stream.evidence_reference
        )
    )
    exact_inputs.extend(_factor_inputs(oxidation, conversion))
    trace = calculation_trace(
        stream.id,
        "STANDARD_CALCULATION",
        formula,
        exact_inputs,
        emissions,
        "TCO2E",
    )
    return emissions, energy, trace


def _factor_inputs(oxidation: Decimal, conversion: Decimal) -> list[dict[str, str]]:
    return [
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
    ]


def calculate_process_emission(
    process: ProcessEmissionInput,
) -> tuple[Decimal, dict[str, object]]:
    """Mass balance over a carbon-bearing input, e.g. a graphite electrode.

    The trace says MASS_BALANCE rather than STANDARD_CALCULATION because that
    is the monitoring methodology the number was produced under, and a
    verifier tests the two differently.
    """

    mass = require_unit(process.mass, "TNE", f"{process.id}.mass")
    require_non_negative(mass, f"{process.id}.mass")
    carbon_content = fraction(
        process.carbon_content, f"{process.id}.carbon_content", default=Decimal(1)
    )
    emissions = mass * carbon_content * CO2_PER_C
    trace = calculation_trace(
        process.id,
        "MASS_BALANCE",
        "E = mass x carbonContent x CO2_PER_C",
        [
            measured_input("mass", process.mass, process.evidence_reference),
            measured_input(
                "carbonContent", process.carbon_content, process.evidence_reference
            ),
            {
                "name": "CO2_PER_C",
                "value": decimal_to_string(CO2_PER_C),
                "unit": "TCO2E_PER_TNE",
                "sourceReference": CO2_PER_C_SOURCE,
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


def _precursor_own_value(
    precursor: PrecursorInput,
    reporting_year: int,
    factor_lookup,
    exact_inputs: list[dict[str, str]],
    warnings: list[dict[str, str]],
) -> tuple[Decimal, str, str]:
    """The figure a LEAF carries: declared, bundled default, or zero for scrap."""

    if precursor.method == "ACTUAL":
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
        exact_inputs.append(
            measured_input(
                "actualSpecificEmbeddedEmissions",
                precursor.actual_specific_embedded_emissions,
            )
        )
        return specific, "ACTUAL_PRECURSOR", "actualSpecificEmbeddedEmissions"

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
    exact_inputs.append(
        {
            "name": "euDefaultSpecificEmbeddedEmissions",
            "value": decimal_to_string(factor_value),
            "unit": "TCO2E_PER_TNE",
            "sourceReference": f"EU_DEFAULT:{precursor.cn_code}:{precursor.country_of_origin or 'UNSPECIFIED'}:{factor_year}",
        }
    )
    warnings.append(
        {
            "code": f"EU_DEFAULT_USED:{precursor.id}",
            "severity": "WARNING",
            "message": "Bundled EU default value was used because no actual precursor value was supplied.",
        }
    )
    return factor_value, "EU_DEFAULT_PRECURSOR", "euDefaultSpecificEmbeddedEmissions"


def _resolve_precursor(
    precursor: PrecursorInput,
    share_of_good: Decimal,
    depth: int,
    ancestry: tuple[str, ...],
    reporting_year: int,
    factor_lookup,
    traces: list[dict[str, object]],
    warnings: list[dict[str, str]],
) -> Decimal:
    """SEE of one node, in tCO2e per tonne of THAT node's output.

        SEE(n) = 0                                    n is scrap
               = declared or bundled default          n is a leaf
               = ownProcess(n) + sum_c [ qty_c x SEE(c) ]   otherwise

    ``share_of_good`` is how many tonnes of this node go into one tonne of the
    finished good, so ``share_of_good x SEE`` is what the node adds to the
    good. It is carried down only to make each node's trace readable: the
    total is summed over the roots alone, because a child's contribution is
    already inside its parent's SEE. Summing every trace would double-count
    the whole tree - the same trap ``precursorSEE`` avoids in
    certrace-portal/lib/cbam/precursor-tree.ts.
    """

    if precursor.id in ancestry:
        raise CalculationError(
            "PRECURSOR_CYCLE",
            f"{precursor.id} appears inside its own supply chain "
            f"({' -> '.join(ancestry + (precursor.id,))}). A precursor cannot "
            "be made from itself.",
        )
    if depth > MAX_PRECURSOR_DEPTH:
        raise CalculationError(
            "PRECURSOR_DEPTH_EXCEEDED",
            f"{precursor.id} is more than {MAX_PRECURSOR_DEPTH} tiers deep. "
            "Real iron & steel chains are two to four; check the bill of "
            "materials for a branch that repeats.",
        )

    exact_inputs: list[dict[str, str]] = [
        measured_input(
            "quantityConsumed", precursor.quantity, precursor.evidence_reference
        )
    ]

    # Scrap first, always: a scrap input carries no embedded emissions under
    # CBAM however carefully something was filled in below it.
    if precursor.method == "SCRAP":
        if precursor.children:
            warnings.append(
                {
                    "code": f"SCRAP_CHILDREN_IGNORED:{precursor.id}",
                    "severity": "WARNING",
                    "message": "Scrap carries zero embedded carbon, so the tiers entered beneath it were not resolved and contribute nothing.",
                }
            )
        warnings.append(
            {
                "code": f"SCRAP_ZERO_CARBON:{precursor.id}",
                "severity": "INFO",
                "message": "Scrap input was assigned zero embedded carbon under the configured mass-balance rule.",
            }
        )
        traces.append(
            calculation_trace(
                precursor.id,
                "SCRAP_ZERO_CARBON",
                "scrapEmbeddedEmissions = 0 tCO2e/t; contribution = quantityConsumed x 0 / goodsProduction",
                exact_inputs,
                Decimal(0),
                "TCO2E_PER_TNE",
            )
        )
        return Decimal(0)

    if not precursor.children:
        specific, method, term = _precursor_own_value(
            precursor, reporting_year, factor_lookup, exact_inputs, warnings
        )
        formula = f"contribution = quantityConsumed x {term} / goodsProduction"
        traces.append(
            calculation_trace(
                precursor.id,
                method,
                formula,
                exact_inputs,
                share_of_good * specific,
                "TCO2E_PER_TNE",
            )
        )
        return specific

    # An internal tier. Its own declared or default figure is superseded by
    # what the tree below it actually says, exactly as the portal does - but
    # said out loud, because a supplier who filled in both deserves to know
    # which one reached the filing.
    if precursor.actual_specific_embedded_emissions is not None:
        warnings.append(
            {
                "code": f"PRECURSOR_DECLARED_VALUE_SUPERSEDED:{precursor.id}",
                "severity": "WARNING",
                "message": "This tier declares its own specific embedded emissions and also carries precursors of its own. The tree below it was used; the declared figure was not.",
            }
        )

    own_process = Decimal(0)
    if precursor.own_process_specific_emissions is not None:
        own_process = require_unit(
            precursor.own_process_specific_emissions,
            "TCO2E_PER_TNE",
            f"{precursor.id}.own_process_specific_emissions",
        )
        require_non_negative(
            own_process, f"{precursor.id}.own_process_specific_emissions"
        )
        exact_inputs.append(
            measured_input(
                "ownProcessSpecificEmissions",
                precursor.own_process_specific_emissions,
            )
        )
    else:
        # Zero is the right answer for a tier that only passes material
        # through, and it keeps a chain entered before this field existed
        # resolving to the number it resolved to yesterday.
        exact_inputs.append(
            {
                "name": "ownProcessSpecificEmissions",
                "value": "0",
                "unit": "TCO2E_PER_TNE",
            }
        )

    specific = own_process
    for child in precursor.children:
        child_ratio = require_unit(
            child.quantity, "TNE_PER_TNE", f"{child.id}.quantity"
        )
        require_non_negative(child_ratio, f"{child.id}.quantity")
        child_specific = _resolve_precursor(
            child,
            share_of_good * child_ratio,
            depth + 1,
            ancestry + (precursor.id,),
            reporting_year,
            factor_lookup,
            traces,
            warnings,
        )
        specific += child_ratio * child_specific

    traces.append(
        calculation_trace(
            precursor.id,
            "PRECURSOR_TREE",
            "SEE = ownProcessSpecificEmissions + sum(childQuantityPerTonne x SEE_child); contribution = quantityConsumed x SEE / goodsProduction",
            exact_inputs,
            share_of_good * specific,
            "TCO2E_PER_TNE",
        )
    )
    return specific


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
        # Top level only: absolute tonnes consumed over the period. Everything
        # deeper is a ratio per tonne of its parent, so it is deliberately not
        # added to any of the masses below - that would be adding a ratio to a
        # weight and calling the sum a weight.
        quantity = require_unit(precursor.quantity, "TNE", f"{precursor.id}.quantity")
        require_non_negative(quantity, f"{precursor.id}.quantity")
        total_input_mass += quantity

        specific = _resolve_precursor(
            precursor,
            quantity / production,
            1,
            (),
            reporting_year,
            factor_lookup,
            traces,
            warnings,
        )

        if precursor.method == "SCRAP":
            scrap_mass += quantity
        elif precursor.children or precursor.method == "ACTUAL":
            actual_mass += quantity
        else:
            default_mass += quantity

        embedded_mass += quantity * specific
        contribution += quantity * specific / production

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
        "basis": "Top-level precursors only. Deeper tiers are ratios per tonne of their parent and are already inside each top-level SEE.",
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
    # Kept apart all the way to the response. They are one number for the
    # declaration and three for the people who have to explain it: fuel is
    # metered by the energy team, process emissions come off procurement
    # records, PFC off cell logs.
    fuel_emissions = Decimal(0)
    fuel_energy = Decimal(0)
    process_emissions = Decimal(0)
    pfc_emissions = Decimal(0)
    traces: list[dict[str, object]] = []
    warnings: list[dict[str, str]] = route_requirement_warnings(request)

    for stream in request.source_streams:
        value, energy, trace = calculate_source_stream(stream)
        fuel_emissions += value
        fuel_energy += energy
        direct_emissions += value
        traces.append(trace)

    for process in request.process_emissions:
        value, trace = calculate_process_emission(process)
        process_emissions += value
        direct_emissions += value
        traces.append(trace)

    if request.electricity:
        value, trace = calculate_electricity(request.electricity)
        indirect_emissions += value
        traces.append(trace)

    if route_uses_pfc(request) and request.aluminium_pfc is not None:
        value, trace = calculate_pfc(request.aluminium_pfc)
        pfc_emissions += value
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

    # Two different numbers that used to be one, and conflating them is the
    # single most expensive mistake available here in either direction:
    #
    #   REPORTED    what the declaration discloses. Always direct + indirect +
    #               precursors - a CBAM declaration states embedded indirect
    #               emissions for every good, Annex II included.
    #   CHARGEABLE  what the certificates are bought against. Indirect drops
    #               out for the Annex II sectors and only for those.
    #
    # They coincide outside Annex II, which is why one field survived this
    # long without anyone noticing it answered two questions.
    reported_specific = own_specific + indirect_specific + precursor_specific
    indirect_counted = indirect_is_chargeable(request.sector)
    chargeable_specific = own_specific + precursor_specific
    if indirect_counted:
        chargeable_specific += indirect_specific
    elif indirect_emissions:
        warnings.append(
            {
                "code": "INDIRECT_EMISSIONS_REPORTED_NOT_CHARGEABLE",
                "severity": "INFO",
                "message": "Indirect emissions are included in the reported embedded emissions and excluded from the chargeable figure, because this sector is listed in Annex II to Regulation (EU) 2023/956.",
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
        # The same total, split the way an installation monitors it. Mirrors
        # DirectResult in certrace-portal/lib/cbam/engine.ts, whose fuel and
        # process fields exist for the same reason.
        "directEmissionsComponents": {
            "fuelCombustion": {
                "value": decimal_to_string(fuel_emissions),
                "unit": "TCO2E",
            },
            "processEmissions": {
                "value": decimal_to_string(process_emissions),
                "unit": "TCO2E",
            },
            "aluminiumPfc": {
                "value": decimal_to_string(pfc_emissions),
                "unit": "TCO2E",
            },
            "fuelEnergyContent": {
                "value": decimal_to_string(fuel_energy),
                "unit": "GJ",
            },
        },
        "indirectEmissions": {
            "value": decimal_to_string(indirect_emissions),
            "unit": "TCO2E",
        },
        "ownProcessSpecificEmissions": {
            "value": decimal_to_string(own_specific),
            "unit": "TCO2E_PER_TNE",
        },
        # The third component, stated rather than left to be inferred by
        # subtracting the other two out of the reported total. A client that
        # has to derive a figure will eventually derive it differently.
        "indirectSpecificEmissions": {
            "value": decimal_to_string(indirect_specific),
            "unit": "TCO2E_PER_TNE",
        },
        "precursorSpecificEmissions": {
            "value": decimal_to_string(precursor_specific),
            "unit": "TCO2E_PER_TNE",
        },
        "reportedSpecificEmbeddedEmissions": {
            "value": decimal_to_string(reported_specific),
            "unit": "TCO2E_PER_TNE",
        },
        "chargeableSpecificEmbeddedEmissions": {
            "value": decimal_to_string(chargeable_specific),
            "unit": "TCO2E_PER_TNE",
        },
        # Retained under its original name and its original meaning - the
        # chargeable figure - so existing callers keep the number they already
        # had. New callers should read one of the two explicit fields above and
        # say which question they are asking.
        "specificEmbeddedEmissions": {
            "value": decimal_to_string(chargeable_specific),
            "unit": "TCO2E_PER_TNE",
        },
        "indirectEmissionsChargeable": indirect_counted,
        "materialMix": material_mix,
        "regulatoryDataVersion": REGULATORY_DATA_VERSION,
        "traces": traces,
        "warnings": warnings,
    }
