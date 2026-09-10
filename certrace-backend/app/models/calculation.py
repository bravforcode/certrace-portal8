"""Pydantic request models for calculation and declaration APIs."""

from __future__ import annotations

from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

UnitCode = Literal[
    "TNE",
    "TCO2E",
    "TCO2E_PER_TNE",
    "MWH",
    "TCO2E_PER_MWH",
    "FRACTION",
    # Fuel is invoiced in volume or mass and its emission factor is published
    # per unit of ENERGY, so the two only meet through a net calorific value.
    # Reading 0.0561 tCO2/GJ as tCO2/m3 overstates a gas row by roughly 25x,
    # which is why the conversion is named here rather than done by a caller.
    # The mirror of these units is FuelUnit in certrace-portal/lib/cbam/units.ts.
    "GJ",
    "TCO2E_PER_GJ",
    "MTQ",
    "KGM",
    "LTR",
    "GJ_PER_TNE",
    "GJ_PER_MTQ",
    "GJ_PER_KGM",
    "GJ_PER_LTR",
    # Tonnes of a precursor per tonne of its PARENT's output. Top-level
    # precursors arrive as absolute tonnes; everything deeper in the tree is a
    # ratio, because a tier states what it consumes per tonne of what it makes.
    "TNE_PER_TNE",
    "KGM_CF4_PER_TNE_AL_PER_AEM",
    "KGM_CF4_PER_TNE_AL_PER_MILLIVOLT",
    "TNE_C2F6_PER_TNE_CF4",
    "AEM_MIN_PER_CELL_DAY",
    "MILLIVOLT",
]
Sector = Literal["IRON_STEEL", "ALUMINIUM"]
Route = Literal[
    "BF_BOF", "EAF", "DRI_EAF", "PRIMARY_HALL_HEROULT", "SECONDARY_ALUMINIUM_REMELT"
]
PrecursorMethod = Literal["ACTUAL", "DEFAULT", "SCRAP"]


class MeasuredValue(BaseModel):
    model_config = ConfigDict(extra="forbid")
    value: str | int | float | Decimal
    unit: UnitCode


class SourceStreamInput(BaseModel):
    """One combustion or process source stream.

    Two shapes are accepted and they are not interchangeable:

      MASS      activity in TNE with an emission factor in TCO2E_PER_TNE, and
                no calorific value. The original shape, unchanged.
      ENERGY    activity in GJ, or in TNE/MTQ/KGM/LTR together with a
                ``net_calorific_value`` in GJ per that same unit, with an
                emission factor in TCO2E_PER_GJ.

    A quantity in volume or mass with no calorific value is refused rather
    than converted with a standard value: substituting one would put the
    assumption that most often moves the answer outside the audit trace.
    """

    model_config = ConfigDict(extra="forbid")
    id: str = Field(min_length=1)
    activity: MeasuredValue
    emission_factor: MeasuredValue
    net_calorific_value: MeasuredValue | None = None
    oxidation_factor: MeasuredValue | None = None
    conversion_factor: MeasuredValue | None = None
    evidence_reference: str | None = None


class ProcessEmissionInput(BaseModel):
    """Mass balance over a carbon-bearing input: E = mass x carbonContent x 44/12.

    Kept apart from ``SourceStreamInput`` on purpose. The same number could be
    smuggled through a source stream by putting 3.664 in the emission-factor
    field, but the trace would then claim a standard calculation over an
    emission factor when what happened was a mass balance over a carbon
    content -- and the trace is the product here.

    The conversion constant is not an input: it is fixed by EU MRR (EU)
    2018/2066 and stated by the engine, so nobody can file a declaration
    against a private value of 44/12.
    """

    model_config = ConfigDict(extra="forbid")
    id: str = Field(min_length=1)
    mass: MeasuredValue
    carbon_content: MeasuredValue
    evidence_reference: str | None = None


class ElectricityInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    electricity: MeasuredValue
    emission_factor: MeasuredValue
    evidence_reference: str | None = None


class AluminiumPfcInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    method: Literal["SLOPE", "OVERVOLTAGE"]
    primary_aluminium_production: MeasuredValue
    c2f6_to_cf4_weight_fraction: MeasuredValue
    collection_efficiency: MeasuredValue
    anode_effect_minutes_per_cell_day: MeasuredValue | None = None
    cf4_slope_emission_factor: MeasuredValue | None = None
    anode_effect_overvoltage: MeasuredValue | None = None
    current_efficiency: MeasuredValue | None = None
    cf4_overvoltage_coefficient: MeasuredValue | None = None
    evidence_reference: str | None = None


class PrecursorInput(BaseModel):
    """One precursor, and everything that went into it.

    ``quantity`` is absolute tonnes at the top level and TNE_PER_TNE below it:
    a tier states what it consumes per tonne of what it makes, which is how
    the EU template expresses a bill of materials.

    ``own_process_specific_emissions`` is what THIS tier emitted itself -- its
    furnace, its reheat -- as opposed to what it carried in from its children.
    A node with children ignores its declared or default figure entirely and
    resolves to own process plus the tiers below it, matching
    ``seeForNode`` in certrace-portal/lib/cbam/precursor-tree.ts.
    """

    model_config = ConfigDict(extra="forbid")
    id: str = Field(min_length=1)
    method: PrecursorMethod
    quantity: MeasuredValue
    cn_code: str | None = None
    country_of_origin: str | None = None
    actual_specific_embedded_emissions: MeasuredValue | None = None
    own_process_specific_emissions: MeasuredValue | None = None
    default_year: int | None = None
    evidence_reference: str | None = None
    children: list["PrecursorInput"] = Field(default_factory=list)


class CalculationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    trace_id: str = Field(default="calculation")
    reporting_year: int = Field(default=2026, ge=2024, le=2030)
    sector: Sector
    route: Route
    production: MeasuredValue
    source_streams: list[SourceStreamInput] = Field(default_factory=list)
    process_emissions: list[ProcessEmissionInput] = Field(default_factory=list)
    electricity: ElectricityInput | None = None
    aluminium_pfc: AluminiumPfcInput | None = None
    precursors: list[PrecursorInput] = Field(default_factory=list)


class DeclarationInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    declarant_name: str = Field(min_length=1)
    cn_code: str = Field(min_length=8, max_length=8)
    reporting_year: int = Field(ge=2024, le=2030)
    calculation: CalculationRequest
