"""Server-side refresh tokens: the revocable half of a session.

The access JWT is stateless and now short-lived (an hour); what keeps someone
signed in for the week is a row here. Stored as a SHA-256 hash — a database
read must not hand out working credentials — and single-use: redeeming a
token marks it used and issues a successor, so a leaked old token is dead the
moment its rightful holder refreshes. Logout marks the row used too, which is
the revocation the JWT alone could never do.

Revision ID: 008
Revises: 007
Create Date: 2026-09-02
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "refresh_tokens",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            primary_key=True,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token_hash", sa.Text(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "used",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    # The lookup key for every redeem; unique because a hash collision here
    # would let one token answer for another.
    op.create_index(
        "refresh_tokens_token_hash_key", "refresh_tokens", ["token_hash"], unique=True
    )
    # Deny-by-default like every other table — see revision 004.
    op.execute("alter table public.refresh_tokens enable row level security")


def downgrade() -> None:
    op.drop_table("refresh_tokens")
