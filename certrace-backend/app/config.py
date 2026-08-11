"""Runtime configuration and stable application constants."""

from __future__ import annotations

import os
from pathlib import Path

CORS_ALLOWED_ORIGINS_ENV = "CERTRACE_CORS_ALLOWED_ORIGINS"
DATABASE_URL_ENV = "DATABASE_URL"
DATABASE_POOL_SIZE_ENV = "DATABASE_POOL_SIZE"
DATABASE_MAX_OVERFLOW_ENV = "DATABASE_MAX_OVERFLOW"
ENABLE_API_DOCS_ENV = "CERTRACE_ENABLE_API_DOCS"
REQUIRE_DATABASE_ENV = "CERTRACE_REQUIRE_DATABASE"
SERVICE_NAME = "certrace-backend"
REGULATORY_DATA_VERSION = "EU-CBAM-2026.1"


def load_nonnegative_int(name: str, default: int) -> int:
    """Load a bounded database-pool setting from the environment."""

    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    try:
        value = int(raw_value)
    except ValueError as exc:
        raise ValueError(f"{name} must be an integer.") from exc
    if value < 0:
        raise ValueError(f"{name} must be zero or greater.")
    return value


def load_positive_int(name: str, default: int) -> int:
    value = load_nonnegative_int(name, default)
    if value == 0:
        raise ValueError(f"{name} must be greater than zero.")
    return value


def load_bool(name: str, default: bool) -> bool:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    normalized = raw_value.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    raise ValueError(f"{name} must be a boolean.")


def load_env_file_value(name: str, env_path: Path | None = None) -> str | None:
    """Read one simple KEY=VALUE entry without echoing secrets or adding deps."""

    if os.getenv(name):
        return os.getenv(name)

    path = env_path or Path(__file__).parents[1] / ".env"
    if not path.exists():
        return None

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        if key.strip() == name:
            return value.strip().strip('"').strip("'")
    return None
