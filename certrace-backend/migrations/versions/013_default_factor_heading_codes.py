"""Allow EU default emission factors at heading granularity.

BACK-9 found that the Commission's default-values workbook does not always
publish a value at full CN8: goods like "7601 Unwrought aluminium" only ever
get one figure for the whole 4-digit heading, because there is no finer
breakdown to publish. ``default_factors_cn_code_check`` required exactly 8
digits, so every one of those rows (111 per country in Certrace's chapters)
was silently unimportable.

This does not touch ``declarations.cn_code`` - a filed declaration always
classifies the actual good to full CN8 for customs, so that check stays as
it was. This table is a lookup table the Commission itself publishes at
mixed granularity; the shape it is allowed to hold has to match that.

Revision ID: 013
Revises: 012
Create Date: 2026-09-19
"""

from alembic import op

revision = "013"
down_revision = "012"
branch_labels = None
depends_on = None

OLD_CHECK = "cn_code ~ '^[0-9]{8}$'"
NEW_CHECK = "cn_code ~ '^([0-9]{4}|[0-9]{6}|[0-9]{8})$'"


def upgrade() -> None:
    op.drop_constraint(
        "default_factors_cn_code_check", "default_emission_factors", type_="check"
    )
    op.create_check_constraint(
        "default_factors_cn_code_check", "default_emission_factors", NEW_CHECK
    )


def downgrade() -> None:
    op.drop_constraint(
        "default_factors_cn_code_check", "default_emission_factors", type_="check"
    )
    op.create_check_constraint(
        "default_factors_cn_code_check", "default_emission_factors", OLD_CHECK
    )
