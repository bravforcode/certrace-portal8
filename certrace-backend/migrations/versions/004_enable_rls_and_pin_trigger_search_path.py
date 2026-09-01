"""Close the Data API off from the tables, and adopt the drifted trigger.

Supabase serves PostgREST over the public schema, reachable by anyone holding
the project's anon key -- a key that is publishable by design. With row level
security off, that key is a full read/write grant on every table here,
including the password hashes in ``users`` and the live codes in
``password_resets``. Nothing in this repo ships that key today, so this closes
an open door nobody has walked through yet rather than an active breach.

Enabling RLS with no policies denies every role that is subject to it. The API
connects as ``postgres``, which holds BYPASSRLS, so the backend is unaffected;
that is what makes deny-by-default the right shape here instead of writing
policies for an access path we do not use.

``touch_updated_at`` and its trigger already existed on the live database --
applied by hand from the original schema.sql and never recorded in a revision.
Recreating them here means a database built from migrations alone matches
production, and pins the function's search_path while we are at it.

Revision ID: 004
Revises: 003
Create Date: 2026-09-01
"""

from alembic import op

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None

_TABLES = (
    "alembic_version",
    "default_emission_factors",
    "declarations",
    "calculation_runs",
    "declaration_audit_events",
    "users",
    "password_resets",
)


def upgrade() -> None:
    for table in _TABLES:
        op.execute(f"alter table public.{table} enable row level security")

    # An unqualified search_path lets whoever calls the trigger decide which
    # schema `now()` resolves in. Pinning it to empty forces every name to be
    # resolved against pg_catalog, which is always searched first and cannot be
    # shadowed by a table owner's own schema.
    op.execute(
        """
        create or replace function public.touch_updated_at()
        returns trigger
        language plpgsql
        set search_path = ''
        as $$
        begin
            new.updated_at = pg_catalog.now();
            return new;
        end;
        $$
        """
    )
    op.execute(
        "create or replace trigger declarations_touch_updated_at "
        "before update on public.declarations "
        "for each row execute function public.touch_updated_at()"
    )


def downgrade() -> None:
    for table in _TABLES:
        op.execute(f"alter table public.{table} disable row level security")

    # Back to the definition that was live before this revision. The trigger is
    # left in place: it predates these migrations, so dropping it here would
    # remove something this revision did not introduce.
    op.execute(
        """
        create or replace function public.touch_updated_at()
        returns trigger
        language plpgsql
        as $$
        begin new.updated_at = now(); return new; end;
        $$
        """
    )
