"""Add country of origin to default emission factors.

Revision ID: 002
Revises: 001
Create Date: 2026-07-25
"""

from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "default_emission_factors",
        sa.Column("country_of_origin", sa.Text(), nullable=False, server_default="UNSPECIFIED"),
    )
    op.drop_constraint("default_factors_cn_year_route_key", "default_emission_factors", type_="unique")
    op.create_unique_constraint(
        "default_factors_cn_year_route_country_key",
        "default_emission_factors",
        ["cn_code", "reporting_year", "route", "country_of_origin"],
    )
    op.drop_index("default_emission_factors_lookup_idx", table_name="default_emission_factors")
    op.create_index(
        "default_emission_factors_lookup_idx",
        "default_emission_factors",
        ["cn_code", "reporting_year", "country_of_origin"],
    )


def downgrade() -> None:
    op.drop_index("default_emission_factors_lookup_idx", table_name="default_emission_factors")
    op.create_index(
        "default_emission_factors_lookup_idx",
        "default_emission_factors",
        ["cn_code", "reporting_year"],
    )
    op.drop_constraint("default_factors_cn_year_route_country_key", "default_emission_factors", type_="unique")
    op.create_unique_constraint(
        "default_factors_cn_year_route_key",
        "default_emission_factors",
        ["cn_code", "reporting_year", "route"],
    )
    op.drop_column("default_emission_factors", "country_of_origin")
