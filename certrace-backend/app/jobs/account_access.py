"""Withdraw, restore or erase one account, and read what was done to it.

    python -m app.jobs.account_access --email a@b.co --suspend \
        --reason "invoice 2026-0412, 15 days past the §6.4 notice"
    python -m app.jobs.account_access --email a@b.co --restore
    python -m app.jobs.account_access --email a@b.co --history
    python -m app.jobs.account_access --account-id <uuid> --history
    python -m app.jobs.account_access --email a@b.co --anonymise --yes \
        --reason "terminated 2026-08-01, export window closed"
    python -m app.jobs.account_access --email a@b.co --suspend --reason x --dry-run

Every action writes a row to ``account_audit_events`` in the same transaction,
so ``--history`` answers "who did what to this account, and why" without
anyone having to remember. After an anonymisation there is no address left to
name the account by, which is what ``--account-id`` is for: the trail outlives
the identity, and has to stay reachable.

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

  · It does not email the customer. §20.4 wants notice "where reasonably
    practicable", and notice for non-payment belongs in the billing thread a
    human is already having, not in an automated message from the platform
    that just locked them out.
  · A suspension does not revoke supplier links row by row. They stop
    resolving while the owner is suspended and resume when the suspension is
    lifted -- see app/routers/links.py. An anonymisation does revoke them,
    because there is no relationship left to restore.
  · An anonymisation does not delete the exporter's declarations unless
    --purge-customer-data says so. Some of that is sealed evidence the
    customer may be legally required to keep (Terms §12.4), and only they can
    say whether they still need it.

── The one-way door ────────────────────────────────────────────
--anonymise cannot be undone: the address, the name and the company come out
of the row, every reset code and refresh token is deleted, and the account can
never be signed into again. It therefore refuses until the account has been
suspended for the thirty days Terms §9.5 gives the customer to export, unless
--force says otherwise, and it refuses without --yes.

── Exit codes ──────────────────────────────────────────────────
0  the account is now in the state asked for (or the history was printed)
1  the command could not run (no database configured, bad arguments)
2  no account for that address -- nothing was changed
3  the account is real but not in a state this action allows

The split matters when this is run from a script: 1 is "fix the invocation",
2 is "check the address", 3 is "the export window is still open, or it is
already anonymised", and none of them is "it worked".
"""

from __future__ import annotations

import argparse
import getpass
import logging
import sys

from app.config import DATABASE_URL_ENV, load_env_file_value
from app.services import auth_service

_LOGGER = logging.getLogger("certrace.account_access")

EXIT_OK = 0
EXIT_MISCONFIGURED = 1
EXIT_NO_SUCH_ACCOUNT = 2
# The account is real but not in a state this action allows -- an
# anonymisation inside the export window, or anything against an account
# already anonymised.
EXIT_NOT_ELIGIBLE = 3


def _default_actor() -> str:
    """Who to record when nobody says. The shell user is a weak claim, and it
    is still better than "unknown": it narrows a later question to one laptop."""

    try:
        return getpass.getuser()
    except Exception:  # pragma: no cover - getuser needs an environment
        return "unknown"


def _repository(database_url: str):
    # Imported here rather than at module scope, like the reminder job does:
    # the repository pulls in SQLAlchemy and the psycopg driver, and --help
    # should not need either installed.
    from app.repositories.database import DatabaseRepository

    return DatabaseRepository(database_url)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="python -m app.jobs.account_access",
        description=(
            "Suspend, restore or anonymise one customer account, or read its history."
        ),
    )
    subject = parser.add_mutually_exclusive_group(required=True)
    subject.add_argument(
        "--email",
        help="The account holder's address, as they registered it.",
    )
    subject.add_argument(
        "--account-id",
        help=(
            "The account's uuid. The only way to reach an anonymised account: "
            "its address is gone, and its audit trail is not."
        ),
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
    action.add_argument(
        "--anonymise",
        "--anonymize",
        dest="anonymise",
        action="store_true",
        help=(
            "Scrub the identity for good (Privacy §11.2). Needs --yes, and "
            "the export window to have closed."
        ),
    )
    action.add_argument(
        "--history",
        action="store_true",
        help="Print what has been done to this account, newest first.",
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
        "--actor",
        default=_default_actor(),
        help="Who is running this, for the audit record. Defaults to the shell user.",
    )
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Confirm an irreversible action. Required with --anonymise.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help=(
            "Waive the thirty-day export window (Terms §9.5). For the customer "
            "who asks to be erased now and has nothing left to export."
        ),
    )
    parser.add_argument(
        "--purge-customer-data",
        action="store_true",
        help=(
            "With --anonymise, also delete the declarations, supplier links "
            "and uploaded evidence. Some of it may be a record the customer "
            "is required to keep -- ask before using this."
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

    if args.anonymise and not args.yes:
        _LOGGER.error(
            "--anonymise is irreversible: the address, the name and the "
            "company come out of the row and cannot be put back. Add --yes "
            "when that is what you mean."
        )
        return EXIT_MISCONFIGURED

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
    subject_label = args.email or args.account_id
    account = (
        auth_service.find_account_by_email(db, args.email)
        if args.email
        else auth_service.get_account(db, args.account_id)
    )
    if account is None:
        _LOGGER.error("No account for %s. Nothing changed.", subject_label)
        return EXIT_NO_SUCH_ACCOUNT

    if args.history:
        events = auth_service.account_history(db, account.id)
        if not events:
            _LOGGER.info("Nothing recorded against %s (%s).", account.email, account.id)
            return EXIT_OK
        _LOGGER.info("History for %s (%s), newest first:", account.email, account.id)
        for event in events:
            _LOGGER.info(
                "  %s  %-10s by %s%s  %s",
                event.created_at.isoformat(timespec="seconds"),
                event.event,
                event.actor,
                f" -- {event.reason}" if event.reason else "",
                event.details or "",
            )
        return EXIT_OK

    if args.dry_run:
        target = (
            "SUSPENDED"
            if args.suspend
            else "ANONYMISED"
            if args.anonymise
            else "ACTIVE"
        )
        _LOGGER.info(
            "Would move %s (%s) from %s to %s.",
            account.email,
            account.id,
            account.status,
            target,
        )
        if args.anonymise and args.purge_customer_data:
            _LOGGER.info("Would also delete their declarations, links and evidence.")
        return EXIT_OK

    if args.anonymise:
        try:
            erased = auth_service.anonymise_account(
                db,
                account.id,
                actor=args.actor,
                reason=args.reason,
                purge_customer_data=args.purge_customer_data,
                force=args.force,
            )
        except auth_service.AccountNotEligible as error:
            _LOGGER.error("%s Nothing changed.", error)
            return EXIT_NOT_ELIGIBLE
        if erased is None:
            _LOGGER.error("No account for %s. Nothing changed.", subject_label)
            return EXIT_NO_SUCH_ACCOUNT
        _LOGGER.info(
            "Anonymised %s. Refresh tokens deleted: %d. Reset codes deleted: "
            "%d. Supplier links revoked: %d. Reminder subjects deleted: %d. "
            "Declarations deleted: %s",
            erased.account_id,
            erased.refresh_tokens_deleted,
            erased.reset_codes_deleted,
            erased.supplier_links_revoked,
            erased.reminder_subjects_deleted,
            "none (kept)"
            if erased.customer_data_purged is None
            else erased.customer_data_purged,
        )
        return EXIT_OK

    if args.suspend:
        try:
            result = auth_service.suspend_account(
                db, account.id, reason=args.reason, actor=args.actor
            )
        except auth_service.AccountNotEligible as error:
            _LOGGER.error("%s Nothing changed.", error)
            return EXIT_NOT_ELIGIBLE
        if result is None:
            # Deleted between the lookup and the write.
            _LOGGER.error("No account for %s. Nothing changed.", subject_label)
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

    try:
        restored = auth_service.restore_account(db, account.id, actor=args.actor)
    except auth_service.AccountNotEligible as error:
        _LOGGER.error("%s Nothing changed.", error)
        return EXIT_NOT_ELIGIBLE
    if restored is None:
        _LOGGER.error("No account for %s. Nothing changed.", subject_label)
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
