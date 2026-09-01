"""Create the accounts and password-reset tables the auth service reads.

``app/services/auth_service.py`` has been querying ``public.users`` and
``public.password_resets`` since the auth router landed, but no revision ever
created them. Every one of those statements failed against a real database and
was swallowed by a fallback to the in-process store, so the gap stayed
invisible for as long as nobody ran the API with ``DATABASE_URL`` set.

Revision ID: 003
Revises: 002
Create Date: 2026-09-01
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("email", sa.Text(), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
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
        sa.CheckConstraint(
            "position('@' in email) > 1", name="users_email_shape_check"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    # The service matches on LOWER(email). A plain UNIQUE(email) would let
    # "Fern@x.co" and "fern@x.co" both exist as separate accounts while that
    # lookup returns one of them arbitrarily, so the uniqueness has to be
    # declared on the same expression the query uses.
    op.create_index(
        "users_email_lower_key", "users", [sa.text("lower(email)")], unique=True
    )

    op.create_table(
        "password_resets",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("email", sa.Text(), nullable=False),
        sa.Column("token", sa.Text(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "used", sa.Boolean(), server_default=sa.text("false"), nullable=False
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    # Serves the one read the service makes: newest unused code for an address.
    op.create_index(
        "password_resets_email_created_idx",
        "password_resets",
        [sa.text("lower(email)"), sa.text("created_at DESC")],
    )


def downgrade() -> None:
    op.drop_index("password_resets_email_created_idx", table_name="password_resets")
    op.drop_table("password_resets")
    op.drop_index("users_email_lower_key", table_name="users")
    op.drop_table("users")
