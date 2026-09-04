"""Server-issued supplier smart links.

docs/API-CONTRACT.md §3: the portal's old token was base64url("declId|supplierId"),
mintable by anyone who knows two ids. This table makes the server the only
issuer: the token is 32 random bytes, and this row is the sole mapping from it
to (declaration, supplier, month) — plus the lifetime and revocation stamp
that make a leaked link expire.

``state`` will hold the supplier's answers (§4, one jsonb blob per link) once
the save/submit endpoints land; the resolve endpoint already reads it.

The composite FK onto portal_declarations means deleting a declaration takes
its links down with it, so a resolve can never dangle.

Revision ID: 009
Revises: 008
Create Date: 2026-09-03
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "smart_links",
        sa.Column("token", sa.Text(), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("declaration_id", sa.Text(), nullable=False),
        sa.Column("supplier_id", sa.Text(), nullable=False),
        sa.Column("month", sa.Text()),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True)),
        sa.Column("state", postgresql.JSONB()),
        # §4 wants status queryable without opening the blob. Generated, so it
        # can never disagree with state->>'status'; index it when the
        # submissions listing lands and measurably needs one.
        sa.Column("status", sa.Text(), sa.Computed("state->>'status'", persisted=True)),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id", "declaration_id"],
            ["portal_declarations.user_id", "portal_declarations.id"],
            ondelete="CASCADE",
        ),
    )
    # The FK columns need an index or every declaration delete scans the table.
    # It is also exactly what listing a declaration's submissions will filter by.
    op.create_index(
        "smart_links_declaration_idx", "smart_links", ["user_id", "declaration_id"]
    )
    # Deny-by-default like every other table here — see revision 004.
    op.execute("alter table public.smart_links enable row level security")
    op.execute(
        "create or replace trigger smart_links_touch_updated_at "
        "before update on public.smart_links "
        "for each row execute function public.touch_updated_at()"
    )


def downgrade() -> None:
    op.drop_table("smart_links")
