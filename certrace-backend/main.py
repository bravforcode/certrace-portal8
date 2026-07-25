"""Certrace backend ASGI entry point.

The application factory and domain modules live under ``app/``. This module
keeps the original import and Uvicorn target stable: ``main:app``.
"""

from app.config import CORS_ALLOWED_ORIGINS_ENV, DATABASE_URL_ENV, load_env_file_value
from app.core.cors import CorsConfigurationError, parse_cors_origins, validate_cors_origin
from app.main import create_app

app = create_app(database_url=load_env_file_value(DATABASE_URL_ENV))
