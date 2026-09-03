"""Count wrong guesses against a reset code so it can be capped.

A 6-digit code with unlimited guesses is a keyspace, not a secret: 900k
possibilities inside a 15-minute window is walkable. The service now burns a
code after MAX_RESET_ATTEMPTS wrong guesses (app/services/auth_service.py),
and this column is where the count lives — on the row, so it survives a
restart and is shared by every instance.

Revision ID: 007
Revises: 006
Create Date: 2026-09-02
"""

import sqlalchemy as sa
from alembic import op

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "password_resets",
        sa.Column(
            "attempts",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )


def downgrade() -> None:
    op.drop_column("password_resets", "attempts")
