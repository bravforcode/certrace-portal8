"""Pydantic request models for calculation and declaration APIs."""

from __future__ import annotations

from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

UnitCode = Literal[
    "TNE", "TCO2E", "TCO2E_PER_TNE", "MWH", "TCO2E_PER_MWH", "FRACTION",
    "KGM_CF4_PER_TNE_AL_PER_AEM", "KGM_CF4_PER_TNE_AL_PER_MILLIVOLT",
    "TNE_C2F6_PER_TNE_CF4", "AEM_MIN_PER_CELL_DAY", "MILLIVOLT",
]
Sector = Literal["IRON_STEEL", "ALUMINIUM"]
Route = Literal["BF_BOF", "EAF", "DRI_EAF", "PRIMARY_HALL_HEROULT", "SECONDARY_ALUMINIUM_REMELT"]
PrecursorMethod = Literal["ACTUAL", "DEFAULT", "SCRAP"]


class MeasuredValue(BaseModel):
    model_config = ConfigDict(extra="forbid")
    value: str | int | float | Decimal
    unit: UnitCode


class SourceStreamInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(min_length=1)
    activity: MeasuredValue
    emission_factor: MeasuredValue
    oxidation_factor: MeasuredValue | None = None
    conversion_factor: MeasuredValue | None = None
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
    model_config = ConfigDict(extra="forbid")
    id: str = Field(min_length=1)
    method: PrecursorMethod
    quantity: MeasuredValue
    cn_code: str | None = None
    country_of_origin: str | None = None
    actual_specific_embedded_emissions: MeasuredValue | None = None
    default_year: int | None = None
    evidence_reference: str | None = None


class CalculationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    trace_id: str = Field(default="calculation")
    reporting_year: int = Field(default=2026, ge=2024, le=2030)
    sector: Sector
    route: Route
    production: MeasuredValue
    source_streams: list[SourceStreamInput] = Field(default_factory=list)
    electricity: ElectricityInput | None = None
    aluminium_pfc: AluminiumPfcInput | None = None
    precursors: list[PrecursorInput] = Field(default_factory=list)


class DeclarationInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    declarant_name: str = Field(min_length=1)
    cn_code: str = Field(min_length=8, max_length=8)
    reporting_year: int = Field(ge=2024, le=2030)
    calculation: CalculationRequest
