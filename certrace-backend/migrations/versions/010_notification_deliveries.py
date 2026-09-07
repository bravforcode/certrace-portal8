"""Create the table the reminder scheduler uses to avoid sending twice.

``app/services/reminders.py`` claims a send by inserting here before it calls
the transport, so the unique index is not an optimisation -- it is the whole
concurrency control. Two runs racing on the same rung (an overlapping cron, a
retried container) both attempt the insert; one wins and sends, the other gets
a constraint violation and skips.

RLS follows revision 004: enabled with no policies, so PostgREST over the anon
key sees nothing. The rows carry recipient addresses, which is exactly the kind
of list that must not be publishable.

Revision ID: 010
Revises: 009
Create Date: 2026-09-03
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "010"
down_revision = "009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "notification_deliveries",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("subject_id", sa.Text(), nullable=False),
        sa.Column("occasion", sa.Text(), nullable=False),
        sa.Column("notification_key", sa.Text(), nullable=False),
        sa.Column("recipient", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "subject_id",
            "occasion",
            name="notification_deliveries_subject_occasion_key",
        ),
    )
    # The read every run makes first: every rung already claimed for one
    # subject. The unique constraint above already indexes (subject_id,
    # occasion), and that index serves this lookup by prefix -- so there is
    # deliberately no second index here.

    op.execute(
        "alter table public.notification_deliveries enable row level security"
    )


def downgrade() -> None:
    op.drop_table("notification_deliveries")
