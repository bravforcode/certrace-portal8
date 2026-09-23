"""Record who withdrew an account's access, and let an account be anonymised.

Two halves of the same promise. Revision 013 made suspension possible but left
it unattributable: ``suspension_reason`` says why, and nothing at all says who
did it or when it was lifted. A suspension nobody can attribute is the one
that loses a §6.4 dispute, so ``account_audit_events`` holds one row per staff
action, permanently.

What the audit table deliberately does NOT hold is an email address. It is the
record that has to survive anonymisation, and a log carrying the address we
just scrubbed out of ``users`` would hand the identity straight back. The
subject is the account's uuid, which points at a row whose identifying fields
are gone.

``user_id`` is ON DELETE SET NULL rather than CASCADE for the same reason
backwards: anonymisation keeps the row, but if anyone ever hard-deletes an
account, the fact that it was suspended in March and anonymised in September
must not vanish with it.

The third status, ANONYMISED, is where Privacy §11.2 lands: after the
thirty-day export window the identifying fields come out and the account can
never be signed into again. It is a one-way door, which is why it is a status
of its own rather than a flag on a suspended account -- nothing in the code
should be able to "restore" it by accident.

Revision ID: 016
Revises: 015
Create Date: 2026-09-20
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "016"
down_revision = "015"
branch_labels = None
depends_on = None

_STATUS_CHECK = (
    "(status = 'ACTIVE' AND suspended_at IS NULL AND anonymised_at IS NULL) "
    "OR (status = 'SUSPENDED' AND suspended_at IS NOT NULL "
    "AND anonymised_at IS NULL) "
    "OR (status = 'ANONYMISED' AND anonymised_at IS NOT NULL)"
)


def upgrade() -> None:
    op.add_column("users", sa.Column("anonymised_at", sa.DateTime(timezone=True)))
    op.drop_constraint("users_status_check", "users", type_="check")
    op.create_check_constraint("users_status_check", "users", _STATUS_CHECK)

    op.create_table(
        "account_audit_events",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("event", sa.Text(), nullable=False),
        # Who ran it. Free text because there are no staff accounts to point a
        # foreign key at yet -- the command fills it from the operator's shell
        # user, and an admin console will fill it with their account id.
        sa.Column("actor", sa.Text(), nullable=False),
        sa.Column("reason", sa.Text()),
        # Counts and flags for the action: refresh tokens burned, links
        # revoked, whether customer data was purged. Opaque here on purpose --
        # what is worth recording differs per event and will grow.
        sa.Column(
            "details",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint(
            "event in ('SUSPENDED', 'RESTORED', 'ANONYMISED')",
            name="account_audit_events_event_check",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index(
        "account_audit_events_user_id_created_at_idx",
        "account_audit_events",
        ["user_id", sa.text("created_at DESC")],
    )
    # Same deny-by-default posture as revision 004: the API connects as a role
    # holding BYPASSRLS, and nothing else should reach this table at all.
    op.execute("alter table public.account_audit_events enable row level security")


def downgrade() -> None:
    op.drop_index(
        "account_audit_events_user_id_created_at_idx",
        table_name="account_audit_events",
    )
    op.drop_table("account_audit_events")
    op.drop_constraint("users_status_check", "users", type_="check")
    op.create_check_constraint(
        "users_status_check",
        "users",
        "(status = 'ACTIVE' AND suspended_at IS NULL) "
        "OR (status = 'SUSPENDED' AND suspended_at IS NOT NULL)",
    )
    op.drop_column("users", "anonymised_at")
