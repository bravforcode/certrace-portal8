from __future__ import annotations

from decimal import Decimal

import pytest

from import_default_factors import (
    ImportValidationError,
    canonical_header,
    normalize_country_of_origin,
    parse_default_factor_row,
)


def test_canonical_header_accepts_common_official_export_names() -> None:
    assert canonical_header("CN Code") == "cn_code"
    assert canonical_header("Country of Origin") == "country_of_origin"
    assert canonical_header("Reporting year") == "reporting_year"
    assert (
        canonical_header("Specific embedded emissions") == "specific_embedded_emissions"
    )
    assert canonical_header("Source Reference") == "source_reference"


def test_parse_default_factor_row_normalizes_and_validates_values() -> None:
    row = parse_default_factor_row(
        {
            "cn_code": "72 083900",
            "reporting_year": "2026",
            "country_of_origin": "other countries",
            "sector": "iron_steel",
            "route": "BF_BOF",
            "specific_embedded_emissions": "1.850000",
            "unit": "TCO2E_PER_TNE",
            "source_reference": "EU-2025-2621",
            "regulatory_data_version": "",
            "effective_from": "2026-01-01",
            "effective_to": "2026-12-31",
        },
        2,
        steel_aluminium_only=True,
    )

    assert row.cn_code == "72083900"
    assert row.reporting_year == 2026
    assert row.country_of_origin == "OTHER_COUNTRIES"
    assert row.sector == "IRON_STEEL"
    assert row.specific_embedded_emissions == Decimal("1.850000")
    assert row.regulatory_data_version == "EU-CBAM-2026.1"


def test_missing_country_of_origin_stays_backward_compatible() -> None:
    row = parse_default_factor_row(
        {
            "cn_code": "76011090",
            "reporting_year": "2026",
            "sector": "ALUMINIUM",
            "specific_embedded_emissions": "8",
            "source_reference": "EU-2025-2621",
            "effective_from": "2026-01-01",
        },
        2,
        steel_aluminium_only=True,
    )

    assert row.country_of_origin == "UNSPECIFIED"


def test_country_of_origin_is_normalized_for_stable_upserts() -> None:
    assert normalize_country_of_origin("South Korea") == "SOUTH_KOREA"
    assert normalize_country_of_origin(" other-countries ") == "OTHER_COUNTRIES"


def test_parse_default_factor_row_rejects_out_of_scope_chapter() -> None:
    with pytest.raises(ImportValidationError, match="outside chapters"):
        parse_default_factor_row(
            {
                "cn_code": "28041000",
                "reporting_year": "2026",
                "sector": "IRON_STEEL",
                "specific_embedded_emissions": "1",
                "source_reference": "EU-2025-2621",
                "effective_from": "2026-01-01",
            },
            2,
            steel_aluminium_only=True,
        )


def test_parse_default_factor_row_rejects_negative_factor() -> None:
    with pytest.raises(ImportValidationError, match="non-negative"):
        parse_default_factor_row(
            {
                "cn_code": "76011090",
                "reporting_year": "2026",
                "sector": "ALUMINIUM",
                "specific_embedded_emissions": "-1",
                "source_reference": "EU-2025-2621",
                "effective_from": "2026-01-01",
            },
            2,
            steel_aluminium_only=True,
        )
