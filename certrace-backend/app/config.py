"""Runtime configuration and stable application constants."""

from __future__ import annotations

import os
from pathlib import Path

CORS_ALLOWED_ORIGINS_ENV = "CERTRACE_CORS_ALLOWED_ORIGINS"
DATABASE_URL_ENV = "DATABASE_URL"
SERVICE_NAME = "certrace-backend"
REGULATORY_DATA_VERSION = "EU-CBAM-2026.1"


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
