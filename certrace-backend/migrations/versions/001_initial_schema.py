"""Create the Certrace initial PostgreSQL schema.

Revision ID: 001
Revises:
Create Date: 2026-07-24
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("create extension if not exists pgcrypto")
    op.create_table(
        "default_emission_factors",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("cn_code", sa.String(length=8), nullable=False),
        sa.Column("reporting_year", sa.Integer(), nullable=False),
        sa.Column("sector", sa.Text(), nullable=False),
        sa.Column("route", sa.Text()),
        sa.Column("specific_embedded_emissions", sa.Numeric(24, 12), nullable=False),
        sa.Column(
            "unit", sa.Text(), nullable=False, server_default=sa.text("'TCO2E_PER_TNE'")
        ),
        sa.Column("source_reference", sa.Text(), nullable=False),
        sa.Column("regulatory_data_version", sa.Text(), nullable=False),
        sa.Column("effective_from", sa.Date(), nullable=False),
        sa.Column("effective_to", sa.Date()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "cn_code ~ '^[0-9]{8}$'", name="default_factors_cn_code_check"
        ),
        sa.CheckConstraint(
            "reporting_year between 2024 and 2030", name="default_factors_year_check"
        ),
        sa.CheckConstraint(
            "sector in ('IRON_STEEL', 'ALUMINIUM')", name="default_factors_sector_check"
        ),
        sa.CheckConstraint(
            "specific_embedded_emissions >= 0", name="default_factors_emissions_check"
        ),
        sa.CheckConstraint("unit = 'TCO2E_PER_TNE'", name="default_factors_unit_check"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "cn_code",
            "reporting_year",
            "route",
            name="default_factors_cn_year_route_key",
        ),
    )
    op.create_table(
        "declarations",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("declarant_name", sa.Text(), nullable=False),
        sa.Column("cn_code", sa.String(length=8), nullable=False),
        sa.Column("reporting_year", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            sa.Text(),
            nullable=False,
            server_default=sa.text("'DRAFT_CALCULATION_PREVIEW'"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("cn_code ~ '^[0-9]{8}$'", name="declarations_cn_code_check"),
        sa.CheckConstraint(
            "reporting_year between 2024 and 2030", name="declarations_year_check"
        ),
        sa.CheckConstraint(
            "status in ('DRAFT_CALCULATION_PREVIEW', 'READY_FOR_REVIEW', 'SUBMITTED', 'VERIFIED', 'REJECTED')",
            name="declarations_status_check",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "calculation_runs",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("declaration_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("trace_id", sa.Text(), nullable=False),
        sa.Column("request_payload", postgresql.JSONB(), nullable=False),
        sa.Column("result_payload", postgresql.JSONB(), nullable=False),
        sa.Column("regulatory_data_version", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["declaration_id"], ["declarations.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "declaration_audit_events",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("declaration_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_type", sa.Text(), nullable=False),
        sa.Column("actor", sa.Text()),
        sa.Column(
            "payload",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["declaration_id"], ["declarations.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "default_emission_factors_lookup_idx",
        "default_emission_factors",
        ["cn_code", "reporting_year"],
    )
    op.create_index(
        "declarations_reporting_idx",
        "declarations",
        ["reporting_year", "cn_code", "status"],
    )
    op.create_index(
        "calculation_runs_declaration_idx",
        "calculation_runs",
        ["declaration_id", sa.text("created_at desc")],
    )
    op.execute("""
        create or replace function touch_updated_at()
        returns trigger language plpgsql as $$
        begin new.updated_at = now(); return new; end;
        $$;
        create trigger declarations_touch_updated_at before update on declarations
        for each row execute function touch_updated_at();
    """)


def downgrade() -> None:
    op.execute("drop trigger if exists declarations_touch_updated_at on declarations")
    op.drop_table("declaration_audit_events")
    op.drop_table("calculation_runs")
    op.drop_table("declarations")
    op.drop_table("default_emission_factors")
    op.execute("drop function if exists touch_updated_at()")
