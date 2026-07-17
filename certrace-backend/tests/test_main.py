from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from main import (
    CORS_ALLOWED_ORIGINS_ENV,
    CorsConfigurationError,
    create_app,
    parse_cors_origins,
    validate_cors_origin,
)


SECURITY_HEADERS = {
    "cache-control": "no-store",
    "content-security-policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    "referrer-policy": "no-referrer",
    "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
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
        "ready": False,
    }
    assert_security_headers(response)


@pytest.mark.parametrize("path", ["/readyz", "/api/v1/calculate"])
def test_unconfigured_operations_fail_closed(path: str, monkeypatch) -> None:
    monkeypatch.delenv(CORS_ALLOWED_ORIGINS_ENV, raising=False)
    client = TestClient(create_app())

    response = (
        client.post(path, json={"untrusted": "input"})
        if path.endswith("calculate")
        else client.get(path)
    )

    assert response.status_code == 503
    assert response.json() == {
        "error": {
            "code": "backend_not_configured",
            "message": "The Certrace backend is not configured.",
            "retryable": False,
        }
    }
    assert_security_headers(response)


def test_root_is_truthful_about_service_state(monkeypatch) -> None:
    monkeypatch.delenv(CORS_ALLOWED_ORIGINS_ENV, raising=False)
    client = TestClient(create_app())

    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["status"] == "backend_not_configured"
    assert response.json()["ready"] is False


def test_openapi_contract_does_not_advertise_calculation_success(monkeypatch) -> None:
    monkeypatch.delenv(CORS_ALLOWED_ORIGINS_ENV, raising=False)
    document = create_app().openapi()

    responses = document["paths"]["/api/v1/calculate"]["post"]["responses"]

    assert "503" in responses
    assert "200" not in responses


def test_cors_is_absent_by_default(monkeypatch) -> None:
    monkeypatch.delenv(CORS_ALLOWED_ORIGINS_ENV, raising=False)
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
