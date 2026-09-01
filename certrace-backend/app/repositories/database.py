"""SQLAlchemy repository for Certrace PostgreSQL persistence."""

from __future__ import annotations

import logging
import uuid
from decimal import Decimal
from urllib.parse import quote, unquote, urlsplit, urlunsplit

from sqlalchemy import case, create_engine, select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker

from app.config import (
    DATABASE_MAX_OVERFLOW_ENV,
    DATABASE_POOL_SIZE_ENV,
    REGULATORY_DATA_VERSION,
    load_nonnegative_int,
    load_positive_int,
)
from app.models.calculation import DeclarationInput
from app.models.database import (
    CalculationRun,
    Declaration,
    DeclarationAuditEvent,
    DefaultEmissionFactor,
)


_logger = logging.getLogger(__name__)


def _connection_failure_reason(exc: SQLAlchemyError) -> str:
    """The driver's own first line, without SQLAlchemy's trailing help link.

    ``exc.orig`` is the psycopg error, which names the actual cause -- password
    authentication failed, could not translate host name, connection timed out
    -- rather than the SQLAlchemy wrapper around it. It carries the host and
    port but never the password, which is why it is safe to log.
    """

    detail = str(getattr(exc, "orig", None) or exc).strip()
    first_line = detail.splitlines()[0] if detail else type(exc).__name__
    return first_line[:300]


def normalize_database_url(database_url: str) -> str:
    """Percent-encode credentials and select SQLAlchemy's psycopg driver."""

    parts = urlsplit(database_url)
    if parts.scheme not in {"postgres", "postgresql", "postgresql+psycopg"}:
        raise ValueError("DATABASE_URL must be a PostgreSQL connection URI.")
    username = quote(unquote(parts.username or ""), safe="")
    password = (
        f":{quote(unquote(parts.password), safe='')}"
        if parts.password is not None
        else ""
    )
    host = parts.hostname or ""
    if ":" in host and not host.startswith("["):
        host = f"[{host}]"
    port = f":{parts.port}" if parts.port is not None else ""
    netloc = f"{username}{password}@{host}{port}" if username else host + port
    return urlunsplit(
        ("postgresql+psycopg", netloc, parts.path, parts.query, parts.fragment)
    )


def normalize_country_of_origin(value: str | None) -> str:
    if value is None:
        return "UNSPECIFIED"
    normalized = "_".join(value.strip().upper().replace("-", " ").split())
    return normalized or "UNSPECIFIED"


class DatabaseRepository:
    def __init__(self, database_url: str) -> None:
        self.engine = create_engine(
            normalize_database_url(database_url),
            pool_pre_ping=True,
            pool_size=load_positive_int(DATABASE_POOL_SIZE_ENV, 2),
            max_overflow=load_nonnegative_int(DATABASE_MAX_OVERFLOW_ENV, 0),
            pool_recycle=300,
        )
        self.session_factory = sessionmaker(self.engine, expire_on_commit=False)

    def ping(self) -> bool:
        """Whether the database answers. Logs why when it does not.

        /readyz reports this as a bare 503, which is the right answer to give
        a load balancer and a useless one to debug from: a wrong password, an
        unresolvable host and a firewall all look identical from outside. The
        reason belongs in the operator's log, where the URL is not echoed and
        only the driver's own message is kept.
        """

        try:
            with self.engine.connect() as connection:
                connection.execute(text("select 1"))
            return True
        except SQLAlchemyError as exc:
            _logger.warning("Database ping failed: %s", _connection_failure_reason(exc))
            return False

    def lookup_default_factor(
        self,
        cn_code: str | None,
        year: int | None,
        country_of_origin: str | None = None,
    ) -> Decimal | None:
        if cn_code is None or year is None:
            return None
        exact_country = normalize_country_of_origin(country_of_origin)
        countries = [exact_country, "OTHER_COUNTRIES", "UNSPECIFIED"]
        with self.session_factory() as session:
            country_priority = case(
                (DefaultEmissionFactor.country_of_origin == exact_country, 0),
                (DefaultEmissionFactor.country_of_origin == "OTHER_COUNTRIES", 1),
                else_=2,
            )
            statement = (
                select(DefaultEmissionFactor.specific_embedded_emissions)
                .where(
                    DefaultEmissionFactor.cn_code == cn_code.replace(" ", ""),
                    DefaultEmissionFactor.reporting_year == year,
                    DefaultEmissionFactor.country_of_origin.in_(countries),
                )
                .order_by(country_priority, DefaultEmissionFactor.route.nullsfirst())
                .limit(1)
            )
            return session.scalar(statement)

    def create_declaration(
        self, request: DeclarationInput, calculation: dict[str, object]
    ) -> dict[str, object]:
        with self.session_factory.begin() as session:
            declaration = Declaration(
                declarant_name=request.declarant_name,
                cn_code=request.cn_code,
                reporting_year=request.reporting_year,
                status="DRAFT_CALCULATION_PREVIEW",
            )
            session.add(declaration)
            session.flush()
            session.add(
                CalculationRun(
                    declaration_id=declaration.id,
                    trace_id=request.calculation.trace_id,
                    request_payload=request.calculation.model_dump(mode="json"),
                    result_payload=calculation,
                    regulatory_data_version=REGULATORY_DATA_VERSION,
                )
            )
            session.add(
                DeclarationAuditEvent(
                    declaration_id=declaration.id,
                    event_type="DECLARATION_CREATED",
                    payload={"traceId": request.calculation.trace_id},
                )
            )
        return self._declaration_response(declaration, calculation)

    @staticmethod
    def _declaration_response(
        declaration: Declaration, calculation: object
    ) -> dict[str, object]:
        return {
            "id": str(declaration.id),
            "declarantName": declaration.declarant_name,
            "cnCode": declaration.cn_code,
            "reportingYear": declaration.reporting_year,
            "status": declaration.status,
            "calculation": calculation,
        }

    def list_declarations(self) -> list[dict[str, object]]:
        with self.session_factory() as session:
            declarations = session.scalars(
                select(Declaration).order_by(Declaration.created_at.desc())
            ).all()
            return [
                self._declaration_response(
                    item,
                    item.calculation_runs[0].result_payload
                    if item.calculation_runs
                    else None,
                )
                for item in declarations
            ]

    def get_declaration(self, declaration_id: str) -> dict[str, object] | None:
        try:
            parsed_id = uuid.UUID(declaration_id)
        except ValueError:
            return None
        with self.session_factory() as session:
            declaration = session.get(Declaration, parsed_id)
            if declaration is None:
                return None
            calculation = (
                declaration.calculation_runs[0].result_payload
                if declaration.calculation_runs
                else None
            )
            return self._declaration_response(declaration, calculation)
