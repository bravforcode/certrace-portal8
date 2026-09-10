"""What the reminder job is allowed to chase.

PROJECT_STATUS.md R4: app/jobs/send_reminders.py ran green and sent nothing,
because it was wired to NullSource - everything needed to write the email lived
in one browser's localStorage. Three stores, in fact: the workspace holds the
month and the deadline, supplier-companies holds the address, month-dispatch
holds whether it has been asked at all.

This table is not a migration of that estate (that is D2, still open). It is
the one record the job needs, registered by the portal at the moment it sends:
who to chase, about what, by when, and where the link goes. Already written for
a reader - period_label is "March 2026", because a job that formatted a date
itself would have to know the recipient's language to do it.

answered_at and cancelled_at stop the chasing without deleting the row. "We
chased four times and they answered on the fifth" is what tells an exporter
whether a supplier is worth keeping, and it is gone forever if the row goes
with the answer.

Revision ID: 012
Revises: 011
Create Date: 2026-09-10
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "012"
down_revision = "011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "reminder_subjects",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("subject_key", sa.Text(), nullable=False),
        sa.Column("recipient", sa.Text(), nullable=False),
        sa.Column("supplier_name", sa.Text(), nullable=False),
        sa.Column("period_label", sa.Text(), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("link_url", sa.Text(), nullable=False),
        sa.Column("locale", sa.Text()),
        sa.Column(
            "account_locked",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column("sent_at", sa.DateTime(timezone=True)),
        sa.Column(
            "resend_count", sa.Integer(), nullable=False, server_default=sa.text("0")
        ),
        sa.Column("answered_at", sa.DateTime(timezone=True)),
        sa.Column("cancelled_at", sa.DateTime(timezone=True)),
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
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        # The portal's own id for the ask, stable across re-sends: registering
        # the same month twice must update the row, never mint a second one
        # that would chase the same supplier twice on the same day.
        sa.UniqueConstraint(
            "user_id", "subject_key", name="reminder_subjects_key_unique"
        ),
        sa.CheckConstraint(
            "resend_count >= 0", name="reminder_subjects_resend_positive"
        ),
        # The whole point of the row is that there is somewhere to write to.
        sa.CheckConstraint(
            "position('@' in recipient) > 1", name="reminder_subjects_recipient_shape"
        ),
    )
    # The job's only query: everything still open, oldest deadline first. A
    # partial index because answered and cancelled rows are history - they are
    # read when someone asks about a supplier, never by the nightly run.
    op.create_index(
        "reminder_subjects_open_idx",
        "reminder_subjects",
        ["due_date"],
        postgresql_where=sa.text(
            "answered_at is null and cancelled_at is null and sent_at is not null"
        ),
    )
    # Deny-by-default like every other table here - see revision 004.
    op.execute("alter table public.reminder_subjects enable row level security")
    op.execute(
        "create or replace trigger reminder_subjects_touch_updated_at "
        "before update on public.reminder_subjects "
        "for each row execute function public.touch_updated_at()"
    )


def downgrade() -> None:
    op.drop_index("reminder_subjects_open_idx", table_name="reminder_subjects")
    op.drop_table("reminder_subjects")
