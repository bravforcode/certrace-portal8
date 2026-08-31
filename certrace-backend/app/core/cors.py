"""CORS validation and HTTP security middleware."""

from __future__ import annotations

import ipaddress
import re
from urllib.parse import SplitResult, urlsplit

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

_DNS_LABEL = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$")


class CorsConfigurationError(ValueError):
    """Raised when an origin allowlist is malformed or unsafe."""


def _validated_hostname(parts: SplitResult) -> str:
    try:
        hostname, port = parts.hostname, parts.port
    except ValueError as exc:
        raise CorsConfigurationError("CORS origin contains an invalid port.") from exc
    if hostname is None:
        raise CorsConfigurationError("CORS origin must include a host.")
    if (
        not hostname.isascii()
        or "%" in hostname
        or hostname.endswith(".")
        or "*" in hostname
    ):
        raise CorsConfigurationError("CORS origin contains an invalid host name.")
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
        try:
            loopback = ipaddress.ip_address(normalized).is_loopback
        except ValueError:
            loopback = False
        if normalized != "localhost" and not loopback:
            raise CorsConfigurationError(
                "Plain HTTP CORS origins are limited to localhost or loopback addresses."
            )
    host = f"[{normalized}]" if ":" in normalized else normalized
    return f"{host}:{port}" if port is not None else host


def validate_cors_origin(origin: str) -> str:
    if not origin or any(character.isspace() for character in origin):
        raise CorsConfigurationError(
            "CORS origins cannot be empty or contain whitespace."
        )
    if (
        any(ord(character) < 32 or ord(character) == 127 for character in origin)
        or "\\" in origin
    ):
        raise CorsConfigurationError("CORS origin contains invalid characters.")
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
    return f"{scheme}://{_validated_hostname(parts)}"


def parse_cors_origins(raw_value: str | None) -> tuple[str, ...]:
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
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
        response.headers["X-XSS-Protection"] = "0"
        return response
