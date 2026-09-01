"""Give accounts the profile fields the portal signs up with.

Revision 003 created ``users`` with only what password management needed. The
contract's register call also carries a name and a company, and the portal
branches on ``onboarded`` to decide whether a fresh signup lands on /onboarding
or straight on the dashboard -- so that flag has to survive a reload, which
means it lives here rather than in the token.

Revision ID: 005
Revises: 004
Create Date: 2026-09-01
"""

import sqlalchemy as sa
from alembic import op

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("first_name", sa.Text()))
    op.add_column("users", sa.Column("last_name", sa.Text()))
    op.add_column("users", sa.Column("company_name", sa.Text()))
    # NOT NULL with a default: the rows already here belong to accounts created
    # before onboarding existed, and treating them as onboarded keeps them out
    # of a wizard they have no reason to see.
    op.add_column(
        "users",
        sa.Column(
            "onboarded",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )
    # New signups must start at false. The server default only backfills the
    # existing rows; every insert from here names the column explicitly.
    op.alter_column("users", "onboarded", server_default=sa.text("false"))


def downgrade() -> None:
    op.drop_column("users", "onboarded")
    op.drop_column("users", "company_name")
    op.drop_column("users", "last_name")
    op.drop_column("users", "first_name")
