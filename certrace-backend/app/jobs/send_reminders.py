"""Send every reminder that is due today.

    python -m app.jobs.send_reminders --dry-run
    python -m app.jobs.send_reminders

── Why a command and not a thread in the API ───────────────────
The obvious alternative is a background loop inside the FastAPI process. It is
the wrong shape here for three reasons, in increasing order of how much they
cost:

  · It adds a dependency (APScheduler or similar) to a runtime list that is
    seven lines long and has stayed that way on purpose.
  · It fires once per PROCESS. The Procfile runs uvicorn; the day that becomes
    two workers behind a load balancer, every reminder doubles, and nothing in
    the code would have changed to tell you.
  · It cannot be run by hand. When a supplier says they never got the chase,
    the answer has to be reproducible on a laptop with --dry-run.

A command is idempotent (the delivery log sees to that), safe to run twice, and
schedulable by whatever the deployment already has -- cron, a Kubernetes
CronJob, GitHub Actions, Cloud Scheduler hitting a task runner.

── Cadence ─────────────────────────────────────────────────────
Once a day is right. The ladder in ``reminder_schedule`` is measured in whole
days, so a second run on the same day finds every rung already claimed and
sends nothing -- harmless, but it buys nothing either. Run it mid-morning in
the recipients' timezone rather than at 00:00 UTC, which is late evening in
Bangkok and reads as a machine sending at 3am.

    30 3 * * *   # 10:30 Asia/Bangkok

── Exit codes ──────────────────────────────────────────────────
0  the run finished, whether or not it had anything to send
1  the run could not start (bad configuration)
2  the run finished but at least one message was refused by the provider

The split matters for alerting: 1 is "fix the deployment", 2 is "look at
Resend". A single non-zero for both trains people to ignore it.
"""

from __future__ import annotations

import argparse
import logging
import sys
from datetime import date, datetime

from app.config import DATABASE_URL_ENV, load_env_file_value
from app.services import reminders
from app.services.email import transport_from_env

_LOGGER = logging.getLogger("certrace.reminders")

EXIT_OK = 0
EXIT_MISCONFIGURED = 1
EXIT_DELIVERY_FAILURES = 2


def _build_log(database_url: str | None) -> reminders.DeliveryLog:
    """The durable log when there is a database, an in-memory one otherwise."""

    if not database_url:
        return reminders.InMemoryDeliveryLog()

    # Imported here rather than at module scope: the repository pulls in
    # SQLAlchemy and the psycopg driver, and --dry-run against no database
    # should not need either installed.
    from app.repositories.database import DatabaseRepository
    from app.repositories.delivery_log import DatabaseDeliveryLog

    repository = DatabaseRepository(database_url)
    return DatabaseDeliveryLog(repository.session_factory)


def _source(database_url: str | None) -> reminders.ReminderSource:
    """Where the outstanding work comes from.

    With a database, the ``reminder_subjects`` the portal registers when it
    sends an ask (PROJECT_STATUS.md R4). That table is the adapter this
    docstring used to promise: the ladder, the claim and the copy were already
    done, and only the source was missing.

    Without one, still ``NullSource``: a run against no database has nothing to
    query, and it should say nothing rather than invent something. That is also
    what ``--dry-run`` on a laptop hits, which is the point of keeping it.

    Trial reminders stay empty either way - plans are not modelled server-side,
    and a trial date invented here would email people about an expiry the
    product does not enforce. See app/services/reminder_source.py.
    """

    if not database_url:
        return reminders.NullSource()

    # Imported here for the same reason as the delivery log below: --dry-run
    # against no database should not need SQLAlchemy installed.
    from app.repositories.database import DatabaseRepository
    from app.services.reminder_source import DatabaseReminderSource

    return DatabaseReminderSource(DatabaseRepository(database_url))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="python -m app.jobs.send_reminders",
        description="Send supplier and trial reminders that are due today.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Decide and report without claiming or sending anything.",
    )
    parser.add_argument(
        "--today",
        metavar="YYYY-MM-DD",
        help=(
            "Run as if it were this date. For rehearsing a ladder against "
            "real data; combine with --dry-run."
        ),
    )
    parser.add_argument(
        "--allow-unrecorded",
        action="store_true",
        help=(
            "Send even without a database-backed delivery log. Repeats every "
            "run, so this is for a one-shot, never for cron."
        ),
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

    if args.today:
        try:
            today = datetime.strptime(args.today, "%Y-%m-%d").date()
        except ValueError:
            _LOGGER.error("--today must be YYYY-MM-DD, got %r.", args.today)
            return EXIT_MISCONFIGURED
    else:
        today = date.today()

    try:
        transport = transport_from_env()
    except ValueError as error:
        # A misconfigured mailer is the common failure and it is silent
        # otherwise: the job would run, find work, and drop every message.
        _LOGGER.error("Email is not configured: %s", error)
        return EXIT_MISCONFIGURED

    # Read once: the log and the source must agree about whether there is a
    # database, or a run could find work in one and forget what it sent in the
    # other - which is how a supplier gets the same chase every night.
    database_url = load_env_file_value(DATABASE_URL_ENV)
    log = _build_log(database_url)

    try:
        summary = reminders.run(
            transport=transport,
            source=_source(database_url),
            log=log,
            today=today,
            logo_url=load_env_file_value("CERTRACE_EMAIL_LOGO_URL"),
            dry_run=args.dry_run,
            allow_unrecorded=args.allow_unrecorded,
        )
    except RuntimeError as error:
        _LOGGER.error("%s", error)
        return EXIT_MISCONFIGURED

    prefix = "would send" if args.dry_run else "sent"
    _LOGGER.info("Reminder run for %s: %s", today.isoformat(), summary)
    for occasion, recipient in summary.delivered:
        _LOGGER.info("  %s %s to %s", prefix, occasion, recipient)

    return EXIT_DELIVERY_FAILURES if summary.failed else EXIT_OK


if __name__ == "__main__":
    raise SystemExit(main())
