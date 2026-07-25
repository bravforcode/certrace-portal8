"""Alembic environment using the same DATABASE_URL as the API."""

from __future__ import annotations

from alembic import context
from sqlalchemy import engine_from_config, pool

import app.models.database  # noqa: F401 - registers every mapped table with Base.
from app.config import DATABASE_URL_ENV, load_env_file_value
from app.models import Base
from app.repositories.database import normalize_database_url

config = context.config
database_url = load_env_file_value(DATABASE_URL_ENV)
if not database_url:
    raise RuntimeError("DATABASE_URL is required for Alembic migrations.")
# ConfigParser reserves '%' for interpolation. SQLAlchemy URLs can legitimately
# contain percent-encoded credentials, so escape them at this boundary only.
config.set_main_option(
    "sqlalchemy.url", normalize_database_url(database_url).replace("%", "%%")
)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
