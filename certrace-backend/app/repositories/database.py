"""SQLAlchemy repository for Certrace PostgreSQL persistence."""

from __future__ import annotations

import uuid
from decimal import Decimal
from urllib.parse import quote, unquote, urlsplit, urlunsplit

from sqlalchemy import case, create_engine, select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker

from app.config import REGULATORY_DATA_VERSION
from app.models.calculation import DeclarationInput
from app.models.database import (
    CalculationRun,
    Declaration,
    DeclarationAuditEvent,
    DefaultEmissionFactor,
)


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
            normalize_database_url(database_url), pool_pre_ping=True
        )
        self.session_factory = sessionmaker(self.engine, expire_on_commit=False)

    def ping(self) -> bool:
        try:
            with self.engine.connect() as connection:
                connection.execute(text("select 1"))
            return True
        except SQLAlchemyError:
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
