from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.config import CORS_ALLOWED_ORIGINS_ENV
from app.core.cors import (
    CorsConfigurationError,
    parse_cors_origins,
    validate_cors_origin,
)
from app.main import create_app

SECURITY_HEADERS = {
    "cache-control": "no-store",
    "content-security-policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    "referrer-policy": "no-referrer",
    "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "cross-origin-opener-policy": "same-origin",
    "cross-origin-resource-policy": "same-origin",
    "x-xss-protection": "0",
}


def assert_security_headers(response) -> None:
    for name, expected in SECURITY_HEADERS.items():
        assert response.headers[name] == expected


def test_liveness_is_observable_without_claiming_readiness(monkeypatch) -> None:
    monkeypatch.delenv(CORS_ALLOWED_ORIGINS_ENV, raising=False)
    client = TestClient(create_app())

    response = client.get("/healthz")

    assert response.status_code == 200
    assert response.json() == {
        "service": "certrace-backend",
        "status": "alive",
        "ready": True,
    }
    assert_security_headers(response)


def test_readiness_reports_configured_backend(monkeypatch) -> None:
    monkeypatch.delenv(CORS_ALLOWED_ORIGINS_ENV, raising=False)
    client = TestClient(create_app())

    response = client.get("/readyz")

    assert response.status_code == 200
    assert response.json() == {
        "service": "certrace-backend",
        "status": "ready",
        "ready": True,
        "databaseConfigured": False,
    }
    assert_security_headers(response)


def test_root_is_truthful_about_service_state(monkeypatch) -> None:
    monkeypatch.delenv(CORS_ALLOWED_ORIGINS_ENV, raising=False)
    client = TestClient(create_app())

    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["ready"] is True


def test_openapi_contract_advertises_calculation_success(monkeypatch) -> None:
    monkeypatch.delenv(CORS_ALLOWED_ORIGINS_ENV, raising=False)
    document = create_app().openapi()

    responses = document["paths"]["/api/v1/calculate"]["post"]["responses"]

    assert "200" in responses


def test_api_documentation_can_be_disabled(monkeypatch) -> None:
    monkeypatch.delenv(CORS_ALLOWED_ORIGINS_ENV, raising=False)
    client = TestClient(create_app(enable_api_docs=False))

    assert client.get("/docs").status_code == 404
    assert client.get("/redoc").status_code == 404
    assert client.get("/openapi.json").status_code == 404


def test_cors_is_absent_by_default(monkeypatch) -> None:
    monkeypatch.delenv(CORS_ALLOWED_ORIGINS_ENV, raising=False)
    # create_app falls back to the developer's local .env; neutralize it here.
    monkeypatch.setattr("app.main.load_env_file_value", lambda name: None)
    client = TestClient(create_app())

    response = client.get("/healthz", headers={"Origin": "https://attacker.example"})
    preflight = client.options(
        "/healthz",
        headers={
            "Origin": "https://attacker.example",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert "access-control-allow-origin" not in response.headers
    assert "access-control-allow-credentials" not in response.headers
    assert "access-control-allow-origin" not in preflight.headers
    assert "access-control-allow-credentials" not in preflight.headers


def test_only_configured_cors_origin_receives_credentials() -> None:
    client = TestClient(
        create_app(
            cors_origins=["https://portal.certrace.com", "http://localhost:3000"]
        )
    )

    allowed = client.options(
        "/api/v1/calculate",
        headers={
            "Origin": "https://portal.certrace.com",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    denied = client.get("/healthz", headers={"Origin": "https://attacker.example"})

    assert allowed.status_code == 200
    assert (
        allowed.headers["access-control-allow-origin"] == "https://portal.certrace.com"
    )
    assert allowed.headers["access-control-allow-credentials"] == "true"
    assert_security_headers(allowed)
    assert "access-control-allow-origin" not in denied.headers


def test_cors_preflight_allows_bearer_authorization_header() -> None:
    client = TestClient(create_app(cors_origins=["https://portal.certrace.com"]))

    response = client.options(
        "/api/v1/declarations",
        headers={
            "Origin": "https://portal.certrace.com",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization",
        },
    )

    assert response.status_code == 200
    assert "Authorization" in response.headers["access-control-allow-headers"]


def test_environment_allowlist_is_trimmed_deduplicated_and_canonicalized(
    monkeypatch,
) -> None:
    monkeypatch.setenv(
        CORS_ALLOWED_ORIGINS_ENV,
        " HTTPS://PORTAL.CERTRACE.COM,https://portal.certrace.com,http://127.0.0.1:3000 ",
    )

    application = create_app()

    assert application.state.cors_origins == (
        "https://portal.certrace.com",
        "http://127.0.0.1:3000",
    )


def test_invalid_environment_configuration_prevents_startup(monkeypatch) -> None:
    monkeypatch.setenv(
        CORS_ALLOWED_ORIGINS_ENV,
        "https://portal.certrace.com,https://*.certrace.com",
    )

    with pytest.raises(CorsConfigurationError):
        create_app()


@pytest.mark.parametrize(
    "origin",
    [
        "*",
        "https://*.certrace.com",
        "ftp://portal.certrace.com",
        "http://portal.certrace.com",
        "https://portal.certrace.com/",
        "https://portal.certrace.com/path",
        "https://portal.certrace.com?query=true",
        "https://portal.certrace.com#fragment",
        "https://user:password@portal.certrace.com",
        "https://portal.certrace.com.evil.example\\@portal.certrace.com",
        "https://portal.certrace.com:99999",
        "https://portal_certrace.com",
        "https://certracé.example",
        "https://2130706433",
        "https://127.1",
        "https://0x7f.0x0.0x0.0x1",
    ],
)
def test_unsafe_or_ambiguous_origins_are_rejected(origin: str) -> None:
    with pytest.raises(CorsConfigurationError):
        validate_cors_origin(origin)


@pytest.mark.parametrize(
    "raw_value",
    [
        "https://portal.certrace.com,",
        ",https://portal.certrace.com",
        "https://portal.certrace.com,,https://admin.certrace.com",
        "https://portal.certrace.com,https://*.certrace.com",
    ],
)
def test_any_invalid_allowlist_entry_fails_the_whole_configuration(
    raw_value: str,
) -> None:
    with pytest.raises(CorsConfigurationError):
        parse_cors_origins(raw_value)


def test_empty_configuration_disables_cors() -> None:
    assert parse_cors_origins(None) == ()
    assert parse_cors_origins("   ") == ()


def test_calculates_bf_bof_with_precursor_and_scrap(monkeypatch) -> None:
    monkeypatch.delenv(CORS_ALLOWED_ORIGINS_ENV, raising=False)
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/calculate",
        json={
            "trace_id": "fixture:bf-bof",
            "sector": "IRON_STEEL",
            "route": "BF_BOF",
            "production": {"value": "100", "unit": "TNE"},
            "source_streams": [
                {
                    "id": "coke",
                    "activity": {"value": "50", "unit": "TNE"},
                    "emission_factor": {"value": "2", "unit": "TCO2E_PER_TNE"},
                    "oxidation_factor": {"value": "0.9", "unit": "FRACTION"},
                }
            ],
            "precursors": [
                {
                    "id": "dri-actual",
                    "method": "ACTUAL",
                    "quantity": {"value": "10", "unit": "TNE"},
                    "actual_specific_embedded_emissions": {
                        "value": "1",
                        "unit": "TCO2E_PER_TNE",
                    },
                },
                {
                    "id": "scrap",
                    "method": "SCRAP",
                    "quantity": {"value": "20", "unit": "TNE"},
                },
            ],
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["directEmissions"] == {"value": "90", "unit": "TCO2E"}
    assert payload["ownProcessSpecificEmissions"] == {
        "value": "0.9",
        "unit": "TCO2E_PER_TNE",
    }
    assert payload["precursorSpecificEmissions"] == {
        "value": "0.1",
        "unit": "TCO2E_PER_TNE",
    }
    assert payload["specificEmbeddedEmissions"] == {
        "value": "1",
        "unit": "TCO2E_PER_TNE",
    }
    assert payload["materialMix"] == {
        "totalInputMass": {"value": "30", "unit": "TNE"},
        "scrapInputMass": {"value": "20", "unit": "TNE"},
        "actualPrecursorMass": {"value": "10", "unit": "TNE"},
        "defaultPrecursorMass": {"value": "0", "unit": "TNE"},
        "scrapRatio": {
            "value": "0.66666666666666666666666666666666666666666666666666666666666666666666666666666667",
            "unit": "FRACTION",
        },
        "weightedAverageEmbeddedEmission": {
            "value": "0.33333333333333333333333333333333333333333333333333333333333333333333333333333333",
            "unit": "TCO2E_PER_TNE",
        },
        "formula": "weightedAverageEmbeddedEmission = sum(inputMass_i x specificEmbeddedEmission_i) / sum(inputMass_i); scrap specificEmbeddedEmission = 0",
    }
    assert payload["warnings"] == [
        {
            "code": "SCRAP_ZERO_CARBON:scrap",
            "severity": "INFO",
            "message": "Scrap input was assigned zero embedded carbon under the configured mass-balance rule.",
        }
    ]
    assert_security_headers(response)


def test_uses_bundled_eu_default_factor_when_actual_precursor_is_absent(
    monkeypatch,
) -> None:
    monkeypatch.delenv(CORS_ALLOWED_ORIGINS_ENV, raising=False)
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/calculate",
        json={
            "trace_id": "fixture:downstream-aluminium",
            "sector": "ALUMINIUM",
            "route": "SECONDARY_ALUMINIUM_REMELT",
            "production": {"value": "100", "unit": "TNE"},
            "precursors": [
                {
                    "id": "unwrought-aluminium",
                    "method": "DEFAULT",
                    "quantity": {"value": "50", "unit": "TNE"},
                    "cn_code": "76011090",
                    "default_year": 2026,
                }
            ],
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["precursorSpecificEmissions"] == {
        "value": "4",
        "unit": "TCO2E_PER_TNE",
    }
    assert payload["specificEmbeddedEmissions"] == {
        "value": "4",
        "unit": "TCO2E_PER_TNE",
    }
    assert "EU_DEFAULT_USED:unwrought-aluminium" in [
        warning["code"] for warning in payload["warnings"]
    ]


def test_calculates_primary_aluminium_pfc_slope(monkeypatch) -> None:
    monkeypatch.delenv(CORS_ALLOWED_ORIGINS_ENV, raising=False)
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/calculate",
        json={
            "trace_id": "fixture:primary-aluminium",
            "sector": "ALUMINIUM",
            "route": "PRIMARY_HALL_HEROULT",
            "production": {"value": "1000", "unit": "TNE"},
            "aluminium_pfc": {
                "method": "SLOPE",
                "primary_aluminium_production": {"value": "1000", "unit": "TNE"},
                "anode_effect_minutes_per_cell_day": {
                    "value": "0.1",
                    "unit": "AEM_MIN_PER_CELL_DAY",
                },
                "cf4_slope_emission_factor": {
                    "value": "0.104",
                    "unit": "KGM_CF4_PER_TNE_AL_PER_AEM",
                },
                "c2f6_to_cf4_weight_fraction": {
                    "value": "0.057",
                    "unit": "TNE_C2F6_PER_TNE_CF4",
                },
                "collection_efficiency": {"value": "1", "unit": "FRACTION"},
            },
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["directEmissions"] == {"value": "75.53208", "unit": "TCO2E"}
    assert payload["specificEmbeddedEmissions"] == {
        "value": "0.07553208",
        "unit": "TCO2E_PER_TNE",
    }
    assert payload["traces"][0]["method"] == "ALUMINIUM_PFC_SLOPE"


def test_eaf_route_reports_missing_route_inputs_as_blockers(monkeypatch) -> None:
    monkeypatch.delenv(CORS_ALLOWED_ORIGINS_ENV, raising=False)
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/calculate",
        json={
            "trace_id": "fixture:eaf:missing-inputs",
            "sector": "IRON_STEEL",
            "route": "EAF",
            "production": {"value": "100", "unit": "TNE"},
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["specificEmbeddedEmissions"] == {
        "value": "0",
        "unit": "TCO2E_PER_TNE",
    }
    assert payload["warnings"] == [
        {
            "code": "EAF_ELECTRICITY_MISSING",
            "severity": "BLOCKER",
            "message": "EAF calculations require electricity input for the furnace route.",
        },
        {
            "code": "EAF_METALLIC_INPUTS_MISSING",
            "severity": "BLOCKER",
            "message": "EAF calculations require scrap and/or metallic precursor inputs.",
        },
    ]


def test_dri_eaf_requires_dri_precursor_and_electricity(monkeypatch) -> None:
    monkeypatch.delenv(CORS_ALLOWED_ORIGINS_ENV, raising=False)
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/calculate",
        json={
            "trace_id": "fixture:dri-eaf:missing-inputs",
            "sector": "IRON_STEEL",
            "route": "DRI_EAF",
            "production": {"value": "100", "unit": "TNE"},
            "precursors": [
                {
                    "id": "scrap",
                    "method": "SCRAP",
                    "quantity": {"value": "25", "unit": "TNE"},
                }
            ],
        },
    )

    assert response.status_code == 200
    codes = [warning["code"] for warning in response.json()["warnings"]]
    assert "DRI_EAF_ELECTRICITY_MISSING" in codes
    assert "DRI_EAF_DRI_PRECURSOR_MISSING" in codes
    assert "SCRAP_ZERO_CARBON:scrap" in codes


def test_secondary_aluminium_requires_scrap_input(monkeypatch) -> None:
    monkeypatch.delenv(CORS_ALLOWED_ORIGINS_ENV, raising=False)
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/calculate",
        json={
            "trace_id": "fixture:secondary-aluminium:missing-scrap",
            "sector": "ALUMINIUM",
            "route": "SECONDARY_ALUMINIUM_REMELT",
            "production": {"value": "100", "unit": "TNE"},
        },
    )

    assert response.status_code == 200
    assert response.json()["warnings"] == [
        {
            "code": "SECONDARY_ALUMINIUM_SCRAP_MISSING",
            "severity": "BLOCKER",
            "message": "Secondary aluminium remelt calculations require scrap input.",
        }
    ]


def test_annex_ii_sectors_report_indirect_emissions_without_charging_for_them(
    monkeypatch,
) -> None:
    """Aluminium remelt used to fold indirect emissions into the same field
    that primary aluminium left them out of, so the two routes of one sector
    answered different questions under one name. Both are Annex II: indirect
    emissions are disclosed and are not charged."""

    monkeypatch.delenv(CORS_ALLOWED_ORIGINS_ENV, raising=False)
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/calculate",
        json={
            "trace_id": "fixture:secondary-aluminium:electricity",
            "sector": "ALUMINIUM",
            "route": "SECONDARY_ALUMINIUM_REMELT",
            "production": {"value": "100", "unit": "TNE"},
            "electricity": {
                "electricity": {"value": "50", "unit": "MWH"},
                "emission_factor": {"value": "0.5", "unit": "TCO2E_PER_MWH"},
            },
            "precursors": [
                {
                    "id": "scrap",
                    "method": "SCRAP",
                    "quantity": {"value": "40", "unit": "TNE"},
                }
            ],
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["indirectEmissions"] == {"value": "25", "unit": "TCO2E"}
    assert payload["reportedSpecificEmbeddedEmissions"] == {
        "value": "0.25",
        "unit": "TCO2E_PER_TNE",
    }
    assert payload["chargeableSpecificEmbeddedEmissions"] == {
        "value": "0",
        "unit": "TCO2E_PER_TNE",
    }
    assert payload["indirectEmissionsChargeable"] is False
    # The legacy field keeps its original meaning - the chargeable figure.
    assert (
        payload["specificEmbeddedEmissions"]
        == (payload["chargeableSpecificEmbeddedEmissions"])
    )
    assert "INDIRECT_EMISSIONS_REPORTED_NOT_CHARGEABLE" in [
        warning["code"] for warning in payload["warnings"]
    ]


def test_iron_steel_applies_the_same_annex_ii_rule_as_aluminium(monkeypatch) -> None:
    monkeypatch.delenv(CORS_ALLOWED_ORIGINS_ENV, raising=False)
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/calculate",
        json={
            "trace_id": "fixture:eaf:reported-vs-chargeable",
            "sector": "IRON_STEEL",
            "route": "EAF",
            "production": {"value": "100", "unit": "TNE"},
            "source_streams": [
                {
                    "id": "electrode",
                    "activity": {"value": "10", "unit": "TNE"},
                    "emission_factor": {"value": "2", "unit": "TCO2E_PER_TNE"},
                }
            ],
            "electricity": {
                "electricity": {"value": "50", "unit": "MWH"},
                "emission_factor": {"value": "0.5", "unit": "TCO2E_PER_MWH"},
            },
            "precursors": [
                {
                    "id": "scrap",
                    "method": "SCRAP",
                    "quantity": {"value": "105", "unit": "TNE"},
                }
            ],
        },
    )

    assert response.status_code == 200
    payload = response.json()
    # own 0.2 + indirect 0.25 + precursor 0 = 0.45 reported; 0.2 chargeable.
    assert payload["reportedSpecificEmbeddedEmissions"] == {
        "value": "0.45",
        "unit": "TCO2E_PER_TNE",
    }
    assert payload["chargeableSpecificEmbeddedEmissions"] == {
        "value": "0.2",
        "unit": "TCO2E_PER_TNE",
    }
    assert payload["indirectEmissionsChargeable"] is False


def test_a_sector_outside_annex_ii_is_charged_on_its_indirect_emissions() -> None:
    """No such sector is exposed by the API yet - the route/sector allowlist
    stops at iron/steel and aluminium. The default still has to be the safe
    one, because the day cement is added, forgetting to charge for its
    electricity understates every good in that sector."""

    from app.services.mrv_engine import indirect_is_chargeable

    assert indirect_is_chargeable("IRON_STEEL") is False
    assert indirect_is_chargeable("ALUMINIUM") is False
    assert indirect_is_chargeable("CEMENT") is True


def test_rejects_route_sector_mismatch(monkeypatch) -> None:
    monkeypatch.delenv(CORS_ALLOWED_ORIGINS_ENV, raising=False)
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/calculate",
        json={
            "trace_id": "fixture:mismatch",
            "sector": "ALUMINIUM",
            "route": "BF_BOF",
            "production": {"value": "100", "unit": "TNE"},
        },
    )

    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "ROUTE_SECTOR_MISMATCH"


def test_invalid_calculation_input_returns_structured_422(monkeypatch) -> None:
    monkeypatch.delenv(CORS_ALLOWED_ORIGINS_ENV, raising=False)
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/calculate",
        json={
            "trace_id": "fixture:invalid",
            "sector": "IRON_STEEL",
            "route": "EAF",
            "production": {"value": "0", "unit": "TNE"},
        },
    )

    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "NON_POSITIVE_VALUE"


def test_declarations_require_a_signed_in_account(monkeypatch) -> None:
    # The CRUD behaviour itself lives in tests/test_declarations_portal.py;
    # this pins the door: the routes exist and answer 401, never data.
    monkeypatch.delenv(CORS_ALLOWED_ORIGINS_ENV, raising=False)
    client = TestClient(create_app())

    assert client.get("/api/v1/declarations").status_code == 401
    assert client.post("/api/v1/declarations", json={"id": "decl-x"}).status_code == 401
