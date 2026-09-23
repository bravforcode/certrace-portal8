"""Remember which Google account an account signs in with.

Sign in with Google links by verified email: the first time a Google identity
arrives for an address we already hold, it opens that account. This column is
what makes "the first time" a fact rather than a guess — see
auth_service.sign_in_with_google for why that moment matters (it is when a
password somebody else may have set gets retired).

``google_sub`` is Google's stable subject id, not the email: an address can be
renamed on Google's side, the subject cannot. Unique, so one Google account can
never open two Certrace accounts. Nullable — password-only accounts have none.

Revision ID: 014
Revises: 013
Create Date: 2026-09-18
"""

import sqlalchemy as sa
from alembic import op

revision = "014"
down_revision = "013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("google_sub", sa.Text()))
    op.create_index("users_google_sub_key", "users", ["google_sub"], unique=True)


def downgrade() -> None:
    op.drop_index("users_google_sub_key", table_name="users")
    op.drop_column("users", "google_sub")
