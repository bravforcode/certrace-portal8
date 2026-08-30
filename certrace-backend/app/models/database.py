"""SQLAlchemy schema models for the Certrace PostgreSQL database."""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class DefaultEmissionFactor(Base):
    __tablename__ = "default_emission_factors"
    __table_args__ = (
        CheckConstraint("cn_code ~ '^[0-9]{8}$'", name="default_factors_cn_code_check"),
        CheckConstraint(
            "reporting_year between 2024 and 2030", name="default_factors_year_check"
        ),
        CheckConstraint(
            "sector in ('IRON_STEEL', 'ALUMINIUM')", name="default_factors_sector_check"
        ),
        CheckConstraint(
            "specific_embedded_emissions >= 0", name="default_factors_emissions_check"
        ),
        CheckConstraint("unit = 'TCO2E_PER_TNE'", name="default_factors_unit_check"),
        UniqueConstraint(
            "cn_code",
            "reporting_year",
            "route",
            "country_of_origin",
            name="default_factors_cn_year_route_country_key",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    cn_code: Mapped[str] = mapped_column(String(8), nullable=False)
    reporting_year: Mapped[int] = mapped_column(Integer, nullable=False)
    country_of_origin: Mapped[str] = mapped_column(
        Text, nullable=False, default="UNSPECIFIED"
    )
    sector: Mapped[str] = mapped_column(Text, nullable=False)
    route: Mapped[Optional[str]] = mapped_column(Text)
    specific_embedded_emissions: Mapped[Decimal] = mapped_column(
        Numeric(24, 12), nullable=False
    )
    unit: Mapped[str] = mapped_column(Text, nullable=False, default="TCO2E_PER_TNE")
    source_reference: Mapped[str] = mapped_column(Text, nullable=False)
    regulatory_data_version: Mapped[str] = mapped_column(Text, nullable=False)
    effective_from: Mapped[datetime] = mapped_column(Date, nullable=False)
    effective_to: Mapped[Optional[datetime]] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class Declaration(Base):
    __tablename__ = "declarations"
    __table_args__ = (
        CheckConstraint("cn_code ~ '^[0-9]{8}$'", name="declarations_cn_code_check"),
        CheckConstraint(
            "reporting_year between 2024 and 2030", name="declarations_year_check"
        ),
        CheckConstraint(
            "status in ('DRAFT_CALCULATION_PREVIEW', 'READY_FOR_REVIEW', 'SUBMITTED', 'VERIFIED', 'REJECTED')",
            name="declarations_status_check",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    declarant_name: Mapped[str] = mapped_column(Text, nullable=False)
    cn_code: Mapped[str] = mapped_column(String(8), nullable=False)
    reporting_year: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(
        Text, nullable=False, default="DRAFT_CALCULATION_PREVIEW"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    calculation_runs: Mapped[list[CalculationRun]] = relationship(
        back_populates="declaration",
        cascade="all, delete-orphan",
        order_by="CalculationRun.created_at.desc()",
    )
    audit_events: Mapped[list[DeclarationAuditEvent]] = relationship(
        back_populates="declaration", cascade="all, delete-orphan"
    )


class CalculationRun(Base):
    __tablename__ = "calculation_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    declaration_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("declarations.id", ondelete="CASCADE"), nullable=False
    )
    trace_id: Mapped[str] = mapped_column(Text, nullable=False)
    request_payload: Mapped[dict[str, object]] = mapped_column(JSONB, nullable=False)
    result_payload: Mapped[dict[str, object]] = mapped_column(JSONB, nullable=False)
    regulatory_data_version: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    declaration: Mapped[Declaration] = relationship(back_populates="calculation_runs")


class DeclarationAuditEvent(Base):
    __tablename__ = "declaration_audit_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    declaration_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("declarations.id", ondelete="CASCADE"), nullable=False
    )
    event_type: Mapped[str] = mapped_column(Text, nullable=False)
    actor: Mapped[Optional[str]] = mapped_column(Text)
    payload: Mapped[dict[str, object]] = mapped_column(
        JSONB, nullable=False, default=dict
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    declaration: Mapped[Declaration] = relationship(back_populates="audit_events")
