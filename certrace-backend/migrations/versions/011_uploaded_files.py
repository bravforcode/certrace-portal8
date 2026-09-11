"""Evidence files, stored rather than described.

R5 in PROJECT_STATUS.md: a certificate used to travel as a base64 data URL
inside the supplier's answer blob in one browser's localStorage, and anything
past ~1.5 MB kept its name and lost its contents. Most mill certificates are
bigger than that, so the document a verifier would ask for was precisely the
one the portal discarded.

Bytes go in ``data`` for now. ``storage_key`` is already path-shaped so that
moving them to a bucket empties that column and changes nothing else - see
app/services/file_store.py for why a table and not a bucket today.

The composite FK mirrors smart_links: deleting a declaration takes its
evidence with it, so nothing dangles. ``uploaded_via_token`` is SET NULL
rather than CASCADE on purpose - a revoked or expired link must not delete
the evidence the supplier already provided under it.

Revision ID: 011
Revises: 010
Create Date: 2026-09-10
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "011"
down_revision = "010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "uploaded_files",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("declaration_id", sa.Text(), nullable=False),
        sa.Column("doc_id", sa.Text()),
        sa.Column("uploaded_via_token", sa.Text()),
        sa.Column("filename", sa.Text(), nullable=False),
        sa.Column("content_type", sa.Text(), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("sha256", sa.String(length=64), nullable=False),
        sa.Column("storage_key", sa.Text(), nullable=False, unique=True),
        sa.Column("data", sa.LargeBinary()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id", "declaration_id"],
            ["portal_declarations.user_id", "portal_declarations.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["uploaded_via_token"],
            ["smart_links.token"],
            ondelete="SET NULL",
        ),
        sa.CheckConstraint("size_bytes > 0", name="uploaded_files_size_positive"),
    )
    # Listing a declaration's evidence, and the cascade on delete, both filter
    # on exactly this pair.
    op.create_index(
        "uploaded_files_declaration_idx",
        "uploaded_files",
        ["user_id", "declaration_id"],
    )
    # What a supplier is allowed to read back: their own uploads, by token.
    op.create_index(
        "uploaded_files_token_idx",
        "uploaded_files",
        ["uploaded_via_token"],
        postgresql_where=sa.text("uploaded_via_token is not null"),
    )
    # Deny-by-default like every other table here - see revision 004.
    op.execute("alter table public.uploaded_files enable row level security")


def downgrade() -> None:
    op.drop_index("uploaded_files_token_idx", table_name="uploaded_files")
    op.drop_index("uploaded_files_declaration_idx", table_name="uploaded_files")
    op.drop_table("uploaded_files")
