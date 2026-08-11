"""Certrace backend ASGI entry point.

The application factory and domain modules live under ``app/``. This module
keeps the original import and Uvicorn target stable: ``main:app``.
"""

from app.config import (
    DATABASE_URL_ENV,
    ENABLE_API_DOCS_ENV,
    REQUIRE_DATABASE_ENV,
    load_bool,
    load_env_file_value,
)
from app.main import create_app

database_url = load_env_file_value(DATABASE_URL_ENV)
if load_bool(REQUIRE_DATABASE_ENV, False) and not database_url:
    raise RuntimeError("DATABASE_URL is required by CERTRACE_REQUIRE_DATABASE.")

app = create_app(
    database_url=database_url,
    enable_api_docs=load_bool(ENABLE_API_DOCS_ENV, True),
)
