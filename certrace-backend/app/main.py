"""FastAPI application factory and composition root."""

from __future__ import annotations

from collections.abc import Sequence

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import (
    CORS_ALLOWED_ORIGINS_ENV,
    EMAIL_LOGO_URL_ENV,
    load_env_file_value,
)
from app.core.cors import (
    SecurityHeadersMiddleware,
    parse_cors_origins,
    validate_cors_origin,
)
from app.repositories.database import DatabaseRepository
from app.routers import auth, calculations, declarations, health
from app.services.email import EmailTransport, transport_from_env


def create_app(
    *,
    cors_origins: Sequence[str] | None = None,
    database_url: str | None = None,
    enable_api_docs: bool = True,
    email_transport: EmailTransport | None = None,
) -> FastAPI:
    configured_origins = (
        tuple(validate_cors_origin(origin) for origin in cors_origins)
        if cors_origins is not None
        else parse_cors_origins(load_env_file_value(CORS_ALLOWED_ORIGINS_ENV))
    )
    application = FastAPI(
        title="Certrace API",
        description="CBAM calculation and declarations API for Certrace.",
        version="0.2.0",
        debug=False,
        docs_url="/docs" if enable_api_docs else None,
        redoc_url="/redoc" if enable_api_docs else None,
        openapi_url="/openapi.json" if enable_api_docs else None,
    )
    application.state.backend_configured = True
    application.state.cors_origins = configured_origins
    application.state.database = (
        DatabaseRepository(database_url) if database_url else None
    )
    application.state.declarations = {}
    # Injected in tests so a suite never depends on a network or a key; built
    # from the environment everywhere else. See app/services/email.py.
    application.state.email_transport = email_transport or transport_from_env()
    application.state.email_logo_url = load_env_file_value(EMAIL_LOGO_URL_ENV)
    if configured_origins:
        application.add_middleware(
            CORSMiddleware,
            allow_origins=list(configured_origins),
            allow_credentials=True,
            allow_methods=["GET", "POST", "OPTIONS"],
            allow_headers=["Accept", "Authorization", "Content-Type"],
            max_age=600,
        )
    application.add_middleware(SecurityHeadersMiddleware)
    application.include_router(health.router)
    application.include_router(auth.router)
    application.include_router(calculations.router)
    application.include_router(declarations.router)
    return application
