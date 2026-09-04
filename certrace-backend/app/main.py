"""FastAPI application factory and composition root."""

from __future__ import annotations

import secrets
from collections.abc import Sequence

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import (
    APP_BASE_URL_DEFAULT,
    APP_BASE_URL_ENV,
    CORS_ALLOWED_ORIGINS_ENV,
    EMAIL_LOGO_URL_ENV,
    JWT_SECRET_ENV,
    load_env_file_value,
)
from app.core.cors import (
    SecurityHeadersMiddleware,
    parse_cors_origins,
    validate_cors_origin,
)
from app.repositories.database import DatabaseRepository
from app.routers import auth, calculations, declarations, health, links
from app.services.email import EmailTransport, transport_from_env
from app.services.errors import AccountStoreUnavailable


async def _account_store_unavailable_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    """Answer 503 when the account tables are configured but unreachable.

    The detail carries no database text: the caller needs to know to retry,
    not which relation is missing.
    """

    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "detail": {
                "code": AccountStoreUnavailable.code,
                "message": AccountStoreUnavailable.message,
            }
        },
    )


def create_app(
    *,
    cors_origins: Sequence[str] | None = None,
    database_url: str | None = None,
    enable_api_docs: bool = True,
    email_transport: EmailTransport | None = None,
    jwt_secret: str | None = None,
) -> FastAPI:
    signing_secret = jwt_secret or load_env_file_value(JWT_SECRET_ENV)
    if database_url and not signing_secret:
        # A deployment holding real accounts must not start without a signing
        # key. Generating one here would work and be worse: every restart, and
        # every instance, would sign with a different key, so tokens would stop
        # working at random and look to a customer like a flaky login.
        raise RuntimeError(
            f"{JWT_SECRET_ENV} is required when a database is configured."
        )
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
    # No-database home for portal declarations: {account id: {decl id: doc}}.
    application.state.portal_declarations = {}
    # No-database home for supplier smart links: {token: link dict}.
    application.state.smart_links = {}
    # Minted links point at the portal, not at this API.
    application.state.app_base_url = (
        load_env_file_value(APP_BASE_URL_ENV) or APP_BASE_URL_DEFAULT
    ).rstrip("/")
    # Without a database there are no real accounts to protect, so the
    # no-database mode gets an ephemeral key rather than a startup failure:
    # tokens work for the life of the process, which is all a local demo or a
    # test needs.
    application.state.jwt_secret = signing_secret or secrets.token_urlsafe(32)
    # Injected in tests so a suite never depends on a network or a key; built
    # from the environment everywhere else. See app/services/email.py.
    application.state.email_transport = email_transport or transport_from_env()
    application.state.email_logo_url = load_env_file_value(EMAIL_LOGO_URL_ENV)
    if configured_origins:
        application.add_middleware(
            CORSMiddleware,
            allow_origins=list(configured_origins),
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allow_headers=["Accept", "Authorization", "Content-Type"],
            max_age=600,
        )
    application.add_middleware(SecurityHeadersMiddleware)
    application.add_exception_handler(
        AccountStoreUnavailable, _account_store_unavailable_handler
    )
    application.include_router(health.router)
    application.include_router(auth.router)
    application.include_router(calculations.router)
    application.include_router(declarations.router)
    application.include_router(links.router)
    return application
