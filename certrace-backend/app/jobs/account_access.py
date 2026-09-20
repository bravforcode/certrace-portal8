"""Withdraw or restore one account's access to the platform.

    python -m app.jobs.account_access --email a@b.co --suspend \
        --reason "invoice 2026-0412, 15 days past the §6.4 notice"
    python -m app.jobs.account_access --email a@b.co --restore
    python -m app.jobs.account_access --email a@b.co --suspend --reason x --dry-run

── Why a command and not an endpoint ───────────────────────────
Because there is no one to authenticate. Suspension is a staff action, and
this server has exactly one kind of account -- a customer's. An endpoint would
need an admin role, an admin session, and an audit trail before it could be
called once, and the first two do not exist yet (see
certrace-portal/docs/ADMIN-CONSOLE-PLAN.md). A command run against the
production database by whoever already holds its credentials adds no new way
in, and reaches the same service functions the console will call when it is
built.

What it does NOT do, so nobody assumes otherwise:

  · It does not delete or anonymise anything. Privacy §11.2 gives a customer
    thirty days to export after termination, and that is a separate operation
    against a separate clock -- this one is reversible on purpose.
  · It does not email the customer. §20.4 wants notice "where reasonably
    practicable", and notice for non-payment belongs in the billing thread a
    human is already having, not in an automated message from the platform
    that just locked them out.
  · It does not revoke supplier links row by row. They stop resolving while
    the owner is suspended and resume when the suspension is lifted -- see
    app/routers/links.py.

── Exit codes ──────────────────────────────────────────────────
0  the account is now in the state asked for
1  the command could not run (no database configured, bad arguments)
2  no account for that address -- nothing was changed

The split matters when this is run from a script: 1 is "fix the invocation",
2 is "check the address", and neither is "it worked".
"""

from __future__ import annotations

import argparse
import logging
import sys

from app.config import DATABASE_URL_ENV, load_env_file_value
from app.services import auth_service

_LOGGER = logging.getLogger("certrace.account_access")

EXIT_OK = 0
EXIT_MISCONFIGURED = 1
EXIT_NO_SUCH_ACCOUNT = 2


def _repository(database_url: str):
    # Imported here rather than at module scope, like the reminder job does:
    # the repository pulls in SQLAlchemy and the psycopg driver, and --help
    # should not need either installed.
    from app.repositories.database import DatabaseRepository

    return DatabaseRepository(database_url)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="python -m app.jobs.account_access",
        description="Suspend or restore one customer account.",
    )
    parser.add_argument(
        "--email",
        required=True,
        help="The account holder's address, as they registered it.",
    )
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument(
        "--suspend",
        action="store_true",
        help="Withdraw access and burn every live refresh token.",
    )
    action.add_argument(
        "--restore",
        action="store_true",
        help="Put the account back in service (Terms §20.4).",
    )
    parser.add_argument(
        "--reason",
        help=(
            "Required with --suspend. Recorded on the account for a later "
            "dispute, never shown to the customer. Name the invoice or the "
            "report that prompted it."
        ),
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Report what would change without changing it.",
    )
    parser.add_argument(
        "--verbose", "-v", action="store_true", help="Log every decision."
    )
    args = parser.parse_args(argv)

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)s %(name)s: %(message)s",
        stream=sys.stderr,
    )

    if args.suspend and not (args.reason or "").strip():
        # A suspension with no recorded reason is the one this command exists
        # to prevent: six months on, nobody can say whether it was the unpaid
        # invoice or a mistake, and §6.4 is unarguable either way.
        _LOGGER.error("--suspend requires --reason. Say what prompted it.")
        return EXIT_MISCONFIGURED

    database_url = load_env_file_value(DATABASE_URL_ENV)
    if not database_url:
        # No fallback to the in-process store on purpose. That store holds two
        # demo accounts and dies with the process, so a "suspension" against it
        # would report success and change nothing anyone would ever see.
        _LOGGER.error(
            "%s is not set. Accounts live in PostgreSQL; there is nothing to "
            "suspend without it.",
            DATABASE_URL_ENV,
        )
        return EXIT_MISCONFIGURED

    db = _repository(database_url)
    account = auth_service.find_account_by_email(db, args.email)
    if account is None:
        _LOGGER.error("No account for %s. Nothing changed.", args.email)
        return EXIT_NO_SUCH_ACCOUNT

    if args.dry_run:
        target = "SUSPENDED" if args.suspend else "ACTIVE"
        _LOGGER.info(
            "Would move %s (%s) from %s to %s.",
            account.email,
            account.id,
            account.status,
            target,
        )
        return EXIT_OK

    if args.suspend:
        result = auth_service.suspend_account(db, account.id, reason=args.reason)
        if result is None:
            # Deleted between the lookup and the write.
            _LOGGER.error("No account for %s. Nothing changed.", args.email)
            return EXIT_NO_SUCH_ACCOUNT
        _LOGGER.info(
            "Suspended %s (%s). Refresh tokens burned: %d. Supplier links that "
            "stop resolving: %d. Reason recorded: %s",
            result.account.email,
            result.account.id,
            result.refresh_tokens_revoked,
            result.supplier_links_blocked,
            args.reason,
        )
        # The one gap worth stating out loud rather than discovering: an access
        # token already in a browser stays valid until it expires, because it
        # is signed rather than stored. current_account re-reads the account on
        # every request, so the gap is one call, not one hour -- but a page
        # already open does not go blank the instant this returns.
        _LOGGER.info(
            "Access tokens already issued stop working on their next call to the API."
        )
        return EXIT_OK

    restored = auth_service.restore_account(db, account.id)
    if restored is None:
        _LOGGER.error("No account for %s. Nothing changed.", args.email)
        return EXIT_NO_SUCH_ACCOUNT
    _LOGGER.info(
        "Restored %s (%s). They sign in again to get a session; their supplier "
        "links resolve as before.",
        restored.email,
        restored.id,
    )
    return EXIT_OK


if __name__ == "__main__":
    raise SystemExit(main())
