"""Give an account a state, so access can be withdrawn without deleting it.

Terms of Service §6.4 and §20.4 both promise a suspension we could not
perform: ``users`` held an address, a hash and a profile, and nothing that
said whether the account was still entitled to sign in. The only way to cut a
customer off was to delete the row or overwrite the hash by hand -- the first
takes their evidence with it (``portal_declarations`` cascades on
``users.id``), the second is indistinguishable from an account takeover to
the person on the other end.

``suspension_reason`` is written for the dispute rather than for the customer:
"invoice 2026-0412, 15 days past the §6.4 notice" is what makes a suspension
defensible later. It is never rendered into an API response -- see
``app/routers/auth.py`` -- because the reason is our record, not a message.

The check constraint keeps the two columns honest: a SUSPENDED row always
carries the moment it happened, and an ACTIVE row never does. Without it the
pair drifts the first time someone flips ``status`` by hand and the timestamp
we would rely on in a dispute is a leftover from a suspension since lifted.

Revision ID: 015
Revises: 014
Create Date: 2026-09-20
"""

import sqlalchemy as sa
from alembic import op

revision = "015"
down_revision = "014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Every row that exists predates suspension and is therefore active; the
    # server default carries that forward for inserts, which do not name the
    # column (app/services/auth_service.py registers with the columns the
    # signup form fills and nothing else).
    op.add_column(
        "users",
        sa.Column(
            "status",
            sa.Text(),
            nullable=False,
            server_default=sa.text("'ACTIVE'"),
        ),
    )
    op.add_column("users", sa.Column("suspended_at", sa.DateTime(timezone=True)))
    op.add_column("users", sa.Column("suspension_reason", sa.Text()))
    op.create_check_constraint(
        "users_status_check",
        "users",
        "(status = 'ACTIVE' AND suspended_at IS NULL) "
        "OR (status = 'SUSPENDED' AND suspended_at IS NOT NULL)",
    )


def downgrade() -> None:
    op.drop_constraint("users_status_check", "users", type_="check")
    op.drop_column("users", "suspension_reason")
    op.drop_column("users", "suspended_at")
    op.drop_column("users", "status")
