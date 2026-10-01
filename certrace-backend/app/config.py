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

# Outbound email. The API key keeps Resend's own name because the same secret
# already drives the outreach script at the repository root -- two names for
# one credential is how a rotation ends up half-done.
RESEND_API_KEY_ENV = "RESEND_API_KEY"
EMAIL_DELIVERY_ENV = "CERTRACE_EMAIL_DELIVERY"
EMAIL_SENDER_ENV = "CERTRACE_EMAIL_SENDER"
EMAIL_REPLY_TO_ENV = "CERTRACE_EMAIL_REPLY_TO"
EMAIL_LOGO_URL_ENV = "CERTRACE_EMAIL_LOGO_URL"
APP_BASE_URL_ENV = "CERTRACE_APP_BASE_URL"

# Where a recipient is told to write when a security email surprises them.
# The same mailbox the brand's verified Resend domain already sends from.
JWT_SECRET_ENV = "CERTRACE_JWT_SECRET"

# The OAuth client id of the portal's "Sign in with Google". Public, not a
# secret: it is in every sign-in URL the browser opens. But it is the audience
# every Google ID token must name, so it has to be the one the portal uses.
# Unset means Sign in with Google answers 503.
GOOGLE_CLIENT_ID_ENV = "CERTRACE_GOOGLE_CLIENT_ID"

# Bearer token for /api/internal/jobs/* (app/routers/jobs.py). Unset turns
# those routes off entirely; the daily reminder workflow sends the same value.
JOBS_TOKEN_ENV = "CERTRACE_JOBS_TOKEN"

# Whether Certrace itself writes to suppliers (the data request on first send,
# and the reminder ladder). Off unless exactly "1". Every one of those emails
# links to the portal's monthly form at /w/<token>. That form used to keep what
# the supplier typed in THEIR browser, and mailing a real supplier a form that
# went nowhere, under the exporter's name, was worse than mailing nothing --
# hence the switch. /w/ now saves through the link (portal
# lib/workspace-link-sync.ts), and production runs with this on. It stays a
# switch so staging and local runs never write to a real supplier by accident.
SUPPLIER_EMAILS_ENV = "CERTRACE_SUPPLIER_EMAILS"

# Signing settings are constants, not environment knobs. An operator who can
# lower them by mistake is a way to weaken every token at once, and nothing
# about a deployment needs them to differ.
JWT_ALGORITHM = "HS256"
JWT_ISSUER = "certrace-backend"
# One hour: with /api/auth/refresh in place the access token no longer has to
# carry the whole week, so a stolen one dies within the hour. The seven-day
# session now lives in the refresh token, which — unlike this JWT — is stored
# server-side and can be revoked.
JWT_TTL_HOURS = 1

# How long someone stays signed in without re-entering a password. Each use
# rotates the token, so the week is a ceiling, not a fixed credential's life.
REFRESH_TOKEN_TTL_DAYS = 7

# Default lifetime of a supplier smart link (docs/API-CONTRACT.md §3). Long
# because the holder is a supplier without an account working at their own
# pace; the exporter can shorten it per link via ``expiresInDays``.
SMART_LINK_TTL_DAYS = 60

# Where a minted smart link points. The portal serves /s/<token>; overridden
# by CERTRACE_APP_BASE_URL for staging and local runs.
#
# The default is the live portal. It used to be https://app.certrace.co, a
# host with no DNS record: a deployment that forgot the variable started,
# passed every probe, and minted links nobody could open -- the one setting
# with no error mode. Production is on Render, where nobody could confirm it
# was set, so the safe default is the real one. GET / reports the value in
# use (routers/health.py), so a deployment can be checked from outside.
APP_BASE_URL_DEFAULT = "https://portal.certrace.co"

SUPPORT_EMAIL = "contact@certrace.co"

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
