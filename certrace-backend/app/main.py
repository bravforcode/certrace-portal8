"""FastAPI application factory and composition root."""

from __future__ import annotations

import os
from collections.abc import Sequence

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ALLOWED_ORIGINS_ENV
from app.core.cors import (
    SecurityHeadersMiddleware,
    parse_cors_origins,
    validate_cors_origin,
)
from app.repositories.database import DatabaseRepository
from app.routers import calculations, declarations, health


def create_app(
    *, cors_origins: Sequence[str] | None = None, database_url: str | None = None
) -> FastAPI:
    configured_origins = (
        tuple(validate_cors_origin(origin) for origin in cors_origins)
        if cors_origins is not None
        else parse_cors_origins(os.getenv(CORS_ALLOWED_ORIGINS_ENV))
    )
    application = FastAPI(
        title="Certrace API",
        description="CBAM calculation and declarations API for Certrace.",
        version="0.2.0",
        debug=False,
    )
    application.state.backend_configured = True
    application.state.cors_origins = configured_origins
    application.state.database = (
        DatabaseRepository(database_url) if database_url else None
    )
    application.state.declarations = {}
    if configured_origins:
        application.add_middleware(
            CORSMiddleware,
            allow_origins=list(configured_origins),
            allow_credentials=True,
            allow_methods=["GET", "POST", "OPTIONS"],
            allow_headers=["Accept", "Content-Type"],
            max_age=600,
        )
    application.add_middleware(SecurityHeadersMiddleware)
    application.include_router(health.router)
    application.include_router(calculations.router)
    application.include_router(declarations.router)
    return application
