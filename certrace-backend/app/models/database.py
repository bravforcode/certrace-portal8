"""SQLAlchemy schema models for the Certrace PostgreSQL database."""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Computed,
    Date,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    false,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    """A portal account.

    Uniqueness lives on ``lower(email)`` (see revision 003), not on the column,
    because every lookup in the auth service matches case-insensitively.
    """

    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("position('@' in email) > 1", name="users_email_shape_check"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    email: Mapped[str] = mapped_column(Text, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    first_name: Mapped[str | None] = mapped_column(Text)
    last_name: Mapped[str | None] = mapped_column(Text)
    company_name: Mapped[str | None] = mapped_column(Text)
    onboarded: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=false()
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


class PasswordReset(Base):
    """One issued reset code.

    Rows are kept rather than overwritten so a reused or expired code can be
    told apart from a code that was never issued.
    """

    __tablename__ = "password_resets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    email: Mapped[str] = mapped_column(Text, nullable=False)
    token: Mapped[str] = mapped_column(Text, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    used: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=false()
    )
    # Wrong guesses so far; the service burns the code at MAX_RESET_ATTEMPTS.
    attempts: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class NotificationDelivery(Base):
    """One reminder that has gone out, so it never goes out twice.

    A row is written BEFORE the message is handed to the provider -- the
    insert is what claims the send, and the unique index below is what makes
    two runs racing on the same rung resolve to one winner rather than two
    emails. ``app/services/reminders.py`` deletes the row again if delivery
    fails, so a provider outage does not permanently consume a rung.

    Rows are kept after a successful send; they ARE the schedule's memory.
    Pruning them re-sends the ladder.
    """

    __tablename__ = "notification_deliveries"
    __table_args__ = (
        UniqueConstraint(
            "subject_id",
            "occasion",
            name="notification_deliveries_subject_occasion_key",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    # What the reminder is about: a Smart Link token for a supplier month, an
    # account id for a trial. Opaque here on purpose -- this table must not
    # need a foreign key into stores that do not exist on the server yet.
    subject_id: Mapped[str] = mapped_column(Text, nullable=False)
    # One rung of one ladder: "supplier_submission_overdue@+5". Built by
    # ``reminder_schedule.Step.occasion``; changing that format re-sends.
    occasion: Mapped[str] = mapped_column(Text, nullable=False)
    notification_key: Mapped[str] = mapped_column(Text, nullable=False)
    recipient: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class RefreshToken(Base):
    """One issued refresh token, hashed at rest.

    Single-use: redemption marks the row used and issues a successor, so the
    week-long session is a chain of short-lived secrets, any link of which
    logout can revoke.
    """

    __tablename__ = "refresh_tokens"
    __table_args__ = (
        UniqueConstraint("token_hash", name="refresh_tokens_token_hash_key"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(Text, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    used: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=false()
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class PortalDeclaration(Base):
    """One exporter's declaration document, stored whole.

    The portal owns the shape (certrace-portal/lib/data.ts) and the backend
    keeps it opaque, per docs/API-CONTRACT.md §2: the document lives in
    ``doc`` as jsonb, and only what listing needs to sort and filter by is
    broken out into columns. The id is minted client-side (``decl-<uuid>``),
    so the primary key is (user_id, id): two accounts can never see — or
    collide on — each other's rows.
    """

    __tablename__ = "portal_declarations"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str | None] = mapped_column(Text)
    period: Mapped[str | None] = mapped_column(Text)
    step: Mapped[str | None] = mapped_column(Text)
    doc: Mapped[dict[str, object]] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class SmartLink(Base):
    """One server-issued supplier link (docs/API-CONTRACT.md §3).

    The token is the primary key and the whole credential: 32 random bytes,
    derived from nothing, so holding the row is the only way to resolve it.
    ``state`` is the supplier's answer blob (§4), opaque here like the
    declaration document it belongs to; null until the supplier first saves.
    The composite FK means a deleted declaration takes its links with it.
    """

    __tablename__ = "smart_links"
    __table_args__ = (
        ForeignKeyConstraint(
            ["user_id", "declaration_id"],
            ["portal_declarations.user_id", "portal_declarations.id"],
            ondelete="CASCADE",
        ),
    )

    token: Mapped[str] = mapped_column(Text, primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    declaration_id: Mapped[str] = mapped_column(Text, nullable=False)
    supplier_id: Mapped[str] = mapped_column(Text, nullable=False)
    month: Mapped[str | None] = mapped_column(Text)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    state: Mapped[dict[str, object] | None] = mapped_column(JSONB)
    # Generated from the blob (§4's queryable status), never written directly.
    status: Mapped[str | None] = mapped_column(
        Text, Computed("state->>'status'", persisted=True)
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


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
    route: Mapped[str | None] = mapped_column(Text)
    specific_embedded_emissions: Mapped[Decimal] = mapped_column(
        Numeric(24, 12), nullable=False
    )
    unit: Mapped[str] = mapped_column(Text, nullable=False, default="TCO2E_PER_TNE")
    source_reference: Mapped[str] = mapped_column(Text, nullable=False)
    regulatory_data_version: Mapped[str] = mapped_column(Text, nullable=False)
    effective_from: Mapped[datetime] = mapped_column(Date, nullable=False)
    effective_to: Mapped[datetime | None] = mapped_column(Date)
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
    actor: Mapped[str | None] = mapped_column(Text)
    payload: Mapped[dict[str, object]] = mapped_column(
        JSONB, nullable=False, default=dict
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    declaration: Mapped[Declaration] = relationship(back_populates="audit_events")
