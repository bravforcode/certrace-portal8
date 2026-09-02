"""Give each account its own set of portal declaration documents.

docs/API-CONTRACT.md §2: the portal's Declaration is stored whole as jsonb —
the backend does not know its fields — with only what listing needs (name,
period, step, updated_at) broken out. The id arrives from the client
(``decl-<uuid>``), so the primary key is (user_id, id): rows are scoped to
their owner by construction, and two accounts cannot collide.

The legacy ``declarations`` table stays: it belongs to the MRV calculation
flow (calculation_runs FK), not to the portal's reporting jobs.

Revision ID: 006
Revises: 005
Create Date: 2026-09-02
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "portal_declarations",
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("name", sa.Text()),
        sa.Column("period", sa.Text()),
        sa.Column("step", sa.Text()),
        sa.Column("doc", postgresql.JSONB(), nullable=False),
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
    )
    # Deny-by-default like every other table here — see revision 004: the
    # backend connects as postgres (BYPASSRLS); the Data API path gets nothing.
    op.execute("alter table public.portal_declarations enable row level security")
    op.execute(
        "create or replace trigger portal_declarations_touch_updated_at "
        "before update on public.portal_declarations "
        "for each row execute function public.touch_updated_at()"
    )


def downgrade() -> None:
    op.drop_table("portal_declarations")
