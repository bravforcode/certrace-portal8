"""Fail-closed HTTP shell for the deferred Certrace backend.

The calculation engine that previously lived here used placeholder factors and
exchange rates.  Keeping that endpoint operational could make a simulated
result look authoritative, so the API deliberately reports that its backend is
not configured until a reviewed calculation service and persistence layer are
available.
"""

from __future__ import annotations

import ipaddress
import os
import re
from collections.abc import Sequence
from urllib.parse import SplitResult, urlsplit

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


CORS_ALLOWED_ORIGINS_ENV = "CERTRACE_CORS_ALLOWED_ORIGINS"
SERVICE_NAME = "certrace-backend"
_DNS_LABEL = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$")


class CorsConfigurationError(ValueError):
    """Raised when an origin allowlist is malformed or unsafe."""


def _validated_hostname(parts: SplitResult) -> str:
    try:
        hostname = parts.hostname
        port = parts.port
    except ValueError as exc:
        raise CorsConfigurationError("CORS origin contains an invalid port.") from exc

    if hostname is None:
        raise CorsConfigurationError("CORS origin must include a host.")
    if not hostname.isascii() or "%" in hostname:
        raise CorsConfigurationError("CORS origin hosts must use canonical ASCII form.")
    if hostname.endswith(".") or "*" in hostname:
        raise CorsConfigurationError(
            "CORS origin hosts cannot be wildcarded or ambiguous."
        )

    normalized = hostname.lower()
    try:
        address = ipaddress.ip_address(normalized)
    except ValueError:
        labels = normalized.split(".")
        looks_like_noncanonical_ip = all(
            label.isdigit() or re.fullmatch(r"0x[0-9a-f]+", label) for label in labels
        )
        if (
            len(normalized) > 253
            or looks_like_noncanonical_ip
            or not all(_DNS_LABEL.fullmatch(label) for label in labels)
        ):
            raise CorsConfigurationError("CORS origin contains an invalid host name.")
    else:
        normalized = address.compressed

    if parts.scheme == "http":
        is_localhost = normalized == "localhost"
        try:
            is_loopback = ipaddress.ip_address(normalized).is_loopback
        except ValueError:
            is_loopback = False
        if not (is_localhost or is_loopback):
            raise CorsConfigurationError(
                "Plain HTTP CORS origins are limited to localhost or loopback addresses."
            )

    host_for_origin = f"[{normalized}]" if ":" in normalized else normalized
    return f"{host_for_origin}:{port}" if port is not None else host_for_origin


def validate_cors_origin(origin: str) -> str:
    """Validate and canonicalize one exact HTTP(S) origin.

    Origins never accept paths, credentials, wildcards, control characters, or
    non-ASCII hostnames. Production origins must use HTTPS; HTTP is available
    only for local development on an exact localhost/loopback host.
    """

    if not origin or any(character.isspace() for character in origin):
        raise CorsConfigurationError(
            "CORS origins cannot be empty or contain whitespace."
        )
    if any(ord(character) < 32 or ord(character) == 127 for character in origin):
        raise CorsConfigurationError("CORS origins cannot contain control characters.")
    if "\\" in origin:
        raise CorsConfigurationError("CORS origins cannot contain backslashes.")

    try:
        parts = urlsplit(origin)
    except ValueError as exc:
        raise CorsConfigurationError("CORS origin is not a valid URL origin.") from exc

    scheme = parts.scheme.lower()
    if scheme not in {"http", "https"}:
        raise CorsConfigurationError("CORS origins must use http or https.")
    if parts.username is not None or parts.password is not None:
        raise CorsConfigurationError("CORS origins cannot include credentials.")
    if parts.path or parts.query or parts.fragment:
        raise CorsConfigurationError(
            "CORS origins cannot include a path, query, or fragment."
        )

    host = _validated_hostname(parts)
    return f"{scheme}://{host}"


def parse_cors_origins(raw_value: str | None) -> tuple[str, ...]:
    """Parse the comma-separated origin allowlist, failing closed on mistakes."""

    if raw_value is None or not raw_value.strip():
        return ()

    entries = raw_value.split(",")
    if any(not entry.strip() for entry in entries):
        raise CorsConfigurationError("CORS origin entries cannot be empty.")

    result: list[str] = []
    for entry in entries:
        canonical = validate_cors_origin(entry.strip())
        if canonical not in result:
            result.append(canonical)
    return tuple(result)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Apply conservative browser and cache controls to every API response."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        response = await call_next(request)
        response.headers["Cache-Control"] = "no-store"
        response.headers["Content-Security-Policy"] = (
            "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
        )
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains; preload"
        )
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        return response


def backend_not_configured_response() -> JSONResponse:
    """Return the stable, non-sensitive unavailable response contract."""

    return JSONResponse(
        status_code=503,
        content={
            "error": {
                "code": "backend_not_configured",
                "message": "The Certrace backend is not configured.",
                "retryable": False,
            }
        },
    )


def create_app(*, cors_origins: Sequence[str] | None = None) -> FastAPI:
    """Build the API using an explicit allowlist or the process environment."""

    configured_origins = (
        tuple(validate_cors_origin(origin) for origin in cors_origins)
        if cors_origins is not None
        else parse_cors_origins(os.getenv(CORS_ALLOWED_ORIGINS_ENV))
    )

    application = FastAPI(
        title="Certrace API",
        description="Fail-closed API shell; calculation and persistence are not configured.",
        version="0.1.0",
        debug=False,
    )
    application.state.backend_configured = False
    application.state.cors_origins = configured_origins

    if configured_origins:
        application.add_middleware(
            CORSMiddleware,
            allow_origins=list(configured_origins),
            allow_credentials=True,
            allow_methods=["GET", "POST", "OPTIONS"],
            allow_headers=["Accept", "Content-Type"],
            max_age=600,
        )

    # Added after CORS so even middleware-generated preflight responses receive
    # the API's security headers.
    application.add_middleware(SecurityHeadersMiddleware)

    @application.get("/", include_in_schema=False)
    async def service_status() -> dict[str, object]:
        return {
            "service": SERVICE_NAME,
            "status": "backend_not_configured",
            "ready": False,
        }

    @application.get("/healthz")
    async def health() -> dict[str, object]:
        return {
            "service": SERVICE_NAME,
            "status": "alive",
            "ready": False,
        }

    @application.get(
        "/readyz",
        status_code=503,
        responses={503: {"description": "Backend is not configured."}},
    )
    async def readiness() -> JSONResponse:
        return backend_not_configured_response()

    @application.post(
        "/api/v1/calculate",
        status_code=503,
        responses={503: {"description": "Calculation backend is not configured."}},
    )
    async def calculate_unavailable() -> JSONResponse:
        # Intentionally do not parse or calculate from the request body. The
        # reviewed MRV engine and its data dependencies have not been deployed.
        return backend_not_configured_response()

    return application


app = create_app()
